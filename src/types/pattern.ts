/**
 * PatternPiece types — data contract between garment design and crochet pipeline.
 *
 * These types represent the extracted geometry from FreeSewing's pattern
 * drafting engine in a pipeline-friendly format. Point2D arrays define closed
 * polygons sampled from curves; CurvePath preserves the original Bézier data
 * for high-fidelity SVG rendering.
 */

/** A 2D point in mm coordinates */
export interface Point2D {
  x: number;
  y: number;
}

/** A dart: a triangular fold with a tip and two leg endpoints */
export interface DartLine {
  tip: Point2D;
  legs: [Point2D, Point2D];
}

/** A segment of a path — either a straight line or a cubic Bézier curve */
export interface CurvePath {
  /** 'line' = 2 points (start, end); 'curve' = 4 points (start, cp1, cp2, end) */
  type: 'line' | 'curve';
  points: Point2D[];
}

/** Status of a single pattern piece in the workflow */
export type PieceStatus = 'ready' | 'editing' | 'done';

/**
 * A single pattern piece extracted from FreeSewing's drafted pattern.
 * Contains both sampled outline points (for rasterization) and original
 * Bézier curve data (for SVG rendering).
 */
export interface PatternPiece {
  /** Unique identifier: 'front', 'back', 'sleeveLeft', 'sleeveRight' */
  id: string;
  /** Human-readable name: 'Front Bodice', 'Back Bodice', etc. */
  name: string;
  /** Closed polygon — sampled points walking the seam path */
  outline: Point2D[];
  /** Original Bézier curves from the seam path */
  curves: CurvePath[];
  /** Darts found within this piece */
  darts: DartLine[];
  /** Notch (balance mark) positions */
  notches: Point2D[];
  /** Grain line direction as [start, end] */
  grainLine: [Point2D, Point2D];
  /** Piece width in mm (bounding box) */
  widthMm: number;
  /** Piece height in mm (bounding box) */
  heightMm: number;
  /** Axis-aligned bounding box in mm */
  boundingBox: { x: number; y: number; w: number; h: number };
  /** Workflow status of this piece */
  status: PieceStatus;
  /** Grid width in mesh squares (computed from gauge) */
  gridWidth?: number;
  /** Grid height in mesh squares (computed from gauge) */
  gridHeight?: number;
}

/**
 * The complete output of a pattern generation run.
 * Includes all pieces, the full SVG string, and the measurements used.
 */
export interface PatternSet {
  /** All extracted pattern pieces */
  pieces: PatternPiece[];
  /** Full SVG string rendered by FreeSewing */
  svgString: string;
  /** The FreeSewing-format measurements that were used */
  measurements: Record<string, number>;
}
