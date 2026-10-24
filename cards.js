/* ============================================================
   KULTIVO — cartes à collectionner (gagnées dans les coffres du parcours)
   12 cartes par thème depuis le 26/10/2026 : 4 communes, 4 rares, 2 épiques, 1 légendaire (tirées dans les coffres)
   + 1 carte « Maître » (rareté master), gagnée seulement au palier 5 de l'entraînement du thème.
   [id, thème, emoji (affiché en image Twemoji, dossier emoji/), nom, rareté, texte]
   Pour ajouter une carte : un id jamais utilisé, et télécharger l'emoji dans emoji/ (+ sw.js).
   ============================================================ */

const CARD_RARITIES = {
    common:    { name: 'Commune',    weight: 58, dupCoins: 5 },
    rare:      { name: 'Rare',       weight: 28, dupCoins: 10 },
    epic:      { name: 'Épique',     weight: 11, dupCoins: 25 },
    legendary: { name: 'Légendaire', weight: 3,  dupCoins: 50 },
    master:    { name: 'Maître',     weight: 0,  dupCoins: 50 },  // jamais tirée au hasard : palier 5 de l'entraînement
    event:     { name: 'Événement',  weight: 0,  dupCoins: 20 }   // jamais tirée : gagnée pendant un événement (Halloween…)
};

