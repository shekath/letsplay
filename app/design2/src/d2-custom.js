/* ═════ CUSTOM SPORTS (Pro, Corporate) · HOSTING LIST ═════
   Pro and Corporate users can add their own sports and indoor games (carrom, table tennis, chess…) with a drawn
   icon or their own photo. Custom sports join SPORTS, so they appear wherever a sport is picked.
   The hosting list keeps every game you hosted; a game can be deleted from the day after its event date. */

/* Drawn icons for games the built-in set lacks (24 × 24, stroke). */
Object.assign(GLYPHS, {
  'g-carrom': '<rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="6.5" cy="6.5" r="1.3"/><circle cx="17.5" cy="6.5" r="1.3"/><circle cx="6.5" cy="17.5" r="1.3"/><circle cx="17.5" cy="17.5" r="1.3"/><circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r=".8"/>',
  'g-tabletennis': '<circle cx="9.5" cy="9.5" r="6"/><path d="m13.8 13.8 5.5 5.5"/><path d="m17.6 21 3.4-3.4"/><circle cx="19" cy="5" r="2"/>',
  'g-chess': '<path d="M7 21h10M8.5 18h7l-1.2-5.5h-4.6z"/><path d="M9.2 12.5h5.6"/><path d="M10 12.5c-1.6-1-2-2.6-1.2-4A3.4 3.4 0 0 1 12 6.5a3.4 3.4 0 0 1 3.2 2c.8 1.4.4 3-1.2 4"/><path d="M12 2v3M10.5 3.5h3"/>',
  'g-darts': '<circle cx="11" cy="13" r="8"/><circle cx="11" cy="13" r="4"/><circle cx="11" cy="13" r=".9"/><path d="m11 13 9-9"/><path d="M17 3.5h3.5V7"/>',
  'g-pool': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.2"/><circle cx="12" cy="10.6" r="1.2"/><circle cx="12" cy="13.5" r="1.5"/>',
  'g-bowling': '<path d="M8 3c-1.5 0-2 1.5-1.6 3 .3 1.2.1 2-.7 3.4C4.3 12 4.6 17 6 21h4c1.4-4 1.7-9 .3-11.6-.8-1.4-1-2.2-.7-3.4C10 4.5 9.5 3 8 3z"/><circle cx="17" cy="16" r="4.5"/><circle cx="15.9" cy="14.5" r=".6"/><circle cx="18" cy="14.5" r=".6"/>',
  'g-foosball': '<path d="M2 8h20M2 16h20"/><rect x="5.5" y="4.5" width="3.5" height="7" rx="1.2"/><rect x="15" y="12.5" width="3.5" height="7" rx="1.2"/>',
  'g-frisbee': '<ellipse cx="12" cy="12.5" rx="9.5" ry="4.2"/><ellipse cx="12" cy="11.5" rx="5" ry="1.8"/>',
  'g-squash': '<ellipse cx="9" cy="8.5" rx="4.6" ry="6" transform="rotate(-35 9 8.5)"/><path d="m12.2 13.5 7 7"/><circle cx="18.5" cy="5.5" r="1.7"/>',
  'g-boxing': '<path d="M6 10a5 5 0 0 1 10 0v4a4 4 0 0 1-4 4H9a3 3 0 0 1-3-3z"/><path d="M6 12.5H4.6a1.6 1.6 0 0 1 0-3.2H6"/><path d="M8.5 18v3h6v-3"/>',
  'g-skate': '<path d="M5 3.5h5l1 7h6a2.5 2.5 0 0 1 2.5 2.5v2H5z"/><path d="M3.5 19h17"/><path d="M8 15v4M16 15v4"/>',
  'g-cards': '<rect x="3" y="5" width="11" height="15" rx="2" transform="rotate(-10 8.5 12.5)"/><rect x="10" y="4" width="11" height="15" rx="2"/><path d="m15.5 9 1.7 2.5-1.7 2.5-1.7-2.5z"/>',
});
const CUSTOM_ICONS = [['g-carrom', 'Carrom'], ['g-tabletennis', 'Table tennis'], ['g-chess', 'Chess'], ['g-darts', 'Darts'], ['g-pool', 'Pool'], ['g-bowling', 'Bowling'], ['g-foosball', 'Foosball'], ['g-squash', 'Squash'],
  ['g-frisbee', 'Frisbee'], ['g-boxing', 'Boxing'], ['g-skate', 'Skating'], ['g-cards', 'Cards'], ['dumbbell', 'Fitness'], ['person-standing', 'Kho-kho'], ['target', 'Target'], ['trophy', 'Other']];
