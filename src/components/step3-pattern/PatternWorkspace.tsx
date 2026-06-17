import React, { useState, useCallback, useMemo } from 'react';
import GridCanvas, { CellType, type CellTypeValue } from './GridCanvas';
import ImageImporter from './ImageImporter';

interface PatternWorkspaceProps {
  garmentWidth: number;    // in grid cells
  garmentHeight: number;   // in grid cells
  mask?: boolean[];        // garment shape mask
  className?: string;
}

type ToolType = 'draw' | 'erase' | 'toggle' | 'fill';

const TOOLS: Array<{ id: ToolType; label: string; icon: string; shortcut: string }> = [
  { id: 'toggle', label: 'Toggle', icon: '✏️', shortcut: 'T' },
  { id: 'draw', label: 'Draw', icon: '🖊️', shortcut: 'D' },
  { id: 'erase', label: 'Erase', icon: '🧹', shortcut: 'E' },
  { id: 'fill', label: 'Fill', icon: '🪣', shortcut: 'F' },
];

const STITCH_PALETTE: Array<{ type: CellTypeValue; label: string; symbol: string; color: string }> = [
  { type: CellType.OPEN, label: 'Open Mesh', symbol: '□', color: '#2a2a3e' },
  { type: CellType.FILLED, label: 'Filled', symbol: '■', color: '#D4A574' },
  { type: CellType.LACET, label: 'Lacet', symbol: '◇', color: '#7B6B5A' },
  { type: CellType.PARTIAL, label: 'Partial', symbol: '▤', color: '#A68B6B' },
  { type: CellType.BAR, label: 'Bar', symbol: '═', color: '#8B7355' },
];

/**
 * Main workspace for Step 3 — combines grid editor, image importer,
 * and drawing tools into one cohesive workspace.
 */
