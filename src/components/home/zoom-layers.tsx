import Image from 'next/image';

/**
 * The "m" layer: a soil-respiration chamber drawn in the technical-illustration
 * style of ChamberIcon, scaled up onto the dark scope, with the biosensor shown
 * as a glowing node at its base (the point the cm cell recedes into and the km
 * map grows from).
 */
export function SoilChamberLayer() {
  const stroke = '#8FB7D8';
  return (
    <div className="flex h-full w-full items-center justify-center">
      <svg
        viewBox="0 0 520 460"
        className="h-[78%] w-auto max-w-[88%]"
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="square"
      >
        {/* soil line + hatching */}
        <line x1="40" y1="330" x2="480" y2="330" />
        {[60, 130, 200, 270, 340, 410].map((x) => (
          <line key={x} x1={x} y1="338" x2={x + 28} y2="338" opacity="0.7" />
        ))}
        {[95, 235, 375].map((x) => (
          <line key={x} x1={x} y1="350" x2={x + 40} y2="350" opacity="0.45" />
        ))}
        {/* chamber dome */}
        <path
          d="M150 330 L150 200 Q150 110 260 110 Q370 110 370 200 L370 330"
          fill="rgba(63,124,171,0.08)"
        />
        {/* vent stack */}
        <line x1="260" y1="110" x2="260" y2="64" />
        <circle cx="260" cy="56" r="8" />
        {/* CO2 flux arrows */}
        {[200, 260, 320].map((x, i) => (
          <g key={x} opacity="0.65" style={{ transform: `translateY(${i % 2 ? 6 : 0}px)` }}>
            <path d={`M${x} 300 L${x} 250`} />
            <path d={`M${x - 6} 262 L${x} 250 L${x + 6} 262`} />
          </g>
        ))}
        {/* glowing biosensor node at the base */}
        <circle cx="260" cy="322" r="26" fill="#8FE3FF" opacity="0.10" stroke="none" />
        <circle cx="260" cy="322" r="14" fill="#8FE3FF" opacity="0.22" stroke="none" />
        <circle cx="260" cy="322" r="5" fill="#CFF4FF" stroke="none" />
        <text x="260" y="392" textAnchor="middle" fontFamily="SF Mono, monospace" fontSize="13" fill={stroke} stroke="none">
          biosensor · cm
        </text>
        {/* scale bar */}
        <g stroke={stroke} opacity="0.8">
          <line x1="40" y1="430" x2="140" y2="430" />
          <line x1="40" y1="425" x2="40" y2="435" />
          <line x1="140" y1="425" x2="140" y2="435" />
        </g>
        <text x="40" y="418" fontFamily="SF Mono, monospace" fontSize="12" fill={stroke} stroke="none">
          1 m
        </text>
      </svg>
    </div>
  );
}

/**
 * The "km" layer: the continental satellite atlas, with a glowing "you-are-here"
 * pin over the training region. Lazy next/image (no priority) so Vercel serves a
 * small responsive variant of the large source PNG.
 */
export function AtlasLayer() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <Image
        src="/images/atlas_zoom.webp"
        alt="Continental soil-respiration anomaly atlas"
        fill
        sizes="100vw"
        className="object-cover"
      />
      {/* dark wash for contrast + scope match */}
      <div className="absolute inset-0 bg-[#0A1628]/35" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628]/70 via-transparent to-[#0A1628]/30" />

      {/* glowing pin over the training region */}
      <div className="absolute" style={{ left: '61%', top: '44%' }}>
        <span className="absolute -left-3 -top-3 inline-flex h-6 w-6 animate-ping rounded-full bg-cyan-300/60" />
        <span className="absolute -left-1.5 -top-1.5 inline-block h-3 w-3 rounded-full bg-cyan-200 shadow-[0_0_12px_4px_rgba(143,227,255,0.7)]" />
        <span className="absolute left-3 top-2 whitespace-nowrap font-mono text-[0.6rem] uppercase tracking-[0.08em] text-cyan-100/90">
          chamber site
        </span>
      </div>

      {/* scale bar */}
      <div className="absolute bottom-6 left-6 text-cyan-50/80">
        <div className="h-px w-24 bg-cyan-50/70" />
        <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.08em]">≈ 1000 km</p>
      </div>
    </div>
  );
}
