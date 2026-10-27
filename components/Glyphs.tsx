export const GLYPH_KINDS = ["controller", "keycap", "mouse", "headset", "gpu", "chip"] as const;
export type GlyphName = (typeof GLYPH_KINDS)[number] | "cup";
export type GlyphKind = GlyphName;

const base = {
  fill: "var(--accent)",
  fillOpacity: 0.25,
  stroke: "currentColor",
  strokeWidth: 2.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function Glyph({ kind }: { kind: GlyphKind }) {
  return (
    <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" aria-hidden="true">
      {kind === "controller" && (
        <g {...base}>
          <path d="M18 22h28c6 0 10 5 11 12l2 10c1 5-5 8-9 4l-6-7H20l-6 7c-4 4-10 1-9-4l2-10c1-7 5-12 11-12z" />
          <path d="M20 31v8M16 35h8" fill="none" />
          <circle cx="42" cy="31" r="2" fill="currentColor" />
          <circle cx="47" cy="36" r="2" fill="currentColor" />
        </g>
      )}
      {kind === "keycap" && (
        <g {...base}>
          <rect x="8" y="8" width="48" height="48" rx="10" />
          <rect x="16" y="14" width="32" height="30" rx="6" fill="none" />
          <path d="M26 28l6-6 6 6M32 22v14" fill="none" />
        </g>
      )}
      {kind === "mouse" && (
        <g {...base}>
          <rect x="18" y="6" width="28" height="52" rx="14" />
          <path d="M32 6v20M18 26h28" fill="none" />
          <rect x="29" y="12" width="6" height="9" rx="3" fill="currentColor" />
        </g>
      )}
      {kind === "headset" && (
        <g {...base}>
          <path d="M12 38V32a20 20 0 0140 0v6" fill="none" />
          <rect x="8" y="36" width="12" height="18" rx="5" />
          <rect x="44" y="36" width="12" height="18" rx="5" />
          <path d="M50 54c0 4-6 5-12 5" fill="none" />
        </g>
      )}
      {kind === "gpu" && (
        <g {...base}>
          <rect x="4" y="16" width="56" height="30" rx="5" />
          <circle cx="23" cy="31" r="10" fill="none" />
          <circle cx="45" cy="31" r="10" fill="none" />
          <path d="M23 25v12M17 31h12M45 25v12M39 31h12" fill="none" />
          <path d="M12 46v6h14v-6" fill="none" />
        </g>
      )}
      {kind === "cup" && (
        <g {...base}>
          <path d="M12 22h34v18a14 14 0 01-14 14h-6a14 14 0 01-14-14z" />
          <path d="M46 28h4a7 7 0 010 14h-4" fill="none" />
          <path d="M22 8c-3 4 3 6 0 10M32 8c-3 4 3 6 0 10M42 8c-3 4 3 6 0 10" fill="none" />
          <path d="M10 58h38" fill="none" />
        </g>
      )}
      {kind === "chip" && (
        <g {...base}>
          <rect x="14" y="14" width="36" height="36" rx="6" />
          <rect x="24" y="24" width="16" height="16" rx="3" fill="currentColor" fillOpacity={0.9} />
          <path d="M22 6v8M32 6v8M42 6v8M22 50v8M32 50v8M42 50v8M6 22h8M6 32h8M6 42h8M50 22h8M50 32h8M50 42h8" fill="none" />
        </g>
      )}
    </svg>
  );
}
