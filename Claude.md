# Kultivo (ex-« Culture G ») — mémo du projet

Quiz de culture générale façon Duolingo, 100 % navigateur (HTML/CSS/JS), sans serveur.
Propriétaire : francophone. Répondre en français, expliquer simplement, pas de jargon inutile.

## Fichiers
- `index.html` : 4 onglets (Parcours, Défis, Boutique, Profil) + écran de leçon + popups.
  Ordre de chargement OBLIGATOIRE : `questions.js` → `pairs.js` → `order.js` → `levels.js` → `script.js`.
- `style.css` : mise en page plein écran, décors latéraux, points de notification sur les onglets.
- `script.js` : toute la logique (état, sauvegarde, leçons, révisions, XP, boutique, badges).
- `questions.js` : `QUESTIONS` (id, theme, d, q, a, exp, niveau) et `LEVEL_NAMES`.
- `levels.js` : répartit automatiquement les questions dans les niveaux (voir plus bas).
- `order.js` : `ORDER_FAMILIES` (16 familles, ~225 cartes, dont « Vitesses » `[texte, valeur de tri, valeur affichée, d]`)
  pour les niveaux Ordre. Jamais deux valeurs identiques dans une famille.
- `cards.js` : `CARDS` (105 cartes à collectionner, 7 par thème : 3 communes, 2 rares, 1 épique, 1 légendaire)
  et `CARD_RARITIES` (chances de tirage, pièces pour un doublon). Image = emoji Twemoji (dossier `emoji/`, + `sw.js`).
- `pairs.js` : `PAIR_FAMILIES` (14 familles, ~285 paires `[gauche, droite, d]`) pour les niveaux Paires.
- ATTENTION GitHub Pages : Cache-Control max-age=600 (copie de 10 min sur le CDN). Pour vérifier une mise en
  ligne, tester l'URL SANS paramètre (le « ?n= » contourne le CDN et ment). Depuis kultivo-v6, le service worker
  ajoute ?v=<horodatage> aux fichiers html/js/css/json → le téléphone a toujours la dernière version.
- `manifest.json`, `sw.js`, `icons/` : application installable (PWA). Service worker « réseau d'abord »
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
- Révisions : questions ratées des niveaux PRÉCÉDENTS reviennent en priorité (tirage pondéré, 3 à 5 par leçon depuis le 2026-10-17 : 12 questions max), complétées par des
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
- Compteurs du haut cliquables : 🪙 → Boutique, ⭐ → Profil, 🔥 → calendrier de série (`streakModal`).
  Balayage gauche/droite dans le calendrier = mois suivant/précédent.
  Jours joués dans `activeDays` (rempli par `addXp` / `bumpStreak`), gels utilisés dans `frozenDays`.
  Historique d'avant le calendrier reconstitué une fois (`backfillActiveDays` : série, objectifs, défis du jour).
- XP : sert aux titres, aux pièces (1 🪙 / 10 XP), à l'objectif du jour et aux badges ; servira au classement (Supabase).
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
- Parcours : décors = une icône par thème (`THEME_DECOR`) ; tap = bulle d'anecdote (`showFact`). Anecdotes dans
  `facts.js` (THEME_FACTS, 10 par thème = 150) : chaque icône a la sienne (`data-fact`). Décors en z-index 2
  (sinon le parcours, pleine largeur, prenait les taps). L'utilisateur veut « presque 1 anecdote par icône ». Bouton flottant
  « 📍 Mon niveau » (⬆/⬇) quand le niveau en cours est hors écran. Drapeaux zoomables (loupe) comme les photos.
  Correction : nombres en lettres = chiffres (`NUMBER_WORDS` dans `normalize`, sauf « un/une »).
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
  6 étapes au plus (`PLACEMENT_MAX_STEPS`, départ au niveau 61 max sur 150 ; à réajuster si le parcours grandit), 2 bonnes sur 3 pour passer, arrêt à la 1re étape ratée.
  Valide les niveaux sautés (`done`), enregistre `placement: { day, start }`. Pas d'XP, pas de stats,
  et les niveaux sautés ne comptent pas pour les badges.

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
- Boutique compacte sur téléphone (icône à gauche, boutons côte à côte) ; coffre de cartes juste sous les pièces.

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
- Défi du jour comparé avec les amis (remplace « Copier mon résultat », demandé le 2026-10-17) : colonnes
  `daily_day`, `daily_score`, `daily_seconds` dans `scores` (`supabase/defi-du-jour.sql`, à lancer une fois),
  envoyées par `leaguePushScore` (repli sans ces colonnes si le SQL n'est pas lancé) ; liste dans la carte
  Défi du jour (`renderDailyFriends` : seulement les amis qui ONT joué, 5 meilleurs + moi si plus loin, « ⋯ »). Écran de fin du
  défi : bouton « Comparer avec mes amis ». Onglets Défis et Classement compacts sur téléphone.
- Avatar personnalisable (2026-10-17) : bouton rond en haut du Profil (`avatarBtn`, crayon) → fenêtre « Mon
  avatar » (`avatarModal`) : 12 couleurs (`AVATAR_HUES`), initiale ou 24 dessins Twemoji déjà dans `emoji/`
  (`AVATAR_EMOJIS`). Sauvegarde `avatar: { hue, emoji }` ; envoyé aux amis via `profiles.avatar_hue/avatar_emoji`
  (`supabase/avatar.sql`, `pushAvatar`) ; `avatarEl(pseudo, look, cls)` partout (podium, liste).
- Profil d'un ami (2026-10-17) : tap sur un ami (liste, podium, classement) → `friendModal` (`openFriendProfile`) :
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

## Prochaines étapes (proposées le 2026-10-17)
1. Entraînement par thème (questions déjà débloquées d'un thème au choix).
2. Cartes dorées : 3 exemplaires d'une carte → version dorée brillante (le nombre est déjà dans `cards`).
3. FAIT le 2026-10-18 — Indices en grille façon pendu (`hintGrid`, `renderHintGrid`, `HINT_LEVEL`) sur la réponse
   principale `a[0]` : Forme (cases vides, 15 🪙) → Initiales (1re lettre de chaque mot, 30 🪙) → Plus de lettres
   (≈ 1/3 de chaque mot, toujours ≥ 1 de plus que les initiales, 50 🪙). Mêmes id qu'avant (stocks gardés).
   Petits mots (le, de, des…) montrés en gris sans trait ; apostrophes/tirets gardés ; un indice plus faible
   que celui déjà pris est grisé « déjà visible ».
4. Plus de questions (bloc de 100 + 10 niveaux) ou nouveau thème.
5. Bouton « Revoir le tutoriel » dans le Profil.
6. Mode « Qui suis-je ? » (indices dévoilés un par un).
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