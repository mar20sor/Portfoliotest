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

  /* Le balayage lime qui presente le prenom doit jouer UNE FOIS, au retour du
     portail, et jamais aux rendus suivants — or l'accueil est reconstruit a
     chaque retour d'etude de cas. Un drapeau a usage unique : setupGate() le
     leve a la validation, renderHello() le baisse en le consommant. */
  helloReveal: false,
  cleanup: [],       // fonctions a rappeler quand on quitte une page (voir addCleanup)

  /* --- Ouverture des etudes de cas "en fiche" (voir section 7 bis) --- */
  snap: false,       // une photo de la page precedente attend-elle dans #underlay ?
  snapKey: null,     // la route d'ou vient cette photo (pour savoir ou revenir)
  snapY: 0,          // la position de defilement qu'avait cette page
  sheetTimer: null,  // le minuteur de l'animation en cours
  pending: null,     // la page a dessiner une fois l'animation de fermeture finie

  /* --- Scroll-spy de l'en-tete (voir setupHomeNavSpy, section 8 bis) ---
     La section d'accueil surlignee dans la pilule. Il vit ICI et non dans la
     fonction parce qu'il doit SURVIVRE au demontage de la page : on ouvre une
     etude de cas, l'accueil est detruit, et au retour on doit pouvoir rallumer
     la bonne entree avant meme d'avoir mesure quoi que ce soit. */
  navSpy: null
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
  const resume = $('#nav-resume');
  if (resume) resume.href = SITE.links.resume;
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
  g: { bg: '#FFFFFF', fg: '#0C4CA8', sub: 'rgba(12,76,168,.7)'   },
  /* #10233F est le --ink du theme clair, pas une teinte de plus : c'est le
     seul fond de la liste assez sombre pour que le lime y respire. NE PAS
     revenir a #2078F0 ici — c'est exactement le bleu de la page d'accueil,
     et l'affiche s'y fondait, sans bord visible (essaye, et corrige). */
  h: { bg: '#10233F', fg: '#BEF007', sub: 'rgba(255,255,255,.66)'}
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
    case 'clave':   // la clave 3-2 : deux mesures de huit croches, cinq frappes.
                    // C'est le motif rythmique sur lequel la salsa est ecrite ;
                    // les temps joues sont pleins, les autres a peine poses.
      return [[0, 3, 6], [2, 4]].map((hits, row) =>
        Array.from({ length: 8 }, (_, i) => {
          const on = hits.includes(i);
          return `<circle cx="${246 + i * 15}" cy="${158 + row * 32}" r="${on ? 6 : 3}"
                          fill="${s}" opacity="${on ? .95 : .25}"/>`;
        }).join('')).join('');
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
   La maquette place le prenom AU MILIEU de la phrase : "Nice to meet you
   [prenom]!". On assemble donc trois morceaux, et le prenom est pose avec
   textContent. Meme si state.visitor contenait du HTML, il s'afficherait
   comme du texte brut. */
