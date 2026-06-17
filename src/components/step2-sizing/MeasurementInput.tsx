import React, { useState, useCallback } from 'react';
import { useProjectStore } from '../../store/projectStore.ts';
import type { BodyMeasurements } from '../../types/garment.ts';
import { STANDARD_SIZES, EASE_VALUES } from '../../types/index.ts';

type MeasurementKey = keyof BodyMeasurements;

interface MeasurementField {
  key: MeasurementKey;
  label: string;
  hasEase: boolean;
}

const MEASUREMENT_FIELDS: MeasurementField[] = [
  { key: 'bust', label: 'Bust', hasEase: true },
  { key: 'waist', label: 'Waist', hasEase: true },
  { key: 'hip', label: 'Hip', hasEase: true },
  { key: 'shoulderWidth', label: 'Shoulder Width', hasEase: false },
  { key: 'armLength', label: 'Arm Length', hasEase: false },
  { key: 'crossBack', label: 'Cross Back', hasEase: false },
  { key: 'backWaistLength', label: 'Back Waist Length', hasEase: false },
  { key: 'upperArm', label: 'Upper Arm', hasEase: false },
  { key: 'armholeDepth', label: 'Armhole Depth', hasEase: false },
  { key: 'neckCircumference', label: 'Neck', hasEase: false },
];

// SVG body diagram measurement positions
const BODY_DIAGRAM_POINTS: Partial<Record<MeasurementKey, { y: number; label: string }>> = {
  neckCircumference: { y: 28, label: 'Neck' },
  shoulderWidth: { y: 50, label: 'Shoulder' },
  bust: { y: 90, label: 'Bust' },
  upperArm: { y: 80, label: 'Arm' },
  waist: { y: 135, label: 'Waist' },
  hip: { y: 175, label: 'Hip' },
  backWaistLength: { y: 110, label: 'Length' },
  armLength: { y: 130, label: 'Arm Len' },
  crossBack: { y: 70, label: 'Back' },
  armholeDepth: { y: 100, label: 'AH Depth' },
};

