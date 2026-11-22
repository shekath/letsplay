/* Splayer welcome: the text-motion intro, onboarding, sign up and log in (email, Google or phone + OTP), and a first-run profile.
   Everything is simulated locally: no account data leaves the device. */

/* The intro is a self-contained text animation drawn into an SVG; render(t) is deterministic so it can be scrubbed. */
function makeIntro(host) {
  host.innerHTML = `<svg data-i="sv"><defs><linearGradient id="gSGrad" x1="0" y1="0" x2=".9" y2="1"><stop offset="0" stop-color="#E4FF4A"/><stop offset=".5" stop-color="#3EE07A"/><stop offset="1" stop-color="#00A862"/></linearGradient><clipPath id="gBand"><rect data-i="bandR"/></clipPath><clipPath id="gTagBand"><rect data-i="tagR"/></clipPath></defs><rect data-i="bg0" x="0" y="0" width="100%" height="100%"/><path data-i="bg1"/><g data-i="cam"><text data-i="kicker" class="k" text-anchor="middle">ONE APP FOR</text><g data-i="echo" class="wm"></g><g data-i="words" class="wm" clip-path="url(#gBand)"></g><g data-i="sports" class="wm"></g><g data-i="player" class="wm"></g><rect data-i="uline" rx="3"/><g data-i="tag" class="k" clip-path="url(#gTagBand)"></g></g></svg>`;
  const $ = (id) => host.querySelector(`[data-i="${id}"]`);
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); parent && parent.appendChild(n); return n; };
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const lerp = (a, b, k) => a + (b - a) * k;
  const eOut = k => 1 - Math.pow(1 - k, 3);
  const eIn = k => k * k * k;
  const eIO = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  const eBack = k => { const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  const bump = k => k > 0 && k < 1 ? Math.sin(k * Math.PI) : 0;

  const INK = '#06140D', LIME = '#D4FF3A', DEEP = '#0C3A23', WHITE = '#F4FFF7';
  // carousel: word, background, text colour, kicker colour
  const SEQ = [
    { w: 'FOOTBALL',  bg: INK,  fg: WHITE, kc: '#7FBF98' },
    { w: 'CRICKET',   bg: LIME, fg: INK,   kc: '#2C5A1A' },
    { w: 'TENNIS',    bg: DEEP, fg: LIME,  kc: '#8FD6A8' },
    { w: 'BADMINTON', bg: WHITE, fg: INK,  kc: '#4D6B58' },
    { w: 'MANY MORE', bg: '#1FD16B', fg: INK, alt: WHITE, kc: '#0B3D20', wave: true }
  ];
  const DURS = [.42, .42, .42, .42, .85];
  const W0 = .2;
  const TIN = DURS.map((_, i) => W0 + DURS.slice(0, i).reduce((a, b) => a + b, 0));
  const SP = W0 + DURS.reduce((a, b) => a + b, 0);   // SPORTS arrives
  const shakeAt = (t, t0, amp) => { const k = seg(t, t0, t0 + .3); return k > 0 && k < 1 ? amp * (1 - k) * Math.sin(k * 55) : 0; };
  const FALL = SP + .75;                          // P-O-R-T-S tumble away
  const SLIDE = FALL + .62;                       // S slides into place
  const HOP = SLIDE + .3;                         // "player" hops in
  const UL = HOP + 6 * .075 + .5;                 // underline + tagline
  const DUR = UL + 2.2;

  let W, H, L = {};
  const measure = (str, size, cls = 'wm') => { const t = el('text', { class: cls, 'font-size': size, x: -9999, y: -9999 }, $('sv')); t.textContent = str; const w = t.getComputedTextLength(); t.remove(); return w; };
  function letters(parent, str, size, fill, cx, track = 0) {
    const gap = size * track, sp = size * .22, nsp = (str.match(/ /g) || []).length;
    const total = measure(str, size) + gap * (str.length - 1) + sp * nsp, x0 = cx - total / 2;
    let extra = 0;
    return [...str].map((ch, i) => {
      const t = el('text', { 'font-size': size, fill }, parent); t.textContent = ch;
      const o = { n: t, x: x0 + measure(str.slice(0, i), size) + gap * i + extra, w: measure(ch, size) };
      if (ch === ' ') extra += sp;
      return o;
    });
  }

  function layout() {
    W = host.clientWidth || 390; H = host.clientHeight || 844;
    $('sv').setAttribute('viewBox', `0 0 ${W} ${H}`);
    const cy = H * .5;
    // carousel words: fit the width
    const g = $('words'); g.innerHTML = '';
    L.words = SEQ.map(s => {
      const size = Math.min(W * .86 / (measure(s.w, 100) / 100 + (s.w.includes(' ') ? .22 : 0)), H * .13, 150);
      const ls = letters(g, s.w, size, s.fg, W / 2);
      const spIdx = s.w.indexOf(' '); ls.forEach((o, li) => { o.rot = (((li * 37) % 5) - 2) * 13; if (s.alt && spIdx >= 0 && li > spIdx) o.n.setAttribute('fill', s.alt); });
      return { ...s, size, ls };
    });
    // outlined echo rows that scroll past above and below each word
    const eg = $('echo'); eg.innerHTML = '';
    L.echo = L.words.map(wd => [0, 1].map(r => {
      const t = el('text', { 'font-size': wd.size * .95, fill: 'none', stroke: wd.fg, 'stroke-width': 1.4, 'stroke-opacity': .32, opacity: 0 }, eg);
      t.textContent = Array(6).fill(wd.w).join('  ·  ');
      return { n: t, r };
    }));
    const bandH = Math.max(...L.words.map(w => w.size)) * 1.05;
    L.base = cy + bandH * .34;
    Object.assign(L, { bandH });
    const br = $('bandR'); br.setAttribute('x', 0); br.setAttribute('width', W); br.setAttribute('y', L.base - bandH * .86); br.setAttribute('height', bandH * 1.04);
    L.echoY = [L.base - bandH * 1.5, L.base + bandH * 1.0];
    const kk = $('kicker'); kk.setAttribute('x', W / 2); kk.setAttribute('y', L.base - bandH * .98); kk.setAttribute('font-size', Math.max(12, Math.min(W * .038, 18)));
    kk.setAttribute('letter-spacing', '.32em');

    // wordmark
    const F = L.F = Math.min(W * .21, H * .15, 168);
    const wmW = measure('Splayer', F);
    L.wmX = W / 2 - wmW / 2; L.wmW = wmW; L.wb = cy + F * .3;
    const SF = L.SF = Math.min(W * .8 / (measure('SPORTS', 100) / 100 + .2), H * .14, 170);
    const sg = $('sports'); sg.innerHTML = '';
    L.sports = letters(sg, 'SPORTS', SF, WHITE, W / 2, .04);
    L.sports[0].n.setAttribute('fill', 'url(#gSGrad)');
    L.sb = cy + SF * .3;
    const pg = $('player'); pg.innerHTML = '';
    L.player = [...'player'].map((ch, i) => {
      const t = el('text', { 'font-size': F, fill: WHITE }, pg); t.textContent = ch;
      return { n: t, x: L.wmX + measure('S' + 'player'.slice(0, i), F), w: measure(ch, F) };
    });
    // underline + tagline
    const ul = $('uline'); ul.setAttribute('y', L.wb + F * .17); ul.setAttribute('height', Math.max(4, F * .05)); ul.setAttribute('fill', LIME);
    ul.setAttribute('rx', Math.max(2, F * .025));
    const ts = Math.max(12, F * .14), tg = $('tag'); tg.innerHTML = '';
    const str = 'FIND YOUR GAME', sp = ts * .42;
    const tw = [...str].reduce((a, c) => a + measure(c, ts, 'k') + sp, -sp);
    let x = W / 2 - tw / 2;
    L.tag = [...str].map(c => { const t = el('text', { 'font-size': ts, fill: '#A9D9BB' }, tg); t.textContent = c; const o = { n: t, x }; x += measure(c, ts, 'k') + sp; return o; });
    L.ty = L.wb + F * .17 + F * .05 + ts * 1.7; L.ts = ts;
    const tr = $('tagR'); tr.setAttribute('x', 0); tr.setAttribute('width', W); tr.setAttribute('y', L.ty - ts * 1.1); tr.setAttribute('height', ts * 1.5);
  }

  // background colour wipes
  function bgAt(t) {
    const cols = [INK, ...SEQ.slice(1).map(s => s.bg), INK];
    const times = [-1, ...TIN.slice(1).map(x => x - .13), SP - .14];
    let i = 0; while (i + 1 < times.length && t >= times[i + 1]) i++;
    const k = i + 1 < times.length ? 0 : 0;
    const prev = cols[Math.max(0, i - 1)], cur = cols[i];
    const p = i === 0 ? 1 : eIO(seg(t, times[i], times[i] + .26));
    return { prev, cur, p };
  }

  function render(t) {
    // --- background wipe (new colour rises from the bottom) ---
    const b = bgAt(t);
    $('bg0').setAttribute('fill', b.prev);
    const sk = W * .45, h = (H + sk) * b.p; const r1 = $('bg1'); r1.setAttribute('fill', b.cur);
    r1.setAttribute('d', `M0 ${H}L${W} ${H}L${W} ${H - h}L0 ${H - h + sk}Z`);

    // --- kicker ---
    const kin = eOut(seg(t, .05, .35)), kout = eIn(seg(t, SP - .2, SP + .05));
    const kk = $('kicker'); kk.setAttribute('opacity', kin * (1 - kout));
    kk.setAttribute('transform', `translate(0 ${lerp(10, 0, kin) - kout * 8})`);
    const cur = SEQ.findIndex((_, i) => t < (TIN[i + 1] || SP) - .13);
    kk.setAttribute('fill', (SEQ[cur < 0 ? SEQ.length - 1 : cur] || SEQ[0]).kc);

    // --- word carousel: letters slide up through a mask ---
    const bh = L.bandH;
    L.words.forEach((wd, wi) => {
      const tIn = TIN[wi], tOut = tIn + DURS[wi];
      const punch = 1 + .09 * bump(seg(t, tIn + .1, tIn + .34));
      wd.ls.forEach((o, li) => {
        const d = li * .02;
        const ki = seg(t, tIn - .07 + d, tIn + .2 + d), ko = seg(t, tOut - .15, tOut - .03);
        const spring = 1 + 2.7 * Math.pow(ki - 1, 3) + 1.7 * Math.pow(ki - 1, 2);
        let y = lerp(bh * 1.1, 0, spring) - eIn(ko) * bh * 1.25;
        if (wd.wave) y -= Math.abs(Math.sin((t - tIn) * 10 - li * .6)) * bh * .13 * seg(t, tIn + .32, tIn + .42);
        const land = bump(seg(t, tIn + .13 + d, tIn + .28 + d));
        const sc = lerp(.5, 1, Math.min(1.08, spring));
        const sx = sc * (1 + .13 * land) * punch, sy = sc * (1 - .16 * land) * punch * (1 + .55 * ko);
        const rot = lerp(o.rot, 0, eOut(ki)), skw = lerp(-16, 0, eOut(ki)) + ko * 16;
        const cx = o.w / 2, X = W / 2 + (o.x + cx - W / 2) * punch;
        o.n.setAttribute('transform', `translate(${X} ${L.base + y}) rotate(${rot}) scale(${sx} ${sy}) skewX(${skw}) translate(${-cx} 0)`);
        o.n.setAttribute('opacity', ki > 0 && ko < 1 ? 1 : 0);
      });
      L.echo[wi].forEach(e => {
        const vis = seg(t, tIn - .02, tIn + .12) * (1 - seg(t, tOut - .14, tOut - .04));
        const run = (t - tIn) * W * .9, len = e.n.getComputedTextLength ? 0 : 0;
        const x = e.r ? -W * 1.6 + run : -W * .2 - run;
        e.n.setAttribute('transform', `translate(${x} ${L.echoY[e.r]})`);
        e.n.setAttribute('opacity', vis);
      });
    });

    // --- SPORTS: drops in, then P-O-R-T-S tumble off ---
    L.sports.forEach((o, i) => {
      const d = i * .045, k = seg(t, SP + d, SP + .42 + d);
      let x = o.x, y = L.sb - lerp(H * .55, 0, eOut(k)) + bump(seg(t, SP + .42 + d, SP + .58 + d)) * L.SF * .04;
      let rot = 0, sx = 1, sy = 1;
      // landing squash
      const land = seg(t, SP + .3 + d, SP + .5 + d); sx = 1 + .1 * bump(land); sy = 1 - .14 * bump(land);
      let op = k > 0 ? 1 : 0;
      const cx = o.w / 2;
      if (i > 0) {
        const f0 = FALL + (i - 1) * .06, f = Math.max(0, t - f0);
        const hop = bump(seg(t, f0, f0 + .16)) * L.SF * .12;
        const dir = i % 2 ? 1 : -1;
        if (t > f0) { y += -hop + Math.max(0, f - .1) ** 2 * H * 3.2; x += dir * f * L.SF * .5; rot = dir * f * 260; }
        if (t > f0 + .7) op = 0;
      } else {
        // S: wobble as its friends leave, then slide into the wordmark
        const wob = Math.sin(seg(t, FALL, FALL + .55) * Math.PI * 3) * (1 - seg(t, FALL, FALL + .55)) * 7;
        rot = wob;
        const m = eIO(seg(t, SLIDE, SLIDE + .45));
        const sc = lerp(1, L.F / L.SF, m);
        x = lerp(o.x, L.wmX, m); y = lerp(y, L.wb, m);
        const pop = bump(seg(t, SLIDE + .38, SLIDE + .58));
        sx *= sc * (1 + .08 * pop); sy *= sc * (1 - .1 * pop);
        // nudge when each "player" letter lands
        const ripple = L.player.reduce((a, _, j) => a + bump(seg(t, HOP + j * .075 + .32, HOP + j * .075 + .46)) * .015, 0);
        sy *= 1 - ripple;
      }
      o.n.setAttribute('transform', `translate(${x + cx} ${y}) rotate(${rot}) scale(${sx} ${sy}) translate(${-cx} 0)`);
      o.n.setAttribute('opacity', op);
    });

    // --- "player": each letter hops in and lands with squash & stretch ---
    L.player.forEach((o, i) => {
      const t0 = HOP + i * .075, k = seg(t, t0, t0 + .34);
      const y = L.wb + lerp(L.F * .9, 0, eOut(k)) - Math.sin(Math.min(k, 1) * Math.PI) * L.F * .55;
      const land = seg(t, t0 + .3, t0 + .5);
      const stretch = k > 0 && k < .6 ? .12 * Math.sin(k / .6 * Math.PI) : 0;
      const sx = 1 + .12 * bump(land) - stretch * .6, sy = 1 - .16 * bump(land) + stretch;
      const cx = o.w / 2;
      o.n.setAttribute('transform', `translate(${o.x + cx} ${y}) scale(${sx} ${sy}) rotate(${lerp(-18, 0, eOut(k))}) translate(${-cx} 0)`);
      o.n.setAttribute('opacity', k > 0 ? Math.min(1, k * 4) : 0);
    });

    // --- underline swipe + tagline ---
    const u = seg(t, UL, UL + .45), u2 = seg(t, UL + .45, UL + .8);
    const ux0 = L.wmX + L.F * .1, uw = L.wmW - L.F * .2;
    const a = eIO(u), c = eIO(u2);
    const ul = $('uline');
    ul.setAttribute('x', ux0 + uw * c * .0); ul.setAttribute('width', Math.max(0, uw * a));
    ul.setAttribute('opacity', u > 0 ? 1 : 0);
    L.tag.forEach((o, i) => {
      const k = seg(t, UL + .3 + i * .03, UL + .62 + i * .03);
      o.n.setAttribute('transform', `translate(${o.x} ${L.ty + lerp(L.ts * 1.4, 0, eOut(k))})`);
    });

    // --- final settle: whole lockup breathes once ---
    const s = 1 + .025 * bump(seg(t, UL + .9, UL + 1.4));
    let shx = 0, shy = 0;
    TIN.forEach(ti => { const v = shakeAt(t, ti + .12, W * .012); shx += v * .6; shy += v; });
    shy += shakeAt(t, SP + .32, W * .016) + shakeAt(t, SLIDE + .4, W * .008);
    $('cam').setAttribute('transform', `translate(${W / 2 + shx} ${H / 2 + shy}) scale(${s}) translate(${-W / 2} ${-H / 2})`);
  }
  return { layout, render, DUR, SLIDE, UL };
}

