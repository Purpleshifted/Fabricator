import React from 'react';
import { useProjectStore } from '../../store/projectStore.ts';
import { NecklineSelector } from './NecklineSelector.tsx';
import { SleeveSelector } from './SleeveSelector.tsx';
import { BodyShapeSelector } from './BodyShapeSelector.tsx';
import { GarmentPreview } from './GarmentPreview.tsx';

export const StyleConfigurator: React.FC = () => {
  const nextStep = useProjectStore((s) => s.nextStep);

  return (
    <div className="style-configurator step-content">
      <div className="style-configurator__header">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Design Your Garment
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
          Choose the silhouette, neckline, sleeves, and overall shape
        </p>
      </div>

      <div className="style-configurator__body">
        {/* Options Panel */}
        <div className="style-configurator__options card">
          <div className="style-configurator__sections">
            <NecklineSelector />
            <hr className="section-divider" />
            <SleeveSelector />
            <hr className="section-divider" />
            <BodyShapeSelector />
          </div>
        </div>

        {/* Preview Panel */}
        <div className="style-configurator__preview card">
          <h3 className="section-title" style={{ textAlign: 'center' }}>Preview</h3>
          <GarmentPreview />
          <p className="text-xs text-center" style={{ color: 'var(--color-text-tertiary)', marginTop: 'var(--space-4)' }}>
            Front view • Updates as you make selections
          </p>
        </div>
      </div>

      {/* Footer with Next button */}
      <div className="style-configurator__footer">
        <button className="btn btn-primary btn-lg" onClick={nextStep} type="button">
          Continue to Sizing
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ marginLeft: '4px' }}>
            <path d="M7 4L12 9L7 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <style>{`
        .style-configurator__header {
          margin-bottom: var(--space-6);
        }

        .style-configurator__body {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: var(--space-6);
          align-items: start;
        }

        .style-configurator__options {
          overflow-y: auto;
          max-height: calc(100vh - 200px);
        }

        .style-configurator__sections {
          display: flex;
          flex-direction: column;
        }

        .style-configurator__preview {
          position: sticky;
          top: calc(var(--header-height) + var(--space-8));
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .style-configurator__footer {
          display: flex;
          justify-content: flex-end;
          margin-top: var(--space-8);
          padding-top: var(--space-6);
          border-top: 1px solid var(--color-border-subtle);
        }

        @media (max-width: 900px) {
          .style-configurator__body {
            grid-template-columns: 1fr;
          }

          .style-configurator__preview {
            position: static;
            order: -1;
          }
        }
      `}</style>
    </div>
  );
};
