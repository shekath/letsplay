/* ═════ CORPORATE: a company sports workspace with two roles ═════
   Admin (HR or the sports committee): employee directory with Excel/CSV import, teams (auto-built, created
   or registered by employees with approval), league and tournaments, announcements and participation reports.
   Employee: the company hub — announcements, my team and next match with RSVP, tournaments, table, team registration.
   Tournament generation, scheduling and progression come from the shared tour-engine.js. */
Object.assign(ICONS, {
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  'file-spreadsheet': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 13h2"/><path d="M14 13h2"/><path d="M8 17h2"/><path d="M14 17h2"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  'user-check': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>',
  hash: '<line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/>',
});
/* What the Corporate plan offers in this design. */
PLANS.corporate.feats = ['Everything in Pro', 'Employee directory: import from Excel or CSV, or a company invite link', 'Admin and employee views', 'Teams: auto-build by department, create, or let employees register with approval',
  'Company league and tournament organizer with brackets and schedules', 'Announcements by app, email, Slack or Microsoft Teams', 'Participation dashboard and exportable reports', 'Bulk team-kit orders'];
const DOMAIN = 'halcyon.in';

/* ── Workspace data (seeded once, then saved) ── */
const FN = ['Aarav', 'Ishita', 'Kabir', 'Meera', 'Rohan', 'Priya', 'Vivek', 'Sneha', 'Arnav', 'Diya', 'Karan', 'Ananya', 'Nikhil', 'Pooja', 'Rahul', 'Tara', 'Siddharth', 'Neha', 'Aditya', 'Kavya', 'Manish', 'Riya', 'Varun', 'Shreya', 'Yash', 'Isha', 'Harsh', 'Dev', 'Aisha', 'Omkar', 'Lavanya', 'Farhan', 'Gauri', 'Ritvik'];
const LN = ['Sharma', 'Iyer', 'Reddy', 'Nair', 'Gupta', 'Menon', 'Rao', 'Patel', 'Kulkarni', 'Das', 'Bose', 'Chopra', 'Joshi', 'Pillai', 'Singh', 'Kapoor', 'Shetty', 'Mishra', 'Banerjee', 'Verma', 'Khan', 'Fernandes'];
const mailOf = (name) => name.toLowerCase().replace(/[^a-z ]/g, '').trim().replace(/\s+/g, '.') + '@' + DOMAIN;
function seedWorkspace() {
  const r = rng(42), used = new Set(['Arjun Mehta']), emps = [];
  const nm = () => { for (;;) { const n = FN[Math.floor(r() * FN.length)] + ' ' + LN[Math.floor(r() * LN.length)]; if (!used.has(n)) { used.add(n); return n; } } };
  const sports = () => { const a = TOUR_SPORTS[Math.floor(r() * TOUR_SPORTS.length)], b = TOUR_SPORTS[Math.floor(r() * TOUR_SPORTS.length)]; return a === b ? [a] : [a, b]; };
  /* How often each department plays follows the league's participation figures, so some fall below 50%. */
  const rate = Object.fromEntries(ORG.participation.map(([d, p]) => [d, p / 100]));
  const add = (o) => { const e = Object.assign({ id: 'e' + (emps.length + 1), sports: sports(), teams: [], status: 'active' }, o); if (e.games == null) e.games = e.status === 'active' && r() < (rate[e.dept] || 0.5) ? 1 + Math.floor(r() * 7) : 0; e.email = e.email || mailOf(e.name); emps.push(e); return e; };
  add({ name: 'Arjun Mehta', dept: 'Engineering', teams: ['e1'], you: true, games: 6 });
  const caps = {};
  ORG.teams.forEach((t) => { for (let i = 0; i < t.players - (t.id === 'e1' ? 1 : 0); i++) { const e = add({ name: nm(), dept: t.dept, teams: [t.id] }); if (i === 0 && t.id !== 'e1') caps[t.id] = e.id; } });
  caps.e1 = 'e1';
  const depts = ORG.teams.map((t) => t.dept);
  for (let i = 0; i < 26; i++) add({ name: nm(), dept: depts[Math.floor(r() * depts.length)], status: i < 16 ? 'active' : 'invited' });
  /* One team waiting for approval: registered by an employee. */
  const free = emps.filter((e) => !e.teams.length && e.status === 'active').slice(0, 7);
  free[0].name = 'Nisha Verma'; free[0].email = mailOf('Nisha Verma'); free[0].dept = 'Sales';
  free.forEach((e) => e.teams.push('ct1'));
  return { emps, caps, cteams: [{ id: 'ct1', name: 'Night Owls FC', dept: 'Mixed', sport: 'football', c: '#0C8073', ab: 'NO', status: 'pending', by: free[0].id, when: 'Yesterday', w: 0, d: 0, l: 0, form: '' }],
    reg: { open: true, deadline: 5, sports: ['football', 'cricket', 'badminton'], min: 5, max: 12, approve: true },
    ann: [{ id: 'an1', title: 'Monsoon Cricket Cup: semifinals today', body: 'Semifinals start at 6:30 pm at Oval Cricket Ground and Riverfront Maidan. Come and cheer your department. Snacks on the house.', aud: 'all', ch: ['app', 'email'], when: 'Today, 9:10 am', reach: 0, read: 64 }],
    integr: { slack: false, msteams: false }, rsvp: {} };
}
function W() { if (!S.ws) { S.ws = seedWorkspace(); save(); } return S.ws; }
const emps = () => W().emps;
const empById = (id) => emps().find((e) => e.id === id);
const you = () => emps().find((e) => e.you);
const allCTeams = () => ORG.teams.concat(W().cteams);
const approvedTeams = () => allCTeams().filter((t) => !t.status || t.status === 'approved');
const teamById = (id) => allCTeams().find((t) => t.id === id);
const members = (tid) => emps().filter((e) => e.teams.includes(tid));
const captainOf = (tid) => empById(W().caps[tid]);
const depts = () => [...new Set(emps().map((e) => e.dept))];
function standings() { return approvedTeams().map((t) => ({ ...t, p: t.w + t.d + t.l, pts: t.w * 3 + t.d })).sort((a, b) => b.pts - a.pts || b.w - a.w); }
const crest = (id, cls = '') => { const t = teamById(id); return t ? `<span class="crest ${cls}" style="--c:${t.c}">${t.ab}</span>` : `<span class="crest ${cls} tbd">?</span>`; };
const matchMeta = (m) => (m.bye ? 'Advances on a bye' : `${dayLabel(m.d)} ${dateAt(m.d, '12:00').getDate()} · ${fmtT(m.d, m.t)} · ${esc((m.venue || '').split(' · ')[0])}`);
const myTeamIds = () => you().teams;
/* Company notifications land in the bell for employees, as they would on their phones. */
function companyNote(icon, title, body, pri = 'info') { notes().unshift({ id: 'n' + Date.now() + Math.floor(Math.random() * 999), pri, cat: 'company', icon, when: 'Just now', title, body, actions: [['Open company page', 'company']], read: false, done: false }); refreshBells(); }
/* Save a generated file. Inside claude.ai the viewer confirms through the downloads capability;
   as a standalone app it's an ordinary browser download. Resolves 'saved', 'declined' or 'unavailable'. */
async function download(name, text) {
  if (window.claude && window.claude.use) {
    const dl = await window.claude.use('downloads');
    if (!dl) return 'unavailable';
    try { await dl.save({ filename: name, data: text }); return 'saved'; } catch (e) { return e && e.code === 'declined' ? 'declined' : 'unavailable'; }
  }
  try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); return 'saved'; } catch (e) { return 'unavailable'; }
}
const savedToast = (r, what) => toast(r === 'saved' ? `${what} saved` : r === 'declined' ? 'Download cancelled' : 'Downloads aren’t available in this view', r === 'saved' ? 'download' : 'info');
const csvCell = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));

/* ═════ Layout ═════ */
let TOUR = null, tourTab = 'bracket', PREV = null;
function renderCorp() {
  if (TOUR) { renderTour(); return; }
  const admin = S.corpRole !== 'employee', el = $('#scr-team');
  if (!['home', 'people', 'teams', 'events'].includes(S.corpView)) S.corpView = 'home';
  const v = S.corpView;
  const top = `<div class="head"><div><h1>Company</h1><div class="sub">${esc(ORG.name)} · Corporate</div></div>${bellHTML()}</div>
    <div class="rolebar"><span class="faint">Viewing as</span><div class="seg sm" role="group" aria-label="Role"><button data-act="corpRole" data-id="admin" aria-pressed="${admin}">${ic('shield-check')}Admin</button><button data-act="corpRole" data-id="employee" aria-pressed="${!admin}">${ic('user')}Employee</button></div></div>`;
  if (!admin) { el.innerHTML = top + employeeHub(); return; }
  const pend = W().cteams.filter((t) => t.status === 'pending').length;
  el.innerHTML = `${top}
    <div class="seg" role="group" aria-label="Admin section"><button data-act="corpView" data-id="home" aria-pressed="${v === 'home'}">Home</button><button data-act="corpView" data-id="people" aria-pressed="${v === 'people'}">People</button><button data-act="corpView" data-id="teams" aria-pressed="${v === 'teams'}">Teams${pend ? ` <i class="dotlive"></i>` : ''}</button><button data-act="corpView" data-id="events" aria-pressed="${v === 'events'}">Events</button></div>
    <div style="margin-top:16px">${({ home: adminHome, people: adminPeople, teams: adminTeams, events: adminEvents })[v]()}</div>`;
  if (v === 'people') bindPeopleSearch();
}

