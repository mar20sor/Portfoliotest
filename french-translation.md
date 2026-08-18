# Contenu français retiré du site

> Ce fichier archive tout le texte français qui vivait dans `site/js/content.js`
> (et quelques chaînes statiques de `site/index.html`) avant que le support
> bilingue soit retiré, sur la branche `fr-lang-removal`. Le site est
> maintenant **anglais uniquement** : plus de sélecteur de langue, plus de
> bloc `fr:` dans le code. Ce document est la seule copie restante du texte
> français — s'il est supprimé, il est perdu (sauf à remonter l'historique
> git avant ce changement).

---

## 1. Libellés d'interface (UI.fr)

| Clé | Texte |
|---|---|
| langLabel | FR |
| langSwitchTo | Passer en anglais |
| skipToContent | Aller au contenu principal |
| gateHi | Bonjour ! |
| gateQuestion | Je suis Marvin.\nComment vous appelez-vous ? |
| gateLabel | Mon prénom est |
| gatePlaceholder | Votre prénom |
| gateSubmit | Enchanté |
| gateSkip | Passer cette étape |
| gateError | Deux caractères minimum, lettres et tirets uniquement. |
| gateHint | Votre prénom reste dans votre navigateur. Aucune base de données, aucun envoi. |
| navWork | Projets |
| navSide | À côté |
| navAbout | À propos |
| navContact | Contact |
| navHome | Accueil |
| navMenu | Menu |
| navClose | Fermer |
| helloBefore | Bonjour |
| helloAfter | , enchanté ! |
| helloAnon | Bonjour, enchanté ! |
| workTitle | Projets |
| workIntro | Trois ans de SaaS santé, plus quelques terrains de jeu. Chaque étude de cas se lit en 30 secondes ; le détail est là si vous voulez creuser. |
| sideTitle | À côté |
| sideIntro | Ce qui ne rentre pas dans une case « expérience professionnelle », mais qui compte quand même. |
| aboutTitle | À propos |
| seeProject | Voir le projet |
| seeMore | Voir le détail |
| readFull | Lire le processus complet |
| csGist | L'essentiel |
| csRole | Rôle |
| csDuration | Durée |
| csTeam | Équipe |
| csTools | Outils |
| csYear | Année |
| csProblem | Le problème |
| csOutcome | Le résultat |
| csProcess | Le processus |
| csNext | Projet suivant |
| csBack | Retour |
| csProgress | Progression dans la page |
| csSections | Sections de cette page |
| csFigureFR | Visuel annoté en français |
| footerSitemap | Plan du site |
| footerContact | Me contacter |
| footerResume | Télécharger mon CV |
| footerNote | Codé à la main. Pas de base de données, pas de traqueur. |
| footerRights | Tous droits réservés. |
| loading | Chargement |
| notFoundTitle | Cette page n'existe pas |
| notFoundBody | Le lien est peut-être ancien, ou j'ai cassé quelque chose. |
| notFoundCta | Retour à l'accueil |
| draftBadge | Brouillon — texte à valider |

---

## 2. Le hero de la page d'accueil (HERO.fr)

**name :** Je suis Marvin

**statement :**
1. J'aime « décrypter » des **flux de travail complexes**
2. sur des produits **B2B** en hypercroissance.
3. J'ai travaillé chez [Petal](#/work/constraints), [Fit-Plans](#/work/fit-plans) et <u>Gekko</u>.

**gapLink :** Pourquoi je n'ai pas travaillé pendant 2 ans

---

## 3. Les projets

### 3.1 Contraintes de planification (`constraints`)

