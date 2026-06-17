import React, { useMemo } from 'react';
import { useProjectStore } from './store/projectStore.ts';
import { AppShell } from './components/layout/AppShell.tsx';
import { StyleConfigurator } from './components/step1-style/StyleConfigurator.tsx';
import { SizeConfigurator } from './components/step2-sizing/SizeConfigurator.tsx';
import { PiecesOverview } from './components/step2-sizing/PiecesOverview.tsx';
import PatternWorkspace from './components/step3-pattern/PatternWorkspace.tsx';
import './components/step3-pattern/pattern.css';
import { getMeasurements, applyEase } from './core/measurements.ts';

const Step3Wrapper: React.FC = () => {
  const size = useProjectStore((s) => s.size);
  const style = useProjectStore((s) => s.style);
  const gauge = useProjectStore((s) => s.gauge);
  const customMeasurements = useProjectStore((s) => s.customMeasurements);

  const gridDimensions = useMemo(() => {
    const baseMeasurements = getMeasurements(size);
    const measurements = customMeasurements
      ? { ...baseMeasurements, ...customMeasurements }
      : baseMeasurements;
    const finished = applyEase(measurements, style.bodyFit);

    // Calculate grid size from gauge and finished measurements
    // Width = half bust (one panel) × gauge
    const panelWidthInches = finished.bust / 2;
    const heightInches = finished.backWaistLength;

    const gridW = Math.round(panelWidthInches * gauge.meshPerInchH);
    const gridH = Math.round(heightInches * gauge.meshPerInchV);

    return {
      width: Math.max(10, gridW),
      height: Math.max(10, gridH),
    };
  }, [size, style.bodyFit, gauge, customMeasurements]);

  return (
    <div style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      <PatternWorkspace
        garmentWidth={gridDimensions.width}
        garmentHeight={gridDimensions.height}
      />
    </div>
  );
};

export const App: React.FC = () => {
  const currentStep = useProjectStore((s) => s.currentStep);

  return (
    <AppShell>
      {currentStep === 1 && <StyleConfigurator />}
      {currentStep === 2 && <SizeConfigurator />}
      {currentStep === 2.5 && <PiecesOverview />}
      {currentStep === 3 && <Step3Wrapper />}
    </AppShell>
  );
};
