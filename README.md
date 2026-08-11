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

La 3D, le contenu et la progression vivent entièrement dans le navigateur —
la progression reste sur l'appareil de l'étudiant (`localStorage` + IndexedDB).
Seul l'accès à l'atlas demande un compte : quatre routes `app/api/` déposent
l'email, le nom, le pays et la région dans MongoDB Atlas, et rien d'autre.
Pourquoi ce détour est inévitable : [CLAUDE.md §2 bis](CLAUDE.md).

## Démarrer

```bash
npm install
cp .env.example .env.local   # puis renseigner MONGODB_URI et AUTH_SECRET
npm run dev                  # serveur de développement
npm run build                # build de production
npm run lint
npm test
```

Node `>= 22.13.0` requis.

Sans `.env.local`, tout fonctionne **sauf** l'inscription et la connexion :
l'accueil, l'à propos et les sources restent consultables. `AUTH_SECRET` se
génère avec `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

## Stack

| Couche    | Choix                                              |
| --------- | -------------------------------------------------- |
| Framework | Next.js 16, App Router, pages prérendues statiques |
| Comptes   | MongoDB Atlas + 4 routes `app/api/`, scrypt, HMAC  |
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
