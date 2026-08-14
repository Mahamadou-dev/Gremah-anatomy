# Exporter une structure depuis Z-Anatomy — pas à pas

Ce document couvre l'unique étape manuelle du Sprint 12 : sortir de Blender un
`.glb` par structure. Tout ce qui suit — nettoyage, provenance, décimation, LOD,
budget — est automatique.

**Le rythme conseillé : dix structures d'affilée.** Ouvrir Blender coûte plus
cher que le dixième export, et le pipeline traite un dossier entier en une fois.

---

## Avant de commencer

**Le fichier source.** Z-Anatomy se télécharge sur <https://www.z-anatomy.com>
(ou depuis son dépôt GitHub, section _Releases_). Le fichier complet est lourd —
plusieurs giga-octets — et il existe des variantes découpées par système : si ta
machine peine, prends celles-là, l'export est identique.

**La liste de travail**, à garder ouverte à côté de Blender :

```bash
npm run anatomie:import -- --liste
```

Elle donne, pour chaque structure attendue : son **identifiant** (`crane-entier`),
son nom français, et son **nom latin** — c'est ce dernier qui sert à retrouver
l'objet dans Blender, parce que Z-Anatomy nomme tout en _Terminologia Anatomica_.

**Une règle qui évite toutes les erreurs de la suite :** le fichier exporté porte
l'**identifiant**, pas le nom latin. `Cranium` dans Blender devient
`crane-entier.glb` sur le disque. Le script cherche exactement ce nom-là.

---

## Les huit gestes, dans Blender

**1. Ouvrir le `.blend`** et attendre le chargement complet (le compteur d'objets
se stabilise en bas de la fenêtre).

**2. Trouver l'objet.** Dans l'_Outliner_ (panneau en haut à droite), cliquer la
loupe et taper le **nom latin** de la liste — par exemple `Cranium`. L'arbre se
réduit aux correspondances.

**3. Le rendre visible.** Z-Anatomy masque l'essentiel par défaut, et un objet
masqué s'exporte vide. Dans l'_Outliner_, activer **l'œil** _et_ **l'icône
écran** (« désactiver dans les vues ») sur l'objet **et sur toutes ses
collections parentes**. Le raccourci `Alt+H` dans la vue 3D rétablit ce qui a été
masqué par `H`, mais pas ce qui l'est au niveau de la collection — d'où l'œil.

**4. Sélectionner.** Clic sur l'objet dans l'_Outliner_. S'il en faut plusieurs —
`Costae` (les côtes) ou `Cranium` (les os du crâne) sont des ensembles —
`Ctrl+clic` pour ajouter, ou `Shift+clic` pour prendre un intervalle. La
sélection peut couvrir plusieurs collections sans problème.

> Une structure = un `.glb`, même si elle vient de trente objets. Ne pas
> fusionner les maillages : le moteur exploite la hiérarchie pour l'isolation
> et les hotspots.

**5. Vérifier l'échelle** (utile seulement si le résultat paraît étrange plus
tard) : `Objet ▸ Appliquer ▸ Toutes les transformations`. Le recadrage final est
fait par le moteur au chargement (`FIT_SIZE = 3.8`), donc la position de l'objet
dans la scène n'a aucune importance ici.

**6. Exporter** : `Fichier ▸ Exporter ▸ glTF 2.0 (.glb/.gltf)`.

Dans le panneau de droite :

| Section     | Réglage                        | Pourquoi                                            |
| ----------- | ------------------------------ | --------------------------------------------------- |
| Format      | **glTF Binary (.glb)**         | Un seul fichier, c'est ce que le script lit         |
| Include     | ✅ **Selected Objects**        | Sans ça, tu exportes tout Z-Anatomy                 |
| Include     | ❌ Cameras, ❌ Punctual Lights | La scène et l'éclairage sont construits par l'app   |
| Transform   | ✅ **+Y Up**                   | Convention glTF, déjà par défaut                    |
| Data ▸ Mesh | ✅ Apply Modifiers, ✅ Normals | Le maillage exporté doit être celui qu'on voit      |
| Data ▸ Mesh | ❌ UVs si l'objet n'en a pas   | Des UV vides gonflent le fichier pour rien          |
| Compression | ❌ **Draco désactivé**         | `models:build` compresse ensuite, mieux et une fois |

**7. Nommer le fichier avec l'identifiant** — `crane-entier.glb` — et
l'enregistrer dans un dossier de travail unique, **hors du dépôt**, par exemple
`C:\GREMAHTECH\z-anatomy-export\`.

**8. Passer à la structure suivante.** Ne pas fermer Blender avant d'avoir fait
la vague entière.

---

## Ramener la vague dans le dépôt

```bash
# 1. Import : vérifie la déclaration, nettoie, écrit la provenance
npm run anatomie:import -- --dossier=C:/GREMAHTECH/z-anatomy-export

# 2. Décimation, textures, trois niveaux de détail, budget par structure
npm run models:build

# 3. Contrôles
npm run models:check && npm test
```

Puis, pour **chaque** structure importée :

1. passer son `statut` à `"livree"` dans [`app/content/taxonomie.ts`](../app/content/taxonomie.ts) ;
2. rédiger sa fiche dans `app/content/organes.ts` — sans fiche, la structure
   existe en 3D mais ne s'explique pas, et un atlas qui ne s'explique pas est une
   visionneuse ;
3. relire la provenance écrite dans [`assets/models-src/provenance.json`](../assets/models-src/provenance.json).

Une structure `planifiee` n'apparaît jamais comme disponible dans l'interface :
tu peux donc importer les modèles d'abord et rédiger les fiches ensuite, sans
rien promettre que l'atlas ne tienne.

---

## Ce qui coince, et la réponse

| Symptôme                                   | Cause                                                            |
| ------------------------------------------ | ---------------------------------------------------------------- |
| `.glb` de quelques kilo-octets, vide       | L'objet était masqué — revoir l'étape 3                          |
| `✗ <id> n'est pas déclarée dans taxonomie` | Le nom du fichier n'est pas l'identifiant de `--liste`           |
| `✗ <id> : … introuvable`                   | Faute de frappe, ou export enregistré ailleurs                   |
| `budget dépassé (max 2 Mo par structure)`  | Ajouter une dérogation dans `OVERRIDES` de `optimize-models.mjs` |
| Blender rame à l'ouverture                 | Prendre la variante par système plutôt que le fichier complet    |

---

## Les neuf modèles hérités

Les neuf organes actuels viennent du starter d'origine, **sans licence
établie** : ils sont marqués « non vérifié » et signalés sur `/credits`. Tant que
c'est le cas, l'atlas n'est pas rediffusable.

Le plus simple est de les ré-exporter comme les autres pendant les vagues :
`brain`, `eyeball`, `heart`, `intestine`, `kidneys`, `liver`, `lungs`,
`pancreas`, `skin`. Le script écrit alors une provenance Z-Anatomy vérifiée à la place
de la mention héritée, et la question juridique disparaît au lieu d'être
documentée.
