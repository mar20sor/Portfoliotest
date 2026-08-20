# Journal de conception — Portfolio Marvin Sorhaindo

> Ce fichier existe pour que le contexte survive à une remise à zéro de conversation.
> Il enregistre **ce qui a été décidé, pourquoi, et ce qui reste à faire**.
> Si vous reprenez le projet dans une nouvelle session, lisez ce fichier d'abord.

**Dernière mise à jour :** 20 août 2026 — session 10 (visuels SoundCloud importés de marvinsrd.com dans l'étude de cas SoundCloud ; correctif de l'embed Figma de l'étude de cas Contraintes — format d'URL `embed.figma.com` + CSP, sélecteur de page enfin visible ; branche `interactive-components` [widget « components showcase », session 9] fusionnée dans `main`, poussée vers `origin`, puis supprimée locale+distante ; `CLAUDE.md`/`CONVERSATION.md` recréés après un deuxième incident d'exclusion accidentelle ; nouvelle règle : mise à jour automatique de ces deux fichiers après chaque fusion dans `main`)

---

## 1. Le brief

Refonte du portfolio de Marvin Sorhaindo, designer produit, pour candidater à des
postes UX / Product Design dans un marché saturé de juniors. Deux objectifs qui
tirent dans des directions opposées et qu'il faut concilier :

- montrer **l'expérience** (donc de la profondeur, des chiffres, du processus) ;
- montrer **la personnalité** (donc de la voix, des choix, des aveux).

Source du brief : `Portfolio PRD for Claude.md`.
Site actuel : <https://marvinsrd.com/>

---

## 2. Décisions prises avec Mar

Quatre questions posées au démarrage, quatre réponses :

| Question | Réponse retenue |
|---|---|
| Stack technique | HTML / CSS / JS **vanilla**, sans build |
| Langues | **Bilingue FR / EN** avec sélecteur *(retiré en session 4, voir §7)* |
| Texte « À propos » | **Brouillon rédigé** à partir des sources, à valider |
| Périmètre session 1 | **Site complet** d'un coup |

---

## 3. Décisions techniques, et pourquoi

### 3.1 Plusieurs fichiers plutôt qu'un seul — *écart assumé au brief*

Mar a choisi « un seul fichier ». Le site a été livré en **quatre fichiers**
(`index.html`, `css/styles.css`, `js/content.js`, `js/app.js`).

**Pourquoi cet écart.** Le brief demande aussi d'annoter chaque ligne pour un
débutant, et un contenu bilingue complet. Les trois exigences réunies donnent un
fichier unique de plus de 3 000 lignes, dans lequel corriger une faute de frappe
devient un exercice de patience. La séparation retenue conserve l'esprit de la
demande — **aucun build, aucune dépendance, aucun `npm install`** — tout en
gardant chaque fichier navigable.

**Si vous préférez vraiment un fichier unique :** inliner `styles.css` dans une
balise `<style>` et les deux JS dans un `<script type="module">` fonctionne sans
rien changer d'autre. Comptez ~3 500 lignes.

### 3.2 Routage par `#` (hash) plutôt que par chemins d'URL

`#/work/constraints` plutôt que `/work/constraints`.

**Pourquoi.** Une SPA à chemins classiques exige que le serveur renvoie
`index.html` pour *toutes* les URL. C'est une configuration serveur, variable
selon l'hébergeur, et impossible en ouvrant simplement le dossier en local.
Le hash est traité entièrement par le navigateur : le site fonctionne tel quel
sur GitHub Pages, Netlify, un dossier local, n'importe où.

**Le compromis :** les URL sont un peu moins élégantes.
**Pour passer aux chemins propres plus tard :** remplacer `location.hash` par
l'History API dans `app.js` (section 7) et déposer une copie d'`index.html`
nommée `404.html` à la racine.

### 3.3 Aucune police téléchargée

Le site utilise la pile système (`-apple-system`, `Segoe UI`, `Roboto`…).
0 Ko, 0 requête, aucun clignotement de texte au chargement. Le brief demandait
un chargement « le plus court possible » : ne rien charger est imbattable.

**Si vous voulez une police de marque :** une seule graisse variable en
`woff2`, en `preload`, avec `font-display: swap`. Comptez 20–40 Ko et un
scintillement au premier affichage. À arbitrer.

### 3.4 Le prénom du visiteur reste en mémoire

`state.visitor` dans `app.js`. Aucune base, aucun cookie, aucun envoi réseau
(le `<form>` n'a pas d'attribut `action`). Rafraîchir la page repose la question.

Quatre protections empilées contre l'injection (XSS), détaillées en commentaire
dans `app.js` section 2 : liste blanche de caractères, limite de longueur,
insertion via `textContent` uniquement, et une `Content-Security-Policy` dans
`index.html`.

**Pour ne pas redemander le prénom à chaque rechargement :** la marche à suivre
avec `sessionStorage` est écrite en fin de section 9 dans `app.js`.

### 3.5 Les visuels viennent des PDF, pas de placeholders

Le brief prévoyait des images générées faute de mieux. Les PDF Petal contenaient
en réalité les maquettes en **vectoriel** : elles ont été extraites et rendues en
2,5× puis converties en WebP (avec repli PNG via `<picture>`).

**Conséquence à connaître :** les annotations sont *incrustées dans les images*.
Le cas « Exclusion de services » existait en anglais (`Services exclusion.pdf`),
donc ses figures ont les deux versions. **Contraintes** et **Transfert de DME**
n'ont que la version française : en anglais, ces figures portent une mention
« Figure annotated in French ». Honnête, mais imparfait.

**Pour corriger :** exporter les planches FR restantes en anglais depuis Figma,
les nommer `constraints-2-mapping-en.png` etc., puis remplacer `frOnly: true` par
`altImage: 'nom-du-fichier-en'` dans `content.js`.

### 3.6 Couleurs — thème repris de Figma (session 2)

Le site a été rebasculé sur la maquette `Portfolio_Explorations`, nœud
`2309:3835`. Les valeurs viennent de `get_design_context`, elles ne sont pas
approximées :

```css
--blue: #2078F0;   /* fond de tout le site */
--lime: #BEF007;   /* accent du héros */
```

**Elles sont en haut de `css/styles.css` et pilotent tout, affiches SVG
comprises.** Le fichier Figma d'origine (`figma.com/site/…`) était un fichier
**Figma Sites**, un type que le MCP Figma ne sait pas lire — d'où la copie dans
un fichier Design classique.

### 3.7 Contraste : écart WCAG assumé

Mesures de la palette Figma :

| Paire | Ratio | Seuil AA | Verdict |
|---|---|---|---|
| Blanc sur `#2078F0` | 4,19:1 | 4,5:1 (texte courant) | échec |
| Blanc sur `#2078F0` | 4,19:1 | 3:1 (≥ 24 px) | passe |
| Lime sur `#2078F0` | 3,13:1 | 3:1 (héros 32 px) | passe |
| Bleu sur pastille blanche | 4,19:1 | 4,5:1 | échec |

Le héros et les titres de cartes passent. La navigation, les étiquettes et les
légendes — tout ce qui est en 16 px — sont en dessous du seuil.

**C'est une décision explicite de Mar : la fidélité à la maquette prime sur la
conformité.** Consignée ici une fois, pas rappelée ailleurs.

Si l'arbitrage change un jour : `#1571EF` rend l'ensemble conforme (blanc
4,53:1, lime 3,37:1) en abaissant la luminosité de 2 %, à teinte et saturation
identiques. Une seule ligne à changer.

### 3.8 Police Raleway — la seule requête externe

La maquette impose Raleway ; aucune police système ne s'en approche. Elle n'a
pas pu être téléchargée pour être auto-hébergée (le proxy du bac à sable bloque
`fonts.gstatic.com` comme le reste), donc elle est chargée depuis Google Fonts,
avec `preconnect` et `display=swap`.

Deux conséquences : c'est la seule requête réseau externe du site, ce qui
contredit l'exigence initiale de tout charger en une fois ; et la CSP a dû être
assouplie pour autoriser `fonts.googleapis.com` et `fonts.gstatic.com`.

**Pour revenir à zéro requête externe :** télécharger les 4 graisses (300, 400,
500, 600) en `.woff2`, les poser dans `site/assets/fonts/`, remplacer la balise
`<link>` par des règles `@font-face`, et retirer les deux autorisations Google
de la CSP. La marche à suivre est aussi en commentaire dans `index.html`.

### 3.8 bis Médias du projet Contraintes — hébergés chez Contra

La vidéo d'ouverture et les trois captures du projet Contraintes viennent de
la page Contra de Marvin. Elles **ne sont pas dans le dépôt** : le code pointe
vers `media.contra.com` (le proxy du bac à sable bloque ce CDN, je n'ai pas pu
les télécharger).

**Ce que ça implique.** Si le projet est supprimé, renommé, ou si Contra change
ses URLs, ces médias disparaissent du site sans prévenir. C'est la deuxième
dépendance externe du site, après Google Fonts.

**Pour passer en local** — tout est centralisé dans `MEDIA`, en haut de
`content.js` :

1. Télécharger les fichiers depuis Contra.
2. Les poser dans `site/assets/media/`, en gardant les identifiants comme noms
   de fichier (`fwfmk99wycaup34crhb4.mp4`, `ytoa4swb5caon0onh5yb.webp`, etc.).
3. Remplacer les deux bases d'URL par `assets/media/`.
4. Retirer `media.contra.com` de la CSP dans `index.html`.

**Il manque trois médias.** Les illustrations animées de la section Conception
(« Blocking constraint », « Protection constraint » ×2) sont chargées par
JavaScript sur Contra : leurs URLs ne sont pas dans le HTML, et l'extension
Chrome n'était pas connectée pour aller les chercher. L'emplacement est prêt
dans `content.js` (`media: { 0: [...] }` de la section `design`), avec la
marche à suivre en commentaire — un clic droit sur chaque animation suffit.

### 3.9 Ce que la maquette a apporté d'autre

- **Copie du héros reprise mot pour mot** en anglais, puis traduite. Elle
  mentionne **Gekko**, un employeur absent de toutes les sources — affiché
  souligné mais sans lien, faute de projet associé.
- **Les cartes utilisent désormais de vraies captures** (dernière figure du cas)
  plutôt que l'affiche SVG générée, pour les trois cas Petal.
- **L'image de la carte 1 de la maquette** (une animation exportée depuis
  jitter.video) n'a pas pu être récupérée : les URLs d'assets Figma sont
  bloquées par le proxy. La carte utilise la maquette finale du cas à la place.
