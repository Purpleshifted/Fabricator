import React, { useRef, useEffect } from 'react';
import { CellType } from './GridCanvas';

interface MinimapProps {
  width: number;
  height: number;
  cells: number[];
  highlightRow?: number;
  maxSize?: number;
  className?: string;
}

/**
 * Minimap showing entire pattern at a glance.
 * Renders each cell as a single pixel for maximum overview.
 */
const Minimap: React.FC<MinimapProps> = ({
  width,
  height,
  cells,
  highlightRow,
  maxSize = 160,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0 || height <= 0) return;

    const aspect = width / height;
    let canvasW: number, canvasH: number;
    if (aspect > 1) {
      canvasW = maxSize;
      canvasH = Math.round(maxSize / aspect);
    } else {
      canvasH = maxSize;
      canvasW = Math.round(maxSize * aspect);
    }

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasW * dpr;
    canvas.height = canvasH * dpr;
    canvas.style.width = `${canvasW}px`;
    canvas.style.height = `${canvasH}px`;

    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvasW, canvasH);

    const pixelW = canvasW / width;
    const pixelH = canvasH / height;

    // Draw cells
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const cellVal = cells[row * width + col];
        if (cellVal === CellType.OUTSIDE) continue;

        let color: string;
        switch (cellVal) {
          case CellType.FILLED: color = '#D4A574'; break;
          case CellType.LACET: color = '#7B6B5A'; break;
          case CellType.PARTIAL: color = '#A68B6B'; break;
          case CellType.BAR: color = '#8B7355'; break;
          default: color = '#2a2a3e';
        }

        ctx.fillStyle = color;
        ctx.fillRect(
          Math.floor(col * pixelW),
          Math.floor(row * pixelH),
          Math.ceil(pixelW),
          Math.ceil(pixelH)
        );
      }
    }

    // Highlight row
    if (highlightRow !== undefined && highlightRow >= 0 && highlightRow < height) {
      ctx.fillStyle = 'rgba(91, 138, 138, 0.6)';
      ctx.fillRect(0, Math.floor(highlightRow * pixelH), canvasW, Math.max(2, Math.ceil(pixelH)));
    }

    // Border
    ctx.strokeStyle = '#4a4a65';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, canvasW - 1, canvasH - 1);
  }, [width, height, cells, highlightRow, maxSize]);

  return (
    <div className={`minimap ${className || ''}`}>
      <canvas ref={canvasRef} />
      <div className="minimap__label">Overview</div>
    </div>
  );
};

export default Minimap;
