"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import {
  estValide,
  LONGUEUR_MIN_MOT_DE_PASSE,
  PAYS,
  REGIONS_NIGER,
  validerConnexion,
  validerInscription,
  type ErreursChamps,
  type Inscription,
} from "../lib/compte";

/**
 * Inscription et connexion, dans un seul composant.
 *
 * Les deux écrans partagent la disposition, la gestion d'erreurs et le retour
 * après connexion ; seuls les champs et la route appelée changent. Les séparer
 * en deux composants aurait dupliqué tout ce qui compte vraiment.
 *
 * La validation vient de `lib/compte.ts`, le même module que la route serveur
 * exécute : ce qui est refusé ici est refusé là-bas, mot pour mot.
 */

type Mode = "connexion" | "inscription";

const VIDE: Partial<Inscription> = {
  prenom: "",
  nom: "",
  email: "",
  pays: "Niger",
  region: "",
  motDePasse: "",
};

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  // Où revenir après connexion, posé par le middleware. Non vérifié côté
  // serveur, donc borné ici à un chemin interne : accepter une URL absolue
  // ferait de cette page un tremplin de redirection ouverte.
  const suiteBrute = useSearchParams().get("suite") ?? "/atlas/";
  const suite = suiteBrute.startsWith("/") && !suiteBrute.startsWith("//") ? suiteBrute : "/atlas/";

  const [saisie, setSaisie] = useState<Partial<Inscription>>(VIDE);
  const [erreurs, setErreurs] = useState<ErreursChamps>({});
  const [message, setMessage] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);

  const inscription = mode === "inscription";

  function modifier(champ: keyof Inscription, valeur: string) {
    setSaisie((precedent) => ({ ...precedent, [champ]: valeur }));
    // L'erreur d'un champ disparaît dès qu'on le retouche : la laisser affichée
    // pendant la correction donne l'impression que la saisie n'est pas prise.
    setErreurs((precedent) => ({ ...precedent, [champ]: undefined }));
  }

  async function envoyer(evenement: React.FormEvent) {
    evenement.preventDefault();
    if (envoi) return;

    const locales = inscription ? validerInscription(saisie) : validerConnexion(saisie);
    if (!estValide(locales)) {
      setErreurs(locales);
      setMessage("");
      return;
    }

    setEnvoi(true);
    setMessage("");
    try {
      // Barre finale obligatoire : `trailingSlash: true` s'applique aussi aux
      // routes d'API, et sans elle chaque appel paie un 308 avant d'arriver.
      const reponse = await fetch(inscription ? "/api/inscription/" : "/api/connexion/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saisie),
      });
      const corps = (await reponse.json().catch(() => ({}))) as {
        message?: string;
        erreurs?: ErreursChamps;
      };

      if (!reponse.ok) {
        setErreurs(corps.erreurs ?? {});
        setMessage(corps.message ?? "Une erreur est survenue.");
        return;
      }

      // `refresh` avant `push` : le middleware doit revoir la requête avec le
      // cookie tout juste posé, sinon il renvoie vers la connexion en boucle.
      router.refresh();
      router.push(suite);
    } catch {
      setMessage("Connexion au service impossible. Vérifiez votre réseau et réessayez.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={envoyer} noValidate>
      {inscription && (
        <div className="contact-row">
          <Champ
            libelle="Prénom"
            nom="prenom"
            autoComplete="given-name"
            valeur={saisie.prenom ?? ""}
            erreur={erreurs.prenom}
            onChange={modifier}
          />
          <Champ
            libelle="Nom"
            nom="nom"
            autoComplete="family-name"
            valeur={saisie.nom ?? ""}
            erreur={erreurs.nom}
            onChange={modifier}
          />
        </div>
      )}

      <Champ
        libelle="Adresse email"
        nom="email"
        type="email"
        autoComplete="email"
        valeur={saisie.email ?? ""}
        erreur={erreurs.email}
        onChange={modifier}
        placeholder="vous@exemple.ne"
      />

      {inscription && (
        <div className="contact-row">
          <label className="field">
            <span>Pays</span>
            <select
              value={saisie.pays ?? "Niger"}
              onChange={(evenement) => modifier("pays", evenement.target.value)}
            >
              {PAYS.map((pays) => (
                <option key={pays} value={pays}>
                  {pays}
                </option>
              ))}
            </select>
            {erreurs.pays && <em className="field-error">{erreurs.pays}</em>}
          </label>

          <label className="field">
            <span>Région</span>
            {/* Une liste pour le Niger, un champ libre ailleurs : proposer huit
                régions nigériennes à un étudiant sénégalais serait absurde. */}
            {saisie.pays === "Niger" ? (
              <select
                value={saisie.region ?? ""}
                onChange={(evenement) => modifier("region", evenement.target.value)}
              >
                <option value="">Choisir…</option>
                {REGIONS_NIGER.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={saisie.region ?? ""}
                onChange={(evenement) => modifier("region", evenement.target.value)}
                placeholder="Région ou ville"
              />
            )}
            {erreurs.region && <em className="field-error">{erreurs.region}</em>}
          </label>
        </div>
      )}

      <label className="field">
        <span>Mot de passe</span>
        <span className="field-with-button">
          <input
            type={motDePasseVisible ? "text" : "password"}
            value={saisie.motDePasse ?? ""}
            autoComplete={inscription ? "new-password" : "current-password"}
            onChange={(evenement) => modifier("motDePasse", evenement.target.value)}
            aria-invalid={Boolean(erreurs.motDePasse)}
          />
          {/* Voir ce qu'on tape est la différence entre un mot de passe long et
              un mot de passe court sur un clavier tactile. */}
          <button
            type="button"
            onClick={() => setMotDePasseVisible((visible) => !visible)}
            aria-label={motDePasseVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {motDePasseVisible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </span>
        {erreurs.motDePasse ? (
          <em className="field-error">{erreurs.motDePasse}</em>
        ) : (
          inscription && (
            <em className="field-hint">
              {LONGUEUR_MIN_MOT_DE_PASSE} caractères minimum. Une phrase dont vous vous souvenez
              vaut mieux qu&apos;un mot compliqué.
            </em>
          )
        )}
      </label>

      <button type="submit" className="btn-primary btn-large auth-submit" disabled={envoi}>
        {envoi ? (
          <Loader2 size={16} className="spin" aria-hidden="true" />
        ) : (
          <ArrowRight size={16} aria-hidden="true" />
        )}
        {inscription ? "Créer mon compte" : "Se connecter"}
      </button>

      <p className="auth-message" role="alert" aria-live="assertive">
        {message}
      </p>

      <p className="auth-switch">
        {inscription ? (
          <>
            Vous avez déjà un compte ? <Link href="/connexion/">Se connecter</Link>
          </>
        ) : (
          <>
            Pas encore de compte ? <Link href="/inscription/">Créer un compte</Link>
          </>
        )}
      </p>
    </form>
  );
}

function Champ({
  libelle,
  nom,
  valeur,
  erreur,
  onChange,
  type = "text",
  autoComplete,
  placeholder,
}: {
  libelle: string;
  nom: keyof Inscription;
  valeur: string;
  erreur?: string;
  onChange: (champ: keyof Inscription, valeur: string) => void;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <label className="field">
      <span>{libelle}</span>
      <input
        type={type}
        value={valeur}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={Boolean(erreur)}
        onChange={(evenement) => onChange(nom, evenement.target.value)}
      />
      {erreur && <em className="field-error">{erreur}</em>}
    </label>
  );
}
