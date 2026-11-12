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
// 11/11 : nouvelles couleurs (Bleu électrique) — classe posée par index.html dans le bac à sable ; logo bleu qui va avec
const PAL_ELEC = document.documentElement.classList.contains('pal-elec');
const LOGO_SRC = PAL_ELEC ? 'icons/logo-bleu.svg' : 'icons/logo.svg';
const BRAND = PAL_ELEC ? '#3d8bff' : '#58cc02';
if (PAL_ELEC) { const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = '#3d8bff'; }   // barre de l'adresse en bleu
// Palettes d'essai (11/11, apercu-palettes.html) : ?bac=1&pal=N recolore le bac à sable (couleur principale à la place du vert
// de Duolingo, or et bleu un peu décalés). Rien dans le vrai jeu tant qu'aucune n'est choisie.
const TRY_PALETTES = {
    emeraude:  { '--green': '#13a06a', '--green-deep': '#0b7a50', '--green-tint': '#d3f3e5', '--green-ink': '#075c3c', '--on-green': '#ffffff', '--glow': 'rgba(19, 160, 106, 0.10)', '--gold': '#ffbe2e', '--gold-deep': '#d99a0b', '--blue': '#1a8fd6' },
    royal:     { '--green': '#2f5bd3', '--green-deep': '#1f3f9c', '--green-tint': '#dfe7fb', '--green-ink': '#1b347f', '--on-green': '#ffffff', '--glow': 'rgba(47, 91, 211, 0.10)', '--gold': '#f5b301', '--gold-deep': '#c98f00', '--blue': '#3fa9f5' },
    lagon:     { '--green': '#12b3a8', '--green-deep': '#0c857c', '--green-tint': '#d2f4ef', '--green-ink': '#0b5f56', '--on-green': '#ffffff', '--glow': 'rgba(18, 179, 168, 0.10)', '--gold': '#ffb627', '--gold-deep': '#d6920a', '--blue': '#2b8fe0' },
    indigo:    { '--green': '#5b5bd6', '--green-deep': '#3f3fa8', '--green-tint': '#e3e3fb', '--green-ink': '#32328a', '--on-green': '#ffffff', '--glow': 'rgba(91, 91, 214, 0.10)', '--gold': '#ffbf2e', '--gold-deep': '#d99a0b', '--blue': '#1f9bd6' },
    // 2e série (11/11, « un bleu, mais pas encore fan ») : 5 bleus
    azur:      { '--green': '#1f8ce6', '--green-deep': '#1567b0', '--green-tint': '#dbeefd', '--green-ink': '#0f4f8a', '--on-green': '#ffffff', '--glow': 'rgba(31, 140, 230, 0.10)', '--gold': '#ffbe2e', '--gold-deep': '#d99a0b', '--blue': '#0b5f88' },
    // 3e série (11/11, « l'azur, mais plus lumineux ») : 3 azurs plus clairs et plus vifs (toujours plus bleus que le #1cb0f6 de Duolingo)
    // Azur éclatant + VERT DE RÉUSSITE (11/11) : le bleu pour l'identité, un vert émeraude (pas celui de Duolingo) pour les bonnes réponses
    azur3ok:   { '--green': '#33a3ff', '--green-deep': '#1a7ad6', '--green-tint': '#ddf0ff', '--green-ink': '#0f5596', '--on-green': '#ffffff', '--glow': 'rgba(51, 163, 255, 0.12)', '--gold': '#ffbe2e', '--gold-deep': '#d99a0b', '--blue': '#0b5f88',
                 '--ok': '#1fb86b', '--ok-deep': '#148a4f', '--ok-tint': '#d6f5e3', '--ok-ink': '#0b6236', '--on-ok': '#ffffff' },
    // 11/11 : verts de réussite plus lumineux (« l'émeraude fait un peu moins beau que le vert d'avant »)
    azur3pomme: { '--green': '#33a3ff', '--green-deep': '#1a7ad6', '--green-tint': '#ddf0ff', '--green-ink': '#0f5596', '--on-green': '#ffffff', '--glow': 'rgba(51, 163, 255, 0.12)', '--gold': '#ffbe2e', '--gold-deep': '#d99a0b', '--blue': '#0b5f88',
                 '--ok': '#4fc72c', '--ok-deep': '#3a9a1f', '--ok-tint': '#dcf6d2', '--ok-ink': '#2a6b14', '--on-ok': '#ffffff' },
    azur3frais: { '--green': '#33a3ff', '--green-deep': '#1a7ad6', '--green-tint': '#ddf0ff', '--green-ink': '#0f5596', '--on-green': '#ffffff', '--glow': 'rgba(51, 163, 255, 0.12)', '--gold': '#ffbe2e', '--gold-deep': '#d99a0b', '--blue': '#0b5f88',
                 '--ok': '#2ec457', '--ok-deep': '#22974a', '--ok-tint': '#d5f6df', '--ok-ink': '#146a33', '--on-ok': '#ffffff' },
    azur3menthe: { '--green': '#33a3ff', '--green-deep': '#1a7ad6', '--green-tint': '#ddf0ff', '--green-ink': '#0f5596', '--on-green': '#ffffff', '--glow': 'rgba(51, 163, 255, 0.12)', '--gold': '#ffbe2e', '--gold-deep': '#d99a0b', '--blue': '#0b5f88',
                 '--ok': '#22c98a', '--ok-deep': '#179a69', '--ok-tint': '#d2f7e8', '--ok-ink': '#0d6b48', '--on-ok': '#ffffff' },
    // 11/11 : l'Azur éclatant est presque le bleu de SAPIO (#00a4ff, concurrent direct) → bleus « électriques », plus profonds, + vert pomme ✓
    elec:      { '--green': '#3d8bff', '--green-deep': '#2266d6', '--green-tint': '#dfeaff', '--green-ink': '#174a9e', '--on-green': '#ffffff', '--glow': 'rgba(61, 139, 255, 0.12)', '--gold': '#ffbe2e', '--gold-deep': '#d99a0b', '--blue': '#3d8bff', '--pairs': '#12b3a8', '--pairs-deep': '#0c857c', '--pairs-ink': '#0b5f56',
                 '--ok': '#4fc72c', '--ok-deep': '#3a9a1f', '--ok-tint': '#dcf6d2', '--ok-ink': '#2a6b14', '--on-ok': '#ffffff' },
    elecClair: { '--green': '#4a95ff', '--green-deep': '#2a6fdc', '--green-tint': '#e1edff', '--green-ink': '#1a4f9e', '--on-green': '#ffffff', '--glow': 'rgba(74, 149, 255, 0.12)', '--gold': '#ffbe2e', '--gold-deep': '#d99a0b', '--blue': '#0b5f88',
                 '--ok': '#4fc72c', '--ok-deep': '#3a9a1f', '--ok-tint': '#dcf6d2', '--ok-ink': '#2a6b14', '--on-ok': '#ffffff' },
    elecVif:   { '--green': '#2f7bff', '--green-deep': '#1c5bd6', '--green-tint': '#dde8ff', '--green-ink': '#123f96', '--on-green': '#ffffff', '--glow': 'rgba(47, 123, 255, 0.12)', '--gold': '#ffbe2e', '--gold-deep': '#d99a0b', '--blue': '#0b5f88',
                 '--ok': '#4fc72c', '--ok-deep': '#3a9a1f', '--ok-tint': '#dcf6d2', '--ok-ink': '#2a6b14', '--on-ok': '#ffffff' },
    bleuet:    { '--green': '#5b8def', '--green-deep': '#3a68c6', '--green-tint': '#e3ebfc', '--green-ink': '#22458f', '--on-green': '#ffffff', '--glow': 'rgba(91, 141, 239, 0.12)', '--gold': '#ffbe2e', '--gold-deep': '#d99a0b', '--blue': '#0b5f88',
                 '--ok': '#4fc72c', '--ok-deep': '#3a9a1f', '--ok-tint': '#dcf6d2', '--ok-ink': '#2a6b14', '--on-ok': '#ffffff' },
    azur2:     { '--green': '#2a9bf4', '--green-deep': '#1873c4', '--green-tint': '#dcefff', '--green-ink': '#0f5596', '--on-green': '#ffffff', '--glow': 'rgba(42, 155, 244, 0.12)', '--gold': '#ffbe2e', '--gold-deep': '#d99a0b', '--blue': '#0b5f88' },
    azur3:     { '--green': '#33a3ff', '--green-deep': '#1a7ad6', '--green-tint': '#ddf0ff', '--green-ink': '#0f5596', '--on-green': '#ffffff', '--glow': 'rgba(51, 163, 255, 0.12)', '--gold': '#ffbe2e', '--gold-deep': '#d99a0b', '--blue': '#0b5f88' },
    azur4:     { '--green': '#3d8bff', '--green-deep': '#2266d6', '--green-tint': '#dfeaff', '--green-ink': '#174a9e', '--on-green': '#ffffff', '--glow': 'rgba(61, 139, 255, 0.12)', '--gold': '#ffbe2e', '--gold-deep': '#d99a0b', '--blue': '#0b5f88' },
    cobalt:    { '--green': '#0b62c4', '--green-deep': '#084a94', '--green-tint': '#d8e7fa', '--green-ink': '#063a75', '--on-green': '#ffffff', '--glow': 'rgba(11, 98, 196, 0.10)', '--gold': '#ffbe2e', '--gold-deep': '#d99a0b', '--blue': '#2b9bd8' },
    klein:     { '--green': '#2b3fd1', '--green-deep': '#1d2c99', '--green-tint': '#e0e3fb', '--green-ink': '#18237a', '--on-green': '#ffffff', '--glow': 'rgba(43, 63, 209, 0.10)', '--gold': '#ffbe2e', '--gold-deep': '#d99a0b', '--blue': '#2b9bd8' },
    nuit:      { '--green': '#274690', '--green-deep': '#1a3166', '--green-tint': '#dde4f3', '--green-ink': '#172b59', '--on-green': '#ffffff', '--glow': 'rgba(39, 70, 144, 0.10)', '--gold': '#f2b632', '--gold-deep': '#c98f12', '--blue': '#2b9bd8' },
    petrole:   { '--green': '#127a8a', '--green-deep': '#0c5964', '--green-tint': '#d4eef1', '--green-ink': '#0a4a53', '--on-green': '#ffffff', '--glow': 'rgba(18, 122, 138, 0.10)', '--gold': '#ffbe2e', '--gold-deep': '#d99a0b', '--blue': '#2b8fe0' },
    corail:    { '--green': '#f2674e', '--green-deep': '#c24a35', '--green-tint': '#fde3dc', '--green-ink': '#8a3221', '--on-green': '#ffffff', '--glow': 'rgba(242, 103, 78, 0.10)', '--gold': '#ffbf2e', '--gold-deep': '#d99a0b', '--blue': '#1f9bd6' }
};
(() => { try {
    const name = new URLSearchParams(location.search).get('pal');
    const pal = BAC && name !== 'elec' && TRY_PALETTES[name];
    if (pal) Object.entries(pal).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
} catch (err) { /* rien */ } })();
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
   ancien 86 : 5·6·6 ; ancien 96 et plus : 6·6·6 (anciens numéros : levelRenumber suit les niveaux insérés, 2026-11-03). */
function orderSizes(level) {
    const R = typeof levelRenumber === 'function' ? levelRenumber : n => n;
    if (level < R(36)) return [4, 4, 4];
    if (level < R(46)) return [4, 4, 5];
    if (level < R(56)) return [4, 5, 5];
    if (level < R(76)) return [5, 5, 5];
    if (level < R(86)) return [5, 5, 6];
    if (level < R(96)) return [5, 6, 6];
    return [6, 6, 6];
}

// Coffres du parcours : un coffre après chaque niveau multiple de 5 (2 cartes ; après un défi, l’une est rare ou mieux).
// 2026-11-03 : 3 / 4 → 2 / 3 avec le parcours de 230 niveaux (46 coffres = 115 cartes, autant qu'avec 170 niveaux à 3 / 4).
// 2026-11-09 (choix A de l'utilisateur, parcours de 300 niveaux) : 2 cartes partout ; après un défi, l'une est rare ou mieux.
// 60 coffres = 120 cartes, autant qu'au départ (170 niveaux : 119).
const CHEST_EVERY = 5;
const chestSize = n => 2;
const SHOP_CHEST = { price: 250, size: 3 };   // coffre de la boutique : 3 cartes, dont une rare ou mieux (150 → 250 le 09/11 : trop de pièces)
const GOAL_CARDS = 1;                          // carte offerte avec la récompense de l'objectif du jour

// Test de placement (2026-11-09, parcours de 300 niveaux) : une étape par tranche de 20 niveaux (niveaux 1-19, 21-39, …),
// 7 étapes au plus : départ au niveau 141 au mieux (difficulté ~2,8, comme le 81 sur l'ancien parcours de 170 niveaux).
// 2 bonnes réponses sur 3 pour passer une étape, 3 sur 3 pour la dernière (choix de l'utilisateur). Avant : 8 étapes de 10.
const PLACEMENT_STEP_LEVELS = 20;
const PLACEMENT_MAX_STEPS = 7;   // départ au niveau 141 au mieux (sur 300)
const PLACEMENT_CHESTS_NOW = 3;   // coffres sautés donnés tout de suite ; les autres = cartes bonus dans les coffres suivants
const CHEST_BONUS_MAX = 3;        // cartes bonus ajoutées au plus par coffre du parcours
const PLACEMENT_XP_PER_LEVEL = 40; // XP données par niveau sauté (≈ un niveau joué), au total seulement (pas dans la semaine)
const COIN_BONUS_PER_LEVEL = 10;   // pièces dues après un placement, versées au plus par niveau réussi
const PLACEMENT_STEPS = Math.min(PLACEMENT_MAX_STEPS, Math.floor((MAX_LEVEL - 1) / PLACEMENT_STEP_LEVELS));
const placementNeed = step => (step === PLACEMENT_STEPS - 1 ? PLACEMENT_PER_STEP : PLACEMENT_PASS);   // 3 sur 3 à la dernière
const PLACEMENT_PER_STEP = 3;   // questions au plus par étape
const PLACEMENT_PASS = 2;       // bonnes réponses pour valider une étape

/* ---------- Petits utilitaires ---------- */

/** Emoji affiché en image Twemoji (dossier emoji/) : net et identique sur tous les téléphones. */
/** Image d'une carte : l'emoji, sauf dessin fait exprès (le maillot jaune, dont l'emoji est bleu). */
const CARD_IMAGES = { sp5: 'emoji/maillot-jaune.svg' };
function cardImg(card) {
    const img = emojiImg(card.icon);
    if (CARD_IMAGES[card.id]) img.src = CARD_IMAGES[card.id];
    return img;
}
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
            if (numbersTyped.length && numbersTyped.every(n => n === ans)) return 'exact';   // « 4x100 » n'est pas « 100 »
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
    // 10/11 (signalement « Ecco » pour « Eco ») : mot court avec juste une lettre doublée = petite faute
    if (len >= 2 && len <= 3 && t.length === len + 1 && [...t].some((c, i) => c === t[i + 1] && t.slice(0, i) + t.slice(i + 1) === a)) return true;
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
/** Nom de personne écrit avec des initiales (2026-11-03, signalement « jf kennedy ») : « JF Kennedy », « J. F. Kennedy »,
    « J Fitzgerald Kennedy » ou « John Fitzgerald Kennedy » pour « John F. Kennedy ». Le nom de famille doit être là (sa marge
    habituelle) ; les prénoms sont tous en initiales, ou un par un en entier / en initiale. 'exact', 'typo' ou null. */
function initialsMatch(typed, ans) {
    const tw = typed.split(' '), aw = ans.split(' ');
    if (aw.length < 2 || tw.length < 2) return null;
    const last = aw[aw.length - 1], tLast = tw[tw.length - 1];
    if (last.length < 3 || /\d/.test(last) || !(tLast === last || wordClose(tLast, last))) return null;
    const given = aw.slice(0, -1), tGiven = tw.slice(0, -1);
    if ([...given, ...tGiven].some(w => /\d/.test(w))) return null;
    let ok = tGiven.join('') === given.map(w => w[0]).join('');   // « jf kennedy », « j f kennedy »
    let close = false;
    if (!ok && tGiven.length === given.length) {
        ok = tGiven.every((w, i) => {
            const g = given[i];
            if (w === g || (w.length === 1 && w === g[0]) || (g.length === 1 && w[0] === g)) return true;
            if (wordClose(w, g)) { close = true; return true; }
            return false;
        });
    }
    if (!ok) return null;
    return close || tLast !== last ? 'typo' : 'exact';
}
const dropLeadingVerb = str => { const w = str.split(' ').filter(x => x !== 'ne' && x !== 'n'); return w.length > 1 && (w[0] === 'avoir' || w[0] === 'etre') ? w.slice(1).join(' ') : w.join(' ') || str; };   // 10/11 : le « ne » oublié est ignoré (« pas aller… »)

/* 2026-11-09 (demande de l'utilisateur, après « Tibre » accepté pour « Tigre », « Venise » pour « Vénus ») : une « faute de
   frappe » qui est EXACTEMENT la bonne réponse d'une autre question du jeu est refusée (sauf simple différence de genre ou de
   nombre : « noir » / « noire »). L'ordre de « A et B » est libre (« bleu et rouge »), sauf pour les titres et les rébus. */
let knownAnswersCache = { size: -1, set: null };
function knownAnswers() {
    const banks = [typeof QUESTIONS !== 'undefined' ? QUESTIONS : [], typeof TRAINING_QUESTIONS !== 'undefined' ? TRAINING_QUESTIONS : [],
        ...Object.values((typeof window !== 'undefined' && window.EVENT_BANKS) || {})];
    const size = banks.reduce((n, b) => n + (b.length || 0), 0);
    if (knownAnswersCache.size === size) return knownAnswersCache.set;
    const set = new Map();   // réponse normalisée -> true si c'est un nom commun dans toutes ses formes (sinon nom propre)
    for (const bank of banks) for (const q of bank || []) for (const raw of q.a || []) {
        const n = normalize(String(raw));
        const k = stripArticles(n) || n;
        if (k.length < 3) continue;
        const kind = isCommonRaw(String(raw)) ? 'common' : isProperRaw(String(raw)) ? 'proper' : 'unknown';
        const before = set.get(k);
        set.set(k, before === 'proper' || kind === 'proper' ? 'proper' : before === 'common' || kind === 'common' ? 'common' : 'unknown');
    }
    knownAnswersCache = { size, set };
    return set;
}
/** Réponse clairement écrite comme un nom commun : article puis minuscule (« les globules rouges », « la chauve-souris »).
    Sans article, on ne peut pas savoir (« Dante », « Jaune ») : traité comme un nom propre. */
const ARTICLE_START = '^(?:(?:le|la|les|un|une|des|du|de)\\s+|l[’\'])';
const isCommonRaw = raw => new RegExp(ARTICLE_START + '\\p{Ll}', 'u').test(raw.trim().replace(/^\p{Lu}/u, c => c.toLowerCase()));
/** Réponse clairement écrite comme un nom propre : article puis majuscule (« Les Météores »), ou plusieurs mots en majuscule. */
const isProperRaw = raw => {
    const r = raw.trim().replace(/^\p{Lu}/u, c => c.toLowerCase());
    return new RegExp(ARTICLE_START + '\\p{Lu}', 'u').test(r) || (raw.match(/(^|\s)\p{Lu}/gu) || []).length >= 2;
};
/** Même mot au genre ou au nombre près (un e, s, x ou « es » en plus) : « noir » / « noire », « jaunes » / « jaune ». */
const sameWord = (x, y) => x === y || [x, y].some((u, i) => { const v = i ? x : y; return ['e', 's', 'x', 'es'].some(end => u === v + end); });
// Faux amis : un « e » ou un « s » en plus, mais un tout autre mot
const FALSE_FRIENDS = new Set(['rein|reine', 'reins|reine', 'rose|rosee', 'cour|course', 'mer|mere', 'pain|paine', 'port|porte', 'vers|verse', 'bal|bale', 'fil|file', 'mur|mure', 'sol|sole', 'tour|tours', 'android|androide', 'cross|crosse']);
const falseFriends = (a, b) => FALSE_FRIENDS.has(`${a}|${b}`) || FALSE_FRIENDS.has(`${b}|${a}`);
/** 11/11 (signalement « peaux » pour « peau ») : même réponse au singulier ou au pluriel (s / x en plus sur des mots d'au moins
    3 lettres, pas de chiffres, pas de faux amis) = juste, sans remarque. */
const pluralWord = (x, y) => x === y || (!/\d/.test(x + y) && [x, y].some((u, i) => { const v = i ? x : y; return v.length >= 3 && (u === v + 's' || u === v + 'x'); }));
const samePlural = (a, b) => { const p = a.split(' '), q = b.split(' '); return a !== b && p.length === q.length && p.every((w, i) => pluralWord(w, q[i]) && !falseFriends(w, q[i])); };
const sameStem = (a, b) => { const p = a.split(' '), q = b.split(' '); return p.length === q.length && p.every((w, i) => sameWord(w, q[i]) && !falseFriends(w, q[i])); };
const ORDER_MATTERS = /rébus|titre|film|roman|livre|œuvre|oeuvre|chanson|album|pièce|tableau|fable|conte|série|opéra|jeu vidéo|bande dessinée|BD/i;
/* Question sur une PERSONNE (2026-11-09) : le nom de famille seul est accepté (« Van Gogh », « Hepburn »), jamais le prénom seul. */
const PERSON_Q = /(?<!\p{L})(qui(?!\p{L})|quel(?:le)?s?(?!\p{L})[^?]{0,40}(?<!\p{L})(?:archéologue|détective|acteur|actrice|chanteu|peintre|écrivain|auteur|autrice|romanci|poète|poétesse|compositeur|compositrice|réalisat|scientifique|savant|physicien|chimiste|mathématicien|roi|reine|empereur|impératrice|président|joueu|pilote|athlète|footballeur|tennis|navigat|explorat|invent|philosophe|architecte|sculpt|musicien|général|ministre|pape|dictateur|astronaute|cosmonaute|cuisinier|chef|couturi|styliste|rappeu|humoriste|dessinat|médecin|biologiste|astronome|aviat|cycliste|skieu|nageu|boxeu|champion|danseu|marchand|pasteur|dirigeant|souverain|conquérant|duchesse|tsar|pharaon|guitariste|pianiste|violoniste|photographe|cinéaste|journaliste|résistant|militant|révolutionnaire|artiste|espionne?|égyptologue|alpiniste|sprinteu|coureu|grimpeu|skipper|patineu|gymnaste|judoka|escrimeu|basketteu|rugbyman|golfeu|designer|créat|fondat|prix nobel|chancelier|premier ministre|homme|femme))/iu;
/** Nom de famille d'une réponse « Prénom Nom » : tout sauf le 1er mot (« van Gogh ») et le dernier mot seul (« King »). */
function surnames(raw) {
    const w = String(raw).replace(/[’']/g, ' ').split(/\s+/).filter(Boolean);
    if (w.length < 2 || w.length > 4 || /\s(le|la)\s/.test(` ${w.slice(1).join(' ')} `)) return [];   // « le Grand » ; pas « La Fontaine »
    const out = [w.slice(1).join(' '), w[w.length - 1]];
    const cap = w.findIndex((x, i) => i > 0 && /^(La|Le|Da|Di|De|Du|Van|Von)$/.test(x));   // « Jean de La Fontaine » → « La Fontaine »
    if (cap > 0) out.push(w.slice(cap).join(' '));
    return out.filter(s => s.replace(/\s/g, '').length >= 4 && !/\d/.test(s) && !/^[IVXLC]+$/.test(s));
}
/* Petits mots de liaison des noms (10/11) : un oubli ou une confusion entre eux = petite faute (« du costa » / « Da Costa »).
   Pas « il » ni « un » (Kim Jong-il / Kim Jong-un). */
const LINK_PARTICLES = new Set(['de', 'da', 'du', 'di', 'do', 'des', 'dos', 'das', 'del', 'della', 'van', 'von', 'der', 'den', 'ten', 'el', 'al', 'la', 'le', 'lo', 'los', 'las', 'les', 'd', 'l']);
const noParticles = str => str.split(' ').filter(w => w && !LINK_PARTICLES.has(w)).join('');
/** Réponse sans le (ou les) article(s) du début, mais avec ceux du milieu : « la lune de miel » → « lune de miel ». */
const innerForm = str => { const w = str.split(' ').filter(Boolean); let i = 0; while (i < w.length - 1 && ARTICLES.has(w[i])) i++; return w.slice(i).join(' '); };
/** Liste « A, B et C » : morceaux normalisés (sans articles), ou null si ce n'est pas une liste. */
function listParts(raw) {
    const parts = String(raw).split(/\s*[,;/+&]\s*|\s+et\s+/i).map(p => { const n = normalize(p); return stripArticles(n) || n; }).filter(Boolean);
    return parts.length >= 2 && parts.length <= 6 ? parts : null;
}
/** Même liste dans un autre ordre (« bleu, blanc, rouge » = « rouge, blanc et bleu ») : 'exact', 'typo' ou null. */
function listMatch(input, rawAnswers, question) {
    if (ORDER_MATTERS.test(question)) return null;
    const tList = listParts(input);
    // sans virgules (« rouge blanc bleu ») : chaque mot est un élément, si la liste attendue n'a que des mots seuls
    const tWords = (stripArticles(normalize(input)) || '').split(' ').filter(w => w && w !== 'et');
    let best = null;
    for (const raw of rawAnswers) {
        const a = listParts(raw);
        if (!a) continue;
        const t = tList || (a.every(x => !x.includes(' ')) ? tWords : null);
        if (!t || a.length !== t.length) continue;
        const used = new Array(a.length).fill(false);
        let typo = false;
        const ok = t.every(p => {
            let j = a.findIndex((x, k) => !used[k] && x === p);
            if (j < 0) { j = a.findIndex((x, k) => !used[k] && !/\d/.test(x) && answerClose(p, x)); if (j >= 0) typo = true; }
            if (j < 0) return false;
            used[j] = true;
            return true;
        });
        if (ok && !typo) return 'exact';
        if (ok) best = 'typo';
    }
    return best;
}

function judgeV2(input, rawAnswers, question = '') {
    // Réponse faite d'un seul « article » (la note « La », la lettre « D ») : on ne l'efface pas
    // Expressions (rébus ou « Quelle expression… ») : « avoir » / « être » au début ignorés (« la main verte » = « avoir la main verte »)
    const expression = /expression|que veut dire|que signifie/i.test(question);   // 10/11 : aussi « Que veut dire « coûter les yeux de la tête » ? »
    const full = str => (expression ? dropLeadingVerb(normalize(str)) : normalize(str));
    const keep = str => { const n = full(str); return stripArticles(n) || n; };
    const typed = keep(input);
    if (!typed) return rawAnswers.some(r => String(r).trim() === String(input).trim()) ? 'exact' : 'wrong';   // « € »
    const listed = listMatch(input, rawAnswers, question);
    if (listed === 'exact') return 'exact';
    const typedFull = full(input);
    const numbersTyped = normalize(input).match(/\d+(?:\.\d+)?/g) || [];
    const questionWords = new Set(stripArticles(normalize(question)).split(' '));
    let typo = false;
    const answers = [];   // [réponse sans articles, réponse complète (pour les « de / du »)]
    const names = [];     // réponses qui sont des noms de personnes (initiales acceptées)
    for (const raw of rawAnswers) {
        const ans = keep(raw);
        if (!ans) continue;
        answers.push([ans, full(raw), false, isCommonRaw(String(raw)) || /^\p{Ll}/u.test(String(raw).trim())]);   // 4e : nom commun (pluriel toléré)
        const short = answerWithoutGeneric(ans);
        if (short && short.length >= 3 && !short.split(' ').every(w => questionWords.has(w))) answers.push([short, short, true]);
        if (!expression && looksLikeName(raw)) {   // nom avant le prénom : « Sartre Jean-Paul », « Khan Kubilaï »
            const w = ans.split(' ');
            if (w.length >= 2) { const turned = [w[w.length - 1], ...w.slice(0, -1)].join(' '); answers.push([turned, turned, true]); }
            names.push(ans);
            // personne connue par son prénom (le prénom seul est dans les réponses : Dante, Zlatan, Léonard…) : pas de nom seul
            const firstOnly = rawAnswers.some(r => keep(r) === keep(String(raw).split(/[\s’']+/)[0]));
            if (PERSON_Q.test(question) && !firstOnly) for (const s of surnames(raw)) { const k = keep(s); if (k && k.length >= 4) answers.push([k, k, true]); }
        }
    }
    // 10/11 (choix de l'utilisateur) : un petit mot (de, du, la…) oublié ou faux AU MILIEU de la réponse = « attention à
    // l'orthographe » (« lune miel », « lune du miel » pour « lune de miel ») ; l'article du début reste libre. Proverbes à
    // compléter : la tournure exacte est demandée, c'est faux. Formes raccourcies par le jeu (nom seul, « Orsay ») : libres.
    let slip = false;
    const proverb = /complète le proverbe/i.test(question);
    for (const [ans, ansFull, loose, common] of answers) {
        if (/^\d+(\.\d+)?$/.test(ans)) {   // nombre (date, distance…) : exact uniquement
            if (numbersTyped.length && numbersTyped.every(n => n === ans)) return 'exact';   // « 4x100 » n'est pas « 100 »
            continue;
        }
        if (addsLink(typedFull, ansFull)) continue;
        if (typed === ans) {
            if (loose || innerForm(typedFull) === innerForm(ansFull)) return 'exact';
            slip = true;
            continue;
        }
        if (common && samePlural(typed, ans) && knownAnswers().get(typed) !== 'proper') return 'exact';   // « peaux » = « peau » (11/11) ; jamais un nom propre
        const numbersAns = ans.match(/\d+(?:\.\d+)?/g) || [];
        const sameNumbers = numbersAns.join(' ') === (typed.match(/\d+(?:\.\d+)?/g) || []).join(' ');
        if (sameNumbers && answerClose(typed, ans)) typo = true;
    }
    for (const ans of names) {
        const r = initialsMatch(typed, ans);
        if (r === 'exact') return 'exact';
        if (r === 'typo') typo = true;
    }
    if (slip) return proverb ? 'wrong' : 'typo';
    // 10/11 (signalement « du costa » pour « Da Costa ») : mots collés ou séparés = même réponse (« yoyo », « dicaprio ») ;
    // petit mot de liaison faux ou oublié (de / da / du / di / el / van…) = petite faute, si le reste est exactement juste
    const compact = typed.replace(/ /g, '');
    for (const [ans] of answers) {
        if (compact.length >= 4 && compact === ans.replace(/ /g, '')) return 'exact';
        const core = noParticles(ans);
        if (core.length >= 4 && noParticles(typed) === core) typo = true;
    }
    // « Faute de frappe » qui est en fait la réponse d'une autre question (Tibre / Tigre) : refusée
    if (listed === 'typo') typo = true;
    // (simple pluriel / féminin d'un nom commun toléré : « globule rouge » pour « globules rouges »)
    const known = knownAnswers();
    if (typo && known.has(typed)) {
        const kind = known.get(typed);
        const common = kind === 'common' || (kind === 'unknown' && rawAnswers.some(r => isCommonRaw(String(r))));
        if (!(common && answers.some(([ans]) => sameStem(typed, ans)))) return 'wrong';
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
        orderRecent: [],                 // familles des dernières frises (2026-10-30 : éviter de toujours revoir les mêmes)
        cards: {},                       // collection : id de carte (cards.js) -> nombre d'exemplaires
        chests: {},                      // coffres du parcours ouverts : n° du niveau -> date
        podium: {},                      // classement : lundi de la semaine -> place obtenue (0 = rien)
        avatar: null,                    // avatar choisi : { hue: 0-359, emoji: '🦉' ou null = initiale }
        trainTier: {},                   // entraînement : thème -> palier débloqué (1 à 10)
        trainCatchup: {},                // entraînement (10/11) : thème -> rattrapage des questions jamais vues des paliers validés à la conversion
        trainTierDay: {},                // entraînement : thème -> jour du dernier palier RÉUSSI (1 par jour)
        trainTierWon: {},                // entraînement (09/11) : thème -> dernier palier réussi ; le suivant s'ouvre un autre jour
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
        questDone: {},                   // quête en duo : lundi -> coffre ouvert
        kulti: null,                     // défi de Kulti du jour : { day, kind, theme, done, won }
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
        duelStarted: {},                 // duels reçus commencés : id -> { score, grid, seconds } (envoyés même si on quitte)
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
    for (const key of ['goalDays', 'daily', 'badges', 'claimedBadges', 'claimedGoals', 'stats', 'done', 'pairStats', 'orderStats', 'cards', 'chests', 'podium', 'trainTier', 'trainTierDay', 'trainTierWon', 'trainChests', 'trainMedals', 'trainCatchup', 'shinyCards', 'themeComplete', 'activeDays', 'frozenDays', 'events', 'duelsSeen', 'duelAnswers', 'duelsViewed', 'questDone', 'duelStarted']) data[key] = data[key] || {};
    if (OLD_GOALS[data.goal]) data.goal = OLD_GOALS[data.goal];
    if (!GOAL_CHOICES.some(c => c.xp === data.goal)) data.goal = GOAL_CHOICES[1].xp;
    backfillActiveDays(data);
    if (!Array.isArray(data.reports)) data.reports = [];
    if (!Array.isArray(data.orderRecent)) data.orderRecent = [];   // familles des dernières frises (2026-10-30)
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

    if ((data.levelLayout || 1) < LEVEL_LAYOUT) migrateLevelLayout(data);
    if ((data.trainLayout || 1) < TRAIN_LAYOUT) migrateTrainLayout(data);
    const doneLevels = Object.keys(data.done).map(Number).filter(n => data.done[n]);
    const lastDone = doneLevels.length ? Math.max(...doneLevels) : 0;
    data.unlocked = Math.max(1, data.unlocked || 1, Math.min(lastDone + 1, MAX_LEVEL));
    data.unlocked = Math.min(data.unlocked, MAX_LEVEL);
    // 11/11 : badge « Parcours complet » donné à tort (dernier niveau d'un parcours plus court, avant les niveaux ajoutés) :
    // retiré UNE fois à ceux qui n'ont pas fini le dernier niveau d'aujourd'hui (personne ne l'a fini). Les pièces déjà reçues restent.
    if (!data.completeFix) {
        if (data.badges.complete && !data.done[MAX_LEVEL]) { delete data.badges.complete; delete data.claimedBadges.complete; }
        data.completeFix = true;
    }
    return data;
}

/* Niveaux insérés dans le parcours (2026-11-03 : 1re vague après les anciens 80 et 90, 2e vague après 100, 110, 120 et 130 ;
   levels.js, LEVEL_WAVES). Une sauvegarde de n'importe quelle disposition passe directement à la dernière (levelFromLayout).
   Une sauvegarde d'avant (sans « levelLayout ») est convertie UNE fois : niveaux faits, coffres ouverts, niveau en cours,
   placement prennent leur nouveau numéro (levelRenumber). Les niveaux insérés derrière un joueur restent « à faire »
   (facultatifs, jouables quand il veut) et leurs coffres ne s'ouvrent qu'en les terminant. Un joueur pile au début d'un
   bloc inséré (ex. : il allait jouer l'ancien 81) commence ce bloc. Pas de « levelLayout » dans defaultData : sinon une
   vieille sauvegarde, complétée par defaultData au chargement, paraîtrait déjà convertie. */
const LEVEL_LAYOUT = 5;   // 2 = 190 niveaux, 3 = 230, 4 = 310 (une heure le 09/11), 5 = 300 (bloc après l'ancien 10 retiré)
function migrateLevelLayout(data) {
    const from = data.levelLayout || 1;
    const R = typeof levelFromLayout === 'function' ? n => levelFromLayout(n, from, true) : n => n;
    const F = typeof levelFromLayout === 'function' ? n => levelFromLayout(n, from) : n => n;   // null = niveau d'un bloc retiré
    const remap = obj => Object.fromEntries(Object.entries(obj || {}).map(([k, v]) => [F(Number(k)), v]).filter(([k]) => k !== null).map(([k, v]) => [String(k), v]));
    data.done = remap(data.done);
    data.chests = remap(data.chests);
    if (data.replayDay && data.replayDay.levels) data.replayDay.levels = remap(data.replayDay.levels);
    data.unlocked = R(Math.max(1, data.unlocked || 1) - 1) + 1;
    if (data.placement && data.placement.start) data.placement.start = R(data.placement.start - 1) + 1;
    data.levelLayout = LEVEL_LAYOUT;
}

/* Entraînement : 5 → 10 paliers (2026-11-10, décisions de l'utilisateur). Une sauvegarde d'avant (sans « trainLayout ») est
   convertie UNE fois : palier N réussi sur 5 → palier 2N réussi sur 10 (le palier en cours N devient 2N − 1), coffres des paliers
   validés marqués comme donnés (aucune carte en plus), rattrapage des questions jamais vues de ces paliers (trainCatchup),
   médailles RECALCULÉES sur toutes les questions du thème (une seule fois ; les badges restent). Pas de « trainLayout » dans
   defaultData (même raison que levelLayout). L'ancien palier réussi se calcule sur les anciennes questions (x001-x150, 5 paliers). */
const TRAIN_LAYOUT = 2;
function migrateTrainLayout(data) {
    const bankAll = typeof TRAINING_QUESTIONS === 'undefined' ? [] : TRAINING_QUESTIONS;
    const right = id => (data.stats[id]?.right || 0) >= 1;
    const mastered = id => !!data.stats[id]?.mastered || (data.stats[id]?.streak || 0) >= 2;
    const today = todayKey();
    for (const { theme } of THEME_DECOR) {
        const bank = bankAll.filter(q => q.theme === theme).sort((a, b) => a.d - b.d || a.id - b.id);
        if (!bank.length) continue;
        if (data.trainTier[theme] || data.trainTierWon[theme] !== undefined) {
            const oldTier = Math.min(5, Math.max(1, data.trainTier[theme] || 1));
            let oldWon = data.trainTierWon[theme];
            if (oldWon === undefined) {   // jamais calculé : on le calcule sur les 5 anciens paliers
                const old = bank.filter(q => q.id % 1000 <= 150);
                const size = Math.ceil(old.length / 5) || 1;
                const qs = old.slice((oldTier - 1) * size, oldTier * size);
                const ready = qs.length > 0 && qs.filter(q => right(q.id)).length >= Math.ceil(qs.length * 2 / 3);
                oldWon = ready && data.trainTierDay[theme] !== today ? oldTier : oldTier - 1;
            }
            oldWon = Math.max(0, Math.min(oldTier, oldWon));
            data.trainTierWon[theme] = oldWon * 2;
            data.trainTier[theme] = Math.max(1, oldWon === oldTier ? oldTier * 2 : oldTier * 2 - 1);
            const given = Math.max(1, data.trainChests[theme] || 1);   // ancien : coffres donnés pour les paliers 1 … given − 1
            data.trainChests[theme] = oldWon >= 5 ? TRAIN_TIERS + 1 : Math.min(2 * (given - 1), oldWon * 2) + 1;
            if (oldWon >= 1) data.trainCatchup[theme] = true;
        }
        if (data.trainMedals[theme]) {   // médailles recalculées une fois sur toutes les questions du thème
            const have = bank.filter(q => mastered(q.id)).length;
            data.trainMedals[theme] = [1 / 3, 2 / 3, 1].filter(part => have >= Math.ceil(bank.length * part)).length;
        }
    }
    data.trainLayout = TRAIN_LAYOUT;
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
        // 12/11 : on recopie AUSSI quand la vraie partie a plus d'XP que la copie (une vieille copie vide restait pour toujours : « je repars du niveau 1 »)
        try {
            const real = localStorage.getItem('cultureG_v2');
            const copy = localStorage.getItem(STORAGE_KEY);
            const xpOf = raw => { try { return Number(JSON.parse(raw).xp) || 0; } catch (e) { return 0; } };
            if (real && (!copy || xpOf(real) > xpOf(copy))) localStorage.setItem(STORAGE_KEY, real);
        } catch (err) { /* tant pis */ }
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
// 09/11 : une question ratée puis réussie aujourd'hui (révision, niveau…) ne revient dans « à revoir » que demain
// (sinon on enchaînait les mêmes 3 questions, réponse fraîchement vue, pour l'XP et la mission « révisions »)
const okToday = id => state.data.stats[id]?.okDay === todayKey();
const missedCards = () => QUESTIONS.filter(q => missCount(q.id) > 0 && !isLater(q.id) && !okToday(q.id));

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
    if (entry.streak >= 2) entry.mastered = true;   // maîtrisée pour de bon (compteurs et médailles ne reculent plus)
    entry.tries = (entry.tries || 0) + 1;
    if (ok && !entry.right) {   // 12/11 : 1re réussite = un nouveau savoir pour l'Encyclopédie (date gardée pour « Récents »)
        entry.first = todayKey();
        if (encQuestion(id)) (state.newSavoirs || (state.newSavoirs = [])).push(id);
    }
    if (ok) { entry.right = (entry.right || 0) + 1; entry.okDay = todayKey(); }
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

/* ---------- Nouvelle médaille d'entraînement (2026-10-29, aperçu : apercu-medaille.html) ----------
   Après l'écran de fin : la médaille tombe en tournant (rayons, ✨), son nom, le thème, la suivante, Kulti qui félicite.
   Fond violet (couleur de l'entraînement). Un tap pendant l'animation la termine. File `celebrate` (avant le nouveau titre). */
const MEDAL_IMGS = ['1f949', '1f948', '1f947'];
function showMedalAnim({ theme, icon, medal, mastered }) {
    const ov = celebrationLayer('medalAnim', `medal-anim is-m${medal}`);
    const m = TRAIN_MEDALS[medal - 1];
    const names = ['Médaille de bronze', 'Médaille d’argent', 'Médaille d’or'];
    const rays = el('div', 'medal-rays');
    const small = el('small', 'medal-step');
    small.textContent = 'Nouvelle médaille !';
    const box = el('div', 'medal-big medal-step');
    const img = el('img');
    img.src = `emoji/${MEDAL_IMGS[medal - 1]}.svg`;
    img.alt = '';
    box.append(img);
    [[8, 10], [78, 4], [88, 62], [2, 70], [46, -8]].forEach(([x, y], i) => {
        const s = el('i', 'medal-spark');
        s.textContent = '✨';
        s.style.left = `${x}%`;
        s.style.top = `${y}%`;
        s.style.animationDelay = `${0.9 + i * 0.12}s`;
        box.append(s);
    });
    const name = el('div', 'medal-name medal-step');
    name.textContent = names[medal - 1];
    const th = el('div', 'medal-theme medal-step');
    th.textContent = `${icon} ${theme} · ${mastered} questions maîtrisées`;
    const nx = el('div', 'medal-next medal-step');
    const total = trainingBank(theme).length;
    nx.textContent = medal < 3 ? `Prochaine : ${TRAIN_MEDALS[medal].icon} ${TRAIN_MEDALS[medal].name} à ${Math.ceil(total * TRAIN_MEDALS[medal].part)}`
        : `🏆 Les ${total} questions maîtrisées !`;
    const say = el('div', 'medal-kulti medal-step');
    const k = el('div', 'medal-kulti-face');
    k.append(kultiEl('fier', 'kulti-blink'));
    const bubble = el('div', 'medal-bubble');
    bubble.textContent = medal === 3 ? 'Toutes les questions ! Tu es un vrai expert.' : medal === 2 ? 'Plus que l’or à décrocher !' : `Tu connais vraiment bien ce thème !`;
    say.append(k, bubble);
    const btn = el('button', 'btn medal-continue medal-step');
    btn.type = 'button';
    btn.textContent = 'Super !';
    btn.addEventListener('click', e => { e.stopPropagation(); closeCelebrationLayer('medalAnim'); });
    ov.append(rays, small, box, name, th, nx, say, btn);
    ov.addEventListener('pointerdown', () => ov.classList.add('is-skip'), { once: true });   // un tap : tout de suite à la fin
    if (state.data.sound) {
        try {
            [0, 0.08, 0.16, 0.24].forEach((s, i) => synthTone(900 + i * 220, 0.35 + s, 0.12, 'triangle', 0.07));   // la médaille tourne
            synthTone(2093, 0.95, 0.5, 'sine', 0.14);                                                          // « tchin »
            synthTone(2637, 1.0, 0.6, 'sine', 0.1);
            [1047, 1319, 1568, 2093].forEach((f, i) => synthTone(f, 1.25 + i * 0.09, 0.5, 'sine', 0.12));      // carillon
        } catch (err) { /* pas de son */ }
    }
    void m;
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
    btn.classList.add('is-wait');   // 11/11 : on ne peut pas passer l'animation
    btn.disabled = true;
    ov._ready = false;
    let top = digits, kult = null;
    if (PAL_ELEC) {   // 11/11 (bac à sable) : le chiffre (qui défile toujours) dans une grande flamme, Kulti sous la semaine
        top = el('div', 'streak-flame');
        const fl = el('img');
        fl.src = 'emoji/1f525.svg';
        fl.alt = '';
        top.append(fl, digits);
        const keys = ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((_, i) => shiftDays(weekStart(), i));
        const idx = keys.indexOf(todayKey());
        const full = keys.slice(0, idx).every(k => state.data.activeDays[k] !== undefined || state.data.frozenDays[k]);
        const left = 6 - idx;
        kult = el('div', 'streak-kulti');
        const face = el('div', 'streak-kulti-face');
        face.append(kultiEl('fier', 'kulti-blink'));
        const bub = el('div', 'streak-bubble');
        bub.textContent = full && left > 0 ? `Encore ${plural(left, 'jour', 'jours')} pour une semaine parfaite !` : full ? 'Semaine parfaite ! Bravo !' : 'Bravo ! Reviens demain pour la garder.';
        kult.append(face, bub);
    }
    ov.append(...[top, label, capLine, week, kult, btn].filter(Boolean));
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
        setTimeout(() => { const k = ov.querySelector('.streak-kulti'); if (k) k.classList.add('is-on'); }, spin + 900),
        setTimeout(() => { if (cap) launchConfetti(); }, spin + 200),
        setTimeout(() => week.classList.add('is-on'), spin + 450),
        setTimeout(() => { const t = week.querySelector('.is-today'); if (t) t.classList.add('is-lit'); }, spin + 950),
        setTimeout(() => { btn.disabled = false; btn.classList.remove('is-wait'); ov._ready = true; }, spin + 1300)
    ];
}
function closeStreakAnim() {
    const ov = $('streakAnim');
    if (!ov || ov.hidden || ov._ready === false) return;
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
            info: [{ big: String(missed), label: missed > 1 ? 'jours manqués' : 'jour manqué', tone: 'warn' }, { big: `🧊 ${missed}`, label: missed > 1 ? 'gels utilisés' : 'gel utilisé' },
                { big: `🧊 ${data.inv.freeze - missed}`, label: 'il te restera', tone: 'good' }],
            text: `Ils seront utilisés quand tu finiras une leçon : ta série de ${days} continue !`,
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
        info: [{ big: String(missed), label: missed > 1 ? 'jours manqués' : 'jour manqué', tone: 'warn' }, { big: `🧊 ${data.inv.freeze}`, label: 'gels en stock' },
            { big: `🧊 ${need}`, label: need > 1 ? 'gels manquants' : 'gel manquant', tone: 'bad' }],
        text: `Pour sauver ta série de ${days}.\n`
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

/** Profil → Thèmes (2026-10-28) : TOUTES les réponses du thème (parcours, entraînement, défi du jour, sprint), pas seulement
    le parcours ; « maîtrisée » = même règle que l'entraînement (réussie 2 fois de suite, sur 2 jours). Les badges gardent themeStats. */
function profileThemeStats() {
    const map = {};
    const all = QUESTIONS.concat(typeof TRAINING_QUESTIONS === 'undefined' ? [] : TRAINING_QUESTIONS);
    all.forEach(q => {
        const t = map[q.theme] || (map[q.theme] = { theme: q.theme, seen: 0, total: 0, tries: 0, right: 0, mastered: 0 });
        t.total++;
        const s = state.data.stats[q.id];
        if (!s) return;
        t.seen++;
        t.tries += s.tries || 0;
        t.right += s.right || 0;
        if (isMastered(q.id)) t.mastered++;
    });
    return Object.values(map).sort((a, b) => byThemeName(a.theme, b.theme));
}

/* ---------- Encyclopédie des savoirs (12/11, aperçu apercu-encyclopedie.html, BAC À SABLE d'abord) ----------
   Un savoir = une question du parcours ou de l'entraînement réussie au moins une fois (stats[id].right). On ne le perd jamais.
   ✨ maîtrisé = même règle que l'entraînement (isMastered). Les savoirs pas encore trouvés restent cachés (seulement un nombre).
   Profil → onglet « 📚 Savoirs » (à la place de « Thèmes ») ; livre = un thème ; fiche = réponse, question, explication, image ;
   « Me la reposer » = petite question dans la fiche, pour le plaisir (rien n'est enregistré). Pas de « à revoir » (choix 12/11). */
const ENC_ON = BAC;
// 12/11 : 15 couleurs bien distinctes (Cinéma et Drapeaux se ressemblaient), l'icône est posée sur un rond blanc
const ENC_COLORS = { 'Arts': '#c026d3', 'Cinéma': '#dc2626', 'Drapeaux': '#ea580c', 'Gastronomie': '#ca8a04', 'Géographie': '#15803d', 'Histoire': '#92400e',
    'Jeux': '#7c3aed', 'Langue française': '#2563eb', 'Littérature': '#0f766e', 'Monuments': '#78716c', 'Musique': '#db2777', 'Mythologie': '#1e3a8a',
    'Sciences': '#0891b2', 'Sport': '#65a30d', 'Technologie': '#4b5563' };
let encCache = null, encCount = -1;
function encAll() {
    const n = QUESTIONS.length + (typeof TRAINING_QUESTIONS === 'undefined' ? 0 : TRAINING_QUESTIONS.length);
    if (!encCache || encCount !== n) {   // recalcul si une banque arrive plus tard
        encCache = new Map();
        QUESTIONS.concat(typeof TRAINING_QUESTIONS === 'undefined' ? [] : TRAINING_QUESTIONS).forEach(q => encCache.set(q.id, q));
        encCount = n;
    }
    return encCache;
}
/** Icône d'un thème en image Twemoji, ou en texte si l'image manque (🗣️). */
function encIconEl(theme) {
    const sp = el('span', 'enc-emo');   // 12/11 : emoji du téléphone, comme les cases de l'entraînement
    sp.textContent = encIcon(theme);
    return sp;
}
const encQuestion = id => encAll().get(id);
const encKnown = q => (state.data.stats[q.id]?.right || 0) > 0;
const encIcon = theme => (THEME_DECOR.find(t => t.theme === theme) || {}).icon || '📘';
const encNorm = t => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const encWhen = q => { const s = state.data.stats[q.id] || {}; return s.first || (s.last ? dayKey(new Date(s.last)) : ''); };
/** 12/11 : un tap sur « savoirs », « maîtrisés » ou « réussite » réexplique ce que c'est. */
function encExplain(kind) {
    const T = {
        known: ['📚 Les questions sues', 'Une question sue, c’est une question que tu as réussie au moins une fois (parcours, entraînement, défis…).\n\nUne fois dans ton encyclopédie, il y reste pour toujours, même si tu te trompes plus tard.\n\nLes questions vues mais encore jamais réussies n’y sont pas : réussis-les pour les ajouter !'],
        mastered: ['✨ Les questions maîtrisées', 'Une question est maîtrisée quand tu l’as réussie 2 fois d’affilée, à des jours différents.\n\nUne question maîtrisée le reste pour toujours. Les maîtrisées comptent aussi pour les médailles de l’entraînement.'],
        rate: ['🎯 La réussite', 'C’est la part de bonnes réponses sur toutes tes réponses aux questions de ce thème, depuis le début.\n\nExemple : 78 % = 78 bonnes réponses sur 100.']
    };
    const [title, text] = T[kind];
    askConfirm({ title, text, yes: 'Compris', no: null });
}
function encTip(node, kind) {
    node.classList.add('enc-tip');
    node.setAttribute('role', 'button');
    node.tabIndex = 0;
    node.addEventListener('click', e => { e.stopPropagation(); encExplain(kind); });
}
/** 12/11 : le livre touché grandit jusqu'à remplir l'écran pendant que sa couverture s'ouvre (~0,4 s, un tap l'achève). */
/** 4 feuilles de papier qui tournent avec la couverture (sinon on ne voyait que du blanc). */
const encZoomPages = () => [0, 1, 2, 3].map(i => { const p = el('div', 'enc-zoom-page'); p.style.setProperty('--i', i); return p; });
let encLastBook = null;   // { btn, color, icon } : le livre ouvert, pour qu'il se referme à sa place
const ENC_COVER_SPOTS = [[12, 8, 1.5, -12], [78, 6, 1.2, 10], [45, 16, 1, 4], [88, 30, 1.6, -8], [8, 34, 1.1, 14], [30, 48, 1.3, -6], [70, 52, 1, 12],
    [14, 66, 1.4, 8], [86, 70, 1.2, -14], [50, 78, 1.1, -4], [24, 88, 1.2, 10], [74, 90, 1.5, -10], [58, 34, 0.9, 6], [38, 66, 0.9, -12]];
/** Couverture du livre (animation) : grande icône, nom du thème, filet doré, et les icônes de ses chapitres en motif léger. */
function encCoverEl(icon, theme) {
    const cover = el('div', 'enc-zoom-cover');
    const emos = theme ? encChapters(theme).map(c => c.emo) : [];
    if (emos.length) ENC_COVER_SPOTS.forEach(([x, y, s, r], i) => {
        const e = el('span', 'enc-cover-dot');
        e.textContent = emos[i % emos.length];
        e.style.cssText = `left:${x}%;top:${y}%;font-size:${s * 1.6}rem;transform:translate(-50%,-50%) rotate(${r}deg)`;
        cover.append(e);
    });
    const mid = el('div', 'enc-cover-mid');
    const ic = el('span', 'enc-cover-ic');
    ic.textContent = icon;
    mid.append(ic);
    if (theme) { const nm = el('b'); nm.textContent = theme; mid.append(nm); }
    cover.append(el('i', 'enc-cover-frame'), mid);
    return cover;
}
function encOpenAnim(from, color, icon, then, theme = '') {
    encLastBook = { btn: from, color, icon, theme };
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { then(); return; }
    const r = from.getBoundingClientRect();
    const navH = 0;
    const z = el('div', 'enc-zoom');
    z.style.setProperty('--c', color);
    const cover = encCoverEl(icon, theme);
    z.append(...encZoomPages(), cover);
    Object.assign(z.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    document.body.append(z);
    let done = false;
    const finish = () => {
        if (done) return;
        done = true;
        then();
        z.classList.add('is-out');
        setTimeout(() => z.remove(), 180);
    };
    z.addEventListener('pointerdown', finish);
    requestAnimationFrame(() => requestAnimationFrame(() => {
        z.classList.add('is-open');
        const w = window.innerWidth > 900 ? Math.min(560, window.innerWidth) : window.innerWidth;
        Object.assign(z.style, { left: `${(window.innerWidth - w) / 2}px`, top: '0px', width: `${w}px`, height: `${window.innerHeight - navH}px` });
    }));
    setTimeout(finish, 820);
}
/** 12/11 : en quittant l'encyclopédie, la page rétrécit vers le livre du Profil et sa couverture se referme (~0,5 s). */
function encCloseAnim() {
    const lb = encLastBook;
    if (!lb || !lb.btn.isConnected || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const r = lb.btn.getBoundingClientRect();
    if (!r.width || r.bottom < 0 || r.top > window.innerHeight) return;
    const w = window.innerWidth > 900 ? Math.min(560, window.innerWidth) : window.innerWidth;
    const z = el('div', 'enc-zoom is-open is-closing');
    z.style.setProperty('--c', lb.color);
    const cover = encCoverEl(lb.icon, lb.theme);
    z.append(...encZoomPages(), cover);
    Object.assign(z.style, { left: `${(window.innerWidth - w) / 2}px`, top: '0px', width: `${w}px`, height: `${window.innerHeight}px` });
    document.body.append(z);
    requestAnimationFrame(() => requestAnimationFrame(() => {
        z.classList.remove('is-open');
        Object.assign(z.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    }));
    setTimeout(() => { z.classList.add('is-out'); setTimeout(() => z.remove(), 180); }, 620);
}
(() => {   // la fenêtre de l'encyclopédie se ferme (✕, retour, onglet) : animation de fermeture
    const ov = document.getElementById('friendModal');
    if (!ov) return;
    new MutationObserver(() => { if (ov.hidden && ov.classList.contains('is-enc-full')) { ov.classList.remove('is-enc-full'); encCloseAnim(); } })
        .observe(ov, { attributes: true, attributeFilter: ['hidden'] });
})();
function encBooks() {
    const map = {};
    encAll().forEach(q => {
        const b = map[q.theme] || (map[q.theme] = { theme: q.theme, total: 0, known: 0, mastered: 0, tries: 0, right: 0 });
        b.total++;
        const s = state.data.stats[q.id];
        if (!s) return;
        b.tries += s.tries || 0;
        b.right += s.right || 0;
        if ((s.right || 0) > 0) b.known++;
        if (isMastered(q.id)) b.mastered++;
    });
    return Object.values(map).sort((a, b) => byThemeName(a.theme, b.theme));
}
function renderEncyclopedia(box) {
    const card = box.closest('.card');
    const h2 = card?.querySelector('h2');
    if (h2) h2.textContent = '📚 Mon encyclopédie';
    const tab = document.querySelector('.profile-tab[data-tab="themes"]');
    if (tab) tab.textContent = '📚 Savoirs';
    const books = encBooks();
    const known = books.reduce((n, b) => n + b.known, 0), total = books.reduce((n, b) => n + b.total, 0);
    const mastered = books.reduce((n, b) => n + b.mastered, 0);
    const weekAgo = dayKey(new Date(Date.now() - 6 * 86400000));
    let week = 0;
    const recent = [];
    encAll().forEach(q => {
        if (!encKnown(q)) return;
        const f = state.data.stats[q.id].first;
        if (f && f >= weekAgo) week++;
        recent.push(q);
    });
    recent.sort((a, b) => (state.data.stats[b.id].first || '').localeCompare(state.data.stats[a.id].first || '') || (state.data.stats[b.id].last || 0) - (state.data.stats[a.id].last || 0));

    const head = el('div', 'enc-head');
    const big = el('div', 'enc-big');
    const num = el('b');
    num.textContent = fmtNum(known);
    const lab = el('span');
    lab.textContent = `question${known > 1 ? 's' : ''} sue${known > 1 ? 's' : ''} dans ton encyclopédie`;
    big.append(num, lab);
    const mchip = el('span', 'enc-mchip');
    mchip.textContent = `✨ ${fmtNum(mastered)} maîtrisé${mastered > 1 ? 's' : ''}`;
    head.append(big, mchip);
    encTip(big, 'known');
    encTip(mchip, 'mastered');
    const bar = el('div', 'enc-bar');
    const fill = el('i');
    fill.style.width = `${total ? Math.max(known ? 1 : 0, Math.round(known / total * 100)) : 0}%`;
    bar.append(fill);
    const sub = el('p', 'enc-sub');
    sub.textContent = `sur ${fmtNum(total)} questions en tout${week ? ` · +${fmtNum(week)} cette semaine` : ''}`;
    box.append(head, bar, sub);

    if (recent.length) {
        const t = el('p', 'enc-sec');
        t.textContent = 'Ajoutées récemment';
        const row = el('div', 'enc-recent');
        recent.slice(0, 3).forEach(q => {
            const b = el('button', 'enc-mini');
            b.type = 'button';
            const em = el('small');
            em.textContent = `${encIcon(q.theme)} ${q.theme}`;
            const nm = el('b');
            nm.textContent = q.a[0];
            b.append(em, nm);
            b.addEventListener('click', () => openEncFiche(q, recent.slice(0, 3), null));
            row.append(b);
        });
        box.append(t, row);
    }
    const t2 = el('p', 'enc-sec');
    t2.textContent = 'Mes livres';
    const grid = el('div', 'enc-books');
    books.forEach(b => {
        const btn = el('button', `enc-book${b.known >= b.total ? ' is-full' : ''}`);
        btn.type = 'button';
        btn.style.setProperty('--c', ENC_COLORS[b.theme] || '#3d8bff');
        const ic = el('span', 'enc-book-ic');
        ic.append(encIconEl(b.theme));
        const nm = el('b');
        nm.textContent = b.theme;
        const cnt = el('span', 'enc-book-n');
        const kn = el('b');
        kn.textContent = fmtNum(b.known);
        cnt.append(kn, document.createTextNode(` / ${fmtNum(b.total)}`), el('i'));
        cnt.lastChild.textContent = b.known > 1 ? 'questions sues' : 'question sue';   // le mot dit ce que compte le x / y (et la barre juste dessous)
        const m = el('small');
        m.textContent = `✨ ${b.mastered} maîtrisé${b.mastered > 1 ? 's' : ''}`;
        const r = el('small');
        r.textContent = b.tries ? `🎯 ${Math.round(b.right / b.tries * 100)} % de réussite` : '🎯 pas encore joué';
        const mini = el('span', 'enc-book-bar');
        const mf = el('i');
        mf.style.width = `${Math.round(b.known / b.total * 100)}%`;
        mini.append(mf);
        const hd = el('span', 'enc-book-head');   // 12/11 : icône à côté du nom (hauteur identique pour tous les livres)
        hd.append(ic, nm);
        btn.append(hd, cnt, mini, m, r);   // la barre sous « x / y savoirs », pas sous le % de réussite
        btn.addEventListener('click', () => encOpenAnim(btn, ENC_COLORS[b.theme] || '#3d8bff', encIcon(b.theme), () => openEncBook(b.theme), b.theme));
        grid.append(btn);
    });
    box.append(t2, grid);
}

/* 12/11 : un livre = un sommaire de chapitres (chapitres.js). Un chapitre = la liste de ses questions sues, puis une ligne
   grisée par question pas encore découverte ; chapitre entièrement su = tampon « Chapitre complet ». */
let encChapCache = null, encChapCount = -1;
function encChapters(theme) {
    const all = encAll();
    if (!encChapCache || encChapCount !== all.size) {
        encChapCache = {};
        encChapCount = all.size;
        const placed = new Set();
        const src = typeof ENC_CHAPTERS === 'undefined' ? {} : ENC_CHAPTERS;
        Object.entries(src).forEach(([t, chs]) => {
            encChapCache[t] = chs.map(([emo, name, ids], i) => {
                const qs = ids.map(id => all.get(id)).filter(q => q && q.theme === t);
                qs.forEach(q => placed.add(q.id));
                return { theme: t, i, emo, name, qs };
            });
        });
        const rest = {};   // question pas encore rangée (nouvelle) : chapitre « Divers » à la fin du livre
        all.forEach(q => { if (!placed.has(q.id)) (rest[q.theme] = rest[q.theme] || []).push(q); });
        Object.entries(rest).forEach(([t, qs]) => {
            const list = encChapCache[t] || (encChapCache[t] = []);
            list.push({ theme: t, i: list.length, emo: '📦', name: 'Divers', qs });
        });
    }
    return (encChapCache[theme] || []).filter(c => c.qs.length);
}
const encChapKnown = c => c.qs.filter(encKnown).length;
const encChapFull = c => c.qs.length > 0 && c.qs.every(encKnown);
/** Chapitre d'une question (pour la recherche et l'écran de fin). */
function encChapterOf(q) { return encChapters(q.theme).find(c => c.qs.includes(q)) || null; }
const encSortAnswer = (a, b) => encNorm(a.a[0].replace(/^(le |la |les |l'|l’)/i, '')).localeCompare(encNorm(b.a[0].replace(/^(le |la |les |l'|l’)/i, '')), 'fr');
/** Petit tampon rond « COMPLET » avec le K (même dessin que « Sans faute »). */
function encStamp(cls = '') {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('class', `enc-stamp ${cls}`);
    svg.setAttribute('aria-label', 'Chapitre complet');
    const id = `encArc${Math.random().toString(36).slice(2, 8)}`;
    svg.innerHTML = `<defs><path id="${id}" d="M50 50 m-34 0 a34 34 0 1 1 68 0 a34 34 0 1 1 -68 0"/></defs>
      <circle cx="50" cy="50" r="46" fill="rgba(255,255,255,.9)" stroke="#e5484d" stroke-width="5"/>
      <circle cx="50" cy="50" r="24" fill="none" stroke="#e5484d" stroke-width="2.5"/>
      <text font-family="Nunito, sans-serif" font-weight="900" font-size="10.5" fill="#e5484d" letter-spacing="1.2"><textPath href="#${id}" startOffset="1%">COMPLET ★ COMPLET ★ COMPLET ★</textPath></text>
      <g transform="translate(37.5 37) scale(.135)"><path d="${K_PATH}" fill="#e5484d"/></g>`;
    return svg;
}
function encLockedTip() {
    askConfirm({ title: '❓ Pas encore découverte', text: 'Cette question t’attend quelque part dans le jeu : parcours, entraînement, défis…\n\nRéussis-la une fois et elle viendra se ranger ici, pour toujours.', yes: 'Compris', no: null });
}
function encEmpty(text) { const p = el('p', 'muted enc-empty'); p.textContent = text; return p; }

/** 12/11 : page plein écran de l'encyclopédie ; le contenu défile dedans, « ← » et ✕ restent en haut (alignés). */
function encPage(back, ...nodes) {
    const body = $('friendBody');
    body.replaceChildren();
    const page = el('div', 'enc-full enc-scroll');
    page.append(...nodes);
    if (back) body.append(back);
    body.append(page);
    $('friendModal').hidden = false;
    return page;
}
let encState = { theme: '', search: '' };
function openEncBook(theme, keep = false) {
    if (!keep) encState = { theme, search: '' };
    const book = encBooks().find(b => b.theme === theme);
    const chs = encChapters(theme);
    const body = $('friendBody');
    body.replaceChildren();
    const h = el('h2', 'review-title enc-title');
    h.append(encIconEl(theme), document.createTextNode(` ${theme}`));
    const bar = el('div', 'enc-bar');
    bar.style.setProperty('--c', ENC_COLORS[theme] || '#3d8bff');
    const fill = el('i');
    fill.style.width = `${Math.round(book.known / book.total * 100)}%`;
    bar.append(fill);
    const tiles = el('div', 'enc-tiles');
    [[fmtNum(book.known), `sue${book.known > 1 ? 's' : ''} sur ${fmtNum(book.total)}`, '', 'known'],
     [`✨ ${book.mastered}`, `maîtrisé${book.mastered > 1 ? 's' : ''}`, 'is-gold', 'mastered'],
     [book.tries ? `${Math.round(book.right / book.tries * 100)} %` : '–', 'de réussite', 'is-ok', 'rate']].forEach(([v, l, cls, kind]) => {
        const d = el('div', cls);
        encTip(d, kind);
        const b = el('b');
        b.textContent = v;
        const s = el('span');
        s.textContent = l;
        d.append(b, s);
        tiles.append(d);
    });
    const search = el('input', 'enc-search');
    search.type = 'search';
    search.placeholder = '🔍 Chercher dans ce livre…';
    search.value = encState.search;
    const zone = el('div');
    const all = chs.flatMap(c => c.qs);
    const known = all.filter(encKnown);
    const weekAgo = dayKey(new Date(Date.now() - 6 * 86400000));
    const thisWeek = known.filter(q => (state.data.stats[q.id].first || '') >= weekAgo)
        .sort((a, b) => encWhen(b).localeCompare(encWhen(a)) || (state.data.stats[b.id].last || 0) - (state.data.stats[a.id].last || 0));
    const toMaster = known.filter(q => !isMastered(q.id)).sort(encSortAnswer);
    const draw = () => {
        zone.replaceChildren();
        const qs = encNorm(encState.search.trim());
        if (qs) {   // recherche : toutes les questions sues du livre qui en parlent
            const found = known.filter(q => encNorm(q.a.join(' ') + ' ' + q.q).includes(qs)).sort(encSortAnswer);
            const list = el('div', 'enc-list');
            found.slice(0, 300).forEach(q => list.append(encRow(q, found, { label: `← ${theme}`, fn: () => openEncBook(theme, true) }, encChapterOf(q))));
            if (!found.length) list.append(encEmpty('Aucune question sue ne correspond.'));
            zone.append(list);
            return;
        }
        const quick = el('div', 'enc-quick');
        [['🕒', thisWeek, 'Ajoutées cette semaine', ''], ['✨', toMaster, 'Pas encore maîtrisées', 'is-gold']].forEach(([e, qs2, label, cls]) => {
            const b = el('button', `enc-qk ${cls}`);
            b.type = 'button';
            const n = el('b');
            n.textContent = `${e} ${fmtNum(qs2.length)}`;
            const s = el('span');
            s.textContent = label;
            b.append(n, s);
            b.disabled = !qs2.length;
            b.addEventListener('click', () => openEncSet(theme, `${e} ${label}`, qs2));
            quick.append(b);
        });
        const full = chs.filter(encChapFull).length;
        const sec = el('p', 'enc-sec enc-chap-sec');
        sec.textContent = 'Chapitres';
        const sc = el('span');
        sc.textContent = `${full} complet${full > 1 ? 's' : ''} sur ${chs.length}`;
        sec.append(sc);
        const list = el('div', 'enc-chaps');
        chs.forEach(c => {
            const k = encChapKnown(c), n = c.qs.length;
            const row = el('button', `enc-ch${k >= n ? ' is-full' : ''}`);
            row.type = 'button';
            row.style.setProperty('--c', ENC_COLORS[theme] || '#3d8bff');
            const e = el('span', 'enc-ch-e');
            e.textContent = c.emo;
            const nm = el('span', 'enc-ch-n');
            nm.textContent = c.name;
            const cnt = el('span', 'enc-ch-k');
            const kb = el('b');
            kb.textContent = fmtNum(k);
            cnt.append(kb, document.createTextNode(` / ${fmtNum(n)}`));
            const br = el('span', 'enc-ch-bar');
            const bi = el('i');
            bi.style.width = `${Math.round(k / n * 100)}%`;
            br.append(bi);
            row.append(e, nm, cnt, br);
            if (k >= n) row.append(encStamp('is-mini'));
            row.addEventListener('click', () => openEncChapter(theme, c.i));
            list.append(row);
        });
        const special = theme === 'Histoire' ? ['🕰️', 'Ma frise', 'tes événements rangés dans le temps', () => openEncFrise()]
            : theme === 'Mythologie' ? ['🌳', 'L’arbre des dieux', 'Grèce, Égypte et Nordique', () => openEncGods()]
            : theme === 'Sciences' ? [['🫀', 'Mon corps humain', 'les organes que tu connais', () => openEncSpots('sci', 'corps')], ['🪐', 'Mon système solaire', 'les planètes, les étoiles et l’espace', () => openEncSpots('sci', 'espace')]]
            : theme === 'Langue française' ? ['📖', 'Mon dictionnaire', 'tes mots et expressions de A à Z', () => openEncDico()]
            : theme === 'Gastronomie' ? [['🧀', 'Ma France gourmande', 'les spécialités de chaque région', () => openEncFrance()], ['🍜', 'Ma cuisine du monde', 'les plats des autres pays', () => openEncMap('Gastronomie', null, 'cuisine')]]
            : theme === 'Littérature' ? ['📚', 'Ma bibliothèque', 'tes livres rangés sur les étagères', () => openEncLibrary()]
            : theme === 'Musique' ? ['💿', 'Mes vinyles', 'tes artistes rangés dans les bacs', () => openEncVinyls()]
            : theme === 'Jeux' ? ['🕹️', 'Ma salle d’arcade', 'cartouches, bornes, consoles et jeux de société', () => openEncArcade()]
            : theme === 'Sport' ? ['🏆', 'Ma salle des trophées', 'tes médailles, du bronze à l’or', () => openEncTrophies()]
            : theme === 'Technologie' ? ['⚙️', 'La frise des inventions', 'de l’imprimerie à l’IA', () => openEncTechFrise()]
            : theme === 'Arts' ? ['🖼️', 'Mon musée', 'tes œuvres accrochées salle par salle', () => openEncMuseum()]
            : theme === 'Cinéma' ? ['🎬', 'Mes affiches', 'films, séries, stars et réalisateurs', () => openEncPosters()]
            : theme === 'Drapeaux' ? ['🏳️', 'Mon mur de drapeaux', 'les drapeaux rangés par continent', () => openEncFlags()]
            : theme === 'Monuments' ? ['💌', 'Mes cartes postales', 'des albums de monuments à compléter', () => openEncPostcards()]
            : ENC_MAP_THEMES.includes(theme) ? ['🗺️', 'Ma carte du monde', 'les pays que tu connais', () => openEncMap(theme)] : null;
        const parts = [quick];
        (special ? (Array.isArray(special[0]) ? special : [special]) : []).forEach(special => {   // frise, arbre, cartes… (13/11 : plusieurs possibles)
            const b = el('button', 'enc-special');
            b.type = 'button';
            b.style.setProperty('--c', ENC_COLORS[theme] || '#3d8bff');
            const e = el('span', 'enc-special-e');
            e.textContent = special[0];
            const t = el('span', 'enc-special-t');
            const tb = el('b');
            tb.textContent = special[1];
            const ts = el('small');
            ts.textContent = special[2];
            t.append(tb, ts);
            const ar = el('span', 'enc-special-ar');
            ar.textContent = '›';
            b.append(e, t, ar);
            b.addEventListener('click', special[3]);
            parts.push(b);
        });
        zone.append(...parts, sec, list);
    };
    search.addEventListener('input', () => { encState.search = search.value; draw(); });
    const page = encPage(null, bar, tiles, search, zone);
    h.classList.add('enc-fixed-title');
    page.before(h);
    draw();
    page.scrollTop = keep ? encState.bookScroll || 0 : 0;
    page.addEventListener('scroll', () => { encState.bookScroll = page.scrollTop; }, { passive: true });
}
/** Un chapitre : les questions sues (par ordre alphabétique de la réponse), puis une case grisée par question à découvrir. */
function openEncChapter(theme, i, keepScroll = false) {
    const c = encChapters(theme).find(x => x.i === i);
    if (!c) return openEncBook(theme, true);
    const back = encBackBtn(`← ${theme}`, () => openEncBook(theme, true));
    const head = el('div', 'enc-chap-head');
    const h = el('h2', 'review-title enc-title');
    h.textContent = `${c.emo} ${c.name}`;
    const k = encChapKnown(c), n = c.qs.length;
    const sub = el('p', 'enc-chap-sub');
    sub.textContent = k >= n ? `Chapitre complet : ${fmtNum(n)} / ${fmtNum(n)} questions sues !` : `${fmtNum(k)} / ${fmtNum(n)} questions sues`;
    encTip(sub, 'known');
    const tx = el('div');
    tx.append(h, sub);
    head.append(tx);
    if (k >= n) head.append(encStamp('is-big'));
    const bar = el('div', 'enc-bar');
    bar.style.setProperty('--c', ENC_COLORS[theme] || '#3d8bff');
    const fill = el('i');
    fill.style.width = `${Math.round(k / n * 100)}%`;
    bar.append(fill);
    const known = c.qs.filter(encKnown).sort(encSortAnswer);
    const list = el('div', 'enc-list');
    const ret = { label: `← ${c.name}`, fn: () => openEncChapter(theme, i, true) };
    known.forEach(q => list.append(encRow(q, known, ret)));
    if (!known.length) list.append(encEmpty('Aucune question sue dans ce chapitre pour l’instant.'));
    const parts = [head, bar];
    if (k) {   // 12/11 : réviser les questions sues du chapitre (cartes à retourner, rien n'est enregistré)
        const rv = el('button', 'btn btn-green btn-full enc-rv-btn');
        rv.type = 'button';
        rv.textContent = '🧠 Réviser ce chapitre';
        rv.addEventListener('click', () => openEncRevise(theme, i));
        parts.push(rv);
    }
    parts.push(list);
    if (n > k) {   // une petite case « ? » par question à découvrir (comme les cartes qui manquent)
        const t = el('p', 'enc-sec');
        t.textContent = `Encore ${plural(n - k, 'question', 'questions')} à découvrir`;
        const grid = el('div', 'enc-slots');
        for (let j = 0; j < n - k; j++) { const s = el('button', 'enc-slot'); s.type = 'button'; s.textContent = '?'; s.setAttribute('aria-label', 'Question pas encore découverte'); grid.append(s); }
        grid.addEventListener('click', e => { if (e.target.closest('.enc-slot')) encLockedTip(); });
        parts.push(t, grid);
    }
    const page = encPage(back, ...parts);
    page.scrollTop = keepScroll ? encState.chapScroll || 0 : 0;
    encState.chapScroll = 0;
    list.addEventListener('click', () => { encState.chapScroll = page.scrollTop; }, true);
}
/** Liste simple (raccourcis « Ajoutées cette semaine » / « Pas encore maîtrisées »). */
function openEncSet(theme, title, qs) {
    const back = encBackBtn(`← ${theme}`, () => openEncBook(theme, true));
    const h = el('h2', 'review-title enc-title');
    h.textContent = title;
    const list = el('div', 'enc-list');
    const ret = { label: '← Retour', fn: () => openEncSet(theme, title, qs) };
    qs.forEach(q => list.append(encRow(q, qs, ret, encChapterOf(q))));
    encPage(back, h, list);
}
/* ---------- 12/11 : « Réviser ce chapitre » (cartes à retourner), frise de l'Histoire, carte du monde ---------- */
const encLoaded = {};
function encLoad(src) {   // fichiers lourds chargés seulement à la 1re ouverture (frise, carte)
    if (!encLoaded[src]) encLoaded[src] = new Promise((ok, ko) => {
        const s = document.createElement('script');
        s.src = `${src}?v=${(document.querySelector('script[src*="script.js?v="]')?.src.split('v=')[1]) || ''}`;
        s.onload = ok;
        s.onerror = () => { delete encLoaded[src]; ko(); };
        document.head.append(s);
    });
    return encLoaded[src];
}
function encBackBtn(label, fn) {
    const b = el('button', 'duel-back');
    b.type = 'button';
    b.textContent = label;
    b.addEventListener('click', fn);
    return b;
}

/** Révision d'un chapitre : 10 questions sues au plus (les moins maîtrisées d'abord). Rien n'est enregistré :
    « Je ne savais pas » ne va PAS dans « à revoir » (choix de l'utilisateur, 12/11). */
function openEncRevise(theme, i, only = null) {
    const c = encChapters(theme).find(x => x.i === i);
    if (!c) return;
    let deck = only || (() => {
        const known = shuffle(c.qs.filter(encKnown));
        const notM = known.filter(q => !isMastered(q.id)), m = known.filter(q => isMastered(q.id));
        return notM.concat(m).slice(0, 10);
    })();
    deck = shuffle(deck.slice());
    let k = 0;
    const res = { ok: [], ko: [] };
    const back = () => openEncChapter(theme, i, true);
    const body = $('friendBody');
    const draw = () => {
        body.replaceChildren();
        const top = encBackBtn(`← ${c.name}`, back);
        if (k >= deck.length) {   // bilan
            const box = el('div', 'enc-fiche enc-rv-end');
            box.style.setProperty('--c', ENC_COLORS[theme] || '#3d8bff');
            const big = el('div', 'enc-rv-big');
            big.append(kultiEl(res.ko.length ? 'content' : 'fier', 'kulti-blink kulti-float'));
            const h = el('h3');
            h.textContent = 'Révision terminée !';
            const tiles = el('div', 'enc-tiles enc-rv-tiles');
            [[res.ok.length, 'je savais', 'is-ok'], [res.ko.length, 'à retravailler', 'is-ko']].forEach(([v, l, cls]) => {
                const d = el('div', cls);
                const b = el('b');
                b.textContent = v;
                const s = el('span');
                s.textContent = l;
                d.append(b, s);
                tiles.append(d);
            });
            const p = el('p', 'muted');
            p.textContent = res.ko.length ? 'Relance-les tout de suite pour bien les retenir.' : 'Tout juste : bravo !';
            box.append(big, h, tiles, p);
            const acts = el('div', 'enc-rv-acts');
            if (res.ko.length) {
                const again = el('button', 'btn btn-green btn-full');
                again.type = 'button';
                again.textContent = `🔁 Revoir ${res.ko.length > 1 ? `les ${res.ko.length} ratées` : 'la ratée'}`;
                const ko = res.ko.slice();
                again.addEventListener('click', () => openEncRevise(theme, i, ko));
                acts.append(again);
            }
            const more = el('button', `btn ${res.ko.length ? 'btn-ghost' : 'btn-green'} btn-full`);   // 12/11 : relancer d'autres questions
            more.type = 'button';
            more.textContent = '🔀 10 autres questions';
            more.addEventListener('click', () => openEncRevise(theme, i));
            acts.append(more);
            const ret = el('button', 'btn btn-ghost btn-full');
            ret.type = 'button';
            ret.textContent = 'Retour au chapitre';
            ret.addEventListener('click', back);
            acts.append(ret);
            body.append(top, box, acts);
            playSound(res.ko.length ? 'good' : 'win');
            return;
        }
        const q = deck[k];
        const bar = el('div', 'enc-bar');
        bar.style.setProperty('--c', ENC_COLORS[theme] || '#3d8bff');
        const fill = el('i');
        fill.style.width = `${Math.round(k / deck.length * 100)}%`;
        bar.append(fill);
        const step = el('div', 'enc-rv-step');
        const s1 = el('span');
        s1.textContent = `Carte ${k + 1} / ${deck.length}`;
        const s2 = el('span');
        s2.textContent = `✅ ${res.ok.length} · ❌ ${res.ko.length}`;
        step.append(s1, s2);
        const card = el('div', 'enc-fiche enc-rv-card');
        card.style.setProperty('--c', ENC_COLORS[theme] || '#3d8bff');
        const media = q.rebus ? (() => { const d = el('div', 'enc-rebus'); d.append(...q.rebus.map(emojiImg)); return d; })() : encMedia(q, false);
        if (media) { const w = el('div', `enc-media${q.flag ? ' is-flag' : ''}`); w.append(media); card.append(w); }
        const qq = el('div', 'enc-q');
        const ql = el('em');
        ql.textContent = 'La question';
        qq.append(ql, document.createTextNode(q.q));
        const key = el('button', 'enc-rv-key');
        key.type = 'button';
        key.textContent = '👆 Touche pour voir la réponse';
        card.append(qq, key);
        const two = el('div', 'enc-rv-two');
        const no = el('button', 'btn btn-red');
        no.type = 'button';
        no.textContent = '❌ Je ne savais pas';
        const yes = el('button', 'btn btn-green');
        yes.type = 'button';
        yes.textContent = '✅ Je savais';
        no.disabled = yes.disabled = true;
        two.append(no, yes);
        key.addEventListener('click', () => {
            if (key.classList.contains('is-open')) return;
            key.classList.add('is-open');
            key.replaceChildren();
            const b = el('b');
            b.textContent = q.a[0];
            key.append(b);
            if (q.exp) { const s = el('small'); s.textContent = q.exp; key.append(s); }
            no.disabled = yes.disabled = false;
            setTimeout(() => { card.scrollTop = card.scrollHeight; }, 0);
        });
        const next = ok => { (ok ? res.ok : res.ko).push(q); k++; draw(); };
        no.addEventListener('click', () => next(false));
        yes.addEventListener('click', () => next(true));
        body.append(top, bar, step, card, two);
    };
    draw();
    $('friendModal').hidden = false;
    $('friendModal').querySelector('.modal-content').scrollTop = 0;
}

/* Frise de l'Histoire : questions sues rangées par année ; celles à découvrir = cases en pointillés (regroupées). */
const ENC_ERAS = [[-1e9, '🏺', 'Antiquité'], [476, '🏰', 'Moyen Âge'], [1492, '👑', 'Rois et Renaissance'], [1789, '⚔️', 'Révolution et Empire'],
    [1815, '🚂', 'XIXe siècle'], [1914, '🪖', 'Guerres mondiales'], [1945, '🕊️', 'Depuis 1945']];
const encYear = q => { const v = window.ENC_YEARS?.[q.id]; return v === undefined ? null : Array.isArray(v) ? { y: v[0], approx: true } : { y: v, approx: false }; };
const encEra = y => { let e = 0; ENC_ERAS.forEach((x, j) => { if (y >= x[0]) e = j; }); return e; };
function encYearLabel(y, approx) {
    const d = el('span', 'enc-tl-y');
    if (approx) { const s = el('small'); s.textContent = 'vers'; d.append(s); }
    d.append(document.createTextNode(y < 0 ? fmtNum(-y) : String(y)));
    if (y < 0) { const s = el('small'); s.textContent = 'av. J.-C.'; d.append(s); }
    return d;
}
async function openEncFrise(keep = false) {
    try { await encLoad('frise-histoire.js'); } catch (e) { showToast('📶 Frise indisponible hors connexion pour l’instant'); return; }
    const all = encChapters('Histoire').flatMap(c => c.qs).map(q => ({ q, t: encYear(q) })).filter(x => x.t).sort((a, b) => a.t.y - b.t.y);
    const known = all.filter(x => encKnown(x.q));
    const h = el('h2', 'review-title enc-title');
    h.textContent = '🕰️ Ma frise';
    h.classList.add('is-sm');
    const sub = el('p', 'enc-chap-sub');
    sub.textContent = `${fmtNum(known.length)} placé${known.length > 1 ? 's' : ''} · ${fmtNum(all.length - known.length)} à découvrir`;
    const chips = el('div', 'enc-tl-eras');
    const tl = el('div', 'enc-tl');
    tl.style.setProperty('--c', ENC_COLORS['Histoire']);
    const eraNodes = {};
    const list = known.map(x => x.q);
    let era = -1, hole = null;
    all.forEach(({ q, t }) => {
        const e = encEra(t.y);
        if (e !== era) {
            era = e;
            hole = null;
            const lab = el('div', 'enc-tl-era');
            lab.textContent = `${ENC_ERAS[e][1]} ${ENC_ERAS[e][2]}`;
            tl.append(lab);
            eraNodes[e] = lab;
        }
        if (!encKnown(q)) {   // à découvrir : les cases qui se suivent sont regroupées
            if (hole) { hole.n++; hole.y2 = t.y; hole.txt.textContent = `❓ ${hole.n} événements à découvrir`; return; }
            const row = el('button', 'enc-tl-ev is-lock');
            row.type = 'button';
            const txt = el('span', 'enc-tl-box');
            txt.textContent = '❓ 1 événement à découvrir';
            row.append(encYearLabel(t.y, t.approx), el('i', 'enc-tl-dot'), txt);
            row.addEventListener('click', encLockedTip);
            hole = { n: 1, txt };
            tl.append(row);
            return;
        }
        hole = null;
        const row = el('button', 'enc-tl-ev');
        row.type = 'button';
        const box = el('span', 'enc-tl-box');
        const b = el('b');
        b.textContent = q.a[0];
        const s = el('small');
        s.textContent = q.q;
        box.append(b, s);
        row.append(encYearLabel(t.y, t.approx), el('i', 'enc-tl-dot'), box);
        row.addEventListener('click', () => { encState.friseScroll = mc.scrollTop; openEncFiche(q, list, { label: '← Ma frise', fn: () => openEncFrise(true) }); });
        tl.append(row);
    });
    ENC_ERAS.forEach(([, emo, name], e) => {
        if (!eraNodes[e]) return;
        const c = el('button', 'enc-tl-chip');
        c.type = 'button';
        c.textContent = `${emo} ${name}`;
        c.addEventListener('click', () => { mc.scrollTo({ top: mc.scrollTop + eraNodes[e].getBoundingClientRect().top - chips.getBoundingClientRect().bottom - 8, behavior: 'smooth' }); });
        chips.append(c);
    });
    const mc = encPage(encBackBtn('← Histoire', () => openEncBook('Histoire', true)), tl);
    const fixed = el('div', 'enc-tl-head');   // 12/11 : titre + périodes restent en haut, seule la frise défile
    fixed.append(h, sub, chips);
    mc.before(fixed);
    // 12/11 : la barre des périodes reste en haut ; la période qu'on regarde s'allume
    const chipEls = [...chips.children];
    const eraIdx = Object.keys(eraNodes).map(Number);
    const onScroll = () => {
        if (!chips.isConnected) { mc.removeEventListener('scroll', onScroll); return; }
        const lim = chips.getBoundingClientRect().bottom + 12;
        let cur = eraIdx[0];
        eraIdx.forEach(e => { if (eraNodes[e].getBoundingClientRect().top <= lim) cur = e; });
        chipEls.forEach((c, j) => {
            const on = eraIdx[j] === cur;
            if (on && !c.classList.contains('is-on')) chips.scrollTo({ left: c.offsetLeft - 8, behavior: 'smooth' });
            c.classList.toggle('is-on', on);
        });
    };
    mc.addEventListener('scroll', onScroll, { passive: true });
    requestAnimationFrame(onScroll);
    mc.scrollTop = keep ? encState.friseScroll || 0 : 0;
}

/* Carte du monde (Géographie, Drapeaux, Monuments) : chaque pays se colore selon les questions sues qui en parlent. */
const ENC_MAP_THEMES = ['Géographie', 'Drapeaux', 'Monuments'];
function encCountryData() {
    const by = {};
    ENC_MAP_THEMES.forEach(t => encChapters(t).forEach(c => c.qs.forEach(q => {
        (window.ENC_COUNTRY?.[q.id] || []).forEach(cc => { (by[cc] = by[cc] || []).push(q); });
    })));
    return by;
}
let encMapView = null;
/** Ligne courte d'une question dans la fiche d'un pays (« Capitale · Rome », « Drapeau · ✓ su »…). */
function encCountryLabel(q) {
    if (q.flag) return ['Drapeau', '✓ su'];
    if (/^Quelle est la (capitale|préfecture)|chef-lieu|a pour capitale/i.test(q.q) && !/^Quel pays/i.test(q.q)) return ['Capitale', q.a[0]];
    if (q.photo && /^Quel est ce monument/i.test(q.q)) return ['Monument en photo', q.a[0]];
    if (/^Quel pays a pour capitale/i.test(q.q)) return [q.q.replace(/^Quel pays a pour capitale\s*/i, 'Capitale : ').replace(/\s*\?$/, ''), q.a[0]];
    return [q.q.replace(/\s*\?$/, ''), q.a[0]];
}
/** 13/11 : balayer à gauche / à droite pour passer de la France au monde (zone = tout sauf la carte du monde, qu'on fait glisser). */
function encSwipe(zone, onLeft, onRight, skip = null) {
    let sx = null, sy = 0;
    zone.addEventListener('touchstart', e => { if (skip && e.target.closest(skip)) { sx = null; return; } sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    zone.addEventListener('touchend', e => {
        if (sx === null) return;
        const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
        sx = null;
        if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
        (dx < 0 ? onLeft : onRight)?.();
    }, { passive: true });
}
/** 13/11 : onglets France / Monde de la Gastronomie. */
function encGastroTabs(active) {
    const tabs = el('div', 'enc-god-tabs');
    [['france', '🥖 France', () => openEncFrance()], ['monde', '🌍 Monde', () => openEncMap('Gastronomie', null, 'cuisine')]].forEach(([k, l, fn]) => {
        const b = el('button', `enc-god-tab${k === active ? ' is-on' : ''}`);
        b.type = 'button';
        b.style.setProperty('--c', '#ca8a04');
        b.textContent = l;
        if (k !== active) b.addEventListener('click', fn);
        tabs.append(b);
    });
    return tabs;
}
async function openEncMap(fromTheme, keepCc = null, kind = 'geo') {
    const body = $('friendBody');
    try { await encLoad('carte-monde.js'); if (kind === 'cuisine') await encLoad('carte-france.js'); } catch (e) { showToast('📶 Carte indisponible hors connexion pour l’instant'); return; }
    const M = window.WORLD_MAP;
    const by = kind === 'cuisine' ? (() => {   // cuisines du monde : les plats étrangers sur leur pays
        const o = {}, all = encAll();
        Object.entries(window.ENC_CUISINE || {}).forEach(([id, ccs]) => { const q = all.get(Number(id)); if (q) ccs.forEach(cc => (o[cc] = o[cc] || []).push(q)); });
        o.FR = Object.keys(window.ENC_REGION || {}).map(id => all.get(Number(id))).filter(Boolean);   // la France = ses régions
        return o;
    })() : encCountryData();
    const st = cc => { const qs = by[cc] || []; const k = qs.filter(encKnown).length; return { qs, k, n: qs.length }; };
    const codes = Object.keys(by);
    const found = codes.filter(cc => st(cc).k > 0).length, full = codes.filter(cc => { const s = st(cc); return s.k === s.n; }).length;
    body.replaceChildren();
    const page = el('div', 'enc-full enc-mappage');   // 12/11 : la carte prend toute la page (comme une fiche)
    const h = el('h2', 'review-title enc-title is-sm');
    h.textContent = kind === 'cuisine' ? '🍜 Ma cuisine du monde' : '🗺️ Ma carte du monde';
    const tiles = el('div', 'enc-tiles enc-map-tiles');
    [[`${found} / ${codes.length}`, 'pays découverts'], [`✨ ${full}`, 'pays complets']].forEach(([v, l]) => {
        const d = el('div');
        const b = el('b');
        b.textContent = v;
        const s = el('span');
        s.textContent = l;
        d.append(b, s);
        tiles.append(d);
    });
    const wrap = el('div', 'enc-map');
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'enc-map-svg');
    const g = document.createElementNS(ns, 'g');
    svg.append(g);
    const shapes = {};
    const color = cc => { const s = st(cc); return !s.n ? 'is-none' : s.k >= s.n ? 'is-full' : s.k ? 'is-part' : 'is-todo'; };
    M.countries.forEach(([cc, d]) => {
        const p = document.createElementNS(ns, 'path');
        p.setAttribute('d', d);
        p.setAttribute('class', `enc-cty ${color(cc)}`);
        p.dataset.cc = cc;
        g.append(p);
        (shapes[cc] = shapes[cc] || []).push(p);
    });
    const dots = document.createElementNS(ns, 'g');
    M.dots.forEach(([cc, x, y]) => {
        const c = document.createElementNS(ns, 'circle');
        c.setAttribute('cx', x);
        c.setAttribute('cy', y);
        c.setAttribute('class', `enc-cty enc-dot ${color(cc)}`);
        c.dataset.cc = cc;
        dots.append(c);
        (shapes[cc] = shapes[cc] || []).push(c);
    });
    g.append(dots);
    const zoom = el('div', 'enc-map-zoom');
    const zin = el('button');
    zin.type = 'button';
    zin.textContent = '+';
    const zout = el('button');
    zout.type = 'button';
    zout.textContent = '−';
    zoom.append(zin, zout);
    const legend = el('div', 'enc-map-legend');
    [['is-full', 'tout su'], ['is-part', 'en partie'], ['is-todo', 'à découvrir']].forEach(([cls, l]) => {
        const s = el('span');
        s.append(el('i', cls), document.createTextNode(l));
        legend.append(s);
    });
    wrap.append(svg, zoom, legend);
    const panel = el('div', 'enc-map-panel');
    const hint = el('p', 'muted enc-map-hint');
    hint.textContent = '👆 Touche un pays pour voir ce que tu sais de lui. Glisse pour te déplacer, deux doigts ou + / − pour zoomer.';
    panel.append(hint);
    // vue : le cadre a la forme de la zone d'affichage (la carte remplit toute la hauteur)
    const v = encMapView || (encMapView = { s: 0, cx: M.w * 0.52, cy: M.h * 0.42 });
    let ratio = M.h / M.w;
    const sMin = () => 1;
    const apply = () => {
        const r = svg.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) ratio = r.height / r.width;
        if (!v.s) { if (!(r.width > 0 && r.height > 0)) return; v.s = Math.max(1, Math.min(1.15, M.w * ratio / M.h)); }   // 1re ouverture : carte agrandie (Europe / Afrique au centre)
        v.s = Math.max(sMin(), Math.min(80, v.s));
        const vw = M.w / v.s, vh = vw * ratio;
        v.cx = vw >= M.w ? M.w / 2 : Math.max(vw / 2, Math.min(M.w - vw / 2, v.cx));
        v.cy = vh >= M.h ? M.h / 2 : Math.max(vh / 2, Math.min(M.h - vh / 2, v.cy));
        svg.setAttribute('viewBox', `${v.cx - vw / 2} ${v.cy - vh / 2} ${vw} ${vh}`);
        svg.style.setProperty('--sw', String(0.6 / v.s));
        const rad = String(Math.max(2.2, 7 / Math.sqrt(v.s)) / Math.sqrt(v.s));
        dots.querySelectorAll('circle').forEach(c => c.setAttribute('r', rad));
    };
    zin.addEventListener('click', () => { v.s *= 1.8; apply(); });
    zout.addEventListener('click', () => { v.s /= 1.8; apply(); });
    let sel = null;
    const order = fromTheme ? [fromTheme, ...ENC_MAP_THEMES.filter(t => t !== fromTheme)] : ENC_MAP_THEMES;
    const clearMap = () => {
        if (sel) (shapes[sel] || []).forEach(p => p.classList.remove('is-sel'));
        sel = null;
        panel.replaceChildren(hint);
    };
    const show = cc => {
        if (sel === cc) { clearMap(); return; }
        if (sel) (shapes[sel] || []).forEach(p => p.classList.remove('is-sel'));
        sel = cc;
        (shapes[cc] || []).forEach(p => { p.classList.add('is-sel'); if (p.tagName === 'circle') dots.append(p); else g.insertBefore(p, dots); });   // les petits pays restent toujours par-dessus
        const s = st(cc);
        panel.replaceChildren();
        const card = el('div', 'enc-cpanel');
        const hd = el('div', 'enc-map-head');
        const fl = el('img', 'enc-map-flag');
        fl.src = `flags/${cc.toLowerCase()}.svg`;
        fl.alt = '';
        fl.onerror = () => fl.remove();
        const nm = el('b');
        nm.textContent = M.names[cc] || cc;
        const ct = el('span');
        ct.textContent = `· ${s.k} / ${s.n} ${s.n > 1 ? 'questions sues' : 'question sue'}`;
        hd.append(fl, nm, ct);
        encPanelX(hd, clearMap);
        card.append(hd);
        // 12/11 : on commence par le thème du livre ouvert (drapeaux dans Drapeaux, monuments dans Monuments…)
        const known = s.qs.filter(encKnown).sort((a, b) => order.indexOf(a.theme) - order.indexOf(b.theme));
        const ret = { label: '← Ma carte', fn: () => openEncMap(fromTheme, cc, kind) };
        let lastTheme = '';
        const many = new Set(known.map(q => q.theme)).size > 1;
        known.forEach(q => {
            if (many && q.theme !== lastTheme) {
                lastTheme = q.theme;
                const t = el('p', 'enc-crow-th');
                t.textContent = `${encIcon(q.theme)} ${q.theme}`;
                card.append(t);
            }
            const [label, val] = encCountryLabel(q);
            const row = el('button', 'enc-crow');
            row.type = 'button';
            const l = el('span');
            l.textContent = label;
            const b = el('b');
            b.textContent = val;
            row.append(l, b);
            row.addEventListener('click', () => openEncFiche(q, known, ret));
            card.append(row);
        });
        if (s.n > s.k) {
            const lk = el('button', 'enc-crow is-lock');
            lk.type = 'button';
            const l = el('span');
            l.textContent = `❓ ${s.n - s.k} question${s.n - s.k > 1 ? 's' : ''} à découvrir`;
            lk.append(l);
            lk.addEventListener('click', encLockedTip);
            card.append(lk);
        }
        panel.append(card);
        panel.scrollTop = 0;
    };
    // gestes : tap = pays, glisser = déplacer, deux doigts = zoomer
    const pts = new Map();
    let moved = false, pinch = null;
    svg.addEventListener('pointerdown', e => { try { svg.setPointerCapture(e.pointerId); } catch (err) { /* pointeur déjà relâché */ } pts.set(e.pointerId, [e.clientX, e.clientY]); moved = pts.size > 1; if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), s: v.s }; } });
    svg.addEventListener('pointermove', e => {
        if (!pts.has(e.pointerId)) return;
        const [px, py] = pts.get(e.pointerId);
        if (pts.size === 2 && pinch) {
            pts.set(e.pointerId, [e.clientX, e.clientY]);
            const [a, b] = [...pts.values()];
            v.s = pinch.s * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d;
            apply();
            return;
        }
        if (Math.abs(e.clientX - px) + Math.abs(e.clientY - py) < 4 && !moved) return;
        moved = true;
        const r = svg.getBoundingClientRect();
        const vw = M.w / v.s;
        v.cx -= (e.clientX - px) / r.width * vw;
        v.cy -= (e.clientY - py) / r.height * vw * ratio;
        pts.set(e.pointerId, [e.clientX, e.clientY]);
        apply();
    });
    svg.addEventListener('pointerup', e => {
        const was = pts.has(e.pointerId);
        pts.delete(e.pointerId);
        if (pts.size < 2) pinch = null;
        if (!was || moved || pts.size) { if (!pts.size) moved = false; return; }
        // 12/11 : un petit pays (point) se touche à 22 px près, avant le grand pays en dessous
        let best = null, bd = 22;
        dots.querySelectorAll('circle').forEach(c => {
            if (!by[c.dataset.cc]) return;
            const r = c.getBoundingClientRect();
            const d = Math.hypot(r.left + r.width / 2 - e.clientX, r.top + r.height / 2 - e.clientY);
            if (d < bd) { bd = d; best = c.dataset.cc; }
        });
        const t = best ? null : document.elementFromPoint(e.clientX, e.clientY)?.closest?.('.enc-cty');
        const cc = best || t?.dataset?.cc;
        if (cc === 'FR' && kind === 'cuisine') { openEncFrance(); return; }   // la France a sa propre carte
        if (cc && by[cc]) show(cc);
        else if (sel) clearMap();   // 13/11 : tap dans la mer (ou un pays sans question) = on referme
    });
    svg.addEventListener('pointercancel', e => { pts.delete(e.pointerId); pinch = null; moved = false; });
    svg.addEventListener('wheel', e => { e.preventDefault(); v.s *= e.deltaY < 0 ? 1.2 : 1 / 1.2; apply(); }, { passive: false });
    page.append(h, ...(kind === 'cuisine' ? [encGastroTabs('monde')] : []), tiles, wrap, panel);
    if (kind === 'cuisine') encSwipe(page, null, () => openEncFrance(), '.enc-map');
    body.append(encBackBtn(fromTheme ? `← ${fromTheme}` : '← Retour', () => { encMapView = null; if (fromTheme) openEncBook(fromTheme, true); else $('friendModal').hidden = true; }), page);
    $('friendModal').hidden = false;
    requestAnimationFrame(() => { apply(); if (keepCc && by[keepCc]) show(keepCc); });
    if (window.ResizeObserver) new ResizeObserver(() => { if (svg.isConnected) apply(); }).observe(svg);
}

/* 12/11 : l'arbre des dieux (Mythologie). Un dieu se dévoile quand une de ses questions est sue ; tap = ses questions en bas. */
let encGodsRoman = false;   // 12/11 : bouton « Noms grecs / Noms romains »
/* 13/11 : écran générique « des choses à découvrir placées sur un dessin » : arbre des dieux, corps humain, système solaire. */
const ENC_SPOT_SETS = {
    gods: { src: 'arbre-dieux.js', data: () => window.ENC_GODS, tab: 'grece', title: '🌳 L’arbre des dieux', theme: 'Mythologie', back: '← L’arbre des dieux', unknown: 'Dieu à découvrir' },
    sci: { src: 'sciences-corps.js', data: () => window.ENC_SCI, tab: 'corps', title: '🔬 Mes sciences', theme: 'Sciences', back: '← Mes sciences', unknown: 'À découvrir' }
};
const openEncGods = (tab, keepId, keepScroll) => openEncSpots('gods', tab, keepId, keepScroll);
/** Décor dessiné sous les éléments : silhouette du corps, Soleil et orbites. */
function encSpotBg(P, nodes) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 100 ${P.h}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('class', 'enc-spot-bg');
    const add = (tag, at) => { const e = document.createElementNS(ns, tag); Object.entries(at).forEach(([k, v]) => e.setAttribute(k, v)); svg.append(e); return e; };
    if (P.bg === 'body') {
        const f = { class: 'enc-body-part' };
        add('ellipse', { ...f, cx: 50, cy: 62, rx: 8, ry: 34 });
        add('rect', { ...f, x: 46.5, y: 92, width: 7, height: 20, rx: 2 });
        add('rect', { ...f, x: 36, y: 108, width: 28, height: 220, rx: 7, ry: 34 });
        add('rect', { ...f, x: 27, y: 116, width: 8, height: 210, rx: 4, ry: 20 });
        add('rect', { ...f, x: 65, y: 116, width: 8, height: 210, rx: 4, ry: 20 });
        add('rect', { ...f, x: 38, y: 318, width: 11, height: 290, rx: 5, ry: 22 });
        add('rect', { ...f, x: 51, y: 318, width: 11, height: 290, rx: 5, ry: 22 });
    }
    if (P.bg === 'space') {
        const sun = nodes.find(n => n.id === 'soleil');
        nodes.filter(n => n.orbit).forEach(n => {
            const dy = n.y - sun.y, dxpx = (n.x - sun.x) * 3.1, rr = Math.sqrt(dy * dy + dxpx * dxpx);
            add('ellipse', { class: `enc-orbit${n.s.k ? ' is-on' : ''}`, cx: sun.x, cy: sun.y, rx: rr / 3.1, ry: rr, 'vector-effect': 'non-scaling-stroke' });
        });
    }
    return svg;
}
async function openEncSpots(set, tab = null, keepId = null, keepScroll = null) {
    const cfg = ENC_SPOT_SETS[set];
    tab = tab || cfg.tab;
    try { await encLoad(cfg.src); } catch (e) { showToast('📶 Indisponible hors connexion pour l’instant'); return; }
    cfg.tab = tab;
    const openSelf = (...x) => openEncSpots(set, ...x);
    const P = cfg.data()[tab];
    const all = encAll();
    const st = n => { const qs = n.q.map(id => all.get(id)).filter(Boolean); const k = qs.filter(encKnown).length; return { qs, k, n: qs.length }; };
    const nodes = P.nodes.map(n => ({ ...n, s: st(n) }));
    const found = nodes.filter(n => n.s.k > 0).length;
    const page = el('div', `enc-full enc-godpage enc-spots-${set}`);
    const h = el('h2', 'review-title enc-title is-sm');
    h.textContent = P.title || cfg.title;
    const cnt = el('p', 'enc-chap-sub');
    cnt.textContent = `${found} / ${nodes.length} découverts`;
    const tabs = el('div', 'enc-god-tabs');
    Object.entries(cfg.data()).forEach(([k, v]) => {
        const b = el('button', `enc-god-tab${k === tab ? ' is-on' : ''}`);
        b.type = 'button';
        b.style.setProperty('--c', v.color);
        b.textContent = v.label;
        b.addEventListener('click', () => openSelf(k));
        tabs.append(b);
    });
    const scroller = el('div', 'enc-god-scroll');
    const tree = el('div', `enc-tree${P.bg ? ` is-${P.bg}` : ''}`);
    tree.style.height = `${P.h}px`;
    tree.style.setProperty('--c', P.color);
    if (P.bg) tree.append(encSpotBg(P, nodes));
    (P.tiers || []).forEach(([t, y]) => { const d = el('span', 'enc-tree-tier'); d.style.top = `${y}px`; d.textContent = t; tree.append(d); });
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 100 ${P.h}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
    const lines = [];
    // un seul trait par enfant : depuis son parent, ou depuis le milieu du couple (sinon l'arbre devient illisible)
    nodes.forEach(n => {
        const ps = (n.parents || []).map(pid => byId[pid]).filter(Boolean);
        if (!ps.length) return;
        const ax = ps.reduce((t, a) => t + a.x, 0) / ps.length, ay = Math.max(...ps.map(a => a.y)) + 34;   // sous les noms
        const p = document.createElementNS(ns, 'path');
        const my = (ay + n.y - 20) / 2;
        p.setAttribute('d', `M${ax} ${ay} C ${ax} ${my}, ${n.x} ${my}, ${n.x} ${n.y - 20}`);
        p.setAttribute('class', `enc-tree-line${ps.every(a => a.s.k) && n.s.k ? ' is-on' : ''}`);
        lines.push({ el: p, child: n.id, parents: ps.map(a => a.id) });
        p.setAttribute('vector-effect', 'non-scaling-stroke');
        svg.append(p);
        if (ps.length === 2) {   // petit trait horizontal entre les deux parents (le couple)
            const c = document.createElementNS(ns, 'path');
            const [a1, a2] = ps;
            c.setAttribute('d', `M${a1.x} ${a1.y + 30} L ${a1.x} ${ay} L ${a2.x} ${ay} L ${a2.x} ${a2.y + 30}`);
            c.setAttribute('class', `enc-tree-line is-couple${a1.s.k && a2.s.k ? ' is-on' : ''}`);
            c.setAttribute('vector-effect', 'non-scaling-stroke');
            svg.append(c);
            lines.push({ el: c, child: n.id, parents: ps.map(a => a.id) });
        }
    });
    nodes.forEach(n => {   // trait vers l'organe (corps humain)
        if (!n.to) return;
        const p = document.createElementNS(ns, 'path');
        p.setAttribute('d', `M${n.x} ${n.y} L ${n.to[0]} ${n.to[1]}`);
        p.setAttribute('class', `enc-tree-line is-lead${n.s.k ? ' is-on' : ''}`);
        p.setAttribute('vector-effect', 'non-scaling-stroke');
        svg.append(p);
        lines.push({ el: p, child: n.id, parents: [] });
        const d = document.createElementNS(ns, 'ellipse');
        d.setAttribute('cx', n.to[0]); d.setAttribute('cy', n.to[1]); d.setAttribute('rx', 1.2); d.setAttribute('ry', 3.6);
        d.setAttribute('class', `enc-lead-dot${n.s.k ? ' is-on' : ''}`);
        svg.append(d);
    });
    tree.append(svg);
    const panel = el('div', 'enc-map-panel enc-god-panel');
    const btns = {};
    let spotBefore = null;   // 13/11 : position du dessin avant la 1re sélection (rendue quand on referme)
    const clearSel = () => {
        if (!page.classList.contains('has-sel')) return;
        Object.values(btns).forEach(b => b.classList.remove('is-sel'));
        lines.forEach(l => l.el.classList.remove('is-hl'));
        panel.replaceChildren();
        page.classList.remove('has-sel');
        const top = spotBefore || 0;
        spotBefore = null;
        requestAnimationFrame(() => { scroller.scrollTop = top; });
    };
    const show = n => {
        if (btns[n.id]?.classList.contains('is-sel')) { clearSel(); return; }
        if (spotBefore === null) spotBefore = scroller.scrollTop;
        Object.values(btns).forEach(b => b.classList.remove('is-sel'));
        // 12/11 : la branche du dieu touché s'allume (ses ancêtres jusqu'en haut, et ses enfants)
        const up = new Set([n.id]);
        let grew = true;
        while (grew) { grew = false; lines.forEach(l => { if (up.has(l.child)) l.parents.forEach(p => { if (!up.has(p)) { up.add(p); grew = true; } }); }); }
        lines.forEach(l => l.el.classList.toggle('is-hl', up.has(l.child) || l.parents.includes(n.id)));
        svg.append(...lines.filter(l => l.el.classList.contains('is-hl')).map(l => l.el));
        btns[n.id]?.classList.add('is-sel');
        panel.replaceChildren();
        const card = el('div', 'enc-cpanel');
        card.style.borderColor = `color-mix(in srgb, ${P.color} 30%, var(--line))`;
        const hd = el('div', 'enc-map-head');
        const nm = el('b');
        const known = n.s.qs.filter(encKnown);
        const names = encGodsRoman && n.alt ? [n.alt, n.name] : [n.name, n.alt];
        nm.textContent = known.length ? `${n.emo || '●'} ${names[0]}${names[1] ? ` · ${names[1]}` : ''}` : `❓ ${P.unknown || cfg.unknown}`;
        const ct = el('span');
        ct.textContent = `· ${n.s.k} / ${n.s.n} ${n.s.n > 1 ? 'questions sues' : 'question sue'}`;
        hd.append(nm, ct);
        encPanelX(hd, clearSel);
        card.append(hd);
        if (known.length && n.desc) { const d = el('p', 'enc-god-desc'); d.textContent = n.desc; card.append(d); }
        const ret = { label: cfg.back, fn: () => openSelf(tab, n.id) };
        known.forEach(q => {
            const row = el('button', 'enc-crow');
            row.type = 'button';
            const l = el('span');
            l.textContent = q.q.replace(/\s*\?$/, '');
            const b = el('b');
            b.textContent = q.a[0];
            row.append(l, b);
            row.addEventListener('click', () => openEncFiche(q, known, ret));
            card.append(row);
        });
        if (n.s.n > n.s.k) {
            const lk = el('button', 'enc-crow is-lock');
            lk.type = 'button';
            const l = el('span');
            l.textContent = `❓ ${n.s.n - n.s.k} question${n.s.n - n.s.k > 1 ? 's' : ''} à découvrir`;
            lk.append(l);
            lk.addEventListener('click', encLockedTip);
            card.append(lk);
        }
        panel.append(card);
        panel.scrollTop = 0;
        // 12/11 : l'arbre se resserre en haut, le dieu touché remonte en haut de l'arbre, sa fiche s'affiche en entier dessous
        page.classList.add('has-sel');
        requestAnimationFrame(() => scroller.scrollTo({ top: Math.max(0, n.y - 56), behavior: 'smooth' }));
    };
    nodes.forEach(n => {
        const empty = !n.s.n;   // rien à apprendre dessus pour l'instant (Mercure…) : juste dessiné, pour reconnaître l'ensemble
        const b = el('button', `enc-god${n.s.k ? ' is-known' : ''}${n.s.n && n.s.k >= n.s.n ? ' is-full' : ''}${empty ? ' is-empty' : ''}${n.color ? ' is-disc' : ''}`);
        b.type = 'button';
        b.style.left = `${n.x}%`;
        b.style.top = `${n.y}px`;
        const i = el('i');
        if (n.color) { i.style.setProperty('--disc', n.color); i.style.setProperty('--sz', `${n.size || 30}px`); i.textContent = n.s.k || empty ? '' : '?'; }
        else i.textContent = n.s.k ? n.emo : '?';
        const t = el('span');
        t.textContent = n.s.k || empty ? (P.roman && encGodsRoman && n.alt ? n.alt : n.name) : '???';
        b.append(i, t);
        b.dataset.id = n.id;
        if (empty) b.disabled = true;
        else b.addEventListener('click', () => show(n));
        btns[n.id] = b;
        tree.append(b);
    });
    scroller.append(tree);
    encTapOff(tree, '.enc-god', clearSel);
    let romanBtn = null;
    if (P.roman) {
        const sw = el('button', `enc-god-roman${encGodsRoman ? ' is-on' : ''}`);
        sw.type = 'button';
        sw.textContent = encGodsRoman ? '🏛️ Noms romains · toucher pour les noms grecs' : '🏺 Noms grecs · toucher pour les noms romains';
        sw.addEventListener('click', () => { encGodsRoman = !encGodsRoman; openSelf(tab, null, scroller.scrollTop); });
        romanBtn = sw;
    }
    const keys = Object.keys(cfg.data());
    let sx = null, sy = 0;
    scroller.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    scroller.addEventListener('touchend', e => {
        if (sx === null) return;
        const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
        sx = null;
        if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
        const j = keys.indexOf(tab) + (dx < 0 ? 1 : -1);
        if (j < 0 || j >= keys.length) return;
        openSelf(keys[j]);
        $('friendBody').querySelector('.enc-god-scroll')?.classList.add(dx < 0 ? 'is-from-right' : 'is-from-left');
    }, { passive: true });
    page.append(h, cnt, tabs, ...(romanBtn ? [romanBtn] : []), scroller, panel);
    const body = $('friendBody');
    body.replaceChildren(encBackBtn(`← ${cfg.theme}`, () => openEncBook(cfg.theme, true)), page);
    $('friendModal').hidden = false;
    if (keepScroll !== null) requestAnimationFrame(() => { scroller.scrollTop = keepScroll; });
    if (keepId && byId[keepId]) {
        show(byId[keepId]);
        requestAnimationFrame(() => { scroller.scrollTop = Math.max(0, byId[keepId].y - 120); });
    }
}

/* 12/11 : « Ma France gourmande » (Gastronomie). Les 13 régions sont toujours dessinées ; elles se dorent avec les spécialités sues. */
async function openEncFrance(keepCode = null) {
    try { await encLoad('carte-france.js'); } catch (e) { showToast('📶 Carte indisponible hors connexion pour l’instant'); return; }
    const M = window.FRANCE_MAP;
    const all = encAll();
    const by = {};
    Object.entries(window.ENC_REGION).forEach(([id, code]) => { const q = all.get(Number(id)); if (q) (by[code] = by[code] || []).push(q); });
    const st = code => { const qs = by[code] || []; const k = qs.filter(encKnown).length; return { qs, k, n: qs.length }; };
    const tot = Object.values(by).reduce((t, qs) => t + qs.length, 0);
    const kn = Object.values(by).reduce((t, qs) => t + qs.filter(encKnown).length, 0);
    const page = el('div', 'enc-full enc-godpage enc-frpage');
    const h = el('h2', 'review-title enc-title is-sm');
    h.textContent = '🧀 Ma France gourmande';
    const cnt = el('p', 'enc-chap-sub');
    cnt.textContent = `${kn} / ${tot} spécialités sues`;
    const wrap = el('div', 'enc-god-scroll enc-fr-wrap');
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 ${M.w} ${M.h}`);
    svg.setAttribute('class', 'enc-fr-svg');
    const lvl = s => !s.n || !s.k ? 'l0' : s.k >= s.n ? 'l3' : s.k / s.n >= 0.5 ? 'l2' : 'l1';
    const shapes = {};
    const labels = document.createElementNS(ns, 'g');
    M.regions.forEach(([code, name, d, cx, cy]) => {
        const s = st(code);
        const p = document.createElementNS(ns, 'path');
        p.setAttribute('d', d);
        p.setAttribute('class', `enc-reg ${lvl(s)}`);
        p.dataset.code = code;
        svg.append(p);
        shapes[code] = p;
        const t = document.createElementNS(ns, 'text');
        t.setAttribute('x', cx);
        t.setAttribute('y', cy);
        t.setAttribute('class', 'enc-reg-n');
        t.textContent = s.n ? `${s.k}/${s.n}` : '';
        labels.append(t);
    });
    svg.append(labels);
    wrap.append(svg);
    const legend = el('div', 'enc-map-legend enc-fr-legend');
    [['l3', 'tout su'], ['l2', 'plus de la moitié'], ['l1', 'un peu'], ['l0', 'à découvrir']].forEach(([cls, l]) => {
        const s = el('span');
        s.append(el('i', `enc-fr-${cls}`), document.createTextNode(l));
        legend.append(s);
    });
    const credit = el('small', 'enc-fr-credit');
    credit.textContent = 'Contours des régions : IGN Admin Express (Licence ouverte)';
    const panel = el('div', 'enc-map-panel enc-god-panel');
    const CH_EMO = { 'Fromages': '🧀', 'Boissons': '🍷', 'Plats français': '🥘', 'Desserts et pâtisseries': '🍰', 'Produits et ingrédients': '🧄', 'Chefs, techniques et ustensiles': '👨‍🍳' };
    let sel = null;
    const clearFr = () => {
        if (!sel) return;
        shapes[sel]?.classList.remove('is-sel');
        sel = null;
        panel.replaceChildren();
        page.classList.remove('has-sel');
    };
    const show = code => {
        if (sel === code) { clearFr(); return; }
        if (sel) shapes[sel]?.classList.remove('is-sel');
        sel = code;
        shapes[code].classList.add('is-sel');
        svg.insertBefore(shapes[code], labels);
        const reg = M.regions.find(r => r[0] === code);
        const s = st(code);
        panel.replaceChildren();
        const card = el('div', 'enc-cpanel enc-fr-card');
        const hd = el('div', 'enc-map-head');
        const nm = el('b');
        nm.textContent = reg[1];
        const ct = el('span');
        ct.textContent = `· ${s.k} / ${s.n} ${s.n > 1 ? 'spécialités sues' : 'spécialité sue'}`;
        hd.append(nm, ct);
        encPanelX(hd, clearFr);
        card.append(hd);
        const known = s.qs.filter(encKnown);
        const ret = { label: '← Ma France gourmande', fn: () => openEncFrance(code) };
        known.forEach(q => {
            const row = el('button', 'enc-crow');
            row.type = 'button';
            const l = el('span');
            l.textContent = `${CH_EMO[encChapterOf(q)?.name] || '🍽️'} ${q.q.replace(/\s*\?$/, '')}`;
            const b = el('b');
            b.textContent = q.a[0];
            row.append(l, b);
            row.addEventListener('click', () => openEncFiche(q, known, ret));
            card.append(row);
        });
        if (s.n > s.k) {
            const lk = el('button', 'enc-crow is-lock');
            lk.type = 'button';
            const l = el('span');
            l.textContent = `❓ ${s.n - s.k} spécialité${s.n - s.k > 1 ? 's' : ''} à découvrir`;
            lk.append(l);
            lk.addEventListener('click', encLockedTip);
            card.append(lk);
        }
        panel.append(card);
        panel.scrollTop = 0;
        page.classList.add('has-sel');
    };
    svg.addEventListener('click', e => { const p = e.target.closest('.enc-reg'); if (p) show(p.dataset.code); });
    encTapOff(wrap, '.enc-reg', clearFr);   // 13/11 : tap à côté = carte entière
    page.append(h, encGastroTabs('france'), cnt, wrap, legend, credit, panel);
    encSwipe(page, () => openEncMap('Gastronomie', null, 'cuisine'), null);
    const body = $('friendBody');
    body.replaceChildren(encBackBtn('← Gastronomie', () => openEncBook('Gastronomie', true)), page);
    $('friendModal').hidden = false;
    if (keepCode && shapes[keepCode]) show(keepCode);
}

/* 13/11 : « Mon dictionnaire » (Langue française) : chaque question est rangée à la 1re lettre de son mot ; la case se remplit d'encre. */
const ENC_DICO_SKIP = new Set(['avoir', 'etre', 'faire', 'se', 's', 'ne', 'il', 'y', 'en', 'on']);
function encDicoWord(q) {
    const m = /(signifie|veut dire|définit|désigne le mot|sens d)/i.test(q.q) && q.q.match(/«\s*([^»]+?)\s*»/);
    let w = m ? m[1] : q.a[0];
    const words = encNorm(w).replace(/[’']/g, ' ').split(/[^a-z0-9]+/).filter(Boolean);
    const art = new Set(['le', 'la', 'les', 'l', 'un', 'une', 'des', 'd', 'du', 'de']);
    let i = 0;
    const isExpr = /Expressions|Proverbes/.test(encChapterOf(q)?.name || '');
    while (i < words.length - 1 && (art.has(words[i]) || (isExpr && ENC_DICO_SKIP.has(words[i])))) i++;
    return words[i] || '';
}
function encDicoLetter(q) {
    const c = encDicoWord(q).charAt(0).toUpperCase();
    return /[A-Z]/.test(c) ? c : '#';
}
function openEncDico(keepL = null) {
    const qs = encChapters('Langue française').flatMap(c => c.qs);
    const by = {};
    qs.forEach(q => { const l = encDicoLetter(q); (by[l] = by[l] || []).push(q); });
    const kn = qs.filter(encKnown).length;
    const page = el('div', 'enc-full enc-godpage enc-dicopage');
    const h = el('h2', 'review-title enc-title is-sm');
    h.textContent = '📖 Mon dictionnaire';
    const cnt = el('p', 'enc-chap-sub');
    cnt.textContent = `${kn} / ${qs.length} mots et expressions sus`;
    const wrap = el('div', 'enc-god-scroll enc-dico-wrap');
    const grid = el('div', 'enc-dico');
    const panel = el('div', 'enc-map-panel enc-god-panel');
    const cells = {};
    const clearDico = () => {
        Object.values(cells).forEach(c => c.classList.remove('is-sel'));
        panel.replaceChildren();
        page.classList.remove('has-sel');
    };
    const show = L => {
        if (cells[L]?.classList.contains('is-sel')) { clearDico(); return; }
        Object.values(cells).forEach(c => c.classList.remove('is-sel'));
        cells[L]?.classList.add('is-sel');
        const list = (by[L] || []).slice().sort((a, b) => encDicoWord(a).localeCompare(encDicoWord(b), 'fr'));
        const known = list.filter(encKnown);
        panel.replaceChildren();
        const card = el('div', 'enc-cpanel enc-dico-card');
        const hd = el('div', 'enc-map-head');
        const nm = el('b', 'enc-dico-big');
        nm.textContent = L === '#' ? '0-9' : L;
        const ct = el('span');
        ct.textContent = `· ${known.length} / ${list.length} ${list.length > 1 ? 'mots et expressions' : 'mot'}`;
        hd.append(nm, ct);
        encPanelX(hd, clearDico);
        card.append(hd);
        const ret = { label: '← Mon dictionnaire', fn: () => openEncDico(L) };
        known.forEach(q => {
            const row = el('button', 'enc-crow');
            row.type = 'button';
            const l = el('span');
            l.textContent = q.q.replace(/\s*\?$/, '');
            const b = el('b');
            b.textContent = q.a[0];
            row.append(l, b);
            row.addEventListener('click', () => openEncFiche(q, known, ret));
            card.append(row);
        });
        if (list.length > known.length) {
            const lk = el('button', 'enc-crow is-lock');
            lk.type = 'button';
            const l = el('span');
            l.textContent = `❓ ${list.length - known.length} à découvrir`;
            lk.append(l);
            lk.addEventListener('click', encLockedTip);
            card.append(lk);
        }
        panel.append(card);
        panel.scrollTop = 0;
        page.classList.add('has-sel');
        requestAnimationFrame(() => cells[L]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
    };
    [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', ...(by['#'] ? ['#'] : [])].forEach(L => {
        const list = by[L] || [];
        const k = list.filter(encKnown).length;
        const c = el('button', `enc-letter${!list.length ? ' is-empty' : ''}${list.length && k >= list.length ? ' is-full' : ''}${k ? ' is-known' : ''}`);
        c.type = 'button';
        c.style.setProperty('--f', `${list.length ? Math.round(k / list.length * 100) : 0}%`);
        const b = el('b');
        b.textContent = L === '#' ? '0-9' : L;
        const s = el('small');
        s.textContent = list.length ? `${k}/${list.length}` : '';
        c.append(b, s);
        if (list.length) c.addEventListener('click', () => show(L));
        else c.disabled = true;
        cells[L] = c;
        grid.append(c);
    });
    wrap.append(grid);
    encTapOff(wrap, '.enc-letter', clearDico);   // 13/11 : tap à côté = toutes les lettres
    page.append(h, cnt, wrap, panel);
    $('friendBody').replaceChildren(encBackBtn('← Langue française', () => openEncBook('Langue française', true)), page);
    $('friendModal').hidden = false;
    if (keepL && by[keepL]) show(keepL);
}

/* 13/11 : Drapeaux = « mur de drapeaux » rangés par continent ; Monuments = « album de cartes postales ». */
const ENC_CONTS = [['eu', '🏰 Europe'], ['af', '🦁 Afrique'], ['as', '🐉 Asie'], ['an', '🗽 Amérique du Nord et centrale'], ['sa', '🦜 Amérique du Sud'], ['oc', '🦘 Océanie']];
let encRegionNames = null;
function encCountryName(cc) {
    const n = window.WORLD_MAP?.names?.[cc];
    if (n) return n;
    try { encRegionNames = encRegionNames || new Intl.DisplayNames(['fr'], { type: 'region' }); return encRegionNames.of(cc); } catch (e) { return cc; }
}
/** Questions d'un thème rangées par pays (les questions sans pays vont dans « other »). extra = pays ajoutés à la main. */
function encByCountry(theme, extra = {}) {
    const by = {};
    encChapters(theme).flatMap(c => c.qs).forEach(q => {
        const ccs = window.ENC_COUNTRY?.[q.id] || extra[q.id] || [];
        (ccs.length ? ccs.slice(0, 1) : ['other']).forEach(cc => (by[cc] = by[cc] || []).push(q));
    });
    return by;
}
/** Un tap à côté (sur le fond du dessin) referme la fiche du bas et rend tout le dessin. */
function encPanelX(hd, clear) {
    const x = el('button', 'enc-panel-x');
    x.type = 'button';
    x.setAttribute('aria-label', 'Fermer');
    x.textContent = '✕';
    x.addEventListener('click', e => { e.stopPropagation(); clear(); });
    hd.append(x);
}
function encTapOff(zone, itemSel, clear) {
    zone.addEventListener('click', e => { if (!e.target.closest(itemSel)) clear(); });
}
function encQRows(card, qs, ret, labelOf) {
    const known = qs.filter(encKnown);
    known.forEach(q => {
        const row = el('button', 'enc-crow');
        row.type = 'button';
        const [label, val] = labelOf(q);
        const l = el('span');
        l.textContent = label;
        const b = el('b');
        b.textContent = val;
        row.append(l, b);
        row.addEventListener('click', () => openEncFiche(q, known, ret));
        card.append(row);
    });
    if (qs.length > known.length) {
        const lk = el('button', 'enc-crow is-lock');
        lk.type = 'button';
        const l = el('span');
        const m = qs.length - known.length;
        l.textContent = `❓ ${m} question${m > 1 ? 's' : ''} à découvrir`;
        lk.append(l);
        lk.addEventListener('click', encLockedTip);
        card.append(lk);
    }
}
function encMapLink(theme) {
    const b = el('button', 'enc-god-roman enc-maplink');
    b.type = 'button';
    b.textContent = '🗺️ Voir sur la carte du monde';
    b.addEventListener('click', () => openEncMap(theme));
    return b;
}

const ENC_FLAG_ODD = new Set(['NP', 'CH', 'VA', 'NE', 'MC', 'QA']);   // 13/11 : drapeaux carrés ou très allongés, gardés à leur forme
async function openEncFlags(keepCc = null, keepScroll = null) {
    try { await encLoad('carte-monde.js'); } catch (e) { showToast('📶 Indisponible hors connexion pour l’instant'); return; }
    const by = encByCountry('Drapeaux');
    const st = cc => { const qs = by[cc] || []; const k = qs.filter(encKnown).length; return { qs, k, n: qs.length }; };
    const ccs = Object.keys(by).filter(cc => cc !== 'other');
    const found = ccs.filter(cc => st(cc).k).length;
    const page = el('div', 'enc-full enc-godpage enc-flagpage');
    const h = el('h2', 'review-title enc-title is-sm');
    h.textContent = '🏳️ Mon mur de drapeaux';
    const cnt = el('p', 'enc-chap-sub');
    cnt.textContent = `${found} / ${ccs.length} pays découverts`;
    const scroller = el('div', 'enc-god-scroll enc-flag-wall');
    const panel = el('div', 'enc-map-panel enc-god-panel');
    const tiles = {};
    let sel = null, before = 0;
    const clear = () => {
        if (!sel) return;
        tiles[sel]?.classList.remove('is-sel');
        sel = null;
        panel.replaceChildren();
        page.classList.remove('has-sel');
        requestAnimationFrame(() => { scroller.scrollTop = before; });
    };
    const show = cc => {
        if (sel === cc) { clear(); return; }
        if (!sel) before = scroller.scrollTop;
        tiles[sel]?.classList.remove('is-sel');
        sel = cc;
        tiles[cc]?.classList.add('is-sel');
        const s = st(cc);
        panel.replaceChildren();
        const card = el('div', 'enc-cpanel');
        const hd = el('div', 'enc-map-head');
        if (cc !== 'other') {
            const fl = el('img', 'enc-map-flag');
            fl.src = `flags/${cc.toLowerCase()}.svg`;
            fl.alt = '';
            fl.onerror = () => fl.remove();
            if (s.k) hd.append(fl);
        }
        const nm = el('b');
        nm.textContent = cc === 'other' ? '🏁 Les autres drapeaux' : s.k ? encCountryName(cc) : '❓ Drapeau à découvrir';
        const ct = el('span');
        ct.textContent = `· ${s.k} / ${s.n} ${s.n > 1 ? 'questions sues' : 'question sue'}`;
        hd.append(nm, ct);
        encPanelX(hd, clear);
        card.append(hd);
        encQRows(card, s.qs, { label: '← Mon mur de drapeaux', fn: () => openEncFlags(cc, before) },
            q => q.flag ? ['🏳️ Son drapeau', '✓ reconnu'] : [q.q.replace(/\s*\?$/, ''), q.a[0]]);
        panel.append(card);
        panel.scrollTop = 0;
        page.classList.add('has-sel');
        requestAnimationFrame(() => tiles[cc]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
    };
    const cont = window.WORLD_CONT || {};
    ENC_CONTS.forEach(([k, label]) => {
        const list = ccs.filter(cc => cont[cc] === k).sort((a, b) => encCountryName(a).localeCompare(encCountryName(b), 'fr'));
        if (!list.length) return;
        const hk = list.filter(cc => st(cc).k).length;
        const t = el('p', 'enc-wall-h');
        t.textContent = `${label} · ${hk} / ${list.length}`;
        const grid = el('div', 'enc-flag-grid');
        list.forEach(cc => {
            const s = st(cc);
            const b = el('button', `enc-flag${s.k ? ' is-known' : ''}${s.k && s.k >= s.n ? ' is-full' : ''}${ENC_FLAG_ODD.has(cc) ? ' is-odd' : ''}`);
            b.type = 'button';
            const fr = el('span', 'enc-flag-img');
            if (ENC_FLAG_ODD.has(cc)) {
                const img = el('img');
                img.src = `flags/${cc.toLowerCase()}.svg`;
                img.alt = '';
                img.loading = 'lazy';
                img.draggable = false;
                fr.append(img);
            } else {   // 13/11 : tous les drapeaux à la même taille (étirés juste ce qu'il faut)
                const ns = 'http://www.w3.org/2000/svg';
                const sv = document.createElementNS(ns, 'svg');
                sv.setAttribute('viewBox', '0 0 30 20');
                sv.setAttribute('preserveAspectRatio', 'none');
                sv.setAttribute('class', 'enc-flag-sv');
                const im = document.createElementNS(ns, 'image');
                im.setAttribute('href', `flags/${cc.toLowerCase()}.svg`);
                im.setAttribute('width', '30');
                im.setAttribute('height', '20');
                im.setAttribute('preserveAspectRatio', 'none');
                sv.append(im);
                fr.append(sv);
            }
            if (!s.k) { const q = el('i'); q.textContent = '?'; fr.append(q); }
            const n = el('span', 'enc-flag-n');
            n.textContent = s.k ? encCountryName(cc) : '???';
            b.append(fr, n);
            b.addEventListener('click', () => show(cc));
            tiles[cc] = b;
            grid.append(b);
        });
        scroller.append(t, grid);
    });
    if (by.other) {
        const s = st('other');
        const t = el('p', 'enc-wall-h');
        t.textContent = `🏁 Les autres drapeaux · ${s.k} / ${s.n}`;
        const b = el('button', 'enc-flag-other');
        b.type = 'button';
        b.textContent = 'Pavillons, Europe, JO, plage, Formule 1… ›';
        b.addEventListener('click', () => show('other'));
        tiles.other = b;
        scroller.append(t, b);
    }
    encTapOff(scroller, '.enc-flag, .enc-flag-other', clear);
    page.append(h, cnt, scroller, panel);
    $('friendBody').replaceChildren(encBackBtn('← Drapeaux', () => openEncBook('Drapeaux', true)), page);
    $('friendModal').hidden = false;
    if (keepCc && by[keepCc]) { show(keepCc); before = keepScroll || 0; }
}

/* Cartes postales des monuments : une carte par question ; sue = la photo (ou un dessin) et le nom ; à découvrir = le dos de la carte. */
const ENC_POST_CC = { 2303: ['CN'], 4088: ['TR'], 4193: ['GB'], 4330: ['AE'], 4774: ['DK'], 24002: ['EG'], 24005: ['CN'], 24006: ['IN'], 24008: ['PE'],
    24010: ['BR'], 24011: ['IT'], 24024: ['KH'], 24025: ['MX'], 24028: ['JO'], 24041: ['US'], 24049: ['ZW'], 24050: ['ML'], 24052: ['GB'], 24053: ['AU'],
    24059: ['DE'], 24062: ['ES'], 24068: ['AU'], 24088: ['CL'], 24106: ['ID'], 24108: ['IR'], 24109: ['SY'], 24126: ['MM'], 24132: ['MA'], 24139: ['ET'],
    24140: ['TN'], 24232: ['CH'] };
function encPostTitle(q) {
    const ph = window.ENC_POST_PH?.[q.id];
    if (ph?.[4]) return ph[4];
    const m = q.q.match(/^Dans quel(?:le)? (?:pays|ville|région|île) (?:se trouve(?:nt)?|se dresse|s[’']élève|est situé[e]?)\s+(.+?)\s*\?$/i);
    if (m) { const t = m[1].split(/,\s/)[0]; return t.charAt(0).toUpperCase() + t.slice(1); }
    if (/^\d/.test(q.a[0])) return q.q.replace(/\s*\?$/, '');
    return q.a[0];
}
const encPostIsFact = q => !q.photo && !window.ENC_POST_PH?.[q.id] && (/^\d/.test(q.a[0]) || /^(En quelle|Combien|Qui |Quel (architecte|roi|empereur|pharaon|sculpteur|ingénieur|peintre|président)|Quelle (reine|hauteur|couleur))/i.test(q.q));
/** Photo d'une carte postale : celle de la question, sinon celle trouvée pour l'album (cartes-postales.js). */
const encPostPhoto = q => q.photo || window.ENC_POST_PH?.[q.id]?.[0] || null;
function encIsParis(q) {
    if (/Versailles|Trianon|Hameau de la Reine|Fontainebleau|Chantilly|Saint-Denis|Vaux/i.test(`${q.q} ${q.a[0]}`)) return false;
    return /Paris|parisien|Montmartre|Champs-Élysées|île de la Cité/i.test(`${q.q} ${q.a.join(' ')}`)
        || /tour Eiffel|Louvre|Arc de triomphe|Sacré-Cœur|Notre-Dame de Paris|Panthéon de Paris|Invalides|Concorde|Opéra Garnier|Moulin-Rouge|Centre Pompidou|Sainte-Chapelle/i.test(q.a[0])
        || /(^|[.,;] )(À|à) Paris\b|^Paris\b/.test(q.exp || '');
}
const ENC_POST_COVERS = { paris: [2300], fr: [2311, 2333, 2318, 2331] };   // couvertures qui « disent » l'album
const ENC_POST_ALBUMS = [['paris', '🗼', 'Paris'], ['fr', '🥖', 'France'], ['eu', '🏰', 'Europe'], ['as', '🐉', 'Asie'], ['am', '🗽', 'Amériques'], ['afoc', '🦁', 'Afrique et Océanie'], ['other', '📐', 'Le vocabulaire des monuments']];
function encPostAlbums() {
    const by = encByCountry('Monuments', ENC_POST_CC);
    const cont = window.WORLD_CONT || {};
    const albums = Object.fromEntries(ENC_POST_ALBUMS.map(([k]) => [k, []]));
    Object.entries(by).forEach(([cc, qs]) => qs.forEach(q => {
        const c = cont[cc];
        const k = cc === 'other' ? 'other' : cc === 'FR' ? (encIsParis(q) ? 'paris' : 'fr')
            : c === 'eu' ? 'eu' : c === 'as' ? 'as' : c === 'an' || c === 'sa' ? 'am' : 'afoc';
        albums[k].push({ q, cc });
    }));
    return albums;
}
const encPostSouvenir = q => q.photo ? null : /^Dans quel (pays|État) /i.test(q.q) && !/Dakota/i.test(q.a[0]) ? 'country' : /^Dans quel(?:le)? (ville|capitale|État)\b/i.test(q.q) ? 'city' : null;
/** Silhouette d'un pays (carte du monde), cadrée sur sa plus grande terre. */
function encCountrySil(cc) {
    const d = window.WORLD_MAP?.countries?.find(c => c[0] === cc)?.[1];
    if (!d) return null;
    let best = null;
    d.split('M').filter(Boolean).forEach(part => {
        const n = (part.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (let i = 0; i + 1 < n.length; i += 2) { x0 = Math.min(x0, n[i]); x1 = Math.max(x1, n[i]); y0 = Math.min(y0, n[i + 1]); y1 = Math.max(y1, n[i + 1]); }
        const a = (x1 - x0) * (y1 - y0);
        if (!best || a > best.a) best = { a, x0, y0, x1, y1 };
    });
    if (!best) return null;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    const w = best.x1 - best.x0, h = best.y1 - best.y0, pad = Math.max(w, h) * 0.08;
    svg.setAttribute('viewBox', `${best.x0 - pad} ${best.y0 - pad} ${w + 2 * pad} ${h + 2 * pad}`);
    svg.setAttribute('class', 'enc-post-sil');
    const p = document.createElementNS(ns, 'path');
    p.setAttribute('d', d);
    svg.append(p);
    return svg;
}
/** Une carte postale : photo (sue), souvenir d'un pays / d'une ville, carte écrite (date, mesure…), dessin 🏛️, ou le dos (à découvrir). */
function encPostCard(q, cc, known, ret) {
    const k = encKnown(q);
    const souv = k && encPostSouvenir(q);
    const ph = k && !souv ? encPostPhoto(q) : null;
    const b = el('button', `enc-post${k ? ' is-known' : ' is-back'}${ph ? ' has-photo' : ''}`);
    b.type = 'button';
    if (souv) {
        b.classList.add('is-souvenir', 'is-written', `is-${souv}`);
        b.style.setProperty('--h', String([...(q.a[0] + (cc || ''))].reduce((t, c) => (t * 31 + c.charCodeAt(0)) % 9973, 7) % 360));
        if (souv === 'country') {
            const sil = cc && encCountrySil(cc);
            if (sil) b.append(sil);
            else if (cc) { const f = el('img', 'enc-souv-flag'); f.src = `flags/${cc.toLowerCase()}.svg`; f.alt = ''; b.append(f); }
        } else b.append(el('span', 'enc-souv-sun'));
        const t1 = el('span', 'enc-souv-t');
        t1.textContent = souv === 'city' ? 'Bons baisers de…' : 'Souvenir de…';
        const t2 = el('b', 'enc-souv-n');
        t2.textContent = souv === 'city' ? q.a[0].replace(/^(L[ea] |L[’'])/, '') : q.a[0];
        b.append(t1, t2);
    } else if (ph) {
        const bg = el('img', 'enc-post-bg');
        bg.src = ph;
        bg.alt = '';
        bg.loading = 'lazy';
        const img = el('img', 'enc-post-ph');
        img.src = ph;
        img.alt = '';
        img.loading = 'lazy';
        img.draggable = false;
        b.append(bg, img);
    } else if (k && encPostIsFact(q)) {
        b.classList.add('is-written');
        const w = el('span', 'enc-post-txt');
        w.textContent = q.q;
        const ans = el('b', 'enc-post-ans');
        ans.textContent = q.a[0];
        b.append(w, ans);
    } else if (k) {
        const e = el('span', 'enc-post-emo');
        e.textContent = cc ? '🏛️' : '📐';
        b.append(e);
    } else {
        const e = el('span', 'enc-post-q');
        e.textContent = '?';
        b.append(e, el('span', 'enc-post-lines'));
    }
    if (cc && cc !== 'other') {
        const sp = el('span', 'enc-post-stamp');
        const fl = el('img');
        fl.src = `flags/${cc.toLowerCase()}.svg`;
        fl.alt = '';
        fl.loading = 'lazy';
        fl.onerror = () => sp.remove();
        sp.append(fl);
        b.append(sp);
    }
    if (k && !b.classList.contains('is-written')) {
        const c = el('span', 'enc-post-cap');
        c.textContent = encPostTitle(q);
        b.append(c);
    }
    if (k) b.addEventListener('click', () => openEncFiche(q, known, ret()));
    else b.addEventListener('click', encLockedTip);
    return b;
}
async function encPostLoad() {
    await encLoad('carte-monde.js');
    try { await encLoad('cartes-postales.js'); } catch (e) { /* sans les photos en plus */ }
}
/** 13/11 : l'album des cartes postales = 7 petits albums (Paris, France, Europe…) ; on en ouvre un. */
async function openEncPostcards() {
    try { await encPostLoad(); } catch (e) { showToast('📶 Indisponible hors connexion pour l’instant'); return; }
    const albums = encPostAlbums();
    const allQs = Object.values(albums).flat();
    const kn = allQs.filter(x => encKnown(x.q)).length;
    const h = el('h2', 'review-title enc-title is-sm');
    h.textContent = '💌 Mes cartes postales';
    const cnt = el('p', 'enc-chap-sub');
    cnt.textContent = `${kn} / ${allQs.length} cartes postales`;
    const grid = el('div', 'enc-album-grid');
    ENC_POST_ALBUMS.forEach(([key, emo, name]) => {
        const list = albums[key];
        if (!list.length) return;
        const k = list.filter(x => encKnown(x.q)).length;
        const b = el('button', `enc-album${k >= list.length ? ' is-full' : ''}${key === 'other' ? ' is-wide' : ''}`);
        b.type = 'button';
        const cover = el('span', 'enc-album-cover');
        const withPh = list.filter(x => encKnown(x.q) && encPostPhoto(x.q));
        const coverQ = (ENC_POST_COVERS[key] || []).map(id => withPh.find(x => x.q.id === id)).find(Boolean) || withPh.find(x => !encPostSouvenir(x.q)) || withPh[0];
        if (coverQ) {
            const src = encPostPhoto(coverQ.q);
            const bg = el('img', 'enc-post-bg');
            bg.src = src;
            bg.alt = '';
            bg.loading = 'lazy';
            const img = el('img', 'enc-album-ph');
            img.src = src;
            img.alt = '';
            img.loading = 'lazy';
            cover.append(bg, img);
        } else {
            const e = el('span', 'enc-album-emo');
            e.textContent = emo;
            cover.append(e);
        }
        const t = el('span', 'enc-album-t');
        const tb = el('b');
        tb.textContent = `${emo} ${name}`;
        const ts = el('small');
        ts.textContent = `${k} / ${list.length} cartes`;
        const bar = el('span', 'enc-ch-bar');
        const bi = el('i');
        bi.style.width = `${Math.round(k / list.length * 100)}%`;
        bar.append(bi);
        t.append(tb, ts, bar);
        b.append(cover, t);
        if (k >= list.length) b.append(encStamp('is-mini'));
        b.addEventListener('click', () => openEncPostAlbum(key));
        grid.append(b);
    });
    const page = encPage(encBackBtn('← Monuments', () => openEncBook('Monuments', true)), h, cnt, grid);
    page.classList.add('enc-postpage');
}
async function openEncPostAlbum(key, keepScroll = null) {
    try { await encPostLoad(); } catch (e) { showToast('📶 Indisponible hors connexion pour l’instant'); return; }
    const [, emo, name] = ENC_POST_ALBUMS.find(a => a[0] === key);
    const list = encPostAlbums()[key];
    const h = el('h2', 'review-title enc-title is-sm');
    h.textContent = `${emo} ${name}`;
    const cnt = el('p', 'enc-chap-sub');
    cnt.textContent = `${list.filter(x => encKnown(x.q)).length} / ${list.length} cartes postales`;
    let page = null;
    const ret = () => ({ label: `← ${name}`, fn: () => openEncPostAlbum(key, page ? page.scrollTop : 0) });
    const parts = [];
    const groups = {};
    list.forEach(x => (groups[x.cc] = groups[x.cc] || []).push(x));
    const ccs = Object.keys(groups).sort((a, b) => encCountryName(a).localeCompare(encCountryName(b), 'fr'));
    ccs.forEach(cc => {
        const g = groups[cc].slice().sort((a, b) => encKnown(b.q) - encKnown(a.q));
        const known = g.map(x => x.q).filter(encKnown);
        if (ccs.length > 1) {
            const t = el('p', 'enc-wall-h');
            t.textContent = `${encCountryName(cc)} · ${known.length} / ${g.length}`;
            parts.push(t);
        }
        const grid = el('div', 'enc-post-grid');
        g.forEach(x => grid.append(encPostCard(x.q, x.cc, known, ret)));
        parts.push(grid);
    });
    page = encPage(encBackBtn('← Mes cartes postales', () => openEncPostcards()), h, cnt, ...parts);
    page.classList.add('enc-postpage');
    if (keepScroll) requestAnimationFrame(() => { page.scrollTop = keepScroll; });
}
/* 13/11 : « 📚 Ma bibliothèque » (Littérature). Une tranche par œuvre (plusieurs questions possibles), rangée sur son étagère ;
   livre su = en couleur avec son titre, pas encore su = tranche grise « ? ». Tap = ses questions en bas. */
const ENC_LIB_COLORS = ['#8b2e2e', '#1f4e79', '#2f6b3a', '#6b3f8f', '#9a5b13', '#245e66', '#7a2948', '#3b4a6b', '#5c6b1f', '#a23b1f', '#2d5a8c', '#6e4b2a'];
function encLibHash(s) { let h = 7; for (const c of s) h = (h * 31 + c.codePointAt(0)) >>> 0; return h; }
async function openEncLibrary(keepKey = null) {
    try { await encLoad('bibliotheque.js'); } catch (e) { showToast('📶 Indisponible hors connexion pour l’instant'); return; }
    const B = window.ENC_BOOKS || {};
    const all = encChapters('Littérature').flatMap(c => c.qs);
    const books = {};   // clé = étagère + titre
    const rest = [];
    all.forEach(q => {
        const b = B[q.id];
        if (!b) { rest.push(q); return; }
        const key = `${b[2]}|${b[0]}`;
        (books[key] = books[key] || { key, title: b[0], author: b[1], shelf: b[2], qs: [] }).qs.push(q);
    });
    Object.values(books).forEach(b => { b.k = b.qs.filter(encKnown).length; });
    const list = Object.values(books);
    const found = list.filter(b => b.k).length;
    const page = el('div', 'enc-full enc-godpage enc-libpage');
    const h = el('h2', 'review-title enc-title is-sm');
    h.textContent = '📚 Ma bibliothèque';
    const cnt = el('p', 'enc-chap-sub');
    cnt.textContent = `${found} / ${list.length} livres découverts`;
    const scroller = el('div', 'enc-god-scroll enc-lib-wall');
    const panel = el('div', 'enc-map-panel enc-god-panel');
    const btns = {};
    let sel = null, before = 0;
    const clear = () => {
        if (!sel) return;
        btns[sel]?.classList.remove('is-sel');
        sel = null;
        panel.replaceChildren();
        page.classList.remove('has-sel');
        const top = before;
        requestAnimationFrame(() => { scroller.scrollTop = top; });
    };
    const show = key => {
        if (sel === key) { clear(); return; }
        if (!sel) before = scroller.scrollTop;
        btns[sel]?.classList.remove('is-sel');
        sel = key;
        btns[key]?.classList.add('is-sel');
        const b = key === 'rest' ? { title: 'Le reste', author: '', qs: rest, k: rest.filter(encKnown).length } : books[key];
        panel.replaceChildren();
        const card = el('div', 'enc-cpanel');
        const hd = el('div', 'enc-map-head');
        const nm = el('b');
        nm.textContent = key === 'rest' ? '📜 Le reste de la bibliothèque' : b.k ? `📖 ${b.title}` : '❓ Livre à découvrir';
        const ct = el('span');
        ct.textContent = `· ${b.k} / ${b.qs.length} ${b.qs.length > 1 ? 'questions sues' : 'question sue'}`;
        hd.append(nm, ct);
        encPanelX(hd, clear);
        card.append(hd);
        if (b.k && b.author) { const d = el('p', 'enc-god-desc'); d.textContent = `de ${b.author}`; card.append(d); }
        if (key === 'rest') { const d = el('p', 'enc-god-desc'); d.textContent = 'Les questions sans livre précis : prix, vocabulaire, auteurs…'; card.append(d); }
        encQRows(card, b.qs, { label: '← Ma bibliothèque', fn: () => openEncLibrary(key) }, q => [q.q.replace(/\s*\?$/, ''), q.a[0]]);
        panel.append(card);
        panel.scrollTop = 0;
        page.classList.add('has-sel');
        requestAnimationFrame(() => btns[key]?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }));
    };
    (window.ENC_SHELVES || []).forEach(([sk, emo, name]) => {
        // les livres sus d'abord (rangés par auteur), puis les tranches « ? » à découvrir
        const bs = list.filter(b => b.shelf === sk).sort((a, c) => (c.k > 0) - (a.k > 0) || (a.author || a.title).localeCompare(c.author || c.title, 'fr') || a.title.localeCompare(c.title, 'fr'));
        if (!bs.length) return;
        const t = el('p', 'enc-wall-h enc-lib-h');
        const tn = el('span');
        tn.textContent = `${emo} ${name}`;
        const tc = el('b');
        tc.textContent = `${bs.filter(b => b.k).length} / ${bs.length}`;
        t.append(tn, tc);
        const row = el('div', 'enc-lib-shelf');
        bs.forEach(b => {
            const hs = encLibHash(b.title);
            const known = b.k > 0;
            const bt = el('button', `enc-lib-book${known ? ' is-known' : ''}${known && b.k >= b.qs.length ? ' is-full' : ''}`);
            bt.type = 'button';
            bt.style.height = `${108 + hs % 46}px`;
            bt.style.width = `${28 + (hs >>> 5) % 9}px`;
            if (known) bt.style.setProperty('--bk', ENC_LIB_COLORS[(hs >>> 3) % ENC_LIB_COLORS.length]);
            const sp = el('span', `enc-lib-title${known && b.title.length > 18 ? ' is-long' : ''}`);
            sp.textContent = known ? b.title : '?';
            bt.append(sp);
            if (b.qs.length > 1) { const n = el('i', 'enc-lib-n'); n.textContent = b.qs.length; bt.append(n); }
            bt.addEventListener('click', () => show(b.key));
            btns[b.key] = bt;
            row.append(bt);
        });
        scroller.append(t, row);
    });
    if (rest.length) {
        const rb = el('button', 'enc-flag-other enc-lib-rest');
        rb.type = 'button';
        rb.textContent = `📜 Le reste : prix, vocabulaire, auteurs… · ${rest.filter(encKnown).length} / ${rest.length} ›`;
        rb.addEventListener('click', () => show('rest'));
        btns.rest = rb;
        scroller.append(rb);
    }
    encTapOff(scroller, '.enc-lib-book, .enc-lib-rest', clear);
    page.append(h, cnt, scroller, panel);
    $('friendBody').replaceChildren(encBackBtn('← Littérature', () => openEncBook('Littérature', true)), page);
    $('friendModal').hidden = false;
    if (keepKey && (books[keepKey] || keepKey === 'rest')) show(keepKey);
}

/* 13/11 : écran commun « des objets rangés sur des rayons qui défilent de côté » (vinyles, salle d'arcade).
   Un objet = plusieurs questions possibles ; su = dessiné en couleur avec son nom, pas su = gris « ? ». Tap = ses questions en bas. */
const ENC_OBJ_COLORS = ['#e5484d', '#3d8bff', '#12b3a8', '#f3b400', '#8e4ec6', '#ea580c', '#2f9e44', '#db2777', '#1e3a8a', '#0891b2', '#a16207', '#4b5563'];
function encObjHash(s) { let h = 7; for (const c of s) h = (h * 31 + c.codePointAt(0)) >>> 0; return h; }
function encObjScreen(o) {
    const items = {};
    const rest = [];
    encChapters(o.theme).flatMap(c => c.qs).forEach(q => {
        const d = o.data[q.id];
        if (!d) { rest.push(q); return; }
        const [label, sub, row] = o.read(d);
        const key = `${row}|${label}`;
        const it = items[key] = items[key] || { key, label, sub: '', row, qs: [] };
        if (!it.sub && sub) it.sub = sub;
        it.qs.push(q);
    });
    const list = Object.values(items);
    list.forEach(it => { it.k = it.qs.filter(encKnown).length; it.h = encObjHash(it.label); });
    const page = el('div', `enc-full enc-godpage enc-objpage ${o.cls}`);
    const h = el('h2', 'review-title enc-title is-sm');
    h.textContent = o.title;
    const cnt = el('p', 'enc-chap-sub');
    cnt.textContent = `${list.filter(it => it.k).length} / ${list.length} ${o.countWord}`;
    const scroller = el('div', `enc-god-scroll enc-obj-wall ${o.cls}-wall`);
    const panel = el('div', 'enc-map-panel enc-god-panel');
    const btns = {};
    let sel = null, before = 0;
    const clear = () => {
        if (!sel) return;
        btns[sel]?.classList.remove('is-sel');
        sel = null;
        panel.replaceChildren();
        page.classList.remove('has-sel');
        const top = before;
        requestAnimationFrame(() => { scroller.scrollTop = top; });
    };
    const show = key => {
        if (sel === key) { clear(); return; }
        if (!sel) before = scroller.scrollTop;
        btns[sel]?.classList.remove('is-sel');
        sel = key;
        btns[key]?.classList.add('is-sel');
        const it = key === 'rest' ? { label: o.restTitle, sub: '', qs: rest, k: rest.filter(encKnown).length } : items[key];
        panel.replaceChildren();
        const card = el('div', 'enc-cpanel');
        const hd = el('div', 'enc-map-head');
        const nm = el('b');
        nm.textContent = key === 'rest' ? o.restTitle : it.k ? `${o.emo} ${it.label}` : `❓ ${o.unknown}`;
        const ct = el('span');
        ct.textContent = `· ${it.k} / ${it.qs.length} ${it.qs.length > 1 ? 'questions sues' : 'question sue'}`;
        hd.append(nm, ct);
        encPanelX(hd, clear);
        card.append(hd);
        const desc = key === 'rest' ? o.restDesc : it.k && it.sub ? o.subText(it.sub) : '';
        if (desc) { const d = el('p', 'enc-god-desc'); d.textContent = desc; card.append(d); }
        encQRows(card, it.qs, { label: o.back, fn: () => o.reopen(key) }, q => [q.q.replace(/\s*\?$/, ''), q.a[0]]);
        panel.append(card);
        panel.scrollTop = 0;
        page.classList.add('has-sel');
        requestAnimationFrame(() => btns[key]?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }));
    };
    o.rows.forEach(([rk, emo, name]) => {
        const its = list.filter(it => it.row === rk).sort((a, b) => (b.k > 0) - (a.k > 0) || a.label.localeCompare(b.label, 'fr'));
        if (!its.length) return;
        const t = el('p', 'enc-wall-h enc-obj-h');
        const tn = el('span');
        tn.textContent = `${emo} ${name}`;
        const tc = el('b');
        tc.textContent = `${its.filter(it => it.k).length} / ${its.length}`;
        t.append(tn, tc);
        const row = el('div', `enc-obj-row ${o.cls}-row is-${rk}`);
        its.forEach(it => {
            const b = o.make(it, it.k > 0, rk);
            b.type = 'button';
            b.classList.add('enc-obj');
            if (!it.k) b.classList.add('is-off');
            if (it.qs.length > 1) { const n = el('i', 'enc-obj-n'); n.textContent = it.qs.length; b.append(n); }
            b.addEventListener('click', () => show(it.key));
            btns[it.key] = b;
            row.append(b);
        });
        scroller.append(t, row);
    });
    if (rest.length) {
        const rb = el('button', 'enc-flag-other enc-obj-rest');
        rb.type = 'button';
        rb.textContent = `${o.restTitle} · ${rest.filter(encKnown).length} / ${rest.length} ›`;
        rb.addEventListener('click', () => show('rest'));
        btns.rest = rb;
        scroller.append(rb);
    }
    encTapOff(scroller, '.enc-obj, .enc-obj-rest', clear);
    page.append(h, cnt, scroller, panel);
    $('friendBody').replaceChildren(encBackBtn(`← ${o.theme}`, () => openEncBook(o.theme, true)), page);
    $('friendModal').hidden = false;
    if (o.keep && (items[o.keep] || o.keep === 'rest')) show(o.keep);
}

/* « 💿 Mes vinyles » (Musique) : un vinyle par artiste, rangé dans le bac de son genre ; pochette dessinée (aucune vraie image). */
/** 13/11 : duos de couleurs choisis pour aller ensemble ; motif et duo suivent la place dans le bac (deux voisins ne se ressemblent jamais). */
const ENC_VIN_DUOS = [['#e63946', '#f1faee'], ['#1d3557', '#a8dadc'], ['#f4a261', '#264653'], ['#2a9d8f', '#e9c46a'], ['#6d28d9', '#f472b6'], ['#0f172a', '#facc15'],
    ['#ef476f', '#ffd166'], ['#118ab2', '#06d6a0'], ['#3a0ca3', '#4cc9f0'], ['#ff7b00', '#ffd000'], ['#14532d', '#86efac'], ['#7f1d1d', '#fca5a5'],
    ['#334155', '#f97316'], ['#be185d', '#fde68a'], ['#0e7490', '#fef3c7'], ['#111827', '#e5e7eb']];
async function openEncVinyls(keep = null) {
    try { await encLoad('vinyles.js'); } catch (e) { showToast('📶 Indisponible hors connexion pour l’instant'); return; }
    const vinPos = {}, crates = (window.ENC_VINYL_CRATES || []).map(c => c[0]);
    encObjScreen({
        theme: 'Musique', cls: 'enc-vinpage', title: '💿 Mes vinyles', countWord: 'vinyles découverts', emo: '💿', unknown: 'Vinyle à découvrir',
        data: window.ENC_VINYLS || {}, read: d => [d[0], d[1], d[2]], rows: window.ENC_VINYL_CRATES || [],
        restTitle: '🎼 Instruments, solfège et le reste', restDesc: 'Les questions sans disque : instruments, solfège, festivals, salles de concert…',
        subText: s => s === 'Compilation' || s === 'Comédie musicale' ? s : `« ${s} »`,
        back: '← Mes vinyles', reopen: k => openEncVinyls(k), keep,
        make: (it, known, row) => {
            const b = el('button', 'enc-vin');
            const disc = el('span', 'enc-vin-disc');
            const i = vinPos[row] = (vinPos[row] ?? -1) + 1, ci = Math.max(0, crates.indexOf(row));
            const [c1, c2] = ENC_VIN_DUOS[(i * 7 + ci * 3) % ENC_VIN_DUOS.length];
            disc.style.setProperty('--lab', known ? c2 : '#9a948b');
            const sl = el('span', `enc-vin-sleeve is-p${(i + ci) % 10}`);
            if (known) { sl.style.setProperty('--c1', c1); sl.style.setProperty('--c2', c2); }
            const art = el('b', 'enc-vin-art');
            art.textContent = known ? it.label : '?';
            sl.append(art);
            if (known && it.sub) { const tt = el('small', 'enc-vin-tt'); tt.textContent = it.sub; sl.append(tt); }
            b.append(disc, sl);
            return b;
        }
    });
}

/* « 🕹️ Ma salle d'arcade » (Jeux) : cartouches, bornes, consoles, boîtes de jeu, plateaux et jouets dessinés (aucune vraie image).
   Utilise encObjScreen / ENC_OBJ_COLORS (enc_vinyles.js), à insérer avant. */
async function openEncArcade(keep = null) {
    try { await encLoad('arcade.js'); } catch (e) { showToast('📶 Indisponible hors connexion pour l’instant'); return; }
    encObjScreen({
        theme: 'Jeux', cls: 'enc-arcpage', title: '🕹️ Ma salle d’arcade', countWord: 'jeux découverts', emo: '🎮', unknown: 'Jeu à découvrir',
        data: window.ENC_ARC || {}, read: d => [d[0], '', d[1]], rows: window.ENC_ARC_ROWS || [],
        restTitle: '💬 Le jargon des joueurs et le reste', restDesc: 'Les questions sans objet précis : vocabulaire des joueurs, éditeurs, e-sport…',
        subText: () => '', back: '← Ma salle d’arcade', reopen: k => openEncArcade(k), keep,
        make: (it, known, row) => {
            const kind = { ni: 'cart', jv: 'cab', co: 'cons', so: 'box', ec: 'board', jo: 'toy' }[row] || 'box';
            const b = el('button', `enc-arc is-${kind}`);
            b.style.setProperty('--c1', known ? ENC_OBJ_COLORS[it.h % ENC_OBJ_COLORS.length] : '#a8a29a');
            b.style.setProperty('--c2', known ? ENC_OBJ_COLORS[(it.h >>> 4) % ENC_OBJ_COLORS.length] : '#8d877f');
            const nm = el('span', 'enc-arc-name');
            nm.textContent = known ? it.label : '?';
            if (kind === 'cab') {   // borne : fronton avec le nom, écran allumé, tableau de commande
                const top = el('span', 'enc-arc-marquee');
                top.append(nm);
                const scr = el('span', 'enc-arc-screen');
                const px = el('i');
                scr.append(px);
                const pan = el('span', 'enc-arc-panel');
                pan.append(el('i', 'enc-arc-stick'), el('i', 'enc-arc-btn'), el('i', 'enc-arc-btn'));
                b.append(top, scr, pan);
            } else if (kind === 'cons') {   // console : écran-étiquette, croix et deux boutons
                const lab = el('span', 'enc-arc-lab');
                lab.append(nm);
                const pad = el('span', 'enc-arc-pad');
                pad.append(el('i', 'enc-arc-cross'), el('i', 'enc-arc-ab'));
                b.append(lab, pad);
            } else if (kind === 'cart') {   // cartouche : stries en haut, étiquette en couleur
                b.append(el('span', 'enc-arc-ridges'));
                const lab = el('span', 'enc-arc-lab');
                lab.append(nm);
                b.append(lab);
            } else {   // boîte de jeu, plateau ou jouet : le nom sur un bandeau
                const lab = el('span', 'enc-arc-lab');
                lab.append(nm);
                b.append(lab);
            }
            return b;
        }
    });
}

/* 13/11 : « 🏆 Ma salle des trophées » (Sport). Une vitrine par chapitre ; chaque question sue = une médaille gravée.
   Bronze = 1 bonne réponse, argent = 2, or = 3 ou plus. Une médaille qui a monté depuis la dernière visite brille (souvenir sur l'appareil). */
const ENC_TRO_TIERS = [null, ['bronze', '🥉', 'Bronze'], ['silver', '🥈', 'Argent'], ['gold', '🥇', 'Or']];
const encTroTier = q => { const r = state.data.stats[q.id]?.right || 0; return r >= 3 ? 3 : r; };
function encTroSeen(write = null) {   // dernières médailles vues (pour faire briller celles qui montent)
    try {
        if (write) { localStorage.setItem('kultivo_trophies', JSON.stringify(write)); return write; }
        return JSON.parse(localStorage.getItem('kultivo_trophies') || 'null');
    } catch (e) { return null; }
}
function encTroCounts(qs) {
    const c = [0, 0, 0, 0];
    qs.forEach(q => { c[encTroTier(q)]++; });
    return c;
}
/** Une médaille dessinée (ruban + disque) ; tier 0 = socle vide. */
function encTroMedal(tier, emo) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 60 70');
    svg.setAttribute('class', 'enc-tro-svg');
    if (!tier) {
        svg.innerHTML = '<circle cx="30" cy="40" r="19" class="enc-tro-empty"/><text x="30" y="47" text-anchor="middle" class="enc-tro-q">?</text>';
        return svg;
    }
    const col = { 1: ['#f0b27a', '#b4692e', '#7a4317'], 2: ['#f4f6f8', '#b9c1c9', '#7d8791'], 3: ['#ffe58a', '#f3b400', '#a67400'] }[tier];
    const id = `trog${tier}`;
    svg.innerHTML = `<defs><radialGradient id="${id}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="${col[0]}"/><stop offset="0.6" stop-color="${col[1]}"/><stop offset="1" stop-color="${col[2]}"/></radialGradient></defs>
      <path d="M17 0 L27 24 L33 24 L23 0 Z" fill="#2563eb"/><path d="M43 0 L33 24 L27 24 L37 0 Z" fill="#e5484d"/>
      <circle cx="30" cy="42" r="19" fill="url(#${id})" stroke="${col[2]}" stroke-width="1.5"/>
      <circle cx="30" cy="42" r="14" fill="none" stroke="${col[0]}" stroke-width="1" opacity="0.8"/>
      <text x="30" y="48.5" text-anchor="middle" font-size="16">${emo}</text>`;
    return svg;
}
async function openEncTrophies() {
    try { await encLoad('trophees.js'); } catch (e) { showToast('📶 Indisponible hors connexion pour l’instant'); return; }
    const chs = encChapters('Sport').filter(c => c.qs.length);
    const all = chs.flatMap(c => c.qs);
    const tot = encTroCounts(all);
    const h = el('h2', 'review-title enc-title is-sm');
    h.textContent = '🏆 Ma salle des trophées';
    const sub = el('p', 'enc-chap-sub');
    sub.textContent = `${fmtNum(all.length - tot[0])} / ${fmtNum(all.length)} médailles gagnées`;
    // podium : argent · or · bronze
    const pod = el('div', 'enc-tro-podium');
    [[2, 'is-2'], [3, 'is-3'], [1, 'is-1']].forEach(([t, cls]) => {
        const col = el('div', `enc-tro-step ${cls}`);
        const m = el('span', 'enc-tro-pm');
        m.append(encTroMedal(t, ''));
        const n = el('b');
        n.textContent = fmtNum(tot[t]);
        const l = el('small');
        l.textContent = ENC_TRO_TIERS[t][2];
        const st = el('span', 'enc-tro-block');
        st.append(n, l);
        col.append(m, st);
        pod.append(col);
    });
    const rule = el('p', 'enc-tro-rule');
    rule.textContent = 'Bonnes réponses : 1 = 🥉 · 2 = 🥈 · 3 = 🥇';
    const grid = el('div', 'enc-tro-cases');
    chs.forEach(c => {
        const k = encTroCounts(c.qs);
        const won = c.qs.length - k[0];
        const b = el('button', `enc-tro-case${won >= c.qs.length ? ' is-full' : ''}`);
        b.type = 'button';
        const e = el('span', 'enc-tro-case-e');
        e.textContent = c.emo;
        const t = el('span', 'enc-tro-case-t');
        const tb = el('b');
        tb.textContent = c.name;
        const ts = el('small');
        ts.textContent = `🥇 ${k[3]} · 🥈 ${k[2]} · 🥉 ${k[1]}`;
        const bar = el('span', 'enc-ch-bar');
        const bi = el('i');
        bi.style.width = `${Math.round(won / c.qs.length * 100)}%`;
        bar.append(bi);
        const n = el('span', 'enc-tro-case-n');
        n.textContent = `${won} / ${c.qs.length}`;
        t.append(tb, ts, bar);
        b.append(e, t, n);
        b.addEventListener('click', () => openEncTrophyCase(c.i));
        grid.append(b);
    });
    const page = encPage(encBackBtn('← Sport', () => openEncBook('Sport', true)), h, sub, pod, rule, grid);
    page.classList.add('enc-tropage');
}
/** Une vitrine : les médailles d'un chapitre (« Autres sports » découpé en petites vitrines). */
async function openEncTrophyCase(ci, keepScroll = null) {
    try { await encLoad('trophees.js'); } catch (e) { showToast('📶 Indisponible hors connexion pour l’instant'); return; }
    const c = encChapters('Sport')[ci];
    if (!c) return;
    const k = encTroCounts(c.qs);
    const h = el('h2', 'review-title enc-title is-sm');
    h.textContent = `${c.emo} ${c.name}`;
    const sub = el('p', 'enc-chap-sub');
    sub.textContent = `🥇 ${k[3]} · 🥈 ${k[2]} · 🥉 ${k[1]} · ${c.qs.length - k[0]} / ${c.qs.length} médailles`;
    const seen = encTroSeen();
    const next = Object.assign({}, seen || {});
    let page = null;
    const ret = { label: `← ${c.name}`, fn: () => openEncTrophyCase(ci, page ? page.scrollTop : 0) };
    const groups = [];
    const G = window.ENC_TRO_GROUPS || [];
    const sub2 = window.ENC_TRO_SUB || {};
    if (c.qs.some(q => sub2[q.id] !== undefined)) {
        G.forEach(([emo, name], gi) => { const qs = c.qs.filter(q => sub2[q.id] === gi); if (qs.length) groups.push([`${emo} ${name}`, qs, emo]); });
        const rest = c.qs.filter(q => sub2[q.id] === undefined);
        if (rest.length) groups.push(['🏋️ Divers', rest, '🏋️']);
    } else groups.push([null, c.qs, c.emo]);
    const parts = [];
    groups.forEach(([label, qs, gEmo]) => {
        const sorted = qs.slice().sort((a, b) => encTroTier(b) - encTroTier(a));
        const known = sorted.filter(encKnown);
        if (label) {
            const t = el('p', 'enc-wall-h');
            t.textContent = `${label} · ${known.length} / ${qs.length}`;
            parts.push(t);
        }
        const cab = el('div', 'enc-tro-cab');
        sorted.forEach(q => {
            const tier = encTroTier(q);
            const up = seen && tier > (seen[q.id] || 0);
            if (tier) next[q.id] = tier;
            const b = el('button', `enc-tro-item${tier ? ` is-${ENC_TRO_TIERS[tier][0]}` : ' is-empty'}${up ? ' is-up' : ''}`);
            b.type = 'button';
            b.append(encTroMedal(tier, gEmo));
            const pl = el('span', 'enc-tro-plate');
            pl.textContent = tier ? q.a[0] : '???';
            b.append(pl);
            if (up) { const s = el('span', 'enc-tro-new'); s.textContent = (seen[q.id] || 0) ? '⬆ monte !' : 'nouvelle !'; b.append(s); }
            if (tier) b.addEventListener('click', () => openEncFiche(q, known, ret));
            else b.addEventListener('click', encLockedTip);
            cab.append(b);
        });
        parts.push(cab);
    });
    encTroSeen(next);
    page = encPage(encBackBtn('← Mes trophées', () => openEncTrophies()), h, sub, ...parts);
    page.classList.add('enc-tropage');
    if (keepScroll) requestAnimationFrame(() => { page.scrollTop = keepScroll; });
}

/* 13/11 : « ⚙️ La frise des inventions » (Technologie) : même frise que l'Histoire, avec les grandes époques de la technique. */
const ENC_TECH_ERAS = [[-1e9, '🧮', 'Avant l’imprimerie'], [1450, '📜', 'Imprimerie et savants'], [1769, '🚂', 'Révolution industrielle'],
    [1879, '💡', 'Électricité et moteurs'], [1940, '📺', 'L’âge électronique'], [1975, '💻', 'Ordinateurs personnels'],
    [1991, '🌐', 'Internet'], [2007, '📱', 'Smartphones'], [2020, '🤖', 'Intelligence artificielle']];
const encTechYear = q => { const v = window.ENC_TECH_YEARS?.[q.id]; return v === undefined ? null : Array.isArray(v) ? { y: v[0], approx: true } : { y: v, approx: false }; };
const encTechEra = y => { let e = 0; ENC_TECH_ERAS.forEach((x, j) => { if (y >= x[0]) e = j; }); return e; };
async function openEncTechFrise(keep = false) {
    try { await encLoad('frise-techno.js'); } catch (e) { showToast('📶 Frise indisponible hors connexion pour l’instant'); return; }
    const qsAll = encChapters('Technologie').flatMap(c => c.qs);
    const all = qsAll.map(q => ({ q, t: encTechYear(q) })).filter(x => x.t).sort((a, b) => a.t.y - b.t.y);
    const undated = qsAll.filter(q => !encTechYear(q));
    const known = all.filter(x => encKnown(x.q));
    const h = el('h2', 'review-title enc-title is-sm');
    h.textContent = '⚙️ La frise des inventions';
    const sub = el('p', 'enc-chap-sub');
    sub.textContent = `${fmtNum(known.length)} placée${known.length > 1 ? 's' : ''} · ${fmtNum(all.length - known.length)} à découvrir`;
    const chips = el('div', 'enc-tl-eras');
    const tl = el('div', 'enc-tl enc-tf');
    tl.style.setProperty('--c', ENC_COLORS['Technologie']);
    const eraNodes = {};
    const list = known.map(x => x.q);
    let mc = null;
    const ret = { label: '← La frise des inventions', fn: () => openEncTechFrise(true) };
    let era = -1, hole = null;
    all.forEach(({ q, t }) => {
        const e = encTechEra(t.y);
        if (e !== era) {
            era = e;
            hole = null;
            const lab = el('div', 'enc-tl-era');
            lab.textContent = `${ENC_TECH_ERAS[e][1]} ${ENC_TECH_ERAS[e][2]}`;
            tl.append(lab);
            eraNodes[e] = lab;
        }
        if (!encKnown(q)) {   // à découvrir : les cases qui se suivent sont regroupées
            if (hole) { hole.n++; hole.txt.textContent = `❓ ${hole.n} inventions à découvrir`; return; }
            const row = el('button', 'enc-tl-ev is-lock');
            row.type = 'button';
            const txt = el('span', 'enc-tl-box');
            txt.textContent = '❓ 1 invention à découvrir';
            row.append(encYearLabel(t.y, t.approx), el('i', 'enc-tl-dot'), txt);
            row.addEventListener('click', encLockedTip);
            hole = { n: 1, txt };
            tl.append(row);
            return;
        }
        hole = null;
        const row = el('button', 'enc-tl-ev');
        row.type = 'button';
        const box = el('span', 'enc-tl-box');
        const b = el('b');
        b.textContent = q.a[0];
        const s = el('small');
        s.textContent = q.q;
        box.append(b, s);
        row.append(encYearLabel(t.y, t.approx), el('i', 'enc-tl-dot'), box);
        row.addEventListener('click', () => { encState.techFriseScroll = mc.scrollTop; openEncFiche(q, list, ret); });
        tl.append(row);
    });
    // les questions sans date (vocabulaire, objets de tous les jours…) : à part, sous la frise
    const offT = el('p', 'enc-wall-h enc-tf-off');
    const offKnown = undated.filter(encKnown);
    offT.textContent = `🗂️ Hors frise (sans date précise) · ${offKnown.length} / ${undated.length}`;
    const off = el('div', 'enc-tf-offlist');
    offKnown.forEach(q => {
        const r = encRow(q, offKnown, { label: '← La frise des inventions', fn: () => openEncTechFrise(true) });
        r.addEventListener('click', () => { encState.techFriseScroll = mc.scrollTop; }, true);
        off.append(r);
    });
    if (undated.length > offKnown.length) {
        const lk = el('button', 'enc-crow is-lock');
        lk.type = 'button';
        const l = el('span');
        const m = undated.length - offKnown.length;
        l.textContent = `❓ ${m} question${m > 1 ? 's' : ''} à découvrir`;
        lk.append(l);
        lk.addEventListener('click', encLockedTip);
        off.append(lk);
    }
    ENC_TECH_ERAS.forEach(([, emo, name], e) => {
        if (!eraNodes[e]) return;
        const c = el('button', 'enc-tl-chip');
        c.type = 'button';
        c.textContent = `${emo} ${name}`;
        c.addEventListener('click', () => { mc.scrollTo({ top: mc.scrollTop + eraNodes[e].getBoundingClientRect().top - chips.getBoundingClientRect().bottom - 8, behavior: 'smooth' }); });
        chips.append(c);
    });
    const offChip = el('button', 'enc-tl-chip');
    offChip.type = 'button';
    offChip.textContent = '🗂️ Hors frise';
    offChip.addEventListener('click', () => { mc.scrollTo({ top: mc.scrollTop + offT.getBoundingClientRect().top - chips.getBoundingClientRect().bottom - 8, behavior: 'smooth' }); });
    chips.append(offChip);
    mc = encPage(encBackBtn('← Technologie', () => openEncBook('Technologie', true)), tl, offT, off);
    const fixed = el('div', 'enc-tl-head');   // titre + époques restent en haut, seule la frise défile
    fixed.style.setProperty('--c', ENC_COLORS['Technologie']);
    fixed.append(h, sub, chips);
    mc.before(fixed);
    const chipEls = [...chips.children];
    const eraIdx = Object.keys(eraNodes).map(Number);
    const onScroll = () => {
        if (!chips.isConnected) { mc.removeEventListener('scroll', onScroll); return; }
        const lim = chips.getBoundingClientRect().bottom + 12;
        let cur = 0;
        eraIdx.forEach((e, j) => { if (eraNodes[e].getBoundingClientRect().top <= lim) cur = j; });
        if (offT.getBoundingClientRect().top <= lim) cur = chipEls.length - 1;
        chipEls.forEach((c, j) => {
            const on = j === cur;
            if (on && !c.classList.contains('is-on')) chips.scrollTo({ left: c.offsetLeft - 8, behavior: 'smooth' });
            c.classList.toggle('is-on', on);
        });
    };
    mc.addEventListener('scroll', onScroll, { passive: true });
    requestAnimationFrame(onScroll);
    mc.scrollTop = keep ? encState.techFriseScroll || 0 : 0;
}

/* 13/11 : écran commun « une rangée par salle, qui défile de côté » (musée des Arts, affiches du Cinéma).
   o = { cls, title, unit, back, theme, rows: [[clé, emoji, nom, objets]], rest, restLabel, restName, restDesc, retLabel, reopen(clé),
         unknown, head(objet) -> titre, desc(objet) -> texte, label(q) -> [question, réponse], make(objet, su) -> contenu du bouton, itemCls(objet) } */
function encHash(s) { let h = 7; for (const c of String(s)) h = (h * 31 + c.codePointAt(0)) >>> 0; return h; }
function encRowsScreen(o, keepKey = null) {
    const items = o.rows.flatMap(r => r[3]);
    items.forEach(it => { it.k = it.qs.filter(encKnown).length; });
    const byKey = Object.fromEntries(items.map(it => [it.key, it]));
    const found = items.filter(it => it.k).length;
    const page = el('div', `enc-full enc-godpage enc-rowspage ${o.cls}`);
    const h = el('h2', 'review-title enc-title is-sm');
    h.textContent = o.title;
    const cnt = el('p', 'enc-chap-sub');
    cnt.textContent = `${found} / ${items.length} ${o.unit}`;
    const scroller = el('div', 'enc-god-scroll enc-rows-wall');
    const panel = el('div', 'enc-map-panel enc-god-panel');
    const btns = {};
    let sel = null, before = 0;
    const clear = () => {
        if (!sel) return;
        btns[sel]?.classList.remove('is-sel');
        sel = null;
        panel.replaceChildren();
        page.classList.remove('has-sel');
        const top = before;
        requestAnimationFrame(() => { scroller.scrollTop = top; });
    };
    const rest = o.rest || [];
    const show = (key, instant = false) => {
        if (sel === key) { clear(); return; }
        if (!sel) before = scroller.scrollTop;
        btns[sel]?.classList.remove('is-sel');
        sel = key;
        btns[key]?.classList.add('is-sel');
        const it = key === 'rest' ? { qs: rest, k: rest.filter(encKnown).length } : byKey[key];
        panel.replaceChildren();
        const card = el('div', 'enc-cpanel');
        const hd = el('div', 'enc-map-head');
        const nm = el('b');
        nm.textContent = key === 'rest' ? o.restName : it.k ? o.head(it) : `❓ ${typeof o.unknown === 'function' ? o.unknown(it) : o.unknown}`;
        const ct = el('span');
        ct.textContent = `· ${it.k} / ${it.qs.length} ${it.qs.length > 1 ? 'questions sues' : 'question sue'}`;
        hd.append(nm, ct);
        encPanelX(hd, clear);
        card.append(hd);
        const dtxt = key === 'rest' ? o.restDesc : it.k ? o.desc?.(it) : '';
        if (dtxt) { const d = el('p', 'enc-god-desc'); d.textContent = dtxt; card.append(d); }
        encQRows(card, it.qs, { label: o.retLabel, fn: () => o.reopen(key) }, o.label || (q => [q.q.replace(/\s*\?$/, ''), q.a[0]]));
        panel.append(card);
        panel.scrollTop = 0;
        page.classList.add('has-sel');
        requestAnimationFrame(() => btns[key]?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: instant ? 'auto' : 'smooth' }));
    };
    o.rows.forEach(([rk, emo, name, list]) => {
        if (!list.length) return;
        // ce qu'on sait d'abord (par ordre alphabétique), puis les « ? » à découvrir
        const sorted = list.slice().sort((a, b) => (b.k > 0) - (a.k > 0) || a.title.localeCompare(b.title, 'fr'));
        const t = el('p', 'enc-wall-h enc-rows-h');
        const tn = el('span');
        tn.textContent = `${emo} ${name}`;
        const tc = el('b');
        tc.textContent = `${list.filter(x => x.k).length} / ${list.length}`;
        t.append(tn, tc);
        const row = el('div', `enc-rows-row is-${rk}`);
        sorted.forEach(it => {
            const known = it.k > 0;
            const b = el('button', `enc-rows-item ${o.itemCls(it)}${known ? ' is-known' : ''}`);
            b.type = 'button';
            b.append(...[].concat(o.make(it, known)));
            if (it.qs.length > 1) { const n = el('i', 'enc-rows-n'); n.textContent = it.qs.length; b.append(n); }
            b.addEventListener('click', () => show(it.key));
            btns[it.key] = b;
            row.append(b);
        });
        scroller.append(t, row);
    });
    if (rest.length) {
        const rb = el('button', 'enc-flag-other enc-rows-rest');
        rb.type = 'button';
        rb.textContent = `${o.restLabel} · ${rest.filter(encKnown).length} / ${rest.length} ›`;
        rb.addEventListener('click', () => show('rest'));
        btns.rest = rb;
        scroller.append(rb);
    }
    encTapOff(scroller, '.enc-rows-item, .enc-rows-rest', clear);
    page.append(h, cnt, scroller, panel);
    $('friendBody').replaceChildren(encBackBtn(o.back.label, o.back.fn), page);
    $('friendModal').hidden = false;
    if (keepKey && (byKey[keepKey] || keepKey === 'rest')) show(keepKey, true);
}
/** Regroupe les questions d'un thème selon une table id -> [clé, rangée, …] ; les questions absentes vont dans « le reste ». */
function encRowsGroup(theme, table, rowsDef, extra) {
    const groups = {}, rest = [];
    encChapters(theme).flatMap(c => c.qs).forEach(q => {
        const v = table[q.id];
        if (!v) { rest.push(q); return; }
        const key = `${v[1]}|${v[0]}`;
        const g = groups[key] || (groups[key] = { key, title: v[0], row: v[1], qs: [], ...extra(v) });
        g.qs.push(q);
    });
    const list = Object.values(groups);
    return { rows: rowsDef.map(([rk, emo, name]) => [rk, emo, name, list.filter(g => g.row === rk)]), rest };
}

/* ---------- 🖼️ Mon musée (Arts) : un tableau « caricature » dessiné par œuvre ou artiste, dans un cadre doré ---------- */
const ENC_MUS_PAL = {
    anc: [['#3b2a1a', '#6b4a2a', '#b98a4a'], ['#2e2a22', '#5a4630', '#c9a36a'], ['#2d3a2e', '#4e5a3a', '#a89a5a'], ['#3a2420', '#6e3a2a', '#c08a5a']],
    xix: [['#bfe3f2', '#f7e7a8', '#9fd18b'], ['#f6d6c9', '#c9e4f0', '#f2e08a'], ['#d9ecc5', '#f4c9d6', '#a9cdeb'], ['#fde3b5', '#b9dcd0', '#e8b4c8']],
    mod: [['#f4f1ea', '#e63946', '#1d4ed8'], ['#fdf6e3', '#f4b400', '#111827'], ['#eef2f7', '#e11d48', '#16a34a'], ['#fff7ed', '#7c3aed', '#f97316']],
    scu: [['#e7e2d8', '#cfc6b6', '#a89f8f']],
    arc: [['#1e3a8a', '#2b4fae', '#dbe7ff']],
    mus: [['#f3eee4', '#d9cfbd', '#8a7a62']],
    sce: [['#1f1f1f', '#444', '#e5e5e5']]
};
/** Petit tableau SVG déterministe selon la salle (ancien sombre, impressionniste à touches, moderne géométrique…). */
function encMusArt(it) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('class', 'enc-mus-svg');
    const add = (tag, at) => { const e = document.createElementNS(ns, tag); Object.entries(at).forEach(([k, v]) => e.setAttribute(k, v)); svg.append(e); return e; };
    let h = encHash(it.key);
    const rnd = () => { h = (h * 1103515245 + 12345) >>> 0; return (h >>> 8) / 16777216; };
    const pals = ENC_MUS_PAL[it.row] || ENC_MUS_PAL.mod;
    const [c0, c1, c2] = pals[encHash(it.title) % pals.length];
    add('rect', { x: 0, y: 0, width: 100, height: 100, fill: c0 });
    if (it.row === 'anc') {   // fond sombre, sol, halo doré
        add('rect', { x: 0, y: 62 + rnd() * 14, width: 100, height: 40, fill: c1 });
        add('circle', { cx: 30 + rnd() * 40, cy: 30 + rnd() * 10, r: 26, fill: c2, opacity: 0.35 });
    } else if (it.row === 'xix') {   // touches de couleur, ciel et herbe
        add('rect', { x: 0, y: 58, width: 100, height: 42, fill: c2 });
        for (let i = 0; i < 34; i++) add('ellipse', { cx: rnd() * 100, cy: rnd() * 100, rx: 3 + rnd() * 4, ry: 2 + rnd() * 2, fill: [c1, c2, '#fff', '#f2b5a0', '#8fb8de'][i % 5], opacity: 0.75 });
    } else if (it.row === 'mod') {   // formes franches
        for (let i = 0; i < 5; i++) {
            const c = [c1, c2, '#111827', c1, '#f4b400'][i];
            if (rnd() < 0.5) add('rect', { x: rnd() * 70, y: rnd() * 70, width: 18 + rnd() * 40, height: 14 + rnd() * 40, fill: c, opacity: 0.9 });
            else add('circle', { cx: rnd() * 100, cy: rnd() * 100, r: 8 + rnd() * 18, fill: c, opacity: 0.85 });
        }
    } else if (it.row === 'arc') {   // plan d'architecte
        for (let i = 10; i < 100; i += 10) { add('line', { x1: i, y1: 0, x2: i, y2: 100, stroke: c1, 'stroke-width': 1 }); add('line', { x1: 0, y1: i, x2: 100, y2: i, stroke: c1, 'stroke-width': 1 }); }
        add('rect', { x: 18, y: 30 + rnd() * 10, width: 64, height: 54, fill: 'none', stroke: c2, 'stroke-width': 2.2 });
    } else if (it.row === 'mus') {   // façade de musée
        add('polygon', { points: '10,40 50,16 90,40', fill: c1 });
        for (let x = 16; x < 88; x += 14) add('rect', { x, y: 42, width: 7, height: 42, fill: '#fff', opacity: 0.9 });
        add('rect', { x: 8, y: 84, width: 84, height: 7, fill: c2 });
    } else if (it.row === 'sce') {   // projecteur sur scène
        add('polygon', { points: '50,0 20,100 80,100', fill: '#fff', opacity: 0.12 });
        add('ellipse', { cx: 50, cy: 88, rx: 32, ry: 7, fill: '#fff', opacity: 0.18 });
    }
    return svg;
}
async function openEncMuseum(keepKey = null) {
    try { await encLoad('musee.js'); } catch (e) { showToast('📶 Indisponible hors connexion pour l’instant'); return; }
    const M = window.ENC_MUSEUM || { rooms: [], q: {} };
    const { rows, rest } = encRowsGroup('Arts', M.q, M.rooms, v => ({ emo: v[2], person: v[3] }));
    encRowsScreen({
        cls: 'enc-muspage', title: '🖼️ Mon musée', unit: 'œuvres et artistes découverts', unknown: it => it.row === 'scu' ? 'Sculpture à découvrir' : it.row === 'mus' ? 'Musée à découvrir' : 'Œuvre à découvrir',
        back: { label: '← Arts', fn: () => openEncBook('Arts', true) }, rows, rest,
        restLabel: '🎨 L’atelier : techniques, couleurs et vocabulaire', restName: '🎨 L’atelier', restDesc: 'Les techniques, les couleurs et le vocabulaire des artistes.',
        retLabel: '← Mon musée', reopen: k => openEncMuseum(k),
        head: it => `${it.emo || '🖼️'} ${it.title}`,
        desc: it => {
            if (!it.person) return '';
            const works = [...new Set(it.qs.filter(encKnown).flatMap(q => [...q.q.matchAll(/«\s*([^»]+?)\s*»/g)].map(m => m[1])))];
            return works.length ? `Au musée : ${works.map(w => `« ${w} »`).join(', ')}` : '';
        },
        itemCls: it => `enc-mus-item is-${it.row}`,
        make: (it, known) => {
            const hs = encHash(it.key);
            const fr = el('span', 'enc-mus-frame');
            const w = it.row === 'scu' ? 70 : 66 + hs % 30, hh = it.row === 'scu' ? 92 : 62 + (hs >>> 6) % 40;
            fr.style.width = `${w}px`;
            fr.style.height = `${hh}px`;
            if (known) {
                if (it.row !== 'scu') fr.append(encMusArt(it));
                const e = el('span', 'enc-mus-emo');
                e.textContent = it.emo || '🖼️';
                fr.append(e);
            } else {
                const q = el('span', 'enc-mus-q');
                q.textContent = '?';
                fr.append(q);
            }
            const pl = el('span', 'enc-mus-plaque');
            pl.textContent = known ? it.title : '???';
            pl.style.width = `${Math.max(w, 72)}px`;
            return [fr, pl];
        }
    }, keepKey);
}

/* 13/11 : « 🎬 Mes affiches de cinéma » (Cinéma). Une affiche dessinée par film / série / saga (plusieurs questions possibles),
   une étoile du « Walk of Fame » par star, une chaise de tournage par réalisateur. Pas su = affiche grise « ? ». Utilise encRowsScreen (enc_musee.js). */
const ENC_POS_HUES = { fr: [210, 350], cl: [35, 20], sf: [230, 270], dr: [0, 330], co: [320, 20], sa: [260, 200], an: [190, 140], se: [280, 170] };
async function openEncPosters(keepKey = null) {
    try { await encLoad('affiches.js'); } catch (e) { showToast('📶 Indisponible hors connexion pour l’instant'); return; }
    const P = window.ENC_POSTERS || { rows: [], q: {} };
    const { rows, rest } = encRowsGroup('Cinéma', P.q, P.rows, v => ({ emo: v[2], year: v[3] }));
    encRowsScreen({
        cls: 'enc-pospage', title: '🎬 Mes affiches de cinéma', unit: 'affiches découvertes', unknown: it => it.row === 'st' ? 'Star à découvrir' : it.row === 're' ? 'Réalisateur à découvrir' : 'Affiche à découvrir',
        back: { label: '← Cinéma', fn: () => openEncBook('Cinéma', true) }, rows, rest,
        restLabel: '🎟️ Les coulisses : festivals, prix et métiers', restName: '🎟️ Les coulisses', restDesc: 'Festivals, récompenses, inventeurs et métiers du cinéma.',
        retLabel: '← Mes affiches', reopen: k => openEncPosters(k),
        head: it => it.row === 'st' ? `⭐ ${it.title}` : it.row === 're' ? `🎬 ${it.title}` : `${it.emo || '🎬'} ${it.title}${it.year ? ` · ${it.year}` : ''}`,
        desc: it => {
            if (it.row !== 'st' && it.row !== 're') return '';
            const films = [...new Set(it.qs.filter(encKnown).flatMap(q => [...q.q.matchAll(/«\s*([^»]+?)\s*»/g)].map(m => m[1])))];
            return films.length ? `${it.row === 're' ? 'Ses films' : 'À l’affiche de'} : ${films.map(f => `« ${f} »`).join(', ')}` : '';
        },
        itemCls: it => `enc-pos-item is-${it.row}`,
        make: (it, known) => {
            if (it.row === 'st' || it.row === 're') {   // étoile du Walk of Fame / chaise de réalisateur
                const c = el('span', 'enc-pos-star');
                const ic = el('span', 'enc-pos-star-ic');
                ic.textContent = known ? (it.row === 'st' ? '★' : '🎬') : '?';
                const n = el('span', 'enc-pos-star-n');
                n.textContent = known ? it.title : '???';
                c.append(ic, n);
                return c;
            }
            const p = el('span', 'enc-pos-poster');
            if (known) {
                const [h1, h2] = ENC_POS_HUES[it.row] || [210, 260];
                const hs = encHash(it.key);
                p.style.setProperty('--h1', String((h1 + hs % 40) % 360));
                p.style.setProperty('--h2', String((h2 + (hs >>> 5) % 40) % 360));
                const e = el('span', 'enc-pos-emo');
                e.textContent = it.emo || '🎬';
                const t = el('span', `enc-pos-t${it.title.length > 22 ? ' is-long' : it.title.length > 12 ? ' is-mid' : ''}`);
                t.textContent = it.title;
                const y = el('span', 'enc-pos-y');
                y.textContent = it.year ? String(it.year) : '';
                p.append(e, t, y);
            } else {
                const q = el('span', 'enc-pos-q');
                q.textContent = '?';
                const s = el('span', 'enc-pos-soon');
                s.textContent = 'Bientôt à l’affiche';
                p.append(q, s);
            }
            return p;
        }
    }, keepKey);
}

function encMedia(q, small) {
    if (q.flag) return flagImg(q.flag);
    if (!q.photo && window.ENC_POST_PH?.[q.id]?.[0]) { const img = el('img'); img.src = window.ENC_POST_PH[q.id][0]; img.alt = ''; img.loading = 'lazy'; return img; }   // photo de l'album des cartes postales
    if (q.photo) { const img = el('img'); img.src = q.photo; img.alt = ''; img.loading = 'lazy'; return img; }
    if (q.rebus) return small ? emojiImg(q.rebus[0]) : null;
    return null;
}
// back : true = liste de fin de partie, ou { label, fn } = où ramène « ← » depuis la fiche ; chap = chapitre affiché au-dessus
function encRow(q, list, back = null, chap = null) {
    const row = el('button', 'enc-row');
    row.type = 'button';
    const ic = el('span', 'enc-row-ic');
    const m = encMedia(q, true);
    if (m) ic.append(m); else ic.append(encIconEl(q.theme));
    const tx = el('span', 'enc-row-tx');
    if (chap) { const ch = el('em', 'enc-row-ch'); ch.textContent = `${chap.emo} ${chap.name}`; tx.append(ch); }
    const b = el('b');
    b.textContent = q.a[0];
    const s = el('small');
    s.textContent = q.q;
    tx.append(b, s);
    row.append(ic, tx);
    if (isMastered(q.id)) { const st = el('span', 'enc-row-st'); st.textContent = '✨'; row.append(st); }
    row.addEventListener('click', () => openEncFiche(q, list, back === true ? null : back, back === true));
    return row;
}
/** Liste des savoirs trouvés pendant une partie (pastille de l'écran de fin). */
function openEncList(ids) {
    const qs = ids.map(encQuestion).filter(Boolean);
    const body = $('friendBody');
    body.replaceChildren();
    const h = el('h2', 'review-title');
    h.textContent = `📚 ${plural(qs.length, 'nouvelle question sue', 'nouvelles questions sues')} !`;
    const p = el('p', 'muted review-note');
    p.textContent = 'Elles sont rangées dans ton encyclopédie (Profil → 📚 Savoirs).';
    const list = el('div', 'enc-list');
    qs.forEach(q => list.append(encRow(q, qs, true)));
    body.append(h, p, list);
    $('friendModal').hidden = false;
    $('friendModal').querySelector('.modal-content').scrollTop = 0;
}
function encOthers(q) {
    const main = encNorm(q.a[0]);
    if (/^[\d\s.,]+$/.test(main)) return [];   // nombre : « aussi : vingt-sept » n'apporte rien
    const seen = new Set([main]);
    return q.a.slice(1).filter(x => {
        const n = encNorm(x);
        if (seen.has(n) || main.includes(n) || /^\d+$/.test(x)) return false;
        seen.add(n);
        return true;
    }).slice(0, 3);
}
const encDate = key => { if (!key) return ''; const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }); };
/** 12/11 : la fiche prend toute la hauteur (comme un livre) ; clavier ouvert = la fenêtre se cale au-dessus. */
function encFitKeyboard() {
    const mc = $('friendModal').querySelector('.modal-content');
    const vv = window.visualViewport;
    if (!mc.classList.contains('is-enc-fiche') || !vv) { mc.style.height = ''; mc.style.alignSelf = ''; $('friendModal').style.paddingTop = ''; return; }
    const kb = window.innerHeight - vv.height > 150;
    mc.style.height = kb ? `${Math.round(vv.height - 24)}px` : '';
    mc.style.alignSelf = kb ? 'flex-start' : '';
    $('friendModal').style.paddingTop = kb ? `${Math.round(vv.offsetTop + 12)}px` : '';
}
(() => {
    const fb = document.getElementById('friendBody');
    if (!fb) return;
    new MutationObserver(() => {
        const mc = fb.closest('.modal-content');
        mc.classList.toggle('is-enc-fiche', !!fb.querySelector(':scope > .enc-fiche, :scope > .enc-full'));
        mc.classList.toggle('is-enc-noback', !fb.querySelector(':scope > .duel-back'));
        const full = mc.classList.contains('is-enc-fiche');
        const ov = $('friendModal');
        ov.classList.toggle('is-enc-full', full);
        ov.style.bottom = '';   // 12/11 : toute la page (la barre du bas est cachée dessous)
        encFitKeyboard();
    }).observe(fb, { childList: true });
    window.visualViewport?.addEventListener('resize', encFitKeyboard);
    // un onglet du bas touché pendant l'encyclopédie : on la referme et on y va
    document.querySelectorAll('.nav-btn').forEach(b => b.addEventListener('click', () => {
        const ov = $('friendModal');
        if (!ov.hidden && ov.classList.contains('is-enc-full')) ov.hidden = true;
    }, true));
})();
/** 12/11 : une phrase de Kulti sur ta façon d'avoir appris cette question (essais, réussites, maîtrise). */
function encKultiLine(q) {
    const s = state.data.stats[q.id] || {};
    const tries = s.tries || 0, right = s.right || 0, miss = Math.max(0, tries - right);
    const pick = arr => arr[q.id % arr.length];
    const days = s.first ? Math.round((new Date(todayKey()) - new Date(s.first)) / 86400000) : null;
    if (isMastered(q.id) && right >= 4) return pick([`Réussie ${right} fois sur ${tries} : celle-là, tu la connais par cœur !`, `${right} bonnes réponses sur ${tries} essais. Elle est gravée dans ton cerveau !`]);
    if (isMastered(q.id) && miss) return `Ratée ${miss} fois au début, et maintenant maîtrisée. La preuve que réviser, ça marche !`;
    if (isMastered(q.id)) return pick(['Maîtrisée ! Elle ne t’échappera plus.', 'Maîtrisée : tu peux la ranger dans tes valeurs sûres.']);
    if (miss >= 2) return `Elle t’a résisté ${miss} fois avant que tu la trouves. Bien joué de ne pas avoir lâché !`;
    if (miss === 1) return 'Ratée une fois, puis trouvée : c’est comme ça qu’on retient le mieux !';
    if (days === 0) return 'Découverte aujourd’hui ! Réussis-la encore un autre jour pour la maîtriser.';
    if (days !== null && days > 0) return `Découverte il y a ${plural(days, 'jour', 'jours')}. Encore une bonne réponse un autre jour et elle sera maîtrisée !`;
    return 'Encore une bonne réponse, un autre jour, et elle sera maîtrisée !';
}
const ENC_FACT_SKIP = new Set(['siecle', 'siecles', 'quelle', 'quelles', 'comment', 'appelle', 'celebre', 'celebres', 'premier', 'premiere', 'grande', 'grandes', 'france', 'francais', 'francaise', 'monde', 'histoire', 'nomme', 'surnomme', 'depuis', 'pendant', 'combien', 'toujours', 'encore', 'plusieurs', 'contre', 'autres', 'entre']);
function openEncFiche(q, list, backTheme, fromEnd = false) {
    const body = $('friendBody');
    body.replaceChildren();
    const idx = list.indexOf(q);
    const back = el('button', 'duel-back');
    back.type = 'button';
    const bk = typeof backTheme === 'object' && backTheme ? backTheme : null;   // 12/11 : { label, fn } (chapitre, recherche…)
    back.textContent = bk ? bk.label : backTheme ? `← ${backTheme}` : fromEnd ? '← Nouvelles questions sues' : '← Retour';
    back.addEventListener('click', () => { if (bk) bk.fn(); else if (backTheme) openEncBook(backTheme, true); else if (fromEnd) openEncList(list.map(x => x.id)); else $('friendModal').hidden = true; });
    const fiche = el('div', 'enc-fiche');
    fiche.style.setProperty('--c', ENC_COLORS[q.theme] || '#3d8bff');
    const chip = el('span', 'enc-chip');
    chip.append(encIconEl(q.theme), document.createTextNode(` ${q.theme}`));
    fiche.append(chip);
    const media = q.rebus ? (() => { const d = el('div', 'enc-rebus'); d.append(...q.rebus.map(emojiImg)); return d; })() : encMedia(q, false);
    if (media) {
        const w = el('div', `enc-media${q.flag ? ' is-flag' : ''}`);
        w.append(media);
        const credit = q.credit || (!q.photo && window.ENC_POST_PH?.[q.id]?.[3]);
        if (credit) { const c = el('small'); c.textContent = credit; w.append(c); }
        fiche.append(w);
    }
    const qq = el('div', 'enc-q');
    const ql = el('em');
    ql.textContent = 'La question';
    qq.append(ql, document.createTextNode(q.q));
    fiche.append(qq);
    // 12/11 : la réponse APRÈS la question (« 10 » seul ne voulait rien dire)
    const al = el('em', 'enc-alabel');
    al.textContent = 'La réponse';
    const title = el('h3');
    title.textContent = q.a[0];
    fiche.append(al, title);
    const others = encOthers(q);
    if (others.length) { const o = el('p', 'enc-also'); o.textContent = `aussi : ${others.join(', ')}`; fiche.append(o); }
    if (q.exp) {
        const sv = el('div', 'enc-sv');
        const sl = el('em');
        sl.textContent = '💡 Le savais-tu ?';
        sv.append(sl, document.createTextNode(q.exp));
        fiche.append(sv);
    }
    const meta = el('div', 'enc-meta');
    const s = state.data.stats[q.id] || {};
    const d1 = el('span', 'enc-chip is-ok');
    d1.textContent = s.first ? `✓ Découvert le ${encDate(s.first)}` : '✓ Découvert';
    meta.append(d1);
    encTip(d1, 'known');
    const d2 = el('span', `enc-chip ${isMastered(q.id) ? 'is-gold' : 'is-grey'}`);
    encTip(d2, 'mastered');
    d2.textContent = isMastered(q.id) ? '✨ Maîtrisé' : '✨ Pas encore maîtrisé';
    meta.append(d2);
    fiche.append(meta);
    // 12/11 : à la place de « Me la reposer », Kulti commente CETTE question d'après tes réponses (rien à écrire en plus)
    {
        const kb = el('div', 'enc-kulti');
        kb.append(kultiEl(isMastered(q.id) ? 'fier' : 'content', 'kulti-blink'));
        const say = el('p', 'enc-kulti-say');
        const sl = el('em');
        sl.textContent = 'Le mot de Kulti';
        say.append(sl, document.createTextNode(encKultiLine(q)));
        kb.append(say);
        fiche.append(kb);
    }
    const nav = el('div', 'enc-nav');
    const mk = (txt, j) => {
        const b = el('button', 'enc-navbtn');
        b.type = 'button';
        b.textContent = txt;
        b.disabled = j < 0 || j >= list.length;
        b.addEventListener('click', () => openEncFiche(list[j], list, backTheme, fromEnd));
        return b;
    };
    const pos = el('span');
    pos.textContent = idx >= 0 ? `${idx + 1} / ${list.length}` : '';
    nav.append(mk('‹ Précédent', idx - 1), pos, mk('Suivant ›', idx + 1));
    body.append(back, fiche, nav);
    // 12/11 : balayer de droite à gauche = question suivante (et l'inverse)
    let sx = null, sy = 0;
    fiche.addEventListener('touchstart', e => { if (e.target.closest('input')) { sx = null; return; } sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    fiche.addEventListener('touchend', e => {
        if (sx === null) return;
        const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
        sx = null;
        if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
        const j = idx + (dx < 0 ? 1 : -1);
        if (j < 0 || j >= list.length) return;
        openEncFiche(list[j], list, backTheme, fromEnd);
        const f2 = $('friendBody').querySelector('.enc-fiche');
        if (f2) f2.classList.add(dx < 0 ? 'is-from-right' : 'is-from-left');
    }, { passive: true });
    $('friendModal').hidden = false;
    $('friendModal').querySelector('.modal-content').scrollTop = 0;
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
        avCollections: typeof AV_COLLECTIONS === 'undefined' ? 0 : AV_COLLECTIONS.filter(c => c.items.every(id => d.av?.owned?.[id])).length,   // 11/11
        goalDays: Object.keys(d.goalDays).length,
        xp: d.xp,
        purchases: d.totals.purchases,
        mapComplete: !!d.done[MAX_LEVEL],
        themeMastered: themeStats().some(t => t.total >= 5 && t.mastered === t.total),
        leagueWins: leagueWins(),
        themesComplete: completeThemes().length,
        shinyTheme: shinyThemes().length > 0,
        eventsWon: Object.keys(d.events || {}).filter(id => d.events[id].won),
        duelsWon: d.totals.duelsWon || 0,
        ...(BADGES_V2 ? medalCounts() : {})
    };
}

/* BADGES V2 (2026-10-30, aperçu apercu-badges.html) : rangés par familles + 24 nouveaux. En ligne pour tous depuis le 30/10. */
const QUEST_WEEKS_FROM = '2026-10-26';   // quête en duo : 1re semaine complète après la remise à zéro (2026-10-30)
const BADGES_V2 = true;   // mis en ligne pour tous le 2026-10-30 (avant : bac à sable seulement)
function medalCounts() {
    const m = THEME_DECOR.map(({ theme }) => (trainingBank(theme).length ? trainMedalOf(theme) : 0));
    return { medals: m.filter(x => x > 0).length, golds: m.filter(x => x >= 3).length };
}

const BADGES = [
    { id: 'ev-halloween-2026', icon: '🎃', name: 'Halloween 2026', desc: 'Trouver 45 questions de la semaine d’Halloween 2026', event: 'halloween-2026',
      test: s => s.eventsWon.includes('halloween-2026') },
    // Ajouté le 09/11 après l'événement (demande de l'utilisateur) : ceux qui l'ont fini le reçoivent à l'ouverture du jeu
    { id: 'ev-maghreb-2026', icon: '🐪', name: 'Escale au Maghreb 2026', desc: 'Trouver 50 questions de l’Escale au Maghreb 2026', event: 'maghreb-2026',
      test: s => s.eventsWon.includes('maghreb-2026') },
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
    { id: 'sprint10',  icon: '⚡', name: 'Éclair',              desc: '8 bonnes réponses en un sprint',       test: s => s.bestSprint >= 8 },
    { id: 'sprint20',  icon: '🌩️', name: 'Foudre',              desc: '10 bonnes réponses en un sprint',       test: s => s.bestSprint >= 10 },
    
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
    { id: 'specialist', hidden: true, icon: '🎓', name: 'Spécialiste',         desc: 'Maîtriser toutes les questions d’un thème', test: s => s.themeMastered },
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

const BADGES_NEW = [
    { id: 'lv25',     icon: '🧭', name: 'Explorateur',            desc: 'Terminer 25 niveaux du parcours',        test: s => s.levelsDone >= 25 },
    { id: 'lv50',     icon: '🏕️', name: 'Aventurier',             desc: 'Terminer 50 niveaux du parcours',        test: s => s.levelsDone >= 50 },
    { id: 'lv100',    icon: '🏔️', name: 'Grand voyageur',         desc: 'Terminer 100 niveaux du parcours',       test: s => s.levelsDone >= 100 },
    { id: 'right1000', icon: '📖', name: 'Tête bien pleine',      desc: '1 000 bonnes réponses du premier coup',  test: s => s.right >= 1000 },
    { id: 'right2500', icon: '📚', name: 'Bibliothèque vivante',  desc: '2 500 bonnes réponses du premier coup',  test: s => s.right >= 2500 },
    { id: 'right5000', icon: '🦉', name: 'Érudit',                desc: '5 000 bonnes réponses du premier coup',  test: s => s.right >= 5000 },
    { id: 'right10000', icon: '🌌', name: 'Mémoire infinie',      desc: '10 000 bonnes réponses du premier coup', test: s => s.right >= 10000 },
    { id: 'streak180', icon: '☄️', name: 'Six mois de feu',       desc: '180 jours de série consécutifs',         test: s => s.bestStreak >= 180 },
    { id: 'goal100',  icon: '⏰', name: 'Réglé comme une horloge', desc: 'Atteindre l’objectif 100 jours',        test: s => s.goalDays >= 100 },
    { id: 'xp10000',  icon: '🚀', name: '10 000 XP',              desc: 'Cumuler 10 000 XP',                      test: s => s.xp >= 10000 },
    { id: 'xp25000',  icon: '🪐', name: '25 000 XP',              desc: 'Cumuler 25 000 XP',                      test: s => s.xp >= 25000 },
    { id: 'xp50000',  icon: '☀️', name: '50 000 XP',              desc: 'Cumuler 50 000 XP',                      test: s => s.xp >= 50000 },
    { id: 'xp100000', icon: '🌠', name: '100 000 XP',             desc: 'Cumuler 100 000 XP',                     test: s => s.xp >= 100000 },
    { id: 'flawless25', icon: '🎯', name: 'Précision suisse',     desc: 'Terminer 25 leçons sans erreur',         test: s => s.flawless >= 25 },
    { id: 'flawless100', icon: '🏹', name: 'Sans bavure',         desc: 'Terminer 100 leçons sans erreur',        test: s => s.flawless >= 100 },
    { id: 'daily30',  icon: '📌', name: 'Abonné du jour',         desc: 'Terminer 30 défis du jour',              test: s => s.dailyDone >= 30 },
    { id: 'sprint30', icon: '💨', name: 'Supersonique',           desc: '12 bonnes réponses en un sprint',        test: s => s.bestSprint >= 12 },
    { id: 'medal1',   icon: '🥉', name: 'Première médaille',      desc: 'Gagner une médaille d’entraînement',     test: s => s.medals >= 1 },
    { id: 'gold1',    icon: '🥇', name: 'Médaille d’or',          desc: 'Gagner une médaille d’or (toutes les questions d’un thème maîtrisées)', test: s => s.golds >= 1 },
    { id: 'gold5',    icon: '🏆', name: 'Pluie d’or',             desc: 'Médaille d’or dans 5 thèmes',            test: s => s.golds >= 5 },
    { id: 'duel1',    icon: '⚔️', name: 'Premier duel',           desc: 'Gagner un duel',                         test: s => s.duelsWon >= 1 },
    { id: 'duel10',   icon: '🤺', name: 'Duelliste',              desc: 'Gagner 10 duels',                        test: s => s.duelsWon >= 10 },
    { id: 'duel50',   icon: '🛡️', name: 'Invaincu… ou presque',   desc: 'Gagner 50 duels',                        test: s => s.duelsWon >= 50 },
    { id: 'revisions25', icon: '🧹', name: 'Rien ne m’échappe',   desc: 'Terminer 25 sessions de révision',       test: s => s.reviews >= 25 },
    // 11/11 (revue des badges avec l'utilisateur)
    { id: 'lv150',      icon: '🧗', name: 'Alpiniste',             desc: 'Terminer 150 niveaux du parcours',       test: s => s.levelsDone >= 150 },
    { id: 'lv200',      icon: '🌄', name: 'Baroudeur',             desc: 'Terminer 200 niveaux du parcours',       test: s => s.levelsDone >= 200 },
    { id: 'lv250',      icon: '🦅', name: 'Conquérant',            desc: 'Terminer 250 niveaux du parcours',       test: s => s.levelsDone >= 250 },
    { id: 'right25000', icon: '🏛️', name: 'Panthéon du savoir',    desc: '25 000 bonnes réponses du premier coup', test: s => s.right >= 25000 },
    { id: 'daily100',   icon: '📰', name: 'Incontournable',        desc: 'Terminer 100 défis du jour',             test: s => s.dailyDone >= 100 },
    { id: 'goldAll',    icon: '👑', name: 'Roi de l’entraînement', desc: 'Médaille d’or dans tous les thèmes',     test: s => s.golds >= TRAIN_THEMES_COUNT() },
    { id: 'duel100',    icon: '🏰', name: 'Seigneur des duels',    desc: 'Gagner 100 duels',                       test: s => s.duelsWon >= 100 },
    { id: 'revisions50', icon: '🔍', name: 'Œil de lynx',          desc: 'Terminer 50 sessions de révision',       test: s => s.reviews >= 50 },
    { id: 'revisions100', icon: '🧠', name: 'Mémoire d’acier',     desc: 'Terminer 100 sessions de révision',      test: s => s.reviews >= 100 },
    { id: 'shop10',     icon: '🛍️', name: 'Bon client',            desc: 'Faire 10 achats à la boutique',          test: s => s.purchases >= 10 },
    { id: 'shop25',     icon: '💳', name: 'Habitué de la boutique', desc: 'Faire 25 achats à la boutique',         test: s => s.purchases >= 25 },
    { id: 'shop50',     icon: '🏬', name: 'Client fidèle',         desc: 'Faire 50 achats à la boutique',          test: s => s.purchases >= 50 },
    { id: 'avColl1',    icon: '🎨', name: 'Bien assorti',          desc: 'Avoir une collection d’avatar complète (cadre, fond et emoji)', test: s => s.avCollections >= 1 },
    { id: 'avColl5',    icon: '🖼️', name: 'Garde-robe de star',    desc: 'Avoir 5 collections d’avatar complètes', test: s => s.avCollections >= 5 }
];
const TRAIN_THEMES_COUNT = () => THEME_DECOR.filter(({ theme }) => trainingBank(theme).length).length;
const activeBadges = () => (BADGES_V2 ? BADGES.concat(BADGES_NEW) : BADGES);
/* Familles : [icône, nom, unité de la phrase « Prochain », [[id, objectif court, valeur visée, valeur du joueur]]], du plus facile au plus dur. */
const BADGE_FAMS = [
    // 11/11 : une famille = un seul compteur (avant : « Défis et modes », « Ligue et duels »… mélangeaient, on ne voyait pas ses duels)
    ['🗺️', 'Parcours', 'niveaux', [['first', '1 niveau', 1, s => s.levelsDone], ['challenge', '1 défi', 1, s => s.challengesDone],
        ['lv25', '25 niveaux', 25, s => s.levelsDone], ['lv50', '50 niveaux', 50, s => s.levelsDone], ['lv100', '100 niveaux', 100, s => s.levelsDone],
        ['lv150', '150 niveaux', 150, s => s.levelsDone], ['lv200', '200 niveaux', 200, s => s.levelsDone], ['lv250', '250 niveaux', 250, s => s.levelsDone],
        ['complete', 'le dernier', 1, s => +s.mapComplete]]],
    ['🧠', 'Bonnes réponses', 'bonnes réponses du 1er coup', [['right25', '25', 25, s => s.right], ['right100', '100', 100, s => s.right],
        ['right500', '500', 500, s => s.right], ['right1000', '1 000', 1000, s => s.right], ['right2500', '2 500', 2500, s => s.right],
        ['right5000', '5 000', 5000, s => s.right], ['right10000', '10 000', 10000, s => s.right], ['right25000', '25 000', 25000, s => s.right]]],
    ['🔥', 'Série', 'jours de série', [['streak7', '7 jours', 7, s => s.bestStreak], ['streak30', '30 jours', 30, s => s.bestStreak],
        ['streak90', '90 jours', 90, s => s.bestStreak], ['streak180', '180 jours', 180, s => s.bestStreak], ['streak365', '365 jours', 365, s => s.bestStreak]]],
    ['⭐', 'Objectif du jour', 'jours avec l’objectif atteint', [['goal', '1 jour', 1, s => s.goalDays], ['goal7', '7 jours', 7, s => s.goalDays],
        ['goal30', '30 jours', 30, s => s.goalDays], ['goal100', '100 jours', 100, s => s.goalDays]]],
    ['💫', 'XP', 'XP', [['xp100', '100 XP', 100, s => s.xp], ['xp500', '500 XP', 500, s => s.xp], ['xp2000', '2 000 XP', 2000, s => s.xp],
        ['xp5000', '5 000 XP', 5000, s => s.xp], ['xp10000', '10 000 XP', 10000, s => s.xp], ['xp25000', '25 000 XP', 25000, s => s.xp],
        ['xp50000', '50 000 XP', 50000, s => s.xp], ['xp100000', '100 000 XP', 100000, s => s.xp]]],
    ['✨', 'Sans faute', 'leçons sans erreur', [['flawless', '1 leçon', 1, s => s.flawless], ['flawless5', '5 leçons', 5, s => s.flawless],
        ['flawless25', '25 leçons', 25, s => s.flawless], ['flawless100', '100 leçons', 100, s => s.flawless]]],
    ['📅', 'Défi du jour', 'défis du jour', [['daily', '1 défi', 1, s => s.dailyDone], ['daily7', '7 défis', 7, s => s.dailyDone],
        ['daily30', '30 défis', 30, s => s.dailyDone], ['daily100', '100 défis', 100, s => s.dailyDone], ['daily10', '10/10', 1, s => +s.dailyPerfect, '']]],
    ['⚡', 'Sprint', 'bonnes réponses en un sprint', [['sprint10', '8', 8, s => s.bestSprint], ['sprint20', '10', 10, s => s.bestSprint],
        ['sprint30', '12', 12, s => s.bestSprint]]],
    ['🥇', 'Entraînement', 'thèmes', [['medal1', '1 médaille', 1, s => s.medals], ['gold1', '1 or', 1, s => s.golds], ['gold5', '5 thèmes en or', 5, s => s.golds],
        ['goldAll', 'tous en or', 15, s => s.golds], ['specialist', '1 thème', 1, s => +s.themeMastered]]],
    ['🏆', 'Ligue des amis', 'semaines à la 1re place', [['league1', '1 semaine', 1, s => s.leagueWins], ['league5', '5 semaines', 5, s => s.leagueWins],
        ['league10', '10 semaines', 10, s => s.leagueWins]]],
    ['⚔️', 'Duels', 'duels gagnés', [['duel1', '1 duel', 1, s => s.duelsWon], ['duel10', '10 duels', 10, s => s.duelsWon],
        ['duel50', '50 duels', 50, s => s.duelsWon], ['duel100', '100 duels', 100, s => s.duelsWon]]],
    ['🃏', 'Collection', 'thèmes complets', [['collect1', '1 thème', 1, s => s.themesComplete], ['collect5', '5 thèmes', 5, s => s.themesComplete],
        ['collectAll', 'toutes', 15, s => s.themesComplete], ['shinyTheme', '1 thème brillant', 1, s => +s.shinyTheme, '']]],
    ['🔁', 'Révisions', 'révisions terminées', [['revisions', '1', 1, s => s.reviews], ['revisions5', '5', 5, s => s.reviews],
        ['revisions25', '25', 25, s => s.reviews], ['revisions50', '50', 50, s => s.reviews], ['revisions100', '100', 100, s => s.reviews]]],
    ['🛒', 'Boutique', 'achats', [['shop', '1 achat', 1, s => s.purchases], ['shop10', '10 achats', 10, s => s.purchases],
        ['shop25', '25 achats', 25, s => s.purchases], ['shop50', '50 achats', 50, s => s.purchases]]],
    ['🎨', 'Avatar', 'collections complètes', [['avColl1', '1 collection', 1, s => s.avCollections], ['avColl5', '5 collections', 5, s => s.avCollections]]],
    ['🎉', 'Événements', '', [['ev-halloween-2026', 'événement fini', 1, s => +s.eventsWon.includes('halloween-2026')],
        ['ev-maghreb-2026', 'événement fini', 1, s => +s.eventsWon.includes('maghreb-2026')]]]
];

/** Semaines terminées à la 1re place de la Ligue des amis. */
const leagueWins = () => Object.values(state.data.podium || {}).filter(place => place === 1).length;

/* Badges V2 : une famille = titre + « Prochain : … » avec sa barre + 3 cases (dernier gagné, prochain, suivant), « Voir les N ». */
const badgeFamOpen = new Set();
let badgeDetail = null;
function claimBadge(b) {
    const data = state.data;
    data.claimedBadges[b.id] = true;
    data.coins += coinBadge();
    saveData();
    renderHeader();
    renderProfile();
    showToast(`🎁 +${coinBadge()} 🪙 pour le badge ${b.name} !`);
}
function renderBadgesV2(grid) {
    const data = state.data;
    const s = badgeStats();
    const byId = Object.fromEntries(activeBadges().map(b => [b.id, b]));
    const nf = n => n.toLocaleString('fr-FR');
    grid.className = 'badge-fams';
    let got = 0, all = 0, toClaim = 0, firstClaim = null;
    BADGE_FAMS.forEach(([icon, name, unit, rows]) => {
        const list = rows.map(([id, goal, target, val, own]) => ({ b: byId[id], goal, target, val: val(s), unit: own })).filter(x => x.b)
            .filter(x => !x.b.event || data.badges[x.b.id] || currentEvent()?.id === x.b.event)
            .filter(x => !x.b.hidden || data.badges[x.b.id]);   // ancien badge retiré : visible seulement pour qui l'a
        if (!list.length) return;
        list.forEach(x => { x.has = !!data.badges[x.b.id]; x.claim = x.has && !data.claimedBadges[x.b.id]; });
        const done = list.filter(x => x.has).length;
        got += done; all += list.length;
        const sec = el('section', 'bdf');
        const head = el('div', 'bdf-head');
        const hi = el('span');
        hi.textContent = icon;
        const hb = el('b');
        hb.textContent = name;
        const hc = el('small');
        hc.textContent = `${done} / ${list.length}`;
        head.append(hi, hb, hc);
        sec.append(head);
        const nextI = list.findIndex(x => !x.has);
        const next = list[nextI];
        if (next) {
            const line = el('p', 'bdf-next');
            const u = next.unit ?? unit;   // 11/11 : un badge peut avoir son propre compteur (10/10, thème brillant)
            line.textContent = `Prochain : ${next.b.icon} ${next.b.name} · ${nf(Math.min(next.val, next.target))} / ${nf(next.target)}${u ? ` ${u}` : ''}`;
            const bar = el('i');
            bar.style.setProperty('--p', `${Math.min(100, (next.val / next.target) * 100)}%`);
            line.append(bar);
            sec.append(line);
        }
        let from = nextI < 0 ? list.length - 3 : Math.max(0, nextI - 1);
        from = Math.max(0, Math.min(from, list.length - 3));
        let shown = badgeFamOpen.has(name) ? list : list.slice(from, from + 3);
        const waiting = list.find(x => x.claim);   // un badge à récupérer est toujours visible
        if (waiting && !shown.includes(waiting)) shown = [waiting, ...list.slice(Math.max(0, nextI)).filter(x => x !== waiting)].slice(0, 3);
        const row = el('div', 'bdf-row');
        shown.forEach(x => {
            const t = el('button', `bdf-tile${x.claim ? ' is-claim' : x.has ? '' : x === next ? ' is-next' : ' is-locked'}`);
            t.type = 'button';
            const ic = el('span', 'bdf-ic');
            ic.textContent = x.b.icon;
            const nm = el('span', 'bdf-name');
            nm.textContent = x.b.name;
            const sub = el('span', 'bdf-sub');
            sub.textContent = x.claim ? `🎁 +${coinBadge()} 🪙` : x.has ? `✓ ${x.goal}` : x === next ? `${nf(Math.min(x.val, x.target))} / ${nf(x.target)}` : `🔒 ${x.goal}`;
            t.append(ic, nm, sub);
            t.addEventListener('click', () => {
                if (x.claim) { claimBadge(x.b); return; }
                badgeDetail = badgeDetail === x.b.id ? null : x.b.id;
                renderProfile();
            });
            row.append(t);
        });
        sec.append(row);
        const det = list.find(x => x.b.id === badgeDetail);
        if (det) {
            const p = el('p', 'bdf-detail');
            p.textContent = `${det.b.icon} ${det.b.name} : ${det.b.desc}.`;
            sec.append(p);
        }
        if (list.length > 3) {
            const more = el('button', 'link-btn list-more bdf-more');
            more.type = 'button';
            more.textContent = badgeFamOpen.has(name) ? 'Voir moins' : `Voir les ${list.length} ›`;
            more.addEventListener('click', () => { if (badgeFamOpen.has(name)) badgeFamOpen.delete(name); else badgeFamOpen.add(name); renderProfile(); });
            sec.append(more);
        }
        const claims = list.filter(x => x.claim).length;
        toClaim += claims;
        if (claims && !firstClaim) firstClaim = sec;
        grid.append(sec);
    });
    if (toClaim) {
        const bar = el('button', 'bdf-claim');
        bar.type = 'button';
        bar.textContent = `🎁 ${toClaim} badge${toClaim > 1 ? 's' : ''} à récupérer · +${toClaim * coinBadge()} 🪙 ↓`;
        bar.addEventListener('click', () => firstClaim?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
        grid.prepend(bar);
    }
    $('badgeCount').textContent = `(${got}/${all})`;
}

/** Débloque les badges mérités. `silent` évite les notifications (au chargement). */
function checkBadges(silent = false) {
    const stats = badgeStats();
    state.data.best.streak = Math.max(state.data.best.streak, stats.bestStreak);
    let earned = false;
    for (const badge of activeBadges()) {
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
    start: '2026-10-26', end: '2026-11-01', goal: 45, cls: 'event-halloween', tip: 'tipEventHalloween2026', badge: true,
    // (fin avancée du 2 au 1er novembre le 2026-10-30 : l'Escale au Maghreb commence le lundi 2)
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
}, {
    // Escale au Maghreb (2026-10-30, aperçu apercu-escale.html, voyage des testeurs) : plus léger qu'Halloween,
    // ni citrouilles, ni missions spéciales, ni badge. Réutilisable : une autre « escale » = un autre pays.
    id: 'maghreb-2026', bank: 'maghreb', name: 'Maghreb', title: 'Escale au Maghreb', icon: '🐪',
    start: '2026-11-02', end: '2026-11-08', goal: 50, cls: 'event-maghreb', tip: 'tipEventMaghreb2026',
    intro: 'C’est l’Escale au Maghreb !', blurb: 'Des sessions de 10 questions sur le Maroc, l’Algérie et la Tunisie.',
    rewards: [{ at: 10, emoji: '🫖' }, { at: 30, emoji: '🌴' }, { at: 50, emoji: '🐪' }], badge: true,   // badge ajouté le 09/11
    decor: ['🐪', '🌴', '🫖', '🕌', '🏜️', '🌙', '🍊', '🏺'],
    card: { id: 'ev-maghreb-2026', theme: 'Escale au Maghreb 2026', icon: '🐪', name: 'Dromadaire 2026', rarity: 'event',
            text: 'Gagnée pendant l’Escale au Maghreb 2026.' }
}];
const evBadgeText = ev => (ev.badge ? ` et le badge ${ev.name} 2026` : '');
const EVENT_CARDS = EVENTS.map(e => e.card);
const EVENT_SIZE = 10;   // questions par session

function currentEvent() {
    let demo = null;
    try { demo = new URLSearchParams(location.search).get('demo'); } catch (err) { /* sans adresse */ }
    if (demo === 'bebe') return null;   // démo du décor « Bienvenue bébé » : sans événement
    const today = todayKey();
    return EVENTS.find(e => demo === e.bank) || EVENTS.find(e => today >= e.start && today <= e.end)
        || (demo === 'lundi' || BAC ? EVENTS[0] : null);
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
    const spot = ev && ev.pumpkin ? pumpkinSpots(ev).find(sp => !$(sp.screen).hidden && !pumpkinData(ev).got[sp.screen]) : null;
    const covered = document.querySelector('.modal-overlay:not([hidden]), .tour:not([hidden]), .chest-overlay:not([hidden])') || $('topbar').hidden;
    if (!spot || covered) { if (pk) pk.remove(); return; }
    if (pk && pk.dataset.screen === spot.screen) return;
    if (pk) pk.remove();
    const screen = $(spot.screen);
    const current = spot.screen === 'mapScreen' ? document.querySelector('.node.is-current:not(.is-optional)') : null;
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

/* Décor « Bienvenue bébé » (2026-11-08, un testeur attend un bébé) : semaine du 9 au 15 novembre 2026, pour tout le monde,
   seulement le décor du parcours et des leçons, façon « Un gars, une fille » : icônes bleues à gauche, roses à droite,
   fond qui passe du bleu au rose. Rien d'autre (ni questions ni récompense). Démo : ?demo=bebe. */
const BABY_DECOR = {
    start: '2026-11-09', end: '2026-11-15',
    blue: ['🍼', '👶', '🧸', '💙', '🐳', '🚂', '🧦', '⭐'],
    pink: ['🍼', '👶', '🧸', '💗', '🎀', '🦄', '🧦', '🌸'],
    facts: [
        'À la naissance, un bébé a environ 300 os : certains se soudent en grandissant, et l’adulte n’en a plus que 206.',
        'Un nouveau-né voit flou : il distingue surtout ce qui est à 20-30 cm… la distance du visage de ses parents.',
        'Les bébés naissent sans rotules en os : elles sont en cartilage et ne durcissent que vers 3 à 5 ans.',
        'Le bleu pour les garçons et le rose pour les filles ne s’est vraiment imposé qu’au milieu du XXe siècle.',
        'Les nouveau-nés pleurent presque sans larmes : leurs glandes lacrymales ne fonctionnent bien qu’après quelques semaines.',
        '« Un gars, une fille » : Jean Dujardin et Alexandra Lamy, aussi en couple dans la vraie vie à l’époque de la série.'
    ]
};
function babyDecorOn() {
    if (currentEvent()) return false;
    let demo = null;
    try { demo = new URLSearchParams(location.search).get('demo'); } catch (err) { /* sans adresse */ }
    const today = todayKey();
    return demo === 'bebe' || (today >= BABY_DECOR.start && today <= BABY_DECOR.end);
}
function showBabyFact(badge) {
    const blue = badge.classList.contains('baby-blue');
    $('factTitle').textContent = blue ? '💙 Bienvenue bébé !' : '💗 Bienvenue bébé !';
    $('factText').textContent = BABY_DECOR.facts[Number(badge.dataset.fact || 0) % BABY_DECOR.facts.length].replace(/ ([»:!?])/g, ' $1');
    const bubble = $('factBubble');
    bubble.hidden = false;
    const r = badge.getBoundingClientRect();
    const top = r.bottom + 10 + bubble.offsetHeight < window.innerHeight - 90 ? r.bottom + 10 : r.top - 10 - bubble.offsetHeight;
    bubble.style.top = `${Math.max(70, top)}px`;
}

/** Décor, bandeau et sous-onglet selon l'événement en cours (appelé au lancement). */
function applyEventLook() {
    const ev = currentEvent();
    EVENTS.forEach(e => document.body.classList.toggle(e.cls, !!ev && ev.id === e.id));
    document.body.classList.toggle('deco-baby', babyDecorOn());
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
        text: `${ev.icon} ${ev.intro || `C’est la ${ev.title.charAt(0).toLowerCase()}${ev.title.slice(1)} !`} Touche ici : des questions spéciales, qui ne coûtent pas de gouttes 💧, et une carte à gagner jusqu’au ${shortDate(ev.end)}.`
    }], 'Voir l’événement');
}
function showEventPageTip() {
    const ev = currentEvent();
    const d = state.data;
    if (!ev || d[`${ev.tip}Page`] || !tipAllowed('challengesScreen') || $('eventPage').hidden) return;
    startTip(`${ev.tip}Page`, [{
        target: () => document.querySelector('.event-card'),
        text: `🎁 Chaque question trouvée compte une fois. Une question ratée ne revient pas dans la session, mais dans une prochaine. Trouve ${ev.goal} questions différentes pour gagner la carte « ${ev.card.name} »${evBadgeText(ev)} !`
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
    p.textContent = `${ev.blurb || `Des sessions de ${EVENT_SIZE} questions frissonnantes.`} Elles ne coûtent pas de gouttes 💧 et il n’y a pas de cœurs. Jusqu’au ${shortDate(ev.end)}.`;
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
        ? `✅ Carte gagnée ! Elle est dans ta collection${ev.badge ? ', et le badge dans ton profil' : ''}.`
        : `🎁 Trouve ${ev.goal} questions différentes : la carte « ${ev.card.name} »${evBadgeText(ev)}. Seulement cette semaine !`;
    reward.append(face, rtext);
    const actions = el('div', 'card-actions');
    const btn = el('button', 'btn btn-green');
    btn.type = 'button';
    btn.textContent = ed.won ? 'Rejouer pour le plaisir' : 'Jouer';
    btn.addEventListener('click', openEventStart);
    actions.append(btn);
    card.append(h, p, meter, count, steps, stepsText, reward, ...(ev.pumpkin ? [pumpkins] : []), actions);
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
        text: won ? `Tu as gagné la carte « ${ev.card.name} »${evBadgeText(ev)} !`
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
// 11/11 (demande de l'utilisateur, « un peu faciles ») : objectifs relevés (`goal2`) et 40 🪙 par mission, à partir du lundi 16/11
// (la semaine en cours garde ses objectifs). Sprint : 12 → 8 (personne n'a jamais dépassé 11).
const MISSIONS_V2_FROM = '2026-11-16';
const missionsV2 = () => weekStart() >= MISSIONS_V2_FROM;
const missionCoins = () => (missionsV2() ? 40 : MISSION_COINS);
const MISSION_POOL = [
    { id: 'levels',   icon: '🗺️', goal: 5,  goal2: 8,  text: n => `Réussis ${n} niveaux du parcours` },
    { id: 'flawless', icon: '✨', goal: 2,  goal2: 3,  text: n => `Réussis ${n} niveaux sans faute` },
    { id: 'order',    icon: '⏳', goal: 2,  text: n => `Réussis ${n} niveaux de frises` },
    { id: 'pairs',    icon: '🔗', goal: 2,  text: n => `Réussis ${n} niveaux de paires` },
    { id: 'daily',    icon: '📅', goal: 4,  goal2: 5,  text: n => `Joue ${n} défis du jour` },
    { id: 'correct',  icon: '✅', goal: 60, goal2: 100, text: n => `Donne ${n} bonnes réponses` },
    { id: 'theme',    icon: '🎓', goal: 12, goal2: 20, text: (n, theme) => `Donne ${n} bonnes réponses en ${theme}` },
    { id: 'training', icon: '🎯', goal: 3,  goal2: 5,  text: n => `Termine ${n} entraînements` },
    { id: 'reviews',  icon: '🔁', goal: 3,  goal2: 4,  text: n => `Termine ${n} révisions` },
    { id: 'sprint',   icon: '⚡', goal: 12, goal2: 8, text: n => `Fais ${n} bonnes réponses en un seul sprint`, max: true },
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
    return picked.map(m => ({ ...m, goal: missionsV2() && m.goal2 ? m.goal2 : m.goal, theme: m.id === 'theme' ? theme : null,
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
    const bar = el('span', 'quest-row-bar is-steps');   // 3 morceaux : un par mission
    list.forEach(m => { const i = el('i', missionProgress(m) >= m.goal ? 'is-me' : ''); bar.append(i); });
    row.replaceChildren(twoLineRow('🗓️ Missions de la semaine', bar, `${done} / ${list.length} réussies`), rowArrow());
    const n = missionsToClaim();
    if (n > 0) row.setAttribute('data-notif', n);
    else row.removeAttribute('data-notif');
}
/** Ligne sur 2 lignes (missions, quête entre duo, 2026-10-28) : titre en haut, petite barre + texte en dessous. */
function twoLineRow(titleText, bar, subText) {
    const main = el('span', 'quest-row-main');
    const title = el('span', 'missions-label');
    title.textContent = titleText;
    const sub = el('span', 'quest-row-sub');
    if (bar) sub.append(bar);
    const txt = el('span', 'quest-row-num');
    txt.textContent = subText;
    sub.append(txt);
    main.append(title, sub);
    return main;
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
                ok.textContent = `✓ +${missionCoins()} 🪙 récupérées`;
                item.append(ok);
            } else {
                const btn = el('button', 'btn btn-green btn-small');
                btn.type = 'button';
                btn.textContent = `🎁 Récupérer +${missionCoins()} 🪙`;
                btn.addEventListener('click', () => {
                    md.claimed[m.id] = true;
                    state.data.coins += missionCoins();
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

/* ---------- Quête en duo (2026-10-27, supabase/quete-duo.sql) ----------
   Chaque semaine, un partenaire (2 joueurs exactement) : un ami libre qui joue, sinon un autre joueur seul tiré au
   hasard, sinon Kulti au bout de 24 h. Les XP de la semaine des deux s'additionnent ; objectif atteint = coffre de
   2 cartes pour chacun. Le tirage est fait en ligne (`quest_join`), mes XP envoyés par `quest_push`. */
// XP que Kulti ajoute chaque jour où l'on joue : de quoi faire la moitié de l'objectif si l'on joue tous les jours
const questKultiDay = goal => Math.round(goal / 14 / 10) * 10;
const QUEST_CARDS = 2;
const QUEST_COINS = 50;   // + pièces pour chacun (2026-10-27, demande de l'utilisateur)
let quest = null;        // quête de la semaine : { week, goal, mine, theirs, partner, kulti, waiting, friend, asked }
let questPrev = null;    // celle de la semaine dernière (pour un coffre pas encore ouvert)
let questReady = false;  // le tirage a répondu (sinon : fichier SQL pas encore lancé → pas de ligne)
let questLastLoad = 0;

const rowArrow = () => { const a = el('span', 'row-arrow'); a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'; return a; };
const fmtNum = n => Math.round(n).toLocaleString('fr-FR');

function questKultiXp(monday, goal) {
    let days = 0;
    for (let i = 0; i < 7; i++) if ((state.data.activeDays[shiftDays(monday, i)] || 0) > 0) days++;
    return days * questKultiDay(goal);
}
const questReached = q => !!q && !q.waiting && q.mine + q.theirs >= q.goal;
function questsToClaim() {
    return [quest, questPrev].filter(q => questReached(q) && !state.data.questDone[q.week]).length;
}

function questFrom(r, profs) {
    const meA = r.a === cloudUser.id;
    const pid = meA ? r.b : r.a;
    const week = String(r.week).slice(0, 10);
    const prof = pid ? profs[pid] : null;
    const look = prof && Number.isInteger(prof.avatar_hue) ? { hue: prof.avatar_hue, emoji: prof.avatar_emoji || null } : null;
    const friend = pid ? league?.friends.find(f => f.id === pid) : null;
    return {
        week, goal: r.goal || 1500, kulti: !!r.kulti && !pid, waiting: !pid && !r.kulti,
        mine: Math.max(weekXp(week), meA ? r.a_xp : r.b_xp),
        theirs: pid ? (meA ? r.b_xp : r.a_xp) : r.kulti ? questKultiXp(week, r.goal || 1500) : 0,
        partner: pid ? { id: pid, pseudo: friend?.pseudo || prof?.pseudo || '?', look: friend?.look || look } : null,
        friend: !!friend, asked: !!league?.outgoing.find(f => f.id === pid)
    };
}

async function questLoad(force = false) {
    if (BAC) {   // bac à sable : une fausse quête avec Léa (rien en ligne)
        const lea = league.friends[0];
        quest = { week: weekStart(), goal: 5000, kulti: false, waiting: false, mine: weekXp(weekStart()), theirs: 640,
            partner: { id: lea.id, pseudo: lea.pseudo, look: lea.look }, friend: true, asked: false };
        questReady = true;
        renderQuestRow();
        return;
    }
    const c = cloudClient();
    if (!c || !cloudUser || !league?.pseudo || !navigator.onLine) { renderQuestRow(); return; }
    if (!force && Date.now() - questLastLoad < 60000) { renderQuestRow(); return; }
    questLastLoad = Date.now();
    try {
        const { data, error } = await c.rpc('quest_join');
        if (error) { questReady = false; renderQuestRow(); return; }   // fichier SQL pas encore lancé
        const r = Array.isArray(data) ? data[0] : data;
        if (!r) return;
        const week = String(r.week).slice(0, 10);
        await c.rpc('quest_push', { p_xp: Math.min(15000, weekXp(week)) });
        const { data: old } = await c.from('quests').select('*').eq('week', shiftDays(week, -7)).maybeSingle();
        const ids = [r, old].filter(Boolean).map(x => (x.a === cloudUser.id ? x.b : x.a)).filter(Boolean);
        const profs = {};
        if (ids.length) {
            const { data: ps } = await c.from('profiles').select('*').in('user_id', ids);
            (ps || []).forEach(p => { profs[p.user_id] = p; });
        }
        quest = questFrom(r, profs);
        questPrev = old ? questFrom(old, profs) : null;
        questReady = true;
    } catch (err) { /* hors ligne : on garde la dernière version */ }
    renderQuestRow();
    updateNavNotifications();
    if (!$('questModal').hidden) openQuestModal();
}

/** Ligne compacte sous les missions : 🤝 Quête entre duo · 640 / 5 000 (›) */
function renderQuestRow() {
    const row = $('questRow');
    if (!row) return;
    row.hidden = false;
    let title = '🤝 Quête entre duo';
    let bar = null;
    let sub;
    if (!cloudUser) sub = 'Crée un compte pour jouer à deux';
    else if (!league?.pseudo) sub = 'Choisis un pseudo pour jouer à deux';
    else if (!questReady || !quest) { row.hidden = true; return; }
    else if (quest.waiting) sub = '🔎 Recherche d’un partenaire…';
    else {
        title = `🤝 Quête entre duo avec ${quest.kulti ? 'Kulti' : quest.partner.pseudo}`;
        bar = el('span', 'quest-row-bar');
        const pct = x => `${Math.min(100, (x / quest.goal) * 100)}%`;
        const f1 = el('i', 'is-me');
        f1.style.width = pct(quest.mine);
        const f2 = el('i', 'is-mate');
        f2.style.width = pct(Math.min(quest.theirs, Math.max(0, quest.goal - quest.mine)));
        bar.append(f1, f2);
        sub = questReached(quest) ? '✓ Réussie !' : `${fmtNum(quest.mine + quest.theirs)} / ${fmtNum(quest.goal)} XP`;
    }
    row.replaceChildren(twoLineRow(title, bar, sub), rowArrow());
    const n = questsToClaim();
    if (n > 0) row.setAttribute('data-notif', n);
    else row.removeAttribute('data-notif');
}

function questClick() {
    if (!cloudUser) { openAuthModal(); return; }
    if (!league?.pseudo) { showScreen('league'); return; }
    openQuestModal();
}

/** Bloc d'une quête : partenaire, barre à deux couleurs, récompense. */
function questBlock(q, past) {
    const box = el('div', 'quest-box');
    const head = el('div', 'quest-head');
    let av;
    if (q.kulti) { av = el('span', 'league-avatar quest-kulti'); av.append(kultiEl('content', 'kulti-blink')); }
    else av = avatarEl(q.partner.pseudo, q.partner.look);
    const who = el('div', 'quest-who');
    const name = el('b');
    name.textContent = q.kulti ? 'Kulti' : q.partner.pseudo;
    const kind = el('small');
    kind.textContent = q.kulti ? 'La mascotte de Kultivo' : q.friend ? 'Ton ami' : 'Joueur tiré au hasard';
    who.append(name, kind);
    head.append(av, who);
    box.append(head);

    const total = q.mine + q.theirs;
    const line = el('div', 'quest-line');
    const a = el('span');
    a.textContent = past ? 'Semaine dernière' : `${fmtNum(total)} / ${fmtNum(q.goal)} XP`;
    const b = el('span', 'muted');
    b.textContent = past ? `${fmtNum(total)} / ${fmtNum(q.goal)} XP` : `⏳ ${vitrineTimeLeft()}`;
    line.append(a, b);
    const bar = el('div', 'quest-bar');
    const pct = x => `${Math.min(100, (x / q.goal) * 100)}%`;
    const f1 = el('i', 'is-me');
    f1.style.width = pct(q.mine);
    const f2 = el('i', 'is-mate');
    f2.style.width = pct(Math.min(q.theirs, Math.max(0, q.goal - q.mine)));
    bar.append(f1, f2);
    const legend = el('div', 'quest-legend');
    const l1 = el('span', 'is-me');
    l1.textContent = `Toi ${fmtNum(q.mine)}`;
    const l2 = el('span', 'is-mate');
    l2.textContent = `${q.kulti ? 'Kulti' : q.partner.pseudo} ${fmtNum(q.theirs)}`;
    legend.append(l1, l2);
    box.append(line, bar, legend);
    if (q.kulti) {
        const note = el('p', 'quest-note');
        note.textContent = `Personne n’était libre : Kulti joue avec toi cette semaine. Il ajoute ${questKultiDay(q.goal)} XP chaque jour où tu joues.`;
        box.append(note);
    }

    const done = state.data.questDone[q.week];
    if (questReached(q) && !done) {
        const btn = el('button', 'btn btn-violet btn-full');
        btn.type = 'button';
        btn.textContent = `🎁 ${QUEST_CARDS} cartes + ${QUEST_COINS} 🪙`;
        btn.addEventListener('click', () => {
            state.data.questDone[q.week] = true;
            state.data.coins += QUEST_COINS;
            saveData();
            renderHeader();
            $('questModal').hidden = true;
            renderQuestRow();
            updateNavNotifications();
            openCardBoxes([{ size: QUEST_CARDS, rare: false }], `🤝 Quête réussie avec ${q.kulti ? 'Kulti' : q.partner.pseudo} ! +${QUEST_COINS} 🪙`);
        });
        box.append(btn);
    } else {
        const chest = el('div', `mission-chest${done ? ' is-open' : ''}`);
        chest.textContent = done ? '🎁 Coffre ouvert. Nouvelle quête lundi !'
            : past ? 'Objectif pas atteint.' : `🎁 ${fmtNum(q.goal)} XP à vous deux = ${QUEST_CARDS} cartes + ${QUEST_COINS} 🪙 pour chacun.`;
        box.append(chest);
    }
    if (q.partner && !q.friend && !past) {
        const add = el('button', 'btn btn-ghost btn-full');
        add.type = 'button';
        add.textContent = q.asked ? '✓ Demande d’ami envoyée' : `👥 Ajouter ${q.partner.pseudo} en ami`;
        add.disabled = q.asked;
        add.addEventListener('click', async () => {
            add.disabled = true;
            const c = cloudClient();
            const { error } = c ? await c.from('friendships').insert({ requester: cloudUser.id, addressee: q.partner.id }) : { error: true };
            if (error) { add.disabled = false; showToast('Impossible pour le moment. Réessaie.'); return; }
            q.asked = true;
            add.textContent = '✓ Demande d’ami envoyée';
            leagueLoad();
        });
        box.append(add);
    }
    return box;
}

function openQuestModal() {
    const body = $('questBody');
    body.replaceChildren();
    if (questPrev && questReached(questPrev) && !state.data.questDone[questPrev.week]) body.append(questBlock(questPrev, true));
    if (!quest) {
        const p = el('p', 'muted');
        p.textContent = 'Connexion impossible pour le moment. Réessaie plus tard.';
        body.append(p);
    } else if (quest.waiting) {
        const box = el('div', 'quest-box quest-wait');
        const k = el('div', 'quest-wait-kulti');
        k.append(kultiEl('parle', 'kulti-blink kulti-float'));
        const p = el('p');
        p.textContent = 'Je te cherche un partenaire… Dès qu’un autre joueur ouvre Défis, vous ferez équipe. Si personne n’arrive d’ici demain, c’est moi qui jouerai avec toi !';
        box.append(k, p);
        body.append(box);
    } else body.append(questBlock(quest, false));
    $('questModal').hidden = false;
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
    const current = document.querySelector('.node.is-current:not(.is-optional)');
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
        if (!ev && babyDecorOn()) {   // semaine « Bienvenue bébé » : bleu à gauche, rose à droite
            const left = i % 2 === 0;
            const set = left ? BABY_DECOR.blue : BABY_DECOR.pink;
            badge.textContent = set[Math.floor(i / 2) % set.length];
            badge.classList.add(left ? 'baby-blue' : 'baby-pink');
            badge.dataset.baby = '1';
            badge.dataset.fact = String(i);
        } else if (ev) {   // événement en cours : tout le décor à son thème, avec ses anecdotes
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
    
    unclaimedGoals += missionsToClaim() + questsToClaim();
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


/** Onglet touché alors qu'il a une pastille : défile jusqu'à ce qui attend (coffre, objectif, badge…) et le fait briller. */
function goToNotif(screen) {
    const d = state.data;
    let find = null;
    if (screen === 'map') find = () => document.querySelector('.chest-node.is-ready');
    if (screen === 'challenges') {
        setChallengesTab('defis');
        find = () => (dayXpNow() >= d.goal && !d.claimedGoals[todayKey()] && document.querySelector('.goal-card'))
            || (missionsToClaim() && $('missionsRow')) || (questsToClaim() && $('questRow'));
    }
    if (screen === 'league') find = () => document.querySelector('.league-recap') || document.querySelector('.league-request') || document.querySelector('.duel-row[data-notif]');
    if (screen === 'profile') {
        const badges = Object.keys(d.badges).some(b => !d.claimedBadges[b]);
        if (recapUnseen()) find = () => $('monthRecapBtn');
        else if ($('avatarBtn').hasAttribute('data-notif')) find = () => $('avatarBtn');
        else if (badges) { setProfileTab('badges'); find = () => document.querySelector('#badgeGrid .bdf-tile.is-claim, #badgeGrid .badge .btn-green'); }
        else if (pendingShinyCount()) { setProfileTab('cards'); find = () => document.querySelector('#profileGrid .is-pending'); }
    }
    if (!find) return;
    setTimeout(() => {
        let t = find();
        if (!t || t.hidden) return;
        if (t.matches('.btn-green')) t = t.closest('.badge') || t;
        t.scrollIntoView({ behavior: 'smooth', block: 'center' });
        t.classList.remove('notif-flash');
        void t.offsetWidth;
        t.classList.add('notif-flash');
        setTimeout(() => t.classList.remove('notif-flash'), 1800);
    }, 250);
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
        // 11/11 : encadré bien visible avec le nombre de gouttes bonus encore possibles aujourd'hui
        const earn = $('dropsEarn');
        earn.replaceChildren();
        const big = el('b', 'drops-earn-n');
        big.textContent = left > 0 ? `${left} / ${DROPS_PRACTICE_DAY}` : '✅';
        const txt = el('span');
        txt.textContent = left > 0 ? `gouttes bonus encore possibles aujourd’hui : +1 💧 par révision ou entraînement réussi`
            : `Tes ${DROPS_PRACTICE_DAY} gouttes bonus du jour sont gagnées.`;
        earn.append(big, txt);
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

        // Niveau pas fait AVANT le niveau en cours (niveaux insérés le 2026-11-03) : facultatif, même couleur, sans anneau
        const status = locked ? 'is-locked' : done ? 'is-done' : n === state.data.unlocked ? 'is-current' : 'is-current is-optional';
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

        if (!locked && (!done || n === state.data.unlocked) && !mapFocusLevel) focusNode = btn;
        if (mapFocusLevel && n === mapFocusLevel) focusNode = btn;   // niveau refait : on revient juste après lui
        if (n % CHEST_EVERY === 0) list.append(chestStop(n));
    }

    renderMapFriends();
    placeMapKulti();
    if (focusNode) focusNode.scrollIntoView({ block: 'center' });
    mapFocusLevel = 0;
    if (PAL_ELEC) requestAnimationFrame(drawMapTrail);
    if (kultiHop) startKultiHop();
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
    const pending = kultiPending();   // défi du jour pas encore fait : Kulti est réveillé, avec une pastille
    const sleepy = kultiSleepy() && !pending;
    const ev = currentEvent();
    const btn = el('button', `map-kulti ${right ? 'is-right' : 'is-left'}`);
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Kulti, la mascotte');
    // chapeau : celui de l'événement en cours, sinon la couronne du sommet (dernier niveau réussi, 10/11)
    btn.append(kultiEl(sleepy ? 'dort' : 'content', sleepy ? '' : 'kulti-blink kulti-float', false, ev ? ev.bank : state.data.summitDone ? 'crown' : null));
    if (sleepy) {
        const z = el('span', 'map-kulti-zzz');
        z.innerHTML = '<i>Z</i><i>z</i><i>z</i>';
        btn.append(z);
    }
    if (pending) {
        const b = el('span', 'map-kulti-badge');
        b.textContent = '!';
        btn.append(b);
    }
    btn.addEventListener('click', e => { e.stopPropagation(); if (kultiPending() || BAC) openKultiDefi(); else kultiSay(btn); });
    if (right) stop.classList.add('has-kulti-right');
    stop.append(btn);
}
/* ---------- Kulti ouvre le niveau suivant (2026-10-28, aperçu : apercu-propositions.html) ----------
   Niveau réussi → au retour sur le parcours, Kulti saute 3 fois jusqu'au niveau débloqué, secoue le cadenas, qui s'envole,
   et le niveau s'allume. Une fois par niveau débloqué, avec son (réglage `sound`). Un tap la termine tout de suite. */
let kultiHop = 0;          // niveau qui vient d'être débloqué (pas sauvegardé : appli fermée = pas d'animation)
let kultiHopRun = 0;
const KULTI_HOP_WAIT = '.modal-overlay:not([hidden]), #titleAnim:not([hidden]), #medalAnim:not([hidden]), #collectionAnim:not([hidden]), #summitAnim:not([hidden]), #streakAnim:not([hidden]), #freezeAnim:not([hidden]), #tour:not([hidden]), .recap-story:not([hidden])';
function startKultiHop(tries = 0) {
    const to = kultiHop;
    if (!to || $('mapScreen').hidden) return;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || to !== Math.min(state.data.unlocked, MAX_LEVEL) || to < 2) { kultiHop = 0; return; }
    if (document.querySelector(KULTI_HOP_WAIT)) {   // une fenêtre ou une fête est ouverte : on attend qu'elle se ferme
        if (tries < 60) setTimeout(() => startKultiHop(tries + 1), 400);
        return;
    }
    kultiHop = 0;
    playKultiHop(to - 1, to);
}
async function playKultiHop(from, to) {
    const run = ++kultiHopRun;
    const fromStop = document.querySelector(`.stop[data-level="${from}"]`);
    const toStop = document.querySelector(`.stop[data-level="${to}"]`);
    const kb = toStop?.querySelector('.map-kulti');
    const node = toStop?.querySelector('.node');
    if (!fromStop || !kb || !node) return;
    // Le niveau a l'air encore fermé pendant l'animation
    const nodeClass = node.className;
    node.classList.remove('is-current');
    node.classList.add('is-locked');
    const lock = el('span', 'node-lock');
    lock.textContent = '🔒';
    node.append(lock);
    const target = kb.getBoundingClientRect();
    const right = (parseFloat(fromStop.style.getPropertyValue('--x')) || 0) <= 0;
    kb.classList.toggle('is-right', right);
    kb.classList.toggle('is-left', !right);
    fromStop.append(kb);
    fromStop.style.zIndex = '6';   // Kulti passe devant les niveaux du dessus pendant les sauts
    const start = kb.getBoundingClientRect();
    const dx = target.left - start.left, dy = target.top - start.top;
    const face = mood => kb.firstElementChild.replaceWith(kultiEl(mood, 'kulti-blink', false, currentEvent()?.bank || null));
    face('content');
    let done = false;
    const finish = () => {
        if (done) return;
        done = true;
        kultiHopRun++;
        document.removeEventListener('pointerdown', finish, true);
        node.className = nodeClass;
        lock.remove();
        fromStop.style.zIndex = '';
        placeMapKulti();
    };
    document.addEventListener('pointerdown', finish, true);   // un tap : tout de suite à la fin
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const hop = (k0, k1, ms, h) => new Promise(res => {
        const t0 = performance.now();
        const step = t => {
            if (run !== kultiHopRun) return res();
            const k = Math.min(1, (t - t0) / ms);
            const f = k0 + (k1 - k0) * k;
            const sq = k > 0.85 ? 1 - (1 - k) * 0.6 : 1;   // petit écrasement à l'atterrissage
            kb.style.transform = `translate(${dx * f}px, ${dy * f - Math.sin(Math.PI * k) * h}px)`;
            kb.firstElementChild.style.transform = k > 0.85 && k < 1 ? `scale(${2 - sq}, ${sq})` : '';
            if (k < 1) requestAnimationFrame(step); else res();
        };
        requestAnimationFrame(step);
    });
    await wait(450);
    for (let i = 0; i < 3; i++) {
        if (run !== kultiHopRun) return;
        playSound('hop', i * 2);
        await hop(i / 3, (i + 1) / 3, 380, 40);
    }
    if (run !== kultiHopRun) return;
    face('surpris');
    lock.classList.add('is-shaking');
    playSound('rattle');
    await wait(700);
    if (run !== kultiHopRun) return;
    lock.classList.remove('is-shaking');
    lock.classList.add('is-flying');
    playSound('unlock');
    await wait(450);
    if (run !== kultiHopRun) return;
    node.className = nodeClass;
    node.classList.add('is-unlocking');
    face('fier');
    const r = node.getBoundingClientRect(), p = toStop.getBoundingClientRect();
    for (let i = 0; i < 8; i++) {
        const sp = el('span', 'hop-spark');
        sp.textContent = '✨';
        sp.style.left = `${r.left - p.left + r.width / 2 - 10}px`;
        sp.style.top = `${r.top - p.top + r.height / 2 - 10}px`;
        const a = (i / 8) * Math.PI * 2;
        sp.style.setProperty('--dx', `${Math.cos(a) * 60}px`);
        sp.style.setProperty('--dy', `${Math.sin(a) * 60}px`);
        toStop.append(sp);
        setTimeout(() => sp.remove(), 900);
    }
    await wait(1100);
    if (run !== kultiHopRun) return;
    lock.remove();
    node.classList.remove('is-unlocking');
    finish();
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
    // 12/11 : un peu de caractère (moment de la journée, thème où il est moins à l'aise, petites blagues de cerveau)
    const h = new Date().getHours();
    lines.push(h < 11 ? 'Bonjour ! Mes neurones sont réveillés, et les tiens ?' : h < 14 ? 'Une question avant de manger ?' : h < 18 ? 'Une petite pause culture G ?' : 'Un niveau avant le dîner ?');
    const weak = themeStats().filter(t => t.tries >= 10).sort((a, b) => a.right / a.tries - b.right / b.tries)[0];
    if (weak) lines.push(`Je te sens moins à l’aise en ${weak.theme}… On s’y met dans l’entraînement ?`);
    lines.push(pickOne(['Je suis un cerveau, mais sans toi je ne pense à rien !', 'Chaque bonne réponse me fait pousser un neurone 🌱', 'Psst… Tu savais que je sais tout ? Enfin presque.', 'Ne le dis à personne : moi aussi je confonds Autriche et Australie.']));
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
    // La bulle s'en va toute seule après le temps de lecture (4 à 9 s)
    clearTimeout(kultiSayTimer);
    const text = $('factText').textContent;
    kultiSayTimer = setTimeout(() => { if ($('factTitle').textContent === '🧠 Kulti' && $('factText').textContent === text) bubble.hidden = true; },
        Math.min(9000, Math.max(4000, 1500 + text.length * 50)));
}
let kultiSayTimer = null;

/* ---------- Le défi de Kulti (2026-10-27, aperçu : apercu-amis.html) ----------
   Une fois par jour, une pastille « ! » sur Kulti (parcours). Un tap : un mini-défi, différent selon les jours,
   gratuit (ni goutte ni cœurs), un seul essai, des pièces si réussi (pas d'XP : la ligue reste juste).
   Bac à sable : un nouveau défi à chaque fois qu'on le touche après l'avoir fait. */
const KULTI_CHRONO_GOAL = 5;
const KULTI_CHRONO_SECONDS = 45;
const KULTI_FROM_LEVEL = 3;   // pas pendant les tout premiers niveaux
const KULTI_DEFIS = {
    theme: { icon: '🎯', coins: 15, text: k => `3 questions de ${k.theme}, sans faute.` },
    chrono: { icon: '⏱️', coins: 15, text: () => `${KULTI_CHRONO_GOAL} bonnes réponses en ${KULTI_CHRONO_SECONDS} secondes.` },
    wrong: { icon: '🤔', coins: 10, text: () => 'Je me suis trompé à une question… À toi de donner la bonne réponse !' },
    revanche: { icon: '🔁', coins: 15, text: () => '3 questions que tu as ratées : prouve que tu les sais maintenant, sans faute.' },
    flag: { icon: '🚩', coins: 10, text: () => 'Un drapeau difficile, un seul essai.' },
    rebus: { icon: '🧩', coins: 10, text: () => 'Un rébus, un seul essai.' },
    pointue: { icon: '🧠', coins: 20, text: () => 'Une question très dure, un seul essai.' },
    tf: { icon: '✅', coins: 15, need: 4, text: () => '5 affirmations : vrai ou faux ? 4 bonnes réponses sur 5 pour gagner.' },
    annee: { icon: '📅', coins: 15, need: 2, text: () => '3 dates à trouver, à 5 ans près. 2 justes sur 3 pour gagner.' },
    frise: { icon: '⏳', coins: 15, text: () => '4 cartes à remettre dans l’ordre, du premier coup.' },
    paires: { icon: '🔗', coins: 10, text: () => '4 paires à associer, sans aucune erreur.' }
};
const kultiNeed = (kind, total) => KULTI_DEFIS[kind].need || total;   // bonnes réponses nécessaires

/** Questions « de mon niveau » : déjà vues, sinon celles des niveaux déjà ouverts. */
function kultiPool() {
    const d = state.data;
    const all = allQuestionsPool();
    const seen = all.filter(q => d.stats[q.id]);
    return seen.length >= 40 ? seen : all.filter(q => d.stats[q.id] || (q.id < 10000 && (q.niveau || 999) <= d.unlocked));
}
const kultiMissed = () => allQuestionsPool().filter(q => missCount(q.id) > 0 && streakOf(q.id) === 0 && !isLater(q.id));
const kultiPlain = q => !q.photo && !q.flag && !q.rebus;

/** Thème où l'on se trompe le plus (au moins 5 questions vues), sinon au hasard. */
function kultiWeakTheme(rnd, pool) {
    const by = {};
    for (const q of pool) {
        const s = state.data.stats[q.id];
        if (!s || !kultiPlain(q)) continue;
        const t = by[q.theme] || (by[q.theme] = { n: 0, miss: 0 });
        t.n++;
        t.miss += s.miss ? 1 : 0;
    }
    const weak = Object.entries(by).filter(([, t]) => t.n >= 5).sort((a, b) => b[1].miss / b[1].n - a[1].miss / a[1].n);
    if (weak.length && rnd() < 0.7) return weak[Math.floor(rnd() * Math.min(3, weak.length))][0];
    const themes = [...new Set(pool.filter(kultiPlain).map(q => q.theme))];
    return themes[Math.floor(rnd() * themes.length)];
}

/** Le défi du jour de Kulti (tiré une fois par jour, propre à chaque joueur). */
function kultiToday() {
    const d = state.data;
    if (d.kulti?.day === todayKey()) return d.kulti;
    const rnd = mulberry32(hashString(`kulti-${todayKey()}-${d.playerSeed}${BAC ? Date.now() : ''}`));
    const pool = kultiPool();
    const all = allQuestionsPool();
    const kinds = ['theme', 'chrono', 'wrong', 'pointue', 'flag', 'rebus', 'tf', 'annee', 'frise', 'paires'];
    if (kultiMissed().length >= 3) kinds.push('revanche', 'revanche');
    if (!all.some(q => q.flag)) kinds.splice(kinds.indexOf('flag'), 1);
    if (!all.some(q => q.rebus)) kinds.splice(kinds.indexOf('rebus'), 1);
    let kind = kinds[Math.floor(rnd() * kinds.length)];
    if (kind === d.kulti?.kind) kind = kinds[(kinds.indexOf(kind) + 1) % kinds.length];   // pas deux jours pareils
    d.kulti = { day: todayKey(), kind, theme: kind === 'theme' ? kultiWeakTheme(rnd, pool) : null, done: false, won: false };
    saveData();
    return d.kulti;
}
const kultiPending = () => state.data.unlocked >= KULTI_FROM_LEVEL && !kultiToday().done;

/** Questions du défi. */
function kultiItems(k) {
    const pool = kultiPool();
    const all = allQuestionsPool();
    const weakFirst = list => shuffle(list).sort((a, b) => streakOf(a.id) - streakOf(b.id));
    const one = q => ({ q, review: false });
    if (k.kind === 'theme') return weakFirst(pool.filter(q => q.theme === k.theme && kultiPlain(q))).slice(0, 3).map(one);
    if (k.kind === 'chrono') return shuffle(pool.filter(q => kultiPlain(q) && q.d <= 3)).slice(0, 40).map(one);
    if (k.kind === 'revanche') return shuffle(kultiMissed()).slice(0, 3).map(q => ({ q, review: true }));
    if (k.kind === 'flag') return weakFirst(all.filter(q => q.flag && q.d >= 3)).slice(0, 1).map(one);
    if (k.kind === 'rebus') return shuffle(all.filter(q => q.rebus)).slice(0, 1).map(one);
    if (k.kind === 'tf') return shuffle(KULTI_TF.map((t, i) => [t, i])).slice(0, 5).map(([[text, truth, exp], i]) => one({
        id: `ktf-${i}`, theme: '🧠 Kulti', d: 2, q: text, a: [truth ? 'Vrai' : 'Faux'], exp, tf: true, kulti: true }));
    if (k.kind === 'annee') return shuffle(KULTI_YEARS.map((t, i) => [t, i])).slice(0, 3).map(([[text, year, exp], i]) => one({
        id: `kyr-${i}`, theme: '🧠 Kulti', d: 2.5, q: text, a: [String(year)], exp, year, kulti: true }));
    if (k.kind === 'frise') {   // une frise de 4 cartes, à la difficulté du joueur
        const t = pairTarget(Math.min(state.data.unlocked, MAX_LEVEL));
        const fams = ORDER_FAMILIES.filter(f => f.items.filter(it => Math.abs(it[3] - t) <= 1.2).length >= 4);
        const family = shuffle(fams.length ? fams : ORDER_FAMILIES)[0];
        return [{ family, items: pickOrderItems(family, t, 4, (state.data.unlocked - 1) / Math.max(1, MAX_LEVEL - 1)), placed: [], checked: false }];
    }
    if (k.kind === 'paires') {   // une grille de 4 paires
        const t = pairTarget(Math.min(state.data.unlocked, MAX_LEVEL));
        const fams = PAIR_FAMILIES.filter(f => f.pairs.filter(p => Math.abs(p[2] - t) <= 1.2).length >= PAIRS_PER_GRID);
        const family = shuffle(fams.length ? fams : PAIR_FAMILIES)[0];
        return [{ family, pairs: pickPairs(family, t).slice(0, 4), matched: new Set(), failed: new Set(), order: null }];
    }
    if (k.kind === 'pointue') return weakFirst(all.filter(q => q.d >= 4.5 && !isMastered(q.id))).slice(0, 1).map(one);
    // « Kulti s'est trompé » : sa mauvaise réponse = la réponse d'une autre question DU MÊME THÈME qui commence par
    // les mêmes 3 mots (« Qui a peint… », « Dans quel pays se… », « Combien de joueurs… ») : une réponse proche, jamais absurde
    const head = q => {
        const w = q.q.toLowerCase().replace(/[’']/g, ' ').replace(/[^a-zà-ÿœæ0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
        return w.slice(0, ['dans', 'en', 'de', 'à', 'au', 'sur', 'par', 'pour', 'avec', 'chez'].includes(w[0]) ? 4 : 3).join(' ');
    };
    const vague = h => /\b(est|sont|s|appelle|appellent|nomme|était|étaient)\b/.test(h);
    const num = a => /^\d/.test(a);
    for (const q of shuffle(pool.filter(kultiPlain))) {
        const h = head(q);
        if (vague(h)) continue;
        const decoy = shuffle(all.filter(o => o.id !== q.id && o.theme === q.theme && kultiPlain(o) && head(o) === h && num(o.a[0]) === num(q.a[0])))
            .map(o => o.a[0]).find(a => a.length <= 30 && judge(a, q.a, q.q) === 'wrong');
        if (decoy) return [{ q: { ...q, kultiSaid: decoy }, review: false }];
    }
    return [];
}

async function openKultiDefi() {
    if (BAC && kultiToday().done) state.data.kulti = null;   // bac à sable : un autre défi pour essayer tous les formats
    const k = kultiToday();
    const def = KULTI_DEFIS[k.kind];
    const go = await askConfirm({
        art: kultiEl('parle', 'kulti-blink kulti-float kulti-talking'),
        title: '🎯 Le défi de Kulti',
        text: `${def.icon} ${def.text(k)}\nRéussi : +${def.coins} 🪙. Gratuit, sans cœurs, un seul essai aujourd’hui !`,
        yes: 'C’est parti !',
        no: 'Plus tard'
    });
    if (!go) return;
    state.kultiItems = kultiItems(k);
    k.done = true;   // un seul essai : quitter compte comme raté
    saveData();
    if (!state.kultiItems.length) { k.done = true; saveData(); placeMapKulti(); showToast('Kulti n’a pas trouvé de défi aujourd’hui. À demain !'); return; }
    startSession('kulti');
}

/** Fin du défi : pièces si réussi, rien sinon. Un seul essai par jour. */
function endKulti() {
    const k = kultiToday();
    const def = KULTI_DEFIS[k.kind];
    const won = k.kind === 'chrono' ? state.correct >= KULTI_CHRONO_GOAL
        : k.kind === 'frise' ? state.orderTotal > 0 && state.orderRight === state.orderTotal
        : k.kind === 'paires' ? state.errors === 0 && state.pairGrids[0]?.matched.size === state.pairGrids[0]?.pairs.length
        : state.correct >= kultiNeed(k.kind, state.total);
    k.done = true;
    k.won = won;
    if (won) {
        state.data.coins += def.coins;
        launchConfetti();
    }
    saveData();
    renderHeader();
    const seconds = Math.round((Date.now() - state.startedAt) / 1000);
    setEnd({
        emoji: won ? '🏆' : '🎯',
        face: won ? 'fier' : 'triste',
        title: won ? 'Défi relevé !' : 'Raté pour aujourd’hui',
        text: won ? `+${def.coins} 🪙 · Reviens demain pour un nouveau défi.`
            : k.kind === 'chrono' ? `${state.correct} / ${KULTI_CHRONO_GOAL} bonnes réponses. Retente demain : j’aurai un nouveau défi pour toi !`
            : 'Retente demain : j’aurai un nouveau défi pour toi !',
        extra: k.kind === 'chrono' ? `⏱️ ${Math.min(seconds, KULTI_CHRONO_SECONDS)} s` : ['frise', 'paires'].includes(k.kind) ? '' : state.grid.join(''),
        primary: 'Retour au parcours',
        primaryClass: 'btn-green',
        onPrimary: returnToMap
    });
}

/* ---------- Série d'amis 🔥🤝 (2026-10-27) ----------
   Avec chaque ami : nombre de jours d'affilée où vous avez joué TOUS LES DEUX (gels de série compris).
   Les jours joués de l'ami viennent de son résumé (`summary.days`, 60 derniers jours). */
const FRIEND_DAYS = 60;
function myPlayedDays() {
    const d = state.data;
    const out = [];
    for (let i = 0; i < FRIEND_DAYS; i++) {
        const k = shiftDays(todayKey(), -i);
        if ((d.activeDays[k] || 0) > 0 || d.frozenDays[k]) out.push(k);
    }
    return out;
}
/** { n: jours d'affilée ensemble, today: déjà joué tous les deux aujourd'hui } ; null si l'ami a une vieille version. */
function friendStreak(f) {
    if (!Array.isArray(f.summary?.days)) return null;
    const theirs = new Set(f.summary.days);
    const mine = new Set(myPlayedDays());
    const both = k => mine.has(k) && theirs.has(k);
    const today = todayKey();
    let k = both(today) ? today : shiftDays(today, -1);
    let n = 0;
    while (both(k) && n < FRIEND_DAYS) { n++; k = shiftDays(k, -1); }
    return { n, today: both(today) };
}
/** Tap sur la pastille 🔥🤝 : ce que c'est, et où on en est aujourd'hui. */
function explainFriendStreak(f, fs) {
    const today = todayKey();
    const meToday = myPlayedDays().includes(today);
    const themToday = (f.summary?.days || []).includes(today);
    const lines = [fs.n ? `Vous avez joué tous les deux ${plural(fs.n, 'jour', 'jours')} d’affilée.` : `Pas encore de série avec ${f.pseudo}.`];
    lines.push('');
    if (fs.today) lines.push('✅ Vous avez joué tous les deux aujourd’hui : la série continue !');
    else {
        lines.push(`Aujourd’hui : toi ${meToday ? '✅' : '⏳'} · ${f.pseudo} ${themToday ? '✅' : '⏳'}`);
        lines.push(fs.n ? `Jouez tous les deux avant minuit pour passer à ${fs.n + 1} jours, sinon la série retombe à 0.`
            : 'Jouez tous les deux aujourd’hui pour commencer votre série !');
    }
    lines.push('');
    lines.push('Comme ta série 🔥 : une partie par jour suffit (niveau, révision, entraînement ou défi).');
    askConfirm({ title: `🔥🤝 Série avec ${f.pseudo}`, text: lines.join('\n'), yes: 'Compris', no: null });
}
/** Ligne de l'écran de fin, le jour où ma 1re partie fait gagner un jour à une série d'amis (la plus longue). */
function friendStreakLine() {
    if (!league?.friends?.length || state.dayXpStart > 0 || dayXpNow() <= 0) return '';
    const best = league.friends.map(f => ({ f, s: friendStreak(f) }))
        .filter(x => x.s?.today && x.s.n >= 2).sort((a, b) => b.s.n - a.s.n)[0];
    return best ? `🔥🤝 Série avec ${best.f.pseudo} : ${best.s.n} jours !` : '';
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
const parcoursRecapUnseen = () => state.data.summitDone && !state.data.parcoursRecapSeen ? 1 : 0;   // 13/11
const recapUnseen = () => { if (parcoursRecapUnseen()) return 1; const r = recapToShow(); return r && r.unseen ? 1 : 0; };
function renderMonthRecapBtn() {
    const btn = $('monthRecapBtn');
    if (parcoursRecapUnseen()) {   // 13/11 : récap du parcours pas encore vu → bouton avec pastille (aussi dans Records, pour toujours)
        btn.hidden = false;
        btn.textContent = '🏔️ Ton récap du parcours';
        btn.setAttribute('data-notif', 1);
        btn.onclick = () => openParcoursRecap();
        return;
    }
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
    if (r.answers > 0) slides.push({ bg: PAL_ELEC ? 'linear-gradient(160deg,#12b3a8,#0c857c)' : 'linear-gradient(160deg,#1cb0f6,#3b6cf6)', big: fmt(r.answers), h: r.answers > 1 ? 'questions répondues' : 'question répondue',
        p: `dont ${fmt(r.right)} justes (${Math.round(r.right / r.answers * 100)} %)` });
    if (r.xp > 0) slides.push({ bg: PAL_ELEC ? 'linear-gradient(160deg,#3d8bff,#1c5bd6)' : 'linear-gradient(160deg,#58cc02,#2f8f00)', big: fmt(r.xp), h: 'XP gagnés',
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
let recapMonth = null;
let recapLeft = 0, recapStart = 0, recapDown = 0, recapFromQueue = false;
/** Calque des récaps (mois ou parcours) : tap à droite = suivant, à gauche = retour, doigt appuyé = pause (10/11). */
function recapOverlay() {
    let ov = $('recapStory');
    if (!ov) {
        ov = el('div', 'recap-story');
        ov.id = 'recapStory';
        ov.setAttribute('role', 'dialog');
        ov.innerHTML = '<div class="recap-prog"></div><button type="button" class="recap-x" aria-label="Fermer">✕</button><div class="recap-slide"></div>';
        document.body.append(ov);
        ov.querySelector('.recap-x').addEventListener('click', e => { e.stopPropagation(); closeRecap(); });
        const slide = ov.querySelector('.recap-slide');
        const bar = () => ov.querySelector('.recap-prog .is-cur b');
        slide.addEventListener('pointerdown', e => {
            if (e.target.closest('button')) return;
            recapDown = performance.now();
            clearTimeout(recapTimer);
            recapLeft -= performance.now() - recapStart;
            if (bar()) bar().style.animationPlayState = 'paused';
        });
        const resume = () => {
            if (bar()) bar().style.animationPlayState = 'running';
            recapStart = performance.now();
            clearTimeout(recapTimer);
            if (recapIdx < recapSlides.length - 1) recapTimer = setTimeout(() => showRecapSlide(recapIdx + 1), Math.max(300, recapLeft));
        };
        slide.addEventListener('pointerup', e => {
            if (e.target.closest('button') || !recapDown) return;
            const long = performance.now() - recapDown > 300;
            recapDown = 0;
            if (long) { resume(); return; }   // appui long : on reprend là où on en était
            const r = slide.getBoundingClientRect();
            const next = e.clientX - r.left > r.width / 3;
            if (next && recapIdx >= recapSlides.length - 1) closeRecap(); else showRecapSlide(recapIdx + (next ? 1 : -1));
        });
        slide.addEventListener('pointercancel', () => { recapDown = 0; resume(); });
    }
    ov.hidden = false;
    return ov;
}
function openRecap(m) {
    recapMonth = m;
    recapSlides = recapSlidesFor(m);
    if (!state.data.recapSeen[m]) { state.data.recapSeen[m] = todayKey(); saveData(); }
    recapOverlay();
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
    if (s.face) { const k = el('div', 'recap-kulti'); k.append(kultiEl(s.face, 'kulti-blink kulti-float', false, s.crown ? 'crown' : null)); sl.append(k); }
    if (s.big) { const b = el('div', 'recap-big'); b.textContent = s.big; sl.append(b); }
    const h = el('h3');
    h.textContent = s.h;
    sl.append(h);
    if (s.node) sl.append(s.node());
    if (s.p) { const p = el('p'); p.textContent = s.p; sl.append(p); }
    if (RECAP_SHARE && recapIdx === recapSlides.length - 1) {
        const share = el('button', 'btn recap-share-btn');
        share.type = 'button';
        share.textContent = recapMonth === 'parcours' ? '📤 Partager mon parcours' : '📤 Partager mon mois';
        share.addEventListener('click', e => { e.stopPropagation(); openRecapShare(recapMonth); });
        sl.append(share);
    }
    // Temps de lecture selon la longueur du texte (2026-10-27 : la « bête noire » passait trop vite) : 5 à 14 s ;
    // récap du parcours (10/11, « on n'a pas le temps de tout lire ») : 9 à 16 s
    const len = sl.textContent.length;
    const ms = recapMonth === 'parcours' ? Math.min(16000, Math.max(9000, 3500 + len * 55)) : Math.min(14000, Math.max(5000, 2500 + len * 60));
    const bar = ov.querySelector('.recap-prog .is-cur b');
    if (bar) bar.style.animationDuration = `${ms}ms`;
    clearTimeout(recapTimer);
    recapLeft = ms;
    recapStart = performance.now();
    if (recapIdx < recapSlides.length - 1) recapTimer = setTimeout(() => showRecapSlide(recapIdx + 1), ms);
}

/* ---------- Récap du parcours (2026-11-10, aperçu apercu-recap-parcours.html) ----------
   Après la fête du sommet (« Incroyable ! ») : le parcours entier en « stories », comme le récap du mois, avec les vrais chiffres
   de la sauvegarde (depuis la remise à zéro du 20/10). « Avec tes amis » seulement avec un compte et des amis / duels.
   Pour toujours dans Records → « 🏔️ Mon récap du parcours ». Bac à sable : option. */
const fmtDay = key => `${Number(key.slice(8, 10))}${key.slice(8, 10) === '01' ? 'er' : ''} ${MONTH_NAMES[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`;
function parcoursRecap() {
    const d = state.data;
    const days = Object.keys(d.activeDays || {}).filter(k => d.activeDays[k] > 0).sort();
    const summit = d.summitDone || todayKey();
    const first = days[0] || summit;
    const span = Math.max(1, Math.round((new Date(summit) - new Date(first)) / 86400000) + 1);
    const played = days.filter(k => k >= first && k <= summit).length || 1;
    const themes = profileThemeStats().filter(t => t.tries >= 10).map(t => ({ ...t, rate: Math.round(t.right / t.tries * 100) })).sort((a, b) => b.rate - a.rate);
    let resisted = null;
    for (const id in d.stats) {
        const st = d.stats[id], miss = (st.tries || 0) - (st.right || 0);
        if (st.right >= 1 && miss >= 2 && (!resisted || miss > resisted.miss)) { const q = anyQuestion(id); if (q) resisted = { q, miss }; }
    }
    const podium = Object.values(d.podium || {});
    const owned = CARDS.filter(c => d.cards[c.id] > 0).length;
    return {
        first, summit, span, played, themes, resisted,
        start: d.placement && d.placement.start > 1 ? d.placement.start : 0,
        tries: d.totals.tries || 0, right: d.totals.right || 0, xp: d.xp || 0,
        title: titleFor(d.xp || 0),
        flawless: d.totals.flawless || 0,
        bestStreak: Math.max(d.best.streak || 0, d.streak || 0),
        challenges: Object.keys(d.done).filter(n => d.done[n] && Number(n) % CHALLENGE_EVERY === 0).length,
        dailies: Object.keys(d.daily || {}).length,
        cards: owned, cardsTotal: CARDS.length, shiny: Object.keys(d.shinyCards || {}).length,
        badges: Object.keys(d.badges || {}).length, complete: completeThemes().length,
        duels: d.totals.duelsWon || 0, wins: podium.filter(v => v === 1).length, podiums: podium.filter(v => v >= 1 && v <= 3).length,
        friends: league?.friends?.length || 0
    };
}
const recapTiles = cells => () => {
    const t = el('div', 'rp-tiles');
    cells.forEach(([b, l]) => { const c = el('div'); const v = el('b'); v.textContent = b; c.append(v, document.createTextNode(l)); t.append(c); });
    return t;
};
function parcoursRecapSlides() {
    const r = parcoursRecap();
    const fmt = n => n.toLocaleString('fr-FR');
    const rate = r.tries ? Math.round(r.right / r.tries * 100) : 0;
    const icon = th => (THEME_DECOR.find(t => t.theme === th) || {}).icon || '⭐';
    const slides = [{ bg: 'linear-gradient(180deg,#070f26,#2d356d)', face: 'fier', crown: true, h: 'Ton aventure Kultivo', p: `Du niveau 1 au niveau ${MAX_LEVEL}. On revoit tout ça ensemble ?` }];
    slides.push({ bg: 'linear-gradient(160deg,#0ea5e9,#2563eb)', big: plural(r.span, 'jour', 'jours'), h: 'pour atteindre le sommet',
        p: `Premier niveau le ${fmtDay(r.first)}, sommet le ${fmtDay(r.summit)}. Tu as joué ${r.played} ${r.played > 1 ? 'de ces' : 'de ces'} ${r.span} jours.`
            + (r.start ? ` Départ au niveau ${r.start}, grâce à ton test de placement.` : '') });
    if (r.tries) slides.push({ bg: 'linear-gradient(160deg,#22c55e,#15803d)', big: fmt(r.tries), h: r.tries > 1 ? 'questions répondues' : 'question répondue',
        p: `Dont ${fmt(r.right)} du premier coup : ${rate} % de bonnes réponses.${rate >= 75 ? ' Une encyclopédie sur pattes !' : ''}` });
    slides.push({ bg: 'linear-gradient(160deg,#8b5cf6,#6d28d9)', big: fmt(r.xp), h: 'XP gagnés',
        p: `Ton titre aujourd’hui : « ${r.title.current.name} ».${r.title.next ? ` Prochain titre : ${r.title.next.name}.` : ''}` });
    if (r.themes.length >= 2) {
        const top = r.themes.slice(0, 5), best = r.themes[0], worst = r.themes[r.themes.length - 1];
        slides.push({ bg: 'linear-gradient(160deg,#f59e0b,#d97706)', h: 'Ton podium des thèmes',
            node: () => {
                const box = el('div', 'rp-themes');
                top.forEach(t => {
                    const row = el('div');
                    const name = el('span'); name.textContent = `${icon(t.theme)} ${t.theme}`;
                    const bar = el('i'); const fill = el('b'); fill.style.width = `${t.rate}%`; bar.append(fill);
                    const v = el('span'); v.textContent = `${t.rate} %`;
                    row.append(name, bar, v);
                    box.append(row);
                });
                return box;
            },
            p: `Ton point fort : ${icon(best.theme)} ${best.theme}. Ta bête noire : ${icon(worst.theme)} ${worst.theme}… pour l’instant !` });
    }
    if (r.resisted) slides.push({ bg: 'linear-gradient(160deg,#ef4444,#b91c1c)', h: 'Celle qui t’a résisté',
        node: () => { const q = el('div', 'rp-quote'); q.textContent = `« ${r.resisted.q.q} »`; return q; },
        p: `Ratée ${r.resisted.miss} fois avant de la réussir. La réponse : ${r.resisted.q.a[0]}. Elle n’a plus de secret pour toi !` });
    slides.push({ bg: 'linear-gradient(160deg,#ec4899,#be185d)', h: 'Tes meilleurs moments',
        node: recapTiles([[fmt(r.flawless), r.flawless > 1 ? 'niveaux sans faute' : 'niveau sans faute'], [`${r.bestStreak} j`, 'plus longue série'],
            [fmt(r.challenges), r.challenges > 1 ? 'défis relevés' : 'défi relevé'], [fmt(r.dailies), 'défis du jour joués']]) });
    slides.push({ bg: 'linear-gradient(160deg,#14b8a6,#0f766e)', h: 'Ta collection',
        node: recapTiles([[`${r.cards} / ${r.cardsTotal}`, 'cartes'], [fmt(r.shiny), 'brillantes ✨'], [fmt(r.badges), 'badges'], [fmt(r.complete), r.complete > 1 ? 'collections complètes' : 'collection complète']]),
        p: 'Et ce nouveau fond d’avatar Or, rien que pour toi.' });
    if (cloudUser && (r.friends || r.duels || r.podiums)) slides.push({ bg: 'linear-gradient(160deg,#6366f1,#4338ca)', h: 'Avec tes amis',
        node: recapTiles([[fmt(r.duels), r.duels > 1 ? 'duels gagnés' : 'duel gagné'], [fmt(r.wins), r.wins > 1 ? 'semaines 1er de la ligue' : 'semaine 1er de la ligue'],
            [fmt(r.podiums), r.podiums > 1 ? 'podiums de la semaine' : 'podium de la semaine'], [fmt(r.friends), r.friends > 1 ? 'amis' : 'ami']]) });
    slides.push({ bg: 'linear-gradient(160deg,#8b5cf6,#ec4899)', face: 'fier', crown: true, h: 'Parcours terminé !',
        node: recapTiles([[String(MAX_LEVEL), 'niveaux'], [fmt(r.tries), 'questions'], [`${rate} %`, 'réussite'], [plural(r.span, 'jour', 'jours').replace(' jours', ' j').replace(' jour', ' j'), 'pour le sommet']]) });
    return slides;
}
function openParcoursRecap(fromQueue = false) {
    recapFromQueue = fromQueue;
    recapMonth = 'parcours';
    recapSlides = parcoursRecapSlides();
    recapOverlay();
    showRecapSlide(0);
}
function closeRecap() {
    clearTimeout(recapTimer);
    const ov = $('recapStory');
    if (ov) ov.hidden = true;
    const sh = $('recapShare');
    if (sh) sh.hidden = true;
    if (recapMonth === 'parcours' && !state.data.parcoursRecapSeen) { state.data.parcoursRecapSeen = true; saveData(); if (typeof renderMonthRecapBtn === 'function') renderMonthRecapBtn(); updateNavNotifications(); }   // 13/11 : vu jusqu'au bout (ou fermé)
    if (recapFromQueue) { recapFromQueue = false; nextCelebration(); }   // récap du parcours ouvert depuis la file des fêtes
}

/* Partage du récap, façon Spotify Wrapped (2026-10-27, à essayer d'abord dans le bac à sable : `RECAP_SHARE`) :
   une image au format story (1080 × 1920) dessinée dans un canvas — logo, « Mon mois d'octobre », Kulti fier, 6 cases de
   chiffres (pas la « bête noire »), pseudo et lien du jeu — puis le menu de partage du téléphone (ou un téléchargement). */
const RECAP_SHARE = true;   // ouvert à tous le 27/10 (essayé dans le bac à sable)
const GAME_URL = 'https://aymericchevailler45-pixel.github.io/Kultivo/';
const loadImg = src => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = src; });
async function drawRecapImage(m) {
    const P = m === 'parcours';   // récap du parcours (10/11)
    const r = P ? null : monthRecap(m);
    const rp = P ? parcoursRecap() : null;
    const W = 1080, H = 1920;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    try { await document.fonts.load('900 80px Nunito'); await document.fonts.load('800 40px Nunito'); } catch (err) { /* police par défaut */ }
    const font = (w, px) => `${w} ${px}px KCoin, Nunito, "Segoe UI", Roboto, sans-serif`;
    const grad = g.createLinearGradient(0, 0, W * 0.4, H);
    grad.addColorStop(0, '#8b5cf6'); grad.addColorStop(1, '#ec4899');
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    // petits points en fond
    g.fillStyle = 'rgba(255,255,255,0.08)';
    for (let y = 30; y < H; y += 60) for (let x = (y / 60) % 2 ? 60 : 30; x < W; x += 60) { g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill(); }
    const roundRect = (x, y, w, h, rad) => { g.beginPath(); g.moveTo(x + rad, y); g.arcTo(x + w, y, x + w, y + h, rad); g.arcTo(x + w, y + h, x, y + h, rad); g.arcTo(x, y + h, x, y, rad); g.arcTo(x, y, x + w, y, rad); g.closePath(); };
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    // grand K en filigrane dans le coin (2026-10-28)
    g.save();
    g.globalAlpha = 0.13;
    g.fillStyle = '#fff';
    g.translate(W - 330, H - 400);
    g.rotate(-0.12);
    g.scale(2.1, 2.1);
    g.fill(new Path2D(K_PATH));
    g.restore();
    // logo + nom du jeu
    try { const logo = await loadImg(LOGO_SRC); g.drawImage(logo, W / 2 - 230, 110, 96, 96); } catch (err) { /* sans logo */ }
    g.fillStyle = '#fff';
    g.textAlign = 'left';
    g.font = font(900, 72);
    g.fillText('Kultivo', W / 2 - 112, 182);
    g.textAlign = 'center';
    g.font = font(800, 54);
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.fillText(P ? 'Mon parcours' : 'Mon mois', W / 2, 330);
    g.fillStyle = '#fff';
    g.font = font(900, 110);
    g.fillText(P ? 'Sommet atteint !' : monthOf(m), W / 2, 450);
    // Kulti fier
    try {
        const svg = kultiSVG('fier').replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="420" height="420" ');
        const k = await loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
        g.drawImage(k, W / 2 - 210, 480, 420, 420);
        if (P && KULTI_HATS.crown) {   // Kulti couronné
            const hat = KULTI_HATS.crown.replace(/<svg [^>]*>/, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="420" height="420" style="overflow:visible">');
            const hi = await loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(hat));
            g.drawImage(hi, W / 2 - 210, 480, 420, 420);
        }
    } catch (err) { /* sans Kulti */ }
    // 6 cases de chiffres
    const fmt = n => n.toLocaleString('fr-FR');
    const themeIcon = r && r.theme ? (THEME_DECOR.find(t => t.theme === r.theme[0]) || {}).icon || '⭐' : '';
    const best = P && rp.themes[0];
    const cells = P ? [
        ['🏔️', fmt(MAX_LEVEL), 'niveaux'],
        ['❓', fmt(rp.tries), 'questions'],
        ['✅', rp.tries ? `${Math.round(rp.right / rp.tries * 100)} %` : '—', 'de bonnes réponses'],
        ['⭐', fmt(rp.xp), 'XP gagnés'],
        [best ? (THEME_DECOR.find(t => t.theme === best.theme) || {}).icon || '🎯' : '🎯', best ? best.theme : '—', 'mon thème star'],
        ['📅', fmt(rp.span), rp.span > 1 ? 'jours pour le sommet' : 'jour pour le sommet']
    ] : [
        ['❓', fmt(r.answers), r.answers > 1 ? 'questions' : 'question'],
        ['✅', r.answers ? `${Math.round(r.right / r.answers * 100)} %` : '—', 'de bonnes réponses'],
        ['⭐', fmt(r.xp), 'XP gagnés'],
        [themeIcon || '🎯', r.theme ? r.theme[0] : '—', 'mon thème star'],
        ['🔥', fmt(r.longest), r.longest > 1 ? 'jours de série' : 'jour de série'],
        ['🃏', fmt(r.cards), r.cards > 1 ? 'cartes gagnées' : 'carte gagnée']
    ];
    const cw = 440, ch = 232, gap = 36, x0 = (W - cw * 2 - gap) / 2, y0 = 930;
    cells.forEach(([icon, value, label], i) => {
        const x = x0 + (i % 2) * (cw + gap), y = y0 + Math.floor(i / 2) * (ch + gap);
        g.fillStyle = 'rgba(255,255,255,0.18)';
        roundRect(x, y, cw, ch, 36); g.fill();
        g.fillStyle = '#fff';
        g.font = font(800, 56);
        g.fillText(icon, x + cw / 2, y + 72);
        let size = 84;
        g.font = font(900, size);
        while (g.measureText(value).width > cw - 40 && size > 40) { size -= 4; g.font = font(900, size); }
        g.fillText(value, x + cw / 2, y + 156);
        g.font = font(800, 34);
        g.fillStyle = 'rgba(255,255,255,0.85)';
        g.fillText(label, x + cw / 2, y + 204);
    });
    // pseudo + signature « Kultivo · joue avec moi ! » (le K du logo) + lien
    const pseudo = cloudUser && league?.userId === cloudUser.id && league.pseudo;
    g.fillStyle = '#fff';
    g.font = font(900, 48);
    if (pseudo) g.fillText(`@${pseudo}`, W / 2, 1764);
    const sy = pseudo ? 1830 : 1806;
    g.font = font(900, 46);
    const sign = 'ultivo · joue avec moi !';
    const kw = 182 * 0.2, sw = g.measureText(sign).width, sx = W / 2 - (kw + 4 + sw) / 2;
    g.save();
    g.translate(sx, sy - 188 * 0.2 + 2);
    g.scale(0.2, 0.2);
    g.fill(new Path2D(K_PATH));
    g.restore();
    g.textAlign = 'left';
    g.fillText(sign, sx + kw + 4, sy);
    g.textAlign = 'center';
    g.font = font(800, 32);
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.fillText(GAME_URL.replace('https://', '').replace(/\/$/, ''), W / 2, sy + 52);
    return new Promise(ok => cv.toBlob(ok, 'image/png'));
}
let recapShareBlob = null;
async function openRecapShare(m) {
    clearTimeout(recapTimer);
    let ov = $('recapShare');
    if (!ov) {
        ov = el('div', 'recap-share');
        ov.id = 'recapShare';
        ov.innerHTML = '<img class="recap-share-img" alt="Mon mois sur Kultivo"><div class="recap-share-actions"><button type="button" class="btn recap-share-go">📤 Partager</button><button type="button" class="btn btn-ghost recap-share-close">Fermer</button></div>';
        document.body.append(ov);
        ov.querySelector('.recap-share-close').addEventListener('click', () => { ov.hidden = true; });
        ov.querySelector('.recap-share-go').addEventListener('click', () => shareRecapImage(recapMonth));
    }
    ov.hidden = false;
    const img = ov.querySelector('.recap-share-img');
    img.removeAttribute('src');
    recapShareBlob = await drawRecapImage(m);
    if (recapShareBlob) img.src = URL.createObjectURL(recapShareBlob);
}
async function shareRecapImage(m) {
    if (!recapShareBlob) return;
    const name = m === 'parcours' ? 'kultivo-parcours.png' : `kultivo-${monthName(m)}.png`;
    const file = new File([recapShareBlob], name, { type: 'image/png' });
    const text = m === 'parcours' ? `J’ai terminé les ${MAX_LEVEL} niveaux de Kultivo 🏔️ À toi de jouer : ${GAME_URL}` : `Mon mois ${monthOf(m)} sur Kultivo 🧠 À toi de jouer : ${GAME_URL}`;
    try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text }); return; }
    } catch (err) {
        if (err && err.name === 'AbortError') return;   // partage annulé par le joueur
    }
    const a = document.createElement('a');   // pas de partage d'image : on l'enregistre
    a.href = URL.createObjectURL(recapShareBlob);
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    showToast('🖼️ Image enregistrée : envoie-la à tes amis !');
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
    (carte en trop, au-delà de 3 exemplaires = pièces), enregistre, puis ouvre la fenêtre du coffre. */
function openCardBoxes(boxes, title, avItem = null) {
    $('closeChestBtn').hidden = true;   // 11/11 : on va jusqu'au bout de l'ouverture (bouton du bas)
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
            // 09/11 (idée de l'utilisateur) : les 2e et 3e exemplaires comptent pour la brillante, sans pièce ;
            // seules les cartes « en trop » (4e exemplaire et plus) rapportent des pièces
            const coins = !isNew && data.cards[card.id] > SHINY_AT ? CARD_RARITIES[card.rarity].dupCoins : 0;
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
    // une fête par thème, à la suite (09/11 : animation plein écran au lieu de la fenêtre + confettis)
    let see = false;
    fresh.forEach((t, i) => celebrate(() => showCollectionAnim(t, s => {
        see = see || s;
        if (i < fresh.length - 1) return;
        checkBadges();
        if (see) { showScreen('profile'); setProfileTab('cards'); }
    })));
}

/* ---------- Collection d'un thème complète (09/11, choix A de apercu-collection.html + ruban de C avec le K) ----------
   Fond sombre, les cartes du thème se retournent une à une (compteur qui monte), la dernière tremble puis se retourne,
   tout s'illumine en doré, ruban « Thème complet ! » avec le K, puis texte, Kulti, boutons. Un tap = tout de suite à la fin. */
const RARITY_ORDER = ['common', 'rare', 'epic', 'legendary', 'master'];
/* ---------- Sommet du parcours (2026-11-10, choix C de l'utilisateur, aperçu apercu-sommet.html) ----------
   Le DERNIER niveau réussi pour la 1re fois (`summitDone`), même si des niveaux facultatifs restent derrière (pas de mention).
   Nuit étoilée : Kulti grimpe le chemin en zigzag (la caméra monte avec lui, les lampes des niveaux s'allument, compteur 1 → 300),
   zoom sur le sommet, il plante le drapeau K, la couronne lui tombe sur la tête, dézoom + feux d'artifice, puis ruban
   « Parcours terminé ! » avec le K, « Sommet atteint ! », fond d'avatar Or, Kulti couronné. ~9 s, sons (réglage `sound`).
   File `celebrate`, après l'écran de fin. Impossible à sauter (10/11). Bac à sable : « Voir la fête du sommet ». */
function synthNoise(start, dur, vol = 0.2, freq = 1200, q = 0.7, sweep) {
    const ctx = audio(), t = ctx.currentTime + start, len = Math.ceil(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = buf;
    f.type = 'bandpass';
    f.frequency.setValueAtTime(freq, t);
    if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + dur);
    f.Q.value = q;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(ctx.destination);
    src.start(t);
    src.stop(t + dur);
}
/** 13/11 : le dernier niveau est fait mais la fête n'a jamais été vue (bug du nom « celebrate ») : on la montre à l'ouverture. */
function summitCatchUp(tries = 0) {
    const d = state.data;
    if (!d.done[MAX_LEVEL] || (d.summitSeen && d.parcoursRecapSeen)) return;
    const busy = $('studyScreen')?.hidden === false || $('onboardScreen')?.hidden === false || [...document.querySelectorAll('.modal-overlay')].some(m => !m.hidden) || celebrating;
    if (busy) { if (tries < 40) setTimeout(() => summitCatchUp(tries + 1), 3000); return; }
    if (!d.summitDone) d.summitDone = todayKey();
    if (d.summitSeen) { celebrate(() => openParcoursRecap(true)); return; }   // fête vue mais appli fermée avant le récap : le récap seul
    d.summitSeen = true;
    saveData();
    celebrate(() => showSummitAnim());
}
function showSummitAnim() {
    const ov = celebrationLayer('summitAnim', 'summit-anim');
    let muted = !state.data.sound;
    const sfx = fn => { if (!muted) try { fn(); } catch (err) { /* pas de son */ } };
    const SND = {
        step: i => synthTone(320 + i * 14, 0, 0.07, 'triangle', 0.05),
        wind: () => synthNoise(0, 4.2, 0.05, 500, 0.4, 1400),
        flag: () => { synthNoise(0, 0.35, 0.25, 2400, 0.8, 600); synthTone(140, 0.3, 0.25, 'sine', 0.3, 60); },
        fanfare: () => { [[392, 0, 0.16], [523, 0.18, 0.16], [659, 0.36, 0.16], [784, 0.56, 1.3]].forEach(([f, s0, d]) => { synthBrass(f, s0, d, 0.08); synthBrass(f * 1.5, s0, d, 0.035); });
            [659, 988].forEach(f => synthBrass(f, 0.56, 1.1, 0.04)); },
        boom: () => { synthTone(90, 0, 0.5, 'sine', 0.35, 40); synthNoise(0, 0.9, 0.12, 3000, 0.5, 900); for (let i = 0; i < 10; i++) synthNoise(0.25 + Math.random() * 0.6, 0.05, 0.06, 5000, 2); },
        stamp: () => { synthTone(110, 0, 0.2, 'square', 0.12, 55); synthNoise(0, 0.15, 0.3, 300, 0.7); },
        crown: () => [1319, 1568, 1976, 2637].forEach((f, i) => synthTone(f, i * 0.07, 0.7, 'sine', 0.07)),
        zoom: () => synthNoise(0, 0.8, 0.12, 400, 0.6, 2200)
    };
    const svgNS = 'http://www.w3.org/2000/svg';
    const stars = el('div', 'summit-stars');
    for (let i = 0; i < 34; i++) { const st = el('i'); st.style.left = `${(i * 37) % 100}%`; st.style.top = `${(i * 53) % 100}%`; st.style.animationDelay = `${(i % 7) * 0.3}s`; stars.append(st); }
    const view = el('div', 'summit-view');
    const world = el('div', 'summit-world');
    const pathD = 'M60 430 L210 396 L90 352 L220 318 L100 270 L215 236 L112 190 L200 158 L132 118 L176 88 L150 52';
    world.insertAdjacentHTML('beforeend', `<svg viewBox="0 0 300 440" aria-hidden="true">
        <path d="M-30 440 L40 250 L80 290 L150 40 L220 230 L250 200 L330 440 Z" fill="#2c3e66"/>
        <path d="M150 40 L125 92 L139 84 L150 100 L161 84 L175 92 Z" fill="#eef3ff"/>
        <path d="M-30 440 L30 330 L80 370 L140 300 L200 360 L260 310 L330 440 Z" fill="#1d2a4a"/>
        <path d="${pathD}" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="4" stroke-dasharray="5 8" stroke-linecap="round"/>
        <path class="summit-trail" d="${pathD}" fill="none" stroke="#ffd54a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
        <g class="summit-lamps"></g>
        <g class="summit-flag"><line x1="150" y1="48" x2="150" y2="4" stroke="#f4f4f4" stroke-width="3" stroke-linecap="round"/>
        <g class="summit-cloth"><path d="M151 5 L194 14 L151 25 Z" fill="${BRAND}"/><g transform="translate(161 9) scale(.065)"><path d="${K_PATH}" fill="#fff"/></g></g></g></svg>`);
    const climber = el('div', 'summit-climber');
    climber.append(kultiEl('content', 'kulti-blink'));
    const crownS = el('img', 'summit-crown-s');
    crownS.src = 'emoji/1f451.svg';
    crownS.alt = '';
    climber.append(crownS);
    world.append(climber);
    view.append(world);
    const flash = el('div', 'summit-flash');
    const bottom = el('div', 'summit-bottom');
    const count = el('div', 'summit-count');
    count.append(document.createTextNode('1'));
    const cs = el('small');
    cs.textContent = 'niveaux réussis';
    count.append(cs);
    const ribbon = el('div', 'summit-ribbon');
    const k = document.createElementNS(svgNS, 'svg');
    k.setAttribute('viewBox', '0 0 100 100');
    k.setAttribute('aria-hidden', 'true');
    k.innerHTML = `<circle cx="50" cy="50" r="48" fill="#fff"/><g transform="translate(28 27) scale(.245)"><path d="${K_PATH}" fill="#e5484d"/></g>`;
    const rt = el('span');
    rt.textContent = 'Parcours terminé !';
    ribbon.append(k, rt);
    const step = (cls, text) => { const e = el('div', `summit-step ${cls}`); if (text) e.textContent = text; return e; };
    const title = step('summit-title', 'Sommet atteint !');
    const sub = step('summit-sub', `Les ${MAX_LEVEL} niveaux du parcours, jusqu’au dernier.`);
    const pill = AVI && AVI['bg-or'] ? step('summit-pill', '🎨 Nouveau fond d’avatar : Or') : null;
    const row = step('summit-kulti');
    const face = el('div', 'summit-face');
    face.append(kultiEl('fier', 'kulti-blink'));
    const crown = el('img', 'summit-crown');
    crown.src = 'emoji/1f451.svg';
    crown.alt = '';
    face.append(crown);
    const bubble = el('div', 'medal-bubble');
    bubble.textContent = 'J’ai même eu une couronne ! Merci à toi !';
    row.append(face, bubble);
    const go = el('button', 'btn summit-step summit-go');
    go.type = 'button';
    go.textContent = 'Incroyable !';
    bottom.append(...[count, ribbon, title, sub, pill, row, go].filter(Boolean));
    const canvas = el('canvas', 'summit-fx');
    ov.append(stars, view, flash, bottom, canvas);

    // feux d'artifice (canvas)
    const box = ov.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = box.width * dpr;
    canvas.height = box.height * dpr;
    const g = canvas.getContext('2d');
    g.scale(dpr, dpr);
    const parts = [];
    let fxRaf = 0;
    const fxLoop = () => {
        g.clearRect(0, 0, box.width, box.height);
        for (let i = parts.length - 1; i >= 0; i--) {
            const q = parts[i];
            if (--q.life <= 0) { parts.splice(i, 1); continue; }
            q.vy += 0.04; q.x += q.vx; q.y += q.vy; q.vx *= 0.975; q.vy *= 0.975;
            g.globalAlpha = Math.min(1, q.life / 30);
            g.fillStyle = q.c;
            g.beginPath(); g.arc(q.x, q.y, q.s, 0, 7); g.fill();
        }
        fxRaf = requestAnimationFrame(fxLoop);
    };
    fxLoop();
    const burst = (x, y, c) => { for (let i = 0; i < 46; i++) { const a = Math.random() * 7, v = 1.5 + Math.random() * 3.2; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 60 + Math.random() * 30, c, s: 1.6 + Math.random() * 1.2 }); } };

    // chemin et lampes des niveaux
    const svg = world.querySelector('svg'), trail = svg.querySelector('.summit-trail'), lamps = svg.querySelector('.summit-lamps');
    const L = trail.getTotalLength();
    trail.style.strokeDasharray = `${L} ${L}`;
    trail.style.strokeDashoffset = L;
    const LAMPS = 24;
    const lampEls = Array.from({ length: LAMPS }, (_, i) => {
        const pt = trail.getPointAtLength(L * (i + 0.5) / LAMPS);
        const c = document.createElementNS(svgNS, 'circle');
        c.setAttribute('cx', pt.x); c.setAttribute('cy', pt.y); c.setAttribute('r', 5); c.setAttribute('fill', '#55607f');
        lamps.append(c);
        return c;
    });
    const timers = [];
    let raf = 0, ended = false, zoomed = false;
    const at = (ms, fn) => timers.push(setTimeout(() => { if (!ov.hidden) fn(); }, ms));
    const place = k01 => {
        const pt = trail.getPointAtLength(L * k01);
        climber.style.left = `${pt.x / 300 * 100}%`;
        climber.style.top = `${pt.y / 440 * 100}%`;
        trail.style.strokeDashoffset = L * (1 - k01);
        const pan = -(world.offsetHeight - view.offsetHeight) * (1 - Math.min(1, k01 * 1.15));   // la caméra monte avec Kulti
        if (!zoomed) world.style.transform = `translateY(${pan}px)`;
        count.firstChild.textContent = String(Math.max(1, Math.round(MAX_LEVEL * k01)));
        const lit = Math.floor(k01 * LAMPS + 0.001);
        lampEls.forEach((c, i) => { if (i < lit && c.getAttribute('fill') !== '#ffd54a') { c.setAttribute('fill', '#ffd54a'); c.setAttribute('r', 6); sfx(() => SND.step(i)); } });
    };
    place(0);
    const CLIMB = 4600, t0 = performance.now();
    const climb = now => {
        if (ended || ov.hidden) return;
        const kk = Math.min(1, (now - t0) / CLIMB);
        place(1 - Math.pow(1 - kk, 1.5));
        if (kk < 1) raf = requestAnimationFrame(climb);
    };
    raf = requestAnimationFrame(climb);
    sfx(SND.wind);
    const summit = CLIMB + 150, flagAt = summit + 900, bigAt = flagAt + 700, endAt = bigAt + 1700;
    at(summit - 300, () => { zoomed = true; world.style.transition = 'transform 1s cubic-bezier(.3,.8,.3,1)'; world.style.transform = 'translateY(70px) scale(2.1)'; sfx(SND.zoom); });
    at(flagAt, () => { ov.classList.add('is-flag'); sfx(SND.flag); });
    at(bigAt - 200, () => { crownS.classList.add('is-on'); sfx(SND.crown); });
    at(bigAt, () => { ov.classList.add('is-flash'); sfx(SND.fanfare); });
    at(bigAt + 700, () => { world.style.transition = 'transform 1.3s cubic-bezier(.4,0,.2,1)'; world.style.transform = 'none'; sfx(SND.zoom); });
    const spots = [[0.5, 0.12, '#ffd54a'], [0.22, 0.2, '#ff6b6b'], [0.78, 0.18, '#58cc02'], [0.35, 0.08, '#8b5cf6'], [0.66, 0.1, '#ffffff'], [0.5, 0.22, '#ff9f43'], [0.18, 0.1, '#ffd54a'], [0.82, 0.08, '#ff6b6b']];
    spots.forEach(([x, y, c], i) => at(bigAt + 1300 + i * 420, () => { burst(box.width * x, box.height * y, c); sfx(SND.boom); }));
    const show = e => e && e.classList.add('is-on');
    at(endAt, () => { ended = true; ov.classList.add('is-end'); });
    at(endAt + 200, () => { show(ribbon); sfx(SND.stamp); });
    at(endAt + 650, () => show(title));
    at(endAt + 800, () => show(sub));
    at(endAt + 950, () => show(pill));
    at(endAt + 1150, () => show(row));
    at(endAt + 1600, () => { crown.classList.add('is-on'); sfx(SND.crown); });
    at(endAt + 2100, () => show(go));
    // 10/11 (demande de l'utilisateur) : l'animation ne peut PAS être sautée (ni tap, ni bouton retour avant « Incroyable ! »)
    const close = () => {
        if (ov.hidden || ov.classList.contains('is-closing') || !go.classList.contains('is-on')) return;
        timers.forEach(clearTimeout);
        cancelAnimationFrame(raf);
        cancelAnimationFrame(fxRaf);
        muted = true;
        celebrations.unshift(() => openParcoursRecap(true));   // 10/11 : le récap du parcours juste après
        closeCelebrationLayer('summitAnim');
    };
    go.addEventListener('click', e => { e.stopPropagation(); close(); });
    ov._close = close;   // touche retour du téléphone
}

function showCollectionAnim(theme, onDone) {
    const ov = celebrationLayer('collectionAnim', 'coll-anim');
    const cards = CARDS.filter(c => c.theme === theme).sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity));
    const n = cards.length;
    const at = i => (i < n - 1 ? 0.5 + i * 0.12 : 0.5 + (n - 1) * 0.12 + 0.3);   // la dernière : tremble d'abord
    const flipAt = i => (i < n - 1 ? at(i) : at(i) + 0.6);
    const gold = flipAt(n - 1) + 0.5;
    const step = (cls, d, text) => { const e = el('div', `coll-step ${cls}`); e.style.setProperty('--d', `${d}s`); if (text) e.textContent = text; return e; };
    const rays = el('div', 'coll-rays');
    rays.style.setProperty('--d', `${gold}s`);
    const count = el('div', 'coll-count');
    count.textContent = `0/${n}`;
    const grid = el('div', 'coll-grid');
    grid.style.setProperty('--d', `${gold}s`);
    cards.forEach((c, i) => {
        const slot = el('div', `coll-card rarity-${c.rarity}${i === n - 1 ? ' is-last' : ''}`);
        slot.style.setProperty('--d', `${at(i)}s`);
        const back = el('div', 'coll-back');
        const logo = el('img');
        logo.src = LOGO_SRC;
        logo.alt = '';
        back.append(logo);
        const front = el('div', 'coll-front');
        front.append(cardImg(c));
        slot.append(back, front);
        grid.append(slot);
    });
    // Ruban rouge avec le K (comme le tampon « Sans faute »)
    const ribbon = step('coll-ribbon', gold + 0.25);
    const ns = 'http://www.w3.org/2000/svg';
    const k = document.createElementNS(ns, 'svg');
    k.setAttribute('viewBox', '0 0 100 100');
    k.setAttribute('class', 'coll-k');
    k.setAttribute('aria-hidden', 'true');
    k.innerHTML = `<circle cx="50" cy="50" r="48" fill="#fff"/><g transform="translate(28 27) scale(.245)"><path d="${K_PATH}" fill="#e5484d"/></g>`;
    const rt = el('span');
    rt.textContent = 'Thème complet !';
    ribbon.append(k, rt);
    const icon = (THEME_DECOR.find(t => t.theme === theme) || {}).icon || '🃏';
    const title = step('coll-title', gold + 0.6, `Collection ${theme} complète !`);
    const sub = step('coll-sub', gold + 0.75, `${icon} ${n} cartes réunies, carte Maître comprise`);
    const say = step('coll-kulti', gold + 0.9);
    const face = el('div', 'medal-kulti-face');
    face.append(kultiEl('fier', 'kulti-blink'));
    const bubble = el('div', 'medal-bubble');
    bubble.textContent = 'Toutes les cartes du thème ! Bravo !';
    say.append(face, bubble);
    const go = el('button', 'btn coll-step coll-go');
    go.type = 'button';
    go.style.setProperty('--d', `${gold + 1.05}s`);
    go.textContent = 'Voir ma collection';
    const ok = el('button', 'coll-step coll-ok');
    ok.type = 'button';
    ok.style.setProperty('--d', `${gold + 1.15}s`);
    ok.textContent = 'Super !';
    const close = see => {
        if (ov.hidden || ov.classList.contains('is-closing')) return;   // double tap : une seule fois
        if (onDone) onDone(see);
        closeCelebrationLayer('collectionAnim');
    };
    go.addEventListener('click', e => { e.stopPropagation(); close(true); });
    ok.addEventListener('click', e => { e.stopPropagation(); close(false); });
    ov.append(rays, count, grid, ribbon, title, sub, say, go, ok);
    ov._close = close;   // touche retour du téléphone
    // compteur qui monte au rythme des cartes
    const timers = cards.map((_, i) => setTimeout(() => {
        count.textContent = `${i + 1}/${n}`;
        if (i === n - 1) count.classList.add('is-full');
    }, (flipAt(i) + 0.2) * 1000));
    ov.addEventListener('pointerdown', () => {
        timers.forEach(clearTimeout);
        count.textContent = `${n}/${n}`;
        count.classList.add('is-full');
        ov.classList.add('is-skip');
    }, { once: true });
    if (state.data.sound) {
        try {
            for (let i = 0; i < n - 1; i++) synthTone(520 + i * 50, flipAt(i), 0.09, 'triangle', 0.07);           // cartes qui se retournent
            [0, 0.1, 0.2, 0.3, 0.4, 0.5].forEach(s => synthTone(300, at(n - 1) + s, 0.05, 'square', 0.03));     // la dernière tremble
            synthTone(880, flipAt(n - 1), 0.2, 'sine', 0.14);
            [523, 659, 784, 1047].forEach((f, i) => synthTone(f, gold + i * 0.1, 0.35, 'triangle', 0.12));      // fanfare
            [1047, 1319, 1568].forEach(f => synthTone(f, gold + 0.45, 0.9, 'sine', 0.08));
        } catch (err) { /* pas de son */ }
    }
}

/** Carte retournable : dos (logo) + face. */
function cardFlip(card, big, shiny = false) {
    const flip = el('div', `flip rarity-${card.rarity}${big ? ' is-big' : ''}`);
    const rays = el('div', 'flip-rays');
    const inner = el('div', 'flip-inner');
    const back = el('div', 'flip-back');
    const logo = el('img');
    logo.src = LOGO_SRC;
    logo.alt = '';
    const word = el('span', 'flip-word');   // dos « signé » (2026-10-28, apercu-k.html version B)
    word.textContent = 'KULTIVO';
    back.append(el('span', 'flip-ring'), logo, word);
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

/** 11/11 (bac à sable) : Kulti avance sur la barre de progression de la leçon, jusqu'au drapeau. */
function placeProgressRider(pct) {
    const bar = $('progress');
    let rider = bar.querySelector('.progress-rider');
    if (!rider) {
        rider = el('span', 'progress-rider');
        rider.append(kultiEl('content', 'kulti-blink'));
        const flag = el('span', 'progress-flag');
        flag.textContent = '🏁';
        bar.append(rider, flag);
    }
    rider.style.left = `${pct}%`;
}

/* 11/11 (bac à sable) : pointillés entre les niveaux du parcours (dorés sur la partie faite). Recalculés après chaque dessin. */
function drawMapTrail() {
    const list = $('mapPath');
    if (!list || $('mapScreen').hidden) return;
    list.querySelector('.map-trail')?.remove();
    const base = list.getBoundingClientRect();
    if (!base.height) return;
    const pts = [];
    [...list.children].forEach(li => {
        const node = li.querySelector('.node');
        const box = (node || li).getBoundingClientRect();
        const outer = li.getBoundingClientRect();
        const cx = box.left + box.width / 2 - base.left;
        pts.push({ cx, top: box.top - base.top, bottom: outer.bottom - base.top, n: Number(li.dataset.level) || 0 });
    });
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'map-trail');
    svg.setAttribute('width', base.width);
    svg.setAttribute('height', base.height);
    let lastLevel = 0;
    for (let i = 1; i < pts.length; i++) {   // l'élément i est AU-DESSUS de i − 1 (liste à l'envers)
        const a = pts[i - 1], b = pts[i];
        if (a.n) lastLevel = a.n;
        const line = document.createElementNS(ns, 'line');
        line.setAttribute('x1', a.cx); line.setAttribute('y1', a.top - 4);
        line.setAttribute('x2', b.cx); line.setAttribute('y2', b.bottom + 4);
        line.setAttribute('class', lastLevel && state.data.done[lastLevel] ? 'is-done' : '');
        svg.append(line);
    }
    list.prepend(svg);
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
            : shiny ? '✨ 3/3 ! Va dans Profil → Cartes pour la rendre brillante.'
            : copies < SHINY_AT ? `✨ +1 vers la brillante (${copies}/${SHINY_AT})`
            : coins ? `Carte en trop (déjà 3/3) : +${coins} 🪙` : `✨ +1 vers la brillante (${Math.min(copies, SHINY_AT)}/${SHINY_AT})`;
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
        $('chestNote').textContent = `✨ ${plural(fresh, 'nouvelle', 'nouvelles')}${shinies ? ` · ${shinies} à 3/3 (va dans tes cartes)` : ''}${coins ? ` · cartes en trop : +${coins} 🪙` : ''}`;
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
    $('closeChestBtn').hidden = false;
    $('chestBtn').hidden = false;
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
    art.append(cardImg(card));
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
    art.append(cardImg(card));
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
        : card.rarity === 'master' ? `🏆 Gagnée en réussissant le palier ${TRAIN_TIERS} de l’entraînement.`
        : card.rarity === 'event' ? '🎉 Carte d’événement : on ne pouvait la gagner que cette semaine-là.'
        : !count ? '' : count >= SHINY_AT ? `✨ Carte brillante (${count} exemplaires)`
        : `${count} / ${SHINY_AT} exemplaires : à ${SHINY_AT}, elle devient brillante ✨`;
    $('chestBtn').textContent = onBack ? '← Retour' : 'Fermer';
    $('closeChestBtn').hidden = false;   // vue d'une carte / d'un badge : ✕ visible
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
    $('closeChestBtn').hidden = false;   // vue d'une carte / d'un badge : ✕ visible
    $('chestModal').hidden = false;
}

/** 3e exemplaire : la carte se charge (elle tremble et brille), puis prend son apparence brillante. */
/* Carte qui devient brillante (11/11, choix A sur apercu-brillante.html, sans la pastille « Brillante ») : les 3 exemplaires
   arrivent en éventail, se rejoignent au centre, la carte tremble, éclair blanc, elle ressort brillante avec un halo
   arc-en-ciel et des ✨. ~2,2 s, IMPOSSIBLE à sauter (11/11) : ni bouton, ni ✕, ni retour avant la fin. */
function revealShiny(card) {
    state.chest = null;
    chestBack = null;
    $('chestTitle').textContent = '✨ 3 exemplaires !';
    const stage = $('chestStage');
    const box = el('div', 'shiny-stage is-fan');   // 12/11 : éventail plus petit et plus large, les 3 cartes se voient en entier
    const halo = el('div', 'shiny-halo');
    const flash = el('div', 'shiny-flash');
    const left = cardFace(card, true, false), right = cardFace(card, true, false), mid = cardFace(card, true, false);
    left.classList.add('sh-ghost', 'sh-in-l');
    right.classList.add('sh-ghost', 'sh-in-r');
    mid.classList.add('sh-in-c');
    box.append(halo, left, right, mid, flash);
    stage.replaceChildren(box);
    $('chestNote').textContent = 'Ta carte se transforme…';
    $('chestBtn').textContent = 'Super !';
    $('chestBtn').hidden = true;        // rien pour fermer pendant l'animation
    $('closeChestBtn').hidden = true;
    $('chestModal').hidden = false;
    const sfx = fn => { if (state.data.sound) try { fn(); } catch (err) { /* pas de son */ } };
    sfx(() => [0, 0.1, 0.2].forEach((d, i) => { synthNoise(d, 0.35, 0.15, 500, 0.7, 3000); synthTone(660 + i * 220, d + 0.3, 0.2, 'triangle', 0.07); }));
    const timers = [];
    timers.push(setTimeout(() => {
        box.classList.remove('is-fan');
        left.classList.replace('sh-in-l', 'sh-merge-l');
        right.classList.replace('sh-in-r', 'sh-merge-r');
        sfx(() => synthNoise(0, 0.5, 0.15, 500, 0.7, 3000));
    }, 1100));
    timers.push(setTimeout(() => {
        left.remove(); right.remove();
        mid.classList.replace('sh-in-c', 'sh-shake');
        sfx(() => { for (let i = 0; i < 6; i++) synthTone(300 + i * 60, i * 0.08, 0.06, 'square', 0.03); });
    }, 1650));
    let done = false;
    const finish = () => {
        if (done) return;
        done = true;
        timers.forEach(clearTimeout);
        state.chest = null;   // le prochain tap sur le bouton ferme la fenêtre
        $('chestBtn').hidden = false;
        $('closeChestBtn').hidden = false;
        state.data.shinyCards[card.id] = Date.now();
        saveData();
        const shiny = cardFace(card, true, true);
        shiny.classList.add('sh-pop');
        box.replaceChildren(halo, shiny, flash);
        flash.classList.add('is-on');
        halo.classList.add('is-on');
        for (let i = 0; i < 12; i++) {   // ✨ qui jaillissent
            const sp = el('i', 'sh-spark');
            sp.textContent = i % 3 ? '✨' : '⭐';
            const a = (i / 12) * Math.PI * 2;
            sp.style.setProperty('--x', `${Math.cos(a) * 140}px`);
            sp.style.setProperty('--y', `${Math.sin(a) * 170}px`);
            box.append(sp);
        }
        sfx(() => { synthNoise(0, 0.4, 0.25, 2500, 0.7, 6000); [1568, 1976, 2349, 3136, 3951].forEach((f, i) => synthTone(f, i * 0.06, 0.9, 'sine', 0.06)); });
        shinyFx();
        $('chestNote').textContent = '✨ Ta carte est maintenant brillante !';
        renderCollection();
        updateNavNotifications();
        checkBadges();   // « Tout brille » ?
    };
    timers.push(setTimeout(finish, 2200));
    state.chest = { results: [], step: 0, finish: null, shiny: true };   // en cours : le retour du téléphone ne ferme pas
}

/** Carte Maître pas encore gagnée : comment l'obtenir. */
function openLockedMaster(card) {
    state.chest = null;
    chestBack = null;
    $('chestTitle').textContent = '🏆 Carte Maître';
    const box = el('div', 'kcard is-big is-missing is-locked rarity-master');
    box.textContent = '🔒';
    $('chestStage').replaceChildren(box);
    $('chestNote').textContent = `Réussis le palier ${TRAIN_TIERS} en ${card.theme}, dans Défis → Entraînement, pour la gagner.`;
    $('chestBtn').textContent = 'Compris';
    $('closeChestBtn').hidden = false;   // vue d'une carte / d'un badge : ✕ visible
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
                btn.append(cardFace(card, false, isShiny(card)));   // 3 exemplaires : brillante ; au-delà, cartes en trop = pièces
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
    questLoad();

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
    // Valeur longue (« 100 / 170 », « 120 jours ») : un peu plus petite, pour ne pas déborder de la case (2026-10-28)
    ['tileStreak', 'tileRate', 'tileLevels'].forEach(id => $(id).classList.toggle('is-long', $(id).textContent.length >= 9));

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
        ['✅ Réussies du premier coup', `${data.totals.right} / ${data.totals.tries} réponses`],   // y = réponses données, pas des questions (29/10)
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
    if (state.data.summitDone) {   // 10/11 : récap du parcours, pour toujours
        const li = el('li', 'records-recaps');
        const left = el('span');
        left.textContent = '🏔️ Mon récap du parcours';
        const right = el('div', 'records-recap-list');
        const b = el('button', 'records-recap');
        b.type = 'button';
        b.textContent = 'Revoir';
        b.addEventListener('click', () => openParcoursRecap());
        right.append(b);
        li.append(left, right);
        list.append(li);
    }
    renderMonthRecapBtn();

    // Réussite par thème
    const bars = $('themeBars');
    bars.replaceChildren();
    if (ENC_ON) renderEncyclopedia(bars);   // 12/11 (bac à sable) : l'onglet Thèmes devient l'Encyclopédie des savoirs
    else profileThemeStats().forEach(t => {
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
        sub.textContent = `${t.seen} découverte${t.seen > 1 ? 's' : ''} sur ${t.total} · ${t.mastered} maîtrisée${t.mastered > 1 ? 's' : ''}`;
        row.append(head, meter, sub);
        bars.append(row);
    });

    renderCollection();

    // Badges
    const grid = $('badgeGrid');
    grid.replaceChildren();
    if (BADGES_V2) { renderBadgesV2(grid); return; }
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
        const name = el('span', 'hint-name');
        name.textContent = `${item.icon} ${item.short}`;
        const tag = el('span', `hint-tag ${used ? 'is-used' : owned > 0 ? 'is-stock' : 'is-price'}`);   // 11/11 : stock ou prix, bien visible
        tag.textContent = used ? 'déjà visible' : owned > 0 ? `🎒 ${owned} · gratuit` : `${item.spot || item.price} 🪙`;
        btn.append(name, tag);
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
async function useHint(id) {
    if (state.phase !== 'answering' || state.hintUsed.has(id)) return;
    const best = Math.max(0, ...[...state.hintUsed].map(h => HINT_LEVEL[h] || 0));
    if (HINT_LEVEL[id] <= best) return;   // n'apporterait rien de plus
    const item = SHOP.find(i => i.id === id);
    const data = state.data;
    const price = item.spot || item.price;
    if (!((data.inv[id] || 0) > 0)) {   // 11/11 : payé en pièces sur le moment → confirmation
        if (data.coins < price) return;
        const ok = await askConfirm({ title: `💡 ${item.name}`, text: `${price} 🪙 sur le moment (${item.price} 🪙 en stock, à la boutique).
Tu as ${data.coins} 🪙 · il t’en restera ${data.coins - price}.`,
            yes: `Acheter · ${price} 🪙`, no: 'Annuler' });
        if (!ok || state.phase !== 'answering' || state.hintUsed.has(id) || data.coins < price) return;
    }
    if ((data.inv[id] || 0) > 0) data.inv[id]--;
    else data.coins -= price;

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
    const pill = plan.season ? (VITRINE_SEASON_LABEL[plan.season] || 'De saison') : plan.back ? 'Revient' : 'Nouveau';
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
    const line = (icon, title, sub, buttons, chip = null) => {
        const l = el('div', 'shop-line');
        const ic = el('span', 'sl-icon');
        ic.textContent = icon;
        const tx = el('span', 'sl-text');
        const b = el('b');
        b.textContent = title;
        const sm = el('small');
        sm.textContent = sub;
        tx.append(b);
        if (chip) {   // 11/11 : ce qu'on possède, bien visible (avant : noyé dans la description)
            const c = el('span', `sl-chip${chip.zero ? ' is-zero' : ''}`);
            c.textContent = chip.text;
            tx.append(c);
        }
        tx.append(sm);
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
    chestCard.append(line('🎁', 'Coffre de cartes', `${SHOP_CHEST.size} cartes, dont au moins une rare`,
        [mkBtn(`${SHOP_CHEST.price} 🪙`, 'btn-green', d.coins < SHOP_CHEST.price, async () => {
            if (!(await askBuy('Coffre de cartes', SHOP_CHEST.price, `${SHOP_CHEST.size} cartes, dont au moins une rare.`))) return;
            if (state.data.coins < SHOP_CHEST.price) return;
            state.data.coins -= SHOP_CHEST.price;
            state.data.totals.purchases = (state.data.totals.purchases || 0) + 1;   // 11/11 : compte pour les badges « Boutique »
            openCardBoxes([{ size: SHOP_CHEST.size, rare: true }], '🎁 Coffre de cartes');
            renderHeader();
            renderShop();
        })], { text: `🃏 ${owned} / ${CARDS.length}` }));
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
        tools.append(line(item.icon, item.name, item.desc, buttons, { text: item.max ? `🎒 ${have} / ${item.max}` : `🎒 ${have} en stock`, zero: !have }));
    });
    tools.append(line('💧', 'Recharge de gouttes', 'Toutes tes gouttes d’un coup.',
        [mkBtn(d.drops >= DROPS_MAX ? 'Plein' : `${DROPS_REFILL_PRICE} 🪙`, 'btn-green', d.drops >= DROPS_MAX || d.coins < DROPS_REFILL_PRICE, async () => {
            if (await askBuy('Recharge de gouttes', DROPS_REFILL_PRICE, `Toutes tes gouttes d’un coup (${DROPS_MAX}).`) && refillDrops()) renderShop();
        })], { text: `💧 ${d.drops} / ${DROPS_MAX}`, zero: !d.drops }));
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

/* Questions FIXES du test de placement (2026-11-09, choisies avec l'utilisateur) : 3 par étape, toujours dans cet ordre,
   chacune à la difficulté moyenne des niveaux de son étape, culture générale « classique », réponses faciles à écrire,
   3 thèmes différents par étape. Une question introuvable est remplacée par une question tirée au sort dans l'étape. */
const PLACEMENT_SET = [
    [26, 402, 390],        // 1-19 : Roi-Soleil, planète rouge, capitale de l'Allemagne
    [324, 340, 4477],      // 21-39 : Avatar, Moonwalk, potion magique
    [616, 685, 4500],      // 41-59 : Vésuve, judo, Mona Lisa
    [394, 371, 1153],      // 61-79 : Ulysse, escrime, pois chiche
    [400, 2115, 116],      // 81-99 : Lincoln, drapeau de l'Inde, synonyme
    [126, 43, 523],        // 101-119 : Nymphéas, Gibraltar, Web
    [1118, 1157, 1120]     // 121-139 (3 sur 3) : Fahrenheit 451, Abbey Road, Carcassonne
];
/** Les 3 questions de l'étape (ex. étape 0 : niveaux 1 à 19). */
function placementCards(step) {
    const from = step * PLACEMENT_STEP_LEVELS + 1;
    const to = from + PLACEMENT_STEP_LEVELS - 2;
    const pool = QUESTIONS.filter(q => q.niveau >= from && q.niveau <= to);
    const fixed = (PLACEMENT_SET[step] || []).map(id => QUESTIONS.find(q => q.id === id)).filter(Boolean);
    const extra = shuffle(pool.filter(q => !fixed.includes(q))).slice(0, Math.max(0, PLACEMENT_PER_STEP - fixed.length));
    return [...fixed, ...extra].slice(0, PLACEMENT_PER_STEP).map(q => ({ q, review: false }));
}

function openPlacementModal(welcome = false) {
    state.pendingMode = 'placement';
    state.pendingLevel = null;

    $('modalTitle').textContent = welcome ? '👋 Bienvenue ! Un test de placement ?' : '🧭 Test de placement';
    const maxStart = PLACEMENT_STEPS * PLACEMENT_STEP_LEVELS + 1;
    $('modalDesc').textContent = `Réponds à quelques questions de plus en plus difficiles : tu commenceras directement à ton niveau (jusqu’au niveau ${maxStart}), sans passer par les questions trop faciles pour toi.`;
    $('modalStatsText').textContent = `${PLACEMENT_STEPS} étapes · 2 bonnes réponses sur 3 pour en passer une (3 sur 3 pour la dernière) · sans XP ni cœurs`;
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

    const need = placementNeed(state.placeStep);
    if (state.placeRight >= need) {
        state.placeStep++;
        state.placeRight = 0;
        state.placeWrong = 0;
        if (state.placeStep >= PLACEMENT_STEPS) { endSession(true); return; }
        state.queue = placementCards(state.placeStep);
        if (!state.queue.length) { endSession(true); return; }
    } else if (state.placeWrong > PLACEMENT_PER_STEP - need || !state.queue.length) {
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
    state.newSavoirs = [];   // 12/11 : savoirs trouvés pendant cette partie (pastille de l'écran de fin)
    if (mode === 'kulti') state.kultiKind = kultiToday().kind;
    const pairsMode = mode === 'pairs' || (mode === 'kulti' && state.kultiKind === 'paires');
    const orderMode = mode === 'order' || (mode === 'kulti' && state.kultiKind === 'frise');

    let items;
    if (pairsMode) {
        items = mode === 'kulti' ? state.kultiItems || [] : buildPairGrids(level);   // ici, items = les grilles
    } else if (orderMode) {
        items = mode === 'kulti' ? state.kultiItems || [] : buildOrderRounds(level); // ici, items = les frises
    } else if (mode === 'daily') {
        if (state.data.daily[todayKey()]) return;   // déjà fait aujourd'hui
        items = dailyQuestions(todayKey()).map(q => ({ q, review: false }));
        saveDailyProgress(0, [], [], 0);   // (2026-10-28) quitter puis revenir ne permet plus de le refaire en connaissant les réponses
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
    } else if (mode === 'kulti') {
        items = state.kultiItems || [];
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
    const heartsMax = mode === 'kulti' ? 1 : mode === 'challenge' || orderMode ? CHALLENGE_HEARTS : HEARTS_MAX;
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
    const chrono = mode === 'kulti' && state.kultiKind === 'chrono';
    $('timer').hidden = mode !== 'sprint' && !chrono;
    renderHearts();
    $('endView').hidden = true;
    showScreen('study');
    window.scrollTo(0, 0);
    if (pairsMode) showPairsGrid();
    else if (orderMode) showOrderRound();
    else showCard();
    if (mode === 'sprint' || chrono) startTimer();
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
    $('pairsStep').textContent = state.mode === 'kulti' ? '🔗 Défi de Kulti' : `Grille ${state.pairIndex + 1}/${state.pairGrids.length}`;
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
        if (state.mode !== 'kulti') addXp(state.replay ? replayXp(1) : XP_PAIR);   // défi de Kulti : pas d'XP
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
        daily:     'Ton défi du jour sera terminé : les questions pas encore jouées compteront comme fausses.',
        kulti:     'Le défi de Kulti comptera comme raté pour aujourd’hui.',
        sprint:    'Ce sprint ne sera pas enregistré (le chrono continue pendant ce message).',
        placement: 'Le test de placement sera annulé. Tu pourras le refaire plus tard.'
    };
    $('quitTitle').textContent = state.mode === 'placement' ? 'Quitter le test ?' : 'Quitter ?';
    $('quitDesc').textContent = state.mode === 'duel'
        ? (state.duel?.role === 'opponent' ? 'Le duel sera terminé : les questions pas encore jouées compteront comme fausses.' : 'Le duel ne sera pas envoyé.')
        : messages[state.mode] || messages.level;
    $('quitModal').hidden = false;
    $('quitStayBtn').focus();
}

function closeQuitModal() {
    $('quitModal').hidden = true;
    if (state.phase === 'answering') $('userInput').focus();
}

const AWAY_MAX_MS = 3000;
/** Quitter la partie en cours (bouton « Quitter », ou sortie de l'appli pendant le défi du jour / un duel). */
function leaveSession() {
    if (state.phase !== 'over') queueStats('quit');
    const leftDuel = state.mode === 'duel' && state.phase !== 'over';
    state.phase = 'over';
    returnToMap();
    if (leftDuel) flushStartedDuels().then(() => { lastLeagueLoad = 0; leagueFetch(); });
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

const timerSeconds = () => (state.mode === 'kulti' ? KULTI_CHRONO_SECONDS : SPRINT_SECONDS);
function startTimer() {
    stopTimer();
    state.endsAt = Date.now() + timerSeconds() * 1000;
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
        state.lastAnswer = state.mode === 'sprint' ? countLastSprintAnswer() : null;
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
    } else if (state.mode === 'kulti' && state.kultiKind === 'chrono') {
        pct = Math.round((state.correct / KULTI_CHRONO_GOAL) * 100);
    } else if (state.mode === 'placement') {
        pct = Math.round((state.placeStep / PLACEMENT_STEPS) * 100);
    } else {
        pct = state.total ? Math.round((state.done / state.total) * 100) : 0;
    }
    $('progressBar').style.width = `${pct}%`;
    $('progress').setAttribute('aria-valuenow', String(pct));
    if (PAL_ELEC) placeProgressRider(pct);
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
    tag.hidden = !['challenge', 'daily', 'sprint', 'placement', 'event', 'duel', 'kulti'].includes(state.mode);
    const ev = state.mode === 'event' ? EVENTS.find(e => e.id === state.eventId) : null;
    tag.textContent = ev ? `${ev.icon} ${ev.name}`
                    : state.mode === 'duel' ? `⚔️ Duel · ${state.done + 1}/${state.total}`
                    : state.mode === 'kulti' && state.kultiKind === 'tf' ? `✅ Vrai ou faux · ${state.done + 1}/${state.total}`
                    : state.mode === 'kulti' && state.kultiKind === 'annee' ? `📅 Devine l’année · ${state.done + 1}/${state.total}`
                    : state.mode === 'kulti' ? (state.kultiKind === 'chrono' ? `⏱️ Défi de Kulti · ${state.correct}/${KULTI_CHRONO_GOAL}` : `🎯 Défi de Kulti${state.total > 1 ? ` · ${state.done + 1}/${state.total}` : ''}`)
                    : state.mode === 'daily' ? `Défi du jour · ${state.done + 1}/${state.total}`
                    : state.mode === 'sprint' ? 'Sprint'
                    : state.mode === 'placement' ? `Placement · étape ${state.placeStep + 1}/${PLACEMENT_STEPS}`
                    : 'Défi';
    $('questionText').textContent = item.q.q;
    const said = $('kultiSaid');   // « Kulti s'est trompé » : sa fausse réponse dans une bulle, à part de la question
    said.hidden = !item.q.kultiSaid;
    if (item.q.kultiSaid) {
        const face = el('span', 'kulti-said-face');
        face.append(kultiEl('inquiet', 'kulti-blink'));
        const bubble = el('span', 'kulti-said-bubble');
        const t1 = el('span');
        t1.textContent = 'J’ai répondu ';
        const ans = el('b');
        ans.textContent = `« ${item.q.kultiSaid} »`;
        const t2 = el('span');
        t2.textContent = '… c’est faux ! Aide-moi : quelle est la bonne réponse ?';
        bubble.append(t1, ans, t2);
        said.replaceChildren(face, bubble);
    }
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
    $('hintBtn').hidden = ['daily', 'sprint', 'placement', 'duel', 'kulti'].includes(state.mode);

    const input = $('userInput');
    input.value = '';
    input.readOnly = false;
    input.classList.remove('is-ok', 'is-wrong');

    $('answerActions').hidden = false;
    const tf = !!item.q.tf;   // défi de Kulti « Vrai ou faux » : deux boutons au lieu de la zone de réponse
    input.hidden = tf;
    $('tfActions').hidden = !tf;
    if (tf) $('answerActions').hidden = true;
    // réponse en chiffres (année, « combien… ») → pavé numérique (avec la virgule : 42,195) ; « 8 » suffit même si « huit » est aussi accepté
    const numAnswer = /^\d[\d\s.,]*$/.test(String((item.q.a && item.q.a[0]) || '').trim());
    input.inputMode = item.q.year !== undefined ? 'numeric' : numAnswer ? 'decimal' : 'text';
    input.placeholder = item.q.year !== undefined ? 'Année' : 'Ta réponse';
    $('pairsView').hidden = true;
    $('orderView').hidden = true;
    $('cardView').hidden = false;
    $('endView').hidden = true;
    hideFeedback();
    updateProgress();
    if (!tf) input.focus();
    else input.blur();
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
        const year = state.current.q.year;
        if (year !== undefined) {   // « Devine l'année » : juste à 5 ans près
            const n = parseInt(answer.replace(/[^0-9]/g, ''), 10);
            state.yearGap = Math.abs(n - year);
            verdict = Number.isNaN(n) ? 'wrong' : state.yearGap === 0 ? 'exact' : state.yearGap <= 5 ? 'near' : 'wrong';
        } else verdict = judge(answer, state.current.q.a, state.current.q.q);
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
    $('tfActions').hidden = true;
    $('hintPanel').hidden = true;
    // Combo (bonnes réponses du 1er coup, sans indice, d'affilée) et « ⚡ Éclair ! » (juste en moins de 3 s)
    const clean = ok && !skipped && !state.failedIds.has(state.current.q.id) && state.hintUsed.size === 0;
    state.combo = clean ? (state.combo || 0) + 1 : ok ? state.combo || 0 : 0;
    const comboShow = clean && (COMBO_STEPS.includes(state.combo) || (state.combo > 10 && state.combo % 5 === 0));
    const flash = clean && !['sprint', 'daily', 'duel'].includes(state.mode) && Date.now() - (state.cardShownAt || 0) < FLASH_MS;
    renderStickers(comboShow ? state.combo : 0, flash, trainReadyNow(clean));
    state.fbCombo = comboShow ? state.combo : 0;
    state.fbFlash = flash;
    state.fbClean = clean;
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
function renderStickers(combo, flash, tierDone = false) {
    const box = $('fbStickers');
    box.replaceChildren();
    if (combo) { const c = el('span', 'fb-sticker is-combo'); c.textContent = `🔥 ${combo} d’affilée !`; box.append(c); }
    if (flash) { const f = el('span', 'fb-sticker is-flash'); f.textContent = '⚡ Éclair !'; box.append(f); }
    if (tierDone) { const t = el('span', 'fb-sticker is-tierdone'); t.textContent = '🎉 Palier réussi · suite demain'; box.append(t); }
}
/** Entraînement (2026-11-09) : cette bonne réponse fait-elle RÉUSSIR le palier en cours ? (le suivant ne s'ouvre que demain :
    sinon on enchaînait les sessions sans voir que ça n'avançait plus) */
function trainReadyNow(clean) {
    if (state.mode !== 'training' || !clean || state.trainReadyShown) return false;
    const theme = state.trainTheme, pr = trainingProgress(theme);
    const master = masterCard(theme);
    const stillToWin = pr.tier < TRAIN_TIERS || (master && !state.data.cards[master.id]);
    if (pr.blockedToday || pr.won || pr.ready || !stillToWin) return false;
    const id = state.current.q.id;
    const inTier = (trainingTiers(theme)[pr.tier - 1] || []).some(q => q.id === id);
    if (!inTier || wasRight(id) || pr.right + 1 < pr.needRight) return false;
    state.trainReadyShown = true;
    return true;
}

/* ---------- Personnalité de Kulti (12/11, demande de l'utilisateur) ----------
   Un cerveau curieux, un peu fier de savoir des choses, gentiment taquin, jamais méchant. Il parle À PETITES DOSES :
   sur la carte de correction (à la place du titre, phrases courtes pour ne pas agrandir la carte), dans une bulle sur l'écran
   de fin, et quand on le touche sur le parcours. Jamais sur les messages utiles (orthographe, « à 5 ans près », réponse montrée). */
const KULTI_CHANCE = 0.3;   // phrase « au hasard » sur une bonne / mauvaise réponse ordinaire
const pickOne = list => list[Math.floor(Math.random() * list.length)];
// Phrases de la carte : 22 caractères au plus (sinon le titre passe sur 2 lignes et la carte grandit)
const KULTI_RIGHT = ['Bien vu !', 'Exactement !', 'Neurones validés !', 'Tu le savais, hein ?', 'Joli coup !', 'Je le savais aussi !', 'Rien à redire !'];
const KULTI_WRONG = ['Elle était piégeuse !', 'Elle m’a eu aussi…', 'Presque ! Ou pas…', 'Retiens-la bien !'];
const KULTI_COMBO = { 3: 'Tu chauffes !', 5: 'Rien ne t’arrête !', 7: 'Je suis bluffé !', 10: 'Un vrai génie !' };   // la pastille dit déjà « N d'affilée »
function kultiFeedbackLine(verdict, skipped) {
    if (skipped || verdict === 'typo' || verdict === 'near') return null;
    if (['sprint', 'placement'].includes(state.mode)) return null;   // sprint : ça va trop vite ; placement : on reste sobre
    const q = state.current.q;
    if (verdict === 'exact') {
        if (state.fbCombo) return { text: KULTI_COMBO[state.fbCombo] || 'Incroyable !', face: 'fier' };
        const s = state.data.stats[q.id];
        if (state.fbClean && s && (s.tries || 0) > (s.right || 0) && Math.random() < 0.6) return { text: 'Tu la tiens enfin !', face: 'fier' };
        if (state.fbClean && (q.d || 0) >= 4 && Math.random() < 0.6) return { text: 'Pas facile, bravo !', face: 'surpris' };
        return Math.random() < KULTI_CHANCE ? { text: pickOne(KULTI_RIGHT), face: 'clin' } : null;
    }
    if (Math.random() >= KULTI_CHANCE) return null;
    const reviews = ['level', 'challenge', 'review', 'training'].includes(state.mode);
    return { text: pickOne(reviews ? [...KULTI_WRONG, 'Raté, tu la reverras !'] : KULTI_WRONG), face: 'triste' };
}
/** Phrase de Kulti pour l'écran de fin (bulle à côté de lui). */
function kultiEndLine(mood, stamp) {
    const h = new Date().getHours();
    if (mood === 'triste') return pickOne(['Pas grave, on réessaie ?', 'Elles m’ont eu aussi, la première fois.', 'On se relève, on recommence !']);
    if (stamp) return pickOne(['Tu m’impressionnes, et je suis un cerveau !', 'Sans faute ! Je suis fier de toi.', 'Zéro faute. Chapeau !']);
    const pct = state.total ? state.correct / state.total : 1;
    if (pct < 0.7) return pickOne(['Ouf ! De justesse, mais on l’a !', 'Gagné ! On a eu chaud…']);
    const list = ['Mes neurones applaudissent !', 'Encore un dans la poche !', 'Chaque bonne réponse me fait pousser un neurone.', 'Bien joué ! On continue ?'];
    if (h >= 21 || h < 5) list.push('Un dernier avant de dormir ?');
    else if (h < 11) list.push('Belle façon de commencer la journée !');
    return pickOne(list);
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
        verdict === 'near'  ? `À ${plural(state.yearGap, 'an', 'ans')} près : c’est bon !` :
        skipped             ? 'Voici la réponse' :
                              'Pas tout à fait';
    $('feedbackAnswer').textContent = `Réponse : ${q.a[0]}`;
    $('explanationText').textContent = q.exp;
    if (PAL_ELEC) {   // 11/11 : carte flottante avec Kulti qui réagit, dans la ligne du titre (pas plus haut)
        const said = kultiFeedbackLine(verdict, skipped);   // 12/11 : de temps en temps, Kulti parle à la place du titre
        if (said) $('feedbackTitle').textContent = said.text;
        const face = el('span', 'fb-kulti');
        face.append(kultiEl(said?.face || (ok ? 'content' : 'triste'), 'kulti-blink'));
        $('feedbackTitle').prepend(face);
    }

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
    cont.classList.remove('btn-green');
    cont.classList.toggle('btn-ok', ok);   // 11/11 : couleur de réussite (séparée de la couleur principale)
    cont.classList.toggle('btn-red', !ok);

    // Défi du jour et sprint : pas de « J'avais juste », pour que les scores restent comparables
    const strict = state.mode === 'daily' || state.mode === 'sprint' || state.mode === 'duel' || state.mode === 'kulti';
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

    // Défi de Kulti : un seul essai par question, sans XP ; sans faute (fin à la 1re erreur), ou 5 bonnes avant la fin du chrono
    if (mode === 'kulti') {
        if (!item.q.kulti) recordResult(id, ok);   // vrai / faux et années : pas dans les révisions
        if (ok) state.correct++;
        state.grid.push(ok ? '🟩' : '🟥');
        state.done++;
        hideFeedback();
        const chrono = state.kultiKind === 'chrono';
        const lost = state.done - state.correct > state.total - kultiNeed(state.kultiKind, state.total);   // plus moyen de gagner
        if (chrono ? state.correct >= KULTI_CHRONO_GOAL || !state.queue.length : lost || !state.queue.length) endSession(true);
        else showCard();
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
            saveDailyProgress(state.correct, state.grid, state.answers, Math.round((Date.now() - state.startedAt) / 1000));
        }
        if (mode === 'duel' && state.duel?.role === 'opponent') {   // duel reçu : le score part même si on quitte
            state.data.duelStarted[state.duel.row.id] = { score: state.correct, grid: state.grid.join(''), seconds: Math.round((Date.now() - state.startedAt) / 1000) };
            saveData();
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
    const chips = list => { info.replaceChildren(...list.map(([t, cls]) => { const c = el('span', `rescue-chip ${cls || ''}`); c.textContent = t; return c; })); };   // 11/11
    if (inv.heart > 0) {
        btn.textContent = '💖 Continuer avec un cœur de secours';
        chips([[`🎒 ${inv.heart} en stock`, 'is-good'], ['gratuit']]);
    } else if (coins >= price) {
        btn.textContent = `💖 Continuer · −${price} 🪙`;
        chips([[`Tu as ${coins} 🪙`], [`il t’en restera ${coins - price} 🪙`, 'is-warn']]);
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
/* Le K de Kultivo (2026-10-28) : même tracé que le logo (SVG, 182 × 188) */
const K_PATH = 'M0 0h52v66l64-66h66l-86 86 90 102h-66l-62-73-6 7v66h-52z';
/** Tampon « Sans faute » posé à côté de Kulti sur l'écran de fin (niveau du parcours sans erreur). */
function stampSans() {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('class', 'end-stamp');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = `<defs><path id="stampArc" d="M50 50 m-34 0 a34 34 0 1 1 68 0 a34 34 0 1 1 -68 0"/></defs>
      <circle cx="50" cy="50" r="46" fill="rgba(255,255,255,.88)" stroke="#e5484d" stroke-width="5"/>
      <circle cx="50" cy="50" r="24" fill="none" stroke="#e5484d" stroke-width="2.5"/>
      <text font-family="Nunito, sans-serif" font-weight="900" font-size="9.6" fill="#e5484d" letter-spacing="1.5"><textPath href="#stampArc" startOffset="2%">SANS FAUTE ★ SANS FAUTE ★</textPath></text>
      <g transform="translate(37.5 37) scale(.135)"><path d="${K_PATH}" fill="#e5484d"/></g>`;
    return svg;
}
let stampTimer = null;

function setEnd({ emoji, face, title, text, extra = '', stats = [], primary, primaryClass, onPrimary, secondary, onSecondary, stamp = false }) {
    renderEndStats(stats);
    renderEndGoal();
    if (state.pendingTitle) { const t = state.pendingTitle; state.pendingTitle = null; celebrate(() => showTitleAnim(t)); }
    const mood = face || END_FACES[emoji];
    $('endEmoji').classList.toggle('is-kulti', !!mood);
    if (mood) $('endEmoji').replaceChildren(kultiEl(mood, 'kulti-blink kulti-float', emoji === '💔'));
    else $('endEmoji').textContent = emoji;
    if (mood && PAL_ELEC && state.mode !== 'placement') {   // 12/11 : Kulti dit un mot, dans une bulle à sa gauche (le tampon est à droite)
        const bub = el('span', 'end-say');
        bub.textContent = kultiEndLine(mood, stamp);
        $('endEmoji').append(bub);
    }
    clearTimeout(stampTimer);
    if (stamp) {
        const st = stampSans();
        $('endEmoji').append(st);
        const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        stampTimer = setTimeout(() => {
            st.classList.add('is-on');
            if (!reduced) setTimeout(() => { $('endView').classList.remove('is-stamped'); void $('endView').offsetWidth; $('endView').classList.add('is-stamped'); playSound('stamp'); }, 280);
        }, reduced ? 0 : 900);
    }
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
    // Série d'amis : une petite ligne, seulement s'il y a peu d'autres lignes (et retirée si l'écran devait défiler)
    const fsLine = missions.length + (extra ? 1 : 0) <= 1 ? friendStreakLine() : '';
    // 11/11 (essayé dans le bac à sable, validé) : pièces gagnées en pastille dorée, chaque ligne dans sa pastille
    const chipLines = list => {
        const lines = list.filter(Boolean).flatMap(t => t.split('\n'));
        $('endExtra').replaceChildren(...lines.map(t => { const c = el('span', `end-chip${/^\+\d+ 🪙$/.test(t) ? ' is-coins' : ''}`); c.textContent = t; return c; }));
    };
    $('endExtra').classList.add('is-chips');
    chipLines([extra, ...missions, fsLine]);
    const found = ENC_ON ? [...new Set(state.newSavoirs || [])] : [];
    if (found.length) {   // 12/11 (bac à sable) : « 📚 +5 savoirs », un tap montre les nouvelles fiches
        const c = el('button', 'end-chip is-enc');
        c.type = 'button';
        c.textContent = `📚 +${plural(found.length, 'question sue', 'questions sues')} dans ton encyclopédie ›`;
        c.addEventListener('click', () => openEncList(found));
        $('endExtra').prepend(c);
        // 12/11 : une question qui termine un chapitre = pastille « 🏅 Chapitre complet » (tap = le chapitre, avec son tampon)
        const done = new Map();
        found.map(encQuestion).filter(Boolean).forEach(q => { const ch = encChapterOf(q); if (ch && encChapFull(ch)) done.set(`${ch.theme}:${ch.i}`, ch); });
        done.forEach(ch => {
            const b = el('button', 'end-chip is-enc is-chap');
            b.type = 'button';
            b.textContent = `🏅 Chapitre complet : ${ch.emo} ${ch.name} ›`;
            b.addEventListener('click', () => openEncChapter(ch.theme, ch.i));
            c.after(b);
        });
    }
    if (fsLine) requestAnimationFrame(() => {
        if (document.documentElement.scrollHeight > window.innerHeight + 2) chipLines([extra, ...missions]);
    });
    $('endPrimary').textContent = primary;
    $('endPrimary').className = `btn ${primaryClass || (secondary ? 'btn-red' : 'btn-green')}`;
    $('endSecondary').hidden = !secondary;
    $('endSecondary').textContent = secondary || '';
    state.onEndPrimary = onPrimary;
    state.onEndSecondary = onSecondary || null;
}

let mapFocusLevel = 0;   // 11/11 : niveau à montrer en revenant sur le parcours (après un niveau refait)
function endSession(win) {
    stopTimer();
    if (state.replay && state.level) mapFocusLevel = win ? Math.min(state.level + 1, MAX_LEVEL) : state.level;
    if (state.mode === 'kulti') win = true;   // défi de Kulti : toujours l'écran du défi (réussi ou raté)
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
    if (mode !== 'kulti') bumpStreak();   // le défi de Kulti (1 à 5 questions) ne compte pas pour la série
    let confettiOn = mode !== 'review';   // confettis (pas pour une simple révision)

    if (mode === 'training') {
        confettiOn = false;
        endTraining();
    } else if (mode === 'event') {
        confettiOn = false;
        endEvent();
    } else if (mode === 'duel') {
        confettiOn = false;
        endDuel();
    } else if (mode === 'kulti') {
        confettiOn = false;
        endKulti();
    } else if (mode === 'review') {
        state.data.totals.reviews++;
        addXp(Math.min(XP_REVIEW_WIN, state.total));   // 09/11 : +1 XP par question revue (10 au plus), au lieu de +10 fixe
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
        const start = state.placeStep * PLACEMENT_STEP_LEVELS + 1;
        applyPlacement(start);
        confettiOn = start > 1;
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
        confettiOn = record;
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

        // 10/11 : DERNIER niveau réussi pour la 1re fois = fête du sommet (même si des niveaux facultatifs restent derrière)
        const summitNow = state.level === MAX_LEVEL && !state.data.summitDone;
        state.data.done[state.level] = true;
        if (summitNow) { state.data.summitDone = todayKey(); state.data.summitSeen = true; }
        const unlockedBefore = state.data.unlocked;
        state.data.unlocked = Math.max(state.data.unlocked, Math.min(state.level + 1, MAX_LEVEL));
        if (state.data.unlocked > unlockedBefore) kultiHop = state.data.unlocked;   // Kulti ira ouvrir ce niveau sur le parcours

        const next = state.level < MAX_LEVEL
            ? `Le niveau ${state.level + 1} est débloqué.`
            : `Tu as atteint le niveau ${MAX_LEVEL}, le sommet du parcours !`;
        setEnd({
            emoji: challenge ? '🏆' : '🎉',
            face: challenge || state.errors === 0 ? 'fier' : 'content',
            title: challenge ? 'Défi relevé !' : `Niveau ${state.level} terminé !`,
            text: next,   // « sans faute » : le tampon le dit (2026-10-28)
            stamp: state.errors === 0,
            stats: [statXp(), statAccuracy(), statTime()],
            extra: rewardSummary(),
            primary: 'Continuer',
            onPrimary: returnToMap
        });
        if (summitNow) celebrate(() => showSummitAnim());
    }

    playSound('win');
    if (confettiOn) launchConfetti();
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
    // 2026-10-30 : avant, poids = 1 + cartes ratées → quelques erreurs suffisaient à faire revenir toujours les mêmes familles.
    // Désormais le bonus d'erreurs est plafonné (×2 au plus) et les familles des 2 dernières frises jouées passent derrière.
    const recent = state.data.orderRecent || [];
    const eligible = weightedPick(adapted, f => (recent.includes(f.id) ? 0.15 : 1) * (1 + Math.min(2, missedIn(f)) * 0.5), adapted.length);
    const families = [];
    for (const f of eligible) {
        if (families.length < ORDER_ROUNDS && !families.some(g => g.theme === f.theme)) families.push(f);
    }
    const fallback = [...ORDER_FAMILIES].sort((a, b) => nearCount(b) - nearCount(a));
    for (const f of [...eligible, ...fallback]) {
        if (families.length < ORDER_ROUNDS && !families.includes(f)) families.push(f);
    }
    const progress = (level - 1) / Math.max(1, MAX_LEVEL - 1);   // 0 au début, 1 à la fin
    state.data.orderRecent = [...families.map(f => f.id), ...recent.filter(id => !families.some(f => f.id === id))].slice(0, 6);
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
    $('orderStep').textContent = state.mode === 'kulti' ? '⏳ Défi de Kulti' : `Frise ${state.orderIndex + 1}/${state.orderRounds.length}`;
    $('orderTitle').textContent = `${f.title} : ${f.prompt.charAt(0).toLowerCase()}${f.prompt.slice(1)}`;
    $('orderHelp').textContent = 'Touche les cartes dans l’ordre. Reste appuyé sur une carte placée pour la déplacer, touche-la pour la retirer.';
    $('orderTopLabel').textContent = `⬆ ${f.ends[0]}`;
    $('orderBottomLabel').textContent = `⬇ ${f.ends[1]}`;
    state.nudgePick = null;
    refreshNudgeView('order');
    renderOrder();
    updateProgress();
    // Grandes frises (2026-10-30) : on repart du HAUT (la consigne), pas du bas où l'on était resté pour « Continuer »
    window.scrollTo(0, 0);
    requestAnimationFrame(() => window.scrollTo(0, 0));
}

/** Carte de frise : texte, ou DRAPEAU en image si le libellé est un emoji de drapeau (famille « Drapeaux du nord au sud »). */
const isFlagLabel = label => /^[\u{1F1E6}-\u{1F1FF}]{2}$/u.test(label);
function fillOrderLabel(node, label) {
    if (isFlagLabel(label)) { node.replaceChildren(flagImg(label)); node.classList.add('has-flag'); }
    else node.textContent = label;
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
                fillOrderLabel(card, round.items[idx].label);
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
            fillOrderLabel(label, round.items[idx].label);
            const shown = el('span', 'order-value');
            shown.textContent = round.items[idx].shown;
            box.append(label, shown);
            if (!ok) {
                const yours = el('span', 'order-yours');
                const mine = round.items[round.placed[i]].label;
                if (isFlagLabel(mine)) yours.replaceChildren('Tu avais mis : ', flagImg(mine));
                else yours.textContent = `Tu avais mis : ${mine}`;
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
            fillOrderLabel(card, item.label);
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
    if (!target || state.mode === 'kulti') { btn.hidden = true; return; }   // pas de coup de pouce dans le défi de Kulti
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
    if (paid > 0 && state.mode !== 'kulti') addXp(state.replay ? replayXp(paid) : XP_ORDER_CARD * paid);
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
// Seulement les duels avec un ami ACTUEL (2026-10-30) : un ancien ami (retiré ou compte supprimé) n'apparaît plus avec « ? »
const duelsList = () => (league?.duels || []).filter(r => {
    const other = r.challenger === cloudUser?.id ? r.opponent : r.challenger;
    return (league.friends || []).some(f => f.id === other);
});
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
    if (state.data.duelStarted[row.id]) {   // déjà commencé puis quitté : on envoie le score, pas de 2e essai
        showToast('⚔️ Ce duel est déjà commencé : ton score a été envoyé.');
        await flushStartedDuels();
        lastLeagueLoad = 0;
        leagueFetch();
        return;
    }
    const ok = await askConfirm({
        title: `⚔️ Duel de ${pseudo}`,
        text: `${DUEL_SIZE} questions, un seul essai chacune. Son score reste caché jusqu’à la fin : à toi de faire mieux ! À égalité de bonnes réponses, le plus rapide gagne.`,
        yes: 'Jouer'
    });
    if (!ok) return;
    state.duel = { role: 'opponent', seed: row.seed, row, friend: { id: row.challenger, pseudo } };
    state.data.duelStarted[row.id] = { score: 0, grid: '', seconds: 0 };   // commencé : il compte même si on quitte
    saveData();
    startSession('duel');
}

/** Défi du jour en cours : enregistré tel quel (questions pas encore jouées = fausses). Écrasé par le vrai résultat à la fin. */
function saveDailyProgress(score, grid, answers, seconds) {
    const rest = DAILY_SIZE - grid.length;
    state.data.daily[todayKey()] = { score, seconds, grid: grid.join('') + '🟥'.repeat(Math.max(0, rest)),
        answers: [...answers, ...Array(Math.max(0, rest)).fill('')], partial: true };
    saveData();
}

/** Duels reçus commencés puis quittés (ou appli fermée) : le score fait jusque-là est envoyé, le reste compte faux. */
async function flushStartedDuels() {
    const c = cloudClient();
    const started = state.data.duelStarted;
    if (!c || !cloudUser || !navigator.onLine || !Object.keys(started).length) return;
    for (const [id, p] of Object.entries(started)) {
        if (state.phase !== 'over' && state.mode === 'duel' && String(state.duel?.row?.id) === id && !$('studyScreen').hidden) continue;   // en train de jouer
        const grid = p.grid + '🟥'.repeat(Math.max(0, DUEL_SIZE - [...p.grid].length));
        try {
            await c.from('duels').update({ o_score: p.score, o_seconds: Math.max(1, p.seconds), o_grid: grid }).eq('id', id).is('o_score', null);
            delete started[id];
            state.data.duelsSeen[id] = 1;
            state.data.duelsViewed[id] = 1;
            saveData();
        } catch (err) { return; }   // hors ligne : au prochain chargement
    }
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
            delete state.data.duelStarted[row.id];
            saveData();
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
const LEAGUE_SHORT_FROM = 8;   // Ligue des amis : liste raccourcie au-delà de 8 joueurs (2026-10-30)
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
/** 11/11 : chiffres importants en cases bien visibles ([{ big, label, tone }], tone : 'good' / 'bad' / 'warn'). */
function infoTiles(list) {
    const row = el('div', 'ask-info');
    list.filter(Boolean).forEach(({ big, label, tone }) => {
        const c = el('div', `ask-tile${tone ? ` is-${tone}` : ''}`);
        const b = el('b');
        b.textContent = big;
        const l = el('span');
        l.textContent = label;
        c.append(b, l);
        row.append(c);
    });
    return row;
}
function askConfirm({ title, text = '', yes = 'Oui', no = 'Annuler', danger = false, art = null, info = null }) {
    const nbsp = t => t.replace(/ ([?!:»])/g, ' $1');   // « ? » jamais seul en début de ligne
    $('askArt').replaceChildren(...(art ? [art] : []));
    $('askArt').hidden = !art;
    let box = $('askInfo');
    if (!box) { box = el('div'); box.id = 'askInfo'; $('askText').before(box); }
    box.replaceChildren(...(info ? [infoTiles(info)] : []));
    box.hidden = !info;
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
   10 paliers par thème depuis le 2026-11-10 (questions triées par difficulté ; 5 avant). Pour monter : réussir les 2/3 du palier (au moins une
   fois) ET en maîtriser 1/3 (réussies encore un autre jour). Session de 10, uniquement la banque d'entraînement
   (le parcours a ses propres révisions) : au plus 2 révisions (erreurs d'abord), le reste en nouveautés.
   Sans cœurs, XP réduits. */
const TRAIN_TIERS = 10;   // 10 paliers partout depuis le 2026-11-10 (avant : 5 ; conversion migrateTrainLayout)
const TRAIN_SESSION = 10;
const TRAIN_MAX_REVIEWS = 2;
const TRAIN_CATCHUP = 3;   // rattrapage : questions jamais vues des paliers validés à la conversion (par session)
const TRAIN_TIER_NAMES = ['Découverte', 'Curieux', 'Initié', 'Amateur', 'Confirmé', 'Averti', 'Expert', 'Érudit', 'Virtuose', 'Maître'];
const XP_TRAINING = 2;

const trainingBank = theme => (typeof TRAINING_QUESTIONS === 'undefined' ? [] : TRAINING_QUESTIONS)
    .filter(q => q.theme === theme).sort((a, b) => a.d - b.d || a.id - b.id);

/** Les 10 paliers d'un thème (du plus facile au plus dur). */
function trainingTiers(theme) {
    const bank = trainingBank(theme);
    const size = Math.ceil(bank.length / TRAIN_TIERS) || 1;
    return Array.from({ length: TRAIN_TIERS }, (_, i) => bank.slice(i * size, (i + 1) * size));
}
const trainTierOf = theme => Math.min(TRAIN_TIERS, Math.max(1, state.data.trainTier[theme] || 1));
/* 2026-11-09 (demande de l'utilisateur) : « un palier réussi par jour, le suivant s'ouvre le lendemain ». On ne joue donc
   jamais les questions d'un palier le jour où il a été gagné. trainTierWon = dernier palier RÉUSSI (2/3 de ses questions),
   trainTierDay = jour de cette réussite ; le palier suivant s'ouvre dès qu'on revient un autre jour (trainAdvance). */
function trainWonOf(theme) {
    const d = state.data;
    if (d.trainTierWon[theme] === undefined) {   // sauvegarde d'avant : on part de la situation actuelle
        const tier = trainTierOf(theme);
        const qs = trainingTiers(theme)[tier - 1] || [];
        const ready = qs.length > 0 && qs.filter(q => wasRight(q.id)).length >= Math.ceil(qs.length * 2 / 3);
        d.trainTierWon[theme] = ready && d.trainTierDay[theme] !== todayKey() ? tier : tier - 1;
    }
    return d.trainTierWon[theme];
}
/** Palier réussi un autre jour : le suivant s'ouvre. */
function trainAdvance(theme) {
    const tier = trainTierOf(theme);
    if (tier < TRAIN_TIERS && trainWonOf(theme) >= tier && state.data.trainTierDay[theme] !== todayKey()) {
        state.data.trainTier[theme] = tier + 1;
        saveData();
        return true;
    }
    return false;
}
const trainAdvanceAll = () => THEME_DECOR.forEach(({ theme }) => { if (trainingBank(theme).length) trainAdvance(theme); });
// 09/11 (choix A de l'utilisateur) : une question maîtrisée le reste (drapeau `mastered`), même après une erreur ;
// elle revient quand même plus souvent à l'entraînement (le tirage suit la série de bonnes réponses, qui, elle, retombe)
const isMastered = id => !!state.data.stats[id]?.mastered || (state.data.stats[id]?.streak || 0) >= 2;
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
        blockedToday: state.data.trainTierDay[theme] === todayKey(),   // déjà un palier réussi aujourd'hui
        won: trainWonOf(theme) >= tier,                                // palier en cours déjà réussi (le suivant attend demain)
        totalMastered: bank.filter(q => isMastered(q.id)).length,
        total: bank.length
    };
}

const masterCard = theme => CARDS.find(c => c.theme === theme && c.rarity === 'master');

/** Coffres de palier pas encore donnés pour ce thème (2026-11-10) : 1 carte du thème par palier réussi, 2 aux paliers 5 et 10
    (+ la carte Maître au dernier palier, donnée par endTraining). trainChests = t : coffres donnés pour les paliers 1 … t − 1.
    Les marque comme donnés (l'ouverture enregistre la sauvegarde). */
const trainChestSize = won => (won === 5 || won === TRAIN_TIERS ? 2 : 1);
function trainChestBoxes(theme) {
    const tier = Math.min(TRAIN_TIERS + 1, trainWonOf(theme) + 1);   // palier réussi = coffre tout de suite
    const from = state.data.trainChests[theme] || 1;
    const boxes = [];
    for (let t = from + 1; t <= tier; t++) boxes.push({ size: trainChestSize(t - 1), theme });
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
    const now = pr.total ? TRAIN_MEDALS.filter(m => pr.totalMastered >= Math.ceil(pr.total * m.part)).length : 0;
    return Math.max(now, state.data.trainMedals[theme] || 0);   // 09/11 : une médaille gagnée reste (enregistrée dans endTraining)
}

/* Médailles visibles (2026-10-28, aperçu : apercu-propositions.html) : sur chaque case de thème, les 3 médailles en gris
   tant qu'elles ne sont pas gagnées + la progression vers la prochaine ; un tap ouvre leur explication (et la carte Maître). */
function medalInfo(theme) {
    const pr = trainingProgress(theme);
    const have = trainMedalOf(theme);
    const steps = TRAIN_MEDALS.map(m => Math.ceil(pr.total * m.part));
    const next = have < TRAIN_MEDALS.length ? { m: TRAIN_MEDALS[have], need: steps[have], left: steps[have] - pr.totalMastered } : null;
    return { pr, have, steps, next };
}
function medalRow(theme, icon) {
    const { pr, have, next } = medalInfo(theme);
    const row = el('span', 'train-meds');
    TRAIN_MEDALS.forEach((m, i) => {
        const slot = el('span', `train-slot${i < have ? ' is-got' : ''}`);
        slot.textContent = m.icon;
        row.append(slot);
    });
    const bar = el('span', 'train-mbar');
    const fill = el('i');
    fill.style.width = `${next ? Math.min(100, (pr.totalMastered / next.need) * 100) : 100}%`;
    fill.style.background = MEDAL_COLORS[next ? have : 2];
    bar.append(fill);
    const num = el('span', 'train-mnum');
    num.textContent = next ? `${pr.totalMastered}/${next.need}` : '✓';
    row.append(bar, num);
    row.setAttribute('role', 'button');
    row.setAttribute('aria-label', 'Médailles du thème : comment les gagner');
    row.addEventListener('click', e => { e.stopPropagation(); openMedalsSheet(theme, icon); });
    return row;
}
const MEDAL_COLORS = ['#cd7f32', '#a8b3c2', '#f5b800'];
function openMedalsSheet(theme, icon) {
    const { pr, have, steps } = medalInfo(theme);
    const body = $('friendBody');
    body.replaceChildren();
    const h = el('h2', 'review-title');
    h.textContent = `🏅 Médailles · ${theme}`;
    const sub = el('p', 'muted review-note');
    sub.textContent = 'Maîtrise les questions du thème pour les gagner.';
    body.append(h, sub);
    const names = ['Bronze', 'Argent', 'Or'];
    TRAIN_MEDALS.forEach((m, i) => {
        const line = el('div', 'medal-line');
        const ic = el('span', `medal-ic${i < have ? '' : ' is-off'}`);
        ic.textContent = m.icon;
        const b = el('b');
        b.textContent = `${names[i]} `;
        const sm = el('small');
        sm.textContent = i < have ? '· gagnée ✓' : `· ${i === 2 ? `les ${steps[i]}` : steps[i]} questions maîtrisées`;
        b.append(sm);
        const bar = el('span', 'medal-bar');
        const fill = el('i');
        fill.style.width = `${Math.min(100, (pr.totalMastered / steps[i]) * 100)}%`;
        fill.style.background = MEDAL_COLORS[i];
        bar.append(fill);
        line.append(ic, b, bar);
        body.append(line);
    });
    const note = el('p', 'medal-note');
    note.textContent = '✅ Une question est maîtrisée quand tu l’as réussie 2 fois de suite, sur 2 jours différents.';
    const count = el('div', 'medal-count');   // le chiffre doit ressortir (demande de l'utilisateur)
    const big = el('b');
    big.textContent = `${pr.totalMastered} / ${pr.total}`;
    const lab = el('span');
    lab.textContent = 'questions maîtrisées';
    count.append(big, lab);
    note.append(count);
    body.append(note);
    const master = masterCard(theme);
    if (master) {   // la carte Maître : expliquée ici plutôt que sur la case (2026-10-28)
        const got = !!state.data.cards[master.id];
        const mc = el('p', 'medal-note is-master');
        mc.textContent = got ? '🏆 Carte Maître du thème : obtenue !'
            : `🏆 Et la carte Maître du thème : réussis le palier ${TRAIN_TIERS} (tu es au palier ${pr.tier} / ${TRAIN_TIERS}).`;
        body.append(mc);
    }
    $('friendModal').hidden = false;
}

/** Monte d'un ou plusieurs paliers si les conditions sont remplies. Renvoie le nouveau palier. */
/** Fin de session : le palier en cours vient-il d'être RÉUSSI ? (au plus un par jour ; le suivant s'ouvre demain) */
function updateTrainingTier(theme) {
    const tier = trainTierOf(theme);
    const pr = trainingProgress(theme);
    if (pr.ready && !pr.won && !pr.blockedToday) {
        state.data.trainTierWon[theme] = tier;
        state.data.trainTierDay[theme] = todayKey();
        return true;
    }
    return false;
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
    // 2) Rattrapage (2026-11-10, joueurs convertis de 5 à 10 paliers) : jusqu'à 3 questions jamais vues des paliers validés
    if (state.data.trainCatchup[theme]) {
        const behind = shuffle(tiers.slice(0, cur - 1).flat().filter(q => !seen(q)));
        if (behind.length) take(behind, TRAIN_CATCHUP);
        else { delete state.data.trainCatchup[theme]; saveData(); }
    }
    // 3) Nouveautés : palier en cours d'abord, puis paliers d'avant
    take(shuffle((tiers[cur - 1] || []).filter(q => !seen(q))), TRAIN_SESSION);
    take(shuffle(open.filter(q => !seen(q))), TRAIN_SESSION);
    // 4) Plus rien de neuf : on s'exerce sur le palier en cours (les moins sues d'abord), puis le reste.
    //    Dernier palier réussi (2026-10-26) : toutes les questions du thème à égalité, les moins sues d'abord (vers la médaille d'or)
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
    trainAdvance(theme);
    const pr = trainingProgress(theme);
    // Court : le palier, ce qu'il reste pour le suivant, et la goutte à gagner
    const lines = [`Palier ${pr.tier}/${TRAIN_TIERS} · ${TRAIN_TIER_NAMES[pr.tier - 1]}`];
    const master = masterCard(theme);
    const hasMaster = master && state.data.cards[master.id];
    if (pr.tier < TRAIN_TIERS) {
        lines.push(pr.won ? `🌙 Palier réussi : le palier ${pr.tier + 1} s’ouvre demain`
            : !pr.ready ? `Pour réussir ce palier : ${trainingLeftText(pr)}`
            : pr.blockedToday ? '🌙 Palier réussi demain, à ta première session'
            : '🎉 Palier réussi à la fin de cette session !');
    } else if (!hasMaster) {
        lines.push(!pr.ready ? `🏆 Carte Maître : ${trainingLeftText(pr)}`
            : pr.blockedToday ? '🌙 Carte Maître demain' : '🏆 Carte Maître à la fin de cette session !');
    } else {
        lines.push('🏆 Palier maximum');
    }
    if (pr.blockedToday) lines.push('✅ Palier du jour déjà réussi : tu peux continuer pour t’entraîner (ça compte pour tes médailles).');
    const bonus = dropBonusText();
    if (bonus) lines.push(bonus);
    // 11/11 : le palier et ce qu'il reste à réussir en cases bien visibles
    const info = [{ big: `${pr.tier} / ${TRAIN_TIERS}`, label: TRAIN_TIER_NAMES[pr.tier - 1] },
        pr.won || pr.ready ? { big: '✅', label: 'palier réussi', tone: 'good' }
            : { big: `${Math.min(pr.right, pr.needRight)} / ${pr.needRight}`, label: `réussies · encore ${pr.needRight - pr.right}`, tone: 'warn' }];
    const ok = await askConfirm({ title: `${icon} ${theme}`, info, text: lines.slice(1).filter(l => !l.startsWith('Pour réussir ce palier')).join('\n'), yes: pr.blockedToday ? 'Continuer quand même' : 'Commencer', no: 'Plus tard' });
    if (ok) startTraining(theme);
}

function startTraining(theme) {
    if (!trainingBank(theme).length) { showToast('Questions bientôt disponibles pour ce thème.'); return; }
    trainAdvance(theme);
    state.trainTheme = theme;
    state.trainTierBefore = trainTierOf(theme);
    state.trainReadyShown = false;
    startSession('training');
}

function endTraining() {
    const theme = state.trainTheme;
    state.data.totals.trainings = (state.data.totals.trainings || 0) + 1;
    missionEvent('training');
    const tier = trainTierOf(theme);
    const won = updateTrainingTier(theme);   // palier en cours réussi pendant cette session ?
    const pr = trainingProgress(theme);
    const icon = (THEME_DECOR.find(t => t.theme === theme) || {}).icon || '🎯';
    const master = masterCard(theme);
    const masterMissing = !!master && !state.data.cards[master.id];
    const masterNow = won && tier >= TRAIN_TIERS && masterMissing;   // dernier palier RÉUSSI : la carte Maître
    // Palier du jour déjà réussi (ou validé demain) : la suite attend demain → on propose un autre thème
    const waitTomorrow = !won && pr.ready && pr.blockedToday && (tier < TRAIN_TIERS || masterMissing);
    let emoji = '🎯', title = `Entraînement · ${theme}`, text;
    if (won && tier < TRAIN_TIERS) {
        emoji = '🏅';
        title = `Palier ${tier} réussi !`;
        text = `${icon} ${theme} : palier ${tier} · ${TRAIN_TIER_NAMES[tier - 1]} réussi.\n🌙 Le palier ${tier + 1} · ${TRAIN_TIER_NAMES[tier]} s’ouvre demain. D’ici là, tu peux rejouer celui-ci : ça compte pour tes médailles.`;
        launchConfetti();
        playSound('win');
    } else if (masterNow) {
        emoji = '🏆';
        title = `Palier ${TRAIN_TIERS} réussi !`;
        text = `🏆 ${theme} : palier ${TRAIN_TIERS} · ${TRAIN_TIER_NAMES[TRAIN_TIERS - 1]} réussi ! Tu gagnes la carte Maître.`;
        launchConfetti();
        playSound('win');
    } else if (waitTomorrow) {
        emoji = '🌙';
        title = 'Palier du jour terminé';
        text = (pr.won && tier < TRAIN_TIERS ? `${icon} Le palier ${tier + 1} s’ouvre demain.`
            : tier < TRAIN_TIERS ? `${icon} Ce palier sera validé demain, à ta première session.`
            : `${icon} La carte Maître se gagne demain, à ta première session.`)
            + '\nTu peux continuer sur ce palier : ça compte pour tes médailles.';
    } else if (tier >= TRAIN_TIERS && (pr.ready || !masterMissing)) {
        text = `${icon} ${theme} : tu es au palier maximum, bravo !`;
    } else {
        text = tier < TRAIN_TIERS
            ? `${icon} Pour réussir le palier ${tier} : ${trainingLeftText(pr)}.`
            : `${icon} Pour réussir le palier ${TRAIN_TIERS} et gagner la carte Maître : ${trainingLeftText(pr)}.`;
    }
    // Médaille du thème (bronze, argent, or) gagnée pendant cette session ?
    const medal = trainMedalOf(theme);
    if (medal > (state.data.trainMedals[theme] || 0)) {
        state.data.trainMedals[theme] = medal;
        const m = TRAIN_MEDALS[medal - 1];
        text += `\n${m.icon} Médaille d’${m.name} en ${theme} !`;
        saveData();
        const mastered = trainingProgress(theme).totalMastered;
        celebrate(() => showMedalAnim({ theme, icon, medal, mastered }));   // la fête, juste après l'écran de fin
    } else {
        const { next } = medalInfo(theme);
        if (next && next.left > 0) text += `\n${next.m.icon} Plus que ${plural(next.left, 'question maîtrisée', 'questions maîtrisées')} pour la médaille d’${next.m.name}.`;
    }
    const dropLine = earnPracticeDrop();
    const toThemes = () => { returnToMap(); setChallengesTab('training'); };
    const later = (won && tier < TRAIN_TIERS) || waitTomorrow;   // la suite est pour demain
    setEnd({
        emoji,
        title,
        text,
        stats: [statXp(), statAccuracy(), statTime()],
        extra: [rewardSummary(), dropLine].filter(Boolean).join('\n'),
        primary: later ? 'Choisir un autre thème' : 'Encore 10 questions',
        primaryClass: 'btn-green',
        onPrimary: later ? toThemes : () => startTraining(theme),
        secondary: later ? 'Continuer quand même' : 'Retour aux thèmes',
        onSecondary: later ? () => startTraining(theme) : toThemes
    });
    // Coffre du palier réussi (1 carte du thème, 2 aux paliers 5 et 10 ; au dernier palier, la carte Maître)
    const boxes = trainChestBoxes(theme);
    if (masterNow) boxes.push({ size: 0, fixed: [master] });
    if (boxes.length) {
        setTimeout(() => openCardBoxes(boxes, masterNow ? `🏆 Carte Maître · ${theme}` : `🎁 Coffre du palier ${tier} réussi · cartes ${theme}`), 900);
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
        text: '🃏 Tes cartes, gagnées dans les coffres. Chaque exemplaire en plus te rapproche d’une carte brillante (1/3, 2/3…) : à 3, touche-la pour la transformer ✨. Au-delà, une carte en trop rapporte des pièces. 🔒 La carte Maître se gagne en réussissant le palier 10 de l’entraînement.'
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
        text: '🪜 Chaque thème a 10 paliers. Réussis les 2/3 des questions d’un palier : le suivant s’ouvre le lendemain (un palier par jour) : 🎁 une carte du thème à chaque palier (2 aux paliers 5 et 10), et 🏆 la carte Maître en réussissant le palier 10 !'
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
    trainAdvanceAll();   // paliers réussis un autre jour : le suivant s'ouvre (2026-11-09)
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
        tile.append(head);
        if (!bank.length) {
            const soon = el('span', 'train-line');
            soon.textContent = 'Bientôt disponible';
            tile.append(soon);
        } else {
            const pr = trainingProgress(theme);
            const label = el('span', 'train-tier');
            label.textContent = `Palier ${pr.tier} / ${TRAIN_TIERS}\n${TRAIN_TIER_NAMES[pr.tier - 1]}`;   // toujours 2 lignes : cases de même allure
            // 10 morceaux : pleins = paliers passés, le palier en cours se remplit selon ce qu'il reste à faire
            // Bac à sable (10/11, idée E) : 10 morceaux sur UNE ligne, celui du palier en cours plus large
            const bar = el('div', `train-steps${BAC ? ' is-accordion' : ''}`);
            const goal = pr.needRight + pr.needMastered;
            const done = Math.min(pr.right, pr.needRight) + Math.min(pr.mastered, pr.needMastered);
            for (let i = 1; i <= TRAIN_TIERS; i++) {
                const seg = el('span', `train-step${i === pr.tier ? ' is-current' : ''}`);
                const fill = el('i');
                const part = i < pr.tier ? 1 : i > pr.tier ? 0 : (pr.tier >= TRAIN_TIERS && pr.ready ? 1 : goal ? done / goal : 0);
                fill.style.width = `${Math.round(part * 100)}%`;
                seg.append(fill);
                bar.append(seg);
            }
            bar.setAttribute('aria-label', `Palier ${pr.tier} sur ${TRAIN_TIERS}`);
            // Sous le trait (médailles, palier du jour, à revoir) : la page des médailles ; au-dessus : le palier (09/11, demande)
            const foot = el('div', 'train-foot');
            foot.append(medalRow(theme, icon));
            if (pr.blockedToday) {
                const today = el('span', 'train-today');
                today.textContent = '✅ Palier du jour réussi · suite demain';
                foot.append(today);
            }
            const errors = bank.filter(q => missCount(q.id) > 0).length;
            if (errors) {
                const rev = el('span', 'train-errors');
                rev.textContent = `🔁 ${errors} ${errors > 1 ? 'ratées' : 'ratée'} à refaire`;   // 11/11 : pas dans « ↻ à revoir » du parcours
                rev.title = 'Questions ratées : elles reviennent dans tes prochaines sessions de ce thème';
                foot.append(rev);
            }
            foot.addEventListener('click', e => { e.stopPropagation(); openMedalsSheet(theme, icon); });
            foot.addEventListener('pointerdown', e => e.stopPropagation());
            tile.append(label, bar, foot);
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
const HUE_LEVELS = [20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 250];   // couleurs à gagner (2026-11-09)
const AV_ALL = (() => {
    const list = [];
    AVATAR_HUES.forEach((hue, i) => {
        // 2026-11-09 : couleurs étalées jusqu'au niveau 250 (parcours de 300). oldLevel = ancien seuil (10, 20… 120 du parcours
        // de 230 niveaux) : une couleur déjà gagnée avec lui est gardée pour toujours (av.grant, une fois, voir avCheck).
        const level = i % 2 === 0 ? 0 : HUE_LEVELS[Math.ceil(i / 2) - 1];
        const oldLevel = i % 2 === 0 ? 0 : (typeof levelFromLayout === 'function' ? levelFromLayout(10 * Math.ceil(i / 2), 3) : 10 * Math.ceil(i / 2));
        list.push({ id: `hue-${hue}`, type: 'bg', kind: level ? 'earn' : 'free', hue, name: 'Couleur unie', oldLevel,
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
    if (!d.huesKept) {   // 2026-11-09 : couleurs étalées jusqu'au 250, celles déjà gagnées avec les anciens seuils sont gardées
        AV_ALL.forEach(it => { if (it.oldLevel && st.maxDone >= it.oldLevel) d.av.grant[it.id] = 1; });
        d.huesKept = true;
        saveData();
    }
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
const VITRINE_SEASON_LABEL = { halloween: '🎃 Halloween', noel: '🎄 Noël', valentin: '💖 Saint-Valentin', maghreb: '🐪 Maghreb' };
const dayGap = (a, b) => Math.round((new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`)) / 86400000);
const vitrineWeek = () => Math.max(0, Math.floor(dayGap(VITRINE_START, weekStart()) / 7));
function vitrineSeason(k) {
    // Démo d'un événement (?demo=maghreb) : la vitrine de la semaine montre aussi sa collection (2026-10-30)
    let demo = null;
    try { demo = new URLSearchParams(location.search).get('demo'); } catch (err) { /* sans adresse */ }
    if (demo && k === vitrineWeek() && VITRINE_SEASONS.some(se => se.id === demo)) return VITRINE_SEASONS.find(se => se.id === demo);
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
        await c.rpc('quest_push', { p_xp: row.week_xp });   // quête en duo (sans effet si pas de quête)
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
        medals: Object.fromEntries(THEME_DECOR.map(({ theme }) => [theme, trainingBank(theme).length ? trainMedalOf(theme) : 0]).filter(x => x[1])),   // médailles d'entraînement (29/10)
        daily: d.daily[todayKey()] ? { day: todayKey(), grid: d.daily[todayKey()].grid } : null,   // défi du jour, question par question
        days: myPlayedDays(),   // série d'amis 🔥🤝
        // Objectif de la quête en duo : semaine EN COURS comprise (2026-10-30), sinon un partenaire qui n'a pas rouvert le jeu
        // le lundi n'avait pas encore « la semaine dernière » dans son résumé
        // Semaines d'avant le 26/10 non envoyées (la remise à zéro du 20/10 laisse une semaine du 19 à moitié jouée)
        weeks: Object.fromEntries([0, 7, 14, 21].map(k => shiftDays(weekStart(), -k)).filter(w => w >= QUEST_WEEKS_FROM).map(w => [w, weekXp(w)])),
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

        const badges = BADGES.concat(BADGES_NEW).filter(b => s.badges.includes(b.id));
        const bh = el('h3', 'friend-section');
        bh.textContent = `🎖️ Badges · ${badges.length}/${activeBadges().length}`;
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

        if (s.medals) {   // médailles d'entraînement (2026-10-29 ; ancien résumé : rien)
            const mh = el('h3', 'friend-section');
            const list = Object.entries(s.medals).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
            mh.textContent = `🏅 Médailles d’entraînement · ${list.length}`;
            const ml = el('div', 'friend-badges');
            list.forEach(([theme, n]) => {
                const m = el('span', 'friend-medal');
                m.textContent = `${TRAIN_MEDALS[n - 1].icon}${(THEME_DECOR.find(t => t.theme === theme) || {}).icon || ''}`;
                m.title = `Médaille d’${TRAIN_MEDALS[n - 1].name} · ${theme}`;
                ml.append(m);
            });
            if (!list.length) ml.textContent = 'Aucune médaille pour l’instant.';
            body.append(mh, ml);
        }

        // Cartes rangées par thème, comme dans mon profil (2026-10-29) : les siennes, et « ? » pour celles qui lui manquent
        const order = Object.keys(CARD_RARITIES);
        const shiny = s.shiny || [];   // ancien résumé : pas d'info sur les cartes brillantes
        const has = c => s.cards.includes(c.id);
        const ch = el('h3', 'friend-section');
        ch.textContent = `🃏 Cartes · ${CARDS.filter(has).length}/${CARDS.length}`;
        const cl = el('div', 'friend-collection');
        const cardBtn = (card, isShinyCard) => {
            const btn = el('button', 'kcard-btn');
            btn.type = 'button';
            btn.append(cardFace(card, false, isShinyCard));
            btn.addEventListener('click', () => {
                $('friendModal').hidden = true;
                openCardView(card, () => { $('friendModal').hidden = false; }, isShinyCard);
            });
            return btn;
        };
        [...new Set(CARDS.map(c => c.theme))].sort(byThemeName).forEach(theme => {
            const cards = CARDS.filter(c => c.theme === theme).sort((x, y) => order.indexOf(x.rarity) - order.indexOf(y.rarity));
            const n = cards.filter(has).length;
            const head = el('div', 'card-theme-head');
            head.textContent = `${theme} · ${n}/${cards.length}${n === cards.length ? ' ✓' : ''}`;
            head.classList.toggle('is-complete', n === cards.length);
            const row = el('div', 'card-row');
            row.style.setProperty('--per-row', String(Math.ceil(cards.length / 2)));
            row.style.setProperty('--per-row-phone', String(Math.ceil(cards.length / 2)));
            cards.forEach(card => {
                if (has(card)) row.append(cardBtn(card, shiny.includes(card.id)));
                else {
                    const box = el('div', `kcard is-missing rarity-${card.rarity}${card.rarity === 'master' ? ' is-locked' : ''}`);
                    box.textContent = card.rarity === 'master' ? '🔒' : '?';
                    row.append(box);
                }
            });
            cl.append(head, row);
        });
        // Cartes d'événement (Citrouille 2026…) : à part, hors du compte des 180
        const evCards = EVENT_CARDS.filter(has);
        if (evCards.length) {
            const head = el('div', 'card-theme-head is-event');
            head.textContent = '🎉 Événements';
            const row = el('div', 'card-row');
            evCards.forEach(card => row.append(cardBtn(card, false)));
            cl.append(head, row);
        }
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
        if (Object.keys(state.data.duelStarted).length) setTimeout(flushStartedDuels, 0);
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
    questLoad();
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
        // Beaucoup d'amis (2026-10-30) : le 4e, « ⋯ », puis mes voisins (celui devant, moi, celui derrière) + « Voir tous »
        const me = rows.findIndex(r => r.me);
        const short = rows.length > LEAGUE_SHORT_FROM && !listsOpen.has('league');
        const keep = new Set([3]);
        if (me >= 3) [me - 1, me, me + 1].forEach(i => { if (i >= 3 && i < rows.length) keep.add(i); });
        const shows = k => !short || keep.has(k) || (keep.has(k - 1) && keep.has(k + 1));   // pas de « ⋯ » pour une seule ligne
        let gap = false;
        rows.slice(3).forEach((r, j) => {
            const k = j + 3;
            if (!shows(k)) {
                if (!gap && [...keep].some(i => i > k)) list.append(el('li', 'league-gap'));
                gap = true;
                return;
            }
            gap = false;
            const li = el('li', `league-row${r.me ? ' is-me' : ''}${r.friend ? ' is-link' : ''}`);
            if (r.friend) li.addEventListener('click', () => openFriendProfile(r.friend));
            const pos = el('span', 'league-pos');
            pos.textContent = String(k + 1);
            const name = el('span', 'league-name');
            name.textContent = r.me ? 'Toi' : r.pseudo;
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
        if (rows.length > LEAGUE_SHORT_FROM) {
            const more = el('button', 'link-btn list-more');
            more.type = 'button';
            more.textContent = listsOpen.has('league') ? 'Voir moins' : `Voir tous (${rows.length}) ›`;
            more.addEventListener('click', () => {
                if (listsOpen.has('league')) listsOpen.delete('league'); else listsOpen.add('league');
                renderLeague();
            });
            rank.append(more);
        }
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
            const fs = f.pending ? null : friendStreak(f);
            if (fs) {   // série d'amis : jours d'affilée ensemble (contour orange = déjà joué tous les deux aujourd'hui)
                const pill = el('span', `friend-streak${fs.today ? ' is-today' : ''}${fs.n ? '' : ' is-off'}`);
                pill.textContent = fs.n ? `🔥🤝 ${fs.n}` : '🤝 0';
                pill.title = `Série avec ${f.pseudo} : jours d’affilée où vous avez joué tous les deux`;
                pill.setAttribute('role', 'button');
                pill.addEventListener('click', e => { e.stopPropagation(); explainFriendStreak(f, fs); });   // explication (2026-10-28)
                li.append(pill);
            }
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
    { target: () => document.querySelector('.node.is-current:not(.is-optional)'),
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
    const node = document.querySelector('.node.is-current:not(.is-optional):not(.is-pairs):not(.is-order):not(.is-challenge)');
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
    const current = document.querySelector('.node.is-current:not(.is-optional)');
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
    tap: [[880, 0, 0.08, 'triangle'], [1175, 0.07, 0.1, 'triangle']],
    hop: [[330, 0, 0.14, 'triangle', 700]],                                   // Kulti saute (monte d'une note à chaque saut)
    rattle: [[900, 0, 0.04, 'square'], [650, 0.12, 0.04, 'square'], [900, 0.24, 0.04, 'square'], [650, 0.36, 0.04, 'square']],   // cadenas secoué
    unlock: [[180, 0, 0.07, 'square'], [1047, 0.1, 0.3], [1319, 0.17, 0.35], [1568, 0.24, 0.5]],   // clac + carillon
    stamp: [[140, 0, 0.12, 'square', 60], [1568, 0.05, 0.25, 'triangle']]   // tampon « Sans faute » : boum + petite note
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

/* Mode clair / sombre (2026-10-30) : choix gardé sur l'appareil (lu dès le <head> d'index.html pour éviter un éclair),
   « phone » = comme le réglage du téléphone. Le bouton montre l'affichage du moment ; un tap ouvre les 3 choix. */
const THEME_KEY = 'kultivo_theme';
function themePref() {
    try { const t = localStorage.getItem(THEME_KEY); return t === 'light' || t === 'dark' ? t : 'phone'; } catch (e) { return 'phone'; }
}
const phoneIsDark = () => !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
const themeIsDark = () => { const p = themePref(); return p === 'dark' || (p === 'phone' && phoneIsDark()); };
function setThemePref(pref) {
    try { if (pref === 'phone') localStorage.removeItem(THEME_KEY); else localStorage.setItem(THEME_KEY, pref); } catch (e) { /* rien */ }
    if (pref === 'phone') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = pref;
    renderThemeBtn();
}
function renderThemeBtn() {
    const btn = $('themeBtn');
    if (!btn) return;
    const small = window.innerWidth <= 400;   // téléphone : 3 boutons sur une ligne, on raccourcit
    btn.textContent = themeIsDark() ? (small ? '🌙 Sombre' : '🌙 Mode sombre') : (small ? '☀️ Clair' : '☀️ Mode clair');
    btn.title = 'Affichage clair ou sombre : toucher pour choisir';
}
function openThemeSheet() {
    const body = $('friendBody');
    body.replaceChildren();
    const h = el('h2', 'review-title');
    h.textContent = '🌗 Affichage';
    const sub = el('p', 'muted review-note');
    sub.textContent = 'Choisis les couleurs du jeu : claires ou sombres.';
    body.append(h, sub);
    const box = el('div', 'theme-choices');
    [['light', '☀️ Mode clair', 'Fond blanc, toujours'],
     ['dark', '🌙 Mode sombre', 'Fond bleu nuit, toujours'],
     ['phone', '📱 Comme mon téléphone', `Suit le réglage du téléphone (en ce moment : ${phoneIsDark() ? 'sombre' : 'clair'})`]].forEach(([id, label, note]) => {
        const b = el('button', `theme-choice${themePref() === id ? ' is-on' : ''}`);
        b.type = 'button';
        const t = el('b');
        t.textContent = label;
        const n = el('small');
        n.textContent = note;
        b.append(t, n);
        b.addEventListener('click', () => { setThemePref(id); openThemeSheet(); });
        box.append(b);
    });
    body.append(box);
    $('friendModal').hidden = false;
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

    const colors = palette || [BRAND, '#ffc800', '#8b5cf6', PAL_ELEC ? '#12b3a8' : '#1899d6', '#ff9600', '#e5484d'];
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
            const notif = btn.hasAttribute('data-notif');
            showScreen(btn.dataset.screen);
            if (notif) goToNotif(btn.dataset.screen);   // pastille : on va directement à ce qui attend (2026-10-30)
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
    $('themeBtn').addEventListener('click', openThemeSheet);
    renderThemeBtn();
    window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', renderThemeBtn);   // le téléphone change de mode

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
    window.addEventListener('resize', () => { if (PAL_ELEC) drawMapTrail(); });   // pointillés du parcours (bac à sable)
    $('missionsRow').addEventListener('click', openMissionsModal);
    $('closeMissionsBtn').addEventListener('click', () => { $('missionsModal').hidden = true; });
    for (const [btnId, word] of [['tfTrue', 'Vrai'], ['tfFalse', 'Faux']]) {
        $(btnId).addEventListener('click', () => { if (state.phase !== 'answering') return; $('userInput').value = word; verify(); });
    }
    $('questRow').addEventListener('click', questClick);
    $('closeQuestBtn').addEventListener('click', () => { $('questModal').hidden = true; });
    $('questModal').addEventListener('click', e => { if (e.target === $('questModal')) $('questModal').hidden = true; });
    $('patchOk').addEventListener('click', closePatchNotes);
    $('missionsModal').addEventListener('click', e => { if (e.target === $('missionsModal')) $('missionsModal').hidden = true; });
    $('closeDropsBtn').addEventListener('click', closeDropsModal);
    $('dropsModal').addEventListener('click', e => { if (e.target === $('dropsModal')) closeDropsModal(); });
    $('dropsTrainBtn').addEventListener('click', () => dropsGo('training'));
    $('dropsReviewBtn').addEventListener('click', () => dropsGo('review'));
    $('dropsRefillBtn').addEventListener('click', async () => {   // 11/11 : confirmation avant de payer
        if (await askBuy('Recharge de gouttes', DROPS_REFILL_PRICE, `Toutes tes gouttes d’un coup (${DROPS_MAX}).`) && refillDrops()) closeDropsModal();
    });
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
        const current = document.querySelector('.node.is-current:not(.is-optional)');
        if (current) current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
    window.addEventListener('scroll', updateToCurrentBtn, { passive: true });

    // Petits décors du parcours : un tap = une anecdote sur le thème ; un tap n'importe où la referme
    $('mapDecor').addEventListener('click', e => {
        const badge = e.target.closest('.decor-badge');
        if (badge) badge.dataset.baby ? showBabyFact(badge) : badge.dataset.event ? showEventFact(badge) : showFact(badge.dataset.theme, badge);
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
    $('quitConfirmBtn').addEventListener('click', () => { closeQuitModal(); leaveSession(); });
    // Défi du jour et duels (2026-10-28, demande de l'utilisateur) : sortir de l'appli plus de 3 s = partie terminée
    // (sinon on pourrait aller chercher la réponse ailleurs). Les questions pas encore jouées comptent fausses.
    let awaySince = 0;
    document.addEventListener('visibilitychange', () => {
        const strict = (state.mode === 'daily' || state.mode === 'duel') && state.phase !== 'over' && state.phase !== 'idle' && !$('studyScreen').hidden;
        if (document.visibilityState === 'hidden') { awaySince = strict ? Date.now() : 0; return; }
        const away = awaySince ? Date.now() - awaySince : 0;
        awaySince = 0;
        if (!strict || away <= AWAY_MAX_MS) return;
        const what = state.mode === 'daily' ? 'Défi du jour terminé' : state.duel?.role === 'opponent' ? 'Duel terminé' : 'Duel annulé';
        $('quitModal').hidden = true;
        leaveSession();
        askConfirm({ title: `📵 ${what}`, text: 'Tu es sorti de l’appli pendant la partie. Pour que ce soit juste pour tout le monde, la partie s’arrête : les questions pas encore jouées comptent comme fausses.', yes: 'Compris', no: null });
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
    if (!BAC) {   // 12/11 : entrée cachée DANS l'appli installée (même mémoire que le vrai jeu → la copie de la partie marche) : 5 taps rapides sur le logo
        const logo = document.querySelector('.brand');
        let taps = [];
        logo?.addEventListener('click', async () => {
            const now = Date.now();
            taps = taps.filter(t => now - t < 2500).concat(now);
            if (taps.length < 5) return;
            taps = [];
            if (await askConfirm({ title: '🧪 Bac à sable', text: 'Ouvrir le bac à sable ? C’est une copie de ta partie : rien n’y est envoyé en ligne et ton vrai jeu ne change pas.', yes: 'Ouvrir', no: 'Annuler' }))
                location.href = `${location.pathname}?bac=1`;
        });
        return;
    }
    const pill = el('button', 'bac-pill');
    pill.type = 'button';
    pill.textContent = '🧪';
    pill.setAttribute('aria-label', 'Bac à sable');
    pill.addEventListener('click', async () => {
        let realLv = 0;
        try { realLv = JSON.parse(localStorage.getItem('cultureG_v2') || 'null')?.unlocked || 0; } catch (e) { /* illisible */ }
        const more = await askConfirm({ title: '🧪 Bac à sable', text: `Une copie de ta partie : tout ce que tu fais ici reste ici. Rien n’est envoyé en ligne, ton vrai jeu ne change pas. ${realLv ? `Copie : niveau ${Math.min(state.data.unlocked, MAX_LEVEL)} (vraie partie : niveau ${Math.min(realLv, MAX_LEVEL)}).` : 'Ta vraie partie n’est pas sur ce navigateur : ouvre le bac à sable depuis l’appli (5 taps sur le logo).'}`,
            yes: '+1 000 🪙 pour tester', no: 'Plus d’options' });
        if (more) { state.data.coins += 1000; saveData(); renderHeader(); if (!$('shopScreen').hidden) renderShop(); return; }
        // 11/11 : en 2e, pour la trouver facilement (demande de l'utilisateur)
        const anim = await askConfirm({ title: '🧪 Bac à sable', text: 'Voir l’animation du jour de série (avec ta série actuelle) ?', yes: 'Voir l’animation', no: 'Plus d’options' });
        if (anim) { showStreakAnim(Math.max(2, state.data.streak || 1)); return; }
        const place = await askConfirm({ title: '🧪 Bac à sable', text: 'Refaire le test de placement (7 étapes, jusqu’au niveau 141) ? Ta copie ne recule pas : tu verras seulement le niveau obtenu.', yes: 'Faire le test', no: 'Plus d’options' });
        if (place) { showScreen('map'); openPlacementModal(); return; }
        const tips = await askConfirm({ title: '🧪 Bac à sable', text: 'Revoir les bulles d’explication (Halloween, Défis, Profil, Classement) ?', yes: 'Revoir les bulles', no: 'Plus d’options' });
        if (tips) {
            const d = state.data;
            EVENTS.forEach(ev => { d[ev.tip] = false; d[`${ev.tip}Page`] = false; });
            ['tipChallenges', 'tipTraining', 'tipTraining2', 'tipProfile', 'tipLeague', 'tipLeagueIntro', 'tipDrops'].forEach(k => { d[k] = false; });
            saveData();
            showToast('Bulles remises : va dans Défis pour les voir.');
            return;
        }
        const more2 = await askConfirm({ title: '🧪 Bac à sable', text: 'Voir les autres petites fêtes ?', yes: 'Récap du mois en cours', no: 'Plus d’options' });
        if (more2) { recapSlides = []; openRecap(monthKeyOf(todayKey())); return; }
        const more3 = await askConfirm({ title: '🧪 Bac à sable', text: 'Voir le gel de série puis le nouveau titre ?', yes: 'Gel + titre', no: 'Plus d’options' });
        if (more3) { celebrate(() => showFreezeAnim(state.data.streak || 1)); const t = titleFor(state.data.xp); celebrate(() => showTitleAnim({ from: 'Curieux', to: t.current.name, next: t.next })); return; }
        const summit = await askConfirm({ title: '🧪 Bac à sable', text: `Voir la fête du sommet (niveau ${MAX_LEVEL} réussi) ?`, yes: 'Voir la fête', no: 'Plus d’options' });
        if (summit) { celebrate(() => showSummitAnim()); return; }
        const rp = await askConfirm({ title: '🧪 Bac à sable', text: 'Voir le récap du parcours (avec les chiffres de cette partie) ?', yes: 'Voir le récap', no: 'Plus d’options' });
        if (rp) { if (!state.data.summitDone) state.data.summitDone = todayKey(); openParcoursRecap(); return; }
        const coll = await askConfirm({ title: '🧪 Bac à sable', text: 'Voir la fête « collection complète » (thème Histoire) ?', yes: 'Voir la fête', no: 'Plus d’options' });
        if (coll) { celebrate(() => showCollectionAnim('Histoire', see => { if (see) { showScreen('profile'); setProfileTab('cards'); } })); return; }
        const hopIt = await askConfirm({ title: '🧪 Bac à sable', text: 'Voir Kulti ouvrir le niveau suivant (comme après un niveau réussi) ?', yes: 'Voir Kulti', no: 'Plus d’options' });
        if (hopIt) { showScreen('map'); setTimeout(() => playKultiHop(Math.min(state.data.unlocked, MAX_LEVEL) - 1, Math.min(state.data.unlocked, MAX_LEVEL)), 400); return; }
        const reset = await askConfirm({ title: '🧪 Bac à sable', text: 'Recommencer le test avec une nouvelle copie de ta vraie partie ?', yes: 'Recommencer le test', no: 'Plus d’options' });
        if (reset) { try { localStorage.removeItem(STORAGE_KEY); } catch (err) { /* tant pis */ } location.reload(); return; }
        const leave = await askConfirm({ title: '🧪 Bac à sable', text: 'Revenir au vrai jeu ? (ta copie du bac à sable est gardée)', yes: 'Revenir au vrai jeu', no: 'Fermer' });
        if (leave) location.href = location.pathname;
    });
    document.body.append(pill);
    // Faux amis, pour voir les cadres et les fonds chez les autres
    const me = { id: 'bac-moi' };
    cloudUser = me;
    const fake = (id, pseudo, hue, emoji, bg, frame, xp, found) => ({ id, link: id, pseudo, look: { hue, emoji, bg, frame }, week: weekStart(), week_xp: xp,
        prev_week: null, prev_week_xp: 0, streak: 5, summary: { days: Array.from({ length: found % 7 + 3 }, (_, i) => shiftDays(todayKey(), -i)), title: 'Curieux', xp: xp * 3, streak: 5, unlocked: 30, levels: 29, badges: [], cards: [], event: { id: 'halloween-2026', found } } });
    league = { userId: 'bac-moi', pseudo: (loadLeagueCache() || {}).pseudo || 'Moi', incoming: [], outgoing: [], duels: [],
        friends: [fake('bac1', 'Léa', 330, '🦉', 'bg-galaxy', 'fr-laurel-gold', 420, 31), fake('bac2', 'Tom', 15, null, null, 'fr-flame', 260, 12),
                  fake('bac3', 'Inès', 200, '🦄', 'bg-or', 'fr-diamond', 180, 45), fake('bac4', 'Noé', 120, '🐢', 'bg-ocean', 'fr-checker', 90, 5)] };
}

/* « Quoi de neuf ? » (2026-11-09 : 10 paliers d'entraînement, texte validé par l'utilisateur, sans la ligne sur la correction).
   NOTES_DAY = date de la dernière annonce (indépendante de PATCH_DAY, qui active encore la mise à jour du 26/10). */
const NOTES_DAY = '2026-11-09';
const PATCH_NOTES = [
    ['🎯', 'L’entraînement passe à 10 paliers', 'Près de 1 900 nouvelles questions : la plupart des thèmes ont maintenant 300 questions. Nouveaux paliers : Curieux, Amateur, Averti, Érudit et Virtuose. Le dernier, Maître, donne la carte Maître.'],
    ['🔄', 'Ta progression est gardée', 'Ton palier est converti : le palier 3 sur 5 devient le palier 6 sur 10. Les nouvelles questions des paliers déjà validés arrivent petit à petit dans tes sessions.'],
    ['🏅', 'Médailles recalculées', 'Elles comptent maintenant sur toutes les questions du thème. Si ton or est redevenu bronze ou argent, à toi de le reconquérir ! Tes badges, eux, restent.'],
    ['🃏', 'Les cartes', '1 carte par palier réussi, et 2 aux paliers 5 et 10.']
];
function maybeShowPatchNotes() {
    const d = state.data;
    if ((d.patchSeen === NOTES_DAY && !demoLundi) || !d.onboarded) return;
    const oldPlayer = demoLundi || Object.keys(d.activeDays || {}).some(k => k < NOTES_DAY);
    if (!oldPlayer) { d.patchSeen = NOTES_DAY; saveData(); return; }   // nouveau joueur : rien à annoncer
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
    state.data.patchSeen = NOTES_DAY;
    saveData();
}

function closeTopOverlay() {
    const open = id => !$(id).hidden;
    if ($('streakAnim') && !$('streakAnim').hidden) { closeStreakAnim(); return true; }
    if (closeCelebrationLayer('titleAnim') || closeCelebrationLayer('freezeAnim') || closeCelebrationLayer('medalAnim')) return true;
    { const o = $('collectionAnim'); if (o && !o.hidden && o._close) { o._close(false); return true; } }
    { const o = $('summitAnim'); if (o && !o.hidden && o._close) { o._close(); return true; } }
    if ($('recapShare') && !$('recapShare').hidden) { $('recapShare').hidden = true; return true; }
    if ($('recapStory') && !$('recapStory').hidden) { closeRecap(); return true; }
    if (open('askModal')) { $('askNo').click(); return true; }
    if (open('photoZoom')) {
        $('photoZoom').hidden = true;
        if (state.phase === 'answering') { $('userInput').readOnly = false; $('userInput').focus(); }
        return true;
    }
    if (open('chestModal')) { if (!state.chest) closeChest(); return true; }   // coffre en cours d'ouverture : on ne ferme pas
    if (open('dropsModal')) { closeDropsModal(); return true; }
    if (open('missionsModal')) { $('missionsModal').hidden = true; return true; }
    if (open('questModal')) { $('questModal').hidden = true; return true; }
    if (open('patchModal')) { closePatchNotes(); return true; }
    if (open('avatarModal')) { closeAvatarModal(); return true; }
    if (open('titlesModal')) { $('titlesModal').hidden = true; return true; }
    if (open('friendModal')) { const bk = $('friendModal').classList.contains('is-enc-full') && $('friendBody').querySelector(':scope > .duel-back'); if (bk) bk.click(); else $('friendModal').hidden = true; return true; }
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
        const current = document.querySelector('.node.is-current:not(.is-optional)');
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
        setTimeout(summitCatchUp, 2600);   // 13/11 : fête du sommet jamais vue (elle plantait à la fin du niveau 300)
    }
    hideSplash();
}
// Écran de chargement : on le laisse au moins ~1,1 s (le temps de l'animation), puis la barre se remplit et il s'efface
function hideSplash() {
    const sp = $('splash');
    if (!sp) return;
    const wait = Math.max(0, 1100 - (Date.now() - (window.splashAt || 0)));
    setTimeout(() => {
        const fill = $('splashFill');
        if (fill) sp.style.setProperty('--w', `${fill.getBoundingClientRect().width / fill.parentNode.getBoundingClientRect().width * 100}%`);
        sp.classList.add('is-ready');
        setTimeout(() => { sp.classList.add('is-out'); setTimeout(() => sp.remove(), 380); }, 280);
    }, wait);
}

document.addEventListener('DOMContentLoaded', init);

// Application installable : le service worker garde une copie du jeu pour jouer hors connexion
// (ne marche qu'en https ou sur localhost, pas en ouvrant le fichier directement)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}