/* ── Admin: Home ── */
function adminHome() {
  const E = emps(), act = E.filter((e) => e.status === 'active'), played = act.filter((e) => e.games > 0).length, ws = W();
  const pend = ws.cteams.filter((t) => t.status === 'pending');
  const steps = [['Add employees', E.length > 1, 'corpView', 'people'], ['Form teams', approvedTeams().length >= 4, 'corpView', 'teams'], ['Run a league or tournament', tours().length > 0, 'corpView', 'events'], ['Connect Slack or Microsoft Teams', ws.integr.slack || ws.integr.msteams, 'integrations', '']];
  const doneN = steps.filter((s) => s[1]).length;
  const fx = S.fixtures.slice().sort((a, b) => a.d - b.d || toMin(a.t) - toMin(b.t)).slice(0, 3);
  const dp = depts().map((d) => { const de = act.filter((e) => e.dept === d); return [d, de.length ? Math.round((de.filter((e) => e.games > 0).length / de.length) * 100) : 0, de.length]; }).sort((a, b) => b[1] - a[1]);
  return `<div class="org-hero"><span class="eyebrow">${esc(ORG.name)} · ${esc(DOMAIN)}</span><h2>Company sports</h2>
      <div class="ostats"><div><b class="num">${act.length}</b><small>Active</small></div><div><b class="num">${Math.round((played / act.length) * 100)}%</b><small>Played this month</small></div><div><b class="num">${E.reduce((n, e) => n + e.games, 0)}</b><small>Games played</small></div></div>
      <div class="seatbar"><div><span>Seats</span><b class="num">${E.length} of ${S.seats}</b></div><span class="prog"><i style="width:${Math.min(100, Math.round((E.length / S.seats) * 100))}%;${E.length > S.seats ? 'background:#F2B33D' : ''}"></i></span>${E.length > S.seats ? `<button class="linkbtn light" data-act="subscribe" data-id="corporate" data-period="${S.billing}">Add seats</button>` : ''}</div></div>
    ${doneN < steps.length ? `<div class="section"><h2>Set up <span class="faint num" style="font:700 13px var(--f-body)">${doneN} of ${steps.length} done</span></h2><div class="lrows">${steps.map(([t, ok, act2, id], i) => rowHTML({ act: ok ? null : act2, id, lead: `<span class="stepno ${ok ? 'ok' : ''}">${ok ? ic('check') : i + 1}</span>`, title: t, sub: ok ? 'Done' : 'Not yet', end: ok ? '' : null })).join('')}</div></div>` : ''}
    ${pend.length ? `<div class="section"><h2>Needs your approval</h2>${pend.map(approvalCard).join('')}</div>` : ''}
    <div class="section"><div class="shead"><h2>Announcements</h2><button class="pill sm" data-act="annNew">${ic('megaphone')}New</button></div>
      <div class="lrows">${ws.ann.slice(0, 3).map((a) => rowHTML({ icon: 'megaphone', c: 'var(--corp)', title: esc(a.title), sub: `${esc(audLabel(a.aud))} · ${a.ch.map((c) => CH[c][0]).join(', ')} · ${esc(a.when)} · ${a.read}% read` })).join('')}</div></div>
    <div class="section"><div class="shead"><h2>This week</h2><button class="pill sm soft" data-act="corpView" data-id="events">All events</button></div>
      <div class="lrows">${fx.map(fixtureRow).join('')}</div></div>
    <div class="section"><div class="shead"><h2>Participation</h2><button class="pill sm soft" data-act="exportReport">${ic('download')}Report</button></div>
      <div class="card bars">${dp.map(([d, p, n]) => `<div class="bar"><span>${esc(d)}</span><span class="track"><i style="width:${p}%;${p < 50 ? 'background:var(--live)' : ''}"></i></span><b class="num">${p}%</b></div>`).join('')}</div>
      <div class="faint" style="font-size:12.5px">Share of active people in each department who played this month.</div>
      ${dp.some((x) => x[1] < 50) ? `<button class="pill block soft" data-act="annNew" data-id="low">${ic('send')}Encourage departments below 50%</button>` : ''}</div>
    <div class="section">${rowHTML({ act: 'integrations', icon: 'hash', title: 'Integrations', sub: `${ws.integr.slack ? 'Slack connected' : 'Slack'} · ${ws.integr.msteams ? 'Teams connected' : 'Microsoft Teams'} · single sign-on and HR sync coming soon` })}</div>`;
}
function approvalCard(t) {
  const m = members(t.id), by = empById(t.by);
  return `<div class="card appr"><div style="display:flex;gap:12px;align-items:center">${crest(t.id, 'lg')}<div style="flex:1;min-width:0"><b>${esc(t.name)}</b><div class="faint" style="font-size:13px">${sp(t.sport).name} · ${m.length} players · ${esc(t.dept)}</div><div class="faint" style="font-size:12.5px">Registered by ${esc(by ? by.name : 'an employee')} · ${esc(t.when)}</div></div></div>
    <div class="avrow">${m.slice(0, 8).map((e) => avatar(e.name)).join('')}</div>
    ${m.length < W().reg.min ? `<div class="errbox">${ic('info')}<div>Below the minimum of ${W().reg.min} players.</div></div>` : ''}
    <div style="display:flex;gap:8px"><button class="pill sm soft" style="flex:1" data-act="teamDecline" data-id="${t.id}">Decline</button><button class="pill sm" style="flex:1" data-act="teamApprove" data-id="${t.id}">${ic('check')}Approve</button></div></div>`;
}
const fixtureRow = (f) => { const a = teamById(f.a), b = teamById(f.b), s = sp(f.sport); return `<div class="lrow fx"><span class="evtime num"><b>${dayLabel(f.d)}</b><small>${fmtT(f.d, f.t)}</small></span><span class="ltext"><b>${crest(f.a, 'sm')}${esc(a.name.split(' ')[0])} <span class="faint">v</span> ${crest(f.b, 'sm')}${esc(b.name.split(' ')[0])}</b><small><span class="evtag" style="--c:${s.c}">${s.name}</span>${esc(f.venue.split(' · ')[0])}</small></span></div>`; };

/* ── Admin: People ── */
let PF = { q: '', dept: 'all', st: 'all' };
function peopleList() {
  const q = PF.q.trim().toLowerCase();
  return emps().filter((e) => (PF.dept === 'all' || e.dept === PF.dept) && (PF.st === 'all' || (PF.st === 'noteam' ? !e.teams.length && e.status === 'active' : e.status === PF.st)) && (!q || (e.name + ' ' + e.email).toLowerCase().includes(q)));
}
function adminPeople() {
  const E = emps(), list = peopleList(), inv = E.filter((e) => e.status === 'invited').length, noT = E.filter((e) => !e.teams.length && e.status === 'active').length;
  return `<div class="two"><button class="pill" data-act="importOpen">${ic('file-spreadsheet')}Import sheet</button><button class="pill soft" data-act="inviteLink">${ic('link')}Invite link</button></div>
    <div class="faint" style="font-size:12.5px;margin-top:8px">Upload an Excel or CSV file from HR, or share a link only ${esc('@' + DOMAIN)} emails can use.</div>
    <div class="section"><label class="search">${ic('search')}<input id="pplQ" type="search" placeholder="Search name or email" value="${esc(PF.q)}" aria-label="Search people"></label>
      <div class="seg" role="group" aria-label="Status"><button data-act="pplSt" data-id="all" aria-pressed="${PF.st === 'all'}">All ${E.length}</button><button data-act="pplSt" data-id="invited" aria-pressed="${PF.st === 'invited'}">Invited ${inv}</button><button data-act="pplSt" data-id="noteam" aria-pressed="${PF.st === 'noteam'}">No team ${noT}</button></div>
      <div class="chips"><button class="chip neutral" data-act="pplDept" data-id="all" aria-pressed="${PF.dept === 'all'}">All departments</button>${depts().map((d) => `<button class="chip neutral" data-act="pplDept" data-id="${esc(d)}" aria-pressed="${PF.dept === d}">${esc(d)}</button>`).join('')}</div>
      <div class="faint num" style="font-size:12.5px">${list.length} ${list.length === 1 ? 'person' : 'people'}</div>
      ${list.length ? `<div class="lrows">${list.slice(0, 60).map((e) => rowHTML({ act: 'empOpen', id: e.id, lead: avatar(e.name), title: esc(e.name) + (e.you ? ' <span class="okchip">You · admin</span>' : ''), sub: `${esc(e.dept)} · ${e.teams.length ? e.teams.map((t) => esc(teamById(t).name)).join(', ') : 'No team'}`, end: e.status === 'invited' ? '<span class="stchip st-invited">Invited</span>' : `<span class="faint num" style="font-size:12px">${e.games} games</span>` })).join('')}</div>${list.length > 60 ? `<div class="faint" style="font-size:12.5px">Showing 60. Search to find others.</div>` : ''}`
        : `<div class="empty">${ic('search')}<b>No one matches</b></div>`}</div>`;
}
function bindPeopleSearch() { const qi = $('#pplQ'); if (!qi) return; qi.addEventListener('input', () => { PF.q = qi.value; const pos = qi.selectionStart; renderCorp(); const n = $('#pplQ'); n.focus(); n.setSelectionRange(pos, pos); }); }
function empSheet(id) {
  const e = empById(id), teams = approvedTeams();
  sheet(`${head(esc(e.name), `${esc(e.email)} · ${esc(e.dept)}`)}
    <div class="facts"><div class="fact"><b>${e.status === 'invited' ? 'Invited' : 'Active'}</b><span>${e.status === 'invited' ? 'Hasn’t joined yet' : 'On LetsPlay'}</span></div><div class="fact"><b class="num">${e.games}</b><span>Games this month</span></div></div>
    <div class="fgrp"><b>Teams</b><div class="chips wrap">${teams.map((t) => `<button class="chip" style="--c:${t.c}" data-act="empTeam" data-id="${e.id}" data-t="${t.id}" aria-pressed="${e.teams.includes(t.id)}">${esc(t.name)}</button>`).join('')}</div></div>
    ${e.teams.map((t) => W().caps[t] === e.id ? `<div class="okchip" style="justify-self:start">${ic('crown')}Captain of ${esc(teamById(t).name)}</div>` : `<button class="pill sm soft" style="justify-self:start" data-act="makeCap" data-id="${e.id}" data-t="${t}">${ic('crown')}Make captain of ${esc(teamById(t).name)}</button>`).join('')}
    ${e.status === 'invited' ? `<button class="pill block" data-act="resend" data-id="${e.id}">${ic('mail')}Resend invite</button>` : ''}
    ${e.you ? '' : `<button class="pill block soft" data-act="empRemove" data-id="${e.id}">Remove from workspace</button>`}`);
}

