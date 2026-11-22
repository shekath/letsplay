/* ───────── UPGRADES ─────────
   1. Discovery filters      2. Step-by-step registration (+ waitlist)   3. Family calendar with clash warnings
   4. Notification centre    5. "What's next" strip on the map           6. Coach on game pages + match-day tools
   7. Turf and court slot booking with split UPI payment */

/* Shared: render into the open sheet if it is the same flow, otherwise open a new one */
function sheetSet(html, key, onMount) {
  const b = $('.sheet .sheet-body');
  if (b && b.dataset.k === key) { b.innerHTML = html; if (onMount) onMount($('.sheet')); return; }
  openSheet(html, { onMount }); const nb = $('.sheet .sheet-body'); if (nb) nb.dataset.k = key;
}
const pad2 = (n) => String(n).padStart(2, '0');
const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const fromMin = (m) => pad2(Math.floor(m / 60) % 24) + ':' + pad2(m % 60);
const famById = (id) => FAMILY.find((f) => f.id === id);
const firstName = (id) => famById(id).name.split(' ')[0];

/* ═════ 1. FILTERS ═════ */
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
  const f = adv(); const h = +a.t.split(':')[0];
  if (f.when === 'today' && a.d !== 0) return false;
  if (f.when === 'tomorrow' && a.d !== 1) return false;
  if (f.when === 'weekend') { const wd = dateAt(a.d, '12:00').getDay(); if (wd !== 0 && wd !== 6) return false; }
  if (f.time === 'morning' && h >= 12) return false;
  if (f.time === 'afternoon' && (h < 12 || h >= 17)) return false;
  if (f.time === 'evening' && h < 17) return false;
  if (f.km !== 'any' && kmFrom(a.x, a.y) > +f.km) return false;
  if (f.price === 'free' && a.price > 0) return false;
  if ((f.price === '200' || f.price === '500') && a.price > +f.price) return false;
  const lv = a.level.toLowerCase(), open = /all/.test(lv);
  if (f.level === 'beginner' && !(open || /beginner/.test(lv))) return false;
  if (f.level === 'intermediate' && !(open || /intermediate/.test(lv))) return false;
  if (f.level === 'advanced' && !(open || /advanced|competitive/.test(lv))) return false;
  const [lo, hi] = ageRange(a.ages);
  if (f.ages === 'kids' && lo > 12) return false;
  if (f.ages === 'adults' && hi < 18) return false;
  if (f.setting !== 'any' && a.setting !== f.setting) return false;
  if (f.access && !isAccessible(a)) return false;
  return true;
}
function filterChipHTML() {
  const n = S.mode === 'venues' ? 0 : advCount();
  return `<button class="chip ${n ? 'chip-on' : ''}" data-act="advOpen" aria-label="More filters${n ? ', ' + n + ' active' : ''}">${ic('sliders-horizontal')}Filters${n ? `<span class="chip-count num">${n}</span>` : ''}</button>`;
}
function advSheet() {
  const f = adv();
  const grp = (key, label, opts) => `<div class="field"><span class="lbl">${label}</span><div class="chips" style="flex-wrap:wrap">${opts.map(([v, l]) => `<button type="button" class="chip" data-act="advSet" data-k="${key}" data-id="${v}" aria-pressed="${String(f[key]) === String(v)}">${l}</button>`).join('')}</div></div>`;
  sheetSet(`${sheetHead('Filters', 'Narrow down games near you')}
    ${grp('when', 'Day', [['any', 'Any day'], ['today', 'Today'], ['tomorrow', 'Tomorrow'], ['weekend', 'This weekend']])}
    ${grp('time', 'Time', [['any', 'Any time'], ['morning', 'Morning'], ['afternoon', 'Afternoon'], ['evening', 'Evening']])}
    ${grp('km', 'Distance', [['any', 'Any distance'], ['1', 'Within 1 km'], ['2', 'Within 2 km'], ['3', 'Within 3 km']])}
    ${grp('price', 'Fee', [['any', 'Any fee'], ['free', 'Free'], ['200', 'Up to ₹200'], ['500', 'Up to ₹500']])}
    ${grp('level', 'Ability', [['any', 'Any level'], ['beginner', 'Beginner'], ['intermediate', 'Intermediate'], ['advanced', 'Advanced']])}
    ${grp('ages', 'Who’s playing', [['any', 'Anyone'], ['kids', 'Kids (under 13)'], ['adults', 'Adults']])}
    ${grp('setting', 'Setting', [['any', 'Indoor or outdoor'], ['Indoor', 'Indoor'], ['Outdoor', 'Outdoor']])}
    <button type="button" class="row card" data-act="advAccess" aria-pressed="${f.access}" style="border-radius:14px">${ic('accessibility', 'lead')}<div class="grow"><b>Step-free access</b><small>Ramps, lifts or level entry and accessible washrooms</small></div><span class="tickbox">${ic('check')}</span></button>
    <div style="display:flex;gap:10px"><button class="btn btn-ghost" data-act="advReset">Reset</button><button class="btn btn-primary" style="flex:1" data-act="closeSheet" id="advShow"></button></div>`, 'adv', advCountBtn);
}
function advCountBtn() { const b = $('#advShow'); if (b) { const n = visibleActs().length; b.textContent = n ? `Show ${n} game${n === 1 ? '' : 's'}` : 'No games match. Try fewer filters'; } }
function advChanged() { save(); deselect(); renderExploreChrome(); advSheet(); }