- Les titres de cartes acceptent `**du gras**` façon Markdown, pour mettre en
  valeur les chiffres comme dans la maquette (« de **24 à 9** »).

---

## 4. Ce qui a été construit

```
site/
  index.html            coquille : loader, portail, en-tête, main vide, pied de page
  css/styles.css        design system + toute la mise en page (13 sections numérotées)
  js/content.js         TOUT le texte (anglais seul depuis la session 4) — c'est ici qu'on modifie le contenu
  js/app.js             routeur, sécurité, scroll-spy, affiches SVG
  assets/img/           13 figures extraites des PDF (WebP + repli PNG)
```

**Pages :** accueil · Projets (5) · À côté (2) · À propos · « Pourquoi je n'ai pas
travaillé pendant 2 ans » · 404.

**Fonctionnalités du brief, toutes livrées :** chargement unique et préchargement
des images · transitions entre pages (View Transitions API avec repli CSS) ·
loader piloté par la progression réelle · formulaire du prénom sécurisé ·
« Bonjour [prénom] » · nav latérale collante avec scroll-spy · indicateur de
progression (global + par étude de cas) · lien retour permanent · lien vers
l'étude de cas suivante · responsive · code annoté ligne à ligne.

**Poids première visite :** ~657 Ko dont 495 Ko d'images. Le code seul fait
51 Ko une fois compressé. Zéro dépendance, zéro requête externe, zéro traqueur.

---

## 5. Ce qui reste à faire — par ordre d'importance

### Bloquant avant publication

1. **Écrire l'article « Pourquoi je n'ai pas travaillé pendant 2 ans ».**
   `content.js` → `PAGES.gap`. La structure est là (ce qui s'est passé / ce que
   j'ai fait / ce que ça a changé / aujourd'hui), les paragraphes entre crochets
   sont des consignes de rédaction, pas du contenu. Ils s'affichent en jaune
   sur le site pour être impossibles à oublier.
2. **Compléter la section « Et sinon » de la page À propos.** Même principe.
3. **Relire tout le brouillon « À propos ».** Il a été rédigé à partir des
   sources : il est plausible, pas vérifié.
4. **Résumer le mémoire de master** (2–3 phrases) dans `PROJECTS` →
   `masters-essay`, puis retirer `isDraft: true`.
5. **Vérifier le bleu et le jaune** (voir 3.6).

### Important

6. **Ajouter une photo.** Le site n'en a aucune. Sur un portfolio de designer,
   c'est un manque : les recruteurs veulent un visage.
7. **Vérifier le lien du CV.** Il pointe encore vers `marvinsrd.com/documents/`.
8. **Tester sur un vrai téléphone.** Le responsive a été vérifié par le code,
   pas sur un appareil.
9. ~~Vérifier le rendu de l'embed Figma en production~~ **Fait, session 10.**
   Le correctif de session 8 (`frame-src` CSP) était nécessaire mais pas
   suffisant : l'URL elle-même (format `www.figma.com/embed?embed_host=
   share&url=...`) ignorait silencieusement `page-selector`. Remplacée par
   le format `embed.figma.com/design/{file-key}`, confirmée dans un vrai
   navigateur (canevas + menu déroulant du sélecteur de page tous deux
   visibles) — voir « Constraints case study restructure » dans `CLAUDE.md`
   et le détail en session 10 ci-dessous.
10. ~~Décider du sort du widget « components showcase »~~ **Fait, session
    10.** `interactive-components` fusionnée dans `main`, poussée vers
    `origin`, puis supprimée (locale et distante) — le widget est
    maintenant sur le site publié. Voir la session 10 ci-dessous.

### Souhaitable

10. Figures anglaises pour Contraintes et Transfert de DME (voir 3.5).
11. Compresser davantage les images si le temps de chargement gêne.
12. Ajouter une image `og:image` pour les partages LinkedIn.

---

## 6. Évaluation du portfolio actuel (marvinsrd.com)

Demandée dans le brief. Ce qui a été observé, et ce que la refonte en fait.

**Ce qui marchait déjà et a été conservé**
La question du prénom à l'arrivée : mémorable, personnelle, presque personne ne
le fait. Elle est reprise telle quelle. Les études de cas ont une vraie
structure de processus et des chiffres — c'est au-dessus de la moyenne junior.

**Les cinq problèmes identifiés**

1. **« Yet another junior designer… »** figure sur la page d'accueil. L'intention
   auto-dérisoire est lisible, mais un recruteur qui scanne dix portfolios lit la
   phrase, pas l'ironie. Vous vous étiquetez junior avant qu'il ait décidé.
   → Remplacé par une affirmation vérifiable : « 24 règles ramenées à 9 ».

2. **« Je conçois des interfaces depuis 3 ans »** est une durée, pas une
   compétence. Tout le monde peut l'écrire.
   → Le hero dit maintenant *ce que vous savez faire* et *sur quoi*.

3. **Le travail chez Petal était absent du site.** C'est votre expérience la plus
   sérieuse — SaaS santé, enjeux réels, contraintes fortes — et le portfolio ne
   montrait que des projets d'école et une refonte de 2020.
   → Les trois cas Petal sont désormais en tête et portent le site.

4. **Aucune hiérarchie entre projets pro et projets d'étude.** Soundcloud et Hoot
   étaient présentés au même niveau qu'un mandat client.
   → Séparation « Projets » / « À côté ». Hoot y gagne : présenté comme un
   hackathon d'une semaine terminé deuxième, il devient une anecdote qui vous
   sert, au lieu d'un case study qui vous dessert par comparaison.

5. **Le trou de deux ans n'était traité nulle part.** Un recruteur le voit en
   huit secondes et, sans explication, comble le vide lui-même — presque jamais
   en votre faveur.
   → Article dédié, lié depuis la page d'accueil. Le prendre de front est le
   seul choix qui vous laisse la main.

**Trois suggestions au-delà du brief**

- **Le cas « Exclusion de services » est votre meilleure carte.** C'est le seul
  qui raconte un échec après mise en production et sa correction. Les recruteurs
  seniors cherchent exactement ça, parce que c'est indissimulable : on ne peut
  pas l'inventer sans avoir livré. Le site le place en deuxième position pour
  cette raison. En entretien, ouvrez avec lui.

- **Les chiffres font le tri.** « 24 → 9 », « 815 réponses », « 84 % appelaient
  au lieu de commander » sont ce qui distingue un dossier d'un autre à volume de
  travail égal. Ils sont partout dans la nouvelle version. Continuez à en
  collecter dans vos prochains postes, même approximatifs.

- **Assumez le SaaS métier comme une spécialité.** Beaucoup de juniors montrent
  une app de méditation et une refonte de site e-commerce. Peu peuvent parler de
  planification hospitalière et de synchronisation de données cliniques. C'est un
  positionnement rare, et rare vaut mieux que joli.

---

## 7. Historique des sessions

### Session 1 — 17 août 2026
Lecture du brief, extraction des 4 PDF Petal (texte + figures vectorielles),
récupération de Fit-Plans / Soundcloud / Hoot depuis le site actuel, rédaction du
contenu bilingue complet, construction du site, tests, corrections d'accessibilité,
mise sous Git.

**Anomalies trouvées et corrigées pendant les tests :**
- Le lien « Lire le processus complet » produisait `#/work/constraints#audit`,
  que le routeur lisait comme une route inconnue → affichait une 404. Le routeur
  sépare désormais la route de l'ancre. Les liens de la nav latérale sont, du
  coup, devenus de vrais liens partageables.
