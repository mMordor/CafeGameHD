// Built-in gaming PC case illustration (used when no 3D model is configured or while it loads).
// Colors come from the CSS custom properties of the selected tier (--accent, --accent-2).

function Fan({ cx, cy, r, tone = "var(--accent)" }: { cx: number; cy: number; r: number; tone?: string }) {
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <circle r={r} fill="#0a0b11" stroke={tone} strokeWidth="2.5" />
      <g className="fan">
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <ellipse key={a} cx="0" cy={-r * 0.45} rx={r * 0.2} ry={r * 0.42} fill={tone} fillOpacity="0.55" transform={`rotate(${a})`} />
        ))}
      </g>
      <circle r={r * 0.18} fill={tone} />
    </g>
  );
}

export default function PCCaseArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 440" className={className} fill="none" role="img" aria-label="کیس کامپیوتر گیمینگ با پنل شیشه‌ای و فن‌های RGB">
      <defs>
        <linearGradient id="pcc-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.22" />
          <stop offset="0.55" stopColor="#0b0c12" stopOpacity="0.92" />
          <stop offset="1" stopColor="var(--accent-2)" stopOpacity="0.2" />
        </linearGradient>
        <filter id="pcc-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* body + feet */}
      <rect x="38" y="16" width="224" height="384" rx="22" fill="#0b0c12" stroke="var(--accent)" strokeWidth="3" filter="url(#pcc-glow)" />
      <rect x="64" y="400" width="26" height="10" rx="4" fill="#15161f" />
      <rect x="210" y="400" width="26" height="10" rx="4" fill="#15161f" />
      {/* top vents */}
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={96 + i * 20} y="26" width="12" height="3" rx="1.5" fill="var(--accent)" fillOpacity="0.35" />
      ))}

      {/* tempered-glass side panel */}
      <rect x="52" y="40" width="196" height="312" rx="14" fill="url(#pcc-glass)" stroke="var(--accent-2)" strokeOpacity="0.5" />

      {/* radiator fans (left column) */}
      <Fan cx={88} cy={92} r={26} />
      <Fan cx={88} cy={160} r={26} tone="var(--accent-2)" />
      <Fan cx={88} cy={228} r={26} />

      {/* motherboard, CPU cooler, RAM */}
      <rect x="132" y="56" width="104" height="176" rx="8" fill="#12141d" stroke="var(--accent)" strokeOpacity="0.45" />
      <Fan cx={170} cy={98} r={24} tone="var(--accent-2)" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={204 + i * 6} y="66" width="4" height="60" rx="2" fill="var(--accent-2)" fillOpacity="0.8" />
      ))}

      {/* GPU */}
      <rect x="118" y="244" width="124" height="40" rx="7" fill="#171a26" stroke="var(--accent)" strokeWidth="2" filter="url(#pcc-glow)" />
      <Fan cx={150} cy={264} r={13} tone="var(--accent-2)" />
      <Fan cx={208} cy={264} r={13} tone="var(--accent-2)" />
      <rect x="120" y="286" width="120" height="3" rx="1.5" fill="var(--accent)" />

      {/* PSU shroud */}
      <rect x="52" y="304" width="196" height="48" rx="10" fill="#0d0e15" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect key={i} x={72 + i * 24} y="318" width="14" height="3" rx="1.5" fill="var(--accent)" fillOpacity="0.3" />
      ))}

      {/* front I/O + glass highlight */}
      <circle cx="150" cy="378" r="7" fill="var(--accent)" filter="url(#pcc-glow)" />
      <polygon points="58,44 118,44 58,150" fill="#fff" fillOpacity="0.05" />
    </svg>
  );
}

export function MiniCase({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" fill="none" aria-hidden="true">
      <rect x="6" y="4" width="68" height="98" rx="10" fill="#0b0c12" stroke={color} strokeWidth="3" />
      <rect x="13" y="12" width="54" height="72" rx="6" fill={color} fillOpacity="0.16" stroke={color} strokeOpacity="0.5" />
      <circle cx="28" cy="30" r="9" stroke={color} strokeWidth="2" />
      <circle cx="28" cy="58" r="9" stroke={color} strokeWidth="2" />
      <circle cx="52" cy="34" r="8" stroke={color} strokeWidth="2" />
      <rect x="40" y="62" width="22" height="10" rx="3" fill={color} fillOpacity="0.6" />
      <circle cx="40" cy="94" r="3.5" fill={color} />
    </svg>
  );
}
