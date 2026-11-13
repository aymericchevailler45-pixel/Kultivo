/* Kultivo — encyclopédie des savoirs (écrans). Chargé en arrière-plan après le démarrage (encCode, script.js). */
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
/** La (ou les) salle(s) spéciale(s) d'un livre : [emoji, nom, phrase, ouverture]. */
function encSpecial(theme) {
    return theme === 'Histoire' ? ['🕰️', 'Ma frise', 'tes événements rangés dans le temps', () => openEncFrise()]
        : theme === 'Mythologie' ? ['🌳', 'L’arbre des dieux', 'Grèce, Égypte et Nordique', () => openEncGods()]
        : theme === 'Sciences' ? [['🫀', 'Mon corps humain', 'les organes que tu connais', () => openEncSpots('sci', 'corps')], ['🪐', 'Mon système solaire', 'les planètes et l’espace', () => openEncSpots('sci', 'espace')]]
        : theme === 'Langue française' ? ['📖', 'Mon dictionnaire', 'tes mots et expressions de A à Z', () => openEncDico()]
        : theme === 'Gastronomie' ? [['🧀', 'Ma France gourmande', 'les spécialités de chaque région', () => openEncFrance()], ['🍜', 'Ma cuisine du monde', 'les plats des autres pays', () => openEncMap('Gastronomie', null, 'cuisine')]]
        : theme === 'Littérature' ? ['📚', 'Ma bibliothèque', 'tes livres rangés sur les étagères', () => openEncLibrary()]
        : theme === 'Musique' ? ['💿', 'Mes vinyles', 'tes artistes rangés dans les bacs', () => openEncVinyls()]
        : theme === 'Jeux' ? ['🕹️', 'Ma salle d’arcade', 'cartouches, bornes, consoles et jeux de société', () => openEncArcade()]
        : theme === 'Sport' ? ['🏆', 'Ma salle des trophées', 'tes coupes, qui grandissent à chaque bonne réponse', () => openEncTrophies()]
        : theme === 'Technologie' ? ['⚙️', 'La frise des inventions', 'de l’imprimerie à l’IA', () => openEncTechFrise()]
        : theme === 'Arts' ? ['🖼️', 'Mon musée', 'tes œuvres accrochées salle par salle', () => openEncMuseum()]
        : theme === 'Cinéma' ? ['🎬', 'Mes affiches', 'films, séries, stars et réalisateurs', () => openEncPosters()]
        : theme === 'Drapeaux' ? ['🏳️', 'Mon mur de drapeaux', 'les drapeaux rangés par continent', () => openEncFlags()]
        : theme === 'Monuments' ? ['💌', 'Mes cartes postales', 'des albums de monuments à compléter', () => openEncPostcards()]
        : ENC_MAP_THEMES.includes(theme) ? ['🗺️', 'Ma carte du monde', 'les pays que tu connais', () => openEncMap(theme)] : null;
}
/** 13/11 (bac à sable) : la salle spéciale en « vitrine » en haut du livre, avec un petit décor ; brille la 1re fois. */
const ENC_VITRINE_DECO = {
    'Histoire': ['🏺', '🏰', '👑', '⚔️'], 'Mythologie': ['⚡', '🔱', '🦉', '🐍'], 'Sciences': [['🫁', '🧠', '🦴'], ['☀️', '🪐', '🌙']],
    'Langue française': ['🔤', '✒️', '📜', '💬'], 'Gastronomie': [['🥖', '🍷', '🥐'], ['🍣', '🌮', '🍝']], 'Littérature': ['📕', '📗', '📘', '📙'],
    'Musique': ['🎸', '🎹', '🎤', '🎷'], 'Jeux': ['👾', '🎲', '🎮', '♟️'], 'Sport': ['🥇', '🏅', '🥈', '🥉'], 'Technologie': ['💡', '📱', '🚂', '🚀'],
    'Arts': ['🎨', '🗿', '🖌️', '🏛️'], 'Cinéma': ['🍿', '🎞️', '🎥', '⭐'], 'Drapeaux': ['🏁', '🚩', '🎌', '🏴'], 'Monuments': ['🗼', '🗽', '🏛️', '📮'],
    'Géographie': ['🌍', '🧭', '⛰️', '🏝️'],
};
function encVitrine(theme) {
    const sp = encSpecial(theme);
    if (!sp) return null;
    const list = Array.isArray(sp[0]) ? sp : [sp];
    const deco = ENC_VITRINE_DECO[theme] || [];
    let seen = {};
    try { seen = JSON.parse(localStorage.getItem('kultivo_enc_vitrine') || '{}'); } catch (e) { /* rien */ }
    const fresh = !seen[theme];
    if (fresh) { seen[theme] = 1; try { localStorage.setItem('kultivo_enc_vitrine', JSON.stringify(seen)); } catch (e) { /* rien */ } }
    const box = el('div', `enc-vit${list.length > 1 ? ' is-two' : ''}`);
    list.forEach((s, i) => {
        const b = el('button', `enc-vit-card${fresh ? ' is-fresh' : ''}`);
        b.type = 'button';
        b.style.setProperty('--c', ENC_COLORS[theme] || '#3d8bff');
        const tag = el('span', 'enc-vit-tag');
        tag.textContent = list.length > 1 ? 'Salle à visiter' : 'Ta salle à visiter';
        const big = el('span', 'enc-vit-e');
        big.textContent = s[0];
        const tx = el('span', 'enc-vit-t');
        const nm = el('b');
        nm.textContent = s[1];
        const sm = el('small');
        sm.textContent = s[2];
        tx.append(nm, sm);
        const shelf = el('span', 'enc-vit-shelf');
        (Array.isArray(deco[0]) ? deco[i] || [] : deco).forEach((d, j) => { const x = el('i'); x.textContent = d; x.style.setProperty('--j', j); shelf.append(x); });
        const go = el('span', 'enc-vit-go');
        go.textContent = 'Entrer ›';
        b.append(tag, big, tx, shelf, go);
        b.addEventListener('click', s[3]);
        box.append(b);
    });
    return box;
}
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
        const special = encSpecial(theme);
        const parts = [quick];
        (special && !ENC_VITRINE ? (Array.isArray(special[0]) ? special : [special]) : []).forEach(special => {   // frise, arbre, cartes… (13/11 : plusieurs possibles)
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
    const vit = ENC_VITRINE ? encVitrine(theme) : null;
    const page = vit ? encPage(null, bar, vit, tiles, search, zone) : encPage(null, bar, tiles, search, zone);
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
        const ids = v.nodes.flatMap(n => n.q), qs = ids.map(id => all.get(id)).filter(Boolean);
        if (qs.length) encDone(`spot:${set}:${k}`, qs.every(encKnown), b);
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
/** 13/11 : petite fête discrète d'un ensemble complet (étagère, bac, continent, salle…) : ruban « ✓ Complet » et, la 1re fois
    qu'on le voit complet, il brille et un petit carillon sonne. Rien à gagner : à part des badges. */
let encDoneSoundAt = 0;
function encDone(key, full, ...els) {
    if (!full) return;
    els.forEach(e => e?.classList.add('is-done'));
    let seen = {};
    try { seen = JSON.parse(localStorage.getItem('kultivo_enc_done') || '{}') || {}; } catch (e) { /* stockage indisponible */ }
    if (seen[key]) return;
    seen[key] = todayKey();
    try { localStorage.setItem('kultivo_enc_done', JSON.stringify(seen)); } catch (e) { /* tant pis : il rebrillera */ }
    els.forEach(e => e?.classList.add('is-new-done'));
    if (Date.now() - encDoneSoundAt > 1500) { encDoneSoundAt = Date.now(); setTimeout(() => playSound('unlock'), 450); }
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
        nm.textContent = cc === 'other' ? '🏁 Drapeaux d’ailleurs' : s.k ? encCountryName(cc) : '❓ Drapeau à découvrir';
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
        encDone(`flag:${k}`, list.every(cc => { const s = st(cc); return s.k >= s.n; }), t, grid);
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
        t.textContent = `🏁 Drapeaux d’ailleurs · ${s.k} / ${s.n}`;
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
        encDone(`post:${key}:${cc}`, known.length === g.length, ...(ccs.length > 1 ? [parts[parts.length - 1]] : []), grid);
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
        nm.textContent = key === 'rest' ? '📜 Manuscrits et coulisses' : b.k ? `📖 ${b.title}` : '❓ Livre à découvrir';
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
        encDone(`lib:${sk}`, bs.every(b => b.k >= b.qs.length), t, row);
        bs.forEach(b => {
            const hs = encLibHash(b.title);
            const known = b.k > 0;
            const bt = el('button', `enc-lib-book${known ? ' is-known' : ''}${known && b.k >= b.qs.length ? ' is-full' : ''}`);
            bt.type = 'button';
            bt.style.height = `${108 + hs % 46}px`;
            bt.style.width = `${28 + (hs >>> 5) % 9}px`;
            if (known) bt.style.setProperty('--bk', ENC_LIB_COLORS[(hs >>> 3) % ENC_LIB_COLORS.length]);
            const sp = el('span', `enc-lib-title${known && b.title.length > 12 ? ' is-long' : ''}`);
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
        rb.textContent = `📜 Manuscrits et coulisses : prix, vocabulaire, auteurs… · ${rest.filter(encKnown).length} / ${rest.length} ›`;
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
        encDone(`${o.cls}:${rk}`, its.every(it => it.k >= it.qs.length), t, row);
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
        restTitle: '🎼 La boîte à musique : instruments et solfège', restDesc: 'Les questions sans disque : instruments, solfège, festivals, salles de concert…',
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
    const arcPos = {}, arcRows = (window.ENC_ARC_ROWS || []).map(r => r[0]);   // 13/11 : couleurs selon la place dans la rangée → deux voisins n'ont jamais la même
    encObjScreen({
        theme: 'Jeux', cls: 'enc-arcpage', title: '🕹️ Ma salle d’arcade', countWord: 'jeux découverts', emo: '🎮', unknown: 'Jeu à découvrir',
        data: window.ENC_ARC || {}, read: d => [d[0], '', d[1]], rows: window.ENC_ARC_ROWS || [],
        restTitle: '💬 Le coin des joueurs', restDesc: 'Les questions sans objet précis : vocabulaire des joueurs, éditeurs, e-sport…',
        subText: () => '', back: '← Ma salle d’arcade', reopen: k => openEncArcade(k), keep,
        make: (it, known, row) => {
            const kind = { ni: 'cart', jv: 'cab', co: 'cons', so: 'box', ec: 'board', jo: 'toy' }[row] || 'box';
            const b = el('button', `enc-arc is-${kind}`);
            const i = (arcPos[row] = (arcPos[row] ?? -1) + 1) + Math.max(0, arcRows.indexOf(row)) * 5, seq = [0, 1, 3, 4, 6, 5, 8, 7, 2, 10, 9, 11];   // rouge, bleu, or, violet, vert, orange…
            b.style.setProperty('--c1', known ? ENC_OBJ_COLORS[seq[i % 12]] : '#a8a29a');
            b.style.setProperty('--c2', known ? ENC_OBJ_COLORS[seq[(i + 6) % 12]] : '#8d877f');
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
// 13/11 : des COUPES qui grandissent (★ / ★★ / ★★★), pas des médailles : celles de l'entraînement sont déjà bronze / argent / or
const ENC_TRO_TIERS = [null, ['bronze', '★', '1 bonne réponse'], ['silver', '★★', '2 bonnes réponses'], ['gold', '★★★', '3 bonnes réponses ou +']];
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
/** Une coupe dessinée, plus grande à chaque bonne réponse (★ petite, ★★ moyenne, ★★★ grande et brillante) ; tier 0 = socle vide. */
function encTroMedal(tier, emo) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 60 70');
    svg.setAttribute('class', 'enc-tro-svg');
    if (!tier) {
        svg.innerHTML = '<rect x="16" y="56" width="28" height="8" rx="2" class="enc-tro-empty"/><text x="30" y="46" text-anchor="middle" class="enc-tro-q">?</text>';
        return svg;
    }
    const sc = [0, 0.62, 0.8, 1][tier], cx = 30, base = 63;
    const g = `<g transform="translate(${cx} ${base}) scale(${sc}) translate(-30 -63)">`;
    const cup = `<path d="M14 6 H46 V18 C46 31 39 38 30 38 C21 38 14 31 14 18 Z" fill="url(#trocup)" stroke="#a67400" stroke-width="1.2"/>
      <path d="M14 10 C5 10 5 24 16 26" fill="none" stroke="#d99a00" stroke-width="3"/><path d="M46 10 C55 10 55 24 44 26" fill="none" stroke="#d99a00" stroke-width="3"/>
      <rect x="27" y="38" width="6" height="9" fill="#d99a00"/><rect x="19" y="47" width="22" height="6" rx="1.5" fill="#b07800"/>
      <rect x="15" y="53" width="30" height="10" rx="2" fill="#5b3a1e"/>
      <path d="M19 9 C19 22 22 30 27 34" fill="none" stroke="#fff6c8" stroke-width="2" opacity="0.7"/>
      <text x="30" y="27" text-anchor="middle" font-size="12">${emo}</text>`;
    const stars = `<text x="30" y="61" text-anchor="middle" font-size="7.5" fill="#ffd34d" letter-spacing="0.5">${'★'.repeat(tier)}</text>`;
    svg.innerHTML = `<defs><linearGradient id="trocup" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe58a"/><stop offset="0.55" stop-color="#f3b400"/><stop offset="1" stop-color="#c98a00"/></linearGradient></defs>${g}${cup}${stars}</g>`;
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
    sub.textContent = `${fmtNum(all.length - tot[0])} / ${fmtNum(all.length)} coupes gagnées`;
    // podium : argent · or · bronze
    const pod = el('div', 'enc-tro-podium');
    [[2, 'is-2'], [3, 'is-3'], [1, 'is-1']].forEach(([t, cls]) => {
        const col = el('div', `enc-tro-step ${cls}`);
        const m = el('span', 'enc-tro-pm');
        m.append(encTroMedal(t, ''));
        const n = el('b');
        n.textContent = fmtNum(tot[t]);
        const l = el('small');
        l.textContent = ENC_TRO_TIERS[t][1];
        const st = el('span', 'enc-tro-block');
        st.append(n, l);
        col.append(m, st);
        pod.append(col);
    });
    const rule = el('p', 'enc-tro-rule');
    rule.textContent = 'Chaque bonne réponse à une question fait grandir sa coupe : ★ = 1 bonne réponse · ★★ = 2 · ★★★ = 3 ou plus.';
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
        ts.textContent = `★★★ ${k[3]} · ★★ ${k[2]} · ★ ${k[1]}`;
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
    try { await encLoad('trophees-plaques.js'); } catch (e) { /* plaques = réponses */ }
    try { await encLoad('trophees.js'); } catch (e) { showToast('📶 Indisponible hors connexion pour l’instant'); return; }
    const c = encChapters('Sport')[ci];
    if (!c) return;
    const k = encTroCounts(c.qs);
    const h = el('h2', 'review-title enc-title is-sm');
    h.textContent = `${c.emo} ${c.name}`;
    const sub = el('p', 'enc-chap-sub');
    sub.textContent = `★★★ ${k[3]} · ★★ ${k[2]} · ★ ${k[1]} · ${c.qs.length - k[0]} / ${c.qs.length} coupes`;
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
        if (rest.length) groups.push(['🏋️ Sports en tous genres', rest, '🏋️']);
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
        encDone(`tro:${ci}:${label || ''}`, known.length === qs.length, ...(label ? [parts[parts.length - 1]] : []), cab);
        sorted.forEach(q => {
            const tier = encTroTier(q);
            const up = seen && tier > (seen[q.id] || 0);
            if (tier) next[q.id] = tier;
            const b = el('button', `enc-tro-item${tier ? ` is-${ENC_TRO_TIERS[tier][0]}` : ' is-empty'}${up ? ' is-up' : ''}`);
            b.type = 'button';
            b.append(encTroMedal(tier, gEmo));
            const pl = el('span', 'enc-tro-plate');
            pl.textContent = tier ? (window.ENC_TRO_PLATE?.[q.id] || q.a[0]) : '???';   // 13/11 : le sujet, pas « 11 » ou « L’Angleterre »
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
    offT.textContent = `🗂️ Les inventions de tous les jours (sans date précise) · ${offKnown.length} / ${undated.length}`;
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
    offChip.textContent = '🗂️ De tous les jours';
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
        if (dtxt && key === 'rest') { const d = el('p', 'enc-god-desc'); d.textContent = dtxt; card.append(d); }
        encQRows(card, it.qs, { label: o.retLabel, fn: () => o.reopen(key) }, o.label || (q => [q.q.replace(/\s*\?$/, ''), q.a[0]]));
        if (dtxt && key !== 'rest') {   // 13/11 : à part, sous les questions : ce n'est pas une réponse sue, juste pour aller plus loin
            const m = el('div', 'enc-more');
            const mt = el('b');
            mt.textContent = '💡 Pour aller plus loin';
            const mp = el('p');
            mp.textContent = dtxt;
            m.append(mt, mp);
            card.append(m);
        }
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
        encDone(`${o.cls}:${rk}`, list.every(x => x.k >= x.qs.length), t, row);
        sorted.forEach(it => {
            const known = it.k > 0;
            const b = el('button', `enc-rows-item ${o.itemCls(it)}${known ? ' is-known' : ''}${it.qs.length && it.k >= it.qs.length ? ' is-full' : ''}`);
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
    try { await encLoad('tableaux.js'); } catch (e) { /* sans les tableaux dessinés à la main */ }
    const M = window.ENC_MUSEUM || { rooms: [], q: {} };
    const { rows, rest } = encRowsGroup('Arts', M.q, M.rooms, v => ({ emo: v[2], person: v[3], works: v[4] || [] }));
    encRowsScreen({
        cls: 'enc-muspage', title: '🖼️ Mon musée', unit: 'œuvres et artistes découverts', unknown: it => it.row === 'scu' ? 'Sculpture à découvrir' : it.row === 'mus' ? 'Musée à découvrir' : 'Œuvre à découvrir',
        back: { label: '← Arts', fn: () => openEncBook('Arts', true) }, rows, rest,
        restLabel: '🎨 L’atelier : techniques, couleurs et vocabulaire', restName: '🎨 L’atelier', restDesc: 'Les techniques, les couleurs et le vocabulaire des artistes.',
        retLabel: '← Mon musée', reopen: k => openEncMuseum(k),
        head: it => `${it.emo || '🖼️'} ${it.title}`,
        desc: it => {
            if (!it.person || !it.works.length || !it.qs.some(encKnown)) return '';   // 13/11 : toujours les œuvres célèbres de l'artiste
            return `Ses œuvres célèbres : ${it.works.map(w => `« ${w} »`).join(', ')}`;
        },
        itemCls: it => `enc-mus-item is-${it.row}`,
        make: (it, known) => {
            const hs = encHash(it.key);
            const fr = el('span', 'enc-mus-frame');
            const w = it.row === 'scu' ? 70 : 66 + hs % 30, hh = it.row === 'scu' ? 92 : 62 + (hs >>> 6) % 40;
            fr.style.width = `${w}px`;
            fr.style.height = `${hh}px`;
            const paint = window.ENC_MUS_PAINT?.[`${it.row}|${it.title}`] || window.ENC_MUS_PAINT?.[it.title];   // « scu|Michel-Ange » = David, pas la Chapelle Sixtine
            if (known && paint) {   // 13/11 : œuvre célèbre dessinée à la main (version simplifiée reconnaissable)
                const ns = 'http://www.w3.org/2000/svg';
                const svg = document.createElementNS(ns, 'svg');
                svg.setAttribute('viewBox', '0 0 100 100');
                svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
                svg.setAttribute('class', `enc-mus-svg${it.row === 'scu' ? ' is-statue' : ''}`);
                svg.innerHTML = paint;
                fr.append(svg);
            } else if (known) {
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
const ENC_POS_HUES = { gu: [90, 40], fr: [210, 350], cl: [35, 20], sf: [230, 270], dr: [0, 330], co: [320, 20], sa: [260, 200], an: [190, 140], se: [280, 170] };
async function openEncPosters(keepKey = null) {
    try { await encLoad('affiches.js'); } catch (e) { showToast('📶 Indisponible hors connexion pour l’instant'); return; }
    const P = window.ENC_POSTERS || { rows: [], q: {} };
    const { rows, rest } = encRowsGroup('Cinéma', P.q, P.rows, v => ({ emo: v[2], year: v[3], films: v[4] || [] }));
    encRowsScreen({
        cls: 'enc-pospage', title: '🎬 Mes affiches de cinéma', unit: 'affiches découvertes', unknown: it => it.row === 'st' ? 'Star à découvrir' : it.row === 're' ? 'Réalisateur à découvrir' : 'Affiche à découvrir',
        back: { label: '← Cinéma', fn: () => openEncBook('Cinéma', true) }, rows, rest,
        restLabel: '🎟️ Les coulisses : festivals, prix et métiers', restName: '🎟️ Les coulisses', restDesc: 'Festivals, récompenses, inventeurs et métiers du cinéma.',
        retLabel: '← Mes affiches', reopen: k => openEncPosters(k),
        head: it => it.row === 'st' ? `⭐ ${it.title}` : it.row === 're' ? `🎬 ${it.title}` : `${it.emo || '🎬'} ${it.title}${it.year ? ` · ${it.year}` : ''}`,
        desc: it => {
            if ((it.row !== 'st' && it.row !== 're') || !it.films.length || !it.qs.some(encKnown)) return '';   // 13/11 : 2-3 films connus
            return `${it.row === 're' ? 'Ses films les plus connus' : 'Ses films les plus connus'} : ${it.films.map(f => /\(série\)$/.test(f) ? `« ${f.replace(/\s*\(série\)$/, '')} » (série)` : `« ${f} »`).join(', ')}`;
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
