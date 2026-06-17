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
      <h2 className="style-configurator__heading">Design Your Garment</h2>

      <div className="style-configurator__layout">
        {/* Left column — options, scrolls with page */}
        <div className="style-configurator__options">
          <div className="card">
            <div className="style-configurator__sections">
              <NecklineSelector />
              <hr className="section-divider" />
              <SleeveSelector />
              <hr className="section-divider" />
              <BodyShapeSelector />
            </div>
          </div>

          {/* Continue button lives inside the options column */}
          <div className="style-configurator__action">
            <button className="btn btn-primary btn-lg" onClick={nextStep} type="button">
              Continue to Sizing
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ marginLeft: '4px' }}>
                <path d="M7 4L12 9L7 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right column — preview, stays visible while scrolling */}
        <div className="style-configurator__preview card">
          <h3 className="section-title" style={{ textAlign: 'center' }}>Preview</h3>
          <GarmentPreview />
          <p className="text-xs text-center" style={{ color: 'var(--color-text-tertiary)', marginTop: 'var(--space-4)' }}>
            Front view • Updates as you make selections
          </p>
        </div>
      </div>

      <style>{`
        .style-configurator__heading {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          margin-bottom: var(--space-6);
        }

        .style-configurator__layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: var(--space-6);
          align-items: start;
        }

        /* Options column — no max-height, scrolls naturally with the page */
        .style-configurator__options {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
          min-width: 0;
        }

        .style-configurator__sections {
          display: flex;
          flex-direction: column;
        }

        .style-configurator__action {
          display: flex;
          justify-content: flex-end;
          padding-top: var(--space-2);
        }

        /* Preview column — sticky so it stays visible */
        .style-configurator__preview {
          position: sticky;
          top: calc(var(--header-height) + var(--space-6));
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        @media (max-width: 900px) {
          .style-configurator__layout {
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
