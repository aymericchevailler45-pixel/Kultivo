'use strict';

/* ============================================================
   KULTIVO — questions de l'événement Halloween (ids 30000+, séparées du parcours et de l'entraînement)
   Réutilisables chaque année : ajouter quelques questions nouvelles pour l'édition suivante.
   Même format que questions.js (theme = vrai thème du jeu, pour les missions « bonnes réponses en … »).
   ============================================================ */

const EVENT_BANKS = window.EVENT_BANKS || (window.EVENT_BANKS = {});

EVENT_BANKS.halloween = [
    // Origines et traditions
    { id: 30000, theme: "Histoire", d: 2, q: "De quelle ancienne fête celte, célébrée le 31 octobre, Halloween est-il issu ?", a: ["Samhain", "Samain"], exp: "Elle marquait la fin des récoltes et le début de l’hiver : on pensait que les morts pouvaient revenir cette nuit-là." },
    { id: 30001, theme: "Géographie", d: 2, q: "De quel pays Halloween est-il originaire ?", a: ["L’Irlande", "Irlande"], exp: "Les immigrés irlandais l’ont emporté aux États-Unis au XIXe siècle." },
    { id: 30002, theme: "Gastronomie", d: 2.5, q: "Avant la citrouille, quel légume les Irlandais creusaient-ils pour en faire des lanternes ?", a: ["Le navet", "Navet", "Navets", "Rutabaga", "Betterave"], exp: "Arrivés en Amérique, ils l’ont remplacé par la citrouille, plus grosse et plus facile à creuser." },
    { id: 30003, theme: "Langue française", d: 2, q: "Que disent les enfants anglophones en sonnant aux portes le soir d’Halloween ?", a: ["Trick or treat", "Trick or treat !"], exp: "« Une farce ou une friandise ! » : en français, on dit « Des bonbons ou un sort ! »." },
    { id: 30004, theme: "Histoire", d: 2.5, q: "Quelle grande fête mexicaine, début novembre, honore les défunts avec des autels fleuris ?", a: ["Le Jour des morts", "Jour des morts", "Día de los Muertos", "Dia de los muertos"], exp: "Elle est inscrite au patrimoine culturel immatériel de l’Unesco depuis 2008." },
    { id: 30005, theme: "Arts", d: 1.5, q: "Avec le noir, quelle est la couleur d’Halloween ?", a: ["L’orange", "Orange"], exp: "La couleur des citrouilles… et des feuilles d’automne." },
    { id: 30006, theme: "Gastronomie", d: 1.5, q: "Quel gros fruit orange est le symbole d’Halloween ?", a: ["La citrouille", "Citrouille", "Potiron", "Courge"], exp: "Elle est composée à environ 90 % d’eau." },
    { id: 30007, theme: "Gastronomie", d: 1.5, q: "Que fabrique-t-on en creusant une citrouille et en y glissant une bougie ?", a: ["Une lanterne", "Lanterne", "Lampion"], exp: "Ses yeux et sa bouche découpés s’illuminent dans la nuit." },
    { id: 30008, theme: "Histoire", d: 2.5, q: "Dans quelle ville du Massachusetts a eu lieu le célèbre procès des sorcières de 1692 ?", a: ["Salem"], exp: "Vingt personnes y ont été exécutées après des accusations de sorcellerie." },
    { id: 30009, theme: "Histoire", d: 3, q: "Quel prince de Valachie du XVe siècle, surnommé « l’Empaleur », aurait inspiré Dracula ?", a: ["Vlad III", "Vlad Tepes", "Vlad Țepeș", "Vlad"], exp: "Il signait parfois « Dracula », « le fils du dragon »." },
    { id: 30010, theme: "Histoire", d: 2, q: "Quel jour, au lendemain d’Halloween, fête-t-on la Toussaint ?", a: ["Le 1er novembre", "1er novembre", "1 novembre"], exp: "Le lendemain, le 2 novembre, est le jour des défunts." },
    { id: 30011, theme: "Histoire", d: 3, q: "Dans quelle région de Lozère une bête mystérieuse a-t-elle tué une centaine de personnes, de 1764 à 1767 ?", a: ["Le Gévaudan", "Gévaudan", "Gevaudan"], exp: "Loup géant, hybride ou plusieurs loups ? Le mystère n’a jamais été vraiment résolu." },
    { id: 30012, theme: "Histoire", d: 3, q: "Quel surnom a reçu le tueur jamais identifié du quartier de Whitechapel, à Londres, en 1888 ?", a: ["Jack l’Éventreur", "Jack l'Eventreur", "Jack the Ripper", "L’Éventreur"], exp: "Des centaines de suspects ont été proposés depuis, sans preuve définitive." },
    { id: 30013, theme: "Monuments", d: 2.5, q: "Quel ossuaire souterrain de Paris abrite les restes d’environ 6 millions de personnes ?", a: ["Les Catacombes", "Catacombes"], exp: "Les ossements des cimetières parisiens y ont été transférés à partir de la fin du XVIIIe siècle." },
    { id: 30014, theme: "Littérature", d: 1.5, q: "Sur quel objet les sorcières volent-elles dans les contes ?", a: ["Un balai", "Balai"], exp: "On les dessine ainsi depuis le XVe siècle." },

    // Littérature
    { id: 30015, theme: "Sciences", d: 1.5, q: "Quel animal, quand il est noir, est censé porter malheur s’il croise notre chemin ?", a: ["Le chat", "Chat", "Un chat"], exp: "Mais au Royaume-Uni et au Japon, il porte plutôt bonheur !" },
    { id: 30016, theme: "Mythologie", d: 1.5, q: "Quelle créature se transforme en bête les soirs de pleine lune ?", a: ["Le loup-garou", "Loup-garou", "Loup garou", "Lycanthrope"], exp: "Selon la légende, une balle en argent peut le vaincre." },
    { id: 30017, theme: "Littérature", d: 3, q: "Dans quel village américain galope le Cavalier sans tête de Washington Irving ?", a: ["Sleepy Hollow"], exp: "Tim Burton en a tiré un film en 1999, avec Johnny Depp." },
    { id: 30018, theme: "Histoire", d: 1.5, q: "Quel monstre enveloppé de bandelettes sort de son sarcophage ?", a: ["La momie", "Momie"], exp: "Les Égyptiens momifiaient leurs morts pour les préparer à l’au-delà." },
    { id: 30019, theme: "Littérature", d: 2.5, q: "Dans le roman de Mary Shelley, Frankenstein est-il le nom du savant ou de sa créature ?", a: ["Le savant", "Savant", "Le scientifique", "Victor Frankenstein", "Le docteur"], exp: "Victor Frankenstein est le savant ; sa créature n’a pas de nom." },
    { id: 30020, theme: "Littérature", d: 3, q: "Quel chasseur de vampires néerlandais affronte Dracula dans le roman de Bram Stoker ?", a: ["Van Helsing", "Abraham Van Helsing"], exp: "Un professeur et médecin d’Amsterdam." },
    { id: 30021, theme: "Mythologie", d: 2.5, q: "Quelle créature d’argile d’une légende juive de Prague prend vie grâce à un mot sacré ?", a: ["Le Golem", "Golem"], exp: "On raconte que ses restes dorment encore dans le grenier de la vieille synagogue." },
    { id: 30022, theme: "Littérature", d: 2, q: "Quelle série de livres pour la jeunesse de R. L. Stine porte le nom d’une réaction de la peau quand on a peur ?", a: ["Chair de poule"], exp: "« Goosebumps » en anglais : plus de 400 millions de livres vendus." },

    // Cinéma et séries
    { id: 30023, theme: "Cinéma", d: 2, q: "Dans quelle saga d’horreur le tueur porte-t-il le masque « Ghostface » ?", a: ["Scream"], exp: "Le masque s’inspire du tableau « Le Cri » d’Edvard Munch." },
    { id: 30024, theme: "Cinéma", d: 2.5, q: "Comment s’appelle le tueur masqué de la saga « Halloween » de John Carpenter ?", a: ["Michael Myers", "Myers"], exp: "Son masque blanc était, au départ, un masque du capitaine Kirk de Star Trek peint en blanc." },
    { id: 30025, theme: "Cinéma", d: 2.5, q: "Quel tueur au gant griffu attaque les adolescents dans leurs rêves ?", a: ["Freddy Krueger", "Freddy", "Krueger"], exp: "Le méchant de « Les Griffes de la nuit » (1984), de Wes Craven." },
    { id: 30026, theme: "Cinéma", d: 2, q: "Comment s’appelle la poupée tueuse de la saga d’horreur « Jeu d’enfant » ?", a: ["Chucky"], exp: "L’âme d’un tueur en série est enfermée dans cette poupée rousse." },
    { id: 30027, theme: "Cinéma", d: 2.5, q: "Dans quelle saga le tueur Jigsaw piège-t-il ses victimes dans des jeux cruels ?", a: ["Saw"], exp: "Le premier film, en 2004, a été tourné en 18 jours." },
    { id: 30028, theme: "Cinéma", d: 1.5, q: "Comment appelle-t-on un mort-vivant qui marche en grognant, à la recherche de cerveaux ?", a: ["Un zombie", "Zombie", "Zombi"], exp: "Le mot vient du vaudou haïtien." },
    { id: 30029, theme: "Cinéma", d: 3, q: "Quel film de 1973 de William Friedkin raconte la possession de la petite Regan ?", a: ["L’Exorciste", "Exorciste", "The Exorcist"], exp: "Le premier film d’horreur nommé à l’Oscar du meilleur film." },
    { id: 30030, theme: "Cinéma", d: 3, q: "Quel film muet allemand de 1922, de Murnau, met en scène le vampire comte Orlok ?", a: ["Nosferatu"], exp: "Robert Eggers en a tourné une nouvelle version en 2024." },
    { id: 30031, theme: "Langue française", d: 1.5, q: "Comment dit-on d’un château où vivraient des fantômes ?", a: ["Hanté", "Il est hanté", "Hantée"], exp: "Du verbe « hanter » : fréquenter un lieu, comme le font les esprits." },
    { id: 30032, theme: "Cinéma", d: 2, q: "Comment s’appelle le gentil petit fantôme des dessins animés, adapté au cinéma en 1995 ?", a: ["Casper"], exp: "Apparu en dessin animé en 1945, il veut seulement se faire des amis." },
    { id: 30033, theme: "Cinéma", d: 2.5, q: "Quel film Disney de 1993 met en scène les trois sœurs sorcières Sanderson ?", a: ["Hocus Pocus"], exp: "Une suite est sortie en 2022, avec les mêmes actrices." },
    { id: 30034, theme: "Cinéma", d: 2.5, q: "Quelle fillette découvre une « autre mère » aux yeux en boutons, dans un film d’animation de 2009 ?", a: ["Coraline"], exp: "D’après le roman de Neil Gaiman, en animation image par image." },
    { id: 30035, theme: "Cinéma", d: 2.5, q: "Dans quel film de M. Night Shyamalan un petit garçon dit-il « Je vois des gens qui sont morts » ?", a: ["Sixième Sens", "Le Sixième Sens", "The Sixth Sense"], exp: "Avec Bruce Willis, et une fin restée célèbre." },
    { id: 30036, theme: "Cinéma", d: 3, q: "Comment s’appelle la poupée maléfique de l’univers « Conjuring », qui a eu son propre film en 2014 ?", a: ["Annabelle"], exp: "Une vraie poupée, de chiffon celle-là, est exposée dans le musée des Warren." },
    { id: 30037, theme: "Cinéma", d: 2, q: "Quelles petites créatures ne doivent ni être mouillées ni nourries après minuit ?", a: ["Les Gremlins", "Gremlins", "Gremlin", "Mogwaï", "Mogwai"], exp: "Le gentil Gizmo, lui, est un mogwaï." },
    { id: 30038, theme: "Cinéma", d: 2, q: "Dans quelle saga d’animation Dracula accueille-t-il des monstres en vacances ?", a: ["Hôtel Transylvanie", "Hotel Transylvanie", "Hotel Transylvania"], exp: "Quatre films, de 2012 à 2022." },
    { id: 30039, theme: "Cinéma", d: 2, q: "Dans quel film Pixar Sulli et Bob font-ils peur aux enfants pour produire de l’énergie ?", a: ["Monstres et Cie", "Monstres et Compagnie", "Monstres & Cie", "Monsters Inc"], exp: "Les cris des enfants alimentent la ville de Monstropolis." },
    { id: 30040, theme: "Cinéma", d: 2, q: "Quelle série met en scène Rick Grimes dans un monde envahi par les zombies ?", a: ["The Walking Dead", "Walking Dead"], exp: "Onze saisons, de 2010 à 2022, d’après la bande dessinée de Robert Kirkman." },
    { id: 30041, theme: "Cinéma", d: 2.5, q: "Quelle héroïne de série des années 1990 est une « tueuse de vampires » ?", a: ["Buffy", "Buffy Summers"], exp: "« Buffy contre les vampires », avec Sarah Michelle Gellar." },
    { id: 30042, theme: "Gastronomie", d: 1.5, q: "Quel aliment à l’odeur forte est censé faire fuir les vampires ?", a: ["L’ail", "Ail", "Gousse d’ail"], exp: "Avec le crucifix… et la lumière du soleil." },

    // Musique
    { id: 30043, theme: "Littérature", d: 1.5, q: "En quel animal Dracula peut-il se transformer pour voler ?", a: ["En chauve-souris", "Chauve-souris", "Chauves-souris", "Une chauve-souris"], exp: "Il peut aussi devenir loup… ou brouillard !" },
    { id: 30044, theme: "Cinéma", d: 1.5, q: "Comment s’appelle le chien peureux qui enquête sur des fantômes avec Sammy ?", a: ["Scooby-Doo", "Scooby", "Scoubidou"], exp: "Les « fantômes » se révèlent presque toujours être des humains déguisés." },
    { id: 30045, theme: "Cinéma", d: 2, q: "Dans « La Famille Addams », comment s’appelle la main qui se déplace toute seule ?", a: ["La Chose", "Chose", "Thing"], exp: "Elle a aussi un grand rôle dans la série « Mercredi » (2022)." },

    // Nature
    { id: 30046, theme: "Sciences", d: 2.5, q: "Quelle araignée doit son nom au fait que la femelle dévore parfois le mâle ?", a: ["La veuve noire", "Veuve noire"], exp: "On la reconnaît au sablier rouge sous son abdomen." },
    { id: 30047, theme: "Sciences", d: 3, q: "Sur quel continent vivent les chauves-souris vampires, qui se nourrissent de sang ?", a: ["L’Amérique", "Amérique", "Amérique du Sud", "Amérique latine", "Amérique centrale"], exp: "Du Mexique à l’Argentine. Elles partagent même leur repas avec les plus affamées." },
    { id: 30048, theme: "Sciences", d: 2.5, q: "Comment s’appelle la grosse araignée velue souvent associée à Halloween, comme la tarentule ?", a: ["La mygale", "Mygale"], exp: "Malgré son air effrayant, sa morsure est rarement dangereuse pour l’homme." },
    { id: 30049, theme: "Mythologie", d: 3, q: "Quelle fée du folklore irlandais pousse un cri qui annonce une mort prochaine ?", a: ["La banshee", "Banshee", "Bean sidhe"], exp: "Son nom vient de l’irlandais « bean sí », la femme des collines féeriques." },
    { id: 30050, theme: "Mythologie", d: 3, q: "Comment s’appelle la célèbre légende de l’auto-stoppeuse fantôme qui disparaît dans la voiture ?", a: ["La Dame blanche", "Dame blanche"], exp: "On la raconte sur des dizaines de routes de France." },

    // Jeux vidéo
    { id: 30051, theme: "Jeux", d: 2.5, q: "Dans quel jeu vidéo surveille-t-on, la nuit, les animatroniques d’une pizzeria ?", a: ["Five Nights at Freddy’s", "Five Nights at Freddy's", "Five Nights at Freddys", "FNAF"], exp: "Un jeu indépendant de 2014, adapté au cinéma en 2023." },
    { id: 30052, theme: "Jeux", d: 2, q: "Dans quel jeu Nintendo le frère de Mario aspire-t-il des fantômes avec un aspirateur ?", a: ["Luigi’s Mansion", "Luigi's Mansion", "Luigis Mansion"], exp: "Sorti en 2001 avec la GameCube." },
    { id: 30053, theme: "Cinéma", d: 2, q: "Quelle méchante fée de Disney se transforme en dragon dans « La Belle au bois dormant » ?", a: ["Maléfique", "Malefique", "Maleficent"], exp: "Angelina Jolie l’a incarnée au cinéma en 2014." },
    { id: 30054, theme: "Jeux", d: 2, q: "Dans quel jeu vidéo défend-on sa maison face aux morts-vivants, à l’aide de tournesols et de pois ?", a: ["Plants vs. Zombies", "Plants vs Zombies", "Plantes contre zombies", "PvZ"], exp: "Tournesols, pois et noix géantes contre les zombies, depuis 2009." },
    // Rébus (2026-10-23) : emojis dans l’ordre des mots
    { id: 30055, theme: "Langue française", d: 2, rebus: ["😱", "🔵"], q: "Quelle expression se cache derrière ce rébus ?", a: ["Avoir une peur bleue", "Une peur bleue", "Peur bleue"], exp: "😱 Peur + 🔵 bleue : avoir une très grande peur." },
    { id: 30056, theme: "Langue française", d: 2.5, rebus: ["🩸", "🖋️"], q: "Quelle expression se cache derrière ce rébus ?", a: ["Se faire un sang d’encre", "Un sang d’encre", "Sang d’encre", "Se faire un sang d'encre", "Sang d'encre"], exp: "🩸 Sang + 🖋️ encre : se faire beaucoup de souci." },
    { id: 30057, theme: "Langue française", d: 2.5, rebus: ["💦", "🥶"], q: "Quelle expression se cache derrière ce rébus ?", a: ["Avoir des sueurs froides", "Des sueurs froides", "Sueurs froides", "Sueur froide"], exp: "💦 Sueurs + 🥶 froides : avoir très peur, d’un coup." },
    { id: 30058, theme: "Langue française", d: 2, rebus: ["🌙", "⬜"], q: "Quelle expression se cache derrière ce rébus ?", a: ["Une nuit blanche", "Nuit blanche", "Passer une nuit blanche"], exp: "🌙 Nuit + ⬜ blanche : une nuit passée sans dormir." },
    { id: 30059, theme: "Langue française", d: 2, rebus: ["👅", "🐍"], q: "Quelle expression se cache derrière ce rébus ?", a: ["Une langue de vipère", "Langue de vipère", "Être une langue de vipère", "Langue de serpent"], exp: "👅 Langue + 🐍 vipère : quelqu’un qui dit du mal des autres." },
    { id: 30060, theme: "Langue française", d: 2.5, rebus: ["🥑", "😈"], q: "Quelle expression se cache derrière ce rébus ?", a: ["L’avocat du diable", "Avocat du diable", "Se faire l’avocat du diable", "L'avocat du diable", "Se faire l'avocat du diable"], exp: "🥑 Avocat + 😈 diable : défendre exprès l’avis contraire." },
    { id: 30061, theme: "Langue française", d: 2, rebus: ["❄️", "🦆"], q: "Quelle expression se cache derrière ce rébus ?", a: ["Un froid de canard", "Froid de canard", "Il fait un froid de canard"], exp: "❄️ Froid + 🦆 canard : il fait très, très froid." },
    { id: 30062, theme: "Langue française", d: 2, rebus: ["🏹", "🧙"], q: "Quelle expression se cache derrière ce rébus ?", a: ["La chasse aux sorcières", "Chasse aux sorcières", "Une chasse aux sorcières", "Chasse aux sorcieres", "Chasse à la sorcière"], exp: "🏹 Chasse + 🧙 sorcières : poursuivre des gens pour leurs idées." },
    { id: 30063, theme: "Langue française", d: 2, rebus: ["⚪", "👕"], q: "Quelle expression se cache derrière ce rébus ?", a: ["Blanc comme un linge", "Être blanc comme un linge", "Pâle comme un linge"], exp: "⚪ Blanc + 👕 linge : devenir tout pâle, de peur ou de malaise." },
    { id: 30064, theme: "Langue française", d: 1.5, rebus: ["💀", "😂"], q: "Quelle expression se cache derrière ce rébus ?", a: ["Mourir de rire", "Mort de rire", "Être mort de rire", "MDR"], exp: "💀 Mourir + 😂 rire : rire énormément." }
];

/* Anecdotes des décors du parcours pendant l'événement (une par icône) */
EVENT_BANKS.halloweenFacts = [
    'Halloween vient de « All Hallows’ Eve » : la veille de la Toussaint.',
    'Les plus grosses citrouilles du monde dépassent une tonne !',
    'Les chauves-souris vampires partagent leur repas de sang avec leurs voisines affamées.',
    'Bram Stoker, l’auteur de « Dracula », n’est jamais allé en Transylvanie.',
    'Les araignées ne sont pas des insectes : elles ont huit pattes, pas six.',
    'En Irlande, on mange à Halloween le barmbrack, un pain aux fruits secs où l’on cache une bague.',
    'Au Royaume-Uni et au Japon, croiser un chat noir porte plutôt bonheur.',
    'Une citrouille est composée à environ 90 % d’eau.',
    'La sorcière sur son balai apparaît déjà dans des enluminures du XVe siècle.',
    'Le masque de Michael Myers était, au départ, un masque du capitaine Kirk peint en blanc.'
];
