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
const REVIEW_MAX = 5;            // maximum : +1 place par tranche de 3 questions ratées (12 questions au plus par niveau)
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
    { xp: 6000, name: 'Encyclopédie vivante' },   // ≈ fin du parcours (~40 XP par niveau)
    // Au-delà : pour ceux qui continuent (défi du jour, sprint, révisions)
    { xp: 10000, name: 'Puits de science' },
    { xp: 15000, name: 'Oracle' },
    { xp: 25000, name: 'Légende de Kultivo' }
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

// Coffres du parcours : un coffre après chaque niveau multiple de 5 (3 cartes ; 4 après un défi, dont une rare ou mieux)
const CHEST_EVERY = 5;
const chestSize = n => n % CHALLENGE_EVERY === 0 ? 4 : 3;
const SHOP_CHEST = { price: 150, size: 3 };   // coffre de la boutique : 3 cartes, dont une rare ou mieux
const GOAL_CARDS = 1;                          // carte offerte avec la récompense de l'objectif du jour

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

// Nombres écrits en lettres → chiffres, pour que « Les 3 Mousquetaires » = « Les Trois Mousquetaires »
// (« un » et « une » sont exclus : ce sont surtout des articles)
const NUMBER_WORDS = { deux: '2', trois: '3', quatre: '4', cinq: '5', six: '6', sept: '7', huit: '8',
                       neuf: '9', dix: '10', onze: '11', douze: '12', vingt: '20', cent: '100', mille: '1000' };

function normalize(str) {
    return str
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/œ/g, 'oe').replace(/æ/g, 'ae')
        .replace(/[’'\-–—]/g, ' ')
        .replace(/[^\p{L}\p{N}\s]/gu, '')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ').map(w => NUMBER_WORDS[w] || w).join(' ');
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
        orderStats: {},                  // niveaux Ordre : « famille:carte » -> { miss, streak, last }
        cards: {},                       // collection : id de carte (cards.js) -> nombre d'exemplaires
        chests: {},                      // coffres du parcours ouverts : n° du niveau -> date
        podium: {},                      // classement : lundi de la semaine -> place obtenue (0 = rien)
        avatar: null,                    // avatar choisi : { hue: 0-359, emoji: '🦉' ou null = initiale }
        sound: true,                     // sons et vibrations
        onboarded: false,                // parcours d'accueil terminé
        activeDays: {},                  // jours joués : « AAAA-MM-JJ » -> XP gagnés ce jour-là
        frozenDays: {},                  // jours manqués sauvés par un gel de série
        selfLevel: null,                 // niveau annoncé à l'accueil : 'beginner', 'average' ou 'expert'
        welcomeGift: false,              // cadeau de bienvenue déjà donné
        tourDone: false,                 // tutoriel de découverte déjà vu
        tipReview: false,                // explication du bouton « ↻ à revoir » déjà vue
        tipChest: false,                 // explication du 1er coffre à ouvrir déjà vue
        tipReviews: false,               // explication de « + X révisions » déjà vue
        reports: []                      // signalements en attente d'envoi (Supabase plus tard) : [{ id, q, typed, reason… }]
    };
}

/** Remet d'équerre une sauvegarde (ex. : de nouveaux niveaux ou de nouvelles fonctions). */
function normalizeData(data) {
    const base = defaultData();
    for (const key of ['dayXp', 'totals', 'best', 'inv']) data[key] = { ...base[key], ...data[key] };
    for (const key of ['goalDays', 'daily', 'badges', 'claimedBadges', 'claimedGoals', 'stats', 'done', 'pairStats', 'orderStats', 'cards', 'chests', 'podium', 'activeDays', 'frozenDays']) data[key] = data[key] || {};
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
    toast.addEventListener('click', () => toast.remove());   // un tap le ferme
    setTimeout(() => toast.remove(), 2500);
}

/* ---------- Défi du jour ---------- */

/** Les mêmes 10 questions pour tout le monde un jour donné (graine = la date). */
function dailyQuestions(day) {
    const sorted = [...QUESTIONS].sort((a, b) => a.id - b.id);
    return seededShuffle(sorted, `culture-g-${day}`).slice(0, DAILY_SIZE);
}

/* ---------- Décors latéraux ---------- */

// Une icône par thème du jeu, et quelques anecdotes (un tap sur l'icône du parcours en affiche une)
// Une icône par thème du jeu. Les anecdotes sont dans facts.js (THEME_FACTS) :
// chaque icône du parcours a la sienne (tap = bulle).
const THEME_DECOR = [
    { theme: 'Histoire', icon: '📜' },
    { theme: 'Sciences', icon: '🔬' },
    { theme: 'Géographie', icon: '🌍' },
    { theme: 'Technologie', icon: '💡' },
    { theme: 'Musique', icon: '🎼' },
    { theme: 'Littérature', icon: '📚' },
    { theme: 'Jeux', icon: '🎲' },
    { theme: 'Cinéma', icon: '🎬' },
    { theme: 'Gastronomie', icon: '🧀' },
    { theme: 'Sport', icon: '⚽' },
    { theme: 'Arts', icon: '🎨' },
    { theme: 'Langue française', icon: '🗣️' },
    { theme: 'Mythologie', icon: '⚡' },
    { theme: 'Drapeaux', icon: '🚩' },
    { theme: 'Monuments', icon: '🏛️' }
];
const DECOR_ICONS = THEME_DECOR.map(t => t.icon);   // décors de l'écran de leçon (sur ordinateur)

/** Bulle d'anecdote près de l'icône touchée (chaque icône a son anecdote attitrée). */
function showFact(theme, badge) {
    const entry = THEME_DECOR.find(t => t.theme === theme);
    const facts = (typeof THEME_FACTS !== 'undefined' && THEME_FACTS[theme]) || [];
    if (!entry || !facts.length) return;
    $('factTitle').textContent = `${entry.icon} ${entry.theme}`;
    // Espaces insécables autour de « », : ! ? : la ponctuation ne se retrouve jamais seule en début de ligne
    const fact = facts[Number(badge.dataset.fact || 0) % facts.length];
    $('factText').textContent = fact.replace(/« /g, '« ').replace(/ ([»:!?])/g, ' $1');
    const bubble = $('factBubble');
    bubble.hidden = false;
    const r = badge.getBoundingClientRect();
    const top = r.bottom + 10 + bubble.offsetHeight < window.innerHeight - 90 ? r.bottom + 10 : r.top - 10 - bubble.offsetHeight;
    bubble.style.top = `${Math.max(70, top)}px`;
}

/** Bouton « 📍 Mon niveau » : visible seulement si le niveau en cours est hors de l'écran (flèche = direction). */
function updateToCurrentBtn() {
    const btn = $('toCurrentBtn');
    const current = document.querySelector('.node.is-current');
    if ($('mapScreen').hidden || !current) { btn.hidden = true; return; }
    const r = current.getBoundingClientRect();
    const above = r.bottom < 60;
    const below = r.top > window.innerHeight - 90;
    btn.hidden = !(above || below);
    btn.textContent = above ? '⬆ Mon niveau' : '⬇ Mon niveau';
}