function renderHello() {
  const d = t();
  const wrap = el('p', { class: 'hero__hello' });
  if (state.visitor) {
    /* Le balayage de presentation (styles.css section 6). Le drapeau est
       consomme ICI et non a la saisie parce que c'est cette ligne-ci qui joue
       l'animation : si le portail a ete valide depuis une etude de cas (lien
       partage, rechargement en profondeur), le geste attend sagement le
       premier affichage de l'accueil au lieu d'etre perdu. */
    if (state.helloReveal) {
      wrap.classList.add('is-revealing');
      state.helloReveal = false;
    }
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
      if (seg.to)          node = el('a', { href: seg.to, class: 'u-arrow-link' });
      else if (seg.href)   node = el('a', { href: seg.href, target: '_blank', rel: 'noopener noreferrer', class: 'u-arrow-link' });
      else if (seg.accent) node = el('span', { class: 'accent' });
      else                 node = document.createTextNode(seg.t);

      if (node.tagName === 'A') {
        // Le mot vit dans un span dedie : voir .u-arrow-link dans styles.css
        // (soulignement estompe -> plein au survol, jamais pose sur l'ancre
        // elle-meme).
        node.append(el('span', { text: seg.t }));
        // Lien externe (Gekko) : fleche apres le mot, signale qu'il quitte
        // le site — meme icone que le reste du site (arrowUpRightIcon).
        if (seg.href) {
          const icon = el('span', { class: 'u-arrow-link__icon', 'aria-hidden': 'true' });
          icon.innerHTML = arrowUpRightIcon('');
          node.append(icon);
        }
        // Classe(s) supplementaire(s) propres a un segment (voir seg.class
        // dans content.js — ex. l'experiment Petal ci-dessous).
        if (seg.class) node.classList.add(...seg.class.split(' '));
      } else if (node.nodeType !== 3) {
        node.textContent = seg.t;
      }
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
   et seules les balises <b>/<a> que nous fabriquons nous-memes subsistent.
   Le lien markdown accepte soit une URL externe (http/https, ouverte dans un
   nouvel onglet), soit une route interne du site (#/..., ex. Yabara/Overview
   vers l'article `gap`) — celle-ci navigue dans le meme onglet, comme
   n'importe quel <a href="#/..."> : le routeur ecoute `hashchange`
   globalement, aucun handler dedie n'est necessaire ici. */
function emphasize(str) {
  // Meme soulignement estompe -> plein au survol que le heros, partout ou un
  // lien markdown apparait dans un corps de texte (gists, ledes, listes).
  // Un lien EXTERNE recoit en plus la fleche animee (.u-arrow-link, deux
  // spans) : il quitte le site. Un lien INTERNE (#/...) reste .u-underline
  // seul, comme les entrees du plan du site.
  // arrowUpRightIcon() (voir plus bas) renvoie un <svg> ecrit sur plusieurs
  // lignes pour rester lisible dans le code — donc avec de vrais "\n"
  // dedans. Le remplacement '\n' -> '<br>' doit tourner AVANT qu'on injecte
  // cette icone, jamais apres : sinon il retombe aussi sur les "\n" internes
  // au <svg> et le decoupe en <br> au milieu d'un attribut, cassant le
  // balisage (vu en prod : "Dylan" affichait le code source de la fleche).
  const icon = arrowUpRightIcon('');
  return escapeAttr(str)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    // '\n' a l'interieur d'un seul paragraphe (voir Hoot/Exploration) : garde
    // plusieurs phrases visuellement distinctes sans en faire des <p> separes.
    .replace(/\n/g, '<br>')
    .replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, (m, label, href) =>
      `<a class="u-arrow-link" href="${href}" target="_blank" rel="noopener"><span>${label}</span><span class="u-arrow-link__icon" aria-hidden="true">${icon}</span></a>`)
    .replace(/\[(.+?)\]\((#\/[^\s)]*)\)/g, '<a class="u-underline" href="$2">$1</a>');
}

/* ---- 5c. La page d'accueil ----
   Reproduit la maquette : un heros de 400px cale au centre, puis la grille
   des projets. Le bloc de texte du heros est entierement construit par le
   code (pas de gabarit HTML), parce qu'il melange du contenu variable — le
   prenom du visiteur — a des liens et des mots accentues. */
function pageHome() {
  const d = t(), h = HERO;
  /* .home ne sert a rien ICI : elle sert de temoin a <body>, que styles.css
     interroge en `body:has(.home)` pour poser le quadrillage de fond sur la
     hauteur entiere du document (section 6). Le marqueur vit sur la page
     plutot que sur <body> pour que paint() n'ait pas une classe de plus a
     poser et — surtout — a penser a retirer. */
  const page = el('div', { class: 'home' });

  /* --- Le heros ---
     sec-hello est pose ICI, sur la section, et non sur le paragraphe "Hey ..."
     qu'il designait d'abord. C'est la cible du nom dans l'en-tete, et le nom
     doit ramener TOUT EN HAUT de l'accueil.

     scrollToSection vise "le haut de l'element moins l'en-tete moins 24px",
     ce qui est juste pour une section au milieu d'une page et faux pour la
     premiere : le paragraphe commence 70px sous le heros, on atterrissait
     donc a 46px du sommet, assez pour qu'on voie que quelque chose manque en
     haut. Le heros, lui, commence exactement sous l'en-tete : le meme calcul
     donne -24, que le Math.max(0, ...) de scrollToSection ramene a 0. Le
     sommet, sans cas particulier a ecrire. */
  const hero = el('section', { class: 'hero', id: 'sec-hello' });
  const wrap = el('div', { class: 'wrap' });
  const text = el('div', { class: 'hero__text' });

  const block = el('div', { class: 'hero__block' });
  const lines = el('div', { class: 'hero__lines' });
  lines.append(el('p', { class: 'hero__name', text: h.name }));
  lines.append(renderStatement(h.statement));

  // Le lien vers l'article sur les deux ans, avec sa fleche — meme icone
  // (arrowUpRightIcon) que les liens externes des etudes de cas, masquee
  // aux lecteurs d'ecran puisqu'elle n'apporte rien a l'oral.
  const gap = el('a', { class: 'hero__gap u-arrow-link gap-experiment', href: '#/gap' });
  const gapArrow = el('span', { class: 'u-arrow-link__icon', 'aria-hidden': 'true' });
  gapArrow.innerHTML = arrowRightIcon('');
  gap.append(gapArrow, el('span', { text: h.gapLink }));

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
    const grid = el('div', { class: kind === 'side' ? 'cards cards--side' : 'cards' });
    list.forEach(p => grid.append(projectCard(p)));
    w.append(grid);
    sec.append(w);
    page.append(sec);
  }
  return page;
}

/* Le tableau de post-its par categorie (voir b.postitBoard dans content.js,
   ex. Hoot/Analysis, le brainstorming des fonctionnalites) — reprend les
   couleurs et le texte de .postit-board sur la page source (marvinsrd.com/
   en/hoot-project), une colonne par axe. L'entree y "volait" litteralement
   en place au defilement (Webflow IX2, un point de depart different et
   fige par post-it) : les valeurs exactes ne sont pas reproductibles sans
   son moteur d'interactions, donc chaque post-it tire ICI son propre angle/
   distance/rotation au hasard (voir --fly-x/--fly-y/--fly-r, consommees par
   .cs-mini-postit dans styles.css) — un point de depart different a chaque
   chargement plutot qu'une poignee de decalages copies sans en comprendre
   la logique. */
function postitBoardMarkup(board) {
  return `<div class="cs-postit-board">${board.columns.map(col => `
    <div class="cs-postit-col">
      <p class="cs-postit-col__title">${escapeAttr(col.title)}</p>
      ${col.items.map((item, i) => {
        const angle = Math.random() * Math.PI * 2;
        const dist = 90 + Math.random() * 140;
        const flyX = Math.round(Math.cos(angle) * dist);
        const flyY = Math.round(Math.sin(angle) * dist);
        const flyR = Math.round((Math.random() - 0.5) * 40);
        return `
        <div class="cs-mini-postit" style="background:${escapeAttr(col.color)}; transition-delay:${i * 60}ms; --fly-x:${flyX}px; --fly-y:${flyY}px; --fly-r:${flyR}deg">
          <p>${escapeAttr(item)}</p>
        </div>`;
      }).join('')}
    </div>`).join('')}</div>`;
}

/* Une ligne de temps : suite d'etapes reliees par un trait continu (ex.
   Licence management/Solution) — voir .cs-timeline dans styles.css.
   `thumb: false` sur une entree permet d'omettre son placeholder gris.
   Fonction plutot que gabarit en ligne dans pageCase() : une section peut en
   afficher DEUX (sa ligne principale, puis celle d'un bloc `after` — voir
   s.after), et chacune doit rester un trait a part, pas la suite de l'autre.
   Chaque entree accepte aussi la forme objet `{ image, zoomable }` quand elle a
   besoin de la classe .zoomable-media (voir zoomableClass()) — une chaine
   simple reste rendue telle quelle, sans zoom. */
function timelineMarkup(items) {
  return `<div class="cs-timeline">${items.map(item => `
    <div class="cs-timeline__row${item.image ? ' cs-timeline__row--figure' : ''}${item.tight ? ' cs-timeline__row--tight' : ''}${item.noLine ? ' cs-timeline__row--no-line' : ''}">
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
            ? `<ul class="cs-timeline__constraints${item.constraintsLoose ? ' cs-timeline__constraints--loose' : ''}${item.constraintsDark ? ' cs-timeline__constraints--dark' : ''}">${item.constraints.map(c => `
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
    </div>`).join('')}</div>`;
}

/* ---- 5e. Une etude de cas ----
   Structure : en-tete "30 secondes", puis grille [nav laterale | sections],
   puis lien vers le projet suivant. */
function pageCase(project, caseId) {
  const d = t();
  // Projet fusionne (branche petal-merged-projects, voir content.js) : `c`
  // devient le cas actif plutot que le projet lui-meme ; tout le reste de
  // cette fonction continue de ne lire que `c` et ne voit donc aucune
  // difference. Pour un projet ordinaire (sans `cases`), `c` reste `project`
  // exactement comme avant.
  const c = project.cases
    ? (project.cases.find(x => x.slug === caseId)
        || project.cases.find(x => x.slug === project.defaultCase)
        || project.cases[0])
    : project;
  const page = el('article', { class: 'cs' });

  // La route de cette page. Les liens vers les sections s'ecrivent
  // `base + '#' + id` : ce sont donc de VRAIS liens, qui fonctionnent aussi
  // en ouverture dans un nouvel onglet ou en copier-coller. Le JS ne fait
  // qu'ameliorer le comportement (defilement doux) — il n'est pas requis.
  // Pour un projet fusionne, le cas actif s'ajoute en 3e segment.
  const base = project.cases
    ? `#/${project.kind}/${project.slug}/${c.slug}`
    : `#/${project.kind}/${project.slug}`;

  /* --- En-tete : l'essentiel, lisible sans scroller --- */
  const head = el('header', { class: 'cs__head' });
  const hw = el('div', { class: 'wrap' });

  const stats = (c.stats || []).map(s =>
    `<div class="stat"><div class="stat__n">${escapeAttr(s.n)}</div>
     <div class="stat__l">${escapeAttr(s.l)}</div></div>`).join('');

  const hasProcess = (c.sections || []).length > 0;

  // Intro + selecteur d'un projet fusionne (project.cases, content.js).
  // Sortis dans des variables : quand hasProcess, ils quittent .cs__head
  // pour devenir des enfants directs de .cs__content (voir plus bas) — leur
  // bloc englobant y couvre alors TOUTE la hauteur de la page (en-tete +
  // sections), ce qui laisse .cs__case-switch (position:sticky) rester
  // colle en haut sur tout le defilement, pas seulement le long de l'en-tete.
  const casesIntroHTML = project.casesIntro
    ? `<p class="cs__cases-intro">${infoIcon('cs__cases-intro-icon')}<span class="cs__cases-intro-text">${emphasize(project.casesIntro)}</span></p>` : '';
  const caseSwitchHTML = project.cases
    ? `<nav class="cs__case-switch" aria-label="${escapeAttr(d.csCaseSwitch)}">
        ${project.cases.map(cs => `
          <a class="cs__case-tab${cs.slug === c.slug ? ' is-active' : ''}"
             href="#/${escapeAttr(project.kind)}/${escapeAttr(project.slug)}/${escapeAttr(cs.slug)}"
             ${cs.slug === c.slug ? 'aria-current="page"' : ''}>${escapeAttr(cs.navLabel)}</a>`).join('')}
      </nav>` : '';

  // `hideOverviewHeadings` (voir bible-app dans content.js) : pour un projet
  // qui n'a qu'un paragraphe de contexte, pas un vrai probleme/resultat, les
  // etiquettes "Overview"/"Problem" et la grille a deux colonnes de .pair
  // n'ont rien a annoncer — un paragraphe simple suffit.
  // white-space: pre-line laisse un \n dans le texte source (content.js)
  // devenir un saut de ligne visuel sans casser le <p> en deux paragraphes.
  const overview = !(c.problem || c.outcome) ? '' : c.hideOverviewHeadings
    ? `<p class="cs__overview-intro" style="white-space:pre-line">${emphasize(c.problem || c.outcome)}</p>`
    : `<h2 class="cs-sec__title">${escapeAttr(d.csOverview)}</h2>
    <div class="pair">
      ${c.problem ? `<div><h2 class="cs-sec__headline">${escapeAttr(d.csProblem)}</h2><p>${escapeAttr(c.problem)}</p></div>` : ''}
      ${c.outcome ? `<div class="pair__out"><h2 class="cs-sec__headline">${escapeAttr(d.csOutcome)}</h2><p>${escapeAttr(c.outcome)}</p></div>` : ''}
    </div>`;

  hw.insertAdjacentHTML('beforeend', `
    ${!hasProcess ? casesIntroHTML : ''}
    ${!hasProcess ? caseSwitchHTML : ''}
    ${c.isDraft ? `<p style="margin-bottom:var(--s4)"><span class="draft-badge">${escapeAttr(d.draftBadge)}</span></p>` : ''}
    ${(c.gist && c.gist.company) || c.hideClient ? '' : `<p class="cs__client">${escapeAttr(c.client)}</p>`}
    <h1 class="cs__title">${escapeAttr(c.title)}</h1>
    <p class="cs__tagline">${emphasize(c.tagline)}</p>

    ${c.heroMedia ? `<div class="cs__hero-media" data-slug="${escapeAttr(c.slug)}">${mediaMarkup(c.heroMedia)}</div>` : ''}

    ${c.gist ? `<dl class="gist">
      ${c.gist.company && c.gist.company.href ? `<div><dt>${escapeAttr(d.csCompany)}</dt><dd>${extArrowLinkHTML(c.gist.company.label, c.gist.company.href)}</dd></div>` : ''}
      <div><dt>${escapeAttr(d.csRole)}</dt><dd>${escapeAttr(c.gist.role)}</dd></div>
      <div><dt>${escapeAttr(d.csDuration)}</dt><dd>${escapeAttr(c.gist.duration)}</dd></div>
      <div><dt>${escapeAttr(d.csTeam)}</dt><dd>${emphasize(c.gist.team)}</dd></div>
      ${c.gist.tools ? `<div><dt>${escapeAttr(d.csTools)}</dt><dd>${escapeAttr(c.gist.tools)}</dd></div>` : ''}
    </dl>` : ''}

    <!-- L'etiquette de l'apercu, posee ICI et non tout en haut de l'en-tete :
         ce qui la precede (client, titre, accroche, media, fiche d'identite)
         identifie l'etude de cas elle-meme — c'est la couverture, pas une
         section. L'apercu proprement dit commence a Probleme / Resultat /
         Impacts, et c'est ce groupe-la que l'etiquette annonce, exactement
         comme "Process" annonce la section suivante. -->
    ${overview}

    ${stats ? `<h2 class="stats__title cs-sec__headline">${escapeAttr(d.csImpacts)}</h2><div class="stats">${stats}</div>` : ''}

    <div class="cs__cta">
      ${(c.extLinks || []).map(l =>
        `<a class="btn btn--ghost" href="${escapeAttr(l.href)}" target="_blank" rel="noopener noreferrer">
           ${escapeAttr(l.label)} ${arrowUpRightIcon('btn__icon')}</a>`).join('')}
      ${project.external ? `<a class="btn btn--primary" href="${escapeAttr(project.external)}"
           target="_blank" rel="noopener noreferrer">${escapeAttr(d.seeProject)} ${arrowUpRightIcon('btn__icon')}</a>` : ''}
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
    // Les entrees ne sont plus numerotees, ni ici ni dans les titres de
    // section (voir content.js) : l'ordre est deja porte par le <ol>, et le
    // rail de progression a gauche de la liste dit ou l'on en est. Reste un
    // seul detail de balisage, et il n'existe que pour le mobile (sous 1000px
    // la nav devient la barre flottante du bas — styles.css §12) :
    //
    //   .cs-nav__sprog  la progression PROPRE A LA SECTION en cours, soulignant
    //                l'entree active (demande de la maquette : "each active
    //                section its own progressbar"). Masquee sur le bureau, qui
    //                garde .cs-nav__prog, la progression d'ensemble.
    //   .cs-nav__pill  le conteneur de la pilule mobile : l'anneau de
    //                progression PUIS la liste. Il existe parce que le <ol> EST
    //                le conteneur de defilement — tout ce qu'on y met defile
    //                avec les entrees. L'anneau doit rester plante a gauche,
    //                donc il est son voisin, pas son enfant, et c'est ce
    //                conteneur qui porte le verre. Sur le bureau il est annule
    //                (display: contents, styles.css §8b) : ses enfants
    //                redeviennent des elements de la grille de .cs-nav, qui
    //                n'a donc rien a savoir de son existence.
    //   .cs-nav__ring  l'anneau lui-meme (maquette Figma, noeud 295:2356). Deux
    //                cercles superposes ; pathLength="1" sur celui du dessus
    //                rend le motif de tirets FRACTIONNAIRE, donc updateProgress
    //                ecrit "0.62 1" sans avoir a calculer 2*PI*r.
    const nav = el('nav', { class: 'cs-nav', 'aria-label': d.csSections });
    nav.innerHTML = `
      <a class="cs-nav__back" href="#/#${escapeAttr(c.kind)}"><span aria-hidden="true">${arrowLeftIcon('cs-nav__back-icon')}</span>${escapeAttr(d.csBack)}</a>
      <div class="cs-nav__pill">
        <span class="cs-nav__ring" role="progressbar" aria-valuemin="0" aria-valuemax="100"
              aria-valuenow="0" aria-label="${escapeAttr(d.csProgress)}">
          <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
            <circle class="cs-nav__ring-track" cx="10" cy="10" r="8"/>
            <circle class="cs-nav__ring-bar" id="cs-ring" cx="10" cy="10" r="8"
                    pathLength="1" stroke-dasharray="0 1"/>
          </svg>
        </span>
        <ol>
          <li><a href="${base}#overview" data-spy="sec-overview">
            <span>${escapeAttr(d.csOverview)}</span>
            <span class="cs-nav__sprog" aria-hidden="true"><span class="cs-nav__sbar"></span></span>
          </a></li>
          ${c.sections.map(s => `
            <li><a href="${base}#${escapeAttr(s.id)}" data-spy="sec-${escapeAttr(s.id)}">
              <span>${escapeAttr(s.label)}</span>
              <span class="cs-nav__sprog" aria-hidden="true"><span class="cs-nav__sbar"></span></span>
            </a></li>`).join('')}
        </ol>
      </div>
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

    // Intro + selecteur d'un projet fusionne (project.cases) : ENFANTS
    // DIRECTS de `body` (.wrap wrap--wide), places AVANT `grid` — donc
    // au-dessus des DEUX colonnes (nav laterale + contenu), pas seulement
    // de la colonne de contenu. Deux raisons :
    //   1. Largeur : .cs__case-switch doit couvrir toute la largeur de la
    //      fiche (demande explicite, "images derriere" visibles au bord sinon)
    //      — .wrap--wide annule le max-width, `body` est donc aussi large
    //      que `grid` (nav + contenu ensemble), la ou .cs__content seul
    //      n'est que la colonne de droite.
    //   2. Collant sur toute la hauteur : le bloc englobant d'un element
    //      position:sticky est la boite de son PARENT DIRECT. `body` ne
    //      contient que [intro, switch, grid] : sa hauteur = celle de
    //      `grid` (qui s'etire pour egaler .cs__content, en-tete + sections)
    //      + celle, negligeable, de l'intro/switch — donc encore assez haute
    //      pour que .cs__case-switch reste colle sur tout le defilement.
    // .cs__head garde son padding-top normal (var(--s6)) plutot que le
    // supplement "degager la croix" (var(--s7), styles.css) — ce role
    // revient a `body`, seul a etre au sommet de la page.
    if (project.cases) {
      if (casesIntroHTML) body.insertAdjacentHTML('beforeend', casesIntroHTML);
      body.insertAdjacentHTML('beforeend', caseSwitchHTML);
      body.style.paddingTop = 'var(--s7)';
      head.style.paddingTop = 'var(--s6)';
    }
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
      // t.body est soit une chaine simple (rendue telle quelle dans <dd>,
      // \n devient un saut de ligne visuel via white-space:pre-line — meme
      // mecanique que .cs__overview-intro), soit un objet { intro, list,
      // outro } quand la definition a besoin d'une sous-liste a puces (ex.
      // Licence management/Administrators) — meme convention que
      // drawerBodyParagraph() plus bas, mais les trois morceaux restent DANS
      // le meme <dd> (une seule definition) plutot que des <p> separes.
      const termBody = b => typeof b === 'string' ? escapeAttr(b)
        : `${escapeAttr(b.intro)}${b.list ? `<ul class="cs-sec__list">${b.list.map(li => `<li>${escapeAttr(li)}</li>`).join('')}</ul>` : ''}${b.outro ? escapeAttr(b.outro) : ''}`;
      const termsBlock = s.terms
        ? `<div class="cs-sec__terms">${s.terms.items.map(t =>
            `<dl class="cs-sec__term"><dt>${escapeAttr(t.term)}</dt><dd>${termBody(t.body)}</dd></dl>`).join('')}</div>`
        : '';
      // s.figureAfter : une figure locale (webp/png ou svg, via figureFor())
      // inseree apres le paragraphe d'index `after` — comme s.terms mais
      // pour une image plutot qu'un bloc terme/definition (ex. Licence
      // management/Before, la capture de l'ancienne page de modification).
      // Accepte soit un objet unique, soit un tableau (ex. Admin model : une
      // figure apres le 1er paragraphe, une autre apres le 2e).
      const figuresAfterList = s.figureAfter
        ? (Array.isArray(s.figureAfter) ? s.figureAfter : [s.figureAfter]) : [];

      // s.bulletsAfter : meme principe que s.figureAfter, mais pour une
      // liste a puces plutot qu'une figure (ex. Fit-Plans/Process, les
      // constats d'audit puis les chiffres du sondage, chacun apres son
      // propre paragraphe d'intro). s.bullets reste la liste unique en tete
      // de section ; celle-ci s'intercale au fil du corps.
      const bulletsAfterList = s.bulletsAfter
        ? (Array.isArray(s.bulletsAfter) ? s.bulletsAfter : [s.bulletsAfter]) : [];

      // s.brandsAfter : meme principe que s.bulletsAfter, mais pour une
      // rangee de logos plutot qu'une liste a puces (ex. Hoot/Exploration,
      // les logos des concurrents benchmarkes juste apres le paragraphe qui
      // les annonce). `items` est une liste de noms de fichier, sans
      // extension, sous assets/img/brand-<name>.webp.
      const brandsAfterList = s.brandsAfter
        ? (Array.isArray(s.brandsAfter) ? s.brandsAfter : [s.brandsAfter]) : [];

      /* Les paragraphes, avec les medias intercales aux positions indiquees
         par `s.media`. La cle de cet objet est l'index du paragraphe apres
         lequel le groupe doit s'afficher — c'est ce qui permet de reproduire
         l'ordre exact d'une page source sans decouper la section. */
      const parts = s.body.map((p, i) => {
        const bulletsAfter = bulletsAfterList.filter(b => b.after === i)
          .map(b => `<ul class="cs-sec__list">${b.items.map(item => `<li>${emphasize(item)}</li>`).join('')}</ul>`).join('');
        const brands = brandsAfterList.filter(b => b.after === i)
          .map(b => `<div class="cs-brands">${b.items.map(item => {
            const name = typeof item === 'string' ? item : item.name;
            const gray = typeof item === 'object' && item.gray ? ' cs-brands__gray' : '';
            return `<img class="${gray.trim()}" src="assets/img/brand-${name}.webp" alt="${escapeAttr(name)}" loading="lazy" decoding="async">`;
          }).join('')}</div>`).join('');
        const after = s.media && s.media[i] ? mediaGroup(s.media[i]) : '';
        const terms = s.terms && s.terms.after === i ? termsBlock : '';
        // Plusieurs figureAfter partageant le meme `after` : cote a cote via
        // .media-grid (meme classe que mediaGroup() ci-dessus), au lieu de
        // s'empiler comme des <figure> independantes.
        const figuresHere = figuresAfterList.filter(f => f.after === i);
        const figure = figuresHere.length > 1
          ? `<div class="media-grid">${figuresHere.map(figureFor).join('')}</div>`
          : figuresHere.map(figureFor).join('');
        // s.numbered : { [paragraphIndex]: n } — accole une pastille
        // numerotee violette (meme style que .cs-timeline__constraint-num)
        // au paragraphe, pour faire echo a un numero deja present dans une
        // figure juste au-dessus (ex. Admin model, pastille "1" de la
        // capture Figma reprise ici sur le paragraphe qui l'explique).
        const num = s.numbered && s.numbered[i];
        /* Un paragraphe prefixe de ## ou ### n'en est pas un : c'est un titre
           intercale dans le corps de la section (ex. Licence management/
           Context, qui enchaine deux sous-parties).
             ##   la grosse ligne, comme s.headline (.cs-sec__headline)
             ###  l'etiquette, comme un titre de section (.cs-sec__title)
           Moins de diese = plus gros, comme en Markdown.
           Un prefixe dans le texte plutot qu'une table {index: titre} a cote :
           les cles par index (s.media, s.numbered) se decalent toutes des
           qu'on insere un paragraphe, un prefixe voyage avec sa ligne.
           <h3> dans les deux cas : ce sont de vrais sous-titres de la section,
           et le niveau ne doit pas dependre de la taille choisie. */
        const heading = p.match(/^(#{2,3})\s+/);
        const paragraph = heading
          ? `<h3 class="${heading[1] === '##' ? 'cs-sec__headline' : 'cs-sec__title'}">${
              emphasize(p.slice(heading[0].length))}</h3>`
          : num
            ? `<div class="cs-sec__num-row"><span class="cs-sec__num" aria-hidden="true">${num}</span><p>${emphasize(p)}</p></div>`
            : `<p>${emphasize(p)}</p>`;
        // s.rowMedia : { [paragraphIndex]: true } — au lieu d'empiler le
        // media sous son paragraphe (defaut), les deux se rangent cote a
        // cote, media a gauche, texte a droite cale au milieu de sa hauteur
        // (ex. Fit-Plans/Process, le resultat du sondage a cote du
        // paragraphe qui l'introduit). Reutilise .cs-sec__row, deja la pour
        // s.aside, avec une colonne media plutot qu'un encart teinte —
        // --media-left en modificateur pour l'ordre et le centrage vertical,
        // propres a ce cas (s.aside reste flex-start, texte en haut).
        if (s.rowMedia && s.rowMedia[i]) {
          return `<div class="cs-sec__row cs-sec__row--media-left">
              <div class="cs-sec__row-media">${after}</div>
              <div class="cs-sec__row-text">${paragraph}${bulletsAfter}</div>
            </div>${terms}${figure}`;
        }
        return `${paragraph}${bulletsAfter}${brands}${after}${terms}${figure}`;
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
      // VOIR timelineMarkup() PLUS HAUT — le gabarit vit la, pas ici.
      // s.timeline : suite d'etapes en ligne de temps (ex. Licence
      // management/Solution) — voir .cs-timeline dans styles.css.
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
      const timeline = s.timeline ? timelineMarkup(s.timeline) : '';

      /* s.after : blocs rattaches a la fin de la section — un sous-titre, du
         texte, et au besoin leur propre ligne de temps.
         Sert a replier une etape dans une autre sans perdre sa structure : le
         modele d'administration de Licence management etait une section a lui
         seul, il vit maintenant dans Solution, avec son titre en sous-titre et
         sa ligne de temps toujours distincte de celle qui la precede.
         Un bloc et non des paragraphes ajoutes a s.body : le corps se rend
         AVANT la ligne de temps de la section, un texte qui doit la suivre n'y
         a donc pas sa place. */
      // b.postits : cartes "post-it" mauves et pivotees (ex. Hoot/Exploration,
      // les 3 constats du sondage) — reprend telle quelle la palette et la
      // rotation de la page source (marvinsrd.com/en/hoot-project), donc sa
      // propre classe plutot que .cs-sec__card (generique, utilisee ailleurs
      // pour des cartes neutres — ex. les 4 principes de Constraints/design).
      // b.note : bloc de texte seul sur fond violet (ex. Hoot/Design,
      // "Meal Ordering" — equivalent du slider_subcontent de la page source,
      // meme habillage que le texte des panneaux du carrousel juste au-dessus
      // — voir .cs-hoot-note dans styles.css) ; b.panel : la meme chose mais
      // avec une image a cote (ex. "Activities"/Programme.png, equivalent de
      // img-container ui programmes — voir .cs-hoot-panel).
      const after = (s.after || []).map(b => `
        ${b.headline ? `<h3 class="cs-sec__headline">${escapeAttr(b.headline)}</h3>` : ''}
        ${(b.body || []).map(p => `<p>${emphasize(p)}</p>`).join('')}
        ${b.media ? mediaGroup(b.media) : ''}
        ${b.postits ? `<div class="cs-postits">${b.postits.map(card => `
            <div class="cs-postit">
              <p class="cs-postit__title">${escapeAttr(card.title)}</p>
              <p class="cs-postit__body">${escapeAttr(card.body)}</p>
            </div>`).join('')}</div>` : ''}
        ${b.postitBoard ? postitBoardMarkup(b.postitBoard) : ''}
        ${b.note ? `<div class="cs-hoot-note">
            <p class="cs-hoot-note__label">${escapeAttr(b.note.label || '')}</p>
            <p class="cs-hoot-note__text">${escapeAttr(b.note.text || '')}</p>
          </div>` : ''}
        ${b.panel ? `<figure class="cs-hoot-panel">
            <div class="cs-hoot-panel__media${zoomableClass(b.panel.zoomable)}">
              <img src="${escapeAttr(b.panel.src)}" alt="${escapeAttr(b.panel.label || '')}" loading="lazy" decoding="async">
            </div>
            <div class="cs-hoot-panel__content">
              <p class="cs-hoot-panel__label">${escapeAttr(b.panel.label || '')}</p>
              <p class="cs-hoot-panel__text">${escapeAttr(b.panel.text || '')}</p>
            </div>
          </figure>` : ''}
        ${b.cta ? `<div class="cs-hoot-cta">
            <p class="cs-hoot-cta__statement">${escapeAttr(b.cta.statement)}</p>
            <p class="cs-hoot-cta__text">${escapeAttr(b.cta.text)}</p>
            <a class="btn btn--ghost" href="${escapeAttr(b.cta.href)}" target="_blank" rel="noopener noreferrer">${escapeAttr(b.cta.label)} ${arrowUpRightIcon('btn__icon')}</a>
          </div>` : ''}
        ${b.timeline ? timelineMarkup(b.timeline) : ''}`).join('');
      // Chiffres cites dans le texte, sortis en cartes (voir s.stats dans
      // content.js) — meme balisage que les .stat d'en-tete, en plus petit.
      const secStats = s.stats
        ? `<div class="stats stats--sec">${s.stats.map(x =>
            `<div class="stat"><div class="stat__n">${escapeAttr(x.n)}</div>
             <div class="stat__l">${escapeAttr(x.l)}</div></div>`).join('')}</div>` : '';
      // Le carrousel des 4 illustrations animees (voir s.lottieCarousel dans
      // content.js). Rendu en fin de section, apres le texte et les widgets —
      // il n'est pas indexe par paragraphe comme les media[].
      // Etait auparavant imbrique dans un bloc `helpers` (un sous-titre en
      // <h3> au sein de la section Solution). Ces illustrations ont maintenant
      // leur propre section, donc le sous-titre a disparu et le carrousel se
      // rend seul.
      const lottie = s.lottieCarousel ? lottieCarouselMarkup(s.lottieCarousel) : '';

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

      // s.cta : bouton externe au fil du texte (ex. masters-essay/Download,
      // "Read the essay" juste apres le paragraphe qui l'annonce) — a la
      // difference de c.extLinks (rendu dans l'en-tete de la fiche), celui-ci
      // reste attache a la section et au paragraphe qui le motive. Meme
      // composant .btn que partout ailleurs (icone arrowUpRightIcon animee
      // au survol via .btn__icon).
      const cta = s.cta
        ? `<div class="cs-sec__cta"><a class="btn btn--ghost" href="${escapeAttr(s.cta.href)}" target="_blank" rel="noopener noreferrer">${escapeAttr(s.cta.label)} ${arrowUpRightIcon('btn__icon')}</a></div>` : '';

      // s.result : encart teinte {title, text} isolant un constat court en
      // fin de section (ex. Licence management/Context) — meme famille
      // visuelle que .cs-sec__term/.cs-sec__aside, mais un champ dedie
      // plutot qu'une rangee. `text` passe par emphasize() : demande
      // explicite, tel mot precis en gras (**role**/**right**) plutot que la
      // phrase entiere. Voir .cs-result dans styles.css.
      const result = s.result
        ? `<div class="cs-result"><p class="cs-result__title">${escapeAttr(s.result.title)}</p><p class="cs-result__text">${emphasize(s.result.text)}</p></div>` : '';

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
        ? `<div class="cs-sec__media-pair">${figureFor(s)}${carouselMarkup(s.carousel, s.carouselOpts)}</div>`
        : `${s.image ? figureFor(s) : ''}${s.carousel ? carouselMarkup(s.carousel, s.carouselOpts) : ''}`;

      // s.headline : une seconde ligne de titre, en grosse typo, sous le
      // .cs-sec__title devenu sur-titre (ex. Services exclusion/Context).
      // Optionnelle : la plupart des sections se contentent de leur titre.
      const headline = s.headline
        ? `<p class="cs-sec__headline">${escapeAttr(s.headline)}</p>` : '';

      const title = s.title
        ? `<h2 class="cs-sec__title">${escapeAttr(s.title)}</h2>` : '';

      sec.innerHTML = `
        ${title}
        ${headline}
        ${intro}
        ${list}
        ${bullets}
        ${partsBlock}
        ${cta}
        ${result}
        ${callout}
        ${secStats}
        ${mockups}
        ${timeline}
        ${mediaBlock}
        ${afterFigure}
        ${s.builder ? constraintBuilderMarkup(s.builder) : ''}
        ${s.builder && s.builder.components ? componentsShowcaseMarkup(s.builder.components, s.builder) : ''}
        ${s.modal ? exclModalMarkup(s.modal) : ''}
        ${lottie}
        ${after}
        ${s.moreDrawer ? moreDrawerMarkup(s.moreDrawer) : ''}`;
      secs.append(sec);
    });
    content.append(secs);

    // Bouton "Retour en haut" : a la fin du processus, plutot que de forcer
    // un long defilement remonte (ou de compter sur la nav laterale, hors
    // champ sur mobile a ce stade). Vrai lien vers l'ancre #overview (voir
    // head.id = 'sec-overview' plus haut) : le defilement doux vient du
    // scroll-behavior global (styles.css), pas de JS dedie.
    const topArrow = el('span', { 'aria-hidden': 'true' });
    topArrow.innerHTML = arrowUpIcon('cs-back-to-top__icon');
    content.append(el('a', { class: 'cs-back-to-top', href: `${base}#overview` },
      [topArrow, document.createTextNode(d.backToTop)]));

    grid.append(nav, content);
    body.append(grid);
    page.append(body);
  } else {
    page.append(head);
  }

  const foot = nextProjectsFooter(project);
  // wrap--wide (essai, retour possible) : aligne .cs-next sur .cs__content
  // au lieu des deux colonnes ensemble (nav laterale + contenu) — meme bord
  // droit que .cs__content (gouttiere seule, sans le max-width de .wrap), et
  // .cs-next se decale ensuite lui-meme via margin-left: --cs-nav-inset (voir
  // styles.css, meme mecanique que .cs__cases-intro). Seulement si hasProcess
  // : sans nav laterale, --cs-nav-inset decalerait le bloc dans le vide.
  if (foot && hasProcess) foot.classList.add('wrap--wide');
  if (foot) page.append(foot);

  return page;
}

/* --- Pied : les autres projets ---
   Trois suggestions plutot qu'une seule : arrive au bas d'une etude de cas,
   un recruteur qui a aime doit avoir un choix, pas un couloir.

   On pioche dans TOUS les projets, pas seulement ceux de la meme categorie,
   ce qui garantit d'en trouver trois meme pour les projets "a cote" qui ne
   sont que deux. L'operateur % (modulo) fait tourner la liste en boucle :
   apres le dernier, on revient au premier.

   Sorti de pageCase() pour que pageArticle() (5e ter) rende exactement le
   meme pied : c'est aussi le point d'arret du rail de progression et de la
   barre flottante du mobile, qui cherchent tous deux `.cs-next` — un projet
   qui ne l'aurait pas retomberait silencieusement sur le bas du document.
   Rend null quand il n'y a rien a proposer (un seul projet dans PROJECTS) ;
   l'appelant teste. */
function nextProjectsFooter(project) {
  const d = t();
  const NEXT_COUNT = 3;
  const others = [];
  const startAt = PROJECTS.findIndex(p => p.slug === project.slug);
  for (let i = 1; others.length < NEXT_COUNT && i < PROJECTS.length; i++) {
    others.push(PROJECTS[(startAt + i) % PROJECTS.length]);
  }
  if (!others.length) return null;

  const foot = el('div', { class: 'wrap' });
  const box  = el('div', { class: 'cs-next' });
  box.append(el('p', { class: 'kicker cs-next__kicker', text: d.csNext }));

  // On reutilise la carte de la page d'accueil : meme composant, donc un
  // seul endroit a maintenir si la carte evolue. Ses couleurs suivent le
  // theme de la page grace aux variables CSS.
  const grid = el('div', { class: 'cards cards--next' });
  others.forEach(p => grid.append(projectCard(p)));
  // Essai, retour possible : meme effet magnetique que les cartes de
  // l'accueil (setupMagneticCards()), memes valeurs (6/4/5). Attache ici et
  // non via un appel du routeur : nextProjectsFooter() fabrique des <div>
  // neufs a chaque rendu (jamais reutilisees), donc pas besoin de cleanup —
  // les anciens noeuds et leurs ecouteurs partent simplement au ramasse-
  // miettes avec eux, comme .foot-magnetic dans le pied de page.
  if (!prefersReducedMotion()) {
    grid.querySelectorAll('.card').forEach(a => attachMagneticTilt(a, { maxX: 6, maxY: 5 }));
  }
  box.append(grid);
  foot.append(box);
  return foot;
}

/* ---- 5e ter. Un projet rendu comme un ARTICLE --------------------------
   Pour un projet qui porte `format: 'article'` dans content.js (aujourd'hui
   la seule side quest "Documenting salsa dance"). Ce n'est pas une etude de
   cas : il n'y a ni fiche d'identite, ni Probleme/Resultat, ni processus
   decoupe en etapes, donc ni nav laterale ni barre flottante. C'est un texte
   illustre — la forme de PAGES.gap ("Why I didn't work for 2 years"), mais
   ouvert depuis une carte comme n'importe quel autre projet.

   CE QUI RESTE COMMUN AUX ETUDES DE CAS, ET POURQUOI :
   - la route (`#/side/<slug>`) et donc `route.name === 'case'` : la page
     s'ouvre en fiche par-dessus l'accueil, sur fond blanc, avec la croix de
     fermeture. Un projet qui s'ouvrirait en page pleine depuis la meme
     grille serait la seule carte du site a se comporter autrement ;
   - `.cs` sur la racine et `.cs__head` sur l'en-tete : meme rythme vertical,
     meme degagement sous la croix, meme titre que les autres fiches ;
   - `.cs-next` en pied (nextProjectsFooter) : c'est aussi ce que cherchent
     setupScrollProgress() et updateNavRetreat() pour savoir ou la lecture
     s'arrete.

   CE QUI CHANGE : le corps est une liste de blocs { h, p, media }, lus dans
   cet ordre et sans aucune indexation croisee. Un media se declare DANS son
   bloc, jamais par un numero de paragraphe — c'est volontaire : les etudes
   de cas indexent leurs medias par position (`s.media[i]`), et inserer un
   paragraphe y decale tout silencieusement (voir CLAUDE.md). Ici, deplacer
   du texte ne peut pas desynchroniser une image. Pour poser un media avant
   le texte, on ecrit simplement un bloc qui n'a que `media`. */
function pageArticle(project) {
  const d = t(), c = project;
  const page = el('article', { class: 'cs cs--article' });

  /* --- En-tete : client, titre, accroche, media d'ouverture --- */
  const head = el('header', { class: 'cs__head' });
  const hw = el('div', { class: 'wrap wrap--narrow' });
  hw.insertAdjacentHTML('beforeend', `
    ${c.isDraft ? `<p style="margin-bottom:var(--s4)"><span class="draft-badge">${escapeAttr(d.draftBadge)}</span></p>` : ''}
    <p class="cs__client">${escapeAttr(c.client)}</p>
    <h1 class="cs__title">${escapeAttr(c.title)}</h1>
    ${c.lede ? `<p class="cs__tagline">${emphasize(c.lede)}</p>` : ''}
    ${c.heroMedia && !c.hideHeroInArticle ? `<div class="article__hero">${mediaMarkup(c.heroMedia)}</div>` : ''}
    <div class="cs__cta">
      ${(c.extLinks || []).map(l =>
        `<a class="btn btn--ghost" href="${escapeAttr(l.href)}" target="_blank" rel="noopener noreferrer">
           ${escapeAttr(l.label)} ${arrowUpRightIcon('btn__icon')}</a>`).join('')}
    </div>
    ${c.draftNote ? `<p class="todo" style="margin-top:var(--s6)">${escapeAttr(c.draftNote)}</p>` : ''}`);
  head.append(hw);
  page.append(head);

  /* --- Corps : les blocs, dans l'ordre --- */
  const bw = el('div', { class: 'wrap wrap--narrow' });
  bw.insertAdjacentHTML('beforeend', (c.blocks || []).map(b => `
    <section class="article__block">
      ${b.h ? `<h2>${escapeAttr(b.h)}</h2>` : ''}
      ${(b.p || []).map(par => {
        /* Meme convention que pageEditorial() : un paragraphe entierement
           entre crochets est une consigne de redaction, pas du contenu. Il
           s'affiche en jaune pour qu'on ne le publie pas par distraction. */
        if (typeof par === 'object') {
          // { intro, list, outro? } : une liste a puces au milieu d'un
          // paragraphe (voir termBody plus haut) — un div plutot qu'un <p>
          // car <ul> n'est pas un contenu valide dans <p>.
          return `<div class="article__p">${escapeAttr(par.intro)}${
            par.list ? `<ul class="cs-sec__list">${par.list.map(li => `<li>${escapeAttr(li)}</li>`).join('')}</ul>` : ''
          }${par.outro ? escapeAttr(par.outro) : ''}</div>`;
        }
        const isTodo = /^\[.*\]$/s.test(par.trim());
        return isTodo
          ? `<p class="todo">${escapeAttr(par)}</p>`
          : `<p>${emphasize(par)}</p>`;
      }).join('')}
      ${articleTerms(b.terms)}
      ${mediaGroup(b.media)}
      ${beatSyncMarkup(b.beatSync)}
    </section>`).join(''));
  page.append(bw);

  /* Meme pied que les etudes de cas, mais ramene a la colonne etroite de
     l'article : nextProjectsFooter() rend un .wrap (1280px) alors que tout ce
     qui precede tient dans un .wrap--narrow (860px). Sans cette ligne, les
     cartes "projet suivant" commencent 200px a gauche du premier mot. */
  const foot = nextProjectsFooter(project);
  if (foot) { foot.classList.add('wrap--narrow'); page.append(foot); }

  return page;
}

/* Le glossaire d'un bloc d'article : `terms` = [{ term, body, media?, sub? }].
   Un <dl> VERTICAL, un terme par ligne — deliberement pas .cs-sec__terms, qui
   est un flex horizontal de 2-3 cartes teintees (Licence management). Ici la
   liste en compte cinq, aux definitions longues : en colonnes elles seraient
   illisibles, et cinq aplats de couleur d'affilee ecraseraient le texte
   autour. D'ou le filet a gauche plutot qu'un fond.

   `sub` imbrique UN seul niveau (les quatre facettes de "Body possibilities"),
   rendu en <dl> dans le <dd> parent — c'est du HTML valide et c'est ce que la
   structure dit vraiment : une definition qui se subdivise. Pas de recursion
   au-dela : deux niveaux suffisent a ce texte, et une profondeur libre
   inviterait une hierarchie qu'un article ne devrait pas avoir.

   `media` vit DANS le <dd>, pas apres la liste. Chaque concept de l'article
   salsa a son schema (timing, lignes, pas, hauteurs de tour...) : les poser
   apres le glossaire donnerait neuf figures d'affilee sans plus rien pour
   dire laquelle illustre quoi. C'est la raison d'etre de ce champ — sans lui
   il aurait fallu casser le glossaire en un bloc par concept, et perdre la
   hierarchie que la liste porte. Meme forme que `media` sur un bloc. */
function articleTerms(terms) {
  if (!terms || !terms.length) return '';
  const rows = list => list.map(t => `
    <dt>${emphasize(t.term)}</dt>
    <dd>${emphasize(t.body)}${mediaGroup(t.media)}${
      t.sub && t.sub.length
        ? `<dl class="article__subterms">${rows(t.sub)}</dl>`
        : ''}</dd>`).join('');
  return `<dl class="article__terms">${rows(terms)}</dl>`;
}

/* ---- 5e quater. LA VIDEO SYNCHRONISEE AVEC LA PARTITION ------------------
   `beatSync` sur un bloc d'article (aujourd'hui : salsa / "Writing it down").
   Un extrait danse, et sous lui la planche de notation du meme enchainement ;
   pendant la lecture, la case du temps en cours s'allume sur la planche.
   C'est la demonstration du propos de la section — la notation ne vaut que si
   on peut la relire contre le mouvement reel.

   FICHIER LOCAL, PAS D'EMBARQUEMENT YOUTUBE.
   Une premiere version passait par une iframe YouTube pilotee en postMessage.
   Le fichier servi depuis assets/media rend tout cela inutile, et le gain est
   franc : plus de `frame-src` dans la CSP, plus de tiers charge, plus de
   dependance a `infoDelivery` (un message que YouTube n'a jamais documente et
   qui n'arrivait qu'en lecture). Surtout, `video.currentTime` est LU
   directement — la synchronisation devient exacte au lieu d'etre estimee
   depuis des messages espaces de 250ms. Le site peut de nouveau dire qu'il ne
   charge aucun tiers (voir le pied de page).

   POURQUOI UNE IMAGE + UN CADRE MOBILE, ET NON 12 IMAGES.
   Decouper la planche en douze fichiers, c'est douze requetes, douze
   exports a refaire au moindre changement, et surtout la perte de la
   planche EN TANT QUE PLANCHE : ce qu'on lit ici, c'est justement la suite
   complete, avec le temps courant situe dedans. Le cadre est donc un
   rectangle en pourcentage par-dessus une seule image, et les pourcentages
   viennent des coordonnees Figma des cases (voir `frames` dans content.js). */
function beatSyncMarkup(s) {
  if (!s) return '';
  const d = t();
  const W = s.sheetW, H = s.sheetH;
  // Chaque case devient un bouton pose en pourcentage sur l'image : cliquer
  // deplace la video. Un <button> et non une <div> — c'est une commande, et
  // le clavier doit pouvoir l'atteindre.
  // `data-slot` : le rang du temps dans la grille des 16, pas le rang de la
  // case. C'est la grille qui porte le temps, et deux temps (4 et 8) n'ont
  // aucune case — indexer par case ne permettrait pas de les atteindre.
  const spots = s.frames.map(f => `
    <button type="button" class="beatsync__spot" data-slot="${f.slot}"
            style="left:${(f.x / W * 100).toFixed(3)}%;top:${(f.y / H * 100).toFixed(3)}%;
                   width:${(f.w / W * 100).toFixed(3)}%;height:${(f.h / H * 100).toFixed(3)}%"
            aria-label="${escapeAttr(f.part)} — ${escapeAttr(d.beatSyncBeat)} ${escapeAttr(String(f.beat))}"></button>`).join('');

  /* PAS d'attribut `controls` : les commandes natives afficheraient une barre
     de progression sur la video ENTIERE (13s), alors que seul l'extrait 3-11s
     est en jeu, et le visiteur pourrait s'en echapper d'un clic. Deux boutons
     a nous, qui ne peuvent commander que ce qu'on veut.
     PAS de `data-autoplay` non plus : setupVideos() ne doit pas s'en saisir —
     ici la lecture demarre sur une demande explicite. */
  return `
    <div class="beatsync" data-beatsync='${escapeAttr(JSON.stringify({
      start: s.start, end: s.end, counts: s.counts,
      // L'indice de case pour chaque temps de la grille, ou -1 quand ce temps
      // n'a pas de case (les temps 4 et 8, les pauses). Calcule ici plutot que
      // cherche a chaque image : c'est une table de 16 entrees, figee.
      slotFrame: s.counts.map((_, i) => s.frames.findIndex(f => f.slot === i))
    }))}'>
      <div class="beatsync__video">
        <video class="beatsync__player" src="${escapeAttr(s.video)}"
               preload="metadata" playsinline muted
               aria-label="${escapeAttr(s.videoTitle)}"></video>
        <!-- Le compte en cours, en haut a droite. C'est ce qu'un danseur
             compte a voix haute (1 a 8) : il inclut donc les temps 4 et 8, qui
             n'ont pas de case sur la planche mais existent bel et bien dans la
             mesure. aria-hidden parce que la meme information est deja
             annoncee, en toutes lettres et avec sa partie, par
             .beatsync__read juste en dessous — la lire deux fois n'apporterait
             rien.
             ATTENTION : pas de backtick dans ces commentaires HTML. Ils vivent
             dans un template literal, donc un backtick le termine et la suite
             du balisage part en erreur de syntaxe (deja arrive ici). -->
        <p class="beatsync__count" aria-hidden="true"></p>
        <!-- Les commandes sont POSEES SUR la video, en bas a gauche. Une
             rangee plutot qu'un gros bouton central : le bouton de son la
             rejoint le jour ou on le rallume (voir plus bas), et un rond de
             56px au milieu de l'image masquerait les danseurs, c'est-a-dire
             exactement ce qu'on demande de regarder. -->
        ${/* LE BOUTON DE SON EST CONSTRUIT ET DESACTIVE ICI : il ne sort que si
              `sound: true` est pose sur le beatSync dans content.js, et
              l'extrait El Tiburon ne le demande pas — il n'a pas de son utile.
              Le reste existe et reste inerte : le gestionnaire dans
              setupBeatSync() est deja garde par `if (soundBtn)`.
              TANT QU'IL EST ETEINT, le <video> doit rester `muted` : sans
              commande, un son qu'on ne peut pas couper serait pire que pas de
              son du tout. La video de la section "So what is a move?",
              elle, l'allume (voir videoPlayerMarkup). */''}
        ${mediaControlsMarkup(s.sound, speedButtonMarkup())}
      </div>
      <!-- Le rail de defilement. Sous 700px la planche ne peut pas rentrer :
           douze cases sur 831px de large tombent a 30px chacune sur un
           telephone — illisibles, et sous la taille minimale d'une cible
           tactile. Elle garde donc une largeur minimale et se parcourt
           horizontalement, comme la barre de sections des etudes de cas.
           Le rail est un PARENT de .beatsync__sheet et non la planche
           elle-meme : les cases et le cadre se reperent en pourcentage de la
           planche, qui doit donc rester a sa taille pleine pendant que c'est
           le conteneur qui rogne. -->
      <div class="beatsync__rail">
        <div class="beatsync__sheet">
          <img src="${escapeAttr(s.sheet)}" alt="${escapeAttr(s.sheetAlt)}"
               loading="lazy" decoding="async">
          <div class="beatsync__marker" hidden></div>
          ${spots}
        </div>
      </div>
      <p class="beatsync__read" aria-live="polite"></p>
      ${s.caption ? `<p class="beatsync__caption">${emphasize(s.caption)}</p>` : ''}
    </div>`;
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
/* `maxWidth` (px) : borne une figure a sa taille reelle au lieu de la laisser
   remplir la colonne. Necessaire pour les schemas de l'article salsa, qui sont
   des exports Figma en 2x ou 3x : une carte de 400x750 devient un fichier de
   800x1500, et etiree sur les ~700px de la colonne elle s'affichait sur
   1100px de haut, avec un titre de 24px et du vide partout. La valeur a poser
   est donc la largeur du fichier divisee par son facteur d'export — sa taille
   a l'echelle 1, celle du node dans Figma. Les figures plus larges que la
   colonne ne sont pas concernees : elles sont deja bridees par le
   `width: 100%` de .figure--remote img. Optionnel : sans lui, rien ne change
   pour les medias existants.

   CALEES A GAUCHE, PAS CENTREES. Une figure plus etroite que la colonne etait
   centree (`margin-inline: auto`), ce qui lui donnait deux retraits inegaux par
   rapport au paragraphe qu'elle illustre : l'oeil devait rattraper le bord
   gauche du texte a chaque visuel. Alignee sur ce bord, la colonne de lecture
   reste une seule ligne verticale du haut en bas de l'article. */
function boundStyle(maxWidth) {
  return Number.isFinite(maxWidth) ? ` style="max-width:${maxWidth}px"` : '';
}

function mediaMarkup(m) {
  /* `type: 'carousel'` : une entree media qui contient plusieurs images a
     faire defiler, au lieu d'une seule. On delegue au carrousel deja ecrit
     pour les etudes de cas (carouselMarkup/setupImageCarousel plus bas) —
     memes fleches, memes puces, meme glissement au doigt, rien a redoubler.
     Sortie ici et pas plus bas : la suite de la fonction construit UNE
     figure a partir de mediaUrl(m), et un carrousel n'a pas de `src`. */
  if (m.type === 'carousel') return carouselMarkup(m.items, m);
  /* `controls: true` sur une video : lecteur a commandes (lecture/pause, et
     son si `sound`) au lieu de la video qui se lance seule au defilement.
     Meme raison de sortir ici : le balisage differe (une couche de commandes
     posee sur l'image), pas seulement l'element interieur. */
  if (m.type === 'video' && m.controls) return videoPlayerMarkup(m);
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
  const bound = boundStyle(m.maxWidth);
  // `hideCaption` : garde `cap` comme aria-label/alt (accessibilite) mais
  // masque la <figcaption> visible — utile pour un media d'ouverture qui
  // n'a pas besoin de legende affichee sous lui.
  // `m.zoomable` (voir zoomableClass()) : meme mecanisme que figureFor() pour
  // les etudes de cas — true = zoomable partout, 'mobile' = seulement sous
  // 700px (schemas d'article deja assez grands sur desktop, illisibles une
  // fois retreecis a la colonne mobile).
  return `<figure class="${kind}"${bound}>
      <div class="figure__frame${zoomableClass(m.zoomable)}">${inner}</div>
      ${cap && !m.hideCaption ? `<figcaption>${cap}</figcaption>` : ''}
    </figure>`;
}

/* Lecteur video autonome : la video en boucle, avec une rangee de commandes
   posee dessus (voir mediaControlsMarkup). C'est le rendu de
   `{ type: 'video', controls: true }` dans content.js.

   EN PAUSE ET MUET AU CHARGEMENT, les deux volontairement :
   - en pause, parce qu'une video qui part seule au milieu d'un texte prend la
     main sur la lecture. Elle boucle comme un gif UNE FOIS lancee, ce qui est
     le comportement demande, mais c'est le lecteur qui la lance ;
   - muette, parce qu'un son qui demarre sans prevenir est le pire defaut d'une
     page. Le bouton de son (`sound: true`) est la pour l'allumer.
   `loop` fait le gif, `playsinline` empeche le plein ecran force sur iPhone.
   PAS de `data-autoplay` : c'est l'attribut que setupVideos() cherche pour
   lancer une video au defilement, et le poser ici annulerait tout ce qui
   precede. */
function videoPlayerMarkup(m) {
  const cap = escapeAttr(m.caption || '');
  const poster = m.poster ? ` poster="${escapeAttr(m.poster)}"` : '';
  return `<figure class="figure figure--remote figure--player"${boundStyle(m.maxWidth)}>
      <div class="figure__frame vplayer">
        <video class="vplayer__video" src="${escapeAttr(mediaUrl(m))}"${poster}
               loop muted playsinline preload="metadata"
               aria-label="${cap}" disablepictureinpicture></video>
        ${mediaControlsMarkup(m.sound)}
      </div>
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

/* Carte "polaroid" qu'on attrape a la souris/au doigt pour la deposer
   ailleurs sur la page — reference explicite de l'utilisateur : la classe
   .draggable-card et le cadre carre en papier blanc legerement incline des
   cartes eparpillees de lelezhang.design. setupDraggableCards() (plus bas)
   pose le geste ; ce balisage ne pose que le decor.
   `card` EST l'objet media (voir mediaMarkup()) plus un `angle` optionnel :
   video avec commandes (type:'video', controls:true, comme l'etude de cas
   salsa) ou simple image, sans dupliquer leur rendu ici — seul `angle` est
   retire avant de passer le reste tel quel a mediaMarkup(). `--card-angle`
   est une variable CSS plutot qu'une classe par angle : setupDraggableCards()
   lit/ecrit la position de glisser-deposer sur les memes variables
   (--card-x/--card-y), donc tout l'etat visuel de la carte vit au meme
   endroit. */
function draggableCardMarkup(card) {
  const { angle, ...media } = card;
  return `<div class="draggable-card" style="--card-angle:${angle ?? -4}deg">
      <div class="draggable-card__inner">${mediaMarkup(media)}</div>
    </div>`;
}

/* Photo scotchee de la page About (pageEditorial()) : reference explicite de
   l'utilisateur, .column.w-col-6 + .scotch sur l'ancien marvinsrd.com/fr/accueil
   — carre incline avec deux bandes de scotch rectangulaires a des angles
   independants, plutot que le cadre polaroid arrondi de .draggable-card
   (autre reference, lelezhang.design). Statique, pas glissable : cette
   page n'a qu'une seule photo, pas une pile a eparpiller. */
function aboutPhotoMarkup(photo) {
  if (!photo) return '';
  return `<div class="about-photo">
      <div class="about-photo__tape about-photo__tape--1" aria-hidden="true"></div>
      <div class="about-photo__tape about-photo__tape--2" aria-hidden="true"></div>
      <img class="about-photo__img" src="${escapeAttr(photo.src)}" alt="${escapeAttr(photo.alt || '')}" loading="lazy" decoding="async">
    </div>`;
}

/* Bloc "Experience"/"Education" de la page About (pageEditorial(), via
   b.items) : deux lignes par entree, reference explicite de l'utilisateur —
   #experience sur antonioso.ng (colonne label a gauche, valeur a droite ;
   une ligne role/dates puis une ligne tag/description). `item.url` absent
   (diplomes, ou la periode de pause) : nom en texte simple, pas de lien
   externe factice. `item.duration` absent (education, un seul millesime) :
   pas de pastille — elle est reservee a une DUREE, jamais une simple date.
   `text` passe par emphasize() : un item peut se terminer par un lien
   interne ([label](#/gap)) ou externe ([label](https://...)). */
function expItemMarkup(item) {
  const orgHTML = item.url
    ? extArrowLinkHTML(item.org, item.url, 'exp__org')
    : `<span class="exp__org">${escapeAttr(item.org)}</span>`;
  const badge = item.duration ? `<span class="exp__badge">${escapeAttr(item.duration)}</span>` : '';
  const subLabel = [item.tag, item.place].filter(Boolean).join(' · ');
  return `<div class="exp__item">
      <div class="exp__row">
        ${orgHTML}
        <div class="exp__value">
          <span class="exp__role">${escapeAttr(item.role)}</span>
          <span class="exp__meta"><span class="exp__dates">${escapeAttr(item.dates)}</span>${badge}</span>
        </div>
      </div>
      <div class="exp__row exp__row--sub">
        <span class="exp__tag">${escapeAttr(subLabel)}</span>
        <p class="exp__text">${emphasize(item.text)}</p>
      </div>
    </div>`;
}
function expListMarkup(items) {
  return `<div class="exp-list">${items.map(expItemMarkup).join('')}</div>`;
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
  // `type: 'scrollFrame'` : image locale bien plus haute que large (une page
  // entiere capturee), presentee dans une fenetre a hauteur fixee (aspect-ratio)
  // (ex. Yabara/Landing page, la home recruteur ; Yabara/Recruiter et
  // Candidate sections, meme fenetre appliquee a toutes les captures pour
  // garder leur largeur de colonne actuelle et juste plafonner leur hauteur).
  // `s.ratio` = "largeur / hauteur" de la portion qu'on veut voir au repos
  // (voir yabara-landing-recruiter dans content.js pour le calcul des pixels
  // source) — posee en variable CSS plutot qu'en aspect-ratio direct :
  // desktop uniquement (voir .cs-scroll-frame dans styles.css), mobile
  // l'ignore et affiche l'image en entier, sans fenetre ni scroll interne.
  // `s.zoomable` : au repos la fenetre est figee (overflow: hidden, aucun
  // scroll passif) — reutilise zoomableClass()/setupZoomableMedia() tel
  // quel (meme classe .zoomable-media que .figure__frame), donc c'est le
  // clic qui zoome l'image ET debloque le glisser-deplacer dans les 4
  // directions, sans jamais faire bouger le cadre lui-meme (aspect-ratio le
  // rend deja insensible a la taille de son contenu).
  if (s.type === 'scrollFrame') {
    const captionHTML = escapeAttr(s.caption || '');
    return `
      <figure class="figure figure--scroll-frame">
        <div class="cs-scroll-frame${zoomableClass(s.zoomable)}" style="--frame-ratio:${escapeAttr(String(s.ratio))}">
          <picture>
            <source srcset="assets/img/${s.image}.webp" type="image/webp">
            <img src="assets/img/${s.image}.png" alt="${captionHTML}" loading="lazy" decoding="async">
          </picture>
        </div>
        ${captionHTML ? `<figcaption>${captionHTML}</figcaption>` : ''}
      </figure>`;
  }
  // `type: 'dashFrame'` (ex. Yabara/Recruiter section, home dashboard) :
  // variante de scrollFrame a DEUX images independantes plutot qu'une —
  // `side` (la sidebar, jamais scrollee) et `main` (le reste de la page,
  // bien plus haute que sa colonne, scrollee seule) — voir s.side/s.main
  // dans content.js et la note au-dessus de .cs-dash-frame dans styles.css
  // pour pourquoi deux exports separes plutot qu'un seul + calque de
  // masquage (ancienne approche, voir l'historique de ce fichier). Jamais
  // zoomable : contrairement a scrollFrame, un simple scroll suffit deja a
  // tout parcourir.
  // `s.mobileImage` (optionnel) : sous 701px, le split side/main (pense pour
  // une large colonne desktop) cede la place a CETTE image unique, pleine
  // largeur, sans la sidebar collante — demande utilisateur explicite plutot
  // que le side+main empile par defaut (peu lisible : sidebar ecrasee en
  // pleine largeur au-dessus d'un contenu deux fois plus long). Les deux
  // blocs sont dans le DOM en permanence, la media query (.cs-dash-frame vs
  // .cs-dash-frame__mobile, voir styles.css) choisit lequel s'affiche —
  // `display:none` retire l'inactif de l'arbre d'accessibilite, pas besoin
  // d'aria-hidden manuel. `s.zoomable` (reutilise ici, jamais applique a
  // .cs-dash-frame lui-meme — un simple scroll suffit deja au split
  // desktop) : ne sert donc qu'a cette image mobile, generalement
  // zoomable:'mobile' — demande utilisateur, l'image mobile unique est
  // souvent trop dense pour se lire a la largeur d'un telephone.
  if (s.type === 'dashFrame') {
    const captionHTML = escapeAttr(s.caption || '');
    const mobileHTML = s.mobileImage ? `
        <div class="cs-dash-frame__mobile${zoomableClass(s.zoomable)}">
          <picture>
            <source srcset="assets/img/${s.mobileImage}.webp" type="image/webp">
            <img src="assets/img/${s.mobileImage}.png" alt="${captionHTML}" loading="lazy" decoding="async">
          </picture>
        </div>` : '';
    const figureHTML = `
      <figure class="figure figure--scroll-frame">
        <div class="cs-dash-frame" style="--frame-ratio:${escapeAttr(String(s.ratio))}">
          <div class="cs-dash-frame__side">
            <picture>
              <source srcset="assets/img/${s.side.image}.webp" type="image/webp">
              <img src="assets/img/${s.side.image}.png" alt="" loading="lazy" decoding="async">
            </picture>
          </div>
          <div class="cs-dash-frame__main">
            <picture>
              <source srcset="assets/img/${s.main.image}.webp" type="image/webp">
              <img src="assets/img/${s.main.image}.png" alt="${captionHTML}" loading="lazy" decoding="async">
            </picture>
          </div>
        </div>${mobileHTML}
        ${captionHTML ? `<figcaption>${captionHTML}</figcaption>` : ''}
      </figure>`;
    return s.below ? `<div class="cs-sec__stack">${figureHTML}${belowMarkup(s.below)}</div>` : figureHTML;
  }
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
  const drawered = s.figureDrawer
    ? `<details class="figure-drawer"><summary>${escapeAttr(t().figureSeeMore)}${chevronIcon('figure-drawer__chevron')}</summary>${figure}</details>`
    : figure;
  // `s.below` (voir content.js, Yabara/Recruiter section) : empile un widget
  // interactif SOUS cette figure, dans un wrapper commun — necessaire pour
  // que les deux restent une seule cellule de .media-grid (sinon ils
  // deviendraient chacun leur propre item de grille, cote a cote plutot
  // qu'empiles). Voir .cs-sec__stack dans styles.css et belowMarkup()
  // juste en dessous pour le choix du widget.
  return s.below ? `<div class="cs-sec__stack">${drawered}${belowMarkup(s.below)}</div>` : drawered;
}

/* Choix du widget empile par `s.below` (voir figureFor() ci-dessus) : la
   forme du config distingue les deux — `candidateId` pour la demo carte +
   modale candidat (candidateCardMarkup(), node Figma 387:1493/387:1327),
   `criteria` pour le tooltip de score de matching (anonScoreMarkup(), node
   377:26729) qui vient s'empiler sous l'image d'anonymisation. */
function belowMarkup(cfg) {
  if (cfg.criteria) return anonScoreMarkup(cfg);
  if (cfg.candidateId) return candidateCardMarkup(cfg);
  // Ni l'un ni l'autre widget : cfg est une figure ordinaire (image/caption/
  // bare/zoomable, ex. Candidate section, node Figma 392:3288 empile sous
  // "Application status and timeline") — figureFor() la rend telle quelle,
  // meme chemin que n'importe quel autre item de figureAfter.
  return figureFor(cfg);
}

/* Yabara, Recruiter section : tooltip du score de matching (node Figma
   377:26729), empile sous l'image d'anonymisation (node 391:2234) via
   s.below. L'image est un export plat (le badge de score y est deja "cuit"
   dans les pixels) — seuls un bouton invisible positionne par-dessus
   (cfg.hotspot, en %, mesure sur le node 391:2224 "7/10" a l'interieur du
   canevas 969x345 du node 391:2234) et le tooltip lui-meme sont construits
   en HTML/CSS. Positions en % (pas px) : suivent le badge quelle que soit
   la largeur de rendu de l'image, puisque .cs-anon fixe son propre
   aspect-ratio (voir styles.css) — un pourcentage vertical/horizontal reste
   donc exact a n'importe quelle taille de colonne.
   Icones : locationPinIcon/checkIcon/candModalCloseIcon deja definies plus
   haut (memes traits que le node Figma), seules grad/building/salary sont
   nouvelles (voir juste au-dessus de candModalSearchIcon). */
function anonScoreMarkup(cfg) {
  const captionHTML = escapeAttr(cfg.caption || '');
  const iconFor = {
    location: locationPinIcon, grad: gradCapIcon, building: buildingIcon,
    calendar: calendarIcon, salary: salaryIcon
  };
  const rows = [];
  for (let i = 0; i < cfg.criteria.length; i += 2) rows.push(cfg.criteria.slice(i, i + 2));
  const critHTML = rows.map(pair => `
        <div class="cs-anon__crit-row${pair.length === 1 ? ' cs-anon__crit-row--single' : ''}">
          ${pair.map(c => `
          <div class="cs-anon__crit">
            <div class="cs-anon__crit-label">${iconFor[c.icon]('cs-anon__crit-icon')}<span>${escapeAttr(c.label)}</span></div>
            <div class="cs-anon__crit-pill cs-anon__crit-pill--${c.pass ? 'pass' : 'fail'}">
              <span>${escapeAttr(c.value)}</span>${(c.pass ? checkIcon : candModalCloseIcon)('cs-anon__crit-pill-icon')}
            </div>
          </div>`).join('')}
        </div>`).join('');
  const hs = cfg.hotspot;
  return `
    <figure class="figure figure--bare">
      <div class="cs-anon" style="--anon-ratio:${escapeAttr(String(cfg.ratio))}">
        <picture>
          <source srcset="assets/img/${cfg.image}.webp" type="image/webp">
          <img src="assets/img/${cfg.image}.png" alt="${captionHTML}" loading="lazy" decoding="async">
        </picture>
        <button type="button" class="cs-anon__hot" aria-describedby="cs-anon-tip"
          style="left:${hs.left}%; top:${hs.top}%; width:${hs.width}%; height:${hs.height}%;"
          aria-label="View match score details"></button>
        <div class="cs-anon__tooltip" id="cs-anon-tip" role="tooltip"
          style="left:${hs.left + hs.width / 2}%; top:${hs.top + hs.height}%;">
          <p class="cs-anon__tooltip-title"><strong>${cfg.score} critères</strong> sur ${cfg.total}</p>
          <div class="cs-anon__crit-list">${critHTML}</div>
        </div>
      </div>
      ${captionHTML ? `<figcaption>${captionHTML}</figcaption>` : ''}
    </figure>`;
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

// Fleche Lucide ("arrow-up-right", licence MIT), meme parti pris que
// chevronIcon ci-dessus. Remplace le caractere "↗" partout ou un lien quitte
// le site : le lien vers l'article des deux ans et, dans les etudes de cas,
// les CTA externes (extLinks, "voir le projet", CTA Hoot).
function arrowUpRightIcon(cls) {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>`;
}

// Fleche Lucide ("arrow-right", licence MIT), meme parti pris. Remplace
// arrowUpRightIcon sur le lien vers l'article des deux ans (demande
// utilisateur), qui la pose desormais AVANT le texte plutot qu'apres — voir
// .hero__gap .u-arrow-link__icon dans styles.css pour l'inversion de marge
// que cet ordre impose.
function arrowRightIcon(cls) {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`;
}

// Icone Lucide ("info", licence MIT), meme parti pris. Pose l'icone
// d'information au debut de .cs__cases-intro (demande utilisateur, inspiree
// du bandeau "info" de carbondesignsystem.com/components/select/usage) —
// contour seul (fill="none"), jamais un disque plein.
function infoIcon(cls) {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;
}

// Fleches Lucide ("arrow-left" / "arrow-up", licence MIT), meme parti pris.
// Remplacent les caracteres "←"/"↑" : le bouton Back de .cs-nav et le lien
// "Back to top" en fin de processus.
function arrowLeftIcon(cls) {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>`;
}
function arrowUpIcon(cls) {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>`;
}
// Fleche Lucide ("send", licence MIT), meme parti pris que les fleches
// ci-dessus : posee sur le lien mail du pied de page a la place de
// arrowUpRightIcon (demande utilisateur), dans le meme span .u-arrow-link__icon
// donc a la meme taille (1em) et avec la meme animation au survol.
function sendIcon(cls) {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/></svg>`;
}
// Icone Lucide ("copy", licence MIT), meme parti pris. Remplace sendIcon sur
// le lien mail du pied de page au survol/focus (desktop) ou en permanence
// (mobile, pas de survol) — voir setupFootMailCopy().
function copyIcon(cls) {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
}

// Lien externe complet (texte souligne + fleche), voir .u-arrow-link dans
// styles.css. Reutilise par le pied de page (LinkedIn, Resume) : les deux
// spans, pas juste le caractere "↗", pour beneficier de l'animation
// soulignement/fleche partagee avec le heros. extraClass (optionnel) : hook
// CSS supplementaire — ex. "foot-hover-box" pour le surlignage au survol,
// applique a certains liens du pied de page seulement (voir buildFooter()).
function extArrowLinkHTML(label, href, extraClass = '') {
  return `<a class="u-arrow-link${extraClass ? ` ${extraClass}` : ''}" href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">
    <span>${escapeAttr(label)}</span><span class="u-arrow-link__icon" aria-hidden="true">${arrowUpRightIcon('')}</span>
  </a>`;
}

/* Les icones du lecteur de .beatsync (Lucide, licence MIT — meme parti pris
   que chevronIcon ci-dessus : le <path> copie plutot qu'une dependance pour
   quatre icones). Les DEUX etats sont toujours dans le bouton ; c'est le CSS
   qui montre l'un ou l'autre selon `aria-pressed`, de sorte que basculer
   l'etat n'implique aucune reconstruction de balisage. `fill` plein pour
   play/pause (des formes, pas des traits), contour pour le son. */
/* CLASSES `media-ico`, PAS `beatsync__ico` : ces quatre icones servent aux
   commandes de DEUX lecteurs — la planche synchronisee (beatSyncMarkup) et le
   lecteur video autonome (videoPlayerMarkup). Le CSS qui les fait apparaitre
   l'une ou l'autre selon `aria-pressed` est ecrit une fois, sur .media-btn. */
function playIcon()  { return `<svg class="media-ico media-ico--play" viewBox="0 0 24 24"
      fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>`; }
function pauseIcon() { return `<svg class="media-ico media-ico--pause" viewBox="0 0 24 24"
      fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>`; }
function soundOnIcon()  { return `<svg class="media-ico media-ico--sound-on" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`; }
function soundOffIcon() { return `<svg class="media-ico media-ico--sound-off" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"/><line x1="22" y1="9" x2="16" y2="15"/>
      <line x1="16" y1="9" x2="22" y2="15"/></svg>`; }

/* La rangee de commandes posee SUR une video : le meme balisage pour les deux
   lecteurs. `sound` : le bouton de son n'existe que si le media le demande —
   une video sans son utile n'a rien a proposer, et un bouton inerte est pire
   qu'un bouton absent.
   Les libelles sont les seuls noms accessibles de ces boutons (les icones sont
   aria-hidden), d'ou l'aria-label systematique. L'etat de depart est celui du
   lecteur au chargement : en pause et muet, donc aria-pressed="false" sur les
   deux — c'est setupVideoPlayers()/setupBeatSync() qui le tient a jour
   ensuite. */
function mediaControlsMarkup(sound, extra) {
  const d = t();
  return `
    <div class="media-controls">
      <button type="button" class="media-btn" data-act="play"
              aria-pressed="false" aria-label="${escapeAttr(d.playerPlay)}">
        ${playIcon()}${pauseIcon()}
      </button>
      ${sound ? `<button type="button" class="media-btn" data-act="sound"
              aria-pressed="false" aria-label="${escapeAttr(d.playerSoundOn)}">
          ${soundOnIcon()}${soundOffIcon()}
        </button>` : ''}
      ${extra || ''}
    </div>`;
}

/* Bouton de vitesse : x1 (normal) ou x0.5 (ralenti), propre a la planche
   synchronisee (El Tiburon) — voir beatSyncMarkup()/setupBeatSync(). Pas
   d'icone : un texte se lit plus vite qu'un pictogramme pour un chiffre. PAS
   passe par `sound` dans mediaControlsMarkup : cette commande n'existe que
   pour ce seul lecteur, contrairement a lecture/son qui servent aux deux
   (voir mediaControlsMarkup() plus haut). */
function speedButtonMarkup() {
  const d = t();
  return `<button type="button" class="media-btn media-btn--speed" data-act="speed"
          aria-pressed="false" aria-label="${escapeAttr(d.playerSpeedHalf)}">1×</button>`;
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

/* Icones pour candidateCardMarkup() (voir plus bas) : chemins exacts export
   Figma (node 387:1493 pour bookmark/localisation, 387:1327 pour la croix de
   fermeture et la loupe de la modale) — stroke="currentColor" plutot que la
   couleur figee du fichier source, pour suivre la couleur CSS du bouton qui
   les porte comme checkIcon()/alertCircleIcon() plus haut. */
function bookmarkIcon(cls) {
  return `<svg class="${cls}" viewBox="0 0 20 20" fill="none"
      stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true"><path d="M15.8333 17.5L10 14.1667L4.16667 17.5V4.16667C4.16667 3.72464 4.34226 3.30072 4.65482 2.98816C4.96738 2.67559 5.39131 2.5 5.83333 2.5H14.1667C14.6087 2.5 15.0326 2.67559 15.3452 2.98816C15.6577 3.30072 15.8333 3.72464 15.8333 4.16667V17.5Z"/></svg>`;
}
function locationPinIcon(cls) {
  return `<svg class="${cls}" viewBox="0 0 20 20" fill="none"
      stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true"><path d="M16.6667 8.33333C16.6667 12.4942 12.0508 16.8275 10.5008 18.1658C10.3564 18.2744 10.1807 18.3331 10 18.3331C9.81933 18.3331 9.64356 18.2744 9.49917 18.1658C7.94917 16.8275 3.33333 12.4942 3.33333 8.33333C3.33333 6.56522 4.03571 4.86953 5.28595 3.61929C6.5362 2.36905 8.23189 1.66667 10 1.66667C11.7681 1.66667 13.4638 2.36905 14.714 3.61929C15.9643 4.86953 16.6667 6.56522 16.6667 8.33333Z"/><path d="M10 10.8333C11.3807 10.8333 12.5 9.71405 12.5 8.33333C12.5 6.95262 11.3807 5.83333 10 5.83333C8.61929 5.83333 7.5 6.95262 7.5 8.33333C7.5 9.71405 8.61929 10.8333 10 10.8333Z"/></svg>`;
}
function candModalCloseIcon(cls) {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>`;
}
function candModalSearchIcon(cls) {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true"><path d="M21 21l-4.34-4.34"/><path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/></svg>`;
}

/* Icones pour anonScoreMarkup() (voir plus bas) : chemins exacts export
   Figma (node 377:26729, tooltip du score de matching) — locationPinIcon(),
   checkIcon() et candModalCloseIcon() (reutilise comme croix d'echec ici,
   meme trait exact) couvrent deja 3 des 6 icones du tooltip, seules
   grad/building/salary manquaient. */
function gradCapIcon(cls) {
  return `<svg class="${cls}" viewBox="0 0 20 20" fill="none"
      stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true"><path d="M17.85 9.10167C17.9992 9.03585 18.1258 8.92772 18.2141 8.79067C18.3024 8.65362 18.3486 8.49366 18.3469 8.33061C18.3453 8.16757 18.2958 8.0086 18.2046 7.8734C18.1135 7.7382 17.9847 7.63271 17.8342 7.57L10.6917 4.31667C10.4745 4.21762 10.2387 4.16637 10 4.16637C9.76134 4.16637 9.52547 4.21762 9.30833 4.31667L2.16667 7.56667C2.01831 7.63164 1.8921 7.73845 1.80347 7.87401C1.71485 8.00958 1.66765 8.16803 1.66765 8.33C1.66765 8.49197 1.71485 8.65042 1.80347 8.78599C1.8921 8.92155 2.01831 9.02836 2.16667 9.09333L9.30833 12.35C9.52547 12.449 9.76134 12.5003 10 12.5003C10.2387 12.5003 10.4745 12.449 10.6917 12.35L17.85 9.10167Z"/><path d="M18.3333 8.33333V13.3333"/><path d="M5 10.4167V13.3333C5 13.9964 5.52678 14.6323 6.46447 15.1011C7.40215 15.5699 8.67392 15.8333 10 15.8333C11.3261 15.8333 12.5979 15.5699 13.5355 15.1011C14.4732 14.6323 15 13.9964 15 13.3333V10.4167"/></svg>`;
}
function buildingIcon(cls) {
  return `<svg class="${cls}" viewBox="0 0 20 20" fill="none"
      stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true"><path d="M8.33333 10H11.6667"/><path d="M8.33333 6.66667H11.6667"/><path d="M11.6667 17.5V15C11.6667 14.558 11.4911 14.1341 11.1785 13.8215C10.866 13.5089 10.442 13.3333 10 13.3333C9.55797 13.3333 9.13405 13.5089 8.82149 13.8215C8.50893 14.1341 8.33333 14.558 8.33333 15V17.5"/><path d="M5 8.33333H3.33333C2.89131 8.33333 2.46738 8.50893 2.15482 8.82149C1.84226 9.13405 1.66667 9.55797 1.66667 10V15.8333C1.66667 16.2754 1.84226 16.6993 2.15482 17.0118C2.46738 17.3244 2.89131 17.5 3.33333 17.5H16.6667C17.1087 17.5 17.5326 17.3244 17.8452 17.0118C18.1577 16.6993 18.3333 16.2754 18.3333 15.8333V7.5C18.3333 7.05797 18.1577 6.63405 17.8452 6.32149C17.5326 6.00893 17.1087 5.83333 16.6667 5.83333H15"/><path d="M5 17.5V4.16667C5 3.72464 5.17559 3.30072 5.48816 2.98816C5.80072 2.67559 6.22464 2.5 6.66667 2.5H13.3333C13.7754 2.5 14.1993 2.67559 14.5118 2.98816C14.8244 3.30072 15 3.72464 15 4.16667V17.5"/></svg>`;
}
function calendarIcon(cls) {
  return `<svg class="${cls}" viewBox="0 0 20 20" fill="none"
      stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true"><path d="M6.66667 1.66667V5"/><path d="M13.3333 1.66667V5"/><path d="M15.8333 3.33333H4.16667C3.24619 3.33333 2.5 4.07953 2.5 5V16.6667C2.5 17.5871 3.24619 18.3333 4.16667 18.3333H15.8333C16.7538 18.3333 17.5 17.5871 17.5 16.6667V5C17.5 4.07953 16.7538 3.33333 15.8333 3.33333Z"/><path d="M2.5 8.33333H17.5"/></svg>`;
}
function salaryIcon(cls) {
  return `<svg class="${cls}" viewBox="0 0 20 20" fill="none"
      stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true"><path d="M9.16667 12.5H10.8333C11.2754 12.5 11.6993 12.3244 12.0118 12.0118C12.3244 11.6993 12.5 11.2754 12.5 10.8333C12.5 10.3913 12.3244 9.96738 12.0118 9.65482C11.6993 9.34226 11.2754 9.16667 10.8333 9.16667H8.33333C7.83333 9.16667 7.41667 9.33333 7.16667 9.66667L2.5 14.1667"/><path d="M5.83333 17.5L7.16667 16.3333C7.41667 16 7.83333 15.8333 8.33333 15.8333H11.6667C12.5833 15.8333 13.4167 15.5 14 14.8333L17.8333 11.1667C18.1549 10.8628 18.3426 10.4436 18.3551 10.0013C18.3676 9.55903 18.2039 9.12991 17.9 8.80833C17.5961 8.48676 17.1769 8.29908 16.7346 8.28657C16.2924 8.27407 15.8632 8.43777 15.5417 8.74167L12.0417 11.9917"/><path d="M1.66667 13.3333L6.66667 18.3333"/><path d="M13.3333 9.91667C14.668 9.91667 15.75 8.83469 15.75 7.5C15.75 6.16531 14.668 5.08333 13.3333 5.08333C11.9986 5.08333 10.9167 6.16531 10.9167 7.5C10.9167 8.83469 11.9986 9.91667 13.3333 9.91667Z"/><path d="M5 6.66667C6.38071 6.66667 7.5 5.54738 7.5 4.16667C7.5 2.78595 6.38071 1.66667 5 1.66667C3.61929 1.66667 2.5 2.78595 2.5 4.16667C2.5 5.54738 3.61929 6.66667 5 6.66667Z"/></svg>`;
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
function carouselMarkup(items, opts) {
  // opts.theme : variante d'habillage optionnelle (ex. 'hoot' — voir
  // carouselOpts dans content.js). Seule difference avec le carrousel
  // generique : chaque panneau porte son propre texte (item.label/item.text)
  // sur fond violet plutot qu'une legende partagee sous la figure — meme
  // esprit que le slider_container/commande_repas2 de la page de reference
  // (marvinsrd.com/en/hoot-project), rebati avec flex/CSS custo plutot que
  // copie a l'identique du hack Webflow (qui reposait sur la largeur
  // intrinseque des images pour deborder du conteneur).
  const theme = opts && opts.theme;
  // item.zoomable (voir zoomableClass() plus haut) : posee sur le <picture>
  // du panneau, pas sur .cs-carousel__panel lui-meme — c'est le panneau qui
  // glisse via transform pour changer de slide, le zoom ne doit toucher que
  // son contenu. Le glissement du carrousel se coupe tout seul pendant
  // qu'un panneau est zoome (stopPropagation dans setupZoomableMedia()).
  //
  // DEUX FACONS DE DESIGNER UNE IMAGE, au choix par item :
  //   item.image = 'nom-sans-extension'  -> paire assets/img/<nom>.webp +
  //     repli .png, servie par un <picture>. C'est la convention des etudes
  //     de cas, dont tous les visuels existent dans les deux formats.
  //   item.src   = 'assets/img/nom.webp' -> chemin complet, un seul fichier.
  //     C'est la convention des medias de l'article salsa (voir mediaUrl()),
  //     exports Figma en WebP uniquement. Emettre un <picture> avec un repli
  //     .png la-bas ne ferait que provoquer un 404 pour un fichier qui
  //     n'existe pas.
  const panels = items.map((item, i) => {
    const zoom = zoomableClass(item.zoomable).trim();
    const alt = escapeAttr(item.caption || '');
    // item.type === 'video' : boucle muette, meme regle de declenchement que
    // le reste du site (data-autoplay -> setupVideos(), lecture seulement
    // quand le panneau est visible — voir setupVideos() plus bas).
    const img = item.type === 'video'
      ? `<video class="${zoom}" src="${escapeAttr(item.src)}" muted loop playsinline
                preload="metadata" data-autoplay aria-label="${alt}"
                disablepictureinpicture></video>`
      : item.src
      // .zoomable-media doit vivre sur un CADRE dont <img> est l'enfant (voir
      // .zoomable-media img plus haut dans styles.css, qui cible ce fils pour
      // l'agrandir a 230% au zoom) : un <picture> a un seul <img>, sans
      // <source>, sert de cadre ici tout en restant du HTML valide — poser
      // la classe directement sur l'<img> (comme avant) laissait ".zoomable-
      // media img" sans rien a selectionner, donc aucun agrandissement au
      // clic (bug constate sur le carrousel userflow de Fit-plans).
      ? `<picture class="${zoom}"><img src="${escapeAttr(item.src)}" alt="${alt}" loading="lazy" decoding="async"></picture>`
      : `<picture class="${zoom}">
        <source srcset="assets/img/${item.image}.webp" type="image/webp">
        <img src="assets/img/${item.image}.png" alt="${alt}" loading="lazy" decoding="async">
      </picture>`;
    const slideContent = theme === 'hoot'
      ? `<div class="cs-carousel__content">
          <p class="cs-carousel__label">${escapeAttr(item.label || '')}</p>
          <p class="cs-carousel__text">${escapeAttr(item.text || '')}</p>
        </div>`
      : '';
    // item.wide (theme 'hoot' only) : l'image est un format large (ex. la
    // capture "Item voting", deux ecrans cote a cote) — lui laisser un peu
    // plus de place que les 55% par defaut, compense par moins de padding
    // sur .cs-carousel__content plutot que par une colonne de texte plus
    // etroite (voir .cs-carousel__panel--wide dans styles.css).
    const wideClass = (theme === 'hoot' && item.wide) ? ' cs-carousel__panel--wide' : '';
    return `
    <div class="cs-carousel__panel${wideClass}" data-role="carousel-panel"
         data-index="${i}" data-caption="${escapeAttr(item.caption || '')}">
      ${img}${slideContent}
    </div>`;
  }).join('');
  // Meme borne que mediaMarkup() : cadre la figure a sa taille reelle plutot
  // que de la laisser remplir la colonne (voir boundStyle()).
  const bound = boundStyle(opts && opts.maxWidth);
  const dots = items.map((item, i) => `
    <button type="button" class="cs-carousel__dot${i === 0 ? ' is-active' : ''}" data-role="carousel-dot"
            data-index="${i}" aria-label="${escapeAttr(t().csCarouselGoTo)} ${i + 1}"
            aria-current="${i === 0 ? 'true' : 'false'}"></button>`).join('');
  // theme 'hoot' : le texte vit dans chaque panneau (slideContent ci-dessus),
  // pas de legende partagee sous la figure.
  return `
    <figure class="cs-carousel${theme ? ` cs-carousel--${theme}` : ''}" data-role="carousel"${bound}>
      <div class="cs-carousel__stage">
        <div class="cs-carousel__track" data-role="carousel-track">${panels}</div>
        <button type="button" class="cs-carousel__arrow cs-carousel__arrow--prev" data-role="carousel-prev"
                aria-label="${escapeAttr(t().csCarouselPrev)}">${chevronIcon('cs-carousel__arrow-icon')}</button>
        <button type="button" class="cs-carousel__arrow cs-carousel__arrow--next" data-role="carousel-next"
                aria-label="${escapeAttr(t().csCarouselNext)}">${chevronIcon('cs-carousel__arrow-icon')}</button>
        <div class="cs-carousel__dots" role="tablist" aria-label="${escapeAttr(t().csCarouselDots)}">${dots}</div>
      </div>
      ${theme === 'hoot' ? '' : `<figcaption data-role="carousel-caption">${escapeAttr(items[0].caption || '')}</figcaption>`}
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
   5e ter (bis). LA CARTE CANDIDAT + MODALE "AJOUTER A UNE OFFRE"
   --------------------------------------------------------------------------
   Un seul cas d'usage (section "recruiter-section" de l'etude de cas Yabara,
   empilee sous le visuel "Sommaire des candidatures" via s.below, voir
   figureFor() dans ce fichier) : voir content.js pour la config. Reproduit le node Figma
   387:1493 (la carte, bouton "bookmark" en haut a droite) et le comportement
   detaille sur 387:1326 : au clic sur le bookmark, une modale (387:1327)
   propose d'ajouter le candidat a une ou plusieurs offres via des cases a
   cocher ; les 3 boutons (croix, Annuler, Sauvegarder) referment tous la
   modale sans rien persister ("//All buttons lead to exit", aucune des
   maquettes sources ne cable de sauvegarde reelle). Memes conventions que
   exclModalMarkup()/setupExclModal() juste au-dessus : data-role plutot que
   des classes pour le ciblage JS, cases a cocher natives masquees + span
   visuel (voir .cand-modal__check-input dans styles.css). */
function candidateCardMarkup(cfg) {
  const checks = cfg.offers.map((o, i) => `
    <label class="cand-modal__check">
      <input type="checkbox" class="cand-modal__check-input" id="cand-offer-${i}" value="${escapeAttr(o.value)}">
      <span class="cand-modal__check-box" aria-hidden="true">${checkIcon('cand-modal__check-icon')}</span>
      <span class="cand-modal__check-label">${escapeAttr(o.label)}</span>
    </label>`).join('');
  return `
    <div class="cand-demo">
      <div class="cand-demo__stage">
        <article class="cand-card">
          <div class="cand-card__top">
            <picture class="cand-card__avatar">
              <source srcset="assets/img/${cfg.avatar}.webp" type="image/webp">
              <img src="assets/img/${cfg.avatar}.png" alt="" loading="lazy" decoding="async">
            </picture>
            <button type="button" class="cand-card__bookmark" data-role="cand-bookmark" aria-haspopup="dialog" aria-label="Add ${escapeAttr(cfg.candidateId)} to an offer">
              ${bookmarkIcon('cand-card__bookmark-icon')}
            </button>
          </div>
          <div class="cand-card__text">
            <p class="cand-card__id">${escapeAttr(cfg.candidateId)}</p>
            <p class="cand-card__role">${escapeAttr(cfg.role)}</p>
            <p class="cand-card__loc">${locationPinIcon('cand-card__loc-icon')}${escapeAttr(cfg.location)}</p>
          </div>
          <button type="button" class="cand-card__cta">Voir le profil</button>
        </article>
        <div class="cand-modal" data-role="cand-modal" hidden>
          <div class="cand-modal__panel" role="dialog" aria-modal="true" aria-label="Ajouter un talent à une offre">
            <button type="button" class="cand-modal__close" data-role="cand-modal-dismiss" aria-label="Close">${candModalCloseIcon('cand-modal__close-icon')}</button>
            <h3 class="cand-modal__title">Ajouter un talent à une offre</h3>
            <p class="cand-modal__desc">Veuillez sélectionner les offres auxquelles vous aimeriez ajouter le talent</p>
            <div class="cand-modal__search" aria-hidden="true">
              ${candModalSearchIcon('cand-modal__search-icon')}<span>Rechercher une offre</span>
            </div>
            <div class="cand-modal__checks">${checks}</div>
            <div class="cand-modal__actions">
              <button type="button" class="cand-modal__cancel" data-role="cand-modal-dismiss">Annuler</button>
              <button type="button" class="cand-modal__save" data-role="cand-modal-dismiss">Sauvegarder</button>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

/* setupCandidateCard() : ouvre/ferme la modale — voir la note au-dessus de
   candidateCardMarkup() pour le detail du comportement source. Echap referme
   aussi la modale (meme convention que le reste du site, voir plus bas dans
   ce fichier la gestion Echap des autres fiches/modales). */
function setupCandidateCard() {
  const root = $('.cand-demo');
  if (!root) return;

  const bookmark = $('[data-role="cand-bookmark"]', root);
  const modal = $('[data-role="cand-modal"]', root);
  if (!bookmark || !modal) return;

  const open = () => {
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('is-open'));
  };
  const close = () => {
    modal.classList.remove('is-open');
    bookmark.focus();
    setTimeout(() => { modal.hidden = true; }, 300);
  };

  bookmark.addEventListener('click', open);
  addCleanup(() => bookmark.removeEventListener('click', open));

  $$('[data-role="cand-modal-dismiss"]', modal).forEach(btn => {
    btn.addEventListener('click', close);
    addCleanup(() => btn.removeEventListener('click', close));
  });

  const onKeydown = (e) => {
    if (e.key === 'Escape' && !modal.hidden) close();
  };
  document.addEventListener('keydown', onKeydown);
  addCleanup(() => document.removeEventListener('keydown', onKeydown));
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
  const isGap = key === 'gap';
  // About reuses gap's sticky side-nav back link + fixed back-to-top button
  // (user request: same buttons, same position, mobile and desktop) rather
  // than the shared floating #back-link alone.
  const hasGapNav = isGap || key === 'about';
  const page = el('div', { class: hasGapNav ? 'editorial editorial--gap' : 'editorial' });

  // La page gap reprend la mecanique de .cs__body/.cs-nav (etude de cas avec
  // nav laterale) plutot que le bouton flottant #back-link partage par tout
  // le site : une vraie grille a deux colonnes (nav etroite, puis contenu),
  // align-items:start les alignant naturellement sur la MEME ligne — le
  // bouton "fait partie de la nav laterale" au sens propre, pas par un
  // positionnement fixe coincidant par hasard avec le titre. La nav est
  // position:sticky (comme .cs-nav) : elle reste joignable tout au long du
  // defilement sans jamais pouvoir chevaucher le contenu, un vrai
  // position:fixed le pourrait (deux boites independantes, alignees par
  // coincidence a une seule largeur d'ecran — vu en pratique : le bouton
  // recouvrait la lede des que le titre passait sous lui). setupBackLink()
  // masque le bouton flottant sur cette route — meme garde-fou que pour une
  // etude de cas avec nav laterale.
  // Sous 1000px, la grille repasse a une colonne (pas de place pour une
  // colonne separee sur un ecran etroit) : le bouton s'empile au-dessus du
  // titre, mais reste position:sticky a toute largeur (demande explicite).
  // Sous 860px la pilule du site (.site-nav, barre d'onglets flottante) est
  // retiree sur cette route (body.route-gap, voir paint()) : cette page a
  // deja sa propre navigation retour, les deux se disputeraient le bas de
  // l'ecran — meme motif que body.is-overlay pour une fiche ouverte.
  const w = el('div', { class: hasGapNav ? 'editorial__gapcol' : 'wrap wrap--narrow' });
  // Cible du lien "Back to top" ajoute plus bas — meme convention que
  // head.id = 'sec-overview' sur une etude de cas (pageCase()) : scrollToSection()
  // (app.js) cherche toujours un id `sec-${ancre}`.
  if (hasGapNav) w.id = 'sec-top';

  const blocks = p.blocks.map(b => `
    <div class="editorial__block">
      ${b.h ? `<h2>${escapeAttr(b.h)}</h2>` : ''}
      ${b.items ? expListMarkup(b.items) : ''}
      ${!b.p ? '' : b.p.map(par => {
        // Un paragraphe { title, text } porte un petit intitule au-dessus
        // (meme convention que .cs-sec__title) — pour un aparte nomme, comme
        // "Salsa" dans la page gap, sans promouvoir un h2 a part entiere.
        if (typeof par === 'object') {
          // `par.callout` : un paragraphe entier mis en avant dans un bloc
          // teinte — meme recette que .todo (fond, padding, taille) mais SANS
          // son filet gauche ni son rayon asymetrique (demande utilisateur) :
          // contrairement a .todo, ce paragraphe reste du contenu publiable,
          // pas une consigne de redaction. Retourne tot : titre/cartes/media
          // n'ont pas de sens pour un simple paragraphe mis en avant.
          if (par.callout) return `<p class="editorial__callout">${emphasize(par.callout)}</p>`;
          // `par.cards` (voir draggableCardMarkup()) : posees ICI, dans leur
          // propre paragraphe, pour rester juste EN DESSOUS de lui meme si
          // d'autres paragraphes suivent dans le meme bloc (ex. "Yabara"
          // apres "Salsa") — jamais a la fin du bloc entier. Plusieurs
          // cartes partagent un .draggable-card-group (mise en grappe, voir
          // styles.css) plutot que de s'empiler chacune sur sa propre ligne.
          const cards = par.cards
            ? `<div class="draggable-card-group">${par.cards.map(draggableCardMarkup).join('')}</div>`
            : '';
          // `par.media` : images ordinaires cote a cote (pas des cartes
          // glissables) — mediaGroup() range deja plusieurs entrees en grille
          // auto-adaptative (.media-grid, meme composant que pageArticle()).
          const media = par.media ? mediaGroup(par.media) : '';
          return `<p class="editorial__ptitle">${escapeAttr(par.title)}</p><p>${emphasize(par.text)}</p>${cards}${media}`;
        }
        // Un paragraphe entierement entre crochets est une consigne de
        // redaction, pas du contenu : on l'affiche en jaune pour qu'il soit
        // impossible de le publier par distraction. Les crochets ne servent
        // qu'a le REPERER ici — on les retire avant affichage, ils ne font
        // pas partie du texte a lire.
        const trimmed = par.trim();
        const isTodo = /^\[[\s\S]*\]$/.test(trimmed);
        const text = isTodo ? trimmed.slice(1, -1) : par;
        return `<p class="${isTodo ? 'todo' : ''}">${emphasize(text)}</p>`;
      }).join('')}
    </div>`).join('');

  w.insertAdjacentHTML('beforeend', `
    ${p.isDraft ? `<p style="margin-bottom:var(--s4)"><span class="draft-badge">${escapeAttr(d.draftBadge)}</span></p>` : ''}
    <h1 class="editorial__title">${escapeAttr(p.title)}</h1>
    ${aboutPhotoMarkup(p.photo)}
    <p class="editorial__lede">${escapeAttr(p.lede)}</p>
    ${blocks}`);

  if (hasGapNav) {
    const nav = el('nav', { class: 'editorial__gapnav', 'aria-label': escapeAttr(d.csBack) });
    nav.innerHTML = `<a class="back-link" href="#/"><span aria-hidden="true">${arrowLeftIcon('back-link__icon')}</span> <span>${escapeAttr(d.csBack)}</span></a>`;
    const grid = el('div', { class: 'editorial__gapgrid' });
    grid.append(nav, w);
    const outer = el('div', { class: 'wrap' });
    outer.append(grid);
    page.append(outer);
  } else {
    page.append(w);
  }

  // Le bouton "Back to top" de cette page vit hors de #main (index.html,
  // #gap-back-to-top, montre/cache par setupGapBackToTop()) — pas ici comme
  // pour une etude de cas (.cs-back-to-top en fin de processus, pageCase()) :
  // #main porte .is-entering pendant toute la duree ou cette page est
  // affichee, ce qui en aurait fait le referentiel de ce bouton position:fixed
  // au lieu de la fenetre (voir la note de #gap-back-to-top dans index.html).
  // MEME RAISON, decouverte plus tard (bug constate seulement sous 1000px,
  // une seule colonne) : sous 1000px, le bouton Back utilise lui aussi #main
  // comme sortie plutot que .editorial__gapnav — voir setupBackLink().
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
          <!-- "Marvin S." en dur (comme .brand dans index.html), pas
               SITE.name : le pied de page reste court, SITE.name garde le
               nom complet pour <title> et les aria-label (voir plus bas dans
               ce fichier). -->
          <p class="foot__name">Marvin S.</p>
          <!-- .u-arrow-link, pas .btn (demande utilisateur) : meme composant
               et meme fleche estompee -> pleine au survol que les liens de
               "Get in touch" a droite (voir .u-arrow-link__icon plus haut),
               plutot qu'un bouton a part avec sa propre boite. -->
          ${extArrowLinkHTML(d.footerResume, SITE.links.resume, 'foot-magnetic')}
          <div class="foot__bottom">
            <span>© ${new Date().getFullYear()} Marvin S. <span class="foot__rights">${escapeAttr(d.footerRights)}</span></span>
            <p class="foot__note">${escapeAttr(d.footerNote)}</p>
          </div>
        </div>
        <div>
          <h3>${escapeAttr(d.footerSitemap)}</h3>
          <ul>
            <!-- .foot-magnetic sur les 8 liens Sitemap+Get in touch (demande
                 utilisateur) : meme effet que .hero__gap — magnetique, pas de
                 boite au survol, pas de soulignement (voir setupMagneticFooterLinks()
                 et la regle .foot-magnetic dans styles.css). -->
            <li><a class="u-underline foot-magnetic" href="#/">${escapeAttr(d.navHome)}</a></li>
            <li><a class="u-underline foot-magnetic" href="#/#work">${escapeAttr(d.navWork)}</a></li>
            <li><a class="u-underline foot-magnetic" href="#/#side">${escapeAttr(d.navSide)}</a></li>
            <li><a class="u-underline foot-magnetic" href="#/about">${escapeAttr(d.navAbout)}</a></li>
            <li><a class="u-underline foot-magnetic" href="#/gap">${escapeAttr(HERO.gapLink)}</a></li>
          </ul>
        </div>
        <div>
          <h3>${escapeAttr(d.footerContact)}</h3>
          <ul>
            <!-- .u-arrow-link et non .u-underline : cette ancre porte desormais
                 une icone (sendIcon), pas seulement du texte — voir la note sur
                 .u-underline vs .u-arrow-link plus haut dans ce fichier.

                 Interaction "cliquer pour copier" (demande utilisateur, cf.
                 krystianzun.com) : voir setupFootMailCopy() plus bas dans ce
                 fichier pour le detail. Deux couches ici, superposees
                 (voir styles.css) :

                 - .foot-mail__sizer (aria-hidden, visibility:hidden) rejoue
                   l'etat par defaut (adresse + icone) EN FLUX NORMAL — c'est
                   elle qui donne sa largeur figee a l'ancre entiere. Sans
                   elle, un texte plus court ("Click to copy", "Copied")
                   retrecirait la zone de survol/clic et ferait clignoter
                   l'etat pile a la frontiere (glitch reproduit sur le site
                   de reference).
                 - .foot-mail__visible, superposee dessus en position
                   absolute, est la seule que JS touche (survol -> "Click to
                   copy", clic -> "Copied"). Toujours en flex hugging son
                   propre contenu (justify-content par defaut) : l'icone
                   colle au texte actuellement affiche avec le meme
                   ecart qu'au repos, quel que soit l'etat — seul l'espace
                   INUTILISE (si le texte est plus court que l'adresse) se
                   retrouve a droite de l'icone, jamais entre le texte et
                   elle.

                 sendIcon + copyIcon (dans .foot-mail__visible uniquement)
                 sont tous les deux presents en permanence, empiles en grille
                 dans .u-arrow-link__icon (voir styles.css) : le CSS choisit
                 lequel est visible (survol/focus sur desktop, copyIcon en
                 permanence sur mobile) sans jamais toucher au DOM. -->
            <li>
              <a class="u-arrow-link foot-magnetic foot-mail" href="mailto:${escapeAttr(SITE.email)}" data-email="${escapeAttr(SITE.email)}">
                <span class="foot-mail__sizer" aria-hidden="true">
                  <span>${escapeAttr(SITE.email)}</span><span class="u-arrow-link__icon">${sendIcon('')}</span>
                </span>
                <span class="foot-mail__visible">
                  <span class="foot-mail__text-visible">${escapeAttr(SITE.email)}</span>
                  <span class="u-arrow-link__icon" aria-hidden="true">${sendIcon('foot-mail__icon-arrow')}${copyIcon('foot-mail__icon-copy')}</span>
                </span>
              </a>
            </li>
            <li>${extArrowLinkHTML('LinkedIn', SITE.links.linkedin, 'foot-magnetic')}</li>
          </ul>
        </div>
      </div>
    </div>
    <!-- Trame geometrique du pied de page de marvinsrd.com (demande
         utilisateur : "les memes classes"), reprise telle quelle — memes noms
         de classe (ligne-footer/carre/grand-cercle), meme ordre, memes
         suffixes numeriques. Hors de .wrap.foot, comme sur le site de
         reference : ces div sont position:absolute et se calent directement
         sur .site-foot (voir styles.css), pas sur la colonne de contenu. -->
    <div class="ligne-footer _2"></div>
    <div class="ligne-footer"></div>
    <div class="ligne-footer _6"></div>
    <div class="carre"></div>
    <div class="ligne-footer _4"></div>
    <div class="ligne-footer _3"></div>
    <div class="grand-cercle"></div>`;
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
    if (!p) return { name: '404' };
    // Projet fusionne (voir content.js) : le 3e segment choisit le cas
    // affiche ; inconnu ou absent retombe sur `defaultCase` plutot que 404,
    // pour tolerer un lien perime ou une URL de base partagee.
    const caseId = p.cases
      ? (p.cases.some(cs => cs.slug === parts[2]) ? parts[2] : p.defaultCase)
      : undefined;
    return { name: 'case', project: p, caseId };
  }
  return { name: '404' };
}

/* Durees des deux animations de fiche. Elles DOIVENT correspondre a celles
   ecrites dans styles.css (section 11 bis) : le CSS anime, le JS compte. Si
   vous changez l'une, changez l'autre — sinon le contenu est remplace avant
   la fin du mouvement (ou l'ecran reste fige apres). */
const SHEET_IN_MS  = 620;
const SHEET_OUT_MS = 380;   /* la sortie est plus rapide que l'entree : on
                               regarde arriver une page, on ne regarde pas
                               partir celle qu'on vient de quitter. */

/* Le chef d'orchestre. Il ne dessine rien lui-meme : il decide seulement
   SI l'on ouvre une fiche, SI l'on en ferme une, ou si c'est une navigation
   ordinaire — puis il passe la main a paint().

   Les trois cas :
     'open'    accueil -> etude de cas. On photographie la page actuelle,
               puis paint() dessine la fiche qui monte par-dessus.
     'close'   etude de cas -> autre chose. Ici l'ordre s'inverse : on joue
               l'animation D'ABORD, sur la page encore affichee, et on ne
               dessine la suivante qu'une fois la fiche sortie de l'ecran.
               C'est la seule raison d'etre du minuteur ci-dessous.
     'normal'  tout le reste, y compris etude de cas -> etude de cas (le lien
               "projet suivant") : la fiche est deja ouverte, elle le reste,
               on se contente d'echanger son contenu. */
function render() {
  const hash   = location.hash || '#/';
  const route  = parseRoute(hash);
  const body   = document.body;
  const isCase = route.name === 'case';

  const first   = state.route === '';                  // tout premier rendu du site
  const opened  = body.classList.contains('is-overlay');
  const motion  = !prefersReducedMotion();

  // --- FERMETURE ---
  // On memorise la destination et on laisse le minuteur la dessiner. Si un
  // second changement de hash arrive pendant l'animation (double clic,
  // bouton Precedent impatient), on ne relance rien : on met simplement a
  // jour la destination, et l'animation deja lancee va jusqu'au bout.
  if (!isCase && opened && state.snap && motion) {
    state.pending = { hash, route };
    if (!body.classList.contains('is-closing')) {
      body.classList.remove('is-opening');
      body.classList.add('is-closing');
      clearTimeout(state.sheetTimer);
      state.sheetTimer = setTimeout(() => {
        state.sheetTimer = null;
        const next = state.pending;
        state.pending = null;
        paint(next.hash, next.route, 'close');
      }, SHEET_OUT_MS);
    }
    return;
  }

  // --- OUVERTURE ---
  // On garnit le calque du dessous des qu'on entre en mode fiche, animation
  // ou pas : c'est lui qu'on apercoit en permanence au-dessus de la fiche et
  // sur ses cotes. Deux facons de le garnir selon ce qu'on a sous la main :
  //   - une page affichee : on la photographie telle quelle ;
  //   - rien (arrivee directe sur l'URL d'une etude de cas, rechargement,
  //     lien partage) : on FABRIQUE la page d'accueil. Sans ca, on ne verrait
  //     qu'un aplat noir derriere la fiche, ce qui ne ressemble a rien.
  const entering = isCase && !opened;
  if (entering) first ? seedUnderlay() : captureUnderlay();

  // On n'anime pas le tout premier rendu : il n'y a rien eu avant, et une
  // fiche qui monte au chargement ferait attendre la lecture pour rien.
  const opening = entering && !first && motion;

  paint(hash, route, opening ? 'open' : 'normal');
}

/* Dessine reellement la page. `mode` vaut 'open', 'close' ou 'normal'
   (voir render() juste au-dessus). */
function paint(hash, route, mode) {
  runCleanup();                       // on demonte proprement la page precedente

  /* Toute animation de fiche encore en attente devient caduque : c'est cette
     page-ci qui s'affiche, pas celle que le minuteur visait. Le cas concret :
     on ferme une etude de cas, et pendant les 440ms de sortie on clique
     "projet suivant" — sans cette ligne, le minuteur finirait par dessiner
     l'accueil par-dessus l'etude de cas qu'on vient de demander. */
  clearTimeout(state.sheetTimer);
  state.sheetTimer = null;
  state.pending = null;

  const body   = document.body;
  const pageEl = $('#page');
  const isCase = route.name === 'case';
  state.route = hash;

  // Choix de la page a construire.
  let node, title = SITE.name;
  switch (route.name) {
    case 'home':  node = pageHome();                    break;
    /* Un projet qui porte `format: 'article'` (content.js) est rendu par
       pageArticle() plutot que par pageCase() : meme route, meme ouverture
       en fiche, mais un texte illustre au lieu du gabarit etude de cas.
       Le test vit ICI et nulle part ailleurs — tout le reste du site (carte,
       route, fiche, croix, lien retour) ne sait rien de ce format. */
    case 'case':  node = route.project.format === 'article'
                    ? pageArticle(route.project)
                    : pageCase(route.project, route.caseId);
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

     Le theme clair est pose sur #page (la fiche) et non sur <html> comme
     avant : depuis que les etudes de cas s'ouvrent par-dessus la page
     precedente, le document doit rester bleu — c'est ce bleu qu'on voit sous
     la fiche et au rebond de defilement — pendant que la fiche seule passe
     au blanc. Repeindre <html> repeindrait aussi le calque du dessous, qui
     est cense montrer la page d'accueil telle qu'elle etait. */
  document.documentElement.dataset.theme = 'brand';
  pageEl.classList.toggle('theme-light', isCase);

  /* MODE FICHE. is-overlay commande tout l'habillage (fond blanc, coins
     arrondis, en-tete recouvert, croix visible, calque du dessous affiche).
     Une fois la nouvelle page dessinee, l'animation de fermeture n'a plus
     lieu d'etre : on retire is-closing dans tous les cas. */
  body.classList.toggle('is-overlay', isCase);
  body.classList.remove('is-closing');
  if (!isCase) clearUnderlay();       // on jette la photo : elle a servi

  // La page gap a sa propre navigation retour (pageEditorial()) : la pilule
  // du site, sous 860px, se retire donc pour elle exactement comme pour une
  // fiche ouverte (body.is-overlay .site-nav juste au-dessus) — meme motif,
  // meme raison (deux barres au meme endroit), voir styles.css section 12.
  body.classList.toggle('route-gap', route.name === 'gap' || route.name === 'about');
  // Demande utilisateur : le bouton "Back" flottant partage (#back-link)
  // reprend l'habillage de celui de la page gap SUR CETTE ROUTE SEULEMENT —
  // les autres pages qui le partagent (etude de cas sans nav laterale)
  // gardent leur apparence d'origine. Voir setupBackLink() plus bas pour la
  // fleche, et styles.css pour la bordure/le rayon scopes a cette classe.
  body.classList.toggle('route-about', route.name === 'about');

  /* LA BARRE DU MOBILE REVIENT AVEC LA PAGE.
     Sous 860px, la pilule du site est retiree (display:none) tant qu'une
     fiche est ouverte, parce que l'etude de cas a la sienne au meme endroit.
     En sortir la remettait d'un coup — le seul element non anime d'une
     fermeture qui, elle, dure 380ms. is-returning rejoue sur elle l'animation
     d'entree de la barre de sections (csBarIn, styles.css §12).

     POSEE ICI ET NON DANS swap(). La classe doit changer d'etat dans le meme
     recalcul que le is-overlay juste au-dessus : c'est lui qui rend la barre
     a l'affichage, et si les deux changements tombaient dans deux images
     differentes, on verrait la barre en place une image avant qu'elle ne
     parte d'en bas. En mode 'close' swap() est appele de façon synchrone
     (voir `plain` plus bas), donc les deux tiennent bien dans la meme tache.

     RETIREE PAR LE NETTOYAGE DE LA NAVIGATION SUIVANTE, pas par un minuteur.
     Rien ne presse : l'animation se termine sur l'etat naturel de la barre
     (fill backwards, cote CSS), donc une classe qui s'attarde ne fige rien.
     Et un minuteur de plus serait un minuteur de plus a annuler quand on
     repart avant la fin — cette fonction en compte deja un.

     Pas de garde pour le mouvement reduit : render() ne passe jamais par le
     mode 'close' quand il est actif, la fermeture y est un echange sec. */
  if (mode === 'close') {
    body.classList.add('is-returning');
    addCleanup(() => body.classList.remove('is-returning'));
  }

  /* L'en-tete du site reste VISIBLE sous la fiche (voir styles.css), mais il
     n'est plus atteignable : ce qui est derriere un calque ne se clique pas.
     inert coupe d'un coup le clic, le focus clavier et l'annonce vocale —
     trois choses qu'il faudrait sinon neutraliser separement, et qui se
     desynchronisent toujours. Concretement, ça evite qu'on ouvre la
     navigation mobile SOUS la fiche, ou qu'une tabulation aille se perdre
     sur un lien qu'on ne voit pas. */
  const siteHead = $('#site-head');
  if (siteHead) siteHead.toggleAttribute('inert', isCase);

  // La fonction qui remplace reellement le contenu.
  const swap = () => {
    main.replaceChildren(node);       // vide puis remplit, en une operation
    main.classList.remove('is-entering');

    /* LE FONDU DE PAGE (pageIn) NE JOUE QUE POUR UNE NAVIGATION ORDINAIRE.
       En ouverture comme en fermeture, il y a deja un mouvement a l'ecran —
       la fiche qui monte, la fiche qui s'efface sur la page floutee — et le
       contenu doit y etre solidaire, pas fondre pour son propre compte.

       Une premiere version le neutralisait en CSS pendant l'animation. Piege
       classique : une animation qu'on eteint par `animation: none` puis
       qu'on laisse revenir REDEMARRE de zero. La classe .is-opening retiree,
       pageIn repartait donc de opacity 0 — l'etude de cas s'effaçait juste
       apres s'etre posee. En fermeture, pire : le fondu s'appliquait a la
       page d'accueil une fois la photo du dessous jetee, donc sur le bleu
       nu. C'etaient les deux sauts. On ne pose plus la classe du tout.

       ET JAMAIS SUR UNE ETUDE DE CAS, meme en mode 'normal'. Deux cas y
       tombent : l'arrivee directe sur l'URL d'une fiche, et le mouvement
       reduit. pageIn pose un translateY sur #main, or un ancetre transforme
       devient le REFERENTIEL de ses descendants en position:fixed — le meme
       piege que la note plus bas sur #page, a ceci pres que la barre de
       navigation du mobile (.cs-nav sous 1000px, styles.css §12) vit, elle,
       DANS #main. Le temps du fondu, "en bas de la fenetre" devenait donc
       "en bas de l'article", soit plusieurs milliers de pixels hors champ :
       la barre manquait a l'ouverture, puis apparaissait d'un coup.
       Rien n'est perdu au passage — le commentaire de render() dit deja
       qu'on n'anime pas le premier rendu, et sous mouvement reduit le fondu
       etait de toute facon ramene a .01ms. */
    if (mode === 'normal' && !isCase) {
      // void main.offsetWidth force le navigateur a recalculer la mise en page
      // MAINTENANT. Sans cette ligne, retirer puis remettre la classe dans la
      // meme instruction ne relancerait pas l'animation.
      void main.offsetWidth;
      main.classList.add('is-entering');
    }

    // OUVERTURE : la fiche monte depuis le bas, le calque du dessous recule
    // et se floute. Meme technique que ci-dessus pour relancer l'animation,
    // et un minuteur pour retirer la classe une fois le mouvement fini —
    // laisser un transform actif sur #page ferait de lui le referentiel des
    // elements position:fixed qu'il contient (la croix cesserait de coller
    // a la fenetre). Voir styles.css, section 11 bis.
    if (mode === 'open') {
      body.classList.remove('is-opening');
      void body.offsetWidth;
      body.classList.add('is-opening');
      clearTimeout(state.sheetTimer);
      state.sheetTimer = setTimeout(() => {
        body.classList.remove('is-opening');
        state.sheetTimer = null;
      }, SHEET_IN_MS + 40);
    }
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
    setupGapBackToTop(route);
    setupOverlayClose(route);

    /* OU SE POSE-T-ON DANS LA PAGE ?
       Trois cas, du plus specifique au plus general :

       1. On REFERME une fiche et l'on retombe sur la page d'ou l'on venait :
          on restitue la position de defilement exacte qu'elle avait. C'est
          la promesse d'un calque — on repose le couvercle, on retrouve la
          grille de projets a l'endroit precis ou on l'avait laissee. Sans
          ca, revenir de la 3e etude de cas renvoie tout en haut a chaque
          fois, et il faut re-defiler pour cliquer la suivante.
       2. L'URL vise une ancre : on descend jusqu'a elle.
       3. Sinon : en haut.

       'instant' et non 'auto'. Le piege : 'auto' ne veut PAS dire
       "immediat", il veut dire "suis la propriete CSS scroll-behavior" — et
       elle vaut smooth sur <html> (voir le reset, section 2). Ces trois
       appels lançaient donc un defilement ANIME que le rendu de page en
       cours annulait aussitot : on n'arrivait jamais a destination. C'est ce
       qui faisait atterrir le retour d'une etude de cas en haut de
       l'accueil au lieu de la section Work. Ici on ne fait pas defiler, on
       POSITIONNE : ça doit etre instantane. */
    const anchor = hash.split('#')[2];
    if (mode === 'close' && state.snapKey === routeKey(hash)) {
      window.scrollTo({ top: state.snapY, behavior: 'instant' });
    } else if (anchor) {
      scrollToSection(anchor, 'instant');
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    // On deplace le focus sur <main> : sans ca, un lecteur d'ecran continue
    // d'annoncer l'ancienne page et l'utilisateur clavier repart du debut.
    main.focus({ preventScroll: true });

    if (route.name === 'home') setupHomeNavSpy();
    if (route.name === 'home') setupNavContrast();
    if (route.name === 'home') setupMagneticHeroLinks();
    if (route.name === 'home') setupMagneticCards();
    if (route.name === 'gap' || route.name === 'about') setupMagneticGapLinks();
    /* Sans condition de route : la pastille sert l'accueil ET les etudes de
       cas, et setupCursorPill sort d'elle-meme quand la page n'a aucune cible
       (About, l'article, une 404). */
    /* DESACTIVE — L'INTERRUPTEUR DE LA PASTILLE EST CETTE LIGNE.
       REVENIR EN ARRIERE : retirer les marques de commentaire ci-dessous, et
       rien d'autre. Tout le reste est intact et attend ce seul appel :
       setupCursorPill (section 8 quater), CURSOR_PILL_TARGETS, les libelles
       cardCursor / zoomCursor de content.js et les regles .card-cursor du CSS
       (section 7 bis).
       Pourquoi une seule ligne suffit a tout eteindre : sans cet appel, aucun
       element .card-cursor n'est cree et la classe has-card-cursor n'est
       jamais posee sur <body>. Or CHAQUE regle CSS de la pastille exige l'un
       ou l'autre — c'est le meme garde-fou qui protegeait deja du cas "le
       script n'a pas tourne" (voir sa note en section 7 bis du CSS). Le
       pointeur systeme reste donc visible partout, et le CSS conserve est
       inerte. */
    // setupCursorPill();
    if (route.name === 'case') setupCaseBehaviours();
    if (route.name === 'case') setupMoreDrawerEmbeds();
    if (route.name === 'case' && route.project.slug === 'constraints') setupConstraintBuilder();
    if (route.name === 'case' && route.project.slug === 'constraints') setupComponentsShowcase();
    if (route.name === 'case' && route.project.slug === 'constraints') setupLottieCarousel();
    if (route.name === 'case' && route.project.slug === 'petal-controls' && route.caseId === 'services-exclusion') setupImageCarousel();
    // Fit-Plans/Design a lui aussi un carrousel (l'ancien parcours vs le
    // nouveau, voir s.carousel dans content.js) — meme raison d'etre que la
    // ligne au-dessus.
    if (route.name === 'case' && route.project.slug === 'fit-plans') setupImageCarousel();
    // Hoot/Design a lui aussi un carrousel (evenements/vote, voir s.carousel
    // dans content.js) — meme raison d'etre que les deux lignes au-dessus.
    if (route.name === 'case' && route.project.slug === 'hoot') setupImageCarousel();
    // L'article salsa a lui aussi un carrousel (voir le media `type:
    // 'carousel'` de "Lines and lanes" dans content.js). setupImageCarousel()
    // ne fait rien s'il n'y a pas de [data-role="carousel"] dans la page, mais
    // on garde la condition de route par symetrie avec la ligne au-dessus.
    if (route.name === 'case' && route.project.format === 'article') setupImageCarousel();
    if (route.name === 'case' && route.project.slug === 'petal-controls' && route.caseId === 'services-exclusion') setupExclModal();
    if (route.name === 'case' && route.project.slug === 'yabara') setupCandidateCard();
    // Yabara/Admin - Back-office a lui aussi un carrousel (les 4 captures du
    // panneau admin, voir s.carousel dans content.js) — meme raison d'etre
    // que les lignes services-exclusion/fit-plans/hoot ci-dessus.
    if (route.name === 'case' && route.project.slug === 'yabara') setupImageCarousel();
    setupScrollProgress();
    setupVideos();
    // Sans condition de route, comme setupBeatSync() plus bas : la fonction
    // sort d'elle-meme s'il n'y a pas de .vplayer dans la page.
    setupVideoPlayers();
    setupZoomableMedia();
    // Sans condition de route : la fonction sort d'elle-meme s'il n'y a pas
    // de .beatsync dans la page (c'est-a-dire partout sauf l'article salsa).
    setupBeatSync();
    // Sans condition de route non plus : sort d'elle-meme s'il n'y a pas de
    // .cs-postit-board (c'est-a-dire partout sauf Hoot/Analysis).
    setupPostitBoard();
    // Sans condition de route non plus : sort d'elle-meme s'il n'y a pas de
    // .draggable-card (c'est-a-dire partout sauf la page gap pour l'instant).
    setupDraggableCards();
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
  //
  // EXCEPTION 'open' / 'close' : on ne cumule pas les deux mecanismes. En
  // ouverture, la fiche a deja sa propre montee. En fermeture, tout vient de
  // se jouer a l'ecran — la fiche est sortie par le bas et le calque du
  // dessous, deja denoue, montre exactement la page qu'on s'apprete a
  // redessiner. Un fondu supplementaire ferait clignoter une image qui n'a
  // pas bouge. L'echange doit etre instantane pour rester invisible.
  const plain = mode === 'open' || mode === 'close';

  if (!plain && document.startViewTransition && !prefersReducedMotion()) {
    document.startViewTransition(swap).updateCallbackDone.then(afterSwap, afterSwap);
  } else {
    swap();
    afterSwap();
  }
}


/* ==========================================================================
   7 bis. LE CALQUE DU DESSOUS
   --------------------------------------------------------------------------
   Une etude de cas s'ouvre "en fiche" : elle monte depuis le bas de l'ecran
   par-dessus la page precedente, floutee et reculee. Mais le site est une
   SPA a un seul <main> — la page precedente n'existe plus des l'echange.

   D'ou le principe, assume : ce n'est pas un vrai calque, c'est une PHOTO.
   Juste avant de remplacer le contenu, on clone le DOM de la page courante
   dans #underlay et on la fige au defilement qu'elle avait. C'est cette
   copie inerte qu'on floute. Elle ne reagit a rien, ne joue aucune video, ne
   coute aucun rendu supplementaire pendant la lecture — et personne ne peut
   faire la difference, parce qu'elle est floutee a 16px.

   L'illusion tient a une condition : que la photo montre EXACTEMENT ce que
   la personne regardait au moment du clic. D'ou le decalage vertical
   applique plus bas, et le remplacement des videos par leur derniere image.
   ========================================================================== */

/* Clone un element pour la photo, en retirant les identifiants.
   Deux elements portant le meme id dans la page, c'est du HTML invalide :
   $('#site-nav') pourrait alors renvoyer la copie inerte au lieu de la vraie
   navigation, et markActiveNav repeindrait la photo au lieu de l'en-tete. */
function snapClone(node) {
  const copy = node.cloneNode(true);
  copy.removeAttribute('id');
  $$('[id]', copy).forEach(n => n.removeAttribute('id'));
  return copy;
}

/* Les videos et les animations Lottie du clone ne rejouent pas : elles n'ont
   ni attribut autoplay (c'est setupVideos qui les lance, et il ne tourne pas
   sur la copie) ni le JS de dotlottie-wc. Elles s'afficheraient en noir au
   milieu de la photo.

   On dessine donc leur image ACTUELLE dans un <canvas> de meme taille. Le
   dessin depuis une video d'une autre origine (media.contra.com) "souille"
   le canvas : cela interdit d'en RELIRE les pixels (toDataURL), pas de
   l'afficher — et nous n'avons besoin que de l'afficher.

   Les tailles sont reprises au pixel pres sur les elements d'origine :
   .card__media video fait 92% de son cadre, un Lottie a son propre ratio...
   plutot que de dupliquer ces regles CSS, on mesure. */
function freezeSnapMedia(live, copy) {
  const swapIn = (target, replacement, box) => {
    replacement.style.width  = `${box.width}px`;
    replacement.style.height = `${box.height}px`;
    target.replaceWith(replacement);
  };

  const paintFrom = (source, sw, sh) => {
    if (!sw || !sh) return null;
    try {
      const canvas = el('canvas', { class: 'underlay__frame' });
      canvas.width = sw; canvas.height = sh;
      canvas.getContext('2d').drawImage(source, 0, 0, sw, sh);
      return canvas;
    } catch { return null; }        // navigateur recalcitrant : on retombe sur l'aplat
  };

  const videos = $$('video', copy);
  $$('video', live).forEach((src, i) => {
    const target = videos[i];
    if (!target) return;
    const box = src.getBoundingClientRect();
    // readyState >= 2 (HAVE_CURRENT_DATA) : il y a une image a copier.
    const frame = src.readyState >= 2 ? paintFrom(src, src.videoWidth, src.videoHeight) : null;
    swapIn(target, frame || el('div', { class: 'underlay__blank' }), box);
  });

  const lotties = $$('dotlottie-wc', copy);
  $$('dotlottie-wc', live).forEach((src, i) => {
    const target = lotties[i];
    if (!target) return;
    const box = src.getBoundingClientRect();
    // dotlottie-wc dessine dans un <canvas> a l'interieur de son shadow DOM.
    // Il est "open", donc lisible — mais si la librairie externe n'a pas
    // charge (CDN injoignable), il n'y a rien : d'ou le repli sur l'aplat.
    const inner = src.shadowRoot && src.shadowRoot.querySelector('canvas');
    const frame = inner ? paintFrom(inner, inner.width, inner.height) : null;
    swapIn(target, frame || el('div', { class: 'underlay__blank' }), box);
  });
}

/* Prend la photo. Appelee juste AVANT que paint() ne remplace le contenu —
   a ce moment, #page montre encore la page qu'on quitte et window.scrollY
   vaut encore sa position de defilement. */
function captureUnderlay() {
  const under = $('#underlay');
  const live  = $('#page');
  if (!under || !live) return;

  const inner = el('div', { class: 'underlay__inner' });
  const shot  = el('div', { class: 'underlay__shot' });

  /* Le clone est un bloc a part, hors du flux de la page : il n'herite ni de
     sa largeur ni de sa position. On lui rend les deux a la main.

     La largeur est mesuree sur l'original — sinon le texte se recompose et la
     photo ne correspond plus a ce qu'on voyait.

     La position, elle, se lit directement sur l'original : ou #page est a
     l'ecran en cet instant, c'est la que sa copie doit apparaitre. Une
     version anterieure decalait de -scrollY, en supposant que #page commence
     au sommet du document. Il n'y commence pas : l'en-tete du site est
     sticky, donc il occupe bien une place dans le flux, et #page demarre
     103px plus bas. La photo etait donc systematiquement 103px trop haute et
     tout glissait a l'ouverture. Mesurer plutot que supposer. */
  shot.style.width = `${live.offsetWidth}px`;
  shot.style.transform = `translateY(${Math.round(live.getBoundingClientRect().top)}px)`;

  const copy = snapClone(live);
  freezeSnapMedia(live, copy);
  shot.append(copy);
  inner.append(shot);

  /* Pas de copie de l'en-tete dans la photo : le vrai reste affiche, opaque
     et exactement au meme endroit, pendant toute la duree de la fiche (voir
     styles.css, section 11 bis). Une copie serait invisible sous lui. */

  under.replaceChildren(inner);

  state.snap    = true;
  state.snapKey = routeKey(state.route);   // state.route est encore l'ancienne route
  state.snapY   = window.scrollY;
}

/* LE CAS SANS PHOTO : on arrive directement sur l'URL d'une etude de cas
   (lien partage, rechargement, favori). Il n'y a rien a photographier — la
   page precedente n'a jamais existe dans cet onglet.

   Plutot que de laisser un aplat sombre derriere la fiche, on FABRIQUE la
   page d'accueil et on la floute. C'est exactement celle qu'on aurait eue en
   naviguant normalement, et c'est celle vers laquelle la croix ramene : la
   fermeture retombe donc sur une image qu'on avait deja sous les yeux.

   pageHome() ne pose aucun ecouteur, ne demarre rien : c'est une fabrique de
   DOM pur. Rien a nettoyer derriere elle. */
function seedUnderlay() {
  const under = $('#underlay');
  const head  = $('#site-head');
  if (!under) return;

  const inner = el('div', { class: 'underlay__inner' });
  const shot  = el('div', { class: 'underlay__shot' });
  // clientWidth et non innerWidth : la barre de defilement ne fait pas
  // partie de la largeur de mise en page.
  shot.style.width = `${document.documentElement.clientWidth}px`;
  // Cette page-la n'a jamais ete affichee : on la place ou elle SERAIT, en
  // haut du site, c'est-a-dire sous l'en-tete (qui occupe le flux).
  shot.style.transform = `translateY(${head ? head.offsetHeight : 0}px)`;

  // Meme structure que la vraie page (#page > main), pour que les selecteurs
  // de mise en page du CSS s'appliquent a l'identique.
  const fake = el('div', { class: 'page' });
  const body = el('main');
  body.append(pageHome());
  fake.append(body);

  /* Les videos et les Lottie doivent disparaitre AVANT insertion. Une video
     clonee resterait noire (personne ne la lancera), et un <dotlottie-wc>
     se reveillerait des son entree dans le document : il telechargerait son
     animation et la jouerait, invisible sous 16px de flou, pour rien. */
  $$('video, dotlottie-wc', fake).forEach(n => n.replaceWith(el('div', { class: 'underlay__blank' })));
  $$('[id]', fake).forEach(n => n.removeAttribute('id'));

  shot.append(fake);
  inner.append(shot);
  under.replaceChildren(inner);

  /* snapKey reste null : cette page reconstruite ne correspond a aucune
     position de defilement reelle. La fermeture jouera donc son animation
     (le calque est credible) mais retombera en haut de l'accueil plutot que
     de restituer un defilement qui n'a jamais eu lieu. */
  state.snap    = true;
  state.snapKey = null;
  state.snapY   = 0;
}

/* Jette la photo. On garde snapKey / snapY : afterSwap s'en sert juste apres
   pour reposer la page a la hauteur exacte ou on l'avait laissee. */
function clearUnderlay() {
  const under = $('#underlay');
  if (under) under.replaceChildren();
  state.snap = false;
}

/* La croix de fermeture. Sa destination suit le projet ouvert : une etude de
   cas "side quest" ramene a la section des side quests, pas au sommet de la
   page d'accueil. C'est un vrai lien : le changement de hash passe par
   render(), qui reconnait une fermeture et joue l'animation de sortie. */
function setupOverlayClose(route) {
  const close = $('#overlay-close');
  if (!close) return;
  const isCase = route.name === 'case';
  close.hidden = !isCase;
  if (isCase) close.href = `#/#${route.project.kind}`;
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
   (82px bureau / 0 sous 860px, ou l'en-tete est vide) : des qu'un navigateur
   rend l'en-tete un peu plus haut (police, marge du systeme...), .cs-nav —
   qui se colle a
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
   Elle change entre bureau et mobile (82px / 0 depuis que l'en-tete est vide
   sous 860px) : la lire garantit que le JavaScript et la feuille de style ne
   peuvent pas se contredire.

   Le repli est teste sur Number.isFinite et non par `|| 82`, qui confondait
   "rien lu" avec "lu zero" : sous 860px l'en-tete mesure vraiment 0px, et
   l'ancien code y repondait 82: les ancres se posaient 82px trop bas et la
   ligne du scroll-spy allumait la section suivante avec un ecran de
   retard. */
function readHeadHeight() {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--head-h');
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : 82;
}

/* Souligne l'entree de menu correspondant a la page affichee. */
function markActiveNav(route) {
  /* FICHE OUVERTE : ON NE TOUCHE A RIEN.
     L'en-tete reste affiche sous la fiche, a sa place, et il appartient a la
     page laissee derriere — pas a l'etude de cas posee par-dessus. Ce qu'il
     montrait au moment du clic doit donc rester tel quel : la section d'ou
     l'on vient si c'etait l'accueil, "About" si c'etait la page About.

     Sans ce retour anticipe, l'ouverture repeignait l'en-tete au type du
     projet (work / side) : on quittait la section Work pour une side quest et
     le surlignage sautait de l'une a l'autre, sur une barre censee etre
     l'image figee de ce qu'on venait de quitter. Et a la fermeture il fallait
     tout recalculer, ce qui se voyait.

     A la fermeture, la fiche redescend, is-overlay tombe, et cette fonction
     reprend la main normalement. */
  if (route.name === 'case' && document.body.classList.contains('is-overlay')) return;

  /* home: null, ET NON 'home', alors qu'une entree data-nav="home" existe
     de nouveau (barre d'onglets, sous 860px). Lui poser aria-current="page"
     sur l'accueil la laisserait allumee en permanence, y compris pendant que
     le scroll-spy allume Work ou Side quests plus bas : deux entrees
     soulignees a la fois, puisque cette fonction et le spy posent chacune
     leur valeur sans se consulter. Sur l'accueil, c'est le spy qui decide,
     Home comprise — elle surveille sec-hello comme les autres surveillent
     leur section.
     L'entree porte quand meme data-nav, pour l'autre moitie du travail fait
     plus bas : le balayage ne voit que les liens qui en portent un, et c'est
     lui qui EFFACE le surlignage en quittant l'accueil. */
  const map = { home: null, case: route.project?.kind, about: 'about', gap: null };
  const current = map[route.name] ?? null;
  // Scope au vrai en-tete : #underlay peut contenir un clone de la barre de
  // navigation (voir captureUnderlay), et une recherche a l'echelle du
  // document repeindrait aussi la copie figee.
  $$('#site-head .site-nav a[data-nav]').forEach(a => {
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
  /* Depuis que les etudes de cas s'ouvrent en fiche, la croix en haut a
     droite est la sortie de TOUTE etude de cas — y compris celles sans nav
     laterale, qui affichaient jusqu'ici le bouton flottant. Deux sorties
     pour une meme page, ce serait une de trop.
     'gap' a, elle aussi, son propre lien retour SUR BUREAU (pageEditorial(),
     .editorial__gapnav) — sticky dans sa propre colonne plutot que flottant
     au bord de la fenetre.
     SOUS 1000px en revanche, elle repasse par CE bouton partage plutot que
     par le sien : .editorial__gapnav vit dans #main, qui porte .is-entering
     (et donc un `transform`, meme translateY(0)) EN PERMANENCE tant que la
     page est affichee (voir la note pres du `return page` de pageEditorial())
     — exactement la raison documentee pour laquelle #gap-back-to-top vit HORS
     de #main. .editorial__gapnav n'y avait pas droit faute d'y avoir pense
     alors, et sous 1000px (une seule colonne, plus de grille pour separer
     spatialement nav et texte) ce `transform` ancetre cassait sa collant/son
     empilement au point que le texte de l'article semblait passer PAR-DESSUS
     le bouton au defilement (constate en pratique, pas seulement en theorie).
     #back-link, deja hors de #main, n'a pas ce probleme — meme bouton que
     About/etudes de cas, meme fiabilite. */
  const isMobile = window.matchMedia('(max-width: 1000px)').matches;
  const hasOwnBackLink = route.name === 'case' || ((route.name === 'gap' || route.name === 'about') && !isMobile);
  const deep = ['case', 'about', 'gap'].includes(route.name) && !hasOwnBackLink;
  link.hidden = !deep;
  if (!deep) return;
  link.href = route.name === 'case' ? `#/#${route.project.kind}` : '#/';
  /* Demande utilisateur : meme fleche SVG que le bouton "Back" de la page
     gap, pour About ET gap (sous 1000px) — les autres pages qui partagent ce
     bouton flottant (etude de cas sans nav laterale) gardent la fleche texte
     d'origine. .back-link__icon (styles.css) donne deja la bonne taille. */
  const icon = link.querySelector('span:first-child');
  icon.innerHTML = (route.name === 'about' || route.name === 'gap') ? arrowLeftIcon('back-link__icon') : '←';
}

/* Le bouton "Back to top" de la page gap (index.html, #gap-back-to-top) :
   voir la note qui l'accompagne pour pourquoi il vit hors de #main plutot
   que d'etre injecte par pageEditorial() comme le reste de la page — ici on
   ne fait plus que le montrer ou le cacher, jamais le (re)construire. */
function setupGapBackToTop(route) {
  const link = $('#gap-back-to-top');
  const show = route.name === 'gap' || route.name === 'about';
  link.hidden = !show;
  // About shares this button with gap (user request) — href must follow the
  // current route or it would jump away to /gap instead of scrolling in place.
  if (show) link.href = `#/${route.name}#top`;
}

/* Il y avait ici closeMobileNav(), qui refermait le tiroir de navigation
   mobile a chaque changement de page. Le tiroir n'existe plus : sous 860px la
   pilule est posee en permanence au bas de la fenetre (barre d'onglets,
   section 12 du CSS), donc il n'y a plus d'etat ouvert/ferme a tenir — ni
   .is-open, ni aria-expanded, ni bouton hamburger. */

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

  /* LA FIN DE LA BARRE EST LA FIN DE LA LECTURE, PAS LA FIN DU DOCUMENT.
     Une etude de cas se termine par "projet suivant" puis le pied de page :
     deux blocs qu'on ne lit plus, et qui pesaient pourtant dans le calcul.
     Les dernieres lignes de l'etude tombaient donc vers 75 %, et la barre
     n'atteignait 100 % qu'une fois les cartes du projet suivant depassees —
     elle promettait du texte qui n'existait pas.

     On s'arrete au haut de .cs-next quand il y en a un ; sinon, faute de
     sortie identifiable, le bas du document comme avant. C'est le meme point
     de rupture que le retrait de la barre flottante du mobile
     (updateNavRetreat) : les deux disent "l'etude est finie" au meme moment.

     Releve ici et non a chaque evenement : setupScrollProgress est rappelee a
     chaque rendu (voir render), donc le noeud ne peut pas changer entre-temps.
     Sa POSITION, elle, est remesuree a chaque fois — les images qui arrivent
     rallongent la page sous nos pieds. */
  const outro = $('.cs-next');

  const update = () => {
    // scrollHeight = hauteur totale du document.
    // innerHeight  = hauteur de la fenetre.
    // La difference est la distance maximale que l'on peut parcourir ; avec
    // une sortie, on s'arrete a l'instant ou son haut arrive en bas de la
    // fenetre, c'est-a-dire ou la derniere ligne lisible a fini de defiler.
    const end = outro
      ? outro.getBoundingClientRect().top + window.scrollY
      : document.documentElement.scrollHeight;
    const max = end - window.innerHeight;
    const pct = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
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

/* Animation d'apparition des post-its (voir postitBoardMarkup() plus haut) :
   pas le vol aleatoire exact de Webflow (impossible a reproduire sans son
   moteur IX2 — voir la note sur postitBoardMarkup()), mais un equivalent qui
   en garde l'esprit : chaque post-it se pose (fondu + leger deplacement) au
   defilement, avec son propre delai (voir le style inline transition-delay
   pose par postitBoardMarkup()) pour qu'ils n'apparaissent pas tous d'un
   bloc. Un IntersectionObserver PAR POST-IT (pas un seul sur la colonne) :
   chacun doit apparaitre a son propre passage dans le viewport. */
function setupPostitBoard() {
  const notes = $$('.cs-mini-postit');
  if (!notes.length) return;

  if (prefersReducedMotion()) {
    notes.forEach(n => n.classList.add('is-visible'));
    return;
  }

  // Sous 700px la piste devient horizontalement scrollable (voir
  // .cs-postit-board dans styles.css) : les post-its des colonnes 2 a 4
  // vivent alors hors du scrollport visible, et un IntersectionObserver PAR
  // POST-IT (root implicite = viewport) les clippe comme "non intersectants"
  // tant qu'on n'a pas fait defiler la piste jusque-la — certains restaient
  // donc a opacity:0 pour de bon si on ne pensait pas a glisser. Ici on
  // observe la piste ELLE-MEME : des qu'elle apparait a l'ecran
  // (verticalement, ce qui ne depend pas du defilement horizontal), tous ses
  // post-its passent d'un coup a l'etat final.
  if (window.matchMedia('(max-width: 700px)').matches) {
    const boards = $$('.cs-postit-board');
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          $$('.cs-mini-postit', e.target).forEach(n => n.classList.add('is-visible'));
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.2 });
    boards.forEach(b => io.observe(b));
    addCleanup(() => io.disconnect());
    return;
  }

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.2 });

  notes.forEach(n => io.observe(n));
  addCleanup(() => io.disconnect());
}

/* Les lecteurs video autonomes (voir videoPlayerMarkup()). Le pendant de
   setupVideos() juste au-dessus, pour les videos qui NE doivent PAS se lancer
   seules : ici c'est le lecteur qui decide, et les deux boutons ne font rien
   d'autre que basculer `paused` et `muted`.

   ON SUIT LES EVENEMENTS DU LECTEUR, PAS LE CLIC. Une lecture peut etre
   refusee (economiseur de batterie, onglet en arriere-plan) : mettre a jour
   l'icone depuis le clic afficherait une pause sur une video restee immobile.
   Les libelles passent par `aria-label` parce que les icones sont
   aria-hidden — c'est le seul nom accessible de ces boutons. */
function setupVideoPlayers() {
  $$('.vplayer').forEach(root => {
    const video    = root.querySelector('.vplayer__video');
    const playBtn  = root.querySelector('[data-act="play"]');
    const soundBtn = root.querySelector('[data-act="sound"]');
    if (!video || !playBtn) return;
    const d = t();

    const setPlayLabel = () => {
      playBtn.setAttribute('aria-label', video.paused ? d.playerPlay : d.playerPause);
      playBtn.setAttribute('aria-pressed', String(!video.paused));
    };
    const onPlay = () => {
      if (video.paused) video.play().catch(() => {});
      else video.pause();
    };
    playBtn.addEventListener('click', onPlay);
    video.addEventListener('play', setPlayLabel);
    video.addEventListener('pause', setPlayLabel);
    setPlayLabel();

    if (soundBtn) {
      const setSoundLabel = () => {
        soundBtn.setAttribute('aria-label', video.muted ? d.playerSoundOn : d.playerSoundOff);
        soundBtn.setAttribute('aria-pressed', String(!video.muted));
      };
      const onSound = () => { video.muted = !video.muted; setSoundLabel(); };
      soundBtn.addEventListener('click', onSound);
      setSoundLabel();
      addCleanup(() => soundBtn.removeEventListener('click', onSound));
    }

    // Une video laissee en lecture apres un changement de page continuerait de
    // jouer sans etre visible (et sans bouton pour l'arreter).
    addCleanup(() => { playBtn.removeEventListener('click', onPlay); video.pause(); });
  });
}

/* Glisser-deposer d'une carte "polaroid" (voir draggableCardMarkup() plus
   haut) : on ne deplace qu'un CALQUE VISUEL (--card-x/--card-y, lues par le
   transform pose en CSS), jamais la carte dans le DOM — elle reste un bloc
   normal dans le texte, seule son apparence suit le pointeur, exactement
   comme le fait la reference (lelezhang.design). Pointer Events unifie
   souris/tactile en un seul jeu d'ecouteurs ; `setPointerCapture` garde les
   evenements de deplacement attaches a la carte meme si le pointeur sort
   d'elle en cours de geste (glisser vite). On ignore un pointerdown qui
   commence sur .media-btn : cliquer lecture/son ne doit pas AUSSI declencher
   un glisser-deposer sur la carte qui les porte. */
function setupDraggableCards() {
  $$('.draggable-card').forEach(card => {
    let dragging = false, startX = 0, startY = 0, baseX = 0, baseY = 0;

    const onDown = ev => {
      if (ev.target.closest('.media-btn')) return;
      dragging = true;
      card.classList.add('is-dragging');
      startX = ev.clientX; startY = ev.clientY;
      baseX = parseFloat(card.style.getPropertyValue('--card-x')) || 0;
      baseY = parseFloat(card.style.getPropertyValue('--card-y')) || 0;
      card.setPointerCapture(ev.pointerId);
    };
    const onMove = ev => {
      if (!dragging) return;
      card.style.setProperty('--card-x', `${baseX + ev.clientX - startX}px`);
      card.style.setProperty('--card-y', `${baseY + ev.clientY - startY}px`);
    };
    const onUp = ev => {
      if (!dragging) return;
      dragging = false;
      card.classList.remove('is-dragging');
      card.releasePointerCapture(ev.pointerId);
    };

    card.addEventListener('pointerdown', onDown);
    card.addEventListener('pointermove', onMove);
    card.addEventListener('pointerup', onUp);
    card.addEventListener('pointercancel', onUp);
    addCleanup(() => {
      card.removeEventListener('pointerdown', onDown);
      card.removeEventListener('pointermove', onMove);
      card.removeEventListener('pointerup', onUp);
      card.removeEventListener('pointercancel', onUp);
    });
  });
}

/* La planche qui suit la video (voir beatSyncMarkup(), section 5e quater).

   LA GRILLE EST FAITE DE COMPTES, PAS DE CASES. `cfg.counts` decrit les 16
   temps de l'enchainement (2 mesures de 8), y compris les temps 4 et 8 —
   ceux-la n'ont pas de case sur la planche mais existent dans la mesure, et
   c'est justement ce que le compteur en haut de la video doit afficher. La
   correspondance vers les cases passe par `cfg.slotFrame`, qui vaut -1 sur
   ces deux temps : le cadre reste alors sur la derniere case, parce que le
   mouvement qu'elle decrit est encore en cours pendant la pause.

   Les temps vivent dans content.js, pas ici : ce sont des mesures faites sur
   un fichier precis, donc du contenu, pas du comportement. */
function setupBeatSync() {
  const box = $('.beatsync');
  if (!box) return;

  let cfg;
  try { cfg = JSON.parse(box.dataset.beatsync); } catch (e) { return; }
  const d      = t();
  const counts = cfg.counts || [];
  const toFrame = cfg.slotFrame || [];
  const video  = box.querySelector('.beatsync__player');
  const marker = box.querySelector('.beatsync__marker');
  const read   = box.querySelector('.beatsync__read');
  const badge  = box.querySelector('.beatsync__count');
  const spots  = $$('.beatsync__spot', box);
  const playBtn  = box.querySelector('[data-act="play"]');
  const soundBtn = box.querySelector('[data-act="sound"]');
  const speedBtn = box.querySelector('[data-act="speed"]');
  if (!video || !marker || !counts.length) return;

  /* --- sens 1 : la case commande la video ---
     ON MET EN PAUSE, on ne lance pas la lecture. Cliquer une case est un
     geste d'examen : on veut voir CETTE position, la comparer au dessin,
     y rester. Enchainer sur une lecture emporterait l'image deux temps plus
     loin avant meme d'avoir regarde. Le bouton reste la pour repartir. */
  spots.forEach(s => s.addEventListener('click', () => {
    const slot = Number(s.dataset.slot);
    video.pause();
    video.currentTime = counts[slot].t;
    show(slot);                 // immediat : `seeked` arrive une frame plus tard
  }));

  /* --- l'affichage du temps courant --- */
  let current = -1;
  const show = slot => {
    if (slot === current) return;
    current = slot;
    if (badge && counts[slot]) badge.textContent = counts[slot].n;
    const s = spots[toFrame[slot]];
    if (!s) return;             // temps 4 ou 8 : le cadre ne bouge pas
    marker.hidden = false;
    // Le cadre reprend la boite de la case : une seule source pour les deux,
    // donc rien a resynchroniser si les coordonnees changent dans content.js.
    marker.style.cssText = s.style.cssText;
    spots.forEach(x => x.classList.toggle('is-active', x === s));
    if (read) read.textContent = s.getAttribute('aria-label');
    revealBeat(s);
  };

  /* Sur telephone la planche deborde son rail (voir .beatsync__rail) : suivre
     le temps courant ne sert a rien s'il est hors champ. On centre donc la
     case active dans le rail — meme geste que revealInStrip() pour la barre
     de sections. `scrollLeft` et non scrollIntoView() : celui-ci fait aussi
     defiler la PAGE pour amener le rail a l'ecran, ce qui arracherait la
     lecture a chaque temps. Sur le bureau, le rail ne deborde pas et
     scrollLeft y est simplement sans effet.

     DEPLACEMENT INSTANTANE, PAS 'smooth'. Les temps se suivent a moins d'une
     seconde d'intervalle : une animation de defilement de ~300ms serait
     relancee avant d'avoir fini, et le rail glisserait en permanence sans
     jamais se poser. C'est le cadre qui doit attirer l'oeil, pas la planche
     qui bouge sous lui. (Accessoirement, un 'smooth' qui ne se termine
     jamais bloque le rendu dans un onglet en arriere-plan — vu au test.) */
  const rail = box.querySelector('.beatsync__rail');
  const revealBeat = s => {
    if (!rail || rail.scrollWidth <= rail.clientWidth) return;
    rail.scrollLeft = s.offsetLeft + s.offsetWidth / 2 - rail.clientWidth / 2;
  };

  show(0);

  /* --- sens 2 : la video commande la case --- */
  /* EPS : deux images a 60 i/s. Un `seekTo` ne tombe pas sur la valeur
     demandee au millieme — le lecteur se cale sur une frontiere d'image, et
     atterrit volontiers QUELQUES MILLISECONDES EN DESSOUS. Sans tolerance,
     cliquer la case du temps 5 posait currentTime a 6,7329 pour un temps
     annonce a 6,733, et `at()` renvoyait le temps 4 : la case cliquee
     s'allumait puis le `seeked` la reprenait pour la precedente. La marge rend
     le temps "acquis" 30ms plus tot, ce qui ne se voit pas et supprime la
     classe entiere de ce probleme. */
  const EPS = 0.03;
  const at = time => {
    // Dernier temps deja commence. Les temps sont ordonnes, la liste fait 16
    // entrees : une boucle a l'envers est plus courte qu'une dichotomie et se
    // relit sans effort.
    for (let i = counts.length - 1; i >= 0; i--) if (time + EPS >= counts[i].t) return i;
    return 0;
  };

  /* Suivi en requestAnimationFrame, PAS sur l'evenement `timeupdate`.
     `timeupdate` ne se declenche que 4 a 5 fois par seconde : sur des temps
     espaces d'une demi-seconde, le cadre arriverait jusqu'a un quart de temps
     en retard — visible, et sur une demonstration de synchronisation c'est
     precisement ce qu'il ne faut pas rater. La boucle ne tourne QUE pendant la
     lecture et s'arrete a la pause, donc elle ne coute rien au repos. */
  let raf = 0;
  const tick = () => {
    if (video.paused) { raf = 0; return; }
    const time = video.currentTime;
    // Fin de l'extrait : on reboucle au debut plutot que de laisser filer la
    // video sur ce qui suit (l'enchainement est refait plusieurs fois dans le
    // fichier, et la planche ne decrit que cette occurrence-ci).
    if (time >= cfg.end) video.currentTime = cfg.start;
    else if (time < cfg.start) video.currentTime = cfg.start;
    else show(at(time));
    raf = requestAnimationFrame(tick);
  };
  const startTicking = () => { if (!raf) raf = requestAnimationFrame(tick); };
  const stopTicking  = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };

  /* --- les deux commandes ---
     Le bouton ne porte plus de texte, seulement deux icones dont le CSS montre
     l'une ou l'autre selon `aria-pressed`. Le libelle passe donc par
     `aria-label` : c'est desormais le SEUL nom accessible du bouton, et
     l'oublier rendrait la commande muette pour un lecteur d'ecran. */
  const setPlayLabel = () => {
    if (!playBtn) return;
    playBtn.setAttribute('aria-label', video.paused ? d.playerPlay : d.playerPause);
    playBtn.setAttribute('aria-pressed', String(!video.paused));
  };
  const play = () => {
    // play() rend une promesse qui peut etre rejetee (economiseur d'energie,
    // onglet en arriere-plan). Ce n'est pas une erreur : la video reste
    // simplement en pause, et le libelle du bouton le dira.
    video.play().catch(() => {});
  };
  if (playBtn) playBtn.addEventListener('click', () => {
    if (video.paused) {
      // Repartir du debut de l'extrait quand la lecture est finie ou n'a
      // jamais commence : sans ca, un clic sur Play apres la fin relance sur
      // une image qui n'est plus decrite par la planche.
      if (video.currentTime < cfg.start || video.currentTime >= cfg.end) video.currentTime = cfg.start;
      play();
    } else {
      video.pause();
    }
  });
  if (soundBtn) soundBtn.addEventListener('click', () => {
    video.muted = !video.muted;
    soundBtn.setAttribute('aria-label', video.muted ? d.playerSoundOn : d.playerSoundOff);
    soundBtn.setAttribute('aria-pressed', String(!video.muted));
  });
  /* Vitesse : x1 <-> x0.5. `playbackRate` se pose directement sur le <video> —
     rien d'autre a recalculer, `tick()` lit `video.currentTime` a chaque
     image quelle que soit la vitesse a laquelle il avance. */
  if (speedBtn) speedBtn.addEventListener('click', () => {
    const slow = video.playbackRate !== 0.5;
    video.playbackRate = slow ? 0.5 : 1;
    speedBtn.textContent = slow ? '0.5×' : '1×';
    speedBtn.setAttribute('aria-label', slow ? d.playerSpeedNormal : d.playerSpeedHalf);
    speedBtn.setAttribute('aria-pressed', String(slow));
  });

  // Les libelles suivent l'ETAT du lecteur, pas le clic : la lecture peut etre
  // refusee, ou s'arreter d'elle-meme en fin de fichier.
  video.addEventListener('play',  () => { setPlayLabel(); startTicking(); });
  video.addEventListener('pause', () => { setPlayLabel(); stopTicking(); });
  video.addEventListener('seeked', () => show(at(video.currentTime)));
  addCleanup(stopTicking);

  /* Poser la premiere image de l'extrait plutot que celle du fichier (a 0s, un
     plan qui n'a rien a voir avec la planche). `preload="metadata"` suffit a
     ce que le navigateur sache seeker ; l'image arrive avec `seeked`. */
  const seedFrame = () => { video.currentTime = cfg.start; };
  if (video.readyState >= 1) seedFrame();
  else video.addEventListener('loadedmetadata', seedFrame, { once: true });
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
    // Glisser-deplacer dans les 4 directions une fois zoomee (souris desktop
    // — le tactile a deja le scroll natif d'overflow:auto dans les 2 axes).
    // `dragged` distingue un vrai drag d'un simple clic : sans lui, le
    // moindre glissement rebasculerait aussi le zoom via onClick ci-dessous.
    let startX = 0, startY = 0, startScrollLeft = 0, startScrollTop = 0, dragging = false, dragged = false;

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
      startY = e.clientY;
      startScrollLeft = thumb.scrollLeft;
      startScrollTop = thumb.scrollTop;
      thumb.setPointerCapture(e.pointerId);
    };
    const onPointerMove = e => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragged = true;
      thumb.scrollLeft = startScrollLeft - dx;
      thumb.scrollTop = startScrollTop - dy;
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
      //
      // --zoom-h0 : hauteur au repos figee en px juste avant le zoom-in (voir
      // .figure__frame.zoomable-media.is-zoomed dans styles.css, desktop
      // uniquement — ex. Yabara/Coming soon page). Sans elle, le cadre est un
      // bloc `height:auto` qui grandirait avec l'image agrandie (2.3x plus
      // haute) et deplacerait tout le contenu sous lui — la figer garde le
      // cadre a l'identique de son etat non-zoome, seul son CONTENU deborde
      // et devient scrollable. En px plutot qu'en % : une base fixe pour le
      // calc() du CSS, qui ne doit pas se recalculer sur le cadre lui-meme.
      if (!thumb.classList.contains('is-zoomed')) {
        const rect = thumb.getBoundingClientRect();
        thumb.style.setProperty('--zoom-h0', `${rect.height}px`);
      }
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
  // L'anneau de la barre flottante du mobile (styles.css §12). Le rail du
  // bureau et lui disent la meme chose au meme moment ; ils ne different que
  // par la forme, et chacun est display:none dans le contexte de l'autre.
  const ring    = $('#cs-ring');
  const ringBox = $('.cs-nav__ring');

  /* --- scroll-spy : quelle section est en train d'etre lue ? ---
     Calcul deterministe plutot qu'IntersectionObserver.

     Un observateur regle sur une bande centrale de l'ecran parait elegant,
     mais il a un angle mort : une section courte, ou la derniere d'une page,
     peut ne JAMAIS atteindre le milieu de la fenetre — le document cesse de
     defiler avant. Elle ne s'allume alors jamais.

     La regle ci-dessous n'a pas ce defaut : on prend la derniere section dont
     le haut est deja passe sous l'en-tete. Il y a donc toujours exactement une
     section active, et la derniere s'allume forcement en fin de page. */
  /* --- la nav suit la lecture, meme quand elle deborde ---
     Sous 1000px, .cs-nav n'est plus une colonne mais une barre horizontale
     defilante (voir styles.css, section 12) : sur un telephone, seules deux
     ou trois etapes tiennent a l'ecran. Surligner "Takeaways" ne sert alors
     a rien si l'etiquette est hors champ, a 200px sur la droite — la barre
     semble bloquee sur "Overview" pendant toute la lecture.

     On la fait donc glisser d'elle-meme jusqu'a l'etape en cours, dans les
     deux sens : vers la droite en descendant, vers la gauche en remontant.

     ELLE SE CENTRE, elle ne se contente plus d'entrer dans le champ. Une
     entree simplement "amenee a l'ecran" s'arrete la ou elle a ete rattrapee :
     contre le bord droit en descendant, contre le gauche en remontant. La
     position de l'etape en cours dans la pilule dependait donc du SENS de
     lecture, alors qu'elle ne dit rien — et collee au bord, on ne voyait plus
     ce qui vient apres. Au centre, elle est toujours au meme endroit, avec de
     part et d'autre ce qui precede et ce qui suit.

     Les extremites font exception d'elles-memes, sans condition a ecrire :
     scrollBy borne aux bouts de la course, donc la premiere entree reste
     collee a gauche et la derniere a droite — les centrer demanderait un vide
     que la liste n'a pas.

     Trois precautions :
       - on ne fait defiler QUE la liste, jamais la page. scrollIntoView()
         ferait les deux : il remonterait le document pour amener l'element
         a l'ecran, et le lecteur perdrait sa place au milieu d'un texte.
       - on mesure avec getBoundingClientRect et on defile en RELATIF
         (scrollBy). Les coordonnees absolues supposeraient que <li> se cale
         sur <ol> ; il se cale en fait sur .cs-nav, qui est positionnee et
         porte un padding. Un ecart relatif ne se trompe pas.
       - le seuil du pixel plus bas : sans lui, un ecart residuel d'un demi
         pixel relancerait un defilement anime a chaque changement d'etape. */
  const list = $('.cs-nav ol');

  const revealInStrip = (link) => {
    // En colonne (bureau), la liste ne deborde pas : rien a faire.
    if (!list || list.scrollWidth <= list.clientWidth) return;

    const item = link.parentElement;            // le <li>
    const itemRect = item.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();

    /* L'ecart entre le centre de l'etape et le centre de la pilule. Les
       retraits internes de la liste ne comptent pas ici : on vise le milieu de
       la zone visible, pas le milieu du contenu. */
    const delta = (itemRect.left + itemRect.width / 2)
                - (listRect.left + listRect.width / 2);
    if (Math.abs(delta) < 1) return;

    // scrollBy borne tout seul aux extremites ; inutile de le faire ici.
    list.scrollBy({ left: delta, behavior: prefersReducedMotion() ? 'instant' : 'smooth' });
  };

  /* On ne reagit qu'au CHANGEMENT d'etape. updateActive() tourne a chaque
     evenement de defilement — replacer la barre a chaque fois se battrait
     avec le doigt de quelqu'un en train de la faire glisser lui-meme. */
  let shown = null;

  const setActive = (id) => {
    links.forEach(a => a.classList.toggle('is-active', a.dataset.spy === id));
    if (id === shown) return;
    shown = id;
    const active = links.find(a => a.dataset.spy === id);
    if (active) revealInStrip(active);
  };

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
    // Rendue a l'appelant : la progression par section ci-dessous a besoin de
    // savoir laquelle est active, et la recalculer serait refaire cette boucle.
    return current;
  };

  /* --- progression DANS la section en cours (barre du mobile) ---
     La maquette souligne l'entree active d'une barre qui lui est propre :
     elle se remplit pendant qu'on lit cette etape-la, puis repart de zero sous
     la suivante. C'est une lecture differente du rail vertical du bureau
     (.cs-nav__prog), qui mesure l'avancement dans TOUT le processus — le
     bureau garde celui-la, le mobile n'affiche que celle-ci (styles.css §12).

     LE MEME REPERE QUE LE SCROLL-SPY, ET C'EST TOUT L'INTERET : une section
     s'allume quand son haut passe la ligne de declenchement, et s'eteint quand
     le haut de la suivante la passe a son tour. En mesurant le trajet entre
     ces deux memes instants, la barre atteint exactement 100 % au moment ou
     l'entree suivante s'allume. Prendre le haut de la fenetre comme repere,
     par exemple, laisserait toujours un reste visible au moment du relais.

     Derniere section : il n'y a pas de "suivante" dont attendre le haut. On
     vise alors son bas moins une hauteur d'ecran, comme le fait updateProgress
     — c'est-a-dire l'instant ou elle finit de defiler. */
  const sbars = new Map(links.map(a => [a.dataset.spy, $('.cs-nav__sbar', a)]));

  const updateSectionProgress = (sec) => {
    const lineY = readHeadHeight() + 80;
    const top   = window.scrollY;
    const start = sec.getBoundingClientRect().top + top;
    const next  = secs[secs.indexOf(sec) + 1];
    const end   = next ? next.getBoundingClientRect().top + top
                       : sec.getBoundingClientRect().bottom + top - window.innerHeight;
    const span  = Math.max(1, end - start);
    const p = Math.round(Math.min(100, Math.max(0, ((top + lineY - start) / span) * 100)));
    // Les inactives sont remises a zero : leur barre est masquee en CSS, mais
    // si on ne la rembobinait pas, revenir en arriere la montrerait pleine.
    sbars.forEach((bar, id) => { if (bar) bar.style.width = (id === sec.id ? p : 0) + '%'; });
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
    // height et non width : le rail est vertical, le long de la liste
    // (.cs-nav__prog, styles.css §8b). Il n'existe que sur le bureau — le
    // mobile masque tout le bloc et montre le meme p sous forme d'anneau,
    // juste en dessous.
    bar.style.height = p + '%';
    pct.textContent = p + '%';
    // aria-valuenow permet a un lecteur d'ecran d'annoncer la progression,
    // exactement comme la barre la montre a l'oeil.
    track.setAttribute('aria-valuenow', String(p));
    /* L'anneau de la barre flottante du mobile, alimente par le meme p : une
       seule mesure, deux formes. Le cercle porte pathLength="1" (voir
       pageCase), donc le motif de tirets est une FRACTION du tour — pas de
       2*PI*r a calculer, et changer le rayon dans la CSS ne casse rien ici.
       Aucune transition CSS ne l'accompagne : il est repeint a chaque
       evenement de defilement, une transition n'ajouterait que du retard. */
    if (ring) ring.setAttribute('stroke-dasharray', (p / 100) + ' 1');
    if (ringBox) ringBox.setAttribute('aria-valuenow', String(p));
  };

  /* --- la barre flottante du mobile se range sur "projet suivant" ---
     .cs-next est hors de la nav et hors des sections : c'est la sortie de
     l'etude de cas. Tant qu'elle n'a pas atteint la barre, celle-ci sert
     encore ; une fois dessous, elle ne ferait que recouvrir les cartes.

     On compare au HAUT de la barre plutot qu'au bas de la fenetre, pour que
     le retrait coincide avec le moment ou les deux se touchent vraiment.
     offsetHeight et non getBoundingClientRect : une fois rangee, la barre est
     translatee, et son rectangle mesure ne dirait plus ou elle revient.

     Sur le bureau la classe est posee de la meme facon mais ne fait rien —
     .is-gone n'existe que sous 1000px (styles.css §12), la ou la nav flotte.
     Un test de largeur ici ferait deux sources de verite pour un seuil. */
  const nav = $('.cs-nav');
  const csNext = $('.cs-next');
  const updateNavRetreat = () => {
    if (!nav || !csNext) return;
    const barTop = window.innerHeight - nav.offsetHeight - 40;
    nav.classList.toggle('is-gone', csNext.getBoundingClientRect().top <= barTop);
  };

  /* Un seul ecouteur pour les trois calculs. Le defilement se declenche des
     dizaines de fois par seconde : mieux vaut une fonction qui en fait trois
     que trois fonctions qui font la queue.
     { passive: true } promet au navigateur qu'on n'appellera pas
     preventDefault() ; il peut alors continuer a defiler sans nous attendre,
     ce qui garde le scroll fluide sur telephone. */
  const onScroll = () => {
    updateSectionProgress(updateActive());
    updateProgress();
    updateNavRetreat();
  };
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


/* ---- 8 bis. Le scroll-spy de l'en-tete ---------------------------------
   Le meme principe que la nav laterale d'une etude de cas, applique a la
   pilule du haut : en descendant l'accueil, l'entree de la section qu'on
   traverse s'allume — Work dans les projets, Side quests dans les side
   quests.

   MEME REGLE DE DECLENCHEMENT que .cs-nav, et pour la meme raison : on
   retient la derniere section dont le haut est deja passe sous l'en-tete,
   plutot que celle qui occupe le milieu de l'ecran. Une section qui
   n'atteint jamais le milieu — la derniere d'une page, quand le document
   cesse de defiler avant — ne s'allumerait sinon jamais.

   UNE DIFFERENCE, VOULUE : ici il peut n'y avoir AUCUNE entree allumee.
   Dans une etude de cas, chaque pixel de la page appartient a une etape du
   sommaire, donc il y en a toujours exactement une d'active. Reprendre la
   regle "a defaut, la premiere" allumerait Work pendant qu'on lit encore la
   salutation. Au-dessus de la premiere section surveillee, personne n'est
   allume — c'est la reponse juste.
   Depuis que Home (data-spy="sec-hello") existe, ce cas ne se produit
   pratiquement plus : le heros EST une section surveillee, et sec-hello
   commence au premier pixel de la page. Mais l'entree est masquee au-dessus
   de 860px (le nom de l'en-tete y tient son role), donc sur le bureau il n'y
   a toujours rien d'allume pendant le heros — ce qui reste correct : allumer
   un lien invisible ne se voit pas, et le spy ne peut pas en allumer un
   second par-dessus.

   aria-current="location" et non "page" : ce lien ne designe pas la page
   affichee (on y est deja), mais un endroit A L'INTERIEUR d'elle. C'est
   exactement la distinction que fait la specification, et les deux valeurs
   allument le meme soulignement en CSS. La distinction compte aussi au
   demontage : on ne retire QUE les "location", donc ce spy ne peut jamais
   effacer par megarde le "page" pose par markActiveNav. */
function setupHomeNavSpy() {
  const links = $$('#site-head .site-nav a[data-spy]');
  if (!links.length) return;

  /* On ne garde que les liens dont la section existe reellement, et on les
     range dans l'ordre du DOM des sections — c'est cet ordre-la que la
     boucle plus bas suppose, et rien ne garantit qu'il soit celui du menu. */
  const pairs = links
    .map(link => ({ link, sec: document.getElementById(link.dataset.spy) }))
    .filter(p => p.sec)
    .sort((a, b) =>
      (a.sec.compareDocumentPosition(b.sec) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1);
  if (!pairs.length) return;

  const clear = () => links.forEach(a => {
    if (a.getAttribute('aria-current') === 'location') a.removeAttribute('aria-current');
  });

  // On ne touche au DOM que lorsque la section change, pas a chaque pixel.
  let shown;
  const setActive = (link) => {
    if (link === shown) return;
    shown = link;
    clear();
    if (link) link.setAttribute('aria-current', 'location');
    state.navSpy = link ? link.dataset.spy : null;
  };

  /* On rallume d'abord ce qui etait allume la derniere fois qu'on a quitte
     l'accueil, AVANT toute mesure. Au retour d'une etude de cas, l'en-tete
     doit deja etre juste : c'est la meme page, a la meme hauteur, et rien ne
     justifie qu'elle clignote. La mesure qui suit ne fera que confirmer. */
  if (state.navSpy) {
    const known = links.find(a => a.dataset.spy === state.navSpy);
    if (known) { known.setAttribute('aria-current', 'location'); shown = known; }
  }

  const update = () => {
    // La meme ligne de declenchement que .cs-nav : sous l'en-tete collant,
    // plus une marge pour que la section s'allume quand son titre devient
    // lisible. Elle est plus basse que le point d'arrivee des ancres
    // (en-tete + 24px), donc cliquer "Work" allume bien Work.
    const lineY = readHeadHeight() + 80;
    let current = null;
    for (const p of pairs) {
      if (p.sec.getBoundingClientRect().top <= lineY) current = p.link;
      else break;                        // les sections sont dans l'ordre du DOM
    }
    setActive(current);
  };

  /* PAS DE REGLE "EN BAS DE PAGE, C'EST LA DERNIERE SECTION", contrairement a
     .cs-nav. Elle y sert a une derniere etape trop courte pour jamais franchir
     la ligne — le document s'arrete de defiler avant. L'accueil n'a pas ce
     probleme : Side quests commence a plus d'un ecran du bas, et passe donc la
     ligne bien avant qu'on y arrive.

     Gardee ici, elle causait un vrai bug. Elle se lit "hauteur de fenetre +
     defilement >= hauteur du document", et cette egalite est vraie de tout
     document plus court que sa taille definitive — ce qu'est l'accueil pendant
     les quelques instants ou ses images n'ont pas encore de hauteur. On
     revenait d'une etude de cas au milieu de Work, la page valait brievement
     un ecran et demi, la regle concluait "on est en bas" et allumait Side
     quests. L'erreur restait affichee jusqu'au defilement suivant.

     L'observateur ci-dessous traite la meme cause a l'endroit ou elle est :
     quand la hauteur du document change (une image arrive, une police se
     substitue, on tourne le telephone), les sections ne sont plus la ou on les
     avait mesurees. On remesure. */
  const ro = new ResizeObserver(update);
  ro.observe(document.body);

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  addCleanup(() => {
    window.removeEventListener('scroll', update);
    window.removeEventListener('resize', update);
    ro.disconnect();
    /* On ne nettoie PAS le surlignage ici. En quittant vers une page
       ordinaire, markActiveNav s'en charge une milliseconde plus tard (il
       retire aria-current de tous les liens qui ne correspondent pas). En
       ouvrant une etude de cas, au contraire, il faut qu'il RESTE : l'en-tete
       demeure visible sous la fiche, il appartient a la page qu'on a laissee
       derriere, et cette page-la etait bien sur cette section. */
  });
  update();
}

/* ---- Effet magnetique (demande utilisateur) --------------------------
   Inspire du composant "Magnetic button" de components.janustiu.com : le
   lien penche legerement vers le curseur en le survolant, puis revient au
   centre au relachement. Le JS ici ne fait que poser `transform` en ligne a
   chaque evenement pointeur — c'est la transition CSS (section 5 pour
   .petal-experiment et voisins, section "pied de page" pour
   .foot-hover-box) qui fait le lissage/le rebond ("damped spring" du prompt
   d'origine), pas une boucle requestAnimationFrame : plus simple, et
   coherent avec le reste du site qui laisse deja le CSS animer.
   MAX_X/MAX_Y par defaut (4px/3px) : quart des valeurs du prompt d'origine
   (16px/12px, pense pour un gros bouton pilule) — deux demandes
   utilisateur successives pour alleger l'effet sur du texte de phrase, ou
   un mouvement de cette ampleur se remarquait davantage.
   PAS de parallax sur le libelle : le span ne bouge pas independamment, il
   suit simplement le `transform` de l'ancre qui le contient.
   Souris/stylet seulement pour le suivi continu : au clavier, un leger
   soulevement fixe suffit (:focus-visible propre a chaque appelant, le
   contour vient deja de la regle :focus-visible globale) ; au tactile, un
   penchant fixe au contact plutot qu'un suivi du doigt (qui n'a pas de sens
   sur un mot de quelques caracteres, et le prompt lui-meme demande juste un
   "aperçu" fixe).
   `cleanup: true` enregistre le detachement via addCleanup() — a reserver
   aux liens qui vivent et meurent avec une route (le heros, reconstruit a
   chaque visite de l'accueil). Le pied de page n'est lui construit qu'une
   fois par session (voir start()) : ses liens n'ont donc pas besoin de
   cleanup, l'attache initiale suffit pour toute la session. */
function attachMagneticTilt(a, { maxX = 4, maxY = 3, cleanup = false } = {}) {
  const setTilt = (nx, ny) => {
    a.style.transform = `translate(${(nx * maxX).toFixed(2)}px, ${(ny * maxY).toFixed(2)}px)`;
  };
  const reset = () => { a.style.transform = ''; };

  const onPointerMove = e => {
    if (e.pointerType === 'touch') return;      // le tactile a son propre traitement ci-dessous
    const rect = a.getBoundingClientRect();
    const nx = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1));
    const ny = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height) * 2 - 1));
    setTilt(nx, ny);
  };
  const onPointerLeave = e => { if (e.pointerType !== 'touch') reset(); };
  // Tactile : un penchant fixe au contact ("preview a small fixed lean"),
  // pas un suivi de position — relache au retrait du doigt.
  const onPointerDown = e => { if (e.pointerType === 'touch') setTilt(.5, .5); };
  const onPointerUp = e => { if (e.pointerType === 'touch') reset(); };

  a.addEventListener('pointermove', onPointerMove);
  a.addEventListener('pointerleave', onPointerLeave);
  a.addEventListener('pointerdown', onPointerDown);
  a.addEventListener('pointerup', onPointerUp);
  a.addEventListener('pointercancel', onPointerUp);
  if (cleanup) addCleanup(() => {
    a.removeEventListener('pointermove', onPointerMove);
    a.removeEventListener('pointerleave', onPointerLeave);
    a.removeEventListener('pointerdown', onPointerDown);
    a.removeEventListener('pointerup', onPointerUp);
    a.removeEventListener('pointercancel', onPointerUp);
    reset();
  });
}

// Petal/Fit-Plans/Gekko (dans la phrase) + le lien "deux ans" (hors phrase,
// mais meme cycle de vie : reconstruit a chaque visite de l'accueil).
function setupMagneticHeroLinks() {
  if (prefersReducedMotion()) return;
  const links = $$('.hero__statement .petal-experiment, .hero__statement .fitplans-experiment, .hero__statement .gekko-experiment, .hero__gap.gap-experiment');
  links.forEach(a => attachMagneticTilt(a, { cleanup: true }));
}

// Toutes les entrees de la pilule (nom, Home/Work/Side quests/About,
// Resume/Email) : meme traitement magnetique que le pied de page et le
// heros. Pas de cleanup : contrairement au heros, .site-nav n'est jamais
// reconstruite (elle vit dans index.html, hors du routeur) — un seul appel
// au demarrage suffit pour toute la duree de la page.
function setupMagneticNavLinks() {
  if (prefersReducedMotion()) return;
  const links = $$('#site-nav a');
  links.forEach(a => attachMagneticTilt(a));
}

// Sitemap + Get in touch (8 liens) : tous portent .foot-magnetic (voir
// buildFooter()), meme traitement que .hero__gap — magnetique, sans boite ni
// soulignement (voir la regle .foot-magnetic dans styles.css).
function setupMagneticFooterLinks() {
  if (prefersReducedMotion()) return;
  const links = $$('#site-foot .foot-magnetic');
  links.forEach(a => attachMagneticTilt(a));
}

// Essai, retour possible : meme effet magnetique sur le bouton Back et les
// liens du corps de l'article gap (voir attachMagneticTilt plus haut) —
// cleanup:true comme setupMagneticHeroLinks() : pageEditorial() reconstruit
// tout le contenu a chaque visite de /gap, il faut donc redetacher les
// ecouteurs de la visite precedente avant d'en reposer de nouveaux.
function setupMagneticGapLinks() {
  if (prefersReducedMotion()) return;
  const links = $$('.editorial__gapnav .back-link, .editorial__block a');
  links.forEach(a => attachMagneticTilt(a, { cleanup: true }));
}

// #gap-back-to-top vit en permanence hors de #main (index.html, voir sa
// note plus haut) — jamais reconstruit, contrairement au reste de la page
// gap : un seul appel au demarrage suffit, meme raisonnement que
// setupMagneticFooterLinks()/setupMagneticNavLinks() (pas de cleanup).
function setupMagneticGapBackToTop() {
  if (prefersReducedMotion()) return;
  attachMagneticTilt($('#gap-back-to-top'));
}

// Lien mail du pied de page : interaction "cliquer pour copier" (demande
// utilisateur, cf. .link-muted.cursor-pointer sur krystianzun.com). Le texte
// visible passe par trois etats — l'adresse (repos), le rappel d'action (au
// survol/focus, desktop uniquement : pas de survol sur mobile) et la
// confirmation (apres un clic, sur TOUS les appareils) — mais ne touche
// jamais a .foot-mail__sizer, qui fixe la largeur de toute l'ancre sur
// l'etat par defaut (voir le commentaire dans buildFooter()) : aucun de ces
// trois textes n'est plus large que lui, donc la zone de survol/clic ne
// bouge jamais et ne peut pas clignoter au bord (bug reproduit sur le site
// de reference, ou un texte plus court que l'adresse retrecit la boite au
// survol, ce qui fait sortir la souris de la zone et clignoter l'etat).
function setupFootMailCopy() {
  const a = $('.foot-mail');
  if (!a) return;
  const label = $('.foot-mail__text-visible', a);
  const email = a.dataset.email;
  const hoverCapable = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  let resetTimer = null;
  const showHint  = () => { if (!a.classList.contains('is-copied')) label.textContent = t().footerMailHint; };
  const showEmail = () => { if (!a.classList.contains('is-copied')) label.textContent = email; };

  a.addEventListener('mouseenter', () => { if (hoverCapable()) showHint(); });
  a.addEventListener('mouseleave', () => { if (hoverCapable()) showEmail(); });
  a.addEventListener('focus', () => { if (hoverCapable()) showHint(); });
  a.addEventListener('blur',  () => { if (hoverCapable()) showEmail(); });

  a.addEventListener('click', (ev) => {
    ev.preventDefault();               // pas de client mail : on copie, comme sur krystianzun.com
    copyToClipboard(email);
    clearTimeout(resetTimer);
    a.classList.add('is-copied');
    label.textContent = t().footerMailCopied;
    resetTimer = setTimeout(() => {
      a.classList.remove('is-copied');
      // Toujours survole/focus a la fin du delai (souris restee dessus) :
      // retour au rappel d'action, pas droit a l'adresse — coherent avec
      // .foot-mail:hover qui, lui, n'a jamais quitte son etat CSS entre-temps.
      const stillEngaged = a.matches(':hover') || a.matches(':focus-visible');
      label.textContent = (hoverCapable() && stillEngaged) ? t().footerMailHint : email;
    }, 1800);
  });
}

// navigator.clipboard exige un contexte securise (https, ou localhost en dev) ;
// execCommand('copy') sert de repli pour le reste (http:// avant mise en ligne,
// vieux navigateurs). Aucune erreur remontee a l'utilisateur si les deux
// echouent : la pire consequence est de devoir copier l'adresse a la main.
function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopyToClipboard(text));
  } else {
    fallbackCopyToClipboard(text);
  }
}
function fallbackCopyToClipboard(text) {
  // .value, pas l'attribut (el()) : un <textarea> tire son contenu de son
  // texte/valeur en JS, jamais d'un attribut "value" HTML.
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch { /* tant pis, voir copyToClipboard() */ }
  document.body.removeChild(ta);
}

// Vignettes de projets (accueil) : la carte ENTIERE (pas seulement l'image)
// penche vers le curseur — maxX/maxY plus genereux que les liens texte
// (6/5 contre 4/3) car la carte est bien plus grande, sinon le mouvement se
// perd. Le zoom CSS de .card__media (scale 1.03 au survol, section 7) reste
// intact : il vit sur l'image, pas sur .card, donc les deux transforms ne se
// marchent pas dessus. Reconstruite a chaque visite de l'accueil (pageHome())
// : cleanup obligatoire, comme le heros.
function setupMagneticCards() {
  if (prefersReducedMotion()) return;
  const cards = $$('.home .card');
  cards.forEach(a => attachMagneticTilt(a, { maxX: 6, maxY: 5, cleanup: true }));
}


/* ---- 8 ter. LA PILULE SUR FOND CLAIR ----
   Alourdit la matiere de la barre de navigation, et elle seule, pendant
   qu'un visuel clair passe dessous. Le pourquoi — et le calcul de ce que le
   voile retenu rend vraiment en contraste, qui n'est PAS la norme — est dans
   styles.css, section 5, sous .site-nav.is-on-light. A lire avant de toucher
   a l'opacite dans un sens ou dans l'autre.

   Vaut pour les DEUX mises en page : la pilule collee en haut sur le bureau
   et la barre d'onglets fixee en bas sous 860px. Rien ici ne distingue les
   deux cas — la bande se mesure sur la pilule elle-meme, ou qu'elle soit.

   PAS D'ECOUTEUR DE DEFILEMENT. Un IntersectionObserver dont la racine est
   RETAILLEE sur la bande de la pilule repond exactement a la question posee —
   "est-ce qu'un visuel de carte touche cette bande ?" — et le navigateur la
   reevalue lui-meme, hors du fil principal. Un handler de scroll referait la
   meme mesure a chaque pixel pour changer une classe deux fois par page.

   CE QU'ON OBSERVE, C'EST .card__media : sur ce site, les seules surfaces
   claires qui defilent sous l'en-tete sont les visuels des cartes (le reste
   est le bleu de marque). Pas de lecture de pixels, donc, et pas de liste de
   couleurs a tenir a jour — juste "un visuel est-il la ?".

   UN Set ET NON UN BOOLEEN : deux cartes voisines peuvent toucher la bande en
   meme temps (la grille est a deux colonnes). Avec un booleen, la premiere
   qui sort eteindrait la classe alors que la seconde est encore dessous. */
function setupNavContrast() {
  const nav = $('#site-nav');
  if (!nav || typeof IntersectionObserver !== 'function') return;

  const lights = $$('#main .card__media');
  if (!lights.length) { nav.classList.remove('is-on-light'); return; }

  const over = new Set();
  let io = null;

  /* La bande se mesure, elle ne se devine pas : la pilule est collee EN HAUT
     sur le bureau et FIXEE EN BAS sous 860px (section 12), et rootMargin se
     compte depuis les bords de la fenetre. Des valeurs ecrites en dur
     designeraient le haut de l'ecran dans les deux cas, et la barre du bas —
     celle qui en a le plus besoin — ne s'allumerait jamais. */
  const build = () => {
    if (io) io.disconnect();
    over.clear();

    const r  = nav.getBoundingClientRect();
    const up = Math.round(r.top);
    const dn = Math.round(window.innerHeight - r.bottom);

    io = new IntersectionObserver(entries => {
      entries.forEach(e => e.isIntersecting ? over.add(e.target) : over.delete(e.target));
      nav.classList.toggle('is-on-light', over.size > 0);
    }, { rootMargin: `${-up}px 0px ${-dn}px 0px`, threshold: 0 });

    lights.forEach(m => io.observe(m));
  };

  build();

  /* Seul un redimensionnement deplace la pilule : collee ou fixee, elle ne
     bouge pas quand le document grandit (une image qui arrive, une police qui
     se substitue). Pas de ResizeObserver ici, contrairement au scroll-spy
     ci-dessus, qui lui mesure des sections et en a donc besoin. */
  window.addEventListener('resize', build);
  addCleanup(() => {
    window.removeEventListener('resize', build);
    if (io) io.disconnect();
    /* On eteint la classe en partant : l'en-tete survit au changement de
       page, et une etude de cas qui s'ouvre laisserait sinon la pilule
       alourdie pour un visuel qui n'est plus a l'ecran. */
    nav.classList.remove('is-on-light');
  });
}


/* ---- 8 quater. LE POINTEUR CHANGE EN PASTILLE ----
   DESACTIVE : plus personne n'appelle setupCursorPill. Tout ce qui suit est
   conserve intact et ne tourne pas. REVENIR EN ARRIERE : decommenter l'appel
   dans paint() (chercher "L'INTERRUPTEUR DE LA PASTILLE"), rien d'autre.

   Au survol de certains visuels, le pointeur systeme s'efface et une pastille
   prend sa place en le suivant : "View case study" sur les vignettes de
   l'accueil, "Zoom" sur les visuels agrandissables d'une etude de cas.

   UNE SEULE PASTILLE POUR LES DEUX, et une seule liste ci-dessous a etendre
   pour en ajouter d'autres. Deux mecanismes jumeaux auraient fini par diverger
   sur la duree d'apparition ou le decalage au pointeur, alors que c'est
   justement d'etre le MEME objet qui fait lire les deux comme une seule
   convention du site.

   Le libelle est fige au montage (label() est appele une fois par groupe) :
   les textes d'interface ne changent pas en cours de page.

   is-zoomed n'est PAS filtre ici. Un visuel deja agrandi se manipule au
   glisser (cursor: grab, section 8), la pastille n'y a plus de sens — mais
   cet etat va et vient au clic, bien apres ce montage. C'est donc le :has()
   du CSS qui l'exclut, la ou la condition est relue en permanence. */
const CURSOR_PILL_TARGETS = [
  { sel: '#main .home .card__media',                              label: () => t().cardCursor },
  { sel: '#main .zoomable-media:not(.zoomable-media--mobile-only)', label: () => t().zoomCursor }
];

/* CETTE FONCTION NE DECIDE PAS QUAND L'EFFET JOUE — elle ne teste ni la
   largeur, ni (hover: hover), ni is-zoomed. Tout cela vit dans le media de la
   section 7 bis de styles.css, qui allume ou eteint a la fois la pastille et
   le cursor:none. Le script ne fait que deux choses : mettre l'element dans le
   document, et y ecrire des coordonnees. C'est volontaire — un garde-fou en JS
   doublant celui du CSS, ce sont deux conditions qui finissent par ne plus dire
   la meme chose, et un redimensionnement de fenetre demanderait en plus d'etre
   surveille de ce cote-ci. Ecrire dans un element invisible ne coute rien.

   LES ECOUTEURS SONT SUR LES VISUELS, pas sur le document : ils ne se
   declenchent donc que la ou la pastille est visible, au lieu de suivre le
   pointeur sur toute la page pour rien.
   pointerenter EN PLUS de pointermove, pour deux raisons : la pastille s'allume
   des l'entree — sans lui elle apparaitrait une image a sa position precedente,
   ailleurs sur l'ecran, avant que le premier deplacement ne la recale — et
   c'est la qu'on pose le libelle du groupe qu'on vient d'entrer. */
function setupCursorPill() {
  const groups = CURSOR_PILL_TARGETS
    .map(g => ({ label: g.label(), nodes: $$(g.sel) }))
    .filter(g => g.nodes.length);
  if (!groups.length) return;

  /* ON BALAIE AVANT DE POSER, et ce n'est pas de la prudence gratuite : le cas
     se produit. afterSwap n'est pas appelee dans paint(), elle est DIFFEREE
     par updateCallbackDone (voir la note en fin de paint()). Deux rendus
     rapproches — un double clic sur une entree de la nav, le portail valide
     deux fois — s'enchainent donc ainsi :
       paint 1 : runCleanup (rien a faire), transition lancee, afterSwap differee
       paint 2 : runCleanup — la pastille du paint 1 N'EXISTE PAS ENCORE
       afterSwap 1 : pastille A
       afterSwap 2 : pastille B
     Deux pastilles dans <body>, dont une orpheline : ses ecouteurs sont sur
     des visuels que replaceChildren a jetes, elle ne suit donc plus rien et
     reste plantee au milieu de l'ecran. Observe a l'ecran avant d'etre corrige
     ici.
     Les autres setups ne posent pas le probleme : ils n'ajoutent pas d'element
     durable a <body>, ils accrochent des ecouteurs a des noeuds qui meurent
     avec la page. C'est la premiere fonction du fichier a le faire, donc la
     premiere a devoir se garantir unique elle-meme plutot que de compter sur
     l'ordre du nettoyage. */
  $$('.card-cursor').forEach(stale => stale.remove());

  const pill = el('div', { class: 'card-cursor', 'aria-hidden': 'true' });
  document.body.append(pill);
  /* Ce que le CSS attend pour oser masquer le pointeur systeme : la classe
     dit "le script tourne, il y a bien quelque chose pour le remplacer". */
  document.body.classList.add('has-card-cursor');

  /* On ne peint qu'une fois par image. Un pointermove peut arriver plusieurs
     fois entre deux rendus (souris a haute frequence, trackpad) : sans ce
     filtre, on ferait recalculer le style autant de fois pour un seul
     affichage. */
  let x = -1, y = -1, frame = null;         // -1 : le pointeur n'a pas encore parle
  let idle = false, scrollFrame = null;     // voir "le defilement perime le survol"
  const draw = () => {
    frame = null;
    pill.style.setProperty('--cc-x', x + 'px');
    pill.style.setProperty('--cc-y', y + 'px');
  };
  const move = ev => {
    x = ev.clientX; y = ev.clientY;
    if (frame === null) frame = requestAnimationFrame(draw);
    /* Le pointeur bouge : ce qu'il survole n'est plus une supposition, on rend
       la main au CSS (voir idle juste en dessous). */
    if (idle) { idle = false; document.body.classList.remove('cursor-pill-idle'); }
  };

  /* On garde la trace de ce qu'on a accroche : les libelles different d'un
     groupe a l'autre, donc les gestionnaires d'entree aussi, et removeEventListener
     exige la MEME reference de fonction que celle qu'on a posee. */
  const bound = [];
  groups.forEach(g => {
    const enter = ev => { pill.textContent = g.label; move(ev); };
    g.nodes.forEach(n => {
      n.addEventListener('pointerenter', enter);
      n.addEventListener('pointermove', move);
      bound.push({ n, enter });
    });
  });

  /* ---- LE DEFILEMENT PERIME LE SURVOL ----
     :hover n'est PAS reevalue pendant qu'on defile — le navigateur attend le
     prochain mouvement de souris. Le pointeur, lui, n'a pas bouge : c'est le
     contenu qui a glisse dessous. On descend donc une etude de cas a la molette
     en passant devant plusieurs visuels agrandissables, et la pastille reste
     accrochee au dernier survole, plantee au milieu de l'ecran — avec, pire, le
     pointeur systeme toujours masque sous elle.

     On rejuge donc nous-memes ce qui se trouve sous le pointeur, avec la SEULE
     question que le script sache poser sans repeter le CSS : "est-ce encore un
     des noeuds auxquels je me suis accroche ?". Le reste des conditions
     (is-zoomed, la largeur, hover: hover) reste au CSS, qui les relit tout
     seul — d'ou un simple interrupteur `cursor-pill-idle` plutot qu'une
     seconde copie des regles.

     elementFromPoint force un calcul de mise en page : une fois par image
     affichee (rAF), jamais une fois par evenement de defilement, qui arrive
     bien plus souvent.

     Tant que le pointeur n'a rien dit (x = -1), il n'y a rien a juger : on ne
     sait pas ou il est, et elementFromPoint(-1, -1) ne veut rien dire.

     capture: true — un `scroll` ne remonte pas depuis l'element qui defile ;
     seule la phase de capture sur window les voit tous. Une etude de cas en
     contient plusieurs (la bande de sections, un visuel agrandi qu'on promene),
     et ce sont justement ceux-la qui deplacent le contenu sous le pointeur. */
  const judge = () => {
    scrollFrame = null;
    if (x < 0) return;
    const under = document.elementFromPoint(x, y);
    const still = !!under && bound.some(b => b.n === under || b.n.contains(under));
    if (still === !idle) return;
    idle = !still;
    document.body.classList.toggle('cursor-pill-idle', idle);
  };
  const onScroll = () => {
    if (scrollFrame === null) scrollFrame = requestAnimationFrame(judge);
  };
  window.addEventListener('scroll', onScroll, { passive: true, capture: true });

  addCleanup(() => {
    bound.forEach(({ n, enter }) => {
      n.removeEventListener('pointerenter', enter);
      n.removeEventListener('pointermove', move);
    });
    window.removeEventListener('scroll', onScroll, { capture: true });
    if (frame !== null) cancelAnimationFrame(frame);
    if (scrollFrame !== null) cancelAnimationFrame(scrollFrame);
    document.body.classList.remove('has-card-cursor', 'cursor-pill-idle');
    pill.remove();
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
  const gateHi = $('.gate__hi');
  const gateQ  = $('.gate__q');

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
    // Meme balayage de presentation que .hero__hello (styles.css section 4) :
    // gate__hi d'abord, puis gate__q. Uniquement ici, pas dans le branchement
    // "prenom deja stocke" ci-dessus, qui saute le portail entierement.
    gateHi.classList.add('is-revealing');
    gateQ.classList.add('is-revealing');
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
    // On demande le balayage de presentation. Uniquement ici : un prenom
    // relu du stockage (open() plus haut) ou un "passer" n'ont rien a
    // presenter, la personne a deja vu le geste ou n'a pas donne de prenom.
    state.helloReveal = true;
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
  setupMagneticFooterLinks();
  setupMagneticNavLinks();
  setupMagneticGapBackToTop();
  setupFootMailCopy();

  const gate = setupGate();

  syncHeadHeight();

  /* --- Ecouteurs globaux, installes une seule fois --- */

  /* Les liens (et images) sont draggables par defaut dans le navigateur.
     Cliquer-glisser un lien demarre alors un vrai glisser-deposer natif :
     les evenements pointerdown/up ne se terminent plus normalement (le
     navigateur les avale pendant le drag), ce qui laisse nos effets au
     survol/pointer (tilt magnetique, etc.) dans un etat incoherent — et si
     le lien est relache ailleurs sur la page, certains navigateurs tentent
     une navigation/depot qui casse l'etat du routeur. On desactive donc ce
     glisser-deposer natif partout, site entier, une bonne fois. */
  document.addEventListener('dragstart', (ev) => {
    if (ev.target.closest('a, img')) ev.preventDefault();
  });

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

  /* UN LIEN QUI POINTE LA OU L'ON EST DEJA NE FAIT RIEN, et c'est le
     navigateur qui en decide : hashchange ne se declenche que si le hash
     CHANGE. Or toute la navigation du site passe par cet evenement.

     Concretement : on est sur #/#hello, on descend l'accueil, on clique
     "Marvin S." — dont le href est justement #/#hello. Le hash est deja
     celui-la, aucun evenement, rien ne bouge. Le lien parait casse, et il
     l'est. Meme chose pour "Work" quand on vient de la section Work, ou
     "Side quests" depuis les side quests.

     On intercepte donc le seul cas que le navigateur laisse tomber : le href
     est EXACTEMENT le hash courant. On refait alors le defilement nous-memes.
     Tous les autres liens gardent leur comportement normal — le hash change,
     hashchange se declenche, la logique habituelle s'applique.

     Delegue sur l'en-tete ET le pied de page plutot que pose lien par lien :
     ni l'un ni l'autre n'est jamais remplace par le routeur (le pied de page
     n'est reconstruit qu'au changement de langue, voir buildFooter()),
     l'ecouteur survit donc a toutes les navigations et n'a pas besoin d'etre
     nettoye. Meme bug constate sur "Home" dans le pied de page (demande
     utilisateur, surtout visible sur mobile ou c'est la seule facon de
     revenir en haut de l'accueil apres avoir tout defile) : rien ne le
     distingue de "Marvin S." dans l'en-tete, meme traitement. */
  const scrollToSameHashLink = (ev) => {
    /* On laisse passer tout clic qui n'est pas un simple clic gauche.
       Ctrl/Cmd + clic ouvre un onglet, Maj + clic une fenetre : ces clics
       emettent le meme evenement 'click', et un preventDefault les tuerait
       tous les trois. Un lien doit rester un lien. (Le clic du milieu, lui,
       emet 'auxclick' et ne passe deja pas par ici.) */
    if (ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;

    const link = ev.target.closest('a[href]');
    if (!link || link.getAttribute('href') !== location.hash) return;

    ev.preventDefault();
    /* 'instant' et non 'auto' pour le mouvement reduit : 'auto' veut dire
       "suis scroll-behavior", qui vaut smooth sur <html> — donc exactement
       l'animation qu'on cherchait a eviter. (Les deux autres appels de ce
       fichier ecrivent encore 'auto' ; ils ont le meme defaut.) */
    const behavior = prefersReducedMotion() ? 'instant' : 'smooth';
    const anchor = location.hash.split('#')[2];
    if (anchor) scrollToSection(anchor, behavior);
    else window.scrollTo({ top: 0, behavior });
  };
  $('#site-head').addEventListener('click', scrollToSameHashLink);
  $('#site-foot').addEventListener('click', scrollToSameHashLink);

  /* Echap referme la fiche d'etude de cas. Un element qui se pose par-dessus
     le reste doit toujours se refermer a la touche Echap ; c'est la sortie
     que tout le monde essaie en premier. On ignore la frappe si elle vient
     d'un champ de saisie (le portail du prenom a sa propre gestion).
     Il y avait ici une premiere branche pour le tiroir de navigation mobile,
     qu'on fermait avant la fiche. Le tiroir n'existe plus (voir la barre
     d'onglets, section 12 du CSS) : la fiche est desormais la seule chose
     qu'Echap ait a fermer. */
  document.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Escape') return;

    const tag = (ev.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;

    const close = $('#overlay-close');
    if (document.body.classList.contains('is-overlay') && close && !close.hidden) {
      location.hash = close.getAttribute('href');
    }
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
