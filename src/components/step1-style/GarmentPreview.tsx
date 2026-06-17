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
} from '../../types/garment.ts';

/* ==========================================================================
   GarmentPreview — Realistic flat-lay SVG garment silhouette
   
   Renders a fashion-illustration-quality flat-lay view of a garment that
   reacts to every style option in the Zustand store. Uses smooth Bézier
   curves throughout — no straight-line trapezoids.
   ========================================================================== */

const VB_W = 300;
const VB_H = 400;
const CX = VB_W / 2;

/* --------------------------------------------------------------------------
   Geometry parameters computed from store state
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
}

function computeGeom(
  bodyFit: BodyFit,
  bodyShape: BodyShape,
  garmentLength: GarmentLength,
  sleeve: SleeveType,
  shoulderLine: ShoulderLine,
): Geom {
  const fitEase: Record<BodyFit, number> = {
    fitted: -6, standard: 0, relaxed: 10, oversized: 22,
  };
  const ease = fitEase[bodyFit];

  const baseHalfChest = 58 + ease;
  const halfChest = baseHalfChest;
  const halfNeck = 18;

  const waistInset: Record<BodyFit, number> = {
    fitted: 10, standard: 5, relaxed: 0, oversized: -4,
  };
  let halfWaist = halfChest - waistInset[bodyFit];

  let halfHem = halfChest;
  if (bodyShape === 'a-line') {
    halfHem = halfChest + 18;
    halfWaist = halfChest - waistInset[bodyFit] * 0.5;
  } else if (bodyShape === 'cropped') {
    halfHem = halfChest - 2;
  }

  const shoulderY = 55;
  const shoulderDrop = 8;

  const shoulderExtendMap: Record<ShoulderLine, number> = {
    natural: 0, extended: 12, dropped: 6,
  };
  const shoulderExtend = shoulderExtendMap[shoulderLine];

  const armholeDepth = 42 + (ease > 0 ? ease * 0.4 : 0);
  const armholeBottomY = shoulderY + shoulderDrop + armholeDepth;

  const hemMap: Record<GarmentLength, number> = {
    crop: 200, waist: 250, hip: 310, tunic: 360,
  };
  const hemY = hemMap[garmentLength];
  const waistY = shoulderY + shoulderDrop + armholeDepth + 35;

  const sleeveLenMap: Record<SleeveType, number> = {
    sleeveless: 0, cap: 28, short: 60, 'three-quarter': 115, long: 155,
  };
  const sleeveLength = sleeveLenMap[sleeve];
  const sleeveTopHW = 22 + ease * 0.3;
  const sleeveBotHW = sleeve === 'long' ? 16 + ease * 0.15 : 19 + ease * 0.2;

  return {
    shoulderY, hemY, halfChest, halfWaist, halfHem, waistY,
    armholeBottomY, halfNeck, shoulderDrop, shoulderExtend,
    sleeveLength, sleeveTopHW, sleeveBotHW,
  };
}

/* --------------------------------------------------------------------------
   Neckline path builders
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
      const d = 50;
      const tip = nY + d;
      return {
        path: `M${lN},${nY} C${lN},${nY + 8} ${CX - 3},${tip - 2} ${CX},${tip} C${CX + 3},${tip - 2} ${rN},${nY + 8} ${rN},${nY}`,
      };
    }
    case 'scoop': {
      const d = 35;
      const cp = nY + d + 18;
      return { path: `M${lN - 4},${nY} C${lN - 4},${cp} ${rN + 4},${cp} ${rN + 4},${nY}` };
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
      const bH = 10;
      return {
        path: `M${lN},${nY} C${lN},${cp} ${rN},${cp} ${rN},${nY}`,
        collarPath: `M${lN + 1},${nY} C${lN + 1},${nY - 2} ${lN - 1},${nY - bH} ${lN + 2},${nY - bH - 1} L${rN - 2},${nY - bH - 1} C${rN + 1},${nY - bH} ${rN - 1},${nY - 2} ${rN - 1},${nY}`,
      };
    }
    case 'turtle': {
      const d = 8;
      const cp = nY + d + 3;
      const bH = 22;
      return {
        path: `M${lN},${nY} C${lN},${cp} ${rN},${cp} ${rN},${nY}`,
        collarPath: `M${lN + 1},${nY} C${lN + 1},${nY - 2} ${lN - 2},${nY - bH} ${lN + 3},${nY - bH - 2} L${rN - 3},${nY - bH - 2} C${rN + 2},${nY - bH} ${rN - 1},${nY - 2} ${rN - 1},${nY}`,
      };
    }
    case 'square': {
      const sH = g.halfNeck * 0.85;
      const d = 28;
      const r = 3;
      return {
        path: `M${lN},${nY} L${CX - sH},${nY} L${CX - sH},${nY + d - r} Q${CX - sH},${nY + d} ${CX - sH + r},${nY + d} L${CX + sH - r},${nY + d} Q${CX + sH},${nY + d} ${CX + sH},${nY + d - r} L${CX + sH},${nY} L${rN},${nY}`,
      };
    }
    default:
      return { path: `M${lN},${nY} C${lN},${nY + 20} ${rN},${nY + 20} ${rN},${nY}` };
  }
}

/* --------------------------------------------------------------------------
   Body outline — Bézier curves for natural garment shape
   -------------------------------------------------------------------------- */

