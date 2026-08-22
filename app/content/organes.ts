import type { Organ } from "./schema";

// Réexport : le moteur et l'interface importent le contenu, pas le schéma.
export type { Organ, OrganId, Hotspot, FaitClinique, Source } from "./schema";

/**
 * Contenu anatomique — français langue source.
 *
 * Chaque organe porte les repères qu'un étudiant de PCEM/DCEM doit pouvoir
 * réciter : situation, vascularisation, innervation, drainage, histologie,
 * rapports. Les corrélations cliniques sont sourcées une par une, et l'ancrage
 * nigérien renvoie à des pathologies réellement prévalentes dans le pays.
 *
 * Le vocabulaire vernaculaire ne donne que le hausa, et seulement pour les termes
 * courants et bien attestés. Le zarma reste à compléter par un locuteur : inventer
 * un mot serait pire que de laisser la case vide.
 */
export const organs: Organ[] = [
  // ------------------------------------------------------------------- cœur
  {
    id: "heart",
    name: "Cœur",
    latin: "Cor",
    english: "Heart",
    system: "Appareil cardiovasculaire",
    model: "/models/heart.glb",
    icon: "♥",
    accent: "#ee7c6a",
    illustrated: true,
    description:
      "Organe musculaire creux à quatre cavités, le cœur propulse le sang dans deux circulations montées en série : la petite circulation vers les poumons, la grande vers le reste du corps. Il fonctionne sans repos de la quatrième semaine de vie intra-utérine jusqu'à la mort.",
    poetic: "La pompe qui ne s'arrête jamais",
    taille: "Environ le poing fermé du sujet — 12 cm de long sur 8 cm de large",
    poids: "250 à 350 g chez l'adulte",
    situation:
      "Médiastin antérieur et moyen, derrière le sternum, les deux tiers de sa masse à gauche de la ligne médiane",
    fonction: "Assure le débit sanguin dans les circulations systémique et pulmonaire",
    vascularisation:
      "Artères coronaires droite et gauche, nées des sinus aortiques juste au-dessus de la valve aortique",
    innervation:
      "Plexus cardiaque : fibres sympathiques accélératrices, nerf vague (X) modérateur. L'automatisme, lui, est intrinsèque",
    drainage:
      "Sinus coronaire vers l'atrium droit ; lymphatiques vers les nœuds trachéobronchiques",
    histologie:
      "Trois tuniques : endocarde (endothélium), myocarde (cardiomyocytes striés reliés par des disques intercalaires qui couplent les cellules électriquement), épicarde. Le tissu nodal est un myocarde modifié, pauvre en myofibrilles et riche en glycogène.",
    physiologie: [
      "Le nœud sinusal, dans la paroi de l'atrium droit, décharge spontanément et impose le rythme : c'est le pacemaker physiologique.",
      "L'influx gagne le nœud atrioventriculaire, qui le retarde — ce délai laisse aux atriums le temps de se vider avant la contraction ventriculaire.",
      "Le faisceau atrioventriculaire et le réseau de Purkinje distribuent l'excitation à tout le myocarde ventriculaire en quelques dizaines de millisecondes.",
      "Débit cardiaque = fréquence × volume d'éjection systolique. Au repos, environ 5 litres par minute ; jusqu'à 25 litres à l'effort chez le sujet entraîné.",
      "La loi de Frank-Starling : plus le ventricule est rempli en diastole, plus sa contraction est puissante. C'est ce qui apparie automatiquement les débits droit et gauche.",
    ],
    rapports:
      "En avant : sternum et cartilages costaux. En arrière : œsophage, aorte thoracique descendante, vertèbres. En bas : centre tendineux du diaphragme. Latéralement : les deux poumons et les nerfs phréniques.",
    clinique: [
      {
        titre: "Territoires coronaires",
        texte:
          "L'artère interventriculaire antérieure irrigue la paroi antérieure et les deux tiers antérieurs du septum ; l'artère coronaire droite le ventricule droit et, chez la majorité des sujets, le nœud sinusal et le nœud atrioventriculaire. Une occlusion se traduit donc par un territoire nécrosé prévisible — c'est la base de la lecture d'un électrocardiogramme.",
        source: "moore",
      },
      {
        titre: "Douleur projetée",
        texte:
          "Les fibres afférentes du cœur rejoignent la moelle par les segments T1 à T4, les mêmes que la paroi thoracique et le bord interne du membre supérieur gauche. C'est l'explication anatomique de l'irradiation classique de la douleur d'infarctus vers la mâchoire et le bras gauche.",
        source: "gray",
      },
    ],
    ancrageNiger: {
      titre: "Cardiopathie rhumatismale",
      texte:
        "Complication tardive d'angines à streptocoque du groupe A non traitées, elle reste une cause majeure de valvulopathie de l'enfant et de l'adulte jeune en Afrique subsaharienne, alors qu'elle a quasiment disparu des pays à revenu élevé. La valve mitrale est la plus touchée. Le dépistage d'un souffle chez un écolier n'y est donc pas un geste anodin.",
      source: "oms-rhumatisme",
    },
    pathologies: [
      "Cardiopathie rhumatismale",
      "Insuffisance coronarienne",
      "Insuffisance cardiaque",
      "Fibrillation atriale",
      "Cardiomyopathie du péripartum",
      "Cardiopathies congénitales",
      "Péricardite tuberculeuse",
    ],
    leSaviezVous:
      "Le cœur bat environ 100 000 fois par jour, soit près de 2,5 milliards de battements sur une vie — et il commence à battre vers la quatrième semaine de développement, avant même que ses quatre cavités ne soient formées.",
    vernaculaire: { hausa: "zuciya" },
    sources: ["gray", "moore", "guyton", "ta", "oms-rhumatisme"],
    hotspots: [
      {
        id: "aorta",
        label: "Aorte",
        latin: "Aorta",
        detail: "Artère principale de la grande circulation",
        position: [-0.35, 1.65, 0.55],
        color: "#ee7c6a",
      },
      {
        id: "left-atrium",
        label: "Atrium gauche",
        latin: "Atrium sinistrum",
        detail: "Reçoit le sang oxygéné des veines pulmonaires",
        position: [0.82, 0.65, 0.5],
        color: "#f2a33b",
      },
      {
        id: "right-atrium",
        label: "Atrium droit",
        latin: "Atrium dextrum",
        detail: "Reçoit le sang veineux des veines caves",
        position: [-0.9, 0.35, 0.55],
        color: "#6393d8",
      },
      {
        id: "left-ventricle",
        label: "Ventricule gauche",
        latin: "Ventriculus sinister",
        detail: "Paroi la plus épaisse : il alimente tout le corps",
        position: [0.7, -0.75, 0.65],
        color: "#f2a33b",
      },
      {
        id: "right-ventricle",
        label: "Ventricule droit",
        latin: "Ventriculus dexter",
        detail: "Éjecte le sang vers les poumons, à basse pression",
        position: [-0.65, -0.68, 0.66],
        color: "#ee7c6a",
      },
      {
        id: "mitral",
        label: "Valve mitrale",
        latin: "Valva atrioventricularis sinistra",
        detail: "Deux cuspides — la valve la plus souvent atteinte par le rhumatisme",
        position: [0.18, -1.35, 0.48],
        color: "#d89bc4",
      },
    ],
    en: {
      name: "Heart",
      description:
        "A hollow, four-chambered muscular organ, the heart drives blood through two circulations wired in series: the pulmonary circuit toward the lungs, the systemic circuit toward the rest of the body. It works without rest from the fourth week of intrauterine life until death.",
      poetic: "The pump that never stops",
      taille: "About the size of the subject's clenched fist — 12 cm long by 8 cm wide",
      poids: "250 to 350 g in the adult",
      situation:
        "Anterior and middle mediastinum, behind the sternum, two-thirds of its mass to the left of the midline",
      fonction: "Drives blood flow through the systemic and pulmonary circulations",
      vascularisation:
        "Right and left coronary arteries, arising from the aortic sinuses just above the aortic valve",
      innervation:
        "Cardiac plexus: sympathetic fibres accelerate it, the vagus nerve (X) slows it. Automaticity itself is intrinsic to the heart",
      drainage: "Coronary sinus to the right atrium; lymphatics to the tracheobronchial nodes",
      histologie:
        "Three layers: endocardium (endothelium), myocardium (striated cardiomyocytes linked by intercalated discs that couple the cells electrically), epicardium. Nodal tissue is modified myocardium, poor in myofibrils and rich in glycogen.",
      physiologie: [
        "The sinoatrial node, in the right atrial wall, fires spontaneously and sets the rhythm: the physiological pacemaker.",
        "The impulse reaches the atrioventricular node, which delays it — this delay gives the atria time to empty before the ventricles contract.",
        "The atrioventricular bundle and Purkinje network spread excitation through the whole ventricular myocardium in a few tens of milliseconds.",
        "Cardiac output = heart rate × stroke volume. About 5 litres per minute at rest; up to 25 litres during exertion in a trained subject.",
        "The Frank–Starling law: the more the ventricle fills in diastole, the more forcefully it contracts. This is what automatically matches right and left output.",
      ],
      rapports:
        "Anteriorly: sternum and costal cartilages. Posteriorly: oesophagus, descending thoracic aorta, vertebrae. Inferiorly: the diaphragm's central tendon. Laterally: both lungs and the phrenic nerves.",
      clinique: [
        {
          titre: "Coronary territories",
          texte:
            "The anterior interventricular artery supplies the anterior wall and the anterior two-thirds of the septum; the right coronary artery supplies the right ventricle and, in most subjects, the sinoatrial and atrioventricular nodes. An occlusion therefore produces a predictable territory of necrosis — the basis for reading an electrocardiogram.",
        },
        {
          titre: "Referred pain",
          texte:
            "Cardiac afferent fibres reach the spinal cord through segments T1 to T4, the same segments as the chest wall and the medial side of the left upper limb. This is the anatomical explanation for the classic radiation of infarct pain to the jaw and left arm.",
        },
      ],
      ancrageNiger: {
        titre: "Rheumatic heart disease",
        texte:
          "A late complication of untreated group A streptococcal throat infections, it remains a major cause of valve disease in children and young adults in sub-Saharan Africa, though it has nearly disappeared from high-income countries. The mitral valve is affected most often. Screening a schoolchild's heart murmur is therefore not a trivial gesture there.",
      },
      pathologies: [
        "Rheumatic heart disease",
        "Coronary insufficiency",
        "Heart failure",
        "Atrial fibrillation",
        "Peripartum cardiomyopathy",
        "Congenital heart disease",
        "Tuberculous pericarditis",
      ],
      leSaviezVous:
        "The heart beats roughly 100,000 times a day — nearly 2.5 billion beats over a lifetime — and it starts beating around the fourth week of development, before its four chambers have even formed.",
      hotspots: [
        { id: "aorta", label: "Aorta", detail: "Main artery of the systemic circulation" },
        {
          id: "left-atrium",
          label: "Left atrium",
          detail: "Receives oxygenated blood from the pulmonary veins",
        },
        {
          id: "right-atrium",
          label: "Right atrium",
          detail: "Receives venous blood from the venae cavae",
        },
        {
          id: "left-ventricle",
          label: "Left ventricle",
          detail: "Thickest wall: it supplies the entire body",
        },
        {
          id: "right-ventricle",
          label: "Right ventricle",
          detail: "Ejects blood to the lungs, at low pressure",
        },
        {
          id: "mitral",
          label: "Mitral valve",
          detail: "Two cusps — the valve most often damaged by rheumatic disease",
        },
      ],
    },
  },

  // ---------------------------------------------------------------- cerveau
  {
    id: "brain",
    name: "Cerveau",
    latin: "Encephalon",
    english: "Brain",
    system: "Système nerveux central",
    model: "/models/brain.glb",
    icon: "❋",
    accent: "#c58696",
    illustrated: true,
    description:
      "Contenu dans la boîte crânienne et protégé par trois méninges, l'encéphale traite l'information sensorielle, commande le mouvement, régule les fonctions végétatives et porte la conscience. Il consomme environ 20 % de l'oxygène du corps pour 2 % de sa masse.",
    poetic: "Deux pour cent du poids, vingt pour cent de l'oxygène",
    taille: "Environ 16 cm de long sur 14 cm de large",
    poids: "1 300 à 1 400 g chez l'adulte",
    situation: "Cavité crânienne, entouré de la dure-mère, de l'arachnoïde et de la pie-mère",
    fonction: "Intégration sensorimotrice, fonctions supérieures, régulation végétative",
    vascularisation:
      "Deux artères carotides internes et deux artères vertébrales, anastomosées en cercle artériel du cerveau (polygone de Willis) à la base du crâne",
    innervation:
      "Le parenchyme cérébral est insensible à la douleur : la céphalée naît des méninges et des vaisseaux, innervés par le nerf trijumeau (V)",
    drainage:
      "Sinus veineux de la dure-mère puis veines jugulaires internes. Pas de vaisseaux lymphatiques classiques : la clairance passe par le liquide cérébrospinal",
    histologie:
      "Cortex à six couches de neurones (isocortex), substance blanche faite d'axones myélinisés, névroglie (astrocytes, oligodendrocytes, microglie) dix fois plus nombreuse que les neurones. Les astrocytes participent à la barrière hémato-encéphalique.",
    physiologie: [
      "Le cortex frontal porte la planification, le jugement, l'inhibition du comportement et, à sa partie postérieure, la commande motrice volontaire.",
      "Le lobe pariétal intègre les sensibilités somatiques et construit la représentation de l'espace.",
      "Le lobe temporal traite l'audition et, par l'hippocampe, la formation des souvenirs.",
      "Le lobe occipital reçoit la voie visuelle ; une lésion y provoque une amputation du champ visuel, non une cécité complète.",
      "Le cervelet ne commande pas le mouvement : il l'ajuste. Sa lésion donne une ataxie, pas une paralysie.",
      "Le débit sanguin cérébral est maintenu constant par autorégulation entre 60 et 150 mmHg de pression artérielle moyenne.",
    ],
    rapports:
      "Repose sur la base du crâne, dont les trois étages logent respectivement les lobes frontaux, les lobes temporaux et le cervelet avec le tronc cérébral. Le foramen magnum livre passage au bulbe rachidien — l'engagement à ce niveau est mortel.",
    clinique: [
      {
        titre: "Cercle artériel du cerveau",
        texte:
          "Les anastomoses du polygone de Willis permettent, chez certains sujets, de suppléer l'occlusion progressive d'une carotide interne. Ce cercle est cependant complet et fonctionnel chez une minorité de la population, ce qui explique la variabilité des tableaux d'accident vasculaire cérébral.",
        source: "gray",
      },
      {
        titre: "Barrière hémato-encéphalique",
        texte:
          "Les jonctions serrées entre cellules endothéliales des capillaires cérébraux limitent le passage des molécules hydrophiles et de nombreux antibiotiques. Sa perméabilité augmente en cas d'inflammation méningée — ce qui rend certains traitements efficaces précisément quand ils sont nécessaires.",
        source: "guyton",
      },
    ],
    ancrageNiger: {
      titre: "Ceinture africaine de la méningite",
      texte:
        "Le Niger appartient à la ceinture de la méningite, une bande allant du Sénégal à l'Éthiopie où surviennent des épidémies saisonnières de méningite à méningocoque, typiquement pendant la saison sèche et les vents d'harmattan. La ponction lombaire y est un geste de première ligne, et la connaissance des espaces méningés cesse d'être théorique.",
      source: "oms-meningite",
    },
    pathologies: [
      "Méningite bactérienne",
      "Neuropaludisme",
      "Accident vasculaire cérébral",
      "Épilepsie",
      "Traumatisme crânien",
      "Tumeurs intracrâniennes",
      "Hydrocéphalie",
    ],
    leSaviezVous:
      "Le cerveau ne contient aucun récepteur de la douleur. Une chirurgie cérébrale peut se pratiquer chez un patient éveillé, qui parle et bouge pendant que le chirurgien cartographie les zones à préserver.",
    vernaculaire: { hausa: "ƙwaƙwalwa" },
    sources: ["gray", "moore", "guyton", "junqueira", "ta", "oms-meningite", "oms-paludisme"],
    hotspots: [
      {
        id: "frontal",
        label: "Lobe frontal",
        latin: "Lobus frontalis",
        detail: "Planification, langage moteur, commande volontaire",
        position: [-0.7, 0.65, 0.8],
        color: "#ee7c6a",
      },
      {
        id: "parietal",
        label: "Lobe pariétal",
        latin: "Lobus parietalis",
        detail: "Sensibilités somatiques et représentation de l'espace",
        position: [0.15, 1.1, 0.65],
        color: "#f2a33b",
      },
      {
        id: "temporal",
        label: "Lobe temporal",
        latin: "Lobus temporalis",
        detail: "Audition, mémoire, compréhension du langage",
        position: [0.75, -0.1, 0.82],
        color: "#6393d8",
      },
      {
        id: "cerebellum",
        label: "Cervelet",
        latin: "Cerebellum",
        detail: "Coordination et ajustement du mouvement, équilibre",
        position: [0.72, -0.9, 0.55],
        color: "#d89bc4",
      },
    ],
    en: {
      name: "Brain",
      description:
        "Housed in the skull and protected by three meninges, the brain processes sensory information, commands movement, regulates vegetative functions and carries consciousness. It consumes about 20% of the body's oxygen for 2% of its mass.",
      poetic: "Two percent of the weight, twenty percent of the oxygen",
      taille: "About 16 cm long by 14 cm wide",
      poids: "1,300 to 1,400 g in the adult",
      situation: "Cranial cavity, surrounded by the dura mater, arachnoid and pia mater",
      fonction: "Sensorimotor integration, higher functions, vegetative regulation",
      vascularisation:
        "Two internal carotid arteries and two vertebral arteries, joined in the cerebral arterial circle (circle of Willis) at the base of the skull",
      innervation:
        "Brain tissue itself feels no pain: headache arises from the meninges and vessels, innervated by the trigeminal nerve (V)",
      drainage:
        "Dural venous sinuses, then internal jugular veins. No classic lymphatic vessels: clearance runs through the cerebrospinal fluid",
      histologie:
        "A six-layered cortex of neurons (isocortex), white matter made of myelinated axons, and neuroglia (astrocytes, oligodendrocytes, microglia) ten times more numerous than neurons. Astrocytes take part in the blood–brain barrier.",
      physiologie: [
        "The frontal cortex carries planning, judgement, behavioural inhibition and, at its posterior part, voluntary motor command.",
        "The parietal lobe integrates somatic sensation and builds the representation of space.",
        "The temporal lobe processes hearing and, through the hippocampus, memory formation.",
        "The occipital lobe receives the visual pathway; a lesion there causes a field cut, not total blindness.",
        "The cerebellum does not command movement: it fine-tunes it. Its damage produces ataxia, not paralysis.",
        "Cerebral blood flow is kept constant by autoregulation between 60 and 150 mmHg of mean arterial pressure.",
      ],
      rapports:
        "Rests on the base of the skull, whose three fossae house the frontal lobes, the temporal lobes, and the cerebellum with the brainstem, respectively. The foramen magnum gives passage to the medulla oblongata — herniation at this level is fatal.",
      clinique: [
        {
          titre: "Cerebral arterial circle",
          texte:
            "The anastomoses of the circle of Willis let some subjects compensate for the progressive occlusion of an internal carotid artery. This circle is complete and functional in only a minority of the population, though, which explains the variability of stroke presentations.",
        },
        {
          titre: "Blood–brain barrier",
          texte:
            "Tight junctions between the endothelial cells of cerebral capillaries limit the passage of hydrophilic molecules and many antibiotics. Its permeability rises with meningeal inflammation — which makes certain treatments effective exactly when they are needed.",
        },
      ],
      ancrageNiger: {
        titre: "The African meningitis belt",
        texte:
          "Niger lies within the meningitis belt, a band stretching from Senegal to Ethiopia where seasonal epidemics of meningococcal meningitis occur, typically during the dry season and the harmattan winds. Lumbar puncture is a first-line procedure there, and knowledge of the meningeal spaces stops being theoretical.",
      },
      pathologies: [
        "Bacterial meningitis",
        "Cerebral malaria",
        "Stroke",
        "Epilepsy",
        "Head trauma",
        "Intracranial tumours",
        "Hydrocephalus",
      ],
      leSaviezVous:
        "The brain contains no pain receptors at all. Brain surgery can be performed on an awake patient, who talks and moves while the surgeon maps the areas to spare.",
      hotspots: [
        {
          id: "frontal",
          label: "Frontal lobe",
          detail: "Planning, motor speech, voluntary command",
        },
        {
          id: "parietal",
          label: "Parietal lobe",
          detail: "Somatic sensation and spatial representation",
        },
        {
          id: "temporal",
          label: "Temporal lobe",
          detail: "Hearing, memory, language comprehension",
        },
        {
          id: "cerebellum",
          label: "Cerebellum",
          detail: "Coordination and fine-tuning of movement, balance",
        },
      ],
    },
  },

  // ---------------------------------------------------------------- poumons
  {
    id: "lungs",
    name: "Poumons",
    latin: "Pulmones",
    english: "Lungs",
    system: "Appareil respiratoire",
    model: "/models/lungs.glb",
    icon: "☁",
    accent: "#dd8f8b",
    illustrated: true,
    description:
      "Deux organes spongieux logés dans la cage thoracique, séparés par le médiastin. Le poumon droit compte trois lobes, le gauche seulement deux — l'incisure cardiaque lui cède la place occupée par le cœur.",
    poetic: "Soixante-dix mètres carrés d'échange, pliés dans la poitrine",
    taille: "Environ 25 cm de haut ; surface d'échange alvéolaire de l'ordre de 70 m²",
    poids: "Environ 1 kg pour les deux, très variable selon le contenu sanguin",
    situation:
      "Cavités pleurales, de part et d'autre du médiastin, reposant sur les coupoles diaphragmatiques",
    fonction: "Hématose : oxygénation du sang et élimination du dioxyde de carbone",
    vascularisation:
      "Double circulation : les artères pulmonaires apportent le sang à oxygéner, les artères bronchiques, issues de l'aorte, nourrissent le tissu pulmonaire lui-même",
    innervation:
      "Plexus pulmonaire : le vague (X) est bronchoconstricteur et sécrétoire, le sympathique bronchodilatateur",
    drainage:
      "Veines pulmonaires vers l'atrium gauche ; lymphatiques vers les nœuds hilaires puis trachéobronchiques",
    histologie:
      "Environ 300 millions d'alvéoles tapissées de pneumocytes de type I, très aplatis, où se fait la diffusion. Les pneumocytes de type II sécrètent le surfactant, qui abaisse la tension superficielle et empêche l'affaissement des alvéoles à l'expiration.",
    physiologie: [
      "L'inspiration est active : la contraction du diaphragme et des intercostaux externes crée une dépression intrathoracique.",
      "L'expiration de repos est passive — c'est le simple retour élastique du poumon et de la paroi.",
      "Les échanges se font par diffusion passive selon les gradients de pression partielle, sur une barrière d'environ un demi-micromètre d'épaisseur.",
      "La vasoconstriction hypoxique redirige le sang des territoires mal ventilés vers les zones ventilées : c'est un appariement local ventilation/perfusion.",
      "L'escalator mucociliaire remonte en permanence mucus et particules vers le pharynx ; le tabac le paralyse.",
    ],
    rapports:
      "Le hile pulmonaire livre passage à la bronche principale, aux artères et veines pulmonaires. Le poumon droit répond à la veine cave supérieure et à la crosse de la veine azygos ; le gauche à la crosse aortique et à l'artère sous-clavière gauche.",
    clinique: [
      {
        titre: "Pourquoi les corps étrangers vont à droite",
        texte:
          "La bronche principale droite est plus large, plus courte et plus verticale que la gauche. Un corps étranger inhalé ou une inhalation de liquide gastrique se dirigent donc préférentiellement vers le poumon droit, en particulier vers son lobe inférieur chez le sujet couché.",
        source: "moore",
      },
      {
        titre: "Récessus costodiaphragmatique",
        texte:
          "La plèvre descend plus bas que le bord inférieur du poumon, ménageant un récessus où s'accumulent les épanchements. C'est là que se ponctionne un épanchement pleural, et c'est ce qui explique que la matité de percussion précède l'abolition du murmure vésiculaire.",
        source: "gray",
      },
    ],
    ancrageNiger: {
      titre: "Tuberculose pulmonaire",
      texte:
        "La tuberculose reste l'une des premières causes de mortalité infectieuse dans le monde, et l'Afrique en concentre une part majeure. L'atteinte prédomine aux sommets pulmonaires, mieux ventilés mais moins perfusés, où la pression partielle en oxygène élevée favorise le bacille aérobie. Toute toux de plus de deux semaines impose d'y penser.",
      source: "oms-tuberculose",
    },
    pathologies: [
      "Tuberculose pulmonaire",
      "Pneumonies communautaires",
      "Asthme",
      "Broncho-pneumopathie chronique obstructive",
      "Épanchement pleural",
      "Pneumothorax",
      "Bronchiolite du nourrisson",
    ],
    leSaviezVous:
      "Déplié, l'ensemble des alvéoles couvrirait environ la surface d'un demi-court de tennis — le tout tenant dans un volume comparable à celui de deux ballons de football.",
    vernaculaire: { hausa: "huhu" },
    sources: ["gray", "moore", "guyton", "junqueira", "ta", "oms-tuberculose"],
    hotspots: [
      {
        id: "trachea",
        label: "Trachée",
        latin: "Trachea",
        detail: "Conduit aérien maintenu ouvert par des anneaux cartilagineux",
        position: [0, 1.6, 0.2],
        color: "#6393d8",
      },
      {
        id: "right-lung",
        label: "Poumon droit",
        latin: "Pulmo dexter",
        detail: "Trois lobes, séparés par les scissures oblique et horizontale",
        position: [-1.2, 0.1, 0.7],
        color: "#ee7c6a",
      },
      {
        id: "left-lung",
        label: "Poumon gauche",
        latin: "Pulmo sinister",
        detail: "Deux lobes et une incisure cardiaque, qui loge le cœur",
        position: [1.2, 0.1, 0.7],
        color: "#f2a33b",
      },
      {
        id: "bronchus",
        label: "Bronche principale",
        latin: "Bronchus principalis",
        detail: "La droite est plus verticale : les corps étrangers y descendent",
        position: [-0.03, 0.3, 0.35],
        color: "#d89bc4",
      },
      {
        id: "base",
        label: "Base pulmonaire",
        latin: "Basis pulmonis",
        detail: "Repose sur le diaphragme ; siège des épanchements déclives",
        position: [-1.14, -1.2, 1],
        color: "#7fa88a",
      },
    ],
    en: {
      name: "Lungs",
      description:
        "Two spongy organs housed in the rib cage, separated by the mediastinum. The right lung has three lobes, the left only two — the cardiac notch yields the space taken up by the heart.",
      poetic: "Seventy square metres of exchange, folded into the chest",
      taille: "About 25 cm tall; alveolar exchange surface on the order of 70 m²",
      poids: "About 1 kg for both, highly variable with blood content",
      situation:
        "Pleural cavities, on either side of the mediastinum, resting on the diaphragmatic domes",
      fonction: "Gas exchange: oxygenating the blood and removing carbon dioxide",
      vascularisation:
        "Dual circulation: pulmonary arteries bring blood to be oxygenated, bronchial arteries, from the aorta, nourish the lung tissue itself",
      innervation:
        "Pulmonary plexus: the vagus (X) is bronchoconstrictor and secretory, the sympathetic bronchodilator",
      drainage:
        "Pulmonary veins to the left atrium; lymphatics to the hilar then tracheobronchial nodes",
      histologie:
        "About 300 million alveoli lined by very flat type I pneumocytes, where diffusion occurs. Type II pneumocytes secrete surfactant, which lowers surface tension and keeps alveoli from collapsing on expiration.",
      physiologie: [
        "Inspiration is active: contraction of the diaphragm and external intercostals creates negative intrathoracic pressure.",
        "Resting expiration is passive — simply the elastic recoil of the lung and chest wall.",
        "Gas exchange happens by passive diffusion along partial-pressure gradients, across a barrier about half a micrometre thick.",
        "Hypoxic vasoconstriction redirects blood away from poorly ventilated areas toward well-ventilated ones: a local ventilation/perfusion match.",
        "The mucociliary escalator constantly moves mucus and particles up toward the pharynx; tobacco smoke paralyses it.",
      ],
      rapports:
        "The pulmonary hilum gives passage to the main bronchus and the pulmonary arteries and veins. The right lung relates to the superior vena cava and the azygos vein arch; the left to the aortic arch and the left subclavian artery.",
      clinique: [
        {
          titre: "Why foreign bodies go right",
          texte:
            "The right main bronchus is wider, shorter and more vertical than the left. An inhaled foreign body or aspirated gastric contents therefore travel preferentially into the right lung, especially its lower lobe in a supine patient.",
        },
        {
          titre: "Costodiaphragmatic recess",
          texte:
            "The pleura extends lower than the lower border of the lung, forming a recess where effusions collect. This is where a pleural effusion is tapped, and why dullness to percussion precedes the loss of breath sounds.",
        },
      ],
      ancrageNiger: {
        titre: "Pulmonary tuberculosis",
        texte:
          "Tuberculosis remains one of the leading infectious causes of death worldwide, and Africa carries a major share of the burden. Disease predominates in the lung apices, better ventilated but less perfused, where the high partial pressure of oxygen favours the aerobic bacillus. Any cough lasting more than two weeks should raise the suspicion.",
      },
      pathologies: [
        "Pulmonary tuberculosis",
        "Community-acquired pneumonia",
        "Asthma",
        "Chronic obstructive pulmonary disease",
        "Pleural effusion",
        "Pneumothorax",
        "Infant bronchiolitis",
      ],
      leSaviezVous:
        "Unfolded, the alveoli together would cover roughly half a tennis court — all packed into a volume comparable to two footballs.",
      hotspots: [
        { id: "trachea", label: "Trachea", detail: "Airway kept open by cartilage rings" },
        {
          id: "right-lung",
          label: "Right lung",
          detail: "Three lobes, separated by the oblique and horizontal fissures",
        },
        {
          id: "left-lung",
          label: "Left lung",
          detail: "Two lobes and a cardiac notch, which houses the heart",
        },
        {
          id: "bronchus",
          label: "Main bronchus",
          detail: "The right one is more vertical: foreign bodies travel down it",
        },
        {
          id: "base",
          label: "Lung base",
          detail: "Rests on the diaphragm; site of gravity-dependent effusions",
        },
      ],
    },
  },

  // ------------------------------------------------------------------- foie
  {
    id: "liver",
    name: "Foie",
    latin: "Hepar",
    english: "Liver",
    system: "Appareil digestif",
    model: "/models/liver.glb",
    icon: "◗",
    accent: "#b86858",
    illustrated: true,
    description:
      "Plus volumineuse glande de l'organisme, le foie occupe l'hypochondre droit sous la coupole diaphragmatique. Il reçoit tout le sang veineux du tube digestif avant que celui-ci ne rejoigne la circulation générale : rien de ce qui est absorbé n'échappe à son contrôle.",
    poetic: "Le filtre obligatoire de tout ce que vous mangez",
    taille: "Environ 25 cm de large sur 15 cm de haut",
    poids: "1 400 à 1 600 g chez l'adulte",
    situation:
      "Hypochondre droit et épigastre, sous le diaphragme, normalement non palpable sous le rebord costal",
    fonction: "Métabolisme, détoxification, synthèse protéique, sécrétion de la bile",
    vascularisation:
      "Double apport : la veine porte hépatique fournit environ 75 % du débit (sang riche en nutriments), l'artère hépatique propre les 25 % restants (sang oxygéné)",
    innervation: "Plexus hépatique : sympathique cœliaque et fibres vagales",
    drainage:
      "Veines hépatiques vers la veine cave inférieure ; lymphatiques vers les nœuds hépatiques et cœliaques",
    histologie:
      "Lobules hépatiques hexagonaux, centrés sur une veine centrolobulaire, bordés d'espaces portes contenant chacun une triade : rameau de la veine porte, rameau de l'artère hépatique, canalicule biliaire. Les hépatocytes sont disposés en travées séparées par des sinusoïdes où siègent les cellules de Kupffer, macrophages résidents.",
    physiologie: [
      "Effet de premier passage : tout médicament pris par voie orale traverse le foie avant d'atteindre la circulation générale, ce qui peut en détruire l'essentiel avant qu'il n'agisse.",
      "Synthèse de l'albumine, des facteurs de coagulation et des protéines de transport — d'où l'œdème et les troubles hémorragiques de l'insuffisance hépatique.",
      "Sécrétion de 500 à 1 000 mL de bile par jour, émulsifiant les graisses et permettant l'absorption des vitamines liposolubles.",
      "Stockage du glycogène, du fer, du cuivre et des vitamines A, D et B12.",
      "Cycle de l'urée : conversion de l'ammoniac neurotoxique en urée éliminable par le rein. Son échec donne l'encéphalopathie hépatique.",
    ],
    rapports:
      "En haut le diaphragme, qui l'attache par le ligament falciforme et les ligaments coronaires. En bas et en arrière : vésicule biliaire, rein droit, angle colique droit, estomac. Sa face postérieure est creusée par la veine cave inférieure.",
    clinique: [
      {
        titre: "Anastomoses porto-caves",
        texte:
          "Quand la pression portale s'élève, le sang emprunte des voies de dérivation vers la circulation cave : varices œsophagiennes, veines péri-ombilicales, veines rectales. La rupture des varices œsophagiennes est la complication hémorragique la plus redoutée de la cirrhose.",
        source: "moore",
      },
      {
        titre: "Segmentation de Couinaud",
        texte:
          "Le foie se divise en huit segments, chacun possédant son propre pédicule portal et son drainage veineux. Cette segmentation, invisible en surface, est ce qui rend possible l'hépatectomie partielle réglée et la transplantation à donneur vivant.",
        source: "gray",
      },
    ],
    ancrageNiger: {
      titre: "Hépatite B",
      texte:
        "L'infection chronique par le virus de l'hépatite B est fortement endémique en Afrique de l'Ouest, où la transmission survient surtout dans la petite enfance — période où le risque de passage à la chronicité est le plus élevé. Elle est la première cause de cirrhose et de carcinome hépatocellulaire dans la région. La vaccination à la naissance est l'intervention la plus efficace.",
      source: "oms-hepatiteb",
    },
    pathologies: [
      "Hépatite B chronique",
      "Cirrhose",
      "Carcinome hépatocellulaire",
      "Abcès amibien du foie",
      "Stéatose hépatique",
      "Ictère par obstruction biliaire",
      "Bilharziose hépatosplénique",
    ],
    leSaviezVous:
      "Le foie est le seul organe interne capable de régénérer une masse fonctionnelle après résection : c'est ce qui autorise le don de foie entre vivants, le donneur et le receveur reconstituant chacun un volume utile.",
    vernaculaire: { hausa: "hanta" },
    sources: ["gray", "moore", "guyton", "junqueira", "ta", "oms-hepatiteb"],
    hotspots: [
      {
        id: "right-lobe",
        label: "Lobe droit",
        latin: "Lobus hepatis dexter",
        detail: "Le plus volumineux ; contient les segments V à VIII",
        position: [-0.75, 0.35, 0.75],
        color: "#ee7c6a",
      },
      {
        id: "left-lobe",
        label: "Lobe gauche",
        latin: "Lobus hepatis sinister",
        detail: "Séparé du droit par le ligament falciforme",
        position: [0.85, 0.25, 0.75],
        color: "#f2a33b",
      },
      {
        id: "portal",
        label: "Veine porte",
        latin: "Vena portae hepatis",
        detail: "Apporte le sang du tube digestif — 75 % du débit hépatique",
        position: [0.1, -0.3, 0.82],
        color: "#6393d8",
      },
    ],
    en: {
      name: "Liver",
      description:
        "The body's largest gland, the liver occupies the right hypochondrium under the diaphragmatic dome. It receives all the venous blood from the digestive tract before it joins the general circulation: nothing absorbed escapes its control.",
      poetic: "The mandatory filter for everything you eat",
      taille: "About 25 cm wide by 15 cm tall",
      poids: "1,400 to 1,600 g in the adult",
      situation:
        "Right hypochondrium and epigastrium, under the diaphragm, normally not palpable below the costal margin",
      fonction: "Metabolism, detoxification, protein synthesis, bile secretion",
      vascularisation:
        "Dual supply: the hepatic portal vein provides about 75% of flow (nutrient-rich blood), the proper hepatic artery the remaining 25% (oxygenated blood)",
      innervation: "Hepatic plexus: coeliac sympathetic and vagal fibres",
      drainage:
        "Hepatic veins to the inferior vena cava; lymphatics to the hepatic and coeliac nodes",
      histologie:
        "Hexagonal hepatic lobules centred on a central vein, bordered by portal spaces each containing a triad: a branch of the portal vein, a branch of the hepatic artery, a bile ductule. Hepatocytes are arranged in plates separated by sinusoids housing Kupffer cells, resident macrophages.",
      physiologie: [
        "First-pass effect: any drug taken orally crosses the liver before reaching the general circulation, which can destroy most of it before it acts.",
        "Synthesis of albumin, clotting factors and transport proteins — hence the oedema and bleeding disorders of liver failure.",
        "Secretion of 500 to 1,000 mL of bile per day, emulsifying fats and enabling the absorption of fat-soluble vitamins.",
        "Storage of glycogen, iron, copper and vitamins A, D and B12.",
        "The urea cycle: converting neurotoxic ammonia into urea that the kidney can excrete. Its failure produces hepatic encephalopathy.",
      ],
      rapports:
        "Above, the diaphragm, to which it attaches by the falciform and coronary ligaments. Below and behind: gallbladder, right kidney, right colic flexure, stomach. Its posterior surface is grooved by the inferior vena cava.",
      clinique: [
        {
          titre: "Portosystemic anastomoses",
          texte:
            "When portal pressure rises, blood takes detour routes into the caval circulation: oesophageal varices, periumbilical veins, rectal veins. Rupture of oesophageal varices is the most feared haemorrhagic complication of cirrhosis.",
        },
        {
          titre: "Couinaud segmentation",
          texte:
            "The liver divides into eight segments, each with its own portal pedicle and venous drainage. This segmentation, invisible from the surface, is what makes planned partial hepatectomy and living-donor transplantation possible.",
        },
      ],
      ancrageNiger: {
        titre: "Hepatitis B",
        texte:
          "Chronic hepatitis B infection is strongly endemic in West Africa, where transmission mostly occurs in early childhood — the period when the risk of progressing to chronic infection is highest. It is the leading cause of cirrhosis and hepatocellular carcinoma in the region. Vaccination at birth is the most effective intervention.",
      },
      pathologies: [
        "Chronic hepatitis B",
        "Cirrhosis",
        "Hepatocellular carcinoma",
        "Amoebic liver abscess",
        "Fatty liver disease",
        "Obstructive jaundice",
        "Hepatosplenic schistosomiasis",
      ],
      leSaviezVous:
        "The liver is the only internal organ able to regenerate a functional mass after resection: this is what allows living-donor liver transplantation, with both donor and recipient rebuilding a working volume.",
      hotspots: [
        {
          id: "right-lobe",
          label: "Right lobe",
          detail: "The largest; contains segments V to VIII",
        },
        {
          id: "left-lobe",
          label: "Left lobe",
          detail: "Separated from the right by the falciform ligament",
        },
        {
          id: "portal",
          label: "Portal vein",
          detail: "Brings blood from the digestive tract — 75% of hepatic flow",
        },
      ],
    },
  },

  // ------------------------------------------------------------------ reins
  {
    id: "kidneys",
    name: "Reins",
    latin: "Renes",
    english: "Kidneys",
    system: "Appareil urinaire",
    model: "/models/kidneys.glb",
    icon: "❍",
    accent: "#c96963",
    illustrated: true,
    description:
      "Deux organes rétropéritonéaux en forme de haricot, situés de part et d'autre du rachis. Ils filtrent environ 180 litres de plasma par jour pour n'en excréter qu'un à deux litres d'urine : l'essentiel du travail rénal est de la réabsorption, pas de l'élimination.",
    poetic: "180 litres filtrés, un litre et demi rendu",
    taille: "Environ 11 cm de haut, 6 cm de large, 3 cm d'épaisseur",
    poids: "120 à 170 g chacun",
    situation:
      "Rétropéritoine, entre T12 et L3. Le rein droit est plus bas que le gauche, refoulé par le foie",
    fonction:
      "Filtration du plasma, équilibre hydro-électrolytique et acido-basique, régulation de la pression artérielle",
    vascularisation:
      "Artères rénales, branches directes de l'aorte abdominale. Elles reçoivent à elles seules près de 20 % du débit cardiaque",
    innervation: "Plexus rénal, issu du plexus cœliaque — essentiellement sympathique vasomoteur",
    drainage:
      "Veines rénales vers la veine cave inférieure ; la veine rénale gauche, plus longue, croise en avant de l'aorte sous l'artère mésentérique supérieure",
    histologie:
      "Environ un million de néphrons par rein. Chaque néphron comprend un corpuscule rénal (glomérule et capsule de Bowman) et un tubule : tube contourné proximal, anse du néphron, tube contourné distal. Le cortex contient les glomérules, la médulla les anses et les tubes collecteurs.",
    physiologie: [
      "Filtration glomérulaire : environ 125 mL par minute, poussée par la pression hydrostatique des capillaires glomérulaires.",
      "Le tube contourné proximal réabsorbe d'emblée les deux tiers de l'eau et du sodium, la totalité du glucose et des acides aminés.",
      "L'anse du néphron établit un gradient osmotique médullaire à contre-courant : c'est ce gradient qui permet de concentrer les urines.",
      "L'aldostérone agit sur le tube distal et collecteur pour retenir le sodium ; l'hormone antidiurétique y rend l'épithélium perméable à l'eau.",
      "Le rein sécrète la rénine (pression artérielle), l'érythropoïétine (production de globules rouges) et active la vitamine D — d'où l'anémie et l'ostéodystrophie de l'insuffisance rénale chronique.",
    ],
    rapports:
      "En avant à droite : foie, deuxième portion du duodénum, angle colique droit. À gauche : estomac, rate, pancréas, angle colique gauche. En arrière : diaphragme, muscle psoas, muscle carré des lombes, douzième côte. La glande surrénale coiffe chaque pôle supérieur.",
    clinique: [
      {
        titre: "Points de rétrécissement urétéral",
        texte:
          "L'uretère se rétrécit en trois points : à la jonction pyélo-urétérale, au croisement des vaisseaux iliaques, et à sa traversée de la paroi vésicale. Un calcul s'y bloque préférentiellement, et la douleur de colique néphrétique irradie selon le niveau atteint.",
        source: "moore",
      },
      {
        titre: "Contact rénal postérieur",
        texte:
          "Le pôle supérieur du rein répond à la douzième côte et au récessus pleural. Une ponction lombaire rénale trop haute expose donc à un pneumothorax, et un traumatisme de la loge lombaire peut associer lésion rénale et hémothorax.",
        source: "gray",
      },
    ],
    ancrageNiger: {
      titre: "Bilharziose urinaire",
      texte:
        "Schistosoma haematobium est endémique au Niger, notamment autour des points d'eau douce où se fait la contamination. Les œufs se déposent dans la paroi vésicale et les uretères terminaux, provoquant une hématurie terminale — longtemps banalisée comme une puberté masculine normale dans certaines régions — puis une fibrose obstructive et un risque de carcinome vésical.",
      source: "oms-schistosomiase",
    },
    pathologies: [
      "Bilharziose urinaire",
      "Néphropathie drépanocytaire",
      "Insuffisance rénale aiguë du paludisme grave",
      "Glomérulonéphrite post-streptococcique",
      "Lithiase urinaire",
      "Pyélonéphrite",
      "Néphropathie hypertensive",
    ],
    leSaviezVous:
      "Le rein filtre l'équivalent du volume plasmatique total environ soixante fois par jour. Sans la réabsorption tubulaire, un adulte serait déshydraté en moins de trente minutes.",
    vernaculaire: { hausa: "ƙoda" },
    sources: ["gray", "moore", "guyton", "junqueira", "ta", "oms-schistosomiase", "oms-paludisme"],
    hotspots: [
      {
        id: "cortex",
        label: "Cortex rénal",
        latin: "Cortex renalis",
        detail: "Contient les glomérules — c'est là que commence la filtration",
        position: [-0.9, 0.55, 0.7],
        color: "#ee7c6a",
      },
      {
        id: "medulla",
        label: "Médulla rénale",
        latin: "Medulla renalis",
        detail: "Pyramides et anses du néphron : la concentration des urines",
        position: [0.85, 0.2, 0.7],
        color: "#f2a33b",
      },
      {
        id: "ureter",
        label: "Uretère",
        latin: "Ureter",
        detail: "Conduit l'urine vers la vessie par ondes péristaltiques",
        position: [0.4, -1.1, 0.5],
        color: "#6393d8",
      },
    ],
    en: {
      name: "Kidneys",
      description:
        "Two bean-shaped retroperitoneal organs, one on each side of the spine. They filter about 180 litres of plasma a day to excrete only one to two litres of urine: most of the kidney's work is reabsorption, not elimination.",
      poetic: "180 litres filtered, a litre and a half returned",
      taille: "About 11 cm tall, 6 cm wide, 3 cm thick",
      poids: "120 to 170 g each",
      situation:
        "Retroperitoneum, between T12 and L3. The right kidney sits lower than the left, pushed down by the liver",
      fonction:
        "Filtration of plasma, fluid, electrolyte and acid-base balance, blood pressure regulation",
      vascularisation:
        "Renal arteries, direct branches of the abdominal aorta. They alone receive nearly 20% of cardiac output",
      innervation: "Renal plexus, from the coeliac plexus — mainly sympathetic vasomotor",
      drainage:
        "Renal veins to the inferior vena cava; the longer left renal vein crosses in front of the aorta below the superior mesenteric artery",
      histologie:
        "About one million nephrons per kidney. Each nephron comprises a renal corpuscle (glomerulus and Bowman's capsule) and a tubule: proximal convoluted tubule, loop of the nephron, distal convoluted tubule. The cortex holds the glomeruli, the medulla the loops and collecting ducts.",
      physiologie: [
        "Glomerular filtration: about 125 mL per minute, driven by the hydrostatic pressure of the glomerular capillaries.",
        "The proximal convoluted tubule reabsorbs two-thirds of the water and sodium outright, and all of the glucose and amino acids.",
        "The loop of the nephron sets up a countercurrent medullary osmotic gradient: this gradient is what allows the urine to be concentrated.",
        "Aldosterone acts on the distal and collecting tubule to retain sodium; antidiuretic hormone there makes the epithelium permeable to water.",
        "The kidney secretes renin (blood pressure), erythropoietin (red cell production) and activates vitamin D — hence the anaemia and osteodystrophy of chronic kidney disease.",
      ],
      rapports:
        "Anteriorly on the right: liver, second part of the duodenum, right colic flexure. On the left: stomach, spleen, pancreas, left colic flexure. Posteriorly: diaphragm, psoas major, quadratus lumborum, twelfth rib. An adrenal gland caps each upper pole.",
      clinique: [
        {
          titre: "Ureteral narrowings",
          texte:
            "The ureter narrows at three points: at the pelvi-ureteric junction, where it crosses the iliac vessels, and where it passes through the bladder wall. A stone lodges preferentially at these sites, and renal colic pain radiates according to the level reached.",
        },
        {
          titre: "Posterior renal relations",
          texte:
            "The upper pole of the kidney relates to the twelfth rib and the pleural recess. A renal puncture placed too high therefore risks a pneumothorax, and trauma to the loin can combine renal injury with haemothorax.",
        },
      ],
      ancrageNiger: {
        titre: "Urinary schistosomiasis",
        texte:
          "Schistosoma haematobium is endemic in Niger, especially around freshwater points where infection occurs. Eggs lodge in the bladder wall and terminal ureters, causing terminal haematuria — long dismissed as a normal sign of male puberty in some regions — followed by obstructive fibrosis and a risk of bladder carcinoma.",
      },
      pathologies: [
        "Urinary schistosomiasis",
        "Sickle cell nephropathy",
        "Acute kidney injury from severe malaria",
        "Post-streptococcal glomerulonephritis",
        "Urinary lithiasis",
        "Pyelonephritis",
        "Hypertensive nephropathy",
      ],
      leSaviezVous:
        "The kidney filters the equivalent of the entire plasma volume about sixty times a day. Without tubular reabsorption, an adult would be dehydrated in under thirty minutes.",
      hotspots: [
        {
          id: "cortex",
          label: "Renal cortex",
          detail: "Contains the glomeruli — where filtration begins",
        },
        {
          id: "medulla",
          label: "Renal medulla",
          detail: "Pyramids and nephron loops: where urine gets concentrated",
        },
        {
          id: "ureter",
          label: "Ureter",
          detail: "Carries urine to the bladder by peristaltic waves",
        },
      ],
    },
  },

  // -------------------------------------------------------------------- œil
  {
    id: "eyeball",
    name: "Œil",
    latin: "Oculus",
    english: "Eye",
    system: "Organes des sens",
    model: "/models/eyeball.glb",
    icon: "◉",
    accent: "#7294b9",
    illustrated: true,
    description:
      "Globe d'environ 24 mm logé dans l'orbite osseuse, l'œil convertit la lumière en influx nerveux. La cornée assure les deux tiers de la puissance réfractive de l'œil ; le cristallin n'apporte que le complément, mais lui seul est ajustable.",
    poetic: "Vingt-quatre millimètres entre le monde et la pensée",
    taille: "Environ 24 mm de diamètre antéropostérieur",
    poids: "Environ 7 g",
    situation: "Cavité orbitaire, entouré de graisse orbitaire et des six muscles oculomoteurs",
    fonction: "Transduction du signal lumineux en influx nerveux ; formation de l'image rétinienne",
    vascularisation:
      "Artère ophtalmique, branche de la carotide interne. L'artère centrale de la rétine est terminale : son occlusion entraîne une cécité brutale et définitive",
    innervation:
      "Nerf optique (II) pour la vision ; nerfs oculomoteur (III), trochléaire (IV) et abducens (VI) pour la motricité ; branche ophtalmique du trijumeau (V1) pour la sensibilité cornéenne",
    drainage: "Veines ophtalmiques vers le sinus caverneux",
    histologie:
      "Trois tuniques : sclère et cornée en dehors, uvée (choroïde, corps ciliaire, iris) au milieu, rétine en dedans. La rétine compte dix couches ; les cônes, concentrés dans la fovéa, assurent la vision fine et colorée, les bâtonnets la vision périphérique et nocturne.",
    physiologie: [
      "La cornée, avasculaire et transparente, est nourrie par l'humeur aqueuse et l'oxygène atmosphérique.",
      "L'accommodation : la contraction du muscle ciliaire relâche la zonule, le cristallin se bombe et la vision de près devient nette.",
      "L'humeur aqueuse est sécrétée par les procès ciliaires et résorbée par l'angle iridocornéen. Un obstacle à cette résorption élève la pression intraoculaire : c'est le glaucome.",
      "La phototransduction repose sur le rétinal, dérivé de la vitamine A. Sa carence altère d'abord la vision nocturne.",
      "La papille optique ne contient aucun photorécepteur : c'est la tache aveugle, que le cerveau comble sans que nous en ayons conscience.",
    ],
    rapports:
      "L'orbite est un cône osseux dont le plancher, très mince, se fracture facilement (fracture par éclatement). L'apex orbitaire livre passage au nerf optique par le canal optique, et aux nerfs oculomoteurs par la fissure orbitaire supérieure.",
    clinique: [
      {
        titre: "Réflexe photomoteur",
        texte:
          "La voie afférente emprunte le nerf optique, la voie efférente le nerf oculomoteur par les fibres parasympathiques. L'éclairement d'un œil contracte les deux pupilles : dissocier réponse directe et consensuelle localise la lésion sur l'une ou l'autre voie.",
        source: "moore",
      },
      {
        titre: "Cornée et sensibilité",
        texte:
          "La cornée est le tissu le plus densément innervé du corps, par la branche ophtalmique du trijumeau. C'est ce qui rend une simple érosion cornéenne extrêmement douloureuse, et ce qui fonde le réflexe cornéen exploré dans l'examen du tronc cérébral.",
        source: "gray",
      },
    ],
    ancrageNiger: {
      titre: "Trachome et carence en vitamine A",
      texte:
        "Le trachome, infection à Chlamydia trachomatis favorisée par le manque d'eau et la promiscuité, reste une cause majeure de cécité évitable au Sahel : les cicatrices conjonctivales retournent la paupière et les cils raclent la cornée. La carence en vitamine A, elle, provoque héméralopie puis xérophtalmie et peut aboutir à une perte de vision irréversible chez l'enfant.",
      source: "oms-trachome",
    },
    pathologies: [
      "Trachome",
      "Xérophtalmie par carence en vitamine A",
      "Cataracte",
      "Glaucome",
      "Conjonctivites bactériennes",
      "Rétinopathie diabétique",
      "Traumatismes oculaires",
    ],
    leSaviezVous:
      "L'image projetée sur la rétine est inversée et le champ visuel de chaque œil est traité par les deux hémisphères. Ce que nous appelons « voir » est presque entièrement une reconstruction cérébrale.",
    vernaculaire: { hausa: "ido" },
    sources: ["gray", "moore", "guyton", "junqueira", "ta", "oms-trachome", "oms-vitaminea"],
    hotspots: [
      {
        id: "cornea",
        label: "Cornée",
        latin: "Cornea",
        detail: "Transparente et avasculaire : les deux tiers de la réfraction",
        position: [-0.94, 0.05, 1.47],
        color: "#6393d8",
      },
      {
        id: "iris",
        label: "Iris",
        latin: "Iris",
        detail: "Diaphragme musculaire qui règle la quantité de lumière admise",
        position: [-1.22, -0.53, 1.15],
        color: "#f2a33b",
      },
      {
        id: "optic",
        label: "Nerf optique",
        latin: "Nervus opticus",
        detail: "Prolongement du système nerveux central, entouré de méninges",
        position: [1.61, -0.18, 0.54],
        color: "#d89bc4",
      },
    ],
    en: {
      name: "Eye",
      description:
        "A globe about 24 mm across, housed in the bony orbit, the eye converts light into nerve impulses. The cornea provides two-thirds of the eye's refractive power; the lens supplies only the remainder, but it alone is adjustable.",
      poetic: "Twenty-four millimetres between the world and thought",
      taille: "About 24 mm anteroposterior diameter",
      poids: "About 7 g",
      situation: "Orbital cavity, surrounded by orbital fat and the six extraocular muscles",
      fonction: "Transduces light into nerve impulses; forms the retinal image",
      vascularisation:
        "Ophthalmic artery, a branch of the internal carotid. The central retinal artery is an end artery: its occlusion causes sudden, permanent blindness",
      innervation:
        "Optic nerve (II) for vision; oculomotor (III), trochlear (IV) and abducens (VI) nerves for motility; ophthalmic branch of the trigeminal (V1) for corneal sensation",
      drainage: "Ophthalmic veins to the cavernous sinus",
      histologie:
        "Three coats: sclera and cornea outermost, uvea (choroid, ciliary body, iris) in the middle, retina innermost. The retina has ten layers; cones, concentrated in the fovea, provide fine, colour vision, rods peripheral and night vision.",
      physiologie: [
        "The cornea, avascular and transparent, is nourished by the aqueous humour and atmospheric oxygen.",
        "Accommodation: contraction of the ciliary muscle relaxes the zonule, the lens bulges, and near vision comes into focus.",
        "Aqueous humour is secreted by the ciliary processes and reabsorbed at the iridocorneal angle. An obstacle to this reabsorption raises intraocular pressure: glaucoma.",
        "Phototransduction relies on retinal, derived from vitamin A. Its deficiency impairs night vision first.",
        "The optic disc contains no photoreceptors: it is the blind spot, which the brain fills in without our awareness.",
      ],
      rapports:
        "The orbit is a bony cone whose very thin floor fractures easily (blow-out fracture). The orbital apex gives passage to the optic nerve through the optic canal, and to the oculomotor nerves through the superior orbital fissure.",
      clinique: [
        {
          titre: "Pupillary light reflex",
          texte:
            "The afferent pathway runs through the optic nerve, the efferent pathway through the oculomotor nerve's parasympathetic fibres. Lighting one eye constricts both pupils: separating the direct from the consensual response localises the lesion to one pathway or the other.",
        },
        {
          titre: "Cornea and sensitivity",
          texte:
            "The cornea is the most densely innervated tissue in the body, via the ophthalmic branch of the trigeminal nerve. This is what makes a simple corneal abrasion extremely painful, and the basis of the corneal reflex tested in brainstem examination.",
        },
      ],
      ancrageNiger: {
        titre: "Trachoma and vitamin A deficiency",
        texte:
          "Trachoma, an infection with Chlamydia trachomatis favoured by scarce water and crowding, remains a major cause of preventable blindness in the Sahel: conjunctival scarring turns the eyelid inward and the lashes scrape the cornea. Vitamin A deficiency, for its part, causes night blindness then xerophthalmia and can lead to irreversible vision loss in children.",
      },
      pathologies: [
        "Trachoma",
        "Xerophthalmia from vitamin A deficiency",
        "Cataract",
        "Glaucoma",
        "Bacterial conjunctivitis",
        "Diabetic retinopathy",
        "Eye trauma",
      ],
      leSaviezVous:
        'The image projected on the retina is inverted, and the visual field of each eye is processed by both hemispheres. What we call "seeing" is almost entirely a construction by the brain.',
      hotspots: [
        {
          id: "cornea",
          label: "Cornea",
          detail: "Transparent and avascular: two-thirds of refraction",
        },
        {
          id: "iris",
          label: "Iris",
          detail: "Muscular diaphragm that adjusts how much light gets in",
        },
        {
          id: "optic",
          label: "Optic nerve",
          detail: "An extension of the central nervous system, wrapped in meninges",
        },
      ],
    },
  },

  // --------------------------------------------------------------- intestin
  {
    id: "intestine",
    name: "Intestin",
    latin: "Intestinum",
    english: "Intestine",
    system: "Appareil digestif",
    model: "/models/intestine.glb",
    icon: "∿",
    accent: "#d78b77",
    illustrated: true,
    description:
      "L'intestin grêle absorbe les nutriments, le côlon récupère l'eau et les électrolytes. Sa surface d'absorption est démultipliée par trois niveaux de repliement emboîtés : valvules conniventes, villosités, microvillosités.",
    poetic: "Trois replis emboîtés, deux cents mètres carrés d'absorption",
    taille:
      "Environ 6 m de grêle sur le cadavre — nettement moins chez le vivant du fait du tonus musculaire — et 1,5 m de côlon",
    poids: "Environ 1 kg pour l'ensemble",
    situation: "Cavité abdominale, le grêle mobile sur son mésentère, le côlon encadrant l'abdomen",
    fonction: "Digestion terminale, absorption des nutriments, récupération hydro-électrolytique",
    vascularisation:
      "Tronc cœliaque pour le duodénum proximal, artère mésentérique supérieure pour le grêle et le côlon droit, artère mésentérique inférieure pour le côlon gauche et le rectum",
    innervation:
      "Système nerveux entérique — plexus myentérique et sous-muqueux — modulé par le vague et le sympathique splanchnique",
    drainage:
      "Veines mésentériques vers la veine porte ; lymphatiques par les chylifères vers le canal thoracique",
    histologie:
      "Villosités portant des entérocytes à bordure en brosse, cellules caliciformes sécrétant le mucus, cellules de Paneth au fond des cryptes. Les plaques de Peyer, follicules lymphoïdes de l'iléon, forment la principale barrière immunitaire de la muqueuse.",
    physiologie: [
      "Le duodénum reçoit la bile et le suc pancréatique : c'est là que se fait l'essentiel de la digestion chimique.",
      "Le jéjunum absorbe glucides, acides aminés et lipides ; l'iléon terminal est le seul site d'absorption de la vitamine B12 et des sels biliaires.",
      "Le péristaltisme progresse par ondes ; la segmentation, elle, brasse le contenu sans le faire avancer.",
      "Le côlon réabsorbe environ 1,5 litre d'eau par jour et héberge un microbiote qui synthétise notamment la vitamine K.",
      "Une atteinte de l'iléon terminal donne donc à la fois une anémie mégaloblastique et une malabsorption des graisses.",
    ],
    rapports:
      "Le duodénum est rétropéritonéal et moule la tête du pancréas. Le mésentère, oblique de l'angle duodéno-jéjunal à la fosse iliaque droite, porte les vaisseaux du grêle. L'appendice s'abouche au bas-fond cæcal, à la réunion des trois bandelettes coliques.",
    clinique: [
      {
        titre: "Point de McBurney",
        texte:
          "La base de l'appendice se projette au tiers externe de la ligne joignant l'épine iliaque antéro-supérieure droite à l'ombilic. La douleur appendiculaire débute pourtant en péri-ombilical, par le trajet des afférences viscérales, avant de se localiser quand le péritoine pariétal est atteint.",
        source: "moore",
      },
      {
        titre: "Circulation collatérale de Drummond",
        texte:
          "L'arcade bordante relie les territoires mésentériques supérieur et inférieur le long du côlon. Cette anastomose permet à un territoire de suppléer l'autre, mais l'angle colique gauche reste une zone charnière mal vascularisée, siège privilégié des colites ischémiques.",
        source: "gray",
      },
    ],
    ancrageNiger: {
      titre: "Maladies diarrhéiques et malnutrition",
      texte:
        "Les maladies diarrhéiques figurent parmi les premières causes de mortalité de l'enfant de moins de cinq ans dans le monde, et l'Afrique subsaharienne en porte une part majeure. La perte hydro-électrolytique tue avant l'infection elle-même : c'est pourquoi la réhydratation orale, qui exploite le cotransport sodium-glucose intact de l'entérocyte, a sauvé plus de vies que la plupart des antibiotiques.",
      source: "oms-diarrhee",
    },
    pathologies: [
      "Maladies diarrhéiques aiguës",
      "Parasitoses intestinales",
      "Fièvre typhoïde et perforation iléale",
      "Appendicite aiguë",
      "Occlusion intestinale",
      "Malnutrition et entéropathie environnementale",
      "Amibiase",
    ],
    leSaviezVous:
      "La solution de réhydratation orale fonctionne parce que le transporteur sodium-glucose de l'entérocyte reste actif même quand la muqueuse est agressée : ajouter du sucre au sel ouvre une porte que l'infection n'a pas fermée.",
    vernaculaire: { hausa: "hanji" },
    sources: ["gray", "moore", "guyton", "junqueira", "ta", "oms-diarrhee"],
    hotspots: [
      {
        id: "duodenum",
        label: "Duodénum",
        latin: "Duodenum",
        detail: "Reçoit bile et suc pancréatique ; rétropéritonéal et fixe",
        position: [0.6, 0.8, 0.75],
        color: "#f2a33b",
      },
      {
        id: "jejunum",
        label: "Jéjunum",
        latin: "Jejunum",
        detail: "Villosités hautes et denses : le pic de l'absorption",
        position: [-0.45, 0.1, 0.82],
        color: "#ee7c6a",
      },
      {
        id: "colon",
        label: "Côlon",
        latin: "Colon",
        detail: "Récupère l'eau et les électrolytes ; héberge le microbiote",
        position: [0.75, -0.55, 0.72],
        color: "#6393d8",
      },
    ],
    en: {
      name: "Intestine",
      description:
        "The small intestine absorbs nutrients, the colon recovers water and electrolytes. Its absorptive surface is multiplied by three nested levels of folding: circular folds, villi, microvilli.",
      poetic: "Three nested folds, two hundred square metres of absorption",
      taille:
        "About 6 m of small bowel in the cadaver — markedly less in the living owing to muscular tone — and 1.5 m of colon",
      poids: "About 1 kg altogether",
      situation:
        "Abdominal cavity, the small bowel mobile on its mesentery, the colon framing the abdomen",
      fonction: "Final digestion, nutrient absorption, fluid and electrolyte recovery",
      vascularisation:
        "Coeliac trunk for the proximal duodenum, superior mesenteric artery for the small bowel and right colon, inferior mesenteric artery for the left colon and rectum",
      innervation:
        "Enteric nervous system — myenteric and submucosal plexuses — modulated by the vagus and splanchnic sympathetics",
      drainage: "Mesenteric veins to the portal vein; lymphatics via lacteals to the thoracic duct",
      histologie:
        "Villi bearing brush-border enterocytes, mucus-secreting goblet cells, Paneth cells at the base of the crypts. Peyer's patches, lymphoid follicles of the ileum, form the mucosa's main immune barrier.",
      physiologie: [
        "The duodenum receives bile and pancreatic juice: most of chemical digestion happens here.",
        "The jejunum absorbs carbohydrates, amino acids and lipids; the terminal ileum is the only site that absorbs vitamin B12 and bile salts.",
        "Peristalsis moves as waves; segmentation, by contrast, mixes the contents without advancing them.",
        "The colon reabsorbs about 1.5 litres of water a day and hosts a microbiota that notably synthesises vitamin K.",
        "Disease of the terminal ileum therefore causes both megaloblastic anaemia and fat malabsorption.",
      ],
      rapports:
        "The duodenum is retroperitoneal and moulds around the head of the pancreas. The mesentery, running obliquely from the duodenojejunal flexure to the right iliac fossa, carries the small bowel vessels. The appendix opens at the caecal pole, where the three colic taeniae converge.",
      clinique: [
        {
          titre: "McBurney's point",
          texte:
            "The base of the appendix projects to the outer third of the line joining the right anterior superior iliac spine to the umbilicus. Appendiceal pain nonetheless begins periumbilically, following visceral afferent pathways, before localising once the parietal peritoneum is involved.",
        },
        {
          titre: "Drummond's marginal artery",
          texte:
            "The marginal artery links the superior and inferior mesenteric territories along the colon. This anastomosis lets one territory compensate for the other, but the left colic flexure remains a poorly supplied watershed zone, a preferred site for ischaemic colitis.",
        },
      ],
      ancrageNiger: {
        titre: "Diarrhoeal disease and malnutrition",
        texte:
          "Diarrhoeal disease is among the leading causes of death in children under five worldwide, and sub-Saharan Africa carries a major share of the burden. Fluid and electrolyte loss kills before the infection itself does — which is why oral rehydration, which exploits the enterocyte's intact sodium-glucose cotransport, has saved more lives than most antibiotics.",
      },
      pathologies: [
        "Acute diarrhoeal disease",
        "Intestinal parasitosis",
        "Typhoid fever and ileal perforation",
        "Acute appendicitis",
        "Intestinal obstruction",
        "Malnutrition and environmental enteropathy",
        "Amoebiasis",
      ],
      leSaviezVous:
        "Oral rehydration solution works because the enterocyte's sodium-glucose transporter stays active even when the mucosa is under attack: adding sugar to salt opens a door that the infection has not shut.",
      hotspots: [
        {
          id: "duodenum",
          label: "Duodenum",
          detail: "Receives bile and pancreatic juice; retroperitoneal and fixed",
        },
        {
          id: "jejunum",
          label: "Jejunum",
          detail: "Tall, dense villi: the peak of absorption",
        },
        {
          id: "colon",
          label: "Colon",
          detail: "Recovers water and electrolytes; hosts the microbiota",
        },
      ],
    },
  },

  // --------------------------------------------------------------- pancréas
  {
    id: "pancreas",
    name: "Pancréas",
    latin: "Pancreas",
    english: "Pancreas",
    system: "Appareil digestif et système endocrinien",
    model: "/models/pancreas.glb",
    icon: "⌇",
    accent: "#c69a5e",
    illustrated: true,
    description:
      "Glande mixte allongée en travers de l'abdomen, rétropéritonéale. Sa partie exocrine, largement majoritaire, déverse dans le duodénum les enzymes de la digestion ; sa partie endocrine, moins de 2 % de la masse, règle la glycémie de tout l'organisme.",
    poetic: "Deux pour cent de la glande décident de toute la glycémie",
    taille: "12 à 15 cm de long",
    poids: "70 à 100 g",
    situation:
      "Rétropéritoine, en travers de la région épigastrique, en regard de la première et deuxième vertèbre lombaire",
    fonction: "Sécrétion des enzymes digestives et régulation hormonale de la glycémie",
    vascularisation:
      "Arcades pancréaticoduodénales issues du tronc cœliaque et de l'artère mésentérique supérieure ; artère splénique pour le corps et la queue",
    innervation: "Plexus cœliaque : le vague stimule la sécrétion, le sympathique l'inhibe",
    drainage: "Veine splénique et veine mésentérique supérieure, donc système porte",
    histologie:
      "Acini séreux produisant les proenzymes, drainés par un système canalaire dont les cellules sécrètent des bicarbonates. Dispersés entre eux, les îlots pancréatiques (îlots de Langerhans) contiennent des cellules β (insuline), α (glucagon) et δ (somatostatine).",
    physiologie: [
      "Les enzymes sont sécrétées sous forme inactive : le trypsinogène n'est activé qu'une fois dans le duodénum. C'est la protection contre l'autodigestion.",
      "Les bicarbonates neutralisent le chyme acide venu de l'estomac, sans quoi les enzymes pancréatiques seraient inopérantes.",
      "L'insuline fait entrer le glucose dans les cellules musculaires et adipeuses et bloque la production hépatique de glucose.",
      "Le glucagon fait l'inverse : glycogénolyse puis néoglucogenèse hépatique. Le couple insuline/glucagon maintient la glycémie dans une fourchette étroite.",
      "L'absence d'insuline mobilise les graisses et fabrique des corps cétoniques : c'est l'acidocétose diabétique.",
    ],
    rapports:
      "La tête est encastrée dans le cadre duodénal ; le corps croise en avant l'aorte, la veine cave inférieure et les vaisseaux mésentériques supérieurs ; la queue atteint le hile splénique. Le canal pancréatique rejoint le canal cholédoque à l'ampoule hépatopancréatique.",
    clinique: [
      {
        titre: "Ictère de la tête du pancréas",
        texte:
          "Le canal cholédoque traverse la tête du pancréas avant de s'aboucher au duodénum. Une tumeur céphalique le comprime et provoque un ictère nu, sans douleur ni fièvre — un signe qui doit faire évoquer le diagnostic avant tout autre.",
        source: "moore",
      },
      {
        titre: "Rapports postérieurs et pancréatite",
        texte:
          "Sa situation rétropéritonéale explique la douleur transfixiante, irradiant dans le dos et soulagée par l'antéflexion, ainsi que la diffusion des coulées de nécrose le long des fascias jusqu'aux flancs.",
        source: "gray",
      },
    ],
    ancrageNiger: {
      titre: "Diabète en progression",
      texte:
        "Le nombre de personnes vivant avec un diabète augmente rapidement dans les pays à revenu faible et intermédiaire, sous l'effet de l'urbanisation et des changements alimentaires. Le diagnostic y est souvent tardif, révélé par une complication. Connaître la physiologie de l'îlot pancréatique n'est donc plus une curiosité académique dans la pratique nigérienne.",
      source: "oms-diabete",
    },
    pathologies: [
      "Diabète de type 1 et de type 2",
      "Pancréatite aiguë",
      "Pancréatite chronique",
      "Adénocarcinome du pancréas",
      "Insuffisance pancréatique exocrine",
      "Acidocétose diabétique",
    ],
    leSaviezVous:
      "Le pancréas sécrète chaque jour environ un litre et demi de suc digestif, capable de digérer protéines, lipides et glucides. Le seul tissu qu'il ne digère normalement jamais est lui-même.",
    sources: ["gray", "moore", "guyton", "junqueira", "ta", "oms-diabete"],
    hotspots: [
      {
        id: "head",
        label: "Tête",
        latin: "Caput pancreatis",
        detail: "Encastrée dans le cadre duodénal ; traversée par le cholédoque",
        position: [-1.32, -0.36, 0.55],
        color: "#ee7c6a",
      },
      {
        id: "body",
        label: "Corps",
        latin: "Corpus pancreatis",
        detail: "Croise l'aorte et les vaisseaux mésentériques supérieurs",
        position: [0.05, 0.25, 0.45],
        color: "#f2a33b",
      },
      {
        id: "tail",
        label: "Queue",
        latin: "Cauda pancreatis",
        detail: "Atteint le hile de la rate ; riche en îlots endocrines",
        position: [1.55, 0.3, 0.35],
        color: "#6393d8",
      },
      {
        id: "duct",
        label: "Canal pancréatique",
        latin: "Ductus pancreaticus",
        detail: "Rejoint le cholédoque à l'ampoule hépatopancréatique",
        position: [-0.61, 0.39, 0.5],
        color: "#d89bc4",
      },
    ],
    en: {
      name: "Pancreas",
      description:
        "A mixed gland stretched across the abdomen, retroperitoneal. Its exocrine part, the large majority, releases digestive enzymes into the duodenum; its endocrine part, under 2% of the mass, regulates blood sugar for the whole body.",
      poetic: "Two percent of the gland decides all of blood sugar",
      taille: "12 to 15 cm long",
      poids: "70 to 100 g",
      situation:
        "Retroperitoneum, across the epigastric region, level with the first and second lumbar vertebrae",
      fonction: "Secretion of digestive enzymes and hormonal regulation of blood sugar",
      vascularisation:
        "Pancreaticoduodenal arcades from the coeliac trunk and the superior mesenteric artery; splenic artery for the body and tail",
      innervation: "Coeliac plexus: the vagus stimulates secretion, the sympathetic inhibits it",
      drainage: "Splenic vein and superior mesenteric vein, so the portal system",
      histologie:
        "Serous acini producing proenzymes, drained by a duct system whose cells secrete bicarbonate. Scattered among them, the pancreatic islets (islets of Langerhans) contain β cells (insulin), α cells (glucagon) and δ cells (somatostatin).",
      physiologie: [
        "Enzymes are secreted in inactive form: trypsinogen is only activated once in the duodenum. This is the protection against self-digestion.",
        "Bicarbonate neutralises the acidic chyme from the stomach, without which the pancreatic enzymes would not work.",
        "Insulin drives glucose into muscle and fat cells and blocks the liver's glucose output.",
        "Glucagon does the opposite: glycogenolysis then hepatic gluconeogenesis. The insulin/glucagon pair keeps blood sugar within a narrow range.",
        "The absence of insulin mobilises fat and produces ketone bodies: diabetic ketoacidosis.",
      ],
      rapports:
        "The head sits within the duodenal loop; the body crosses in front of the aorta, the inferior vena cava and the superior mesenteric vessels; the tail reaches the splenic hilum. The pancreatic duct joins the bile duct at the hepatopancreatic ampulla.",
      clinique: [
        {
          titre: "Jaundice from the pancreatic head",
          texte:
            "The bile duct crosses through the head of the pancreas before opening into the duodenum. A tumour of the head compresses it and causes painless jaundice, without fever — a sign that should raise this diagnosis before any other.",
        },
        {
          titre: "Posterior relations and pancreatitis",
          texte:
            "Its retroperitoneal position explains the boring pain that radiates to the back and eases with forward flexion, as well as the spread of necrotic collections along the fascial planes to the flanks.",
        },
      ],
      ancrageNiger: {
        titre: "Rising diabetes",
        texte:
          "The number of people living with diabetes is rising fast in low- and middle-income countries, driven by urbanisation and dietary change. Diagnosis there is often late, revealed by a complication. Knowing the physiology of the pancreatic islet is therefore no longer an academic curiosity in Nigerien practice.",
      },
      pathologies: [
        "Type 1 and type 2 diabetes",
        "Acute pancreatitis",
        "Chronic pancreatitis",
        "Pancreatic adenocarcinoma",
        "Exocrine pancreatic insufficiency",
        "Diabetic ketoacidosis",
      ],
      leSaviezVous:
        "The pancreas secretes about a litre and a half of digestive juice each day, capable of digesting proteins, fats and carbohydrates. The one tissue it normally never digests is itself.",
      hotspots: [
        {
          id: "head",
          label: "Head",
          detail: "Set within the duodenal loop; crossed by the bile duct",
        },
        {
          id: "body",
          label: "Body",
          detail: "Crosses the aorta and the superior mesenteric vessels",
        },
        {
          id: "tail",
          label: "Tail",
          detail: "Reaches the splenic hilum; rich in endocrine islets",
        },
        {
          id: "duct",
          label: "Pancreatic duct",
          detail: "Joins the bile duct at the hepatopancreatic ampulla",
        },
      ],
    },
  },

  // ------------------------------------------------------------------- peau
  {
    id: "skin",
    name: "Peau",
    latin: "Integumentum commune",
    english: "Skin",
    system: "Système tégumentaire",
    model: "/models/skin.glb",
    icon: "▢",
    accent: "#c99277",
    illustrated: true,
    description:
      "Plus vaste organe du corps, la peau est une barrière contre les agressions mécaniques, chimiques et infectieuses, un organe sensoriel et un régulateur thermique. Elle synthétise aussi la vitamine D sous l'effet du rayonnement ultraviolet.",
    poetic: "Deux mètres carrés de frontière vivante",
    taille: "1,5 à 2 m² de surface ; de 0,5 mm aux paupières à 4 mm aux talons",
    poids: "Environ 4 kg sans l'hypoderme",
    situation: "Revêt la totalité de la surface corporelle et se continue par les muqueuses",
    fonction: "Barrière, thermorégulation, sensibilité, synthèse de la vitamine D",
    vascularisation:
      "Plexus dermiques superficiel et profond, alimentés par les artères perforantes. Ce réseau peut recevoir jusqu'à 10 % du débit cardiaque en cas de forte chaleur",
    innervation:
      "Terminaisons libres pour la douleur et la température ; corpuscules de Meissner, Pacini, Merkel et Ruffini pour le tact, la pression et la vibration",
    drainage: "Réseau lymphatique dermique dense, drainant vers les nœuds régionaux",
    histologie:
      "Épiderme, épithélium pavimenteux stratifié kératinisé fait de cinq couches, renouvelé en environ quatre semaines ; derme conjonctif portant vaisseaux, nerfs et annexes ; hypoderme adipeux. Les mélanocytes de la couche basale transfèrent la mélanine aux kératinocytes voisins.",
    physiologie: [
      "La kératinisation transforme progressivement le kératinocyte en cellule cornée anucléée : la barrière est faite de cellules mortes.",
      "La sudation eccrine évacue la chaleur par évaporation — mécanisme majeur sous climat sahélien, et principale source de pertes hydriques insensibles.",
      "La vasodilatation et la vasoconstriction cutanées règlent les échanges thermiques avant même que la sudation ne s'engage.",
      "La mélanine absorbe les ultraviolets et protège l'ADN des kératinocytes ; en contrepartie, elle ralentit la synthèse cutanée de vitamine D.",
      "La cicatrisation passe par l'hémostase, l'inflammation, la prolifération puis le remodelage, sur plusieurs mois.",
    ],
    rapports:
      "Reliée aux plans profonds par le fascia superficiel, sauf aux zones d'adhérence (paume, plante, cuir chevelu). Les lignes de tension cutanée guident les incisions chirurgicales : les suivre donne une cicatrice fine, les croiser une cicatrice élargie.",
    clinique: [
      {
        titre: "Dermatomes",
        texte:
          "Chaque racine nerveuse rachidienne innerve un territoire cutané défini. La topographie d'une éruption de zona ou d'un déficit sensitif permet donc de localiser le niveau lésionnel sans imagerie — un raisonnement de première ligne partout où le scanner n'est pas immédiatement disponible.",
        source: "moore",
      },
      {
        titre: "Règle des neuf",
        texte:
          "L'estimation de la surface brûlée par multiples de 9 % guide le remplissage vasculaire. La profondeur se juge sur l'atteinte du derme : une brûlure superficielle reste douloureuse, une brûlure profonde est anesthésiée parce que les terminaisons nerveuses sont détruites.",
        source: "gray",
      },
    ],
    ancrageNiger: {
      titre: "Ulcères de jambe drépanocytaires",
      texte:
        "La drépanocytose est particulièrement fréquente en Afrique subsaharienne. L'occlusion des petits vaisseaux cutanés par les hématies falciformes provoque des ulcères de jambe chroniques, typiquement péri-malléolaires, très douloureux et lents à cicatriser. Ils rappellent que la peau est un territoire vasculaire terminal comme un autre.",
      source: "oms-drepanocytose",
    },
    pathologies: [
      "Ulcères drépanocytaires",
      "Dermatoses infectieuses bactériennes et fongiques",
      "Gale",
      "Brûlures",
      "Eczéma et dermatite atopique",
      "Albinisme et risque de carcinome cutané",
      "Escarres",
    ],
    leSaviezVous:
      "L'épiderme se renouvelle intégralement en quatre à six semaines : la surface que vous touchez aujourd'hui n'existait pas le mois dernier.",
    vernaculaire: { hausa: "fata" },
    sources: ["gray", "moore", "guyton", "junqueira", "ta", "oms-drepanocytose"],
    hotspots: [
      {
        id: "epidermis",
        label: "Épiderme",
        latin: "Epidermis",
        detail: "Barrière kératinisée, sans vaisseaux, renouvelée en un mois",
        position: [-0.05, 0.88, 1.4],
        color: "#ee7c6a",
      },
      {
        id: "dermis",
        label: "Derme",
        latin: "Dermis",
        detail: "Conjonctif porteur des vaisseaux, nerfs et annexes",
        position: [0.29, 0.05, 1.4],
        color: "#f2a33b",
      },
      {
        id: "hypodermis",
        label: "Hypoderme",
        latin: "Tela subcutanea",
        detail: "Tissu adipeux : isolation thermique et amortissement",
        position: [-0.39, -1.15, 1.4],
        color: "#6393d8",
      },
      {
        id: "follicle",
        label: "Follicule pileux",
        latin: "Folliculus pili",
        detail: "Avec son muscle érecteur et sa glande sébacée",
        position: [0.89, -0.44, 1.4],
        color: "#d89bc4",
      },
    ],
    en: {
      name: "Skin",
      description:
        "The body's largest organ, the skin is a barrier against mechanical, chemical and infectious threats, a sensory organ and a thermal regulator. It also synthesises vitamin D under ultraviolet radiation.",
      poetic: "Two square metres of living frontier",
      taille: "1.5 to 2 m² of surface; from 0.5 mm at the eyelids to 4 mm at the heels",
      poids: "About 4 kg without the hypodermis",
      situation: "Covers the entire body surface and continues into the mucous membranes",
      fonction: "Barrier, thermoregulation, sensation, vitamin D synthesis",
      vascularisation:
        "Superficial and deep dermal plexuses, fed by perforating arteries. This network can receive up to 10% of cardiac output in heavy heat",
      innervation:
        "Free nerve endings for pain and temperature; Meissner, Pacinian, Merkel and Ruffini corpuscles for touch, pressure and vibration",
      drainage: "Dense dermal lymphatic network, draining to regional nodes",
      histologie:
        "Epidermis, a keratinised stratified squamous epithelium of five layers, renewed in about four weeks; connective dermis carrying vessels, nerves and appendages; fatty hypodermis. Melanocytes in the basal layer transfer melanin to neighbouring keratinocytes.",
      physiologie: [
        "Keratinisation gradually turns the keratinocyte into an anucleate horny cell: the barrier is made of dead cells.",
        "Eccrine sweating dissipates heat by evaporation — a major mechanism under Sahelian climate, and the main source of insensible fluid loss.",
        "Cutaneous vasodilation and vasoconstriction regulate heat exchange even before sweating kicks in.",
        "Melanin absorbs ultraviolet light and protects keratinocyte DNA; in exchange, it slows the skin's synthesis of vitamin D.",
        "Wound healing proceeds through haemostasis, inflammation, proliferation then remodelling, over several months.",
      ],
      rapports:
        "Connected to deeper planes by the superficial fascia, except at areas of adherence (palm, sole, scalp). Skin tension lines guide surgical incisions: following them gives a thin scar, crossing them a widened one.",
      clinique: [
        {
          titre: "Dermatomes",
          texte:
            "Each spinal nerve root innervates a defined skin territory. The pattern of a shingles rash or a sensory deficit therefore lets clinicians localise the lesion level without imaging — first-line reasoning wherever a scanner is not immediately available.",
        },
        {
          titre: "The rule of nines",
          texte:
            "Estimating burned surface area in multiples of 9% guides fluid resuscitation. Depth is judged by dermal involvement: a superficial burn stays painful, a deep burn is numb because the nerve endings are destroyed.",
        },
      ],
      ancrageNiger: {
        titre: "Sickle cell leg ulcers",
        texte:
          "Sickle cell disease is especially common in sub-Saharan Africa. Occlusion of small skin vessels by sickled red cells causes chronic leg ulcers, typically peri-malleolar, very painful and slow to heal. They are a reminder that skin is a terminal vascular territory like any other.",
      },
      pathologies: [
        "Sickle cell ulcers",
        "Bacterial and fungal skin infections",
        "Scabies",
        "Burns",
        "Eczema and atopic dermatitis",
        "Albinism and skin cancer risk",
        "Pressure sores",
      ],
      leSaviezVous:
        "The epidermis fully renews itself in four to six weeks: the surface you touch today did not exist last month.",
      hotspots: [
        {
          id: "epidermis",
          label: "Epidermis",
          detail: "Keratinised barrier, avascular, renewed within a month",
        },
        {
          id: "dermis",
          label: "Dermis",
          detail: "Connective tissue carrying vessels, nerves and appendages",
        },
        {
          id: "hypodermis",
          label: "Hypodermis",
          detail: "Fat tissue: thermal insulation and cushioning",
        },
        {
          id: "follicle",
          label: "Hair follicle",
          detail: "With its arrector muscle and sebaceous gland",
        },
      ],
    },
  },
];

export const organById = Object.fromEntries(organs.map((organ) => [organ.id, organ])) as Record<
  Organ["id"],
  Organ
>;
