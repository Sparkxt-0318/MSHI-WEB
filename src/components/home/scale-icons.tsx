/**
 * Three minimal line-art icons for the cm / m / km tier columns.
 * Drawn at 64x64 with 1.25-stroke. Style aims for technical-illustration,
 * not iconography — closer to a Bedrock spec sheet than Material icons.
 */

interface IconProps {
  className?: string;
}

export function BiosensorIcon({ className }: IconProps) {
  // Simplified biofilm-on-electrode: a horizontal electrode with a layered
  // microbial film and small electron-transfer arrows.
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="square"
    >
      {/* Substrate / electrode rectangle */}
      <rect x="6" y="40" width="52" height="6" />
      {/* Conductive substrate hatch */}
      <line x1="10" y1="46" x2="10" y2="56" />
      <line x1="20" y1="46" x2="20" y2="56" />
      <line x1="30" y1="46" x2="30" y2="56" />
      <line x1="40" y1="46" x2="40" y2="56" />
      <line x1="50" y1="46" x2="50" y2="56" />
      {/* Biofilm undulation */}
      <path d="M6 36 C 14 30, 22 38, 32 32 S 50 36, 58 30" />
      <path d="M6 32 C 14 26, 22 34, 32 28 S 50 32, 58 26" opacity="0.5" />
      {/* Microbial dots */}
      <circle cx="14" cy="34" r="1.4" fill="currentColor" />
      <circle cx="26" cy="32" r="1.4" fill="currentColor" />
      <circle cx="40" cy="34" r="1.4" fill="currentColor" />
      <circle cx="50" cy="30" r="1.4" fill="currentColor" />
      {/* Electron arrows */}
      <path d="M30 22 L 30 14" />
      <path d="M27 17 L 30 14 L 33 17" />
    </svg>
  );
}

export function ChamberIcon({ className }: IconProps) {
  // Simplified chamber: open-bottom dome on soil, with a CO2 vent and
  // soil-line hatching.
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="square"
    >
      {/* Soil hatching */}
      <line x1="4" y1="48" x2="60" y2="48" />
      <line x1="6" y1="52" x2="14" y2="52" />
      <line x1="20" y1="52" x2="30" y2="52" />
      <line x1="34" y1="52" x2="44" y2="52" />
      <line x1="48" y1="52" x2="58" y2="52" />
      <line x1="8" y1="56" x2="20" y2="56" />
      <line x1="26" y1="56" x2="38" y2="56" />
      <line x1="44" y1="56" x2="56" y2="56" />
      {/* Chamber dome */}
      <path d="M14 48 L 14 28 Q 14 14 32 14 Q 50 14 50 28 L 50 48" />
      {/* Vent stack */}
      <line x1="32" y1="14" x2="32" y2="6" />
      <circle cx="32" cy="6" r="2" />
      {/* CO2 arrows inside */}
      <path d="M22 38 L 22 32" opacity="0.6" />
      <path d="M20 34 L 22 32 L 24 34" opacity="0.6" />
      <path d="M40 38 L 40 32" opacity="0.6" />
      <path d="M38 34 L 40 32 L 42 34" opacity="0.6" />
    </svg>
  );
}

export function GlobeIcon({ className }: IconProps) {
  // Simplified globe with grid and a few raster cells highlighted.
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="square"
    >
      <circle cx="32" cy="32" r="22" />
      {/* Latitude lines */}
      <ellipse cx="32" cy="32" rx="22" ry="8" />
      <ellipse cx="32" cy="32" rx="22" ry="16" />
      {/* Longitude lines */}
      <ellipse cx="32" cy="32" rx="8" ry="22" />
      <ellipse cx="32" cy="32" rx="16" ry="22" />
      {/* Highlighted grid cells (small square accents) */}
      <rect x="22" y="20" width="6" height="6" fill="currentColor" opacity="0.18" />
      <rect x="36" y="34" width="6" height="6" fill="currentColor" opacity="0.32" />
      <rect x="28" y="40" width="6" height="6" fill="currentColor" opacity="0.10" />
    </svg>
  );
}
