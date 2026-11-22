/* ═════ PRO: add places · host games anywhere · teams · add players · match day ═════ */

/* Update the open sheet in place, keeping its scroll position (for long, live-filtered sheets). */
function sheetUpdate(html) { const sh = $('.sheet'); if (!sh) { sheet(html); return; } const top = sh.scrollTop; sh.innerHTML = html; sh.scrollTop = top; }
function nearestRoad(list, v) { return list.reduce((b, r) => (Math.abs(r[0] - v) < Math.abs(b[0] - v) ? r : b)); }
function addrOf(x, y) { const v = nearestRoad(VROADS, x), h = nearestRoad(HROADS, y); return `${Math.abs(v[0] - x) < Math.abs(h[0] - y) ? v[1] + ', near ' + h[1] : h[1] + ', near ' + v[1]}, ${AREA}`; }
/* Photos are resized to 720 px before saving so the demo stays light. */
function readPhoto(file) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onerror = rej; r.onload = () => { const img = new Image(); img.onerror = rej; img.onload = () => {
    const k = Math.min(1, 720 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.8)); }; img.src = r.result; }; r.readAsDataURL(file); });
}
const placeById = (id) => COMMUNITY_SPOTS.concat(S.places).find((p) => p.id === id);

/* ── Point on the map: drag the map under a fixed crosshair, then confirm ── */
let PICK = null;
function startPick(purpose, at) {
  PICK = { purpose }; closeSheet(); if (tab !== 'play') go('play');
  $('#scr-play').classList.add('picking');
  if (at && at.x) { const [cx, cy] = mapCentre(); setMap(cx - at.x * mz, cy - at.y * mz, false); }
  const m = $('#map'); const o = document.createElement('div'); o.id = 'pickUI'; o.className = 'pick-ui';
  o.innerHTML = `<div class="pick-search">${addrBox('pick', 'Search an address, then fine-tune')}</div><span class="crosshair" aria-hidden="true">${ic('map-pin')}</span><div class="pickbar"><div><b>Drag the map to the spot</b><small id="pickAddr">${esc(addrOf(...pickXY()))}</small></div><div style="display:flex;gap:8px"><button class="pill sm soft" data-act="pickCancel">Cancel</button><button class="pill sm" data-act="pickUse">Use this spot</button></div></div>`;
  $('#scr-play').appendChild(o); m.scrollLeft = m.scrollTop = 0; positionCrosshair();
  PICK.timer = setInterval(() => { const a = $('#pickAddr'); if (a) a.textContent = addrOf(...pickXY()); }, 400);
}
function pickXY() { const [cx, cy] = mapCentre(); return [Math.round((cx - mapPos.x) / mz), Math.round((cy - mapPos.y) / mz)]; }
function positionCrosshair() { const c = $('#pickUI .crosshair'); if (!c) return; const [cx, cy] = mapCentre(); c.style.left = cx + 'px'; c.style.top = cy + 'px'; }
function endPick() { if (PICK) clearInterval(PICK.timer); const o = $('#pickUI'); if (o) o.remove(); $('#scr-play').classList.remove('picking'); const p = PICK; PICK = null; return p; }

/* ── Add a ground or play zone (every plan): photos, address and pin, visible to everyone ── */
let NP = null;
const MAX_PHOTOS = 4, PLACE_KINDS = ['Ground', 'Turf', 'Court', 'Play zone', 'Indoor hall'];
function addPlaceSheet() {
  const sports = ['cricket', 'football', 'badminton', 'volleyball', 'tennis', 'cycling', 'basketball', 'kabaddi', 'running'].concat(customIds());
  sheetUpdate(`${head('Add a ground or play zone', 'Everyone nearby will see it on the map')}
    <div class="fgrp"><b>Photos <span class="faint num">${NP.photos.length} of ${MAX_PHOTOS}</span></b>
      <div class="photos">${NP.photos.map((ph, i) => `<div class="ph"><img src="${ph}" alt="Photo ${i + 1} of the place">${i === 0 ? '<span class="cover">Cover</span>' : ''}<button class="phx" data-act="npPhotoDel" data-i="${i}" aria-label="Remove photo ${i + 1}">${ic('x')}</button></div>`).join('')}
        ${NP.photos.length < MAX_PHOTOS ? `<label class="ph add">${ic('camera')}<small>${NP.photos.length ? 'Add another' : 'Add photos'}</small><input type="file" accept="image/*" multiple id="npPhoto" aria-label="Add photos of the place"></label>` : ''}</div>
      <small class="faint" style="font-size:12.5px">Show the playing surface, the entrance and any facilities. The first photo is the cover.</small></div>
    <label class="fld"><span>Name</span><input id="npName" value="${esc(NP.name)}" placeholder="For example Colony park ground"></label>
    <div class="fgrp"><b>Type</b><div class="chips wrap">${PLACE_KINDS.map((k) => `<button class="chip neutral" data-act="npKind" data-id="${k}" aria-pressed="${NP.kind === k}">${k}</button>`).join('')}</div></div>
    <div class="fgrp"><b>Good for</b><div class="chips wrap">${sports.map((k) => `<button class="chip" style="--c:${sp(k).c}" data-act="npSport" data-id="${k}" aria-pressed="${NP.sport === k}">${ic(sp(k).icon)}${sp(k).name}</button>`).join('')}${newSportChip('place')}</div></div>
    <div class="seg" role="group" aria-label="Setting">${['Outdoor', 'Indoor'].map((s) => `<button data-act="npSet" data-id="${s}" aria-pressed="${NP.setting === s}">${s}</button>`).join('')}</div>
    <div class="fgrp"><b>Address</b>${addrBox('place', 'Search the address or a nearby landmark')}
    ${rowHTML({ act: 'npPick', icon: 'map-pin', title: NP.x ? 'Pin set on the map' : 'Or point to it on the map', sub: NP.x ? 'Tap to fine-tune the pin' : 'Drag the map under a pin' })}
    ${NP.x ? `<label class="fld"><span>Address players will see</span><input id="npAddr" value="${esc(NP.address)}"></label><label class="fld"><span>Landmark (optional)</span><input id="npLand" value="${esc(NP.landmark)}" placeholder="Behind the water tank, gate on the left"></label>` : ''}</div>
    <label class="fld"><span>Note for players (optional)</span><input id="npNote" value="${esc(NP.note)}" placeholder="Lights until 10 pm, bring your own net"></label>
    <div class="errbox" id="npErr" hidden>${ic('info')}<div></div></div>
    <button class="pill block" style="min-height:56px" data-act="npSave">${ic('map-pin-plus')}Save for everyone</button>`);
  const f = $('#npPhoto'); if (f) f.addEventListener('change', async () => { const files = [...f.files].slice(0, MAX_PHOTOS - NP.photos.length); let bad = 0;
    for (const file of files) { try { NP.photos.push(await readPhoto(file)); } catch (e) { bad++; } }
    if (bad) toast(`${bad} photo${bad > 1 ? 's' : ''} could not be read`, 'info'); addPlaceSheet(); });
  [['npName', 'name'], ['npNote', 'note'], ['npAddr', 'address'], ['npLand', 'landmark']].forEach(([id, k]) => { const el = $('#' + id); if (el) el.addEventListener('input', (e) => { NP[k] = e.target.value; }); });
}
function placeSheet(id) {
  const p = placeById(id), s = sp(p.sport) || sp('football'), photos = p.photos && p.photos.length ? p.photos : p.photo ? [p.photo] : [];
  sheet(`${photos.length ? `<div class="gallery">${photos.map((ph, i) => `<img src="${ph}" alt="Photo ${i + 1} of ${esc(p.name)}">`).join('')}</div>` : ''}${head(esc(p.name), `${esc(p.kind || 'Place')} · ${p.setting} · ${esc(p.address || addrOf(p.x, p.y))}`)}
    ${p.landmark ? `<div class="faint" style="font-size:13.5px;margin-top:-8px">${ic('map-pin')} ${esc(p.landmark)}</div>` : ''}
    <div class="lrows">${rowHTML({ icon: s.icon, c: s.c, title: `Good for ${s.name.toLowerCase()}`, sub: esc(p.note || 'No notes yet') })}${rowHTML({ icon: 'user', title: `Added by ${esc(p.by)}`, sub: `Visible to ${esc(p.visibility || 'everyone').toLowerCase()}` })}</div>
    <button class="pill block" data-act="hostHere" data-id="${p.id}">${ic('megaphone')}Host a game here</button>`);
}

