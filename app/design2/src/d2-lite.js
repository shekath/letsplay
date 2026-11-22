/* ═════ LITE: filters · registration · waitlist · My games · family calendar · notifications · shop · settings ═════ */

/* ── Filters ── */
const ADV0 = { when: 'any', time: 'any', km: 'any', price: 'any', level: 'any', ages: 'any', setting: 'any', access: false };
function adv() { if (!S.adv) S.adv = Object.assign({}, ADV0); return S.adv; }
function advCount() { const f = adv(); return Object.keys(ADV0).filter((k) => f[k] !== ADV0[k]).length; }
const isAccessible = (a) => /step-free|ramp|lift|level access|hoist|accessible/i.test(a.access || '');
function ageRange(s) {
  if (!s || /all/i.test(s)) return [0, 120];
  const m = s.match(/(\d+)\s*[–-]\s*(\d+)/); if (m) return [+m[1], +m[2]];
  const p = s.match(/(\d+)\+/); return p ? [+p[1], 120] : [0, 120];
}
function advPass(a) {
  const f = adv(), h = +a.t.split(':')[0], lv = (a.level || '').toLowerCase(), open = /all/.test(lv), [lo, hi] = ageRange(a.ages);
  if (f.when === 'today' && a.d !== 0) return false;
  if (f.when === 'tomorrow' && a.d !== 1) return false;
  if (f.when === 'weekend') { const wd = dateAt(a.d, '12:00').getDay(); if (wd !== 0 && wd !== 6) return false; }
  if (f.time === 'morning' && h >= 12) return false;
  if (f.time === 'afternoon' && (h < 12 || h >= 17)) return false;
  if (f.time === 'evening' && h < 17) return false;
  if (f.km !== 'any' && km(a.x, a.y) > +f.km) return false;
  if (f.price === 'free' && a.price > 0) return false;
  if ((f.price === '200' || f.price === '500') && a.price > +f.price) return false;
  if (f.level !== 'any' && !(open || lv.includes(f.level) || (f.level === 'advanced' && /competitive/.test(lv)))) return false;
  if (f.ages === 'kids' && lo > 12) return false;
  if (f.ages === 'adults' && hi < 18) return false;
  if (f.setting !== 'any' && a.setting !== f.setting) return false;
  if (f.access && !isAccessible(a)) return false;
  return true;
}
function advSheet() {
  const f = adv(), n = games().length;
  const grp = (key, label, opts) => `<div class="fgrp"><b>${label}</b><div class="chips wrap">${opts.map(([v, l]) => `<button class="chip neutral" data-act="advSet" data-k="${key}" data-id="${v}" aria-pressed="${String(f[key]) === String(v)}">${l}</button>`).join('')}</div></div>`;
  sheet(`${head('Filters', 'Narrow down games near you')}
    ${grp('when', 'Day', [['any', 'Any day'], ['today', 'Today'], ['tomorrow', 'Tomorrow'], ['weekend', 'This weekend']])}
    ${grp('time', 'Time', [['any', 'Any time'], ['morning', 'Morning'], ['afternoon', 'Afternoon'], ['evening', 'Evening']])}
    ${grp('km', 'Distance', [['any', 'Any'], ['1', 'Within 1 km'], ['2', 'Within 2 km'], ['3', 'Within 3 km']])}
    ${grp('price', 'Fee', [['any', 'Any fee'], ['free', 'Free'], ['200', 'Up to ₹200'], ['500', 'Up to ₹500']])}
    ${grp('level', 'Ability', [['any', 'Any level'], ['beginner', 'Beginner'], ['intermediate', 'Intermediate'], ['advanced', 'Advanced']])}
    ${grp('ages', 'Who’s playing', [['any', 'Anyone'], ['kids', 'Kids (under 13)'], ['adults', 'Adults']])}
    ${grp('setting', 'Setting', [['any', 'Indoor or outdoor'], ['Indoor', 'Indoor'], ['Outdoor', 'Outdoor']])}
    ${rowHTML({ act: 'advAccess', pressed: f.access, icon: 'accessibility', title: 'Step-free access', sub: 'Ramps, lifts or level entry and accessible washrooms', end: `<span class="tickbox">${ic('check')}</span>` })}
    <div style="display:flex;gap:10px"><button class="pill soft" data-act="advReset">Reset</button><button class="pill" style="flex:1" data-act="close" ${n ? '' : 'disabled'}>${n ? `Show ${n} game${n === 1 ? '' : 's'}` : 'No games match. Try fewer filters'}</button></div>`);
}
function advChanged() { save(); renderPlay(); advSheet(); }

