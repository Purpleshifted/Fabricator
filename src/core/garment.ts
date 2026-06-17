/**
 * Garment outline generation for FiletForge.
 *
 * Generates SVG path strings representing garment piece outlines
 * based on style selections and body measurements.
 *
 * Coordinate system: 1 unit = 1 inch. Origin (0,0) is at the
 * bottom-left of the piece. The SVG viewBox handles scaling.
 */

import type {
  GarmentStyle,
  BodyMeasurements,
  BodyFit,
  NecklineType,
  GarmentLength,
} from '../types/garment';
import { applyEase } from './measurements';

/**
 * Result of garment outline generation.
 */
export interface GarmentOutline {
  /** SVG path `d` attribute for the front piece */
  front: string;
  /** SVG path `d` attribute for the back piece */
  back: string;
  /** SVG path `d` attributes for sleeve pieces (if not sleeveless) */
  sleeves?: string[];
}

/**
 * Garment length multipliers relative to backWaistLength.
 * These adjust the body height from shoulder to hem.
 */
const LENGTH_MULTIPLIERS: Record<GarmentLength, number> = {
  crop: 0.75,
  waist: 1.0,
  hip: 1.3,
  tunic: 1.55,
};

/**
 * Generate complete garment piece outlines as SVG paths.
 *
 * @param style - Selected garment style options
 * @param measurements - Raw body measurements (inches)
 * @param fit - Body fit category for ease calculation
 * @returns Object with SVG path strings for front, back, and optional sleeves
 */
export function generateGarmentOutline(
  style: GarmentStyle,
  measurements: BodyMeasurements,
  fit: BodyFit,
): GarmentOutline {
  const eased = applyEase(measurements, fit);

  // Half-body width (each pattern piece is half the circumference)
  const halfWidth = eased.bust / 2;
  const bodyHeight =
    measurements.backWaistLength * LENGTH_MULTIPLIERS[style.garmentLength];
  const armholeDepth = measurements.armholeDepth;
  const shoulderWidth = measurements.shoulderWidth / 2; // half for one piece
  const armholeWidth = (halfWidth - shoulderWidth) / 2;
  const neckWidth = measurements.neckCircumference / Math.PI;
  const halfNeckWidth = neckWidth / 2;

  // Front piece — neckline is deeper
  const frontNeckDepth = style.neckline === 'boat' ? 0.75 : 2.5;
  const frontPath = buildBodyPath(
    halfWidth,
    bodyHeight,
    armholeDepth,
    armholeWidth,
    shoulderWidth,
    halfNeckWidth,
    frontNeckDepth,
    style.neckline,
  );

  // Back piece — neckline is shallower
  const backNeckDepth = style.neckline === 'boat' ? 0.5 : 1.0;
  const backPath = buildBodyPath(
    halfWidth,
    bodyHeight,
    armholeDepth,
    armholeWidth,
    shoulderWidth,
    halfNeckWidth,
    backNeckDepth,
    'crew', // back always uses crew-style shallow curve
  );

  const result: GarmentOutline = { front: frontPath, back: backPath };

  // Generate sleeves if not sleeveless
  if (style.sleeve !== 'sleeveless') {
    const sleevePath = generateSleevePath(style, measurements, eased);
    result.sleeves = [sleevePath, sleevePath]; // mirror for left/right
  }

  return result;
}

/**
 * Build the SVG path for a body piece (front or back).
 *
 * The path starts at the bottom-left and goes clockwise:
 * bottom-left → bottom-right → right side up → right armhole →
 * right shoulder → neckline → left shoulder → left armhole →
 * left side down → close.
 *
 * @param width - Half body width
 * @param height - Full body height
 * @param armholeDepth - Depth of armhole curve
 * @param armholeWidth - Width of armhole cutout
 * @param shoulderWidth - Half shoulder width
 * @param halfNeckWidth - Half neckline width
 * @param neckDepth - Depth of neckline dip
 * @param necklineType - Type of neckline curve
 * @returns SVG path `d` attribute string
 */
