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

/* Nombre total de niveaux de la carte, défis compris (150 = 105 niveaux de
   questions + 15 niveaux Paires + 15 niveaux Ordre + 15 défis, le dernier
   niveau étant un défi).
   null = automatique : environ 5 questions par niveau. */
const TOTAL_LEVELS = 300;   // 170 → 190 → 230 (03/11) → 310 → 300 (09/11) : 130 niveaux insérés (LEVEL_LAYOUT_INSERTS)

/* Lots de questions : chaque lot remplit ses propres niveaux, pour qu'un ajout futur ne change JAMAIS les niveaux
   déjà joués. 2026-10-20 : sauvegardes remises à zéro → tout le parcours (170 niveaux) refait d'un seul lot, avec une
   seule courbe. Pour un nouveau lot plus tard : ajouter une ligne (ids, niveaux), sans toucher aux lignes existantes.
   hardFrom : où arrivent les questions très pointues (part des niveaux) ; hardCurve > 1 : elles arrivent doucement,
   puis de plus en plus souvent. */
const LEVEL_LOTS = [
    // Lot 1 : réparti EXACTEMENT comme avant sur 170 niveaux (numérotation d'origine), puis renuméroté (LEVEL_INSERTS)
    { from: 0, to: 3999, first: 1, last: 170, hardFrom: 0.25, hardCurve: 2, renumber: true },
    // Lot 3 (2026-11-03) : blocs de 10 niveaux insérés pour adoucir la courbe (ids 4000+, sujets jamais utilisés)
    { from: 4000, to: 4049, also: [4310, 4319], after: 80, hardFrom: 1, hardCurve: 1,   // also : 10 questions plus dures (09/11)
      names: ['Entre-deux', 'Pas à pas', 'Petits sommets', 'Chemins de traverse', 'Tour d’horizon', 'Escale', 'Bonne allure'] },
    { from: 4050, to: 4099, also: [4300, 4309], after: 90, hardFrom: 1, hardCurve: 1,   // also : 6 questions plus dures (09/11)
      names: ['Seconde escale', 'Belle lancée', 'Nouveaux horizons', 'À mi-hauteur', 'Pleine forme', 'Vent arrière', 'Cap tenu'] },
    // Lot 4 (2026-11-03, 2e vague) : un bloc après chacun des anciens 100, 110, 120 et 130 (ids 4100+, sujets jamais utilisés)
    { from: 4100, to: 4149, also: [4320, 4329], after: 100, hardFrom: 1, hardCurve: 1,
      names: ['Nouvel élan', 'Plein cap', 'Les éclaireurs', 'Sur la crête', 'Belle échappée', 'Grand angle', 'Pas de géant'] },
    { from: 4150, to: 4199, after: 110, hardFrom: 1, hardCurve: 1,
      names: ['Vents porteurs', 'Terres lointaines', 'Esprit d’aventure', 'Le grand saut', 'Sur la route', 'Bel horizon', 'Pleins feux'] },
    { from: 4200, to: 4249, after: 120, hardFrom: 1, hardCurve: 1,
      names: ['Haute mer', 'Les veilleurs', 'Sommets en vue', 'Le col', 'Fin limier', 'Ligne de crête', 'Œil de lynx'] },
    { from: 4250, to: 4299, also: [4330, 4339], after: 130, hardFrom: 1, hardCurve: 1,
      names: ['Les vigies', 'Dernier relais', 'Toutes voiles', 'Au long cours', 'Hautes terres', 'Cap sur les cimes', 'Le belvédère'] },
    // Lot 5 (2026-11-09, 3e vague) : un bloc facile après chacun des anciens 10, 20, …, 70 et un bloc dur après l'ancien 150
    // (bloc après l'ancien 10, ids 4400-4449 : retiré le 09/11, l'utilisateur voulait 300 niveaux et pas 310)
    { from: 4450, to: 4499, after: 20, hardFrom: 1, hardCurve: 1,
      names: ['Grains de savoir', 'Du bon pied', 'Tout en douceur', 'Petit trot', 'Fil rouge', 'Bonne pioche', 'Clins d’œil'] },
    { from: 4500, to: 4549, after: 30, hardFrom: 1, hardCurve: 1,
      names: ['Vent en poupe', 'Petits génies', 'Pas pressé', 'Belle humeur', 'Bouts de savoir', 'Main verte', 'Pièces du puzzle'] },
    { from: 4550, to: 4599, after: 40, hardFrom: 1, hardCurve: 1,
      names: ['Mine de rien', 'Coin des curieux', 'Sur la lancée', 'Petit train', 'Mise en forme', 'Pas chassés', 'Bel élan'] },
    { from: 4600, to: 4649, after: 50, hardFrom: 1, hardCurve: 1,
      names: ['Escapade', 'Rouages', 'Cœur à l’ouvrage', 'Sentiers battus', 'Pied à l’étrier', 'Remontée', 'Bonne route'] },
    { from: 4650, to: 4699, after: 60, hardFrom: 1, hardCurve: 1,
      names: ['Mi-chemin', 'Ça grimpe', 'Belle foulée', 'En cadence', 'Cap au nord', 'Deuxième souffle', 'Rythme de croisière'] },
    { from: 4700, to: 4749, after: 70, hardFrom: 1, hardCurve: 1,
      names: ['Dernier virage', 'Promenade', 'Tremplin', 'Nouveau cap', 'Bel envol', 'Juste avant', 'Pas de côté'] },
    { from: 4750, to: 4799, after: 150, hardFrom: 1, hardCurve: 1,
      names: ['Haute volée', 'Sentinelles', 'Les sages', 'Esprits affûtés', 'Fines lames', 'Œil d’aigle', 'Cimes lointaines'] }
];
/* Blocs de 10 niveaux insérés APRÈS ces anciens numéros (numérotation d'origine du lot 1, 170 niveaux), vague par vague.
   1re vague (2026-11-03) : après 80 et 90 (parcours de 190) ; 2e vague (même jour) : après 100, 110, 120 et 130 (230) ;
   3e vague (2026-11-09) : après 10, 20, …, 70 (blocs faciles) et après 150 (bloc dur) : 310 niveaux, puis le bloc après 10
   retiré le même jour (300 niveaux). Chaque disposition a sa liste dans LEVEL_LAYOUT_INSERTS (un bloc peut donc disparaître :
   ses niveaux faits et ses coffres sont oubliés, la suite reprend sa place).
   Un lot inséré dit `after: <ancien numéro>` : ses niveaux sont levelRenumber(after) + 1 à + 10.
   L'ancien niveau 81 devient le 91, l'ancien 101 le 131… Le jeu convertit les sauvegardes une seule fois, quelle que soit
   la disposition d'où elles viennent (LEVEL_LAYOUT dans script.js = nombre de vagues + 1, levelFromLayout).
   Pour une nouvelle vague : ajouter une ligne ICI (anciens numéros) + un lot par bloc, et monter LEVEL_LAYOUT. */
