/**
 * Image processing pipeline for FiletForge.
 *
 * Converts user-uploaded images into filet crochet charts
 * by applying grayscale conversion, contrast/brightness adjustments,
 * posterization, and downsampling — all via the Canvas API.
 */

import { CellType } from '../types/grid';

/**
 * Options for the full image processing pipeline.
 */
export interface ProcessImageOptions {
  /** Target grid width in mesh cells */
  targetWidth: number;
  /** Target grid height in mesh cells */
  targetHeight: number;
  /** Contrast adjustment, -100 to +100 (0 = no change) */
  contrast: number;
  /** Brightness adjustment, -100 to +100 (0 = no change) */
  brightness: number;
  /** Number of posterization levels (2–5) */
  posterizeLevels: number;
}

/**
 * Load an image from a URL string or File object.
 *
 * @param src - Image source: URL string or File/Blob
 * @returns Promise resolving to the loaded HTMLImageElement
 */
export function loadImage(src: string | File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // Revoke object URL if we created one
      if (src instanceof File) {
        URL.revokeObjectURL(img.src);
      }
      resolve(img);
    };

    img.onerror = (_event) => {
      if (src instanceof File) {
        URL.revokeObjectURL(img.src);
      }
      reject(new Error('Failed to load image'));
    };

    img.src = src instanceof File ? URL.createObjectURL(src) : src;
  });
}

/**
 * Convert image data to grayscale using Rec. 709 luminance weights.
 *
 * @param imageData - Source ImageData (not mutated)
 * @returns New grayscale ImageData
 */
export function toGrayscale(imageData: ImageData): ImageData {
  const { width, height, data } = imageData;
  const result = new ImageData(width, height);
  const out = result.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray =
      0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    out[i] = gray;
    out[i + 1] = gray;
    out[i + 2] = gray;
    out[i + 3] = data[i + 3]; // preserve alpha
  }

  return result;
}

/**
 * Adjust the contrast of image data.
 *
 * @param imageData - Source ImageData (not mutated)
 * @param factor - Contrast factor from -100 (flat gray) to +100 (max contrast)
 * @returns New ImageData with contrast adjusted
 */
export function adjustContrast(
  imageData: ImageData,
  factor: number,
): ImageData {
  const { width, height, data } = imageData;
  const result = new ImageData(width, height);
  const out = result.data;

  // Convert -100..+100 range to a multiplier
  const f = (259 * (factor + 255)) / (255 * (259 - factor));

  for (let i = 0; i < data.length; i += 4) {
    out[i] = clamp(f * (data[i] - 128) + 128);
    out[i + 1] = clamp(f * (data[i + 1] - 128) + 128);
    out[i + 2] = clamp(f * (data[i + 2] - 128) + 128);
    out[i + 3] = data[i + 3];
  }

  return result;
}

/**
 * Adjust the brightness of image data.
 *
 * @param imageData - Source ImageData (not mutated)
 * @param factor - Brightness offset from -100 to +100
 * @returns New ImageData with brightness adjusted
 */
export function adjustBrightness(
  imageData: ImageData,
  factor: number,
): ImageData {
  const { width, height, data } = imageData;
  const result = new ImageData(width, height);
  const out = result.data;

  // Map -100..+100 to -255..+255 pixel offset
  const offset = (factor / 100) * 255;

  for (let i = 0; i < data.length; i += 4) {
    out[i] = clamp(data[i] + offset);
    out[i + 1] = clamp(data[i + 1] + offset);
    out[i + 2] = clamp(data[i + 2] + offset);
    out[i + 3] = data[i + 3];
  }

  return result;
}

/**
 * Posterize image data by quantizing pixel values to N discrete levels.
 *
 * @param imageData - Source ImageData (not mutated)
 * @param levels - Number of output levels (2–5)
 * @returns New ImageData with posterized values
 */
export function posterize(imageData: ImageData, levels: number): ImageData {
  const { width, height, data } = imageData;
  const result = new ImageData(width, height);
  const out = result.data;

  const clampedLevels = Math.max(2, Math.min(5, levels));
  const step = 255 / clampedLevels;

  for (let i = 0; i < data.length; i += 4) {
    out[i] = quantize(data[i], clampedLevels, step);
    out[i + 1] = quantize(data[i + 1], clampedLevels, step);
    out[i + 2] = quantize(data[i + 2], clampedLevels, step);
    out[i + 3] = data[i + 3];
  }

  return result;
}