Object.assign(ICONS, {
  'log-out': '<path d="m16 17 5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>',
  'eye-off': '<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  'message-square': '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'
});

/* Sample accounts so "Log in" has someone to find. Passwords are stored in plain text because this is a local prototype. */
const DEMO_ACCT = { name: 'Arjun Mehta', email: 'arjun@splayer.app', phone: '9876543210', pass: 'play1234', method: 'email' };
const GOOGLE_PEOPLE = [{ name: 'Arjun Mehta', email: 'arjun.mehta@gmail.com', c: '#0F863E' }, { name: 'Priya Nair', email: 'priya.nair@gmail.com', c: '#0A7CAE' }];
const METHOD = { email: 'Email', google: 'Google', phone: 'Phone' };
const PROFILE_SPORTS = ['football', 'cricket', 'badminton', 'tennis', 'basketball', 'volleyball', 'running', 'kabaddi', 'swimming', 'yoga'];
const LEVELS = ['Beginner', 'Casual', 'Competitive'];
const SLIDES = [
  { word: 'PLAY', kick: 'Find a game', title: 'Games near you, every day', body: 'Football, cricket, badminton and more. Join in a tap and split the cost by UPI.', bg: '#06140D', fg: '#D4FF3A' },
  { word: 'HOST', kick: 'Run the show', title: 'Book turfs, host games, build teams', body: 'Pick a ground, set the time and invite your crew. Captains track fixtures and line-ups.', bg: '#0C3A23', fg: '#F4FFF7' },
  { word: 'STREAK', kick: 'Keep it going', title: 'Earn XP, badges and streaks', body: 'Play every week to grow your streak. A freeze saves the week when life gets busy.', bg: '#06140D', fg: 'grad' }
];
const accounts = () => { if (!S.accounts) S.accounts = [clone(DEMO_ACCT)]; return S.accounts; };
const findAcct = (q) => accounts().find((a) => (q.email && a.email === q.email.toLowerCase()) || (q.phone && a.phone === q.phone));
const fmtPhone = (p) => p ? p.slice(0, 5) + ' ' + p.slice(5) : '';
const G_LOGO = '<svg class="g-glogo" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';

