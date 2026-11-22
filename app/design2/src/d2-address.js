/* ═════ ADDRESS SEARCH (Pro, Corporate) ═════
   One search box for every place a venue or location is chosen: hosting, adding a place, the map picker,
   company fixtures and tournaments. It finds bookable venues, game venues, saved places, landmarks,
   street addresses ("24 MG Road") and junctions ("MG Road and Ring Road") on the demo city map.
   In production this would call a geocoding service (Google Places or Mapbox) with the same result shape. */
const LANDMARKS = [['Promenade Clock Tower', 1010, 520], ['Riverfront Metro Station', 760, 860], ['City Centre Mall', 880, 760], ['Lake Park', 1190, 1080], ['Central Bus Stand', 420, 820], ['Riverfront Railway Station', 400, 1200], ['Nehru Stadium', 1300, 640], ['Hilltop Temple', 300, 300]];
const GENERIC_W = /^(road|rd|marg|street|st|lane|nagar|and|near|the)$/;
const ROADS = VROADS.map(([x, n]) => ({ n, x })).concat(HROADS.map(([y, n]) => ({ n, y })));
/* Company venues are names only; give each one a spot on the map from a game held there, or a stable fallback. */
S.extraVenues = S.extraVenues || [];
S.extraVenues.forEach((v) => { if (!VENUES_ENT.includes(v.name)) VENUES_ENT.push(v.name); });
function venueXY(name) {
  const base = name.split(' · ')[0].toLowerCase(), ex = S.extraVenues.find((v) => v.name === name);
  if (ex) return [ex.x, ex.y];
  const a = ACTIVITIES.find((x) => x.venue.toLowerCase().startsWith(base)) || VENUES_BOOK.find((x) => x.name.toLowerCase().startsWith(base.split(' ')[0]));
  if (a) return [a.x, a.y];
  const h = [...base].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 100000, 7); return [200 + (h % 1200), 200 + (Math.floor(h / 7) % 1200)];
}
function gazetteer() {
  const out = [], seen = new Set(), add = (o) => { const k = o.name.toLowerCase(); if (seen.has(k)) return; seen.add(k); out.push(o); };
  VENUES_BOOK.forEach((v) => add({ kind: 'Bookable venue', icon: 'calendar-days', id: v.id, name: v.name, x: v.x, y: v.y }));
  S.places.concat(COMMUNITY_SPOTS).forEach((p) => add({ kind: 'Place', icon: p.photo ? 'camera' : 'map-pin', id: p.id, name: p.name, x: p.x, y: p.y, photo: p.photo || null }));
  ACTIVITIES.forEach((a) => add({ kind: 'Game venue', icon: sp(a.sport).icon, name: a.venue.split(' · ')[0], x: a.x, y: a.y }));
  VENUES_ENT.forEach((n) => { const [x, y] = venueXY(n); add({ kind: 'Company venue', icon: 'building-2', name: n.split(' · ')[0], x, y }); });
  LANDMARKS.forEach(([n, x, y]) => add({ kind: 'Landmark', icon: 'flag', name: n, x, y }));
  return out;
}
function searchAddr(q) {
  q = q.trim().toLowerCase();
  const near = (list) => list.sort((a, b) => km(a.x, a.y) - km(b.x, b.y));
  if (!q) return near(gazetteer().filter((g) => g.kind !== 'Landmark')).slice(0, 5);
  const words = q.split(/[\s,]+/).filter(Boolean), res = [];
  /* Street address: an optional house number and a road name. */
  const num = (q.match(/^\d{1,4}/) || [])[0], roadQ = q.replace(/^\d{1,4}\s*,?\s*/, '');
  const roads = ROADS.filter((r) => roadQ.length >= 2 && (r.n.toLowerCase().includes(roadQ) || roadQ.includes(r.n.toLowerCase().split(' ')[0])));
  roads.forEach((r) => { const n = +(num || 1), along = 120 + ((n * 37) % 1360);
    res.push({ kind: 'Street address', icon: 'map-pin', name: `${num ? num + ' ' : ''}${r.n}`, address: `${num ? num + ' ' : ''}${r.n}, ${AREA}`, x: r.x != null ? r.x + 18 : along, y: r.y != null ? r.y + 18 : along }); });
  /* Junctions: "MG Road and Ring Road" */
  const hit = ROADS.filter((r) => words.some((w) => w.length > 1 && !GENERIC_W.test(w) && r.n.toLowerCase().startsWith(w)));
  const vs = hit.filter((r) => r.x != null), hs = hit.filter((r) => r.y != null);
  vs.forEach((v) => hs.forEach((h) => res.push({ kind: 'Junction', icon: 'crosshair', name: `${v.n} and ${h.n}`, address: `${v.n} and ${h.n} junction, ${AREA}`, x: v.x + 14, y: h.y + 14 })));
  /* Common words (road, court, ground…) don't count on their own, so "ring road" finds Ring Road, not every road. */
  const GENERIC = /^(road|rd|marg|street|st|lane|nagar|court|courts|ground|club|centre|center|the|and|near)$/;
  const key = words.filter((w) => w.length > 1 && !GENERIC.test(w)), sig = key.length ? key : words;
  const score = (g) => { const n = g.name.toLowerCase(); return n.startsWith(q) ? 3 : sig.every((w) => n.includes(w)) ? 2 : sig.some((w) => w.length > 2 && n.includes(w)) ? 1 : 0; };
  const named = gazetteer().map((g) => [score(g), g]).filter(([s]) => s).sort((a, b) => b[0] - a[0] || km(a[1].x, a[1].y) - km(b[1].x, b[1].y));
  const streets = res.filter((r) => sig.some((w) => r.name.toLowerCase().includes(w))).sort((a, b) => (/ and |&/.test(q) ? (b.kind === 'Junction') - (a.kind === 'Junction') : 0));
  return named.filter(([s]) => s >= 2).map(([, g]) => g).concat(streets, named.filter(([s]) => s < 2).map(([, g]) => g)).slice(0, 7);
}
const ADDR = {};
/* Available on every plan: Lite users add grounds too; hosting and company venues are gated where they're offered. */
const addrBox = (ctx, ph) => (ctx ? `<div class="addrbox"><label class="search">${ic('search')}<input class="addrQ" data-ctx="${ctx}" type="search" autocomplete="off" placeholder="${ph || 'Search a venue, street or landmark'}" aria-label="Search for an address" aria-controls="addrRes-${ctx}"></label><div class="addr-res" id="addrRes-${ctx}" role="listbox"></div></div>` : '');
function renderAddr(ctx, q) {
  const box = $('#addrRes-' + ctx); if (!box) return;
  const list = ADDR[ctx] = searchAddr(q);
  box.innerHTML = list.length ? `${q.trim() ? '' : '<div class="ar-head">Nearby</div>'}${list.map((r, i) => `<button class="ar" role="option" data-act="addrPick" data-ctx="${ctx}" data-i="${i}"><span class="ltile">${ic(r.icon)}</span><span class="ltext"><b>${esc(r.name)}</b><small>${r.kind} · ${esc(r.address || addrOf(r.x, r.y))}</small></span><span class="faint num" style="font-size:12px">${fmtKm(km(r.x, r.y))}</span></button>`).join('')}`
    : `<div class="ar-none">No match. Try a street name like “MG Road”, or point on the map.</div>`;
}
document.addEventListener('input', (e) => { const el = e.target.closest('.addrQ'); if (el) renderAddr(el.dataset.ctx, el.value); });
document.addEventListener('focusin', (e) => { const el = e.target.closest('.addrQ'); if (el && !el.value) renderAddr(el.dataset.ctx, ''); });
const locFrom = (r) => ({ id: r.id || null, x: r.x, y: r.y, address: r.address || `${r.name}, ${addrOf(r.x, r.y)}`, photo: r.photo || null });
function addCompanyVenue(r) {
  const name = r.name; if (!VENUES_ENT.includes(name)) { VENUES_ENT.push(name); S.extraVenues.push({ name, x: r.x, y: r.y }); save(); }
  return name;
}

