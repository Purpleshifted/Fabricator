import React, { useMemo } from 'react';
import { useProjectStore } from '../../store/projectStore.ts';
import type {
  NecklineType,
  SleeveType,
  SleeveConstruction,
  BodyShape,
  GarmentLength,
  BodyFit,
  ShoulderLine,
  HemlineType,
} from '../../types/garment.ts';

/* ==========================================================================
   GarmentPreview — Technical Flat Pattern Preview
   
   A clean, precise 2D line drawing of a garment as if laid flat on a table.
   Standard pattern-making "flat sketch" style:
   • Black/dark gray lines on light background
   • Even line weights (2px outline, 0.75px construction)
   • Symmetrical front view
   • Construction details: darts, notches, grain line, center-front
   ========================================================================== */

const VB_W = 300;
const VB_H = 420;
const CX = VB_W / 2;

/* Colors — technical drawing palette */
const COL = {
  outline: '#3a3632',
  construction: '#9a9590',
  paper: '#f8f7f5',
  gridDot: '#ddd9d4',
  notch: '#3a3632',
  grain: '#b0aaa4',
  label: '#9a9590',
  dartFill: 'rgba(154,149,144,0.10)',
} as const;

/* Line weights */
const LW = { outline: 2, construction: 0.75, notch: 1.5 } as const;

/* Transition */
const T = 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)';

/* --------------------------------------------------------------------------
   Geometry: dimensions derived from store state
   -------------------------------------------------------------------------- */

interface Geom {
  shoulderY: number;
  hemY: number;
  halfChest: number;
  halfWaist: number;
  halfHem: number;
  waistY: number;
  armholeBottomY: number;
  halfNeck: number;
  shoulderDrop: number;
  shoulderExtend: number;
  sleeveLength: number;
  sleeveTopHW: number;
  sleeveBotHW: number;
  hasWaistShaping: boolean;
}

function computeGeom(
  bodyFit: BodyFit,
  bodyShape: BodyShape,
  garmentLength: GarmentLength,
  sleeve: SleeveType,
  shoulderLine: ShoulderLine,
  waistShaping: boolean,
): Geom {
  const fitEase: Record<BodyFit, number> = {
    fitted: -6, standard: 0, relaxed: 10, oversized: 22,
  };
  const ease = fitEase[bodyFit];

  const halfChest = 58 + ease;
  const halfNeck = 18;

  const waistInset: Record<BodyFit, number> = {
    fitted: 12, standard: 6, relaxed: 2, oversized: -4,
  };
  let halfWaist = halfChest - (waistShaping ? waistInset[bodyFit] : 0);

  let halfHem = halfChest;
  if (bodyShape === 'a-line') {
    halfHem = halfChest + 18;
    halfWaist = halfChest - (waistShaping ? waistInset[bodyFit] * 0.5 : 0);
  } else if (bodyShape === 'cropped') {
    halfHem = halfChest - 2;
  }

  const shoulderY = 55;
  const shoulderDrop = shoulderLine === 'dropped' ? 14 : 8;

  const shoulderExtendMap: Record<ShoulderLine, number> = {
    natural: 0, extended: 12, dropped: 8,
  };
  const shoulderExtend = shoulderExtendMap[shoulderLine];

  const armholeDepth = 42 + (ease > 0 ? ease * 0.4 : 0);
  const armholeBottomY = shoulderY + shoulderDrop + armholeDepth;

  const hemMap: Record<GarmentLength, number> = {
    crop: 210, waist: 260, hip: 320, tunic: 375,
  };
  const hemY = hemMap[garmentLength];
  const waistY = shoulderY + shoulderDrop + armholeDepth + 38;

  const sleeveLenMap: Record<SleeveType, number> = {
    sleeveless: 0, cap: 28, short: 60, 'three-quarter': 115, long: 155,
  };
  const sleeveLength = sleeveLenMap[sleeve];
  const sleeveTopHW = 22 + ease * 0.3;
  const sleeveBotHW = sleeve === 'long' ? 16 + ease * 0.15 : 19 + ease * 0.2;

  const hasWaistShaping =
    waistShaping &&
    (bodyFit === 'fitted' || bodyFit === 'standard') &&
    waistY < hemY - 15;

  return {
    shoulderY, hemY, halfChest, halfWaist, halfHem, waistY,
    armholeBottomY, halfNeck, shoulderDrop, shoulderExtend,
    sleeveLength, sleeveTopHW, sleeveBotHW, hasWaistShaping,
  };
}