function buildDecor(container, count) {
    container.replaceChildren();
    const seen = {};   // combien d'icônes de chaque thème déjà posées → anecdote suivante du thème
    for (let i = 0; i < count; i++) {
        const badge = el('span', `decor-badge ${i % 2 === 0 ? 'left' : 'right'} float-${(i % 3) + 1}`);
        const entry = THEME_DECOR[(i * 7 + 3) % THEME_DECOR.length];
        badge.textContent = entry.icon;
        badge.dataset.theme = entry.theme;
        badge.dataset.fact = String(seen[entry.theme] = (seen[entry.theme] ?? -1) + 1);
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

const MAIN_SCREENS = ['map', 'challenges', 'league', 'shop', 'profile'];

function showScreen(name) {
    $('mapScreen').hidden = name !== 'map';
    $('challengesScreen').hidden = name !== 'challenges';
    $('leagueScreen').hidden = name !== 'league';
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

    if (name === 'map') {
        renderMap();
        // Première arrivée sur le parcours après l'accueil : petit tutoriel
        if (state.data.onboarded && !state.data.tourDone) setTimeout(startTour, 500);
    }
    if (name === 'challenges') { window.scrollTo(0, 0); renderChallenges(); leagueLoad(); }
    if (name === 'league') { window.scrollTo(0, 0); leagueMsg = null; renderLeague(); leagueLoad(); }
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

    // 3. Demandes d'amis reçues (onglet Classement)
    const requests = cloudUser && league?.userId === cloudUser.id ? league.incoming.length : 0;
    const leagueBtn = document.querySelector('.nav-btn[data-screen="league"]');
    if (requests > 0) leagueBtn.setAttribute('data-notif', requests);
    else leagueBtn.removeAttribute('data-notif');

    // 4. Coffres à ouvrir sur le parcours
    const chests = readyChests().length;
    const mapBtn = document.querySelector('.nav-btn[data-screen="map"]');
    if (chests > 0) mapBtn.setAttribute('data-notif', chests);
    else mapBtn.removeAttribute('data-notif');
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
    if (n > 0 && !state.data.tipReview) maybeShowReviewTip();   // 1re apparition : petite explication

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
        if (n % CHEST_EVERY === 0) list.append(chestStop(n));
    }

    if (focusNode) focusNode.scrollIntoView({ block: 'center' });
    setTimeout(updateToCurrentBtn, 50);
    if (!state.data.tipChest && readyChests().length) maybeShowChestTip();
    else if (!state.data.tipReviews && currentReviewsLabel()) maybeShowReviewsTip();
}

/* ---------- Coffres et collection de cartes ---------- */

const chestReady = n => !!state.data.done[n] && !state.data.chests[n];
const readyChests = () => {
    const list = [];
    for (let n = CHEST_EVERY; n <= MAX_LEVEL; n += CHEST_EVERY) if (chestReady(n)) list.push(n);
    return list;
};

/** Coffre posé sur le parcours, juste au-dessus du niveau n : gris (à gagner), doré (à ouvrir) ou ouvert. */
function chestStop(n) {
    const ready = chestReady(n);
    const opened = !!state.data.chests[n];
    const li = el('li', 'stop chest-stop');
    li.style.setProperty('--x', `${Math.round(Math.sin((n + 0.5) * 1.3) * 52)}px`);
    const btn = el('button', `chest-node ${ready ? 'is-ready' : opened ? 'is-open' : 'is-locked'}`);
    btn.type = 'button';
    btn.textContent = '🎁';
    btn.setAttribute('aria-label', ready ? `Coffre à ouvrir (${chestSize(n)} cartes)`
        : opened ? 'Coffre déjà ouvert' : `Coffre : termine le niveau ${n} pour l’ouvrir`);
    btn.addEventListener('click', () => {
        if (chestReady(n)) openChests(readyChests());   // tous les coffres en attente d'un coup
        else showToast(state.data.chests[n] ? '🎁 Coffre déjà ouvert. Tes cartes sont dans le Profil.'
            : `🎁 Termine le niveau ${n} pour ouvrir ce coffre.`);
    });
    li.append(btn);
    return li;
}

/** Tire une carte : rareté au hasard (pondérée), puis de préférence une carte pas encore possédée. */
function drawCard(minRarity, exclude) {
    const order = Object.keys(CARD_RARITIES);
    const allowed = order.slice(order.indexOf(minRarity || 'common'));
    const rarity = weightedPick(allowed, r => CARD_RARITIES[r].weight, 1)[0];
    const pool = CARDS.filter(c => c.rarity === rarity && !exclude.includes(c));
    const missing = pool.filter(c => !state.data.cards[c.id]);
    const from = missing.length && Math.random() < 0.8 ? missing : pool;
    return from[Math.floor(Math.random() * from.length)];
}

/** Ouvre les coffres des niveaux donnés : les cartes sont gagnées (et enregistrées) tout de suite.
    Un seul coffre : cartes montrées une à une. Plusieurs : toutes les cartes d'un coup, en grille. */
function openChests(levels) {
    for (const n of levels) state.data.chests[n] = Date.now();
    const boxes = levels.map(n => ({ size: chestSize(n), rare: n % CHALLENGE_EVERY === 0 }));
    const title = levels.length > 1 ? `🎁 ${levels.length} coffres !`
        : levels[0] % CHALLENGE_EVERY === 0 ? '🎁 Gros coffre !' : '🎁 Coffre';
    openCardBoxes(boxes, title);
}

/** Tire les cartes de chaque coffre ({ size, rare : au moins une rare ou mieux }), les ajoute à la collection
    (doublon = pièces), enregistre, puis ouvre la fenêtre du coffre. */
function openCardBoxes(boxes, title) {
    const data = state.data;
    const results = [];
    for (const { size, rare } of boxes) {
        const picked = [];
        for (let i = 0; i < size; i++) {
            const needRare = rare && i === size - 1 && picked.every(c => c.rarity === 'common');
            picked.push(drawCard(needRare ? 'rare' : null, picked));
        }
        for (const card of picked) {
            const isNew = !data.cards[card.id];
            data.cards[card.id] = (data.cards[card.id] || 0) + 1;
            const coins = isNew ? 0 : CARD_RARITIES[card.rarity].dupCoins;
            data.coins += coins;
            results.push({ card, isNew, coins });
        }
    }
    saveData();

    const many = boxes.length > 1;
    state.chest = { results, step: -1, many };
    $('chestTitle').textContent = title;
    const stage = $('chestStage');
    stage.replaceChildren();
    const gift = el('button', 'chest-gift');
    gift.type = 'button';
    gift.textContent = '🎁';
    gift.setAttribute('aria-label', 'Ouvrir le coffre');
    gift.addEventListener('click', chestNext);
    stage.append(gift);
    $('chestNote').textContent = `${plural(results.length, 'carte', 'cartes')} à l’intérieur. Touche le coffre !`;
    $('chestBtn').textContent = 'Ouvrir';
    $('chestModal').hidden = false;
}

/* Ouverture façon « Clash Royale » : la carte arrive de dos, tremble plus ou moins longtemps selon sa
   rareté (lueur de sa couleur), puis se retourne. Épique / légendaire : rayons de lumière et confettis.
   Un tap (sur la carte ou le bouton) pendant l'animation la termine tout de suite. */
const CARD_CHARGE_MS = { common: 250, rare: 550, epic: 900, legendary: 1300 };
const CARD_CONFETTI = { epic: ['#8b5cf6', '#c9b6ff', '#ffffff'], legendary: ['#ffc800', '#ffb300', '#fff3b0', '#ff9600'] };

/** Carte retournable : dos (logo) + face. */
function cardFlip(card, big) {
    const flip = el('div', `flip rarity-${card.rarity}${big ? ' is-big' : ''}`);
    const rays = el('div', 'flip-rays');
    const inner = el('div', 'flip-inner');
    const back = el('div', 'flip-back');
    const logo = el('img');
    logo.src = 'icons/logo.svg';
    logo.alt = '';
    back.append(logo);
    const front = el('div', 'flip-front');
    front.append(cardFace(card, big));
    inner.append(back, front);
    flip.append(rays, inner);
    return flip;
}

/** Effets au moment où la carte se retourne (son, confettis selon la rareté). */
function cardRevealFx(rarity) {
    playSound(rarity === 'common' ? 'pair' : rarity === 'rare' ? 'good' : 'win');
    if (CARD_CONFETTI[rarity]) launchConfetti(CARD_CONFETTI[rarity]);
}

/** Une seule carte en grand : charge, puis se retourne. */
function revealCard(chest) {
    const { card, isNew, coins } = chest.results[chest.step];
    const flip = cardFlip(card, true);
    $('chestTitle').textContent = `Carte ${chest.step + 1} / ${chest.results.length}`;
    $('chestStage').replaceChildren(flip);
    $('chestNote').textContent = '';
    $('chestBtn').textContent = chest.step < chest.results.length - 1 ? 'Carte suivante' : 'Super !';
    flip.classList.add('is-charging');
    chest.finish = () => {
        chest.finish = null;
        clearTimeout(chest.timer);
        flip.classList.remove('is-charging');
        flip.classList.add('is-flipped');
        cardRevealFx(card.rarity);
        $('chestNote').textContent = isNew ? '✨ Nouvelle carte !' : `Déjà dans ta collection : +${coins} 🪙`;
    };
    chest.timer = setTimeout(() => chest.finish && chest.finish(), CARD_CHARGE_MS[card.rarity]);
    flip.addEventListener('click', () => chest.finish && chest.finish());
}

/** Plusieurs coffres : toutes les cartes en grille, de dos, qui se retournent l'une après l'autre. */
function showChestSummary(chest) {
    const { results } = chest;
    const grid = el('div', 'chest-summary');
    const flips = results.map(({ card, isNew }) => {
        const flip = cardFlip(card, false);
        if (isNew) {
            const tag = el('span', 'kcard-new');
            tag.textContent = 'Nouvelle';
            flip.append(tag);
        }
        grid.append(flip);
        return flip;
    });
    const fresh = results.filter(r => r.isNew).length;
    const coins = results.reduce((sum, r) => sum + r.coins, 0);
    const order = Object.keys(CARD_RARITIES);
    const best = results.reduce((top, r) => order.indexOf(r.card.rarity) > order.indexOf(top) ? r.card.rarity : top, 'common');
    $('chestTitle').textContent = `🃏 ${plural(results.length, 'carte', 'cartes')}`;
    $('chestStage').replaceChildren(grid);
    $('chestNote').textContent = '';
    $('chestBtn').textContent = 'Super !';

    let i = 0;
    const done = () => {
        chest.finish = null;
        if (CARD_CONFETTI[best]) launchConfetti(CARD_CONFETTI[best]);
        $('chestNote').textContent = `✨ ${plural(fresh, 'nouvelle', 'nouvelles')}${coins ? ` · doublons : +${coins} 🪙` : ''}`;
    };
    const step = () => {
        flips[i].classList.add('is-flipped');
        if (i % 2 === 0) playSound('pair');
        i++;
        if (i < flips.length) chest.timer = setTimeout(step, 110);
        else done();
    };
    chest.finish = () => {   // tap pendant l'animation : tout se retourne d'un coup
        clearTimeout(chest.timer);
        flips.forEach(f => f.classList.add('is-flipped'));
        done();
    };
    chest.timer = setTimeout(step, 250);
}

/** Bouton du coffre : ouvre, puis montre la carte suivante (ou toutes d'un coup), puis ferme. */
function chestNext() {
    const chest = state.chest;
    if (!chest) { closeChest(); return; }
    if (chest.finish) { chest.finish(); return; }   // animation en cours : on la termine
    chest.step++;
    if (chest.step >= chest.results.length || (chest.many && chest.step > 0)) { closeChest(); return; }
    if (chest.many) showChestSummary(chest);
    else revealCard(chest);
}

let chestBack = null;   // carte / badge ouvert depuis le profil d'un ami : y revenir en fermant
function closeChest() {
    const wasChest = !!state.chest;
    if (wasChest) clearTimeout(state.chest.timer);
    state.chest = null;
    $('chestModal').hidden = true;
    if (chestBack) { const back = chestBack; chestBack = null; back(); return; }
    if (wasChest) {
        renderHeader();
        if (!$('mapScreen').hidden) {
            // On redessine le parcours sans revenir au niveau en cours : on reste où l'on était
            const y = window.scrollY;
            renderMap();
            window.scrollTo(0, y);
        }
        if (!$('shopScreen').hidden) renderShop();
        if (!$('challengesScreen').hidden) renderChallenges();
    }
}

/** Une carte : cadre de la couleur de sa rareté, image, nom (et, en grand, thème et anecdote). */
function cardFace(card, big = false) {
    const box = el('div', `kcard rarity-${card.rarity}${big ? ' is-big' : ''}`);
    const art = el('div', 'kcard-art');
    art.append(emojiImg(card.icon));
    const name = el('div', 'kcard-name');
    name.textContent = card.name;
    box.append(art, name);
    if (big) {
        const meta = el('div', 'kcard-meta');
        meta.textContent = `${CARD_RARITIES[card.rarity].name} · ${card.theme}`;
        const text = el('p', 'kcard-text');
        text.textContent = card.text;
        box.append(meta, text);
    }
    return box;
}

/** Carte de la collection en grand (même fenêtre que le coffre). */
function openCardView(card, onBack = null) {
    state.chest = null;
    chestBack = onBack;
    $('chestTitle').textContent = `🃏 ${card.theme}`;
    $('chestStage').replaceChildren(cardFace(card, true));
    $('chestNote').textContent = '';
    $('chestBtn').textContent = onBack ? '← Retour' : 'Fermer';
    $('chestModal').hidden = false;
}

/** Badge en grand (depuis le profil d'un ami), même fenêtre que les cartes. */
function openBadgeView(badge, onBack = null) {
    state.chest = null;
    chestBack = onBack;
    $('chestTitle').textContent = '🎖️ Badge';
    const box = el('div', 'badge-big');
    const icon = el('div', 'badge-big-icon');
    icon.textContent = badge.icon;
    const name = el('b');
    name.textContent = badge.name;
    const desc = el('p');
    desc.textContent = badge.desc;
    box.append(icon, name, desc);
    $('chestStage').replaceChildren(box);
    $('chestNote').textContent = '';
    $('chestBtn').textContent = onBack ? '← Retour' : 'Fermer';
    $('chestModal').hidden = false;
}

/** Profil : la collection, rangée par thème (cartes manquantes en gris). */
function renderCollection() {
    const owned = CARDS.filter(c => state.data.cards[c.id]).length;
    $('cardCount').textContent = `${owned} / ${CARDS.length}`;
    const grid = $('cardGrid');
    grid.replaceChildren();
    if (owned === 0) {
        const hint = el('p', 'muted');
        hint.textContent = 'Ouvre les coffres 🎁 du parcours pour gagner tes premières cartes.';
        grid.append(hint);
    }
    const themes = [...new Set(CARDS.map(c => c.theme))];
    for (const theme of themes) {
        const cards = CARDS.filter(c => c.theme === theme);
        const head = el('div', 'card-theme-head');
        const n = cards.filter(c => state.data.cards[c.id]).length;
        head.textContent = `${theme} · ${n}/${cards.length}`;
        const row = el('div', 'card-row');
        for (const card of cards) {
            const count = state.data.cards[card.id] || 0;
            if (count) {
                const btn = el('button', 'kcard-btn');
                btn.type = 'button';
                btn.append(cardFace(card));   // les doublons donnent des pièces (le nombre reste enregistré dans `cards`)
                btn.setAttribute('aria-label', `${card.name}, ${CARD_RARITIES[card.rarity].name}`);
                btn.addEventListener('click', () => openCardView(card));
                row.append(btn);
            } else {
                const box = el('div', `kcard is-missing rarity-${card.rarity}`);
                box.textContent = '?';
                box.title = `Carte ${CARD_RARITIES[card.rarity].name.toLowerCase()} pas encore trouvée`;
                row.append(box);
            }
        }
        grid.append(head, row);
    }
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
    hintBox.hidden = !isReached;   // pas encore atteint : la barre suffit (pas de phrase répétée)

    if (isReached && !isClaimed) {
        const claimBtn = el('button', 'btn btn-green');
        claimBtn.textContent = `🎁 Récupérer ${reward} 🪙`;
        claimBtn.style.marginTop = '10px';
        
        claimBtn.addEventListener('click', () => {
            data.claimedGoals[today] = true;
            data.coins += reward;
            saveData();
            renderHeader();
            renderChallenges(); // Met à jour l'écran pour cacher le bouton
            // + une carte à collectionner (même fenêtre que les coffres)
            openCardBoxes([{ size: GOAL_CARDS }], `🎯 +${reward} 🪙 et une carte !`);
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
        $('dailyDesc').textContent = 'Terminé ! Nouveau défi demain.';
        $('dailyScore').textContent = `${result.score}/${DAILY_SIZE}`;
        $('dailyTime').textContent = `en ${fmtTime(result.seconds)}`;
        $('dailyGrid').textContent = result.grid;
    } else {
        $('dailyDesc').textContent = `${DAILY_SIZE} questions, les mêmes pour tout le monde. Un seul essai !`;
    }
    $('dailyResult').hidden = !result;
    $('dailyDesc').hidden = !!result;   // terminé : l'encadré du résultat suffit
    $('dailyCard').classList.toggle('card-violet', !result);   // cadre violet = « à faire aujourd'hui »
    $('dailyBtn').hidden = !!result;
    renderDailyFriends(result);

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

    $('profileName').textContent = cloudUser && league?.userId === cloudUser.id && league.pseudo ? league.pseudo : 'Mon profil';
    $('profileTitle').textContent = `🎖️ ${current.name} ›`;
    $('avatarBtn').replaceChildren(avatarEl(myAvatarName(), data.avatar), el('span', 'avatar-edit'));
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
    const nbsp = '\u00a0';   // espace insécable : « 69 % » ne se coupe jamais en deux lignes
    $('tileStreak').textContent = plural(currentStreak(), 'jour', 'jours').replace(' ', nbsp);
    $('tileRate').textContent = data.totals.tries > 0
        ? `${Math.round((data.totals.right / data.totals.tries) * 100)}${nbsp}%`
        : '—';
    $('tileLevels').textContent = `${finished}${nbsp}/${nbsp}${MAX_LEVEL}`;

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

    renderCollection();

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
    { id: 'hintLength', icon: '🔤', short: 'Forme',           name: 'Indice : forme',
      desc: 'Les mots et les lettres de la réponse, en cases vides.', price: 15,  size: 'third' }, // avant: 5
    { id: 'hintLetter', icon: '🅰️', short: 'Initiales',       name: 'Indice : initiales',
      desc: 'La première lettre de chaque mot.',              price: 30, size: 'third' }, // avant: 10
    { id: 'hintStart',  icon: '🔎', short: 'Plus de lettres', name: 'Indice : plus de lettres',
      desc: 'Environ un tiers des lettres de chaque mot.',    price: 50, size: 'third' }, // avant: 20
    { id: 'heart',      icon: '💖', short: 'Cœur de secours', name: 'Cœur de secours',
      desc: 'Quand tu perds ton dernier cœur, le jeu te propose de l’utiliser pour continuer ta leçon.', price: 100, size: 'half' }, // avant: 30
    { id: 'freeze',     icon: '🧊', short: 'Gel de série',    name: 'Gel de série',
      desc: 'Protège ta série quand tu rates un jour (un gel par jour manqué). Maximum 5.', price: 200, size: 'half', max: 5 } // avant: 60
];
const HINT_IDS = ['hintLength', 'hintLetter', 'hintStart'];

/* Indices en grille, comme au pendu : chaque indice dévoile un peu plus la même grille.
   Niveau 1 (forme) : cases vides ; 2 (initiales) : 1re lettre de chaque mot ; 3 (plus de lettres) : environ un
   tiers de chaque mot, toujours au moins une lettre de plus que les initiales. Petits mots montrés en entier. */
const HINT_LEVEL = { hintLength: 1, hintLetter: 2, hintStart: 3 };
const HINT_SMALL_WORDS = new Set(['le', 'la', 'les', 'l', 'de', 'du', 'des', 'd', 'un', 'une', 'et', 'à', 'au', 'aux', 'en']);

/** Combien de lettres d'un mot sont montrées au niveau donné. */
function hintShown(len, level) {
    if (level <= 1) return 0;
    if (level === 2) return 1;
    return Math.min(len - 1, Math.max(2, Math.ceil(len / 3))) || 1;
}

/** Grille de la réponse principale : mots (lettres et chiffres) et séparateurs (espaces, apostrophes, tirets). */
function hintGrid(q, level) {
    const answer = q.a[0].trim();
    const parts = answer.match(/[\p{L}\p{N}]+|[^\p{L}\p{N}]+/gu) || [];
    const words = parts.filter(t => /[\p{L}\p{N}]/u.test(t));
    const box = el('div', 'hint-grid');
    let word = null;
    parts.forEach(part => {
        if (!/[\p{L}\p{N}]/u.test(part)) {
            // Séparateur : une espace coupe la ligne ; une apostrophe ou un tiret reste collé au mot
            if (/\s/.test(part)) { word = null; return; }
            if (!word) { word = el('span', 'hint-word'); box.append(word); }
            const sep = el('span', 'hint-sep');
            sep.textContent = part.trim();
            word.append(sep);
            return;
        }
        if (!word) { word = el('span', 'hint-word'); box.append(word); }
        const small = words.length > 1 && HINT_SMALL_WORDS.has(part.toLowerCase());
        const letters = [...part];
        const shown = small ? letters.length : hintShown(letters.length, level);
        letters.forEach((ch, i) => {
            const cell = el('span', small ? 'hint-cell is-small' : i < shown ? 'hint-cell is-shown' : 'hint-cell');
            cell.textContent = i < shown ? ch.toUpperCase() : '';
            word.append(cell);
        });
    });
    return box;
}

/** Affiche la grille avec le niveau le plus fort parmi les indices pris sur cette carte. */
function renderHintGrid() {
    const level = Math.max(0, ...[...state.hintUsed].map(id => HINT_LEVEL[id] || 0));
    const list = $('hintList');
    list.replaceChildren();
    list.hidden = level === 0;
    if (!level) return;
    const li = el('li', 'hint-box');
    const label = el('span', 'hint-label');
    const item = SHOP.find(i => HINT_LEVEL[i.id] === level);
    label.textContent = `${item.icon} ${item.short}`;
    li.append(label, hintGrid(state.current.q, level));
    list.append(li);
}

function renderHintOptions() {
    const box = $('hintOptions');
    box.replaceChildren();
    $('hintCoins').textContent = `${state.data.coins} 🪙`;
    HINT_IDS.forEach(id => {
        const item = SHOP.find(i => i.id === id);
        const owned = state.data.inv[id] || 0;
        const best = Math.max(0, ...[...state.hintUsed].map(h => HINT_LEVEL[h] || 0));
        const used = state.hintUsed.has(id) || HINT_LEVEL[id] <= best;   // déjà visible dans la grille
        const btn = el('button', 'btn btn-hint');
        btn.type = 'button';
        btn.textContent = used ? `${item.icon} ${item.short} (déjà visible)`
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
    const best = Math.max(0, ...[...state.hintUsed].map(h => HINT_LEVEL[h] || 0));
    if (HINT_LEVEL[id] <= best) return;   // n'apporterait rien de plus
    const item = SHOP.find(i => i.id === id);
    const data = state.data;
    if ((data.inv[id] || 0) > 0) data.inv[id]--;
    else if (data.coins >= item.price) data.coins -= item.price;
    else return;

    state.hintUsed.add(id);
    saveData();
    renderHeader();

    renderHintGrid();
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

    // Coffre de cartes : ouvert tout de suite à l'achat
    const owned = CARDS.filter(c => data.cards[c.id]).length;
    const chest = el('article', 'card shop-card shop-chest');
    const icon = el('div', 'shop-icon');
    icon.textContent = '🎁';
    const name = el('h2');
    name.textContent = 'Coffre de cartes';
    const desc = el('p');
    desc.textContent = `${SHOP_CHEST.size} cartes à collectionner, dont au moins une rare.`;
    const stock = el('p', 'muted');
    stock.textContent = `Ta collection : ${owned} / ${CARDS.length}`;
    const actions = el('div', 'card-actions');
    const btn = el('button', 'btn btn-green');
    btn.type = 'button';
    btn.textContent = `Ouvrir · ${SHOP_CHEST.price} 🪙`;
    btn.disabled = data.coins < SHOP_CHEST.price;
    btn.addEventListener('click', () => {
        if (state.data.coins < SHOP_CHEST.price) return;
        state.data.coins -= SHOP_CHEST.price;
        openCardBoxes([{ size: SHOP_CHEST.size, rare: true }], '🎁 Coffre de cartes');
        renderHeader();
        renderShop();
    });
    actions.append(btn);
    chest.append(icon, name, desc, stock, actions);
    wallet.after(chest);   // juste sous les pièces : bien visible
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
    $('modalDesc').textContent = `Réponds à quelques questions de plus en plus difficiles : tu commenceras directement à ton niveau (jusqu’au niveau ${maxStart}), sans passer par les questions trop faciles pour toi.`;
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
 * - Le nombre de places grandit avec le nombre de questions ratées (3 à 5).
 * - On pioche dans les erreurs des niveaux PRÉCÉDENTS seulement (une révision porte sur ce qui vient avant ;
 *   toutes les erreurs restent dans le bouton « ↻ à revoir »).
 * - Tirage pondéré : plus une question est ratée, plus elle a de chances de sortir,
 *   mais ce n'est jamais toujours les mêmes.
 * - S'il reste des places, on complète avec des questions dues des niveaux précédents.
 */
function pickReviewCards(level) {
    const others = QUESTIONS.filter(q => q.niveau < level);
    const missed = others.filter(q => missCount(q.id) > 0);
    const slots = Math.min(REVIEW_MAX, REVIEW_MIN + Math.floor(missed.length / 3));

    const picked = weightedPick(missed, q => missCount(q.id) * 2 + 1, slots);
    if (picked.length < slots) {
        // Seulement des questions DÉJÀ VUES : après un test de placement, les questions des niveaux sautés
        // ne sont pas des « révisions » (le joueur ne les a jamais rencontrées)
        const fill = QUESTIONS.filter(q => q.niveau < level && missCount(q.id) === 0 && state.data.stats[q.id] && isDue(q));
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
    if (item.q.flag) {   // drapeau + petite loupe : un tap l'affiche en grand
        const wrap = el('span', 'photo-wrap');
        const badge = el('span', 'photo-zoom-badge');
        badge.textContent = '🔍';
        wrap.append(flagImg(item.q.flag), badge);
        $('questionFlag').replaceChildren(wrap);
    } else {
        $('questionFlag').replaceChildren();
    }
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
        // Nouvelle photo : l'ancienne est cachée pendant le chargement (sinon elle restait affichée un instant)
        const img = $('questionPhotoImg');
        if (img.getAttribute('src') !== item.q.photo) {
            img.classList.add('is-loading');
            img.src = item.q.photo;
            if (img.complete) img.classList.remove('is-loading');   // déjà en mémoire : tout de suite
        }
        $('questionPhotoCredit').textContent = item.q.credit || '';
        // Photos suivantes de la leçon chargées à l'avance
        state.queue.forEach(it => { if (it.q.photo) new Image().src = it.q.photo; });
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
        leaguePushScore();   // score du jour visible tout de suite par les amis
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
            primary: 'Comparer avec mes amis',
            onPrimary: () => { returnToMap(); showScreen('challenges'); },
            secondary: 'Retour au parcours',
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
                ? `Tu commences au niveau ${start} ! Les niveaux 1 à ${start - 1} sont validés : tu peux les rejouer quand tu veux.`
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
    // Tirage pondéré : une famille avec des cartes mal placées a plus de chances de sortir
    const missedIn = f => f.items.filter(it => orderMiss(orderKey(f, it[0])) > 0).length;
    const adapted = ORDER_FAMILIES.filter(f => nearCount(f) >= n);
    const eligible = weightedPick(adapted, f => 1 + missedIn(f), adapted.length);
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

/* Statistiques des cartes de frise (même principe que les paires : révisions et répétition espacée) */
const orderKey = (family, label) => `${family.id}:${label}`;
const orderMiss = key => state.data.orderStats[key]?.miss || 0;

function orderIsDue(key) {
    const s = state.data.orderStats[key];
    if (!s || !s.streak || !s.last) return true;
    const days = REVIEW_DAYS[Math.min(s.streak, REVIEW_DAYS.length - 1)];
    return Date.now() - s.last >= days * 86400000;
}

function recordOrderCard(key, ok) {
    const entry = state.data.orderStats[key] || { miss: 0 };
    entry.miss = ok ? Math.max(0, entry.miss - 1) : entry.miss + 1;
    entry.streak = ok ? (entry.streak || 0) + 1 : 0;
    entry.last = Date.now();
    state.data.orderStats[key] = entry;
}

/** Cartes proches de la difficulté visée. Au début, on exige qu'elles soient bien espacées
    dans le classement (faciles à départager) ; plus loin, elles peuvent être voisines.
    Les cartes déjà mal placées reviennent (2 au plus par frise), les cartes bien sues passent derrière. */
function pickOrderItems(family, t, n, progress) {
    const sorted = [...family.items].sort((a, b) => a[1] - b[1]);
    const rank = new Map(sorted.map((it, i) => [it, i]));
    const pool = family.items
        .map(it => {
            let score = Math.abs(it[3] - t) + Math.random() * 0.8;
            if (!orderIsDue(orderKey(family, it[0]))) score += 0.8;
            return { it, key: score };
        })
        .sort((a, b) => a.key - b.key)
        .map(x => x.it)
        .slice(0, Math.max(n + 4, Math.ceil(family.items.length * 0.7)));
    const must = family.items
        .filter(it => orderMiss(orderKey(family, it[0])) > 0 && it[3] <= t + 1.2)
        .sort((a, b) => orderMiss(orderKey(family, b[0])) - orderMiss(orderKey(family, a[0])) || Math.random() - 0.5)
        .slice(0, Math.min(2, n - 1));
    const rest = pool.filter(it => !must.includes(it));
    const minGap = Math.max(1, Math.round((1 - progress) * 3));   // 3 rangs d'écart au début, 1 à la fin
    let best = null;
    for (let attempt = 0; attempt < 60; attempt++) {
        const pick = shuffle([...must, ...shuffle(rest).slice(0, n - must.length)]);
        const ranks = pick.map(it => rank.get(it)).sort((a, b) => a - b);
        const gap = Math.min(...ranks.slice(1).map((r, i) => r - ranks[i]));
        if (!best || gap > best.gap) best = { pick, gap };
        if (gap >= minGap) break;
    }
    return best.pick.map(([label, value, shown]) => ({ label, value, shown, key: orderKey(family, label) }));
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
    correct.forEach((idx, i) => recordOrderCard(round.items[idx].key, round.placed[i] === idx));
    saveData();
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

/** Envoie la progression. Protection : l'XP ne baisse jamais en jouant ; si la sauvegarde en ligne a PLUS d'XP
    que l'appareil (ex. : données effacées, autre appareil), on ne l'écrase pas — on la récupère si l'appareil
    est vide, sinon on demande laquelle garder. `force` : choix explicite « Celle de cet appareil ». */
async function cloudPush(force = false) {
    const c = cloudClient();
    clearTimeout(cloudPushTimer);
    if (!c || !cloudUser || !navigator.onLine) return;
    const updatedAt = new Date().toISOString();
    try {
        if (!force) {
            const { data: remote, error: readError } = await c.from('saves')
                .select('data, xp, updated_at').eq('user_id', cloudUser.id).maybeSingle();
            if (readError) return;   // on réessaiera plus tard, sans risque d'écraser quoi que ce soit
            if (remote && (remote.xp || 0) > (state.data.xp || 0)) {
                if (isEmptyProgress(state.data)) applyRemote(remote);
                else if ($('cloudConflictModal').hidden) openCloudConflict(remote);
                return;
            }
        }
        const base = { user_id: cloudUser.id, data: state.data, xp: state.data.xp, updated_at: updatedAt };
        // coins / niveau : colonnes de supabase/table-joueurs.sql, pour lire (et changer les pièces) dans la table
        let { error } = await c.from('saves').upsert({ ...base, coins: state.data.coins, niveau: state.data.unlocked });
        if (error) ({ error } = await c.from('saves').upsert(base));
        if (!error) {
            setCloudMeta({ dirty: false, updatedAt });
            renderCloudCard();
            leaguePushScore();   // XP de la semaine pour le classement entre amis
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
        if (event === 'SIGNED_IN') setTimeout(leagueLoad, 0);
        if (!$('leagueScreen').hidden) renderLeague();
        if (event === 'PASSWORD_RECOVERY') setTimeout(askNewPassword, 300);
    });
    try {
        const { data } = await c.auth.getSession();
        cloudUser = data.session?.user || null;
    } catch (err) { cloudUser = null; }
    renderCloudCard();
    cloudSync(false).finally(claimGifts);   // cadeaux après la synchronisation (sinon elle pourrait les écraser)
    if (cloudUser) leagueLoad();   // demandes d'amis (pastille) et coffre du podium
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

/** Petit bouton du profil (« ☁️ Sauvegarder ma progression » / « ☁️ Sauvegardé il y a… ») et fenêtre « Mon compte ». */
function renderCloudCard() {
    const btn = $('cloudBtn');
    btn.hidden = !window.supabase && !cloudUser;
    if (!cloudUser) {
        btn.textContent = '👤 Se connecter';
        btn.title = 'Se connecter à son compte, ou en créer un';
        return;
    }
    const meta = cloudMeta();
    const status = meta.dirty ? 'Sauvegarde en cours…' : meta.updatedAt ? `Sauvegardé ${timeAgo(meta.updatedAt)}` : 'Connecté';
    btn.textContent = '☁️ Mon compte';   // libellé fixe et clair : on y trouve aussi « Se déconnecter »
    btn.title = status;
    $('accountEmail').textContent = cloudUser.email || '';
    $('accountStatus').textContent = `☁️ ${status}`;
}

/* Fenêtre « Créer un compte / Se connecter » */
let authMode = 'signup';
let authDone = null;   // à appeler après une connexion réussie (ex. : passer à l'étape suivante de l'accueil)
function openAuthModal(mode) {
    authMode = mode;
    const signup = mode === 'signup';
    $('authTitle').textContent = signup ? '👤 Créer un compte' : '👤 Se connecter';
    $('authSubmit').textContent = signup ? 'Créer mon compte' : 'Me connecter';
    $('authSubmit').disabled = false;
    $('authSwitch').textContent = signup ? 'J’ai déjà un compte : me connecter' : 'Pas encore de compte : en créer un';
    $('authPassword').autocomplete = signup ? 'new-password' : 'current-password';
    $('authForgot').hidden = signup;
    $('authError').textContent = '';
    $('authEmail').value = '';                  // champs vides à chaque ouverture (et en passant de l'un à l'autre)
    $('authPassword').value = '';
    $('authPassword').placeholder = signup ? '6 caractères minimum' : 'Mot de passe';
    $('authEmail').placeholder = 'Ton e-mail';
    $('authPassword').type = 'password';   // toujours masqué à l'ouverture
    $('authEye').textContent = '👁️';
    $('authModal').hidden = false;
    // Pas de focus automatique : le clavier ne s'ouvre que quand le joueur touche un champ (fenêtre entière visible)
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
    await cloudSync(true);   // peut récupérer la progression du compte (et relancer le jeu)
    if (authDone) { const next = authDone; authDone = null; next(); }
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

/** Déconnexion : la partie appartient au compte. On l'envoie une dernière fois, puis l'appareil repart de zéro
    (nouveau joueur sans compte) ; elle revient en se reconnectant. */
async function cloudLogout() {
    if (!await askConfirm({
        title: 'Se déconnecter ?',
        text: 'Ta partie reste dans ton compte. Cet appareil repartira de zéro jusqu’à ce que tu te reconnectes.',
        yes: 'Me déconnecter', danger: true
    })) return;
    if (!navigator.onLine) {
        showToast('📶 Il faut internet pour te déconnecter sans perdre tes dernières parties.');
        return;
    }
    await cloudPush();
    if (cloudMeta().dirty) {   // l'envoi n'a pas abouti : on ne prend pas le risque d'effacer
        showToast('☁️ Sauvegarde impossible pour le moment : réessaie dans un instant.');
        return;
    }
    try { await cloudClient().auth.signOut(); } catch (err) { /* tant pis */ }
    cloudUser = null;
    // Appareil remis à zéro (comme un nouveau joueur) ; la clé de sauvegarde reste la même
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeData(defaultData())));
        localStorage.removeItem(CLOUD_META_KEY);
        localStorage.removeItem(LEAGUE_KEY);
    } catch (err) { /* tant pis */ }
    location.reload();
}

/** Question oui / non dans une fenêtre du jeu (au lieu de confirm(), moche et qui affiche l'adresse du site).
    Renvoie une promesse : true = oui. `danger` : bouton rouge (retirer, effacer…). */
function askConfirm({ title, text = '', yes = 'Oui', no = 'Annuler', danger = false }) {
    const nbsp = t => t.replace(/ ([?!:»])/g, ' $1');   // « ? » jamais seul en début de ligne
    $('askTitle').textContent = nbsp(title);
    $('askText').textContent = nbsp(text);
    $('askText').hidden = !text;
    $('askYes').textContent = yes;
    $('askYes').classList.toggle('btn-red', danger);
    $('askYes').classList.toggle('btn-green', !danger);
    $('askNo').textContent = no;
    $('askModal').hidden = false;
    return new Promise(resolve => {
        const done = answer => {
            $('askModal').hidden = true;
            $('askYes').onclick = $('askNo').onclick = $('askModal').onclick = null;
            resolve(answer);
        };
        $('askYes').onclick = () => done(true);
        $('askNo').onclick = () => done(false);
        $('askModal').onclick = e => { if (e.target === $('askModal')) done(false); };   // tap à côté = non
    });
}

/** Tous les titres : ceux déjà atteints (✓), l'actuel (en vert, avec ce qu'il reste pour le suivant), ceux à venir (🔒). */
function openTitlesModal() {
    const xp = state.data.xp;
    const { current, next } = titleFor(xp);
    const list = $('titlesList');
    list.replaceChildren();
    TITLES.forEach(t => {
        const reached = xp >= t.xp;
        const isCurrent = t === current;
        const li = el('li', `title-row${isCurrent ? ' is-current' : reached ? ' is-reached' : ' is-locked'}`);
        const icon = el('span', 'title-icon');
        icon.textContent = isCurrent ? '🎖️' : reached ? '✓' : '🔒';
        const name = el('span', 'title-name');
        const b = el('b');
        b.textContent = t.name;
        const sub = el('span');
        sub.textContent = isCurrent ? (next ? 'Ton titre actuel' : 'Ton titre actuel : le plus haut !')
            : reached ? 'Déjà atteint' : `Encore ${t.xp - xp} XP`;
        name.append(b, sub);
        const need = el('span', 'title-xp');
        need.textContent = `${t.xp} XP`;
        li.append(icon, name, need);
        list.append(li);
    });
    $('titlesModal').hidden = false;
}

/* ---------- Avatar : rond de couleur avec l'initiale du pseudo, ou un petit dessin ---------- */

const AVATAR_HUES = [0, 25, 45, 90, 140, 175, 200, 225, 260, 290, 320, 340];
const AVATAR_EMOJIS = ['🦉', '🦈', '🦖', '🐋', '🐍', '🐎', '🍄', '🌻', '🎸', '🎷', '🎮', '🎲',
                       '🧩', '🔭', '🧲', '💡', '🤖', '⚽', '🏆', '🍿', '🥐', '🗿', '🌋', '🚂'];

/** Nom utilisé pour l'initiale : le pseudo, sinon « Moi ». */
const myAvatarName = () => (cloudUser && league?.userId === cloudUser.id && league.pseudo) || 'Moi';

/** Rond d'avatar. `look` = { hue, emoji } choisi par le joueur ; sinon couleur tirée du pseudo et initiale. */
function avatarEl(pseudo, look, cls = '') {
    const a = el('span', `league-avatar ${cls}`);
    let hue = look?.hue;
    if (!Number.isInteger(hue)) {
        hue = 0;
        for (const ch of pseudo) hue = (hue * 31 + ch.codePointAt(0)) % 360;
    }
    a.style.setProperty('--hue', String(hue));
    if (look?.emoji) a.append(emojiImg(look.emoji));
    else a.textContent = [...pseudo][0].toUpperCase();
    return a;
}

function openAvatarModal() {
    if (!state.data.avatar) {
        const auto = avatarEl(myAvatarName(), null);
        state.data.avatar = { hue: Number(auto.style.getPropertyValue('--hue')), emoji: null };
    }
    renderAvatarModal();
    $('avatarModal').hidden = false;
}

function renderAvatarModal() {
    const look = state.data.avatar;
    const name = myAvatarName();
    $('avatarPreview').replaceChildren(avatarEl(name, look, 'is-big'));
    const colors = $('avatarColors');
    colors.replaceChildren();
    AVATAR_HUES.forEach(hue => {
        const b = el('button', `avatar-swatch${look.hue === hue ? ' is-active' : ''}`);
        b.type = 'button';
        b.style.setProperty('--hue', String(hue));
        b.setAttribute('aria-label', 'Choisir cette couleur');
        b.addEventListener('click', () => { look.hue = hue; renderAvatarModal(); });
        colors.append(b);
    });
    const pics = $('avatarEmojis');
    pics.replaceChildren();
    [null, ...AVATAR_EMOJIS].forEach(emoji => {
        const b = el('button', `avatar-pick${look.emoji === emoji ? ' is-active' : ''}`);
        b.type = 'button';
        if (emoji) b.append(emojiImg(emoji));
        else b.textContent = [...name][0].toUpperCase();
        b.setAttribute('aria-label', emoji ? 'Choisir ce dessin' : 'Mettre mon initiale');
        b.addEventListener('click', () => { look.emoji = emoji; renderAvatarModal(); });
        pics.append(b);
    });
}

function closeAvatarModal() {
    $('avatarModal').hidden = true;
    saveData();
    pushAvatar();
    if (!$('profileScreen').hidden) renderProfile();
    if (!$('leagueScreen').hidden) renderLeague();
}

/** Envoie l'avatar avec le pseudo, pour que les amis le voient (colonnes de supabase/avatar.sql). */
async function pushAvatar() {
    const c = cloudClient();
    const look = state.data.avatar;
    if (!c || !cloudUser || !look || !league?.pseudo || league.userId !== cloudUser.id) return;
    try {
        await c.from('profiles').update({ avatar_hue: look.hue, avatar_emoji: look.emoji }).eq('user_id', cloudUser.id);
    } catch (err) { /* hors ligne, ou colonnes pas encore créées */ }
}

/* ---------- Classement entre amis (Supabase : profiles, friendships, scores) ---------- */
/* XP de la semaine (du lundi au dimanche, calculée depuis `activeDays`), amis ajoutés par pseudo
   avec une demande à accepter, lien d'invitation, coffre pour le podium de la semaine passée. */

const LEAGUE_KEY = 'kultivo_league';   // dernière version connue (affichée tout de suite, et hors ligne)
const INVITE_KEY = 'kultivo_invite';   // pseudo reçu par un lien d'invitation, en attente
const PSEUDO_RE = /^[A-Za-z0-9À-ÿ_.-]{3,16}$/;
const PODIUM_MIN_XP = 100;             // XP minimum dans la semaine pour avoir le coffre du lundi
let league = loadLeagueCache();
let leagueBusy = false;
let leagueMsg = null;                  // message sous le champ « ajouter un ami » : { text, kind: 'bad' | 'good' }

function loadLeagueCache() {
    try { return JSON.parse(localStorage.getItem(LEAGUE_KEY) || 'null'); } catch (err) { return null; }
}
function saveLeagueCache() {
    try { localStorage.setItem(LEAGUE_KEY, JSON.stringify(league)); } catch (err) { /* tant pis */ }
}

/** Lundi de la semaine de `date` (« AAAA-MM-JJ »). */
function weekStart(date = new Date()) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return dayKey(d);
}
function shiftDays(key, days) {
    const [y, m, d] = key.split('-').map(Number);
    return dayKey(new Date(y, m - 1, d + days));
}
/** XP gagnés pendant la semaine qui commence le lundi `monday`. */
function weekXp(monday) {
    let sum = 0;
    for (let i = 0; i < 7; i++) sum += state.data.activeDays[shiftDays(monday, i)] || 0;
    return sum;
}
/** XP d'un ami pour une semaine donnée (0 s'il n'a pas joué). */
function friendWeekXp(f, monday) {
    if (f.week === monday) return f.week_xp;
    if (f.prev_week === monday) return f.prev_week_xp;
    return 0;
}

/** Envoie l'XP de la semaine (appelé avec la sauvegarde en ligne, seulement si on a un pseudo). */
let lastScorePush = 0;
async function leaguePushScore() {
    const c = cloudClient();
    if (!c || !cloudUser || !league?.pseudo || league.userId !== cloudUser.id) return;
    lastScorePush = Date.now();
    const week = weekStart();
    const prev = shiftDays(week, -7);
    const row = {
        user_id: cloudUser.id, week, week_xp: Math.min(15000, weekXp(week)),
        prev_week: prev, prev_week_xp: Math.min(15000, weekXp(prev)), streak: currentStreak()
    };
    // Défi du jour (colonnes ajoutées par supabase/defi-du-jour.sql) : comparé avec les amis
    const today = state.data.daily[todayKey()];
    const daily = today ? { daily_day: todayKey(), daily_score: today.score, daily_seconds: today.seconds } : {};
    // Résumé du profil, visible par les amis (colonne de supabase/profil-ami.sql)
    const summary = { summary: profileSummary() };
    try {
        for (const attempt of [{ ...row, ...daily, ...summary }, { ...row, ...daily }, row]) {
            const { error } = await c.from('scores').upsert(attempt);
            if (!error) break;   // sinon : colonnes pas encore créées, on réessaie avec moins
        }
    } catch (err) { /* hors ligne : au prochain envoi */ }
}

/** Cadeaux déposés depuis Supabase (table « gifts », supabase/cadeaux.sql) : on supprime la ligne
    PUIS on ajoute les pièces, pour ne jamais les compter deux fois. */
let claimingGifts = 0;   // heure du début de la récupération en cours (0 = aucune)
setInterval(() => { if (!document.hidden) claimGifts(); }, 30000);
async function claimGifts() {
    const c = cloudClient();
    if (!c || !cloudUser || !navigator.onLine) return;
    if (claimingGifts && Date.now() - claimingGifts < 20000) return;   // déjà en cours (verrou libéré après 20 s)
    claimingGifts = Date.now();
    try {
        const { data, error } = await c.from('gifts').select('*');
        if (error || !data?.length) return;
        for (const gift of data) {
            const { data: gone, error: delError } = await c.from('gifts').delete().eq('id', gift.id).select('id');
            if (delError || !gone?.length) continue;   // déjà récupéré (autre appareil)
            if (gift.coins) {
                state.data.coins = Math.max(0, state.data.coins + gift.coins);
                showToast(gift.coins > 0 ? `🎁 +${gift.coins} 🪙 offertes !` : `🪙 ${gift.coins} pièces (ajustement)`);
            }
            if (gift.level) {
                setPlayerLevel(gift.level);
                showToast(`🗺️ Te voilà au niveau ${Math.min(gift.level, MAX_LEVEL)} !`);
            }
            saveData();
            renderHeader();
            if (!$('shopScreen').hidden) renderShop();
            if (!$('mapScreen').hidden) renderMap();
        }
    } catch (err) {
        /* hors ligne, ou table pas encore créée */
    } finally {
        claimingGifts = 0;
    }
}

/** Niveau changé depuis la table : les niveaux d'avant sont validés (comme après un placement), ceux d'après
    redeviennent à faire. Les coffres déjà ouverts restent ouverts. */
function setPlayerLevel(level) {
    const n = Math.max(1, Math.min(MAX_LEVEL, Math.round(level)));
    const d = state.data;
    for (let i = 1; i <= MAX_LEVEL; i++) {
        if (i < n) d.done[i] = true;
        else delete d.done[i];
    }
    d.unlocked = n;
}

/** Ce que les amis voient de mon profil (jamais la sauvegarde complète, qui reste privée). */
function profileSummary() {
    const d = state.data;
    return {
        xp: d.xp,
        title: titleFor(d.xp).current.name,
        streak: currentStreak(),
        bestStreak: Math.max(d.best.streak, currentStreak()),
        levels: Object.values(d.done).filter(Boolean).length,
        rate: d.totals.tries > 0 ? Math.round((d.totals.right / d.totals.tries) * 100) : null,
        sprint: d.best.sprint || 0,
        badges: Object.keys(d.badges).filter(id => d.badges[id]),
        cards: Object.keys(d.cards).filter(id => d.cards[id])
    };
}

/** Profil d'un ami : série, stats, badges et cartes (d'après son résumé). */
function openFriendProfile(f) {
    const body = $('friendBody');
    body.replaceChildren();
    const s = f.summary;
    const head = el('div', 'friend-head');
    const name = el('h2');
    name.textContent = f.pseudo;
    const sub = el('p', 'friend-title');
    sub.textContent = s ? `🎖️ ${s.title} · ${s.xp} XP` : 'Profil pas encore disponible';
    head.append(avatarEl(f.pseudo, f.look, 'is-big'), name, sub);
    body.append(head);

    if (!s) {
        const p = el('p', 'muted');
        p.textContent = `Son profil s’affichera dès que ${f.pseudo} aura rejoué avec la dernière version du jeu.`;
        body.append(p);
    } else {
        const nbsp = '\u00a0';
        const tiles = el('div', 'friend-tiles');
        [
            ['🔥 Série', plural(s.streak, 'jour', 'jours').replace(' ', nbsp)],
            ['✅ Réussite', s.rate === null ? '—' : `${s.rate}${nbsp}%`],
            ['🗺️ Niveaux', `${s.levels}${nbsp}/${nbsp}${MAX_LEVEL}`],
            ['🌋 Record', plural(s.bestStreak, 'jour', 'jours').replace(' ', nbsp)],
            ['⚡ Sprint', String(s.sprint)],
            ['📅 Semaine', `${friendWeekXp(f, weekStart())}${nbsp}XP`]
        ].forEach(([label, value]) => {
            const t = el('div', 'tile');
            const l = el('span', 'tile-label');
            l.textContent = label;
            const b = el('b');
            b.textContent = value;
            t.append(l, b);
            tiles.append(t);
        });
        body.append(tiles);

        const badges = BADGES.filter(b => s.badges.includes(b.id));
        const bh = el('h3', 'friend-section');
        bh.textContent = `🎖️ Badges · ${badges.length}/${BADGES.length}`;
        const bl = el('div', 'friend-badges');
        badges.forEach(b => {
            const i = el('button', 'friend-badge');
            i.type = 'button';
            i.textContent = b.icon;
            i.setAttribute('aria-label', `${b.name} : ${b.desc}`);
            i.addEventListener('click', () => {
                $('friendModal').hidden = true;
                openBadgeView(b, () => { $('friendModal').hidden = false; });
            });
            bl.append(i);
        });
        if (!badges.length) bl.textContent = 'Aucun badge pour l’instant.';
        body.append(bh, bl);

        const order = Object.keys(CARD_RARITIES);
        const cards = CARDS.filter(c => s.cards.includes(c.id))
            .sort((a, b) => order.indexOf(b.rarity) - order.indexOf(a.rarity));
        const ch = el('h3', 'friend-section');
        ch.textContent = `🃏 Cartes · ${cards.length}/${CARDS.length}`;
        const cl = el('div', 'friend-cards');
        cards.forEach(card => {
            const btn = el('button', 'kcard-btn');
            btn.type = 'button';
            btn.append(cardFace(card));
            btn.addEventListener('click', () => {
                $('friendModal').hidden = true;
                openCardView(card, () => { $('friendModal').hidden = false; });
            });
            cl.append(btn);
        });
        if (!cards.length) cl.textContent = 'Aucune carte pour l’instant.';
        body.append(ch, cl);
    }

    const remove = el('button', 'friend-remove');
    remove.type = 'button';
    remove.textContent = 'Retirer de mes amis';
    remove.addEventListener('click', () => {
        $('friendModal').hidden = true;
        removeFriend(f.link, `Retirer ${f.pseudo} de tes amis ?`);
    });
    body.append(remove);
    $('friendModal').hidden = false;
    $('friendModal').querySelector('.modal-content').scrollTop = 0;
}

/** Redessine l'onglet Classement s'il a changé, sauf pendant qu'on tape dans un champ (sinon le texte serait effacé). */
let leagueViewDirty = false;
function refreshLeagueView() {
    if ($('leagueScreen').hidden || !leagueViewDirty) return;
    if ($('leagueGrid').contains(document.activeElement) && document.activeElement.tagName === 'INPUT') return;
    leagueViewDirty = false;
    renderLeague();
}

/** Défi du jour : mon score et celui de mes amis aujourd'hui (le meilleur score, puis le plus rapide). */
function renderDailyFriends(result) {
    const box = $('dailyFriends');
    box.replaceChildren();
    const hasLeague = cloudUser && league?.userId === cloudUser.id && league.pseudo;
    if (!hasLeague || !league.friends.length) {
        const link = el('button', 'daily-friends-link');
        link.type = 'button';
        link.textContent = '👥 Ajoute des amis pour comparer vos scores →';
        link.addEventListener('click', () => showScreen('league'));
        box.append(link);
        return;
    }
    const today = todayKey();
    const rows = league.friends.map(f => ({
        pseudo: f.pseudo,
        played: f.daily_day === today,
        score: f.daily_score,
        seconds: f.daily_seconds
    }));
    if (result) rows.push({ pseudo: league.pseudo, me: true, played: true, score: result.score, seconds: result.seconds });
    // Seulement ceux qui ont joué (sinon, avec beaucoup d'amis, la liste serait interminable) : les 5 meilleurs,
    // plus moi si je suis plus loin
    const played = rows.filter(r => r.played)
        .sort((a, b) => (b.score - a.score) || (a.seconds - b.seconds));
    const done = played.filter(r => !r.me).length;
    const title = el('p', 'daily-friends-title');
    title.textContent = done > 0
        ? `👥 Tes amis aujourd’hui · ${plural(done, 'a joué', 'ont joué')}`
        : '👥 Aucun ami n’a encore fait le défi aujourd’hui.';
    box.append(title);
    if (!done) return;
    const TOP = 5;
    const shown = played.slice(0, TOP);
    const myPlace = played.findIndex(r => r.me);
    if (myPlace >= TOP) shown.push(played[myPlace]);
    const list = el('ol', 'daily-friends-list');
    shown.forEach(r => {
        const place = played.indexOf(r) + 1;
        if (place > TOP && r.me) list.append(el('li', 'df-gap'));   // « … » avant ma ligne
        const li = el('li', r.me ? 'is-me' : '');
        const pos = el('span', 'df-pos');
        pos.textContent = ['🥇', '🥈', '🥉'][place - 1] || String(place);
        const name = el('span', 'df-name');
        name.textContent = r.me ? 'Toi' : r.pseudo;
        const score = el('b', 'df-score');
        score.textContent = `${r.score}/${DAILY_SIZE}`;
        const time = el('span', 'df-time');
        time.textContent = `${Math.floor(r.seconds / 60)}:${String(r.seconds % 60).padStart(2, '0')}`;
        li.append(pos, name, score, time);
        list.append(li);
    });
    box.append(list);
}

/** Mise à jour automatique : toutes les 15 s sur l'onglet Classement, toutes les minutes ailleurs,
    et tout de suite quand on revient dans l'appli. */
let lastLeagueLoad = 0;
function leagueTick() {
    if (!cloudUser || document.hidden || !navigator.onLine) return;
    const watching = !$('leagueScreen').hidden || !$('challengesScreen').hidden;   // classement, ou scores du défi
    const wait = watching ? 15000 : 60000;
    if (Date.now() - lastLeagueLoad >= wait - 500) leagueLoad();
    else refreshLeagueView();
}
setInterval(leagueTick, 15000);
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && cloudUser) { leagueLoad(); claimGifts(); }
});

/** Recharge pseudo, amis, demandes et scores (un seul chargement à la fois : les autres appels l'attendent). */
let leaguePromise = null;
let leagueStartedAt = 0;
function leagueLoad() {
    if (leaguePromise && Date.now() - leagueStartedAt > 20000) leaguePromise = null;   // bloqué : on relance
    if (!leaguePromise) {
        leagueStartedAt = Date.now();
        const p = leagueFetch().finally(() => { if (leaguePromise === p) leaguePromise = null; });
        leaguePromise = p;
    }
    return leaguePromise;
}

async function leagueFetch() {
    const c = cloudClient();
    if (!c || !cloudUser || !navigator.onLine || leagueBusy) return;
    lastLeagueLoad = Date.now();
    leagueBusy = true;
    try {
        const me = cloudUser.id;
        const { data: mine } = await c.from('profiles').select('*').eq('user_id', me).maybeSingle();
        const { data: links, error } = await c.from('friendships').select('id, requester, addressee, status');
        if (error) return;
        const others = [...new Set((links || []).map(l => l.requester === me ? l.addressee : l.requester))];
        const pseudos = {};
        const scores = {};
        if (others.length) {
            const { data: profs } = await c.from('profiles').select('*').in('user_id', others);
            (profs || []).forEach(p => { pseudos[p.user_id] = p; });
            const { data: sc } = await c.from('scores').select('*').in('user_id', others);
            (sc || []).forEach(s => { scores[s.user_id] = s; });
        }
        const row = l => {
            const id = l.requester === me ? l.addressee : l.requester;
            const prof = pseudos[id] || {};
            const look = Number.isInteger(prof.avatar_hue) ? { hue: prof.avatar_hue, emoji: prof.avatar_emoji || null } : null;
            return { link: l.id, id, pseudo: prof.pseudo || '?', look, ...(scores[id] || { week: null, week_xp: 0, prev_week: null, prev_week_xp: 0, streak: 0 }) };
        };
        const before = league?.userId === me ? league : null;
        const fresh = {
            userId: me,
            pseudo: mine?.pseudo || null,
            friends: (links || []).filter(l => l.status === 'accepted').map(row),
            incoming: (links || []).filter(l => l.status === 'pending' && l.addressee === me).map(row),
            outgoing: (links || []).filter(l => l.status === 'pending' && l.requester === me).map(row)
        };
        const { at, ...old } = before || {};
        if (JSON.stringify(old) !== JSON.stringify(fresh)) leagueViewDirty = true;
        // Nouveautés depuis la dernière fois : petit message
        if (before) {
            const had = list => new Set(list.map(f => f.id));
            const known = had([...before.incoming, ...before.friends]);
            fresh.incoming.filter(f => !known.has(f.id)).forEach(f => showToast(`👥 ${f.pseudo} veut être ton ami !`));
            const waiting = had(before.outgoing);
            fresh.friends.filter(f => waiting.has(f.id)).forEach(f => showToast(`✓ ${f.pseudo} a accepté ta demande !`));
        }
        league = { ...fresh, at: Date.now() };
        saveLeagueCache();
        if (league.pseudo && Date.now() - lastScorePush > 120000) leaguePushScore();
    } catch (err) {
        return;   // hors ligne : on garde la dernière version connue
    } finally {
        leagueBusy = false;
    }
    updateNavNotifications();
    refreshLeagueView();
    if (!$('challengesScreen').hidden) renderDailyFriends(state.data.daily[todayKey()]);
    handleInvite();   // sans attendre : la fenêtre « ajouter en ami ? » peut rester ouverte
    checkPodium();
}

/** Lundi : coffre pour le podium de la semaine passée (une fois par semaine, au moins 2 joueurs). */
function checkPodium() {
    const data = state.data;
    if (!league?.pseudo || !league.friends.length) return;
    const last = shiftDays(weekStart(), -7);
    if (data.podium[last] !== undefined) return;
    const mine = weekXp(last);
    const others = league.friends.map(f => friendWeekXp(f, last));
    // Coffre = selon le nombre d'amis battus (1 battu = 2 cartes … jusqu'à 5), avec un minimum d'XP joués :
    // à deux, il faut battre son ami ; plus on est nombreux, plus le coffre est gros.
    const beaten = others.filter(xp => xp < mine).length;
    const rank = 1 + others.filter(xp => xp > mine).length;
    data.podium[last] = 0;
    if (mine >= PODIUM_MIN_XP && beaten > 0) {
        data.podium[last] = rank;
        saveData();
        const size = Math.min(5, 1 + beaten);
        const place = rank === 1 ? '1er' : `${rank}e`;
        openCardBoxes([{ size, rare: size >= 3 }],
            `${['🥇', '🥈', '🥉'][rank - 1] || '🏅'} ${place} de la semaine : ${plural(beaten, 'ami battu', 'amis battus')} !`);
        return;
    }
    saveData();
}

const escapeLike = text => text.replace(/[\\%_]/g, '\\$&');

/** Pseudo déjà utilisé par un autre joueur ? (null = impossible de vérifier, hors ligne) */
async function pseudoTaken(pseudo) {
    try {
        const { data, error } = await cloudClient().from('profiles').select('user_id')
            .ilike('pseudo', escapeLike(pseudo)).maybeSingle();
        if (error) return null;
        return !!data && data.user_id !== cloudUser?.id;
    } catch (err) { return null; }
}

/** Champ « pseudo » vérifié pendant la saisie : rouge si invalide ou déjà pris, vert si disponible.
    `onReady(true/false)` dit si on peut valider (pour activer le bouton). */
function pseudoField(onReady) {
    const wrap = el('div', 'pseudo-field');
    const input = el('input', 'auth-input');
    input.placeholder = 'Ton pseudo';
    input.maxLength = 16;
    input.autocomplete = 'off';
    input.autocapitalize = 'off';
    input.spellcheck = false;
    const msg = el('p', 'pseudo-msg');
    wrap.append(input, msg);
    let ready = false;
    let timer = null;
    let seq = 0;
    const show = (text, kind) => {
        msg.textContent = text;
        msg.className = `pseudo-msg${kind ? ` is-${kind}` : ''}`;
        input.classList.toggle('is-bad', kind === 'bad');
        input.classList.toggle('is-good', kind === 'good');
    };
    const setReady = value => { ready = value; onReady(value); };
    const check = () => {
        const value = input.value.trim();
        clearTimeout(timer);
        seq++;
        setReady(false);
        if (!value) return show('Entre 3 et 16 caractères');
        if (value.length < 3) return show(`Trop court : encore ${plural(3 - value.length, 'caractère', 'caractères')}.`, 'bad');
        if (!PSEUDO_RE.test(value)) return show('Pas d’espace ni de signe spécial (seulement « _ », « . » ou « - »).', 'bad');
        show('Vérification…');
        const mine = seq;
        timer = setTimeout(async () => {
            const taken = await pseudoTaken(value);
            if (mine !== seq) return;   // le joueur a continué à taper
            if (taken) return show('Ce pseudo est déjà pris, choisis-en un autre.', 'bad');
            show(taken === null ? '' : '✓ Disponible !', 'good');
            setReady(true);
        }, 400);
    };
    input.addEventListener('input', check);
    input.addEventListener('keydown', e => { if (e.key === 'Enter' && ready) wrap.dispatchEvent(new Event('submit')); });
    wrap.value = () => input.value.trim();
    wrap.showError = text => { show(text, 'bad'); setReady(false); };
    check();
    return wrap;
}

/** Enregistre le pseudo. Renvoie un message d'erreur, ou null si c'est bon. */
async function setPseudo(raw) {
    const c = cloudClient();
    const pseudo = raw.trim();
    if (!c || !cloudUser) return 'Connecte-toi d’abord à ton compte.';
    if (!PSEUDO_RE.test(pseudo)) return 'Ce pseudo n’est pas valide.';
    const { error } = await c.from('profiles').upsert({ user_id: cloudUser.id, pseudo });
    if (error) return error.code === '23505' ? 'Ce pseudo est déjà pris, choisis-en un autre.' : 'Impossible pour le moment. Réessaie.';
    league = { ...(league || {}), userId: cloudUser.id, pseudo, friends: league?.friends || [], incoming: league?.incoming || [], outgoing: league?.outgoing || [] };
    saveLeagueCache();
    pushAvatar();
    showToast(`🥇 Ton pseudo : ${pseudo}`);
    leagueLoad();
    return null;
}

/** Ajout par pseudo : envoie une demande (ou accepte celle que l'autre nous a déjà envoyée). */
async function addFriend(raw) {
    const c = cloudClient();
    const pseudo = raw.trim();
    if (!pseudo) return;
    const say = (text, kind = 'bad') => { leagueMsg = { text, kind }; renderLeague(); };
    if (pseudo.toLowerCase() === league.pseudo.toLowerCase()) return say('C’est ton propre pseudo 😉');
    const { data: found } = await c.from('profiles').select('user_id, pseudo')
        .ilike('pseudo', escapeLike(pseudo)).maybeSingle();
    if (!found) return say(`Aucun joueur ne s’appelle « ${pseudo} ».`);
    const known = [...league.friends, ...league.outgoing].find(f => f.id === found.user_id);
    if (known) return say(league.friends.includes(known) ? `${found.pseudo} est déjà ton ami.` : `Demande déjà envoyée à ${found.pseudo}.`);
    const theirs = league.incoming.find(f => f.id === found.user_id);
    if (theirs) { await acceptFriend(theirs.link); return say(`✓ ${found.pseudo} et toi êtes maintenant amis !`, 'good'); }
    const { error } = await c.from('friendships').insert({ requester: cloudUser.id, addressee: found.user_id });
    if (error) return say('Impossible pour le moment. Réessaie.');
    say(`✓ Demande envoyée à ${found.pseudo}.`, 'good');
    leagueLoad();
}

async function acceptFriend(link) {
    await cloudClient().from('friendships').update({ status: 'accepted' }).eq('id', link);
    await leagueLoad();
}

async function removeFriend(link, question) {
    if (question && !await askConfirm({ title: question, text: 'Vous ne vous verrez plus dans le classement.', yes: 'Retirer', danger: true })) return;
    await cloudClient().from('friendships').delete().eq('id', link);
    await leagueLoad();
}

/** Lien d'invitation : partage du téléphone (WhatsApp, SMS…), sinon copie du lien. */
async function shareInvite() {
    const url = `${location.origin}${location.pathname}?ami=${encodeURIComponent(league.pseudo)}`;
    const text = `Viens me défier sur Kultivo, le quiz de culture G ! Mon pseudo : ${league.pseudo}`;
    try {
        if (navigator.share) { await navigator.share({ title: 'Kultivo', text, url }); return; }
    } catch (err) { if (err.name === 'AbortError') return; }
    try {
        await navigator.clipboard.writeText(`${text} ${url}`);
        showToast('🔗 Lien copié : colle-le dans un message !');
    } catch (err) {
        window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, '_blank');
    }
}

/** Arrivée par un lien « ?ami=pseudo » : on le garde de côté jusqu'à ce qu'on ait un compte et un pseudo. */
function readInviteFromUrl() {
    const params = new URLSearchParams(location.search);
    const pseudo = params.get('ami');
    if (!pseudo) return;
    try { localStorage.setItem(INVITE_KEY, pseudo); } catch (err) { /* tant pis */ }
    params.delete('ami');
    const rest = params.toString();
    history.replaceState(null, '', location.pathname + (rest ? `?${rest}` : '') + location.hash);
}

async function handleInvite() {
    let pseudo = null;
    try { pseudo = localStorage.getItem(INVITE_KEY); } catch (err) { return; }
    if (!pseudo || !league?.pseudo) return;
    try { localStorage.removeItem(INVITE_KEY); } catch (err) { /* tant pis */ }
    if (pseudo.toLowerCase() === league.pseudo.toLowerCase()) return;
    if ([...league.friends, ...league.outgoing].some(f => f.pseudo.toLowerCase() === pseudo.toLowerCase())) return;
    if (!await askConfirm({ title: `👥 ${pseudo} t’a invité`, text: 'L’ajouter à tes amis pour vous comparer chaque semaine ?', yes: 'Ajouter', no: 'Non merci' })) return;
    await addFriend(pseudo);
}

/** Jours restants avant la fin de la semaine (lundi prochain). */
function weekDaysLeft() {
    const next = shiftDays(weekStart(), 7);
    const [y, m, d] = next.split('-').map(Number);
    return Math.max(1, Math.ceil((new Date(y, m - 1, d) - new Date()) / 86400000));
}

function renderLeague() {
    const grid = $('leagueGrid');
    grid.replaceChildren();
    const card = (cls, title) => {
        const box = el('article', `card ${cls}`);
        if (title) {
            const h = el('h2');
            h.textContent = title;
            box.append(h);
        }
        grid.append(box);
        return box;
    };
    const para = (box, text, cls = 'muted') => {
        const p = el('p', cls);
        p.textContent = text;
        box.append(p);
        return p;
    };
    const button = (box, text, cls, onClick) => {
        const b = el('button', `btn ${cls}`);
        b.type = 'button';
        b.textContent = text;
        b.addEventListener('click', onClick);
        box.append(b);
        return b;
    };
    /** Champ + bouton (pseudo, ajout d'ami). */
    const form = (box, placeholder, label, onSubmit) => {
        const f = el('form', 'league-form');
        const input = el('input', 'auth-input');
        input.placeholder = placeholder;
        input.maxLength = 16;
        input.autocomplete = 'off';
        input.autocapitalize = 'off';
        input.spellcheck = false;
        const b = el('button', 'btn btn-green');
        b.type = 'submit';
        b.textContent = label;
        f.append(input, b);
        f.addEventListener('submit', e => { e.preventDefault(); onSubmit(input.value); });
        box.append(f);
        if (leagueMsg) para(box, leagueMsg.text, `pseudo-msg is-${leagueMsg.kind}`);
        return input;
    };

    // 1) Pas de compte : on l'explique
    if (!cloudUser) {
        const box = card('league-intro', '🥇 Classement entre amis');
        para(box, 'Compare ton XP de la semaine avec tes amis. Il faut un compte (gratuit) pour jouer ensemble.');
        button(box, '☁️ Créer un compte', 'btn-green btn-full', () => openAuthModal('signup'));
        button(box, 'J’ai déjà un compte', 'btn-ghost btn-full', () => openAuthModal('login'));
        return;
    }
    // 2) Pas encore de pseudo
    if (!league || league.userId !== cloudUser.id || !league.pseudo) {
        const box = card('league-intro', '🥇 Choisis ton pseudo');
        if (!league || league.userId !== cloudUser.id) { para(box, 'Chargement…'); return; }
        para(box, 'C’est sous ce nom que tes amis te verront et pourront t’ajouter.');
        const ok = el('button', 'btn btn-green btn-full');
        ok.type = 'button';
        ok.textContent = 'Valider';
        ok.disabled = true;
        const field = pseudoField(ready => { ok.disabled = !ready; });
        const submit = async () => {
            if (ok.disabled) return;
            ok.disabled = true;
            const err = await setPseudo(field.value());
            if (err) field.showError(err);
            else renderLeague();
        };
        ok.addEventListener('click', submit);
        field.addEventListener('submit', submit);
        box.append(field, ok);
        return;
    }

    // 3) Classement de la semaine : podium (3 premiers) puis liste
    const week = weekStart();
    const rows = [
        { pseudo: league.pseudo, look: state.data.avatar, xp: weekXp(week), streak: currentStreak(), me: true },
        ...league.friends.map(f => ({ pseudo: f.pseudo, look: f.look, friend: f, xp: friendWeekXp(f, week), streak: f.week === week ? f.streak : 0 }))
    ].sort((a, b) => b.xp - a.xp || (a.me ? -1 : b.me ? 1 : 0));
    const rank = card('league-rank');
    const head = el('div', 'league-head');
    const h = el('h2');
    h.textContent = '🏆 Ligue des amis';
    const left = el('span', 'league-left');
    left.textContent = `⏳ ${plural(weekDaysLeft(), 'jour', 'jours')}`;
    left.title = 'XP gagnés depuis lundi · temps restant avant la fin de la semaine';
    head.append(h, left);
    rank.append(head);

    const top = rows.slice(0, 3);
    const podium = el('div', `league-podium count-${top.length}`);
    [1, 0, 2].forEach(i => {   // ordre visuel : 2e, 1er, 3e
        const r = top[i];
        if (!r) return;
        const col = el(r.friend ? 'button' : 'div', `podium-col place-${i + 1}${r.me ? ' is-me' : ''}`);
        if (r.friend) { col.type = 'button'; col.addEventListener('click', () => openFriendProfile(r.friend)); }
        const crown = el('span', 'podium-crown');
        crown.textContent = i === 0 && r.xp > 0 ? '👑' : '';
        const name = el('span', 'podium-name');
        name.textContent = r.me ? 'Toi' : r.pseudo;
        const xp = el('span', 'podium-xp');
        xp.textContent = `${r.xp} XP`;
        const step = el('div', 'podium-step');
        step.textContent = String(i + 1);
        col.append(crown, avatarEl(r.pseudo, r.look, `ring-${i + 1}`), name, xp, step);
        podium.append(col);
    });
    rank.append(podium);

    if (rows.length > 3) {
        const leader = Math.max(1, rows[0].xp);
        const list = el('ol', 'league-list');
        rows.slice(3).forEach((r, k) => {
            const li = el('li', `league-row${r.me ? ' is-me' : ''}${r.friend ? ' is-link' : ''}`);
            if (r.friend) li.addEventListener('click', () => openFriendProfile(r.friend));
            const pos = el('span', 'league-pos');
            pos.textContent = String(k + 4);
            const name = el('span', 'league-name');
            name.textContent = r.me ? `${r.pseudo} (toi)` : r.pseudo;
            const bar = el('span', 'league-bar');
            const fill = el('i');
            fill.style.width = `${Math.round((r.xp / leader) * 100)}%`;
            bar.append(fill);
            name.append(bar);
            const xp = el('b', 'league-xp');
            xp.textContent = `${r.xp} XP`;
            li.append(pos, avatarEl(r.pseudo, r.look, 'is-small'), name, xp);
            list.append(li);
        });
        rank.append(list);
    }

    const myIndex = rows.findIndex(r => r.me);
    const tip = rows.length === 1 ? 'Ajoute des amis ci-dessous pour vous comparer chaque semaine !'
        : myIndex === 0 ? (rows[0].xp > 0 ? '🏆 Tu es en tête : garde ta place jusqu’à lundi !' : 'Personne n’a encore joué cette semaine : à toi de commencer !')
        : `Tu es ${myIndex + 1}e · encore ${rows[myIndex - 1].xp - rows[myIndex].xp + 1} XP pour dépasser ${rows[myIndex - 1].pseudo} !`;
    para(rank, tip, 'league-tip');
    para(rank, '🎁 Lundi : un coffre si tu bats au moins un ami.', 'muted league-sub');

    // 4) Amis : demandes reçues, ajout par pseudo, invitation, liste
    const friends = card('league-friends', '👥 Amis');
    para(friends, `Ton pseudo : ${league.pseudo}`, 'league-me');
    league.incoming.forEach(f => {
        const row = el('div', 'league-request');
        const text = el('span');
        text.textContent = `${f.pseudo} veut être ton ami`;
        const yes = el('button', 'btn btn-green btn-small');
        yes.type = 'button';
        yes.textContent = 'Accepter';
        yes.addEventListener('click', () => acceptFriend(f.link));
        const no = el('button', 'btn btn-ghost btn-small');
        no.type = 'button';
        no.textContent = 'Refuser';
        no.addEventListener('click', () => removeFriend(f.link));
        row.append(text, yes, no);
        friends.append(row);
    });
    form(friends, 'Pseudo de ton ami', 'Ajouter', addFriend);
    button(friends, '🔗 Inviter un ami (lien)', 'btn-ghost btn-full', shareInvite);
    const people = [...league.friends.map(f => ({ ...f, pending: false })), ...league.outgoing.map(f => ({ ...f, pending: true }))];
    if (people.length) {
        const ul = el('ul', 'league-people');
        people.forEach(f => {
            const li = el('li', `friend-row${f.pending ? ' is-pending' : ''}`);
            const name = el('span', 'friend-name');
            const strong = el('b');
            strong.textContent = f.pseudo;
            const info = el('span', 'friend-info');
            const s = f.summary;
            info.textContent = f.pending ? 'Demande envoyée · en attente'
                : s ? `🎖️ ${s.title}${s.streak > 0 ? ` · 🔥 ${s.streak}` : ''}` : 'Ami';
            name.append(strong, info);
            li.append(avatarEl(f.pseudo, f.look, 'is-small'), name);
            if (f.pending) {
                const x = el('button', 'icon-btn league-remove');
                x.type = 'button';
                x.textContent = '✕';
                x.setAttribute('aria-label', `Annuler la demande à ${f.pseudo}`);
                x.addEventListener('click', () => removeFriend(f.link));
                li.append(x);
            } else {
                const go = el('span', 'friend-go');
                go.textContent = '›';
                li.append(go);
                li.addEventListener('click', () => openFriendProfile(f));
            }
            ul.append(li);
        });
        friends.append(ul);
    }
}

/* ---------- Tutoriel de découverte (après l'accueil) ---------- */

// Chaque étape : l'élément mis en lumière (ou rien = bulle au centre) et le texte
// (espaces insécables avant « : » et « ! » : jamais seuls en début de ligne)
const TOUR_STEPS = [
    { target: () => document.querySelector('.node.is-current'),
      text: 'Voici ton parcours 🗺️ Chaque rond est un niveau de questions. Touche celui qui brille pour jouer\u00a0!' },
    { target: () => document.querySelector('.node.is-pairs:not(.is-done)'),
      text: 'Les carrés bleus 🔗 sont des niveaux spéciaux\u00a0: des paires à associer (pays et capitales, films et réalisateurs…).' },
    { target: () => document.querySelector('.node.is-order:not(.is-done)'),
      text: 'Les losanges orange ⏳ aussi\u00a0: des cartes à remettre dans l’ordre (dates, tailles, distances…).' },
    { target: () => document.querySelector('.node.is-challenge:not(.is-done)'),
      text: 'Et tous les 10 niveaux, un défi 🏆 qui mélange les questions des niveaux précédents.' },
    { target: () => document.querySelector('.chest-node:not(.is-open)'),
      text: 'Tous les 5 niveaux, un coffre 🎁 : il contient des cartes à collectionner (dans ton Profil).' },
    { target: () => document.querySelector('.chips'),
      text: 'En haut\u00a0: tes pièces 🪙 (pour la boutique), ton XP ⭐ et ta série 🔥 de jours d’affilée.' },
    { target: () => document.querySelector('.nav-btn[data-screen="challenges"]'),
      text: 'Défis\u00a0: ton objectif du jour, le défi du jour et le sprint de 60 secondes.' },
    { target: () => document.querySelector('.nav-btn[data-screen="shop"]'),
      text: 'Boutique\u00a0: des indices, des cœurs de secours et des gels pour protéger ta série.' },
    { target: () => document.querySelector('.nav-btn[data-screen="profile"]'),
      text: 'Profil\u00a0: ton titre, tes records, tes badges à récupérer et ta sauvegarde en ligne.' },
    { target: () => null,
      text: 'Une erreur te coûte un cœur ❤️, et les questions ratées reviennent en révision. C’est parti\u00a0! 🚀' }
];
let tourStep = 0;
let tourSteps = TOUR_STEPS;     // étapes en cours (le tutoriel, ou une explication ponctuelle)
let tourFlag = 'tourDone';      // ce qu'on retient dans la sauvegarde une fois fini
let tourLastLabel = 'C’est parti !';

function startTour() {
    if (!$('mapScreen').hidden && $('tour').hidden && !state.data.tourDone) {
        tourSteps = TOUR_STEPS;
        tourFlag = 'tourDone';
        tourLastLabel = 'C’est parti !';
        tourStep = 0;
        $('tour').hidden = false;
        showTourStep();
    }
}

/* Explication ponctuelle (une seule fois) : la 1re apparition du bouton « ↻ à revoir » */
const REVIEW_TIP = [{
    target: () => $('reviewBtn'),
    text: '↻ Tes erreurs t’attendent ici. Une bonne réponse les retire de la liste\u00a0; elles reviendront plus tard dans tes niveaux, pour bien les retenir.'
}];
let reviewTipPending = false;

function maybeShowReviewTip() {
    if (reviewTipPending || state.data.tipReview) return;
    reviewTipPending = true;
    setTimeout(() => {
        reviewTipPending = false;
        const ready = !$('mapScreen').hidden && $('tour').hidden && !$('reviewBtn').hidden
            && (!state.data.onboarded || state.data.tourDone) && !state.data.tipReview;
        if (!ready) return;
        tourSteps = REVIEW_TIP;
        tourFlag = 'tipReview';
        tourLastLabel = 'Compris !';
        tourStep = 0;
        $('tour').hidden = false;
        showTourStep();
    }, 700);
}

/* Explication ponctuelle : la 1re fois que le niveau en cours affiche « + X révisions » */
let reviewsTipPending = false;
const currentReviewsLabel = () => {
    const node = document.querySelector('.node.is-current:not(.is-pairs):not(.is-order):not(.is-challenge)');
    const meta = node && node.closest('.stop')?.querySelector('.stop-meta');
    return meta && meta.textContent.includes('révision') ? meta : null;
};

function maybeShowReviewsTip() {
    const data = state.data;
    if (reviewsTipPending || data.tipReviews) return;
    reviewsTipPending = true;
    setTimeout(() => {
        reviewsTipPending = false;
        const target = currentReviewsLabel();
        const ready = target && !$('mapScreen').hidden && $('tour').hidden && $('chestModal').hidden
            && (!data.onboarded || data.tourDone) && !data.tipReviews;
        if (!ready) return;
        tourSteps = [{
            target: currentReviewsLabel,
            text: '🔁 Les révisions\u00a0: tes erreurs à corriger, et des questions que tu connais déjà, qui reviennent au bon moment pour ne pas les oublier.'
        }];
        tourFlag = 'tipReviews';
        tourLastLabel = 'Compris !';
        tourStep = 0;
        $('tour').hidden = false;
        showTourStep();
    }, 900);
}

/* Explication ponctuelle : le 1er coffre à ouvrir (après un placement : tous ceux des niveaux sautés) */
let chestTipPending = false;

function maybeShowChestTip() {
    const data = state.data;
    if (chestTipPending || data.tipChest) return;
    // Joueur qui a déjà ouvert des coffres : il connaît, pas besoin d'explication
    if (Object.keys(data.chests).length > 0) { data.tipChest = true; saveData(); return; }
    chestTipPending = true;
    setTimeout(() => {
        chestTipPending = false;
        const n = readyChests().length;
        const ready = n > 0 && !$('mapScreen').hidden && $('tour').hidden && $('chestModal').hidden
            && (!data.onboarded || data.tourDone) && !data.tipChest;
        if (!ready) return;
        const text = n > 1 && data.placement
            ? `🎁 Ton test de placement t’a fait passer ${n} coffres ! Ils t’attendent tous : ouvre-les d’un coup.`
            : n > 1
                ? `🎁 ${n} coffres t’attendent ! Ouvre-les tous d’un coup.`
                : '🎁 Un coffre t’attend ! Il contient des cartes à collectionner.';
        tourSteps = [{ target: () => document.querySelector('.chest-node.is-ready'), text }];
        tourFlag = 'tipChest';
        tourLastLabel = n > 1 ? 'Ouvrir les coffres' : 'Ouvrir le coffre';
        tourStep = 0;
        $('tour').hidden = false;
        showTourStep();
    }, 700);
}

function showTourStep() {
    if (tourStep >= tourSteps.length) { endTour(); return; }
    const step = tourSteps[tourStep];
    const target = step.target();
    if (target) target.scrollIntoView({ block: 'center' });
    $('tourText').textContent = step.text;
    $('tourDots').textContent = tourSteps.length > 1 ? `${tourStep + 1}/${tourSteps.length}` : '';
    $('tourNext').textContent = tourStep === tourSteps.length - 1 ? tourLastLabel : 'Suivant';
    $('tourSkip').hidden = tourStep === tourSteps.length - 1;
    setTimeout(placeTour, 60);   // après le défilement
}

/** Place le trou de lumière sur l'élément, et la bulle au-dessous (ou au-dessus s'il n'y a pas la place). */
function placeTour() {
    const step = tourSteps[tourStep];
    const target = step && step.target();
    const hole = $('tourHole');
    const bubble = $('tourBubble');
    const margin = 8;
    if (!target) {
        hole.style.cssText = 'top:50%;left:50%;width:0;height:0;';
        bubble.style.top = `${Math.max(16, window.innerHeight / 2 - bubble.offsetHeight / 2)}px`;
        return;
    }
    const r = target.getBoundingClientRect();
    hole.style.cssText = `top:${r.top - margin}px;left:${r.left - margin}px;width:${r.width + margin * 2}px;height:${r.height + margin * 2}px;`;
    const below = r.bottom + margin + 14;
    const fitsBelow = below + bubble.offsetHeight < window.innerHeight - 8;
    bubble.style.top = `${fitsBelow ? below : Math.max(8, r.top - margin - 14 - bubble.offsetHeight)}px`;
}

function endTour() {
    $('tour').hidden = true;
    state.data[tourFlag] = true;
    saveData();
    if (tourFlag === 'tipChest') {
        const list = readyChests();
        if (list.length) openChests(list);
        return;
    }
    if (tourFlag !== 'tourDone') return;
    // Retour au niveau qui attend le joueur (niveau 1 ou celui du placement) : le tutoriel a fait défiler la carte
    const current = document.querySelector('.node.is-current');
    if (current) current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    if (readyChests().length) setTimeout(maybeShowChestTip, 600);   // après un placement : coffres des niveaux sautés
}

/* ---------- Accueil du premier lancement ---------- */

const ONBOARD_STEPS = 5;
const ONBOARD_LEVELS = [
    { id: 'beginner', icon: '🌱', title: 'Je débute',        sub: 'Je préfère commencer par les bases' },
    { id: 'average',  icon: '📚', title: 'Je me débrouille', sub: 'Je connais les grands classiques' },
    { id: 'expert',   icon: '🎓', title: 'Je suis calé',     sub: 'Je veux vite du challenge' }
];
// Repères pour choisir son objectif (un niveau rapporte environ 40 à 60 XP)
const GOAL_ICONS = ['🐢', '🚶', '🔥'];
const GOAL_HINTS = { 60: '1 niveau par jour', 150: '2 à 3 niveaux par jour', 250: '4 à 5 niveaux par jour' };

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
    btn.addEventListener('click', () => { onPick(); renderOnboard(false); });   // sans rejouer l'animation
    return btn;
}

function renderOnboard(animate = true) {
    const step = onboard.step;
    const body = $('onboardBody');
    const scroll = $('onboardScreen').scrollTop;
    body.replaceChildren();
    body.classList.remove('is-entering');
    if (animate) {
        void body.offsetWidth;   // relance l'animation d'entrée (seulement en changeant d'étape)
        body.classList.add('is-entering');
    } else {
        requestAnimationFrame(() => { $('onboardScreen').scrollTop = scroll; });   // pas de saut
    }

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
            title: `${choice.label} · ${GOAL_HINTS[choice.xp] || `${choice.xp} XP par jour`}`,
            sub: `${choice.xp} XP par jour · 🎁 ${choice.reward} 🪙 de récompense`,
            selected: state.data.goal === choice.xp,
            onPick: () => { state.data.goal = choice.xp; saveData(); }
        })));
        body.append(title, text, list);
        next.textContent = 'Continuer';
    } else if (step === 3) {
        // Compte (facultatif) : sauvegarde en ligne dès le début, puis pseudo pour le classement
        if (onboardAccountDone()) { onboard.step++; renderOnboard(); return; }
        if (cloudUser) {
            if (!onboard.pseudoLoaded) {   // compte existant : il a peut-être déjà un pseudo
                onboard.pseudoLoaded = true;
                title.textContent = 'Un instant…';
                body.append(big('🥇'), title);
                next.disabled = true;
                leagueLoad().finally(() => { if (onboard.step === 3) renderOnboard(false); });
                return;
            }
            title.textContent = 'Choisis ton pseudo';
            text.textContent = 'Tes amis te trouveront grâce à lui dans l’onglet Classement.';
            onboard.pseudoField = pseudoField(ready => { next.disabled = !ready; });
            onboard.pseudoField.addEventListener('submit', onboardNext);
            body.append(big('🥇'), title, text, onboard.pseudoField);
            next.textContent = 'Valider';
            next.disabled = true;
            skip.textContent = 'Plus tard';
            skip.hidden = false;
            return;
        }
        title.textContent = 'Sauvegarde ta progression';
        text.textContent = 'Crée un compte pour ne jamais la perdre et la retrouver sur tous tes appareils.';
        const login = el('button', 'auth-link');
        login.type = 'button';
        login.textContent = 'J’ai déjà un compte : me connecter';
        login.addEventListener('click', () => {
            authDone = () => renderOnboard();   // reste sur l’étape : elle propose ensuite le pseudo
            openAuthModal('login');
        });
        body.append(big('☁️'), title, text, login);
        next.textContent = 'Créer un compte';
        skip.textContent = 'Plus tard';
        skip.hidden = false;
    } else if (onboard.level === 'beginner') {
        title.textContent = 'Parfait, on commence par les bases !';
        text.textContent = 'Ton premier niveau t’attend sur le parcours. Bonne partie !';
        body.append(big('🌱'), title, text, welcomeGiftBox());
        next.textContent = 'Découvrir le parcours';
    } else {
        title.textContent = 'Un petit test pour te placer ?';
        text.textContent = 'Réponds à quelques questions de plus en plus difficiles : tu commenceras directement à ton niveau, sans passer par les questions trop faciles pour toi.';
        body.append(big('🧭'), title, text, welcomeGiftBox());
        next.textContent = 'Faire le test de placement';
        skip.textContent = 'Non merci, je commence au niveau 1';
        skip.hidden = false;
    }
}

