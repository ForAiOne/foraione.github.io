/* Menu du bandeau sur petit ecran (768 px et moins).
 *
 * Un seul fichier pour les 9 pages : le bouton porte onclick="toggleMenu()",
 * donc aucune page n'a besoin de sa propre copie de la fonction.
 */
(function () {
    'use strict';

    function basculer() {
        var liens = document.getElementById('navLinks');
        var bouton = document.querySelector('.mobile-menu-btn');
        if (!liens) { return; }
        var ouvert = liens.classList.toggle('active');
        if (bouton) { bouton.setAttribute('aria-expanded', ouvert ? 'true' : 'false'); }
    }

    window.toggleMenu = basculer;

    // Un clic sur une page du menu le referme ; sans cela il reste ouvert
    // devant le contenu sur telephone.
    document.addEventListener('click', function (evenement) {
        var cible = evenement.target;
        if (!cible || !cible.closest) { return; }
        if (!cible.closest('.nav-links a')) { return; }
        var liens = document.getElementById('navLinks');
        var bouton = document.querySelector('.mobile-menu-btn');
        if (liens) { liens.classList.remove('active'); }
        if (bouton) { bouton.setAttribute('aria-expanded', 'false'); }
    });

    // Passage en grand ecran : on referme pour ne pas garder un etat incoherent.
    window.addEventListener('resize', function () {
        if (window.innerWidth > 768) {
            var liens = document.getElementById('navLinks');
            if (liens) { liens.classList.remove('active'); }
        }
    });
})();
