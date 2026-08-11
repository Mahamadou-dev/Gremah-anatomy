"use client";

import { useState } from "react";
import { Check, Copy, Loader2, Mail, Send } from "lucide-react";
import { BRAND } from "../lib/brand";

/**
 * Formulaire de contact d'un site sans backend.
 *
 * Deux chemins, dans cet ordre :
 *
 * 1. Si `NEXT_PUBLIC_CONTACT_ENDPOINT` est défini au build (Formspree, Web3Forms,
 *    ou tout service acceptant un POST JSON), le message part directement.
 * 2. Sinon — et c'est le comportement par défaut du dépôt — le formulaire ouvre
 *    le client mail de l'étudiant avec un message pré-rempli.
 *
 * Le second chemin n'est pas un pis-aller honteux : il ne dépend d'aucun tiers,
 * ne peut pas tomber, n'expose aucune clé, et le message arrive bien à
 * `BRAND.email`. Le bouton « copier » couvre le cas — fréquent sur les téléphones
 * partagés — où aucun client mail n'est configuré.
 */

const ENDPOINT = process.env.NEXT_PUBLIC_CONTACT_ENDPOINT ?? "";

type Status = "idle" | "sending" | "sent" | "handoff" | "error";

const SUBJECTS = [
  "Question sur un contenu anatomique",
  "Signaler une erreur médicale",
  "Proposer une contribution",
  "Partenariat ou usage en faculté",
  "Autre",
] as const;

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [copied, setCopied] = useState(false);
  /** Champ appât : un robot le remplit, un humain ne le voit jamais. */
  const [trap, setTrap] = useState("");

  const valid = name.trim().length >= 2 && /.+@.+\..+/.test(email) && message.trim().length >= 10;

  function composeBody() {
    return `${message.trim()}\n\n— ${name.trim()} (${email.trim()})`;
  }

  function mailtoHref() {
    const params = new URLSearchParams({
      subject: `[Gremah Anatomy] ${subject}`,
      body: composeBody(),
    });
    return `mailto:${BRAND.email}?${params.toString()}`;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!valid || status === "sending") return;
    // Le piège est rempli : on affiche un succès sans rien envoyer. Répondre par
    // une erreur apprendrait au robot à contourner le champ.
    if (trap) {
      setStatus("sent");
      return;
    }

    if (!ENDPOINT) {
      window.location.href = mailtoHref();
      setStatus("handoff");
      return;
    }

    setStatus("sending");
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: `[Gremah Anatomy] ${subject}`,
          message: message.trim(),
        }),
      });
      if (!response.ok) throw new Error(String(response.status));
      setStatus("sent");
      setMessage("");
    } catch {
      // Le service tiers est injoignable — hors ligne, forfait épuisé, panne :
      // on bascule sur le chemin qui, lui, ne dépend de personne.
      setStatus("error");
    }
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(
        `À : ${BRAND.email}\nObjet : ${subject}\n\n${composeBody()}`,
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <form className="contact-form" onSubmit={submit} noValidate>
      <div className="contact-row">
        <label className="field">
          <span>Nom</span>
          <input
            type="text"
            name="name"
            value={name}
            autoComplete="name"
            required
            onChange={(event) => setName(event.target.value)}
            placeholder="Aïcha Souley"
          />
        </label>

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            name="email"
            value={email}
            autoComplete="email"
            required
            onChange={(event) => setEmail(event.target.value)}
            placeholder="vous@exemple.ne"
          />
        </label>
      </div>

      <label className="field">
        <span>Objet</span>
        <select value={subject} onChange={(event) => setSubject(event.target.value)}>
          {SUBJECTS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Message</span>
        <textarea
          name="message"
          rows={5}
          value={message}
          required
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Décrivez votre question, la structure concernée, et votre niveau d'étude."
        />
      </label>

      {/* Appât anti-robot : retiré du flux et de l'ordre de tabulation, et
          annoncé comme non pertinent aux lecteurs d'écran. */}
      <div className="contact-trap" aria-hidden="true">
        <label>
          Ne pas remplir
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={trap}
            onChange={(event) => setTrap(event.target.value)}
          />
        </label>
      </div>

      <div className="contact-actions">
        <button type="submit" className="btn-primary" disabled={!valid || status === "sending"}>
          {status === "sending" ? (
            <Loader2 size={16} className="spin" aria-hidden="true" />
          ) : (
            <Send size={16} aria-hidden="true" />
          )}
          {ENDPOINT ? "Envoyer le message" : "Ouvrir dans mon client mail"}
        </button>

        <button type="button" className="btn-ghost" onClick={copyMessage} disabled={!valid}>
          {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
          {copied ? "Copié" : "Copier le message"}
        </button>

        <a className="btn-ghost" href={`mailto:${BRAND.email}`}>
          <Mail size={16} aria-hidden="true" />
          {BRAND.email}
        </a>
      </div>

      {/* `aria-live` et non une simple `<p>` : un lecteur d'écran doit apprendre
          le résultat sans avoir à repartir en exploration. */}
      <p className="contact-status" role="status" aria-live="polite" data-tone={status}>
        {status === "sent" && "Message envoyé. Réponse sous quelques jours."}
        {status === "handoff" &&
          "Votre client mail devrait s'ouvrir avec le message pré-rempli. Sinon, utilisez « Copier le message »."}
        {status === "error" &&
          "L'envoi a échoué. Utilisez « Copier le message » ou écrivez directement à l'adresse ci-dessus."}
      </p>
    </form>
  );
}
