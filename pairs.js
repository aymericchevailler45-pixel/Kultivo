'use strict';

/* ============================================================
   KULTIVO — les familles de paires (niveaux « Paires »)
   ============================================================
   Les niveaux 3, 13, 23… 113 sont des niveaux Paires : 3 grilles de
   5 paires à associer (gauche ↔ droite), tirées de familles différentes.

   Chaque famille : id, theme, title (titre affiché), left / right (ce que
   contiennent les colonnes) et pairs : [gauche, droite, d].
   d = difficulté de 1 (très facile) à 5 (très pointu) : le jeu choisit
   des paires proches de la difficulté du niveau.

   Une même valeur peut apparaître deux fois dans une famille (deux films
   du même réalisateur…) : le jeu ne les met jamais dans la même grille.

   POUR AJOUTER UNE PAIRE : ajoute une ligne ["…", "…", d] dans une famille.
   Garde des textes courts, ils doivent tenir sur un écran de téléphone.
   ============================================================ */

const PAIR_FAMILIES = [
    {
        id: 'capitales', theme: 'Géographie', title: 'Capitales', left: 'Pays', right: 'Capitale',
        pairs: [
            ['France', 'Paris', 1], ['Italie', 'Rome', 1], ['Royaume-Uni', 'Londres', 1],
            ['Japon', 'Tokyo', 1.2], ['Espagne', 'Madrid', 1.2], ['Allemagne', 'Berlin', 1.2],
            ['Russie', 'Moscou', 1.3], ['Grèce', 'Athènes', 1.5], ['Égypte', 'Le Caire', 1.8],
            ['Portugal', 'Lisbonne', 2], ['Suède', 'Stockholm', 2.2], ['Argentine', 'Buenos Aires', 2.2],
            ['Pologne', 'Varsovie', 2.5], ['Hongrie', 'Budapest', 2.8], ['Canada', 'Ottawa', 3],
            ['Australie', 'Canberra', 3], ['Turquie', 'Ankara', 3], ['Brésil', 'Brasilia', 3],
            ['Pérou', 'Lima', 3], ['Maroc', 'Rabat', 3.2], ['Suisse', 'Berne', 3.2],
            ['Kenya', 'Nairobi', 3.2], ['Vietnam', 'Hanoï', 3.2], ['Nouvelle-Zélande', 'Wellington', 3.8],
            ['Kazakhstan', 'Astana', 4.3], ['Nigeria', 'Abuja', 4.3], ['Mongolie', 'Oulan-Bator', 4.3],
            ['Côte d’Ivoire', 'Yamoussoukro', 4.5], ['Tanzanie', 'Dodoma', 4.8], ['Bhoutan', 'Thimphou', 5],
            ['Birmanie', 'Naypyidaw', 5]
        ]
    },
    {
        id: 'monuments', theme: 'Géographie', title: 'Monuments du monde', left: 'Monument', right: 'Ville',
        pairs: [
            ['Tour Eiffel', 'Paris', 1], ['Big Ben', 'Londres', 1.2], ['Statue de la Liberté', 'New York', 1.2],
            ['Colisée', 'Rome', 1.3], ['Sagrada Família', 'Barcelone', 2], ['Parthénon', 'Athènes', 2],
            ['Christ Rédempteur', 'Rio de Janeiro', 2], ['Kremlin', 'Moscou', 2], ['Burj Khalifa', 'Dubaï', 2.3],
            ['Golden Gate Bridge', 'San Francisco', 2.3], ['Cité interdite', 'Pékin', 2.5],
            ['Porte de Brandebourg', 'Berlin', 2.5], ['Sainte-Sophie', 'Istanbul', 3], ['Atomium', 'Bruxelles', 3.2],
            ['Basilique Saint-Marc', 'Venise', 3.5], ['Taj Mahal', 'Agra', 3.8], ['Alhambra', 'Grenade', 3.8],
            ['Pont Charles', 'Prague', 4], ['Cathédrale Santa Maria del Fiore', 'Florence', 4],
            ['Tour de Belém', 'Lisbonne', 4.3], ['Palais du Potala', 'Lhassa', 4.8]
        ]
    },
    {
        id: 'dates', theme: 'Histoire', title: 'Dates clés', left: 'Événement', right: 'Année',
        pairs: [
            ['Révolution française', '1789', 1.2], ['Attentats du 11 Septembre', '2001', 1.2],
            ['Début de la Première Guerre mondiale', '1914', 1.5], ['Fin de la Seconde Guerre mondiale', '1945', 1.5],
            ['Découverte de l’Amérique', '1492', 1.8], ['Premier pas sur la Lune', '1969', 1.8],
            ['Chute du mur de Berlin', '1989', 2], ['Bataille de Marignan', '1515', 2.8],
            ['Krach de Wall Street', '1929', 2.8], ['Indépendance des États-Unis', '1776', 3],
            ['Bataille de Waterloo', '1815', 3], ['Sacre de Napoléon', '1804', 3.5],
            ['Prise de Constantinople', '1453', 3.5], ['Bataille d’Hastings', '1066', 3.8],
            ['Abolition de l’esclavage en France', '1848', 3.8], ['Couronnement de Charlemagne', '800', 4],
            ['Bataille de Poitiers (Charles Martel)', '732', 4], ['Édit de Nantes', '1598', 4.3],
            ['Chute de l’Empire romain d’Occident', '476', 4.3], ['Traité de Verdun', '843', 5]
        ]
    },
    {
        id: 'livres', theme: 'Littérature', title: 'Livres et auteurs', left: 'Livre', right: 'Auteur',
        pairs: [
            ['Harry Potter', 'J. K. Rowling', 1], ['Les Misérables', 'Victor Hugo', 1.2],
            ['Roméo et Juliette', 'Shakespeare', 1.2], ['Le Petit Prince', 'Saint-Exupéry', 1.3],
            ['Vingt Mille Lieues sous les mers', 'Jules Verne', 1.5], ['Les Trois Mousquetaires', 'Alexandre Dumas', 1.8],
            ['Madame Bovary', 'Flaubert', 2.2], ['1984', 'George Orwell', 2.3], ['L’Étranger', 'Albert Camus', 2.5],
            ['Les Fleurs du mal', 'Baudelaire', 2.5], ['Germinal', 'Émile Zola', 2.5], ['Candide', 'Voltaire', 2.8],
            ['Bel-Ami', 'Maupassant', 2.8], ['Don Quichotte', 'Cervantès', 3], ['La Divine Comédie', 'Dante', 3],
            ['La Comédie humaine', 'Balzac', 3.2], ['Le Rouge et le Noir', 'Stendhal', 3.3],
            ['Crime et Châtiment', 'Dostoïevski', 3.5], ['Guerre et Paix', 'Tolstoï', 3.5],
            ['Voyage au bout de la nuit', 'Céline', 4], ['Les Liaisons dangereuses', 'Laclos', 4.3],
            ['Cent ans de solitude', 'García Márquez', 4.3], ['Ulysse', 'James Joyce', 4.5],
            ['Le Maître et Marguerite', 'Boulgakov', 5]
        ]
    },
    {
        id: 'tableaux', theme: 'Arts', title: 'Tableaux célèbres', left: 'Tableau', right: 'Peintre',
        pairs: [
            ['La Joconde', 'Léonard de Vinci', 1], ['La Nuit étoilée', 'Van Gogh', 1.5], ['Guernica', 'Picasso', 2],
            ['Les Nymphéas', 'Monet', 2.2], ['Le Cri', 'Munch', 2.3], ['La Persistance de la mémoire', 'Dalí', 2.8],
            ['La Jeune Fille à la perle', 'Vermeer', 3], ['Le Baiser', 'Klimt', 3.2],
            ['La Liberté guidant le peuple', 'Delacroix', 3.2], ['La Naissance de Vénus', 'Botticelli', 3.3],
            ['Le Déjeuner sur l’herbe', 'Manet', 3.5], ['Les Ménines', 'Velázquez', 3.8],
            ['La Ronde de nuit', 'Rembrandt', 3.8], ['Le Fils de l’homme', 'Magritte', 3.8],
            ['Le Radeau de La Méduse', 'Géricault', 4], ['Le Sacre de Napoléon', 'David', 4],
            ['Le Jardin des délices', 'Bosch', 4.2], ['Les Joueurs de cartes', 'Cézanne', 4.2],
            ['Les Glaneuses', 'Millet', 4.3], ['Tres de Mayo', 'Goya', 4.5]
        ]
    },
    {
        id: 'films', theme: 'Cinéma', title: 'Films et réalisateurs', left: 'Film', right: 'Réalisateur',
        pairs: [
            ['Titanic', 'James Cameron', 1.5], ['Les Dents de la mer', 'Spielberg', 2], ['Pulp Fiction', 'Tarantino', 2],
            ['Inception', 'Christopher Nolan', 2], ['Psychose', 'Hitchcock', 2.3], ['Le Parrain', 'Coppola', 2.5],
            ['Shining', 'Kubrick', 2.5], ['Le Seigneur des anneaux', 'Peter Jackson', 2.5],
            ['Le Cinquième Élément', 'Luc Besson', 2.5], ['Alien', 'Ridley Scott', 2.8],
            ['Le Voyage de Chihiro', 'Miyazaki', 2.8], ['Taxi Driver', 'Scorsese', 3], ['Amélie Poulain', 'Jeunet', 3.5],
            ['Citizen Kane', 'Orson Welles', 3.8], ['Parasite', 'Bong Joon-ho', 3.8],
            ['Les Quatre Cents Coups', 'Truffaut', 4], ['Les Sept Samouraïs', 'Kurosawa', 4.3],
            ['À bout de souffle', 'Godard', 4.3], ['Metropolis', 'Fritz Lang', 4.5], ['La Grande Illusion', 'Jean Renoir', 4.8]
        ]
    },
    {
        id: 'chansons', theme: 'Musique', title: 'Chansons et artistes', left: 'Chanson / album', right: 'Artiste',
        pairs: [
            ['Thriller', 'Michael Jackson', 1.3], ['Bohemian Rhapsody', 'Queen', 1.5], ['Alors on danse', 'Stromae', 1.5],
            ['La Vie en rose', 'Édith Piaf', 1.8], ['Imagine', 'John Lennon', 2], ['Hey Jude', 'The Beatles', 2],
            ['Get Lucky', 'Daft Punk', 2], ['Smells Like Teen Spirit', 'Nirvana', 2.3], ['Ne me quitte pas', 'Jacques Brel', 2.5],
            ['Rolling in the Deep', 'Adele', 2.5], ['Purple Rain', 'Prince', 3], ['Les Champs-Élysées', 'Joe Dassin', 3],
            ['La Bohème', 'Charles Aznavour', 3.3], ['Hotel California', 'Eagles', 3.3],
            ['Stairway to Heaven', 'Led Zeppelin', 3.3], ['L’Aigle noir', 'Barbara', 4],
            ['Le Poinçonneur des Lilas', 'Gainsbourg', 4]
        ]
    },
    {
        id: 'mots', theme: 'Langue française', title: 'Mots venus d’ailleurs', left: 'Mot', right: 'Langue d’origine',
        pairs: [
            ['Week-end', 'Anglais', 1.2], ['Pizza', 'Italien', 1.2], ['Tsunami', 'Japonais', 2], ['Sombrero', 'Espagnol', 2],
            ['Kebab', 'Turc', 2.3], ['Football', 'Anglais', 1.3], ['Spaghetti', 'Italien', 1.3], ['Karaoké', 'Japonais', 2],
            ['Sauna', 'Finnois', 3], ['Patio', 'Espagnol', 3], ['Algèbre', 'Arabe', 3.5], ['Kayak', 'Inuit', 3.5],
            ['Hamster', 'Allemand', 3.5], ['Yoga', 'Sanskrit', 3.5], ['Ski', 'Norvégien', 3.8], ['Safari', 'Swahili', 4],
            ['Robot', 'Tchèque', 4.3], ['Bazar', 'Persan', 4.3], ['Moustique', 'Espagnol', 4.3], ['Kiosque', 'Turc', 4.3],
            ['Mammouth', 'Russe', 4.5], ['Shampooing', 'Hindi', 4.5], ['Chocolat', 'Nahuatl (aztèque)', 4.5]
        ]
    },
    {
        id: 'dieux', theme: 'Mythologie', title: 'Dieux grecs et romains', left: 'Dieu grec', right: 'Nom romain',
        pairs: [
            ['Zeus', 'Jupiter', 2], ['Aphrodite', 'Vénus', 2.2], ['Poséidon', 'Neptune', 2.3], ['Arès', 'Mars', 2.5],
            ['Éros', 'Cupidon', 2.8], ['Hermès', 'Mercure', 3], ['Hadès', 'Pluton', 3], ['Athéna', 'Minerve', 3.3],
            ['Artémis', 'Diane', 3.3], ['Dionysos', 'Bacchus', 3.3], ['Héra', 'Junon', 3.5],
            ['Héphaïstos', 'Vulcain', 3.8], ['Déméter', 'Cérès', 4], ['Cronos', 'Saturne', 4.2],
            ['Hestia', 'Vesta', 4.5], ['Perséphone', 'Proserpine', 4.5]
        ]
    },
    {
        id: 'elements', theme: 'Sciences', title: 'Éléments chimiques', left: 'Élément', right: 'Symbole',
        pairs: [
            ['Oxygène', 'O', 1.2], ['Hydrogène', 'H', 1.3], ['Carbone', 'C', 1.5], ['Hélium', 'He', 2],
            ['Or', 'Au', 2.3], ['Fer', 'Fe', 2.3], ['Calcium', 'Ca', 2.5], ['Azote', 'N', 2.8], ['Chlore', 'Cl', 2.8],
            ['Argent', 'Ag', 3], ['Cuivre', 'Cu', 3], ['Zinc', 'Zn', 3], ['Soufre', 'S', 3.2], ['Sodium', 'Na', 3.3],
            ['Potassium', 'K', 3.8], ['Plomb', 'Pb', 3.8], ['Mercure', 'Hg', 4], ['Étain', 'Sn', 4.5],
            ['Tungstène', 'W', 4.8]
        ]
    },
    {
        id: 'inventions', theme: 'Technologie', title: 'Inventions et inventeurs', left: 'Invention', right: 'Inventeur',
        pairs: [
            ['Ampoule électrique', 'Edison', 2], ['Vaccin contre la rage', 'Pasteur', 2],
            ['Écriture pour aveugles', 'Louis Braille', 2], ['Téléphone', 'Graham Bell', 2.3],
            ['Imprimerie', 'Gutenberg', 2.5], ['Cinématographe', 'Frères Lumière', 2.8], ['Dynamite', 'Alfred Nobel', 3],
            ['Machine à vapeur', 'James Watt', 3.5], ['World Wide Web', 'Tim Berners-Lee', 3.5],
            ['Paratonnerre', 'Benjamin Franklin', 3.8], ['Tableau périodique', 'Mendeleïev', 3.8],
            ['Radio', 'Marconi', 4], ['Pile électrique', 'Volta', 4], ['Photographie', 'Niépce', 4.3],
            ['Vaccin contre la variole', 'Jenner', 4.5], ['Stéthoscope', 'Laennec', 4.8]
        ]
    },
    {
        id: 'plats', theme: 'Gastronomie', title: 'Plats du monde', left: 'Plat', right: 'Pays',
        pairs: [
            ['Sushi', 'Japon', 1], ['Pizza', 'Italie', 1], ['Paella', 'Espagne', 1.2], ['Tacos', 'Mexique', 1.3],
            ['Fish and chips', 'Royaume-Uni', 1.3], ['Kimchi', 'Corée du Sud', 2], ['Poutine', 'Canada', 2],
            ['Pad thaï', 'Thaïlande', 2], ['Tajine', 'Maroc', 2.2], ['Goulasch', 'Hongrie', 2.3], ['Moussaka', 'Grèce', 2.3],
            ['Phở', 'Vietnam', 3], ['Biryani', 'Inde', 3.3], ['Strudel', 'Autriche', 3.3], ['Ceviche', 'Pérou', 3.5],
            ['Haggis', 'Écosse', 3.5], ['Feijoada', 'Brésil', 3.8], ['Pierogi', 'Pologne', 3.8], ['Bortsch', 'Ukraine', 3.8],
            ['Injera', 'Éthiopie', 4.5], ['Smørrebrød', 'Danemark', 4.5], ['Khachapuri', 'Géorgie', 4.8],
            ['Bobotie', 'Afrique du Sud', 4.8]
        ]
    },
    {
        id: 'sportifs', theme: 'Sport', title: 'Champions et sports', left: 'Champion', right: 'Sport',
        pairs: [
            ['Zinédine Zidane', 'Football', 1], ['Rafael Nadal', 'Tennis', 1], ['Usain Bolt', 'Athlétisme', 1.3],
            ['Tiger Woods', 'Golf', 1.3], ['Teddy Riner', 'Judo', 1.5], ['Michael Phelps', 'Natation', 1.5],
            ['Muhammad Ali', 'Boxe', 1.5], ['Tony Parker', 'Basket', 1.8], ['Antoine Dupont', 'Rugby', 1.8],
            ['Simone Biles', 'Gymnastique', 2], ['Alain Prost', 'Formule 1', 2.5], ['Armand Duplantis', 'Saut à la perche', 2.5],
            ['Martin Fourcade', 'Biathlon', 3], ['Nikola Karabatić', 'Handball', 3], ['Sébastien Loeb', 'Rallye', 3],
            ['Eddy Merckx', 'Cyclisme', 3], ['Magnus Carlsen', 'Échecs', 3.5], ['Tony Estanguet', 'Canoë', 4],
            ['Kelly Slater', 'Surf', 4.3]
        ]
    },
    {
        id: 'jeux-pays', theme: 'Jeux', title: 'Jeux et jouets du monde', left: 'Jeu / jouet', right: 'Pays d’origine',
        pairs: [
            ['Pokémon', 'Japon', 1.3], ['Lego', 'Danemark', 2.3], ['Monopoly', 'États-Unis', 2.5], ['Tetris', 'URSS', 2.5],
            ['Playmobil', 'Allemagne', 2.8], ['Tamagotchi', 'Japon', 2.5], ['Échecs', 'Inde', 3.5], ['Jeu de go', 'Chine', 3.5],
            ['Minecraft', 'Suède', 3.5], ['Rubik’s Cube', 'Hongrie', 3.5], ['Catan', 'Allemagne', 3.5],
            ['Angry Birds', 'Finlande', 3.8], ['The Witcher', 'Pologne', 3.8], ['Trivial Pursuit', 'Canada', 4],
            ['Dixit', 'France', 4], ['Mahjong', 'Chine', 4], ['Jenga', 'Royaume-Uni', 4.5]
        ]
    }
];
