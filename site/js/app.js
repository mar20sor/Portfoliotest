/* ==========================================================================
   app.js — TOUTE la logique du site
   --------------------------------------------------------------------------
   Plan du fichier :
     0. Imports et petits outils
     1. L'etat de l'application (les seules donnees qui changent)
     2. Securite : nettoyage du prenom saisi
     3. Libelles d'interface statiques (data-i18n)
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

import { SITE, UI, HERO, PROJECTS, PAGES, MEDIA } from './content.js';

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

/* Raccourci vers les libelles d'interface. t().navWork, t().csBack, etc.
   Le site n'a plus qu'une langue : cette fonction ne fait plus d'aiguillage,
   elle existe pour eviter de reecrire tous les `const d = t()` du fichier. */
const t = () => UI;


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
  return s ? s[0].toLocaleUpperCase('en') + s.slice(1) : s;
}


/* ==========================================================================
   3. LIBELLES D'INTERFACE STATIQUES
   --------------------------------------------------------------------------
   Deux mecanismes complementaires :
     - les elements PORTANT data-i18n="cle" sont remplis automatiquement par
       applyStaticI18n(). C'est le cas du balisage fixe d'index.html.
     - les pages generees en JS lisent directement t().cle a la construction.
   Le site n'a qu'une langue (anglais) : cette fonction n'a plus a choisir
   entre deux jeux de textes, mais le mecanisme reste utile pour garder
   index.html sans texte code en dur.
   ========================================================================== */

