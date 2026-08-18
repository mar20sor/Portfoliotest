# Sources d'animation

`constraints/` contient les fichiers Lottie (JSON) des illustrations animées
du projet Contraintes. Ce sont les **sources** : elles ne sont pas servies
telles quelles par le site.

## Régénérer les vidéos

Les `.mp4` et leurs affiches `.jpg` vivent dans `../site/assets/media/`.
Pour les reconstruire après avoir modifié un Lottie :

```bash
cd videos
python3 lottie_render.py "constraints/Spacing lottie.json" /tmp/f 600 30 none
ffmpeg -y -framerate 30 -i /tmp/f/f%05d.png \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 23 \
  -movflags +faststart -an ../site/assets/media/constraint-spacing.mp4
ffmpeg -y -i /tmp/f/f00020.png -q:v 4 ../site/assets/media/constraint-spacing.jpg
```

Arguments de `lottie_render.py` : `<source.json> <dossier images> <largeur> <fps> <fond|none>`

## Pourquoi un moteur maison

`python-lottie`, `rlottie` et `lottie-web` n'étaient pas installables :
pip et npm sont bloqués dans l'environnement d'exécution. Les fichiers
n'utilisant qu'un sous-ensemble du format — pas d'expressions, pas de 3D,
pas de time remapping, ni trim path ni répéteur — un rendu maison avec
pycairo était réalisable.

**Limite connue :** le seul masque de fusion (track matte) du fichier
`Spacing` est ignoré, et l'unique flou gaussien n'est pas appliqué. Si un
jour vous ajoutez des expressions ou des mattes, ce moteur ne suivra plus —
mieux vaudra alors exporter la vidéo depuis Jitter directement.
