/* ==========================================================================
   content.js — TOUT le texte du site, en français et en anglais.
   --------------------------------------------------------------------------
   POURQUOI UN SEUL GROS FICHIER DE DONNEES ?
   Le site est une "SPA" (Single Page Application) : le navigateur telecharge
   une seule fois tout le contenu, puis change de page instantanement sans
   jamais recontacter le serveur. Separer le CONTENU (ici) du CODE (app.js)
   permet de corriger une faute de frappe sans jamais toucher a la logique.

   COMMENT MODIFIER LE SITE ?
   99% du temps, c'est ici. Chaque projet a un bloc `fr:` et un bloc `en:`.
   Les cles (`title`, `tagline`, ...) doivent rester identiques dans les deux
   langues, sinon une version aura un trou.

   `export` = ce fichier est un "module" ES : il rend la variable CONTENT
   disponible pour les autres fichiers qui font `import`.
   ========================================================================== */

/* --------------------------------------------------------------------------
   1) INFOS GLOBALES — identite, contact, liens externes.
   Un seul endroit a changer si une adresse evolue.
   -------------------------------------------------------------------------- */
export const SITE = {
  name: 'Marvin Sorhaindo',
  short: 'mrv srd',                       // le petit logo textuel en haut a gauche
  email: 'hello@marvinsrd.com',
  links: {
    linkedin: 'https://www.linkedin.com/in/marvinsorhaindo',
    dribbble: 'https://dribbble.com/Mar200',
    resume: 'https://marvinsrd.com/documents/marvin_resumee.pdf',
    essay: 'https://mar20.notion.site/a996a8ffb4234bb0a1c29682b55abe7b?v=cdd45c6f826b4b7a932d117112be5432&p=2f47efebd8db430ba6c7c9b424fd471c&pm=c'
  }
};

/* --------------------------------------------------------------------------
   2) LIBELLES D'INTERFACE — tous les mots qui ne sont pas du "contenu"
   (boutons, titres de sections, messages du formulaire...).
   Regroupes par langue pour qu'une traduction manquante se voie tout de suite.
   -------------------------------------------------------------------------- */
export const UI = {
  fr: {
    langLabel: 'FR', langSwitchTo: 'Passer en anglais',
    skipToContent: 'Aller au contenu principal',

    // --- Ecran d'accueil (le formulaire du prenom) ---
    gateHi: 'Bonjour !',
    gateQuestion: 'Je suis Marvin.\nComment vous appelez-vous ?',
    gateLabel: 'Mon prénom est',
    gatePlaceholder: 'Votre prénom',
    gateSubmit: 'Enchanté',
    gateSkip: 'Passer cette étape',
    gateError: 'Deux caractères minimum, lettres et tirets uniquement.',
    gateHint: 'Votre prénom reste dans votre navigateur. Aucune base de données, aucun envoi.',

    // --- Navigation ---
    navWork: 'Projets', navSide: 'À côté', navAbout: 'À propos', navContact: 'Contact',
    navHome: 'Accueil', navMenu: 'Menu', navClose: 'Fermer',

    // --- Page d'accueil ---
    // La salutation encadre le prénom : "Bonjour <b>Marie</b>, enchanté !"
    // Deux morceaux séparés plutôt qu'une chaîne à trous, pour que le prénom
    // soit inséré en tant que TEXTE et jamais en tant que HTML (voir app.js).
    helloBefore: 'Bonjour',
    helloAfter: ', enchanté !',
    helloAnon: 'Bonjour, enchanté !',
    workTitle: 'Projets',
    workIntro: 'Trois ans de SaaS santé, plus quelques terrains de jeu. Chaque étude de cas se lit en 30 secondes ; le détail est là si vous voulez creuser.',
    sideTitle: 'À côté',
    sideIntro: 'Ce qui ne rentre pas dans une case « expérience professionnelle », mais qui compte quand même.',
    aboutTitle: 'À propos',

    // --- Cartes de projet ---
    seeProject: 'Voir le projet',
    seeMore: 'Voir le détail',
    readFull: 'Lire le processus complet',

    // --- Page étude de cas ---
    csGist: 'L’essentiel',
    csRole: 'Rôle', csDuration: 'Durée', csTeam: 'Équipe', csTools: 'Outils', csYear: 'Année',
    csProblem: 'Le problème',
    csOutcome: 'Le résultat',
    csProcess: 'Le processus',
    csNext: 'Projet suivant',
    csBack: 'Retour',
    csProgress: 'Progression dans la page',
    csSections: 'Sections de cette page',
    csFigureFR: 'Visuel annoté en français',

    // --- Pied de page ---
    footerSitemap: 'Plan du site',
    footerContact: 'Me contacter',
    footerResume: 'Télécharger mon CV',
    footerNote: 'Codé à la main. Pas de base de données, pas de traqueur.',
    footerRights: 'Tous droits réservés.',

    // --- Divers ---
    loading: 'Chargement',
    notFoundTitle: 'Cette page n’existe pas',
    notFoundBody: 'Le lien est peut-être ancien, ou j’ai cassé quelque chose.',
    notFoundCta: 'Retour à l’accueil',
    draftBadge: 'Brouillon — texte à valider'
  },

  en: {
    langLabel: 'EN', langSwitchTo: 'Switch to French',
    skipToContent: 'Skip to main content',

    gateHi: 'Hey there!',
    gateQuestion: 'I’m Marvin.\nWhat’s your name?',
    gateLabel: 'My name is',
    gatePlaceholder: 'Your first name',
    gateSubmit: 'Nice to meet you',
    gateSkip: 'Skip this',
    gateError: 'Two characters minimum, letters and hyphens only.',
    gateHint: 'Your name stays in your browser. No database, nothing sent anywhere.',

    navWork: 'Work', navSide: 'Side quests', navAbout: 'About', navContact: 'Contact',
    navHome: 'Home', navMenu: 'Menu', navClose: 'Close',

    helloBefore: 'Hey',
    helloAfter: ', nice to meet you!',
    helloAnon: 'Hey, nice to meet you!',
    workTitle: 'Work',
    workIntro: 'Three years of healthcare SaaS, plus a few playgrounds. Every case study reads in 30 seconds; the detail is there if you want to dig.',
    sideTitle: 'Side quests',
    sideIntro: 'The things that don’t fit under “work experience” but still count.',
    aboutTitle: 'About',

    seeProject: 'See project',
    seeMore: 'See the detail',
    readFull: 'Read the full process',

    csGist: 'The gist',
    csRole: 'Role', csDuration: 'Duration', csTeam: 'Team', csTools: 'Tools', csYear: 'Year',
    csProblem: 'The problem',
    csOutcome: 'The outcome',
    csProcess: 'The process',
    csNext: 'Next project',
    csBack: 'Back',
    csProgress: 'Progress through the page',
    csSections: 'Sections on this page',
    csFigureFR: 'Figure annotated in French',

    footerSitemap: 'Sitemap',
    footerContact: 'Get in touch',
    footerResume: 'Download my resume',
    footerNote: 'Hand-coded. No database, no tracker.',
    footerRights: 'All rights reserved.',

    loading: 'Loading',
    notFoundTitle: 'This page doesn’t exist',
    notFoundBody: 'The link might be old, or I broke something.',
    notFoundCta: 'Back home',
    draftBadge: 'Draft — copy to be reviewed'
  }
};

/* --------------------------------------------------------------------------
   3) LE HERO DE LA PAGE D'ACCUEIL
   Volontairement court : c'est la premiere chose lue, et un recruteur
   decide en quelques secondes s'il continue.
   -------------------------------------------------------------------------- */
/* La phrase du héros est décrite comme une LISTE DE MORCEAUX plutôt que comme
   une chaîne de caractères contenant du HTML. Chaque morceau porte son rôle :

     { t: '...' }                  texte simple
     { t: '...', accent: true }    mot mis en avant, en vert lime
     { t: '...', to: '#/work/x' }  lien interne vers une étude de cas
     { t: '...', u: true }         simplement souligné, sans lien

   Pourquoi ce détour ? Parce qu'app.js peut alors construire chaque morceau
   avec createElement et textContent. Aucune chaîne de contenu ne traverse
   innerHTML, donc aucune apostrophe ou caractère spécial ne peut casser la
   page — et une éventuelle balise se retrouverait affichée telle quelle
   plutôt qu'interprétée. Ajouter une ligne = ajouter un tableau ici. */
