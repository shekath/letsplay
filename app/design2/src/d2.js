/* LetsPlay Design 2 ("Playground"): engagement-first prototype sharing Design 1's data. */
(function () {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const IMG = 'img/';
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const app = $('#app');
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Icons: Lucide paths from icons.js plus the same custom sport glyphs as Design 1. */
const GLYPHS = {
  's-football': '<circle cx="12" cy="12" r="9"/><path d="M12 8.2l3.4 2.5-1.3 4h-4.2l-1.3-4z"/><path d="M12 3v5.2M15.4 10.7l5-1.6M14.1 14.7l3 4.2M9.9 14.7l-3 4.2M8.6 10.7l-5-1.6"/>',
  's-basketball': '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18"/><path d="M5.6 5.6c2.3 1.8 3.6 3.9 3.6 6.4s-1.3 4.6-3.6 6.4M18.4 5.6c-2.3 1.8-3.6 3.9-3.6 6.4s1.3 4.6 3.6 6.4"/>',
  's-tennis': '<circle cx="12" cy="12" r="9"/><path d="M5.2 6c2.4 1.6 3.8 3.6 3.8 6s-1.4 4.4-3.8 6M18.8 6c-2.4 1.6-3.8 3.6-3.8 6s1.4 4.4 3.8 6"/>',
  's-shuttle': '<path d="M9.5 15.5 6 4h12l-3.5 11.5z"/><path d="M10.5 15.5 10 4M13.5 15.5 14 4M7 8h10"/><path d="M9.5 15.5h5v1.5a2.5 2.5 0 0 1-5 0z"/>',
  's-cricket': '<path d="M14.5 3.5l4 4-8.8 8.8a1.5 1.5 0 0 1-2.1 0l-1.9-1.9a1.5 1.5 0 0 1 0-2.1z"/><path d="M6.5 15.5 3 19"/><circle cx="18" cy="17.5" r="2.5"/>',
  's-kabaddi': '<circle cx="12" cy="4.5" r="2"/><path d="M12 7.5v5.5l-4.5 7.5M12 13l4.5 7.5M5 11l7-3 7 3"/>',
  's-paddle': '<circle cx="14" cy="9.5" r="6"/><path d="M9.8 13.7 4.5 19"/><circle cx="5.5" cy="6" r="1.6"/>',
};
function ic(name) { const b = GLYPHS[name] || ICONS[name] || ICONS['circle-check']; return `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${b}</svg>`; }
const sp = (k) => SPORTS[k];
const money = (n) => (n ? inr(n) : 'Free');
const today = new Date(); today.setHours(0, 0, 0, 0);
const dateAt = (d, t) => { const x = new Date(today); x.setDate(x.getDate() + d); const [h, m] = t.split(':'); x.setHours(+h, +m); return x; };
const tf = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' });
const wf = new Intl.DateTimeFormat('en-IN', { weekday: 'short' });
const dayLabel = (d) => (d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : wf.format(dateAt(d, '12:00')));
const when = (a) => `${dayLabel(a.d)} · ${tf.format(dateAt(a.d, a.t))}`;
const km = (x, y) => Math.hypot(x - ME.x, y - ME.y) * 0.0025;
const fmtKm = (k) => (k < 1 ? Math.round(k * 100) * 10 + ' m' : k.toFixed(1) + ' km');
const AVC = ['#D93065', '#0A7CAE', '#0F863E', '#C05316', '#9355DB', '#9B6C03'];
const avatar = (n) => `<span class="av" style="background:${AVC[[...n].reduce((a, c) => a + c.charCodeAt(0), 0) % AVC.length]}">${esc(n.split(' ').map((w) => w[0]).join('').slice(0, 2))}</span>`;
function buzz(ms = 12) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* unsupported */ } }

/* ── State ── */
const KEY = 'letsplay-d2-v1';
const fresh = () => ({ theme: 'system', xp: 1180, goal: 3, week: 1, joined: ['a7'], seen: [], mood: 'all', streak: [1, 1, 0, 1, 1, 1, 1, 0], vote: null, poll: { yes: 4, maybe: 1, no: 1 }, lineup: {}, chat: null, venue: 'v1', bookDay: 1, start: 18, dur: 2, players: 10 });
let S = fresh();
try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) S = Object.assign(fresh(), s); } catch (e) { /* storage unavailable */ }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } };
const LV = 250;
const level = () => Math.floor(S.xp / LV) + 1;
const TITLES = ['Rookie', 'Regular', 'Weekend warrior', 'Team player', 'All-rounder', 'Local legend', 'Captain material', 'Club hero'];

/* ── Shell ── */
const framed = () => matchMedia('(min-width: 900px) and (min-height: 640px)').matches;
const syncFrame = () => app.classList.toggle('framed', framed());
syncFrame(); addEventListener('resize', () => { syncFrame(); if (tab === 'play') focusMap(false); });
const HOST_THEME = document.documentElement.getAttribute('data-theme');
function applyTheme() { const r = document.documentElement; if (S.theme === 'system') { if (HOST_THEME) r.setAttribute('data-theme', HOST_THEME); else r.removeAttribute('data-theme'); } else r.setAttribute('data-theme', S.theme); renderNoteTheme(); }
function renderNoteTheme() { const n = $('#noteTheme'); if (n) n.innerHTML = [['light', 'Light'], ['dark', 'Dark'], ['system', 'System']].map(([k, l]) => `<button data-act="theme" data-id="${k}" aria-pressed="${S.theme === k}">${l}</button>`).join(''); }
function toast(msg, icon = 'circle-check') { $$('.toast', app).forEach((t) => t.remove()); const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.innerHTML = ic(icon) + esc(msg); app.appendChild(t); setTimeout(() => t.remove(), 2600); }
function sheet(html) {
  closeSheet();
  const sc = document.createElement('div'); sc.className = 'scrim'; sc.dataset.act = 'close';
  const sh = document.createElement('div'); sh.className = 'sheet'; sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-modal', 'true'); sh.innerHTML = html;
  app.append(sc, sh); const f = sh.querySelector('button:not(.x)'); if (f) setTimeout(() => f.focus({ preventScroll: true }), 320);
}
function closeSheet() { $$('.sheet, .scrim', app).forEach((e) => e.remove()); }
const head = (t, s) => `<div class="sheet-head"><div><h2>${t}</h2>${s ? `<div class="muted" style="margin-top:4px">${s}</div>` : ''}</div><button class="x" data-act="close" aria-label="Close">${ic('x')}</button></div>`;

