/**
 * Body measurement tables and gauge utilities for FiletForge.
 *
 * Based on Craft Yarn Council standard body measurements.
 * All raw measurements are in inches.
 */

import type { BodyMeasurements, Size, BodyFit, Unit } from '../types/garment';

/**
 * Standard body measurement table (Craft Yarn Council), indexed by Size.
 * All values in inches.
 */
export const SIZE_TABLE: Record<Size, BodyMeasurements> = {
  XS: {
    bust: 32,
    waist: 25,
    hip: 34,
    shoulderWidth: 12.5,
    armLength: 22.5,
    crossBack: 13.5,
    backWaistLength: 15.5,
    upperArm: 10,
    armholeDepth: 7,
    neckCircumference: 13.5,
  },
  S: {
    bust: 35,
    waist: 27.5,
    hip: 36.5,
    shoulderWidth: 13,
    armLength: 23,
    crossBack: 14,
    backWaistLength: 16,
    upperArm: 11,
    armholeDepth: 7.5,
    neckCircumference: 14,
  },
  M: {
    bust: 38,
    waist: 30,
    hip: 39,
    shoulderWidth: 13.5,
    armLength: 23.5,
    crossBack: 14.5,
    backWaistLength: 16.5,
    upperArm: 12,
    armholeDepth: 8,
    neckCircumference: 14.5,
  },
  L: {
    bust: 41,
    waist: 33,
    hip: 42,
    shoulderWidth: 14,
    armLength: 24,
    crossBack: 15,
    backWaistLength: 17,
    upperArm: 13,
    armholeDepth: 8.5,
    neckCircumference: 15,
  },
  XL: {
    bust: 44,
    waist: 36,
    hip: 45,
    shoulderWidth: 14.5,
    armLength: 24.5,
    crossBack: 15.5,
    backWaistLength: 17.5,
    upperArm: 14,
    armholeDepth: 9,
    neckCircumference: 15.5,
  },
};

/**
 * Ease values added to body measurements per fit category (inches).
 * Applied to circumference measurements (bust, hip); waist gets half.
 */
const EASE_TABLE: Record<BodyFit, number> = {
  fitted: 1,
  standard: 3,
  relaxed: 5,
  oversized: 7,
};

/**
 * Preset gauge configurations for common thread/hook combinations.
 */
export const GAUGE_PRESETS: Array<{
  name: string;
  threadWeight: string;
  hookSizeMm: number;
  meshPerInchH: number;
  meshPerInchV: number;
}> = [
  {
    name: 'Size 10 Thread / 1.5mm Hook',
    threadWeight: 'Size 10 crochet thread',
    hookSizeMm: 1.5,
    meshPerInchH: 5.5,
    meshPerInchV: 5.5,
  },
  {
    name: 'Size 10 Thread / 1.75mm Hook',
    threadWeight: 'Size 10 crochet thread',
    hookSizeMm: 1.75,
    meshPerInchH: 5,
    meshPerInchV: 5,
  },
  {
    name: 'Size 20 Thread / 1.25mm Hook',
    threadWeight: 'Size 20 crochet thread',
    hookSizeMm: 1.25,
    meshPerInchH: 7,
    meshPerInchV: 7,
  },
  {
    name: 'Size 3 Thread / 2.0mm Hook',
    threadWeight: 'Size 3 crochet thread',
    hookSizeMm: 2.0,
    meshPerInchH: 4,
    meshPerInchV: 4,
  },
  {
    name: 'Fingering Weight / 2.75mm Hook',
    threadWeight: 'Fingering weight yarn',
    hookSizeMm: 2.75,
    meshPerInchH: 3.5,
    meshPerInchV: 3.5,
  },
  {
    name: 'Sport Weight / 3.5mm Hook',
    threadWeight: 'Sport weight yarn',
    hookSizeMm: 3.5,
    meshPerInchH: 3,
    meshPerInchV: 3,
  },
];

/**
 * Get standard body measurements for a given size.
 *
 * @param size - Standard size (XS through XL)
 * @returns Body measurements in inches
 */
export function getMeasurements(size: Size): BodyMeasurements {
  return { ...SIZE_TABLE[size] };
}

/**
 * Apply ease to body measurements based on fit category.
 *
 * Ease is added to circumference measurements (bust, hip, upperArm).
 * Waist receives half the ease. Other measurements remain unchanged.
 *
 * @param measurements - Raw body measurements
 * @param fit - Desired fit category
 * @returns New measurements with ease applied
 */
export function applyEase(
  measurements: BodyMeasurements,
  fit: BodyFit,
): BodyMeasurements {
  const ease = EASE_TABLE[fit];
  const halfEase = ease / 2;

  return {
    ...measurements,
    bust: measurements.bust + ease,
    waist: measurements.waist + halfEase,
    hip: measurements.hip + ease,
    upperArm: measurements.upperArm + ease,
  };
}

/**
 * Convert a measurement value between inches and centimeters.
 *
 * @param value - The numeric value to convert
 * @param from - Source unit
 * @param to - Target unit
 * @returns Converted value (rounded to 2 decimal places)
 */
export function convertUnit(value: number, from: Unit, to: Unit): number {
  if (from === to) return value;

  const CM_PER_INCH = 2.54;

  if (from === 'inch' && to === 'cm') {
    return Math.round(value * CM_PER_INCH * 100) / 100;
  }
  // cm → inch
  return Math.round((value / CM_PER_INCH) * 100) / 100;
}

/**
 * Calculate horizontal gauge (mesh per inch) from a chain measurement.
 *
 * The user crochets a sample chain of N stitches and measures
 * the resulting length. Since each filet mesh square = 3 chain stitches,
 * we derive mesh squares per inch.
 *
 * @param chainCount - Number of chain stitches crocheted
 * @param measuredLengthInches - Measured length of the chain in inches
 * @returns Object with calculated meshPerInchH
 */
export function gaugeFromChainLength(
  chainCount: number,
  measuredLengthInches: number,
): { meshPerInchH: number } {
  if (chainCount <= 0 || measuredLengthInches <= 0) {
    throw new Error('Chain count and measured length must be positive numbers');
  }

  // Each mesh square uses 3 chain stitches
  const CHAINS_PER_MESH = 3;
  const meshCount = chainCount / CHAINS_PER_MESH;
  const meshPerInch = meshCount / measuredLengthInches;

  return {
    meshPerInchH: Math.round(meshPerInch * 100) / 100,
  };
}
