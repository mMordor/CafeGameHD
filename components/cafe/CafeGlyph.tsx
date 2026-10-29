export type CafeGlyphKind = "ice" | "drop" | "leaf" | "bean" | "swirl" | "wedge" | "ring" | "spark";

const base = {
  fill: "var(--accent)",
  fillOpacity: 0.28,
  stroke: "currentColor",
  strokeWidth: 2.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

// Small decorative shapes: floating items and category icons.
export default function CafeGlyph({ kind }: { kind: CafeGlyphKind }) {
  return (
    <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" aria-hidden="true">
      {kind === "ice" && (
        <g {...base}>
          <rect x="12" y="12" width="40" height="40" rx="9" transform="rotate(-12 32 32)" />
          <path d="M22 24l8-4M22 32l4-2" fill="none" />
        </g>
      )}
      {kind === "drop" && (
        <g {...base}>
          <path d="M32 8C22 22 14 30 14 40a18 18 0 0036 0C50 30 42 22 32 8z" />
          <path d="M24 42a8 8 0 006 6" fill="none" />
        </g>
      )}
      {kind === "leaf" && (
        <g {...base}>
          <path d="M10 54C8 28 26 10 54 10c0 28-16 46-44 44z" />
          <path d="M10 54L42 22" fill="none" />
        </g>
      )}
      {kind === "bean" && (
        <g {...base}>
          <ellipse cx="32" cy="32" rx="17" ry="25" transform="rotate(35 32 32)" />
          <path d="M22 14c8 10-6 22 2 36" fill="none" transform="rotate(35 32 32)" />
        </g>
      )}
      {kind === "swirl" && (
        <g {...base}>
          <path d="M32 54c-14 0-22-8-22-18s8-16 18-16 14 6 14 12-4 10-10 10-8-4-8-8" fill="none" />
        </g>
      )}
      {kind === "wedge" && (
        <g {...base}>
          <path d="M10 44C14 22 30 10 54 12c-2 24-16 40-40 42z" />
          <path d="M20 40c6-10 14-16 26-20" fill="none" />
        </g>
      )}
      {kind === "ring" && (
        <g {...base}>
          <circle cx="32" cy="32" r="22" />
          <circle cx="32" cy="32" r="8" fill="none" />
        </g>
      )}
      {kind === "spark" && (
        <g {...base}>
          <path d="M32 6l6 20 20 6-20 6-6 20-6-20-20-6 20-6z" />
        </g>
      )}
    </svg>
  );
}
