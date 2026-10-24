export function Monogram({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="lumen-mark" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#5fe3d3" />
          <stop offset="0.56" stopColor="var(--accent)" />
          <stop offset="1" stopColor="#d9c9ff" />
        </linearGradient>
      </defs>
      <path
        d="M6.5 23.2c3.1-6.5 6.7-2.6 10.2-9.3 2.1-4 5.3-4.6 7.6-6.4"
        fill="none"
        stroke="url(#lumen-mark)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M7 26.6c3.4-3.8 6.6-1.8 9.7-5.6 2.3-3 5.1-3.5 7.6-4.5"
        fill="none"
        stroke="url(#lumen-mark)"
        strokeOpacity="0.32"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle cx="25.4" cy="7.4" r="1.35" fill="var(--text)" />
    </svg>
  );
}
