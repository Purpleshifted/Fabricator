import React, { useMemo } from 'react';
import { useProjectStore } from '../../store/projectStore.ts';
import type {
  NecklineType,
  SleeveType,
  SleeveConstruction,
  BodyShape,
  GarmentLength,
  BodyFit,
} from '../../types/garment.ts';

/* ==========================================================================
   GarmentPreview — Live SVG silhouette that reacts to store state
   ========================================================================== */

const SVG_W = 260;
const SVG_H = 360;
const CX = SVG_W / 2;

interface GarmentGeometry {
  shoulderY: number;
  hemY: number;
  bodyTopW: number;
  bodyBotW: number;
  sleeveLen: number;
  sleeveTopW: number;
  sleeveBotW: number;
  sleeveStartY: number;
}

function computeGeometry(
  bodyShape: BodyShape,
  garmentLength: GarmentLength,
  bodyFit: BodyFit,
  sleeve: SleeveType,
): GarmentGeometry {
  const fitWidthBonus: Record<BodyFit, number> = {
    fitted: -4, standard: 0, relaxed: 8, oversized: 18,
  };
  const fw = fitWidthBonus[bodyFit];
  const shoulderY = 65;

  const hemMap: Record<GarmentLength, number> = {
    crop: 180, waist: 230, hip: 280, tunic: 330,
  };
  const hemY = hemMap[garmentLength];

  const baseTopW = 52 + fw;
  let bodyTopW = baseTopW;
  let bodyBotW = baseTopW;

  if (bodyShape === 'a-line') {
    bodyBotW = baseTopW + 22;
  } else if (bodyShape === 'cropped') {
    bodyBotW = baseTopW - 4;
  }

  const sleeveLenMap: Record<SleeveType, number> = {
    sleeveless: 0, cap: 25, short: 55, 'three-quarter': 110, long: 150,
  };
  const sleeveLen = sleeveLenMap[sleeve];
  const sleeveTopW = 20 + fw * 0.3;
  const sleeveBotW = sleeve === 'long' ? 16 + fw * 0.2 : 18 + fw * 0.2;
  const sleeveStartY = shoulderY + 4;

  return { shoulderY, hemY, bodyTopW, bodyBotW, sleeveLen, sleeveTopW, sleeveBotW, sleeveStartY };
}

function buildNecklinePath(shape: NecklineType, shoulderY: number, halfW: number): string {
  const lx = CX - halfW;
  const rx = CX + halfW;

  switch (shape) {
    case 'crew': {
      const ny = shoulderY + 16;
      return `M${lx},${shoulderY} Q${CX},${ny} ${rx},${shoulderY}`;
    }
    case 'v-neck': {
      const ny = shoulderY + 40;
      return `M${lx},${shoulderY} L${CX},${ny} L${rx},${shoulderY}`;
    }
    case 'scoop': {
      const ny = shoulderY + 30;
      return `M${lx},${shoulderY} Q${CX},${ny + 8} ${rx},${shoulderY}`;
    }
    case 'boat': {
      const inset = halfW * 0.15;
      return `M${lx + inset},${shoulderY} L${rx - inset},${shoulderY}`;
    }
    case 'mock':
      return `M${lx},${shoulderY} Q${CX},${shoulderY + 6} ${rx},${shoulderY}`;
    case 'turtle':
      return `M${lx},${shoulderY - 4} Q${CX},${shoulderY + 4} ${rx},${shoulderY - 4}`;
    case 'square': {
      const sq = halfW * 0.45;
      const ny = shoulderY + 24;
      return `M${lx},${shoulderY} L${CX - sq},${shoulderY} L${CX - sq},${ny} L${CX + sq},${ny} L${CX + sq},${shoulderY} L${rx},${shoulderY}`;
    }
    default:
      return `M${lx},${shoulderY} Q${CX},${shoulderY + 16} ${rx},${shoulderY}`;
  }
}

function buildBodyPath(g: GarmentGeometry): string {
  const lTop = CX - g.bodyTopW;
  const rTop = CX + g.bodyTopW;
  const lBot = CX - g.bodyBotW;
  const rBot = CX + g.bodyBotW;
  return `M${lTop},${g.shoulderY} L${lBot},${g.hemY} L${rBot},${g.hemY} L${rTop},${g.shoulderY}`;
}

