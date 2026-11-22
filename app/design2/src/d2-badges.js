/* ═════ BADGES AND STREAKS: game-style medals drawn as SVG ═════
   Each badge has a metal tier (bronze, silver, gold, epic), its own shape and an emblem.
   Locked badges are drawn in neutral tones that follow the theme, with progress towards them. */
const TIERS = {
  bronze: { name: 'Bronze', xp: 25, hi: '#F7C894', lo: '#B5622C', rim: '#6E3714', core: '#7F4219', rib: ['#C8402F', '#8E2A20'] },
  silver: { name: 'Silver', xp: 50, hi: '#F7F9FB', lo: '#9EA8B6', rim: '#525B68', core: '#5E6876', rib: ['#2F6BDA', '#1E4AA0'] },
  gold: { name: 'Gold', xp: 100, hi: '#FFEDA8', lo: '#E09A12', rim: '#7E5404', core: '#9A6905', rib: ['#5B3FE6', '#3E27B5'] },
  epic: { name: 'Epic', xp: 250, hi: '#D6CCFF', lo: '#6A4BEF', rim: '#26157A', core: '#34209E', rib: ['#E0503F', '#A9301F'] },
};
const countIf = (n, goal) => [Math.min(n, goal), goal];
const BADGES = [
  { id: 'first', name: 'First whistle', how: 'Join your first game', tier: 'bronze', shape: 'round', glyph: 'award', prog: () => countIf(S.joined.length, 1), cta: ['tab', 'play', 'Find a game'] },
  { id: 'early', name: 'Early bird', how: 'Join a game that starts before 7 am', tier: 'silver', shape: 'hex', glyph: 'cloud-sun', prog: () => countIf(S.joined.filter((id) => +((actById(id) || { t: '12' }).t.split(':')[0]) < 7).length, 1), cta: ['tab', 'play', 'Find a morning game'] },
  { id: 'hattrick', name: 'Hat-trick', how: 'Hit your weekly goal 3 weeks running', tier: 'gold', shape: 'star', glyph: 'flame', prog: () => countIf(streakWeeks(), 3), cta: ['tab', 'play', 'Find a game'] },
  { id: 'explorer', name: 'Explorer', how: 'Play 4 different sports', tier: 'silver', shape: 'hex', glyph: 'compass', prog: () => countIf(new Set(S.joined.map((id) => (actById(id) || {}).sport)).size, 4), cta: ['tab', 'play', 'Try a new sport'] },
  { id: 'court', name: 'Court boss', how: 'Book a court for your crew', tier: 'bronze', shape: 'shield', glyph: 'calendar-days', prog: () => countIf(S.turf.length, 1), cta: ['openBook', '', 'Book a court'] },
  { id: 'family', name: 'Family captain', how: 'Book games for 3 people in your family', tier: 'silver', shape: 'round', glyph: 'users', prog: () => countIf(new Set(Object.values(S.bookings).flat()).size, 3), cta: ['tab', 'play', 'Find a family game'] },
  { id: 'captain', name: 'Captain', how: 'Captain a team', tier: 'gold', shape: 'shield', glyph: 'crown', prog: () => countIf((can.teams() ? S.teams : S.teams.filter((t) => t.mine)).filter((t) => t.members[0].role === 'Captain').length, 1), cta: ['tab', 'team', 'Go to Team'] },
  { id: 'mapper', name: 'Map maker', how: 'Add a ground or play zone to the map', tier: 'silver', shape: 'hex', glyph: 'map-pin-plus', prog: () => countIf(S.places.length, 1), cta: ['placeNew', '', 'Add a place'] },
  { id: 'host', name: 'Host with the most', how: 'Host a game', tier: 'gold', shape: 'round', glyph: 'megaphone', prog: () => countIf(S.hosted.length, 1), cta: ['hostStart', '', 'Host a game'] },
  { id: 'recruit', name: 'Recruiter', how: 'Invite 5 players to your teams (Pro)', tier: 'bronze', shape: 'shield', glyph: 'user-plus', prog: () => countIf(S.teams.flatMap((t) => t.members).filter((m) => m.status === 'invited').length, 5), cta: ['tab', 'team', 'Add players'] },
  { id: 'iron', name: 'Iron streak', how: 'Keep your streak going for 8 weeks', tier: 'epic', shape: 'star', glyph: 'zap', prog: () => countIf(streakWeeks(), 8), cta: ['tab', 'play', 'Keep it going'] },
  { id: 'legend', name: 'Local legend', how: 'Reach level 8', tier: 'epic', shape: 'round', glyph: 'star', prog: () => countIf(level(), 8), cta: ['tab', 'play', 'Earn XP'] },
];
const badgeEarned = (b) => { const [c, g] = b.prog(); return c >= g; };