function buildBodyPath(
  width: number,
  height: number,
  armholeDepth: number,
  armholeWidth: number,
  shoulderWidth: number,
  halfNeckWidth: number,
  neckDepth: number,
  necklineType: NecklineType,
): string {
  const r = (n: number) => Math.round(n * 100) / 100;

  // Key Y coordinates (bottom = 0, top = height)
  const armholeTop = height; // shoulder line
  const armholeBottom = height - armholeDepth;

  // Key X coordinates (left = 0, right = width)
  const rightArmholeInner = width - armholeWidth;
  const leftArmholeInner = armholeWidth;

  // Shoulder points
  const rightShoulderOuter = width;
  const leftShoulderOuter = 0;

  // Neck points
  const centerX = width / 2;
  const neckLeft = centerX - halfNeckWidth;
  const neckRight = centerX + halfNeckWidth;

  // Build path
  const parts: string[] = [];

  // Start at bottom-left
  parts.push(`M 0 0`);

  // Bottom edge → bottom-right
  parts.push(`L ${r(width)} 0`);

  // Right side up to armhole start
  parts.push(`L ${r(width)} ${r(armholeBottom)}`);

  // Right armhole curve (cubic Bezier going inward and up)
  parts.push(
    `C ${r(rightShoulderOuter)} ${r(armholeBottom + armholeDepth * 0.6)} ` +
      `${r(rightArmholeInner + armholeWidth * 0.3)} ${r(armholeTop)} ` +
      `${r(neckRight)} ${r(armholeTop)}`,
  );

  // Neckline
  const necklineSegment = generateNecklinePath(
    necklineType,
    halfNeckWidth * 2,
    neckDepth,
    neckRight,
    neckLeft,
    armholeTop,
  );
  parts.push(necklineSegment);

  // Left armhole curve (cubic Bezier going down and outward)
  parts.push(
    `C ${r(leftArmholeInner - armholeWidth * 0.3)} ${r(armholeTop)} ` +
      `${r(leftShoulderOuter)} ${r(armholeBottom + armholeDepth * 0.6)} ` +
      `${r(leftShoulderOuter)} ${r(armholeBottom)}`,
  );

  // Left side down to bottom-left
  parts.push(`L 0 0`);

  // Close path
  parts.push('Z');

  return parts.join(' ');
}

/**
 * Generate the SVG path segment for a neckline.
 *
 * Draws from the right neck point to the left neck point
 * with the appropriate curve shape.
 *
 * @param type - Neckline type
 * @param width - Full neckline width
 * @param depth - Neckline depth (how far it dips below shoulder)
 * @param rightX - X coordinate of right neck point
 * @param leftX - X coordinate of left neck point
 * @param topY - Y coordinate of shoulder line
 * @returns SVG path segment string
 */
export function generateNecklinePath(
  type: NecklineType,
  width: number,
  depth: number,
  rightX: number,
  leftX: number,
  topY: number,
): string {
  const r = (n: number) => Math.round(n * 100) / 100;
  const centerX = (rightX + leftX) / 2;
  const bottomY = topY - depth;

  switch (type) {
    case 'crew': {
      // Semicircular arc
      const rx = width / 2;
      const ry = depth;
      // SVG arc: A rx ry x-rotation large-arc-flag sweep-flag x y
      return `A ${r(rx)} ${r(ry)} 0 0 1 ${r(leftX)} ${r(topY)}`;
    }

    case 'v-neck': {
      // Two straight lines meeting at center bottom
      return `L ${r(centerX)} ${r(bottomY)} L ${r(leftX)} ${r(topY)}`;
    }

    case 'scoop': {
      // Deep elliptical arc
      const rx = width / 2;
      const ry = depth;
      return `A ${r(rx)} ${r(ry)} 0 0 1 ${r(leftX)} ${r(topY)}`;
    }

    case 'boat': {
      // Nearly straight, wide line with slight curve
      return (
        `Q ${r(centerX)} ${r(topY - depth)} ` + `${r(leftX)} ${r(topY)}`
      );
    }

    case 'square': {
      // Three straight lines forming a rectangular notch
      return (
        `L ${r(rightX)} ${r(bottomY)} ` +
        `L ${r(leftX)} ${r(bottomY)} ` +
        `L ${r(leftX)} ${r(topY)}`
      );
    }

    case 'mock': {
      // Crew base + small vertical collar extension (0.75 inch)
      const collarHeight = 0.75;
      const rx = width / 2;
      const ry = depth;
      return (
        `L ${r(rightX)} ${r(topY + collarHeight)} ` +
        `A ${r(rx)} ${r(ry)} 0 0 1 ${r(leftX)} ${r(topY + collarHeight)} ` +
        `L ${r(leftX)} ${r(topY)}`
      );
    }

    case 'turtle': {
      // Crew base + taller vertical collar extension (2 inches)
      const collarHeight = 2;
      const rx = width / 2;
      const ry = depth;
      return (
        `L ${r(rightX)} ${r(topY + collarHeight)} ` +
        `A ${r(rx)} ${r(ry)} 0 0 1 ${r(leftX)} ${r(topY + collarHeight)} ` +
        `L ${r(leftX)} ${r(topY)}`
      );
    }

    default:
      return `L ${r(leftX)} ${r(topY)}`;
  }
}

