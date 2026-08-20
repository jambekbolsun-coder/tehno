import { Link } from "react-router-dom";

export function Logo({ compact = false, inverted = false }: { compact?: boolean; inverted?: boolean }) {
  return (
    <Link
      to="/"
      className={`brand-logo brand-logo--vector${compact ? " brand-logo--compact" : ""}${inverted ? " brand-logo--inverted" : ""}`}
      aria-label="TEHNO CENTER — главная"
    >
      <svg
        className="brand-logo__vector"
        viewBox="0 0 760 190"
        role="img"
        aria-labelledby="tehno-center-logo-title"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title id="tehno-center-logo-title">TEHNO CENTER</title>
        <rect width="760" height="190" rx="20" fill="#050505" />
        <g transform="translate(326 18)">
          <path d="M0 0h72l-13 18H39v54H18V18H0z" fill="#FFC400" />
          <path d="M75 18h59L119 37H86c-10 0-17 6-17 15s7 15 17 15h36l-14 19H83c-23 0-39-13-39-34 0-20 15-34 31-34z" fill="#fff" />
          <path d="M104 0h38l-14 18H90z" fill="#FFC400" />
        </g>
        <text x="380" y="119" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="54" letterSpacing="3">
          <tspan fill="#fff">TEHNO </tspan><tspan fill="#FFC400">CENTER</tspan>
        </text>
        <path d="M124 141h72M564 141h72" stroke="#FFC400" strokeWidth="3" strokeLinecap="round" />
        <text x="380" y="159" textAnchor="middle" fill="#BFC1C7" fontFamily="Arial, Helvetica, sans-serif" fontWeight="600" fontSize="14" letterSpacing="6">ТЕХНИКА ДЛЯ ВАШЕГО ДОМА</text>
        <g fill="none" stroke="#FFC400" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M210 137h24v28h-24zM214 143h16" />
          <circle cx="533" cy="151" r="12" /><path d="M521 151h24M533 139v24" />
        </g>
      </svg>
    </Link>
  );
}
