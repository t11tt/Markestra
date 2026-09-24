"use client";

// Linear-style flowing line field: layered smooth sine curves with a
// travelling-light effect. Deterministic (no random) to stay hydration-safe.

const W = 600;
const H = 820;

function wave(baseY: number, amp: number, waves: number, phase: number) {
  const pts: string[] = [];
  for (let x = 0; x <= W; x += 10) {
    const y = baseY + amp * Math.sin((x / W) * Math.PI * 2 * waves + phase);
    pts.push(`${x} ${y.toFixed(1)}`);
  }
  return "M" + pts.join(" L");
}

export function LineRhythm({ className = "" }: { className?: string }) {
  const base = Array.from({ length: 14 }, (_, i) => ({
    y: 40 + i * 56,
    amp: 26 + (i % 4) * 10,
    waves: 1.4 + (i % 3) * 0.35,
    phase: i * 0.7,
  }));
  const accents = [
    { y: 210, amp: 44, waves: 1.3, phase: 0.2, dur: 5.5 },
    { y: 430, amp: 54, waves: 1.15, phase: 1.4, dur: 7 },
    { y: 610, amp: 40, waves: 1.5, phase: 2.6, dur: 6 },
  ];

  return (
    <svg
      className={className}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="lr-fade" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
          <stop offset="0" stopColor="#5e6ad2" stopOpacity="0" />
          <stop offset="0.5" stopColor="#8b93f2" stopOpacity="1" />
          <stop offset="1" stopColor="#5e6ad2" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lr-accent" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
          <stop offset="0" stopColor="#a5adff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#c6ccff" stopOpacity="1" />
          <stop offset="1" stopColor="#a5adff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <g className="sway">
        {base.map((w, i) => (
          <path
            key={i}
            d={wave(w.y, w.amp, w.waves, w.phase)}
            stroke="url(#lr-fade)"
            strokeWidth="1"
            opacity={0.14 + (i % 3) * 0.05}
          />
        ))}
        {accents.map((w, i) => (
          <path
            key={`a${i}`}
            d={wave(w.y, w.amp, w.waves, w.phase)}
            stroke="url(#lr-accent)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeDasharray="90 1100"
            className="line-flow"
            style={{ animationDuration: `${w.dur}s`, opacity: 0.9 }}
          />
        ))}
      </g>
    </svg>
  );
}
