/* ═════ CORPORATE: company league · fixtures · insights · tournament organizer ═════
   The generator, scheduler and bracket logic come from the shared tour-engine.js. */
const teamById = (id) => ORG.teams.find((t) => t.id === id);
function standings() { return ORG.teams.map((t) => ({ ...t, p: t.w + t.d + t.l, pts: t.w * 3 + t.d })).sort((a, b) => b.pts - a.pts || b.w - a.w); }
const crest = (id, cls = '') => { const t = teamById(id); return t ? `<span class="crest ${cls}" style="--c:${t.c}">${t.ab}</span>` : `<span class="crest ${cls} tbd">?</span>`; };
const matchMeta = (m) => (m.bye ? 'Advances on a bye' : `${dayLabel(m.d)} ${dateAt(m.d, '12:00').getDate()} · ${fmtT(m.d, m.t)} · ${esc((m.venue || '').split(' · ')[0])}`);

let TOUR = null, tourTab = 'bracket', PREV = null;   /* open tournament id, its tab, and an unpublished preview */
function renderCorp() {
  if (TOUR) { renderTour(); return; }
  const v = S.corpView, el = $('#scr-team');
  let body = '';
  if (v === 'league') {
    const st = standings(), played = st.reduce((n, t) => n + t.p, 0) / 2, fx = S.fixtures.slice().sort((a, b) => a.d - b.d || toMin(a.t) - toMin(b.t));
    body = `<div class="org-hero"><span class="eyebrow">${esc(ORG.name)}</span><h2>${esc(ORG.league)}</h2>
        <div class="ostats"><div><b class="num">${ORG.teams.length}</b><small>Teams</small></div><div><b class="num">${ORG.employees}</b><small>Employees</small></div><div><b class="num">${played}</b><small>Matches played</small></div></div></div>
      <div class="section"><h2>Leaderboard</h2>
        <div class="podium">${[1, 0, 2].map((i) => { const t = st[i]; return `<div class="pod p${i + 1}" style="--c:${t.c}"><span class="crest lg" style="--c:${t.c}">${t.ab}</span><b>${esc(t.name.split(' ')[0])}</b><span class="num">${t.pts} pts</span><i>${i + 1}</i></div>`; }).join('')}</div>
        <div class="table card"><div class="tr th"><span>#</span><span>Team</span><span>P</span><span>W</span><span>Pts</span><span>Form</span></div>
          ${st.map((t, i) => `<div class="tr ${i < 4 ? 'q' : ''}"><span class="num">${i + 1}</span><span class="tname">${crest(t.id, 'sm')}${esc(t.name)}</span><span class="num">${t.p}</span><span class="num">${t.w}</span><b class="num">${t.pts}</b><span class="form">${[...t.form].map((r) => `<i class="f${r}" title="${{ W: 'Won', D: 'Drew', L: 'Lost' }[r]}">${r}</i>`).join('')}</span></div>`).join('')}</div>
        <div class="faint" style="font-size:12.5px">Top four reach the cup semifinals. Win 3 points, draw 1.</div></div>
      <div class="section"><div style="display:flex;justify-content:space-between;align-items:center"><h2>This week</h2><button class="pill sm" data-act="addFixture">${ic('plus')}Add fixture</button></div>
        <div class="lrows">${fx.map((f) => { const a = teamById(f.a), b = teamById(f.b), s = sp(f.sport); return `<div class="lrow fx"><span class="evtime num"><b>${dayLabel(f.d)}</b><small>${fmtT(f.d, f.t)}</small></span><span class="ltext"><b>${crest(f.a, 'sm')}${esc(a.name.split(' ')[0])} <span class="faint">v</span> ${crest(f.b, 'sm')}${esc(b.name.split(' ')[0])}</b><small><span class="evtag" style="--c:${s.c}">${s.name}</span>${esc(f.venue.split(' · ')[0])}</small></span></div>`; }).join('')}</div></div>
      <div class="section"><div style="display:flex;justify-content:space-between;align-items:center"><h2>Participation</h2><button class="pill sm soft" data-act="nudgeDepts">${ic('send')}Nudge low</button></div>
        <div class="card bars">${ORG.participation.map(([d, p]) => `<div class="bar"><span>${d}</span><span class="track"><i style="width:${p}%;${p < 50 ? 'background:var(--live)' : ''}"></i></span><b class="num">${p}%</b></div>`).join('')}</div>
        <div class="faint" style="font-size:12.5px">Share of each department that played this month. Below 50% is marked.</div></div>`;
  } else if (v === 'cups') {
    body = `<button class="pill block" style="min-height:56px" data-act="tourNew">${ic('trophy')}Create a tournament</button>
      <div class="faint" style="font-size:13px;margin-top:8px">Pick teams and a format. LetsPlay builds the groups, bracket and full schedule, and moves winners on as results come in.</div>
      <div class="section"><h2>Tournaments</h2><div class="tcards">${tours().map((T) => { const st = tourStatus(T), pr = tourProgress(T), s = sp(T.sport); return `<button class="tcard" style="--c:${s.c}" data-act="tourOpen" data-id="${T.id}"><span class="crest lg" style="--c:${s.c}">${ic(s.icon)}</span><span class="ltext"><b>${esc(T.name)}</b><small>${s.name} · ${T.seeds.length} teams · ${T.format === 'groups' ? 'Groups + knockout' : 'Knockout'}</small><small class="tnext">${st.done ? ic('crown') : ic('timer')}${esc(st.text)}</small><span class="prog"><i style="width:${Math.round((pr.played / pr.total) * 100)}%"></i></span></span><span class="tyes num"><b>${pr.played}/${pr.total}</b><small>played</small></span></button>`; }).join('')}</div></div>`;
  } else {
    body = `<div class="section" style="margin-top:0"><div class="lrows">${ORG.teams.map((t) => rowHTML({ act: 'deptTeam', id: t.id, lead: `<span class="crest" style="--c:${t.c}">${t.ab}</span>`, title: esc(t.name), sub: `${t.dept} · ${t.players} players · ${t.w}W ${t.d}D ${t.l}L` })).join('')}</div></div>`;
  }
  el.innerHTML = `<div class="head"><div><h1>League</h1><div class="sub">${esc(ORG.name)} · Corporate</div></div>${bellHTML()}</div>
    <div class="seg" role="group" aria-label="League section"><button data-act="corpView" data-id="league" aria-pressed="${v === 'league'}">League</button><button data-act="corpView" data-id="cups" aria-pressed="${v === 'cups'}">Cups</button><button data-act="corpView" data-id="teams" aria-pressed="${v === 'teams'}">Teams</button></div>
    <div style="margin-top:16px">${body}</div>`;
}

