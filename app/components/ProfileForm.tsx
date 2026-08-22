"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash2 } from "lucide-react";
import {
  PAYS,
  REGIONS_NIGER,
  estValide,
  validerModification,
  type ErreursModification,
  type ModificationProfil,
  type ProfilPublic,
} from "../lib/compte";

const VIDE_MODIFICATION: ModificationProfil = {
  prenom: "",
  nom: "",
  pays: "Niger",
  region: "",
  nouveauMotDePasse: "",
  motDePasseActuel: "",
};

/**
 * Le cycle de vie du compte, sur une seule page : voir, modifier, exporter,
 * supprimer. Sprint 13. La réinitialisation de mot de passe et la
 * vérification d'adresse restent absentes — elles dépendent de l'envoi
 * d'email, bloqué sur le mot de passe d'application Gmail (voir SPRINT.md).
 */
export function ProfileForm() {
  const router = useRouter();
  const [profil, setProfil] = useState<ProfilPublic | null>(null);
  const [chargement, setChargement] = useState(true);
  const [saisie, setSaisie] = useState<ModificationProfil>(VIDE_MODIFICATION);
  const [erreurs, setErreurs] = useState<ErreursModification>({});
  const [message, setMessage] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const [zoneDanger, setZoneDanger] = useState(false);
  const [motDePasseSuppression, setMotDePasseSuppression] = useState("");
  const [erreurSuppression, setErreurSuppression] = useState("");
  const [suppression, setSuppression] = useState(false);

  useEffect(() => {
    const abandon = new AbortController();
    fetch("/api/moi/", { signal: abandon.signal })
      .then((reponse) => (reponse.ok ? reponse.json() : null))
      .then((corps: { profil?: ProfilPublic } | null) => {
        if (!corps?.profil) {
          router.replace("/connexion/?suite=/profil/");
          return;
        }
        setProfil(corps.profil);
        setSaisie((precedent) => ({
          ...precedent,
          prenom: corps.profil!.prenom,
          nom: corps.profil!.nom,
          pays: corps.profil!.pays,
          region: corps.profil!.region,
        }));
      })
      .catch(() => {
        // Réseau coupé : on laisse la page vide plutôt que de rediriger sur la
        // foi d'une erreur réseau — ce ne serait pas prouver l'absence de session.
      })
      .finally(() => setChargement(false));
    return () => abandon.abort();
  }, [router]);

  function modifier<K extends keyof ModificationProfil>(champ: K, valeur: string) {
    setSaisie((precedent) => ({ ...precedent, [champ]: valeur }));
    setErreurs((precedent) => ({ ...precedent, [champ]: undefined }));
  }

  async function enregistrer(evenement: React.FormEvent) {
    evenement.preventDefault();
    if (envoi || !profil) return;

    const locales = validerModification(saisie, profil.email);
    if (!estValide(locales)) {
      setErreurs(locales);
      setMessage("");
      return;
    }

    setEnvoi(true);
    setMessage("");
    try {
      const reponse = await fetch("/api/compte/modifier/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saisie),
      });
      const corps = (await reponse.json().catch(() => ({}))) as {
        message?: string;
        erreurs?: ErreursModification;
        profil?: ProfilPublic;
      };

      if (!reponse.ok) {
        setErreurs(corps.erreurs ?? {});
        setMessage(corps.message ?? "Une erreur est survenue.");
        return;
      }

      setProfil(corps.profil ?? profil);
      setSaisie((precedent) => ({ ...precedent, nouveauMotDePasse: "", motDePasseActuel: "" }));
      setMessage("Profil mis à jour.");
    } catch {
      setMessage("Connexion au service impossible. Vérifiez votre réseau et réessayez.");
    } finally {
      setEnvoi(false);
    }
  }

  async function supprimer(evenement: React.FormEvent) {
    evenement.preventDefault();
    if (suppression) return;
    if (!motDePasseSuppression) {
      setErreurSuppression("Confirmez votre mot de passe.");
      return;
    }

    setSuppression(true);
    setErreurSuppression("");
    try {
      const reponse = await fetch("/api/compte/supprimer/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motDePasse: motDePasseSuppression }),
      });
      const corps = (await reponse.json().catch(() => ({}))) as { message?: string };

      if (!reponse.ok) {
        setErreurSuppression(corps.message ?? "Une erreur est survenue.");
        return;
      }

      router.refresh();
      router.push("/");
    } catch {
      setErreurSuppression("Connexion au service impossible. Vérifiez votre réseau et réessayez.");
    } finally {
      setSuppression(false);
    }
  }

  if (chargement) return <div className="auth-form" aria-busy="true" />;
  if (!profil) return null;

  return (
    <div className="profile-page">
      <section className="profile-section">
        <h2>Mon profil</h2>
        <form className="auth-form" onSubmit={enregistrer} noValidate>
          <label className="field">
            <span>Adresse email</span>
            <input type="email" value={profil.email} disabled readOnly />
            <em className="field-hint">
              L&apos;email n&apos;est pas modifiable ici — écrivez-nous si vous en avez besoin.
            </em>
          </label>

          <div className="contact-row">
            <label className="field">
              <span>Prénom</span>
              <input
                value={saisie.prenom}
                onChange={(e) => modifier("prenom", e.target.value)}
                aria-invalid={Boolean(erreurs.prenom)}
              />
              {erreurs.prenom && <em className="field-error">{erreurs.prenom}</em>}
            </label>
            <label className="field">
              <span>Nom</span>
              <input
                value={saisie.nom}
                onChange={(e) => modifier("nom", e.target.value)}
                aria-invalid={Boolean(erreurs.nom)}
              />
              {erreurs.nom && <em className="field-error">{erreurs.nom}</em>}
            </label>
          </div>

          <div className="contact-row">
            <label className="field">
              <span>Pays</span>
              <select value={saisie.pays} onChange={(e) => modifier("pays", e.target.value)}>
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
              {saisie.pays === "Niger" ? (
                <select value={saisie.region} onChange={(e) => modifier("region", e.target.value)}>
                  <option value="">Choisir…</option>
                  {REGIONS_NIGER.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              ) : (
                <input value={saisie.region} onChange={(e) => modifier("region", e.target.value)} />
              )}
              {erreurs.region && <em className="field-error">{erreurs.region}</em>}
            </label>
          </div>

          <div className="contact-row">
            <label className="field">
              <span>Nouveau mot de passe</span>
              <input
                type="password"
                autoComplete="new-password"
                value={saisie.nouveauMotDePasse}
                onChange={(e) => modifier("nouveauMotDePasse", e.target.value)}
                placeholder="Laisser vide pour ne pas changer"
              />
              {erreurs.nouveauMotDePasse && (
                <em className="field-error">{erreurs.nouveauMotDePasse}</em>
              )}
            </label>
            <label className="field">
              <span>Mot de passe actuel</span>
              <input
                type="password"
                autoComplete="current-password"
                value={saisie.motDePasseActuel}
                onChange={(e) => modifier("motDePasseActuel", e.target.value)}
                placeholder="Requis pour le changer"
              />
              {erreurs.motDePasseActuel && (
                <em className="field-error">{erreurs.motDePasseActuel}</em>
              )}
            </label>
          </div>

          <button type="submit" className="btn-primary btn-large auth-submit" disabled={envoi}>
            {envoi ? (
              <Loader2 size={16} className="spin" aria-hidden="true" />
            ) : (
              <Save size={16} aria-hidden="true" />
            )}
            Enregistrer
          </button>
          <p className="auth-message" role="alert" aria-live="assertive">
            {message}
          </p>
        </form>
      </section>

      <section className="profile-section">
        <h2>Mes données</h2>
        <p>
          Exportez une copie de votre profil au format JSON — c&apos;est le compte téléchargé qui
          contient tout ce que nous savons de vous, à l&apos;exception du mot de passe.
        </p>
        <a href="/api/compte/exporter/" className="btn-ghost btn-compact">
          Exporter mes données
        </a>
      </section>

      <section className="profile-section profile-danger">
        <h2>Supprimer mon compte</h2>
        <p>
          Suppression immédiate et définitive — y compris les compteurs de sécurité liés à votre
          adresse. Le contenu déjà téléchargé sur cet appareil reste consultable : un compte
          n&apos;a jamais été une condition d&apos;accès à l&apos;atlas.
        </p>
        {!zoneDanger ? (
          <button
            type="button"
            className="btn-ghost btn-compact"
            onClick={() => setZoneDanger(true)}
          >
            <Trash2 size={14} aria-hidden="true" /> Supprimer mon compte
          </button>
        ) : (
          <form className="auth-form" onSubmit={supprimer} noValidate>
            <label className="field">
              <span>Confirmez votre mot de passe</span>
              <input
                type="password"
                autoComplete="current-password"
                value={motDePasseSuppression}
                onChange={(e) => setMotDePasseSuppression(e.target.value)}
              />
            </label>
            <div className="contact-row">
              <button type="submit" className="btn-primary btn-large" disabled={suppression}>
                {suppression ? (
                  <Loader2 size={16} className="spin" aria-hidden="true" />
                ) : (
                  "Supprimer définitivement"
                )}
              </button>
              <button
                type="button"
                className="btn-ghost btn-compact"
                onClick={() => {
                  setZoneDanger(false);
                  setMotDePasseSuppression("");
                  setErreurSuppression("");
                }}
              >
                Annuler
              </button>
            </div>
            <p className="auth-message" role="alert" aria-live="assertive">
              {erreurSuppression}
            </p>
          </form>
        )}
      </section>
    </div>
  );
}