/* ── Registration: who's playing → details → consent → payment. Nothing is lost if the sheet closes. ── */
let REG = null;
const STEP_LABEL = { who: 'Who’s playing', details: 'Details and emergency contact', consent: 'Consent', pay: 'Payment' };
const regSteps = (a) => ['who', 'details', 'consent'].concat(a.price ? ['pay'] : []);
const ageOk = (a, f) => { const [lo, hi] = ageRange(a.ages); return f.age >= lo && f.age <= hi; };
function profiles() { if (!S.profiles) S.profiles = clone(PROFILES); (S.family || []).forEach((f) => { if (!S.profiles[f.id]) S.profiles[f.id] = { phone: '', ecName: 'Arjun Mehta (parent)', ecPhone: '98765 43210', medical: '' }; }); return S.profiles; }
function regStart(id) {
  const a = actById(id);
  if (spotsLeft(a) === 0 && !S.joined.includes(id)) { waitlistSheet(a); return; }
  if (!REG || REG.aid !== id) {
    const elig = family().filter((f) => ageOk(a, f));
    REG = { aid: id, step: 0, who: elig.length ? [elig[0].id] : [], d: clone(profiles()), keep: true, c: { conduct: false, guardian: false, photo: true }, failed: false, failNext: false, resumed: false, err: '' };
  } else { REG.resumed = REG.step > 0; REG.err = ''; }
  regRender();
}
function regRender() {
  const a = actById(REG.aid), steps = regSteps(a), st = steps[REG.step], minors = REG.who.filter((id) => famById(id).age < 18);
  let body = '';
  if (st === 'who') {
    body = `<div class="opts">${family().map((f) => { const ok = ageOk(a, f); return `<button class="opt" data-act="regWho" data-id="${f.id}" aria-pressed="${REG.who.includes(f.id)}" ${ok ? '' : 'disabled'}>${avatar(f.name)}<span class="ltext"><b>${esc(f.name)}</b><small>${ok ? esc(f.note) : `Not eligible · ages ${a.ages} only`}</small></span><span class="tickbox">${ic('check')}</span></button>`; }).join('')}</div>
      <button class="pill sm soft" style="justify-self:start" data-act="addFamily" data-id="reg">${ic('plus')}Add family member</button>`;
  } else if (st === 'details') {
    body = REG.who.map((id) => { const f = famById(id), p = REG.d[id]; return `<div class="card fcard"><div style="display:flex;gap:10px;align-items:center">${avatar(f.name)}<b>${esc(f.name)}</b><span class="okchip">${ic('check')}Saved details</span></div>
      ${f.age >= 18 ? `<label class="fld"><span>Mobile number</span><input inputmode="tel" data-r="d.${id}.phone" value="${esc(p.phone)}" placeholder="10-digit mobile"></label>` : ''}
      <div class="two"><label class="fld"><span>Emergency contact</span><input data-r="d.${id}.ecName" value="${esc(p.ecName)}" placeholder="Name (relation)"></label><label class="fld"><span>Their phone</span><input inputmode="tel" data-r="d.${id}.ecPhone" value="${esc(p.ecPhone)}" placeholder="10 digits"></label></div>
      <label class="fld"><span>Medical notes for the coach (optional)</span><input data-r="d.${id}.medical" value="${esc(p.medical)}" placeholder="Allergies, asthma, injuries"></label></div>`; }).join('')
      + `<label class="check"><input type="checkbox" data-r="keep" ${REG.keep ? 'checked' : ''}><span>Save these details for next time</span></label>`;
  } else if (st === 'consent') {
    body = `<label class="check"><input type="checkbox" data-r="c.conduct" ${REG.c.conduct ? 'checked' : ''}><span><b>Code of conduct and cancellation policy</b><br>I agree to ${esc(a.host)}’s code of conduct. ${esc(a.cancel || 'Free cancellation up to 2 hours before.')}</span></label>
      ${minors.length ? `<label class="check"><input type="checkbox" data-r="c.guardian" ${REG.c.guardian ? 'checked' : ''}><span><b>Parent or guardian consent</b><br>I’m the parent or guardian of ${minors.map(firstName).join(' and ')} and agree to them taking part.</span></label>` : ''}
      <label class="check"><input type="checkbox" data-r="c.photo" ${REG.c.photo ? 'checked' : ''}><span><b>Photos (optional)</b><br>The host may take photos for the club’s page.</span></label>
      <div class="faint" style="font-size:13px;display:flex;gap:6px">${ic('shield-check')}Emergency contacts and medical notes are shared only with the host and coach.</div>`;
  } else {
    const n = REG.who.length;
    body = `${REG.failed ? `<div class="errbox" role="alert">${ic('info')}<div><b>Payment didn’t go through</b><br>No money was taken. Your details are saved, so try again or pick another UPI app.</div></div>` : ''}
      <div class="sum card"><div><span class="muted">${esc(a.title)} · ${money(a.price)} × ${n}</span><span class="num">${money(a.price * n)}</span></div><div><span class="muted">Booking fee</span><span class="num">₹0</span></div><div class="total"><span>Total</span><span class="num">${money(a.price * n)}</span></div></div>
      <div style="display:grid;gap:8px"><b style="font-size:14px">Pay via UPI</b>${upiChips('regApp')}</div>
      <button class="linkbtn" data-act="regFail">Test a failed payment</button>`;
  }
  const last = REG.step === steps.length - 1;
  sheet(`${head('Join game', `${esc(a.title)} · ${when(a)}`)}
    <div class="steps" aria-hidden="true">${steps.map((s, i) => `<i class="${i < REG.step ? 'done' : i === REG.step ? 'cur' : ''}"></i>`).join('')}</div>
    <div class="eyebrow">Step ${REG.step + 1} of ${steps.length} · ${STEP_LABEL[st]}</div>
    ${REG.resumed ? `<div class="faint" style="font-size:13px;display:flex;gap:6px;align-items:center">${ic('rotate-ccw')}Picked up where you left off. Nothing you entered was lost.</div>` : ''}
    ${body}
    <div class="errbox" id="regErr" role="alert" ${REG.err ? '' : 'hidden'}>${ic('info')}<div>${esc(REG.err)}</div></div>
    <div style="display:flex;gap:10px">${REG.step ? '<button class="pill soft" data-act="regBack">Back</button>' : ''}<button class="pill" style="flex:1;min-height:56px" data-act="regNext" id="regGo">${last ? (a.price ? `${ic('smartphone')}Pay ${money(a.price * REG.who.length)} via UPI` : `${ic('check')}Confirm`) : 'Continue'}</button></div>`);
}
function regValidate(st) {
  const digits = (s) => (s || '').replace(/\D/g, '');
  if (st === 'who' && !REG.who.length) return 'Choose at least one person to register.';
  if (st === 'details') for (const id of REG.who) {
    const p = REG.d[id], nm = firstName(id);
    if (famById(id).age >= 18 && digits(p.phone).length !== 10) return `Enter a 10-digit mobile number for ${nm}.`;
    if (!p.ecName.trim()) return `Add an emergency contact for ${nm}.`;
    if (digits(p.ecPhone).length !== 10) return `Enter a 10-digit phone number for ${nm}’s emergency contact.`;
  }
  if (st === 'consent') {
    if (!REG.c.conduct) return 'Tick the code of conduct to continue.';
    if (REG.who.some((id) => famById(id).age < 18) && !REG.c.guardian) return 'Parent or guardian consent is needed for players under 18.';
  }
  return '';
}
function regNext() {
  const a = actById(REG.aid), steps = regSteps(a), st = steps[REG.step], err = regValidate(st);
  if (err) { REG.err = err; const e = $('#regErr'); e.hidden = false; e.lastElementChild.textContent = err; return; }
  REG.err = ''; REG.resumed = false;
  if (REG.step < steps.length - 1) { REG.step++; regRender(); return; }
  if (st === 'pay') { const b = $('#regGo'); b.disabled = true; b.innerHTML = `${ic('smartphone')}Waiting for ${pickedUpi('regApp')}…`;
    setTimeout(() => { if (REG.failNext) { REG.failNext = false; REG.failed = true; regRender(); } else regFinish(); }, 1100); return; }
  regFinish();
}
function regFinish() {
  const a = actById(REG.aid), who = REG.who.slice();
  if (REG.keep) S.profiles = clone(REG.d);
  if (!S.joined.includes(a.id)) S.joined.push(a.id);
  S.bookings[a.id] = Array.from(new Set((S.bookings[a.id] || []).concat(who)));
  S.taken[a.id] = (S.taken[a.id] || 0) + who.length;
  notes().unshift({ id: 'n' + Date.now(), pri: 'info', cat: 'booking', icon: 'circle-check', when: 'Just now', ref: a.id, title: `Booked: ${a.title}`, body: `${who.map(firstName).join(' and ')} ${who.length > 1 ? 'are' : 'is'} in for ${when(a)}. A reminder comes 2 hours before.`, actions: [['View game', 'view']], read: false, done: false });
  REG = null; celebrateJoin(a.id, who);
}
function waitlistSheet(a) {
  const on = S.waitlist.includes(a.id);
  sheet(`${head(on ? 'You’re on the waitlist' : 'This game is full', `${esc(a.title)} · ${when(a)}`)}
    <div class="xp-burst"><span class="up-ic">${ic('timer')}</span><h2 class="num">${on ? '#3 in line' : '2 ahead of you'}</h2><div class="muted" style="max-width:32ch">If a place opens, we hold it for you for 30 minutes and send a notification. You only pay if you take it.</div></div>
    ${on ? `<button class="pill block soft" data-act="waitLeave" data-id="${a.id}">Leave the waitlist</button>` : `<button class="pill block" data-act="waitJoin" data-id="${a.id}">${ic('timer')}Join the waitlist</button>`}
    <button class="pill block soft" data-act="similar" data-id="${a.id}">${ic('search')}Find similar games</button>`);
}
function addFamilySheet(ret) {
  sheet(`${head('Add a family member', 'Book games for them from your account')}
    <label class="fld"><span>Full name</span><input id="famName" placeholder="For example Diya Mehta" autocomplete="off"></label>
    <label class="fld"><span>Age</span><input id="famAge" inputmode="numeric" placeholder="Years"></label>
    <div class="faint" style="font-size:13px">For under-18s you give guardian consent when you book. Their details stay on your account.</div>
    <div class="errbox" id="famErr" hidden>${ic('info')}<div></div></div>
    <button class="pill block" data-act="famSave" data-id="${ret || ''}">Add to family</button>`);
}

