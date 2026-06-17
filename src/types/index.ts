/* ==========================================================================
   FiletForge — Shared Type Re-exports + UI-specific additions
   ========================================================================== */

// Re-export existing project types
export type {
  NecklineType,
  SleeveType,
  SleeveConstruction,
  SleeveFit,
  BodyFit,
  BodyShape,
  GarmentLength,
  ShoulderLine,
  HemlineType,
  Size,
  Unit,
  BodyMeasurements,
  GarmentStyle,
} from './garment.ts';

export { DEFAULT_STYLE } from './garment.ts';

export type { GaugeConfig } from './project.ts';

export type { GridConfig, GarmentPiece } from './grid.ts';

// ---- Standard size chart (in inches, matching BodyMeasurements) ----
import type { Size, BodyMeasurements } from './garment.ts';

export const STANDARD_SIZES: Record<Size, BodyMeasurements> = {
  XS: {
    bust: 31.5, waist: 25.2, hip: 34.6,
    shoulderWidth: 14.2, armLength: 21.3, crossBack: 13.0,
    backWaistLength: 15.5, upperArm: 10.2, armholeDepth: 7.0,
    neckCircumference: 13.4,
  },
  S: {
    bust: 33.9, waist: 27.6, hip: 37.0,
    shoulderWidth: 15.0, armLength: 22.0, crossBack: 13.8,
    backWaistLength: 16.0, upperArm: 11.0, armholeDepth: 7.5,
    neckCircumference: 13.8,
  },
  M: {
    bust: 36.2, waist: 29.9, hip: 39.4,
    shoulderWidth: 15.7, armLength: 22.8, crossBack: 14.6,
    backWaistLength: 16.5, upperArm: 11.8, armholeDepth: 8.0,
    neckCircumference: 14.6,
  },
  L: {
    bust: 39.4, waist: 33.1, hip: 42.5,
    shoulderWidth: 16.5, armLength: 23.2, crossBack: 15.4,
    backWaistLength: 17.0, upperArm: 13.0, armholeDepth: 8.5,
    neckCircumference: 15.4,
  },
  XL: {
    bust: 43.3, waist: 37.0, hip: 46.5,
    shoulderWidth: 17.3, armLength: 23.6, crossBack: 16.2,
    backWaistLength: 17.5, upperArm: 14.2, armholeDepth: 9.0,
    neckCircumference: 16.1,
  },
};

// ---- Ease values per fit (inches added to body measurements) ----
import type { BodyFit } from './garment.ts';

export const EASE_VALUES: Record<BodyFit, number> = {
  fitted: 1,
  standard: 2.5,
  relaxed: 5,
  oversized: 8,
};

// ---- Gauge Presets ----
export interface GaugePreset {
  name: string;
  threadWeight: string;
  hookSize: number; // mm
  meshPerInchH: number;
  meshPerInchV: number;
}

export const GAUGE_PRESETS: GaugePreset[] = [
  { name: 'Size 10 thread + 1.5mm hook', threadWeight: 'Size 10 crochet thread', hookSize: 1.5, meshPerInchH: 8.0, meshPerInchV: 8.0 },
  { name: 'Size 10 thread + 1.75mm hook', threadWeight: 'Size 10 crochet thread', hookSize: 1.75, meshPerInchH: 7.0, meshPerInchV: 7.0 },
  { name: 'Size 20 thread + 1.25mm hook', threadWeight: 'Size 20 crochet thread', hookSize: 1.25, meshPerInchH: 10.0, meshPerInchV: 10.0 },
  { name: 'Size 30 thread + 1.0mm hook', threadWeight: 'Size 30 crochet thread', hookSize: 1.0, meshPerInchH: 12.5, meshPerInchV: 12.5 },
  { name: 'DK yarn + 4.0mm hook', threadWeight: 'DK weight yarn', hookSize: 4.0, meshPerInchH: 4.0, meshPerInchV: 4.0 },
  { name: 'Worsted yarn + 5.0mm hook', threadWeight: 'Worsted weight yarn', hookSize: 5.0, meshPerInchH: 3.3, meshPerInchV: 3.3 },
];