let tab = 'play';
function go(t) {
  tab = t; closeSheet(); closeStory();
  $$('.screen').forEach((s) => (s.hidden = s.id !== 'scr-' + t));
  $('#tabbar').innerHTML = [['play', 'compass', 'Play'], ['book', 'calendar-days', 'Book'], ['squad', 'users', 'Squad'], ['me', 'user', 'Me']]
    .map(([k, i, l]) => `<button class="tab" data-act="tab" data-id="${k}" aria-label="${l}" ${tab === k ? 'aria-current="page"' : ''}>${ic(i)}<span class="lbl">${l}</span></button>`).join('');
  ({ play: renderPlay, book: renderBook, squad: renderSquad, me: renderMe })[t]();
}

/* ═════ PLAY: map + list of games (tap a card or a pin; the two stay in sync) ═════ */
const MAP_S = 0.62;
function mapSVG() {
  let o = '<svg width="1600" height="1600" viewBox="0 0 1600 1600" xmlns="http://www.w3.org/2000/svg"><rect class="m-land" width="1600" height="1600"/>';
  for (let x = 0; x < 1600; x += 100) for (let y = 0; y < 1600; y += 100) o += `<rect class="m-block" x="${x + 14}" y="${y + 14}" width="72" height="72" rx="14"/>`;
  [[600, 590, 200, 150], [820, 1040, 200, 130], [640, 1140, 170, 110], [280, 280, 230, 190], [1000, 390, 200, 140], [1240, 1260, 200, 160]].forEach(([x, y, w, h]) => { o += `<rect class="m-park" x="${x}" y="${y}" width="${w}" height="${h}" rx="40"/>`; });
  o += '<path class="m-water" stroke-width="60" d="M-60 500 C 240 560, 380 740, 520 830 S 760 880, 900 990 S 1150 1230, 1700 1170"/><ellipse class="m-lake" cx="1190" cy="1080" rx="96" ry="64"/>';
  for (let i = 0; i <= 1600; i += 100) { const w = i % 400 === 0 ? 20 : 10; o += `<line class="m-road" x1="${i}" y1="0" x2="${i}" y2="1600" stroke-width="${w}"/><line class="m-road" x1="0" y1="${i}" x2="1600" y2="${i}" stroke-width="${w}"/>`; }
  [[800, 1340, 'MG Road', 90], [1380, 792, 'Nehru Marg', 0], [640, 392, 'Ring Road', 0]].forEach(([x, y, n, r]) => { o += `<text class="m-label" x="${x}" y="${y}" text-anchor="middle" dy="5" transform="rotate(${r} ${x} ${y})">${n}</text>`; });
  return o + '</svg>';
}
const games = () => ACTIVITIES.filter((a) => S.mood === 'all' || a.sport === S.mood).sort((a, b) => a.d - b.d || km(a.x, a.y) - km(b.x, b.y));
let focused = null;   /* the game the map is showing */
const soon = () => ACTIVITIES.filter((a) => a.d <= 1).sort((a, b) => dateAt(a.d, a.t) - dateAt(b.d, b.t)).slice(0, 8);
function goalRing() {
  const r = 20, c = 2 * Math.PI * r, done = Math.min(S.week, S.goal);
  return `<button class="goal-ring" data-act="tab" data-id="me" aria-label="Weekly goal: ${done} of ${S.goal} games"><svg viewBox="0 0 48 48"><circle class="track" cx="24" cy="24" r="${r}"/><circle class="val" cx="24" cy="24" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - done / S.goal)}"/></svg><b class="num">${done}/${S.goal}</b></button>`;
}
/* Weeks in a row with the goal hit. The current week only counts once it is hit, so it never breaks the streak early. */
function streakWeeks() { let i = S.streak.length - 1, n = 0; if (!S.streak[i]) i--; for (; i >= 0 && S.streak[i]; i--) n++; return n; }
function renderPlay() {
  const el = $('#scr-play');
  if (!$('#map')) {
    el.innerHTML = `<div class="map" id="map" aria-label="Map of games near you"><div class="map-layer" id="mapLayer">${mapSVG()}<div id="pins"></div></div>
        <div class="mapctl" id="mapctl"><div class="zoomgrp"><button id="zoomIn" data-act="zoomIn" aria-label="Zoom in">${ic('plus')}</button><button id="zoomOut" data-act="zoomOut" aria-label="Zoom out">${ic('minus')}</button></div><button data-act="locate" aria-label="Centre on my location">${ic('locate-fixed')}</button></div></div>
      <div class="play-top top-safe" id="playTop"></div>
      <div class="lsheet" id="lsheet"><div class="lgrab" id="lgrab" aria-hidden="true"></div><div class="lhead" id="lhead"></div><div class="llist" id="llist"></div></div>`;
    bindMapDrag(); bindSheet();
  }
  const moods = [['all', 'Anything', null]].concat(['cricket', 'football', 'badminton', 'kabaddi', 'basketball', 'tennis', 'volleyball', 'running', 'yoga'].map((k) => [k, sp(k).name, sp(k)]));
  $('#playTop').innerHTML = `<div class="hello"><h1><small>Good to see you, Arjun</small>What do you feel like playing?</h1><span class="streak" title="Weekly streak">${ic('flame')}<span class="num">${streakWeeks()}</span></span>${goalRing()}</div>
    <div class="stories" aria-label="Starting soon">${soon().map((a, i) => `<button class="story ${S.seen.includes(a.id) ? 'seen' : ''}" style="--c:${sp(a.sport).c}" data-act="story" data-i="${i}" aria-label="${esc(a.title)}, ${when(a)}"><span class="ring"><img src="${IMG + a.img}.jpg" alt=""></span><span class="t">${a.d === 0 ? tf.format(dateAt(a.d, a.t)) : 'Tmrw'}</span></button>`).join('')}</div>
    <div class="chips">${moods.map(([k, n, s]) => `<button class="chip ${s ? '' : 'neutral'}" style="${s ? '--c:' + s.c : ''}" data-act="mood" data-id="${k}" aria-pressed="${S.mood === k}">${s ? ic(s.icon) : ic('layers')}${n}</button>`).join('')}</div>`;
  const list = games();
  if (!list.find((a) => a.id === focused)) focused = list[0] ? list[0].id : null;
  $('#pins').innerHTML = `<div class="me" style="left:${ME.x}px;top:${ME.y}px"></div>` + ACTIVITIES.map((a) => `<button class="pin ${list.includes(a) ? '' : 'gone'} ${S.joined.includes(a.id) ? 'joined' : ''}" id="pin-${a.id}" data-act="pin" data-id="${a.id}" style="--c:${sp(a.sport).c};left:${a.x}px;top:${a.y}px" aria-label="${esc(a.title)}, ${when(a)}"><span>${ic(sp(a.sport).icon)}</span></button>`).join('');
  $('#lhead').innerHTML = `<div><h2>${list.length} game${list.length === 1 ? '' : 's'} near you</h2><div class="faint" style="font-size:13px;font-weight:600">Tap a game to see it on the map</div></div><button class="pill sm soft" data-act="sheetToggle" aria-label="Expand or collapse the list">${ic('layers')}${sheetIdx ? 'Map' : 'List'}</button>`;
  $('#llist').innerHTML = list.length ? `<div class="grows">${list.map(itemHTML).join('')}</div>` :`<div class="card" style="padding:22px;text-align:center;display:grid;gap:10px"><b>No ${esc(sp(S.mood) ? sp(S.mood).name.toLowerCase() : '')} games nearby yet</b><div class="muted">Try another sport, or book a court and start your own.</div><button class="pill sm soft" data-act="tab" data-id="book" style="justify-self:center">Book a court</button></div>`;
  focusMap(true, list.find((a) => a.id === focused) || null);
}
/* One row per game: name, then day · time and a distance chip, then price, spots and venue.
   The venue goes last so a long name is what gets cut, never the price or spots. */
