import React, { useState, useCallback } from 'react';
import { useProjectStore } from '../../store/projectStore.ts';
import { GarmentPreview } from './GarmentPreview.tsx';
import type {
  NecklineType,
  SleeveType,
  SleeveConstruction,
  BodyFit,
  BodyShape,
  GarmentLength,
  ShoulderLine,
  HemlineType,
} from '../../types/garment.ts';

/* ==========================================================================
   Sub-step definitions
   ========================================================================== */

const SUB_STEPS = [
  { key: 1, label: 'Block' },
  { key: 2, label: 'Fit' },
  { key: 3, label: 'Neckline' },
  { key: 4, label: 'Sleeves' },
  { key: 5, label: 'Details' },
] as const;

type SubStep = 1 | 2 | 3 | 4 | 5;

/* ==========================================================================
   SVG Icons (inline, lightweight)
   ========================================================================== */

const BodiceIcon = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 6 Q18 4 26 6 L28 22 Q18 24 8 22 Z" />
    <path d="M12 22 L8 22" opacity="0.4" /><path d="M24 22 L28 22" opacity="0.4" />
  </svg>
);
const TorsoIcon = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 6 Q18 4 26 6 L27 28 Q18 30 9 28 Z" />
  </svg>
);
const DressIcon = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4 Q18 3 24 4 L26 16 L30 34 Q18 35 6 34 L10 16 Z" />
  </svg>
);
const CropIcon = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 8 Q18 6 25 8 L26 18 Q18 20 10 18 Z" />
    <line x1="8" y1="22" x2="28" y2="22" strokeDasharray="2 3" opacity="0.3" />
  </svg>
);

/* ==========================================================================
   Helper: option card renderer
   ========================================================================== */

interface CardOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

