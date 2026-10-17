'use strict';

/* ============================================================
   KULTIVO — logique de l'application
   (les questions et les noms de niveaux sont dans questions.js)
   ============================================================ */

/* ---------- Réglages ---------- */

const HEARTS_MAX = 3;            // erreurs permises par niveau avant échec
const CHALLENGE_EVERY = 10;      // un niveau défi tous les 10 niveaux
const CHALLENGE_SIZE = 10;       // nombre de questions d'un niveau défi
const CHALLENGE_HEARTS = 2;      // cœurs pendant un niveau défi
const REVIEW_MIN = 3;            // cartes de révision ajoutées à chaque niveau (minimum)
const REVIEW_MAX = 8;            // maximum : +1 place par tranche de 3 questions ratées
const REVIEW_SESSION_SIZE = 10;  // taille de la session « Réviser mes erreurs »
const STORAGE_KEY = 'cultureG_v2';

// Supabase (base de données en ligne). La clé « anon » est PUBLIQUE par conception : la sécurité vient
// des règles de la base (les joueurs peuvent seulement AJOUTER un signalement, jamais lire les autres).
// Ne jamais mettre ici la clé « service_role » / « secret ».
const SUPABASE_URL = 'https://wqfqdhsvpkczaifgosel.supabase.co';
const CLOUD_META_KEY = 'kultivo_cloud';   // { updatedAt: version en ligne connue, dirty: changements pas encore envoyés }
let sbClient = null;                       // client Supabase (bibliothèque vendor/supabase.min.js)
let cloudUser = null;                      // joueur connecté (null = pas de compte)
let cloudPushTimer = null;
let cloudBusy = false;
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxZnFkaHN2cGtjemFpZmdvc2VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNjE2NTUsImV4cCI6MjEwNzczNzY1NX0.EGJvwXjBlSQKP2N-xTNdebuSD33IevVYe6cE7NpOZMk';

// XP gagnés
const XP_FIRST_TRY = 4;          // avant: 10 | bonne réponse du premier coup
const XP_RETRY = 1;              // avant: 5  | bonne réponse après une erreur
const XP_FLAWLESS = 10;          // avant: 20 | bonus : leçon sans aucune erreur
const XP_CHALLENGE_WIN = 20;     // avant: 50 | bonus : niveau défi réussi
const XP_REVIEW_WIN = 10;        // avant: 10 | bonus : session de révision terminée
const XP_DAILY_CORRECT = 4;      // avant: 10 | par bonne réponse au défi du jour
const XP_DAILY_DONE = 10;        // avant: 20 | bonus : défi du jour terminé
const XP_SPRINT_CORRECT = 2;     // avant: 5  | par bonne réponse en sprint

// Pièces 🪙 : on en gagne en gagnant de l'XP (l'XP, lui, ne baisse jamais)
const COIN_RATE = 10;             // 1 pièce pour 10 XP gagnés
const COIN_BADGE = 5;           // bonus : nouveau badge

const DAILY_SIZE = 10;           // questions du défi du jour
const SPRINT_SECONDS = 60;       // durée du sprint
// Un niveau rapporte environ 50 à 70 XP : 60 ≈ 1 niveau, 150 ≈ 2-3 niveaux, 250 ≈ 4-5 niveaux
const GOAL_CHOICES = [
    { xp: 60,  label: 'Tranquille', reward: 10 },
    { xp: 150, label: 'Régulier',   reward: 25 },
    { xp: 250, label: 'Intense',    reward: 50 }
];
const OLD_GOALS = { 30: 60, 50: 150, 100: 250 };   // anciens objectifs → nouveaux (même rythme choisi)

// Titres selon l'XP total
const TITLES = [
    { xp: 0,    name: 'Curieux' },
    { xp: 100,  name: 'Apprenti' },
    { xp: 300,  name: 'Lecteur assidu' },
    { xp: 700,  name: 'Lettré' },
    { xp: 1200, name: 'Érudit' },
    { xp: 2000, name: 'Savant' },
    { xp: 3500, name: 'Sage' },
    { xp: 6000, name: 'Encyclopédie vivante' }
];

/* ---------- Structure des niveaux ---------- */

const maxQuestionLevel = Math.max(...QUESTIONS.map(q => q.niveau));
// Si le dernier niveau avec questions précède un défi, la carte se termine par ce défi.
const MAX_LEVEL = (maxQuestionLevel + 1) % CHALLENGE_EVERY === 0
    ? maxQuestionLevel + 1
    : maxQuestionLevel;

const isChallenge = n => n % CHALLENGE_EVERY === 0;

// Niveaux Paires (3, 13, 23…) : des grilles à associer, voir pairs.js
const PAIRS_AT = 3;              // doit être égal à PAIRS_AT de levels.js
const PAIRS_GRIDS = 3;           // grilles par niveau Paires
const PAIRS_PER_GRID = 5;        // paires par grille
const XP_PAIR = 2;               // par paire trouvée
const isPairs = n => n % CHALLENGE_EVERY === PAIRS_AT;

// Niveaux Ordre (6, 16, 26…) : des frises à remettre dans l'ordre, voir order.js
const ORDER_AT = 6;              // doit être égal à ORDER_AT de levels.js
const ORDER_ROUNDS = 3;          // frises par niveau Ordre
const XP_ORDER_CARD = 2;         // par carte bien placée
const isOrder = n => n % CHALLENGE_EVERY === ORDER_AT;
/** 4 cartes au début du parcours, 5 au milieu, 6 à la fin. */
const orderSize = level => level < 40 ? 4 : level < 85 ? 5 : 6;

// Test de placement : une étape par tranche de 10 niveaux (niveaux 1-9, 11-19, …)
// Limité à 6 étapes (départ au niveau 61 au mieux, sur 150) pour garder du jeu à faire.
const PLACEMENT_MAX_STEPS = 6;
const PLACEMENT_STEPS = Math.min(PLACEMENT_MAX_STEPS, Math.floor((MAX_LEVEL - 1) / CHALLENGE_EVERY));
const PLACEMENT_PER_STEP = 3;   // questions au plus par étape
const PLACEMENT_PASS = 2;       // bonnes réponses pour valider une étape

/* ---------- Petits utilitaires ---------- */

/** Emoji affiché en image Twemoji (dossier emoji/) : net et identique sur tous les téléphones. */
function emojiImg(emoji) {
    let cps = [...emoji].map(c => c.codePointAt(0));
    if (!cps.includes(0x200D)) cps = cps.filter(cp => cp !== 0xFE0F);   // règle de nommage de Twemoji
    const img = document.createElement('img');
    img.className = 'emoji-img';
    img.src = `emoji/${cps.map(cp => cp.toString(16)).join('-')}.svg`;
    img.alt = emoji;
    img.draggable = false;
    return img;
}

/** Les données gardent l'emoji (« 🇵🇹 »), mais on affiche la vraie image du dossier flags/ :
    plus nette, et identique sur tous les téléphones. « 🇵🇹 » → flags/pt.svg */
function flagImg(emoji) {
    const code = [...emoji].map(c => String.fromCharCode(c.codePointAt(0) - 0x1F1E6 + 97)).join('');
    const img = document.createElement('img');
    img.className = 'flag-img';
    img.src = `flags/${code}.svg`;
    img.alt = 'Drapeau';
    img.draggable = false;
    return img;
}

const $ = id => document.getElementById(id);

function el(tag, className) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    return node;
}

function shuffle(array) {
    const a = [...array];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function plural(n, one, many) {
    return `${n} ${n > 1 ? many : one}`;
}

function fmtTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m} min ${String(s).padStart(2, '0')} s` : `${s} s`;
}

function dayKey(date) {
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${m}-${d}`;
}
const todayKey = () => dayKey(new Date());
function yesterdayKey() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return dayKey(d);
}

/* Mélange reproductible : la même graine donne toujours le même ordre.
   Sert au défi du jour, identique pour tous tes amis le même jour. */
function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}
function mulberry32(seed) {
    let a = seed;
    return function () {
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
function seededShuffle(array, seedText) {
    const rnd = mulberry32(hashString(seedText));
    const a = [...array];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/* ---------- Vérification des réponses ---------- */

const ARTICLES = new Set(['le', 'la', 'les', 'l', 'un', 'une', 'des', 'du', 'de', 'd']);

function normalize(str) {
    return str
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/œ/g, 'oe').replace(/æ/g, 'ae')
        .replace(/[’'\-–—]/g, ' ')
        .replace(/[^\p{L}\p{N}\s]/gu, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function stripArticles(str) {
    return str.split(' ').filter(w => w && !ARTICLES.has(w)).join(' ');
}

function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        const cur = [i];
        for (let j = 1; j <= b.length; j++) {
            cur[j] = Math.min(
                prev[j] + 1,
                cur[j - 1] + 1,
                prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
            );
        }
        prev = cur;
    }
    return prev[b.length];
}

/* Mots génériques qu'on peut omettre en tête de réponse :
   « le musée d'Orsay » → « Orsay », « le traité de Versailles » → « Versailles ». */
const GENERIC_WORDS = new Set([
    'musee', 'lac', 'fleuve', 'riviere', 'mont', 'mer', 'ocean', 'detroit', 'ile', 'iles', 'desert',
    'golfe', 'baie', 'canal', 'chaine', 'massif', 'fosse', 'volcan',
    'traite', 'traites', 'accord', 'accords', 'bataille', 'guerre', 'festival', 'empire', 'dynastie',
    'ordonnance', 'edit', 'loi', 'echelle', 'constante', 'principe', 'paradoxe', 'theoreme',
    'couche', 'systeme', 'puce', 'attaque', 'freres', 'famille', 'palais', 'chateau', 'cathedrale',
    'congres', 'mur', 'sauce', 'fromage', 'plat', 'jeu', 'groupe', 'film', 'album', 'opera', 'ballet', 'point', 'points'
]);

/** La réponse sans ses mots génériques de tête, ou null s'il n'y en a pas. */
function answerWithoutGeneric(ans) {
    const words = ans.split(' ');
    let i = 0;
    while (i < words.length - 1 && GENERIC_WORDS.has(words[i])) i++;
    return i > 0 ? words.slice(i).join(' ') : null;
}

/** Retourne 'exact', 'typo' (faute de frappe tolérée) ou 'wrong'.
    `question` sert à refuser une réponse courte déjà écrite dans la question. */
function judge(input, rawAnswers, question = '') {
    const typed = stripArticles(normalize(input));
    if (!typed) return 'wrong';
    const numbersTyped = normalize(input).match(/\d+/g) || [];
    const questionWords = new Set(stripArticles(normalize(question)).split(' '));
    let typo = false;

    // Chaque réponse accepte aussi sa forme courte (« musée d'Orsay » → « Orsay »),
    // sauf si cette forme courte apparaît déjà dans la question.
    const answers = [];
    for (const raw of rawAnswers) {
        const ans = stripArticles(normalize(raw));
        answers.push(ans);
        const short = answerWithoutGeneric(ans);
        if (short && short.length >= 3 && !short.split(' ').every(w => questionWords.has(w))) answers.push(short);
    }

    for (const ans of answers) {
        // Réponse numérique (une date) : exacte uniquement, jamais approximative
        if (/^\d+$/.test(ans)) {
            if (numbersTyped.includes(ans)) return 'exact';
            continue;
        }

        const distance = levenshtein(typed, ans);
        if (distance === 0) return 'exact';
        const tolerance = ans.length >= 9 ? 2 : ans.length >= 5 ? 1 : 0;
        if (distance <= tolerance) typo = true;
    }
    return typo ? 'typo' : 'wrong';
}

/* ---------- État et sauvegarde ---------- */

function defaultData() {
    return {
        unlocked: 1, done: {}, streak: 0, lastDay: null, stats: {},
        xp: 0,
        dayXp: { day: null, xp: 0 },     // XP gagnés aujourd'hui
        goal: 150,                       // objectif quotidien en XP
        goalDays: {},                    // jours où l'objectif a été atteint
        totals: { right: 0, tries: 0, flawless: 0, reviews: 0, purchases: 0 },
        coins: null,                     // pièces (null = à calculer au premier chargement)
        inv: { hintLength: 0, hintLetter: 0, hintStart: 0, heart: 0, freeze: 0 },
        best: { sprint: 0, streak: 0, lastSprint: null, lastSprintRecord: false },   // lastSprint : score de la dernière partie
        daily: {},                       // résultats des défis du jour
        badges: {},                       // badge -> jour d'obtention
        claimedBadges: {},
        claimedGoals: {},
        placement: null,                 // test de placement fait : { day, start }
        placementOffered: false,         // popup de bienvenue déjà montrée
        pairStats: {},                   // niveaux Paires : « famille:élément » -> { miss, streak, last }
        sound: true,                     // sons et vibrations
        onboarded: false,                // parcours d'accueil terminé
        activeDays: {},                  // jours joués : « AAAA-MM-JJ » -> XP gagnés ce jour-là
        frozenDays: {},                  // jours manqués sauvés par un gel de série
        selfLevel: null,                 // niveau annoncé à l'accueil : 'beginner', 'average' ou 'expert'
        welcomeGift: false,              // cadeau de bienvenue déjà donné
        reports: []                      // signalements en attente d'envoi (Supabase plus tard) : [{ id, q, typed, reason… }]
    };
}

/** Remet d'équerre une sauvegarde (ex. : de nouveaux niveaux ou de nouvelles fonctions). */
function normalizeData(data) {
    const base = defaultData();
    for (const key of ['dayXp', 'totals', 'best', 'inv']) data[key] = { ...base[key], ...data[key] };
    for (const key of ['goalDays', 'daily', 'badges', 'claimedBadges', 'claimedGoals', 'stats', 'done', 'pairStats', 'activeDays', 'frozenDays']) data[key] = data[key] || {};
    if (OLD_GOALS[data.goal]) data.goal = OLD_GOALS[data.goal];
    if (!GOAL_CHOICES.some(c => c.xp === data.goal)) data.goal = GOAL_CHOICES[1].xp;
    backfillActiveDays(data);
    if (!Array.isArray(data.reports)) data.reports = [];

    if (Object.keys(data.badges).length > 0 && Object.keys(data.claimedBadges).length === 0) {
        for (const b in data.badges) data.claimedBadges[b] = true;
    }

    // Première fois qu'on voit les pièces : on offre ce qui aurait déjà été gagné
    if (typeof data.coins !== 'number') {
        data.coins = 0;
    }

    const doneLevels = Object.keys(data.done).map(Number).filter(n => data.done[n]);
    const lastDone = doneLevels.length ? Math.max(...doneLevels) : 0;
    data.unlocked = Math.max(1, data.unlocked || 1, Math.min(lastDone + 1, MAX_LEVEL));
    data.unlocked = Math.min(data.unlocked, MAX_LEVEL);
    return data;
}

/** Récupère la progression de l'ancienne version (clés cultureG_*). */
function migrateV1() {
    const data = defaultData();
    const oldUnlocked = parseInt(localStorage.getItem('cultureG_unlockedLevel'), 10);
    if (oldUnlocked > 1) {
        data.unlocked = Math.min(oldUnlocked, MAX_LEVEL);
        for (let n = 1; n < oldUnlocked && n <= MAX_LEVEL; n++) data.done[n] = true;
    }
    const oldStreak = parseInt(localStorage.getItem('cultureG_streak'), 10);
    const oldLast = parseInt(localStorage.getItem('cultureG_lastReview'), 10);
    if (oldStreak > 0 && oldLast) {
        data.streak = oldStreak;
        data.lastDay = dayKey(new Date(oldLast));
    }
    // L'ancienne version figeait une copie des questions : on l'abandonne.
    localStorage.removeItem('cultureG_data');
    return data;
}

function loadData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const data = raw ? { ...defaultData(), ...JSON.parse(raw) } : migrateV1();
        return normalizeData(data);
    } catch (err) {
        return defaultData();
    }
}

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
    } catch (err) {
        /* stockage indisponible (navigation privée…) : on continue sans sauvegarder */
    }
    cloudChanged();   // si un compte est connecté : envoi en ligne quelques secondes plus tard
}

const state = {
    data: loadData(),
    mode: 'level',          // 'level', 'challenge', 'review', 'daily' ou 'sprint'
    level: 1,
    returnTo: 'map',        // écran où revenir à la fin de la leçon
    pendingMode: 'level',   // ce que la popup va lancer : 'level', 'daily' ou 'sprint'
    pendingLevel: null,     // niveau choisi dans la popup, en attente de validation
    queue: [],              // [{ q, review }]
    current: null,
    total: 0,
    done: 0,
    errors: 0,
    correct: 0,             // bonnes réponses (défi du jour, sprint)
    grid: [],               // 🟩🟥 du défi du jour
    hearts: HEARTS_MAX,
    heartsMax: HEARTS_MAX,
    failedIds: new Set(),   // cartes déjà ratées pendant cette leçon
    sessionXp: 0,           // XP gagnés pendant cette leçon
    sessionCoins: 0,        // pièces gagnées pendant cette leçon
    hintUsed: new Set(),    // indices utilisés sur la carte en cours
    goalReached: false,     // l'objectif du jour a été atteint pendant cette leçon
    startedAt: 0,
    endsAt: 0,
    verdict: null,
    placeStep: 0,           // test de placement : étape en cours (0 = niveaux 1 à 9)
    placeRight: 0,          // bonnes réponses dans l'étape en cours
    placeWrong: 0,          // erreurs dans l'étape en cours
    canRescue: false,       // niveau raté : on peut encore continuer avec un cœur de secours
    pairGrids: [],          // niveau Paires : les grilles [{ family, pairs, matched, order }]
    pairIndex: 0,           // grille en cours
    pairSel: null,          // case sélectionnée, en attente de sa paire
    orderRounds: [],        // niveau Ordre : les frises [{ family, items, placed }]
    orderIndex: 0,          // frise en cours
    orderRight: 0,          // cartes bien placées (pour la précision)
    orderTotal: 0,          // cartes placées en tout
    phase: 'idle',          // 'answering' | 'feedback' | 'over' | 'idle'
    onEndPrimary: null,
    onEndSecondary: null
};

/* ---------- Statistiques par question ---------- */

const cardsOfLevel = n => QUESTIONS.filter(q => q.niveau === n);
const missCount = id => state.data.stats[id]?.miss || 0;
const missedCards = () => QUESTIONS.filter(q => missCount(q.id) > 0);

// Répétition espacée : après n réussites d'affilée, la question « dort » ce nombre de jours
const REVIEW_DAYS = [0, 1, 3, 7, 14, 30];
const REPLAY_MIN = 3;   // un niveau déjà terminé reprend au moins 3 questions

