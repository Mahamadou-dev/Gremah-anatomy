# Gremah Anatomy

**Atlas d'anatomie humaine 3D interactif, pour les étudiants en médecine du Niger.**

En français. 100 % frontend. Utilisable sur un smartphone d'entrée de gamme, en
connexion faible, et hors ligne après la première visite.

---

## Pourquoi

Les atlas d'anatomie de référence sont chers, en anglais, et supposent une
connexion permanente. Gremah Anatomy prend le problème dans l'autre sens : la
contrainte de départ est un téléphone modeste sur un réseau intermittent, et la
langue de travail est le français, celle du cursus.

Aucun serveur, aucun compte, aucune donnée envoyée nulle part. La progression
reste sur l'appareil de l'étudiant (`localStorage` + IndexedDB).

## Démarrer

```bash
npm install
npm run dev      # serveur de développement
npm run build    # export statique dans out/
npm run preview  # sert out/ localement
npm run lint
```

Node `>= 22.13.0` requis.

## Stack

| Couche    | Choix                                              |
| --------- | -------------------------------------------------- |
| Framework | Next.js 16, App Router, `output: "export"`         |
| Langage   | TypeScript strict                                  |
| 3D        | three.js — WebGPU/TSL visé, repli WebGL2           |
| Animation | GSAP                                               |
| Style     | Tailwind CSS 4 + tokens CSS                        |
| Offline   | Service Worker + Cache API + IndexedDB _(à venir)_ |

## Thème

La palette dérive du drapeau du Niger — orange, blanc, vert, disque solaire —
traitée en surfaces satinées : dégradés à trois arrêts, verre dépoli, ombres
teintées chaudes, grain anti-banding. Jamais de bandes tricolores.

Les modes sombre et clair sont tous deux de premier ordre : le sombre pour la
3D, le clair parce que beaucoup d'étudiants révisent en plein jour.

## Documentation

- **[CLAUDE.md](CLAUDE.md)** — cahier de charge : exigences, architecture, charte 3D, conventions.
- **[SPRINT.md](SPRINT.md)** — feuille de route en 10 sprints.

## Avertissement

Gremah Anatomy est un outil pédagogique. Il ne remplace ni un cours, ni un
ouvrage de référence, ni l'avis d'un professionnel de santé.

## Auteur

**Mahamadou Amadou Habou Gremah**

- Email : [mahamadou8877@gmail.com](mailto:mahamadou8877@gmail.com)
- LinkedIn : [mahamadou-amadou-habou-gremah](https://linkedin.com/in/mahamadou-amadou-habou-gremah-54766632b)
- Site : [gremah.vercel.app](https://gremah.vercel.app)
- WhatsApp : [+216 55 299 368](https://wa.me/21655299368)

## Licence

[MIT](LICENSE)