/* ── Host a game at any address ── */
let HOST = null;
function hostFresh(loc) { return { loc: loc || null, title: '', sport: 'football', d: 1, t: '18:30', mins: 90, players: 10, fee: 100, vis: 'everyone', landmark: '', invites: [] }; }
/* Lite hosts one upcoming game at a time; once it has happened or is deleted, they can host another. */
const activeHosted = () => S.hosted.filter((a) => a.hostedByYou && a.d >= 0);
function hostLimitSheet() {
  const a = activeHosted()[0];
  sheet(`${head('Lite includes one hosted game', `You’re hosting ${esc(a.title)}, ${dayLabel(a.d)} ${fmtT(a.d, a.t)}`)}
    <div class="muted" style="font-size:14px">Edit it, or delete it to host a different game. You can host again once it has taken place. Pro hosts as many games as you like.</div>
    <div class="two"><button class="pill soft" data-act="hostEdit" data-id="${a.id}">${ic('pencil')}Edit game</button><button class="pill soft danger" data-act="hostCancel" data-id="${a.id}">${ic('trash-2')}Delete game</button></div>
    <button class="pill block" data-act="subscribe" data-id="pro" data-period="yearly">Get Pro for more games</button>`);
}
function hostStart(loc) {
  if (!can.pin() && activeHosted().length && !(HOST && HOST.id)) { hostLimitSheet(); return; }
  HOST = HOST && !loc ? HOST : hostFresh(loc); if (loc) HOST.loc = loc; hostSheet();
}
function hostEdit(id) {
  const a = actById(id); if (!a) return;
  HOST = { id, loc: { id: null, x: a.x, y: a.y, address: a.venue, photo: a.photo || null }, title: a.title, sport: a.sport, d: a.d, t: a.t, mins: a.mins, players: a.total, fee: a.price, vis: a.vis || 'everyone', landmark: a.landmark || '', invites: [], joined: a.total - spotsLeft(a), was: { d: a.d, t: a.t, venue: a.venue } };
  hostSheet();
}
function hostSheet() {
  const H = HOST, sports = can.pin() ? customIds().concat(['football', 'cricket', 'badminton', 'basketball', 'volleyball', 'kabaddi', 'tennis', 'pickleball']) : LITE_SPORTS;
  if (!sports.includes(H.sport)) H.sport = sports[0];
  const venues = VENUES_BOOK.map((v) => ({ id: v.id, name: v.name, x: v.x, y: v.y, photo: null })).concat(S.places.map((p) => ({ id: p.id, name: p.name, x: p.x, y: p.y, photo: p.photo })));
  const teams = can.teams() ? S.teams : S.teams.filter((t) => t.mine);
  sheetUpdate(`${head(H.id ? 'Edit your game' : 'Host a game', H.id ? (H.joined ? `${H.joined} player${H.joined > 1 ? 's have' : ' has'} joined. They’ll be told about changes.` : 'No one has joined yet') : can.pin() ? 'Publish it to people nearby or just your invitees' : 'Lite includes one hosted game at a time')}
    <div class="fgrp"><b>Where</b>
      ${addrBox('host')}
      ${H.loc ? `<div class="card loccard"><span class="ltile">${ic('map-pin')}</span><div style="flex:1;min-width:0;display:grid;gap:8px"><label class="fld"><span>Address players will see</span><input id="hAddr" value="${esc(H.loc.address)}"></label><label class="fld"><span>Landmark (optional)</span><input id="hLand" value="${esc(H.landmark)}" placeholder="Gate 2, opposite the chai stall"></label></div></div>` : ''}
      <div class="chips wrap"><button class="chip neutral" data-act="hostPick">${ic('map-pin')}${H.loc ? 'Adjust pin on the map' : 'Point on the map'}</button><button class="chip neutral" data-act="hostMe">${ic('locate-fixed')}My location</button><button class="chip neutral" data-act="placeNew" data-id="host">${ic('camera')}Snap a new place</button></div>
      <div class="chips">${venues.map((v) => `<button class="chip neutral" data-act="hostVenue" data-id="${v.id}" aria-pressed="${!!(H.loc && H.loc.id === v.id)}">${esc(v.name)}</button>`).join('')}</div></div>
    <label class="fld"><span>Title</span><input id="hTitle" value="${esc(H.title)}" placeholder="For example Friday night 5-a-side"></label>
    <div class="fgrp"><b>Sport</b><div class="chips wrap">${sports.map((k) => `<button class="chip" style="--c:${sp(k).c}" data-act="hostSport" data-id="${k}" aria-pressed="${H.sport === k}">${ic(sp(k).icon)}${sp(k).name}</button>`).join('')}${newSportChip('host')}</div></div>
    <div class="fgrp"><b>When</b><div class="chips">${[0, 1, 2, 3, 4, 5, 6].map((d) => `<button class="chip neutral" data-act="hostDay" data-id="${d}" aria-pressed="${H.d === d}">${dayLabel(d)} ${dateAt(d, '12:00').getDate()}</button>`).join('')}</div>
      <div class="chips">${['06:30', '07:30', '17:30', '18:30', '19:30', '20:30'].map((t) => `<button class="chip neutral" data-act="hostTime" data-id="${t}" aria-pressed="${H.t === t}">${tf.format(dateAt(0, t))}</button>`).join('')}</div></div>
    <div class="two"><div class="fgrp"><b>Players needed</b><div class="stepper"><button data-act="hostN" data-k="players" data-d="-1" aria-label="One fewer player">${ic('minus')}</button><b class="num">${H.players}</b><button data-act="hostN" data-k="players" data-d="1" aria-label="One more player">${ic('plus')}</button></div></div>
      <div class="fgrp"><b>Fee each</b><div class="stepper"><button data-act="hostN" data-k="fee" data-d="-50" aria-label="₹50 less">${ic('minus')}</button><b class="num">${H.fee ? inr(H.fee) : 'Free'}</b><button data-act="hostN" data-k="fee" data-d="50" aria-label="₹50 more">${ic('plus')}</button></div></div></div>
    <div class="fgrp"><b>Who can see it</b><div class="seg" role="group" aria-label="Visibility"><button data-act="hostVis" data-id="everyone" aria-pressed="${H.vis === 'everyone'}">Everyone nearby</button><button data-act="hostVis" data-id="invited" aria-pressed="${H.vis === 'invited'}">Invited only</button></div></div>
    ${teams.length ? `<div class="fgrp"><b>Invite your team${teams.length > 1 ? 's' : ''}</b><div class="chips wrap">${teams.map((t) => `<button class="chip" style="--c:${t.color}" data-act="hostInv" data-id="${t.id}" aria-pressed="${H.invites.includes(t.id)}">${ic('users')}${esc(t.name)} · ${t.members.length}</button>`).join('')}</div></div>` : ''}
    <div class="errbox" id="hErr" hidden>${ic('info')}<div></div></div>
    <button class="pill block" style="min-height:56px" data-act="hostPublish">${H.id ? `${ic('check')}Save changes` : `${ic('megaphone')}Publish game`}</button>
    ${H.id ? `<button class="pill block soft danger" data-act="hostCancel" data-id="${H.id}">${ic('trash-2')}Delete game</button>` : ''}`);
  [['hTitle', 'title'], ['hAddr', 'address'], ['hLand', 'landmark']].forEach(([id, k]) => { const el = $('#' + id); if (el) el.addEventListener('input', () => { if (k === 'address') H.loc.address = el.value; else H[k] = el.value; }); });
}
function publishHost() {
  const H = HOST, err = $('#hErr');
  const bad = !H.loc ? 'Choose where the game is.' : !H.title.trim() ? 'Give the game a title.' : !H.loc.address.trim() ? 'Add the address players will see.' : '';
  if (bad) { err.hidden = false; err.lastElementChild.textContent = bad; err.scrollIntoView({ block: 'nearest' }); return; }
  if (H.id) {   /* edit: update in place, keep who joined, tell them if the when or where changed */
    const a = actById(H.id), cust = allCustom().find((c) => c.id === H.sport) || {};
    Object.assign(a, { title: H.title.trim(), sport: H.sport, venue: H.loc.address.trim(), landmark: H.landmark.trim(), x: H.loc.x, y: H.loc.y, d: H.d, date: ymd(dateAt(H.d, '12:00')), t: H.t,
      spots: H.players, total: H.players, price: H.fee, vis: H.vis, img: SPORT_IMG[H.sport] || 'gym', photo: H.loc.photo || cust.cover || a.photo || null });
    const moved = H.was.d !== H.d || H.was.t !== H.t || H.was.venue !== a.venue, n = H.joined; HOST = null; save(); closeSheet();
    if (tab === 'games') renderGames(); else { focused = a.id; go('play'); setTimeout(() => focusGame(a.id, true), 80); }
    toast(moved && n ? `Changes saved. ${n} player${n > 1 ? 's were' : ' was'} told about the new ${H.was.venue !== a.venue ? 'place' : 'time'}` : 'Changes saved', 'check');
    return;
  }
  const id = 'h' + Date.now(), invitees = H.invites.reduce((n, tid) => n + S.teams.find((t) => t.id === tid).members.length - 1, 0);
  const a = { id, title: H.title.trim(), sport: H.sport, venue: H.loc.address.trim(), landmark: H.landmark.trim(), x: H.loc.x, y: H.loc.y, d: H.d, t: H.t, mins: H.mins, level: 'All levels', ages: '16+',
    date: ymd(dateAt(H.d, '12:00')),
    spots: H.players, total: H.players, price: H.fee, host: 'Arjun Mehta', img: SPORT_IMG[H.sport] || 'gym', photo: H.loc.photo || ((allCustom().find((c) => c.id === H.sport) || {}).cover) || null, setting: (allCustom().find((c) => c.id === H.sport) || {}).setting || 'Outdoor', surface: 'As described by the host', equipment: 'Ask the host in the game chat.', access: 'Ask the host about access.', cancel: 'Free cancellation up to 2 hours before.', hostedByYou: true, vis: H.vis };
  S.hosted.push(a); HOST = null; S.xp += 40; save(); closeSheet();
  focused = id; S.mood = 'all'; go('play'); setTimeout(() => focusGame(id, true), 80); confetti(sp(a.sport).c); buzz(25);
  badgeCheck();
  toast(H.vis === 'invited' ? `Published to ${invitees || 'your'} invitees with the address and map pin` : `Published. ${invitees ? invitees + ' teammates invited, and players' : 'Players'} nearby can join`, 'megaphone');
}

