import React from 'react';
import { useProjectStore } from '../../store/projectStore.ts';
import type { PatternPiece, PieceStatus } from '../../types/pattern.ts';

/* ------------------------------------------------------------------ */
/*  Status badge config                                                */
/* ------------------------------------------------------------------ */
const STATUS_CONFIG: Record<PieceStatus, { label: string; className: string }> = {
  ready:   { label: 'Ready',   className: 'po-badge--ready' },
  editing: { label: 'Editing', className: 'po-badge--editing' },
  done:    { label: 'Done',    className: 'po-badge--done' },
};

/* ------------------------------------------------------------------ */
/*  Miniature SVG outline                                              */
/* ------------------------------------------------------------------ */
const PieceSvg: React.FC<{ piece: PatternPiece }> = ({ piece }) => {
  if (!piece.outline || piece.outline.length < 2) {
    // Fallback: simple rectangle
    return (
      <svg viewBox="0 0 100 100" className="po-card__svg" aria-hidden="true">
        <rect
          x="10" y="10" width="80" height="80" rx="4"
          fill="none"
          stroke="var(--color-amber-300)"
          strokeWidth="2"
          opacity="0.7"
        />
      </svg>
    );
  }

  // Normalise outline points into 0–100 viewBox using bounding box
  const bb = piece.boundingBox;
  const norm = (pt: { x: number; y: number }) => ({
    x: bb.w > 0 ? ((pt.x - bb.x) / bb.w) * 80 + 10 : 50,
    y: bb.h > 0 ? ((pt.y - bb.y) / bb.h) * 80 + 10 : 50,
  });

  const d = piece.outline
    .map((pt, i) => {
      const n = norm(pt);
      return `${i === 0 ? 'M' : 'L'}${n.x.toFixed(1)},${n.y.toFixed(1)}`;
    })
    .join(' ') + ' Z';

  return (
    <svg viewBox="0 0 100 100" className="po-card__svg" aria-hidden="true">
      <path
        d={d}
        fill="rgba(212, 165, 116, 0.06)"
        stroke="var(--color-amber-300)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/*  Single piece card                                                  */
/* ------------------------------------------------------------------ */
const MM_TO_INCH = 1 / 25.4;

const PieceCard: React.FC<{
  piece: PatternPiece;
  onClick: () => void;
}> = ({ piece, onClick }) => {
  const { label, className } = STATUS_CONFIG[piece.status];
  const wIn = (piece.widthMm * MM_TO_INCH).toFixed(1);
  const hIn = (piece.heightMm * MM_TO_INCH).toFixed(1);

  return (
    <button className="po-card" onClick={onClick} type="button">
      <PieceSvg piece={piece} />

      <div className="po-card__info">
        <span className="po-card__name">{piece.name}</span>
        <span className="po-card__dims">
          {wIn}&quot; &times; {hIn}&quot;
        </span>
      </div>

      <span className={`po-badge ${className}`}>{label}</span>
    </button>
  );
};

/* ------------------------------------------------------------------ */
/*  PiecesOverview — main export                                       */
/* ------------------------------------------------------------------ */
export const PiecesOverview: React.FC = () => {
  const setActivePieceId = useProjectStore((s) => s.setActivePieceId);
  const setStep = useProjectStore((s) => s.setStep);

  // Read pattern pieces from store (field may not exist yet)
  const pieces: PatternPiece[] =
    useProjectStore((s) => s.patternSet?.pieces) ??
    (useProjectStore as any).getState()?.patternPieces ??
    [];

  const handleCardClick = (id: string) => {
    setActivePieceId(id);
    setStep(3);
  };

  const handleGenerateAll = () => {
    // In future this would kick off generation for every piece.
    // For now just advance to step 3 with the first piece selected.
    if (pieces.length > 0) {
      setActivePieceId(pieces[0].id);
    }
    setStep(3);
  };

  return (
    <section className="po-root">
      <header className="po-header">
        <h2 className="po-title">Pattern Pieces</h2>
        <p className="po-subtitle">
          Select a piece to edit its grid, or generate all at once.
        </p>
      </header>

      {pieces.length === 0 ? (
        <div className="po-empty">
          <span className="po-empty__icon">🧩</span>
          <p className="po-empty__text">
            No pattern pieces yet. Complete sizing to generate pieces.
          </p>
        </div>
      ) : (
        <div className="po-grid">
          {pieces.map((piece) => (
            <PieceCard
              key={piece.id}
              piece={piece}
              onClick={() => handleCardClick(piece.id)}
            />
          ))}
        </div>
      )}

      <div className="po-actions">
        <button
          className="po-btn po-btn--primary"
          onClick={handleGenerateAll}
          disabled={pieces.length === 0}
          type="button"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M3 9H15M9 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Generate All Grids
        </button>
      </div>

      <style>{`
        /* ---- Root ---- */
        .po-root {
          max-width: 780px;
          margin: 0 auto;
          animation: poFadeIn 400ms ease-out both;
        }

        @keyframes poFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ---- Header ---- */
        .po-header {
          text-align: center;
          margin-bottom: var(--space-8);
        }

        .po-title {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-bold);
          background: linear-gradient(135deg, var(--color-amber-200) 0%, var(--color-amber-400) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 var(--space-2);
        }

        .po-subtitle {
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
          margin: 0;
        }

        /* ---- Card grid ---- */
        .po-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: var(--space-5);
          margin-bottom: var(--space-8);
        }

        /* ---- Card ---- */
        .po-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-5) var(--space-4) var(--space-4);
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all 220ms ease;
          text-align: center;
          /* reset button styling */
          font-family: inherit;
          font-size: inherit;
          color: inherit;
        }

        .po-card:hover {
          background: var(--color-bg-hover);
          border-color: var(--color-amber-400);
          transform: translateY(-3px);
          box-shadow:
            0 8px 24px rgba(0, 0, 0, 0.35),
            0 0 0 1px rgba(212, 165, 116, 0.15);
        }

        .po-card:active {
          transform: translateY(-1px);
        }

        .po-card:focus-visible {
          outline: 2px solid var(--color-amber-300);
          outline-offset: 2px;
        }

        /* ---- SVG ---- */
        .po-card__svg {
          width: 80px;
          height: 80px;
          flex-shrink: 0;
          opacity: 0.85;
          transition: opacity 200ms ease;
        }
        .po-card:hover .po-card__svg {
          opacity: 1;
        }

        /* ---- Card info ---- */
        .po-card__info {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .po-card__name {
          font-weight: var(--font-weight-semibold);
          font-size: var(--font-size-sm);
          color: var(--color-text-primary);
        }

        .po-card__dims {
          font-size: var(--font-size-xs);
          color: var(--color-text-tertiary);
          font-variant-numeric: tabular-nums;
        }

        /* ---- Badge ---- */
        .po-badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 10px;
          border-radius: var(--radius-full);
          font-size: 11px;
          font-weight: var(--font-weight-semibold);
          text-transform: uppercase;
          letter-spacing: var(--letter-spacing-wider);
        }

        .po-badge--ready {
          background: rgba(212, 165, 116, 0.12);
          color: var(--color-amber-300);
        }

        .po-badge--editing {
          background: rgba(127, 184, 184, 0.14);
          color: var(--color-teal-300);
        }

        .po-badge--done {
          background: rgba(107, 203, 119, 0.14);
          color: var(--color-success);
        }

        /* ---- Empty state ---- */
        .po-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-12) var(--space-6);
          border: 1px dashed var(--color-border-default);
          border-radius: var(--radius-lg);
          margin-bottom: var(--space-8);
        }

        .po-empty__icon {
          font-size: 36px;
          opacity: 0.5;
        }

        .po-empty__text {
          color: var(--color-text-tertiary);
          font-size: var(--font-size-sm);
          margin: 0;
          text-align: center;
          max-width: 300px;
        }

        /* ---- Actions ---- */
        .po-actions {
          display: flex;
          justify-content: center;
        }

        .po-btn {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3) var(--space-6);
          border-radius: var(--radius-md);
          font-weight: var(--font-weight-semibold);
          font-size: var(--font-size-sm);
          cursor: pointer;
          border: none;
          font-family: inherit;
          transition: all 180ms ease;
        }

        .po-btn--primary {
          background: linear-gradient(135deg, var(--color-amber-400) 0%, var(--color-amber-600) 100%);
          color: var(--color-bg-deep);
        }

        .po-btn--primary:hover:not(:disabled) {
          background: linear-gradient(135deg, var(--color-amber-300) 0%, var(--color-amber-500) 100%);
          box-shadow: 0 4px 16px rgba(176, 125, 72, 0.35);
          transform: translateY(-1px);
        }

        .po-btn--primary:active:not(:disabled) {
          transform: translateY(0);
        }

        .po-btn--primary:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        /* ---- Responsive ---- */
        @media (max-width: 560px) {
          .po-grid {
            grid-template-columns: 1fr 1fr;
            gap: var(--space-3);
          }
          .po-card__svg {
            width: 60px;
            height: 60px;
          }
        }
      `}</style>
    </section>
  );
};