/* ── Notifications: what changed, what it means, what to do ── */
function notes() { if (!S.notes) S.notes = NOTE_SEED.map((n) => Object.assign({ read: false, done: false }, n)); return S.notes; }
function prefs() { if (!S.notePrefs) S.notePrefs = { club: true, promo: true, recs: true }; return S.notePrefs; }
const noteVisible = (n) => !(n.cat === 'club' && !prefs().club) && !(n.cat === 'promo' && !prefs().promo) && !(n.cat === 'recs' && !prefs().recs);
const unread = () => notes().filter((n) => !n.read && noteVisible(n)).length;
function bellHTML() { const n = unread(); return `<button class="bell" data-act="notes" aria-label="Notifications${n ? ', ' + n + ' unread' : ''}">${ic('bell')}${n ? `<i class="tcount num">${n}</i>` : ''}</button>`; }
let noteTab = 'all';
function notesSheet() {
  const list = notes().filter(noteVisible).filter((n) => noteTab === 'all' || (noteTab === 'action' ? n.pri === 'urgent' || n.pri === 'action' : n.pri === 'info' || n.pri === 'promo'));
  const cnt = notes().filter((n) => noteVisible(n) && !n.done && (n.pri === 'urgent' || n.pri === 'action')).length;
  sheet(`<div class="sheet-head"><div><h2>Notifications</h2></div><div style="display:flex;gap:8px"><button class="x" data-act="notePrefs" aria-label="Notification settings">${ic('settings')}</button><button class="x" data-act="close" aria-label="Close">${ic('x')}</button></div></div>
    <div class="seg" role="group" aria-label="Filter notifications"><button data-act="noteTab" data-id="all" aria-pressed="${noteTab === 'all'}">All</button><button data-act="noteTab" data-id="action" aria-pressed="${noteTab === 'action'}">To do${cnt ? ` · ${cnt}` : ''}</button><button data-act="noteTab" data-id="updates" aria-pressed="${noteTab === 'updates'}">Updates</button></div>
    ${list.length ? list.map((n) => `<div class="ntf pri-${n.pri} ${n.done ? 'done' : ''} ${n.read ? '' : 'unread'}"><span class="ltile">${ic(n.icon)}</span>
      <div style="min-width:0;display:grid;gap:6px;flex:1"><div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline"><b>${esc(n.title)}</b><span class="faint" style="font-size:12px;white-space:nowrap">${esc(n.when)}</span></div>
        <span class="muted" style="font-size:14px">${esc(n.body)}</span>
        ${n.done ? `<span class="okchip">${ic('check')}${esc(n.done)}</span>` : `<div style="display:flex;gap:8px;flex-wrap:wrap">${n.actions.map(([l, k], i) => `<button class="pill sm ${i ? 'soft' : ''}" data-act="noteAct" data-id="${n.id}" data-do="${k}">${esc(l)}</button>`).join('')}</div>`}</div></div>`).join('') : `<div class="empty">${ic('bell')}<b>You’re all caught up</b></div>`}
    <div class="faint" style="font-size:12.5px">Cancellations, venue and time changes, payments and deadlines always reach you. Choose the rest in settings.</div>`);
  setTimeout(() => { notes().forEach((n) => (n.read = true)); save(); refreshBells(); }, 800);
}
function refreshBells() { $$('.bell').forEach((b) => (b.outerHTML = bellHTML())); renderTabbar(); }
function notePrefsSheet() {
  const P = prefs(), row = (k, t, d, locked) => rowHTML({ act: locked ? null : 'prefToggle', id: k, pressed: locked ? true : P[k], icon: locked ? 'lock' : 'bell', title: t, sub: d, end: `<span class="tickbox">${ic('check')}</span>` });
  sheet(`${head('Notification settings')}<div class="lrows">${row('x', 'Cancellations and changes', 'Venue, time and weather changes. Always on.', true)}${row('y', 'Payments and deadlines', 'Fees due and registration deadlines. Always on.', true)}
    ${row('club', 'Club news and coach updates', 'Kit lists and announcements from your clubs')}${row('recs', 'Suggestions near you', 'New games that match your sports')}${row('promo', 'Offers and deals', 'Marketplace and sponsor promotions')}</div>
    <button class="pill block" data-act="notes">Done</button>`);
}
function noteAct(id, k) {
  const n = notes().find((x) => x.id === id); if (!n) return;
  const res = { keep: 'Your spot is kept. We’ll update you at 5 am.', cancelSpot: 'Place cancelled. Refund on its way.', ack: 'Noted.', yes: 'You’re marked as playing.', no: 'Captain told you can’t make it.', snooze: 'We’ll remind you tomorrow.', pay: 'Paid ₹300 via UPI.' };
  if (k === 'view') { if (actById(n.ref)) openDetail(n.ref); return; }
  if (k === 'shop') { go('shop'); return; }
  if (k === 'company') { n.read = true; save(); closeSheet(); A.company(); return; }
  if (k === 'cancelSpot') { S.joined = S.joined.filter((x) => x !== n.ref); delete S.bookings[n.ref]; S.taken[n.ref] = Math.max(0, (S.taken[n.ref] || 1) - 1); }
  if (k === 'yes' || k === 'no') { const t = S.teams.find((x) => x.id === n.ref); if (t) t.members[0].status = k; }
  n.done = res[k] || 'Done'; n.read = true; save(); notesSheet(); renderTabbar(); toast(n.done, 'check');
  if (tab === 'games') renderGames();
}