function buildBodyOutline(g: Geom): string {
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
  const hasW = wY < hY - 15;

  let p = `M${lN},${g.shoulderY}`;
  p += ` C${lN - 8},${g.shoulderY + 1} ${lS + 10},${sTipY - 3} ${lS},${sTipY}`;
  p += ` C${lS - 2},${sTipY + 18} ${lAB - 6},${abY - 12} ${lAB},${abY}`;
  if (hasW) {
    p += ` C${lAB - 1},${abY + 15} ${lW + 2},${wY - 20} ${lW},${wY}`;
    p += ` C${lW - 1},${wY + 20} ${lH + 2},${hY - 25} ${lH},${hY}`;
  } else {
    p += ` C${lAB - 1},${abY + 15} ${lH + 2},${hY - 20} ${lH},${hY}`;
  }
  const hemD = 4;
  const hemW = rH - lH;
  p += ` C${lH + hemW * 0.3},${hY + hemD} ${lH + hemW * 0.7},${hY + hemD} ${rH},${hY}`;
  if (hasW) {
    p += ` C${rH - 2},${hY - 25} ${rW + 1},${wY + 20} ${rW},${wY}`;
    p += ` C${rW - 2},${wY - 20} ${rAB + 1},${abY + 15} ${rAB},${abY}`;
  } else {
    p += ` C${rH - 2},${hY - 20} ${rAB + 1},${abY + 15} ${rAB},${abY}`;
  }
  p += ` C${rAB + 6},${abY - 12} ${rS + 2},${sTipY + 18} ${rS},${sTipY}`;
  p += ` C${rS - 10},${sTipY - 3} ${rN + 8},${g.shoulderY + 1} ${rN},${g.shoulderY}`;
  return p;
}

/* --------------------------------------------------------------------------
   Sleeve path builder
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
   Component
   -------------------------------------------------------------------------- */

const T = 'all 500ms cubic-bezier(0.4,0,0.2,1)';