const SPORT_COLORS = ['#B4442B', '#0F7A6C', '#2F5BD3', '#8A3FC2', '#B4580A', '#3F6F12', '#C2336B', '#4B5563'];
const IDEAS = [['Carrom', 'g-carrom', 'Indoor', 4], ['Table tennis', 'g-tabletennis', 'Indoor', 2], ['Chess', 'g-chess', 'Indoor', 2], ['Darts', 'g-darts', 'Indoor', 4], ['Pool', 'g-pool', 'Indoor', 2], ['Foosball', 'g-foosball', 'Indoor', 4]];

/* Make saved custom sports usable everywhere a sport is picked. A photo icon is drawn as a round image. */
function registerCustom(cs) {
  if (cs.photoIcon) GLYPHS['cs-' + cs.id] = `<image href="${cs.photoIcon}" x="0" y="0" width="24" height="24" preserveAspectRatio="xMidYMid slice" style="clip-path:circle(50%)"/>`;
  SPORTS[cs.id] = { name: cs.name, icon: cs.photoIcon ? 'cs-' + cs.id : cs.glyph, c: cs.c, custom: true };
  if (cs.archived) return;   /* archived: kept so finished games still show, but no longer offered */
  LINEUP_SIZE[cs.id] = cs.size;
  if (!TOUR_SPORTS.includes(cs.id)) TOUR_SPORTS.push(cs.id);
}
function unregisterCustom(id, keepForHistory) { delete LINEUP_SIZE[id]; const i = TOUR_SPORTS.indexOf(id); if (i >= 0) TOUR_SPORTS.splice(i, 1); if (!keepForHistory) { delete SPORTS[id]; delete GLYPHS['cs-' + id]; } }
const allCustom = () => S.customSports || [];
const customSports = () => allCustom().filter((c) => !c.archived);
const customIds = () => customSports().map((c) => c.id);
allCustom().forEach(registerCustom);
/* A "New sport" chip, placed at the end of sport pickers for Pro and Corporate. */
const newSportChip = (ret) => (can.pin() ? `<button class="chip neutral addsport" data-act="sportNew" data-id="${ret}">${ic('plus')}New sport</button>` : '');
/* Where a custom sport is in use, so it can't be deleted from under a game or team. */
function sportUsage(id) {
  const n = { games: S.hosted.filter((a) => a.sport === id && a.d >= 0).length, teams: S.teams.filter((t) => t.sport === id).length, places: S.places.filter((p) => p.sport === id).length,
    cteams: S.ws ? S.ws.cteams.filter((t) => t.sport === id).length : 0, tours: S.tournaments ? S.tournaments.filter((T) => T.sport === id && !tourStatus(T).done).length : 0 };
  return Object.entries(n).filter(([, v]) => v).map(([k, v]) => `${v} ${{ games: 'upcoming game', teams: 'team', places: 'place', cteams: 'company team', tours: 'running tournament' }[k]}${v > 1 ? 's' : ''}`);
}
function shrinkPhoto(dataUrl, px) {
  return new Promise((res) => { const img = new Image(); img.onload = () => { const c = document.createElement('canvas'), s = Math.min(img.width, img.height); c.width = c.height = px;
    c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, px, px); res(c.toDataURL('image/jpeg', 0.8)); }; img.src = dataUrl; });
}