/* ── My games: upcoming · family calendar · book a court ── */
function gamesHead() {
  const v = S.gamesView;
  return `<div class="head"><div><h1>My games</h1></div>${bellHTML()}</div>
    <div class="seg" role="group" aria-label="View" style="margin-bottom:14px"><button data-act="gamesView" data-id="upcoming" aria-pressed="${v === 'upcoming'}">Upcoming</button><button data-act="gamesView" data-id="family" aria-pressed="${v === 'family'}">Family${findClashes(famEvents()).length ? ' <i class="dotlive"></i>' : ''}</button><button data-act="gamesView" data-id="book" aria-pressed="${v === 'book'}">Book</button><button data-act="gamesView" data-id="hosting" aria-pressed="${v === 'hosting'}">Hosting</button></div>`;
}
function renderGames() { if (S.gamesView === 'book') renderBook(); else if (S.gamesView === 'family') renderFamily(); else if (S.gamesView === 'hosting') renderHosting(); else renderUpcoming(); }
function famEvents() {
  const ev = [];
  allActs().filter((a) => S.joined.includes(a.id)).forEach((a) => ev.push({ key: 'g' + a.id, ref: a.id, kind: 'game', title: a.title, d: a.d, t: a.t, mins: a.mins, venue: a.venue, who: S.bookings[a.id] || ['f0'], sport: a.sport }));
  S.hosted.filter((a) => !S.joined.includes(a.id)).forEach((a) => ev.push({ key: 'h' + a.id, ref: a.id, kind: 'host', title: a.title, d: a.d, t: a.t, mins: a.mins, venue: a.venue, who: ['f0'], sport: a.sport }));
  S.turf.forEach((b) => { const v = VB(b.vid); ev.push({ key: 't' + b.id, ref: b.id, kind: 'turf', title: v.name, d: b.d, t: pad2(b.start) + ':00', mins: b.dur * 60, venue: v.name, who: ['f0'], sport: v.sports[0] }); });
  (can.teams() ? S.teams : S.teams.filter((t) => t.mine)).forEach((t) => t.next && ev.push({ key: 'm' + t.id, ref: t.id, kind: 'team', title: `${t.name} v ${t.next.vs}`, d: t.next.d, t: t.next.t, mins: 120, venue: t.next.venue, who: ['f0'], sport: t.sport }));
  return ev.filter((e) => e.d >= 0 && e.d <= 6).sort((x, y) => x.d - y.d || toMin(x.t) - toMin(y.t));
}
function findClashes(ev) {
  const out = [];
  for (let i = 0; i < ev.length; i++) for (let j = i + 1; j < ev.length; j++) {
    const a = ev[i], b = ev[j]; if (a.d !== b.d) continue;
    const s1 = toMin(a.t), e1 = s1 + a.mins, s2 = toMin(b.t), e2 = s2 + b.mins, same = a.who.some((w) => b.who.includes(w));
    if (s1 < e2 && s2 < e1 && (same || a.venue.split(' · ')[0] !== b.venue.split(' · ')[0])) out.push({ a, b, from: fromMin(Math.max(s1, s2)), to: fromMin(Math.min(e1, e2)), same });
  }
  return out;
}
const fmtT = (d, t) => tf.format(dateAt(d, t));
const FAMC = { f0: '#5B3FE6', f1: '#D93065', f2: '#0A7CAE' };
const famColor = (id) => FAMC[id] || '#0C8353';
function evRow(e, clash) {
  const s = sp(e.sport), tagTxt = { turf: 'Court booking', team: 'Team match', host: 'You’re hosting' }[e.kind];
  return `<button class="evrow ${clash ? 'clashing' : ''}" style="--c:${s.c}" data-act="evOpen" data-kind="${e.kind}" data-id="${e.ref}">
    <span class="evtime num"><b>${fmtT(e.d, e.t)}</b><small>${fmtT(e.d, fromMin(toMin(e.t) + e.mins))}</small></span>
    <span class="ltext"><b>${esc(e.title)}</b><small>${tagTxt ? `<span class="evtag">${tagTxt}</span>` : ''}${clash ? '<span class="evtag live">Clash</span>' : ''}${esc(e.venue.split(' · ')[0])}</small></span>
    <span class="avs">${e.who.map((w) => `<i style="background:${famColor(w)}" title="${esc(firstName(w))}">${esc(firstName(w)[0])}</i>`).join('')}</span></button>`;
}
function renderUpcoming() {
  const ev = famEvents(), clashes = findClashes(ev), open = notes().filter((n) => !n.done && noteVisible(n) && (n.pri === 'urgent' || n.pri === 'action'));
  const next = ev.find((e) => dateAt(e.d, e.t) > Date.now());
  const mins = next ? Math.round((dateAt(next.d, next.t) - Date.now()) / 60000) : 0;
  const days = [...new Set(ev.map((e) => e.d))];
  $('#scr-games').innerHTML = `${gamesHead()}
    ${next ? `<button class="nexthero" style="--c:${sp(next.sport).c}" data-act="evOpen" data-kind="${next.kind}" data-id="${next.ref}"><span class="eyebrow" style="color:rgba(255,255,255,.85)">Up next${next.who[0] !== 'f0' || next.who.length > 1 ? ' · ' + next.who.map(firstName).join(', ') : ''}</span><h2>${esc(next.title)}</h2><span>${dayLabel(next.d)} · ${fmtT(next.d, next.t)} · ${esc(next.venue.split(' · ')[0])}</span><b class="count num">${mins < 60 ? mins + ' min' : mins < 1440 ? Math.floor(mins / 60) + ' h ' + (mins % 60) + ' min' : Math.floor(mins / 1440) + ' days'}<small>to go</small></b></button>` : ''}
    ${open.length || clashes.length ? `<div class="section"><h2>Needs you</h2><div class="lrows">${open.slice(0, 3).map((n) => rowHTML({ act: 'notes', icon: n.icon, c: n.pri === 'urgent' ? 'var(--live)' : null, title: esc(n.title), sub: esc(n.body.split('. ')[0]) + '.' })).join('')}
      ${clashes.length ? rowHTML({ act: 'gamesView', id: 'family', icon: 'calendar-days', c: 'var(--live)', title: `${clashes.length} clash${clashes.length > 1 ? 'es' : ''} in the family calendar`, sub: `${dayLabel(clashes[0].a.d)}: ${esc(clashes[0].a.title)} overlaps ${esc(clashes[0].b.title)}` }) : ''}</div></div>` : ''}
    ${days.length ? days.map((d) => `<div class="section"><h2>${dayLabel(d)} <span class="faint" style="font:600 13px var(--f-body)">${longFmt.format(dateAt(d, '12:00'))}</span></h2><div class="lrows">${ev.filter((e) => e.d === d).map((e) => evRow(e, clashes.some((c) => c.a.key === e.key || c.b.key === e.key))).join('')}</div></div>`).join('')
      : `<div class="empty section">${ic('calendar-days')}<b>Nothing booked this week</b><button class="pill sm" data-act="tab" data-id="play">Find a game</button></div>`}
    ${can.pin() || !activeHosted().length ? `<div class="section"><button class="pill block soft" data-act="hostStart">${ic('megaphone')}Host a game</button></div>` : ''}`;
}
function renderFamily() {
  const ev = famEvents(), who = S.calWho, day = S.calDay, clashes = findClashes(ev);
  const shown = ev.filter((e) => who === 'all' || e.who.includes(who)), dayEv = shown.filter((e) => e.d === day);
  const inClash = (e) => clashes.some((c) => c.a.key === e.key || c.b.key === e.key);
  $('#scr-games').innerHTML = `${gamesHead()}
    <div class="chips"><button class="chip neutral" data-act="calWho" data-id="all" aria-pressed="${who === 'all'}">${ic('users')}Everyone</button>${family().map((f) => `<button class="chip neutral" data-act="calWho" data-id="${f.id}" aria-pressed="${who === f.id}"><i class="dotc" style="background:${famColor(f.id)}"></i>${esc(firstName(f.id))}</button>`).join('')}</div>
    <div class="daypick">${[0, 1, 2, 3, 4, 5, 6].map((d) => { const dt = dateAt(d, '12:00'), ws = [...new Set(shown.filter((e) => e.d === d).flatMap((e) => e.who))]; return `<button data-act="calDay" data-id="${d}" aria-pressed="${day === d}">${wf.format(dt)}<b class="num">${dt.getDate()}</b><span class="dots">${ws.map((w) => `<i style="background:${famColor(w)}"></i>`).join('') || '<i style="opacity:0"></i>'}</span></button>`; }).join('')}</div>
    ${clashes.length ? clashes.map((c) => { const wa = c.a.who.map(firstName).join(' & '), wb = c.b.who.map(firstName).join(' & ');
      return `<div class="clash section" role="status">${ic('info')}<div style="display:grid;gap:6px;flex:1"><b>Clash on ${dayLabel(c.a.d)}, ${fmtT(c.a.d, c.from)}–${fmtT(c.a.d, c.to)}</b><span>${c.same ? `${wa} is booked in two places at once.` : `${wa} at ${esc(c.a.venue.split(' · ')[0])} and ${wb} at ${esc(c.b.venue.split(' · ')[0])}. One adult can’t do both drop-offs.`}</span>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="pill sm" data-act="clashSlot" data-id="${c.b.sport}">Find another slot</button><button class="pill sm soft" data-act="carpool" data-id="${esc(c.a.venue.split(' · ')[0])}" data-d="${c.a.d}">${ic('share-2')}Ask for a carpool</button></div></div></div>`; }).join('')
      : `<div class="section faint" style="font-size:13.5px;display:flex;gap:6px;align-items:center">${ic('circle-check')}No clashes this week.</div>`}
    <div class="section"><h2>${dayLabel(day)} <span class="faint" style="font:600 13px var(--f-body)">${longFmt.format(dateAt(day, '12:00'))}</span></h2>
      ${dayEv.length ? `<div class="lrows">${dayEv.map((e) => evRow(e, inClash(e))).join('')}</div>` : `<div class="empty">${ic('calendar-days')}<b>Nothing on ${dayLabel(day) === 'Today' ? 'today' : dayLabel(day)}</b><button class="pill sm soft" data-act="tab" data-id="play">Find something to play</button></div>`}</div>
    <div class="section"><button class="pill block soft" disabled>${ic('calendar')}Sync to phone calendar · coming soon</button></div>`;
}