// Points d'insertion (anciens numéros) de chaque disposition : index 0 = disposition 1 (170 niveaux), etc.
const LEVEL_LAYOUT_INSERTS = [
    [],                                                                          // 1 : 170 niveaux
    [80, 90],                                                                    // 2 : 190 (03/11)
    [80, 90, 100, 110, 120, 130],                                                // 3 : 230 (03/11)
    [80, 90, 100, 110, 120, 130, 10, 20, 30, 40, 50, 60, 70, 150],               // 4 : 310 (09/11, une heure)
    [80, 90, 100, 110, 120, 130, 20, 30, 40, 50, 60, 70, 150]                    // 5 : 300 (09/11)
];
const LEVEL_ORIGINAL = 170;   // niveaux du lot 1 (numérotation d'origine)
const LEVEL_INSERTS = LEVEL_LAYOUT_INSERTS[LEVEL_LAYOUT_INSERTS.length - 1];
const levelRenumber = n => n + 10 * LEVEL_INSERTS.filter(x => n > x).length;
/** Niveau n d'une sauvegarde faite avec la disposition `layout` (1 = 170 niveaux d'origine, 2 = après la 1re vague…)
    → son numéro aujourd'hui. Un niveau inséré garde sa place dans son bloc. Niveau d'un bloc retiré depuis : null, ou, avec
    `near`, le numéro du niveau d'origine juste avant ce bloc. */