/* ── Teams ── */
let TV = null, teamTab = 'match';
const teamOf = (id) => S.teams.find((t) => t.id === id);
const tmOf = (t) => { if (!S.tm[t.id]) S.tm[t.id] = { lineup: {}, picks: [], cap: 0, vote: null, chat: [['Rohan Iyer', 'Nets at 6 before the match?'], ['Vikram Singh', 'I can bring the stumps and two balls.']] }; return S.tm[t.id]; };
const teamCode = (t) => t.name.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase() + '-' + (1000 + (t.id.length * 7919 + t.name.length * 31) % 9000);
const teamLink = (t) => 'https://splayer.app/join/' + teamCode(t).toLowerCase();
const crestTxt = (t) => t.name.split(' ').map((w) => w[0]).join('').slice(0, 2);
/* Lite: one team you create yourself, in six popular sports. Pro and Corporate: any number, any sport. */
const LITE_SPORTS = ['cricket', 'football', 'volleyball', 'cycling', 'badminton', 'tennis'];
LINEUP_SIZE.tennis = LINEUP_SIZE.tennis || 4; LINEUP_SIZE.cycling = LINEUP_SIZE.cycling || 8;
const myTeams = () => S.teams.filter((t) => t.mine);
const canOpenTeam = (t) => !!t && (can.teams() || t.mine);
const teamCard = (t) => { const yes = t.members.filter((m) => m.status === 'yes').length; return `<button class="tcard" style="--c:${t.color}" data-act="openTeam" data-id="${t.id}">
  <span class="crest lg" style="--c:${t.color}">${esc(crestTxt(t))}</span><span class="ltext"><b>${esc(t.name)}</b><small>${sp(t.sport).name} · ${t.members.length} member${t.members.length === 1 ? '' : 's'} · ${esc(t.privacy)}</small>
  ${t.next ? `<small class="tnext">${ic('calendar-days')}v ${esc(t.next.vs)} · ${dayLabel(t.next.d)} ${fmtT(t.next.d, t.next.t)}</small>` : '<small class="tnext">No match scheduled</small>'}</span>
  <span class="tyes num"><b>${yes}</b><small>in</small></span></button>`; };
