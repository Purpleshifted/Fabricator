/**
 * Grid data model and operations for filet crochet charts.
 *
 * Uses flat Uint8Array storage for efficient cell access.
 * Note: CellType.OUTSIDE is -1, which maps to 255 in Uint8Array.
 * Use the OUTSIDE_UINT8 constant when comparing raw array values.
 */

import { CellType } from '../types/grid';

/**
 * Uint8Array representation of CellType.OUTSIDE (-1 wraps to 255).
 */
export const OUTSIDE_UINT8 = 255;

/**
 * Create a new grid initialized with a default cell type.
 *
 * @param width - Number of columns
 * @param height - Number of rows
 * @param defaultCell - Default cell type (default: OPEN)
 * @returns Flat Uint8Array of size width × height
 */
export function createGrid(
  width: number,
  height: number,
  defaultCell: CellType = CellType.OPEN,
): Uint8Array {
  const size = width * height;
  const grid = new Uint8Array(size);

  if (defaultCell === CellType.OUTSIDE) {
    // -1 maps to 255 in Uint8Array
    grid.fill(OUTSIDE_UINT8);
  } else if (defaultCell !== CellType.OPEN) {
    // OPEN = 0, which is the default fill value
    grid.fill(defaultCell);
  }

  return grid;
}

/**
 * Get the cell type at a given column and row.
 *
 * @param grid - Flat grid array
 * @param width - Grid width (columns)
 * @param col - Column index (0-based)
 * @param row - Row index (0-based)
 * @returns CellType value at the position
 */
export function getCell(
  grid: Uint8Array,
  width: number,
  col: number,
  row: number,
): CellType {
  const val = grid[row * width + col];
  // Map 255 back to OUTSIDE (-1)
  return val === OUTSIDE_UINT8 ? CellType.OUTSIDE : (val as CellType);
}

/**
 * Set the cell type at a given column and row. Mutates the grid in place.
 *
 * @param grid - Flat grid array
 * @param width - Grid width (columns)
 * @param col - Column index (0-based)
 * @param row - Row index (0-based)
 * @param value - CellType to set
 */
export function setCell(
  grid: Uint8Array,
  width: number,
  col: number,
  row: number,
  value: CellType,
): void {
  grid[row * width + col] =
    value === CellType.OUTSIDE ? OUTSIDE_UINT8 : value;
}

/**
 * Toggle a cell between OPEN and FILLED.
 * Only operates on cells that are OPEN or FILLED; other types are unchanged.
 *
 * @param grid - Flat grid array (mutated in place)
 * @param width - Grid width (columns)
 * @param col - Column index (0-based)
 * @param row - Row index (0-based)
 */
export function toggleCell(
  grid: Uint8Array,
  width: number,
  col: number,
  row: number,
): void {
  const current = getCell(grid, width, col, row);
  if (current === CellType.OPEN) {
    setCell(grid, width, col, row, CellType.FILLED);
  } else if (current === CellType.FILLED) {
    setCell(grid, width, col, row, CellType.OPEN);
  }
}

/**
 * BFS flood fill starting from a cell position.
 * Returns a new grid with the filled region.
 *
 * @param grid - Source grid (not mutated)
 * @param width - Grid width
 * @param height - Grid height
 * @param col - Start column
 * @param row - Start row
 * @param newValue - Cell type to fill with
 * @returns New Uint8Array with the flood fill applied
 */
export function floodFill(
  grid: Uint8Array,
  width: number,
  height: number,
  col: number,
  row: number,
  newValue: CellType,
): Uint8Array {
  const result = new Uint8Array(grid);
  const targetValue = getCell(grid, width, col, row);

  // Compute uint8 representations for raw array comparison
  const newUint8 =
    (newValue as number) === CellType.OUTSIDE ? OUTSIDE_UINT8 : (newValue as number);
  const targetUint8 =
    (targetValue as number) === CellType.OUTSIDE ? OUTSIDE_UINT8 : (targetValue as number);

  // If target is the same as newValue, or is OUTSIDE, no-op
  if (targetValue === newValue || targetValue === CellType.OUTSIDE) {
    return result;
  }

  const queue: Array<[number, number]> = [[col, row]];
  const visited = new Uint8Array(width * height);

  while (queue.length > 0) {
    const [c, r] = queue.shift()!;
    const idx = r * width + c;

    if (
      c < 0 ||
      c >= width ||
      r < 0 ||
      r >= height ||
      visited[idx] ||
      result[idx] !== targetUint8
    ) {
      continue;
    }

    visited[idx] = 1;
    result[idx] = newUint8;

    // Enqueue 4-connected neighbors
    queue.push([c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]);
  }

  return result;
}

/**
 * Apply a boolean mask to the grid, marking cells outside the mask as OUTSIDE.
 * Mutates the grid in place.
 *
 * @param grid - Flat grid array (mutated)
 * @param width - Grid width
 * @param height - Grid height
 * @param mask - 2D boolean array [row][col]. true = inside, false = outside.
 */
