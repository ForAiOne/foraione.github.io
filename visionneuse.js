/*
 * Visionneuse de videos des archives.
 *
 * Principe : dans la page, une vidéo se présente comme une vignette (son image de
 * couverture + un bouton de lecture). Au clic, elle s'ouvre en grand par-dessus la
 * page et démarre ; à la fin de la lecture, elle se referme toute seule et l'on
 * retrouve la vignette.
 *
 * Ce qui doit se trouver dans la page :
 *
 *   <button class="vignette" type="button"
 *           data-video="videos/x.mp4" data-poster="videos/x.jpg"
 *           aria-label="Lire la vidéo : ...">
 *       <img src="videos/x.jpg" alt="..." loading="lazy">
 *       <span class="vignette-play" aria-hidden="true"><i class="fas fa-play"></i></span>
 *   </button>
 *
 *   <div class="visionneuse" id="visionneuse" hidden role="dialog" aria-modal="true"
 *        aria-label="Lecture de la vidéo">
 *       <button class="visionneuse-fermer" type="button" aria-label="Fermer la vidéo">&times;</button>
 *       <video controls playsinline preload="none"></video>
 *       <p class="visionneuse-erreur" hidden>
 *           La lecture n'a pas fonctionné dans ce navigateur.
 *           <a class="visionneuse-lien" href="#" download>Télécharger la vidéo</a>.
 *       </p>
 *   </div>
 *
 * La vidéo n'est téléchargée qu'à l'ouverture : la page reste légère.
 */
(function () {
    'use strict';

    // Durée pendant laquelle la dernière image reste affichée avant la fermeture.
    var DELAI_APRES_FIN = 900;

    function quandLaPageEstPrete(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    }

    quandLaPageEstPrete(function () {
        var boite = document.getElementById('visionneuse');
        if (!boite) return;

        var video = boite.querySelector('video');
        var boutonFermer = boite.querySelector('.visionneuse-fermer');
        var messageErreur = boite.querySelector('.visionneuse-erreur');
        var lien = boite.querySelector('.visionneuse-lien');
        var minuteur = null;
        var vignetteActive = null;

        function ouvrir(vignette) {
            var source = vignette.getAttribute('data-video');
            if (!source) return;

            vignetteActive = vignette;
            var affiche = vignette.getAttribute('data-poster');
            if (affiche) video.setAttribute('poster', affiche);
            if (messageErreur) messageErreur.hidden = true;
            if (lien) lien.setAttribute('href', source);

            video.setAttribute('src', source);
            try {
                video.currentTime = 0;   // certains navigateurs mobiles reprennent où l'on s'était arrêté
            } catch (e) { /* média pas encore chargé : sans conséquence */ }
            boite.hidden = false;
            document.body.classList.add('visionneuse-ouverte');
            if (boutonFermer) boutonFermer.focus();

            var lecture = video.play();
            if (lecture && typeof lecture.catch === 'function') {
                // Safari et consorts peuvent refuser la lecture automatique : les
                // contrôles sont là, l'utilisateur relance d'un clic.
                lecture.catch(function () {});
            }
        }

        function fermer() {
            if (boite.hidden) return;
            if (minuteur) {
                clearTimeout(minuteur);
                minuteur = null;
            }
            video.pause();
            video.removeAttribute('src');   // coupe le téléchargement et libère la mémoire
            video.load();
            boite.hidden = true;
            document.body.classList.remove('visionneuse-ouverte');
            if (vignetteActive) {
                vignetteActive.focus();
                vignetteActive = null;
            }
        }

        // ouverture depuis n'importe quelle vignette de la page
        document.addEventListener('click', function (evenement) {
            var cible = evenement.target;
            var vignette = cible && cible.closest ? cible.closest('.vignette') : null;
            if (!vignette) return;
            evenement.preventDefault();
            ouvrir(vignette);
        });

        if (boutonFermer) boutonFermer.addEventListener('click', fermer);

        // clic sur le fond sombre (mais pas sur la vidéo ni sur les contrôles)
        boite.addEventListener('click', function (evenement) {
            if (evenement.target === boite) fermer();
        });

        document.addEventListener('keydown', function (evenement) {
            if (evenement.key === 'Escape' && !boite.hidden) fermer();
        });

        // fin de lecture : on laisse la dernière image, puis on referme
        video.addEventListener('ended', function () {
            minuteur = setTimeout(fermer, DELAI_APRES_FIN);
        });

        video.addEventListener('error', function () {
            if (!video.getAttribute('src')) return;   // l'erreur vient de load() à la fermeture
            if (messageErreur) messageErreur.hidden = false;
        });
    });
})();