/* --------------------------------------------------------------------------
   Neckline path builders — 7 distinct types
   -------------------------------------------------------------------------- */

function buildNeckline(
  type: NecklineType,
  g: Geom,
): { path: string; collarPath?: string } {
  const lN = CX - g.halfNeck;
  const rN = CX + g.halfNeck;
  const nY = g.shoulderY;

  switch (type) {
    case 'crew': {
      const d = 14;
      const cp = nY + d + 6;
      return { path: `M${lN},${nY} C${lN},${cp} ${rN},${cp} ${rN},${nY}` };
    }
    case 'v-neck': {
      const depth = 55;
      const tip = nY + depth;
      return {
        path: `M${lN},${nY} C${lN},${nY + 10} ${CX - 4},${tip - 6} ${CX},${tip} C${CX + 4},${tip - 6} ${rN},${nY + 10} ${rN},${nY}`,
      };
    }
    case 'scoop': {
      const d = 38;
      const cp = nY + d + 20;
      return { path: `M${lN - 3},${nY} C${lN - 3},${cp} ${rN + 3},${cp} ${rN + 3},${nY}` };
    }
    case 'boat': {
      const wH = g.halfChest * 0.65;
      const d = 5;
      return {
        path: `M${CX - wH},${nY + 2} C${CX - wH * 0.5},${nY + d + 3} ${CX + wH * 0.5},${nY + d + 3} ${CX + wH},${nY + 2}`,
      };
    }
    case 'mock': {
      const d = 10;
      const cp = nY + d + 4;
      const bH = 12;
      return {
        path: `M${lN},${nY} C${lN},${cp} ${rN},${cp} ${rN},${nY}`,
        collarPath: `M${lN + 1},${nY} L${lN + 1},${nY - bH} Q${lN + 1},${nY - bH - 3} ${CX},${nY - bH - 3} Q${rN - 1},${nY - bH - 3} ${rN - 1},${nY - bH} L${rN - 1},${nY}`,
      };
    }
    case 'turtle': {
      const d = 8;
      const cp = nY + d + 3;
      const bH = 24;
      return {
        path: `M${lN},${nY} C${lN},${cp} ${rN},${cp} ${rN},${nY}`,
        collarPath: `M${lN + 1},${nY} L${lN + 1},${nY - bH} Q${lN + 1},${nY - bH - 4} ${CX},${nY - bH - 4} Q${rN - 1},${nY - bH - 4} ${rN - 1},${nY - bH} L${rN - 1},${nY}`,
      };
    }
    case 'square': {
      const sH = g.halfNeck * 0.85;
      const d = 30;
      const r = 3;
      return {
        path: `M${CX - sH},${nY} L${CX - sH},${nY + d - r} Q${CX - sH},${nY + d} ${CX - sH + r},${nY + d} L${CX + sH - r},${nY + d} Q${CX + sH},${nY + d} ${CX + sH},${nY + d - r} L${CX + sH},${nY}`,
      };
    }
    default:
      return { path: `M${lN},${nY} C${lN},${nY + 20} ${rN},${nY + 20} ${rN},${nY}` };
  }
}

/* --------------------------------------------------------------------------
   Body outline — smooth Bézier curves for realistic garment silhouette
   -------------------------------------------------------------------------- */

