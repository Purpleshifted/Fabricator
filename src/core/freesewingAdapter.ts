/**
 * FreeSewing adapter — bridges our app's data types to FreeSewing's Brian block.
 *
 * The Brian block is FreeSewing's basic bodice pattern (front, back, sleeve).
 * This adapter:
 *   1. Converts our BodyMeasurements (inches) → FreeSewing measurements (mm)
 *   2. Maps our GarmentStyle → FreeSewing Brian options
 *   3. Drafts the pattern and extracts PatternPiece geometry
 *   4. Returns the SVG string for preview rendering
 *
 * FreeSewing v4 API:
 *   - `Brian` is a constructor from `new Design({parts: [back, front, sleeve]})`
 *   - Instantiate: `new Brian({ measurements, options })`
 *   - Draft: `pattern.draft()` — mutates pattern, populates `pattern.parts[0]`
 *   - Render SVG: `pattern.render()` — returns SVG string
 *   - Parts are at `pattern.parts[0][partName]` (index 0 = first settings set)
 *   - Each part has `.paths.seam` (the outline) and `.points` (construction points)
 *   - Path ops: `{ type: 'move'|'line'|'curve'|'close', to?, cp1?, cp2? }`
 */

// @ts-expect-error — FreeSewing ships plain JS with no type declarations
import { Brian } from '@freesewing/brian';
import type { BodyMeasurements, GarmentStyle, Size } from '../types/garment';
import type {
  PatternPiece,
  PatternSet,
  Point2D,
  CurvePath,
} from '../types/pattern';
import { SIZE_TABLE } from './measurements';

/* ────────────────────────────────────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────────────────────────────────────── */

const INCHES_TO_MM = 25.4;

/** Default shoulder slope in degrees (FreeSewing expects this in degrees) */
const DEFAULT_SHOULDER_SLOPE_DEG = 13;

/** Default waist-to-hips distance in inches */
const DEFAULT_WAIST_TO_HIPS_IN = 8;

/** Number of sample points per curve segment for outline polygon */
const CURVE_SAMPLE_POINTS = 8;

/** Human-readable names for Brian part IDs */
const PART_NAMES: Record<string, { id: string; name: string }> = {
  'brian.front': { id: 'front', name: 'Front Bodice' },
  'brian.back': { id: 'back', name: 'Back Bodice' },
  'sleeve': { id: 'sleeve', name: 'Sleeve' },
};

/* ────────────────────────────────────────────────────────────────────────────
   1. Measurement Conversion
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Convert our app's BodyMeasurements (inches) to FreeSewing measurement names (mm).
 *
 * FreeSewing's Brian requires:
 *   biceps, chest, hpsToBust, hpsToWaistBack, neck, shoulderToShoulder,
 *   shoulderSlope, waistToArmpit, waistToHips
 *
 * Optional: highBust, shoulderToWrist (for sleeve length)
 */
export function convertToFreeSewingMeasurements(
  m: BodyMeasurements,
): Record<string, number> {
  const toMm = (inches: number) => inches * INCHES_TO_MM;

  // Derived values
  const hpsToBust = m.backWaistLength * 0.6; // bust point is ~60% down from HPS
  const waistToArmpit = m.backWaistLength - m.armholeDepth;

  return {
    // Direct mappings (name change + unit conversion)
    chest: toMm(m.bust),
    neck: toMm(m.neckCircumference),
    shoulderToShoulder: toMm(m.shoulderWidth),
    hpsToWaistBack: toMm(m.backWaistLength),
    biceps: toMm(m.upperArm),
    shoulderToWrist: toMm(m.armLength),

    // Derived measurements
    hpsToBust: toMm(hpsToBust),
    waistToArmpit: toMm(waistToArmpit),

    // Defaults for measurements we don't collect directly
    shoulderSlope: DEFAULT_SHOULDER_SLOPE_DEG,
    waistToHips: toMm(DEFAULT_WAIST_TO_HIPS_IN),
  };
}

/* ────────────────────────────────────────────────────────────────────────────
   2. Style → Options Mapping
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Map our GarmentStyle + sliders to FreeSewing Brian options.
 *
 * Brian options are percentage-based (0–1 internally, pct in config).
 * Key options:
 *   - chestEase (pct): fitted ~5%, standard ~15%, relaxed ~25%, oversized ~35%
 *   - s3Collar (pct): shoulder seam shift for neckline depth (-1 to 1)
 *   - lengthBonus (pct): extend below hips
 *   - sleeveLength (pct): 0–1 for none-to-full
 */
