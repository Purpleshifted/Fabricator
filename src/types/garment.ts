/**
 * Garment type definitions for FiletForge filet crochet pattern generator.
 * Covers neckline, sleeve, body, and measurement configurations.
 */

/** Neckline shape options */
export type NecklineType = 'crew' | 'v-neck' | 'scoop' | 'boat' | 'mock' | 'turtle' | 'square';

/** Sleeve length options */
export type SleeveType = 'sleeveless' | 'cap' | 'short' | 'three-quarter' | 'long';

/** How the sleeve is constructed and attached to the body */
export type SleeveConstruction = 'set-in' | 'raglan' | 'dolman' | 'drop-shoulder';

/** Sleeve silhouette/fit */
export type SleeveFit = 'fitted' | 'standard' | 'bell' | 'puff';

/** Body ease/fit category */
export type BodyFit = 'fitted' | 'standard' | 'relaxed' | 'oversized';

/** Body silhouette shape */
export type BodyShape = 'straight' | 'a-line' | 'cropped';

/** Overall garment length measured from shoulder */
export type GarmentLength = 'crop' | 'waist' | 'hip' | 'tunic';

/** Shoulder line placement */
export type ShoulderLine = 'natural' | 'extended' | 'dropped';

/** Hemline style */
export type HemlineType = 'straight' | 'curved';

/** Standard sizing */
export type Size = 'XS' | 'S' | 'M' | 'L' | 'XL';

/** Measurement unit system */
export type Unit = 'cm' | 'inch';

/**
 * Body measurements used for pattern generation.
 * All values are in inches.
 */
export interface BodyMeasurements {
  /** Full bust circumference */
  bust: number;
  /** Natural waist circumference */
  waist: number;
  /** Full hip circumference */
  hip: number;
  /** Shoulder width (across back, seam to seam) */
  shoulderWidth: number;
  /** Arm length from shoulder point to wrist */
  armLength: number;
  /** Cross-back width between armholes */
  crossBack: number;
  /** Back waist length from nape to natural waist */
  backWaistLength: number;
  /** Upper arm circumference at bicep */
  upperArm: number;
  /** Armhole depth from shoulder to underarm */
  armholeDepth: number;
  /** Neck circumference at base */
  neckCircumference: number;
}

/**
 * Complete garment style selections combining all design choices.
 */
export interface GarmentStyle {
  neckline: NecklineType;
  sleeve: SleeveType;
  sleeveConstruction: SleeveConstruction;
  sleeveFit: SleeveFit;
  bodyFit: BodyFit;
  bodyShape: BodyShape;
  garmentLength: GarmentLength;
  shoulderLine: ShoulderLine;
  hemline: HemlineType;
}

/**
 * Default garment style: a sleeveless crew-neck tank top.
 */
export const DEFAULT_STYLE: GarmentStyle = {
  neckline: 'crew',
  sleeve: 'sleeveless',
  sleeveConstruction: 'set-in',
  sleeveFit: 'standard',
  bodyFit: 'standard',
  bodyShape: 'straight',
  garmentLength: 'waist',
  shoulderLine: 'natural',
  hemline: 'straight',
};