export const HERO = {
  fr: {
    name: 'Je suis Marvin',
    statement: [
      [
        { t: 'J’aime « décrypter » des ' },
        { t: 'flux de travail complexes', accent: true }
      ],
      [
        { t: 'sur des produits ' },
        { t: 'B2B', accent: true },
        { t: ' en hypercroissance.' }
      ],
      [
        { t: 'J’ai travaillé chez ' },
        { t: 'Petal', to: '#/work/constraints' },
        { t: ', ' },
        { t: 'Fit-Plans', to: '#/work/fit-plans' },
        { t: ' et ' },
        { t: 'Gekko', u: true },
        { t: '.' }
      ]
    ],
    gapLink: 'Pourquoi je n’ai pas travaillé pendant 2 ans'
  },
  en: {
    name: 'I’m Marvin',
    statement: [
      [
        { t: 'I like to “decipher” ' },
        { t: 'complex workflows', accent: true }
      ],
      [
        { t: 'when working on ' },
        { t: 'B2B', accent: true },
        { t: ' product in scale-ups.' }
      ],
      [
        { t: 'I previously worked at ' },
        { t: 'Petal', to: '#/work/constraints' },
        { t: ', ' },
        { t: 'Fit-Plans', to: '#/work/fit-plans' },
        { t: ', and ' },
        { t: 'Gekko', u: true },
        { t: '.' }
      ]
    ],
    gapLink: 'Why I didn’t work for 2 years'
  }
};

/* --------------------------------------------------------------------------
   4) LES PROJETS
   --------------------------------------------------------------------------
   Structure de chaque projet :
     slug      : identifiant dans l'URL (#/work/constraints)
     kind      : 'work' (experience pro) ou 'side' (projet a cote)
     accent    : couleur du poster, piochee dans les variables CSS
     poster    : { label, figure } -> texte affiche sur l'affiche generee
     fr / en   : tout le contenu redactionnel
       gist      : les 4 lignes de metadonnees (role, duree, equipe, outils)
       problem   : 1-2 phrases. Le "pourquoi ce projet existe".
       outcome   : 1-2 phrases. Le "qu'est-ce qui a change".
       stats     : chiffres marquants (facultatif) — c'est ce qu'un recruteur retient
       sections  : le processus detaille. Chaque section = une entree de la nav laterale.
                   image  -> nom de fichier dans assets/img (sans extension)
                   frOnly -> true si le visuel n'existe qu'annote en francais
   -------------------------------------------------------------------------- */