export const MeasurementInput: React.FC = () => {
  const size = useProjectStore((s) => s.size);
  const bodyFit = useProjectStore((s) => s.style.bodyFit);
  const customMeasurements = useProjectStore((s) => s.customMeasurements);
  const setCustomMeasurements = useProjectStore((s) => s.setCustomMeasurements);
  const [useInches, setUseInches] = useState(true); // default inches since types are in inches
  const [editingField, setEditingField] = useState<MeasurementKey | null>(null);
  const [hoveredField, setHoveredField] = useState<MeasurementKey | null>(null);

  const standardValues = STANDARD_SIZES[size];
  const ease = EASE_VALUES[bodyFit];

  const getMeasurement = useCallback(
    (key: MeasurementKey): number => {
      return customMeasurements?.[key] ?? standardValues[key];
    },
    [customMeasurements, standardValues]
  );

  const getDisplayValue = useCallback(
    (value: number): string => {
      if (!useInches) {
        return (value * 2.54).toFixed(1);
      }
      return value.toFixed(1);
    },
    [useInches]
  );

  const handleValueChange = useCallback(
    (key: MeasurementKey, rawValue: string) => {
      let val = parseFloat(rawValue);
      if (isNaN(val)) return;
      if (!useInches) val = val / 2.54; // convert cm back to inches for storage
      setCustomMeasurements({ [key]: val });
    },
    [setCustomMeasurements, useInches]
  );

  const handleReset = useCallback(
    (key: MeasurementKey) => {
      setCustomMeasurements({ [key]: standardValues[key] });
    },
    [setCustomMeasurements, standardValues]
  );

  const isCustom = useCallback(
    (key: MeasurementKey): boolean => {
      return customMeasurements?.[key] !== undefined && customMeasurements[key] !== standardValues[key];
    },
    [customMeasurements, standardValues]
  );

  const unitLabel = useInches ? '″' : 'cm';

  return (
    <div className="measurement-input">
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-4)' }}>
        <h3 className="section-title" style={{ margin: 0 }}>Measurements</h3>
        <div className="toggle-group">
          <button
            className={`toggle-option ${useInches ? 'toggle-option--active' : ''}`}
            onClick={() => setUseInches(true)}
            type="button"
          >
            in
          </button>
          <button
            className={`toggle-option ${!useInches ? 'toggle-option--active' : ''}`}
            onClick={() => setUseInches(false)}
            type="button"
          >
            cm
          </button>
        </div>
      </div>

      <div className="measurement-input__layout">
        {/* Body diagram */}
        <div className="measurement-input__diagram">
          <svg viewBox="0 0 200 260" width="100%" height="100%">
            <path
              d="M70,20 Q100,15 130,20 L135,45 Q145,55 145,80 L140,100 Q130,120 135,140 L140,160 Q145,180 140,200 L130,240 L120,240 L110,200 Q100,195 90,200 L80,240 L70,240 L60,200 Q55,180 60,160 L65,140 Q70,120 60,100 L55,80 Q55,55 65,45 Z"
              fill="rgba(212, 165, 116, 0.04)"
              stroke="rgba(212, 165, 116, 0.2)"
              strokeWidth="1.5"
            />
            <circle cx="100" cy="12" r="10" fill="none" stroke="rgba(212, 165, 116, 0.15)" strokeWidth="1" />

            {MEASUREMENT_FIELDS.map((field) => {
              const point = BODY_DIAGRAM_POINTS[field.key];
              if (!point) return null;
              const isActive = hoveredField === field.key || editingField === field.key;
              const opacity = isActive ? 1 : 0.35;
              const color = isActive ? '#D4A574' : '#807870';

              if (['backWaistLength', 'armLength', 'armholeDepth'].includes(field.key)) {
                const x = field.key === 'backWaistLength' ? 100 : field.key === 'armLength' ? 42 : 155;
                return (
                  <g key={field.key} opacity={opacity}>
                    <line x1={x} y1={45} x2={x} y2={point.y + 60}
                      stroke={color} strokeWidth="1" strokeDasharray="3 3" />
                    <text x={x} y={point.y + 75} textAnchor="middle"
                      fill={color} fontSize="8" fontFamily="Inter">{point.label}</text>
                  </g>
                );
              }

              return (
                <g key={field.key} opacity={opacity}>
                  <line x1="45" y1={point.y} x2="155" y2={point.y}
                    stroke={color} strokeWidth="1" strokeDasharray="3 3" />
                  <text x="165" y={point.y + 3} textAnchor="start"
                    fill={color} fontSize="8" fontFamily="Inter">{point.label}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Measurement table */}
        <div className="measurement-input__table">
          {MEASUREMENT_FIELDS.map((field) => {
            const raw = getMeasurement(field.key);
            const withEase = field.hasEase ? raw + ease : raw;
            const custom = isCustom(field.key);
            const isEditing = editingField === field.key;

            return (
              <div
                key={field.key}
                className={`measurement-row ${custom ? 'measurement-row--custom' : ''} ${
                  hoveredField === field.key ? 'measurement-row--hover' : ''
                }`}
                onMouseEnter={() => setHoveredField(field.key)}
                onMouseLeave={() => setHoveredField(null)}
              >
                <span className="measurement-row__label">{field.label}</span>

                {isEditing ? (
                  <input
                    className="input input--sm"
                    type="number"
                    step="0.1"
                    autoFocus
                    defaultValue={getDisplayValue(raw)}
                    onBlur={(e) => {
                      handleValueChange(field.key, e.target.value);
                      setEditingField(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleValueChange(field.key, (e.target as HTMLInputElement).value);
                        setEditingField(null);
                      }
                      if (e.key === 'Escape') setEditingField(null);
                    }}
                    style={{ width: '80px', textAlign: 'right' }}
                  />
                ) : (
                  <button
                    className="measurement-row__value"
                    onClick={() => setEditingField(field.key)}
                    type="button"
                    title="Click to override"
                  >
                    {getDisplayValue(raw)}{unitLabel}
                  </button>
                )}

                {field.hasEase && (
                  <span className="measurement-row__ease">
                    → {getDisplayValue(withEase)}{unitLabel}
                  </span>
                )}

                {custom && (
                  <button
                    className="measurement-row__reset"
                    onClick={() => handleReset(field.key)}
                    title="Reset to standard"
                    type="button"
                  >
                    ↺
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .measurement-input__layout {
          display: grid;
          grid-template-columns: 180px 1fr;
          gap: var(--space-4);
          align-items: start;
        }
        .measurement-input__diagram {
          aspect-ratio: 200 / 260;
        }
        .measurement-input__table {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }
        .measurement-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-sm);
          transition: background var(--transition-fast);
        }
        .measurement-row--hover,
        .measurement-row:hover {
          background: rgba(212, 165, 116, 0.04);
        }
        .measurement-row--custom {
          background: rgba(91, 138, 138, 0.06);
        }
        .measurement-row__label {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          min-width: 110px;
        }
        .measurement-row__value {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          background: none;
          border: 1px solid transparent;
          border-radius: var(--radius-sm);
          padding: var(--space-1) var(--space-2);
          cursor: pointer;
          transition: all var(--transition-fast);
          min-width: 70px;
          text-align: right;
        }
        .measurement-row__value:hover {
          border-color: var(--color-border-default);
          background: var(--color-bg-hover);
        }
        .measurement-row__ease {
          font-size: var(--font-size-xs);
          color: var(--color-teal-400);
          white-space: nowrap;
        }
        .measurement-row__reset {
          background: none;
          border: none;
          color: var(--color-text-tertiary);
          cursor: pointer;
          padding: var(--space-1);
          font-size: 16px;
          line-height: 1;
          opacity: 0.6;
          transition: opacity var(--transition-fast);
        }
        .measurement-row__reset:hover {
          opacity: 1;
          color: var(--color-warning);
        }
        @media (max-width: 600px) {
          .measurement-input__layout {
            grid-template-columns: 1fr;
          }
          .measurement-input__diagram {
            max-width: 160px;
            margin: 0 auto;
          }
        }
      `}</style>
    </div>
  );
};