function itemHTML(a) {
  const s = sp(a.sport), joined = S.joined.includes(a.id), left = Math.max(0, a.spots - (joined ? 1 : 0));
  return `<article class="gitem ${focused === a.id ? 'on' : ''}" id="item-${a.id}" style="--c:${s.c}">
    <button class="gi-main" data-act="focus" data-id="${a.id}" aria-label="${esc(a.title)}: show on map and see details">
      <img class="gi-photo" src="${IMG + a.img}.jpg" alt="" loading="lazy">
      <span class="gi-text">
        <b class="gi-title">${esc(a.title)}</b>
        <span class="gi-when"><span class="${a.d === 0 ? 'today' : ''}">${a.d === 1 ? 'Tmrw' : dayLabel(a.d)}</span><i class="dot" aria-hidden="true"></i><span>${tf.format(dateAt(a.d, a.t))}</span><span class="gi-dist">${ic('map-pin')}${fmtKm(km(a.x, a.y))}</span></span>
        <span class="gi-meta">${money(a.price)} · ${left ? left + ' left' : 'Full'} · ${esc(a.venue.split(' · ')[0])}</span></span>
    </button>
    ${joined ? `<span class="gi-act in" role="img" aria-label="You're in">${ic('check')}</span>` : left === 0 ? '<span class="gi-act full">Full</span>' : `<button class="gi-act" data-act="join" data-id="${a.id}" aria-label="Join ${esc(a.title)}">${ic('plus')}</button>`}
  </article>`;
}
/* The list is a bottom sheet with two heights: peek (map first) and expanded (browse). */
let sheetIdx = 0;
function sheetHeights() { const h = $('#scr-play').clientHeight; return [Math.round(h * 0.42), h - (($('#playTop') || {}).offsetHeight || 220) + 40]; }
function setSheet(i, anim = true) { sheetIdx = i; const el = $('#lsheet'); if (!el) return; el.classList.toggle('dragging', !anim); el.style.height = sheetHeights()[i] + 'px'; const b = $('#lhead [data-act="sheetToggle"]'); if (b) b.innerHTML = `${ic('layers')}${i ? 'Map' : 'List'}`; if (anim) setTimeout(() => focusMap(true, ACTIVITIES.find((a) => a.id === focused) || null), 340); }
function bindSheet() {
  const el = $('#lsheet'); let s = null; setSheet(0, false);
  const down = (e) => { if (e.target.closest('button')) return; s = { y: e.clientY, h: el.clientHeight, moved: 0 }; e.currentTarget.setPointerCapture(e.pointerId); el.classList.add('dragging'); };
  const move = (e) => { if (!s) return; const [lo, hi] = sheetHeights(); s.moved = Math.abs(e.clientY - s.y); el.style.height = Math.max(lo - 60, Math.min(hi, s.h - (e.clientY - s.y))) + 'px'; };
  const up = () => { if (!s) return; const [lo, hi] = sheetHeights(); const h = el.clientHeight; const tap = s.moved < 5; s = null; el.classList.remove('dragging'); setSheet(tap ? 1 - sheetIdx : (Math.abs(h - lo) < Math.abs(h - hi) ? 0 : 1)); };
  ['lgrab', 'lhead'].forEach((id) => { const g = $('#' + id); g.addEventListener('pointerdown', down); g.addEventListener('pointermove', move); g.addEventListener('pointerup', up); g.addEventListener('pointercancel', up); });
}
function focusGame(id, scroll) {
  focused = id; $$('.gitem.on').forEach((e) => e.classList.remove('on')); const it = $('#item-' + id); if (it) { it.classList.add('on'); if (scroll) { const l = $('#llist'); l.scrollTo({ top: it.offsetTop - l.offsetTop - 8, behavior: REDUCED ? 'auto' : 'smooth' }); } }
  focusMap(true, ACTIVITIES.find((a) => a.id === id)); buzz(6);
}
let mapPos = { x: 0, y: 0 };
let mz = MAP_S;                       /* current zoom */
const Z_MIN = 0.32, Z_MAX = 1.6;
/* Pins and your location keep the same on-screen size at every zoom: --k counter-scales them. */
function setMap(x, y, anim) {
  const l = $('#mapLayer'); if (!l) return; mapPos = { x, y }; l.classList.toggle('dragging', !anim);
  l.style.transform = `translate(${x}px,${y}px) scale(${mz})`; l.style.setProperty('--k', (0.85 / mz).toFixed(3));
  const zi = $('#zoomIn'), zo = $('#zoomOut'); if (zi) zi.disabled = mz >= Z_MAX - 0.001; if (zo) zo.disabled = mz <= Z_MIN + 0.001;
}
/* Zoom around a screen point (the pinch centre, the cursor, or the middle of the visible map). */
function zoomAt(f, cx, cy, anim) {
  const n = Math.max(Z_MIN, Math.min(Z_MAX, mz * f)); if (n === mz) return; const r = n / mz;
  const x = cx - (cx - mapPos.x) * r, y = cy - (cy - mapPos.y) * r; mz = n; setMap(x, y, anim);
}
function mapCentre() { const m = $('#map'), topH = ($('#playTop') || {}).offsetHeight || 200, sheetTop = m.clientHeight - (($('#lsheet') || {}).offsetHeight || 0); return [m.clientWidth / 2, topH + Math.max(40, (sheetTop - topH) / 2)]; }
function focusMap(anim, a) {
  const m = $('#map'); if (!m) return; const target = a === undefined ? ACTIVITIES.find((x) => x.id === focused) : a; const p = target || ME;
  const [cx, cy] = mapCentre();
  setMap(cx - p.x * mz, cy - p.y * mz, anim);
  $$('.pin.on').forEach((e) => e.classList.remove('on'));
  if (target) { const pin = $('#pin-' + target.id); if (pin) { void pin.offsetWidth; pin.classList.add('on'); } }
  placeMapControls();
}
function placeMapControls() { const c = $('#mapctl'), t = $('#playTop'); if (c && t) c.style.top = t.offsetHeight + 8 + 'px'; }
function bindMapDrag() {
  const m = $('#map'); const pts = new Map(); let start = null, pinch = 0;
  const rel = (e) => { const r = m.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  m.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.pin, #mapctl')) return; try { m.setPointerCapture(e.pointerId); } catch (err) { /* pointer not capturable */ } pts.set(e.pointerId, rel(e));
    if (pts.size === 1) start = { x: e.clientX, y: e.clientY, mx: mapPos.x, my: mapPos.y };
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); start = null; }
  });
  m.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, rel(e));
    if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) zoomAt(d / pinch, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, false); pinch = d; return; }
    if (start) setMap(start.mx + e.clientX - start.x, start.my + e.clientY - start.y, false);
  });
  const end = (e) => { pts.delete(e.pointerId); pinch = 0; start = null; if (pts.size === 1) { const [p] = [...pts.values()]; const r = m.getBoundingClientRect(); start = { x: p[0] + r.left, y: p[1] + r.top, mx: mapPos.x, my: mapPos.y }; } };
  m.addEventListener('pointerup', end); m.addEventListener('pointercancel', end);
  m.addEventListener('wheel', (e) => { e.preventDefault(); const [x, y] = rel(e); zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, x, y, false); }, { passive: false });
}

