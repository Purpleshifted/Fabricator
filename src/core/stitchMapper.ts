/**
 * Stitch mapping for filet crochet chart cells.
 *
 * Maps CellType values to real-world crochet stitch definitions,
 * handles brightness-level-to-stitch mapping, and generates
 * human-readable row instructions.
 */

import { CellType } from '../types/grid';

/**
 * Definition of a filet crochet stitch type.
 */
export interface StitchDefinition {
  /** Full stitch name */
  name: string;
  /** Standard abbreviation */
  abbreviation: string;
  /** Chart symbol character */
  symbol: string;
  /** Written instruction for the stitch */
  description: string;
  /** Number of underlying stitches this mesh square represents */
  stitchCount: number;
}

/** CellType values that represent actual stitches (excludes OUTSIDE) */
type StitchCellType = Exclude<CellType, typeof CellType.OUTSIDE>;

/**
 * Stitch definitions keyed by CellType.
 * Maps each grid cell type to its crochet instructions.
 */
export const STITCH_DEFINITIONS: Record<StitchCellType, StitchDefinition> = {
  [CellType.OPEN]: {
    name: 'Open Mesh',
    abbreviation: 'sp',
    symbol: '□',
    description: 'Ch 2, skip 2 sts, dc in next st',
    stitchCount: 3,
  },
  [CellType.FILLED]: {
    name: 'Filled Mesh',
    abbreviation: 'bl',
    symbol: '■',
    description: '3 dc (or 2 dc + 1 shared dc)',
    stitchCount: 3,
  },
  [CellType.LACET]: {
    name: 'Lacet',
    abbreviation: 'lac',
    symbol: '◇',
    description: 'Ch 3, sc in center of previous row, ch 3',
    stitchCount: 7,
  },
  [CellType.PARTIAL]: {
    name: 'Partial Fill',
    abbreviation: 'pf',
    symbol: '▤',
    description: '1 dc, ch 1, skip 1, dc',
    stitchCount: 3,
  },
  [CellType.BAR]: {
    name: 'Bar',
    abbreviation: 'bar',
    symbol: '═',
    description: 'Ch 5, skip 5, dc',
    stitchCount: 6,
  },
};

/**
 * Map a brightness level (0 = lightest, totalLevels-1 = darkest)
 * to the appropriate CellType for filet crochet.
 *
 * Level mapping by total levels:
 * - 2 levels: 0→OPEN, 1→FILLED
 * - 3 levels: 0→OPEN, 1→LACET, 2→FILLED
 * - 4 levels: 0→OPEN, 1→LACET, 2→PARTIAL, 3→FILLED
 * - 5 levels: 0→OPEN, 1→LACET, 2→PARTIAL, 3→BAR, 4→FILLED
 *
 * @param brightnessLevel - Level index (0 = lightest)
 * @param totalLevels - Total number of quantization levels (2–5)
 * @returns Corresponding CellType
 */
export function getStitchForLevel(
  brightnessLevel: number,
  totalLevels: number,
): CellType {
  // Clamp inputs
  const levels = Math.max(2, Math.min(5, totalLevels));
  const level = Math.max(0, Math.min(levels - 1, brightnessLevel));

  const mappings: Record<number, CellType[]> = {
    2: [CellType.OPEN, CellType.FILLED],
    3: [CellType.OPEN, CellType.LACET, CellType.FILLED],
    4: [CellType.OPEN, CellType.LACET, CellType.PARTIAL, CellType.FILLED],
    5: [
      CellType.OPEN,
      CellType.LACET,
      CellType.PARTIAL,
      CellType.BAR,
      CellType.FILLED,
    ],
  };

  return mappings[levels][level];
}

/**
 * Generate a human-readable text instruction for a single row of the chart.
 *
 * Groups consecutive identical stitches and formats them as
 * run-length encoded instructions. Respects reading direction
 * (right-to-left for odd rows in filet crochet).
 *
 * @param row - Array of CellType values for the row
 * @param rowNumber - 1-based row number for display
 * @param isRightToLeft - Whether the row is worked right to left
 * @returns Formatted row instruction string
 */
export function generateRowText(
  row: CellType[],
  rowNumber: number,
  isRightToLeft: boolean,
): string {
  // Work through cells in the correct direction
  const cells = isRightToLeft ? [...row].reverse() : row;
  const direction = isRightToLeft ? '←' : '→';

  const groups: Array<{ abbr: string; count: number }> = [];
  let totalStitches = 0;

  for (const cell of cells) {
    // Skip OUTSIDE cells
    if (cell === CellType.OUTSIDE) continue;

    const def =
      STITCH_DEFINITIONS[cell as StitchCellType];
    if (!def) continue;

    totalStitches += def.stitchCount;

    // Extend current group or start new one
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.abbr === def.abbreviation) {
      lastGroup.count++;
    } else {
      groups.push({ abbr: def.abbreviation, count: 1 });
    }
  }

  // Format groups
  const instruction = groups
    .map((g) => (g.count === 1 ? g.abbr : `${g.count} ${g.abbr}`))
    .join(', ');

  return `Row ${rowNumber} ${direction}: ${instruction} (${totalStitches} sts)`;
}

/**
 * Calculate the number of foundation chain stitches needed for a given grid width.
 *
 * Formula: (gridWidth × 3) + 1 + turning chain (3 for dc)
 * - Each mesh square requires 3 chains
 * - +1 for the final dc post
 * - +3 for the turning chain (counts as first dc of first row)
 *
 * @param gridWidth - Number of mesh columns
 * @returns Total foundation chain count
 */
export function calculateFoundationChain(gridWidth: number): number {
  const chainsForMesh = gridWidth * 3;
  const finalPost = 1;
  const turningChain = 3;

  return chainsForMesh + finalPost + turningChain;
}