/* ── Shop: deals, categories, product pages, bag and checkout, promote your business ── */
const memberOff = () => S.tier !== 'lite';
const unitPrice = (p) => (memberOff() ? Math.round(p.price * 0.9) : p.price);
const cartCount = () => S.cart.reduce((n, c) => n + c.qty, 0);
function renderShop() {
  const cats = [['all', 'All', 'layers'], ['equipment', 'Equipment', 'dumbbell'], ['footwear', 'Footwear', 'footprints'], ['apparel', 'Outfits', 'shirt'], ['accessories', 'Accessories', 'package'], ['deals', 'Deals', 'percent']];
  const q = S.shopQ.trim().toLowerCase();
  const list = PRODUCTS.filter((p) => (S.shopCat === 'all' || p.cat === S.shopCat || (S.shopCat === 'deals' && p.was)) && (!q || (p.name + ' ' + p.brand + ' ' + p.cat).toLowerCase().includes(q)));
  const n = cartCount();
  $('#scr-shop').innerHTML = `<div class="head"><div><h1>Shop</h1><div class="sub">Local sellers${memberOff() ? ' · <b style="color:var(--you-text)">10% off for you</b>' : ''}</div></div><button class="bell" data-act="cart" aria-label="Bag, ${n} item${n === 1 ? '' : 's'}">${ic('shopping-bag')}${n ? `<i class="tcount num">${n}</i>` : ''}</button></div>
    <label class="search">${ic('search')}<input id="shopQ" type="search" placeholder="Search balls, shoes, jerseys" value="${esc(S.shopQ)}" aria-label="Search products"></label>
    <div class="promos">
      <button class="promo" data-act="shopCat" data-id="apparel"><img src="${IMG}gym.jpg" alt=""><span class="ptag">Up to 30% off</span><h3>Monsoon kit drop</h3><p>Quick-dry jerseys and training outfits.</p></button>
      <button class="promo" data-act="promoCricket"><img src="${IMG}cricket2.jpg" alt=""><span class="sponsor">Sponsored</span><span class="ptag">Riverfront Sports Co.</span><h3>Flat 20% off cricket gear</h3><p>Bats, pads and helmets. Click and collect in 2 hours.</p></button>
      ${S.tier === 'lite' ? `<button class="promo dark" data-act="plans"><span class="ptag">${ic('zap')}Pro</span><h3>Pro saves 10%</h3><p>On every order, plus free delivery over ${inr(FREE_DELIVERY)}.</p></button>` : ''}
    </div>
    <div class="chips" style="margin-top:16px">${cats.map(([k, l, i]) => `<button class="chip neutral" data-act="shopCat" data-id="${k}" aria-pressed="${S.shopCat === k}">${ic(i)}${l}</button>`).join('')}</div>
    <div class="section">${list.length ? `<div class="pgrid">${list.map((p) => `<button class="prod" data-act="product" data-id="${p.id}"><span class="pimg"><img src="${IMG + p.img}.jpg" alt="" loading="lazy">${p.was ? `<span class="ptag">−${Math.round((1 - p.price / p.was) * 100)}%</span>` : ''}</span>
        <span class="faint" style="font-size:12px;font-weight:700">${esc(p.brand)}</span><b class="pname">${esc(p.name)}</b><span class="pprice num"><b>${inr(unitPrice(p))}</b>${p.was || memberOff() ? `<s>${inr(p.was || p.price)}</s>` : ''}</span><span class="faint num" style="font-size:12px">${ic('star')}${p.rating} · ${p.reviews}</span></button>`).join('')}</div>`
      : `<div class="empty">${ic('search')}<b>No gear matches “${esc(S.shopQ)}”</b><button class="pill sm soft" data-act="shopClear">Clear search</button></div>`}
      <div class="faint" style="font-size:12.5px">Sample products, sellers, prices and ratings.</div></div>
    ${can.org() ? `<div class="section">${rowHTML({ act: 'bulkKits', icon: 'shirt', c: 'var(--you)', title: `Team kits for ${ORG.name}`, sub: `Printed jerseys for all ${ORG.teams.length} department teams, one invoice` })}</div>` : ''}
    <div class="section">${rowHTML({ act: 'promote', icon: 'megaphone', title: 'Promote your business', sub: 'Featured map pins, shop banners and event sponsorship' })}</div>`;
  const qi = $('#shopQ'); qi.addEventListener('input', () => { S.shopQ = qi.value; const pos = qi.selectionStart; renderShop(); const n2 = $('#shopQ'); n2.focus(); n2.setSelectionRange(pos, pos); });
}
let PS = null;
function productSheet(id) {
  const p = PRODUCTS.find((x) => x.id === id); PS = PS && PS.id === id ? PS : { id, size: p.sizes ? p.sizes[Math.min(2, p.sizes.length - 1)] : null, qty: 1 };
  sheet(`<div class="pimg big"><img src="${IMG + p.img}.jpg" alt=""><button class="x" data-act="close" aria-label="Close" style="position:absolute;right:12px;top:12px">${ic('x')}</button></div>
    <div><div class="faint" style="font-size:13px;font-weight:700">${esc(p.brand)} · sold by ${esc(p.seller)}</div><h2>${esc(p.name)}</h2><div class="faint num" style="font-size:13px;margin-top:4px">${ic('star')} ${p.rating} · ${p.reviews} reviews</div></div>
    <div class="pprice num" style="font-size:20px"><b>${inr(unitPrice(p))}</b>${p.was || memberOff() ? `<s>${inr(p.was || p.price)}</s>` : ''}${memberOff() ? '<span class="save-tag">Member price</span>' : ''}</div>
    ${p.sizes ? `<div class="fgrp"><b>Size</b><div class="chips wrap">${p.sizes.map((s) => `<button class="chip neutral" data-act="pSize" data-id="${s}" aria-pressed="${PS.size === s}">${s}</button>`).join('')}</div></div>` : ''}
    <div style="display:flex;justify-content:space-between;align-items:center"><b>Quantity</b><div class="stepper"><button data-act="pQty" data-d="-1" aria-label="One fewer">${ic('minus')}</button><b class="num">${PS.qty}</b><button data-act="pQty" data-d="1" aria-label="One more">${ic('plus')}</button></div></div>
    <div class="faint" style="font-size:13px">${ic('truck')} Delivery in 2 days. Free over ${inr(FREE_DELIVERY)}. Easy 7-day returns.</div>
    <button class="pill block" style="min-height:56px" data-act="addCart">${ic('shopping-bag')}Add to bag · ${inr(unitPrice(p) * PS.qty)}</button>`);
}
function cartSheet() {
  const items = S.cart.map((c) => ({ c, p: PRODUCTS.find((x) => x.id === c.id) })), sub = items.reduce((n, { c, p }) => n + unitPrice(p) * c.qty, 0);
  const del = sub >= FREE_DELIVERY || !sub ? 0 : DELIVERY_FEE;
  sheet(`${head('Your bag', items.length ? `${cartCount()} item${cartCount() === 1 ? '' : 's'}` : '')}
    ${items.length ? `<div class="lrows">${items.map(({ c, p }, i) => `<div class="lrow"><span class="ltile img"><img src="${IMG + p.img}.jpg" alt=""></span><span class="ltext"><b>${esc(p.name)}</b><small>${c.size ? esc(c.size) + ' · ' : ''}${inr(unitPrice(p))} each</small></span><div class="stepper sm"><button data-act="cartQty" data-i="${i}" data-d="-1" aria-label="One fewer">${ic('minus')}</button><b class="num">${c.qty}</b><button data-act="cartQty" data-i="${i}" data-d="1" aria-label="One more">${ic('plus')}</button></div></div>`).join('')}</div>
      <div class="sum card"><div><span class="muted">Items</span><span class="num">${inr(sub)}</span></div><div><span class="muted">Delivery</span><span class="num">${del ? inr(del) : 'Free'}</span></div>${del ? `<div class="faint"><span>Add ${inr(FREE_DELIVERY - sub)} more for free delivery</span><span></span></div>` : ''}<div class="total"><span>Total</span><span class="num">${inr(sub + del)}</span></div></div>
      <div style="display:grid;gap:8px"><b style="font-size:14px">Pay via UPI</b>${upiChips('cartApp')}</div>
      <button class="pill block" style="min-height:56px" data-act="payCart" id="cartGo">${ic('smartphone')}Pay ${inr(sub + del)}</button>`
      : `<div class="empty">${ic('shopping-bag')}<b>Your bag is empty</b><button class="pill sm" data-act="close">Keep browsing</button></div>`}`);
}
function promoteSheet() {
  const pk = [['map-pin', 'Featured map pin', 'Your store or venue highlighted on the map within 5 km.', '₹2,999/week'], ['megaphone', 'Shop banner', 'A banner slot in the marketplace carousel.', '₹5,999/week'], ['trophy', 'Event sponsorship', 'Brand a league, tournament or run club.', 'Custom']];
  sheet(`${head('Promote your business', 'Reach active players near you')}
    <div class="opts">${pk.map(([i, t, d, p], n) => `<button class="opt" data-act="toggleMe" aria-pressed="${n === 0}"><span class="ltile">${ic(i)}</span><span class="ltext"><b>${t}</b><small>${d}</small><small class="num" style="color:var(--ink);font-weight:800">${p}</small></span><span class="tickbox">${ic('check')}</span></button>`).join('')}</div>
    <div class="faint" style="font-size:12.5px">Example packages and pricing.</div>
    <button class="pill block" data-act="doneToast" data-id="Thanks! Our partnerships team will call you within a day">Request a call back</button>`);
}

