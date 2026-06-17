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

  // ---- Extended style sliders (not part of GarmentStyle type) ----
  waistShaping: boolean;
  ease: number;             // 0–8 inches, 0.5 increments
  necklineDepth: number;    // 0–1 normalized
  necklineWidth: number;    // 0–1 normalized
  sleeveWidth: number;      // 0–1 normalized (0=fitted, 1=bell)

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

  // ---- Extended style setters ----
  setWaistShaping: (on: boolean) => void;
  setEase: (inches: number) => void;
  setNecklineDepth: (v: number) => void;
  setNecklineWidth: (v: number) => void;
  setSleeveWidth: (v: number) => void;
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

  // Extended style defaults
  waistShaping: true,
  ease: 3,
  necklineDepth: 0.5,
  necklineWidth: 0.5,
  sleeveWidth: 0.5,
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

  // Extended style setters
  setWaistShaping: (on) => set({ waistShaping: on }),
  setEase: (inches) => set({ ease: inches }),
  setNecklineDepth: (v) => set({ necklineDepth: v }),
  setNecklineWidth: (v) => set({ necklineWidth: v }),
  setSleeveWidth: (v) => set({ sleeveWidth: v }),
}));