function renderTeam() {
  if (can.org() && !S.corpPersonal) { renderCorp(); return; }
  if (TV && canOpenTeam(teamOf(TV))) { renderTeamView(); return; }
  const el = $('#scr-team');
  if (!can.teams()) {
    const t = myTeams()[0];
    el.innerHTML = `<div class="head"><div><h1>Your team</h1><div class="sub">Lite includes one team</div></div>${t ? '' : `<button class="pill sm" data-act="newTeam">${ic('plus')}Create</button>`}</div>
      ${t ? `<div class="tcards">${teamCard(t)}</div>
        <div class="two" style="margin-top:10px"><button class="pill soft" data-act="teamEdit" data-id="${t.id}">${ic('pencil')}Edit team</button><button class="pill soft danger" data-act="teamDelete" data-id="${t.id}">${ic('trash-2')}Delete</button></div>
        <div class="faint" style="font-size:12.5px;margin-top:8px">Want a different team? Delete this one and create a new one, or get Pro for as many teams as you like.</div>`
      : `<div class="empty lite-empty"><div class="sport-row">${LITE_SPORTS.map((k) => `<span class="sp-badge sm" style="--c:${sp(k).c}">${ic(sp(k).icon)}</span>`).join('')}</div><b>Create your team</b><span class="muted">Cricket, football, volleyball, cycling, badminton or tennis. Add players near you, pick the lineup and chat with your team.</span><button class="pill" data-act="newTeam">${ic('plus')}Create a team</button></div>`}
      <div class="section"><h2>With Pro</h2><div class="lrows">${[['users', 'As many teams as you like', 'In every sport, plus your own custom sports'], ['megaphone', 'Host games anywhere', 'Pick any address, set the fee, publish to people nearby'], ['percent', '10% off in the shop', 'On every order']].map(([i, ti, d]) => rowHTML({ icon: i, title: ti, sub: d })).join('')}</div>
        <button class="pill block soft" data-act="plans">See Pro · ${inr(Math.floor(yearlyPrice(PLANS.pro.monthly) / 12))}/month, billed yearly</button></div>`;
    return;
  }
  el.innerHTML = `${can.org() ? `<button class="pill sm soft" style="margin-bottom:12px" data-act="backToCompany">${ic('arrow-left')}Company</button>` : ''}<div class="head"><div><h1>Your teams</h1><div class="sub">${S.teams.length} team${S.teams.length === 1 ? '' : 's'} · you captain ${S.teams.filter((t) => t.members[0].role === 'Captain').length}</div></div><button class="pill sm" data-act="newTeam">${ic('plus')}New team</button></div>
    <div class="tcards">${S.teams.map(teamCard).join('')}</div>
    <div class="section"><button class="pill block soft" data-act="hostStart">${ic('megaphone')}Host a game</button></div>`;
}
function openTeam(id) { TV = id; teamTab = 'match'; if (tab !== 'team') go('team'); else renderTeam(); $('#scr-team').scrollTop = 0; }
const POS = [['Bowler', 50, 28], ['Keeper', 50, 72], ['Slip', 63, 77], ['Point', 18, 50], ['Cover', 25, 31], ['Mid-off', 38, 17], ['Mid-on', 62, 17], ['Midwicket', 77, 33], ['Sq. leg', 82, 54], ['Fine leg', 70, 84], ['Third man', 30, 84]];
let picking = null;
function renderTeamView() {
  const t = teamOf(TV), M = tmOf(t), s = sp(t.sport), size = LINEUP_SIZE[t.sport] || 6;
  const cnt = (st) => t.members.filter((m) => m.status === st).length, noReply = t.members.filter((m) => m.status === 'maybe' || m.status === 'invited').length;
  let body = '';
  if (teamTab === 'match') {
    const placed = Object.values(M.lineup);
    body = `<div class="section"><h2>Who’s playing?</h2><div class="avail"><div><b class="num" style="color:var(--ok)">${cnt('yes')}</b><small>In</small></div><div><b class="num">${noReply}</b><small>No reply or maybe</small></div><div><b class="num" style="color:var(--live)">${cnt('no')}</b><small>Out</small></div></div>
        <div class="poll">${[['yes', 'I’m in'], ['maybe', 'Maybe'], ['no', 'Can’t make it']].map(([k, l]) => `<button data-act="tVote" data-id="${k}" aria-pressed="${t.members[0].status === k}"><i style="width:${Math.round((cnt(k) / t.members.length) * 100)}%"></i><span>${l}</span><span class="num">${cnt(k)}</span></button>`).join('')}</div>
        ${noReply ? `<button class="pill sm soft" style="justify-self:start" data-act="tNudge">${ic('send')}Nudge ${noReply} who haven’t replied</button>` : ''}</div>
      ${t.sport === 'cricket' ? `<div class="section"><h2>Set the field</h2><div class="muted" style="font-size:14px">${picking ? `Tap a spot for <b style="color:var(--ink)">${esc(picking)}</b>` : 'Pick a player, then tap a fielding spot. Tap a placed player to bench them.'}</div>
        <div class="field ${picking ? 'placing' : ''}" role="group" aria-label="Fielding positions">${POS.map(([n, x, y]) => { const who = M.lineup[n]; return `<button class="pos ${who ? 'filled' : ''}" style="left:${x}%;top:${y}%" data-act="pos" data-id="${n}" aria-label="${n}${who ? ': ' + esc(who) : ', empty'}"><span class="dot">${who ? esc(who.split(' ').map((w) => w[0]).join('')) : ''}</span><small>${n}</small></button>`; }).join('')}</div>
        <div class="bench">${t.members.filter((m) => m.status !== 'no').map((m) => `<button class="chip" data-act="pick" data-id="${esc(m.name)}" aria-pressed="${picking === m.name}" ${placed.includes(m.name) ? 'disabled' : ''}>${avatar(m.name)}${esc(m.name.split(' ')[0])}</button>`).join('')}</div>
        <div class="faint" style="font-size:13px"><span class="num">${placed.length}</span> of 11 placed${placed.length < 11 ? `. ${11 - placed.length} more needed for a full side.` : '. Full side.'}</div></div>`
      : `<div class="section"><h2>Lineup <span class="faint num" style="font:700 14px var(--f-body)">${M.picks.length}/${size}</span></h2>${M.picks.length < size ? `<div class="faint" style="font-size:13.5px">${size - M.picks.length} more for a full ${s.name.toLowerCase()} side.</div>` : ''}
        <div class="lrows">${t.members.map((m, i) => { const on = M.picks.includes(i); return `<div class="lrow">${avatar(m.name)}<span class="ltext"><b>${esc(m.name)}${M.cap === i ? ' <span class="okchip">C</span>' : ''}</b><small>${on ? 'In the lineup' : 'On the bench'} · ${m.status === 'yes' ? 'said yes' : m.status === 'no' ? 'said no' : 'no reply yet'}</small></span><button class="round sm" data-act="tCap" data-i="${i}" aria-label="Make ${esc(m.name)} captain" aria-pressed="${M.cap === i}">${ic('crown')}</button><button class="pill sm ${on ? 'soft' : ''}" data-act="tPick" data-i="${i}">${on ? 'Bench' : 'Add'}</button></div>`; }).join('')}</div></div>`}
      <div class="section"><button class="pill block soft" data-act="tShareLineup">${ic('share-2')}Share the lineup</button></div>`;
  } else if (teamTab === 'roster') {
    body = `<div class="section share-card"><div style="min-width:0"><b>Invite with a link or code</b><div class="faint" style="font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${teamLink(t)} · code <b class="num" style="color:var(--ink)">${teamCode(t)}</b></div></div><button class="pill sm" data-act="shareTeam" data-id="${t.id}">${ic('share-2')}Share</button></div>
      <div class="section"><div style="display:flex;justify-content:space-between;align-items:center"><h2>${t.members.length} members</h2><button class="pill sm" data-act="addPlayers" data-id="${t.id}">${ic('user-plus')}Add players</button></div>
      <div class="lrows">${t.members.map((m) => rowHTML({ lead: avatar(m.name), title: esc(m.name), sub: m.role + (m.status === 'invited' ? ' · invite sent' : ''), end: `<span class="stchip st-${m.status}">${{ yes: 'In', maybe: 'Maybe', no: 'Out', invited: 'Invited' }[m.status]}</span>` })).join('')}</div></div>`;
  } else {
    body = `<div class="section"><div class="chat">${M.chat.map(([w, m]) => `<div class="msg ${w === 'You' ? 'mine' : ''}">${w === 'You' ? '' : `<b>${esc(w)}</b>`}${esc(m)}</div>`).join('')}</div>
      <div class="chips">${['On my way', 'Who has the kit?', 'Running 10 min late', 'Great game, team!'].map((m) => `<button class="chip neutral" data-act="say" data-id="${m}">${ic('send')}${m}</button>`).join('')}</div></div>`;
  }
  $('#scr-team').innerHTML = `<div class="head"><button class="round" data-act="teamBack" aria-label="Back to your teams">${ic('arrow-left')}</button><div style="flex:1;min-width:0"><h1 style="font-size:22px">${esc(t.name)}</h1><div class="sub">${s.name} · ${t.members.length} members</div></div>${t.members[0].role === 'Captain' ? `<button class="round" data-act="teamEdit" data-id="${t.id}" aria-label="Edit team">${ic('pencil')}</button>` : ''}<button class="round" data-act="shareTeam" data-id="${t.id}" aria-label="Share team invite">${ic('share-2')}</button></div>
    <button class="nexthero" style="--c:${t.color}" data-act="tSchedule">${t.next ? `<span class="eyebrow" style="color:rgba(255,255,255,.85)">Next match</span><h2>v ${esc(t.next.vs)}</h2><span>${longFmt.format(dateAt(t.next.d, t.next.t))} · ${fmtT(t.next.d, t.next.t)} · ${esc(t.next.venue)}</span><span class="faint" style="color:rgba(255,255,255,.8);font-size:13px">Tap to reschedule</span>` : `<span class="eyebrow" style="color:rgba(255,255,255,.85)">No match yet</span><h2>Schedule a match</h2><span>Pick an opponent, day and ground</span>`}</button>
    <div class="seg" role="group" aria-label="Team section" style="margin-top:16px"><button data-act="teamTab" data-id="match" aria-pressed="${teamTab === 'match'}">Match day</button><button data-act="teamTab" data-id="roster" aria-pressed="${teamTab === 'roster'}">Roster</button><button data-act="teamTab" data-id="chat" aria-pressed="${teamTab === 'chat'}">Chat</button></div>
    ${body}`;
}
function newTeamSheet() {
  const N = NT, sports = can.teams() ? Object.keys(LINEUP_SIZE) : LITE_SPORTS;
  sheetUpdate(`${head(N.id ? 'Edit team' : 'New team', N.id ? 'Changes are shared with your teammates' : can.teams() ? 'You’ll be the captain' : 'Your one Lite team. You’ll be the captain')}
    <label class="fld"><span>Team name</span><input id="ntName" value="${esc(N.name)}" placeholder="For example Lake Road Legends" maxlength="32"></label>
    <div class="fgrp"><b>Sport</b><div class="chips wrap">${sports.map((k) => `<button class="chip" style="--c:${sp(k).c}" data-act="ntSport" data-id="${k}" aria-pressed="${N.sport === k}">${ic(sp(k).icon)}${sp(k).name}</button>`).join('')}${newSportChip('team')}</div>
      ${can.teams() ? '' : '<small class="faint" style="font-size:12.5px">Lite teams play cricket, football, volleyball, cycling, badminton or tennis. Pro adds every sport.</small>'}
      ${N.id && N.sport !== N.was ? '<small class="faint" style="font-size:12.5px">Changing the sport clears the current lineup.</small>' : ''}</div>
    <div class="fgrp"><b>Who can join</b><div class="seg" role="group" aria-label="Privacy"><button data-act="ntPriv" data-id="Invite only" aria-pressed="${N.priv === 'Invite only'}">Invite only</button><button data-act="ntPriv" data-id="Public" aria-pressed="${N.priv === 'Public'}">Anyone can ask</button></div></div>
    <div class="errbox" id="ntErr" hidden>${ic('info')}<div></div></div>
    <button class="pill block" style="min-height:56px" data-act="ntCreate">${N.id ? `${ic('check')}Save changes` : 'Create and add players'}</button>
    ${N.id ? `<button class="pill block soft danger" data-act="teamDelete" data-id="${N.id}">${ic('trash-2')}Delete team</button>` : ''}`);
  $('#ntName').addEventListener('input', (e) => { NT.name = e.target.value; });
}
let NT = null;