/* Join: confirm, celebrate, show progress */
function joinSheet(id) {
  const a = ACTIVITIES.find((x) => x.id === id), s = sp(a.sport);
  sheet(`${head('Join ' + esc(a.title) + '?', `${when(a)} · ${esc(a.venue)}`)}
    <div class="facts"><div class="fact"><b>${money(a.price)}</b><span>${a.price ? 'Paid with UPI' : 'No payment needed'}</span></div><div class="fact"><b>${a.level}</b><span>Ages ${a.ages}</span></div></div>
    <div class="card" style="padding:14px;display:flex;align-items:center;gap:12px;background:var(--you-soft);border-color:transparent"><span style="color:var(--you-text)">${ic('zap')}</span><div style="flex:1"><b>+50 XP</b> for joining<div class="muted" style="font-size:13px">Counts towards your weekly goal of ${S.goal} games</div></div></div>
    <button class="pill block" data-act="confirmJoin" data-id="${a.id}" style="min-height:56px">${a.price ? `${ic('smartphone')}Pay ${inr(a.price)} with UPI` : `${ic('check')}Count me in`}</button>
    <button class="pill block soft" data-act="cancelJoin">Not now</button>`);
}
function confirmJoin(id) {
  const a = ACTIVITIES.find((x) => x.id === id); const before = level();
  S.joined.push(id); S.week += 1; S.xp += 50; S.streak[S.streak.length - 1] = 1; save();
  const lvlUp = level() > before; const goalHit = S.week === S.goal;
  sheet(`<div class="xp-burst"><span class="big num">+50 XP</span><h2>${lvlUp ? `Level ${level()}! You’re a ${TITLES[Math.min(level() - 1, TITLES.length - 1)].toLowerCase()} now` : 'You’re in!'}</h2>
      <div class="muted">${esc(a.title)} · ${when(a)}<br>Added to your games. The host can see you’re coming.</div></div>
    <div class="card" style="padding:14px;display:grid;gap:8px"><div style="display:flex;justify-content:space-between;font-weight:700"><span>Level ${level()}</span><span class="num">${S.xp % LV}/${LV} XP</span></div><div class="xpbar" style="background:var(--surface-2)"><i style="width:0%" id="xpFill"></i></div>
      <div class="muted" style="font-size:13.5px">${goalHit ? 'Weekly goal reached. Your streak is safe.' : `Weekly goal: ${Math.min(S.week, S.goal)} of ${S.goal} games`}</div></div>
    <button class="pill block" data-act="close">Back to the map</button>`);
  requestAnimationFrame(() => setTimeout(() => { const f = $('#xpFill'); if (f) f.style.width = ((S.xp % LV) / LV) * 100 + '%'; }, 60));
  confetti(sp(a.sport).c); buzz(30);
  if (tab === 'play') renderPlay();
}
/* A one-second celebration, drawn on canvas, skipped when the user prefers less motion. */
function confetti(color) {
  if (REDUCED) return; const cv = document.createElement('canvas'); cv.className = 'confetti'; app.appendChild(cv);
  const w = cv.width = app.clientWidth, h = cv.height = app.clientHeight, ctx = cv.getContext('2d');
  const cols = [color, '#5B3FE6', '#F2B33D', '#ffffff', '#0C8353'];
  const ps = Array.from({ length: 70 }, () => ({ x: w / 2, y: h * 0.42, vx: (Math.random() - 0.5) * 11, vy: -Math.random() * 12 - 4, r: Math.random() * 6 + 3, c: cols[Math.floor(Math.random() * cols.length)], a: Math.random() * 6 }));
  const t0 = performance.now();
  (function frame(t) { const k = (t - t0) / 1100; ctx.clearRect(0, 0, w, h);
    ps.forEach((p) => { p.vy += 0.42; p.x += p.vx; p.y += p.vy; p.a += 0.2; ctx.save(); ctx.globalAlpha = Math.max(0, 1 - k); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore(); });
    if (k < 1) requestAnimationFrame(frame); else cv.remove(); })(t0);
}
function openDetail(id) {
  const a = ACTIVITIES.find((x) => x.id === id), s = sp(a.sport), joined = S.joined.includes(id);
  sheet(`<div style="margin:-10px -20px 0;height:170px;position:relative;border-radius:30px 30px 0 0;overflow:hidden"><img src="${IMG + a.img}.jpg" alt="" style="width:100%;height:100%;object-fit:cover"><span class="tag" style="position:absolute;left:16px;bottom:14px;background:${s.c}">${ic(s.icon)}${s.name}</span><button class="x" data-act="close" aria-label="Close" style="position:absolute;right:14px;top:14px">${ic('x')}</button></div>
    <div><h2>${esc(a.title)}</h2><div class="muted" style="margin-top:4px">${esc(a.venue)} · ${fmtKm(km(a.x, a.y))}</div></div>
    <div class="facts"><div class="fact"><b>${when(a)}</b><span>${a.mins} min</span></div><div class="fact"><b>${money(a.price)}</b><span>${a.spots} of ${a.total} spots left</span></div><div class="fact"><b>${a.level}</b><span>Ages ${a.ages}</span></div><div class="fact"><b>${a.setting}</b><span>${esc(a.surface)}</span></div></div>
    <div class="muted" style="font-size:14px"><b style="color:var(--ink)">Bring:</b> ${esc(a.equipment)}<br><b style="color:var(--ink)">Access:</b> ${esc(a.access)}</div>
    ${joined ? `<button class="pill block soft" disabled>${ic('check')}You’re in</button>` : a.spots === 0 ? '<button class="pill block soft" disabled>This game is full</button>' : `<button class="pill block" data-act="joinFromDetail" data-id="${a.id}" style="min-height:56px">${ic('check')}I’m in · ${money(a.price)}</button>`}`);
}

