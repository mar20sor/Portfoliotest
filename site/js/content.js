/* ==========================================================================
   content.js — TOUT le texte du site (anglais uniquement).
   --------------------------------------------------------------------------
   POURQUOI UN SEUL GROS FICHIER DE DONNEES ?
   Le site est une "SPA" (Single Page Application) : le navigateur telecharge
   une seule fois tout le contenu, puis change de page instantanement sans
   jamais recontacter le serveur. Separer le CONTENU (ici) du CODE (app.js)
   permet de corriger une faute de frappe sans jamais toucher a la logique.

   COMMENT MODIFIER LE SITE ?
   99% du temps, c'est ici : changer un texte, ajouter un projet.

   `export` = ce fichier est un "module" ES : il rend la variable CONTENT
   disponible pour les autres fichiers qui font `import`.

   NOTE HISTORIQUE : ce fichier portait auparavant un bloc `fr:` et un bloc
   `en:` par entree (site bilingue). Le support francais a ete retire — voir
   `french-translation.md` a la racine du depot pour une archive complete du
   texte francais tel qu'il existait avant ce changement.
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
   1 bis) LES MEDIAS HEBERGES SUR CONTRA
   --------------------------------------------------------------------------
   Les vidéos et images du projet Contraintes viennent de la page Contra de
   Marvin. Elles ne sont PAS dans ce dépôt : le code pointe vers le CDN de
   Contra.

   >>> CE QUE ÇA IMPLIQUE <<<
   Si le projet est supprimé, renommé, ou si Contra change ses URLs, ces
   médias disparaissent du site sans prévenir. C'est la contrepartie assumée
   de ne pas avoir à héberger les fichiers.

   >>> POUR PASSER EN LOCAL PLUS TARD <<<
   1. Télécharger les fichiers depuis Contra.
   2. Les poser dans site/assets/media/ en gardant les identifiants ci-dessous
      comme noms de fichier (ex : fwfmk99wycaup34crhb4.mp4).
   3. Remplacer les deux bases ci-dessous par 'assets/media/'.
   4. Retirer media.contra.com de la CSP dans index.html.
   Rien d'autre à changer : tout le site passe par ces deux constantes.
   -------------------------------------------------------------------------- */
export const MEDIA = {
  videoBase: 'https://media.contra.com/video/upload/fl_progressive/q_auto:best,w_900/',
  imageBase: 'https://media.contra.com/image/upload/fl_progressive/q_auto:best/',
  videoExt: '.mp4',
  imageExt: '.webp'
};

/* --------------------------------------------------------------------------
   2) LIBELLES D'INTERFACE — tous les mots qui ne sont pas du "contenu"
   (boutons, titres de sections, messages du formulaire...).
   -------------------------------------------------------------------------- */
export const UI = {
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
  csOverview: 'Overview',
  csNext: 'Next project',
  csBack: 'Back',
  csProgress: 'Progress through the page',
  csSections: 'Sections on this page',
  csFigureFR: 'Figure annotated in French',
  figureSeeMore: 'See more',

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
};

/* --------------------------------------------------------------------------
   4) LES PROJETS
   --------------------------------------------------------------------------
   Structure de chaque projet :
     slug      : identifiant dans l'URL (#/work/constraints)
     kind      : 'work' (experience pro) ou 'side' (projet a cote)
     accent    : couleur du poster, piochee dans les variables CSS
     poster    : { label, figure } -> texte affiche sur l'affiche generee
     title, client, tagline, tags, gist, problem, outcome, stats, sections :
       tout le contenu redactionnel.
       gist      : les 4 lignes de metadonnees (role, duree, equipe, outils)
       problem   : 1-2 phrases. Le "pourquoi ce projet existe".
       outcome   : 1-2 phrases. Le "qu'est-ce qui a change".
       stats     : chiffres marquants (facultatif) — c'est ce qu'un recruteur retient
       sections  : le processus detaille. Chaque section = une entree de la nav laterale.
                   image  -> nom de fichier dans assets/img (sans extension)
                   frOnly -> true si l'image n'existe qu'annotee en francais
                             (visuel d'origine, pas de version anglaise disponible ;
                             une mention le signale sous la figure, voir figureFor()
                             dans app.js)
                   figureDrawer -> true pour cacher la figure derriere un
                             <details> "See more" plutot que l'afficher
                             directement (voir figureFor() dans app.js)
   -------------------------------------------------------------------------- */
