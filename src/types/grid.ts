/**
 * Grid type definitions for filet crochet chart representation.
 * Maps crochet stitch types to numeric cell values for efficient storage.
 */

/**
 * Cell type constants representing the different filet crochet mesh types.
 * Uses numeric values for efficient storage in typed arrays.
 *
 * Defined as a const object (not an enum) for compatibility with
 * TypeScript's `erasableSyntaxOnly` mode.
 */
export const CellType = {
  /** Cell is outside the garment boundary */
  OUTSIDE: -1,
  /** Open mesh: ch 2, skip 2, dc — creates a hole */
  OPEN: 0,
  /** Filled mesh: 3 dc — creates a solid block */
  FILLED: 1,
  /** Lacet: decorative X-shaped mesh */
  LACET: 2,
  /** Partial fill: half-filled mesh for detail */
  PARTIAL: 3,
  /** Bar: elongated horizontal bar mesh */
  BAR: 4,
} as const;

/** Union type of all CellType values */
export type CellType = (typeof CellType)[keyof typeof CellType];

/**
 * Configuration for a filet crochet grid/chart.
 */
export interface GridConfig {
  /** Number of mesh columns */
  width: number;
  /** Number of mesh rows */
  height: number;
  /**
   * Aspect ratio of a single cell (height / width).
   * Default 1.5 for double crochet (dc) height:width ratio.
   */
  cellAspectRatio: number;
  /** Base stitch type used in the mesh */
  stitchType: 'dc' | 'edc' | 'hdc';
}

/** Default grid configuration */
export const DEFAULT_GRID_CONFIG: GridConfig = {
  width: 0,
  height: 0,
  cellAspectRatio: 1.5,
  stitchType: 'dc',
};

/**
 * A 2D point coordinate.
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Represents a single piece of a garment (front, back, sleeve, etc.)
 * with its outline path and grid mask.
 */
export interface GarmentPiece {
  /** Human-readable name (e.g., "Front", "Back", "Left Sleeve") */
  name: string;
  /** SVG path `d` attribute string defining the piece outline */
  path: string;
  /** Boolean mask: true = inside the piece, false = outside */
  gridMask: boolean[][];
}
