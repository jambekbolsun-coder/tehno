import { Link } from "react-router-dom";

export function Logo({ compact = false, inverted = false }: { compact?: boolean; inverted?: boolean }) {
  return (
    <Link
      to="/"
      className={`brand-logo${compact ? " brand-logo--compact" : ""}${inverted ? " brand-logo--inverted" : ""}`}
      aria-label="TEHNO CENTER — главная"
    >
      <span className="brand-logo__mark">
        <img src="/tehno-center-logo.webp" alt="TEHNO CENTER" />
      </span>
    </Link>
  );
}