let AU = { mode: 'signup', step: 'intro', slide: 0, pending: null };
let INTRO = null, OTP_TIMER = 0;

function gateEl() {
  let g = $('#gate');
  if (!g) {
    g = document.createElement('div'); g.id = 'gate'; g.className = 'gate';
    g.setAttribute('role', 'dialog'); g.setAttribute('aria-modal', 'true'); g.setAttribute('aria-label', 'Welcome to Splayer');
    app.appendChild(g);
    g.addEventListener('input', otpInput); g.addEventListener('keydown', otpKey); g.addEventListener('paste', otpPaste);
    g.addEventListener('pointerdown', swipeStart); g.addEventListener('pointerup', swipeEnd);
  }
  return g;
}
const setInert = (on) => $$('.screen, .tabbar', app).forEach((e) => on ? e.setAttribute('inert', '') : e.removeAttribute('inert'));
function openGate(step) { closeSheet(); setInert(true); gateEl().classList.remove('out'); toStep(step); }
function closeGate() {
  stopIntro(); clearInterval(OTP_TIMER);
  const g = $('#gate'); if (!g) return;
  setInert(false); g.classList.add('out'); setTimeout(() => g.remove(), REDUCED ? 0 : 420);
}
function toStep(step) {
  if (AU.step === 'otp' && step !== 'otp') clearInterval(OTP_TIMER);
  if (step !== 'intro' && step !== 'splash') stopIntro();
  AU.step = step;
  ({ intro: () => showIntro(0), splash: () => showIntro('splash'), onboard: renderOnboard, auth: renderAuth, phone: renderPhone, otp: renderOtp, profile: renderProfile, location: renderLocation })[step]();
}
const pane = (html, cls = '') => { gateEl().innerHTML = `<div class="g-pane ${cls}">${html}</div>`; };
const focusFirst = (sel) => { if (framed() || !matchMedia('(pointer: coarse)').matches) { const e = $(sel, gateEl()); if (e) e.focus({ preventScroll: true }); } };

/* ── 1. Intro: the text motion piece; returning players get the short wordmark version ── */
async function showIntro(mode) {
  const g = gateEl();
  g.innerHTML = `<div class="g-intro" aria-hidden="true"></div><button class="g-skip" data-act="auSkipIntro">Skip</button>
    <p class="sr-only" role="status">Splayer. One app for football, cricket, tennis, badminton and many more. Find your game.</p>`;
  try { await Promise.race([Promise.all([document.fonts.load('italic 900 100px Saira'), document.fonts.load('800 20px Manrope')]), new Promise((r) => setTimeout(r, 1500))]); } catch (e) { /* fonts optional */ }
  if (!$('.g-intro', g)) return;
  const host = $('.g-intro', g), I = makeIntro(host); I.layout();
  const from = mode === 'splash' ? I.SLIDE - .15 : 0, end = mode === 'splash' ? I.UL + 1.05 : I.DUR + .5;
  let raf = 0, done = false; const t0 = performance.now() - from * 1000;
  const ro = new ResizeObserver(() => I.layout()); ro.observe(host);
  const finish = (skip) => { if (done) return; done = true; cancelAnimationFrame(raf); ro.disconnect(); INTRO = null; if (skip !== 'stop') afterIntro(); };
  INTRO = { finish };
  if (REDUCED) { I.render(I.DUR); setTimeout(() => finish(), 1600); return; }
  const loop = (now) => { const t = (now - t0) / 1000; I.render(Math.min(t, I.DUR)); if (t > end) finish(); else raf = requestAnimationFrame(loop); };
  raf = requestAnimationFrame(loop);
}
function stopIntro() { if (INTRO) INTRO.finish('stop'); }
function afterIntro() { if (S.auth) closeGate(); else toStep(S.onboarded ? 'auth' : 'onboard'); }

/* ── 2. Onboarding: three swipeable slides ── */
function slideWord(s) {
  return [...s.word].map((ch, i) => `<span style="--i:${i}">${ch}</span>`).join('');
}
function renderOnboard() {
  const i = AU.slide = Math.min(AU.slide || 0, SLIDES.length - 1), gw = gateEl().clientWidth || 390;
  const wfs = (s) => Math.round(Math.min(150, gw * .34, gw * .86 / (s.word.length * .6)));
  pane(`<div class="g-ob">
    <button class="g-skip" data-act="auSkipOb">Skip</button>
    <div class="g-track" style="transform:translateX(${-i * 100}%)">${SLIDES.map((s, k) => `
      <section class="g-slide${k === i ? ' on' : ''}" style="--sbg:${s.bg};--sfg:${s.fg === 'grad' ? '#F4FFF7' : s.fg};--wfs:${wfs(s)}px" aria-roledescription="slide" aria-label="${k + 1} of ${SLIDES.length}" ${k === i ? '' : 'aria-hidden="true" inert'}>
        <div class="g-echo" aria-hidden="true">${Array(8).fill(s.word).join(' · ')} · ${Array(8).fill(s.word).join(' · ')}</div>
        <div class="g-echo r" aria-hidden="true">${Array(8).fill(s.word).join(' · ')} · ${Array(8).fill(s.word).join(' · ')}</div>
        <div class="g-word${s.fg === 'grad' ? ' grad' : ''}" aria-hidden="true">${slideWord(s)}</div>
        <div class="g-copy"><div class="g-kick">${s.kick}</div><h2 class="g-title">${s.title}</h2><p class="g-body">${s.body}</p></div>
      </section>`).join('')}</div>
    <div class="g-foot"><div class="g-dots" aria-hidden="true">${SLIDES.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
      <button class="g-next" data-act="auNext">${i === SLIDES.length - 1 ? 'Get started' : 'Next'}${ic('arrow-right')}</button></div></div>`, 'dark');
}
function obGo(i) {
  if (i < 0) return;
  if (i >= SLIDES.length) { S.onboarded = true; save(); AU.mode = 'signup'; toStep('auth'); return; }
  AU.slide = i; const g = gateEl();
  $('.g-track', g).style.transform = `translateX(${-i * 100}%)`;
  $$('.g-slide', g).forEach((s, k) => { s.classList.toggle('on', k === i); if (k === i) { s.removeAttribute('aria-hidden'); s.removeAttribute('inert'); } else { s.setAttribute('aria-hidden', 'true'); s.setAttribute('inert', ''); } });
  $$('.g-dots i', g).forEach((d, k) => d.classList.toggle('on', k === i));
  $('.g-next', g).innerHTML = (i === SLIDES.length - 1 ? 'Get started' : 'Next') + ic('arrow-right');
  buzz(8);
}
let SWX = null;
function swipeStart(e) { SWX = e.target.closest('.g-track') ? e.clientX : null; }
function swipeEnd(e) { if (SWX == null) return; const dx = e.clientX - SWX; SWX = null; if (Math.abs(dx) > 45) obGo(AU.slide + (dx < 0 ? 1 : -1)); }

