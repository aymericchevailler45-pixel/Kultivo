'use strict';

/* ============================================================
   KULTIVO — répartition automatique des questions par niveau
   ============================================================
   Ce fichier lit toutes les questions de questions.js et les range
   lui-même dans les niveaux, de la plus facile à la plus difficile :

   - la difficulté monte doucement d'un niveau à l'autre, sans paliers
     brutaux, avec un peu de « flou » volontaire (un niveau avancé
     contient aussi quelques questions plus accessibles) ;
   - chaque thème est réparti sur TOUT le parcours : on ne retrouve
     plus 14 questions de mythologie dans les 20 derniers niveaux ;
   - un niveau mélange plusieurs thèmes (2 questions du même thème
     au plus, tant que c'est possible) ;
   - les questions très pointues sont étalées sur la fin du parcours,
     à raison d'environ une par niveau ;
   - les niveaux 10, 20, 30… sont des DÉFIS : ils n'ont pas de questions
     propres, ils piochent dans les 9 niveaux précédents. Le champ
     niveau: de chaque question n'est donc plus utilisé pour jouer ;
   - les niveaux 3, 13, 23… sont des niveaux PAIRES (grilles à associer,
     voir pairs.js) et les niveaux 6, 16, 26… des niveaux ORDRE (frises à
     remettre dans l'ordre, voir order.js) : pas de questions non plus.

   POUR AJOUTER UNE QUESTION : ajoute-la dans questions.js avec un
   champ d: de 1 (très facile) à 5 (très pointu), par exemple
       { id: 2000, theme: "Sport", d: 2.5, q: "…", a: ["…"], exp: "…" }
   Sans d:, la difficulté est déduite de l'ancien champ niveau:.

   POUR DÉSACTIVER ce fichier et garder tes niveaux à la main :
   mets AUTO_LEVELS à false.
   ============================================================ */

if (typeof QUESTIONS === 'undefined' || typeof LEVEL_NAMES === 'undefined') {
    throw new Error('levels.js doit être chargé APRÈS questions.js (et avant script.js) dans index.html');
}

const AUTO_LEVELS = true;
const AUTO_LEVEL_NAMES = true;   // false = garder les noms de niveaux de questions.js

/* Nombre total de niveaux de la carte, défis compris (130 = 91 niveaux de
   questions + 13 niveaux Paires + 13 niveaux Ordre + 13 défis, le dernier
   niveau étant un défi).
   null = automatique : environ 5 questions par niveau. */
const TOTAL_LEVELS = 130;


