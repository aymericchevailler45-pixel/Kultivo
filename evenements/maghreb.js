'use strict';

/* ============================================================
   KULTIVO — questions de l'événement « Escale au Maghreb » (ids 31000+, séparées du parcours et de l'entraînement)
   Préparé le 2026-10-30 (voyage des testeurs, 2-8 novembre 2026). Questions accessibles (d ≈ 2,3), sujets choisis pour
   ne PAS doublonner le parcours et l'entraînement (Rabat, Atlas, tajine, couscous, Chefchaouen… y sont déjà).
   Même format que questions.js (theme = vrai thème du jeu, pour les missions).
   ============================================================ */

window.EVENT_BANKS = window.EVENT_BANKS || {};   // déjà déclaré par halloween.js : pas de « const » ici

window.EVENT_BANKS.maghreb = [
    // Géographie
    { id: 31000, theme: "Géographie", d: 1.5, q: "Quelle est la capitale de l’Algérie ?", a: ["Alger"], exp: "Surnommée « Alger la Blanche » pour ses maisons blanches face à la mer." },
    { id: 31001, theme: "Géographie", d: 1.5, q: "Quelle est la capitale de la Tunisie ?", a: ["Tunis"], exp: "Le pays et sa capitale portent presque le même nom." },
    { id: 31002, theme: "Géographie", d: 2, q: "Quelle est la plus grande ville du Maroc ?", a: ["Casablanca", "Casa"], exp: "Environ 3,5 millions d’habitants : c’est le poumon économique du pays, mais pas sa capitale (Rabat)." },
    { id: 31003, theme: "Géographie", d: 2, q: "Quelle ville marocaine est surnommée la « ville rouge » pour la couleur de ses murs ?", a: ["Marrakech", "Marrakesh"], exp: "Ses remparts en terre ocre s’étendent sur près de 20 km." },
    { id: 31004, theme: "Géographie", d: 2.5, q: "Quelle grande île tunisienne, très touristique, est surnommée « la douce » ?", a: ["Djerba", "Jerba"], exp: "Selon la légende, Ulysse y aurait goûté au fruit du lotus, qui fait tout oublier." },
    { id: 31005, theme: "Géographie", d: 3, q: "Quelle ville algérienne, perchée sur des gorges, est surnommée « la ville des ponts suspendus » ?", a: ["Constantine"], exp: "Ses ponts enjambent les gorges du Rhummel, profondes de plus de 100 m." },
    { id: 31006, theme: "Géographie", d: 2.5, q: "Quel pays voisin se trouve à l’est de la Tunisie ?", a: ["La Libye", "Libye"], exp: "À l’ouest, la Tunisie est voisine de l’Algérie." },
    { id: 31007, theme: "Géographie", d: 2, q: "Quel pays du Maghreb est bordé à la fois par la Méditerranée et par l’océan Atlantique ?", a: ["Le Maroc", "Maroc"], exp: "Sa façade atlantique est bien plus longue que sa côte méditerranéenne." },
    { id: 31008, theme: "Langue française", d: 3, q: "Que signifie le mot arabe « Maghreb » ?", a: ["Le couchant", "Couchant", "L’ouest", "Ouest", "Le soleil couchant", "Là où le soleil se couche", "Le pays du soleil couchant", "Occident", "L’occident"], exp: "C’est l’ouest du monde arabe, là où le soleil se couche. C’est aussi le nom arabe du Maroc : « al-Maghrib »." },
    { id: 31009, theme: "Géographie", d: 2.5, q: "Quelle grande ville marocaine fait face à l’Espagne, à l’entrée du détroit ?", a: ["Tanger", "Tangier"], exp: "Par beau temps, on y aperçoit les côtes espagnoles, de l’autre côté du détroit de Gibraltar." },
    { id: 31010, theme: "Géographie", d: 1.5, q: "Dans quel pays se trouve la station balnéaire d’Agadir ?", a: ["Le Maroc", "Maroc"], exp: "Reconstruite après le tremblement de terre de 1960, elle compte environ 300 jours de soleil par an." },
    { id: 31011, theme: "Géographie", d: 1.5, q: "Comment appelle-t-on un point d’eau entouré de palmiers au milieu du désert ?", a: ["Une oasis", "Oasis"], exp: "On y cultive souvent des dattes à l’ombre des palmiers." },
    { id: 31012, theme: "Sciences", d: 1.5, q: "Comment appelle-t-on une colline de sable façonnée par le vent ?", a: ["Une dune", "Dune", "Dunes"], exp: "Au Sahara, certaines dépassent 300 m de haut." },
    { id: 31013, theme: "Sciences", d: 2.5, q: "Quel vent chaud et sec venu du Sahara peut apporter du sable jusqu’en France ?", a: ["Le sirocco", "Sirocco", "Siroco"], exp: "Il laisse parfois une fine poussière orange sur les voitures, jusque dans les Alpes." },

    // Gastronomie
    { id: 31014, theme: "Gastronomie", d: 1.5, q: "Quelle plante parfume le thé servi traditionnellement au Maroc ?", a: ["La menthe", "Menthe", "Menthe verte"], exp: "On le verse de haut pour faire de la mousse : c’est un signe d’hospitalité." },
    { id: 31015, theme: "Gastronomie", d: 3, q: "Quelle soupe aux tomates, lentilles et pois chiches rompt le jeûne du ramadan au Maroc ?", a: ["La harira", "Harira"], exp: "On la sert souvent avec des dattes et des pâtisseries au miel." },
    { id: 31016, theme: "Gastronomie", d: 2, q: "Quelle purée de piments rouges très relevée vient de Tunisie ?", a: ["La harissa", "Harissa"], exp: "Elle est inscrite au patrimoine immatériel de l’Unesco depuis 2022." },
    { id: 31017, theme: "Gastronomie", d: 2, q: "Quelle petite saucisse épicée, rouge, accompagne souvent le couscous ?", a: ["La merguez", "Merguez"], exp: "Traditionnellement au bœuf ou au mouton, relevée à la harissa." },
    { id: 31018, theme: "Gastronomie", d: 1.5, q: "Quel fruit sucré du palmier mange-t-on souvent pour rompre le jeûne du ramadan ?", a: ["La datte", "Datte", "Dattes"], exp: "La variété « deglet nour » (« doigt de lumière ») est très cultivée en Algérie et en Tunisie." },
    { id: 31019, theme: "Gastronomie", d: 2.5, q: "Quel feuilleté tunisien frit est souvent garni d’un œuf entier ?", a: ["La brick", "Brick", "Brik", "Brick à l’œuf", "Brik à l’œuf"], exp: "Le jaune doit rester coulant : on le mange avec les doigts, délicatement !" },
    { id: 31020, theme: "Gastronomie", d: 2, q: "Quelle huile précieuse est tirée des noix d’un arbre qui ne pousse presque qu’au Maroc ?", a: ["L’huile d’argan", "Huile d’argan", "Argan", "L’argan"], exp: "Les chèvres grimpent dans les arganiers pour manger leurs fruits." },
    { id: 31021, theme: "Gastronomie", d: 2.5, q: "Quelle pâtisserie en forme de croissant, fourrée à la pâte d’amande, porte le nom d’un animal ?", a: ["La corne de gazelle", "Corne de gazelle", "Cornes de gazelle", "Kaab el ghazal"], exp: "Parfumée à la fleur d’oranger, on la sert avec le thé." },
    { id: 31022, theme: "Gastronomie", d: 3, q: "Quel grand feuilleté marocain sucré-salé est garni de volaille, d’amandes et de cannelle ?", a: ["La pastilla", "Pastilla", "Bastilla", "Bstilla"], exp: "On la saupoudre de sucre glace et de cannelle avant de la servir." },
    { id: 31023, theme: "Gastronomie", d: 3, q: "Quel plat d’œufs pochés dans une sauce tomate aux poivrons est très populaire en Tunisie ?", a: ["La chakchouka", "Chakchouka", "Chakchuka", "Shakshuka", "Chakchoukha"], exp: "On le prépare dans une poêle et on le mange en saucant avec du pain." },
    { id: 31024, theme: "Gastronomie", d: 2, q: "De quelle huile la Tunisie est-elle l’un des plus grands producteurs au monde ?", a: ["L’huile d’olive", "Huile d’olive", "Olive", "L’olive"], exp: "Le pays compte plus de 80 millions d’oliviers." },

    // Monuments
    { id: 31025, theme: "Monuments", d: 2, q: "Dans quelle ville marocaine se trouve la célèbre place Jemaa el-Fna ?", a: ["Marrakech", "Marrakesh"], exp: "Conteurs, musiciens et charmeurs de serpents l’animent jour et nuit." },
    { id: 31026, theme: "Monuments", d: 2.5, q: "Quelle immense mosquée de Casablanca est construite en partie au-dessus de l’océan ?", a: ["La mosquée Hassan-II", "Mosquée Hassan II", "Hassan II", "Hassan-II"], exp: "Son minaret d’environ 210 m est l’un des plus hauts du monde." },
    { id: 31027, theme: "Monuments", d: 3, q: "Quel célèbre minaret du XIIe siècle domine la ville de Marrakech ?", a: ["La Koutoubia", "Koutoubia"], exp: "Son nom vient des libraires (« koutoubiyyin ») qui s’installaient à ses pieds." },
    { id: 31028, theme: "Monuments", d: 2.5, q: "Quel village tunisien est célèbre pour ses maisons blanches aux portes bleues ?", a: ["Sidi Bou Saïd", "Sidi Bou Said", "Sidi Bousaid"], exp: "Perché au-dessus du golfe de Tunis, il a inspiré de nombreux peintres." },
    { id: 31029, theme: "Monuments", d: 2.5, q: "Quel jardin bleu de Marrakech porte le nom du peintre qui l’a créé ?", a: ["Le jardin Majorelle", "Jardin Majorelle", "Majorelle"], exp: "Il a été racheté en 1980 par le couturier Yves Saint Laurent et Pierre Bergé." },
    { id: 31030, theme: "Monuments", d: 2, q: "Comment appelle-t-on la vieille ville, aux ruelles étroites, des cités du Maghreb ?", a: ["La médina", "Médina", "Medina"], exp: "Celle de Fès est la plus grande zone piétonne du monde." },
    { id: 31031, theme: "Monuments", d: 2, q: "Comment appelle-t-on le marché traditionnel aux ruelles couvertes ?", a: ["Le souk", "Souk", "Les souks", "Souks"], exp: "Chaque ruelle a souvent son métier : épices, tapis, cuir, bijoux…" },
    { id: 31032, theme: "Monuments", d: 3.5, q: "Quel village fortifié en terre, au sud du Maroc, a servi de décor à « Gladiator » et « Game of Thrones » ?", a: ["Aït-Ben-Haddou", "Ait Ben Haddou", "Aït Ben Haddou", "Ait-Ben-Haddou", "Ait Benhaddou"], exp: "Ce ksar est inscrit au patrimoine mondial de l’Unesco depuis 1987." },
    { id: 31033, theme: "Histoire", d: 2, q: "Quelle cité antique, fondée par les Phéniciens près de Tunis, fut la grande rivale de Rome ?", a: ["Carthage"], exp: "Rome l’a rasée en 146 av. J.-C. ; ses ruines sont inscrites à l’Unesco." },

    // Histoire
    { id: 31034, theme: "Histoire", d: 2.5, q: "En quelle année l’Algérie est-elle devenue indépendante ?", a: ["1962", "En 1962"], exp: "Le 5 juillet 1962, après huit ans de guerre." },
    { id: 31035, theme: "Histoire", d: 3.5, q: "En quelle année le Maroc et la Tunisie sont-ils devenus indépendants ?", a: ["1956", "En 1956"], exp: "Le Maroc le 2 mars 1956, la Tunisie le 20 mars 1956." },
    { id: 31036, theme: "Histoire", d: 3, q: "Comment a-t-on surnommé la révolution tunisienne de 2011, du nom d’une fleur ?", a: ["La révolution du jasmin", "Révolution du jasmin", "Le jasmin", "Jasmin"], exp: "Elle a lancé le « Printemps arabe » dans plusieurs pays." },
    { id: 31037, theme: "Histoire", d: 2, q: "Comment appelle-t-on les peuples autochtones d’Afrique du Nord, aussi appelés Amazighs ?", a: ["Les Berbères", "Berbères", "Berbere", "Berberes"], exp: "Ils vivaient au Maghreb bien avant l’arrivée des Phéniciens et des Romains." },
    { id: 31038, theme: "Histoire", d: 2.5, q: "Quel roi règne sur le Maroc depuis 1999 ?", a: ["Mohammed VI", "Mohammed 6", "Mohamed VI", "Mohammed Six"], exp: "Il a succédé à son père, Hassan II." },
    { id: 31039, theme: "Histoire", d: 2.5, q: "Quel peuple nomade du Sahara est surnommé les « hommes bleus » ?", a: ["Les Touaregs", "Touaregs", "Touareg", "Les Touareg", "Tuaregs"], exp: "À cause de leur grand voile teint à l’indigo, qui déteint sur la peau." },

    // Sport
    { id: 31040, theme: "Sport", d: 2, q: "Quel pays est devenu en 2022 la première équipe africaine demi-finaliste d’une Coupe du monde ?", a: ["Le Maroc", "Maroc"], exp: "Au Qatar, il a éliminé l’Espagne et le Portugal avant de perdre contre la France." },
    { id: 31041, theme: "Sport", d: 2.5, q: "Quel ailier algérien a été sacré champion d’Angleterre avec Leicester en 2016 ?", a: ["Riyad Mahrez", "Mahrez"], exp: "Leicester était donné à 5 000 contre 1 en début de saison !" },
    { id: 31042, theme: "Sport", d: 2.5, q: "Quel défenseur marocain du PSG a marqué en finale de la Ligue des champions 2025 ?", a: ["Achraf Hakimi", "Hakimi"], exp: "Il a ouvert le score lors de la victoire 5-0 contre l’Inter Milan." },
    { id: 31043, theme: "Sport", d: 2, q: "Quel animal du désert a donné son surnom à l’équipe de football d’Algérie ?", a: ["Le fennec", "Fennec", "Les Fennecs", "Fennecs"], exp: "Ce petit renard aux immenses oreilles est l’animal emblème de l’Algérie." },
    { id: 31044, theme: "Sport", d: 3, q: "Quelle joueuse de tennis tunisienne a disputé trois finales de Grand Chelem en 2022 et 2023 ?", a: ["Ons Jabeur", "Jabeur"], exp: "Deux à Wimbledon et une à l’US Open : une première pour une joueuse arabe ou africaine." },
    { id: 31045, theme: "Sport", d: 3.5, q: "Quelle course à pied de plusieurs jours traverse le désert du sud marocain ?", a: ["Le marathon des sables", "Marathon des sables", "Le Marathon des Sables"], exp: "Environ 250 km en autonomie, sous une chaleur écrasante." },

    // Cinéma, musique, littérature, arts
    { id: 31046, theme: "Cinéma", d: 2, q: "Quel film de 1942 avec Humphrey Bogart porte le nom d’une ville marocaine ?", a: ["Casablanca"], exp: "Il a pourtant été tourné entièrement en studio, à Hollywood !" },
    { id: 31047, theme: "Cinéma", d: 3, q: "Dans quel pays ont été tournées les scènes de la planète Tatooine de « Star Wars » ?", a: ["La Tunisie", "Tunisie"], exp: "Et la planète doit son nom à Tataouine, une ville du sud tunisien." },
    { id: 31048, theme: "Cinéma", d: 2, q: "Quel humoriste d’origine marocaine joue Numérobis dans « Astérix et Obélix : Mission Cléopâtre » ?", a: ["Jamel Debbouze", "Jamel", "Debbouze"], exp: "Il a aussi fondé le Jamel Comedy Club en 2006." },
    { id: 31049, theme: "Musique", d: 2.5, q: "Quel genre musical est né à Oran, en Algérie ?", a: ["Le raï", "Raï", "Rai", "Le rai"], exp: "« Raï » veut dire « opinion » : les chanteurs y donnaient leur avis sur la vie." },
    { id: 31050, theme: "Musique", d: 2, q: "Quel chanteur algérien, surnommé « le roi du raï », a chanté « Aïcha » en 1996 ?", a: ["Khaled", "Cheb Khaled"], exp: "La chanson a été écrite par Jean-Jacques Goldman." },
    { id: 31051, theme: "Arts", d: 3.5, q: "Quel peintre romantique a peint « Femmes d’Alger dans leur appartement » en 1834 ?", a: ["Eugène Delacroix", "Delacroix"], exp: "Il avait voyagé au Maroc et en Algérie deux ans plus tôt." },
    { id: 31052, theme: "Arts", d: 3, q: "Comment appelle-t-on les carreaux de terre cuite émaillée qui forment des mosaïques au Maroc ?", a: ["Le zellige", "Zellige", "Zelliges", "Les zelliges"], exp: "Chaque petit morceau est taillé à la main pour former des motifs géométriques." },
    { id: 31053, theme: "Arts", d: 3, q: "Comment appelle-t-on la « main de Fatma », porte-bonheur à cinq doigts ?", a: ["La khamsa", "Khamsa", "Hamsa", "La hamsa", "Khomsa"], exp: "« Khamsa » veut dire « cinq » en arabe : elle protégerait du mauvais œil." },
    { id: 31054, theme: "Littérature", d: 3.5, q: "Quel écrivain marocain a reçu le prix Goncourt en 1987 pour « La Nuit sacrée » ?", a: ["Tahar Ben Jelloun", "Ben Jelloun"], exp: "C’était le premier auteur maghrébin à recevoir le Goncourt." },
    { id: 31055, theme: "Arts", d: 3, q: "Quel grand couturier français, né à Oran, aimait passer ses vacances à Marrakech ?", a: ["Yves Saint Laurent", "Saint Laurent", "YSL", "Saint-Laurent"], exp: "Un musée lui est consacré à Marrakech depuis 2017." },

    // Langue et traditions
    { id: 31056, theme: "Langue française", d: 2.5, q: "Comment dit-on « merci » en arabe ?", a: ["Choukrane", "Choukran", "Shukran", "Chokran", "Chokrane"], exp: "Et on répond « afwan » : « de rien »." },
    { id: 31057, theme: "Langue française", d: 2.5, q: "Comment s’appelle la longue robe à capuche portée au Maghreb ?", a: ["La djellaba", "Djellaba", "Djellabah", "Jellaba"], exp: "Hommes et femmes la portent, en laine l’hiver ou en coton l’été." },
    { id: 31058, theme: "Langue française", d: 2, q: "Comment appelle-t-on les chaussons de cuir sans talon, souvent jaunes, du Maroc ?", a: ["Des babouches", "Babouches", "Babouche", "Les babouches"], exp: "Celles de Fès et de Marrakech sont cousues à la main." },
    { id: 31059, theme: "Langue française", d: 3, q: "Avec l’arabe, quelle langue est officielle au Maroc et en Algérie ?", a: ["Le berbère", "Berbère", "Berbere", "L’amazigh", "Amazigh", "Le tamazight", "Tamazight"], exp: "Elle s’écrit avec un alphabet très ancien, le tifinagh." },

    // Animaux et mythologie
    { id: 31060, theme: "Sciences", d: 1.5, q: "Quel animal à une seule bosse traverse le Sahara ?", a: ["Le dromadaire", "Dromadaire"], exp: "Le chameau, lui, en a deux. Sa bosse contient de la graisse, pas de l’eau." },
    { id: 31061, theme: "Sciences", d: 3.5, q: "Quel singe sans queue vit en liberté dans le Moyen Atlas et sur le rocher de Gibraltar ?", a: ["Le magot", "Magot", "Le macaque de Barbarie", "Macaque de Barbarie", "Macaque berbère"], exp: "C’est le seul singe d’Afrique du Nord… et le seul en liberté en Europe." },
    { id: 31062, theme: "Mythologie", d: 3, q: "Quel héros grec est allé cueillir les pommes d’or du jardin des Hespérides, près des monts de l’Atlas ?", a: ["Héraclès", "Heracles", "Hercule"], exp: "C’était l’un de ses douze travaux : il a demandé l’aide du géant Atlas." },
    { id: 31063, theme: "Mythologie", d: 3.5, q: "Selon la légende, quelle reine a fondé Carthage avant de tomber amoureuse d’Énée ?", a: ["Didon", "Elyssa", "Élissa", "Elissa"], exp: "Abandonnée par Énée, elle se donne la mort dans « L’Énéide » de Virgile." }
];