function recordResult(id, ok) {
    const entry = state.data.stats[id] || { miss: 0 };
    entry.miss = ok ? Math.max(0, entry.miss - 1) : entry.miss + 1;
    entry.streak = ok ? (entry.streak || 0) + 1 : 0;   // réussites d'affilée
    entry.tries = (entry.tries || 0) + 1;
    if (ok) entry.right = (entry.right || 0) + 1;
    entry.last = Date.now();
    state.data.stats[id] = entry;

    state.data.totals.tries++;
    if (ok) state.data.totals.right++;
    saveData();
}

const streakOf = id => state.data.stats[id]?.streak || 0;

/** Une question est « à revoir » si jamais vue, ratée récemment, ou si son délai est écoulé. */
function isDue(q) {
    const s = state.data.stats[q.id];
    if (!s || !s.streak || !s.last) return true;
    const days = REVIEW_DAYS[Math.min(s.streak, REVIEW_DAYS.length - 1)];
    return Date.now() - s.last >= days * 86400000;
}

/** Questions d'un niveau : toutes à la première fois, puis seulement celles qui ne sont pas maîtrisées. */
function levelCards(level) {
    const all = cardsOfLevel(level);
    if (!state.data.done[level]) return all;
    const due = all.filter(isDue);
    if (due.length >= REPLAY_MIN) return due;
    const resting = all.filter(q => !isDue(q)).sort((a, b) => streakOf(a.id) - streakOf(b.id));
    return [...due, ...resting.slice(0, REPLAY_MIN - due.length)];
}

/* ---------- XP, titres et objectif du jour ---------- */

function dayXpNow() {
    const d = state.data.dayXp;
    return d.day === todayKey() ? d.xp : 0;
}

function addXp(amount) {
    if (amount <= 0) return;
    const data = state.data;
    const today = todayKey();
    if (data.dayXp.day !== today) data.dayXp = { day: today, xp: 0 };

    const before = data.dayXp.xp;
    data.activeDays[today] = (data.activeDays[today] || 0) + amount;
    data.xp += amount;
    data.dayXp.xp += amount;
    state.sessionXp += amount;

    const coinGain = Math.round(amount / COIN_RATE);
    data.coins += coinGain;
    state.sessionCoins += coinGain;

    if (before < data.goal && data.dayXp.xp >= data.goal) {
        data.goalDays[today] = true;
        state.goalReached = true;
            }
    saveData();
    renderHeader();
}

function titleFor(xp) {
    let idx = 0;
    TITLES.forEach((t, i) => { if (xp >= t.xp) idx = i; });
    return { current: TITLES[idx], next: TITLES[idx + 1] || null };
}

/** Pièces gagnées et objectif atteint, sous les tuiles du récap (l'XP a sa propre tuile). */
function rewardSummary() {
    const lines = [];
    if (state.sessionCoins > 0) lines.push(`+${state.sessionCoins} 🪙`);
    if (state.goalReached) lines.push('🎯 Objectif atteint ! Va dans Défis pour ta récompense.');
    return lines.join('\n');
}

/** Texte « +45 XP » (et objectif atteint) affiché à la fin d'une leçon. */
function xpSummary() {
    const lines = [];
    if (state.sessionXp > 0) lines.push(`+${state.sessionXp} XP   +${state.sessionCoins} 🪙`);
    if (state.goalReached) lines.push('🎯 Objectif atteint ! Va dans Défis pour ta récompense.');
    return lines.join('\n');
}

/* ---------- Série de jours ---------- */

/** Nombre de jours entre un jour « AAAA-MM-JJ » et aujourd'hui. */
function daysSince(day) {
    const [y, m, d] = day.split('-').map(Number);
    const then = new Date(y, m - 1, d, 12);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
    return Math.round((today - then) / 86400000);
}

/** Jours entièrement manqués depuis la dernière activité. */
function missedDays() {
    const { lastDay } = state.data;
    return lastDay ? Math.max(0, daysSince(lastDay) - 1) : Infinity;
}

/** La série est vivante si aucun jour n'est manqué, ou si assez de gels les couvrent. */
function currentStreak() {
    const missed = missedDays();
    return missed <= 0 || state.data.inv.freeze >= missed ? state.data.streak : 0;
}

function bumpStreak() {
    const data = state.data;
    if (data.lastDay === todayKey()) return;
    const missed = missedDays();
    const alive = missed <= 0 || (missed !== Infinity && data.inv.freeze >= missed);
    if (alive && missed > 0) {
        data.inv.freeze -= missed;
        for (let i = 1; i <= missed; i++) data.frozenDays[daysAgoKey(i)] = true;   // pour le calendrier
        showToast(`🧊 ${plural(missed, 'gel de série utilisé', 'gels de série utilisés')} : ta série est sauvée !`);
    }
    data.streak = alive ? data.streak + 1 : 1;
    data.lastDay = todayKey();
    data.activeDays[data.lastDay] = data.activeDays[data.lastDay] || 0;
    data.best.streak = Math.max(data.best.streak, data.streak);
    saveData();
}

/* ---------- Calendrier de la série ---------- */

function daysAgoKey(n, from = new Date()) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() - n, 12);
    return dayKey(d);
}

/** Avant le calendrier, on ne gardait pas l'historique des jours joués : on le reconstitue
    une fois (série en cours, jours d'objectif atteint, défis du jour). */
function backfillActiveDays(data) {
    if (Object.keys(data.activeDays).length > 0) return;
    const mark = day => { if (day) data.activeDays[day] = data.activeDays[day] || 0; };
    Object.keys(data.goalDays).forEach(mark);
    Object.keys(data.daily).forEach(mark);
    if (data.lastDay && data.streak > 0) {
        const [y, m, d] = data.lastDay.split('-').map(Number);
        const last = new Date(y, m - 1, d, 12);
        for (let i = 0; i < data.streak; i++) mark(daysAgoKey(i, last));
    }
}

let calMonth = null;   // premier jour du mois affiché

function openStreakModal() {
    const now = new Date();
    calMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    renderStreakModal();
    $('streakModal').hidden = false;
    $('closeStreakBtn').focus();
}

function renderStreakModal() {
    const d = state.data;
    const streak = currentStreak();
    const playedToday = d.lastDay === todayKey();
    $('streakBig').textContent = streak;
    $('streakUnit').textContent = streak > 1 ? 'jours de série' : 'jour de série';
    $('streakInfo').textContent = playedToday
        ? '✅ Tu as joué aujourd’hui : ta série est à l’abri !'
        : streak > 0
        ? '⏳ Termine une leçon aujourd’hui pour garder ta série !'
        : '🌱 Termine une leçon pour lancer ta série !';
    $('streakStats').textContent =
        `🌋 Meilleure série : ${plural(Math.max(d.best.streak, streak), 'jour', 'jours')} · 🧊 Gels en stock : ${d.inv.freeze}`;

    const title = calMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    $('calTitle').textContent = title.charAt(0).toUpperCase() + title.slice(1);
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    $('calNext').disabled = calMonth >= thisMonth;
    $('calPrev').disabled = (thisMonth.getFullYear() - calMonth.getFullYear()) * 12 + thisMonth.getMonth() - calMonth.getMonth() >= 12;

    const grid = $('calGrid');
    grid.replaceChildren();
    ['L', 'M', 'M', 'J', 'V', 'S', 'D'].forEach(letter => {
        const h = el('span', 'cal-dow');
        h.textContent = letter;
        grid.append(h);
    });
    const offset = (calMonth.getDay() + 6) % 7;   // lundi en premier
    for (let i = 0; i < offset; i++) grid.append(el('span'));
    const daysInMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate();
    const today = todayKey();
    for (let n = 1; n <= daysInMonth; n++) {
        const key = dayKey(new Date(calMonth.getFullYear(), calMonth.getMonth(), n));
        const cell = el('span', 'cal-day');
        cell.textContent = n;
        if (key in d.activeDays) cell.classList.add('is-active');
        else if (d.frozenDays[key]) cell.classList.add('is-frozen');
        if (key === today) cell.classList.add('is-today');
        if (key > today) cell.classList.add('is-future');
        grid.append(cell);
    }
    // Cases vides jusqu'à 6 semaines complètes : le calendrier garde la même taille chaque mois
    for (let i = offset + daysInMonth; i < 42; i++) grid.append(el('span', 'cal-empty'));
}

function moveCalendar(delta) {
    calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + delta, 1);
    renderStreakModal();
}

/* ---------- Infos sur un niveau ---------- */

/** Questions des 9 niveaux précédents + éventuelles questions bonus du défi. */
function challengePool(level) {
    const from = level - CHALLENGE_EVERY + 1;
    const previous = QUESTIONS.filter(q => q.niveau >= from && q.niveau < level);
    const bonus = QUESTIONS.filter(q => q.niveau === level);
    return [...previous, ...bonus];
}

function levelInfo(n) {
    if (isChallenge(n)) {
        const pool = challengePool(n);
        return {
            challenge: true,
            name: `Défi ${n / CHALLENGE_EVERY}`,
            count: Math.min(CHALLENGE_SIZE, pool.length),
            reviews: 0,
            missed: pool.filter(q => missCount(q.id) > 0).length
        };
    }
    if (isPairs(n)) {
        return { challenge: false, pairs: true, name: LEVEL_NAMES[n] || 'Paires à associer', count: PAIRS_GRIDS, reviews: 0, missed: 0 };
    }
    if (isOrder(n)) {
        return { challenge: false, order: true, name: LEVEL_NAMES[n] || 'Remets dans l’ordre', count: ORDER_ROUNDS, reviews: 0, missed: 0 };
    }
    const cards = cardsOfLevel(n);
    return {
        challenge: false,
        name: LEVEL_NAMES[n] || `Niveau ${n}`,
        count: levelCards(n).length,
        reviews: pickReviewCards(n).length,   // le nombre est fixe, seul le choix des cartes est aléatoire
        missed: cards.filter(q => missCount(q.id) > 0).length
    };
}

/** « 5 questions + 3 révisions » : la taille réelle de la leçon. */
function questionsLabel(info) {
    if (info.pairs) return `${plural(PAIRS_GRIDS, 'grille', 'grilles')} de ${PAIRS_PER_GRID} paires`;
    if (info.order) return `${plural(ORDER_ROUNDS, 'frise', 'frises')} à remettre dans l’ordre, ${plural(CHALLENGE_HEARTS, 'cœur', 'cœurs')}`;
    const base = plural(info.count, 'question', 'questions');
    return info.reviews > 0 ? `${base} + ${plural(info.reviews, 'révision', 'révisions')}` : base;
}

/* ---------- Badges ---------- */

/** Statistiques sur lesquelles reposent les badges. */
function themeStats() {
    const map = {};
    QUESTIONS.forEach(q => {
        const t = map[q.theme] || (map[q.theme] = { theme: q.theme, total: 0, unlocked: 0, tries: 0, right: 0, mastered: 0 });
        t.total++;
        if (q.niveau <= state.data.unlocked) t.unlocked++;   // accessibles dans le parcours
        const s = state.data.stats[q.id];
        if (s) {
            t.tries += s.tries || 0;
            t.right += s.right || 0;
            if ((s.streak || 0) >= 3) t.mastered++;
        }
    });
    return Object.values(map).sort((a, b) => b.total - a.total || a.theme.localeCompare(b.theme, 'fr'));
}

function badgeStats() {
    const d = state.data;
    // Les niveaux validés par le test de placement ne comptent pas pour les badges
    const placedBefore = d.placement ? d.placement.start : 1;
    const doneLevels = Object.keys(d.done).map(Number).filter(n => d.done[n] && n >= placedBefore);
    const daily = Object.values(d.daily);
    return {
        levelsDone: doneLevels.filter(n => !isChallenge(n)).length,
        challengesDone: doneLevels.filter(isChallenge).length,
        bestStreak: Math.max(d.best.streak, currentStreak()),
        right: d.totals.right,
        flawless: d.totals.flawless,
        reviews: d.totals.reviews,
        dailyDone: daily.length,
        dailyPerfect: daily.some(r => r.score >= DAILY_SIZE),
        bestSprint: d.best.sprint,
        goalDays: Object.keys(d.goalDays).length,
        xp: d.xp,
        purchases: d.totals.purchases,
        mapComplete: !!d.done[MAX_LEVEL],
        themeMastered: themeStats().some(t => t.total >= 5 && t.mastered === t.total)
    };
}

const BADGES = [
    { id: 'first',     icon: '🌱', name: 'Premiers pas',        desc: 'Terminer un niveau',                    test: s => s.levelsDone >= 1 },
    { id: 'right25',   icon: '👍', name: 'Bien parti',          desc: '25 bonnes réponses du premier coup',    test: s => s.right >= 25 },
    { id: 'right100',  icon: '💯', name: 'Centenaire',          desc: '100 bonnes réponses du premier coup',   test: s => s.right >= 100 },
    { id: 'right500',  icon: '🧠', name: 'Mémoire d’éléphant',  desc: '500 bonnes réponses du premier coup',   test: s => s.right >= 500 },
    { id: 'flawless',  icon: '✨', name: 'Sans faute',          desc: 'Terminer une leçon sans erreur',        test: s => s.flawless >= 1 },
    { id: 'flawless5', icon: '💎', name: 'Perfectionniste',     desc: 'Terminer 5 leçons sans erreur',         test: s => s.flawless >= 5 },
    
    // Séries consécutives
    { id: 'streak7',   icon: '📆', name: 'Semaine parfaite',    desc: '7 jours de série consécutifs',          test: s => s.bestStreak >= 7 },
    { id: 'streak30',  icon: '🌙', name: 'Un mois d’or',        desc: '30 jours de série consécutifs',         test: s => s.bestStreak >= 30 },
    { id: 'streak90',  icon: '🌋', name: 'Trimestre d’acier',   desc: '90 jours de série consécutifs',         test: s => s.bestStreak >= 90 },
    { id: 'streak365', icon: '👑', name: 'Un an de savoir',     desc: '365 jours de série consécutifs',        test: s => s.bestStreak >= 365 },

    // Défis et modes de jeu
    { id: 'challenge', icon: '🏆', name: 'Défi relevé',         desc: 'Réussir un niveau défi',                test: s => s.challengesDone >= 1 },
    { id: 'daily',     icon: '📅', name: 'Rendez-vous du jour', desc: 'Terminer un défi du jour',              test: s => s.dailyDone >= 1 },
    { id: 'daily7',    icon: '🗓️', name: 'Fidèle du jour',      desc: 'Terminer 7 défis du jour',              test: s => s.dailyDone >= 7 },
    { id: 'daily10',   icon: '🎯', name: 'Dix sur dix',         desc: '10/10 au défi du jour',                 test: s => s.dailyPerfect },
    { id: 'sprint10',  icon: '⚡', name: 'Éclair',              desc: '10 bonnes réponses en un sprint',       test: s => s.bestSprint >= 10 },
    { id: 'sprint20',  icon: '🌩️', name: 'Foudre',              desc: '20 bonnes réponses en un sprint',       test: s => s.bestSprint >= 20 },
    
    // Engagement sur l'objectif quotidien
    { id: 'goal',      icon: '⭐', name: 'Objectif atteint',    desc: 'Atteindre l’objectif du jour',          test: s => s.goalDays >= 1 },
    { id: 'goal7',     icon: '🏅', name: 'Assidu',              desc: 'Atteindre l’objectif 7 jours',          test: s => s.goalDays >= 7 },
    { id: 'goal30',    icon: '🎖️', name: 'Discipline de fer',  desc: 'Atteindre l’objectif 30 jours',         test: s => s.goalDays >= 30 },

    // Boutique & Révisions
    { id: 'shop',      icon: '🛒', name: 'Premier achat',       desc: 'Acheter un objet à la boutique',        test: s => s.purchases >= 1 },
    { id: 'revisions', icon: '🔁', name: 'Révision en règle',   desc: 'Terminer une session de révision',      test: s => s.reviews >= 1 },
    { id: 'revisions5',icon: '📚', name: 'Réviseur assidu',     desc: 'Terminer 5 sessions de révision',       test: s => s.reviews >= 5 },
    
    // Paliers d'XP
    { id: 'xp100',     icon: '🌱', name: '100 XP',              desc: 'Cumuler 100 XP',                        test: s => s.xp >= 100 },
    { id: 'xp500',     icon: '💫', name: '500 XP',              desc: 'Cumuler 500 XP',                        test: s => s.xp >= 500 },
    { id: 'xp2000',    icon: '🌟', name: '2 000 XP',            desc: 'Cumuler 2 000 XP',                      test: s => s.xp >= 2000 },
    { id: 'xp5000',    icon: '🔥', name: '5 000 XP',            desc: 'Cumuler 5 000 XP',                      test: s => s.xp >= 5000 },

    // Maîtrise Globale
    { id: 'specialist',icon: '🎓', name: 'Spécialiste',         desc: 'Maîtriser toutes les questions d’un thème', test: s => s.themeMastered },
    { id: 'complete',  icon: '🗺️', name: 'Parcours complet',    desc: 'Terminer tous les niveaux',             test: s => s.mapComplete }
];

/** Débloque les badges mérités. `silent` évite les notifications (au chargement). */
function checkBadges(silent = false) {
    const stats = badgeStats();
    state.data.best.streak = Math.max(state.data.best.streak, stats.bestStreak);
    let earned = false;
    for (const badge of BADGES) {
        if (state.data.badges[badge.id] || !badge.test(stats)) continue;
        state.data.badges[badge.id] = todayKey();
        
        earned = true;
        if (!silent) showToast(`${badge.icon} Nouveau badge : ${badge.name} ! Va dans ton profil pour ta récompense.`);
        
    }
    if (earned) saveData();
}

function showToast(text) {
    const box = $('toasts');
    const toast = el('div', 'toast');
    toast.textContent = text;
    box.append(toast);
    setTimeout(() => toast.remove(), 4500);
}

/* ---------- Défi du jour ---------- */

/** Les mêmes 10 questions pour tout le monde un jour donné (graine = la date). */
function dailyQuestions(day) {
    const sorted = [...QUESTIONS].sort((a, b) => a.id - b.id);
    return seededShuffle(sorted, `culture-g-${day}`).slice(0, DAILY_SIZE);
}

function dailyShareText(day) {
    const r = state.data.daily[day];
    if (!r) return '';
    const [y, m, d] = day.split('-');
    return `🧠 Kultivo — Défi du jour ${d}/${m}/${y}\n${r.grid}\n${r.score}/${DAILY_SIZE} en ${fmtTime(r.seconds)}`;
}

async function copyText(text, button) {
    let ok = false;
    try {
        await navigator.clipboard.writeText(text);
        ok = true;
    } catch (err) { /* repli ci-dessous */ }
    if (!ok) {
        const area = el('textarea');
        area.value = text;
        area.style.cssText = 'position:fixed;opacity:0;';
        document.body.append(area);
        area.select();
        try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
        area.remove();
    }
    if (!ok) { window.prompt('Copie ton résultat :', text); return; }
    if (button) {
        const old = button.textContent;
        button.textContent = 'Copié ✓';
        setTimeout(() => { button.textContent = old; }, 2000);
    }
}