/* ── 3. Sign up / log in ── */
function renderAuth() {
  const up = AU.mode === 'signup';
  pane(`<div class="g-scroll">
    <div class="g-brand"><div class="g-wm"><b>S</b>player</div><span class="g-tag">FIND YOUR GAME</span></div>
    <h2 class="g-h">${up ? 'Create your account' : 'Welcome back'}</h2>
    <p class="g-sub">${up ? 'Join games, teams and leagues near you.' : 'Log in to pick up where you left off.'}</p>
    <div class="g-seg" role="group" aria-label="Account"><button data-act="auMode" data-id="signup" aria-pressed="${up}">Sign up</button><button data-act="auMode" data-id="login" aria-pressed="${!up}">Log in</button></div>
    ${up ? termsHTML() : ''}
    <button class="g-btn g-google" data-act="auGoogle">${G_LOGO}Continue with Google</button>
    <button class="g-btn g-phone" data-act="auPhone">${ic('smartphone')}Continue with phone number</button>
    <div class="g-or"><span>or with email</span></div>
    <form class="g-form" data-form="email" novalidate>
      ${up ? `<label class="g-field"><span>Full name</span><input name="name" autocomplete="name" placeholder="Your name" required></label>` : ''}
      <label class="g-field"><span>Email</span><input name="email" type="email" autocomplete="email" inputmode="email" placeholder="you@example.com" required ${!up ? `value="${esc(AU.lastEmail || '')}"` : ''}></label>
      <label class="g-field"><span>Password</span><span class="g-pw"><input name="pass" type="password" autocomplete="${up ? 'new-password' : 'current-password'}" placeholder="${up ? 'At least 8 characters' : 'Your password'}" required><button type="button" data-act="auEye" aria-label="Show password" aria-pressed="false">${ic('eye')}</button></span></label>
      ${up ? '' : '<button type="button" class="g-link" data-act="auForgot">Forgot password?</button>'}
      <p class="g-err" role="alert"></p>
      <button class="g-btn g-cta" type="submit">${up ? 'Create account' : 'Log in'}</button>
    </form>
    ${up ? '' : `<p class="g-demo">Demo account: ${DEMO_ACCT.email} · ${DEMO_ACCT.pass}</p>`}
    ${up ? '' : '<p class="g-fine">By logging in you agree to Splayer’s Terms &amp; Conditions and Privacy Policy.</p>'}
  </div>`, 'dark');
}
const termsHTML = () => `<div class="g-terms"><label class="g-check"><input type="checkbox" name="terms" data-terms ${AU.terms ? 'checked' : ''}>
    <span>I agree to Splayer’s <button type="button" class="g-inline" data-act="auTerms" data-id="terms">Terms &amp; Conditions</button> and <button type="button" class="g-inline" data-act="auTerms" data-id="privacy">Privacy Policy</button>, and I’m 13 or older.</span></label>
  <p class="g-err g-terr" role="alert"></p></div>`;
/* Every way of creating an account needs the box ticked first. */
function needTerms() {
  if (AU.terms) return false;
  const box = $('[data-terms]', gateEl()), wrap = $('.g-terms', gateEl());
  if (!box) return false;
  $('.g-terr', wrap).textContent = 'Please agree to the Terms & Conditions to create your account.';
  wrap.classList.remove('bad'); void wrap.offsetWidth; wrap.classList.add('bad'); box.focus(); buzz(20);
  return true;
}
const TERMS = {
  terms: ['Terms & Conditions', [
    ['Using Splayer', 'Splayer helps you find, join and host community sport. You must be 13 or older; players under 18 need a parent or guardian to manage bookings.'],
    ['Games and bookings', 'Hosts set the price, time and rules for their games. Payments you make through Splayer go to the host or venue. Refunds follow each game’s cancellation policy.'],
    ['Playing safely', 'Sport carries a risk of injury. Play within your ability and follow venue rules. Hosts must not post misleading games.'],
    ['Your account', 'Keep your login private. We may suspend accounts that harass other players, no-show repeatedly or misuse payments.']]],
  privacy: ['Privacy Policy', [
    ['What we collect', 'Your name, contact (email or phone), sports, level and the location you choose, so we can show games near you.'],
    ['Location', 'We only use your location with your permission. You can enter an address instead, and switch live location off any time in Me → Location.'],
    ['Who sees what', 'Other players see your first name, sports and level. Your phone number and email are never shown publicly.'],
    ['In this prototype', 'Everything is stored on this device only. Area names are looked up with OpenStreetMap when you use location or address search.']]]
};
function termsSheet(k) {
  const [title, parts] = TERMS[k], g = gateEl(); $$('.g-scrim, .g-chooser', g).forEach((e) => e.remove());
  g.insertAdjacentHTML('beforeend', `<div class="g-scrim" data-act="auGClose"></div>
    <div class="g-chooser g-doc" role="dialog" aria-modal="true" aria-label="${title}">
      <div class="g-ch-top"><span>Splayer</span><button class="g-x" data-act="auGClose" aria-label="Close">${ic('x')}</button></div>
      <h3>${title}</h3><p class="g-ch-sub">Summary for the prototype · last updated ${new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date())}</p>
      ${parts.map(([h, t]) => `<h4>${h}</h4><p>${t}</p>`).join('')}
      ${$('[data-terms]', g) ? '<button class="g-btn g-blue" data-act="auAgree">I agree</button>' : '<button class="g-btn g-blue" data-act="auGClose">Close</button>'}
    </div>`);
  focusFirst('.g-chooser button');
}

