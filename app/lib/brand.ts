/**
 * Source unique des informations de marque. Les contacts apparaissent dans le
 * footer, la page /a-propos, les métadonnées et le JSON-LD : les dupliquer
 * garantirait qu'un jour l'un d'eux devienne faux.
 */

export const BRAND = {
  name: "Gremah Anatomy",
  author: "Mahamadou Amadou Habou Gremah",
  email: "mahamadou8877@gmail.com",
  linkedin: "https://linkedin.com/in/mahamadou-amadou-habou-gremah-54766632b",
  site: "https://gremah.vercel.app",
  /** Affiché tel quel ; `whatsappHref` porte la forme normalisée pour wa.me. */
  whatsapp: "+216 55 299 368",
  whatsappHref: "https://wa.me/21655299368",
} as const;

export const CONTACT_LINKS = [
  { label: "Email", value: BRAND.email, href: `mailto:${BRAND.email}` },
  { label: "LinkedIn", value: "Mahamadou A. H. Gremah", href: BRAND.linkedin },
  { label: "Site", value: "gremah.vercel.app", href: BRAND.site },
  { label: "WhatsApp", value: BRAND.whatsapp, href: BRAND.whatsappHref },
] as const;

/**
 * URL absolue du site, pour og:image et le JSON-LD. Résolue par hôte pour
 * qu'un déploiement de préversion n'annonce pas les assets d'une autre origine.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://gremah-anatomy.vercel.app");

export const DISCLAIMER =
  "Gremah Anatomy est un outil pédagogique. Il ne remplace ni un cours, ni un ouvrage de référence, " +
  "ni l'avis d'un professionnel de santé.";
