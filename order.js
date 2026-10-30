'use strict';

/* ============================================================
   KULTIVO — les familles « Remets dans l'ordre » (niveaux Ordre)
   ============================================================
   Les niveaux 6, 16, 26… 116 sont des niveaux Ordre : 3 frises à la suite.
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
        id: 'vitesses', theme: 'Sciences', title: 'Vitesses',
        prompt: 'Du plus lent au plus rapide', ends: ['Plus lent', 'Plus rapide'],
        items: [
            ['Escargot', 0.05, 'environ 0,05 km/h', 1.5],
            ['Tortue terrestre', 0.3, 'environ 0,3 km/h', 2],
            ['Humain qui marche', 5, 'environ 5 km/h', 1.5],
            ['Usain Bolt (en pointe)', 44, 'environ 44 km/h', 3],
            ['Cheval au galop', 65, 'environ 65 km/h', 3],
            ['Guépard', 110, 'environ 110 km/h', 2],
            ['TGV (en service commercial)', 320, '320 km/h', 2.5],
            ['Formule 1 (vitesse de pointe)', 360, 'environ 360 km/h', 3.5],
            ['Faucon pèlerin en piqué', 390, 'environ 390 km/h', 4],
            ['Bugatti Chiron', 420, '420 km/h (bridée)', 4],
            ['Avion de ligne (en croisière)', 900, 'environ 900 km/h', 2.5],
            ['Son (dans l’air)', 1235, 'environ 1 235 km/h', 3],
            ['Avion de chasse Rafale', 1900, 'environ 1 900 km/h', 3.5],
            ['Station spatiale internationale', 27600, 'environ 27 600 km/h', 4],
            ['Lumière', 1080000000, 'environ 1 milliard de km/h (300 000 km/s)', 1.5]
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
    },
    // ---------- Nouvelles familles du 2026-10-30 (choisies par l'utilisateur : un thème sans frise = une famille) ----------
    {
        id: 'sagas', theme: 'Cinéma', title: 'Sagas : le premier film',
        prompt: 'Du plus ancien au plus récent', ends: ['Plus ancien', 'Plus récent'],
        items: [
            ['James Bond (James Bond 007 contre Dr No)', 1962, '1962', 4],
            ['La Planète des singes', 1968, '1968', 4],
            ['Rocky', 1976, '1976', 3],
            ['Les Bronzés', 1978, '1978', 3.5],
            ['Alien', 1979, '1979', 3.5],
            ['Indiana Jones (Les Aventuriers de l’arche perdue)', 1981, '1981', 3],
            ['Terminator', 1984, '1984', 3],
            ['Die Hard (Piège de cristal)', 1988, '1988', 3.5],
            ['Toy Story', 1995, '1995', 2.5],
            ['Mission impossible', 1996, '1996', 3],
            ['Taxi', 1998, '1998', 3],
            ['Astérix et Obélix contre César', 1999, '1999', 3],
            ['Harry Potter à l’école des sorciers', 2001, '2001', 1.5],
            ['Spider-Man (avec Tobey Maguire)', 2002, '2002', 2.5],
            ['Pirates des Caraïbes', 2003, '2003', 2.5],
            ['Iron Man (1er film Marvel)', 2008, '2008', 2.5],
            ['Moi, moche et méchant', 2010, '2010', 2],
            ['Hunger Games', 2012, '2012', 3],
            ['La Reine des neiges', 2013, '2013', 1.5]
        ]
    },
    {
        id: 'reseaux', theme: 'Technologie', title: 'Réseaux sociaux et messageries',
        prompt: 'Du plus ancien au plus récent', ends: ['Plus ancien', 'Plus récent'],
        items: [
            ['MSN Messenger', 1999, '1999', 3],
            ['MySpace', 2003, '2003', 3.5],
            ['Facebook', 2004, '2004', 1.5],
            ['YouTube', 2005, '2005', 2],
            ['Twitter (X)', 2006, '2006', 2.5],
            ['Tumblr', 2007, '2007', 4],
            ['WhatsApp', 2009, '2009', 2.5],
            ['Instagram', 2010, '2010', 2.5],
            ['Snapchat', 2011, '2011', 2.5],
            ['Telegram', 2013, '2013', 3.5],
            ['Discord', 2015, '2015', 3],
            ['TikTok', 2016, '2016 (Douyin en Chine ; TikTok dans le monde en 2017)', 1.5],
            ['Threads', 2023, '2023', 2]
        ]
    },
    {
        id: 'hauteurs', theme: 'Monuments', title: 'Hauteur des monuments',
        prompt: 'Du plus petit au plus grand', ends: ['Plus petit', 'Plus grand'],
        items: [
            ['Manneken-Pis (Bruxelles)', 0.55, '55 cm', 2.5],
            ['Stonehenge', 7, 'environ 7 m', 3],
            ['Sphinx de Gizeh', 20, '20 m', 3],
            ['Christ Rédempteur (Rio)', 38, '38 m avec son socle', 3],
            ['Arc de Triomphe', 50, '50 m', 3],
            ['Tour de Pise', 56, '56 m', 3],
            ['Taj Mahal', 73, '73 m', 3.5],
            ['Statue de la Liberté', 93, '93 m avec son socle', 2.5],
            ['Big Ben', 96, '96 m', 4],
            ['Grande pyramide de Khéops', 138, '138 m (146 m à l’origine)', 2.5],
            ['Tour Montparnasse', 210, '210 m', 3],
            ['Tour Eiffel', 330, '330 m', 1.5],
            ['Empire State Building', 381, '381 m (443 m avec l’antenne)', 3],
            ['Tours Petronas (Kuala Lumpur)', 452, '452 m', 3.5],
            ['One World Trade Center (New York)', 541, '541 m', 3.5],
            ['Tokyo Skytree', 634, '634 m', 4],
            ['Burj Khalifa (Dubaï)', 828, '828 m', 1.5]
        ]
    },
    {
        id: 'calories', theme: 'Gastronomie', title: 'Calories',
        prompt: 'Du moins au plus calorique (pour 100 g)', ends: ['Moins calorique', 'Plus calorique'],
        items: [
            ['Concombre', 15, 'environ 15 kcal', 2],
            ['Fraise', 32, 'environ 32 kcal', 3],
            ['Coca-Cola (100 ml)', 42, 'environ 42 kcal', 3.5],
            ['Pomme', 52, 'environ 52 kcal', 2.5],
            ['Banane', 89, 'environ 89 kcal', 3],
            ['Riz cuit', 130, 'environ 130 kcal', 3.5],
            ['Œuf', 145, 'environ 145 kcal', 3.5],
            ['Saumon', 205, 'environ 205 kcal', 4],
            ['Pain blanc', 265, 'environ 265 kcal', 3],
            ['Frites', 310, 'environ 310 kcal', 3],
            ['Sucre', 400, 'environ 400 kcal', 3],
            ['Chocolat noir', 550, 'environ 550 kcal', 2.5],
            ['Beurre', 720, 'environ 720 kcal', 2.5],
            ['Huile', 900, 'environ 900 kcal', 1.5]
        ]
    },
    {
        // Cartes = DRAPEAUX en image (le pays n'est écrit qu'après « Vérifier ») ; valeur = − latitude de la capitale
        id: 'drapeaux-nord-sud', theme: 'Drapeaux', title: 'Drapeaux',
        prompt: 'Du plus au nord au plus au sud (d’après la capitale)', ends: ['Plus au nord', 'Plus au sud'],
        items: [
            ['🇮🇸', -64.1, 'Islande · Reykjavik, 64° N', 3.5],
            ['🇫🇮', -60.2, 'Finlande · Helsinki, 60° N', 3.5],
            ['🇩🇰', -55.7, 'Danemark · Copenhague, 56° N', 3],
            ['🇩🇪', -52.5, 'Allemagne · Berlin, 52° N', 1.5],
            ['🇬🇧', -51.5, 'Royaume-Uni · Londres, 51° N', 1.5],
            ['🇫🇷', -48.9, 'France · Paris, 49° N', 1],
            ['🇨🇭', -46.9, 'Suisse · Berne, 47° N', 2],
            ['🇨🇦', -45.4, 'Canada · Ottawa, 45° N', 1.5],
            ['🇮🇹', -41.9, 'Italie · Rome, 42° N', 1.5],
            ['🇪🇸', -40.4, 'Espagne · Madrid, 40° N', 2],
            ['🇨🇳', -39.9, 'Chine · Pékin, 40° N', 2.5],
            ['🇺🇸', -38.9, 'États-Unis · Washington, 39° N', 2.5],
            ['🇬🇷', -38.0, 'Grèce · Athènes, 38° N', 3],
            ['🇯🇵', -35.7, 'Japon · Tokyo, 36° N', 1.5],
            ['🇲🇦', -34.0, 'Maroc · Rabat, 34° N', 3],
            ['🇪🇬', -30.0, 'Égypte · Le Caire, 30° N', 3],
            ['🇮🇳', -28.6, 'Inde · New Delhi, 29° N', 2.5],
            ['🇲🇽', -19.4, 'Mexique · Mexico, 19° N', 2.5],
            ['🇸🇳', -14.7, 'Sénégal · Dakar, 15° N', 4],
            ['🇹🇭', -13.8, 'Thaïlande · Bangkok, 14° N', 4],
            ['🇨🇴', -4.7, 'Colombie · Bogota, 5° N', 3.5],
            ['🇰🇪', 1.3, 'Kenya · Nairobi, 1° S', 3.5],
            ['🇵🇪', 12.0, 'Pérou · Lima, 12° S', 3.5],
            ['🇧🇷', 15.8, 'Brésil · Brasilia, 16° S', 1.5],
            ['🇿🇦', 25.7, 'Afrique du Sud · Pretoria, 26° S', 2.5],
            ['🇦🇷', 34.6, 'Argentine · Buenos Aires, 35° S', 2.5],
            ['🇦🇺', 35.3, 'Australie · Canberra, 35° S', 2],
            ['🇳🇿', 41.3, 'Nouvelle-Zélande · Wellington, 41° S', 3.5]
        ]
    },
    {
        id: 'noces', theme: 'Langue française', title: 'Anniversaires de mariage',
        prompt: 'Du plus court au plus long mariage', ends: ['Moins d’années', 'Plus d’années'],
        items: [
            ['Noces de coton', 1, '1 an', 2.5],
            ['Noces de cuir', 2, '2 ans', 4],
            ['Noces de bois', 5, '5 ans', 3.5],
            ['Noces de laine', 7, '7 ans', 4.5],
            ['Noces d’étain', 10, '10 ans', 4],
            ['Noces de cristal', 15, '15 ans', 3.5],
            ['Noces de porcelaine', 20, '20 ans', 3.5],
            ['Noces d’argent', 25, '25 ans', 2],
            ['Noces de perle', 30, '30 ans', 3],
            ['Noces de rubis', 35, '35 ans', 3.5],
            ['Noces d’émeraude', 40, '40 ans', 4],
            ['Noces de vermeil', 45, '45 ans', 4.5],
            ['Noces d’or', 50, '50 ans', 1.5],
            ['Noces de diamant', 60, '60 ans', 2],
            ['Noces de platine', 70, '70 ans', 3.5]
        ]
    },
    {
        id: 'mythes-ecran', theme: 'Mythologie', title: 'Mythes au cinéma et dans les jeux',
        prompt: 'Du plus ancien au plus récent', ends: ['Plus ancien', 'Plus récent'],
        items: [
            ['Jason et les Argonautes (film)', 1963, '1963 · la quête de la Toison d’or', 4.5],
            ['Ulysse 31 (dessin animé)', 1981, '1981 · l’Odyssée dans l’espace', 3.5],
            ['Les Chevaliers du Zodiaque (dessin animé)', 1986, '1986 · ils protègent Athéna', 3.5],
            ['Hercule (Disney)', 1997, '1997 · Héraclès, fils de Zeus', 2],
            ['Age of Mythology (jeu vidéo)', 2002, '2002 · dieux grecs, égyptiens et nordiques', 4],
            ['Troie (film)', 2004, '2004 · la guerre de Troie, avec Achille', 2.5],
            ['God of War (jeu vidéo)', 2005, '2005 · Kratos contre les dieux grecs', 3],
            ['Percy Jackson : Le Voleur de foudre (film)', 2010, '2010 · le fils de Poséidon', 2.5],
            ['Thor (Marvel)', 2011, '2011 · le dieu nordique du tonnerre', 2],
            ['Vaiana (Disney)', 2016, '2016 · le demi-dieu polynésien Maui', 2],
            ['Wonder Woman (film)', 2017, '2017 · une princesse amazone', 2.5],
            ['Assassin’s Creed Odyssey (jeu vidéo)', 2018, '2018 · la Grèce antique', 3],
            ['Hadès (jeu vidéo)', 2020, '2020 · le fils d’Hadès s’enfuit des Enfers', 3.5],
            ['Percy Jackson et les Olympiens (série)', 2023, '2023 · nouvelle adaptation sur Disney+', 3],
            ['Kaos (série Netflix)', 2024, '2024 · Zeus joué par Jeff Goldblum', 3.5],
            ['L’Odyssée (Christopher Nolan)', 2026, '2026 · le retour d’Ulysse à Ithaque', 1.5]
        ]
    }
];