function formErr(form, msg, field) {
  $$('[aria-invalid]', form).forEach((e) => e.removeAttribute('aria-invalid'));
  const p = $('.g-err', form); p.innerHTML = msg || '';
  if (field) { const f = form.elements[field]; if (f) { f.setAttribute('aria-invalid', 'true'); f.focus(); } }
  if (msg) buzz(20);
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function submitEmail(form) {
  AU.via = 'email';
  const up = AU.mode === 'signup', v = (k) => (form.elements[k] ? form.elements[k].value.trim() : '');
  const email = v('email').toLowerCase(), pass = form.elements.pass.value;
  if (up && v('name').length < 2) return formErr(form, 'Enter your name.', 'name');
  if (!EMAIL_RE.test(email)) return formErr(form, 'Enter a valid email address, like you@example.com.', 'email');
  if (up && pass.length < 8) return formErr(form, 'Use at least 8 characters for your password.', 'pass');
  const acct = findAcct({ email });
  if (up && !acct && needTerms()) return;
  if (up) {
    if (acct) return formErr(form, `${esc(email)} already has an account. <button type="button" data-act="auMode" data-id="login">Log in instead</button>`, 'email');
    AU.pending = { name: v('name'), email, pass, method: 'email' }; return toStep('profile');
  }
  if (!pass) return formErr(form, 'Enter your password.', 'pass');
  if (!acct) return formErr(form, `No account uses ${esc(email)}. <button type="button" data-act="auMode" data-id="signup">Create one</button>`, 'email');
  if (acct.pass && acct.pass !== pass) return formErr(form, 'That password doesn’t match. Try again or reset it.', 'pass');
  finishAuth(acct, false);
}

/* ── Google: a simulated account chooser ── */
function googleSheet(other) {
  const g = gateEl(); $$('.g-scrim, .g-chooser', g).forEach((e) => e.remove());
  g.insertAdjacentHTML('beforeend', `<div class="g-scrim" data-act="auGClose"></div>
    <div class="g-chooser" role="dialog" aria-modal="true" aria-label="Choose a Google account">
      <div class="g-ch-top">${G_LOGO}<span>Sign in with Google</span><button class="g-x" data-act="auGClose" aria-label="Close">${ic('x')}</button></div>
      <h3>${other ? 'Use another account' : 'Choose an account'}</h3><p class="g-ch-sub">to continue to Splayer</p>
      ${other ? `<form class="g-form light" data-form="google" novalidate>
          <label class="g-field"><span>Name</span><input name="name" autocomplete="name" placeholder="Your name"></label>
          <label class="g-field"><span>Gmail address</span><input name="email" type="email" inputmode="email" autocomplete="email" placeholder="name@gmail.com"></label>
          <p class="g-err" role="alert"></p><button class="g-btn g-blue" type="submit">Continue</button></form>`
        : `<div class="g-accts">${GOOGLE_PEOPLE.map((p, i) => `<button data-act="auGPick" data-id="${i}"><span class="g-av" style="background:${p.c}">${p.name[0]}</span><span><b>${p.name}</b><small>${p.email}</small></span></button>`).join('')}
          <button data-act="auGOther"><span class="g-av ghost">${ic('user-plus')}</span><span><b>Use another account</b></span></button></div>`}
      <p class="g-ch-fine">Google shares your name, email address and profile picture with Splayer. Simulated in this prototype: nothing leaves your device.</p>
    </div>`);
  focusFirst('.g-chooser button, .g-chooser input');
}
function googlePick(p) {
  $$('.g-scrim, .g-chooser', gateEl()).forEach((e) => e.remove());
  const acct = findAcct({ email: p.email });
  if (acct) return finishAuth(acct, false);
  AU.pending = { name: p.name, email: p.email, method: 'google' }; toStep('profile');
}

/* ── Phone: number, then a 6-digit code ── */
function renderPhone() {
  pane(`<div class="g-scroll">
    <div class="g-top"><button class="g-back" data-act="auBack" aria-label="Back">${ic('arrow-left')}</button></div>
    <h2 class="g-h">Your phone number</h2><p class="g-sub">We’ll text you a 6-digit code to ${AU.mode === 'signup' ? 'create your account' : 'log you in'}.</p>
    <form class="g-form" data-form="phone" novalidate>
      <label class="g-field"><span>Mobile number</span><span class="g-tel"><span class="g-cc">+91</span><input name="phone" inputmode="numeric" autocomplete="tel-national" placeholder="98765 43210" maxlength="11" value="${esc(fmtPhone(AU.phone || ''))}"></span></label>
      <p class="g-err" role="alert"></p>
      <button class="g-btn g-cta" type="submit">Send code</button>
    </form>
    <p class="g-fine">Standard SMS rates may apply. Demo number: ${fmtPhone(DEMO_ACCT.phone)}.</p></div>`, 'dark');
  focusFirst('input[name=phone]');
}
function sendCode() {
  AU.code = String(100000 + Math.floor(Math.random() * 900000)); AU.resendAt = Date.now() + 30000;
}
function submitPhone(form) {
  const d = form.elements.phone.value.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
  if (!/^[6-9]\d{9}$/.test(d)) return formErr(form, 'Enter a 10-digit Indian mobile number.', 'phone');
  AU.phone = d; sendCode(); toStep('otp');
}
function renderOtp() {
  pane(`<div class="g-scroll has-sms">
    <button class="g-sms" data-act="auFill" aria-label="Simulated text message with your code. Tap to fill it in.">${ic('message-square')}<span><b>Messages · now</b><span>${AU.code} is your Splayer code. It expires in 10 minutes.</span></span></button>
    <div class="g-top"><button class="g-back" data-act="auBack" aria-label="Back">${ic('arrow-left')}</button></div>
    <h2 class="g-h">Enter the code</h2><p class="g-sub">Sent to +91 ${fmtPhone(AU.phone)}. <button class="g-inline" data-act="auPhone">Change</button></p>
    <form class="g-form" data-form="otp" novalidate>
      <div class="g-otp" role="group" aria-label="6-digit code">${[0, 1, 2, 3, 4, 5].map((i) => `<input inputmode="numeric" maxlength="1" ${i === 0 ? 'autocomplete="one-time-code"' : 'autocomplete="off"'} aria-label="Digit ${i + 1}" data-otp="${i}">`).join('')}</div>
      <p class="g-err" role="alert"></p>
      <button class="g-btn g-cta" type="submit">Verify</button>
    </form>
    <p class="g-resend" aria-live="polite"></p>
    <p class="g-fine">Prototype: the text above is simulated. Tap it to fill in the code.</p></div>`, 'dark');
  tickResend(); clearInterval(OTP_TIMER); OTP_TIMER = setInterval(tickResend, 1000);
  focusFirst('[data-otp="0"]');
}
function tickResend() {
  const p = $('.g-resend', gateEl()); if (!p) return clearInterval(OTP_TIMER);
  const s = Math.max(0, Math.ceil((AU.resendAt - Date.now()) / 1000));
  p.innerHTML = s ? `Didn’t get it? Resend in 0:${String(s).padStart(2, '0')}` : `Didn’t get it? <button data-act="auResend">Resend code</button>`;
  if (!s) clearInterval(OTP_TIMER);
}
const otpBoxes = () => $$('[data-otp]', gateEl());
function otpInput(e) {
  const t = e.target; if (!t.matches('[data-otp]')) return;
  const d = t.value.replace(/\D/g, '');
  if (d.length > 1) { fillOtp(d); return; }
  t.value = d;
  if (d) { const n = otpBoxes()[+t.dataset.otp + 1]; if (n) n.focus(); else checkOtp(); }
}
function otpKey(e) {
  if (e.key === 'Escape' && $('.g-chooser', gateEl())) { e.stopPropagation(); A.auGClose(); return; }
  const t = e.target; if (!t.matches('[data-otp]') || e.key !== 'Backspace' || t.value) return;
  const p = otpBoxes()[+t.dataset.otp - 1]; if (p) { p.value = ''; p.focus(); e.preventDefault(); }
}
function otpPaste(e) { if (!e.target.matches('[data-otp]')) return; const d = (e.clipboardData.getData('text') || '').replace(/\D/g, ''); if (d) { e.preventDefault(); fillOtp(d); } }
function fillOtp(d) { const b = otpBoxes(); [...d.slice(0, 6)].forEach((c, i) => { b[i].value = c; }); (b[Math.min(d.length, 5)] || b[5]).focus(); if (d.length >= 6) checkOtp(); }
function checkOtp() {
  const code = otpBoxes().map((b) => b.value).join(''), form = $('[data-form="otp"]', gateEl());
  if (code.length < 6) return formErr(form, 'Enter all 6 digits.');
  if (code !== AU.code) { const g = $('.g-otp', form); g.classList.remove('bad'); void g.offsetWidth; g.classList.add('bad'); otpBoxes().forEach((b) => { b.value = ''; }); otpBoxes()[0].focus(); return formErr(form, 'That code isn’t right. Check the text and try again.'); }
  clearInterval(OTP_TIMER);
  const acct = findAcct({ phone: AU.phone });
  if (acct) return finishAuth(acct, false);
  AU.pending = { name: '', phone: AU.phone, method: 'phone' }; toStep('profile');
}

/* ── 4. New players: name, area, sports and level ── */
function renderProfile() {
  const P = AU.pending || {}; P.sports = P.sports || []; P.level = P.level || 'Casual'; AU.pending = P;
  pane(`<div class="g-scroll">
    <div class="g-top"><button class="g-back" data-act="auBack" aria-label="Back">${ic('arrow-left')}</button><span class="g-step">Step 1 of 2</span></div>
    <h2 class="g-h">Set up your profile</h2><p class="g-sub">So we can suggest the right games${P.method === 'google' ? `. Signed in as ${esc(P.email)}` : P.method === 'phone' ? `. Verified +91 ${fmtPhone(P.phone)}` : ''}.</p>
    <form class="g-form" data-form="profile" novalidate>
      <label class="g-field"><span>Your name</span><input name="name" autocomplete="name" placeholder="First and last name" value="${esc(P.name || '')}"></label>
      <fieldset class="g-fs"><legend>Sports you play <small>Pick at least one</small></legend>
        <div class="g-chips">${PROFILE_SPORTS.map((k) => `<button type="button" class="g-chip" data-act="auSport" data-id="${k}" aria-pressed="${P.sports.includes(k)}">${ic(sp(k).icon)}${sp(k).name}</button>`).join('')}</div></fieldset>
      <fieldset class="g-fs"><legend>Your level</legend>
        <div class="g-seg">${LEVELS.map((l) => `<button type="button" data-act="auLevel" data-id="${l}" aria-pressed="${P.level === l}">${l}</button>`).join('')}</div></fieldset>
      ${AU.terms ? '' : termsHTML()}
      <p class="g-err" role="alert"></p>
      <button class="g-btn g-cta" type="submit">Continue${ic('arrow-right')}</button>
    </form></div>`, 'dark');
}
function submitProfile(form) {
  const P = AU.pending; P.name = form.elements.name.value.trim();
  if (P.name.length < 2) return formErr(form, 'Enter your name.', 'name');
  if (!P.sports.length) return formErr(form, 'Pick at least one sport.');
  if (needTerms()) return;
  const acct = { name: P.name, email: P.email || '', phone: P.phone || '', pass: P.pass || '', method: P.method, termsAt: Date.now() };
  accounts().push(acct); S.profile = { sports: P.sports.slice(), level: P.level };
  finishAuth(acct, true);
}

/* ── Signed in ── */
function applyIdentity() { if (S.auth && S.auth.name) FAMILY[0].name = S.auth.name; }
function finishAuth(acct, isNew) {
  if (!S.location) { AU.after = () => finishAuth(acct, isNew); AU.editLoc = false; AU.newcomer = isNew; return toStep('location'); }
  AU.after = null;
  S.auth = { name: acct.name, email: acct.email, phone: acct.phone, method: AU.via || acct.method, since: Date.now(), termsAt: acct.termsAt || Date.now() };
  S.onboarded = true; AU.pending = null; save(); applyIdentity();
  closeGate(); go('play'); renderNote(); startLive();
  const first = acct.name.split(' ')[0];
  toast(isNew ? `Welcome to Splayer, ${first}` : `Welcome back, ${first}`, isNew ? 'sparkles' : 'circle-check');
  if (isNew) { confetti('#3EE07A'); buzz(30); }
}
function accountHTML() {
  const a = S.auth; if (!a) return '';
  return `<div class="section"><h2>Account</h2><div class="lrows">
    ${rowHTML({ act: 'acctSheet', icon: a.method === 'phone' ? 'smartphone' : a.method === 'google' ? 'user' : 'mail', title: esc(a.name), sub: esc(`${METHOD[a.method] || 'Email'} · ${a.email || '+91 ' + fmtPhone(a.phone)}`) })}
    ${rowHTML({ act: 'locEdit', icon: 'map-pin', title: 'Location', sub: S.location ? esc(S.location.label) + (S.location.live ? ' · live' : S.location.source === 'gps' ? ' · from GPS' : ' · entered manually') : 'Not set' })}
    ${rowHTML({ act: 'signOut', icon: 'log-out', title: 'Sign out', sub: 'Your games and streak stay on this device' })}</div></div>`;
}

Object.assign(A, {
  auSkipIntro: () => { if (INTRO) INTRO.finish(); else afterIntro(); },
  auSkipOb: () => obGo(SLIDES.length),
  auNext: () => obGo(AU.slide + 1),
  auMode: (el) => { AU.mode = el.dataset.id; renderAuth(); },
  auTerms: (el) => termsSheet(el.dataset.id),
  auAgree: () => { AU.terms = true; A.auGClose(); const b = $('[data-terms]', gateEl()); if (b) { b.checked = true; const w = $('.g-terms', gateEl()); $('.g-terr', w).textContent = ''; w.classList.remove('bad'); } },
  auEye: (el) => { const i = el.previousElementSibling, show = i.type === 'password'; i.type = show ? 'text' : 'password'; el.setAttribute('aria-pressed', show); el.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); el.innerHTML = ic(show ? 'eye-off' : 'eye'); },
  auForgot: () => { const f = $('[data-form="email"]', gateEl()), e = f.elements.email.value.trim();
    if (!EMAIL_RE.test(e)) return formErr(f, 'Enter your email first and we’ll send a reset link.', 'email');
    formErr(f, ''); toast(`Reset link sent to ${e}`, 'mail'); },
  auGoogle: () => { if (AU.mode === 'signup' && needTerms()) return; AU.via = 'google'; googleSheet(false); },
  auGOther: () => googleSheet(true),
  auGClose: () => $$('.g-scrim, .g-chooser', gateEl()).forEach((e) => e.remove()),
  auGPick: (el) => googlePick(GOOGLE_PEOPLE[+el.dataset.id]),
  auPhone: () => { if (AU.step === 'auth' && AU.mode === 'signup' && needTerms()) return; AU.via = 'phone'; toStep('phone'); },
  auBack: () => toStep(AU.step === 'otp' ? 'phone' : AU.step === 'location' && AU.newcomer ? 'profile' : 'auth'),
  auResend: () => { sendCode(); renderOtp(); toast('New code sent', 'message-square'); },
  auFill: () => { fillOtp(AU.code); },
  auSport: (el) => { const P = AU.pending, k = el.dataset.id, i = P.sports.indexOf(k); if (i >= 0) P.sports.splice(i, 1); else P.sports.push(k); el.setAttribute('aria-pressed', i < 0); buzz(6); },
  auLevel: (el) => { AU.pending.level = el.dataset.id; $$('[data-act="auLevel"]', gateEl()).forEach((b) => b.setAttribute('aria-pressed', b === el)); },
  acctSheet: () => { const a = S.auth, P = S.profile || {};
    sheet(`${head(esc(a.name), `Signed in with ${METHOD[a.method] || 'email'}`)}
      <div class="facts"><div class="fact"><b>${esc(a.email || '+91 ' + fmtPhone(a.phone))}</b><span>${a.email ? 'Email' : 'Phone'}</span></div><div class="fact"><b>${esc(P.level || 'Casual')}</b><span>Level</span></div></div>
      ${P.sports && P.sports.length ? `<div class="chips" style="display:flex;flex-wrap:wrap;gap:8px">${P.sports.map((k) => `<span class="chip">${ic(sp(k).icon)}${sp(k).name}</span>`).join('')}</div>` : ''}
      <div class="muted">${esc(P.area || '')}</div>
      <button class="pill block soft" data-act="signOut">${ic('log-out')}Sign out</button>`); },
  signOut: () => sheet(`${head('Sign out of Splayer?', 'Your games, teams and streak stay saved on this device.')}
      <button class="pill block" data-act="signOutGo">${ic('log-out')}Sign out</button><button class="pill block soft" data-act="close">Cancel</button>`),
  signOutGo: () => { const e = S.auth && S.auth.email; S.auth = null; stopLive(); save(); FAMILY[0].name = DEMO_ACCT.name; AU = { mode: 'login', step: 'auth', slide: 0, pending: null, lastEmail: e }; openGate('auth'); renderNote(); },
  replayIntro: () => { AU.slide = 0; openGate('intro'); },
  replayOnboarding: () => { S.auth = null; S.onboarded = false; S.location = null; AU.terms = false; stopLive(); save(); FAMILY[0].name = DEMO_ACCT.name; AU = { mode: 'signup', step: 'intro', slide: 0, pending: null }; openGate('intro'); renderNote(); }
});
const _reset = A.reset;
A.reset = () => { stopLive(); _reset(); FAMILY[0].name = DEMO_ACCT.name; AU = { mode: 'signup', step: 'intro', slide: 0, pending: null }; openGate('intro'); };

