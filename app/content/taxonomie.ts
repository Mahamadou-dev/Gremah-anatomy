/**
 * Taxonomie anatomique — l'arbre système → région → structure.
 *
 * Sprint 12. Neuf organes isolés ne font pas un atlas : ils font une démo. Ce
 * fichier arrête **la liste** des structures visées avant qu'un seul `.glb` ne
 * soit importé, parce que l'inverse produit un catalogue au hasard — on importe
 * ce qui traîne, pas ce qu'un cursus exige.
 *
 * Deux états seulement, et la distinction est publique :
 *   — `livree`    : le modèle existe dans `public/models/`, la fiche est rédigée ;
 *   — `planifiee` : la structure est au programme, rien n'est encore importé.
 *
 * Une structure `planifiee` n'est jamais présentée comme disponible. Promettre
 * une couverture qu'on n'a pas est la même faute que traduire à moitié.
 *
 * Ajouter une structure livrée = une entrée ici + une fiche dans `organes.ts` +
 * une provenance dans `assets/models-src/provenance.json`. Rien d'autre.
 */

export type StructureStatut = "livree" | "planifiee";

export type Structure = {
  /** Identifiant stable, kebab-case, sert de segment d'URL et de nom de `.glb`. */
  id: string;
  /** Nom français — langue source (CLAUDE.md §8). */
  nom: string;
  /** Terminologia Anatomica. */
  latin: string;
  /** Nom anglais, pour retrouver la littérature internationale. */
  english: string;
  statut: StructureStatut;
  /**
   * Nom de l'objet dans la source Z-Anatomy, quand il est connu — c'est ce que
   * `scripts/anatomie-blender.mjs` cherche dans l'arbre source.
   *
   * Trois formes, parce que la source ne se découpe pas comme un atlas :
   *   - `"Stomach"` — un objet, un organe, le cas simple ;
   *   - `["Left atrium", "Right atrium"]` — Z-Anatomy décompose la plupart des
   *     viscères en sous-parties, et **aucun objet « Heart » n'existe** : le cœur
   *     se compose de ses cavités, ses valves et ses piliers ;
   *   - `"~lobe of left lung"` — le tilde prend tout objet **contenant** ce
   *     texte, ce qui évite d'énumérer cinq lobes ou vingt-quatre côtes.
   */
  sourceObjet?: string | string[];
};

export type Region = {
  id: string;
  nom: string;
  english: string;
  structures: Structure[];
};

export type Systeme = {
  id: string;
  nom: string;
  english: string;
  /** Une phrase : ce que le système fait, pas ce qu'il contient. */
  resume: string;
  regions: Region[];
};

/**
 * Les grands systèmes. CLAUDE.md §11 en attend onze ; il y en a douze ici parce
 * que les organes des sens sont traités à part plutôt que fondus dans le nerveux
 * — c'est ainsi qu'ils sont enseignés et examinés.
 *
 * L'ordre est celui d'un cursus d'anatomie descriptive : on part du charpentage,
 * on finit par l'intégration.
 */