function buildBodyOutline(g: Geom, hemline: HemlineType): string {
  const lS = CX - g.halfChest - g.shoulderExtend;
  const rS = CX + g.halfChest + g.shoulderExtend;
  const lN = CX - g.halfNeck;
  const rN = CX + g.halfNeck;
  const sTipY = g.shoulderY + g.shoulderDrop;
  const abY = g.armholeBottomY;
  const lAB = CX - g.halfChest + 4;
  const rAB = CX + g.halfChest - 4;
  const wY = g.waistY;
  const lW = CX - g.halfWaist;
  const rW = CX + g.halfWaist;
  const hY = g.hemY;
  const lH = CX - g.halfHem;
  const rH = CX + g.halfHem;

  /* Left side: shoulder → armhole → waist → hem */
  let p = `M${lN},${g.shoulderY}`;
  // Shoulder slope
  p += ` C${lN - 8},${g.shoulderY + 1} ${lS + 10},${sTipY - 3} ${lS},${sTipY}`;
  // Armhole curve
  p += ` C${lS - 2},${sTipY + 18} ${lAB - 6},${abY - 12} ${lAB},${abY}`;
  // Side seam with optional waist shaping
  if (g.hasWaistShaping) {
    p += ` C${lAB - 1},${abY + 16} ${lW + 2},${wY - 22} ${lW},${wY}`;
    p += ` C${lW - 1},${wY + 22} ${lH + 2},${hY - 28} ${lH},${hY}`;
  } else {
    p += ` C${lAB - 1},${abY + 16} ${lH + 2},${hY - 22} ${lH},${hY}`;
  }

  /* Hem — slight curve or straight */
  const hemCurve = hemline === 'curved' ? 5 : 2;
  const hemW = rH - lH;
  p += ` C${lH + hemW * 0.3},${hY + hemCurve} ${lH + hemW * 0.7},${hY + hemCurve} ${rH},${hY}`;

  /* Right side: hem → waist → armhole → shoulder (mirror) */
  if (g.hasWaistShaping) {
    p += ` C${rH - 2},${hY - 28} ${rW + 1},${wY + 22} ${rW},${wY}`;
    p += ` C${rW - 2},${wY - 22} ${rAB + 1},${abY + 16} ${rAB},${abY}`;
  } else {
    p += ` C${rH - 2},${hY - 22} ${rAB + 1},${abY + 16} ${rAB},${abY}`;
  }
  // Armhole
  p += ` C${rAB + 6},${abY - 12} ${rS + 2},${sTipY + 18} ${rS},${sTipY}`;
  // Shoulder
  p += ` C${rS - 10},${sTipY - 3} ${rN + 8},${g.shoulderY + 1} ${rN},${g.shoulderY}`;
  return p;
}

/* --------------------------------------------------------------------------
   Sleeve path builder — 4 construction types
   -------------------------------------------------------------------------- */

function buildSleeve(
  g: Geom,
  side: 'left' | 'right',
  sleeve: SleeveType,
  construction: SleeveConstruction,
): string {
  if (g.sleeveLength <= 0) return '';

  const d = side === 'left' ? -1 : 1;
  const sTipY = g.shoulderY + g.shoulderDrop;
  const sTipX = CX + d * (g.halfChest + g.shoulderExtend);
  const abY = g.armholeBottomY;
  const abX = CX + d * (g.halfChest - 4);
  const capX = sTipX + d * g.sleeveTopHW;
  const cuffY = sTipY + g.sleeveLength;
  const coX = sTipX + d * g.sleeveBotHW;
  const ciX = abX + d * 2;

  if (construction === 'set-in') {
    const capPY = sTipY - 6;
    let p = `M${sTipX},${sTipY}`;
    p += ` C${sTipX + d * 6},${capPY} ${capX - d * 4},${sTipY + 8} ${capX},${sTipY + 14}`;
    p += ` C${capX + d * 2},${sTipY + 35} ${coX + d * 3},${cuffY - 30} ${coX},${cuffY}`;
    const cmX = (coX + ciX) / 2;
    p += ` C${cmX + d * 3},${cuffY + 2} ${cmX - d * 3},${cuffY + 2} ${ciX},${cuffY}`;
    p += ` C${ciX - d * 1},${cuffY - 30} ${abX + d * 3},${abY + 12} ${abX},${abY}`;
    return p;
  }

  if (construction === 'raglan') {
    const rnX = CX + d * (g.halfNeck + 6);
    const rnY = g.shoulderY + 4;
    let p = `M${rnX},${rnY}`;
    p += ` C${rnX + d * 15},${rnY + 18} ${capX - d * 5},${sTipY + 5} ${capX},${sTipY + 14}`;
    p += ` C${capX + d * 2},${sTipY + 35} ${coX + d * 3},${cuffY - 30} ${coX},${cuffY}`;
    const cmX = (coX + ciX) / 2;
    p += ` C${cmX + d * 3},${cuffY + 2} ${cmX - d * 3},${cuffY + 2} ${ciX},${cuffY}`;
    p += ` C${ciX - d * 1},${cuffY - 30} ${abX + d * 3},${abY + 12} ${abX},${abY}`;
    return p;
  }

  if (construction === 'dolman') {
    const doX = sTipX + d * (g.sleeveTopHW + 8);
    const bmY = g.armholeBottomY + 20;
    const bmX = CX + d * g.halfWaist;
    let p = `M${sTipX},${sTipY}`;
    p += ` C${sTipX + d * 10},${sTipY - 3} ${doX - d * 5},${sTipY + 6} ${doX},${sTipY + 12}`;
    p += ` C${doX + d * 2},${sTipY + 35} ${coX + d * 3},${cuffY - 25} ${coX},${cuffY}`;
    const cmX = (coX + bmX) / 2;
    p += ` C${cmX + d * 3},${cuffY + 2} ${cmX - d * 3},${cuffY + 2} ${bmX},${Math.min(cuffY, bmY)}`;
    p += ` C${bmX - d * 3},${bmY - 15} ${abX + d * 4},${abY + 10} ${abX},${abY}`;
    return p;
  }

  if (construction === 'drop-shoulder') {
    const dsX = sTipX + d * 10;
    const dsY = sTipY + 10;
    const dcX = dsX + d * g.sleeveTopHW;
    let p = `M${dsX},${dsY}`;
    p += ` C${dsX + d * 4},${dsY - 2} ${dcX - d * 4},${dsY + 2} ${dcX},${dsY + 6}`;
    p += ` C${dcX + d * 1},${dsY + 30} ${coX + d * 2},${cuffY - 25} ${coX},${cuffY}`;
    const cmX = (coX + dsX) / 2;
    p += ` C${cmX + d * 3},${cuffY + 2} ${cmX - d * 3},${cuffY + 2} ${dsX},${cuffY}`;
    p += ` C${dsX - d * 1},${cuffY - 25} ${abX + d * 5},${abY + 15} ${abX},${abY}`;
    return p;
  }

  return '';
}

