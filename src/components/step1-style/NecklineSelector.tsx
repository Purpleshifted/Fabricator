import React, { useCallback } from 'react';
import { useProjectStore } from '../../store/projectStore.ts';
import type { NecklineType } from '../../types/garment.ts';

interface NecklineOption {
  value: NecklineType;
  label: string;
}

const NECKLINE_OPTIONS: NecklineOption[] = [
  { value: 'crew', label: 'Crew' },
  { value: 'v-neck', label: 'V-Neck' },
  { value: 'scoop', label: 'Scoop' },
  { value: 'boat', label: 'Boat' },
  { value: 'mock', label: 'Mock' },
  { value: 'turtle', label: 'Turtle' },
  { value: 'square', label: 'Square' },
];

const NecklineIcon: React.FC<{ shape: NecklineType; selected: boolean }> = ({ shape, selected }) => {
  const stroke = selected ? '#D4A574' : '#807870';
  const w = 36;
  const h = 28;

  const paths: Record<NecklineType, string> = {
    'crew': `M4,${h} L4,8 Q${w / 2},2 ${w - 4},8 L${w - 4},${h}`,
    'v-neck': `M4,${h} L4,6 L${w / 2},20 L${w - 4},6 L${w - 4},${h}`,
    'scoop': `M4,${h} L4,6 Q${w / 2},22 ${w - 4},6 L${w - 4},${h}`,
    'boat': `M4,${h} L4,6 L${w - 4},6 L${w - 4},${h}`,
    'mock': `M4,${h} L4,4 Q${w / 2},0 ${w - 4},4 L${w - 4},${h} M6,4 Q${w / 2},0 ${w - 6},4`,
    'turtle': `M4,${h} L4,4 Q${w / 2},-2 ${w - 4},4 L${w - 4},${h} M5,4 Q${w / 2},-1 ${w - 5},4 M6,5 Q${w / 2},1 ${w - 6},5`,
    'square': `M4,${h} L4,6 L12,6 L12,14 L${w - 12},14 L${w - 12},6 L${w - 4},6 L${w - 4},${h}`,
  };

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <path d={paths[shape]} stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const NecklineSelector: React.FC = () => {
  const neckline = useProjectStore((s) => s.style.neckline);
  const setStyle = useProjectStore((s) => s.setStyle);

  const handleSelect = useCallback(
    (value: NecklineType) => {
      setStyle({ neckline: value });
    },
    [setStyle]
  );

  return (
    <div className="neckline-selector">
      <h3 className="section-title">Neckline</h3>
      <div className="selector-grid">
        {NECKLINE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`selector-card ${neckline === opt.value ? 'selector-card--selected' : ''}`}
            onClick={() => handleSelect(opt.value)}
            type="button"
          >
            <div className="selector-card__icon">
              <NecklineIcon shape={opt.value} selected={neckline === opt.value} />
            </div>
            <span className="selector-card__label">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