/* ── Me: family, payments, notifications, accessibility ── */
function meSettingsHTML() {
  return `<div class="section"><h2>Family and settings</h2><div class="lrows">
    ${rowHTML({ act: 'familySheet', icon: 'users', title: 'Family profiles', sub: family().map((f) => esc(firstName(f.id))).join(', ') })}
    ${rowHTML({ act: 'sportsList', icon: 'g-carrom', title: 'Your sports', sub: can.pin() ? (customSports().length ? customSports().map((c) => esc(c.name)).join(', ') : 'Add carrom, table tennis and more') : 'Add your own sports with Pro' })}
    ${rowHTML({ act: 'gamesView', id: 'hosting', icon: 'megaphone', title: 'Games you host', sub: `${S.hosted.filter((a) => a.hostedByYou && a.d >= 0).length} upcoming · ${S.hosted.filter((a) => a.hostedByYou && a.d < 0).length} finished${can.pin() ? '' : ' · one at a time on Lite'}` })}
    ${rowHTML({ act: 'paySheet', icon: 'wallet', title: 'Payments', sub: `UPI · ${S.payApp} by default` })}
    ${rowHTML({ act: 'notePrefs', icon: 'bell', title: 'Notifications', sub: 'Choose updates, offers and suggestions' })}
    ${rowHTML({ act: 'bigText', icon: 'accessibility', pressed: !!S.bigText, title: 'Larger text', sub: 'Easier reading across the app', end: `<span class="tickbox">${ic('check')}</span>` })}</div></div>`;
}

