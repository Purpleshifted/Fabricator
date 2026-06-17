/**
 * Project-level type definitions for FiletForge.
 * Encapsulates the full state of a pattern project including
 * style, measurements, gauge, grid data, and progress tracking.
 */

import type { GarmentStyle, BodyMeasurements, BodyFit, Size } from './garment';
import type { GridConfig, GarmentPiece } from './grid';

/**
 * Gauge configuration derived from user measurement or preset.
 */
export interface GaugeConfig {
  /** Horizontal mesh squares per inch */
  meshPerInchH: number;
  /** Vertical mesh squares per inch */
  meshPerInchV: number;
  /** Thread/yarn weight description (e.g., "Size 10 crochet thread") */
  threadWeight: string;
  /** Hook size in mm (e.g., 1.5) */
  hookSize: number;
  /** How the gauge was determined */
  source: 'preset' | 'swatch' | 'chain-measure';
}

/**
 * Grid data for a single garment piece, including cell values and undo history.
 */
export interface GridData {
  /** Grid configuration (dimensions, aspect ratio, stitch type) */
  config: GridConfig;
  /** Flat array of cell values (row-major order, use config.width to index) */
  cells: number[];
  /** Undo history: stack of previous cell states */
  undoStack: number[][];
  /** Redo history: stack of undone cell states */
  redoStack: number[][];
}

/**
 * Tracks the user's progress while crocheting the pattern.
 */
export interface ProgressState {
  /** Current row being worked */
  currentRow: number;
  /** Total number of rows in the current piece */
  totalRows: number;
  /** Names of completed garment pieces */
  completedPieces: string[];
}

/**
 * The top-level project that ties together all elements of a
 * filet crochet garment pattern.
 */
export interface Project {
  /** Unique project identifier */
  id: string;
  /** User-defined project name */
  name: string;
  /** ISO timestamp of creation */
  createdAt: string;
  /** ISO timestamp of last modification */
  updatedAt: string;
  /** Selected garment style options */
  style: GarmentStyle;
  /** Body measurements (inches) */
  measurements: BodyMeasurements;
  /** Body fit / ease category */
  fit: BodyFit;
  /** Standard size selection */
  size: Size;
  /** Gauge configuration */
  gauge: GaugeConfig;
  /** Generated garment pieces with outlines */
  pieces: GarmentPiece[];
  /** Grid data keyed by piece name */
  grids: Map<string, GridData>;
  /** Current wizard step (1 = measurements, 2 = design, 2.5 = pieces, 3 = chart) */
  currentStep: 1 | 2 | 2.5 | 3;
  /** Crochet progress tracking */
  progress: ProgressState;
}
