DOSSIER LABO — morceaux, riffs et expérimentations
==================================================

Ce dossier contient la liste des morceaux du Labo (morceaux.json) et les
fichiers audio publiés (audio/).

AJOUTER UN MORCEAU (VOIE NORMALE : LE FORMULAIRE)
-------------------------------------------------

La page labo.html contient la section « Déposer un morceau » : le visiteur
répond à la question de sécurité, choisit son fichier (MP3, 20 Mo maximum),
donne un titre et une phrase de présentation, puis envoie.

Le service du VPS (/root/depot_labo.py) reçoit le fichier, vérifie qu'il s'agit
bien d'un MP3 (ffprobe) et prévient Tony sur Telegram. Rien n'est publié tant
que Tony n'a pas cliqué sur « Publier » :

    publication : /root/depot_labo_publier.py -> labo/audio/<titre>.mp3
                  (MP3 128 kbps maximum) + entrée en tête de morceaux.json
                  + git push
    rejet       : le fichier est supprimé, rien n'est publié

VOIE MANUELLE (SECOURS)
-----------------------

1. Placer le fichier dans labo/audio/, nommé simplement, en minuscules, sans
   espaces ni accents (les espaces deviennent des underscores) :

       labo/audio/mon-riff-du-dimanche.mp3

   Format conseillé : MP3 128 kbps (le service réencode au-delà).

2. Ajouter son entrée dans morceaux.json, dans le tableau "morceaux" :

       {
         "titre": "Mon riff du dimanche",
         "fichier": "labo/audio/mon-riff-du-dimanche.mp3",
         "categorie": "riffs",
         "date": "2026-09-20",
         "duree": "1:12",
         "note": "Un riff enregistré au téléphone, une nuit."
       }

   Catégories possibles : morceaux | riffs | remixes

3. Vérifier que le JSON reste valide (virgules entre les entrées) :

       python3 -c "import json; json.load(open('labo/morceaux.json'))"

4. Committer et pousser ; la page se met à jour toute seule (elle lit ce fichier).

SI LA PAGE RESTE VIDE
---------------------

La page affiche un message tant que "morceaux" est vide : c'est normal.
Elle charge morceaux.json par fetch — si le fichier contient une erreur de
syntaxe, la liste reste vide sans message d'erreur visible. Vérifier le JSON
en premier (étape 3).
