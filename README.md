# Portfolio — Marvin Sorhaindo

Portfolio de designer produit. HTML, CSS et JavaScript écrits à la main.
Aucune dépendance, aucune étape de build, aucune base de données.

## Démarrer

Le site a besoin d'être servi en HTTP (les modules JavaScript ne fonctionnent
pas en `file://`). N'importe quel serveur statique fait l'affaire :

```bash
cd site
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Structure

```
Portfolio/
├── CONVERSATION.md         Journal de conception : décisions, écarts, reste à faire
├── README.md               Ce fichier
├── Portfolio PRD for Claude.md   Le brief d'origine
├── *.pdf                   Sources des études de cas Petal
└── site/                   ── LE SITE ──
    ├── index.html          Coquille : loader, portail, en-tête, pied de page
    ├── css/styles.css      Design system + mise en page (13 sections numérotées)
    ├── js/content.js       Tout le texte, FR et EN
    ├── js/app.js           Routeur, i18n, sécurité, scroll-spy, affiches SVG
    └── assets/img/         Figures extraites des PDF (WebP + repli PNG)
```

## Modifier le site

**Changer un texte** → `site/js/content.js`. C'est le seul fichier à toucher dans
99 % des cas. Chaque projet a un bloc `fr:` et un bloc `en:` ; les clés doivent
rester identiques dans les deux, sinon une version aura un trou.

**Changer les couleurs** → les deux premières variables de `site/css/styles.css` :

```css
--blue:   #2350D8;   /* bleu principal */
--yellow: #FFCB3D;   /* jaune accent   */
```

Tout le site en dépend, y compris les affiches SVG générées.

**Ajouter un projet** → ajouter un objet dans le tableau `PROJECTS` de
`content.js`. Le routeur, les listes, l'affiche, la navigation latérale et le
lien « projet suivant » se construisent seuls à partir de cet objet.

## Publier

Le site est entièrement statique et le routage passe par le `#`, donc aucune
configuration serveur n'est nécessaire.

**GitHub Pages :** pousser le dépôt, puis Settings → Pages → source `main`,
dossier `/site`.

**Netlify, Vercel, Cloudflare Pages :** glisser-déposer le dossier `site/`.
Aucune commande de build, répertoire de publication `site`.

## Choix techniques

Les décisions et leurs justifications sont dans [`CONVERSATION.md`](CONVERSATION.md),
section 3. En résumé : routage par hash pour fonctionner partout sans
configuration, polices système pour ne rien télécharger, prénom du visiteur gardé
en mémoire seulement, et images préchargées une fois à l'arrivée.

## Accessibilité

- Tous les contrastes vérifiés ≥ 4,5:1 (WCAG AA), mesurés et non estimés.
- Navigation complète au clavier, lien d'évitement, focus visible.
- `prefers-reduced-motion` respecté : les animations sont neutralisées.
- Le changement de page déplace le focus et met à jour `<title>`.
- Les barres de progression exposent `aria-valuenow`.

## À faire avant publication

Voir [`CONVERSATION.md`](CONVERSATION.md) section 5. Les points bloquants :
l'article sur les deux ans, la section « Et sinon » de la page À propos, et la
vérification des deux couleurs de marque.

Les textes non validés s'affichent avec un badge « Brouillon » et les consignes
de rédaction apparaissent surlignées en jaune — impossible de les publier par
distraction.
