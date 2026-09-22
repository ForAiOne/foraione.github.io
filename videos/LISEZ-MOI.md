# vidéos de la page Histoire

Ce dossier contient les vidéos affichées dans `histoire.html`.

- Une vidéo = un fichier `.mp4` (H.264 / AAC, lisible par tous les navigateurs).
- Chaque vidéo a une image de couverture du même nom, en `.jpg` : `1993-concert.mp4` → `1993-concert.jpg`.
- `medias.json` est l'inventaire généré automatiquement (nom, poids, durée, dimensions).

**Ne pas déposer de fichiers ici à la main** : les vidéos brutes vont dans
`/root/incoming/histoire/`, puis `/root/histoire_medias.py` les compresse, crée
l'affiche et publie. Un fichier déposé directement ici ne serait pas compressé
et alourdirait le dépôt (GitHub refuse au-delà de 100 Mo par fichier).

Poids visé : moins de 20 Mo par vidéo, format 720p maximum.
