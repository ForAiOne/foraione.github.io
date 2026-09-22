# Saint Erblon Archives

Site des archives du groupe **Saint Erblon / Erblon Prod** (Mayenne) : de Desastrax
(1988) à Wöw (2010), en passant par Explicit, No Mug, Helium, Jar et Codéine.

- **Erblon Prod** : la maison de production montée par le groupe.
- **Saint-Erblon** : le village mayennais où se trouvaient le local et les répétitions.

Site **statique** (HTML + CSS), publié par GitHub Pages depuis la branche `main` :
un `git push` suffit, la mise en ligne prend une minute environ.

## Structure

| Chemin | Contenu |
|---|---|
| `index.html` | Accueil : accroche, backstage, line-ups, discographie, chronologie, contact |
| `histoire.html` | Historique du groupe (texte d'origine de 2004 + compléments) |
| `interview.html` | Anecdotes, interviews, le sous-sol, la frise des noms |
| `concerts.html` | Concerts (1993-2004) |
| `environnement.html` | Les lieux |
| `repetition.html` | Répétitions et enregistrements |
| `labo.html` | Le Labo : morceaux, riffs et expérimentations (aujourd'hui) |
| `aujourdhui.html` | Ce que les membres font aujourd'hui : activités et liens externes |
| `studio.html` | Jukebox vintage : lecture des morceaux de `mp3/` |
| `labo/morceaux.json` | Liste des morceaux affichés dans Le Labo |
| `labo/audio/` | Fichiers audio publiés du Labo (alimenté par le formulaire de dépôt) |
| `soirees.html` | Galerie photo des soirées (alimentée automatiquement) |
| `recherche/index.json` | Index de recherche du site (texte des pages) |
| `recherche/recherche.js` | Moteur de recherche, dans le navigateur |
| `images/` | Photos, pochettes, portraits des musiciens |
| `images/histoire/` | Photos d'archives illustrant la page Histoire |
| `videos/` | Vidéos de la page Histoire (MP4, affiches JPG, `medias.json`) |
| `mp3/` | Morceaux du jukebox |

## Jukebox : ajouter un morceau

Le lecteur construit le nom du fichier **à partir du libellé affiché** :
`mp3/<CODE>_<Libellé avec des underscores>.mp3`

1. déposer le fichier, par exemple `mp3/D1_Nouveau_Titre.mp3` ;
2. ajouter la ligne correspondante dans `songsList` (en haut du script de `studio.html`) :
   `'D1': 'Nouveau Titre',`

Le libellé et le nom du fichier doivent rester cohérents, sinon la lecture échoue
(c'est pour cette raison que `A5` a été renommé `A5_Shelter_for_Anger.mp3`).

## Galerie des soirées

Les photos sont publiées automatiquement : dépôt dans MEGA, validation, puis envoi
au VPS qui réduit l'image, met à jour le bloc `PHOTOS_AUTO` de `soirees.html`,
commite et pousse. Aucune manipulation manuelle de ce fichier n'est nécessaire.

## Photos et vidéos de la page Histoire

Les archives (photos d'époque, affiches, coupures, petites vidéos) illustrent
`histoire.html`. Les photos publiées vivent dans `images/histoire/`, les vidéos dans
`videos/` — chaque vidéo a son image de couverture du même nom, et
`videos/medias.json` recense ce qui est en ligne.

Le dépôt ne se fait pas dans le dépôt git mais dans `/root/incoming/histoire/` : on y
dépose les originaux tels quels (`.jpg`, `.png`, `.heic`, `.mov`, `.avi`, `.mp4`…),
puis `/root/histoire_medias.py` les optimise pour le web et publie.

| Commande | Effet |
|---|---|
| `/root/histoire_medias.py --dry-run` | annonce ce qui serait fait, sans rien écrire |
| `/root/histoire_medias.py` | optimise, range dans le dépôt, commite et pousse |
| `/root/histoire_medias.py --liste` | inventaire des médias en ligne |
| `/root/histoire_medias.py --html` | blocs `<figure>` prêts à coller dans la page |

Vidéos : H.264/AAC, 720 px de large au maximum, moins de 20 Mo (GitHub refuse au-delà
de 100 Mo par fichier). Photos : JPEG, 1920 px de côté au maximum, orientation EXIF
appliquée, métadonnées retirées. Les originaux sont conservés hors du dépôt dans
`/root/histoire_origine/<horodatage>/`.

Dans la page, les illustrations se placent dans un `<div class="media-histoire">`,
une `<figure>` par média (ajouter `class="large"` pour un média pleine largeur) :

```html
<div class="media-histoire">
    <figure><img src="images/histoire/affiche-2004.jpg" alt="Affiche du concert de 2004" loading="lazy">
        <figcaption><span class="media-date">2004</span> — Affiche du concert à Rennes.</figcaption></figure>
    <figure class="large"><video controls preload="metadata" poster="videos/concert-1998.jpg">
        <source src="videos/concert-1998.mp4" type="video/mp4"></video>
        <figcaption>Concert de 1998, extrait de la K7.</figcaption></figure>
</div>
```

## Le Labo

Page `labo.html` : morceaux, riffs et expérimentations en cours. Les morceaux sont
déclarés dans `labo/morceaux.json` (titre, fichier, catégorie, date, durée, note) et
les fichiers audio vivent dans `labo/audio/`. La page lit ce JSON au chargement : tant que
la liste est vide, elle affiche un message.

## Dépôt d'un morceau (formulaire du Labo)

Les morceaux arrivent par le **formulaire de `labo.html`** (section « Déposer un
morceau »), derrière la question de sécurité de la page : **MP3 uniquement,
20 Mo maximum**. Le reste est refusé avant l'envoi et revérifié côté serveur.

Le site étant statique, l'envoi passe par le service du VPS
(`/root/depot_labo.py`, port 8003), joignable de l'extérieur par Tailscale
Funnel en HTTPS (`https://ubuntu.tail1ccb87.ts.net/depot`). Ce service :

1. vérifie le fichier (entête MP3, `ffprobe`, taille, plafond par adresse) ;
2. le met en attente et **prévient Tony sur Telegram**, avec deux liens ;
3. à la validation : `/root/depot_labo_publier.py` réencode en MP3 128 kbps si
   nécessaire, range la copie dans `labo/audio/`, ajoute l'entrée en tête de
   `labo/morceaux.json`, commite et pousse ;
4. au rejet : supprime le fichier, rien n'est publié.

Rien n'est mis en ligne sans cette validation. Un morceau de 20 Mo devient ~4 Mo
sur le site, ce qui protège le plafond de 1 Go de GitHub Pages.

## Recherche dans le site

Un champ de recherche est présent dans le bandeau de **toutes les pages**. Il
cherche dans le texte du site et renvoie les **passages eux-mêmes**, jamais une
reformulation : chaque résultat est un extrait avec la page d'où il vient, et le
lien ouvre la page directement sur ce passage (défilement + surlignage).

Il n'y a **aucun service, aucune IA, aucun appel à l'extérieur** : l'index est un
fichier du site (`recherche/index.json`), téléchargé une fois par le visiteur et
interrogé dans son navigateur. La recherche fonctionne donc même hors ligne, et
rien ne sort de chez le lecteur.

L'index se **régénère tout seul** : après chaque publication de photo dans la
galerie des soirées (qui ajoute du texte à `soirees.html`). À la main :

```
python3 /root/site_indexer.py                       # index du site publié
SITE_REPO=<chemin d'un dépôt> python3 /root/site_indexer.py   # index d'un autre dépôt
```

Il doit être relancé après toute modification du **texte** d'une page, et le
`recherche/index.json` modifié doit être commité : c'est lui qui est servi.

## Aujourd'hui

La page `aujourdhui.html` (entrée « LIENS » du menu) rassemble ce que les
membres sont devenus : une fiche par personne, avec son activité actuelle et ses
liens, plus les pages du groupe ailleurs sur le web (Facebook, YouTube).

Règles tenues pour cette page :

- **Chaque adresse est testée avant publication** (code HTTP et contenu réel) :
  aucune n'est reprise d'une supposition. Un homonyme non vérifiable ne va pas
  en ligne — mieux vaut une case vide qu'une erreur.
- Les personnes n'y figurent que par leur **prénom** : les noms de famille
  figurent dans les archives, pas ici.
- Les liens externes s'ouvrent dans un **nouvel onglet** (`target="_blank"` +
  `rel="noopener"`) et portent une flèche pour se distinguer des liens internes.
- La page dit d'où viennent les informations et invite les anciens du groupe à
  signaler un lien manquant.

## Sources

L'historique, les concerts et les formations proviennent des archives du site
d'origine du groupe (dernière mise à jour : 7 septembre 2004), conservées hors
ligne. Les contributions (photos, affiches, presse, souvenirs) passent par le
formulaire de contact de `index.html`.