- Trois contrastes sous le seuil WCAG AA (voir 3.7).

### Session 2 — courant août 2026
Rebasculage du thème sur la maquette Figma `Portfolio_Explorations` (bleu/lime,
voir 3.6), refonte de l'accueil, page « études de cas » : fond blanc, nav
latérale réparée, intégration des médias Contra du projet Contraintes
(vidéo d'ouverture + 3 captures), génération de 3 animations depuis les
fichiers Lottie sources, puis remplacement par les exports vidéo Jitter
fournis par Mar (voir historique git `5b4a897`…`1df6c82`).

### Session 3 — 18 août 2026
**Animations du projet Contraintes : passage de la vidéo Jitter au Lottie
natif.** Sur la branche `add-support-lottie` (fusionnée dans `main` en fin de
session) :

- Ajout du composant web `dotlottie-wc` (LottieFiles) chargé depuis le CDN
  `unpkg.com` dans `index.html`, avec assouplissement de la CSP
  (`script-src`/`connect-src` : `unpkg.com`, `cdn.jsdelivr.net`,
  `'wasm-unsafe-eval'` pour le WASM du lecteur).
- Contrainte « limite » remplacée par `Protection-(hollow).json`, rendue en
  Lottie natif plutôt qu'en vidéo exportée — taille et cadre ajustés pour
  matcher les vidéos voisines (`aspect-ratio` explicite en CSS, le composant
  ne dérive pas sa taille intrinsèque du JSON), puis renommée « protection »
  pour refléter l'illustration réelle (elle était mal étiquetée « limite »).
- Les deux autres contraintes (« blocage », « espacement ») converties de
  vidéo Jitter vers leurs fichiers Lottie sources d'origine. Les fichiers
  `constraint-blocking.*` et `constraint-spacing.*` (vidéo + jpg) supprimés
  du dépôt une fois le rendu Lottie vérifié.
- Ajout d'une 4ᵉ contrainte, « disponibilité » (`Availability.json`) : son
  filigrane Jitter (« jitter.video », bas droite) était **incrusté dans le
  JSON lui-même** — pas un simple habillage vidéo — et a été retiré en
  supprimant le calque et les deux assets de précomposition qu'il référençait
  (traçage de la chaîne de référence pour confirmer qu'aucun autre élément ne
  les utilisait).
- `constraint-limit.mp4`/`.jpg` gardés dans le dépôt, volontairement, bien que
  plus utilisés (voir `videos/README.md`).
- Détail dans `videos/README.md`, tenu à jour à chaque étape.

**Exploration visuelle dans Figma (hors dépôt de code).** Nouveau fichier
Figma « claude portfolio image generation » : sur la Page 1, à partir des
7 portfolios de référence déjà présents sur la page, génération de 5 mises en
page éditables différentes pour une page d'étude de cas (auto-layout complet,
pas des images). Travail réalisé entièrement côté Figma, aucun fichier de ce
dépôt n'y correspond.

