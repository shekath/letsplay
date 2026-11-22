/* ───────── TOURNAMENT ORGANIZER (Enterprise) ─────────
   Generates a full plan from a few settings:
   - Knockout: seeded bracket (1 v 8, 4 v 5, 2 v 7, 3 v 6), byes for top seeds when the field is not a power of two.
   - Groups + knockout: snake-seeded groups, round-robin (circle method), top teams to semifinals, then the final.
   Then it schedules every match into dates, time slots and venues, and advances winners automatically as results come in. */
const SCORE = { cricket: ['runs', [95, 190], 'super over'], football: ['goals', [0, 4], 'penalties'], kabaddi: ['points', [22, 46], 'golden raid'],
  basketball: ['points', [28, 64], 'overtime'], volleyball: ['sets', [0, 2], 'golden set'], badminton: ['games', [0, 2], 'decider'] };
const TOUR_SPORTS = ['cricket', 'football', 'kabaddi', 'badminton', 'volleyball', 'basketball'];
const scoreOf = (sport) => SCORE[sport] || ['points', [0, 10], 'tie-break'];

function rng(seed) { return function () { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function seedOrder(P) { let s = [1, 2]; while (s.length < P) { const L = s.length * 2; s = s.flatMap((x) => [x, L + 1 - x]); } return s; }
const koRoundName = (k) => (k === 2 ? 'Final' : k === 4 ? 'Semifinals' : k === 8 ? 'Quarterfinals' : 'Round of ' + k);
const koPrefix = (k) => (k === 4 ? 'SF' : k === 8 ? 'QF' : 'R' + k + '-');
function rrRounds(list) {
  const t = list.slice(); if (t.length % 2) t.push(null);
  const n = t.length, R = [];
  for (let r = 0; r < n - 1; r++) {
    const pairs = [];
    for (let i = 0; i < n / 2; i++) { const a = t[i], b = t[n - 1 - i]; if (a && b) pairs.push(r % 2 ? [b, a] : [a, b]); }
    R.push(pairs); t.splice(1, 0, t.pop());
  }
  return R;
}
function addMins(t, m) { const [h, mm] = t.split(':').map(Number); const x = h * 60 + mm + m; return String(Math.floor(x / 60) % 24).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0'); }
function playable(d, mode) { const wd = dateAt(d, '12:00').getDay(); return mode === 'every' || (mode === 'weekdays' ? wd > 0 && wd < 6 : wd === 0 || wd === 6); }

function orderTeams(cfg, rand) {
  if (cfg.seeding === 'random') { const a = cfg.teams.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  return standings().map((t) => t.id).filter((id) => cfg.teams.includes(id));
}

function buildTournament(cfg, rand = Math.random) {
  const teams = orderTeams(cfg, rand);
  const M = []; let mid = 0;
  const add = (o) => { const m = Object.assign({ id: 'm' + (++mid), sa: null, sb: null, winner: null, tb: null, bye: false, a: null, b: null }, o); M.push(m); return m; };
  let groups = null, entrants;
  if (cfg.format === 'groups') {
    const G = teams.length >= 6 ? 2 : 1, names = ['A', 'B'].slice(0, G); groups = {};
    names.forEach((g) => (groups[g] = []));
    teams.forEach((t, i) => { const row = Math.floor(i / G); const idx = row % 2 === 0 ? i % G : G - 1 - (i % G); groups[names[idx]].push(t); });
    names.forEach((g) => { let n = 0; rrRounds(groups[g]).forEach((pairs, r) => pairs.forEach(([a, b]) => add({ stage: 'group', group: g, rk: r, round: `Group ${g} · Matchday ${r + 1}`, label: g + (++n), a, b }))); });
    entrants = G === 2
      ? [{ type: 'group', ref: 'A1' }, { type: 'group', ref: 'B2' }, { type: 'group', ref: 'B1' }, { type: 'group', ref: 'A2' }]
      : [{ type: 'group', ref: 'A1' }, { type: 'group', ref: 'A4' }, { type: 'group', ref: 'A2' }, { type: 'group', ref: 'A3' }];
  } else {
    const P = Math.pow(2, Math.ceil(Math.log2(teams.length)));
    entrants = seedOrder(P).map((s) => (s <= teams.length ? { type: 'team', ref: teams[s - 1], seed: s } : { type: 'bye' }));
  }
  let cur = entrants, k = cur.length, rk = 100, semis = [];
  while (k >= 2) {
    const next = [], name = koRoundName(k);
    for (let i = 0; i < k / 2; i++) {
      const m = add({ stage: 'ko', rk, round: name, label: k === 2 ? 'Final' : koPrefix(k) + (i + 1), srcA: cur[2 * i], srcB: cur[2 * i + 1] });
      if (k === 4) semis.push(m.id);
      next.push({ type: 'win', ref: m.id });
    }
    cur = next; k /= 2; rk++;
  }
  if (cfg.thirdPlace && semis.length === 2) add({ stage: 'ko', rk: rk - 1.5, round: 'Third place', label: '3rd', srcA: { type: 'lose', ref: semis[0] }, srcB: { type: 'lose', ref: semis[1] } });
  const T = Object.assign({ id: 'tr' + Date.now(), created: Date.now(), groups, matches: M, champion: null }, JSON.parse(JSON.stringify(cfg)));
  T.seeds = teams;
  propagate(T); schedulePlan(T);
  return T;
}

function schedulePlan(T) {
  const keys = [...new Set(T.matches.filter((m) => !m.bye).map((m) => m.rk))].sort((a, b) => a - b);
  const V = Math.max(1, T.venues.length);
  let day = T.startDay; while (!playable(day, T.days)) day++;
  let slot = 0, prev = null;
  const nextDay = () => { day++; slot = 0; while (!playable(day, T.days)) day++; };
  keys.forEach((rk) => {
    const ms = T.matches.filter((m) => m.rk === rk && !m.bye);
    const ko = ms[0].stage === 'ko';
    const finalAfterThird = ms[0].round === 'Final' && prev === 'Third place';
    if (ko && slot > 0 && !finalAfterThird) nextDay();
    for (let i = 0; i < ms.length; i += V) {
      ms.slice(i, i + V).forEach((m, j) => { m.d = day; m.t = addMins(T.time, slot * (T.mins + 15)); m.venue = T.venues[j % V]; });
      slot++; if (slot >= T.perDay) nextDay();
    }
    prev = ms[0].round;
  });
  const ds = T.matches.filter((m) => !m.bye).map((m) => m.d);
  T.endDay = Math.max(...ds); T.matchDays = new Set(ds).size;
}

function groupTable(T, g) {
  const rows = T.groups[g].map((id) => ({ id, p: 0, w: 0, d: 0, l: 0, f: 0, a: 0, pts: 0 }));
  const by = Object.fromEntries(rows.map((r) => [r.id, r]));
  T.matches.filter((m) => m.stage === 'group' && m.group === g && m.sa != null).forEach((m) => {
    const A2 = by[m.a], B2 = by[m.b]; A2.p++; B2.p++; A2.f += m.sa; A2.a += m.sb; B2.f += m.sb; B2.a += m.sa;
    if (m.sa > m.sb) { A2.w++; B2.l++; A2.pts += 3; } else if (m.sa < m.sb) { B2.w++; A2.l++; B2.pts += 3; } else { A2.d++; B2.d++; A2.pts++; B2.pts++; }
  });
  return rows.sort((x, y) => y.pts - x.pts || (y.f - y.a) - (x.f - x.a) || y.f - x.f);
}
const groupDone = (T, g) => T.matches.filter((m) => m.stage === 'group' && m.group === g).every((m) => m.sa != null);
function resolveSrc(T, src) {
  if (!src || src.type === 'bye') return null;
  if (src.type === 'team') return src.ref;
  if (src.type === 'group') { const g = src.ref[0], pos = +src.ref.slice(1); return groupDone(T, g) ? (groupTable(T, g)[pos - 1] || {}).id || null : null; }
  const m = T.matches.find((x) => x.id === src.ref); if (!m || !m.winner) return null;
  if (src.type === 'win') return m.winner;
  return m.winner === m.a ? m.b : m.a;
}
function propagate(T) {
  T.matches.filter((m) => m.stage === 'ko').sort((a, b) => a.rk - b.rk).forEach((m) => {
    const a = resolveSrc(T, m.srcA), b = resolveSrc(T, m.srcB);
    if (m.a !== a || m.b !== b) { m.a = a; m.b = b; m.sa = m.sb = null; m.winner = null; m.tb = null; }
    if ((m.srcA && m.srcA.type === 'bye') || (m.srcB && m.srcB.type === 'bye')) { m.bye = true; m.winner = a || b || null; }
  });
  const f = T.matches.find((m) => m.round === 'Final'); T.champion = (f && f.winner) || null;
}
function srcLabel(T, src) {
  if (!src) return 'TBD';
  if (src.type === 'team') return teamById(src.ref).name;
  if (src.type === 'bye') return 'Bye';
  if (src.type === 'group') return T.groups && Object.keys(T.groups).length === 1 ? `#${src.ref.slice(1)} in group` : `Group ${src.ref[0]} #${src.ref.slice(1)}`;
  const m = T.matches.find((x) => x.id === src.ref); return (src.type === 'win' ? 'Winner ' : 'Loser ') + (m ? m.label : '');
}
function playMatch(T, m, sa, sb, tbWinner) {
  m.sa = sa; m.sb = sb;
  m.winner = sa > sb ? m.a : sb > sa ? m.b : m.stage === 'ko' ? tbWinner : null;
  m.tb = sa === sb && m.stage === 'ko' ? tbWinner : null;
  propagate(T);
}
function simulateMatch(T, m, rand) {
  const [, [lo, hi]] = scoreOf(T.sport);
  let a = lo + Math.floor(rand() * (hi - lo + 1)), b = lo + Math.floor(rand() * (hi - lo + 1));
  if (hi === 2) { if (rand() < 0.5) { a = 2; b = Math.floor(rand() * 2); } else { b = 2; a = Math.floor(rand() * 2); } }
  playMatch(T, m, a, b, rand() < 0.5 ? m.a : m.b);
}
const ready = (m) => m.a && m.b && m.sa == null && !m.bye;
function nextRound(T) { const r = T.matches.filter(ready); if (!r.length) return []; const rk = Math.min(...r.map((m) => m.rk)); return r.filter((m) => m.rk === rk); }
function tourStatus(T) {
  if (T.champion) return { text: 'Champion: ' + teamById(T.champion).name, done: true };
  const open = T.matches.filter((m) => !m.bye && m.sa == null).sort((a, b) => a.rk - b.rk)[0];
  if (!open) return { text: 'Complete', done: true };
  return { text: open.stage === 'group' ? 'Group stage' : open.round, done: false };
}
function tourProgress(T) { const ms = T.matches.filter((m) => !m.bye); return { played: ms.filter((m) => m.sa != null).length, total: ms.length }; }

function sampleTournament() {
  const T = buildTournament({ name: 'Monsoon Cricket Cup', sport: 'cricket', format: 'groups', teams: ORG.teams.map((t) => t.id), seeding: 'standings', thirdPlace: true,
    venues: ['Oval Cricket Ground', 'Riverfront Maidan · Turf 2'], startDay: -3, days: 'every', time: '18:30', mins: 120, perDay: 2 }, rng(11));
  T.id = 'tr-sample'; const r = rng(7);
  T.matches.filter((m) => m.stage === 'group').forEach((m) => simulateMatch(T, m, r));
  return T;
}
function tours() { if (!S.tournaments) { S.tournaments = [sampleTournament()]; save(); } return S.tournaments; }

/* ── UI ── */
const crestOf = (id, cls = 'sm') => { const t = teamById(id); return `<span class="crest ${cls}" style="--c:${t.c}">${t.ab}</span>`; };
function cupsBody() {
  const list = tours();
  return `<button class="biz" style="background:var(--ent-deep);color:#fff" data-act="tourNew">${ic('trophy')}<div class="grow"><b>Create a tournament</b><small>Pick teams and dates. LetsPlay generates groups, brackets and the full schedule.</small></div>${ic('chevron-right')}</button>
    <div style="display:grid;gap:12px" class="section">${list.map((T) => { const st = tourStatus(T), pr = tourProgress(T), s2 = sp(T.sport);
      const nxt = T.matches.filter((m) => ready(m)).sort((a, b) => a.d - b.d || a.t.localeCompare(b.t))[0];
      return `<button class="card team-card" data-act="tourOpen" data-id="${T.id}">
        <div class="team-top"><span class="sport-ic" style="--c:${s2.c}">${ic(s2.icon)}</span><div class="grow"><h3>${esc(T.name)}</h3><div class="muted" style="font-size:13px">${T.format === 'groups' ? 'Groups + knockout' : 'Knockout'} · ${T.teams.length} teams · ${longFmt.format(dateAt(T.startDay, '12:00'))} – ${longFmt.format(dateAt(T.endDay, '12:00'))}</div></div>${ic('chevron-right')}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span class="badge ${st.done ? 'volt' : 'ent'}">${ic(st.done ? 'trophy' : 'flame')}${esc(st.text)}</span><span class="faint num" style="font-size:12.5px">${pr.played}/${pr.total} played</span></div>
        <div class="bar" style="--c:var(--ent)"><i style="width:${Math.round((pr.played / pr.total) * 100)}%"></i></div>
        ${nxt ? `<div class="team-next">${ic('calendar', 'ic-sm')}<span>${esc(nxt.round === 'Final' ? 'Final' : nxt.label)}: ${teamById(nxt.a).name} v ${teamById(nxt.b).name} · ${dayLabel(nxt.d)} ${timeFmt.format(dateAt(nxt.d, nxt.t))}</span></div>` : ''}
      </button>`; }).join('')}</div>`;
}

/* Generator */
let TD = null;
function freshTD() {
  return { name: 'Corporate Champions Trophy', sport: 'football', format: 'groups', teams: ORG.teams.map((t) => t.id), seeding: 'standings', thirdPlace: true,
    venues: ['Riverfront Maidan · Turf 2', 'Northgate Courts'], startDay: '1', days: 'weekdays', time: '18:00', mins: '60', perDay: '2' };
}
function tdConfig() { return Object.assign({}, TD, { startDay: +TD.startDay, mins: +TD.mins, perDay: +TD.perDay }); }
function tdError() {
  if (TD.teams.length < (TD.format === 'groups' ? 4 : 3)) return TD.format === 'groups' ? 'Pick at least 4 teams for groups + knockout' : 'Pick at least 3 teams';
  if (!TD.venues.length) return 'Pick at least one venue';
  return '';
}
function openTourGen() {
  TD = TD || freshTD(); popAll();
  const v = push(''); v.id = 'genView'; renderGen();
  v.addEventListener('input', (e) => { const k = e.target.dataset.t; if (k) { TD[k] = e.target.value; genSummary(); } });
  v.addEventListener('change', (e) => { const k = e.target.dataset.t; if (k) { TD[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; genSummary(); } });
}
function genSummary() {
  const el = $('#genSum'); if (!el) return; const err = tdError();
  if (err) { el.innerHTML = `${ic('info', 'ic-sm')}${err}`; return; }
  const T = buildTournament(tdConfig(), rng(1)); const n = T.matches.filter((m) => !m.bye).length, byes = T.matches.filter((m) => m.bye).length;
  el.innerHTML = `${ic('calendar-days', 'ic-sm')}<span><b class="num">${n} matches</b> over ${T.matchDays} match days${byes ? ` · ${byes} bye${byes > 1 ? 's' : ''}` : ''} · Final on ${longFmt.format(dateAt(T.endDay, '12:00'))}</span>`;
}
function renderGen() {
  const v = $('#genView'); if (!v) return; const top = v.scrollTop; const st = standings();
  const seedNo = (id) => (TD.seeding === 'standings' ? st.filter((t) => TD.teams.includes(t.id)).findIndex((t) => t.id === id) + 1 : 0);
  const opt = (k, val, title, sub, icon) => `<button type="button" class="opt" data-act="pickOne" data-group="tdFormat" data-tg="${k}" data-id="${val}" aria-pressed="${TD[k] === val}"><span class="sport-ic" style="--c:var(--ent)">${ic(icon)}</span><div style="min-width:0"><b>${title}</b><div class="faint" style="font-size:13px">${sub}</div></div><span class="tick">${ic('check')}</span></button>`;
  const selT = (id, k, opts) => `<select class="input" id="${id}" data-t="${k}">${opts.map(([a, b]) => `<option value="${a}" ${String(TD[k]) === String(a) ? 'selected' : ''}>${b}</option>`).join('')}</select>`;
  v.innerHTML = `<div class="view-bar"><button class="icon-btn" data-act="back" aria-label="Back">${ic('arrow-left')}</button><h2>New tournament</h2></div>
    <div class="view-body" style="padding-top:4px">
      <div class="field"><label for="tdName">Tournament name</label><input class="input" id="tdName" data-t="name" value="${esc(TD.name)}"></div>
      <div class="field"><span class="lbl">Sport</span><div class="chips" id="tdSport">${TOUR_SPORTS.map((k) => `<button type="button" class="chip sport" style="--c:${SPORTS[k].c}" data-act="pickOne" data-group="tdSport" data-tg="sport" data-id="${k}" aria-pressed="${TD.sport === k}">${ic(SPORTS[k].icon)}${SPORTS[k].name}</button>`).join('')}</div></div>
      <div class="field"><span class="lbl">Format</span><div class="pick" id="tdFormat">
        ${opt('format', 'groups', 'Groups + knockout', 'Round-robin groups, top teams reach the semifinals, winners meet in the final.', 'layers')}
        ${opt('format', 'knockout', 'Straight knockout', 'Seeded bracket. Top seeds get byes if needed. Win and advance.', 'swords')}
      </div></div>
      <div class="field"><span class="lbl">Teams · ${TD.teams.length} selected</span><div class="rows">${st.map((t) => `<button class="row" data-act="genToggle" data-kind="teams" data-id="${t.id}" aria-pressed="${TD.teams.includes(t.id)}">${crestOf(t.id)}<div class="grow"><b>${t.name}</b><small>${t.dept} · ${t.pts} league pts</small></div>${TD.teams.includes(t.id) && seedNo(t.id) ? `<span class="badge ent num">Seed ${seedNo(t.id)}</span>` : ''}<span class="tickbox">${ic('check')}</span></button>`).join('')}</div></div>
      <div class="field"><span class="lbl">Seeding</span><div class="seg" id="tdSeed"><button type="button" data-act="pickOne" data-group="tdSeed" data-tg="seeding" data-id="standings" aria-pressed="${TD.seeding === 'standings'}">League table</button><button type="button" data-act="pickOne" data-group="tdSeed" data-tg="seeding" data-id="random" aria-pressed="${TD.seeding === 'random'}">Random draw</button></div></div>
      <div class="field"><span class="lbl">Starts</span><div class="chips" id="tdStart">${[0, 1, 2, 3, 4, 5, 6, 7].map((d) => `<button type="button" class="chip" data-act="pickOne" data-group="tdStart" data-tg="startDay" data-id="${d}" aria-pressed="${String(TD.startDay) === String(d)}">${dayLabel(d)} ${dateAt(d, '12:00').getDate()}</button>`).join('')}</div></div>
      <div class="field"><span class="lbl">Play on</span><div class="seg" id="tdDays">${[['weekdays', 'Weekdays'], ['weekends', 'Weekends'], ['every', 'Every day']].map(([k, n]) => `<button type="button" data-act="pickOne" data-group="tdDays" data-tg="days" data-id="${k}" aria-pressed="${TD.days === k}">${n}</button>`).join('')}</div></div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
        <div class="field"><label for="tdTime">First match</label><input class="input" type="time" id="tdTime" data-t="time" value="${TD.time}"></div>
        <div class="field"><label for="tdMins">Match length</label>${selT('tdMins', 'mins', [['45', '45 min'], ['60', '1 hr'], ['90', '1.5 hr'], ['120', '2 hr'], ['180', '3 hr']])}</div>
        <div class="field"><label for="tdPer">Slots a day</label>${selT('tdPer', 'perDay', [['1', '1'], ['2', '2'], ['3', '3'], ['4', '4']])}</div>
      </div>
      <div class="field"><span class="lbl">Venues · matches run in parallel</span><div class="chips" style="flex-wrap:wrap">${VENUES_ENT.map((n) => `<button type="button" class="chip" data-act="genToggle" data-kind="venues" data-id="${esc(n)}" aria-pressed="${TD.venues.includes(n)}">${ic('map-pin')}${esc(n)}</button>`).join('')}</div></div>
      <label class="row card" style="gap:12px;cursor:pointer"><input type="checkbox" id="tdThird" data-t="thirdPlace" ${TD.thirdPlace ? 'checked' : ''} style="width:22px;height:22px;accent-color:var(--ent)"><div class="grow"><b>Third-place match</b><small>Semifinal losers play before the final</small></div></label>
      <div class="gen-sum" id="genSum"></div>
    </div>
    <div class="view-cta"><button class="btn btn-primary" style="background:var(--ent)" data-act="tourGenerate">${ic('trophy')}Generate tournament plan</button></div>`;
  v.scrollTop = top; genSummary();
}

/* Tournament detail (also used as preview before publishing) */
let tourTab = 'bracket', previewT = null;
function openTour(id) { const T = tours().find((x) => x.id === id); tourTab = 'bracket'; popAll(); const v = push(''); v.id = 'tourView'; v.dataset.id = id; renderTour(); }
function curTour() { const v = $('#tourView'); if (!v) return null; return v.dataset.preview ? previewT : tours().find((x) => x.id === v.dataset.id); }
function teamLine(T, m, side) {
  const id = side === 'a' ? m.a : m.b, src = side === 'a' ? m.srcA : m.srcB, sc = side === 'a' ? m.sa : m.sb;
  if (!id) return `<div class="tm"><span class="crest sm ph-crest">?</span><span class="ph">${esc(src ? srcLabel(T, src) : 'TBD')}</span></div>`;
  const cls = m.winner ? (m.winner === id ? 'win' : 'lose') : '';
  return `<div class="tm ${cls}">${crestOf(id)}<span class="nm">${teamById(id).name}</span>${sc != null ? `<span class="sc num">${sc}${m.tb === id ? '*' : ''}</span>` : m.bye ? '<span class="sc faint">bye</span>' : ''}</div>`;
}
function matchMeta(m) { return m.bye ? 'Advances on a bye' : `${dayLabel(m.d)} ${dateAt(m.d, '12:00').getDate()} · ${timeFmt.format(dateAt(m.d, m.t))} · ${esc(m.venue)}`; }
function bracketHTML(T) {
  const ko = T.matches.filter((m) => m.stage === 'ko' && m.round !== 'Third place');
  const rounds = [...new Set(ko.map((m) => m.rk))].sort((a, b) => a - b);
  const third = T.matches.find((m) => m.round === 'Third place');
  return `<div class="bracket">${rounds.map((rk) => { const ms = ko.filter((m) => m.rk === rk); return `<div class="bcol"><h4>${ms[0].round}</h4><div class="bstack">${ms.map((m) => `<button class="bmatch ${m.winner ? 'done' : ready(m) ? 'live' : ''}" data-act="tourMatch" data-id="${m.id}"><div class="bl">${esc(m.label)}</div>${teamLine(T, m, 'a')}${teamLine(T, m, 'b')}<div class="meta">${matchMeta(m)}</div></button>`).join('')}</div></div>`; }).join('')}
    ${T.champion ? `<div class="bcol"><h4>Champion</h4><div class="bstack"><div class="champ">${ic('trophy', 'ic-lg')}${crestOf(T.champion, '')}<b>${teamById(T.champion).name}</b></div></div></div>` : ''}</div>
    ${third ? `<div class="section"><div class="eyebrow">Third-place match</div><button class="bmatch wide ${third.winner ? 'done' : ready(third) ? 'live' : ''}" data-act="tourMatch" data-id="${third.id}">${teamLine(T, third, 'a')}${teamLine(T, third, 'b')}<div class="meta">${matchMeta(third)}</div></button></div>` : ''}
    <div class="faint" style="font-size:12.5px;margin-top:10px">Tap a match to enter the result. Winners move to the next round automatically.${T.matches.some((m) => m.tb) ? ` * won the ${scoreOf(T.sport)[2]}.` : ''}</div>`;
}
function scheduleHTML(T) {
  const ms = T.matches.filter((m) => !m.bye).sort((a, b) => a.d - b.d || a.t.localeCompare(b.t) || a.venue.localeCompare(b.venue));
  const days = [...new Set(ms.map((m) => m.d))];
  return days.map((d) => `<div class="day-group section" style="margin-top:14px"><div class="day-label">${longFmt.format(dateAt(d, '12:00'))}${d === 0 ? ' · Today' : ''}</div><div class="rows">${ms.filter((m) => m.d === d).map((m) => `
    <button class="row sched-row" data-act="tourMatch" data-id="${m.id}"><div class="sched-time num"><b>${timeFmt.format(dateAt(m.d, m.t))}</b><small>${esc(m.stage === 'group' ? 'Group ' + m.group : m.round)}</small></div>
      <div class="grow"><div class="sched-teams">${m.a ? teamById(m.a).name : `<i>${esc(srcLabel(T, m.srcA))}</i>`} <span class="faint">v</span> ${m.b ? teamById(m.b).name : `<i>${esc(srcLabel(T, m.srcB))}</i>`}</div><small>${esc(m.venue)}</small></div>
      ${m.sa != null ? `<span class="badge free num">${m.sa}–${m.sb}</span>` : ready(m) ? '<span class="badge ent">Enter</span>' : '<span class="badge">TBD</span>'}</button>`).join('')}</div></div>`).join('');
}
function groupsHTML(T) {
  const q = Object.keys(T.groups).length === 1 ? 4 : 2;
  return Object.keys(T.groups).map((g) => { const rows = groupTable(T, g); return `<div class="section"><div class="section-head"><h2>Group ${g}</h2><span class="faint">${groupDone(T, g) ? 'Complete' : 'In progress'}</span></div>
    <div class="card table-wrap" style="padding:4px 8px"><table class="lb"><thead><tr><th>#</th><th style="text-align:left">Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>+/-</th><th>Pts</th></tr></thead><tbody>
    ${rows.map((r, i) => `<tr class="${i < q ? 'mine' : ''}"><td>${i + 1}</td><td class="team"><div>${crestOf(r.id)}${teamById(r.id).name}</div></td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.f - r.a > 0 ? '+' : ''}${r.f - r.a}</td><td class="pts">${r.pts}</td></tr>`).join('')}
    </tbody></table></div></div>`; }).join('') + `<div class="faint" style="font-size:12.5px;margin-top:8px">Top ${q} qualify (highlighted). 3 points for a win, 1 for a tie. Ties broken by ${scoreOf(T.sport)[0]} difference.</div>`;
}
function renderTour() {
  const v = $('#tourView'); const T = curTour(); if (!v || !T) return; const top = v.scrollTop;
  const preview = !!v.dataset.preview, st = tourStatus(T), pr = tourProgress(T), s2 = sp(T.sport);
  const tabs = [['bracket', 'Bracket'], ['schedule', 'Schedule']].concat(T.groups ? [['groups', 'Groups']] : []);
  if (!tabs.find((t) => t[0] === tourTab)) tourTab = 'bracket';
  const nr = nextRound(T);
  v.innerHTML = `<div class="view-bar"><button class="icon-btn" data-act="back" aria-label="Back">${ic('arrow-left')}</button><h2>${preview ? 'Plan preview' : esc(T.name)}</h2>${preview ? '' : `<button class="icon-btn" data-act="tourDelete" aria-label="Delete tournament">${ic('trash-2')}</button>`}</div>
    <div class="view-body" style="padding-top:4px">
      <div class="org-hero" style="gap:10px">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><span class="badge" style="background:rgba(255,255,255,.18);color:#fff">${ic(s2.icon)}${s2.name} · ${T.format === 'groups' ? 'Groups + knockout' : 'Knockout'}</span><span style="font-size:12.5px;opacity:.85" class="num">${pr.played}/${pr.total} played</span></div>
        <h2>${esc(T.name)}</h2>
        <div style="font-size:13.5px;opacity:.9">${T.teams.length} teams · ${T.matchDays} match days · ${longFmt.format(dateAt(T.startDay, '12:00'))} to ${longFmt.format(dateAt(T.endDay, '12:00'))}<br>${T.venues.map(esc).join(' · ')}</div>
        ${T.champion ? `<div class="champ-banner">${ic('trophy')}<b>${teamById(T.champion).name}</b> are champions</div>` : `<span class="badge" style="justify-self:start;background:#fff;color:var(--ent-deep)">${ic('flame')}${esc(st.text)}</span>`}
      </div>
      ${!preview && nr.length ? `<button class="btn btn-soft btn-block" data-act="tourSim">${ic('shuffle')}Simulate ${esc(nr[0].stage === 'group' ? 'next matchday' : nr[0].round)} (demo)</button>` : ''}
      <div class="seg" role="group" aria-label="Tournament view">${tabs.map(([k, n]) => `<button data-act="tourTab" data-id="${k}" aria-pressed="${tourTab === k}">${n}</button>`).join('')}</div>
      <div>${tourTab === 'bracket' ? bracketHTML(T) : tourTab === 'schedule' ? scheduleHTML(T) : groupsHTML(T)}</div>
    </div>
    ${preview ? `<div class="view-cta"><button class="btn btn-ghost" style="flex:0 0 auto" data-act="tourRegen">${ic('shuffle')}${T.seeding === 'random' ? 'Redraw' : 'Edit'}</button><button class="btn btn-primary" style="background:var(--ent)" data-act="tourPublish">${ic('send')}Publish & notify squads</button></div>` : ''}`;
  v.scrollTop = top;
}
function resultSheet(T, m) {
  if (m.bye) { toast(`${teamById(m.winner).name} advance on a bye`, 'info'); return; }
  if (!m.a || !m.b) { toast(`Waiting for ${!m.a ? srcLabel(T, m.srcA) : srcLabel(T, m.srcB)}`, 'clock'); return; }
  const [unit, , tbName] = scoreOf(T.sport); const A2 = teamById(m.a), B2 = teamById(m.b);
  openSheet(`${sheetHead('Enter result', `${esc(m.stage === 'group' ? m.round : m.round + (m.round === 'Final' ? '' : ' · ' + m.label))} · ${matchMeta(m)}`)}
    <div class="score-grid">
      <div class="score-side">${crestOf(m.a, '')}<b>${A2.name}</b><input class="input num" type="number" min="0" id="scA" value="${m.sa ?? ''}" inputmode="numeric" aria-label="${A2.name} ${unit}"></div>
      <div class="score-vs">${unit}</div>
      <div class="score-side">${crestOf(m.b, '')}<b>${B2.name}</b><input class="input num" type="number" min="0" id="scB" value="${m.sb ?? ''}" inputmode="numeric" aria-label="${B2.name} ${unit}"></div>
    </div>
    ${m.stage === 'ko' ? `<div class="field"><span class="lbl">If level, who won the ${tbName}?</span><div class="seg" id="tbW"><button type="button" data-act="pickOne" data-group="tbW" data-id="${m.a}" aria-pressed="${m.tb !== m.b}">${A2.name}</button><button type="button" data-act="pickOne" data-group="tbW" data-id="${m.b}" aria-pressed="${m.tb === m.b}">${B2.name}</button></div></div>` : ''}
    ${(() => { const nx = T.matches.find((x) => (x.srcA && x.srcA.ref === m.id && x.srcA.type === 'win') || (x.srcB && x.srcB.ref === m.id && x.srcB.type === 'win')); return nx ? `<div class="muted" style="font-size:13px;display:flex;gap:6px;align-items:center">${ic('arrow-right', 'ic-sm')}Winner goes to ${nx.round === 'Final' ? 'the Final' : nx.label} on ${dayLabel(nx.d)} ${dateAt(nx.d, '12:00').getDate()}</div>` : ''; })()}
    <button class="btn btn-primary btn-block" style="background:var(--ent)" data-act="tourSave" data-id="${m.id}">${ic('check')}Save result</button>`, { onMount: (sh) => { const i = $('#scA', sh); if (i) setTimeout(() => i.focus(), 320); } });
}
function afterResultToast(T, m) {
  if (m.round === 'Final' && T.champion) return toast(`${teamById(T.champion).name} are champions!`, 'trophy');
  if (m.stage === 'ko' && m.winner) { const nx = T.matches.find((x) => x.srcA && x.srcA.ref === m.id && x.srcA.type === 'win') || T.matches.find((x) => x.srcB && x.srcB.ref === m.id && x.srcB.type === 'win'); return toast(`${teamById(m.winner).name} advance to the ${nx ? (nx.round === 'Final' ? 'Final' : nx.round) : 'next round'}`, 'arrow-right'); }
  if (m.stage === 'group' && groupDone(T, m.group)) return toast(`Group ${m.group} complete. Semifinals are set`, 'trophy');
  toast('Result saved. Table updated', 'check');
}

Object.assign(A, {
  tourNew: () => { TD = null; openTourGen(); },
  tourOpen: (el) => openTour(el.dataset.id),
  genToggle: (el) => { const arr = TD[el.dataset.kind]; const i = arr.indexOf(el.dataset.id); if (i >= 0) arr.splice(i, 1); else if (el.dataset.kind === 'teams' && arr.length >= 8) { toast('Up to 8 teams per tournament in this prototype', 'info'); return; } else arr.push(el.dataset.id); renderGen(); },
  tourGenerate: () => { const err = tdError(); if (err) { toast(err, 'info'); return; } previewT = buildTournament(tdConfig()); const v = push(''); v.id = 'tourView'; v.dataset.preview = '1'; tourTab = 'bracket'; renderTour(); },
  tourRegen: () => pop(),
  tourPublish: () => { S.tournaments = tours(); S.tournaments.unshift(previewT); save(); const id = previewT.id; TD = null; previewT = null; S.entTab = 'cups'; renderTeams(); openTour(id); toast('Tournament published. Squads notified with their fixtures', 'send'); },
  tourTab: (el) => { tourTab = el.dataset.id; renderTour(); },
  tourMatch: (el) => { const T = curTour(); resultSheet(T, T.matches.find((m) => m.id === el.dataset.id)); },
  tourSave: (el) => { const T = curTour(); const m = T.matches.find((x) => x.id === el.dataset.id);
    const a = parseInt($('#scA').value, 10), b = parseInt($('#scB').value, 10);
    if (Number.isNaN(a) || Number.isNaN(b) || a < 0 || b < 0) { toast(`Enter ${scoreOf(T.sport)[0]} for both teams`, 'info'); return; }
    const tbEl = $('#tbW [aria-pressed="true"]'); playMatch(T, m, a, b, tbEl ? tbEl.dataset.id : m.a);
    if (!$('#tourView').dataset.preview) save(); closeSheet(); renderTour(); afterResultToast(T, m); },
  tourSim: () => { const T = curTour(); const r = Math.random; const ms = nextRound(T); ms.forEach((m) => simulateMatch(T, m, r)); save(); renderTour();
    const last = ms[ms.length - 1]; if (last) afterResultToast(T, last); },
  tourDelete: () => { const T = curTour(); openSheet(`${sheetHead('Delete tournament?', esc(T.name))}<div class="muted">The schedule and results are removed for everyone. This cannot be undone.</div><button class="btn btn-block" style="background:var(--hot);color:#fff" data-act="tourDeleteYes" data-id="${T.id}">${ic('trash-2')}Delete tournament</button><button class="btn btn-ghost btn-block" data-act="closeSheet">Keep it</button>`); },
  tourDeleteYes: (el) => { S.tournaments = tours().filter((t) => t.id !== el.dataset.id); save(); closeSheet(); popAll(); renderTeams(); toast('Tournament deleted', 'trash-2'); },
});
