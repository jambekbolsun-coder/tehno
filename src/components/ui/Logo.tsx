import { Link } from "react-router-dom";

export function Logo({ compact = false, inverted = false }: { compact?: boolean; inverted?: boolean }) {
  return (
    <Link
      to="/"
      className={`brand-logo brand-wordmark${compact ? " brand-wordmark--compact" : ""}${inverted ? " brand-wordmark--inverted" : ""}`}
      aria-label="TEHNO CENTER — главная"
    >
      <span className="brand-wordmark__tehno">TEHNO</span>
      <span className="brand-wordmark__center">CENTER</span>
    </Link>
  );
}