function buildSleevePath(
  g: GarmentGeometry,
  side: 'left' | 'right',
  construction: SleeveConstruction,
): string {
  if (g.sleeveLen <= 0) return '';

  const dir = side === 'left' ? -1 : 1;
  const shoulderX = CX + dir * g.bodyTopW;
  const sy = g.sleeveStartY;
  const endY = sy + g.sleeveLen;
  const outerX = shoulderX + dir * g.sleeveTopW;
  const endOuterX = shoulderX + dir * g.sleeveBotW;

  if (construction === 'dolman') {
    const waistY = g.shoulderY + (g.hemY - g.shoulderY) * 0.45;
    const bodyAtWaist = CX + dir * (g.bodyTopW + (g.bodyBotW - g.bodyTopW) * 0.45);
    return `M${shoulderX},${sy} L${outerX},${sy} L${endOuterX},${endY} L${bodyAtWaist},${waistY}`;
  }

  if (construction === 'raglan') {
    const raglanTopX = CX + dir * (g.bodyTopW * 0.4);
    return `M${raglanTopX},${g.shoulderY - 5} L${outerX},${sy + 10} L${endOuterX},${endY} L${shoulderX},${endY > g.hemY ? g.hemY : endY}`;
  }

  if (construction === 'drop-shoulder') {
    const dropX = shoulderX + dir * 8;
    return `M${dropX},${sy + 8} L${dropX + dir * g.sleeveTopW},${sy + 8} L${dropX + dir * g.sleeveBotW},${endY} L${dropX},${endY}`;
  }

  // Set-in
  const armholeDepth = 20;
  return `M${shoulderX},${sy} Q${shoulderX + dir * 4},${sy + armholeDepth} ${outerX},${sy + armholeDepth} L${endOuterX},${endY} L${shoulderX},${endY} Q${shoulderX},${sy + armholeDepth} ${shoulderX},${sy}`;
}

export const GarmentPreview: React.FC = () => {
  const style = useProjectStore((s) => s.style);

  const geometry = useMemo(
    () => computeGeometry(style.bodyShape, style.garmentLength, style.bodyFit, style.sleeve),
    [style.bodyShape, style.garmentLength, style.bodyFit, style.sleeve]
  );

  const necklinePath = useMemo(
    () => buildNecklinePath(style.neckline, geometry.shoulderY, geometry.bodyTopW * 0.45),
    [style.neckline, geometry.shoulderY, geometry.bodyTopW]
  );

  const bodyPath = useMemo(() => buildBodyPath(geometry), [geometry]);

  const leftSleeve = useMemo(
    () => buildSleevePath(geometry, 'left', style.sleeveConstruction),
    [geometry, style.sleeveConstruction]
  );
  const rightSleeve = useMemo(
    () => buildSleevePath(geometry, 'right', style.sleeveConstruction),
    [geometry, style.sleeveConstruction]
  );

  return (
    <div className="garment-preview">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="garmentFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(212, 165, 116, 0.08)" />
            <stop offset="100%" stopColor="rgba(212, 165, 116, 0.02)" />
          </linearGradient>
          <linearGradient id="garmentStroke" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D4A574" />
            <stop offset="100%" stopColor="#9A6A3A" />
          </linearGradient>
          <pattern id="meshPattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="none" />
            <rect x="1" y="1" width="8" height="8" rx="1" fill="none" stroke="rgba(212,165,116,0.06)" strokeWidth="0.5" />
          </pattern>
        </defs>

        {/* Body fill + mesh overlay */}
        <path d={bodyPath} fill="url(#garmentFill)" stroke="none" style={{ transition: 'all 400ms ease' }} />
        <path d={bodyPath} fill="url(#meshPattern)" stroke="none" style={{ transition: 'all 400ms ease' }} />

        {/* Body outline */}
        <path d={bodyPath} fill="none" stroke="url(#garmentStroke)" strokeWidth="2" strokeLinejoin="round"
          style={{ transition: 'all 400ms ease' }} />

        {/* Sleeves */}
        {leftSleeve && (
          <path d={leftSleeve} fill="url(#garmentFill)" stroke="url(#garmentStroke)"
            strokeWidth="1.5" strokeLinejoin="round" opacity="0.85"
            style={{ transition: 'all 400ms ease' }} />
        )}
        {rightSleeve && (
          <path d={rightSleeve} fill="url(#garmentFill)" stroke="url(#garmentStroke)"
            strokeWidth="1.5" strokeLinejoin="round" opacity="0.85"
            style={{ transition: 'all 400ms ease' }} />
        )}

        {/* Neckline */}
        <path d={necklinePath} fill="none" stroke="#D4A574" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ transition: 'all 400ms ease' }} />

        {/* Center front line */}
        <line x1={CX} y1={geometry.shoulderY + 15} x2={CX} y2={geometry.hemY - 5}
          stroke="rgba(212, 165, 116, 0.08)" strokeWidth="1" strokeDasharray="4 6"
          style={{ transition: 'all 400ms ease' }} />

        {/* Hanger dot */}
        <circle cx={CX} cy={geometry.shoulderY - 12} r="3" fill="rgba(212, 165, 116, 0.3)" />
        <line x1={CX} y1={geometry.shoulderY - 9} x2={CX} y2={geometry.shoulderY + 2}
          stroke="rgba(212, 165, 116, 0.15)" strokeWidth="1" />
      </svg>

      <style>{`
        .garment-preview {
          width: 100%;
          max-width: 300px;
          aspect-ratio: 260 / 360;
          margin: 0 auto;
          padding: var(--space-4);
        }
        .garment-preview svg {
          filter: drop-shadow(0 4px 20px rgba(212, 165, 116, 0.1));
        }
      `}</style>
    </div>
  );
};
