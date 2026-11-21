/* Votes par etoiles du Labo (1 a 5, anonyme).
   Le site est statique : les votes vivent dans un petit service du VPS, joint par
   Tailscale Funnel (HTTPS). Rien n'est publie sans lui : si le service ne repond
   pas, les etoiles restent visibles mais inactives, et le Labo continue de jouer.
   Un clic = un vote ; recliquer remplace la note precedente (comme sur Google). */
(function () {
    'use strict';

    var API = window.LABO_VOTES_URL || 'https://ubuntu.tail1ccb87.ts.net/votes';
    var EN = (document.documentElement.lang === 'en');
    var T = EN ? {
        groupe: 'Rate this track out of 5',
        etoile: 'n out of 5',
        indisponible: 'Voting is unavailable right now.',
        echec: 'Your vote could not be saved.',
        vote: 'vote',
        votes: 'votes'
    } : {
        groupe: 'Noter ce morceau sur 5',
        etoile: 'n sur 5',
        indisponible: 'Les votes sont indisponibles pour le moment.',
        echec: "Ton vote n'a pas pu être enregistré.",
        vote: 'vote',
        votes: 'votes'
    };

    var etats = {};          // fichier -> { nombre, moyenne, moi }
    var enCours = {};        // fichier -> true pendant l'envoi
    var disponible = null;   // null : on ne sait pas encore

    function moyenneTexte(v) {
        if (!v || !v.nombre) return '';
        var m = (Math.round(v.moyenne * 10) / 10).toFixed(1);
        if (!EN) m = m.replace('.', ',');
        return m + ' (' + v.nombre + ' ' + (v.nombre > 1 ? T.votes : T.vote) + ')';
    }

    function fabriquer(conteneur) {
        var fichier = conteneur.getAttribute('data-fichier');
        var groupe = document.createElement('div');
        groupe.className = 'vote-etoiles';
        groupe.setAttribute('role', 'group');
        groupe.setAttribute('aria-label', T.groupe);

        for (var n = 1; n <= 5; n++) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'vote-etoile';
            b.setAttribute('data-note', String(n));
            b.setAttribute('aria-label', T.etoile.replace('n', String(n)));
            var i = document.createElement('i');
            i.className = 'far fa-star';
            i.setAttribute('aria-hidden', 'true');
            b.appendChild(i);
            groupe.appendChild(b);
        }

        var texte = document.createElement('span');
        texte.className = 'vote-moyenne';

        conteneur.appendChild(groupe);
        conteneur.appendChild(texte);

        // Un clic sur une etoile ne doit pas lancer le morceau.
        conteneur.addEventListener('click', function (e) {
            e.stopPropagation();
        });

        groupe.addEventListener('click', function (e) {
            var cible = e.target.closest ? e.target.closest('.vote-etoile') : null;
            if (!cible || disponible === false) return;
            voter(fichier, parseInt(cible.getAttribute('data-note'), 10));
        });

        // Apercu au survol : les etoiles jusque la souris s'allument.
        groupe.addEventListener('mouseover', function (e) {
            var cible = e.target.closest ? e.target.closest('.vote-etoile') : null;
            if (!cible || disponible === false) return;
            peindre(conteneur, parseInt(cible.getAttribute('data-note'), 10));
        });
        groupe.addEventListener('mouseleave', function () {
            peindre(conteneur);
        });

        conteneur.setAttribute('data-pret', '1');
    }

    // dessine les etoiles : n = survol en cours (sinon la note enregistree)
    function peindre(conteneur, survol) {
        var fichier = conteneur.getAttribute('data-fichier');
        var v = etats[fichier] || {};
        var note = survol || v.moi || 0;
        var boutons = conteneur.querySelectorAll('.vote-etoile');
        for (var i = 0; i < boutons.length; i++) {
            var n = i + 1;
            var pleine = n <= note;
            boutons[i].classList.toggle('pleine', pleine);
            var icone = boutons[i].firstChild;
            icone.className = (pleine ? 'fas' : 'far') + ' fa-star';
        }
        var texte = conteneur.querySelector('.vote-moyenne');
        if (texte) texte.textContent = moyenneTexte(v);
    }

    function maj() {
        var zones = document.querySelectorAll('.vote[data-fichier]');
        for (var i = 0; i < zones.length; i++) {
            if (zones[i].getAttribute('data-pret') !== '1') fabriquer(zones[i]);
            zones[i].classList.toggle('vote-indisponible', disponible === false);
            zoneActive(zones[i], disponible !== false);
            peindre(zones[i]);
        }
    }

    function zoneActive(conteneur, actif) {
        var boutons = conteneur.querySelectorAll('.vote-etoile');
        for (var i = 0; i < boutons.length; i++) boutons[i].disabled = !actif;
        conteneur.title = actif ? '' : T.indisponible;
    }

    function voter(fichier, note) {
        if (!note || enCours[fichier]) return;
        var avant = etats[fichier] ? etats[fichier].moi : 0;
        enCours[fichier] = true;
        etats[fichier] = etats[fichier] || { nombre: 0, moyenne: 0, moi: 0 };
        etats[fichier].moi = note;             // affichage immediat (optimiste)
        maj();

        fetch(API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fichier: fichier, note: note }),
            cache: 'no-store'
        }).then(function (r) {
            return r.json().then(function (d) { return { statut: r.status, donnees: d }; });
        }).then(function (res) {
            if (res.donnees && res.donnees.ok && res.donnees.votes) {
                etats = res.donnees.votes;
                disponible = true;
            } else {
                etats[fichier].moi = avant;    // on revient a l'etat d'avant
                throw new Error((res.donnees && res.donnees.erreur) || 'refus');
            }
        }).catch(function () {
            if (etats[fichier]) etats[fichier].moi = avant;
            conteneurMessage(fichier);
        }).then(function () {
            delete enCours[fichier];
            maj();
        });
    }

    function conteneurMessage(fichier) {
        var zone = document.querySelector('.vote[data-fichier="' + fichier.replace(/"/g, '') + '"]');
        if (!zone) return;
        zone.title = T.echec;
    }

    function rafraichir() {
        fetch(API, { cache: 'no-store' })
            .then(function (r) { return r.json(); })
            .then(function (d) {
                if (!d || !d.ok) throw new Error('reponse inattendue');
                etats = d.votes || {};
                disponible = true;
            })
            .catch(function () {
                disponible = false;
            })
            .then(maj);
    }

    window.LaboVotes = { rafraichir: rafraichir, maj: maj };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', rafraichir);
    } else {
        rafraichir();
    }
})();