/* Stories: games starting soon, full screen, auto-advancing (manual when motion is reduced). */
let SV = null;
function openStory(i) {
  const list = soon(); SV = { list, i, t: 0, paused: false, raf: 0, last: 0 };
  const v = document.createElement('div'); v.className = 'story-view'; v.id = 'storyView'; v.setAttribute('role', 'dialog'); v.setAttribute('aria-label', 'Games starting soon'); app.appendChild(v);
  drawStory(); if (!REDUCED) { SV.last = performance.now(); SV.raf = requestAnimationFrame(tickStory); }
  v.addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; SV.paused = true; SV.downAt = performance.now(); SV.downX = e.clientX; });
  v.addEventListener('pointerup', (e) => { if (e.target.closest('button') || !SV) return; SV.paused = false; SV.last = performance.now();
    if (performance.now() - SV.downAt < 250) { const r = v.getBoundingClientRect(); stepStory(e.clientX - r.left < r.width * 0.35 ? -1 : 1); } });
}
function drawStory() {
  const a = SV.list[SV.i], s = sp(a.sport); if (!S.seen.includes(a.id)) { S.seen.push(a.id); save(); }
  const mins = Math.round((dateAt(a.d, a.t) - Date.now()) / 60000);
  $('#storyView').innerHTML = `<img src="${IMG + a.img}.jpg" alt="">
    <div class="sv-top"><div class="sv-bars">${SV.list.map((_, k) => `<i><b style="width:${k < SV.i ? 100 : k === SV.i ? SV.t * 100 : 0}%"></b></i>`).join('')}</div>
      <div class="sv-head"><span class="av" style="background:${s.c}">${ic(s.icon)}</span><div class="grow">${esc(a.host)}<small>${mins > 0 && mins < 600 ? `Starts in ${mins >= 60 ? Math.floor(mins / 60) + ' h ' : ''}${mins % 60} min` : when(a)}</small></div><button class="round" data-act="closeStory" aria-label="Close stories">${ic('x')}</button></div></div>
    <div class="sv-bottom"><span class="tag" style="background:${s.c};justify-self:start">${ic(s.icon)}${s.name} · ${money(a.price)}</span><h2>${esc(a.title)}</h2>
      <div style="font-weight:600;opacity:.92">${esc(a.venue)} · ${fmtKm(km(a.x, a.y))} · ${a.spots} spots left</div>
      ${S.joined.includes(a.id) ? `<button class="pill block soft" disabled>${ic('check')}You’re in</button>` : `<button class="pill block" style="background:#fff;color:#15161A;min-height:56px" data-act="storyJoin" data-id="${a.id}">${ic('check')}I’m in</button>`}</div>`;
}
function tickStory(now) { if (!SV) return; if (!SV.paused) { SV.t += (now - SV.last) / 5000; } SV.last = now; if (SV.t >= 1) { stepStory(1); } else { const b = $$('#storyView .sv-bars i b')[SV.i]; if (b) b.style.width = SV.t * 100 + '%'; } SV.raf = requestAnimationFrame(tickStory); }
function stepStory(d) { if (!SV) return; const n = SV.i + d; if (n < 0) { SV.t = 0; drawStory(); return; } if (n >= SV.list.length) { closeStory(); return; } SV.i = n; SV.t = 0; drawStory(); }
function closeStory() { if (SV) cancelAnimationFrame(SV.raf); SV = null; const v = $('#storyView'); if (v) v.remove(); if (tab === 'play' && $('#playTop')) renderPlay(); }