function applyStaticI18n() {
  const d = t();
  $$('[data-i18n]').forEach(node => {
    const value = d[node.dataset.i18n];
    // On ignore tout ce qui n'est pas une chaine : certaines entrees sont des
    // fonctions ou des tableaux, et sont utilisees a la main la ou il faut.
    if (typeof value === 'string') node.textContent = value;
  });

  // Le placeholder et le lien mailto ne sont pas du "contenu texte",
  // ils vivent dans des attributs : on les traite separement.
  const input = $('#gate-input');
  if (input) input.setAttribute('placeholder', d.gatePlaceholder);
  const contact = $('#nav-contact');
  if (contact) contact.href = `mailto:${SITE.email}`;
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

/* Sept variantes construites sur les DEUX couleurs de la maquette (#2078F0 et
   #BEF007) plus le blanc. On alterne fond sombre, fond blanc et fond lime pour
   que deux projets voisins ne se ressemblent pas, sans jamais introduire de
   teinte etrangere a la charte. */
const ACCENTS = {
  a: { bg: '#0C4CA8', fg: '#BEF007', sub: 'rgba(255,255,255,.66)' },
  b: { bg: '#2078F0', fg: '#FFFFFF', sub: 'rgba(255,255,255,.72)' },
  c: { bg: '#FFFFFF', fg: '#2078F0', sub: 'rgba(32,120,240,.7)'  },
  d: { bg: '#BEF007', fg: '#16220A', sub: 'rgba(22,34,10,.66)'   },
  e: { bg: '#08306B', fg: '#FFFFFF', sub: 'rgba(255,255,255,.6)' },
  f: { bg: '#0C4CA8', fg: '#FFFFFF', sub: 'rgba(255,255,255,.66)'},
  g: { bg: '#FFFFFF', fg: '#0C4CA8', sub: 'rgba(12,76,168,.7)'   }
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
  const copy = project;
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
   La maquette place le prenom AU MILIEU de la phrase : "Hey [prenom], nice to
   meet you!". On assemble donc trois morceaux, et le prenom est pose avec
   textContent. Meme si state.visitor contenait du HTML, il s'afficherait
   comme du texte brut. */
function renderHello() {
  const d = t();
  const wrap = el('p', { class: 'hero__hello' });
  if (state.visitor) {
    wrap.append(document.createTextNode(d.helloBefore + ' '));
    const strong = el('b');
    strong.textContent = state.visitor;      // <- l'insertion sure
    wrap.append(strong, document.createTextNode(d.helloAfter));
  } else {
    wrap.textContent = d.helloAnon;
  }
  return wrap;
}

/* ---- 5a bis. La phrase du heros ----------------------------------------
   Parcourt les morceaux definis dans content.js et fabrique l'element qui
   correspond au role de chacun. Tout passe par textContent : la ponctuation
   typographique (guillemets, apostrophes courbes) ne peut donc rien casser. */
function renderStatement(lines) {
  const box = el('p', { class: 'hero__statement' });
  lines.forEach((segments, i) => {
    segments.forEach(seg => {
      let node;
      if (seg.to)          node = el('a', { href: seg.to });
      else if (seg.u)      node = el('u');
      else if (seg.accent) node = el('span', { class: 'accent' });
      else                 node = document.createTextNode(seg.t);

      if (node.nodeType !== 3) node.textContent = seg.t;
      box.append(node);
    });
    // Retour a la ligne entre chaque phrase, sauf apres la derniere.
    if (i < lines.length - 1) box.append(el('br'));
  });
  return box;
}

/* ---- 5b. Une carte de projet -------------------------------------------
   Structure calquee sur la maquette : le visuel, puis le nom du client, puis
   le titre souligne, puis les etiquettes. Pas de cadre autour de la carte :
   l'image est posee directement sur le bleu. */
function projectCard(p) {
  const c = p;
  const href = p.external ? p.external : `#/${p.kind}/${p.slug}`;
  const isExt = Boolean(p.external);

  const card = el('a', {
    class: 'card',
    href,
    // Un lien externe s'ouvre dans un nouvel onglet. rel="noopener" empeche
    // la page ouverte d'acceder a la notre via window.opener : c'est une
    // faille classique, et l'attribut la ferme.
    target: isExt ? '_blank' : null,
    rel: isExt ? 'noopener noreferrer' : null,
    'aria-label': `${c.title} — ${c.client}`
  });

  card.innerHTML = `
    <div class="card__media">${cardMedia(p)}</div>
    <div class="card__body">
      <div class="card__title-block">
        <p class="card__client">${escapeAttr(c.client)}</p>
        <p class="card__title">${emphasize(c.tagline)}</p>
      </div>
      <ul class="card__tags">${c.tags.map(x => `<li class="tag">${escapeAttr(x)}</li>`).join('')}</ul>
    </div>`;
  return card;
}

/* Choisit le visuel d'une carte, par ordre de preference :
     1. le media d'ouverture du projet (une video, quand il y en a une) ;
     2. sinon la DERNIERE figure extraite des PDF — presque toujours l'ecran
        final, donc le plus parlant ;
     3. sinon l'affiche SVG generee. */
function cardMedia(p) {
  const c = p;

  // 1. Le visuel d'ouverture sert de vignette. La video tourne en boucle,
  //    en sourdine, uniquement quand la carte est a l'ecran (setupVideos).
  if (c.heroMedia) {
    const url = escapeAttr(mediaUrl(c.heroMedia));
    return c.heroMedia.type === 'video'
      ? `<video src="${url}" muted loop playsinline preload="metadata"
                data-autoplay aria-hidden="true" tabindex="-1"
                disablepictureinpicture></video>`
      : `<img src="${url}" alt="" loading="lazy" decoding="async">`;
  }

  const sections = c.sections || [];
  const withImage = sections.filter(s => s.image);
  const last = withImage[withImage.length - 1];
  if (!last) return posterSVG(p);

  const base = `assets/img/${last.image}`;
  return `<picture>
      <source srcset="${base}.webp" type="image/webp">
      <img src="${base}.png" alt="" loading="lazy" decoding="async">
    </picture>`;
  // alt="" volontairement vide : l'image est decorative ici, le lien porte
  // deja son propre aria-label. Un alt redondant ferait lire deux fois la
  // meme chose au lecteur d'ecran.
}

/* Met en gras ce qui est encadre par des doubles asterisques, comme en
   Markdown : "de **24 a 9**" -> "de <b>24 a 9</b>".
   L'echappement a lieu AVANT le remplacement : le texte est donc neutralise,
   et seules les balises <b> que nous fabriquons nous-memes subsistent. */
function emphasize(str) {
  return escapeAttr(str).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
}

/* ---- 5c. La page d'accueil ----
   Reproduit la maquette : un heros de 400px cale au centre, puis la grille
   des projets. Le bloc de texte du heros est entierement construit par le
   code (pas de gabarit HTML), parce qu'il melange du contenu variable — le
   prenom du visiteur — a des liens et des mots accentues. */
function pageHome() {
  const d = t(), h = HERO;
  const page = el('div');

  /* --- Le heros --- */
  const hero = el('section', { class: 'hero' });
  const wrap = el('div', { class: 'wrap' });
  const text = el('div', { class: 'hero__text' });

  const block = el('div', { class: 'hero__block' });
  const lines = el('div', { class: 'hero__lines' });
  lines.append(el('p', { class: 'hero__name', text: h.name }));
  lines.append(renderStatement(h.statement));

  // Le lien vers l'article sur les deux ans, avec sa fleche.
  // La maquette utilise une icone SVG exportee ; elle n'etait pas
  // telechargeable, on utilise donc le caractere fleche, masque aux lecteurs
  // d'ecran puisqu'il n'apporte rien a l'oral.
  const gap = el('a', { class: 'hero__gap', href: '#/gap' });
  gap.append(
    el('span', { text: h.gapLink }),
    el('span', { class: 'arrow', 'aria-hidden': 'true', text: '↗' })
  );

  block.append(lines, gap);
  text.append(renderHello(), block);
  wrap.append(text);
  hero.append(wrap);
  page.append(hero);

  /* --- Les deux listes de projets, filtrees par `kind` --- */
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
  const d = t(), c = project;
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
    <p class="cs__tagline">${emphasize(c.tagline)}</p>

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
      ${(c.extLinks || []).map(l =>
        `<a class="btn btn--ghost" href="${escapeAttr(l.href)}" target="_blank" rel="noopener noreferrer">
           ${escapeAttr(l.label)} ↗</a>`).join('')}
      ${project.external ? `<a class="btn btn--primary" href="${escapeAttr(project.external)}"
           target="_blank" rel="noopener noreferrer">${escapeAttr(d.seeProject)} ↗</a>` : ''}
    </div>

    ${c.draftNote ? `<p class="todo" style="margin-top:var(--s6)">${escapeAttr(c.draftNote)}</p>` : ''}

    ${c.heroMedia ? `<div class="cs__hero-media">${mediaMarkup(c.heroMedia)}</div>` : ''}
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

      /* Les paragraphes, avec les medias intercales aux positions indiquees
         par `s.media`. La cle de cet objet est l'index du paragraphe apres
         lequel le groupe doit s'afficher — c'est ce qui permet de reproduire
         l'ordre exact d'une page source sans decouper la section. */
      const parts = s.body.map((p, i) => {
        const after = s.media && s.media[i] ? mediaGroup(s.media[i]) : '';
        return `<p>${escapeAttr(p)}</p>${after}`;
      }).join('');

      sec.innerHTML = `
        <h2 class="cs-sec__title">${escapeAttr(s.title)}</h2>
        ${parts}
        ${s.image ? figureFor(s) : ''}`;
      secs.append(sec);
    });

    grid.append(nav, secs);
    body.append(grid);
    page.append(body);
  }

  /* --- Pied : les autres projets ---
     Trois suggestions plutot qu'une seule : arrive au bas d'une etude de cas,
     un recruteur qui a aime doit avoir un choix, pas un couloir.

     On pioche dans TOUS les projets, pas seulement ceux de la meme categorie,
     ce qui garantit d'en trouver trois meme pour les projets "a cote" qui ne
     sont que deux. L'operateur % (modulo) fait tourner la liste en boucle :
     apres le dernier, on revient au premier. */
  const NEXT_COUNT = 3;
  const others = [];
  const startAt = PROJECTS.findIndex(p => p.slug === project.slug);
  for (let i = 1; others.length < NEXT_COUNT && i < PROJECTS.length; i++) {
    others.push(PROJECTS[(startAt + i) % PROJECTS.length]);
  }

  if (others.length) {
    const foot = el('div', { class: 'wrap' });
    const box  = el('div', { class: 'cs-next' });
    box.append(el('p', { class: 'kicker cs-next__kicker', text: d.csNext }));

    // On reutilise la carte de la page d'accueil : meme composant, donc un
    // seul endroit a maintenir si la carte evolue. Ses couleurs suivent le
    // theme de la page grace aux variables CSS.
    const grid = el('div', { class: 'cards cards--next' });
    others.forEach(p => grid.append(projectCard(p)));
    box.append(grid);
    foot.append(box);
    page.append(foot);
  }

  return page;
}

