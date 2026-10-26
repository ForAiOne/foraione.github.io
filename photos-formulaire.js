/*
 * Pièces jointes photo du formulaire « Proposer un objet ».
 *
 * Une photo prise au téléphone pèse 3 à 6 Mo, et FormSubmit refuse au-delà de
 * 10 Mo pour l'ensemble de l'envoi. Chaque photo est donc réduite ici, dans le
 * navigateur, avant l'envoi : 1920 px de côté maximum, JPEG qualité 0,82.
 * Aucune requête supplémentaire n'est faite — on réécrit simplement le champ
 * fichier, et le formulaire part normalement, comme avant.
 *
 * Si le navigateur ne sait pas décoder le fichier (un HEIC sous Chrome, par
 * exemple) ou ne permet pas de réécrire le champ, la photo d'origine part
 * telle quelle : le formulaire fonctionne dans tous les cas.
 */
(function () {
    'use strict';

    var SELECTEUR = 'input[type="file"][data-photo]';
    var COTE_MAX = 1920;              // côté le plus long, en pixels
    var QUALITE = 0.82;
    var SEUIL = 900 * 1024;           // en dessous, la photo n'est pas retouchée
    var TOTAL_MAX = 10 * 1024 * 1024; // limite FormSubmit, tous champs confondus

    var enCours = 0;

    function quandLaPageEstPrete(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    }

    function enMo(octets) {
        return (octets / (1024 * 1024)).toFixed(1).replace('.', ',') + ' Mo';
    }

    function enKo(octets) {
        return Math.round(octets / 1024) + ' Ko';
    }

    // Réécrit le contenu d'un champ fichier (une photo par champ).
    function remplacer(champ, fichier) {
        try {
            var panier = new DataTransfer();
            panier.items.add(fichier);
            champ.files = panier.files;
            return champ.files.length === 1;
        } catch (erreur) {
            return false;
        }
    }

    // Réduit une photo et rappelle cb(nouveauFichier) — cb(null) si impossible.
    function reduire(fichier, cb) {
        var url = URL.createObjectURL(fichier);
        var image = new Image();

        function echec() {
            URL.revokeObjectURL(url);
            cb(null);
        }

        image.onload = function () {
            var cote = Math.max(image.naturalWidth, image.naturalHeight);
            var echelle = cote > COTE_MAX ? COTE_MAX / cote : 1;
            var largeur = Math.round(image.naturalWidth * echelle);
            var hauteur = Math.round(image.naturalHeight * echelle);

            var toile = document.createElement('canvas');
            toile.width = largeur;
            toile.height = hauteur;
            var pinceau = toile.getContext('2d');
            if (!pinceau) { echec(); return; }
            pinceau.drawImage(image, 0, 0, largeur, hauteur);
            URL.revokeObjectURL(url);

            toile.toBlob(function (bloc) {
                if (!bloc) { cb(null); return; }
                var nom = fichier.name.replace(/\.[^.]+$/, '') + '.jpg';
                var sortie;
                try {
                    sortie = new File([bloc], nom, { type: 'image/jpeg', lastModified: Date.now() });
                } catch (erreur) {
                    sortie = bloc;   // navigateur sans constructeur File
                    sortie.name = nom;
                }
                cb(sortie);
            }, 'image/jpeg', QUALITE);
        };

        image.onerror = echec;
        image.src = url;
    }

    quandLaPageEstPrete(function () {
        var champs = Array.prototype.slice.call(document.querySelectorAll(SELECTEUR));
        if (!champs.length) return;

        var etat = document.getElementById('photos-etat');
        var consigne = etat ? etat.getAttribute('data-consigne') || etat.textContent : '';
        var formulaire = champs[0].form;

        function total() {
            return champs.reduce(function (somme, champ) {
                return somme + (champ.files && champ.files[0] ? champ.files[0].size : 0);
            }, 0);
        }

        function afficher(message, alerte) {
            if (!etat) return;
            etat.textContent = message;
            if (alerte) {
                etat.classList.add('alerte');
            } else {
                etat.classList.remove('alerte');
            }
        }

        function resume() {
            var somme = total();
            var details = [];
            champs.forEach(function (champ, rang) {
                var fichier = champ.files && champ.files[0];
                if (!fichier) return;
                details.push('photo ' + (rang + 1) + ' : ' + enKo(fichier.size));
            });
            if (!details.length) {
                afficher(consigne, false);
                return;
            }
            afficher(details.join(' · ') + ' — total ' + enMo(somme) + ' sur 10 Mo' +
                     (somme > TOTAL_MAX ? ' : trop lourd, retirez une photo.' : '.'),
                     somme > TOTAL_MAX);
        }

        champs.forEach(function (champ) {
            champ.addEventListener('change', function () {
                var fichier = champ.files && champ.files[0];
                if (!fichier) { resume(); return; }
                if (fichier.size <= SEUIL) { resume(); return; }

                enCours += 1;
                afficher('Réduction de la photo en cours…', false);
                reduire(fichier, function (reduit) {
                    if (reduit && reduit.size < fichier.size) {
                        if (!remplacer(champ, reduit)) {
                            // champ non réécrivable : on garde l'original
                            afficher('Photo conservée telle quelle (' + enKo(fichier.size) + ').', false);
                        }
                    }
                    enCours -= 1;
                    resume();
                });
            });
        });

        if (formulaire) {
            formulaire.addEventListener('submit', function (evenement) {
                if (enCours > 0) {
                    evenement.preventDefault();
                    afficher('Patientez une seconde : les photos sont en cours de réduction.', true);
                    return;
                }
                if (total() > TOTAL_MAX) {
                    evenement.preventDefault();
                    afficher('Les photos font plus de 10 Mo au total : retirez-en une ou choisissez des photos plus légères.', true);
                }
            });
        }
    });
})();
