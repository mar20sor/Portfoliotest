/* ==========================================================================
   app.js — TOUTE la logique du site
   --------------------------------------------------------------------------
   Plan du fichier :
     0. Imports et petits outils
     1. L'etat de l'application (les seules donnees qui changent)
     2. Securite : nettoyage du prenom saisi
     3. Internationalisation (FR / EN)
     4. Generateur d'affiches SVG
     5. Fabriques de pages (accueil, liste, etude de cas, editorial, 404)
     6. Pied de page
     7. Le routeur
     8. Comportements de defilement (barre de progression, scroll-spy)
     9. Le portail du prenom
    10. Loader et demarrage

   VOCABULAIRE POUR DEBUTANT
     DOM       : la representation en memoire de la page HTML. Le modifier
                 modifie ce qui est affiche.
     selecteur : une chaine comme '#main' ou '.card' qui designe des elements.
     evenement : un fait ('clic', 'scroll'). On y "attache" une fonction qui
                 sera appelee quand il se produit.
     hash      : la partie de l'URL apres le #. Ici, c'est notre systeme de
                 pages : #/work/constraints.
   ========================================================================== */


/* ==========================================================================
   0. IMPORTS ET OUTILS
   ========================================================================== */

import { SITE, UI, HERO, PROJECTS, PAGES } from './content.js';

/* Raccourcis vers querySelector. Ecrire $('#main') au lieu de
   document.querySelector('#main') rend le reste du fichier bien plus lisible.
   Le 2e parametre permet de chercher DANS un element precis. */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* Cree un element HTML en une ligne.
   el('p', { class: 'x' }, ['bonjour'])  ->  <p class="x">bonjour</p>
   Les enfants passes en chaine sont inseres comme TEXTE (jamais comme HTML) :
   c'est cette fonction qu'on utilise pour tout ce qui vient du visiteur. */
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'text') { node.textContent = v; continue; }
    node.setAttribute(k, v === true ? '' : String(v));
  }
  for (const child of [].concat(children)) {
    if (child === null || child === undefined) continue;
    node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}


/* ==========================================================================
   1. L'ETAT DE L'APPLICATION
   --------------------------------------------------------------------------
   Un seul objet regroupe tout ce qui peut changer pendant la visite.
   Avantage : quand quelque chose s'affiche mal, on sait ou regarder.
   ========================================================================== */

const state = {
  lang: 'fr',        // 'fr' ou 'en'
  visitor: '',       // le prenom saisi. VIT EN MEMOIRE UNIQUEMENT (cf. section 2)
  route: '',         // le hash courant
  cleanup: []        // fonctions a rappeler quand on quitte une page (voir addCleanup)
};

/* Chaque page peut installer des ecouteurs d'evenements ou des observateurs.
   Si on ne les retire pas en quittant la page, ils s'accumulent et le site
   ralentit peu a peu (c'est une "fuite memoire"). On les enregistre ici pour
   pouvoir tout nettoyer proprement au changement de page. */
function addCleanup(fn) { state.cleanup.push(fn); }
function runCleanup() {
  state.cleanup.forEach(fn => { try { fn(); } catch (_) { /* on ignore */ } });
  state.cleanup = [];
}

/* Traduction courante. t.navWork, t.csBack, etc. */
const t = () => UI[state.lang];


/* ==========================================================================
   2. SECURITE — NETTOYAGE DU PRENOM
   --------------------------------------------------------------------------
   Le cahier des charges demande un formulaire "securise". Concretement,
   le risque s'appelle XSS (Cross-Site Scripting) : si on inserait le texte
   saisi tel quel dans la page via innerHTML, un visiteur pourrait taper
       <img src=x onerror="alert('bonjour')">
   et faire executer son code chez les visiteurs suivants (ou voler des
   donnees si le site en manipulait).

   QUATRE PROTECTIONS, empilees. Aucune n'est suffisante seule :

   1. LISTE BLANCHE (ci-dessous). On ne retire pas les caracteres dangereux
      un par un — on n'AUTORISE que les lettres, l'espace, le tiret et
      l'apostrophe. Tout le reste disparait. Interdire est fragile (on oublie
      toujours un cas) ; autoriser est robuste.
   2. LIMITE DE LONGUEUR. 24 caracteres, cote HTML (maxlength) ET cote JS.
   3. INSERTION EN TEXTE SEUL. Le prenom n'est jamais mis dans innerHTML.
      Il passe par textContent, qui traite systematiquement le contenu comme
      du texte : "<b>" s'affiche litteralement "<b>", il n'est pas interprete.
      C'est la protection la plus importante des quatre.
   4. CONTENT SECURITY POLICY. Declaree dans index.html : meme si du script
      parvenait a etre injecte, le navigateur refuserait de l'executer.

   ET LE STOCKAGE ? Le cahier des charges dit "sauvegarde dans une variable,
   pas dans une base de donnees". Le prenom vit dans state.visitor, en
   memoire. Il disparait au rechargement de la page. Rien n'est envoye sur
   le reseau (le <form> n'a pas d'attribut action), rien n'est ecrit sur le
   disque, aucun cookie. Si vous preferez qu'un rafraichissement ne
   redemande pas le prenom, voyez la note en fin de section 9.
   -------------------------------------------------------------------------- */

const NAME_MAX = 24;

