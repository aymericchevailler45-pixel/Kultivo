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
const REVIEW_MAX = 4;            // maximum : +1 place par tranche de 3 questions ratées (11 questions au plus par niveau)
const REVIEW_SESSION_SIZE = 10;  // taille de la session « Réviser mes erreurs »
// Bac à sable (?bac=1, 2026-10-25) : copie de la vraie partie dans une sauvegarde à part, toutes les nouveautés actives,
// RIEN envoyé en ligne (sauvegarde, classement, duels, statistiques). Pour essayer avant les autres.
const BAC = (() => { try { return new URLSearchParams(location.search).get('bac') === '1'; } catch (err) { return false; } })();
const STORAGE_KEY = BAC ? 'kultivo_bac' : 'cultureG_v2';
// Remise à zéro de TOUS les joueurs (2026-10-20, demande de l'utilisateur avant les tests depuis zéro) : une sauvegarde
// (de l'appareil ou en ligne) sans cette marque est effacée / ignorée. Changer la date = nouvelle remise à zéro générale.
const RESET_EPOCH = '2026-10-20';

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
const XP_REPLAY = 2;              // 2026-10-25 : niveau DÉJÀ réussi qu'on refait (gratuit) : 2 XP par bonne réponse, pas de bonus
const REPLAY_MISSION_WINDOW = 20;  // un niveau refait compte pour les missions s'il fait partie des 20 derniers (2026-10-25)
const REPLAY_XP_DAY = 60;           // 2026-10-26 : les niveaux refaits rapportent au plus 60 XP par jour en tout (sinon on refaisait le 1 en boucle)
/** Niveaux refaits aujourd'hui : XP déjà gagnés et niveaux déjà comptés pour les missions (remis à zéro chaque jour). */
function replayToday() {
    const today = todayKey();
    if (state.data.replayDay.day !== today) state.data.replayDay = { day: today, xp: 0, levels: {} };
    return state.data.replayDay;
}
const replayXpLeft = () => Math.max(0, REPLAY_XP_DAY - replayToday().xp);
/** XP d'un niveau refait : coupés au plafond du jour (les autres parties ne changent pas). */
function replayXp(amount) {
    if (!state.replay) return amount;
    const gain = Math.min(amount, replayXpLeft());
    replayToday().xp += gain;
    return gain;
}
// Un niveau refait compte pour les missions s'il fait partie des 20 derniers, et une seule fois par jour
const replayCountsForMissions = n => n >= state.data.unlocked - REPLAY_MISSION_WINDOW && !replayToday().levels[n];
const XP_FIRST_TRY = 4;          // avant: 10 | bonne réponse du premier coup (question facile, d < 2,5)
/* Plus d'XP pour les questions difficiles (2026-10-23) : les niveaux avancés font plus d'erreurs ; sans ça, un joueur
   loin dans le parcours gagnait moins d'XP qu'un débutant → injuste pour la ligue des amis de la semaine. */
const xpFirstTry = q => (q.d > 3.5 ? 6 : q.d >= 2.5 ? 5 : XP_FIRST_TRY);
const XP_RETRY = 1;              // avant: 5  | bonne réponse après une erreur
const XP_FLAWLESS = 10;          // avant: 20 | bonus : leçon sans aucune erreur
const XP_CHALLENGE_WIN = 20;     // avant: 50 | bonus : niveau défi réussi
const XP_REVIEW_WIN = 10;        // avant: 10 | bonus : session de révision terminée
const XP_DAILY_CORRECT = 4;      // avant: 10 | par bonne réponse au défi du jour
const XP_DAILY_DONE = 10;        // avant: 20 | bonus : défi du jour terminé
const XP_SPRINT_CORRECT = 2;     // avant: 5  | par bonne réponse en sprint

// Pièces 🪙 : on en gagne en gagnant de l'XP (l'XP, lui, ne baisse jamais)
/* Mise à jour du 26/10/2026 (avec Halloween) : titres ×3, pièces revues, 75 % de cartes nouvelles, 30 cartes en plus
   (cards.js), fenêtre « Quoi de neuf ? ». Tout s'active seul ce jour-là (`patched`). */
const PATCH_DAY = '2026-10-26';
// Démo : ?demo=lundi = comme si on était le 26/10 (mise à jour + Halloween), pour voir avant
const demoLundi = (() => { try { return new URLSearchParams(location.search).get('demo') === 'lundi'; } catch (err) { return false; } })();
const patched = () => demoLundi || BAC || todayKey() >= PATCH_DAY;
const COIN_RATE = 5;              // avant: 10 | 1 pièce pour 5 XP gagnés (le reste est gardé pour la suite)
const COIN_BADGE = 25;           // avant: 5  | bonus : nouveau badge
const coinRate = () => (patched() ? 8 : COIN_RATE);    // 26/10 : 1 pièce pour 8 XP (on avait trop de pièces)
const coinBadge = () => (patched() ? 15 : COIN_BADGE); // 26/10 : 15 🪙 par badge
const newCardChance = () => (patched() ? 0.75 : 0.8);  // chance qu'une carte tirée soit une carte pas encore possédée
const DROPS_MAX = 5;             // gouttes 💧 : 1 par niveau du parcours
const DROP_MS = 60 * 60 * 1000;  // +1 goutte par heure
const DROPS_PRACTICE_DAY = 3;    // gouttes gagnées par jour au plus en révisant / s'entraînant
const DROPS_REFILL_PRICE = 150;  // boutique : recharge complète

const DAILY_SIZE = 10;           // questions du défi du jour
const SPRINT_SECONDS = 60;       // durée du sprint
// Un niveau rapporte environ 50 à 70 XP : 60 ≈ 1 niveau, 150 ≈ 2-3 niveaux, 250 ≈ 4-5 niveaux
const GOAL_CHOICES = [
    // 26/10 : un peu plus pour les petits rythmes (sinon la boutique était hors de portée pour eux)
    { xp: 60,  label: 'Tranquille', get reward() { return patched() ? 20 : 10; } },
    { xp: 150, label: 'Régulier',   get reward() { return patched() ? 30 : 25; } },
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
/* Cartes de chacune des 3 frises (2026-10-25, demande de l'utilisateur : le niveau 86 passait d'un coup à 3 frises de 6) :
   on ajoute une carte à une frise à la fois. 6-26 : 4·4·4 ; 36 : 4·4·5 ; 46 : 4·5·5 ; 56-66 : 5·5·5 ; 76 : 5·5·6 ;
   86 : 5·6·6 ; 96 et plus : 6·6·6. */
function orderSizes(level) {
    if (level < 36) return [4, 4, 4];
    if (level < 46) return [4, 4, 5];
    if (level < 56) return [4, 5, 5];
    if (level < 76) return [5, 5, 5];
    if (level < 86) return [5, 5, 6];
    if (level < 96) return [5, 6, 6];
    return [6, 6, 6];
}

// Coffres du parcours : un coffre après chaque niveau multiple de 5 (3 cartes ; 4 après un défi, dont une rare ou mieux)
const CHEST_EVERY = 5;
const chestSize = n => n % CHALLENGE_EVERY === 0 ? 4 : 3;
const SHOP_CHEST = { price: 150, size: 3 };   // coffre de la boutique : 3 cartes, dont une rare ou mieux
const GOAL_CARDS = 1;                          // carte offerte avec la récompense de l'objectif du jour

// Test de placement : une étape par tranche de 10 niveaux (niveaux 1-9, 11-19, …)
// Limité à 8 étapes (départ au niveau 81 au mieux, sur 170) pour garder du jeu à faire.
const PLACEMENT_MAX_STEPS = 8;   // départ au niveau 81 au mieux (sur 170)
const PLACEMENT_CHESTS_NOW = 3;   // coffres sautés donnés tout de suite ; les autres = cartes bonus dans les coffres suivants
const CHEST_BONUS_MAX = 3;        // cartes bonus ajoutées au plus par coffre du parcours
const PLACEMENT_XP_PER_LEVEL = 40; // XP données par niveau sauté (≈ un niveau joué), au total seulement (pas dans la semaine)
const COIN_BONUS_PER_LEVEL = 10;   // pièces dues après un placement, versées au plus par niveau réussi
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

// Nombres composés (« dix-sept », « quatre-vingt-neuf », « mille sept cent… »), ordinaux (« cinquième » = « 5e »)
// et chiffres romains (« Louis XIV » = « Louis 14 ») : ajoutés le 2026-10-23 (« le 5e élément » était refusé).
const NUM_VALUES = { zero: 0, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10,
    onze: 11, douze: 12, treize: 13, quatorze: 14, quinze: 15, seize: 16, vingt: 20, vingts: 20, trente: 30,
    quarante: 40, cinquante: 50, soixante: 60, cent: 100, cents: 100, mille: 1000 };
const ORDINAL_WORDS = { premier: 1, premiere: 1, second: 2, seconde: 2, deuxieme: 2, troisieme: 3, quatrieme: 4,
    cinquieme: 5, sixieme: 6, septieme: 7, huitieme: 8, neuvieme: 9, dixieme: 10, onzieme: 11, douzieme: 12,
    treizieme: 13, quatorzieme: 14, quinzieme: 15, seizieme: 16, vingtieme: 20, trentieme: 30, centieme: 100 };
const ROMAN = { i: 1, v: 5, x: 10, l: 50, c: 100 };
const ROMAN_STEPS = [[100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']];

/** « xiv » → 14 si c'est un chiffre romain écrit correctement (sinon null). Lettre seule : V et X uniquement
    (« l », « i », « c » seuls sont trop souvent des lettres ordinaires). */
function romanValue(w) {
    if (!/^[ivxlc]+$/.test(w) || (w.length === 1 && w !== 'v' && w !== 'x')) return null;
    let n = 0;
    for (let i = 0; i < w.length; i++) {
        const v = ROMAN[w[i]], next = ROMAN[w[i + 1]] || 0;
        n += v < next ? -v : v;
    }
    let rest = n, back = '';
    for (const [val, sym] of ROMAN_STEPS) while (rest >= val) { back += sym; rest -= val; }
    return back === w ? n : null;
}

/** Nombres écrits en lettres (même composés) → chiffres. « un / une » seulement après « et » (« vingt et un ») :
    seuls, ce sont surtout des articles. */
function wordsToNumbers(words) {
    const out = [];
    for (let i = 0; i < words.length; i++) {
        if (!(words[i] in NUM_VALUES)) { out.push(words[i]); continue; }
        let total = 0, current = 0, last = 0, j = i;
        for (; j < words.length; j++) {
            let w = words[j];
            if (w === 'et' && ['un', 'une', 'onze'].includes(words[j + 1])) continue;
            if (w === 'une') w = 'un';
            const v = w === 'un' ? (words[j - 1] === 'et' ? 1 : undefined) : NUM_VALUES[w];
            if (v === undefined) break;
            if (v === 1000) { total += (current || 1) * 1000; current = 0; }
            else if (v === 100) current = (current || 1) * 100;
            else if (v === 20 && last === 4) current += 76;   // quatre-vingt(s)
            else current += v;
            last = v;
        }
        if (words[j - 1] === 'et') j--;   // « … et » sans nombre après : on rend le « et »
        out.push(String(total + current));
        i = j - 1;
    }
    return out;
}

/* Mots équivalents, pour toutes les questions : abréviations (« St-Pierre », « Downey Jr ») et couleurs au féminin
   (« noire » = « noir » : la réponse attendue et la réponse tapée passent toutes deux par là, rien n'est faussé). */
const WORD_SAME = {
    st: 'saint', ste: 'sainte', sts: 'saints', stes: 'saintes', jr: 'junior',
    dr: 'docteur', pr: 'professeur', mr: 'monsieur', mme: 'madame', mmes: 'mesdames', mlle: 'mademoiselle', mlles: 'mesdemoiselles',
    noire: 'noir', noires: 'noir', blanche: 'blanc', blanches: 'blanc', verte: 'vert', vertes: 'vert',
    bleue: 'bleu', bleues: 'bleu', grise: 'gris', grises: 'gris', violette: 'violet', violettes: 'violet', brune: 'brun', brunes: 'brun'
};
function normalize(str) {
    const words = str
        .toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/œ/g, 'oe').replace(/æ/g, 'ae')
        .replace(/(\d),(\d)/g, '$1.$2')              // 42,195 = 42.195
        .replace(/&/g, ' et ')                         // « Tom & Jerry » = « Tom et Jerry » (2026-10-25)
        .replace(/(^|\s)m\.\s/g, '$1monsieur ')       // « M. Hulot » = « Monsieur Hulot »
        .replace(/[’'\-–—]/g, ' ')
        .replace(/[^\p{L}\p{N}.\s]/gu, '')
        .replace(/\.(?!\d)|(?<!\d)\./g, '')          // un point ne reste que dans un nombre décimal
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .map(w => WORD_SAME[w] || w)   // st = saint, jr = junior, noire = noir… (2026-10-25, signalements)
        .map(w => {
            const ord = w.match(/^(\d+)(e|eme|ieme|er|ere|re|nd|nde)$/);   // 5e, 5ème, 1er, 2nd…
            if (ord) return `${Number(ord[1])}e`;
            if (w in ORDINAL_WORDS) return `${ORDINAL_WORDS[w]}e`;
            const r = romanValue(w);
            return r === null ? w : String(r);
        });
    return wordsToNumbers(words).join(' ');
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
    `question` sert à refuser une réponse courte déjà écrite dans la question.
    Version 1 (jusqu'au 25/10/2026), gardée pour pouvoir y revenir : JUDGE_VERSION = 1. */
function judgeV1(input, rawAnswers, question = '') {
    const typed = stripArticles(normalize(input));
    if (!typed) return 'wrong';
    const numbersTyped = normalize(input).match(/\d+(?:\.\d+)?/g) || [];
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
        if (/^\d+(\.\d+)?$/.test(ans)) {   // nombre (date, distance…) : exact uniquement
            if (numbersTyped.includes(ans)) return 'exact';
            continue;
        }

        const distance = levenshtein(typed, ans);
        if (distance === 0) return 'exact';
        const tolerance = ans.length >= 9 ? 2 : ans.length >= 5 ? 1 : 0;
        // Faute de frappe tolérée sur les lettres, jamais sur les nombres (« Louis 17 » ≠ « Louis 16 »)
        const numbersAns = ans.match(/\d+(?:\.\d+)?/g) || [];
        const sameNumbers = numbersAns.join(' ') === (typed.match(/\d+(?:\.\d+)?/g) || []).join(' ');
        if (distance <= tolerance && sameNumbers) typo = true;
    }
    return typo ? 'typo' : 'wrong';
}

/* ---------- Correction des réponses, version 2 (2026-10-25, choix de l'utilisateur) ----------
   Mêmes réponses acceptées qu'avant (forme courte, nombres exacts…), mais les fautes de frappe sont mieux reconnues :
   1. deux lettres inversées = une seule faute (« Loius ») ;
   2. une lettre VOISINE sur le clavier (AZERTY ou QWERTY) = une demi-faute (« Chirn ») ;
   3. tolérance MOT PAR MOT quand le nombre de mots est le même : chaque mot a sa petite marge, un mot entier faux ne passe
      pas (« Guerre de Sang Ans ») ; sinon, comme avant, sur toute la réponse ;
   4. mots de 6 lettres ou plus qui SE PRONONCENT pareil (et ont au moins la moitié de leurs lettres en commun) : faute
      d'orthographe tolérée (« Nietsche », « Rinocéros »).
   Marge par mot : 1-3 lettres exact ; 4 lettres une voisine (½) ou une inversion ; 5-8 lettres 1 faute ; 9 et plus 2 fautes.
   Tout ce qui est accepté ainsi compte comme une faute de frappe (« Accepté, mais attention à l'orthographe »). */
const JUDGE_VERSION = 2;
const judge = (input, rawAnswers, question = '') => (JUDGE_VERSION === 1 ? judgeV1 : judgeV2)(input, rawAnswers, question);

const KEY_NEAR = (() => {
    const near = new Set();
    for (const rows of [['azertyuiop', 'qsdfghjklm', 'wxcvbn'], ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']]) {
        rows.forEach((row, r) => [...row].forEach((ch, i) => {
            const add = other => { if (other && other !== ch) { near.add(ch + other); near.add(other + ch); } };
            add(row[i - 1]); add(row[i + 1]);
            for (const rr of [r - 1, r + 1]) {
                const o = rows[rr];
                if (o) { add(o[i - 1]); add(o[i]); add(o[i + 1]); }
            }
        }));
    }
    return near;
})();
const keysNear = (a, b) => KEY_NEAR.has(a + b);

/** Fautes entre t (tapé) et a (attendu) : lettre voisine ½, inversion de 2 lettres 1, lettre en trop tapée à côté ½. */
function typoCost(t, a) {
    const n = t.length, m = a.length;
    const d = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = 0; i <= n; i++) d[i][0] = i;
    for (let j = 0; j <= m; j++) d[0][j] = j;
    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
            const tc = t[i - 1], ac = a[j - 1];
            const sub = tc === ac ? 0 : keysNear(tc, ac) ? 0.5 : 1;
            // lettre en trop : la moitié si c'est la même que sa voisine, ou une touche d'à côté (doigt qui accroche)
            const extra = (i > 1 && (t[i - 2] === tc || keysNear(t[i - 2], tc))) || (i < n && (t[i] === tc || keysNear(t[i], tc))) ? 0.5 : 1;
            // lettre oubliée : la moitié si c'est une lettre doublée (« apel » pour « appel »)
            const missing = (j > 1 && a[j - 2] === ac) || (j < m && a[j] === ac) ? 0.5 : 1;
            d[i][j] = Math.min(d[i - 1][j] + extra, d[i][j - 1] + missing, d[i - 1][j - 1] + sub);
            if (i > 1 && j > 1 && tc === a[j - 2] && t[i - 2] === ac && tc !== ac) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        }
    }
    return d[n][m];
}

/** Clé de prononciation française (simplifiée) d'un mot déjà sans accents, en minuscules. */
function soundKey(w) {
    let s = w;
    s = s.replace(/eaux?$/, 'o').replace(/eau/g, 'o').replace(/au/g, 'o');
    s = s.replace(/ph/g, 'f').replace(/pf/g, 'f').replace(/th/g, 't').replace(/rh/g, 'r');
    s = s.replace(/tch/g, 'ch').replace(/sch/g, 'ch').replace(/sh/g, 'ch');
    s = s.replace(/ck/g, 'k').replace(/qu/g, 'k').replace(/q/g, 'k');
    s = s.replace(/c(?=[eiy])/g, 's').replace(/c(?!h)/g, 'k');
    s = s.replace(/gu(?=[eiy])/g, 'g').replace(/g(?=[eiy])/g, 'j');
    s = s.replace(/y/g, 'i').replace(/w/g, 'v').replace(/z/g, 's').replace(/x/g, 'ks');
    s = s.replace(/h/g, (m, i) => (s[i - 1] === 'c' ? 'h' : ''));
    s = s.replace(/[ae]i/g, 'e').replace(/(er|ez|et)$/, 'e');
    s = s.replace(/[ae][nm](?=[^aeiouy]|$)/g, 'an').replace(/(ai|ei)?[iu][nm](?=[^aeiouy]|$)/g, 'in').replace(/o[nm](?=[^aeiouy]|$)/g, 'on');
    s = s.replace(/(.)\1+/g, '$1');
    s = s.replace(/e$/, '').replace(/[stxdp]$/, '');
    return s;
}
/** Nombre de lettres en commun (sans tenir compte de l'ordre). */
function commonLetters(a, b) {
    const count = {};
    for (const ch of a) count[ch] = (count[ch] || 0) + 1;
    let n = 0;
    for (const ch of b) if (count[ch] > 0) { count[ch]--; n++; }
    return n;
}
/** Un mot tapé vaut-il le mot attendu (avec sa petite marge) ? */
function wordClose(t, a) {
    if (t === a) return true;
    if (/\d/.test(t) || /\d/.test(a)) return false;   // jamais de marge sur un nombre
    const len = a.length;
    if (len <= 3) return false;
    const cost = typoCost(t, a);
    if (len === 4 ? cost <= 0.5 || (cost === 1 && t.length === 4 && [...t].sort().join('') === [...a].sort().join('')) : cost <= (len >= 9 ? 2 : 1)) return true;
    // Même prononciation (mots longs seulement, et assez de lettres en commun)
    return len >= 6 && t.length >= 5 && soundKey(t) === soundKey(a) && commonLetters(t, a) >= Math.ceil(len / 2);
}
/** Réponse entière proche (mot par mot si le nombre de mots est le même, sinon sur toute la réponse). */
function answerClose(typed, ans) {
    const tw = typed.split(' '), aw = ans.split(' ');
    const len = ans.length;
    const budget = len >= 9 ? 2 : len >= 5 ? 1 : len === 4 ? 0.5 : 0;   // marge sur toute la réponse (comme avant)
    if (tw.length === aw.length) {
        if (tw.every((w, i) => wordClose(w, aw[i]))) return true;
        // Sinon, la marge globale d'avant… à condition qu'aucun petit mot (3 lettres ou moins) ne soit faux
        // et qu'aucun mot ne soit entièrement différent (« Guerre de Sang Ans », « Jeanne d'Orc » : refusés)
        let total = 0;
        for (let i = 0; i < tw.length; i++) {
            const c = typoCost(tw[i], aw[i]);
            if (c > 0 && (aw[i].length <= 3 || /\d/.test(aw[i]) || c > aw[i].length / 3)) return false;
            total += c;
        }
        return total <= budget;
    }
    return typoCost(typed, ans) <= budget;
}

/* Règles du 2026-10-26 (signalements, choix de l'utilisateur) :
   - rébus d'EXPRESSION : « avoir » / « être » au début ne comptent pas (« avoir une langue de vipère ») ;
   - nom de personne (2-3 mots qui commencent tous par une majuscule) : nom avant le prénom accepté (« Khan Kubilaï ») ;
     les autres réponses gardent l'ordre de leurs mots ;
   - un « de / du / des » AJOUTÉ entre deux mots qui se suivent dans la réponse change le sens : refusé
     (« avoir peur du bleu » n'est pas « avoir une peur bleue »). En oublier un reste permis (« tunnel sous Manche »). */
const LINK_WORDS = new Set(['de', 'du', 'des', 'd']);
const NAME_PARTICLES = new Set(['de', 'du', 'des', 'd', 'la', 'le', 'van', 'von', 'der', 'da', 'di', 'del', 'y']);
/** Pour chaque paire de mots qui se suivent (sans les articles) : y a-t-il un « de / du / des » entre les deux ? */
function linkGaps(norm) {
    const content = [], links = [];
    let link = false;
    for (const w of norm.split(' ')) {
        if (ARTICLES.has(w)) { if (LINK_WORDS.has(w) && content.length) link = true; continue; }
        if (content.length) links.push(link);
        content.push(w);
        link = false;
    }
    return { content, links };
}
/** La réponse tapée ajoute-t-elle un « de / du / des » là où la réponse attendue n'en a pas ? */
function addsLink(typedNorm, ansNorm) {
    const t = linkGaps(typedNorm), a = linkGaps(ansNorm);
    if (t.content.length !== a.content.length || t.content.length < 2) return false;
    return t.links.some((l, i) => l && !a.links[i]);
}
/** Réponse qui ressemble à un nom de personne : 2 ou 3 mots, tous avec une majuscule (hors particules « de », « van »…). */
function looksLikeName(raw) {
    const words = raw.replace(/[’']/g, ' ').split(/\s+/).filter(Boolean);
    const main = words.filter(w => !NAME_PARTICLES.has(w.toLowerCase()));
    return main.length >= 2 && main.length <= 3 && main.every(w => /^\p{Lu}/u.test(w));
}
const dropLeadingVerb = str => { const w = str.split(' '); return w.length > 1 && (w[0] === 'avoir' || w[0] === 'etre') ? w.slice(1).join(' ') : str; };

function judgeV2(input, rawAnswers, question = '') {
    // Réponse faite d'un seul « article » (la note « La », la lettre « D ») : on ne l'efface pas
    const expression = /expression.*rébus/i.test(question);
    const full = str => (expression ? dropLeadingVerb(normalize(str)) : normalize(str));
    const keep = str => { const n = full(str); return stripArticles(n) || n; };
    const typed = keep(input);
    if (!typed) return 'wrong';
    const typedFull = full(input);
    const numbersTyped = normalize(input).match(/\d+(?:\.\d+)?/g) || [];
    const questionWords = new Set(stripArticles(normalize(question)).split(' '));
    let typo = false;
    const answers = [];   // [réponse sans articles, réponse complète (pour les « de / du »)]
    for (const raw of rawAnswers) {
        const ans = keep(raw);
        if (!ans) continue;
        answers.push([ans, full(raw)]);
        const short = answerWithoutGeneric(ans);
        if (short && short.length >= 3 && !short.split(' ').every(w => questionWords.has(w))) answers.push([short, short]);
        if (!expression && looksLikeName(raw)) {   // nom avant le prénom : « Sartre Jean-Paul », « Khan Kubilaï »
            const w = ans.split(' ');
            if (w.length >= 2) { const turned = [w[w.length - 1], ...w.slice(0, -1)].join(' '); answers.push([turned, turned]); }
        }
    }
    for (const [ans, ansFull] of answers) {
        if (/^\d+(\.\d+)?$/.test(ans)) {   // nombre (date, distance…) : exact uniquement
            if (numbersTyped.includes(ans)) return 'exact';
            continue;
        }
        if (addsLink(typedFull, ansFull)) continue;
        if (typed === ans) return 'exact';
        const numbersAns = ans.match(/\d+(?:\.\d+)?/g) || [];
        const sameNumbers = numbersAns.join(' ') === (typed.match(/\d+(?:\.\d+)?/g) || []).join(' ');
        if (sameNumbers && answerClose(typed, ans)) typo = true;
    }
    return typo ? 'typo' : 'wrong';
}

/* ---------- État et sauvegarde ---------- */

function defaultData() {
    return {
        resetEpoch: RESET_EPOCH,         // remise à zéro générale dont date cette sauvegarde
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
        trainTier: {},                   // entraînement : thème -> palier débloqué (1 à 5)
        trainTierDay: {},                // entraînement : thème -> jour du dernier palier gagné (1 par jour)
        tipTraining: false,              // explication des paliers déjà vue (ancienne version, 1 bulle)
        tipTraining2: false,             // explication de l'entraînement en 3 bulles (2026-10-18)
        tipChallenges: false,            // 1re visite de l'onglet Défis : bulle qui mène à l'Entraînement
        tipProfile: false,               // 1re visite du Profil : badges, cartes, compte
        tipLeague: false,                // 1re visite du Classement (connecté, avec pseudo) : amis, semaine, lundi
        tipLeagueIntro: false,           // 1re visite du Classement sans compte ni pseudo
        trainChests: {},                 // entraînement : thème -> dernier palier dont le coffre a été donné
        trainMedals: {},                 // entraînement : thème -> médaille gagnée (1 bronze, 2 argent, 3 or)
        shinyCards: {},                  // cartes rendues brillantes (touchées dans la collection après le 3e exemplaire)
        themeComplete: {},               // collection : thème -> date où ses 10 cartes ont été réunies (fête montrée)
        streakWarnDay: '',               // jour où l'alerte « série en danger » a été montrée
        drops: DROPS_MAX,                // gouttes 💧 (1 par niveau du parcours)
        dropsAt: 0,                      // début de la recharge en cours (horodatage, 0 = plein)
        dropsDay: '',                    // jour des gouttes gagnées en révisant / s'entraînant
        dropsEarned: 0,                  // … et combien ce jour-là (3 au plus)
        tipDrops: false,                 // explication des gouttes déjà vue
        coinRest: 0,                     // XP pas encore changés en pièces (moins de COIN_RATE)
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
        chestBonus: 0,                   // cartes encore dues pour les coffres sautés par le placement
        coinBonus: 0,                    // pièces encore dues pour les niveaux sautés par le placement
        missions: null,                  // missions de la semaine : { week, progress, claimed, chest }
        events: {},                      // événements : id -> { found, won, pumpkins: { day, got } }
        avatarExtra: [],                 // dessins d'avatar gagnés pendant les événements (gardés pour toujours)
        avatarNew: false,                // un dessin vient d'être gagné : pastille sur l'avatar du Profil
        patchSeen: null,                 // date de la dernière mise à jour dont « Quoi de neuf ? » a été vu
        av: { owned: {}, opened: {}, known: {}, grant: {}, migrated: false },   // objets d'avatar (26/10) : achetés, déjà « ouverts », déjà connus, offerts
        vitrine: null,                   // carte de la semaine : { week, card, rarity, shine, bought }
        vitrineSeen: null,               // lundi de la dernière vitrine regardée (pastille de la Boutique)
        playerSeed: null,                // tirage propre au joueur (carte de la semaine)
        leagueRecap: null,               // résultat de la semaine dernière (ligue des amis), montré jusqu'à « vu » / coffre ouvert
        duelsSeen: {},                   // duels dont le résultat a été vu (pièces données une seule fois)
        duelAnswers: {},                 // duels : graine -> mes réponses tapées (pour les revoir)
        duelsViewed: {},                 // résultats de duels déjà regardés (sinon pastille)
        replayDay: { day: null, xp: 0, levels: {} },   // niveaux refaits aujourd'hui : XP gagnés (plafond), niveaux comptés pour les missions
        monthStats: {},                  // récap du mois : 'AAAA-MM' -> { answers, right, themes, missed, cards, bigCards }
        monthStatsInit: false,           // le mois en cours a été rempli une fois avec l'historique (2026-10-27)
        recapSeen: {},                   // récaps du mois déjà regardés : 'AAAA-MM' -> jour où on l'a vu
        reports: []                      // signalements en attente d'envoi (Supabase plus tard) : [{ id, q, typed, reason… }]
    };
}

/** Remet d'équerre une sauvegarde (ex. : de nouveaux niveaux ou de nouvelles fonctions). */
function normalizeData(data) {
    const base = defaultData();
    for (const key of ['dayXp', 'totals', 'best', 'inv']) data[key] = { ...base[key], ...data[key] };
    for (const key of ['goalDays', 'daily', 'badges', 'claimedBadges', 'claimedGoals', 'stats', 'done', 'pairStats', 'orderStats', 'cards', 'chests', 'podium', 'trainTier', 'trainTierDay', 'trainChests', 'trainMedals', 'shinyCards', 'themeComplete', 'activeDays', 'frozenDays', 'events', 'duelsSeen', 'duelAnswers', 'duelsViewed']) data[key] = data[key] || {};
    if (OLD_GOALS[data.goal]) data.goal = OLD_GOALS[data.goal];
    if (!GOAL_CHOICES.some(c => c.xp === data.goal)) data.goal = GOAL_CHOICES[1].xp;
    backfillActiveDays(data);
    if (!Array.isArray(data.reports)) data.reports = [];
    if (!Array.isArray(data.avatarExtra)) data.avatarExtra = [];
    data.av = { owned: {}, opened: {}, known: {}, grant: {}, migrated: false, ...(data.av || {}) };
    for (const k of ['owned', 'opened', 'known', 'grant']) data.av[k] = data.av[k] || {};
    if (typeof data.playerSeed !== 'string') data.playerSeed = Math.random().toString(36).slice(2, 10);
    data.avatarNew = data.avatarNew === true;
    if (!data.monthStats || typeof data.monthStats !== 'object') data.monthStats = {};
    if (!data.recapSeen || typeof data.recapSeen !== 'object') data.recapSeen = {};
    if (!data.monthStatsInit) backfillMonthStats(data);
    const rd = data.replayDay;
    data.replayDay = rd && typeof rd === 'object' ? { day: rd.day || null, xp: Number(rd.xp) || 0, levels: rd.levels || {} } : { day: null, xp: 0, levels: {} };
    // Gouttes : les joueurs d'avant commencent avec le plein
    if (typeof data.drops !== 'number' || !(data.drops >= 0)) data.drops = DROPS_MAX;
    data.drops = Math.min(DROPS_MAX, Math.floor(data.drops));
    if (typeof data.dropsAt !== 'number') data.dropsAt = 0;
    if (typeof data.coinRest !== 'number' || !(data.coinRest >= 0)) data.coinRest = 0;
    if (typeof data.chestBonus !== 'number' || !(data.chestBonus >= 0)) data.chestBonus = 0;
    if (typeof data.coinBonus !== 'number' || !(data.coinBonus >= 0)) data.coinBonus = 0;

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

/** Sauvegarde d'avant la dernière remise à zéro générale : on efface tout sur l'appareil (progression, compte
    connecté, classement en cache, anciennes clés v1). Noms écrits en clair : appelé avant leur déclaration. */
function wipeBeforeReset() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const old = raw ? JSON.parse(raw) : null;
        const legacy = localStorage.getItem('cultureG_unlockedLevel') !== null;
        if ((old && old.resetEpoch !== RESET_EPOCH) || (!old && legacy)) {
            ['cultureG_v2', 'kultivo_cloud', 'kultivo_league', 'kultivo_auth', 'kultivo_invite',
             'cultureG_unlockedLevel', 'cultureG_streak', 'cultureG_lastReview', 'cultureG_data']
                .forEach(k => localStorage.removeItem(k));
        }
    } catch (err) { /* stockage illisible : loadData repartira de zéro */ }
}

function loadData() {
    if (BAC) {   // 1re ouverture du bac à sable : on copie la vraie partie
        try { if (!localStorage.getItem(STORAGE_KEY) && localStorage.getItem('cultureG_v2')) localStorage.setItem(STORAGE_KEY, localStorage.getItem('cultureG_v2')); } catch (err) { /* tant pis */ }
    } else wipeBeforeReset();
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
/** Ratée 2 fois dans la même révision / le même entraînement : mise de côté jusqu'au lendemain. */
const isLater = id => (state.data.stats[id]?.later || '') > todayKey();
function tomorrowKey() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return dayKey(d);
}
const missedCards = () => QUESTIONS.filter(q => missCount(q.id) > 0 && !isLater(q.id));

// Répétition espacée : après n réussites d'affilée, la question « dort » ce nombre de jours
const REVIEW_DAYS = [0, 1, 3, 7, 14, 30];
const REPLAY_MIN = 3;   // un niveau déjà terminé reprend au moins 3 questions

function recordResult(id, ok) {
    const entry = state.data.stats[id] || { miss: 0 };
    // Entraînement : une question est « maîtrisée » quand on la réussit encore un AUTRE jour
    const sameDay = entry.last && dayKey(new Date(entry.last)) === todayKey();
    const keepStreak = ok && id >= TRAINING_ID_MIN && sameDay && (entry.streak || 0) >= 1;
    entry.miss = ok ? Math.max(0, entry.miss - 1) : entry.miss + 1;
    entry.streak = ok ? (keepStreak ? entry.streak : (entry.streak || 0) + 1) : 0;   // réussites d'affilée
    entry.tries = (entry.tries || 0) + 1;
    if (ok) entry.right = (entry.right || 0) + 1;
    entry.last = Date.now();
    state.data.stats[id] = entry;

    state.data.totals.tries++;
    if (ok) state.data.totals.right++;
    noteMonthAnswer(id, ok);
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
    const titleBefore = titleFor(data.xp).current.name;
    const today = todayKey();
    if (data.dayXp.day !== today) data.dayXp = { day: today, xp: 0 };

    const before = data.dayXp.xp;
    data.activeDays[today] = (data.activeDays[today] || 0) + amount;
    data.xp += amount;
    data.dayXp.xp += amount;
    state.sessionXp += amount;

    // 1 pièce pour COIN_RATE XP : le reste est gardé (sinon 4 XP arrondis donnaient 0 pièce à chaque réponse)
    data.coinRest += amount;
    const coinGain = Math.floor(data.coinRest / coinRate());
    data.coinRest -= coinGain * coinRate();
    data.coins += coinGain;
    state.sessionCoins += coinGain;

    const t = titleFor(data.xp);
    if (t.current.name !== titleBefore) state.pendingTitle = { from: state.pendingTitle?.from || titleBefore, to: t.current.name, next: t.next };
    if (before < data.goal && data.dayXp.xp >= data.goal) {
        data.goalDays[today] = true;
        state.goalReached = true;
            }
    saveData();
    renderHeader();
}

/** 26/10 : il faut 3 fois plus d'XP pour chaque titre (on y arrivait trop vite). */
const titleList = () => (patched() ? TITLES.map(t => ({ ...t, xp: t.xp * 3 })) : TITLES);
function titleFor(xp) {
    let idx = 0;
    const list = titleList();
    list.forEach((t, i) => { if (xp >= t.xp) idx = i; });
    return { current: list[idx], next: list[idx + 1] || null };
}

/** Pièces gagnées et objectif atteint, sous les tuiles du récap (l'XP a sa propre tuile). */
function rewardSummary() {
    const lines = [];
    if (state.sessionCoins > 0) lines.push(`+${state.sessionCoins} 🪙`);
    return lines.join('\n');   // l'objectif atteint a sa propre case sur l'écran de fin (`renderEndGoal`)
}

/** Texte « +45 XP » (et objectif atteint) affiché à la fin d'une leçon. */
function xpSummary() {
    const lines = [];
    if (state.sessionXp > 0) lines.push(`+${state.sessionXp} XP   +${state.sessionCoins} 🪙`);
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
        for (let i = 1; i <= missed; i++) data.frozenDays[daysAgoKey(i)] = true;   // pour le calendrier (l'animation du gel suit)
    }
    data.streak = alive ? data.streak + 1 : 1;
    data.lastDay = todayKey();
    data.activeDays[data.lastDay] = data.activeDays[data.lastDay] || 0;
    data.best.streak = Math.max(data.best.streak, data.streak);
    saveData();
    // Nouveau jour de série : les animations, par-dessus l'écran de fin (gel utilisé d'abord, puis la roulette)
    if (alive && missed > 0) celebrate(() => showFreezeAnim(data.streak));
    celebrate(() => showStreakAnim(data.streak));
}

/* Petites fêtes à la suite (2026-10-27) : gel utilisé → jour de série → nouveau titre. Chacune appelle nextCelebration()
   quand on la ferme. */
const celebrations = [];
let celebrating = false;
function celebrate(fn) {
    celebrations.push(fn);
    if (!celebrating) { celebrating = true; setTimeout(nextCelebration, 120); }
}
function nextCelebration() {
    const fn = celebrations.shift();
    if (!fn) { celebrating = false; return; }
    fn();
}

/** Fenêtre plein écran des petites fêtes (série, gel, titre) : un seul calque réutilisé. */
function celebrationLayer(id, cls) {
    let ov = $(id);
    if (!ov) {
        ov = el('div', cls);
        ov.id = id;
        ov.setAttribute('role', 'dialog');
        document.body.append(ov);
    }
    ov.replaceChildren();
    ov.classList.remove('is-on', 'is-closing');
    ov.hidden = false;
    requestAnimationFrame(() => ov.classList.add('is-on'));
    return ov;
}
function closeCelebrationLayer(id) {
    const ov = $(id);
    if (!ov || ov.hidden) return false;
    ov.classList.add('is-closing');
    setTimeout(() => { ov.hidden = true; ov.classList.remove('is-on', 'is-closing'); ov.replaceChildren(); nextCelebration(); }, 250);
    return true;
}

/* ---------- 5 · Gel de série utilisé : la flamme se fige dans la glace, la glace éclate, la flamme repart ---------- */
let freezeTimers = [];
function showFreezeAnim(streak) {
    const ov = celebrationLayer('freezeAnim', 'freeze-anim');
    const ice = el('div', 'freeze-ice');
    const fire = el('img');
    fire.src = 'emoji/1f525.svg';
    fire.alt = '';
    const block = el('div', 'freeze-block');
    ice.append(fire, block);
    for (let i = 0; i < 10; i++) { const s = el('i', 'freeze-shard'); s.style.setProperty('--a', `${i * 36}deg`); ice.append(s); }
    const txt = el('div', 'freeze-text');
    const h = el('h3');
    h.textContent = '🧊 Série sauvée !';
    const p = el('p');
    p.textContent = `Un gel de série t’a protégé. Ta série de ${plural(streak, 'jour', 'jours')} continue.`;
    txt.append(h, p);
    ov.append(ice, txt);
    const done = () => { freezeTimers.forEach(clearTimeout); closeCelebrationLayer('freezeAnim'); };
    ov.onclick = done;
    freezeTimers = [
        setTimeout(() => { ov.classList.add('is-frozen'); playSound('freeze'); }, 400),
        setTimeout(() => { ov.classList.remove('is-frozen'); ov.classList.add('is-thawed'); playSound('thaw'); }, 1800),
        setTimeout(done, 3600)
    ];
}

/* ---------- 3 · Nouveau titre : écran vert, Kulti fier, l'ancien titre se retourne, confettis ---------- */
function showTitleAnim({ from, to, next }) {
    const ov = celebrationLayer('titleAnim', 'title-anim');
    const k = el('div', 'title-kulti');
    k.append(kultiEl('fier', 'kulti-blink kulti-float'));
    const small = el('small');
    small.textContent = 'Nouveau titre !';
    const flip = el('div', 'title-flip');
    const inner = el('div', 'title-flip-in');
    const old = el('div', 'title-face is-old');
    old.textContent = from;
    const neu = el('div', 'title-face is-new');
    neu.textContent = to;
    inner.append(old, neu);
    flip.append(inner);
    const nx = el('div', 'title-next');
    nx.textContent = next ? `Prochain : « ${next.name} » à ${next.xp.toLocaleString('fr-FR')} XP` : 'Tu as atteint le plus haut titre !';
    const btn = el('button', 'btn title-continue');
    btn.type = 'button';
    btn.textContent = 'Super !';
    btn.addEventListener('click', () => closeCelebrationLayer('titleAnim'));
    ov.append(k, small, flip, nx, btn);
    playSound('title');
    setTimeout(launchConfetti, 700);
}

/* ---------- Animation du jour de série (2026-10-27, choix de l'utilisateur : mélange C + A de apercu-serie.html) ----------
   Fond sombre, petites flammes qui montent, roulette RAPIDE de numéros au hasard qui ralentit et s'arrête sur la série,
   « 🔥 jours de série d'affilée ! », puis la semaine (jours joués cochés, case du jour qui s'allume). Une fois par jour.
   Son : tic-tic qui ralentit + « embrasement » ; trompettes en plus pour les caps (`STREAK_CAPS`, puis chaque 100). */
const STREAK_CAPS = [7, 30, 50, 100, 200, 365];
const isStreakCap = n => STREAK_CAPS.includes(n) || (n > 365 && n % 100 === 0);
const STREAK_SPIN_MS = 2300;
let streakTimers = [];
function showStreakAnim(streak) {
    if (!streak) return;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cap = isStreakCap(streak);
    let ov = $('streakAnim');
    if (!ov) {
        ov = el('div', 'streak-anim');
        ov.id = 'streakAnim';
        ov.setAttribute('role', 'dialog');
        ov.setAttribute('aria-label', 'Jour de série');
        document.body.append(ov);
    }
    streakTimers.forEach(clearTimeout);
    ov.replaceChildren();
    for (let i = 0; i < 14; i++) {   // petites flammes qui montent
        const f = el('img', 'streak-rise');
        f.src = 'emoji/1f525.svg';
        f.alt = '';
        f.style.left = `${5 + Math.random() * 85}%`;
        f.style.setProperty('--d', `${2 + Math.random() * 2}s`);
        f.style.setProperty('--w', `${Math.random() * 2}s`);
        ov.append(f);
    }
    const digits = el('div', `streak-digits${String(streak).length >= 4 ? ' is-long' : ''}`);
    const roll = el('div', 'streak-roll');
    // Plein de numéros au hasard (jusqu'à 2 × la série, au moins 99), jamais la série elle-même, puis la série
    const max = Math.max(99, streak * 2);
    const nums = reduced ? [] : Array.from({ length: 34 }, () => { let n; do n = 1 + Math.floor(Math.random() * max); while (n === streak); return n; });
    nums.push(streak);
    nums.forEach(n => { const sp = el('span'); sp.textContent = n; roll.append(sp); });
    digits.append(roll);
    const label = el('div', 'streak-label');
    label.textContent = streak === 1 ? '🔥 jour de série !' : '🔥 jours de série d’affilée !';
    const capLine = el('div', 'streak-cap');
    capLine.textContent = `🏆 Cap des ${streak} jours !`;
    capLine.hidden = !cap;
    const week = el('div', 'streak-week');
    const today = todayKey();
    const monday = weekStart();
    ['L', 'M', 'M', 'J', 'V', 'S', 'D'].forEach((name, i) => {
        const key = shiftDays(monday, i);
        const day = el('div', 'streak-day');
        const dot = el('div', 'streak-dot');
        if (key === today) {
            dot.classList.add('is-today');
            const fire = el('img');
            fire.src = 'emoji/1f525.svg';
            fire.alt = '';
            dot.append(fire);
            for (let k = 0; k < 8; k++) { const sp = el('i', 'streak-spark'); sp.style.setProperty('--a', `${k * 45}deg`); dot.append(sp); }
        } else if (key < today && state.data.frozenDays[key]) {
            dot.classList.add('is-frozen');
            dot.textContent = '🧊';
        } else if (key < today && state.data.activeDays[key] !== undefined) {
            dot.classList.add('is-done');
            dot.textContent = '✓';
        }
        const nm = el('span');
        nm.textContent = name;
        day.append(dot, nm);
        week.append(day);
    });
    const btn = el('button', 'btn streak-continue');
    btn.type = 'button';
    btn.textContent = 'Continuer';
    btn.addEventListener('click', closeStreakAnim);
    ov.append(digits, label, capLine, week, btn);
    ov.classList.remove('is-on', 'is-closing');
    ov.hidden = false;
    requestAnimationFrame(() => ov.classList.add('is-on'));
    const spin = reduced ? 0 : STREAK_SPIN_MS;
    const end = () => `translateY(${-(nums.length - 1) * roll.firstElementChild.offsetHeight}px)`;
    if (!reduced) {
        roll.animate([{ transform: 'translateY(0)' }, { transform: end() }],
            { duration: STREAK_SPIN_MS, easing: 'cubic-bezier(.12,.8,.22,1)', fill: 'forwards' });
    }
    playStreakSounds(cap, spin / 1000);
    streakTimers = [
        // À l'arrêt, toujours pile sur la série (même si l'animation a pris du retard)
        setTimeout(() => { roll.getAnimations().forEach(a => a.cancel()); roll.style.transform = end(); digits.classList.add('is-stopped'); }, spin),
        setTimeout(() => { label.classList.add('is-on'); capLine.classList.add('is-on'); }, spin + 150),
        setTimeout(() => { if (cap) launchConfetti(); }, spin + 200),
        setTimeout(() => week.classList.add('is-on'), spin + 450),
        setTimeout(() => { const t = week.querySelector('.is-today'); if (t) t.classList.add('is-lit'); }, spin + 950)
    ];
}
function closeStreakAnim() {
    const ov = $('streakAnim');
    if (!ov || ov.hidden) return;
    streakTimers.forEach(clearTimeout);
    ov.classList.add('is-closing');
    setTimeout(() => { ov.hidden = true; ov.classList.remove('is-on', 'is-closing'); ov.replaceChildren(); nextCelebration(); }, 250);
}

/** À l'ouverture de l'appli, après un ou plusieurs jours sans jouer : la série sera-t-elle sauvée ?
    Assez de gels → simple message ; pas assez (et rattrapable) → proposition d'acheter les gels manquants.
    Une seule fois par jour. */
async function checkStreakDanger(demo = null) {
    // `demo` (lien « ?demo=gel » ou « ?demo=gel-ok ») : faux chiffres, rien n'est enregistré ni acheté
    const data = demo ? { ...state.data, ...demo, inv: { ...state.data.inv, freeze: demo.freeze } } : state.data;
    if (!demo && (!data.onboarded || data.streak < 2 || data.streakWarnDay === todayKey() || !$('tour').hidden)) return;
    const missed = demo ? demo.missed : missedDays();
    if (missed <= 0 || missed === Infinity) return;
    const item = SHOP.find(i => i.id === 'freeze');
    const max = item.max || 5;
    if (missed > max) return;   // trop de jours manqués : impossible à rattraper
    if (!demo) {
        data.streakWarnDay = todayKey();
        saveData();
    }
    const days = plural(data.streak, 'jour', 'jours');
    if (data.inv.freeze >= missed) {
        await askConfirm({
            art: kultiEl('content', 'kulti-blink kulti-float'),
            title: '🧊 Ta série est protégée',
            text: `Tu as manqué ${plural(missed, 'jour', 'jours')}. ${plural(missed, 'gel de série sera utilisé', 'gels de série seront utilisés')} quand tu finiras une leçon : ta série de ${days} continue !
Il te restera ${plural(data.inv.freeze - missed, 'gel', 'gels')}.`,
            yes: 'Super !',
            no: null
        });
        return;
    }
    const need = missed - data.inv.freeze;
    const price = need * item.price;
    const enough = data.coins >= price;
    const ok = await askConfirm({
        art: kultiEl('inquiet', 'kulti-blink kulti-float'),
        title: '🔥 Ta série est en danger !',
        text: `Tu as manqué ${plural(missed, 'jour', 'jours')}. Il te manque ${plural(need, 'gel', 'gels')} de série pour sauver ta série de ${days}.\n`
            + (enough ? `Tu as ${data.coins} 🪙 : il t’en restera ${data.coins - price}. Termine ensuite une leçon pour la garder.`
                      : `Il faut ${price} 🪙, tu en as ${data.coins}. Gagne des pièces en jouant, puis achète un gel à la boutique avant ta prochaine leçon.`),
        yes: enough ? `Acheter · ${price} 🪙` : 'Compris',
        no: enough ? 'Tant pis' : 'Fermer'
    });
    if (demo) { if (ok && enough) showToast('🧪 Démo : rien n’a été acheté.'); return; }
    if (!ok || !enough || data.coins < price) return;
    data.coins -= price;
    data.inv.freeze += need;
    data.totals.purchases = (data.totals.purchases || 0) + 1;
    saveData();
    renderHeader();
    showToast(`🧊 ${plural(need, 'gel acheté', 'gels achetés')} : finis une leçon pour sauver ta série !`);
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
    return Object.values(map).sort((a, b) => byThemeName(a.theme, b.theme));
}

function badgeStats() {
    const d = state.data;
    // Les niveaux validés par le test de placement comptent aussi (depuis le 2026-10-20 : sinon le joueur placé est lésé)
    const doneLevels = Object.keys(d.done).map(Number).filter(n => d.done[n]);
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
        themeMastered: themeStats().some(t => t.total >= 5 && t.mastered === t.total),
        leagueWins: leagueWins(),
        themesComplete: completeThemes().length,
        shinyTheme: shinyThemes().length > 0,
        eventsWon: Object.keys(d.events || {}).filter(id => d.events[id].won)
    };
}

const BADGES = [
    { id: 'ev-halloween-2026', icon: '🎃', name: 'Halloween 2026', desc: 'Trouver 45 questions de la semaine d’Halloween 2026', event: 'halloween-2026',
      test: s => s.eventsWon.includes('halloween-2026') },
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
    { id: 'complete',  icon: '🗺️', name: 'Parcours complet',    desc: 'Terminer tous les niveaux',             test: s => s.mapComplete },

    // Ligue des amis
    { id: 'league1',   icon: '🥇', name: 'Premier de la ligue', desc: 'Finir une semaine 1er de la Ligue des amis', test: s => s.leagueWins >= 1 },
    { id: 'league5',   icon: '🏆', name: 'Champion des amis',   desc: 'Finir 5 semaines 1er de la Ligue des amis',  test: s => s.leagueWins >= 5 },
    { id: 'league10',  icon: '👑', name: 'Légende de la ligue', desc: 'Finir 10 semaines 1er de la Ligue des amis', test: s => s.leagueWins >= 10 },

    // Collection de cartes
    { id: 'collect1',  icon: '🃏', name: 'Collectionneur',      desc: 'Réunir toutes les cartes d’un thème',       test: s => s.themesComplete >= 1 },
    { id: 'collect5',  icon: '📚', name: 'Grand collectionneur', desc: 'Réunir toutes les cartes de 5 thèmes',     test: s => s.themesComplete >= 5 },
    { id: 'collectAll',icon: '💠', name: 'Collection parfaite', desc: 'Réunir toutes les cartes',            test: s => s.themesComplete >= CARD_THEMES.length },
    { id: 'shinyTheme',icon: '✨', name: 'Tout brille',         desc: 'Toutes les cartes d’un thème en brillantes (sauf la carte Maître)', test: s => s.shinyTheme }
];

/** Semaines terminées à la 1re place de la Ligue des amis. */
const leagueWins = () => Object.values(state.data.podium || {}).filter(place => place === 1).length;

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
    box.replaceChildren();   // le nouveau message remplace le précédent (sinon ils s'empilent, 2026-10-25)
    const toast = el('div', 'toast');
    toast.textContent = text;
    box.append(toast);
    toast.addEventListener('click', () => toast.remove());   // un tap le ferme
    setTimeout(() => toast.remove(), 2500);
}

/* ---------- Événements à thème (2026-10-23 : Halloween) ---------- */
// Pendant l'événement : parcours décoré, bandeau, sous-onglet dans Défis, sessions de 10 questions gratuites
// (evenements/<banque>.js), carte et badge à gagner seulement cette semaine-là. Démo : lien ?demo=<banque>.

const EVENTS = [{
    id: 'halloween-2026', bank: 'halloween', name: 'Halloween', title: 'Semaine d’Halloween', icon: '🎃',
    start: '2026-10-26', end: '2026-11-02', goal: 45, cls: 'event-halloween', tip: 'tipEventHalloween2026',
    // Dessins d'avatar gagnés en route (le dernier palier = l'objectif, avec la carte et le badge)
    rewards: [{ at: 10, emoji: '🎃' }, { at: 20, emoji: '🦇' }, { at: 30, emoji: '🧙' }, { at: 45, emoji: '💀' }],
    pumpkin: '🎃',
    // Missions de la semaine de l'événement (à la place des missions habituelles)
    missions: [
        { id: 'evFound',  icon: '🎃', goal: 15, text: n => `Trouve ${n} nouvelles questions d’Halloween` },
        { id: 'pumpkins', icon: '🎃', goal: 10, text: n => `Ramasse ${n} citrouilles cachées dans le jeu` },
        { id: 'evPlay',   icon: '👻', goal: 5,  text: n => `Termine ${n} parties d’Halloween` }
    ],
    decor: ['🎃', '👻', '🦇', '🕷️', '🕸️', '💀', '🧙', '🍬', '🌕', '⚰️'],
    card: { id: 'ev-halloween-2026', theme: 'Halloween 2026', icon: '🎃', name: 'Citrouille 2026', rarity: 'event',
            text: 'Gagnée pendant la semaine d’Halloween 2026.' }
}];
const EVENT_CARDS = EVENTS.map(e => e.card);
const EVENT_SIZE = 10;   // questions par session

function currentEvent() {
    let demo = null;
    try { demo = new URLSearchParams(location.search).get('demo'); } catch (err) { /* sans adresse */ }
    const today = todayKey();
    return EVENTS.find(e => demo === e.bank || demo === 'lundi' || BAC || (today >= e.start && today <= e.end)) || null;
}
const eventQuestions = ev => (window.EVENT_BANKS && window.EVENT_BANKS[ev.bank]) || [];
function eventData(ev) {
    const all = state.data.events;
    const ed = all[ev.id] || (all[ev.id] = { won: false });
    ed.found = ed.found || {};   // questions différentes trouvées : id -> 1
    return ed;
}
/** « 2 novembre » */
function shortDate(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

/** 10 questions : jamais vues d'abord, puis celles ratées (pas encore trouvées), puis les autres. */
function pickEventCards(ev) {
    const bank = eventQuestions(ev);
    const found = eventData(ev).found;
    const seen = q => !!state.data.stats[q.id];
    const fresh = shuffle(bank.filter(q => !seen(q) && !found[q.id]));
    const missed = shuffle(bank.filter(q => seen(q) && !found[q.id]));
    const rest = shuffle(bank.filter(q => found[q.id])).sort((a, b) => streakOf(a.id) - streakOf(b.id));
    const picked = [];
    for (const q of [...fresh, ...missed, ...rest]) if (picked.length < EVENT_SIZE && !picked.includes(q)) picked.push(q);
    return shuffle(picked).map(q => ({ q, review: seen(q) }));
}

/* Citrouilles cachées (2026-10-23) : 3 par jour pendant l'événement, chacune dans un onglet différent, toujours
   visibles sans faire défiler (posées en position fixe dans la marge de l'écran). Un tap = +5 🪙. */
const PUMPKINS_PER_DAY = 3;
const PUMPKIN_COINS = 5;
const PUMPKIN_SCREENS = ['mapScreen', 'challengesScreen', 'leagueScreen', 'shopScreen', 'profileScreen'];

function pumpkinData(ev) {
    const ed = eventData(ev);
    if (!ed.pumpkins || ed.pumpkins.day !== todayKey()) ed.pumpkins = { day: todayKey(), got: {}, total: ed.pumpkins?.total || 0 };
    return ed.pumpkins;
}
/** Les citrouilles du jour : { screen, side, y } (y = fraction de la hauteur libre). */
function pumpkinSpots(ev) {
    const seed = `pumpkins-${ev.id}-${todayKey()}`;
    return seededShuffle(PUMPKIN_SCREENS, seed).slice(0, PUMPKINS_PER_DAY).map((screen, i) => {
        const r = seededShuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], `${seed}-${i}`);
        return { screen, side: r[0] % 2 ? 'left' : 'right', y: 0.15 + r[1] * 0.06 };
    });
}
const pumpkinsLeft = ev => PUMPKINS_PER_DAY - Object.keys(pumpkinData(ev).got).length;

