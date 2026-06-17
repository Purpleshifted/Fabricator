import React, { useRef, useEffect, useCallback, useState } from 'react';

/* ─── Cell type constants (mirrors core/grid.ts) ─── */
export const CellType = {
  OUTSIDE: -1,
  OPEN: 0,
  FILLED: 1,
  LACET: 2,
  PARTIAL: 3,
  BAR: 4,
} as const;
export type CellTypeValue = (typeof CellType)[keyof typeof CellType];

/* ─── Cell colors (dark theme) ─── */
const CELL_COLORS: Record<number, string> = {
  [CellType.OUTSIDE]: 'transparent',
  [CellType.OPEN]: '#2a2a3e',        // dark empty
  [CellType.FILLED]: '#D4A574',      // warm amber fill
  [CellType.LACET]: '#7B6B5A',       // muted brown
  [CellType.PARTIAL]: '#A68B6B',     // lighter brown
  [CellType.BAR]: '#8B7355',         // medium brown
};

const CELL_SYMBOLS: Record<number, string> = {
  [CellType.OPEN]: '',
  [CellType.FILLED]: '',
  [CellType.LACET]: '◇',
  [CellType.PARTIAL]: '▤',
  [CellType.BAR]: '═',
};

const GRID_LINE_COLOR = '#3a3a50';
const GRID_BORDER_COLOR = '#4a4a65';
const HIGHLIGHT_COLOR = 'rgba(91, 138, 138, 0.35)';
const SELECTION_COLOR = 'rgba(212, 165, 116, 0.4)';

interface GridCanvasProps {
  width: number;            // grid columns
  height: number;           // grid rows
  cells: number[];          // flat array of CellType values
  cellAspectRatio?: number; // height/width ratio (default 1.5 for DC)
  highlightRow?: number;    // row to highlight (progress tracker)
  mask?: boolean[];         // garment shape mask (true = inside)
  tool?: 'draw' | 'erase' | 'toggle' | 'fill';
  drawValue?: CellTypeValue;
  onCellChange?: (col: number, row: number, value: CellTypeValue) => void;
  onCellsChange?: (changes: Array<{ col: number; row: number; value: CellTypeValue }>) => void;
  className?: string;
}

/* ─── Constants ─── */
const BASE_CELL_W = 20;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 8;
const LABEL_GUTTER = 36;