/* ═════ BOOK: drag a time window along the day ═════ */
const HPX = 64, H0 = 6, H1 = 23;
const VB = (id) => VENUES_BOOK.find((v) => v.id === id);
const isPeak = (d, h) => { const wd = dateAt(d, '12:00').getDay(); return h >= 18 || wd === 0 || wd === 6; };
const booked = (v, d) => { const vi = VENUES_BOOK.indexOf(v); const out = []; for (let h = H0; h < H1; h++) if (((vi * 31 + d * 13 + h * 7) % 10) < 3) out.push(h); return out; };
function renderBook() {
  const v = VB(S.venue), bk = booked(v, S.bookDay);
  const hrs = []; for (let h = S.start; h < S.start + S.dur; h++) hrs.push(h);
  const clash = hrs.some((h) => bk.includes(h) || h >= H1);
  const total = hrs.reduce((n, h) => n + (isPeak(S.bookDay, h) ? v.peak : v.price), 0);
  const each = Math.ceil(total / S.players);
  const hl = (h) => new Intl.DateTimeFormat('en-IN', { hour: 'numeric' }).format(dateAt(0, String(h % 24).padStart(2, '0') + ':00'));
  $('#scr-book').innerHTML = `<div class="head"><div><h1>Book a court</h1><div class="sub">Drag the window to your time</div></div></div>
    <div class="venues">${VENUES_BOOK.map((x) => `<button class="venue" data-act="venue" data-id="${x.id}" aria-pressed="${S.venue === x.id}"><img src="${IMG + x.img}.jpg" alt=""><b>${esc(x.name)}</b><small>${x.sports.map((k) => sp(k).name).join(' · ')} · from ${inr(x.price)}/hr</small></button>`).join('')}</div>
    <div class="section"><div class="chips">${[0, 1, 2, 3, 4, 5, 6].map((d) => `<button class="chip neutral" data-act="bookDay" data-id="${d}" aria-pressed="${S.bookDay === d}">${dayLabel(d)} ${dateAt(d, '12:00').getDate()}</button>`).join('')}</div>
      <div class="timeline-wrap" id="tlWrap"><div class="timeline" id="tl" style="width:${(H1 - H0) * HPX}px">
        ${Array.from({ length: H1 - H0 }, (_, k) => H0 + k).map((h) => `<div class="hour ${isPeak(S.bookDay, h) ? 'peak' : ''}" style="left:${(h - H0) * HPX}px;width:${HPX}px">${hl(h)}</div>`).join('')}
        ${bk.map((h) => `<div class="booked" style="left:${(h - H0) * HPX + 4}px;width:${HPX - 8}px" title="Booked"></div>`).join('')}
        <div class="window ${clash ? 'bad' : ''}" id="win" role="slider" tabindex="0" aria-label="Booking start time" aria-valuemin="${H0}" aria-valuemax="${H1 - S.dur}" aria-valuenow="${S.start}" aria-valuetext="${hl(S.start)} to ${hl(S.start + S.dur)}" style="left:${(S.start - H0) * HPX}px;width:${S.dur * HPX}px">${hl(S.start)}–${hl(S.start + S.dur)}</div>
      </div></div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><span class="faint" style="font-size:13px">Striped hours are taken. Tinted hours are peak.</span><div class="stepper" aria-label="Hours"><button data-act="dur" data-d="-1" aria-label="One hour less">${ic('minus')}</button><b class="num">${S.dur} h</b><button data-act="dur" data-d="1" aria-label="One hour more">${ic('plus')}</button></div></div></div>
    <div class="section card split"><div style="display:flex;justify-content:space-between;align-items:end"><div><div class="faint" style="font-size:13px;font-weight:700">Split between</div><div class="big-num num" id="pl">${S.players}</div></div><div style="text-align:right"><div class="faint" style="font-size:13px;font-weight:700">Each pays</div><div class="big-num num" id="each" style="color:var(--you-text)">${inr(each)}</div></div></div>
      <input type="range" id="players" min="1" max="22" value="${S.players}" aria-label="Number of players sharing">
      <div class="faint" style="font-size:13px">Total <b class="num" style="color:var(--ink)">${inr(total)}</b> for ${S.dur} h. Each player gets a UPI request.</div></div>
    <div class="section"><button class="pill block" style="min-height:56px" data-act="book" ${clash ? 'disabled' : ''}>${clash ? 'That time overlaps a booking' : `${ic('smartphone')}Pay my share · ${inr(each)}`}</button></div>`;
  const win = $('#win'), tl = $('#tl'); let s = null;
  $('#tlWrap').scrollLeft = Math.max(0, (S.start - H0 - 1) * HPX);
  win.addEventListener('pointerdown', (e) => { s = { x: e.clientX, start: S.start }; win.setPointerCapture(e.pointerId); win.classList.add('dragging'); });
  win.addEventListener('pointermove', (e) => { if (!s) return; const left = Math.max(0, Math.min((H1 - H0 - S.dur) * HPX, (s.start - H0) * HPX + e.clientX - s.x)); win.style.left = left + 'px'; const h = H0 + Math.round(left / HPX); win.textContent = `${hl(h)}–${hl(h + S.dur)}`; });
  win.addEventListener('pointerup', (e) => { if (!s) return; const left = parseFloat(win.style.left); s = null; S.start = H0 + Math.round(left / HPX); save(); buzz(8); renderBook(); });
  win.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); S.start = Math.max(H0, Math.min(H1 - S.dur, S.start + (e.key === 'ArrowRight' ? 1 : -1))); save(); renderBook(); $('#win').focus(); } });
  $('#players').addEventListener('input', (e) => { S.players = +e.target.value; $('#pl').textContent = S.players; $('#each').textContent = inr(Math.ceil(total / S.players)); const b = $('[data-act="book"]'); if (b && !clash) b.innerHTML = `${ic('smartphone')}Pay my share · ${inr(Math.ceil(total / S.players))}`; });
  $('#players').addEventListener('change', save);
}

