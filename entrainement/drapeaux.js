/* Entraînement · Drapeaux (ids 23000-23999) — un tiers avec l’image du drapeau (dossier flags/), le reste en questions classiques */
TRAINING_QUESTIONS.push(
    // Palier 1
    { id: 23001, theme: "Drapeaux", d: 1.0, q: "Quelle couleur de drapeau signale qu’on se rend ?", a: ["Blanc", "Le blanc", "Drapeau blanc"], exp: "Un signe de trêve reconnu depuis l’Antiquité." },
    { id: 23002, theme: "Drapeaux", d: 1.4, q: "Sur une plage surveillée, quelle couleur de drapeau indique une baignade sans danger ?", a: ["Vert", "Le vert"], exp: "Jaune : baignade dangereuse mais surveillée ; rouge : interdite." },
    { id: 23003, theme: "Drapeaux", d: 1.4, q: "Combien d’étoiles compte le drapeau des États-Unis ?", a: ["50", "Cinquante"], exp: "Une par État ; la dernière a été ajoutée en 1960 pour Hawaï." },
    { id: 23004, theme: "Drapeaux", d: 1.4, q: "Quel symbole figure au centre du drapeau olympique ?", a: ["Cinq anneaux", "Les anneaux", "Anneaux", "Les anneaux olympiques"], exp: "Imaginé par Pierre de Coubertin en 1913." },
    { id: 23005, theme: "Drapeaux", d: 1.6, q: "Quel surnom anglais porte le drapeau du Royaume-Uni ?", a: ["L’Union Jack", "Union Jack", "Union Flag"], exp: "Il superpose les croix de l’Angleterre, de l’Écosse et de l’Irlande." },
    { id: 23006, theme: "Drapeaux", d: 1.6, q: "Combien d’étoiles compte le drapeau de l’Union européenne ?", a: ["12", "Douze"], exp: "Un symbole de perfection, sans lien avec le nombre de pays." },
    { id: 23007, theme: "Drapeaux", d: 1.8, q: "Comment surnomme-t-on le drapeau américain ?", a: ["La Bannière étoilée", "Bannière étoilée", "Stars and Stripes", "Star-Spangled Banner"], exp: "C’est aussi le titre de l’hymne national américain." },
    { id: 23008, theme: "Drapeaux", d: 1.8, q: "Combien de bandes rouges et blanches compte le drapeau américain ?", a: ["13", "Treize"], exp: "Pour les treize colonies devenues indépendantes en 1776." },
    { id: 23009, theme: "Drapeaux", d: 1.8, q: "Sur une plage, quelle couleur de drapeau interdit la baignade ?", a: ["Rouge", "Le rouge"], exp: "Le drapeau violet, lui, signale une pollution." },
    { id: 23010, theme: "Drapeaux", d: 2.0, q: "Quelle est la couleur de fond du drapeau de l’ONU ?", a: ["Bleu", "Bleu ciel", "Le bleu"], exp: "Une carte du monde entourée de rameaux d’olivier, symbole de paix." },

    // Palier 2
    { id: 23011, theme: "Drapeaux", d: 2.2, flag: "🇩🇰", q: "À quel pays appartient ce drapeau ?", a: ["Le Danemark", "Danemark"], exp: "Le Dannebrog serait le plus ancien drapeau national encore utilisé." },
    { id: 23012, theme: "Drapeaux", d: 2.2, flag: "🇫🇮", q: "À quel pays appartient ce drapeau ?", a: ["La Finlande", "Finlande"], exp: "Bleu comme ses milliers de lacs, blanc comme la neige." },
    { id: 23013, theme: "Drapeaux", d: 2.4, q: "Quelle nation du Royaume-Uni a un dragon rouge sur son drapeau ?", a: ["Le pays de Galles", "Pays de Galles", "Galles"], exp: "Le seul drapeau de ces nations absent de l’Union Jack." },
    { id: 23014, theme: "Drapeaux", d: 2.4, q: "Quelle nation a une croix blanche en diagonale sur fond bleu ?", a: ["L’Écosse", "Écosse", "Ecosse"], exp: "La croix de saint André, son saint patron." },
    { id: 23015, theme: "Drapeaux", d: 2.4, flag: "🇨🇺", q: "À quel pays appartient ce drapeau ?", a: ["Cuba"], exp: "Une étoile blanche sur un triangle rouge, avec cinq bandes." },
    { id: 23016, theme: "Drapeaux", d: 2.6, q: "Quel monument figure au centre du drapeau du Cambodge ?", a: ["Angkor Vat", "Angkor", "Angkor Wat", "Le temple d’Angkor"], exp: "Un des rares drapeaux à représenter un bâtiment." },
    { id: 23017, theme: "Drapeaux", d: 2.6, q: "Quelle figure orne le drapeau de la Corse ?", a: ["Une tête de Maure", "Tête de Maure", "La tête de Maure"], exp: "Un bandeau blanc sur le front, adopté par Pascal Paoli." },
    { id: 23018, theme: "Drapeaux", d: 2.6, q: "Quel pays a un drapeau vert avec une inscription et un sabre blancs ?", a: ["L’Arabie saoudite", "Arabie saoudite", "Arabie Saoudite"], exp: "L’inscription est la profession de foi de l’islam." },
    { id: 23019, theme: "Drapeaux", d: 2.6, flag: "🇪🇬", q: "À quel pays appartient ce drapeau ?", a: ["L’Égypte", "Égypte", "Egypte"], exp: "Un aigle doré, l’aigle de Saladin, au centre." },
    { id: 23020, theme: "Drapeaux", d: 2.8, q: "Quel pays des Balkans a un aigle noir à deux têtes sur fond rouge ?", a: ["L’Albanie", "Albanie"], exp: "Un symbole hérité de l’Empire byzantin." },

    // Palier 3
    { id: 23021, theme: "Drapeaux", d: 2.8, q: "Quel État a, comme la Suisse, un drapeau carré ?", a: ["Le Vatican", "Vatican", "Saint-Siège"], exp: "Avec les clés de saint Pierre et la tiare papale." },
    { id: 23022, theme: "Drapeaux", d: 3.0, q: "Quel pays a un drapeau vert avec un disque rouge ?", a: ["Le Bangladesh", "Bangladesh"], exp: "Le disque rouge, légèrement décentré, évoque le soleil et le sang versé." },
    { id: 23023, theme: "Drapeaux", d: 3.0, q: "Comment s’appelle le drapeau breton ?", a: ["Le Gwenn ha du", "Gwenn ha du", "Gwenn-ha-du"], exp: "« Blanc et noir » en breton, avec ses mouchetures d’hermine." },
    { id: 23024, theme: "Drapeaux", d: 3.0, q: "Quel pays a un drapeau rouge, blanc, rouge en bandes horizontales ?", a: ["L’Autriche", "Autriche"], exp: "L’un des plus anciens drapeaux du monde." },
    { id: 23025, theme: "Drapeaux", d: 3.0, flag: "🇭🇷", q: "À quel pays appartient ce drapeau ?", a: ["La Croatie", "Croatie"], exp: "Son blason en damier rouge et blanc se retrouve sur le maillot de foot." },
    { id: 23026, theme: "Drapeaux", d: 3.0, flag: "🇭🇺", q: "À quel pays appartient ce drapeau ?", a: ["La Hongrie", "Hongrie"], exp: "Rouge, blanc, vert : comme l’Italie, mais à l’horizontale." },
    { id: 23027, theme: "Drapeaux", d: 3.0, flag: "🇵🇪", q: "À quel pays appartient ce drapeau ?", a: ["Le Pérou", "Pérou", "Perou"], exp: "Rouge et blanc, inspiré du plumage de flamants aperçus par le libérateur San Martín." },
    { id: 23028, theme: "Drapeaux", d: 3.0, flag: "🇮🇷", q: "À quel pays appartient ce drapeau ?", a: ["L’Iran", "Iran"], exp: "L’inscription « Allah akbar » y est répétée 22 fois." },
    { id: 23029, theme: "Drapeaux", d: 3.0, flag: "🇳🇬", q: "À quel pays appartient ce drapeau ?", a: ["Le Nigeria", "Nigeria", "Nigéria"], exp: "Vert pour l’agriculture, blanc pour la paix." },
    { id: 23030, theme: "Drapeaux", d: 3.2, q: "Comment appelle-t-on le drapeau noir des pirates à tête de mort ?", a: ["Le Jolly Roger", "Jolly Roger"], exp: "Hissé au dernier moment pour effrayer les navires attaqués." },

    // Palier 4
    { id: 23031, theme: "Drapeaux", d: 3.2, flag: "🇮🇩", q: "À quel pays appartient ce drapeau ?", a: ["L’Indonésie", "Indonésie", "Indonesie"], exp: "Presque identique à celui de Monaco, mais plus allongé." },
    { id: 23032, theme: "Drapeaux", d: 3.2, flag: "🇵🇰", q: "À quel pays appartient ce drapeau ?", a: ["Le Pakistan", "Pakistan"], exp: "La bande blanche représente les minorités religieuses." },
    { id: 23033, theme: "Drapeaux", d: 3.2, flag: "🇨🇿", q: "À quel pays appartient ce drapeau ?", a: ["La Tchéquie", "Tchéquie", "République tchèque", "Tchequie"], exp: "Elle a gardé le drapeau de l’ancienne Tchécoslovaquie." },
    { id: 23034, theme: "Drapeaux", d: 3.4, q: "Quel pays méditerranéen a la carte de son île sur son drapeau ?", a: ["Chypre"], exp: "Couleur cuivre, en souvenir des mines qui ont donné son nom au métal." },
    { id: 23035, theme: "Drapeaux", d: 3.4, q: "Quel pays d’Afrique a une étoile noire au centre de son drapeau ?", a: ["Le Ghana", "Ghana"], exp: "Premier pays d’Afrique subsaharienne indépendant, en 1957." },
    { id: 23036, theme: "Drapeaux", d: 3.4, q: "Quel État américain a un ours sur son drapeau ?", a: ["La Californie", "Californie"], exp: "Un grizzly, devenu le symbole de l’État." },
    { id: 23037, theme: "Drapeaux", d: 3.4, flag: "🇺🇾", q: "À quel pays appartient ce drapeau ?", a: ["L’Uruguay", "Uruguay"], exp: "Avec le « Soleil de Mai », comme l’Argentine voisine." },
    { id: 23038, theme: "Drapeaux", d: 3.6, q: "Comment appelle-t-on l’étude des drapeaux ?", a: ["La vexillologie", "Vexillologie"], exp: "Du latin « vexillum », l’étendard des légions romaines." },
    { id: 23039, theme: "Drapeaux", d: 3.6, flag: "🇪🇹", q: "À quel pays appartient ce drapeau ?", a: ["L’Éthiopie", "Éthiopie", "Ethiopie"], exp: "Ses couleurs vert, jaune et rouge ont inspiré de nombreux pays africains." },
    { id: 23040, theme: "Drapeaux", d: 3.6, flag: "🇨🇲", q: "À quel pays appartient ce drapeau ?", a: ["Le Cameroun", "Cameroun"], exp: "Une étoile jaune au centre de trois bandes verticales." },

    // Palier 5
    { id: 23041, theme: "Drapeaux", d: 3.8, q: "Quel pays avait un drapeau entièrement vert, sans aucun motif, jusqu’en 2011 ?", a: ["La Libye", "Libye"], exp: "Sous le régime du colonel Kadhafi." },
    { id: 23042, theme: "Drapeaux", d: 3.8, q: "Quel pays du Caucase a cinq croix rouges sur fond blanc ?", a: ["La Géorgie", "Géorgie", "Georgie"], exp: "Le drapeau a été réadopté en 2004." },
    { id: 23043, theme: "Drapeaux", d: 3.8, q: "Quel État américain a la Grande Ourse sur son drapeau ?", a: ["L’Alaska", "Alaska"], exp: "Dessiné en 1926 par un garçon de 13 ans." },
    { id: 23044, theme: "Drapeaux", d: 3.8, q: "Quel pays de la Corne de l’Afrique a une étoile blanche sur fond bleu ?", a: ["La Somalie", "Somalie"], exp: "Ses cinq branches représentent les territoires où vivent les Somalis." },
    { id: 23045, theme: "Drapeaux", d: 3.8, flag: "🇻🇪", q: "À quel pays appartient ce drapeau ?", a: ["Le Venezuela", "Venezuela", "Vénézuela"], exp: "Huit étoiles en arc de cercle depuis 2006." },
    { id: 23046, theme: "Drapeaux", d: 4.0, q: "Quel pays des Caraïbes a un trident sur son drapeau ?", a: ["La Barbade", "Barbade"], exp: "Le trident brisé symbolise la rupture avec la colonisation." },
    { id: 23047, theme: "Drapeaux", d: 4.0, flag: "🇧🇴", q: "À quel pays appartient ce drapeau ?", a: ["La Bolivie", "Bolivie"], exp: "Rouge, jaune, vert : à ne pas confondre avec le Ghana ou le Mali." },
    { id: 23048, theme: "Drapeaux", d: 4.4, q: "Quel pays d’Amérique centrale a cinq volcans dans l’emblème de son drapeau ?", a: ["Le Nicaragua", "Nicaragua"], exp: "Ils représentent les cinq pays de l’ancienne Fédération d’Amérique centrale." },
    { id: 23049, theme: "Drapeaux", d: 4.4, q: "Quel royaume, aujourd’hui la Thaïlande, avait un éléphant blanc sur son drapeau jusqu’en 1917 ?", a: ["Le Siam", "Siam"], exp: "L’éléphant blanc était un animal sacré, symbole du roi." },
    { id: 23050, theme: "Drapeaux", d: 4.6, q: "Quel pays des Antilles a un perroquet sur son drapeau ?", a: ["La Dominique", "Dominique"], exp: "Le sisérou, un amazone qui ne vit que sur cette île." }
);