/** Pose (ou retire) la citrouille de l'onglet affiché. Appelé régulièrement : simple et sans oubli. */
function placePumpkins() {
    const ev = currentEvent();
    let pk = document.getElementById('pumpkin');
    const spot = ev ? pumpkinSpots(ev).find(sp => !$(sp.screen).hidden && !pumpkinData(ev).got[sp.screen]) : null;
    const covered = document.querySelector('.modal-overlay:not([hidden]), .tour:not([hidden]), .chest-overlay:not([hidden])') || $('topbar').hidden;
    if (!spot || covered) { if (pk) pk.remove(); return; }
    if (pk && pk.dataset.screen === spot.screen) return;
    if (pk) pk.remove();
    const screen = $(spot.screen);
    const current = spot.screen === 'mapScreen' ? document.querySelector('.node.is-current') : null;
    if (spot.screen === 'mapScreen' && !current) return;
    pk = el('button', `pumpkin is-${spot.side}`);
    pk.id = 'pumpkin';
    pk.type = 'button';
    pk.dataset.screen = spot.screen;
    pk.setAttribute('aria-label', 'Citrouille cachée');
    pk.append(emojiImg(ev.pumpkin));
    // Position dans la page (elle défile avec) : sur le parcours, à une hauteur d'écran au plus du niveau en cours ;
    // ailleurs, dans le haut de la page (au plus ~1,3 écran : un léger défilement peut suffire)
    let top;
    if (current) {
        const r = current.getBoundingClientRect();
        top = r.top + window.scrollY + (spot.y - 0.42) * window.innerHeight;
    } else {
        const r = screen.getBoundingClientRect();
        const room = Math.min(screen.scrollHeight, window.innerHeight * 1.3) - 160;
        top = r.top + window.scrollY + 60 + spot.y * Math.max(80, room);
    }
    pk.style.top = `${Math.round(top)}px`;
    pk.addEventListener('click', e => {
        e.stopPropagation();
        const pd = pumpkinData(ev);
        if (pd.got[spot.screen]) return;
        pd.got[spot.screen] = 1;
        pd.total = (pd.total || 0) + 1;
        state.data.coins += PUMPKIN_COINS;
        missionEvent('pumpkins');
        saveData();
        renderHeader();
        updateNavNotifications();
        playSound('win');
        pk.classList.add('is-caught');
        const left = pumpkinsLeft(ev);
        showToast(`🎃 Citrouille trouvée ! +${PUMPKIN_COINS} 🪙${left ? ` · encore ${left} aujourd’hui` : ' · toutes trouvées pour aujourd’hui'}`);
        setTimeout(() => pk.remove(), 600);
        if (challengesTab === 'event' && !$('challengesScreen').hidden) renderEvent();
    });
    document.body.append(pk);
}

/** Dessins d'avatar de l'événement débloqués par `total` questions trouvées → les nouveaux. */
function unlockEventAvatars(ev, total) {
    const d = state.data;
    const fresh = (ev.rewards || []).filter(r => total >= r.at && !d.avatarExtra.includes(r.emoji)).map(r => r.emoji);
    if (fresh.length) { d.avatarExtra.push(...fresh); d.avatarNew = true; }
    return fresh;
}

/** Décor, bandeau et sous-onglet selon l'événement en cours (appelé au lancement). */
function applyEventLook() {
    const ev = currentEvent();
    EVENTS.forEach(e => document.body.classList.toggle(e.cls, !!ev && ev.id === e.id));
    $('eventTab').hidden = !ev;
    if (ev) $('eventTab').textContent = `${ev.icon} ${ev.name}`;
}

function updateEventBanner() {
    const ev = currentEvent();
    const banner = $('eventBanner');
    banner.hidden = !ev || $('mapScreen').hidden;
    if (banner.hidden) return;
    banner.textContent = `${ev.icon} ${ev.title} · jusqu’au ${shortDate(ev.end)} · Jouer ›`;
    banner.style.top = `${Math.round($('topbar').getBoundingClientRect().bottom) + 8}px`;
}

/** Anecdote d'une icône du décor de l'événement. */
function showEventFact(badge) {
    const ev = currentEvent();
    const facts = ev && window.EVENT_BANKS ? window.EVENT_BANKS[`${ev.bank}Facts`] || [] : [];
    if (!facts.length) return;
    $('factTitle').textContent = `${ev.icon} ${ev.name}`;
    $('factText').textContent = facts[Number(badge.dataset.fact || 0) % facts.length].replace(/ ([»:!?])/g, ' $1');
    const bubble = $('factBubble');
    bubble.hidden = false;
    const r = badge.getBoundingClientRect();
    const top = r.bottom + 10 + bubble.offsetHeight < window.innerHeight - 90 ? r.bottom + 10 : r.top - 10 - bubble.offsetHeight;
    bubble.style.top = `${Math.max(70, top)}px`;
}

/** 1re visite de Défis pendant l'événement : une bulle sur son onglet (« Voir l'événement » y mène),
    puis une bulle sur sa carte (comment gagner la carte et le badge). */
function showEventTip() {
    const ev = currentEvent();
    const d = state.data;
    if (!ev || d[ev.tip] || !d.tipChallenges || !tipAllowed('challengesScreen')) return;
    if (challengesTab === 'event') { showEventPageTip(); return; }
    startTip(ev.tip, [{
        target: () => $('eventTab'),
        text: `${ev.icon} C’est la ${ev.title.charAt(0).toLowerCase()}${ev.title.slice(1)} ! Touche ici : des questions spéciales, qui ne coûtent pas de gouttes 💧, et une carte à gagner jusqu’au ${shortDate(ev.end)}.`
    }], 'Voir l’événement');
}
function showEventPageTip() {
    const ev = currentEvent();
    const d = state.data;
    if (!ev || d[`${ev.tip}Page`] || !tipAllowed('challengesScreen') || $('eventPage').hidden) return;
    startTip(`${ev.tip}Page`, [{
        target: () => document.querySelector('.event-card'),
        text: `🎁 Chaque question trouvée compte une fois. Une question ratée ne revient pas dans la session, mais dans une prochaine. Trouve ${ev.goal} questions différentes pour gagner la carte « ${ev.card.name} » et le badge ${ev.name} 2026 !`
    }]);
}

/** Sous-onglet de l'événement dans Défis. */
function renderEvent() {
    const page = $('eventPage');
    page.replaceChildren();
    const ev = currentEvent();
    if (!ev) return;
    const ed = eventData(ev);
    // Carte gagnée mais pas reçue (appli fermée pendant l'animation de fin) : on la donne maintenant
    if (ed.won && !state.data.cards[ev.card.id]) setTimeout(() => openCardBoxes([{ fixed: [ev.card] }], `${ev.icon} Carte ${ev.name} !`), 300);
    const card = el('article', 'card event-card');
    const h = el('h2');
    h.textContent = `${ev.icon} ${ev.title}`;
    const p = el('p');
    p.textContent = `Des sessions de ${EVENT_SIZE} questions frissonnantes. Elles ne coûtent pas de gouttes 💧 et il n’y a pas de cœurs. Jusqu’au ${shortDate(ev.end)}.`;
    const n = Math.min(Object.keys(ed.found).length, ev.goal);
    const meter = el('div', 'meter');
    const fill = el('div', 'meter-fill');
    fill.style.width = `${Math.round((n / ev.goal) * 100)}%`;
    meter.append(fill);
    const count = el('p', 'event-count');
    count.textContent = `${n} / ${ev.goal} questions trouvées (sur ${eventQuestions(ev).length})`;
    // Paliers : dessins d'avatar à gagner (grisés tant qu'ils ne sont pas gagnés)
    const steps = el('div', 'event-steps');
    for (const r of ev.rewards || []) {
        const got = state.data.avatarExtra.includes(r.emoji);
        const st = el('div', `event-step${got ? ' is-got' : ''}`);
        const lab = el('span');
        lab.textContent = got ? '✓' : String(r.at);
        st.append(emojiImg(r.emoji), lab);
        steps.append(st);
    }
    const stepsText = el('p', 'event-steps-text');
    stepsText.textContent = '🎨 Des emojis d’avatar à gagner en route, gardés pour toujours.';
    const left = pumpkinsLeft(ev);
    const pumpkins = el('p', 'event-pumpkins');
    pumpkins.textContent = left
        ? `🎃 Citrouilles du jour : ${PUMPKINS_PER_DAY - left}/${PUMPKINS_PER_DAY} · cachées dans les onglets du jeu (+${PUMPKIN_COINS} 🪙 chacune)`
        : `🎃 Citrouilles du jour : ${PUMPKINS_PER_DAY}/${PUMPKINS_PER_DAY} · reviens demain !`;
    const reward = el('div', 'event-reward');
    const face = cardFace(ev.card, false, false);
    const rtext = el('p');
    rtext.textContent = ed.won
        ? '✅ Carte gagnée ! Elle est dans ta collection, et le badge dans ton profil.'
        : `🎁 Trouve ${ev.goal} questions différentes : la carte « ${ev.card.name} » et le badge ${ev.name} 2026. Seulement cette semaine !`;
    reward.append(face, rtext);
    const actions = el('div', 'card-actions');
    const btn = el('button', 'btn btn-green');
    btn.type = 'button';
    btn.textContent = ed.won ? 'Rejouer pour le plaisir' : 'Jouer';
    btn.addEventListener('click', openEventStart);
    actions.append(btn);
    card.append(h, p, meter, count, steps, stepsText, reward, pumpkins, actions);
    page.append(card);
    const friends = renderEventFriends(ev, n);
    if (friends) page.append(friends);
}

let eventFriendsOpen = false;
/** Où en sont mes amis : les 3 meilleurs (+ moi si plus loin), « Voir tous » pour la liste complète. */
function renderEventFriends(ev, mine) {
    if (!cloudUser || !league?.pseudo || !league.friends?.length) return null;
    const rows = league.friends
        .filter(f => f.summary?.event?.id === ev.id && f.summary.event.found > 0)
        .map(f => ({ f, found: Math.min(f.summary.event.found, ev.goal) }));
    rows.push({ me: true, found: mine });
    rows.sort((a, b) => b.found - a.found || (a.me ? -1 : b.me ? 1 : 0));
    const card = el('article', 'card event-friends');
    const h = el('h2');
    h.textContent = '👥 Tes amis';
    card.append(h);
    if (rows.length === 1) {
        const p = el('p', 'event-friends-empty');
        p.textContent = 'Aucun ami n’a encore joué à l’événement.';
        card.append(p);
        return card;
    }
    const SHOW = 3;
    let shown = rows.map((r, i) => ({ ...r, rank: i + 1 }));
    const hidden = shown.length - SHOW;
    if (!eventFriendsOpen && hidden > 0) {
        const meRow = shown.find(r => r.me);
        shown = shown.slice(0, SHOW);
        if (meRow.rank > SHOW) shown.push(meRow);
    }
    const list = el('ol', 'event-friends-list');
    for (const r of shown) {
        const li = el('li', r.me ? 'is-me' : '');
        const rank = el('span', 'event-rank');
        rank.textContent = String(r.rank);
        const name = el('span', 'event-friend-name');
        name.textContent = r.me ? 'Toi' : r.f.pseudo;
        const score = el('span', 'event-friend-score');
        score.textContent = r.found >= ev.goal ? `${ev.goal}/${ev.goal} 🏆` : `${r.found}/${ev.goal}`;
        const av = r.me ? avatarEl(myAvatarName(), state.data.avatar) : avatarEl(r.f.pseudo, r.f.look);
        if (!r.me) li.addEventListener('click', () => openFriendProfile(r.f));
        li.append(rank, av, name, score);
        list.append(li);
    }
    card.append(list);
    if (hidden > 0) {
        const more = el('button', 'link-btn event-friends-more');
        more.type = 'button';
        more.textContent = eventFriendsOpen ? 'Voir moins' : `Voir tous (${rows.length}) ›`;
        more.addEventListener('click', () => { eventFriendsOpen = !eventFriendsOpen; renderEvent(); });
        card.append(more);
    }
    return card;
}

/** Fenêtre de départ de l'événement (comme pour les autres modes, 2026-10-25). */
function openEventStart() {
    const ev = currentEvent();
    if (!ev) return;
    const n = Math.min(Object.keys(eventData(ev).found).length, ev.goal);
    state.pendingMode = 'event';
    state.pendingLevel = null;
    $('modalTitle').textContent = `${ev.icon} ${ev.title}`;
    $('modalDesc').textContent = eventData(ev).won ? 'Pour le plaisir : la carte est déjà à toi !' : `${n} / ${ev.goal} questions trouvées pour la carte.`;
    $('modalStatsText').textContent = `${EVENT_SIZE} questions · sans gouttes 💧 ni cœurs`;
    $('modalCost').hidden = true;
    showModal(false);
}

/** Fin d'une session de l'événement : progression, carte gagnée. */
function endEvent() {
    const ev = EVENTS.find(e => e.id === state.eventId) || currentEvent();
    const ed = eventData(ev);
    const right = (state.eventIds || []).filter(id => !state.failedIds.has(id));
    const before = Object.keys(ed.found).length;
    right.forEach(id => { ed.found[id] = 1; });
    const total = Object.keys(ed.found).length;
    const won = !ed.won && total >= ev.goal;
    if (won) ed.won = true;
    if (total > before) missionEvent('evFound', total - before);
    missionEvent('evPlay');
    const drawings = unlockEventAvatars(ev, total);
    const drawingsText = drawings.length ? `🎨 Nouvel emoji d’avatar débloqué : ${drawings.join(' ')} ! (Profil → ton avatar)` : '';
    saveData();
    checkBadges();
    setEnd({
        emoji: won ? '🏆' : ev.icon,
        title: won ? 'Carte gagnée !' : `${ev.icon} ${ev.name}`,
        text: won ? `Tu as gagné la carte « ${ev.card.name} » et le badge ${ev.name} 2026 !`
            : `${right.length} trouvées sur ${state.total}${total > before ? ` (+${total - before} nouvelles)` : ''} · ${Math.min(total, ev.goal)} / ${ev.goal} questions trouvées pour la carte`,
        stats: [statXp(), statAccuracy(), statTime()],
        extra: [drawingsText, rewardSummary()].filter(Boolean).join('\n'),
        primary: 'Rejouer',
        primaryClass: 'btn-green',
        onPrimary: () => startSession('event'),
        secondary: 'Retour',
        onSecondary: () => { returnToMap(); setChallengesTab('event'); }
    });
    if (won) {
        launchConfetti(CARD_CONFETTI.event);
        setTimeout(() => openCardBoxes([{ fixed: [ev.card] }], `${ev.icon} Carte ${ev.name} !`), 900);
    }
}

/* ---------- Missions de la semaine (2026-10-23) ---------- */
// 3 missions par semaine, les mêmes pour tout le monde (tirage avec la date du lundi comme graine).
// 30 🪙 par mission réussie, et un coffre de 3 cartes (dont une rare) quand les 3 sont récupérées.

const MISSION_COINS = 30;
const MISSION_POOL = [
    { id: 'levels',   icon: '🗺️', goal: 5,  text: n => `Réussis ${n} niveaux du parcours` },
    { id: 'flawless', icon: '✨', goal: 2,  text: n => `Réussis ${n} niveaux sans faute` },
    { id: 'order',    icon: '⏳', goal: 2,  text: n => `Réussis ${n} niveaux de frises` },
    { id: 'pairs',    icon: '🔗', goal: 2,  text: n => `Réussis ${n} niveaux de paires` },
    { id: 'daily',    icon: '📅', goal: 4,  text: n => `Joue ${n} défis du jour` },
    { id: 'correct',  icon: '✅', goal: 60, text: n => `Donne ${n} bonnes réponses` },
    { id: 'theme',    icon: '🎓', goal: 12, text: (n, theme) => `Donne ${n} bonnes réponses en ${theme}` },
    { id: 'training', icon: '🎯', goal: 3,  text: n => `Termine ${n} entraînements` },
    { id: 'reviews',  icon: '🔁', goal: 3,  text: n => `Termine ${n} révisions` },
    { id: 'sprint',   icon: '⚡', goal: 12, text: n => `Fais ${n} bonnes réponses en un seul sprint`, max: true },
    { id: 'days',     icon: '🔥', goal: 5,  text: n => `Joue ${n} jours différents cette semaine` }
];

/** Les 3 missions de la semaine en cours (et le thème de la mission « thème »). */
function weekMissions() {
    const week = weekStart();
    const ev = currentEvent();
    if (ev?.missions && week === ev.start) return ev.missions.map(m => ({ ...m, theme: null }));
    const picked = seededShuffle(MISSION_POOL, `missions-${week}`).slice(0, 3);
    const themes = THEME_DECOR.map(t => t.theme).filter(t => t !== 'Drapeaux' && t !== 'Monuments');
    const theme = seededShuffle(themes, `missions-theme-${week}`)[0];
    return picked.map(m => ({ ...m, theme: m.id === 'theme' ? theme : null,
        icon: m.id === 'theme' ? (THEME_DECOR.find(t => t.theme === theme) || {}).icon || m.icon : m.icon }));
}