/* ═════ SQUAD: set the field, poll, chat ═════ */
const POS = [['Bowler', 50, 28], ['Keeper', 50, 72], ['Slip', 63, 77], ['Point', 18, 50], ['Cover', 25, 31], ['Mid-off', 38, 17], ['Mid-on', 62, 17], ['Midwicket', 77, 33], ['Sq. leg', 82, 54], ['Fine leg', 70, 84], ['Third man', 30, 84]];
let picking = null;
function renderSquad() {
  const t = SAMPLE_TEAMS[0]; const members = t.members.map((m) => m.name);
  if (!S.chat) S.chat = [['Rohan Iyer', 'Nets at 6 before the match?'], ['Vikram Singh', 'I can bring the stumps and two balls.'], ['Sameer Khan', 'Running 10 min late, start without me.']];
  const placed = Object.values(S.lineup); const total = S.poll.yes + S.poll.maybe + S.poll.no;
  $('#scr-squad').innerHTML = `<div class="head"><div><h1>${esc(t.name)}</h1><div class="sub">v ${esc(t.next.vs)} · ${dayLabel(t.next.d)} ${tf.format(dateAt(t.next.d, t.next.t))}</div></div></div>
    <div class="section" style="margin-top:4px"><h2>Set the field</h2><div class="muted" style="font-size:14px">${picking ? `Tap a spot for <b style="color:var(--ink)">${esc(picking)}</b>` : 'Pick a player, then tap a fielding spot. Tap a placed player to bench them.'}</div>
      <div class="field ${picking ? 'placing' : ''}" role="group" aria-label="Fielding positions">${POS.map(([n, x, y]) => { const who = S.lineup[n]; return `<button class="pos ${who ? 'filled' : ''}" style="left:${x}%;top:${y}%" data-act="pos" data-id="${n}" aria-label="${n}${who ? ': ' + esc(who) : ', empty'}"><span class="dot">${who ? esc(who.split(' ').map((w) => w[0]).join('')) : ''}</span><small>${n}</small></button>`; }).join('')}</div>
      <div class="bench">${members.map((m) => `<button class="chip" data-act="pick" data-id="${esc(m)}" aria-pressed="${picking === m}" ${placed.includes(m) ? 'disabled' : ''}>${avatar(m)}${esc(m.split(' ')[0])}</button>`).join('')}</div>
      <div class="faint" style="font-size:13px"><span class="num">${placed.length}</span> of 11 placed${placed.length < 11 ? `. ${11 - placed.length} more needed for a full side.` : '. Full side.'}</div></div>
    <div class="section"><h2>Are you playing Wednesday?</h2><div class="poll">${[['yes', 'I’m in'], ['maybe', 'Maybe'], ['no', 'Can’t make it']].map(([k, l]) => `<button data-act="vote" data-id="${k}" aria-pressed="${S.vote === k}"><i style="width:${Math.round((S.poll[k] / total) * 100)}%"></i><span>${l}</span><span class="num">${S.poll[k]}</span></button>`).join('')}</div></div>
    <div class="section"><h2>Team chat</h2><div class="chat">${S.chat.map(([w, m]) => `<div class="msg ${w === 'You' ? 'mine' : ''}">${w === 'You' ? '' : `<b>${esc(w)}</b>`}${esc(m)}</div>`).join('')}</div>
      <div class="chips">${['On my way', 'Who has the kit?', 'Great game, team!'].map((m) => `<button class="chip neutral" data-act="say" data-id="${m}">${ic('send')}${m}</button>`).join('')}</div></div>`;
}

/* ═════ ME: player card, goal, streak, badges ═════ */
const BADGES = [['First whistle', 'award', 'Join your first game', () => S.joined.length >= 1], ['Early bird', 'clock', 'Play a game before 7 am', () => S.joined.some((id) => +((ACTIVITIES.find((a) => a.id === id) || { t: '12' }).t.split(':')[0]) < 7)], ['Captain', 'crown', 'Captain a team', () => true],
  ['Hat-trick', 'flame', 'Hit your weekly goal 3 weeks running', () => streakWeeks() >= 3], ['Explorer', 'compass', 'Play 4 different sports', () => new Set(S.joined.map((id) => (ACTIVITIES.find((a) => a.id === id) || {}).sport)).size >= 4], ['Court boss', 'calendar-days', 'Book a court for your crew', () => !!S.booked]];
function renderMe() {
  const lv = level(), title = TITLES[Math.min(lv - 1, TITLES.length - 1)];
  const weeks = S.streak.map((v, i) => ({ v, l: i === S.streak.length - 1 ? 'Now' : `-${S.streak.length - 1 - i}w` }));
  $('#scr-me').innerHTML = `<div class="player"><div class="row1"><span class="ava">AM</span><div><h2>Arjun Mehta</h2><div class="lvl">Level ${lv} · ${title}</div></div></div>
      <div><div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;color:rgba(255,255,255,.85);margin-bottom:6px"><span>${S.xp % LV} / ${LV} XP to level ${lv + 1}</span><span class="num">${S.xp} total</span></div><div class="xpbar"><i style="width:${((S.xp % LV) / LV) * 100}%"></i></div></div>
      <div class="stats"><div><b class="num">${S.joined.length}</b><span>Games</span></div><div><b class="num">${streakWeeks()}</b><span>Week streak</span></div><div><b class="num">${BADGES.filter((b) => b[3]()).length}</b><span>Badges</span></div></div></div>
    <div class="section card goal-set"><div style="display:flex;gap:14px;align-items:center">${goalRing()}<div><b>Weekly goal</b><div class="muted" style="font-size:13.5px">${Math.min(S.week, S.goal)} of ${S.goal} games this week</div></div></div><div class="stepper"><button data-act="goal" data-d="-1" aria-label="Lower goal">${ic('minus')}</button><b class="num">${S.goal}</b><button data-act="goal" data-d="1" aria-label="Raise goal">${ic('plus')}</button></div></div>
    <div class="section"><h2>Streak</h2><div class="weeks" aria-label="Weeks you hit your goal">${weeks.map((w) => `<div><i class="${w.v ? 'hit' : ''}" style="height:${w.v ? 56 : 18}px"></i>${w.l}</div>`).join('')}</div></div>
    <div class="section"><h2>Badges</h2><div class="badges">${BADGES.map(([n, i, how, got], k) => `<button class="badge ${got() ? '' : 'locked'}" data-act="badge" data-i="${k}"><span class="medal">${ic(got() ? i : 'lock')}</span>${n}</button>`).join('')}</div></div>
    <div class="section"><h2>Appearance</h2><div class="seg">${[['light', 'Light'], ['dark', 'Dark'], ['system', 'System']].map(([k, l]) => `<button data-act="theme" data-id="${k}" aria-pressed="${S.theme === k}">${l}</button>`).join('')}</div></div>
    <div class="section"><button class="pill block soft" data-act="reset">${ic('rotate-ccw')}Reset demo</button><div class="faint" style="font-size:12.5px;text-align:center">Prototype. XP, streaks and players are sample data.</div></div>`;
}

