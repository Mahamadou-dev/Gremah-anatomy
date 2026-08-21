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
  validerModification,
  LONGUEUR_MIN_MOT_DE_PASSE,
  PAYS,
  REGIONS_NIGER,
  type Inscription,
  type ModificationProfil,
} from "../app/lib/compte.ts";
import {
  evaluer,
  evaluerCreation,
  messageBlocage,
  PLAFOND_CREATIONS,
  PLAFOND_EMAIL,
  PLAFOND_IP,
} from "../app/lib/limite-debit.ts";

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

/* --- Modification de profil (Sprint 13) ------------------------------------- */

const PROFIL_VALIDE: ModificationProfil = {
  prenom: VALIDE.prenom,
  nom: VALIDE.nom,
  pays: VALIDE.pays,
  region: VALIDE.region,
  nouveauMotDePasse: "",
  motDePasseActuel: "",
};

test("une modification de profil sans nouveau mot de passe passe", () => {
  assert.ok(estValide(validerModification(PROFIL_VALIDE, VALIDE.email)));
});

test("un nouveau mot de passe exige le mot de passe actuel", () => {
  const erreurs = validerModification(
    { ...PROFIL_VALIDE, nouveauMotDePasse: "un-nouveau-mot-de-passe-long" },
    VALIDE.email,
  );
  assert.ok(erreurs.motDePasseActuel);
});

test("le nouveau mot de passe reste soumis aux mêmes règles qu'à l'inscription", () => {
  const erreurs = validerModification(
    {
      ...PROFIL_VALIDE,
      nouveauMotDePasse: "court",
      motDePasseActuel: "peu-importe",
    },
    VALIDE.email,
  );
  assert.ok(erreurs.nouveauMotDePasse);
});

test("le prénom et le nom restent obligatoires à la modification", () => {
  for (const champ of ["prenom", "nom", "pays", "region"] as const) {
    const erreurs = validerModification({ ...PROFIL_VALIDE, [champ]: "" }, VALIDE.email);
    assert.ok(erreurs[champ], `le champ « ${champ} » est accepté vide`);
  }
});

/* --- Limitation de débit ---------------------------------------------------- */

test("en dessous des plafonds, la tentative passe", () => {
  assert.deepEqual(evaluer(0, 0, null), { autorise: true });
  assert.deepEqual(evaluer(PLAFOND_EMAIL - 1, PLAFOND_IP - 1, 10), { autorise: true });
});

test("le plafond par email bloque le compte visé", () => {
  const verdict = evaluer(PLAFOND_EMAIL, 0, 60);
  assert.equal(verdict.autorise, false);
  if (verdict.autorise) return;
  assert.equal(verdict.motif, "email");
  // Fenêtre de 15 min, tentative la plus ancienne vieille de 60 s.
  assert.equal(verdict.secondesAvantReessai, 15 * 60 - 60);
});

test("le plafond par IP bloque le balayage massif", () => {
  const verdict = evaluer(0, PLAFOND_IP, 0);
  assert.equal(verdict.autorise, false);
  if (!verdict.autorise) assert.equal(verdict.motif, "ip");
});

test("le délai annoncé ne descend jamais à zéro", () => {
  // Une tentative plus vieille que la fenêtre donnerait un délai négatif, donc
  // un « réessayez dans 0 minute » qui invite à marteler le formulaire.
  const verdict = evaluer(PLAFOND_EMAIL, 0, 99_999);
  assert.equal(verdict.autorise, false);
  if (!verdict.autorise) assert.ok(verdict.secondesAvantReessai >= 1);
});

test("le plafond par IP reste large devant celui par email", () => {
  // Au Niger, un cybercafé ou un opérateur mobile place des dizaines
  // d'étudiants derrière une seule adresse : un plafond IP serré bloquerait
  // une classe entière pour l'étourderie d'un seul.
  assert.ok(PLAFOND_IP >= PLAFOND_EMAIL * 4);
});

test("les créations de comptes ont leur propre plafond", () => {
  assert.deepEqual(evaluerCreation(PLAFOND_CREATIONS - 1, 30), { autorise: true });
  const verdict = evaluerCreation(PLAFOND_CREATIONS, 30);
  assert.equal(verdict.autorise, false);
});

test("le message de blocage arrondit à la minute supérieure", () => {
  assert.equal(messageBlocage(1), "Trop de tentatives. Réessayez dans 1 minute.");
  assert.equal(messageBlocage(61), "Trop de tentatives. Réessayez dans 2 minutes.");
  // Aucun compteur ni plafond ne doit filtrer jusqu'à l'utilisateur : ce serait
  // dire à un attaquant exactement combien d'essais il lui reste.
  assert.doesNotMatch(messageBlocage(300), /\d+\s*(tentatives?\s*sur|\/)/);
});

test("la connexion contrôle le débit avant de hacher", () => {
  const route = fichiers("app/api").find((f) => f.chemin.endsWith("connexion/route.ts"))!;
  const positionLimite = route.code.indexOf("verifierDebit");
  const positionHachage = route.code.indexOf("await verifier(saisie.motDePasse");
  assert.ok(positionLimite > 0, "la route n'appelle pas la limitation de débit");
  // scrypt coûte ~100 ms et 32 Mo : le faire avant le contrôle offrirait à
  // l'attaquant exactement le calcul qu'il cherche à nous faire répéter.
  assert.ok(positionLimite < positionHachage, "le hachage précède le contrôle de débit");
});

test("la suppression de compte efface aussi ses compteurs de débit", () => {
  // Garde-fou du Sprint 13 : un compte supprimé sans que ses compteurs le
  // soient resterait bloqué jusqu'à expiration TTL si l'adresse était réutilisée
  // tout de suite après — exactement ce que §13 du Suivi promet de régler.
  const route = fichiers("app/api").find((f) => f.chemin.endsWith("compte/supprimer/route.ts"))!;
  assert.match(route.code, /effacerToutPour/);
  assert.match(route.code, /verifier\(saisie\.motDePasse/, "la suppression exige le mot de passe");
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

test("les appels d'API portent la barre finale", () => {
  // `trailingSlash: true` s'applique aussi aux routes d'API : un fetch vers
  // `/api/connexion` prend un 308 avant d'arriver. Invisible en développement,
  // mais c'est un aller-retour de plus sur chaque connexion — sur une 3G
  // nigérienne, la seule latence qu'on peut supprimer gratuitement.
  const fautifs: string[] = [];
  for (const { chemin, code } of fichiers("app")) {
    for (const appel of code.matchAll(/fetch\(\s*"(\/api\/[^"]*)"/g)) {
      if (!appel[1].endsWith("/")) fautifs.push(`${chemin} → ${appel[1]}`);
    }
  }
  assert.deepEqual(fautifs, []);
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