function levelFromLayout(n, layout, near = false) {
    if (!(n >= 1)) return n;
    const ins = LEVEL_LAYOUT_INSERTS[Math.min(LEVEL_LAYOUT_INSERTS.length, Math.max(1, layout)) - 1];
    const keys = [];
    for (let o = 1; o <= LEVEL_ORIGINAL; o++) {
        keys.push([o, 0]);
        if (ins.includes(o)) for (let j = 1; j <= 10; j++) keys.push([o, j]);
    }
    if (n > keys.length) return n - keys.length + levelRenumber(LEVEL_ORIGINAL);
    const [o, j] = keys[n - 1];
    if (j && !LEVEL_INSERTS.includes(o)) return near ? levelRenumber(o) : null;
    return levelRenumber(o) + j;
}


(function assignLevels() {
    if (!AUTO_LEVELS) return;
    const allAssigned = [];

    const PER_LEVEL = 5;        // taille visée d'un niveau (si TOTAL_LEVELS = null)
    const EVERY = 10;           // un défi tous les 10 niveaux (doit être égal à CHALLENGE_EVERY de script.js)
    const PAIRS_AT = 3;         // niveau Paires : 3, 13, 23… (comme PAIRS_AT de script.js)
    const ORDER_AT = 6;         // niveau Ordre : 6, 16, 26… (comme ORDER_AT de script.js)
    const isSpecial = lvl => lvl % EVERY === 0 || lvl % EVERY === PAIRS_AT || lvl % EVERY === ORDER_AT;
    const JITTER = 0.08;        // flou de la progression (0 = tri strict par difficulté)
    const HARD = 4.5;           // à partir de cette difficulté, une question est « très pointue »
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
        'Sans frontières', 'Énigmes en images', 'Cap au large', 'Tête bien faite', 'Les initiés',
        'Haute culture', 'Merveilles du monde', 'Grand tour', 'Pierres et légendes', 'Patrimoine',
        'Les explorateurs', 'Vue d’ensemble', 'Grand chelem', 'Hors catégorie', 'Sans filet',
        // Lot 2 (niveaux 151 à 170)
        'Nouvelle frontière', 'Terra incognita', 'Les audacieux', 'Grand oral', 'Esprit d’acier',
        'Mémoire d’éléphant', 'Les irréductibles', 'Savoir rare', 'Têtes chercheuses', 'Haute précision',
        'Cerveau d’or', 'Dernière ligne droite', 'Avant l’apothéose', 'Le dernier pas'
    ];

function assignLot(QS, firstLevel, lastLotLevel, HARD_FROM, HARD_CURVE = 1, lot = {}) {

    const oldMax = Math.max(1, ...QS.map(q => q.niveau || 1));
    const difficultyOf = q =>
        typeof q.d === 'number' ? q.d
        : 1 + 4 * ((q.niveau || 1) - 1) / Math.max(1, oldMax - 1);   // repli : d'après l'ancien niveau

    // Valeur stable entre -1 et 1 pour une question : identique pour tout le monde, à chaque lancement.
    const noise = id => (Math.imul(id ^ 0x9e3779b9, 2654435761) >>> 0) / 4294967296 * 2 - 1;

    const n = QS.length;

    // 1) Tri par difficulté (les questions très pointues sont mises à part), puis flou léger
    const byDifficulty = (a, b) => difficultyOf(a) - difficultyOf(b) || a.id - b.id;
    let hardPool = QS.filter(q => difficultyOf(q) >= HARD).sort(byDifficulty);
    const ranked = QS.filter(q => difficultyOf(q) < HARD).sort(byDifficulty);
    const keyed = ranked.map((q, i) => ({ q, key: i / Math.max(1, ranked.length - 1) + noise(q.id) * JITTER }));
    keyed.sort((a, b) => a.key - b.key || a.q.id - b.q.id);
    let pool = keyed.map(k => k.q);

    // 2) Nombre et taille des niveaux (5, ou 6 pour certains, répartis régulièrement)
    let specialCount = 0;
    for (let lvl = firstLevel; lvl <= lastLotLevel; lvl++) if (isSpecial(lvl)) specialCount++;
    const levelCount = lastLotLevel - firstLevel + 1 - specialCount;
    const base = Math.floor(n / levelCount);
    const extra = n - base * levelCount;
    const sizeOf = i => base + Math.floor(((i + 1) * extra) / levelCount) - Math.floor((i * extra) / levelCount);

    // Questions très pointues : 0 au début, puis de plus en plus (courbe HARD_CURVE) jusqu'à la fin
    const firstHard = Math.floor(levelCount * HARD_FROM);
    const hardTotal = hardPool.length;
    const hardCum = i => i < firstHard ? 0
        : Math.round(hardTotal * Math.pow((i - firstHard + 1) / (levelCount - firstHard), HARD_CURVE));
    const hardSlots = i => hardCum(i) - (i > 0 ? hardCum(i - 1) : 0);

    // 3) Équilibre des thèmes : chaque thème doit apparaître régulièrement tout au long du parcours
    const themeTotal = {};
    QS.forEach(q => { themeTotal[q.theme] = (themeTotal[q.theme] || 0) + 1; });
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
    let level = firstLevel - 1;
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
    // Lot 1 : on garde sa répartition d'origine et on décale seulement les numéros (niveaux insérés)
    if (lot.renumber) QS.forEach(q => { q.niveau = levelRenumber(q.niveau); });
    assigned.forEach((lvl, i) => allAssigned.push({
        lvl: lot.renumber ? levelRenumber(lvl) : lvl,
        name: lot.names ? lot.names[i] : NAMES[i]
    }));
}

function finish() {
    const assigned = allAssigned.map(x => x.lvl).sort((a, b) => a - b);
    // 5) Noms des niveaux
    if (AUTO_LEVEL_NAMES) {
        Object.keys(LEVEL_NAMES).forEach(k => delete LEVEL_NAMES[k]);
        allAssigned.forEach(({ lvl, name }) => { LEVEL_NAMES[lvl] = name || ('Niveau ' + lvl); });
    }
    const lastLevel = TOTAL_LEVELS || assigned[assigned.length - 1];
    for (let lvl = PAIRS_AT; lvl <= lastLevel; lvl += EVERY) LEVEL_NAMES[lvl] = 'Paires à associer';
    for (let lvl = ORDER_AT; lvl <= lastLevel; lvl += EVERY) LEVEL_NAMES[lvl] = 'Remets dans l’ordre';
    console.info('[levels.js] actif : ' + QUESTIONS.length + ' questions réparties sur ' + assigned.length + ' niveaux');
}

    LEVEL_LOTS.forEach(lot => {
        const lotQuestions = QUESTIONS.filter(q => (q.id >= lot.from && q.id <= lot.to) || (lot.also && q.id >= lot.also[0] && q.id <= lot.also[1]));
        const first = lot.after != null ? levelRenumber(lot.after) + 1 : lot.first;
        const last = lot.after != null ? first + 9 : lot.last;
        if (lotQuestions.length) assignLot(lotQuestions, first, last, lot.hardFrom, lot.hardCurve, lot);
    });
    finish();
})();