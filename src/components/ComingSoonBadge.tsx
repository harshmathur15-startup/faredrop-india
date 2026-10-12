// Small, elegant "Coming soon" chip for nav items whose feature isn't live yet
// (For Creators / For Agents). Text-only, warm *champagne* (amber/gold) tone —
// a passive status label, so: shaded fill (not a loud solid), sentence case, a
// thin same-family ring for legibility on any background. No dot: badge design
// convention is ONE content type (text OR a dot, never both) — mixing them just
// reads as a stray bullet. Deliberately a warmer temperature than the
// purple/indigo nav links so it registers as "status", not navigation.
export default function ComingSoonBadge({
  label = 'Coming soon',
  className = '',
}: {
  label?: string
  className?: string
}) {
  return (
    <span
      className={`inline-block rounded-full px-1.5 py-[1px] text-[8px] font-semibold leading-none whitespace-nowrap bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200/80 ${className}`}
    >
      {label}
    </span>
  )
}