- **client :** Petal
- **tagline :** Refonte d'un moteur de règles de planification, ramenées de **24 à 9**.
- **tags :** Design système, Recherche, SaaS santé
- **gist :** rôle — UX / UI, recherche · durée — 4 mois · équipe — 1 designer, 1 PM · outils — Figma, Jitter, entretiens
- **heroMedia caption :** Aperçu du paramétrage d'une contrainte
- **problem :** Les contraintes sont les règles qui s'appliquent aux disponibilités du personnel pour construire un planning équitable — « un membre ne peut pas faire deux périodes d'affilée », par exemple. Elles étaient paramétrées à la main par les équipes internes de Petal : long, coûteux, et si redondant que plusieurs règles différentes menaient au même résultat. Les agents se trompaient.
- **outcome :** J'ai réduit les 24 contraintes à 9 (et les 8 plus utilisées à 3) en identifiant leurs caractéristiques communes, puis conçu un rule builder que les gestionnaires de clinique peuvent utiliser eux-mêmes — sans passer par un agent.
- **stats :** 24 → 9 (contraintes après regroupement) · 8 → 3 (pour les plus utilisées) · 4 mois (du cadrage à la remise)

**1. Cadrage et audit**
J'ai commencé par interroger le service interne responsable du déploiement, parce que c'était eux qui payaient le prix de la complexité. Je voulais des réponses chiffrées, pas des impressions : quelles règles sont réellement utilisées, combien de temps prend le paramétrage d'une clinique, combien de règles pour un établissement complet, et par quel canal les plannings arrivent-ils jusqu'à eux.

Ce cadrage a révélé le point le plus utile du projet : toutes les règles ne servaient pas. Une partie du catalogue existait sans jamais avoir été employée.

**2. Mapping des 24 contraintes**
J'ai listé les 24 contraintes et les ai classées par fréquence d'utilisation. Pour comprendre sur quoi elles agissaient, je leur ai appliqué un code couleur : vert pour le temps, mauve pour les tâches, rouge pour les membres et les groupes. L'objectif n'était pas décoratif — il s'agissait de faire apparaître visuellement les caractéristiques que plusieurs règles partageaient.

Deux entretiens avec des gestionnaires ont complété le tableau côté utilisateur final. Puis j'ai illustré chaque contrainte sous forme de flux, pour repérer à quel moment chaque caractéristique était choisie et si ce moment comptait. La question derrière : peut-on paramétrer une caractéristique une seule fois pour plusieurs règles appliquées ensemble ?

Oui. C'est ce travail de mutualisation qui a fait passer 24 règles à 9.

*Légende (constraints-2-mapping) :* Exemple sur la famille « limites » : les caractéristiques communes (type de tâche, type de période, type de membre) sont extraites pour être mutualisées.

**3. Benchmark**
Une fois les règles simplifiées, restait à choisir un modèle d'interface. J'ai regardé comment d'autres produits font paramétrer des ensembles de règles complexes par des non-experts. Le rule builder — les automatisations de Notion, la recherche avancée de Gmail — répondait au même problème : beaucoup de conditions possibles, un utilisateur qui n'en veut que trois.

*Légende (constraints-3-benchmark) :* Deux références : la création d'un comportement automatisé dans Notion, et la recherche avancée de Gmail.

**4. Conception**
J'ai créé des illustrations abstraites animées, pour rendre chaque contrainte identifiable au premier coup d'œil et représenter visuellement son action.

Quatre principes ont guidé les interfaces. Les caractéristiques à paramétrer ne s'affichent qu'en cas de besoin (progressive disclosure). Les options les plus courantes sont présélectionnées par défaut. Le processus est découpé en étapes pour rester digeste. Une aide contextuelle et des illustrations accompagnent le paramétrage pour limiter les erreurs.

J'ai exploré deux directions. La première affiche les paramètres et le résultat côte à côte. La seconde affiche les paramètres de façon contextuelle et reformule la règle dans une phrase en langage naturel — « Marc Tremblay ne pourra pas être affecté à la tâche Soins - Étage 2 du lundi au vendredi ». Cette phrase est la pièce importante : elle permet à un gestionnaire de vérifier ce qu'il vient de créer sans relire les champs un par un.

J'ai aussi envisagé le paramétrage de plusieurs règles en une seule passe, pour accélérer la mise en place d'un établissement complet.

*Légendes des animations (media[0]) :* Contrainte de blocage · Contrainte de protection · Contrainte d'espacement · Contrainte de disponibilité

*Légendes des captures (media[2]) :* Liste des contraintes · Paramétrage d'une contrainte · Composants