/* ---- 5e bis. LES MEDIAS HEBERGES (Contra) -------------------------------
   Deux fonctions seulement : une pour fabriquer l'URL, une pour le balisage.
   Tout passe par MEDIA (content.js), donc basculer du CDN vers des fichiers
   locaux ne demande de toucher a aucune de ces lignes. */

function mediaUrl(m) {
  // `src` l'emporte : c'est un fichier du depot, servi depuis assets/media.
  // Sans lui, on retombe sur l'identifiant et les bases distantes de MEDIA.
  if (m.src) return m.src;
  return m.type === 'video'
    ? MEDIA.videoBase + m.id + MEDIA.videoExt
    : MEDIA.imageBase + m.id + MEDIA.imageExt;
}

/* Balisage d'un media distant.

   POUR LES VIDEOS :
   - `muted` est OBLIGATOIRE pour que la lecture automatique soit autorisee.
     Tous les navigateurs bloquent le son declenche sans geste de l'utilisateur.
   - `playsinline` empeche iOS de passer en plein ecran de force.
   - `loop` boucle, `preload="metadata"` ne telecharge que l'entete tant que
     la video n'est pas visible.
   - PAS d'attribut `autoplay` : la lecture est pilotee par setupVideos(),
     qui ne demarre que ce qui est reellement a l'ecran et respecte le
     reglage systeme "mouvement reduit".
   - `aria-label` remplace le texte alternatif : une video n'a pas d'attribut
     alt, et sans libelle elle est muette pour un lecteur d'ecran. */
