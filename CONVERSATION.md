# Journal de conception — Portfolio Marvin Sorhaindo

> Ce fichier existe pour que le contexte survive à une remise à zéro de conversation.
> Il enregistre **ce qui a été décidé, pourquoi, et ce qui reste à faire**.
> Si vous reprenez le projet dans une nouvelle session, lisez ce fichier d'abord.

**Dernière mise à jour :** 21 août 2026 — session 12 (page Figma "Case study" recréée avec le widget components-showcase componentisé (5 composants + variants) ; contenu du site réécrit d'après 3 maquettes Figma — Mapping/Benchmark/liste des 4 principes — plus une nouvelle section Takeaways et renumérotation de la nav latérale ; poussé vers `origin` via le snapshot `push-temp` habituel, fusionné dans `main`)

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

> Sessions 1–11 retirées le 21 août 2026 (taille du contexte) — récupérables
> via `git log`/`git show` sur ce fichier avant ce commit si besoin un jour.
> Seule la dernière session est gardée ci-dessous.

### Session 12 — 21 août 2026 (branche `constraint-case-layout`, fusionnée dans `main`)

**Contexte.** Deux volets distincts dans la même session : (1) recréer la
page complète de l'étude de cas Constraints dans Figma (fichier "Claude
portfolio image generation", nouvelle page "Case study"), et (2) réécrire
plusieurs blocs de texte du site à partir de maquettes Figma pointées par
Mar, plus l'ajout d'une section "Takeaways".

**Volet Figma (recréation de la page).**
- Nouvelle page "Case study" dans le fichier `itn1kZeKMMFva4PUSX9hlS`.
- Capture pixel-perfect de la page live (`generate_figma_design`, via un
  ajout temporaire et révoqué du script `capture.js` + assouplissement CSP
  dans `index.html`, jamais commité) utilisée uniquement comme référence de
  mise en page, puis supprimée une fois la reconstruction validée — suit le
  workflow parallèle recommandé par la skill `figma-generate-design`.
- Reconstruction complète en auto-layout, calques nommés d'après les
  classes CSS/rôles HTML (`case__hero`, `ccomp__panel[data-role=...]`, etc.).
- Widget "components showcase" (`.ccomp__*`) entièrement componentisé : 5
  composants Figma avec variants (`ccomp/pill` Style×Hover, `ccomp/list-row`,
  `ccomp/tab`, `ccomp/radio-row`, `ccomp/trigger` Default/Hover/Expanded),
  regroupés dans une Section "Design system — Components showcase widget".
  Les 4 panneaux (Physician/Task/Constraint/Period) sont assemblés à partir
  d'instances de ces composants ; un seul panneau (Physicians) reste ouvert
  dans la démo pour éviter le chevauchement observé quand les 4 corps
  s'ouvrent simultanément sur la largeur réelle du site.
- Tiroir "See more of the process" également recréé ouvert, avec le
  contenu complet des deux sous-items (Mapping, Benchmark).
- Aucun changement de code : ce volet est resté entièrement dans Figma.

**Volet contenu du site (implémenté, poussé).**
- Sentence "After benchmarking tools..." retirée de l'intro de la section
  Solution (redondante avec la phrase suivante).
- **Mapping the 24 constraints** (tiroir "See more") : texte remplacé
  d'après le node Figma 80:504 — liste à puces avec étiquettes couleur
  inline (`[ green ]`/`[ purple ]`/`[ red ]`) + sous-liste "to identify".
  Nouveau modèle de contenu : `moreDrawer.items[].body` accepte désormais,
  en plus d'une simple chaîne, un objet `{ intro, tags }` ou
  `{ intro, list }` — géré par la nouvelle fonction `drawerBodyParagraph()`
  dans `app.js`. Nouvelles classes CSS `.cs-tag`/`.cs-tag-list` (couleurs
  vert `#D7FFD7`/`#37A137`, violet `#F2D9FF`/`#7057B2`, rouge
  `#FFDAC7`/`#C34E3B`, reprises telles quelles du node Figma).
- **Benchmark** (tiroir "See more") : texte et légende remplacés d'après
  le node Figma 80:512.
- **Liste des 4 principes** (section Solution) : `s.list` passe d'une
  liste à puces (`string[]`) à une grille de 4 cartes (`{title, body}[]`),
  d'après le node Figma 80:523 — nouvelles classes `.cs-sec__cards`/
  `.cs-sec__card`. `s.list` n'était utilisé que par cette section (vérifié
  avant de changer sa forme), donc aucun autre projet affecté.
  `.cs-sec__card-title` doit être écrit `.cs-sec__card .cs-sec__card-title`
  (0,2,0) pour battre `.cs-sec p` (0,1,1) qui lui ajoutait sinon 16px de
  marge basse parasite — même piège de spécificité déjà documenté ailleurs
  dans `styles.css` (voir commentaire ligne ~1200).
- **Nav latérale renumérotée + section Takeaways.** "Overview" porte
  désormais le badge `01` (au lieu d'être sans numéro) ; les sections du
  processus décalent d'un cran (`i + 2` au lieu de `i + 1`). Titres H2
  correspondants mis à jour (`1. Process` → `2. Process`, `2. Solution` →
  `3. Solution`). Nouvelle 4ᵉ section `takeaways` (id/label/title
  `4. Takeaways`) utilisant le champ `intro` existant (déjà supporté par le
  renderer, deux lignes jointes par un vrai `<br>`) plutôt que `body`, pour
  obtenir le saut de ligne demandé sans ajouter de nouveau mécanisme. Ce
  changement de numérotation dans la nav est partagé par tous les projets
  `sections` (pas seulement Constraints) — jugé cohérent puisqu'il rend la
  numérotation continue partout, pas une exception propre à ce projet.

**Poussé vers `origin`** via le snapshot `push-temp` habituel (un seul
commit `5fac280`, tout le volet contenu ci-dessus), puis fusionné en
fast-forward dans `main` local et branche `constraint-case-layout`
supprimée.