/* ── Fixture builder ── */
let FX = null;
function fixtureSheet() {
  sheetUpdate(`${head('Add fixture', ORG.league)}
    <div class="fgrp"><b>Home</b><div class="chips wrap">${ORG.teams.map((t) => `<button class="chip" style="--c:${t.c}" data-act="fxTeam" data-k="a" data-id="${t.id}" aria-pressed="${FX.a === t.id}" ${FX.b === t.id ? 'disabled' : ''}>${esc(t.name.split(' ')[0])}</button>`).join('')}</div></div>
    <div class="fgrp"><b>Away</b><div class="chips wrap">${ORG.teams.map((t) => `<button class="chip" style="--c:${t.c}" data-act="fxTeam" data-k="b" data-id="${t.id}" aria-pressed="${FX.b === t.id}" ${FX.a === t.id ? 'disabled' : ''}>${esc(t.name.split(' ')[0])}</button>`).join('')}</div></div>
    <div class="fgrp"><b>Sport</b><div class="chips">${TOUR_SPORTS.map((k) => `<button class="chip" style="--c:${sp(k).c}" data-act="fxSport" data-id="${k}" aria-pressed="${FX.sport === k}">${ic(sp(k).icon)}${sp(k).name}</button>`).join('')}</div></div>
    <div class="fgrp"><b>Day and time</b><div class="chips">${[0, 1, 2, 3, 4, 5, 6].map((d) => `<button class="chip neutral" data-act="fxDay" data-id="${d}" aria-pressed="${FX.d === d}">${dayLabel(d)} ${dateAt(d, '12:00').getDate()}</button>`).join('')}</div>
      <div class="chips">${['07:00', '13:00', '17:30', '18:30', '19:30'].map((t) => `<button class="chip neutral" data-act="fxTime" data-id="${t}" aria-pressed="${FX.t === t}">${tf.format(dateAt(0, t))}</button>`).join('')}</div></div>
    <div class="fgrp"><b>Venue</b><div class="chips wrap">${VENUES_ENT.map((v) => `<button class="chip neutral" data-act="fxVenue" data-id="${esc(v)}" aria-pressed="${FX.venue === v}">${esc(v.split(' · ')[0])}</button>`).join('')}</div></div>
    ${FX.clash ? `<div class="errbox">${ic('info')}<div>${esc(FX.clash)}</div></div>` : ''}
    <button class="pill block" data-act="fxSave" ${FX.a && FX.b ? '' : 'disabled'}>${ic('calendar-days')}Add to the schedule</button>`);
}

