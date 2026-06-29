import { mkdirSync, writeFileSync } from "node:fs";

import snapshot from "../public/standings-snapshot.json";
import { getFinalTopNames, getPlayerRankSeries, type StandingDay } from "./standings";

const days = snapshot.days satisfies StandingDay[];
const names = getFinalTopNames(days, 8);
const width = 1920;
const height = 1080;
const pad = { bottom: 145, left: 140, right: 390, top: 180 };
const chartWidth = width - pad.left - pad.right;
const chartHeight = height - pad.top - pad.bottom;
const colors = ["#facc15", "#38bdf8", "#fb7185", "#a78bfa", "#34d399", "#fb923c", "#f472b6", "#60a5fa"];
const rankSeries = new Map(names.map((name) => [name, getPlayerRankSeries(days, name)]));
const visibleRanks = [...rankSeries.values()].flat();
const minRank = Math.max(1, Math.min(...visibleRanks) - 1);
const maxRank = Math.min(days[0]?.rows.length ?? 24, Math.max(...visibleRanks) + 1);
const x = (index: number) => pad.left + (index / Math.max(days.length - 1, 1)) * chartWidth;
const y = (rank: number) => pad.top + ((rank - minRank) / Math.max(maxRank - minRank, 1)) * chartHeight;

function linePath(points: number[]) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${x(index).toFixed(1)} ${y(point).toFixed(1)}`).join(" ");
}

function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

const rawLabelYs = names.map((name) => ({ name, y: y(rankSeries.get(name)?.at(-1) ?? maxRank) })).sort((left, right) => left.y - right.y);
const labelYs = new Map<string, number>();
let nextY = pad.top + 18;
for (const label of rawLabelYs) {
  const yy = Math.max(label.y, nextY);
  labelYs.set(label.name, Math.min(yy, pad.top + chartHeight - 18));
  nextY = yy + 42;
}

const lines = names.map((name, index) => {
  const series = rankSeries.get(name) ?? [];
  const color = colors[index % colors.length]!;
  const last = series.at(-1) ?? 0;
  const labelY = labelYs.get(name) ?? y(last);
  return `
    <path d="${linePath(series)}" fill="none" stroke="rgba(5,8,22,.7)" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${linePath(series)}" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    ${series.map((rank, dayIndex) => `<circle cx="${x(dayIndex).toFixed(1)}" cy="${y(rank).toFixed(1)}" r="7" fill="${color}" stroke="#050816" stroke-width="4"/>`).join("\n")}
    <line x1="${(width - pad.right + 12).toFixed(1)}" x2="${width - 330}" y1="${y(last).toFixed(1)}" y2="${labelY.toFixed(1)}" stroke="${color}" stroke-width="2" opacity=".65"/>
    <text x="${width - 315}" y="${(labelY + 11).toFixed(1)}" fill="${color}" font-size="34" font-weight="900">#${last} ${escapeXml(name)}</text>
  `;
}).join("\n");

const tickStep = Math.max(1, Math.ceil((maxRank - minRank) / 6));
const ticks = Array.from({ length: Math.floor((maxRank - minRank) / tickStep) + 1 }, (_, index) => minRank + index * tickStep);
if (!ticks.includes(maxRank)) {
  ticks.push(maxRank);
}
const grid = ticks.map((rank) => {
  const yy = y(rank);
  return `
    <line x1="${pad.left}" x2="${width - pad.right}" y1="${yy}" y2="${yy}" stroke="rgba(255,255,255,.12)"/>
    <text x="58" y="${yy + 10}" fill="#94a3b8" font-size="28" font-weight="800">#${rank}</text>
  `;
}).join("\n");

const labels = days.map((day, index) => index % 2 === 0 || index === days.length - 1 ? `
  <text x="${x(index)}" y="${height - 84}" fill="#94a3b8" font-size="24" font-weight="800" text-anchor="middle">${escapeXml(day.date)}</text>
` : `
  <circle cx="${x(index)}" cy="${height - 92}" r="4" fill="#475569"/>
`).join("\n");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#050816"/>
  <circle cx="50" cy="10" r="420" fill="#1d4ed8" opacity=".36" filter="url(#blur)"/>
  <circle cx="1840" cy="980" r="360" fill="#be123c" opacity=".34" filter="url(#blur)"/>
  <defs><filter id="blur"><feGaussianBlur stdDeviation="90"/></filter></defs>
  <text x="100" y="96" fill="#93c5fd" font-family="Inter, Arial, sans-serif" font-size="32" font-weight="800" letter-spacing="8">QUINIELA MUNDIAL 2026</text>
  <text x="100" y="170" fill="white" font-family="Inter, Arial, sans-serif" font-size="82" font-weight="900" letter-spacing="-4">Movimiento en la tabla</text>
  <text x="100" y="225" fill="#cbd5e1" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="700">Top ${names.length} final · menor numero es mejor · ${days.length} dias</text>
  <g font-family="Inter, Arial, sans-serif">${grid}${labels}${lines}</g>
</svg>
`;

mkdirSync("out", { recursive: true });
writeFileSync("out/clasificatoria-lineas.svg", svg);
