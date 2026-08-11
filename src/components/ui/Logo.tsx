import { Link } from "react-router-dom";

export function Logo({ compact = false, inverted = false }: { compact?: boolean; inverted?: boolean }) {
  return (
    <Link to="/" className={`brand-logo${compact ? " brand-logo--compact" : ""}${inverted ? " brand-logo--inverted" : ""}`} aria-label="TEHNO CENTER 2 — главная">
      <span className="brand-logo__mark"><img src="/logo.jpg" alt="" /></span>
      {!compact && <span className="brand-logo__text"><strong>TEHNO</strong><b>CENTER 2</b></span>}
    </Link>
  );
}