const PatternWorkspace: React.FC<PatternWorkspaceProps> = ({
  garmentWidth,
  garmentHeight,
  mask,
  className,
}) => {
  // Grid state
  const [cells, setCells] = useState<number[]>(() =>
    new Array(garmentWidth * garmentHeight).fill(CellType.OPEN)
  );

  // Tool state
  const [activeTool, setActiveTool] = useState<ToolType>('toggle');
  const [activeStitch, setActiveStitch] = useState<CellTypeValue>(CellType.FILLED);
  const [showImageImporter, setShowImageImporter] = useState(false);

  // Undo/redo
  const [history, setHistory] = useState<number[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Grid dimensions display
  const gridInfo = useMemo(() => {
    const filled = cells.filter((c) => c === CellType.FILLED).length;
    const open = cells.filter((c) => c === CellType.OPEN).length;
    const total = cells.filter((c) => c !== CellType.OUTSIDE).length;
    return { filled, open, total };
  }, [cells]);

  /* ─── Cell change handler ─── */
  const handleCellChange = useCallback(
    (col: number, row: number, value: CellTypeValue) => {
      setCells((prev) => {
        const next = [...prev];
        const idx = row * garmentWidth + col;
        if (mask && !mask[idx]) return prev;
        next[idx] = value;
        return next;
      });
    },
    [garmentWidth, mask]
  );

  /* ─── Batch change (for undo) ─── */
  const handleCellsChange = useCallback(
    (changes: Array<{ col: number; row: number; value: CellTypeValue }>) => {
      // Save current state for undo
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push([...cells]);
        return newHistory;
      });
      setHistoryIndex((i) => i + 1);
    },
    [cells, historyIndex]
  );

  /* ─── Undo/Redo ─── */
  const undo = useCallback(() => {
    if (historyIndex >= 0) {
      setCells(history[historyIndex]);
      setHistoryIndex((i) => i - 1);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((i) => i + 1);
      setCells(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  /* ─── Image import handler ─── */
  const handleImageProcessed = useCallback(
    (imageData: ImageData) => {
      // Save for undo
      setHistory((prev) => [...prev.slice(0, historyIndex + 1), [...cells]]);
      setHistoryIndex((i) => i + 1);

      // Convert processed image to grid cells
      const newCells = new Array(garmentWidth * garmentHeight).fill(CellType.OPEN);

      // Scale image to grid dimensions
      const scaleX = imageData.width / garmentWidth;
      const scaleY = imageData.height / garmentHeight;

      for (let row = 0; row < garmentHeight; row++) {
        for (let col = 0; col < garmentWidth; col++) {
          const idx = row * garmentWidth + col;
          if (mask && !mask[idx]) {
            newCells[idx] = CellType.OUTSIDE;
            continue;
          }

          // Sample from image (area averaging for better quality)
          const sx = Math.floor(col * scaleX);
          const sy = Math.floor(row * scaleY);
          const imgIdx = (sy * imageData.width + sx) * 4;
          const brightness = imageData.data[imgIdx]; // already grayscale

          // Map brightness to cell type (dark = filled, light = open)
          // The posterize step already quantized the values
          const normalizedBrightness = brightness / 255;
          if (normalizedBrightness > 0.7) {
            newCells[idx] = CellType.OPEN;
          } else if (normalizedBrightness > 0.5) {
            newCells[idx] = CellType.LACET;
          } else if (normalizedBrightness > 0.3) {
            newCells[idx] = CellType.PARTIAL;
          } else {
            newCells[idx] = CellType.FILLED;
          }
        }
      }

      setCells(newCells);
      setShowImageImporter(false);
    },
    [garmentWidth, garmentHeight, mask, cells, historyIndex]
  );

  /* ─── Clear grid ─── */
  const clearGrid = useCallback(() => {
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), [...cells]]);
    setHistoryIndex((i) => i + 1);
    setCells(
      new Array(garmentWidth * garmentHeight).fill(CellType.OPEN).map((_, i) =>
        mask && !mask[i] ? CellType.OUTSIDE : CellType.OPEN
      )
    );
  }, [garmentWidth, garmentHeight, mask, cells, historyIndex]);

  /* ─── Keyboard shortcuts ─── */
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          if (e.shiftKey) redo();
          else undo();
        }
      } else {
        switch (e.key.toLowerCase()) {
          case 't': setActiveTool('toggle'); break;
          case 'd': setActiveTool('draw'); break;
          case 'e': setActiveTool('erase'); break;
          case 'f': setActiveTool('fill'); break;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  return (
    <div className={`pattern-workspace ${className || ''}`}>
      {/* Toolbar */}
      <div className="pattern-toolbar">
        <div className="pattern-toolbar__section">
          <span className="pattern-toolbar__label">Tools</span>
          <div className="pattern-toolbar__group">
            {TOOLS.map((t) => (
              <button
                key={t.id}
                className={`toolbar-btn ${activeTool === t.id ? 'toolbar-btn--active' : ''}`}
                onClick={() => setActiveTool(t.id)}
                title={`${t.label} (${t.shortcut})`}
              >
                <span className="toolbar-btn__icon">{t.icon}</span>
                <span className="toolbar-btn__label">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="pattern-toolbar__divider" />

        <div className="pattern-toolbar__section">
          <span className="pattern-toolbar__label">Stitch Type</span>
          <div className="pattern-toolbar__group">
            {STITCH_PALETTE.map((s) => (
              <button
                key={s.type}
                className={`stitch-btn ${activeStitch === s.type ? 'stitch-btn--active' : ''}`}
                onClick={() => setActiveStitch(s.type)}
                title={s.label}
              >
                <span
                  className="stitch-btn__swatch"
                  style={{ background: s.color }}
                />
                <span className="stitch-btn__symbol">{s.symbol}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="pattern-toolbar__divider" />

        <div className="pattern-toolbar__section">
          <span className="pattern-toolbar__label">Actions</span>
          <div className="pattern-toolbar__group">
            <button
              className="toolbar-btn"
              onClick={() => setShowImageImporter(!showImageImporter)}
              title="Import Image"
            >
              <span className="toolbar-btn__icon">🖼️</span>
              <span className="toolbar-btn__label">Image</span>
            </button>
            <button className="toolbar-btn" onClick={undo} title="Undo (Ctrl+Z)">
              <span className="toolbar-btn__icon">↩️</span>
              <span className="toolbar-btn__label">Undo</span>
            </button>
            <button className="toolbar-btn" onClick={redo} title="Redo (Ctrl+Shift+Z)">
              <span className="toolbar-btn__icon">↪️</span>
              <span className="toolbar-btn__label">Redo</span>
            </button>
            <button className="toolbar-btn toolbar-btn--danger" onClick={clearGrid} title="Clear All">
              <span className="toolbar-btn__icon">🗑️</span>
              <span className="toolbar-btn__label">Clear</span>
            </button>
          </div>
        </div>

        <div className="pattern-toolbar__spacer" />

        {/* Grid info */}
        <div className="pattern-toolbar__info">
          <span>{garmentWidth}×{garmentHeight}</span>
          <span className="pattern-toolbar__info-detail">
            {gridInfo.filled} filled / {gridInfo.open} open
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="pattern-workspace__content">
        {/* Image importer panel (collapsible) */}
        {showImageImporter && (
          <div className="pattern-workspace__side-panel">
            <div className="side-panel__header">
              <h3>Import Image</h3>
              <button
                className="btn-icon"
                onClick={() => setShowImageImporter(false)}
              >
                ✕
              </button>
            </div>
            <ImageImporter onImageProcessed={handleImageProcessed} />
          </div>
        )}

        {/* Grid canvas */}
        <div className="pattern-workspace__canvas">
          <GridCanvas
            width={garmentWidth}
            height={garmentHeight}
            cells={cells}
            mask={mask}
            tool={activeTool}
            drawValue={activeStitch}
            onCellChange={handleCellChange}
            onCellsChange={handleCellsChange}
          />
        </div>
      </div>
    </div>
  );
};

export default PatternWorkspace;
