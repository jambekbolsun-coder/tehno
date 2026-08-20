import { Link } from "react-router-dom";

export function Logo({ compact = false, inverted = false }: { compact?: boolean; inverted?: boolean }) {
  return (
    <Link
      to="/"
      className={`brand-logo brand-logo--image${compact ? " brand-logo--compact" : ""}${inverted ? " brand-logo--inverted" : ""}`}
      aria-label="TEHNO CENTER — главная"
    >
      <img className="brand-logo__image" src="/tehno-center-logo.avif" alt="TEHNO CENTER" />
    </Link>
  );
}
