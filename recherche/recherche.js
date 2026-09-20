/* Recherche dans le site Saint Erblon.
 *
 * Aucune IA, aucune dependance, aucun appel a un service externe : l'index est
 * un fichier JSON servi par le site lui-meme, et tout le travail se fait dans
 * le navigateur du visiteur.
 *
 * Deux usages :
 *   1. le champ du bandeau : on tape, les passages correspondants s'affichent ;
 *   2. l'arrivee depuis un resultat (page.html#r-12) : la page defile jusqu'au
 *      passage et le met en surbrillance quelques secondes.
 */
(function () {
    'use strict';

    var URL_INDEX = 'recherche/index.json';
    var MAX_RESULTATS = 8;
    var LONGUEUR_EXTRAIT = 150;

    var index = null;          // { pages: [...], blocs: [...] }
    var inverse = null;        // mot -> [ids de blocs]
    var chargement = null;     // promesse de chargement, pour ne charger qu'une fois
    var minuteurSurlignage = null;   // retrait differe du surlignage de passage

    // ------------------------------------------------------------------ outils
    /* Normalisation : accents, casse, et LIGATURES. Le point des ligatures est
       facile a oublier : NFD ne decompose pas « œ », donc « boite a oeufs » ne
       trouvait pas « boîtes à œufs ». */
    function sansLigatures(texte) {
        return texte.replace(/\u0153/g, 'oe').replace(/\u00e6/g, 'ae');
    }

    function sansAccents(texte) {
        return sansLigatures(texte.normalize('NFD').replace(/[\u0300-\u036f]/g, '')).toLowerCase();
    }

    function motsCles(texte) {
        return sansAccents(texte).split(/[^a-z0-9]+/).filter(function (m) {
            return m.length >= 2;
        });
    }

    /* Normalise en gardant, pour chaque caractere produit, sa position dans le
       texte d'origine : c'est ce qui permet de surligner juste. Les ligatures
       produisent deux caracteres pour un seul d'origine : les deux pointent
       donc vers la meme position. */
    function normaliserAvecCarte(texte) {
        var bas = texte.toLowerCase();
        var norm = '';
        var carte = [];
        for (var i = 0; i < bas.length; i++) {
            var c = bas[i].normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            c = sansLigatures(c);
            for (var k = 0; k < c.length; k++) {
                norm += c[k];
                carte.push(i);
            }
        }
        return { norm: norm, carte: carte };
    }

    // ------------------------------------------------------------- chargement
    function charger() {
        if (chargement) return chargement;
        chargement = fetch(URL_INDEX)
            .then(function (r) {
                if (!r.ok) throw new Error('index indisponible');
                return r.json();
            })
            .then(function (donnees) {
                index = donnees;
                inverse = {};
                index.blocs.forEach(function (bloc, id) {
                    // Texte normalise precalcule : sans ca, chaque recherche
                    // renormalisait les 107 blocs (mesure : ~1 s).
                    bloc._norm = sansAccents(bloc.titre + ' ' + bloc.texte);
                    var vus = {};
                    bloc._norm.split(/[^a-z0-9]+/).forEach(function (mot) {
                        if (mot.length >= 2) vus[mot] = true;
                    });
                    Object.keys(vus).forEach(function (mot) {
                        (inverse[mot] = inverse[mot] || []).push(id);
                    });
                });
                return index;
            })
            .catch(function (erreur) {
                chargement = null;
                throw erreur;
            });
        return chargement;
    }

    // ---------------------------------------------------------------- recherche
    function chercher(requete) {
        var jetons = motsCles(requete);
        if (!jetons.length) return [];

        var scores = {};
        var clefs = Object.keys(inverse);
        jetons.forEach(function (jeton) {
            var touches = {};
            // prefixe : « longu » trouve « longuefuye »
            clefs.forEach(function (mot) {
                if (mot.indexOf(jeton) === 0) {
                    inverse[mot].forEach(function (id) {
                        touches[id] = (touches[id] || 0) + (mot === jeton ? 3 : 1);
                    });
                }
            });
            Object.keys(touches).forEach(function (id) {
                scores[id] = (scores[id] || 0) + touches[id];
            });
        });

        // il faut que TOUS les mots de la question soient presents
        var resultats = [];
        Object.keys(scores).forEach(function (id) {
            var bloc = index.blocs[id];
            var texteNorm = bloc._norm || sansAccents(bloc.titre + ' ' + bloc.texte);
            var complet = jetons.every(function (jeton) {
                return texteNorm.indexOf(jeton) !== -1;
            });
            if (!complet) return;
            // Un mot trouve DANS LE TITRE designe mieux le passage : sans ce
            // poids, une page qui cite les mots au detour d'une phrase passait
            // devant le passage qui porte precisement le sujet.
            var titreNorm = sansAccents(bloc.titre || '');
            var dansLeTitre = jetons.filter(function (jeton) {
                return titreNorm.indexOf(jeton) !== -1;
            }).length;
            resultats.push({
                id: parseInt(id, 10),
                score: scores[id] + dansLeTitre * 5 + (bloc.ancre ? 1 : 0)
            });
        });
        resultats.sort(function (a, b) { return b.score - a.score; });
        return resultats.slice(0, MAX_RESULTATS);
    }

    /* Extrait autour du premier mot trouve, avec les correspondances marquees. */
    function extrait(bloc, requete) {
        var jetons = motsCles(requete);
        var carte = normaliserAvecCarte(bloc.texte);
        var position = -1;
        for (var i = 0; i < jetons.length && position < 0; i++) {
            position = carte.norm.indexOf(jetons[i]);
        }
        if (position < 0) position = 0;

        var departCar = position > 0 ? position - 60 : 0;
        var debut = carte.carte[Math.max(0, departCar)] || 0;
        var finCar = Math.min(carte.carte.length - 1, position + LONGUEUR_EXTRAIT);
        var fin = (carte.carte[finCar] || bloc.texte.length - 1) + 1;

        var morceau = bloc.texte.slice(debut, fin);
        return (debut > 0 ? '… ' : '') + surligner(morceau, jetons) +
               (fin < bloc.texte.length ? ' …' : '');
    }

    /* Entoure les mots trouves dans un texte (titre ou extrait). */
    function surligner(texte, jetons) {
        var carte = normaliserAvecCarte(texte);
        var intervalles = [];
        jetons.forEach(function (jeton) {
            var depuis = 0;
            var trouve;
            while ((trouve = carte.norm.indexOf(jeton, depuis)) !== -1) {
                var a = carte.carte[trouve];
                var b = carte.carte[Math.min(trouve + jeton.length - 1,
                                              carte.carte.length - 1)] + 1;
                intervalles.push([a, b]);
                depuis = trouve + jeton.length;
            }
        });
        intervalles.sort(function (x, y) { return x[0] - y[0]; });

        var html = '';
        var curseur = 0;
        intervalles.forEach(function (intervalle) {
            if (intervalle[0] < curseur) return;
            html += echapper(texte.slice(curseur, intervalle[0]));
            html += '<mark>' + echapper(texte.slice(intervalle[0], intervalle[1])) + '</mark>';
            curseur = intervalle[1];
        });
        return html + echapper(texte.slice(curseur));
    }

    function echapper(texte) {
        return texte.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function nomPage(fichier) {
        var page = (index.pages || []).filter(function (p) { return p.fichier === fichier; })[0];
        return page ? page.titre : fichier;
    }

    // ------------------------------------------------------------------ affichage
    function installerChamp() {
        var zone = document.getElementById('recherche');
        if (!zone) return;
        var champ = document.getElementById('recherche-champ');
        var panneau = document.getElementById('recherche-resultats');
        if (!champ || !panneau) return;

        var minuteur = null;
        var dernieres = [];

        function fermer() {
            panneau.hidden = true;
            panneau.innerHTML = '';
        }

        function afficher(resultats, requete) {
            if (!resultats.length) {
                panneau.innerHTML = '<div class="recherche-vide">Aucun passage ne contient « ' +
                    echapper(requete) + ' ».</div>';
                panneau.hidden = false;
                return;
            }
            panneau.innerHTML = resultats.map(function (resultat) {
                var bloc = index.blocs[resultat.id];
                var lien = bloc.page + '#r-' + bloc.id;
                var jetons = motsCles(requete);
                return '<a class="recherche-item" href="' + lien + '">' +
                    '<span class="ri-page">' + echapper(nomPage(bloc.page)) + '</span>' +
                    (bloc.titre ? '<span class="ri-titre">' + surligner(bloc.titre, jetons) +
                                  '</span>' : '') +
                    '<span class="ri-extrait">' + extrait(bloc, requete) + '</span></a>';
            }).join('');
            panneau.hidden = false;
            dernieres = resultats;
        }

        function lancer() {
            var requete = champ.value.trim();
            if (requete.length < 2) { fermer(); return; }
            charger().then(function () {
                afficher(chercher(requete), requete);
            }).catch(function () {
                panneau.innerHTML = '<div class="recherche-vide">Recherche indisponible ' +
                    '(index non chargé).</div>';
                panneau.hidden = false;
            });
        }

        champ.addEventListener('input', function () {
            clearTimeout(minuteur);
            minuteur = setTimeout(lancer, 120);
        });
        champ.addEventListener('keydown', function (evenement) {
            if (evenement.key === 'Escape') { champ.value = ''; fermer(); champ.blur(); }
            if (evenement.key === 'Enter' && dernieres.length) {
                evenement.preventDefault();
                window.location.href = index.blocs[dernieres[0].id].page +
                    '#r-' + dernieres[0].id;
            }
        });
        document.addEventListener('click', function (evenement) {
            if (!zone.contains(evenement.target)) fermer();
        });
        document.addEventListener('keydown', function (evenement) {
            if (evenement.key === 'Escape') fermer();
        });
    }

    // ------------------------------------------- arrivee sur un passage precis
    /* Comparaison « compacte » : on retire accents, casse, espaces et
       ponctuation des deux cotes. Indispensable ici : l'index ajoute un espace
       entre les balises, alors que textContent les colle. Sans ca, les extraits
       longs ne retrouvaient pas leur passage (« Jar • Face arrière »). */
    function compacter(texte) {
        return sansAccents(texte).replace(/[^a-z0-9]/g, '');
    }

    /* Retrouve l'element qui porte le passage : on cherche le PLUS PETIT
       element dont le texte contient le debut du bloc. Aucune ancre n'est
       necessaire dans le HTML, la page n'est pas modifiee. */
    function trouverElement(bloc) {
        var texte = compacter(bloc.texte);
        var titre = compacter(bloc.titre);
        var aiguilles = [texte.slice(0, 36), texte.slice(0, 24), texte.slice(0, 16),
                         texte.slice(0, 10)];
        if (titre.length >= 8) aiguilles.push(titre);
        var elements = document.querySelectorAll('main p, main li, main h2, main h3, ' +
            'main h4, main figcaption, main blockquote, main .card, main .morceau, ' +
            'main .fiche, main .commune, main .etape-lieu, main .labo-intro, ' +
            'main .section-header, main .legende, main article, main div');
        for (var a = 0; a < aiguilles.length; a++) {
            if (aiguilles[a].length < 8) break;
            var meilleur = null;
            var longueur = Infinity;
            for (var i = 0; i < elements.length; i++) {
                var candidat = compacter(elements[i].textContent || '');
                if (candidat.indexOf(aiguilles[a]) === -1) continue;
                if (candidat.length < longueur) { longueur = candidat.length; meilleur = elements[i]; }
            }
            if (meilleur) return meilleur;
        }
        if (bloc.ancre) {
            var element = document.getElementById(bloc.ancre);
            if (element) return element;
        }
        return null;
    }

    function allerAuPassage(id) {
        charger().then(function () {
            var bloc = index.blocs[id];
            if (!bloc) return;
            var cible = trouverElement(bloc);
            if (!cible) return;
            // Un seul passage surligne a la fois : sans ce nettoyage, enchainer
            // deux resultats de la MEME page laissait le premier allume.
            var anciens = document.querySelectorAll('.surligne');
            for (var i = 0; i < anciens.length; i++) {
                anciens[i].classList.remove('surligne');
            }
            clearTimeout(minuteurSurlignage);
            // defilement instantane : le « smooth » ne s'execute pas toujours
            // (navigateur sans animation, onglet en arriere-plan)
            cible.scrollIntoView({ block: 'center' });
            cible.classList.add('surligne');
            minuteurSurlignage = setTimeout(function () {
                cible.classList.remove('surligne');
            }, 3500);
        }).catch(function () {});
    }

    // ---------------------------------------------------------------- demarrage
    function gererHash() {
        var trouve = /^#r-(\d+)$/.exec(window.location.hash || '');
        if (trouve) allerAuPassage(parseInt(trouve[1], 10));
    }

    function demarrer() {
        installerChamp();
        gererHash();
        // Un clic sur un resultat qui vise la MEME page ne recharge pas le
        // document : seul le hash change, donc le script doit reagir.
        window.addEventListener('hashchange', gererHash);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', demarrer);
    } else {
        demarrer();
    }
})();
