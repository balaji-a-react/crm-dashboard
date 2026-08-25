/**
 * App logo -- single source of truth shared with the favicon (app/icon.svg):
 * dark rounded tile + light "C" arc and dot. Rendered inline (not <img>) so
 * it scales crisply anywhere without an extra request.
 */
export function AppLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label="CRM Dashboard logo"
    >
      <rect width="32" height="32" rx="7" fill="#171717" />
      <path
        d="M 20 10 A 8 8 0 1 0 20 22"
        fill="none"
        stroke="#fafafa"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="22" cy="16" r="3.2" fill="#fafafa" />
    </svg>
  )
}