export function mapStyleToOptions(
  style: GarmentStyle,
  ease: number,
  necklineDepth: number,
  _necklineWidth: number,
  _sleeveWidth: number,
): Record<string, number | boolean> {
  const options: Record<string, number | boolean> = {};

  // Body fit → chest ease (percentage, stored as 0-1)
  const fitEaseMap: Record<string, number> = {
    fitted: 0.05,
    standard: 0.15,
    relaxed: 0.25,
    oversized: 0.35,
  };
  options.chestEase = fitEaseMap[style.bodyFit] ?? 0.15;

  // Override with custom ease if provided (ease is in inches, convert to fraction of chest)
  // A rough conversion: ease inches / ~38 inch average chest ≈ fraction
  if (ease > 0) {
    options.chestEase = ease / 38;
  }

  // Neckline depth → s3Collar (shift shoulder seam, range -1 to 1)
  // Our necklineDepth is 0–1 (shallow → deep)
  // s3Collar > 0 shifts front neckline deeper
  options.s3Collar = (necklineDepth - 0.5) * 2 * 0.6; // Scale to ±0.6 range

  // Garment length → lengthBonus
  const lengthBonusMap: Record<string, number> = {
    crop: -0.04,
    waist: 0.0,
    hip: 0.25,
    tunic: 0.55,
  };
  options.lengthBonus = lengthBonusMap[style.garmentLength] ?? 0.0;

  // Sleeve length → sleeveLength option
  const sleeveLengthMap: Record<string, number> = {
    sleeveless: 0.0,
    cap: 0.15,
    short: 0.35,
    'three-quarter': 0.65,
    long: 1.0,
  };
  options.sleeveLength = sleeveLengthMap[style.sleeve] ?? 0.5;

  return options;
}

/* ────────────────────────────────────────────────────────────────────────────
   3. Pattern Generation (main entry point)
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Generate a complete pattern set using FreeSewing's Brian block.
 *
 * @param size - Standard size to look up base measurements
 * @param style - The garment style configuration
 * @param customMeasurements - Optional overrides for standard measurements
 * @param ease - Ease in inches
 * @param necklineDepth - 0–1 normalized depth
 * @param necklineWidth - 0–1 normalized width
 * @param sleeveWidth - 0–1 normalized width
 * @returns PatternSet with pieces, SVG string, and measurements used
 */
export function generatePattern(
  size: Size,
  style: GarmentStyle,
  customMeasurements: Partial<BodyMeasurements> | null,
  ease: number,
  necklineDepth: number,
  necklineWidth: number,
  sleeveWidth: number,
): PatternSet {
  // 1. Build body measurements (start with standard, apply overrides)
  const baseMeasurements = { ...SIZE_TABLE[size] };
  if (customMeasurements) {
    Object.assign(baseMeasurements, customMeasurements);
  }

  // 2. Convert to FreeSewing format (mm)
  const fsMeasurements = convertToFreeSewingMeasurements(baseMeasurements);

  // 3. Map style to FreeSewing options
  const fsOptions = mapStyleToOptions(
    style,
    ease,
    necklineDepth,
    necklineWidth,
    sleeveWidth,
  );

  // 4. Create and draft pattern
  // Brian is a constructor: new Brian({measurements, options})
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pattern: any;
  let svgString = '';
  let pieces: PatternPiece[] = [];

  try {
    pattern = new Brian({
      measurements: fsMeasurements,
      options: fsOptions,
      // Embed mode: no physical width/height attributes (just viewBox)
      embed: true,
      // Include all detail elements
      complete: true,
    });

    pattern.draft();
    svgString = pattern.render();
    pieces = extractPiecesFromPattern(pattern);
  } catch (err) {
    console.error('[FreeSewing] Pattern drafting failed:', err);
    // Return empty set — the UI will show a fallback
    return {
      pieces: [],
      svgString: '',
      measurements: fsMeasurements,
    };
  }

  return {
    pieces,
    svgString,
    measurements: fsMeasurements,
  };
}

