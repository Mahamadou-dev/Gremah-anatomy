import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  estValide,
  normaliserEmail,
  validerConnexion,
  validerInscription,
  LONGUEUR_MIN_MOT_DE_PASSE,
  PAYS,
  REGIONS_NIGER,
  type Inscription,
} from "../app/lib/compte.ts";

const racine = join(fileURLToPath(new URL(".", import.meta.url)), "..");

const VALIDE: Inscription = {
  prenom: "Aïcha",
  nom: "Souley",
  email: "aicha.souley@exemple.ne",
  pays: "Niger",
  region: "Niamey",
  motDePasse: "le-nerf-vague-descend",
};

test("une inscription complète passe", () => {
  assert.ok(estValide(validerInscription(VALIDE)));
});

test("l'email est normalisé avant comparaison et stockage", () => {
  // Sans normalisation, `Aicha@X.ne` et `aicha@x.ne` créeraient deux comptes
  // distincts, et l'index unique ne verrait rien à redire.
  assert.equal(normaliserEmail("  Aicha@Exemple.NE "), "aicha@exemple.ne");
});

test("chaque champ obligatoire est réellement obligatoire", () => {
  for (const champ of ["prenom", "nom", "email", "pays", "region", "motDePasse"] as const) {
    const erreurs = validerInscription({ ...VALIDE, [champ]: "" });
    assert.ok(erreurs[champ], `le champ « ${champ} » est accepté vide`);
  }
});

test("le mot de passe est refusé en dessous du minimum", () => {
  const court = "a".repeat(LONGUEUR_MIN_MOT_DE_PASSE - 1);
  assert.ok(validerInscription({ ...VALIDE, motDePasse: court }).motDePasse);

  const juste = "a".repeat(LONGUEUR_MIN_MOT_DE_PASSE);
  assert.equal(validerInscription({ ...VALIDE, motDePasse: juste }).motDePasse, undefined);
});

test("le mot de passe ne peut pas être l'adresse email", () => {
  const erreurs = validerInscription({ ...VALIDE, motDePasse: VALIDE.email.toUpperCase() });
  assert.ok(erreurs.motDePasse);
});

test("les adresses malformées sont rejetées", () => {
  for (const email of ["", "aicha", "aicha@", "@exemple.ne", "aicha@exemple", "a b@exemple.ne"]) {
    assert.ok(validerInscription({ ...VALIDE, email }).email, `« ${email} » a été accepté`);
  }
});

test("la connexion n'exige que l'email et le mot de passe", () => {
  assert.ok(estValide(validerConnexion({ email: VALIDE.email, motDePasse: "x" })));
  assert.ok(validerConnexion({ email: "cassé", motDePasse: "x" }).email);
  assert.ok(validerConnexion({ email: VALIDE.email }).motDePasse);
});

test("les listes pays/régions couvrent le public visé", () => {
  assert.ok(PAYS.includes("Niger"));
  assert.equal(REGIONS_NIGER.length, 8, "le Niger compte 8 régions administratives");
  for (const region of ["Niamey", "Zinder", "Maradi", "Agadez"]) {
    assert.ok(REGIONS_NIGER.includes(region as (typeof REGIONS_NIGER)[number]));
  }
});

/* --- Invariants de sécurité ------------------------------------------------
   Ces trois tests valent tous les autres réunis : ils gardent la frontière
   entre ce qui tourne sur Vercel et ce qui part dans le bundle du navigateur.
   -------------------------------------------------------------------------- */

function fichiers(dossier: string, extension = ".ts"): { chemin: string; code: string }[] {
  const resultat: { chemin: string; code: string }[] = [];
  const parcourir = (repertoire: string) => {
    for (const entree of readdirSync(repertoire)) {
      const complet = join(repertoire, entree);
      if (statSync(complet).isDirectory()) parcourir(complet);
      else if (entree.endsWith(extension) || entree.endsWith(".tsx")) {
        resultat.push({
          chemin: complet.slice(racine.length + 1).replace(/\\/g, "/"),
          code: readFileSync(complet, "utf8"),
        });
      }
    }
  };
  parcourir(join(racine, dossier));
  return resultat;
}

test("aucun composant client n'importe la couche serveur", () => {
  // `lib/server/` porte MONGODB_URI et AUTH_SECRET. Un seul import depuis un
  // fichier « use client » les ferait entrer dans le bundle du navigateur.
  const fautifs = fichiers("app").filter(
    ({ chemin, code }) =>
      !chemin.startsWith("app/api/") &&
      chemin !== "app/lib/server/mongo.ts" &&
      chemin !== "app/lib/server/session.ts" &&
      chemin !== "app/lib/server/mots-de-passe.ts" &&
      /from\s+["'][^"']*lib\/server\//.test(code) &&
      code.includes('"use client"'),
  );
  assert.deepEqual(
    fautifs.map((fichier) => fichier.chemin),
    [],
  );
});

test("aucun secret n'est exposé sous un préfixe NEXT_PUBLIC_", () => {
  // Tout ce qui commence par NEXT_PUBLIC_ est inliné dans le bundle client au
  // build. Y mettre l'URI Mongo publierait le cluster.
  const fautifs = fichiers("app").filter(({ code }) =>
    /NEXT_PUBLIC_[A-Z_]*(MONGO|SECRET|PASSWORD|TOKEN|KEY)/.test(code),
  );
  assert.deepEqual(
    fautifs.map((fichier) => fichier.chemin),
    [],
  );
});

test("les routes de compte tournent sur le runtime Node", () => {
  // Le driver Mongo a besoin de sockets TCP et scrypt de `node:crypto` :
  // ni l'un ni l'autre n'existe sur le runtime Edge.
  const routes = fichiers("app/api").filter(({ chemin }) => chemin.endsWith("route.ts"));
  assert.ok(routes.length >= 4, "les quatre routes de compte sont attendues");
  for (const route of routes) {
    assert.match(route.code, /export const runtime = "nodejs"/, `${route.chemin}`);
  }
});
