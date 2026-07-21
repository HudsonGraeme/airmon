// The SPINTEL mark, inlined so it renders with zero fetches and can scale per
// use. Same artwork as public/logo.svg — keep the two in sync if it changes.
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="SPINTEL">
      <defs>
        <linearGradient id="spintel-sweep" x1="19" y1="9.5" x2="50.4" y2="13.6" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4b9cff" stopOpacity="0" />
          <stop offset="1" stopColor="#4b9cff" stopOpacity="0.32" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="29" stroke="#8a8a92" strokeOpacity="0.55" strokeWidth="1.6" strokeDasharray="1.8 5.79" strokeLinecap="round" />
      <circle cx="32" cy="32" r="17.5" stroke="#8a8a92" strokeOpacity="0.28" strokeWidth="1.2" />
      <circle cx="32" cy="32" r="8.75" stroke="#8a8a92" strokeOpacity="0.28" strokeWidth="1.2" />
      <path d="M32 32 L19 9.48 A26 26 0 0 1 50.38 13.62 Z" fill="url(#spintel-sweep)" />
      <line x1="32" y1="32" x2="50.38" y2="13.62" stroke="#4b9cff" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="32" r="3.6" fill="#4b9cff" />
      <circle cx="38.5" cy="12" r="2.4" fill="#f4f4f6" />
      <circle cx="38.5" cy="12" r="4.6" stroke="#f4f4f6" strokeOpacity="0.35" strokeWidth="1.2" />
    </svg>
  );
}