*Légende (constraints-4-design) :* Les deux directions explorées, puis le panneau de liste des contraintes créées.

---

### 3.2 Exclusion de services (`services-exclusion`)

- **client :** Petal
- **tagline :** Un assistant en **4 étapes**, mis en production, mal compris, puis corrigé.
- **tags :** Wizard, Test utilisateur, Itération
- **gist :** rôle — UX / UI · durée — 3 mois · équipe — 1 dev, 1 designer, 1 PM, 1 rédacteur technique · outils — Figma
- **problem :** Dans le HUB — la plateforme qui synchronise les cliniques et hôpitaux du Québec — certains services ne sont plus utilisés ou ne le sont que temporairement, comme une clinique de vaccination saisonnière. Ils faussent les statistiques, mais ne peuvent être supprimés que dans le DME, une procédure lourde pour le personnel médical. Il fallait donc pouvoir les exclure de la synchronisation sans les supprimer — et le faire à l'intérieur d'une modale déjà chargée d'autres étapes.
- **outcome :** Un wizard en quatre étapes qui rend l'exclusion explicite. Après la mise en production, les tests ont révélé une erreur d'usage que nous n'avions pas anticipée : nous avons inversé la logique de sélection et ajouté un avertissement.
- **stats :** 4 étapes (au lieu d'un écran unique) · 3 mois (du cadrage à l'itération) · 1 échec (détecté après mise en production)

**1. Cadrage**
Le PM pose les besoins et les objectifs, et l'équipe énumère les contraintes techniques. Ici, une seule comptait vraiment : la solution devait tenir dans la modale de synchronisation existante du HUB. Pas de nouvelle page, pas de nouveau parcours.

C'est aussi le moment où l'on cartographie le parcours complet, de la première connexion au DME jusqu'à la visualisation des données. Voir l'exclusion à sa place dans cette chaîne a permis de comprendre le vrai problème : nous ajoutions une étape à un processus déjà lourd.

*Légende :* Le parcours de synchronisation du HUB. L'exclusion vient se greffer à l'étape de paramétrage des services.

**2. Conception**
Le vrai défi n'était pas technique. Les gestionnaires n'ont l'habitude de paramétrer que les services qui seront actifs. Il fallait leur faire comprendre qu'ils pouvaient aussi désactiver et exclure les services inutilisés — sans complexifier une interface déjà dense.

J'ai découpé le processus en étapes explicitement nommées : services exclus, services inactifs, services actifs, confirmation. Un texte explicatif accompagne chaque étape, les services modifiés restent sélectionnables, et un dernier écran résume ce qui va se passer avant validation.

*Légende :* Avant / après. L'écran unique devient un wizard dont chaque étape porte un nom.

**3. Mise en production**
Après revue, le design part en développement. J'ai accompagné le développeur pour m'assurer que la solution livrée correspondait à l'intention — pas seulement aux maquettes.

Puis le problème est apparu. Nous avions ajouté une case à cocher pour sélectionner les services à exclure. Les gestionnaires ne l'ont pas comprise comme nous l'avions imaginée.

*Légende :* Le feedback textuel qui confirme l'exclusion d'un service.

**4. Test et retour à la conception**
Nous avons repris le processus d'exclusion et de désactivation auprès de plusieurs cliniques. Le constat était net : la plupart des gestionnaires cliquaient automatiquement sur la case « tout sélectionner », excluant ainsi la totalité des services de la synchronisation. Un réflexe, pas une décision.

Trois corrections. Nous avons supprimé le « tout sélectionner » de la liste des services inactifs. Nous avons inversé la logique : l'utilisateur décoche les services qu'il souhaite exclure, ce qui rend l'action délibérée. Et nous avons ajouté un avertissement affichant le nombre de services exclus avant validation.

C'est le projet dont je parle le plus volontiers en entretien. Non pas parce que la première version était bonne, mais parce que le dispositif de test a permis de rattraper une erreur avant qu'elle ne coûte des données à quelqu'un.

*Légende :* Après itération : l'avertissement compte les services exclus pour réduire le risque d'erreur.