// Anecdotes des décors du parcours pendant l'escale (une par icône)
window.EVENT_BANKS.maghrebFacts = [
    'Le thé à la menthe se verse de haut pour faire de la mousse : plus il y en a, plus l’accueil est chaleureux.',
    'Le Sahara est grand comme les États-Unis… et il n’est fait de dunes qu’à environ 20 %.',
    'Un dromadaire peut boire plus de 100 litres d’eau en une dizaine de minutes.',
    'La médina de Fès est la plus grande zone piétonne du monde : aucune voiture ne peut y passer.',
    'Les chèvres grimpent dans les arganiers pour en manger les fruits.',
    'Le couscous est inscrit au patrimoine immatériel de l’Unesco depuis 2020, par quatre pays ensemble.',
    'La mosquée Hassan-II de Casablanca peut accueillir 25 000 fidèles à l’intérieur, et 80 000 sur son esplanade.',
    'À Djerba, la synagogue de la Ghriba est l’une des plus anciennes d’Afrique.',
    'Le mot « orange » vient de l’arabe « nāranj », lui-même venu du persan.',
    'Les maisons de Sidi Bou Saïd doivent être blanches et bleues : c’est une règle depuis 1915.',
    'Le fennec a les plus grandes oreilles du monde par rapport à sa taille : elles l’aident à se rafraîchir.',
    'La « deglet nour », la datte la plus célèbre, veut dire « doigt de lumière ».'
];