/* Import employees from Excel or CSV: template, upload, check every row, then import and invite. */
const TEMPLATE = 'Full name,Work email,Department,Sports,Team (optional)\nAnita Desai,anita.desai@' + DOMAIN + ',Finance,Cricket; Badminton,Finance Falcons\nMohit Rana,mohit.rana@' + DOMAIN + ',Engineering,Football,\n';
const SAMPLE_SHEET = 'Full name,Work email,Department,Sports,Team (optional)\n'
  + ['Anita Desai,anita.desai@D,Finance,Cricket; Badminton,Finance Falcons', 'Mohit Rana,mohit.rana@D,Engineering,Football,', 'Sana Qureshi,sana.qureshi@D,Product,Badminton,', 'Joel Mathew,joel.mathew@D,Product,Football; Basketball,',
    'Pallavi Hegde,pallavi.hegde@D,Product,Volleyball,', 'Tenzin Norbu,tenzin.norbu@D,Product,Football,', 'Rekha Saini,rekha.saini@D,Sales,Kabaddi,Sales Sharks', 'Ved Prakash,,Operations,Cricket,',
    'Gaurav Jain,gaurav.jain@gmail.com,Marketing,Football,', 'Mohit Rana,mohit.rana@D,Engineering,Football,', 'Leela Thomas,leela.thomas@D,Design,Badminton,', 'Imtiaz Ali,imtiaz.ali@D,Product,Cricket,'].join('\n').replace(/@D/g, '@' + DOMAIN);
function parseCSV(text) {
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) { const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
    else if (ch === '"') q = true; else if (ch === ',') { row.push(cur); cur = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; } else cur += ch; }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}
