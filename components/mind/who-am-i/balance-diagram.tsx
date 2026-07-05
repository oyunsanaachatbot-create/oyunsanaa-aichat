"use client";

import type { Dictionary } from "@/lib/i18n/dictionaries/mn";
import type {
  BalanceAreaKey,
  BalancePercents,
} from "@/lib/mind/who-am-i-balance";

export type BalanceVizMode = "kite" | "platform" | "auras";

function humanFigure({
  cx,
  feetY,
  s,
  rot,
  color = "#403C34",
}: {
  cx: number;
  feetY: number;
  s: number;
  rot: number;
  color?: string;
}) {
  const w = 5 * s;
  const hipY = feetY - 30 * s;
  const shY = feetY - 58 * s;
  const headY = feetY - 71 * s;
  return `
    <g transform="rotate(${rot.toFixed(2)} ${cx} ${feetY})"
       fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">
      <path d="M${cx - 7 * s} ${feetY} L${cx} ${hipY} L${cx + 7 * s} ${feetY}"/>
      <line x1="${cx}" y1="${hipY}" x2="${cx}" y2="${shY + 4 * s}"/>
      <path d="M${cx - 13 * s} ${shY + 13 * s} L${cx} ${shY + 2 * s} L${cx + 13 * s} ${shY + 13 * s}"/>
      <circle cx="${cx}" cy="${headY}" r="${9 * s}" fill="${color}" stroke="none"/>
    </g>`;
}

type DiagramLabels = Dictionary["apps"]["lifeBalance"]["diagramLabels"];

function drawAuras(p: BalancePercents, labels: DiagramLabels): string {
  const cx = 160;
  const feetY = 246;
  const coreY = feetY - 40;
  const off = 50;
  const blobs: Array<{
    k: BalanceAreaKey;
    dx: number;
    dy: number;
    hex: string;
    t: string;
    lx: number;
    ly: number;
    anc: string;
  }> = [
    {
      k: "meaning",
      dx: 0,
      dy: -off,
      hex: "#6E6CA3",
      t: labels.meaning,
      lx: 0,
      ly: -off - 30,
      anc: "middle",
    },
    {
      k: "work",
      dx: off,
      dy: 0,
      hex: "#C28A3C",
      t: labels.work,
      lx: off + 6,
      ly: -off - 2,
      anc: "start",
    },
    {
      k: "body",
      dx: 0,
      dy: off,
      hex: "#7E9B6E",
      t: labels.body,
      lx: 0,
      ly: off + 34,
      anc: "middle",
    },
    {
      k: "bond",
      dx: -off,
      dy: 0,
      hex: "#C36C71",
      t: labels.bond,
      lx: -off - 6,
      ly: -off - 2,
      anc: "end",
    },
  ];
  const glow = blobs
    .map((b) => {
      const r = 13 + (p[b.k] / 100) * 64;
      return `<circle cx="${cx + b.dx}" cy="${coreY + b.dy}" r="${r}" fill="${b.hex}" opacity="0.30" filter="url(#wai-soft)"/>
              <circle cx="${cx + b.dx}" cy="${coreY + b.dy}" r="${r}" fill="none" stroke="${b.hex}" stroke-width="1.5" opacity="0.5"/>`;
    })
    .join("");
  const blobLabels = blobs
    .map(
      (b) =>
        `<text x="${cx + b.lx}" y="${coreY + b.ly}" text-anchor="${b.anc}" font-family="Inter,sans-serif" font-size="11.5" font-weight="600" fill="${b.hex}">${b.t} ${p[b.k]}%</text>`
    )
    .join("");
  return `
    <defs><filter id="wai-soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="7"/></filter></defs>
    ${glow}
    ${humanFigure({ cx, feetY, s: 1, rot: 0 })}
    ${blobLabels}`;
}

function drawPlatform(p: BalancePercents, labels: DiagramLabels): string {
  const cx = 160;
  const baseY = 276;
  const xL = 92;
  const xR = 228;
  const hL = 26 + (p.bond / 100) * 88;
  const hR = 26 + (p.work / 100) * 88;
  const topL = baseY - hL;
  const topR = baseY - hR;
  const tilt = (Math.atan2(topR - topL, xR - xL) * 180) / Math.PI;
  const midX = (xL + xR) / 2;
  const midY = (topL + topR) / 2;

  const bodyW = 60 + (p.body / 100) * 150;
  const bodyThin = p.body < 18;
  const ground = `
    <rect x="${cx - bodyW / 2}" y="${baseY}" width="${bodyW}" height="10" rx="5"
      fill="#7E9B6E" opacity="${0.55 + p.body / 250}" ${bodyThin ? 'stroke="#7E9B6E" stroke-dasharray="5 4" stroke-width="1.5"' : ""}/>
    <text x="${cx}" y="${baseY + 26}" text-anchor="middle" font-family="Inter,sans-serif" font-size="11.5" font-weight="600" fill="#7E9B6E">${labels.body} ${p.body}%</text>`;

  const poles = `
    <rect x="${xL - 6}" y="${topL}" width="12" height="${baseY - topL}" rx="6" fill="#C36C71"/>
    <rect x="${xR - 6}" y="${topR}" width="12" height="${baseY - topR}" rx="6" fill="#C28A3C"/>
    <text x="${xL}" y="${baseY + 26}" text-anchor="middle" font-family="Inter,sans-serif" font-size="11.5" font-weight="600" fill="#C36C71">${labels.bond} ${p.bond}%</text>
    <text x="${xR}" y="${baseY + 26}" text-anchor="middle" font-family="Inter,sans-serif" font-size="11.5" font-weight="600" fill="#C28A3C">${labels.work} ${p.work}%</text>`;

  const beam = `<g transform="rotate(${tilt.toFixed(2)} ${midX} ${midY})">
      <rect x="${midX - 78}" y="${midY - 7}" width="156" height="11" rx="5" fill="#403C34"/>
    </g>`;

  const starS = 5 + (p.meaning / 100) * 16;
  const starY = midY - 96;
  const starOp = 0.25 + (p.meaning / 100) * 0.75;
  const star = `
    <g opacity="${starOp.toFixed(2)}" transform="translate(${cx} ${starY})">
      <g stroke="#6E6CA3" stroke-width="1.4" opacity="0.6">
        <line x1="0" y1="${-starS - 7}" x2="0" y2="${-starS - 15}"/>
        <line x1="${starS + 7}" y1="0" x2="${starS + 15}" y2="0"/>
        <line x1="${-starS - 7}" y1="0" x2="${-starS - 15}" y2="0"/>
      </g>
      <path d="M0 ${-starS} L${starS * 0.32} ${-starS * 0.32} L${starS} 0 L${starS * 0.32} ${starS * 0.32} L0 ${starS} L${-starS * 0.32} ${starS * 0.32} L${-starS} 0 L${-starS * 0.32} ${-starS * 0.32} Z" fill="#6E6CA3"/>
    </g>
    <text x="${cx}" y="${starY - starS - 24}" text-anchor="middle" font-family="Inter,sans-serif" font-size="11.5" font-weight="600" fill="#6E6CA3" opacity="${Math.max(0.5, starOp).toFixed(2)}">${labels.meaning} ${p.meaning}%</text>`;

  const fig = humanFigure({ cx: midX, feetY: midY - 6, s: 0.82, rot: tilt });

  return `${ground}${poles}${beam}${star}${fig}`;
}