function OptionGrid<T extends string>({
  options,
  selected,
  onSelect,
  columns,
  disabled,
}: {
  options: CardOption<T>[];
  selected: T;
  onSelect: (v: T) => void;
  columns?: number;
  disabled?: boolean;
}) {
  return (
    <div
      className="sc-option-grid"
      style={columns ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : undefined}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`selector-card card--interactive${selected === opt.value ? ' selector-card--selected' : ''}${disabled ? ' sc-card-disabled' : ''}`}
          onClick={() => !disabled && onSelect(opt.value)}
          disabled={disabled}
          aria-pressed={selected === opt.value}
        >
          {opt.icon && <div className="selector-card__icon">{opt.icon}</div>}
          <span className="selector-card__label">{opt.label}</span>
          {opt.description && (
            <span className="sc-card-desc">{opt.description}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ==========================================================================
   Sub-step 1: Block Type
   ========================================================================== */

const BLOCK_OPTIONS: CardOption<GarmentLength>[] = [
  { value: 'waist', label: 'Bodice', icon: <BodiceIcon />, description: 'To waist' },
  { value: 'hip', label: 'Torso', icon: <TorsoIcon />, description: 'To hip' },
  { value: 'tunic', label: 'Dress', icon: <DressIcon />, description: 'Knee +' },
  { value: 'crop', label: 'Crop', icon: <CropIcon />, description: 'Above waist' },
];

const BlockStep: React.FC = () => {
  const garmentLength = useProjectStore((s) => s.style.garmentLength);
  const setStyle = useProjectStore((s) => s.setStyle);

  return (
    <div className="sc-substep-content">
      <h3 className="sc-substep-title">Block Type</h3>
      <p className="sc-substep-desc">Choose the base silhouette length for your garment.</p>
      <OptionGrid
        options={BLOCK_OPTIONS}
        selected={garmentLength}
        onSelect={(v) => setStyle({ garmentLength: v })}
        columns={4}
      />
    </div>
  );
};

/* ==========================================================================
   Sub-step 2: Fit & Ease
   ========================================================================== */

const FIT_OPTIONS: CardOption<BodyFit>[] = [
  { value: 'fitted', label: 'Fitted' },
  { value: 'standard', label: 'Semi-fitted' },
  { value: 'relaxed', label: 'Relaxed' },
  { value: 'oversized', label: 'Oversized' },
];

const SHAPE_OPTIONS: CardOption<BodyShape>[] = [
  { value: 'straight', label: 'Straight' },
  { value: 'a-line', label: 'A-Line' },
];

const FitStep: React.FC = () => {
  const bodyFit = useProjectStore((s) => s.style.bodyFit);
  const bodyShape = useProjectStore((s) => s.style.bodyShape);
  const waistShaping = useProjectStore((s) => s.waistShaping);
  const ease = useProjectStore((s) => s.ease);
  const setStyle = useProjectStore((s) => s.setStyle);
  const setWaistShaping = useProjectStore((s) => s.setWaistShaping);
  const setEase = useProjectStore((s) => s.setEase);

  const canShapeWaist = bodyFit === 'fitted' || bodyFit === 'standard';

  return (
    <div className="sc-substep-content">
      <h3 className="sc-substep-title">Fit &amp; Ease</h3>
      <p className="sc-substep-desc">Define how the garment sits on the body.</p>

      <div className="sc-section">
        <span className="sc-label">Fit</span>
        <OptionGrid
          options={FIT_OPTIONS}
          selected={bodyFit}
          onSelect={(v) => setStyle({ bodyFit: v })}
          columns={4}
        />
      </div>

      <div className="sc-section sc-row">
        <div className="sc-toggle-row">
          <span className="sc-label">Waist Shaping</span>
          <button
            type="button"
            className={`sc-toggle${waistShaping && canShapeWaist ? ' sc-toggle--on' : ''}`}
            onClick={() => canShapeWaist && setWaistShaping(!waistShaping)}
            disabled={!canShapeWaist}
            aria-pressed={waistShaping && canShapeWaist}
            title={canShapeWaist ? undefined : 'Only available for Fitted / Semi-fitted'}
          >
            <span className="sc-toggle__thumb" />
          </button>
          {!canShapeWaist && (
            <span className="sc-hint">Fitted / Semi-fitted only</span>
          )}
        </div>
      </div>

      <div className="sc-section">
        <div className="slider-group">
          <div className="slider-group__label">
            <span>Ease</span>
            <span className="slider-group__value">{ease.toFixed(1)}″</span>
          </div>
          <input
            type="range"
            min={0}
            max={8}
            step={0.5}
            value={ease}
            onChange={(e) => setEase(parseFloat(e.target.value))}
          />
          <div className="sc-range-labels">
            <span>0″</span><span>4″</span><span>8″</span>
          </div>
        </div>
      </div>

      <div className="sc-section">
        <span className="sc-label">Body Shape</span>
        <OptionGrid
          options={SHAPE_OPTIONS}
          selected={bodyShape}
          onSelect={(v) => setStyle({ bodyShape: v })}
          columns={2}
        />
      </div>
    </div>
  );
};

/* ==========================================================================
   Sub-step 3: Neckline
   ========================================================================== */

const NECKLINE_OPTIONS: CardOption<NecklineType>[] = [
  { value: 'crew', label: 'Crew' },
  { value: 'v-neck', label: 'V-Neck' },
  { value: 'scoop', label: 'Scoop' },
  { value: 'boat', label: 'Boat' },
  { value: 'mock', label: 'Mock' },
  { value: 'turtle', label: 'Turtle' },
  { value: 'square', label: 'Square' },
];

const NecklineStep: React.FC = () => {
  const neckline = useProjectStore((s) => s.style.neckline);
  const necklineDepth = useProjectStore((s) => s.necklineDepth);
  const necklineWidth = useProjectStore((s) => s.necklineWidth);
  const setStyle = useProjectStore((s) => s.setStyle);
  const setNecklineDepth = useProjectStore((s) => s.setNecklineDepth);
  const setNecklineWidth = useProjectStore((s) => s.setNecklineWidth);

  return (
    <div className="sc-substep-content">
      <h3 className="sc-substep-title">Neckline</h3>
      <p className="sc-substep-desc">Pick a neckline shape, then adjust depth and width.</p>

      <div className="sc-section">
        <OptionGrid
          options={NECKLINE_OPTIONS}
          selected={neckline}
          onSelect={(v) => setStyle({ neckline: v })}
          columns={4}
        />
      </div>

      <div className="sc-section sc-slider-pair">
        <div className="slider-group">
          <div className="slider-group__label">
            <span>Depth</span>
            <span className="slider-group__value">
              {necklineDepth <= 0.33 ? 'Shallow' : necklineDepth <= 0.66 ? 'Medium' : 'Deep'}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={necklineDepth}
            onChange={(e) => setNecklineDepth(parseFloat(e.target.value))}
          />
          <div className="sc-range-labels">
            <span>Shallow</span><span>Deep</span>
          </div>
        </div>
        <div className="slider-group">
          <div className="slider-group__label">
            <span>Width</span>
            <span className="slider-group__value">
              {necklineWidth <= 0.33 ? 'Narrow' : necklineWidth <= 0.66 ? 'Medium' : 'Wide'}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={necklineWidth}
            onChange={(e) => setNecklineWidth(parseFloat(e.target.value))}
          />
          <div className="sc-range-labels">
            <span>Narrow</span><span>Wide</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   Sub-step 4: Sleeves
   ========================================================================== */

const SLEEVE_LENGTH_OPTIONS: CardOption<SleeveType>[] = [
  { value: 'sleeveless', label: 'None' },
  { value: 'cap', label: 'Cap' },
  { value: 'short', label: 'Short' },
  { value: 'three-quarter', label: '¾ Length' },
  { value: 'long', label: 'Long' },
];

const SLEEVE_CONSTRUCTION_OPTIONS: CardOption<SleeveConstruction>[] = [
  { value: 'set-in', label: 'Set-in' },
  { value: 'raglan', label: 'Raglan' },
  { value: 'dolman', label: 'Dolman' },
  { value: 'drop-shoulder', label: 'Drop Shoulder' },
];

const SleeveStep: React.FC = () => {
  const sleeve = useProjectStore((s) => s.style.sleeve);
  const sleeveConstruction = useProjectStore((s) => s.style.sleeveConstruction);
  const sleeveWidth = useProjectStore((s) => s.sleeveWidth);
  const setStyle = useProjectStore((s) => s.setStyle);
  const setSleeveWidth = useProjectStore((s) => s.setSleeveWidth);

  const hasSleeves = sleeve !== 'sleeveless';

  const widthLabel = sleeveWidth <= 0.25
    ? 'Fitted'
    : sleeveWidth <= 0.5
      ? 'Standard'
      : sleeveWidth <= 0.75
        ? 'Wide'
        : 'Bell';

  return (
    <div className="sc-substep-content">
      <h3 className="sc-substep-title">Sleeves</h3>
      <p className="sc-substep-desc">Set sleeve length, construction style, and width.</p>

      <div className="sc-section">
        <span className="sc-label">Length</span>
        <OptionGrid
          options={SLEEVE_LENGTH_OPTIONS}
          selected={sleeve}
          onSelect={(v) => setStyle({ sleeve: v })}
          columns={5}
        />
      </div>

      {hasSleeves && (
        <>
          <div className="sc-section sc-anim-slide">
            <span className="sc-label">Construction</span>
            <OptionGrid
              options={SLEEVE_CONSTRUCTION_OPTIONS}
              selected={sleeveConstruction}
              onSelect={(v) => setStyle({ sleeveConstruction: v })}
              columns={4}
            />
          </div>

          <div className="sc-section sc-anim-slide">
            <div className="slider-group">
              <div className="slider-group__label">
                <span>Sleeve Width</span>
                <span className="slider-group__value">{widthLabel}</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={sleeveWidth}
                onChange={(e) => setSleeveWidth(parseFloat(e.target.value))}
              />
              <div className="sc-range-labels">
                <span>Fitted</span><span>Standard</span><span>Wide</span><span>Bell</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* ==========================================================================
   Sub-step 5: Details & Summary
   ========================================================================== */

const SHOULDER_OPTIONS: CardOption<ShoulderLine>[] = [
  { value: 'natural', label: 'Natural' },
  { value: 'extended', label: 'Extended' },
  { value: 'dropped', label: 'Dropped' },
];

const HEMLINE_OPTIONS: CardOption<HemlineType>[] = [
  { value: 'straight', label: 'Straight' },
  { value: 'curved', label: 'Curved' },
];

const DetailsStep: React.FC = () => {
  const style = useProjectStore((s) => s.style);
  const ease = useProjectStore((s) => s.ease);
  const waistShaping = useProjectStore((s) => s.waistShaping);
  const necklineDepth = useProjectStore((s) => s.necklineDepth);
  const necklineWidth = useProjectStore((s) => s.necklineWidth);
  const sleeveWidth = useProjectStore((s) => s.sleeveWidth);
  const setStyle = useProjectStore((s) => s.setStyle);

  const summary = [
    { key: 'Block', value: style.garmentLength },
    { key: 'Fit', value: style.bodyFit },
    { key: 'Shape', value: style.bodyShape },
    { key: 'Ease', value: `${ease.toFixed(1)}″` },
    { key: 'Waist Shaping', value: waistShaping ? 'On' : 'Off' },
    { key: 'Neckline', value: style.neckline },
    { key: 'Neck Depth', value: necklineDepth <= 0.33 ? 'Shallow' : necklineDepth <= 0.66 ? 'Medium' : 'Deep' },
    { key: 'Neck Width', value: necklineWidth <= 0.33 ? 'Narrow' : necklineWidth <= 0.66 ? 'Medium' : 'Wide' },
    { key: 'Sleeve', value: style.sleeve },
    { key: 'Construction', value: style.sleeve === 'sleeveless' ? '—' : style.sleeveConstruction },
    { key: 'Sleeve Width', value: sleeveWidth <= 0.25 ? 'Fitted' : sleeveWidth <= 0.5 ? 'Standard' : sleeveWidth <= 0.75 ? 'Wide' : 'Bell' },
    { key: 'Shoulder', value: style.shoulderLine },
    { key: 'Hemline', value: style.hemline },
  ];

  return (
    <div className="sc-substep-content">
      <h3 className="sc-substep-title">Details &amp; Summary</h3>
      <p className="sc-substep-desc">Final touches — shoulder and hemline — plus a summary of all choices.</p>

      <div className="sc-section">
        <span className="sc-label">Shoulder Line</span>
        <OptionGrid
          options={SHOULDER_OPTIONS}
          selected={style.shoulderLine}
          onSelect={(v) => setStyle({ shoulderLine: v })}
          columns={3}
        />
      </div>

      <div className="sc-section">
        <span className="sc-label">Hemline</span>
        <OptionGrid
          options={HEMLINE_OPTIONS}
          selected={style.hemline}
          onSelect={(v) => setStyle({ hemline: v })}
          columns={2}
        />
      </div>

      <div className="sc-section">
        <span className="sc-label">Summary</span>
        <div className="sc-summary-grid">
          {summary.map((item) => (
            <div key={item.key} className="sc-summary-item">
              <span className="sc-summary-key">{item.key}</span>
              <span className="sc-summary-val">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   Sub-step components map
   ========================================================================== */

const STEP_COMPONENTS: Record<SubStep, React.FC> = {
  1: BlockStep,
  2: FitStep,
  3: NecklineStep,
  4: SleeveStep,
  5: DetailsStep,
};

/* ==========================================================================
   Summary breadcrumb helpers
   ========================================================================== */

function useSummaryChips(): string[] {
  const style = useProjectStore((s) => s.style);
  const ease = useProjectStore((s) => s.ease);
  const chips: string[] = [];
  chips.push(style.garmentLength);
  chips.push(style.bodyFit);
  chips.push(style.neckline);
  if (style.sleeve !== 'sleeveless') {
    chips.push(`${style.sleeve} sleeve`);
  } else {
    chips.push('sleeveless');
  }
  chips.push(`${ease.toFixed(1)}″ ease`);
  return chips;
}

/* ==========================================================================
   Main: StyleConfigurator
   ========================================================================== */

export const StyleConfigurator: React.FC = () => {
  const nextStep = useProjectStore((s) => s.nextStep);
  const [subStep, setSubStep] = useState<SubStep>(1);
  const [direction, setDirection] = useState<'right' | 'left'>('right');

  const summaryChips = useSummaryChips();

  const goTo = useCallback((target: SubStep) => {
    setDirection(target > subStep ? 'right' : 'left');
    setSubStep(target);
  }, [subStep]);

  const goNext = useCallback(() => {
    if (subStep < 5) {
      setDirection('right');
      setSubStep((s) => (s + 1) as SubStep);
    } else {
      nextStep();
    }
  }, [subStep, nextStep]);

  const goBack = useCallback(() => {
    if (subStep > 1) {
      setDirection('left');
      setSubStep((s) => (s - 1) as SubStep);
    }
  }, [subStep]);

  const StepComponent = STEP_COMPONENTS[subStep];

  return (
    <div className="sc-root step-content">
      <h2 className="sc-heading">Design Your Garment</h2>

      {/* ---- Sub-tab bar ---- */}
      <nav className="sc-tabs" role="tablist" aria-label="Style sub-steps">
        {SUB_STEPS.map(({ key, label }) => {
          const isCompleted = key < subStep;
          const isActive = key === subStep;
          return (
            <button
              key={key}
              role="tab"
              type="button"
              className={`sc-tab${isActive ? ' sc-tab--active' : ''}${isCompleted ? ' sc-tab--completed' : ''}`}
              aria-selected={isActive}
              onClick={() => goTo(key as SubStep)}
            >
              <span className="sc-tab__indicator">
                {isCompleted ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15" />
                    <path d="M4 7.2L6 9.2L10 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : isActive ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="7" cy="7" r="2.5" fill="currentColor" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                )}
              </span>
              <span className="sc-tab__label">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* ---- Main layout: options + preview ---- */}
      <div className="sc-layout">
        {/* Left: active sub-step */}
        <div className="sc-options">
          <div className="card" key={subStep}>
            <div className={`sc-panel sc-panel--${direction}`}>
              <StepComponent />
            </div>
          </div>
        </div>

        {/* Right: live preview */}
        <div className="sc-preview card">
          <h3 className="section-title" style={{ textAlign: 'center' }}>Preview</h3>
          <GarmentPreview />
          <p className="text-xs text-center" style={{ color: 'var(--color-text-tertiary)', marginTop: 'var(--space-4)' }}>
            Front view • Updates as you make selections
          </p>
        </div>
      </div>

      {/* ---- Bottom bar: breadcrumb + nav ---- */}
      <div className="sc-bottom-bar">
        <div className="sc-breadcrumb">
          {summaryChips.map((chip, i) => (
            <span key={i} className="sc-chip">{chip}</span>
          ))}
        </div>
        <div className="sc-nav-buttons">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={goBack}
            disabled={subStep === 1}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={goNext}
          >
            {subStep < 5 ? 'Next' : 'Continue to Sizing'}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* ================================================================
         Scoped styles
         ================================================================ */}
      <style>{`
        /* ---- Root ---- */
        .sc-root {
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
        }
        .sc-heading {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        /* ---- Tab bar ---- */
        .sc-tabs {
          display: flex;
          gap: var(--space-1);
          padding: var(--space-1);
          background: var(--color-bg-surface);
          border-radius: var(--radius-md);
          overflow-x: auto;
        }
        .sc-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          min-height: 42px;
          padding: var(--space-2) var(--space-3);
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
          color: var(--color-text-tertiary);
          white-space: nowrap;
        }
        .sc-tab:hover {
          color: var(--color-text-secondary);
          background: rgba(255,255,255,0.03);
        }
        .sc-tab--active {
          color: var(--color-amber-300);
          background: var(--color-bg-elevated);
          box-shadow: var(--shadow-sm);
        }
        .sc-tab--completed {
          color: var(--color-success);
        }
        .sc-tab__indicator {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }
        .sc-tab__label {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          letter-spacing: var(--letter-spacing-wide);
        }

        /* ---- Layout ---- */
        .sc-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: var(--space-6);
          align-items: start;
        }
        .sc-options {
          min-width: 0;
        }
        .sc-preview {
          position: sticky;
          top: calc(var(--header-height) + var(--space-6));
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        @media (max-width: 900px) {
          .sc-layout {
            grid-template-columns: 1fr;
          }
          .sc-preview {
            position: static;
            order: -1;
          }
        }

        /* ---- Panel slide animation ---- */
        @keyframes scSlideInRight {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes scSlideInLeft {
          from { opacity: 0; transform: translateX(-24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .sc-panel {
          animation-duration: 350ms;
          animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          animation-fill-mode: both;
        }
        .sc-panel--right { animation-name: scSlideInRight; }
        .sc-panel--left  { animation-name: scSlideInLeft; }

        .sc-anim-slide {
          animation: scSlideInRight 300ms cubic-bezier(0.4,0,0.2,1) both;
        }

        /* ---- Sub-step content ---- */
        .sc-substep-content {
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
        }
        .sc-substep-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }
        .sc-substep-desc {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          margin-top: calc(-1 * var(--space-3));
        }
        .sc-section {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        .sc-label {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: var(--letter-spacing-wider);
        }
        .sc-hint {
          font-size: var(--font-size-xs);
          color: var(--color-text-tertiary);
        }

        /* ---- Option grid ---- */
        .sc-option-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          gap: var(--space-3);
        }
        .sc-card-desc {
          font-size: var(--font-size-xs);
          color: var(--color-text-tertiary);
          margin-top: calc(-1 * var(--space-1));
        }
        .sc-card-disabled {
          opacity: 0.4;
          cursor: not-allowed !important;
          pointer-events: none;
        }

        /* ---- Slider pair ---- */
        .sc-slider-pair {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-6);
        }
        @media (max-width: 600px) {
          .sc-slider-pair {
            grid-template-columns: 1fr;
          }
        }
        .sc-range-labels {
          display: flex;
          justify-content: space-between;
          font-size: var(--font-size-xs);
          color: var(--color-text-tertiary);
          margin-top: calc(-1 * var(--space-1));
        }

        /* ---- Toggle switch ---- */
        .sc-toggle-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }
        .sc-toggle {
          position: relative;
          width: 44px;
          height: 24px;
          background: var(--color-bg-surface);
          border: 1.5px solid var(--color-border-default);
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: all var(--transition-fast);
          padding: 0;
          flex-shrink: 0;
        }
        .sc-toggle:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .sc-toggle__thumb {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 18px;
          height: 18px;
          background: var(--color-text-tertiary);
          border-radius: 50%;
          transition: all var(--transition-fast);
        }
        .sc-toggle--on {
          background: rgba(212, 165, 116, 0.15);
          border-color: var(--color-amber-300);
        }
        .sc-toggle--on .sc-toggle__thumb {
          left: 22px;
          background: var(--color-amber-300);
        }

        /* ---- Bottom bar ---- */
        .sc-bottom-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-4);
          padding: var(--space-4) var(--space-5);
          background: var(--glass-bg);
          backdrop-filter: blur(var(--glass-blur));
          -webkit-backdrop-filter: blur(var(--glass-blur));
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          flex-wrap: wrap;
        }
        .sc-breadcrumb {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
        }
        .sc-chip {
          display: inline-flex;
          align-items: center;
          padding: var(--space-1) var(--space-3);
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-full);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-secondary);
          text-transform: capitalize;
          letter-spacing: var(--letter-spacing-wide);
          white-space: nowrap;
        }
        .sc-nav-buttons {
          display: flex;
          gap: var(--space-3);
          flex-shrink: 0;
        }

        /* ---- Summary grid ---- */
        .sc-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: var(--space-2);
        }
        .sc-summary-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: var(--space-2) var(--space-3);
          background: var(--color-bg-surface);
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-border-subtle);
        }
        .sc-summary-key {
          font-size: var(--font-size-xs);
          color: var(--color-text-tertiary);
          text-transform: uppercase;
          letter-spacing: var(--letter-spacing-wider);
        }
        .sc-summary-val {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-amber-200);
          text-transform: capitalize;
        }

        .sc-row {
          flex-direction: row !important;
        }
      `}</style>
    </div>
  );
};