/* ═════ 2. REGISTRATION (step by step) + WAITLIST ═════ */
let REG = null;
const STEP_LABEL = { who: 'Who’s playing', details: 'Details & emergency contact', consent: 'Consent', pay: 'Payment' };
const regSteps = (a) => ['who', 'details', 'consent'].concat(a.price ? ['pay'] : []);
function ageOk(a, f) { const [lo, hi] = ageRange(a.ages); return f.age >= lo && f.age <= hi; }
function profiles() { if (!S.profiles) S.profiles = JSON.parse(JSON.stringify(PROFILES)); return S.profiles; }
function joinText(a) { if (spotsLeft(a) === 0) return (S.waitlist || []).includes(a.id) ? 'On waitlist' : 'Join waitlist'; return 'Join · ' + money(a.price); }
function regStart(id) {
  const a = allActs().find((x) => x.id === id);
  if (spotsLeft(a) === 0 && !isJoined(a)) return waitlistSheet(a);
  if (!REG || REG.aid !== id) {
    const elig = FAMILY.filter((f) => ageOk(a, f));
    REG = { aid: id, step: 0, who: elig.length ? [elig[0].id] : [], d: JSON.parse(JSON.stringify(profiles())), save: true,
      c: { conduct: false, guardian: false, photo: true }, failed: false, failNext: false, resumed: false, err: '' };
  } else { REG.resumed = REG.step > 0; REG.err = ''; }
  regRender();
}
function regRender() {
  const a = allActs().find((x) => x.id === REG.aid), steps = regSteps(a), st = steps[REG.step];
  const minors = REG.who.filter((id) => famById(id).age < 18);
  let body = '';
  if (st === 'who') {
    body = `<div class="pick">${FAMILY.map((f) => { const ok = ageOk(a, f); return `<button class="opt" data-act="regWho" data-id="${f.id}" aria-pressed="${REG.who.includes(f.id)}" ${ok ? '' : 'aria-disabled="true" disabled'}>${avatar(f, 40)}<div><b>${f.name}</b><div class="faint" style="font-size:13px">${ok ? f.note : `Not eligible · ages ${a.ages} only`}</div></div><span class="tick">${ic('check')}</span></button>`; }).join('')}</div>
      <button class="link" style="justify-self:start" data-act="toastMsg" data-msg="Add a family member from Profile → Family">${ic('plus', 'ic-sm')} Add family member</button>`;
  } else if (st === 'details') {
    body = REG.who.map((id) => { const f = famById(id), p = REG.d[id]; return `<div class="card reg-card"><div style="display:flex;gap:10px;align-items:center">${avatar(f, 36)}<b>${f.name}</b><span class="badge free" style="margin-left:auto">${ic('check')}Saved details</span></div>
      ${f.age >= 18 ? `<div class="field"><label for="rp-${id}">Mobile number</label><input class="input" id="rp-${id}" inputmode="tel" data-r="d.${id}.phone" value="${esc(p.phone)}" placeholder="10-digit mobile"></div>` : ''}
      <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:8px"><div class="field"><label for="rn-${id}">Emergency contact</label><input class="input" id="rn-${id}" data-r="d.${id}.ecName" value="${esc(p.ecName)}" placeholder="Name (relation)"></div>
      <div class="field"><label for="re-${id}">Their phone</label><input class="input" id="re-${id}" inputmode="tel" data-r="d.${id}.ecPhone" value="${esc(p.ecPhone)}" placeholder="10 digits"></div></div>
      <div class="field"><label for="rm-${id}">Medical notes for the coach (optional)</label><input class="input" id="rm-${id}" data-r="d.${id}.medical" value="${esc(p.medical)}" placeholder="Allergies, asthma, injuries"></div></div>`; }).join('') +
      `<label class="check-row"><input type="checkbox" data-r="save" ${REG.save ? 'checked' : ''}> Save these details for next time</label>`;
  } else if (st === 'consent') {
    body = `<label class="check-row"><input type="checkbox" data-r="c.conduct" ${REG.c.conduct ? 'checked' : ''}><span><b>Code of conduct and cancellation policy</b><br>I agree to ${esc(a.host)}’s code of conduct. ${esc(a.cancel)}</span></label>
      ${minors.length ? `<label class="check-row"><input type="checkbox" data-r="c.guardian" ${REG.c.guardian ? 'checked' : ''}><span><b>Parent or guardian consent</b><br>I’m the parent or guardian of ${minors.map(firstName).join(' and ')} and agree to them taking part.</span></label>` : ''}
      <label class="check-row"><input type="checkbox" data-r="c.photo" ${REG.c.photo ? 'checked' : ''}><span><b>Photos (optional)</b><br>The host may take photos for the club’s page.</span></label>
      <div class="muted" style="font-size:13px;display:flex;gap:6px">${ic('shield-check', 'ic-sm')}Emergency contacts and medical notes are shared only with the host and coach.</div>`;
  } else {
    const n = REG.who.length;
    body = `${REG.failed ? `<div class="err-box" role="alert">${ic('info')}<div><b>Payment didn’t go through</b><br>No money was taken. Your details are saved, so you can try again or pick another UPI app.</div></div>` : ''}
      <div class="rows"><div class="row"><div class="grow"><b>${esc(a.title)}</b><small>${money(a.price)} × ${n} player${n > 1 ? 's' : ''}</small></div><b class="num">${money(a.price * n)}</b></div>
      <div class="row"><div class="grow"><b>Booking fee</b><small>Free during the pilot</small></div><b class="num">₹0</b></div></div>
      <div class="field"><span class="lbl">Pay via UPI</span><div class="chips" id="regApp">${UPI_APPS.map((u, i) => `<button type="button" class="chip" data-act="pickOne" data-group="regApp" data-id="${u}" aria-pressed="${i === 0}">${ic('smartphone')}${u}</button>`).join('')}</div></div>
      <button class="link faint" style="justify-self:start;font-size:13px" data-act="regFail">Test a failed payment</button>`;
  }
  const last = REG.step === steps.length - 1;
  sheetSet(`${sheetHead('Join game', `${esc(a.title)} · ${when(a)}`)}
    <div class="steps" aria-hidden="true">${steps.map((s, i) => `<i class="${i < REG.step ? 'done' : i === REG.step ? 'cur' : ''}"></i>`).join('')}</div>
    <div class="eyebrow">Step ${REG.step + 1} of ${steps.length} · ${STEP_LABEL[st]}</div>
    ${REG.resumed ? `<div class="muted" style="font-size:13px;display:flex;gap:6px;align-items:center">${ic('rotate-ccw', 'ic-sm')}Picked up where you left off. Nothing you entered was lost.</div>` : ''}
    ${body}
    <div class="err-box" id="regErr" role="alert" ${REG.err ? '' : 'hidden'}>${ic('info')}<div>${esc(REG.err)}</div></div>
    <div style="display:flex;gap:10px">${REG.step ? '<button class="btn btn-ghost" data-act="regBack">Back</button>' : ''}<button class="btn btn-primary" style="flex:1;min-height:52px" data-act="regNext" id="regGo">${last ? (a.price ? `${ic('smartphone')}Pay ${money(a.price * REG.who.length)} via UPI` : `${ic('check')}Confirm booking`) : 'Continue'}</button></div>`, 'reg');
}
function regValidate(st) {
  if (st === 'who' && !REG.who.length) return 'Choose at least one person to register.';
  if (st === 'details') {
    for (const id of REG.who) {
      const p = REG.d[id], nm = firstName(id), digits = (s) => (s || '').replace(/\D/g, '');
      if (famById(id).age >= 18 && digits(p.phone).length !== 10) return `Enter a 10-digit mobile number for ${nm}.`;
      if (!p.ecName.trim()) return `Add an emergency contact for ${nm}.`;
      if (digits(p.ecPhone).length !== 10) return `Enter a 10-digit phone number for ${nm}’s emergency contact.`;
    }
  }
  if (st === 'consent') {
    if (!REG.c.conduct) return 'Tick the code of conduct to continue.';
    if (REG.who.some((id) => famById(id).age < 18) && !REG.c.guardian) return 'Parent or guardian consent is needed for players under 18.';
  }
  return '';
}
function regNext() {
  const a = allActs().find((x) => x.id === REG.aid), steps = regSteps(a), st = steps[REG.step];
  const err = regValidate(st); if (err) { REG.err = err; const e = $('#regErr'); e.hidden = false; e.lastElementChild.textContent = err; return; }
  REG.err = ''; REG.resumed = false;
  if (REG.step < steps.length - 1) { REG.step++; regRender(); return; }
  if (st === 'pay') {
    const appBtn = $('#regApp [aria-pressed="true"]'); const app = appBtn ? appBtn.dataset.id : 'UPI';
    const go2 = $('#regGo'); go2.disabled = true; go2.innerHTML = `${ic('smartphone')}Waiting for ${app}…`;
    setTimeout(() => { if (REG.failNext) { REG.failNext = false; REG.failed = true; regRender(); } else regFinish(); }, 1100);
    return;
  }
  regFinish();
}
function regFinish() {
  const a = allActs().find((x) => x.id === REG.aid), who = REG.who.slice();
  if (REG.save) S.profiles = JSON.parse(JSON.stringify(REG.d));
  if (!S.joined.includes(a.id)) S.joined.push(a.id);
  S.bookings = S.bookings || {}; S.bookings[a.id] = Array.from(new Set((S.bookings[a.id] || []).concat(who)));
  S.spotsTaken[a.id] = (S.spotsTaken[a.id] || 0) + who.length;
  notes().unshift({ id: 'n' + Date.now(), pri: 'info', cat: 'booking', icon: 'circle-check', when: 'Just now', ref: a.id, title: `Booked: ${a.title}`, body: `${who.map(firstName).join(' and ')} ${who.length > 1 ? 'are' : 'is'} in for ${when(a)}. A reminder comes 2 hours before.`, actions: [['View game', 'view']], read: false });
  REG = null; save();
  openSheet(`<div class="success"><div class="burst">${ic('check')}</div><h2>You’re in!</h2>
    <div class="muted">${esc(a.title)}<br>${longFmt.format(dateAt(a.d, a.t))} at ${timeFmt.format(dateAt(a.d, a.t))}<br>Playing: ${who.map(firstName).join(', ')}</div></div>
    <div class="rows"><div class="row">${ic('calendar-days', 'lead')}<div class="grow"><b>Added to the family calendar</b><small>Reminder 2 hours before</small></div></div>
    <div class="row">${ic('message-circle', 'lead')}<div class="grow"><b>Game chat unlocked</b><small>Say hi to the other players</small></div></div></div>
    <button class="btn btn-primary btn-block" data-act="gotoGames">See My games</button>
    <button class="btn btn-ghost btn-block" data-act="closeSheet">Keep exploring</button>`);
  if (tab === 'explore') { renderPinsAndList(); if (selected) selectAct(selected); }
  if (tab === 'games') renderGames();
  $$('#stack .view').forEach((v) => v.remove());
}
function waitlistSheet(a) {
  S.waitlist = S.waitlist || []; const on = S.waitlist.includes(a.id); const pos = 3;
  openSheet(`${sheetHead(on ? 'You’re on the waitlist' : 'This game is full', `${esc(a.title)} · ${when(a)}`)}
    <div class="success" style="padding-top:0"><div class="burst" style="background:var(--brand-soft);color:var(--brand)">${ic('timer')}</div><h2 class="num">${on ? `#${pos} in line` : `${pos - 1} ahead of you`}</h2>
    <div class="muted" style="max-width:32ch">If a place opens, we hold it for you for 30 minutes and send a notification. You only pay if you take it.</div></div>
    ${on ? '<button class="btn btn-ghost btn-block" data-act="waitLeave" data-id="' + a.id + '">Leave the waitlist</button>' : `<button class="btn btn-primary btn-block" data-act="waitJoin" data-id="${a.id}">${ic('timer')}Join the waitlist</button>`}
    <button class="btn btn-soft btn-block" data-act="similar" data-id="${a.id}">${ic('search')}Find similar games</button>`);
}

/* ═════ 3. FAMILY CALENDAR + CLASHES ═════ */
function famEvents() {
  const ev = [];
  allActs().filter(isJoined).forEach((a) => ev.push({ key: 'g' + a.id, ref: a.id, kind: 'game', title: a.title, d: a.d, t: a.t, mins: a.mins, venue: a.venue, who: (S.bookings && S.bookings[a.id]) || ['f0'], sport: a.sport }));
  (S.turf || []).forEach((b) => { const v = VB(b.vid); ev.push({ key: 't' + b.id, ref: b.id, kind: 'turf', title: `${v.name} · ${v.courts[b.court]}`, d: b.d, t: pad2(b.hours[0]) + ':00', mins: b.hours.length * 60, venue: v.name, who: ['f0'], sport: v.sports[0] }); });
  if (can.teams()) S.teams.forEach((t) => t.next && ev.push({ key: 'm' + t.id, ref: t.id, kind: 'team', title: `${t.name} v ${t.next.vs}`, d: t.next.d, t: t.next.t, mins: 120, venue: t.next.venue, who: ['f0'], sport: t.sport }));
  return ev.filter((e) => e.d >= 0 && e.d <= 6).sort((x, y) => x.d - y.d || toMin(x.t) - toMin(y.t));
}
function findClashes(ev) {
  const out = [];
  for (let i = 0; i < ev.length; i++) for (let j = i + 1; j < ev.length; j++) {
    const a = ev[i], b = ev[j]; if (a.d !== b.d) continue;
    const s1 = toMin(a.t), e1 = s1 + a.mins, s2 = toMin(b.t), e2 = s2 + b.mins;
    const samePerson = a.who.some((w) => b.who.includes(w));
    if (s1 < e2 && s2 < e1 && (samePerson || a.venue.split(' · ')[0] !== b.venue.split(' · ')[0])) out.push({ a, b, from: fromMin(Math.max(s1, s2)), to: fromMin(Math.min(e1, e2)), samePerson });
  }
  return out;
}
const fmtT = (d, t) => timeFmt.format(dateAt(d, t));
function clashCard(c) {
  const wa = c.a.who.map(firstName).join(' & '), wb = c.b.who.map(firstName).join(' & ');
  return `<div class="clash" role="status">${ic('info')}<div class="grow"><b>Clash on ${dayLabel(c.a.d)}, ${fmtT(c.a.d, c.from)}–${fmtT(c.a.d, c.to)}</b>
    <span>${c.samePerson ? `${wa} is booked in two places at once.` : `${wa} at ${esc(c.a.venue.split(' · ')[0])} and ${wb} at ${esc(c.b.venue.split(' · ')[0])}. One adult can’t do both drop-offs.`}</span>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-sm btn-line" data-act="clashSlot" data-sport="${c.b.sport}">Find another slot</button><button class="btn btn-sm btn-ghost" data-act="toastMsg" data-msg="Carpool request sent to 3 parents in the group" data-icon="send">Ask for a carpool</button></div></div></div>`;
}
function renderFamilyCal() {
  const ev = famEvents(), who = S.calWho || 'all', day = S.calDay || 0;
  const shown = ev.filter((e) => who === 'all' || e.who.includes(who));
  const clashes = findClashes(ev);
  const dayEv = shown.filter((e) => e.d === day);
  const inClash = (e) => clashes.some((c) => c.a.key === e.key || c.b.key === e.key);
  $('#scr-games').innerHTML = `<div class="page-head"><h1>My games</h1>${bellHTML()}</div>${gamesSegHTML()}
    <div class="chips" style="margin-top:12px">${[['all', 'Everyone', null]].concat(FAMILY.map((f) => [f.id, firstName(f.id), FAMILY_COLORS[f.id]])).map(([id, n, c]) => `<button class="chip" data-act="calWho" data-id="${id}" aria-pressed="${who === id}">${c ? `<span class="dotc" style="background:${c}"></span>` : ic('users')}${n}</button>`).join('')}</div>
    <div class="weekstrip daypick section" style="margin-top:12px">${[0, 1, 2, 3, 4, 5, 6].map((d) => { const dt = dateAt(d, '12:00'); const ws = Array.from(new Set(shown.filter((e) => e.d === d).flatMap((e) => e.who))); return `<button data-act="calDay" data-id="${d}" aria-pressed="${day === d}">${wkFmt.format(dt)}<b class="num">${dt.getDate()}</b><span class="dots">${ws.map((w) => `<i style="background:${FAMILY_COLORS[w]}"></i>`).join('') || '<i style="opacity:0"></i>'}</span></button>`; }).join('')}</div>
    ${clashes.length ? `<div class="section" style="gap:10px">${clashes.map(clashCard).join('')}</div>` : `<div class="section muted" style="font-size:13.5px;display:flex;gap:6px;align-items:center">${ic('circle-check', 'ic-sm')}No clashes this week.</div>`}
    <div class="section"><div class="section-head"><h2>${dayLabel(day)}</h2><span class="faint">${longFmt.format(dateAt(day, '12:00'))}</span></div>
      ${dayEv.length ? dayEv.map((e) => `<button class="cal-ev ${inClash(e) ? 'clashing' : ''}" style="--c:${FAMILY_COLORS[e.who[0]]}" data-act="calOpen" data-kind="${e.kind}" data-id="${e.ref}">
        <div class="cal-time num"><b>${fmtT(e.d, e.t)}</b><small>${fmtT(e.d, fromMin(toMin(e.t) + e.mins))}</small></div>
        <div class="grow" style="min-width:0"><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><b>${esc(e.title)}</b>${e.kind === 'turf' ? '<span class="badge brand">Venue booking</span>' : e.kind === 'team' ? '<span class="badge ent">Team match</span>' : ''}${inClash(e) ? '<span class="badge live">Clash</span>' : ''}</div><small>${esc(e.venue)}</small></div>
        <div class="avatars">${e.who.map((w) => avatar(famById(w))).join('')}</div></button>`).join('') : `<div class="empty card">${ic('calendar-days')}<b>Nothing on ${dayLabel(day).toLowerCase() === 'today' ? 'today' : dayLabel(day)}</b><button class="btn btn-soft btn-sm" data-act="tab" data-id="explore">Find something to play</button></div>`}
    </div>
    <div class="section"><button class="btn btn-ghost btn-block" data-act="toastMsg" data-msg="Family calendar synced to your phone calendar" data-icon="calendar">${ic('calendar')}Sync to phone calendar</button></div>`;
}
function gamesSegHTML() { const v = S.gamesView || 'list'; return `<div class="seg" role="group" aria-label="View"><button data-act="gamesView" data-id="list" aria-pressed="${v === 'list'}">Upcoming</button><button data-act="gamesView" data-id="calendar" aria-pressed="${v === 'calendar'}">Family calendar</button></div>`; }
function attentionHTML() {
  const clashes = findClashes(famEvents()); const open = notes().filter((n) => !n.done && (n.pri === 'urgent' || n.pri === 'action'));
  if (!clashes.length && !open.length) return '';
  return `<div class="section"><div class="eyebrow">Needs attention</div><div class="rows">
    ${open.slice(0, 3).map((n) => `<button class="row" data-act="notes">${ic(n.icon, n.pri === 'urgent' ? 'lead hotc' : 'lead')}<div class="grow"><b>${esc(n.title)}</b><small>${esc(n.body.split('. ')[0])}.</small></div>${ic('chevron-right')}</button>`).join('')}
    ${clashes.length ? `<button class="row" data-act="gamesView" data-id="calendar">${ic('calendar-days', 'lead hotc')}<div class="grow"><b>${clashes.length} clash${clashes.length > 1 ? 'es' : ''} in the family calendar</b><small>${dayLabel(clashes[0].a.d)}: ${esc(clashes[0].a.title)} overlaps ${esc(clashes[0].b.title)}</small></div>${ic('chevron-right')}</button>` : ''}
  </div></div>`;
}

/* ═════ 4. NOTIFICATIONS ═════ */
function notes() { if (!S.notes) S.notes = NOTE_SEED.map((n) => Object.assign({ read: false, done: false }, n)); return S.notes; }
function prefs() { if (!S.notePrefs) S.notePrefs = { club: true, promo: true, recs: true }; return S.notePrefs; }
const noteVisible = (n) => !(n.cat === 'club' && !prefs().club) && !(n.cat === 'promo' && !prefs().promo) && !(n.cat === 'recs' && !prefs().recs);
function unread() { return notes().filter((n) => !n.read && noteVisible(n)).length; }
function bellHTML() { const n = unread(); return `<button class="icon-btn" data-act="notes" aria-label="Notifications${n ? ', ' + n + ' unread' : ''}">${ic('bell')}${n ? `<span class="count num">${n}</span>` : ''}</button>`; }
let noteTab = 'all';
function openNotes() { popAll(); const v = push(''); v.id = 'notesView'; renderNotes(); setTimeout(() => { notes().forEach((n) => (n.read = true)); save(); refreshBells(); }, 600); }
function renderNotes() {
  const v = $('#notesView'); if (!v) return;
  const list = notes().filter(noteVisible).filter((n) => noteTab === 'all' || (noteTab === 'action' ? n.pri === 'urgent' || n.pri === 'action' : n.pri === 'info' || n.pri === 'promo'));
  const cnt = notes().filter((n) => noteVisible(n) && !n.done && (n.pri === 'urgent' || n.pri === 'action')).length;
  v.innerHTML = `<div class="view-bar"><button class="icon-btn" data-act="back" aria-label="Back">${ic('arrow-left')}</button><h2>Notifications</h2><button class="icon-btn" data-act="notePrefs" aria-label="Notification settings">${ic('settings')}</button></div>
    <div class="view-body" style="padding-top:4px">
      <div class="seg" role="group" aria-label="Filter notifications"><button data-act="noteTab" data-id="all" aria-pressed="${noteTab === 'all'}">All</button><button data-act="noteTab" data-id="action" aria-pressed="${noteTab === 'action'}">Needs action${cnt ? ` · ${cnt}` : ''}</button><button data-act="noteTab" data-id="updates" aria-pressed="${noteTab === 'updates'}">Updates</button></div>
      ${list.length ? list.map((n) => `<div class="note pri-${n.pri} ${n.done ? 'done' : ''} ${n.read ? '' : 'unread'}">
        <span class="note-ic">${ic(n.icon)}</span>
        <div class="grow" style="min-width:0;display:grid;gap:6px">
          <div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline"><b>${esc(n.title)}</b><span class="faint" style="font-size:12px;white-space:nowrap">${esc(n.when)}</span></div>
          <span class="muted" style="font-size:14px">${esc(n.body)}</span>
          ${n.done ? `<span class="note-done">${ic('check', 'ic-sm')}${esc(n.done)}</span>` : `<div style="display:flex;gap:8px;flex-wrap:wrap">${n.actions.map(([l, k], i) => `<button class="btn btn-sm ${i === 0 ? 'btn-primary' : 'btn-line'}" data-act="noteAct" data-id="${n.id}" data-do="${k}">${esc(l)}</button>`).join('')}</div>`}
        </div></div>`).join('') : `<div class="empty card">${ic('bell')}<b>You’re all caught up</b></div>`}
      <div class="faint" style="font-size:12.5px">Cancellations, venue and time changes, payments and deadlines always reach you. Choose the rest in settings.</div>
    </div>`;
}
function refreshBells() { if ($('#bellSlot')) $('#bellSlot').innerHTML = bellHTML(); if (tab === 'games' && $('#scr-games .page-head')) renderGames(); if (tab === 'explore' && S.mode !== 'venues' && $('#nearbyList')) renderPinsAndList(); }
function notePrefsSheet() {
  const P = prefs();
  const row = (k, t, d, locked) => `<button type="button" class="row" ${locked ? 'aria-disabled="true"' : `data-act="prefToggle" data-id="${k}"`} aria-pressed="${locked ? true : P[k]}">${ic(locked ? 'lock' : 'bell', 'lead')}<div class="grow"><b>${t}</b><small>${d}</small></div><span class="tickbox">${ic('check')}</span></button>`;
  sheetSet(`${sheetHead('Notification settings')}
    <div class="rows">${row('x', 'Cancellations and changes', 'Venue, time and weather changes. Always on.', true)}${row('y', 'Payments and deadlines', 'Fees due and registration deadlines. Always on.', true)}
    ${row('club', 'Club news and coach updates', 'Kit lists, announcements from your clubs')}${row('recs', 'Suggestions near you', 'New games that match your sports')}${row('promo', 'Offers and deals', 'Marketplace and sponsor promotions')}</div>
    <button class="btn btn-primary btn-block" data-act="closeSheet">Done</button>`, 'prefs');
}
function noteAct(id, k) {
  const n = notes().find((x) => x.id === id); if (!n) return;
  const res = { keep: 'Your spot is kept. We’ll update you at 5 am.', cancelSpot: 'Place cancelled. Refund on its way.', ack: 'Noted.', yes: 'You’re marked as playing.', no: 'Captain told you can’t make it.', snooze: 'We’ll remind you tomorrow.', pay: 'Paid ₹300 via UPI.' };
  if (k === 'view') { const a = allActs().find((x) => x.id === n.ref); if (a) { openAct(a.id); } return; }
  if (k === 'shop') { go('shop'); return; }
  if (k === 'cancelSpot') { S.joined = S.joined.filter((x) => x !== n.ref); if (S.bookings) delete S.bookings[n.ref]; }
  if (k === 'yes' || k === 'no') { const t = S.teams.find((x) => x.id === n.ref); if (t) t.members[0].status = k === 'yes' ? 'yes' : 'no'; }
  n.done = res[k] || 'Done'; n.read = true; save(); renderNotes(); toast(n.done, 'check');
}

/* ═════ 5. WHAT'S NEXT strip ═════ */
function nextStripHTML() {
  const ev = famEvents().filter((e) => dateAt(e.d, e.t) > Date.now());
  const nx = ev[0]; const ch = notes().filter((n) => !n.done && n.pri === 'urgent' && noteVisible(n)).length; const todo = notes().filter((n) => !n.done && n.pri === 'action' && noteVisible(n)).length;
  if (!nx && !ch && !todo) return '';
  const s2 = nx ? sp(nx.sport) : null; const a = nx && nx.kind === 'game' ? allActs().find((x) => x.id === nx.ref) : null;
  return `<div class="next-strip">
    ${nx ? `<button class="ns-main" data-act="calOpen" data-kind="${nx.kind}" data-id="${nx.ref}"><span class="sport-ic" style="--c:${s2.c};width:38px;height:38px">${ic(s2.icon)}</span><span style="min-width:0;display:grid"><span class="eyebrow">Up next${nx.who[0] !== 'f0' || nx.who.length > 1 ? ' · ' + nx.who.map(firstName).join(', ') : ''}</span><b class="ellip">${esc(nx.title)}</b><small class="faint ellip">${dayLabel(nx.d)} ${fmtT(nx.d, nx.t)}${a ? ' · ' + fmtKm(kmFrom(a.x, a.y)) : ''}</small></span></button>` : '<span></span>'}
    <span class="ns-side">${ch ? `<button class="ns-pill hot" data-act="notes">${ic('info', 'ic-sm')}${ch} change${ch > 1 ? 's' : ''}</button>` : ''}${todo ? `<button class="ns-pill" data-act="notes">${ic('list-checks', 'ic-sm')}${todo} to do</button>` : ''}</span>
  </div>`;
}

/* ═════ 6. COACH: match day ═════ */
let mdTeam = null;
function openMatchDay(tid) {
  const t = S.teams.find((x) => x.id === tid); S.md = S.md || {};
  if (!S.md[tid]) S.md[tid] = { att: {}, lineup: t.members.map((m, i) => i).filter((i) => t.members[i].status === 'yes'), cap: 0 };
  mdTeam = tid; const v = push(''); v.id = 'mdView'; renderMD();
}
function renderMD() {
  const v = $('#mdView'); if (!v) return; const top = v.scrollTop;
  const t = S.teams.find((x) => x.id === mdTeam), M = S.md[mdTeam], size = LINEUP_SIZE[t.sport] || 6, s2 = sp(t.sport);
  const cnt = (st) => t.members.filter((m) => m.status === st).length;
  const noReply = t.members.filter((m) => m.status === 'maybe' || m.status === 'invited').length;
  const present = Object.values(M.att).filter((x) => x === 'present' || x === 'late').length;
  v.innerHTML = `<div class="view-bar"><button class="icon-btn" data-act="back" aria-label="Back">${ic('arrow-left')}</button><h2>Match day</h2></div>
    <div class="view-body" style="padding-top:4px">
      <div class="org-hero" style="background:linear-gradient(135deg, ${t.color}, #0D1530)">
        <span class="badge" style="background:rgba(255,255,255,.18);color:#fff;justify-self:start">${ic(s2.icon)}${esc(t.name)}</span>
        <h2>${t.next ? 'v ' + esc(t.next.vs) : 'Training session'}</h2>
        <div style="opacity:.9;font-size:14px">${t.next ? `${longFmt.format(dateAt(t.next.d, t.next.t))} · ${fmtT(t.next.d, t.next.t)} · ${esc(t.next.venue)}` : 'No match scheduled yet'}<br>Report 30 min early · Forecast 28°, clear</div>
      </div>
      <div class="card" style="padding:14px;display:grid;gap:12px"><div class="section-head"><h2 style="font-size:20px">Availability</h2>${noReply ? `<button class="link" data-act="mdNudge">${ic('send', 'ic-sm')} Nudge ${noReply}</button>` : ''}</div>
        <div class="avail"><div><b style="color:var(--ok)">${cnt('yes')}</b><small>Playing</small></div><div><b style="color:var(--warn)">${cnt('maybe') + cnt('invited')}</b><small>No reply / maybe</small></div><div><b style="color:var(--hot)">${cnt('no')}</b><small>Out</small></div></div></div>
      <div class="section-head"><h2 style="font-size:20px;font-style:italic;text-transform:uppercase">Attendance</h2><span class="faint num">${present}/${t.members.length} checked in</span></div>
      <div class="rows">${t.members.map((m, i) => { const a = M.att[i] || ''; return `<div class="row"><div class="avatars">${avatar(m)}</div><div class="grow"><b>${esc(m.name)}</b><small>${m.role}${m.status === 'no' ? ' · said they’re out' : ''}</small></div>
        <div class="att">${[['present', 'In'], ['late', 'Late'], ['absent', 'Out']].map(([k, l]) => `<button class="att-${k}" data-act="mdAtt" data-i="${i}" data-s="${k}" aria-pressed="${a === k}">${l}</button>`).join('')}</div></div>`; }).join('')}</div>
      <div class="section-head"><h2 style="font-size:20px;font-style:italic;text-transform:uppercase">Lineup</h2><span class="badge ${M.lineup.length >= size ? 'free' : ''} num">${M.lineup.length}/${size}</span></div>
      ${M.lineup.length < size ? `<div class="muted" style="font-size:13.5px;display:flex;gap:6px;align-items:center">${ic('info', 'ic-sm')}${size - M.lineup.length} more needed for a full ${s2.name.toLowerCase()} side. <button class="link" data-act="invite" data-id="${t.id}">Invite players</button></div>` : ''}
      <div class="rows">${t.members.map((m, i) => { const pos = M.lineup.indexOf(i); return `<div class="row"><span class="lineup-no num">${pos >= 0 ? pos + 1 : '–'}</span><div class="grow"><b>${esc(m.name)}${M.cap === i ? ' <span class="badge volt">C</span>' : ''}</b><small>${pos >= 0 ? 'In the lineup' : 'On the bench'}</small></div>
        <button class="icon-btn" data-act="mdCap" data-i="${i}" aria-label="Make captain" aria-pressed="${M.cap === i}">${ic('crown')}</button>
        <button class="btn btn-sm ${pos >= 0 ? 'btn-soft' : 'btn-line'}" data-act="mdLineup" data-i="${i}">${pos >= 0 ? 'Bench' : 'Add'}</button></div>`; }).join('')}</div>
      <div class="field"><span class="lbl">Quick message to the team</span><div class="chips" style="flex-wrap:wrap">${['Running 10 min late', 'Wear whites today', 'Venue changed, check the app', 'Great game, team!'].map((m) => `<button class="chip" data-act="mdMsg" data-msg="${m}">${ic('send')}${m}</button>`).join('')}</div></div>
      <button class="btn btn-primary btn-block" data-act="mdShare">${ic('share-2')}Share lineup with the team</button>
    </div>`;
  v.scrollTop = top;
}

/* ═════ 7. TURF & COURT BOOKING ═════ */
const VB = (id) => VENUES_BOOK.find((v) => v.id === id);
const hourLabel = (h) => new Intl.DateTimeFormat('en-IN', { hour: 'numeric' }).format(dateAt(0, pad2(h % 24) + ':00'));
const isPeak = (d, h) => { const wd = dateAt(d, '12:00').getDay(); return h >= 18 || wd === 0 || wd === 6; };
const slotPrice = (v, d, h) => (isPeak(d, h) ? v.peak : v.price);
function slotState(v, ci, d, h) {
  if (d === 0 && h <= new Date().getHours()) return 'past';
  if ((S.turf || []).some((b) => b.vid === v.id && b.court === ci && b.d === d && b.hours.includes(h))) return 'mine';
  const vi = VENUES_BOOK.indexOf(v); return ((vi * 31 + ci * 17 + d * 13 + h * 7) % 10) < 3 ? 'booked' : 'free';
}
function nextFree(v) { for (let d = 0; d < 7; d++) for (let h = 6; h < 23; h++) for (let c = 0; c < v.courts.length; c++) if (slotState(v, c, d, h) === 'free') return { d, h }; return null; }
function modeSegHTML() { const m = S.mode || 'games'; return `<div class="seg seg-sm" role="group" aria-label="Show"><button data-act="mode" data-id="games" aria-pressed="${m === 'games'}">Games</button><button data-act="mode" data-id="venues" aria-pressed="${m === 'venues'}">Book venue</button></div>`; }
function renderVenues() {
  const q = S.query.trim().toLowerCase();
  const list = VENUES_BOOK.filter((v) => (S.filter === 'all' || v.sports.includes(S.filter)) && (!q || (v.name + ' ' + v.sports.join(' ')).toLowerCase().includes(q))).sort((a, b) => kmFrom(a.x, a.y) - kmFrom(b.x, b.y));
  $('#pins').innerHTML = `<div class="me-dot" data-x="${ME.x}" data-y="${ME.y}"></div>` + list.map((v) => `<button class="pin venue" style="--c:${sp(v.sports[0]).c}" data-x="${v.x}" data-y="${v.y}" data-act="venue" data-id="${v.id}" aria-label="Book ${esc(v.name)}"><span class="pin-body"><span class="glyph">${ic(sp(v.sports[0]).icon)}</span><span class="pin-label num">${inr(v.price)}/hr</span></span></button>`).join('');
  Map.apply();
  $('#nearbyHead').innerHTML = `<div><div class="eyebrow">Turfs & courts · by the hour</div><h2>${list.length} venue${list.length === 1 ? '' : 's'} to book</h2></div>${modeSegHTML()}`;
  $('#nearbyList').innerHTML = list.length ? list.map((v) => { const nf = nextFree(v); return `<div class="act" style="--c:${sp(v.sports[0]).c}">
    <button class="act-img" data-act="venue" data-id="${v.id}" aria-label="Open ${esc(v.name)}"><img src="${IMG + v.img}.jpg" alt="" loading="lazy"><span class="glyph">${ic(sp(v.sports[0]).icon)}</span></button>
    <div class="act-main"><button class="act-title" style="text-align:left" data-act="venue" data-id="${v.id}">${esc(v.name)}</button>
      <div class="act-meta"><span class="rating">${ic('star')}<span class="num">${v.rating} (${v.reviews})</span></span><span>${ic('navigation')}${fmtKm(kmFrom(v.x, v.y))}</span><span>${v.setting}</span></div>
      <div class="act-meta"><span>${ic('clock')}${nf ? `Next free: ${dayLabel(nf.d)} ${hourLabel(nf.h)}` : 'Fully booked this week'}</span></div>
      <div class="act-foot"><span class="spots"><b class="num" style="font-size:15px;color:var(--ink)">${inr(v.price)}</b><span>per hour, off-peak</span></span><button class="btn btn-primary btn-sm" data-act="venue" data-id="${v.id}">Book a slot</button></div>
    </div></div>`; }).join('') : `<div class="empty">${ic('search')}<b>No venues for this sport yet</b><button class="btn btn-soft btn-sm" data-act="clearFilters">Show all venues</button></div>`;
}
let TB = null;
function openVenue(id) { TB = { vid: id, court: 0, d: 0, hours: [] }; popAll(); const v = push(''); v.id = 'venueView'; renderVenueView(); }
function renderVenueView() {
  const view = $('#venueView'); if (!view) return; const top = view.scrollTop; const v = VB(TB.vid);
  const hrs = []; for (let h = 6; h < 23; h++) hrs.push(h);
  const total = TB.hours.reduce((n, h) => n + slotPrice(v, TB.d, h), 0);
  view.innerHTML = `<div class="view-hero" style="height:230px"><img src="${IMG + v.img}.jpg" alt="">
      <div class="view-nav"><button data-act="back" aria-label="Back">${ic('arrow-left')}</button><button data-act="share" aria-label="Share">${ic('share-2')}</button></div>
      <div class="hero-cap"><div style="display:flex;gap:6px;flex-wrap:wrap">${v.sports.map((k) => `<span class="badge" style="background:${sp(k).c};color:#fff">${ic(sp(k).icon)}${sp(k).name}</span>`).join('')}<span class="badge">${v.setting}</span></div><h1>${esc(v.name)}</h1><div class="num">${ic('star', 'ic-sm')} ${v.rating} · ${v.reviews} reviews · ${fmtKm(kmFrom(v.x, v.y))} away</div></div></div>
    <div class="view-body">
      <div class="chips" style="flex-wrap:wrap">${v.amenities.map((a) => `<span class="chip" style="height:32px;font-size:13px">${ic('check', 'ic-sm')}${a}</span>`).join('')}</div>
      ${v.courts.length > 1 ? `<div class="field"><span class="lbl">Court</span><div class="seg seg-scroll">${v.courts.map((c, i) => `<button data-act="turfCourt" data-id="${i}" aria-pressed="${TB.court === i}">${esc(c)}</button>`).join('')}</div></div>` : ''}
      <div class="field"><span class="lbl">Date</span><div class="weekstrip daypick">${[0, 1, 2, 3, 4, 5, 6].map((d) => { const dt = dateAt(d, '12:00'); return `<button data-act="turfDay" data-id="${d}" aria-pressed="${TB.d === d}">${wkFmt.format(dt)}<b class="num">${dt.getDate()}</b><span style="height:5px"></span></button>`; }).join('')}</div></div>
      <div class="field"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><span class="lbl">Pick your hours</span><span class="faint" style="font-size:12px">Up to 4 in a row</span></div>
        <div class="legend"><span><i class="lg-free"></i>Free</span><span><i class="lg-peak"></i>Peak</span><span><i class="lg-booked"></i>Booked</span><span><i class="lg-sel"></i>Selected</span></div>
        <div class="slots">${hrs.map((h) => { const st = slotState(v, TB.court, TB.d, h), sel = TB.hours.includes(h), pk = isPeak(TB.d, h);
          return `<button class="slot s-${st} ${pk ? 'peak' : ''} ${sel ? 'sel' : ''}" data-act="turfSlot" data-h="${h}" ${st === 'free' ? '' : 'disabled'} aria-pressed="${sel}" aria-label="${hourLabel(h)} to ${hourLabel(h + 1)}, ${st === 'free' ? inr(slotPrice(v, TB.d, h)) : st}"><b>${hourLabel(h)}</b><small class="num">${st === 'free' ? inr(slotPrice(v, TB.d, h)) : st === 'mine' ? 'Yours' : st === 'past' ? '—' : 'Booked'}</small></button>`; }).join('')}</div>
        <div class="faint" style="font-size:12.5px">Off-peak ${inr(v.price)}/hr. Peak ${inr(v.peak)}/hr after 6 pm and at weekends. Free cancellation up to 6 hours before.</div></div>
    </div>
    <div class="view-cta"><div class="price"><span class="faint" style="font-size:12px">${TB.hours.length ? `${TB.hours.length} hr · ${hourLabel(TB.hours[0])}–${hourLabel(TB.hours[TB.hours.length - 1] + 1)}` : 'No slot selected'}</span><b class="num">${TB.hours.length ? inr(total) : '—'}</b></div>
      <button class="btn btn-primary" data-act="turfNext" ${TB.hours.length ? '' : 'disabled'}>Continue</button></div>`;
  view.scrollTop = top;
}
let TC = null;
function turfCheckout() {
  const v = VB(TB.vid); const total = TB.hours.reduce((n, h) => n + slotPrice(v, TB.d, h), 0);
  if (!TC) TC = { split: true, players: 10, team: null };
  const share = Math.ceil(total / TC.players);
  sheetSet(`${sheetHead('Confirm booking', `${esc(v.name)} · ${esc(v.courts[TB.court])}`)}
    <div class="rows"><div class="row">${ic('calendar', 'lead')}<div class="grow"><b>${longFmt.format(dateAt(TB.d, '12:00'))}</b><small>${hourLabel(TB.hours[0])} to ${hourLabel(TB.hours[TB.hours.length - 1] + 1)} · ${TB.hours.length} hour${TB.hours.length > 1 ? 's' : ''}</small></div></div>
      ${TB.hours.map((h) => `<div class="row" style="min-height:44px;padding-block:8px"><div class="grow"><small>${hourLabel(h)}–${hourLabel(h + 1)}${isPeak(TB.d, h) ? ' · peak' : ''}</small></div><span class="num">${inr(slotPrice(v, TB.d, h))}</span></div>`).join('')}
      <div class="row"><div class="grow"><b>Total</b></div><b class="num">${inr(total)}</b></div></div>
    <div class="field"><span class="lbl">How do you want to pay?</span><div class="seg"><button data-act="tcSplit" data-id="0" aria-pressed="${!TC.split}">Pay in full</button><button data-act="tcSplit" data-id="1" aria-pressed="${TC.split}">Split with players</button></div></div>
    ${TC.split ? `<div class="card" style="padding:14px;display:grid;gap:12px">
        ${S.teams.length && can.teams() ? `<div class="chips">${S.teams.map((t) => `<button class="chip" data-act="tcTeam" data-id="${t.id}" aria-pressed="${TC.team === t.id}">${ic('users')}${esc(t.name)}</button>`).join('')}<button class="chip" data-act="tcTeam" data-id="" aria-pressed="${!TC.team}">${ic('user-plus')}Pick players</button></div>` : ''}
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div><b>Players sharing</b><div class="faint" style="font-size:13px">Including you</div></div><div class="stepper"><button data-act="tcPlayers" data-d="-1" aria-label="Fewer players">${ic('minus', 'ic-sm')}</button><b class="num">${TC.players}</b><button data-act="tcPlayers" data-d="1" aria-label="More players">${ic('plus', 'ic-sm')}</button></div></div>
        <div style="display:flex;justify-content:space-between;align-items:baseline"><span class="muted">Each pays</span><b class="num" style="font-family:var(--f-display);font-size:28px">${inr(share)}</b></div>
        <div class="faint" style="font-size:12.5px">You pay your share now to lock the slot. The others get a UPI payment request and a WhatsApp reminder. Unpaid shares are charged to you 2 hours before the game.</div></div>` : ''}
    <div class="field"><span class="lbl">Pay via UPI</span><div class="chips" id="tcApp">${UPI_APPS.map((u, i) => `<button type="button" class="chip" data-act="pickOne" data-group="tcApp" data-id="${u}" aria-pressed="${i === 0}">${ic('smartphone')}${u}</button>`).join('')}</div></div>
    <button class="btn btn-primary btn-block" style="min-height:54px" data-act="turfPay" id="tcGo">${ic('smartphone')}Pay ${inr(TC.split ? share : total)} via UPI</button>`, 'turf');
}
function turfPay() {
  const v = VB(TB.vid); const total = TB.hours.reduce((n, h) => n + slotPrice(v, TB.d, h), 0); const share = TC.split ? Math.ceil(total / TC.players) : total;
  const appBtn = $('#tcApp [aria-pressed="true"]'); const go2 = $('#tcGo'); go2.disabled = true; go2.innerHTML = `${ic('smartphone')}Waiting for ${appBtn ? appBtn.dataset.id : 'UPI'}…`;
  setTimeout(() => {
    const team = TC.team ? S.teams.find((t) => t.id === TC.team) : null;
    const names = TC.split ? (team ? team.members.slice(1).map((m) => m.name) : PEOPLE.map((p) => p.name)).concat(Array.from({ length: 22 }, (_, i) => 'Player ' + (i + 2))).slice(0, TC.players - 1) : [];
    const b = { id: 'LP' + String(Date.now()).slice(-6), vid: v.id, court: TB.court, d: TB.d, hours: TB.hours.slice(), total, split: TC.split, share, players: names };
    S.turf = S.turf || []; S.turf.push(b);
    notes().unshift({ id: 'n' + Date.now(), pri: 'info', cat: 'booking', icon: 'circle-check', when: 'Just now', title: `Venue booked: ${v.name}`, body: `${v.courts[b.court]}, ${dayLabel(b.d)} ${hourLabel(b.hours[0])}–${hourLabel(b.hours[b.hours.length - 1] + 1)}. Booking ${b.id}.${b.split ? ` ${names.length} payment requests sent.` : ''}`, actions: [['Open My games', 'games']], read: false });
    save(); TC = null; popAll();
    openSheet(`<div class="success"><div class="burst">${ic('check')}</div><h2>Slot booked</h2>
      <div class="muted">${esc(v.name)} · ${esc(v.courts[b.court])}<br>${longFmt.format(dateAt(b.d, '12:00'))}, ${hourLabel(b.hours[0])}–${hourLabel(b.hours[b.hours.length - 1] + 1)}<br><span class="num">Booking ${b.id}</span></div></div>
      ${b.split ? `<div class="field"><span class="lbl">Split payment · 1 of ${names.length + 1} paid</span><div class="rows">
        <div class="row">${avatar(ME_USER, 32)}<div class="grow"><b>You</b></div><span class="badge free num">Paid ${inr(share)}</span></div>
        ${names.slice(0, 4).map((n) => `<div class="row">${avatar({ name: n }, 32)}<div class="grow"><b>${esc(n)}</b></div><span class="badge num">Requested ${inr(share)}</span></div>`).join('')}
        ${names.length > 4 ? `<div class="row"><div class="grow"><small>+${names.length - 4} more requested</small></div></div>` : ''}</div></div>
        <button class="btn btn-soft btn-block" data-act="toastMsg" data-msg="Reminder sent on WhatsApp to ${names.length} players" data-icon="send">${ic('send')}Remind unpaid players</button>` : ''}
      <button class="btn btn-primary btn-block" data-act="turfPost" data-id="${v.id}">${ic('megaphone')}Post open spots as a game</button>
      <button class="btn btn-ghost btn-block" data-act="gotoGames">See it in My games</button>`);
  }, 1100);
}
function turfListHTML() {
  const list = (S.turf || []).filter((b) => b.d >= 0).sort((a, b) => a.d - b.d || a.hours[0] - b.hours[0]);
  return `<div class="section"><div class="section-head"><h2>Venue bookings</h2><button class="link" data-act="mode" data-id="venues">${ic('plus', 'ic-sm')} Book</button></div>
    ${list.length ? list.map((b) => { const v = VB(b.vid); return `<div class="card" style="padding:10px;display:grid;grid-template-columns:64px 1fr;gap:12px;align-items:center"><img src="${IMG + v.img}.jpg" alt="" style="width:64px;height:64px;border-radius:12px;object-fit:cover">
      <div style="min-width:0;display:grid;gap:3px"><b>${esc(v.name)}</b><small class="faint">${esc(v.courts[b.court])} · ${dayLabel(b.d)} ${hourLabel(b.hours[0])}–${hourLabel(b.hours[b.hours.length - 1] + 1)} · <span class="num">${b.id}</span></small>
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><span class="badge free num">${inr(b.total)}</span>${b.split ? `<span class="badge num">1 of ${b.players.length + 1} paid</span><button class="link" style="font-size:13px" data-act="toastMsg" data-msg="Reminder sent on WhatsApp" data-icon="send">Remind</button>` : '<span class="badge">Paid in full</span>'}</div></div></div>`; }).join('')
      : `<button class="biz" style="background:var(--surface);color:var(--ink);border:1px solid var(--line)" data-act="mode" data-id="venues">${ic('calendar-days')}<div class="grow"><b>Book a turf or court</b><small class="muted">Pick an hour, split the cost with your players over UPI.</small></div>${ic('chevron-right')}</button>`}</div>`;
}

/* ── wrap My games list view ── */
const renderGamesList = renderGames;
renderGames = function () {
  if (S.gamesView === 'calendar') { renderFamilyCal(); return; }
  renderGamesList();
  const head = $('#scr-games .page-head'); if (!head) return;
  head.lastElementChild.outerHTML = bellHTML();
  head.insertAdjacentHTML('afterend', gamesSegHTML() + attentionHTML());
  $('#scr-games').insertAdjacentHTML('beforeend', turfListHTML());
};

Object.assign(A, {
  /* filters */
  advOpen: () => { if (S.mode === 'venues') { toast('Filters apply to games. Use the sport chips for venues', 'info'); return; } advSheet(); },
  advSet: (el) => { adv()[el.dataset.k] = el.dataset.id; advChanged(); },
  advAccess: () => { adv().access = !adv().access; advChanged(); },
  advReset: () => { S.adv = Object.assign({}, ADV0); advChanged(); },
  clearFilters: () => { S.filter = 'all'; S.query = ''; S.adv = Object.assign({}, ADV0); if ($('#q')) $('#q').value = ''; save(); renderExploreChrome(); },
  /* registration */
  join: (el) => regStart(el.dataset.id),
  regWho: (el) => { const id = el.dataset.id; REG.who = REG.who.includes(id) ? REG.who.filter((x) => x !== id) : REG.who.concat(id); el.setAttribute('aria-pressed', REG.who.includes(id)); },
  regNext: () => regNext(),
  regBack: () => { REG.step = Math.max(0, REG.step - 1); REG.err = ''; regRender(); },
  regFail: () => { REG.failNext = true; toast('The next payment will fail so you can see how errors work', 'info'); },
  waitJoin: (el) => { S.waitlist = S.waitlist || []; if (!S.waitlist.includes(el.dataset.id)) S.waitlist.push(el.dataset.id); save(); waitlistSheet(allActs().find((a) => a.id === el.dataset.id)); if (tab === 'explore') renderPinsAndList(); toast('You’re on the waitlist', 'timer'); },
  waitLeave: (el) => { S.waitlist = (S.waitlist || []).filter((x) => x !== el.dataset.id); save(); closeSheet(); if (tab === 'explore') renderPinsAndList(); toast('Removed from the waitlist', 'check'); },
  similar: (el) => { const a = allActs().find((x) => x.id === el.dataset.id); closeSheet(true); popAll(); S.filter = a.sport; S.mode = 'games'; save(); go('explore'); toast(`Showing other ${sp(a.sport).name.toLowerCase()} games`, 'search'); },
  /* calendar */
  gamesView: (el) => { S.gamesView = el.dataset.id; save(); if (tab !== 'games') go('games'); else renderGames(); },
  calWho: (el) => { S.calWho = el.dataset.id; renderFamilyCal(); },
  calDay: (el) => { S.calDay = +el.dataset.id; renderFamilyCal(); },
  calOpen: (el) => { const k = el.dataset.kind, id = el.dataset.id; if (k === 'game') openAct(id); else if (k === 'team') openTeam(id); else if (k === 'turf') { S.gamesView = 'list'; go('games'); } },
  clashSlot: (el) => { S.filter = el.dataset.sport; S.mode = 'games'; save(); go('explore'); toast(`Showing other ${sp(el.dataset.sport).name.toLowerCase()} sessions`, 'search'); },
  /* notifications */
  notes: () => { closeSheet(true); openNotes(); },
  noteTab: (el) => { noteTab = el.dataset.id; renderNotes(); },
  noteAct: (el) => { if (el.dataset.do === 'games') { go('games'); return; } noteAct(el.dataset.id, el.dataset.do); },
  notePrefs: () => notePrefsSheet(),
  prefToggle: (el) => { const P = prefs(); P[el.dataset.id] = !P[el.dataset.id]; save(); notePrefsSheet(); renderNotes(); },
  /* coach */
  matchDay: (el) => openMatchDay(el.dataset.id),
  mdAtt: (el) => { const M = S.md[mdTeam]; M.att[el.dataset.i] = M.att[el.dataset.i] === el.dataset.s ? '' : el.dataset.s; save(); renderMD(); },
  mdLineup: (el) => { const M = S.md[mdTeam], i = +el.dataset.i, t = S.teams.find((x) => x.id === mdTeam); const p = M.lineup.indexOf(i);
    if (p >= 0) M.lineup.splice(p, 1); else { if (M.lineup.length >= (LINEUP_SIZE[t.sport] || 6)) { toast('The lineup is full. Bench someone first', 'info'); return; } M.lineup.push(i); } save(); renderMD(); },
  mdCap: (el) => { S.md[mdTeam].cap = +el.dataset.i; save(); renderMD(); },
  mdMsg: (el) => { const t = S.teams.find((x) => x.id === mdTeam); toast(`Sent to ${t.members.length - 1} players: “${el.dataset.msg}”`, 'send'); },
  mdNudge: () => toast('Reminder sent to players who haven’t replied', 'send'),
  mdShare: () => toast('Lineup shared to the team chat and WhatsApp', 'share-2'),
  /* venues */
  mode: (el) => { S.mode = el.dataset.id; save(); popAll(); if (tab !== 'explore') go('explore'); else { deselect(); renderExploreChrome(); } if (S.mode === 'venues') Sheet.set(1); },
  venue: (el) => openVenue(el.dataset.id),
  turfCourt: (el) => { TB.court = +el.dataset.id; TB.hours = []; renderVenueView(); },
  turfDay: (el) => { TB.d = +el.dataset.id; TB.hours = []; renderVenueView(); },
  turfSlot: (el) => { const h = +el.dataset.h, H = TB.hours;
    if (H.includes(h)) { TB.hours = h === H[0] || h === H[H.length - 1] ? H.filter((x) => x !== h) : [h]; }
    else if (!H.length || h === H[0] - 1 || h === H[H.length - 1] + 1) { if (H.length >= 4) { toast('Book up to 4 hours at a time', 'info'); return; } TB.hours = H.concat(h).sort((a, b) => a - b); }
    else TB.hours = [h];
    renderVenueView(); },
  turfNext: () => { TC = null; turfCheckout(); },
  tcSplit: (el) => { TC.split = el.dataset.id === '1'; turfCheckout(); },
  tcTeam: (el) => { TC.team = el.dataset.id || null; if (TC.team) TC.players = S.teams.find((t) => t.id === TC.team).members.length; turfCheckout(); },
  tcPlayers: (el) => { TC.players = Math.max(2, Math.min(22, TC.players + +el.dataset.d)); turfCheckout(); },
  turfPay: () => turfPay(),
  turfPost: (el) => { const v = VB(el.dataset.id); closeSheet(true); if (!can.pin()) { upsell('pin'); return; } Host.draft = null; openHost({ x: v.x, y: v.y, name: v.name, address: addrOf(v.x, v.y), setting: v.setting }); },
});

/* registration inputs write straight into the draft, so nothing is lost between steps */
document.addEventListener('input', (e) => { const p = e.target.dataset && e.target.dataset.r; if (!p || !REG) return; const keys = p.split('.'); let o = REG; keys.slice(0, -1).forEach((k) => (o = o[k])); o[keys[keys.length - 1]] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; });
document.addEventListener('change', (e) => { const p = e.target.dataset && e.target.dataset.r; if (!p || !REG || e.target.type !== 'checkbox') return; const keys = p.split('.'); let o = REG; keys.slice(0, -1).forEach((k) => (o = o[k])); o[keys[keys.length - 1]] = e.target.checked; });

/* ═════ 8. ADD PLAYERS TO A TEAM (Pro) + SHARE TO ANY APP ═════ */
let AP = null;
const teamCodeOf = (t) => t.name.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase() + '-' + (1000 + (t.id.length * 7919 + t.name.length * 31) % 9000);
const teamLink = (t) => 'https://letsplay.app/join/' + teamCodeOf(t).toLowerCase();
function openAddPlayers(tid, fresh) {
  if (!can.teams()) { upsell('teams'); return; }
  const t = S.teams.find((x) => x.id === tid); if (!t) { A.newTeam(); return; }
  AP = { tid, q: '', sport: t.sport, km: 'any', lft: false, sel: [], fresh: !!fresh };
  popAll(); const v = push(''); v.id = 'apView'; renderAP();
}
function apList() {
  const q = AP.q.trim().toLowerCase();
  return PLAYERS.filter((p) => (AP.sport === 'all' || p.sports.includes(AP.sport)) && (AP.km === 'any' || p.km <= +AP.km) && (!AP.lft || p.lft) &&
    (!q || (p.name + ' ' + p.sports.map((s) => SPORTS[s].name).join(' ')).toLowerCase().includes(q))).sort((a, b) => a.km - b.km);
}
function apRow(p, t) {
  const inTeam = t.members.some((m) => m.name === p.name && m.status !== 'invited');
  const invited = t.members.some((m) => m.name === p.name && m.status === 'invited');
  const on = AP.sel.includes(p.id);
  return `<button class="row ap-row" ${inTeam || invited ? 'aria-disabled="true"' : `data-act="apToggle" data-id="${p.id}" aria-pressed="${on}"`}>
    ${avatar(p, 44)}
    <div class="grow" style="min-width:0"><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><b>${esc(p.name)}</b>${p.lft ? '<span class="badge free">Looking for a team</span>' : ''}</div>
      <small>${p.sports.map((s) => SPORTS[s].name).join(' · ')} · ${p.level} · ${p.games} games</small><small class="ellip">${esc(p.bio)}</small></div>
    <div class="ap-side"><span class="km num">${p.km < 1 ? Math.round(p.km * 1000) + ' m' : p.km.toFixed(1) + ' km'}</span>${inTeam ? '<span class="badge">In team</span>' : invited ? '<span class="badge brand">Invited</span>' : `<span class="tickbox">${ic('check')}</span>`}</div></button>`;
}
function renderAP() {
  const v = $('#apView'); if (!v) return; const top = v.scrollTop; const t = S.teams.find((x) => x.id === AP.tid); const list = apList();
  const bands = [[0, 1, 'Within 1 km'], [1, 3, '1–3 km away'], [3, 99, 'More than 3 km']];
  const sportsList = ['all'].concat(Object.keys(SPORTS).filter((k) => PLAYERS.some((p) => p.sports.includes(k))));
  v.innerHTML = `<div class="view-bar"><button class="icon-btn" data-act="back" aria-label="Back">${ic('arrow-left')}</button><h2>Add players</h2><button class="icon-btn" data-act="shareTeam" data-id="${t.id}" aria-label="Share invite">${ic('share-2')}</button></div>
    <div class="view-body" style="padding-top:4px">
      <div class="card" style="padding:12px 14px;display:flex;gap:12px;align-items:center"><span class="crest" style="--c:${t.color}">${esc(t.name.split(' ').map((w) => w[0]).join('').slice(0, 2))}</span><div class="grow" style="min-width:0"><b style="font-size:17px">${esc(t.name)}</b><div class="faint" style="font-size:13px">${SPORTS[t.sport].name} · ${t.members.length} member${t.members.length === 1 ? '' : 's'}${AP.fresh ? ' · new team' : ''}</div></div></div>
      <div class="share-card"><div class="grow" style="min-width:0"><b>Invite anyone with a link</b><div class="faint ellip" style="font-size:13px">${teamLink(t)}</div></div><button class="btn btn-primary btn-sm" data-act="shareTeam" data-id="${t.id}">${ic('share-2', 'ic-sm')}Share</button></div>
      <label class="search" style="box-shadow:none">${ic('search')}<input id="apQ" type="search" placeholder="Search players by name or sport" value="${esc(AP.q)}" aria-label="Search players"></label>
      <div class="chips">${sportsList.map((k) => `<button class="chip ${k !== 'all' ? 'sport' : ''}" style="${k !== 'all' ? '--c:' + SPORTS[k].c : ''}" data-act="apSport" data-id="${k}" aria-pressed="${AP.sport === k}">${k === 'all' ? ic('layers') + 'All sports' : ic(SPORTS[k].icon) + SPORTS[k].name}</button>`).join('')}</div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><div class="seg seg-sm" style="flex:1;min-width:220px">${[['1', '1 km'], ['3', '3 km'], ['5', '5 km'], ['any', 'Any']].map(([k, l]) => `<button data-act="apKm" data-id="${k}" aria-pressed="${AP.km === k}">${l}</button>`).join('')}</div>
        <button class="chip" data-act="apLft" aria-pressed="${AP.lft}">${ic('user-plus')}Looking for a team</button></div>
      <div class="faint" style="font-size:12.5px;display:flex;gap:6px;align-items:center">${ic('navigation', 'ic-sm')}${list.length} player${list.length === 1 ? '' : 's'}, nearest first</div>
      ${list.length ? bands.map(([lo, hi, label]) => { const g = list.filter((p) => p.km >= lo && p.km < hi); return g.length ? `<div class="day-group"><div class="day-label">${label}</div><div class="rows">${g.map((p) => apRow(p, t)).join('')}</div></div>` : ''; }).join('')
        : `<div class="empty card">${ic('search')}<b>No players match</b><span>Widen the distance or share the invite link instead.</span><button class="btn btn-soft btn-sm" data-act="shareTeam" data-id="${t.id}">${ic('share-2', 'ic-sm')}Share invite</button></div>`}
    </div>
    <div class="view-cta"><div class="price"><span class="faint" style="font-size:12px">Selected</span><b class="num">${AP.sel.length}</b></div><button class="btn btn-primary" data-act="apAdd" ${AP.sel.length ? '' : 'disabled'}>${ic('user-plus')}${AP.sel.length ? `Add ${AP.sel.length} player${AP.sel.length > 1 ? 's' : ''}` : 'Select players'}</button></div>`;
  v.scrollTop = top;
  const qi = $('#apQ', v); qi.addEventListener('input', () => { AP.q = qi.value; const pos = qi.selectionStart; renderAP(); const n = $('#apQ'); n.focus(); n.setSelectionRange(pos, pos); });
}

/* Share to any app: the phone's own share sheet when available, otherwise app links and copy */
async function shareAny(title, text, url) {
  if (navigator.share) { try { await navigator.share({ title, text, url }); toast('Shared', 'share-2'); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
  const full = `${text} ${url}`, enc = encodeURIComponent;
  const apps = [
    ['WhatsApp', '#25D366', 'message-circle', `https://wa.me/?text=${enc(full)}`],
    ['Telegram', '#229ED9', 'send', `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`],
    ['SMS', '#13A04B', 'smartphone', `sms:?&body=${enc(full)}`],
    ['Email', '#E0611A', 'send', `mailto:?subject=${enc(title)}&body=${enc(full)}`],
    ['Facebook', '#1877F2', 'globe', `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`],
    ['X', '#0D1530', 'share-2', `https://twitter.com/intent/tweet?text=${enc(full)}`],
  ];
  sheetSet(`${sheetHead('Share', esc(title))}
    <div class="share-grid">${apps.map(([n, c, i, href]) => `<a class="share-app" href="${href}" target="_blank" rel="noopener" style="--c:${c}"><span>${ic(i)}</span>${n}</a>`).join('')}
      <button class="share-app" data-act="copyShare" style="--c:var(--ink-2)"><span>${ic('copy')}</span>Copy link</button></div>
    <div class="field"><span class="lbl">Message</span><div class="copybox" style="align-items:flex-start"><code id="shareTxt" style="white-space:normal">${esc(full)}</code></div></div>
    <div class="faint" style="font-size:12.5px">On a phone, the installed app opens your phone’s share menu so you can send it to any app.</div>`, 'share');
}

Object.assign(A, {
  addPlayers: (el) => (el.dataset.id ? openAddPlayers(el.dataset.id) : A.newTeam()),
  apToggle: (el) => { const id = el.dataset.id; AP.sel = AP.sel.includes(id) ? AP.sel.filter((x) => x !== id) : AP.sel.concat(id); renderAP(); },
  apSport: (el) => { AP.sport = el.dataset.id; renderAP(); },
  apKm: (el) => { AP.km = el.dataset.id; renderAP(); },
  apLft: () => { AP.lft = !AP.lft; renderAP(); },
  apAdd: () => { const t = S.teams.find((x) => x.id === AP.tid); const add = PLAYERS.filter((p) => AP.sel.includes(p.id));
    add.forEach((p) => t.members.push({ name: p.name, role: 'Player', status: 'invited', pid: p.id })); save();
    const n = add.length; AP = null; popAll(); renderTeams(); openTeam(t.id);
    toast(`${n} player${n > 1 ? 's' : ''} invited. They’ll get a notification`, 'user-plus'); },
  shareTeam: (el) => { const t = S.teams.find((x) => x.id === el.dataset.id); shareAny(`Join ${t.name} on LetsPlay`, `Join my ${SPORTS[t.sport].name.toLowerCase()} team ${t.name} on LetsPlay. Team code ${teamCodeOf(t)}.`, teamLink(t)); },
  share: (el) => { const a = el.dataset.id && allActs().find((x) => x.id === el.dataset.id);
    if (a) shareAny(a.title, `${a.title} · ${when(a)} at ${a.venue}. ${spotsLeft(a)} spots left, ${money(a.price)}. Join me on LetsPlay:`, 'https://letsplay.app/g/' + a.id);
    else shareAny('LetsPlay', 'Find games and book turfs near you on LetsPlay:', 'https://letsplay.app'); },
  shareGame: () => shareAny('My game on LetsPlay', 'I’m hosting a game on LetsPlay. Join here:', 'https://letsplay.app/g/new'),
  copyShare: () => { const txt = $('#shareTxt').textContent; try { navigator.clipboard.writeText(txt).then(() => toast('Copied. Paste it into any app', 'copy'), () => { selectText('shareTxt'); toast('Selected. Copy it from the menu', 'copy'); }); } catch (e) { selectText('shareTxt'); } },
});
