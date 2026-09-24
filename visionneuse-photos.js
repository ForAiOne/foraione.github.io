/*
 * Visionneuse de photos.
 *
 * Une photo s'ouvre en grand par-dessus la page au clic, comme les vidéos
 * (voir visionneuse.js pour ces dernières). Rien à déclarer dans la page :
 * la visionneuse s'accroche d'elle-même aux images encadrées de la galerie
 * (sélecteur .cadre img) et à toute image portant data-zoom.
 *
 * Conséquence voulue : les photos ajoutées plus tard fonctionnent sans
 * retouche, quelle que soit leur date d'arrivée. La liste des photos est
 * relue à chaque clic, pas au chargement de la page, donc le publieur
 * (soirees_publier.py / carte_html) n'a jamais à connaître ce script.
 *
 * CSS attendu dans la page : le bloc « Visionneuse de photos » du <style>
 * de soirees.html (classes .visionneuse-photos*).
 */
(function () {
    'use strict';

    // Images agrandissables : les tirages encadrés de la galerie, plus toute
    // image marquée explicitement data-zoom (utile pour une autre page).
    var SELECTEUR = '.cadre img, img[data-zoom], [data-zoom] img';

    // Raccourcis imprimés dans les libellés d'accessibilité uniquement.
    var BOITE_ID = 'visionneuse-photos';

    function quandLaPageEstPrete(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    }

    quandLaPageEstPrete(function () {
        var boite, image, titre, details, compteur, boutonFermer, navPrec, navSuiv;
        var courante = null;
        var elementActif = null;

        // -- Construction de la visionneuse (aucun HTML à écrire dans la page)
        function construire() {
            boite = document.createElement('div');
            boite.className = 'visionneuse-photos';
            boite.id = BOITE_ID;
            boite.hidden = true;
            boite.setAttribute('role', 'dialog');
            boite.setAttribute('aria-modal', 'true');
            boite.setAttribute('aria-label', 'Photo agrandie');
            boite.innerHTML =
                '<span class="visionneuse-photos-compteur" hidden></span>' +
                '<button class="visionneuse-photos-fermer" type="button" aria-label="Fermer la photo">&times;</button>' +
                '<button class="visionneuse-photos-nav visionneuse-photos-prec" type="button" aria-label="Photo précédente">&#10094;</button>' +
                '<figure class="visionneuse-photos-figure">' +
                    '<img alt="">' +
                    '<figcaption class="visionneuse-photos-legende" hidden>' +
                        '<strong class="visionneuse-photos-titre"></strong>' +
                        '<span class="visionneuse-photos-details"></span>' +
                    '</figcaption>' +
                '</figure>' +
                '<button class="visionneuse-photos-nav visionneuse-photos-suiv" type="button" aria-label="Photo suivante">&#10095;</button>';

            document.body.appendChild(boite);

            image = boite.querySelector('img');
            titre = boite.querySelector('.visionneuse-photos-titre');
            details = boite.querySelector('.visionneuse-photos-details');
            compteur = boite.querySelector('.visionneuse-photos-compteur');
            boutonFermer = boite.querySelector('.visionneuse-photos-fermer');
            navPrec = boite.querySelector('.visionneuse-photos-prec');
            navSuiv = boite.querySelector('.visionneuse-photos-suiv');

            boutonFermer.addEventListener('click', fermer);
            navPrec.addEventListener('click', function () { deplacer(-1); });
            navSuiv.addEventListener('click', function () { deplacer(1); });

            // clic sur le fond sombre (mais pas sur la photo ni sur les boutons)
            boite.addEventListener('click', function (evenement) {
                if (evenement.target === boite) fermer();
            });
        }

        // -- Les images agrandissables, relues à la demande
        function photos() {
            var trouvees = document.querySelectorAll(SELECTEUR);
            var vues = [];
            for (var i = 0; i < trouvees.length; i++) {
                if (trouvees[i].getAttribute('src')) vues.push(trouvees[i]);
            }
            return vues;
        }

        // -- Rendre les photos atteignables au clavier (Tab puis Entrée)
        function rendreAccessibles() {
            var liste = photos();
            for (var i = 0; i < liste.length; i++) {
                var el = liste[i];
                if (el.getAttribute('data-zoom-pret')) continue;
                el.setAttribute('data-zoom-pret', '1');
                el.setAttribute('tabindex', '0');
                el.setAttribute('role', 'button');
                el.setAttribute('aria-label', 'Agrandir la photo : ' + (el.getAttribute('alt') || ''));
            }
        }

        function afficher(element) {
            var liste = photos();
            var rang = liste.indexOf(element);
            if (rang < 0) return;

            courante = element;
            image.setAttribute('src', element.getAttribute('src'));
            image.setAttribute('alt', element.getAttribute('alt') || '');

            var carte = element.closest ? element.closest('.oeuvre') : null;
            var titreCarte = carte ? carte.querySelector('.legende h3') : null;
            var dateCarte = carte ? carte.querySelector('.legende p') : null;

            var texte = titreCarte ? titreCarte.textContent.trim() : (element.getAttribute('alt') || '').trim();
            var complement = dateCarte ? dateCarte.textContent.trim() : '';

            titre.textContent = texte;
            details.textContent = complement;
            titre.hidden = !texte;
            details.hidden = !complement;
            boite.querySelector('.visionneuse-photos-legende').hidden = !texte && !complement;

            compteur.textContent = (rang + 1) + ' / ' + liste.length;
            compteur.hidden = liste.length < 2;
            navPrec.hidden = navSuiv.hidden = liste.length < 2;
        }

        function ouvrir(element) {
            if (!boite) construire();
            elementActif = document.activeElement;
            afficher(element);
            boite.hidden = false;
            document.body.classList.add('photo-ouverte');
            boutonFermer.focus();
        }

        function fermer() {
            if (!boite || boite.hidden) return;
            boite.hidden = true;
            document.body.classList.remove('photo-ouverte');
            image.removeAttribute('src');   // libère la mémoire de la copie affichée
            courante = null;
            if (elementActif && elementActif.focus) elementActif.focus();
            elementActif = null;
        }

        function deplacer(pas) {
            var liste = photos();
            if (liste.length < 2) return;
            var rang = courante ? liste.indexOf(courante) : -1;
            if (rang < 0) rang = 0;
            var suivant = (rang + pas + liste.length) % liste.length;
            afficher(liste[suivant]);
        }

        // -- Ouverture depuis n'importe quelle photo de la page
        document.addEventListener('click', function (evenement) {
            var cible = evenement.target;
            if (!cible || cible.tagName !== 'IMG' || !cible.matches || !cible.matches(SELECTEUR)) return;
            evenement.preventDefault();
            ouvrir(cible);
        });

        document.addEventListener('keydown', function (evenement) {
            if (boite && !boite.hidden) {
                if (evenement.key === 'Escape') {
                    evenement.preventDefault();
                    fermer();
                    return;
                }
                if (evenement.key === 'ArrowRight') { evenement.preventDefault(); deplacer(1); return; }
                if (evenement.key === 'ArrowLeft') { evenement.preventDefault(); deplacer(-1); return; }
                if (evenement.key === 'Tab') {
                    // le clavier reste dans la visionneuse tant qu'elle est ouverte
                    var boutons = [boutonFermer, navPrec, navSuiv].filter(function (b) {
                        return b && !b.hidden;
                    });
                    if (!boutons.length) return;
                    var place = boutons.indexOf(document.activeElement);
                    var sens = evenement.shiftKey ? -1 : 1;
                    var suivant = boutons[(place + sens + boutons.length) % boutons.length];
                    evenement.preventDefault();
                    suivant.focus();
                }
                return;
            }

            var cible = evenement.target;
            if ((evenement.key === 'Enter' || evenement.key === ' ') &&
                cible && cible.tagName === 'IMG' && cible.matches && cible.matches(SELECTEUR)) {
                evenement.preventDefault();
                ouvrir(cible);
            }
        });

        rendreAccessibles();

        // Les cartes déjà en place sont couvertes ici. Les suivantes arrivent
        // avec une nouvelle version de la page : elles portent le même gabarit,
        // donc le sélecteur .cadre img les prend en charge sans rien changer.
        var galerie = document.querySelector('.galerie-metal');
        if (galerie && window.MutationObserver) {
            new MutationObserver(rendreAccessibles).observe(galerie, { childList: true, subtree: true });
        }
    });
})();