/* ── Add or edit a sport ── */
let CS = null;
function sportSheet() {
  const C = CS, iconHTML = C.photoIcon ? `<img src="${C.photoIcon}" alt="">` : `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${GLYPHS[C.glyph] || ICONS[C.glyph]}</svg>`;
  sheetUpdate(`${head(C.id ? 'Edit sport' : 'New sport', 'For your games, teams and company events')}
    <div class="sp-prev" style="--c:${C.c}"><span class="sp-badge">${iconHTML}</span><div><b>${esc(C.name || 'Your sport')}</b><small>${C.setting} · ${C.size} a side</small></div><span class="chip sp-chip" style="--c:${C.c}" aria-hidden="true">${iconHTML}${esc(C.name || 'Sport')}</span></div>
    ${C.id ? '' : `<div class="fgrp"><b>Quick picks</b><div class="chips">${IDEAS.filter(([n]) => !customSports().some((x) => x.name.toLowerCase() === n.toLowerCase())).map(([n, g]) => `<button class="chip neutral" data-act="csIdea" data-id="${esc(n)}">${ic(g)}${n}</button>`).join('')}</div></div>`}
    <label class="fld"><span>Name</span><input id="csName" value="${esc(C.name)}" placeholder="For example Carrom" maxlength="24"></label>
    <div class="fgrp"><b>Icon</b><div class="icgrid">${CUSTOM_ICONS.map(([k, l]) => `<button class="icopt" data-act="csGlyph" data-id="${k}" aria-pressed="${!C.photoIcon && C.glyph === k}" aria-label="${l}">${ic(k)}</button>`).join('')}
      <label class="icopt photo ${C.photoIcon ? 'on' : ''}" aria-label="Use your own picture">${C.photoIcon ? `<img src="${C.photoIcon}" alt="">` : ic('camera')}<input type="file" accept="image/*" id="csPhoto"></label></div>
      <small class="faint" style="font-size:12.5px">Or use your own picture: tap the camera. It becomes the icon and the cover for games of this sport.</small></div>
    <div class="fgrp"><b>Colour</b><div class="swatches">${SPORT_COLORS.map((c) => `<button class="sw" style="--c:${c}" data-act="csColor" data-id="${c}" aria-pressed="${C.c === c}" aria-label="Colour ${c}"></button>`).join('')}</div></div>
    <div class="two"><div class="fgrp"><b>Setting</b><div class="seg" role="group" aria-label="Setting">${['Indoor', 'Outdoor'].map((s) => `<button data-act="csSet" data-id="${s}" aria-pressed="${C.setting === s}">${s}</button>`).join('')}</div></div>
      <div class="fgrp"><b>Players a side</b><div class="stepper"><button data-act="csSize" data-d="-1" aria-label="Fewer">${ic('minus')}</button><b class="num">${C.size}</b><button data-act="csSize" data-d="1" aria-label="More">${ic('plus')}</button></div></div></div>
    <div class="errbox" id="csErr" hidden>${ic('info')}<div></div></div>
    <button class="pill block" style="min-height:56px" data-act="csSave">${ic('check')}${C.id ? 'Save changes' : 'Add sport'}</button>
    ${C.id ? `<button class="pill block soft" data-act="csDelete" data-id="${C.id}">Delete sport</button>` : ''}`);
  $('#csName').addEventListener('input', (e) => { CS.name = e.target.value; $$('.sp-prev b').forEach((b) => (b.textContent = e.target.value || 'Your sport')); });
  const f = $('#csPhoto'); f.addEventListener('change', async () => { if (!f.files[0]) return; try { const full = await readPhoto(f.files[0]); CS.cover = full; CS.photoIcon = await shrinkPhoto(full, 96); sportSheet(); } catch (e) { toast('That picture could not be read. Try another', 'info'); } });
}
function sportsListSheet() {
  sheet(`${head('Your sports', 'Custom sports and indoor games')}
    ${customSports().length ? `<div class="lrows">${customSports().map((c) => rowHTML({ act: 'csEdit', id: c.id, lead: `<span class="sp-badge sm" style="--c:${c.c}">${ic(SPORTS[c.id].icon)}</span>`, title: esc(c.name), sub: `${c.setting} · ${c.size} a side${sportUsage(c.id).length ? ' · in use' : ''}` })).join('')}</div>`
      : `<div class="empty">${ic('g-carrom')}<b>No custom sports yet</b><span class="muted">Add carrom, table tennis, chess or anything your group plays.</span></div>`}
    <button class="pill block" data-act="sportNew" data-id="list">${ic('plus')}New sport</button>`);
}
/* After saving, go back to where "New sport" was tapped, with the new sport picked. */
function returnFromSport(ret, id) {
  if (ret === 'host' && HOST) { HOST.sport = id; hostSheet(); }
  else if (ret === 'team' && NT) { NT.sport = id; newTeamSheet(); }
  else if (ret === 'place' && NP) { NP.sport = id; addPlaceSheet(); }
  else if (ret === 'tour' && TD) { TD.sport = id; genSheet(); }
  else if (ret === 'fx' && FX) { FX.sport = id; fixtureSheet(); }
  else sportsListSheet();
}