function drawKite(p: BalancePercents, labels: DiagramLabels): string {
  const cx = 160;
  const cy = 160;
  const R = 120;
  const axes: Array<{ k: BalanceAreaKey; x: number; y: number; hex: string }> =
    [
      { k: "meaning", x: 0, y: -1, hex: "#6E6CA3" },
      { k: "work", x: 1, y: 0, hex: "#C28A3C" },
      { k: "body", x: 0, y: 1, hex: "#7E9B6E" },
      { k: "bond", x: -1, y: 0, hex: "#C36C71" },
    ];
  const pts = axes.map((a) => {
    const r = (p[a.k] / 100) * R;
    return [cx + a.x * r, cy + a.y * r, a.hex] as const;
  });
  const poly = pts
    .map((pt) => `${pt[0].toFixed(1)},${pt[1].toFixed(1)}`)
    .join(" ");

  const refR = 0.25 * R;
  const ref = `${cx},${cy - refR} ${cx + refR},${cy} ${cx},${cy + refR} ${cx - refR},${cy}`;

  const grid = [0.25, 0.5, 0.75, 1]
    .map((f) => {
      const r = f * R;
      return `<polygon points="${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}" fill="none" stroke="#D3CBB9" stroke-width="1" opacity="${f === 1 ? 0.55 : 0.3}"/>`;
    })
    .join("");

  const spokes = axes
    .map(
      (a) =>
        `<line x1="${cx}" y1="${cy}" x2="${cx + a.x * R}" y2="${cy + a.y * R}" stroke="#D3CBB9" stroke-width="1" opacity=".35"/>`
    )
    .join("");

  const dots = pts
    .map((pt) => `<circle cx="${pt[0]}" cy="${pt[1]}" r="5" fill="${pt[2]}"/>`)
    .join("");

  const axisLabels = [
    { t: labels.meaning, x: cx, y: cy - R - 12, anchor: "middle" },
    { t: labels.work, x: cx + R + 10, y: cy + 4, anchor: "start" },
    { t: labels.body, x: cx, y: cy + R + 22, anchor: "middle" },
    { t: labels.bond, x: cx - R - 10, y: cy + 4, anchor: "end" },
  ]
    .map(
      (l) =>
        `<text x="${l.x}" y="${l.y}" text-anchor="${l.anchor}" font-family="Inter,sans-serif" font-size="12" font-weight="600" fill="#6A655B">${l.t}</text>`
    )
    .join("");

  return `
    <defs>
      <linearGradient id="wai-kg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#6E6CA3" stop-opacity=".35"/>
        <stop offset="0.5" stop-color="#C36C71" stop-opacity=".3"/>
        <stop offset="1" stop-color="#7E9B6E" stop-opacity=".35"/>
      </linearGradient>
    </defs>
    ${grid}${spokes}
    <polygon points="${ref}" fill="none" stroke="#9b9486" stroke-width="1.2" stroke-dasharray="4 4" opacity=".7"/>
    <polygon points="${poly}" fill="url(#wai-kg)" stroke="#2C2A24" stroke-width="2" stroke-linejoin="round" opacity=".9"/>
    ${dots}${axisLabels}`;
}

export function BalanceDiagram({
  mode,
  pct,
  labels,
  ariaLabel,
  className = "",
}: {
  mode: BalanceVizMode;
  pct: BalancePercents;
  labels: DiagramLabels;
  ariaLabel: string;
  className?: string;
}) {
  const inner =
    mode === "auras"
      ? drawAuras(pct, labels)
      : mode === "platform"
        ? drawPlatform(pct, labels)
        : drawKite(pct, labels);
  return (
    <svg
      aria-label={ariaLabel}
      className={className}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG markup is generated entirely from numeric percentages above, no user input.
      dangerouslySetInnerHTML={{ __html: inner }}
      viewBox="0 0 320 320"
    />
  );
}