let IMP = null;
function checkRows(rows) {
  const head = rows[0].map((h) => h.toLowerCase()), col = (re) => head.findIndex((h) => re.test(h));
  const ci = { name: col(/name/), email: col(/mail/), dept: col(/dep/), sports: col(/sport/), team: col(/team/) };
  if (ci.name < 0 || ci.email < 0) return { error: 'The first row needs column headings, including Full name and Work email. Download the template to see the layout.' };
  const known = new Set(emps().map((e) => e.email)), seen = new Set(), sportByName = Object.fromEntries(Object.entries(SPORTS).map(([k, s]) => [s.name.toLowerCase(), k]));
  return { rows: rows.slice(1).map((r, i) => {
    const g = (k) => (ci[k] >= 0 ? (r[ci[k]] || '').trim() : ''); const o = { line: i + 2, name: g('name'), email: g('email').toLowerCase(), dept: g('dept') || 'Unassigned', sports: g('sports').split(/[;|/]/).map((s) => sportByName[s.trim().toLowerCase()]).filter(Boolean), team: g('team'), issues: [], warn: [] };
    if (!o.name) o.issues.push('Name missing');
    if (!o.email) o.issues.push('Email missing'); else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(o.email)) o.issues.push('Email looks wrong'); else if (!o.email.endsWith('@' + DOMAIN)) o.issues.push(`Not a ${DOMAIN} email`);
    else if (known.has(o.email)) o.issues.push('Already in the workspace'); else if (seen.has(o.email)) o.issues.push('Duplicate row');
    seen.add(o.email);
    if (o.team && !allCTeams().some((t) => t.name.toLowerCase() === o.team.toLowerCase())) o.warn.push(`Team “${o.team}” not found, left without a team`);
    if (!depts().includes(o.dept)) o.warn.push(`New department: ${o.dept}`);
    return o; }) };
}
function importSheet() {
  const I = IMP;
  let body;
  if (!I.rows) {
    body = `<div class="steps-list"><div class="sl"><span class="stepno">1</span><div><b>Get the template</b><small>Columns: Full name, Work email, Department, Sports, Team (optional). Export from your HR system works too.</small><button class="pill sm soft" data-act="tplDownload">${ic('download')}Download template (CSV)</button></div></div>
      <div class="sl"><span class="stepno">2</span><div><b>Upload your sheet</b><small>Excel (.xlsx, .xls) or CSV. We check every row before anything is imported.</small>
      <label class="photo-drop file">${ic('upload')}<b>${I.loading ? 'Reading the file…' : 'Choose a file'}</b><small>${I.error ? esc(I.error) : 'Up to 5,000 rows'}</small><input type="file" id="impFile" accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" aria-label="Employee sheet"></label>
      <button class="linkbtn" data-act="impSample">No file handy? Try a sample sheet with 12 rows</button></div></div></div>`;
  } else {
    const ok = I.rows.filter((r) => !r.issues.length), bad = I.rows.filter((r) => r.issues.length), newDepts = [...new Set(ok.filter((r) => r.warn.some((w) => w.startsWith('New department'))).map((r) => r.dept))];
    body = `<div class="impsum"><div class="ok"><b class="num">${ok.length}</b><small>ready to import</small></div><div class="bad"><b class="num">${bad.length}</b><small>need fixing</small></div></div>
      ${emps().length + ok.length > S.seats ? `<div class="errbox">${ic('info')}<div>This takes you to ${emps().length + ok.length} people on ${S.seats} seats. You can import now and add seats later.</div></div>` : ''}
      <div class="imptable">${I.rows.map((r) => `<div class="ir ${r.issues.length ? 'bad' : ''}"><span class="num faint">${r.line}</span><div style="min-width:0"><b>${esc(r.name || '(no name)')}</b><small>${esc(r.email || '(no email)')} · ${esc(r.dept)}</small>${r.issues.map((x) => `<small class="iss">${ic('info')}${esc(x)}</small>`).join('')}${r.warn.map((x) => `<small class="wrn">${esc(x)}</small>`).join('')}</div>${r.issues.length ? '' : ic('check')}</div>`).join('')}</div>
      ${newDepts.length ? rowHTML({ act: 'impAuto', pressed: I.auto, icon: 'users', title: `Create teams for ${newDepts.length} new department${newDepts.length > 1 ? 's' : ''}`, sub: newDepts.join(', '), end: `<span class="tickbox">${ic('check')}</span>` }) : ''}
      ${rowHTML({ act: 'impInvite', pressed: I.invite, icon: 'mail', title: 'Email invites now', sub: 'Each person gets a link to join with their work email', end: `<span class="tickbox">${ic('check')}</span>` })}
      <div style="display:flex;gap:10px"><button class="pill soft" data-act="impReset">Start over</button><button class="pill" style="flex:1" data-act="impGo" ${ok.length ? '' : 'disabled'}>${ic('user-check')}Import ${ok.length}</button></div>
      ${bad.length ? `<div class="faint" style="font-size:12.5px">Rows that need fixing are skipped. Fix them in the sheet and upload again.</div>` : ''}`;
  }
  sheetUpdate(`${head('Import employees', I.file ? esc(I.file) : 'From Excel or CSV')}${body}`);
  const f = $('#impFile'); if (f) f.addEventListener('change', () => { if (f.files[0]) readSheet(f.files[0]); });
}
function loadXLSX() { return window.XLSX ? Promise.resolve(window.XLSX) : new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload = () => res(window.XLSX); s.onerror = rej; document.head.appendChild(s); }); }
async function readSheet(file) {
  IMP.loading = true; IMP.error = ''; IMP.file = file.name; importSheet();
  try {
    let rows;
    if (/\.xlsx?$/i.test(file.name)) { const X = await loadXLSX(); const wb = X.read(await file.arrayBuffer(), { type: 'array' }); rows = X.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' }).map((r) => r.map(String)).filter((r) => r.some((c) => c.trim())); }
    else rows = parseCSV(await file.text());
    if (rows.length < 2) throw new Error('The sheet has no rows under the headings.');
    const res = checkRows(rows); if (res.error) throw new Error(res.error);
    Object.assign(IMP, { loading: false, rows: res.rows });
  } catch (e) { Object.assign(IMP, { loading: false, rows: null, error: e.message && e.message.length < 140 ? e.message : 'That file couldn’t be read. Save it as .xlsx or .csv and try again.' }); }
  importSheet();
}

/* ── Admin: Teams ── */
let TF = 'all';
function adminTeams() {
  const ws = W(), list = allCTeams().filter((t) => TF === 'all' || (TF === 'pending' ? t.status === 'pending' : true)), pend = ws.cteams.filter((t) => t.status === 'pending').length;
  return `<div class="build">${[['autoBuild', 'users', 'Auto-build', 'One per department'], ['ctNew', 'plus', 'Create', 'Pick people'], ['regSettings', 'user-check', 'Registration', ws.reg.open ? `Open · ${ws.reg.min}–${ws.reg.max} players` : 'Closed']].map(([a, i, t, s]) => `<button class="bopt" data-act="${a}"><span class="ltile">${ic(i)}</span><b>${t}</b><small>${s}</small></button>`).join('')}</div>
    <div class="faint" style="font-size:12.5px;margin-top:8px">Three ways to build teams: from departments, picked by you, or registered by employees${ws.reg.approve ? ' and approved by you' : ''}.</div>
    <div class="section"><div class="seg" role="group" aria-label="Filter teams"><button data-act="tf" data-id="all" aria-pressed="${TF === 'all'}">All ${allCTeams().length}</button><button data-act="tf" data-id="pending" aria-pressed="${TF === 'pending'}">Waiting ${pend}</button></div>
      ${TF === 'pending' && !pend ? `<div class="empty">${ic('circle-check')}<b>Nothing waiting</b><span class="muted">New team registrations from employees appear here.</span></div>` : ''}
      ${TF === 'pending' ? ws.cteams.filter((t) => t.status === 'pending').map(approvalCard).join('') : `<div class="lrows">${list.map((t) => { const m = members(t.id), cap = captainOf(t.id); return rowHTML({ act: 'ctOpen', id: t.id, lead: crest(t.id), title: esc(t.name) + (t.status === 'pending' ? ' <span class="stchip st-invited">Waiting</span>' : ''), sub: `${esc(t.dept)}${t.sport ? ' · ' + sp(t.sport).name : ' · multi-sport'} · ${m.length} players${cap ? ' · captain ' + esc(cap.name.split(' ')[0]) : ''}` }); }).join('')}</div>`}</div>`;
}
function ctSheet(id) {
  const t = teamById(id), m = members(id), capId = W().caps[id];
  sheet(`${head(esc(t.name), `${esc(t.dept)}${t.sport ? ' · ' + sp(t.sport).name : ''} · ${m.length} players`)}
    ${t.status === 'pending' ? approvalCard(t) : ''}
    <div class="lrows">${m.map((e) => rowHTML({ lead: avatar(e.name), title: esc(e.name), sub: `${esc(e.dept)}${e.id === capId ? ' · captain' : ''}`, end: e.id === capId ? `<span class="okchip">${ic('crown')}C</span>` : `<button class="pill sm soft" data-act="ctRemove" data-id="${e.id}" data-t="${id}">Remove</button>` })).join('')}</div>
    <div class="two"><button class="pill soft" data-act="ctAdd" data-id="${id}">${ic('user-plus')}Add people</button><button class="pill" data-act="annNew" data-id="team:${id}">${ic('megaphone')}Message team</button></div>`);
}
let PK = null;   /* people picker for creating, registering or adding to a team */
function pickerSheet() {
  const q = PK.q.trim().toLowerCase(), list = emps().filter((e) => e.status === 'active' && !e.you && !(PK.tid && e.teams.includes(PK.tid)) && (PK.dept === 'all' || e.dept === PK.dept) && (!q || e.name.toLowerCase().includes(q))).sort((a, b) => a.teams.length - b.teams.length || a.name.localeCompare(b.name));
  const reg = PK.mode === 'register', R = W().reg;
  sheetUpdate(`${head(PK.mode === 'add' ? 'Add people' : reg ? 'Register a team' : 'Create a team', reg ? `Your company’s admin approves it. ${R.min}–${R.max} players.` : `${esc(ORG.name)} only`)}
    ${PK.mode !== 'add' ? `<label class="fld"><span>Team name</span><input id="pkName" value="${esc(PK.name)}" placeholder="For example Night Owls FC"></label>
      <div class="fgrp"><b>Sport</b><div class="chips">${(reg ? R.sports : TOUR_SPORTS).map((k) => `<button class="chip" style="--c:${sp(k).c}" data-act="pkSport" data-id="${k}" aria-pressed="${PK.sport === k}">${ic(sp(k).icon)}${sp(k).name}</button>`).join('')}</div></div>` : ''}
    <label class="search">${ic('search')}<input id="pkQ" type="search" placeholder="Search colleagues" value="${esc(PK.q)}" aria-label="Search colleagues"></label>
    <div class="chips"><button class="chip neutral" data-act="pkDept" data-id="all" aria-pressed="${PK.dept === 'all'}">Everyone</button>${depts().map((d) => `<button class="chip neutral" data-act="pkDept" data-id="${esc(d)}" aria-pressed="${PK.dept === d}">${esc(d)}</button>`).join('')}</div>
    <div class="lrows">${list.slice(0, 40).map((e) => `<button class="lrow" data-act="pkToggle" data-id="${e.id}" aria-pressed="${PK.sel.includes(e.id)}">${avatar(e.name)}<span class="ltext"><b>${esc(e.name)}</b><small>${esc(e.dept)} · ${e.teams.length ? e.teams.length + ' team' + (e.teams.length > 1 ? 's' : '') : 'free'} · ${e.sports.map((s) => sp(s).name).join(', ')}</small></span><span class="tickbox">${ic('check')}</span></button>`).join('')}</div>
    <div class="errbox" id="pkErr" hidden>${ic('info')}<div></div></div>
    <div class="stickybar"><span class="faint num">${PK.sel.length + (reg ? 1 : 0)} player${PK.sel.length + (reg ? 1 : 0) === 1 ? '' : 's'}${reg ? ' incl. you' : ''}</span><button class="pill" data-act="pkDone" ${PK.sel.length ? '' : 'disabled'}>${PK.mode === 'add' ? `Add ${PK.sel.length}` : reg ? 'Send for approval' : 'Create team'}</button></div>`);
  const qi = $('#pkQ'); qi.addEventListener('input', () => { PK.q = qi.value; const pos = qi.selectionStart; pickerSheet(); const n = $('#pkQ'); n.focus(); n.setSelectionRange(pos, pos); });
  const ni = $('#pkName'); if (ni) ni.addEventListener('input', () => { PK.name = ni.value; });
}
function regSettingsSheet() {
  const R = W().reg;
  sheetUpdate(`${head('Team registration', 'Let employees register their own teams')}
    ${rowHTML({ act: 'regToggle', pressed: R.open, icon: 'user-check', title: R.open ? 'Registration is open' : 'Registration is closed', sub: R.open ? `Closes ${dayLabel(R.deadline)} ${dateAt(R.deadline, '12:00').getDate()}` : 'Employees can’t register new teams', end: `<span class="tickbox">${ic('check')}</span>` })}
    <div class="fgrp"><b>Sports open for registration</b><div class="chips wrap">${TOUR_SPORTS.map((k) => `<button class="chip" style="--c:${sp(k).c}" data-act="regSport" data-id="${k}" aria-pressed="${R.sports.includes(k)}">${ic(sp(k).icon)}${sp(k).name}</button>`).join('')}</div></div>
    <div class="fgrp"><b>Closes on</b><div class="chips">${[2, 3, 5, 7, 10, 14].map((d) => `<button class="chip neutral" data-act="regDeadline" data-id="${d}" aria-pressed="${R.deadline === d}">${dayLabel(d)} ${dateAt(d, '12:00').getDate()}</button>`).join('')}</div></div>
    <div class="two"><div class="fgrp"><b>Minimum players</b><div class="stepper"><button data-act="regN" data-k="min" data-d="-1" aria-label="Lower minimum">${ic('minus')}</button><b class="num">${R.min}</b><button data-act="regN" data-k="min" data-d="1" aria-label="Raise minimum">${ic('plus')}</button></div></div>
      <div class="fgrp"><b>Maximum</b><div class="stepper"><button data-act="regN" data-k="max" data-d="-1" aria-label="Lower maximum">${ic('minus')}</button><b class="num">${R.max}</b><button data-act="regN" data-k="max" data-d="1" aria-label="Raise maximum">${ic('plus')}</button></div></div></div>
    ${rowHTML({ act: 'regApprove', pressed: R.approve, icon: 'shield-check', title: 'I approve each team', sub: 'Off: teams that meet the rules are approved automatically', end: `<span class="tickbox">${ic('check')}</span>` })}
    <button class="pill block" data-act="annNew" data-id="reg">${ic('megaphone')}Announce registration to everyone</button>`);
}

/* ── Announcements: audience, channels, message ── */
const CH = { app: ['App', 'bell'], email: ['Email', 'mail'], slack: ['Slack', 'hash'], msteams: ['Teams', 'message-circle'] };
const audLabel = (a) => (a === 'all' ? 'Everyone' : a === 'captains' ? 'Team captains' : a.startsWith('dept:') ? a.slice(5) : a.startsWith('team:') ? (teamById(a.slice(5)) || { name: 'A team' }).name : a.startsWith('low') ? 'Departments below 50%' : a);
const audCount = (a) => { const act = emps().filter((e) => e.status === 'active'); return a === 'all' ? act.length : a === 'captains' ? Object.keys(W().caps).length : a.startsWith('dept:') ? act.filter((e) => e.dept === a.slice(5)).length : a.startsWith('team:') ? members(a.slice(5)).length : a === 'low' ? act.filter((e) => lowDepts().includes(e.dept)).length : 0; };
const youIn = (a) => a === 'all' || (a === 'captains') || a === 'dept:' + you().dept || (a.startsWith('team:') && you().teams.includes(a.slice(5)));
const lowDepts = () => { const act = emps().filter((e) => e.status === 'active'); return depts().filter((d) => { const de = act.filter((e) => e.dept === d); return de.length && de.filter((e) => e.games > 0).length / de.length < 0.5; }); };
const tpl = (k) => { const R = W().reg; return ({ blank: ['', ''], reg: ['Team registration is open', `Register your team by ${dayLabel(R.deadline)} ${dateAt(R.deadline, '12:00').getDate()}: open LetsPlay → Company → Register a team. ${R.sports.map((s) => sp(s).name).join(', ')}, ${R.min}–${R.max} players.`],
  rain: ['Rain delay', 'Tonight’s matches start 45 minutes late because of rain. Check the app for updated times.'], low: ['Your department needs you', 'Only a few of your team have played this month. There are games every evening this week, beginners welcome. Open LetsPlay to join one.'] })[k]; };
let ANN = null;
function annSheet() {
  const A2 = ANN, ws = W(), n = audCount(A2.aud);
  const auds = [['all', 'Everyone'], ['captains', 'Captains']].concat(depts().map((d) => ['dept:' + d, d]));
  sheetUpdate(`${head('New announcement', 'Reaches people on their phones and work tools')}
    <div class="fgrp"><b>Send to</b><div class="chips wrap">${auds.map(([k, l]) => `<button class="chip neutral" data-act="annAud" data-id="${esc(k)}" aria-pressed="${A2.aud === k}">${esc(l)}</button>`).join('')}${A2.aud.startsWith('team:') || A2.aud === 'low' ? `<button class="chip neutral" aria-pressed="true">${esc(audLabel(A2.aud))}</button>` : ''}</div></div>
    <div class="fgrp"><b>Channels</b><div class="chips wrap">${Object.entries(CH).map(([k, [l, i]]) => { const off = (k === 'slack' && !ws.integr.slack) || (k === 'msteams' && !ws.integr.msteams); return `<button class="chip neutral" data-act="annCh" data-id="${k}" aria-pressed="${A2.ch.includes(k)}" ${off ? 'disabled title="Connect it in Integrations first"' : ''}>${ic(i)}${l}${off ? ' · not connected' : ''}</button>`; }).join('')}</div></div>
    <div class="fgrp"><b>Start from</b><div class="chips">${[['blank', 'Blank'], ['reg', 'Registration open'], ['rain', 'Rain delay'], ['low', 'Encourage players']].map(([k, l]) => `<button class="chip neutral" data-act="annTpl" data-id="${k}">${l}</button>`).join('')}</div></div>
    <label class="fld"><span>Title</span><input id="anTitle" value="${esc(A2.title)}" placeholder="Short and clear"></label>
    <label class="fld"><span>Message</span><textarea id="anBody" rows="4" placeholder="What’s happening and what people should do">${esc(A2.body)}</textarea></label>
    <div class="annprev"><span class="eyebrow">Preview on a phone</span><div class="ntf unread"><span class="ltile" style="--c:var(--corp)">${ic('megaphone')}</span><div style="display:grid;gap:4px;min-width:0"><b>${esc(A2.title || 'Your title')}</b><span class="muted" style="font-size:13.5px">${esc(A2.body || 'Your message')}</span><span class="faint" style="font-size:12px">${esc(ORG.name)} sports · now</span></div></div></div>
    <div class="errbox" id="anErr" hidden>${ic('info')}<div></div></div>
    <button class="pill block" style="min-height:56px" data-act="annSend">${ic('send')}Send to ${n} ${n === 1 ? 'person' : 'people'}</button>`);
  $('#anTitle').addEventListener('input', (e) => { ANN.title = e.target.value; const b = $('.annprev b'); if (b) b.textContent = e.target.value || 'Your title'; });
  $('#anBody').addEventListener('input', (e) => { ANN.body = e.target.value; const b = $('.annprev .muted'); if (b) b.textContent = e.target.value || 'Your message'; });
}
function integrationsSheet() {
  const I = W().integr;
  sheet(`${head('Integrations', 'Post fixtures, results and announcements where people already are')}
    <div class="lrows">${rowHTML({ act: 'integr', id: 'slack', pressed: I.slack, icon: 'hash', c: '#611F69', title: 'Slack', sub: I.slack ? 'Posting to #halcyon-sports' : 'Post to a channel of your choice', end: `<span class="tickbox">${ic('check')}</span>` })}
      ${rowHTML({ act: 'integr', id: 'msteams', pressed: I.msteams, icon: 'message-circle', c: '#4B53BC', title: 'Microsoft Teams', sub: I.msteams ? 'Posting to Sports channel' : 'Post to a Teams channel', end: `<span class="tickbox">${ic('check')}</span>` })}
      ${rowHTML({ icon: 'lock', title: 'Single sign-on (Google, Microsoft)', sub: 'Coming soon', end: '' })}${rowHTML({ icon: 'users', title: 'HR system sync (Keka, Darwinbox)', sub: 'Coming soon. Until then, import a sheet.', end: '' })}</div>
    <div class="faint" style="font-size:12.5px">Connections are simulated in this prototype.</div><button class="pill block" data-act="close">Done</button>`);
}

/* ── Admin: Events (league + tournaments) ── */
function adminEvents() {
  const st = standings(), sub = S.evView || 'league';
  const seg = `<div class="seg" role="group" aria-label="Events"><button data-act="evView" data-id="league" aria-pressed="${sub === 'league'}">League</button><button data-act="evView" data-id="cups" aria-pressed="${sub === 'cups'}">Tournaments</button></div>`;
  if (sub === 'cups') return seg + cupsHTML(true);
  return `${seg}<div class="section"><h2>${esc(ORG.league)}</h2>${tableHTML(st)}</div>
    <div class="section"><div class="shead"><h2>Fixtures</h2><button class="pill sm" data-act="addFixture">${ic('plus')}Add fixture</button></div><div class="lrows">${S.fixtures.slice().sort((a, b) => a.d - b.d || toMin(a.t) - toMin(b.t)).map(fixtureRow).join('')}</div>
      <div class="faint" style="font-size:12.5px">Both teams get a notification when you add or change a fixture.</div></div>`;
}
function tableHTML(st, mine = []) {
  return `<div class="podium">${[1, 0, 2].map((i) => { const t = st[i]; return `<div class="pod p${i + 1}" style="--c:${t.c}"><span class="crest lg" style="--c:${t.c}">${t.ab}</span><b>${esc(t.name.split(' ')[0])}</b><span class="num">${t.pts} pts</span><i>${i + 1}</i></div>`; }).join('')}</div>
    <div class="table card"><div class="tr th lg"><span>#</span><span>Team</span><span>P</span><span>Pts</span><span>Form</span></div>
      ${st.map((t, i) => `<div class="tr lg ${mine.includes(t.id) ? 'mine' : i < 4 ? 'q' : ''}"><span class="num">${i + 1}</span><span class="tname">${crest(t.id, 'sm')}${esc(t.name)}</span><span class="num">${t.p}</span><b class="num">${t.pts}</b><span class="form">${[...(t.form || '')].map((r) => `<i class="f${r}" title="${{ W: 'Won', D: 'Drew', L: 'Lost' }[r]}">${r}</i>`).join('')}</span></div>`).join('')}</div>`;
}
function cupsHTML(admin) {
  return `${admin ? `<button class="pill block" style="min-height:56px;margin-top:16px" data-act="tourNew">${ic('trophy')}Create a tournament</button>
    <div class="faint" style="font-size:13px;margin-top:8px">Choose approved teams and a format. LetsPlay builds the groups, bracket and schedule, tells every player, and moves winners on as results come in.</div>` : ''}
    <div class="section"><div class="tcards">${tours().map((T) => { const st = tourStatus(T), pr = tourProgress(T), s = sp(T.sport), inIt = T.seeds.some((id) => myTeamIds().includes(id)); return `<button class="tcard" style="--c:${s.c}" data-act="tourOpen" data-id="${T.id}"><span class="crest lg" style="--c:${s.c}">${ic(s.icon)}</span><span class="ltext"><b>${esc(T.name)}${!admin && inIt ? ' <span class="okchip">Your team</span>' : ''}</b><small>${s.name} · ${T.seeds.length} teams · ${T.format === 'groups' ? 'Groups + knockout' : 'Knockout'}</small><small class="tnext">${st.done ? ic('crown') : ic('timer')}${esc(st.text)}</small><span class="prog"><i style="width:${Math.round((pr.played / pr.total) * 100)}%"></i></span></span><span class="tyes num"><b>${pr.played}/${pr.total}</b><small>played</small></span></button>`; }).join('')}</div></div>`;
}

/* ═════ Employee hub ═════ */
function employeeHub() {
  const me = you(), ws = W(), myTeams = me.teams.map(teamById).filter(Boolean), st = standings();
  const myFx = S.fixtures.filter((f) => me.teams.includes(f.a) || me.teams.includes(f.b)).sort((a, b) => a.d - b.d || toMin(a.t) - toMin(b.t));
  const nx = myFx[0], mine = ws.cteams.filter((t) => t.by === me.id);
  const rsvpCounts = (fid) => { const base = { yes: 8, maybe: 3, no: 1 }, v = ws.rsvp[fid]; if (v) base[v]++; return base; };
  return `<div class="org-hero emp"><span class="eyebrow">${esc(ORG.name)} sports</span><h2>Hi ${esc(me.name.split(' ')[0])}</h2><div style="font-size:14px;color:rgba(255,255,255,.88)">${myTeams.map((t) => `${esc(t.name)}${ws.caps[t.id] === me.id ? ' · captain' : ''}`).join(' · ') || 'Not in a team yet'}</div></div>
    ${ws.ann.length ? `<div class="section"><h2>Announcements</h2>${ws.ann.slice(0, 2).map((a) => `<div class="ntf ${a.id === ws.ann[0].id ? 'unread' : ''}"><span class="ltile" style="--c:var(--corp)">${ic('megaphone')}</span><div style="display:grid;gap:4px;min-width:0;flex:1"><div style="display:flex;justify-content:space-between;gap:8px"><b>${esc(a.title)}</b><span class="faint" style="font-size:12px;white-space:nowrap">${esc(a.when)}</span></div><span class="muted" style="font-size:14px">${esc(a.body)}</span></div></div>`).join('')}</div>` : ''}
    ${nx ? (() => { const opp = me.teams.includes(nx.a) ? nx.b : nx.a, mt = me.teams.includes(nx.a) ? nx.a : nx.b, c = rsvpCounts(nx.id), v = ws.rsvp[nx.id]; return `<div class="section"><h2>Your next match</h2><div class="matchcard" style="--c:${teamById(mt).c}">
        <div class="mc-vs">${crest(mt, 'lg')}<span class="vs">v</span>${crest(opp, 'lg')}</div><b>${esc(teamById(mt).name)} v ${esc(teamById(opp).name)}</b><span class="faint">${sp(nx.sport).name} · ${dayLabel(nx.d)} ${fmtT(nx.d, nx.t)} · ${esc(nx.venue.split(' · ')[0])}</span>
        <div class="seg" role="group" aria-label="Are you playing?"><button data-act="rsvp" data-id="${nx.id}" data-v="yes" aria-pressed="${v === 'yes'}">I’m in · ${c.yes}</button><button data-act="rsvp" data-id="${nx.id}" data-v="maybe" aria-pressed="${v === 'maybe'}">Maybe · ${c.maybe}</button><button data-act="rsvp" data-id="${nx.id}" data-v="no" aria-pressed="${v === 'no'}">Out · ${c.no}</button></div></div></div>`; })() : ''}
    <div class="section"><h2>Your teams</h2><div class="lrows">${myTeams.map((t) => rowHTML({ act: 'empTeamOpen', id: t.id, lead: crest(t.id), title: esc(t.name) + (t.status === 'pending' ? ' <span class="stchip st-invited">Waiting for approval</span>' : ''), sub: `${members(t.id).length} players${captainOf(t.id) ? ' · captain ' + esc(captainOf(t.id).name) : ''}` })).join('')}</div></div>
    <div class="section"><h2>Tournaments</h2>${cupsHTML(false)}</div>
    <div class="section"><h2>League table</h2>${tableHTML(st, me.teams)}</div>
    ${ws.reg.open ? `<div class="section regcta"><div><b>Team registration is open</b><small>${ws.reg.sports.map((k) => sp(k).name).join(', ')} · ${ws.reg.min}–${ws.reg.max} players · closes ${dayLabel(ws.reg.deadline)} ${dateAt(ws.reg.deadline, '12:00').getDate()}</small></div><button class="pill" data-act="regNew">${ic('plus')}Register a team</button></div>` : ''}
    ${mine.length ? `<div class="section"><h2>Your registrations</h2><div class="lrows">${mine.map((t) => rowHTML({ lead: crest(t.id), title: esc(t.name), sub: `${sp(t.sport).name} · ${members(t.id).length} players`, end: `<span class="stchip ${t.status === 'approved' ? 'st-yes' : t.status === 'declined' ? 'st-no' : 'st-invited'}">${{ approved: 'Approved', declined: 'Declined', pending: 'Waiting' }[t.status]}</span>` })).join('')}</div></div>` : ''}
    <div class="section">${rowHTML({ act: 'personalTeams', icon: 'users', title: 'Your own teams outside work', sub: 'Friends, neighbourhood and club teams' })}</div>`;
}

/* ── Fixture builder ── */
let FX = null;
function fixtureSheet() {
  const T2 = approvedTeams();
  sheetUpdate(`${head('Add fixture', ORG.league)}
    <div class="fgrp"><b>Home</b><div class="chips wrap">${T2.map((t) => `<button class="chip" style="--c:${t.c}" data-act="fxTeam" data-k="a" data-id="${t.id}" aria-pressed="${FX.a === t.id}" ${FX.b === t.id ? 'disabled' : ''}>${esc(t.name.split(' ')[0])}</button>`).join('')}</div></div>
    <div class="fgrp"><b>Away</b><div class="chips wrap">${T2.map((t) => `<button class="chip" style="--c:${t.c}" data-act="fxTeam" data-k="b" data-id="${t.id}" aria-pressed="${FX.b === t.id}" ${FX.a === t.id ? 'disabled' : ''}>${esc(t.name.split(' ')[0])}</button>`).join('')}</div></div>
    <div class="fgrp"><b>Sport</b><div class="chips">${TOUR_SPORTS.map((k) => `<button class="chip" style="--c:${sp(k).c}" data-act="fxSport" data-id="${k}" aria-pressed="${FX.sport === k}">${ic(sp(k).icon)}${sp(k).name}</button>`).join('')}</div></div>
    <div class="fgrp"><b>Day and time</b><div class="chips">${[0, 1, 2, 3, 4, 5, 6].map((d) => `<button class="chip neutral" data-act="fxDay" data-id="${d}" aria-pressed="${FX.d === d}">${dayLabel(d)} ${dateAt(d, '12:00').getDate()}</button>`).join('')}</div>
      <div class="chips">${['07:00', '13:00', '17:30', '18:30', '19:30'].map((t) => `<button class="chip neutral" data-act="fxTime" data-id="${t}" aria-pressed="${FX.t === t}">${tf.format(dateAt(0, t))}</button>`).join('')}</div></div>
    <div class="fgrp"><b>Venue</b><div class="chips wrap">${VENUES_ENT.map((v) => `<button class="chip neutral" data-act="fxVenue" data-id="${esc(v)}" aria-pressed="${FX.venue === v}">${esc(v.split(' · ')[0])}</button>`).join('')}</div></div>
    ${FX.clash ? `<div class="errbox">${ic('info')}<div>${esc(FX.clash)}</div></div>` : ''}
    <button class="pill block" data-act="fxSave" ${FX.a && FX.b ? '' : 'disabled'}>${ic('calendar-days')}Add and notify both teams</button>`);
}

/* ── Tournament generator ── */
let TD = null;
const freshTD = () => ({ name: 'Diwali Cup', sport: 'football', format: 'groups', teams: approvedTeams().map((t) => t.id).slice(0, 8), seeding: 'standings', startDay: 2, days: 'weekdays', time: '18:00', mins: 60, perDay: 2, venues: [VENUES_ENT[1], VENUES_ENT[3]], thirdPlace: true });
function genSheet() {
  const n = TD.teams.length, err = n < 4 ? 'Pick at least 4 teams.' : !TD.venues.length ? 'Pick at least one venue.' : !TD.name.trim() ? 'Name the tournament.' : '';
  const summary = !err ? (() => { const T = buildTournament(Object.assign({}, TD), rng(3)); return `${T.matches.filter((m) => !m.bye).length} matches over ${T.matchDays} match days, ${dayLabel(T.startDay)} to ${dayLabel(T.endDay)} ${dateAt(T.endDay, '12:00').getDate()}. ${TD.teams.reduce((k, id) => k + members(id).length, 0)} players will be notified.`; })() : '';
  sheetUpdate(`${head('Create a tournament', 'LetsPlay builds the plan and schedule')}
    <label class="fld"><span>Name</span><input id="tdName" value="${esc(TD.name)}"></label>
    <div class="fgrp"><b>Sport</b><div class="chips">${TOUR_SPORTS.map((k) => `<button class="chip" style="--c:${sp(k).c}" data-act="tdSet" data-k="sport" data-id="${k}" aria-pressed="${TD.sport === k}">${ic(sp(k).icon)}${sp(k).name}</button>`).join('')}</div></div>
    <div class="fgrp"><b>Format</b><div class="seg" role="group" aria-label="Format"><button data-act="tdSet" data-k="format" data-id="groups" aria-pressed="${TD.format === 'groups'}">Groups + knockout</button><button data-act="tdSet" data-k="format" data-id="knockout" aria-pressed="${TD.format === 'knockout'}">Knockout</button></div></div>
    <div class="fgrp"><b>Approved teams <span class="faint num">${n} picked</span></b><div class="chips wrap">${approvedTeams().map((t) => `<button class="chip" style="--c:${t.c}" data-act="tdTeam" data-id="${t.id}" aria-pressed="${TD.teams.includes(t.id)}">${esc(t.name.split(' ')[0])} · ${members(t.id).length}</button>`).join('')}</div></div>
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

/* ── Tournament view: bracket · schedule · groups (results entry for admins) ── */
const curTour = () => (PREV && TOUR === PREV.id ? PREV : tours().find((x) => x.id === TOUR));
const isAdmin = () => S.corpRole !== 'employee';
function teamLine(T, m, side) {
  const id = m[side], src = m[side === 'a' ? 'srcA' : 'srcB'], sc = m[side === 'a' ? 'sa' : 'sb'], won = m.winner && m.winner === id;
  return `<span class="mline ${won ? 'won' : ''} ${m.winner && !won && id ? 'lost' : ''} ${id && myTeamIds().includes(id) ? 'me' : ''}">${id ? crest(id, 'sm') : '<span class="crest sm tbd">?</span>'}<span class="mname">${id ? esc(teamById(id).name) : esc(srcLabel(T, src))}</span><b class="num">${sc != null ? sc : ''}</b></span>`;
}
const mCard = (T, m) => `<button class="mcard ${m.round === 'Final' ? 'final' : ''}" data-act="tourMatch" data-id="${m.id}" ${m.a && m.b && !m.bye && isAdmin() ? '' : 'disabled'}><span class="mlab">${esc(m.label)}${m.tb ? ` · won on ${esc(scoreOf(T.sport)[2])}` : ''}</span>${teamLine(T, m, 'a')}${teamLine(T, m, 'b')}<small class="faint">${matchMeta(m)}</small></button>`;
function renderTour() {
  const T = curTour(); if (!T) { TOUR = null; renderCorp(); return; }
  const s = sp(T.sport), st = tourStatus(T), pr = tourProgress(T), preview = PREV && PREV.id === T.id, nr = nextRound(T), admin = isAdmin();
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
      ${groupTable(T, g).map((r, i) => `<div class="tr g ${myTeamIds().includes(r.id) ? 'mine' : i < (Object.keys(T.groups).length === 1 ? 4 : 2) ? 'q' : ''}"><span class="num">${i + 1}</span><span class="tname">${crest(r.id, 'sm')}${esc(teamById(r.id).name)}</span><span class="num">${r.p}</span><span class="num">${r.w}</span><span class="num">${r.d}</span><b class="num">${r.pts}</b></div>`).join('')}</div></div>`).join('') + '<div class="faint" style="font-size:12.5px;margin-top:8px">Highlighted teams go through to the semifinals.</div>'
      : `<div class="empty section">${ic('list')}<b>Straight knockout</b><span class="muted">This tournament has no group stage.</span></div>`;
  }
  $('#scr-team').innerHTML = `<div class="head"><button class="round" data-act="tourBack" aria-label="Back">${ic('arrow-left')}</button><div style="flex:1;min-width:0"><h1 style="font-size:22px">${esc(T.name)}</h1><div class="sub">${s.name} · ${T.seeds.length} teams · ${T.format === 'groups' ? 'Groups + knockout' : 'Knockout'}</div></div>${!preview ? `<button class="round" data-act="shareTour" aria-label="Share">${ic('share-2')}</button>` : ''}</div>
    ${preview ? `<div class="okbox">${ic('sparkles')}<div><b>Preview</b><br>${pr.total} matches, ${dayLabel(T.startDay)} to ${dayLabel(T.endDay)} ${dateAt(T.endDay, '12:00').getDate()}. Publishing sends each player their team’s schedule and posts it to connected channels.</div></div>
      <div style="display:flex;gap:8px;margin-top:10px">${T.seeding === 'random' ? `<button class="pill sm soft" data-act="tdRedraw">${ic('shuffle')}Redraw</button>` : ''}<button class="pill sm soft" data-act="tdEdit">${ic('pencil')}Edit</button><button class="pill sm" style="flex:1" data-act="tdPublish">${ic('send')}Publish</button></div>`
      : `<div class="tstatus"><span>${st.done ? ic('crown') : ic('timer')}<b>${esc(st.text)}</b></span><span class="faint num">${pr.played}/${pr.total} played</span></div><span class="prog"><i style="width:${Math.round((pr.played / pr.total) * 100)}%"></i></span>
      ${admin ? (nr.length ? `<div class="faint" style="font-size:13px;margin-top:8px">Tap a match to enter its result. Players are told who goes through.</div><button class="pill sm soft" style="margin-top:8px" data-act="tourSim">${ic('zap')}Simulate ${esc(nr[0].stage === 'group' ? 'next matchday' : nr[0].round.toLowerCase())}</button>` : '') : '<div class="faint" style="font-size:13px;margin-top:8px">Results are entered by the organisers. You get a notification when your team plays or goes through.</div>'}`}
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
    <button class="pill block" data-act="rsSave" ${level && m.stage === 'ko' && !RS.tb ? 'disabled' : ''}>${ic('check')}Save and notify both teams</button>`);
}
function afterResult(T, m) {
  if (T.champion) { confetti(teamById(T.champion).c); toast(`${teamById(T.champion).name} are champions!`, 'crown'); companyNote('crown', `${teamById(T.champion).name} win the ${T.name}`, 'The final is done. Congratulations to the champions and thanks to everyone who played.'); return; }
  const nxt = T.matches.find((x) => x.stage === 'ko' && ((x.srcA && x.srcA.ref === m.id) || (x.srcB && x.srcB.ref === m.id)));
  if (m.winner && nxt) { toast(`${teamById(m.winner).name} go through to the ${nxt.round === 'Final' ? 'final' : nxt.round.toLowerCase()}`, 'trophy'); if (myTeamIds().includes(m.winner) || myTeamIds().includes(m.a) || myTeamIds().includes(m.b)) companyNote('trophy', `${T.name}: ${teamById(m.winner).name} go through`, `${teamById(m.a).name} ${m.sa}–${m.sb} ${teamById(m.b).name}. Next: the ${nxt.round === 'Final' ? 'final' : nxt.round.toLowerCase()}.`); }
  else toast('Result saved. Tables updated', 'check');
}
function flowAfterTeamChange() { save(); if ($('.sheet')) closeSheet(); renderCorp(); }