/** Progression de la semaine (remise à zéro chaque lundi). */
function missionData() {
    const d = state.data;
    const week = weekStart();
    if (!d.missions || d.missions.week !== week) d.missions = { week, progress: {}, claimed: {}, chest: false };
    return d.missions;
}

function missionProgress(m) {
    if (m.id === 'days') {
        const week = weekStart();
        let n = 0;
        for (let i = 0; i < 7; i++) if (state.data.activeDays[shiftDays(week, i)]) n++;
        return Math.min(m.goal, n);
    }
    return Math.min(m.goal, missionData().progress[m.id] || 0);
}

/** Quelque chose qui compte pour une mission vient d'arriver (sauvegardé avec le reste de la partie). */
function missionEvent(type, amount = 1, theme = null) {
    const md = missionData();
    for (const m of weekMissions()) {
        if (m.id !== type || (m.theme && m.theme !== theme)) continue;
        const before = missionProgress(m);
        if (before >= m.goal) continue;
        md.progress[m.id] = m.max ? Math.max(md.progress[m.id] || 0, amount) : (md.progress[m.id] || 0) + amount;
        if (missionProgress(m) >= m.goal) (state.missionsJustDone = state.missionsJustDone || []).push(m);
    }
}

/** Récompenses à prendre (missions finies non récupérées, + le coffre des 3). */
function missionsToClaim() {
    const md = missionData();
    const list = weekMissions();
    const ready = list.filter(m => missionProgress(m) >= m.goal && !md.claimed[m.id]).length;
    const chest = list.every(m => md.claimed[m.id]) && !md.chest ? 1 : 0;
    return ready + chest;
}

/** Ligne compacte sous l'objectif du jour : 🗓️ Missions de la semaine ●●○ 2/3 › */
function renderMissionsRow() {
    const row = $('missionsRow');
    const list = weekMissions();
    const done = list.filter(m => missionProgress(m) >= m.goal).length;
    const dots = list.map(m => missionProgress(m) >= m.goal ? '●' : '○').join('');
    const label = el('span', 'missions-label');
    label.textContent = '🗓️ Missions de la semaine';
    const right = el('span', 'missions-dots');
    right.textContent = `${dots} ${done}/${list.length} ›`;
    row.replaceChildren(label, right);
    const n = missionsToClaim();
    if (n > 0) row.setAttribute('data-notif', n);
    else row.removeAttribute('data-notif');
}

/** Fenêtre des missions : progression, récompenses, coffre des 3. */
function openMissionsModal() {
    const body = $('missionsList');
    body.replaceChildren();
    const md = missionData();
    const list = weekMissions();
    for (const m of list) {
        const p = missionProgress(m);
        const item = el('div', `mission${p >= m.goal ? ' is-done' : ''}`);
        const top = el('div', 'mission-top');
        const name = el('span', 'mission-name');
        name.textContent = `${m.icon} ${m.text(m.goal, m.theme)}`;
        const count = el('span', 'mission-count');
        count.textContent = `${p}/${m.goal}`;
        top.append(name, count);
        const bar = el('div', 'meter');
        const fill = el('div', 'meter-fill');
        fill.style.width = `${Math.round((p / m.goal) * 100)}%`;
        bar.append(fill);
        item.append(top, bar);
        if (p >= m.goal) {
            if (md.claimed[m.id]) {
                const ok = el('p', 'mission-claimed');
                ok.textContent = `✓ +${MISSION_COINS} 🪙 récupérées`;
                item.append(ok);
            } else {
                const btn = el('button', 'btn btn-green btn-small');
                btn.type = 'button';
                btn.textContent = `🎁 Récupérer +${MISSION_COINS} 🪙`;
                btn.addEventListener('click', () => {
                    md.claimed[m.id] = true;
                    state.data.coins += MISSION_COINS;
                    saveData();
                    renderHeader();
                    renderMissionsRow();
                    openMissionsModal();
                    playSound('win');
                });
                item.append(btn);
            }
        }
        body.append(item);
    }
    const all = list.every(m => md.claimed[m.id]);
    const chest = el('div', `mission-chest${md.chest ? ' is-open' : ''}`);
    if (md.chest) chest.textContent = '🎁 Coffre de la semaine ouvert. Nouvelles missions lundi !';
    else if (all) {
        const btn = el('button', 'btn btn-violet btn-full');
        btn.type = 'button';
        btn.textContent = '🎁 Ouvrir le coffre de la semaine';
        btn.addEventListener('click', () => {
            md.chest = true;
            saveData();
            $('missionsModal').hidden = true;
            renderMissionsRow();
            updateNavNotifications();
            const drop = avChestDrop();
            openCardBoxes([{ size: drop ? 2 : 3, rare: true }], '🗓️ Coffre des missions', drop);
        });
        chest.append(btn);
    } else {
        chest.textContent = `🎁 Les 3 missions réussies : un coffre de 3 cartes en plus.${avChestLine()}`;
    }
    body.append(chest);
    const days = 7 - ((new Date().getDay() + 6) % 7);   // jours restants, lundi compris
    $('missionsWhen').textContent = days <= 1 ? 'Nouvelles missions demain.' : `Nouvelles missions dans ${days} jours (lundi).`;
    $('missionsModal').hidden = false;
}

/* ---------- Défi du jour ---------- */

/** Les mêmes 10 questions pour tout le monde un jour donné (graine = la date). */
/* Toutes les questions du jeu (parcours + entraînement, ~3 000) depuis le 2026-10-25, pour le défi du jour et le sprint.
   Liste FIGÉE (ids du parcours < 4000, entraînement x001-x150) : ajouter des questions ne change pas un défi passé.
   Avant le 25/10 : parcours seul (les défis déjà joués gardent leurs questions). */
