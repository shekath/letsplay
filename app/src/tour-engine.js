/* ───────── TOURNAMENT ORGANIZER (Corporate) ─────────
   Generates a full plan from a few settings:
   - Knockout: seeded bracket (1 v 8, 4 v 5, 2 v 7, 3 v 6), byes for top seeds when the field is not a power of two.
   - Groups + knockout: snake-seeded groups, round-robin (circle method), top teams to semifinals, then the final.
   Then it schedules every match into dates, time slots and venues, and advances winners automatically as results come in.
   Shared by both designs. Each host provides: dateAt(d, t), teamById(id), standings(), S and save(). */
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