/* ---------- Décors latéraux ---------- */

const DECOR_ICONS = ['🌍', '📚', '🔬', '🎨', '🏛️', '🎭', '🔭', '🎻', '🧭', '📜',
                     '💡', '🚀', '⚗️', '🏺', '🎼', '🖋️', '🗺️', '🧬', '⚔️', '🏰'];

function buildDecor(container, count) {
    container.replaceChildren();
    for (let i = 0; i < count; i++) {
        const badge = el('span', `decor-badge ${i % 2 === 0 ? 'left' : 'right'} float-${(i % 3) + 1}`);
        badge.textContent = DECOR_ICONS[(i * 7 + 3) % DECOR_ICONS.length];
        // position dans la zone latérale (0,15 à 0,85), pseudo-aléatoire mais stable
        const k = 0.15 + 0.7 * (0.5 + 0.5 * Math.sin(i * 2.399));
        badge.style.setProperty('--k', k.toFixed(2));
        badge.style.setProperty('--y', `${(((i + 0.5) / count) * 100).toFixed(1)}%`);
        badge.style.setProperty('--size', `${52 + (i % 3) * 10}px`);
        badge.style.animationDelay = `${-(i % 5) * 0.9}s`;
        container.append(badge);
    }
}

/* ---------- Navigation entre écrans ---------- */

const MAIN_SCREENS = ['map', 'challenges', 'shop', 'profile'];

function showScreen(name) {
    $('mapScreen').hidden = name !== 'map';
    $('challengesScreen').hidden = name !== 'challenges';
    $('shopScreen').hidden = name !== 'shop';
    $('profileScreen').hidden = name !== 'profile';
    $('studyScreen').hidden = name !== 'study';
    $('onboardScreen').hidden = name !== 'onboard';
    $('topbar').hidden = !MAIN_SCREENS.includes(name);

    document.querySelectorAll('.nav-btn').forEach(btn => {
        const active = btn.dataset.screen === name;
        btn.classList.toggle('is-active', active);
        if (active) btn.setAttribute('aria-current', 'page');
        else btn.removeAttribute('aria-current');
    });

    if (name === 'map') renderMap();
    if (name === 'challenges') { window.scrollTo(0, 0); renderChallenges(); }
    if (name === 'shop') { window.scrollTo(0, 0); renderShop(); }
    if (name === 'profile') { window.scrollTo(0, 0); renderProfile(); }
}

/* ---------- Affichage : en-tête, carte, défis, profil ---------- */
/* ---------- Notifications du Menu ---------- */
function updateNavNotifications() {
    const data = state.data;
    
    // 1. Compter les badges non réclamés (pour l'onglet Profil)
    let unclaimedBadges = 0;
    for (const b in data.badges) {
        if (!data.claimedBadges[b]) unclaimedBadges++;
    }
    
    const profileBtn = document.querySelector('.nav-btn[data-screen="profile"]');
    const badgesTab = document.querySelector('.profile-tab[data-tab="badges"]');
    for (const target of [profileBtn, badgesTab]) {
        if (unclaimedBadges > 0) target.setAttribute('data-notif', unclaimedBadges);
        else target.removeAttribute('data-notif');
    }
    
    // 2. Vérifier si l'objectif du jour est en attente de récupération (pour l'onglet Défis)
    let unclaimedGoals = 0;
    const xp = dayXpNow();
    if (xp >= data.goal && !data.claimedGoals[todayKey()]) {
        unclaimedGoals = 1;
    }
    
    const challengesBtn = document.querySelector('.nav-btn[data-screen="challenges"]');
    if (unclaimedGoals > 0) challengesBtn.setAttribute('data-notif', unclaimedGoals);
    else challengesBtn.removeAttribute('data-notif');
}


function renderHeader() {
    $('streakDisplay').textContent = currentStreak();$('xpDisplay').textContent = state.data.xp;
    $('coinDisplay').textContent = state.data.coins;
    
    const n = missedCards().length;
    const btn = $('reviewBtn');
    btn.hidden = n === 0;
    // « à revoir » est masqué sur petit écran pour que les compteurs tiennent sur une ligne
    const label = el('span', 'chip-unit');
    label.textContent = ' à revoir';
    btn.replaceChildren(`↻ ${n}`, label);

    // NOUVEAU : Met à jour les pastilles rouges à chaque changement d'écran ou gain d'XP
    updateNavNotifications();
}

function renderMap() {
    $('placementBtn').hidden = !canTakePlacement();
    const list = $('mapPath');
    list.replaceChildren();
    let focusNode = null;

    for (let n = 1; n <= MAX_LEVEL; n++) {
        const info = levelInfo(n);
        const locked = n > state.data.unlocked;
        const done = !!state.data.done[n];

        const li = el('li', `stop${info.challenge ? ' is-challenge-stop' : ''}${info.pairs ? ' is-pairs-stop' : ''}${info.order ? ' is-order-stop' : ''}`);
        li.style.setProperty('--x', info.challenge ? '0px' : `${Math.round(Math.sin(n * 1.3) * 52)}px`);

        const status = locked ? 'is-locked' : done ? 'is-done' : 'is-current';
        const btn = el('button', `node ${status}${info.challenge ? ' is-challenge' : ''}${info.pairs ? ' is-pairs' : ''}${info.order ? ' is-order' : ''}`);
        btn.type = 'button';
        btn.disabled = locked;
        // Défis et Paires gardent leur icône dans tous les états (même verrouillés), pour les repérer de loin
        const icon = info.challenge ? '🏆' : info.pairs ? '🔗' : info.order ? '⏳' : null;
        if (icon) {
            const span = el('span', 'node-icon');
            span.textContent = icon;
            btn.append(span);
        } else {
            btn.textContent = locked ? '🔒' : done ? '✓' : String(n);
        }
        btn.setAttribute('aria-label',
            `${info.challenge ? '' : `Niveau ${n}, `}${info.name}${locked ? ', verrouillé' : done ? ', terminé' : ''}`);
        if (!locked) btn.addEventListener('click', () => openStartModal(n));

        const label = el('div', 'stop-label');
        const title = el('span', 'stop-name');
        title.textContent = info.name;
        const meta = el('span', 'stop-meta');
        meta.textContent = info.challenge
            ? `${plural(info.count, 'question', 'questions')}, ${plural(CHALLENGE_HEARTS, 'cœur', 'cœurs')}`
            : questionsLabel(info);
        label.append(title, meta);
        if (!locked && info.missed > 0) {
            const pill = el('span', 'pill');
            pill.textContent = `${info.missed} à revoir`;
            label.append(pill);
        }

        li.append(btn, label);
        list.append(li);

        if (!locked && (!done || n === state.data.unlocked)) focusNode = btn;
    }

    if (focusNode) focusNode.scrollIntoView({ block: 'center' });
}

function renderChallenges() {
    const data = state.data;

    // Objectif du jour
    const xp = dayXpNow();
    const pct = Math.min(100, Math.round((xp / data.goal) * 100));
    $('goalText').textContent = `${xp} / ${data.goal} XP`;
    $('goalBar').style.width = `${pct}%`;
    $('goalMeter').setAttribute('aria-valuenow', String(pct));
    
    // NOUVEAU : Gestion de l'affichage du bouton de récompense de l'objectif
    const today = todayKey();
    const currentChoice = GOAL_CHOICES.find(c => c.xp === data.goal) || GOAL_CHOICES[1];
    const reward = currentChoice.reward;
    const isReached = xp >= data.goal;
    const isClaimed = !!data.claimedGoals[today];

    const hintBox = $('goalHint');
    hintBox.replaceChildren(); // On vide la zone

    if (!isReached) {
        hintBox.textContent = `Encore ${data.goal - xp} XP pour gagner 🎁 ${reward} 🪙`;
    } else if (isReached && !isClaimed) {
        const claimBtn = el('button', 'btn btn-green');
        claimBtn.textContent = `🎁 Récupérer ${reward} 🪙`;
        claimBtn.style.marginTop = '10px';
        
        claimBtn.addEventListener('click', () => {
            data.claimedGoals[today] = true;
            data.coins += reward;
            saveData();
            renderHeader();
            renderChallenges(); // Met à jour l'écran pour cacher le bouton
            showToast(`🎁 +${reward} 🪙 pour ton objectif du jour !`);
        });
        
        hintBox.append(claimBtn);
    } else {
        hintBox.textContent = '✅ Récompense récupérée. À demain !';
    }

    const choices = $('goalChoices');
    choices.replaceChildren();
    // Une fois qu'on a gagné de l'XP aujourd'hui, l'objectif est verrouillé jusqu'à demain
    const locked = xp > 0;
    GOAL_CHOICES.forEach(choice => {
        const active = choice.xp === data.goal;
        const btn = el('button', `goal-choice${active ? ' is-active' : ''}`);
        btn.type = 'button';
        btn.setAttribute('aria-pressed', String(active));
        btn.disabled = locked && !active;

        const name = el('b');
        name.textContent = choice.label;
        const amount = el('span');
        amount.textContent = `${choice.xp} XP / jour`;
        const prize = el('span', 'goal-reward');
        prize.textContent = `🎁 ${choice.reward} 🪙`;
        btn.append(name, amount, prize);

        btn.addEventListener('click', () => {
            if (locked) return;
            data.goal = choice.xp;
            saveData();
            renderChallenges();
        });
        choices.append(btn);
    });
    $('goalNote').textContent = locked
        ? '🔒 Modifiable demain (tu as déjà joué aujourd’hui).'
        : 'Modifiable tant que tu n’as pas joué aujourd’hui.';

    // Défi du jour
    const result = data.daily[today];
    if (result) {
        $('dailyDesc').textContent = 'Défi terminé, bravo ! Un nouveau défi t’attend demain.';
        $('dailyScore').textContent = `${result.score}/${DAILY_SIZE}`;
        $('dailyTime').textContent = `en ${fmtTime(result.seconds)}`;
        $('dailyGrid').textContent = result.grid;
    } else {
        $('dailyDesc').textContent = `${DAILY_SIZE} questions, les mêmes pour tout le monde. Un seul essai !`;
    }
    $('dailyResult').hidden = !result;
    $('dailyCard').classList.toggle('card-violet', !result);   // cadre violet = « à faire aujourd'hui »
    $('dailyBtn').hidden = !!result;
    $('dailyCopyBtn').hidden = !result;

    // Sprint : record et dernière partie dans deux encadrés
    const { sprint: best, lastSprint, lastSprintRecord } = data.best;
    $('sprintDesc').textContent = best > 0
        ? `Réponds à un maximum de questions en ${SPRINT_SECONDS} secondes.`
        : `Réponds à un maximum de questions en ${SPRINT_SECONDS} secondes.`;
    $('sprintScores').hidden = best === 0;
    $('sprintBest').textContent = best;
    $('sprintLast').textContent = lastSprint ?? '—';
    $('sprintLastSub').textContent = lastSprintRecord ? '🎉 Nouveau record !' : 'bonnes réponses';
}

function renderProfile() {
    const data = state.data;
    const { current, next } = titleFor(data.xp);

    $('profileTitle').textContent = `🎖️ ${current.name}`;
    renderSoundBtn();
    $('profileXp').textContent = `${data.xp} XP`;
    if (next) {
        const span = next.xp - current.xp;
        const pct = Math.round(((data.xp - current.xp) / span) * 100);
        $('titleBar').style.width = `${pct}%`;
        $('titleMeter').setAttribute('aria-valuenow', String(pct));
        $('profileNext').textContent = `Encore ${next.xp - data.xp} XP pour devenir « ${next.name} ».`;
    } else {
        $('titleBar').style.width = '100%';
        $('titleMeter').setAttribute('aria-valuenow', '100');
        $('profileNext').textContent = 'Tu as atteint le plus haut titre. Respect !';
    }

    // Tuiles de résumé
    const finished = Object.keys(data.done).filter(n => data.done[n]).length;
    $('tileStreak').textContent = plural(currentStreak(), 'jour', 'jours');
    $('tileRate').textContent = data.totals.tries > 0
        ? `${Math.round((data.totals.right / data.totals.tries) * 100)} %`
        : '—';
    $('tileLevels').textContent = `${finished} / ${MAX_LEVEL}`;

    // Records
    const dailies = Object.values(data.daily);
    let bestDaily = '—';
    if (dailies.length) {
        const top = dailies.reduce((a, b) =>
            b.score > a.score || (b.score === a.score && b.seconds < a.seconds) ? b : a);
        bestDaily = `${top.score}/${DAILY_SIZE} en ${fmtTime(top.seconds)}`;
    }
    const doneCount = Object.keys(data.done).filter(n => data.done[n]).length;
    const records = [
        ['🔥 Série actuelle', plural(currentStreak(), 'jour', 'jours')],
        ['🌋 Meilleure série', plural(Math.max(data.best.streak, currentStreak()), 'jour', 'jours')],
        ['⚡ Meilleur sprint', data.best.sprint > 0 ? plural(data.best.sprint, 'bonne réponse', 'bonnes réponses') : '—'],
        ['📅 Meilleur défi du jour', bestDaily],
        ['✅ Réussies du premier coup', `${data.totals.right} sur ${data.totals.tries}`],
        ['🗺️ Niveaux terminés', `${doneCount} / ${MAX_LEVEL}`],
        ['🎯 Jours d’objectif atteint', String(Object.keys(data.goalDays).length)]
    ];
    const list = $('recordsList');
    list.replaceChildren();
    records.forEach(([label, value]) => {
        const li = el('li');
        const left = el('span');
        left.textContent = label;
        const right = el('b');
        right.textContent = value;
        li.append(left, right);
        list.append(li);
    });

    // Réussite par thème
    const bars = $('themeBars');
    bars.replaceChildren();
    themeStats().forEach(t => {
        const row = el('div', 'theme-row');
        const head = el('div', 'theme-head');
        const name = el('span');
        name.textContent = t.theme;
        const info = el('span');
        const pct = t.tries > 0 ? Math.round((t.right / t.tries) * 100) : null;
        info.textContent = pct === null ? 'pas encore joué' : `${pct} % de réussite`;
        head.append(name, info);
        const meter = el('div', 'meter');
        const fill = el('div', 'meter-fill');
        fill.style.width = `${pct ?? 0}%`;
        meter.append(fill);
        const sub = el('p', 'theme-sub');
        sub.textContent = `${t.mastered} ancrées en mémoire, ${t.unlocked} débloquées sur ${t.total} dans le jeu`;
        row.append(head, meter, sub);
        bars.append(row);
    });

    // Badges
    const grid = $('badgeGrid');
    grid.replaceChildren();
    let earned = 0;
    // Ordre d'affichage : à récupérer, puis obtenus, puis verrouillés
    const rank = b => !data.badges[b.id] ? 2 : data.claimedBadges[b.id] ? 1 : 0;
    [...BADGES].sort((a, b) => rank(a) - rank(b)).forEach(b => {
        const has = !!data.badges[b.id];
        const claimed = !!data.claimedBadges[b.id]; // NOUVEAU
        if (has) earned++;
        
        const card = el('div', `badge${has ? '' : ' is-locked'}`);
        const icon = el('div', 'badge-icon');
        icon.textContent = has ? b.icon : '🔒';
        const name = el('div', 'badge-name');
        name.textContent = b.name;
        const desc = el('div', 'badge-desc');
        desc.textContent = b.desc;
        card.append(icon, name, desc);

        // NOUVEAU : Si le badge est obtenu mais pas encore réclamé
        if (has && !claimed) {
            // On fait ressortir toute la carte visuellement
            card.style.borderColor = 'var(--green)';
            card.style.backgroundColor = 'var(--green-tint)';

            // On crée un vrai bouton vert, bien large et visible
            const claimBtn = el('button', 'btn btn-green btn-full');
            claimBtn.type = 'button';
            // « Récupérer » est masqué sur téléphone (cases plus étroites)
            const claimWord = el('span', 'chip-unit');
            claimWord.textContent = 'Récupérer ';
            claimBtn.replaceChildren('🎁 ', claimWord, `+${COIN_BADGE} 🪙`);
            claimBtn.style.marginTop = 'auto';
            claimBtn.style.padding = '8px'; // Légèrement plus fin pour bien s'intégrer à la carte
            claimBtn.style.fontSize = '0.95rem';
            
            card.append(claimBtn);

            // On déclenche la récompense au clic sur ce bouton précis
            claimBtn.addEventListener('click', () => {
                data.claimedBadges[b.id] = true;
                data.coins += COIN_BADGE;
                saveData();
                renderHeader();
                renderProfile();
                showToast(`🎁 +${COIN_BADGE} 🪙 pour le badge ${b.name} !`);
            });
        }

        grid.append(card);
    });
    $('badgeCount').textContent = `(${earned}/${BADGES.length})`;
}

/* ---------- Boutique et indices ---------- */

const PACK_SIZE = 5;   // un pack de 5 coûte le prix de 4

const SHOP = [
    { id: 'hintLength', icon: '🔤', short: 'Longueur',        name: 'Indice : longueur',
      desc: 'Le nombre de lettres et de mots de la réponse.', price: 15,  size: 'third' }, // avant: 5
    { id: 'hintLetter', icon: '🅰️', short: 'Première lettre', name: 'Indice : première lettre',
      desc: 'La première lettre de la réponse.',              price: 30, size: 'third' }, // avant: 10
    { id: 'hintStart',  icon: '🔎', short: 'Début du mot',    name: 'Indice : début du mot',
      desc: 'Les premières lettres de la réponse.',           price: 50, size: 'third' }, // avant: 20
    { id: 'heart',      icon: '💖', short: 'Cœur de secours', name: 'Cœur de secours',
      desc: 'Quand tu perds ton dernier cœur, le jeu te propose de l’utiliser pour continuer ta leçon.', price: 100, size: 'half' }, // avant: 30
    { id: 'freeze',     icon: '🧊', short: 'Gel de série',    name: 'Gel de série',
      desc: 'Protège ta série quand tu rates un jour (un gel par jour manqué). Maximum 5.', price: 200, size: 'half', max: 5 } // avant: 60
];
const HINT_IDS = ['hintLength', 'hintLetter', 'hintStart'];