const DAILY_ALL_FROM = '2026-10-25';
function allQuestionsPool() {
    const training = (typeof TRAINING_QUESTIONS === 'undefined' ? [] : TRAINING_QUESTIONS)
        .filter(q => q.id >= 10000 && q.id < 30000 && q.id % 1000 <= 150);
    return QUESTIONS.filter(q => q.id < 4000).concat(training);
}
function dailyQuestions(day) {
    const pool = day >= DAILY_ALL_FROM ? allQuestionsPool() : QUESTIONS;
    const sorted = [...pool].sort((a, b) => a.id - b.id);
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
// Thèmes rangés par ordre alphabétique à l'écran (2026-10-26, Entraînement, Profil → Thèmes, collection)
const byThemeName = (a, b) => a.localeCompare(b, 'fr');
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
        const ev = currentEvent();
        if (ev) {   // événement en cours : tout le décor à son thème, avec ses anecdotes
            badge.textContent = ev.decor[(i * 7 + 3) % ev.decor.length];
            badge.dataset.event = ev.id;
            badge.dataset.fact = String(i);
        } else {
            const entry = THEME_DECOR[(i * 7 + 3) % THEME_DECOR.length];
            badge.textContent = entry.icon;
            badge.dataset.theme = entry.theme;
            badge.dataset.fact = String(seen[entry.theme] = (seen[entry.theme] ?? -1) + 1);
        }
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
    if (name !== 'league') listsOpen.clear();               // « Voir tous » refermés en quittant l'onglet
    if (name !== 'challenges') eventFriendsOpen = false;
    $('mapScreen').hidden = name !== 'map';
    $('challengesScreen').hidden = name !== 'challenges';
    $('leagueScreen').hidden = name !== 'league';
    $('shopScreen').hidden = name !== 'shop';
    $('profileScreen').hidden = name !== 'profile';
    $('studyScreen').hidden = name !== 'study';
    $('onboardScreen').hidden = name !== 'onboard';
    if (name === 'challenges' && !state.data.tipChallenges) setTimeout(showChallengesTip, 500);
    if (name === 'challenges') setTimeout(showEventTip, 700);
    if (name === 'profile' && !state.data.tipProfile) setTimeout(showProfileTip, 500);
    if (name === 'league' && !state.data.tipLeague) setTimeout(showLeagueTip, 900);
    $('topbar').hidden = !MAIN_SCREENS.includes(name);
    updateEventBanner();

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
    if (name === 'challenges') { window.scrollTo(0, 0); renderChallenges(); setChallengesTab(challengesTab); leagueLoad(); }
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
    const cardsTab = document.querySelector('.profile-tab[data-tab="cards"]');
    const shinies = pendingShinyCount();   // cartes à 3/3 à rendre brillantes
    const setNotif = (target, n) => n > 0 ? target.setAttribute('data-notif', n) : target.removeAttribute('data-notif');
    const avNew = avOn() ? avReadyCount : (data.avatarNew ? 1 : 0);
    setNotif(profileBtn, unclaimedBadges + shinies + avNew + recapUnseen());
    setNotif($('avatarBtn'), avNew);
    setNotif(document.querySelector('.nav-btn[data-screen="shop"]'), avOn() && data.vitrineSeen !== weekStart() ? 1 : 0);
    setNotif(badgesTab, unclaimedBadges);
    setNotif(cardsTab, shinies);
    
    // 2. Vérifier si l'objectif du jour est en attente de récupération (pour l'onglet Défis)
    let unclaimedGoals = 0;
    const xp = dayXpNow();
    if (xp >= data.goal && !data.claimedGoals[todayKey()]) {
        unclaimedGoals = 1;
    }
    
    unclaimedGoals += missionsToClaim();
    const challengesBtn = document.querySelector('.nav-btn[data-screen="challenges"]');
    if (unclaimedGoals > 0) challengesBtn.setAttribute('data-notif', unclaimedGoals);
    else challengesBtn.removeAttribute('data-notif');

    // 3. Demandes d'amis reçues (onglet Classement)
    const requests = (cloudUser && league?.userId === cloudUser.id ? league.incoming.length + duelsBadge() : 0) + (leagueRecapPending() ? 1 : 0);
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
    $('streakDisplay').textContent = currentStreak();
    $('coinDisplay').textContent = state.data.coins;
    renderDrops();
    
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

/* ---------- Gouttes 💧 ---------- */
// Chaque niveau du parcours coûte 1 goutte au lancement (réussi ou raté). +1 par heure (calculé avec
// l'heure de départ : marche appli fermée), +1 par révision / entraînement réussi à moitié (3 par jour).

/** Ajoute les gouttes rechargées depuis la dernière fois. */
function syncDrops() {
    const d = state.data;
    if (d.drops >= DROPS_MAX) { d.drops = DROPS_MAX; d.dropsAt = 0; return; }
    const now = Date.now();
    if (!d.dropsAt || d.dropsAt > now) d.dropsAt = now;   // pas d'heure (ou horloge reculée) : on repart de maintenant
    const gained = Math.floor((now - d.dropsAt) / DROP_MS);
    if (gained <= 0) return;
    d.drops = Math.min(DROPS_MAX, d.drops + gained);
    d.dropsAt = d.drops >= DROPS_MAX ? 0 : d.dropsAt + gained * DROP_MS;
    saveData();
}

/** Temps avant la prochaine goutte, en millisecondes (0 si plein). */
function nextDropMs() {
    syncDrops();
    const d = state.data;
    return d.drops >= DROPS_MAX ? 0 : Math.max(0, d.dropsAt + DROP_MS - Date.now());
}

/** « 1 h 12 », « 47 min », « 30 s ». */
function formatWait(ms) {
    const min = Math.ceil(ms / 60000);
    if (ms < 60000) return `${Math.max(1, Math.ceil(ms / 1000))} s`;
    if (min < 60) return `${min} min`;
    return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`;
}

function renderDrops() {
    syncDrops();
    const n = state.data.drops;
    $('dropDisplay').textContent = n;
    $('dropChip').classList.toggle('is-empty', n === 0);
}

/** Retire la goutte d'un niveau du parcours. Renvoie false s'il n'y en a plus. */
function spendDrop() {
    syncDrops();
    const d = state.data;
    if (d.drops <= 0) return false;
    if (d.drops >= DROPS_MAX) d.dropsAt = Date.now();   // la recharge commence
    d.drops--;
    saveData();
    renderDrops();
    return true;
}

function addDrops(n) {
    syncDrops();
    const d = state.data;
    d.drops = Math.min(DROPS_MAX, d.drops + n);
    if (d.drops >= DROPS_MAX) d.dropsAt = 0;
    saveData();
    renderDrops();
}

/** Avant une révision / un entraînement : la goutte à gagner (rien si plein ou 3 déjà gagnées aujourd'hui). */
function dropBonusText() {
    const d = state.data;
    syncDrops();
    const earned = d.dropsDay === todayKey() ? d.dropsEarned : 0;
    if (d.drops >= DROPS_MAX || earned >= DROPS_PRACTICE_DAY) return '';
    return '💧 +1 goutte si tu en réussis la moitié';
}

/** Fin d'une révision ou d'un entraînement : +1 goutte si au moins la moitié de bonnes réponses du premier coup.
    Renvoie la ligne à afficher sous le récap (ou ''). */
function earnPracticeDrop() {
    const d = state.data;
    syncDrops();
    if (d.drops >= DROPS_MAX) return '';
    const today = todayKey();
    if (d.dropsDay !== today) { d.dropsDay = today; d.dropsEarned = 0; }
    if (d.dropsEarned >= DROPS_PRACTICE_DAY) return `💧 Déjà ${DROPS_PRACTICE_DAY} gouttes gagnées en t’entraînant aujourd’hui.`;
    const need = Math.ceil(state.total / 2);
    const right = state.total - state.failedIds.size;   // bonnes réponses du premier coup
    if (right < need) return `Encore un effort : ${plural(need, 'bonne réponse', 'bonnes réponses')} pour gagner une goutte 💧`;
    d.dropsEarned++;
    addDrops(1);
    return `+1 💧 (${d.drops}/${DROPS_MAX})`;
}

let dropsTimerId = null;
/** Fenêtre des gouttes : nombre, temps avant la prochaine, et comment en regagner. */
function openDropsModal() {
    const d = state.data;
    const draw = () => {
        const n = (syncDrops(), d.drops);
        const row = $('dropsRow');
        row.replaceChildren();
        for (let i = 0; i < DROPS_MAX; i++) {
            const s = el('span', i < n ? '' : 'is-off');
            s.textContent = '💧';
            row.append(s);
        }
        $('dropsTitle').textContent = n === 0 ? '💧 Plus de gouttes !' : `💧 Tes gouttes : ${n}/${DROPS_MAX}`;
        $('dropsTimer').textContent = n >= DROPS_MAX ? 'C’est le plein !' : `Prochaine goutte dans ${formatWait(nextDropMs())}`;
        const today = todayKey();
        const left = DROPS_PRACTICE_DAY - (d.dropsDay === today ? d.dropsEarned : 0);
        $('dropsText').textContent = '1 goutte par nouveau niveau · +1 par heure';
        const practice = n < DROPS_MAX && left > 0;
        $('dropsEarn').hidden = n >= DROPS_MAX;
        $('dropsEarn').textContent = left > 0
            ? `🎁 Réussis une révision ou un entraînement : +1 💧 (encore ${plural(left, 'fois', 'fois')} aujourd’hui)`
            : `✅ Tes ${DROPS_PRACTICE_DAY} gouttes bonus du jour sont gagnées.`;
        $('dropsTrainBtn').hidden = !practice;
        $('dropsReviewBtn').hidden = !practice || missedCards().length === 0;
        $('dropsRefillBtn').hidden = n >= DROPS_MAX;
        $('dropsRefillBtn').textContent = `Recharger · ${DROPS_REFILL_PRICE} 🪙`;
        $('dropsRefillBtn').disabled = d.coins < DROPS_REFILL_PRICE;
    };
    draw();
    clearInterval(dropsTimerId);
    dropsTimerId = setInterval(() => { if ($('dropsModal').hidden) clearInterval(dropsTimerId); else draw(); }, 1000);
    $('dropsModal').hidden = false;
}

function closeDropsModal() {
    $('dropsModal').hidden = true;
    clearInterval(dropsTimerId);
}

/** Recharge complète (boutique ou fenêtre des gouttes). */
function refillDrops() {
    const d = state.data;
    syncDrops();
    if (d.drops >= DROPS_MAX || d.coins < DROPS_REFILL_PRICE) return false;
    d.coins -= DROPS_REFILL_PRICE;
    d.totals.purchases++;
    addDrops(DROPS_MAX);
    renderHeader();
    showToast(`💧 Gouttes rechargées : ${DROPS_MAX}/${DROPS_MAX} !`);
    checkBadges();
    return true;
}

/** Quitte la fin de leçon si besoin, puis va à l'entraînement ou lance les révisions. */
function dropsGo(where) {
    closeDropsModal();
    if (!$('studyScreen').hidden) returnToMap();
    if (where === 'review') openReviewModal();
    else { showScreen('challenges'); setChallengesTab('training'); }
}

/** 1re fois qu'une goutte est dépensée : petite explication sur le compteur. */
function showDropsTip() {
    const d = state.data;
    if (d.tipDrops || d.drops >= DROPS_MAX || !d.tourDone || !tipAllowed('mapScreen')) return;
    startTip('tipDrops', [{
        target: () => $('dropChip'),
        text: '💧 Tes gouttes : chaque nouveau niveau du parcours en coûte une (refaire un niveau réussi est gratuit). Elles se rechargent toutes seules (1 par heure), ou en réussissant une révision ou un entraînement. Touche-les pour voir le temps restant.'
    }]);
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
        li.dataset.level = String(n);
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
            const num = el('span', 'node-num');   // le numéro du niveau, en petit dans le coin (2026-10-25)
            num.textContent = String(n);
            btn.append(num);
        } else {
            btn.textContent = String(n);   // verrouillé : le numéro reste visible, le cadenas passe dans le coin
        }
        if (locked) {
            const lock = el('span', 'node-lock');
            lock.textContent = '🔒';
            btn.append(lock);
        }
        if (done) {   // niveau terminé : son numéro reste lisible, la coche passe dans le coin
            const check = el('span', 'node-check');
            check.textContent = '✓';
            btn.append(check);
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

    renderMapFriends();
    placeMapKulti();
    if (focusNode) focusNode.scrollIntoView({ block: 'center' });
    setTimeout(updateToCurrentBtn, 50);
    if (!state.data.tipChest && readyChests().length) maybeShowChestTip();
    else if (!state.data.tipReviews && currentReviewsLabel()) maybeShowReviewsTip();
}

/* ---------- 2 · Kulti sur le parcours (2026-10-27) ----------
   Assis à côté du niveau en cours, du côté du MILIEU de l'écran (les décors à anecdotes sont dans les marges) ;
   un ami au même niveau se met de l'autre côté. Le soir (20 h et plus) sans avoir joué : il dort. Fêtes : chapeau.
   Tap = une petite phrase (dans la bulle des anecdotes). */
let kultiSayIdx = 0;
const kultiSleepy = () => new Date().getHours() >= 20 && state.data.lastDay !== todayKey();
function placeMapKulti() {
    document.querySelectorAll('.map-kulti').forEach(k => k.remove());
    document.querySelectorAll('.stop.has-kulti-right').forEach(s => s.classList.remove('has-kulti-right'));
    const n = Math.min(state.data.unlocked, MAX_LEVEL);
    const stop = document.querySelector(`.stop[data-level="${n}"]`);
    if (!stop) return;
    const right = (parseFloat(stop.style.getPropertyValue('--x')) || 0) <= 0;   // niveau à gauche (ou au milieu) → Kulti à droite
    const sleepy = kultiSleepy();
    const ev = currentEvent();
    const btn = el('button', `map-kulti ${right ? 'is-right' : 'is-left'}`);
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Kulti, la mascotte');
    btn.append(kultiEl(sleepy ? 'dort' : ev ? 'clin' : 'content', sleepy ? '' : 'kulti-blink kulti-float', false, ev ? ev.bank : null));
    if (sleepy) {
        const z = el('span', 'map-kulti-zzz');
        z.innerHTML = '<i>Z</i><i>z</i><i>z</i>';
        btn.append(z);
    }
    btn.addEventListener('click', e => { e.stopPropagation(); kultiSay(btn); });
    if (right) stop.classList.add('has-kulti-right');
    stop.append(btn);
}
function kultiLines() {
    const d = state.data, streak = currentStreak();
    if (kultiSleepy()) return [streak > 0 ? `Zzz… Ta série de ${plural(streak, 'jour', 'jours')} t’attend… 🔥` : 'Zzz… Un petit niveau avant de dormir ?', 'Un petit niveau avant de dormir ?'];
    const lines = [`Allez, le niveau ${Math.min(d.unlocked, MAX_LEVEL)} t’attend !`];
    const xp = dayXpNow();
    lines.push(xp < d.goal ? `Plus que ${d.goal - xp} XP pour ton objectif du jour 🎯` : 'Objectif du jour atteint, bravo ! 🎯');
    if (streak >= 2) lines.push(`Tu es sur une série de ${plural(streak, 'jour', 'jours')} 🔥`);
    const ev = currentEvent();
    if (ev) lines.push(`${ev.icon} L’événement ${ev.name} t’attend dans Défis !`);
    const themes = typeof THEME_FACTS !== 'undefined' ? Object.keys(THEME_FACTS) : [];
    if (themes.length) {
        const facts = THEME_FACTS[themes[Math.floor(Math.random() * themes.length)]];
        if (facts && facts.length) lines.push(`Le savais-tu ? ${facts[Math.floor(Math.random() * facts.length)]}`);
    }
    return lines;
}
function kultiSay(btn) {
    const lines = kultiLines();
    $('factTitle').textContent = '🧠 Kulti';
    $('factText').textContent = lines[kultiSayIdx++ % lines.length].replace(/« /g, '« ').replace(/ ([»:!?])/g, ' $1');
    const bubble = $('factBubble');
    bubble.hidden = false;
    const r = btn.getBoundingClientRect();
    const top = r.bottom + 10 + bubble.offsetHeight < window.innerHeight - 90 ? r.bottom + 10 : r.top - 10 - bubble.offsetHeight;
    bubble.style.top = `${Math.max(70, top)}px`;
    playSound('tap');
}

/* ---------- 7 · Ton mois sur Kultivo (2026-10-27) ----------
   Le 1er du mois : récap du mois passé, en « stories ». Bouton violet dans l'en-tête du Profil (sous l'XP), pastille rouge
   tant qu'il n'est pas vu, puis encore 7 jours ; pour toujours dans Records → « 📅 Mes récaps du mois ». */
const MONTH_NAMES = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
function monthKeyOf(key) { return key.slice(0, 7); }   // fonctions déclarées (pas « const ») : utilisées dès le chargement de la sauvegarde
const monthName = m => MONTH_NAMES[Number(m.slice(5, 7)) - 1];
const monthOf = m => (/^[aeiouéèêh]/.test(monthName(m)) ? 'd’' : 'de ') + monthName(m);   // « d’octobre », « de mars »
function shiftMonth(m, k) { const d = new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)) - 1 + k, 1); return dayKey(d).slice(0, 7); }
function monthStat(m = monthKeyOf(todayKey()), data = state.data) {
    const all = data.monthStats;
    if (!all[m]) all[m] = { answers: 0, right: 0, themes: {}, missed: {}, cards: 0, bigCards: 0 };
    return all[m];
}
var QUESTION_INDEX = null;   // « var » : la sauvegarde est lue (normalizeData) avant cette ligne
function anyQuestion(id) {
    if (!QUESTION_INDEX) {
        QUESTION_INDEX = new Map();
        const banks = [QUESTIONS, typeof TRAINING_QUESTIONS === 'undefined' ? [] : TRAINING_QUESTIONS,
            ...Object.values(window.EVENT_BANKS || {}).filter(Array.isArray)];
        banks.forEach(list => list.forEach(q => QUESTION_INDEX.set(q.id, q)));
    }
    return QUESTION_INDEX.get(Number(id)) || null;
}
function noteMonthAnswer(id, ok, data = state.data) {
    const ms = monthStat(undefined, data);
    ms.answers++;
    if (ok) ms.right++;
    const q = anyQuestion(id);
    if (q) { const t = ms.themes[q.theme] || (ms.themes[q.theme] = [0, 0]); t[1]++; if (ok) t[0]++; }
    if (!ok) ms.missed[id] = (ms.missed[id] || 0) + 1;
}
/** Une seule fois : le mois de chaque réponse passée (date de la dernière réponse) reçoit ses chiffres, pour que le
    1er récap (octobre 2026) soit complet (toutes les parties datent d'après la remise à zéro du 20/10). */
function backfillMonthStats(data) {
    data.monthStatsInit = true;
    for (const [id, s] of Object.entries(data.stats || {})) {
        if (!s || !s.last || !s.tries) continue;
        const m = monthKeyOf(dayKey(new Date(s.last)));
        const ms = monthStat(m, data);
        ms.answers += s.tries;
        ms.right += s.right || 0;
        const q = anyQuestion(id);
        if (q) { const t = ms.themes[q.theme] || (ms.themes[q.theme] = [0, 0]); t[1] += s.tries; t[0] += s.right || 0; }
        const wrong = s.tries - (s.right || 0);
        if (wrong > 0) ms.missed[id] = (ms.missed[id] || 0) + wrong;
    }
    const owned = Object.keys(data.cards || {}).filter(id => data.cards[id] > 0);
    const ms = monthStat(monthKeyOf(todayKey()), data);
    ms.cards += owned.length;
    ms.bigCards += owned.filter(id => { const c = CARDS.find(x => x.id === id); return c && ['epic', 'legendary', 'master', 'event'].includes(c.rarity); }).length;
}
/** Chiffres du mois `m` pour le récap (XP, meilleur jour et série d'après le calendrier). */
function monthRecap(m) {
    const d = state.data, ms = d.monthStats[m] || { answers: 0, right: 0, themes: {}, missed: {}, cards: 0, bigCards: 0 };
    const days = Object.entries(d.activeDays).filter(([k]) => monthKeyOf(k) === m);
    const xp = days.reduce((s, [, v]) => s + (v || 0), 0);
    const best = days.reduce((b, [k, v]) => (v > (b ? b[1] : 0) ? [k, v] : b), null);
    // Plus longue série du mois : jours joués ou sauvés par un gel, d'affilée
    let longest = 0, run = 0;
    const start = new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)) - 1, 1);
    for (let k = new Date(start); monthKeyOf(dayKey(k)) === m; k.setDate(k.getDate() + 1)) {
        const key = dayKey(k);
        run = d.activeDays[key] !== undefined || d.frozenDays[key] ? run + 1 : 0;
        longest = Math.max(longest, run);
    }
    const themes = Object.entries(ms.themes).filter(([, [, n]]) => n >= 5).map(([t, [r, n]]) => [t, r / n]).sort((a, b) => b[1] - a[1]);
    const worst = Object.entries(ms.missed).sort((a, b) => b[1] - a[1]).find(([id, n]) => n >= 2 && anyQuestion(id));
    return { m, xp, best, longest, answers: ms.answers, right: ms.right, theme: themes[0] || null,
        worst: worst ? { q: anyQuestion(worst[0]), n: worst[1] } : null, cards: ms.cards, bigCards: ms.bigCards };
}
/** Mois terminés qui ont un récap (on a gagné de l'XP), du plus récent au plus ancien. */
function recapMonths() {
    const now = monthKeyOf(todayKey());
    const months = new Set(Object.keys(state.data.activeDays).filter(k => (state.data.activeDays[k] || 0) > 0).map(monthKeyOf));
    return [...months].filter(m => m < now && m >= '2026-10').sort().reverse();
}
/** Le récap à mettre en avant (mois dernier) : pas encore vu, ou vu il y a moins de 7 jours. */
function recapToShow() {
    const m = shiftMonth(monthKeyOf(todayKey()), -1);
    if (!recapMonths().includes(m)) return null;
    const seen = state.data.recapSeen[m];
    if (seen && shiftDays(seen, 7) <= todayKey()) return null;
    return { m, unseen: !seen };
}
const recapUnseen = () => { const r = recapToShow(); return r && r.unseen ? 1 : 0; };
function renderMonthRecapBtn() {
    const btn = $('monthRecapBtn');
    const r = recapToShow();
    btn.hidden = !r;
    if (!r) return;
    btn.textContent = `📅 Ton mois ${monthOf(r.m)}`;
    if (r.unseen) btn.setAttribute('data-notif', 1); else btn.removeAttribute('data-notif');
    btn.onclick = () => openRecap(r.m);
}

let recapTimer = null, recapSlides = [], recapIdx = 0;
function recapSlidesFor(m) {
    const r = monthRecap(m);
    const fmt = n => n.toLocaleString('fr-FR');
    const slides = [{ bg: 'linear-gradient(160deg,#8b5cf6,#ec4899)', face: 'clin', h: `Ton mois ${monthOf(m)}`, p: 'On fait le bilan ? 👀' }];
    if (r.answers > 0) slides.push({ bg: 'linear-gradient(160deg,#1cb0f6,#3b6cf6)', big: fmt(r.answers), h: r.answers > 1 ? 'questions répondues' : 'question répondue',
        p: `dont ${fmt(r.right)} justes (${Math.round(r.right / r.answers * 100)} %)` });
    if (r.xp > 0) slides.push({ bg: 'linear-gradient(160deg,#58cc02,#2f8f00)', big: fmt(r.xp), h: 'XP gagnés',
        p: r.best ? `Ton meilleur jour : le ${Number(r.best[0].slice(8, 10))} ${monthName(m)}, ${fmt(r.best[1])} XP` : '' });
    if (r.theme) {
        const icon = (THEME_DECOR.find(t => t.theme === r.theme[0]) || {}).icon || '⭐';
        slides.push({ bg: 'linear-gradient(160deg,#ff9600,#e8590c)', big: icon, h: `Ton thème star : ${r.theme[0]}`, p: `${Math.round(r.theme[1] * 100)} % de bonnes réponses` });
    }
    if (r.longest > 0) slides.push({ bg: 'linear-gradient(160deg,#ff4b4b,#b8125b)', big: `🔥 ${r.longest}`, h: r.longest > 1 ? 'jours de série d’affilée' : 'jour de série',
        p: 'ta plus longue série du mois' });
    if (r.worst) slides.push({ bg: 'linear-gradient(160deg,#334155,#0f172a)', face: 'triste', h: 'Ta bête noire',
        p: `« ${r.worst.q.q} » ratée ${r.worst.n} fois… C’était : ${r.worst.q.a[0]} 😅` });
    if (r.cards > 0) slides.push({ bg: 'linear-gradient(160deg,#ffc800,#f59e0b)', big: `🃏 ${r.cards}`, h: r.cards > 1 ? 'cartes gagnées' : 'carte gagnée',
        p: `${r.bigCards ? `dont ${r.bigCards} épique${r.bigCards > 1 ? 's' : ''} ou mieux ! ` : ''}Ta collection : ${Object.keys(state.data.cards).filter(id => state.data.cards[id] > 0).length} / ${CARDS.length}` });
    slides.push({ bg: 'linear-gradient(160deg,#8b5cf6,#ec4899)', face: 'fier', h: `À ${monthName(shiftMonth(m, 1))} !`, p: 'Bravo pour ce mois 💪' });
    return slides;
}
function openRecap(m) {
    recapSlides = recapSlidesFor(m);
    if (!state.data.recapSeen[m]) { state.data.recapSeen[m] = todayKey(); saveData(); }
    let ov = $('recapStory');
    if (!ov) {
        ov = el('div', 'recap-story');
        ov.id = 'recapStory';
        ov.setAttribute('role', 'dialog');
        ov.innerHTML = '<div class="recap-prog"></div><button type="button" class="recap-x" aria-label="Fermer">✕</button><div class="recap-slide"></div><p class="recap-hint">Touche à droite : suivant · à gauche : retour</p>';
        document.body.append(ov);
        ov.querySelector('.recap-x').addEventListener('click', e => { e.stopPropagation(); closeRecap(); });
        ov.querySelector('.recap-slide').addEventListener('click', e => {
            const r = e.currentTarget.getBoundingClientRect();
            const next = e.clientX - r.left > r.width / 3;
            if (next && recapIdx >= recapSlides.length - 1) closeRecap(); else showRecapSlide(recapIdx + (next ? 1 : -1));
        });
    }
    ov.hidden = false;
    showRecapSlide(0);
    renderMonthRecapBtn();
    updateNavNotifications();
}
function showRecapSlide(i) {
    recapIdx = Math.max(0, Math.min(recapSlides.length - 1, i));
    const s = recapSlides[recapIdx], ov = $('recapStory');
    ov.style.background = s.bg;
    ov.querySelector('.recap-prog').innerHTML = recapSlides.map((_, k) => `<i class="${k < recapIdx ? 'is-done' : k === recapIdx ? 'is-cur' : ''}"><b></b></i>`).join('');
    const sl = ov.querySelector('.recap-slide');
    sl.replaceChildren();
    if (s.face) { const k = el('div', 'recap-kulti'); k.append(kultiEl(s.face, 'kulti-blink kulti-float')); sl.append(k); }
    if (s.big) { const b = el('div', 'recap-big'); b.textContent = s.big; sl.append(b); }
    const h = el('h3');
    h.textContent = s.h;
    const p = el('p');
    p.textContent = s.p;
    sl.append(h, p);
    clearTimeout(recapTimer);
    if (recapIdx < recapSlides.length - 1) recapTimer = setTimeout(() => showRecapSlide(recapIdx + 1), 5000);
}
function closeRecap() {
    clearTimeout(recapTimer);
    const ov = $('recapStory');
    if (ov) ov.hidden = true;
}

/** Avatars des amis à côté du niveau où ils en sont (d'après leur résumé : `unlocked`). Tap = leur profil.
    Redessiné à chaque mise à jour du classement, sans redessiner toute la carte (sinon elle défilerait). */
function renderMapFriends() {
    document.querySelectorAll('.map-friends').forEach(b => b.remove());
    if (!league?.friends?.length) return;
    const byLevel = {};
    for (const f of league.friends) {
        const lvl = Math.min(MAX_LEVEL, f.summary?.unlocked || 0);
        if (lvl > 0) (byLevel[lvl] = byLevel[lvl] || []).push(f);
    }
    for (const [lvl, friends] of Object.entries(byLevel)) {
        const stop = document.querySelector(`.stop[data-level="${lvl}"]`);
        if (!stop) continue;
        const box = el('div', 'map-friends');
        friends.slice(0, 3).forEach(f => {
            const b = el('button', 'map-friend');
            b.type = 'button';
            b.setAttribute('aria-label', `${f.pseudo} est au niveau ${lvl}`);
            b.append(avatarEl(f.pseudo, f.look, 'is-small'));
            b.addEventListener('click', e => { e.stopPropagation(); openFriendProfile(f); });
            box.append(b);
        });
        if (friends.length > 3) {
            const more = el('span', 'map-friends-more');
            more.textContent = `+${friends.length - 3}`;
            box.append(more);
        }
        stop.append(box);
    }
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
function drawCard(minRarity, exclude, theme = null) {
    const order = Object.keys(CARD_RARITIES).filter(r => CARD_RARITIES[r].weight > 0);   // jamais « Maître »
    const allowed = order.slice(order.indexOf(minRarity || 'common'));
    const rarity = weightedPick(allowed, r => CARD_RARITIES[r].weight, 1)[0];
    const inTheme = c => c.rarity === rarity && (!theme || c.theme === theme);
    const fresh = CARDS.filter(c => inTheme(c) && !exclude.includes(c));
    const pool = fresh.length ? fresh : CARDS.filter(inTheme);
    const missing = pool.filter(c => !state.data.cards[c.id]);
    const from = missing.length && Math.random() < newCardChance() ? missing : pool;
    return from[Math.floor(Math.random() * from.length)];
}

/** Ouvre les coffres des niveaux donnés : les cartes sont gagnées (et enregistrées) tout de suite.
    Un seul coffre : cartes montrées une à une. Plusieurs : toutes les cartes d'un coup, en grille. */
function openChests(levels) {
    const d = state.data;
    for (const n of levels) d.chests[n] = Date.now();
    // Après un placement : les cartes des coffres sautés arrivent petit à petit, dans les coffres suivants
    const boxes = levels.map(n => {
        const extra = n >= (d.placement?.start || 0) ? Math.min(CHEST_BONUS_MAX, d.chestBonus) : 0;   // seulement les coffres après le départ
        d.chestBonus -= extra;
        return { size: chestSize(n) + extra, rare: n % CHALLENGE_EVERY === 0 };
    });
    const title = (levels.length > 1 ? `🎁 ${levels.length} coffres !`
        : levels[0] % CHALLENGE_EVERY === 0 ? '🎁 Gros coffre !' : '🎁 Coffre')
;   // cartes bonus du placement : ajoutées sans le dire (le joueur ne sait pas ce qu'ont les autres)
    openCardBoxes(boxes, title);
}

/** Tire les cartes de chaque coffre ({ size, rare : au moins une rare ou mieux }), les ajoute à la collection
    (doublon = pièces), enregistre, puis ouvre la fenêtre du coffre. */
function openCardBoxes(boxes, title, avItem = null) {
    const data = state.data;
    if (avItem) {   // objet d'avatar trouvé dans le coffre : à moi tout de suite, montré à la fermeture du coffre
        data.av.owned[avItem.id] = 1;
        data.av.opened[avItem.id] = 1;
        data.av.known[avItem.id] = 1;
        state.chestAvItem = avItem;
    }
    const results = [];
    for (const { size = 0, rare, theme = null, fixed = [] } of boxes) {
        const picked = [...fixed];
        for (let i = 0; i < size; i++) {
            const needRare = rare && i === size - 1 && picked.every(c => c.rarity === 'common');
            picked.push(drawCard(needRare ? 'rare' : null, picked, theme));
        }
        for (const card of picked) {
            const isNew = !data.cards[card.id];
            if (isNew) { const ms = monthStat(); ms.cards++; if (['epic', 'legendary', 'master', 'event'].includes(card.rarity)) ms.bigCards++; }
            data.cards[card.id] = (data.cards[card.id] || 0) + 1;
            const coins = isNew ? 0 : CARD_RARITIES[card.rarity].dupCoins;
            data.coins += coins;
            results.push({ card, isNew, coins, shiny: data.cards[card.id] === SHINY_AT });
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
    $('chestNote').textContent = `${plural(results.length, 'carte', 'cartes')}${avItem ? ' et une surprise ✨' : ''} à l’intérieur. Touche le coffre !`;
    $('chestBtn').textContent = 'Ouvrir';
    $('chestModal').hidden = false;
}

/* Ouverture façon « Clash Royale » : la carte arrive de dos, tremble plus ou moins longtemps selon sa
   rareté (lueur de sa couleur), puis se retourne. Épique / légendaire : rayons de lumière et confettis.
   Un tap (sur la carte ou le bouton) pendant l'animation la termine tout de suite. */
const CARD_CHARGE_MS = { common: 250, rare: 550, epic: 900, legendary: 1300, master: 1300 };
const CARD_CONFETTI = { epic: ['#8b5cf6', '#c9b6ff', '#ffffff'], legendary: ['#ffc800', '#ffb300', '#fff3b0', '#ff9600'],
                        master: ['#58cc02', '#89e219', '#d7ffb8', '#ffffff'],
                        event: ['#ff7a00', '#ffb347', '#8b5cf6', '#2b1d3d'] };
const SHINY_AT = 3;   // 3 exemplaires d'une carte : elle devient brillante ✨ (sa couleur de rareté ne change pas)
const isShiny = card => card.rarity !== 'master' && (state.data.cards[card.id] || 0) >= SHINY_AT && !!state.data.shinyCards[card.id];
/** 3e exemplaire reçu mais pas encore « réveillé » : on le signale (pastille), un tap dans la collection lance l'animation. */
const shinyPending = card => card.rarity !== 'master' && (state.data.cards[card.id] || 0) >= SHINY_AT && !state.data.shinyCards[card.id];
const pendingShinyCount = () => CARDS.filter(shinyPending).length;
const CARD_THEMES = [...new Set(CARDS.map(c => c.theme))];
/** Thèmes dont les 10 cartes (carte Maître comprise) sont dans la collection. */
const completeThemes = () => CARD_THEMES.filter(t => CARDS.filter(c => c.theme === t).every(c => state.data.cards[c.id]));
/** Thèmes dont toutes les cartes normales sont brillantes (la carte Maître ne peut pas l'être). */
const shinyThemes = () => CARD_THEMES.filter(t => CARDS.filter(c => c.theme === t && c.rarity !== 'master').every(isShiny));

/** Collection d'un thème complétée : fête (une seule fois par thème), puis badges. */
async function checkThemeComplete(silent = false) {
    const fresh = completeThemes().filter(t => !state.data.themeComplete[t]);
    if (!fresh.length) return;
    for (const t of fresh) state.data.themeComplete[t] = todayKey();
    saveData();
    if (silent) return;
    launchConfetti(CARD_CONFETTI.legendary);
    playSound('win');
    const names = fresh.join(', ');
    const go = await askConfirm({
        title: fresh.length > 1 ? '🃏 Collections complètes !' : '🃏 Collection complète !',
        text: fresh.length > 1 ? `Tu as réuni toutes les cartes de : ${names}. Bravo !` : `Tu as réuni les ${CARDS.filter(c => c.theme === fresh[0]).length} cartes ${names}, carte Maître comprise. Bravo !`,
        yes: 'Voir ma collection',
        no: 'Super !'
    });
    checkBadges();
    if (go) { showScreen('profile'); setProfileTab('cards'); }
}

/** Carte retournable : dos (logo) + face. */
function cardFlip(card, big, shiny = false) {
    const flip = el('div', `flip rarity-${card.rarity}${big ? ' is-big' : ''}`);
    const rays = el('div', 'flip-rays');
    const inner = el('div', 'flip-inner');
    const back = el('div', 'flip-back');
    const logo = el('img');
    logo.src = 'icons/logo.svg';
    logo.alt = '';
    back.append(logo);
    const front = el('div', 'flip-front');
    front.append(cardFace(card, big, shiny));
    inner.append(back, front);
    flip.append(rays, inner);
    return flip;
}

/** Effets au moment où la carte se retourne (son, confettis selon la rareté). */
function cardRevealFx(rarity) {
    playSound(rarity === 'common' ? 'pair' : rarity === 'rare' ? 'good' : 'win');
    if (CARD_CONFETTI[rarity]) launchConfetti(CARD_CONFETTI[rarity]);
}

/** La carte devient brillante (3e exemplaire) : pluie d'étincelles irisées et son de victoire. */
function shinyFx() {
    launchConfetti(['#ffffff', '#ffd6f5', '#bdefff', '#fff3b0', '#e0c3ff']);
    playSound('win');
}

/** Une seule carte en grand : charge, puis se retourne. */
function revealCard(chest) {
    const { card, isNew, coins, shiny } = chest.results[chest.step];
    const flip = cardFlip(card, true, isShiny(card));
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
        if (shiny) shinyFx();
        const copies = state.data.cards[card.id] || 0;
        $('chestNote').textContent = isNew ? (card.rarity === 'master' ? '🏆 Carte Maître !' : '✨ Nouvelle carte !')
            : shiny ? `✨ 3/3 ! Va dans Profil → Cartes pour la rendre brillante. +${coins} 🪙`
            : copies < SHINY_AT ? `Déjà dans ta collection (${copies}/${SHINY_AT}) : +${coins} 🪙`
            : `Déjà dans ta collection : +${coins} 🪙`;
    };
    chest.timer = setTimeout(() => chest.finish && chest.finish(), CARD_CHARGE_MS[card.rarity]);
    flip.addEventListener('click', () => chest.finish && chest.finish());
}

/** Plusieurs coffres : toutes les cartes en grille, de dos, qui se retournent l'une après l'autre. */
function showChestSummary(chest) {
    const { results } = chest;
    const grid = el('div', 'chest-summary');
    const flips = results.map(({ card, isNew, shiny }) => {
        const flip = cardFlip(card, false, isShiny(card));
        if (isNew || shiny) {
            const tag = el('span', 'kcard-new');
            tag.textContent = card.rarity === 'master' ? 'Maître' : isNew ? 'Nouvelle' : '3/3 ✨';
            flip.append(tag);
        }
        grid.append(flip);
        return flip;
    });
    const fresh = results.filter(r => r.isNew).length;
    const shinies = results.filter(r => r.shiny).length;
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
        if (shinies) shinyFx();
        else if (CARD_CONFETTI[best]) launchConfetti(CARD_CONFETTI[best]);
        $('chestNote').textContent = `✨ ${plural(fresh, 'nouvelle', 'nouvelles')}${shinies ? ` · ${shinies} à 3/3 (va dans tes cartes)` : ''}${coins ? ` · doublons : +${coins} 🪙` : ''}`;
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
    if (wasChest && state.chestAvItem) { const it = state.chestAvItem; state.chestAvItem = null; setTimeout(() => avFound(it), 250); }
    if (wasChest) {
        setTimeout(checkThemeComplete, 300);   // un thème vient d'être complété ?
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
/** Carte, style d'origine (remis le 2026-10-26 : le style « moderne » faisait trop chargé dans la collection).
    Le style moderne (`cardFaceV2`) reste visible dans le bac à sable (?bac=1), pour le retravailler. */
function cardFaceV1(card, big = false, shiny = false) {
    const box = el('div', `kcard rarity-${card.rarity}${big ? ' is-big' : ''}${shiny ? ' is-shiny' : ''}`);
    const art = el('div', 'kcard-art');
    art.append(emojiImg(card.icon));
    const name = el('div', 'kcard-name');
    name.textContent = card.name;
    box.append(art, name);
    if (shiny) {
        const star = el('span', 'kcard-sparkle');
        star.textContent = '✨';
        box.append(star);
    }
    if (big) {
        const meta = el('div', 'kcard-meta');
        meta.textContent = card.rarity === 'master' ? `Carte Maître · ${card.theme}`
            : `${CARD_RARITIES[card.rarity].name}${shiny ? ' · Brillante' : ''} · ${card.theme}`;
        const text = el('p', 'kcard-text');
        text.textContent = card.text;
        box.append(meta, text);
    }
    return box;
}
// 26/10 (choix de l'utilisateur) : style moderne en grand ; en petit (collection, coffres, boutique) l'ancien, plus léger
const cardFace = (card, big = false, shiny = false) => (big ? cardFaceV2 : cardFaceV1)(card, big, shiny);

/** Numéro de la carte dans son thème (« 5/12 »), dans l'ordre de la collection (communes… puis Maître). */
function cardNumber(card) {
    const order = Object.keys(CARD_RARITIES);
    const list = CARDS.filter(c => c.theme === card.theme).sort((a, b) => order.indexOf(a.rarity) - order.indexOf(b.rarity));
    const i = list.indexOf(card);
    return i >= 0 ? `${i + 1}/${list.length}` : '★';
}
/* Cartes, style « moderne » (2026-10-26, choix de l'utilisateur) : haut de la couleur de la rareté à petits points avec le
   dessin en grand (numéro à gauche, thème à droite, pastille de rareté), bas blanc avec le nom et la phrase.
   En petit (collection) : seulement le haut. Brillante : reflet arc-en-ciel + ✨ (le contour reste celui de la rareté). */
function cardFaceV2(card, big = false, shiny = false) {
    const box = el('div', `kcard kcard-v2 rarity-${card.rarity}${big ? ' is-big' : ''}${shiny ? ' is-shiny' : ''}`);
    const top = el('div', 'kcard-top');
    const art = el('div', 'kcard-art');
    art.append(emojiImg(card.icon));
    top.append(art);
    box.append(top);
    if (shiny) {
        const star = el('span', 'kcard-sparkle');
        star.textContent = '✨';
        box.append(star);
    }
    if (big) {
        const num = el('span', 'kcard-num');
        num.textContent = cardNumber(card);
        const theme = el('span', 'kcard-theme');
        theme.textContent = card.theme;
        const meta = el('span', 'kcard-meta');
        meta.textContent = card.rarity === 'master' ? 'Carte Maître' : `${CARD_RARITIES[card.rarity].name}${shiny ? ' · Brillante' : ''}`;
        top.append(num, theme, meta);
        const body = el('div', 'kcard-body');
        const name = el('div', 'kcard-name');
        name.textContent = card.name;
        const text = el('p', 'kcard-text');
        text.textContent = card.text;
        body.append(name, text);
        box.append(body);
    } else {
        const name = el('div', 'kcard-name');   // visible seulement sur grand écran (masqué sur téléphone)
        name.textContent = card.name;
        box.append(name);
    }
    return box;
}

/** Carte de la collection en grand (même fenêtre que le coffre). */
function openCardView(card, onBack = null, friendShiny = false) {
    state.chest = null;
    chestBack = onBack;
    $('chestTitle').textContent = `🃏 ${card.theme}`;
    $('chestStage').replaceChildren(cardFace(card, true, onBack ? friendShiny : isShiny(card)));
    const count = onBack ? 0 : (state.data.cards[card.id] || 0);
    $('chestNote').textContent = onBack ? (friendShiny ? '✨ Carte brillante' : '')
        : card.rarity === 'master' ? '🏆 Gagnée en réussissant le palier 5 de l’entraînement.'
        : card.rarity === 'event' ? '🎉 Carte d’événement : on ne pouvait la gagner que cette semaine-là.'
        : !count ? '' : count >= SHINY_AT ? `✨ Carte brillante (${count} exemplaires)`
        : `${count} / ${SHINY_AT} exemplaires : à ${SHINY_AT}, elle devient brillante ✨`;
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

/** 3e exemplaire : la carte se charge (elle tremble et brille), puis prend son apparence brillante. */
function revealShiny(card) {
    state.chest = null;
    chestBack = null;
    $('chestTitle').textContent = '✨ 3 exemplaires !';
    const stage = $('chestStage');
    const face = cardFace(card, true, false);
    face.classList.add('is-awakening');
    stage.replaceChildren(face);
    $('chestNote').textContent = 'Ta carte se transforme…';
    $('chestBtn').textContent = 'Super !';
    $('chestModal').hidden = false;
    let done = false;
    const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        state.chest = null;   // le prochain tap sur le bouton ferme la fenêtre
        state.data.shinyCards[card.id] = Date.now();
        saveData();
        stage.replaceChildren(cardFace(card, true, true));
        shinyFx();
        $('chestNote').textContent = '✨ Ta carte est maintenant brillante !';
        renderCollection();
        updateNavNotifications();
        checkBadges();   // « Tout brille » ?
    };
    const timer = setTimeout(finish, 1400);
    face.addEventListener('click', finish);
    state.chest = { results: [], step: 0, finish };   // un tap sur le bouton pendant l'animation la termine
}

/** Carte Maître pas encore gagnée : comment l'obtenir. */
function openLockedMaster(card) {
    state.chest = null;
    chestBack = null;
    $('chestTitle').textContent = '🏆 Carte Maître';
    const box = el('div', 'kcard is-big is-missing is-locked rarity-master');
    box.textContent = '🔒';
    $('chestStage').replaceChildren(box);
    $('chestNote').textContent = `Réussis le palier 5 en ${card.theme}, dans Défis → Entraînement, pour la gagner.`;
    $('chestBtn').textContent = 'Compris';
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
    const themes = [...new Set(CARDS.map(c => c.theme))].sort(byThemeName);
    for (const theme of themes) {
        const order = Object.keys(CARD_RARITIES);   // communes, rares, épique, légendaire, puis Maître
        const cards = CARDS.filter(c => c.theme === theme).sort((x, y) => order.indexOf(x.rarity) - order.indexOf(y.rarity));
        const head = el('div', 'card-theme-head');
        const n = cards.filter(c => state.data.cards[c.id]).length;
        head.textContent = `${theme} · ${n}/${cards.length}${n === cards.length ? ' ✓' : ''}`;
        head.classList.toggle('is-complete', n === cards.length);
        const row = el('div', 'card-row');
        row.style.setProperty('--per-row', String(cards.length));                    // une ligne sur grand écran
        row.style.setProperty('--per-row-phone', String(Math.ceil(cards.length / 2)));  // deux lignes sur téléphone
        for (const card of cards) {
            const count = state.data.cards[card.id] || 0;
            if (count) {
                const btn = el('button', 'kcard-btn');
                btn.type = 'button';
                btn.append(cardFace(card, false, isShiny(card)));   // 3 exemplaires : brillante ; doublons = pièces
                btn.setAttribute('aria-label', `${card.name}, ${CARD_RARITIES[card.rarity].name}`);
                if (shinyPending(card)) {
                    btn.classList.add('is-pending');
                    const dot = el('span', 'kcard-ready');
                    dot.textContent = '✨';
                    btn.append(dot);
                    btn.addEventListener('click', () => revealShiny(card));
                } else {
                    if (card.rarity !== 'master' && count < SHINY_AT) {
                        const copies = el('span', 'kcard-copies');
                        copies.textContent = `${count}/${SHINY_AT}`;
                        btn.append(copies);
                    }
                    btn.addEventListener('click', () => openCardView(card));
                }
                row.append(btn);
            } else if (card.rarity === 'master') {
                // Carte Maître : verrouillée, on explique comment la gagner
                const btn = el('button', 'kcard-btn');
                btn.type = 'button';
                const box = el('div', 'kcard is-missing is-locked rarity-master');
                box.textContent = '🔒';
                btn.append(box);
                btn.setAttribute('aria-label', `Carte Maître ${theme}, verrouillée`);
                btn.addEventListener('click', () => openLockedMaster(card));
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
    // Cartes d'événement : à part (elles ne comptent pas dans les 150), seulement si on en a une ou si l'événement est en cours
    const ev = currentEvent();
    const shown = EVENT_CARDS.filter(c => state.data.cards[c.id] || (ev && ev.card.id === c.id));
    if (shown.length) {
        const head = el('div', 'card-theme-head is-event');
        head.textContent = '🎉 Événements';
        const row = el('div', 'card-row');
        for (const card of shown) {
            if (state.data.cards[card.id]) {
                const btn = el('button', 'kcard-btn');
                btn.type = 'button';
                btn.append(cardFace(card, false, false));
                btn.addEventListener('click', () => openCardView(card));
                row.append(btn);
            } else {
                const btn = el('button', 'kcard-btn');
                btn.type = 'button';
                const box = el('div', 'kcard is-missing is-locked rarity-event');
                box.textContent = '🔒';
                btn.append(box);
                btn.addEventListener('click', () => { showScreen('challenges'); setChallengesTab('event'); });
                row.append(btn);
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
        
        claimBtn.addEventListener('click', () => { claimGoalReward(); renderChallenges(); });
        
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
    // Rythme déjà fixé pour la journée : on n'affiche plus les 3 choix (la carte prend moins de place)
    choices.hidden = locked;
    document.querySelector('.goal-title').hidden = locked;
    $('goalNote').textContent = locked
        ? `Rythme « ${currentChoice.label} » · modifiable demain`
        : 'Modifiable tant que tu n’as pas joué aujourd’hui.';
    renderMissionsRow();

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
    $('dailyReviewBtn').hidden = !result;
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
    $('avatarBtn').replaceChildren(avatarEl(myAvatarName(), data.avatar));
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
        ['🎯 Jours d’objectif atteint', String(Object.keys(data.goalDays).length)],
        ['🏆 Semaines 1er de la ligue', String(leagueWins())],
        ['⚔️ Duels gagnés', String(data.totals.duelsWon || 0)],
        ['🎖️ Médailles d’entraînement', trainMedalsText()],
        ...(avOn() ? [['🎨 Objets d’avatar', (c => `${c.have} / ${c.total}`)(avCount())]] : [])
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
    const months = recapMonths();
    if (months.length) {   // « 📅 Mes récaps du mois » : tous les mois passés, pour toujours
        const li = el('li', 'records-recaps');
        const left = el('span');
        left.textContent = '📅 Mes récaps du mois';
        const right = el('div', 'records-recap-list');
        months.forEach(m => {
            const b = el('button', 'records-recap');
            b.type = 'button';
            b.textContent = monthName(m).replace(/^./, c => c.toUpperCase());
            b.addEventListener('click', () => openRecap(m));
            right.append(b);
        });
        li.append(left, right);
        list.append(li);
    }
    renderMonthRecapBtn();

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
    const visible = BADGES.filter(b => !b.event || data.badges[b.id] || currentEvent()?.id === b.event);
    [...visible].sort((a, b) => rank(a) - rank(b)).forEach(b => {
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
            claimBtn.replaceChildren('🎁 ', claimWord, `+${coinBadge()} 🪙`);
            claimBtn.style.marginTop = 'auto';
            claimBtn.style.padding = '8px'; // Légèrement plus fin pour bien s'intégrer à la carte
            claimBtn.style.fontSize = '0.95rem';
            
            card.append(claimBtn);

            // On déclenche la récompense au clic sur ce bouton précis
            claimBtn.addEventListener('click', () => {
                data.claimedBadges[b.id] = true;
                data.coins += coinBadge();
                saveData();
                renderHeader();
                renderProfile();
                showToast(`🎁 +${coinBadge()} 🪙 pour le badge ${b.name} !`);
            });
        }

        grid.append(card);
    });
    $('badgeCount').textContent = `(${earned}/${visible.length})`;
}

/* ---------- Boutique et indices ---------- */

const PACK_SIZE = 5;   // un pack de 5 coûte le prix de 4

const SHOP = [
    { id: 'hintLength', icon: '🔤', short: 'Forme',           name: 'Indice : forme',
      desc: 'Les mots et les lettres de la réponse, en cases vides.', price: 15, spot: 25, size: 'third' }, // avant: 5
    { id: 'hintLetter', icon: '🅰️', short: 'Initiales',       name: 'Indice : initiales',
      desc: 'La première lettre de chaque mot.',              price: 30, spot: 45, size: 'third' }, // avant: 10
    { id: 'hintStart',  icon: '🔎', short: 'Plus de lettres', name: 'Indice : plus de lettres',
      desc: 'Environ un tiers des lettres de chaque mot.',    price: 50, spot: 75, size: 'third' }, // avant: 20
    // 2026-10-25 : « coup de pouce » des frises et des paires (une carte placée / une paire révélée, au choix du joueur)
    { id: 'nudge',      icon: '👆', short: 'Coup de pouce',   name: 'Coup de pouce',
      desc: 'Frises et paires : place une carte ou révèle une paire de ton choix (un par frise ou par grille).', price: 20, spot: 35, size: 'third' },
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

/* Saisie dans la grille (2026-10-25, demande de l'utilisateur) : avec un indice, on tape seulement les lettres qui
   manquent (« C _ _ _ _ » + HIEN = CHIEN). La zone de réponse reste là, invisible, pour garder le clavier ; un lien
   « ⌨️ Écrire librement » permet de revenir à la saisie normale (autre réponse acceptée, par exemple). */
const isLetter = ch => /[\p{L}\p{N}]/u.test(ch);
/** Les morceaux de la réponse principale, avec pour chaque lettre : montrée par l'indice ou à taper. */
function hintCells(q, level) {
    const answer = q.a[0].trim();
    const parts = answer.match(/[\p{L}\p{N}]+|[^\p{L}\p{N}]+/gu) || [];
    const words = parts.filter(t => isLetter(t));
    return parts.map(part => {
        if (!isLetter(part)) return { sep: part };
        const small = words.length > 1 && HINT_SMALL_WORDS.has(part.toLowerCase());
        const letters = [...part];
        const shown = small ? letters.length : hintShown(letters.length, level);
        return { small, letters, shown };
    });
}
const hintBlankCount = (q, level) => hintCells(q, level).reduce((n, c) => n + (c.letters ? c.letters.length - c.shown : 0), 0);
/** La réponse complète : lettres montrées + lettres tapées (dans l'ordre des cases vides). */
function hintComposed(q, level, typed) {
    const t = [...typed];
    let k = 0;
    return hintCells(q, level).map(c => c.sep !== undefined ? c.sep
        : c.letters.map((ch, i) => (i < c.shown ? ch : (t[k++] || ''))).join('')).join('');
}
const hintLevelNow = () => Math.max(0, ...[...(state.hintUsed || [])].map(id => HINT_LEVEL[id] || 0));
const gridTyping = () => state.phase !== undefined && hintLevelNow() > 0 && state.gridFree !== true && !!state.current;
/** Ce que le joueur répond : la grille remplie, ou ce qu'il a écrit. */
const typedAnswer = () => (gridTyping() ? hintComposed(state.current.q, hintLevelNow(), $('userInput').value) : $('userInput').value);

/** Grille de la réponse principale : mots (lettres et chiffres) et séparateurs (espaces, apostrophes, tirets). */
function hintGrid(q, level, typed = null) {
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
            if (typed && i >= shown) {   // case à remplir : la lettre tapée, et un repère sur la prochaine case vide
                const t = typed.list[typed.k++];
                if (t) { cell.textContent = t.toUpperCase(); cell.classList.add('is-typed'); }
                else if (!typed.cursor) { cell.classList.add('is-next'); typed.cursor = true; }
            }
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
    const input = $('userInput');
    const typing = gridTyping() && state.phase === 'answering';
    const letters = typing ? input.value : state.gridFinal;   // après « Vérifier » : les lettres qui avaient été tapées
    const typed = gridTyping() && letters !== undefined && letters !== null ? { list: [...letters], k: 0, cursor: !typing } : null;
    const grid = hintGrid(state.current.q, level, typed);
    li.append(label, grid);
    if (state.phase === 'answering') {
        grid.classList.toggle('is-typing', typing);
        grid.addEventListener('click', () => input.focus());   // toucher la grille ouvre le clavier
        const sw = el('button', 'link-btn hint-switch');
        sw.type = 'button';
        sw.textContent = state.gridFree ? '🔤 Remplir la grille' : '⌨️ Écrire librement';
        sw.addEventListener('click', () => {
            state.gridFree = !state.gridFree;
            input.value = '';
            applyGridTyping();
            input.focus();
        });
        li.append(sw);
    }
    list.append(li);
    applyGridTyping(false);
}
/** Zone de réponse cachée (mais toujours là pour le clavier) quand on tape dans la grille. */
function applyGridTyping(redraw = true) {
    const on = gridTyping() && state.phase === 'answering';
    $('userInput').classList.toggle('is-grid-typing', on);
    if (redraw) renderHintGrid();
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
            : `${item.icon} ${item.short} · ${item.spot || item.price} 🪙`;
        btn.disabled = used || (owned === 0 && state.data.coins < (item.spot || item.price));
        btn.addEventListener('click', () => useHint(id));
        box.append(btn);
    });
    // Sur le moment, c'est plus cher : on le dit (en stock, acheté à la boutique : 15 / 30 / 50 🪙)
    if (HINT_IDS.some(id => !(state.data.inv[id] || 0))) {
        const note = el('p', 'hint-note');
        note.textContent = `💡 Moins cher en stock, à la boutique : ${HINT_IDS.map(id => SHOP.find(i => i.id === id).price).join(' / ')} 🪙.`;
        box.append(note);
    }
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
    else if (data.coins >= (item.spot || item.price)) data.coins -= (item.spot || item.price);
    else return;

    state.hintUsed.add(id);
    saveData();
    renderHeader();

    if (!state.gridFree) $('userInput').value = '';
    renderHintGrid();
    $('hintPanel').hidden = true;
    $('userInput').focus();
}

/** Objet trouvé dans un coffre : grande annonce, puis on peut le mettre tout de suite. */
async function avFound(it) {
    launchConfetti();
    playSound('win');
    const wear = await askConfirm({ title: '🎉 Objet trouvé !', text: `Dans le coffre : ${AV_TYPE_NAME[it.type].toLowerCase()} « ${it.name} » ! Il est à toi pour toujours.`,
        yes: 'Le mettre', no: 'Plus tard', art: avPreview(it) });
    if (wear) { avWear(it); saveData(); pushAvatar(); renderProfile(); }
}

async function buyAvItem(it) {
    const d = state.data;
    if (d.av.owned[it.id]) return;
    if (d.coins < it.price) { showToast(`Il te manque ${it.price - d.coins} 🪙.`); return; }
    const ok = await askConfirm({ title: `Acheter « ${it.name} » ?`, art: avBeforeAfter(it),
        text: `${AV_TYPE_NAME[it.type]} · ${it.price} 🪙 (il t’en restera ${d.coins - it.price}). Ton avatar avant → après : il ira tout de suite dessus.`,
        yes: `Acheter · ${it.price} 🪙` });
    if (!ok || d.coins < it.price) return;
    d.coins -= it.price;
    d.av.owned[it.id] = 1;
    d.av.opened[it.id] = 1;
    d.av.known[it.id] = 1;
    d.totals.purchases++;
    avWear(it);
    saveData();
    pushAvatar();
    renderHeader();
    renderShop();
    playSound('win');
    showToast('✓ C’est à toi ! Change-le quand tu veux dans « Mon avatar ».');
    checkBadges();
}
async function buyCollection(items, price) {
    const d = state.data;
    if (d.coins < price) { showToast(`Il te manque ${price - d.coins} 🪙.`); return; }
    const look = { ...avEnsureLook() };
    items.forEach(it => { if (it.type === 'frame') look.frame = it.id; else if (it.type === 'pic') look.emoji = it.emoji; else look.bg = it.id; });
    const art = el('div', 'av-before-after');
    const arrow = el('span', 'av-arrow');
    arrow.textContent = '→';
    art.append(avatarEl(myAvatarName(), avEnsureLook()), arrow, avatarEl(myAvatarName(), look));
    const ok = await askConfirm({ title: 'Toute la collection ?', art,
        text: `${items.map(it => it.name).join(' + ')} · ${price} 🪙 (il t’en restera ${d.coins - price}). Tout ira sur ton avatar.`, yes: `Acheter · ${price} 🪙` });
    if (!ok || d.coins < price) return;
    d.coins -= price;
    items.forEach(it => { d.av.owned[it.id] = 1; d.av.opened[it.id] = 1; d.av.known[it.id] = 1; avWear(it); });
    d.totals.purchases++;
    saveData();
    pushAvatar();
    renderHeader();
    renderShop();
    playSound('win');
    launchConfetti();
    showToast('✓ Toute la collection est à toi !');
    checkBadges();
}
async function buyVitrineCard() {
    const d = state.data;
    const v = vitrineCard();
    const card = CARDS.find(c => c.id === v.card);
    const price = VITRINE_CARD_PRICE[v.rarity];
    if (!card || v.bought) return;
    if (d.coins < price) { showToast(`Il te manque ${price - d.coins} 🪙.`); return; }
    const ok = await askConfirm({ title: `Acheter « ${card.name} » ?`, art: cardFace(card, false, false),
        text: `Carte ${CARD_RARITIES[card.rarity].name.toLowerCase()} · ${price} 🪙 (il t’en restera ${d.coins - price}).`, yes: `Acheter · ${price} 🪙` });
    if (!ok || d.coins < price) return;
    d.coins -= price;
    v.bought = true;
    d.totals.purchases++;
    openCardBoxes([{ fixed: [card] }], '🃏 Carte de la semaine');
    renderHeader();
    renderShop();
    checkBadges();
}

/** Fenêtre de confirmation d'un achat de la boutique (comme pour les objets d'avatar). */
function askBuy(name, price, detail = '') {
    const d = state.data;
    if (d.coins < price) { showToast(`Il te manque ${price - d.coins} 🪙.`); return Promise.resolve(false); }
    return askConfirm({ title: `Acheter « ${name} » ?`, text: `${detail ? detail + '\n' : ''}${price} 🪙 (il t’en restera ${d.coins - price}).`, yes: `Acheter · ${price} 🪙` });
}

function renderShopV2() {
    const grid = $('shopGrid');
    grid.replaceChildren();
    grid.classList.add('is-v2');
    const d = state.data;
    if (d.vitrineSeen !== weekStart()) { d.vitrineSeen = weekStart(); saveData(); updateNavNotifications(); }
    const w = vitrineWeek();
    const plan = vitrinePlan(w);
    // 1) Vitrine de la semaine
    const vit = el('article', 'card vitrine');
    const head = el('div', 'vitrine-head');
    const h = el('h2');
    h.textContent = '🛍️ Vitrine de la semaine';
    const left = el('span');
    left.textContent = `⏳ ${vitrineTimeLeft()}`;
    head.append(h);
    if (!AV_COLL[plan.coll]) head.append(left);   // sinon le temps restant est dans l'encadré de la collection
    const row = el('div', 'vitrine-row');
    const cell = (pill, pillCls, artNode, name, type, btnText, onBuy, disabled, owned, cellCls = '') => {
        const c = el('div', `vit-cell${cellCls ? ' ' + cellCls : ''}`);
        const p = el('span', `vit-pill${pillCls ? ' ' + pillCls : ''}`);
        p.textContent = pill;
        const a = el('div', 'vit-art');
        a.append(artNode);
        const b = el('b');
        b.textContent = name;
        const t = el('span', 'vit-type');
        t.textContent = type;
        const btn = el('button', `btn ${owned ? 'btn-ghost' : 'btn-green'}`);
        btn.type = 'button';
        btn.textContent = btnText;
        btn.disabled = disabled;
        if (onBuy) btn.addEventListener('click', onBuy);
        c.append(p, a, b, t, btn);
        return c;
    };
    const itemCell = (it, pill, pillCls, cellCls) => {
        const owned = !!d.av.owned[it.id];
        return cell(pill, pillCls, avAlone(it), it.name, AV_TYPE_NAME[it.type], owned ? '✓ À toi' : `${it.price} 🪙`,
            owned ? null : () => buyAvItem(it), owned || d.coins < it.price, owned, cellCls);
    };
    const coll = AV_COLL[plan.coll];
    const pill = plan.season ? VITRINE_SEASON_LABEL[plan.season] : plan.back ? 'Revient' : 'Nouveau';
    const pillCls = plan.season ? 'is-event' : plan.back ? 'is-back' : '';
    plan.items.forEach(id => row.append(itemCell(AVI[id], pill, pillCls, plan.season ? 'is-event' : '')));
    const v = vitrineCard();
    const card = CARDS.find(c => c.id === v.card);
    if (card) {
        const price = VITRINE_CARD_PRICE[v.rarity];
        row.append(cell('Ta carte', 'is-card', cardFace(card, false, false), card.name,
            `Carte ${CARD_RARITIES[card.rarity].name.toLowerCase()}${v.shine ? ' · à faire briller' : ''}`,
            v.bought ? '✓ À toi' : `${price} 🪙`, v.bought ? null : buyVitrineCard, v.bought || d.coins < price, v.bought));
    }
    const rName = { common: 'communes', rare: 'rares', epic: 'épiques', legendary: 'légendaires' };
    const rIcon = { common: '⚪', rare: '🔵', epic: '💜', legendary: '🟡' };
    const now = VITRINE_CARD_ROT[w % 4];
    const nextR = VITRINE_CARD_ROT[(w + 1) % 4];
    const foot = el('p', 'vitrine-foot');
    foot.textContent = `${rIcon[now]} Semaine des cartes ${rName[now]} · la prochaine : ${rName[nextR]} ${rIcon[nextR]}`;
    // En haut : le look complet (les 3 pièces sur mon initiale) et « Toute la collection » (−20 % sur ce qui manque)
    const look = el('div', 'vitrine-look');
    if (coll) {
        const full = { hue: 0, emoji: null, bg: null, frame: null };
        coll.items.map(id => AVI[id]).forEach(it => { if (it.type === 'frame') full.frame = it.id; else if (it.type === 'pic') full.emoji = it.emoji; else full.bg = it.id; });
        const lookAv = el('div', 'vitrine-look-art');
        lookAv.append(avatarEl(myAvatarName(), full));
        const txt = el('div', 'vitrine-look-text');
        const nm = el('b');
        nm.textContent = `${coll.icon} Collection ${coll.name}`;
        const note = el('small');
        note.textContent = `${plan.back ? 'Elle revient !' : plan.season ? 'Seulement cette semaine' : 'Le look complet'} · ⏳ ${vitrineTimeLeft()}`;
        txt.append(nm, note);
        const missing = plan.items.map(id => AVI[id]).filter(it => it && !d.av.owned[it.id]);
        if (missing.length === coll.items.length) {
            const total = missing.reduce((sum, it) => sum + it.price, 0);
            const price = Math.round((total * COLLECTION_DISCOUNT) / 50) * 50;
            const all = el('button', 'btn btn-violet vitrine-all');
            all.type = 'button';
            all.textContent = `Les ${missing.length} · ${price} 🪙`;
            all.disabled = d.coins < price;
            all.addEventListener('click', () => buyCollection(missing, price));
            const was = el('small', 'vitrine-was');
            was.textContent = `au lieu de ${total} 🪙`;
            txt.append(all, was);
        } else if (!missing.length) {
            const ok = el('small', 'vitrine-done');
            ok.textContent = '✓ Toute la collection est à toi';
            txt.append(ok);
        }   // déjà une pièce : pas de bouton ni de texte, on achète le reste pièce par pièce
        look.append(lookAv, txt);
    }
    vit.append(head, look, row, foot);
    grid.append(vit);

    // 2) Coffre de cartes
    const owned = CARDS.filter(c => d.cards[c.id]).length;
    const chestCard = el('article', 'card shop-lines');
    const line = (icon, title, sub, buttons) => {
        const l = el('div', 'shop-line');
        const ic = el('span', 'sl-icon');
        ic.textContent = icon;
        const tx = el('span', 'sl-text');
        const b = el('b');
        b.textContent = title;
        const sm = el('small');
        sm.textContent = sub;
        tx.append(b, sm);
        const bt = el('span', 'sl-btns');
        buttons.forEach(x => bt.append(x));
        l.append(ic, tx, bt);
        return l;
    };
    const mkBtn = (text, cls, disabled, onClick) => {
        const b = el('button', `btn ${cls}`);
        b.type = 'button';
        b.textContent = text;
        b.disabled = disabled;
        b.addEventListener('click', onClick);
        return b;
    };
    chestCard.append(line('🎁', 'Coffre de cartes', `${SHOP_CHEST.size} cartes, dont au moins une rare · collection ${owned}/${CARDS.length}`,
        [mkBtn(`${SHOP_CHEST.price} 🪙`, 'btn-green', d.coins < SHOP_CHEST.price, async () => {
            if (!(await askBuy('Coffre de cartes', SHOP_CHEST.price, `${SHOP_CHEST.size} cartes, dont au moins une rare.`))) return;
            if (state.data.coins < SHOP_CHEST.price) return;
            state.data.coins -= SHOP_CHEST.price;
            openCardBoxes([{ size: SHOP_CHEST.size, rare: true }], '🎁 Coffre de cartes');
            renderHeader();
            renderShop();
        })]));
    grid.append(chestCard);

    // 3) Objets utiles
    syncDrops();
    const tools = el('article', 'card shop-lines');
    const th = el('h2');
    th.textContent = '🧰 Objets utiles';
    tools.append(th);
    SHOP.forEach(item => {
        const have = d.inv[item.id] || 0;
        const full = item.max && have + 1 > item.max;
        const buttons = [mkBtn(`${item.price} 🪙`, 'btn-green', d.coins < item.price || !!full, async () => {
            if (await askBuy(item.name, item.price, item.desc)) buyItem(item.id, 1);
        })];
        if (!item.max) buttons.push(mkBtn(`×${PACK_SIZE} · ${item.price * (PACK_SIZE - 1)} 🪙`, 'btn-violet', d.coins < item.price * (PACK_SIZE - 1), async () => {
            if (await askBuy(`${item.name} ×${PACK_SIZE}`, item.price * (PACK_SIZE - 1), `${PACK_SIZE} pour le prix de ${PACK_SIZE - 1}.`)) buyItem(item.id, PACK_SIZE);
        }));
        tools.append(line(item.icon, item.name, `${item.desc.replace(/\.$/, '')} · ${item.max ? `${have}/${item.max}` : `en stock : ${have}`}`, buttons));
    });
    tools.append(line('💧', 'Recharge de gouttes', `Toutes tes gouttes d’un coup · ${d.drops}/${DROPS_MAX}`,
        [mkBtn(d.drops >= DROPS_MAX ? 'Plein' : `${DROPS_REFILL_PRICE} 🪙`, 'btn-green', d.drops >= DROPS_MAX || d.coins < DROPS_REFILL_PRICE, async () => {
            if (await askBuy('Recharge de gouttes', DROPS_REFILL_PRICE, `Toutes tes gouttes d’un coup (${DROPS_MAX}).`) && refillDrops()) renderShop();
        })]));
    grid.append(tools);
}

function renderShop() {
    if (avOn()) { renderShopV2(); return; }
    const grid = $('shopGrid');
    grid.replaceChildren();
    const data = state.data;

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
    grid.prepend(chest);   // en haut de la boutique : bien visible

    // Recharge complète des gouttes, juste après le coffre
    syncDrops();
    const refill = el('article', 'card shop-card shop-drops');
    const rIcon = el('div', 'shop-icon');
    rIcon.textContent = '💧';
    const rName = el('h2');
    rName.textContent = 'Recharge complète';
    const rDesc = el('p');
    rDesc.textContent = `Toutes tes gouttes d’un coup (${DROPS_MAX}), pour enchaîner les niveaux.`;
    const rStock = el('p', 'muted');
    rStock.textContent = `Tes gouttes : ${data.drops}/${DROPS_MAX}`;
    const rActions = el('div', 'card-actions');
    const rBtn = el('button', 'btn btn-green');
    rBtn.type = 'button';
    rBtn.textContent = data.drops >= DROPS_MAX ? 'C’est le plein' : `Recharger · ${DROPS_REFILL_PRICE} 🪙`;
    rBtn.disabled = data.drops >= DROPS_MAX || data.coins < DROPS_REFILL_PRICE;
    rBtn.addEventListener('click', () => { if (refillDrops()) renderShop(); });
    rActions.append(rBtn);
    refill.append(rIcon, rName, rDesc, rStock, rActions);
    chest.after(refill);
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
    const bonus = dropBonusText();
    $('modalCost').textContent = bonus;
    $('modalCost').hidden = !bonus;
    showModal(false); // Le bouton de confirmation sera vert
}

/* ---------- Popup de démarrage ---------- */

function openStartModal(n) {
    syncDrops();
    const free = !!state.data.done[n];   // niveau déjà réussi : le refaire est gratuit
    if (!free && state.data.drops <= 0) { openDropsModal(); return; }   // plus de gouttes : comment en regagner
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
    const left = state.data.drops - 1;
    const xpLeft = replayXpLeft();
    $('modalCost').textContent = free ? `💧 Déjà réussi : gratuit · ${xpLeft > 0 ? `XP réduite, encore ${xpLeft} XP possibles aujourd’hui` : 'plus d’XP aujourd’hui (revient demain)'} · ${replayCountsForMissions(n) ? '✓ compte pour tes missions' : replayToday().levels[n] ? 'déjà compté pour tes missions aujourd’hui' : 'ne compte pas pour les missions'}`
        : `💧 −1 goutte · il t’en restera ${left}`;
    $('modalCost').hidden = false;
    $('startLevelBtn').textContent = free ? 'Commencer' : 'Commencer · −1 💧';

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
    // XP des niveaux sautés : au total (titre, badges), pas dans les jours joués (classement de la semaine juste) ;
    // les pièces correspondantes arrivent petit à petit, à chaque niveau réussi (sinon tout dépensé le 1er jour)
    const xpGift = (start - 1) * PLACEMENT_XP_PER_LEVEL;
    d.xp += xpGift;
    d.coinBonus += Math.round(xpGift / coinRate());
    state.placementXp = xpGift;
    // Coffres sautés : les derniers tout de suite, les autres en cartes bonus dans les prochains coffres du parcours
    // (sinon des dizaines de cartes d'un coup ; et sans rien, il aurait moins de cartes qu'un joueur arrivé là normalement)
    const skipped = [];
    for (let n = CHEST_EVERY; n < start; n += CHEST_EVERY) if (!d.chests[n]) skipped.push(n);
    for (const n of skipped.slice(0, Math.max(0, skipped.length - PLACEMENT_CHESTS_NOW))) {
        d.chests[n] = 'placement';
        d.chestBonus += chestSize(n);
    }
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
    $('modalCost').hidden = true;
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
 * - Le nombre de places grandit avec le nombre de questions ratées (3 à 4).
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
    // Niveau déjà réussi qu'on refait : XP réduite, ni bonus ni missions (sinon on gagnait la ligue en refaisant le niveau 1)
    state.replay = ['level', 'pairs', 'order', 'challenge'].includes(mode) && !!state.data.done[level];
    state.replayCounts = !state.replay || replayCountsForMissions(level);
    state.replayLevel = level;
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
        items = shuffle(allQuestionsPool()).map(q => ({ q, review: false }));
    } else if (mode === 'placement') {
        items = placementCards(0);
    } else if (mode === 'challenge') {
        items = pickChallengeCards(level).map(q => ({ q, review: false }));
    } else if (mode === 'training') {
        items = pickTrainingCards(state.trainTheme);
    } else if (mode === 'duel') {
        if (!state.duel) return;
        items = duelQuestions(state.duel.seed).map(q => ({ q, review: false }));
    } else if (mode === 'event') {
        const ev = currentEvent();
        if (!ev) return;
        state.eventId = ev.id;
        items = pickEventCards(ev);
        state.eventIds = items.map(it => it.q.id);
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
    // Niveau du parcours : 1 goutte au lancement, réussi ou raté
    if (requestedMode === 'level' && !state.data.done[level] && !spendDrop()) { openDropsModal(); return; }   // déjà réussi : gratuit

    const hasHearts = mode === 'level' || mode === 'challenge' || pairsMode || orderMode;
    // Défis et niveaux Ordre : 2 cœurs (une frise fausse coûte un cœur : on peut en rater une seule)
    const heartsMax = mode === 'challenge' || orderMode ? CHALLENGE_HEARTS : HEARTS_MAX;
    Object.assign(state, {
        mode, level,
        returnTo: mode === 'duel' ? 'league' : ['daily', 'sprint', 'training', 'event'].includes(mode) ? 'challenges' : 'map',
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
        answers: [],             // défi du jour : réponses tapées (pour les revoir ensuite)
        statsAnswers: [],        // statistiques anonymes : 1re réponse à chaque question
        statsSeen: new Set(),
        statsLevelSent: false,
        hearts: heartsMax,
        heartsMax,
        failedIds: new Set(),
        sessionXp: 0,
        sessionCoins: 0,
        goalReached: false,
        dayXpStart: dayXpNow(),   // pour l'anneau de l'objectif du jour sur l'écran de fin
        combo: 0,                 // bonnes réponses d'affilée (pastille « 🔥 5 d'affilée ! »)
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
const pairTarget = level => 1 + 3.5 * level / MAX_LEVEL;   // 4,5 au dernier niveau

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
    state.nudgePick = null;
    refreshNudgeView('pairs');
    updateProgress();
}
/** Paires : la case choisie et sa paire s'allument et se relient (pas d'XP pour cette paire). */
function nudgePair(btn) {
    const grid = state.pairGrids[state.pairIndex];
    const i = Number(btn.dataset.idx);
    if (grid.matched.has(i) || !payNudge()) return;
    grid.nudged = true;
    state.nudgePick = null;
    if (state.pairSel) { state.pairSel.classList.remove('is-selected'); state.pairSel = null; }
    grid.matched.add(i);
    state.done++;
    const both = [...$('pairsGrid').querySelectorAll(`.pair-btn[data-idx="${i}"]`)];
    both.forEach(b => { b.classList.add('is-ok', 'is-nudged'); b.disabled = true; });
    setTimeout(() => both.forEach(b => { b.classList.remove('is-ok'); b.classList.add('is-matched'); }), 450);
    playSound(grid.matched.size === grid.pairs.length ? 'good' : 'pair');
    refreshNudgeView('pairs');
    updateProgress();
    if (grid.matched.size === grid.pairs.length) {
        state.phase = 'idle';
        const session = state.startedAt;
        setTimeout(() => { if (state.startedAt === session && !$('studyScreen').hidden) nextPairGrid(); }, 800);
    }
}

/** Un clic sur une case : on la sélectionne, ou on vérifie la paire avec la case de l'autre colonne. */
function pickPair(btn) {
    if (state.phase !== 'pairs' || btn.disabled) return;
    if (state.nudgePick === 'pairs') { nudgePair(btn); return; }
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
        addXp(state.replay ? replayXp(1) : XP_PAIR);
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
    stopEndStats();
    state.phase = 'idle';
    hideFeedback();
    renderHeader();
    showScreen(state.returnTo);
    if (state.returnTo === 'map') setTimeout(showDropsTip, 900);   // 1re goutte dépensée : explication
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
    state.cardShownAt = Date.now();   // pour « ⚡ Éclair ! »
    state.verdict = null;
    state.phase = 'answering';

    $('cardTag').textContent = item.q.theme;
    $('reviewTag').hidden = !item.review;

    const tag = $('challengeTag');
    tag.hidden = !['challenge', 'daily', 'sprint', 'placement', 'event', 'duel'].includes(state.mode);
    const ev = state.mode === 'event' ? EVENTS.find(e => e.id === state.eventId) : null;
    tag.textContent = ev ? `${ev.icon} ${ev.name}`
                    : state.mode === 'duel' ? `⚔️ Duel · ${state.done + 1}/${state.total}`
                    : state.mode === 'daily' ? `Défi du jour · ${state.done + 1}/${state.total}`
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
    state.gridFree = false;
    state.gridFinal = null;
    $('userInput').classList.remove('is-grid-typing');
    $('hintList').replaceChildren();
    $('hintList').hidden = true;
    $('hintPanel').hidden = true;
    $('hintBtn').hidden = ['daily', 'sprint', 'placement', 'duel'].includes(state.mode);

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
        const answer = typedAnswer();
        if (!input.value.trim()) { shake(gridTyping() ? $('hintList') : input); return; }
        verdict = judge(answer, state.current.q.a, state.current.q.q);
        state.lastTyped = answer.trim();
    }

    state.phase = 'feedback';
    state.verdict = verdict;
    if (skipped) state.lastTyped = '';

    const ok = verdict !== 'wrong';
    input.readOnly = true;
    input.classList.add(ok ? 'is-ok' : 'is-wrong');
    if (gridTyping()) { state.gridFinal = input.value; input.classList.remove('is-grid-typing'); input.value = state.lastTyped; renderHintGrid(); }
    $('answerActions').hidden = true;
    $('hintPanel').hidden = true;
    // Combo (bonnes réponses du 1er coup, sans indice, d'affilée) et « ⚡ Éclair ! » (juste en moins de 3 s)
    const clean = ok && !skipped && !state.failedIds.has(state.current.q.id) && state.hintUsed.size === 0;
    state.combo = clean ? (state.combo || 0) + 1 : ok ? state.combo || 0 : 0;
    const comboShow = clean && (COMBO_STEPS.includes(state.combo) || (state.combo > 10 && state.combo % 5 === 0));
    const flash = clean && !['sprint', 'daily', 'duel'].includes(state.mode) && Date.now() - (state.cardShownAt || 0) < FLASH_MS;
    renderStickers(comboShow ? state.combo : 0, flash);
    showFeedback(verdict, skipped);
    updateKeyboardMode();   // correction : retour à la taille normale
    const semis = clean ? Math.min(state.combo - 1, 8) * 2 : 0;
    playSound(ok ? 'good' : 'bad', semis);
    if (comboShow) playSound('combo', semis);
    if (flash) playSound('flash');
}

/* Pastilles posées SUR le bord haut du bandeau de correction (position absolue : le bandeau garde sa taille). 2026-10-27 */
const COMBO_STEPS = [3, 5, 7, 10];
const FLASH_MS = 3000;
function renderStickers(combo, flash) {
    const box = $('fbStickers');
    box.replaceChildren();
    if (combo) { const c = el('span', 'fb-sticker is-combo'); c.textContent = `🔥 ${combo} d’affilée !`; box.append(c); }
    if (flash) { const f = el('span', 'fb-sticker is-flash'); f.textContent = '⚡ Éclair !'; box.append(f); }
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
    const strict = state.mode === 'daily' || state.mode === 'sprint' || state.mode === 'duel';
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
    noteStatsAnswer(id, ok);

    // Test de placement : ne touche ni aux statistiques, ni à l'XP
    if (mode === 'placement') {
        hideFeedback();
        placementAnswer(ok);
        return;
    }

    // Défi du jour et sprint : chaque question n'est posée qu'une fois, sans seconde chance
    if (mode === 'daily' || mode === 'sprint' || mode === 'duel') {
        if (mode !== 'duel') recordResult(id, ok);   // duel : ses questions ratées ne vont pas en révision
        if (ok) {
            state.correct++;
            addXp(mode === 'daily' ? XP_DAILY_CORRECT : XP_SPRINT_CORRECT);
            missionEvent('correct');
            missionEvent('theme', 1, item.q.theme);
        }
        if (mode === 'duel') {
            state.grid.push(ok ? '🟩' : '🟥');
            state.answers.push(($('userInput').value || '').trim().slice(0, 60));
        }
        if (mode === 'daily') {
            state.grid.push(ok ? '🟩' : '🟥');
            state.answers.push(($('userInput').value || '').trim().slice(0, 60));
        }
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
        const clean = firstTry && !forced && !assisted;
        addXp(mode === 'training' || mode === 'event' ? (clean ? XP_TRAINING : XP_RETRY)
            : replayXp(clean ? (state.replay ? XP_REPLAY : xpFirstTry(item.q)) : XP_RETRY));
        if (state.replayCounts) {   // niveau refait déjà compté aujourd'hui : ses bonnes réponses ne comptent plus pour les missions
            missionEvent('correct');
            missionEvent('theme', 1, item.q.theme);
        }
        state.done++;
        if (forced) renderHearts();   // « J'avais juste » : le cœur n'est plus menacé, il arrête de clignoter
    } else {
        const again = state.failedIds.has(id);   // déjà ratée une fois pendant cette partie
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
        if (mode === 'event') {
            // Événement : une question ratée ne revient pas dans la session (elle reviendra dans une prochaine)
            state.done++;
        } else if (again && (mode === 'review' || mode === 'training')) {
            // 2e oubli : inutile de la reposer tout de suite, elle reviendra demain
            state.data.stats[id].later = tomorrowKey();
            state.done++;
            saveData();
        } else {
            state.queue.push(item); // la carte reviendra en fin de leçon
        }
    }

    hideFeedback();
    if (state.queue.length === 0) endSession(true);
    else showCard();
}

/* ---------- Cœur de secours ---------- */

const heartPrice = () => SHOP.find(i => i.id === 'heart').price;

/** Bouton « continuer » de l'écran Niveau raté : utilise un cœur du stock, ou l'achète. */
async function useRescueHeart() {
    if (state.phase !== 'over' || !state.canRescue) return;
    const data = state.data;
    const price = heartPrice();
    if (data.inv.heart > 0) {
        data.inv.heart--;
        showToast(`💖 Cœur de secours utilisé (il t’en reste ${data.inv.heart}) : tu continues !`);
    } else if (data.coins >= price) {
        // Achat : on confirme d'abord, avec le solde avant / après
        const ok = await askConfirm({
            title: '💖 Acheter un cœur de secours ?',
            text: `${price} 🪙 seront retirées de tes ${data.coins} 🪙 : il t’en restera ${data.coins - price}.`,
            yes: `Acheter · ${price} 🪙`
        });
        if (!ok || state.phase !== 'over' || data.coins < price) return;
        data.coins -= price;
        data.totals.purchases++;
        showToast(`💖 −${price} 🪙 : tu continues ! (il te reste ${data.coins} 🪙)`);
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
    const info = $('endRescueInfo');
    if (inv.heart > 0) {
        btn.textContent = '💖 Continuer avec un cœur de secours';
        info.textContent = `Gratuit : tu en as ${inv.heart} en stock.`;
    } else if (coins >= price) {
        btn.textContent = `💖 Continuer · −${price} 🪙`;
        info.textContent = `Tu as ${coins} 🪙 · il t’en restera ${coins - price}.`;
    } else {
        $('endText').textContent += `\n💡 Un cœur de secours coûte ${price} 🪙 pour continuer : tu en as ${coins}, il t’en manque ${price - coins}.`;
    }
    btn.hidden = !state.canRescue;
    info.hidden = !state.canRescue;
}

/** Récompense de l'objectif du jour : pièces + une carte (même fenêtre que les coffres). Depuis Défis ou l'écran de fin. */
function claimGoalReward() {
    const data = state.data, today = todayKey();
    if (data.claimedGoals[today] || dayXpNow() < data.goal) return false;
    const reward = (GOAL_CHOICES.find(c => c.xp === data.goal) || GOAL_CHOICES[1]).reward;
    data.claimedGoals[today] = true;
    data.coins += reward;
    saveData();
    renderHeader();
    openCardBoxes([{ size: GOAL_CARDS }], `🎯 +${reward} 🪙 et une carte !`);
    return true;
}

/* 4 · Objectif du jour atteint PAR CETTE PARTIE (2026-10-27) : sur l'écran de fin, l'anneau monte de l'XP d'avant la partie
   à celle d'après (vrais chiffres, s'arrête plein si on dépasse), devient doré avec un « ding », bouton « Réclamer » sur place.
   Pas réclamé ici → la pastille de Défis s'allume comme avant. */
let goalAnim = null;
function renderEndGoal() {
    const box = $('endGoal');
    cancelAnimationFrame(goalAnim);
    box.hidden = !state.goalReached;
    box.replaceChildren();
    box.classList.remove('is-done', 'is-got');
    if (!state.goalReached) return;
    const data = state.data, goal = data.goal;
    const from = Math.min(state.dayXpStart || 0, goal), to = dayXpNow();
    const reward = (GOAL_CHOICES.find(c => c.xp === goal) || GOAL_CHOICES[1]).reward;
    const R = 25, C = 2 * Math.PI * R;
    box.innerHTML = `<svg class="end-goal-ring" viewBox="0 0 60 60" aria-hidden="true"><circle class="bg" cx="30" cy="30" r="${R}"/><circle class="fg" cx="30" cy="30" r="${R}" stroke-dasharray="${C.toFixed(1)}"/></svg>`;
    const pct = el('span', 'end-goal-pct');
    const info = el('div', 'end-goal-info');
    const title = el('b');
    title.textContent = 'Objectif du jour';
    const sub = el('span');
    const claim = el('button', 'end-goal-claim');
    claim.type = 'button';
    claim.textContent = `Réclamer ${reward} 🪙`;
    const got = el('span', 'end-goal-got');
    got.textContent = `✓ +${reward} 🪙 reçues`;
    if (data.claimedGoals[todayKey()]) box.classList.add('is-got');
    claim.addEventListener('click', () => { if (claimGoalReward()) { box.classList.add('is-got'); updateNavNotifications(); } });
    info.append(title, sub, claim, got);
    box.append(pct, info);
    const fg = box.querySelector('.fg');
    const draw = v => {
        fg.style.strokeDashoffset = (C * (1 - Math.min(1, v / goal))).toFixed(1);
        sub.textContent = `${Math.round(v)} / ${goal} XP`;
        pct.textContent = v >= goal ? '🎯' : `${Math.round(v / goal * 100)} %`;
    };
    draw(from);
    const t0 = performance.now() + 500, dur = 1200;
    const step = now => {
        const k = Math.max(0, Math.min(1, (now - t0) / dur));
        const v = from + (to - from) * (1 - Math.pow(1 - k, 3));
        draw(v);
        if (v >= goal && !box.classList.contains('is-done')) { box.classList.add('is-done'); title.textContent = 'Objectif atteint !'; playSound('ding'); }
        if (k < 1) goalAnim = requestAnimationFrame(step);
    };
    goalAnim = requestAnimationFrame(step);
}

/* ---------- Fin de leçon ---------- */

// Kulti remplace le grand dessin de l'écran de fin (2026-10-27) : réussi = content, exploit = fier, raté = déçu + cœur brisé
const END_FACES = { '🎉': 'content', '🏆': 'fier', '🏅': 'fier', '💔': 'triste' };
function setEnd({ emoji, face, title, text, extra = '', stats = [], primary, primaryClass, onPrimary, secondary, onSecondary }) {
    renderEndStats(stats);
    renderEndGoal();
    if (state.pendingTitle) { const t = state.pendingTitle; state.pendingTitle = null; celebrate(() => showTitleAnim(t)); }
    const mood = face || END_FACES[emoji];
    $('endEmoji').classList.toggle('is-kulti', !!mood);
    if (mood) $('endEmoji').replaceChildren(kultiEl(mood, 'kulti-blink kulti-float', emoji === '💔'));
    else $('endEmoji').textContent = emoji;
    $('endRescue').hidden = true;
    $('endRescueInfo').hidden = true;
    state.canRescue = false;
    $('endTitle').textContent = title;
    $('endText').textContent = text;
    const missions = (state.missionsJustDone || []).map(m => `🗓️ Mission réussie : ${m.text(m.goal, m.theme)} !`);
    if (state.replay && ['level', 'pairs', 'order', 'challenge'].includes(state.mode)) missions.unshift(replayXpLeft() > 0
        ? `🔁 Niveau déjà réussi : XP réduite (2 par bonne réponse, sans bonus), encore ${replayXpLeft()} XP possibles aujourd’hui${state.replayCounts ? ' ; il compte pour tes missions' : ''}.`
        : `🔁 Niveau déjà réussi : plus d’XP pour les niveaux refaits aujourd’hui (${REPLAY_XP_DAY} XP par jour, ça revient demain)${state.replayCounts ? ' ; il compte pour tes missions' : ''}.`);
    const unlocked = avCheck();
    if (unlocked.length) missions.push(`🎨 Débloqué pour ton avatar : ${unlocked.slice(0, 3).map(avLabel).join(', ')}${unlocked.length > 3 ? ` et ${unlocked.length - 3} autre${unlocked.length > 4 ? 's' : ''}` : ''} ! (Profil → ton avatar)`);
    state.missionsJustDone = [];
    $('endExtra').textContent = [extra, ...missions].filter(Boolean).join('\n');
    $('endPrimary').textContent = primary;
    $('endPrimary').className = `btn ${primaryClass || (secondary ? 'btn-red' : 'btn-green')}`;
    $('endSecondary').hidden = !secondary;
    $('endSecondary').textContent = secondary || '';
    state.onEndPrimary = onPrimary;
    state.onEndSecondary = onSecondary || null;
}

function endSession(win) {
    stopTimer();
    queueStats(win ? 'won' : 'lost');
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
            text: '💔 Plus de cœurs. Les questions ratées reviendront en révision.',
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

    if (mode === 'training') {
        celebrate = false;
        endTraining();
    } else if (mode === 'event') {
        celebrate = false;
        endEvent();
    } else if (mode === 'duel') {
        celebrate = false;
        endDuel();
    } else if (mode === 'review') {
        state.data.totals.reviews++;
        addXp(XP_REVIEW_WIN);
        missionEvent('reviews');
        const dropLine = earnPracticeDrop();
        setEnd({
            emoji: '💪',
            title: 'Révision terminée',
            text: `${plural(state.total, 'question revue', 'questions revues')}.`,
            stats: [statXp(), statAccuracy(), statTime()],
            extra: [rewardSummary(), dropLine].filter(Boolean).join('\n'),
            primary: 'Continuer',
            onPrimary: returnToMap
        });
    } else if (mode === 'daily') {
        const day = todayKey();
        const seconds = Math.round((Date.now() - state.startedAt) / 1000);
        state.data.daily[day] = { score: state.correct, seconds, grid: state.grid.join(''), answers: state.answers };
        addXp(XP_DAILY_DONE);
        missionEvent('daily');
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
                ? `Tu commences au niveau ${start} ! Les niveaux 1 à ${start - 1} sont validés (+${state.placementXp} XP) : tu peux les rejouer quand tu veux.`
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
        missionEvent('sprint', state.correct);
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
        if (state.errors === 0 && !state.replay) {
            addXp(XP_FLAWLESS);
            state.data.totals.flawless++;
        }
        if (challenge && !state.replay) addXp(XP_CHALLENGE_WIN);
        if (state.replayCounts) {   // niveau refait : compte pour les missions s'il fait partie des 20 derniers, une fois par jour
            if (state.replay) replayToday().levels[state.replayLevel] = 1;
            missionEvent('levels');
            if (state.errors === 0) missionEvent('flawless');
            if (mode === 'order') missionEvent('order');
            if (mode === 'pairs') missionEvent('pairs');
        }
        // Après un placement : une part des pièces des niveaux sautés (sans le dire, comme les cartes des coffres)
        const owed = state.replay ? 0 : Math.min(COIN_BONUS_PER_LEVEL, state.data.coinBonus);
        if (owed > 0) {
            state.data.coinBonus -= owed;
            state.data.coins += owed;
            state.sessionCoins += owed;
        }

        state.data.done[state.level] = true;
        state.data.unlocked = Math.max(state.data.unlocked, Math.min(state.level + 1, MAX_LEVEL));

        const next = state.level < MAX_LEVEL
            ? `Le niveau ${state.level + 1} est débloqué.`
            : "Tu as terminé tous les niveaux. Ajoute des questions dans questions.js pour continuer !";
        setEnd({
            emoji: challenge ? '🏆' : '🎉',
            face: challenge || state.errors === 0 ? 'fier' : 'content',
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
    const sizes = orderSizes(level);
    const n = Math.max(...sizes);
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
    return families.map((family, i) => ({ family, items: pickOrderItems(family, t, sizes[i] || n, progress), placed: [], checked: false }));
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
    $('orderHelp').textContent = 'Touche les cartes dans l’ordre. Reste appuyé sur une carte placée pour la déplacer, touche-la pour la retirer.';
    $('orderTopLabel').textContent = `⬆ ${f.ends[0]}`;
    $('orderBottomLabel').textContent = `⬇ ${f.ends[1]}`;
    state.nudgePick = null;
    refreshNudgeView('order');
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
                const card = el('button', `order-card is-placed${round.nudged && round.nudged.slot === i ? ' is-nudged' : ''}`);
                card.type = 'button';
                card.textContent = round.items[idx].label;
                card.addEventListener('click', () => { if (Date.now() - orderDragEnd > 350) unplaceOrderCard(i); });
                card.addEventListener('pointerdown', e => startOrderDrag(e, i, card));
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

    renderNudgeBtn('order');
    const btn = $('orderBtn');
    btn.textContent = round.checked ? 'Continuer' : 'Vérifier';
    btn.disabled = !round.checked && round.placed.filter(x => x !== undefined).length < n;
}

/* Coup de pouce (2026-10-25) : on touche 👆, on lit ce qu'il fait, puis on touche la carte (frise) ou la case (paires)
   de son choix : elle va à sa bonne place / sa paire est révélée. Un par frise ou par grille ; en stock (boutique, 20 🪙)
   ou payé sur le moment (35 🪙). La carte ou la paire ainsi donnée ne rapporte pas d'XP. */
const NUDGE = () => SHOP.find(i => i.id === 'nudge');
function nudgeCost() {
    const d = state.data;
    return (d.inv.nudge || 0) > 0 ? { stock: true, text: `il t’en reste ${d.inv.nudge} en stock` } : { stock: false, price: NUDGE().spot, text: `${NUDGE().spot} 🪙 sur le moment (${NUDGE().price} 🪙 en stock, à la boutique)` };
}
function payNudge() {
    const d = state.data;
    const cost = nudgeCost();
    if (cost.stock) d.inv.nudge--;
    else if (d.coins >= cost.price) d.coins -= cost.price;
    else return false;
    saveData();
    renderHeader();
    return true;
}
function renderNudgeBtn(kind) {
    const btn = $(kind === 'order' ? 'orderNudge' : 'pairsNudge');
    const target = kind === 'order' ? state.orderRounds?.[state.orderIndex] : state.pairGrids?.[state.pairIndex];
    if (!target) { btn.hidden = true; return; }
    btn.hidden = false;
    const used = !!target.nudged;
    btn.classList.toggle('is-picking', state.nudgePick === kind);
    if (kind === 'order') {   // frise : petit bouton à gauche de « Vérifier », comme 💡 dans les questions
        btn.textContent = state.nudgePick === kind ? '✕' : '👆';
        btn.setAttribute('aria-label', used ? 'Coup de pouce déjà utilisé' : state.nudgePick === kind ? 'Annuler le coup de pouce' : 'Coup de pouce');
    } else btn.textContent = used ? '👆 Coup de pouce utilisé' : state.nudgePick === kind ? '✕ Annuler le coup de pouce' : '👆 Coup de pouce';
    btn.disabled = used || (kind === 'order' && target.checked);
}
async function askNudge(kind) {
    if (state.nudgePick === kind) { state.nudgePick = null; refreshNudgeView(kind); return; }   // annuler (rien n'est payé)
    const cost = nudgeCost();
    if (!cost.stock && state.data.coins < cost.price) { showToast(`Il te manque ${cost.price - state.data.coins} 🪙 (ou achète des coups de pouce à la boutique).`); return; }
    const ok = await askConfirm({
        title: '👆 Coup de pouce',
        text: `${kind === 'order' ? 'Touche ensuite la carte de ton choix : elle se place toute seule à sa bonne place.' : 'Touche ensuite la case de ton choix : sa paire est révélée.'} Un seul par ${kind === 'order' ? 'frise' : 'grille'}, et il ne rapporte pas d’XP.\n${cost.stock ? `👆 ${cost.text}` : `🪙 ${cost.text}`}`,
        yes: kind === 'order' ? 'Choisir la carte' : 'Choisir la case', no: 'Annuler'
    });
    if (!ok) return;
    state.nudgePick = kind;
    refreshNudgeView(kind);
}
function refreshNudgeView(kind) {
    if (kind === 'order') {
        $('orderHelp').textContent = state.nudgePick === 'order' ? '👆 Touche la carte à placer.' : 'Touche les cartes dans l’ordre. Reste appuyé sur une carte placée pour la déplacer, touche-la pour la retirer.';
        $('orderView').classList.toggle('is-nudging', state.nudgePick === 'order');
    } else {
        $('pairsHelp').textContent = state.nudgePick === 'pairs' ? '👆 Touche la case dont tu veux voir la paire.' : 'Touche une case à gauche, puis la case qui va avec à droite.';
        $('pairsView').classList.toggle('is-nudging', state.nudgePick === 'pairs');
    }
    renderNudgeBtn(kind);
}
/** Frise : la carte choisie va à sa bonne place (et y reste). */
function nudgeOrderCard(idx) {
    const round = state.orderRounds[state.orderIndex];
    if (!payNudge()) return;
    const correct = [...round.items.keys()].sort((a, b) => round.items[a].value - round.items[b].value);
    const pos = correct.indexOf(idx);
    const from = round.placed.indexOf(idx);
    if (from >= 0) round.placed[from] = undefined;
    round.placed[pos] = idx;   // l'éventuelle carte qui était là retourne dans la pioche
    round.nudged = { slot: pos, idx };
    state.nudgePick = null;
    playSound('pair');
    refreshNudgeView('order');
    renderOrder();
}

/* Frise (2026-10-25) : rester appuyé sur une carte placée, puis la glisser plus haut ou plus bas : les autres cartes se
   décalent pour lui faire de la place, et elle s'insère là où on la lâche (comme une liste qu'on réordonne).
   La carte du coup de pouce ne bouge pas. Un simple tap retire la carte, comme avant. */
let orderDragEnd = 0;
/** Déplace la carte de la case `from` vers la case `to` en décalant les autres (la case verrouillée reste en place). */
function moveOrderCard(round, from, to) {
    const locked = round.nudged ? round.nudged.slot : -1;
    const keys = round.items.map((_, k) => k).filter(k => k !== locked);
    const vals = keys.map(k => round.placed[k]);
    const a = keys.indexOf(from);
    const b = keys.indexOf(to);
    if (a < 0 || b < 0 || a === b) return false;
    const [v] = vals.splice(a, 1);
    vals.splice(b, 0, v);
    keys.forEach((k, j) => { round.placed[k] = vals[j]; });
    return true;
}
function startOrderDrag(e, slot, card) {
    if (state.phase !== 'order' || state.nudgePick === 'order') return;
    const round = state.orderRounds[state.orderIndex];
    const locked = round.nudged ? round.nudged.slot : -1;
    if (slot === locked) return;
    const startY = e.clientY;
    const slots = [...$('orderSlots').children];
    const tops = slots.map(li => li.getBoundingClientRect().top);
    const step = slots.length > 1 ? tops[1] - tops[0] : 48;
    let dragging = false;
    let target = slot;
    const timer = setTimeout(() => {
        dragging = true;
        card.classList.add('is-dragging');
        $('orderSlots').classList.add('is-sorting');
        try { card.setPointerCapture(e.pointerId); } catch (err) { /* tant pis */ }
        if (navigator.vibrate) navigator.vibrate(15);
    }, 220);
    const preview = () => {   // les autres cartes glissent d'une case pour faire la place
        slots.forEach((li, k) => {
            const c = li.querySelector('.order-card, .order-empty');
            if (!c || k === slot || k === locked) return;
            let shift = 0;
            if (slot < target && k > slot && k <= target) shift = -step;
            if (slot > target && k >= target && k < slot) shift = step;
            c.style.transform = shift ? `translateY(${shift}px)` : '';
        });
    };
    const move = ev => {
        const dy = ev.clientY - startY;
        if (!dragging) { if (Math.abs(dy) > 10) stop(); return; }   // on fait défiler : pas de glisser
        ev.preventDefault();
        card.style.transform = `translateY(${dy}px)`;
        const y = tops[slot] + dy + step / 2;
        let t = 0;
        tops.forEach((top, k) => { if (y >= top) t = k; });
        if (t === locked) t = target;   // on ne pose pas sur la carte du coup de pouce
        if (t !== target) { target = t; preview(); }
    };
    const stop = () => {
        clearTimeout(timer);
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', cancel);
    };
    const cancel = () => { stop(); if (dragging) { $('orderSlots').classList.remove('is-sorting'); renderOrder(); } };
    const up = () => {
        stop();
        if (!dragging) return;
        orderDragEnd = Date.now();
        $('orderSlots').classList.remove('is-sorting');
        if (moveOrderCard(round, slot, target)) playSound('pair');
        renderOrder();
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
}

/** La carte touchée va dans le premier emplacement libre. */
function placeOrderCard(idx) {
    if (state.phase !== 'order') return;
    if (state.nudgePick === 'order') { nudgeOrderCard(idx); return; }
    const round = state.orderRounds[state.orderIndex];
    let free = 0;
    while (round.placed[free] !== undefined) free++;
    round.placed[free] = idx;
    renderOrder();
}

function unplaceOrderCard(slot) {
    if (state.phase !== 'order') return;
    const round = state.orderRounds[state.orderIndex];
    if (state.nudgePick === 'order') { nudgeOrderCard(round.placed[slot]); return; }
    if (round.nudged && round.nudged.slot === slot) return;   // carte placée par le coup de pouce : elle reste
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
    const paid = right - (round.nudged ? 1 : 0);   // la carte donnée par le coup de pouce ne rapporte rien
    if (paid > 0) addXp(state.replay ? replayXp(paid) : XP_ORDER_CARD * paid);
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

/* ---------- Duels entre amis (2026-10-23, supabase/duels.sql) ---------- */
// Le lanceur joue 10 questions (tirées avec une graine), son score est enregistré ; l'ami a 48 h pour jouer les
// mêmes. Le plus de bonnes réponses gagne (égalité : le plus rapide). Gagnant : +20 🪙. Gratuit en gouttes.

const DUEL_SIZE = 10;
const DUEL_COINS = 20;        // gagnant
const DUEL_COINS_LOSE = 5;    // perdant : petite récompense de participation (2026-10-23)
const DUEL_COINS_TIE = 10;    // égalité parfaite : chacun
const duelPrize = res => (res > 0 ? DUEL_COINS : res < 0 ? DUEL_COINS_LOSE : DUEL_COINS_TIE);
const DUEL_HOURS = 48;

/** Les 10 questions d'un duel : les mêmes pour les deux joueurs (difficulté moyenne). */
/* Duels « v2- » (2026-10-23) : parcours + entraînement (~2 100 questions au lieu de 511).
   Liste FIGÉE (ids du parcours < 4000, entraînement x001-x150) pour que les deux joueurs aient les mêmes questions
   même si on ajoute des questions entre-temps. Anciennes graines (sans « v2- ») : parcours seul, comme avant. */
function duelQuestions(seed) {
    const ok = q => q.d >= 1.5 && q.d <= 3.5;
    let pool = QUESTIONS.filter(ok);
    if (seed.startsWith('v2-')) {
        pool = pool.filter(q => q.id < 4000).concat((typeof TRAINING_QUESTIONS === 'undefined' ? [] : TRAINING_QUESTIONS)
            .filter(q => ok(q) && q.id >= 10000 && q.id < 30000 && q.id % 1000 <= 150));
    }
    pool.sort((a, b) => a.id - b.id);
    return seededShuffle(pool, `duel-${seed}`).slice(0, DUEL_SIZE);
}

/** > 0 : le premier gagne ; < 0 : le second ; 0 : égalité parfaite. */
const duelCompare = (s1, t1, s2, t2) => (s1 - s2) || (t2 - t1);
const duelExpired = row => row.o_score === null && Date.now() - new Date(row.created_at).getTime() > DUEL_HOURS * 3600000;
const duelHoursLeft = row => Math.max(1, Math.ceil((DUEL_HOURS * 3600000 - (Date.now() - new Date(row.created_at).getTime())) / 3600000));
const duelFriend = id => league?.friends?.find(f => f.id === id) || null;
const duelsList = () => (league?.duels || []);
/** Duels reçus à jouer (pastille de l'onglet Classement). */
const duelsToPlay = () => cloudUser ? duelsList().filter(r => r.opponent === cloudUser.id && r.o_score === null && !duelExpired(r)) : [];

async function challengeFriend(f) {
    if (!cloudUser || !navigator.onLine) { showToast('📶 Il faut internet et un compte pour lancer un duel.'); return; }
    if (duelsList().some(r => r.challenger === cloudUser.id && r.opponent === f.id && r.o_score === null && !duelExpired(r))) {
        showToast(`⚔️ Un duel attend déjà ${f.pseudo}.`);
        return;
    }
    const ok = await askConfirm({
        title: `⚔️ Défier ${f.pseudo} ?`,
        text: `${DUEL_SIZE} questions, un seul essai chacune, sans cœurs ni gouttes. Ensuite, ${f.pseudo} aura ${DUEL_HOURS} h pour jouer les mêmes et faire mieux que toi. À égalité de bonnes réponses, le plus rapide gagne.`,
        yes: 'C’est parti'
    });
    if (!ok) return;
    $('friendModal').hidden = true;
    state.duel = { role: 'challenger', seed: 'v2-' + Math.random().toString(36).slice(2, 12), friend: { id: f.id, pseudo: f.pseudo } };
    startSession('duel');
}

async function playDuel(row) {
    const f = duelFriend(row.challenger);
    const pseudo = f?.pseudo || 'Ton ami';
    if (!navigator.onLine) { showToast('📶 Il faut internet pour jouer un duel.'); return; }
    const ok = await askConfirm({
        title: `⚔️ Duel de ${pseudo}`,
        text: `${DUEL_SIZE} questions, un seul essai chacune. Son score reste caché jusqu’à la fin : à toi de faire mieux ! À égalité de bonnes réponses, le plus rapide gagne.`,
        yes: 'Jouer'
    });
    if (!ok) return;
    state.duel = { role: 'opponent', seed: row.seed, row, friend: { id: row.challenger, pseudo } };
    startSession('duel');
}

/** Fin d'un duel : on enregistre le score (lanceur) ou on répond et on compare (ami). */
async function endDuel() {
    const du = state.duel;
    const score = state.correct;
    const seconds = Math.round((Date.now() - state.startedAt) / 1000);
    const grid = state.grid.join('');
    // Mes réponses, pour « Revoir les questions » (20 derniers duels gardés)
    const da = state.data.duelAnswers;
    da[du.seed] = state.answers.slice(0, DUEL_SIZE);
    Object.keys(da).slice(0, -20).forEach(k => delete da[k]);
    saveData();
    setEnd({
        emoji: '⚔️',
        title: 'Duel terminé',
        text: `${score}/${DUEL_SIZE} · envoi…`,
        stats: [{ icon: '✅', label: 'Score', value: score, format: v => `${v}/${DUEL_SIZE}`, tone: 'violet' }, statXp(), statTime()],
        extra: rewardSummary(),
        primary: 'Voir mes duels',
        primaryClass: 'btn-violet',
        onPrimary: returnToMap
    });
    const c = cloudClient();
    try {
        if (du.role === 'challenger') {
            const { error } = await c.from('duels').insert({ challenger: cloudUser.id, opponent: du.friend.id, seed: du.seed,
                c_score: score, c_seconds: seconds, c_grid: grid });
            $('endText').textContent = error
                ? '😕 Le duel n’a pas pu être envoyé. Réessaie plus tard.'
                : `${grid}\nDuel envoyé à ${du.friend.pseudo} ! Il a ${DUEL_HOURS} h pour battre ton ${score}/${DUEL_SIZE} en ${fmtTime(seconds)}.`;
        } else {
            const row = du.row;
            const { error } = await c.from('duels').update({ o_score: score, o_seconds: seconds, o_grid: grid }).eq('id', row.id);
            if (error) {
                $('endText').textContent = '😕 Ton score n’a pas pu être envoyé (duel expiré ?).';
            } else {
                const res = duelCompare(score, seconds, row.c_score, row.c_seconds);
                const d = state.data;
                d.duelsSeen[row.id] = 1;
                d.duelsViewed[row.id] = 1;
                d.coins += duelPrize(res);
                if (res > 0) { d.totals.duelsWon = (d.totals.duelsWon || 0) + 1; launchConfetti(); }
                saveData();
                renderHeader();
                $('endEmoji').classList.remove('is-kulti');
                $('endEmoji').textContent = res > 0 ? '🏆' : res < 0 ? '😅' : '🤝';
                $('endTitle').textContent = res > 0 ? 'Duel gagné !' : res < 0 ? 'Duel perdu' : 'Égalité parfaite !';
                $('endText').textContent = `Toi : ${score}/${DUEL_SIZE} en ${fmtTime(seconds)} · ${du.friend.pseudo} : ${row.c_score}/${DUEL_SIZE} en ${fmtTime(row.c_seconds)}`
                    + `\n+${duelPrize(res)} 🪙`;
            }
        }
    } catch (err) {
        $('endText').textContent = '😕 Pas de connexion : le duel n’a pas pu être envoyé.';
    }
    lastLeagueLoad = 0;
    leagueFetch();
}

/** Après chaque mise à jour du classement : duel reçu, résultat d'un duel lancé (pièces du gagnant). */

/** Nouveau résultat pas encore regardé (pastille) : un duel lancé par moi, que l'ami vient de jouer. */
const duelUnviewed = r => r.challenger === cloudUser?.id && r.o_score !== null && !state.data.duelsViewed[r.id];
const duelsNewResults = () => cloudUser ? duelsList().filter(duelUnviewed) : [];
const duelsBadge = () => duelsToPlay().length + duelsNewResults().length;
/** Nouveaux résultats regardés : la pastille disparaît, et les pièces des duels gagnés sont données maintenant
    (une seule fois, `duelsSeen`). Renvoie les nouveautés, pour les annoncer en haut de l'historique. */
function markDuelsViewed(otherId) {
    const d = state.data;
    const news = duelsList().filter(r => duelUnviewed(r) && r.opponent === otherId);
    news.forEach(r => {
        d.duelsViewed[r.id] = 1;
        if (!d.duelsSeen[r.id]) {
            d.duelsSeen[r.id] = 1;
            const res = duelCompare(r.c_score, r.c_seconds, r.o_score, r.o_seconds);
            d.coins += duelPrize(res);
            if (res > 0) d.totals.duelsWon = (d.totals.duelsWon || 0) + 1;
        }
    });
    if (news.length) {
        saveData();
        renderHeader();
        updateNavNotifications();
        if (!$('leagueScreen').hidden) renderLeague();
    }
    return news;
}

/** Revoir les 10 questions d'un duel : bonne réponse, ma réponse si fausse, ✅/❌ de chacun. */
function openDuelReview(row) {
    const me = cloudUser.id;
    const mine = row.challenger === me;
    const f = duelFriend(mine ? row.opponent : row.challenger);
    const pseudo = f?.pseudo || 'Ton ami';
    const myGrid = [...((mine ? row.c_grid : row.o_grid) || '')];
    const hisGrid = [...((mine ? row.o_grid : row.c_grid) || '')];
    const typedAll = state.data.duelAnswers[row.seed] || null;
    const body = $('friendBody');
    body.replaceChildren();
    const h = el('h2', 'review-title');
    const [s1, s2] = mine ? [row.c_score, row.o_score] : [row.o_score, row.c_score];
    h.textContent = `⚔️ Toi ${s1}/${DUEL_SIZE} · ${pseudo} ${s2 ?? '?'}/${DUEL_SIZE}`;
    const note = el('p', 'muted review-note');
    const [t1, t2] = mine ? [row.c_seconds, row.o_seconds] : [row.o_seconds, row.c_seconds];
    note.textContent = hisGrid.length
        ? `⏱ Toi ${fmtTime(t1)} · ${pseudo} ${fmtTime(t2)}${s1 === s2 ? ' : même score, le plus rapide gagne' : ''}.`
        : `${pseudo} n’a pas encore joué.`;
    body.append(h, note);
    const back = el('button', 'duel-back');
    back.type = 'button';
    back.textContent = `← Tous les duels contre ${pseudo}`;
    back.addEventListener('click', () => openDuelHistory(mine ? row.opponent : row.challenger));
    body.prepend(back);
    const list = el('ol', 'review-list');
    duelQuestions(row.seed).forEach((q, i) => {
        const ok = myGrid[i] === '🟩';
        const li = el('li', `review-item ${ok ? 'is-ok' : 'is-ko'}`);
        const head = el('div', 'review-q');
        head.textContent = `${i + 1}. ${ok ? '✅' : '❌'} ${q.q}`;
        li.append(head);
        if (q.flag || q.rebus || q.photo) {
            const media = el('div', 'review-media');
            if (q.flag) media.append(flagImg(q.flag));
            else if (q.rebus) media.append(...q.rebus.map(emojiImg));
            else { const img = el('img'); img.src = q.photo; img.alt = ''; img.loading = 'lazy'; media.append(img); }
            li.append(media);
        }
        const ans = el('div', 'review-a');
        ans.textContent = `Réponse : ${q.a[0]}`;
        li.append(ans);
        if (!ok && typedAll) {
            const t = el('div', 'review-me');
            t.textContent = typedAll[i] ? `Toi : ${typedAll[i]}` : 'Toi : pas de réponse';
            li.append(t);
        }
        if (hisGrid.length) {
            const fr = el('div', 'review-friends');
            fr.textContent = `${pseudo} ${hisGrid[i] === '🟩' ? '✅' : '❌'}`;
            li.append(fr);
        }
        list.append(li);
    });
    body.append(list);
    $('friendModal').hidden = false;
    $('friendModal').querySelector('.modal-content').scrollTop = 0;
}

/** Duels terminés contre un ami (du plus récent au plus ancien), avec le résultat vu de mon côté. */
function duelsWith(otherId) {
    const me = cloudUser.id;
    return duelsList().filter(r => r.o_score !== null && (r.challenger === otherId || r.opponent === otherId)).map(r => {
        const mine = r.challenger === me;
        const [s1, t1, s2, t2] = mine ? [r.c_score, r.c_seconds, r.o_score, r.o_seconds] : [r.o_score, r.o_seconds, r.c_score, r.c_seconds];
        return { row: r, s1, s2, t1, t2, res: duelCompare(s1, t1, s2, t2) };
    });
}
const duelTally = games => ({ w: games.filter(g => g.res > 0).length, l: games.filter(g => g.res < 0).length, t: games.filter(g => g.res === 0).length });
const tallyText = ({ w, l, t }) => `${w} V · ${l} D${t ? ` · ${t} N` : ''}`;
const duelLine = g => `${g.res > 0 ? '🏆' : g.res < 0 ? '😅' : '🤝'} ${g.s1}/${DUEL_SIZE} contre ${g.s2}/${DUEL_SIZE}`;

/** Historique avec un ami : bilan, revanche, et chaque duel (tap = revoir ses questions). */
function openDuelHistory(otherId) {
    const f = duelFriend(otherId);
    const pseudo = f?.pseudo || 'Ton ami';
    const games = duelsWith(otherId);
    const tally = duelTally(games);
    const news = markDuelsViewed(otherId);   // nouveaux résultats vus : pastille effacée, pièces données
    const body = $('friendBody');
    body.replaceChildren();
    const head = el('div', 'friend-head');
    const h = el('h2');
    h.textContent = `⚔️ Toi contre ${pseudo}`;
    const sub = el('p', 'friend-title');
    sub.textContent = `${plural(tally.w, 'victoire', 'victoires')} · ${plural(tally.l, 'défaite', 'défaites')}${tally.t ? ` · ${plural(tally.t, 'égalité', 'égalités')}` : ''}`;
    head.append(avatarEl(pseudo, f?.look, 'is-big'), h, sub);
    body.append(head);
    if (news.length) {
        const won = news.filter(r => duelCompare(r.c_score, r.c_seconds, r.o_score, r.o_seconds) > 0);
        const coins = news.reduce((sum, r) => sum + duelPrize(duelCompare(r.c_score, r.c_seconds, r.o_score, r.o_seconds)), 0);
        const last = news[0];
        const res = duelCompare(last.c_score, last.c_seconds, last.o_score, last.o_seconds);
        const banner = el('p', `duel-news ${won.length ? 'is-win' : 'is-loss'}`);
        const byTime = last.c_score === last.o_score
            ? ` au temps (${fmtTime(Math.min(last.c_seconds, last.o_seconds))} contre ${fmtTime(Math.max(last.c_seconds, last.o_seconds))})` : '';
        const lost = news.length - won.length - news.filter(r => duelCompare(r.c_score, r.c_seconds, r.o_score, r.o_seconds) === 0).length;
        banner.textContent = (news.length > 1
            ? `⚔️ ${news.length} nouveaux résultats contre ${pseudo} : ${plural(won.length, 'victoire', 'victoires')}, ${plural(lost, 'défaite', 'défaites')}.`
            : res > 0 ? `🎉 ${pseudo} a joué ton duel : tu gagnes ${last.c_score} à ${last.o_score}${byTime} !`
            : res < 0 ? `😅 ${pseudo} a joué ton duel et gagne ${last.o_score} à ${last.c_score}${byTime}.`
            : `🤝 ${pseudo} a joué ton duel : égalité parfaite !`)
            + ` +${coins} 🪙`;
        body.append(banner);
        if (won.length) playSound('win');
    }
    if (f) {
        const again = el('button', 'btn btn-violet btn-full');
        again.type = 'button';
        again.textContent = '⚔️ Revanche';
        again.addEventListener('click', () => challengeFriend(f));
        body.append(again);
    }
    const ul = el('ul', 'league-people duel-history');
    games.forEach(g => {
        const li = el('li', 'friend-row duel-row');
        const name = el('span', 'friend-name');
        const b = el('b');
        b.textContent = duelLine(g);
        const i = el('span', 'friend-info');
        i.textContent = new Date(g.row.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
            + ` · toi ${fmtTime(g.t1)}, ${pseudo} ${fmtTime(g.t2)}`
            + (g.s1 === g.s2 && g.res !== 0 ? ' (départagés au temps)' : '')
            + ` · +${duelPrize(g.res)} 🪙`;
        name.append(b, i);
        const go = el('span', 'friend-go');
        go.textContent = '›';
        li.append(name, go);
        li.addEventListener('click', () => openDuelReview(g.row));
        ul.append(li);
    });
    body.append(ul);
    $('friendModal').hidden = false;
    $('friendModal').querySelector('.modal-content').scrollTop = 0;
}

/** « + » : liste des amis ; un tap = le défier (un duel déjà en attente avec lui est signalé). */
function openDuelPicker() {
    const me = cloudUser.id;
    const body = $('friendBody');
    body.replaceChildren();
    const h = el('h2', 'review-title');
    h.textContent = '⚔️ Qui veux-tu défier ?';
    body.append(h);
    if (!league.friends.length) {
        const p = el('p', 'muted');
        p.textContent = 'Ajoute d’abord des amis (carte « 👥 Amis », juste en dessous).';
        body.append(p);
    }
    const ul = el('ul', 'league-people duel-history');
    league.friends.forEach(f => {
        const waiting = duelsList().some(r => r.challenger === me && r.opponent === f.id && r.o_score === null && !duelExpired(r));
        const tally = duelTally(duelsWith(f.id));
        const li = el('li', `friend-row duel-row${waiting ? ' is-static' : ''}`);
        const name = el('span', 'friend-name');
        const b = el('b');
        b.textContent = f.pseudo;
        const i = el('span', 'friend-info');
        i.textContent = waiting ? '⏳ un duel l’attend déjà'
            : tally.w + tally.l + tally.t ? `Bilan : ${tallyText(tally)}` : 'Pas encore de duel';
        name.append(b, i);
        li.append(avatarEl(f.pseudo, f.look, 'is-small'), name);
        if (!waiting) {
            const go = el('span', 'duel-go');
            go.textContent = '⚔️';
            li.append(go);
            li.addEventListener('click', () => challengeFriend(f));
        }
        ul.append(li);
    });
    body.append(ul);
    $('friendModal').hidden = false;
    $('friendModal').querySelector('.modal-content').scrollTop = 0;
}

/** Carte « ⚔️ Duels » de l'onglet Classement : une ligne compacte par duel (avatar, pseudo, état, score).
    Duel terminé : tap = le détail (questions, revanche, profil). Duel reçu : bouton « Jouer ». */
/* Listes longues (amis, duels) : 5 lignes au plus, puis « Voir tous (N) › » (2026-10-24, demande de l'utilisateur :
   sinon la carte devient immense). L'état ouvert / fermé est gardé pendant les mises à jour automatiques. */
const LIST_MAX = 5;
const listsOpen = new Set();
function capList(box, ul, key, max = LIST_MAX) {
    const rows = [...ul.children];
    if (rows.length <= max) return;
    const open = listsOpen.has(key);
    if (!open) rows.slice(max).forEach(li => { li.hidden = true; });
    const more = el('button', 'link-btn list-more');
    more.type = 'button';
    more.textContent = open ? 'Voir moins' : `Voir tous (${rows.length}) ›`;
    more.addEventListener('click', () => {
        if (listsOpen.has(key)) listsOpen.delete(key); else listsOpen.add(key);
        renderLeague();
    });
    box.append(more);
}

function renderDuelsCard(grid) {
    const me = cloudUser.id;
    const box = el('article', 'card league-duels');
    const head = el('div', 'duel-head');
    const h = el('h2');
    h.textContent = '⚔️ Duels';
    const plus = el('button', 'duel-new');
    plus.type = 'button';
    plus.textContent = '+';
    plus.setAttribute('aria-label', 'Nouveau duel : choisir un ami');
    plus.addEventListener('click', openDuelPicker);
    const badge = duelsBadge();
    if (badge) h.setAttribute('data-notif', badge);
    head.append(h, plus);
    box.append(head);
    const list = duelsList();
    const ul = el('ul', 'league-people duel-list');
    const add = (otherId, info, cls, { onRow = null, right = null, dot = 0 } = {}) => {
        const f = duelFriend(otherId);
        const pseudo = f?.pseudo || '?';
        const li = el('li', `friend-row duel-row ${cls}`);
        if (dot) li.setAttribute('data-notif', dot);
        const name = el('span', 'friend-name');
        const b = el('b');
        b.textContent = pseudo;
        const i = el('span', 'friend-info');
        i.textContent = info;
        name.append(b, i);
        li.append(avatarEl(pseudo, f?.look, 'is-small'), name);
        if (right) li.append(right);
        const tap = onRow || (f ? () => openFriendProfile(f) : null);
        if (tap) li.addEventListener('click', tap);
        else li.classList.add('is-static');
        ul.append(li);
    };
    const playBtn = r => {
        const b = el('button', 'btn btn-violet btn-small duel-play');
        b.type = 'button';
        b.textContent = 'Jouer';
        b.addEventListener('click', e => { e.stopPropagation(); playDuel(r); });
        return b;
    };
    // À jouer, puis en attente, puis les 5 derniers résultats
    list.filter(r => r.opponent === me && r.o_score === null && !duelExpired(r)).forEach(r => {
        add(r.challenger, `⚔️ te défie · ${duelHoursLeft(r)} h`, 'is-todo', { onRow: () => playDuel(r), right: playBtn(r), dot: 1 });
    });
    list.filter(r => r.challenger === me && r.o_score === null && !duelExpired(r)).forEach(r => {
        add(r.opponent, `⏳ doit jouer · toi ${r.c_score}/${DUEL_SIZE}`, 'is-wait');
    });
    // Duels terminés : une ligne par ami, avec le bilan (pastille) et le dernier duel en clair
    const others = [...new Set(list.filter(r => r.o_score !== null).map(r => (r.challenger === me ? r.opponent : r.challenger)))];
    others.forEach(otherId => {
        const games = duelsWith(otherId);
        const tally = duelTally(games);
        const pill = el('span', 'duel-right');
        const t = el('span', `duel-score ${tally.w > tally.l ? 'is-win' : tally.w < tally.l ? 'is-loss' : 'is-tie'}`);
        t.textContent = tallyText(tally);
        t.title = 'Bilan de vos duels';
        const go = el('span', 'friend-go');
        go.textContent = '›';
        pill.append(t, go);
        const g = games[0];
        const fresh = games.filter(x => duelUnviewed(x.row)).length;
        add(otherId, `Dernier : ${g.res > 0 ? '🏆' : g.res < 0 ? '😅' : '🤝'} ${g.s1} à ${g.s2}`, 'is-old', { onRow: () => openDuelHistory(otherId), right: pill, dot: fresh });
    });
    if (!ul.children.length) {
        const p = el('p', 'muted');
        p.textContent = league.friends.length
            ? 'Touche « + » pour défier un ami en duel !'
            : 'Ajoute des amis pour les défier en duel !';
        box.append(p);
    } else { box.append(ul); capList(box, ul, 'duels'); }
    grid.append(box);
}

/* ---------- Statistiques anonymes (2026-10-23, supabase/statistiques.sql) ---------- */
// Pour régler le jeu : quelles questions sont ratées par presque tous, quels niveaux sont abandonnés.
// AUCUN compte ni pseudo envoyé : seulement « question n° X, réussie ou non au 1er essai » et « niveau N : réussi /
// raté / abandonné ». File d'attente sur l'appareil (hors sauvegarde), envoyée dès qu'il y a internet.
const STATS_KEY = 'kultivo_stats';
const STATS_MODES = ['level', 'challenge', 'pairs', 'order', 'review', 'training', 'event', 'daily', 'sprint', 'duel'];
const STATS_LEVEL_MODES = ['level', 'challenge', 'pairs', 'order'];
let statsBusy = false;

function readStatsQueue() {
    try { return JSON.parse(localStorage.getItem(STATS_KEY) || '[]'); } catch (err) { return []; }
}
function writeStatsQueue(list) {
    if (BAC) return;
    try { localStorage.setItem(STATS_KEY, JSON.stringify(list.slice(-50))); } catch (err) { /* tant pis */ }
}

/** 1re réponse à chaque question de la partie (les essais suivants ne comptent pas). */
function noteStatsAnswer(id, ok) {
    if (!STATS_MODES.includes(state.mode) || state.statsSeen.has(id)) return;
    state.statsSeen.add(id);
    state.statsAnswers.push({ q: id, ok: !!ok });
}

/** Fin (ou abandon) d'une partie : on met de côté ce qui n'a pas encore été envoyé. */
function queueStats(outcome) {
    if (!STATS_MODES.includes(state.mode)) return;
    const answers = state.statsAnswers.splice(0, 60);
    const level = STATS_LEVEL_MODES.includes(state.mode) && !state.statsLevelSent ? state.level : null;
    if (level) state.statsLevelSent = true;   // un cœur de secours puis une victoire : le niveau n'est compté qu'une fois
    if (!answers.length && !level) return;
    writeStatsQueue([...readStatsQueue(), { a: answers, l: level, o: level ? outcome : null }]);
    flushStats();
}

async function flushStats() {
    const c = cloudClient();
    if (statsBusy || !c || !navigator.onLine) return;
    statsBusy = true;
    try {
        let list = readStatsQueue();
        while (list.length) {
            const x = list[0];
            const { error } = await c.rpc('record_stats', { p_answers: x.a, p_level: x.l, p_outcome: x.o });
            if (error) break;   // fonction pas encore créée (SQL à lancer) ou réseau : on réessaiera
            list = list.slice(1);
            writeStatsQueue(list);
        }
    } catch (err) { /* hors ligne */ }
    statsBusy = false;
}

/* ---------- Sauvegarde en ligne (Supabase, table « saves ») ---------- */

function cloudMeta() {
    try { return JSON.parse(localStorage.getItem(CLOUD_META_KEY) || '{}'); } catch (err) { return {}; }
}
function setCloudMeta(meta) {
    if (BAC) return;
    try { localStorage.setItem(CLOUD_META_KEY, JSON.stringify({ ...cloudMeta(), ...meta })); } catch (err) { /* tant pis */ }
}

function cloudClient() {
    if (BAC) return null;   // bac à sable : jamais en ligne
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
            if (remote && remote.data?.resetEpoch === RESET_EPOCH && (remote.xp || 0) > (state.data.xp || 0)) {
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
        if (remote.data?.resetEpoch !== RESET_EPOCH) { await cloudPush(true); return; }   // d'avant la remise à zéro : remplacée
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
    window.addEventListener('online', flushStats);
    setTimeout(flushStats, 4000);
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

/** Fermeture : le champ mot de passe redevient un simple champ texte vide. Sinon Chrome voit un formulaire de
    connexion dans la page et ajoute sa barre « clé / carte bancaire / adresse » au clavier, même pour répondre. */
function closeAuthModal() {
    $('authModal').hidden = true;
    $('authPassword').value = '';
    $('authPassword').type = 'text';
    $('authPassword').autocomplete = 'off';
    $('authEmail').autocomplete = 'off';
}
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
    $('authPassword').autocomplete = signup ? 'new-password' : 'current-password';
    $('authEmail').autocomplete = 'email';
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
    closeAuthModal();
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
function askConfirm({ title, text = '', yes = 'Oui', no = 'Annuler', danger = false, art = null }) {
    const nbsp = t => t.replace(/ ([?!:»])/g, ' $1');   // « ? » jamais seul en début de ligne
    $('askArt').replaceChildren(...(art ? [art] : []));
    $('askArt').hidden = !art;
    $('askTitle').textContent = nbsp(title);
    $('askText').textContent = nbsp(text);
    $('askText').hidden = !text;
    $('askYes').textContent = yes;
    $('askYes').classList.toggle('btn-red', danger);
    $('askYes').classList.toggle('btn-green', !danger);
    $('askNo').textContent = no || '';
    $('askNo').hidden = !no;   // no: null → un seul bouton (simple information)
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
    titleList().forEach(t => {
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

/* ---------- Entraînement par thème (banque séparée : entrainement/*.js) ----------
   5 paliers par thème (questions triées par difficulté). Pour monter : réussir les 2/3 du palier (au moins une
   fois) ET en maîtriser 1/3 (réussies encore un autre jour). Session de 10, uniquement la banque d'entraînement
   (le parcours a ses propres révisions) : au plus 2 révisions (erreurs d'abord), le reste en nouveautés.
   Sans cœurs, XP réduits. */
const TRAIN_TIERS = 5;
const TRAIN_SESSION = 10;
const TRAIN_MAX_REVIEWS = 2;
const TRAIN_TIER_NAMES = ['Découverte', 'Initié', 'Confirmé', 'Expert', 'Maître'];
const XP_TRAINING = 2;

const trainingBank = theme => (typeof TRAINING_QUESTIONS === 'undefined' ? [] : TRAINING_QUESTIONS)
    .filter(q => q.theme === theme).sort((a, b) => a.d - b.d || a.id - b.id);

/** Les 5 paliers d'un thème (du plus facile au plus dur). */
function trainingTiers(theme) {
    const bank = trainingBank(theme);
    const size = Math.ceil(bank.length / TRAIN_TIERS) || 1;
    return Array.from({ length: TRAIN_TIERS }, (_, i) => bank.slice(i * size, (i + 1) * size));
}
const trainTierOf = theme => Math.min(TRAIN_TIERS, Math.max(1, state.data.trainTier[theme] || 1));
const isMastered = id => (state.data.stats[id]?.streak || 0) >= 2;
const wasRight = id => (state.data.stats[id]?.right || 0) >= 1;

/** Où en est le palier en cours : réussies / maîtrisées, et ce qu'il faut pour monter. */
function trainingProgress(theme) {
    const tier = trainTierOf(theme);
    const qs = trainingTiers(theme)[tier - 1] || [];
    const right = qs.filter(q => wasRight(q.id)).length;
    const mastered = qs.filter(q => isMastered(q.id)).length;
    const needRight = Math.ceil(qs.length * 2 / 3);
    // Palier 1 → 2 : réussir suffit (on peut monter dès le 1er jour) ; ensuite il faut aussi maîtriser 1/3
    const needMastered = 0;   // règle simplifiée (2026-10-18) : seule la réussite compte pour monter
    const bank = trainingBank(theme);
    return {
        tier, right, mastered, needRight, needMastered, size: qs.length,
        ready: qs.length > 0 && right >= needRight,
        blockedToday: state.data.trainTierDay[theme] === todayKey(),   // déjà un palier gagné aujourd'hui
        totalMastered: bank.filter(q => isMastered(q.id)).length,
        total: bank.length
    };
}

const masterCard = theme => CARDS.find(c => c.theme === theme && c.rarity === 'master');

/** Coffres de palier pas encore donnés pour ce thème : 2 cartes du thème par palier gagné,
    + la carte Maître au palier 5. Les marque comme donnés (l'ouverture enregistre la sauvegarde). */
function trainChestBoxes(theme) {
    const tier = trainTierOf(theme);
    const from = state.data.trainChests[theme] || 1;
    const boxes = [];
    for (let t = from + 1; t <= tier; t++) {
        const box = { size: 2, theme };
        boxes.push(box);
    }
    if (tier > from) state.data.trainChests[theme] = tier;
    return boxes;
}

/** « 🥇 2 · 🥈 1 · 🥉 3 » : médailles d'entraînement gagnées (la plus haute de chaque thème). */
function trainMedalsText() {
    const counts = [0, 0, 0];
    for (const { theme } of THEME_DECOR) { const m = trainMedalOf(theme); if (m) counts[m - 1]++; }
    return counts.some(Boolean) ? [2, 1, 0].filter(i => counts[i]).map(i => `${TRAIN_MEDALS[i].icon} ${counts[i]}`).join(' · ') : 'aucune';
}

/** Coffres en attente sur tous les thèmes (paliers gagnés avant l'arrivée des coffres) : ouverts d'un coup. */
function claimPendingTrainChests() {
    if (!$('tour').hidden || !$('chestModal').hidden) return;
    const boxes = THEME_DECOR.flatMap(({ theme }) => trainChestBoxes(theme));
    if (boxes.length) openCardBoxes(boxes, boxes.length > 1 ? `🎁 ${boxes.length} coffres de palier !` : '🎁 Coffre de palier');
}

/* Médailles par thème : bronze (1/3 des questions maîtrisées), argent (2/3), or (toutes). */
const TRAIN_MEDALS = [
    { icon: '🥉', name: 'bronze', part: 1 / 3 },
    { icon: '🥈', name: 'argent', part: 2 / 3 },
    { icon: '🥇', name: 'or', part: 1 }
];
function trainMedalOf(theme) {
    const pr = trainingProgress(theme);
    return pr.total ? TRAIN_MEDALS.filter(m => pr.totalMastered >= Math.ceil(pr.total * m.part)).length : 0;
}

/** Monte d'un ou plusieurs paliers si les conditions sont remplies. Renvoie le nouveau palier. */
function updateTrainingTier(theme) {
    let tier = trainTierOf(theme);
    const pr = trainingProgress(theme);
    if (tier < TRAIN_TIERS && pr.ready && !pr.blockedToday) {
        tier++;
        state.data.trainTier[theme] = tier;
        state.data.trainTierDay[theme] = todayKey();   // au plus un palier par jour (et par thème)
    }
    return tier;
}

/** Les 10 questions d'une session. */
function pickTrainingCards(theme) {
    const tiers = trainingTiers(theme);
    const cur = trainTierOf(theme);
    const open = tiers.slice(0, cur).flat();               // paliers débloqués
    const seen = q => !!state.data.stats[q.id];
    const picked = [];
    const take = (list, max) => { for (const q of list) { if (picked.length >= TRAIN_SESSION || max <= 0) break; if (!picked.includes(q)) { picked.push(q); max--; } } };

    // 1) Révisions de l'entraînement (2 au plus) : erreurs d'abord, puis questions arrivées à échéance
    const missed = shuffle(open.filter(q => missCount(q.id) > 0 && !isLater(q.id))).sort((a, b) => missCount(b.id) - missCount(a.id));
    const due = shuffle(open.filter(q => seen(q) && missCount(q.id) === 0 && isDue(q) && !isMastered(q.id) && !isLater(q.id)));
    take([...missed, ...due], TRAIN_MAX_REVIEWS);
    // 3) Nouveautés : palier en cours d'abord, puis paliers d'avant
    take(shuffle((tiers[cur - 1] || []).filter(q => !seen(q))), TRAIN_SESSION);
    take(shuffle(open.filter(q => !seen(q))), TRAIN_SESSION);
    // 4) Plus rien de neuf : on s'exerce sur le palier en cours (les moins sues d'abord), puis le reste.
    //    Palier 5 réussi (2026-10-26) : les 150 questions du thème à égalité, les moins sues d'abord (vers la médaille d'or)
    const allDone = cur >= TRAIN_TIERS && trainingProgress(theme).ready;
    take(shuffle(allDone ? open : tiers[cur - 1] || []).sort((a, b) => streakOf(a.id) - streakOf(b.id)), TRAIN_SESSION);
    take(shuffle(open), TRAIN_SESSION);
    return shuffle(picked).map(q => ({ q, review: seen(q) }));
}

/** Ce qu'il reste à faire pour le palier suivant, en clair : « encore 3 questions à réussir et 4 à maîtriser ». */
function trainingLeftText(pr) {
    const right = Math.max(0, pr.needRight - pr.right);
    const mastered = Math.max(0, pr.needMastered - pr.mastered);
    const parts = [];
    if (right) parts.push(`${plural(right, 'question', 'questions')} à réussir`);
    if (mastered) parts.push(`${right ? mastered : plural(mastered, 'question', 'questions')} à maîtriser`);
    return parts.length ? `encore ${parts.join(' et ')}` : 'c’est bon !';
}

/** Avant de commencer : rappel du palier et de ce qu'il reste pour le suivant. */
async function confirmTraining(theme, icon) {
    const pr = trainingProgress(theme);
    // Court : le palier, ce qu'il reste pour le suivant, et la goutte à gagner
    const lines = [`Palier ${pr.tier}/${TRAIN_TIERS} · ${TRAIN_TIER_NAMES[pr.tier - 1]}`];
    const master = masterCard(theme);
    const hasMaster = master && state.data.cards[master.id];
    if (pr.tier < TRAIN_TIERS) {
        lines.push(!pr.ready ? `Palier ${pr.tier + 1} : ${trainingLeftText(pr)}${pr.blockedToday ? ' (au plus tôt demain)' : ''}`
            : pr.blockedToday ? `🌙 Palier ${pr.tier + 1} demain`
            : `🎉 Palier ${pr.tier + 1} à la fin de cette session !`);
    } else if (!hasMaster) {
        lines.push(!pr.ready ? `🏆 Carte Maître : ${trainingLeftText(pr)}${pr.blockedToday ? ' (au plus tôt demain)' : ''}`
            : pr.blockedToday ? '🌙 Carte Maître demain' : '🏆 Carte Maître à la fin de cette session !');
    } else {
        lines.push('🏆 Palier maximum');
    }
    if (pr.blockedToday) lines.push('✅ Palier du jour déjà gagné : tu peux continuer pour t’entraîner.');
    const bonus = dropBonusText();
    if (bonus) lines.push(bonus);
    const ok = await askConfirm({ title: `${icon} ${theme}`, text: lines.join('\n'), yes: 'Commencer', no: 'Plus tard' });
    if (ok) startTraining(theme);
}

function startTraining(theme) {
    if (!trainingBank(theme).length) { showToast('Questions bientôt disponibles pour ce thème.'); return; }
    state.trainTheme = theme;
    state.trainTierBefore = trainTierOf(theme);
    startSession('training');
}

function endTraining() {
    const theme = state.trainTheme;
    state.data.totals.trainings = (state.data.totals.trainings || 0) + 1;
    missionEvent('training');
    const before = state.trainTierBefore;
    const tier = updateTrainingTier(theme);
    const pr = trainingProgress(theme);
    const icon = (THEME_DECOR.find(t => t.theme === theme) || {}).icon || '🎯';
    let text;
    if (tier > before) text = `🎉 Palier ${tier} débloqué en ${theme} !`;
    else if (tier >= TRAIN_TIERS && pr.ready) text = `${icon} ${theme} : tu es au palier maximum, bravo !`;
    else {
        text = pr.ready && pr.blockedToday
            ? `🌙 Bravo ! Tu as déjà gagné un palier aujourd’hui en ${theme} : reviens demain pour passer au palier ${tier + 1}.`
            : `${icon} Pour passer au palier ${tier + 1} : ${trainingLeftText(pr)}.`;
    }
    const up = tier > before;
    // Palier 5 RÉUSSI (les 2/3 de ses questions) : la carte Maître (2026-10-25 : avant, elle venait dès l'arrivée au palier 5)
    const master = masterCard(theme);
    const masterNow = tier >= TRAIN_TIERS && !up && pr.ready && !pr.blockedToday && master && !state.data.cards[master.id];
    if (masterNow) {
        state.data.trainTierDay[theme] = todayKey();
        text = `🏆 ${theme} : palier 5 réussi ! Tu gagnes la carte Maître.`;
        launchConfetti();
        playSound('win');
    } else if (tier >= TRAIN_TIERS && !up && master && !state.data.cards[master.id]) {
        text = pr.ready && pr.blockedToday
            ? `🌙 Bravo ! Tu as déjà gagné un palier aujourd’hui : reviens demain pour réussir le palier 5 et gagner la carte Maître.`
            : `${icon} Pour réussir le palier 5 et gagner la carte Maître : ${trainingLeftText(pr)}.`;
    }
    if (up) {
        // Nouveau palier : on le dit en grand (titre, texte, bouton)
        text = `${icon} ${theme} : tu passes au palier ${tier} / ${TRAIN_TIERS} · ${TRAIN_TIER_NAMES[tier - 1]}.\nLes questions vont être un peu plus difficiles.`;
        launchConfetti();
        playSound('win');
    }
    // Médaille du thème (bronze, argent, or) gagnée pendant cette session ?
    const medal = trainMedalOf(theme);
    if (medal > (state.data.trainMedals[theme] || 0)) {
        state.data.trainMedals[theme] = medal;
        const m = TRAIN_MEDALS[medal - 1];
        text += `\n${m.icon} Médaille d’${m.name} en ${theme} !`;
        saveData();
    }
    const dropLine = earnPracticeDrop();
    setEnd({
        emoji: up ? '🏅' : '🎯',
        title: up ? `Palier ${tier} débloqué !` : masterNow ? 'Palier 5 réussi !' : `Entraînement · ${theme}`,
        text,
        stats: [statXp(), statAccuracy(), statTime()],
        extra: [rewardSummary(), dropLine].filter(Boolean).join('\n'),
        primary: up ? `Commencer le palier ${tier}` : 'Encore 10 questions',
        primaryClass: 'btn-green',
        onPrimary: () => startTraining(theme),
        secondary: 'Retour aux thèmes',
        onSecondary: () => { returnToMap(); setChallengesTab('training'); }
    });
    // Coffre du palier gagné (2 cartes du thème ; au palier 5, la carte Maître en plus)
    const boxes = trainChestBoxes(theme);
    if (masterNow) boxes.push({ size: 0, fixed: [master] });
    if (boxes.length) {
        setTimeout(() => openCardBoxes(boxes, masterNow ? `🏆 Carte Maître · ${theme}` : `🎁 Coffre du palier ${tier} · cartes ${theme}`), 900);
    }
}

/* Onglet Défis : deux sous-pages, « 🏆 Défis » et « 🎯 Entraînement » */
let challengesTab = 'defis';
function setChallengesTab(name) {
    if (name === 'training' && tourFlag === 'tipChallenges' && !$('tour').hidden) {   // tap direct sur l'onglet
        $('tour').hidden = true;
        state.data.tipChallenges = true;
        saveData();
    }
    if (name === 'event' && !currentEvent()) name = 'defis';   // événement terminé
    challengesTab = name;
    document.querySelectorAll('.challenges-tab').forEach(t => {
        const on = t.dataset.sub === name;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
    });
    $('defisPage').hidden = name !== 'defis';
    $('trainingPage').hidden = name !== 'training';
    $('eventPage').hidden = name !== 'event';
    if (name === 'event') { renderEvent(); setTimeout(showEventPageTip, 400); }
    if (name === 'training') {
        renderTraining();
        if (!state.data.tipTraining2) setTimeout(showTrainingTip, 400);
        else setTimeout(claimPendingTrainChests, 400);
    }
}

/** 1re visite de l'onglet Défis : objectif du jour, défi du jour, sprint, puis le sous-onglet « Entraînement » ;
    le dernier bouton (ou un tap sur l'onglet) y emmène, et l'explication de l'entraînement prend la suite. */
function showChallengesTip() {
    const d = state.data;
    if (d.tipChallenges || $('challengesScreen').hidden || !$('tour').hidden || !d.onboarded) return;
    if (d.tipTraining2 || challengesTab === 'training') { d.tipChallenges = true; saveData(); return; }   // déjà découvert
    tourSteps = [{
        target: () => document.querySelector('.goal-card'),
        text: '🎯 Ton objectif du jour : choisis ton rythme. Une fois atteint, reviens ici récupérer tes pièces !'
    }, {
        target: () => $('dailyCard'),
        text: '📅 Le défi du jour : 10 questions, les mêmes pour tout le monde, un seul essai. Compare ton score avec tes amis !'
    }, {
        target: () => $('sprintDesc').closest('.card'),
        text: '⚡ Le sprint : un maximum de bonnes réponses en 60 secondes. Bats ton record !'
    }, {
        target: () => document.querySelector('.challenges-tab[data-sub="training"]'),
        text: '🎯 Nouveau : l’entraînement par thème ! Touche ici pour le découvrir.'
    }];
    tourFlag = 'tipChallenges';
    tourLastLabel = 'Voir l’entraînement';
    tourStep = 0;
    $('tour').hidden = false;
    showTourStep();
}

/** Lance une petite visite : seulement les étapes dont l'élément est affiché. Renvoie false si aucune. */
function startTip(flag, steps, lastLabel = 'Compris !') {
    const visible = t => t && t.offsetParent !== null && t.getBoundingClientRect().height > 0;
    const list = steps.filter(step => visible(step.target()));
    if (!list.length) return false;
    tourSteps = list;
    tourFlag = flag;
    tourLastLabel = lastLabel;
    tourStep = 0;
    $('tour').hidden = false;
    showTourStep();
    return true;
}
const tipAllowed = screen => state.data.onboarded && $('tour').hidden && $('chestModal').hidden && !$(screen).hidden;
const firstVisible = (...selectors) => selectors.map(sel => document.querySelector(sel)).find(t => t && t.offsetParent !== null);

/** 1re visite du Profil : badges, cartes, et le compte (seulement si on n'en a pas encore). */
function showProfileTip() {
    if (state.data.tipProfile || !tipAllowed('profileScreen')) return;
    const steps = [{
        target: () => firstVisible('.profile-tab[data-tab="badges"]', '.card-badges'),
        text: '🎖️ Tes badges : quand l’un d’eux a une pastille, touche-le pour récupérer ta récompense.'
    }, {
        target: () => firstVisible('.profile-tab[data-tab="cards"]', '.card-collection'),
        text: '🃏 Tes cartes, gagnées dans les coffres. Chaque doublon te rapproche d’une carte brillante (1/3, 2/3…) : à 3, touche-la pour la transformer ✨. 🔒 La carte Maître se gagne en réussissant le palier 5 de l’entraînement.'
    }];
    if (!cloudUser) steps.push({
        target: () => $('cloudBtn'),
        text: '☁️ Crée un compte pour sauvegarder ta progression en ligne et jouer avec tes amis.'
    });
    startTip('tipProfile', steps);
}

/** 1re visite du Classement : amis, semaine, lundi. Sans compte ni pseudo : une seule bulle (la vraie visite
    viendra quand le classement sera disponible). */
function showLeagueTip() {
    const d = state.data;
    if (d.tipLeague || !tipAllowed('leagueScreen')) return;
    if (document.querySelector('.league-rank')) {
        startTip('tipLeague', [{
            target: () => document.querySelector('.league-friends'),
            text: '👥 Ajoute tes amis avec leur pseudo, ou envoie-leur ton lien d’invitation.'
        }, {
            target: () => document.querySelector('.league-rank'),
            text: '🏆 Chaque semaine, celui qui gagne le plus d’XP l’emporte. Le lundi : un coffre de cartes selon le nombre d’amis battus, et des pièces pour le podium (🥇 50, 🥈 25, 🥉 10).'
        }]);
    } else if (!d.tipLeagueIntro && !(cloudUser && league?.pseudo)) {
        startTip('tipLeagueIntro', [{
            target: () => document.querySelector('.league-intro'),
            text: '🥇 Le classement entre amis : crée un compte et choisis un pseudo pour défier tes amis chaque semaine.'
        }]);
    }
}

function showTrainingTip() {
    if (state.data.tipTraining2 || $('trainingPage').hidden || !$('tour').hidden) return;
    tourSteps = [{
        target: () => document.querySelector('.train-sub'),
        text: '🎯 Ici, des questions à part, différentes du parcours, pour t’entraîner sur le thème de ton choix.'
    }, {
        target: () => document.querySelector('.train-tile'),
        text: '🪜 Chaque thème a 5 paliers. Réussis les 2/3 des questions d’un palier pour passer au suivant (un par jour au maximum) : 🎁 un coffre de cartes du thème à chaque palier, et 🏆 la carte Maître en réussissant le palier 5 !'
    }, {
        target: () => document.querySelector('.train-tile'),
        text: '↻ Tes erreurs reviennent dans les sessions suivantes, jusqu’à ce que tu les saches.'
    }];
    tourFlag = 'tipTraining2';
    tourLastLabel = 'Compris !';
    tourStep = 0;
    $('tour').hidden = false;
    showTourStep();
}

/** La page Entraînement : une case par thème (palier, progression, ce qu'il reste). */
function renderTraining() {
    const grid = $('trainingGrid');
    grid.replaceChildren();
    [...THEME_DECOR].sort((a, b) => byThemeName(a.theme, b.theme)).forEach(({ theme, icon }) => {
        const bank = trainingBank(theme);
        const tile = el('button', `train-tile${bank.length ? '' : ' is-soon'}`);
        tile.type = 'button';
        const head = el('div', 'train-head');
        const ic = el('span', 'train-icon');
        ic.textContent = icon;
        const name = el('b', 'train-name');
        name.textContent = theme;
        head.append(ic, name);
        const medal = bank.length ? trainMedalOf(theme) : 0;
        if (medal) {
            const md = el('span', 'train-medal');
            md.textContent = TRAIN_MEDALS[medal - 1].icon;
            md.title = `Médaille d’${TRAIN_MEDALS[medal - 1].name}`;
            head.append(md);
        }
        tile.append(head);
        if (!bank.length) {
            const soon = el('span', 'train-line');
            soon.textContent = 'Bientôt disponible';
            tile.append(soon);
        } else {
            const pr = trainingProgress(theme);
            const label = el('span', 'train-tier');
            label.textContent = `Palier ${pr.tier} / ${TRAIN_TIERS} · ${TRAIN_TIER_NAMES[pr.tier - 1]}`;
            // 5 morceaux : pleins = paliers passés, le palier en cours se remplit selon ce qu'il reste à faire
            const bar = el('div', 'train-steps');
            const goal = pr.needRight + pr.needMastered;
            const done = Math.min(pr.right, pr.needRight) + Math.min(pr.mastered, pr.needMastered);
            for (let i = 1; i <= TRAIN_TIERS; i++) {
                const seg = el('span', 'train-step');
                const fill = el('i');
                const part = i < pr.tier ? 1 : i > pr.tier ? 0 : (pr.tier >= TRAIN_TIERS && pr.ready ? 1 : goal ? done / goal : 0);
                fill.style.width = `${Math.round(part * 100)}%`;
                seg.append(fill);
                bar.append(seg);
            }
            bar.setAttribute('aria-label', `Palier ${pr.tier} sur ${TRAIN_TIERS}`);
            const line = el('span', 'train-line');
            line.textContent = `${pr.totalMastered} / ${pr.total} maîtrisées`;
            const master = masterCard(theme);
            const reward = el('span', 'train-master');
            reward.textContent = master && state.data.cards[master.id] ? '🏆 Carte Maître obtenue' : '🏆 Carte Maître à gagner au palier 5';
            tile.append(label, bar, line, reward);
            if (pr.blockedToday) {
                const today = el('span', 'train-today');
                today.textContent = '✅ Palier du jour gagné · suite demain';
                tile.append(today);
            }
            const errors = bank.filter(q => missCount(q.id) > 0).length;
            if (errors) {
                const rev = el('span', 'train-errors');
                rev.textContent = `↻ ${errors} à revoir`;
                rev.title = 'Questions ratées : elles reviennent dans tes prochaines sessions';
                tile.append(rev);
            }
        }
        tile.addEventListener('click', () => (bank.length ? confirmTraining(theme, icon) : startTraining(theme)));
        grid.append(tile);
    });
}

/* ---------- Avatar : rond de couleur avec l'initiale du pseudo, ou un petit dessin ---------- */

// 24 couleurs en un seul dégradé (une tous les 15°, 4 lignes de 6) et 39 dessins (+ l'initiale = 8 lignes de 5),
// 2026-10-23 (une ligne de couleurs foncées cassait l'enchaînement : retirée du choix, mais toujours affichée si déjà choisie).
const AVATAR_HUES = Array.from({ length: 24 }, (_, i) => i * 15);
const hueLight = hue => (hue % 5 === 1 ? '32%' : '52%');   // foncée ou normale
const AVATAR_EMOJIS = ['🦉', '🦈', '🦖', '🐋', '🐍', '🐎', '🍄', '🌻', '🎸', '🎷', '🎮', '🎲',
                       '🧩', '🔭', '🧲', '💡', '🤖', '⚽', '🏆', '🍿', '🥐', '🗿', '🌋', '🚂',
                       '🐱', '🐶', '🦊', '🐼', '🦁', '🐸', '🐙', '🐧', '🦄', '👻', '👽', '🐢', '🚀', '🎨', '⭐'];

/* ---------- Objets d'avatar et vitrine de la semaine (mise à jour du 26/10/2026 ; catalogue : cosmetiques.js) ---------- */
const avOn = () => patched();
// Couleurs unies (une sur deux au départ, les autres tous les 10 niveaux), dessins de base, dessins d'événement
const AV_ALL = (() => {
    const list = [];
    AVATAR_HUES.forEach((hue, i) => {
        const level = i % 2 === 0 ? 0 : 10 * Math.ceil(i / 2);
        list.push({ id: `hue-${hue}`, type: 'bg', kind: level ? 'earn' : 'free', hue, name: 'Couleur unie',
                    how: `Termine le niveau ${level}`, test: st => st.maxDone >= level });
    });
    AV_FREE_PICS.forEach(e => list.push({ id: `pic-${e}`, type: 'pic', kind: 'free', emoji: e, name: 'Emoji' }));
    AV_EARN_PICS.forEach(([e, how, test]) => list.push({ id: `pic-${e}`, type: 'pic', kind: 'earn', emoji: e, name: 'Emoji', how, test }));
    EVENTS.forEach(ev => (ev.rewards || []).forEach(r => list.push({ id: `pic-${r.emoji}`, type: 'pic', kind: 'earn', emoji: r.emoji, name: 'Emoji',
        event: ev.id, how: `${ev.title} : trouve ${r.at} questions`, test: () => state.data.avatarExtra.includes(r.emoji) })));
    return list.concat(AV_ITEMS);
})();
const AVI = Object.fromEntries(AV_ALL.map(it => [it.id, it]));
const AV_TYPE_NAME = { frame: 'Cadre', bg: 'Fond', pic: 'Emoji' };
const avPicId = emoji => AV_ALL.find(it => it.type === 'pic' && it.emoji === emoji)?.id || null;

/** Chiffres utiles aux conditions (badges + quelques autres). */
function avStats() {
    const d = state.data;
    const st = badgeStats();
    const done = Object.keys(d.done).map(Number).filter(n => d.done[n]);
    st.maxDone = done.length ? Math.max(...done) : 0;
    st.duelsWon = d.totals.duelsWon || 0;
    st.masters = CARDS.filter(c => c.rarity === 'master' && d.cards[c.id]).length;
    st.dailyTen = Object.values(d.daily).filter(r => r.score >= DAILY_SIZE).length;
    st.allThemes = completeThemes().length >= CARD_THEMES.length;
    return st;
}
/** L'objet est-il à moi ? (gratuit, acheté, offert, ou condition remplie) */
function avHas(it, st) {
    const av = state.data.av;
    if (it.kind === 'free') return true;
    if (av.owned[it.id] || av.grant[it.id]) return true;
    return it.kind === 'earn' && !!it.test && !!it.test(st);
}
/** Joueurs d'avant la mise à jour (testeurs) : pas de passe-droit, sauf la couleur et le dessin qu'ils portent. */
function avMigrate() {
    const d = state.data;
    // Le vrai lundi (ni démo ni bac à sable), une seule fois : on oublie ce qui a pu être vu dans une démo
    if (!demoLundi && !BAC && todayKey() >= PATCH_DAY && !d.mondayFresh) {
        d.mondayFresh = true;
        EVENTS.forEach(ev => { d[ev.tip] = false; d[`${ev.tip}Page`] = false; });
        d.av = { owned: d.av.owned || {}, opened: { ...(d.av.owned || {}) }, known: { ...(d.av.owned || {}) }, grant: {}, migrated: false };
        d.vitrine = null;
        d.vitrineSeen = null;
    }
    if (d.av.migrated) return;
    d.av.migrated = true;
    const old = Object.keys(d.activeDays || {}).some(k => k < PATCH_DAY);
    if (old && d.avatar) {
        const ids = [`hue-${d.avatar.hue}`, d.avatar.emoji ? avPicId(d.avatar.emoji) : null].filter(id => id && AVI[id]);
        ids.forEach(id => { d.av.grant[id] = 1; d.av.opened[id] = 1; d.av.known[id] = 1; });
    }
    saveData();
}
let avReadyCount = 0;   // objets gagnés pas encore « ouverts » (pastille)
/** Vérifie ce qui vient d'être débloqué ; renvoie les nouveautés (pour l'écran de fin). */
function avCheck() {
    if (!avOn()) { avReadyCount = 0; return []; }
    avMigrate();
    const d = state.data;
    const st = avStats();
    const fresh = [];
    let ready = 0;
    for (const it of AV_ALL) {
        if (it.kind === 'free' || !avHas(it, st)) continue;
        if (!d.av.known[it.id]) { d.av.known[it.id] = 1; if (it.kind === 'earn') fresh.push(it); }
        if (!d.av.opened[it.id]) ready++;
    }
    avReadyCount = ready;
    if (fresh.length) saveData();
    return fresh;
}
const avLabel = it => it.type === 'pic' ? `l’emoji ${it.emoji}` : `${it.type === 'frame' ? 'le cadre' : 'le fond'} ${it.hue !== undefined ? 'couleur' : `« ${it.name} »`}`;

/** Habille un rond d'avatar avec son fond et son cadre (classes de style.css). */
function avDress(a, look) {
    const bg = look.bg && AVI[look.bg];
    if (bg && bg.type === 'bg' && bg.hue === undefined) a.classList.add(bg.id);
    const fr = look.frame && AVI[look.frame];
    if (fr && fr.type === 'frame') a.classList.add('fr', fr.id, `fx-${fr.fx || 'none'}`);
}
function avEnsureLook() {
    if (!state.data.avatar) {
        const auto = avatarEl(myAvatarName(), null);
        state.data.avatar = { hue: Number(auto.style.getPropertyValue('--hue')), emoji: null };
    }
    const look = state.data.avatar;
    if (look.bg === undefined) look.bg = null;
    if (look.frame === undefined) look.frame = null;
    return look;
}
/** Met l'objet sur l'avatar. */
function avWear(it) {
    const look = avEnsureLook();
    if (it.type === 'frame') look.frame = it.id;
    else if (it.type === 'pic') look.emoji = it.emoji;
    else if (it.hue !== undefined) { look.hue = it.hue; look.bg = null; }
    else look.bg = it.id;
}
/** Vitrine : l'objet seul, sur un avatar gris neutre (on voit tout de suite ce qu'on achète). */
function avAlone(it) {
    const look = { hue: 0, emoji: null, bg: null, frame: null };
    if (it.type === 'frame') look.frame = it.id;
    else if (it.type === 'pic') look.emoji = it.emoji;
    else look.bg = it.id;
    const a = avatarEl(myAvatarName(), look);
    if (it.type !== 'bg') a.classList.add('av-neutral');
    if (it.type === 'bg') a.textContent = '';
    return a;
}
/** Confirmation d'achat : mon avatar avant → après. */
function avBeforeAfter(it) {
    const box = el('div', 'av-before-after');
    const arrow = el('span', 'av-arrow');
    arrow.textContent = '→';
    box.append(avatarEl(myAvatarName(), avEnsureLook()), arrow, avPreview(it));
    return box;
}
/** Aperçu : mon avatar avec cet objet. */
function avPreview(it, cls = '') {
    const look = { ...avEnsureLook() };
    if (it.type === 'frame') look.frame = it.id;
    else if (it.type === 'pic') look.emoji = it.emoji;
    else if (it.hue !== undefined) { look.hue = it.hue; look.bg = null; }
    else look.bg = it.id;
    return avatarEl(myAvatarName(), look, cls);
}

// Vitrine : la même pour tout le monde, rejouée semaine par semaine depuis le 26/10/2026 (rien d'enregistré)
const VITRINE_START = '2026-10-26';
const VITRINE_CARD_ROT = ['common', 'rare', 'epic', 'legendary'];
const VITRINE_CARD_PRICE = { common: 60, rare: 150, epic: 400, legendary: 1000 };
const VITRINE_SEASON_LABEL = { halloween: '🎃 Halloween', noel: '🎄 Noël', valentin: '💖 Saint-Valentin' };
const dayGap = (a, b) => Math.round((new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`)) / 86400000);
const vitrineWeek = () => Math.max(0, Math.floor(dayGap(VITRINE_START, weekStart()) / 7));
function vitrineSeason(k) {
    const md = shiftDays(VITRINE_START, 7 * k).slice(5);
    return VITRINE_SEASONS.find(se => (se.from <= se.to ? md >= se.from && md <= se.to : md >= se.from || md <= se.to)) || null;
}
const vitrineCache = {};
const VITRINE_RETURNS_FROM = 5;   // 1er retour possible : le lundi 30/11/2026
const AV_COLL = Object.fromEntries(AV_COLLECTIONS.map(c => [c.id, c]));
/** Semaine k : une collection complète (cadre + fond + dessin). 1re semaine d'une saison : sa collection ;
    une semaine normale sur trois : une ancienne collection revient. Rejoué depuis le 26/10/2026 (rien d'enregistré). */
