# Saint Erblon Archives

Site des archives du groupe **Saint Erblon / Erblon Prod** (Mayenne) : de Desastrax
(1988) à Codéine (2004), en passant par Explicit, No Mug, Helium et Jar.

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
| `studio.html` | Jukebox vintage : lecture des morceaux de `mp3/` |
| `labo/morceaux.json` | Liste des morceaux affichés dans Le Labo |
| `soirees.html` | Galerie photo des soirées (alimentée automatiquement) |
| `images/` | Photos, pochettes, portraits des musiciens |
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

## Le Labo

Page `labo.html` : morceaux, riffs et expérimentations en cours. Les morceaux sont
déclarés dans `labo/morceaux.json` (titre, fichier, catégorie, date, durée, note) et
les fichiers audio vivent dans `labo/`. La page lit ce JSON au chargement : tant que
la liste est vide, elle affiche un message.

Dépôt des morceaux : par mail à l'adresse du groupe (voir la section « Déposer un
morceau » de la page). Les fichiers reçus sont convertis en MP3 avant publication.

## Sources

L'historique, les concerts et les formations proviennent des archives du site
d'origine du groupe (dernière mise à jour : 7 septembre 2004), conservées hors
ligne. Les contributions (photos, affiches, presse, souvenirs) passent par le
formulaire de contact de `index.html`.