document.addEventListener('submit', (e) => {
  const f = e.target.closest('#gate form[data-form]'); if (!f) return; e.preventDefault();
  ({ email: submitEmail, phone: submitPhone, otp: () => checkOtp(), profile: submitProfile,
    loc: submitLoc, google: (form) => { const n = form.elements.name.value.trim(), m = form.elements.email.value.trim().toLowerCase();
      if (n.length < 2) return formErr(form, 'Enter your name.', 'name');
      if (!EMAIL_RE.test(m)) return formErr(form, 'Enter a valid email address.', 'email');
      googlePick({ name: n, email: m }); } })[f.dataset.form](f);
});
document.addEventListener('change', (e) => { if (e.target.matches && e.target.matches('#gate [data-terms]')) { AU.terms = e.target.checked; if (AU.terms) { const w = e.target.closest('.g-terms'); $('.g-terr', w).textContent = ''; w.classList.remove('bad'); } } });
/* Typing in a field clears its error. */
document.addEventListener('input', (e) => { const f = e.target.closest && e.target.closest('#gate form'); if (!f || e.target.matches('[data-otp]')) return; e.target.removeAttribute('aria-invalid'); const p = $('.g-err', f); if (p) p.innerHTML = ''; });
/* Phone number: group as 98765 43210 while typing. */
document.addEventListener('input', (e) => { const t = e.target; if (!t.matches || !t.matches('#gate input[name=phone]')) return; const d = t.value.replace(/\D/g, '').slice(0, 10); t.value = d.length > 5 ? d.slice(0, 5) + ' ' + d.slice(5) : d; });

