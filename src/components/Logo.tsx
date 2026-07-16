import { Link } from "@tanstack/react-router";

/**
 * Jo Tawjihi wordmark — badge and letters share the same animated
 * shemagh-red wave gradient. Graduation cap sits inside the badge.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label="Jo Tawjihi — home"
      className={`group relative inline-flex items-center gap-2.5 ${className}`}
    >
      {/* Wavy-red gradient badge with graduation cap */}
      <span
        aria-hidden
        className="jt-badge relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl shadow-md shadow-[#CE1126]/25 ring-1 ring-black/10 transition-transform duration-500 group-hover:rotate-[6deg] group-hover:scale-105"
      >
        {/* Graduation cap */}
        <svg
          viewBox="0 0 24 24"
          className="relative h-5 w-5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]"
          fill="#ffffff"
          stroke="#ffffff"
          strokeWidth="0.5"
          strokeLinejoin="round"
        >
          <path d="M12 3 L22 8 L12 13 L2 8 Z" />
          <path d="M6 10.2 V14.2 C6 15.6 8.7 16.8 12 16.8 C15.3 16.8 18 15.6 18 14.2 V10.2 L12 13.2 Z" />
          <path d="M21 8.6 V13.2" stroke="#ffffff" strokeWidth="1.1" strokeLinecap="round" fill="none" />
          <circle cx="21" cy="13.6" r="0.9" fill="#ffffff" />
        </svg>

        {/* soft sheen on hover */}
        <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-14deg] bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition-opacity duration-200 group-hover:animate-[jt-shine_0.9s_ease_forwards] group-hover:opacity-100" />
      </span>

      {/* Wordmark — forced LTR so letters read left→right inside an RTL page */}
      <span dir="ltr" className="relative inline-flex items-baseline overflow-hidden">
        <span className="jt-wordmark text-xl font-black tracking-tight leading-none">
          Jo&nbsp;Tawjihi
        </span>
        <span className="pointer-events-none absolute -bottom-0.5 left-0 h-[2px] w-0 rounded-full bg-gradient-to-r from-[#CE1126] via-[#E63946] to-[#7a0a1a] transition-all duration-500 group-hover:w-full" />
      </span>
    </Link>
  );
}