(function assignLevels() {
    if (!AUTO_LEVELS) return;

    const PER_LEVEL = 5;        // taille visée d'un niveau (si TOTAL_LEVELS = null)
    const EVERY = 10;           // un défi tous les 10 niveaux (doit être égal à CHALLENGE_EVERY de script.js)
    const PAIRS_AT = 3;         // niveau Paires : 3, 13, 23… (comme PAIRS_AT de script.js)
    const ORDER_AT = 6;         // niveau Ordre : 6, 16, 26… (comme ORDER_AT de script.js)
    const isSpecial = lvl => lvl % EVERY === 0 || lvl % EVERY === PAIRS_AT || lvl % EVERY === ORDER_AT;
    const JITTER = 0.08;        // flou de la progression (0 = tri strict par difficulté)
    const HARD = 4.5;           // à partir de cette difficulté, une question est « très pointue »
    const HARD_FROM = 0.55;     // les questions très pointues commencent à 55 % du parcours
    const WINDOW = 18;          // nombre de questions voisines examinées pour équilibrer les thèmes
    const MAX_SAME_THEME = 2;   // au plus 2 questions du même thème par niveau (si possible)
    const POSITION_COST = 0.07; // coût de s'éloigner de l'ordre de difficulté pour équilibrer un thème

    const NAMES = [
        'Les bases', 'Échauffement', 'Premiers repères', 'Culture générale', 'Les classiques',
        'Mise en jambes', 'Grands noms', 'Incontournables', 'Curiosité', 'Nouveau souffle',
        'Terrain varié', 'Repères solides', 'Savoirs variés', 'Cap sur l’inconnu', 'Esprits curieux',
        'Entre les lignes', 'Montée en puissance', 'Carrefours', 'Deuxième vent', 'Pour les curieux',
        'Les connaisseurs', 'Haute voltige', 'Esprits brillants', 'Coups de maître', 'Mi-parcours',
        'Passionnés', 'Autres cieux', 'Nouveau palier', 'Les stratèges', 'Voyage dans le temps',
        'Remue-méninges', 'Les visionnaires', 'Pointu', 'Pour les initiés', 'Raretés',
        'Au sommet', 'Savoir solide', 'Investigations', 'Légendes', 'Plein centre',
        'Savoir absolu', 'Méli-mélo', 'Quasi-experts', 'Érudits', 'Génie',
        'Maîtres', 'Grande classe', 'Haut niveau', 'Virtuoses', 'Sommet du savoir',
        'Légendes vivantes', 'Renouveau', 'Perspectives', 'Découvertes', 'Odyssée',
        'Épopée', 'Exploration', 'Savoir étendu', 'Pionniers', 'Grandes heures',
        'Horizon lointain', 'Passeur de savoir', 'Mains de maître', 'Sommets de la culture', 'Au-delà des limites',
        'Savoirs obscurs', 'Les abysses', 'Équilibre parfait', 'Maîtres du jeu', 'Les étoiles',
        'Mythes et légendes', 'Avant le vertige', 'Ascension', 'Labyrinthe', 'Sagesse antique',
        'Énigmes', 'L’antichambre', 'Le gardien', 'Haute montagne', 'Terres inconnues',
        'Cap des géants', 'Le grand large', 'Panthéon', 'Les cimes', 'Rareté absolue',
        'Maîtrise totale', 'Grand voyage', 'Hors des sentiers', 'Tour du monde', 'Esprit vif',
        'Sans frontières', 'Dernière ligne droite', 'Avant l’apothéose', 'L’ultime marche', 'Le dernier pas'
    ];

    const oldMax = Math.max(1, ...QUESTIONS.map(q => q.niveau || 1));
    const difficultyOf = q =>
        typeof q.d === 'number' ? q.d
        : 1 + 4 * ((q.niveau || 1) - 1) / Math.max(1, oldMax - 1);   // repli : d'après l'ancien niveau

    // Valeur stable entre -1 et 1 pour une question : identique pour tout le monde, à chaque lancement.
    const noise = id => (Math.imul(id ^ 0x9e3779b9, 2654435761) >>> 0) / 4294967296 * 2 - 1;

    const n = QUESTIONS.length;

    // 1) Tri par difficulté (les questions très pointues sont mises à part), puis flou léger
    const byDifficulty = (a, b) => difficultyOf(a) - difficultyOf(b) || a.id - b.id;
    let hardPool = QUESTIONS.filter(q => difficultyOf(q) >= HARD).sort(byDifficulty);
    const ranked = QUESTIONS.filter(q => difficultyOf(q) < HARD).sort(byDifficulty);
    const keyed = ranked.map((q, i) => ({ q, key: i / Math.max(1, ranked.length - 1) + noise(q.id) * JITTER }));
    keyed.sort((a, b) => a.key - b.key || a.q.id - b.q.id);
    let pool = keyed.map(k => k.q);

    // 2) Nombre et taille des niveaux (5, ou 6 pour certains, répartis régulièrement)
    let specialCount = 0;
    if (TOTAL_LEVELS) for (let lvl = 1; lvl <= TOTAL_LEVELS; lvl++) if (isSpecial(lvl)) specialCount++;
    const levelCount = TOTAL_LEVELS
        ? TOTAL_LEVELS - specialCount
        : Math.ceil(n / PER_LEVEL);
    const base = Math.floor(n / levelCount);
    const extra = n - base * levelCount;
    const sizeOf = i => base + Math.floor(((i + 1) * extra) / levelCount) - Math.floor((i * extra) / levelCount);

    // Questions très pointues par niveau : 0 au début, puis environ 1 par niveau jusqu'à la fin
    const firstHard = Math.floor(levelCount * HARD_FROM);
    const hardTotal = hardPool.length;
    const hardCum = i => i < firstHard ? 0 : Math.round(hardTotal * (i - firstHard + 1) / (levelCount - firstHard));
    const hardSlots = i => hardCum(i) - (i > 0 ? hardCum(i - 1) : 0);

    // 3) Équilibre des thèmes : chaque thème doit apparaître régulièrement tout au long du parcours
    const themeTotal = {};
    QUESTIONS.forEach(q => { themeTotal[q.theme] = (themeTotal[q.theme] || 0) + 1; });
    const placed = {};
    let placedCount = 0;
    const deficit = theme => (themeTotal[theme] / n) * placedCount - (placed[theme] || 0);   // > 0 : thème en retard
    const markPlaced = q => { placed[q.theme] = (placed[q.theme] || 0) + 1; placedCount++; };

    function takeHard(count, perTheme) {
        const picked = [];
        for (let k = 0; k < count && hardPool.length; k++) {
            const view = hardPool.slice(0, 8);
            let best = view[0], bestScore = -Infinity;
            view.forEach((q, pos) => {
                const score = deficit(q.theme) - (perTheme[q.theme] || 0) - pos * 0.15;
                if (score > bestScore) { best = q; bestScore = score; }
            });
            picked.push(best);
            perTheme[best.theme] = (perTheme[best.theme] || 0) + 1;
            markPlaced(best);
            hardPool = hardPool.filter(x => x !== best);
        }
        return picked;
    }

    function takeLevel(size, perTheme) {
        const candidates = pool.slice(0, size + WINDOW);
        const chosen = [];
        while (chosen.length < size && candidates.length > chosen.length) {
            let best = null, bestScore = -Infinity;
            candidates.forEach((q, pos) => {
                if (chosen.includes(q) || (perTheme[q.theme] || 0) >= MAX_SAME_THEME) return;
                const score = deficit(q.theme) - (perTheme[q.theme] || 0) - pos * POSITION_COST;
                if (score > bestScore) { best = q; bestScore = score; }
            });
            if (!best) best = candidates.find(q => !chosen.includes(q));   // limite impossible à tenir : on l'assouplit
            chosen.push(best);
            perTheme[best.theme] = (perTheme[best.theme] || 0) + 1;
            markPlaced(best);
        }
        pool = pool.filter(q => !chosen.includes(q));
        return chosen;
    }

    // 4) Remplissage niveau par niveau
    let level = 0;
    const assigned = [];
    for (let i = 0; i < levelCount; i++) {
        level++;
        while (isSpecial(level)) level++;          // on saute les niveaux défis et Paires
        const size = sizeOf(i);
        const perTheme = {};
        const hard = takeHard(Math.min(hardSlots(i), size), perTheme);
        const rest = takeLevel(size - hard.length, perTheme);
        [...hard, ...rest].forEach(q => { q.niveau = level; });
        assigned.push(level);
    }
    // Sécurité : s'il reste des questions (cas très rares), on les ajoute au dernier niveau
    [...pool, ...hardPool].forEach(q => { q.niveau = assigned[assigned.length - 1]; });

    // 5) Noms des niveaux
    if (AUTO_LEVEL_NAMES) {
        Object.keys(LEVEL_NAMES).forEach(k => delete LEVEL_NAMES[k]);
        assigned.forEach((lvl, i) => { LEVEL_NAMES[lvl] = NAMES[i] || ('Niveau ' + lvl); });
    }
    const lastLevel = TOTAL_LEVELS || assigned[assigned.length - 1];
    for (let lvl = PAIRS_AT; lvl <= lastLevel; lvl += EVERY) LEVEL_NAMES[lvl] = 'Paires à associer';
    for (let lvl = ORDER_AT; lvl <= lastLevel; lvl += EVERY) LEVEL_NAMES[lvl] = 'Remets dans l’ordre';
    console.info('[levels.js] actif : ' + QUESTIONS.length + ' questions réparties sur ' + assigned.length + ' niveaux');
})();