const CARDS = [
    // Histoire
    ['hi1', 'Histoire', '🪖', 'Casque de poilu', 'common', 'Le casque Adrian protège les soldats français dès 1915.'],
    ['hi2', 'Histoire', '🪶', 'Plume d’oie', 'common', 'On a écrit à la plume d’oie pendant plus de mille ans.'],
    ['hi3', 'Histoire', '🏹', 'Arc long anglais', 'common', 'Il décide de la bataille d’Azincourt, en 1415.'],
    ['hi4', 'Histoire', '⚔️', 'Épée de Jeanne d’Arc', 'rare', 'Elle l’aurait trouvée enterrée derrière l’autel d’une église de Touraine.'],
    ['hi5', 'Histoire', '👑', 'Couronne impériale', 'rare', 'La couronne du Saint-Empire, conservée à Vienne, a plus de mille ans.'],
    ['hi6', 'Histoire', '📜', 'Déclaration des droits de l’homme', 'epic', '26 août 1789 : « Les hommes naissent et demeurent libres et égaux en droits. »'],
    ['hi7', 'Histoire', '🧵', 'Tapisserie de Bayeux', 'legendary', 'Près de 70 mètres de broderie racontent la conquête de l’Angleterre, en 1066.'],
    ['hi8', 'Histoire', '🗝️', 'Clé de la Bastille', 'epic', 'La Fayette l’a offerte à George Washington : elle est toujours chez lui, à Mount Vernon.'],
    ['hi9', 'Histoire', '🚢', 'Le Titanic', 'rare', 'Son épave, retrouvée en 1985, repose à près de 3 800 m de fond.'],
    ['hiM', 'Histoire', '⚜️', 'Fleur de lys', 'master', 'L’emblème des rois de France, brodé d’or sur fond bleu.'],

    // Sciences
    ['sc1', 'Sciences', '🧲', 'Pierre d’aimant', 'common', 'La magnétite, naturellement aimantée, attire le fer depuis l’Antiquité.'],
    ['sc2', 'Sciences', '🌡️', 'Thermomètre de Celsius', 'common', 'Au départ, Celsius mettait 0 pour l’eau bouillante et 100 pour la glace.'],
    ['sc3', 'Sciences', '🦠', 'Microbe de Pasteur', 'common', 'Pasteur a prouvé que les microbes ne naissent pas tout seuls.'],
    ['sc4', 'Sciences', '🔭', 'Lunette de Galilée', 'rare', 'En 1610, Galilée y découvre quatre lunes de Jupiter.'],
    ['sc5', 'Sciences', '🧬', 'Double hélice', 'rare', 'La forme de l’ADN est décrite en 1953, grâce aux clichés de Rosalind Franklin.'],
    ['sc6', 'Sciences', '🍎', 'Pomme de Newton', 'epic', 'Sa chute aurait inspiré à Newton la loi de la gravitation.'],
    ['sc7', 'Sciences', '☢️', 'Carnets de Marie Curie', 'legendary', 'Toujours radioactifs, ils se consultent avec des gants et une décharge signée.'],
    ['sc8', 'Sciences', '🧪', 'Fiole de Lavoisier', 'epic', 'En 1783, Lavoisier montre que l’eau est faite d’hydrogène et d’oxygène.'],
    ['sc9', 'Sciences', '🦕', 'Diplodocus du Muséum', 'rare', 'Une copie du squelette « Dippy » est exposée au Muséum de Paris depuis 1908.'],
    ['scM', 'Sciences', '🚀', 'Fusée Saturn V', 'master', '110 m de haut : elle a emmené les premiers hommes vers la Lune en 1969.'],

    // Géographie
    ['ge1', 'Géographie', '🧭', 'Boussole', 'common', 'Son aiguille montre le nord magnétique, pas le nord géographique.'],
    ['ge2', 'Géographie', '🗺️', 'Carte de Cassini', 'common', 'Au XVIIIe siècle, la première carte complète du royaume de France.'],
    ['ge3', 'Géographie', '🌋', 'Piton de la Fournaise', 'common', 'Le volcan de La Réunion est l’un des plus actifs du monde.'],
    ['ge4', 'Géographie', '🏔️', 'Everest', 'rare', '8 849 m : le toit du monde grandit encore de quelques millimètres par an.'],
    ['ge5', 'Géographie', '🏜️', 'Sahara', 'rare', 'Le plus grand désert chaud du monde, presque aussi vaste que les États-Unis.'],
    ['ge6', 'Géographie', '🌐', 'Globe de Behaim', 'epic', 'Fabriqué en 1492, c’est le plus vieux globe terrestre conservé… sans l’Amérique.'],
    ['ge7', 'Géographie', '🌊', 'Fosse des Mariannes', 'legendary', 'Près de 11 000 m de fond : l’Everest y disparaîtrait entièrement.'],
    ['ge8', 'Géographie', '🏝️', 'Atoll des Maldives', 'epic', 'Les Maldives comptent près de 1 200 îles, presque toutes au ras de l’eau.'],
    ['ge9', 'Géographie', '🧊', 'Iceberg', 'rare', 'Environ 90 % de son volume reste caché sous l’eau.'],
    ['geM', 'Géographie', '🌍', 'La Bille bleue', 'master', 'La célèbre photo de la Terre entière, prise par l’équipage d’Apollo 17 en 1972.'],

    // Technologie
    ['te1', 'Technologie', '⌨️', 'Clavier AZERTY', 'common', 'Hérité des machines à écrire de la fin du XIXe siècle.'],
    ['te2', 'Technologie', '📻', 'Radio de Marconi', 'common', 'En 1901, Marconi envoie un signal radio à travers l’Atlantique.'],
    ['te3', 'Technologie', '💾', 'Disquette', 'common', 'Disparue des bureaux, elle survit dans l’icône « Enregistrer ».'],
    ['te4', 'Technologie', '📞', 'Téléphone de Bell', 'rare', 'Premier appel en 1876 : « Monsieur Watson, venez, j’ai besoin de vous. »'],
    ['te5', 'Technologie', '🤖', 'Robot', 'rare', 'Le mot vient d’une pièce de théâtre tchèque de 1920.'],
    ['te6', 'Technologie', '💡', 'Ampoule d’Edison', 'epic', 'En 1879, son filament de carbone brille plus de 13 heures d’affilée.'],
    ['te7', 'Technologie', '🧮', 'Pascaline', 'legendary', 'La machine à calculer inventée par Blaise Pascal à 19 ans, en 1642.'],
    ['te8', 'Technologie', '🖱️', 'Souris d’Engelbart', 'epic', 'La toute première souris, présentée en 1968, était un boîtier en bois.'],
    ['te9', 'Technologie', '📱', 'Premier iPhone', 'rare', 'Présenté par Steve Jobs en janvier 2007.'],
    ['teM', 'Technologie', '🛰️', 'Spoutnik', 'master', 'Le premier satellite artificiel, lancé par l’URSS le 4 octobre 1957.'],

    // Musique
    ['mu1', 'Musique', '🎸', 'Guitare électrique', 'epic', 'La célèbre Fender Stratocaster sort en 1954.'],
    ['mu2', 'Musique', '🎷', 'Saxophone', 'common', 'Inventé par le Belge Adolphe Sax, vers 1840.'],
    ['mu3', 'Musique', '🎹', 'Piano', 'common', 'Son vrai nom, « pianoforte », veut dire qu’il joue doux et fort.'],
    ['mu4', 'Musique', '🎺', 'Trompette de Louis Armstrong', 'rare', '« Satchmo » a fait connaître le jazz dans le monde entier.'],
    ['mu5', 'Musique', '💿', 'Album Thriller', 'rare', 'L’album de Michael Jackson (1982) est le plus vendu de l’histoire.'],
    ['mu6', 'Musique', '🎻', 'Stradivarius', 'epic', 'Environ 650 instruments de Stradivari existent encore ; certains valent des millions.'],
    ['mu7', 'Musique', '🎼', 'Partition de la Neuvième', 'legendary', 'Beethoven, presque sourd, l’a composée ; son « Hymne à la joie » est l’hymne de l’Europe.'],
    ['mu8', 'Musique', '🥁', 'Batterie', 'common', 'Grosse caisse, caisse claire, toms et cymbales : un orchestre à elle seule.'],
    ['mu9', 'Musique', '🎤', 'Micro de Freddie Mercury', 'rare', 'Il chantait avec un pied de micro coupé en deux, cassé lors d’un de ses premiers concerts.'],
    ['muM', 'Musique', '🎙️', 'Micro d’Édith Piaf', 'master', '« Non, je ne regrette rien », enregistrée en 1960, reste une des chansons françaises les plus connues.'],

    // Littérature
    ['li1', 'Littérature', '☕', 'Café de Balzac', 'common', 'Il en aurait bu des dizaines de tasses par jour pour écrire.'],
    ['li2', 'Littérature', '🌹', 'Rose du Petit Prince', 'common', 'Une rose unique au monde, sur l’astéroïde B 612.'],
    ['li3', 'Littérature', '🐋', 'Moby Dick', 'common', 'Le cachalot blanc que pourchasse le capitaine Achab.'],
    ['li4', 'Littérature', '🏴‍☠️', 'L’Île au trésor', 'rare', 'Le roman de Stevenson (1883) a créé l’image du pirate à jambe de bois.'],
    ['li5', 'Littérature', '🤺', 'Les Trois Mousquetaires', 'rare', 'Ils sont en fait quatre, avec d’Artagnan.'],
    ['li6', 'Littérature', '💍', 'Anneau unique', 'epic', '« Un anneau pour les gouverner tous » : le cœur du Seigneur des anneaux.'],
    ['li7', 'Littérature', '📖', 'Bible de Gutenberg', 'legendary', 'Premier grand livre imprimé en Europe, vers 1455 ; il en reste moins de 50.'],
    ['li8', 'Littérature', '✒️', 'Plume de Victor Hugo', 'epic', 'En exil à Guernesey, il écrivait souvent debout, devant un pupitre.'],
    ['li9', 'Littérature', '🛏️', 'Chambre de Proust', 'rare', 'Il écrivait la nuit, au lit, dans une chambre tapissée de liège contre le bruit.'],
    ['liM', 'Littérature', '📚', 'Collection de la Pléiade', 'master', 'Ses livres sont imprimés sur du papier bible, très fin, pour tenir des milliers de pages.'],

    // Jeux
    ['je1', 'Jeux', '🎲', 'Dé', 'common', 'Deux faces opposées d’un dé font toujours 7.'],
    ['je2', 'Jeux', '🃏', 'Joker', 'common', 'Il apparaît aux États-Unis vers 1860.'],
    ['je3', 'Jeux', '🧩', 'Puzzle', 'common', 'Les premiers puzzles, vers 1760, servaient à apprendre la géographie.'],
    ['je4', 'Jeux', '🎯', 'Cible de fléchettes', 'rare', 'Le 20, tout en haut, est entouré du 5 et du 1 pour punir les maladroits.'],
    ['je5', 'Jeux', '🕹️', 'Pong', 'rare', 'Sorti en 1972, c’est l’un des premiers jeux vidéo à succès.'],
    ['je6', 'Jeux', '🎮', 'Game Boy', 'epic', 'Sortie en 1989, une Game Boy a survécu à un bombardement et marche encore.'],
    ['je7', 'Jeux', '♟️', 'Échecs de Lewis', 'legendary', 'Des pièces sculptées dans l’ivoire de morse au XIIe siècle, trouvées en Écosse.'],
    ['je8', 'Jeux', '🀄', 'Tuile de mah-jong', 'epic', 'Un jeu complet compte 144 tuiles.'],
    ['je9', 'Jeux', '🎳', 'Partie parfaite', 'rare', 'Au bowling, 12 strikes d’affilée donnent le score parfait de 300.'],
    ['jeM', 'Jeux', '👾', 'Space Invader', 'master', 'Le jeu de 1978 aurait provoqué une pénurie de pièces de 100 yens au Japon.'],

    // Cinéma
    ['ci1', 'Cinéma', '🍿', 'Pop-corn', 'common', 'Il s’installe dans les cinémas américains pendant la crise des années 1930.'],
    ['ci2', 'Cinéma', '🎞️', 'Pellicule', 'common', 'Un film classique défile à 24 images par seconde.'],
    ['ci3', 'Cinéma', '🎬', 'Clap', 'common', 'Son « clac » sert à caler le son sur l’image au montage.'],
    ['ci4', 'Cinéma', '🦖', 'T. rex de Jurassic Park', 'rare', 'En 1993, ses dinosaures numériques révolutionnent les effets spéciaux.'],
    ['ci5', 'Cinéma', '🦈', 'Requin des Dents de la mer', 'rare', 'Le requin mécanique tombait si souvent en panne que Spielberg l’a peu montré.'],
    ['ci6', 'Cinéma', '👠', 'Souliers de rubis', 'epic', 'Ceux du Magicien d’Oz (1939) ; une paire volée a été retrouvée en 2018.'],
    ['ci7', 'Cinéma', '🚂', 'L’Arrivée d’un train', 'legendary', 'Le film des frères Lumière ; la légende dit que le public s’est enfui.'],
    ['ci8', 'Cinéma', '🎥', 'Cinématographe', 'epic', 'L’appareil des frères Lumière servait à la fois de caméra et de projecteur.'],
    ['ci9', 'Cinéma', '🕷️', 'Spider-Man', 'rare', 'Créé en 1962 par Stan Lee et Steve Ditko.'],
    ['ciM', 'Cinéma', '⭐', 'Étoile du Walk of Fame', 'master', 'Plus de 2 700 étoiles sont incrustées dans les trottoirs d’Hollywood.'],

    // Gastronomie
    ['ga1', 'Gastronomie', '🥐', 'Croissant', 'common', 'Il viendrait d’une viennoiserie autrichienne, le kipferl.'],
    ['ga2', 'Gastronomie', '🥖', 'Baguette', 'common', 'Son savoir-faire est inscrit au patrimoine de l’UNESCO depuis 2022.'],
    ['ga3', 'Gastronomie', '🍫', 'Chocolat aztèque', 'epic', 'Les Aztèques le buvaient amer et épicé.'],
    ['ga4', 'Gastronomie', '🧀', 'Roquefort', 'rare', 'Premier fromage français protégé par une appellation, en 1925.'],
    ['ga5', 'Gastronomie', '🍾', 'Champagne', 'rare', 'Dom Pérignon n’a pas inventé les bulles, mais il a perfectionné le vin.'],
    ['ga6', 'Gastronomie', '🍄', 'Truffe noire', 'epic', 'Le « diamant noir » du Périgord peut dépasser 1 000 € le kilo.'],
    ['ga7', 'Gastronomie', '🍯', 'Miel des pharaons', 'legendary', 'Du miel de plus de 3 000 ans, trouvé dans des tombes égyptiennes, était encore mangeable.'],
    ['ga8', 'Gastronomie', '🍷', 'Vin de Bordeaux', 'common', 'Un des plus grands vignobles du monde : plus de 100 000 hectares de vignes.'],
    ['ga9', 'Gastronomie', '🦪', 'Huîtres de Cancale', 'rare', 'Louis XIV se les faisait livrer jusqu’à Versailles.'],
    ['gaM', 'Gastronomie', '🍰', 'Saint-Honoré', 'master', 'Ce gâteau porte le nom du saint patron des boulangers et des pâtissiers.'],

    // Sport
    ['sp1', 'Sport', '⚽', 'Ballon de football', 'common', 'Un ballon officiel pèse entre 410 et 450 grammes.'],
    ['sp2', 'Sport', '🎾', 'Balle de tennis', 'common', 'Le jeu de paume, ancêtre du tennis, est né en France.'],
    ['sp3', 'Sport', '🚴', 'Vélo du Tour', 'epic', 'Le Tour de France est né en 1903.'],
    ['sp4', 'Sport', '🥊', 'Gants de Mohamed Ali', 'rare', '« Vole comme un papillon, pique comme une abeille. »'],
    ['sp5', 'Sport', '👕', 'Maillot jaune', 'rare', 'Jaune comme le papier de L’Auto, le journal qui organisait le Tour.'],
    ['sp6', 'Sport', '🏅', 'Médaille d’or', 'epic', 'Une médaille d’or olympique est surtout en argent, recouverte d’or.'],
    ['sp7', 'Sport', '🏆', 'Coupe Jules-Rimet', 'legendary', 'La première Coupe du monde, volée en 1983, n’a jamais été retrouvée.'],
    ['sp8', 'Sport', '🏀', 'Ballon de basket', 'common', 'Le basket a été inventé en 1891 par le professeur James Naismith.'],
    ['sp9', 'Sport', '⛷️', 'Skis de Jean-Claude Killy', 'rare', 'Trois médailles d’or aux Jeux de Grenoble, en 1968.'],
    ['spM', 'Sport', '🔥', 'Flamme olympique', 'master', 'Elle est allumée à Olympie, avec un miroir qui concentre les rayons du soleil.'],

    // Arts
    ['ar1', 'Arts', '🎨', 'Palette impressionniste', 'epic', 'Les tubes de peinture ont permis aux impressionnistes de peindre dehors.'],
    ['ar2', 'Arts', '🖌️', 'Pinceau', 'common', 'Les meilleurs pinceaux d’aquarelle sont en poils de martre.'],
    ['ar3', 'Arts', '🩰', 'Chaussons de danse', 'common', 'Les danseuses montent sur les pointes au début du XIXe siècle.'],
    ['ar4', 'Arts', '🌻', 'Tournesols de Van Gogh', 'rare', 'Il en a peint plusieurs versions pour décorer sa maison d’Arles.'],
    ['ar5', 'Arts', '🗻', 'La Grande Vague', 'rare', 'L’estampe d’Hokusai, vers 1831 : le mont Fuji est minuscule au fond.'],
    ['ar6', 'Arts', '👂', 'Oreille de Van Gogh', 'epic', 'En 1888, à Arles, il se coupe l’oreille gauche.'],
    ['ar7', 'Arts', '🖼️', 'La Joconde', 'legendary', 'Volée au Louvre en 1911, elle est retrouvée deux ans plus tard à Florence.'],
    ['ar8', 'Arts', '✏️', 'Crayon à papier', 'common', 'Sa mine est faite de graphite et d’argile… et pas de plomb.'],
    ['ar9', 'Arts', '🎭', 'Masques du théâtre', 'rare', 'La comédie et la tragédie : le symbole du théâtre depuis la Grèce antique.'],
    ['arM', 'Arts', '💎', 'Le Régent', 'master', 'Un diamant de 140 carats, exposé au Louvre dans la galerie d’Apollon.'],

    // Langue française
    ['lf1', 'Langue française', '✍️', 'Accent circonflexe', 'common', 'Il remplace souvent un S disparu : forêt (forest), hôpital (hospital).'],
    ['lf2', 'Langue française', '📝', 'Dictée de Mérimée', 'epic', 'Écrite vers 1857 pour la cour de Napoléon III, pleine de pièges.'],
    ['lf3', 'Langue française', '📗', 'Dictionnaire', 'common', 'Chaque année, de nouveaux mots y entrent.'],
    ['lf4', 'Langue française', '🗡️', 'Épée d’académicien', 'rare', 'Chaque membre de l’Académie française reçoit une épée faite pour lui.'],
    ['lf5', 'Langue française', '⚖️', 'Ordonnance de Villers-Cotterêts', 'rare', 'En 1539, François Ier impose le français dans les actes officiels.'],
    ['lf6', 'Langue française', '🏛️', 'Académie française', 'epic', 'Créée en 1635 par Richelieu ; ses membres sont les « Immortels ».'],
    ['lf7', 'Langue française', '📘', 'Premier dictionnaire de l’Académie', 'legendary', 'Il a fallu près de 60 ans pour le publier, en 1694.'],
    ['lf8', 'Langue française', '🔤', 'Alphabet latin', 'common', 'Notre alphabet vient du latin, lui-même inspiré de l’alphabet grec.'],
    ['lf9', 'Langue française', '💬', 'Phylactère', 'rare', 'Le vrai nom de la bulle de bande dessinée.'],
    ['lfM', 'Langue française', '🖋️', 'Plume de Molière', 'master', 'On appelle souvent le français « la langue de Molière ».'],

    // Mythologie
    ['my1', 'Mythologie', '🦉', 'Chouette d’Athéna', 'common', 'Symbole de sagesse, elle figurait sur les pièces d’Athènes.'],
    ['my2', 'Mythologie', '🐍', 'Tête de Méduse', 'epic', 'Son regard changeait en pierre quiconque la regardait.'],
    ['my3', 'Mythologie', '🍏', 'Pomme de discorde', 'common', '« À la plus belle » : cette pomme d’or a déclenché la guerre de Troie.'],
    ['my4', 'Mythologie', '🐎', 'Cheval de Troie', 'rare', 'Les Grecs cachés à l’intérieur ont pris la ville par la ruse.'],
    ['my5', 'Mythologie', '🏺', 'Boîte de Pandore', 'rare', 'C’était en fait une jarre ; au fond, il ne resta que l’Espérance.'],
    ['my6', 'Mythologie', '🔱', 'Trident de Poséidon', 'epic', 'D’un coup de trident, il faisait jaillir des sources et trembler la terre.'],
    ['my7', 'Mythologie', '🔨', 'Mjöllnir', 'legendary', 'Le marteau de Thor revient toujours dans sa main après avoir été lancé.'],
    ['my8', 'Mythologie', '🌿', 'Couronne de laurier', 'common', 'Apollon la porte en souvenir de la nymphe Daphné, changée en laurier.'],
    ['my9', 'Mythologie', '🦄', 'Licorne', 'rare', 'Animal légendaire… et emblème officiel de l’Écosse.'],
    ['myM', 'Mythologie', '⚡', 'Foudre de Zeus', 'master', 'Selon la légende, elle a été forgée par les Cyclopes.'],

    // Drapeaux
    ['dr1', 'Drapeaux', '🏳️', 'Drapeau blanc', 'common', 'Signe de trêve ou de reddition depuis des siècles.'],
    ['dr2', 'Drapeaux', '🏁', 'Drapeau à damier', 'epic', 'Il salue le vainqueur des courses automobiles.'],
    ['dr3', 'Drapeaux', '🇨🇭', 'Drapeau suisse', 'common', 'L’un des deux seuls drapeaux nationaux carrés, avec celui du Vatican.'],
    ['dr4', 'Drapeaux', '🇳🇵', 'Drapeau du Népal', 'rare', 'Le seul drapeau national qui n’est pas un rectangle.'],
    ['dr5', 'Drapeaux', '🇩🇰', 'Dannebrog', 'rare', 'Le drapeau du Danemark serait le plus ancien encore utilisé.'],
    ['dr6', 'Drapeaux', '🇫🇷', 'Drapeau tricolore', 'epic', 'Le blanc du roi entre le bleu et le rouge de Paris.'],
    ['dr7', 'Drapeaux', '🇺🇸', 'Drapeau sur la Lune', 'legendary', 'Planté par Apollo 11 en 1969, il a été renversé par le souffle du décollage.'],
    ['dr8', 'Drapeaux', '🚩', 'Drapeau rouge', 'common', 'Sur une plage surveillée, il interdit la baignade.'],
    ['dr9', 'Drapeaux', '🇯🇵', 'Hinomaru', 'rare', '« Le cercle du soleil » : le drapeau du Japon.'],
    ['drM', 'Drapeaux', '🇪🇺', 'Drapeau européen', 'master', 'Ses 12 étoiles symbolisent l’unité et la perfection, pas le nombre de pays.'],

    // Monuments
    ['mo1', 'Monuments', '🗼', 'Tour Eiffel', 'common', 'Elle grandit d’une quinzaine de centimètres l’été, quand le métal chauffe.'],
    ['mo2', 'Monuments', '🗽', 'Statue de la Liberté', 'common', 'Offerte par la France en 1886 ; sa charpente est de Gustave Eiffel.'],
    ['mo3', 'Monuments', '🌉', 'Golden Gate', 'common', 'Sa couleur « orange international » le rend visible dans le brouillard.'],
    ['mo4', 'Monuments', '🕌', 'Taj Mahal', 'rare', 'Un empereur l’a fait bâtir en marbre blanc pour son épouse.'],
    ['mo5', 'Monuments', '🏯', 'Château d’Himeji', 'rare', 'Le « Héron blanc » a échappé aux guerres et aux bombardements.'],
    ['mo6', 'Monuments', '🗿', 'Moaï', 'epic', 'L’île de Pâques en compte près de 900 ; certains ont un corps enterré.'],
    ['mo7', 'Monuments', '🧱', 'Grande Muraille', 'legendary', 'Plus de 20 000 km de murs… et pourtant invisible à l’œil nu depuis l’espace.'],
    ['mo8', 'Monuments', '⛲', 'Fontaine de Trevi', 'epic', 'Environ 3 000 € de pièces y sont jetés chaque jour, puis donnés à une œuvre caritative.'],
    ['mo9', 'Monuments', '⛩️', 'Torii de Miyajima', 'rare', 'Ce grand portail rouge semble flotter sur la mer à marée haute.'],
    ['moM', 'Monuments', '🏰', 'Château de Neuschwanstein', 'master', 'Le château de Louis II de Bavière aurait inspiré celui de La Belle au bois dormant.']
].concat((() => {
    // 26/10/2026 : 2 cartes de plus par thème (1 commune, 1 rare) → 12 par thème, 180 en tout. Visibles à partir de ce jour-là.
    const n = new Date();
    const today = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
    let demo = false;
    try { demo = new URLSearchParams(location.search).get('demo') === 'lundi'; } catch (err) { /* sans adresse */ }
    return demo || today >= '2026-10-26' ? [
        ['hi10', 'Histoire', '🪓', 'Hache viking', 'common', 'Les Vikings maniaient la hache… mais n’ont jamais porté de casque à cornes, une invention du XIXe siècle.'],
        ['hi11', 'Histoire', '🗞️', '« J’accuse… ! »', 'rare', 'Le 13 janvier 1898, Zola défend Dreyfus en une du journal L’Aurore.'],
        ['sc10', 'Sciences', '🔬', 'Microscope de Van Leeuwenhoek', 'common', 'Vers 1675, il est le premier à observer des êtres vivants microscopiques.'],
        ['sc11', 'Sciences', '⚛️', 'Atome de Bohr', 'rare', 'En 1913, Niels Bohr imagine les électrons tournant autour du noyau comme des planètes.'],
        ['ge10', 'Géographie', '🌵', 'Cactus saguaro', 'common', 'Dans le désert de Sonora, il peut dépasser 12 mètres de haut.'],
        ['ge11', 'Géographie', '🌀', 'Cyclone', 'rare', 'Dans l’hémisphère Sud, les cyclones tournent dans le sens des aiguilles d’une montre.'],
        ['te10', 'Technologie', '🔋', 'Pile de Volta', 'common', 'En 1800, Volta empile des disques de zinc et de cuivre : la première pile électrique.'],
        ['te11', 'Technologie', '📷', 'Appareil Kodak', 'rare', '1888 : « Vous appuyez sur le bouton, nous faisons le reste. »'],
        ['mu10', 'Musique', '🪕', 'Banjo', 'common', 'Il descend d’instruments venus d’Afrique de l’Ouest.'],
        ['mu11', 'Musique', '🎧', 'Casque du Walkman', 'rare', 'En 1979, le Walkman de Sony permet d’écouter sa musique partout.'],
        ['li10', 'Littérature', '🐇', 'Lapin blanc', 'common', '« En retard ! » : il entraîne Alice au pays des merveilles, en 1865.'],
        ['li11', 'Littérature', '⚓', 'Le Nautilus', 'rare', 'Le sous-marin du capitaine Nemo, dans « Vingt Mille Lieues sous les mers » de Jules Verne.'],
        ['je10', 'Jeux', '🪀', 'Yo-yo', 'common', 'L’un des plus vieux jouets du monde : on en jouait déjà en Grèce antique.'],
        ['je11', 'Jeux', '🎰', 'Liberty Bell', 'rare', 'La première machine à sous, inventée vers 1895 à San Francisco.'],
        ['ci10', 'Cinéma', '🦍', 'King Kong', 'common', 'En 1933, le gorille géant escalade l’Empire State Building.'],
        ['ci11', 'Cinéma', '👽', 'E.T.', 'rare', '« E.T. téléphone maison » : le film de Spielberg sort en 1982.'],
        ['ga10', 'Gastronomie', '🥞', 'Crêpe de la Chandeleur', 'common', 'Le 2 février, on fait sauter la première crêpe avec une pièce dans l’autre main.'],
        ['ga11', 'Gastronomie', '🍕', 'Pizza Margherita', 'rare', 'Elle porterait le nom de la reine Marguerite d’Italie, en 1889 : tomate, mozzarella et basilic, comme le drapeau.'],
        ['sp10', 'Sport', '🏉', 'Ballon de rugby', 'common', 'Selon la légende, William Webb Ellis invente le rugby en 1823 en prenant le ballon à la main.'],
        ['sp11', 'Sport', '⛳', 'Golf sur la Lune', 'rare', 'En 1971, l’astronaute Alan Shepard y frappe deux balles de golf.'],
        ['ar10', 'Arts', '🖍️', 'Pastel de Degas', 'common', 'Degas a dessiné au pastel une grande partie de ses danseuses.'],
        ['ar11', 'Arts', '🪷', 'Nymphéas de Monet', 'rare', 'Monet en a peint environ 250 tableaux, dans son jardin de Giverny.'],
        ['lf10', 'Langue française', '✉️', 'Courriel', 'common', 'Le mot a été inventé au Québec pour remplacer « e-mail ».'],
        ['lf11', 'Langue française', '📏', 'Anticonstitutionnellement', 'rare', '25 lettres : longtemps cité comme le plus long mot du dictionnaire.'],
        ['my10', 'Mythologie', '🪽', 'Ailes d’Icare', 'common', 'Collées avec de la cire, elles fondent quand Icare s’approche trop du soleil.'],
        ['my11', 'Mythologie', '🐺', 'Louve romaine', 'rare', 'Elle aurait nourri Romulus et Rémus, les fondateurs légendaires de Rome.'],
        ['dr10', 'Drapeaux', '🇨🇦', 'Unifolié', 'common', 'La feuille d’érable rouge flotte sur le drapeau du Canada depuis 1965.'],
        ['dr11', 'Drapeaux', '🇧🇷', 'Drapeau du Brésil', 'rare', 'Sa devise « Ordre et progrès » est écrite sur un ciel étoilé.'],
        ['mo10', 'Monuments', '🎡', 'London Eye', 'common', 'Inaugurée en 2000, la grande roue de Londres mesure 135 mètres.'],
        ['mo11', 'Monuments', '🛕', 'Angkor Vat', 'rare', 'Au Cambodge, c’est le plus grand monument religieux du monde.']
    ] : [];
})()).map(([id, theme, icon, name, rarity, text]) => ({ id, theme, icon, name, rarity, text }));