function vitrinePlan(w) {
    if (vitrineCache[w]) return vitrineCache[w];
    let next = 0;
    let normal = 0;
    let afterStart = 0;   // semaines normales depuis le début des retours
    const last = {};
    const shown = [];   // collections déjà sorties (hors saison)
    const releasedItems = [];
    let plan = null;
    for (let k = 0; k <= w; k++) {
        const season = vitrineSeason(k);
        const firstOfSeason = season && (k === 0 || vitrineSeason(k - 1)?.id !== season.id);
        let coll = null;
        let back = false;
        if (firstOfSeason && AV_COLLECTIONS.some(c => c.season === season.id)) coll = AV_COLLECTIONS.find(c => c.season === season.id);
        else {
            // Retour une semaine normale sur trois : une collection vue il y a 2 semaines au moins (les plus anciennes d'abord)
            // Pas de retour avant le 30/11/2026 (semaine 5) : d'abord des nouveautés ; ensuite 1 semaine normale sur 3
            const old = shown.filter(id => k - last[id] >= 2).sort((a, b) => last[a] - last[b]).slice(0, 2);
            const retour = (k >= VITRINE_RETURNS_FROM && afterStart % 3 === 0 && old.length > 0) || next >= COLLECTION_ORDER.length;
            if (k >= VITRINE_RETURNS_FROM) afterStart++;
            normal++;
            if (!retour) coll = AV_COLL[COLLECTION_ORDER[next++]];
            else {
                const from = old.length ? old : [...shown].sort((a, b) => last[a] - last[b]).slice(0, 1);
                if (from.length) { coll = AV_COLL[from[0]]; back = true; }   // celle qu'on n'a pas vue depuis le plus longtemps
            }
        }
        if (k === w) plan = { coll: coll ? coll.id : null, items: coll ? coll.items.slice() : [], back, season: coll?.season || null, released: releasedItems.slice() };
        if (coll) {
            last[coll.id] = k;
            if (!coll.season && !shown.includes(coll.id)) shown.push(coll.id);
            coll.items.forEach(id => { if (!releasedItems.includes(id)) releasedItems.push(id); });
        }
    }
    vitrineCache[w] = plan;
    return plan;
}
/** Carte de la semaine : parmi MES cartes manquantes, rareté tournante (la même pour tous). Gardée toute la semaine. */
function vitrineCard() {
    const d = state.data;
    const week = weekStart();
    if (d.vitrine && d.vitrine.week === week) return d.vitrine;
    const rarity = VITRINE_CARD_ROT[vitrineWeek() % VITRINE_CARD_ROT.length];
    const normal = CARDS.filter(c => c.rarity !== 'master').sort((a, b) => (a.id < b.id ? -1 : 1));
    const seed = `carte-${week}-${d.playerSeed}`;
    let card = null;
    let rar = rarity;
    let shine = false;
    for (const r of [rarity, ...VITRINE_CARD_ROT.filter(x => x !== rarity)]) {
        const miss = normal.filter(c => c.rarity === r && !d.cards[c.id]);
        if (miss.length) { card = seededShuffle(miss, seed)[0]; rar = r; break; }
    }
    if (!card) {   // collection complète : une carte à faire briller
        const dim = normal.filter(c => (d.cards[c.id] || 0) < SHINY_AT);
        const same = dim.filter(c => c.rarity === rarity);
        const from = same.length ? same : dim;
        if (from.length) { card = seededShuffle(from, seed)[0]; rar = card.rarity; shine = true; }
    }
    d.vitrine = { week, card: card ? card.id : null, rarity: rar, shine, bought: false };
    saveData();
    return d.vitrine;
}
function vitrineTimeLeft() {
    const ms = new Date(`${shiftDays(weekStart(), 7)}T00:00:00`) - new Date();
    const h = Math.max(0, Math.floor(ms / 3600000));
    return h >= 24 ? `${Math.floor(h / 24)} j ${h % 24} h` : `${h} h ${Math.max(0, Math.floor(ms / 60000) % 60)} min`;
}
/** Coffres des missions et du podium : 1 chance sur 10 d'un objet de la boutique déjà sorti (les moins chers plus souvent). */
const AV_CHEST_CHANCE = 0.1;
function avChestPool() {
    if (!avOn()) return [];
    const plan = vitrinePlan(vitrineWeek());
    const seasonal = new Set(AV_COLLECTIONS.filter(c => c.season).flatMap(c => c.items));
    return plan.released.filter(id => !plan.items.includes(id) && AVI[id] && !AVI[id].season && !seasonal.has(id) && !state.data.av.owned[id]);
}
function avChestDrop() {
    const pool = avChestPool();
    if (!pool.length || Math.random() >= AV_CHEST_CHANCE) return null;
    const weights = pool.map(id => 1 / AVI[id].price);
    let r = Math.random() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0) return AVI[pool[i]]; }
    return AVI[pool[pool.length - 1]];
}
const AV_CHEST_TEXT = '✨ 1 chance sur 10 : un cadre, un fond ou un emoji de la boutique';
/** 1re semaine où un coffre peut donner un objet (la même pour tous) : la phrase y est marquée « Nouveau ». */
function avChestFirstWeek() {
    const seasonal = new Set(AV_COLLECTIONS.filter(c => c.season).flatMap(c => c.items));
    for (let w = 0; w <= vitrineWeek(); w++) {
        const plan = vitrinePlan(w);
        if (plan.released.some(id => !plan.items.includes(id) && AVI[id] && !AVI[id].season && !seasonal.has(id))) return w;
    }
    return -1;
}
const avChestLine = () => (avChestPool().length ? ` ${avChestFirstWeek() === vitrineWeek() ? '🆕 Nouveau ! ' : ''}${AV_CHEST_TEXT}.` : '');
/** « 🎨 Objets d'avatar : 12 / 45 » : parmi les objets déjà sortis. */
function avCount() {
    const st = avStats();
    const plan = vitrinePlan(vitrineWeek());
    const out = new Set([...plan.released, ...plan.items]);
    const list = AV_ALL.filter(it => it.kind !== 'shop' ? (!it.event || avHas(it, st) || currentEvent()?.id === it.event) : out.has(it.id) || state.data.av.owned[it.id]);
    return { have: list.filter(it => avHas(it, st)).length, total: list.length };
}

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
    a.style.setProperty('--light', hueLight(hue));
    if (look?.emoji) a.append(emojiImg(look.emoji));
    else a.textContent = [...pseudo][0].toUpperCase();
    if (look && avOn()) avDress(a, look);
    return a;
}