function cleanName(raw) {
  return String(raw ?? '')
    .normalize('NFC')          // unifie les accents ecrits de deux facons differentes
    .slice(0, NAME_MAX * 2)    // coupe tot : evite de traiter une chaine enorme
    // \p{L} = "n'importe quelle lettre, dans n'importe quel alphabet" (le
    // drapeau u active cette syntaxe). On accepte donc Zoe, Jose, Владимир.
    .replace(/[^\p{L}\p{M}\s'’-]/gu, '')
    .replace(/\s+/g, ' ')      // plusieurs espaces -> un seul
    .trim()
    .slice(0, NAME_MAX);
}

/* Met la premiere lettre en capitale, sans toucher au reste
   (pour ne pas transformer "McDonald" en "Mcdonald"). */
function capitalize(s) {
  return s ? s[0].toLocaleUpperCase(state.lang) + s.slice(1) : s;
}


/* ==========================================================================
   3. INTERNATIONALISATION
   --------------------------------------------------------------------------
   Deux mecanismes complementaires :
     - les elements PORTANT data-i18n="cle" sont remplis automatiquement par
       applyStaticI18n(). C'est le cas du balisage fixe d'index.html.
     - les pages generees en JS lisent directement t().cle a la construction.
   ========================================================================== */

function applyStaticI18n() {
  const d = t();
  $$('[data-i18n]').forEach(node => {
    const value = d[node.dataset.i18n];
    // On ignore les fonctions (comme helloVisitor) : elles ont besoin d'un
    // argument, donc elles sont appelees a la main la ou on en a besoin.
    if (typeof value === 'string') node.textContent = value;
  });

  // L'attribut lang de <html> compte vraiment : il indique aux lecteurs
  // d'ecran quelle prononciation utiliser, et au navigateur quelles regles
  // de cesure appliquer.
  document.documentElement.lang = state.lang;
  document.body.dataset.lang = state.lang;

  // Etat visuel + accessible du selecteur de langue.
  $$('[data-setlang]').forEach(b => {
    const on = b.dataset.setlang === state.lang;
    b.setAttribute('aria-pressed', String(on));
    b.setAttribute('title', on ? d.langLabel : d.langSwitchTo);
  });

  // Le placeholder et le lien mailto ne sont pas du "contenu texte",
  // ils vivent dans des attributs : on les traite separement.
  const input = $('#gate-input');
  if (input) input.setAttribute('placeholder', d.gatePlaceholder);
  const contact = $('#nav-contact');
  if (contact) contact.href = `mailto:${SITE.email}`;
}

function setLang(lang) {
  if (lang === state.lang) return;
  state.lang = lang;
  applyStaticI18n();
  buildFooter();
  render();                 // on redessine la page courante dans la nouvelle langue
}


/* ==========================================================================
   4. GENERATEUR D'AFFICHES SVG
   --------------------------------------------------------------------------
   Le cahier des charges demande une affiche par etude de cas, et des
   placeholders si les images manquent. Plutot que d'inventer de fausses
   captures d'ecran, on genere des affiches typographiques en SVG.

   POURQUOI DU SVG PLUTOT QUE DES IMAGES ?
     - poids : quelques centaines d'octets contre plusieurs dizaines de Ko ;
     - nettete : c'est du vectoriel, donc parfait sur ecran Retina ;
     - couleurs : elles suivent les variables CSS, donc changer le bleu du
       site change aussi les affiches, sans regenerer un seul fichier.
   ========================================================================== */

/* Sept variantes, pour que deux projets voisins ne se ressemblent pas.
   Chaque entree definit un fond et une couleur de trait. */
const ACCENTS = {
  a: { bg: '#0B1B3A', fg: '#FFCB3D', sub: 'rgba(255,255,255,.5)' },
  b: { bg: '#2350D8', fg: '#FFFFFF', sub: 'rgba(255,255,255,.62)' },
  c: { bg: '#EDF2FE', fg: '#2350D8', sub: '#5A6683' },
  d: { bg: '#FFCB3D', fg: '#0B1B3A', sub: 'rgba(11,27,58,.62)' },
  e: { bg: '#16223D', fg: '#FFFFFF', sub: 'rgba(255,255,255,.5)' },
  f: { bg: '#1B3AA0', fg: '#FFCB3D', sub: 'rgba(255,255,255,.6)' },
  g: { bg: '#F5F3EE', fg: '#16223D', sub: '#8B94AB' }
};

/* Les motifs geometriques. Chacun raconte quelque chose du projet :
   des regles empilees, un wizard en etapes, un flux qui raccourcit... */
function motif(kind, fg) {
  const s = fg, o = 'opacity=".9"';
  switch (kind) {
    case 'rules':   // 24 traits dont 9 pleins : la reduction du projet Contraintes
      return Array.from({ length: 24 }, (_, i) =>
        `<rect x="${240 + (i % 8) * 22}" y="${150 + Math.floor(i / 8) * 16}" width="16" height="5" rx="2.5"
               fill="${s}" opacity="${i < 9 ? .95 : .22}"/>`).join('');
    case 'wizard':  // quatre etapes reliees
      return Array.from({ length: 4 }, (_, i) =>
        `<circle cx="${252 + i * 46}" cy="172" r="9" fill="none" stroke="${s}" stroke-width="2" opacity="${i ? .35 : .95}"/>
         ${i < 3 ? `<line x1="${263 + i * 46}" y1="172" x2="${289 + i * 46}" y2="172" stroke="${s}" stroke-width="2" opacity=".3"/>` : ''}`
      ).join('');
    case 'steps':   // quatre paliers montants
      return Array.from({ length: 4 }, (_, i) =>
        `<rect x="${244 + i * 34}" y="${196 - i * 18}" width="24" height="${10 + i * 18}" rx="3"
               fill="${s}" opacity="${.28 + i * .22}"/>`).join('');
    case 'flow':    // six points qui deviennent trois
      return `${Array.from({ length: 6 }, (_, i) =>
        `<circle cx="${242 + i * 17}" cy="152" r="4" fill="${s}" opacity=".28"/>`).join('')}
        ${Array.from({ length: 3 }, (_, i) =>
        `<circle cx="${242 + i * 34}" cy="192" r="7" fill="${s}" ${o}/>`).join('')}
        <path d="M246 166 L250 182" stroke="${s}" stroke-width="1.5" opacity=".4"/>`;
    case 'gauge':   // un arc de jauge, comme une echelle SUS
      return `<path d="M238 196 A62 62 0 0 1 362 196" fill="none" stroke="${s}" stroke-width="7" opacity=".22" stroke-linecap="round"/>
              <path d="M238 196 A62 62 0 0 1 330 143" fill="none" stroke="${s}" stroke-width="7" stroke-linecap="round"/>
              <circle cx="300" cy="196" r="4" fill="${s}"/>`;
    case 'owl':     // deux yeux de hibou
      return `<circle cx="278" cy="170" r="21" fill="none" stroke="${s}" stroke-width="2.5" opacity=".8"/>
              <circle cx="326" cy="170" r="21" fill="none" stroke="${s}" stroke-width="2.5" opacity=".8"/>
              <circle cx="278" cy="170" r="7" fill="${s}"/><circle cx="326" cy="170" r="7" fill="${s}"/>
              <path d="M296 192 L302 200 L308 192" fill="none" stroke="${s}" stroke-width="2.5" opacity=".8"/>`;
    case 'book':    // des lignes de texte
      return Array.from({ length: 7 }, (_, i) =>
        `<rect x="244" y="${146 + i * 12}" width="${[112, 132, 96, 126, 84, 118, 62][i]}" height="4" rx="2"
               fill="${s}" opacity="${.85 - i * .08}"/>`).join('');
    default: return '';
  }
}

function posterSVG(project) {
  const a = ACCENTS[project.accent] || ACCENTS.a;
  const copy = project[state.lang];
  const label = project.poster.label;

  // viewBox = systeme de coordonnees interne. Le SVG s'etire ensuite a la
  // taille de son conteneur sans jamais pixeliser.
  return `
<svg viewBox="0 0 400 250" role="img" aria-label="${escapeAttr(copy.title)}" preserveAspectRatio="xMidYMid slice">
  <rect width="400" height="250" fill="${a.bg}"/>
  ${motif(project.poster.figure, a.fg)}
  <text x="28" y="60" fill="${a.fg}" font-size="15" font-weight="700"
        font-family="system-ui, sans-serif" letter-spacing="-.3">${escapeAttr(copy.title)}</text>
  <text x="28" y="82" fill="${a.sub}" font-size="10.5" font-weight="500"
        font-family="system-ui, sans-serif">${escapeAttr(copy.client)}</text>
  <text x="28" y="218" fill="${a.fg}" font-size="30" font-weight="750"
        font-family="system-ui, sans-serif" letter-spacing="-1.2">${escapeAttr(label)}</text>
</svg>`;
}

/* Neutralise les caracteres qui ont un sens special en XML/HTML.
   Les titres viennent de content.js (donc de nous), mais un texte qui
   contiendrait "&" ou "<" casserait le SVG : autant proteger par principe. */
function escapeAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}


/* ==========================================================================
   5. FABRIQUES DE PAGES
   --------------------------------------------------------------------------
   Chaque fonction rend un element DOM complet. Aucune ne touche a la page :
   c'est le routeur (section 7) qui decide quoi afficher. Cette separation
   rend chaque page testable et remplacable independamment.

   NOTE SUR innerHTML : il est utilise ici avec des gabarits que NOUS
   ecrivons, dont les valeurs viennent de content.js — un fichier de notre
   depot, pas d'une saisie utilisateur. Le prenom du visiteur, lui, ne passe
   JAMAIS par innerHTML : voir renderHello() juste en dessous.
   ========================================================================== */

/* ---- 5a. Le "Bonjour Prenom" -------------------------------------------
   La seule fonction du fichier qui manipule une donnee venue du visiteur.
   Elle construit deux noeuds de texte separes, et le prenom est pose avec
   textContent. Meme si state.visitor contenait du HTML, il s'afficherait
   comme du texte brut. */
function renderHello() {
  const wrap = el('p', { class: 'hero__hello' });
  if (state.visitor) {
    wrap.append(document.createTextNode(t().helloVisitor('') + ' '));
    const strong = el('b');
    strong.textContent = state.visitor;   // <- l'insertion sure
    wrap.append(strong);
  } else {
    wrap.textContent = t().helloVisitor('');
  }
  return wrap;
}

/* ---- 5b. Une carte de projet ---- */
function projectCard(p) {
  const c = p[state.lang];
  const href = p.external ? p.external : `#/${p.kind}/${p.slug}`;
  const isExt = Boolean(p.external);

  const card = el('a', {
    class: 'card',
    href,
    // Un lien externe s'ouvre dans un nouvel onglet. rel="noopener" empeche
    // la page ouverte d'acceder a la notre via window.opener : c'est une
    // faille classique, et l'attribut la ferme.
    target: isExt ? '_blank' : null,
    rel: isExt ? 'noopener noreferrer' : null
  });

  card.innerHTML = `
    <div class="card__poster">${posterSVG(p)}</div>
    <div class="card__body">
      <div class="card__meta">
        <span>${escapeAttr(c.client)}</span><span class="dot"></span><span>${escapeAttr(p.year)}</span>
      </div>
      <h3 class="card__title">${escapeAttr(c.title)}</h3>
      <p class="card__tagline">${escapeAttr(c.tagline)}</p>
      <ul class="card__tags">${c.tags.map(x => `<li class="tag">${escapeAttr(x)}</li>`).join('')}</ul>
      <span class="card__more">${escapeAttr(isExt ? t().seeProject : t().seeMore)}
        <span class="arrow" aria-hidden="true">→</span></span>
    </div>`;
  return card;
}

/* ---- 5c. La page d'accueil ---- */
function pageHome() {
  const d = t(), h = HERO[state.lang];
  const page = el('div');

  const hero = el('section', { class: 'hero' });
  const wrap = el('div', { class: 'wrap' });
  wrap.append(renderHello());                      // d'abord le bonjour personnalise
  wrap.insertAdjacentHTML('beforeend', `
    <p class="kicker hero__kicker">${escapeAttr(d.heroKicker)}</p>
    <p class="hero__lead">${escapeAttr(h.lead)}</p>
    <p class="hero__lead">${escapeAttr(h.lead2)}</p>
    <a class="hero__gap" href="#/gap">
      <span>${escapeAttr(h.gapLink)}</span><span aria-hidden="true">→</span>
    </a>`);
  hero.append(wrap);
  page.append(hero, el('hr', { class: 'rule' }));

  // Les deux listes de projets, filtrees par `kind`.
  for (const kind of ['work', 'side']) {
    const list = PROJECTS.filter(p => p.kind === kind);
    const sec = el('section', { class: 'section', id: kind });
    const w = el('div', { class: 'wrap' });
    w.insertAdjacentHTML('beforeend', `
      <div class="section__head">
        <h2>${escapeAttr(kind === 'work' ? d.workTitle : d.sideTitle)}</h2>
        <p>${escapeAttr(kind === 'work' ? d.workIntro : d.sideIntro)}</p>
      </div>`);
    const grid = el('div', { class: 'cards' });
    list.forEach(p => grid.append(projectCard(p)));
    w.append(grid);
    sec.append(w);
    page.append(sec);
    if (kind === 'work') page.append(el('hr', { class: 'rule' }));
  }
  return page;
}

/* ---- 5d. Une page de liste (Projets / A cote) ---- */
function pageList(kind) {
  const d = t();
  const page = el('div', { class: 'section' });
  const w = el('div', { class: 'wrap' });
  w.insertAdjacentHTML('beforeend', `
    <div class="section__head">
      <h1>${escapeAttr(kind === 'work' ? d.workTitle : d.sideTitle)}</h1>
      <p>${escapeAttr(kind === 'work' ? d.workIntro : d.sideIntro)}</p>
    </div>`);
  const grid = el('div', { class: 'cards' });
  PROJECTS.filter(p => p.kind === kind).forEach(p => grid.append(projectCard(p)));
  w.append(grid);
  page.append(w);
  return page;
}

/* ---- 5e. Une etude de cas ----
   Structure : en-tete "30 secondes", puis grille [nav laterale | sections],
   puis lien vers le projet suivant. */
function pageCase(project) {
  const d = t(), c = project[state.lang];
  const page = el('article', { class: 'cs' });

  // La route de cette page. Les liens vers les sections s'ecrivent
  // `base + '#' + id` : ce sont donc de VRAIS liens, qui fonctionnent aussi
  // en ouverture dans un nouvel onglet ou en copier-coller. Le JS ne fait
  // qu'ameliorer le comportement (defilement doux) — il n'est pas requis.
  const base = `#/${project.kind}/${project.slug}`;

  /* --- En-tete : l'essentiel, lisible sans scroller --- */
  const head = el('header', { class: 'cs__head' });
  const hw = el('div', { class: 'wrap' });

  const stats = (c.stats || []).map(s =>
    `<div class="stat"><div class="stat__n">${escapeAttr(s.n)}</div>
     <div class="stat__l">${escapeAttr(s.l)}</div></div>`).join('');

  const hasProcess = (c.sections || []).length > 0;

  hw.insertAdjacentHTML('beforeend', `
    ${c.isDraft ? `<p style="margin-bottom:var(--s4)"><span class="draft-badge">${escapeAttr(d.draftBadge)}</span></p>` : ''}
    <p class="cs__client">${escapeAttr(c.client)}</p>
    <h1 class="cs__title">${escapeAttr(c.title)}</h1>
    <p class="cs__tagline">${escapeAttr(c.tagline)}</p>

    <dl class="gist">
      <div><dt>${escapeAttr(d.csRole)}</dt><dd>${escapeAttr(c.gist.role)}</dd></div>
      <div><dt>${escapeAttr(d.csDuration)}</dt><dd>${escapeAttr(c.gist.duration)}</dd></div>
      <div><dt>${escapeAttr(d.csTeam)}</dt><dd>${escapeAttr(c.gist.team)}</dd></div>
      <div><dt>${escapeAttr(d.csTools)}</dt><dd>${escapeAttr(c.gist.tools)}</dd></div>
    </dl>

    <div class="pair">
      <div><h2>${escapeAttr(d.csProblem)}</h2><p>${escapeAttr(c.problem)}</p></div>
      <div class="pair__out"><h2>${escapeAttr(d.csOutcome)}</h2><p>${escapeAttr(c.outcome)}</p></div>
    </div>

    ${stats ? `<div class="stats">${stats}</div>` : ''}

    <div class="cs__cta">
      ${hasProcess ? `<a class="btn btn--primary" href="${base}#${escapeAttr(c.sections[0].id)}"
           data-scrollto="${escapeAttr(c.sections[0].id)}">${escapeAttr(d.readFull)} ↓</a>` : ''}
      ${(c.extLinks || []).map(l =>
        `<a class="btn btn--ghost" href="${escapeAttr(l.href)}" target="_blank" rel="noopener noreferrer">
           ${escapeAttr(l.label)} ↗</a>`).join('')}
      ${project.external ? `<a class="btn btn--primary" href="${escapeAttr(project.external)}"
           target="_blank" rel="noopener noreferrer">${escapeAttr(d.seeProject)} ↗</a>` : ''}
    </div>

    ${c.draftNote ? `<p class="todo" style="margin-top:var(--s6)">${escapeAttr(c.draftNote)}</p>` : ''}
  `);
  head.append(hw);
  page.append(head);

  /* --- Corps : nav laterale + sections de processus --- */
  if (hasProcess) {
    const body = el('div', { class: 'wrap' });
    const grid = el('div', { class: 'cs__body' });

    // La navigation collante. <nav> + <ol> : une liste ordonnee, parce que
    // les etapes d'un processus ont un ordre. Le lecteur d'ecran l'annonce.
    const nav = el('nav', { class: 'cs-nav', 'aria-label': d.csSections });
    nav.innerHTML = `
      <p class="cs-nav__title">${escapeAttr(d.csProcess)}</p>
      <ol>
        ${c.sections.map((s, i) => `
          <li><a href="${base}#${escapeAttr(s.id)}" data-spy="sec-${escapeAttr(s.id)}">
            <span class="cs-nav__num">${String(i + 1).padStart(2, '0')}</span>
            <span>${escapeAttr(s.label)}</span>
          </a></li>`).join('')}
      </ol>
      <div class="cs-nav__prog">
        <div class="cs-nav__track" role="progressbar" aria-valuemin="0" aria-valuemax="100"
             aria-valuenow="0" aria-label="${escapeAttr(d.csProgress)}">
          <div class="cs-nav__bar" id="cs-bar"></div>
        </div>
        <p class="cs-nav__pct" id="cs-pct">0%</p>
      </div>`;

    // Les sections elles-memes.
    const secs = el('div');
    c.sections.forEach(s => {
      const sec = el('section', { class: 'cs-sec', id: `sec-${s.id}` });
      const fig = s.image ? figureFor(s) : '';
      sec.innerHTML = `
        <h2 class="cs-sec__title">${escapeAttr(s.title)}</h2>
        ${s.body.map(p => `<p>${escapeAttr(p)}</p>`).join('')}
        ${fig}`;
      secs.append(sec);
    });

    grid.append(nav, secs);
    body.append(grid);
    page.append(body);
  }

  /* --- Pied : le projet suivant ---
     On tourne dans la liste : apres le dernier, on revient au premier.
     L'operateur % (modulo) fait ce bouclage en une ligne. */
  const siblings = PROJECTS.filter(p => p.kind === project.kind);
  const idx = siblings.findIndex(p => p.slug === project.slug);
  const next = siblings[(idx + 1) % siblings.length];
  if (next && next.slug !== project.slug) {
    const nc = next[state.lang];
    const foot = el('div', { class: 'wrap' });
    foot.insertAdjacentHTML('beforeend', `
      <div class="cs-next">
        <p class="kicker cs-next__kicker">${escapeAttr(d.csNext)}</p>
        <a class="cs-next__link" href="${next.external ? escapeAttr(next.external) : `#/${next.kind}/${next.slug}`}"
           ${next.external ? 'target="_blank" rel="noopener noreferrer"' : ''}>
          <div>
            <h2 class="cs-next__t">${escapeAttr(nc.title)}</h2>
            <p class="cs-next__s">${escapeAttr(nc.tagline)}</p>
          </div>
          <span class="cs-next__arrow" aria-hidden="true">→</span>
        </a>
      </div>`);
    page.append(foot);
  }

  return page;
}

/* Construit le balisage d'une figure.
   <picture> permet d'offrir le WebP (leger) avec un repli PNG : le
   navigateur prend le premier format qu'il sait lire. loading="lazy" evite
   de telecharger les images encore hors de l'ecran.
   `frOnly` signale honnetement les visuels dont les annotations n'existent
   qu'en francais, plutot que de laisser un lecteur anglophone perplexe. */
function figureFor(s) {
  const base = `assets/img/${s.image}`;
  const note = (s.frOnly && state.lang === 'en')
    ? `<span class="figure__note">${escapeAttr(t().csFigureFR)}</span>` : '';
  return `
    <figure class="figure">
      <div class="figure__frame">
        <picture>
          <source srcset="${base}.webp" type="image/webp">
          <img src="${base}.png" alt="${escapeAttr(s.caption || '')}" loading="lazy" decoding="async">
        </picture>
      </div>
      <figcaption>${escapeAttr(s.caption || '')}${note}</figcaption>
    </figure>`;
}

/* ---- 5f. Une page editoriale (A propos, article) ---- */
function pageEditorial(key) {
  const d = t(), p = PAGES[key][state.lang];
  const page = el('div', { class: 'editorial' });
  const w = el('div', { class: 'wrap wrap--narrow' });

  const blocks = p.blocks.map(b => `
    <div class="editorial__block">
      ${b.h ? `<h2>${escapeAttr(b.h)}</h2>` : ''}
      ${b.p.map(par => {
        // Un paragraphe entierement entre crochets est une consigne de
        // redaction, pas du contenu : on l'affiche en jaune pour qu'il soit
        // impossible de le publier par distraction.
        const isTodo = /^\[.*\]$/s.test(par.trim());
        return `<p class="${isTodo ? 'todo' : ''}">${escapeAttr(par)}</p>`;
      }).join('')}
    </div>`).join('');

  w.insertAdjacentHTML('beforeend', `
    ${p.isDraft ? `<p style="margin-bottom:var(--s4)"><span class="draft-badge">${escapeAttr(d.draftBadge)}</span></p>` : ''}
    <h1 class="editorial__title">${escapeAttr(p.title)}</h1>
    <p class="editorial__lede">${escapeAttr(p.lede)}</p>
    ${blocks}`);
  page.append(w);
  return page;
}

/* ---- 5g. La page 404 ---- */
function pageNotFound() {
  const d = t();
  const page = el('div', { class: 'editorial' });
  page.innerHTML = `
    <div class="wrap wrap--narrow">
      <h1 class="editorial__title">${escapeAttr(d.notFoundTitle)}</h1>
      <p class="editorial__lede">${escapeAttr(d.notFoundBody)}</p>
      <a class="btn btn--primary" href="#/">${escapeAttr(d.notFoundCta)}</a>
    </div>`;
  return page;
}


/* ==========================================================================
   6. PIED DE PAGE
   Reconstruit a chaque changement de langue plutot qu'ecrit dans index.html :
   une seule source de verite pour les libelles.
   ========================================================================== */

function buildFooter() {
  const d = t();
  $('#site-foot').innerHTML = `
    <div class="wrap foot">
      <div class="foot__grid">
        <div>
          <p class="foot__name">${escapeAttr(SITE.name)}</p>
          <p class="foot__note">${escapeAttr(d.footerNote)}</p>
          <a class="btn btn--ghost" href="${escapeAttr(SITE.links.resume)}"
             target="_blank" rel="noopener noreferrer">${escapeAttr(d.footerResume)} ↗</a>
        </div>
        <div>
          <h3>${escapeAttr(d.footerSitemap)}</h3>
          <ul>
            <li><a href="#/">${escapeAttr(d.navHome)}</a></li>
            <li><a href="#/work">${escapeAttr(d.navWork)}</a></li>
            <li><a href="#/side">${escapeAttr(d.navSide)}</a></li>
            <li><a href="#/about">${escapeAttr(d.navAbout)}</a></li>
            <li><a href="#/gap">${escapeAttr(HERO[state.lang].gapLink)}</a></li>
          </ul>
        </div>
        <div>
          <h3>${escapeAttr(d.footerContact)}</h3>
          <ul>
            <li><a href="mailto:${escapeAttr(SITE.email)}">${escapeAttr(SITE.email)}</a></li>
            <li><a href="${escapeAttr(SITE.links.linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a></li>
            <li><a href="${escapeAttr(SITE.links.dribbble)}" target="_blank" rel="noopener noreferrer">Dribbble ↗</a></li>
          </ul>
        </div>
      </div>
      <div class="foot__bottom">
        <span>© ${new Date().getFullYear()} ${escapeAttr(SITE.name)}. ${escapeAttr(d.footerRights)}</span>
        <span>FR / EN</span>
      </div>
    </div>`;
}


/* ==========================================================================
   7. LE ROUTEUR
   --------------------------------------------------------------------------
   POURQUOI DES URL EN #/ ET PAS /work/constraints ?
   Une SPA a besoin que le serveur renvoie index.html pour toutes les URL.
   Avec des chemins classiques, il faut donc configurer le serveur — et selon
   l'hebergeur ce n'est pas toujours possible. Le hash (#) est traite
   entierement cote navigateur : le site fonctionne tel quel sur GitHub
   Pages, Netlify, un simple dossier ouvert en local, n'importe ou.
   Compromis assume : les URL sont un peu moins jolies.
   ========================================================================== */

/* Traduit un hash en description de page.

   Un hash peut porter une ancre en plus de la route :
       #/work/constraints#mapping
        \_____route_____/ \ancre/
   L'ancre sert a descendre jusqu'a une section ; elle ne fait PAS partie de
   l'identite de la page. On la coupe donc ici (split('#')[0]), sinon la
   route deviendrait "work / constraints#mapping" et ne correspondrait a
   aucun projet — le site afficherait une 404 sur un lien pourtant valide. */
function parseRoute(hash) {
  const routePart = hash.replace(/^#\/?/, '').split('#')[0];
  // filter(Boolean) supprime les cases vides dues aux slashs en trop.
  const parts = routePart.split('/').filter(Boolean);
  if (parts.length === 0)                       return { name: 'home' };
  if (parts[0] === 'about')                     return { name: 'about' };
  if (parts[0] === 'gap')                       return { name: 'gap' };
  if (parts[0] === 'work' || parts[0] === 'side') {
    if (!parts[1]) return { name: 'list', kind: parts[0] };
    const p = PROJECTS.find(x => x.slug === parts[1] && x.kind === parts[0]);
    return p ? { name: 'case', project: p } : { name: '404' };
  }
  return { name: '404' };
}

function render() {
  runCleanup();                       // on demonte proprement la page precedente

  const hash  = location.hash || '#/';
  const route = parseRoute(hash);
  state.route = hash;

  // Choix de la page a construire.
  let node, title = SITE.name;
  switch (route.name) {
    case 'home':  node = pageHome();                    break;
    case 'list':  node = pageList(route.kind);
                  title = `${route.kind === 'work' ? t().workTitle : t().sideTitle} — ${SITE.name}`; break;
    case 'case':  node = pageCase(route.project);
                  title = `${route.project[state.lang].title} — ${SITE.name}`; break;
    case 'about': node = pageEditorial('about');
                  title = `${t().navAbout} — ${SITE.name}`; break;
    case 'gap':   node = pageEditorial('gap');
                  title = `${HERO[state.lang].gapLink} — ${SITE.name}`; break;
    default:      node = pageNotFound(); title = `404 — ${SITE.name}`;
  }

  const main = $('#main');

  // La fonction qui remplace reellement le contenu.
  const swap = () => {
    main.replaceChildren(node);       // vide puis remplit, en une operation
    main.classList.remove('is-entering');
    // void main.offsetWidth force le navigateur a recalculer la mise en page
    // MAINTENANT. Sans cette ligne, retirer puis remettre la classe dans la
    // meme instruction ne relancerait pas l'animation.
    void main.offsetWidth;
    main.classList.add('is-entering');
  };

  // Transition de page. startViewTransition est l'API moderne : le navigateur
  // photographie l'ancien et le nouvel etat et interpole entre les deux.
  // On verifie sa presence avant de l'appeler, sinon on remplace directement.
  if (document.startViewTransition && !prefersReducedMotion()) {
    document.startViewTransition(swap);
  } else {
    swap();
  }

  document.title = title;
  markActiveNav(route);
  setupBackLink(route);
  closeMobileNav();

  // Remonter en haut a chaque changement de page — sauf si l'URL vise une
  // ancre precise, cas ou l'on doit au contraire descendre jusqu'a elle.
  const anchor = hash.split('#')[2];
  if (anchor) {
    // requestAnimationFrame attend la prochaine image affichee : a ce
    // moment la, le DOM est en place et l'element existe vraiment.
    requestAnimationFrame(() => $(`#sec-${anchor}`)?.scrollIntoView({ block: 'start' }));
  } else {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  // On deplace le focus sur <main> : sans ca, un lecteur d'ecran continue
  // d'annoncer l'ancienne page et l'utilisateur clavier repart du debut.
  main.focus({ preventScroll: true });

  if (route.name === 'case') setupCaseBehaviours();
  setupScrollProgress();
}

/* Souligne l'entree de menu correspondant a la page affichee. */
function markActiveNav(route) {
  const map = { home: null, list: route.kind, case: route.project?.kind, about: 'about', gap: null };
  const current = map[route.name] ?? null;
  $$('.site-nav a[data-nav]').forEach(a => {
    if (a.dataset.nav === current) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

/* Le lien retour persistant : visible seulement sur les pages de detail.
   Sa destination est deduite du type de projet, pour revenir a la bonne
   liste plutot que systematiquement a l'accueil. */
function setupBackLink(route) {
  const link = $('#back-link');
  const deep = ['case', 'about', 'gap'].includes(route.name);
  link.hidden = !deep;
  if (!deep) return;
  link.href = route.name === 'case' ? `#/${route.project.kind}` : '#/';
}

function closeMobileNav() {
  $('#site-nav').classList.remove('is-open');
  $('#nav-toggle').setAttribute('aria-expanded', 'false');
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}


/* ==========================================================================
   8. COMPORTEMENTS DE DEFILEMENT
   ========================================================================== */

/* ---- 8a. Barre de progression globale ----
   Le cahier des charges demande un "indicateur de position indiquant la
   distance restante jusqu'a la fin". */
function setupScrollProgress() {
  const fill = $('#progress-fill');
  const head = $('#site-head');

  const update = () => {
    // scrollHeight = hauteur totale du document.
    // innerHeight  = hauteur de la fenetre.
    // La difference est la distance maximale que l'on peut parcourir.
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0;
    fill.style.width = pct + '%';
    head.classList.toggle('is-scrolled', window.scrollY > 8);
  };

  // { passive: true } promet au navigateur qu'on n'appellera pas
  // preventDefault(). Il peut alors continuer a defiler sans attendre notre
  // fonction : le scroll reste fluide meme sur telephone.
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  addCleanup(() => {
    window.removeEventListener('scroll', update);
    window.removeEventListener('resize', update);
  });
  update();
}

/* ---- 8b. Nav laterale d'etude de cas : scroll-spy + progression ----
   IntersectionObserver previent quand un element entre ou sort de l'ecran.
   C'est bien plus efficace que de calculer la position de chaque section a
   chaque pixel de defilement : le navigateur fait le travail pour nous. */
function setupCaseBehaviours() {
  const links = $$('.cs-nav a[data-spy]');
  const secs  = $$('.cs-sec');
  if (!secs.length) return;

  const bar   = $('#cs-bar');
  const pct   = $('#cs-pct');
  const track = $('.cs-nav__track');

  /* --- scroll-spy --- */
  const setActive = (id) => links.forEach(a =>
    a.classList.toggle('is-active', a.dataset.spy === id));

  const io = new IntersectionObserver((entries) => {
    // Plusieurs sections peuvent etre visibles en meme temps. On retient
    // celle qui occupe le plus de place a l'ecran : c'est celle que le
    // visiteur est le plus probablement en train de lire.
    const visible = entries.filter(e => e.isIntersecting)
                           .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
    if (visible[0]) setActive(visible[0].target.id);
  }, {
    // rootMargin retrecit la zone de detection : -45% en haut et -45% en bas
    // laissent une bande centrale. Une section devient donc "active" quand
    // elle atteint le milieu de l'ecran, pas des qu'elle pointe le nez.
    rootMargin: '-45% 0px -45% 0px',
    threshold: [0, 0.25, 0.5, 1]
  });
  secs.forEach(s => io.observe(s));
  addCleanup(() => io.disconnect());   // indispensable : sinon l'observateur survit

  /* --- progression dans le processus --- */
  const first = secs[0], last = secs[secs.length - 1];
  const updateProgress = () => {
    const start = first.offsetTop;
    const end   = last.offsetTop + last.offsetHeight - window.innerHeight * 0.6;
    const span  = Math.max(1, end - start);
    const p = Math.round(Math.min(100, Math.max(0, ((window.scrollY - start) / span) * 100)));
    bar.style.width = p + '%';
    pct.textContent = p + '%';
    // On met aussi a jour aria-valuenow : un lecteur d'ecran peut alors
    // annoncer la progression, exactement comme la barre le montre a l'oeil.
    track.setAttribute('aria-valuenow', String(p));
  };
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
  addCleanup(() => {
    window.removeEventListener('scroll', updateProgress);
    window.removeEventListener('resize', updateProgress);
  });
  updateProgress();

  /* --- clics sur la nav laterale ---
     On intercepte pour eviter que le hash de l'ancre n'ecrase le hash de
     route (ce qui declencherait un changement de page). */
  links.forEach(a => {
    const onClick = (ev) => {
      ev.preventDefault();
      const target = document.getElementById(a.dataset.spy);
      target?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    };
    a.addEventListener('click', onClick);
    addCleanup(() => a.removeEventListener('click', onClick));
  });

  /* --- bouton "Lire le processus complet" --- */
  const cta = $('[data-scrollto]');
  if (cta) {
    const onCta = (ev) => {
      ev.preventDefault();
      document.getElementById(`sec-${cta.dataset.scrollto}`)
        ?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    };
    cta.addEventListener('click', onCta);
    addCleanup(() => cta.removeEventListener('click', onCta));
  }
}


/* ==========================================================================
   9. LE PORTAIL DU PRENOM
   ========================================================================== */

function setupGate() {
  const gate  = $('#gate');
  const form  = $('#gate-form');
  const input = $('#gate-input');
  const error = $('#gate-error');
  const skip  = $('#gate-skip');

  const open = () => {
    gate.hidden = false;
    document.body.classList.add('is-locked');
    // Le focus part dans le champ : la personne peut taper immediatement,
    // sans avoir a cliquer. Et au clavier, c'est le seul comportement correct.
    requestAnimationFrame(() => input.focus());
  };

  const close = () => {
    gate.hidden = true;
    document.body.classList.remove('is-locked');
    render();                                   // la page se redessine avec le prenom
    $('#main').focus({ preventScroll: true });
  };

  // 'submit' plutot que le clic sur le bouton : cela couvre aussi la touche
  // Entree, qui est la facon la plus naturelle de valider un champ unique.
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();                        // sinon le navigateur recharge la page
    const value = cleanName(input.value);       // <- le filtre de securite

    if (value.length < 2) {
      error.hidden = false;
      error.textContent = t().gateError;
      input.classList.add('is-invalid');
      input.focus();
      return;
    }
    state.visitor = capitalize(value);           // en memoire, nulle part ailleurs
    close();
  });

  // Retirer le message d'erreur des que la personne corrige : laisser une
  // erreur affichee pendant qu'on tape est desagreable et inutile.
  input.addEventListener('input', () => {
    error.hidden = true;
    input.classList.remove('is-invalid');
  });

  skip.addEventListener('click', close);

  // Echap = passer. Un dialogue modal doit toujours offrir une sortie clavier.
  gate.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') close(); });

  return { open };

  /* --- NOTE : ET SI ON VOULAIT NE PAS REDEMANDER LE PRENOM ? ---
     Actuellement, rafraichir la page repose la question, car state.visitor
     ne vit qu'en memoire. Pour s'en souvenir le temps de l'onglet, ajoutez
     dans le submit :         sessionStorage.setItem('v', state.visitor);
     et au demarrage :        state.visitor = cleanName(sessionStorage.getItem('v') || '');
     sessionStorage n'est pas une base de donnees, reste sur la machine du
     visiteur et s'efface a la fermeture de l'onglet. Repassez toujours la
     valeur relue par cleanName() : ce qui sort d'un stockage doit etre
     traite avec la meme mefiance que ce qui sort d'un formulaire. */
}


/* ==========================================================================
   10. LOADER ET DEMARRAGE
   ========================================================================== */

/* Precharge les images pour qu'aucune ne "pope" pendant la navigation.
   Le cahier des charges demande que tout soit charge une seule fois a
   l'arrivee, puis plus jamais.

   La promesse est resolue quand toutes les images sont traitees. On utilise
   `settled` plutot que `then` sur chacune : une image manquante ne doit pas
   bloquer eternellement l'entree sur le site. */
function preloadImages(onProgress) {
  // On rassemble les visuels des deux langues : ainsi, changer de langue
  // plus tard n'entraine aucun telechargement.
  const names = new Set();
  PROJECTS.forEach(p => ['fr', 'en'].forEach(l =>
    (p[l].sections || []).forEach(s => {
      if (s.image) names.add(s.image);
      if (s.altImage) names.add(s.altImage);
    })));

  const urls = Array.from(names).map(n => `assets/img/${n}.webp`);
  let done = 0;
  const total = urls.length || 1;

  return Promise.all(urls.map(url => new Promise(resolve => {
    const img = new Image();
    const finish = () => { done++; onProgress(done / total); resolve(); };
    img.onload = finish;
    img.onerror = finish;                       // on continue meme en cas d'echec
    img.src = url;
  }))).then(() => onProgress(1));
}

function start() {
  const loader = $('#loader');
  const bar    = $('.loader__bar');

  // Detection de langue : si le navigateur du visiteur est en anglais, on
  // ouvre en anglais. Un petit geste qui evite un clic a la moitie des gens.
  const nav = (navigator.language || 'fr').toLowerCase();
  state.lang = nav.startsWith('en') ? 'en' : 'fr';

  applyStaticI18n();
  buildFooter();

  const gate = setupGate();

  /* --- Ecouteurs globaux, installes une seule fois --- */

  // hashchange se declenche a chaque changement de la partie apres le #.
  // C'est le moteur de notre navigation.
  window.addEventListener('hashchange', render);

  // Selecteur de langue.
  $$('[data-setlang]').forEach(b =>
    b.addEventListener('click', () => setLang(b.dataset.setlang)));

  // Menu mobile.
  const toggle = $('#nav-toggle');
  toggle.addEventListener('click', () => {
    const open = $('#site-nav').classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  // Un clic sur un lien de navigation referme le menu mobile.
  $$('.site-nav a').forEach(a => a.addEventListener('click', closeMobileNav));

  // Echap referme le menu mobile ouvert.
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') closeMobileNav();
  });

  /* --- Sequence d'ouverture --- */
  preloadImages(p => { bar.style.width = Math.round(p * 100) + '%'; })
    .then(() => {
      // Petite pause : sans elle, sur une connexion rapide, le loader
      // clignote une fraction de seconde, ce qui est plus desagreable
      // qu'une attente courte mais franche.
      setTimeout(() => {
        loader.classList.add('is-done');
        render();          // on dessine la page tout de suite, derriere le portail
        gate.open();       // puis on pose la question
      }, 260);
    });
}

// C'est parti. type="module" garantit que le HTML est deja en place ici.
start();
