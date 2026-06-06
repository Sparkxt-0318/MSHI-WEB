import * as React from 'react';

interface CellSpec {
  x: number;
  hex: string;
  density: number; // 0..1 biofilm + electron richness
  height: number; // biofilm column height
}

const CELLS: CellSpec[] = [
  { x: 70, hex: '#46C76A', density: 1.0, height: 58 },
  { x: 200, hex: '#E0982B', density: 0.55, height: 32 },
  { x: 330, hex: '#E0483C', density: 0.22, height: 14 },
];

function dots(spec: CellSpec): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const n = Math.round(spec.density * 12);
  let seed = Math.round(spec.x);
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < n; i++) {
    const cx = spec.x + 4 + (rnd() - 0.5) * 30;
    const cy = 150 - rnd() * (spec.height + 24);
    out.push(<circle key={`e${i}`} cx={cx} cy={cy} r={1.6} fill="#8FE3FF" opacity={0.85} />);
  }
  return out;
}

/**
 * Static, dependency-free poster of the simulation scene (no WebGL). Used by
 * the homepage teaser and as the fallback when WebGL is unavailable.
 */
export function SimulationPoster({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 200"
      className={className}
      role="img"
      aria-label="Illustration of three electrochemical cells — healthy, salt-stressed and degraded soil — with glowing electrons and a rising current trace."
    >
      <defs>
        <radialGradient id="sim-poster-bg" cx="50%" cy="38%" r="75%">
          <stop offset="0%" stopColor="#15324f" />
          <stop offset="100%" stopColor="#0a1628" />
        </radialGradient>
      </defs>
      <rect width="420" height="200" fill="url(#sim-poster-bg)" />

      {CELLS.map((spec) => (
        <g key={spec.x}>
          {/* vessel */}
          <rect x={spec.x - 22} y={70} width={44} height={84} rx={6} fill="none" stroke="#39516b" strokeWidth={1.4} />
          {/* soil */}
          <rect x={spec.x - 21} y={128} width={42} height={25} rx={2} fill="#2c2118" />
          {/* working electrode */}
          <line x1={spec.x} y1={150} x2={spec.x} y2={88} stroke="#2b2f36" strokeWidth={3} />
          {/* biofilm column */}
          <rect
            x={spec.x - 5}
            y={150 - spec.height}
            width={10}
            height={spec.height}
            rx={5}
            fill={spec.hex}
            opacity={0.9}
          />
          {dots(spec)}
          {/* score chip */}
          <text x={spec.x} y={172} textAnchor="middle" fontFamily="Georgia, serif" fontSize={13} fontWeight={700} fill={spec.hex}>
            {spec.density >= 0.9 ? '0.90' : spec.density >= 0.5 ? '0.55' : '0.20'}
          </text>
        </g>
      ))}

      {/* mini CA trace, top-right */}
      <g transform="translate(300,18)">
        <rect width="104" height="44" rx={3} fill="#0a1628" opacity={0.7} stroke="#ffffff" strokeOpacity={0.1} />
        <path d="M6 36 C 30 36, 40 14, 98 9" fill="none" stroke="#46C76A" strokeWidth={1.6} />
        <path d="M6 37 C 34 37, 48 28, 98 24" fill="none" stroke="#E0982B" strokeWidth={1.4} />
        <path d="M6 38 C 40 38, 60 36, 98 34" fill="none" stroke="#E0483C" strokeWidth={1.4} />
        <text x="6" y="10" fontFamily="monospace" fontSize="6" fill="#8FE3FF" opacity={0.9}>CA</text>
      </g>
    </svg>
  );
}