function startWelcome() { applyIdentity(); openGate(S.auth ? 'splash' : 'intro'); if (S.auth) startLive(); }

/* ── 5. Location: ask permission for GPS, or type an address. Used for "near you" and live updates. ── */
/* Fallback places when the address lookup service can't be reached (offline, or blocked by the host page). */
const IN_AREAS = [
  ['Indiranagar', 'Bengaluru, Karnataka', 12.9719, 77.6412], ['Koramangala', 'Bengaluru, Karnataka', 12.9352, 77.6245], ['HSR Layout', 'Bengaluru, Karnataka', 12.9116, 77.6474],
  ['Whitefield', 'Bengaluru, Karnataka', 12.9698, 77.7500], ['Jayanagar', 'Bengaluru, Karnataka', 12.9308, 77.5838], ['Malleshwaram', 'Bengaluru, Karnataka', 13.0031, 77.5643],
  ['Bandra West', 'Mumbai, Maharashtra', 19.0596, 72.8295], ['Andheri West', 'Mumbai, Maharashtra', 19.1364, 72.8296], ['Powai', 'Mumbai, Maharashtra', 19.1176, 72.9060],
  ['Hauz Khas', 'New Delhi, Delhi', 28.5494, 77.2001], ['Connaught Place', 'New Delhi, Delhi', 28.6315, 77.2167], ['Dwarka', 'New Delhi, Delhi', 28.5921, 77.0460],
  ['Gachibowli', 'Hyderabad, Telangana', 17.4401, 78.3489], ['Banjara Hills', 'Hyderabad, Telangana', 17.4126, 78.4482], ['Anna Nagar', 'Chennai, Tamil Nadu', 13.0850, 80.2101],
  ['T Nagar', 'Chennai, Tamil Nadu', 13.0418, 80.2341], ['Salt Lake', 'Kolkata, West Bengal', 22.5867, 88.4171], ['Kothrud', 'Pune, Maharashtra', 18.5074, 73.8077],
  ['Viman Nagar', 'Pune, Maharashtra', 18.5679, 73.9143], ['Navrangpura', 'Ahmedabad, Gujarat', 23.0365, 72.5611], ['Kakkanad', 'Kochi, Kerala', 10.0159, 76.3419]
].map(([label, sub, lat, lng]) => ({ label, sub, lat, lng }));
const OSM = 'https://nominatim.openstreetmap.org';
async function osm(path) {
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 6000);
  try { const r = await fetch(OSM + path, { signal: ctl.signal, headers: { 'Accept-Language': 'en' } }); if (!r.ok) throw new Error('lookup ' + r.status); return await r.json(); }
  finally { clearTimeout(timer); }
}
const placeName = (a = {}) => {
  const area = a.suburb || a.neighbourhood || a.quarter || a.city_district || a.road || a.village || a.town;
  const city = a.city || a.town || a.state_district || a.county;
  return { label: [area, area !== city ? city : null].filter(Boolean).join(', ') || city || a.state || 'Your location', sub: [a.state, a.postcode].filter(Boolean).join(' ') };
};
async function reverseGeo(lat, lng) {
  try { const j = await osm(`/reverse?format=jsonv2&zoom=16&addressdetails=1&lat=${lat}&lon=${lng}`); const n = placeName(j.address); return { label: n.label, sub: n.sub || j.display_name }; }
  catch (e) {
    const near = IN_AREAS.map((p) => ({ p, d: Math.hypot(p.lat - lat, (p.lng - lng) * Math.cos(lat * Math.PI / 180)) })).sort((a, b) => a.d - b.d)[0];
    return near && near.d < .06 ? { label: `${near.p.label}, ${near.p.sub.split(',')[0]}`, sub: 'Approximate area' } : { label: `Near ${lat.toFixed(3)}, ${lng.toFixed(3)}`, sub: 'Area name unavailable right now' };
  }
}
async function searchPlaces(q) {
  try {
    const j = await osm(`/search?format=jsonv2&addressdetails=1&limit=6&countrycodes=in&q=${encodeURIComponent(q)}`);
    return j.map((r) => { const n = placeName(r.address); return { label: r.name && r.name !== n.label.split(',')[0] ? `${r.name}, ${n.label}` : n.label, sub: r.display_name, lat: +r.lat, lng: +r.lon }; });
  } catch (e) {
    const t = q.toLowerCase(); return IN_AREAS.filter((p) => (p.label + ' ' + p.sub).toLowerCase().includes(t)).slice(0, 6).map((p) => ({ ...p, label: `${p.label}, ${p.sub.split(',')[0]}`, offline: true }));
  }
}
const kmBetween = (a, b) => { const R = 6371, r = Math.PI / 180, dl = (b.lat - a.lat) * r, dg = (b.lng - a.lng) * r;
  const h = Math.sin(dl / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dg / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };

function renderLocation() {
  AU.loc = AU.loc || (AU.editLoc && S.location ? { ...S.location } : null);
  if (AU.live == null) AU.live = true;
  pane(`<div class="g-scroll">
    <div class="g-top"><button class="g-back" data-act="${AU.editLoc ? 'locCancel' : 'auBack'}" aria-label="${AU.editLoc ? 'Close' : 'Back'}">${ic(AU.editLoc ? 'x' : 'arrow-left')}</button><span class="g-step">${AU.editLoc ? 'Your location' : AU.newcomer ? 'Step 2 of 2' : 'One more thing'}</span></div>
    <h2 class="g-h">Where do you play?</h2>
    <p class="g-sub">Splayer uses your location to show games, turfs and players near you in real time.</p>
    <button class="g-gps" data-act="locGps"><span class="g-gps-ic">${ic('locate-fixed')}</span><span><b>Use my current location</b><small>Most accurate. Your browser will ask for permission.</small></span>${ic('chevron-right')}</button>
    <div class="g-locstate" aria-live="polite"></div>
    <div class="g-or"><span>or enter your address</span></div>
    <form class="g-form" data-form="loc" novalidate autocomplete="off">
      <div class="g-field g-combo"><label for="gAddr">Area, street or landmark</label>
        <input id="gAddr" name="q" type="text" placeholder="e.g. 100 Feet Road, Indiranagar" role="combobox" aria-expanded="false" aria-controls="gSugg" aria-autocomplete="list" enterkeyhint="search">
        <ul id="gSugg" class="g-sugg" role="listbox" aria-label="Matching places" hidden></ul></div>
      <label class="g-field"><span>Flat, building or nearby landmark <small class="g-opt">Optional</small></span><input name="extra" autocomplete="address-line2" placeholder="e.g. Tower B, near the metro" value="${esc((AU.loc && AU.loc.extra) || '')}"></label>
      <p class="g-err" role="alert"></p>
      <button class="g-btn g-cta" type="submit">${AU.editLoc ? 'Save location' : 'Let’s play'}${ic('arrow-right')}</button>
    </form>
    <p class="g-fine">Your location stays on this device. Area names are looked up with OpenStreetMap. Change it any time in Me → Location.</p></div>`, 'dark');
  locState();
  if (navigator.permissions && navigator.permissions.query) navigator.permissions.query({ name: 'geolocation' }).then((st) => { AU.perm = st.state; if (!AU.locBusy) locState(); }).catch(() => {});
}
function locState(msg, tone = '') {
  const box = $('.g-locstate', gateEl()); if (!box) return;
  const L = AU.loc;
  if (!msg && AU.perm === 'denied' && !(L && L.source === 'gps')) { msg = 'Location is blocked for this site. Allow it in your browser’s site settings and try again, or enter your address below.'; tone = 'warn'; }
  box.innerHTML = `${msg ? `<p class="g-locmsg ${tone}">${tone === 'busy' ? '<span class="g-spin" aria-hidden="true"></span>' : ''}${msg}</p>` : ''}
    ${L ? `<div class="g-picked">${ic(L.source === 'gps' ? 'locate-fixed' : 'map-pin')}<div><b>${esc(L.label)}</b><small>${esc(L.sub || (L.source === 'gps' ? 'From GPS' : 'Entered manually'))}${L.acc ? ` · accurate to ${Math.round(L.acc)} m` : ''}</small></div><button type="button" class="g-inline" data-act="locClear">Change</button></div>
      ${L.source === 'gps' ? `<label class="g-check sm"><input type="checkbox" data-live ${AU.live ? 'checked' : ''}><span><b>Live location</b> · keep games and distances updated while I use Splayer</span></label>` : ''}` : ''}`;
}
function locGps() {
  if (!('geolocation' in navigator)) return locState('This browser can’t share your location. Enter your address below.', 'warn');
  if (!window.isSecureContext) return locState('Location needs a secure (https) connection. Enter your address below.', 'warn');
  AU.locBusy = true; locState('Waiting for permission. Choose “Allow” when your browser asks.', 'busy');
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude: lat, longitude: lng, accuracy: acc } = pos.coords;
    AU.perm = 'granted'; locState(`Found you, accurate to ${Math.round(acc)} m. Looking up your area…`, 'busy');
    const n = await reverseGeo(lat, lng);
    AU.locBusy = false; AU.loc = { label: n.label, sub: n.sub, lat, lng, acc, source: 'gps' };
    const f = $('[data-form="loc"]', gateEl()); if (f) { f.elements.q.value = ''; hideSugg(); }
    locState(); buzz(15);
  }, (err) => {
    AU.locBusy = false;
    if (err.code === 1) { AU.perm = 'denied'; locState('You chose not to share your location. That’s fine: enter your address below. You can allow it later in your browser’s site settings.', 'warn'); }
    else locState(err.code === 3 ? 'Couldn’t get a fix in time. Try again, or enter your address below.' : 'Your location isn’t available right now. Enter your address below.', 'warn');
  }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
}
/* Address search with suggestions (debounced; keyboard friendly). */
let SUGG = [], SUGG_T = 0, SUGG_I = -1, SUGG_Q = '';
const suggBox = () => $('#gSugg', gateEl());
function hideSugg() { const u = suggBox(); if (!u) return; u.hidden = true; u.innerHTML = ''; SUGG = []; SUGG_I = -1; const i = $('#gAddr', gateEl()); if (i) { i.setAttribute('aria-expanded', 'false'); i.removeAttribute('aria-activedescendant'); } }
function showSugg(list, q) {
  const u = suggBox(), inp = $('#gAddr', gateEl()); if (!u || inp.value.trim() !== q) return;
  SUGG = list; SUGG_I = -1;
  u.innerHTML = list.length ? list.map((r, i) => `<li role="option" id="gOpt${i}" aria-selected="false"><button type="button" data-act="locPick" data-i="${i}" tabindex="-1">${ic('map-pin')}<span><b>${esc(r.label)}</b><small>${esc(r.sub || '')}</small></span></button></li>`).join('')
    + (list[0] && list[0].offline ? '<li class="g-sugg-note">Showing saved areas: live address search is unavailable right now.</li>' : '')
    : `<li class="g-sugg-note">No matches. You can still use “${esc(q)}” as your address.</li>`;
  u.hidden = false; inp.setAttribute('aria-expanded', 'true');
}
document.addEventListener('input', (e) => {
  const t = e.target; if (!t.matches || !t.matches('#gAddr')) return;
  const q = t.value.trim(); clearTimeout(SUGG_T);
  if (q.length < 3) return hideSugg();
  const u = suggBox(); u.hidden = false; u.innerHTML = '<li class="g-sugg-note"><span class="g-spin" aria-hidden="true"></span>Searching…</li>'; t.setAttribute('aria-expanded', 'true');
  SUGG_T = setTimeout(async () => { SUGG_Q = q; const r = await searchPlaces(q); if (SUGG_Q === q) showSugg(r, q); }, 380);
});
document.addEventListener('keydown', (e) => {
  if (!e.target.matches || !e.target.matches('#gAddr') || !SUGG.length) return;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault(); SUGG_I = (SUGG_I + (e.key === 'ArrowDown' ? 1 : -1) + SUGG.length) % SUGG.length;
    $$('#gSugg [role=option]', gateEl()).forEach((o, i) => o.setAttribute('aria-selected', i === SUGG_I));
    e.target.setAttribute('aria-activedescendant', 'gOpt' + SUGG_I);
  } else if (e.key === 'Enter' && SUGG_I >= 0) { e.preventDefault(); pickPlace(SUGG[SUGG_I]); }
  else if (e.key === 'Escape') { e.stopPropagation(); hideSugg(); }
});
document.addEventListener('change', (e) => { if (e.target.matches && e.target.matches('#gate [data-live]')) AU.live = e.target.checked; });
function pickPlace(r) {
  AU.loc = { label: r.label, sub: r.sub, lat: r.lat, lng: r.lng, source: 'manual' };
  const i = $('#gAddr', gateEl()); if (i) i.value = r.label;
  hideSugg(); locState(); buzz(10);
  const f = $('[data-form="loc"]', gateEl()); if (f) formErr(f, '');
}
function submitLoc(form) {
  const q = form.elements.q.value.trim(), extra = form.elements.extra.value.trim();
  if ((!AU.loc || (q && AU.loc.label !== q && AU.loc.source === 'manual')) && q) {
    if (SUGG.length) pickPlace(SUGG[0]); else AU.loc = { label: q, sub: 'Entered manually', source: 'manual' };
  }
  if (!AU.loc) return formErr(form, 'Use your current location or enter an address to continue.', 'q');
  S.location = { ...AU.loc, extra, live: AU.loc.source === 'gps' && !!AU.live, at: Date.now() };
  save(); AU.loc = null;
  const after = AU.after; AU.after = null;
  if (after) after(); else { closeGate(); startLive(); if (tab === 'play') renderPlay(); else go(tab); toast(`Location set to ${S.location.label}`, 'map-pin'); }
}
/* Live location: follow the device while the app is open; re-name the area after moving ~400 m. */
let LIVE_ID = null, LIVE_NAMED = 0;
function startLive() {
  stopLive();
  if (!S.location || !S.location.live || !('geolocation' in navigator)) return;
  LIVE_ID = navigator.geolocation.watchPosition(async (pos) => {
    const L = S.location; if (!L || !L.live) return stopLive();
    const now = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    const moved = L.lat != null ? kmBetween(L, now) : 1;
    Object.assign(L, now, { acc: pos.coords.accuracy, at: Date.now() });
    if (moved > .4 && Date.now() - LIVE_NAMED > 60000) { LIVE_NAMED = Date.now(); const n = await reverseGeo(now.lat, now.lng); L.label = n.label; L.sub = n.sub; }
    save(); const chip = $('#locChip span'); if (chip) chip.textContent = L.label;
  }, () => { /* permission revoked or unavailable: keep the last known place */ }, { enableHighAccuracy: false, maximumAge: 30000, timeout: 30000 });
}
function stopLive() { if (LIVE_ID != null) { try { navigator.geolocation.clearWatch(LIVE_ID); } catch (e) { /* ignore */ } LIVE_ID = null; } }
const locChipHTML = () => S.location ? `<button class="locchip" id="locChip" data-act="locEdit" aria-label="Location: ${esc(S.location.label)}${S.location.live ? ', live' : ''}. Change">${ic('map-pin')}<span>${esc(S.location.label)}</span>${S.location.live ? '<i class="live" aria-hidden="true"></i>' : ''}</button>` : '';

Object.assign(A, {
  locGps: () => locGps(),
  locPick: (el) => pickPlace(SUGG[+el.dataset.i]),
  locClear: () => { AU.loc = null; locState(); const i = $('#gAddr', gateEl()); if (i) { i.value = ''; i.focus(); } },
  locEdit: () => { closeSheet(); AU.editLoc = true; AU.after = null; AU.loc = null; AU.live = S.location ? S.location.live !== false : true; openGate('location'); },
  locCancel: () => { AU.loc = null; closeGate(); }
});
