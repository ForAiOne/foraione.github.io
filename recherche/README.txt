RECHERCHE DANS LE SITE
======================

Ce dossier contient tout ce qui fait marcher le champ de recherche du bandeau.
Il n'y a ni service, ni dependance externe, ni intelligence artificielle : le
moteur (recherche.js) tourne dans le navigateur du visiteur et interroge un
fichier d'index (index.json) servi par le site lui-meme.

    index.json      le texte du site, decoupe en blocs (un bloc par titre)
    recherche.js    le moteur : index inverse, accents, prefixes, extraits

POURQUOI C'EST FAIT COMME CA
----------------------------
- Aucun appel reseau en dehors du site : la recherche marche meme hors ligne et
  aucune question de visiteur ne part chez un tiers.
- Aucune dependance a installer ou a maintenir (pas de CDN, pas de Node).
- Les resultats sont des passages exacts du site, jamais des phrases inventees.

LE FICHIER index.json
---------------------
Fabrique par /root/site_indexer.py, qui lit les pages HTML du site, decoupe
chaque page a ses titres et ecrit un bloc par section :

    { "page": "histoire.html", "ancre": "", "titre": "...", "texte": "..." }

L'index est le seul fichier a regenerer quand le texte du site change.

REGENERER L'INDEX
-----------------
Sur le site publie :

    python3 /root/site_indexer.py

Sur un autre depot (test sur un clone, jamais le site en production) :

    SITE_REPO=/chemin/du/depot python3 /root/site_indexer.py

Le publieur des soirees (/root/soirees_publier.py) le fait tout seul : publier
une photo ajoute une carte, donc du texte, dans soirees.html. La regeneration
est faite avant le commit pour que l'index et la photo partent ensemble.

Ce qui n'a PAS besoin de regeneration : la publication d'un morceau du Labo. Un
morceau vit dans labo/morceaux.json, que la page lit a l'affichage : aucune page
HTML ne change.

APRES REGENERATION
------------------
Verifier, puis committer recherche/index.json : c'est ce fichier que GitHub
Pages sert aux visiteurs. Tant qu'il n'est pas pousse, la recherche en ligne
ignore les derniers ajouts.

CONTROLES
---------
    python3 /root/verif_index.py        # couverture des faits + aucune fuite

Le controle verifie deux choses : que les sujets attendus sont bien presents
(personnes, lieux, dates, morceaux), et que l'index ne contient aucun element
des portails d'acces (questions/reponses de securite de soirees.html et
labo.html, qui vivent dans des balises <script>, donc jamais indexees).