/* --------------------------------------------------------------------------
   Armhole seam construction line
   -------------------------------------------------------------------------- */

function buildArmholeSeam(g: Geom, side: 'left' | 'right'): string {
  const d = side === 'left' ? -1 : 1;
  const sTipY = g.shoulderY + g.shoulderDrop;
  const sTipX = CX + d * (g.halfChest + g.shoulderExtend);
  const abY = g.armholeBottomY;
  const abX = CX + d * (g.halfChest - 4);
  return `M${sTipX},${sTipY} C${sTipX - d * 2},${sTipY + 18} ${abX - d * 6},${abY - 12} ${abX},${abY}`;
}

/* --------------------------------------------------------------------------
   Notch marks — small perpendicular ticks at key construction points
   -------------------------------------------------------------------------- */

interface NotchMark {
  x: number;
  y: number;
  angle: number; // degrees rotation
}

function computeNotches(g: Geom): NotchMark[] {
  const marks: NotchMark[] = [];
  const sTipY = g.shoulderY + g.shoulderDrop;

  // Shoulder notches (left & right)
  const lShoulder = CX - g.halfChest * 0.55;
  const rShoulder = CX + g.halfChest * 0.55;
  marks.push({ x: lShoulder, y: g.shoulderY + g.shoulderDrop * 0.45, angle: -15 });
  marks.push({ x: rShoulder, y: g.shoulderY + g.shoulderDrop * 0.45, angle: 15 });

  // Armhole midpoint notches
  const armMidY = (sTipY + g.armholeBottomY) / 2;
  const lArmX = CX - g.halfChest + 1;
  const rArmX = CX + g.halfChest - 1;
  marks.push({ x: lArmX, y: armMidY, angle: -80 });
  marks.push({ x: rArmX, y: armMidY, angle: 80 });

  // Waist notches (if waist shaping exists)
  if (g.hasWaistShaping) {
    marks.push({ x: CX - g.halfWaist - 1, y: g.waistY, angle: -90 });
    marks.push({ x: CX + g.halfWaist + 1, y: g.waistY, angle: 90 });
  }

  return marks;
}

/* --------------------------------------------------------------------------
   Dart paths — triangular darts at bust and waist
   -------------------------------------------------------------------------- */

interface DartPath {
  d: string;
  type: 'bust' | 'waist';
}

