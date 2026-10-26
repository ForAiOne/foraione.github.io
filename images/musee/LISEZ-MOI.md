# photos des objets du musée

Ce dossier contient les **photos des pièces exposées** dans `musee.html` :
la boîte de K7 en bois, la guitare à une corde, le synthé smooby, le médiator,
la batterie Tama, les affiches… tout ce qui a suivi le groupe.

## Comment une photo entre au musée

```bash
python3 /root/musee_publier.py --titre "La boîte de K7 en bois" /chemin/photo.jpg
python3 /root/musee_publier.py --titre "La guitare de Jérôme" \
        --legende "Guitare de Jérôme, Washburn, récupérée quand il a quitté le groupe." \
        /chemin/photo.jpg
```

Le script, dans l'ordre :

1. vérifie que c'est une vraie image (signature, extension, poids ≤ 40 Mo) ;
2. garde l'original dans `/root/musee_origine/<horodatage>/` ;
3. écrit la copie web ici (1 600 px de côté max, qualité 82) — une photo déjà
   légère est copiée telle quelle ; l'orientation EXIF est redressée (une photo
   de téléphone ne sort pas couchée) ;
4. insère la carte encadrée en tête du bloc `MUSEE_AUTO` de `musee.html` ; la
   légende passée en `--legende` s'affiche sous le titre, avant la date, et
   ressort aussi dans la visionneuse quand on clique sur la photo ;
5. régénère l'index de recherche (le titre est du texte visible) ;
6. annonce la pièce dans le bandeau des nouveautés de l'accueil ;
7. commit + push.

Variantes utiles :

- `--dry-run` : montre la carte qui serait insérée, sans rien écrire ;
- `--sans-push` : prépare le commit sans pousser ;
- `--dossier /root/incoming/musee` : publie d'un coup tout ce qui est déposé
  dans le dossier (c'est le comportement par défaut, sans argument).

## Règles de nommage

Le nom de la photo publiée vient du **titre** : « La boîte de K7 en bois » →
`la-boite-de-k7-en-bois.jpg`. Un nom déjà pris reçoit un suffixe `-2`, `-3`.
Sans `--titre`, le titre est déduit du nom du fichier (`boite-k7.jpg` →
« Boite k7 ») — donc mieux vaut toujours passer `--titre`.

⚠️ Le bloc `<!-- MUSEE_AUTO_DEBUT -->` / `<!-- MUSEE_AUTO_FIN -->` de
`musee.html` ne doit jamais être supprimé : sans lui, le publieur refuse
d'écrire et la galerie ne peut plus se remplir.