/* ── Add players: everyone on Splayer, nearest first, grouped by distance ── */
let AP = null;
function apList() {
  const q = AP.q.trim().toLowerCase();
  return PLAYERS.filter((p) => (AP.sport === 'all' || p.sports.includes(AP.sport)) && (AP.km === 'any' || p.km <= +AP.km) && (!AP.lft || p.lft) && (!q || (p.name + ' ' + p.sports.map((k) => sp(k).name).join(' ')).toLowerCase().includes(q))).sort((a, b) => a.km - b.km);
}
function apSheet() {
  const t = teamOf(AP.tid), list = apList(), bands = [[0, 1, 'Within 1 km'], [1, 3, '1–3 km away'], [3, 99, 'More than 3 km']];
  const sportsList = ['all'].concat(Object.keys(SPORTS).filter((k) => PLAYERS.some((p) => p.sports.includes(k))));
  const row = (p) => { const inT = t.members.some((m) => m.name === p.name), on = AP.sel.includes(p.id);
    return `<button class="lrow" ${inT ? 'disabled' : `data-act="apToggle" data-id="${p.id}" aria-pressed="${on}"`}>${avatar(p.name)}<span class="ltext"><b>${esc(p.name)}${p.lft ? ' <span class="okchip">Looking for a team</span>' : ''}</b><small>${p.sports.map((k) => sp(k).name).join(' · ')} · ${p.level} · ${p.games} games</small><small>${esc(p.bio)}</small></span>
      <span class="apside"><span class="gi-dist">${ic('map-pin')}${fmtKm(p.km)}</span>${inT ? '<small class="faint">In team</small>' : `<span class="tickbox">${ic('check')}</span>`}</span></button>`; };
  sheetUpdate(`${head('Add players', `${esc(t.name)} · ${sp(t.sport).name}`)}
    <div class="share-card"><div style="min-width:0"><b>Invite anyone with a link</b><div class="faint" style="font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${teamLink(t)}</div></div><button class="pill sm" data-act="shareTeam" data-id="${t.id}">${ic('share-2')}Share</button></div>
    <label class="search">${ic('search')}<input id="apQ" type="search" placeholder="Search by name or sport" value="${esc(AP.q)}" aria-label="Search players"></label>
    <div class="chips">${sportsList.map((k) => `<button class="chip ${k === 'all' ? 'neutral' : ''}" style="${k !== 'all' ? '--c:' + sp(k).c : ''}" data-act="apSport" data-id="${k}" aria-pressed="${AP.sport === k}">${k === 'all' ? ic('layers') + 'All' : ic(sp(k).icon) + sp(k).name}</button>`).join('')}</div>
    <div style="display:flex;gap:8px;align-items:center"><div class="seg" style="flex:1" role="group" aria-label="Distance">${[['1', '1 km'], ['3', '3 km'], ['5', '5 km'], ['any', 'Any']].map(([k, l]) => `<button data-act="apKm" data-id="${k}" aria-pressed="${AP.km === k}">${l}</button>`).join('')}</div><button class="chip neutral" data-act="apLft" aria-pressed="${AP.lft}">${ic('user-plus')}Free agents</button></div>
    <div class="faint" style="font-size:12.5px;display:flex;gap:6px;align-items:center">${ic('navigation')}${list.length} player${list.length === 1 ? '' : 's'}, nearest first</div>
    ${list.length ? bands.map(([lo, hi, l]) => { const g = list.filter((p) => p.km >= lo && p.km < hi); return g.length ? `<div class="fgrp"><b class="faint" style="font-size:13px">${l}</b><div class="lrows">${g.map(row).join('')}</div></div>` : ''; }).join('')
      : `<div class="empty">${ic('search')}<b>No players match</b><span class="muted">Widen the distance or share the invite link.</span></div>`}
    <div class="stickybar"><span class="faint num">${AP.sel.length} selected</span><button class="pill" data-act="apAdd" ${AP.sel.length ? '' : 'disabled'}>${ic('user-plus')}${AP.sel.length ? `Invite ${AP.sel.length}` : 'Select players'}</button></div>`);
  const qi = $('#apQ'); qi.addEventListener('input', () => { AP.q = qi.value; const pos = qi.selectionStart; apSheet(); const n = $('#apQ'); n.focus(); n.setSelectionRange(pos, pos); });
}
function openAddPlayers(tid, isNew) { const t = teamOf(tid); if (!canOpenTeam(t)) { upsell('teams'); return; } AP = { tid, q: '', sport: t.sport, km: 'any', lft: false, sel: [], isNew }; closeSheet(); apSheet(); }
function scheduleSheet() {
  const t = teamOf(TV), n = t.next || { vs: '', d: 3, t: '19:00', venue: VENUES_BOOK[0].name };
  SCH = SCH || clone(n);
  sheetUpdate(`${head(t.next ? 'Reschedule match' : 'Schedule a match', esc(t.name))}
    <label class="fld"><span>Opponent</span><input id="schVs" value="${esc(SCH.vs)}" placeholder="Team name"></label>
    <div class="fgrp"><b>Day</b><div class="chips">${[0, 1, 2, 3, 4, 5, 6].map((d) => `<button class="chip neutral" data-act="schDay" data-id="${d}" aria-pressed="${SCH.d === d}">${dayLabel(d)} ${dateAt(d, '12:00').getDate()}</button>`).join('')}</div></div>
    <div class="fgrp"><b>Time</b><div class="chips">${['07:00', '17:30', '18:30', '19:00', '20:00'].map((x) => `<button class="chip neutral" data-act="schTime" data-id="${x}" aria-pressed="${SCH.t === x}">${tf.format(dateAt(0, x))}</button>`).join('')}</div></div>
    <div class="fgrp"><b>Ground</b><div class="chips wrap">${VENUES_BOOK.filter((v) => v.sports.includes(t.sport)).concat(VENUES_BOOK.filter((v) => !v.sports.includes(t.sport))).slice(0, 4).map((v) => `<button class="chip neutral" data-act="schVenue" data-id="${esc(v.name)}" aria-pressed="${SCH.venue === v.name}">${esc(v.name)}</button>`).join('')}</div></div>
    <button class="pill block" data-act="schSave">${ic('send')}Save and ask the team who’s in</button>`);
  $('#schVs').addEventListener('input', (e) => { SCH.vs = e.target.value; });
}
let SCH = null;

