# Kultivo (ex-« Culture G ») — mémo du projet

Quiz de culture générale façon Duolingo, 100 % navigateur (HTML/CSS/JS), sans serveur.
Propriétaire : francophone. Répondre en français, expliquer simplement, pas de jargon inutile.

## OÙ ON EN EST (2026-10-23, avant compactage)
- Fait récemment : gouttes 💧, 170 niveaux en une seule courbe, placement (8 étapes, cartes / XP / pièces rattrapés),
  remise à zéro générale, correction des nombres (5e, Louis XIV, dix-sept, 42,195), amis sur le parcours, missions de la
  semaine, événement Halloween (26/10 → 02/11, démo `?demo=halloween`), statistiques anonymes, duels entre amis
  (SQL lancés par l'utilisateur : duels OK), avatar (24 couleurs en dégradé, 39 dessins).
- Préférences de l'utilisateur (récentes) : pas de messages qui surgissent pour les nouvelles (pastilles rouges à la place) ;
  pas trop de bulles d'explication ; textes très clairs, sans ambiguïté (ex. « 7 à 0 » / « 7/10 contre 0/10 ») ; vérifier
  l'affichage à la largeur d'un téléphone (360 px) ; vérifier les faits en ligne ; questions d'événement accessibles (d ≈ 2,2).
- Prochaines pistes : événement de Noël (fin novembre), « Qui suis-je ? », puis la liste « AVANT DE PUBLIER » (triche
  « J'avais juste », protection classement / duels / heure, suppression de compte, politique de confidentialité, 12 testeurs).
  Abandonné : « Revoir le tutoriel », plein écran en appli web.
- Outils de test (scratchpad de la session) : `shot.ps1` (capture Edge, PowerShell), `dump.ps1`, `free_subjects.py`,
  `check_lot2.py`, `duel_test.js`, `event_test.js`. Écrire les scripts avec l'outil d'écriture (les « heredoc » abîment les \).

## REMISE À ZÉRO GÉNÉRALE (2026-10-20, demande de l'utilisateur : « tout tout effacer »)
- Code : `RESET_EPOCH` (script.js) + `resetEpoch` dans chaque sauvegarde. À l'ouverture, une sauvegarde de l'appareil sans
  la bonne marque est effacée avec le compte connecté, le cache du classement et les clés v1 (`wipeBeforeReset`) ; une
  sauvegarde en ligne sans la marque est ignorée et remplacée (`cloudSync`, `cloudPush`). Nouvelle remise à zéro = changer la date.
- Supabase : `supabase/remise-a-zero.sql` (à lancer par l'utilisateur) efface tous les comptes (auth.users) et toutes les
  tables (gifts, friendships, scores, saves, profiles ; reports gardé sauf choix contraire).
- Les anciens ids de comptes notés plus bas (compte de l'utilisateur bef7f100…, comptes de test) n'existent plus après ça.

## Fichiers
- `index.html` : 4 onglets (Parcours, Défis, Boutique, Profil) + écran de leçon + popups.
  Ordre de chargement OBLIGATOIRE : `questions.js` → `pairs.js` → `order.js` → `levels.js` → `script.js`.
- `style.css` : mise en page plein écran, décors latéraux, points de notification sur les onglets.
- `script.js` : toute la logique (état, sauvegarde, leçons, révisions, XP, boutique, badges).
- `questions.js` : `QUESTIONS` (id, theme, d, q, a, exp, niveau) et `LEVEL_NAMES`.
- `levels.js` : répartit automatiquement les questions dans les niveaux (voir plus bas).
- `order.js` : `ORDER_FAMILIES` (16 familles, ~225 cartes, dont « Vitesses » `[texte, valeur de tri, valeur affichée, d]`)
  pour les niveaux Ordre. Jamais deux valeurs identiques dans une famille.
- `cards.js` : `CARDS` (150 cartes, 10 par thème : 3 communes, 3 rares, 2 épiques, 1 légendaire, 1 Maître)
  et `CARD_RARITIES` (chances de tirage, pièces pour un doublon). Image = emoji Twemoji (dossier `emoji/`, + `sw.js`).
- `pairs.js` : `PAIR_FAMILIES` (14 familles, ~285 paires `[gauche, droite, d]`) pour les niveaux Paires.
- ATTENTION GitHub Pages : Cache-Control max-age=600 (copie de 10 min sur le CDN). Pour vérifier une mise en
  ligne, tester l'URL SANS paramètre (le « ?n= » contourne le CDN et ment). Depuis kultivo-v6, le service worker
  ajoute ?v=<horodatage> aux fichiers html/js/css/json → le téléphone a toujours la dernière version.
- `manifest.json`, `sw.js`, `icons/` : application installable (PWA). `display: fullscreen` ESSAYÉ le 2026-10-20 → ANNULÉ : avec la navigation à
  3 boutons, Chrome rétrécit l'écran quand la barre revient (balayage ou clavier) au lieu de la superposer → saut à chaque
  question. Une appli web ne peut pas superposer les boutons (seul un vrai jeu Android le peut). Ne pas retenter ;
  la barre blanche en bas (navigation à 3 boutons) est à accepter. Avec Capacitor (vraie appli Android, voir Play Store) : mode immersif
  natif possible (boutons superposés) → à faire à ce moment-là. Service worker « réseau d'abord »
  (cache `kultivo-v1`) : avec internet, toujours la dernière version. Tout nouveau fichier du jeu → l'ajouter à `FILES` dans `sw.js`.
  Logo (choisi le 2026-10-16, version « A2 ») : cerveau Twemoji rose + K vert cerclé de blanc sur fond vert.
  `icons/logo.svg` (arrondi, utilisé dans le jeu) ; PNG carrés pour le téléphone : rendu 512 px avec Edge en mode
  headless (fenêtre ≥ 500 px, sans fond transparent), puis réduction en Python pur (pas de Pillow).

## Ce qui est en place
- Nom du jeu : **Kultivo** (choisi le 2026-10-16, remplace « Culture G », nom déjà pris sur l'App Store).
  Les noms internes (clé `cultureG_v2`, dossier) restent tels quels pour ne pas casser la sauvegarde.
- Sauvegarde dans `localStorage` (clé `cultureG_v2`, `normalizeData`, migration depuis v1).
- Correction des réponses tolérante (Levenshtein, articles et accents ignorés).
  Les mots génériques de tête (`GENERIC_WORDS` : musée, lac, traité, bataille…) peuvent être omis :
  « Orsay » vaut « le musée d'Orsay », sauf si la forme courte est déjà écrite dans la question.
  Inutile donc d'ajouter ces formes courtes dans `a` ; ajouter plutôt les noms de famille seuls, surnoms, etc.
- Révisions et entraînement (2026-10-19) : une question ratée revient UNE fois en fin de partie ; ratée une 2e fois,
  elle sort de la partie et est mise de côté jusqu'au lendemain (`stats[id].later`, `isLater`, exclue de `missedCards`
  et des révisions de `pickTrainingCards`). Session « Réviser mes erreurs » : 10 questions max (`REVIEW_SESSION_SIZE`).
- Révisions : questions ratées des niveaux PRÉCÉDENTS reviennent en priorité (tirage pondéré, 3 à 4 par leçon depuis le 2026-10-18 : 11 questions max, pour ne pas trop faire réviser), complétées par des
  questions DÉJÀ VUES et « dues » (jamais des questions jamais vues : sinon absurde après un placement),
  répétition espacée (`REVIEW_DAYS`) : une question bien connue revient de plus en plus rarement.
- 150 niveaux (depuis le 2026-10-16), un Défi tous les 10 niveaux (pioche dans les 9 niveaux précédents, 10 questions, 2 cœurs).
- Niveaux Paires (mode `pairs`) : 3, 13, 23… 113 (`PAIRS_AT`), icône 🔗, bleu sur la carte. 3 grilles de 5 paires
  de familles différentes (thèmes différents si possible), paires choisies près de la difficulté du niveau
  (`pairTarget` ≈ 1,2 → 4,3). 3 cœurs, une mauvaise association = 1 cœur, cœur de secours possible.
  2 XP par paire. Statistiques par paire dans `pairStats` (clé « famille:élément de gauche ») :
  paire ratée prioritaire, paire bien sue plus rare (`REVIEW_DAYS`), familles avec erreurs tirées plus souvent.
  Une erreur compte pour les DEUX paires concernées (une fois par grille).
- Sons (Web Audio, pas de fichiers : `SOUNDS`, `playSound`) + vibration sur erreur (Android) + confettis
  (`launchConfetti`, sauf révision et si mouvement réduit). Réglage `sound` dans le profil (`soundBtn`)
  et petite icône 🔊/🔇 dans la barre des leçons (`lessonSoundBtn`), pas de menu Paramètres (pas la place).
- Grilles de paires : une seule grille CSS (`#pairsGrid`), cases placées ligne par ligne → même hauteur à gauche et à droite.
- Niveaux Ordre (mode `order`) : 6, 16… 116 (`ORDER_AT`), losange orange ⏳. 3 frises (`ORDER_ROUNDS`)
  de 4 cartes (< niv. 40), 5 (< 85), 6 ensuite. On touche une carte → 1er emplacement libre ; on touche une carte
  placée → elle revient. Après « Vérifier » : bon ordre + valeurs affichées (vert/rouge, « Tu avais mis… »).
  Frise fausse = 1 cœur. Niveaux Ordre à 2 cœurs (comme les défis) : au plus 1 frise ratée (avant : 3 cœurs, trop facile).
  2 XP par carte bien placée. Début du parcours : cartes espacées dans le classement.
  Révisions des frises (2026-10-17) : `orderStats` (clé « famille:carte », { miss, streak, last }) comme `pairStats`.
  Carte mal placée → revient (2 au plus par frise, `pickOrderItems`), carte bien sue → plus rare (`REVIEW_DAYS`),
  familles avec erreurs tirées plus souvent (`buildOrderRounds`, `weightedPick`).
- Objectifs du jour (2026-10-16, demandé par l'utilisateur) : 60 / 150 / 250 XP (≈ 1, 2-3, 4-5 niveaux),
  récompenses 10 / 25 / 50 🪙. Anciens objectifs convertis dans `normalizeData` (`OLD_GOALS`).
- Compteurs du haut cliquables : 🪙 → Boutique, 💧 → fenêtre des gouttes (`dropsModal`), 🔥 → calendrier de série (`streakModal`).
  Balayage gauche/droite dans le calendrier = mois suivant/précédent.
  Jours joués dans `activeDays` (rempli par `addXp` / `bumpStreak`), gels utilisés dans `frozenDays`.
  Historique d'avant le calendrier reconstitué une fois (`backfillActiveDays` : série, objectifs, défis du jour).
- XP : sert aux titres, aux pièces (1 🪙 / 5 XP depuis le 2026-10-19), à l'objectif du jour et aux badges ; servira au classement (Supabase).
- Navigation : en haut sur ordinateur, barre fixe EN BAS avec icônes sur téléphone/tablette (≤ 900 px).
  Le flou de la barre du haut est retiré sur mobile (sinon la barre du bas ne se colle pas à l'écran).
- Balayage gauche/droite sur téléphone pour passer d'un onglet à l'autre (pas depuis les bords : geste retour).
- Cœurs, série de jours (avec gel de série), XP, pièces, objectif du jour (récompense à réclamer),
  défi du jour identique pour tous (tirage avec graine), sprint 60 s, badges à réclamer.
- Boutique : indices, cœur de secours, gel de série. Popup de confirmation avant chaque niveau/défi.
- Cœur de secours : plus utilisé automatiquement, et PAS de popup (l'utilisateur trouvait ça pénible).
  Sur l'écran « Niveau raté », bouton `endRescue` au-dessus de « Réessayer » : continuer avec un cœur du stock,
  ou en acheter un sur le moment. Sans assez de pièces : simple ligne « 💡 il te manque X 🪙 » dans le texte.
  Depuis le 2026-10-18 : bouton « 💖 Continuer · −100 🪙 », solde dessous (« Tu as X 🪙 · il t’en restera Y »,
  `endRescueInfo`) et confirmation d'achat (`askConfirm`) avant de payer.
- Signalement : lien « 🚩 Signaler cette question » dans le bandeau de correction → raison + commentaire,
  stocké dans `reports` (file d'attente sur l'appareil, invisible pour le joueur), puis envoyé à Supabase par
  `flushReports` (au lancement, après chaque signalement, au retour de la connexion) et retiré une fois envoyé.
  Pas de liste dans le profil (retirée à sa demande). L'utilisateur lit les signalements dans Supabase :
  Table Editor → reports.
- Supabase (créé le 2026-10-16) : projet `kultivo`, URL https://wqfqdhsvpkczaifgosel.supabase.co, clé « anon »
  publique dans `script.js` (SUPABASE_URL / SUPABASE_KEY). Table `reports` avec RLS : INSERT seulement pour anon
  (pas de SELECT). JAMAIS de clé service_role dans le code. Prochaines étapes : sauvegarde en ligne, classement.
- Perte de cœur visible : ligne « 💔 −1 cœur » dans le bandeau rouge + cœur qui clignote (`renderHearts({ risk })`),
  puis cœur qui éclate et rangée qui tremble au clic sur Continuer (`renderHearts({ lost })`). Aussi dans les Paires.
- Clavier : une fois vu (`keyboardHeightSeen`), la classe `keyboard-open` RESTE (le clavier se ferme une fraction de
  seconde entre deux questions → sinon saut de taille). `fitToKeyboard` calcule avec la hauteur mémorisée,
  enregistrée sur l'appareil (localStorage `kultivo_keyboard` : {full, kb}), réutilisée si même taille d'écran.
  Zoom photo : pointerdown (preventDefault + setPointerCapture) puis ouverture au pointerup ; la vue agrandie
  ignore les touches 0,4 s et ferme le clavier (blur). Petite loupe 🔍 dans le coin de la photo.
  `keyboard-open` AUSSI pendant la correction : même format que la question (l'utilisateur ne veut aucun
  changement de taille ; `fitToKeyboard` ne fait RIEN hors phase « answering », sinon --fit retombait à 0). Zoom : champ readOnly + blur + focus sur la vue agrandie pour fermer le clavier.
  Détection : le champ a le focus ET l'écran visible a rétréci de
  plus de 150 px par rapport à la hauteur max mémorisée (`updateKeyboardMode`). PAS juste le focus : le jeu met le
  focus automatiquement à chaque question sans ouvrir le clavier,
  réajusté à 50/300/700 ms → images, question et étiquettes
  réduites pour garder « Vérifier » visible. Photos de monuments jamais recadrées (max-height, pas object-fit: cover).
- Touche retour du téléphone (2026-10-18) : une étape d'avance dans l'historique (`armBackGuard`), `popstate` →
  `onBackButton` : ferme la fenêtre ouverte (`closeTopOverlay`), sinon en leçon « Quitter ? », sinon onglet →
  Parcours, sinon sur le Parcours « Appuie encore sur retour pour quitter » (2e appui en 2,5 s = sortie).
  Nouvelle fenêtre → l'ajouter dans `closeTopOverlay`.
  Petit saut au « retour » (Chrome Android montre une image de l'écran d'avant) : ESSAYÉ de rafraîchir cette
  image (history.back + pushState) → ANNULÉ le 2026-10-18 : ramenait le parcours tout en haut et ne réglait
  pas le saut. Ne pas retenter ; à accepter (animation de Chrome).
- Récap de fin de leçon : boutons grisés pendant l'apparition des tuiles ; `stopEndStats` (timers et sons
  arrêtés) en quittant l'écran.
- Textes non sélectionnables (body user-select: none, sauf champs de saisie) : évite « Toucher pour rechercher »
  de Chrome (un tap sur un mot ouvrait une recherche Google), 2026-10-18.
- Barre Chrome « clé / carte / adresse » au-dessus du clavier (2026-10-18) : due au champ mot de passe caché de la
  fenêtre de connexion. Il n'est `type=password` (et autocomplete) QUE fenêtre ouverte (`openAuthModal`) ; fermé
  (`closeAuthModal`) : champ texte vide, autocomplete off. N'a PAS suffi (Chrome ignore autocomplete=off).
  Puis : la zone de réponse `userInput` est une `<textarea rows=1>` (Chrome n'y propose pas son remplissage),
  même aspect ; Entrée = valider (keydown, ou `beforeinput` insertLineBreak des claviers Android) ; retours à
  la ligne collés remplacés par des espaces. À vérifier sur le téléphone de l'utilisateur.
- Saut d'écran entre deux questions : ESSAYÉ le 2026-10-18 de garder le clavier ouvert (pas de readOnly, boutons
  sans focus) → ANNULÉ : le clavier ouvert cachait le bandeau de correction. L'utilisateur accepte le petit saut
  (le clavier doit se fermer pour voir la correction). Ne pas retenter.
- Chez l'utilisateur, le clavier s'ouvre automatiquement à chaque question → le mode compact est son affichage
  habituel : tailles « à mi-chemin » (ni trop grand, ni trop petit). Photo de monument : tap = plein écran
  (`photoZoom`, avec crédit), retap = retour. Pas de boutons collés au clavier (refusé) : à la place,
  `fitToKeyboard` mesure la place libre sous « Vérifier » et agrandit image + question (variable CSS --fit),
  appelé AVANT affichage dans showCard (fondu retiré : il donnait un « clignement »). Photos : `photoSize` [l, h] pour réserver la place ; nouvelle photo cachée (`is-loading`) jusqu’à son chargement (sinon l’ancienne restait affichée un instant), photos de la leçon préchargées.
  Zoom photo : pointerdown = preventDefault seulement, ouverture au click (sinon le même tap la refermait).
- Parcours (2026-10-23) : niveaux terminés = numéro gardé + petite coche dans le coin (`.node-check`). Amis sur le
  parcours : petits avatars cliquables (profil de l'ami) à côté du niveau où ils en sont (`renderMapFriends`, d'après
  `summary.unlocked`, envoyé dans `profileSummary`), 3 max par niveau puis « +N » ; redessinés après chaque `leagueFetch`.
- Parcours : décors = une icône par thème (`THEME_DECOR`) ; tap = bulle d'anecdote (`showFact`). Anecdotes dans
  `facts.js` (THEME_FACTS, 10 par thème = 150) : chaque icône a la sienne (`data-fact`). Décors en z-index 2
  (sinon le parcours, pleine largeur, prenait les taps). L'utilisateur veut « presque 1 anecdote par icône ». Bouton flottant
  « 📍 Mon niveau » (⬆/⬇) quand le niveau en cours est hors écran. Drapeaux zoomables (loupe) comme les photos.
  Correction : nombres en lettres = chiffres, depuis le 2026-10-23 aussi les nombres composés (« dix-sept »,
  « quatre-vingt-neuf », « mille sept cent… », `wordsToNumbers`), les ordinaux (« cinquième » = « 5e » = « 5ème »,
  `ORDINAL_WORDS`), les chiffres romains (« Louis XIV » = « Louis 14 », `romanValue` ; lettre seule : V et X seulement)
  et les décimales (« 42,195 » = « 42.195 ») ; « un / une » seuls restent des articles. Nombre attendu = exact.
  Signalements traités le 2026-10-23 (capture de la table reports envoyée par l'utilisateur).
- Boutons secondaires (`.btn-ghost`) : contour fin gris partout ; dans le bandeau de correction, contour couleur du bandeau.
- Entrée dans une leçon : la touche est « consommée » (preventDefault) pour ne pas cliquer un bouton qui prend le focus.
- Page profil : titre, records, réussite par thème, badges.
- Téléphone (≤ 600-700 px) : barre du haut sur une ligne (logo `icons/icon-192.png` + compteurs compacts,
  textes « XP » / « à revoir » masqués via `.chip-unit`), décors de carte petits et discrets dans les marges,
  leçon compacte avec barre (vies, progression) collée en haut + `keepAnswerVisible` quand le clavier s'ouvre,
  profil en onglets (Badges par défaut / Records / Thèmes, `setProfileTab`). Sur grand écran, rien ne change.
- Onglet Défis : résultats dans des encadrés `.score-box` (défi du jour : score, temps, grille ;
  sprint : record + dernière partie, `best.lastSprint` / `best.lastSprintRecord`).
- Accueil du premier lancement (écran `onboard`, façon Duolingo, `onboarded`) : bienvenue → « comment juges-tu ta
  culture G ? » (`selfLevel`) → objectif quotidien → test de placement (ou niveau 1 direct si « Je débute »).
  Objectifs affichés en « 1 niveau par jour » (XP en petit). Placement expliqué simplement (pas de « sauter 10 niveaux »).
  « Je débute » / « Non merci » → parcours + tutoriel (pas de lancement direct du niveau 1).
  Tutoriel guidé (`TOUR_STEPS`, 9 étapes, montre les 🔗 ⏳ 🏆 PAS encore faits : sinon ils sont dorés) à la 1re arrivée sur le parcours : écran assombri,
  élément mis en lumière, bulle Suivant / Passer ; à la fin, retour automatique au niveau en cours.
  Même système pour des explications ponctuelles : 1re apparition de « ↻ à revoir » (`REVIEW_TIP`, `tipReview` :
  « tes erreurs… elles reviendront plus tard dans tes niveaux ») et 1re fois que le niveau en cours affiche
  « + X révisions » (`maybeShowReviewsTip`, `tipReviews` : « reviennent au bon moment », SANS les délais exacts,
  à la demande de l'utilisateur).
  Écrans d'accueil en position fixe plein écran (bouton toujours visible). Messages (toasts) : 2,5 s, fermables d'un tap.
  Cadeau de bienvenue à la fin : 100 🪙 + 1 🧊 (`WELCOME_COINS`, `WELCOME_FREEZES`, une seule fois : `welcomeGift`).
- Récap de fin de leçon animé : tuiles XP / Précision / Temps (défi du jour : Score ; sprint : Bonnes / Record)
  qui apparaissent l'une après l'autre avec chiffres qui défilent (`renderEndStats`, `countUp`).
- Test de placement (mode `placement`) : lancé depuis l'accueil (remplace l'ancienne popup de bienvenue) et via un bouton SOUS le niveau 1 (la carte se lit de bas en haut) tant qu'aucun niveau n'est terminé.
  8 étapes au plus depuis le 2026-10-20 (`PLACEMENT_MAX_STEPS`, départ au niveau 81 max sur 170). Coffres sautés : les 3
  derniers donnés tout de suite (`PLACEMENT_CHESTS_NOW`), les autres marqués 'placement' dans `chests` et leurs cartes
  dues dans `chestBonus`, ajoutées (+3 max, `CHEST_BONUS_MAX`) aux coffres du parcours APRÈS le départ (idée de l'utilisateur :
  même total qu'un joueur normal, sans inonder la collection), 2 bonnes sur 3 pour passer, arrêt à la 1re étape ratée.
  Valide les niveaux sautés (`done`), enregistre `placement: { day, start }`. Pas de stats. Depuis le 2026-10-20 (pour ne
  pas léser le joueur placé) : +40 XP par niveau sauté (`PLACEMENT_XP_PER_LEVEL`) au TOTAL seulement (pas dans `activeDays`
  → classement de la semaine juste), pièces correspondantes dues dans `coinBonus`, versées +10 par niveau réussi
  (`COIN_BONUS_PER_LEVEL`, sans le dire), et les niveaux sautés comptent pour les badges.

- Coffres et collection (2026-10-17, idée de l'utilisateur) : un coffre 🎁 sur le parcours après chaque niveau
  multiple de 5 (`CHEST_EVERY`, `chestStop`) : gris tant que le niveau n'est pas fini, doré quand il est à ouvrir,
  coché une fois ouvert (`chests` : n° -> date). 3 cartes, 4 après un défi (dont au moins une rare ou mieux)
  → 105 cartes tirées sur le parcours. Autres sources : boutique (`SHOP_CHEST`, 150 🪙, 3 cartes dont une rare,
  ouvert à l'achat) et objectif du jour (pièces + 1 carte, `GOAL_CARDS`). Tout passe par `openCardBoxes`.
  Les cartes sont gagnées dès l'ouverture (`openChests`, sauvegardé), puis montrées une à une (`chestNext`).
  Un tap sur un coffre ouvre TOUS les coffres en attente (demande de l'utilisateur, placé au niveau 41) : cartes
  en grille (`showChestSummary`). Après ouverture, le parcours reste où il était (pas de retour au niveau en cours).
  Tirage : rareté pondérée, puis 80 % de chances de prendre une carte pas encore possédée ; doublon = pièces.
  Collection (`cards` : id -> nombre) dans le Profil, onglet « 🃏 Cartes » (`renderCollection`) : sur téléphone,
  une ligne de 7 petites cartes par thème (image seule), tap = carte en grand. Pastille sur l'onglet Parcours =
  coffres à ouvrir. Les niveaux déjà faits (et ceux validés par le placement) donnent leurs coffres.
  À venir : coffres en récompense du classement entre amis (podium de la semaine).
  Ouverture façon Clash Royale (demande de l'utilisateur : rapide et fluide) : carte de dos (logo), qui tremble
  plus ou moins longtemps selon la rareté avec une lueur de sa couleur (`CARD_CHARGE_MS`), puis se retourne ;
  épique/légendaire : rayons qui tournent + confettis de sa couleur (`CARD_CONFETTI`, `launchConfetti(palette)`).
  Un tap pendant l'animation la termine (`chest.finish`). Plusieurs coffres : grille de dos qui se retournent en cascade.
  Explication unique (`tipChest`, même système que le tutoriel) quand un coffre attend : après un placement,
  « ton test t'a fait passer N coffres », bouton « Ouvrir les coffres » qui les ouvre. Tutoriel : étape coffre.
- Boutique compacte sur téléphone (icône à gauche, boutons côte à côte) ; bloc « Tes pièces » retiré le 2026-10-19 (inutile, le solde est en haut) : le coffre de cartes est en tête.

- Classement entre amis (2026-10-17) : 5e onglet « 🥇 Classement » (`leagueScreen`, `renderLeague`), entre Défis
  et Boutique. Tables Supabase créées par `supabase/classement.sql` (à lancer une fois dans le SQL Editor) :
  `profiles` (pseudo unique, 3-16 caractères), `friendships` (demande pending → accepted), `scores` (week = lundi,
  week_xp, prev_week, prev_week_xp, streak ; visible seulement par soi et ses amis acceptés ; plafond 15 000 XP
  par semaine, trigger : pas plus de 3000 XP d'un coup en moins d'une heure). XP de la semaine = somme de
  `activeDays` du lundi au dimanche (`weekXp`). Envoi avec chaque sauvegarde en ligne (`leaguePushScore`).
  Ajout d'ami par pseudo (demande à accepter ; si l'autre a déjà demandé, on accepte), lien d'invitation
  `?ami=pseudo` (partage du téléphone, sinon copie). Cache local `kultivo_league`. Pastille = demandes reçues.
  Mise à jour automatique (`leagueTick`) : toutes les 15 s sur l'onglet Classement, 60 s ailleurs, et au retour
  dans l'appli ; message quand une demande arrive ou est acceptée ; pas de redessin pendant qu'on tape.
  Coffre du lundi (`checkPodium`, une fois par semaine, `podium` : lundi -> place) : selon le nombre d'amis
  BATTUS (1 battu = 2 cartes … 5 max, une rare dès 3 cartes), au moins `PODIUM_MIN_XP` (100) XP dans la semaine
  (l'utilisateur trouvait trop facile qu'à deux l'un gagne forcément).
  Affichage : « Ligue des amis », podium 2e · 1er · 3e (avatars = initiale colorée, couronne), puis liste avec
  barres ; « Ton pseudo » en haut de la carte Amis.
- « 📋 Revoir les questions » du défi du jour (2026-10-19, `openDailyReview`, fenêtre `friendModal`) : les 10 questions
  (avec drapeau / rébus / photo), bonne réponse, ma réponse si faux (`daily[jour].answers`), ✅/❌ de chaque ami qui a
  joué (grille envoyée dans `scores.summary.daily`, pas de SQL à lancer).
- Défi du jour comparé avec les amis (remplace « Copier mon résultat », demandé le 2026-10-17) : colonnes
  `daily_day`, `daily_score`, `daily_seconds` dans `scores` (`supabase/defi-du-jour.sql`, à lancer une fois),
  envoyées par `leaguePushScore` (repli sans ces colonnes si le SQL n'est pas lancé) ; liste dans la carte
  Défi du jour (`renderDailyFriends` : seulement les amis qui ONT joué, 5 meilleurs + moi si plus loin, « ⋯ »). Écran de fin du
  défi : bouton « Comparer avec mes amis ». Onglets Défis et Classement compacts sur téléphone.
- Avatar personnalisable (2026-10-17) : bouton rond en haut du Profil (`avatarBtn`, crayon) → fenêtre « Mon
  avatar » (`avatarModal`) : 12 couleurs (`AVATAR_HUES`), initiale ou 24 dessins Twemoji déjà dans `emoji/`
  (`AVATAR_EMOJIS`) ; depuis le 2026-10-23 : 24 couleurs en UN dégradé (une tous les 15° ; une ligne de foncées
  essayée puis retirée car elle cassait l'enchaînement — `hueLight` garde leur affichage si déjà choisies) ; 4 lignes de 6 (taille préférée de l'utilisateur).
  Fenêtre `avatarModal` toujours dans l'écran : seule la grille des dessins défile, « C'est bon » toujours visible
  et 39 dessins (5 nouveaux emojis téléchargés). Sauvegarde `avatar: { hue, emoji }` ; envoyé aux amis via `profiles.avatar_hue/avatar_emoji`
  (`supabase/avatar.sql`, `pushAvatar`) ; `avatarEl(pseudo, look, cls)` partout (podium, liste).
- Profil d'un ami (2026-10-17) : tap sur un ami (liste, podium, classement, liste du défi du jour) → `friendModal` (`openFriendProfile`) :
  titre, XP, série, réussite, niveaux, record de série, sprint, XP de la semaine, badges et cartes. Données :
  `scores.summary` (jsonb, `supabase/profil-ami.sql`), résumé envoyé avec le score (`profileSummary`) — la
  sauvegarde complète reste privée. Carte ou badge touché dans ce profil → vue en grand (`openCardView` / `openBadgeView`
  avec `onBack`) : « ← Retour » et ✕ ramènent au profil de l'ami (`chestBack`). « Retirer de mes amis » est dans ce profil (plus de ✕ dans la liste,
  sauf pour annuler une demande). Liste d'amis : lignes avec avatar, pseudo, titre et série, flèche ›.
- Donner / retirer des pièces (2026-10-17) : l'utilisateur modifie DIRECTEMENT la case `coins` dans Table Editor →
  saves (`supabase/table-joueurs.sql`). Déclencheur `saves_fill` : si seule la case coins change, la différence
  part dans la table `gifts` ; `claimGifts` (lancement + ~1 min) efface la ligne puis ajoute/retire les pièces
  (jamais sous 0). Sinon le déclencheur recopie coins / niveau (= `unlocked`) / pseudo depuis le jeu.
  La case `niveau` est aussi modifiable : `gifts.level` → `setPlayerLevel` (niveaux d'avant validés, ceux
  d'après à refaire, coffres déjà ouverts gardés).
  Bug corrigé le 2026-10-17 : les cadeaux n'étaient récupérés que dans `leagueFetch`, qui pouvait rester bloqué
  (invitation → acceptFriend → await leagueLoad() = attente de soi-même). Désormais : `claimGifts` toutes les
  30 s + au retour dans l'appli + après `cloudSync` au lancement ; chargement du classement abandonné après 20 s ;
  `handleInvite` non attendu. Tests réseau : chaque essai Edge raté consomme quand même les cadeaux (piège).
  NE PAS modifier `saves.data` à la main (le jeu ouvert réécrit par-dessus). Id du compte de l'utilisateur :
  bef7f100-48e2-4713-a11a-5bad72725390. D'autres joueurs existent déjà dans la table (6 lignes le 2026-10-17).
- Titres (`TITLES`) : 11 titres. ~40 XP par niveau → « Encyclopédie vivante » (6000) ≈ fin du parcours ;
  ajoutés le 2026-10-17 pour la suite : Puits de science 10 000, Oracle 15 000, Légende de Kultivo 25 000.
- Profil : pseudo à côté de l'avatar (`profileName`, « Mon profil » sans pseudo), titre en pastille à côté de
  l'XP (`profileTitle`) → liste de tous les titres (`titlesModal`, `openTitlesModal` : atteints ✓, actuel, 🔒).
- Profil (téléphone) : toucher Badges / Cartes / Records / Thèmes fait défiler pour mettre les onglets en haut.
- Protection de la sauvegarde (2026-10-17, après une perte chez l'utilisateur : « Tout effacer » fait en étant
  connecté avait envoyé une progression vide) : `cloudPush` relit d'abord la ligne ; si elle a PLUS d'XP que
  l'appareil, il n'écrase pas (appareil vide → `applyRemote`, sinon fenêtre « Quelle progression garder ? »).
  `cloudPush(true)` seulement pour « Celle de cet appareil ». Réponses courtes des monuments ajoutées
  (Pise, Eiffel, Sydney, Gard, Liberté).
- Déconnexion (2026-10-17, demande de l'utilisateur : « le compte n'est pas juste une sauvegarde ») : dernier
  envoi (refusé hors ligne ou si l'envoi échoue), puis l'appareil repart de ZÉRO (nouveau joueur sans compte,
  accueil) ; la partie revient en se reconnectant (appareil vide → `applyRemote`).
- Plus de confirm() du navigateur (moche, affiche l'adresse du site) : `askConfirm({ title, text, yes, danger })`
  (fenêtre `askModal`, promesse true/false). Supabase gratuit : pause après 7 jours sans activité (Restore).
- Pseudo demandé dès l'accueil (étape 4/5, juste après la création du compte ou la connexion ; « Plus tard »
  possible ; sauté si le compte a déjà un pseudo). Champ `pseudoField` vérifié pendant la saisie : rouge si trop
  court ou caractère interdit, « Vérification… » puis « ✓ Disponible » (vert) ou « déjà pris » (rouge) ;
  bouton Valider grisé tant que ce n'est pas bon. Même champ dans l'onglet Classement.
- Doublons de cartes : donnent des pièces, plus de « ×2 » affiché (le nombre reste dans `cards`, pour une future
  version dorée à X exemplaires, idée validée pour plus tard).
- Mystère du 2026-10-17 : la progression de l'utilisateur s'est retrouvée sur le compte de TEST
  (test-kultivo-14620@kultivo-test.fr, créé par Claude pour tester) au lieu du sien ; copiée sur son compte par SQL.
  Cause non trouvée (le code envoie bien sous `cloudUser.id`). Vérifié à 12:50 : sa ligne `saves` (bef7f100…) se
  met bien à jour quand il joue. Compte de test à supprimer par l'utilisateur (Authentication → Users).
  Tables du classement créées et testées le 2026-10-17 (droits OK, anti-triche OK). Pas de règle DELETE sur
  `profiles` / `scores` : pour effacer, supprimer le compte (cascade).

## levels.js (important)
- DEPUIS LE 2026-10-20 : 170 niveaux. L'utilisateur va remettre les sauvegardes à zéro → tout le parcours refait d'UN
  seul lot (`LEVEL_LOTS` : ids 0-3999 → niveaux 1-170) avec une seule courbe : moyenne 1,3 → 4,5, +0,2 environ tous les
  10 niveaux. Questions très pointues (d ≥ 4,5) progressives (`hardFrom` 0,25, `hardCurve` 2) : 1 de temps en temps
  vers le niveau 45, puis 1, 2, et 3 par niveau à la fin (avant : 0 jusqu'au 80 puis d'un coup, marche de +0,5).
  Les 98 questions du lot 2 (ids 3000-3097) ont été renotées (certaines trop bien notées : Shazam, Doom, K2…).
  RÈGLE POUR LA SUITE : une fois de vrais joueurs, NE PLUS remélanger : nouveau lot = nouvelle ligne dans `LEVEL_LOTS`
  (nouveaux ids, niveaux ajoutés à la fin), + noms dans `NAMES`. Paires / frises : `pairTarget` jusqu'à 4,5 au dernier niveau.
  Avant d'écrire des questions : `free_subjects.py` (sujets déjà utilisés, parcours + entraînement) puis `check_lot2.py`
  (doublons, mot de la réponse dans la question) dans le scratchpad. Beaucoup de sujets « durs mais connus » sont DÉJÀ pris.
  Supabase : limite de la case niveau à 170 dans `supabase/table-joueurs.sql` (2 lignes à relancer).
- Lit `QUESTIONS`, écrase `q.niveau` et `LEVEL_NAMES`. Le champ `niveau` du fichier questions n'est qu'un secours.
- 150 niveaux = 105 de questions (6 ou 7 chacun) + 15 Paires (x3) + 15 Ordre (x6) + 15 défis (x0).
  Quand on ajoute beaucoup de questions, on ajoute un bloc de 10 niveaux (demande de l'utilisateur).
  Bloc type : Q Q 🔗 Q Q ⏳ Q Q Q 🏆 (choisi par l'utilisateur). L'utilisateur ne veut pas perdre de niveaux de questions. Déterministe (même résultat pour tous).
- La difficulté monte doucement (≈1,3 → 4,3 sur 100 niveaux), questions très dures (d ≥ 4,5) à partir du niveau ~55 (1 à 2 par niveau),
  thèmes équilibrés sur tout le parcours, au plus 2 questions du même thème par niveau.
- Pour ajouter une question : ligne avec un `id` jamais utilisé (≥ 2000), un `theme`, un `d` de 1 à 5. C'est tout.
- Vérification : la console affiche « [levels.js] actif : … » et le niveau 3 s'appelle « Premiers repères ».
- Pour désactiver : `AUTO_LEVELS = false`.

## État actuel
- Monuments (thème « Monuments », ids 2300+, 36 photos) : champ `photo` (dossier `monuments/`, photos libres
  Wikimedia Commons, ~440 px) + `credit` (auteur · licence) affiché sous la photo, OBLIGATOIRE. Téléchargement :
  API Wikipédia (pageimages) + Commons (imageinfo/extmetadata), avec pauses (sinon erreur 429).
- 659 questions avant les monuments. Rébus (ids 2200-2241, champ `rebus` = liste d'emojis DANS L'ORDRE DES MOTS, ex. « Donner sa
  langue au chat » = 🎁 👅 🐱) rangés dans le thème de la réponse (Cinéma, Langue française, Littérature) + étiquette
  « 🧩 Rébus ». Emojis affichés en images Twemoji (dossier `emoji/`, CC BY 4.0, crédit en bas du profil, `emojiImg`).
- Textes : courts et clairs (demande de l'utilisateur), pages rapprochées de la barre du haut.
- 617 questions avant les rébus, 14 thèmes (dont « Drapeaux » : ids 2100-2149, champ `flag` = emoji affiché en grand,
  question identique « À quel pays appartient ce drapeau ? »). Famille de paires « Drapeaux » (connus, `bigLeft`).
  Affichage en VRAIES IMAGES (dossier `flags/`, SVG de flagcdn.com, libres de droits) via `flagImg(emoji)` :
  l'utilisateur trouve les emojis « moins propres ». Les données gardent l'emoji ; nouveau drapeau → télécharger
  https://flagcdn.com/<code>.svg dans `flags/` et l'ajouter à `FILES` dans `sw.js`.
- Frises : la frise EN HAUT, les cartes à placer EN DESSOUS (préférence de l'utilisateur), en étiquettes compactes.
- Avant les drapeaux : 567 questions, 13 thèmes. Le 2026-10-16 : +100 questions difficiles (ids 2000-2099, d 4 à 5),
  réparties au prorata des thèmes (mythologie comprise). Total : 142 avec d ≥ 4, dont 78 avec d ≥ 4,5.
- Exemple de l'utilisateur pour une vraie question dure : demander le NOM du marteau de Thor, pas qui le porte.
  Une question « dure » doit demander un détail précis, pas le personnage célèbre.
- Tester dans le navigateur reste à faire côté utilisateur (la répartition a été vérifiée par simulation).

## 💧 GOUTTES — FAIT le 2026-10-19 (`DROPS_MAX`, `DROP_MS`, `syncDrops`, `spendDrop` dans `startSession`, `earnPracticeDrop`,
`openDropsModal` / `dropsModal`, `refillDrops`, `showDropsTip` / `tipDrops` ; sauvegarde `drops`, `dropsAt`, `dropsDay`, `dropsEarned`).
Retouches du 2026-10-19 : niveaux DÉJÀ RÉUSSIS gratuits (demande de l'utilisateur) ; fenêtre de départ avec pastille
« 💧 −1 goutte · il t'en restera X » (`modalCost`) et bouton « Commencer · −1 💧 » ; fenêtre des gouttes courte avec ligne
« 🎁 … encore N fois aujourd'hui » (`dropsEarn`). Niveaux Ordre (frises) passés en ROSE (`--pink`) : l'orange se confondait
avec le doré des niveaux finis.
Pièces : reste d'XP gardé dans `coinRest` (avant, chaque réponse de 4 XP était arrondie à 0 pièce : on ne gagnait presque rien).
Système d'énergie façon Duolingo, nom choisi par l'utilisateur : **💧 gouttes** (on arrose son cerveau ; refusés :
« énergie », « cerveaux »). Ce n'est pas du plagiat (mécanique de jeu commune). Règles VALIDÉES :
- 5 gouttes au maximum, compteur 💧 3/5 dans la barre du haut (à côté des pièces) ; tap → « Prochaine goutte dans … ».
- Chaque niveau du PARCOURS (questions, paires, frises, défis de niveau) coûte 1 goutte AU LANCEMENT, réussi ou raté
  (choix de l'utilisateur). Il faut au moins 1 goutte pour lancer un niveau.
- Recharge automatique : +1 goutte par HEURE (plein en 5 h) ; calcul à partir d'un horodatage (marche appli fermée).
- Gratuits (ne coûtent rien) : révisions (« ↻ à revoir »), entraînement, défi du jour, sprint, test de placement.
- Récupérer en pratiquant : +1 goutte par session de révision OU d'entraînement terminée avec AU MOINS LA MOITIÉ de
  bonnes réponses (anti-triche) ; rien si moins (message « Encore un effort : 5 bonnes réponses pour gagner une
  goutte 💧 ») ; rien si on quitte avant la fin ; 3 gouttes par jour au maximum de cette façon.
- Boutique : « Recharge complète » 150 🪙.
- Plus de gouttes : toucher un niveau ouvre une fenêtre « 💧 Plus de gouttes ! Prochaine goutte dans 1 h 12 » avec
  boutons [🎯 S'entraîner (+1 💧)] [🔁 Réviser (+1 💧)] [Recharger · 150 🪙].
- Les cœurs restent tels quels dans les leçons (gouttes = nombre de niveaux ; cœurs = erreurs dans un niveau).
- Bulle d'explication la 1re fois (même système `startTip`) ; à mentionner dans le tutoriel du début si possible.
- Sauvegarde : nouvelles clés via `normalizeData` (ex. `drops`, `dropsAt`, `dropsEarnedDay`) ; les joueurs existants
  commencent avec le plein. Penser au service worker si nouveaux fichiers (aucun prévu).
- BARRE DU HAUT (validé) : 🪙 pièces · 💧 gouttes · 🔥 série — les 💧 REMPLACENT le compteur ⭐ XP (l'XP reste dans le
  Profil, la fin de leçon, l'objectif du jour, le Classement). Tap sur 💧 → « Prochaine goutte dans 47 min » (ou fenêtre).
  Mettre à jour la bulle du tutoriel « En haut : tes pièces 🪙, ton XP ⭐ et ta série 🔥 » (→ gouttes).
- ÉCONOMIE (validé le 2026-10-19, à faire avec les gouttes) : `COIN_RATE` 10 → 5 (1 🪙 pour 5 XP : ~8 🪙 par niveau)
  et `COIN_BADGE` 5 → 25. Le reste ne bouge pas (objectif du jour, podium, prix de la boutique). Calcul : un
  « Régulier » passe de ~45 à ~60 🪙/jour, un « Intense » de ~85 à ~110 🪙/jour.
- Tester dans Edge via `shot.ps1` (PowerShell), puis commit + push + vérification en ligne (règles habituelles).

## IDÉES RETENUES (2026-10-23, l'utilisateur veut le détail avant le code)
1. Missions de la semaine — FAIT le 2026-10-23 : `MISSION_POOL` (11 types), 3 par semaine mêmes pour tous
   (`weekMissions`, graine = lundi), `missionEvent` appelé aux bonnes réponses / fins de partie, `missions` dans la
   sauvegarde, 30 🪙 chacune + coffre de 3 cartes ; ligne compacte `missionsRow` sous l'objectif + fenêtre `missionsModal`.
   Objectif du jour plus compact : les 3 choix de rythme cachés une fois la journée commencée. 2. Événements à thème — HALLOWEEN FAIT le 2026-10-23 (du 26/10 au 02/11/2026) : `EVENTS` (dates, décor, carte), questions
   dans `evenements/halloween.js` (`EVENT_BANKS.halloween`, 55 questions ids 30000+, moyenne d 2,2 depuis le 2026-10-23 : 15 trop
   dures remplacées par des faciles à la demande de l'utilisateur ; + `halloweenFacts` pour les décors ;
   réutilisables chaque année). Pendant l'événement (`currentEvent`) : décor du parcours et des leçons remplacé
   (`buildDecor`, `showEventFact`), fond teinté (`body.event-halloween`), bandeau fixe sous la barre du haut
   (`eventBanner`), 3e sous-onglet « 🎃 Halloween » dans Défis (`eventPage`, `renderEvent`), sessions de 10 questions
   sans gouttes ni cœurs (mode `event`, `pickEventCards`, `endEvent`). RÈGLE (choix de l'utilisateur) : une question ratée
   NE revient PAS dans la session (elle reviendra dans une prochaine) ; 40 questions DIFFÉRENTES trouvées (`events[id].found`) = carte
   « Citrouille 2026 » (rareté `event`, `EVENT_CARDS`, section « 🎉 Événements » de la collection, hors des 150) + badge
   (visible seulement pendant l'événement ou une fois gagné). Tout le jeu teinté (`body.event-halloween main`), liseré orange.
   Bulles 1re visite : onglet de l'événement (`showEventTip`, drapeau `ev.tip`) puis sa carte (`showEventPageTip`). Démo hors dates : lien `?demo=halloween`.
   Autres événements proposés : Noël, Saint-Valentin, Coupe du monde / JO, Eurovision, fête de la musique, rentrée. 3. Rappels de série : PAS en appli web, à faire avec Capacitor (vraie appli). 4. Duel entre amis — FAIT le 2026-10-23 : `supabase/duels.sql` (À LANCER) = table `duels` (lanceur, ami, graine,
   scores / temps / grilles), RLS : voir ses duels, défier seulement un ami accepté, l'ami répond une fois en 48 h ;
   déclencheur `duels_guard` (l'ami ne change que ses cases). Jeu : mode `duel` (10 questions d 1,5 à 3,5 tirées avec la
   graine, `duelQuestions` ; un seul essai comme le défi du jour ; sans cœurs ni gouttes ni indice ni « J'avais juste »),
   bouton « ⚔️ Défier » dans le profil d'un ami (`challengeFriend`) et bouton « + » dans le titre de la carte (`openDuelPicker` :
   liste des amis, bilan, « un duel l'attend déjà »), carte « ⚔️ Duels » dans Classement (lignes comme la
   liste d'amis : avatar + pseudo cliquables vers le profil, « 📋 Revoir » les questions = `openDuelReview`, réponses tapées
   gardées dans `duelAnswers`)
   (`renderDuelsCard` : duels à jouer / en attente, puis UNE ligne PAR AMI : pastille = bilan « 2 V · 1 D » (vert / rouge /
   gris), 2e ligne = « Dernier : 🏆 7 à 0 » (court : « 7/10 – 0/10 » était coupé sur téléphone) ; « 7–0 » seul refusé car on croyait à un bilan ; tap = `openDuelHistory`
   (bilan, Revanche, liste des duels → `openDuelReview`, avec « ← Tous les duels » ; pas de bouton profil, jugé inutile)), duels chargés avec le classement
   (`leagueFetch` → `league.duels`), pas de message (l'utilisateur ne veut pas de pop-up) ; temps de chacun
   affiché (historique, détail, fin de duel ; « départagés au temps » si même score, règle rappelée au lancement) ; pièces (`duelPrize`) : gagnant +20, perdant +5,
   égalité parfaite +10 chacun (demandé le 2026-10-23) ; pour un duel lancé par moi, données en OUVRANT l'historique de l'ami (`markDuelsViewed`, une fois via `duelsSeen`), avec
   un bandeau « 🎉 … tu gagnes 8 à 5 ! +20 🪙 » ; celui qui répond les reçoit sur son écran de fin, pastilles (`duelsBadge`) = duels à jouer + résultats pas encore regardés
   (`duelsViewed`, effacés en ouvrant l'historique de l'ami) sur l'onglet Classement, le titre « Duels » et la ligne ;
   questions de duel PAS enregistrées dans `stats` (pas de révision), record « ⚔️ Duels gagnés » (`totals.duelsWon`).
   Questions (2026-10-23) : graines « v2- » = parcours (ids < 4000) + entraînement (x001-x150), d 1,5-3,5, ~2 100 questions
   (liste figée : en ajouter ailleurs ne change pas les duels en cours) ; anciennes graines = parcours seul.
   Correction des réponses : une faute de frappe n'est jamais tolérée sur un nombre (« Louis 17 » ≠ « Louis XVI »).
   Limite connue : un tricheur technique pourrait lire le score du lanceur avant de jouer (caché seulement dans le jeu). 8. Statistiques anonymes — FAIT le 2026-10-23 : `supabase/statistiques.sql` (À LANCER par l'utilisateur) = tables
   `question_stats` / `level_stats` (RLS sans règle), fonction `record_stats(p_answers, p_level, p_outcome)` (seule voie
   d'écriture, GRANT execute anon/authenticated), vues lisibles dans Supabase : `questions_les_plus_ratees`,
   `questions_reussies_par_tous` (≥ 5 vues), `niveaux` (% réussite / abandon). Jeu : `noteStatsAnswer` (1re réponse par
   question), `queueStats` (fin / abandon ; niveau compté une seule fois), file `kultivo_stats` sur l'appareil, `flushStats`.
   Aucun compte ni pseudo envoyé. À mentionner dans la politique de confidentialité (Play Store).
Refusées / pas retenues pour l'instant : partage d'image du score, mode choix multiple, « En savoir plus », points faibles.

## AVANT DE PUBLIER (Play Store) — gardé en tête le 2026-10-19, rien de fait (l'utilisateur teste d'abord)
Failles de triche repérées (ordre conseillé) :
1. 🔴 « J'avais juste » (`forceBtn`, `forced` dans `commit`) : illimité dans niveaux / révisions / entraînement → jamais de
   cœur perdu, et la question compte comme réussie (`recordResult` appelé car seul `firstTry && !assisted` est testé) :
   paliers, médailles, carte Maître, goutte de pratique gagnés sans savoir. Proposé : 3 par partie max, garde le cœur
   mais ne compte pas comme réussite (maîtrise, paliers, goutte). Défi du jour / sprint déjà protégés (`strict`).
2. 🟠 Classement : scores envoyés par le jeu ; `check_score_jump` ne freine que `week_xp`. `prev_week_xp` (qui décide du
   podium du lundi) et `daily_score` peuvent être mis au max via l'API. → règles SQL en plus.
3. 🟠 Horloge du téléphone : avancer la date = gouttes pleines, défi du jour de DEMAIN jouable en avance (même pour tous),
   série gonflée. → heure de Supabase au lancement.
4. 🟢 Sauvegarde locale modifiable (pièces, cartes) : ne touche que le tricheur ; impossible à bloquer sans serveur.
Play Store (PWABuilder, aucun changement de code) : compte développeur 25 $ ; compte PERSONNEL récent → test fermé
12 testeurs Android pendant 14 jours d'affilée (à trouver par l'utilisateur : proches, ou groupes d'échange de tests ;
compte organisation dispensé mais SIRET + D-U-N-S). À faire dans le jeu avant : bouton « Supprimer mon compte » (exigé
par Google, dans l'appli + page web), page « Politique de confidentialité », assetlinks.json à la racine du domaine
(dépôt `aymericchevailler45-pixel.github.io`), fiche (captures, textes, questionnaire « sécurité des données »).

## Prochaines étapes (proposées le 2026-10-17)
1. Entraînement par thème — FAIT le 2026-10-18 (1re version) : sous-onglet « 🎯 Entraînement » dans Défis
   (`setChallengesTab`, `renderTraining`), 15 cases de thème, `pickTrainingCards`, `trainingProgress`,
   `endTraining`, mode 'training' (sans cœurs, `XP_TRAINING` = 2). Banque : `entrainement/<theme>.js`
   (TRAINING_QUESTIONS, ids 10000+ par blocs de 1000, voir `banque.js` — JAMAIS de nom de fichier commençant par « _ » : GitHub Pages ne les sert pas (404)) : 50 questions par thème = 750.
   Plus de questions du parcours dans l'entraînement (2026-10-18 : deux modes séparés). Paliers nommés
   (`TRAIN_TIER_NAMES` : Découverte, Initié, Confirmé, Expert, Maître), barre en 5 morceaux sur chaque case ;
   tap sur un thème → `confirmTraining` (palier, ce qu'il reste, « Commencer » / « Plus tard »).
   RÈGLE SIMPLIFIÉE (2026-10-18, l'ancienne « 2/3 réussies + 1/3 maîtrisées » était incompréhensible) : monter =
   réussir les 2/3 des questions du palier (cumulé entre sessions), AU PLUS UN PALIER PAR JOUR ET PAR THÈME
   (`trainTierDay`). « Maîtrisée » ne sert plus qu'à la progression (x / 50) et aux futurs badges. Re-toucher l'onglet Défis bascule
   Défis ⇄ Entraînement. Maîtrise = streak ≥ 2, une 2e réussite le même jour ne compte pas (`recordResult`). Contrôle des
   doublons / mots de la réponse dans la question : script `check_training.py` (scratchpad de la session).
   Lots 2 et 3 FAITS le 2026-10-18 (demande de l'utilisateur, en son absence) : 150 questions par thème = 2 250,
   ids x051-x150 dans chaque bloc, ajoutés en fin de fichier (2e `TRAINING_QUESTIONS.push`). Beaucoup de questions
   récentes (tubes 2015-2025, séries, applis, IA, JO 2024, prix Goncourt…). Drapeaux : 38 nouveaux drapeaux en image
   (flags/, sw.js). Monuments : questions photo (« Quel est ce monument ? ») sur des monuments ABSENTS du parcours,
   photos Wikimedia libres de droits en 640 px dans monuments/ (crédit obligatoire, monuments/credits.json).
   Outils (scratchpad) : `add.sh <thème>` = ajoute lots/<thème>.txt puis `check_training.py` + `syntax_check.py`
   (vérif. JS sans navigateur : Edge headless ne répondait plus), annule si problème.
   Les paliers comptent maintenant 30 questions (2/3 = 20 à réussir) ; le palier déjà atteint est conservé.
   1re visite : 3 bulles (`showTrainingTip`, drapeau `tipTraining2` ; l'ancien `tipTraining` = 1 bulle, gardé).
   1re visite de l'onglet Défis : 4 bulles (objectif du jour, défi du jour, sprint, « 🎯 Entraînement ») (`showChallengesTip`, `tipChallenges`) ;
   « Voir l'entraînement » (ou un tap sur l'onglet) y mène, puis les 3 bulles de l'entraînement suivent.
   1re visite du Profil (`showProfileTip`, `tipProfile`) : badges, cartes (1/3, brillantes, Maître), compte (si pas connecté).
   1re visite du Classement (`showLeagueTip`) : connecté avec pseudo → amis + semaine/lundi (`tipLeague`) ;
   sinon une bulle sur la carte d'accueil (`tipLeagueIntro`). Outil commun : `startTip` (étapes visibles seulement).
   Captures d'écran : Edge headless ne marche plus via Bash, mais OK via PowerShell (`shot.ps1` du scratchpad).
   FAIT LE 2026-10-19 (voir ci-dessous ; `trainChests`, `trainMedals`, `trainChestBoxes`, `claimPendingTrainChests`,
   `masterCard`, `TRAIN_MEDALS`, `SHINY_AT`/`isShiny`, `openLockedMaster`, `PODIUM_COINS`, `leagueWins`, badges league1/5/10) :
   - Coffre de palier : 2 cartes DU THÈME entraîné à chaque palier gagné (60 coffres max).
   - Collection à 10 cartes par thème (150) : +1 commune, +1 rare par thème (images dans emoji/), +1 carte
     « Maître » exclusive par thème, gagnée seulement au palier 5 de l'entraînement (jamais tirée au hasard).
     Affichage : 2 lignes de 5 par thème (mesuré : 10 sur une ligne = ~24 px, trop petit ; 5 = ~53 px).
   - Carte Maître expliquée aux deux endroits : emplacement verrouillé 🔒 en silhouette dans la Collection
     (tap → « Atteins le palier 5 en <thème>, dans Défis → Entraînement ») + « 🏆 Palier 5 : carte Maître »
     sur la case du thème et dans `confirmTraining`.
   - Cartes « dorées » → CARTES BRILLANTES ✨ (3 exemplaires) : la couleur de rareté reste (le doré = légendaire,
     ne pas brouiller), reflet holographique animé + petite étoile ✨ dans le coin, « Rare · Brillante » en grand.
   - 2026-10-19 (suite) : cartes à 3 exemplaires = « à réveiller » (`shinyPending`, pastille ✨ sur Profil et
     sous-onglet Cartes) ; un tap dans la collection lance l'animation (`revealShiny`) puis `shinyCards[id]` = brillante.
     Compteur « 1/3 », « 2/3 » en bas à droite des cartes. Raretés par thème : 3 communes, 3 rares, 2 épiques,
     1 légendaire, 1 Maître (poids 58 / 28 / 11 / 3). Série en danger à l'ouverture (`checkStreakDanger`, 1 fois/jour,
     série ≥ 2) : assez de gels → message ; sinon fenêtre « Acheter · X 🪙 » des gels manquants (max 5 jours).
     Le gel reste automatique (utilisé à la fin de la 1re leçon après les jours manqués, `bumpStreak`).
     Démo sans attendre : lien `?demo=gel` (gel manquant) ou `?demo=gel-ok` (assez de gels) : faux chiffres, rien d'enregistré.
   - Thème complet = 10/10 (carte Maître comprise, choix de l'utilisateur) : fête à la fermeture du coffre
     (`checkThemeComplete`, `themeComplete`), en-tête doré « 10/10 ✓ », badges collect1 / collect5 / collectAll
     et « Tout brille » (toutes les cartes normales d'un thème brillantes).
   - Ligue des amis : compteur de semaines gagnées (1re place) dans les Records + badges à 1, 5 et 10 victoires.
     Pièces selon la place finalement OUI (demandé le 2026-10-19) : 🥇 50, 🥈 25, 🥉 10 (`PODIUM_COINS`).
   - Médailles d'entraînement par thème : 🥉 1/3, 🥈 2/3, 🥇 toutes les questions maîtrisées (sur la case du thème,
     dans les Records, annoncées en fin de session). Coffres de palier déjà gagnés avant : donnés à l'ouverture de l'onglet. Données : `podium` (lundi -> place) suffit
     (compter les valeurs === 1). Le coffre reste selon le nombre d'amis battus.
   ENSUITE :
   bouton « Revoir le tutoriel », lot de questions du parcours (faits vérifiés en ligne), mode « Qui suis-je ? ».
   PLAN d'origine :
   - banque de questions SÉPARÉE du parcours (fichier à part chargé seulement à l'ouverture du mode), objectif
     ~150 par thème ; on commence par 50 par thème (750), puis lots de 50 après validation de la qualité ;
   - Monuments / Drapeaux : environ 1/3 avec image (photo libre, drapeau flagcdn), le reste en questions
     classiques ; seulement des questions classiques (pas de paires ni de frises dans ce mode) ;
   - carte « 🎯 Entraînement » dans Défis → grille des thèmes (progression « x / 150 maîtrisées ») ;
   - session de 10 : ≥ 6 nouvelles de la banque, ≤ 2 révisions de la banque (erreurs d'abord), ≤ 2 ERREURS
     du parcours déjà découvertes ; on complète toujours avec des nouveautés (pas trop de révision) ;
   - 5 paliers de difficulté par thème, on monte en maîtrisant ; suivi séparé (stats propres) ;
   - sans cœurs, XP réduits (2 par bonne réponse) ; badges par thème à 50 / 100 / 150 maîtrisées.
2. Cartes dorées : 3 exemplaires d'une carte → version dorée brillante (le nombre est déjà dans `cards`).
3. FAIT le 2026-10-18 — Indices en grille façon pendu (`hintGrid`, `renderHintGrid`, `HINT_LEVEL`) sur la réponse
   principale `a[0]` : Forme (cases vides, 15 🪙) → Initiales (1re lettre de chaque mot, 30 🪙) → Plus de lettres
   (≈ 1/3 de chaque mot, toujours ≥ 1 de plus que les initiales, 50 🪙). Mêmes id qu'avant (stocks gardés).
   Petits mots (le, de, des…) montrés en gris sans trait ; apostrophes/tirets gardés ; un indice plus faible
   que celui déjà pris est grisé « déjà visible ».
4. Plus de questions (bloc de 100 + 10 niveaux) ou nouveau thème.
5. Bouton « Revoir le tutoriel » : ABANDONNÉ (décision du 2026-10-23). Pas de bulles d'explication pour les missions
   et les duels non plus (jugés assez clairs).
6. Mode « Qui suis-je ? » (indices dévoilés un par un) — À GARDER EN TÊTE, PAS TOUT DE SUITE (2026-10-19).
   Conception proposée et validée dans l'idée : 5 indices du plus vague au plus précis ; réponse tapée à tout moment
   (même correction souple) ; « Indice suivant » ou mauvaise réponse = indice suivant ; XP 10/8/6/4/2 selon l'indice ;
   pas de cœurs ; partie de 5 énigmes, grille « 1️⃣3️⃣❌2️⃣5️⃣ » ; bloc « 🕵️ Qui suis-je ? » dans l'onglet Défis.
   Catégories : personnages/célébrités, pays/villes, monuments, œuvres, animaux/objets. ~150 énigmes (faits vérifiés
   en ligne), d'abord 50 pour tester. Reste à choisir : libre seulement ou + énigme du jour ; badge « Détective ».
7. Ligues façon Duolingo (quand il y aura assez de joueurs), connexion Google, Play Store (PWABuilder).

## Idées pour la suite (par ordre conseillé)
1. Notes `d` des anciennes questions relues le 2026-10-16 (82 corrigées, 5 reformulées : 144, 156, 713, 1215, 1304).
   À refaire seulement si l'utilisateur trouve un niveau mal dosé en jouant.
2. Export / import (pas urgent selon l'utilisateur) de la sauvegarde (fichier JSON) pour ne pas perdre la progression.
3. PWA + mise en ligne : FAIT le 2026-10-16, testé et installé sur le téléphone de l'utilisateur.
   Site : https://aymericchevailler45-pixel.github.io/Kultivo/ (dépôt github.com/aymericchevailler45-pixel/Kultivo,
   branche `master`). Pas de domaine payant (refusé). Mise à jour = commit + `git push` (`gh` non installé).
4. Supabase (l'utilisateur voulait "voir demain") : classement entre amis, synchronisation et sauvegarde en ligne,
   défi du jour partagé. Clé publique (anon) uniquement côté navigateur, règles RLS à configurer.
5. Entraînement par thème.
6. Plus tard (« au cas où », décidé le 2026-10-17) : Play Store via PWABuilder (aucun changement de code, compte
   Google Play payant, fichier assetlinks, politique de confidentialité), puis éventuellement Capacitor (~95 % du code
   gardé) pour notifications de rappel / Google Play Jeux. Connexion « avec Google » via Supabase à ajouter alors.
- Sauvegarde en ligne (FAITE le 2026-10-17) : table `saves` (user_id, data jsonb, xp, updated_at), RLS « chacun
  la sienne ». SUPABASE (mail du 2026-10-20) : à partir du 30/10/2026, une NOUVELLE table du schéma public n'est plus
  accessible par l'API sans GRANT explicite. Tables existantes non touchées. Toute future table : ajouter dans son
  fichier SQL `grant … on public.<table> to authenticated;` (et `to anon` seulement si besoin, ex. INSERT pour reports ;
  jamais de SELECT pour anon sur une table privée) ; les règles RLS restent nécessaires en plus.
  la sienne ». Comptes e-mail + mot de passe, « Confirm email » désactivé (quota d'e-mails Supabase gratuit).
  Bibliothèque `vendor/supabase.min.js` (v2.45.4, locale pour marcher hors ligne). Carte « ☁️ Sauvegarde en
  ligne » : bouton « ☁️ Mon compte » (ou « ☁️ Sauvegarder » sans compte) à côté de « 🔊 Son activé »,
  même taille, dans la carte du titre du profil (sans compte : « 👤 Se connecter » depuis le 2026-10-17, ouvre la connexion) + fenêtre « Mon compte » (déconnexion).
  Proposé dès l'accueil (étape 4/5 : Créer un compte / me connecter / Plus tard). `saveData` → `cloudChanged` → envoi 5 s plus tard (+ quand l'appli passe en arrière-
  plan). `cloudSync` au lancement/connexion : compte plus récent → appliqué ; deux progressions différentes →
  fenêtre « Quelle progression garder ? ». Métadonnées locales : localStorage `kultivo_cloud`.

## Règles de travail
- Ne pas réécrire tout le projet : modifier ciblé, garder les noms existants (états, clés localStorage).
- Ne jamais casser la sauvegarde existante : toute évolution de l'état passe par `normalizeData`.
- Questions : réponses courtes, plusieurs variantes dans `a`, pas de doublon de réponse sur un même sujet,
  pas de mot de la réponse dans la question, explication sans balises du type « [cite: 8] ».
- Nouvelles questions : répartir au prorata des thèmes existants, mythologie comprise (demande du 2026-10-16).