/**
 * Downsample an image or canvas element to target dimensions
 * using an offscreen canvas.
 *
 * @param image - Source image or canvas element
 * @param targetWidth - Desired width in pixels
 * @param targetHeight - Desired height in pixels
 * @returns ImageData at the target dimensions
 */
export function downsample(
  image: HTMLImageElement | HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number,
): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D canvas context for downsampling');
  }

  // Use smooth interpolation for better downsampling quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

  return ctx.getImageData(0, 0, targetWidth, targetHeight);
}

/**
 * Full image processing pipeline: grayscale → brightness → contrast → downsample → posterize.
 *
 * @param image - Source HTMLImageElement
 * @param options - Processing parameters
 * @returns Processed ImageData at target dimensions
 */
export function processImage(
  image: HTMLImageElement,
  options: ProcessImageOptions,
): ImageData {
  const { targetWidth, targetHeight, contrast, brightness, posterizeLevels } =
    options;

  // Step 1: Get full-resolution image data via canvas
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = image.naturalWidth;
  srcCanvas.height = image.naturalHeight;
  const srcCtx = srcCanvas.getContext('2d');
  if (!srcCtx) {
    throw new Error('Failed to get 2D canvas context');
  }
  srcCtx.drawImage(image, 0, 0);
  let data = srcCtx.getImageData(0, 0, image.naturalWidth, image.naturalHeight);

  // Step 2: Convert to grayscale
  data = toGrayscale(data);

  // Step 3: Adjust brightness
  if (brightness !== 0) {
    data = adjustBrightness(data, brightness);
  }

  // Step 4: Adjust contrast
  if (contrast !== 0) {
    data = adjustContrast(data, contrast);
  }

  // Step 5: Downsample to target dimensions
  // Write adjusted data back to canvas, then downsample
  const adjCanvas = document.createElement('canvas');
  adjCanvas.width = data.width;
  adjCanvas.height = data.height;
  const adjCtx = adjCanvas.getContext('2d');
  if (!adjCtx) {
    throw new Error('Failed to get 2D canvas context for adjusted image');
  }
  adjCtx.putImageData(data, 0, 0);
  data = downsample(adjCanvas, targetWidth, targetHeight);

  // Step 6: Posterize
  data = posterize(data, posterizeLevels);

  return data;
}

/**
 * Map processed ImageData pixels to a grid of CellType values.
 *
 * Uses pixel brightness to determine which CellType each cell maps to,
 * based on the number of posterization levels.
 *
 * @param imageData - Posterized, downsampled ImageData (1 pixel = 1 grid cell)
 * @param levels - Number of posterization levels used
 * @returns Uint8Array of CellType values (row-major order)
 */
export function imageDataToGrid(
  imageData: ImageData,
  levels: number,
): Uint8Array {
  const { width, height, data } = imageData;
  const grid = new Uint8Array(width * height);

  // Build the brightness-to-CellType mapping
  const cellTypeMap = buildCellTypeMap(levels);

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const pixelIdx = (r * width + c) * 4;
      const brightness = data[pixelIdx]; // Already grayscale, R=G=B

      // Quantize brightness to a level index
      const normalizedBrightness = brightness / 255;
      const level = Math.min(
        Math.floor(normalizedBrightness * levels),
        levels - 1,
      );

      grid[r * width + c] = cellTypeMap[level];
    }
  }

  return grid;
}

/**
 * Build the mapping from posterization level index to CellType value.
 *
 * @param levels - Total number of levels (2–5)
 * @returns Array where index = level, value = CellType
 */
function buildCellTypeMap(levels: number): CellType[] {
  switch (levels) {
    case 2:
      return [CellType.OPEN, CellType.FILLED];
    case 3:
      return [CellType.OPEN, CellType.LACET, CellType.FILLED];
    case 4:
      return [CellType.OPEN, CellType.LACET, CellType.PARTIAL, CellType.FILLED];
    case 5:
    default:
      return [
        CellType.OPEN,
        CellType.LACET,
        CellType.PARTIAL,
        CellType.BAR,
        CellType.FILLED,
      ];
  }
}

// ─── Internal Helpers ──────────────────────────────────────────────────────────

/** Clamp a value to the 0-255 byte range. */
function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

/** Quantize a pixel value to one of N discrete levels. */
function quantize(value: number, levels: number, step: number): number {
  const level = Math.min(Math.floor(value / step), levels - 1);
  return Math.round((level * 255) / (levels - 1));
}