/* Shapes are centred on (50, 46) in a 100 × 100 box. */
const poly = (n, r, rot, r2) => { const pts = []; const k = r2 ? 2 * n : n; for (let i = 0; i < k; i++) { const a = rot + (i * Math.PI * 2) / k, rr = r2 && i % 2 ? r2 : r; pts.push((50 + rr * Math.cos(a)).toFixed(1) + ',' + (46 + rr * Math.sin(a)).toFixed(1)); } return `<polygon points="${pts.join(' ')}"`; };
const SHIELD = 'M50 4 L87 16 V44 C87 68 71 84 50 95 C29 84 13 68 13 44 V16 Z';
function shapeEl(shape, s) {
  if (shape === 'round') return `<circle cx="50" cy="46" r="${40 * s}"`;
  if (shape === 'hex') return poly(6, 42 * s, -Math.PI / 2);
  if (shape === 'star') return poly(12, 44 * s, -Math.PI / 2, 37 * s);
  return `<path d="${SHIELD}" transform="translate(${50 - 50 * s} ${50 - 50 * s}) scale(${s})"`;
}
let badgeUid = 0;
/* Sharp neon (CRED-like): a hairline gradient rim, a second fine rim inside, bezel tick marks on round and star badges,
   a small diamond at the top, and a thin emblem with a white-hot core. The glow is a faint, wide halo at under half
   strength, so the badge reads as clean linework rather than a light source. Locked badges are charcoal, unlit. */
const NEON = { bronze: ['#FFB27A', '#FF6A3D'], silver: ['#EAF8FF', '#7FD3FF'], gold: ['#FFE9A0', '#FFB400'], epic: ['#F4B8FF', '#9B6BFF'] };
function badgeSVG(b, earned, px) {
  const u = 'bg' + (++badgeUid), [a, c] = earned ? NEON[b.tier] : ['#3A3A42', '#2A2A30'], sh = b.shape;
  const glyph = GLYPHS[b.glyph] || ICONS[b.glyph] || ICONS.award, glow = earned ? `filter="url(#${u}t)"` : '';
  const ticks = sh === 'round' || sh === 'star' ? Array.from({ length: 36 }, (_, i) => { const t = (i * 10 - 90) * Math.PI / 180, r1 = i % 3 === 0 ? 45.5 : 46.5;
    return `<line x1="${(50 + r1 * Math.cos(t)).toFixed(2)}" y1="${(46 + r1 * Math.sin(t)).toFixed(2)}" x2="${(50 + 48.5 * Math.cos(t)).toFixed(2)}" y2="${(46 + 48.5 * Math.sin(t)).toFixed(2)}"/>`; }).join('') : '';
  const dy = sh === 'round' ? 6 : sh === 'shield' ? 5 : 4;
  return `<svg class="bart ${earned ? 'on t-' + b.tier : 'off'}" width="${px}" height="${px}" viewBox="0 0 100 100" aria-hidden="true">
    <defs><linearGradient id="${u}s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${c}"/></linearGradient>
      <linearGradient id="${u}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}" stop-opacity="${earned ? 0.1 : 0.04}"/><stop offset=".6" stop-color="${a}" stop-opacity="0"/></linearGradient>
      <filter id="${u}t" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.8" result="g"/><feComponentTransfer in="g" result="s"><feFuncA type="linear" slope=".4"/></feComponentTransfer><feMerge><feMergeNode in="s"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <g stroke="${a}" stroke-opacity="${earned ? 0.55 : 0.6}" stroke-width=".8">${ticks}</g>
    ${shapeEl(sh, 1)} fill="url(#${u}f)" stroke="url(#${u}s)" stroke-width="1.5" stroke-linejoin="miter" ${glow}/>
    ${shapeEl(sh, 0.84)} fill="none" stroke="${a}" stroke-opacity="${earned ? 0.4 : 0.45}" stroke-width=".7"/>
    <rect x="47.6" y="${dy - 2.4}" width="4.8" height="4.8" transform="rotate(45 50 ${dy})" fill="${a}"/>
    <g transform="translate(33.2 29.2) scale(1.4)" fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="${a}" stroke-width="1.5" ${glow}>${glyph}</g>${earned ? `<g stroke="#fff" stroke-width=".6" stroke-opacity=".85">${glyph}</g>` : ''}</g>
  </svg>`;
}