/* ── Tournament generator ── */
let TD = null;
const freshTD = () => ({ name: 'Diwali Cup', sport: 'football', format: 'groups', teams: ORG.teams.map((t) => t.id), seeding: 'standings', startDay: 2, days: 'weekdays', time: '18:00', mins: 60, perDay: 2, venues: [VENUES_ENT[1], VENUES_ENT[3]], thirdPlace: true });
function genSheet() {
  const n = TD.teams.length, err = n < 4 ? 'Pick at least 4 teams.' : !TD.venues.length ? 'Pick at least one venue.' : !TD.name.trim() ? 'Name the tournament.' : '';
  const summary = !err ? (() => { const T = buildTournament(Object.assign({}, TD), rng(3)); const ms = T.matches.filter((m) => !m.bye).length; return `${ms} matches over ${T.matchDays} match days, ${dayLabel(T.startDay)} to ${dayLabel(T.endDay)} ${dateAt(T.endDay, '12:00').getDate()}`; })() : '';
  sheetUpdate(`${head('Create a tournament', 'LetsPlay builds the plan and schedule')}
    <label class="fld"><span>Name</span><input id="tdName" value="${esc(TD.name)}"></label>
    <div class="fgrp"><b>Sport</b><div class="chips">${TOUR_SPORTS.map((k) => `<button class="chip" style="--c:${sp(k).c}" data-act="tdSet" data-k="sport" data-id="${k}" aria-pressed="${TD.sport === k}">${ic(sp(k).icon)}${sp(k).name}</button>`).join('')}</div></div>
    <div class="fgrp"><b>Format</b><div class="seg" role="group" aria-label="Format"><button data-act="tdSet" data-k="format" data-id="groups" aria-pressed="${TD.format === 'groups'}">Groups + knockout</button><button data-act="tdSet" data-k="format" data-id="knockout" aria-pressed="${TD.format === 'knockout'}">Knockout</button></div></div>
    <div class="fgrp"><b>Teams <span class="faint num">${n} picked</span></b><div class="chips wrap">${ORG.teams.map((t) => `<button class="chip" style="--c:${t.c}" data-act="tdTeam" data-id="${t.id}" aria-pressed="${TD.teams.includes(t.id)}">${esc(t.name.split(' ')[0])}</button>`).join('')}</div></div>
    <div class="fgrp"><b>Seeding</b><div class="seg" role="group" aria-label="Seeding"><button data-act="tdSet" data-k="seeding" data-id="standings" aria-pressed="${TD.seeding === 'standings'}">League table</button><button data-act="tdSet" data-k="seeding" data-id="random" aria-pressed="${TD.seeding === 'random'}">Random draw</button></div></div>
    <div class="fgrp"><b>Starts</b><div class="chips">${[1, 2, 3, 4, 5, 6, 7].map((d) => `<button class="chip neutral" data-act="tdSet" data-k="startDay" data-id="${d}" aria-pressed="${TD.startDay === d}">${dayLabel(d)} ${dateAt(d, '12:00').getDate()}</button>`).join('')}</div>
      <div class="seg" role="group" aria-label="Play on"><button data-act="tdSet" data-k="days" data-id="weekdays" aria-pressed="${TD.days === 'weekdays'}">Weekdays</button><button data-act="tdSet" data-k="days" data-id="weekends" aria-pressed="${TD.days === 'weekends'}">Weekends</button><button data-act="tdSet" data-k="days" data-id="every" aria-pressed="${TD.days === 'every'}">Every day</button></div></div>
    <div class="fgrp"><b>First match, length and matches a day</b><div class="chips">${['07:00', '13:00', '17:30', '18:00', '19:00'].map((t) => `<button class="chip neutral" data-act="tdSet" data-k="time" data-id="${t}" aria-pressed="${TD.time === t}">${tf.format(dateAt(0, t))}</button>`).join('')}</div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><div class="seg" style="flex:1;min-width:180px" role="group" aria-label="Match length">${[45, 60, 90, 120].map((m) => `<button data-act="tdSet" data-k="mins" data-id="${m}" aria-pressed="${TD.mins === m}">${m} min</button>`).join('')}</div>
      <div class="stepper"><button data-act="tdPer" data-d="-1" aria-label="Fewer slots a day">${ic('minus')}</button><b class="num">${TD.perDay}/day</b><button data-act="tdPer" data-d="1" aria-label="More slots a day">${ic('plus')}</button></div></div></div>
    <div class="fgrp"><b>Venues <span class="faint">matches run in parallel</span></b><div class="chips wrap">${VENUES_ENT.map((v) => `<button class="chip neutral" data-act="tdVenue" data-id="${esc(v)}" aria-pressed="${TD.venues.includes(v)}">${esc(v.split(' · ')[0])}</button>`).join('')}</div></div>
    ${rowHTML({ act: 'tdThird', pressed: TD.thirdPlace, icon: 'medal', title: 'Third-place match', sub: 'Losing semifinalists play for bronze', end: `<span class="tickbox">${ic('check')}</span>` })}
    ${err ? `<div class="errbox">${ic('info')}<div>${err}</div></div>` : `<div class="okbox">${ic('calendar-days')}<div><b>Plan ready</b><br>${summary}</div></div>`}
    <button class="pill block" style="min-height:56px" data-act="tdGen" ${err ? 'disabled' : ''}>${ic('sparkles')}Generate the plan</button>`);
  $('#tdName').addEventListener('input', (e) => { TD.name = e.target.value; });
}

