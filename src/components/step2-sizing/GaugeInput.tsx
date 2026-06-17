import React, { useState, useCallback, useMemo } from 'react';
import { useProjectStore } from '../../store/projectStore.ts';
import { GAUGE_PRESETS } from '../../types/index.ts';
import type { GaugePreset } from '../../types/index.ts';
import type { GaugeConfig } from '../../types/project.ts';

type GaugeTab = 'presets' | 'swatch' | 'quick';

export const GaugeInput: React.FC = () => {
  const gauge = useProjectStore((s) => s.gauge);
  const setGauge = useProjectStore((s) => s.setGauge);
  const [activeTab, setActiveTab] = useState<GaugeTab>('presets');

  // Swatch inputs
  const [swatchMeshes, setSwatchMeshes] = useState('16');
  const [swatchMeshWidth, setSwatchMeshWidth] = useState('2');
  const [swatchRows, setSwatchRows] = useState('16');
  const [swatchRowHeight, setSwatchRowHeight] = useState('2');

  // Quick measure inputs
  const [chainCount, setChainCount] = useState('30');
  const [chainMeasure, setChainMeasure] = useState('4');
  const [quickUnit, setQuickUnit] = useState<'in' | 'cm'>('in');

  const handlePresetSelect = useCallback(
    (preset: GaugePreset) => {
      setGauge({
        meshPerInchH: preset.meshPerInchH,
        meshPerInchV: preset.meshPerInchV,
        threadWeight: preset.threadWeight,
        hookSize: preset.hookSize,
        source: 'preset',
      } satisfies GaugeConfig);
    },
    [setGauge]
  );

  const handleSwatchCalculate = useCallback(() => {
    const meshes = parseFloat(swatchMeshes);
    const width = parseFloat(swatchMeshWidth); // in inches
    const rows = parseFloat(swatchRows);
    const height = parseFloat(swatchRowHeight); // in inches

    if (meshes > 0 && width > 0 && rows > 0 && height > 0) {
      setGauge({
        meshPerInchH: parseFloat((meshes / width).toFixed(1)),
        meshPerInchV: parseFloat((rows / height).toFixed(1)),
        source: 'swatch',
      });
    }
  }, [swatchMeshes, swatchMeshWidth, swatchRows, swatchRowHeight, setGauge]);

  const handleQuickCalculate = useCallback(() => {
    const chains = parseFloat(chainCount);
    let measure = parseFloat(chainMeasure);
    if (quickUnit === 'cm') measure = measure / 2.54; // convert to inches

    if (chains > 0 && measure > 0) {
      // In filet crochet, each mesh ≈ 3 chains
      const approxMeshes = Math.floor((chains - 1) / 3);
      const meshPerInch = parseFloat((approxMeshes / measure).toFixed(1));
      setGauge({
        meshPerInchH: meshPerInch,
        meshPerInchV: meshPerInch, // assume square for quick
        source: 'chain-measure',
      });
    }
  }, [chainCount, chainMeasure, quickUnit, setGauge]);

  // Estimated grid for a medium garment body (~18in wide, ~24in tall)
  const estimatedGrid = useMemo(() => {
    const bodyWidth = 18; // inches
    const bodyHeight = 24; // inches
    return {
      gridW: Math.round(bodyWidth * gauge.meshPerInchH),
      gridH: Math.round(bodyHeight * gauge.meshPerInchV),
    };
  }, [gauge]);

  return (
    <div className="gauge-input">
      <h3 className="section-title">Gauge</h3>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 'var(--space-4)' }}>
        <button className={`tab ${activeTab === 'presets' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('presets')} type="button">Presets</button>
        <button className={`tab ${activeTab === 'swatch' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('swatch')} type="button">Swatch</button>
        <button className={`tab ${activeTab === 'quick' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('quick')} type="button">Quick</button>
      </div>

      {/* Tab content */}
      <div className="gauge-input__content anim-fade-in" key={activeTab}>
        {activeTab === 'presets' && (
          <div className="gauge-presets">
            {GAUGE_PRESETS.map((preset) => {
              const isSelected =
                gauge.threadWeight === preset.threadWeight &&
                gauge.hookSize === preset.hookSize;
              return (
                <button
                  key={preset.name}
                  className={`gauge-preset-card ${isSelected ? 'gauge-preset-card--selected' : ''}`}
                  onClick={() => handlePresetSelect(preset)}
                  type="button"
                >
                  <span className="gauge-preset-card__name">{preset.name}</span>
                  <span className="gauge-preset-card__gauge">
                    {preset.meshPerInchH} × {preset.meshPerInchV} per inch
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {activeTab === 'swatch' && (
          <div className="gauge-swatch">
            <p className="text-sm" style={{ color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-4)' }}>
              Enter your swatch measurements to calculate gauge
            </p>
            <div className="gauge-swatch__grid">
              <div className="input-group">
                <label className="input-group__label">Meshes wide</label>
                <input className="input input--sm" type="number" value={swatchMeshes}
                  onChange={(e) => setSwatchMeshes(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-group__label">Width (inches)</label>
                <input className="input input--sm" type="number" value={swatchMeshWidth}
                  onChange={(e) => setSwatchMeshWidth(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-group__label">Rows tall</label>
                <input className="input input--sm" type="number" value={swatchRows}
                  onChange={(e) => setSwatchRows(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-group__label">Height (inches)</label>
                <input className="input input--sm" type="number" value={swatchRowHeight}
                  onChange={(e) => setSwatchRowHeight(e.target.value)} />
              </div>
            </div>
            <button className="btn btn-teal btn-sm" onClick={handleSwatchCalculate} type="button"
              style={{ marginTop: 'var(--space-4)' }}>Calculate</button>
          </div>
        )}

        {activeTab === 'quick' && (
          <div className="gauge-quick">
            <p className="text-sm" style={{ color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-4)' }}>
              Quick estimate from a foundation chain
            </p>
            <div className="gauge-quick__fields">
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>I chained</span>
              <input className="input input--sm" type="number" value={chainCount}
                onChange={(e) => setChainCount(e.target.value)} style={{ width: '72px' }} />
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>stitches and it measures</span>
              <input className="input input--sm" type="number" value={chainMeasure}
                onChange={(e) => setChainMeasure(e.target.value)} style={{ width: '72px' }} />
              <div className="toggle-group">
                <button className={`toggle-option ${quickUnit === 'in' ? 'toggle-option--active' : ''}`}
                  onClick={() => setQuickUnit('in')} type="button">in</button>
                <button className={`toggle-option ${quickUnit === 'cm' ? 'toggle-option--active' : ''}`}
                  onClick={() => setQuickUnit('cm')} type="button">cm</button>
              </div>
            </div>
            <button className="btn btn-teal btn-sm" onClick={handleQuickCalculate} type="button"
              style={{ marginTop: 'var(--space-4)' }}>Estimate Gauge</button>
          </div>
        )}
      </div>

      {/* Current gauge summary */}
      <div className="gauge-summary">
        <div className="gauge-summary__item">
          <span className="gauge-summary__label">Horizontal</span>
          <span className="gauge-summary__value">{gauge.meshPerInchH} mesh/in</span>
        </div>
        <div className="gauge-summary__item">
          <span className="gauge-summary__label">Vertical</span>
          <span className="gauge-summary__value">{gauge.meshPerInchV} row/in</span>
        </div>
        <div className="gauge-summary__item">
          <span className="gauge-summary__label">Est. grid</span>
          <span className="gauge-summary__value">{estimatedGrid.gridW} × {estimatedGrid.gridH}</span>
        </div>
      </div>

      <style>{`
        .gauge-input__content { min-height: 160px; }
        .gauge-presets { display: flex; flex-direction: column; gap: var(--space-2); }
        .gauge-preset-card {
          display: flex; justify-content: space-between; align-items: center;
          padding: var(--space-3) var(--space-4);
          background: var(--color-bg-surface); border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-sm); cursor: pointer;
          transition: all var(--transition-fast); text-align: left;
          min-height: var(--touch-target);
        }
        .gauge-preset-card:hover { border-color: var(--color-border-default); background: var(--color-bg-hover); }
        .gauge-preset-card--selected { border-color: var(--color-teal-400); background: rgba(91, 138, 138, 0.08); }
        .gauge-preset-card__name { font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--color-text-primary); }
        .gauge-preset-card__gauge { font-size: var(--font-size-xs); color: var(--color-text-tertiary); }
        .gauge-preset-card--selected .gauge-preset-card__name { color: var(--color-teal-300); }
        .gauge-swatch__grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
        .gauge-quick__fields { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2); }
        .gauge-summary {
          display: flex; gap: var(--space-6); margin-top: var(--space-5);
          padding-top: var(--space-4); border-top: 1px solid var(--color-border-subtle);
        }
        .gauge-summary__item { display: flex; flex-direction: column; gap: var(--space-1); }
        .gauge-summary__label {
          font-size: var(--font-size-xs); color: var(--color-text-tertiary);
          text-transform: uppercase; letter-spacing: var(--letter-spacing-wider);
        }
        .gauge-summary__value { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); color: var(--color-amber-300); }
      `}</style>
    </div>
  );
};
