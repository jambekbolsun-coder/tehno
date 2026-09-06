import { Instagram } from "lucide-react";

const INSTAGRAM_URL = "https://www.instagram.com/tehno_center2?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==";

export function InstagramButton() {
  return (
    <a
      className="instagram-fab"
      href={INSTAGRAM_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Instagram TEHNO CENTER"
      title="Instagram"
    >
      <Instagram size={24} />
      <span>Instagram</span>
    </a>
  );
}
