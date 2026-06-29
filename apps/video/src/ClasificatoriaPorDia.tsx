import { loadFont } from "@remotion/google-fonts/Inter";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

import { getBiggestMover, getCurrentDay, getPreviousDay, type StandingDay } from "./standings";

loadFont("normal", { subsets: ["latin"], weights: ["400", "600", "800", "900"] });

type Props = {
  days: StandingDay[];
};

const framesPerDay = 90;
const rowHeight = 54;
const rowGap = 10;
const topOffset = 284;
const leftOffset = 160;
const chartWidth = 1120;
const visibleRowCount = 12;
const palette = ["#fb7185", "#facc15", "#38bdf8", "#a78bfa", "#34d399", "#fb923c", "#f472b6", "#60a5fa"];

export function ClasificatoriaPorDia({ days }: Props) {
  const frame = useCurrentFrame();
  const dayIndex = Math.min(Math.floor(frame / framesPerDay), days.length - 1);
  const day = getCurrentDay(days, dayIndex) ?? days[0]!;
  const previousDay = getPreviousDay(days, dayIndex);
  const progress = interpolate(frame % framesPerDay, [0, 64], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const maxPoints = Math.max(...days.flatMap((entry) => entry.rows.map((row) => row.points)), 1);
  const previousRows = new Map(previousDay?.rows.map((row) => [row.name, row]) ?? []);
  const mover = getBiggestMover(day, previousDay);
  const leader = day.rows[0];
  const visibleRows = day.rows.slice(0, visibleRowCount);

  return (
    <AbsoluteFill style={{ background: "#050816", color: "white", fontFamily: "Inter, sans-serif", overflow: "hidden" }}>
      <div style={{ ...glow("#1d4ed8", 520), left: -120, top: -180 }} />
      <div style={{ ...glow("#be123c", 420), bottom: -160, right: -80 }} />
      {Array.from({ length: 30 }, (_, index) => (
        <div
          key={index}
          style={{
            background: index % 3 === 0 ? "#facc15" : "#38bdf8",
            borderRadius: 999,
            height: 5 + (index % 4) * 4,
            left: `${(index * 127) % 1900}px`,
            opacity: 0.12 + (index % 4) * 0.05,
            position: "absolute",
            top: `${(index * 83 + frame * (index % 5 + 1)) % 1080}px`,
            width: 5 + (index % 4) * 4,
          }}
        />
      ))}

      <section style={{ display: "flex", flexDirection: "column", gap: 10, left: 100, position: "absolute", top: 76 }}>
        <p style={{ color: "#93c5fd", fontSize: 32, fontWeight: 800, letterSpacing: 8, margin: 0, textTransform: "uppercase" }}>
          Quiniela Mundial 2026
        </p>
        <h1 style={{ fontSize: 104, letterSpacing: -6, lineHeight: 0.9, margin: 0 }}>Clasificatoria por dia</h1>
      </section>

      <aside style={{ position: "absolute", right: 100, top: 90, width: 430 }}>
        <div style={{ ...glassCard, padding: 34 }}>
          <p style={{ color: "#facc15", fontSize: 34, fontWeight: 900, margin: 0 }}>{day.label}</p>
          <p style={{ color: "#cbd5e1", fontSize: 46, fontWeight: 900, margin: "8px 0 30px" }}>{day.date}</p>
          <div style={{ background: "rgba(255,255,255,.12)", borderRadius: 999, height: 12, overflow: "hidden" }}>
            <div
              style={{
                background: "linear-gradient(90deg, #facc15, #fb7185, #38bdf8)",
                height: "100%",
                width: `${((dayIndex + progress) / Math.max(days.length - 1, 1)) * 100}%`,
              }}
            />
          </div>
        </div>

        <div style={{ ...glassCard, marginTop: 26, padding: 34 }}>
          <p style={{ color: "#94a3b8", fontSize: 28, fontWeight: 800, margin: 0 }}>Lider del dia</p>
          <p style={{ fontSize: 58, fontWeight: 900, letterSpacing: -3, margin: "10px 0 0" }}>{leader?.name ?? "Por definir"}</p>
          <p style={{ color: "#facc15", fontSize: 42, fontWeight: 900, margin: "4px 0 0" }}>{leader?.points ?? 0} pts</p>
        </div>

        {mover ? (
          <div style={{ ...glassCard, borderColor: "rgba(52,211,153,.55)", marginTop: 26, padding: 30 }}>
            <p style={{ color: "#34d399", fontSize: 28, fontWeight: 900, margin: 0 }}>Subidon</p>
            <p style={{ fontSize: 44, fontWeight: 900, margin: "8px 0 0" }}>{mover.name} +{mover.delta}</p>
          </div>
        ) : null}
      </aside>

      <main style={{ left: leftOffset, position: "absolute", top: topOffset, width: chartWidth }}>
        {visibleRows.map((row, index) => {
          const previous = previousRows.get(row.name);
          const fromRank = previous?.rank ?? row.rank;
          const y = interpolate(progress, [0, 1], [(fromRank - 1) * (rowHeight + rowGap), index * (rowHeight + rowGap)]);
          const points = interpolate(progress, [0, 1], [previous?.points ?? 0, row.points]);
          const barWidth = interpolate(points, [0, maxPoints], [180, chartWidth - 80], { extrapolateRight: "clamp" });
          const color = palette[index % palette.length]!;

          return (
            <div key={row.name} style={{ height: rowHeight, position: "absolute", translate: `0 ${y}px`, width: chartWidth }}>
              <div style={{ alignItems: "center", display: "flex", gap: 20, height: "100%" }}>
                <div style={{ color: "#e2e8f0", fontSize: 34, fontWeight: 900, textAlign: "right", width: 72 }}>#{row.rank}</div>
                <div
                  style={{
                    alignItems: "center",
                    background: `linear-gradient(90deg, ${color}, rgba(255,255,255,.10))`,
                    border: "1px solid rgba(255,255,255,.24)",
                    borderRadius: 20,
                    boxShadow: `0 0 38px ${color}55`,
                    display: "flex",
                    height: 50,
                    justifyContent: "space-between",
                    padding: "0 26px",
                    width: barWidth,
                  }}
                >
                  <span style={{ fontSize: 29, fontWeight: 900, letterSpacing: -1 }}>{row.name}</span>
                  <span style={{ fontSize: 31, fontWeight: 900 }}>{Math.round(points)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </main>

      <div style={{ bottom: 54, color: "#64748b", fontSize: 28, fontWeight: 700, left: 100, position: "absolute" }}>
        Top {visibleRowCount} de {day.rows.length} jugadores • Snapshot exportado de Convex prod
      </div>
    </AbsoluteFill>
  );
}

const glassCard = {
  background: "rgba(15,23,42,.68)",
  border: "1px solid rgba(255,255,255,.18)",
  borderRadius: 34,
  boxShadow: "0 24px 80px rgba(0,0,0,.35)",
} satisfies React.CSSProperties;

function glow(color: string, size: number): React.CSSProperties {
  return {
    background: color,
    borderRadius: 999,
    filter: "blur(120px)",
    height: size,
    opacity: 0.42,
    position: "absolute",
    width: size,
  };
}
