"use client";

import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "gremah-theme";

/**
 * Le thème est posé sur <html> par le script de bootstrap du layout, avant le
 * premier rendu. Ce bouton ne le duplique volontairement pas dans un état
 * React : le serveur ne peut pas connaître la préférence enregistrée, donc tout
 * miroir côté React désynchroniserait l'hydratation. L'icône affichée est
 * choisie en CSS depuis `[data-theme]`.
 */
export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Navigation privée ou stockage saturé : le thème reste valable pour la
      // session en cours, ce qui est une dégradation acceptable.
    }
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label="Changer de thème, clair ou sombre"
      title="Changer de thème"
    >
      <Sun size={16} className="icon-when-dark" aria-hidden="true" />
      <Moon size={16} className="icon-when-light" aria-hidden="true" />
    </button>
  );
}
