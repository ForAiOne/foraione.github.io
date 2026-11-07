/* abonnement.js - envoi des formulaires newsletter et contact.
 *
 * Les deux formulaires du bas de l'accueil (inscription newsletter et message
 * a l'equipe) sont recus par le service du VPS, joignable par le funnel
 * Tailscale :  https://ubuntu.tail1ccb87.ts.net/api/{newsletter|contact}
 *
 * Sans JavaScript, le formulaire part normalement et le service renvoie une
 * page de remerciement. Avec JavaScript, on reste sur la page : le message de
 * reponse s'affiche sous le bouton.
 *
 * Un formulaire s'active avec  data-abonnement="newsletter"  ou  "contact".
 * Les identifiants sont propres a chaque formulaire (ils ne doivent pas se
 * repeter dans une meme page).
 */
(function () {
    "use strict";

    var DELAI = 20000;                     // au-dela, on considere que ca a echoue

    function elementEtat(formulaire) {
        return formulaire.querySelector("[data-etat]");
    }

    function afficher(formulaire, texte, nature) {
        var zone = elementEtat(formulaire);
        if (!zone) { return; }
        zone.textContent = texte;
        zone.className = "etat-abonnement " + nature;
        zone.hidden = false;
    }

    var repliNatif = false;

    function traiter(formulaire) {
        formulaire.addEventListener("submit", function (evenement) {
            if (!window.fetch || !window.FormData) { return; }   // repli natif
            if (repliNatif) { return; }                          // deja reparti

            evenement.preventDefault();

            var bouton = formulaire.querySelector("button[type=submit]");
            var libelle = bouton ? bouton.textContent : "";
            var envoi = new URLSearchParams(new FormData(formulaire));

            if (bouton) { bouton.disabled = true; bouton.textContent = formulaire.getAttribute("data-msg-envoi") || "..."; }
            afficher(formulaire, "", "attente");

            var minuteur = setTimeout(function () {
                if (bouton) { bouton.disabled = false; bouton.textContent = libelle; }
                afficher(formulaire, formulaire.getAttribute("data-msg-panne") || "L'envoi a echoue.", "erreur");
            }, DELAI);

            fetch(formulaire.getAttribute("action"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                    "Accept": "application/json",
                    "X-Requested-With": "fetch"
                },
                body: envoi.toString()
            }).then(function (reponse) {
                clearTimeout(minuteur);
                return reponse.json().then(function (charge) {
                    return { statut: reponse.status, charge: charge };
                });
            }).then(function (resultat) {
                if (bouton) { bouton.disabled = false; bouton.textContent = libelle; }

                if (resultat.charge && resultat.charge.ok) {
                    // Le service renvoie le bon texte dans la langue de la page.
                    formulaire.reset();
                    afficher(formulaire, resultat.charge.message, "succes");
                    formulaire.classList.add("envoye");
                } else {
                    afficher(formulaire,
                             (resultat.charge && resultat.charge.message)
                             || formulaire.getAttribute("data-msg-panne") || "L'envoi a echoue.",
                             "erreur");
                }
            }).catch(function () {
                clearTimeout(minuteur);
                // Le navigateur a bloque la requete avant le reseau : c'est le
                // cas d'un visiteur qui a Tailscale installe, le nom *.ts.net se
                // resout alors vers une adresse privee et Chrome refuse l'appel
                // depuis une page publique (Local Network Access). On laisse
                // donc le formulaire partir normalement : une navigation n'est
                // pas soumise a cette restriction, et le service repond par sa
                // page de remerciement.
                repliNatif = true;
                if (bouton) { bouton.disabled = true; }
                HTMLFormElement.prototype.submit.call(formulaire);
            });
        });
    }

    function demarrer() {
        var formulaires = document.querySelectorAll("[data-abonnement]");
        for (var i = 0; i < formulaires.length; i++) {
            traiter(formulaires[i]);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", demarrer);
    } else {
        demarrer();
    }
})();
