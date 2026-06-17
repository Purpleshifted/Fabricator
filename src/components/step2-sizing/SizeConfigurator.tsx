import React, { useCallback } from 'react';
import { useProjectStore } from '../../store/projectStore.ts';
import type { Size } from '../../types/index.ts';
import { MeasurementInput } from './MeasurementInput.tsx';
import { GaugeInput } from './GaugeInput.tsx';

const SIZES: Size[] = ['XS', 'S', 'M', 'L', 'XL'];

export const SizeConfigurator: React.FC = () => {
  const size = useProjectStore((s) => s.size);
  const setSize = useProjectStore((s) => s.setSize);
  const nextStep = useProjectStore((s) => s.nextStep);
  const prevStep = useProjectStore((s) => s.prevStep);

  const handleSizeSelect = useCallback(
    (s: Size) => setSize(s),
    [setSize]
  );

  return (
    <div className="size-configurator step-content">
      <div className="size-configurator__header">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Size & Gauge
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
          Select your size, adjust measurements, and set your crochet gauge
        </p>
      </div>

      {/* Quick Size Selector */}
      <div className="size-configurator__quick-size">
        <h3 className="section-title">Base Size</h3>
        <div className="size-buttons">
          {SIZES.map((s) => (
            <button
              key={s}
              className={`size-btn ${size === s ? 'size-btn--selected' : ''}`}
              onClick={() => handleSizeSelect(s)}
              type="button"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Two-column layout for measurements + gauge */}
      <div className="size-configurator__body">
        <div className="card">
          <MeasurementInput />
        </div>
        <div className="card">
          <GaugeInput />
        </div>
      </div>

      {/* Footer */}
      <div className="size-configurator__footer">
        <button className="btn btn-secondary" onClick={prevStep} type="button">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Design
        </button>
        <button className="btn btn-primary btn-lg" onClick={nextStep} type="button">
          Generate Pattern
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ marginLeft: '4px' }}>
            <path d="M7 4L12 9L7 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <style>{`
        .size-configurator__header {
          margin-bottom: var(--space-6);
        }

        .size-configurator__quick-size {
          margin-bottom: var(--space-6);
        }

        .size-buttons {
          display: flex;
          gap: var(--space-2);
        }

        .size-btn {
          min-width: 56px;
          min-height: var(--touch-target);
          padding: var(--space-2) var(--space-4);
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-secondary);
          background: var(--color-bg-surface);
          border: 1.5px solid var(--color-border-subtle);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          -webkit-tap-highlight-color: transparent;
        }

        .size-btn:hover {
          border-color: var(--color-border-default);
          background: var(--color-bg-hover);
          color: var(--color-text-primary);
        }

        .size-btn--selected {
          border-color: var(--color-amber-300);
          background: rgba(212, 165, 116, 0.12);
          color: var(--color-amber-200);
          box-shadow: var(--shadow-glow-amber);
        }

        .size-configurator__body {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-6);
          align-items: start;
        }

        .size-configurator__footer {
          display: flex;
          justify-content: space-between;
          margin-top: var(--space-8);
          padding-top: var(--space-6);
          border-top: 1px solid var(--color-border-subtle);
        }

        @media (max-width: 900px) {
          .size-configurator__body {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 600px) {
          .size-buttons {
            flex-wrap: wrap;
          }
          .size-btn {
            flex: 1;
            min-width: 44px;
          }
        }
      `}</style>
    </div>
  );
};
