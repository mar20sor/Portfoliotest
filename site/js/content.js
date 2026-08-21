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
  csRole: 'Role', csDuration: 'Duration', csTeam: 'Team', csTools: 'Tools', csCompany: 'Company', csYear: 'Year',
  csProblem: 'The problem',
  csOutcome: 'The outcome',
  csImpacts: 'Impacts',
  csOverview: 'Overview',
  csNext: 'Next project',
  csBack: 'Back',
  csProgress: 'Progress through the page',
  csSections: 'Sections on this page',
  csFigureFR: 'Figure annotated in French',
  figureSeeMore: 'See more',
  csCarouselPrev: 'Previous slide', csCarouselNext: 'Next slide',
  csCarouselDots: 'Slides', csCarouselGoTo: 'Go to slide',

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
       gist      : les lignes de metadonnees (role, duree, equipe, et
                   optionnellement outils — `tools` est facultatif ; sans
                   lui pageCase() omet simplement cette ligne, voir app.js)
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
                   moreDrawer -> { label, items: [{ title, body, image?,
                             frOnly?, caption? }] } optionnel. Regroupe des
                             etapes secondaires (pas d'entree propre dans la
                             nav laterale) derriere un <details> place a la
                             fin de CETTE section, avec son propre libelle de
                             sommaire — voir moreDrawerMarkup() dans app.js.
                   intro  -> tableau de paragraphes optionnel, affiche juste
                             sous le titre de section, avant `body` — hors du
                             systeme d'indexation par paragraphe (media[i],
                             lottieCarousel), pour du texte de tete sans media
                             associe.
                   mockups -> tableau optionnel de { image, caption, frOnly? }
                             (meme forme qu'une figure locale), rendu apres
                             tous les paragraphes dans une .media-grid — voir
                             pageCase() dans app.js.
                   stats  -> tableau optionnel de { n, l }, meme forme que le
                             `stats` racine d'un projet (chiffres d'en-tete)
                             mais rendu EN PLUS PETIT au fil d'une section
                             (modificateur .stats--sec), juste apres les
                             paragraphes — pour sortir des chiffres cites dans
                             le texte en cartes plutot que de les laisser
                             uniquement en prose. Voir pageCase() dans app.js.
   heroMedia.hideCaption -> true pour garder l'aria-label (accessibilite)
                   tout en masquant la <figcaption> visible sous le media
                   (voir mediaMarkup() dans app.js).
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
    gist: { role: 'UX / UI, research', duration: '4 months', team: '1 designer, 1 PM',
      company: { label: 'Petal', href: 'https://www.petal-health.com/en/' } },
    // The opening visual. It doubles as the card thumbnail on the homepage.
    // Local file rather than the Contra CDN id: no external dependency, and
    // it's the one visual in the repo with a matching poster frame (see
    // .cs__hero-media background in styles.css, sampled from this jpg).
    // `hideCaption` keeps the aria-label (mediaMarkup() reuses `caption` as
    // the video's accessible name) while dropping the visible <figcaption>
    // legend below the poster.
    heroMedia: { type: 'lottie', src: 'assets/media/constraint-limit.json',
      caption: 'Configuring a constraint, end to end',
      hideCaption: true },
    problem: 'Constraints are the rules applied to staff availability to build a fair schedule (ex: a member cannot work two consecutive periods). They were configured by Petal’s internal teams for hospitals because they were complicated to use and so redundant that several different rules led to the same result.',
    outcome: 'I reduced the 24 constraints to 9 by identifying the characteristics they shared, then designed a rule builder clinic managers can operate themselves without going through an agent.',
    stats: [
      { n: '24 → 9', l: 'constraints after consolidation' },
      { n: '8 → 3', l: 'for the most-used ones' }
    ],
    sections: [
      {
        id: 'audit', label: 'Process', title: '2. Process',
        body: [
          'After discussing with members of the internal team, I identified that complexity was due to a great number of rules (24 in total), leading to redundancies and frequent agent configuration errors. Mapping and categorizing most used constraints with shared outcomes allowed me to group them together.'
        ],
        /* La pile de losanges — anciennement les sections "2. Mapping" et
           "3. Benchmark" — vit maintenant derriere ce tiroir plutot que comme
           deux entrees separees de la nav laterale (demande explicite).
           `items` reprend leurs title/body/image tels quels ; le flag
           `figureDrawer` de l'image "mapping" a ete retire — elle etait deja
           cachee derriere son propre <details> imbrique, ce qui aurait
           desormais fait un tiroir dans un tiroir. Voir moreDrawerMarkup()
           dans app.js. */
        moreDrawer: {
          label: 'See more of the process',
          items: [
            {
              title: 'Mapping the 24 constraints',
              body: [
                { intro: 'I listed all 24 constraints and ranked them by usage frequency. To understand what each one acted on, I colour-coded them:',
                  tags: [
                    { color: 'green', label: 'green', text: 'for time,' },
                    { color: 'purple', label: 'purple', text: 'for tasks,' },
                    { color: 'red', label: 'red', text: 'for members and groups,' }
                  ] },
                { intro: 'Then I drew each constraint as a flow (see Flow page), to identify :',
                  list: [
                    'when key parameters are selected during setup',
                    'opportunities to batch-edit shared parameters across multiple rules'
                  ] }
              ],
              /* Embed Figma en direct (fichier "Constraints-EN (Contra)",
                 node 1:351) plutot que l'ancienne capture statique
                 constraints-2-mapping.png : on peut zoomer/deplacer dans le
                 canevas reel. Le fichier doit rester partage "Quiconque avec
                 le lien peut voir", sinon l'iframe affiche un ecran de
                 connexion a la place du canevas. Voir embedFor() dans app.js.
                 URL au format embed.figma.com/design/{file-key} (voir
                 https://developers.figma.com/docs/embeds/embed-figma-file/)
                 plutot que l'ancien www.figma.com/embed?embed_host=share&url=
                 genere par "Partager > Integrer" dans l'appli Figma : ce
                 dernier ignore silencieusement page-selector (confirme en
                 testant les deux formats cote a cote — le param retombe a 0
                 dans l'URL vers laquelle Figma redirige, quelle que soit la
                 valeur envoyee), donc le selecteur de page ne s'affichait
                 jamais malgre page-selector=true. */
              embed: 'https://embed.figma.com/design/gR8fLg7cuM7rXb1hiC0niz/Constraints-EN--Contra-?node-id=1-351&embed-host=share&page-selector=true',
              caption: 'Mapping and flow'
            },
            {
              title: 'Benchmark',
              body: [
                'With the rules simplified, the remaining question was which interface model to use. I looked at how other products let non-experts configure complex sets of rules.',
                'A rule-builder interface emerged as the optimal solution for configuring constraints, balancing flexibility and simplicity.'
              ],
              image: 'constraints-3-benchmark', frOnly: true,
              caption: 'Notion automation, Gmail’s advanced search, but also Mesh AI and Equina Scheduling which are constraint configuring softwares for hospitals.'
            }
          ]
        }
      },
      {
        id: 'design', label: 'Solution', title: '3. Solution',
        /* `intro` s'affiche directement sous le titre de section, avant
           `body` — separe du systeme body/media/carousel indexe par
           paragraphe (voir plus bas) parce que cette phrase n'a pas de
           media associe et doit rester au tout debut, quel que soit ce
           qui est ajoute/retire dans `body` par la suite. Les deux elements
           partagent un seul <p>, separes par un <br> (voir pageCase() dans
           app.js) plutot que deux <p> distincts. */
        intro: [
          'Several principles guided the interface design : '
        ],
        body: [],
        /* Les quatre principes, en liste a puces (ul/li) plutot qu'un
           paragraphe : rendue juste apres `intro`, comme l'ancien body[0]
           qu'elle remplace ("Four principles drove the interfaces." retiree,
           la phrase d'intro annonce deja la liste). */
        list: [
          { title: 'Progressive disclosure', body: 'Characteristics only appear when they are needed' },
          { title: 'Pre-selection', body: 'The most common options are preselected by default.' },
          { title: 'Stepper', body: 'The process is split into steps to stay digestible.' },
          { title: 'Visual contextual helpers', body: 'Illustrations sit alongside configuration to reduce errors.' }
        ],
        /* Deux captures exportees depuis Figma (node 46:1093, "Images"),
           montrant l'interface de configuration reelle plutot que les
           anciennes captures Contra du media[] retire. Locales (assets/img/,
           paire webp+png comme les figures extraites des PDF) plutot que
           distantes : meme raisonnement que pour heroMedia, pas de
           dependance externe. Rendues apres tous les paragraphes (voir
           pageCase() dans app.js) via figureFor(), regroupees dans une
           .media-grid — puis le widget interactif juste en dessous. */
        mockups: [
          { image: 'constraints-solution-list', caption: 'Constraints list' },
          { image: 'constraints-solution-configure', caption: 'Configure a constraint' }
        ],
        /* Carrousel des 4 illustrations animees : un seul JSON Lottie visible
           a la fois, choisi en cliquant son libelle (figma node 34:817).
           N'est plus rattache a un paragraphe de body[] (deplace apres le
           widget interactif, voir `helpers` plus bas) : ce n'est pas une
           grille statique mais un etat exclusif (voir
           lottieCarouselMarkup()/setupLottieCarousel() dans app.js). */
        lottieCarousel: [
          { src: 'assets/media/Blocking-complete lottie.json', label: 'Blocking' },
          { src: 'assets/media/Protection-(hollow).json', label: 'Protection' },
          { src: 'assets/media/Spacing lottie.json', label: 'Spacing' },
          { src: 'assets/media/Availability.json', label: 'Availability' }
        ],
        /* Widget interactif : le "sentence builder". N'est PAS un media (voir
           constraintBuilderMarkup()/setupConstraintBuilder() dans app.js) :
           rendu apres la figure des mockups, pas entre deux paragraphes,
           donc en dehors du systeme media[]/mediaGroup(). L'intro ne
           renvoie plus a "the direction described above" (le paragraphe qui
           la decrivait a ete retire) : reformulee pour rester autonome.
           `caption` remplace l'ancien `title` : affiche sous le widget,
           comme une figcaption, plutot qu'en kicker au-dessus. */
        builder: {
          caption: 'Interactive rule-builder',
          intro: 'Configuring a rule restates it as a plain-language sentence — try it below, editable.',

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
          },
          /* Second widget, sous le rule-builder (voir componentsShowcaseMarkup()/
             setupComponentsShowcase() dans app.js) : pas une phrase composee,
             mais quatre champs autonomes (physiciens, contrainte, taches,
             periode) qui reprennent les memes listes que `builder` ci-dessus
             (physicians/constraints/tasks/days) — seules les listes propres a
             ce widget (groupes, gardes, periodes nommees) sont definies ici.
             Reference Figma : fichier "Claude-portfolio-image-generation",
             frame "Components" (node 52:1781) pour l'apparence, frame
             "Interactive components" (node 21:797) pour le comportement. */
          components: {
            caption: 'Component reflect real use cases in hospital',
            intro: 'Each field owns its own search, multi-select and validation — this is what the pieces look like on their own.',
            // `size` : nombre de physiciens que contient chaque groupe, pour
            // le total affiche dans le declencheur (voir physicianTriggerHTML,
            // app.js) quand physiciens ET groupes sont selectionnes en meme
            // temps. Purement illustratif — il n'y a pas de roster reel de
            // cette taille derriere (seuls les 4 physiciens de builder.physicians
            // ci-dessus existent nommement dans cette demo).
            groups: [
              { value: 'floor-2-team',  label: 'Floor 2 team', size: 6 },
              { value: 'on-call-pool',  label: 'On-call pool', size: 9 },
              { value: 'night-coverage', label: 'Night coverage', size: 4 }
            ],
            shifts: [
              { value: 'day-shift',    label: 'Day shift' },
              { value: 'evening-shift', label: 'Evening shift' },
              { value: 'night-shift',  label: 'Night shift' }
            ],
            periods: [
              { value: 'week-a',       label: 'Week A' },
              { value: 'week-b',       label: 'Week B' },
              { value: 'custom-range', label: 'Custom range' }
            ]
          }
        },
        /* Rendu apres le widget interactif (voir pageCase() dans app.js) :
           titre en gras (meme taille que le paragraphe, pas de kicker
           dedie) suivi du texte, puis le carrousel des 4 Lottie. */
        helpers: {
          title: 'Visual helpers :',
          body: 'I created animated abstract illustrations, both to make each constraint identifiable  and to represent visually what it does.'
        }
      },
      {
        id: 'takeaways', label: 'Takeaways', title: '4. Takeaways',
        intro: [
          'Working across 24 rules (more data points than I usually get) was a chance to exercise thematic analysis and systems thinking on a bigger scale.',
          'If I did it again, I would flip the order : start from usage frequency and scope by impact first, even though I don\'t regret the path I took, but that\'s the lesson.'
        ],
        body: []
      }
    ]
  },

  /* ================== PETAL — EXCLUSION DES SERVICES ==================== */
  {
    slug: 'services-exclusion', kind: 'work', accent: 'b', year: '2024',
    poster: { label: 'Ship. Watch. Fix.', figure: 'wizard' },
    title: 'Services exclusion',
    client: 'Petal',
    tagline: 'Designing, then fixing a **4-step** wizard to bring clarity to hospital managers.',
    tags: ['Wizard', 'User testing', 'Iteration'],
    gist: { role: 'UX / UI', duration: '3 months', team: '1 dev, 1 designer, 1 PM, 1 technical writer',
      company: { label: 'Petal', href: 'https://www.petal-health.com/en/' } },
    problem: 'In the HUB, some services are no longer used, or only temporarily (like a seasonal flu clinic). They skew a clinic’s statistics, but can only be deleted in the EMR, which is a heavy procedure for medical staff. So they needed to be excluded from synchronization setup without being deleted, inside a modal already carrying many steps.',
    outcome: 'A clearer four-step wizard that makes exclusion explicit. After release surfaced a usage error we hadn’t anticipated. So we inverted the selection logic and added a warning to make sure it was well used.',
    sections: [
      {
        id: 'kickoff', label: 'Context', title: '1. Context : the current synchronization flow',
        body: [
          'Synchronization is the process of importing hospitals data (appointments, patients, services and suppliers) through their EMR, at Québec’s scale. It’s only during this process that staff members can edit their services through a modal.'
        ],
        // Export SVG direct de Figma (node 114:10812, meme fichier que la
        // maquette) : le schema du flux de synchronisation.
        image: 'exclusion-1-context-en.svg', bare: true,
        caption: 'HUB synchronisation : exclusion and deactivation are added to the service configuration step.',
        afterFigure: [
          'During that process, managers were only configuring the services that would be active, the others were deactivated.'
        ]
      },
      {
        id: 'design', label: 'Concept', title: '2. First concept',
        body: [
          'We introduced **exclusion** as an additional step separated from **deactivation** to bring clarity.',
          'Operations are explained, and it’s possible to go back through the process in case of error. What could go wrong ?'
        ],
        aside: [
          { term: 'Exclusion', body: 'Services brought out of synchronization and stats, they can only be reactivated manually.' },
          { term: 'Deactivation', body: 'Temporary unused service, can be reactivated through sync if necessary.' }
        ],
        // Avant : l'ancien ecran a une seule etape (Figma node 112:3873,
        // export PNG@2x -> webp, comme le reste des figures locales : les
        // exports SVG directs de ces captures denses pesaient 500-870Ko
        // chacun et ralentissaient le rendu).
        image: 'exclusion-2-before-en', bare: true,
        caption: 'Before: only one step configuration',
        // Apres : les 4 etapes du nouveau wizard (section "Caroussel",
        // Figma node 116:10862, exportees individuellement en PNG@2x/webp)
        // — un carrousel plutot que 4 figures empilees. Voir
        // carouselMarkup()/setupImageCarousel() dans app.js.
        carousel: [
          { image: 'exclusion-2-step1-en', caption: 'Step 1 — Excluded services' },
          { image: 'exclusion-2-step2-en', caption: 'Step 2 — Deactivated services' },
          { image: 'exclusion-2-step3-en', caption: 'Step 3 — Active services' },
          { image: 'exclusion-2-step4-en', caption: 'Step 4 — Confirmation' }
        ]
      },
      {
        id: 'ship', label: 'Problem', title: '3. A new problem arises',
        body: [
          'After release, an issue showed up :'
        ],
        callout: {
          text: 'Managers were clicking “select all” as a reflex without reading through, excluding every single service from synchronization ...'
        }
      },
      {
        id: 'iterate', label: 'Fixes', title: '4. Fixes',
        intro: ['Three fixes :'],
        bullets: [
          'Removed “select all” from the inactive services list.',
          'Inverted the logic: the user now unchecks the services they want to exclude, which makes the action deliberate.',
          'Added a warning showing how many services are about to be excluded.'
        ],
        body: [],
        image: 'exclusion-4-test-en', bare: true,
        caption: 'After the fixes'
      },
      {
        id: 'takeaways', label: 'Takeaways', title: '5. Takeaways',
        body: [
          'This is the project I bring up most readily in interviews. Not because the first version was good, but because the testing setup caught a mistake before it cost somebody their data.'
        ]
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
          'Three further numbers shaped what came next, isolating how people actually use the platform day to day.',
          'Our conclusion: Soundcloud is seen as an alternative to Spotify, Deezer or Apple Music rather than a primary service, and the app is used far more than the site. So the priority was the web interface, and the comments feature in particular.'
        ],
        // Les trois chiffres de la phrase precedente, sortis en cartes plutot
        // que laisses dans le paragraphe — reprend le "component boxes" de la
        // page source (marvinsrd.com/en/soundcloud-project), rendu avec le
        // composant .stats deja utilise pour les chiffres d'en-tete (voir
        // s.stats dans app.js/pageCase(), modificateur .stats--sec).
        stats: [
          { n: '29.7%', l: 'use another platform because they think it’s better' },
          { n: '70%', l: 'go through the search bar — they already know what they came to hear' },
          { n: '43.9%', l: 'of weekly users listen 11 to 30 minutes per session' }
        ],
        // Les deux visuels du calcul SUS (diapositives "SUS_UX_Calcul" et
        // "SUS_UX_Scale" de la page source) : le detail du calcul UMUX -> SUS,
        // puis Soundcloud replace sur l'echelle d'acceptabilite. Legendes
        // volontairement muettes sur le chiffre exact (69,27 sur la diapo
        // source contre 69.57 dans le texte ci-dessus, un ecart d'arrondi du
        // document d'origine) pour ne pas contredire le corps du texte.
        mockups: [
          { image: 'soundcloud-sus-calc', caption: 'The UMUX-to-SUS calculation, from the two averaged questionnaire scores.' },
          { image: 'soundcloud-sus-scale', caption: 'Soundcloud plotted on the SUS acceptability scale — high-marginal, next to Excel and old GPS units.' }
        ]
      },
      {
        id: 'tests', label: 'Testing', title: '2. User testing',
        body: [
          'We built a test scenario on the desktop version around three missions: find a specific artist and track, to assess where the search bar sits; start playback, the site’s primary function; and leave a comment at a specific moment in the track, the exclusive feature. Every tester got the same scenario, and was asked to narrate their actions out loud.',
          'Across six testers, some of whom had never used the site, the results:',
          'The positives were clear — finding a track is easy, and the play button is large enough to find without thinking. The negatives were just as clear: only people who already knew the platform managed to leave a comment, and there was recurring confusion between the artist page and search results.',
          'The most useful insight: users expected to comment the way they do on YouTube. They looked for a field under the player, not an interaction on the waveform.'
        ],
        stats: [
          { n: '83%', l: 'mission success rate' },
          { n: '1', l: 'dropoff, across six testers' },
          { n: '30s–1min', l: 'to complete each mission' }
        ]
      },
      {
        id: 'solution', label: 'Solution', title: '3. Solution',
        body: [
          'We prototyped the fixes to make them manipulable rather than merely describable. Then I reworked the artist page, lifting the comment section up the right-hand side, level with the player, so it is visible without scrolling and reads like a conversation in progress.'
        ],
        image: 'soundcloud-solution-design',
        caption: 'The redesigned artist page: comments move up the right-hand side, level with the player.'
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