**Git.** Historique local (`main`, la refonte bilingue complète sous `site/`)
et historique `origin/main` (ancienne structure aplatie) avaient divergé.
Sur demande explicite de Mar, `main` a été poussé en écrasant `origin/main`,
à l'exception de 4 fichiers gardés strictement locaux : `Portfolio PRD for
Claude.md`, `CONVERSATION.md`, `README.md`, et les 4 PDF sources. La méthode
retenue : une branche `push-temp` jetable, sur laquelle ces fichiers sont
retirés de l'index (`git rm --cached`, gardés sur disque) avant le push forcé
— `main` lui-même n'est jamais modifié. Répété une seconde fois en fin de
session après la fusion de `add-support-lottie`. La branche
`add-support-lottie`, entièrement fusionnée, a ensuite été supprimée en local
et sur `origin`.

**Liste des fichiers gardés strictement locaux (à ne jamais pousser vers
`origin`).** Référence pour tout futur push forcé via une branche
`push-temp` (voir méthode ci-dessus) :

- `Portfolio PRD for Claude.md`
- `CONVERSATION.md`
- `README.md`
- `CLAUDE.md` *(commité en session 3 — `d6de7ef` — et exclu comme les autres
  depuis)*
- `french-translation.md` *(créé en session 4 sur la branche `fr-lang-removal`
  — voir ci-dessous — pour archiver tout le contenu français retiré du site.
  Poussé une première fois par erreur, retiré au push suivant. La branche a
  depuis été fusionnée dans `main` et supprimée ; le fichier vit maintenant
  dans l'historique local de `main`, toujours exclu de chaque snapshot poussé
  vers `origin`.)*
- `Contraintes.pdf`
- `Exclusion des services.pdf`
- `Services exclusion.pdf`
- `Transfert de DME.pdf`

*(Cette liste sert de référence pour chaque push forcé via `push-temp` —
voir méthode ci-dessus. Vérifiée à jour en session 4 : confirmée absente
d'`origin/fr-lang-removal`, `git ls-tree` à l'appui.)*

### Session 4 — 18 août 2026

**Retrait du français comme langue du site**, sur la branche `fr-lang-removal`
(commit `8592e3b`, « Remove French as a site language, archive its content to
french-translation.md »). Le site n'a plus qu'une langue : plus de bloc `fr:`/
`en:` par entrée dans `content.js` (les entrées sont maintenant des objets
plats), plus de `state.lang` ni de sélecteur de langue dans l'en-tête, plus de
fonction de lookup `t()` dans `app.js` — `applyStaticI18n()` écrit directement
les chaînes de `UI`. Tout le texte français d'origine est conservé tel quel
dans `french-translation.md`, à la racine du dépôt, gardé strictement local
(voir la liste ci-dessus). Conséquence pour les figures « annotées en
français seulement » (Contraintes, Transfert de DME, voir 3.5) : la mention
« Figure annotated in French » s'affiche désormais en permanence, puisqu'il
n'y a plus d'autre langue vers laquelle basculer pour la comparer.

**Étude de cas Contraintes : deux passes de retouche visuelle**, toujours sur
`fr-lang-removal` :

1. *Vidéo d'ouverture et grille Design — passe 1.* Recadrage de la vidéo
   d'ouverture en 16:9 `cover` (pleine largeur), grille des Lottie en 2×2
   « bleed » (pleine largeur de page, hors de la colonne), grille des
   maquettes en disposition inégale, ajout d'un tiroir « See more » (`<details>`/
   `<summary>`, icône `+`/`x`) pour la section mapping.
2. *Passe 2, sur retour de Mar.* Chaque choix de la passe 1 revu : la vidéo
   repasse en `object-fit: contain` (l'animation doit rester visible en
   entier, quitte à laisser des bandes), la grille Lottie repasse en 1×4
   empilée à la largeur du bloc Benchmark (le `--rail` bleed de la passe 1,
   devenu inutile, entièrement retiré), les maquettes repassent en rangée
   1×3 fixe à la même largeur, et l'icône `+`/`x` est remplacée par un
   chevron Lucide animé (SVG inline, pas de dépendance CDN ajoutée).
3. *Vidéo d'ouverture locale + astuce de couleur.* La vidéo (Contra) est
   remplacée par le fichier local `assets/media/constraint-limit.mp4` (avec
   `constraint-limit.jpg` en poster) — un point de moins hébergé chez Contra.
   Cette vidéo est cadrée en portrait (524×600) : dans la boîte 16:9 en
   `contain`, ça laisse de larges bandes de part et d'autre. Pour les rendre
   invisibles, la couleur de fond de `.cs__hero-media .figure__frame` a été
   réglée sur celle du fond propre de la vidéo — `#e9e1f9` — obtenue en
   échantillonnant les pixels du poster directement dans Chrome (canvas +
   `getImageData`, faute d'outil d'imagerie local dans ce bac à sable : ni
   PIL, ni ffmpeg, ni ImageMagick). Premier essai à `#e5ddf5` (moyenne des
   quatre coins de l'image) laissait une fine couture visible à l'écran ; les
   coins étaient faussés par l'anti-aliasing JPEG en bordure. Corrigé en
   échantillonnant une colonne verticale complète près du bord : la teinte
   intérieure stable est `#e9e1f9`.

**Git.** Toutes ces modifications commitées sur `fr-lang-removal`
(`8592e3b`, `1c68dc0`, `53146d4`, `30eab8b`) puis poussées vers
`origin/fr-lang-removal` via la méthode `push-temp` habituelle, en excluant
désormais aussi `french-translation.md` (voir liste ci-dessus).

Un second cycle `push-temp` a suivi, après mise à jour de ce journal et de
`CLAUDE.md` (`bf5c140`) : mêmes 9 fichiers exclus, snapshot commité
(`53c293a`) et poussé en écrasant `origin/fr-lang-removal`. La branche
`push-temp` a ensuite été supprimée comme toujours — c'est une branche
jetable recréée à chaque push, jamais conservée.

**Fusion dans `main` et suppression de `fr-lang-removal`.** `main` local
était encore au commit `d6de7ef` (fin de session 3), exactement le parent de
`fr-lang-removal` : la fusion (`git merge fr-lang-removal`) a donc été un
simple fast-forward jusqu'à `882fef5`, sans commit de fusion ni conflit.
`main` a ensuite été poussé vers `origin/main` par le même cycle
`push-temp` habituel (mêmes 9 fichiers exclus, snapshot `856fe8d`, écrasant
l'ancien snapshot `f443aba` de la session 3). Une fois la fusion confirmée,
la branche `fr-lang-removal` — entièrement intégrée à `main`, plus aucune
raison de la garder — a été supprimée en local (`git branch -d`) et sur
`origin` (`git push origin --delete`), suivant exactement le même schéma que
`add-support-lottie` en session 3. Le dépôt n'a donc plus, à la fin de la
session 4, que deux branches : `main` (locale et `origin`).

La liste des fichiers gardés strictement locaux ci-dessus reste valable telle
quelle : elle s'applique maintenant à tout push de `main` (et de toute future
branche de travail), pas seulement à `fr-lang-removal`.

### Session 5 — 18-19 août 2026 (branche `constraint-module`, fusionnée dans `main`)

**Widget interactif « sentence builder »**, section Design de l'étude de cas
Contraintes : le paragraphe qui cite déjà la phrase-résumé (« Marc Tremblay
cannot be assigned to Care - Floor 2 from Monday to Friday ») est maintenant
suivi d'un module éditable reproduisant cette interaction, à partir de la
maquette Figma « Claude portfolio image generation »
(`itn1kZeKMMFva4PUSX9hlS`). Construit hors du système `media[]`/`mediaGroup()`
existant (nouveau champ `s.builder` dans `content.js`,
`constraintBuilderMarkup()`/`setupConstraintBuilder()` dans `app.js`) : un
widget avec état et clavier n'a pas sa place dans un pipeline pensé pour des
`<img>`/`<video>` statiques.

Construit en plusieurs passes de retouche sur retours directs de Mar (trop
nombreuses pour être détaillées une par une ici — voir le message du commit
de fusion pour le détail complet) :

- Listbox physicien/tâche alignées visuellement sur celle du type de
  contrainte ; seul « Limit » reste réellement sélectionnable (les 4 autres
  types restent visibles et cliquables, fidèles à la maquette, mais inertes) ;
  tâches en cases à cocher multi-sélection (4 max), avec autant de losanges
  dans l'illustration que de tâches cochées.
- Illustration reconstruite à partir des vrais calques SVG Figma (empilement
  de losanges en dégradé, ligne pointillée, crochet) plutôt qu'en SVG dessiné
  à la main — téléchargés dans `site/assets/icons/`, jamais réécrits (règle
  du skill Figma : une icône exportée ne se réinvente pas).
- Tiroir « Limit constraint » (jours) séparé de la phrase. Son comportement a
  changé de sens en cours de session : un premier essai gardait l'en-tête
  (icône + « Limit constraint ») visible même replié, pour éviter que tout le
  bloc ait l'air d'avoir disparu ; la maquette de référence de Mar (capture
  d'écran du flux Figma) montrait en fait l'inverse — le tiroir entier
  (en-tête compris) absent tant que le champ « from [...] » de la phrase n'a
  pas été sélectionné, exactement comme les autres listbox du widget. Réglé
  dans ce sens final : `.cbuild__constraint-info` masqué (`hidden`) par
  défaut, ne s'affiche qu'au clic sur ce champ. Le chevron interne au tiroir
  (bouton dédié à le refermer) a ensuite été retiré tout court, redondant
  avec ce même champ qui pilote déjà l'ouverture/fermeture.
- Coche des cases à cocher : remplacée par le vrai check Figma (asset SVG
  téléchargé, `constraint-check.svg`) après un premier essai en CSS
  dessiné à la main (bordure pivotée) qui rendait décentré.
- « Select all » (jours) devient « Unselect all » dès que les 7 jours sont
  cochés, et efface tout au lieu de tout cocher dans cet état — un libellé
  fixe n'avait plus de sens une fois tout déjà sélectionné.

**Bug trouvé en testant : clic extérieur pour fermer un menu, parfois sans
effet.** Cause réelle, repérée dans la console (`InvalidStateError:
Transition was aborted…`) : `render()` (routeur, `app.js`) lance
`document.startViewTransition(swap).updateCallbackDone.then(afterSwap)` sans
gestionnaire de rejet. Si une navigation arrive pendant qu'une transition
précédente anime encore, le navigateur l'annule et `updateCallbackDone` est
rejetée — et sans second argument à `.then()`, `afterSwap()` (qui attache
TOUS les écouteurs de la page : widget, scroll-spy, clic extérieur…) ne
tournait alors jamais pour cette page, sans erreur visible côté utilisateur.
Corrigé en passant `afterSwap` comme gestionnaire de résolution *et* de rejet.
Vérifié en forçant plusieurs navigations rapprochées dans la console.

**Carrousel des 4 illustrations animées** (maquette Figma, nœud `34:817`) :
la grille statique des 4 Lottie (Blocking/Protection/Spacing/Availability)
est remplacée par une scène unique + une liste de libellés cliquables à côté
— un seul clic affiche l'animation correspondante, Blocking par défaut.
Nouveau champ `lottieCarousel` sur la section Design, rendu par
`lottieCarouselMarkup()`/`setupLottieCarousel()`, toujours hors du pipeline
`media[]` pour la même raison que le widget ci-dessus (état exclusif, pas une
grille statique).

**Nav latérale d'étude de cas : refonte pour englober toute la page**, sur
le modèle de <https://www.rachelchen.tech/projects/openai> (demande
explicite) : la nav (`.cs-nav`) ne longe plus seulement les étapes du
processus mais toute la page, avec « Overview » comme première entrée
(pointant vers l'en-tête/résumé lui-même, `id="sec-overview"`). L'en-tête et
les sections de processus partagent maintenant la même colonne de largeur
(l'en-tête a perdu son propre `.wrap` séparé) — c'était explicitement demandé
(« Overview-summary and process wraps are the same width »). Le lien retour
perd son chrome en pilule pour redevenir un lien discret, séparé du reste de
la liste par une marge plutôt que par une bordure.

**Carrousel Lottie : redimensionnement et flou, deux passes.** Retour de Mar :
la scène du carrousel occupait toute la largeur de la colonne (~987px de
large, jusqu'à ~835px de haut — plus grande qu'aucune autre figure de la
page) et les 3 animations autres que « Blocking » étaient floues/pixellisées.

- Taille : la colonne de scène est passée de `1fr` à `minmax(0, 420px)`
  dans `.lottie-carousel`.
- Flou — cause réelle trouvée en inspectant le `<canvas>` interne de
  `dotlottie-wc` (`shadowRoot`) : son tampon de pixels restait bloqué à
  300×150, la taille par défaut d'un `<canvas>` HTML sans attributs, alors
  que sa boîte CSS affichée faisait ~600×500px — un bitmap minuscule étiré
  par le navigateur, d'où le flou. `dotlottie-wc` a un mode
  `freezeOnOffscreen` : s'il s'initialise pendant que son panneau est encore
  `hidden` (donc de taille nulle), il ne se redimensionne jamais ensuite,
  même une fois `hidden` retiré. Seul « Blocking » (panneau visible dès le
  chargement) y échappait. Corrigé en ne posant `src` sur les 3 autres
  qu'au premier clic sur leur onglet (`data-src` en attente, promu en `src`
  par `setupLottieCarousel()`) — le composant ne s'initialise alors qu'une
  fois réellement visible et correctement dimensionné. Vérifié en lisant
  directement `canvas.width`/`height` avant/après (300×150 → 695×582).
- Un premier essai de recadrage utilisait `transform: scale(1.4)` en CSS sur
  les 3 animations dont le sujet (losanges) n'occupe qu'une bande centrée du
  canevas source — mais un `transform` CSS étire un rendu déjà calculé
  (flou), donc remplacé par un agrandissement réel de la boîte du
  `dotlottie-wc` (140%, `position: absolute`, recadré par l'`overflow:
  hidden` de la scène) : le composant redessine alors nativement à une
  résolution plus grande.
- Un quadrillage CSS (dégradés diagonaux croisés) avait été ajouté en
  surimpression des 3 animations pour imiter le décor « plan quadrillé » que
  « Blocking » a lui-même dans son propre Lottie — retiré après retour de
  Mar : contrairement au vrai décor de Blocking (confiné à des plans
  losanges nets, avec profondeur), ce quadrillage CSS recouvrait tout le
  cadre rectangulaire sans respecter aucune forme de sol, et se lisait comme
  du bruit visuel plutôt que comme un sol. Les 3 animations restent donc sur
  fond uni, sans décor ajouté.

**État Git.** Ce travail (widget sentence-builder, carrousel Lottie, refonte
de la nav) a été commité sur `constraint-module` puis fusionné dans `main`
(voir le message de commit pour le détail complet) — les deux branches
pointent maintenant sur le même commit. `constraint-module` n'a pas été
supprimée (ni en local ni sur `origin`, où elle n'existe de toute façon pas)
en l'absence d'une demande explicite en ce sens ; voir la note de session 3
sur le nettoyage de `add-support-lottie` si on veut reproduire ce geste.
Rien n'a encore été poussé vers `origin` — la méthode `push-temp` habituelle
(§7, sessions 3-4) s'appliquera le jour où ce sera demandé.

### Session 6 — 19 août 2026 (branche `module-modifications2`, fusionnée dans `main`)

**Avertissement en ouverture de session : `CLAUDE.md` et `CONVERSATION.md`
avaient disparu.** Entre la session 5 et le début de cette session, un commit
« Push snapshot: exclude internal docs, source PDFs, and
french-translation.md » a retiré `CLAUDE.md`, `CONVERSATION.md`, `README.md`,
`Portfolio PRD for Claude.md`, `french-translation.md` et les 4 PDF sources de
`main` **lui-même** (en local et sur `origin`), au lieu de les exclure
seulement d'une branche `push-temp` jetable comme le décrit §7 (sessions
3-4) — donc contrairement à ce que cette méthode garantit d'habitude, ces
fichiers ont cessé d'exister aussi en historique local, pas seulement sur
`origin`. Les deux fichiers ont été reconstruits à partir de leur dernier
contenu connu (commit `3e9e84a`) puis mis à jour ci-dessous ; voir la note
correspondante dans `CLAUDE.md` (« Pushing to origin » → « Deviation, session
5→6 »). Ce commit de reconstruction reste local à `main`, pas poussé vers
`origin`, conformément à la convention.

**Corrections du widget « sentence builder », sur retours directs de Mar
après la fusion de `constraint-module`.** Nouvelle branche
`module-modifications2`, plusieurs allers-retours de retouche (comme en
session 5, trop nombreux pour être détaillés ligne à ligne — le
détail complet est dans les deux messages de commit de la branche) :

- **Libellé des tâches dans l'illustration, repositionné en plusieurs
  temps.** D'abord empilé sous le libellé « Time » à gauche (comme à la
  fusion de `constraint-module`) ; déplacé à droite (`right: 0`,
  `text-align: right`) sur demande explicite, en calquant les coordonnées du
  nœud Figma source (`itn1kZeKMMFva4PUSX9hlS`, capture d'écran demandée à
  l'agent Figma MCP pour vérifier l'alignement précis). Un premier réglage
  (`right: 20%`) laissait le texte toucher le petit crochet vertical de
  `.cbuild__illu-rule` pour les libellés de tâche longs (« Care - Floor 2 ») —
  la bande réellement occupée par ce crochet dans le SVG source
  (`constraint-illu-rule.svg`, viewBox 171×198) a été retracée pour trouver
  la marge de sécurité correcte (`right: 25%`). `text-align` est ensuite
  repassé à gauche (le mot « Tasks » s'aligne sur la valeur en dessous,
  comme « Time », plutôt que de suivre le bord droit variable du texte). Sur
  une dernière demande, la position verticale est passée de `top: 24%`
  (juste au-dessus des losanges) à `top: 80%` (sous la pile).
- **Bug trouvé en test manuel : le nombre de losanges affichés ne
  correspondait jamais au nombre de tâches cochées** — les 4 étaient
  toujours visibles, quel que soit l'état réel. Cause réelle (confirmée en
  lisant `.cbuild__illu-layer` dans `styles.css`) : la règle pose
  `display: block` (nécessaire pour que la rotation du losange s'affiche),
  et une règle *auteur* l'emporte toujours sur la règle UA
  `[hidden] { display: none }`, même à spécificité égale — donc l'attribut
  `hidden`, pourtant correctement basculé par `updatePreview()`
  (`app.js`), n'avait aucun effet visuel. Corrigé en ajoutant
  `.cbuild__illu-layer[hidden] { display: none; }` juste après. Voir la note
  dédiée dans `CLAUDE.md`.
- **Pile de losanges recentrée sur le crochet « Limit », quel que soit le
  nombre de tâches.** L'ancien schéma empilait toujours depuis le losange du
  bas (position fixe) vers le haut : à 1 tâche, la pile était centrée sur le
  crochet ; à 4, elle avait dérivé tout en haut. Remplacé par
  `--illu-base`, une propriété CSS calculée sur `.cbuild__illu-graphic` à
  partir de `--illu-count` (synchronisée sur `vals.tasks.length` dans
  `updatePreview()`), qui recentre le groupe visible sur le même pivot pour
  n'importe quel nombre de losanges. Le pivot lui-même a changé en cours de
  session : d'abord déduit des 4 valeurs `top` d'origine de la maquette
  (24.37 %, qui reproduisait exactement l'état à 4 tâches), puis remplacé
  par `35 %` sur demande explicite de Mar (`--illu-base: calc(35% - (var(--illu-count) - 1) * 3.5%)`).
- **Le losange visuellement le plus haut de la pile ne restait pas au
  premier plan.** Sans `z-index` explicite, l'ordre de peinture suivait
  l'ordre du DOM (`slot0`..`slot3`), donc le losange du *bas* de la pile
  (dernier du DOM) se retrouvait peint par-dessus ceux du dessus — l'inverse
  de l'effet « pile de cartes » voulu. Corrigé avec un `z-index` explicite,
  décroissant de `slot0` (4) à `slot3` (1).
- **Marges/paddings du bloc droit qui semblaient ne jamais s'appliquer.**
  Trois retours successifs de Mar, chacun accompagné de la valeur lue dans
  l'inspecteur du navigateur (« la marge est fixée par
  `margin-bottom: var(--s4)` ») : `.cbuild__preview-title` (titre « Limit
  constraint »/« Availability constraint »), `.cbuild__drawer-title` (titre
  « Days » du tiroir) et `.cbuild__pill` (pastilles du récapitulatif). Cause
  réelle pour les deux titres : une règle générique `.cs-sec p` (spécificité
  0,1,1 — une classe + un élément) battait systématiquement les classes
  ciblées du widget (0,1,0 — une seule classe), quel que soit ce qui était
  écrit dans ces dernières. Corrigé en re-scopant chaque sélecteur avec son
  parent direct dans le widget (`.cbuild__right .cbuild__preview-title`,
  `.cbuild__info-body .cbuild__drawer-title`), ce qui bat `.cs-sec p` par
  spécificité sans `!important`. Pour les pastilles, la cause était plus
  simple — un premier essai avait ajouté un `padding-bottom` sur
  `.cbuild__recap` (le mauvais levier) avant que Mar ne pointe le vrai
  réglage (`.cbuild__pill { margin-block: 2px }`). Valeurs finales : titre
  « Limit constraint » `margin-bottom: 12px`, titre « Days » du tiroir
  `margin-bottom: 0`, pastilles `margin-block: 4px`.
- **Clic extérieur pour fermer un menu : ne fermait que si le clic tombait
  hors de tout le widget.** Cliquer ailleurs *dans* le widget (ex. sur le
  titre « Constraint parameters ») pendant qu'une listbox ou le tiroir des
  jours était ouvert ne le refermait pas — seul un unique gestionnaire
  `mousedown` sur `document`, testant `!root.contains(ev.target)`, existait.
  Remplacé par un helper `bindOutsideClose(elements, close)` appelé une fois
  par champ (déclencheur + son contenu déplié : listbox ou panneau des
  jours), qui referme ce champ précis dès qu'un clic tombe en dehors de ses
  propres éléments — vérifié en ouvrant chaque champ puis en cliquant sur un
  autre élément du widget, et en cliquant complètement en dehors de la
  carte.
- **Sélection de 0 tâche : ajoutée, puis retirée sur demande explicite.**
  Un aller-retour complet : `toggleTask()` empêchait de décocher la
  dernière tâche cochée (`if (vals.tasks.length <= 1) return;`) — retiré
  pour permettre 0 tâche, avec un libellé « No tasks selected » ajouté à
  `taskFieldLabel()` pour ce cas (repris automatiquement par le
  déclencheur, l'illustration et le récapitulatif, qui partagent tous cette
  fonction). Revert complet demandé ensuite : le garde-fou et la branche
  « No tasks selected » ont été retirés, `taskFieldLabel()` et
  `toggleTask()` sont revenus mot pour mot à leur état d'avant cette
  session.
- **Nav latérale décollée de la barre du haut, en mobile.** Signalé comme un
  bug visuel (« pas stuck »). Cause réelle, mesurée directement dans la
  console (hauteur réelle de `#site-head` comparée à la valeur CSS de
  `--head-h`) : `--head-h` était deux constantes codées en dur par point de
  rupture (82px bureau / 72px mobile) qui ne correspondaient plus à la
  vraie hauteur rendue de l'en-tête (mesurée ~87px en mobile, ~103px en
  bureau, contre 82/72 attendus) — et `.cs-nav` s'accroche à
  `top: var(--head-h)` sans marge de sécurité supplémentaire en mobile
  (contrairement à la version bureau, qui ajoute `+ var(--s6)`), donc le
  moindre écart se voit directement comme un vide sous la barre. Corrigé
  avec `syncHeadHeight()` (`app.js`), un `ResizeObserver` sur `#site-head`
  qui écrit sa vraie hauteur mesurée dans `--head-h` (propriété inline sur
  `<html>`, qui l'emporte toujours sur la feuille de style), appelé une
  seule fois au démarrage — voir la note dédiée dans `CLAUDE.md`.

**État Git.** Commité sur `module-modifications2`, poussé vers `origin`,
fusionné dans `main` (`--no-ff`), `main` poussé vers `origin` directement —
sans passer par la méthode `push-temp` habituelle, puisque cette branche ne
contenait aucun des fichiers exclus (ils avaient déjà disparu de `main` au
moment de la fusion, voir l'avertissement en ouverture de session). Branche
`module-modifications2` supprimée, en local et sur `origin`, sur demande
explicite. La reconstruction de `CLAUDE.md`/`CONVERSATION.md` ci-dessus est
un commit distinct, local à `main`, non poussé vers `origin`.

### Session 7 — 19 août 2026 (branche `Edit-constraint-thumbnail`, fusionnée dans `main`)

Trois demandes, sur la carte « Scheduling constraints » de la page
d'accueil (`.card__media`, `styles.css` ; `projectCard()`/`cardMedia()`,
`app.js`) et sur la persistance du prénom du visiteur.

- **Vignette vidéo : `object-fit: contain`, fond assorti, taille réduite.**
  La vidéo source est cadrée en portrait ; en `object-fit: cover` (réglage
  d'origine, partagé avec les vignettes image des autres cartes) elle était
  recadrée au lieu d'être montrée en entier. Passée à `object-fit: contain`,
  ramenée à 92 % de la boîte (centrée via `display: flex` sur
  `.card__media`) pour ne pas toucher les bords de la carte, et fond de la
  boîte fixé à `#e9e1f9` — la même couleur, déjà documentée dans
  `CLAUDE.md`, relevée sur le poster de cette vidéo et utilisée sur la page
  d'étude de cas elle-même (`.cs__hero-media`). Cette dernière règle est
  scopée à `.card[data-slug="constraints"] .card__media` : `projectCard()`
  pose désormais un attribut `data-slug="${p.slug}"` sur chaque carte
  spécifiquement pour permettre ce ciblage sans toucher le fond partagé
  (`rgba(0,0,0,.12)`) des autres cartes.
- **Bordure noire en bas de la vidéo : recadrée au clip-path.** Signalée
  après coup par Mar. Vérifiée directement (chargement de la vidéo dans un
  onglet, lecture pixel par pixel via zoom) : ce n'est ni un artefact de
  lettreboxing ni un problème d'encodage/lecture, mais un fin liseré présent
  dans le cadre du fichier source lui-même, près de son bord inférieur.
  Comme la vidéo occupe toute la hauteur de sa boîte sous `object-fit:
  contain` (lettreboxée seulement à gauche/droite, pas en haut/bas), un
  `clip-path: inset(0 0 4% 0)` sur `.card__media video` retire exactement ce
  liseré et révèle le fond `#e9e1f9` assorti derrière — sans toucher à
  l'illustration (pile de losanges) elle-même, qui reste largement au-dessus
  de cette marge. Voir la note dédiée dans `CLAUDE.md`.
- **Soulignement des titres d'étude de cas supprimé.** `.card__title`
  (utilisée à la fois par la grille principale et par les cartes « autres
  études de cas » en pied de page) perdait son `text-decoration: underline;
  text-underline-offset: 4px;` — retiré purement et simplement, sans
  remplacement.
- **Prénom du visiteur : persistance en `localStorage`, expiration 1h.**
  Demande explicite de Mar, arrivée en cours de session : éviter de
  redemander le prénom à chaque rechargement de page. Le brief d'origine
  (cité dans le commentaire au-dessus de `cleanName()`, `app.js`) précisait
  « sauvegarde dans une variable, pas dans une base de données » — c'est
  documenté comme une déviation assumée plutôt qu'un oubli. Implémenté avec
  `readStoredVisitor()`/`writeStoredVisitor()` (`app.js`, section 9) :
  `writeStoredVisitor()` écrit `{ v: prénom, exp: Date.now() + 1h }` dans
  `localStorage` à la soumission du portail ; `readStoredVisitor()` relit
  cette valeur, la revalide via `cleanName()` (même méfiance que pour un
  formulaire) et l'ignore si `exp` est dépassée. `setupGate().open()`
  consulte `readStoredVisitor()` avant d'afficher le portail : si une valeur
  valide existe, elle est appliquée directement (`state.visitor` + `render()`)
  et le portail ne s'affiche pas du tout. Vérifié dans le navigateur :
  prénom saisi, page rechargée, portail resté fermé, salutation correcte
  affichée immédiatement.
- **Note de test locale.** `python -m http.server` (utilisé pour la
  prévisualisation locale, voir `CLAUDE.md`) ne gère pas les requêtes
  `Range`, ce qui empêchait la vidéo de se charger pendant les vérifications
  visuelles dans cette session — sans rapport avec le code du site, un
  serveur de dev alternatif gérant `Range` (script Python jetable) a été
  utilisé ponctuellement pour confirmer visuellement le rendu de la vidéo.
  Aucun changement n'a été fait au site pour contourner cette limite.

**État Git.** Commité sur `Edit-constraint-thumbnail`, poussé vers `origin`,
fusionné dans `main` (`--no-ff`), `main` poussé vers `origin`. Branche
`Edit-constraint-thumbnail` supprimée, en local et sur `origin`, sur demande
explicite.

### Session 8 — 20 août 2026 (branche `constraint-structure`, fusionnée dans `main`)

Restructuration en profondeur de l'étude de cas « Scheduling constraints »
(`content.js` → section `constraints`), en une longue série de demandes
successives et affinées au fil de la session plutôt qu'une seule spécification
initiale — voir le détail par sous-thème ci-dessous.

- **En-tête et gist.** Légende « Configuring a constraint, end to end » sous
  la vidéo poster retirée (`heroMedia.hideCaption: true` — la légende reste
  en `aria-label` pour l'accessibilité, juste plus affichée visuellement) ;
  `tools` retiré du gist (`gist.tools` redevenu optionnel dans `pageCase()` —
  la ligne « Tools » du tableau ne s'affiche plus que si le champ existe,
  sans affecter les autres projets qui le renseignent toujours) ; textes
  `problem`/`outcome` remplacés mot pour mot par ceux fournis.
- **Stats.** Chiffres bleus agrandis (`clamp` doublé, `1.6rem/3.2vw/2.2rem`
  → `3.2rem/6.4vw/4.4rem` — même mesure vw/rem, plancher garanti ≥ 50px) ;
  entrée « 4 months » retirée ; section renommée « Impacts »
  (`d.csImpacts`, nouveau libellé dans `UI`).
- **Section « Process » (ex « Scoping and audit »).** Renommée, texte
  remplacé, et son ancien contenu détaillé (« 2. Mapping the 24 constraints »,
  « 3. Benchmark ») déplacé derrière un tiroir `<details>` unique
  (`moreDrawer`, voir `moreDrawerMarkup()` dans `app.js` et la note dédiée
  dans `CLAUDE.md`) plutôt que deux entrées de nav séparées — chaque item du
  tiroir garde son propre titre/paragraphes/figure.
- **Section « Solution » (ex « Design »).** Plusieurs allers-retours :
  paragraphes retirés puis un nouveau `intro` ajouté sous le titre ; « Four
  principles drove the interfaces. » retiré et le reste transformé en liste
  à puces (`s.list`, nouveau champ — voir `CLAUDE.md`) ; l'ancienne grille de
  3 images Contra remplacée par 2 mockups locaux exportés depuis Figma
  (`s.mockups`, dans un `.cs-mockups` plein cadre sans bordure/padding, pas
  la grille `.media-grid` partagée) ; les mockups re-exportés une seconde
  fois quand le fichier Figma source a changé côté Mar, et réordonnés
  (« Constraints list » avant « Configure a constraint »).
- **Widget « sentence builder » (`.constraint-builder`).** Plusieurs
  itérations de taille : réduit à 70 % puis 60 % (voir la note dédiée dans
  `CLAUDE.md` sur pourquoi `zoom` a été essayé puis abandonné — un bloc
  `width: auto` reste calé à 100 % du conteneur via shrink-to-fit dès que son
  contenu non enveloppé est plus large, `zoom` ou pas), centré ; l'écart
  entre `.cbuild__left`/`.cbuild__right` ajusté trois fois (30px → 20px) et
  le ratio des colonnes retouché (`5fr 3fr` → `4fr 4fr` → `5fr 3.5fr`,
  cherché empiriquement pour que la phrase récapitulative tienne sur
  exactement 2 lignes sans casser la colonne de gauche sur 4) ; « the task »
  forcé sur sa propre ligne via `.cbuild__break` (item flex de largeur 100 %,
  hauteur nulle) plutôt que de dépendre du retour à la ligne naturel ; titre
  « Try the sentence-builder direction » retiré, remplacé par une légende
  « Interactive rule-builder » sous le cadre (`cbuild__title` → `cbuild__caption`,
  déplacée de kicker au-dessus à figcaption en-dessous).
- **Bloc « Visual helpers ».** Sorti du système `body[]`/`lottieCarousel`
  indexé par paragraphe (où il vivait comme `body[0]`) et déplacé après le
  widget interactif (`s.helpers`, nouveau champ — titre en gras et texte
  dans le même `<p>`, séparés par un `<br>`, suivis du carrousel Lottie).
- **Bug CSS découvert et corrigé : listes à puces invisibles.** Le reset
  global `ul,ol { list-style: none }` (`styles.css`) retirait les puces de
  `.cs-sec__list` sans que ce soit voulu pour cette liste précise — corrigé
  en restaurant `list-style: disc` explicitement sur cette classe.
- **Bug JS découvert et corrigé : iframe dans un `<details>` fermé ne
  charge jamais.** En remplaçant l'image « Mapping the 24 constraints » du
  tiroir par un canevas Figma en direct (embed officiel `figma.com/embed`,
  fichier « Constraints EN (Contra) », node 1:351), l'iframe restait
  visuellement cassée même après ouverture du tiroir : un `<iframe>` créé
  dans un `<details>` fermé (`display: none`) ne déclenche jamais sa requête
  réseau, contrairement à une `<img>`. Corrigé avec `data-embed-src` (pas de
  `src` initial) + `setupMoreDrawerEmbeds()`, qui promeut `data-embed-src` →
  `src` au premier `toggle` vers l'état ouvert du `<details>` — voir la note
  dédiée dans `CLAUDE.md`.
- **Bug de sécurité découvert et corrigé en cours de route : CSP sans
  `frame-src`.** Le même embed Figma restait bloqué même après le correctif
  ci-dessus : la CSP de `index.html` n'avait pas de directive `frame-src`,
  donc retombait sur `default-src 'self'`, qui interdit d'encadrer n'importe
  quelle origine externe — cela aurait cassé l'embed une fois déployé, pas
  seulement en test local. Ajout de `frame-src https://www.figma.com;`.
- **Non résolu en fin de session : rendu de l'embed Figma pas confirmé
  visuellement.** Même après le correctif CSP (plus aucune violation dans la
  console), l'iframe n'a jamais fini de peindre pendant les vérifications de
  cette session — l'onglet de test automatisé devenait instable/non
  réactif pendant le chargement du canevas Figma, avec seulement une
  poignée de requêtes réseau observées (`performance.getEntriesByType`)
  avant blocage. Hypothèse retenue : contrainte WebGL/GPU propre à
  l'environnement de test automatisé (sandbox), pas un défaut du code — mais
  ce n'est qu'une hypothèse. **À vérifier sur l'URL réellement déployée,
  dans un navigateur ordinaire**, avant de considérer ce point terminé ; si
  ça casse aussi en production, revenir à une image statique exportée
  (comme celle que cet embed remplace).

**État Git.** Commité sur `constraint-structure`, poussé vers `origin` via la
méthode `push-temp` habituelle (voir « Pushing to origin » dans
`CLAUDE.md`), fusionné dans `main`, `main` poussé vers `origin`. Branche
`constraint-structure` supprimée en local (jamais existé sur `origin` en
tant que telle, seul `push-temp` y a été poussé puis supprimé). Mise à jour
de `CLAUDE.md`/`CONVERSATION.md` : commit distinct, local à `main` — non
poussé vers `origin`, comme d'habitude.

---

### Session 9 — 20 août 2026 (branche `interactive-components`, poussée vers `origin`, **non fusionnée dans `main`**)

Nouveau widget « components showcase » (`builder.components` dans
`content.js`) sous le rule-builder de l'étude de cas « Scheduling
constraints » : quatre champs autonomes — Physicians, Constraint type,
Tasks, Period — chacun ouvrable/fermable indépendamment, contrairement à la
phrase composée du rule-builder juste au-dessus. Construit sur plusieurs
demandes successives affinées au fil de la session ; voir la note dédiée
« Components showcase widget » dans `CLAUDE.md` pour le détail technique.
Contrairement à la session 8, **cette branche n'a pas été fusionnée dans
`main`** — voir « État Git » ci-dessous.

- **Création de la branche.** Le widget existait déjà dans l'arbre de
  travail de `main`, non commité, au début de cette session — déplacé sur
  une nouvelle branche `interactive-components` (`git checkout -b` emporte
  les changements non commités avec lui) plutôt que commité directement sur
  `main`, `main` restant propre à son dernier commit (`980fa51`).
- **Cadre et positionnement.** Le widget a été enveloppé dans un cadre
  `.ccomp__frame` au traitement degrade identique à `.cbuild__frame`
  (rule-builder) mais avec sa propre texture de fond, propre à la maquette
  Figma « Components » (node 52:1781) — pas le degrade du rule-builder, les
  deux widgets viennent de deux maquettes distinctes. Hauteur fixée à 430px
  (identique au rendu mesuré de `.cbuild__frame`, pour que les deux cadres
  degrades du bloc « Solution » occupent le même gabarit vertical). Le
  positionnement des quatre panneaux a été retravaillé trois fois : d'abord
  une grille 2×2 CSS, puis un positionnement absolu calqué sur les
  coordonnées x/y de la maquette Figma (quinconce), puis aligné sur une
  seule rangée (`top: 5%`) à des pourcentages `left` explicitement demandés
  (1/50/24/75), et enfin réécartés (1/37/55/79) pour laisser la place aux
  pastilles du déclencheur Physicians — voir plus bas.
- **Bug corrigé : le déclencheur Period n'était jamais mis à jour.** Codé en
  dur sur le texte « Period », il ne reflétait jamais les jours/série/
  période choisis. Ajout de `periodTriggerLabel()`, câblé dans les huit
  points de changement d'état du panneau (jours, tout sélectionner, choix
  fixe/série, période nommée, compteur de jours consécutifs).
- **Paragraphes « Selected: ... » retirés des quatre panneaux.** Jugés
  redondants une fois que chaque déclencheur affiche déjà la sélection
  courante — `.ccomp__status` et les fonctions `*StatusText()` associées
  supprimés (code mort, plus aucun appelant).
- **Pastilles croisées Physicians/Tasks (node 58:2890/58:2870).** Les
  déclencheurs Physicians et Tasks couvrent chacun deux onglets partageant
  un seul champ (Physicians/Groups, Tasks/Shifts) ; leur texte ne montrait
  jusque-là que l'onglet actif. Dès que les deux onglets ont une sélection,
  le texte est remplacé par de vraies pastilles avec croix de suppression
  individuelle (`physicianTriggerHTML()`/`taskTriggerHTML()`) — structure à
  plat pour Tasks, structure imbriquée pour Physicians (un cadre « Total »
  qui englobe visuellement les deux pastilles pleines, fidèle à la
  maquette plutôt qu'aplati en rangée). Le total physicians+groupes utilise
  un nouveau champ `size` par groupe dans `content.js` (chiffre d'exemple
  fixe, sans roster réel derrière — comme la maquette elle-même). Bug
  corrigé en cours de route : changer d'onglet vers l'onglet vide affichait
  à tort « Select groups »/« Select shifts » même quand l'autre onglet avait
  déjà une sélection — corrigé via `dualCategoryTriggerLabel()`, qui
  retombe sur la description de l'autre liste plutôt que sur le texte
  générique.
- **Tab complète l'autocomplétion des deux champs de recherche**
  (Physicians, Tasks), comme Enter le fait déjà — uniquement quand une
  suggestion est réellement affichée, sinon Tab garde son comportement
  natif de navigation au clavier.
- **Bug de chevauchement découvert et corrigé (deux causes distinctes).**
  Demandé de rendre le déclencheur Physicians flexible pour que ses
  pastilles tiennent sur une seule ligne (au lieu de passer à la ligne en
  dessous d'un plafond de largeur) : cela a révélé un vrai chevauchement
  visuel avec le panneau Constraint voisin. Deux causes trouvées et
  corrigées : (1) la largeur du déclencheur fermé peut atteindre ~345px
  (4 physiciens + 3 groupes, le maximum des données de démo), plus large que
  l'écart laissé par l'ancien espacement 24/50/75 — d'où le réécartage
  1/37/55/79 mentionné plus haut, mesuré empiriquement plutôt que deviné ;
  (2) `.ccomp__body` était un enfant normal du flux, donc un corps ouvert de
  300px devenait le plus large enfant du panneau (`width: auto`, positionné
  en absolu) dès qu'il dépassait la largeur du déclencheur fermé — ce qui
  élargissait le panneau lui-même et le faisait chevaucher son voisin de
  droite même quand le déclencheur seul tenait sans problème (vérifié avec
  Tasks : déclencheur ~225px, corps 300px, chevauchement sur Period malgré
  l'espacement déjà élargi pour le déclencheur). Corrigé en sortant tous les
  corps du flux (`position: absolute`, déjà fait pour Period seul
  auparavant pour une autre raison — débordement du bord droit du cadre —
  généralisé aux trois autres). Revérifié avec chaque panneau ouvert et
  chaque physicien/groupe/tâche/garde sélectionné en même temps : les
  quatre écarts restent positifs.
- **Légende changée.** « Component states — the same fields as the sentence
  above, shown open » → « Component reflect real use cases in hospital ».

**État Git — différent de la session 8.** Contrairement à `constraint-structure`
(fusionnée dans `main` en session 8), `interactive-components` **n'a pas été
fusionnée dans `main`** : `main` reste à son dernier commit d'avant cette
session, sans le widget « components showcase ». La branche a été poussée
vers `origin` via la méthode `push-temp` habituelle (voir « Pushing to
origin » dans `CLAUDE.md`), puis supprimée en local — récupérable via
`git checkout -b interactive-components origin/interactive-components` si
besoin de reprendre ce travail plus tard (fusion dans `main` ou poursuite
sur la branche). Mise à jour de `CLAUDE.md`/`CONVERSATION.md` : commitée sur
`interactive-components` avant la bascule vers `push-temp`, donc présente
dans l'historique de la branche poussée mais — comme d'habitude — exclue du
contenu réellement envoyé à `origin` par la méthode `push-temp`.

### Session 10 — 20 août 2026 (visuels SoundCloud + correctif embed Figma, fusionnée dans `main`)

Deux ajouts de contenu sur `main`, puis fusion de `interactive-components`
dans `main` (le widget « components showcase » de la session 9 est donc
maintenant sur le site publié) — contrairement à la session 9, cette fois
tout converge dans `main`.

- **Étude de cas SoundCloud : import des visuels de la page source**
  (`marvinsrd.com/en/soundcloud-project`). Nouveau champ optionnel de
  section `stats` (voir « SoundCloud case study visuals » dans
  `CLAUDE.md`) pour sortir en cartes les chiffres jusque-là seulement en
  prose (statistiques du sondage en Research, taux de réussite en Testing).
  Deux visuels du calcul SUS ajoutés en `mockups` de la section Research
  (légendes muettes sur le chiffre exact — écart d'arrondi 69,27 vs 69.57
  entre la diapo source et le texte). La maquette de la page artiste
  redessinée ajoutée comme `image` de la section Solution, jusque-là sans
  visuel.
- **Correctif de l'embed Figma (étude de cas Contraintes) : le sélecteur de
  page ne s'affichait pas.** Root cause trouvée en testant deux formats
  d'URL côte à côte dans un vrai iframe : le format
  `www.figma.com/embed?embed_host=share&url=...` (généré par « Partager >
  Intégrer » dans l'appli Figma, et déjà en place depuis la session 8)
  ignore silencieusement `page-selector` — Figma redirige en interne vers
  une URL où ce paramètre retombe à `0` quelle que soit la valeur envoyée.
  Remplacé par le format `embed.figma.com/design/{file-key}`, documenté sur
  developers.figma.com, qui respecte réellement le paramètre. Deuxième
  correctif nécessaire une fois l'URL changée : `frame-src` dans la CSP de
  `index.html` n'autorisait que `www.figma.com`, pas le nouveau domaine
  `embed.figma.com` — sans lui, l'iframe s'affichait bloquée (« Ce contenu
  est bloqué »). Les deux correctifs ensemble confirmés dans un vrai
  navigateur : canevas visible, menu déroulant du sélecteur de page
  fonctionnel. Voir « Constraints case study restructure » dans `CLAUDE.md`.
- **Fusion de `interactive-components` dans `main`.** Avant la fusion, les
  deux ajouts ci-dessus ont d'abord été committés sur `interactive-components`
  elle-même (même patch appliqué aux deux branches, en passant par un
  `git stash` le temps de changer de branche) puis poussés vers `origin`,
  pour que la branche distante soit à jour avant la fusion locale. La
  fusion (`git merge interactive-components --no-edit`) s'est faite sans
  aucun conflit — les deux branches avaient divergé depuis le même point
  commun (`980fa51`) sans jamais toucher aux mêmes zones de fichier au même
  endroit. `main` poussé vers `origin` ensuite. Les deux branches
  contiennent alors un arbre de fichiers strictement identique
  (`git diff main interactive-components` vide), `main` n'ayant qu'un
  commit de fusion en plus.
- **Branche `interactive-components` supprimée, locale et distante**, à la
  demande explicite — son contenu est entièrement préservé dans l'historique
  de `main` (`git merge-base --is-ancestor` confirme qu'elle est un ancêtre
  de `main`), donc rien n'est perdu malgré la suppression.
- **Deuxième incident du même type que la session 5→6 : `CLAUDE.md` et
  `CONVERSATION.md` de nouveau disparus de `main`, cette fois via
  `interactive-components`.** Avant cette session, un commit "Push snapshot:
  exclude internal docs" (`d3a6127`) avait été fait directement sur la
  branche `interactive-components` elle-même — pas sur une branche `push-temp`
  jetable comme la méthode l'exige — ce qui a désuivi les deux fichiers de
  l'historique de cette branche. La fusion dans `main` a donc aussi supprimé
  les deux fichiers de `main`. Recréés cette session à partir du dernier
  commit qui les contenait encore (`be7f991`, encore accessible comme
  ancêtre de la fusion) plutôt que d'un commit plus ancien — cette version
  est plus complète (elle inclut déjà la doc du widget « components
  showcase »). Voir la note de déviation n°2 dans `CLAUDE.md` (§ Pushing to
  origin) pour le détail et l'avertissement pour la prochaine fois.
- **Nouvelle règle explicite (demande de Mar) : mettre à jour `CLAUDE.md`/
  `CONVERSATION.md` automatiquement après chaque fusion dans `main`**, sans
  qu'il ait besoin de le redemander à chaque fois. Cette entrée en est la
  première application.
