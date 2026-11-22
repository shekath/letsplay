/* LetsPlay — interactive prototype
   Tiers: lite (browse + join), pro (+ pin places, teams, invites), enterprise (+ company league, schedule, leaderboards). */
(function () {
'use strict';

/* ───────── helpers ───────── */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const IMG = 'img/';
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const IS_IOS = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) && !/Android/.test(navigator.userAgent);
const PAY = IS_IOS ? 'Apple Pay' : 'Google Pay';

const SPORT_GLYPHS = {
  's-football': '<circle cx="12" cy="12" r="9"/><path d="M12 8.2l3.4 2.5-1.3 4h-4.2l-1.3-4z"/><path d="M12 3v5.2M15.4 10.7l5-1.6M14.1 14.7l3 4.2M9.9 14.7l-3 4.2M8.6 10.7l-5-1.6"/>',
  's-basketball': '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18"/><path d="M5.6 5.6c2.3 1.8 3.6 3.9 3.6 6.4s-1.3 4.6-3.6 6.4M18.4 5.6c-2.3 1.8-3.6 3.9-3.6 6.4s1.3 4.6 3.6 6.4"/>',
  's-tennis': '<circle cx="12" cy="12" r="9"/><path d="M5.2 6c2.4 1.6 3.8 3.6 3.8 6s-1.4 4.4-3.8 6M18.8 6c-2.4 1.6-3.8 3.6-3.8 6s1.4 4.4 3.8 6"/>',
  's-shuttle': '<path d="M9.5 15.5 6 4h12l-3.5 11.5z"/><path d="M10.5 15.5 10 4M13.5 15.5 14 4M7 8h10"/><path d="M9.5 15.5h5v1.5a2.5 2.5 0 0 1-5 0z"/>',
  's-cricket': '<path d="M14.5 3.5l4 4-8.8 8.8a1.5 1.5 0 0 1-2.1 0l-1.9-1.9a1.5 1.5 0 0 1 0-2.1z"/><path d="M6.5 15.5 3 19"/><circle cx="18" cy="17.5" r="2.5"/>',
  's-paddle': '<circle cx="14" cy="9.5" r="6"/><path d="M9.8 13.7 4.5 19"/><circle cx="5.5" cy="6" r="1.6"/>',
};
function ic(name, cls = '') {
  const body = SPORT_GLYPHS[name] || ICONS[name] || ICONS['circle-check'];
  return `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}
const sp = (id) => SPORTS[id];
const money = (n) => (n === 0 ? 'Free' : CUR + (Number.isInteger(n) ? n : n.toFixed(2)));
const kmFrom = (x, y) => Math.hypot(x - ME.x, y - ME.y) * 0.0025;
const fmtKm = (k) => (k < 1 ? Math.round(k * 1000 / 10) * 10 + ' m' : k.toFixed(1) + ' km');
const avatar = (p) => (p.img ? `<img src="${IMG + p.img}.jpg" alt="">` : `<span>${esc(p.initials || p.name.split(' ').map((w) => w[0]).join(''))}</span>`);

const today = new Date(); today.setHours(0, 0, 0, 0);
function dateAt(d, t) { const x = new Date(today); x.setDate(x.getDate() + d); const [h, m] = t.split(':'); x.setHours(+h, +m); return x; }
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const wkFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
const longFmt = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'short' });
function dayLabel(d) { if (d === 0) return 'Today'; if (d === 1) return 'Tomorrow'; return wkFmt.format(dateAt(d, '12:00')); }
function when(a) { return `${dayLabel(a.d)} · ${timeFmt.format(dateAt(a.d, a.t))}`; }

/* ───────── state ───────── */
const KEY = 'letsplay-demo-v1';
const fresh = () => ({
  tier: 'lite', joined: ['a7'], cart: [], fav: [], filter: 'all', query: '',
  pins: COMMUNITY_SPOTS.slice(), teams: JSON.parse(JSON.stringify(SAMPLE_TEAMS)),
  fixtures: SAMPLE_FIXTURES.slice(), invited: [], spotsTaken: {}, entTab: 'overview', lbSport: 'all', schedDay: 1,
  shopCat: 'all', ackAlert: false,
});
let S = fresh();
try { const saved = JSON.parse(localStorage.getItem(KEY) || 'null'); if (saved && saved.tier) S = Object.assign(fresh(), saved); } catch (e) { /* storage unavailable */ }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } }
const can = { pin: () => S.tier !== 'lite', teams: () => S.tier !== 'lite', org: () => S.tier === 'enterprise' };
let tab = 'explore';
let selected = null;

/* ───────── shell ───────── */
const app = $('#app');
const framed = () => matchMedia('(min-width: 900px) and (min-height: 640px)').matches;
function syncFrame() { app.classList.toggle('framed', framed()); }
syncFrame(); addEventListener('resize', () => { syncFrame(); Map.fit(); });

function toast(msg, icon = 'circle-check') {
  $$('.toast', app).forEach((t) => t.remove());
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status');
  t.innerHTML = ic(icon) + esc(msg); app.appendChild(t); setTimeout(() => t.remove(), 2600);
}

/* Sheets */
function openSheet(html, opts = {}) {
  closeSheet(true);
  const scrim = document.createElement('div'); scrim.className = 'scrim'; scrim.dataset.act = 'closeSheet';
  const sh = document.createElement('div'); sh.className = 'sheet'; sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-modal', 'true');
  sh.innerHTML = `<div class="grab" aria-hidden="true"></div><div class="sheet-body">${html}</div>`;
  app.append(scrim, sh);
  if (opts.onMount) opts.onMount(sh);
  const f = sh.querySelector('[autofocus]'); if (f) setTimeout(() => f.focus(), 320);
}
function closeSheet(instant) {
  const sh = $('.sheet', app), sc = $('.scrim', app);
  if (!sh) return;
  if (instant) { sh.remove(); sc && sc.remove(); return; }
  sh.classList.add('out'); sc && sc.classList.add('out');
  setTimeout(() => { sh.remove(); sc && sc.remove(); }, 220);
}
const sheetHead = (title, sub) => `<div class="sheet-head"><div><h2>${title}</h2>${sub ? `<div class="muted">${sub}</div>` : ''}</div><button class="close" data-act="closeSheet" aria-label="Close">${ic('x')}</button></div>`;

/* Push views */
function push(html) {
  const v = document.createElement('div'); v.className = 'view'; v.innerHTML = html;
  $('#stack').appendChild(v); return v;
}
function pop() {
  const v = $$('#stack .view').pop(); if (!v) return;
  v.classList.add('out'); setTimeout(() => v.remove(), 220);
}
function popAll() { $('#stack').innerHTML = ''; }

/* Tabs */
function go(name) {
  if (tab === 'explore' && name !== 'explore' && $('#preview')) { if (Drop.active) Drop.stop(); deselect(); }
  tab = name; popAll(); closeSheet(true);
  $$('.screen').forEach((s) => { s.hidden = s.id !== 'scr-' + name; });
  renderTabbar();
  ({ explore: renderExplore, games: renderGames, teams: renderTeams, shop: renderShop, me: renderMe })[name]();
}
function renderTabbar() {
  const items = [
    ['explore', 'compass', 'Explore'],
    ['games', 'calendar-days', 'My games'],
    ['teams', S.tier === 'enterprise' ? 'trophy' : 'users', S.tier === 'enterprise' ? 'League' : 'Teams'],
    ['shop', 'shopping-bag', 'Shop'],
    ['me', 'user', 'Profile'],
  ];
  const cartN = S.cart.reduce((n, c) => n + c.qty, 0);
  $('#tabbar').innerHTML = items.map(([id, icon, label]) => `
    <button class="tab" data-act="tab" data-id="${id}" ${tab === id ? 'aria-current="page"' : ''}>
      ${ic(icon)}<span>${label}</span>
      ${id === 'shop' && cartN ? `<span class="dot num">${cartN}</span>` : ''}
      ${id === 'teams' && S.tier === 'lite' ? `<span class="dot lock">${ic('lock')}</span>` : ''}
    </button>`).join('');
}
function tierPill() { return `<button class="tier-pill t-${S.tier}" data-act="plans" aria-label="Plan: ${PLANS[S.tier].name}. Change plan">${ic(PLANS[S.tier].icon)}${PLANS[S.tier].name}</button>`; }

function setTier(t) {
  S.tier = t; save(); renderPanel(); renderTabbar();
  if (tab === 'explore') renderExploreChrome(); else go(tab);
}

/* ───────── MAP ───────── */
const Map = (() => {
  const W = 1600, H = 1600;
  let s = 0.6, tx = 0, ty = 0, vp, layer, pinsEl, vw = 0, vh = 0;
  function svg() {
    let o = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
    o += `<rect class="m-land" width="${W}" height="${H}"/>`;
    for (let x = 0; x < W; x += 100) for (let y = 0; y < H; y += 100) {
      const k = (x * 7 + y * 13) % 5;
      if (k === 0) { o += `<rect class="m-block" x="${x + 12}" y="${y + 12}" width="34" height="76" rx="5"/><rect class="m-block" x="${x + 54}" y="${y + 12}" width="34" height="76" rx="5"/>`; }
      else o += `<rect class="m-block" x="${x + 12}" y="${y + 12}" width="76" height="76" rx="6"/>`;
    }
    const parks = [
      [600, 590, 200, 150, 'Riverside Park'], [820, 1040, 200, 130, 'Oval Green'], [640, 1140, 170, 110, 'Botanic Lawn'],
      [280, 280, 230, 190, 'Hilltop Reserve'], [1000, 390, 200, 140, 'Northgate Common'], [1240, 1260, 200, 160, 'Marsh Meadows'],
    ];
    parks.forEach(([x, y, w, h]) => { o += `<rect class="m-park" x="${x}" y="${y}" width="${w}" height="${h}" rx="22"/>`; });
    o += `<path class="m-river" stroke-width="54" d="M-60 500 C 240 560, 380 740, 520 830 S 760 880, 900 990 S 1150 1230, 1700 1170"/>`;
    o += `<ellipse class="m-water" cx="1190" cy="1080" rx="96" ry="64"/>`;
    o += `<circle class="m-radius" cx="${ME.x}" cy="${ME.y}" r="400"/>`;
    let roads = '', cas = '';
    for (let i = 0; i <= W; i += 100) {
      const major = i % 400 === 0;
      if (major) continue;
      roads += `<line class="m-road" x1="${i}" y1="0" x2="${i}" y2="${H}" stroke-width="11"/><line class="m-road" x1="0" y1="${i}" x2="${W}" y2="${i}" stroke-width="11"/>`;
    }
    for (let i = 400; i < W; i += 400) {
      cas += `<line class="m-casing" x1="${i}" y1="0" x2="${i}" y2="${H}" stroke-width="26"/><line class="m-casing" x1="0" y1="${i}" x2="${W}" y2="${i}" stroke-width="26"/>`;
      roads += `<line class="m-major" x1="${i}" y1="0" x2="${i}" y2="${H}" stroke-width="21"/><line class="m-major" x1="0" y1="${i}" x2="${W}" y2="${i}" stroke-width="21"/>`;
    }
    cas += `<line class="m-casing" x1="100" y1="1500" x2="1500" y2="100" stroke-width="26"/>`;
    roads += `<line class="m-major" x1="100" y1="1500" x2="1500" y2="100" stroke-width="21"/>`;
    o += cas + roads;
    // sports facilities drawn on the map
    const pitch = (x, y, w, h) => `<rect class="m-pitch" x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="3"/><line class="m-pitch-line" x1="${x}" y1="${y - h / 2}" x2="${x}" y2="${y + h / 2}"/><circle class="m-pitch-line" cx="${x}" cy="${y}" r="${h / 5}"/>`;
    o += pitch(690, 665, 70, 44) + pitch(740, 625, 54, 34) + pitch(935, 630, 40, 26) + pitch(985, 1085, 40, 26) + pitch(1105, 1050, 40, 24);
    o += `<ellipse class="m-pitch" cx="880" cy="1120" rx="46" ry="34"/>`;
    parks.forEach(([x, y, w, h, n]) => { o += `<text class="m-park-label" x="${x + w / 2}" y="${y + 24}" text-anchor="middle">${n}</text>`; });
    const labels = [[400, 300, 'Harbour Rd', 90], [1200, 220, 'Elm St', 90], [240, 392, 'King Ave', 0], [1340, 1192, 'Market St', 0], [1300, 392, 'King Ave', 0], [470, 1150, 'Station Blvd', -45], [1110, 790, 'Northgate Way', 0]];
    labels.forEach(([x, y, n, r]) => { o += `<text class="m-label" x="${x}" y="${y}" text-anchor="middle" transform="rotate(${r} ${x} ${y})" dy="5">${n}</text>`; });
    o += `<text class="m-label" x="300" y="700" text-anchor="middle" style="font-style:italic;fill:var(--map-park-ink)">River Lune</text>`;
    return o + '</svg>';
  }
  function init() {
    vp = $('#mapvp'); layer = $('#maplayer'); pinsEl = $('#pins');
    layer.innerHTML = svg();
    fit(); center(ME.x, ME.y, false, 45);
    bind();
  }
  function fit() { if (!vp) return; vw = vp.clientWidth; vh = vp.clientHeight; clamp(); apply(); }
  function clamp() {
    s = Math.min(2.2, Math.max(Math.max(vw / W, vh / H, 0.42), s));
    tx = Math.min(0, Math.max(vw - W * s, tx)); ty = Math.min(0, Math.max(vh - H * s, ty));
  }
  function apply() {
    layer.style.transform = `translate(${tx}px,${ty}px) scale(${s})`;
    const compact = s < 0.5;
    $$('.pin, .me-dot', pinsEl).forEach((p) => {
      p.style.transform = `translate(${p.dataset.x * s + tx}px,${p.dataset.y * s + ty}px)`;
      if (p.classList.contains('pin')) p.classList.toggle('compact', compact && !p.classList.contains('sel'));
    });
  }
  function center(x, y, anim = true, yBias = 0) {
    tx = vw / 2 - x * s; ty = (vh / 2 - yBias) - y * s; clamp();
    if (anim) { layer.style.transition = 'transform .35s ease'; $$('.pin,.me-dot', pinsEl).forEach((p) => (p.style.transition = 'transform .35s ease')); setTimeout(() => { layer.style.transition = ''; $$('.pin,.me-dot', pinsEl).forEach((p) => (p.style.transition = '')); }, 360); }
    apply();
  }
  function zoom(f, cx = vw / 2, cy = vh / 2) {
    const ns = Math.min(2.2, Math.max(0.42, s * f)); const k = ns / s;
    tx = cx - (cx - tx) * k; ty = cy - (cy - ty) * k; s = ns; clamp(); apply();
  }
  function centerPoint() { return { x: Math.round((vw / 2 - tx) / s), y: Math.round((vh / 2 - ty) / s) }; }
  function bind() {
    const pts = new window.Map(); let last = null, moved = 0, pinchD = 0;
    vp.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.pin')) return;
      vp.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved = 0;
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinchD = Math.hypot(a.x - b.x, a.y - b.y); }
      last = { x: e.clientX, y: e.clientY };
    });
    vp.addEventListener('pointermove', (e) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) {
        const [a, b] = [...pts.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); const r = vp.getBoundingClientRect();
        if (pinchD) zoom(d / pinchD, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top); pinchD = d; moved += 10; return;
      }
      const dx = e.clientX - last.x, dy = e.clientY - last.y; last = { x: e.clientX, y: e.clientY };
      moved += Math.abs(dx) + Math.abs(dy); tx += dx; ty += dy; clamp(); apply();
    });
    const up = (e) => {
      if (!pts.has(e.pointerId)) return;
      pts.delete(e.pointerId); pinchD = 0;
      if (pts.size === 1) last = [...pts.values()][0];
      if (pts.size === 0 && moved < 6 && !Drop.active) deselect();
    };
    vp.addEventListener('pointerup', up); vp.addEventListener('pointercancel', up);
    vp.addEventListener('wheel', (e) => { e.preventDefault(); const r = vp.getBoundingClientRect(); zoom(e.deltaY < 0 ? 1.12 : 0.89, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
  }
  return { init, fit, apply, center, zoom, centerPoint, get scale() { return s; } };
})();

/* ───────── EXPLORE ───────── */
function visibleActs() {
  const q = S.query.trim().toLowerCase();
  return ACTIVITIES.filter((a) => (S.filter === 'all' || a.sport === S.filter) &&
    (!q || (a.title + ' ' + a.venue + ' ' + sp(a.sport).name).toLowerCase().includes(q)))
    .sort((a, b) => kmFrom(a.x, a.y) - kmFrom(b.x, b.y));
}
const spotsLeft = (a) => Math.max(0, a.spots - (S.spotsTaken[a.id] || 0));
const isJoined = (a) => S.joined.includes(a.id);

function buildExplore() {
  $('#scr-explore').innerHTML = `
    <div class="map-vp" id="mapvp" aria-label="Map of sports near you"><div class="map-layer" id="maplayer"></div><div class="pins" id="pins"></div></div>
    <div class="map-top screen-top-pad">
      <div class="searchbar">
        <label class="search">${ic('search')}<input id="q" type="search" placeholder="Search sports, venues, clubs" autocomplete="off" aria-label="Search"></label>
        <span id="tierSlot"></span>
      </div>
      <div class="chips" id="sportChips" role="toolbar" aria-label="Filter by sport"></div>
    </div>
    <div class="map-ctrls">
      <button data-act="locate" aria-label="Centre on my location">${ic('locate-fixed')}</button>
      <div class="zoomgrp"><button data-act="zoomIn" aria-label="Zoom in">${ic('plus')}</button><button data-act="zoomOut" aria-label="Zoom out">${ic('minus')}</button></div>
    </div>
    <button class="fab" id="fab" data-act="dropStart"></button>
    <div class="preview" id="preview" hidden></div>
    <div class="nearby" id="nearby">
      <div class="grab" id="grab" aria-hidden="true"></div>
      <div class="nearby-head" id="nearbyHead"></div>
      <div class="nearby-list" id="nearbyList"></div>
    </div>
    <div class="drop-ui" id="dropUI" hidden>
      <div class="drop-banner">${ic('map-pin-plus')}<span>Move the map to place the pin, then tap <b>Set location</b>.</span></div>
      <div class="crosshair">${ic('map-pin')}</div>
      <div class="drop-actions"><button class="btn btn-ghost" data-act="dropCancel">Cancel</button><button class="btn btn-primary" data-act="dropConfirm">${ic('check')}Set location</button></div>
    </div>`;
  $('#q').addEventListener('input', (e) => { S.query = e.target.value; renderPinsAndList(); });
  Map.init();
  Sheet.bind();
}
function renderExplore() {
  if (!$('#mapvp')) buildExplore();
  renderExploreChrome();
  requestAnimationFrame(() => Map.fit());
}
function renderExploreChrome() {
  $('#tierSlot').innerHTML = tierPill();
  const chips = [['all', null, 'All sports']].concat(Object.keys(SPORTS).map((k) => [k, SPORTS[k], SPORTS[k].name]));
  $('#sportChips').innerHTML = chips.map(([k, s, n]) => `<button class="chip ${s ? 'sport' : ''}" style="${s ? '--c:' + s.c : ''}" data-act="filter" data-id="${k}" aria-pressed="${S.filter === k}">${s ? ic(s.icon) : ic('layers')}${n}</button>`).join('');
  $('#fab').innerHTML = can.pin() ? `${ic('map-pin-plus')}Pin a spot` : `${ic('map-pin-plus')}Pin a spot<span class="lockmark">${ic('lock')}</span>`;
  renderPinsAndList();
}
function renderPinsAndList() {
  const acts = visibleActs();
  const pins = acts.map((a) => {
    const s = sp(a.sport), live = a.d === 0;
    return `<button class="pin ${isJoined(a) ? 'joined' : ''} ${selected === a.id ? 'sel' : ''}" style="--c:${s.c}" data-x="${a.x}" data-y="${a.y}" data-act="pin" data-id="${a.id}" aria-label="${esc(a.title)}, ${when(a)}">
      <span class="pin-body"><span class="glyph">${ic(s.icon)}</span><span class="pin-label num">${a.price ? money(a.price) : 'Free'}</span>${live ? '<span class="live-dot"></span>' : ''}</span></button>`;
  });
  const spots = (S.filter === 'all' && !S.query ? S.pins : S.pins.filter((p) => p.sport === S.filter)).map((p) =>
    `<button class="pin spot" style="--c:${sp(p.sport).c}" data-x="${p.x}" data-y="${p.y}" data-act="spot" data-id="${p.id}" aria-label="Community spot: ${esc(p.name)}"><span class="pin-body"><span class="glyph">${ic(sp(p.sport).icon)}</span><span class="pin-label">Spot</span></span></button>`);
  const stores = S.filter === 'all' && !S.query ? STORES.map((st) => `<button class="pin store" data-x="${st.x}" data-y="${st.y}" data-act="store" data-id="${st.id}" aria-label="Sponsored: ${esc(st.name)}"><span class="pin-body"><span class="glyph">${ic('store')}</span><span class="pin-label">Deal</span></span></button>`) : [];
  $('#pins').innerHTML = `<div class="me-dot" data-x="${ME.x}" data-y="${ME.y}"></div>` + stores.join('') + spots.join('') + pins.join('');
  Map.apply();
  $('#nearbyHead').innerHTML = `<div><div class="eyebrow">Within 4 km · live now</div><h2>${acts.length} game${acts.length === 1 ? '' : 's'} near you</h2></div>
    <button class="btn btn-soft btn-sm" data-act="sheetToggle">${ic('list', 'ic-sm')}List</button>`;
  $('#nearbyList').innerHTML = acts.length ? acts.map(actCard).join('') :
    `<div class="empty">${ic('search')}<b>No games match</b><span>Try another sport or clear your search.</span><button class="btn btn-soft btn-sm" data-act="clearFilters">Clear filters</button></div>`;
}
function actCard(a) {
  const s = sp(a.sport), left = spotsLeft(a), pct = Math.round(((a.total - left) / a.total) * 100);
  return `<div class="act" style="--c:${s.c}">
    <button class="act-img" data-act="open" data-id="${a.id}" aria-label="Open ${esc(a.title)}"><img src="${IMG + a.img}.jpg" alt="" loading="lazy"><span class="glyph">${ic(s.icon)}</span></button>
    <div class="act-main">
      <button class="act-title" style="text-align:left" data-act="open" data-id="${a.id}">${esc(a.title)}</button>
      <div class="act-meta"><span>${ic('clock')}${when(a)}</span><span>${ic('navigation')}${fmtKm(kmFrom(a.x, a.y))}</span></div>
      <div class="act-meta"><span>${ic('map-pin')}${esc(a.venue)}</span></div>
      <div class="act-foot">
        <div class="spots"><span class="num">${left} of ${a.total} spots left</span><div class="bar"><i style="width:${pct}%"></i></div></div>
        ${isJoined(a) ? `<button class="btn btn-sm done" data-act="open" data-id="${a.id}">${ic('check', 'ic-sm')}Joined</button>` : `<button class="btn btn-primary btn-sm" data-act="join" data-id="${a.id}">Join · ${money(a.price)}</button>`}
      </div>
    </div></div>`;
}

/* Bottom sheet on the map */
const Sheet = (() => {
  let el, snaps = [], idx = 0;
  function heights() { const H = $('#scr-explore').clientHeight; return [200, Math.round(H * 0.55), H - (framed() ? 132 : 92)]; }
  function set(i) { idx = i; snaps = heights(); el.style.height = snaps[i] + 'px'; updateFab(); }
  function updateFab() {
    const h = parseFloat(el.style.height) || 200; const fab = $('#fab'); const pv = $('#preview');
    fab.style.bottom = (h + 14) + 'px'; fab.style.opacity = h > 320 ? '0' : '1'; fab.style.pointerEvents = h > 320 ? 'none' : '';
    if (pv) pv.style.bottom = (h + 12) + 'px';
    if (!pv.hidden) { fab.style.opacity = '0'; fab.style.pointerEvents = 'none'; }
  }
  function bind() {
    el = $('#nearby'); set(0);
    let startY = 0, startH = 0, dragging = false;
    const down = (e) => { if (e.target.closest('button')) return; dragging = true; startY = e.clientY; startH = el.clientHeight; el.classList.add('dragging'); e.currentTarget.setPointerCapture(e.pointerId); };
    const move = (e) => { if (!dragging) return; snaps = heights(); el.style.height = Math.min(snaps[2], Math.max(150, startH - (e.clientY - startY))) + 'px'; updateFab(); };
    const upH = (e) => {
      if (!dragging) return; dragging = false; el.classList.remove('dragging');
      const h = el.clientHeight; if (Math.abs(e.clientY - startY) < 5) { set(idx === 0 ? 1 : 0); return; }
      let best = 0; snaps.forEach((v, i) => { if (Math.abs(v - h) < Math.abs(snaps[best] - h)) best = i; }); set(best);
    };
    ['grab', 'nearbyHead'].forEach((id) => { const g = $('#' + id); g.addEventListener('pointerdown', down); g.addEventListener('pointermove', move); g.addEventListener('pointerup', upH); g.addEventListener('pointercancel', upH); });
  }
  return { bind, set, toggle: () => set(idx === 0 ? 2 : 0), collapse: () => set(0), updateFab, get el() { return el; } };
})();

function selectAct(id) {
  selected = id; const a = ACTIVITIES.find((x) => x.id === id); const s = sp(a.sport);
  renderPinsAndList(); Sheet.collapse();
  const pv = $('#preview'); pv.hidden = false;
  pv.innerHTML = `<div class="preview-img"><img src="${IMG + a.img}.jpg" alt=""><div class="badges">${a.d === 0 ? '<span class="badge live">Today</span>' : ''}<span class="badge" style="background:${s.c};color:#fff">${ic(s.icon)}${s.name}</span></div>
      <button class="x" data-act="deselect" aria-label="Close preview">${ic('x')}</button></div>
    <div class="preview-body">
      <h3>${esc(a.title)}</h3>
      <div class="act-meta"><span>${ic('clock')}${when(a)}</span><span>${ic('navigation')}${fmtKm(kmFrom(a.x, a.y))}</span><span>${ic('users')}${spotsLeft(a)} spots left</span></div>
      <div class="preview-actions"><button class="btn btn-ghost" data-act="open" data-id="${a.id}">Details</button>
      ${isJoined(a) ? `<button class="btn done">${ic('check')}You're in</button>` : `<button class="btn btn-primary" data-act="join" data-id="${a.id}">Join · ${money(a.price)}</button>`}</div>
    </div>`;
  Sheet.updateFab();
  Map.center(a.x, a.y, true, 90);
}
function deselect() { if (!selected && $('#preview').hidden) return; selected = null; $('#preview').hidden = true; renderPinsAndList(); Sheet.updateFab(); }

/* Pin-drop mode (Pro) */
const Drop = {
  active: false,
  start() {
    if (!can.pin()) return upsell('pin');
    deselect(); this.active = true; $('#dropUI').hidden = false; $('#nearby').hidden = true; $('#fab').hidden = true;
  },
  stop() { this.active = false; $('#dropUI').hidden = true; $('#nearby').hidden = false; $('#fab').hidden = false; Sheet.updateFab(); },
  confirm() {
    const p = Map.centerPoint();
    openSheet(`${sheetHead('New spot', 'Share a place to play with the community')}
      <form id="pinForm" class="sheet-body" style="gap:14px">
        <div class="field"><label for="pinName">Name</label><input class="input" id="pinName" required placeholder="e.g. Canal-side basketball hoop" value=""></div>
        <div class="field"><span class="lbl">Sport</span><div class="chips" id="pinSports" style="flex-wrap:wrap">${Object.keys(SPORTS).map((k, i) => `<button type="button" class="chip sport" style="--c:${SPORTS[k].c}" data-act="pickOne" data-group="pinSports" data-id="${k}" aria-pressed="${i === 0}">${ic(SPORTS[k].icon)}${SPORTS[k].name}</button>`).join('')}</div></div>
        <div class="field"><span class="lbl">Setting</span><div class="seg" id="pinSetting"><button type="button" data-act="pickOne" data-group="pinSetting" data-id="Outdoor" aria-pressed="true">Outdoor</button><button type="button" data-act="pickOne" data-group="pinSetting" data-id="Indoor" aria-pressed="false">Indoor</button></div></div>
        <div class="field"><label for="pinNote">What should players know?</label><textarea class="input" id="pinNote" placeholder="Surface, lights, opening hours, accessibility"></textarea></div>
        <div class="muted" style="font-size:13px;display:flex;gap:6px;align-items:center">${ic('info', 'ic-sm')}Pinned at ${fmtKm(kmFrom(p.x, p.y))} from you. Spots are reviewed by the community.</div>
        <button class="btn btn-primary btn-block" type="submit">${ic('map-pin-plus')}Add to map</button>
      </form>`, { onMount: (sh) => {
      $('#pinForm', sh).addEventListener('submit', (e) => {
        e.preventDefault();
        const name = $('#pinName').value.trim() || 'Community spot';
        const sport = $('#pinSports [aria-pressed="true"]').dataset.id;
        S.pins.push({ id: 'c' + Date.now(), name, sport, x: p.x, y: p.y, by: 'You', setting: $('#pinSetting [aria-pressed="true"]').dataset.id, note: $('#pinNote').value.trim() });
        save(); closeSheet(); Drop.stop(); renderPinsAndList(); toast('Spot added to the map', 'map-pin');
      });
    } });
  },
};

/* ───────── ACTIVITY DETAIL & JOIN ───────── */
function openAct(id) {
  const a = ACTIVITIES.find((x) => x.id === id), s = sp(a.sport), left = spotsLeft(a);
  const atts = [PEOPLE[0], PEOPLE[1], PEOPLE[2], PEOPLE[3]];
  push(`
    <div class="view-hero"><img src="${IMG + a.img}.jpg" alt="">
      <div class="view-nav"><button data-act="back" aria-label="Back">${ic('arrow-left')}</button><button data-act="share" aria-label="Share">${ic('share-2')}</button></div>
      <div class="hero-cap"><div style="display:flex;gap:6px;flex-wrap:wrap">${a.d === 0 ? '<span class="badge live">Today</span>' : ''}<span class="badge" style="background:${s.c};color:#fff">${ic(s.icon)}${s.name}</span><span class="badge">${a.setting}</span></div><h1>${esc(a.title)}</h1><div>${esc(a.venue)}</div></div>
    </div>
    <div class="view-body">
      <div class="facts">
        <div class="fact">${ic('calendar')}<b>${longFmt.format(dateAt(a.d, a.t))}</b><span>${timeFmt.format(dateAt(a.d, a.t))} · ${a.mins} min</span></div>
        <div class="fact">${ic('navigation')}<b>${fmtKm(kmFrom(a.x, a.y))} away</b><span>${Math.max(2, Math.round(kmFrom(a.x, a.y) * 12))} min walk</span></div>
        <div class="fact">${ic('target')}<b>${a.level}</b><span>Ages ${a.ages}</span></div>
        <div class="fact">${ic('ticket')}<b>${money(a.price)}</b><span>${a.price ? 'per player, paid in app' : 'No payment needed'}</span></div>
      </div>
      <div class="card" style="padding:14px;display:grid;gap:10px">
        <div style="display:flex;justify-content:space-between;align-items:center"><b class="num">${left} of ${a.total} spots left</b><div class="avatars">${atts.map(avatar).join('')}<span>+${a.total - left - 4 > 0 ? a.total - left - 4 : 1}</span></div></div>
        <div class="bar" style="--c:${s.c}"><i style="width:${Math.round(((a.total - left) / a.total) * 100)}%"></i></div>
      </div>
      <div class="mini-map" id="miniMap"></div>
      <div class="rows">
        <div class="row">${ic('shield-check', 'lead')}<div class="grow"><b>Hosted by ${esc(a.host)}</b><small>Verified organiser · replies in about 1 hour</small></div><button class="icon-btn" data-act="toastMsg" data-msg="Message sent to ${esc(a.host)}" aria-label="Message host">${ic('message-circle')}</button></div>
        <div class="row">${ic('layers', 'lead')}<div class="grow"><b>Surface</b><small>${esc(a.surface)}</small></div></div>
        <div class="row">${ic('dumbbell', 'lead')}<div class="grow"><b>What to bring</b><small>${esc(a.equipment)}</small></div></div>
        <div class="row">${ic('accessibility', 'lead')}<div class="grow"><b>Accessibility</b><small>${esc(a.access)}</small></div></div>
        <div class="row">${ic('rotate-ccw', 'lead')}<div class="grow"><b>Cancellation</b><small>${esc(a.cancel)}</small></div></div>
      </div>
    </div>
    <div class="view-cta"><div class="price"><span class="faint" style="font-size:12px">Price</span><b class="num">${money(a.price)}</b></div>
      ${isJoined(a) ? `<button class="btn done">${ic('check')}You're in · added to My games</button>` : `<button class="btn btn-primary" data-act="join" data-id="${a.id}">${left ? 'Join game' : 'Join waitlist'}</button>`}</div>`);
  const mm = $$('#stack .view').pop().querySelector('#miniMap');
  mm.innerHTML = $('#maplayer').innerHTML + `<div class="me-dot" style="transform:none"></div>`;
  const svg = mm.querySelector('svg'); const k = 0.9;
  svg.style.transform = `translate(${mm.clientWidth / 2 - a.x * k}px, ${65 - a.y * k}px) scale(${k})`; svg.style.transformOrigin = '0 0';
  mm.querySelector('.me-dot').outerHTML = `<div class="pin" style="--c:${s.c};transform:translate(${mm.clientWidth / 2}px,65px)"><span class="pin-body"><span class="glyph">${ic(s.icon)}</span><span class="pin-label">${esc(a.venue.split(' · ')[0])}</span></span></div>`;
}

function joinFlow(id) {
  const a = ACTIVITIES.find((x) => x.id === id); const s = sp(a.sport);
  const kids = a.ages === '8–11';
  const who = FAMILY.map((f, i) => `<button class="opt" data-act="pickMany" data-id="${f.id}" aria-pressed="${kids ? i === 1 : i === 0}">${f.img ? `<img src="${IMG + f.img}.jpg" alt="">` : `<span class="crest sm" style="--c:${['#E3336A', '#0E9FE0'][i - 1]};border-radius:50%;width:40px;height:40px">${f.initials}</span>`}<div><b>${f.name}</b><div class="faint" style="font-size:13px">${f.note}</div></div><span class="tick">${ic('check')}</span></button>`).join('');
  openSheet(`${sheetHead('Join game', `${esc(a.title)} · ${when(a)}`)}
    <div class="field"><span class="lbl">Who's playing?</span><div class="pick" id="joinWho">${who}</div></div>
    ${a.price ? `<div class="rows"><div class="row">${ic('wallet', 'lead')}<div class="grow"><b>${PAY}</b><small>Default payment · change in Profile</small></div><b class="num" id="joinTotal">${money(a.price * (1))}</b></div></div>` : `<div class="rows"><div class="row">${ic('gift', 'lead')}<div class="grow"><b>Free game</b><small>No payment needed</small></div></div></div>`}
    <label style="display:flex;gap:10px;align-items:flex-start;font-size:14px" class="muted"><input type="checkbox" id="consent" checked style="width:20px;height:20px;margin:0;accent-color:var(--brand)"> I agree to the host's code of conduct and the cancellation policy. Emergency contacts are shared with the host.</label>
    <button class="btn btn-primary btn-block" data-act="confirmJoin" data-id="${a.id}" style="min-height:54px">${a.price ? `${ic('wallet')}Pay with ${PAY}` : `${ic('check')}Confirm`}</button>`,
  { onMount: () => updateJoinTotal(a) });
}
function updateJoinTotal(a) { const n = $$('#joinWho [aria-pressed="true"]').length; const t = $('#joinTotal'); if (t) t.textContent = money(a.price * Math.max(1, n)); }
function confirmJoin(id) {
  const a = ACTIVITIES.find((x) => x.id === id); const n = Math.max(1, $$('#joinWho [aria-pressed="true"]').length);
  if (!$('#consent').checked) { toast('Please accept the code of conduct to join', 'info'); return; }
  if (!S.joined.includes(id)) S.joined.push(id); S.spotsTaken[id] = (S.spotsTaken[id] || 0) + n; save();
  openSheet(`<div class="success"><div class="burst">${ic('check')}</div><h2>You're in!</h2>
    <div class="muted">${esc(a.title)}<br>${longFmt.format(dateAt(a.d, a.t))} at ${timeFmt.format(dateAt(a.d, a.t))}</div></div>
    <div class="rows"><div class="row">${ic('calendar-days', 'lead')}<div class="grow"><b>Added to My games</b><small>Reminder 2 hours before</small></div></div>
    <div class="row">${ic('message-circle', 'lead')}<div class="grow"><b>Game chat unlocked</b><small>Say hi to ${a.total - spotsLeft(a)} players</small></div></div></div>
    <button class="btn btn-primary btn-block" data-act="gotoGames">See My games</button>
    <button class="btn btn-ghost btn-block" data-act="closeSheet">Keep exploring</button>`);
  if (tab === 'explore') { renderPinsAndList(); if (selected) selectAct(selected); }
  $$('#stack .view').forEach((v) => v.remove());
}

/* ───────── MY GAMES ───────── */
function renderGames() {
  const mine = ACTIVITIES.filter(isJoined).sort((a, b) => dateAt(a.d, a.t) - dateAt(b.d, b.t));
  const next = mine[0];
  let html = `<div class="page-head"><h1>My games</h1><button class="icon-btn" data-act="toastMsg" data-msg="Calendar synced with your phone" aria-label="Sync calendar">${ic('calendar')}</button></div>`;
  if (!S.ackAlert && mine.find((a) => a.id === 'a7')) {
    html += `<div class="alert" role="status">${ic('info')}<div class="grow"><b>Riverside 5K: meeting point moved</b><span>Now starting at the Bridge Plaza fountain, 200 m east. Same time.</span><div style="display:flex;gap:8px"><button class="btn btn-sm btn-line" data-act="ackAlert">Got it</button><button class="btn btn-sm btn-ghost" data-act="open" data-id="a7">View game</button></div></div></div>`;
  }
  if (next) {
    const ms = dateAt(next.d, next.t) - Date.now(); const h = Math.max(0, Math.floor(ms / 3.6e6)); const m = Math.max(0, Math.floor((ms % 3.6e6) / 6e4));
    html += `<div class="section"><div class="eyebrow">Up next</div>
      <div class="next-card"><img src="${IMG + next.img}.jpg" alt=""><div class="inner">
        <span class="badge" style="background:${sp(next.sport).c};color:#fff;justify-self:start">${ic(sp(next.sport).icon)}${sp(next.sport).name}</span>
        <h3>${esc(next.title)}</h3><div style="opacity:.9">${when(next)} · ${esc(next.venue)}</div>
        <div class="countdown num"><div><b>${Math.floor(h / 24)}</b><small>days</small></div><div><b>${h % 24}</b><small>hrs</small></div><div><b>${m}</b><small>min</small></div></div>
        <div style="display:flex;gap:8px"><button class="btn btn-volt btn-sm" data-act="toastMsg" data-msg="Opening directions in Maps" data-icon="navigation">${ic('navigation', 'ic-sm')}Directions</button><button class="btn btn-sm" style="background:rgba(255,255,255,.18);color:#fff" data-act="open" data-id="${next.id}">Details</button></div>
      </div></div></div>`;
    const groups = {};
    mine.forEach((a) => { (groups[a.d] = groups[a.d] || []).push(a); });
    html += `<div class="section"><div class="section-head"><h2>Schedule</h2><span class="faint num">${mine.length} booked</span></div>` +
      Object.keys(groups).map((d) => `<div class="day-group"><div class="day-label">${dayLabel(+d)} · ${longFmt.format(dateAt(+d, '12:00'))}</div>${groups[d].map(actCard).join('')}</div>`).join('') + '</div>';
  } else {
    html += `<div class="empty card">${ic('calendar-days')}<b>No games booked yet</b><span>Find something nearby on the map.</span><button class="btn btn-primary btn-sm" data-act="tab" data-id="explore">Explore the map</button></div>`;
  }
  if (S.tier !== 'lite') {
    html += `<div class="section"><div class="section-head"><h2>Hosting</h2></div><button class="biz" style="background:var(--brand);color:#fff" data-act="hostGame">${ic('megaphone')}<div class="grow"><b>Host a game</b><small>Pick a spot, set spots and price, invite your teams.</small></div>${ic('chevron-right')}</button></div>`;
  }
  $('#scr-games').innerHTML = html;
}

/* ───────── TEAMS (Pro) / LEAGUE (Enterprise) ───────── */
function renderTeams() {
  const el = $('#scr-teams');
  if (S.tier === 'lite') {
    el.innerHTML = `<div class="page-head"><h1>Teams</h1>${tierPill()}</div>
      <div class="locked"><img src="${IMG}field.jpg" alt=""><div class="inner"><span class="tier t-pro" style="justify-self:start">${ic('zap')}Pro feature</span><h2>Build your squad</h2><span style="opacity:.9">Create teams, invite players and schedule matches.</span></div></div>
      <div class="perk-grid section">
        ${[['users', 'Create teams', 'Rosters, roles and team colours.'], ['user-plus', 'Invite players', 'By link, code or from people nearby.'], ['map-pin-plus', 'Pin new spots', 'Add courts and pitches to the map.'], ['calendar-days', 'Schedule matches', 'Availability and reminders built in.']]
          .map(([i, t, d]) => `<div class="card perk">${ic(i)}<b>${t}</b><span>${d}</span></div>`).join('')}
      </div>
      <div class="section"><button class="btn btn-primary btn-block" data-act="setTier" data-id="pro" style="min-height:54px">${ic('zap')}Try Pro · ${PLANS.pro.price}${PLANS.pro.per}</button><div class="faint" style="text-align:center;font-size:13px">Example pricing for the prototype</div></div>`;
    return;
  }
  if (S.tier === 'enterprise') return renderLeague(el);
  el.innerHTML = `<div class="page-head"><h1>Teams</h1><button class="btn btn-primary btn-sm" data-act="newTeam">${ic('plus', 'ic-sm')}New team</button></div>
    <div style="display:grid;gap:12px">${S.teams.map(teamCard).join('')}</div>
    <div class="section"><div class="section-head"><h2>Players near you</h2><span class="faint">Looking for a team</span></div>
      <div class="rows">${PEOPLE.map(personRow).join('')}</div></div>`;
}
function teamCard(t) {
  const s = sp(t.sport), yes = t.members.filter((m) => m.status === 'yes').length;
  return `<button class="card team-card" data-act="openTeam" data-id="${t.id}">
    <div class="team-top"><span class="crest" style="--c:${t.color}">${esc(t.name.split(' ').map((w) => w[0]).join('').slice(0, 2))}</span>
      <div class="grow"><h3>${esc(t.name)}</h3><div class="muted" style="font-size:13.5px;display:flex;gap:6px;align-items:center"><span style="color:${s.c}">${ic(s.icon, 'ic-sm')}</span>${s.name} · ${t.members.length} players · ${t.privacy}</div></div>${ic('chevron-right')}</div>
    <div class="avatars">${t.members.slice(0, 6).map(avatar).join('')}</div>
    ${t.next ? `<div class="team-next">${ic('calendar', 'ic-sm')}<span>vs ${esc(t.next.vs)} · ${dayLabel(t.next.d)} ${timeFmt.format(dateAt(t.next.d, t.next.t))}</span><span class="badge free" style="margin-left:auto">${yes} in</span></div>` : `<div class="team-next">${ic('calendar', 'ic-sm')}No match scheduled</div>`}
  </button>`;
}
function personRow(p) {
  const inv = S.invited.includes(p.id);
  return `<div class="row"><img src="${IMG + p.img}.jpg" alt="" style="width:42px;height:42px;border-radius:50%;object-fit:cover"><div class="grow"><b>${p.name}</b><small>${p.sport} · ${p.dist}</small></div>
    <button class="btn btn-sm ${inv ? 'done' : 'btn-soft'}" data-act="invitePerson" data-id="${p.id}">${inv ? ic('check', 'ic-sm') + 'Invited' : ic('user-plus', 'ic-sm') + 'Invite'}</button></div>`;
}
function openTeam(id) {
  const t = S.teams.find((x) => x.id === id), s = sp(t.sport);
  const cnt = (st) => t.members.filter((m) => m.status === st).length;
  push(`<div class="view-bar"><button class="icon-btn" data-act="back" aria-label="Back">${ic('arrow-left')}</button><h2>${esc(t.name)}</h2><button class="icon-btn" data-act="invite" data-id="${t.id}" aria-label="Invite players">${ic('user-plus')}</button></div>
    <div class="view-body" style="padding-top:4px">
      <div class="card" style="padding:16px;display:grid;gap:14px">
        <div class="team-top"><span class="crest" style="--c:${t.color};width:64px;height:64px;font-size:26px">${esc(t.name.split(' ').map((w) => w[0]).join('').slice(0, 2))}</span><div class="grow"><div class="eyebrow">${s.name} · ${t.privacy}</div><h3 style="font-size:26px">${esc(t.name)}</h3></div></div>
        <div style="display:flex;gap:8px"><button class="btn btn-primary btn-sm" style="flex:1" data-act="invite" data-id="${t.id}">${ic('user-plus', 'ic-sm')}Invite</button><button class="btn btn-soft btn-sm" style="flex:1" data-act="scheduleMatch" data-id="${t.id}">${ic('calendar', 'ic-sm')}Schedule</button><button class="btn btn-ghost btn-sm" style="flex:1" data-act="toastMsg" data-msg="Team chat opened">${ic('message-circle', 'ic-sm')}Chat</button></div>
      </div>
      ${t.next ? `<div class="card" style="padding:14px;display:grid;gap:12px"><div class="eyebrow">Next match</div><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><div><b style="font-size:17px">vs ${esc(t.next.vs)}</b><div class="muted" style="font-size:13.5px">${longFmt.format(dateAt(t.next.d, t.next.t))} · ${timeFmt.format(dateAt(t.next.d, t.next.t))}<br>${esc(t.next.venue)}</div></div></div>
        <div class="avail"><div><b style="color:var(--ok)">${cnt('yes')}</b><small>Playing</small></div><div><b style="color:var(--warn)">${cnt('maybe')}</b><small>Maybe</small></div><div><b style="color:var(--hot)">${cnt('no')}</b><small>Out</small></div></div></div>` : ''}
      <div class="section-head"><h2 style="font-size:20px;font-style:italic;text-transform:uppercase">Roster</h2><span class="faint num">${t.members.length} players</span></div>
      <div class="rows">${t.members.map((m) => `<div class="row"><div class="avatars">${avatar(m)}</div><div class="grow"><b>${esc(m.name)}</b><small>${m.role}</small></div><span class="badge ${m.status === 'yes' ? 'free' : m.status === 'maybe' ? '' : 'live'}">${m.status === 'yes' ? 'Playing' : m.status === 'maybe' ? 'Maybe' : m.status === 'invited' ? 'Invited' : 'Out'}</span></div>`).join('')}</div>
    </div>`);
}
function inviteSheet(teamId) {
  const t = S.teams.find((x) => x.id === teamId) || S.teams[0];
  const code = (t.name.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase() + '-' + (1000 + (t.id.length * 7919 + t.name.length * 31) % 9000));
  const link = 'https://letsplay.app/join/' + code.toLowerCase();
  openSheet(`${sheetHead('Invite players', esc(t.name))}
    <div class="field"><span class="lbl">Share invite link</span><div class="copybox"><code id="invLink">${link}</code><button class="btn btn-primary btn-sm" data-act="copy" data-target="invLink">${ic('copy', 'ic-sm')}Copy</button></div></div>
    <div class="field"><span class="lbl">Or use team code</span><div class="copybox"><code id="invCode" style="font-size:20px;font-weight:700;letter-spacing:.12em">${code}</code><button class="btn btn-ghost btn-sm" data-act="copy" data-target="invCode">${ic('copy', 'ic-sm')}Copy</button></div></div>
    <div class="field"><label for="invSearch">Invite by name, phone or email</label><div style="display:flex;gap:8px"><input class="input" id="invSearch" placeholder="Name, phone or email"><button class="btn btn-soft" data-act="inviteTyped" data-id="${t.id}">${ic('send')}</button></div></div>
    <div class="field"><span class="lbl">Suggested near you</span><div class="rows" id="invPeople">${PEOPLE.map(personRow).join('')}</div></div>
    <button class="btn btn-primary btn-block" data-act="closeSheet">Done</button>`);
}
function newTeamSheet() {
  openSheet(`${sheetHead('New team')}
    <form id="teamForm" class="sheet-body" style="gap:14px">
      <div class="field"><label for="teamName">Team name</label><input class="input" id="teamName" required placeholder="e.g. Thursday Night Strikers"></div>
      <div class="field"><span class="lbl">Sport</span><div class="chips" id="teamSport" style="flex-wrap:wrap">${Object.keys(SPORTS).slice(0, 8).map((k, i) => `<button type="button" class="chip sport" style="--c:${SPORTS[k].c}" data-act="pickOne" data-group="teamSport" data-id="${k}" aria-pressed="${i === 0}">${ic(SPORTS[k].icon)}${SPORTS[k].name}</button>`).join('')}</div></div>
      <div class="field"><span class="lbl">Team colour</span><div class="swatches" id="teamColor">${TEAM_COLORS.map((c, i) => `<button type="button" class="swatch" style="--c:${c}" data-act="pickOne" data-group="teamColor" data-id="${c}" aria-pressed="${i === 1}" aria-label="Colour ${c}"></button>`).join('')}</div></div>
      <div class="field"><span class="lbl">Who can join?</span><div class="seg" id="teamPrivacy"><button type="button" data-act="pickOne" data-group="teamPrivacy" data-id="Invite only" aria-pressed="true">Invite only</button><button type="button" data-act="pickOne" data-group="teamPrivacy" data-id="Public" aria-pressed="false">Anyone nearby</button></div></div>
      <button class="btn btn-primary btn-block" type="submit">${ic('users')}Create team</button>
    </form>`, { onMount: (sh) => {
    $('#teamForm', sh).addEventListener('submit', (e) => {
      e.preventDefault();
      const t = { id: 't' + Date.now(), name: $('#teamName').value.trim() || 'New team', sport: $('#teamSport [aria-pressed="true"]').dataset.id,
        color: $('#teamColor [aria-pressed="true"]').dataset.id, privacy: $('#teamPrivacy [aria-pressed="true"]').dataset.id,
        members: [{ name: 'Alex Rivera', img: 'av1', role: 'Captain', status: 'yes' }], next: null };
      S.teams.unshift(t); save(); renderTeams(); inviteSheet(t.id); toast('Team created. Now invite your players', 'users');
    });
  } });
}
function scheduleSheet(teamId) {
  const venues = ACTIVITIES.map((a) => a.venue).filter((v, i, arr) => arr.indexOf(v) === i).concat(S.pins.map((p) => p.name + ' (community spot)'));
  openSheet(`${sheetHead('Schedule match')}
    <div class="field"><label for="vsName">Opponent or session</label><input class="input" id="vsName" placeholder="e.g. Harbour United" value="Training session"></div>
    <div class="field"><span class="lbl">Day</span><div class="chips" id="schDay">${[1, 2, 3, 4, 5, 6, 7].map((d, i) => `<button type="button" class="chip" data-act="pickOne" data-group="schDay" data-id="${d}" aria-pressed="${i === 1}">${dayLabel(d)}</button>`).join('')}</div></div>
    <div class="field"><label for="schTime">Kick-off</label><input class="input" type="time" id="schTime" value="19:00"></div>
    <div class="field"><label for="schVenue">Venue</label><select class="input" id="schVenue">${venues.map((v) => `<option>${esc(v)}</option>`).join('')}</select></div>
    <button class="btn btn-primary btn-block" data-act="saveMatch" data-id="${teamId}">${ic('send')}Schedule & ask for availability</button>`);
}

/* Enterprise league */
const teamById = (id) => ORG.teams.find((t) => t.id === id);
function standings() { return ORG.teams.map((t) => ({ ...t, p: t.w + t.d + t.l, pts: t.w * 3 + t.d })).sort((a, b) => b.pts - a.pts || b.w - a.w); }
function renderLeague(el) {
  const segs = [['overview', 'Overview'], ['schedule', 'Schedule'], ['leaderboard', 'Leaderboard'], ['teams', 'Teams']];
  let body = '';
  if (S.entTab === 'overview') {
    const st = standings();
    body = `<div class="org-hero"><div style="display:flex;justify-content:space-between;align-items:center"><span class="tier t-enterprise" style="background:rgba(255,255,255,.18)">${ic('building-2')}${ORG.name}</span><span style="font-size:13px;opacity:.85">Week 8 of 12</span></div>
        <h2>${ORG.league}</h2><div style="opacity:.85;font-size:14px">${ORG.teams.length} department teams · 6 sports</div>
        <div style="display:flex;gap:8px;position:relative;z-index:1"><button class="btn btn-volt btn-sm" data-act="addFixture">${ic('plus', 'ic-sm')}Add fixture</button><button class="btn btn-sm" style="background:rgba(255,255,255,.18);color:#fff" data-act="entTab" data-id="leaderboard">${ic('trophy', 'ic-sm')}Standings</button></div></div>
      <div class="stats section" style="margin-top:12px">
        <div class="card stat"><span>Active players</span><b class="num">248</b><span class="delta">${ic('trending-up', 'ic-sm')}+18 this month</span></div>
        <div class="card stat"><span>Participation</span><b class="num">60%</b><span class="delta">${ic('trending-up', 'ic-sm')}+7 pts</span></div>
        <div class="card stat"><span>Fixtures this week</span><b class="num">${S.fixtures.length}</b><span class="faint" style="font-size:12px">across 5 venues</span></div>
        <div class="card stat"><span>Leader</span><b style="font-size:22px">${st[0].name}</b><span class="faint num" style="font-size:12px">${st[0].pts} pts</span></div>
      </div>
      <div class="faint" style="font-size:12px;margin-top:6px">Sample company data for the prototype.</div>
      <div class="section"><div class="section-head"><h2>Up next</h2><button class="link" data-act="entTab" data-id="schedule">Full schedule</button></div>${S.fixtures.slice(0, 2).map(fixtureCard).join('')}</div>
      <div class="section"><div class="section-head"><h2>Participation</h2><span class="faint">by department</span></div>
        <div class="card dept-bars" style="padding:14px">${ORG.participation.map(([d, v]) => `<div class="r"><span>${d}</span><div class="bar"><i style="width:${v}%"></i></div><b class="num" style="text-align:right">${v}%</b></div>`).join('')}</div></div>`;
  } else if (S.entTab === 'schedule') {
    const days = [0, 1, 2, 3, 4, 5, 6];
    const list = S.fixtures.filter((f) => f.d === S.schedDay);
    body = `<div class="weekstrip" role="group" aria-label="Pick a day">${days.map((d) => { const dt = dateAt(d, '12:00'); const has = S.fixtures.some((f) => f.d === d); return `<button data-act="schedDay" data-id="${d}" aria-pressed="${S.schedDay === d}">${wkFmt.format(dt)}<b class="num">${dt.getDate()}</b>${has ? '<i></i>' : '<span style="height:5px"></span>'}</button>`; }).join('')}</div>
      <div class="section"><div class="section-head"><h2>${longFmt.format(dateAt(S.schedDay, '12:00'))}</h2><button class="btn btn-primary btn-sm" data-act="addFixture">${ic('plus', 'ic-sm')}Add</button></div>
      ${list.length ? list.map(fixtureCard).join('') : `<div class="empty card">${ic('calendar')}<b>No fixtures this day</b><button class="btn btn-soft btn-sm" data-act="addFixture">Schedule one</button></div>`}</div>`;
  } else if (S.entTab === 'leaderboard') {
    const st = standings();
    const sports = ['all', 'football', 'basketball', 'badminton', 'volleyball', 'cricket'];
    body = `<div class="chips">${sports.map((k) => `<button class="chip ${k !== 'all' ? 'sport' : ''}" style="${k !== 'all' ? '--c:' + SPORTS[k].c : ''}" data-act="lbSport" data-id="${k}" aria-pressed="${S.lbSport === k}">${k === 'all' ? ic('trophy') + 'Overall' : ic(SPORTS[k].icon) + SPORTS[k].name}</button>`).join('')}</div>
      <div class="podium section">${[st[1], st[0], st[2]].map((t, i) => `<div class="p${[2, 1, 3][i]}"><span class="crest" style="--c:${t.c}">${t.ab}</span><span class="nm">${t.name}</span><span class="pts num">${t.pts} pts</span><div class="step">${[2, 1, 3][i]}</div></div>`).join('')}</div>
      <div class="card table-wrap section" style="padding:4px 8px"><table class="lb"><thead><tr><th>#</th><th style="text-align:left">Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>Pts</th><th>Form</th></tr></thead>
      <tbody>${st.map((t, i) => `<tr class="${t.id === 'e1' ? 'mine' : ''}"><td>${i + 1}</td><td class="team"><div><span class="crest sm" style="--c:${t.c}">${t.ab}</span>${t.name}</div></td><td>${t.p}</td><td>${t.w}</td><td>${t.d}</td><td>${t.l}</td><td class="pts">${t.pts}</td><td><span class="form">${t.form.slice(-3).split('').map((r) => `<i class="${r}">${r}</i>`).join('')}</span></td></tr>`).join('')}</tbody></table></div>
      <div class="faint" style="font-size:12.5px">3 points for a win, 1 for a draw. Your team is highlighted. ${S.lbSport !== 'all' ? 'Per-sport tables use the same sample data in this prototype.' : ''}</div>`;
  } else {
    body = `<div style="display:flex;gap:8px"><button class="btn btn-primary btn-sm" style="flex:1" data-act="autoBalance">${ic('shuffle', 'ic-sm')}Auto-balance teams</button><button class="btn btn-soft btn-sm" style="flex:1" data-act="toastMsg" data-msg="Invite sent to all employees">${ic('send', 'ic-sm')}Invite employees</button></div>
      <div style="display:grid;gap:10px" class="section">${ORG.teams.map((t) => `<div class="card team-card"><div class="team-top"><span class="crest" style="--c:${t.c}">${t.ab}</span><div class="grow"><h3>${t.name}</h3><div class="muted" style="font-size:13.5px">${t.dept} · ${t.players} players</div></div><span class="badge ent num">${t.w * 3 + t.d} pts</span></div></div>`).join('')}</div>`;
  }
  el.innerHTML = `<div class="page-head"><h1>League</h1>${tierPill()}</div>
    <div class="seg" role="group" aria-label="League sections">${segs.map(([k, n]) => `<button data-act="entTab" data-id="${k}" aria-pressed="${S.entTab === k}">${n}</button>`).join('')}</div>
    <div class="section" style="margin-top:14px">${body}</div>`;
}
function fixtureCard(f) {
  const a = teamById(f.a), b = teamById(f.b), s = sp(f.sport);
  return `<div class="card fixture">
    <div class="side"><span class="crest" style="--c:${a.c}">${a.ab}</span>${a.name}</div>
    <div class="mid"><span class="badge" style="background:${s.c};color:#fff">${ic(s.icon)}${s.name}</span><b class="num">${timeFmt.format(dateAt(f.d, f.t))}</b><span class="faint" style="font-size:12px">${dayLabel(f.d)}</span></div>
    <div class="side"><span class="crest" style="--c:${b.c}">${b.ab}</span>${b.name}</div>
    <div class="fixture-meta"><span>${ic('map-pin')}${esc(f.venue)}</span><span>${ic('users')}Squads confirmed</span></div></div>`;
}
function addFixtureSheet() {
  const opts = ORG.teams.map((t) => `<option value="${t.id}">${t.name}</option>`).join('');
  openSheet(`${sheetHead('Add fixture', ORG.league)}
    <div class="field"><span class="lbl">Sport</span><div class="chips" id="fxSport" style="flex-wrap:wrap">${['football', 'basketball', 'badminton', 'volleyball', 'cricket', 'running'].map((k, i) => `<button type="button" class="chip sport" style="--c:${SPORTS[k].c}" data-act="pickOne" data-group="fxSport" data-id="${k}" aria-pressed="${i === 0}">${ic(SPORTS[k].icon)}${SPORTS[k].name}</button>`).join('')}</div></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div class="field"><label for="fxA">Home</label><select class="input" id="fxA">${opts}</select></div><div class="field"><label for="fxB">Away</label><select class="input" id="fxB">${opts.replace('value="e2"', 'value="e2" selected')}</select></div></div>
    <div class="field"><span class="lbl">Day</span><div class="chips" id="fxDay">${[0, 1, 2, 3, 4, 5, 6].map((d) => `<button type="button" class="chip" data-act="pickOne" data-group="fxDay" data-id="${d}" aria-pressed="${d === S.schedDay}">${dayLabel(d)}</button>`).join('')}</div></div>
    <div style="display:grid;grid-template-columns:1fr 1.4fr;gap:10px"><div class="field"><label for="fxTime">Time</label><input class="input" type="time" id="fxTime" value="12:30"></div>
    <div class="field"><label for="fxVenue">Venue</label><select class="input" id="fxVenue">${['Riverside Park · Pitch 2', 'Northgate Courts', 'Harbour Sports Hall', 'Lakeside Sand Courts', 'Oval Green'].map((v) => `<option>${v}</option>`).join('')}</select></div></div>
    <div class="muted" style="font-size:13px;display:flex;gap:6px;align-items:center">${ic('bell', 'ic-sm')}Both squads get a notification and a calendar invite.</div>
    <button class="btn btn-primary btn-block" data-act="saveFixture">${ic('calendar-days')}Add to schedule</button>`);
}

/* ───────── SHOP ───────── */
function renderShop() {
  const cats = [['all', 'All', 'layers'], ['equipment', 'Equipment', 'dumbbell'], ['footwear', 'Footwear', 'footprints'], ['apparel', 'Outfits', 'shirt'], ['accessories', 'Accessories', 'package'], ['deals', 'Deals', 'percent']];
  const list = PRODUCTS.filter((p) => S.shopCat === 'all' || p.cat === S.shopCat || (S.shopCat === 'deals' && p.was));
  const cartN = S.cart.reduce((n, c) => n + c.qty, 0);
  const memberOff = S.tier !== 'lite';
  $('#scr-shop').innerHTML = `
    <div class="page-head"><h1>Shop</h1><div style="display:flex;gap:8px"><button class="icon-btn" data-act="toastMsg" data-msg="Search coming soon in the prototype" data-icon="search" aria-label="Search shop">${ic('search')}</button><button class="icon-btn" data-act="cart" aria-label="Cart, ${cartN} items">${ic('shopping-bag')}${cartN ? `<span class="count num">${cartN}</span>` : ''}</button></div></div>
    <div class="promos">
      <button class="promo" data-act="shopCat" data-id="apparel"><img src="${IMG}gym.jpg" alt=""><span class="badge volt" style="align-self:flex-start">Up to 30% off</span><h3>Winter kit drop</h3><p>Thermal layers and training outfits.</p></button>
      <button class="promo" data-act="toastMsg" data-msg="Registration form opened" data-icon="trophy"><img src="${IMG}football.jpg" alt=""><span class="sponsor">Sponsored</span><span class="badge" style="align-self:flex-start;background:#fff;color:#0D1530">City Futsal League</span><h3>Team entries open</h3><p>8-week winter season. Register by Friday.</p></button>
      <button class="promo brandy" data-act="plans"><span class="tier t-pro" style="align-self:flex-start;background:rgba(255,255,255,.2)">${ic('zap')}Members</span><h3>Pro saves 10%</h3><p>On every order, plus free delivery over ${CUR}50.</p></button>
    </div>
    <div class="chips" style="margin-top:16px">${cats.map(([k, n, i]) => `<button class="chip" data-act="shopCat" data-id="${k}" aria-pressed="${S.shopCat === k}">${ic(i)}${n}</button>`).join('')}</div>
    <div class="section"><div class="section-head"><h2>${S.shopCat === 'all' ? 'Trending near you' : cats.find((c) => c[0] === S.shopCat)[1]}</h2><span class="faint num">${list.length} items</span></div>
      <div class="grid2">${list.map((p) => prodCard(p, memberOff)).join('')}</div></div>
    ${S.tier === 'enterprise' ? `<div class="section"><button class="biz" style="background:var(--ent);color:#fff" data-act="toastMsg" data-msg="Bulk kit request sent to your account manager" data-icon="package">${ic('shirt')}<div class="grow"><b>Team kits for ${ORG.name}</b><small>Bulk-order printed jerseys for all ${ORG.teams.length} teams.</small></div>${ic('chevron-right')}</button></div>` : ''}
    <div class="section"><button class="biz" data-act="promote">${ic('megaphone')}<div class="grow"><b>Promote your business</b><small>Featured map pins, shop banners and event sponsorship for local sports businesses.</small></div>${ic('chevron-right')}</button></div>`;
}
function prodCard(p, memberOff) {
  const fav = S.fav.includes(p.id);
  return `<div class="prod"><div class="prod-img"><button data-act="product" data-id="${p.id}" style="display:block;width:100%;height:100%" aria-label="${esc(p.name)}"><img src="${IMG + p.img}.jpg" alt="" loading="lazy"></button>
    <div class="badges">${p.was ? `<span class="badge volt">-${Math.round((1 - p.price / p.was) * 100)}%</span>` : ''}${memberOff ? '<span class="badge brand">-10% Pro</span>' : ''}</div>
    <button class="fav ${fav ? 'on' : ''}" data-act="fav" data-id="${p.id}" aria-label="${fav ? 'Remove from' : 'Save to'} favourites" aria-pressed="${fav}">${ic('heart', 'ic-sm')}</button></div>
    <button data-act="product" data-id="${p.id}" style="text-align:left;display:grid;gap:4px"><span class="faint" style="font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase">${p.brand}</span><span class="prod-name">${esc(p.name)}</span>
    <span class="prod-price"><b class="num">${CUR}${p.price}</b>${p.was ? `<s class="num">${CUR}${p.was}</s>` : ''}</span><span class="rating">${ic('star')}<span class="num">${p.rating} (${p.reviews})</span></span></button></div>`;
}
function openProduct(id) {
  const p = PRODUCTS.find((x) => x.id === id);
  push(`<div class="view-hero" style="height:360px"><img src="${IMG + p.img}.jpg" alt="">
      <div class="view-nav"><button data-act="back" aria-label="Back">${ic('arrow-left')}</button><button data-act="cart" aria-label="Cart">${ic('shopping-bag')}</button></div></div>
    <div class="view-body">
      <div style="display:grid;gap:6px"><span class="eyebrow">${p.brand}</span><h1 style="font-size:32px;font-style:italic;text-transform:uppercase;font-weight:800;line-height:1">${esc(p.name)}</h1>
        <div style="display:flex;gap:10px;align-items:center"><span class="rating">${ic('star')}<span class="num">${p.rating} · ${p.reviews} reviews</span></span>${p.was ? `<span class="badge volt">Save ${CUR}${p.was - p.price}</span>` : ''}</div></div>
      ${p.sizes ? `<div class="field"><span class="lbl">Size</span><div class="sizes" id="pSize">${p.sizes.map((z, i) => `<button data-act="pickOne" data-group="pSize" data-id="${z}" aria-pressed="${i === Math.floor(p.sizes.length / 2)}">${z}</button>`).join('')}</div></div>` : ''}
      <div class="rows">
        <div class="row">${ic('store', 'lead')}<div class="grow"><b>Sold by ${esc(p.seller)}</b><small>Local seller · 1.2 km away · click & collect today</small></div></div>
        <div class="row">${ic('truck', 'lead')}<div class="grow"><b>Delivery in 2–3 days</b><small>Free over ${CUR}50 for Pro members</small></div></div>
        <div class="row">${ic('rotate-ccw', 'lead')}<div class="grow"><b>30-day returns</b><small>Free returns to any partner store</small></div></div>
      </div>
      ${S.tier === 'lite' ? `<button class="card" style="padding:14px;display:flex;gap:12px;align-items:center;text-align:left" data-act="plans"><span class="tier t-pro">${ic('zap')}Pro</span><span class="grow" style="font-size:14px">Pro members pay <b class="num">${CUR}${(p.price * 0.9).toFixed(2)}</b> for this item.</span>${ic('chevron-right')}</button>` : ''}
    </div>
    <div class="view-cta"><div class="price"><span class="faint" style="font-size:12px">${S.tier !== 'lite' ? 'Member price' : 'Price'}</span><b class="num">${CUR}${S.tier !== 'lite' ? (p.price * 0.9).toFixed(2) : p.price}</b></div><button class="btn btn-primary" data-act="addCart" data-id="${p.id}">${ic('shopping-bag')}Add to bag</button></div>`);
}
const unitPrice = (p) => (S.tier !== 'lite' ? p.price * 0.9 : p.price);
function cartSheet() {
  if (!S.cart.length) { openSheet(`${sheetHead('Your bag')}<div class="empty">${ic('shopping-bag')}<b>Your bag is empty</b><span>Gear up for your next game.</span></div><button class="btn btn-primary btn-block" data-act="closeSheet">Browse the shop</button>`); return; }
  const sub = S.cart.reduce((n, c) => n + unitPrice(PRODUCTS.find((p) => p.id === c.id)) * c.qty, 0);
  const ship = sub >= 50 && S.tier !== 'lite' ? 0 : 4.99;
  openSheet(`${sheetHead('Your bag', S.cart.reduce((n, c) => n + c.qty, 0) + ' items')}
    <div style="display:grid;gap:12px">${S.cart.map((c, i) => { const p = PRODUCTS.find((x) => x.id === c.id); return `<div class="cart-item"><img src="${IMG + p.img}.jpg" alt=""><div style="min-width:0"><b style="font-size:14.5px">${esc(p.name)}</b><div class="faint" style="font-size:13px">${c.size ? 'Size ' + c.size + ' · ' : ''}${CUR}${unitPrice(p).toFixed(2)}</div></div><div class="stepper"><button data-act="qty" data-i="${i}" data-d="-1" aria-label="Decrease">${ic('minus', 'ic-sm')}</button><b class="num">${c.qty}</b><button data-act="qty" data-i="${i}" data-d="1" aria-label="Increase">${ic('plus', 'ic-sm')}</button></div></div>`; }).join('')}</div>
    <div class="sum num"><div><span class="muted">Subtotal</span><span>${CUR}${sub.toFixed(2)}</span></div><div><span class="muted">Delivery</span><span>${ship ? CUR + ship : 'Free'}</span></div>${S.tier !== 'lite' ? `<div><span class="muted">Pro discount applied</span><span style="color:var(--ok)">10%</span></div>` : ''}<div class="total"><span>Total</span><span>${CUR}${(sub + ship).toFixed(2)}</span></div></div>
    <button class="btn btn-primary btn-block" data-act="checkout" style="min-height:54px">${ic('wallet')}Pay with ${PAY}</button>`);
}
function promoteSheet() {
  const pk = [['map-pin', 'Featured map pin', 'Your store or venue highlighted on the Explore map within 5 km.', CUR + '49/week'], ['megaphone', 'Shop banner', 'A banner slot in the marketplace carousel.', CUR + '99/week'], ['trophy', 'Event sponsorship', 'Brand a league, tournament or run club.', 'Custom']];
  openSheet(`${sheetHead('Promote your business', 'Reach active players near you')}
    <div class="pick">${pk.map(([i, t, d, p], n) => `<button class="opt" data-act="pickMany" aria-pressed="${n === 0}"><span class="sport-ic" style="--c:var(--ink)">${ic(i)}</span><div style="min-width:0"><b>${t}</b><div class="faint" style="font-size:13px">${d}</div><div style="font-weight:700;margin-top:2px" class="num">${p}</div></div><span class="tick">${ic('check')}</span></button>`).join('')}</div>
    <div class="faint" style="font-size:12.5px">Example packages and pricing for the prototype.</div>
    <button class="btn btn-primary btn-block" data-act="toastClose" data-msg="Thanks! Our partnerships team will be in touch" data-icon="megaphone">Request a call back</button>`);
}

/* ───────── PROFILE ───────── */
function renderMe() {
  const P = PLANS[S.tier];
  $('#scr-me').innerHTML = `
    <div class="me-head"><img src="${IMG}av1.jpg" alt=""><div style="flex:1;min-width:0"><h1>Alex Rivera</h1><div class="muted" style="display:flex;gap:6px;align-items:center">${ic('map-pin', 'ic-sm')}Riverside · plays football, tennis</div></div><button class="icon-btn" data-act="toastMsg" data-msg="Settings are not part of the prototype yet" data-icon="settings" aria-label="Settings">${ic('settings')}</button></div>
    <div class="me-stats section" style="margin-top:16px"><div class="card"><b class="num">24</b><span>Games played</span></div><div class="card"><b class="num">31h</b><span>Active this year</span></div><div class="card"><b class="num">${S.tier === 'lite' ? 0 : S.teams.length}</b><span>Teams</span></div></div>
    <div class="plan-card section t-${S.tier}"><div class="eyebrow" style="color:rgba(255,255,255,.75)">Your plan</div><h2>${P.name}</h2><div style="opacity:.9;max-width:30ch;position:relative;z-index:1">${P.blurb}</div><button class="btn btn-sm" data-act="plans">${S.tier === 'enterprise' ? 'Manage plan' : 'Compare plans'}</button></div>
    <div class="section"><div class="section-head"><h2>Family</h2><button class="link" data-act="toastMsg" data-msg="Add a family member form opens here">Add</button></div>
      <div class="rows">${FAMILY.map((f, i) => `<div class="row"><div class="avatars">${f.img ? `<img src="${IMG + f.img}.jpg" alt="">` : `<span style="background:${['', '#E3336A', '#0E9FE0'][i]};color:#fff">${f.initials}</span>`}</div><div class="grow"><b>${f.name}</b><small>${f.note}</small></div>${ic('chevron-right')}</div>`).join('')}</div></div>
    <div class="section"><div class="section-head"><h2>Settings</h2></div>
      <div class="rows">
        ${[['bell', 'Notifications', 'Cancellations and venue changes always on'], ['wallet', 'Payment methods', PAY + ' · Visa •• 4242'], ['accessibility', 'Accessibility', 'Text size, reduced motion, venue needs'], ['globe', 'Language & region', 'English · km'], ['shield-check', 'Privacy & safety', 'Who can invite you and see your games']]
          .map(([i, t, d]) => `<button class="row" data-act="toastMsg" data-msg="${t} settings open here">${ic(i, 'lead')}<div class="grow"><b>${t}</b><small>${d}</small></div>${ic('chevron-right')}</button>`).join('')}
        <button class="row" data-act="reset">${ic('rotate-ccw', 'lead')}<div class="grow"><b>Reset demo data</b><small>Start the prototype over</small></div></button>
      </div></div>
    <div class="faint" style="text-align:center;font-size:12.5px;margin-top:18px">LetsPlay prototype · sample data only</div>`;
}
function plansSheet() {
  openSheet(`${sheetHead('Choose your plan', 'Switch any time. Example pricing.')}
    <div style="display:grid;gap:14px;padding-top:6px">${Object.keys(PLANS).map((k) => { const P = PLANS[k]; return `<button class="plan t-${k}" data-act="setTier" data-id="${k}" aria-pressed="${S.tier === k}">${S.tier === k ? '<span class="current">Current</span>' : ''}
      <div class="plan-top"><span class="tier t-${k}">${ic(P.icon)}${P.name}</span><span class="plan-price num">${P.price}<small>${P.per}</small></span></div>
      <div class="muted" style="font-size:14px">${P.blurb}</div>
      <ul class="feat-list">${P.feats.map((f) => `<li>${ic('circle-check')}${f}</li>`).join('')}${P.no.map((f) => `<li class="off">${ic('lock')}${f}</li>`).join('')}</ul></button>`; }).join('')}</div>`);
}
function upsell(kind) {
  const m = { pin: ['Pin new spots with Pro', 'Add courts, pitches and parks to the map so others can find them.', 'map-pin-plus'], teams: ['Teams are a Pro feature', 'Create teams, invite players and schedule matches.', 'users'] }[kind];
  openSheet(`<div class="success" style="padding-top:4px"><div class="burst" style="background:var(--brand);color:#fff">${ic(m[2])}</div><h2>${m[0]}</h2><div class="muted" style="max-width:32ch">${m[1]}</div></div>
    <ul class="feat-list card" style="padding:14px">${PLANS.pro.feats.slice(1).map((f) => `<li>${ic('circle-check')}${f}</li>`).join('')}</ul>
    <button class="btn btn-primary btn-block" data-act="setTier" data-id="pro" style="min-height:54px">${ic('zap')}Upgrade to Pro · ${PLANS.pro.price}${PLANS.pro.per}</button>
    <button class="btn btn-ghost btn-block" data-act="closeSheet">Not now</button>`);
}

/* ───────── Demo panel (wide screens) ───────── */
function renderPanel() {
  const P = PLANS[S.tier];
  $('#panelTier').innerHTML = Object.keys(PLANS).map((k) => `<button data-act="setTier" data-id="${k}" data-quiet="1" aria-pressed="${S.tier === k}">${PLANS[k].name}</button>`).join('');
  $('#panelFeats').innerHTML = P.feats.map((f) => `<li>${ic('circle-check')}${f}</li>`).join('') + P.no.map((f) => `<li class="off">${ic('lock')}${f}</li>`).join('');
  const tries = { lite: ['Tap a pin on the map, then Join', 'Drag the list sheet up and down', 'Tap Pin a spot to see the Pro upsell'], pro: ['Tap Pin a spot and drop a new place', 'Teams → open a team → Invite', 'Teams → New team'], enterprise: ['League → Schedule → Add fixture', 'League → Leaderboard', 'Shop → bulk team kits'] }[S.tier];
  $('#panelTry').innerHTML = tries.map((t) => `<li>${ic('arrow-right')}${t}</li>`).join('');
}

/* ───────── Actions ───────── */
function pickOne(el) { $$(`#${el.dataset.group} [aria-pressed]`).forEach((b) => b.setAttribute('aria-pressed', b === el)); }
const A = {
  tab: (el) => go(el.dataset.id),
  filter: (el) => { S.filter = el.dataset.id; save(); deselect(); renderExploreChrome(); },
  clearFilters: () => { S.filter = 'all'; S.query = ''; $('#q').value = ''; save(); renderExploreChrome(); },
  pin: (el) => selectAct(el.dataset.id),
  deselect: () => deselect(),
  spot: (el) => { const p = S.pins.find((x) => x.id === el.dataset.id); const s = sp(p.sport);
    openSheet(`${sheetHead(esc(p.name), `Community spot · pinned by ${esc(p.by)}`)}<div class="rows"><div class="row"><span class="sport-ic" style="--c:${s.c}">${ic(s.icon)}</span><div class="grow"><b>${s.name} · ${p.setting}</b><small>${esc(p.note || 'No details yet.')}</small></div></div><div class="row">${ic('navigation', 'lead')}<div class="grow"><b>${fmtKm(kmFrom(p.x, p.y))} away</b><small>Free to use</small></div></div></div>
      ${can.pin() ? `<button class="btn btn-primary btn-block" data-act="hostGame">${ic('megaphone')}Host a game here</button>` : `<button class="btn btn-soft btn-block" data-act="plans">${ic('lock')}Upgrade to host games here</button>`}`); },
  store: () => { const st = STORES[0];
    openSheet(`<div class="promo" style="height:150px;border-radius:18px"><img src="${IMG}p-futsal.jpg" alt=""><span class="sponsor">Sponsored</span><h3>${esc(st.name)}</h3><p>${esc(st.promo)}</p></div>
      <div class="rows"><div class="row">${ic('navigation', 'lead')}<div class="grow"><b>${fmtKm(kmFrom(st.x, st.y))} away</b><small>Open until 8 pm</small></div></div></div>
      <button class="btn btn-primary btn-block" data-act="gotoShop">${ic('shopping-bag')}Shop the deal</button>`); },
  gotoShop: () => { S.shopCat = 'all'; go('shop'); },
  open: (el) => { closeSheet(true); openAct(el.dataset.id); },
  join: (el) => joinFlow(el.dataset.id),
  pickMany: (el) => { el.setAttribute('aria-pressed', el.getAttribute('aria-pressed') !== 'true'); const id = $('.sheet [data-act="confirmJoin"]'); if (id) updateJoinTotal(ACTIVITIES.find((a) => a.id === id.dataset.id)); },
  pickOne,
  confirmJoin: (el) => confirmJoin(el.dataset.id),
  gotoGames: () => go('games'),
  back: () => pop(),
  share: () => toast('Link copied. Share it with friends', 'share-2'),
  closeSheet: () => closeSheet(),
  sheetToggle: () => Sheet.toggle(),
  locate: () => { deselect(); Map.center(ME.x, ME.y, true, 45); },
  zoomIn: () => Map.zoom(1.25), zoomOut: () => Map.zoom(0.8),
  dropStart: () => Drop.start(), dropCancel: () => Drop.stop(), dropConfirm: () => Drop.confirm(),
  plans: () => plansSheet(),
  setTier: (el) => { const t = el.dataset.id; closeSheet(true); setTier(t); if (!el.dataset.quiet) toast(`You're on ${PLANS[t].name}`, PLANS[t].icon); },
  toastMsg: (el) => toast(el.dataset.msg, el.dataset.icon || 'circle-check'),
  toastClose: (el) => { closeSheet(); toast(el.dataset.msg, el.dataset.icon || 'circle-check'); },
  ackAlert: () => { S.ackAlert = true; save(); renderGames(); toast('Thanks. We will remind you on the day', 'bell'); },
  hostGame: () => { closeSheet(true); if (!can.pin()) return upsell('pin');
    openSheet(`${sheetHead('Host a game')}<div class="field"><label for="hgTitle">Title</label><input class="input" id="hgTitle" value="Thursday 7-a-side"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div class="field"><label for="hgSpots">Spots</label><input class="input" id="hgSpots" type="number" value="14" min="2"></div><div class="field"><label for="hgPrice">Price (${CUR})</label><input class="input" id="hgPrice" type="number" value="5" min="0"></div></div>
      <div class="field"><span class="lbl">Invite</span><div class="chips" id="hgInv">${S.teams.map((t, i) => `<button type="button" class="chip" data-act="pickMany" aria-pressed="${i === 0}">${ic('users')}${esc(t.name)}</button>`).join('')}<button type="button" class="chip" data-act="pickMany" aria-pressed="true">${ic('globe')}Anyone nearby</button></div></div>
      <button class="btn btn-primary btn-block" data-act="toastClose" data-msg="Game published to the map" data-icon="megaphone">${ic('megaphone')}Publish game</button>`); },
  newTeam: () => (can.teams() ? newTeamSheet() : upsell('teams')),
  openTeam: (el) => openTeam(el.dataset.id),
  invite: (el) => inviteSheet(el.dataset.id),
  invitePerson: (el) => { const id = el.dataset.id; if (!S.invited.includes(id)) S.invited.push(id); save(); el.outerHTML = `<button class="btn btn-sm done">${ic('check', 'ic-sm')}Invited</button>`; toast('Invite sent', 'send'); },
  inviteTyped: (el) => { const v = $('#invSearch').value.trim(); if (!v) { toast('Enter a name, phone number or email', 'info'); return; }
    const t = S.teams.find((x) => x.id === el.dataset.id); if (t) t.members.push({ name: v, role: 'Player', status: 'invited' }); save(); $('#invSearch').value = ''; toast(`Invite sent to ${v}`, 'send'); },
  copy: (el) => { const txt = $('#' + el.dataset.target).textContent; const ok = () => toast('Copied', 'copy');
    try { navigator.clipboard.writeText(txt).then(ok, () => { selectText(el.dataset.target); toast('Selected. Copy it from the menu', 'copy'); }); } catch (e) { selectText(el.dataset.target); } },
  scheduleMatch: (el) => scheduleSheet(el.dataset.id),
  saveMatch: (el) => { const t = S.teams.find((x) => x.id === el.dataset.id); const d = +$('#schDay [aria-pressed="true"]').dataset.id;
    t.next = { vs: $('#vsName').value.trim() || 'Training session', d, t: $('#schTime').value || '19:00', venue: $('#schVenue').value }; save(); closeSheet(); pop(); setTimeout(() => openTeam(t.id), 230); renderTeams(); toast('Match scheduled. Players asked for availability', 'calendar'); },
  entTab: (el) => { S.entTab = el.dataset.id; save(); renderTeams(); },
  schedDay: (el) => { S.schedDay = +el.dataset.id; save(); renderTeams(); },
  lbSport: (el) => { S.lbSport = el.dataset.id; save(); renderTeams(); },
  addFixture: () => addFixtureSheet(),
  saveFixture: () => { const a = $('#fxA').value, b = $('#fxB').value; if (a === b) { toast('Pick two different teams', 'info'); return; }
    const d = +$('#fxDay [aria-pressed="true"]').dataset.id;
    S.fixtures.push({ id: 'x' + Date.now(), a, b, sport: $('#fxSport [aria-pressed="true"]').dataset.id, d, t: $('#fxTime').value || '12:30', venue: $('#fxVenue').value });
    S.fixtures.sort((x, y) => x.d - y.d || x.t.localeCompare(y.t)); S.schedDay = d; S.entTab = 'schedule'; save(); closeSheet(); renderTeams(); toast('Fixture added. Squads notified', 'calendar-days'); },
  autoBalance: () => toast('Teams balanced by skill and department mix', 'shuffle'),
  shopCat: (el) => { S.shopCat = el.dataset.id; save(); renderShop(); },
  fav: (el) => { const id = el.dataset.id; S.fav = S.fav.includes(id) ? S.fav.filter((x) => x !== id) : S.fav.concat(id); save(); renderShop(); },
  product: (el) => openProduct(el.dataset.id),
  addCart: (el) => { const id = el.dataset.id; const sz = $('#pSize [aria-pressed="true"]'); const size = sz ? sz.dataset.id : null;
    const ex = S.cart.find((c) => c.id === id && c.size === size); if (ex) ex.qty++; else S.cart.push({ id, size, qty: 1 }); save(); renderTabbar(); if (tab === 'shop') renderShop(); toast('Added to your bag', 'shopping-bag'); },
  cart: () => cartSheet(),
  qty: (el) => { const c = S.cart[+el.dataset.i]; c.qty += +el.dataset.d; if (c.qty <= 0) S.cart.splice(+el.dataset.i, 1); save(); renderTabbar(); if (tab === 'shop') renderShop(); cartSheet(); },
  checkout: () => { S.cart = []; save(); renderTabbar(); if (tab === 'shop') renderShop();
    openSheet(`<div class="success"><div class="burst">${ic('package')}</div><h2>Order placed</h2><div class="muted">We'll message you when it ships. Click & collect orders are ready in about 2 hours.</div></div><button class="btn btn-primary btn-block" data-act="closeSheet">Done</button>`); },
  promote: () => promoteSheet(),
  reset: () => { S = fresh(); save(); selected = null; renderPanel(); go('explore'); toast('Demo reset', 'rotate-ccw'); },
};
function selectText(id) { const r = document.createRange(); r.selectNodeContents($('#' + id)); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const fn = A[el.dataset.act]; if (!fn) return;
  if (el.getAttribute('type') === 'submit') return;
  e.preventDefault(); fn(el);
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if ($('.sheet', app)) closeSheet(); else if ($('#stack .view')) pop(); else if (Drop.active) Drop.stop(); else deselect(); } });

/* boot */
$('#sbIcons').innerHTML = ic('signal') + ic('wifi') + ic('battery-full');
$('#clock').textContent = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', hour12: false }).format(new Date());
$('#logoMark').innerHTML = ic('map-pin', 'ic-lg');
renderPanel();
go('explore');
})();