/* Inputs inside sheets write straight into the registration draft (data-r="path.to.field"). */
document.addEventListener('input', (e) => {
  const el = e.target.closest('[data-r]'); if (!el || !REG) return;
  const path = el.dataset.r.split('.'); let o = REG; while (path.length > 1) o = o[path.shift()];
  o[path[0]] = el.type === 'checkbox' ? el.checked : el.value;
});

Object.assign(A, {
  advOpen: () => advSheet(),
  advSet: (el) => { adv()[el.dataset.k] = el.dataset.id; advChanged(); },
  advAccess: () => { adv().access = !adv().access; advChanged(); },
  advReset: () => { S.adv = Object.assign({}, ADV0); save(); renderPlay(); if ($('.sheet')) advSheet(); },
  regWho: (el) => { const id = el.dataset.id; REG.who = REG.who.includes(id) ? REG.who.filter((x) => x !== id) : REG.who.concat(id); regRender(); },
  regNext: () => regNext(),
  regBack: () => { REG.step = Math.max(0, REG.step - 1); REG.err = ''; regRender(); },
  regFail: () => { REG.failNext = true; toast('The next payment will fail, to show recovery', 'info'); },
  waitJoin: (el) => { S.waitlist.push(el.dataset.id); save(); waitlistSheet(actById(el.dataset.id)); if (tab === 'play') renderPlay(); toast('You’re on the waitlist', 'timer'); },
  waitLeave: (el) => { S.waitlist = S.waitlist.filter((x) => x !== el.dataset.id); save(); closeSheet(); if (tab === 'play') renderPlay(); toast('Left the waitlist', 'check'); },
  similar: (el) => { const a = actById(el.dataset.id); S.mood = a.sport; save(); closeSheet(); go('play'); setSheet(1); toast(`Showing ${sp(a.sport).name.toLowerCase()} games`, 'search'); },
  addFamily: (el) => addFamilySheet(el.dataset.id),
  famSave: (el) => { const name = $('#famName').value.trim(), age = parseInt($('#famAge').value, 10), err = $('#famErr');
    const bad = !name ? 'Enter their name.' : !(age >= 1 && age <= 99) ? 'Enter an age between 1 and 99.' : '';
    if (bad) { err.hidden = false; err.lastElementChild.textContent = bad; return; }
    S.family = S.family || []; const f = { id: 'fx' + Date.now(), name, age, note: age < 18 ? `Age ${age} · consent given at booking` : `Age ${age}` }; S.family.push(f); profiles(); save();
    if (el.dataset.id === 'reg' && REG) { REG.d = Object.assign(clone(profiles()), REG.d); regRender(); } else familySheetOpen();
    toast(`${name.split(' ')[0]} added to your family`, 'users'); },
  notes: () => { noteTab = 'all'; notesSheet(); },
  noteTab: (el) => { noteTab = el.dataset.id; notesSheet(); },
  notePrefs: () => notePrefsSheet(),
  prefToggle: (el) => { prefs()[el.dataset.id] = !prefs()[el.dataset.id]; save(); notePrefsSheet(); },
  noteAct: (el) => noteAct(el.dataset.id, el.dataset.do),
  gamesView: (el) => { S.gamesView = el.dataset.id; save(); if (tab !== 'games') go('games'); else renderGames(); },
  openBook: () => { S.gamesView = 'book'; save(); go('games'); },
  calWho: (el) => { S.calWho = el.dataset.id; save(); renderFamily(); },
  calDay: (el) => { S.calDay = +el.dataset.id; save(); renderFamily(); },
  clashSlot: (el) => { S.mood = el.dataset.id; save(); go('play'); setSheet(1); toast(`Showing other ${sp(el.dataset.id).name.toLowerCase()} times`, 'search'); },
  carpool: (el) => shareAny('Carpool?', `Anyone heading to ${el.dataset.id} on ${dayLabel(+el.dataset.d)}? I can’t do both drop-offs, happy to swap a ride.`, 'https://letsplay.app/carpool'),
  evOpen: (el) => { const k = el.dataset.kind, id = el.dataset.id;
    if (k === 'game' || k === 'host') openDetail(id);
    else if (k === 'team') { go('team'); openTeam(id); }
    else { const b = S.turf.find((x) => x.id === id), v = VB(b.vid); sheet(`${head(esc(v.name), `${dayLabel(b.d)} · ${fmtT(b.d, pad2(b.start) + ':00')}–${fmtT(b.d, pad2(b.start + b.dur) + ':00')}`)}<div class="lrows">${rowHTML({ icon: 'users', title: `Split ${b.players} ways`, sub: 'UPI requests sent. Unpaid shares get a reminder.' })}${rowHTML({ icon: 'map-pin', title: 'Directions', sub: v.amenities.join(' · ') })}</div>${b.players > 1 ? `<button class="pill block soft" data-act="postSpots" data-id="${b.id}">${ic('megaphone')}Post open spots as a game</button>` : ''}<button class="pill block" data-act="close">Done</button>`); } },
  shopCat: (el) => { S.shopCat = el.dataset.id; save(); renderShop(); },
  shopClear: () => { S.shopQ = ''; renderShop(); },
  promoCricket: () => { S.shopCat = 'equipment'; renderShop(); toast('Showing equipment deals', 'tag'); },
  product: (el) => productSheet(el.dataset.id),
  pSize: (el) => { PS.size = el.dataset.id; productSheet(PS.id); },
  pQty: (el) => { PS.qty = Math.max(1, Math.min(9, PS.qty + +el.dataset.d)); productSheet(PS.id); },
  addCart: () => { const ex = S.cart.find((c) => c.id === PS.id && c.size === PS.size); if (ex) ex.qty += PS.qty; else S.cart.push({ id: PS.id, size: PS.size, qty: PS.qty }); PS = null; save(); closeSheet(); renderTabbar(); renderShop(); toast('Added to your bag', 'shopping-bag'); },
  cart: () => cartSheet(),
  cartQty: (el) => { const c = S.cart[+el.dataset.i]; c.qty += +el.dataset.d; if (c.qty < 1) S.cart.splice(+el.dataset.i, 1); save(); cartSheet(); renderTabbar(); renderShop(); },
  payCart: () => { const b = $('#cartGo'); b.disabled = true; b.innerHTML = `${ic('smartphone')}Waiting for ${pickedUpi('cartApp')}…`;
    setTimeout(() => { S.cart = []; save(); renderTabbar(); renderShop(); buzz(25); sheet(`<div class="xp-burst"><span class="up-ic">${ic('package')}</span><h2>Order placed</h2><div class="muted">Arriving in 2 days. We’ll message you with tracking.</div></div><button class="pill block" data-act="close">Done</button>`); }, 1100); },
  promote: () => promoteSheet(),
  bulkKits: () => sheet(`${head('Team kits', `${ORG.name} · ${ORG.teams.length} teams`)}<div class="lrows">${ORG.teams.map((t) => rowHTML({ lead: `<span class="crest" style="--c:${t.c}">${t.ab}</span>`, title: esc(t.name), sub: `${t.players} players · printed names and numbers`, end: `<b class="num">${inr(t.players * 649)}</b>` })).join('')}</div>
      <div class="sum card"><div class="total"><span>${ORG.teams.reduce((n, t) => n + t.players, 0)} jerseys at ₹649</span><span class="num">${inr(ORG.teams.reduce((n, t) => n + t.players, 0) * 649)}</span></div><div class="faint"><span>One GST invoice to ${ORG.name}</span><span></span></div></div><button class="pill block" data-act="doneToast" data-id="Quote sent to your company admin for approval">Request a quote</button>`),
  toggleMe: (el) => el.setAttribute('aria-pressed', el.getAttribute('aria-pressed') !== 'true'),
  doneToast: (el) => { closeSheet(); toast(el.dataset.id, 'check'); },
  familySheet: () => familySheetOpen(),
  paySheet: () => sheet(`${head('Payments', 'Your default UPI app for games, courts and the shop')}${upiChips('regApp')}<div class="faint" style="font-size:13px">You always confirm each payment in your UPI app. Card and net banking are coming soon.</div><button class="pill block" data-act="close">Done</button>`),
  bigText: () => { S.bigText = !S.bigText; save(); applyPrefs(); renderMe(); },
});
function familySheetOpen() {
  sheet(`${head('Family profiles', 'Book for anyone in your family')}<div class="lrows">${family().map((f) => rowHTML({ lead: `<i class="dotc lg" style="background:${famColor(f.id)}">${esc(f.name[0])}</i>`, title: esc(f.name), sub: esc(f.note) })).join('')}</div>
    <button class="pill block soft" data-act="addFamily" data-id="me">${ic('plus')}Add family member</button><button class="pill block" data-act="close">Done</button>`);
}
