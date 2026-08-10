import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { BRAND, SITE_URL } from "./lib/brand";

const sans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const serif = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
});

const OG_IMAGE = {
  url: "/og.jpg",
  width: 1200,
  height: 675,
  alt: "Un cœur anatomique en 3D flottant au-dessus d'un socle, aux côtés du logo Gremah Anatomy",
};

const TITLE = "Gremah Anatomy — L'atlas d'anatomie 3D des étudiants en médecine du Niger";
const DESCRIPTION =
  "Explorez le corps humain en 3D : cœur, cerveau, poumons, foie, reins, œil, intestin, pancréas et peau. " +
  "Un atlas interactif en français, pensé pour les étudiants en médecine du Niger — léger, rapide, consultable hors ligne.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "Gremah Anatomy",
  authors: [{ name: BRAND.author, url: BRAND.site }],
  creator: BRAND.author,
  publisher: BRAND.author,
  keywords: [
    "anatomie",
    "anatomie 3D",
    "corps humain",
    "étudiants en médecine",
    "Niger",
    "PCEM",
    "atlas anatomique",
    "apprentissage interactif",
  ],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.svg",
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Gremah Anatomy",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#080b09" },
    { media: "(prefers-color-scheme: light)", color: "#efe9de" },
  ],
};

/** JSON-LD : rattache le site à son auteur pour les moteurs de recherche. */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Gremah Anatomy",
  url: SITE_URL,
  inLanguage: "fr",
  description: DESCRIPTION,
  author: {
    "@type": "Person",
    name: BRAND.author,
    email: BRAND.email,
    url: BRAND.site,
    sameAs: [BRAND.linkedin, BRAND.site],
  },
};

/**
 * Applique le thème enregistré avant le premier rendu. Sans ce script inline,
 * la page s'affiche brièvement en sombre puis bascule en clair — le fameux
 * flash blanc, en pire.
 */
const THEME_BOOTSTRAP = `(function(){try{var t=localStorage.getItem("gremah-theme");if(!t){t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme="dark";}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${sans.variable} ${serif.variable}`}>{children}</body>
    </html>
  );
}
