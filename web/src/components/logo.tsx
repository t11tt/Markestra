"use client";

export function Mark({
  size = 36,
  glow = false,
  className = "",
}: {
  size?: number;
  glow?: boolean;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      style={glow ? { filter: "drop-shadow(0 4px 16px rgba(94,106,210,0.55))" } : undefined}
      aria-hidden
    >
      <defs>
        <linearGradient id="mk-tok" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#22242e" />
          <stop offset="1" stopColor="#0b0c0f" />
        </linearGradient>
        <linearGradient id="mk-str" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#8b93f2" />
          <stop offset="0.55" stopColor="#ffffff" />
          <stop offset="1" stopColor="#c6ccff" />
        </linearGradient>
      </defs>

      {/* token */}
      <rect
        x="0.75"
        y="0.75"
        width="38.5"
        height="38.5"
        rx="11"
        fill="url(#mk-tok)"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1"
      />
      <rect x="3" y="2.5" width="34" height="15" rx="9" fill="#fff" opacity="0.05" />

      {/* conductor's slur / phrase arc over the M */}
      <path
        d="M9.5 12.5 Q20 6.5 30.5 12.5"
        stroke="url(#mk-str)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <circle cx="30.5" cy="12.5" r="1.5" fill="#a5adff" />

      {/* M letterform */}
      <path
        d="M11 29 L11 15 L20 23 L29 15 L29 29"
        stroke="url(#mk-str)"
        strokeWidth="3.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* note head at the heart of the M */}
      <circle cx="20" cy="23" r="2.1" fill="#fff" />
    </svg>
  );
}

export function Logo({
  size = 34,
  withTagline = false,
  glow = false,
  className = "",
}: {
  size?: number;
  withTagline?: boolean;
  glow?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Mark size={size} glow={glow} />
      <div className="leading-none">
        <div
          className="font-brand text-cream"
          style={{ fontSize: size * 0.56 }}
        >
          Markestra
        </div>
        {withTagline && (
          <div className="mt-1.5 text-[10px] uppercase tracking-[0.32em] text-subtle">
            market · orchestra
          </div>
        )}
      </div>
    </div>
  );
}