Object.assign(A, {
  addToMap: () => sheet(`${head('Add to the map')}<div class="lrows">${rowHTML({ act: 'placeNew', icon: 'camera', title: 'Add a ground or play zone', sub: 'Photos, address and pin. Everyone nearby will see it.' })}${rowHTML({ act: 'hostStart', icon: 'megaphone', title: 'Host a game', sub: can.pin() ? 'At any address, published to people nearby or invitees' : activeHosted().length ? `You’re hosting ${esc(activeHosted()[0].title)}. Lite hosts one at a time` : 'At any address. Lite hosts one game at a time' })}</div>`),
  place: (el) => placeSheet(el.dataset.id),
  placeNew: (el) => { NP = { photos: [], name: '', kind: 'Ground', sport: 'football', setting: 'Outdoor', note: '', address: '', landmark: '', x: 0, y: 0, ret: el.dataset.id || null }; addPlaceSheet(); },
  npKind: (el) => { NP.kind = el.dataset.id; addPlaceSheet(); },
  npPhotoDel: (el) => { NP.photos.splice(+el.dataset.i, 1); addPlaceSheet(); },
  npSport: (el) => { NP.sport = el.dataset.id; addPlaceSheet(); },
  npSet: (el) => { NP.setting = el.dataset.id; addPlaceSheet(); },
  npPick: () => startPick('place', NP.x ? { x: NP.x, y: NP.y } : null),
  npSave: () => { const err = $('#npErr'), bad = !NP.name.trim() ? 'Give the place a name.' : !NP.x ? 'Set the address or point to it on the map.' : !NP.address.trim() ? 'Add the address players will see.' : '';
    if (bad) { err.hidden = false; err.lastElementChild.textContent = bad; err.scrollIntoView({ block: 'nearest' }); return; }
    const p = { id: 'c' + Date.now(), name: NP.name.trim(), kind: NP.kind, sport: NP.sport, x: NP.x, y: NP.y, photo: NP.photos[0] || null, photos: NP.photos.slice(), address: NP.address.trim(), landmark: NP.landmark.trim(), by: 'You', setting: NP.setting, note: NP.note.trim(), visibility: 'Everyone' };
    S.places.push(p); S.xp += 20; save(); const ret = NP.ret; NP = null;
    if (ret === 'host') { const loc = { id: p.id, x: p.x, y: p.y, address: p.address || addrOf(p.x, p.y), photo: p.photo }; if (HOST) { HOST.loc = loc; HOST.landmark = HOST.landmark || p.landmark; hostSheet(); } else hostStart(loc); toast('Place saved for everyone. Now finish your game', 'map-pin-plus'); return; }
    closeSheet(); go('play'); toast('Place saved. Everyone nearby can see it', 'map-pin-plus'); badgeCheck(); },
  pickUse: () => { const [x, y] = pickXY(), p = endPick();
    if (p.purpose === 'place') { NP.x = x; NP.y = y; NP.address = addrOf(x, y); addPlaceSheet(); return; }
    const keep = HOST && HOST.loc && Math.hypot(HOST.loc.x - x, HOST.loc.y - y) < 30, loc = keep ? Object.assign({}, HOST.loc, { x, y }) : { id: null, x, y, address: addrOf(x, y) };
    if (HOST) { HOST.loc = loc; hostSheet(); } else hostStart(loc); },
  pickCancel: () => { const p = endPick(); if (p.purpose === 'place') addPlaceSheet(); else hostSheet(); },
  hostStart: () => { if (HOST && HOST.id) HOST = null; hostStart(); },
  hostHere: (el) => { const p = placeById(el.dataset.id); HOST = null; hostStart({ id: p.id, x: p.x, y: p.y, address: `${p.name}, ${addrOf(p.x, p.y)}`, photo: p.photo }); },
  hostPick: () => startPick('host', HOST.loc),
  hostMe: () => { HOST.loc = { id: 'me', x: ME.x + 6, y: ME.y + 6, address: addrOf(ME.x, ME.y) }; hostSheet(); },
  hostVenue: (el) => { const v = VENUES_BOOK.find((x) => x.id === el.dataset.id) || placeById(el.dataset.id); HOST.loc = { id: el.dataset.id, x: v.x, y: v.y, address: `${v.name}, ${addrOf(v.x, v.y)}`, photo: v.photo || null }; if (v.sports) HOST.sport = v.sports[0]; hostSheet(); },
  hostSport: (el) => { HOST.sport = el.dataset.id; hostSheet(); },
  hostDay: (el) => { HOST.d = +el.dataset.id; hostSheet(); },
  hostTime: (el) => { HOST.t = el.dataset.id; hostSheet(); },
  hostN: (el) => { const k = el.dataset.k, min = Math.max(2, HOST.joined || 0);
    if (k === 'players' && HOST.players + +el.dataset.d < min) { toast(`${HOST.joined} players have joined, so it can’t go below ${min}`, 'info'); return; }
    HOST[k] = k === 'fee' ? Math.max(0, Math.min(1000, HOST.fee + +el.dataset.d)) : Math.max(min, Math.min(30, HOST.players + +el.dataset.d)); hostSheet(); },
  hostEdit: (el) => hostEdit(el.dataset.id),
  hostCancel: (el) => { const a = actById(el.dataset.id), n = a.total - spotsLeft(a);
    sheet(`${head(`Delete ${esc(a.title)}?`, `${dayLabel(a.d)} ${fmtT(a.d, a.t)} · ${esc(a.venue.split(',')[0])}`)}
      <div class="muted" style="font-size:14px">${n ? `${n} player${n > 1 ? 's have' : ' has'} joined. They’ll get a cancellation notice${a.price ? ' and a full UPI refund' : ''}.` : 'No one has joined yet.'} The game comes off the map.${can.pin() ? '' : ' You can host a new game straight after.'}</div>
      <div style="display:flex;gap:10px"><button class="pill soft" style="flex:1" data-act="close">Keep it</button><button class="pill danger-fill" style="flex:1" data-act="hostCancelGo" data-id="${a.id}">${ic('trash-2')}Delete</button></div>`); },
  hostCancelGo: (el) => { const a = actById(el.dataset.id), n = a.total - spotsLeft(a); deleteHosted([a.id]); if (HOST && HOST.id === a.id) HOST = null; if (focused === a.id) focused = null; closeSheet();
    if (tab === 'games') renderGames(); else if (tab === 'play') renderPlay(); toast(`${a.title} deleted${n ? `. ${n} player${n > 1 ? 's were' : ' was'} told${a.price ? ' and refunded' : ''}` : ''}`, 'trash-2'); },
  hostVis: (el) => { HOST.vis = el.dataset.id; hostSheet(); },
  hostInv: (el) => { const id = el.dataset.id; HOST.invites = HOST.invites.includes(id) ? HOST.invites.filter((x) => x !== id) : HOST.invites.concat(id); hostSheet(); },
  hostPublish: () => publishHost(),
  postSpots: (el) => { if (!can.pin() && activeHosted().length) { hostLimitSheet(); return; } const b = S.turf.find((x) => x.id === el.dataset.id), v = VB(b.vid);
    HOST = hostFresh({ id: v.id, x: v.x, y: v.y, address: `${v.name}, ${addrOf(v.x, v.y)}` }); Object.assign(HOST, { sport: v.sports[0], d: b.d, t: pad2(b.start) + ':00', mins: b.dur * 60, players: Math.max(2, b.players - 1), fee: Math.ceil((b.dur * v.peak) / b.players / 10) * 10, title: `Open spots at ${v.name}` }); hostSheet(); },
  newTeam: () => { if (!can.teams() && myTeams().length) { const t = myTeams()[0];
      sheet(`${head('Lite includes one team', `You already have ${esc(t.name)}`)}<div class="muted" style="font-size:14px">Delete it to create a different team, or get Pro for as many teams as you like, in every sport.</div>
        <div class="two"><button class="pill soft danger" data-act="teamDelete" data-id="${t.id}">${ic('trash-2')}Delete ${esc(t.name)}</button><button class="pill" data-act="subscribe" data-id="pro" data-period="yearly">Get Pro</button></div>`); return; }
    NT = { name: '', sport: can.teams() ? 'football' : 'cricket', priv: 'Invite only' }; newTeamSheet(); },
  teamEdit: (el) => { const t = teamOf(el.dataset.id); NT = { id: t.id, name: t.name, sport: t.sport, was: t.sport, priv: t.privacy }; newTeamSheet(); },
  teamDelete: (el) => { const t = teamOf(el.dataset.id);
    sheet(`${head(`Delete ${esc(t.name)}?`, `${t.members.length} member${t.members.length === 1 ? '' : 's'} will be told the team has closed.`)}<div class="muted" style="font-size:14px">The roster, lineup and team chat are removed. This can’t be undone.${can.teams() ? '' : ' You can create a new team straight after.'}</div>
      <div style="display:flex;gap:10px"><button class="pill soft" style="flex:1" data-act="close">Keep it</button><button class="pill danger-fill" style="flex:1" data-act="teamDeleteGo" data-id="${t.id}">${ic('trash-2')}Delete</button></div>`); },
  teamDeleteGo: (el) => { const t = teamOf(el.dataset.id); S.teams = S.teams.filter((x) => x.id !== t.id); delete S.tm[t.id]; TV = null; picking = null; save(); closeSheet(); renderTeam();
    toast(can.teams() ? `${t.name} deleted` : `${t.name} deleted. You can create a new team`, 'trash-2'); },
  ntSport: (el) => { NT.sport = el.dataset.id; newTeamSheet(); },
  ntPriv: (el) => { NT.priv = el.dataset.id; newTeamSheet(); },
  ntCreate: () => { const e = $('#ntErr'), name = NT.name.trim(), fail = (m) => { e.hidden = false; e.lastElementChild.textContent = m; };
    if (!name) return fail('Give your team a name.');
    if (S.teams.some((x) => x.id !== NT.id && x.name.toLowerCase() === name.toLowerCase())) return fail('You already have a team with that name.');
    if (NT.id) { const t = teamOf(NT.id); if (t.sport !== NT.sport) { delete S.tm[t.id]; picking = null; } Object.assign(t, { name, sport: NT.sport, privacy: NT.priv }); NT = null; save(); closeSheet(); renderTeam(); toast('Team updated. Teammates were told', 'check'); return; }
    if (!can.teams() && myTeams().length) return fail('Lite includes one team. Delete your current team first.');
    const t = { id: 't' + Date.now(), mine: true, name, sport: NT.sport, color: TEAM_COLORS[S.teams.length % TEAM_COLORS.length], privacy: NT.priv, members: [{ name: 'Arjun Mehta', role: 'Captain', status: 'yes' }], next: null };
    S.teams.push(t); save(); NT = null; TV = t.id; teamTab = 'roster'; renderTeam(); openAddPlayers(t.id, true); },
  openTeam: (el) => openTeam(el.dataset.id),
  teamBack: () => { TV = null; picking = null; renderTeam(); },
  backToCompany: () => { S.corpPersonal = false; TV = null; save(); renderTeam(); },
  teamTab: (el) => { teamTab = el.dataset.id; renderTeamView(); },
  tVote: (el) => { const t = teamOf(TV); t.members[0].status = el.dataset.id; save(); renderTeamView(); },
  tNudge: () => toast('Reminder sent to everyone who hasn’t replied', 'send'),
  tCap: (el) => { tmOf(teamOf(TV)).cap = +el.dataset.i; save(); renderTeamView(); },
  tPick: (el) => { const M = tmOf(teamOf(TV)), i = +el.dataset.i; M.picks = M.picks.includes(i) ? M.picks.filter((x) => x !== i) : M.picks.concat(i); save(); renderTeamView(); },
  tShareLineup: () => { const t = teamOf(TV), M = tmOf(t), names = t.sport === 'cricket' ? Object.entries(M.lineup).map(([p, n]) => `${n} (${p})`) : M.picks.map((i) => t.members[i].name);
    shareAny(`${t.name} lineup`, `${t.name}${t.next ? ' v ' + t.next.vs : ''}: ${names.length ? names.join(', ') : 'lineup to be confirmed'}.`, teamLink(t)); },
  tSchedule: () => { SCH = null; scheduleSheet(); },
  schDay: (el) => { SCH.d = +el.dataset.id; scheduleSheet(); },
  schTime: (el) => { SCH.t = el.dataset.id; scheduleSheet(); },
  schVenue: (el) => { SCH.venue = el.dataset.id; scheduleSheet(); },
  schSave: () => { if (!SCH.vs.trim()) { toast('Add the opponent’s name', 'info'); return; } const t = teamOf(TV); t.next = { vs: SCH.vs.trim(), d: SCH.d, t: SCH.t, venue: SCH.venue }; t.members.forEach((m, i) => { if (i && m.status !== 'invited') m.status = 'maybe'; }); SCH = null; save(); closeSheet(); renderTeamView(); toast('Match saved. The team was asked who’s in', 'calendar-days'); },
  pick: (el) => { picking = picking === el.dataset.id ? null : el.dataset.id; renderTeamView(); },
  pos: (el) => { const M = tmOf(teamOf(TV)), n = el.dataset.id;
    if (M.lineup[n]) { delete M.lineup[n]; save(); renderTeamView(); return; }
    if (!picking) { toast('Pick a player from the bench first', 'info'); return; }
    M.lineup[n] = picking; picking = null; save(); buzz(10); renderTeamView(); },
  say: (el) => { tmOf(teamOf(TV)).chat.push(['You', el.dataset.id]); save(); renderTeamView(); const c = $('.chat'); if (c) c.lastElementChild.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'nearest' }); },
  addPlayers: (el) => openAddPlayers(el.dataset.id),
  apToggle: (el) => { const id = el.dataset.id; AP.sel = AP.sel.includes(id) ? AP.sel.filter((x) => x !== id) : AP.sel.concat(id); apSheet(); },
  apSport: (el) => { AP.sport = el.dataset.id; apSheet(); },
  apKm: (el) => { AP.km = el.dataset.id; apSheet(); },
  apLft: () => { AP.lft = !AP.lft; apSheet(); },
  apAdd: () => { const t = teamOf(AP.tid), add = PLAYERS.filter((p) => AP.sel.includes(p.id)); add.forEach((p) => t.members.push({ name: p.name, role: 'Player', status: 'invited', pid: p.id }));
    const n = add.length; AP = null; save(); closeSheet(); TV = t.id; teamTab = 'roster'; renderTeam(); toast(`${n} player${n > 1 ? 's' : ''} invited. They’ll get a notification`, 'user-plus'); badgeCheck(); },
  shareTeam: (el) => { const t = teamOf(el.dataset.id); shareAny(`Join ${t.name} on Splayer`, `Join my ${sp(t.sport).name.toLowerCase()} team ${t.name} on Splayer. Team code ${teamCode(t)}.`, teamLink(t)); },
});
