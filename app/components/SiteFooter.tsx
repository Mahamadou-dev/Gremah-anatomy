import Link from "next/link";
import { BRAND, CONTACT_LINKS, DISCLAIMER } from "../lib/brand";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <strong>{BRAND.name}</strong>
        <small>
          par {BRAND.author} · <Link href="/a-propos/">À propos</Link> ·{" "}
          <Link href="/sources/">Sources</Link> · <Link href="/credits/">Crédits</Link> ·{" "}
          <Link href="/confidentialite/">Confidentialité</Link> ·{" "}
          <Link href="/mentions-legales/">Mentions légales</Link> · <Link href="/cgu/">CGU</Link>
        </small>
      </div>

      <nav className="footer-links" aria-label="Contacts">
        {CONTACT_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target={link.href.startsWith("mailto:") ? undefined : "_blank"}
            rel="noreferrer"
          >
            <span>{link.label}</span>
            <b>{link.value}</b>
          </a>
        ))}
      </nav>

      <p className="footer-disclaimer">{DISCLAIMER}</p>
    </footer>
  );
}