/* ────────────────────────────────────────────────────────────────────────────
   4. Piece Extraction
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Extract PatternPiece[] from a drafted FreeSewing pattern.
 *
 * Iterates `pattern.parts[0]` (the first settings set), looking for parts
 * that have a `paths.seam` path. Converts the seam path ops into our
 * Point2D[] outline and CurvePath[] curves.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractPiecesFromPattern(pattern: any): PatternPiece[] {
  const pieces: PatternPiece[] = [];

  // pattern.parts is an array of sets; we use set 0
  const partsSet = pattern.parts?.[0];
  if (!partsSet) return pieces;

  for (const [partName, part] of Object.entries(partsSet)) {
    // Skip hidden base parts
    const meta = PART_NAMES[partName];
    if (!meta) continue;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const partObj = part as any;
    const seamPath = partObj?.paths?.seam;
    if (!seamPath?.ops?.length) continue;

    // Extract outline points and curves from seam path ops
    const { outline, curves } = extractPathGeometry(seamPath.ops);

    // Calculate bounding box
    const bbox = computeBoundingBox(outline);

    // Extract notches from snippets
    const notches = extractNotches(partObj);

    // Build grain line from center vertical
    const grainLine = buildGrainLine(bbox);

    pieces.push({
      id: meta.id,
      name: meta.name,
      outline,
      curves,
      darts: [], // Brian doesn't produce dart paths in its seam
      notches,
      grainLine,
      widthMm: bbox.w,
      heightMm: bbox.h,
      boundingBox: bbox,
      status: 'ready',
    });
  }

  return pieces;
}

/* ────────────────────────────────────────────────────────────────────────────
   Internal Helpers
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Extract Point2D outline and CurvePath array from a FreeSewing path's ops.
 *
 * Path ops look like:
 *   { type: 'move', to: Point }
 *   { type: 'line', to: Point }
 *   { type: 'curve', cp1: Point, cp2: Point, to: Point }
 *   { type: 'close' }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractPathGeometry(ops: any[]): {
  outline: Point2D[];
  curves: CurvePath[];
} {
  const outline: Point2D[] = [];
  const curves: CurvePath[] = [];
  let current: Point2D | null = null;

  for (const op of ops) {
    switch (op.type) {
      case 'move':
        current = pt(op.to);
        outline.push(current);
        break;

      case 'line':
        if (current) {
          curves.push({
            type: 'line',
            points: [current, pt(op.to)],
          });
        }
        current = pt(op.to);
        outline.push(current);
        break;

      case 'curve': {
        const start = current ?? { x: 0, y: 0 };
        const cp1 = pt(op.cp1);
        const cp2 = pt(op.cp2);
        const end = pt(op.to);

        curves.push({
          type: 'curve',
          points: [start, cp1, cp2, end],
        });

        // Sample the cubic Bézier for the outline polygon
        for (let i = 1; i <= CURVE_SAMPLE_POINTS; i++) {
          const t = i / CURVE_SAMPLE_POINTS;
          outline.push(sampleCubicBezier(start, cp1, cp2, end, t));
        }

        current = end;
        break;
      }

      case 'close':
        // Close back to the first point
        if (outline.length > 0) {
          outline.push({ ...outline[0] });
        }
        break;
    }
  }

  return { outline, curves };
}

/** Convert a FreeSewing Point {x, y} to our Point2D */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pt(fsPoint: any): Point2D {
  return { x: fsPoint.x, y: fsPoint.y };
}

/** Sample a point on a cubic Bézier curve at parameter t ∈ [0, 1] */
function sampleCubicBezier(
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  t: number,
): Point2D {
  const u = 1 - t;
  const uu = u * u;
  const uuu = uu * u;
  const tt = t * t;
  const ttt = tt * t;

  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
  };
}

/** Compute axis-aligned bounding box from a set of points */
function computeBoundingBox(
  points: Point2D[],
): { x: number; y: number; w: number; h: number } {
  if (points.length === 0) return { x: 0, y: 0, w: 0, h: 0 };

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  return {
    x: minX,
    y: minY,
    w: maxX - minX,
    h: maxY - minY,
  };
}

/** Extract notch positions from a part's snippets (FreeSewing stores notches as snippets) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractNotches(part: any): Point2D[] {
  const notches: Point2D[] = [];
  if (!part?.snippets) return notches;

  for (const [, snippet] of Object.entries(part.snippets)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = snippet as any;
    if (
      s?.def === 'notch' ||
      s?.def === 'bnotch' ||
      s?.def === 'snot' // Front notch variant
    ) {
      if (s.anchor) {
        notches.push(pt(s.anchor));
      }
    }
  }

  return notches;
}

/** Build a vertical grain line through the center of the bounding box */
function buildGrainLine(
  bbox: { x: number; y: number; w: number; h: number },
): [Point2D, Point2D] {
  const cx = bbox.x + bbox.w / 2;
  const topMargin = bbox.h * 0.1;
  const bottomMargin = bbox.h * 0.1;

  return [
    { x: cx, y: bbox.y + topMargin },
    { x: cx, y: bbox.y + bbox.h - bottomMargin },
  ];
}