export const PROJECTS = [

  /* ===================== PETAL — CONTRAINTES ============================ */
  {
    slug: 'constraints', kind: 'work', accent: 'a', year: '2023',
    poster: { label: '24 → 9', figure: 'rules' },
    fr: {
      title: 'Contraintes de planification',
      client: 'Petal',
      tagline: 'Refonte d’un moteur de règles de planification, ramenées de **24 à 9**.',
      tags: ['Design système', 'Recherche', 'SaaS santé'],
      gist: { role: 'UX / UI, recherche', duration: '4 mois', team: '1 designer, 1 PM', tools: 'Figma, entretiens' },
      problem: 'Les contraintes sont les règles qui s’appliquent aux disponibilités du personnel pour construire un planning équitable — « un membre ne peut pas faire deux périodes d’affilée », par exemple. Elles étaient paramétrées à la main par les équipes internes de Petal : long, coûteux, et si redondant que plusieurs règles différentes menaient au même résultat. Les agents se trompaient.',
      outcome: 'J’ai réduit les 24 contraintes à 9 (et les 8 plus utilisées à 3) en identifiant leurs caractéristiques communes, puis conçu un rule builder que les gestionnaires de clinique peuvent utiliser eux-mêmes — sans passer par un agent.',
      stats: [
        { n: '24 → 9', l: 'contraintes après regroupement' },
        { n: '8 → 3', l: 'pour les plus utilisées' },
        { n: '4 mois', l: 'du cadrage à la remise' }
      ],
      sections: [
        {
          id: 'audit', label: 'Cadrage', title: '1. Cadrage et audit',
          body: [
            'J’ai commencé par interroger le service interne responsable du déploiement, parce que c’était eux qui payaient le prix de la complexité. Je voulais des réponses chiffrées, pas des impressions : quelles règles sont réellement utilisées, combien de temps prend le paramétrage d’une clinique, combien de règles pour un établissement complet, et par quel canal les plannings arrivent-ils jusqu’à eux.',
            'Ce cadrage a révélé le point le plus utile du projet : toutes les règles ne servaient pas. Une partie du catalogue existait sans jamais avoir été employée.'
          ]
        },
        {
          id: 'mapping', label: 'Mapping', title: '2. Mapping des 24 contraintes',
          body: [
            'J’ai listé les 24 contraintes et les ai classées par fréquence d’utilisation. Pour comprendre sur quoi elles agissaient, je leur ai appliqué un code couleur : vert pour le temps, mauve pour les tâches, rouge pour les membres et les groupes. L’objectif n’était pas décoratif — il s’agissait de faire apparaître visuellement les caractéristiques que plusieurs règles partageaient.',
            'Deux entretiens avec des gestionnaires ont complété le tableau côté utilisateur final. Puis j’ai illustré chaque contrainte sous forme de flux, pour repérer à quel moment chaque caractéristique était choisie et si ce moment comptait. La question derrière : peut-on paramétrer une caractéristique une seule fois pour plusieurs règles appliquées ensemble ?',
            'Oui. C’est ce travail de mutualisation qui a fait passer 24 règles à 9.'
          ],
          image: 'constraints-2-mapping', frOnly: true,
          caption: 'Exemple sur la famille « limites » : les caractéristiques communes (type de tâche, type de période, type de membre) sont extraites pour être mutualisées.'
        },
        {
          id: 'benchmark', label: 'Benchmark', title: '3. Benchmark',
          body: [
            'Une fois les règles simplifiées, restait à choisir un modèle d’interface. J’ai regardé comment d’autres produits font paramétrer des ensembles de règles complexes par des non-experts. Le rule builder — les automatisations de Notion, la recherche avancée de Gmail — répondait au même problème : beaucoup de conditions possibles, un utilisateur qui n’en veut que trois.'
          ],
          image: 'constraints-3-benchmark', frOnly: true,
          caption: 'Deux références : la création d’un comportement automatisé dans Notion, et la recherche avancée de Gmail.'
        },
        {
          id: 'design', label: 'Conception', title: '4. Conception',
          body: [
            'Quatre principes ont guidé les interfaces. Les caractéristiques à paramétrer ne s’affichent qu’en cas de besoin (progressive disclosure). Les options les plus courantes sont présélectionnées par défaut. Le processus est découpé en étapes pour rester digeste. Une aide contextuelle et des illustrations accompagnent le paramétrage pour limiter les erreurs.',
            'J’ai exploré deux directions. La première affiche les paramètres et le résultat côte à côte. La seconde affiche les paramètres de façon contextuelle et reformule la règle dans une phrase en langage naturel — « Marc Tremblay ne pourra pas être affecté à la tâche Soins - Étage 2 du lundi au vendredi ». Cette phrase est la pièce importante : elle permet à un gestionnaire de vérifier ce qu’il vient de créer sans relire les champs un par un.',
            'J’ai aussi envisagé le paramétrage de plusieurs règles en une seule passe, pour accélérer la mise en place d’un établissement complet.'
          ],
          image: 'constraints-4-design', frOnly: true,
          caption: 'Les deux directions explorées, puis le panneau de liste des contraintes créées.'
        }
      ]
    },
    en: {
      title: 'Scheduling constraints',
      client: 'Petal',
      tagline: 'Redesigning a rule-making engine, reducing rules from **24 to 9**.',
      tags: ['Systems design', 'Research', 'Healthcare SaaS'],
      gist: { role: 'UX / UI, research', duration: '4 months', team: '1 designer, 1 PM', tools: 'Figma, interviews' },
      problem: 'Constraints are the rules applied to staff availability to build a fair schedule — “a member cannot work two consecutive periods”, for instance. They were configured by hand by Petal’s internal teams: slow, expensive, and so redundant that several different rules led to the same result. Agents made mistakes.',
      outcome: 'I reduced the 24 constraints to 9 (and the 8 most-used to 3) by identifying the characteristics they shared, then designed a rule builder clinic managers can operate themselves — without going through an agent.',
      stats: [
        { n: '24 → 9', l: 'constraints after consolidation' },
        { n: '8 → 3', l: 'for the most-used ones' },
        { n: '4 months', l: 'from scoping to handoff' }
      ],
      sections: [
        {
          id: 'audit', label: 'Scoping', title: '1. Scoping and audit',
          body: [
            'I started by interviewing the internal deployment team, because they were the ones paying the price of the complexity. I wanted numbers, not impressions: which rules are actually used, how long it takes to configure one clinic, how many rules a full facility needs, and how schedules reach them in the first place.',
            'This scoping surfaced the most useful finding of the project: not all the rules were in use. Part of the catalogue existed without ever having been applied.'
          ]
        },
        {
          id: 'mapping', label: 'Mapping', title: '2. Mapping the 24 constraints',
          body: [
            'I listed all 24 constraints and ranked them by usage frequency. To understand what each one acted on, I colour-coded them: green for time, purple for tasks, red for members and groups. This wasn’t decorative — it was there to make the characteristics that several rules shared visible at a glance.',
            'Two interviews with managers filled in the end-user side. Then I drew each constraint as a flow, to see when each characteristic was selected and whether that moment mattered. The question underneath: can you configure one characteristic once for several rules applied together?',
            'You can. That consolidation work is what took 24 rules down to 9.'
          ],
          image: 'constraints-2-mapping', frOnly: true,
          caption: 'Worked example on the “limits” family: shared characteristics (task type, period type, member type) are extracted so they can be configured once.'
        },
        {
          id: 'benchmark', label: 'Benchmark', title: '3. Benchmark',
          body: [
            'With the rules simplified, the remaining question was which interface model to use. I looked at how other products let non-experts configure complex sets of rules. The rule builder — Notion automations, Gmail advanced search — answers the same problem: many possible conditions, a user who only wants three of them.'
          ],
          image: 'constraints-3-benchmark', frOnly: true,
          caption: 'Two references: building an automation in Notion, and Gmail’s advanced search.'
        },
        {
          id: 'design', label: 'Design', title: '4. Design',
          body: [
            'Four principles drove the interfaces. Characteristics only appear when they are needed (progressive disclosure). The most common options are preselected by default. The process is split into steps to stay digestible. Contextual help and illustrations sit alongside configuration to reduce errors.',
            'I explored two directions. The first shows parameters and result side by side. The second shows parameters contextually and restates the rule as a plain-language sentence — “Marc Tremblay cannot be assigned to Care - Floor 2 from Monday to Friday.” That sentence is the important piece: it lets a manager verify what they just built without re-reading every field.',
            'I also looked at configuring several rules in a single pass, to speed up setting up a whole facility.'
          ],
          image: 'constraints-4-design', frOnly: true,
          caption: 'The two directions explored, then the panel listing created constraints.'
        }
      ]
    }
  },

  /* ================== PETAL — EXCLUSION DES SERVICES ==================== */
  {
    slug: 'services-exclusion', kind: 'work', accent: 'b', year: '2024',
    poster: { label: 'Ship. Watch. Fix.', figure: 'wizard' },
    fr: {
      title: 'Exclusion de services',
      client: 'Petal',
      tagline: 'Un assistant en **4 étapes**, mis en production, mal compris, puis corrigé.',
      tags: ['Wizard', 'Test utilisateur', 'Itération'],
      gist: { role: 'UX / UI', duration: '3 mois', team: '1 dev, 1 designer, 1 PM, 1 rédacteur technique', tools: 'Figma' },
      problem: 'Dans le HUB — la plateforme qui synchronise les cliniques et hôpitaux du Québec — certains services ne sont plus utilisés ou ne le sont que temporairement, comme une clinique de vaccination saisonnière. Ils faussent les statistiques, mais ne peuvent être supprimés que dans le DME, une procédure lourde pour le personnel médical. Il fallait donc pouvoir les exclure de la synchronisation sans les supprimer — et le faire à l’intérieur d’une modale déjà chargée d’autres étapes.',
      outcome: 'Un wizard en quatre étapes qui rend l’exclusion explicite. Après la mise en production, les tests ont révélé une erreur d’usage que nous n’avions pas anticipée : nous avons inversé la logique de sélection et ajouté un avertissement.',
      stats: [
        { n: '4 étapes', l: 'au lieu d’un écran unique' },
        { n: '3 mois', l: 'du cadrage à l’itération' },
        { n: '1 échec', l: 'détecté après mise en production' }
      ],
      sections: [
        {
          id: 'kickoff', label: 'Cadrage', title: '1. Cadrage',
          body: [
            'Le PM pose les besoins et les objectifs, et l’équipe énumère les contraintes techniques. Ici, une seule comptait vraiment : la solution devait tenir dans la modale de synchronisation existante du HUB. Pas de nouvelle page, pas de nouveau parcours.',
            'C’est aussi le moment où l’on cartographie le parcours complet, de la première connexion au DME jusqu’à la visualisation des données. Voir l’exclusion à sa place dans cette chaîne a permis de comprendre le vrai problème : nous ajoutions une étape à un processus déjà lourd.'
          ],
          image: 'exclusion-1-kickoff', altImage: 'exclusion-1-kickoff-en',
          caption: 'Le parcours de synchronisation du HUB. L’exclusion vient se greffer à l’étape de paramétrage des services.'
        },
        {
          id: 'design', label: 'Conception', title: '2. Conception',
          body: [
            'Le vrai défi n’était pas technique. Les gestionnaires n’ont l’habitude de paramétrer que les services qui seront actifs. Il fallait leur faire comprendre qu’ils pouvaient aussi désactiver et exclure les services inutilisés — sans complexifier une interface déjà dense.',
            'J’ai découpé le processus en étapes explicitement nommées : services exclus, services inactifs, services actifs, confirmation. Un texte explicatif accompagne chaque étape, les services modifiés restent sélectionnables, et un dernier écran résume ce qui va se passer avant validation.'
          ],
          image: 'exclusion-2-design', altImage: 'exclusion-2-design-en',
          caption: 'Avant / après. L’écran unique devient un wizard dont chaque étape porte un nom.'
        },
        {
          id: 'ship', label: 'Mise en production', title: '3. Mise en production',
          body: [
            'Après revue, le design part en développement. J’ai accompagné le développeur pour m’assurer que la solution livrée correspondait à l’intention — pas seulement aux maquettes.',
            'Puis le problème est apparu. Nous avions ajouté une case à cocher pour sélectionner les services à exclure. Les gestionnaires ne l’ont pas comprise comme nous l’avions imaginée.'
          ],
          image: 'exclusion-3-ship', altImage: 'exclusion-3-ship-en',
          caption: 'Le feedback textuel qui confirme l’exclusion d’un service.'
        },
        {
          id: 'iterate', label: 'Itération', title: '4. Test et retour à la conception',
          body: [
            'Nous avons repris le processus d’exclusion et de désactivation auprès de plusieurs cliniques. Le constat était net : la plupart des gestionnaires cliquaient automatiquement sur la case « tout sélectionner », excluant ainsi la totalité des services de la synchronisation. Un réflexe, pas une décision.',
            'Trois corrections. Nous avons supprimé le « tout sélectionner » de la liste des services inactifs. Nous avons inversé la logique : l’utilisateur décoche les services qu’il souhaite exclure, ce qui rend l’action délibérée. Et nous avons ajouté un avertissement affichant le nombre de services exclus avant validation.',
            'C’est le projet dont je parle le plus volontiers en entretien. Non pas parce que la première version était bonne, mais parce que le dispositif de test a permis de rattraper une erreur avant qu’elle ne coûte des données à quelqu’un.'
          ],
          image: 'exclusion-4-test', altImage: 'exclusion-4-test-en',
          caption: 'Après itération : l’avertissement compte les services exclus pour réduire le risque d’erreur.'
        }
      ]
    },
    en: {
      title: 'Services exclusion',
      client: 'Petal',
      tagline: 'A **4-step** wizard that shipped, was misread, and got fixed.',
      tags: ['Wizard', 'User testing', 'Iteration'],
      gist: { role: 'UX / UI', duration: '3 months', team: '1 dev, 1 designer, 1 PM, 1 technical writer', tools: 'Figma' },
      problem: 'In the HUB — the platform that synchronises clinics and hospitals across Québec — some services are no longer used, or only temporarily, like a seasonal flu clinic. They skew a clinic’s statistics, but can only be deleted in the EMR, which is a heavy procedure for medical staff. So they needed to be excluded from synchronisation without being deleted — inside a modal already carrying several other steps.',
      outcome: 'A four-step wizard that makes exclusion explicit. After release, testing surfaced a usage error we hadn’t anticipated: we inverted the selection logic and added a warning.',
      stats: [
        { n: '4 steps', l: 'instead of a single screen' },
        { n: '3 months', l: 'from scoping to iteration' },
        { n: '1 failure', l: 'caught after release' }
      ],
      sections: [
        {
          id: 'kickoff', label: 'Scoping', title: '1. Kickoff and scoping',
          body: [
            'The PM sets out needs and goals, and the team lists the technical constraints. Here, only one really mattered: the solution had to fit inside the HUB’s existing synchronisation modal. No new page, no new flow.',
            'This is also when we mapped the full journey, from first EMR connection through to viewing the data. Seeing exclusion in its place in that chain is what surfaced the real problem: we were adding a step to a process that was already heavy.'
          ],
          image: 'exclusion-1-kickoff-en', altImage: 'exclusion-1-kickoff',
          caption: 'The HUB synchronisation journey. Exclusion attaches to the service configuration step.'
        },
        {
          id: 'design', label: 'Design', title: '2. Design',
          body: [
            'The real challenge wasn’t technical. Managers are only used to configuring the services that will be active. We had to make them understand they could also deactivate and exclude unused ones — without making an already dense interface denser.',
            'I split the process into explicitly named steps: excluded services, inactive services, active services, confirmation. Explanatory copy sits with each step, modified services stay selectable, and a final screen summarises what is about to happen before confirmation.'
          ],
          image: 'exclusion-2-design-en', altImage: 'exclusion-2-design',
          caption: 'Before / after. The single screen becomes a wizard where every step has a name.'
        },
        {
          id: 'ship', label: 'Release', title: '3. Handoff and release',
          body: [
            'After review, the design went to development. I worked alongside the developer to make sure what shipped matched the intent — not just the mockups.',
            'Then the problem showed up. We had added a checkbox to select which services to exclude. Managers did not read it the way we had imagined.'
          ],
          image: 'exclusion-3-ship-en', altImage: 'exclusion-3-ship',
          caption: 'The inline feedback confirming a service has been excluded.'
        },
        {
          id: 'iterate', label: 'Iteration', title: '4. Testing and back to design',
          body: [
            'We ran the exclusion and deactivation process again with several clinics. The finding was unambiguous: most managers clicked the “select all” box automatically, excluding every single service from synchronisation. A reflex, not a decision.',
            'Three fixes. We removed “select all” from the inactive services list. We inverted the logic: the user now unchecks the services they want to exclude, which makes the action deliberate. And we added a warning showing how many services are about to be excluded.',
            'This is the project I bring up most readily in interviews. Not because the first version was good, but because the testing setup caught a mistake before it cost somebody their data.'
          ],
          image: 'exclusion-4-test-en', altImage: 'exclusion-4-test',
          caption: 'After iteration: the warning counts excluded services to reduce the risk of error.'
        }
      ]
    }
  },

  /* ===================== PETAL — TRANSFERT DE DME ======================= */
  {
    slug: 'emr-transfer', kind: 'work', accent: 'c', year: '2024',
    poster: { label: 'Attendre, mais voir', figure: 'steps' },
    fr: {
      title: 'Transfert de DME',
      client: 'Petal',
      tagline: 'Rendre lisible un transfert de **3 semaines** sur lequel l’utilisateur n’a aucune prise.',
      tags: ['Processus long', 'Transparence', 'SaaS santé'],
      gist: { role: 'UX / UI', duration: '4 mois', team: '1 designer, 1 PM, 1 rédacteur technique', tools: 'Figma' },
      problem: 'Les cliniques voulaient pouvoir changer de DME dans le HUB. Le processus n’était réalisable que par l’équipe de déploiement, de façon localisée : lourd, d’une à trois semaines voire plus, et obligatoirement mené avec un agent interne mobilisé pour l’occasion. Le gestionnaire à l’origine de la demande, lui, n’avait aucun moyen d’action — mais avait besoin de visibilité.',
      outcome: 'Une interface de suivi qui affiche les quatre étapes du transfert, l’état d’avancement, le DME de départ et d’arrivée, et laisse au gestionnaire la seule action qui lui reste vraiment : interrompre le processus.',
      stats: [
        { n: '1 à 3 semaines', l: 'de durée réelle du transfert' },
        { n: '4 étapes', l: 'rendues visibles au gestionnaire' },
        { n: '0 action', l: 'possible — d’où le problème' }
      ],
      sections: [
        {
          id: 'kickoff', label: 'Cadrage', title: '1. Cadrage',
          body: [
            'Le PM définit les conditions de réussite et les contraintes. Nous élaborons une première ébauche des étapes et des documents nécessaires au changement de DME, puis découpons le projet en sections.',
            'La question de design était inhabituelle et c’est ce qui m’a intéressé : comment rendre fluide et transparent un processus en plusieurs étapes sur lequel l’utilisateur ne peut rien faire ? Trois contraintes s’additionnaient — le gestionnaire attend les actions d’un agent, il n’a aucune notion du temps restant, et les étapes sont nombreuses.'
          ]
        },
        {
          id: 'benchmark', label: 'Benchmark', title: '2. Benchmark',
          body: [
            'J’ai étudié les logiciels et plateformes où une opération du même type est déjà illustrée, en relevant les design patterns employés — essentiellement des écrans de setup et de progression.',
            'Le benchmark a surtout tranché un débat interne. Puisque le gestionnaire ne peut pas agir, il faut être clair sans le noyer d’informations inutiles : afficher chaque micro-étape technique n’aurait fait qu’ajouter de l’anxiété. Nous avons choisi en équipe quelles étapes montrer, et lesquelles garder côté interne.'
          ],
          image: 'emr-2-benchmark', frOnly: true,
          caption: 'Exemples d’écrans de setup et de progression relevés pendant le benchmark.'
        },
        {
          id: 'design', label: 'Conception', title: '3. Exploration et conception',
          body: [
            'J’ai commencé par donner forme aux informations visibles pendant le transfert. L’écran de départ affiche le DME actuellement utilisé par la clinique et l’historique des changements déjà effectués — un contexte qui manquait complètement avant.',
            'Une fois le nouveau DME sélectionné, le gestionnaire choisit une date de transition et dépose les documents nécessaires. La confirmation lance le processus : le DME de destination s’affiche, avec les quatre étapes à franchir — confirmation de réception de la demande, création d’une nouvelle instance, configuration, migration des données. La clinique est signalée comme en cours de changement.',
            'Deux décisions comptent ici. Le gestionnaire garde la possibilité d’interrompre le processus et de changer la date de go-live : ce sont les seuls leviers réels, donc ils sont visibles en permanence. Et chaque étape porte une date de mise à jour, ce qui remplace l’estimation de durée que nous ne pouvions pas donner honnêtement.'
          ],
          image: 'emr-3-design', frOnly: true,
          caption: 'Affichage du DME courant et de l’historique, puis suivi du transfert étape par étape.'
        }
      ]
    },
    en: {
      title: 'EMR transfer',
      client: 'Petal',
      tagline: 'Making a **3-week** transfer legible when the user has no control over it.',
      tags: ['Long-running process', 'Transparency', 'Healthcare SaaS'],
      gist: { role: 'UX / UI', duration: '4 months', team: '1 designer, 1 PM, 1 technical writer', tools: 'Figma' },
      problem: 'Clinics wanted to be able to change EMR inside the HUB. The process could only be run by the deployment team, locally: heavy, one to three weeks or more, and necessarily carried out with an internal agent assigned to it. The manager who requested it had no way to act — but still needed visibility.',
      outcome: 'A tracking interface showing the four steps of the transfer, current progress, source and destination EMR, and giving the manager the one action they actually have left: stopping the process.',
      stats: [
        { n: '1 to 3 weeks', l: 'actual transfer duration' },
        { n: '4 steps', l: 'made visible to the manager' },
        { n: '0 actions', l: 'available — hence the problem' }
      ],
      sections: [
        {
          id: 'kickoff', label: 'Scoping', title: '1. Kickoff and scoping',
          body: [
            'The PM defines success conditions and constraints. We drafted a first outline of the steps and documents an EMR change requires, then split the project into sections.',
            'The design question was an unusual one, and that is what drew me in: how do you make a multi-step process feel fluid and transparent when the user cannot act on it at all? Three constraints stacked up — the manager waits on an agent’s actions, has no sense of remaining time, and the steps are numerous.'
          ]
        },
        {
          id: 'benchmark', label: 'Benchmark', title: '2. Benchmark',
          body: [
            'I studied software and platforms where a comparable operation is already illustrated, noting the design patterns used — mostly setup and progress screens.',
            'The benchmark mainly settled an internal debate. Since the manager cannot act, we had to be clear without drowning them in noise: surfacing every technical micro-step would only have added anxiety. As a team we chose which steps to show, and which to keep internal.'
          ],
          image: 'emr-2-benchmark', frOnly: true,
          caption: 'Setup and progress screens collected during the benchmark.'
        },
        {
          id: 'design', label: 'Design', title: '3. Exploration and design',
          body: [
            'I started by shaping the information visible during the transfer. The entry screen shows the EMR the clinic currently uses and the history of changes already made — context that was entirely missing before.',
            'Once the new EMR is selected, the manager picks a transition date and uploads the required documents. Confirming starts the process: the destination EMR appears, along with the four steps to clear — acknowledgement of the request, creation of a new instance, configuration, data migration. The clinic is flagged as mid-transition.',
            'Two decisions matter here. The manager keeps the ability to stop the process and to change the go-live date: those are the only real levers, so they stay permanently visible. And every step carries a last-updated date, which replaces the duration estimate we could not give honestly.'
          ],
          image: 'emr-3-design', frOnly: true,
          caption: 'Current EMR and change history, then step-by-step tracking of the transfer.'
        }
      ]
    }
  },

  /* ========================== FIT-PLANS ================================= */
  {
    slug: 'fit-plans', kind: 'work', accent: 'd', year: '2020',
    poster: { label: '6 → 3', figure: 'flow' },
    fr: {
      title: 'Fit-Plans',
      client: 'Fit-Plans, Montréal',
      tagline: 'Un parcours de commande ramené de **6 étapes à 3**, pour des clients qui téléphonaient.',
      tags: ['Refonte', 'Recherche', 'UI'],
      gist: { role: 'UX, UI, stratégie', duration: 'Mars – août 2020', team: '1 designer, 2 développeurs', tools: 'Figma, Google Analytics' },
      problem: 'Fit-Plans prépare et livre des repas à calories mesurées pour sportifs, à Montréal. Le site avait été conçu par le CEO sur son temps libre et n’avait jamais été une priorité. Résultat : 84 % des clients trouvaient la commande trop compliquée et appelaient directement — une perte de temps pour une équipe déjà réduite.',
      outcome: 'Le parcours de commande est passé de six étapes à trois. Les produits sont accessibles depuis la page d’accueil, et la personnalisation des repas se fait sur la fiche du plan. Site desktop et mobile.',
      stats: [
        { n: '84 %', l: 'des clients trouvaient la commande trop longue' },
        { n: '6 → 3', l: 'étapes pour commander' },
        { n: '92 %', l: 'jugent le concept et le CTA essentiels' }
      ],
      sections: [
        {
          id: 'discovery', label: 'Découverte', title: '1. Découverte',
          body: [
            'Analytics, évaluation de l’existant, questionnaire. L’ancien site donnait déjà beaucoup d’indices, mais il fallait entendre les clients pour savoir pourquoi ils décrochaient le téléphone.',
            'Pour obtenir des réponses en quantité, j’ai monté un programme de fidélité : un questionnaire rempli contre un code promo. C’était le levier le plus efficace disponible pour une petite structure. Le questionnaire couvrait trois thèmes — habitudes et motivations, opinion sur le service, opinion sur le site.',
            'Le chiffre qui a cadré tout le projet : 84 % des répondants trouvaient les repas trop difficiles à commander et le processus trop long. Ils préféraient appeler.'
          ]
        },
        {
          id: 'definition', label: 'Définition', title: '2. Définition',
          body: [
            'Personas, userflow, matrice de priorisation. L’ancien parcours imposait six étapes avant de valider un plan. En repartant du besoin réel — choisir un plan, l’ajuster, payer — le nombre d’étapes a été divisé par deux.',
            'Le changement structurant : l’accès aux produits directement depuis la page d’accueil, et l’ajout ou la suppression de repas spécifiques déplacés sur la page de détail du plan, là où l’utilisateur a le contexte pour décider.'
          ]
        },
        {
          id: 'design', label: 'Conception', title: '3. Conception',
          body: [
            'Wireframes puis UI. La page d’accueil s’ouvre sur une phrase qui explique la proposition de valeur, suivie des étapes de commande et d’un accès direct aux offres.',
            'Sur la page produit, un filtre permet d’affiner la recherche et un calculateur de calories oriente les indécis vers un plan adapté — c’était la principale source d’hésitation identifiée dans le questionnaire. Le système vérifie aussi que l’adresse est desservie avant de laisser commander, plutôt qu’après paiement.',
            'La page de détail affiche les informations du plan sans surprise au moment de payer, et c’est là que se fait la sélection des repas. Le site a été conçu en version desktop et mobile.'
          ]
        },
        {
          id: 'test', label: 'Tests', title: '4. Tests',
          body: [
            'Test d’utilisabilité et test des 5 secondes, menés à distance sur prototype. 92 % des participants considèrent le concept et le bouton d’appel à l’action menant à la commande comme des éléments importants — ce qui a validé la hiérarchie de la page d’accueil.',
            'Le score SUS a été mesuré pour disposer d’un point de comparaison chiffré avant et après refonte.'
          ]
        }
      ],
      extLinks: [
        { label: 'Étude de cas complète (Notion)', href: 'https://www.notion.so/mar20/Fit-Plans-website-redesign-210f02dc16d445d5bcab2895fd1c89e9' },
        { label: 'Site en bêta', href: 'https://beta.fit-plans.com/en' }
      ]
    },
    en: {
      title: 'Fit-Plans',
      client: 'Fit-Plans, Montréal',
      tagline: 'An ordering flow cut from **6 steps to 3**, for customers who preferred to phone in.',
      tags: ['Redesign', 'Research', 'UI'],
      gist: { role: 'UX, UI, strategy', duration: 'March – August 2020', team: '1 designer, 2 developers', tools: 'Figma, Google Analytics' },
      problem: 'Fit-Plans prepares and delivers calorie-accurate meals for sports enthusiasts in Montréal. The site had been built by the CEO in his spare time and had never been a priority. The result: 84% of customers found ordering too complicated and simply called instead — a drain on an already small team.',
      outcome: 'The ordering flow went from six steps to three. Products are reachable straight from the homepage, and meal customisation happens on the plan detail page. Desktop and mobile.',
      stats: [
        { n: '84%', l: 'of customers found ordering too long' },
        { n: '6 → 3', l: 'steps to order' },
        { n: '92%', l: 'rate the concept and CTA as essential' }
      ],
      sections: [
        {
          id: 'discovery', label: 'Discovery', title: '1. Discovery',
          body: [
            'Analytics, heuristic evaluation, survey. The old site already gave plenty of clues, but we needed to hear from customers to understand why they reached for the phone.',
            'To get answers at volume, I set up a loyalty scheme: a completed survey in exchange for a promo code. It was the most effective lever available to a small company. The survey covered three themes — habits and motivations, opinion of the service, opinion of the website.',
            'The number that framed the whole project: 84% of respondents found the meals too hard to order and the process too long. They preferred to call.'
          ]
        },
        {
          id: 'definition', label: 'Definition', title: '2. Definition',
          body: [
            'Personas, user flow, prioritisation matrix. The old path required six steps before confirming a plan. Starting again from the actual need — pick a plan, adjust it, pay — halved the number of steps.',
            'The structural change: products reachable directly from the homepage, and adding or removing specific meals moved onto the plan detail page, where the user has the context to decide.'
          ]
        },
        {
          id: 'design', label: 'Design', title: '3. Design',
          body: [
            'Wireframes, then UI. The homepage opens on a sentence stating the value proposition, followed by the ordering steps and direct access to the offers.',
            'On the product page, a filter narrows results and a calorie calculator steers undecided users towards a suitable plan — that was the main source of hesitation the survey identified. The system also checks the address is served before letting someone order, rather than after payment.',
            'The detail page shows plan information with no surprises at checkout, and that is where meals are selected. The site was designed in desktop and mobile versions.'
          ]
        },
        {
          id: 'test', label: 'Testing', title: '4. Testing',
          body: [
            'Usability testing and a five-second test, run remotely on a prototype. 92% of participants rate the concept and the call-to-action leading to the order as important elements — which validated the homepage hierarchy.',
            'We measured the SUS score to have a numerical before-and-after benchmark for the redesign.'
          ]
        }
      ],
      extLinks: [
        { label: 'Full case study (Notion)', href: 'https://www.notion.so/mar20/Fit-Plans-website-redesign-210f02dc16d445d5bcab2895fd1c89e9' },
        { label: 'Beta website', href: 'https://beta.fit-plans.com/en' }
      ]
    }
  },

  /* ========================== SOUNDCLOUD ================================ */
  {
    slug: 'soundcloud', kind: 'work', accent: 'e', year: '2020',
    poster: { label: 'SUS 69,57', figure: 'gauge' },
    fr: {
      title: 'Soundcloud',
      client: 'Projet d’étude',
      tagline: '**815 réponses** et 6 tests pour comprendre pourquoi personne ne trouve le bouton commentaire.',
      tags: ['Recherche', 'Test d’utilisabilité', 'UI'],
      gist: { role: 'Recherche, tests, UI', duration: 'Nov. 2019 – nov. 2020', team: '3 designers', tools: 'Figma, Google Forms, Sheets' },
      problem: 'Soundcloud a une fonctionnalité que ses concurrents n’ont pas : commenter un morceau à un instant précis. Encore faut-il la trouver. Nous voulions mesurer l’utilisabilité réelle de la plateforme, puis rendre cette fonctionnalité accessible à quelqu’un qui ouvre le site pour la première fois.',
      outcome: 'Un score SUS de 69,57 mesuré sur 815 répondants, six tests utilisateurs qui isolent deux problèmes précis, et une refonte de la page artiste qui remonte la section commentaires sur la droite.',
      stats: [
        { n: '815', l: 'réponses au questionnaire' },
        { n: '69,57', l: 'score SUS de la plateforme' },
        { n: '83 %', l: 'de réussite aux tests, avec 1 abandon' }
      ],
      sections: [
        {
          id: 'research', label: 'Recherche', title: '1. Recherche quantitative',
          body: [
            'Nous avons conçu un questionnaire de 30 questions pour comprendre les habitudes, les profils et les fonctionnalités préférées des utilisateurs, en y intégrant l’échelle d’utilisabilité UMUX. Diffusé sur Twitter et LinkedIn, il a recueilli 815 réponses, majoritairement des 16-25 ans — ce qui donne au passage une indication sur l’âge moyen des utilisateurs de la plateforme.',
            'Transposé sur l’échelle SUS, le résultat donne 69,57. C’est médiocre : cela situe Soundcloud entre le niveau d’utilisabilité d’Excel et celui d’un vieux GPS.',
            'Trois autres chiffres ont orienté la suite : 29,7 % utilisent une autre plateforme parce qu’ils la trouvent meilleure, 70 % passent par la barre de recherche — ils savent donc ce qu’ils viennent écouter — et 43,9 % des utilisateurs hebdomadaires écoutent entre 11 et 30 minutes par session.',
            'Notre conclusion : Soundcloud est perçu comme une alternative à Spotify, Deezer ou Apple Music plutôt que comme un service principal, et l’application est bien plus utilisée que le site. La priorité allait donc à l’interface web, en particulier aux commentaires.'
          ]
        },
        {
          id: 'tests', label: 'Tests', title: '2. Tests utilisateurs',
          body: [
            'Nous avons construit un scénario de test sur la version desktop, autour de trois missions : trouver un artiste et un morceau précis, pour évaluer le placement de la barre de recherche ; lancer l’écoute, la fonction principale du site ; et laisser un commentaire à un moment précis du morceau, la fonctionnalité exclusive. Le même scénario a été administré à chaque testeur, en leur demandant de décrire leurs actions à voix haute.',
            'Sur six testeurs, dont certains n’avaient jamais utilisé le site : 83 % de réussite, un abandon, et des missions bouclées entre 30 secondes et une minute.',
            'Les points positifs étaient nets — trouver un morceau est facile, le bouton de lecture est assez gros pour être trouvé sans réfléchir. Les points négatifs l’étaient tout autant : seuls ceux qui connaissaient déjà la plateforme parvenaient à commenter, et il y avait une confusion récurrente entre la page artiste et les résultats de recherche.',
            'L’insight le plus utile : les utilisateurs s’attendaient à commenter comme sur YouTube. Ils cherchaient un champ sous le lecteur, pas une interaction sur la forme d’onde.'
          ]
        },
        {
          id: 'solution', label: 'Solution', title: '3. Solution',
          body: [
            'Nous avons prototypé les corrections pour les rendre manipulables plutôt que descriptibles. Puis j’ai repris la page artiste en remontant la section commentaires sur la droite, à hauteur du lecteur, pour qu’elle soit visible sans scroll et lisible comme une conversation en cours.'
          ]
        }
      ],
      extLinks: [
        { label: 'Dossier complet (Notion, en français)', href: 'https://www.notion.so/mar20/Usability-test-Soundcloud-518394b0bb404f1ebf467bc99f2bc064' }
      ]
    },
    en: {
      title: 'Soundcloud',
      client: 'Study project',
      tagline: '**815 responses** and 6 tests to work out why nobody finds the comment button.',
      tags: ['Research', 'Usability testing', 'UI'],
      gist: { role: 'Research, testing, UI', duration: 'Nov 2019 – Nov 2020', team: '3 designers', tools: 'Figma, Google Forms, Sheets' },
      problem: 'Soundcloud has a feature its competitors don’t: commenting on a track at a specific moment. You just have to find it first. We wanted to measure the platform’s actual usability, then make that feature reachable for someone opening the site for the first time.',
      outcome: 'A SUS score of 69.57 measured across 815 respondents, six user tests isolating two specific problems, and a redesigned artist page that lifts the comment section up the right-hand side.',
      stats: [
        { n: '815', l: 'survey responses' },
        { n: '69.57', l: 'platform SUS score' },
        { n: '83%', l: 'test success rate, with 1 dropoff' }
      ],
      sections: [
        {
          id: 'research', label: 'Research', title: '1. Quantitative research',
          body: [
            'We built a 30-question survey to understand users’ habits, profiles and favourite features, with the UMUX usability scale embedded in it. Distributed on Twitter and LinkedIn, it gathered 815 responses, mostly from 16-to-25-year-olds — which incidentally tells you something about the platform’s average user age.',
            'Transposed onto the SUS scale, the result is 69.57. That is mediocre: it puts Soundcloud somewhere between the usability of Excel and an old GPS.',
            'Three further numbers shaped what came next: 29.7% use another platform because they think it is better, 70% go through the search bar — so they already know what they came to hear — and 43.9% of weekly users listen for 11 to 30 minutes per session.',
            'Our conclusion: Soundcloud is seen as an alternative to Spotify, Deezer or Apple Music rather than a primary service, and the app is used far more than the site. So the priority was the web interface, and the comments feature in particular.'
          ]
        },
        {
          id: 'tests', label: 'Testing', title: '2. User testing',
          body: [
            'We built a test scenario on the desktop version around three missions: find a specific artist and track, to assess where the search bar sits; start playback, the site’s primary function; and leave a comment at a specific moment in the track, the exclusive feature. Every tester got the same scenario, and was asked to narrate their actions out loud.',
            'Across six testers, some of whom had never used the site: 83% success, one dropoff, and missions completed in 30 seconds to a minute.',
            'The positives were clear — finding a track is easy, and the play button is large enough to find without thinking. The negatives were just as clear: only people who already knew the platform managed to leave a comment, and there was recurring confusion between the artist page and search results.',
            'The most useful insight: users expected to comment the way they do on YouTube. They looked for a field under the player, not an interaction on the waveform.'
          ]
        },
        {
          id: 'solution', label: 'Solution', title: '3. Solution',
          body: [
            'We prototyped the fixes to make them manipulable rather than merely describable. Then I reworked the artist page, lifting the comment section up the right-hand side, level with the player, so it is visible without scrolling and reads like a conversation in progress.'
          ]
        }
      ],
      extLinks: [
        { label: 'Full work document (Notion, French only)', href: 'https://www.notion.so/mar20/Usability-test-Soundcloud-518394b0bb404f1ebf467bc99f2bc064' }
      ]
    }
  },

  /* ===================== SIDE QUEST — HOOT ============================= */
  {
    slug: 'hoot', kind: 'side', accent: 'f', year: '2019',
    poster: { label: '2ᵉ / hackathon', figure: 'owl' },
    fr: {
      title: 'Hoot',
      client: 'Hackathon La Poste × ECV Digital',
      tagline: '**Une semaine** pour concevoir la conciergerie des travailleurs de nuit. **2ᵉ place**.',
      tags: ['Hackathon', 'Concept', 'UI'],
      gist: { role: 'Idéation, questionnaire, wireframing', duration: '1 semaine', team: '2 UI, 1 UX, 1 dev, 1 PM', tools: 'Figma, Google Forms, ProtoPie' },
      problem: 'La Poste nous demandait d’imaginer la conciergerie de demain. La plupart des acteurs du marché proposent du ménage, de la cuisine ou de la livraison, à des prix plus ou moins accessibles — mais aucun ne s’adresse au travail de nuit. Nous avons choisi cet angle pour nous distinguer.',
      outcome: 'Hoot, une application qui prend au sérieux le bien-être des travailleurs de nuit : commande de repas géolocalisée, programmes de relaxation et de réveil, événements entre collègues, et vote collectif sur le matériel à commander. Deuxième place du hackathon.',
      stats: [
        { n: '90 %', l: 'estiment que le travail de nuit affecte leur santé' },
        { n: '10 / 10', l: 'reconnaissent un impact sur leurs relations' },
        { n: '7 / 10', l: 'citent la livraison de repas comme problème majeur' }
      ],
      sections: [
        {
          id: 'explore', label: 'Exploration', title: '1. Exploration',
          body: [
            'Benchmark d’abord : Glovo, Please, John Paul, Premium. Le constat est vite venu — le créneau de nuit était vide. Ce n’était pas un oubli de notre part, c’était une opportunité.',
            'Puis un questionnaire auprès d’une cinquantaine de personnes qualifiées. Les réponses ont été plus tranchées que prévu. 90 % estiment que le travail de nuit a eu un impact significatif sur leur santé. La totalité des personnes interrogées reconnaissent une influence sur leurs relations familiales et amicales. Et 7 sur 10 identifient la livraison de repas comme un problème majeur : la nuit, il n’y a plus rien d’ouvert.'
          ]
        },
        {
          id: 'analysis', label: 'Analyse', title: '2. Analyse',
          body: [
            'Les réponses dessinaient deux profils distincts, que nous avons formalisés en personas. Pour le premier groupe, le travail de nuit est physiquement dur et perturbe le sommeil. Le second est davantage gêné par l’impact social et alimentaire.',
            'Nous avons ensuite listé les fonctionnalités possibles autour de quatre axes : livraison, bien-être au travail, social, et services. Beaucoup d’idées, dont nous n’avons gardé qu’une partie — c’est un hackathon, il faut une démo qui tient debout.'
          ]
        },
        {
          id: 'design', label: 'Conception', title: '3. Conception',
          body: [
            'Wireframes pour structurer, puis UI. Nous avons choisi un thème sombre, puisque l’application est utilisée de nuit, avec des couleurs plus vives réservées au contenu important. Le hibou, animal nocturne, donnait à l’application une personnalité immédiatement lisible.',
            'Quatre fonctionnalités ont été poussées jusqu’à l’écran : la commande de repas, avec les restaurants ouverts les plus proches sur une carte, filtrables, et les informations nutritionnelles affichées ; les programmes personnalisés de relaxation ou de réveil, selon le besoin du moment ; les mini-événements entre collègues pendant les pauses ; et le vote sur le matériel à commander pour faciliter la nuit de travail.',
            'Le parcours principal, de l’onboarding à la sélection d’un programme de réveil, a été prototypé pour que le jury puisse manipuler la solution au lieu de l’imaginer.'
          ]
        }
      ],
      extLinks: [
        { label: 'Dossier du projet (Google Slides, en français)', href: 'https://docs.google.com/presentation/d/19j9bNYiIAdAf2K3WXpHOBWLFEReeOjdBYpPc9h0cgXQ/embed?size=l&slide=id.p' }
      ]
    },
    en: {
      title: 'Hoot',
      client: 'La Poste × ECV Digital hackathon',
      tagline: '**One week** to design a concierge service for night workers. **2nd place**.',
      tags: ['Hackathon', 'Concept', 'UI'],
      gist: { role: 'Ideation, survey, wireframing', duration: '1 week', team: '2 UI, 1 UX, 1 dev, 1 PM', tools: 'Figma, Google Forms, ProtoPie' },
      problem: 'La Poste asked us to imagine the concierge service of tomorrow. Most players on the market offer cleaning, cooking or delivery at varying price points — but none of them address night work. We picked that angle to stand apart.',
      outcome: 'Hoot, an app that takes night workers’ wellbeing seriously: location-aware meal ordering, relaxation and wake-up programmes, events between colleagues, and collective voting on equipment to order. Second place in the hackathon.',
      stats: [
        { n: '90%', l: 'say night work has affected their health' },
        { n: '10 / 10', l: 'recognise an impact on their relationships' },
        { n: '7 / 10', l: 'name meal delivery as a major issue' }
      ],
      sections: [
        {
          id: 'explore', label: 'Exploration', title: '1. Exploration',
          body: [
            'Benchmark first: Glovo, Please, John Paul, Premium. The finding came quickly — the night slot was empty. That wasn’t an oversight on our part, it was an opening.',
            'Then a survey across around fifty qualified respondents. The answers were sharper than expected. 90% say night work has had a significant impact on their health. Every single person interviewed recognises an effect on family and friendships. And 7 out of 10 name meal delivery as a major problem: at night, nothing is open.'
          ]
        },
        {
          id: 'analysis', label: 'Analysis', title: '2. Analysis',
          body: [
            'The responses described two distinct profiles, which we formalised as personas. For the first group, night work is physically hard and disrupts sleep. The second is more bothered by the social and dietary impact.',
            'We then listed possible features across four axes: delivery, workplace wellness, social, and services. Plenty of ideas, only some of which we kept — it’s a hackathon, and the demo has to stand up.'
          ]
        },
        {
          id: 'design', label: 'Design', title: '3. Design',
          body: [
            'Wireframes to structure, then UI. We chose a dark theme, since the app is used at night, with brighter colours reserved for important content. The owl, a nocturnal animal, gave the app a personality you read instantly.',
            'Four features were pushed all the way to screens: meal ordering, with the nearest open restaurants on a map, filterable, and nutritional information shown; personalised relaxation or wake-up programmes depending on what the moment calls for; mini-events between colleagues during breaks; and voting on equipment to order to make the night easier.',
            'The main flow, from onboarding to selecting a wake-up programme, was prototyped so the jury could handle the solution instead of imagining it.'
          ]
        }
      ],
      extLinks: [
        { label: 'Project file (Google Slides, French only)', href: 'https://docs.google.com/presentation/d/19j9bNYiIAdAf2K3WXpHOBWLFEReeOjdBYpPc9h0cgXQ/embed?size=l&slide=id.p' }
      ]
    }
  },

  /* ================= SIDE QUEST — MEMOIRE DE MASTER ==================== */
  {
    slug: 'masters-essay', kind: 'side', accent: 'g', year: '2020',
    poster: { label: 'Mémoire', figure: 'book' },
    external: SITE.links.essay,          // ce projet renvoie directement vers Notion
    fr: {
      title: 'Mémoire de master',
      client: 'ECV Digital',
      tagline: 'Un mémoire de fin d’études, hébergé sur Notion.',
      tags: ['Écriture', 'Recherche'],
      gist: { role: 'Recherche, rédaction', duration: 'Année de master', team: 'Solo', tools: 'Notion' },
      problem: 'Mon mémoire de fin d’études. Le document complet vit sur Notion plutôt que dans une étude de cas — il est fait pour être lu, pas résumé.',
      outcome: 'Le texte intégral est accessible en ligne.',
      stats: [],
      sections: [],
      isDraft: true,
      draftNote: 'Ce bloc attend un résumé du sujet et de la thèse en deux ou trois phrases. Il suffit de remplacer `problem` et `outcome` dans js/content.js.'
    },
    en: {
      title: 'Master’s essay',
      client: 'ECV Digital',
      tagline: 'A final-year dissertation, hosted on Notion.',
      tags: ['Writing', 'Research'],
      gist: { role: 'Research, writing', duration: 'Master’s year', team: 'Solo', tools: 'Notion' },
      problem: 'My final-year dissertation. The full document lives on Notion rather than as a case study — it’s meant to be read, not summarised.',
      outcome: 'The complete text is available online.',
      stats: [],
      sections: [],
      isDraft: true,
      draftNote: 'This block is waiting on a two-or-three-sentence summary of the topic and argument. Just replace `problem` and `outcome` in js/content.js.'
    }
  }
];