function computeDarts(g: Geom): DartPath[] {
  const darts: DartPath[] = [];

  if (!g.hasWaistShaping) return darts;

  // Bust darts (left & right) — small triangles at mid-bust height
  const bustY = g.armholeBottomY - 8;
  const dartHeight = 22;
  const dartWidth = 5;

  // Left bust dart
  const lBustX = CX - g.halfChest * 0.45;
  darts.push({
    d: `M${lBustX - dartWidth},${bustY} L${lBustX},${bustY - dartHeight} L${lBustX + dartWidth},${bustY} Z`,
    type: 'bust',
  });
  // Right bust dart (mirror)
  const rBustX = CX + g.halfChest * 0.45;
  darts.push({
    d: `M${rBustX - dartWidth},${bustY} L${rBustX},${bustY - dartHeight} L${rBustX + dartWidth},${bustY} Z`,
    type: 'bust',
  });

  // Waist darts — at the waist line, pointing upward
  const waistDartH = 28;
  const waistDartW = 4;
  const lWaistDX = CX - g.halfWaist * 0.5;
  darts.push({
    d: `M${lWaistDX - waistDartW},${g.waistY} L${lWaistDX},${g.waistY - waistDartH} L${lWaistDX + waistDartW},${g.waistY} Z`,
    type: 'waist',
  });
  const rWaistDX = CX + g.halfWaist * 0.5;
  darts.push({
    d: `M${rWaistDX - waistDartW},${g.waistY} L${rWaistDX},${g.waistY - waistDartH} L${rWaistDX + waistDartW},${g.waistY} Z`,
    type: 'waist',
  });

  return darts;
}

/* --------------------------------------------------------------------------
   Component
   -------------------------------------------------------------------------- */