export const SYSTEMES: Systeme[] = [
  {
    id: "squelettique",
    nom: "Système squelettique",
    english: "Skeletal system",
    resume: "La charpente : elle porte, protège et sert de levier au muscle.",
    regions: [
      {
        id: "crane",
        nom: "Crâne",
        english: "Skull",
        structures: [
          {
            id: "crane-entier",
            nom: "Crâne",
            latin: "Cranium",
            english: "Skull",
            statut: "livree",
            sourceObjet: [
              "Frontal bone",
              "Parietal bone",
              "Occipital bone",
              "Temporal bone",
              "Sphenoid bone",
              "Ethmoid bone",
              "Maxilla",
              "Zygomatic bone",
              "Nasal bone",
              "Palatine bone",
              "Vomer",
              "Lacrimal bone",
              "Inferior nasal concha bone",
            ],
          },
          {
            id: "mandibule",
            nom: "Mandibule",
            latin: "Mandibula",
            english: "Mandible",
            statut: "livree",
            sourceObjet: "Mandible",
          },
          {
            id: "os-temporal",
            nom: "Os temporal",
            latin: "Os temporale",
            english: "Temporal bone",
            statut: "livree",
            sourceObjet: "Temporal bone",
          },
        ],
      },
      {
        id: "rachis",
        nom: "Rachis",
        english: "Vertebral column",
        structures: [
          {
            id: "colonne-vertebrale",
            nom: "Colonne vertébrale",
            latin: "Columna vertebralis",
            english: "Vertebral column",
            statut: "livree",
            sourceObjet: "~Vertebra",
          },
          {
            id: "vertebre-cervicale",
            nom: "Vertèbre cervicale",
            latin: "Vertebra cervicalis",
            english: "Cervical vertebra",
            statut: "livree",
            sourceObjet: "~Vertebra C",
          },
          {
            id: "vertebre-lombale",
            nom: "Vertèbre lombale",
            latin: "Vertebra lumbalis",
            english: "Lumbar vertebra",
            statut: "livree",
            sourceObjet: "~Vertebra L",
          },
          {
            id: "sacrum",
            nom: "Sacrum",
            latin: "Os sacrum",
            english: "Sacrum",
            statut: "livree",
            sourceObjet: "~sacrum",
          },
        ],
      },
      {
        id: "thorax-os",
        nom: "Cage thoracique",
        english: "Thoracic cage",
        structures: [
          {
            id: "sternum",
            nom: "Sternum",
            latin: "Sternum",
            english: "Sternum",
            statut: "livree",
            sourceObjet: "~of sternum",
          },
          {
            id: "cotes",
            nom: "Côtes",
            latin: "Costae",
            english: "Ribs",
            statut: "livree",
            sourceObjet: "~rib",
          },
        ],
      },
      {
        id: "membres-os",
        nom: "Membres",
        english: "Limbs",
        structures: [
          {
            id: "humerus",
            nom: "Humérus",
            latin: "Humerus",
            english: "Humerus",
            statut: "livree",
            sourceObjet: "~humerus",
          },
          {
            id: "radius-ulna",
            nom: "Radius et ulna",
            latin: "Radius et ulna",
            english: "Radius and ulna",
            statut: "livree",
            sourceObjet: ["Radius", "Ulna"],
          },
          {
            id: "os-coxal",
            nom: "Os coxal",
            latin: "Os coxae",
            english: "Hip bone",
            statut: "livree",
            sourceObjet: "~hip bone",
          },
          { id: "femur", nom: "Fémur", latin: "Femur", english: "Femur", statut: "livree" },
          {
            id: "tibia-fibula",
            nom: "Tibia et fibula",
            latin: "Tibia et fibula",
            english: "Tibia and fibula",
            statut: "livree",
            sourceObjet: ["Tibia", "Fibula"],
          },
        ],
      },
      {
        id: "articulations",
        nom: "Articulations majeures",
        english: "Major joints",
        structures: [
          {
            id: "articulation-scapulohumerale",
            nom: "Articulation de l'épaule",
            latin: "Articulatio glenohumeralis",
            english: "Shoulder joint",
            statut: "livree",
            sourceObjet: "~glenohumeral",
          },
          {
            id: "articulation-genou",
            nom: "Articulation du genou",
            latin: "Articulatio genus",
            english: "Knee joint",
            statut: "livree",
            sourceObjet: "~knee joint",
          },
          {
            id: "articulation-coxofemorale",
            nom: "Articulation de la hanche",
            latin: "Articulatio coxae",
            english: "Hip joint",
            statut: "livree",
            sourceObjet: "~hip joint",
          },
        ],
      },
    ],
  },
  {
    id: "musculaire",
    nom: "Système musculaire",
    english: "Muscular system",
    resume: "Le moteur : il convertit le signal nerveux en mouvement et en posture.",
    regions: [
      {
        id: "muscles-tronc",
        nom: "Tronc",
        english: "Trunk",
        structures: [
          {
            id: "diaphragme",
            nom: "Diaphragme",
            latin: "Diaphragma",
            english: "Diaphragm",
            statut: "livree",
            sourceObjet: "~diaphragm",
          },
          {
            id: "grand-droit-abdomen",
            nom: "Muscle droit de l'abdomen",
            latin: "Musculus rectus abdominis",
            english: "Rectus abdominis",
            statut: "livree",
            sourceObjet: "Rectus abdominis muscle",
          },
          {
            id: "grand-dorsal",
            nom: "Muscle grand dorsal",
            latin: "Musculus latissimus dorsi",
            english: "Latissimus dorsi",
            statut: "livree",
            sourceObjet: "Latissimus dorsi muscle",
          },
          {
            id: "trapeze",
            nom: "Muscle trapèze",
            latin: "Musculus trapezius",
            english: "Trapezius",
            statut: "livree",
            sourceObjet: "~part of trapezius muscle",
          },
        ],
      },
      {
        id: "muscles-membres",
        nom: "Membres",
        english: "Limbs",
        structures: [
          {
            id: "biceps-brachial",
            nom: "Muscle biceps brachial",
            latin: "Musculus biceps brachii",
            english: "Biceps brachii",
            statut: "livree",
            sourceObjet: "~head of biceps brachii",
          },
          {
            id: "deltoide",
            nom: "Muscle deltoïde",
            latin: "Musculus deltoideus",
            english: "Deltoid",
            statut: "livree",
            sourceObjet: "~part of deltoid muscle",
          },
          {
            id: "quadriceps",
            nom: "Muscle quadriceps fémoral",
            latin: "Musculus quadriceps femoris",
            english: "Quadriceps femoris",
            statut: "livree",
            sourceObjet: ["Rectus femoris muscle", "~vastus"],
          },
          {
            id: "triceps-sural",
            nom: "Muscle triceps sural",
            latin: "Musculus triceps surae",
            english: "Triceps surae",
            statut: "livree",
            sourceObjet: ["~gastrocnemius", "Soleus muscle"],
          },
        ],
      },
    ],
  },
  {
    id: "cardiovasculaire",
    nom: "Système cardiovasculaire",
    english: "Cardiovascular system",
    resume: "La pompe et son réseau : un circuit fermé qui distribue et récupère.",
    regions: [
      {
        id: "coeur",
        nom: "Cœur",
        english: "Heart",
        structures: [
          {
            id: "heart",
            nom: "Cœur",
            latin: "Cor",
            english: "Heart",
            statut: "livree",
            sourceObjet: [
              "Left atrium",
              "Right atrium",
              "Left ventricle",
              "Right ventricle",
              "~papillary muscle",
            ],
          },
          {
            id: "valves-cardiaques",
            nom: "Valves cardiaques",
            latin: "Valvae cordis",
            english: "Cardiac valves",
            statut: "livree",
            sourceObjet: ["Aortic valve", "~atrioventricular valve", "~leaflet of pulmonary valve"],
          },
          {
            id: "arteres-coronaires",
            nom: "Artères coronaires",
            latin: "Arteriae coronariae",
            english: "Coronary arteries",
            statut: "planifiee",
          },
        ],
      },
      {
        id: "gros-vaisseaux",
        nom: "Gros vaisseaux",
        english: "Great vessels",
        structures: [
          { id: "aorte", nom: "Aorte", latin: "Aorta", english: "Aorta", statut: "planifiee" },
          {
            id: "veine-cave-inferieure",
            nom: "Veine cave inférieure",
            latin: "Vena cava inferior",
            english: "Inferior vena cava",
            statut: "planifiee",
          },
          {
            id: "tronc-pulmonaire",
            nom: "Tronc pulmonaire",
            latin: "Truncus pulmonalis",
            english: "Pulmonary trunk",
            statut: "livree",
            sourceObjet: "Pulmonary trunk",
          },
          {
            id: "artere-carotide-commune",
            nom: "Artère carotide commune",
            latin: "Arteria carotis communis",
            english: "Common carotid artery",
            statut: "planifiee",
          },
        ],
      },
    ],
  },
  {
    id: "respiratoire",
    nom: "Système respiratoire",
    english: "Respiratory system",
    resume: "Le circuit de l'air : de la narine à l'alvéole, puis l'échange gazeux.",
    regions: [
      {
        id: "voies-superieures",
        nom: "Voies aériennes supérieures",
        english: "Upper airway",
        structures: [
          {
            id: "cavite-nasale",
            nom: "Cavité nasale",
            latin: "Cavitas nasi",
            english: "Nasal cavity",
            statut: "livree",
            sourceObjet: "Mucosa of nasal cavity",
          },
          {
            id: "larynx",
            nom: "Larynx",
            latin: "Larynx",
            english: "Larynx",
            statut: "livree",
            sourceObjet: ["Epiglottis", "Thyroid cartilage", "~cricoid", "~arytenoid"],
          },
          {
            id: "trachee",
            nom: "Trachée",
            latin: "Trachea",
            english: "Trachea",
            statut: "livree",
          },
        ],
      },
      {
        id: "poumons",
        nom: "Poumons",
        english: "Lungs",
        structures: [
          {
            id: "lungs",
            nom: "Poumons",
            latin: "Pulmones",
            english: "Lungs",
            statut: "livree",
            sourceObjet: ["~lobe of left lung", "~lobe of right lung"],
          },
          {
            id: "arbre-bronchique",
            nom: "Arbre bronchique",
            latin: "Arbor bronchialis",
            english: "Bronchial tree",
            statut: "livree",
          },
        ],
      },
    ],
  },
  {
    id: "digestif",
    nom: "Système digestif",
    english: "Digestive system",
    resume: "Un tube et ses glandes : il découpe la matière jusqu'à ce qu'elle passe la paroi.",
    regions: [
      {
        id: "tube-digestif",
        nom: "Tube digestif",
        english: "Alimentary canal",
        structures: [
          {
            id: "oesophage",
            nom: "Œsophage",
            latin: "Oesophagus",
            english: "Oesophagus",
            statut: "planifiee",
          },
          {
            id: "estomac",
            nom: "Estomac",
            latin: "Gaster",
            english: "Stomach",
            statut: "livree",
          },
          {
            id: "intestine",
            nom: "Intestin",
            latin: "Intestinum",
            english: "Intestine",
            statut: "livree",
            sourceObjet: ["~colon", "~duodenum"],
          },
          {
            id: "colon",
            nom: "Côlon",
            latin: "Colon",
            english: "Colon",
            statut: "livree",
            sourceObjet: ["~colon"],
          },
          {
            id: "rectum",
            nom: "Rectum",
            latin: "Rectum",
            english: "Rectum",
            statut: "planifiee",
          },
        ],
      },
      {
        id: "glandes-annexes",
        nom: "Glandes annexes",
        english: "Accessory glands",
        structures: [
          {
            id: "liver",
            nom: "Foie",
            latin: "Hepar",
            english: "Liver",
            statut: "livree",
            sourceObjet: ["~segment of liver"],
          },
          {
            id: "pancreas",
            nom: "Pancréas",
            latin: "Pancreas",
            english: "Pancreas",
            statut: "livree",
            sourceObjet: "Pancreas",
          },
          {
            id: "vesicule-biliaire",
            nom: "Vésicule biliaire",
            latin: "Vesica biliaris",
            english: "Gallbladder",
            statut: "livree",
          },
          {
            id: "glandes-salivaires",
            nom: "Glandes salivaires",
            latin: "Glandulae salivariae",
            english: "Salivary glands",
            statut: "livree",
            sourceObjet: ["Parotid gland", "Submandibular gland", "~sublingual gland"],
          },
        ],
      },
    ],
  },
  {
    id: "urinaire",
    nom: "Système urinaire",
    english: "Urinary system",
    resume: "Le filtre et son évacuation : il règle le volume autant qu'il épure.",
    regions: [
      {
        id: "haut-appareil",
        nom: "Haut appareil urinaire",
        english: "Upper urinary tract",
        structures: [
          {
            id: "kidneys",
            nom: "Reins",
            latin: "Renes",
            english: "Kidneys",
            statut: "livree",
            sourceObjet: "Kidney",
          },
          {
            id: "uretere",
            nom: "Uretère",
            latin: "Ureter",
            english: "Ureter",
            statut: "planifiee",
          },
          {
            id: "glande-surrenale",
            nom: "Glande surrénale",
            latin: "Glandula suprarenalis",
            english: "Suprarenal gland",
            statut: "livree",
          },
        ],
      },
      {
        id: "bas-appareil",
        nom: "Bas appareil urinaire",
        english: "Lower urinary tract",
        structures: [
          {
            id: "vessie",
            nom: "Vessie",
            latin: "Vesica urinaria",
            english: "Urinary bladder",
            statut: "livree",
            sourceObjet: "Urinary bladder",
          },
          {
            id: "uretre",
            nom: "Urètre",
            latin: "Urethra",
            english: "Urethra",
            statut: "planifiee",
          },
        ],
      },
    ],
  },
  {
    id: "nerveux",
    nom: "Système nerveux",
    english: "Nervous system",
    resume: "Le réseau d'intégration : il perçoit, décide et commande.",
    regions: [
      {
        id: "encephale",
        nom: "Encéphale",
        english: "Brain",
        structures: [
          {
            id: "brain",
            nom: "Encéphale",
            latin: "Encephalon",
            english: "Brain",
            statut: "livree",
            sourceObjet: ["~white matter of telencephalon", "~gyrus", "Thalamus", "Hypothalamus"],
          },
          {
            id: "lobe-frontal",
            nom: "Lobe frontal",
            latin: "Lobus frontalis",
            english: "Frontal lobe",
            statut: "planifiee",
          },
          {
            id: "lobe-parietal",
            nom: "Lobe pariétal",
            latin: "Lobus parietalis",
            english: "Parietal lobe",
            statut: "planifiee",
          },
          {
            id: "lobe-temporal",
            nom: "Lobe temporal",
            latin: "Lobus temporalis",
            english: "Temporal lobe",
            statut: "planifiee",
          },
          {
            id: "lobe-occipital",
            nom: "Lobe occipital",
            latin: "Lobus occipitalis",
            english: "Occipital lobe",
            statut: "planifiee",
          },
          {
            id: "cervelet",
            nom: "Cervelet",
            latin: "Cerebellum",
            english: "Cerebellum",
            statut: "livree",
            sourceObjet: ["~cerebellum", "~cerebelli"],
          },
          {
            id: "tronc-cerebral",
            nom: "Tronc cérébral",
            latin: "Truncus encephali",
            english: "Brainstem",
            statut: "livree",
            sourceObjet: ["Midbrain", "Pons", "Medulla oblongata"],
          },
        ],
      },
      {
        id: "nerveux-peripherique",
        nom: "Moelle et nerfs",
        english: "Spinal cord and nerves",
        structures: [
          {
            id: "moelle-spinale",
            nom: "Moelle spinale",
            latin: "Medulla spinalis",
            english: "Spinal cord",
            statut: "planifiee",
          },
          {
            id: "nerfs-craniens",
            nom: "Nerfs crâniens",
            latin: "Nervi craniales",
            english: "Cranial nerves",
            statut: "planifiee",
          },
          {
            id: "plexus-brachial",
            nom: "Plexus brachial",
            latin: "Plexus brachialis",
            english: "Brachial plexus",
            statut: "planifiee",
          },
          {
            id: "nerf-ischiatique",
            nom: "Nerf ischiatique",
            latin: "Nervus ischiadicus",
            english: "Sciatic nerve",
            statut: "planifiee",
          },
        ],
      },
    ],
  },
  {
    id: "sensoriel",
    nom: "Organes des sens",
    english: "Sensory organs",
    resume: "Les capteurs : ils traduisent une énergie physique en influx nerveux.",
    regions: [
      {
        id: "vision",
        nom: "Vision",
        english: "Vision",
        structures: [
          {
            id: "eyeball",
            nom: "Globe oculaire",
            latin: "Bulbus oculi",
            english: "Eyeball",
            statut: "livree",
            sourceObjet: ["~eyeball"],
          },
          {
            id: "appareil-lacrymal",
            nom: "Appareil lacrymal",
            latin: "Apparatus lacrimalis",
            english: "Lacrimal apparatus",
            statut: "planifiee",
          },
        ],
      },
      {
        id: "audition",
        nom: "Audition et équilibre",
        english: "Hearing and balance",
        structures: [
          {
            id: "oreille-interne",
            nom: "Oreille interne",
            latin: "Auris interna",
            english: "Inner ear",
            statut: "livree",
            sourceObjet: "~cochlea",
          },
          {
            id: "osselets",
            nom: "Osselets de l'ouïe",
            latin: "Ossicula auditus",
            english: "Auditory ossicles",
            statut: "livree",
            sourceObjet: ["~incus", "~malleus", "~stapes"],
          },
        ],
      },
    ],
  },
  {
    id: "endocrinien",
    nom: "Système endocrinien",
    english: "Endocrine system",
    resume: "Le pilotage lent : des glandes qui parlent au corps entier par le sang.",
    regions: [
      {
        id: "glandes",
        nom: "Glandes endocrines",
        english: "Endocrine glands",
        structures: [
          {
            id: "hypophyse",
            nom: "Hypophyse",
            latin: "Hypophysis",
            english: "Pituitary gland",
            statut: "livree",
            sourceObjet: "~hypophysis",
          },
          {
            id: "thyroide",
            nom: "Glande thyroïde",
            latin: "Glandula thyroidea",
            english: "Thyroid gland",
            statut: "livree",
          },
          {
            id: "parathyroides",
            nom: "Glandes parathyroïdes",
            latin: "Glandulae parathyroideae",
            english: "Parathyroid glands",
            statut: "planifiee",
          },
        ],
      },
    ],
  },
  {
    id: "lymphatique",
    nom: "Système lymphatique",
    english: "Lymphatic system",
    resume: "Le drainage et la défense : il récupère ce que le capillaire a laissé filer.",
    regions: [
      {
        id: "organes-lymphoides",
        nom: "Organes lymphoïdes",
        english: "Lymphoid organs",
        structures: [
          { id: "rate", nom: "Rate", latin: "Splen", english: "Spleen", statut: "livree" },
          {
            id: "thymus",
            nom: "Thymus",
            latin: "Thymus",
            english: "Thymus",
            statut: "livree",
            sourceObjet: "~thymus",
          },
          {
            id: "noeuds-lymphatiques",
            nom: "Nœuds lymphatiques",
            latin: "Nodi lymphoidei",
            english: "Lymph nodes",
            statut: "livree",
            sourceObjet: "~nodes",
          },
        ],
      },
    ],
  },
  {
    id: "genital",
    nom: "Appareils génitaux",
    english: "Reproductive systems",
    resume: "La reproduction : deux appareils décrits à parité, sans l'un pour référence.",
    regions: [
      {
        id: "genital-feminin",
        nom: "Appareil génital féminin",
        english: "Female reproductive system",
        structures: [
          {
            id: "uterus",
            nom: "Utérus",
            latin: "Uterus",
            english: "Uterus",
            statut: "planifiee",
          },
          {
            id: "ovaire",
            nom: "Ovaire",
            latin: "Ovarium",
            english: "Ovary",
            statut: "planifiee",
          },
          {
            id: "trompe-uterine",
            nom: "Trompe utérine",
            latin: "Tuba uterina",
            english: "Uterine tube",
            statut: "planifiee",
          },
        ],
      },
      {
        id: "genital-masculin",
        nom: "Appareil génital masculin",
        english: "Male reproductive system",
        structures: [
          {
            id: "testicule",
            nom: "Testicule",
            latin: "Testis",
            english: "Testis",
            statut: "livree",
          },
          {
            id: "prostate",
            nom: "Prostate",
            latin: "Prostata",
            english: "Prostate",
            statut: "livree",
            sourceObjet: "Prostate",
          },
        ],
      },
    ],
  },
  {
    id: "tegumentaire",
    nom: "Système tégumentaire",
    english: "Integumentary system",
    resume: "La frontière : barrière, thermostat et plus grande surface sensorielle du corps.",
    regions: [
      {
        id: "peau",
        nom: "Peau et annexes",
        english: "Skin and appendages",
        structures: [
          { id: "skin", nom: "Peau", latin: "Cutis", english: "Skin", statut: "livree" },
        ],
      },
    ],
  },
];

/** Toutes les structures, à plat — l'arbre sert à naviguer, pas à compter. */
export const STRUCTURES: Structure[] = SYSTEMES.flatMap((systeme) =>
  systeme.regions.flatMap((region) => region.structures),
);

export const STRUCTURES_LIVREES = STRUCTURES.filter((s) => s.statut === "livree");

/** Le système auquel appartient une structure — pour le fil d'Ariane. */
export function systemeDe(structureId: string): Systeme | undefined {
  return SYSTEMES.find((systeme) =>
    systeme.regions.some((region) => region.structures.some((s) => s.id === structureId)),
  );
}

/** Compte affiché sur la page crédits et la vitrine. Pas de chiffre en dur. */
export const COUVERTURE = {
  systemes: SYSTEMES.length,
  structures: STRUCTURES.length,
  livrees: STRUCTURES_LIVREES.length,
} as const;