export const PROJECTS = [

  /* ===================== PETAL — CONTRAINTES ============================ */
  {
    slug: 'constraints', kind: 'work', accent: 'a', year: '2023',
    poster: { label: '24 → 9', figure: 'rules' },
    title: 'Scheduling constraints',
    client: 'Petal',
    tagline: 'Redesigning a rule-making engine, reducing rules from **24 to 9**.',
    tags: ['Systems design', 'Research', 'Healthcare SaaS'],
    gist: { role: 'UX / UI, research', duration: '4 months', team: '1 designer, 1 PM', tools: 'Figma, Jitter, interviews' },
    // The opening visual. It doubles as the card thumbnail on the homepage.
    // Local file rather than the Contra CDN id: no external dependency, and
    // it's the one visual in the repo with a matching poster frame (see
    // .cs__hero-media background in styles.css, sampled from this jpg).
    heroMedia: { type: 'video', src: 'assets/media/constraint-limit.mp4',
      poster: 'assets/media/constraint-limit.jpg', caption: 'Configuring a constraint, end to end' },
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
        image: 'constraints-2-mapping', frOnly: true, figureDrawer: true,
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
          'I created animated abstract illustrations, both to make each constraint identifiable at a glance and to represent visually what it does.',
          'Four principles drove the interfaces. Characteristics only appear when they are needed (progressive disclosure). The most common options are preselected by default. The process is split into steps to stay digestible. Contextual help and illustrations sit alongside configuration to reduce errors.',
          'I explored two directions. The first shows parameters and result side by side. The second shows parameters contextually and restates the rule as a plain-language sentence — “Marc Tremblay cannot be assigned to Care - Floor 2 from Monday to Friday.” That sentence is the important piece: it lets a manager verify what they just built without re-reading every field.',
          'I also looked at configuring several rules in a single pass, to speed up setting up a whole facility.'
        ],
        /* `media` place des visuels APRÈS un paragraphe précis : la clé est
           l'index du paragraphe (0 = le premier). C'est ce qui permet de
           respecter l'ordre de la page Contra — illustrations, puis
           principes, puis captures — sans découper la section en deux. */
        media: {
          2: [
            { type: 'image', id: 'ytoa4swb5caon0onh5yb', caption: 'Constraints list' },
            { type: 'image', id: 'mcpbonwlpodke4hgyjaq', caption: 'Constraint configuration' },
            { type: 'image', id: 'qkmo6j2mbfagfqbt0hti', caption: 'Components' }
          ]
        },
        /* Carrousel des 4 illustrations animees (paragraphe 0, meme place que
           l'ancien media[0]) : un seul JSON Lottie visible a la fois, choisi
           en cliquant son libelle (figma node 34:817). N'est pas dans
           media[] : ce n'est plus une grille statique mais un etat exclusif
           (voir lottieCarouselMarkup()/setupLottieCarousel() dans app.js). */
        lottieCarousel: [
          { src: 'assets/media/Blocking-complete lottie.json', label: 'Blocking' },
          { src: 'assets/media/Protection-(hollow).json', label: 'Protection' },
          { src: 'assets/media/Spacing lottie.json', label: 'Spacing' },
          { src: 'assets/media/Availability.json', label: 'Availability' }
        ],
        /* Widget interactif : le "sentence builder" decrit au paragraphe 3
           ("...restates the rule as a plain-language sentence..."). N'est
           PAS un media (voir constraintBuilderMarkup()/setupConstraintBuilder()
           dans app.js) : rendu apres la figure des mockups, pas entre deux
           paragraphes, donc en dehors du systeme media[]/mediaGroup(). */
        builder: {
          title: 'Try the sentence-builder direction',
          intro: 'A simplified version of the second direction described above — the same example from the paragraph, editable.',

          physicians: [
            { value: 'marc-tremblay', label: 'Marc Tremblay' },
            { value: 'jean-dupont',   label: 'Jean Dupont' },
            { value: 'isabelle-roy',  label: 'Isabelle Roy' },
            { value: 'david-chen',    label: 'David Chen' }
          ],
          // max 4 (voir builder.maxTasks) : autant de taches selectionnees que
          // de losanges affiches dans l'illustration (un losange par tache).
          tasks: [
            { value: 'care-floor-2',    label: 'Care - Floor 2' },
            { value: 'diag-floor-2',    label: 'Diag - Floor 2' },
            { value: 'triage-floor-1',  label: 'Triage - Floor 1' },
            { value: 'post-op-floor-3', label: 'Post-Op - Floor 3' }
          ],
          maxTasks: 4,
          // Seul 'limit' est selectionnable dans cette demo — c'est le seul
          // etat pour lequel la maquette Figma fournit une illustration
          // complete (empilement de losanges + libelles Time/Tasks, node
          // 18:383), donc le seul qu'on peut reproduire a l'identique. Les 3
          // autres restent visibles dans la liste (fidele au composant Figma
          // node 18:254) et cliquables, mais la selection ne change jamais
          // (voir selectConstraint() dans app.js) : cliquer dessus ferme
          // juste le menu, "Limit" reste actif.
          // `predicate` se compose comme "PHYSICIEN <predicate> the task
          // TACHE" (voir constraintRecapHTML() et le "the task" statique
          // dans constraintBuilderMarkup(), app.js) : chaque predicate doit
          // donc se terminer par sa propre preposition, sinon la phrase
          // duplique "to" ou tombe a plat selon le type choisi.
          constraints: [
            { value: 'spacing', name: 'Spacing', predicate: 'will be spaced from',
              description: 'The spacing constraint separates two tasks.',
              icon: 'assets/icons/constraint-spacing.svg' },
            { value: 'limit', name: 'Limit', predicate: 'will be limited to',
              description: 'The limit constraint restricts task assignment.',
              icon: 'assets/icons/constraint-limit.svg' },
            { value: 'blocking', name: 'Blocking', predicate: 'will be blocked from',
              description: 'The blocking constraint excludes simultaneous assignment.',
              icon: 'assets/icons/constraint-blocking.svg' },
            { value: 'protection', name: 'Protection', predicate: 'will be reserved for',
              description: 'The protection constraint reserves a task for a time block.',
              icon: 'assets/icons/constraint-protection.svg' }
          ],
          days: [
            { value: 'mon', label: 'Mon', full: 'Monday' },
            { value: 'tue', label: 'Tue', full: 'Tuesday' },
            { value: 'wed', label: 'Wed', full: 'Wednesday' },
            { value: 'thu', label: 'Thu', full: 'Thursday' },
            { value: 'fri', label: 'Fri', full: 'Friday' },
            { value: 'sat', label: 'Sat', full: 'Saturday' },
            { value: 'sun', label: 'Sun', full: 'Sunday' }
          ],
          // Limit par defaut (seul type selectionnable) ; le reste reste
          // l'exemple du paragraphe ci-dessus. `tasks` est un tableau (multi-
          // selection, voir maxTasks) meme si une seule tache est cochee par
          // defaut.
          default: {
            physician: 'marc-tremblay',
            constraint: 'limit',
            tasks: ['care-floor-2'],
            days: ['mon', 'tue', 'wed', 'thu', 'fri']
          }
        }
      }
    ]
  },

  /* ================== PETAL — EXCLUSION DES SERVICES ==================== */
  {
    slug: 'services-exclusion', kind: 'work', accent: 'b', year: '2024',
    poster: { label: 'Ship. Watch. Fix.', figure: 'wizard' },
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
        image: 'exclusion-1-kickoff-en',
        caption: 'The HUB synchronisation journey. Exclusion attaches to the service configuration step.'
      },
      {
        id: 'design', label: 'Design', title: '2. Design',
        body: [
          'The real challenge wasn’t technical. Managers are only used to configuring the services that will be active. We had to make them understand they could also deactivate and exclude unused ones — without making an already dense interface denser.',
          'I split the process into explicitly named steps: excluded services, inactive services, active services, confirmation. Explanatory copy sits with each step, modified services stay selectable, and a final screen summarises what is about to happen before confirmation.'
        ],
        image: 'exclusion-2-design-en',
        caption: 'Before / after. The single screen becomes a wizard where every step has a name.'
      },
      {
        id: 'ship', label: 'Release', title: '3. Handoff and release',
        body: [
          'After review, the design went to development. I worked alongside the developer to make sure what shipped matched the intent — not just the mockups.',
          'Then the problem showed up. We had added a checkbox to select which services to exclude. Managers did not read it the way we had imagined.'
        ],
        image: 'exclusion-3-ship-en',
        caption: 'The inline feedback confirming a service has been excluded.'
      },
      {
        id: 'iterate', label: 'Iteration', title: '4. Testing and back to design',
        body: [
          'We ran the exclusion and deactivation process again with several clinics. The finding was unambiguous: most managers clicked the “select all” box automatically, excluding every single service from synchronisation. A reflex, not a decision.',
          'Three fixes. We removed “select all” from the inactive services list. We inverted the logic: the user now unchecks the services they want to exclude, which makes the action deliberate. And we added a warning showing how many services are about to be excluded.',
          'This is the project I bring up most readily in interviews. Not because the first version was good, but because the testing setup caught a mistake before it cost somebody their data.'
        ],
        image: 'exclusion-4-test-en',
        caption: 'After iteration: the warning counts excluded services to reduce the risk of error.'
      }
    ]
  },

  /* ===================== PETAL — TRANSFERT DE DME ======================= */
  {
    slug: 'emr-transfer', kind: 'work', accent: 'c', year: '2024',
    poster: { label: 'Attendre, mais voir', figure: 'steps' },
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
  },

  /* ========================== FIT-PLANS ================================= */
  {
    slug: 'fit-plans', kind: 'work', accent: 'd', year: '2020',
    poster: { label: '6 → 3', figure: 'flow' },
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
  },

  /* ========================== SOUNDCLOUD ================================ */
  {
    slug: 'soundcloud', kind: 'work', accent: 'e', year: '2020',
    poster: { label: 'SUS 69,57', figure: 'gauge' },
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
  },

  /* ===================== SIDE QUEST — HOOT ============================= */
  {
    slug: 'hoot', kind: 'side', accent: 'f', year: '2019',
    poster: { label: '2ᵉ / hackathon', figure: 'owl' },
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
  },

  /* ================= SIDE QUEST — MEMOIRE DE MASTER ==================== */
  {
    slug: 'masters-essay', kind: 'side', accent: 'g', year: '2020',
    poster: { label: 'Mémoire', figure: 'book' },
    external: SITE.links.essay,          // ce projet renvoie directement vers Notion
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
];

/* --------------------------------------------------------------------------
   5) PAGES EDITORIALES — A propos, et l'article sur les deux ans.
   `blocks` est une liste de { h, p } : un intertitre facultatif + des
   paragraphes. Le code parcourt cette liste sans rien savoir du contenu,
   donc ajouter une section = ajouter un objet ici, rien d'autre.
   -------------------------------------------------------------------------- */
export const PAGES = {

  about: {
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
  },

  gap: {
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
};