/* --------------------------------------------------------------------------
   5) PAGES EDITORIALES — A propos, et l'article sur les deux ans.
   `blocks` est une liste de { h, p } : un intertitre facultatif + des
   paragraphes. Le code parcourt cette liste sans rien savoir du contenu,
   donc ajouter une section = ajouter un objet ici, rien d'autre.
   -------------------------------------------------------------------------- */
export const PAGES = {

  about: {
    fr: {
      title: 'À propos',
      lede: 'Designer produit, basé à Montréal. Trois ans sur des outils de santé où l’erreur d’interface a des conséquences réelles.',
      isDraft: true,
      blocks: [
        {
          h: 'Aujourd’hui',
          p: [
            'Je conçois des interfaces pour des logiciels métier — le genre de produit qu’on n’utilise pas par plaisir mais par obligation professionnelle, huit heures par jour. Chez Petal, j’ai travaillé sur la planification hospitalière et sur le HUB, la plateforme qui synchronise les cliniques et hôpitaux du Québec.',
            'C’est un terrain qui m’a appris quelque chose que les projets grand public enseignent mal : quand votre utilisateur est un gestionnaire d’hôpital qui doit boucler un planning avant la fin de son quart, il n’explore pas votre interface. Il cherche le chemin le plus court, et si vous l’avez mal balisé, il coche la mauvaise case.'
          ]
        },
        {
          h: 'Comment je travaille',
          p: [
            'Je commence par compter. Combien de règles, combien d’étapes, combien de temps, combien de fois. Les chiffres du cadrage sont souvent le vrai livrable : sur le projet Contraintes, découvrir que la moitié des règles n’était jamais utilisée a compté davantage que n’importe quelle maquette.',
            'Ensuite je simplifie avant de dessiner. Réduire vingt-quatre règles à neuf est un travail de modélisation, pas d’interface. Dessiner un bel écran pour vingt-quatre règles redondantes n’aurait rien réglé.',
            'Et j’essaie de rester dans la pièce après la mise en production. Sur l’exclusion de services, notre première version était mal comprise par la plupart des gestionnaires. Nous ne l’avons su qu’en retestant après le déploiement. Un design qui n’est pas observé en usage réel n’est qu’une hypothèse bien présentée.'
          ]
        },
        {
          h: 'Avant',
          p: [
            'Formation en design digital à l’ECV Digital, à Paris, terminée par un mémoire et quelques projets d’équipe dont un hackathon La Poste où nous avons fini deuxièmes. Puis Montréal, une refonte complète pour Fit-Plans, et l’entrée dans le SaaS santé.'
          ]
        },
        {
          h: 'Et sinon',
          p: [
            '[À COMPLÉTER — deux ou trois phrases personnelles : ce que vous écoutez, faites, collectionnez, pratiquez. C’est la section que les recruteurs lisent en dernier et retiennent en premier. Évitez « passionné de » ; préférez un détail précis et vérifiable.]'
          ]
        },
        {
          h: 'Parlons-en',
          p: [
            'Je cherche un poste de designer produit ou UX. Si vous avez un système que personne ne comprend plus, écrivez-moi.'
          ]
        }
      ]
    },
    en: {
      title: 'About',
      lede: 'Product designer, based in Montréal. Three years on healthcare tools where an interface mistake has real consequences.',
      isDraft: true,
      blocks: [
        {
          h: 'Now',
          p: [
            'I design interfaces for enterprise software — the kind of product nobody uses for fun, but because their job requires it, eight hours a day. At Petal I worked on hospital scheduling and on the HUB, the platform that synchronises clinics and hospitals across Québec.',
            'That domain taught me something consumer projects teach badly: when your user is a hospital manager who has to finish a schedule before their shift ends, they do not explore your interface. They look for the shortest path, and if you signposted it poorly, they tick the wrong box.'
          ]
        },
        {
          h: 'How I work',
          p: [
            'I start by counting. How many rules, how many steps, how long, how often. The numbers from scoping are often the real deliverable: on the Constraints project, finding out half the rules were never used mattered more than any mockup.',
            'Then I simplify before I draw. Reducing twenty-four rules to nine is modelling work, not interface work. Drawing a beautiful screen for twenty-four redundant rules would have solved nothing.',
            'And I try to stay in the room after release. On services exclusion, our first version was misread by most managers. We only found out by retesting after deployment. A design that hasn’t been watched in real use is just a well-presented hypothesis.'
          ]
        },
        {
          h: 'Before',
          p: [
            'Digital design training at ECV Digital in Paris, closed out with a dissertation and a few team projects — including a La Poste hackathon where we came second. Then Montréal, a full redesign for Fit-Plans, and the move into healthcare SaaS.'
          ]
        },
        {
          h: 'Otherwise',
          p: [
            '[TO FILL IN — two or three personal sentences: what you listen to, make, collect, practise. This is the section recruiters read last and remember first. Avoid “passionate about”; go for one precise, verifiable detail.]'
          ]
        },
        {
          h: 'Let’s talk',
          p: [
            'I’m looking for a product or UX design role. If you have a system nobody understands anymore, get in touch.'
          ]
        }
      ]
    }
  },

  gap: {
    fr: {
      title: 'Pourquoi je n’ai pas travaillé pendant 2 ans',
      lede: 'La question va venir en entretien. Autant y répondre avant qu’on la pose.',
      isDraft: true,
      blocks: [
        {
          p: [
            'Il y a un trou de deux ans dans mon parcours. Un recruteur le verra en huit secondes, et s’il n’a pas d’explication sous la main, il en inventera une. Cette page existe pour lui éviter ce travail.'
          ]
        },
        {
          h: 'Ce qui s’est passé',
          p: [
            '[À RÉÉCRIRE — la raison, en deux ou trois phrases, sans détour ni excuse. Dites ce qui s’est passé et arrêtez-vous là. Les lecteurs sont bien plus indulgents envers un fait posé calmement qu’envers un flou qu’ils doivent combler eux-mêmes.]'
          ]
        },
        {
          h: 'Ce que j’ai fait pendant ce temps',
          p: [
            '[À RÉÉCRIRE — la partie qui compte vraiment. Listez ce qui est concret et vérifiable : lectures, projets personnels, apprentissages, responsabilités familiales, soins, déménagement, bénévolat. Trois éléments précis valent mieux que dix vagues.]'
          ]
        },
        {
          h: 'Ce que ça a changé dans ma façon de travailler',
          p: [
            '[À RÉÉCRIRE — un lien honnête avec le métier, sans forcer la leçon de vie. Si la pause vous a rendu meilleur sur un point précis, dites lequel. Si elle n’a rien changé professionnellement, dites-le aussi : c’est une réponse crédible.]'
          ]
        },
        {
          h: 'Aujourd’hui',
          p: [
            'Je cherche un poste de designer produit ou UX, à temps plein. Cette page n’est pas une excuse : c’est le contexte, donné une fois, pour qu’on puisse parler du reste.'
          ]
        }
      ]
    },
    en: {
      title: 'Why I didn’t work for 2 years',
      lede: 'The question is coming up in the interview anyway. Might as well answer it first.',
      isDraft: true,
      blocks: [
        {
          p: [
            'There is a two-year gap in my résumé. A recruiter will spot it in eight seconds, and if there is no explanation to hand, they will invent one. This page exists to save them the trouble.'
          ]
        },
        {
          h: 'What happened',
          p: [
            '[TO REWRITE — the reason, in two or three sentences, no hedging and no apology. Say what happened and stop there. Readers are far more forgiving of a fact stated calmly than of a blank they have to fill in themselves.]'
          ]
        },
        {
          h: 'What I did with the time',
          p: [
            '[TO REWRITE — the part that actually counts. List what is concrete and verifiable: reading, personal projects, things you learned, family responsibilities, caregiving, moving, volunteering. Three specific items beat ten vague ones.]'
          ]
        },
        {
          h: 'What it changed about how I work',
          p: [
            '[TO REWRITE — an honest link back to the craft, without forcing a life lesson. If the break made you better at one specific thing, name it. If it changed nothing professionally, say that too: it is a credible answer.]'
          ]
        },
        {
          h: 'Now',
          p: [
            'I’m looking for a full-time product or UX design role. This page isn’t an excuse: it’s the context, given once, so we can talk about everything else.'
          ]
        }
      ]
    }
  }
};
