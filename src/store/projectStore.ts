import { create } from 'zustand';
import type {
  GarmentStyle,
  Size,
  BodyMeasurements,
} from '../types/garment.ts';
import type { GaugeConfig } from '../types/project.ts';
import type { GridConfig } from '../types/grid.ts';
import type { PatternPiece, PatternSet } from '../types/pattern.ts';
import { DEFAULT_STYLE } from '../types/garment.ts';

/** Ordered step sequence for next/prev navigation */
const STEP_ORDER: StepId[] = [1, 2, 2.5, 3];

export type StepId = 1 | 2 | 2.5 | 3;

export interface ProjectState {
  // ---- State ----
  currentStep: StepId;
  style: GarmentStyle;
  size: Size;
  customMeasurements: Partial<BodyMeasurements> | null;
  gauge: GaugeConfig;
  grid: { config: GridConfig; cells: number[] } | null;
  patternSet: PatternSet | null;
  activePieceId: string | null;

  // ---- Extended style sliders (not part of GarmentStyle type) ----
  waistShaping: boolean;
  ease: number;             // 0–8 inches, 0.5 increments
  necklineDepth: number;    // 0–1 normalized
  necklineWidth: number;    // 0–1 normalized
  sleeveWidth: number;      // 0–1 normalized (0=fitted, 1=bell)

  // ---- Actions ----
  setStep: (step: StepId) => void;
  setStyle: (style: Partial<GarmentStyle>) => void;
  setSize: (size: Size) => void;
  setGauge: (gauge: Partial<GaugeConfig>) => void;
  setCustomMeasurements: (m: Partial<BodyMeasurements>) => void;
  setGrid: (grid: { config: GridConfig; cells: number[] } | null) => void;
  setPatternSet: (ps: PatternSet | null) => void;
  setActivePieceId: (id: string | null) => void;
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
  patternSet: null,
  activePieceId: null,

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

  setPatternSet: (ps) => set({ patternSet: ps }),
  setActivePieceId: (id) => set({ activePieceId: id }),

  nextStep: () =>
    set((state) => {
      const idx = STEP_ORDER.indexOf(state.currentStep);
      const next = STEP_ORDER[Math.min(idx + 1, STEP_ORDER.length - 1)];
      return { currentStep: next };
    }),

  prevStep: () =>
    set((state) => {
      const idx = STEP_ORDER.indexOf(state.currentStep);
      const prev = STEP_ORDER[Math.max(idx - 1, 0)];
      return { currentStep: prev };
    }),

  resetProject: () => set(INITIAL_STATE),

  // Extended style setters
  setWaistShaping: (on) => set({ waistShaping: on }),
  setEase: (inches) => set({ ease: inches }),
  setNecklineDepth: (v) => set({ necklineDepth: v }),
  setNecklineWidth: (v) => set({ necklineWidth: v }),
  setSleeveWidth: (v) => set({ sleeveWidth: v }),
}));