function mediaMarkup(m) {
  const url = escapeAttr(mediaUrl(m));
  const cap = escapeAttr(m.caption || '');
  // `poster` affiche une image fixe avant que la video ne demarre. Sans lui,
  // on voit un rectangle noir tant que le premier octet n'est pas arrive.
  const poster = m.poster ? ` poster="${escapeAttr(m.poster)}"` : '';
  // Le lecteur dotlottie-wc (charge en <script type="module"> dans
  // index.html) rend le JSON Lottie lui-meme : pas de poster, il n'y a pas
  // de premiere frame a telecharger separement comme pour une video.
  // Meme regle de mouvement reduit que setupVideos() pour les <video> : pas
  // de lecture automatique, mais les controles integres du lecteur pour que
  // la personne puisse la declencher elle-meme.
  const lottiePlay = prefersReducedMotion() ? 'controls' : 'autoplay loop';
  const inner = m.type === 'lottie'
    ? `<dotlottie-wc src="${url}" ${lottiePlay} aria-label="${cap}"></dotlottie-wc>`
    : m.type === 'video'
    ? `<video src="${url}"${poster} muted loop playsinline preload="metadata"
              data-autoplay aria-label="${cap}" disablepictureinpicture></video>`
    : `<img src="${url}" alt="${cap}" loading="lazy" decoding="async">`;
  const kind = m.type === 'lottie' ? 'figure figure--remote figure--lottie' : 'figure figure--remote';
  return `<figure class="${kind}">
      <div class="figure__frame">${inner}</div>
      ${cap ? `<figcaption>${cap}</figcaption>` : ''}
    </figure>`;
}

/* Un groupe de medias. A partir de deux elements, ils se rangent en grille
   plutot que de s'empiler : les captures de Contra vont par trois. */
function mediaGroup(list) {
  if (!list || !list.length) return '';
  const cls = list.length > 1 ? 'media-grid' : 'media-single';
  return `<div class="${cls}">${list.map(mediaMarkup).join('')}</div>`;
}

/* Construit le balisage d'une figure.
   <picture> permet d'offrir le WebP (leger) avec un repli PNG : le
   navigateur prend le premier format qu'il sait lire. loading="lazy" evite
   de telecharger les images encore hors de l'ecran.
   `frOnly` signale honnetement les visuels dont les annotations n'existent
   qu'en francais (image d'origine, jamais reproduite en anglais), plutot
   que de laisser un lecteur perplexe. */