---

### 3.3 Transfert de DME (`emr-transfer`)

- **client :** Petal
- **tagline :** Rendre lisible un transfert de **3 semaines** sur lequel l'utilisateur n'a aucune prise.
- **tags :** Processus long, Transparence, SaaS santé
- **gist :** rôle — UX / UI · durée — 4 mois · équipe — 1 designer, 1 PM, 1 rédacteur technique · outils — Figma
- **problem :** Les cliniques voulaient pouvoir changer de DME dans le HUB. Le processus n'était réalisable que par l'équipe de déploiement, de façon localisée : lourd, d'une à trois semaines voire plus, et obligatoirement mené avec un agent interne mobilisé pour l'occasion. Le gestionnaire à l'origine de la demande, lui, n'avait aucun moyen d'action — mais avait besoin de visibilité.
- **outcome :** Une interface de suivi qui affiche les quatre étapes du transfert, l'état d'avancement, le DME de départ et d'arrivée, et laisse au gestionnaire la seule action qui lui reste vraiment : interrompre le processus.
- **stats :** 1 à 3 semaines (de durée réelle du transfert) · 4 étapes (rendues visibles au gestionnaire) · 0 action (possible — d'où le problème)

**1. Cadrage**
Le PM définit les conditions de réussite et les contraintes. Nous élaborons une première ébauche des étapes et des documents nécessaires au changement de DME, puis découpons le projet en sections.

La question de design était inhabituelle et c'est ce qui m'a intéressé : comment rendre fluide et transparent un processus en plusieurs étapes sur lequel l'utilisateur ne peut rien faire ? Trois contraintes s'additionnaient — le gestionnaire attend les actions d'un agent, il n'a aucune notion du temps restant, et les étapes sont nombreuses.

**2. Benchmark**
J'ai étudié les logiciels et plateformes où une opération du même type est déjà illustrée, en relevant les design patterns employés — essentiellement des écrans de setup et de progression.

Le benchmark a surtout tranché un débat interne. Puisque le gestionnaire ne peut pas agir, il faut être clair sans le noyer d'informations inutiles : afficher chaque micro-étape technique n'aurait fait qu'ajouter de l'anxiété. Nous avons choisi en équipe quelles étapes montrer, et lesquelles garder côté interne.

*Légende :* Exemples d'écrans de setup et de progression relevés pendant le benchmark.

**3. Exploration et conception**
J'ai commencé par donner forme aux informations visibles pendant le transfert. L'écran de départ affiche le DME actuellement utilisé par la clinique et l'historique des changements déjà effectués — un contexte qui manquait complètement avant.

Une fois le nouveau DME sélectionné, le gestionnaire choisit une date de transition et dépose les documents nécessaires. La confirmation lance le processus : le DME de destination s'affiche, avec les quatre étapes à franchir — confirmation de réception de la demande, création d'une nouvelle instance, configuration, migration des données. La clinique est signalée comme en cours de changement.

Deux décisions comptent ici. Le gestionnaire garde la possibilité d'interrompre le processus et de changer la date de go-live : ce sont les seuls leviers réels, donc ils sont visibles en permanence. Et chaque étape porte une date de mise à jour, ce qui remplace l'estimation de durée que nous ne pouvions pas donner honnêtement.

*Légende :* Affichage du DME courant et de l'historique, puis suivi du transfert étape par étape.

---

### 3.4 Fit-Plans

- **client :** Fit-Plans, Montréal
- **tagline :** Un parcours de commande ramené de **6 étapes à 3**, pour des clients qui téléphonaient.
- **tags :** Refonte, Recherche, UI
- **gist :** rôle — UX, UI, stratégie · durée — Mars – août 2020 · équipe — 1 designer, 2 développeurs · outils — Figma, Google Analytics
- **problem :** Fit-Plans prépare et livre des repas à calories mesurées pour sportifs, à Montréal. Le site avait été conçu par le CEO sur son temps libre et n'avait jamais été une priorité. Résultat : 84 % des clients trouvaient la commande trop compliquée et appelaient directement — une perte de temps pour une équipe déjà réduite.
- **outcome :** Le parcours de commande est passé de six étapes à trois. Les produits sont accessibles depuis la page d'accueil, et la personnalisation des repas se fait sur la fiche du plan. Site desktop et mobile.
- **stats :** 84 % (des clients trouvaient la commande trop longue) · 6 → 3 (étapes pour commander) · 92 % (jugent le concept et le CTA essentiels)
- **extLinks :** Étude de cas complète (Notion) · Site en bêta

**1. Découverte**
Analytics, évaluation de l'existant, questionnaire. L'ancien site donnait déjà beaucoup d'indices, mais il fallait entendre les clients pour savoir pourquoi ils décrochaient le téléphone.

Pour obtenir des réponses en quantité, j'ai monté un programme de fidélité : un questionnaire rempli contre un code promo. C'était le levier le plus efficace disponible pour une petite structure. Le questionnaire couvrait trois thèmes — habitudes et motivations, opinion sur le service, opinion sur le site.

Le chiffre qui a cadré tout le projet : 84 % des répondants trouvaient les repas trop difficiles à commander et le processus trop long. Ils préféraient appeler.

**2. Définition**
Personas, userflow, matrice de priorisation. L'ancien parcours imposait six étapes avant de valider un plan. En repartant du besoin réel — choisir un plan, l'ajuster, payer — le nombre d'étapes a été divisé par deux.

Le changement structurant : l'accès aux produits directement depuis la page d'accueil, et l'ajout ou la suppression de repas spécifiques déplacés sur la page de détail du plan, là où l'utilisateur a le contexte pour décider.

**3. Conception**
Wireframes puis UI. La page d'accueil s'ouvre sur une phrase qui explique la proposition de valeur, suivie des étapes de commande et d'un accès direct aux offres.

Sur la page produit, un filtre permet d'affiner la recherche et un calculateur de calories oriente les indécis vers un plan adapté — c'était la principale source d'hésitation identifiée dans le questionnaire. Le système vérifie aussi que l'adresse est desservie avant de laisser commander, plutôt qu'après paiement.

La page de détail affiche les informations du plan sans surprise au moment de payer, et c'est là que se fait la sélection des repas. Le site a été conçu en version desktop et mobile.

**4. Tests**
Test d'utilisabilité et test des 5 secondes, menés à distance sur prototype. 92 % des participants considèrent le concept et le bouton d'appel à l'action menant à la commande comme des éléments importants — ce qui a validé la hiérarchie de la page d'accueil.

Le score SUS a été mesuré pour disposer d'un point de comparaison chiffré avant et après refonte.

---

### 3.5 Soundcloud

- **client :** Projet d'étude
- **tagline :** **815 réponses** et 6 tests pour comprendre pourquoi personne ne trouve le bouton commentaire.
- **tags :** Recherche, Test d'utilisabilité, UI
- **gist :** rôle — Recherche, tests, UI · durée — Nov. 2019 – nov. 2020 · équipe — 3 designers · outils — Figma, Google Forms, Sheets
- **problem :** Soundcloud a une fonctionnalité que ses concurrents n'ont pas : commenter un morceau à un instant précis. Encore faut-il la trouver. Nous voulions mesurer l'utilisabilité réelle de la plateforme, puis rendre cette fonctionnalité accessible à quelqu'un qui ouvre le site pour la première fois.
- **outcome :** Un score SUS de 69,57 mesuré sur 815 répondants, six tests utilisateurs qui isolent deux problèmes précis, et une refonte de la page artiste qui remonte la section commentaires sur la droite.
- **stats :** 815 (réponses au questionnaire) · 69,57 (score SUS de la plateforme) · 83 % (de réussite aux tests, avec 1 abandon)
- **extLinks :** Dossier complet (Notion, en français)

**1. Recherche quantitative**
Nous avons conçu un questionnaire de 30 questions pour comprendre les habitudes, les profils et les fonctionnalités préférées des utilisateurs, en y intégrant l'échelle d'utilisabilité UMUX. Diffusé sur Twitter et LinkedIn, il a recueilli 815 réponses, majoritairement des 16-25 ans — ce qui donne au passage une indication sur l'âge moyen des utilisateurs de la plateforme.

Transposé sur l'échelle SUS, le résultat donne 69,57. C'est médiocre : cela situe Soundcloud entre le niveau d'utilisabilité d'Excel et celui d'un vieux GPS.

Trois autres chiffres ont orienté la suite : 29,7 % utilisent une autre plateforme parce qu'ils la trouvent meilleure, 70 % passent par la barre de recherche — ils savent donc ce qu'ils viennent écouter — et 43,9 % des utilisateurs hebdomadaires écoutent entre 11 et 30 minutes par session.

Notre conclusion : Soundcloud est perçu comme une alternative à Spotify, Deezer ou Apple Music plutôt que comme un service principal, et l'application est bien plus utilisée que le site. La priorité allait donc à l'interface web, en particulier aux commentaires.

**2. Tests utilisateurs**
Nous avons construit un scénario de test sur la version desktop, autour de trois missions : trouver un artiste et un morceau précis, pour évaluer le placement de la barre de recherche ; lancer l'écoute, la fonction principale du site ; et laisser un commentaire à un moment précis du morceau, la fonctionnalité exclusive. Le même scénario a été administré à chaque testeur, en leur demandant de décrire leurs actions à voix haute.

Sur six testeurs, dont certains n'avaient jamais utilisé le site : 83 % de réussite, un abandon, et des missions bouclées entre 30 secondes et une minute.

Les points positifs étaient nets — trouver un morceau est facile, le bouton de lecture est assez gros pour être trouvé sans réfléchir. Les points négatifs l'étaient tout autant : seuls ceux qui connaissaient déjà la plateforme parvenaient à commenter, et il y avait une confusion récurrente entre la page artiste et les résultats de recherche.

L'insight le plus utile : les utilisateurs s'attendaient à commenter comme sur YouTube. Ils cherchaient un champ sous le lecteur, pas une interaction sur la forme d'onde.

**3. Solution**
Nous avons prototypé les corrections pour les rendre manipulables plutôt que descriptibles. Puis j'ai repris la page artiste en remontant la section commentaires sur la droite, à hauteur du lecteur, pour qu'elle soit visible sans scroll et lisible comme une conversation en cours.

---

### 3.6 Hoot (projet à côté)

- **client :** Hackathon La Poste × ECV Digital
- **tagline :** **Une semaine** pour concevoir la conciergerie des travailleurs de nuit. **2ᵉ place**.
- **tags :** Hackathon, Concept, UI
- **gist :** rôle — Idéation, questionnaire, wireframing · durée — 1 semaine · équipe — 2 UI, 1 UX, 1 dev, 1 PM · outils — Figma, Google Forms, ProtoPie
- **problem :** La Poste nous demandait d'imaginer la conciergerie de demain. La plupart des acteurs du marché proposent du ménage, de la cuisine ou de la livraison, à des prix plus ou moins accessibles — mais aucun ne s'adresse au travail de nuit. Nous avons choisi cet angle pour nous distinguer.
- **outcome :** Hoot, une application qui prend au sérieux le bien-être des travailleurs de nuit : commande de repas géolocalisée, programmes de relaxation et de réveil, événements entre collègues, et vote collectif sur le matériel à commander. Deuxième place du hackathon.
- **stats :** 90 % (estiment que le travail de nuit affecte leur santé) · 10 / 10 (reconnaissent un impact sur leurs relations) · 7 / 10 (citent la livraison de repas comme problème majeur)
- **extLinks :** Dossier du projet (Google Slides, en français)

**1. Exploration**
Benchmark d'abord : Glovo, Please, John Paul, Premium. Le constat est vite venu — le créneau de nuit était vide. Ce n'était pas un oubli de notre part, c'était une opportunité.

Puis un questionnaire auprès d'une cinquantaine de personnes qualifiées. Les réponses ont été plus tranchées que prévu. 90 % estiment que le travail de nuit a eu un impact significatif sur leur santé. La totalité des personnes interrogées reconnaissent une influence sur leurs relations familiales et amicales. Et 7 sur 10 identifient la livraison de repas comme un problème majeur : la nuit, il n'y a plus rien d'ouvert.

**2. Analyse**
Les réponses dessinaient deux profils distincts, que nous avons formalisés en personas. Pour le premier groupe, le travail de nuit est physiquement dur et perturbe le sommeil. Le second est davantage gêné par l'impact social et alimentaire.

Nous avons ensuite listé les fonctionnalités possibles autour de quatre axes : livraison, bien-être au travail, social, et services. Beaucoup d'idées, dont nous n'avons gardé qu'une partie — c'est un hackathon, il faut une démo qui tient debout.

**3. Conception**
Wireframes pour structurer, puis UI. Nous avons choisi un thème sombre, puisque l'application est utilisée de nuit, avec des couleurs plus vives réservées au contenu important. Le hibou, animal nocturne, donnait à l'application une personnalité immédiatement lisible.

Quatre fonctionnalités ont été poussées jusqu'à l'écran : la commande de repas, avec les restaurants ouverts les plus proches sur une carte, filtrables, et les informations nutritionnelles affichées ; les programmes personnalisés de relaxation ou de réveil, selon le besoin du moment ; les mini-événements entre collègues pendant les pauses ; et le vote sur le matériel à commander pour faciliter la nuit de travail.

Le parcours principal, de l'onboarding à la sélection d'un programme de réveil, a été prototypé pour que le jury puisse manipuler la solution au lieu de l'imaginer.

---

### 3.7 Mémoire de master (`masters-essay`, projet à côté)

- **client :** ECV Digital
- **tagline :** Un mémoire de fin d'études, hébergé sur Notion.
- **tags :** Écriture, Recherche
- **gist :** rôle — Recherche, rédaction · durée — Année de master · équipe — Solo · outils — Notion
- **problem :** Mon mémoire de fin d'études. Le document complet vit sur Notion plutôt que dans une étude de cas — il est fait pour être lu, pas résumé.
- **outcome :** Le texte intégral est accessible en ligne.
- **draftNote :** Ce bloc attend un résumé du sujet et de la thèse en deux ou trois phrases. Il suffit de remplacer `problem` et `outcome` dans js/content.js.

---

## 4. Pages éditoriales

### 4.1 À propos

**lede :** Designer produit, basé à Montréal. Trois ans sur des outils de santé où l'erreur d'interface a des conséquences réelles.

**Aujourd'hui**
Je conçois des interfaces pour des logiciels métier — le genre de produit qu'on n'utilise pas par plaisir mais par obligation professionnelle, huit heures par jour. Chez Petal, j'ai travaillé sur la planification hospitalière et sur le HUB, la plateforme qui synchronise les cliniques et hôpitaux du Québec.

C'est un terrain qui m'a appris quelque chose que les projets grand public enseignent mal : quand votre utilisateur est un gestionnaire d'hôpital qui doit boucler un planning avant la fin de son quart, il n'explore pas votre interface. Il cherche le chemin le plus court, et si vous l'avez mal balisé, il coche la mauvaise case.

**Comment je travaille**
Je commence par compter. Combien de règles, combien d'étapes, combien de temps, combien de fois. Les chiffres du cadrage sont souvent le vrai livrable : sur le projet Contraintes, découvrir que la moitié des règles n'était jamais utilisée a compté davantage que n'importe quelle maquette.

Ensuite je simplifie avant de dessiner. Réduire vingt-quatre règles à neuf est un travail de modélisation, pas d'interface. Dessiner un bel écran pour vingt-quatre règles redondantes n'aurait rien réglé.

Et j'essaie de rester dans la pièce après la mise en production. Sur l'exclusion de services, notre première version était mal comprise par la plupart des gestionnaires. Nous ne l'avons su qu'en retestant après le déploiement. Un design qui n'est pas observé en usage réel n'est qu'une hypothèse bien présentée.

**Avant**
Formation en design digital à l'ECV Digital, à Paris, terminée par un mémoire et quelques projets d'équipe dont un hackathon La Poste où nous avons fini deuxièmes. Puis Montréal, une refonte complète pour Fit-Plans, et l'entrée dans le SaaS santé.

**Et sinon**
[À COMPLÉTER — deux ou trois phrases personnelles : ce que vous écoutez, faites, collectionnez, pratiquez. C'est la section que les recruteurs lisent en dernier et retiennent en premier. Évitez « passionné de » ; préférez un détail précis et vérifiable.]

**Parlons-en**
Je cherche un poste de designer produit ou UX. Si vous avez un système que personne ne comprend plus, écrivez-moi.

---

### 4.2 Pourquoi je n'ai pas travaillé pendant 2 ans

**lede :** La question va venir en entretien. Autant y répondre avant qu'on la pose.

Il y a un trou de deux ans dans mon parcours. Un recruteur le verra en huit secondes, et s'il n'a pas d'explication sous la main, il en inventera une. Cette page existe pour lui éviter ce travail.

**Ce qui s'est passé**
[À RÉÉCRIRE — la raison, en deux ou trois phrases, sans détour ni excuse. Dites ce qui s'est passé et arrêtez-vous là. Les lecteurs sont bien plus indulgents envers un fait posé calmement qu'envers un flou qu'ils doivent combler eux-mêmes.]

**Ce que j'ai fait pendant ce temps**
[À RÉÉCRIRE — la partie qui compte vraiment. Listez ce qui est concret et vérifiable : lectures, projets personnels, apprentissages, responsabilités familiales, soins, déménagement, bénévolat. Trois éléments précis valent mieux que dix vagues.]

**Ce que ça a changé dans ma façon de travailler**
[À RÉÉCRIRE — un lien honnête avec le métier, sans forcer la leçon de vie. Si la pause vous a rendu meilleur sur un point précis, dites lequel. Si elle n'a rien changé professionnellement, dites-le aussi : c'est une réponse crédible.]

**Aujourd'hui**
Je cherche un poste de designer produit ou UX, à temps plein. Cette page n'est pas une excuse : c'est le contexte, donné une fois, pour qu'on puisse parler du reste.

---

## 5. Texte français statique de `index.html` (hors système fr/en)

Ces chaînes étaient écrites en dur dans le HTML (valeurs par défaut avant que
`app.js` ne les remplace, ou texte jamais couvert par `data-i18n`) :

- `<html lang="fr">`
- `<title>` : Marvin Sorhaindo — Designer produit
- meta description : Portfolio de Marvin Sorhaindo, designer produit à Montréal. Trois ans de SaaS santé : planification hospitalière, synchronisation de données cliniques, refontes web.
- og:title : Marvin Sorhaindo — Designer produit
- og:description : Trois ans de SaaS santé. Vingt-quatre règles de planification ramenées à neuf.
- `aria-label` du logo : Marvin Sorhaindo, accueil
- Groupe du sélecteur de langue, `aria-label` : Langue / Language
- Bloc `<noscript>` :
  - Titre : Marvin Sorhaindo — Designer produit
  - Texte : Ce portfolio a besoin de JavaScript pour fonctionner. Vous pouvez me joindre directement :

---

## 6. Ce qui a changé dans le code

Sur la branche `fr-lang-removal` : `content.js` ne contient plus que le bloc
anglais (les clés `fr:`/`en:` de `UI`, `HERO`, chaque projet de `PROJECTS` et
chaque page de `PAGES` ont été aplaties — il n'y a plus qu'un seul jeu de
contenu). `app.js` a perdu `state.lang`, `setLang()`, et le sélecteur de
langue dans l'en-tête (`index.html`, bouton `FR`/`EN`). `<html lang="fr">`
est devenu `<html lang="en">`, et tout le texte statique listé en section 5
a été traduit.

Les visuels de Contraintes et de Transfert de DME restent annotés en français
(ce sont des images, pas du texte de site) : la mention « Figure annotated in
French » reste affichée sous ces figures, désormais **toujours** — plus
seulement quand la langue active était l'anglais, puisqu'il n'y a plus
qu'une langue.
