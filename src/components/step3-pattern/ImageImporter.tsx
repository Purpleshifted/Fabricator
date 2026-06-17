import React, { useCallback, useRef, useState } from 'react';

interface ImageImporterProps {
  onImageProcessed: (imageData: ImageData) => void;
  className?: string;
}

interface ProcessingOptions {
  contrast: number;
  brightness: number;
  posterizeLevels: number;
  invert: boolean;
}

/**
 * Image importer with real-time processing preview.
 * Handles: upload → grayscale → contrast/brightness → posterize → preview
 */
const ImageImporter: React.FC<ImageImporterProps> = ({ onImageProcessed, className }) => {
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [options, setOptions] = useState<ProcessingOptions>({
    contrast: 0,
    brightness: 0,
    posterizeLevels: 2,
    invert: false,
  });
  const [isDragging, setIsDragging] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ─── Image loading ─── */
  const loadImage = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setSourceImage(img);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  /* ─── Processing pipeline ─── */
  const processImage = useCallback(
    (img: HTMLImageElement, opts: ProcessingOptions): ImageData => {
      const canvas = document.createElement('canvas');
      // Scale down for preview while maintaining aspect ratio
      const maxDim = 400;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d')!;

      // Draw image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // 1. Grayscale (Rec. 709)
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        data[i] = data[i + 1] = data[i + 2] = gray;
      }

      // 2. Brightness
      if (opts.brightness !== 0) {
        const b = opts.brightness * 2.55; // -100..100 → -255..255
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.max(0, Math.min(255, data[i] + b));
          data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + b));
          data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + b));
        }
      }

      // 3. Contrast
      if (opts.contrast !== 0) {
        const factor = (259 * (opts.contrast + 255)) / (255 * (259 - opts.contrast));
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));
          data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128));
          data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128));
        }
      }

      // 4. Invert
      if (opts.invert) {
        for (let i = 0; i < data.length; i += 4) {
          data[i] = 255 - data[i];
          data[i + 1] = 255 - data[i + 1];
          data[i + 2] = 255 - data[i + 2];
        }
      }

      // 5. Posterize
      const levels = opts.posterizeLevels;
      const step = 255 / (levels - 1);
      for (let i = 0; i < data.length; i += 4) {
        const quantized = Math.round(data[i] / step) * step;
        data[i] = data[i + 1] = data[i + 2] = Math.max(0, Math.min(255, quantized));
      }

      ctx.putImageData(imageData, 0, 0);
      return imageData;
    },
    []
  );

  /* ─── Update preview when image or options change ─── */
  React.useEffect(() => {
    if (!sourceImage) return;

    // Draw original
    const origCanvas = originalCanvasRef.current;
    if (origCanvas) {
      const maxDim = 200;
      const scale = Math.min(1, maxDim / Math.max(sourceImage.width, sourceImage.height));
      origCanvas.width = Math.round(sourceImage.width * scale);
      origCanvas.height = Math.round(sourceImage.height * scale);
      const ctx = origCanvas.getContext('2d')!;
      ctx.drawImage(sourceImage, 0, 0, origCanvas.width, origCanvas.height);
    }

    // Process and draw preview
    const processed = processImage(sourceImage, options);
    const prevCanvas = previewCanvasRef.current;
    if (prevCanvas) {
      prevCanvas.width = processed.width;
      prevCanvas.height = processed.height;
      const ctx = prevCanvas.getContext('2d')!;
      ctx.putImageData(processed, 0, 0);
    }
  }, [sourceImage, options, processImage]);

  /* ─── Apply to grid ─── */
  const handleApply = useCallback(() => {
    if (!sourceImage) return;
    const processed = processImage(sourceImage, options);
    onImageProcessed(processed);
  }, [sourceImage, options, processImage, onImageProcessed]);

  /* ─── Drag & drop ─── */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback(() => setIsDragging(false), []);
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        loadImage(file);
      }
    },
    [loadImage]
  );

  return (
    <div className={`image-importer ${className || ''}`}>
      {!sourceImage ? (
        /* Upload zone */
        <div
          className={`upload-zone ${isDragging ? 'upload-zone--active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) loadImage(file);
            }}
          />
          <div className="upload-zone__icon">🖼️</div>
          <p className="upload-zone__text">
            Drop an image here or click to upload
          </p>
          <p className="upload-zone__hint">
            Photos, drawings, or pixel art — we'll convert it to a filet crochet grid
          </p>
        </div>
      ) : (
        /* Processing controls */
        <div className="image-controls">
          {/* Preview row */}
          <div className="image-controls__previews">
            <div className="image-controls__preview-box">
              <label className="image-controls__label">Original</label>
              <canvas ref={originalCanvasRef} className="image-controls__canvas" />
            </div>
            <div className="image-controls__arrow">→</div>
            <div className="image-controls__preview-box">
              <label className="image-controls__label">Processed</label>
              <canvas ref={previewCanvasRef} className="image-controls__canvas" />
            </div>
          </div>

          {/* Sliders */}
          <div className="image-controls__sliders">
            <div className="slider-group">
              <label>Contrast</label>
              <input
                type="range"
                min={-100}
                max={100}
                value={options.contrast}
                onChange={(e) =>
                  setOptions((o) => ({ ...o, contrast: Number(e.target.value) }))
                }
              />
              <span className="slider-value">{options.contrast}</span>
            </div>

            <div className="slider-group">
              <label>Brightness</label>
              <input
                type="range"
                min={-100}
                max={100}
                value={options.brightness}
                onChange={(e) =>
                  setOptions((o) => ({ ...o, brightness: Number(e.target.value) }))
                }
              />
              <span className="slider-value">{options.brightness}</span>
            </div>

            <div className="slider-group">
              <label>Detail Levels</label>
              <input
                type="range"
                min={2}
                max={5}
                step={1}
                value={options.posterizeLevels}
                onChange={(e) =>
                  setOptions((o) => ({
                    ...o,
                    posterizeLevels: Number(e.target.value),
                  }))
                }
              />
              <span className="slider-value">
                {options.posterizeLevels} ({['', '', 'Open/Filled', '+Lacet', '+Partial', '+Bar'][options.posterizeLevels]})
              </span>
            </div>

            <div className="slider-group">
              <label>
                <input
                  type="checkbox"
                  checked={options.invert}
                  onChange={(e) =>
                    setOptions((o) => ({ ...o, invert: e.target.checked }))
                  }
                />
                {' '}Invert (dark ↔ light)
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="image-controls__actions">
            <button
              className="btn btn--secondary"
              onClick={() => setSourceImage(null)}
            >
              Change Image
            </button>
            <button className="btn btn--primary" onClick={handleApply}>
              Apply to Grid
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageImporter;
