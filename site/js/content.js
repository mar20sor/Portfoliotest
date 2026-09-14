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
  /* Court, contrairement a footerResume ("Download my resume") : dans la
     barre il est a cote de Contact, et deux verbes cote a cote allongent la
     ligne sans rien ajouter. Meme fichier au bout des deux. */
  navResume: 'Resume',

  helloBefore: 'Hey',
  helloAfter: ', nice to meet you!',
  helloAnon: 'Hey, nice to meet you!',
  workTitle: 'Work',
  workIntro: 'Three years of healthcare SaaS, plus a few playgrounds. Every case study reads in 30 seconds; the detail is there if you want to dig.',
  sideTitle: 'Side quests',
  sideIntro: 'The things that don’t fit under “work experience” but still count.',
  aboutTitle: 'About',

  /* La pastille qui remplace le pointeur au survol d'une vignette d'accueil
     (setupCursorPill). CET EFFET EST DESACTIVE : ces deux libelles ne sont
     donc lus par personne pour l'instant. On les garde — ils se rallument
     avec lui, et une chaine d'interface supprimee est une chaine a reecrire.
     Toutes les cartes des deux listes mènent a une etude
     de cas — les "side quests" aussi, rendues par le meme pageCase() — donc
     un seul libelle suffit. Le jour ou une carte pointerait ailleurs (un lien
     externe, que projectCard() sait deja rendre), il faudrait le choisir par
     carte plutot qu'ici. */
  cardCursor: 'View case study',
  /* Meme pastille, dans les etudes de cas, sur les visuels agrandissables.
     Ecrits en minuscules ici et passes en capitales par le CSS
     (text-transform) : la casse est une affaire d'apparence, et la garder
     hors des chaines evite d'avoir a la refaire a la main le jour ou l'on
     traduit, ou de se retrouver avec DEUX conventions dans ce fichier. */
  zoomCursor: 'Zoom',

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
  /* Etiquette d'une case de la planche synchronisee (article salsa) : elle
     sert d'aria-label du bouton ET de legende du temps courant, lue a voix
     haute par aria-live. Un seul mot, mais il est affiche : il vit donc ici
     avec les autres libelles d'interface, pas en dur dans app.js. */
  beatSyncBeat: 'beat',
  /* Les deux commandes des lecteurs video. Le libelle dit L'ACTION a
     declencher, pas l'etat courant : "Play" quand c'est en pause, "Sound on"
     quand c'est muet. C'est la convention d'un bouton, et aria-pressed porte
     l'etat.
     `player` et non `beatSync` : ces libelles servent aux DEUX lecteurs de
     l'article — la planche synchronisee et la video de "So what is a
     move?" (voir mediaControlsMarkup() dans app.js). */
  playerPlay: 'Play', playerPause: 'Pause',
  playerSoundOn: 'Sound on', playerSoundOff: 'Sound off',
  /* Bouton de vitesse de la planche synchronisee (El Tiburon) uniquement —
     voir beatSyncMarkup()/setupBeatSync() dans app.js. Meme convention que les
     deux au-dessus : le libelle dit l'action a declencher. */
  playerSpeedHalf: 'Half speed', playerSpeedNormal: 'Normal speed',

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
    tagline: 'Redesigning a rule engine: from 24 rules to 9',
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
      { n: '24 → 9', l: 'constraints after consolidation' }
    ],
    sections: [
      {
        id: 'audit', label: 'Process', title: 'Process',
        headline: 'From kickoff to exploration',
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
              // zoomable: 'mobile' (voir figureFor() dans app.js) : capture
              // dense a la largeur d'une colonne mobile — clic pour zoomer/
              // parcourir. Pas besoin sur desktop, deja assez large.
              image: 'constraints-3-benchmark', frOnly: true, zoomable: 'mobile',
              caption: 'Notion automation, Gmail’s advanced search, but also Mesh AI and Equina Scheduling which are constraint configuring softwares for hospitals.'
            }
          ]
        }
      },
      {
        id: 'design', label: 'Solution', title: 'Solution',
        headline: 'Display only relevant information according to the context',
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
        // zoomable: 'mobile' sur les 2 (voir figureFor() dans app.js) : pas
        // besoin sur desktop, deja assez large.
        mockups: [
          { image: 'constraints-solution-list', caption: 'Constraints list', zoomable: 'mobile' },
          { image: 'constraints-solution-configure', caption: 'Configure a constraint', zoomable: 'mobile' }
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
      },
      {
        /* Les illustrations animees etaient un sous-bloc "Visual helpers" a la
           fin de la section Solution. Elles ont maintenant leur propre etape :
           elles ne decrivent pas la solution livree, elles racontent ce qui a
           ete ajoute ensuite pour la rendre lisible. */
        id: 'helpers', label: 'Iteration', title: 'Iteration',
        headline: 'Animations as visual helpers',
        body: [
          'I created animated abstract illustrations, both to make each constraint identifiable  and to represent visually what it does.'
        ],
        /* Carrousel des 4 illustrations animees : un seul JSON Lottie visible
           a la fois, choisi en cliquant son libelle (figma node 34:817). Ce
           n'est pas une grille statique mais un etat exclusif (voir
           lottieCarouselMarkup()/setupLottieCarousel() dans app.js). */
        lottieCarousel: [
          { src: 'assets/media/Blocking-complete lottie.json', label: 'Blocking' },
          { src: 'assets/media/Protection-(hollow).json', label: 'Protection' },
          { src: 'assets/media/Spacing lottie.json', label: 'Spacing' },
          { src: 'assets/media/Availability.json', label: 'Availability' }
        ]
      },
      {
        id: 'takeaways', label: 'Takeaways', title: 'Takeaways',
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
    // Cover statique d'origine. Plusieurs essais de fond anime (degrade CSS,
    // video fournie par l'utilisateur avec boucle corrigee en boomerang,
    // <canvas> en JS) sont restes dans l'historique de conversation sans
    // convaincre — revenu ici a l'image fixe de depart.
    heroMedia: { type: 'image', src: 'assets/img/exclusion-hero.webp' },
    problem: 'In the HUB, some services are no longer used, or only temporarily (like a seasonal flu clinic). They skew a clinic’s statistics, but can only be deleted in the EMR, which is a heavy procedure for medical staff. So they needed to be excluded from synchronization setup without being deleted, inside a modal already carrying many steps.',
    outcome: 'A clearer four-step wizard that makes exclusion explicit. After release surfaced a usage error we hadn’t anticipated. So we inverted the selection logic and added a warning to make sure it was well used.',
    sections: [
      {
        id: 'kickoff', label: 'Context', title: 'Context',
        // headline : la seconde ligne du titre, sous l'etiquette. Voir
        // .cs-sec__headline dans styles.css — c'est elle qui porte la grosse
        // typo, le titre au-dessus n'etant plus qu'un sur-titre.
        headline: 'The current synchronization flow',
        body: [
          'Synchronization is the process of importing hospitals data (appointments, patients, services and suppliers) through their EMR, at Québec’s scale. It’s only during this process that staff members can edit their services through a modal.'
        ],
        // Export SVG direct de Figma (node 114:10812, meme fichier que la
        // maquette) : le schema du flux de synchronisation.
        // zoomable: 'mobile' (voir figureFor() dans app.js) : le schema est
        // dense a la largeur d'une colonne mobile — clic pour zoomer/
        // parcourir. Pas besoin sur desktop, deja assez large.
        image: 'exclusion-1-context-en.svg', bare: true, zoomable: 'mobile',
        caption: 'HUB synchronisation : exclusion and deactivation are added to the service configuration step.',
        afterFigure: [
          'During that process, managers were only configuring the services that would be active, the others were deactivated.'
        ]
      },
      {
        id: 'design', label: 'Solution', title: 'Solution',
        headline: 'The first concept',
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
        // zoomable: 'mobile' (voir figureFor() dans app.js) : meme besoin
        // que exclusion-1-context-en ci-dessus.
        image: 'exclusion-2-before-en', bare: true, zoomable: 'mobile',
        caption: 'Before: only one step configuration',
        // Apres : les 4 etapes du nouveau wizard (section "Caroussel",
        // Figma node 116:10862, exportees individuellement en PNG@2x/webp)
        // — un carrousel plutot que 4 figures empilees. Voir
        // carouselMarkup()/setupImageCarousel() dans app.js.
        // zoomable: 'mobile' sur chaque panneau (voir carouselMarkup() dans
        // app.js) : pas besoin sur desktop, deja assez large. Le glissement
        // du carrousel se coupe automatiquement pendant qu'un panneau est
        // zoome (voir stopPropagation dans setupZoomableMedia()).
        carousel: [
          { image: 'exclusion-2-step1-en', caption: 'Step 1 — Excluded services', zoomable: 'mobile' },
          { image: 'exclusion-2-step2-en', caption: 'Step 2 — Deactivated services', zoomable: 'mobile' },
          { image: 'exclusion-2-step3-en', caption: 'Step 3 — Active services', zoomable: 'mobile' },
          { image: 'exclusion-2-step4-en', caption: 'Step 4 — Confirmation', zoomable: 'mobile' }
        ]
      },
      {
        id: 'ship', label: 'Problem', title: 'Problem',
        headline: 'A new issue arises',
        body: [
          'After release, an issue showed up :'
        ],
        callout: {
          text: 'Managers were clicking “select all” as a reflex without reading through, excluding every single service from synchronization ...'
        }
      },
      {
        id: 'iterate', label: 'Iteration', title: 'Iteration',
        headline: 'Adapt the solution to users',
        intro: ['Three fixes :'],
        bullets: [
          'Removed “select all” from the inactive services list.',
          'Inverted the logic: the user now unchecks the services they want to exclude, which makes the action deliberate.',
          'Added a warning showing how many services are about to be excluded.'
        ],
        body: [],
        // Modale interactive (remplace l'ancienne capture exclusion-4-test-en)
        // reproduisant le comportement du node Figma 114:10388 : a
        // l'ouverture tous les services sont coches (donc synchronises),
        // decocher un service l'exclut, affiche un rappel sur sa ligne et
        // met a jour l'avertissement en pied de modale. Voir
        // exclModalMarkup()/setupExclModal() dans app.js. Liste et ordre
        // copies du node Figma (Core modal, 114:9541/114:9958), noms
        // traduits en anglais d'apres la vraie capture produit
        // exclusion-2-step2-en.png (Follow-up, Pregnancy follow-up,
        // Emergency, Adult/Child seasonal flu vaccine) — les 4 restants
        // (absences, rencontre administrative) n'y figurent pas, traduits
        // par analogie avec le meme registre.
        modal: {
          services: [
            { name: 'Follow-up', code: '000000' },
            { name: 'Holiday absence', code: '000000' },
            { name: 'Parental leave absence', code: '000000' },
            { name: 'Pregnancy follow-up', code: '000000' },
            { name: 'Emergency', code: '000000' },
            { name: 'Vacation absence', code: '000000' },
            { name: 'Administrative meeting', code: '000000' },
            { name: 'Adult seasonal flu vaccine', code: '000000' },
            { name: 'Child seasonal flu vaccine', code: '000000' }
          ]
        }
      },
      {
        id: 'takeaways', label: 'Takeaways', title: 'Takeaways',
        body: [
          'This project confirmed that users don’t read. The “select all” incident was proof that clear labels aren’t enough, actions need visible feedback and signals.',
          'It also sharpened how I think about testing, especially for critical processes. Testing earlier would have told us whether keeping the screens managers already knew (instead of introducing a new four-step wizard) was the safer choice.'
        ]
      }
    ]
  },

  /* ===================== PETAL — GESTION DES LICENCES =================== */
  {
    slug: 'licence-management', kind: 'work', accent: 'c', year: '2024',
    poster: { label: 'Role → right', figure: 'steps' },
    title: 'Licence management',
    client: 'Petal',
    tagline: 'Refining access control to reflect the reality of clinicians.',
    tags: ['Access control', 'Component reuse', 'Healthcare SaaS'],
    gist: { company: true, role: 'Product Designer', duration: '3 months', team: '1 dev, 1 designer, 1 PM, 1 technical writer' },
    heroMedia: { type: 'image', src: 'assets/img/licence-hero.webp' },
    problem: 'Clinics and hospitals lacked control over the registration process, as it was taking place outside the platform, and the permissions system required more clarity and granularity.',
    processIntro: 'As a designer in this project, I translated the requirements into interfaces and assisted the PM in decision-making.',
    outcome: 'We redefined the permission system and implemented a new registration process so that managers, according to their authorization level, can add different types of member.',
    sections: [
      {
        id: 'context', label: 'Context', title: 'Context',
        body: [
          '## Different types of users and possibilities',
          'Before, 3 roles existed, which identified permissions and the type of people they can invite:',
          '## The format wasn’t reflecting reality',
          'Only the Administrator role had add-rights, when in reality, clinicians HR, cost-management staffer, whose job is provisioning access for clinicians, could also need it.',
          'The process wasn’t reflecting that reality, as the role managing interface was rigid, only allowing to select a role, not to set a right.',
          '**Result:** Administrator as role → adding members as a right.'
        ],
        terms: {
          after: 1,
          items: [
            { term: 'Administrators', body: 'had full licence managing rights: they can add any member (new or existing, in or outside the hospital), edit or delete members, grant licence managing rights to others, and set access permissions. They are typically managers responsible for onboarding staff and provisioning tool access.' },
            { term: 'Planners', body: 'had partial rights, as they are responsible for staff scheduling, sometimes at a service level, and could add already active members elsewhere in the hospital to their schedule.' },
            { term: 'Regular staff', body: '(clinicians, and non-admin operational staff) had no licence-management rights at all.' }
          ]
        },
        // zoomable: 'mobile' (voir figureFor() dans app.js) : sur mobile la
        // largeur de colonne rend les 3 lignes du schema difficiles a lire —
        // clic pour zoomer/parcourir. Pas besoin sur desktop, deja assez
        // large. Voir .zoomable-media dans styles.css.
        image: 'licence-1-role-right.svg', bare: true, zoomable: 'mobile',
        caption: 'Reframing admin access: a fixed role becomes one addable right.'
      },
      {
        id: 'before', label: 'Before', title: 'Before',
        headline: 'A modification page, not a registration flow',
        body: [
          'Before this project, registration was operated through an external software with Petal deployment team.',
          'Planners could only go to the detail page of an already-existing member to edit their access, in a multi-page setup.',
          '**The problem was:** the page is not a registration page, but a modification page.'
        ],
        // Capture ecran de l'ancienne page (fournie par l'utilisateur,
        // texte francais original traduit en anglais avant export) —
        // inseree apres le 2e paragraphe via s.figureAfter.
        figureAfter: {
          after: 1,
          image: 'licence-3-member-edit-before-en', bare: true, zoomable: 'mobile'
        }
      },
      {
        id: 'design', label: 'Solution', title: 'Solution',
        headline: 'The registration flow',
        body: [
          'The registration flow needed one component that could serve both planners and admins with minimum differences to facilitate implementation, while the possible actions weren’t the same for both.'
        ],
        timeline: [
          {
            title: 'Isolate the identifier: the mail',
            // Capture Figma (node 216:7373, "Ajouter un membre" - le champ
            // Courriel isole en recherche), texte francais original traduit
            // en anglais avant export. Voir .cs-timeline__row--figure dans
            // app.js/styles.css : cette entree garde le ratio natif de
            // l'image (pas de recadrage carre) et passe au-dessus du texte.
            image: 'licence-4-mail-search-en',
            imageZoomable: 'mobile',
            body: [
              'I started by isolating the mail input as it is the main identifier (for privacy purposes, licence numbers aren’t accessible information) for both planners and admins.'
            ]
          },
          {
            title: 'The planner flow',
            // thumb:false : pas de placeholder gris avant le texte (voir
            // item.thumb dans app.js) — l'unique visuel de cette entree est
            // imageAfter, place sous le texte plutot qu'a cote.
            thumb: false,
            body: [
              'Then I worked on the planner flow first, as it carries more constraints (the planner can only add internal existing members).',
              'The first idea was a filtered autosuggest: no button, live background search, surfacing only members the planner has rights to add. It brought several problems:'
            ],
            // Capture Figma (node 222:1486, "Planner search flow (EN)") :
            // deja en anglais dans la maquette source (pas de traduction a
            // faire), export flatten via download_assets (defaultScale 3)
            // plutot que get_screenshot pour la resolution.
            imageAfter: 'licence-5-search-issues-en',
            imageAfterZoomable: true,
            // Regroupe les anciennes entrees "Legibility & terminology" et
            // "No result, privacy & technical cost" en une liste numerotee
            // (voir .cs-timeline__constraints dans app.js/styles.css), pour
            // aligner les paragraphes et reprendre le violet #7F5DDD des
            // pastilles numerotees deja presentes dans imageAfter ci-dessus.
            // Ordre et numeros demandes explicitement par l'utilisateur
            // (independants de la numerotation 1-4 du diagramme Figma).
            // Privacy retiree ensuite a la demande de l'utilisateur.
            constraints: [
              { n: 1, text: '**Terminology**: should the component be approached as a search or a dropdown list? We opted for a searchbox ([search suggest drop-down list](https://en.wikipedia.org/wiki/Search_suggest_drop-down_list)).' },
              { n: 2, text: '**Technical cost**: live background search in a big database on every keystroke is a technical challenge.' },
              { n: 3, text: '**Unclear redirection**: the "contact support" in a listbox, in case there is no match found, was as unclear and easy to miss.' },
              { n: 4, text: '**Legibility**: with no button, how do we know there’s an error, if the entry is incomplete, or that anything happened at all from a technical standpoint?' }
            ]
          },
          {
            title: 'The admin flow',
            // thumb:false : meme logique que "Work on the component" plus
            // haut — pas de placeholder, l'unique visuel est imageAfter.
            thumb: false,
            body: [
              'It also presented several issues for the admin flow:'
            ],
            // Capture Figma (node 230:571, "Admin - Member addition flow v1
            // (EN)") : deja en anglais dans la maquette source, export
            // flatten via download_assets (defaultScale 3).
            imageAfter: 'licence-6-admin-issues-en',
            imageAfterZoomable: true,
            // Sur mobile, la colonne etroite rend le texte des 2 lignes
            // d'actions illisible meme zoome a 230% (defaut) — pousse a 350%
            // a la demande de l'utilisateur. Desktop garde 230% (voir
            // --zoom-scale-mobile dans styles.css, applique uniquement
            // sous 700px).
            imageAfterZoomScaleMobile: 350,
            // Regroupe l'ancienne entree "A buried action" ici : les 2
            // paragraphes restants deviennent une liste numerotee sous
            // l'image (memes pastilles violettes que .cs-timeline__constraints
            // plus haut, et memes numeros 1/2 deja presents dans le diagramme).
            constraints: [
              { n: 1, text: '**Performance issue**: the search ran in two passes (service-scoped, then platform-wide).' },
              { n: 2, text: '**Hidden action**: adding a new member was hidden behind a link displayed after the two passes searches rather than being a first-level action.' }
            ]
          },
          {
            title: 'Adding a button for the search',
            // Meme regroupement que "Work on the component"/"Issues for the
            // admin flow" plus haut : pas de placeholder. Ordre demande par
            // l'utilisateur : 1er paragraphe -> 1ere image (imageAfter) ->
            // "Naming the button" en liste numerotee (constraints) -> 2e
            // image (imagesAfter, rendue apres constraints — voir app.js).
            thumb: false,
            body: [
              'For these reasons, I chose to add a button to trigger the search, and then show which are the possible actions.'
            ],
            // Captures Figma (node 237:895 "Admin flow final (EN)" et node
            // 239:1068 "Admin final form (EN)") : la 1ere deja en anglais ;
            // la 2e contenait un formulaire encore en francais (Prenom, Type
            // de compte, Specialite, Permis delivre par, Numero de permis,
            // case a cocher) traduit via overlay raster (meme pipeline que
            // les autres captures Petal de cette etude de cas).
            // imageAfterZoomable : cette capture liste plusieurs actions
            // empilees (menu du bouton), trop denses pour tenir lisibles a la
            // largeur de la colonne de texte — clic pour zoomer/parcourir
            // plutot que de forcer une largeur pleine page. Voir
            // .zoomable-media dans styles.css (effet reutilisable — voir
            // aussi les autres images qui le portent dans ce fichier).
            // imageAfterZoomableRipple : ondulation d'invite au clic, gardee
            // sur cette image precise plutot que sur toutes les zoomable-media
            // (pas besoin de repeter l'invite une fois le geste decouvert
            // ailleurs sur la page).
            imageAfter: 'licence-7-button-search-en',
            imageAfterZoomable: true,
            imageAfterZoomableRipple: true,
            // Meme besoin que licence-6 ci-dessus, a 300% sur mobile.
            imageAfterZoomScaleMobile: 300,
            imagesAfter: [{ image: 'licence-9-admin-form-en', zoomable: 'mobile' }],
            constraints: [
              {
                n: 1,
                body: [
                  '**Naming the button**: the button’s label was also part of a small decision process.'
                ],
                // Alternatives ecartees, sorties en liste a puces (voir
                // c.list dans app.js, reutilise .cs-sec__list) plutot que
                // meles au paragraphe. "Submit" remplace "Valider" (garde en
                // francais dans la maquette d'origine) — equivalent UX
                // writing le plus proche discute avec l'utilisateur.
                list: [
                  '"Submit" implied confirming a finished process, while it was only the first part.',
                  '"Search" implied the field was purely about searching a member, not adding.'
                ],
                // Conclusion placee apres la liste (demande utilisateur).
                bodyAfterList: [
                  'We landed on "Add a member" because the operation is fundamentally about adding a member; matching an existing one is just an edge case.'
                ]
              }
            ]
          }
        ],
        /* Le modele d'administration etait une section a part ("Admin model").
           Il est replie ici : c'est la meme solution vue sous un autre angle,
           pas une etape de plus du processus. Passe donc par `after` (voir
           pageCase) plutot que par body[] — il doit se lire APRES la ligne de
           temps ci-dessus, et il garde la sienne, distincte. */
        after: [
          {
            headline: 'Admin as a rule, not a role',
            body: [
              'To reflect the decisions we had taken concerning admin being a right rather than a role, I modified the role management table as well as the member list:'
            ],
            // Ligne de temps propre a ce bloc — trait continu + pastilles
            // independants de ceux du flux d'inscription. 2 captures Figma
            // (node 250:11947 "Manager tag" et 250:11948 "Role table") : la
            // 1ere porte deja une pastille "1" annotant le tag dans la liste
            // des membres — reprise ici sur le paragraphe qui l'explique.
            timeline: [
              {
                thumb: false, tight: true,
                body: [],
                imageAfter: 'licence-10-manager-tag-en',
                imageAfterZoomable: 'mobile',
                constraints: [
                  { n: 1, text: 'The licence management indicator is shown as a tag in the member list.' }
                ],
                constraintsLoose: true,
                imagesAfter: [{ image: 'licence-11-role-table-en', zoomable: 'mobile' }]
              },
              {
                thumb: false,
                body: [
                  'For the table, the challenge was to give the ability to still keep a role, while being able to have the licence manager right (I didn’t want to go into a full setting table as there would be no benefits to have roles in this case). So I implemented it as a right, with the same tag.'
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'takeaways', label: 'Takeaways', title: 'Takeaways',
        body: [
          'This project, which I thought would be simple at first, pushed me to pay attention to details I\'d usually overlook. It challenged me in a new way, and I ended up spending a surprising amount of time on a small part of the design which I didn\'t expect to have such an impact. It also highlighted, for me, just how important prototyping is to get a real feel for the solution, but also the influence of technical constraints.'
        ]
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
        id: 'discovery', label: 'Discovery', title: 'Discovery',
        body: [
          'Analytics, heuristic evaluation, survey. The old site already gave plenty of clues, but we needed to hear from customers to understand why they reached for the phone.',
          'To get answers at volume, I set up a loyalty scheme: a completed survey in exchange for a promo code. It was the most effective lever available to a small company. The survey covered three themes — habits and motivations, opinion of the service, opinion of the website.',
          'The number that framed the whole project: 84% of respondents found the meals too hard to order and the process too long. They preferred to call.'
        ]
      },
      {
        id: 'definition', label: 'Definition', title: 'Definition',
        body: [
          'Personas, user flow, prioritisation matrix. The old path required six steps before confirming a plan. Starting again from the actual need — pick a plan, adjust it, pay — halved the number of steps.',
          'The structural change: products reachable directly from the homepage, and adding or removing specific meals moved onto the plan detail page, where the user has the context to decide.'
        ]
      },
      {
        id: 'design', label: 'Design', title: 'Design',
        body: [
          'Wireframes, then UI. The homepage opens on a sentence stating the value proposition, followed by the ordering steps and direct access to the offers.',
          'On the product page, a filter narrows results and a calorie calculator steers undecided users towards a suitable plan — that was the main source of hesitation the survey identified. The system also checks the address is served before letting someone order, rather than after payment.',
          'The detail page shows plan information with no surprises at checkout, and that is where meals are selected. The site was designed in desktop and mobile versions.'
        ]
      },
      {
        id: 'test', label: 'Testing', title: 'Testing',
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
    heroMedia: { type: 'video', src: 'assets/media/soundcloud-hero.mp4', poster: 'assets/img/soundcloud-hero-poster.webp', hideCaption: true },
    problem: 'Soundcloud has a feature its competitors don’t: commenting on a track at a specific moment. You just have to find it first. We wanted to measure the platform’s actual usability, then make that feature reachable for someone opening the site for the first time.',
    outcome: 'A SUS score of 69.57 measured across 815 respondents, six user tests isolating two specific problems, and a redesigned artist page that lifts the comment section up the right-hand side.',
    stats: [
      { n: '815', l: 'survey responses' },
      { n: '69.57', l: 'platform SUS score' },
      { n: '83%', l: 'test success rate, with 1 dropoff' }
    ],
    sections: [
      {
        id: 'research', label: 'Research', title: 'Quantitative research',
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
        id: 'tests', label: 'Testing', title: 'User testing',
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
        id: 'solution', label: 'Solution', title: 'Solution',
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

  /* ============ SIDE QUEST — DOCUMENTING SALSA DANCE ==================
     CE PROJET NE SUIT PAS LA STRUCTURE DES AUTRES ETUDES DE CAS.

     `format: 'article'` est le seul champ qui le declare, et app.js ne le lit
     qu'a un endroit (le routeur, section 7) : la carte, la route, l'ouverture
     en fiche et la croix de fermeture sont exactement celles de tous les
     autres projets — seul le GABARIT DE PAGE change. On tombe alors sur
     pageArticle() au lieu de pageCase() : un texte illustre, dans l'esprit de
     PAGES.gap ("Why I didn't work for 2 years"), sans fiche d'identite, sans
     Probleme/Resultat, sans processus decoupe, donc sans nav laterale ni
     barre flottante.

     CHAMPS LUS PAR pageArticle() :
       lede    facultatif — la phrase d'accroche sous le titre (rendue par
               emphasize(), donc **gras** et [texte](url) y sont acceptes).
               Elle remplace `tagline`, qui reste reserve a la carte.
       blocks  le corps de l'article, dans l'ordre. Chaque bloc vaut
               { h?, p?, media? } et se rend dans cet ordre :
                 h      intertitre facultatif
                 p      tableau de paragraphes (emphasize() aussi). Un
                        paragraphe entierement entre crochets s'affiche en
                        jaune : c'est une consigne de redaction, pas du texte
                        publiable.
                 media  tableau de medias, MEME FORME que `heroMedia` et que
                        les medias des etudes de cas :
                          { type: 'image' | 'video' | 'lottie',
                            src: 'assets/media/xxx.mp4',  // fichier du depot
                            // ... ou bien id: '...' pour le CDN (voir MEDIA)
                            caption: 'la legende affichee',
                            poster: 'assets/img/xxx.jpg', // video seulement
                            hideCaption: true }           // garde l'aria-label
                        Un seul media occupe toute la largeur ; a partir de
                        deux ils se rangent en grille (mediaGroup(), app.js).
       extLinks facultatif — les memes boutons "lien externe" que les etudes
               de cas, sous l'en-tete.

     Un media se declare DANS son bloc et jamais par un numero de paragraphe :
     contrairement aux etudes de cas (s.media[i]), inserer ou deplacer du
     texte ici ne peut rien desynchroniser. Pour poser une image AVANT le
     texte, on ecrit un bloc qui n'a que `media`.

     Les champs communs a toutes les cartes restent obligatoires — poster,
     title, client, tagline, tags — parce que c'est projectCard() qui les lit
     et qu'il ne sait rien du format de la page derriere. */
  {
    slug: 'salsa', kind: 'side', accent: 'h', year: '2025',
    format: 'article',
    /* "8 → 4" comme "24 → 9" chez Contraintes : l'affiche porte le chiffre que
       l'article retient. En cours, un move se compte sur 8 temps ; l'unite
       retenue ici est la moitie, 4. Le motif `clave` (app.js) dessine les deux
       mesures de huit croches sur lesquelles cette division se lit. */
    poster: { label: '8 → 4', figure: 'clave' },
    title: 'Documenting Salsa Dance',
    client: 'Personal project',
    tagline: 'An interest in salsa dance, then an attempt to **write it down**.',
    tags: ['Systems design', 'Notation', 'Personal'],
    // Derniere frame de l'ancien cover video (salsa-cover.mp4), extraite et
    // exportee en WebP : deja recadree au centre sur le couple au ratio
    // 1280/1072 de .card__media (1024x858). N'alimente plus que la vignette
    // de la carte d'accueil (cardMedia()) : hideHeroInArticle retire le
    // bandeau .article__hero correspondant en tete de l'article (demande
    // utilisateur, ce cas seulement — voir pageArticle() dans app.js).
    heroMedia: { type: 'image', src: 'assets/img/salsa-cover-frame.webp' },
    hideHeroInArticle: true,
    /* Les schemas viennent du fichier Figma "Claude portfolio image
       generation", page "Salsa concepts" (fileKey itn1kZeKMMFva4PUSX9hlS,
       noeud 302:2382) : une planche de travail dont chaque section porte un
       concept. Exportes en PNG 2x puis convertis en .webp, largeur bridee a
       1400px (la colonne de l'article fait ~700px, donc 2x suffit).
       UN SEUL fichier par visuel, en .webp : mediaMarkup() rend un <img src>
       simple, sans la paire <picture> webp+png de figureFor() — un .png a
       cote serait du poids mort (meme regle que heroMedia, voir CLAUDE.md).
       salsa-notation.webp est recadre sur la bande du haut de la section
       "Complete breakdown" : le reste de cette section est un brouillon
       annote en francais ("Think about arrows placement"...). */
    blocks: [
      {
        p: [
          'During those two years I wasn’t working, I developed an interest for salsa dance.',
          'After a few months of practice, I ran into a problem: I felt far less creative than the dancers I was watching online. The moves taught in my school were way different from the ones I was seeing on YouTube.',
          'Watching videos wasn’t practical in itself, as they varied in length. Imitating a move meant pausing, replaying, slowing it down, and still understanding only half of what the dancers were doing.'
        ]
      },
      {
        h: 'The goal',
        p: [
          'What I was missing was a key to decode the moves and compare them without relying on videos.',
          'With such a tool, I thought I would be able to create my own, as I believe that **creativity comes from constraints**. If I could describe the rules, then going beyond them would make me creative by definition.',
          'To do that, I thought it would be a good exercise to visually map what I knew.'
        ]
      },
      {
        /* DEUX BLOCS POUR UNE SEULE SECTION : la video doit venir JUSTE APRES
           le titre, avant le texte. pageArticle() rend toujours un bloc dans
           l'ordre titre -> paragraphes -> medias, donc on coupe en deux — un
           bloc titre + media, un bloc texte. C'est le mecanisme prevu (voir le
           commentaire de pageArticle dans app.js), et il ne casse rien : ici
           les medias appartiennent a leur bloc, ils ne sont pas indexes par
           position comme dans les etudes de cas. */
        h: 'So what is a move?',
        media: [
          // 360x640 : c'est une video de telephone, verticale. La laisser
          // occuper les 700px de la colonne lui donnerait 1244px de haut, soit
          // un ecran entier pour une illustration. On la borne donc a 240px
          // (427 de haut) : sous sa taille naturelle, jamais au-dessus — une
          // video agrandie devient floue, et celle-ci n'a que 360px a donner.
          { type: 'video', src: 'assets/media/salsa-combo.mp4', controls: true,
            sound: true, maxWidth: 240,
            caption: 'Example of a move sequence.' }
        ]
      },
      {
        p: [
          'A move is a sequence of positions, meaning where each dancer stands on the line and which way they face, between the leader and the follower over 8 beats, set by the steps and by the handholds that change along the way.'
        ]
      },
      {
        h: 'Finding the unit',
        p: [
          'From all the different moves I collected, I looked for what they had in common. To do so, I had to cut the videos into smaller pieces: the smaller the component, the better it is for comparison.',
          'In class, moves were taught over 8 beats. But even there, the possibilities were endless. So I cut again into halves of 4, so I could pay closer attention to the details.',
          'That’s what let me build the concepts below:'
        ]
      },
      {
        h: 'Concepts',
        /* Un glossaire plutot que cinq paragraphes : ce sont des definitions
           qu'on relit une par une, et "Body possibilities" se subdivise en
           quatre facettes — c'est exactement ce que `sub` sert a montrer. */
        terms: [
          {
            term: 'Timing',
            body: 'The ability to synchronize moves with the beats of a song. I realized that some moves can only start on a certain beat, which means that if two moves happen on the same timing, there’s a good chance they have something in common. This helped me group the moves in families (see the Steps section below).',
            media: [
              // 687 = la largeur du schema a l'echelle 1 (fichier exporte en
              // 3x, soit 2061px). Voir `maxWidth` dans mediaMarkup().
              { type: 'image', src: 'assets/img/salsa-timing-v2.webp', maxWidth: 687, zoomable: 'mobile',
                caption: 'Moves placed on the count they start on.' }
            ]
          },
          {
            term: 'Lines and lanes',
            body: 'Salsa is a line dance. The follower travels along a main line while the leader steps out of the way to let them go, into one side or the other of the line. That let me categorize moves by where each dancer stands relative to the line.',
            // Deux schemas plutot qu'un : la ligne d'abord, puis ce qu'elle
            // permet de nommer (le cote choisi par le leader). Ils se lisent
            // l'un apres l'autre, d'ou le carrousel — voir carouselMarkup()
            // dans app.js. `src` (chemin complet) et non `image` : ces exports
            // Figma n'existent qu'en WebP.
            media: [
              { type: 'carousel', maxWidth: 400, items: [
                { src: 'assets/img/salsa-lines-lanes-v3.webp',
                  caption: 'Main track for the follower, side lane for the leader.' },
                { src: 'assets/img/salsa-cbl-sides-v2.webp',
                  caption: 'In a cross-body lead, the leader can pass on either side of the follower.' },
                // Boucle muette, recadree sur les danseurs (voir
                // carouselMarkup() dans app.js pour item.type === 'video') :
                // source 854x480, coupee a 380x370 pour ecarter le sous-titre
                // et le logo incrustes, puis recompressee sans son (~210 Ko
                // pour 9,4 s, contre plusieurs Mo a la source).
                { type: 'video', src: 'assets/media/salsa-cbl-loop.mp4',
                  caption: 'A cross-body lead, in motion.' }
              ] }
            ]
          },
          {
            term: 'Steps',
            body: 'The spot in which we put our feet down, at a given beat. Almost every combination I looked at comes from three foundational steps: the turn, the cross-body lead (CBL), and the backstep.',
            media: [
              { type: 'image', src: 'assets/img/salsa-steps-v2.webp', maxWidth: 800, zoomable: true,
                caption: 'The key figures, derived from the three foundational steps.' }
            ]
          },
          {
            term: 'Body possibilities',
            body: 'The positions two people can physically hold together.',
            sub: [
              { term: 'Turn height', body: 'Turns happen at three heights only: above the head, at neck level, or at waist level.',
                media: [{ type: 'image', src: 'assets/img/salsa-turn-height-v2.webp', maxWidth: 496, zoomable: 'mobile',
                          caption: 'The three levels a turn can happen at.' }] },
              { term: 'Arm position', body: 'Each arm is either in front of or behind a specific body part. Combining that with the heights is what produces named positions (e.g. a hammerlock is one arm behind at waist level with the other neutral above the head; a cuddle is both arms in front at waist level).',
                media: [{ type: 'image', src: 'assets/img/salsa-arm-position-v2.webp', maxWidth: 496, zoomable: 'mobile',
                          caption: 'Arms in front or behind, at a given height.' }] },
              { term: 'Direction', body: 'The dancers face each other, stand back to back, or both face the same way, with either the leader or the follower in front.',
                media: [{ type: 'image', src: 'assets/img/salsa-direction-v2.webp', maxWidth: 601, zoomable: 'mobile',
                          caption: 'Facing, opposed, or one shadowing the other.' }] },
              { term: 'Holds', body: 'How the dancers hold each other, from two hands parallel or crossed, down to no hands at all.',
                media: [{ type: 'image', src: 'assets/img/salsa-holds-v2.webp', maxWidth: 496, zoomable: 'mobile',
                          caption: 'Holds examples.' }] }
            ]
          },
          {
            term: 'Operators',
            body: 'What happens to the hands during a move: locks, cuts, flicks, rebounds, haircombs, etc.',
            media: [
              { type: 'carousel', maxWidth: 400, items: [
                { type: 'video', src: 'assets/media/salsa-operators-rebound.mp4',
                  caption: 'Rebound' },
                { type: 'video', src: 'assets/media/salsa-operators-haircomb.mp4',
                  caption: 'Drops, Haircombs and Loops' },
                { type: 'video', src: 'assets/media/salsa-operators-flick.mp4',
                  caption: 'Flicks' },
                { type: 'video', src: 'assets/media/salsa-operators-blocks.mp4',
                  caption: 'Checks' },
                { type: 'video', src: 'assets/media/salsa-operators-cuts.mp4',
                  caption: 'Handswitches and cuts' },
                { type: 'video', src: 'assets/media/salsa-operators-checks.mp4',
                  caption: 'Locks' },
                { type: 'video', src: 'assets/media/salsa-operators-wax.mp4',
                  caption: 'Wax on and off' }
              ] }
            ]
          }
        ]
      },
      /* La conclusion des concepts est un bloc a elle seule, et non le `p` du
         bloc ci-dessus : pageArticle() rend toujours h, puis p, puis terms —
         un paragraphe ecrit la-haut passerait AVANT le glossaire qu'il
         conclut. Meme regle que pour les medias : ce qui doit venir apres
         s'ecrit dans le bloc suivant. */
      {
        p: [
          'This made me realize that most moves share the same footwork and differ only above the waist.'
        ]
      },
      {
        h: 'Writing it down',
        p: [
          'I went looking through dance books to see whether the transcription problem had been solved before, and it has been attempted, in several ways.',
          'Here are some examples:'
        ],
        // Deux references existantes, cote a cote : c'est ce que le
        // paragraphe qui precede annonce ("it has been attempted, in several
        // ways"). Une grille de deux plutot qu'un carrousel : elles doivent se
        // comparer d'un coup d'oeil, pas se feuilleter l'une apres l'autre.
        // BLOC A PART (voir plus bas) : mediaGroup() rend toujours APRES tous
        // les `p` d'un bloc, donc pour la faire atterrir entre les deux
        // paragraphes, le second paragraphe part dans le bloc suivant — meme
        // mecanisme que "So what is a move?" plus haut dans ce fichier.
        // MEME HAUTEUR RENDUE POUR LES DEUX (275px, impose par
        // .article__block .media-grid dans styles.css — voir le commentaire
        // la-bas) : la carte (365x415 native) et l'illustration (1014x670,
        // exportee en 2x pour rester nette une fois redimensionnee) doivent
        // s'aligner cote a cote sans que l'une paraisse un post-scriptum plus
        // petit de l'autre. 275px et non la hauteur native de la carte (415) :
        // a 415 les deux images cote a cote demandent ~993px, largement plus
        // que les 700px de la colonne (.wrap--narrow moins les gouttieres) —
        // elles retomberaient sur deux lignes. A 275, ~242px + ~416px + 24px
        // de gap tiennent dans les 700px. `maxWidth` ici ne fait plus que
        // plafonner/documenter la taille source de chaque fichier — la
        // largeur affichee vient de la hauteur commune, pas de `maxWidth`.
        // `hideCaption` : legende retiree de l'affichage (demande utilisateur),
        // le texte reste comme alt/aria-label pour l'accessibilite.
        media: [
          { type: 'image', src: 'assets/img/salsa-ref-footwork-card.webp', maxWidth: 365,
            caption: 'A beat-by-beat footwork card (JustSalsa, 2005).', hideCaption: true },
          { type: 'image', src: 'assets/img/salsa-ref-dancing-made-easy-v2.webp', maxWidth: 1014,
            caption: '"Dancing Made Easy": an older attempt, figure by figure.', hideCaption: true }
        ]
      },
      {
        p: [
          'I ended up with my own version which looks a bit like sheet music. Each frame is a beat, with the leader and follower positions on a grid. Arrows show which way each of them travels and turns.'
        ],
        /* La demonstration de la section : l'extrait danse et la planche du
           MEME enchainement (El Tiburon), le temps courant encadre sur la
           planche pendant la lecture. Voir beatSyncMarkup()/setupBeatSync()
           dans app.js et .beatsync dans styles.css (section 9 ter).

           LES COORDONNEES DES CASES viennent du fichier Figma "Salsa position
           and steps sheets" (fileKey oJvHwY1G3OxALPnXIAtbQd, noeud 10:53),
           relevees sur les noeuds de chaque case et exprimees dans le repere
           de la planche : 744 x 397. L'image exportee est recadree EXACTEMENT
           sur ces bornes (l'export Figma ajoute 40px de marge tout autour,
           retires a la conversion), donc x/744 et y/397 donnent directement
           le pourcentage. Rogner l'image autrement decale tous les cadres.

           LA PLANCHE A DEJA ETE REDIMENSIONNEE UNE FOIS (831x473 -> 744x397).
           Les cases font toujours 99x99, mais elles ont TOUTES bouge. Si elle
           bouge encore : relire le noeud 10:53 dans Figma, reprendre sheetW /
           sheetH sur la section et x/y sur chaque case, et reexporter l'image.
           Ne jamais ajuster une seule des trois choses — le cadre du temps
           courant se calcule a partir des trois ensemble.

           LA GRILLE DES TEMPS (`counts`) : les 16 temps de l'enchainement, 2
           mesures de 8. Elle porte AUSSI les temps 4 et 8, qui n'ont pas de
           case sur la planche mais que le danseur compte quand meme — c'est ce
           que le compteur en haut de la video affiche. Chaque case dit, par
           `slot`, a quel temps de cette grille elle correspond.

           D'OU VIENNENT CES VALEURS. Relevees par l'auteur sur le fichier, en
           SECONDES:IMAGES a 60 i/s : 1 a 04:13, 2 a 04:48, 3 a 05:23, 5 a
           06:44, 6 a 07:16, 7 a 07:56 — soit 4,217 / 4,800 / 5,383 / 6,733 /
           7,267 / 7,933 s. Le temps 4 est pose au milieu de 3 et 5, comme
           indique. Lecture en images et non en centiemes parce qu'elle donne
           des intervalles reguliers (0,58 a 0,68 s, ~97 BPM) la ou les
           centiemes donneraient 0,35 puis 0,75 s entre deux temps voisins,
           ce qu'aucune mesure musicale ne fait. SI C'ETAIT DES CENTIEMES :
           reprendre 4,13 / 4,48 / 5,23 / 6,44 / 7,16 / 7,56 et refaire la
           mesure 2 au meme pas.

           LA MESURE 2 (slots 8 a 15) N'A PAS ETE RELEVEE : elle est prolongee
           au tempo mesure sur la mesure 1, 0,619 s par temps — donc le temps 1
           de la 2e mesure a 9,17 s et son temps 7 a 12,89 s, ce qui tient dans
           les 13,33 s du fichier. A verifier a l'oeil, et a corriger ici
           seulement si ca derape.

           `sound` n'est pas pose : le bouton de son existe mais reste eteint
           (voir beatSyncMarkup() dans app.js). Le mettre a true le rallume. */
        beatSync: {
          video: 'assets/media/salsa-tiburon.mp4',
          videoTitle: 'El Tiburon danced, the excerpt this sheet transcribes',
          // La boucle couvre desormais tout le fichier : le pas de base avant
          // l'enchainement, l'enchainement lui-meme (mesures 1 et 2), et le
          // pas de base apres. Le fichier fait 13,33 s ; on s'arrete a 13.28
          // (meme marge qu'avant le rallongement de la boucle) plutot que sur
          // la toute derniere image.
          start: 0.15, end: 13.28,
          sheet: 'assets/img/salsa-sheet-tiburon.webp',
          sheetW: 744, sheetH: 397,
          sheetAlt: 'The El Tiburon sheet: four parts, one frame per beat, each showing the leader and follower on a grid.',
          // Pas de `caption` : legende retiree (demande utilisateur) — le
          // texte "press play / click any frame" etait redondant avec
          // l'aria-label de chaque bouton et de chaque case, deja lus par un
          // lecteur d'ecran. `sheetAlt` ci-dessus reste le texte alternatif
          // de la planche elle-meme.
          // `slot` = le rang du temps dans `counts` ci-dessous. Seuls les
          // temps de l'enchainement (mesures 1 et 2, slots 8 a 23) ont une
          // case : ni les temps 4 et 8 de chaque mesure (pause du pas de
          // base, pas de case sur la planche), ni le pas de base avant/apres
          // l'enchainement (slots 0-7 et 24-28 : la planche ne dessine que
          // l'enchainement, pas ce pas de base — voir plus bas).
          frames: [
            { slot: 8,  beat: 1, part: '1st part: enchufla (lead)', x: 20,  y: 49,  w: 99, h: 99 },
            { slot: 9,  beat: 2, part: '1st part: enchufla (lead)', x: 139, y: 49,  w: 99, h: 99 },
            { slot: 10, beat: 3, part: '1st part: enchufla (lead)', x: 258, y: 49,  w: 99, h: 99 },
            { slot: 12, beat: 5, part: '2nd part: Tiburon part 1',  x: 377, y: 49,  w: 99, h: 99 },
            { slot: 13, beat: 6, part: '2nd part: Tiburon part 1',  x: 506, y: 49,  w: 99, h: 99 },
            { slot: 14, beat: 7, part: '2nd part: Tiburon part 1',  x: 625, y: 49,  w: 99, h: 99 },
            { slot: 16, beat: 1, part: '3rd part: Tiburon part 2',  x: 20,  y: 233, w: 99, h: 99 },
            { slot: 17, beat: 2, part: '3rd part: Tiburon part 2',  x: 139, y: 233, w: 99, h: 99 },
            { slot: 18, beat: 3, part: '3rd part: Tiburon part 2',  x: 258, y: 233, w: 99, h: 99 },
            { slot: 20, beat: 5, part: '4th part: right turn',      x: 389, y: 233, w: 99, h: 99 },
            { slot: 21, beat: 6, part: '4th part: right turn',      x: 506, y: 233, w: 99, h: 99 },
            { slot: 22, beat: 7, part: '4th part: right turn',      x: 625, y: 233, w: 99, h: 99 }
          ],
          // n = le chiffre annonce (1 a 8), t = sa seconde dans le fichier,
          // en secondes + CENTIEMES (et non en frames : "04:13" = 4,13 s).
          //
          // Quatre segments a la suite : le pas de base avant l'enchainement,
          // les deux mesures de l'enchainement, puis le pas de base apres.
          // Dans chaque segment, les temps releves a l'oreille sont donnes
          // tels quels ; les temps manquants (pauses du pas de base, sans
          // case sur la planche) sont la MOYENNE des deux temps voisins —
          // demande explicite : garder ces temps la ou aucune case ne peut de
          // toute facon les distinguer visuellement.
          counts: [
            // Pas de base, avant l'enchainement.
            { n: 1, t: 0.15 },               { n: 2, t: 0.53 },
            { n: 3, t: 1.34 },               { n: 4, t: 1.73 },  // moyenne(3, 5)
            { n: 5, t: 2.12 },               { n: 6, t: 2.37 },
            { n: 7, t: 3.11 },               { n: 8, t: 3.62 },  // moyenne(7, mesure 1 / 1)
            // Mesure 1.
            { n: 1, t: 4.130 },              { n: 2, t: 4.480 },
            { n: 3, t: 5.230 },              { n: 4, t: 5.835 },
            { n: 5, t: 6.14 },               { n: 6, t: 6.44 },
            { n: 7, t: 7.16 },               { n: 8, t: 7.58 },  // moyenne(7, mesure 2 / 1)
            // Mesure 2.
            { n: 1, t: 8.00 },               { n: 2, t: 8.39 },
            { n: 3, t: 9.08 },               { n: 4, t: 9.235 }, // moyenne(3, 5)
            { n: 5, t: 9.39 },               { n: 6, t: 10.18 },
            { n: 7, t: 10.47 },              { n: 8, t: 10.815 }, // moyenne(7, pas de base / 1)
            // Pas de base, apres l'enchainement.
            { n: 1, t: 11.16 },              { n: 2, t: 11.59 },
            { n: 3, t: 12.33 },              { n: 4, t: 12.70 }, // moyenne(3, 5)
            { n: 5, t: 13.07 }
          ]
        }
      },
      {
        h: 'What it taught me',
        p: [
          'This exercise gave me the ability to break a move apart and invent new ones by changing its variables.',
          'But it also changed my mind about how much that matters. Creativity (the ability to invent) is nice to have, but I don\'t think it matters as much as technique (the ability to do a move well), because a well-done move feels "right": it makes sense to both partners and is comfortable for them. Without technique, there\'s no creativity to build on.'
        ]
      }
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
        id: 'explore', label: 'Exploration', title: 'Exploration',
        body: [
          'Benchmark first: Glovo, Please, John Paul, Premium. The finding came quickly — the night slot was empty. That wasn’t an oversight on our part, it was an opening.',
          'Then a survey across around fifty qualified respondents. The answers were sharper than expected. 90% say night work has had a significant impact on their health. Every single person interviewed recognises an effect on family and friendships. And 7 out of 10 name meal delivery as a major problem: at night, nothing is open.'
        ]
      },
      {
        id: 'analysis', label: 'Analysis', title: 'Analysis',
        body: [
          'The responses described two distinct profiles, which we formalised as personas. For the first group, night work is physically hard and disrupts sleep. The second is more bothered by the social and dietary impact.',
          'We then listed possible features across four axes: delivery, workplace wellness, social, and services. Plenty of ideas, only some of which we kept — it’s a hackathon, and the demo has to stand up.'
        ]
      },
      {
        id: 'design', label: 'Design', title: 'Design',
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
