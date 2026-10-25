'use strict';

/* ============================================================
   KULTIVO — objets d'avatar (mise à jour du 26/10/2026) : fonds, dessins et cadres.
   - Couleurs unies et dessins de base : 12 couleurs et 15 dessins au départ, les autres se GAGNENT en jouant.
   - Cadres et fonds « à gagner » (exploits, événements) : jamais vendus.
   - Objets de la boutique : vendus seulement quand ils passent dans la vitrine de la semaine (VITRINE_ORDER).
   L'apparence de chaque objet est dans style.css (classe = id de l'objet).
   Les conditions reçoivent `s` (voir avStats dans script.js).
   Ajouter un lot : de nouveaux objets à la fin d'AV_ITEMS + leurs ids à la fin des listes de VITRINE_ORDER
   (jamais au milieu : ça décalerait les vitrines déjà passées).
   ============================================================ */

// Dessins de départ (gratuits) et dessins à gagner, du plus facile au plus dur
const AV_FREE_PICS = ['🦉', '🐱', '🐶', '🦊', '🐼', '🐸', '🐧', '🐢', '🌻', '🍄', '⚽', '🎮', '🎲', '💡', '⭐'];
const AV_EARN_PICS = [
    ['🐙', 'Termine 1 niveau', s => s.levelsDone >= 1],
    ['🍿', 'Donne 25 bonnes réponses du premier coup', s => s.right >= 25],
    ['🎸', 'Termine une leçon sans faute', s => s.flawless >= 1],
    ['🥐', 'Joue un défi du jour', s => s.dailyDone >= 1],
    ['🧩', 'Termine une révision', s => s.reviews >= 1],
    ['🚂', 'Termine le niveau 20', s => s.maxDone >= 20],
    ['🦈', 'Réussis un niveau défi 🏆', s => s.challengesDone >= 1],
    ['🐍', 'Fais 8 bonnes réponses en un sprint', s => s.bestSprint >= 8],
    ['🎷', 'Atteins l’objectif du jour 7 fois', s => s.goalDays >= 7],
    ['🐋', 'Donne 100 bonnes réponses du premier coup', s => s.right >= 100],
    ['🦖', 'Fais une série de 7 jours', s => s.bestStreak >= 7],
    ['🔭', 'Termine le niveau 50', s => s.maxDone >= 50],
    ['🐎', 'Joue 7 défis du jour', s => s.dailyDone >= 7],
    ['🧲', 'Termine 5 révisions', s => s.reviews >= 5],
    ['🤖', 'Gagne un duel', s => s.duelsWon >= 1],
    ['🦁', 'Termine 5 leçons sans faute', s => s.flawless >= 5],
    ['🗿', 'Termine le niveau 80', s => s.maxDone >= 80],
    ['🚀', 'Fais 10 bonnes réponses en un sprint', s => s.bestSprint >= 10],
    ['🌋', 'Fais 10/10 au défi du jour', s => s.dailyPerfect],
    ['🏆', 'Finis une semaine 1er de la ligue des amis', s => s.leagueWins >= 1],
    ['👽', 'Donne 500 bonnes réponses du premier coup', s => s.right >= 500],
    ['🦄', 'Fais une série de 30 jours', s => s.bestStreak >= 30],
    ['🎨', 'Complète un thème de cartes', s => s.themesComplete >= 1],
    ['👻', 'Termine le niveau 120', s => s.maxDone >= 120]
];