function figureFor(s) {
  const base = `assets/img/${s.image}`;
  const note = s.frOnly
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
  const d = t(), p = PAGES[key];
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
            <li><a href="#/gap">${escapeAttr(HERO.gapLink)}</a></li>
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
/* La partie "page" d'un hash, sans son ancre de section.
   '#/work/constraints#mapping' et '#/work/constraints' donnent la meme cle :
   c'est ce qui permet de savoir qu'on est reste sur la meme page. */
function routeKey(hash) {
  return (hash || '#/').replace(/^#\/?/, '').split('#')[0];
}

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
                  title = `${route.project.title} — ${SITE.name}`; break;
    case 'about': node = pageEditorial('about');
                  title = `${t().navAbout} — ${SITE.name}`; break;
    case 'gap':   node = pageEditorial('gap');
                  title = `${HERO.gapLink} — ${SITE.name}`; break;
    default:      node = pageNotFound(); title = `404 — ${SITE.name}`;
  }

  const main = $('#main');

  /* THEME DE LA PAGE.
     Les etudes de cas passent sur fond blanc : ce sont des pages longues,
     faites pour etre lues, et le bleu sature fatigue sur cette duree. Le
     reste du site garde le bleu de la maquette.
     L'attribut est pose sur <html> et non sur <body> : ainsi la couleur de
     fond du document lui-meme suit, ce qui evite un liser bleu au rebond de
     defilement sur mobile. */
  document.documentElement.dataset.theme = route.name === 'case' ? 'light' : 'brand';

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

  /* Tout ce qui doit se produire UNE FOIS LE DOM EN PLACE.
     -------------------------------------------------------------------
     C'est le point delicat de cette fonction. startViewTransition ne fait
     pas qu'animer : il DIFFERE l'execution de son callback jusqu'a ce que
     le navigateur soit pret a photographier l'ancien etat. Le code ecrit
     juste apres l'appel s'execute donc AVANT que la nouvelle page existe.

     C'est ce qui cassait la navigation laterale des etudes de cas :
     setupCaseBehaviours() cherchait '.cs-sec' dans un <main> encore vide,
     n'en trouvait aucune, et sortait aussitot. Ni scroll-spy, ni
     pourcentage, ni gestionnaire de clic — donc les liens repartaient dans
     le comportement par defaut et rechargeaient la page.

     La regle a retenir : ne jamais lire le DOM juste apres avoir demande
     une transition. On regroupe tout ici et on l'appelle au bon moment. */
  const afterSwap = () => {
    document.title = title;
    markActiveNav(route);
    setupBackLink(route);
    closeMobileNav();

    // Remonter en haut a chaque changement de page — sauf si l'URL vise une
    // ancre precise, cas ou l'on doit au contraire descendre jusqu'a elle.
    const anchor = hash.split('#')[2];
    if (anchor) scrollToSection(anchor, 'auto');
    else window.scrollTo({ top: 0, behavior: 'auto' });

    // On deplace le focus sur <main> : sans ca, un lecteur d'ecran continue
    // d'annoncer l'ancienne page et l'utilisateur clavier repart du debut.
    main.focus({ preventScroll: true });

    if (route.name === 'case') setupCaseBehaviours();
    setupScrollProgress();
    setupVideos();
  };

  // Transition de page. startViewTransition est l'API moderne : le navigateur
  // photographie l'ancien et le nouvel etat et interpole entre les deux.
  // `updateCallbackDone` est la promesse tenue une fois le DOM remplace —
  // c'est notre signal pour lancer afterSwap sans risque.
  if (document.startViewTransition && !prefersReducedMotion()) {
    document.startViewTransition(swap).updateCallbackDone.then(afterSwap);
  } else {
    swap();
    afterSwap();
  }
}

/* Fait defiler jusqu'a une section, en tenant compte de l'en-tete collant.
   scrollIntoView seul placerait le titre sous l'en-tete ; on retire donc sa
   hauteur du calcul. Regroupe ici parce que trois endroits en ont besoin. */