/**
 * Generate a standalone armhole curve path.
 *
 * Creates a cubic Bezier curve from the shoulder point down to the underarm.
 * Useful for rendering armhole shaping independently.
 *
 * @param depth - Armhole depth in inches
 * @param width - Armhole width (horizontal extent) in inches
 * @returns SVG path `d` attribute string for the armhole curve
 */
export function generateArmholePath(depth: number, width: number): string {
  const r = (n: number) => Math.round(n * 100) / 100;

  // Shoulder point at top-left, underarm at bottom-right
  return (
    `M 0 0 ` +
    `C ${r(width * 0.1)} ${r(depth * 0.4)} ` +
    `${r(width * 0.7)} ${r(depth * 0.9)} ` +
    `${r(width)} ${r(depth)}`
  );
}

/**
 * Generate the SVG path for a sleeve piece.
 *
 * @param style - Garment style selections
 * @param rawMeasurements - Raw body measurements
 * @param easedMeasurements - Measurements with ease applied
 * @returns SVG path `d` attribute string for the sleeve
 */
function generateSleevePath(
  style: GarmentStyle,
  rawMeasurements: BodyMeasurements,
  easedMeasurements: BodyMeasurements,
): string {
  const r = (n: number) => Math.round(n * 100) / 100;

  const capHeight = rawMeasurements.armholeDepth * 0.75;
  const upperArmWidth = easedMeasurements.upperArm / 2; // half circumference, one side

  // Sleeve length based on sleeve type
  let sleeveLength: number;
  switch (style.sleeve) {
    case 'cap':
      sleeveLength = 3;
      break;
    case 'short':
      sleeveLength = rawMeasurements.armLength * 0.35;
      break;
    case 'three-quarter':
      sleeveLength = rawMeasurements.armLength * 0.75;
      break;
    case 'long':
      sleeveLength = rawMeasurements.armLength;
      break;
    default:
      sleeveLength = 0;
  }

  // Wrist/cuff width narrows from upper arm
  let cuffWidth: number;
  switch (style.sleeveFit) {
    case 'fitted':
      cuffWidth = upperArmWidth * 0.7;
      break;
    case 'standard':
      cuffWidth = upperArmWidth * 0.85;
      break;
    case 'bell':
      cuffWidth = upperArmWidth * 1.3;
      break;
    case 'puff':
      cuffWidth = upperArmWidth * 0.8;
      break;
    default:
      cuffWidth = upperArmWidth * 0.85;
  }

  // Build sleeve path (origin at bottom-left of cuff)
  const totalHeight = sleeveLength + capHeight;

  // Bottom edge (cuff)
  const parts: string[] = [];
  parts.push(`M 0 0`);
  parts.push(`L ${r(cuffWidth * 2)} 0`);

  // Right side tapering to upper arm width
  parts.push(`L ${r(upperArmWidth * 2)} ${r(sleeveLength)}`);

  // Sleeve cap curve
  parts.push(
    `C ${r(upperArmWidth * 2)} ${r(sleeveLength + capHeight * 0.5)} ` +
      `${r(upperArmWidth)} ${r(totalHeight)} ` +
      `${r(upperArmWidth)} ${r(totalHeight)}`,
  );
  parts.push(
    `C ${r(upperArmWidth)} ${r(totalHeight)} ` +
      `0 ${r(sleeveLength + capHeight * 0.5)} ` +
      `0 ${r(sleeveLength)}`,
  );

  // Left side back down to cuff
  parts.push(`L 0 0`);
  parts.push('Z');

  return parts.join(' ');
}