// type : 'frame' (cadre) | 'bg' (fond) | 'pic' (dessin) ; kind : 'earn' (à gagner) | 'shop' (boutique)
// fx (cadres) : 'tag' = petit emblème dans le coin, 'deco' = 3 petits dessins autour, 'laurel' = branches de laurier
// season : vendu seulement à cette période ('halloween', 'noel', 'valentin')
const AV_ITEMS = [
    // ---------- Cadres à gagner ----------
    { id: 'fr-flame',       type: 'frame', kind: 'earn', name: 'Flamme',          fx: 'tag',    how: 'Fais une série de 30 jours',                 test: s => s.bestStreak >= 30 },
    { id: 'fr-ember',       type: 'frame', kind: 'earn', name: 'Braise',          fx: 'tag',    how: 'Fais une série de 100 jours',                test: s => s.bestStreak >= 100 },
    { id: 'fr-phoenix',     type: 'frame', kind: 'earn', name: 'Phénix',          fx: 'tag',    how: 'Fais une série de 365 jours',                test: s => s.bestStreak >= 365 },
    { id: 'fr-laurel-green',type: 'frame', kind: 'earn', name: 'Laurier vert',    fx: 'laurel', how: 'Finis une semaine 1er de la ligue des amis', test: s => s.leagueWins >= 1 },
    { id: 'fr-laurel-gold', type: 'frame', kind: 'earn', name: 'Laurier d’or',    fx: 'laurel', how: 'Finis 10 semaines 1er de la ligue des amis', test: s => s.leagueWins >= 10 },
    { id: 'fr-diamond',     type: 'frame', kind: 'earn', name: 'Diamant',         fx: 'tag',    how: 'Finis 25 semaines 1er de la ligue des amis', test: s => s.leagueWins >= 25 },
    { id: 'fr-swords',      type: 'frame', kind: 'earn', name: 'Épées',           fx: 'tag',    how: 'Gagne 10 duels',                             test: s => s.duelsWon >= 10 },
    { id: 'fr-gladiator',   type: 'frame', kind: 'earn', name: 'Gladiateur',      fx: 'tag',    how: 'Gagne 50 duels',                             test: s => s.duelsWon >= 50 },
    { id: 'fr-explorer',    type: 'frame', kind: 'earn', name: 'Explorateur',     fx: 'tag',    how: 'Termine le niveau 85 (la moitié du parcours)', test: s => s.maxDone >= 85 },
    { id: 'fr-globe',       type: 'frame', kind: 'earn', name: 'Globe-trotteur',  fx: 'tag',    how: 'Termine tout le parcours',                   test: s => s.mapComplete },
    { id: 'fr-master',      type: 'frame', kind: 'earn', name: 'Maître',          fx: 'tag',    how: 'Gagne une carte Maître (palier 5 d’entraînement)', test: s => s.masters >= 1 },
    { id: 'fr-grandmaster', type: 'frame', kind: 'earn', name: 'Grand Maître',    fx: 'tag',    how: 'Gagne 5 cartes Maître',                      test: s => s.masters >= 5 },
    { id: 'fr-collector',   type: 'frame', kind: 'earn', name: 'Collectionneur',  fx: 'tag',    how: 'Complète un thème de cartes',                test: s => s.themesComplete >= 1 },
    { id: 'fr-perfect',     type: 'frame', kind: 'earn', name: 'Perfectionniste', fx: 'tag',    how: 'Fais 10 fois 10/10 au défi du jour',         test: s => s.dailyTen >= 10 },
    { id: 'fr-halloween-2026', type: 'frame', kind: 'earn', name: 'Halloween 2026', fx: 'tag', event: 'halloween-2026', how: 'Termine l’événement Halloween 2026 (45 questions)', test: s => s.eventsWon.includes('halloween-2026') },
    // ---------- Fonds à gagner ----------
    { id: 'bg-or',             type: 'bg', kind: 'earn', name: 'Or',                how: 'Termine tout le parcours',              test: s => s.mapComplete },
    { id: 'bg-holo',           type: 'bg', kind: 'earn', name: 'Holographique',     how: 'Complète toute la collection de cartes', test: s => s.allThemes },
    { id: 'bg-nuit-halloween', type: 'bg', kind: 'earn', name: 'Nuit d’Halloween',  event: 'halloween-2026', how: 'Termine l’événement Halloween 2026 (45 questions)', test: s => s.eventsWon.includes('halloween-2026') },

    // ---------- Cadres de la boutique ----------
    { id: 'fr-checker',  type: 'frame', kind: 'shop', name: 'Damier',          price: 400 },
    { id: 'fr-dots',     type: 'frame', kind: 'shop', name: 'Pois',            price: 400 },
    { id: 'fr-neon-pink',type: 'frame', kind: 'shop', name: 'Néon rose',       price: 800 },
    { id: 'fr-scales',   type: 'frame', kind: 'shop', name: 'Écailles',        price: 500 },
    { id: 'fr-stripes',  type: 'frame', kind: 'shop', name: 'Rayures',         price: 400 },
    { id: 'fr-parchment',type: 'frame', kind: 'shop', name: 'Parchemin',       price: 600, fx: 'tag' },
    { id: 'fr-zigzag',   type: 'frame', kind: 'shop', name: 'Zigzag',          price: 400 },
    { id: 'fr-wood',     type: 'frame', kind: 'shop', name: 'Bois',            price: 400 },
    { id: 'fr-neon-blue',type: 'frame', kind: 'shop', name: 'Néon bleu',       price: 800 },
    { id: 'fr-waves',    type: 'frame', kind: 'shop', name: 'Vagues',          price: 500 },
    { id: 'fr-film',     type: 'frame', kind: 'shop', name: 'Pellicule',       price: 600 },
    { id: 'fr-gold',     type: 'frame', kind: 'shop', name: 'Doré',            price: 600 },
    { id: 'fr-tartan',   type: 'frame', kind: 'shop', name: 'Écossais',        price: 500 },
    { id: 'fr-flowers',  type: 'frame', kind: 'shop', name: 'Fleurs',          price: 800, fx: 'deco' },
    { id: 'fr-music',    type: 'frame', kind: 'shop', name: 'Notes de musique',price: 800, fx: 'deco' },
    { id: 'fr-pixels',   type: 'frame', kind: 'shop', name: 'Pixels',          price: 600 },
    { id: 'fr-copper',   type: 'frame', kind: 'shop', name: 'Cuivre',          price: 600 },
    { id: 'fr-stars',    type: 'frame', kind: 'shop', name: 'Étoiles',         price: 800, fx: 'deco' },
    { id: 'fr-frost',    type: 'frame', kind: 'shop', name: 'Givre',           price: 800 },
    { id: 'fr-confetti', type: 'frame', kind: 'shop', name: 'Confettis',       price: 800, fx: 'deco' },
    { id: 'fr-rainbow',  type: 'frame', kind: 'shop', name: 'Arc-en-ciel',     price: 1500 },
    { id: 'fr-pumpkins', type: 'frame', kind: 'shop', name: 'Citrouilles',     price: 600, fx: 'deco', season: 'halloween' },
    { id: 'fr-snowflakes', type: 'frame', kind: 'shop', name: 'Flocons',       price: 600, fx: 'deco', season: 'noel' },
    { id: 'fr-hearts',   type: 'frame', kind: 'shop', name: 'Cœurs',           price: 600, fx: 'deco', season: 'valentin' },

    // ---------- Fonds de la boutique ----------
    { id: 'bg-galaxy',   type: 'bg', kind: 'shop', name: 'Galaxie',           price: 800 },
    { id: 'bg-sunset',   type: 'bg', kind: 'shop', name: 'Coucher de soleil', price: 500 },
    { id: 'bg-ocean',    type: 'bg', kind: 'shop', name: 'Océan',             price: 500 },
    { id: 'bg-marble',   type: 'bg', kind: 'shop', name: 'Marbre',            price: 800 },
    { id: 'bg-forest',   type: 'bg', kind: 'shop', name: 'Forêt',             price: 500 },
    { id: 'bg-neon',     type: 'bg', kind: 'shop', name: 'Néon',              price: 1000 },
    { id: 'bg-aurora',   type: 'bg', kind: 'shop', name: 'Aurore',            price: 500 },
    { id: 'bg-jade',     type: 'bg', kind: 'shop', name: 'Jade',              price: 800 },
    { id: 'bg-lavender', type: 'bg', kind: 'shop', name: 'Lavande',           price: 500 },
    { id: 'bg-bronze',   type: 'bg', kind: 'shop', name: 'Bronze brillant',   price: 1000 },
    { id: 'bg-peach',    type: 'bg', kind: 'shop', name: 'Pêche',             price: 500 },
    { id: 'bg-wood',     type: 'bg', kind: 'shop', name: 'Bois',              price: 800 },
    { id: 'bg-mint',     type: 'bg', kind: 'shop', name: 'Menthe',            price: 500 },
    { id: 'bg-rainbow',  type: 'bg', kind: 'shop', name: 'Arc-en-ciel',       price: 800 },
    { id: 'bg-cherry',   type: 'bg', kind: 'shop', name: 'Cerise',            price: 500 },
    { id: 'bg-ruby',     type: 'bg', kind: 'shop', name: 'Rubis',             price: 800 },
    { id: 'bg-night',    type: 'bg', kind: 'shop', name: 'Nuit',              price: 500 },
    { id: 'bg-silver',   type: 'bg', kind: 'shop', name: 'Argent brillant',   price: 1500 },
    { id: 'bg-lava',     type: 'bg', kind: 'shop', name: 'Lave',              price: 1500 },
    { id: 'bg-boreal',   type: 'bg', kind: 'shop', name: 'Aurore boréale',    price: 1500 },
    { id: 'bg-snow',     type: 'bg', kind: 'shop', name: 'Neige',             price: 600, season: 'noel' },
    { id: 'bg-hearts',   type: 'bg', kind: 'shop', name: 'Cœurs',             price: 600, season: 'valentin' },

    // ---------- Dessins rares de la boutique ----------
    { id: 'pic-dragon',    type: 'pic', kind: 'shop', name: 'Dragon',      emoji: '🐉', price: 300 },
    { id: 'pic-butterfly', type: 'pic', kind: 'shop', name: 'Papillon',    emoji: '🦋', price: 300 },
    { id: 'pic-peacock',   type: 'pic', kind: 'shop', name: 'Paon',        emoji: '🦚', price: 300 },
    { id: 'pic-planet',    type: 'pic', kind: 'shop', name: 'Planète',     emoji: '🪐', price: 300 },
    { id: 'pic-mermaid',   type: 'pic', kind: 'shop', name: 'Sirène',      emoji: '🧜', price: 300 },
    { id: 'pic-parrot',    type: 'pic', kind: 'shop', name: 'Perroquet',   emoji: '🦜', price: 300 },
    { id: 'pic-hero',      type: 'pic', kind: 'shop', name: 'Super-héros', emoji: '🦸', price: 300 },
    { id: 'pic-rainbow',   type: 'pic', kind: 'shop', name: 'Arc-en-ciel', emoji: '🌈', price: 300 },
    { id: 'pic-vampire',   type: 'pic', kind: 'shop', name: 'Vampire',     emoji: '🧛', price: 300 },
    { id: 'pic-flamingo',  type: 'pic', kind: 'shop', name: 'Flamant',     emoji: '🦩', price: 300 },
    { id: 'pic-bee',       type: 'pic', kind: 'shop', name: 'Abeille',     emoji: '🐝', price: 300 },
    { id: 'pic-tophat',    type: 'pic', kind: 'shop', name: 'Haut-de-forme', emoji: '🎩', price: 300 }
];