export const GarmentPreview: React.FC = () => {
  const style = useProjectStore((s) => s.style);

  const g = useMemo(
    () => computeGeom(style.bodyFit, style.bodyShape, style.garmentLength, style.sleeve, style.shoulderLine),
    [style.bodyFit, style.bodyShape, style.garmentLength, style.sleeve, style.shoulderLine],
  );

  const bodyPath = useMemo(() => buildBodyOutline(g), [g]);
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

  return (
    <div className="garment-preview-wrap">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Garment preview"
      >
        <defs>
          <linearGradient id="gp-bf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(222,178,130,0.12)" />
            <stop offset="50%" stopColor="rgba(212,165,116,0.08)" />
            <stop offset="100%" stopColor="rgba(196,145,96,0.05)" />
          </linearGradient>
          <linearGradient id="gp-sf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(222,178,130,0.10)" />
            <stop offset="100%" stopColor="rgba(196,145,96,0.04)" />
          </linearGradient>
          <linearGradient id="gp-st" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D4A574" />
            <stop offset="60%" stopColor="#C49462" />
            <stop offset="100%" stopColor="#9A6A3A" />
          </linearGradient>
          <pattern id="gp-m" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="none" />
            <rect x="0.5" y="0.5" width="7" height="7" rx="1.5" ry="1.5"
              fill="none" stroke="rgba(212,165,116,0.07)" strokeWidth="0.4" />
          </pattern>
          <pattern id="gp-d" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="0.4" fill="rgba(212,165,116,0.06)" />
          </pattern>
          <filter id="gp-sh" x="-10%" y="-5%" width="120%" height="115%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(180,140,100,0.12)" />
          </filter>
          <filter id="gp-cg" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="b" />
            <feFlood floodColor="rgba(212,165,116,0.15)" result="c" />
            <feComposite in="c" in2="b" operator="in" result="gl" />
            <feMerge><feMergeNode in="gl" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Sleeves behind body */}
        {lSlv && (
          <>
            <path d={lSlv} fill="url(#gp-sf)" stroke="url(#gp-st)"
              strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"
              filter="url(#gp-sh)" style={{ transition: T }} />
            <path d={lSlv} fill="url(#gp-m)" stroke="none" style={{ transition: T }} />
          </>
        )}
        {rSlv && (
          <>
            <path d={rSlv} fill="url(#gp-sf)" stroke="url(#gp-st)"
              strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"
              filter="url(#gp-sh)" style={{ transition: T }} />
            <path d={rSlv} fill="url(#gp-m)" stroke="none" style={{ transition: T }} />
          </>
        )}

        {/* Body layers */}
        <path d={bodyPath} fill="url(#gp-bf)" stroke="none" filter="url(#gp-sh)" style={{ transition: T }} />
        <path d={bodyPath} fill="url(#gp-bf)" stroke="none" style={{ transition: T }} />
        <path d={bodyPath} fill="url(#gp-m)" stroke="none" style={{ transition: T }} />
        <path d={bodyPath} fill="url(#gp-d)" stroke="none" style={{ transition: T }} />
        <path d={bodyPath} fill="none" stroke="url(#gp-st)"
          strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round"
          style={{ transition: T }} />

        {/* Construction lines */}
        <line x1={CX} y1={g.shoulderY + 18} x2={CX} y2={g.hemY - 6}
          stroke="rgba(212,165,116,0.10)" strokeWidth="0.8" strokeDasharray="5 7"
          style={{ transition: T }} />
        {style.sleeve !== 'sleeveless' && (
          <>
            <path d={lArm} fill="none" stroke="rgba(212,165,116,0.09)"
              strokeWidth="0.7" strokeDasharray="3 5" style={{ transition: T }} />
            <path d={rArm} fill="none" stroke="rgba(212,165,116,0.09)"
              strokeWidth="0.7" strokeDasharray="3 5" style={{ transition: T }} />
          </>
        )}
        {g.waistY < g.hemY - 10 && (
          <line x1={CX - g.halfWaist + 8} y1={g.waistY}
            x2={CX + g.halfWaist - 8} y2={g.waistY}
            stroke="rgba(212,165,116,0.06)" strokeWidth="0.6" strokeDasharray="3 6"
            style={{ transition: T }} />
        )}

        {/* Neckline */}
        {neckline.collarPath && (
          <path d={neckline.collarPath} fill="rgba(222,178,130,0.06)"
            stroke="url(#gp-st)" strokeWidth="1.8" strokeLinejoin="round"
            strokeLinecap="round" filter="url(#gp-cg)" style={{ transition: T }} />
        )}
        <path d={neckline.path} fill="none" stroke="#D4A574"
          strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
          style={{ transition: T }} />

        {/* Hanger dot */}
        <circle cx={CX} cy={g.shoulderY - 14} r="2.5" fill="rgba(212,165,116,0.25)"
          style={{ transition: T }} />
        <line x1={CX} y1={g.shoulderY - 11} x2={CX} y2={g.shoulderY + 1}
          stroke="rgba(212,165,116,0.12)" strokeWidth="0.8" style={{ transition: T }} />

        {/* Label */}
        <text x={CX} y={g.hemY + 16} textAnchor="middle" className="gp-lb">
          {style.garmentLength}
        </text>
      </svg>

      <style>{`
        .garment-preview-wrap {
          width: 100%;
          max-width: 320px;
          aspect-ratio: 300 / 400;
          margin: 0 auto;
          padding: var(--space-4, 16px);
        }
        .garment-preview-wrap svg { overflow: visible; }
        .gp-lb {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          fill: rgba(212,165,116,0.3);
          pointer-events: none;
          user-select: none;
        }
      `}</style>
    </div>
  );
};