/* ── Hosting list ── */
const ymd = (dt) => `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
const dayDiff = (iso) => Math.round((new Date(iso + 'T12:00:00') - dateAt(0, '12:00')) / 864e5);
/* Hosted games keep a real date, so "today", "yesterday" and deletion follow the calendar. */
S.hosted.forEach((a) => { if (!a.date) a.date = ymd(dateAt(a.d, '12:00')); a.d = dayDiff(a.date); });
if (!S.hostSeeded) {   /* one past game so the demo can show deletion */
  S.hosted.push({ id: 'h-past1', title: 'Sunday 5-a-side', sport: 'football', venue: 'Riverfront Maidan Turf, Nehru Marg, Riverfront', landmark: 'Gate 2', x: 690, y: 645, date: ymd(dateAt(-2, '12:00')), d: -2, t: '07:30', mins: 90, level: 'All levels', ages: '16+',
    spots: 0, total: 10, price: 100, host: 'Arjun Mehta', img: 'field', photo: null, setting: 'Outdoor', surface: 'Turf', equipment: 'Bibs provided.', access: 'Step-free entrance', cancel: 'Free cancellation up to 2 hours before.', hostedByYou: true, vis: 'everyone' });
  S.hostSeeded = true; save();
}
const canDelete = (a) => a.d <= -1;
const fullDate = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
function renderHosting() {
  const mine = S.hosted.filter((a) => a.hostedByYou).sort((a, b) => a.d - b.d || toMin(a.t) - toMin(b.t));
  const up = mine.filter((a) => a.d >= 0), past = mine.filter((a) => a.d < 0).reverse(), del = past.filter(canDelete);
  const row = (a) => { const s = sp(a.sport) || { c: '#4B5563', icon: 'trophy', name: 'Sport' }, joined = a.total - spotsLeft(a), when = a.d >= 0 ? `${dayLabel(a.d)} · ${fmtT(a.d, a.t)}` : `${fullDate.format(dateAt(a.d, '12:00'))} · ${fmtT(a.d, a.t)}`;
    return `<div class="hrow ${a.d < 0 ? 'past' : ''}" style="--c:${s.c}"><img src="${imgOf(a)}" alt=""><div class="ltext"><b>${esc(a.title)}</b><small><span class="evtag" style="--c:${s.c}">${esc(s.name)}</span>${when}</small><small>${joined} of ${a.total} joined · ${money(a.price)}</small>
      ${a.d >= 0 ? `<small class="faint">Can be deleted from ${fullDate.format(dateAt(a.d + 1, '12:00'))}</small>` : ''}</div>
      <div class="hact">${a.d >= 0 ? `<button class="round sm" data-act="shareGame" data-id="${a.id}" aria-label="Share ${esc(a.title)}">${ic('share-2')}</button><button class="round sm" data-act="hostView" data-id="${a.id}" aria-label="Open ${esc(a.title)}">${ic('chevron-right')}</button>`
        : `<button class="pill sm soft danger" data-act="hostDelete" data-id="${a.id}" ${canDelete(a) ? '' : 'disabled'}>${ic('trash-2')}Delete</button>`}</div></div>`; };
  $('#scr-games').innerHTML = `${gamesHead()}
    <div class="hstats"><div><b class="num">${up.length}</b><small>Upcoming</small></div><div><b class="num">${past.length}</b><small>Finished</small></div><div><b class="num">${mine.reduce((n, a) => n + a.total - spotsLeft(a), 0)}</b><small>Players hosted</small></div></div>
    <button class="pill block" style="margin-top:12px" data-act="hostStart">${ic('megaphone')}Host a game</button>
    <div class="section"><h2>Upcoming</h2>${up.length ? `<div class="hlist">${up.map(row).join('')}</div>` : `<div class="empty">${ic('calendar-days')}<b>Nothing hosted yet</b><span class="muted">Your games appear here and on the map.</span></div>`}</div>
    <div class="section"><div class="shead"><h2>Finished</h2>${del.length > 1 ? `<button class="pill sm soft danger" data-act="hostDeleteAll">${ic('trash-2')}Delete all ${del.length}</button>` : ''}</div>
      ${past.length ? `<div class="hlist">${past.map(row).join('')}</div><div class="faint" style="font-size:12.5px">A game can be deleted from the day after it took place. Players keep their receipts.</div>` : `<div class="faint" style="font-size:13.5px">Finished games stay here until you delete them.</div>`}</div>`;
}
function deleteHosted(ids) {
  S.hosted = S.hosted.filter((a) => !ids.includes(a.id));
  S.joined = S.joined.filter((x) => !ids.includes(x)); ids.forEach((id) => { delete S.bookings[id]; delete S.taken[id]; });
  save();
}

Object.assign(A, {
  sportNew: (el) => { if (!can.pin()) { upsell('pin'); return; } CS = { id: null, name: '', glyph: 'g-carrom', photoIcon: null, cover: null, c: SPORT_COLORS[customSports().length % SPORT_COLORS.length], setting: 'Indoor', size: 2, ret: el.dataset.id || 'list' }; sportSheet(); },
  sportsList: () => { if (!can.pin()) { upsell('pin'); return; } sportsListSheet(); },
  csEdit: (el) => { const c = customSports().find((x) => x.id === el.dataset.id); CS = Object.assign({ ret: 'list' }, clone(c)); sportSheet(); },
  csIdea: (el) => { const [n, g, set, size] = IDEAS.find((x) => x[0] === el.dataset.id); Object.assign(CS, { name: n, glyph: g, photoIcon: null, setting: set, size }); sportSheet(); },
  csGlyph: (el) => { CS.glyph = el.dataset.id; CS.photoIcon = null; CS.cover = null; sportSheet(); },
  csColor: (el) => { CS.c = el.dataset.id; sportSheet(); },
  csSet: (el) => { CS.setting = el.dataset.id; sportSheet(); },
  csSize: (el) => { CS.size = Math.max(1, Math.min(15, CS.size + +el.dataset.d)); sportSheet(); },
  csSave: () => { const err = $('#csErr'), name = CS.name.trim(), fail = (m) => { err.hidden = false; err.lastElementChild.textContent = m; };
    if (!name) return fail('Give the sport a name.');
    if (Object.entries(SPORTS).some(([k, s]) => k !== CS.id && s.name.toLowerCase() === name.toLowerCase() && !(allCustom().find((x) => x.id === k) || {}).archived)) return fail(`${name} is already in the list.`);
    S.customSports = S.customSports || [];
    const rec = { id: CS.id || 'x-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36).slice(-3), name, glyph: CS.glyph, photoIcon: CS.photoIcon, cover: CS.cover, c: CS.c, setting: CS.setting, size: CS.size };
    const i = S.customSports.findIndex((x) => x.id === rec.id); if (i >= 0) S.customSports[i] = rec; else S.customSports.push(rec);
    registerCustom(rec); save(); const ret = CS.ret, isNew = i < 0; CS = null;
    toast(isNew ? `${name} added. Use it for games, teams and events` : `${name} updated`, 'check'); returnFromSport(ret, rec.id); },
  csDelete: (el) => { const id = el.dataset.id, c = customSports().find((x) => x.id === id), used = sportUsage(id);
    if (used.length) { const e = $('#csErr'); e.hidden = false; e.lastElementChild.textContent = `${c.name} is used by ${used.join(', ')}. Change or delete those first.`; return; }
    sheet(`${head(`Delete ${esc(c.name)}?`, 'It disappears from sport pickers. Finished games keep their history.')}<div style="display:flex;gap:10px"><button class="pill soft" style="flex:1" data-act="sportsList">Keep it</button><button class="pill danger-fill" style="flex:1" data-act="csDeleteGo" data-id="${id}">${ic('trash-2')}Delete</button></div>`); },
  csDeleteGo: (el) => { const id = el.dataset.id, c = allCustom().find((x) => x.id === id), history = S.hosted.some((a) => a.sport === id);
    if (history) c.archived = true; else S.customSports = allCustom().filter((x) => x.id !== id);
    unregisterCustom(id, history); save(); sportsListSheet(); toast(`${c.name} deleted`, 'trash-2'); },
  hostView: (el) => openDetail(el.dataset.id),
  hostDelete: (el) => { const a = actById(el.dataset.id); if (!a || !canDelete(a)) return;
    sheet(`${head(`Delete ${esc(a.title)}?`, `Held ${fullDate.format(dateAt(a.d, '12:00'))}. It’s removed from your hosting list and games history.`)}
      <div class="faint" style="font-size:13.5px">Players who paid keep their UPI receipts. This can’t be undone.</div>
      <div style="display:flex;gap:10px"><button class="pill soft" style="flex:1" data-act="close">Keep it</button><button class="pill danger-fill" style="flex:1" data-act="hostDeleteGo" data-id="${a.id}">${ic('trash-2')}Delete</button></div>`); },
  hostDeleteGo: (el) => { const a = actById(el.dataset.id); deleteHosted([a.id]); closeSheet(); renderHosting(); toast(`${a.title} deleted`, 'trash-2'); },
  hostDeleteAll: () => { const ids = S.hosted.filter((a) => a.hostedByYou && canDelete(a)).map((a) => a.id);
    sheet(`${head(`Delete ${ids.length} finished games?`, 'Removes them from your hosting list and history.')}<div style="display:flex;gap:10px"><button class="pill soft" style="flex:1" data-act="close">Cancel</button><button class="pill danger-fill" style="flex:1" data-act="hostDeleteAllGo">${ic('trash-2')}Delete ${ids.length}</button></div>`); },
  hostDeleteAllGo: () => { const ids = S.hosted.filter((a) => a.hostedByYou && canDelete(a)).map((a) => a.id); deleteHosted(ids); closeSheet(); renderHosting(); toast(`${ids.length} games deleted`, 'trash-2'); },
});