/* ── Actions ── */
const A = {
  tab: (el) => go(el.dataset.id),
  close: () => closeSheet(),
  theme: (el) => { S.theme = el.dataset.id; save(); applyTheme(); if (tab === 'me') renderMe(); },
  mood: (el) => { S.mood = el.dataset.id; save(); renderPlay(); },
  /* Tap a card: the map moves to its pin and the details open. Tap a pin: its card is highlighted in the list. */
  focus: (el) => { focusGame(el.dataset.id, false); openDetail(el.dataset.id); },
  pin: (el) => { if (sheetIdx) setSheet(0); focusGame(el.dataset.id, true); },
  join: (el) => { focusGame(el.dataset.id, false); joinSheet(el.dataset.id); },
  sheetToggle: () => setSheet(1 - sheetIdx),
  zoomIn: () => { const [x, y] = mapCentre(); zoomAt(1.35, x, y, true); },
  zoomOut: () => { const [x, y] = mapCentre(); zoomAt(1 / 1.35, x, y, true); },
  locate: () => { $$('.pin.on').forEach((e) => e.classList.remove('on')); const [cx, cy] = mapCentre(); setMap(cx - ME.x * mz, cy - ME.y * mz, true); },
  confirmJoin: (el) => confirmJoin(el.dataset.id),
  cancelJoin: () => { closeSheet(); renderPlay(); },
  joinFromDetail: (el) => joinSheet(el.dataset.id),
  story: (el) => openStory(+el.dataset.i),
  closeStory: () => closeStory(),
  storyJoin: (el) => { const id = el.dataset.id; closeStory(); joinSheet(id); },
  venue: (el) => { S.venue = el.dataset.id; save(); renderBook(); },
  bookDay: (el) => { S.bookDay = +el.dataset.id; save(); renderBook(); },
  dur: (el) => { S.dur = Math.max(1, Math.min(4, S.dur + +el.dataset.d)); S.start = Math.min(S.start, H1 - S.dur); save(); renderBook(); },
  book: () => { const v = VB(S.venue); S.booked = true; const before = level(); S.xp += 30; save(); buzz(25); confetti('#5B3FE6');
    sheet(`<div class="xp-burst"><span class="big num">+30 XP</span><h2>${esc(v.name)} is yours</h2><div class="muted">${dayLabel(S.bookDay)}, ${S.dur} h from ${new Intl.DateTimeFormat('en-IN', { hour: 'numeric' }).format(dateAt(0, String(S.start).padStart(2, '0') + ':00'))}<br>UPI requests sent to ${S.players - 1} players.${level() > before ? `<br><b>Level ${level()} reached.</b>` : ''}</div></div><button class="pill block" data-act="close">Done</button>`); },
  pick: (el) => { picking = picking === el.dataset.id ? null : el.dataset.id; renderSquad(); },
  pos: (el) => { const n = el.dataset.id;
    if (S.lineup[n]) { delete S.lineup[n]; save(); renderSquad(); return; }
    if (!picking) { toast('Pick a player from the bench first', 'info'); return; }
    S.lineup[n] = picking; picking = null; save(); buzz(10); renderSquad();
    if (Object.keys(S.lineup).length === SAMPLE_TEAMS[0].members.length) toast('Everyone is placed. Invite more to fill the side', 'users'); },
  vote: (el) => { const k = el.dataset.id; if (S.vote) S.poll[S.vote]--; S.vote = S.vote === k ? null : k; if (S.vote) S.poll[S.vote]++; save(); renderSquad(); },
  say: (el) => { S.chat.push(['You', el.dataset.id]); save(); renderSquad(); const c = $('.chat'); if (c) c.lastElementChild.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'nearest' }); },
  goal: (el) => { S.goal = Math.max(1, Math.min(7, S.goal + +el.dataset.d)); save(); renderMe(); },
  badge: (el) => { const [n, i, how, got] = BADGES[+el.dataset.i];
    sheet(`${head(n, got() ? 'Earned' : 'Not yet earned')}<div style="display:grid;justify-items:center;gap:10px;text-align:center"><span class="medal" style="width:80px;height:80px;border-radius:24px;display:grid;place-items:center;background:${got() ? 'var(--you-soft)' : 'var(--surface-2)'};color:${got() ? 'var(--you-text)' : 'var(--ink-3)'}">${ic(got() ? i : 'lock')}</span><div class="muted">${how}</div></div><button class="pill block" data-act="${got() ? 'close' : 'tab'}" data-id="play">${got() ? 'Nice' : 'Find a game'}</button>`); },
  reset: () => { S = fresh(); save(); applyTheme(); go('play'); toast('Demo reset', 'rotate-ccw'); },
};
document.addEventListener('click', (e) => { const el = e.target.closest('[data-act]'); if (!el || el.disabled) return; const f = A[el.dataset.act]; if (f) { e.preventDefault(); f(el); } });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { if ($('#storyView')) closeStory(); else closeSheet(); }
  if ($('#storyView') && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) stepStory(e.key === 'ArrowRight' ? 1 : -1);
});

applyTheme();
go('play');
requestAnimationFrame(() => focusMap(false));
})();
