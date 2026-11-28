/* ==========================================================================
   Decoration de Noel ephemere - page d'accueil uniquement (FR et EN).
   Fenetre d'affichage : 24/12/2026 18:00:00 -> 04/01/2027 23:59:59, heure de Paris.
   Hors fenetre, ce script ne fait STRICTEMENT RIEN : pas de DOM, pas de CSS,
   pas de requete supplementaire. Rien a redeployer le 24 decembre au soir.

   Apercu hors periode : ajouter ?noel=1 a l'adresse (ex. index.html?noel=1).
   Test d'une autre fenetre : ?noel=1&debut=20261101000000&fin=20261102000000

   Retirer la decoration : supprimer ce fichier et la ligne <script src="noel.js">
   de index.html et de en/index.html.
   ========================================================================== */
(function () {
    'use strict';

    var DEBUT = 20261224180000;   // 2026-12-24 18:00:00, heure de Paris
    var FIN   = 20270104235959;   // 2027-01-04 23:59:59, heure de Paris

    /* --- 1. L'heure de Paris, quel que soit le fuseau du visiteur ---------- */
    function horodatageParis() {
        var d = new Date();
        var annee, mois, jour, heure, minute, seconde;
        try {
            var parts = new Intl.DateTimeFormat('fr-FR', {
                timeZone: 'Europe/Paris',
                hourCycle: 'h23',
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            }).formatToParts(d);
            var o = {};
            parts.forEach(function (p) { if (p.type !== 'literal') { o[p.type] = parseInt(p.value, 10); } });
            annee = o.year; mois = o.month; jour = o.day;
            heure = o.hour; minute = o.minute; seconde = o.second;
            if (!annee || isNaN(annee)) { throw new Error('format inattendu'); }
        } catch (e) {
            annee = d.getFullYear(); mois = d.getMonth() + 1; jour = d.getDate();
            heure = d.getHours(); minute = d.getMinutes(); seconde = d.getSeconds();
        }
        return annee * 1e10 + mois * 1e8 + jour * 1e6 + heure * 1e4 + minute * 100 + seconde;
    }

    /* --- 2. La fenetre est-elle ouverte ? --------------------------------- */
    var params = {};
    location.search.replace(/^\?/, '').split('&').forEach(function (paire) {
        if (!paire) { return; }
        var c = paire.split('=');
        params[decodeURIComponent(c[0])] = decodeURIComponent(c[1] || '');
    });
    var force = params.noel === '1';
    var debut = /^\d{14}$/.test(params.debut || '') ? parseInt(params.debut, 10) : DEBUT;
    var fin   = /^\d{14}$/.test(params.fin || '')   ? parseInt(params.fin, 10)   : FIN;
    var maintenant = horodatageParis();

    if (!force && (maintenant < debut || maintenant > fin)) { return; }

    /* --- 3. Textes, selon la langue de la page ---------------------------- */
    var en = (document.documentElement.lang || 'fr').toLowerCase().indexOf('en') === 0;
    var T = en ? {
        titre:    'Merry Christmas',
        accroche: 'This year, our gift comes as an address.',
        corps:    'The band\u2019s official website is live. The whole story of Saint Erblon \u2014 the garage, the rehearsals, the stages, the tracks, the photos and the memories \u2014 is now one click away.',
        signature:'Saint Erblon \u00b7 Entre Cordes et Cendres',
        photoAlt: 'Santa Claus playing guitar on stage, in front of a screen reading \u201cMerry Christmas and happy new year 2027\u201d',
        fermer:   'Close the Christmas message'
    } : {
        titre:    'Joyeux No\u00ebl',
        accroche: 'Cette ann\u00e9e, notre cadeau tient dans une adresse.',
        corps:    'Le site officiel du groupe est en ligne. Toute l\u2019histoire de Saint Erblon \u2014 le garage, les r\u00e9p\u00e8tes, les sc\u00e8nes, les morceaux, les photos et les souvenirs \u2014 est d\u00e9sormais \u00e0 port\u00e9e de clic.',
        signature:'Saint Erblon \u00b7 Entre Cordes et Cendres',
        photoAlt: 'Le p\u00e8re No\u00ebl \u00e0 la guitare sur sc\u00e8ne, devant un \u00e9cran \u00ab\u00a0Joyeux No\u00ebl et bonne ann\u00e9e 2027\u00a0\u00bb',
        fermer:   'Fermer le message de No\u00ebl'
    };

    /* --- 4. Styles -------------------------------------------------------- */
    var css = [
        '@keyframes noel-scintille{0%,100%{opacity:.32;transform:scale(.85)}50%{opacity:1;transform:scale(1)}}',
        '@keyframes noel-tombe{0%{transform:translate3d(0,-6vh,0)}100%{transform:translate3d(18px,106vh,0)}}',
        '.noel-guirlande{position:absolute;left:0;right:0;top:56px;height:22px;display:flex;',
        'align-items:center;justify-content:space-between;padding:0 24px;pointer-events:none;z-index:5}',
        '.noel-guirlande::before{content:"";position:absolute;left:0;right:0;top:11px;height:1px;',
        'background:linear-gradient(90deg,transparent,rgba(255,255,255,.16) 12%,rgba(255,255,255,.16) 88%,transparent)}',
        '.noel-ampoule{width:7px;height:7px;border-radius:50%;position:relative;flex:0 0 auto;',
        'animation:noel-scintille 3.4s ease-in-out infinite}',
        '.noel-ampoule.or{background:radial-gradient(circle at 35% 32%,#fff8e1,#f2c14e 58%,#8a6314);box-shadow:0 0 9px rgba(242,193,78,.85)}',
        '.noel-ampoule.rouge{background:radial-gradient(circle at 35% 32%,#ffd9d9,#d32f2f 58%,#6b0f0f);box-shadow:0 0 9px rgba(211,47,47,.8)}',
        '.noel-ampoule.vert{background:radial-gradient(circle at 35% 32%,#e6ffe9,#3d8f5e 58%,#123f24);box-shadow:0 0 9px rgba(61,143,94,.8)}',
        '.noel-neige{position:fixed;inset:0;pointer-events:none;z-index:900;overflow:hidden}',
        '.noel-flocon{position:absolute;top:-8vh;border-radius:50%;background:#fff;opacity:.5;',
        'animation-name:noel-tombe;animation-timing-function:linear;animation-iteration-count:infinite}',
        '.noel-bande{padding:56px 20px 30px;position:relative}',
        '.noel-encart{max-width:820px;margin:0 auto;padding:36px 30px 30px;text-align:center;position:relative;',
        'background:linear-gradient(180deg,#1c1613,#141414);border:1px solid rgba(242,193,78,.32);',
        'border-radius:6px;box-shadow:0 0 46px rgba(185,29,29,.14) inset,0 8px 28px rgba(0,0,0,.45)}',
        '.noel-etoiles{font-size:.85rem;letter-spacing:.5em;color:#f2c14e;opacity:.8;margin-bottom:14px}',
        '.noel-titre{font-family:var(--font-head,"Oswald",sans-serif);text-transform:uppercase;',
        'letter-spacing:3px;font-size:2rem;line-height:1.15;color:#f2c14e;margin:0 0 10px;',
        'text-shadow:0 0 22px rgba(242,193,78,.28)}',
        '.noel-accroche{font-family:var(--font-head,"Oswald",sans-serif);text-transform:uppercase;',
        'letter-spacing:1.5px;font-size:.9rem;color:#cfc7b8;margin:0 0 18px}',
        '.noel-corps{color:#d8d3c8;font-size:1.02rem;max-width:620px;margin:0 auto 20px;line-height:1.65}',
        '.noel-photo{display:block;margin:0 auto 22px;max-height:300px;width:auto;max-width:100%;',
        'border-radius:6px;border:1px solid rgba(242,193,78,.2);box-shadow:0 8px 26px rgba(0,0,0,.55)}',
        '.noel-signature{display:block;margin-top:22px;font-size:.78rem;letter-spacing:1.6px;',
        'text-transform:uppercase;color:#857f74}',
        '.noel-fermer{position:absolute;top:8px;right:10px;background:none;border:0;color:#7d776c;',
        'font-size:20px;line-height:1;padding:6px 8px;cursor:pointer;transition:color .2s}',
        '.noel-fermer:hover{color:#f2c14e}',
        '@media (max-width:640px){.noel-titre{font-size:1.45rem;letter-spacing:2px}',
        '.noel-encart{padding:30px 20px 24px}.noel-bande{padding:44px 16px 26px}',
        '.noel-photo{max-height:230px}',
        '.noel-guirlande .noel-ampoule:nth-child(odd){display:none}}',
        '@media (prefers-reduced-motion:reduce){.noel-ampoule{animation:none;opacity:.85}',
        '.noel-flocon{display:none}}'
    ].join('');

    var style = document.createElement('style');
    style.id = 'noel-style';
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);

    /* --- 5. Guirlande lumineuse sous le bandeau --------------------------- */
    var home = document.getElementById('home');
    var guirlande = null;
    if (home) {
        guirlande = document.createElement('div');
        guirlande.className = 'noel-guirlande';
        guirlande.setAttribute('aria-hidden', 'true');
        var modeles = ['or', 'rouge', 'vert', 'or'];
        var nombre = window.innerWidth < 640 ? 18 : 34;
        for (var i = 0; i < nombre; i++) {
            var amp = document.createElement('span');
            amp.className = 'noel-ampoule ' + modeles[i % modeles.length];
            amp.style.animationDelay = ((i * 0.37) % 3.4).toFixed(2) + 's';
            amp.style.animationDuration = (2.8 + (i % 5) * 0.25).toFixed(2) + 's';
            guirlande.appendChild(amp);
        }
        home.insertBefore(guirlande, home.firstChild);
    }

    function placerGuirlande() {
        if (!guirlande) { return; }
        var entete = document.querySelector('header');
        var bas = entete ? Math.round(entete.getBoundingClientRect().bottom) : 56;
        guirlande.style.top = Math.max(0, bas) + 'px';
    }
    placerGuirlande();
    window.addEventListener('resize', placerGuirlande);
    window.addEventListener('load', placerGuirlande);

    /* --- 6. Neige douce --------------------------------------------------- */
    var neige = document.createElement('div');
    neige.className = 'noel-neige';
    neige.setAttribute('aria-hidden', 'true');
    var flocons = window.innerWidth < 640 ? 9 : 16;
    for (var j = 0; j < flocons; j++) {
        var f = document.createElement('span');
        f.className = 'noel-flocon';
        var taille = 2 + Math.random() * 3;
        var duree = 11 + Math.random() * 13;
        f.style.width = taille.toFixed(1) + 'px';
        f.style.height = taille.toFixed(1) + 'px';
        f.style.left = (Math.random() * 100).toFixed(2) + '%';
        f.style.animationDuration = duree.toFixed(1) + 's';
        f.style.animationDelay = (-Math.random() * duree).toFixed(1) + 's';
        f.style.opacity = (0.28 + Math.random() * 0.32).toFixed(2);
        neige.appendChild(f);
    }
    document.body.appendChild(neige);

    /* --- 7. L'encart "Joyeux Noel", sous le hero -------------------------- */
    if (!home) { return; }

    var ferme = false;
    try { ferme = window.sessionStorage.getItem('noel-ferme') === '1'; } catch (e) { ferme = false; }
    if (ferme) { return; }

    var bande = document.createElement('div');
    bande.className = 'noel-bande';

    /* L'image vit a la racine du depot, a cote de noel.js : le chemin se deduit
       du <script>, pour fonctionner aussi bien depuis / que depuis /en/. */
    var scriptTag = document.querySelector('script[src$="noel.js"]');
    var racine = scriptTag ? scriptTag.src.replace(/noel\.js(\?.*)?$/, '') : '';

    bande.innerHTML =
        '<aside class="noel-encart" role="note" aria-label="' + T.titre + '">' +
            '<button type="button" class="noel-fermer" aria-label="' + T.fermer + '">&times;</button>' +
            '<img class="noel-photo" src="' + racine + 'images/perenoel.jpg" alt="' + T.photoAlt + '">' +
            '<div class="noel-etoiles" aria-hidden="true">\u2726 \u2726 \u2726</div>' +
            '<h2 class="noel-titre">' + T.titre + '</h2>' +
            '<p class="noel-accroche">' + T.accroche + '</p>' +
            '<p class="noel-corps">' + T.corps + '</p>' +
            '<span class="noel-signature">' + T.signature + '</span>' +
        '</aside>';

    home.parentNode.insertBefore(bande, home.nextSibling);

    /* Si l'image manque (404), l'encart reste lisible sans elle. */
    var visuel = bande.querySelector('.noel-photo');
    if (visuel) {
        visuel.addEventListener('error', function () {
            if (visuel.parentNode) { visuel.parentNode.removeChild(visuel); }
        });
    }

    bande.querySelector('.noel-fermer').addEventListener('click', function () {
        bande.parentNode.removeChild(bande);
        try { window.sessionStorage.setItem('noel-ferme', '1'); } catch (e) { /* stockage indisponible */ }
    });
})();