/* ── Tournament view: bracket · schedule · groups ── */
const curTour = () => (PREV && TOUR === PREV.id ? PREV : tours().find((x) => x.id === TOUR));
function teamLine(T, m, side) {
  const id = m[side], src = m[side === 'a' ? 'srcA' : 'srcB'], sc = m[side === 'a' ? 'sa' : 'sb'], won = m.winner && m.winner === id;
  return `<span class="mline ${won ? 'won' : ''} ${m.winner && !won && id ? 'lost' : ''}">${id ? crest(id, 'sm') : '<span class="crest sm tbd">?</span>'}<span class="mname">${id ? esc(teamById(id).name) : esc(srcLabel(T, src))}</span><b class="num">${sc != null ? sc : ''}</b></span>`;
}
const mCard = (T, m) => `<button class="mcard ${m.round === 'Final' ? 'final' : ''}" data-act="tourMatch" data-id="${m.id}" ${m.a && m.b && !m.bye ? '' : 'disabled'}><span class="mlab">${esc(m.label)}${m.tb ? ` · won on ${esc(scoreOf(T.sport)[2])}` : ''}</span>${teamLine(T, m, 'a')}${teamLine(T, m, 'b')}<small class="faint">${matchMeta(m)}</small></button>`;
function renderTour() {
  const T = curTour(); if (!T) { TOUR = null; renderCorp(); return; }
  const s = sp(T.sport), st = tourStatus(T), pr = tourProgress(T), preview = PREV && PREV.id === T.id, nr = nextRound(T);
  let body = '';
  if (tourTab === 'bracket') {
    const ko = T.matches.filter((m) => m.stage === 'ko' && m.round !== 'Third place'), rounds = [...new Set(ko.sort((a, b) => a.rk - b.rk).map((m) => m.round))], third = T.matches.find((m) => m.round === 'Third place');
    body = `${T.champion ? `<div class="champ" style="--c:${teamById(T.champion).c}">${ic('crown')}<div><span class="eyebrow">Champion</span><h2>${esc(teamById(T.champion).name)}</h2></div></div>` : ''}
      <div class="bracket">${rounds.map((r) => `<div class="bcol"><b class="bhead">${esc(r)}</b>${ko.filter((m) => m.round === r).map((m) => mCard(T, m)).join('')}</div>`).join('')}</div>
      ${third ? `<div class="section"><h2>Third place</h2>${mCard(T, third)}</div>` : ''}`;
  } else if (tourTab === 'schedule') {
    const ms = T.matches.filter((m) => !m.bye).sort((a, b) => a.d - b.d || toMin(a.t) - toMin(b.t)), days = [...new Set(ms.map((m) => m.d))];
    body = days.map((d) => `<div class="section"><h2>${dayLabel(d)} <span class="faint" style="font:600 13px var(--f-body)">${longFmt.format(dateAt(d, '12:00'))}</span></h2><div class="mlist">${ms.filter((m) => m.d === d).map((m) => mCard(T, m)).join('')}</div></div>`).join('');
  } else {
    body = T.groups ? Object.keys(T.groups).map((g) => `<div class="section"><h2>Group ${g}</h2><div class="table card"><div class="tr th g"><span>#</span><span>Team</span><span>P</span><span>W</span><span>D</span><span>Pts</span></div>
      ${groupTable(T, g).map((r, i) => `<div class="tr g ${i < (Object.keys(T.groups).length === 1 ? 4 : 2) ? 'q' : ''}"><span class="num">${i + 1}</span><span class="tname">${crest(r.id, 'sm')}${esc(teamById(r.id).name)}</span><span class="num">${r.p}</span><span class="num">${r.w}</span><span class="num">${r.d}</span><b class="num">${r.pts}</b></div>`).join('')}</div></div>`).join('') + '<div class="faint" style="font-size:12.5px;margin-top:8px">Highlighted teams go through to the semifinals.</div>'
      : `<div class="empty section">${ic('list')}<b>Straight knockout</b><span class="muted">This tournament has no group stage.</span></div>`;
  }
  $('#scr-team').innerHTML = `<div class="head"><button class="round" data-act="tourBack" aria-label="Back to tournaments">${ic('arrow-left')}</button><div style="flex:1;min-width:0"><h1 style="font-size:22px">${esc(T.name)}</h1><div class="sub">${s.name} · ${T.seeds.length} teams · ${T.format === 'groups' ? 'Groups + knockout' : 'Knockout'}</div></div></div>
    ${preview ? `<div class="okbox">${ic('sparkles')}<div><b>Preview</b><br>${pr.total} matches, ${dayLabel(T.startDay)} to ${dayLabel(T.endDay)} ${dateAt(T.endDay, '12:00').getDate()}. Publish to send the schedule to every captain.</div></div>
      <div style="display:flex;gap:8px;margin-top:10px">${T.seeding === 'random' ? `<button class="pill sm soft" data-act="tdRedraw">${ic('shuffle')}Redraw</button>` : ''}<button class="pill sm soft" data-act="tdEdit">${ic('pencil')}Edit</button><button class="pill sm" style="flex:1" data-act="tdPublish">${ic('send')}Publish</button></div>`
      : `<div class="tstatus"><span>${st.done ? ic('crown') : ic('timer')}<b>${esc(st.text)}</b></span><span class="faint num">${pr.played}/${pr.total} played</span></div><span class="prog"><i style="width:${Math.round((pr.played / pr.total) * 100)}%"></i></span>
      ${nr.length ? `<button class="pill sm soft" style="margin-top:10px" data-act="tourSim">${ic('zap')}Simulate ${esc(nr[0].stage === 'group' ? 'next matchday' : nr[0].round.toLowerCase())}</button>` : ''}`}
    <div class="seg" role="group" aria-label="Tournament view" style="margin-top:16px"><button data-act="tourTab" data-id="bracket" aria-pressed="${tourTab === 'bracket'}">Bracket</button><button data-act="tourTab" data-id="schedule" aria-pressed="${tourTab === 'schedule'}">Schedule</button><button data-act="tourTab" data-id="groups" aria-pressed="${tourTab === 'groups'}">Groups</button></div>
    ${body}`;
}
let RS = null;
function resultSheet(T, m) {
  const [unit, , tbName] = scoreOf(T.sport), A1 = teamById(m.a), B1 = teamById(m.b), level = RS.sa === RS.sb;
  sheetUpdate(`${head(`${esc(m.label)} · enter result`, matchMeta(m))}
    ${[['sa', A1], ['sb', B1]].map(([k, t]) => `<div class="card scorerow"><span class="crest lg" style="--c:${t.c}">${t.ab}</span><b style="flex:1">${esc(t.name)}</b><div class="stepper"><button data-act="rsN" data-k="${k}" data-d="-1" aria-label="Less">${ic('minus')}</button><b class="num">${RS[k]}</b><button data-act="rsN" data-k="${k}" data-d="1" aria-label="More">${ic('plus')}</button></div></div>`).join('')}
    <div class="faint" style="font-size:13px">Score in ${unit}.</div>
    ${level && m.stage === 'ko' ? `<div class="fgrp"><b>Level. Who won the ${esc(tbName)}?</b><div class="seg" role="group" aria-label="Tie-break winner"><button data-act="rsTb" data-id="${m.a}" aria-pressed="${RS.tb === m.a}">${esc(A1.name.split(' ')[0])}</button><button data-act="rsTb" data-id="${m.b}" aria-pressed="${RS.tb === m.b}">${esc(B1.name.split(' ')[0])}</button></div></div>` : ''}
    <button class="pill block" data-act="rsSave" ${level && m.stage === 'ko' && !RS.tb ? 'disabled' : ''}>${ic('check')}Save result</button>`);
}
function afterResult(T, m) {
  if (T.champion) { confetti(teamById(T.champion).c); toast(`${teamById(T.champion).name} are champions!`, 'crown'); return; }
  const nxt = T.matches.find((x) => x.stage === 'ko' && ((x.srcA && x.srcA.ref === m.id) || (x.srcB && x.srcB.ref === m.id)));
  if (m.winner && nxt) toast(`${teamById(m.winner).name} go through to the ${nxt.round === 'Final' ? 'final' : nxt.round.toLowerCase()}`, 'trophy');
  else toast('Result saved. Tables updated', 'check');
}

