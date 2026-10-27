// Decorative CSS/SVG hero art for the three menu sections (no photography is invented).
// Motion is plain CSS and is disabled by prefers-reduced-motion in cafe.css.

export function ColdArt() {
  return (
    <svg viewBox="0 0 320 360" className="cf-art" fill="none" role="img" aria-label="لیوان نوشیدنی سرد با یخ">
      <g className="cf-float">
        <path d="M70 70h180l-18 250a22 22 0 01-22 20H110a22 22 0 01-22-20z" fill="#ffffff" fillOpacity="0.55" stroke="#1E2B37" strokeWidth="4" strokeLinejoin="round" />
        <path d="M84 150h152l-12 170a18 18 0 01-18 16H114a18 18 0 01-18-16z" fill="#8FE3CF" fillOpacity="0.55" />
        <g className="cf-bob">
          <rect x="112" y="108" width="52" height="52" rx="10" fill="#fff" fillOpacity="0.85" stroke="#1E2B37" strokeWidth="3" transform="rotate(-12 138 134)" />
        </g>
        <g className="cf-bob cf-bob2">
          <rect x="168" y="124" width="46" height="46" rx="10" fill="#fff" fillOpacity="0.85" stroke="#1E2B37" strokeWidth="3" transform="rotate(10 191 147)" />
        </g>
        <path d="M200 20l-30 120" stroke="#2BB7B0" strokeWidth="10" strokeLinecap="round" />
        <circle cx="130" cy="230" r="7" fill="#fff" fillOpacity="0.7" className="cf-rise" />
        <circle cx="180" cy="270" r="5" fill="#fff" fillOpacity="0.7" className="cf-rise cf-rise2" />
        <circle cx="156" cy="300" r="6" fill="#fff" fillOpacity="0.7" className="cf-rise cf-rise3" />
      </g>
    </svg>
  );
}

export function HotArt() {
  return (
    <svg viewBox="0 0 320 360" className="cf-art" fill="none" role="img" aria-label="فنجان قهوه با بخار">
      <g className="cf-float">
        <path className="cf-steam" d="M120 120c-16-22 16-34 0-58" stroke="#3B2418" strokeOpacity="0.55" strokeWidth="6" strokeLinecap="round" />
        <path className="cf-steam cf-steam2" d="M160 120c-16-22 16-34 0-58" stroke="#3B2418" strokeOpacity="0.55" strokeWidth="6" strokeLinecap="round" />
        <path className="cf-steam cf-steam3" d="M200 120c-16-22 16-34 0-58" stroke="#3B2418" strokeOpacity="0.55" strokeWidth="6" strokeLinecap="round" />
        <path d="M80 150h160v70a70 70 0 01-70 70h-20a70 70 0 01-70-70z" fill="#3B2418" />
        <ellipse cx="160" cy="150" rx="80" ry="14" fill="#6b4630" />
        <path d="M240 175h14a30 30 0 010 60h-18" stroke="#3B2418" strokeWidth="14" strokeLinecap="round" />
        <ellipse cx="160" cy="310" rx="110" ry="14" fill="#D9BE9C" />
        <path d="M70 160h180" stroke="#F6EBDD" strokeOpacity="0.25" strokeWidth="3" />
      </g>
    </svg>
  );
}

export function FoodArt() {
  return (
    <svg viewBox="0 0 320 360" className="cf-art" fill="none" role="img" aria-label="بشقاب غذا">
      <g className="cf-float">
        <g className="cf-spin">
          <circle cx="160" cy="180" r="130" fill="#FBE3B8" stroke="#2B2B2E" strokeWidth="4" />
          <circle cx="160" cy="180" r="98" fill="#F2A93B" fillOpacity="0.55" stroke="#2B2B2E" strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" />
          <circle cx="160" cy="180" r="56" fill="#C8553D" />
          <circle cx="146" cy="168" r="14" fill="#F2A93B" />
          <circle cx="178" cy="196" r="10" fill="#FBE3B8" />
        </g>
        <rect x="18" y="70" width="10" height="150" rx="5" fill="#2B2B2E" />
        <rect x="292" y="70" width="10" height="150" rx="5" fill="#2B2B2E" />
      </g>
    </svg>
  );
}