const GridCanvas: React.FC<GridCanvasProps> = ({
  width: gridW,
  height: gridH,
  cells,
  cellAspectRatio = 1.5,
  highlightRow,
  mask,
  tool = 'toggle',
  drawValue = CellType.FILLED,
  onCellChange,
  onCellsChange,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /* viewport state */
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(LABEL_GUTTER);
  const [panY, setPanY] = useState(LABEL_GUTTER);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });

  /* interaction state */
  const isPanning = useRef(false);
  const isDrawing = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const drawBatch = useRef<Array<{ col: number; row: number; value: CellTypeValue }>>([]);
  const touchCache = useRef<PointerEvent[]>([]);
  const prevPinchDist = useRef(0);

  const cellW = BASE_CELL_W * zoom;
  const cellH = cellW * cellAspectRatio;

  /* ─── Resize observer ─── */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setCanvasSize({ w: Math.floor(width), h: Math.floor(height) });
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  /* ─── Auto-fit zoom on mount ─── */
  useEffect(() => {
    if (gridW > 0 && gridH > 0 && canvasSize.w > 0) {
      const availW = canvasSize.w - LABEL_GUTTER * 2;
      const availH = canvasSize.h - LABEL_GUTTER * 2;
      const fitZoomW = availW / (gridW * BASE_CELL_W);
      const fitZoomH = availH / (gridH * BASE_CELL_W * cellAspectRatio);
      const fitZoom = Math.max(MIN_ZOOM, Math.min(1, Math.min(fitZoomW, fitZoomH)));
      setZoom(fitZoom);
      setPanX(LABEL_GUTTER);
      setPanY(LABEL_GUTTER);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridW, gridH]);

  /* ─── Coordinate helpers ─── */
  const screenToGrid = useCallback(
    (sx: number, sy: number): { col: number; row: number } | null => {
      const col = Math.floor((sx - panX) / cellW);
      const row = Math.floor((sy - panY) / cellH);
      if (col < 0 || col >= gridW || row < 0 || row >= gridH) return null;
      return { col, row };
    },
    [panX, panY, cellW, cellH, gridW, gridH]
  );

  /* ─── Rendering ─── */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.w * dpr;
    canvas.height = canvasSize.h * dpr;
    canvas.style.width = `${canvasSize.w}px`;
    canvas.style.height = `${canvasSize.h}px`;
    ctx.scale(dpr, dpr);

    // clear
    ctx.fillStyle = '#12121f';
    ctx.fillRect(0, 0, canvasSize.w, canvasSize.h);

    // visible cell range (virtualization)
    const startCol = Math.max(0, Math.floor(-panX / cellW));
    const endCol = Math.min(gridW, Math.ceil((canvasSize.w - panX) / cellW));
    const startRow = Math.max(0, Math.floor(-panY / cellH));
    const endRow = Math.min(gridH, Math.ceil((canvasSize.h - panY) / cellH));

    // draw cells
    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const idx = row * gridW + col;
        const cellVal = cells[idx] ?? CellType.OPEN;

        // skip outside cells
        if (cellVal === CellType.OUTSIDE) continue;
        if (mask && !mask[idx]) continue;

        const x = panX + col * cellW;
        const y = panY + row * cellH;

        // cell fill
        ctx.fillStyle = CELL_COLORS[cellVal] ?? CELL_COLORS[CellType.OPEN];
        ctx.fillRect(x, y, cellW, cellH);

        // cell symbol for special types
        if (cellVal >= CellType.LACET && zoom > 0.6) {
          const sym = CELL_SYMBOLS[cellVal];
          if (sym) {
            ctx.fillStyle = '#e0d0c0';
            ctx.font = `${Math.max(8, cellW * 0.5)}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(sym, x + cellW / 2, y + cellH / 2);
          }
        }
      }
    }

    // grid lines
    ctx.strokeStyle = GRID_LINE_COLOR;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let col = startCol; col <= endCol; col++) {
      const x = panX + col * cellW;
      ctx.moveTo(x, panY + startRow * cellH);
      ctx.lineTo(x, panY + endRow * cellH);
    }
    for (let row = startRow; row <= endRow; row++) {
      const y = panY + row * cellH;
      ctx.moveTo(panX + startCol * cellW, y);
      ctx.lineTo(panX + endCol * cellW, y);
    }
    ctx.stroke();

    // border
    ctx.strokeStyle = GRID_BORDER_COLOR;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(panX, panY, gridW * cellW, gridH * cellH);

    // row highlight
    if (highlightRow !== undefined && highlightRow >= startRow && highlightRow < endRow) {
      ctx.fillStyle = HIGHLIGHT_COLOR;
      ctx.fillRect(panX, panY + highlightRow * cellH, gridW * cellW, cellH);
    }

    // row/column labels
    if (zoom > 0.4) {
      ctx.fillStyle = '#888';
      ctx.font = `${Math.min(11, cellW * 0.45)}px Inter, sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      // row numbers (left side)
      for (let row = startRow; row < endRow; row++) {
        if (zoom < 0.7 && row % 5 !== 0) continue;
        const y = panY + row * cellH + cellH / 2;
        ctx.fillText(`${row + 1}`, panX - 4, y);
      }
      // column numbers (top)
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      for (let col = startCol; col < endCol; col++) {
        if (zoom < 0.7 && col % 5 !== 0) continue;
        const x = panX + col * cellW + cellW / 2;
        ctx.fillText(`${col + 1}`, x, panY - 3);
      }
    }

    // read direction indicators
    if (zoom > 0.5) {
      ctx.fillStyle = '#666';
      ctx.font = `${Math.min(10, cellW * 0.35)}px Inter, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      for (let row = startRow; row < endRow; row++) {
        if (zoom < 0.7 && row % 2 !== 0) continue;
        const y = panY + row * cellH + cellH / 2;
        const rightX = panX + gridW * cellW + 4;
        // odd rows (1,3,5...) read right-to-left ←, even rows left-to-right →
        // Row 1 (index 0) is read → (bottom of chart, first row worked)
        const arrow = row % 2 === 0 ? '→' : '←';
        ctx.fillText(arrow, rightX, y);
      }
    }
  }, [canvasSize, cells, cellW, cellH, gridW, gridH, panX, panY, zoom, mask, highlightRow]);

  /* ─── Render on state change ─── */
  useEffect(() => {
    requestAnimationFrame(render);
  }, [render]);

  /* ─── Pointer handlers ─── */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.setPointerCapture(e.pointerId);

      // Track touches for pinch
      touchCache.current.push(e.nativeEvent);

      if (touchCache.current.length === 2) {
        // Start pinch
        isPanning.current = true;
        const dx = touchCache.current[0].clientX - touchCache.current[1].clientX;
        const dy = touchCache.current[0].clientY - touchCache.current[1].clientY;
        prevPinchDist.current = Math.sqrt(dx * dx + dy * dy);
        return;
      }

      // Middle click or right click = pan
      if (e.button === 1 || e.button === 2) {
        isPanning.current = true;
        lastPointer.current = { x: e.clientX, y: e.clientY };
        return;
      }

      // Left click = draw
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const cell = screenToGrid(sx, sy);

      if (cell) {
        isDrawing.current = true;
        drawBatch.current = [];

        let newVal: CellTypeValue;
        if (tool === 'toggle') {
          const current = cells[cell.row * gridW + cell.col] ?? CellType.OPEN;
          newVal = current === CellType.FILLED ? CellType.OPEN : CellType.FILLED;
        } else if (tool === 'erase') {
          newVal = CellType.OPEN;
        } else if (tool === 'fill') {
          // flood fill handled on pointer up
          newVal = drawValue;
        } else {
          newVal = drawValue;
        }

        if (tool !== 'fill') {
          onCellChange?.(cell.col, cell.row, newVal);
          drawBatch.current.push({ col: cell.col, row: cell.row, value: newVal });
        }
      }

      lastPointer.current = { x: e.clientX, y: e.clientY };
    },
    [screenToGrid, cells, gridW, tool, drawValue, onCellChange]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      // Update touch cache
      const idx = touchCache.current.findIndex((t) => t.pointerId === e.pointerId);
      if (idx >= 0) touchCache.current[idx] = e.nativeEvent;

      // Pinch zoom
      if (touchCache.current.length === 2) {
        const dx = touchCache.current[0].clientX - touchCache.current[1].clientX;
        const dy = touchCache.current[0].clientY - touchCache.current[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (prevPinchDist.current > 0) {
          const scale = dist / prevPinchDist.current;
          setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z * scale)));
        }
        prevPinchDist.current = dist;
        return;
      }

      if (isPanning.current) {
        const dx = e.clientX - lastPointer.current.x;
        const dy = e.clientY - lastPointer.current.y;
        setPanX((p) => p + dx);
        setPanY((p) => p + dy);
        lastPointer.current = { x: e.clientX, y: e.clientY };
        return;
      }

      if (isDrawing.current && tool !== 'fill') {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const cell = screenToGrid(sx, sy);
        if (cell) {
          // Check if already in batch
          const already = drawBatch.current.some(
            (c) => c.col === cell.col && c.row === cell.row
          );
          if (!already) {
            const newVal =
              tool === 'erase'
                ? CellType.OPEN
                : tool === 'toggle'
                  ? cells[cell.row * gridW + cell.col] === CellType.FILLED
                    ? CellType.OPEN
                    : CellType.FILLED
                  : drawValue;
            onCellChange?.(cell.col, cell.row, newVal);
            drawBatch.current.push({ col: cell.col, row: cell.row, value: newVal });
          }
        }
      }
    },
    [screenToGrid, cells, gridW, tool, drawValue, onCellChange]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      touchCache.current = touchCache.current.filter(
        (t) => t.pointerId !== e.pointerId
      );
      if (touchCache.current.length < 2) {
        prevPinchDist.current = 0;
      }

      isPanning.current = false;

      if (isDrawing.current) {
        isDrawing.current = false;
        if (drawBatch.current.length > 0) {
          onCellsChange?.(drawBatch.current);
          drawBatch.current = [];
        }
      }
    },
    [onCellsChange]
  );

  /* ─── Wheel zoom ─── */
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * zoomFactor));

      // Zoom toward mouse position
      const scale = newZoom / zoom;
      setPanX((p) => mx - (mx - p) * scale);
      setPanY((p) => my - (my - p) * scale);
      setZoom(newZoom);
    },
    [zoom]
  );

  /* ─── Context menu prevention ─── */
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div
      ref={containerRef}
      className={`grid-canvas-container ${className || ''}`}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        cursor: isPanning.current ? 'grabbing' : isDrawing.current ? 'crosshair' : 'default',
      }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        style={{
          touchAction: 'none',
          display: 'block',
        }}
      />
      {/* Zoom indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          background: 'rgba(26, 26, 46, 0.85)',
          backdropFilter: 'blur(8px)',
          borderRadius: 8,
          padding: '6px 12px',
          color: '#D4A574',
          fontSize: 12,
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
          border: '1px solid rgba(212, 165, 116, 0.2)',
        }}
      >
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
};

export default GridCanvas;