function openAvatarModal() {
    if (!state.data.avatar) {
        const auto = avatarEl(myAvatarName(), null);
        state.data.avatar = { hue: Number(auto.style.getPropertyValue('--hue')), emoji: null };
    }
    if (avOn()) avCheck();
    renderAvatarModal();
    $('avatarModal').hidden = false;
    if (state.data.avatarNew) { state.data.avatarNew = false; saveData(); updateNavNotifications(); }
}

let avTab = 'bg';
function renderAvatarModalV2() {
    const d = state.data;
    const look = avEnsureLook();
    const name = myAvatarName();
    const st = avStats();
    $('avatarModal').querySelector('.avatar-sheet').classList.add('is-v2');
    $('avatarPreview').replaceChildren(avatarEl(name, look, 'is-big'));
    const tabs = $('avatarTabs');
    tabs.hidden = false;
    tabs.replaceChildren();
    [['bg', '🎨', 'Fond'], ['pic', '🐱', 'Emoji'], ['frame', '⭕', 'Cadre']].forEach(([t, icon, label]) => {
        const b = el('button', `avatar-tab${avTab === t ? ' is-active' : ''}`);
        b.type = 'button';
        const i = el('span', 'avatar-tab-icon');
        i.textContent = icon;
        const l = el('span');
        l.textContent = label;
        b.append(i, l);
        const n = AV_ALL.filter(it => it.type === t && it.kind !== 'free' && avHas(it, st) && !d.av.opened[it.id]).length;
        if (n) b.setAttribute('data-notif', n);
        b.addEventListener('click', () => { avTab = t; renderAvatarModalV2(); $('avatarGrid').scrollTop = 0; });
        tabs.append(b);
    });
    const grid = $('avatarGrid');
    grid.hidden = false;
    grid.className = `avatar-grid${avTab === 'frame' ? ' is-frames' : ''}`;
    grid.replaceChildren();
    const tile = (cls, child, onClick) => {
        const b = el('button', `av-tile ${cls}`);
        b.type = 'button';
        if (child) b.append(child);
        b.addEventListener('click', () => onClick(b));
        return b;
    };
    const art = it => {
        if (it.type === 'pic') return emojiImg(it.emoji);
        if (it.type === 'bg') {   // le fond seul, sans le cadre ni le dessin portés
            const a = avatarEl(name, it.hue !== undefined ? { hue: it.hue } : { hue: look.hue, bg: it.id });
            a.textContent = '';
            return a;
        }
        return avPreview(it);
    };
    const active = it => it.type === 'frame' ? look.frame === it.id
        : it.type === 'pic' ? look.emoji === it.emoji
        : it.hue !== undefined ? !look.bg && look.hue === it.hue : look.bg === it.id;
    if (avTab === 'pic') {
        const ini = el('span');
        ini.textContent = [...name][0].toUpperCase();
        grid.append(tile(!look.emoji ? 'is-active' : '', ini, () => { look.emoji = null; renderAvatarModalV2(); }));
    }
    if (avTab === 'frame') {
        const none = el('span');
        none.textContent = 'Aucun';
        grid.append(tile(`is-none${!look.frame ? ' is-active' : ''}`, none, () => { look.frame = null; renderAvatarModalV2(); }));
    }
    const plan = vitrinePlan(vitrineWeek());
    const onSale = plan.items;
    for (const it of AV_ALL.filter(x => x.type === avTab)) {
        const has = avHas(it, st);
        if (it.kind === 'shop' && !has) continue;                                   // la boutique : seulement ce qu'on a
        if (it.event && !has && currentEvent()?.id !== it.event) continue;          // événement fini et pas gagné
        const swatch = it.type === 'bg' ? ' is-swatch' : '';
        if (!has) {
            const b = tile(`is-locked${swatch}`, art(it), () => showToast(`🔒 ${it.how}`));
            const lock = el('span', 'av-lock');
            lock.textContent = '🔒';
            b.append(lock);
            grid.append(b);
        } else if (it.kind !== 'free' && !d.av.opened[it.id]) {
            const b = tile(`is-ready${swatch}`, art(it), btn => avOpenTile(it, btn));
            const lock = el('span', 'av-lock');
            lock.textContent = '🔒';
            const dot = el('span', 'av-dot');
            dot.textContent = '1';
            b.append(lock, dot);
            grid.append(b);
        } else {
            grid.append(tile(`${active(it) ? 'is-active' : ''}${swatch}`, art(it), () => { avWear(it); renderAvatarModalV2(); }));
        }
    }
    // Ce qui est en vitrine cette semaine (pas encore à moi) : mène à la boutique
    onSale.map(id => AVI[id]).filter(it => it && it.type === avTab && !avHas(it, st)).forEach(it => {
        const b = tile(`is-shop${it.type === 'bg' ? ' is-swatch' : ''}`, art(it), () => { closeAvatarModal(); showScreen('shop'); });
        const pr = el('span', 'av-price');
        pr.textContent = `🛍️ ${it.price} 🪙`;
        b.append(pr);
        grid.append(b);
    });
}
/** Un objet gagné : on le touche, le cadenas s'envole, il s'allume. */
function avOpenTile(it, b) {
    if (b.classList.contains('is-opening')) return;
    b.classList.add('is-opening');
    b.querySelector('.av-dot')?.remove();
    playSound('win');
    setTimeout(() => {
        state.data.av.opened[it.id] = 1;
        saveData();
        avCheck();
        updateNavNotifications();
        b.classList.remove('is-ready', 'is-opening');
        b.classList.add('is-revealed');
        b.querySelector('.av-lock')?.remove();
        for (let k = 0; k < 8; k++) {
            const sp = el('span', 'av-spark');
            const ang = (k / 8) * Math.PI * 2;
            sp.style.cssText = `--dx:${Math.round(Math.cos(ang) * 34)}px;--dy:${Math.round(Math.sin(ang) * 34)}px;background:${['#ffc800', '#58cc02', '#1899d6', '#ff4b4b'][k % 4]}`;
            b.append(sp);
        }
        setTimeout(renderAvatarModalV2, 700);
    }, 420);
}