/* ── Streak ── */
const FLAME = { outer: 'M50 4c6 16 26 26 26 52a26 26 0 0 1-52 0c0-14 8-22 12-32 3 9 8 13 12 14-2-12-2-22 2-34z', mid: 'M50 34c4 10 16 16 16 30a16 16 0 0 1-32 0c0-8 5-13 8-19 2 5 5 7 7 8-1-7 0-13 1-19z', core: 'M50 58c2 5 8 8 8 14a8 8 0 0 1-16 0c0-5 4-8 8-14z' };
function flameSVG(px, lit = true) {
  const u = 'fl' + (++badgeUid);
  return `<svg class="flame ${lit ? 'lit' : ''}" width="${px}" height="${px}" viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB13B"/><stop offset="1" stop-color="#E2391D"/></linearGradient></defs>
    <path d="${FLAME.outer}" fill="${lit ? `url(#${u})` : 'var(--lk-lo)'}"/>${lit ? `<path class="fmid" d="${FLAME.mid}" fill="#FFD449"/><path class="fcore" d="${FLAME.core}" fill="#FFF6D6"/>` : ''}</svg>`;
}
/* Ice crystal for frozen weeks and freezes. */
const snowSVG = (px) => `<svg class="snow" width="${px}" height="${px}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 2v20M3.3 7l17.4 10M20.7 7 3.3 17"/><path d="m9 4 3 2 3-2M9 20l3-2 3 2M4.2 10.3l3.5-.5-1.3-3.3M19.8 13.7l-3.5.5 1.3 3.3M4.2 13.7l3.5.5-1.3 3.3M19.8 10.3l-3.5-.5 1.3-3.3"/></svg>`;
const MAX_FREEZES = 3, FREEZE_EVERY = 4;
const bestStreak = () => { let best = 0, run = 0; S.streak.forEach((v) => { run = v === 1 ? run + 1 : v === 2 ? run : 0; best = Math.max(best, run); }); return Math.max(best, S.bestStreak || 0); };
const curWeek = () => S.streak[S.streak.length - 1];
/* ── Player banner: an arena at night, your avatar inside a neon XP ring with a level shield ── */
function heroHTML() {
  const lv = level(), title = TITLES[Math.min(lv - 1, TITLES.length - 1)], into = S.xp % LV, pct = into / LV, C = 2 * Math.PI * 44, got = BADGES.filter(badgeEarned).length;
  return `<div class="hero">
    <svg class="hero-art" viewBox="0 0 360 230" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs><linearGradient id="hbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#170B3B"/><stop offset=".6" stop-color="#0C1030"/><stop offset="1" stop-color="#05121E"/></linearGradient>
        <radialGradient id="hg1"><stop offset="0" stop-color="#8A5CFF" stop-opacity=".75"/><stop offset="1" stop-color="#8A5CFF" stop-opacity="0"/></radialGradient>
        <radialGradient id="hg2"><stop offset="0" stop-color="#21D4FD" stop-opacity=".55"/><stop offset="1" stop-color="#21D4FD" stop-opacity="0"/></radialGradient>
        <linearGradient id="hsl" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".5"/></linearGradient></defs>
      <rect width="360" height="230" fill="url(#hbg)"/><circle cx="62" cy="70" r="120" fill="url(#hg1)"/><circle cx="330" cy="210" r="140" fill="url(#hg2)"/>
      <g fill="none" stroke="#fff" stroke-opacity=".08" stroke-width="1.5"><circle cx="62" cy="70" r="60"/><circle cx="62" cy="70" r="88"/><path d="M180 0 V230"/><circle cx="180" cy="230" r="70"/></g>
      <g stroke="url(#hsl)" stroke-linecap="round">${[[190, 40, 330, 18, 2], [210, 70, 350, 50, 1.4], [240, 98, 356, 82, 1], [170, 120, 300, 104, 1.2]].map(([x1, y1, x2, y2, w]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="${w}"/>`).join('')}</g>
      <g fill="#fff">${[[300, 30, 1.4], [256, 22, 1], [338, 120, 1.2], [140, 26, 0.9], [118, 200, 1.1], [220, 190, 0.8]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" opacity=".7"/>`).join('')}</g>
    </svg>
    <button class="hero-plan tierword t-${S.tier}" data-act="plans">${ic(PLANS[S.tier].icon)}${PLANS[S.tier].name}</button>
    <div class="hero-in">
      <div class="hero-av"><svg viewBox="0 0 100 100" class="xpring" aria-hidden="true"><defs><linearGradient id="xpg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF7EF0"/><stop offset="1" stop-color="#21D4FD"/></linearGradient><filter id="xpf" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
        <circle cx="50" cy="50" r="44" class="trk"/><circle cx="50" cy="50" r="44" class="val" stroke="url(#xpg)" filter="url(#xpf)" stroke-dasharray="${(C * pct).toFixed(1)} ${C.toFixed(1)}"/></svg>
        <span class="ava">AM</span>
        <span class="lvl" aria-label="Level ${lv}"><svg viewBox="0 0 40 44" aria-hidden="true"><path d="M20 2 L37 11 V31 L20 42 L3 31 V11 Z" fill="#0B0C13" stroke="url(#xpg)" stroke-width="2.5"/></svg><b class="num">${lv}</b></span></div>
      <div class="hero-id"><span class="hero-title">${esc(title)}</span><h2>Arjun Mehta</h2>
        <span class="xpt num"><b>${into}</b> / ${LV} XP <span>to level ${lv + 1}</span></span><span class="neonbar"><i style="width:${(pct * 100).toFixed(1)}%"></i></span></div>
    </div>
    <div class="hero-stats">
      <div class="hs"><span class="hs-ic" style="--n:#21D4FD">${ic('calendar-days')}</span><b class="num">${S.joined.length}</b><small>Games</small></div>
      <div class="hs"><span class="hs-ic" style="--n:#FF8A3D">${ic('flame')}</span><b class="num">${streakWeeks()}</b><small>Week streak</small></div>
      <div class="hs"><span class="hs-ic" style="--n:#FFD23F">${ic('award')}</span><b class="num">${got}/${BADGES.length}</b><small>Badges</small></div>
      <div class="hs"><span class="hs-ic" style="--n:#FF7EF0">${ic('zap')}</span><b class="num">${S.xp.toLocaleString('en-IN')}</b><small>Total XP</small></div>
    </div>
  </div>`;
}
/* ── This week: streak, the last 8 weeks, freezes and the weekly goal in one compact card ── */
function streakCardHTML() {
  const n = streakWeeks(), left = Math.max(0, S.goal - S.week), last = S.streak.length - 1, cw = curWeek();
  const miles = [[3, 'Hat-trick badge'], [5, '+100 XP'], [8, 'Iron streak badge'], [12, '+240 XP']], next = miles.find(([w]) => w > n);
  const msg = cw === 1 ? '<b>Goal hit.</b> Streak safe'
    : cw === 2 ? '<b>Week frozen.</b> Streak safe'
    : `<b>${left} more game${left > 1 ? 's' : ''}</b> to keep the streak`;
  const r = 15, Cr = 2 * Math.PI * r, done = Math.min(S.week, S.goal);
  return `<div class="section wk">
    <div class="wk-top">${flameSVG(46, n > 0)}<div class="wk-id"><b><span class="num">${n}</span>-week streak</b><small>Best ${bestStreak()} · ${next ? `next: ${next[0]} weeks, ${next[1]}` : 'every milestone reached'}</small></div>
      <button class="freeze" data-act="freezeSheet" aria-label="${S.freezes} streak freeze${S.freezes === 1 ? '' : 's'}${cw === 2 ? ', this week frozen' : ''}. Manage">${snowSVG(15)}<span class="num">${S.freezes}</span>${cw === 2 ? ' · on' : ''}</button></div>
    <div class="chain sm" aria-label="Your last ${S.streak.length} weeks">${S.streak.map((v, i) => { const now = i === last, st = v === 1 ? 'hit' : v === 2 ? 'ice' : 'miss';
      return `<div class="link ${st} ${now ? 'now' : ''}" title="${now ? 'This week' : `${last - i} weeks ago`}: ${{ hit: 'goal hit', ice: 'frozen', miss: now ? 'in progress' : 'missed' }[st]}"><span class="node">${v === 1 ? flameSVG(16) : v === 2 ? snowSVG(13) : now ? flameSVG(14, false) : '<i></i>'}</span><small>${now ? 'Now' : `${last - i}w`}</small></div>`; }).join('')}</div>
    <div class="wk-goal"><span class="wk-ring"><svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="${r}" class="tr"/><circle cx="18" cy="18" r="${r}" class="vl" stroke-dasharray="${(Cr * done / S.goal).toFixed(1)} ${Cr.toFixed(1)}"/></svg><b class="num">${done}/${S.goal}</b></span>
      <div class="wk-msg"><small>Weekly goal</small><span>${msg}</span></div>
      <div class="stepper sm dark"><button data-act="goal" data-d="-1" aria-label="Lower weekly goal">${ic('minus')}</button><b class="num">${S.goal}</b><button data-act="goal" data-d="1" aria-label="Raise weekly goal">${ic('plus')}</button></div></div>
  </div>`;
}
function freezeSheet() {
  const cw = curWeek(), n = streakWeeks();
  sheet(`${head('Streak freezes', 'Protect your streak when life gets in the way')}
    <div class="frz-hero"><div class="frz-slots">${Array.from({ length: MAX_FREEZES }, (_, i) => `<span class="${i < S.freezes ? 'full' : ''}">${snowSVG(26)}</span>`).join('')}</div><b class="num">${S.freezes} of ${MAX_FREEZES}</b><span>freezes ready</span></div>
    <div class="lrows">${rowHTML({ icon: 'shield-check', c: '#3B8BD4', title: 'Saves a week you can’t play', sub: 'Your streak carries on without adding a week' })}
      ${rowHTML({ icon: 'timer', c: '#3B8BD4', title: 'Used for you if you forget', sub: 'If the week ends before you hit your goal, a freeze is used automatically' })}
      ${rowHTML({ icon: 'flame', c: '#E2621D', title: `Earn one every ${FREEZE_EVERY} weeks in a row`, sub: `Hold up to ${MAX_FREEZES}. Hit your goal in a frozen week and you get it back.` })}</div>
    ${cw === 1 ? '<div class="okbox">' + ic('circle-check') + '<div><b>You’ve hit this week’s goal</b><br>No freeze needed.</div></div>'
      : cw === 2 ? `<button class="pill block soft" data-act="unfreeze">Cancel this week’s freeze</button>`
      : `<button class="pill block" data-act="useFreeze" ${S.freezes ? '' : 'disabled'}>${snowSVG(18)}${S.freezes ? 'Freeze this week' : 'No freezes left'}</button>`}
    <div class="demo-box"><div><b>Demo: end this week now</b><small>See what happens to a ${n}-week streak with ${S.week} of ${S.goal} games${cw === 2 ? ' and a freeze on' : ''}.</small></div><button class="pill sm soft" data-act="endWeek">End week</button></div>`);
}
/* What happens when a week closes: kept by the goal, saved by a freeze, or broken. */
function endWeek() {
  const before = streakWeeks(), last = S.streak.length - 1, cw = S.streak[last], played = S.week;
  let result;
  if (cw === 1) { result = 'kept'; S.xp += 30; }
  else if (cw === 2) result = 'frozen';
  else if (S.freezes > 0) { S.freezes--; S.streak[last] = 2; result = 'auto'; }
  else { S.streak[last] = 0; result = 'broken'; }
  const after = streakWeeks();
  let earned = false;
  if (result === 'kept' && after > 0 && after % FREEZE_EVERY === 0 && S.freezes < MAX_FREEZES) { S.freezes++; earned = true; }
  S.bestStreak = Math.max(S.bestStreak || 0, bestStreak());
  S.streak = S.streak.concat(0).slice(-8); S.week = 0; save();
  const nb = badgeCheck(true);
  const art = result === 'kept' ? flameSVG(110) : result === 'broken' ? flameSVG(110, false) : `<span class="frz-big">${snowSVG(64)}</span>`;
  const title = { kept: `${after}-week streak!`, frozen: 'Streak frozen, not broken', auto: 'A freeze saved your streak', broken: 'Streak lost' }[result];
  const body = { kept: `You hit your goal. +30 XP.${earned ? ' You also earned a streak freeze.' : ''}`, frozen: `Last week was protected by the freeze you set. You’re still on ${after} weeks.`,
    auto: `You played ${played} of ${S.goal} games, so a freeze was used automatically. Still ${after} weeks. ${S.freezes} freeze${S.freezes === 1 ? '' : 's'} left.`,
    broken: `You played ${played} of ${S.goal} games with no freeze left, so the ${before}-week streak ends. Start a new one this week.` }[result];
  sheet(`<div class="xp-burst week-end ${result}">${art}<h2>${title}</h2><div class="muted">${body}</div></div>
    ${earned ? `<div class="okbox frz-earned">${snowSVG(22)}<div><b>Streak freeze earned</b><br>You now have ${S.freezes} of ${MAX_FREEZES}.</div></div>` : ''}
    ${unlockedRowHTML(nb)}
    <div class="faint" style="font-size:13px;text-align:center">A new week has started: 0 of ${S.goal} games.</div>
    <button class="pill block" data-act="close">${result === 'broken' ? 'Find a game' : 'Keep it going'}</button>`);
  if (result === 'kept' && !REDUCED) confetti('#FFB13B');
  if (tab === 'me') renderMe(); if (tab === 'play') renderPlay();
}

/* ── Badge grid and detail ── */
/* Earned badges first (rarest first), then the closest to being earned. */
const TIER_RANK = { epic: 4, gold: 3, silver: 2, bronze: 1 };
function badgeOrder() {
  return BADGES.map((b, k) => { const [c, g] = b.prog(); return { b, k, on: c >= g, p: c / g }; })
    .sort((x, y) => (y.on - x.on) || (x.on ? TIER_RANK[y.b.tier] - TIER_RANK[x.b.tier] : y.p - x.p));
}
const badgeCard = ({ b, k, on }) => { const [c, g] = b.prog(), [n1] = NEON[b.tier];
  return `<button class="bcard ${on ? 'on' : ''}" style="--n:${n1}" data-act="badge" data-i="${k}" aria-label="${esc(b.name)}: ${on ? TIERS[b.tier].name + ' badge earned' : `${c} of ${g}, not yet earned`}">${badgeSVG(b, on, 76)}<b>${esc(b.name)}</b>${on ? `<span class="ntier">${TIERS[b.tier].name}</span>` : `<span class="nprog"><i style="width:${Math.round((c / g) * 100)}%"></i></span><small class="num">${c}/${g}</small>`}</button>`; };
function badgesHTML() {
  const got = BADGES.filter(badgeEarned).length;
  return `<div class="section"><div class="shead"><h2>Badges <span class="faint num" style="font:700 13px var(--f-body)">${got} of ${BADGES.length}</span></h2><button class="pill sm soft" data-act="badgesAll">See all</button></div>
    <div class="brail" role="list">${badgeOrder().map(badgeCard).join('')}</div></div>`;
}
function badgesAllSheet() {
  const got = BADGES.filter(badgeEarned).length;
  sheet(`${head('Badges', `${got} of ${BADGES.length} earned · ${BADGES.filter(badgeEarned).reduce((n, b) => n + TIERS[b.tier].xp, 0)} XP from badges`)}
    <div class="ball">${badgeOrder().map(badgeCard).join('')}</div>`);
}
function badgeSheet(b, unlocked) {
  const on = badgeEarned(b), [c, g] = b.prog(), T = TIERS[b.tier], [n1] = NEON[b.tier];
  const at = (S.badgeAt || {})[b.id];
  sheet(`${unlocked ? '' : head('', '')}
    <div class="bhero ${on ? 't-' + b.tier : ''} ${unlocked ? 'unlock' : ''}"><div class="bstage ${on ? 'on' : ''}" style="--n:${n1}">${unlocked ? '<span class="eyebrow">Badge unlocked</span>' : ''}${badgeSVG(b, on, 156)}<h2>${esc(b.name)}</h2><span class="ntier">${T.name}</span>
      <div class="bmeta"><div><b class="num">${c}/${g}</b><small>Progress</small></div><div><b class="num">+${T.xp}</b><small>XP</small></div><div><b class="num">${on && at ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(at) : '–'}</b><small>${on ? 'Earned' : 'Not yet'}</small></div></div></div><div class="muted">${esc(b.how)}</div>
      ${on ? '' : `<div class="bbar"><span class="bprog lg"><i style="width:${Math.round((c / g) * 100)}%"></i></span><b class="num">${c} / ${g}</b></div>`}</div>
    ${on ? `<button class="pill block" data-act="shareBadge" data-id="${b.id}">${ic('share-2')}Share your badge</button><button class="pill block soft" data-act="close">Nice</button>`
      : `<button class="pill block" data-act="${b.cta[0]}" data-id="${b.cta[1]}">${esc(b.cta[2])}</button>`}`);
  if (unlocked && !REDUCED) { confetti(T.hi); buzz(30); }
}
/* Badges earned since last time pay out XP and get a moment of their own. */
function badgeCheck(inline) {
  S.badgeAt = S.badgeAt || {};
  if (!S.badges) { S.badges = BADGES.filter(badgeEarned).map((b) => b.id); S.badges.forEach((id) => { S.badgeAt[id] = S.badgeAt[id] || Date.now(); }); save(); return []; }
  const newly = BADGES.filter((b) => badgeEarned(b) && !S.badges.includes(b.id));
  if (!newly.length) return [];
  newly.forEach((b) => { S.badges.push(b.id); S.badgeAt[b.id] = Date.now(); S.xp += TIERS[b.tier].xp; }); save();
  if (!inline) setTimeout(() => { if (!$('.sheet')) badgeSheet(newly[0], true); else toast(`Badge unlocked: ${newly[0].name}`, 'award'); }, 1400);
  return newly;
}
const unlockedRowHTML = (list) => (list.length ? `<div class="unlocked">${list.map((b) => `<button class="lrow" data-act="badgeId" data-id="${b.id}">${badgeSVG(b, true, 52)}<span class="ltext"><small class="eyebrow">Badge unlocked</small><b>${esc(b.name)}</b><small>${TIERS[b.tier].name} · +${TIERS[b.tier].xp} XP</small></span>${ic('chevron-right')}</button>`).join('')}</div>` : '');

Object.assign(A, {
  freezeSheet: () => freezeSheet(),
  useFreeze: () => { if (!S.freezes || curWeek()) return; S.freezes--; S.streak[S.streak.length - 1] = 2; save(); buzz(15); freezeSheet(); renderMe(); toast('This week is frozen. Your streak is safe', 'shield-check'); },
  unfreeze: () => { if (curWeek() !== 2) return; S.freezes = Math.min(MAX_FREEZES, S.freezes + 1); S.streak[S.streak.length - 1] = 0; save(); freezeSheet(); renderMe(); toast('Freeze cancelled and returned', 'rotate-ccw'); },
  endWeek: () => endWeek(),
  badge: (el) => badgeSheet(BADGES[+el.dataset.i]),
  badgesAll: () => badgesAllSheet(),
  badgeId: (el) => badgeSheet(BADGES.find((b) => b.id === el.dataset.id), true),
  shareBadge: (el) => { const b = BADGES.find((x) => x.id === el.dataset.id); shareAny(`${b.name} badge`, `I just earned the ${TIERS[b.tier].name.toLowerCase()} ${b.name} badge on LetsPlay. ${b.how}. Come play:`, 'https://letsplay.app/b/' + b.id); },
});
badgeCheck();