function scrollToSection(id, behavior) {
  const target = document.getElementById(`sec-${id}`);
  if (!target) return;
  const y = target.getBoundingClientRect().top + window.scrollY - readHeadHeight() - 24;
  window.scrollTo({ top: Math.max(0, y), behavior });
}

/* Lit la hauteur de l'en-tete depuis le CSS plutot que de la coder en dur.
   Elle change entre bureau et mobile (82px / 72px) : la lire garantit que le
   JavaScript et la feuille de style ne peuvent pas se contredire. */
function readHeadHeight() {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--head-h');
  return parseInt(v, 10) || 82;
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

/* ---- 8a bis. LECTURE DES VIDEOS PILOTEE PAR LA VISIBILITE ----
   Les videos ne jouent que lorsqu'elles sont a l'ecran, et se mettent en
   pause des qu'elles en sortent.

   Pourquoi ne pas simplement mettre l'attribut `autoplay` ? Parce qu'il fait
   demarrer TOUTES les videos de la page en meme temps, y compris celles qu'on
   ne verra jamais. Sur la page d'accueil, cela reviendrait a telecharger
   plusieurs megaoctets pour rien et a faire tourner les ventilateurs.

   MOUVEMENT REDUIT : si le systeme demande moins d'animation, on ne lance
   rien du tout et on affiche les controles a la place. La personne garde
   l'acces au contenu, mais decide elle-meme de le declencher. */
function setupVideos() {
  const videos = $$('video[data-autoplay]');
  if (!videos.length) return;

  if (prefersReducedMotion()) {
    videos.forEach(v => { v.controls = true; v.removeAttribute('data-autoplay'); });
    return;
  }

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const v = e.target;
      if (e.isIntersecting) {
        // play() renvoie une promesse qui peut etre rejetee (economiseur de
        // batterie, onglet en arriere-plan...). On ignore l'echec : ce n'est
        // pas une erreur, juste une lecture qui n'a pas lieu.
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, { threshold: 0.25 });

  videos.forEach(v => io.observe(v));
  addCleanup(() => io.disconnect());   // sinon l'observateur survit au changement de page
}

/* ---- 8b. Nav laterale d'etude de cas : scroll-spy + progression ----
   Trois comportements, tous alimentes par un seul ecouteur de defilement :
     - la section en cours de lecture est surlignee dans la nav ;
     - la barre et le pourcentage indiquent l'avancement dans le processus ;
     - un clic sur une entree fait defiler, sans recharger la page.

   ATTENTION : cette fonction lit le DOM. Elle doit donc etre appelee APRES
   que la page a ete inseree dans <main>, jamais avant (voir render). */
function setupCaseBehaviours() {
  const links = $$('.cs-nav a[data-spy]');
  const secs  = $$('.cs-sec');
  if (!secs.length) return;

  const bar   = $('#cs-bar');
  const pct   = $('#cs-pct');
  const track = $('.cs-nav__track');

  /* --- scroll-spy : quelle section est en train d'etre lue ? ---
     Calcul deterministe plutot qu'IntersectionObserver.

     Un observateur regle sur une bande centrale de l'ecran parait elegant,
     mais il a un angle mort : une section courte, ou la derniere d'une page,
     peut ne JAMAIS atteindre le milieu de la fenetre — le document cesse de
     defiler avant. Elle ne s'allume alors jamais.

     La regle ci-dessous n'a pas ce defaut : on prend la derniere section dont
     le haut est deja passe sous l'en-tete. Il y a donc toujours exactement une
     section active, et la derniere s'allume forcement en fin de page. */
  const setActive = (id) => links.forEach(a =>
    a.classList.toggle('is-active', a.dataset.spy === id));

  const updateActive = () => {
    // La ligne de declenchement : juste sous l'en-tete collant, plus une
    // marge pour que la section s'allume quand son titre devient lisible.
    const lineY = readHeadHeight() + 80;
    let current = secs[0];
    for (const s of secs) {
      if (s.getBoundingClientRect().top <= lineY) current = s;
      else break;                       // les sections sont dans l'ordre du DOM
    }
    // Cas particulier du bas de page : si on a atteint le fond, c'est la
    // derniere section qu'on lit, quoi que dise le calcul precedent.
    const atBottom = window.innerHeight + window.scrollY
                     >= document.documentElement.scrollHeight - 2;
    if (atBottom) current = secs[secs.length - 1];
    setActive(current.id);
  };

  /* --- progression dans le processus ---
     Calcul base sur getBoundingClientRect plutot que sur offsetTop.
     offsetTop est mesure par rapport au premier ancetre positionne, qui peut
     changer selon la mise en page ; rect.top + scrollY donne toujours une
     position absolue dans le document, quelle que soit la structure.

     Le trajet va du haut de la premiere section au bas de la derniere, moins
     une hauteur d'ecran : ainsi le compteur atteint bien 100 % quand la
     derniere section finit de defiler, et pas une fois qu'on a depasse le
     pied de page. */
  const first = secs[0], last = secs[secs.length - 1];
  const updateProgress = () => {
    const top    = window.scrollY;
    const start  = first.getBoundingClientRect().top + top;
    const end    = last.getBoundingClientRect().bottom + top - window.innerHeight;
    const span   = Math.max(1, end - start);
    const p = Math.round(Math.min(100, Math.max(0, ((top - start) / span) * 100)));
    bar.style.width = p + '%';
    pct.textContent = p + '%';
    // aria-valuenow permet a un lecteur d'ecran d'annoncer la progression,
    // exactement comme la barre la montre a l'oeil.
    track.setAttribute('aria-valuenow', String(p));
  };

  /* Un seul ecouteur pour les deux calculs. Le defilement se declenche des
     dizaines de fois par seconde : mieux vaut une fonction qui fait deux
     choses que deux fonctions qui font la queue.
     { passive: true } promet au navigateur qu'on n'appellera pas
     preventDefault() ; il peut alors continuer a defiler sans nous attendre,
     ce qui garde le scroll fluide sur telephone. */
  const onScroll = () => { updateActive(); updateProgress(); };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  addCleanup(() => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
  });
  onScroll();

  /* --- clics sur la nav laterale ---
     On empeche le comportement par defaut : suivre le lien changerait le
     hash, ce qui rechargerait la page et rejouerait la transition. On fait
     defiler nous-memes, puis on met l'URL a jour avec replaceState.

     replaceState et non location.hash : il modifie la barre d'adresse SANS
     declencher l'evenement hashchange. La section reste donc partageable par
     copier-coller, sans qu'aucun rendu ne soit provoque. */
  links.forEach(a => {
    const onClick = (ev) => {
      ev.preventDefault();
      const id = a.dataset.spy.replace(/^sec-/, '');
      scrollToSection(id, prefersReducedMotion() ? 'auto' : 'smooth');
      setActive(a.dataset.spy);            // retour visuel immediat
      history.replaceState(null, '', `${location.hash.split('#')[1] ? '#' + location.hash.split('#')[1] : ''}#${id}`);
    };
    a.addEventListener('click', onClick);
    addCleanup(() => a.removeEventListener('click', onClick));
  });
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
  const names = new Set();
  PROJECTS.forEach(p => (p.sections || []).forEach(s => {
    if (s.image) names.add(s.image);
  }));

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

  applyStaticI18n();
  buildFooter();

  const gate = setupGate();

  /* --- Ecouteurs globaux, installes une seule fois --- */

  /* hashchange se declenche a chaque changement de la partie apres le #.
     C'est le moteur de notre navigation — mais il ne doit PAS redessiner la
     page quand seule l'ancre de section change.

     Sans ce filtre, passer de #/work/constraints a #/work/constraints#mapping
     reconstruirait toute l'etude de cas et rejouerait la transition, alors
     que le visiteur a simplement clique sur une entree de la nav laterale.
     On compare donc les routes en ignorant l'ancre : si elles sont
     identiques, on se contente de faire defiler. */
  let lastRoute = routeKey(location.hash);
  window.addEventListener('hashchange', () => {
    const key = routeKey(location.hash);
    if (key === lastRoute) {
      const anchor = location.hash.split('#')[2];
      if (anchor) scrollToSection(anchor, prefersReducedMotion() ? 'auto' : 'smooth');
      return;                       // meme page : aucun rendu
    }
    lastRoute = key;
    render();
  });

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