function renderAvatarModal() {
    if (avOn()) { renderAvatarModalV2(); return; }
    const look = state.data.avatar;
    const name = myAvatarName();
    $('avatarPreview').replaceChildren(avatarEl(name, look, 'is-big'));
    const colors = $('avatarColors');
    colors.replaceChildren();
    AVATAR_HUES.forEach(hue => {
        const b = el('button', `avatar-swatch${look.hue === hue ? ' is-active' : ''}`);
        b.type = 'button';
        b.style.setProperty('--hue', String(hue));
        b.style.setProperty('--light', hueLight(hue));
        b.setAttribute('aria-label', 'Choisir cette couleur');
        b.addEventListener('click', () => { look.hue = hue; renderAvatarModal(); });
        colors.append(b);
    });
    const pics = $('avatarEmojis');
    pics.replaceChildren();
    [null, ...AVATAR_EMOJIS, ...state.data.avatarExtra.filter(e => !AVATAR_EMOJIS.includes(e))].forEach(emoji => {
        const b = el('button', `avatar-pick${look.emoji === emoji ? ' is-active' : ''}`);
        b.type = 'button';
        if (emoji) b.append(emojiImg(emoji));
        else b.textContent = [...name][0].toUpperCase();
        b.setAttribute('aria-label', emoji ? 'Choisir cet emoji' : 'Mettre mon initiale');
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
const PODIUM_COINS = [50, 25, 10];       // pièces du lundi selon la place (1er, 2e, 3e)
const PODIUM_MIN_XP = 100;             // XP minimum dans la semaine pour avoir le coffre du lundi
let league = loadLeagueCache();
let leagueBusy = false;
let leagueMsg = null;                  // message sous le champ « ajouter un ami » : { text, kind: 'bad' | 'good' }

function loadLeagueCache() {
    try { return JSON.parse(localStorage.getItem(LEAGUE_KEY) || 'null'); } catch (err) { return null; }
}
function saveLeagueCache() {
    if (BAC) return;
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
        unlocked: d.unlocked,   // niveau en cours (avatar sur le parcours des amis)
        look: d.avatar ? { bg: d.avatar.bg || null, frame: d.avatar.frame || null } : null,   // fond et cadre (26/10)
        event: (ev => ev ? { id: ev.id, found: Object.keys(eventData(ev).found).length } : null)(currentEvent()),
        rate: d.totals.tries > 0 ? Math.round((d.totals.right / d.totals.tries) * 100) : null,
        sprint: d.best.sprint || 0,
        badges: Object.keys(d.badges).filter(id => d.badges[id]),
        cards: Object.keys(d.cards).filter(id => d.cards[id]),
        shiny: Object.keys(d.shinyCards || {}).filter(id => (d.cards[id] || 0) >= SHINY_AT),   // cartes brillantes
        daily: d.daily[todayKey()] ? { day: todayKey(), grid: d.daily[todayKey()].grid } : null   // défi du jour, question par question
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
    if (cloudUser && league?.pseudo && league.friends.some(x => x.id === f.id)) {
        const duel = el('button', 'btn btn-violet btn-full friend-duel');
        duel.type = 'button';
        duel.textContent = `⚔️ Défier ${f.pseudo} en duel`;
        duel.addEventListener('click', () => challengeFriend(f));
        body.append(duel);
    }

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
        const shiny = s.shiny || [];   // ancien résumé : pas d'info sur les cartes brillantes
        cards.forEach(card => {
            const btn = el('button', 'kcard-btn');
            btn.type = 'button';
            const isShinyCard = shiny.includes(card.id);
            btn.append(cardFace(card, false, isShinyCard));
            btn.addEventListener('click', () => {
                $('friendModal').hidden = true;
                openCardView(card, () => { $('friendModal').hidden = false; }, isShinyCard);
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
/** Défi du jour terminé : les 10 questions, la bonne réponse, la mienne, et qui de mes amis a juste ou faux. */
function openDailyReview() {
    const today = todayKey();
    const mine = state.data.daily[today];
    if (!mine) return;
    const myGrid = [...(mine.grid || '')];
    const hasLeague = cloudUser && league?.userId === cloudUser.id && league.pseudo;
    const friends = hasLeague ? league.friends
        .map(f => ({ pseudo: f.pseudo, grid: f.summary?.daily?.day === today ? [...f.summary.daily.grid] : null }))
        .filter(f => f.grid) : [];
    const body = $('friendBody');
    body.replaceChildren();
    const h = el('h2', 'review-title');
    h.textContent = `📅 Défi du jour · ${mine.score}/${DAILY_SIZE}`;
    body.append(h);
    const note = el('p', 'muted review-note');
    note.textContent = friends.length
        ? `Comparé avec ${plural(friends.length, 'ami qui a joué', 'amis qui ont joué')} aujourd’hui.`
        : hasLeague ? 'Aucun ami n’a encore joué aujourd’hui : reviens plus tard pour comparer !'
        : 'Ajoute des amis dans le Classement pour comparer vos réponses.';
    body.append(note);
    const list = el('ol', 'review-list');
    dailyQuestions(today).forEach((q, i) => {
        const ok = myGrid[i] === '🟩';
        const li = el('li', `review-item ${ok ? 'is-ok' : 'is-ko'}`);
        const head = el('div', 'review-q');
        head.textContent = `${i + 1}. ${ok ? '✅' : '❌'} ${q.q}`;
        const ans = el('div', 'review-a');
        ans.textContent = `Réponse : ${q.a[0]}`;
        li.append(head);
        // Drapeau, rébus ou photo : sans l'image, la question n'a pas de sens
        if (q.flag || q.rebus || q.photo) {
            const media = el('div', 'review-media');
            if (q.flag) media.append(flagImg(q.flag));
            else if (q.rebus) media.append(...q.rebus.map(emojiImg));
            else {
                const img = el('img');
                img.src = q.photo;
                img.alt = '';
                img.loading = 'lazy';
                media.append(img);
            }
            li.append(media);
        }
        li.append(ans);
        const typed = mine.answers?.[i];
        if (!ok && mine.answers) {
            const me = el('div', 'review-me');
            me.textContent = typed ? `Toi : ${typed}` : 'Toi : pas de réponse';
            li.append(me);
        }
        if (friends.length) {
            const fr = el('div', 'review-friends');
            fr.textContent = '👥 ' + friends.map(f => `${f.pseudo} ${f.grid[i] === '🟩' ? '✅' : '❌'}`).join(' · ');
            li.append(fr);
        }
        list.append(li);
    });
    body.append(list);
    $('friendModal').hidden = false;
    $('friendModal').querySelector('.modal-content').scrollTop = 0;
}

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
        friend: f,
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
        const li = el('li', r.me ? 'is-me' : 'is-link');
        if (r.friend) li.addEventListener('click', () => openFriendProfile(r.friend));   // profil de l'ami
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
            const base = Number.isInteger(prof.avatar_hue) ? { hue: prof.avatar_hue, emoji: prof.avatar_emoji || null } : null;
            const extra = scores[id]?.summary?.look;   // fond et cadre, envoyés dans le résumé du profil
            const look = extra && (extra.bg || extra.frame) ? { ...(base || {}), bg: extra.bg || null, frame: extra.frame || null } : base;
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
        // Duels (table de supabase/duels.sql ; si elle n'existe pas encore : liste vide, sans erreur)
        const { data: duels, error: duelErr } = await c.from('duels').select('*').order('created_at', { ascending: false }).limit(100);
        fresh.duels = duelErr ? (before?.duels || []) : (duels || []);
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
    renderMapFriends();
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
    const won = mine >= PODIUM_MIN_XP && beaten > 0;
    if (won) data.podium[last] = rank;
    // Résultat de la semaine (2026-10-25) : montré en haut du Classement jusqu'à ce qu'on l'ait vu et ouvert son coffre
    const rows = [{ pseudo: league.pseudo, look: data.avatar ? { ...data.avatar } : null, xp: mine, me: true },
        ...league.friends.map(f => ({ pseudo: f.pseudo, look: f.look || null, xp: friendWeekXp(f, last) }))]
        .sort((a, b) => b.xp - a.xp || (a.me ? -1 : b.me ? 1 : 0));
    data.leagueRecap = {
        week: last, rank, xp: mine, beaten, friends: league.friends.length,
        top: rows.slice(0, 3), won,
        size: won ? Math.min(5, 1 + beaten) : 0,
        coins: won ? (PODIUM_COINS[rank - 1] || 0) : 0,   // pièces selon la place : 🥇 50, 🥈 25, 🥉 10
        why: won ? '' : mine < PODIUM_MIN_XP ? 'xp' : 'beaten',
        done: false
    };
    saveData();
    updateNavNotifications();
    if (!$('leagueScreen').hidden) renderLeague();
}

/** Ouvre le coffre de la semaine depuis la carte du résultat. */
function claimLeagueRecap() {
    const data = state.data;
    const r = data.leagueRecap;
    if (!r || r.done) return;
    r.done = true;
    if (r.won) {
        data.coins += r.coins;
        const place = r.rank === 1 ? '1er' : `${r.rank}e`;
        const drop = avChestDrop();
        openCardBoxes([{ size: drop ? Math.max(1, r.size - 1) : r.size, rare: r.size >= 3 }],
            `${['🥇', '🥈', '🥉'][r.rank - 1] || '🏅'} ${place} de la semaine : ${plural(r.beaten, 'ami battu', 'amis battus')}${r.coins ? ` · +${r.coins} 🪙` : ''} !`, drop);
        checkBadges();
    }
    saveData();
    renderHeader();
    updateNavNotifications();
    renderLeague();
}
const leagueRecapPending = () => !!(state.data.leagueRecap && !state.data.leagueRecap.done);

/** Carte « Résultat de la semaine dernière » : podium final, ma place, ma récompense (ou pourquoi il n'y en a pas). */
function renderLeagueRecap(box) {
    const r = state.data.leagueRecap;
    const place = n => (n === 1 ? '1er' : `${n}ᵉ`);
    const podium = el('div', 'recap-podium');
    r.top.forEach((row, i) => {
        const col = el('div', `recap-col${row.me ? ' is-me' : ''}`);
        const medal = el('span', 'recap-medal');
        medal.textContent = ['🥇', '🥈', '🥉'][i];
        const name = el('b');
        name.textContent = row.me ? 'Toi' : row.pseudo;
        const xp = el('small');
        xp.textContent = `${row.xp} XP`;
        col.append(medal, avatarEl(row.pseudo, row.look, 'is-small'), name, xp);
        podium.append(col);
    });
    const me = el('p', 'recap-me');
    me.textContent = `Tu as fini ${place(r.rank)} sur ${r.friends + 1} avec ${r.xp} XP${r.beaten ? ` · ${plural(r.beaten, 'ami battu', 'amis battus')}` : ''}.`;
    box.append(podium, me);
    const btn = el('button', `btn ${r.won ? 'btn-green' : 'btn-ghost'} btn-full`);
    btn.type = 'button';
    if (r.won) {
        btn.textContent = `🎁 Ouvrir mon coffre · ${plural(r.size, 'carte', 'cartes')}${r.coins ? ` + ${r.coins} 🪙` : ''}`;
    } else {
        const why = el('p', 'recap-why');
        why.textContent = r.why === 'xp'
            ? `Pas de coffre cette fois : il fallait faire au moins ${PODIUM_MIN_XP} XP dans la semaine.`
            : 'Pas de coffre cette fois : il fallait battre au moins un ami.';
        box.append(why);
        btn.textContent = 'J’ai vu';
    }
    btn.addEventListener('click', claimLeagueRecap);
    box.append(btn);
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

    // 3) Résultat de la semaine dernière (jusqu'à ce qu'on l'ait vu), puis le classement de la semaine
    if (leagueRecapPending()) renderLeagueRecap(card('league-recap', '📊 Résultat de la semaine dernière'));
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
    left.id = 'leagueLeft';
    left.textContent = `⏳ ${vitrineTimeLeft()}`;   // « 3 j 14 h », puis « 14 h 32 min » le dernier jour
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
    para(rank, `🎁 Lundi : un coffre si tu bats au moins un ami et fais au moins ${PODIUM_MIN_XP} XP.${avChestLine()}`, 'muted league-sub');

    renderDuelsCard(grid);

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
        capList(friends, ul, 'friends');
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
      text: 'Les losanges roses ⏳ aussi\u00a0: des cartes à remettre dans l’ordre (dates, tailles, distances…).' },
    { target: () => document.querySelector('.node.is-challenge:not(.is-done)'),
      text: 'Et tous les 10 niveaux, un défi 🏆 qui mélange les questions des niveaux précédents.' },
    { target: () => document.querySelector('.chest-node:not(.is-open)'),
      text: 'Tous les 5 niveaux, un coffre 🎁 : il contient des cartes à collectionner (dans ton Profil).' },
    { target: () => document.querySelector('.chips'),
      text: 'En haut\u00a0: tes pièces 🪙 (pour la boutique), tes gouttes 💧 (chaque niveau en coûte une, elles se rechargent toutes seules) et ta série 🔥 de jours d’affilée.' },
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
    if (Object.values(data.chests).some(v => v !== 'placement')) { data.tipChest = true; saveData(); return; }
    chestTipPending = true;
    setTimeout(() => {
        chestTipPending = false;
        const n = readyChests().length;
        const ready = n > 0 && !$('mapScreen').hidden && $('tour').hidden && $('chestModal').hidden
            && (!data.onboarded || data.tourDone) && !data.tipChest;
        if (!ready) return;
        const text = n > 1 && data.placement
            ? `🎁 Ton test de placement t’a rapporté ${n} coffres ! Ouvre-les tous d’un coup.`
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
    typeTourText(step.text);
    $('tourDots').textContent = tourSteps.length > 1 ? `${tourStep + 1}/${tourSteps.length}` : '';
    $('tourNext').textContent = tourStep === tourSteps.length - 1 ? tourLastLabel : 'Suivant';
    $('tourSkip').hidden = tourStep === tourSteps.length - 1;
    setTimeout(placeTour, 60);   // après le défilement
}

/* Kulti à gauche de la bulle (2026-10-27) : le texte s'écrit lettre par lettre pendant que sa bouche bouge.
   La place du texte entier est réservée dès le début (partie pas encore écrite invisible) : la bulle ne grandit pas. */
let tourTyping = null;
function typeTourText(text) {
    clearInterval(tourTyping);
    const p = $('tourText');
    const shown = el('span'), rest = el('span', 'tour-rest');
    p.replaceChildren(shown, rest);
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const done = () => { clearInterval(tourTyping); shown.textContent = text; rest.textContent = ''; $('tourKulti').replaceChildren(kultiEl('content', 'kulti-blink')); };
    if (reduced) { done(); return; }
    $('tourKulti').replaceChildren(kultiEl('parle', 'kulti-blink kulti-talking'));
    let i = 0;
    rest.textContent = text;
    tourTyping = setInterval(() => {
        i = Math.min(text.length, i + 2);
        shown.textContent = text.slice(0, i);
        rest.textContent = text.slice(i);
        if (i >= text.length) done();
    }, 30);
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

let tourSkipped = false;   // « Passer » : on n'enchaîne pas sur la suite (ex. : l'entraînement)
function endTour() {
    clearInterval(tourTyping);
    const skipped = tourSkipped;
    tourSkipped = false;
    $('tour').hidden = true;
    state.data[tourFlag] = true;
    saveData();
    if (tourFlag === 'tipChallenges') {   // la bulle de l'onglet Défis mène à l'Entraînement (et à son explication)
        if (!skipped && challengesTab !== 'training') setChallengesTab('training');
        return;
    }
    if (EVENTS.some(e => e.tip === tourFlag)) {   // bulle de l'onglet de l'événement → on y va
        if (!skipped) setChallengesTab('event');
        return;
    }
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
        const kulti = kultiEl('clin', 'onboard-kulti kulti-blink kulti-float');   // Kulti se présente (2026-10-27)
        title.textContent = 'Bienvenue sur Kultivo !';
        text.textContent = 'Moi, c’est Kulti ! Ta culture générale, un niveau après l’autre : questions, défis, grilles à associer… Commençons par faire connaissance.';
        body.append(kulti, title, text);
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
/** Arrête l'apparition des tuiles du récap (sinon leurs sons continuaient après avoir quitté l'écran). */
function stopEndStats() {
    endStatTimers.forEach(clearTimeout);
    endStatTimers = [];
    ['endPrimary', 'endSecondary', 'endRescue'].forEach(id => { $(id).disabled = false; });
}

function renderEndStats(stats) {
    stopEndStats();
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
    // Boutons grisés tant que les tuiles apparaissent (on ne quitte pas l'écran en plein récap)
    if (!calm && stats.length) {
        const buttons = ['endPrimary', 'endSecondary', 'endRescue'].map(id => $(id));
        buttons.forEach(b => { b.disabled = true; });
        endStatTimers.push(setTimeout(() => buttons.forEach(b => { b.disabled = false; }),
            500 + (stats.length - 1) * 550 + 450));
    }
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
    lose: [[392, 0, 0.18, 'triangle'], [330, 0.18, 0.18, 'triangle'], [262, 0.36, 0.4, 'triangle']],
    combo: [[1320, 0.2, 0.25, 'triangle']],   // petite note en plus quand la pastille du combo saute
    flash: [[2000, 0.02, 0.06, 'square']],    // « ⚡ Éclair ! »
    ding: [[1319, 0, 0.5], [1760, 0.05, 0.7]],   // objectif du jour atteint
    title: [[523, 0.6, 0.15, 'triangle'], [659, 0.68, 0.15, 'triangle'], [784, 0.76, 0.15, 'triangle'], [1047, 0.9, 0.9]],
    freeze: [[1800, 0, 0.3], [2400, 0.05, 0.4]],
    thaw: [[300, 0, 0.12, 'square'], [784, 0.3, 0.6], [988, 0.35, 0.6], [1175, 0.4, 0.6]],
    tap: [[880, 0, 0.08, 'triangle'], [1175, 0.07, 0.1, 'triangle']]
};
let audioCtx = null;

function playSound(name, semis = 0) {
    if (!state.data.sound) return;
    const pitch = Math.pow(2, semis / 12);   // combo : le son monte d'une note à chaque bonne réponse de suite
    if (name === 'bad' && navigator.vibrate) navigator.vibrate(70);   // petite vibration sur Android
    try {
        audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const now = audioCtx.currentTime;
        for (const [freq, start, dur, type = 'sine', endFreq] of SOUNDS[name]) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq * pitch, now + start);
            if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq * pitch, now + start + dur);
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

/* Sons de l'animation de série : tic-tic de roulette qui ralentit, puis « embrasement » (souffle + cloches) ;
   trompettes « ta-ta-ta-taaa » en plus pour un cap. Mêmes sons synthétisés que le reste (pas de fichier). */
function audio() {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}
function synthTone(freq, start, dur, type = 'sine', vol = 0.16, endFreq) {
    const ctx = audio(), now = ctx.currentTime, osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now + start);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, now + start + dur);
    g.gain.setValueAtTime(0.0001, now + start);
    g.gain.exponentialRampToValueAtTime(vol, now + start + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(now + start);
    osc.stop(now + start + dur + 0.02);
}
function synthBrass(freq, start, dur, vol = 0.09) {
    const ctx = audio(), now = ctx.currentTime, osc = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now + start);
    f.type = 'lowpass';
    f.frequency.setValueAtTime(900, now + start);
    f.frequency.linearRampToValueAtTime(3200, now + start + 0.08);
    g.gain.setValueAtTime(0.0001, now + start);
    g.gain.exponentialRampToValueAtTime(vol, now + start + 0.03);
    g.gain.setValueAtTime(vol, now + start + dur - 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
    osc.connect(f).connect(g).connect(ctx.destination);
    osc.start(now + start);
    osc.stop(now + start + dur + 0.02);
}
function synthWhoosh(start, dur, vol = 0.25) {
    const ctx = audio(), now = ctx.currentTime, len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = buf;
    f.type = 'bandpass';
    f.Q.value = 0.8;
    f.frequency.setValueAtTime(300, now + start);
    f.frequency.exponentialRampToValueAtTime(3500, now + start + dur);
    g.gain.setValueAtTime(0.0001, now + start);
    g.gain.exponentialRampToValueAtTime(vol, now + start + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
    src.connect(f).connect(g).connect(ctx.destination);
    src.start(now + start);
    src.stop(now + start + dur);
}
function playStreakSounds(cap, stopAt) {
    if (!state.data.sound) return;
    try {
        let at = 0, gap = 0.035;
        while (at < stopAt - 0.1) { synthTone(1500, at, 0.025, 'triangle', 0.07); at += gap; gap *= 1.09; }
        // Embrasement : souffle qui monte, puis accord de cloches
        synthWhoosh(Math.max(0, stopAt - 0.25), 0.7);
        [784, 988, 1175, 1568].forEach((f, i) => synthTone(f, stopAt + 0.35 + i * 0.03, 1.3, 'sine', 0.08));
        [1568, 1976].forEach((f, i) => synthTone(f * 2, stopAt + 0.38 + i * 0.05, 0.6, 'sine', 0.04));
        if (cap) {   // trompettes des caps (7, 30, 50, 100…)
            const t = stopAt + 0.9;
            [[392, 0, .12], [392, .14, .12], [392, .28, .12], [523, .42, .9]].forEach(([f, s, d]) => { synthBrass(f, t + s, d); synthBrass(f * 1.5, t + s, d, 0.05); });
            [659, 784].forEach(f => synthBrass(f, t + 0.42, 0.9, 0.05));
        }
        synthTone(600, stopAt + 0.95, 0.18, 'sine', 0.18, 1300);   // « pop » quand le jour s'allume
    } catch (err) {
        /* pas de son disponible */
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
    $('orderNudge').addEventListener('click', () => askNudge('order'));
    $('pairsNudge').addEventListener('click', () => askNudge('pairs'));
    $('continueBtn').addEventListener('click', () => commit(state.verdict !== 'wrong'));
    $('forceBtn').addEventListener('click', () => commit(true));
    $('reviewBtn').addEventListener('click', () => openReviewModal());

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Onglet Défis touché alors qu'on y est déjà : bascule entre « Défis » et « Entraînement »
            if (btn.dataset.screen === 'challenges' && !$('challengesScreen').hidden) {
                setChallengesTab(challengesTab === 'defis' ? 'training' : 'defis');
                window.scrollTo(0, 0);
                return;
            }
            showScreen(btn.dataset.screen);
        });
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
    $('avatarEditBtn').addEventListener('click', openAvatarModal);
    document.querySelectorAll('.challenges-tab').forEach(t => t.addEventListener('click', () => setChallengesTab(t.dataset.sub)));
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
    $('dropChip').addEventListener('click', openDropsModal);
    $('eventBanner').addEventListener('click', () => { showScreen('challenges'); setChallengesTab('event'); });
    window.addEventListener('resize', updateEventBanner);
    $('missionsRow').addEventListener('click', openMissionsModal);
    $('closeMissionsBtn').addEventListener('click', () => { $('missionsModal').hidden = true; });
    $('patchOk').addEventListener('click', closePatchNotes);
    $('missionsModal').addEventListener('click', e => { if (e.target === $('missionsModal')) $('missionsModal').hidden = true; });
    $('closeDropsBtn').addEventListener('click', closeDropsModal);
    $('dropsModal').addEventListener('click', e => { if (e.target === $('dropsModal')) closeDropsModal(); });
    $('dropsTrainBtn').addEventListener('click', () => dropsGo('training'));
    $('dropsReviewBtn').addEventListener('click', () => dropsGo('review'));
    $('dropsRefillBtn').addEventListener('click', () => { if (refillDrops()) closeDropsModal(); });
    setInterval(renderDrops, 30000);   // les gouttes se rechargent même sans rien toucher
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
        if (badge) badge.dataset.event ? showEventFact(badge) : showFact(badge.dataset.theme, badge);
    });
    document.addEventListener('pointerdown', e => {
        if (!$('factBubble').hidden && !e.target.closest('.decor-badge') && !e.target.closest('.map-kulti')) $('factBubble').hidden = true;
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
    $('closeAuthBtn').addEventListener('click', closeAuthModal);
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
    $('tourSkip').addEventListener('click', () => { tourSkipped = true; endTour(); });
    $('dailyReviewBtn').addEventListener('click', openDailyReview);
    window.addEventListener('resize', () => { if (!$('tour').hidden) placeTour(); });
    window.addEventListener('scroll', () => { if (!$('tour').hidden) placeTour(); }, { passive: true });   // fin du défilement : la lumière suit

    $('quitStayBtn').addEventListener('click', closeQuitModal);
    $('quitConfirmBtn').addEventListener('click', () => {
        if (state.phase !== 'over') queueStats('quit');
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

    // Zone de réponse (multiligne d'une ligne) : jamais de retour à la ligne. Certains claviers Android
    // n'envoient pas de touche « Enter » : on reconnaît alors le saut de ligne qu'ils veulent insérer.
    let lastEnterKey = 0;
    $('userInput').addEventListener('keydown', e => { if (e.key === 'Enter') lastEnterKey = Date.now(); });
    $('userInput').addEventListener('beforeinput', e => {
        if (e.inputType !== 'insertLineBreak' && e.inputType !== 'insertParagraph') return;
        e.preventDefault();
        if (Date.now() - lastEnterKey < 300) return;   // déjà traité par la touche Entrée
        if (state.phase === 'answering') verify(false);
        else if (state.phase === 'feedback') commit(state.verdict !== 'wrong');
    });
    $('userInput').addEventListener('input', () => {   // texte collé avec des retours à la ligne
        const input = $('userInput');
        if (/[\r\n]/.test(input.value)) input.value = input.value.replace(/[\r\n]+/g, ' ');
        if (gridTyping() && state.phase === 'answering') {   // saisie dans la grille : lettres seulement, une par case vide
            const max = hintBlankCount(state.current.q, hintLevelNow());
            const clean = [...input.value].filter(isLetter).slice(0, max).join('');
            if (clean !== input.value) input.value = clean;
            renderHintGrid();
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
            if (e.key === 'Escape') { closeAuthModal(); $('accountModal').hidden = true; }
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

/* ---------- Touche « retour » du téléphone ----------
   Sans rien, elle quittait l'appli (et la leçon en cours était perdue). On garde une étape d'avance dans
   l'historique du navigateur : chaque « retour » est intercepté et fait l'action logique de l'appli. */
let backGuard = false;
let backExitArmedAt = 0;
function armBackGuard() {
    if (backGuard) return;
    history.pushState({ kultivo: true }, '');
    backGuard = true;
}

/** Ferme la fenêtre ouverte la plus « haute » ; renvoie true si quelque chose a été fermé. */
/** Halloween (2026-10-25) : araignées qui pendent au bout de leur fil et toiles dans les marges du parcours,
    et une chauve-souris qui traverse l'écran de temps en temps. Décor seulement (on ne peut pas les toucher). */
function buildHalloweenExtras() {
    const ev = currentEvent();
    document.querySelectorAll('.hw-extra').forEach(n => n.remove());
    if (!ev || ev.bank !== 'halloween') return;
    const box = $('mapDecor');
    const spiders = Math.round(MAX_LEVEL / 7);
    for (let i = 0; i < spiders; i++) {
        const sp = el('span', `hw-extra hw-spider ${i % 2 ? 'right' : 'left'}`);
        sp.style.setProperty('--y', `${(((i + 0.25) / spiders) * 100).toFixed(1)}%`);
        sp.style.setProperty('--len', `${50 + ((i * 37) % 90)}px`);
        sp.style.setProperty('--k', (0.25 + 0.5 * (0.5 + 0.5 * Math.sin(i * 1.7))).toFixed(2));
        sp.style.animationDelay = `${-((i * 0.7) % 3)}s`;
        sp.append(emojiImg('🕷️'));
        box.append(sp);
    }
    const webs = Math.round(MAX_LEVEL / 9);
    for (let i = 0; i < webs; i++) {
        const w = el('span', `hw-extra hw-web ${i % 2 ? 'left' : 'right'}`);
        w.style.setProperty('--y', `${(((i + 0.6) / webs) * 100).toFixed(1)}%`);
        w.append(emojiImg('🕸️'));
        box.append(w);
    }
    const bat = el('span', 'hw-extra hw-bat');
    bat.append(emojiImg('🦇'));
    $('mapScreen').append(bat);
}

/** Bac à sable : pastille 🧪 toujours visible (menu : +1 000 🪙, recommencer, quitter) et quelques faux amis. */
function initBac() {
    if (!BAC) return;
    const pill = el('button', 'bac-pill');
    pill.type = 'button';
    pill.textContent = '🧪';
    pill.setAttribute('aria-label', 'Bac à sable');
    pill.addEventListener('click', async () => {
        const more = await askConfirm({ title: '🧪 Bac à sable', text: 'Une copie de ta partie : tout ce que tu fais ici reste ici. Rien n’est envoyé en ligne, ton vrai jeu ne change pas.',
            yes: '+1 000 🪙 pour tester', no: 'Plus d’options' });
        if (more) { state.data.coins += 1000; saveData(); renderHeader(); if (!$('shopScreen').hidden) renderShop(); return; }
        const tips = await askConfirm({ title: '🧪 Bac à sable', text: 'Revoir les bulles d’explication (Halloween, Défis, Profil, Classement) ?', yes: 'Revoir les bulles', no: 'Plus d’options' });
        if (tips) {
            const d = state.data;
            EVENTS.forEach(ev => { d[ev.tip] = false; d[`${ev.tip}Page`] = false; });
            ['tipChallenges', 'tipTraining', 'tipTraining2', 'tipProfile', 'tipLeague', 'tipLeagueIntro', 'tipDrops'].forEach(k => { d[k] = false; });
            saveData();
            showToast('Bulles remises : va dans Défis pour les voir.');
            return;
        }
        const anim = await askConfirm({ title: '🧪 Bac à sable', text: 'Voir l’animation du jour de série (avec ta série actuelle) ?', yes: 'Voir l’animation', no: 'Plus d’options' });
        if (anim) { showStreakAnim(state.data.streak || 1); return; }
        const more2 = await askConfirm({ title: '🧪 Bac à sable', text: 'Voir les autres petites fêtes ?', yes: 'Récap du mois en cours', no: 'Plus d’options' });
        if (more2) { recapSlides = []; openRecap(monthKeyOf(todayKey())); return; }
        const more3 = await askConfirm({ title: '🧪 Bac à sable', text: 'Voir le gel de série puis le nouveau titre ?', yes: 'Gel + titre', no: 'Plus d’options' });
        if (more3) { celebrate(() => showFreezeAnim(state.data.streak || 1)); const t = titleFor(state.data.xp); celebrate(() => showTitleAnim({ from: 'Curieux', to: t.current.name, next: t.next })); return; }
        const reset = await askConfirm({ title: '🧪 Bac à sable', text: 'Recommencer le test avec une nouvelle copie de ta vraie partie ?', yes: 'Recommencer le test', no: 'Fermer' });
        if (reset) { try { localStorage.removeItem(STORAGE_KEY); } catch (err) { /* tant pis */ } location.reload(); }
    });
    document.body.append(pill);
    // Faux amis, pour voir les cadres et les fonds chez les autres
    const me = { id: 'bac-moi' };
    cloudUser = me;
    const fake = (id, pseudo, hue, emoji, bg, frame, xp, found) => ({ id, link: id, pseudo, look: { hue, emoji, bg, frame }, week: weekStart(), week_xp: xp,
        prev_week: null, prev_week_xp: 0, streak: 5, summary: { title: 'Curieux', xp: xp * 3, streak: 5, unlocked: 30, levels: 29, badges: [], cards: [], event: { id: 'halloween-2026', found } } });
    league = { userId: 'bac-moi', pseudo: (loadLeagueCache() || {}).pseudo || 'Moi', incoming: [], outgoing: [], duels: [],
        friends: [fake('bac1', 'Léa', 330, '🦉', 'bg-galaxy', 'fr-laurel-gold', 420, 31), fake('bac2', 'Tom', 15, null, null, 'fr-flame', 260, 12),
                  fake('bac3', 'Inès', 200, '🦄', 'bg-or', 'fr-diamond', 180, 45), fake('bac4', 'Noé', 120, '🐢', 'bg-ocean', 'fr-checker', 90, 5)] };
}

const PATCH_NOTES = [
    // Court et clair (2026-10-25) : ce que les bulles d'explication disent déjà (citrouilles, règles d'Halloween) n'est pas répété
    ['🎃', 'Halloween, jusqu’au 2 novembre', 'Un événement spécial dans Défis, avec une carte et des emojis d’avatar à gagner.'],
    ['🛍️', 'Nouvelle boutique', 'Chaque lundi, une collection assortie pour ton avatar (cadre, fond, emoji) et ta carte de la semaine.'],
    ['🎨', 'Ton avatar', 'Des fonds, des emojis et des cadres à débloquer en jouant. Bouton « ✏️ Modifier » à côté de ton nom.'],
    ['🃏', '30 nouvelles cartes', '12 cartes par thème désormais, 180 en tout.'],
    ['🔤', 'Indices plus pratiques', 'Avec un indice, tape seulement les lettres qui manquent : elles se placent dans la grille.'],
    ['✍️', 'Correction plus précise', 'Un nouveau système reconnaît mieux les fautes de frappe dans tes réponses.'],
    ['⏳', 'Frises', 'Reste appuyé sur une carte placée pour la déplacer. Et la difficulté monte plus doucement.'],
    ['👆', 'Coup de pouce', 'Dans les frises et les paires : place une carte ou révèle une paire de ton choix.'],
    ['🔁', 'Niveaux déjà réussis', 'Les refaire rapporte moins d’XP. S’ils font partie de tes 20 derniers niveaux, ils comptent pour tes missions.'],
    ['🎖️', 'Titres revus', 'Il faut plus d’XP pour chaque titre. Ton XP, elle, ne change pas.'],
    ['🪙', 'Pièces', 'Un peu moins par niveau, plus pour l’objectif du jour. Les indices sont moins chers en stock qu’au dernier moment.'],
    ['📅', 'Toutes les questions', 'Défi du jour, sprint et duels piochent aussi dans les questions de l’entraînement.']
];
function maybeShowPatchNotes() {
    const d = state.data;
    if (!patched() || (d.patchSeen === PATCH_DAY && !demoLundi) || !d.onboarded) return;
    const oldPlayer = demoLundi || Object.keys(d.activeDays || {}).some(k => k < PATCH_DAY);
    if (!oldPlayer) { d.patchSeen = PATCH_DAY; saveData(); return; }   // nouveau joueur : rien à annoncer
    if (document.querySelector('.modal-overlay:not([hidden]), .tour:not([hidden])') || !$('studyScreen').hidden) {
        setTimeout(maybeShowPatchNotes, 3000);   // une autre fenêtre est ouverte : on réessaie plus tard
        return;
    }
    const list = $('patchList');
    list.replaceChildren();
    for (const [icon, title, text] of PATCH_NOTES) {
        const item = el('div', 'patch-item');
        const ic = el('span', 'patch-icon');
        ic.textContent = icon;
        const body = el('div');
        const b = el('b');
        b.textContent = title;
        const p = el('p');
        p.textContent = text;
        body.append(b, p);
        item.append(ic, body);
        list.append(item);
    }
    $('patchModal').hidden = false;
}
function closePatchNotes() {
    $('patchModal').hidden = true;
    if (demoLundi) return;   // démo : la fenêtre reviendra pour de vrai lundi
    state.data.patchSeen = PATCH_DAY;
    saveData();
}

function closeTopOverlay() {
    const open = id => !$(id).hidden;
    if ($('streakAnim') && !$('streakAnim').hidden) { closeStreakAnim(); return true; }
    if (closeCelebrationLayer('titleAnim') || closeCelebrationLayer('freezeAnim')) return true;
    if ($('recapStory') && !$('recapStory').hidden) { closeRecap(); return true; }
    if (open('askModal')) { $('askNo').click(); return true; }
    if (open('photoZoom')) {
        $('photoZoom').hidden = true;
        if (state.phase === 'answering') { $('userInput').readOnly = false; $('userInput').focus(); }
        return true;
    }
    if (open('chestModal')) { closeChest(); return true; }
    if (open('dropsModal')) { closeDropsModal(); return true; }
    if (open('missionsModal')) { $('missionsModal').hidden = true; return true; }
    if (open('patchModal')) { closePatchNotes(); return true; }
    if (open('avatarModal')) { closeAvatarModal(); return true; }
    if (open('titlesModal')) { $('titlesModal').hidden = true; return true; }
    if (open('friendModal')) { $('friendModal').hidden = true; return true; }
    if (open('authModal')) { closeAuthModal(); return true; }
    if (open('accountModal')) { $('accountModal').hidden = true; return true; }
    if (open('reportModal')) { $('reportModal').hidden = true; return true; }
    if (open('streakModal')) { $('streakModal').hidden = true; return true; }
    if (open('quitModal')) { closeQuitModal(); return true; }
    if (open('startModal')) { closeStartModal(); return true; }
    if (open('tour')) { $('tourSkip').hidden ? $('tourNext').click() : $('tourSkip').click(); return true; }
    if (open('factBubble')) { $('factBubble').hidden = true; return true; }
    if (open('cloudConflictModal')) return true;   // choix obligatoire : on ne ferme pas
    return false;
}

function onBackButton() {
    backGuard = false;
    if (closeTopOverlay()) { armBackGuard(); return; }
    if (!$('studyScreen').hidden) {
        if (state.phase === 'over') returnToMap();
        else openQuitModal();   // « Quitter ? » : la progression n'est plus perdue par erreur
        armBackGuard();
        return;
    }
    if (!$('onboardScreen').hidden) {
        if (onboard.step > 0) $('onboardBack').click();
        armBackGuard();
        return;
    }
    const screen = MAIN_SCREENS.find(name => !$(`${name}Screen`).hidden);
    if (screen && screen !== 'map') { showScreen('map'); armBackGuard(); return; }
    // Parcours : un 2e appui dans les 2,5 s quitte l'appli
    if (Date.now() - backExitArmedAt < 2500) { history.back(); return; }
    backExitArmedAt = Date.now();
    showToast('Appuie encore sur retour pour quitter Kultivo');
    setTimeout(() => { if (!backGuard && Date.now() - backExitArmedAt >= 2400) armBackGuard(); }, 2500);
}
window.addEventListener('popstate', onBackButton);

function init() {
    armBackGuard();   // touche retour du téléphone gérée par l'appli
    bindEvents();
    readInviteFromUrl();                                    // lien d'invitation « ?ami=pseudo »
    flushReports();                                         // signalements restés en attente
    cloudInit();                                            // compte connecté ? synchronisation
    window.addEventListener('online', flushReports);        // dès que la connexion revient
    applyEventLook();
    if (currentEvent()) setInterval(placePumpkins, 700);   // citrouilles cachées de l'événement
    initBac();
    setInterval(() => { const l = document.getElementById('leagueLeft'); if (l && !$('leagueScreen').hidden) l.textContent = `⏳ ${vitrineTimeLeft()}`; }, 30000);
    avCheck();                                              // objets d'avatar déjà gagnés (sans annonce)
    updateNavNotifications();
    setTimeout(maybeShowPatchNotes, 1500);                  // « Quoi de neuf ? » après une mise à jour
    buildDecor($('mapDecor'), Math.round(MAX_LEVEL * 1.2));
    buildHalloweenExtras();
    buildDecor($('lessonDecor'), 8);
    checkThemeComplete(true);   // thèmes déjà complets : notés sans fête
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
    else {
        // Démonstration du message « série en danger » sans attendre : ?demo=gel (gel manquant), ?demo=gel-ok (assez de gels)
        const demo = new URLSearchParams(location.search).get('demo');
        if (demo === 'gel') setTimeout(() => checkStreakDanger({ streak: 12, missed: 2, freeze: 1, coins: Math.max(state.data.coins, 250) }), 1500);
        else if (demo === 'gel-ok') setTimeout(() => checkStreakDanger({ streak: 12, missed: 1, freeze: 2 }), 1500);
        else setTimeout(checkStreakDanger, 1500);   // série en danger après un jour manqué ?
    }
}

document.addEventListener('DOMContentLoaded', init);

// Application installable : le service worker garde une copie du jeu pour jouer hors connexion
// (ne marche qu'en https ou sur localhost, pas en ouvrant le fichier directement)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}