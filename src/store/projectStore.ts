import { create } from 'zustand';
import type {
  GarmentStyle,
  Size,
  BodyMeasurements,
} from '../types/garment.ts';
import type { GaugeConfig } from '../types/project.ts';
import type { GridConfig } from '../types/grid.ts';
import { DEFAULT_STYLE } from '../types/garment.ts';

export interface ProjectState {
  // ---- State ----
  currentStep: 1 | 2 | 3;
  style: GarmentStyle;
  size: Size;
  customMeasurements: Partial<BodyMeasurements> | null;
  gauge: GaugeConfig;
  grid: { config: GridConfig; cells: number[] } | null;

  // ---- Actions ----
  setStep: (step: 1 | 2 | 3) => void;
  setStyle: (style: Partial<GarmentStyle>) => void;
  setSize: (size: Size) => void;
  setGauge: (gauge: Partial<GaugeConfig>) => void;
  setCustomMeasurements: (m: Partial<BodyMeasurements>) => void;
  setGrid: (grid: { config: GridConfig; cells: number[] } | null) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetProject: () => void;
}

const DEFAULT_GAUGE: GaugeConfig = {
  meshPerInchH: 8.0,
  meshPerInchV: 8.0,
  threadWeight: 'Size 10 crochet thread',
  hookSize: 1.5,
  source: 'preset',
};

const INITIAL_STATE = {
  currentStep: 1 as const,
  style: { ...DEFAULT_STYLE },
  size: 'M' as Size,
  customMeasurements: null,
  gauge: DEFAULT_GAUGE,
  grid: null,
};

export const useProjectStore = create<ProjectState>((set) => ({
  ...INITIAL_STATE,

  setStep: (step) => set({ currentStep: step }),

  setStyle: (partial) =>
    set((state) => ({ style: { ...state.style, ...partial } })),

  setSize: (size) => set({ size, customMeasurements: null }),

  setGauge: (partial) =>
    set((state) => ({ gauge: { ...state.gauge, ...partial } })),

  setCustomMeasurements: (m) =>
    set((state) => ({
      customMeasurements: state.customMeasurements
        ? { ...state.customMeasurements, ...m }
        : { ...m },
    })),

  setGrid: (grid) => set({ grid }),

  nextStep: () =>
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, 3) as 1 | 2 | 3,
    })),

  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 1) as 1 | 2 | 3,
    })),

  resetProject: () => set(INITIAL_STATE),
}));