Object.assign(A, {
  addrPick: (el) => { const ctx = el.dataset.ctx, r = (ADDR[ctx] || [])[+el.dataset.i]; if (!r) return;
    if (ctx === 'host') { HOST.loc = locFrom(r); if (r.id && VENUES_BOOK.find((v) => v.id === r.id)) HOST.sport = VB(r.id).sports[0]; hostSheet(); toast('Location set. Adjust it on the map if needed', 'map-pin'); }
    else if (ctx === 'place') { NP.x = r.x; NP.y = r.y; NP.address = r.address || `${r.name}, ${addrOf(r.x, r.y)}`; addPlaceSheet(); }
    else if (ctx === 'pick') { const [cx, cy] = mapCentre(); setMap(cx - r.x * mz, cy - r.y * mz, true); const q = $('#pickUI .addrQ'); if (q) { q.value = ''; q.blur(); } $('#addrRes-pick').innerHTML = ''; setTimeout(() => { const a = $('#pickAddr'); if (a) a.textContent = addrOf(...pickXY()); }, 600); }
    else if (ctx === 'fx') { FX.venue = addCompanyVenue(r); FX.clash = ''; fixtureSheet(); }
    else if (ctx === 'tour') { const n = addCompanyVenue(r); if (!TD.venues.includes(n)) TD.venues.push(n); genSheet(); } },
});