export const GarmentPreview: React.FC = () => {
  const style = useProjectStore((s) => s.style);
  const waistShaping = useProjectStore((s) => (s as any).waistShaping ?? true);

  const g = useMemo(
    () =>
      computeGeom(
        style.bodyFit,
        style.bodyShape,
        style.garmentLength,
        style.sleeve,
        style.shoulderLine,
        waistShaping,
      ),
    [style.bodyFit, style.bodyShape, style.garmentLength, style.sleeve, style.shoulderLine, waistShaping],
  );

  const bodyPath = useMemo(() => buildBodyOutline(g, style.hemline), [g, style.hemline]);
  const neckline = useMemo(() => buildNeckline(style.neckline, g), [style.neckline, g]);

  const lSlv = useMemo(
    () => buildSleeve(g, 'left', style.sleeve, style.sleeveConstruction),
    [g, style.sleeve, style.sleeveConstruction],
  );
  const rSlv = useMemo(
    () => buildSleeve(g, 'right', style.sleeve, style.sleeveConstruction),
    [g, style.sleeve, style.sleeveConstruction],
  );

  const lArm = useMemo(() => buildArmholeSeam(g, 'left'), [g]);
  const rArm = useMemo(() => buildArmholeSeam(g, 'right'), [g]);
  const notches = useMemo(() => computeNotches(g), [g]);
  const darts = useMemo(() => computeDarts(g), [g]);

  /* Grain line: vertical arrow in center of garment body */
  const grainTop = g.shoulderY + 40;
  const grainBot = g.hemY - 25;
  const grainMid = (grainTop + grainBot) / 2;
  const arrowSize = 5;

  return (
    <div className="gp-flat-wrap">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Technical flat pattern preview"
      >
        <style>{`
          .gp-flat-wrap {
            width: 100%;
            max-width: 340px;
            aspect-ratio: 300 / 420;
            margin: 0 auto;
            background: #1e1c1a;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.06);
            padding: 12px;
          }
          .gp-flat-wrap svg {
            overflow: visible;
            border-radius: 6px;
          }
          .gp-outline { transition: ${T}; }
          .gp-construction { transition: ${T}; }
          .gp-label {
            font-family: 'Inter', system-ui, sans-serif;
            font-size: 8px;
            font-weight: 500;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            fill: ${COL.label};
            pointer-events: none;
            user-select: none;
          }
          .gp-grain-text {
            font-family: 'Inter', system-ui, sans-serif;
            font-size: 6px;
            font-weight: 400;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            fill: ${COL.grain};
            pointer-events: none;
            user-select: none;
          }
        `}</style>

        <defs>
          {/* Grid dot pattern — pattern making paper */}
          <pattern id="gp-grid" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="6" cy="6" r="0.5" fill={COL.gridDot} />
          </pattern>
        </defs>

        {/* ---- Paper background ---- */}
        <rect x="0" y="0" width={VB_W} height={VB_H} fill={COL.paper} rx="4" />
        <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#gp-grid)" rx="4" />

        {/* ---- Center front line (dashed) ---- */}
        <line
          x1={CX} y1={g.shoulderY + 20} x2={CX} y2={g.hemY - 8}
          stroke={COL.construction}
          strokeWidth={LW.construction}
          strokeDasharray="6 4"
          className="gp-construction"
        />

        {/* ---- Sleeves (behind body outline) ---- */}
        {lSlv && (
          <path
            d={lSlv}
            fill="none"
            stroke={COL.outline}
            strokeWidth={LW.outline}
            strokeLinejoin="round"
            strokeLinecap="round"
            className="gp-outline"
          />
        )}
        {rSlv && (
          <path
            d={rSlv}
            fill="none"
            stroke={COL.outline}
            strokeWidth={LW.outline}
            strokeLinejoin="round"
            strokeLinecap="round"
            className="gp-outline"
          />
        )}

        {/* ---- Body outline ---- */}
        <path
          d={bodyPath}
          fill="none"
          stroke={COL.outline}
          strokeWidth={LW.outline}
          strokeLinejoin="round"
          strokeLinecap="round"
          className="gp-outline"
        />

        {/* ---- Armhole seam construction lines ---- */}
        {style.sleeve !== 'sleeveless' && (
          <>
            <path
              d={lArm}
              fill="none"
              stroke={COL.construction}
              strokeWidth={LW.construction}
              strokeDasharray="4 3"
              className="gp-construction"
            />
            <path
              d={rArm}
              fill="none"
              stroke={COL.construction}
              strokeWidth={LW.construction}
              strokeDasharray="4 3"
              className="gp-construction"
            />
          </>
        )}

        {/* ---- Waist construction line ---- */}
        {g.waistY < g.hemY - 12 && (
          <line
            x1={CX - g.halfWaist + 6}
            y1={g.waistY}
            x2={CX + g.halfWaist - 6}
            y2={g.waistY}
            stroke={COL.construction}
            strokeWidth={LW.construction}
            strokeDasharray="4 3"
            className="gp-construction"
          />
        )}

        {/* ---- Darts ---- */}
        {darts.map((dart, i) => (
          <path
            key={`dart-${i}`}
            d={dart.d}
            fill={COL.dartFill}
            stroke={COL.construction}
            strokeWidth={LW.construction}
            className="gp-construction"
          />
        ))}

        {/* ---- Notch marks ---- */}
        {notches.map((n, i) => (
          <line
            key={`notch-${i}`}
            x1={n.x}
            y1={n.y - 3}
            x2={n.x}
            y2={n.y + 3}
            stroke={COL.notch}
            strokeWidth={LW.notch}
            strokeLinecap="round"
            transform={`rotate(${n.angle}, ${n.x}, ${n.y})`}
            className="gp-construction"
          />
        ))}

        {/* ---- Grain line (arrow) ---- */}
        <line
          x1={CX}
          y1={grainTop}
          x2={CX}
          y2={grainBot}
          stroke={COL.grain}
          strokeWidth={LW.construction}
          className="gp-construction"
        />
        {/* Top arrowhead */}
        <path
          d={`M${CX - arrowSize},${grainTop + arrowSize * 1.5} L${CX},${grainTop} L${CX + arrowSize},${grainTop + arrowSize * 1.5}`}
          fill="none"
          stroke={COL.grain}
          strokeWidth={LW.construction}
          strokeLinejoin="round"
          strokeLinecap="round"
          className="gp-construction"
        />
        {/* Bottom arrowhead */}
        <path
          d={`M${CX - arrowSize},${grainBot - arrowSize * 1.5} L${CX},${grainBot} L${CX + arrowSize},${grainBot - arrowSize * 1.5}`}
          fill="none"
          stroke={COL.grain}
          strokeWidth={LW.construction}
          strokeLinejoin="round"
          strokeLinecap="round"
          className="gp-construction"
        />
        {/* "GRAIN" label */}
        <text x={CX + 8} y={grainMid + 2} className="gp-grain-text">
          grain
        </text>

        {/* ---- Neckline ---- */}
        {neckline.collarPath && (
          <path
            d={neckline.collarPath}
            fill="none"
            stroke={COL.outline}
            strokeWidth={LW.outline}
            strokeLinejoin="round"
            strokeLinecap="round"
            className="gp-outline"
          />
        )}
        <path
          d={neckline.path}
          fill="none"
          stroke={COL.outline}
          strokeWidth={LW.outline + 0.3}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="gp-outline"
        />

        {/* ---- Labels ---- */}
        <text x={CX} y={g.hemY + 18} textAnchor="middle" className="gp-label">
          {style.garmentLength} · {style.bodyFit}
        </text>
        <text x={CX} y={VB_H - 8} textAnchor="middle" className="gp-label" style={{ fontSize: '6px', opacity: 0.6 }}>
          front view
        </text>
      </svg>
    </div>
  );
};