/** Étape « compte » terminée : pas de compte possible, ou compte + pseudo (choisi, déjà existant ou remis à plus tard). */
function onboardAccountDone() {
    if (!window.supabase) return true;
    if (!cloudUser) return false;
    return onboard.pseudoSkipped || (league?.userId === cloudUser.id && !!league.pseudo);
}

async function onboardNext() {
    if (onboard.step === 3 && cloudUser && onboard.pseudoField) {   // étape du pseudo
        const next = $('onboardNext');
        if (next.disabled) return;
        next.disabled = true;
        const err = await setPseudo(onboard.pseudoField.value());
        if (err) { onboard.pseudoField.showError(err); return; }
        onboard.pseudoField = null;
        onboard.step++;
        renderOnboard();
        return;
    }
    if (onboard.step === 3) {   // étape « compte » : le bouton principal ouvre la création de compte
        authDone = () => renderOnboard();   // reste sur l’étape : elle propose ensuite le pseudo
        openAuthModal('signup');
        return;
    }
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
    else showScreen('map');   // tutoriel d'abord ; le joueur lance le niveau 1 quand il veut
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
    $('soundBtn').textContent = on ? '🔊 Son activé' : '🔇 Son coupé';
    $('soundBtn').title = on ? 'Sons et vibrations activés : toucher pour couper' : 'Sons et vibrations coupés : toucher pour activer';
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
function launchConfetti(palette) {
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

    const colors = palette || ['#58cc02', '#ffc800', '#8b5cf6', '#1899d6', '#ff9600', '#e5484d'];
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
        tab.addEventListener('click', () => {
            setProfileTab(tab.dataset.tab);
            // Téléphone : les onglets remontent en haut de l'écran (juste sous la barre du haut)
            const tabs = document.querySelector('.profile-tabs');
            const y = tabs.getBoundingClientRect().top + window.scrollY - $('topbar').offsetHeight - 8;
            window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        });
    });
    $('avatarBtn').addEventListener('click', openAvatarModal);
    $('profileTitle').addEventListener('click', openTitlesModal);
    $('closeTitlesBtn').addEventListener('click', () => { $('titlesModal').hidden = true; });
    $('titlesModal').addEventListener('click', e => { if (e.target === $('titlesModal')) $('titlesModal').hidden = true; });
    $('closeFriendBtn').addEventListener('click', () => { $('friendModal').hidden = true; });
    $('friendModal').addEventListener('click', e => { if (e.target === $('friendModal')) $('friendModal').hidden = true; });
    $('avatarDone').addEventListener('click', closeAvatarModal);
    $('avatarModal').addEventListener('click', e => { if (e.target === $('avatarModal')) closeAvatarModal(); });
    setProfileTab('badges');

    $('chestBtn').addEventListener('click', chestNext);
    $('closeChestBtn').addEventListener('click', () => {
        // Coffre fermé avant la fin : les cartes sont déjà gagnées, on met juste l'affichage à jour
        closeChest();
    });

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
        if (!$('authModal').hidden || !$('cloudConflictModal').hidden || !$('accountModal').hidden) return;
        if (!$('chestModal').hidden || !$('askModal').hidden || !$('avatarModal').hidden || !$('friendModal').hidden) return;
        if (!$('titlesModal').hidden) return;
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
    $('questionPhotoImg').addEventListener('load', () => {
        $('questionPhotoImg').classList.remove('is-loading');
        fitToKeyboard();
        keepAnswerVisible();
    });
    $('questionPhotoImg').addEventListener('error', () => $('questionPhotoImg').classList.remove('is-loading'));
    if (window.visualViewport) window.visualViewport.addEventListener('resize', onViewport);
    loadKeyboardMemory();   // hauteur clavier enregistrée lors d'une partie précédente
    updateKeyboardMode();   // mesure la hauteur d'écran sans clavier dès le lancement
    // Le clavier s'ouvre en animation : on réajuste plusieurs fois pendant qu'il apparaît
    $('userInput').addEventListener('focus', () => [50, 300, 700].forEach(ms => setTimeout(onViewport, ms)));
    $('userInput').addEventListener('blur', () => setTimeout(updateKeyboardMode, 150));

    $('onboardNext').addEventListener('click', onboardNext);
    $('onboardSkip').addEventListener('click', () => {
        if (onboard.step === 3) {   // « Plus tard » : pas de compte, ou pas de pseudo pour l'instant
            if (cloudUser) onboard.pseudoSkipped = true;
            onboard.pseudoField = null;
            onboard.step++;
            renderOnboard();
        }
        else finishOnboarding('level');
    });
    $('onboardBack').addEventListener('click', () => {
        if (onboard.step > 0) {
            onboard.step--;
            if (onboard.step === 3 && onboardAccountDone()) onboard.step--;   // étape compte déjà faite : on la saute
            onboard.pseudoField = null;
            renderOnboard();
        }
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
    // (même chose pour les drapeaux)
    let zoomOpenedAt = 0;
    const zoomable = (area, getImg, getCredit) => {
        let pressed = false;
        area.addEventListener('pointerdown', e => {
            if (!getImg()) return;
            e.preventDefault();   // garde le clavier ouvert : l'image ne bouge pas sous le doigt
            pressed = true;
            try { area.setPointerCapture(e.pointerId); } catch (err) { /* ancien navigateur */ }
        });
        area.addEventListener('pointercancel', () => { pressed = false; });
        area.addEventListener('pointerup', () => {
            if (!pressed) return;
            pressed = false;
            openZoom(getImg().src, getCredit());
        });
    };
    zoomable($('questionPhotoImg'), () => $('questionPhotoImg'), () => $('questionPhotoCredit').textContent);
    zoomable($('questionFlag'), () => $('questionFlag').querySelector('img'), () => '');

    function openZoom(src, credit) {
        $('photoZoomImg').src = src;
        $('photoZoomCredit').textContent = credit;
        $('photoZoom').hidden = false;
        zoomOpenedAt = Date.now();
        // Fermer le clavier : champ verrouillé + curseur retiré + focus donné à la vue agrandie
        // (un simple blur() ne suffit pas sur certains téléphones)
        const input = $('userInput');
        input.readOnly = true;
        input.blur();
        $('photoZoom').focus({ preventScroll: true });
    }
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

    // Parcours : bouton « Mon niveau » quand le niveau en cours n'est plus à l'écran
    $('toCurrentBtn').addEventListener('click', () => {
        const current = document.querySelector('.node.is-current');
        if (current) current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
    window.addEventListener('scroll', updateToCurrentBtn, { passive: true });

    // Petits décors du parcours : un tap = une anecdote sur le thème ; un tap n'importe où la referme
    $('mapDecor').addEventListener('click', e => {
        const badge = e.target.closest('.decor-badge');
        if (badge) showFact(badge.dataset.theme, badge);
    });
    document.addEventListener('pointerdown', e => {
        if (!$('factBubble').hidden && !e.target.closest('.decor-badge')) $('factBubble').hidden = true;
    });

    // Sauvegarde en ligne
    $('cloudBtn').addEventListener('click', () => {
        if (cloudUser) { renderCloudCard(); $('accountModal').hidden = false; }
        else openAuthModal('login');
    });
    $('closeAccountBtn').addEventListener('click', () => { $('accountModal').hidden = true; });
    // Œil du mot de passe : afficher / masquer ce qu'on tape
    $('authEye').addEventListener('click', () => {
        const input = $('authPassword');
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        $('authEye').textContent = show ? '🙈' : '👁️';
        $('authEye').setAttribute('aria-pressed', String(show));
        $('authEye').setAttribute('aria-label', show ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
        input.focus();
    });
    $('cloudLogoutBtn').addEventListener('click', () => { $('accountModal').hidden = true; cloudLogout(); });
    $('closeAuthBtn').addEventListener('click', () => { $('authModal').hidden = true; });
    $('authSwitch').addEventListener('click', () => openAuthModal(authMode === 'signup' ? 'login' : 'signup'));
    // Clavier ouvert sur un champ de la fenêtre : on garde le champ (et le bouton) visibles au-dessus du clavier
    ['authEmail', 'authPassword'].forEach(id => $(id).addEventListener('focus', () => {
        [300, 600].forEach(ms => setTimeout(() => $(id).scrollIntoView({ block: 'center', behavior: 'smooth' }), ms));
    }));
    $('authForgot').addEventListener('click', forgotPassword);
    $('authForm').addEventListener('submit', submitAuth);
    $('keepCloudBtn').addEventListener('click', () => { if (pendingRemote) applyRemote(pendingRemote); });
    $('keepDeviceBtn').addEventListener('click', async () => {
        $('cloudConflictModal').hidden = true;
        await cloudPush(true);
        showToast('📱 Progression de cet appareil gardée et sauvegardée en ligne.');
    });

    $('tourNext').addEventListener('click', () => { tourStep++; showTourStep(); });
    $('tourSkip').addEventListener('click', endTour);
    window.addEventListener('resize', () => { if (!$('tour').hidden) placeTour(); });

    $('quitStayBtn').addEventListener('click', closeQuitModal);
    $('quitConfirmBtn').addEventListener('click', () => {
        closeQuitModal();
        returnToMap();
    });
    $('quitModal').addEventListener('click', e => {
        if (e.target === $('quitModal')) closeQuitModal();
    });

    $('resetBtn').addEventListener('click', async () => {
        const text = cloudUser
            ? 'Tu es connecté : ta sauvegarde en ligne n’est pas effacée et reviendra toute seule. Pour repartir de zéro, déconnecte-toi d’abord.'
            : 'Tes niveaux, ton XP, ta série et tes statistiques seront perdus.';
        if (!await askConfirm({ title: 'Tout effacer ?', text, yes: 'Tout effacer', danger: true })) return;
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
        if (!$('authModal').hidden || !$('cloudConflictModal').hidden || !$('accountModal').hidden) {
            if (e.key === 'Escape') { $('authModal').hidden = true; $('accountModal').hidden = true; }
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
    readInviteFromUrl();                                    // lien d'invitation « ?ami=pseudo »
    flushReports();                                         // signalements restés en attente
    cloudInit();                                            // compte connecté ? synchronisation
    window.addEventListener('online', flushReports);        // dès que la connexion revient
    buildDecor($('mapDecor'), Math.round(MAX_LEVEL * 1.2));
    buildDecor($('lessonDecor'), 8);
    checkBadges(true);   // badges déjà mérités : on les attribue sans notification
    renderHeader();
    // Au rechargement (ex. : après une connexion), le navigateur remettait l'ancienne position de défilement :
    // c'est le jeu qui décide (niveau en cours au centre)
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    showScreen('map');
    // Une fois tout affiché (polices, images), on recentre le niveau en cours, sauf si le joueur a déjà défilé
    const firstY = window.scrollY;
    window.addEventListener('load', () => {
        const current = document.querySelector('.node.is-current');
        if (current && !$('mapScreen').hidden && Math.abs(window.scrollY - firstY) < 5) {
            current.scrollIntoView({ block: 'center' });
            updateToCurrentBtn();
        }
    }, { once: true });

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