import React, { useCallback } from 'react';
import { useProjectStore } from '../../store/projectStore.ts';
import type { BodyShape, GarmentLength, BodyFit } from '../../types/garment.ts';

const BODY_SHAPE_OPTIONS: { value: BodyShape; label: string }[] = [
  { value: 'straight', label: 'Straight' },
  { value: 'a-line', label: 'A-Line' },
  { value: 'cropped', label: 'Cropped' },
];

const GARMENT_LENGTH_OPTIONS: { value: GarmentLength; label: string }[] = [
  { value: 'crop', label: 'Crop' },
  { value: 'waist', label: 'Waist' },
  { value: 'hip', label: 'Hip' },
  { value: 'tunic', label: 'Tunic' },
];

const FIT_OPTIONS: { value: BodyFit; label: string; desc: string }[] = [
  { value: 'fitted', label: 'Fitted', desc: '+1″' },
  { value: 'standard', label: 'Standard', desc: '+2.5″' },
  { value: 'relaxed', label: 'Relaxed', desc: '+5″' },
  { value: 'oversized', label: 'Oversized', desc: '+8″' },
];

const BodyShapeIcon: React.FC<{ shape: BodyShape; selected: boolean }> = ({ shape, selected }) => {
  const stroke = selected ? '#D4A574' : '#807870';
  const w = 36;
  const h = 36;

  const paths: Record<BodyShape, string> = {
    straight: `M10,4 L10,32 L26,32 L26,4 Z`,
    'a-line': `M12,4 L6,32 L30,32 L24,4 Z`,
    cropped: `M10,4 L10,22 L26,22 L26,4 Z`,
  };

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <path d={paths[shape]} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
      <path d={`M14,4 Q${w / 2},7 22,4`} stroke={stroke} strokeWidth="1" opacity="0.5" />
    </svg>
  );
};

export const BodyShapeSelector: React.FC = () => {
  const bodyShape = useProjectStore((s) => s.style.bodyShape);
  const garmentLength = useProjectStore((s) => s.style.garmentLength);
  const bodyFit = useProjectStore((s) => s.style.bodyFit);
  const setStyle = useProjectStore((s) => s.setStyle);

  const handleShapeSelect = useCallback(
    (value: BodyShape) => setStyle({ bodyShape: value }),
    [setStyle]
  );

  const handleLengthSelect = useCallback(
    (value: GarmentLength) => setStyle({ garmentLength: value }),
    [setStyle]
  );

  const handleFitSelect = useCallback(
    (value: BodyFit) => setStyle({ bodyFit: value }),
    [setStyle]
  );

  return (
    <div className="body-shape-selector">
      {/* Body Shape */}
      <h3 className="section-title">Body Shape</h3>
      <div className="selector-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {BODY_SHAPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`selector-card ${bodyShape === opt.value ? 'selector-card--selected' : ''}`}
            onClick={() => handleShapeSelect(opt.value)}
            type="button"
          >
            <div className="selector-card__icon">
              <BodyShapeIcon shape={opt.value} selected={bodyShape === opt.value} />
            </div>
            <span className="selector-card__label">{opt.label}</span>
          </button>
        ))}
      </div>

      {/* Garment Length */}
      <div style={{ marginTop: 'var(--space-6)' }}>
        <h3 className="section-title">Length</h3>
        <div className="selector-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {GARMENT_LENGTH_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`selector-card ${garmentLength === opt.value ? 'selector-card--selected' : ''}`}
              onClick={() => handleLengthSelect(opt.value)}
              type="button"
            >
              <span className="selector-card__label">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Fit */}
      <div style={{ marginTop: 'var(--space-6)' }}>
        <h3 className="section-title">Fit</h3>
        <div className="selector-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {FIT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`selector-card ${bodyFit === opt.value ? 'selector-card--selected' : ''}`}
              onClick={() => handleFitSelect(opt.value)}
              type="button"
            >
              <span className="selector-card__label">{opt.label}</span>
              <span style={{
                fontSize: 'var(--font-size-xs)',
                color: bodyFit === opt.value ? 'var(--color-amber-300)' : 'var(--color-text-tertiary)',
              }}>
                {opt.desc}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
