'use strict';

/* ============================================================
   KULTIVO — les familles « Remets dans l'ordre » (niveaux Ordre)
   ============================================================
   Les niveaux 8, 18, 28… sont des niveaux Ordre : 3 frises à la suite.
   Chaque frise montre 4 à 6 cartes mélangées à ranger dans l'ordre.

   Chaque famille : id, theme, title, prompt (la consigne),
   ends : [libellé du haut, libellé du bas] de la frise,
   items : [texte de la carte, valeur pour trier, valeur affichée, d]
     - la valeur sert seulement à trier (du plus petit au plus grand) ;
     - la valeur affichée est montrée après la correction (pour apprendre) ;
     - d = difficulté de 1 à 5 (à quel point la carte est connue).
   Deux cartes d'une même famille ne doivent JAMAIS avoir la même valeur.

   Au début du parcours, le jeu choisit des cartes bien espacées (faciles
   à départager) ; plus loin, des cartes proches (plus dur).
   ============================================================ */

const ORDER_FAMILIES = [
    {
        id: 'histoire', theme: 'Histoire', title: 'Grands événements',
        prompt: 'Du plus ancien au plus récent', ends: ['Plus ancien', 'Plus récent'],
        items: [
            ['Construction de la pyramide de Khéops', -2560, 'vers 2560 av. J.-C.', 2.5],
            ['Fondation de Rome', -753, '753 av. J.-C.', 3],
            ['Assassinat de Jules César', -44, '44 av. J.-C.', 3],
            ['Chute de l’Empire romain d’Occident', 476, '476', 3.5],
            ['Couronnement de Charlemagne', 800, '800', 3],
            ['Bataille d’Hastings', 1066, '1066', 3.5],
            ['Début de la guerre de Cent Ans', 1337, '1337', 3.5],
            ['Arrivée de la peste noire en Europe', 1347, '1347', 4],
            ['Jeanne d’Arc brûlée à Rouen', 1431, '1431', 3],
            ['Prise de Constantinople', 1453, '1453', 3.5],
            ['Découverte de l’Amérique', 1492, '1492', 1.5],
            ['Bataille de Marignan', 1515, '1515', 2.5],
            ['Édit de Nantes', 1598, '1598', 3.5],
            ['Indépendance des États-Unis', 1776, '1776', 2.5],
            ['Révolution française', 1789, '1789', 1],
            ['Sacre de Napoléon', 1804, '1804', 2.5],
            ['Bataille de Waterloo', 1815, '1815', 2.5],
            ['Abolition de l’esclavage en France', 1848, '1848', 3.5],
            ['Début de la Première Guerre mondiale', 1914, '1914', 1.5],
            ['Révolution russe', 1917, '1917', 2.5],
            ['Krach de Wall Street', 1929, '1929', 2.5],
            ['Fin de la Seconde Guerre mondiale', 1945, '1945', 1.5],
            ['Traité de Rome (naissance de la CEE)', 1957, '1957', 3.5],
            ['Mai 68', 1968, '1968', 2],
            ['Premier pas sur la Lune', 1969, '1969', 1.5],
            ['Chute du mur de Berlin', 1989, '1989', 1.5],
            ['Attentats du 11 Septembre', 2001, '2001', 1],
            ['Arrivée des pièces et billets en euros', 2002, '2002', 2.5]
        ]
    },
    {
        id: 'presidents', theme: 'Histoire', title: 'Présidents de la Ve République',
        prompt: 'Du premier au plus récent', ends: ['Premier', 'Plus récent'],
        items: [
            ['Charles de Gaulle', 1959, 'président en 1959', 1.5],
            ['Georges Pompidou', 1969, 'président en 1969', 3],
            ['Valéry Giscard d’Estaing', 1974, 'président en 1974', 3],
            ['François Mitterrand', 1981, 'président en 1981', 2],
            ['Jacques Chirac', 1995, 'président en 1995', 2],
            ['Nicolas Sarkozy', 2007, 'président en 2007', 1.5],
            ['François Hollande', 2012, 'président en 2012', 1.5],
            ['Emmanuel Macron', 2017, 'président en 2017', 1]
        ]
    },
    {
        id: 'souverains', theme: 'Histoire', title: 'Souverains de France',
        prompt: 'Du plus ancien au plus récent', ends: ['Plus ancien', 'Plus récent'],
        items: [
            ['Clovis', 481, 'règne dès 481', 2.5],
            ['Charlemagne', 768, 'règne dès 768', 2],
            ['Hugues Capet', 987, 'règne dès 987', 3.5],
            ['Philippe Auguste', 1180, 'règne dès 1180', 4],
            ['Saint Louis (Louis IX)', 1226, 'règne dès 1226', 3.5],
            ['François Ier', 1515, 'règne dès 1515', 2.5],
            ['Henri IV', 1589, 'règne dès 1589', 3],
            ['Louis XIV', 1643, 'règne dès 1643', 2],
            ['Louis XVI', 1774, 'règne dès 1774', 2],
            ['Napoléon Ier', 1804, 'empereur dès 1804', 1.5],
            ['Louis-Philippe', 1830, 'règne dès 1830', 4]
        ]
    },
    {
        id: 'inventions', theme: 'Technologie', title: 'Inventions',
        prompt: 'De la plus ancienne à la plus récente', ends: ['Plus ancienne', 'Plus récente'],
        items: [
            ['Imprimerie de Gutenberg', 1450, 'vers 1450', 3],
            ['Machine à vapeur de James Watt', 1769, '1769', 4],
            ['Photographie (Niépce)', 1826, 'vers 1826', 4],
            ['Téléphone', 1876, '1876', 3],
            ['Ampoule électrique d’Edison', 1879, '1879', 3.5],
            ['Vaccin contre la rage', 1885, '1885', 3.5],
            ['Cinématographe des frères Lumière', 1895, '1895', 3],
            ['Premier vol en avion (frères Wright)', 1903, '1903', 2.5],
            ['Télévision (premières images)', 1926, '1926', 3.5],
            ['Ordinateur ENIAC', 1945, '1945', 4],
            ['Réseau ARPANET, ancêtre d’Internet', 1969, '1969', 3.5],
            ['Premier téléphone portable', 1973, '1973', 3.5],
            ['World Wide Web', 1989, '1989', 3],
            ['Google', 1998, '1998', 2],
            ['Wikipédia', 2001, '2001', 2.5],
            ['Facebook', 2004, '2004', 2],
            ['Premier iPhone', 2007, '2007', 1.5],
            ['Bitcoin', 2009, '2009', 2.5],
            ['ChatGPT', 2022, '2022', 1.5]
        ]
    },
    {
        id: 'consoles', theme: 'Jeux', title: 'Consoles de jeu',
        prompt: 'De la plus ancienne à la plus récente', ends: ['Plus ancienne', 'Plus récente'],
        items: [
            ['Atari 2600', 1977, 'sortie en 1977', 3],
            ['NES (Famicom)', 1983, 'sortie en 1983', 3],
            ['Mega Drive', 1988, 'sortie en 1988', 3.5],
            ['Game Boy', 1989, 'sortie en 1989', 2.5],
            ['PlayStation', 1994, 'sortie en 1994', 2],
            ['Nintendo 64', 1996, 'sortie en 1996', 2.5],
            ['PlayStation 2', 2000, 'sortie en 2000', 2],
            ['Xbox', 2001, 'sortie en 2001', 3],
            ['Nintendo DS', 2004, 'sortie en 2004', 2.5],
            ['Wii', 2006, 'sortie en 2006', 2],
            ['Nintendo Switch', 2017, 'sortie en 2017', 1.5],
            ['PlayStation 5', 2020, 'sortie en 2020', 1]
        ]
    },
    {
        id: 'planetes', theme: 'Sciences', title: 'Planètes du système solaire',
        prompt: 'De la plus proche à la plus éloignée du Soleil', ends: ['Plus proche', 'Plus éloignée'],
        items: [
            ['Mercure', 58, '58 millions de km', 1.5],
            ['Vénus', 108, '108 millions de km', 2.5],
            ['Terre', 150, '150 millions de km', 1],
            ['Mars', 228, '228 millions de km', 1.5],
            ['Jupiter', 778, '778 millions de km', 2],
            ['Saturne', 1430, '1,4 milliard de km', 2.5],
            ['Uranus', 2870, '2,9 milliards de km', 3],
            ['Neptune', 4500, '4,5 milliards de km', 3]
        ]
    },
    {
        id: 'animaux', theme: 'Sciences', title: 'Animaux',
        prompt: 'Du plus léger au plus lourd (adulte)', ends: ['Plus léger', 'Plus lourd'],
        items: [
            ['Colibri', 0.003, 'environ 3 g', 2],
            ['Souris', 0.02, 'environ 20 g', 1.5],
            ['Chat', 4, 'environ 4 kg', 1],
            ['Labrador', 30, 'environ 30 kg', 1.5],
            ['Être humain', 70, 'environ 70 kg', 1.5],
            ['Lion', 190, 'environ 190 kg', 2.5],
            ['Ours brun', 350, 'environ 350 kg', 3.5],
            ['Cheval', 500, 'environ 500 kg', 2.5],
            ['Girafe', 1000, 'environ 1 tonne', 3.5],
            ['Rhinocéros blanc', 2300, 'environ 2,3 tonnes', 3.5],
            ['Éléphant d’Afrique', 6000, 'environ 6 tonnes', 2],
            ['Baleine bleue', 150000, 'environ 150 tonnes', 1.5]
        ]
    },
    {
        id: 'pays', theme: 'Géographie', title: 'Pays par superficie',
        prompt: 'Du plus petit au plus grand', ends: ['Plus petit', 'Plus grand'],
        items: [
            ['Vatican', 0.44, '0,44 km²', 2],
            ['Monaco', 2, '2 km²', 2.5],
            ['Luxembourg', 2586, '2 600 km²', 3],
            ['Belgique', 30689, '31 000 km²', 3],
            ['Suisse', 41285, '41 000 km²', 3.5],
            ['Portugal', 92212, '92 000 km²', 3.5],
            ['Royaume-Uni', 243610, '244 000 km²', 3.5],
            ['Italie', 302073, '302 000 km²', 3.5],
            ['Allemagne', 357588, '358 000 km²', 4],
            ['Japon', 377975, '378 000 km²', 4.5],
            ['Espagne', 505990, '506 000 km²', 4],
            ['France métropolitaine', 551695, '552 000 km²', 3.5],
            ['Égypte', 1001450, '1 million de km²', 4],
            ['Inde', 3287263, '3,3 millions de km²', 3],
            ['Australie', 7692024, '7,7 millions de km²', 3],
            ['Brésil', 8515767, '8,5 millions de km²', 3.5],
            ['Canada', 9984670, '10 millions de km²', 3.5],
            ['Russie', 17098246, '17 millions de km²', 1.5]
        ]
    },
    {
        id: 'fleuves', theme: 'Géographie', title: 'Fleuves',
        prompt: 'Du plus court au plus long', ends: ['Plus court', 'Plus long'],
        items: [
            ['Tamise', 346, '346 km', 3],
            ['Seine', 777, '777 km', 3],
            ['Rhône', 812, '812 km', 3.5],
            ['Loire', 1006, '1 006 km', 3],
            ['Rhin', 1233, '1 233 km', 3.5],
            ['Gange', 2525, '2 525 km', 4],
            ['Danube', 2850, '2 850 km', 3.5],
            ['Volga', 3530, '3 530 km', 4],
            ['Mississippi', 3730, '3 730 km', 4],
            ['Mékong', 4350, '4 350 km', 4.5],
            ['Congo', 4700, '4 700 km', 4.5],
            ['Yangtsé', 6300, '6 300 km', 4],
            ['Nil', 6650, '6 650 km', 2]
        ]
    },
    {
        id: 'sommets', theme: 'Géographie', title: 'Sommets',
        prompt: 'Du plus bas au plus haut', ends: ['Plus bas', 'Plus haut'],
        items: [
            ['Puy de Dôme', 1465, '1 465 m', 3],
            ['Mont Ventoux', 1910, '1 910 m', 3],
            ['Mont Olympe (Grèce)', 2918, '2 918 m', 4],
            ['Etna', 3350, 'environ 3 350 m', 4],
            ['Mont Fuji', 3776, '3 776 m', 3.5],
            ['Cervin', 4478, '4 478 m', 4],
            ['Mont Blanc', 4806, 'environ 4 806 m', 2],
            ['Kilimandjaro', 5895, '5 895 m', 3],
            ['Denali (mont McKinley)', 6190, '6 190 m', 4.5],
            ['Aconcagua', 6961, '6 961 m', 4],
            ['K2', 8611, '8 611 m', 3.5],
            ['Everest', 8849, '8 849 m', 1]
        ]
    },
    {
        id: 'films', theme: 'Cinéma', title: 'Films',
        prompt: 'Du plus ancien au plus récent', ends: ['Plus ancien', 'Plus récent'],
        items: [
            ['Blanche-Neige et les Sept Nains', 1937, '1937', 3],
            ['Autant en emporte le vent', 1939, '1939', 3.5],
            ['Psychose', 1960, '1960', 3.5],
            ['Le Parrain', 1972, '1972', 3],
            ['Les Dents de la mer', 1975, '1975', 3],
            ['Star Wars (premier film)', 1977, '1977', 2.5],
            ['E.T. l’extra-terrestre', 1982, '1982', 2.5],
            ['Retour vers le futur', 1985, '1985', 2.5],
            ['Jurassic Park', 1993, '1993', 2.5],
            ['Le Roi Lion', 1994, '1994', 2.5],
            ['Titanic', 1997, '1997', 2],
            ['Matrix', 1999, '1999', 2.5],
            ['Gladiator', 2000, '2000', 3],
            ['Avatar', 2009, '2009', 2],
            ['Intouchables', 2011, '2011', 2.5],
            ['Interstellar', 2014, '2014', 2],
            ['Parasite', 2019, '2019', 3],
            ['Barbie', 2023, '2023', 1.5]
        ]
    },
    {
        id: 'albums', theme: 'Musique', title: 'Albums',
        prompt: 'Du plus ancien au plus récent', ends: ['Plus ancien', 'Plus récent'],
        items: [
            ['Sgt. Pepper’s (The Beatles)', 1967, '1967', 3.5],
            ['Abbey Road (The Beatles)', 1969, '1969', 3.5],
            ['The Dark Side of the Moon (Pink Floyd)', 1973, '1973', 3.5],
            ['Back in Black (AC/DC)', 1980, '1980', 3.5],
            ['Thriller (Michael Jackson)', 1982, '1982', 2.5],
            ['Purple Rain (Prince)', 1984, '1984', 3.5],
            ['Nevermind (Nirvana)', 1991, '1991', 3],
            ['OK Computer (Radiohead)', 1997, '1997', 4],
            ['Discovery (Daft Punk)', 2001, '2001', 4],
            ['21 (Adele)', 2011, '2011', 3],
            ['Racine carrée (Stromae)', 2013, '2013', 2.5]
        ]
    },
    {
        id: 'livres', theme: 'Littérature', title: 'Livres',
        prompt: 'Du plus ancien au plus récent', ends: ['Plus ancien', 'Plus récent'],
        items: [
            ['L’Odyssée (Homère)', -700, 'vers 700 av. J.-C.', 2],
            ['La Divine Comédie (Dante)', 1320, 'vers 1320', 3.5],
            ['Don Quichotte (Cervantès)', 1605, '1605', 3.5],
            ['Candide (Voltaire)', 1759, '1759', 3.5],
            ['Le Rouge et le Noir (Stendhal)', 1830, '1830', 4],
            ['Les Trois Mousquetaires (Dumas)', 1844, '1844', 3.5],
            ['Madame Bovary (Flaubert)', 1857, '1857', 3.5],
            ['Les Misérables (Hugo)', 1862, '1862', 3],
            ['Vingt Mille Lieues sous les mers (Verne)', 1870, '1870', 3.5],
            ['Germinal (Zola)', 1885, '1885', 3.5],
            ['L’Étranger (Camus)', 1942, '1942', 3],
            ['Le Petit Prince (Saint-Exupéry)', 1943, '1943', 2.5],
            ['1984 (Orwell)', 1949, '1949', 2.5],
            ['Harry Potter à l’école des sorciers', 1997, '1997', 1.5]
        ]
    },
    {
        id: 'mouvements', theme: 'Arts', title: 'Mouvements artistiques',
        prompt: 'Du plus ancien au plus récent', ends: ['Plus ancien', 'Plus récent'],
        items: [
            ['Renaissance', 1400, 'XVe siècle', 1.5],
            ['Baroque', 1600, 'XVIIe siècle', 2.5],
            ['Romantisme', 1800, 'début du XIXe siècle', 3],
            ['Réalisme', 1850, 'milieu du XIXe siècle', 3.5],
            ['Impressionnisme', 1872, 'années 1870', 2.5],
            ['Fauvisme', 1905, '1905', 4],
            ['Cubisme', 1907, '1907', 3.5],
            ['Surréalisme', 1924, '1924', 3],
            ['Pop Art', 1955, 'années 1950-1960', 2.5],
            ['Street art', 1975, 'années 1970', 2.5]
        ]
    },
    {
        id: 'jo', theme: 'Sport', title: 'Jeux olympiques d’été',
        prompt: 'Du plus ancien au plus récent', ends: ['Plus ancien', 'Plus récent'],
        items: [
            ['Berlin', 1936, '1936', 3.5],
            ['Mexico', 1968, '1968', 4],
            ['Munich', 1972, '1972', 4],
            ['Moscou', 1980, '1980', 4],
            ['Los Angeles', 1984, '1984', 4],
            ['Séoul', 1988, '1988', 4],
            ['Barcelone', 1992, '1992', 3],
            ['Atlanta', 1996, '1996', 3.5],
            ['Sydney', 2000, '2000', 3],
            ['Athènes', 2004, '2004', 3],
            ['Pékin', 2008, '2008', 2.5],
            ['Londres', 2012, '2012', 2],
            ['Rio de Janeiro', 2016, '2016', 2],
            ['Tokyo', 2021, '2021 (prévus en 2020)', 2],
            ['Paris', 2024, '2024', 1]
        ]
    }
];
