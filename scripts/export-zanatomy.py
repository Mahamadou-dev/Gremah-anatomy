"""
Export Z-Anatomy → un `.glb` par structure, sans ouvrir Blender.

Ce fichier est exécuté *par* Blender, en arrière-plan :

    blender -b Z-Anatomy.blend -P scripts/export-zanatomy.py -- --plan=… --sortie=…

Il existe parce que la procédure manuelle — trouver l'objet, démasquer l'objet
et toutes ses collections parentes, sélectionner, exporter avec sept réglages —
doit être répétée 78 fois. Une manipulation répétée 78 fois n'est pas un travail,
c'est une source d'erreurs : il suffit d'oublier un œil dans l'*Outliner* pour
produire un `.glb` vide qui ne se verra qu'au chargement.

Deux modes :

  --inventaire   n'exporte rien, écrit la liste des objets du fichier. C'est ce
                 qui permet d'associer les noms de la taxonomie aux noms réels
                 de la source, une bonne fois, au lieu de les deviner.
  (par défaut)   exporte les structures du plan, et rend compte de chacune.

Le rapport JSON est écrit sur le disque plutôt qu'affiché : Blender mêle ses
propres messages à la sortie standard, et un rapport qu'il faut extraire d'un
journal n'est pas un rapport.
"""

import bpy
import json
import sys
import unicodedata
from pathlib import Path


def arguments():
    """Blender passe à Python ce qui suit « -- »."""
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    valeurs = {}
    for arg in argv:
        if arg.startswith("--") and "=" in arg:
            cle, valeur = arg[2:].split("=", 1)
            valeurs[cle] = valeur
        elif arg.startswith("--"):
            valeurs[arg[2:]] = True
    return valeurs


def normaliser(nom):
    """
    Comparaison tolérante : Z-Anatomy écrit « Vertebra cervicalis », la taxonomie
    peut porter « Vertebrae cervicales », et Blender suffixe les doublons en
    « .001 ». On compare donc sans accents, sans casse, sans ponctuation.
    """
    nom = nom.split(".")[0] if nom[-4:-3] == "." and nom[-3:].isdigit() else nom
    sans_accent = unicodedata.normalize("NFKD", nom).encode("ascii", "ignore").decode()
    return "".join(c for c in sans_accent.lower() if c.isalnum() or c == " ").strip()


def tous_les_objets():
    return [o for o in bpy.data.objects if o.type == "MESH"]


def rendre_visible(objet):
    """
    Un objet masqué s'exporte vide, et Z-Anatomy masque presque tout par défaut.
    Il faut lever le masquage à trois niveaux — l'objet, sa visibilité de vue, et
    chaque collection parente, y compris son exclusion de la vue de couche.
    """
    objet.hide_set(False)
    objet.hide_viewport = False
    objet.hide_render = False
    for collection in objet.users_collection:
        collection.hide_viewport = False
        collection.hide_render = False
    for couche in parcourir_couches(bpy.context.view_layer.layer_collection):
        if couche.exclude:
            couche.exclude = False
        couche.hide_viewport = False


def parcourir_couches(couche):
    yield couche
    for enfant in couche.children:
        yield from parcourir_couches(enfant)


def exporter(objets, destination):
    bpy.ops.object.select_all(action="DESELECT")
    for objet in objets:
        rendre_visible(objet)
        objet.select_set(True)
    bpy.context.view_layer.objects.active = objets[0]

    # Les réglages sont ceux de docs/import-zanatomy.md, et pour les mêmes
    # raisons : la scène et l'éclairage sont construits par le moteur, et la
    # compression est faite plus tard par `models:build` — la faire deux fois
    # dégrade le maillage sans rien gagner.
    bpy.ops.export_scene.gltf(
        filepath=str(destination),
        export_format="GLB",
        use_selection=True,
        export_cameras=False,
        export_lights=False,
        export_apply=True,
        export_normals=True,
        export_yup=True,
        export_draco_mesh_compression_enable=False,
        export_animations=False,
    )


def main():
    args = arguments()
    rapport_chemin = Path(args["rapport"])

    if args.get("inventaire"):
        objets = [
            {
                "nom": o.name,
                "collections": [c.name for c in o.users_collection],
                "triangles": len(o.data.loop_triangles) or len(o.data.polygons),
            }
            for o in tous_les_objets()
        ]
        rapport_chemin.write_text(
            json.dumps({"objets": objets}, ensure_ascii=False, indent=1), encoding="utf-8"
        )
        print(f"[gremah] inventaire : {len(objets)} objets maillés")
        return

    plan = json.loads(Path(args["plan"]).read_text(encoding="utf-8"))
    sortie = Path(args["sortie"])
    sortie.mkdir(parents=True, exist_ok=True)

    index = {}
    for objet in tous_les_objets():
        index.setdefault(normaliser(objet.name), []).append(objet)

    resultats = []
    for structure in plan:
        cles = [normaliser(c) for c in structure["cles"]]
        objets = []
        for cle in cles:
            objets.extend(index.get(cle, []))
        if not objets:
            # Repêchage : « Costae » doit ramener « Costa I », « Costa II »…
            for cle in cles:
                for nom, candidats in index.items():
                    if nom.startswith(cle[:-1] if cle.endswith("e") else cle):
                        objets.extend(candidats)

        if not objets:
            resultats.append({"id": structure["id"], "etat": "introuvable", "cles": structure["cles"]})
            print(f"[gremah] ✗ {structure['id']} — aucun objet pour {structure['cles']}")
            continue

        destination = sortie / f"{structure['id']}.glb"
        try:
            exporter(objets, destination)
        except Exception as erreur:  # noqa: BLE001 — on veut la vague entière, pas le premier échec
            resultats.append({"id": structure["id"], "etat": "erreur", "message": str(erreur)})
            print(f"[gremah] ✗ {structure['id']} — {erreur}")
            continue

        octets = destination.stat().st_size if destination.exists() else 0
        # Un `.glb` de moins de 10 Ko est vide en pratique : le signaler ici évite
        # de le découvrir au chargement, trois étapes plus loin.
        etat = "exporte" if octets > 10_240 else "vide"
        resultats.append(
            {
                "id": structure["id"],
                "etat": etat,
                "objets": [o.name for o in objets],
                "octets": octets,
            }
        )
        print(f"[gremah] {'✓' if etat == 'exporte' else '⚠'} {structure['id']} — {len(objets)} objet(s), {octets // 1024} Ko")

    rapport_chemin.write_text(
        json.dumps({"resultats": resultats}, ensure_ascii=False, indent=1), encoding="utf-8"
    )


main()