/** La réponse sans son article (« Le Nil » devient « Nil »). */
function answerCore(q) {
    return q.a[0].replace(/^(?:l['’]|le\s+|la\s+|les\s+|un\s+|une\s+|du\s+|des\s+)/i, '').trim();
}

function hintText(id, q) {
    const core = answerCore(q);
    const lettersIn = word => [...word].filter(c => /[\p{L}\p{N}]/u.test(c)).length;
    if (id === 'hintLength') {
        if (/^\d+$/.test(core)) return `${core.length} chiffres`;
        const words = core.split(/\s+/);
        return words.length === 1
            ? `${lettersIn(core)} lettres`
            : `${words.length} mots (${words.map(lettersIn).join(' + ')} lettres)`;
    }
    const chars = [...core];
    if (id === 'hintLetter') return `Commence par « ${chars[0].toUpperCase()} »`;
    const n = Math.max(1, Math.min(3, Math.ceil(chars.length / 3)));
    return `Commence par « ${chars.slice(0, n).join('')}… »`;
}

function renderHintOptions() {
    const box = $('hintOptions');
    box.replaceChildren();
    $('hintCoins').textContent = `${state.data.coins} 🪙`;
    HINT_IDS.forEach(id => {
        const item = SHOP.find(i => i.id === id);
        const owned = state.data.inv[id] || 0;
        const used = state.hintUsed.has(id);
        const btn = el('button', 'btn btn-hint');
        btn.type = 'button';
        btn.textContent = used ? `${item.icon} ${item.short} (déjà utilisé)`
            : owned > 0 ? `${item.icon} ${item.short} (en stock : ${owned})`
            : `${item.icon} ${item.short} · ${item.price} 🪙`;
        btn.disabled = used || (owned === 0 && state.data.coins < item.price);
        btn.addEventListener('click', () => useHint(id));
        box.append(btn);
    });
}

function toggleHintPanel() {
    if (state.phase !== 'answering') return;
    const panel = $('hintPanel');
    panel.hidden = !panel.hidden;
    if (!panel.hidden) renderHintOptions();
}

/** Utilise un indice du stock, ou l'achète au prix de la boutique s'il n'y en a plus. */
function useHint(id) {
    if (state.phase !== 'answering' || state.hintUsed.has(id)) return;
    const item = SHOP.find(i => i.id === id);
    const data = state.data;
    if ((data.inv[id] || 0) > 0) data.inv[id]--;
    else if (data.coins >= item.price) data.coins -= item.price;
    else return;

    state.hintUsed.add(id);
    saveData();
    renderHeader();

    const list = $('hintList');
    const li = el('li');
    li.textContent = `${item.icon} ${hintText(id, state.current.q)}`;
    list.append(li);
    list.hidden = false;
    $('hintPanel').hidden = true;
    $('userInput').focus();
}

function renderShop() {
    const grid = $('shopGrid');
    grid.replaceChildren();
    const data = state.data;

    const wallet = el('article', 'card card-wallet');
    const title = el('h2');
    title.textContent = '🪙 Tes pièces';
    const big = el('p', 'card-big');
    big.textContent = plural(data.coins, 'pièce', 'pièces');
    const how = el('p', 'muted');
    how.textContent = `1 🪙 tous les ${COIN_RATE} XP gagnés. À dépenser ici !`;
    wallet.append(title, big, how);
    grid.append(wallet);

    SHOP.forEach(item => {
        const owned = data.inv[item.id] || 0;
        const card = el('article', `card shop-card shop-${item.size}`);

        const icon = el('div', 'shop-icon');
        icon.textContent = item.icon;
        const name = el('h2');
        name.textContent = item.name;
        const desc = el('p');
        desc.textContent = item.desc;
        const stock = el('p', 'muted');
        stock.textContent = `En stock : ${owned}`;

        const actions = el('div', 'card-actions');
        [[1, item.price], [PACK_SIZE, item.price * (PACK_SIZE - 1)]].forEach(([qty, cost]) => {
            const full = item.max && owned + qty > item.max;
            if (qty > 1 && item.max && item.max < qty) return;   // pas de pack pour les objets limités
            const btn = el('button', `btn ${qty === 1 ? 'btn-green' : 'btn-violet'}`);
            btn.type = 'button';
            btn.textContent = qty === 1 ? `Acheter · ${cost} 🪙` : `Pack ×${qty} · ${cost} 🪙`;
            btn.disabled = data.coins < cost || !!full;
            btn.addEventListener('click', () => buyItem(item.id, qty));
            actions.append(btn);
        });

        card.append(icon, name, desc, stock, actions);
        grid.append(card);
    });
}

function buyItem(id, qty) {
    const item = SHOP.find(i => i.id === id);
    const data = state.data;
    const cost = qty >= PACK_SIZE ? item.price * (PACK_SIZE - 1) : item.price * qty;
    if (data.coins < cost) return;
    if (item.max && (data.inv[id] || 0) + qty > item.max) {
        showToast(`Tu ne peux pas en garder plus de ${item.max}.`);
        return;
    }
    data.coins -= cost;
    data.inv[id] = (data.inv[id] || 0) + qty;
    data.totals.purchases++;
    saveData();
    renderHeader();
    renderShop();
    showToast(`${item.icon} ${item.name} : acheté !`);
    checkBadges();
}

function openReviewModal() {
    const count = Math.min(REVIEW_SESSION_SIZE, missedCards().length);
    state.pendingMode = 'review';
    state.pendingLevel = null;

    $('modalTitle').textContent = '🔁 Révisions';
    $('modalDesc').textContent = 'Prêt à rattraper tes erreurs ?';
    $('modalStatsText').textContent = plural(count, 'question', 'questions');
    showModal(false); // Le bouton de confirmation sera vert
}

/* ---------- Popup de démarrage ---------- */

function openStartModal(n) {
    const info = levelInfo(n);
    state.pendingMode = 'level';
    state.pendingLevel = n;

    $('modalTitle').textContent = info.challenge ? `🏆 ${info.name}` : info.pairs ? `🔗 Niveau ${n}` : info.order ? `⏳ Niveau ${n}` : `Niveau ${n}`;
    const bonusCount = cardsOfLevel(n).length;
    $('modalDesc').textContent = info.challenge
        ? `Un mélange des niveaux ${n - CHALLENGE_EVERY + 1} à ${n - 1}${bonusCount ? `, plus ${plural(bonusCount, 'question bonus propre à ce défi', 'questions bonus propres à ce défi')}` : ''}. Attention, seulement ${plural(CHALLENGE_HEARTS, 'cœur', 'cœurs')} !`
        : info.pairs
        ? `Associe chaque élément de gauche à son partenaire de droite, sur ${plural(PAIRS_GRIDS, 'grille', 'grilles')} à la suite. Chaque erreur coûte un cœur.`
        : info.order
        ? `Range les cartes dans le bon ordre (dates, tailles, distances…), sur ${plural(ORDER_ROUNDS, 'frise', 'frises')} à la suite. Une frise fausse coûte un cœur, et tu n’en as que ${CHALLENGE_HEARTS} !`
        : info.name;
    $('modalStatsText').textContent = questionsLabel(info);

    showModal(info.challenge);
}

/** Popup de validation du défi du jour et du sprint (comme pour les niveaux). */
function openChallengeModal(mode) {
    const daily = mode === 'daily';
    state.pendingMode = mode;
    state.pendingLevel = null;

    $('modalTitle').textContent = daily ? '📅 Défi du jour' : '⚡ Sprint';
    $('modalDesc').textContent = daily
        ? `${DAILY_SIZE} questions, les mêmes pour tous tes amis aujourd’hui. Un seul essai !`
        : `Réponds à un maximum de questions en ${SPRINT_SECONDS} secondes.`;
    $('modalStatsText').textContent = daily
        ? 'Pas de cœurs, pas de seconde chance'
        : (state.data.best.sprint > 0
            ? `Ton record : ${plural(state.data.best.sprint, 'bonne réponse', 'bonnes réponses')}`
            : 'Pas encore de record');
    showModal(daily);
}

/* ---------- Test de placement ---------- */

/** Proposé seulement tant qu'aucun niveau n'est terminé et que le test n'a pas été fait. */
function canTakePlacement() {
    const d = state.data;
    return !d.placement && !Object.values(d.done).some(Boolean);
}

/** 3 questions tirées dans les niveaux de l'étape (ex. étape 0 : niveaux 1 à 9). */
function placementCards(step) {
    const from = step * CHALLENGE_EVERY + 1;
    const to = from + CHALLENGE_EVERY - 2;
    const pool = QUESTIONS.filter(q => q.niveau >= from && q.niveau <= to);
    return shuffle(pool).slice(0, PLACEMENT_PER_STEP).map(q => ({ q, review: false }));
}

function openPlacementModal(welcome = false) {
    state.pendingMode = 'placement';
    state.pendingLevel = null;

    $('modalTitle').textContent = welcome ? '👋 Bienvenue ! Un test de placement ?' : '🧭 Test de placement';
    const maxStart = PLACEMENT_STEPS * CHALLENGE_EVERY + 1;
    $('modalDesc').textContent = `Ce test sert à te placer sur le parcours selon ta culture G. Les questions sont de plus en plus dures : chaque étape réussie te fait sauter 10 niveaux, jusqu’au niveau ${maxStart}. Le test s’arrête dès que tu rates une étape, et tu démarres là.`;
    $('modalStatsText').textContent = `${PLACEMENT_STEPS} étapes · 2 bonnes réponses sur 3 pour en passer une · sans XP ni cœurs`;
    $('startLevelBtn').textContent = 'Faire le test de placement';
    $('modalSecondaryBtn').textContent = 'Non merci, je commence au niveau 1';
    $('modalSecondaryBtn').hidden = false;
    showModal(true);
}

/** Après chaque réponse : étape validée, test terminé, ou question suivante. */
function placementAnswer(ok) {
    if (ok) state.placeRight++;
    else state.placeWrong++;
    state.done++;

    if (state.placeRight >= PLACEMENT_PASS) {
        state.placeStep++;
        state.placeRight = 0;
        state.placeWrong = 0;
        if (state.placeStep >= PLACEMENT_STEPS) { endSession(true); return; }
        state.queue = placementCards(state.placeStep);
        if (!state.queue.length) { endSession(true); return; }
    } else if (state.placeWrong > PLACEMENT_PER_STEP - PLACEMENT_PASS || !state.queue.length) {
        endSession(true);
        return;
    }
    showCard();
}

/** Valide les niveaux passés et débloque le niveau de départ. */
function applyPlacement(start) {
    const d = state.data;
    for (let n = 1; n < start; n++) d.done[n] = true;
    d.unlocked = Math.max(d.unlocked, Math.min(start, MAX_LEVEL));
    d.placement = { day: todayKey(), start };
}

function showModal(violet) {
    const start = $('startLevelBtn');
    start.classList.toggle('btn-green', !violet);
    start.classList.toggle('btn-violet', violet);
    $('startModal').querySelector('.modal-content').classList.toggle('is-challenge', violet);
    $('startModal').hidden = false;
    start.focus();
}

function closeStartModal() {
    $('startModal').hidden = true;
    $('startLevelBtn').textContent = 'Commencer';
    $('modalSecondaryBtn').hidden = true;
    state.pendingLevel = null;
    state.pendingMode = 'level';
}

/* ---------- Lancer une leçon ---------- */

/** Tirage au sort pondéré, sans remise : un poids plus fort = plus de chances. */
function weightedPick(items, weightOf, k) {
    const pool = [...items];
    const picked = [];
    while (picked.length < k && pool.length) {
        const total = pool.reduce((sum, it) => sum + weightOf(it), 0);
        let r = Math.random() * total;
        let idx = pool.findIndex(it => (r -= weightOf(it)) < 0);
        if (idx === -1) idx = pool.length - 1;
        picked.push(pool.splice(idx, 1)[0]);
    }
    return picked;
}

/**
 * Révisions d'un niveau normal.
 * - Le nombre de places grandit avec le nombre de questions ratées (3 à 8).
 * - On pioche dans TOUTES les erreurs, de n'importe quel niveau (hors celui qu'on joue).
 * - Tirage pondéré : plus une question est ratée, plus elle a de chances de sortir,
 *   mais ce n'est jamais toujours les mêmes.
 * - S'il reste des places, on complète avec des questions dues des niveaux précédents.
 */
function pickReviewCards(level) {
    const others = QUESTIONS.filter(q => q.niveau !== level);
    const missed = others.filter(q => missCount(q.id) > 0);
    const slots = Math.min(REVIEW_MAX, REVIEW_MIN + Math.floor(missed.length / 3));

    const picked = weightedPick(missed, q => missCount(q.id) * 2 + 1, slots);
    if (picked.length < slots) {
        const fill = QUESTIONS.filter(q => q.niveau < level && missCount(q.id) === 0 && isDue(q));
        picked.push(...weightedPick(fill, q => 1 / (1 + streakOf(q.id)), slots - picked.length));
    }
    return picked;
}

/** Cartes d'un défi : la moitié (au plus) de questions ratées, le reste selon la maîtrise. */
function pickChallengeCards(level) {
    const pool = challengePool(level);
    const half = Math.floor(CHALLENGE_SIZE / 2);
    const missed = shuffle(pool.filter(q => missCount(q.id) > 0))
        .sort((a, b) => missCount(b.id) - missCount(a.id));
    const unmissed = pool.filter(q => missCount(q.id) === 0);
    const rest = weightedPick(unmissed, q => 1 / (1 + streakOf(q.id)), unmissed.length);
    const picked = [...missed.slice(0, half), ...rest, ...missed.slice(half)];
    return shuffle(picked.slice(0, CHALLENGE_SIZE));
}

function startSession(requestedMode, level = 0) {
    const mode = requestedMode !== 'level' ? requestedMode
               : isChallenge(level) ? 'challenge'
               : isPairs(level) ? 'pairs'
               : isOrder(level) ? 'order'
               : 'level';
    const pairsMode = mode === 'pairs';
    const orderMode = mode === 'order';

    let items;
    if (pairsMode) {
        items = buildPairGrids(level);   // ici, items = les grilles
    } else if (orderMode) {
        items = buildOrderRounds(level); // ici, items = les frises
    } else if (mode === 'daily') {
        if (state.data.daily[todayKey()]) return;   // déjà fait aujourd'hui
        items = dailyQuestions(todayKey()).map(q => ({ q, review: false }));
    } else if (mode === 'sprint') {
        items = shuffle(QUESTIONS).map(q => ({ q, review: false }));
    } else if (mode === 'placement') {
        items = placementCards(0);
    } else if (mode === 'challenge') {
        items = pickChallengeCards(level).map(q => ({ q, review: false }));
    } else if (mode === 'level') {
        const fresh = levelCards(level).map(q => ({ q, review: false }));
        const old = pickReviewCards(level).map(q => ({ q, review: true }));
        items = shuffle([...fresh, ...old]);
    } else {
        items = shuffle(missedCards())
            .sort((a, b) => missCount(b.id) - missCount(a.id))
            .slice(0, REVIEW_SESSION_SIZE)
            .map(q => ({ q, review: true }));
    }
    if (!items.length) return;

    const hasHearts = mode === 'level' || mode === 'challenge' || pairsMode || orderMode;
    // Défis et niveaux Ordre : 2 cœurs (une frise fausse coûte un cœur : on peut en rater une seule)
    const heartsMax = mode === 'challenge' || orderMode ? CHALLENGE_HEARTS : HEARTS_MAX;
    Object.assign(state, {
        mode, level,
        returnTo: mode === 'daily' || mode === 'sprint' ? 'challenges' : 'map',
        queue: pairsMode || orderMode ? [] : items,
        total: pairsMode ? items.reduce((sum, g) => sum + g.pairs.length, 0) : items.length,
        orderRounds: orderMode ? items : [],
        orderIndex: 0,
        orderRight: 0,
        orderTotal: 0,
        pairGrids: pairsMode ? items : [],
        pairIndex: 0,
        pairSel: null,
        done: 0,
        errors: 0,
        correct: 0,
        grid: [],
        hearts: heartsMax,
        heartsMax,
        failedIds: new Set(),
        sessionXp: 0,
        sessionCoins: 0,
        goalReached: false,
        placeStep: 0,
        placeRight: 0,
        placeWrong: 0,
        lastAnswer: null,
        startedAt: Date.now(),
        verdict: null,
        phase: 'idle'
    });

    $('hearts').hidden = !hasHearts;
    $('timer').hidden = mode !== 'sprint';
    renderHearts();
    $('endView').hidden = true;
    showScreen('study');
    window.scrollTo(0, 0);
    if (pairsMode) showPairsGrid();
    else if (orderMode) showOrderRound();
    else showCard();
    if (mode === 'sprint') startTimer();
}

/* ---------- Niveaux Paires ---------- */

/** Difficulté visée par un niveau Paires : environ 1,1 au niveau 3, 4,4 au niveau 113. */
const pairTarget = level => 1 + 3.5 * level / MAX_LEVEL;

/** Choisit 3 familles (de thèmes différents si possible) ayant assez de paires du bon niveau. */
function buildPairGrids(level) {
    const t = pairTarget(level);
    const nearCount = f => f.pairs.filter(p => Math.abs(p[2] - t) <= 1.2).length;
    // Tirage pondéré : une famille avec des paires ratées a plus de chances de sortir
    const missedIn = f => f.pairs.filter(pr => pairMiss(pairKey(f, pr[0])) > 0).length;
    const adapted = PAIR_FAMILIES.filter(f => nearCount(f) >= PAIRS_PER_GRID);
    const eligible = weightedPick(adapted, f => 1 + missedIn(f), adapted.length);
    const families = [];
    for (const f of eligible) {
        if (families.length < PAIRS_GRIDS && !families.some(g => g.theme === f.theme)) families.push(f);
    }
    // Pas assez de familles adaptées : on complète avec les plus proches du niveau
    const fallback = [...PAIR_FAMILIES].sort((a, b) => nearCount(b) - nearCount(a));
    for (const f of [...eligible, ...fallback]) {
        if (families.length < PAIRS_GRIDS && !families.includes(f)) families.push(f);
    }
    return families.map(family => ({ family, pairs: pickPairs(family, t), matched: new Set(), failed: new Set(), order: null }));
}

/* Statistiques des paires (même principe que les questions : révisions et répétition espacée) */
const pairKey = (family, left) => `${family.id}:${left}`;
const pairMiss = key => state.data.pairStats[key]?.miss || 0;

function pairIsDue(key) {
    const s = state.data.pairStats[key];
    if (!s || !s.streak || !s.last) return true;
    const days = REVIEW_DAYS[Math.min(s.streak, REVIEW_DAYS.length - 1)];
    return Date.now() - s.last >= days * 86400000;
}

function recordPair(key, ok) {
    const entry = state.data.pairStats[key] || { miss: 0 };
    entry.miss = ok ? Math.max(0, entry.miss - 1) : entry.miss + 1;
    entry.streak = ok ? (entry.streak || 0) + 1 : 0;
    entry.last = Date.now();
    state.data.pairStats[key] = entry;
    saveData();
}

/** 5 paires proches de la difficulté visée (avec un peu de hasard), jamais deux fois le même élément.
    Une paire ratée passe devant (si elle n'est pas beaucoup plus dure), une paire bien sue passe derrière. */
function pickPairs(family, t) {
    const sorted = family.pairs
        .map(p => {
            const key = pairKey(family, p[0]);
            let score = Math.abs(p[2] - t) + Math.random() * 0.6;
            if (pairMiss(key) > 0 && p[2] <= t + 1.2) score -= 1.5;
            else if (!pairIsDue(key)) score += 0.8;
            return { p, key: score };
        })
        .sort((a, b) => a.key - b.key)
        .map(x => x.p);
    const picked = [];
    const lefts = new Set();
    const rights = new Set();
    for (const [left, right] of sorted) {
        if (lefts.has(left) || rights.has(right)) continue;
        picked.push({ left, right, key: pairKey(family, left) });
        lefts.add(left);
        rights.add(right);
        if (picked.length === PAIRS_PER_GRID) break;
    }
    return picked;
}

function showPairsGrid() {
    const grid = state.pairGrids[state.pairIndex];
    const f = grid.family;
    state.phase = 'pairs';
    state.pairSel = null;
    if (!grid.order) {
        const indexes = grid.pairs.map((_, i) => i);
        grid.order = { left: shuffle(indexes), right: shuffle(indexes) };
    }

    $('cardView').hidden = true;
    $('endView').hidden = true;
    $('orderView').hidden = true;
    $('pairsView').hidden = false;
    hideFeedback();
    $('pairsTag').textContent = f.theme;
    $('pairsLeftHead').textContent = f.left;
    $('pairsRightHead').textContent = f.right;
    $('pairsStep').textContent = `Grille ${state.pairIndex + 1}/${state.pairGrids.length}`;
    $('pairsTitle').textContent = f.title;

    const make = (side, i, text) => {
        const b = el('button', 'pair-btn');
        b.type = 'button';
        b.textContent = text;
        b.dataset.side = side;
        b.dataset.idx = String(i);
        if (grid.matched.has(i)) { b.classList.add('is-matched'); b.disabled = true; }
        if (side === 'left' && f.bigLeft) {   // drapeaux : une vraie image à la place de l'emoji
            b.classList.add('is-big');
            b.replaceChildren(flagImg(text));
            b.setAttribute('aria-label', 'Drapeau');
        }
        b.addEventListener('click', () => pickPair(b));
        return b;
    };
    // Chaque case est placée à sa ligne : les deux cases d'une même ligne ont toujours la même hauteur
    const box = $('pairsGrid');
    box.querySelectorAll('.pair-btn').forEach(b => b.remove());
    grid.order.left.forEach((i, row) => {
        const b = make('left', i, grid.pairs[i].left);
        b.style.gridArea = `${row + 2} / 1`;
        box.append(b);
    });
    grid.order.right.forEach((i, row) => {
        const b = make('right', i, grid.pairs[i].right);
        b.style.gridArea = `${row + 2} / 3`;
        box.append(b);
    });
    $('pairsSep').style.gridArea = `2 / 2 / span ${grid.pairs.length} / 3`;
    updateProgress();
}

/** Un clic sur une case : on la sélectionne, ou on vérifie la paire avec la case de l'autre colonne. */
function pickPair(btn) {
    if (state.phase !== 'pairs' || btn.disabled) return;
    const sel = state.pairSel;
    if (sel) sel.classList.remove('is-selected');
    if (!sel || sel.dataset.side === btn.dataset.side) {
        state.pairSel = sel === btn ? null : btn;   // recliquer sur une case la désélectionne
        if (state.pairSel) btn.classList.add('is-selected');
        return;
    }
    state.pairSel = null;
    const grid = state.pairGrids[state.pairIndex];
    const session = state.startedAt;
    const stillHere = () => state.startedAt === session && !$('studyScreen').hidden;

    if (sel.dataset.idx === btn.dataset.idx) {
        const i = Number(btn.dataset.idx);
        grid.matched.add(i);
        if (!grid.failed.has(i)) recordPair(grid.pairs[i].key, true);   // réussie sans erreur avant
        state.done++;
        addXp(XP_PAIR);
        playSound(grid.matched.size === grid.pairs.length ? 'good' : 'pair');
        [sel, btn].forEach(b => { b.classList.add('is-ok'); b.disabled = true; });
        setTimeout(() => [sel, btn].forEach(b => { b.classList.remove('is-ok'); b.classList.add('is-matched'); }), 450);
        updateProgress();
        if (grid.matched.size === grid.pairs.length) {
            state.phase = 'idle';
            setTimeout(() => { if (stillHere()) nextPairGrid(); }, 800);
        }
    } else {
        state.errors++;
        playSound('bad');
        // Les deux paires concernées comptent comme ratées (une seule fois par grille)
        for (const b of [sel, btn]) {
            const i = Number(b.dataset.idx);
            if (!grid.failed.has(i)) { grid.failed.add(i); recordPair(grid.pairs[i].key, false); }
        }
        [sel, btn].forEach(b => { b.classList.remove('is-wrong'); void b.offsetWidth; b.classList.add('is-wrong'); });
        setTimeout(() => [sel, btn].forEach(b => b.classList.remove('is-wrong')), 500);
        state.hearts--;
        renderHearts({ lost: true });
        if (state.hearts <= 0) {
            state.phase = 'idle';
            setTimeout(() => { if (stillHere()) endSession(false); }, 600);
        }
    }
}

function nextPairGrid() {
    state.pairIndex++;
    if (state.pairIndex >= state.pairGrids.length) endSession(true);
    else showPairsGrid();
}

/** Clavier ouvert = le champ de réponse a le focus ET l'écran visible a nettement rétréci.
    Le style « keyboard-open » réduit alors images et question pour que tout tienne au-dessus du clavier. */
// Hauteur de l'écran visible SANS clavier (la plus grande vue depuis le lancement ou le dernier changement d'orientation)
let fullViewportHeight = 0;
let keyboardHeightSeen = 0;   // hauteur visible quand le clavier est ouvert (0 = jamais vu)
window.addEventListener('orientationchange', () => { fullViewportHeight = 0; keyboardHeightSeen = 0; });

/* La hauteur « clavier ouvert » est enregistrée sur l'appareil (avec la hauteur sans clavier qui va avec) :
   dès la première question après un relancement, la mise en page est déjà la bonne. */
const KEYBOARD_KEY = 'kultivo_keyboard';
function loadKeyboardMemory() {
    try {
        const saved = JSON.parse(localStorage.getItem(KEYBOARD_KEY) || 'null');
        const vv = window.visualViewport;
        const full = vv ? vv.height : window.innerHeight;
        // Même écran (même orientation, même taille) que lors de l'enregistrement ?
        if (saved && Math.abs(saved.full - full) < 40) {
            fullViewportHeight = saved.full;
            keyboardHeightSeen = saved.kb;
        }
    } catch (err) { /* stockage indisponible : on recalculera */ }
}
function saveKeyboardMemory() {
    try {
        localStorage.setItem(KEYBOARD_KEY, JSON.stringify({ full: Math.round(fullViewportHeight), kb: Math.round(keyboardHeightSeen) }));
    } catch (err) { /* tant pis */ }
}

function updateKeyboardMode() {
    const vv = window.visualViewport;
    const focused = document.activeElement === $('userInput');
    const height = vv ? vv.height : window.innerHeight;
    fullViewportHeight = Math.max(fullViewportHeight, height);
    // Le curseur peut être dans le champ sans que le clavier soit ouvert (focus automatique) :
    // on ne passe en compact que si l'écran visible a vraiment rétréci.
    const keyboardShown = height < fullViewportHeight - 150;
    if (focused && keyboardShown && Math.abs(height - keyboardHeightSeen) > 2) {
        keyboardHeightSeen = height;   // hauteur d'écran AVEC clavier, mémorisée et enregistrée
        saveKeyboardMemory();
    }
    // Une fois le clavier vu, on garde la mise en page compacte : entre deux questions, le clavier se ferme
    // une fraction de seconde puis se rouvre ; sans ça, tout changerait de taille à chaque question.
    // Même format pendant la question ET sa correction (demande de l'utilisateur) : la taille ne change jamais
    document.body.classList.toggle('keyboard-open', keyboardHeightSeen > 0);
}

/** Clavier ouvert : mesure la place libre sous « Vérifier » et la donne à l'image et à la question
    (variable CSS --fit). On vérifie après coup que rien ne passe sous le clavier, sinon on réduit. */
function fitToKeyboard() {
    // Pendant la correction (ou hors leçon), on ne touche à rien : même taille que pendant la question
    if (state.phase !== 'answering' || $('studyScreen').hidden) return;
    const root = document.documentElement.style;
    root.setProperty('--fit', '0px');
    const vv = window.visualViewport;
    if (!vv || !document.body.classList.contains('keyboard-open')) return;
    // On calcule avec la hauteur « clavier ouvert » mémorisée, même si le clavier n'est pas encore revenu
    const visible = keyboardHeightSeen || vv.height;
    const free = () => visible - ($('answerActions').getBoundingClientRect().bottom + window.scrollY) - 12;
    let extra = Math.min(Math.max(0, free()), 160);
    for (let i = 0; i < 3 && extra > 0; i++) {
        root.setProperty('--fit', `${Math.round(extra)}px`);
        const left = free();
        if (left >= 0) break;
        extra = Math.max(0, extra + left);   // ça déborde : on reprend la place en trop
    }
    root.setProperty('--fit', `${Math.round(extra)}px`);
}

/** Clavier ouvert sur téléphone : si toute la question tient au-dessus du clavier, on remonte en haut
    de l'écran ; sinon on fait défiler juste assez pour voir les boutons (la barre du haut reste collée). */
function keepAnswerVisible() {
    const vv = window.visualViewport;
    if (!vv || $('studyScreen').hidden || state.phase !== 'answering') return;
    // Si tout tient au-dessus du clavier : on remonte tout en haut (barre des vies et question visibles).
    // Sinon : on défile juste assez pour voir les boutons, sans laisser de vide en dessous.
    const actionsBottom = $('answerActions').getBoundingClientRect().bottom + window.scrollY;
    const visible = vv.height;
    const target = actionsBottom + 8 <= visible ? 0 : Math.round(actionsBottom - visible + 8);
    if (Math.abs(window.scrollY - target) > 2) window.scrollTo(0, target);   // pas de défilement inutile
}

/** Profil sur téléphone : n'affiche qu'une section à la fois (sur grand écran, tout reste visible). */
function setProfileTab(name) {
    $('profileGrid').dataset.tab = name;
    document.querySelectorAll('.profile-tab').forEach(tab => {
        const active = tab.dataset.tab === name;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', String(active));
    });
}

/** Popup « Quitter ? » : le message dit ce qui sera perdu selon le mode. */
function openQuitModal() {
    const messages = {
        level:     'Ta progression dans ce niveau sera perdue.',
        challenge: 'Ta progression dans ce défi sera perdue.',
        pairs:     'Ta progression dans ce niveau sera perdue.',
        order:     'Ta progression dans ce niveau sera perdue.',
        review:    'Ta session de révision sera perdue.',
        daily:     'Ton défi du jour ne sera pas enregistré. Tu pourras le recommencer.',
        sprint:    'Ce sprint ne sera pas enregistré (le chrono continue pendant ce message).',
        placement: 'Le test de placement sera annulé. Tu pourras le refaire plus tard.'
    };
    $('quitTitle').textContent = state.mode === 'placement' ? 'Quitter le test ?' : 'Quitter ?';
    $('quitDesc').textContent = messages[state.mode] || messages.level;
    $('quitModal').hidden = false;
    $('quitStayBtn').focus();
}

function closeQuitModal() {
    $('quitModal').hidden = true;
    if (state.phase === 'answering') $('userInput').focus();
}

function returnToMap() {
    stopTimer();
    state.phase = 'idle';
    hideFeedback();
    renderHeader();
    showScreen(state.returnTo);
}

/* ---------- Minuteur du sprint ---------- */

let timerId = null;

function startTimer() {
    stopTimer();
    state.endsAt = Date.now() + SPRINT_SECONDS * 1000;
    tickTimer();
    timerId = setInterval(tickTimer, 200);
}

function stopTimer() {
    if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
    }
}

function tickTimer() {
    const left = Math.max(0, state.endsAt - Date.now());
    const seconds = Math.ceil(left / 1000);
    $('timer').textContent = `⏱ ${seconds}`;
    $('timer').classList.toggle('is-low', seconds <= 10);
    updateProgress();
    if (left <= 0 && state.phase !== 'over') {
        stopTimer();
        $('quitModal').hidden = true;   // le sprint se termine même si la popup « Quitter ? » est ouverte
        state.lastAnswer = countLastSprintAnswer();
        hideFeedback();
        endSession(true);
    }
}

/** Fin du sprint : la réponse en cours compte, même si on n'a pas eu le temps de cliquer sur
    « Vérifier » (texte tapé) ou sur « Continuer » (réponse déjà vérifiée). Renvoie true, false ou null. */
function countLastSprintAnswer() {
    let ok = null;
    if (state.phase === 'answering') {
        const typed = $('userInput').value.trim();
        if (typed) ok = judge(typed, state.current.q.a, state.current.q.q) !== 'wrong';
    } else if (state.phase === 'feedback') {
        ok = state.verdict !== 'wrong';
    }
    if (ok === null) return null;
    recordResult(state.current.q.id, ok);
    if (ok) {
        state.correct++;
        addXp(XP_SPRINT_CORRECT);
    }
    return ok;
}

/* ---------- Déroulé d'une leçon ---------- */

/** Les cœurs en haut de la leçon.
    risk : le prochain cœur à perdre clignote (réponse fausse, avant « Continuer »).
    lost : le cœur qu'on vient de perdre se brise et la rangée tremble. */
function renderHearts({ risk = false, lost = false } = {}) {
    const box = $('hearts');
    const left = Math.max(0, state.hearts);
    box.replaceChildren();
    for (let i = 0; i < state.heartsMax; i++) {
        const heart = el('span', 'heart');
        heart.textContent = i < left ? '❤️' : '🤍';
        if (risk && i === left - 1) heart.classList.add('is-risk');
        if (lost && i === left) heart.classList.add('is-lost');
        box.append(heart);
    }
    if (lost) {
        box.classList.remove('shake');
        void box.offsetWidth;   // relance l'animation
        box.classList.add('shake');
    }
    box.setAttribute('aria-label', `${left} cœur(s) restant(s)`);
}

function updateProgress() {
    let pct;
    if (state.mode === 'sprint') {
        const left = Math.max(0, state.endsAt - Date.now());
        pct = Math.round((1 - left / (SPRINT_SECONDS * 1000)) * 100);
    } else if (state.mode === 'placement') {
        pct = Math.round((state.placeStep / PLACEMENT_STEPS) * 100);
    } else {
        pct = state.total ? Math.round((state.done / state.total) * 100) : 0;
    }
    $('progressBar').style.width = `${pct}%`;
    $('progress').setAttribute('aria-valuenow', String(pct));
}

function showCard() {
    const item = state.queue[0];
    state.current = item;
    state.verdict = null;
    state.phase = 'answering';

    $('cardTag').textContent = item.q.theme;
    $('reviewTag').hidden = !item.review;

    const tag = $('challengeTag');
    tag.hidden = !['challenge', 'daily', 'sprint', 'placement'].includes(state.mode);
    tag.textContent = state.mode === 'daily' ? `Défi du jour · ${state.done + 1}/${state.total}`
                    : state.mode === 'sprint' ? 'Sprint'
                    : state.mode === 'placement' ? `Placement · étape ${state.placeStep + 1}/${PLACEMENT_STEPS}`
                    : 'Défi';
    $('questionText').textContent = item.q.q;
    $('questionFlag').hidden = !item.q.flag;           // questions « Drapeaux » : grand drapeau en image
    $('questionFlag').replaceChildren(...(item.q.flag ? [flagImg(item.q.flag)] : []));
    $('questionRebus').hidden = !item.q.rebus;         // rébus : emojis en images, dans l'ordre des mots
    $('questionRebus').replaceChildren(...(item.q.rebus || []).map(emojiImg));
    $('rebusTag').hidden = !item.q.rebus;
    $('questionPhoto').hidden = !item.q.photo;         // monuments : photo + auteur et licence (obligatoire)
    if (item.q.photo) {
        // Taille connue à l'avance : la place est réservée avant le chargement (pas de saut d'affichage)
        if (item.q.photoSize) {
            $('questionPhotoImg').width = item.q.photoSize[0];
            $('questionPhotoImg').height = item.q.photoSize[1];
        }
        $('questionPhotoImg').src = item.q.photo;
        $('questionPhotoCredit').textContent = item.q.credit || '';
    }

    // Indices : on repart de zéro à chaque carte (et pas d'indice en défi du jour ni en sprint)
    state.hintUsed = new Set();
    $('hintList').replaceChildren();
    $('hintList').hidden = true;
    $('hintPanel').hidden = true;
    $('hintBtn').hidden = ['daily', 'sprint', 'placement'].includes(state.mode);

    const input = $('userInput');
    input.value = '';
    input.readOnly = false;
    input.classList.remove('is-ok', 'is-wrong');

    $('answerActions').hidden = false;
    $('pairsView').hidden = true;
    $('orderView').hidden = true;
    $('cardView').hidden = false;
    $('endView').hidden = true;
    hideFeedback();
    updateProgress();
    input.focus();
    // Le clavier reste souvent ouvert d'une question à l'autre : on ajuste AVANT que l'écran soit redessiné
    // (calcul immédiat, pas après coup), puis la question apparaît en fondu rapide.
    updateKeyboardMode();   // nouvelle question : mode compact AVANT l'affichage (taille clavier connue)
    fitToKeyboard();
    keepAnswerVisible();
}

function shake(node) {
    node.classList.remove('shake');
    void node.offsetWidth; // relance l'animation
    node.classList.add('shake');
}

function verify(skipped = false) {
    if (state.phase !== 'answering') return;
    const input = $('userInput');

    let verdict = 'wrong';
    if (!skipped) {
        if (!input.value.trim()) { shake(input); return; }
        verdict = judge(input.value, state.current.q.a, state.current.q.q);
        state.lastTyped = input.value.trim();
    }

    state.phase = 'feedback';
    state.verdict = verdict;
    if (skipped) state.lastTyped = '';

    const ok = verdict !== 'wrong';
    input.readOnly = true;
    input.classList.add(ok ? 'is-ok' : 'is-wrong');
    $('answerActions').hidden = true;
    $('hintPanel').hidden = true;
    showFeedback(verdict, skipped);
    updateKeyboardMode();   // correction : retour à la taille normale
    playSound(ok ? 'good' : 'bad');
}

function showFeedback(verdict, skipped) {
    const q = state.current.q;
    const ok = verdict !== 'wrong';
    const box = $('feedback');

    box.classList.toggle('is-ok', ok);
    box.classList.toggle('is-wrong', !ok);

    $('feedbackTitle').textContent =
        verdict === 'exact' ? 'Bonne réponse !' :
        verdict === 'typo'  ? "Accepté, mais attention à l'orthographe" :
        skipped             ? 'Voici la réponse' :
                              'Pas tout à fait';
    $('feedbackAnswer').textContent = `Réponse : ${q.a[0]}`;
    $('explanationText').textContent = q.exp;

    // Niveau ou défi : on annonce le cœur perdu dès le bandeau rouge (il part au clic sur « Continuer »)
    const losesHeart = !ok && (state.mode === 'level' || state.mode === 'challenge');
    const heartLine = $('feedbackHeart');
    heartLine.hidden = !losesHeart;
    if (losesHeart) {
        heartLine.textContent = state.hearts > 1
            ? `💔 −1 cœur : il t’en restera ${state.hearts - 1}`
            : '💔 C’était ton dernier cœur !';
        renderHearts({ risk: true });
    }

    const cont = $('continueBtn');
    cont.classList.toggle('btn-green', ok);
    cont.classList.toggle('btn-red', !ok);

    // Défi du jour et sprint : pas de « J'avais juste », pour que les scores restent comparables
    const strict = state.mode === 'daily' || state.mode === 'sprint';
    $('forceBtn').hidden = ok || skipped || strict;

    box.classList.add('show');
    document.body.classList.add('has-feedback');
}

function hideFeedback() {
    $('feedback').classList.remove('show');
    document.body.classList.remove('has-feedback');
}

/** Valide la carte en cours : réussie (true) ou ratée (false). */
function commit(ok) {
    if (state.phase !== 'feedback') return;
    state.phase = 'idle';

    const item = state.queue.shift();
    const id = item.q.id;
    const mode = state.mode;

    // Test de placement : ne touche ni aux statistiques, ni à l'XP
    if (mode === 'placement') {
        hideFeedback();
        placementAnswer(ok);
        return;
    }

    // Défi du jour et sprint : chaque question n'est posée qu'une fois, sans seconde chance
    if (mode === 'daily' || mode === 'sprint') {
        recordResult(id, ok);
        if (ok) {
            state.correct++;
            addXp(mode === 'daily' ? XP_DAILY_CORRECT : XP_SPRINT_CORRECT);
        }
        if (mode === 'daily') state.grid.push(ok ? '🟩' : '🟥');
        state.done++;
        hideFeedback();
        if (state.queue.length === 0) endSession(true);
        else showCard();
        return;
    }

    if (ok) {
        const firstTry = !state.failedIds.has(id);
        const forced = state.verdict === 'wrong';
        const assisted = state.hintUsed.size > 0;   // avec un indice, la question n'est pas « maîtrisée »
        // Seule une réussite du premier coup, sans indice, réduit le compteur d'erreurs
        if (firstTry && !assisted) recordResult(id, true);
        addXp(firstTry && !forced && !assisted ? XP_FIRST_TRY : XP_RETRY);
        state.done++;
        if (forced) renderHearts();   // « J'avais juste » : le cœur n'est plus menacé, il arrête de clignoter
    } else {
        state.failedIds.add(id);
        recordResult(id, false);
        state.errors++;
        if (mode === 'level' || mode === 'challenge') {
            state.hearts--;
            renderHearts({ lost: true });
            if (state.hearts <= 0) {
                hideFeedback();
                state.queue.push(item);   // si on continue avec un cœur de secours, la carte reviendra
                endSession(false);
                return;
            }
        }
        state.queue.push(item); // la carte reviendra en fin de leçon
    }

    hideFeedback();
    if (state.queue.length === 0) endSession(true);
    else showCard();
}

/* ---------- Cœur de secours ---------- */

const heartPrice = () => SHOP.find(i => i.id === 'heart').price;

/** Bouton « continuer » de l'écran Niveau raté : utilise un cœur du stock, ou l'achète. */
function useRescueHeart() {
    if (state.phase !== 'over' || !state.canRescue) return;
    const data = state.data;
    if (data.inv.heart > 0) {
        data.inv.heart--;
        showToast('💖 Cœur de secours utilisé : tu continues !');
    } else if (data.coins >= heartPrice()) {
        data.coins -= heartPrice();
        data.totals.purchases++;
        showToast('💖 Cœur de secours acheté : tu continues !');
    } else {
        return;
    }
    state.canRescue = false;
    state.hearts = 1;
    saveData();
    renderHeader();
    renderHearts();
    if (state.mode === 'pairs') showPairsGrid();   // on reprend la grille là où on en était
    else if (state.mode === 'order') nextOrderRound();   // la frise ratée est corrigée : on passe à la suivante
    else showCard();
    checkBadges();
}

/** Sur l'écran Niveau raté : bouton pour continuer, ou petit rappel s'il manque des pièces. */
function showRescueOption() {
    const { inv, coins } = state.data;
    const price = heartPrice();
    const btn = $('endRescue');
    state.canRescue = inv.heart > 0 || coins >= price;
    if (inv.heart > 0) {
        btn.textContent = `💖 Continuer avec un cœur de secours (${inv.heart} en stock)`;
    } else if (coins >= price) {
        btn.textContent = `💖 Acheter un cœur et continuer · ${price} 🪙`;
    } else {
        $('endText').textContent += `\n💡 Un cœur de secours (${price} 🪙) t’aurait permis de continuer. Il te manque ${price - coins} 🪙.`;
    }
    btn.hidden = !state.canRescue;
}

/* ---------- Fin de leçon ---------- */

function setEnd({ emoji, title, text, extra = '', stats = [], primary, primaryClass, onPrimary, secondary, onSecondary }) {
    renderEndStats(stats);
    $('endEmoji').textContent = emoji;
    $('endRescue').hidden = true;
    state.canRescue = false;
    $('endTitle').textContent = title;
    $('endText').textContent = text;
    $('endExtra').textContent = extra;
    $('endPrimary').textContent = primary;
    $('endPrimary').className = `btn ${primaryClass || (secondary ? 'btn-red' : 'btn-green')}`;
    $('endSecondary').hidden = !secondary;
    $('endSecondary').textContent = secondary || '';
    state.onEndPrimary = onPrimary;
    state.onEndSecondary = onSecondary || null;
}

function endSession(win) {
    stopTimer();
    state.phase = 'over';
    $('cardView').hidden = true;
    $('pairsView').hidden = true;
    $('orderView').hidden = true;
    $('endView').hidden = false;
    const mode = state.mode;
    const challenge = mode === 'challenge';

    if (!win) {
        playSound('lose');
        setEnd({
            emoji: '💔',
            title: challenge ? 'Défi raté' : 'Niveau raté',
            text: 'Plus de cœurs. Les questions ratées reviendront en révision.',
            extra: xpSummary(),
            primary: 'Réessayer',
            onPrimary: () => startSession('level', state.level),
            secondary: 'Retour à la carte',
            onSecondary: returnToMap
        });
        if (mode === 'level' || mode === 'challenge' || mode === 'pairs' || mode === 'order') showRescueOption();
        renderHeader();
        checkBadges();
        return;
    }

    $('progressBar').style.width = '100%';
    bumpStreak();
    let celebrate = mode !== 'review';   // confettis (pas pour une simple révision)

    if (mode === 'review') {
        state.data.totals.reviews++;
        addXp(XP_REVIEW_WIN);
        setEnd({
            emoji: '💪',
            title: 'Révision terminée',
            text: `${plural(state.total, 'question revue', 'questions revues')}.`,
            stats: [statXp(), statAccuracy(), statTime()],
            extra: rewardSummary(),
            primary: 'Continuer',
            onPrimary: returnToMap
        });
    } else if (mode === 'daily') {
        const day = todayKey();
        const seconds = Math.round((Date.now() - state.startedAt) / 1000);
        state.data.daily[day] = { score: state.correct, seconds, grid: state.grid.join('') };
        addXp(XP_DAILY_DONE);
        setEnd({
            emoji: state.correct >= DAILY_SIZE ? '🎯' : '📅',
            title: 'Défi du jour terminé',
            text: state.grid.join(''),
            stats: [
                { icon: '✅', label: 'Score', value: state.correct, format: v => `${v}/${DAILY_SIZE}`, tone: 'violet' },
                statXp(),
                statTime()
            ],
            extra: rewardSummary(),
            primary: 'Copier mon résultat',
            onPrimary: () => copyText(dailyShareText(day), $('endPrimary')),
            secondary: 'Retour aux défis',
            onSecondary: returnToMap
        });
        $('endPrimary').className = 'btn btn-violet';
    } else if (mode === 'placement') {
        const start = state.placeStep * CHALLENGE_EVERY + 1;
        applyPlacement(start);
        celebrate = start > 1;
        setEnd({
            emoji: start > 1 ? '🧭' : '🌱',
            title: 'Test terminé',
            text: start > 1
                ? `Tu commences au niveau ${start} ! Les niveaux 1 à ${start - 1} sont validés, leurs questions reviendront de temps en temps en révision.`
                : 'Tu commences au niveau 1 : tout le parcours t’attend !',
            primary: 'C’est parti',
            onPrimary: returnToMap
        });
    } else if (mode === 'sprint') {
        const record = state.correct > state.data.best.sprint;
        if (record) state.data.best.sprint = state.correct;
        celebrate = record;
        state.data.best.lastSprint = state.correct;
        state.data.best.lastSprintRecord = record;
        setEnd({
            emoji: record ? '🏅' : '⚡',
            title: 'Sprint terminé',
            text: (record ? '🎉 Nouveau record !' : `Ton record : ${plural(state.data.best.sprint, 'bonne réponse', 'bonnes réponses')}.`)
                + (state.lastAnswer === true ? '\n✅ Ta dernière réponse a été comptée : juste !'
                 : state.lastAnswer === false ? '\n❌ Ta dernière réponse a été comptée : fausse.' : ''),
            stats: [
                { icon: '⚡', label: 'Bonnes', value: state.correct, format: v => String(v), tone: 'green' },
                statXp(),
                { icon: '🏅', label: 'Record', value: state.data.best.sprint, format: v => String(v), tone: 'violet' }
            ],
            extra: rewardSummary(),
            primary: 'Rejouer',
            onPrimary: () => startSession('sprint'),
            secondary: 'Retour aux défis',
            onSecondary: returnToMap
        });
        $('endPrimary').className = 'btn btn-green';
    } else {
        if (state.errors === 0) {
            addXp(XP_FLAWLESS);
            state.data.totals.flawless++;
        }
        if (challenge) addXp(XP_CHALLENGE_WIN);

        state.data.done[state.level] = true;
        state.data.unlocked = Math.max(state.data.unlocked, Math.min(state.level + 1, MAX_LEVEL));

        const next = state.level < MAX_LEVEL
            ? `Le niveau ${state.level + 1} est débloqué.`
            : "Tu as terminé tous les niveaux. Ajoute des questions dans questions.js pour continuer !";
        setEnd({
            emoji: challenge ? '🏆' : '🎉',
            title: challenge ? 'Défi relevé !' : `Niveau ${state.level} terminé !`,
            text: (state.errors === 0 ? '✨ Sans faute ! ' : '') + next,
            stats: [statXp(), statAccuracy(), statTime()],
            extra: rewardSummary(),
            primary: 'Continuer',
            onPrimary: returnToMap
        });
    }

    playSound('win');
    if (celebrate) launchConfetti();
    saveData();
    renderHeader();
    checkBadges();
}

/* ---------- Niveaux Ordre ---------- */

/** 3 frises de familles (et si possible de thèmes) différentes, adaptées au niveau. */
function buildOrderRounds(level) {
    const t = pairTarget(level);   // même difficulté visée que les niveaux Paires
    const n = orderSize(level);
    const nearCount = f => f.items.filter(it => Math.abs(it[3] - t) <= 1.2).length;
    const eligible = shuffle(ORDER_FAMILIES.filter(f => nearCount(f) >= n));
    const families = [];
    for (const f of eligible) {
        if (families.length < ORDER_ROUNDS && !families.some(g => g.theme === f.theme)) families.push(f);
    }
    const fallback = [...ORDER_FAMILIES].sort((a, b) => nearCount(b) - nearCount(a));
    for (const f of [...eligible, ...fallback]) {
        if (families.length < ORDER_ROUNDS && !families.includes(f)) families.push(f);
    }
    const progress = (level - 1) / Math.max(1, MAX_LEVEL - 1);   // 0 au début, 1 à la fin
    return families.map(family => ({ family, items: pickOrderItems(family, t, n, progress), placed: [], checked: false }));
}

/** Cartes proches de la difficulté visée. Au début, on exige qu'elles soient bien espacées
    dans le classement (faciles à départager) ; plus loin, elles peuvent être voisines. */
function pickOrderItems(family, t, n, progress) {
    const sorted = [...family.items].sort((a, b) => a[1] - b[1]);
    const rank = new Map(sorted.map((it, i) => [it, i]));
    const pool = family.items
        .map(it => ({ it, key: Math.abs(it[3] - t) + Math.random() * 0.8 }))
        .sort((a, b) => a.key - b.key)
        .map(x => x.it)
        .slice(0, Math.max(n + 4, Math.ceil(family.items.length * 0.7)));
    const minGap = Math.max(1, Math.round((1 - progress) * 3));   // 3 rangs d'écart au début, 1 à la fin
    let best = null;
    for (let attempt = 0; attempt < 60; attempt++) {
        const pick = shuffle(pool).slice(0, n);
        const ranks = pick.map(it => rank.get(it)).sort((a, b) => a - b);
        const gap = Math.min(...ranks.slice(1).map((r, i) => r - ranks[i]));
        if (!best || gap > best.gap) best = { pick, gap };
        if (gap >= minGap) break;
    }
    return best.pick.map(([label, value, shown]) => ({ label, value, shown }));
}

function showOrderRound() {
    const round = state.orderRounds[state.orderIndex];
    const f = round.family;
    state.phase = 'order';
    $('cardView').hidden = true;
    $('pairsView').hidden = true;
    $('endView').hidden = true;
    $('orderView').hidden = false;
    hideFeedback();
    $('orderTag').textContent = f.theme;
    $('orderStep').textContent = `Frise ${state.orderIndex + 1}/${state.orderRounds.length}`;
    $('orderTitle').textContent = `${f.title} : ${f.prompt.charAt(0).toLowerCase()}${f.prompt.slice(1)}`;
    $('orderHelp').textContent = 'Touche les cartes dans l’ordre. Touche une carte placée pour la retirer.';
    $('orderTopLabel').textContent = `⬆ ${f.ends[0]}`;
    $('orderBottomLabel').textContent = `⬇ ${f.ends[1]}`;
    renderOrder();
    updateProgress();
}

/** Dessine la frise (emplacements numérotés) et les cartes restantes. */
function renderOrder() {
    const round = state.orderRounds[state.orderIndex];
    const n = round.items.length;
    const slots = $('orderSlots');
    slots.replaceChildren();

    if (!round.checked) {
        for (let i = 0; i < n; i++) {
            const li = el('li', 'order-slot');
            const num = el('span', 'order-num');
            num.textContent = i + 1;
            li.append(num);
            const idx = round.placed[i];
            if (idx !== undefined) {
                const card = el('button', 'order-card is-placed');
                card.type = 'button';
                card.textContent = round.items[idx].label;
                card.addEventListener('click', () => unplaceOrderCard(i));
                li.append(card);
            } else {
                li.append(el('span', 'order-empty'));
            }
            slots.append(li);
        }
    } else {
        // Après « Vérifier » : le bon ordre, avec les valeurs ; vert = bien placé, rouge = erreur
        const correct = [...round.items.keys()].sort((a, b) => round.items[a].value - round.items[b].value);
        correct.forEach((idx, i) => {
            const ok = round.placed[i] === idx;
            const li = el('li', `order-slot is-checked ${ok ? 'is-ok' : 'is-wrong'}`);
            const num = el('span', 'order-num');
            num.textContent = ok ? '✓' : '✗';
            const box = el('div', 'order-answer');
            const label = el('b');
            label.textContent = round.items[idx].label;
            const shown = el('span', 'order-value');
            shown.textContent = round.items[idx].shown;
            box.append(label, shown);
            if (!ok) {
                const yours = el('span', 'order-yours');
                yours.textContent = `Tu avais mis : ${round.items[round.placed[i]].label}`;
                box.append(yours);
            }
            li.append(num, box);
            slots.append(li);
        });
    }

    const pool = $('orderPool');
    pool.replaceChildren();
    if (!round.checked) {
        round.items.forEach((item, idx) => {
            if (round.placed.includes(idx)) return;
            const card = el('button', 'order-card');
            card.type = 'button';
            card.textContent = item.label;
            card.addEventListener('click', () => placeOrderCard(idx));
            pool.append(card);
        });
    }
    pool.hidden = round.checked || pool.childElementCount === 0;

    const btn = $('orderBtn');
    btn.textContent = round.checked ? 'Continuer' : 'Vérifier';
    btn.disabled = !round.checked && round.placed.filter(x => x !== undefined).length < n;
}

/** La carte touchée va dans le premier emplacement libre. */
function placeOrderCard(idx) {
    if (state.phase !== 'order') return;
    const round = state.orderRounds[state.orderIndex];
    let free = 0;
    while (round.placed[free] !== undefined) free++;
    round.placed[free] = idx;
    renderOrder();
}

function unplaceOrderCard(slot) {
    if (state.phase !== 'order') return;
    state.orderRounds[state.orderIndex].placed[slot] = undefined;
    renderOrder();
}

/** Bouton sous la frise : « Vérifier », puis « Continuer ». */
function orderButton() {
    const round = state.orderRounds[state.orderIndex];
    if (state.phase === 'order' && !round.checked) {
        checkOrder(round);
    } else if (state.phase === 'order-feedback') {
        if (state.hearts <= 0) endSession(false);
        else nextOrderRound();
    }
}

function checkOrder(round) {
    const correct = [...round.items.keys()].sort((a, b) => round.items[a].value - round.items[b].value);
    const right = correct.filter((idx, i) => round.placed[i] === idx).length;
    round.checked = true;
    state.phase = 'order-feedback';
    state.done++;
    state.orderRight += right;
    state.orderTotal += round.items.length;
    if (right > 0) addXp(XP_ORDER_CARD * right);
    if (right === round.items.length) {
        playSound('good');
    } else {
        // Une frise fausse coûte un cœur (un seul, quel que soit le nombre d'erreurs)
        playSound('bad');
        state.errors++;
        state.hearts--;
        renderHearts({ lost: true });
    }
    renderOrder();
    updateProgress();
    if (state.hearts <= 0) $('orderBtn').textContent = 'Voir le résultat';
}

function nextOrderRound() {
    state.orderIndex++;
    if (state.orderIndex >= state.orderRounds.length) endSession(true);
    else showOrderRound();
}

/* ---------- Signaler une question ---------- */

const REPORT_REASONS = [
    'Ma réponse aurait dû être acceptée',
    'La question est ambiguë',
    'La réponse attendue est fausse',
    'Trop facile ou trop dure pour ce niveau',
    'Faute ou autre problème'
];
let reportReason = null;

function openReportModal() {
    const q = state.current?.q;
    if (!q) return;
    reportReason = null;
    $('reportComment').value = '';
    renderReportReasons();
    $('reportModal').hidden = false;
}

function renderReportReasons() {
    const box = $('reportReasons');
    box.replaceChildren();
    REPORT_REASONS.forEach(reason => {
        const btn = el('button', `report-reason${reportReason === reason ? ' is-selected' : ''}`);
        btn.type = 'button';
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-checked', String(reportReason === reason));
        btn.textContent = reason;
        btn.addEventListener('click', () => { reportReason = reason; renderReportReasons(); });
        box.append(btn);
    });
    $('reportSendBtn').disabled = !reportReason;
}

function sendReport() {
    const q = state.current?.q;
    if (!q || !reportReason) return;
    state.data.reports.push({
        id: q.id,
        theme: q.theme,
        q: q.q,
        expected: q.a[0],
        typed: state.lastTyped || '',
        reason: reportReason,
        comment: $('reportComment').value.trim(),
        day: todayKey()
    });
    saveData();
    $('reportModal').hidden = true;
    showToast('🚩 Merci ! Ton signalement nous aide à améliorer les questions.');
    flushReports();
}

/* Envoi des signalements en attente vers Supabase (table « reports »).
   Ils restent sur l'appareil tant que l'envoi n'a pas réussi (pas de connexion…), puis sont effacés. */
let flushingReports = false;

async function flushReports() {
    const pending = state.data.reports;
    if (flushingReports || !pending.length || !navigator.onLine) return;
    flushingReports = true;
    const batch = pending.slice(0, 50);
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/reports`, {
            method: 'POST',
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                Prefer: 'return=minimal'
            },
            body: JSON.stringify(batch.map(r => ({
                question_id: r.id,
                theme: r.theme,
                question: r.q,
                expected: r.expected,
                typed: (r.typed || '').slice(0, 290),
                reason: r.reason,
                comment: (r.comment || '').slice(0, 990)
            })))
        });
        if (res.ok) {
            state.data.reports = state.data.reports.filter(r => !batch.includes(r));
            saveData();
        }
    } catch (err) {
        /* pas de connexion : on réessaiera plus tard */
    } finally {
        flushingReports = false;
    }
}

/* ---------- Sauvegarde en ligne (Supabase, table « saves ») ---------- */

function cloudMeta() {
    try { return JSON.parse(localStorage.getItem(CLOUD_META_KEY) || '{}'); } catch (err) { return {}; }
}
function setCloudMeta(meta) {
    try { localStorage.setItem(CLOUD_META_KEY, JSON.stringify({ ...cloudMeta(), ...meta })); } catch (err) { /* tant pis */ }
}

function cloudClient() {
    if (!sbClient && window.supabase) {
        sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: { persistSession: true, autoRefreshToken: true, storageKey: 'kultivo_auth', detectSessionInUrl: true }
        });
    }
    return sbClient;
}

/** À chaque sauvegarde locale : on note qu'il y a du nouveau, et on l'envoie 5 s plus tard (une seule fois). */
function cloudChanged() {
    setCloudMeta({ dirty: true });
    if (!cloudUser) return;
    clearTimeout(cloudPushTimer);
    cloudPushTimer = setTimeout(cloudPush, 5000);
}

async function cloudPush() {
    const c = cloudClient();
    clearTimeout(cloudPushTimer);
    if (!c || !cloudUser || !navigator.onLine) return;
    const updatedAt = new Date().toISOString();
    try {
        const { error } = await c.from('saves').upsert({
            user_id: cloudUser.id, data: state.data, xp: state.data.xp, updated_at: updatedAt
        });
        if (!error) {
            setCloudMeta({ dirty: false, updatedAt });
            renderCloudCard();
        }
    } catch (err) { /* hors ligne : on réessaiera */ }
}

const isEmptyProgress = d => !d.xp && !Object.values(d.done || {}).some(Boolean);
function progressSummary(d) {
    const done = Object.values(d.done || {}).filter(Boolean).length;
    return `${d.xp || 0} XP · ${plural(done, 'niveau terminé', 'niveaux terminés')}`;
}

/** Remplace la progression de l'appareil par celle du compte, puis relance le jeu. */
function applyRemote(remote) {
    state.data = normalizeData({ ...defaultData(), ...remote.data });
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data)); } catch (err) { /* tant pis */ }
    setCloudMeta({ dirty: false, updatedAt: remote.updated_at });
    location.reload();
}

let pendingRemote = null;
function openCloudConflict(remote) {
    pendingRemote = remote;
    $('conflictCloud').textContent = progressSummary(remote.data);
    $('conflictDevice').textContent = progressSummary(state.data);
    $('cloudConflictModal').hidden = false;
}

/** Au lancement et à la connexion : qui a la version la plus récente, le compte ou l'appareil ? */
async function cloudSync(justLoggedIn) {
    const c = cloudClient();
    if (cloudBusy || !c || !cloudUser || !navigator.onLine) return;
    cloudBusy = true;
    try {
        const { data: remote, error } = await c.from('saves')
            .select('data, xp, updated_at').eq('user_id', cloudUser.id).maybeSingle();
        if (error) return;
        const meta = cloudMeta();
        if (!remote) { await cloudPush(); return; }                       // compte tout neuf
        const remoteNewer = !meta.updatedAt || new Date(remote.updated_at) > new Date(meta.updatedAt);
        if (!remoteNewer) { if (meta.dirty) await cloudPush(); return; }   // l'appareil est à jour
        // Le compte a avancé ailleurs (autre appareil) ou c'est une première connexion sur cet appareil
        if (isEmptyProgress(state.data)) { applyRemote(remote); return; }
        if (!meta.dirty && !justLoggedIn) { applyRemote(remote); return; }
        if (JSON.stringify(remote.data) === JSON.stringify(state.data)) { setCloudMeta({ dirty: false, updatedAt: remote.updated_at }); return; }
        openCloudConflict(remote);
    } catch (err) {
        /* hors ligne ou erreur : on réessaiera plus tard */
    } finally {
        cloudBusy = false;
        renderCloudCard();
    }
}

async function cloudInit() {
    const c = cloudClient();
    renderCloudCard();
    if (!c) return;
    c.auth.onAuthStateChange((event, session) => {
        cloudUser = session?.user || null;
        renderCloudCard();
        if (event === 'PASSWORD_RECOVERY') setTimeout(askNewPassword, 300);
    });
    try {
        const { data } = await c.auth.getSession();
        cloudUser = data.session?.user || null;
    } catch (err) { cloudUser = null; }
    renderCloudCard();
    cloudSync(false);
    window.addEventListener('online', () => cloudSync(false));
    // L'appli passe en arrière-plan : on envoie tout de suite ce qui n'est pas encore en ligne
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && cloudMeta().dirty) cloudPush();
    });
}

function timeAgo(iso) {
    if (!iso) return '';
    const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (minutes < 1) return 'à l’instant';
    if (minutes < 60) return `il y a ${minutes} min`;
    if (minutes < 1440) return `il y a ${Math.round(minutes / 60)} h`;
    return `le ${new Date(iso).toLocaleDateString('fr-FR')}`;
}

function renderCloudCard() {
    const available = !!window.supabase;
    $('cloudOut').hidden = !!cloudUser;
    $('cloudIn').hidden = !cloudUser;
    $('cloudOutActions').hidden = !available;
    $('cloudOutText').textContent = available
        ? 'Crée un compte pour ne jamais perdre ta progression et la retrouver sur tous tes appareils.'
        : 'Sauvegarde en ligne indisponible pour le moment (pas de connexion ?).';
    if (cloudUser) {
        const meta = cloudMeta();
        $('cloudEmail').textContent = cloudUser.email || '';
        $('cloudStatus').textContent = meta.dirty
            ? '⏳ Sauvegarde en cours…'
            : meta.updatedAt ? `Sauvegardé ${timeAgo(meta.updatedAt)}` : '';
    }
}

/* Fenêtre « Créer un compte / Se connecter » */
let authMode = 'signup';
function openAuthModal(mode) {
    authMode = mode;
    const signup = mode === 'signup';
    $('authTitle').textContent = signup ? '☁️ Créer un compte' : '☁️ Se connecter';
    $('authSubmit').textContent = signup ? 'Créer mon compte' : 'Me connecter';
    $('authSubmit').disabled = false;
    $('authSwitch').textContent = signup ? 'J’ai déjà un compte : me connecter' : 'Pas encore de compte : en créer un';
    $('authPassword').autocomplete = signup ? 'new-password' : 'current-password';
    $('authForgot').hidden = signup;
    $('authError').textContent = '';
    $('authModal').hidden = false;
    $('authEmail').focus();
}

function authErrorText(error) {
    const m = (error?.message || '').toLowerCase();
    if (m.includes('invalid login')) return 'E-mail ou mot de passe incorrect.';
    if (m.includes('already registered') || m.includes('already been registered')) return 'Un compte existe déjà avec cet e-mail : connecte-toi.';
    if (m.includes('email') && (m.includes('invalid') || m.includes('valid email'))) return 'Cette adresse e-mail n’est pas valide.';
    if (m.includes('password')) return 'Mot de passe trop faible : au moins 6 caractères.';
    if (m.includes('rate') || m.includes('too many')) return 'Trop d’essais : réessaie dans quelques minutes.';
    return 'Impossible pour le moment. Vérifie ta connexion et réessaie.';
}

async function submitAuth(e) {
    e.preventDefault();
    const c = cloudClient();
    const email = $('authEmail').value.trim();
    const password = $('authPassword').value;
    const signup = authMode === 'signup';
    if (!c) { $('authError').textContent = 'Connexion impossible pour le moment.'; return; }
    if (!email.includes('@')) { $('authError').textContent = 'Indique ton adresse e-mail.'; return; }
    if (password.length < 6) { $('authError').textContent = 'Le mot de passe doit faire au moins 6 caractères.'; return; }
    const btn = $('authSubmit');
    btn.disabled = true;
    btn.textContent = 'Un instant…';
    const { data, error } = signup
        ? await c.auth.signUp({ email, password })
        : await c.auth.signInWithPassword({ email, password });
    if (error || !data.user || (signup && !data.session)) {
        $('authError').textContent = error ? authErrorText(error) : 'Impossible pour le moment. Réessaie.';
        btn.disabled = false;
        btn.textContent = signup ? 'Créer mon compte' : 'Me connecter';
        return;
    }
    cloudUser = data.user;
    $('authModal').hidden = true;
    $('authPassword').value = '';
    showToast(signup ? '☁️ Compte créé : ta progression est sauvegardée en ligne !' : '☁️ Connecté !');
    renderCloudCard();
    await cloudSync(true);
}

async function forgotPassword() {
    const c = cloudClient();
    const email = $('authEmail').value.trim();
    if (!c || !email.includes('@')) { $('authError').textContent = 'Écris d’abord ton e-mail ci-dessus.'; return; }
    await c.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
    $('authError').textContent = 'Si un compte existe avec cet e-mail, tu vas recevoir un lien pour changer ton mot de passe.';
}

/** Arrivée depuis le lien « mot de passe oublié » reçu par e-mail. */
async function askNewPassword() {
    const password = prompt('Choisis ton nouveau mot de passe (6 caractères minimum) :');
    if (!password || password.length < 6) return;
    const { error } = await cloudClient().auth.updateUser({ password });
    showToast(error ? 'Impossible de changer le mot de passe, réessaie.' : '✅ Mot de passe changé !');
}

async function cloudLogout() {
    if (!confirm('Se déconnecter ? Ta progression reste sur cet appareil, mais ne sera plus sauvegardée en ligne.')) return;
    await cloudPush();
    try { await cloudClient().auth.signOut(); } catch (err) { /* tant pis */ }
    cloudUser = null;
    setCloudMeta({ updatedAt: null });
    renderCloudCard();
    showToast('Déconnecté. Ta progression reste sur cet appareil.');
}

/* ---------- Accueil du premier lancement ---------- */

const ONBOARD_STEPS = 4;
const ONBOARD_LEVELS = [
    { id: 'beginner', icon: '🌱', title: 'Je débute',        sub: 'Je préfère commencer par les bases' },
    { id: 'average',  icon: '📚', title: 'Je me débrouille', sub: 'Je connais les grands classiques' },
    { id: 'expert',   icon: '🎓', title: 'Je suis calé',     sub: 'Je veux vite du challenge' }
];
// Repères pour choisir son objectif (un niveau rapporte environ 40 à 60 XP)
const GOAL_ICONS = ['🐢', '🚶', '🔥'];
const GOAL_HINTS = { 60: 'Environ 1 niveau par jour', 150: '2 à 3 niveaux par jour', 250: '4 à 5 niveaux par jour' };

const onboard = { step: 0, level: null };
const WELCOME_COINS = 100;    // cadeau de bienvenue, donné une seule fois à la fin de l'accueil
const WELCOME_FREEZES = 1;

/** Encadré « Cadeau de bienvenue » du dernier écran de l'accueil. */
function welcomeGiftBox() {
    const box = el('div', 'onboard-gift');
    const title = el('b');
    title.textContent = '🎁 Cadeau de bienvenue';
    const text = el('span');
    text.textContent = `${WELCOME_COINS} 🪙 et ${plural(WELCOME_FREEZES, 'gel de série 🧊', 'gels de série 🧊')} pour bien démarrer !`;
    box.append(title, text);
    return box;
}

function startOnboarding() {
    onboard.step = 0;
    onboard.level = null;
    showScreen('onboard');
    renderOnboard();
}

/** Une grande case à choisir (niveau, objectif). */
function onboardOption({ icon, title, sub, selected, onPick }) {
    const btn = el('button', `onboard-option${selected ? ' is-selected' : ''}`);
    btn.type = 'button';
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', String(selected));
    const ico = el('span', 'opt-icon');
    ico.textContent = icon;
    const text = el('span');
    const t = el('span', 'opt-title');
    t.textContent = title;
    const s = el('span', 'opt-sub');
    s.textContent = sub;
    text.append(t, s);
    btn.append(ico, text);
    btn.addEventListener('click', () => { onPick(); renderOnboard(); });
    return btn;
}

function renderOnboard() {
    const step = onboard.step;
    const body = $('onboardBody');
    body.replaceChildren();
    body.classList.remove('is-entering');
    void body.offsetWidth;   // relance l'animation d'entrée
    body.classList.add('is-entering');

    $('onboardDots').replaceChildren(...Array.from({ length: ONBOARD_STEPS }, (_, i) =>
        el('span', `onboard-dot${i <= step ? ' is-done' : ''}`)));
    $('onboardBack').style.visibility = step > 0 ? 'visible' : 'hidden';
    const next = $('onboardNext');
    const skip = $('onboardSkip');
    next.disabled = false;
    skip.hidden = true;

    const title = el('h2', 'onboard-title');
    const text = el('p', 'onboard-text');
    const big = (emoji) => { const e = el('div', 'onboard-emoji'); e.textContent = emoji; return e; };

    if (step === 0) {
        const logo = el('img', 'onboard-logo');
        logo.src = 'icons/logo.svg';
        logo.alt = '';
        title.textContent = 'Bienvenue sur Kultivo !';
        text.textContent = 'Ta culture générale, un niveau après l’autre : questions, défis, grilles à associer… Commençons par faire connaissance.';
        body.append(logo, title, text);
        next.textContent = 'C’est parti';
    } else if (step === 1) {
        title.textContent = 'Comment juges-tu ta culture générale ?';
        const list = el('div', 'onboard-options');
        list.setAttribute('role', 'radiogroup');
        ONBOARD_LEVELS.forEach(lvl => list.append(onboardOption({
            ...lvl, selected: onboard.level === lvl.id, onPick: () => { onboard.level = lvl.id; }
        })));
        body.append(title, list);
        next.textContent = 'Continuer';
        next.disabled = !onboard.level;
    } else if (step === 2) {
        title.textContent = 'Quel est ton objectif quotidien ?';
        text.textContent = 'Tu pourras le changer plus tard dans l’onglet Défis.';
        const list = el('div', 'onboard-options');
        list.setAttribute('role', 'radiogroup');
        GOAL_CHOICES.forEach((choice, i) => list.append(onboardOption({
            icon: GOAL_ICONS[i],
            title: `${choice.label} · ${choice.xp} XP / jour`,
            sub: `${GOAL_HINTS[choice.xp] || ''} · 🎁 ${choice.reward} 🪙`,
            selected: state.data.goal === choice.xp,
            onPick: () => { state.data.goal = choice.xp; saveData(); }
        })));
        body.append(title, text, list);
        next.textContent = 'Continuer';
    } else if (onboard.level === 'beginner') {
        title.textContent = 'Parfait, on commence par les bases !';
        text.textContent = 'Ton premier niveau t’attend. Bonne partie !';
        body.append(big('🌱'), title, text, welcomeGiftBox());
        next.textContent = 'Commencer le niveau 1';
    } else {
        title.textContent = 'Un petit test pour te placer ?';
        text.textContent = `Des questions de plus en plus dures : chaque étape réussie te fait sauter 10 niveaux, jusqu’au niveau ${PLACEMENT_STEPS * CHALLENGE_EVERY + 1}.`;
        body.append(big('🧭'), title, text, welcomeGiftBox());
        next.textContent = 'Faire le test de placement';
        skip.textContent = 'Non merci, je commence au niveau 1';
        skip.hidden = false;
    }
}

function onboardNext() {
    if (onboard.step < ONBOARD_STEPS - 1) {
        onboard.step++;
        renderOnboard();
        return;
    }
    finishOnboarding(onboard.level === 'beginner' ? 'level' : 'placement');
}

/** Fin de l'accueil : on lance directement le test de placement ou le niveau 1. */
function finishOnboarding(start) {
    const d = state.data;
    d.onboarded = true;
    d.placementOffered = true;
    d.selfLevel = onboard.level;
    if (!d.welcomeGift) {
        d.welcomeGift = true;
        d.coins += WELCOME_COINS;
        d.inv.freeze = Math.min(5, d.inv.freeze + WELCOME_FREEZES);
        showToast(`🎁 Cadeau de bienvenue : +${WELCOME_COINS} 🪙 et +${WELCOME_FREEZES} 🧊 !`);
    }
    saveData();
    renderHeader();
    if (start === 'placement') startSession('placement');
    else startSession('level', 1);
}

/* ---------- Récap animé de fin de leçon ---------- */

const elapsedSeconds = () => Math.round((Date.now() - state.startedAt) / 1000);
/** « 45 s » ou « 2:05 » : assez court pour tenir dans une tuile. */
const fmtShort = s => s < 60 ? `${s} s` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const statXp = () => ({ icon: '⭐', label: 'XP', value: state.sessionXp, format: v => `+${v}`, tone: 'gold' });
const statTime = () => ({ icon: '⏱', label: 'Temps', value: elapsedSeconds(), format: fmtShort, tone: 'blue' });
/** Précision : bonnes réponses sur le nombre total d'essais (chaque erreur ajoute un essai). */
function statAccuracy() {
    if (state.mode === 'order') {   // niveau Ordre : cartes bien placées sur cartes placées
        const pct = state.orderTotal ? Math.round((100 * state.orderRight) / state.orderTotal) : 100;
        return { icon: '🎯', label: 'Précision', value: pct, format: v => `${v} %`, tone: 'green' };
    }
    const attempts = state.total + state.errors;
    const pct = attempts ? Math.round((100 * state.total) / attempts) : 100;
    return { icon: '🎯', label: 'Précision', value: pct, format: v => `${v} %`, tone: 'green' };
}

let endStatTimers = [];

/** Les tuiles apparaissent l'une après l'autre, et leur chiffre défile de 0 jusqu'au résultat. */
function renderEndStats(stats) {
    endStatTimers.forEach(clearTimeout);
    endStatTimers = [];
    const box = $('endStats');
    box.replaceChildren();
    box.hidden = stats.length === 0;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    stats.forEach((stat, i) => {
        const tile = el('div', `end-stat tone-${stat.tone}`);
        const label = el('span', 'end-stat-label');
        label.textContent = `${stat.icon} ${stat.label}`;
        const value = el('b', 'end-stat-value');
        value.textContent = stat.format(calm ? stat.value : 0);
        tile.append(label, value);
        box.append(tile);
        if (calm) { tile.classList.add('is-shown'); return; }
        endStatTimers.push(setTimeout(() => {
            tile.classList.add('is-shown');
            playSound('pair');
            countUp(value, stat);
        }, 500 + i * 550));
    });
}

function countUp(node, stat) {
    const start = performance.now();
    const DURATION = 700;
    function step(now) {
        const k = Math.min(1, (now - start) / DURATION);
        const eased = 1 - Math.pow(1 - k, 3);   // rapide au début, ralentit à la fin
        node.textContent = stat.format(Math.round(stat.value * eased));
        if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

/* ---------- Sons, vibrations et confettis ---------- */

/* Sons fabriqués par le navigateur (pas de fichier audio à charger).
   Chaque note : [fréquence, début (s), durée (s), forme d'onde, fréquence de fin]. */
const SOUNDS = {
    good: [[660, 0, 0.09], [880, 0.09, 0.18]],
    pair: [[740, 0, 0.1]],
    bad:  [[220, 0, 0.2, 'square', 150]],
    win:  [[523, 0, 0.12], [659, 0.12, 0.12], [784, 0.24, 0.12], [1047, 0.36, 0.35]],
    lose: [[392, 0, 0.18, 'triangle'], [330, 0.18, 0.18, 'triangle'], [262, 0.36, 0.4, 'triangle']]
};
let audioCtx = null;

function playSound(name) {
    if (!state.data.sound) return;
    if (name === 'bad' && navigator.vibrate) navigator.vibrate(70);   // petite vibration sur Android
    try {
        audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const now = audioCtx.currentTime;
        for (const [freq, start, dur, type = 'sine', endFreq] of SOUNDS[name]) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, now + start);
            if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, now + start + dur);
            const volume = type === 'square' ? 0.05 : 0.16;   // le son « carré » est plus agressif
            gain.gain.setValueAtTime(0.0001, now + start);
            gain.gain.exponentialRampToValueAtTime(volume, now + start + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
            osc.connect(gain).connect(audioCtx.destination);
            osc.start(now + start);
            osc.stop(now + start + dur + 0.02);
        }
    } catch (err) {
        /* pas de son disponible : on continue sans */
    }
}

function renderSoundBtn() {
    const on = state.data.sound;
    $('soundBtn').textContent = on ? '🔊 Sons et vibrations : activés' : '🔇 Sons et vibrations : coupés';
    $('soundBtn').setAttribute('aria-pressed', String(on));
    $('lessonSoundBtn').textContent = on ? '🔊' : '🔇';
    $('lessonSoundBtn').setAttribute('aria-label', on ? 'Couper le son' : 'Remettre le son');
}

function toggleSound() {
    state.data.sound = !state.data.sound;
    saveData();
    renderSoundBtn();
    playSound('pair');   // petit son pour confirmer que c'est réactivé
}

/** Pluie de confettis (pas de confettis si l'appareil demande moins d'animations). */
function launchConfetti() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = el('canvas', 'confetti');
    document.body.append(canvas);
    const ctx = canvas.getContext('2d');
    const ratio = window.devicePixelRatio || 1;
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * ratio;
    canvas.height = H * ratio;
    ctx.scale(ratio, ratio);

    const colors = ['#58cc02', '#ffc800', '#8b5cf6', '#1899d6', '#ff9600', '#e5484d'];
    const bits = Array.from({ length: 140 }, () => ({
        x: W / 2 + (Math.random() - 0.5) * W * 0.3,
        y: H * 0.35,
        vx: (Math.random() - 0.5) * 13,
        vy: -Math.random() * 13 - 4,
        size: 6 + Math.random() * 6,
        rot: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)]
    }));
    const DURATION = 2600;
    const startedAt = performance.now();
    function frame(now) {
        const elapsed = now - startedAt;
        ctx.clearRect(0, 0, W, H);
        ctx.globalAlpha = Math.max(0, 1 - elapsed / DURATION);
        for (const b of bits) {
            b.vy += 0.35;
            b.vx *= 0.99;
            b.x += b.vx;
            b.y += b.vy;
            b.rot += b.spin;
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.rotate(b.rot);
            ctx.fillStyle = b.color;
            ctx.fillRect(-b.size / 2, -b.size / 4, b.size, b.size / 2);
            ctx.restore();
        }
        if (elapsed < DURATION) requestAnimationFrame(frame);
        else canvas.remove();
    }
    requestAnimationFrame(frame);
}

/* ---------- Événements ---------- */

function bindEvents() {
    $('checkBtn').addEventListener('click', () => verify(false));
    $('skipBtn').addEventListener('click', () => verify(true));
    $('hintBtn').addEventListener('click', toggleHintPanel);
    $('continueBtn').addEventListener('click', () => commit(state.verdict !== 'wrong'));
    $('forceBtn').addEventListener('click', () => commit(true));
    $('reviewBtn').addEventListener('click', () => openReviewModal());

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => showScreen(btn.dataset.screen));
    });

    $('dailyBtn').addEventListener('click', () => openChallengeModal('daily'));
    $('dailyCopyBtn').addEventListener('click', () =>
        copyText(dailyShareText(todayKey()), $('dailyCopyBtn')));
    $('sprintBtn').addEventListener('click', () => openChallengeModal('sprint'));
    $('placementBtn').addEventListener('click', () => openPlacementModal());
    $('modalSecondaryBtn').addEventListener('click', closeStartModal);
    $('endRescue').addEventListener('click', useRescueHeart);

    $('endPrimary').addEventListener('click', () => state.onEndPrimary && state.onEndPrimary());
    $('endSecondary').addEventListener('click', () => state.onEndSecondary && state.onEndSecondary());

    $('quitBtn').addEventListener('click', () => {
        if (state.phase === 'over') returnToMap();   // écran de fin : rien à perdre
        else openQuitModal();
    });
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.addEventListener('click', () => setProfileTab(tab.dataset.tab));
    });
    setProfileTab('badges');

    $('soundBtn').addEventListener('click', toggleSound);
    $('lessonSoundBtn').addEventListener('click', toggleSound);
    renderSoundBtn();

    // Téléphone : balayer l'écran vers la gauche ou la droite pour changer d'onglet
    let swipe = null;
    document.addEventListener('touchstart', e => {
        swipe = null;
        const screen = MAIN_SCREENS.find(name => !$(`${name}Screen`).hidden);
        if (!screen || e.touches.length !== 1) return;
        if (!$('startModal').hidden || !$('quitModal').hidden || !$('streakModal').hidden) return;
        if (!$('authModal').hidden || !$('cloudConflictModal').hidden) return;
        if (e.target.closest('input, textarea')) return;
        const t = e.touches[0];
        if (t.clientX < 24 || t.clientX > window.innerWidth - 24) return;   // bords : geste « retour » du téléphone
        swipe = { x: t.clientX, y: t.clientY, time: Date.now(), screen };
    }, { passive: true });
    document.addEventListener('touchend', e => {
        if (!swipe) return;
        const { x, y, time, screen } = swipe;
        swipe = null;
        const t = e.changedTouches[0];
        const dx = t.clientX - x;
        const dy = t.clientY - y;
        // Un vrai balayage : rapide, assez long, et plus horizontal que vertical
        if (Date.now() - time > 600 || Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx) * 0.6) return;
        const next = MAIN_SCREENS[MAIN_SCREENS.indexOf(screen) + (dx < 0 ? 1 : -1)];
        if (!next) return;
        showScreen(next);
        const page = $(`${next}Screen`);
        page.classList.remove('slide-from-left', 'slide-from-right');
        void page.offsetWidth;   // relance l'animation
        page.classList.add(dx < 0 ? 'slide-from-right' : 'slide-from-left');
    }, { passive: true });

    // Téléphone : quand le clavier s'ouvre, on garde la question ET les boutons à l'écran
    // + mode compact pendant que le clavier est ouvert (images et question plus petites)
    const onViewport = () => { updateKeyboardMode(); fitToKeyboard(); keepAnswerVisible(); };
    // Une nouvelle photo change la hauteur une fois chargée : on réajuste
    $('questionPhotoImg').addEventListener('load', () => { fitToKeyboard(); keepAnswerVisible(); });
    if (window.visualViewport) window.visualViewport.addEventListener('resize', onViewport);
    loadKeyboardMemory();   // hauteur clavier enregistrée lors d'une partie précédente
    updateKeyboardMode();   // mesure la hauteur d'écran sans clavier dès le lancement
    // Le clavier s'ouvre en animation : on réajuste plusieurs fois pendant qu'il apparaît
    $('userInput').addEventListener('focus', () => [50, 300, 700].forEach(ms => setTimeout(onViewport, ms)));
    $('userInput').addEventListener('blur', () => setTimeout(updateKeyboardMode, 150));

    $('onboardNext').addEventListener('click', onboardNext);
    $('onboardSkip').addEventListener('click', () => finishOnboarding('level'));
    $('onboardBack').addEventListener('click', () => {
        if (onboard.step > 0) { onboard.step--; renderOnboard(); }
    });

    $('coinChip').addEventListener('click', () => showScreen('shop'));
    $('xpChip').addEventListener('click', () => showScreen('profile'));
    $('streakChip').addEventListener('click', openStreakModal);
    $('closeStreakBtn').addEventListener('click', () => { $('streakModal').hidden = true; });
    $('streakModal').addEventListener('click', e => {
        if (e.target === $('streakModal')) $('streakModal').hidden = true;
    });
    $('calPrev').addEventListener('click', () => moveCalendar(-1));
    $('calNext').addEventListener('click', () => moveCalendar(1));

    // Calendrier : balayer vers la gauche = mois suivant, vers la droite = mois précédent
    let calSwipe = null;
    $('streakModal').addEventListener('touchstart', e => {
        const t = e.touches[0];
        calSwipe = e.touches.length === 1 ? { x: t.clientX, y: t.clientY, time: Date.now() } : null;
    }, { passive: true });
    $('streakModal').addEventListener('touchend', e => {
        if (!calSwipe) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - calSwipe.x;
        const dy = t.clientY - calSwipe.y;
        const quick = Date.now() - calSwipe.time < 600;
        calSwipe = null;
        if (!quick || Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx) * 0.6) return;
        const btn = dx < 0 ? $('calNext') : $('calPrev');
        if (btn.disabled) return;
        moveCalendar(dx < 0 ? 1 : -1);
        const grid = $('calGrid');
        grid.classList.remove('slide-from-left', 'slide-from-right');
        void grid.offsetWidth;   // relance l'animation
        grid.classList.add(dx < 0 ? 'slide-from-right' : 'slide-from-left');
    }, { passive: true });

    $('orderBtn').addEventListener('click', orderButton);

    $('reportBtn').addEventListener('click', openReportModal);
    $('closeReportBtn').addEventListener('click', () => { $('reportModal').hidden = true; });
    $('reportSendBtn').addEventListener('click', sendReport);
    // Photo de monument : un tap l'affiche en grand, un autre la referme (et le clavier revient)
    // « pointerdown » (dès que le doigt touche) et non « click » : sinon le clavier se ferme d'abord,
    // la photo bouge et le clic n'arrive plus dessus. preventDefault garde aussi le clavier ouvert.
    // Toucher : on empêche seulement le clavier de se fermer (sinon la photo bouge sous le doigt).
    // Tap complet (clic) : on ouvre. Ouvrir dès le toucher refermait aussitôt la photo à la fin du même tap.
    // La photo « capture » le doigt dès qu'il la touche et s'ouvre quand il se relève, même si la page
    // a bougé entre-temps. La vue agrandie ignore les touches pendant 0,4 s (sinon le même tap la refermerait).
    let photoPressed = false;
    let zoomOpenedAt = 0;
    const photo = $('questionPhotoImg');
    photo.addEventListener('pointerdown', e => {
        e.preventDefault();   // garde le clavier ouvert : la photo ne bouge pas sous le doigt
        photoPressed = true;
        try { photo.setPointerCapture(e.pointerId); } catch (err) { /* ancien navigateur */ }
    });
    photo.addEventListener('pointercancel', () => { photoPressed = false; });
    photo.addEventListener('pointerup', () => {
        if (!photoPressed) return;
        photoPressed = false;
        $('photoZoomImg').src = photo.src;
        $('photoZoomCredit').textContent = $('questionPhotoCredit').textContent;
        $('photoZoom').hidden = false;
        zoomOpenedAt = Date.now();
        // Fermer le clavier : champ verrouillé + curseur retiré + focus donné à la vue agrandie
        // (un simple blur() ne suffit pas sur certains téléphones)
        const input = $('userInput');
        input.readOnly = true;
        input.blur();
        $('photoZoom').focus({ preventScroll: true });
    });
    $('photoZoom').addEventListener('click', () => {
        if (Date.now() - zoomOpenedAt < 400) return;
        $('photoZoom').hidden = true;
        if (state.phase === 'answering') {
            $('userInput').readOnly = false;
            $('userInput').focus();   // le clavier revient pour répondre
        }
    });

    $('reportModal').addEventListener('click', e => {
        if (e.target === $('reportModal')) $('reportModal').hidden = true;
    });

    // Sauvegarde en ligne
    $('cloudSignupBtn').addEventListener('click', () => openAuthModal('signup'));
    $('cloudLoginBtn').addEventListener('click', () => openAuthModal('login'));
    $('cloudLogoutBtn').addEventListener('click', cloudLogout);
    $('closeAuthBtn').addEventListener('click', () => { $('authModal').hidden = true; });
    $('authSwitch').addEventListener('click', () => openAuthModal(authMode === 'signup' ? 'login' : 'signup'));
    $('authForgot').addEventListener('click', forgotPassword);
    $('authForm').addEventListener('submit', submitAuth);
    $('keepCloudBtn').addEventListener('click', () => { if (pendingRemote) applyRemote(pendingRemote); });
    $('keepDeviceBtn').addEventListener('click', async () => {
        $('cloudConflictModal').hidden = true;
        await cloudPush();
        showToast('📱 Progression de cet appareil gardée et sauvegardée en ligne.');
    });

    $('quitStayBtn').addEventListener('click', closeQuitModal);
    $('quitConfirmBtn').addEventListener('click', () => {
        closeQuitModal();
        returnToMap();
    });
    $('quitModal').addEventListener('click', e => {
        if (e.target === $('quitModal')) closeQuitModal();
    });

    $('resetBtn').addEventListener('click', () => {
        if (!confirm('Effacer tous tes niveaux, ton XP, ta série et tes statistiques ?')) return;
        state.data = normalizeData(defaultData());
        saveData();
        renderHeader();
        renderMap();
    });

    // Popup de démarrage : fermer, cliquer à côté, ou valider avec « Commencer »
    $('closeModalBtn').addEventListener('click', closeStartModal);
    $('startModal').addEventListener('click', e => {
        if (e.target === $('startModal')) closeStartModal();
    });
    $('startLevelBtn').addEventListener('click', () => {
        const { pendingMode: mode, pendingLevel: level } = state;
        closeStartModal();
        if (mode === 'level') {
            if (level) startSession('level', level);
        } else {
            startSession(mode);
        }
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && !$('startModal').hidden) {
            closeStartModal();
            return;
        }
        if (e.key === 'Escape' && !$('streakModal').hidden) {
            $('streakModal').hidden = true;
            return;
        }
        if (!$('photoZoom').hidden) {
            if (e.key === 'Escape' || e.key === 'Enter') $('photoZoom').click();
            return;
        }
        if (!$('authModal').hidden || !$('cloudConflictModal').hidden) {
            if (e.key === 'Escape' && !$('authModal').hidden) $('authModal').hidden = true;
            return;   // le formulaire gère lui-même la touche Entrée
        }
        if (!$('reportModal').hidden) {
            if (e.key === 'Escape') $('reportModal').hidden = true;
            return;   // fenêtre ouverte : Entrée ne doit pas valider la question derrière
        }
        if (!$('quitModal').hidden) {
            if (e.key === 'Escape') closeQuitModal();
            return;   // popup ouverte : Entrée ne doit pas valider la question derrière
        }
        // Entrée : vérifier, puis continuer (sauf si un bouton a le focus)
        if (e.key !== 'Enter' || e.repeat) return;
        if (e.target.closest && e.target.closest('button')) return;
        if ($('studyScreen').hidden) return;
        // On « consomme » la touche : sinon, si une popup s'ouvre et prend le focus,
        // le même appui sur Entrée cliquerait aussitôt sur son bouton.
        if (state.phase === 'answering' || state.phase === 'feedback') e.preventDefault();
        if (state.phase === 'answering') verify(false);
        else if (state.phase === 'feedback') commit(state.verdict !== 'wrong');
    });
}

function init() {
    bindEvents();
    flushReports();                                         // signalements restés en attente
    cloudInit();                                            // compte connecté ? synchronisation
    window.addEventListener('online', flushReports);        // dès que la connexion revient
    buildDecor($('mapDecor'), Math.round(MAX_LEVEL * 1.2));
    buildDecor($('lessonDecor'), 8);
    checkBadges(true);   // badges déjà mérités : on les attribue sans notification
    renderHeader();
    showScreen('map');

    // Tout premier lancement : parcours d'accueil (niveau, objectif, puis test de placement ou niveau 1)
    const d = state.data;
    if (!d.onboarded && canTakePlacement() && Object.keys(d.stats).length === 0) startOnboarding();
}

document.addEventListener('DOMContentLoaded', init);

// Application installable : le service worker garde une copie du jeu pour jouer hors connexion
// (ne marche qu'en https ou sur localhost, pas en ouvrant le fichier directement)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}