Object.assign(A, {
  corpView: (el) => { S.corpView = el.dataset.id; TOUR = null; save(); renderCorp(); },
  addFixture: () => { FX = { a: null, b: null, sport: 'cricket', d: 1, t: '18:30', venue: VENUES_ENT[0], clash: '' }; fixtureSheet(); },
  fxTeam: (el) => { FX[el.dataset.k] = el.dataset.id; fixtureSheet(); },
  fxSport: (el) => { FX.sport = el.dataset.id; fixtureSheet(); },
  fxDay: (el) => { FX.d = +el.dataset.id; fixtureSheet(); },
  fxTime: (el) => { FX.t = el.dataset.id; fixtureSheet(); },
  fxVenue: (el) => { FX.venue = el.dataset.id; fixtureSheet(); },
  fxSave: () => { const c = S.fixtures.find((f) => f.d === FX.d && f.t === FX.t && (f.venue === FX.venue || [f.a, f.b].some((x) => x === FX.a || x === FX.b)));
    if (c && !FX.clash) { FX.clash = `${teamById(c.a).name.split(' ')[0]} v ${teamById(c.b).name.split(' ')[0]} is already at that time${c.venue === FX.venue ? ' and venue' : ''}. Save again to add it anyway.`; fixtureSheet(); return; }
    S.fixtures.push({ id: 'x' + Date.now(), a: FX.a, b: FX.b, sport: FX.sport, d: FX.d, t: FX.t, venue: FX.venue }); FX = null; save(); closeSheet(); renderCorp(); toast('Fixture added. Both captains were notified', 'calendar-days'); },
  nudgeDepts: () => toast(`Reminder sent to ${ORG.participation.filter(([, p]) => p < 50).map(([d]) => d).join(', ')}`, 'send'),
  deptTeam: (el) => { const t = teamById(el.dataset.id); sheet(`${head(esc(t.name), `${t.dept} · ${t.players} players`)}<div class="facts"><div class="fact"><b class="num">${t.w}-${t.d}-${t.l}</b><span>Won, drawn, lost</span></div><div class="fact"><b class="num">${t.w * 3 + t.d}</b><span>League points</span></div></div><div class="lrows">${['Captain', 'Vice-captain', 'Player', 'Player'].map((r, i) => rowHTML({ lead: avatar(PLAYERS[(i * 3 + t.id.charCodeAt(1)) % PLAYERS.length].name), title: esc(PLAYERS[(i * 3 + t.id.charCodeAt(1)) % PLAYERS.length].name), sub: r })).join('')}</div><button class="pill block" data-act="close">Done</button>`); },
  tourNew: () => { TD = TD || freshTD(); genSheet(); },
  tdSet: (el) => { const k = el.dataset.k, v = el.dataset.id; TD[k] = ['startDay', 'mins'].includes(k) ? +v : v; genSheet(); },
  tdTeam: (el) => { const id = el.dataset.id; TD.teams = TD.teams.includes(id) ? TD.teams.filter((x) => x !== id) : TD.teams.concat(id); genSheet(); },
  tdVenue: (el) => { const v = el.dataset.id; TD.venues = TD.venues.includes(v) ? TD.venues.filter((x) => x !== v) : TD.venues.concat(v); genSheet(); },
  tdPer: (el) => { TD.perDay = Math.max(1, Math.min(6, TD.perDay + +el.dataset.d)); genSheet(); },
  tdThird: () => { TD.thirdPlace = !TD.thirdPlace; genSheet(); },
  tdGen: () => { PREV = buildTournament(Object.assign({}, TD)); TOUR = PREV.id; tourTab = 'bracket'; closeSheet(); S.corpView = 'cups'; renderCorp(); $('#scr-team').scrollTop = 0; },
  tdRedraw: () => { PREV = buildTournament(Object.assign({}, TD)); TOUR = PREV.id; renderTour(); toast('New draw', 'shuffle'); },
  tdEdit: () => { PREV = null; TOUR = null; renderCorp(); genSheet(); },
  tdPublish: () => { tours().unshift(PREV); const T = PREV; PREV = null; TD = null; save(); renderTour(); confetti(sp(T.sport).c); toast(`Published. Schedule sent to ${T.seeds.length} captains`, 'send'); },
  tourOpen: (el) => { TOUR = el.dataset.id; tourTab = 'bracket'; PREV = null; renderTour(); $('#scr-team').scrollTop = 0; },
  tourBack: () => { TOUR = null; PREV = null; renderCorp(); },
  tourTab: (el) => { tourTab = el.dataset.id; renderTour(); },
  tourSim: () => { const T = curTour(), r = rng(Date.now() % 100000); nextRound(T).forEach((m) => simulateMatch(T, m, r)); save(); renderTour(); if (T.champion) { confetti(teamById(T.champion).c); toast(`${teamById(T.champion).name} are champions!`, 'crown'); } else toast('Results in. Winners moved on', 'zap'); },
  tourMatch: (el) => { const T = curTour(), m = T.matches.find((x) => x.id === el.dataset.id); const hi = scoreOf(T.sport)[1][1], big = hi > 10; RS = { id: m.id, sa: m.sa != null ? m.sa : big ? Math.round(hi * 0.8 / 5) * 5 : 0, sb: m.sb != null ? m.sb : big ? Math.round(hi * 0.7 / 5) * 5 : 0, tb: m.tb }; resultSheet(T, m); },
  rsN: (el) => { const T = curTour(), m = T.matches.find((x) => x.id === RS.id), step = scoreOf(T.sport)[1][1] > 50 ? 5 : 1; RS[el.dataset.k] = Math.max(0, RS[el.dataset.k] + +el.dataset.d * step); if (RS.sa !== RS.sb) RS.tb = null; resultSheet(T, m); },
  rsTb: (el) => { const T = curTour(), m = T.matches.find((x) => x.id === RS.id); RS.tb = el.dataset.id; resultSheet(T, m); },
  rsSave: () => { const T = curTour(), m = T.matches.find((x) => x.id === RS.id); playMatch(T, m, RS.sa, RS.sb, RS.tb); RS = null; if (!PREV || PREV.id !== T.id) save(); closeSheet(); renderTour(); afterResult(T, m); },
});
