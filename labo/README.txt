DOSSIER LABO — morceaux, riffs et expérimentations
==================================================

Ce dossier contient les fichiers audio de la page labo.html et leur description.

COMMENT AJOUTER UN MORCEAU
--------------------------

1. Placer le fichier audio ici, nomme simplement, en minuscules, sans espaces
   ni accents (les espaces deviennent des underscores) :

       labo/mon-riff-du-dimanche.mp3

   Format conseille : MP3 192 kbps. Un WAV de plusieurs dizaines de Mo est
   converti avant publication (ffmpeg) pour ne pas alourdir le site.

2. Ajouter son entree dans morceaux.json, dans le tableau "morceaux" :

       {
         "titre": "Mon riff du dimanche",
         "fichier": "labo/mon-riff-du-dimanche.mp3",
         "categorie": "riffs",
         "date": "2026-09-18",
         "duree": "1:12",
         "note": "Un riff enregistre au telephone, une nuit."
       }

   Categories possibles : morceaux | riffs | remixes

3. Verifier que le JSON reste valide (virgules entre les entrees) :

       python3 -c "import json; json.load(open('labo/morceaux.json'))"

4. Committer et pousser ; la page se met a jour toute seule (elle lit ce fichier).

SI LA PAGE RESTE VIDE
---------------------

La page affiche un message tant que "morceaux" est vide : c'est normal.
Elle charge morceaux.json par fetch — si le fichier contient une erreur de
syntaxe, la liste reste vide sans message d'erreur visible. Verifier le JSON
en premier (etape 3).