export function applyMask(
  grid: Uint8Array,
  width: number,
  height: number,
  mask: boolean[][],
): void {
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (!mask[r]?.[c]) {
        setCell(grid, width, c, r, CellType.OUTSIDE);
      }
    }
  }
}

/**
 * Convert image data to a grid by downsampling and posterizing.
 *
 * @param imageData - Source ImageData from canvas
 * @param targetWidth - Desired grid width in cells
 * @param targetHeight - Desired grid height in cells
 * @param levels - Number of posterization levels (2-5)
 * @returns Uint8Array grid of CellType values
 */
export function gridFromImageData(
  imageData: ImageData,
  targetWidth: number,
  targetHeight: number,
  levels: number,
): Uint8Array {
  const grid = createGrid(targetWidth, targetHeight);
  const { width: imgW, height: imgH, data } = imageData;

  const scaleX = imgW / targetWidth;
  const scaleY = imgH / targetHeight;

  // Import the stitch mapper's level-to-CellType mapping
  // Inline the mapping to avoid circular dependency
  const levelToCellType = (level: number, totalLevels: number): CellType => {
    if (totalLevels <= 2) {
      return level === 0 ? CellType.OPEN : CellType.FILLED;
    }
    if (totalLevels === 3) {
      const map = [CellType.OPEN, CellType.LACET, CellType.FILLED];
      return map[level] ?? CellType.OPEN;
    }
    if (totalLevels === 4) {
      const map = [
        CellType.OPEN,
        CellType.LACET,
        CellType.PARTIAL,
        CellType.FILLED,
      ];
      return map[level] ?? CellType.OPEN;
    }
    // 5 levels
    const map = [
      CellType.OPEN,
      CellType.LACET,
      CellType.PARTIAL,
      CellType.BAR,
      CellType.FILLED,
    ];
    return map[level] ?? CellType.OPEN;
  };

  for (let r = 0; r < targetHeight; r++) {
    for (let c = 0; c < targetWidth; c++) {
      // Sample the center pixel of the source region
      const srcX = Math.floor(c * scaleX + scaleX / 2);
      const srcY = Math.floor(r * scaleY + scaleY / 2);
      const pixelIndex = (srcY * imgW + srcX) * 4;

      // Compute brightness (grayscale, Rec.709)
      const red = data[pixelIndex];
      const green = data[pixelIndex + 1];
      const blue = data[pixelIndex + 2];
      const brightness = 0.2126 * red + 0.7152 * green + 0.0722 * blue;

      // Quantize to level
      const normalizedBrightness = brightness / 255;
      const level = Math.min(
        Math.floor(normalizedBrightness * levels),
        levels - 1,
      );

      const cellType = levelToCellType(level, levels);
      setCell(grid, targetWidth, c, r, cellType);
    }
  }

  return grid;
}

/**
 * Count the number of cells of each CellType in the grid.
 *
 * @param grid - Flat grid array
 * @returns Record mapping each CellType to its count
 */
export function countByType(grid: Uint8Array): Record<CellType, number> {
  const counts: Record<number, number> = {
    [CellType.OUTSIDE]: 0,
    [CellType.OPEN]: 0,
    [CellType.FILLED]: 0,
    [CellType.LACET]: 0,
    [CellType.PARTIAL]: 0,
    [CellType.BAR]: 0,
  };

  for (let i = 0; i < grid.length; i++) {
    const val = grid[i] === OUTSIDE_UINT8 ? CellType.OUTSIDE : grid[i];
    if (val in counts) {
      counts[val]++;
    }
  }

  return counts as Record<CellType, number>;
}

/**
 * Generate a human-readable text instruction for a single row.
 *
 * @param grid - Flat grid array
 * @param width - Grid width
 * @param row - Row index (0-based)
 * @returns Text instruction string for the row
 */
export function getRowInstruction(
  grid: Uint8Array,
  width: number,
  row: number,
): string {
  const cellNames: Record<number, string> = {
    [CellType.OPEN]: 'sp',
    [CellType.FILLED]: 'bl',
    [CellType.LACET]: 'lac',
    [CellType.PARTIAL]: 'pf',
    [CellType.BAR]: 'bar',
  };

  const parts: string[] = [];
  let currentType: CellType | null = null;
  let currentCount = 0;

  for (let c = 0; c < width; c++) {
    const cell = getCell(grid, width, c, row);

    // Skip OUTSIDE cells
    if (cell === CellType.OUTSIDE) continue;

    if (cell === currentType) {
      currentCount++;
    } else {
      if (currentType !== null && currentCount > 0) {
        const name = cellNames[currentType] ?? '?';
        parts.push(`${currentCount} ${name}`);
      }
      currentType = cell;
      currentCount = 1;
    }
  }

  // Flush last group
  if (currentType !== null && currentCount > 0) {
    const name = cellNames[currentType] ?? '?';
    parts.push(`${currentCount} ${name}`);
  }

  return `Row ${row + 1}: ${parts.join(', ')}`;
}