Object.assign(A, {
  corpRole: (el) => { S.corpRole = el.dataset.id; TOUR = null; PREV = null; save(); renderCorp(); $('#scr-team').scrollTop = 0; toast(el.dataset.id === 'admin' ? 'Admin view: run the workspace' : 'Employee view: what your staff see', el.dataset.id === 'admin' ? 'shield-check' : 'user'); },
  corpView: (el) => { if (tab !== 'team') go('team'); S.corpView = el.dataset.id; TOUR = null; save(); renderCorp(); $('#scr-team').scrollTop = 0; },
  evView: (el) => { S.evView = el.dataset.id; save(); renderCorp(); },
  company: () => { S.corpRole = 'employee'; go('team'); },
  personalTeams: () => { S.corpPersonal = true; renderTeam(); },
  /* People */
  pplSt: (el) => { PF.st = el.dataset.id; renderCorp(); },
  pplDept: (el) => { PF.dept = el.dataset.id; renderCorp(); },
  empOpen: (el) => empSheet(el.dataset.id),
  empTeam: (el) => { const e = empById(el.dataset.id), t = el.dataset.t; e.teams = e.teams.includes(t) ? e.teams.filter((x) => x !== t) : e.teams.concat(t); save(); empSheet(e.id); renderCorp(); },
  makeCap: (el) => { W().caps[el.dataset.t] = el.dataset.id; save(); empSheet(el.dataset.id); toast(`${empById(el.dataset.id).name.split(' ')[0]} is now captain`, 'crown'); },
  resend: (el) => { closeSheet(); toast(`Invite sent again to ${empById(el.dataset.id).email}`, 'mail'); },
  empRemove: (el) => { const ws = W(), e = empById(el.dataset.id); ws.emps = ws.emps.filter((x) => x.id !== e.id); Object.keys(ws.caps).forEach((k) => { if (ws.caps[k] === e.id) delete ws.caps[k]; }); flowAfterTeamChange(); toast(`${e.name} removed. Their seat is free`, 'check'); },
  inviteLink: () => shareAny(`Join ${ORG.name} on LetsPlay`, `Join ${ORG.name} sports on LetsPlay with your @${DOMAIN} email: leagues, tournaments and games after work.`, 'https://letsplay.app/c/halcyon'),
  importOpen: () => { IMP = { rows: null, invite: true, auto: true, file: '', error: '' }; importSheet(); },
  tplDownload: async () => savedToast(await download('letsplay-employees-template.csv', TEMPLATE), 'Template'),
  impSample: () => { IMP.file = 'halcyon-new-joiners.csv'; const res = checkRows(parseCSV(SAMPLE_SHEET)); IMP.rows = res.rows; importSheet(); },
  impReset: () => { IMP = { rows: null, invite: IMP.invite, auto: IMP.auto, file: '', error: '' }; importSheet(); },
  impInvite: () => { IMP.invite = !IMP.invite; importSheet(); },
  impAuto: () => { IMP.auto = !IMP.auto; importSheet(); },
  impGo: () => { const ws = W(), ok = IMP.rows.filter((r) => !r.issues.length); let made = 0;
    ok.forEach((r) => { const team = allCTeams().find((t) => t.name.toLowerCase() === (r.team || '').toLowerCase()); ws.emps.push({ id: 'e' + Date.now().toString(36) + ws.emps.length, name: r.name, email: r.email, dept: r.dept, sports: r.sports.length ? r.sports : ['football'], teams: team ? [team.id] : [], status: IMP.invite ? 'invited' : 'active', games: 0 }); });
    if (IMP.auto) made = autoBuildTeams(true);
    save(); const n = ok.length, inv = IMP.invite; IMP = null; closeSheet(); PF = { q: '', dept: 'all', st: inv ? 'invited' : 'all' }; S.corpView = 'people'; renderCorp();
    toast(`${n} imported${inv ? ', invites emailed' : ''}${made ? `, ${made} new team${made > 1 ? 's' : ''}` : ''}`, 'user-check'); },
  /* Teams */
  tf: (el) => { TF = el.dataset.id; renderCorp(); },
  ctOpen: (el) => ctSheet(el.dataset.id),
  autoBuild: () => { const prev = autoBuildTeams(false); sheet(`${head('Auto-build teams', 'One team for each department')}
      ${prev.length ? `<div class="lrows">${prev.map(([d, n]) => rowHTML({ icon: 'users', title: `${esc(d)} team`, sub: `${n} people without a ${esc(d)} team` })).join('')}</div><button class="pill block" data-act="autoGo">${ic('check')}Create ${prev.length} team${prev.length > 1 ? 's' : ''}</button>`
        : `<div class="okbox">${ic('circle-check')}<div><b>Every department already has a team</b><br>New departments from an import get one automatically.</div></div><button class="pill block soft" data-act="close">OK</button>`}`); },
  autoGo: () => { const n = autoBuildTeams(true); flowAfterTeamChange(); toast(`${n} team${n > 1 ? 's' : ''} created. Captains can be set in each team`, 'users'); },
  ctNew: () => { PK = { mode: 'create', name: '', sport: 'football', q: '', dept: 'all', sel: [] }; pickerSheet(); },
  ctAdd: (el) => { PK = { mode: 'add', tid: el.dataset.id, q: '', dept: 'all', sel: [] }; pickerSheet(); },
  ctRemove: (el) => { const e = empById(el.dataset.id); e.teams = e.teams.filter((t) => t !== el.dataset.t); save(); ctSheet(el.dataset.t); renderCorp(); },
  regNew: () => { PK = { mode: 'register', name: '', sport: W().reg.sports[0], q: '', dept: you().dept, sel: [] }; pickerSheet(); },
  pkSport: (el) => { PK.sport = el.dataset.id; pickerSheet(); },
  pkDept: (el) => { PK.dept = el.dataset.id; pickerSheet(); },
  pkToggle: (el) => { const id = el.dataset.id; PK.sel = PK.sel.includes(id) ? PK.sel.filter((x) => x !== id) : PK.sel.concat(id); pickerSheet(); },
  pkDone: () => { const ws = W(), err = $('#pkErr'), fail = (m) => { err.hidden = false; err.lastElementChild.textContent = m; err.scrollIntoView({ block: 'nearest' }); };
    if (PK.mode === 'add') { PK.sel.forEach((id) => empById(id).teams.push(PK.tid)); const t = PK.tid, n = PK.sel.length; PK = null; save(); ctSheet(t); renderCorp(); toast(`${n} added. They’ve been notified`, 'user-plus'); return; }
    const reg = PK.mode === 'register', size = PK.sel.length + (reg ? 1 : 0);
    if (!PK.name.trim()) return fail('Give the team a name.');
    if (allCTeams().some((t) => t.name.toLowerCase() === PK.name.trim().toLowerCase())) return fail('There’s already a team with that name.');
    if (reg && (size < ws.reg.min || size > ws.reg.max)) return fail(`Teams need ${ws.reg.min}–${ws.reg.max} players, including you. You have ${size}.`);
    const id = 'ct' + Date.now().toString(36), status = reg && ws.reg.approve ? 'pending' : 'approved';
    ws.cteams.push({ id, name: PK.name.trim(), dept: [...new Set(PK.sel.map((x) => empById(x).dept))].length > 1 ? 'Mixed' : empById(PK.sel[0]).dept, sport: PK.sport, c: TEAM_COLORS[ws.cteams.length % TEAM_COLORS.length], ab: PK.name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase(), status, by: reg ? you().id : null, when: 'Just now', w: 0, d: 0, l: 0, form: '' });
    PK.sel.forEach((x) => empById(x).teams.push(id)); if (reg) { you().teams.push(id); ws.caps[id] = you().id; } else ws.caps[id] = PK.sel[0];
    const nm = PK.name.trim(); PK = null; save(); closeSheet(); renderCorp();
    if (reg) { toast(status === 'pending' ? `${nm} sent to the admin for approval` : `${nm} is registered`, 'send'); companyNote('users', `${nm}: ${status === 'pending' ? 'waiting for approval' : 'registered'}`, status === 'pending' ? 'Your company’s sports admin will review it. Your teammates were told they’ve been added.' : 'Your team is in. Teammates have been notified.'); }
    else toast(`${nm} created. Players were notified`, 'users'); },
  teamApprove: (el) => { const t = teamById(el.dataset.id); t.status = 'approved'; save(); if ($('.sheet')) closeSheet(); renderCorp(); toast(`${t.name} approved. The captain and players were notified`, 'check');
    if (members(t.id).some((e) => e.you)) companyNote('circle-check', `${t.name} is approved`, 'Your team can now be picked for leagues and tournaments.', 'action'); },
  teamDecline: (el) => { const t = teamById(el.dataset.id); t.status = 'declined'; members(t.id).forEach((e) => { e.teams = e.teams.filter((x) => x !== t.id); }); W().cteams = W().cteams.filter((x) => x.id !== t.id || x.by === you().id); save(); if ($('.sheet')) closeSheet(); renderCorp(); toast(`${t.name} declined. The captain was told why`, 'check'); },
  regSettings: () => regSettingsSheet(),
  regToggle: () => { W().reg.open = !W().reg.open; save(); regSettingsSheet(); renderCorp(); },
  regApprove: () => { W().reg.approve = !W().reg.approve; save(); regSettingsSheet(); },
  regSport: (el) => { const R = W().reg, k = el.dataset.id; R.sports = R.sports.includes(k) ? R.sports.filter((x) => x !== k) : R.sports.concat(k); if (!R.sports.length) R.sports = [k]; save(); regSettingsSheet(); },
  regDeadline: (el) => { W().reg.deadline = +el.dataset.id; save(); regSettingsSheet(); },
  regN: (el) => { const R = W().reg, k = el.dataset.k; R[k] = Math.max(2, Math.min(30, R[k] + +el.dataset.d)); if (R.min > R.max) R[k === 'min' ? 'max' : 'min'] = R[k]; save(); regSettingsSheet(); },
  /* Announcements and integrations */
  annNew: (el) => { const k = el.dataset.id || ''; ANN = { aud: k.startsWith('team:') ? k : k === 'low' ? 'low' : 'all', ch: ['app', 'email'].concat(W().integr.slack ? ['slack'] : [], W().integr.msteams ? ['msteams'] : []), title: '', body: '' };
    if (k === 'reg' || k === 'low') { const t = tpl(k); ANN.title = t[0]; ANN.body = t[1]; } annSheet(); },
  annAud: (el) => { ANN.aud = el.dataset.id; annSheet(); },
  annCh: (el) => { const k = el.dataset.id; ANN.ch = ANN.ch.includes(k) ? ANN.ch.filter((x) => x !== k) : ANN.ch.concat(k); annSheet(); },
  annTpl: (el) => { const t = tpl(el.dataset.id); ANN.title = t[0]; ANN.body = t[1]; annSheet(); },
  annSend: () => { const err = $('#anErr'); if (!ANN.title.trim() || !ANN.body.trim() || !ANN.ch.length) { err.hidden = false; err.lastElementChild.textContent = !ANN.ch.length ? 'Pick at least one channel.' : 'Add a title and a message.'; return; }
    const n = audCount(ANN.aud); W().ann.unshift({ id: 'an' + Date.now(), title: ANN.title.trim(), body: ANN.body.trim(), aud: ANN.aud, ch: ANN.ch.slice(), when: 'Just now', reach: n, read: 0 });
    if (youIn(ANN.aud)) companyNote('megaphone', ANN.title.trim(), ANN.body.trim(), 'action');
    const ch = ANN.ch.map((c) => CH[c][0]).join(', '); ANN = null; save(); closeSheet(); renderCorp(); toast(`Sent to ${n} people by ${ch}`, 'send'); },
  integrations: () => integrationsSheet(),
  integr: (el) => { const I = W().integr, k = el.dataset.id; I[k] = !I[k]; save(); integrationsSheet(); renderCorp(); toast(I[k] ? `${k === 'slack' ? 'Slack' : 'Microsoft Teams'} connected` : 'Disconnected', I[k] ? 'check' : 'x'); },
  exportReport: async () => { const rows = [['Name', 'Email', 'Department', 'Teams', 'Status', 'Games this month']].concat(emps().map((e) => [e.name, e.email, e.dept, e.teams.map((t) => teamById(t).name).join('; '), e.status, e.games]));
    savedToast(await download(`letsplay-participation-${new Date().toISOString().slice(0, 10)}.csv`, rows.map((r) => r.map(csvCell).join(',')).join('\n')), `Report for ${emps().length} people`); },
  /* Employee */
  rsvp: (el) => { const ws = W(); ws.rsvp[el.dataset.id] = ws.rsvp[el.dataset.id] === el.dataset.v ? null : el.dataset.v; save(); renderCorp(); if (ws.rsvp[el.dataset.id]) toast({ yes: 'You’re in. Your captain can see it', maybe: 'Marked as maybe', no: 'Your captain knows you can’t make it' }[el.dataset.v], 'check'); },
  empTeamOpen: (el) => { const t = teamById(el.dataset.id), m = members(t.id), capId = W().caps[t.id], fx = S.fixtures.filter((f) => f.a === t.id || f.b === t.id);
    sheet(`${head(esc(t.name), `${esc(t.dept)} · ${m.length} players`)}<div class="lrows">${m.map((e) => rowHTML({ lead: avatar(e.name), title: esc(e.name) + (e.you ? ' (you)' : ''), sub: esc(e.dept) + (e.id === capId ? ' · captain' : ''), end: e.id === capId ? `<span class="okchip">${ic('crown')}C</span>` : '' })).join('')}</div>
      ${fx.length ? `<div class="fgrp"><b>Fixtures</b><div class="lrows">${fx.map(fixtureRow).join('')}</div></div>` : ''}
      ${capId === you().id ? `<button class="pill block" data-act="annNew" data-id="team:${t.id}">${ic('megaphone')}Message the team</button>` : ''}`); },
  /* Fixtures and tournaments */
  addFixture: () => { FX = { a: null, b: null, sport: 'cricket', d: 1, t: '18:30', venue: VENUES_ENT[0], clash: '' }; fixtureSheet(); },
  fxTeam: (el) => { FX[el.dataset.k] = el.dataset.id; FX.clash = ''; fixtureSheet(); },
  fxSport: (el) => { FX.sport = el.dataset.id; fixtureSheet(); },
  fxDay: (el) => { FX.d = +el.dataset.id; FX.clash = ''; fixtureSheet(); },
  fxTime: (el) => { FX.t = el.dataset.id; FX.clash = ''; fixtureSheet(); },
  fxVenue: (el) => { FX.venue = el.dataset.id; FX.clash = ''; fixtureSheet(); },
  fxSave: () => { const c = S.fixtures.find((f) => f.d === FX.d && f.t === FX.t && (f.venue === FX.venue || [f.a, f.b].some((x) => x === FX.a || x === FX.b)));
    if (c && !FX.clash) { FX.clash = `${teamById(c.a).name.split(' ')[0]} v ${teamById(c.b).name.split(' ')[0]} is already at that time${c.venue === FX.venue ? ' and venue' : ''}. Save again to add it anyway.`; fixtureSheet(); return; }
    S.fixtures.push({ id: 'x' + Date.now(), a: FX.a, b: FX.b, sport: FX.sport, d: FX.d, t: FX.t, venue: FX.venue });
    if (myTeamIds().includes(FX.a) || myTeamIds().includes(FX.b)) companyNote('calendar-days', `New fixture: ${teamById(FX.a).name} v ${teamById(FX.b).name}`, `${sp(FX.sport).name}, ${dayLabel(FX.d)} at ${fmtT(FX.d, FX.t)}, ${FX.venue.split(' · ')[0]}. Tell your captain if you’re playing.`, 'action');
    const n = members(FX.a).length + members(FX.b).length; FX = null; save(); closeSheet(); renderCorp(); toast(`Fixture added. ${n} players notified`, 'calendar-days'); },
  tourNew: () => { TD = TD || freshTD(); genSheet(); },
  tdSet: (el) => { const k = el.dataset.k, v = el.dataset.id; TD[k] = ['startDay', 'mins'].includes(k) ? +v : v; genSheet(); },
  tdTeam: (el) => { const id = el.dataset.id; TD.teams = TD.teams.includes(id) ? TD.teams.filter((x) => x !== id) : TD.teams.concat(id); genSheet(); },
  tdVenue: (el) => { const v = el.dataset.id; TD.venues = TD.venues.includes(v) ? TD.venues.filter((x) => x !== v) : TD.venues.concat(v); genSheet(); },
  tdPer: (el) => { TD.perDay = Math.max(1, Math.min(6, TD.perDay + +el.dataset.d)); genSheet(); },
  tdThird: () => { TD.thirdPlace = !TD.thirdPlace; genSheet(); },
  tdGen: () => { PREV = buildTournament(Object.assign({}, TD)); TOUR = PREV.id; tourTab = 'bracket'; closeSheet(); renderCorp(); $('#scr-team').scrollTop = 0; },
  tdRedraw: () => { PREV = buildTournament(Object.assign({}, TD)); TOUR = PREV.id; renderTour(); toast('New draw', 'shuffle'); },
  tdEdit: () => { PREV = null; TOUR = null; renderCorp(); genSheet(); },
  tdPublish: () => { tours().unshift(PREV); const T = PREV; PREV = null; TD = null;
    const players = T.seeds.reduce((k, id) => k + members(id).length, 0), ws = W();
    ws.ann.unshift({ id: 'an' + Date.now(), title: `${T.name}: schedule is out`, body: `${T.seeds.length} teams, ${tourProgress(T).total} matches from ${dayLabel(T.startDay)}. Open Company → Tournaments for your team’s matches.`, aud: 'all', ch: ['app', 'email'].concat(ws.integr.slack ? ['slack'] : [], ws.integr.msteams ? ['msteams'] : []), when: 'Just now', reach: emps().length, read: 0 });
    const mine = T.matches.find((m) => !m.bye && (myTeamIds().includes(m.a) || myTeamIds().includes(m.b)));
    companyNote('trophy', `${T.name}: schedule published`, mine ? `Your first match: ${teamById(mine.a).name} v ${teamById(mine.b).name}, ${dayLabel(mine.d)} ${fmtT(mine.d, mine.t)} at ${mine.venue.split(' · ')[0]}.` : `${T.seeds.length} teams. See the bracket on the company page.`, 'action');
    save(); renderTour(); confetti(sp(T.sport).c); toast(`Published. ${players} players notified`, 'send'); },
  tourOpen: (el) => { TOUR = el.dataset.id; tourTab = 'bracket'; PREV = null; renderTour(); $('#scr-team').scrollTop = 0; },
  tourBack: () => { TOUR = null; PREV = null; renderCorp(); },
  tourTab: (el) => { tourTab = el.dataset.id; renderTour(); },
  shareTour: () => { const T = curTour(); shareAny(T.name, `${T.name} at ${ORG.name}: ${tourStatus(T).text}. Follow the bracket on LetsPlay.`, 'https://letsplay.app/t/' + T.id); },
  tourSim: () => { const T = curTour(), r = rng(Date.now() % 100000), ms = nextRound(T); ms.forEach((m) => simulateMatch(T, m, r)); save(); renderTour(); if (T.champion) afterResult(T, ms[0]); else toast('Results in. Winners moved on', 'zap'); },
  tourMatch: (el) => { const T = curTour(), m = T.matches.find((x) => x.id === el.dataset.id), hi = scoreOf(T.sport)[1][1], big = hi > 10; RS = { id: m.id, sa: m.sa != null ? m.sa : big ? Math.round(hi * 0.8 / 5) * 5 : 0, sb: m.sb != null ? m.sb : big ? Math.round(hi * 0.7 / 5) * 5 : 0, tb: m.tb }; resultSheet(T, m); },
  rsN: (el) => { const T = curTour(), m = T.matches.find((x) => x.id === RS.id), step = scoreOf(T.sport)[1][1] > 50 ? 5 : 1; RS[el.dataset.k] = Math.max(0, RS[el.dataset.k] + +el.dataset.d * step); if (RS.sa !== RS.sb) RS.tb = null; resultSheet(T, m); },
  rsTb: (el) => { const T = curTour(), m = T.matches.find((x) => x.id === RS.id); RS.tb = el.dataset.id; resultSheet(T, m); },
  rsSave: () => { const T = curTour(), m = T.matches.find((x) => x.id === RS.id); playMatch(T, m, RS.sa, RS.sb, RS.tb); RS = null; if (!PREV || PREV.id !== T.id) save(); closeSheet(); renderTour(); afterResult(T, m); },
});
/* One team per department that doesn't have one yet; returns [dept, people] pairs, or creates them. */
function autoBuildTeams(apply) {
  const ws = W(), out = [];
  depts().forEach((d) => {
    if (allCTeams().some((t) => t.dept === d)) return;
    const people = emps().filter((e) => e.dept === d); if (people.length < 2) return;
    out.push([d, people.length]);
    if (apply) { const id = 'ct' + Date.now().toString(36) + out.length, name = `${d} United`; ws.cteams.push({ id, name, dept: d, sport: null, c: TEAM_COLORS[(ws.cteams.length + 3) % TEAM_COLORS.length], ab: d.slice(0, 2).toUpperCase(), status: 'approved', by: null, when: 'Just now', w: 0, d: 0, l: 0, form: '' }); people.forEach((e) => e.teams.push(id)); ws.caps[id] = people[0].id; }
  });
  if (apply) save();
  return apply ? out.length : out;
}
