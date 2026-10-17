'use strict';

/* ============================================================
   KULTIVO — anecdotes des petits décors du parcours
   ============================================================
   Chaque icône du parcours représente un thème. Un tap affiche une
   anecdote : chaque icône a la sienne (dans l'ordre de la liste).
   Pour en ajouter : une phrase de plus dans le thème voulu.
   ============================================================ */

const THEME_FACTS = {
    'Histoire': [
        'La guerre de Cent Ans a en réalité duré 116 ans, de 1337 à 1453.',
        'Napoléon n’était pas petit : environ 1,69 m, la taille moyenne de son époque.',
        'Cléopâtre a vécu plus près de nous que de la construction de la pyramide de Khéops.',
        'Les Vikings ne portaient pas de casques à cornes : c’est une invention du XIXe siècle.',
        'La guerre la plus courte de l’histoire, entre le Royaume-Uni et Zanzibar en 1896, a duré moins d’une heure.',
        'Louis XIV a régné 72 ans : le plus long règne de l’histoire de France.',
        'Jeanne d’Arc avait environ 19 ans lorsqu’elle est morte, en 1431.',
        'Selon les archéologues, les pyramides d’Égypte ont été bâties par des ouvriers payés, pas par des esclaves.',
        'Le Titanic a coulé lors de son tout premier voyage, en avril 1912.',
        'Selon la légende, le royaume d’Angleterre tomberait si les corbeaux quittaient la tour de Londres.'
    ],
    'Sciences': [
        'La lumière du Soleil met environ 8 minutes à nous parvenir.',
        'Les pieuvres ont trois cœurs et du sang bleu.',
        'Une cuillère à café d’étoile à neutrons pèserait près d’un milliard de tonnes.',
        'Le cœur humain bat environ 100 000 fois par jour.',
        'Le squelette d’un adulte compte 206 os.',
        'Un éclair est environ cinq fois plus chaud que la surface du Soleil.',
        'Les bananes sont très légèrement radioactives, à cause du potassium qu’elles contiennent.',
        'Sur Vénus, une journée dure plus longtemps qu’une année.',
        'Les requins existaient déjà avant les arbres.',
        'L’eau chaude peut parfois geler plus vite que l’eau froide : on appelle ça l’effet Mpemba.'
    ],
    'Géographie': [
        'La Russie s’étend sur 11 fuseaux horaires.',
        'Le lac Baïkal contient environ 20 % de l’eau douce liquide de surface de la planète.',
        'C’est le Canada qui possède le plus long littoral du monde.',
        'Grâce à l’outre-mer, la France est le pays qui compte le plus de fuseaux horaires.',
        'L’Australie est plus large que la Lune.',
        'Le Vatican est le plus petit pays du monde : 0,44 km².',
        'Le Sahara est presque aussi grand que les États-Unis.',
        'Le point le plus éloigné du centre de la Terre n’est pas l’Everest, mais le sommet du Chimborazo, en Équateur.',
        'La mer Morte est si salée qu’on y flotte sans aucun effort.',
        'Le Canada compte à lui seul plus de la moitié des lacs du monde.'
    ],
    'Technologie': [
        'Le premier message envoyé sur ARPANET, en 1969, devait être « LOGIN »… le système a planté après « LO ».',
        'Le premier « bug » informatique était un vrai papillon de nuit coincé dans un ordinateur, en 1947.',
        'Le tout premier SMS, envoyé en 1992, disait simplement « Merry Christmas ».',
        'Le premier site web, créé en 1991 par Tim Berners-Lee, est toujours consultable.',
        'Le premier disque dur d’IBM, en 1956, pesait près d’une tonne et stockait moins de 5 Mo.',
        'Le mot « robot » a été inventé en 1920 dans une pièce de théâtre de l’écrivain tchèque Karel Čapek.',
        'Un smartphone actuel est des millions de fois plus puissant que l’ordinateur de bord d’Apollo 11.',
        'Le logo d’Apple, la pomme croquée, date de 1977.',
        'Le clavier QWERTY a été conçu au XIXe siècle pour les machines à écrire.',
        'Le nom « Google » vient de « gogol », le nombre 10 puissance 100.'
    ],
    'Musique': [
        'Beethoven a composé sa Neuvième Symphonie alors qu’il était presque totalement sourd.',
        'La Marseillaise a été composée à Strasbourg, en 1792, par Rouget de Lisle.',
        'Mozart a composé ses premières œuvres à 5 ans.',
        'Un piano classique compte 88 touches.',
        'Le Boléro de Ravel répète la même mélodie pendant environ 15 minutes, en un seul grand crescendo.',
        'Freddie Mercury, le chanteur de Queen, s’appelait en réalité Farrokh Bulsara.',
        'Les Beatles ont donné leur dernier concert sur le toit de leur maison de disques, à Londres, en 1969.',
        'Vivaldi était prêtre : on le surnommait « le prêtre roux ».',
        'Edith Piaf mesurait 1,47 m : d’où son surnom de « môme Piaf ».',
        'Le bâton du chef d’orchestre ne s’est vraiment répandu qu’au XIXe siècle.'
    ],
    'Littérature': [
        'Pour connaître les ventes des Misérables, Victor Hugo aurait écrit à son éditeur un simple « ? ». Réponse : « ! ».',
        'Le Petit Prince est traduit dans plus de 500 langues et dialectes.',
        'Georges Perec a écrit tout un roman, « La Disparition », sans jamais utiliser la lettre e.',
        'Agatha Christie est l’une des autrices les plus vendues de l’histoire, avec plus de deux milliards de livres.',
        'Le Tour du monde en quatre-vingts jours a d’abord paru en feuilleton dans un journal, en 1872.',
        'Molière est mort en 1673, quelques heures après avoir joué « Le Malade imaginaire » sur scène.',
        'Le premier Harry Potter a été refusé par une douzaine d’éditeurs avant d’être publié.',
        'Le mot « utopie » vient du livre de Thomas More, publié en 1516.',
        'Sherlock Holmes ne dit jamais « Élémentaire, mon cher Watson » dans les romans de Conan Doyle.',
        'Victor Hugo a eu droit à des funérailles nationales suivies par environ deux millions de personnes, en 1885.'
    ],
    'Jeux': [
        'Le Monopoly s’inspire d’un jeu créé par Elizabeth Magie pour dénoncer les excès des propriétaires.',
        'Un Rubik’s Cube peut prendre plus de 43 milliards de milliards de positions différentes.',
        'Au Japon, Pac-Man s’appelait d’abord Puck-Man.',
        'Tetris a été créé en 1984 par un ingénieur soviétique, Alexeï Pajitnov.',
        'Le jeu d’échecs viendrait d’Inde, vers le VIe siècle.',
        'Mario s’appelait d’abord « Jumpman » dans le jeu Donkey Kong, en 1981.',
        'Le Scrabble a été inventé par un architecte américain au chômage, pendant la Grande Dépression.',
        'Minecraft est le jeu vidéo le plus vendu de l’histoire.',
        'Le Cluedo a été inventé en Angleterre pendant la Seconde Guerre mondiale.',
        'Les plus anciens dés connus ont environ 5 000 ans.'
    ],
    'Cinéma': [
        'Dans Psychose, le « sang » de la scène de la douche était du sirop de chocolat.',
        'La première projection payante des frères Lumière a eu lieu en 1895, dans un café parisien.',
        'Avant sa sortie, Blanche-Neige était surnommé « la folie de Disney » : personne n’y croyait.',
        'La voix de Chewbacca, dans Star Wars, mélange notamment des cris d’ours, de morses et de lions.',
        'Le bourdonnement des sabres laser de Star Wars vient d’un vieux projecteur de cinéma.',
        'Titanic est resté le plus gros succès de l’histoire du cinéma pendant 12 ans, jusqu’à Avatar.',
        'Le premier Festival de Cannes s’est tenu en 1946.',
        'Alfred Hitchcock fait une courte apparition dans presque tous ses films.',
        'Le Chanteur de jazz, sorti en 1927, est considéré comme le premier long métrage parlant.',
        'Charlie Chaplin aurait un jour perdu un concours de sosies… de Charlie Chaplin.'
    ],
    'Gastronomie': [
        'Le miel ne se périme presque jamais : on en a retrouvé de comestible dans des tombes égyptiennes.',
        'Le croissant viendrait de Vienne, en Autriche : d’où le nom de « viennoiserie ».',
        'Pour les botanistes, la tomate est un fruit.',
        'La France produit plus de 1 000 variétés de fromages.',
        'Pour les botanistes, la fraise n’est pas une baie… mais la banane, si.',
        'Le savoir-faire de la baguette de pain est inscrit au patrimoine immatériel de l’UNESCO depuis 2022.',
        'Les Aztèques buvaient le chocolat sous forme de boisson amère et épicée.',
        'Au XIXe siècle, le ketchup était vendu comme médicament aux États-Unis.',
        'Le safran est l’épice la plus chère du monde : il faut environ 150 fleurs pour en obtenir 1 g.',
        'Les carottes n’ont pas toujours été orange : elles étaient d’abord violettes ou jaunes.'
    ],
    'Sport': [
        'Le marathon mesure 42,195 km depuis les JO de Londres en 1908.',
        'Les premiers Jeux olympiques modernes ont eu lieu à Athènes, en 1896.',
        'Une balle de golf a entre 300 et 500 alvéoles, qui l’aident à voler plus loin.',
        'Le volley-ball a été inventé aux États-Unis en 1895.',
        'Le Tour de France a été créé en 1903 par le journal L’Auto.',
        'À Wimbledon, en 2010, un match de tennis a duré plus de 11 heures, réparties sur trois jours.',
        'Les cinq anneaux olympiques représentent l’union des continents.',
        'Le basket a été inventé en 1891 par un professeur de sport, James Naismith, avec des paniers à pêches.',
        'Usain Bolt détient le record du monde du 100 m depuis 2009 : 9 secondes et 58 centièmes.',
        'Le football est le sport le plus suivi au monde.'
    ],
    'Arts': [
        'La Joconde n’a ni sourcils ni cils visibles.',
        'Van Gogh n’aurait vendu qu’un seul tableau de son vivant.',
        'La Joconde a été volée au Louvre en 1911, puis retrouvée deux ans plus tard.',
        'La statue de la Liberté était à l’origine couleur cuivre : elle a verdi avec le temps.',
        'Le Louvre est le musée le plus visité du monde.',
        'Michel-Ange a peint le plafond de la chapelle Sixtine en environ quatre ans.',
        'Le Penseur de Rodin devait d’abord représenter Dante devant les portes de l’Enfer.',
        'Le Cri de Munch existe en plusieurs versions, peintes et dessinées.',
        'Monet a peint environ 250 tableaux de nymphéas.',
        'Le nom complet de Picasso compte une vingtaine de prénoms.'
    ],
    'Langue française': [
        '« Anticonstitutionnellement » (25 lettres) est l’un des plus longs mots du dictionnaire.',
        'Le mot « oiseau » contient les cinq voyelles a, e, i, o, u en seulement six lettres.',
        'Le français est langue officielle dans une trentaine de pays.',
        '« Kayak » se lit de la même façon dans les deux sens : c’est un palindrome.',
        'L’Académie française a été fondée en 1635 par le cardinal de Richelieu.',
        'Le mot « chiffre » vient de l’arabe « sifr », qui signifie zéro.',
        'Le mot « pamplemousse » vient du néerlandais.',
        'L’accent circonflexe d’« hôpital » remplace un « s » disparu : on écrivait « hospital ».',
        '« Ressasser » est l’un des plus longs palindromes courants de la langue française.',
        'Selon une légende populaire, « bistro » viendrait du russe « bystro », qui veut dire « vite ».'
    ],
    'Mythologie': [
        'Le mot « panique » vient du dieu Pan, qui semait la terreur chez les voyageurs.',
        'Achille n’était vulnérable qu’au talon : d’où l’expression « talon d’Achille ».',
        'Mardi vient de Mars, mercredi de Mercure, jeudi de Jupiter et vendredi de Vénus.',
        'Le mot « écho » vient d’une nymphe condamnée à répéter les derniers mots des autres.',
        'Dans le mythe grec, la « boîte » de Pandore était en réalité une jarre.',
        'Le mot « narcissique » vient de Narcisse, tombé amoureux de son propre reflet.',
        'Le marteau du dieu Thor s’appelle Mjöllnir.',
        'Le mot « atlas » vient du titan Atlas, condamné à porter le ciel sur ses épaules.',
        'Le mot « céréale » vient de Cérès, la déesse romaine des moissons.',
        'Le mot « hypnose » vient d’Hypnos, le dieu grec du sommeil.'
    ],
    'Drapeaux': [
        'Le drapeau du Népal est le seul drapeau national qui ne soit pas rectangulaire.',
        'Le drapeau du Danemark serait le plus ancien drapeau national encore utilisé.',
        'Les drapeaux de l’Indonésie et de Monaco sont presque identiques.',
        'Le drapeau du Mozambique est le seul à représenter une arme moderne : une kalachnikov.',
        'Le drapeau de la Suisse est carré.',
        'Le drapeau du Paraguay a un recto et un verso différents.',
        'Le drapeau du Bhoutan représente un dragon.',
        'Le drapeau du Brésil montre le ciel étoilé de Rio le 15 novembre 1889.',
        'Les 50 étoiles du drapeau américain représentent les 50 États.',
        'Le drapeau du Canada, avec sa feuille d’érable, n’a été adopté qu’en 1965.'
    ],
    'Monuments': [
        'La tour Eiffel grandit d’une quinzaine de centimètres en été, à cause de la dilatation du métal.',
        'La Grande Muraille de Chine n’est pas visible à l’œil nu depuis l’espace, contrairement à la légende.',
        'La tour Eiffel ne devait rester debout que 20 ans.',
        'La statue de la Liberté a été construite en France, puis expédiée en pièces détachées à New York.',
        'Le Taj Mahal semble changer de couleur selon l’heure de la journée.',
        'Le Colisée pouvait être couvert d’une immense toile pour protéger les spectateurs du soleil.',
        'La tour de Pise penchait déjà pendant sa construction.',
        'La Sagrada Família est en chantier depuis 1882 : sa plus haute tour n’a été terminée qu’en 2026, et les travaux continuent.',
        'Le Machu Picchu n’a été révélé au grand public qu’en 1911.',
        'La pyramide de Khéops a été le plus haut monument construit par l’homme pendant près de 4 000 ans.'
    ]
};
