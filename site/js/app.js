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
   memoire. Rien n'est envoye sur le reseau (le <form> n'a pas d'attribut
   action), aucun cookie.
   DEVIATION (demandee explicitement, session ulterieure) : pour eviter de
   redemander le prenom a chaque rechargement, il est aussi ecrit dans
   localStorage avec une expiration a 1h (voir readStoredVisitor()/
   writeStoredVisitor() en fin de section 9) — un compromis assume avec la
   consigne "pas de base de donnees" ci-dessus : ce n'est qu'une chaine de
   texte courte, sur la machine du visiteur, jamais transmise, et elle
   s'auto-efface au bout d'une heure.
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
    'data-slug': p.slug,
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
    if (c.heroMedia.type === 'video') {
      return `<video src="${url}" muted loop playsinline preload="metadata"
                data-autoplay aria-hidden="true" tabindex="-1"
                disablepictureinpicture></video>`;
    }
    if (c.heroMedia.type === 'lottie') {
      const lottiePlay = prefersReducedMotion() ? 'controls' : 'autoplay loop';
      return `<dotlottie-wc src="${url}" ${lottiePlay} aria-hidden="true"></dotlottie-wc>`;
    }
    return `<img src="${url}" alt="" loading="lazy" decoding="async">`;
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
  return escapeAttr(str)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
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
    const sec = el('section', { class: 'section', id: `sec-${kind}` });
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
    ${c.gist.company ? '' : `<p class="cs__client">${escapeAttr(c.client)}</p>`}
    <h1 class="cs__title">${escapeAttr(c.title)}</h1>
    <p class="cs__tagline">${emphasize(c.tagline)}</p>

    ${c.heroMedia ? `<div class="cs__hero-media">${mediaMarkup(c.heroMedia)}</div>` : ''}

    <dl class="gist">
      ${c.gist.company && c.gist.company.href ? `<div><dt>${escapeAttr(d.csCompany)}</dt><dd><a href="${escapeAttr(c.gist.company.href)}" target="_blank" rel="noopener">${escapeAttr(c.gist.company.label)}</a></dd></div>` : ''}
      <div><dt>${escapeAttr(d.csRole)}</dt><dd>${escapeAttr(c.gist.role)}</dd></div>
      <div><dt>${escapeAttr(d.csDuration)}</dt><dd>${escapeAttr(c.gist.duration)}</dd></div>
      <div><dt>${escapeAttr(d.csTeam)}</dt><dd>${escapeAttr(c.gist.team)}</dd></div>
      ${c.gist.tools ? `<div><dt>${escapeAttr(d.csTools)}</dt><dd>${escapeAttr(c.gist.tools)}</dd></div>` : ''}
    </dl>

    <div class="pair">
      <div><h2>${escapeAttr(d.csProblem)}</h2><p>${escapeAttr(c.problem)}</p></div>
      <div class="pair__out"><h2>${escapeAttr(d.csOutcome)}</h2><p>${escapeAttr(c.outcome)}</p></div>
    </div>

    ${stats ? `<h2 class="stats__title">${escapeAttr(d.csImpacts)}</h2><div class="stats">${stats}</div>` : ''}

    <div class="cs__cta">
      ${(c.extLinks || []).map(l =>
        `<a class="btn btn--ghost" href="${escapeAttr(l.href)}" target="_blank" rel="noopener noreferrer">
           ${escapeAttr(l.label)} ↗</a>`).join('')}
      ${project.external ? `<a class="btn btn--primary" href="${escapeAttr(project.external)}"
           target="_blank" rel="noopener noreferrer">${escapeAttr(d.seeProject)} ↗</a>` : ''}
    </div>

    ${c.draftNote ? `<p class="todo" style="margin-top:var(--s6)">${escapeAttr(c.draftNote)}</p>` : ''}
  `);
  head.append(hw);

  /* --- Corps : nav laterale + sections de processus --- */
  if (hasProcess) {
    // La nav laterale couvre TOUTE la page, pas seulement le processus :
    // "Overview" (l'en-tete lui-meme) en est la premiere entree, au meme
    // titre que les etapes suivantes, plutot qu'un bloc separe au-dessus
    // d'une nav qui ne couvrirait que le processus. Repris de
    // https://www.rachelchen.tech/projects/openai (demande explicite) —
    // c'est aussi ce qui permet a l'en-tete et aux sections de partager
    // exactement la meme largeur de colonne (voir hw.classList.remove plus
    // bas : sans son propre .wrap, l'en-tete herite de la largeur de
    // .cs__content, comme secs).
    hw.classList.remove('wrap');
    head.id = 'sec-overview';

    // wrap--wide : sur cette page, le contenu doit occuper la meme largeur
    // que l'en-tete du site (.site-head n'a pas de max-width, seulement le
    // gutter) — .wrap seul (max-width 1280px) laissait un ecart visible sur
    // grand ecran entre le bord de la pilule de nav et celui de la nav
    // laterale/des sections en dessous.
    const body = el('div', { class: 'wrap wrap--wide' });
    const grid = el('div', { class: 'cs__body' });

    // La navigation collante. <nav> + <ol> : une liste ordonnee, parce que
    // les etapes d'un processus ont un ordre. Le lecteur d'ecran l'annonce.
    // Le lien retour vit ICI, separe du reste de la liste par une marge (un
    // lien discret, pas un bouton/pilule — cf. reference) plutot que dans le
    // bouton flottant #back-link partage par tout le site : sur une page
    // avec cette nav laterale, le flottant fait double emploi —
    // setupBackLink() (plus bas) le garde donc masque sur ces pages
    // precises et ne l'utilise que sur les pages sans processus (about,
    // gap, projets sans sections).
    const nav = el('nav', { class: 'cs-nav', 'aria-label': d.csSections });
    nav.innerHTML = `
      <a class="cs-nav__back" href="#/#${escapeAttr(c.kind)}">
        <span aria-hidden="true">←</span> ${escapeAttr(d.csBack)}
      </a>
      <ol>
        <li><a href="${base}#overview" data-spy="sec-overview">
          <span class="cs-nav__num">01</span>
          <span>${escapeAttr(d.csOverview)}</span>
        </a></li>
        ${c.sections.map((s, i) => `
          <li><a href="${base}#${escapeAttr(s.id)}" data-spy="sec-${escapeAttr(s.id)}">
            <span class="cs-nav__num">${String(i + 2).padStart(2, '0')}</span>
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

    // Colonne de contenu : l'en-tete (apercu) puis les sections du
    // processus, l'une sous l'autre — la nav reste seule a gauche sur toute
    // la hauteur de la page, plutot que de ne longer que les sections.
    const content = el('div', { class: 'cs__content' });
    content.append(head);

    // c.processIntro : phrase d'introduction au processus (ex. Licence
    // management, le role du designer dans le projet), affichee juste avant
    // la 1ere section numerotee plutot que dans son corps.
    if (c.processIntro) content.append(el('p', { style: 'margin:0 0 var(--s6)' }, c.processIntro));

    // Les sections elles-memes.
    const secs = el('div');
    c.sections.forEach(s => {
      const sec = el('section', { class: 'cs-sec', id: `sec-${s.id}` });

      // s.terms : blocs terme/definition alignes horizontalement, inseres
      // apres le paragraphe d'index `after` (ex. Licence management/
      // Definitions, les 3 personas) — <dl> plutot que .cs-sec__aside car le
      // contenu est dans le flux normal de lecture, pas en marge du texte.
      // Voir .cs-sec__terms/.cs-sec__term dans styles.css.
      const termsBlock = s.terms
        ? `<div class="cs-sec__terms">${s.terms.items.map(t =>
            `<dl class="cs-sec__term"><dt>${escapeAttr(t.term)}</dt><dd>${escapeAttr(t.body)}</dd></dl>`).join('')}</div>`
        : '';
      // s.figureAfter : une figure locale (webp/png ou svg, via figureFor())
      // inseree apres le paragraphe d'index `after` — comme s.terms mais
      // pour une image plutot qu'un bloc terme/definition (ex. Licence
      // management/Before, la capture de l'ancienne page de modification).
      // Accepte soit un objet unique, soit un tableau (ex. Admin model : une
      // figure apres le 1er paragraphe, une autre apres le 2e).
      const figuresAfterList = s.figureAfter
        ? (Array.isArray(s.figureAfter) ? s.figureAfter : [s.figureAfter]) : [];

      /* Les paragraphes, avec les medias intercales aux positions indiquees
         par `s.media`. La cle de cet objet est l'index du paragraphe apres
         lequel le groupe doit s'afficher — c'est ce qui permet de reproduire
         l'ordre exact d'une page source sans decouper la section. */
      const parts = s.body.map((p, i) => {
        const after = s.media && s.media[i] ? mediaGroup(s.media[i]) : '';
        const terms = s.terms && s.terms.after === i ? termsBlock : '';
        const figure = figuresAfterList.filter(f => f.after === i).map(figureFor).join('');
        // s.numbered : { [paragraphIndex]: n } — accole une pastille
        // numerotee violette (meme style que .cs-timeline__constraint-num)
        // au paragraphe, pour faire echo a un numero deja present dans une
        // figure juste au-dessus (ex. Admin model, pastille "1" de la
        // capture Figma reprise ici sur le paragraphe qui l'explique).
        const num = s.numbered && s.numbered[i];
        const paragraph = num
          ? `<div class="cs-sec__num-row"><span class="cs-sec__num" aria-hidden="true">${num}</span><p>${emphasize(p)}</p></div>`
          : `<p>${emphasize(p)}</p>`;
        return `${paragraph}${after}${terms}${figure}`;
      }).join('');

      const intro = s.intro ? `<p>${s.intro.map(escapeAttr).join('<br>')}</p>` : '';
      // s.list : cartes {title, body} (ex. les 4 principes de conception,
      // Constraints/design) plutot qu'une liste a puces — voir s.list dans
      // content.js et .cs-sec__cards dans styles.css.
      const list = s.list
        ? `<div class="cs-sec__cards">${s.list.map(card => `
            <div class="cs-sec__card">
              <p class="cs-sec__card-title">${escapeAttr(card.title)}</p>
              <p class="cs-sec__card-body">${escapeAttr(card.body)}</p>
            </div>`).join('')}</div>` : '';
      // s.bullets : vraie liste a puces (ex. Services exclusion/Fixes),
      // contrairement a s.list ci-dessus qui rend des cartes. Reutilise
      // .cs-sec__list, deja dans styles.css mais orpheline jusqu'ici.
      const bullets = s.bullets
        ? `<ul class="cs-sec__list">${s.bullets.map(b => `<li>${emphasize(b)}</li>`).join('')}</ul>` : '';
      const mockups = s.mockups
        ? `<div class="cs-mockups">${s.mockups.map(figureFor).join('')}</div>` : '';
      // s.timeline : suite d'etapes en ligne de temps (ex. Licence
      // management/Design trials) — voir .cs-timeline dans styles.css.
      // `thumb: false` sur une entree permet d'omettre son placeholder
      // d'image ; `image: 'name'` (paire webp+png, assets/img/) remplace le
      // rectangle gris par la vraie capture, affichee avant le texte (ex.
      // la 1ere entree, "isolate the identifier"). `imageAfter: 'name'`
      // insere une figure apres le texte, avant `constraints` (ex. "Work on
      // the component"). `constraints: [{n, text}]` ou `[{n, body: [...]}]`
      // rend une liste numerotee (pastille violette, n:null = pas de
      // pastille) — `body` accepte plusieurs paragraphes par item quand
      // `text` (un seul) ne suffit pas ; `list: [...]` ajoute une liste a
      // puces (.cs-sec__list) apres les paragraphes de l'item, pour des
      // alternatives/options enumerees sans meriter leur propre pastille.
      // `imagesAfter: ['name', ...]` insere
      // enfin une ou plusieurs figures empilees APRES `constraints` (ex. "A
      // button-triggered search" : 1ere image, puis "Naming the button" en
      // liste numerotee, puis la 2e image). Chaque entree accepte aussi la
      // forme objet `{ image, zoomable }` quand elle a besoin de la classe
      // .zoomable-media (voir zoomableClass() plus bas) — une chaine simple
      // reste rendue telle quelle, sans zoom.
      const timeline = s.timeline
        ? `<div class="cs-timeline">${s.timeline.map(item => `
            <div class="cs-timeline__row${item.image ? ' cs-timeline__row--figure' : ''}${item.tight ? ' cs-timeline__row--tight' : ''}">
              <div class="cs-timeline__line-col"><div class="cs-timeline__line"></div></div>
              <div class="cs-timeline__content">
                ${item.thumb === false ? '' : item.image
                  ? `<picture class="cs-timeline__thumb${zoomableClass(item.imageZoomable)}">
                       <source srcset="assets/img/${item.image}.webp" type="image/webp">
                       <img src="assets/img/${item.image}.png" alt="" loading="lazy" decoding="async">
                     </picture>`
                  : '<div class="cs-timeline__thumb" aria-hidden="true"></div>'}
                <div class="cs-timeline__text">
                  ${item.title ? `<p class="cs-timeline__title">${escapeAttr(item.title)}</p>` : ''}
                  ${item.body.map(p => `<p>${emphasize(p)}</p>`).join('')}
                  ${item.imageAfter
                    ? `<picture class="cs-timeline__thumb cs-timeline__thumb--auto${zoomableClass(item.imageAfterZoomable, item.imageAfterZoomableRipple)}"${item.imageAfterZoomScaleMobile ? ` style="--zoom-scale-mobile: ${item.imageAfterZoomScaleMobile}%"` : ''}>
                         <source srcset="assets/img/${item.imageAfter}.webp" type="image/webp">
                         <img src="assets/img/${item.imageAfter}.png" alt="" loading="lazy" decoding="async">
                       </picture>` : ''}
                  ${item.constraints
                    ? `<ul class="cs-timeline__constraints${item.constraintsLoose ? ' cs-timeline__constraints--loose' : ''}">${item.constraints.map(c => `
                        <li class="cs-timeline__constraint${c.n ? '' : ' cs-timeline__constraint--unnumbered'}">
                          <span class="cs-timeline__constraint-num" aria-hidden="true">${c.n || ''}</span>
                          <div class="cs-timeline__constraint-body">
                            ${(c.body || [c.text]).map(p => `<p>${emphasize(p)}</p>`).join('')}
                            ${c.list ? `<ul class="cs-sec__list">${c.list.map(li => `<li>${emphasize(li)}</li>`).join('')}</ul>` : ''}
                            ${c.bodyAfterList ? c.bodyAfterList.map(p => `<p>${emphasize(p)}</p>`).join('') : ''}
                          </div>
                        </li>`).join('')}</ul>` : ''}
                  ${item.imagesAfter
                    ? item.imagesAfter.map(img => {
                        const name = typeof img === 'string' ? img : img.image;
                        const cls = typeof img === 'string' ? '' : zoomableClass(img.zoomable);
                        return `
                        <picture class="cs-timeline__thumb cs-timeline__thumb--auto${cls}">
                          <source srcset="assets/img/${name}.webp" type="image/webp">
                          <img src="assets/img/${name}.png" alt="" loading="lazy" decoding="async">
                        </picture>`;
                      }).join('') : ''}
                </div>
              </div>
            </div>`).join('')}</div>` : '';
      // Chiffres cites dans le texte, sortis en cartes (voir s.stats dans
      // content.js) — meme balisage que les .stat d'en-tete, en plus petit.
      const secStats = s.stats
        ? `<div class="stats stats--sec">${s.stats.map(x =>
            `<div class="stat"><div class="stat__n">${escapeAttr(x.n)}</div>
             <div class="stat__l">${escapeAttr(x.l)}</div></div>`).join('')}</div>` : '';
      // Bloc "Visual helpers" : rendu apres le widget interactif (pas dans
      // body[]/lottieCarousel indexe par paragraphe) — voir s.helpers dans
      // content.js. Titre + texte dans le meme <p> (le titre reste en gras
      // via <strong>, meme taille que le reste du paragraphe).
      const helpers = s.helpers
        ? `<p><strong>${escapeAttr(s.helpers.title)}</strong><br>${escapeAttr(s.helpers.body)}</p>
           ${s.lottieCarousel ? lottieCarouselMarkup(s.lottieCarousel) : ''}` : '';

      // s.aside : bloc "definitions" a cote du texte (ex. Services
      // exclusion/Design) — voir .cs-sec__row/.cs-sec__aside dans
      // styles.css. Enveloppe `parts` au lieu de le rendre pleine largeur.
      const partsBlock = s.aside
        ? `<div class="cs-sec__row">
             <div class="cs-sec__row-text">${parts}</div>
             <div class="cs-sec__aside">${s.aside.map(a =>
               `<p><strong>${escapeAttr(a.term)}: </strong>${escapeAttr(a.body)}</p>`).join('')}</div>
           </div>`
        : parts;

      // s.callout : encart d'avertissement (ex. Services exclusion/Release)
      // — remplace une figure quand le point a illustrer est un constat
      // plutot qu'une capture. Voir .cs-callout dans styles.css.
      const callout = s.callout
        ? `<div class="cs-callout">${alertCircleIcon('cs-callout__icon')}<p>${escapeAttr(s.callout.text)}</p></div>` : '';

      // s.afterFigure : paragraphe(s) apres la figure de section (ex.
      // Services exclusion/Scoping) — cas normalement couvert par
      // s.media (indexe par paragraphe) mais celui-ci vise une figure
      // locale (s.image/figureFor), pas un media distant.
      const afterFigure = s.afterFigure
        ? s.afterFigure.map(p => `<p>${emphasize(p)}</p>`).join('') : '';

      // Figure + carrousel cote a cote, meme gabarit (ex. Services
      // exclusion/Concept, Before + le carrousel des 4 etapes) — voir
      // .cs-sec__media-pair dans styles.css. Sinon, chacun garde son rendu
      // normal en pleine largeur.
      const mediaBlock = (s.image && s.carousel)
        ? `<div class="cs-sec__media-pair">${figureFor(s)}${carouselMarkup(s.carousel)}</div>`
        : `${s.image ? figureFor(s) : ''}${s.carousel ? carouselMarkup(s.carousel) : ''}`;

      sec.innerHTML = `
        <h2 class="cs-sec__title">${escapeAttr(s.title)}</h2>
        ${intro}
        ${list}
        ${bullets}
        ${partsBlock}
        ${callout}
        ${secStats}
        ${mockups}
        ${timeline}
        ${mediaBlock}
        ${afterFigure}
        ${s.builder ? constraintBuilderMarkup(s.builder) : ''}
        ${s.builder && s.builder.components ? componentsShowcaseMarkup(s.builder.components, s.builder) : ''}
        ${s.modal ? exclModalMarkup(s.modal) : ''}
        ${helpers}
        ${s.moreDrawer ? moreDrawerMarkup(s.moreDrawer) : ''}`;
      secs.append(sec);
    });
    content.append(secs);

    grid.append(nav, content);
    body.append(grid);
    page.append(body);
  } else {
    page.append(head);
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
  // `hideCaption` : garde `cap` comme aria-label/alt (accessibilite) mais
  // masque la <figcaption> visible — utile pour un media d'ouverture qui
  // n'a pas besoin de legende affichee sous lui.
  return `<figure class="${kind}">
      <div class="figure__frame">${inner}</div>
      ${cap && !m.hideCaption ? `<figcaption>${cap}</figcaption>` : ''}
    </figure>`;
}

/* Un groupe de medias. A partir de deux elements, ils se rangent en grille
   plutot que de s'empiler : les captures de Contra vont par trois. */
function mediaGroup(list) {
  if (!list || !list.length) return '';
  const cls = list.length > 1 ? 'media-grid' : 'media-single';
  return `<div class="${cls}">${list.map(mediaMarkup).join('')}</div>`;
}

/* Classe(s) a poser sur le conteneur direct d'une image pour la rendre
   zoomable (voir .zoomable-media dans styles.css / setupZoomableMedia() plus
   bas). `flag` : true = zoomable partout, 'mobile' = seulement sous 700px
   (cursor normal et clic sans effet au-dessus, voir setupZoomableMedia()).
   `ripple` : ondulation d'invite en plus (voir .zoomable-media--ripple). */
function zoomableClass(flag, ripple) {
  if (!flag) return '';
  return ' zoomable-media' + (flag === 'mobile' ? ' zoomable-media--mobile-only' : '') + (ripple ? ' zoomable-media--ripple' : '');
}

/* Construit le balisage d'une figure.
   <picture> permet d'offrir le WebP (leger) avec un repli PNG : le
   navigateur prend le premier format qu'il sait lire. loading="lazy" evite
   de telecharger les images encore hors de l'ecran.
   `frOnly` signale honnetement les visuels dont les annotations n'existent
   qu'en francais (image d'origine, jamais reproduite en anglais), plutot
   que de laisser un lecteur perplexe.
   `figureDrawer` cache la figure derriere un <details> natif ("En voir
   plus") : utile pour une image dense qui n'est pas indispensable a la
   lecture continue du texte. Natif = clavier et lecteurs d'ecran gratuits,
   aucun JS de plus a ecrire. */
function figureFor(s) {
  const note = s.frOnly
    ? `<span class="figure__note">${escapeAttr(t().csFigureFR)}</span>` : '';
  // `caption` accepte soit une chaine (cas courant), soit {title, body}
  // pour une legende sur deux lignes (ex. Before/After, Services exclusion).
  const captionText = typeof s.caption === 'object' ? s.caption.title : (s.caption || '');
  const captionHTML = typeof s.caption === 'object'
    ? `<strong>${escapeAttr(s.caption.title)}</strong><br>${escapeAttr(s.caption.body)}`
    : escapeAttr(s.caption || '');
  // `s.image` se terminant par .svg (export Figma direct, ex. le schema
  // Services exclusion/Context) : pas de paire webp/png, un seul fichier
  // vectoriel servi tel quel.
  const media = s.image.endsWith('.svg')
    ? `<img src="assets/img/${s.image}" alt="${escapeAttr(captionText)}" loading="lazy" decoding="async">`
    : `<picture>
          <source srcset="assets/img/${s.image}.webp" type="image/webp">
          <img src="assets/img/${s.image}.png" alt="${escapeAttr(captionText)}" loading="lazy" decoding="async">
        </picture>`;
  // `bare` retire le cadre (fond/liser/padding) standard de .figure__frame —
  // pour un visuel deja net qui n'a pas besoin de ce fond neutre, sans
  // passer par le regroupement .cs-mockups (qui l'applique par defaut).
  const figure = `
    <figure class="figure${s.bare ? ' figure--bare' : ''}">
      <div class="figure__frame${zoomableClass(s.zoomable)}">${media}</div>
      ${captionHTML || note ? `<figcaption>${captionHTML}${note}</figcaption>` : ''}
    </figure>`;
  return s.figureDrawer
    ? `<details class="figure-drawer"><summary>${escapeAttr(t().figureSeeMore)}${chevronIcon('figure-drawer__chevron')}</summary>${figure}</details>`
    : figure;
}

/* Canevas Figma en direct (iframe officielle "Partager > Integrer"), pour un
   item de moreDrawer qui pointe vers un fichier Figma plutot qu'une image
   exportee (voir it.embed dans content.js). aspect-ratio plutot qu'une
   hauteur fixe : garde l'iframe proportionnee a n'importe quelle largeur de
   colonne sans JS de mesure. */
function embedFor(s) {
  // Pas de `src` au depart (voir data-embed-src) : l'iframe nait a l'interieur
  // du <details> "See more" ferme par defaut, donc display:none. Un iframe
  // demarre ainsi ne navigue jamais vers son src meme apres ouverture du
  // tiroir (contrairement a <img>, qui charge son image quelle que soit sa
  // visibilite) — d'ou l'affectation differee au premier "toggle", voir
  // setupMoreDrawerEmbeds() plus bas.
  return `
    <figure class="figure cs-more__embed-figure">
      <div class="cs-more__embed">
        <iframe data-embed-src="${escapeAttr(s.embed)}" title="${escapeAttr(s.title)}" allowfullscreen></iframe>
      </div>
      <figcaption>${escapeAttr(s.caption || '')}</figcaption>
    </figure>`;
}

/* Charge les iframes Figma d'un tiroir "See more" (voir embedFor() ci-dessus)
   au premier "toggle" vers l'etat ouvert, plutot qu'a l'affichage initial de
   la page : evite le piege display:none-a-la-creation, et epargne la requete
   Figma aux visiteurs qui n'ouvrent jamais le tiroir. */
function setupMoreDrawerEmbeds() {
  $$('.cs-more').forEach(details => {
    const load = () => {
      if (!details.open) return;
      $$('iframe[data-embed-src]', details).forEach(f => { f.src = f.dataset.embedSrc; });
    };
    load();
    details.addEventListener('toggle', load);
  });
}

/* Tiroir "See more of the process" (voir content.js, champ `moreDrawer`
   d'une section) : regroupe des etapes secondaires qui n'ont plus leur
   propre entree dans la nav laterale, derriere un unique <details> place a
   la fin de la section qui les porte. Chaque item reutilise figureFor() pour
   sa figure (ou embedFor() pour un canevas Figma en direct, voir it.embed)
   — sans son propre figureDrawer imbrique, l'ensemble etant deja derriere ce
   tiroir. */
// Un paragraphe de moreDrawer.items[].body est soit une chaine simple (rendue
// en <p>), soit un objet { intro, tags } / { intro, list } quand le texte a
// besoin d'etiquettes couleur (voir .cs-tag, mapping des 24 contraintes) ou
// d'une sous-liste a puces sous l'intro — voir content.js.
function drawerBodyParagraph(p) {
  if (typeof p === 'string') return `<p>${escapeAttr(p)}</p>`;
  const intro = `<p>${escapeAttr(p.intro)}</p>`;
  if (p.tags) {
    return intro + `<ul class="cs-tag-list">${p.tags.map(tag => `
      <li><span class="cs-tag cs-tag--${escapeAttr(tag.color)}">[ ${escapeAttr(tag.label)} ]</span> ${escapeAttr(tag.text)}</li>`).join('')}</ul>`;
  }
  if (p.list) {
    return intro + `<ul class="cs-sec__list">${p.list.map(li => `<li>${escapeAttr(li)}</li>`).join('')}</ul>`;
  }
  return intro;
}

function moreDrawerMarkup(drawer) {
  const items = drawer.items.map(it => `
    <div class="cs-more__item">
      <h3 class="cs-more__title">${escapeAttr(it.title)}</h3>
      ${it.body.map(drawerBodyParagraph).join('')}
      ${it.embed ? embedFor(it) : (it.image ? figureFor(it) : '')}
    </div>`).join('');
  return `<details class="figure-drawer cs-more">
      <summary>${escapeAttr(drawer.label)}${chevronIcon('figure-drawer__chevron')}</summary>
      <div class="cs-more__body">${items}</div>
    </details>`;
}

// Chevron Lucide (icone "chevron-down", licence MIT) : un <path> copie
// directement plutot qu'une dependance en script pour une seule icone.
// aria-hidden partout ou elle est utilisee : le libelle textuel voisin
// porte deja le sens. Partagee entre figureFor() (tiroir de figure) et
// constraintBuilderMarkup() (declencheur + tiroir des jours) plutot que
// dupliquee, vu qu'elle est identique aux deux endroits hormis la classe.
function chevronIcon(cls) {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`;
}

/* Icone alerte pour .cs-callout (voir s.callout dans content.js) — matches
   Figma node 114:9047 (cercle + point d'exclamation). */
function alertCircleIcon(cls) {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true"><circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
}

/* Icones pour exclModalMarkup() (voir plus bas) : triangle d'avertissement
   du pied de modale (node Figma 114:10388), croix de fermeture et loupe de
   recherche — la barre de recherche et le bouton fermer sont decoratifs
   (non fonctionnels dans la maquette source), voir le commentaire au-dessus
   de exclModalMarkup(). */
/* SVG exact fourni par l'utilisateur (export Figma du node d'avertissement,
   fond deja peint en #F3B248 dans les <path>/<rect> — pas currentColor). */
function warningTriangleIcon(cls) {
  return `<svg class="${cls}" width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
<path fill-rule="evenodd" clip-rule="evenodd" d="M5.26316 8.66783C4.89967 8.66783 4.60527 8.37342 4.60527 8.00994C4.60527 7.64645 4.89967 7.35204 5.26316 7.35204C5.62665 7.35204 5.92105 7.64645 5.92105 8.00994C5.92105 8.37342 5.62665 8.66783 5.26316 8.66783V8.66783ZM4.76974 3.2731H5.75658V5.1152C5.75658 6.16783 5.50987 6.69415 5.50987 6.69415H5.01645C5.01645 6.69415 4.76974 6.16783 4.76974 5.1152V3.2731ZM10.3862 8.84481L5.85987 1.08033C5.69507 0.797767 5.47763 0.656977 5.26053 0.657964C5.04507 0.658951 4.82994 0.79974 4.66645 1.08033L0.140133 8.84481C0.0444097 9.00862 -0.000327147 9.16389 1.80052e-06 9.30171C0.000988643 9.63691 0.271383 9.86849 0.736844 9.86849H9.78948C10.2549 9.86849 10.5253 9.63691 10.5263 9.30139C10.5266 9.16389 10.4819 9.00862 10.3862 8.84481V8.84481Z" fill="#F3B248"/>
<mask id="mask0_114_10350" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="11" height="10">
<path fill-rule="evenodd" clip-rule="evenodd" d="M5.26316 8.66783C4.89967 8.66783 4.60527 8.37342 4.60527 8.00994C4.60527 7.64645 4.89967 7.35204 5.26316 7.35204C5.62665 7.35204 5.92105 7.64645 5.92105 8.00994C5.92105 8.37342 5.62665 8.66783 5.26316 8.66783V8.66783ZM4.76974 3.2731H5.75658V5.1152C5.75658 6.16783 5.50987 6.69415 5.50987 6.69415H5.01645C5.01645 6.69415 4.76974 6.16783 4.76974 5.1152V3.2731ZM10.3862 8.84481L5.85987 1.08033C5.69507 0.797767 5.47763 0.656977 5.26053 0.657964C5.04507 0.658951 4.82994 0.79974 4.66645 1.08033L0.140133 8.84481C0.0444097 9.00862 -0.000327147 9.16389 1.80052e-06 9.30171C0.000988643 9.63691 0.271383 9.86849 0.736844 9.86849H9.78948C10.2549 9.86849 10.5253 9.63691 10.5263 9.30139C10.5266 9.16389 10.4819 9.00862 10.3862 8.84481V8.84481Z" fill="white"/>
</mask>
<g mask="url(#mask0_114_10350)">
<rect width="10.5263" height="10.5263" fill="#F3B248"/>
</g>
</svg>`;
}
/* SVG exact fourni par l'utilisateur : le rect masque (fill="white") est
   au-dessus du path de base (fill="#434C5C") et couvre exactement la meme
   forme, donc le rendu final est blanc — coherent avec l'usage sur le
   bandeau bleu (meme technique de calque "Fill/Primary/White" que Figma
   utilise pour les icones adaptables au fond). */
function closeIcon(cls) {
  return `<svg class="${cls}" width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
<path fill-rule="evenodd" clip-rule="evenodd" d="M5.72837 5.26324L10.43 0.561595C10.5586 0.432977 10.5586 0.225082 10.43 0.0964638C10.3014 -0.0321546 10.0935 -0.0321546 9.96489 0.0964638L5.26324 4.79811L0.561595 0.0964638C0.432977 -0.0321546 0.225082 -0.0321546 0.0964638 0.0964638C-0.0321546 0.225082 -0.0321546 0.432977 0.0964638 0.561595L4.79811 5.26324L0.0964638 9.96488C-0.0321546 10.0935 -0.0321546 10.3014 0.0964638 10.43C0.160609 10.4942 0.244819 10.5264 0.32903 10.5264C0.41324 10.5264 0.497451 10.4942 0.561595 10.43L5.26324 5.72837L9.96489 10.43C10.029 10.4942 10.1132 10.5264 10.1975 10.5264C10.2817 10.5264 10.3659 10.4942 10.43 10.43C10.5586 10.3014 10.5586 10.0935 10.43 9.96488L5.72837 5.26324Z" fill="#434C5C"/>
<mask id="mask0_114_10250" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="11" height="11">
<path fill-rule="evenodd" clip-rule="evenodd" d="M5.72837 5.26324L10.43 0.561595C10.5586 0.432977 10.5586 0.225082 10.43 0.0964638C10.3014 -0.0321546 10.0935 -0.0321546 9.96489 0.0964638L5.26324 4.79811L0.561595 0.0964638C0.432977 -0.0321546 0.225082 -0.0321546 0.0964638 0.0964638C-0.0321546 0.225082 -0.0321546 0.432977 0.0964638 0.561595L4.79811 5.26324L0.0964638 9.96488C-0.0321546 10.0935 -0.0321546 10.3014 0.0964638 10.43C0.160609 10.4942 0.244819 10.5264 0.32903 10.5264C0.41324 10.5264 0.497451 10.4942 0.561595 10.43L5.26324 5.72837L9.96489 10.43C10.029 10.4942 10.1132 10.5264 10.1975 10.5264C10.2817 10.5264 10.3659 10.4942 10.43 10.43C10.5586 10.3014 10.5586 10.0935 10.43 9.96488L5.72837 5.26324Z" fill="white"/>
</mask>
<g mask="url(#mask0_114_10250)">
<rect width="10.5263" height="10.5263" fill="white"/>
</g>
</svg>`;
}
function searchIcon(cls) {
  return `<svg class="${cls}" width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
<path fill-rule="evenodd" clip-rule="evenodd" d="M0.526316 3.33211C0.526316 1.785 1.785 0.526316 3.33184 0.526316C4.87895 0.526316 6.13737 1.785 6.13737 3.33211C6.13737 4.87921 4.87895 6.13789 3.33184 6.13789C1.785 6.13789 0.526316 4.87921 0.526316 3.33211M8.34316 7.97132L5.85211 5.505C6.35632 4.92105 6.66368 4.16237 6.66368 3.33211C6.66368 1.49474 5.16921 0 3.33184 0C1.49474 0 0 1.49474 0 3.33211C0 5.16921 1.49474 6.66421 3.33184 6.66421C4.14974 6.66421 4.89842 6.36684 5.47895 5.87605L7.97263 8.34526C8.02395 8.39632 8.09105 8.42158 8.1579 8.42158C8.22553 8.42158 8.29342 8.39553 8.34474 8.34342C8.44711 8.24026 8.44632 8.07368 8.34316 7.97132" fill="#2E8BE0"/>
</svg>`;
}
function checkIcon(cls) {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`;
}

/* Distance (px) a franchir pour qu'un glissement compte comme un swipe
   plutot qu'un simple tapotement/leger tremblement du doigt. Partagee par
   les deux carrousels (setupImageCarousel()/setupLottieCarousel()). */
const SWIPE_THRESHOLD = 40;

/* Duree (ms) au-dela de laquelle le recalage invisible sur le vrai panneau
   (apres un bouclage sur un clone, voir setupImageCarousel()/
   setupLottieCarousel()) est certain d'avoir fini d'animer. Un setTimeout
   plutot qu'un ecouteur `transitionend` : ce dernier s'est revele peu fiable
   ici (jamais declenche dans certains enchainements de glissements rapides),
   laissant le track fige sur le clone. Doit rester superieur a la duree de
   la transition CSS (.45s, voir --track transition dans styles.css) — 470ms
   laisse une petite marge pour la dispatch/le rendu. */
const WRAP_SNAP_DELAY = 470;

/* Rend un carrousel "glissable" au doigt (mobile) ou a la souris : ecoute
   `el` (la scene ou le track, selon l'appelant) et rapporte le deplacement
   horizontal via deux callbacks optionnels — onDrag(deltaX), appele en
   continu pendant le geste (pour un suivi visuel en direct), et
   onDragEnd(deltaX), appele une fois au relachement (pour decider si le
   geste compte comme un swipe). Pointer Events plutot que Touch Events :
   une seule API pour souris/tactile/stylet, et setPointerCapture()
   garantit que les evenements suivants arrivent bien sur `el` meme si le
   doigt en sort pendant le geste. */
function setupSwipe(el, { onDrag, onDragEnd } = {}) {
  let startX = null, startY = null, dragging = false, axis = null;
  // Distance (px) avant de trancher si le geste est plutot horizontal
  // (swipe de carrousel) ou vertical (scroll de page, doit rester natif) —
  // sans ce verrou d'axe, le moindre `dx` fortuit pendant un scroll vertical
  // (le doigt ne descend jamais parfaitement droit) pouvait faire changer de
  // panneau. Tranche une fois pour tout le geste (`axis`), pas a chaque
  // pointermove, pour eviter un flip-flop si dx/dy repassent l'un sous
  // l'autre en cours de route.
  const AXIS_LOCK_THRESHOLD = 10;
  const onPointerDown = e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    // Un bouton (fleche/puce) peut vivre dans `el` selon l'appelant — ne pas
    // capturer le pointeur dessus : setPointerCapture() retargete aussi le
    // clic vers `el`, ce qui rendrait le bouton inerte a la souris.
    if (e.target.closest('button')) return;
    startX = e.clientX;
    startY = e.clientY;
    dragging = true;
    axis = null;
    el.setPointerCapture(e.pointerId);
  };
  const onPointerMove = e => {
    if (!dragging) return;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    if (!axis) {
      if (Math.abs(dx) < AXIS_LOCK_THRESHOLD && Math.abs(dy) < AXIS_LOCK_THRESHOLD) return;
      axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }
    if (axis !== 'x') return;
    onDrag?.(dx);
  };
  const onPointerUp = e => {
    if (!dragging) return;
    dragging = false;
    // Geste vertical (ou jamais tranche, relachement trop rapide) : ne
    // compte pas comme un swipe, le panneau doit juste se recaler.
    onDragEnd?.(axis === 'x' ? e.clientX - startX : 0);
    axis = null;
  };
  el.addEventListener('pointerdown', onPointerDown);
  el.addEventListener('pointermove', onPointerMove);
  el.addEventListener('pointerup', onPointerUp);
  el.addEventListener('pointercancel', onPointerUp);
  addCleanup(() => {
    el.removeEventListener('pointerdown', onPointerDown);
    el.removeEventListener('pointermove', onPointerMove);
    el.removeEventListener('pointerup', onPointerUp);
    el.removeEventListener('pointercancel', onPointerUp);
  });
}

/* Carrousel des 4 illustrations Lottie (section "design", meme place que
   l'ancien media[0] — voir content.js). N'entre pas dans mediaMarkup()/
   mediaGroup() : contrairement a une grille statique, un seul panneau est
   visible a la fois, choisi en cliquant son libelle (figma node 34:817),
   donc il lui faut son propre etat expose/interactif plutot qu'un simple
   <figure> empile. Le premier constraint (Blocking) est affiche par defaut. */
function lottieCarouselMarkup(items) {
  const lottiePlay = prefersReducedMotion() ? 'controls' : 'autoplay loop';
  // src en `data-src` (pas `src`) pour les panneaux i>0, promu au fil du
  // parcours (setupLottieCarousel) plutot que pose d'emblee sur les 4 : les
  // panneaux ont maintenant tous une taille reelle des le depart (track en
  // flex, voir CSS), donc plus de risque de <canvas> fige a 300x150 comme
  // avant — mais lancer 4 animations en boucle simultanees des l'arrivee sur
  // la page resterait un gachis (CPU/batterie) pour 3 qu'on ne voit pas
  // encore.
  const panels = items.map((item, i) => `
    <div class="lottie-carousel__panel" data-role="lottie-panel" data-index="${i}">
      <dotlottie-wc ${i === 0 ? `src="${escapeAttr(mediaUrl(item))}"` : `data-src="${escapeAttr(mediaUrl(item))}"`} ${lottiePlay} aria-label="${escapeAttr(item.label)} constraint"></dotlottie-wc>
    </div>`).join('');
  const tabs = items.map((item, i) => `
    <button type="button" class="lottie-carousel__tab${i === 0 ? ' is-active' : ''}"
            data-role="lottie-tab" data-index="${i}" aria-pressed="${i === 0 ? 'true' : 'false'}">${escapeAttr(item.label)}</button>`).join('');
  // Fleches + puces reprises telles quelles de carouselMarkup() (memes
  // classes cs-carousel__*, voir CSS) : meme controles que le carrousel
  // d'images de Services exclusion, sur la scene Lottie plutot que sous les
  // libelles textuels (conserves a droite, toujours l'acces principal).
  const dots = items.map((item, i) => `
    <button type="button" class="cs-carousel__dot${i === 0 ? ' is-active' : ''}" data-role="lottie-dot"
            data-index="${i}" aria-label="${escapeAttr(t().csCarouselGoTo)} ${i + 1}"
            aria-current="${i === 0 ? 'true' : 'false'}"></button>`).join('');
  return `
    <div class="lottie-carousel" data-role="lottie-carousel">
      <div class="lottie-carousel__stage" data-role="lottie-stage">
        <div class="lottie-carousel__track" data-role="lottie-track">${panels}</div>
        <button type="button" class="cs-carousel__arrow cs-carousel__arrow--prev" data-role="lottie-prev"
                aria-label="${escapeAttr(t().csCarouselPrev)}">${chevronIcon('cs-carousel__arrow-icon')}</button>
        <button type="button" class="cs-carousel__arrow cs-carousel__arrow--next" data-role="lottie-next"
                aria-label="${escapeAttr(t().csCarouselNext)}">${chevronIcon('cs-carousel__arrow-icon')}</button>
        <div class="cs-carousel__dots" role="tablist" aria-label="${escapeAttr(t().csCarouselDots)}">${dots}</div>
      </div>
      <div class="lottie-carousel__tabs" role="tablist" aria-label="Constraint animations">${tabs}</div>
    </div>`;
}

/* Cablage : un clic sur un libelle affiche son panneau et cache les autres.
   $$() est deja scope au widget (root), donc plusieurs carrousels sur la
   meme page ne se marchent pas dessus — pas le cas ici, mais coherent avec
   setupConstraintBuilder() plus bas. */
function setupLottieCarousel() {
  $$('[data-role="lottie-carousel"]').forEach(root => {
    const tabs = $$('[data-role="lottie-tab"]', root);
    const panels = $$('[data-role="lottie-panel"]', root);
    const dots = $$('[data-role="lottie-dot"]', root);
    const prev = $('[data-role="lottie-prev"]', root);
    const next = $('[data-role="lottie-next"]', root);
    const track = $('[data-role="lottie-track"]', root);
    const n = panels.length;

    // Boucle infinie "en vrai" (meme principe que setupImageCarousel() plus
    // bas) : un clone du dernier panneau avant le premier, un clone du
    // premier apres le dernier — DOM = [clone(last), reel 0..n-1,
    // clone(first)], une position logique i vit donc au slot DOM i+1.
    // Glisser au-dela d'une extremite revele ainsi un clone visuellement
    // identique plutot qu'un aplat de fond (le trait noir constate avant
    // cette version), et rejoindre l'autre bout n'est plus qu'un pas simple
    // anime, suivi d'un recalage invisible sur le vrai panneau une fois la
    // transition finie (WRAP_SNAP_DELAY). data-index conserve sur les clones
    // (le recadrage 140% ci-dessus en depend, via data-index="0"), data-role
    // retire pour qu'ils n'apparaissent jamais dans tabs/dots/panels si
    // requetes a nouveau. Le clone peut venir d'un panneau pas encore
    // promu (data-src) : force ici, sinon il resterait vide au premier
    // apercu pendant un glissement.
    const headClone = panels[n - 1].cloneNode(true);
    const tailClone = panels[0].cloneNode(true);
    [headClone, tailClone].forEach(c => {
      c.removeAttribute('data-role');
      c.setAttribute('aria-hidden', 'true');
      const wc = c.querySelector('dotlottie-wc');
      if (wc && wc.hasAttribute('data-src')) {
        wc.setAttribute('src', wc.getAttribute('data-src'));
        wc.removeAttribute('data-src');
      }
    });
    track.prepend(headClone);
    track.append(tailClone);

    let current = 0;
    let wrapping = false;

    const setTransform = (domSlot, instant) => {
      if (instant) track.style.transition = 'none';
      track.style.transform = `translateX(-${domSlot * 100}%)`;
      if (instant) { void track.offsetWidth; track.style.transition = ''; }
    };

    const render = () => {
      tabs.forEach((t, i) => {
        const active = i === current;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-pressed', String(active));
      });
      dots.forEach((d, i) => {
        const active = i === current;
        d.classList.toggle('is-active', active);
        d.setAttribute('aria-current', String(active));
      });
      panels.forEach((p, i) => {
        const active = i === current;
        p.setAttribute('aria-hidden', String(!active));
        if (active) {
          const wc = p.querySelector('dotlottie-wc');
          if (wc.hasAttribute('data-src')) {
            wc.setAttribute('src', wc.getAttribute('data-src'));
            wc.removeAttribute('data-src');
          }
        }
      });
    };
    setTransform(1, true);
    render();

    // Pas simple (+1/-1) : anime normalement, sauf a une extremite ou il
    // glisse vers le clone voisin (visuellement identique au vrai panneau
    // de l'autre bout) puis se recale dessus sans transition une fois
    // arrive — c'est ce recalage, invisible, qui donne l'illusion d'une
    // boucle infinie plutot qu'un cut ou qu'un aller-retour a travers tout
    // le carrousel. `wrapping` ignore les nouveaux pas tant que le recalage
    // n'est pas fait (evite une course si on re-clique pendant l'anim).
    const step = direction => {
      if (wrapping) return;
      const atEnd = direction === 1 ? current === n - 1 : current === 0;
      current = (current + direction + n) % n;
      if (atEnd) {
        wrapping = true;
        setTransform(direction === 1 ? n + 1 : 0, false);
        setTimeout(() => {
          setTransform(current + 1, true);
          wrapping = false;
        }, WRAP_SNAP_DELAY);
      } else {
        setTransform(current + 1, false);
      }
      render();
    };

    tabs.forEach((tab, i) => {
      const onClick = () => { current = i; setTransform(current + 1, false); render(); };
      tab.addEventListener('click', onClick);
      addCleanup(() => tab.removeEventListener('click', onClick));
    });
    dots.forEach((dot, i) => {
      const onClick = () => { current = i; setTransform(current + 1, false); render(); };
      dot.addEventListener('click', onClick);
      addCleanup(() => dot.removeEventListener('click', onClick));
    });
    if (prev) {
      const onPrev = () => step(-1);
      prev.addEventListener('click', onPrev);
      addCleanup(() => prev.removeEventListener('click', onPrev));
    }
    if (next) {
      const onNext = () => step(1);
      next.addEventListener('click', onNext);
      addCleanup(() => next.removeEventListener('click', onNext));
    }
    // Glissement : suivi visuel en direct (meme technique que
    // setupImageCarousel() plus bas — track deja en %, calc() mixe % et px),
    // transition coupee pendant le geste et restauree juste avant le pas
    // (anime, y compris pour un bouclage : step() gere alors le clone).
    setupSwipe(track, {
      onDrag: dx => {
        track.style.transition = 'none';
        track.style.transform = `translateX(calc(-${(current + 1) * 100}% + ${dx}px))`;
      },
      onDragEnd: delta => {
        track.style.transition = '';
        if (delta <= -SWIPE_THRESHOLD) step(1);
        else if (delta >= SWIPE_THRESHOLD) step(-1);
        else setTransform(current + 1, false);
      }
    });
  });
}

/* Carrousel d'images statiques (ex. Services exclusion/Concept, les 4 etapes
   du nouveau wizard — voir s.carousel dans content.js). Panneaux alignes
   cote a cote dans .cs-carousel__track (pas de hidden/is-active par
   panneau comme .lottie-carousel ci-dessus) : glisser le track via
   transform est ce qui produit l'animation de glissement (voir goTo() dans
   setupImageCarousel()). Fleches prev/next + puces incrustees en bas de la
   scene plutot que des onglets textuels. */
function carouselMarkup(items) {
  // item.zoomable (voir zoomableClass() plus haut) : posee sur le <picture>
  // du panneau, pas sur .cs-carousel__panel lui-meme — c'est le panneau qui
  // glisse via transform pour changer de slide, le zoom ne doit toucher que
  // son contenu. Le glissement du carrousel se coupe tout seul pendant
  // qu'un panneau est zoome (stopPropagation dans setupZoomableMedia()).
  const panels = items.map((item, i) => `
    <div class="cs-carousel__panel" data-role="carousel-panel"
         data-index="${i}" data-caption="${escapeAttr(item.caption || '')}">
      <picture class="${zoomableClass(item.zoomable).trim()}">
        <source srcset="assets/img/${item.image}.webp" type="image/webp">
        <img src="assets/img/${item.image}.png" alt="${escapeAttr(item.caption || '')}" loading="lazy" decoding="async">
      </picture>
    </div>`).join('');
  const dots = items.map((item, i) => `
    <button type="button" class="cs-carousel__dot${i === 0 ? ' is-active' : ''}" data-role="carousel-dot"
            data-index="${i}" aria-label="${escapeAttr(t().csCarouselGoTo)} ${i + 1}"
            aria-current="${i === 0 ? 'true' : 'false'}"></button>`).join('');
  return `
    <figure class="cs-carousel" data-role="carousel">
      <div class="cs-carousel__stage">
        <div class="cs-carousel__track" data-role="carousel-track">${panels}</div>
        <button type="button" class="cs-carousel__arrow cs-carousel__arrow--prev" data-role="carousel-prev"
                aria-label="${escapeAttr(t().csCarouselPrev)}">${chevronIcon('cs-carousel__arrow-icon')}</button>
        <button type="button" class="cs-carousel__arrow cs-carousel__arrow--next" data-role="carousel-next"
                aria-label="${escapeAttr(t().csCarouselNext)}">${chevronIcon('cs-carousel__arrow-icon')}</button>
        <div class="cs-carousel__dots" role="tablist" aria-label="${escapeAttr(t().csCarouselDots)}">${dots}</div>
      </div>
      <figcaption data-role="carousel-caption">${escapeAttr(items[0].caption || '')}</figcaption>
    </figure>`;
}

/* Cablage : fleches et puces font toutes deux avancer le meme etat, les
   fleches/le glissement bouclant aux deux bouts via des clones (voir plus
   bas). Meme scoping par racine et meme addCleanup() que
   setupLottieCarousel(), dont ce carrousel partage le principe de boucle
   infinie a l'identique (voir son commentaire pour le detail). */
function setupImageCarousel() {
  $$('[data-role="carousel"]').forEach(root => {
    const track = $('[data-role="carousel-track"]', root);
    const panels = $$('[data-role="carousel-panel"]', root);
    const dots = $$('[data-role="carousel-dot"]', root);
    const caption = $('[data-role="carousel-caption"]', root);
    const prev = $('[data-role="carousel-prev"]', root);
    const next = $('[data-role="carousel-next"]', root);
    const n = panels.length;

    const headClone = panels[n - 1].cloneNode(true);
    const tailClone = panels[0].cloneNode(true);
    [headClone, tailClone].forEach(c => {
      c.removeAttribute('data-role');
      c.setAttribute('aria-hidden', 'true');
    });
    track.prepend(headClone);
    track.append(tailClone);

    let current = 0;
    let wrapping = false;

    const setTransform = (domSlot, instant) => {
      if (instant) track.style.transition = 'none';
      track.style.transform = `translateX(-${domSlot * 100}%)`;
      if (instant) { void track.offsetWidth; track.style.transition = ''; }
    };

    const render = () => {
      panels.forEach((p, i) => p.setAttribute('aria-hidden', String(i !== current)));
      dots.forEach((d, i) => {
        const active = i === current;
        d.classList.toggle('is-active', active);
        d.setAttribute('aria-current', String(active));
      });
      if (caption) caption.textContent = panels[current].dataset.caption || '';
    };
    setTransform(1, true);
    render();

    const step = direction => {
      if (wrapping) return;
      const atEnd = direction === 1 ? current === n - 1 : current === 0;
      current = (current + direction + n) % n;
      if (atEnd) {
        wrapping = true;
        setTransform(direction === 1 ? n + 1 : 0, false);
        setTimeout(() => {
          setTransform(current + 1, true);
          wrapping = false;
        }, WRAP_SNAP_DELAY);
      } else {
        setTransform(current + 1, false);
      }
      render();
    };

    const onPrev = () => step(-1);
    const onNext = () => step(1);
    prev.addEventListener('click', onPrev);
    next.addEventListener('click', onNext);
    addCleanup(() => prev.removeEventListener('click', onPrev));
    addCleanup(() => next.removeEventListener('click', onNext));

    dots.forEach((dot, i) => {
      const onClick = () => { current = i; setTransform(current + 1, false); render(); };
      dot.addEventListener('click', onClick);
      addCleanup(() => dot.removeEventListener('click', onClick));
    });

    // Glissement : suivi visuel en direct (calc() mixe % et px sans a-coup),
    // transition coupee pendant le geste et restauree juste avant le pas
    // (anime, y compris pour un bouclage : step() gere alors le clone).
    setupSwipe(track, {
      onDrag: dx => {
        track.style.transition = 'none';
        track.style.transform = `translateX(calc(-${(current + 1) * 100}% + ${dx}px))`;
      },
      onDragEnd: delta => {
        track.style.transition = '';
        if (delta <= -SWIPE_THRESHOLD) step(1);
        else if (delta >= SWIPE_THRESHOLD) step(-1);
        else setTransform(current + 1, false);
      }
    });
  });
}

/* ==========================================================================
   5e quater. LA MODALE D'EXCLUSION — widget interactif
   --------------------------------------------------------------------------
   Un seul cas d'usage (section "iterate" de l'etude de cas Services
   exclusion) : voir s.modal dans content.js et l'appel dans pageCase().
   Reproduit le comportement du node Figma 114:10388 ("Modal behavior") —
   a l'ouverture tous les services sont coches (c'est le fix, voir
   s.bullets de la meme section : la logique a ete inversee), decocher une
   ligne l'exclut de la synchronisation, affiche un rappel sur cette ligne
   et met a jour l'avertissement du pied de modale en direct.

   Couleurs/tailles/police copiees a l'identique du node Figma (get_design_
   context sur 114:9541 et 114:9958, les deux "Core modal") plutot que des
   tokens du site — meme choix deliberement que constraintBuilderMarkup()
   plus bas pour la meme raison (fidelite pixel a une maquette precise) :
   Roboto, ink #434C5C, bleu interactif #2E8BE0, bandeau degrade
   #3B6CC9->#224B96, liserés #C2D3FF/#D7E2FF, entete de tableau #E0EEFF,
   icone d'avertissement #F3B248. Coefficient d'echelle 1.6 applique a
   toutes les valeurs de la maquette (400px de large dans Figma -> 640px
   ici) pour rester lisible a taille d'ecran normale.

   La barre de recherche, le bouton de fermeture et Cancel/Next sont du
   chrome decoratif (memes elements non fonctionnels dans le prototype
   Figma source, annotes "Searchbar doesnt work" / "next button doesnt
   bring anywhere when clicked") : rendus sans <input>/gestionnaire pour ne
   pas laisser croire qu'ils font quelque chose. Seules les cases a cocher
   sont reellement interactives. */
function exclModalMarkup(cfg) {
  const rows = cfg.services.map(s => `
    <label class="excl-modal__row" data-role="excl-row">
      <span class="excl-modal__checkbox-wrap">
        <input type="checkbox" class="excl-modal__checkbox-input" data-role="excl-checkbox" checked>
        <span class="excl-modal__checkbox" aria-hidden="true">${checkIcon('excl-modal__checkbox-icon')}</span>
      </span>
      <span class="excl-modal__row-text">
        <span class="excl-modal__row-name">${escapeAttr(s.name)}</span>
        <span class="excl-modal__row-code">${escapeAttr(s.code)}</span>
      </span>
      <span class="excl-modal__row-tag" data-role="excl-tag" hidden>Excluded<br class="excl-modal__row-tag-break">from synchronization</span>
    </label>`).join('');

  // Meme incoherence de taille de police que la source Figma entre l'etape
  // active et les 3 suivantes (voir le commentaire au-dessus) : ignoree ici,
  // .excl-modal__step applique une taille uniforme aux 4 libelles.
  const steps = ['Excluded services', 'Deactivated services', 'Active services', 'Confirmation'];
  const stepper = steps.map((label, i) => `
      <span class="excl-modal__step${i === 0 ? ' is-active' : ''}">
        <span class="excl-modal__step-n" aria-hidden="true">${i + 1}</span>${escapeAttr(label)}
      </span>`).join('<span class="excl-modal__step-sep" aria-hidden="true"></span>');

  return `
    <div class="excl-modal-frame">
      <div class="excl-modal" role="group" aria-label="Interactive recreation of the ‘Services setting’ modal">
        <div class="excl-modal__header">
          <p class="excl-modal__title">Services setting</p>
          <button type="button" class="excl-modal__close" aria-label="Close">${closeIcon('excl-modal__close-icon')}</button>
        </div>
        <div class="excl-modal__surface">
          <div class="excl-modal__stepper">${stepper}</div>
          <div class="excl-modal__container">
            <div class="excl-modal__titre">
              <p class="excl-modal__heading">Select services to exclude from synchronisation</p>
              <p class="excl-modal__desc">First, identify services to be permanently excluded from patient visibility and reporting. These services will never auto-activate. You must manually update their status if later offering them to patients. Excluded services appear in the inactive services list.</p>
              <p class="excl-modal__learn-more">Learn more.</p>
            </div>
            <div class="excl-modal__toolbar">
              <p class="excl-modal__count" data-role="excl-count">${cfg.services.length} imported services</p>
              <span class="excl-modal__search" aria-hidden="true">Search by service name${searchIcon('excl-modal__search-icon')}</span>
            </div>
            <div class="excl-modal__table-head">Service name</div>
            <div class="excl-modal__rows">${rows}</div>
          </div>
        </div>
        <div class="excl-modal__footer">
          <p class="excl-modal__warning" data-role="excl-warning" hidden>${warningTriangleIcon('excl-modal__warning-icon')}<span data-role="excl-warning-text"></span></p>
          <span class="excl-modal__actions">
            <button type="button" class="excl-modal__cancel">Cancel</button>
            <button type="button" class="excl-modal__next">Next</button>
          </span>
        </div>
      </div>
    </div>`;
}

/* Cablage : une seule fonction update() recalculee a chaque changement de
   case, plutot qu'un gestionnaire par ligne — a l'echelle de ~8 lignes le
   recalcul complet est instantane et evite de traquer un etat separe de
   celui deja porte par les checkbox elles-memes (source unique de verite). */
function setupExclModal() {
  $$('.excl-modal').forEach(root => {
    const checkboxes = $$('[data-role="excl-checkbox"]', root);
    const warning = $('[data-role="excl-warning"]', root);
    const warningText = $('[data-role="excl-warning-text"]', root);

    const update = () => {
      let excludedCount = 0;
      checkboxes.forEach(cb => {
        const tag = cb.closest('[data-role="excl-row"]').querySelector('[data-role="excl-tag"]');
        tag.hidden = cb.checked;
        if (!cb.checked) excludedCount++;
      });
      warning.hidden = excludedCount === 0;
      if (excludedCount > 0) {
        warningText.textContent = `${excludedCount} service${excludedCount > 1 ? 's' : ''} will be excluded from synchronization`;
      }
    };

    checkboxes.forEach(cb => {
      cb.addEventListener('change', update);
      addCleanup(() => cb.removeEventListener('change', update));
    });

    update();
  });
}

/* ==========================================================================
   5e ter. LE CONSTRUCTEUR DE CONTRAINTES — widget interactif
   --------------------------------------------------------------------------
   Un seul cas d'usage (section "design" de l'etude de cas Contraintes) :
   voir s.builder dans content.js et l'appel dans pageCase(). N'entre PAS
   dans mediaMarkup()/mediaGroup() : voir la note dans styles.css a cote de
   .constraint-builder pour la justification.
   ========================================================================== */

/* Reduit une liste de jours a une formule lisible : une plage continue
   ("Monday to Friday"), un jour seul ("Monday"), ou juste le compte
   ("3 days") si les jours choisis ne se suivent pas — une liste separee par
   des virgules devient vite illisible des que le nombre de jours augmente. */
function formatDayRange(selected, daysCfg) {
  const order = daysCfg.map(d => d.value);
  const chosen = order.filter(v => selected.includes(v));
  if (!chosen.length) return 'no days selected';
  const full = v => daysCfg.find(d => d.value === v).full;
  const idxs = chosen.map(v => order.indexOf(v));
  const isContiguous = idxs.every((v, i) => i === 0 || v === idxs[i - 1] + 1);
  if (chosen.length === 1) return full(chosen[0]);
  if (isContiguous) return `${full(chosen[0])} to ${full(chosen[chosen.length - 1])}`;
  return `${chosen.length} days`;
}

/* "Care - Floor 2" si une seule tache est cochee, sinon "3 tasks" — le
   champ tache est multi-selection (jusqu'a cfg.maxTasks, voir
   setupTaskDropdown), donc son libelle doit degrader en compte des que plus
   d'une tache est choisie, exactement comme formatDayRange() pour les jours. */
function taskFieldLabel(cfg, selectedValues) {
  if (selectedValues.length === 1) {
    const t = cfg.tasks.find(x => x.value === selectedValues[0]);
    return t ? t.label : '';
  }
  return `${selectedValues.length} tasks`;
}

/* Phrase de synthese, avec les valeurs en pastilles (".cbuild__pill") —
   c'est la partie que le texte de la section designe comme "the important
   piece". Reconstruite entierement a chaque changement. "the task"/"the
   tasks" et le nombre de pastilles suivent le nombre de taches cochees. */
function constraintRecapHTML(vals, cfg) {
  const physician = cfg.physicians.find(p => p.value === vals.physician);
  const constraint = cfg.constraints.find(c => c.value === vals.constraint);
  const pill = (text) => `<span class="cbuild__pill">${escapeAttr(text)}</span>`;
  const taskWord = vals.tasks.length > 1 ? 'tasks' : 'task';
  let html = `${pill(physician.label)} ${escapeAttr(constraint.predicate)} the ${taskWord} ${pill(taskFieldLabel(cfg, vals.tasks))}`;
  if (vals.days.length) {
    html += ` from ${pill(formatDayRange(vals.days, cfg.days))}`;
  }
  return html + '.';
}

/* Lignes d'options simples (physicien) : meme composant listbox que le type
   de contrainte (cbuild__listbox / cbuild__trigger), juste sans icone ni
   description. */
function simpleOptionRows(items, selectedValue) {
  return items.map(item => `
    <li role="option" data-value="${escapeAttr(item.value)}"
        aria-selected="${item.value === selectedValue ? 'true' : 'false'}" tabindex="-1">
      <span class="cbuild__opt-text"><span class="cbuild__opt-predicate">${escapeAttr(item.label)}</span></span>
    </li>`).join('');
}

/* Lignes a cases a cocher (taches, multi-selection) : meme structure que
   simpleOptionRows() plus une case visuelle (cbuild__opt-checkbox, purement
   decorative — l'etat coche/decoche reel est porte par aria-selected, comme
   pour les autres listbox du widget). */
function taskCheckboxRows(items, selectedValues) {
  return items.map(item => `
    <li role="option" data-value="${escapeAttr(item.value)}"
        aria-selected="${selectedValues.includes(item.value) ? 'true' : 'false'}" tabindex="-1">
      <span class="cbuild__opt-checkbox" aria-hidden="true">
        <img class="cbuild__opt-check" src="assets/icons/constraint-check.svg" alt="" width="12" height="10">
      </span>
      <span class="cbuild__opt-text"><span class="cbuild__opt-predicate">${escapeAttr(item.label)}${item.size ? ` (${item.size})` : ''}</span></span>
    </li>`).join('');
}

/* Lignes du type de contrainte (icone + predicat + description) : factorisee
   pour etre partagee entre constraintBuilderMarkup() (ou seule "Limit" reste
   jamais reellement selectionnable, voir plus bas) et componentsShowcaseMarkup()
   (ou les quatre types se selectionnent vraiment).
   L'icone est un <span> masque (mask-image, --opt-icon-src) plutot qu'un
   <img> : un <img> pointe vers un SVG dont les couleurs sont figees dans le
   fichier, donc pas re-teignable en CSS — le survol (styles.css) inverse
   les couleurs du chip (bg <-> glyphe), ce qui exige que le glyphe soit une
   forme masquee dont on pilote juste le background-color. "../" devant
   c.icon (contrairement aux <img src> du reste du fichier, relatifs a la
   page) : un url() dans une custom property se resout relatif a la feuille
   de style qui la CONSOMME via var() (styles.css, dans css/), pas relatif a
   la page qui la DEFINIT ici — meme convention que les autres url() de
   styles.css (ex. constraint-builder-bg.png). Sans le "../", le mask
   pointait vers css/assets/... (404) et le glyphe ne s'affichait pas du
   tout, hover ou pas. */
function constraintOptionRows(constraints, selectedValue) {
  return constraints.map(c => `
    <li role="option" data-value="${escapeAttr(c.value)}"
        aria-selected="${c.value === selectedValue ? 'true' : 'false'}" tabindex="-1">
      <span class="cbuild__opt-icon" aria-hidden="true">${c.icon ? `<span class="cbuild__opt-icon-glyph" style="--opt-icon-src: url('../${escapeAttr(c.icon)}')"></span>` : ''}</span>
      <span class="cbuild__opt-text">
        <span class="cbuild__opt-predicate">${escapeAttr(c.predicate)}</span>
        <span class="cbuild__opt-desc">${escapeAttr(c.description)}</span>
      </span>
    </li>`).join('');
}

/* Un champ "trigger + listbox" complet (physicien, tache, ou contrainte) —
   factorise parce que les trois partagent exactement la meme mecanique
   ARIA/CSS (cbuild__trigger, cbuild__listbox, role=listbox/option). */
function dropdownField({ role, label, ariaLabel, rowsHTML, chevron }) {
  return `
    <span class="cbuild__field cbuild__field--${role}">
      <button type="button" class="cbuild__select cbuild__trigger" data-role="${role}-trigger"
              aria-haspopup="listbox" aria-expanded="false" aria-controls="cbuild-${role}-list">
        <span data-role="${role}-label">${escapeAttr(label)}</span>
        ${chevron}
      </button>
      <ul class="cbuild__listbox" id="cbuild-${role}-list" role="listbox"
          aria-label="${escapeAttr(ariaLabel)}" data-role="${role}-list" hidden>${rowsHTML}</ul>
    </span>`;
}

/* Balisage initial (etat par defaut = Limit, seul type selectionnable dans
   cette demo). Rendu normalement dans le flux du HTML de la page ;
   setupConstraintBuilder() ajoute ensuite l'interactivite. */
function constraintBuilderMarkup(cfg) {
  const d = cfg.default;
  const selectedConstraint = cfg.constraints.find(c => c.value === d.constraint);
  const selectedPhysician = cfg.physicians.find(p => p.value === d.physician);

  // Les trois autres types restent visibles et cliquables (fidele au
  // composant Figma node 18:254), mais cliquer dessus ne change jamais la
  // selection reelle (voir setupConstraintDropdown, app.js) : seule "Limit"
  // a une illustration dans la maquette source (node 18:383).
  const constraintRows = constraintOptionRows(cfg.constraints, d.constraint);

  const dayButtons = cfg.days.map(day => `
    <button type="button" class="cbuild__day${d.days.includes(day.value) ? ' is-on' : ''}"
            data-day="${escapeAttr(day.value)}" aria-pressed="${d.days.includes(day.value) ? 'true' : 'false'}">${escapeAttr(day.label)}</button>`).join('');

  // Icone chevron de la maquette Figma (fond violet fixe #371495), pas le
  // chevron Lucide partage par chevronIcon() ailleurs sur le site : fidelite
  // exacte demandee pour ce widget precis.
  const fieldChevron = `<img class="cbuild__field-chevron" src="assets/icons/constraint-chevron-down.svg" alt="" aria-hidden="true" width="24" height="24">`;

  const physicianField = dropdownField({
    role: 'physician', label: selectedPhysician.label, ariaLabel: 'Physician',
    rowsHTML: simpleOptionRows(cfg.physicians, d.physician), chevron: fieldChevron
  });
  const taskField = dropdownField({
    role: 'task', label: taskFieldLabel(cfg, d.tasks), ariaLabel: 'Tasks',
    rowsHTML: taskCheckboxRows(cfg.tasks, d.tasks), chevron: fieldChevron
  });
  const constraintField = dropdownField({
    role: 'constraint', label: selectedConstraint.predicate, ariaLabel: 'Constraint type',
    rowsHTML: constraintRows, chevron: fieldChevron
  });

  // Illustration : reproduction de l'etat "Limit" de la maquette Figma (node
  // 18:383) — un losange par tache selectionnee (jusqu'a cfg.maxTasks),
  // chacun sur son propre "etage" vertical (cbuild__illu-layer--slotN) avec
  // une couleur differente, dans le meme esprit que l'empilement a cinq
  // losanges de la maquette d'origine. Les 4 <img> sont toujours dans le DOM
  // (setupConstraintBuilder bascule leur [hidden] selon le nombre de taches
  // cochees) plutot que regenerees a chaque changement.
  // rotate(45deg) : le path SVG trace un losange dont les DIAGONALES sont
  // deja a 45°/135° dans son propre viewBox — sans rotation CSS, la forme
  // rendue est donc un losange penche, pas la forme "debout" (pointes en
  // haut/bas/gauche/droite) de la maquette ; la rotation ramene ces
  // diagonales a 0°/90°. La ligne pointillee (.cbuild__illu-guide) et le
  // crochet "Limit" (.cbuild__illu-bracket) sont batis en CSS plutot qu'en
  // SVG statique : le crochet doit suivre --illu-count (hauteur + position,
  // voir styles.css), ce qu'une image ne peut pas faire.
  const layerAssets = [
    'assets/icons/constraint-illu-layer-3.svg',
    'assets/icons/constraint-illu-layer-2.svg',
    'assets/icons/constraint-illu-layer-4.svg',
    'assets/icons/constraint-illu-layer-5.svg'
  ];
  const diamondLayers = layerAssets.map((src, i) => `
    <img class="cbuild__illu-layer cbuild__illu-layer--slot${i}" data-role="illu-diamond"
         src="${escapeAttr(src)}" alt=""${i < d.tasks.length ? '' : ' hidden'}>`).join('');

  const illustration = `
    <div class="cbuild__illu" aria-hidden="true">
      <div class="cbuild__illu-graphic" data-role="illu-graphic" style="--illu-count: ${d.tasks.length}">
        ${diamondLayers}
        <span class="cbuild__illu-guide" aria-hidden="true"></span>
        <span class="cbuild__illu-bracket" data-role="illu-bracket" aria-hidden="true"></span>
        <span class="cbuild__illu-bracket-label" data-role="illu-bracket-label">${escapeAttr(selectedConstraint.name)}</span>
        <div class="cbuild__illu-label cbuild__illu-label--time">
          <dt>Time</dt><dd data-role="illu-days">${escapeAttr(formatDayRange(d.days, cfg.days))}</dd>
        </div>
        <div class="cbuild__illu-label cbuild__illu-label--tasks">
          <dt>Tasks</dt><dd data-role="illu-task">${escapeAttr(taskFieldLabel(cfg, d.tasks))}</dd>
        </div>
      </div>
    </div>`;
  // aria-hidden sur toute l'illustration : purement decorative. Chaque fait
  // qu'elle montre (contrainte, tache, jours) est deja enonce en texte
  // simple dans la phrase de synthese ci-dessous, qui porte l'information
  // pour un lecteur d'ecran ou sans SVG.

  return `
    <div class="constraint-builder" data-constraint-builder>
      <div class="cbuild__frame">
        <div class="cbuild__card">
          <div class="cbuild__layout">
            <div class="cbuild__left">
              <p class="cbuild__card-title">Constraint parameters</p>
              <div class="cbuild__sentence">
                Physician(s)
                ${physicianField}
                ${constraintField}
                <span class="cbuild__break" aria-hidden="true"></span>
                <span data-role="task-word">${d.tasks.length > 1 ? 'the tasks' : 'the task'}</span>
                ${taskField}
                from
                <span class="cbuild__field cbuild__field--days">
                  <button type="button" class="cbuild__select cbuild__trigger" data-role="days-trigger"
                          aria-expanded="false" aria-controls="cbuild-days-panel">
                    <span data-role="days-summary">${escapeAttr(formatDayRange(d.days, cfg.days))}</span>
                    ${fieldChevron}
                  </button>
                </span>
              </div>

              <div class="cbuild__constraint-info" data-role="constraint-info" id="cbuild-days-panel" hidden>
                <div class="cbuild__info-head">
                  <p class="cbuild__drawer-kicker">
                    <img data-role="drawer-kicker-icon" src="${escapeAttr(selectedConstraint.icon)}" alt="" aria-hidden="true" width="16" height="16">
                    <span data-role="drawer-kicker-label">${escapeAttr(selectedConstraint.name)} constraint</span>
                  </p>
                </div>
                <div class="cbuild__info-body" data-role="info-body">
                  <p class="cbuild__drawer-title">Days</p>
                  <p class="cbuild__drawer-hint">Select applicable days for this constraint.</p>
                  <button type="button" class="cbuild__select-all" data-role="select-all-days">${d.days.length === cfg.days.length ? 'Unselect all' : 'Select all'}</button>
                  <div class="cbuild__days" data-role="days-picker" role="group" aria-label="Applicable days">${dayButtons}</div>
                </div>
              </div>
            </div>

            <div class="cbuild__right">
              ${illustration}
              <p class="cbuild__preview-title" data-role="preview-title">${escapeAttr(selectedConstraint.name)} constraint</p>
              <p class="cbuild__recap" data-role="recap" aria-live="polite">${constraintRecapHTML(d, cfg)}</p>
            </div>
          </div>
        </div>
      </div>
      <p class="cbuild__caption">${escapeAttr(cfg.caption)}</p>
    </div>`;
}

/* Ferme UN champ (trigger + son contenu deplie) des qu'un clic tombe en
   dehors de ces elements precis — meme si ce clic reste a l'interieur du
   widget (ex. cliquer sur "Constraint parameters" pendant que la listbox
   des taches est ouverte). mousedown plutot que click : se declenche avant
   qu'un autre gestionnaire de clic n'ait la moindre chance d'interferer
   (ex. stopPropagation), pattern standard pour ce genre de detection.
   Hissee au niveau du module (pas locale a setupConstraintBuilder) : reprise
   telle quelle par setupComponentsShowcase() plus bas. */
function bindOutsideClose(elements, close) {
  const onDocMouseDown = (ev) => {
    if (elements.some(node => node && node.contains(ev.target))) return;
    close();
  };
  document.addEventListener('mousedown', onDocMouseDown, true);
  addCleanup(() => document.removeEventListener('mousedown', onDocMouseDown, true));
}

/* Cablage : trois champs "trigger + listbox" identiques (physicien, tache,
   type de contrainte — factorises dans setupDropdown ci-dessous), boutons de
   jours, tiroir conditionnel, phrase de synthese. Tout ecouteur passe par
   addCleanup() : voir section 1. */
function setupConstraintBuilder() {
  const root = $('.constraint-builder');
  if (!root) return;

  const project = PROJECTS.find(p => p.slug === 'constraints');
  const cfg = project.sections.find(s => s.id === 'design').builder;
  const vals = { physician: cfg.default.physician, constraint: cfg.default.constraint,
                 tasks: [...cfg.default.tasks], days: [...cfg.default.days] };

  const daysTrigger = $('[data-role="days-trigger"]', root);
  const daysTriggerSummary = $('[data-role="days-summary"]', root);
  const constraintInfo = $('[data-role="constraint-info"]', root);
  const infoBody = $('[data-role="info-body"]', root);
  const dayButtons = $$('.cbuild__day', root);
  const selectAllBtn = $('[data-role="select-all-days"]', root);
  const taskWord = $('[data-role="task-word"]', root);
  const recap = $('[data-role="recap"]', root);
  const illuDays = $('[data-role="illu-days"]', root);
  const illuTask = $('[data-role="illu-task"]', root);
  const illuDiamonds = $$('[data-role="illu-diamond"]', root);
  const illuGraphic = $('[data-role="illu-graphic"]', root);
  const previewTitle = $('[data-role="preview-title"]', root);
  const illuBracketLabel = $('[data-role="illu-bracket-label"]', root);

  // Minuteurs de sortie (un par losange, voir updatePreview ci-dessous) :
  // trace pour pouvoir les annuler si l'etat re-change avant la fin du
  // fondu, et pour les vider au demontage du widget.
  const illuHideTimers = illuDiamonds.map(() => null);
  addCleanup(() => illuHideTimers.forEach(id => clearTimeout(id)));

  const updatePreview = () => {
    const constraint = cfg.constraints.find(c => c.value === vals.constraint);
    illuDays.textContent = formatDayRange(vals.days, cfg.days);
    illuTask.textContent = taskFieldLabel(cfg, vals.tasks);
    // Losange nouvellement revele (etait hidden, ne l'est plus) : meme depart
    // que la pile compacte de heroMedia (constraint-limit.json, frame ~3) —
    // un seul losange au pivot central (top:35%, cf. --illu-base ci-dessous
    // quand --illu-count:1), invisible, avant de glisser vers son etage.
    // L'inline top/opacity fixe cet etat de depart ; le retirer au frame
    // suivant laisse la transition CSS (.cbuild__illu-layer) l'animer vers le
    // top final regle par sa classe --slotN — chaque losange glisse donc
    // separement, certains vers le haut, d'autres vers le bas, exactement
    // comme la pile qui se separe dans le Lottie.
    // Sortie symetrique : un losange retire glisse D'ABORD vers ce meme pivot
    // en s'estompant, et ne passe hidden qu'une fois la transition terminee
    // (450ms = duree de la transition "top" ci-dessous, styles.css). Sans ce
    // delai, hidden=true immediat coupait le losange en plein vol pendant que
    // les autres etaient encore en train de se recentrer — il semblait
    // disparaitre au milieu de l'animation plutot que la terminer.
    illuDiamonds.forEach((img, i) => {
      const shouldShow = i < vals.tasks.length;
      clearTimeout(illuHideTimers[i]);
      if (shouldShow) {
        if (img.hidden) {
          img.hidden = false;
          img.style.top = '35%';
          img.style.opacity = '0';
          void img.offsetWidth;
          requestAnimationFrame(() => { img.style.top = ''; img.style.opacity = ''; });
        } else {
          // Deja visible (ou en cours de sortie annulee par un re-ajout
          // rapide) : pas besoin du reflow ci-dessus, juste s'assurer qu'il
          // vise bien son etage final.
          img.style.top = '';
          img.style.opacity = '';
        }
      } else if (!img.hidden) {
        img.style.top = '35%';
        img.style.opacity = '0';
        illuHideTimers[i] = setTimeout(() => {
          img.hidden = true;
          img.style.top = '';
          img.style.opacity = '';
        }, 450);
      }
    });
    // --illu-count pilote --illu-base (styles.css) : garde le tas de losanges
    // visibles centre sur le crochet "Limit" quel que soit leur nombre,
    // plutot que de toujours empiler depuis le meme losange du bas.
    illuGraphic.style.setProperty('--illu-count', vals.tasks.length);
    previewTitle.textContent = `${constraint.name} constraint`;
    illuBracketLabel.textContent = constraint.name;
    taskWord.textContent = vals.tasks.length > 1 ? 'the tasks' : 'the task';
    recap.innerHTML = constraintRecapHTML(vals, cfg);
  };

  // Un seul panneau ouvert a la fois (les 3 listbox + le panneau de details
  // des jours) : chaque `open()`/toggle ci-dessous commence par fermer tout
  // ce que `closers` connait, et le clic exterieur (plus bas) fait la meme
  // chose.
  const closers = [];

  // Listbox a selection simple (physicien) : ferme au clic sur une option.
  const setupSingleSelectDropdown = (role, onSelect) => {
    const trigger = $(`[data-role="${role}-trigger"]`, root);
    const label = $(`[data-role="${role}-label"]`, root);
    const listbox = $(`[data-role="${role}-list"]`, root);
    const options = $$('li[role="option"]', listbox);

    const close = () => { listbox.hidden = true; trigger.setAttribute('aria-expanded', 'false'); };
    const open = () => {
      closers.forEach(c => c());
      listbox.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      (options.find(o => o.getAttribute('aria-selected') === 'true') || options[0]).focus();
    };
    const onTriggerClick = () => { listbox.hidden ? open() : close(); };
    trigger.addEventListener('click', onTriggerClick);
    addCleanup(() => trigger.removeEventListener('click', onTriggerClick));

    const select = (value) => {
      options.forEach(o => o.setAttribute('aria-selected', String(o.dataset.value === value)));
      onSelect(value, label);
    };
    options.forEach(opt => {
      const onClick = () => { select(opt.dataset.value); close(); trigger.focus(); };
      opt.addEventListener('click', onClick);
      addCleanup(() => opt.removeEventListener('click', onClick));
    });

    const onKeydown = (ev) => {
      const i = options.indexOf(document.activeElement);
      if (ev.key === 'ArrowDown') { ev.preventDefault(); (options[i + 1] || options[0]).focus(); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); (options[i - 1] || options[options.length - 1]).focus(); }
      else if (ev.key === 'Home') { ev.preventDefault(); options[0].focus(); }
      else if (ev.key === 'End') { ev.preventDefault(); options[options.length - 1].focus(); }
      else if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); select(document.activeElement.dataset.value); close(); trigger.focus(); }
      else if (ev.key === 'Escape') { close(); trigger.focus(); }
    };
    listbox.addEventListener('keydown', onKeydown);
    addCleanup(() => listbox.removeEventListener('keydown', onKeydown));

    closers.push(() => { if (!listbox.hidden) close(); });
    bindOutsideClose([trigger, listbox], close);
  };

  setupSingleSelectDropdown('physician', (value, label) => {
    vals.physician = value;
    label.textContent = cfg.physicians.find(p => p.value === value).label;
    updatePreview();
  });

  // Listbox du type de contrainte : toutes les options sont cliquables et
  // ferment le menu (demande explicite), mais seule "Limit" reste jamais
  // reellement selectionnee — aria-selected n'est donc jamais reecrit ici, et
  // .cbuild__listbox li[aria-selected] n'a plus de style de survol permanent
  // (styles.css) : cliquer une autre option ne fait donc que fermer le menu,
  // sans laisser de trace visuelle sur la ligne cliquee.
  (() => {
    const trigger = $('[data-role="constraint-trigger"]', root);
    const listbox = $('[data-role="constraint-list"]', root);
    const options = $$('li[role="option"]', listbox);

    const close = () => { listbox.hidden = true; trigger.setAttribute('aria-expanded', 'false'); };
    const open = () => {
      closers.forEach(c => c());
      listbox.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      (options.find(o => o.dataset.value === vals.constraint) || options[0]).focus();
    };
    const onTriggerClick = () => { listbox.hidden ? open() : close(); };
    trigger.addEventListener('click', onTriggerClick);
    addCleanup(() => trigger.removeEventListener('click', onTriggerClick));

    options.forEach(opt => {
      const onClick = () => { close(); trigger.focus(); };
      opt.addEventListener('click', onClick);
      addCleanup(() => opt.removeEventListener('click', onClick));
    });

    const onKeydown = (ev) => {
      const i = options.indexOf(document.activeElement);
      if (ev.key === 'ArrowDown') { ev.preventDefault(); (options[i + 1] || options[0]).focus(); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); (options[i - 1] || options[options.length - 1]).focus(); }
      else if (ev.key === 'Home') { ev.preventDefault(); options[0].focus(); }
      else if (ev.key === 'End') { ev.preventDefault(); options[options.length - 1].focus(); }
      else if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); close(); trigger.focus(); }
      else if (ev.key === 'Escape') { close(); trigger.focus(); }
    };
    listbox.addEventListener('keydown', onKeydown);
    addCleanup(() => listbox.removeEventListener('keydown', onKeydown));

    closers.push(() => { if (!listbox.hidden) close(); });
    bindOutsideClose([trigger, listbox], close);
  })();

  // Listbox des taches : cases a cocher, plafonnee a cfg.maxTasks, reste
  // ouverte apres chaque coche (contrairement aux deux listbox ci-dessus) —
  // on choisit plusieurs taches d'affilee sans rouvrir le menu a chaque fois.
  (() => {
    const trigger = $('[data-role="task-trigger"]', root);
    const label = $('[data-role="task-label"]', root);
    const listbox = $('[data-role="task-list"]', root);
    const options = $$('li[role="option"]', listbox);

    const close = () => { listbox.hidden = true; trigger.setAttribute('aria-expanded', 'false'); };
    const open = () => {
      closers.forEach(c => c());
      listbox.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      (options.find(o => o.getAttribute('aria-selected') === 'true') || options[0]).focus();
    };
    const onTriggerClick = () => { listbox.hidden ? open() : close(); };
    trigger.addEventListener('click', onTriggerClick);
    addCleanup(() => trigger.removeEventListener('click', onTriggerClick));

    const toggleTask = (opt) => {
      const value = opt.dataset.value;
      const isOn = opt.getAttribute('aria-selected') === 'true';
      if (isOn) {
        if (vals.tasks.length <= 1) return;              // au moins une tache reste cochee
        vals.tasks = vals.tasks.filter(v => v !== value);
      } else {
        if (vals.tasks.length >= cfg.maxTasks) return;    // plafond (4)
        vals.tasks = [...vals.tasks, value];
      }
      opt.setAttribute('aria-selected', String(!isOn));
      label.textContent = taskFieldLabel(cfg, vals.tasks);
      updatePreview();
    };
    options.forEach(opt => {
      const onClick = () => toggleTask(opt);
      opt.addEventListener('click', onClick);
      addCleanup(() => opt.removeEventListener('click', onClick));
    });

    const onKeydown = (ev) => {
      const i = options.indexOf(document.activeElement);
      if (ev.key === 'ArrowDown') { ev.preventDefault(); (options[i + 1] || options[0]).focus(); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); (options[i - 1] || options[options.length - 1]).focus(); }
      else if (ev.key === 'Home') { ev.preventDefault(); options[0].focus(); }
      else if (ev.key === 'End') { ev.preventDefault(); options[options.length - 1].focus(); }
      else if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); toggleTask(document.activeElement); }
      else if (ev.key === 'Escape') { close(); trigger.focus(); }
    };
    listbox.addEventListener('keydown', onKeydown);
    addCleanup(() => listbox.removeEventListener('keydown', onKeydown));

    closers.push(() => { if (!listbox.hidden) close(); });
    bindOutsideClose([trigger, listbox], close);
  })();

  // Panneau "Limit constraint" (jours) : masque par defaut, ne s'affiche que
  // lorsque le champ "from [...]" est selectionne (ouvert) — seul ce champ
  // pilote le panneau desormais (plus de chevron/bouton dedie a l'interieur
  // du tiroir, redondant avec ce meme champ). Se referme (et redisparait
  // entierement, pas seulement son contenu) via les memes `closers` que les
  // listbox : clic exterieur, ouverture d'un autre champ, etc.
  let infoOpen = false;
  const setInfoOpen = (open) => {
    infoOpen = open;
    constraintInfo.hidden = !open;
    infoBody.hidden = !open;
    daysTrigger.setAttribute('aria-expanded', String(open));
  };
  const toggleInfo = () => {
    if (infoOpen) { setInfoOpen(false); }
    else { closers.forEach(c => c()); setInfoOpen(true); }
  };
  daysTrigger.addEventListener('click', toggleInfo);
  addCleanup(() => daysTrigger.removeEventListener('click', toggleInfo));
  closers.push(() => { if (infoOpen) setInfoOpen(false); });
  bindOutsideClose([daysTrigger, constraintInfo], () => setInfoOpen(false));

  // "Select all" devient "Unselect all" des que les 7 jours sont coches —
  // reflete l'etat courant plutot que de rester un libelle fixe qui n'aurait
  // plus de sens une fois tout deja selectionne.
  const updateSelectAllLabel = () => {
    selectAllBtn.textContent = vals.days.length === cfg.days.length ? 'Unselect all' : 'Select all';
  };

  const refreshDays = () => {
    const rangeText = formatDayRange(vals.days, cfg.days);
    daysTriggerSummary.textContent = rangeText;
    illuDays.textContent = rangeText;
    recap.innerHTML = constraintRecapHTML(vals, cfg);
    updateSelectAllLabel();
  };

  dayButtons.forEach(btn => {
    const onClick = () => {
      const day = btn.dataset.day;
      const on = !btn.classList.contains('is-on');
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', String(on));
      vals.days = on ? [...vals.days, day] : vals.days.filter(x => x !== day);
      refreshDays();
    };
    btn.addEventListener('click', onClick);
    addCleanup(() => btn.removeEventListener('click', onClick));
  });

  const onSelectAllToggle = () => {
    const allSelected = vals.days.length === cfg.days.length;
    vals.days = allSelected ? [] : cfg.days.map(d => d.value);
    dayButtons.forEach(btn => {
      btn.classList.toggle('is-on', !allSelected);
      btn.setAttribute('aria-pressed', String(!allSelected));
    });
    refreshDays();
  };
  selectAllBtn.addEventListener('click', onSelectAllToggle);
  addCleanup(() => selectAllBtn.removeEventListener('click', onSelectAllToggle));
  addCleanup(() => selectAllBtn.removeEventListener('click', onSelectAll));
}

/* ==========================================================================
   5e quinquies. VITRINE DE COMPOSANTS — quatre champs autonomes
   --------------------------------------------------------------------------
   Second widget, sous le rule-builder (voir s.builder.components dans
   content.js) : contrairement a constraintBuilderMarkup() ci-dessus, ce n'est
   pas une phrase composee mais quatre champs independants (physicien,
   contrainte, taches, periode) — chacun s'ouvre/se ferme pour son propre
   compte, plusieurs peuvent rester ouverts a la fois (pas de `closers`
   partage). Reference Figma : fichier "Claude-portfolio-image-generation",
   frame "Components" (node 52:1781) pour l'apparence, frame "Interactive
   components" (node 21:797) pour le comportement (recherche, auto-suggestion,
   bascules Physicians/Groups et Tasks/Shifts, Fixed period/Series).
   ========================================================================== */

/* Etat initial des quatre champs. Fonction plutot que litteral fige : reprise
   telle quelle par componentsShowcaseMarkup() (rendu initial) ET
   setupComponentsShowcase() (etat JS de depart), pour que les deux ne
   divergent jamais. */
function componentsShowcaseDefaults(cfg, parentCfg) {
  return {
    physicianTab: 'physician',
    physicians: [parentCfg.physicians[1].value],
    groups: [],
    constraint: parentCfg.constraints[0].value,
    taskTab: 'task',
    tasks: [parentCfg.tasks[0].value],
    shifts: [],
    taskCount: 3,
    periodMode: 'fixed',
    fixedChoice: 'days',
    seriesChoice: 'series',
    days: [parentCfg.days[0].value, parentCfg.days[1].value],
    specificPeriod: cfg.periods[0].value,
    seriesDays: 5
  };
}

/* Libelle du declencheur "physicien" : le nom si 1 ou 2 selectionnes, sinon
   un compte ("4 physicians selected") — meme logique que taskFieldLabel()
   pour le rule-builder, mais tenant compte de l'onglet actif (Physicians ou
   Groups partagent le meme declencheur). Si l'onglet affiche est vide mais
   que l'AUTRE categorie a deja une selection (l'utilisateur a juste bascule
   d'onglet sans rien decocher), on continue de la montrer plutot que
   d'afficher "Select ..." — ce texte donnerait a tort l'impression que tout
   a ete efface. */
/* `word` (deja identique a la `scope` attendue par pillHTML : 'physicians'/
   'groups'/'tasks'/'shifts') est reporte dans le retour uniquement quand le
   libelle est la forme numerique ("N X selected") — c'est ce champ qui dit
   aux fonctions triggerHTML ci-dessous d'habiller le texte dans une pastille
   plutot que de l'afficher nu ; les noms (<=2 elements) restent du texte
   simple, un nombre n'a de sens que dans une pastille. */
function dualCategoryTriggerLabel(list, source, otherList, otherSource, word, otherWord, placeholder) {
  const active = list.length ? { list, source, word } : otherList.length ? { list: otherList, source: otherSource, word: otherWord } : null;
  if (!active) return { text: placeholder, word: null };
  if (active.list.length <= 2) return { text: active.list.map(v => active.source.find(s => s.value === v).label).join(', '), word: null };
  return { text: `${active.list.length} ${active.word} selected`, word: active.word };
}
function physicianTriggerLabel(vals, parentCfg, cfg) {
  const active = vals.physicianTab === 'physician';
  const list = active ? vals.physicians : vals.groups;
  const source = active ? parentCfg.physicians : cfg.groups;
  const otherList = active ? vals.groups : vals.physicians;
  const otherSource = active ? cfg.groups : parentCfg.physicians;
  return dualCategoryTriggerLabel(list, source, otherList, otherSource,
    active ? 'physicians' : 'groups', active ? 'groups' : 'physicians',
    active ? 'Select physicians' : 'Select groups');
}
function taskTriggerLabel(vals, parentCfg, cfg) {
  const active = vals.taskTab === 'task';
  const list = active ? vals.tasks : vals.shifts;
  const source = active ? parentCfg.tasks : cfg.shifts;
  const otherList = active ? vals.shifts : vals.tasks;
  const otherSource = active ? cfg.shifts : parentCfg.tasks;
  return dualCategoryTriggerLabel(list, source, otherList, otherSource,
    active ? 'tasks' : 'shifts', active ? 'shifts' : 'tasks',
    active ? 'Select tasks' : 'Select shifts');
}

const pluralize = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
/* Croix reutilisee (assets/icons/constraint-clear.svg, deja utilisee par
   .ccomp__search-clear) pour les pastilles ci-dessous — evite un second
   asset identique. */
const pillCrossIcon = '<img class="ccomp__pill-remove-icon" src="assets/icons/constraint-clear.svg" alt="" aria-hidden="true" width="10" height="10">';
function pillHTML(scope, text, removeLabel, accent) {
  return `
    <span class="ccomp__pill${accent ? ' ccomp__pill--accent' : ''}">
      <span class="ccomp__pill-label">${text}</span>
      <span class="ccomp__pill-remove" data-pill-remove="${scope}" role="button" tabindex="0" aria-label="${removeLabel}">${pillCrossIcon}</span>
    </span>`;
}
function physicianGroupsSize(vals, cfg) {
  return vals.groups.reduce((sum, v) => {
    const g = cfg.groups.find(g => g.value === v);
    return sum + (g && g.size ? g.size : 0);
  }, 0);
}
/* Pastilles croisees (node 58:2890, "Physician dropdown") : des que les
   deux onglets (physiciens individuels ET groupes) ont au moins une
   selection, le declencheur bascule du texte simple (physicianTriggerLabel,
   qui ne montre que l'onglet actif) a un ".ccomp__pillgroup" — pas une
   rangee a plat, mais un seul cadre clair qui ENGLOBE le texte "N Total"
   (physiciens + taille de chaque groupe selectionne, voir `size` dans
   content.js), les deux pastilles pleines Physicians/Groups (chacune avec
   sa propre croix) et la croix globale qui vide les deux — structure fidele
   a la maquette, pas une simplification a plat. Le total est une pure
   valeur d'affichage : `size` est un chiffre d'exemple fixe par groupe,
   sans roster reel derriere (la maquette elle-meme montre "223 Total" pour
   4 personnes nommees dans toute la demo). */
function physicianTriggerHTML(vals, parentCfg, cfg) {
  if (!vals.physicians.length || !vals.groups.length) {
    const label = physicianTriggerLabel(vals, parentCfg, cfg);
    if (label.word) return pillHTML(label.word, label.text, `Remove all ${label.word}`, true);
    return escapeAttr(label.text);
  }
  const total = vals.physicians.length + physicianGroupsSize(vals, cfg);
  return `
    <span class="ccomp__pillgroup">
      <span class="ccomp__pill-label">${total} Total</span>
      ${pillHTML('physicians', pluralize(vals.physicians.length, 'Physician'), 'Remove all physicians', true)}
      ${pillHTML('groups', pluralize(vals.groups.length, 'Group'), 'Remove all groups', true)}
      <span class="ccomp__pill-remove" data-pill-remove="all" role="button" tabindex="0" aria-label="Clear physicians and groups">${pillCrossIcon}</span>
    </span>`;
}
/* Meme principe (node 58:2870, "Task dropdown"), sans pastille Total : Tasks
   et Shifts ne s'emboitent pas l'un dans l'autre comme Groups contient des
   physiciens. */
function taskTriggerHTML(vals, parentCfg, cfg) {
  if (!vals.tasks.length || !vals.shifts.length) {
    const label = taskTriggerLabel(vals, parentCfg, cfg);
    if (label.word) return pillHTML(label.word, label.text, `Remove all ${label.word}`, false);
    return escapeAttr(label.text);
  }
  return `
    <span class="ccomp__pillrow">
      ${pillHTML('tasks', pluralize(vals.tasks.length, 'Task'), 'Remove all tasks', false)}
      ${pillHTML('shifts', pluralize(vals.shifts.length, 'Shift'), 'Remove all shifts', false)}
    </span>`;
}
/* Libelle du declencheur "period" : les 4 combinaisons possibles (mode
   fixe/serie x choix jours/periode nommee). Un jour picker vide ou a plus
   de 2 jours reprend la meme convention que physicianTriggerLabel/
   taskTriggerLabel (noms si <=2, compte sinon) ; la serie affiche
   "series of N day(s)" plutot qu'un compte de jours coches. */
function periodTriggerLabel(vals, parentCfg, cfg) {
  const dayLabel = () => {
    if (!vals.days.length) return 'Select days';
    if (vals.days.length <= 2) return vals.days.map(v => parentCfg.days.find(d => d.value === v).label).join(', ');
    return `${vals.days.length} days selected`;
  };
  if (vals.periodMode === 'fixed') {
    if (vals.fixedChoice === 'days') return dayLabel();
    const p = cfg.periods.find(p => p.value === vals.specificPeriod);
    return p ? p.label : 'Select period';
  }
  if (vals.seriesChoice === 'series') return `series of ${vals.seriesDays} day${vals.seriesDays === 1 ? '' : 's'}`;
  return dayLabel();
}

/* Auto-suggestion des champs de recherche (physicien, tache — voir node
   21:496 : "If Jean T is written, Jean Tremblay will be displayed in the
   searchbox, type enter to select"). Prefixe insensible a la casse
   uniquement : au dela d'une simple demo, une correspondance floue serait
   plus une distraction qu'une aide. */
function computeGhostSuggestion(query, items) {
  if (!query) return null;
  const q = query.toLowerCase();
  const match = items.find(item => item.label.toLowerCase().startsWith(q));
  if (!match || match.label.length <= query.length) return null;
  return match;
}

/* Balisage initial. cfg = s.builder.components (groupes/gardes/periodes
   nommees, propres a ce widget) ; parentCfg = s.builder (physiciens/taches/
   contraintes/jours, partages avec le rule-builder juste au-dessus). */
function componentsShowcaseMarkup(cfg, parentCfg) {
  const d = componentsShowcaseDefaults(cfg, parentCfg);

  // Pas cbuild__field-chevron (position:absolute, ancree a .cbuild__field) :
  // les triggers ci-dessous n'ont pas ce wrapper, le chevron est un simple
  // enfant flex de .ccomp__trigger (voir justify-content:space-between,
  // styles.css).
  const fieldChevron = `<img class="ccomp__trigger-chevron" src="assets/icons/constraint-chevron-down.svg" alt="" aria-hidden="true" width="16" height="16">`;

  const searchBox = (role, placeholder) => `
    <div class="ccomp__search">
      <img class="ccomp__search-icon" src="assets/icons/constraint-search.svg" alt="" aria-hidden="true" width="14" height="14">
      <span class="ccomp__search-field">
        <input type="text" class="ccomp__search-input" data-role="${role}-search"
               placeholder="${escapeAttr(placeholder)}" autocomplete="off" aria-label="${escapeAttr(placeholder)}">
        <span class="ccomp__search-ghost" data-role="${role}-ghost" aria-hidden="true"></span>
      </span>
      <button type="button" class="ccomp__search-clear" data-role="${role}-clear" aria-label="Clear search" hidden>
        <img src="assets/icons/constraint-clear.svg" alt="" aria-hidden="true" width="14" height="14">
      </button>
    </div>`;

  // withCount : les onglets Physicians/Groups et Tasks/Shifts affichent le
  // nombre selectionne dans chaque liste (voir node 21:496, "if more than 2
  // ... a pill is displayed") ; Fixed period/Series n'a rien a compter, donc
  // pas de pastille pour ce couple-la.
  const tabs = (role, items, activeValue, withCount = true) => `
    <div class="ccomp__tabs" role="tablist">
      ${items.map(t => `
        <button type="button" class="ccomp__tab${t.value === activeValue ? ' is-active' : ''}"
                data-role="${role}-tab" data-value="${escapeAttr(t.value)}" aria-pressed="${t.value === activeValue}">
          ${withCount ? `<span class="ccomp__tab-count" data-role="${role}-tab-count-${escapeAttr(t.value)}">0</span>` : ''}${escapeAttr(t.label)}
        </button>`).join('')}
    </div>`;

  const stepper = (role, value, label) => `
    <span class="ccomp__stepper">
      <input type="text" inputmode="numeric" class="ccomp__stepper-input" data-role="${role}-stepper"
             value="${escapeAttr(value)}" aria-label="${escapeAttr(label)}">
      <span class="ccomp__stepper-arrows">
        <button type="button" class="ccomp__stepper-btn ccomp__stepper-btn--up" data-role="${role}-stepper-up" aria-label="Increase"></button>
        <button type="button" class="ccomp__stepper-btn ccomp__stepper-btn--down" data-role="${role}-stepper-down" aria-label="Decrease"></button>
      </span>
    </span>`;

  const radioRow = (group, value, label, checked) => `
    <button type="button" role="radio" class="ccomp__radio-row"
            data-role="${group}-radio" data-value="${escapeAttr(value)}" aria-checked="${checked}">
      <span class="ccomp__radio" aria-hidden="true"></span>
      <span>${escapeAttr(label)}</span>
    </button>`;

  const staticLink = (label) => `<span class="ccomp__static-link">+ ${escapeAttr(label)}</span>`;

  const dayButtonsHTML = (selected) => parentCfg.days.map(day => `
    <button type="button" class="cbuild__day${selected.includes(day.value) ? ' is-on' : ''}"
            data-day="${escapeAttr(day.value)}" aria-pressed="${selected.includes(day.value) ? 'true' : 'false'}">${escapeAttr(day.label)}</button>`).join('');

  const dayPicker = (prefix, selected) => `
    <button type="button" class="cbuild__select-all" data-role="${prefix}-select-all">${selected.length === parentCfg.days.length ? 'Unselect all' : 'Select all'}</button>
    <div class="cbuild__days" data-role="${prefix}-days" role="group" aria-label="Applicable days">${dayButtonsHTML(selected)}</div>`;

  /* ---- Physicians ---- */
  const physicianPanel = `
    <div class="ccomp__panel" data-role="physician-panel">
      <button type="button" class="cbuild__select cbuild__trigger ccomp__trigger" data-role="physician-trigger"
              aria-haspopup="true" aria-expanded="false" aria-controls="ccomp-physician-body">
        <span class="ccomp__trigger-value" data-role="physician-trigger-value">${physicianTriggerHTML(d, parentCfg, cfg)}</span>
        ${fieldChevron}
      </button>
      <div class="ccomp__body" id="ccomp-physician-body" data-role="physician-body" hidden>
        ${tabs('physician', [{ value: 'physician', label: 'Physicians' }, { value: 'group', label: 'Groups' }], d.physicianTab)}
        ${searchBox('physician', 'Search physicians')}
        <ul class="ccomp__list" data-role="physician-list" role="listbox" aria-label="Physicians">${taskCheckboxRows(parentCfg.physicians, d.physicians)}</ul>
        <ul class="ccomp__list" data-role="group-list" role="listbox" aria-label="Groups" hidden>${taskCheckboxRows(cfg.groups, d.groups)}</ul>
      </div>
    </div>`;

  /* ---- Constraint type : ici les 4 types se selectionnent vraiment (voir
     node 21:497, "Simple selectbox with hover state and selection on
     click") — contrairement au rule-builder ou seule "Limit" a une
     illustration a preserver. ---- */
  const selectedConstraint = parentCfg.constraints.find(c => c.value === d.constraint);
  const constraintPanel = `
    <div class="ccomp__panel" data-role="constraint-panel">
      <button type="button" class="cbuild__select cbuild__trigger ccomp__trigger" data-role="constraint-trigger"
              aria-haspopup="true" aria-expanded="false" aria-controls="ccomp-constraint-body">
        <span data-role="constraint-trigger-label">${escapeAttr(selectedConstraint.predicate)}</span>
        ${fieldChevron}
      </button>
      <div class="ccomp__body" id="ccomp-constraint-body" data-role="constraint-body" hidden>
        <ul class="ccomp__list" data-role="constraint-list" role="listbox" aria-label="Constraint type">${constraintOptionRows(parentCfg.constraints, d.constraint)}</ul>
      </div>
    </div>`;

  /* ---- Tasks ---- */
  const taskPanel = `
    <div class="ccomp__panel" data-role="task-panel">
      <button type="button" class="cbuild__select cbuild__trigger ccomp__trigger" data-role="task-trigger"
              aria-haspopup="true" aria-expanded="false" aria-controls="ccomp-task-body">
        <span class="ccomp__trigger-value" data-role="task-trigger-value">${taskTriggerHTML(d, parentCfg, cfg)}</span>
        ${fieldChevron}
      </button>
      <div class="ccomp__body" id="ccomp-task-body" data-role="task-body" hidden>
        <p class="ccomp__field-label">Tasks can be assigned ${stepper('task-count', d.taskCount, 'Maximum assignments')} times max in total</p>
        ${tabs('task', [{ value: 'task', label: 'Tasks' }, { value: 'shift', label: 'Shifts' }], d.taskTab)}
        ${searchBox('task', 'Search tasks')}
        <ul class="ccomp__list" data-role="task-list" role="listbox" aria-label="Tasks">${taskCheckboxRows(parentCfg.tasks, d.tasks)}</ul>
        <ul class="ccomp__list" data-role="shift-list" role="listbox" aria-label="Shifts" hidden>${taskCheckboxRows(cfg.shifts, d.shifts)}</ul>
      </div>
    </div>`;

  /* ---- Period : deux etats bascules par un pill (Fixed period / Series),
     chacun avec deux sous-choix a radio. Le picker de jours (node 21:501,
     "like in fixed periods") est duplique une fois par sous-choix "Specific
     day(s)" (fixe ET serie) plutot que deplace en DOM entre les deux — les
     deux instances partagent le meme etat `vals.days` et sont resynchronisees
     ensemble a chaque clic (voir setupComponentsShowcase). ---- */
  const fixedDaysOpen = d.fixedChoice === 'days';
  const fixedSpecificOpen = d.fixedChoice === 'specific';
  const seriesSeriesOpen = d.seriesChoice === 'series';
  const seriesDaysOpen = d.seriesChoice === 'days';
  const periodNamedRadios = cfg.periods.map(p => radioRow('period-named', p.value, p.label, p.value === d.specificPeriod)).join('');
  const periodPanel = `
    <div class="ccomp__panel" data-role="period-panel">
      <button type="button" class="cbuild__select cbuild__trigger ccomp__trigger" data-role="period-trigger"
              aria-haspopup="true" aria-expanded="false" aria-controls="ccomp-period-body">
        <span data-role="period-trigger-label">${escapeAttr(periodTriggerLabel(d, parentCfg, cfg))}</span>
        ${fieldChevron}
      </button>
      <div class="ccomp__body" id="ccomp-period-body" data-role="period-body" hidden>
        ${tabs('period-mode', [{ value: 'fixed', label: 'Fixed period' }, { value: 'series', label: 'Series' }], d.periodMode, false)}

        <div data-role="period-fixed-group"${d.periodMode === 'fixed' ? '' : ' hidden'}>
          <p class="ccomp__field-label">This limit applies to:</p>
          ${radioRow('period-fixed', 'days', 'Specific day(s)', fixedDaysOpen)}
          <div class="ccomp__nested" data-role="period-fixed-days-slot"${fixedDaysOpen ? '' : ' hidden'}>${dayPicker('period-fixed', d.days)}</div>
          ${radioRow('period-fixed', 'specific', 'Specific period', fixedSpecificOpen)}
          <div class="ccomp__nested" data-role="period-fixed-specific-slot"${fixedSpecificOpen ? '' : ' hidden'}>
            ${periodNamedRadios}
            <p class="ccomp__static-hint">To create a custom period, <span class="ccomp__static-inline">contact support</span>.</p>
            ${staticLink('Add a time slot')}
            ${staticLink('Add an exception')}
          </div>
        </div>

        <div data-role="period-series-group"${d.periodMode === 'series' ? '' : ' hidden'}>
          <p class="ccomp__field-label">This limit applies to:</p>
          ${radioRow('period-series', 'series', 'A series of days', seriesSeriesOpen)}
          <div class="ccomp__nested" data-role="period-series-slot"${seriesSeriesOpen ? '' : ' hidden'}>
            <p class="ccomp__field-label">This constraint will apply for ${stepper('period-series-days', d.seriesDays, 'Consecutive days')} consecutive days</p>
            ${staticLink('Add an exception')}
          </div>
          ${radioRow('period-series', 'days', 'Specific day(s)', seriesDaysOpen)}
          <div class="ccomp__nested" data-role="period-series-days-slot"${seriesDaysOpen ? '' : ' hidden'}>${dayPicker('period-series', d.days)}</div>
        </div>
      </div>
    </div>`;

  // .ccomp__frame reprend le traitement de .cbuild__frame (image de fond,
  // coins arrondis, padding) — mais avec la texture propre a la maquette
  // "Components" (node 52:1781, fichier "Claude-portfolio-image-generation"),
  // pas le degrade du rule-builder : les deux widgets viennent de deux
  // maquettes Figma distinctes avec chacune leur propre fond. Contrairement
  // a .cbuild__card (une seule carte blanche a 60%), les quatre panneaux
  // flottent ici directement sur le fond, comme dans la maquette source.
  return `
    <div class="ccomp" data-role="components-showcase">
      <div class="ccomp__frame">
        <div class="ccomp__grid">
          ${physicianPanel}
          ${taskPanel}
          ${constraintPanel}
          ${periodPanel}
        </div>
      </div>
      ${cfg.caption ? `<p class="cbuild__caption">${escapeAttr(cfg.caption)}</p>` : ''}
    </div>`;
}

/* Cablage d'un champ de recherche (physicien ou tache) : filtrage en direct
   de la liste visible + auto-suggestion (voir computeGhostSuggestion) + clic
   sur "x" pour vider. Les deux widgets qui l'utilisent (physicien, tache)
   partagent la meme mecanique — contrairement aux trois listbox du
   rule-builder ci-dessus, qui restent explicites plutot que factorisees. */
function setupSearchField({ input, ghost, clearBtn, getItems, onFilter, onAccept }) {
  const renderGhost = () => {
    const query = input.value;
    const suggestion = computeGhostSuggestion(query, getItems());
    if (!suggestion) { ghost.innerHTML = ''; return; }
    const rest = suggestion.label.slice(query.length);
    ghost.innerHTML = `<span class="ccomp__ghost-typed">${escapeAttr(query)}</span><span class="ccomp__ghost-rest">${escapeAttr(rest)}</span>`;
  };
  const clear = () => { input.value = ''; clearBtn.hidden = true; ghost.innerHTML = ''; onFilter(''); };

  const onInput = () => {
    clearBtn.hidden = !input.value;
    renderGhost();
    onFilter(input.value);
  };
  input.addEventListener('input', onInput);
  addCleanup(() => input.removeEventListener('input', onInput));

  // Enter accepte la suggestion affichee (node 21:496 : "type enter to
  // select") ; Tab fait de meme (sans en faire une exigence : si aucune
  // suggestion n'est affichee, Tab garde son comportement natif de
  // navigation au clavier, on ne bloque preventDefault que quand il y a
  // reellement quelque chose a completer). Escape vide le champ plutot que
  // de fermer tout le panneau — seul le clic exterieur (bindOutsideClose,
  // pose par l'appelant) ferme le panneau lui-meme.
  const onKeydown = (ev) => {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      const suggestion = computeGhostSuggestion(input.value, getItems());
      if (suggestion) { onAccept(suggestion); clear(); }
    } else if (ev.key === 'Tab') {
      const suggestion = computeGhostSuggestion(input.value, getItems());
      if (suggestion) { ev.preventDefault(); onAccept(suggestion); clear(); }
    } else if (ev.key === 'Escape') {
      clear();
    }
  };
  input.addEventListener('keydown', onKeydown);
  addCleanup(() => input.removeEventListener('keydown', onKeydown));

  const onClearClick = () => { clear(); input.focus(); };
  clearBtn.addEventListener('click', onClearClick);
  addCleanup(() => clearBtn.removeEventListener('click', onClearClick));
}

/* Cablage complet des quatre champs. */
function setupComponentsShowcase() {
  const root = $('[data-role="components-showcase"]');
  if (!root) return;

  const project = PROJECTS.find(p => p.slug === 'constraints');
  const parentCfg = project.sections.find(s => s.id === 'design').builder;
  const cfg = parentCfg.components;
  if (!cfg) return;
  const vals = componentsShowcaseDefaults(cfg, parentCfg);

  // Un declencheur + panneau generique : ouverture/fermeture, clic exterieur,
  // Escape. Chaque champ reste independant des trois autres (pas de
  // `closers` partage, contrairement au rule-builder) : la maquette Figma
  // montre les quatre panneaux ouverts simultanement.
  const setupPanel = (role) => {
    const trigger = $(`[data-role="${role}-trigger"]`, root);
    const body = $(`[data-role="${role}-body"]`, root);
    const close = () => { body.hidden = true; trigger.setAttribute('aria-expanded', 'false'); };
    const open = () => { body.hidden = false; trigger.setAttribute('aria-expanded', 'true'); };
    const onClick = () => { body.hidden ? open() : close(); };
    trigger.addEventListener('click', onClick);
    addCleanup(() => trigger.removeEventListener('click', onClick));
    const onKeydown = (ev) => { if (ev.key === 'Escape' && !body.hidden) { close(); trigger.focus(); } };
    body.addEventListener('keydown', onKeydown);
    addCleanup(() => body.removeEventListener('keydown', onKeydown));
    bindOutsideClose([trigger, body], close);
    return { trigger, body, close, open };
  };

  /* ---- Physicians ---- */
  (() => {
    setupPanel('physician');
    const triggerValue = $('[data-role="physician-trigger-value"]', root);
    const physicianTab = $('[data-role="physician-tab"][data-value="physician"]', root);
    const groupTab = $('[data-role="physician-tab"][data-value="group"]', root);
    const physicianList = $('[data-role="physician-list"]', root);
    const groupList = $('[data-role="group-list"]', root);
    const physicianCount = $('[data-role="physician-tab-count-physician"]', root);
    const groupCount = $('[data-role="physician-tab-count-group"]', root);
    const search = $('[data-role="physician-search"]', root);
    const ghost = $('[data-role="physician-ghost"]', root);
    const clearBtn = $('[data-role="physician-clear"]', root);

    const activeList = () => $$('li[role="option"]', vals.physicianTab === 'physician' ? physicianList : groupList);
    const activeSource = () => vals.physicianTab === 'physician' ? parentCfg.physicians : cfg.groups;
    const activeSelected = () => vals.physicianTab === 'physician' ? vals.physicians : vals.groups;

    const refresh = () => {
      triggerValue.innerHTML = physicianTriggerHTML(vals, parentCfg, cfg);
      physicianCount.textContent = String(vals.physicians.length);
      groupCount.textContent = String(vals.groups.length);
    };

    // Croix des pastilles (voir physicianTriggerHTML) : reconstruites a
    // chaque refresh() via innerHTML, donc ecoutees par delegation sur le
    // conteneur plutot que rebindees a chaque fois. stopPropagation
    // empeche le clic de remonter jusqu'au bouton .ccomp__trigger et de
    // rouvrir/refermer le panneau au lieu de juste vider la pastille.
    const onPillRemove = (scope) => {
      if (scope === 'physicians' || scope === 'all') vals.physicians = [];
      if (scope === 'groups' || scope === 'all') vals.groups = [];
      $$('li[role="option"]', physicianList).forEach(opt => opt.setAttribute('aria-selected', String(vals.physicians.includes(opt.dataset.value))));
      $$('li[role="option"]', groupList).forEach(opt => opt.setAttribute('aria-selected', String(vals.groups.includes(opt.dataset.value))));
      refresh();
    };
    const onTriggerValueClick = (ev) => {
      const remove = ev.target.closest('[data-pill-remove]');
      if (!remove) return;
      ev.stopPropagation();
      onPillRemove(remove.dataset.pillRemove);
    };
    const onTriggerValueKeydown = (ev) => {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      const remove = ev.target.closest('[data-pill-remove]');
      if (!remove) return;
      ev.preventDefault();
      ev.stopPropagation();
      onPillRemove(remove.dataset.pillRemove);
    };
    triggerValue.addEventListener('click', onTriggerValueClick);
    triggerValue.addEventListener('keydown', onTriggerValueKeydown);
    addCleanup(() => triggerValue.removeEventListener('click', onTriggerValueClick));
    addCleanup(() => triggerValue.removeEventListener('keydown', onTriggerValueKeydown));

    const toggleValue = (opt) => {
      const value = opt.dataset.value;
      const selected = activeSelected();
      const isOn = opt.getAttribute('aria-selected') === 'true';
      if (isOn) {
        // Le seuil minimal (au moins un coche) ne vaut que pour l'onglet
        // Physicians, qui demarre deja peuple (voir componentsShowcaseDefaults) :
        // Groups demarre vide, donc rien n'empeche de redescendre a zero.
        if (vals.physicianTab === 'physician' && selected.length <= 1) return;
        if (vals.physicianTab === 'physician') vals.physicians = vals.physicians.filter(v => v !== value);
        else vals.groups = vals.groups.filter(v => v !== value);
      } else {
        if (vals.physicianTab === 'physician') vals.physicians = [...vals.physicians, value];
        else vals.groups = [...vals.groups, value];
      }
      opt.setAttribute('aria-selected', String(!isOn));
      refresh();
    };

    [physicianList, groupList].forEach(list => {
      $$('li[role="option"]', list).forEach(opt => {
        const onClick = () => toggleValue(opt);
        opt.addEventListener('click', onClick);
        addCleanup(() => opt.removeEventListener('click', onClick));
      });
    });

    const switchTab = (tab) => {
      vals.physicianTab = tab;
      [physicianTab, groupTab].forEach(btn => {
        const active = btn.dataset.value === tab;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', String(active));
      });
      physicianList.hidden = tab !== 'physician';
      groupList.hidden = tab !== 'group';
      search.value = ''; clearBtn.hidden = true; ghost.innerHTML = '';
      filterList('');
      refresh();
    };
    [physicianTab, groupTab].forEach(btn => {
      const onClick = () => switchTab(btn.dataset.value);
      btn.addEventListener('click', onClick);
      addCleanup(() => btn.removeEventListener('click', onClick));
    });

    // Filtrage en direct (node 21:496 : "Names have to disappear in real
    // time based on the query written in the searchbox").
    const filterList = (query) => {
      const q = query.trim().toLowerCase();
      activeList().forEach(opt => {
        const label = opt.querySelector('.cbuild__opt-predicate').textContent.toLowerCase();
        opt.hidden = q.length > 0 && !label.includes(q);
      });
    };

    setupSearchField({
      input: search, ghost, clearBtn,
      getItems: activeSource,
      onFilter: filterList,
      onAccept: (item) => {
        const list = activeSelected();
        if (!list.includes(item.value)) {
          if (vals.physicianTab === 'physician') vals.physicians = [...vals.physicians, item.value];
          else vals.groups = [...vals.groups, item.value];
        }
        const opt = activeList().find(o => o.dataset.value === item.value);
        if (opt) opt.setAttribute('aria-selected', 'true');
        refresh();
      }
    });

    refresh();
  })();

  /* ---- Constraint type : selection reelle (voir node 21:497), contrairement
     au rule-builder ou seule "Limit" est reellement selectionnable. ---- */
  (() => {
    setupPanel('constraint');
    const triggerLabel = $('[data-role="constraint-trigger-label"]', root);
    const list = $('[data-role="constraint-list"]', root);
    const options = $$('li[role="option"]', list);

    options.forEach(opt => {
      const onClick = () => {
        vals.constraint = opt.dataset.value;
        options.forEach(o => o.setAttribute('aria-selected', String(o === opt)));
        const c = parentCfg.constraints.find(c => c.value === vals.constraint);
        triggerLabel.textContent = c.predicate;
      };
      opt.addEventListener('click', onClick);
      addCleanup(() => opt.removeEventListener('click', onClick));
    });
  })();

  /* ---- Tasks ---- */
  (() => {
    setupPanel('task');
    const triggerValue = $('[data-role="task-trigger-value"]', root);
    const taskTab = $('[data-role="task-tab"][data-value="task"]', root);
    const shiftTab = $('[data-role="task-tab"][data-value="shift"]', root);
    const taskList = $('[data-role="task-list"]', root);
    const shiftList = $('[data-role="shift-list"]', root);
    const taskCount = $('[data-role="task-tab-count-task"]', root);
    const shiftCount = $('[data-role="task-tab-count-shift"]', root);
    const search = $('[data-role="task-search"]', root);
    const ghost = $('[data-role="task-ghost"]', root);
    const clearBtn = $('[data-role="task-clear"]', root);
    const countInput = $('[data-role="task-count-stepper"]', root);
    const countUp = $('[data-role="task-count-stepper-up"]', root);
    const countDown = $('[data-role="task-count-stepper-down"]', root);

    const activeList = () => $$('li[role="option"]', vals.taskTab === 'task' ? taskList : shiftList);
    const activeSource = () => vals.taskTab === 'task' ? parentCfg.tasks : cfg.shifts;
    const activeSelected = () => vals.taskTab === 'task' ? vals.tasks : vals.shifts;

    const refresh = () => {
      triggerValue.innerHTML = taskTriggerHTML(vals, parentCfg, cfg);
      taskCount.textContent = String(vals.tasks.length);
      shiftCount.textContent = String(vals.shifts.length);
    };

    // Meme delegation que le panneau Physicians ci-dessus (voir le
    // commentaire pres de onTriggerValueClick).
    const onPillRemove = (scope) => {
      if (scope === 'tasks') vals.tasks = [];
      if (scope === 'shifts') vals.shifts = [];
      $$('li[role="option"]', taskList).forEach(opt => opt.setAttribute('aria-selected', String(vals.tasks.includes(opt.dataset.value))));
      $$('li[role="option"]', shiftList).forEach(opt => opt.setAttribute('aria-selected', String(vals.shifts.includes(opt.dataset.value))));
      refresh();
    };
    const onTriggerValueClick = (ev) => {
      const remove = ev.target.closest('[data-pill-remove]');
      if (!remove) return;
      ev.stopPropagation();
      onPillRemove(remove.dataset.pillRemove);
    };
    const onTriggerValueKeydown = (ev) => {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      const remove = ev.target.closest('[data-pill-remove]');
      if (!remove) return;
      ev.preventDefault();
      ev.stopPropagation();
      onPillRemove(remove.dataset.pillRemove);
    };
    triggerValue.addEventListener('click', onTriggerValueClick);
    triggerValue.addEventListener('keydown', onTriggerValueKeydown);
    addCleanup(() => triggerValue.removeEventListener('click', onTriggerValueClick));
    addCleanup(() => triggerValue.removeEventListener('keydown', onTriggerValueKeydown));

    const toggleValue = (opt) => {
      const value = opt.dataset.value;
      const selected = activeSelected();
      const isOn = opt.getAttribute('aria-selected') === 'true';
      if (isOn) {
        // Meme exception que pour Physicians/Groups ci-dessus : Shifts
        // demarre vide, donc pas de seuil minimal pour cet onglet.
        if (vals.taskTab === 'task' && selected.length <= 1) return;
        if (vals.taskTab === 'task') vals.tasks = vals.tasks.filter(v => v !== value);
        else vals.shifts = vals.shifts.filter(v => v !== value);
      } else {
        if (vals.taskTab === 'task') vals.tasks = [...vals.tasks, value];
        else vals.shifts = [...vals.shifts, value];
      }
      opt.setAttribute('aria-selected', String(!isOn));
      refresh();
    };

    [taskList, shiftList].forEach(list => {
      $$('li[role="option"]', list).forEach(opt => {
        const onClick = () => toggleValue(opt);
        opt.addEventListener('click', onClick);
        addCleanup(() => opt.removeEventListener('click', onClick));
      });
    });

    const switchTab = (tab) => {
      vals.taskTab = tab;
      [taskTab, shiftTab].forEach(btn => {
        const active = btn.dataset.value === tab;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', String(active));
      });
      taskList.hidden = tab !== 'task';
      shiftList.hidden = tab !== 'shift';
      search.value = ''; clearBtn.hidden = true; ghost.innerHTML = '';
      filterList('');
      refresh();
    };
    [taskTab, shiftTab].forEach(btn => {
      const onClick = () => switchTab(btn.dataset.value);
      btn.addEventListener('click', onClick);
      addCleanup(() => btn.removeEventListener('click', onClick));
    });

    const filterList = (query) => {
      const q = query.trim().toLowerCase();
      activeList().forEach(opt => {
        const label = opt.querySelector('.cbuild__opt-predicate').textContent.toLowerCase();
        opt.hidden = q.length > 0 && !label.includes(q);
      });
    };

    setupSearchField({
      input: search, ghost, clearBtn,
      getItems: activeSource,
      onFilter: filterList,
      onAccept: (item) => {
        const list = activeSelected();
        if (!list.includes(item.value)) {
          if (vals.taskTab === 'task') vals.tasks = [...vals.tasks, item.value];
          else vals.shifts = [...vals.shifts, item.value];
        }
        const opt = activeList().find(o => o.dataset.value === item.value);
        if (opt) opt.setAttribute('aria-selected', 'true');
        refresh();
      }
    });

    // Compteur "assigne au max N fois au total" : simple stepper +/- borne a
    // [1, 99], pas de saisie libre (coherent avec l'icone chevron haut/bas de
    // la maquette, sans champ editable a cote).
    const setCount = (n) => {
      vals.taskCount = Math.min(99, Math.max(1, n));
      countInput.value = String(vals.taskCount);
    };
    const onUp = () => setCount(vals.taskCount + 1);
    const onDown = () => setCount(vals.taskCount - 1);
    countUp.addEventListener('click', onUp);
    countDown.addEventListener('click', onDown);
    addCleanup(() => countUp.removeEventListener('click', onUp));
    addCleanup(() => countDown.removeEventListener('click', onDown));

    refresh();
  })();

  /* ---- Period ---- */
  (() => {
    setupPanel('period');
    const triggerLabel = $('[data-role="period-trigger-label"]', root);
    const refreshLabel = () => { triggerLabel.textContent = periodTriggerLabel(vals, parentCfg, cfg); };
    const modeTabs = $$('[data-role="period-mode-tab"]', root);
    const fixedGroup = $('[data-role="period-fixed-group"]', root);
    const seriesGroup = $('[data-role="period-series-group"]', root);

    const fixedDaysSlot = $('[data-role="period-fixed-days-slot"]', root);
    const fixedSpecificSlot = $('[data-role="period-fixed-specific-slot"]', root);
    const seriesSeriesSlot = $('[data-role="period-series-slot"]', root);
    const seriesDaysSlot = $('[data-role="period-series-days-slot"]', root);

    const fixedDaysRadio = $('[data-role="period-fixed-radio"][data-value="days"]', root);
    const fixedSpecificRadio = $('[data-role="period-fixed-radio"][data-value="specific"]', root);
    const seriesSeriesRadio = $('[data-role="period-series-radio"][data-value="series"]', root);
    const seriesDaysRadio = $('[data-role="period-series-radio"][data-value="days"]', root);

    // Deux instances du picker de jours (fixe/serie, voir componentsShowcaseMarkup)
    // partageant le meme `vals.days` : chaque clic met a jour les DEUX pour
    // qu'elles restent identiques meme si on bascule Fixed/Series entre deux
    // clics.
    const dayGroups = [
      { prefix: 'period-fixed', root: fixedDaysSlot },
      { prefix: 'period-series', root: seriesDaysSlot }
    ];
    const refreshDayPickers = () => {
      dayGroups.forEach(({ prefix, root: slot }) => {
        $$('.cbuild__day', slot).forEach(btn => {
          const on = vals.days.includes(btn.dataset.day);
          btn.classList.toggle('is-on', on);
          btn.setAttribute('aria-pressed', String(on));
        });
        const selectAll = $(`[data-role="${prefix}-select-all"]`, slot);
        if (selectAll) selectAll.textContent = vals.days.length === parentCfg.days.length ? 'Unselect all' : 'Select all';
      });
    };
    dayGroups.forEach(({ prefix, root: slot }) => {
      $$('.cbuild__day', slot).forEach(btn => {
        const onClick = () => {
          const day = btn.dataset.day;
          vals.days = vals.days.includes(day) ? vals.days.filter(v => v !== day) : [...vals.days, day];
          refreshDayPickers();
          refreshLabel();
        };
        btn.addEventListener('click', onClick);
        addCleanup(() => btn.removeEventListener('click', onClick));
      });
      const selectAll = $(`[data-role="${prefix}-select-all"]`, slot);
      const onSelectAll = () => {
        const allOn = vals.days.length === parentCfg.days.length;
        vals.days = allOn ? [] : parentCfg.days.map(d => d.value);
        refreshDayPickers();
        refreshLabel();
      };
      selectAll.addEventListener('click', onSelectAll);
      addCleanup(() => selectAll.removeEventListener('click', onSelectAll));
    });

    // Periode nommee (Week A / Week B / Custom range) : simple radio, pas de
    // contenu supplementaire a reveler (contrairement aux deux radios
    // "Specific day(s)"/"A series of days").
    $$('[data-role="period-named-radio"]', root).forEach(btn => {
      const onClick = () => {
        vals.specificPeriod = btn.dataset.value;
        $$('[data-role="period-named-radio"]', root).forEach(o => o.setAttribute('aria-checked', String(o === btn)));
        refreshLabel();
      };
      btn.addEventListener('click', onClick);
      addCleanup(() => btn.removeEventListener('click', onClick));
    });

    const setFixedChoice = (choice) => {
      vals.fixedChoice = choice;
      fixedDaysRadio.setAttribute('aria-checked', String(choice === 'days'));
      fixedSpecificRadio.setAttribute('aria-checked', String(choice === 'specific'));
      fixedDaysSlot.hidden = choice !== 'days';
      fixedSpecificSlot.hidden = choice !== 'specific';
      refreshLabel();
    };
    const onFixedDaysClick = () => setFixedChoice('days');
    const onFixedSpecificClick = () => setFixedChoice('specific');
    fixedDaysRadio.addEventListener('click', onFixedDaysClick);
    fixedSpecificRadio.addEventListener('click', onFixedSpecificClick);
    addCleanup(() => fixedDaysRadio.removeEventListener('click', onFixedDaysClick));
    addCleanup(() => fixedSpecificRadio.removeEventListener('click', onFixedSpecificClick));

    const setSeriesChoice = (choice) => {
      vals.seriesChoice = choice;
      seriesSeriesRadio.setAttribute('aria-checked', String(choice === 'series'));
      seriesDaysRadio.setAttribute('aria-checked', String(choice === 'days'));
      seriesSeriesSlot.hidden = choice !== 'series';
      seriesDaysSlot.hidden = choice !== 'days';
      refreshLabel();
    };
    const onSeriesSeriesClick = () => setSeriesChoice('series');
    const onSeriesDaysClick = () => setSeriesChoice('days');
    seriesSeriesRadio.addEventListener('click', onSeriesSeriesClick);
    seriesDaysRadio.addEventListener('click', onSeriesDaysClick);
    addCleanup(() => seriesSeriesRadio.removeEventListener('click', onSeriesSeriesClick));
    addCleanup(() => seriesDaysRadio.removeEventListener('click', onSeriesDaysClick));

    const switchMode = (mode) => {
      vals.periodMode = mode;
      modeTabs.forEach(btn => {
        const active = btn.dataset.value === mode;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', String(active));
      });
      fixedGroup.hidden = mode !== 'fixed';
      seriesGroup.hidden = mode !== 'series';
      refreshLabel();
    };
    modeTabs.forEach(btn => {
      const onClick = () => switchMode(btn.dataset.value);
      btn.addEventListener('click', onClick);
      addCleanup(() => btn.removeEventListener('click', onClick));
    });

    // Stepper "N jours consecutifs" (etat serie), meme mecanique que le
    // compteur d'assignations du panneau Tasks.
    const seriesDaysInput = $('[data-role="period-series-days-stepper"]', root);
    const seriesDaysUp = $('[data-role="period-series-days-stepper-up"]', root);
    const seriesDaysDown = $('[data-role="period-series-days-stepper-down"]', root);
    const setSeriesDays = (n) => {
      vals.seriesDays = Math.min(99, Math.max(1, n));
      seriesDaysInput.value = String(vals.seriesDays);
      refreshLabel();
    };
    const onSeriesUp = () => setSeriesDays(vals.seriesDays + 1);
    const onSeriesDown = () => setSeriesDays(vals.seriesDays - 1);
    seriesDaysUp.addEventListener('click', onSeriesUp);
    seriesDaysDown.addEventListener('click', onSeriesDown);
    addCleanup(() => seriesDaysUp.removeEventListener('click', onSeriesUp));
    addCleanup(() => seriesDaysDown.removeEventListener('click', onSeriesDown));

    refreshDayPickers();
  })();
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
            <li><a href="#/#work">${escapeAttr(d.navWork)}</a></li>
            <li><a href="#/#side">${escapeAttr(d.navSide)}</a></li>
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
    if (route.name === 'case') setupMoreDrawerEmbeds();
    if (route.name === 'case' && route.project.slug === 'constraints') setupConstraintBuilder();
    if (route.name === 'case' && route.project.slug === 'constraints') setupComponentsShowcase();
    if (route.name === 'case' && route.project.slug === 'constraints') setupLottieCarousel();
    if (route.name === 'case' && route.project.slug === 'services-exclusion') setupImageCarousel();
    if (route.name === 'case' && route.project.slug === 'services-exclusion') setupExclModal();
    setupScrollProgress();
    setupVideos();
    setupZoomableMedia();
  };

  // Transition de page. startViewTransition est l'API moderne : le navigateur
  // photographie l'ancien et le nouvel etat et interpole entre les deux.
  // `updateCallbackDone` est la promesse tenue une fois le DOM remplace —
  // c'est notre signal pour lancer afterSwap sans risque.
  // Deux gestionnaires (pas juste .then) : si une navigation arrive pendant
  // qu'une transition precedente est encore en cours, le navigateur ANNULE
  // celle-ci et son updateCallbackDone est REJETEE (InvalidStateError),
  // meme si swap() s'est deja execute. Sans gestionnaire de rejet, afterSwap
  // ne tourne alors jamais : plus aucun ecouteur ne se rattache sur la page
  // (widget, clic exterieur, etc.) jusqu'a la prochaine navigation reussie —
  // c'etait la cause d'interactions qui semblaient marcher "par intermittence".
  if (document.startViewTransition && !prefersReducedMotion()) {
    document.startViewTransition(swap).updateCallbackDone.then(afterSwap, afterSwap);
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

/* --head-h (styles.css) n'est qu'une approximation par point de rupture
   (82px bureau / 72px mobile) : des qu'un navigateur rend l'en-tete un peu
   plus haut (police, marge du systeme...), .cs-nav — qui se colle a
   top: var(--head-h) en mobile, sans marge supplementaire contrairement a la
   version bureau — se decolle visuellement de la barre du haut. Un
   ResizeObserver ecrit donc la VRAIE hauteur mesuree dans --head-h (variable
   inline sur <html>, qui l'emporte sur les valeurs de styles.css), une fois
   pour toutes au demarrage plutot qu'a chaque changement de page : #site-head
   n'est jamais remplace par le routeur, seul <main> l'est. */
function syncHeadHeight() {
  const head = $('#site-head');
  if (!head) return;
  const sync = () => document.documentElement.style.setProperty('--head-h', `${head.offsetHeight}px`);
  new ResizeObserver(sync).observe(head);
  sync();
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
  const map = { home: 'home', case: route.project?.kind, about: 'about', gap: null };
  const current = map[route.name] ?? null;
  $$('.site-nav a[data-nav]').forEach(a => {
    if (a.dataset.nav === current) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

/* Le lien retour persistant : visible seulement sur les pages de detail.
   Sa destination est deduite du type de projet, pour revenir a la bonne
   liste plutot que systematiquement a l'accueil. Masque sur une etude de cas
   AVEC nav laterale (hasProcess) : cette page a deja son propre lien retour
   integre a .cs-nav (voir pageCase()) — garder le bouton flottant en plus
   ferait doublon. */
function setupBackLink(route) {
  const link = $('#back-link');
  const hasOwnBackLink = route.name === 'case' && (route.project.sections || []).length > 0;
  const deep = ['case', 'about', 'gap'].includes(route.name) && !hasOwnBackLink;
  link.hidden = !deep;
  if (!deep) return;
  link.href = route.name === 'case' ? `#/#${route.project.kind}` : '#/';
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

/* .zoomable-media (posee par item.imageAfterZoomable dans content.js pour
   l'instant, mais reutilisable sur n'importe quelle image du site — voir le
   commentaire dans styles.css) : clic pour zoomer, cadre qui devient
   scrollable, inspire du meme effet sur l'ancien portfolio (marvinsrd.com,
   .img-container.old — clic sur l'image passe sa largeur de 100% a 230%, et
   le cadre en overflow:auto devient scrollable pour la parcourir). Toggle
   simple plutot qu'un vrai lightbox plein ecran. */
function setupZoomableMedia() {
  const thumbs = $$('.zoomable-media');
  if (!thumbs.length) return;

  thumbs.forEach(thumb => {
    // .zoomable-media--mobile-only (voir zoomableClass() dans app.js) : cette
    // image ne doit zoomer que sous 700px. Verifie a chaque clic (pas une
    // fois au chargement) via matchMedia plutot que cote CSS — s'adapte tout
    // seul si la fenetre est redimensionnee.
    const mobileOnly = thumb.classList.contains('zoomable-media--mobile-only');
    // Glisser-deplacer horizontal une fois zoomee (souris desktop — le
    // tactile a deja le scroll natif d'overflow:auto). `dragged` distingue
    // un vrai drag d'un simple clic : sans lui, le moindre glissement
    // rebasculerait aussi le zoom via onClick ci-dessous.
    let startX = 0, startScrollLeft = 0, dragging = false, dragged = false;

    const onPointerDown = e => {
      if (!thumb.classList.contains('is-zoomed')) return;
      // stopPropagation : une image zoomable peut vivre dans un carrousel au
      // glissement propre (setupSwipe() sur .cs-carousel__track) — sans ca,
      // le meme pointerdown ferait aussi demarrer le swipe de panneau au
      // niveau du track, qui prend ensuite le pointer capture a sa place (le
      // dernier appel gagne), cassant le glisser-deplacer du zoom. Une fois
      // zoomee, le geste doit rester au zoom : le carrousel ne doit pas
      // changer de panneau tant qu'on n'a pas dezoome.
      e.stopPropagation();
      dragging = true;
      dragged = false;
      startX = e.clientX;
      startScrollLeft = thumb.scrollLeft;
      thumb.setPointerCapture(e.pointerId);
    };
    const onPointerMove = e => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) dragged = true;
      thumb.scrollLeft = startScrollLeft - dx;
    };
    const onPointerUp = () => { dragging = false; };
    const onClick = () => {
      // Un vrai drag ne doit pas aussi fermer le zoom au relachement.
      if (dragged) { dragged = false; return; }
      // Hors mobile : pas de zoom du tout, mais on laisse quand meme
      // dezoomer si jamais deja zoomee (ex. fenetre redimensionnee pendant
      // que l'image etait zoomee).
      if (mobileOnly && !thumb.classList.contains('is-zoomed') && !window.matchMedia('(max-width: 700px)').matches) return;
      // Pas de reset de scrollLeft ici : au dezoom apres un glisser-deplacer,
      // ca forcerait un saut instantane vers le bord gauche juste avant/pendant
      // la transition de largeur, donnant l'impression d'un zoom-IN (nouveau
      // cadrage soudain) plutot que le retrecissement attendu. Le navigateur
      // reclampe deja scrollLeft en continu pendant la transition width a
      // mesure que scrollWidth retrecit vers clientWidth — l'image revient
      // donc naturellement a 0 en fin d'anim, sans a-coup. Au zoom-IN,
      // scrollLeft est deja a 0 (rien a faire defiler avant que la largeur ne
      // depasse 100%), donc rien a reinitialiser de ce cote non plus.
      thumb.classList.toggle('is-zoomed');
    };

    thumb.addEventListener('pointerdown', onPointerDown);
    thumb.addEventListener('pointermove', onPointerMove);
    thumb.addEventListener('pointerup', onPointerUp);
    thumb.addEventListener('pointercancel', onPointerUp);
    thumb.addEventListener('click', onClick);
    addCleanup(() => {
      thumb.removeEventListener('pointerdown', onPointerDown);
      thumb.removeEventListener('pointermove', onPointerMove);
      thumb.removeEventListener('pointerup', onPointerUp);
      thumb.removeEventListener('pointercancel', onPointerUp);
      thumb.removeEventListener('click', onClick);
    });
  });
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
  // #sec-overview (l'en-tete) est traite comme la premiere "section" du
  // scroll-spy au meme titre que les .cs-sec du processus — querySelectorAll
  // renvoie les elements dans l'ordre du DOM, donc il arrive naturellement
  // en tete de liste sans tri supplementaire (voir pageCase()).
  const secs = $$('#sec-overview, .cs-sec');
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

const VISITOR_KEY = 'visitor';
const VISITOR_TTL = 60 * 60 * 1000; // 1h

/* Relit le prenom stocke, s'il existe et n'a pas expire. Toujours repasse
   par cleanName() : ce qui sort du stockage est traite avec la meme
   mefiance que ce qui sort du formulaire. */
function readStoredVisitor() {
  try {
    const raw = localStorage.getItem(VISITOR_KEY);
    if (!raw) return '';
    const { v, exp } = JSON.parse(raw);
    if (!exp || Date.now() > exp) {
      localStorage.removeItem(VISITOR_KEY);
      return '';
    }
    return cleanName(v || '');
  } catch {
    return '';                 // stockage indisponible (mode prive, quota...) : tant pis
  }
}

function writeStoredVisitor(name) {
  try {
    localStorage.setItem(VISITOR_KEY, JSON.stringify({ v: name, exp: Date.now() + VISITOR_TTL }));
  } catch {
    /* stockage indisponible : le prenom reste en memoire pour cette page,
       simplement redemande au prochain rechargement. */
  }
}

function setupGate() {
  const gate  = $('#gate');
  const form  = $('#gate-form');
  const input = $('#gate-input');
  const error = $('#gate-error');
  const skip  = $('#gate-skip');

  const open = () => {
    // Prenom encore valide (< 1h) : on l'applique directement, sans
    // rouvrir le portail.
    const stored = readStoredVisitor();
    if (stored) {
      state.visitor = stored;
      render();
      return;
    }

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
    state.visitor = capitalize(value);
    writeStoredVisitor(state.visitor);           // survit au rechargement, 1h
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

  syncHeadHeight();

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
