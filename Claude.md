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
- `pairs.js` : `PAIR_FAMILIES` (14 familles, ~285 paires `[gauche, droite, d]`) pour les niveaux Paires.
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
- Révisions : questions ratées reviennent en priorité (tirage pondéré, 3 à 8 par leçon),
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
  `keyboard-open` seulement en phase « answering » : taille normale pendant la correction.
  Détection : le champ a le focus ET l'écran visible a rétréci de
  plus de 150 px par rapport à la hauteur max mémorisée (`updateKeyboardMode`). PAS juste le focus : le jeu met le
  focus automatiquement à chaque question sans ouvrir le clavier,
  réajusté à 50/300/700 ms → images, question et étiquettes
  réduites pour garder « Vérifier » visible. Photos de monuments jamais recadrées (max-height, pas object-fit: cover).
- Chez l'utilisateur, le clavier s'ouvre automatiquement à chaque question → le mode compact est son affichage
  habituel : tailles « à mi-chemin » (ni trop grand, ni trop petit). Photo de monument : tap = plein écran
  (`photoZoom`, avec crédit), retap = retour. Pas de boutons collés au clavier (refusé) : à la place,
  `fitToKeyboard` mesure la place libre sous « Vérifier » et agrandit image + question (variable CSS --fit),
  appelé AVANT affichage dans showCard + fondu 0,15 s. Photos : `photoSize` [l, h] pour réserver la place.
  Zoom photo : pointerdown = preventDefault seulement, ouverture au click (sinon le même tap la refermait).
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
  Cadeau de bienvenue à la fin : 100 🪙 + 1 🧊 (`WELCOME_COINS`, `WELCOME_FREEZES`, une seule fois : `welcomeGift`).
- Récap de fin de leçon animé : tuiles XP / Précision / Temps (défi du jour : Score ; sprint : Bonnes / Record)
  qui apparaissent l'une après l'autre avec chiffres qui défilent (`renderEndStats`, `countUp`).
- Test de placement (mode `placement`) : lancé depuis l'accueil (remplace l'ancienne popup de bienvenue) et via un bouton SOUS le niveau 1 (la carte se lit de bas en haut) tant qu'aucun niveau n'est terminé.
  6 étapes au plus (`PLACEMENT_MAX_STEPS`, départ au niveau 61 max sur 150 ; à réajuster si le parcours grandit), 2 bonnes sur 3 pour passer, arrêt à la 1re étape ratée.
  Valide les niveaux sautés (`done`), enregistre `placement: { day, start }`. Pas d'XP, pas de stats,
  et les niveaux sautés ne comptent pas pour les badges.

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

## Règles de travail
- Ne pas réécrire tout le projet : modifier ciblé, garder les noms existants (états, clés localStorage).
- Ne jamais casser la sauvegarde existante : toute évolution de l'état passe par `normalizeData`.
- Questions : réponses courtes, plusieurs variantes dans `a`, pas de doublon de réponse sur un même sujet,
  pas de mot de la réponse dans la question, explication sans balises du type « [cite: 8] ».
- Nouvelles questions : répartir au prorata des thèmes existants, mythologie comprise (demande du 2026-10-16).