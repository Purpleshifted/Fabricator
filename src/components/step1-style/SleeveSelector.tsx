import React, { useCallback } from 'react';
import { useProjectStore } from '../../store/projectStore.ts';
import type { SleeveType, SleeveConstruction } from '../../types/garment.ts';

interface SleeveLengthOption {
  value: SleeveType;
  label: string;
}

interface SleeveConstructionOption {
  value: SleeveConstruction;
  label: string;
}

const SLEEVE_LENGTH_OPTIONS: SleeveLengthOption[] = [
  { value: 'sleeveless', label: 'None' },
  { value: 'cap', label: 'Cap' },
  { value: 'short', label: 'Short' },
  { value: 'three-quarter', label: '¾' },
  { value: 'long', label: 'Long' },
];

const CONSTRUCTION_OPTIONS: SleeveConstructionOption[] = [
  { value: 'set-in', label: 'Set-in' },
  { value: 'raglan', label: 'Raglan' },
  { value: 'dolman', label: 'Dolman' },
  { value: 'drop-shoulder', label: 'Drop' },
];

const SleeveLengthIcon: React.FC<{ type: SleeveType; selected: boolean }> = ({ type, selected }) => {
  const stroke = selected ? '#D4A574' : '#807870';
  const w = 36;
  const h = 32;

  const sleeveExtent: Record<SleeveType, number> = {
    sleeveless: 0,
    cap: 6,
    short: 12,
    'three-quarter': 20,
    long: 28,
  };
  const ext = sleeveExtent[type];

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <rect x="10" y="8" width="16" height="22" rx="2" stroke={stroke} strokeWidth="1.5" />
      <line x1="10" y1="10" x2="26" y2="10" stroke={stroke} strokeWidth="1.5" />
      {ext > 0 && (
        <rect x={10 - Math.min(ext, 8)} y="8" width={Math.min(ext, 8)} height={Math.min(ext, 22)} rx="1"
          stroke={stroke} strokeWidth="1.5" opacity="0.8" />
      )}
      {ext > 0 && (
        <rect x="26" y="8" width={Math.min(ext, 8)} height={Math.min(ext, 22)} rx="1"
          stroke={stroke} strokeWidth="1.5" opacity="0.8" />
      )}
    </svg>
  );
};

const ConstructionIcon: React.FC<{ type: SleeveConstruction; selected: boolean }> = ({ type, selected }) => {
  const stroke = selected ? '#D4A574' : '#807870';
  const w = 36;
  const h = 28;

  const paths: Record<SleeveConstruction, string> = {
    'set-in': `M4,12 Q4,8 10,8 L26,8 Q32,8 32,12 L32,${h} L4,${h} Z`,
    'raglan': `M4,${h} L10,4 L26,4 L32,${h} Z`,
    'dolman': `M2,${h} L2,4 L14,4 Q18,4 18,8 L18,${h} Z M18,${h} L18,8 Q18,4 22,4 L34,4 L34,${h} Z`,
    'drop-shoulder': `M2,12 L2,8 L34,8 L34,12 L28,12 L28,${h} L8,${h} L8,12 Z`,
  };

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <path d={paths[type]} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
};

export const SleeveSelector: React.FC = () => {
  const sleeve = useProjectStore((s) => s.style.sleeve);
  const sleeveConstruction = useProjectStore((s) => s.style.sleeveConstruction);
  const setStyle = useProjectStore((s) => s.setStyle);

  const handleLengthSelect = useCallback(
    (value: SleeveType) => {
      setStyle({ sleeve: value });
    },
    [setStyle]
  );

  const handleConstructionSelect = useCallback(
    (value: SleeveConstruction) => {
      setStyle({ sleeveConstruction: value });
    },
    [setStyle]
  );

  return (
    <div className="sleeve-selector">
      <h3 className="section-title">Sleeves</h3>

      <div className="selector-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {SLEEVE_LENGTH_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`selector-card ${sleeve === opt.value ? 'selector-card--selected' : ''}`}
            onClick={() => handleLengthSelect(opt.value)}
            type="button"
          >
            <div className="selector-card__icon">
              <SleeveLengthIcon type={opt.value} selected={sleeve === opt.value} />
            </div>
            <span className="selector-card__label">{opt.label}</span>
          </button>
        ))}
      </div>

      {sleeve !== 'sleeveless' && (
        <div style={{ marginTop: 'var(--space-5)' }} className="anim-fade-in">
          <h4 className="section-title" style={{ fontSize: 'var(--font-size-xs)', marginBottom: 'var(--space-3)' }}>
            Construction
          </h4>
          <div className="selector-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {CONSTRUCTION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`selector-card ${sleeveConstruction === opt.value ? 'selector-card--selected' : ''}`}
                onClick={() => handleConstructionSelect(opt.value)}
                type="button"
              >
                <div className="selector-card__icon">
                  <ConstructionIcon type={opt.value} selected={sleeveConstruction === opt.value} />
                </div>
                <span className="selector-card__label">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
