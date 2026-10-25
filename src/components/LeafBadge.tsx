import type { CSSProperties } from "react";

type LeafTier = {
  min: number;
  name: string;
  colors: { leaf: string; line: string; accent: string; glow: string };
  angles: number[];
  legendary?: boolean;
};

const TIERS: LeafTier[] = [
  { min: 50, name: "Lendária", colors: { leaf: "#d8c7f2", line: "#8d68bd", accent: "#e4bd68", glow: "#eadfff" }, angles: [-72, 0, 72, 144, 216], legendary: true },
  { min: 40, name: "Cristal", colors: { leaf: "#c6e5ef", line: "#5797ae", accent: "#8ed1e1", glow: "#d9f5ff" }, angles: [-72, 0, 72, 144, 216] },
  { min: 30, name: "Trevo", colors: { leaf: "#e5d9a8", line: "#a58743", accent: "#d7b34e", glow: "#f5edca" }, angles: [-55, 55, 180] },
  { min: 20, name: "Par", colors: { leaf: "#b8e4d6", line: "#559d86", accent: "#74bea5", glow: "#d8f5e9" }, angles: [-48, 48] },
  { min: 10, name: "Folha", colors: { leaf: "#cce1ac", line: "#789b55", accent: "#9fbe78", glow: "#e5f1d0" }, angles: [0] },
  { min: 1, name: "Broto", colors: { leaf: "#dceac8", line: "#789b55", accent: "#91ad72", glow: "#e5f1d0" }, angles: [-18] },
];

export function getLeafTier(level: number): LeafTier {
  return TIERS.find((tier) => level >= tier.min) ?? TIERS[TIERS.length - 1];
}

type LeafBadgeProps = {
  level: number;
  size?: number;
  showLabel?: boolean;
};

/** Emblema SVG do nível; as faixas visuais são ajustadas em TIERS. */
export default function LeafBadge({ level, size = 120, showLabel = true }: LeafBadgeProps) {
  const tier = getLeafTier(level);
  const style = {
    "--badge-leaf": tier.colors.leaf,
    "--badge-line": tier.colors.line,
    "--badge-accent": tier.colors.accent,
    "--badge-glow": tier.colors.glow,
    width: size,
    height: size,
  } as CSSProperties;

  return (
    <div className={`leaf-badge${tier.legendary ? " is-legendary" : ""}`} style={style} role="img" aria-label={`Nível ${level}, ${tier.name}`}>
      <svg className="leaf-badge-art" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
        <circle className="leaf-badge-ring" cx="60" cy="60" r="51" />
        <circle className="leaf-badge-glow" cx="60" cy="60" r="41" />
        {tier.angles.map((angle, index) => (
          <g key={`${angle}-${index}`} transform={`rotate(${angle} 60 62)`}>
            <path className="leaf-badge-leaf" d="M60 66C45 58 43 40 60 23c17 17 15 35 0 43Z" />
            <path className="leaf-badge-vein" d="M60 64V29M60 48l-8-9m8 17 9-10" />
          </g>
        ))}
        <path className="leaf-badge-stem" d="M60 66v18" />
        {tier.legendary && <g className="leaf-badge-sparkles"><path d="M22 37v10m-5-5h10M92 36v8m-4-4h8M91 83v9m-4-4h8" /></g>}
      </svg>
      {showLabel && <span className="leaf-badge-label">NÍVEL</span>}
      <strong className="leaf-badge-number">{level}</strong>
    </div>
  );
}