// Ordre de sortie dans la vitrine (une nouveauté de chaque type à son tour). Objets de saison : à part.
const VITRINE_ORDER = {
    frame: ['fr-checker', 'fr-dots', 'fr-neon-pink', 'fr-scales', 'fr-stripes', 'fr-parchment', 'fr-zigzag', 'fr-wood',
            'fr-neon-blue', 'fr-waves', 'fr-film', 'fr-gold', 'fr-tartan', 'fr-flowers', 'fr-music', 'fr-pixels',
            'fr-copper', 'fr-stars', 'fr-frost', 'fr-confetti', 'fr-rainbow'],
    bg: ['bg-galaxy', 'bg-sunset', 'bg-ocean', 'bg-marble', 'bg-forest', 'bg-neon', 'bg-aurora', 'bg-jade', 'bg-lavender',
         'bg-bronze', 'bg-peach', 'bg-wood', 'bg-mint', 'bg-rainbow', 'bg-cherry', 'bg-ruby', 'bg-night', 'bg-silver',
         'bg-lava', 'bg-boreal'],
    pic: ['pic-dragon', 'pic-butterfly', 'pic-peacock', 'pic-planet', 'pic-mermaid', 'pic-parrot', 'pic-hero',
          'pic-rainbow', 'pic-vampire', 'pic-flamingo', 'pic-bee', 'pic-tophat']
};
// Périodes de saison (mois-jour du lundi de la semaine) et objets vendus à ce moment-là
const VITRINE_SEASONS = [
    { id: 'halloween', from: '10-19', to: '11-01', items: ['fr-pumpkins'] },
    { id: 'noel',      from: '12-07', to: '12-21', items: ['fr-snowflakes', 'bg-snow'] },
    { id: 'valentin',  from: '02-01', to: '02-14', items: ['fr-hearts', 'bg-hearts'] }
];
