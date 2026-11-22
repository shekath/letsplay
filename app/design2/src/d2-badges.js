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
function badgeSVG(b, earned, px) {
  const T = earned ? TIERS[b.tier] : null, u = 'bg' + (++badgeUid);
  const c = T ? { hi: T.hi, lo: T.lo, rim: T.rim, core: T.core, r1: T.rib[0], r2: T.rib[1], g: '#fff' }
    : { hi: 'var(--lk-hi)', lo: 'var(--lk-lo)', rim: 'var(--lk-rim)', core: 'var(--lk-core)', r1: 'var(--lk-lo)', r2: 'var(--lk-rim)', g: 'var(--lk-glyph)' };
  const glyph = GLYPHS[b.glyph] || ICONS[b.glyph] || ICONS.award;
  const ribbon = b.shape !== 'shield' ? `<path d="M34 62 L46 66 L42 97 L35 89 L27 95 Z" style="fill:${c.r1}"/><path d="M66 62 L54 66 L58 97 L65 89 L73 95 Z" style="fill:${c.r2}"/>` : '';
  const sparkle = earned && b.tier === 'epic' ? ['M86 12 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z', 'M12 22 l1.5 4.5 4.5 1.5 -4.5 1.5 -1.5 4.5 -1.5 -4.5 -4.5 -1.5 4.5 -1.5z', 'M90 70 l1.2 3.6 3.6 1.2 -3.6 1.2 -1.2 3.6 -1.2 -3.6 -3.6 -1.2 3.6 -1.2z'].map((d) => `<path class="spark" d="${d}" fill="#FFE9A3"/>`).join('') : '';
  return `<svg class="bart ${earned ? 'on t-' + b.tier : 'off'}" width="${px}" height="${px}" viewBox="0 0 100 100" aria-hidden="true">
    <defs><linearGradient id="${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:${c.hi}"/><stop offset="1" style="stop-color:${c.lo}"/></linearGradient>
      <linearGradient id="${u}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${c.lo}"/><stop offset="1" style="stop-color:${c.rim}"/></linearGradient></defs>
    ${ribbon}
    ${shapeEl(b.shape, 1)} fill="url(#${u}r)"/>
    ${shapeEl(b.shape, 0.86)} fill="url(#${u})"/>
    ${shapeEl(b.shape, 0.76)} fill="none" style="stroke:${c.rim}" stroke-opacity=".35" stroke-width="1.5"/>
    <circle cx="50" cy="46" r="18" style="fill:${c.core}" stroke="#fff" stroke-opacity=".28" stroke-width="2"/>
    <g transform="translate(35.6 31.6) scale(1.2)" fill="none" style="stroke:${c.g}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${glyph}</g>
    ${earned ? '<path d="M24 30 C30 16 44 10 58 12 C46 16 34 22 28 34 Z" fill="#fff" opacity=".42"/>' : ''}
    ${sparkle}
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
function streakCardHTML() {
  const n = streakWeeks(), left = Math.max(0, S.goal - S.week), last = S.streak.length - 1, cw = curWeek();
  const miles = [[3, 'hattrick'], [5, null], [8, 'iron'], [12, null]];
  const next = miles.find(([w]) => w > n), toFreeze = FREEZE_EVERY - (n % FREEZE_EVERY);
  const msg = cw === 1 ? '<b>Goal hit this week.</b> Your streak is safe.'
    : cw === 2 ? `<b>This week is frozen.</b> Your streak is safe even if you can’t play. Hit your goal anyway and you get the freeze back.`
    : `Play <b>${left} more game${left > 1 ? 's' : ''}</b> this week to keep your streak alive.${S.freezes ? ' If you can’t, a freeze saves it.' : ''}`;
  return `<div class="section streak-card">
    <div class="sc-top">${flameSVG(84, n > 0)}<div class="sc-num"><b class="num">${n}</b><span>week streak</span></div><div class="sc-best"><small>Best</small><b class="num">${bestStreak()}</b></div></div>
    <div class="sc-msg">${msg}</div>
    <div class="chain" aria-label="Your last ${S.streak.length} weeks">${S.streak.map((v, i) => { const now = i === last, pct = Math.min(1, S.week / S.goal), st = v === 1 ? 'hit' : v === 2 ? 'ice' : 'miss';
      return `<div class="link ${st} ${now ? 'now' : ''}" title="${now ? 'This week' : `${last - i} weeks ago`}: ${{ hit: 'goal hit', ice: 'frozen', miss: now ? 'in progress' : 'missed' }[st]}"><span class="node">${now && v !== 1 ? `<svg viewBox="0 0 36 36" class="ringp"><circle cx="18" cy="18" r="15" class="tr"/><circle cx="18" cy="18" r="15" class="vl" stroke-dasharray="${(94.2 * pct).toFixed(1)} 94.2"/></svg>` : ''}${v === 1 ? flameSVG(22) : v === 2 ? snowSVG(18) : now ? flameSVG(18, false) : '<i></i>'}</span><small>${now ? 'Now' : `${last - i}w`}</small></div>`; }).join('')}</div>
    <div class="miles">${miles.map(([w, id]) => { const b = id && BADGES.find((x) => x.id === id), done = n >= w; return `<div class="mile ${done ? 'done' : ''}">${b ? badgeSVG(b, done, 34) : `<span class="xpmile">+${w * 20}</span>`}<small class="num">${w} wk</small></div>`; }).join('')}</div>
    <div class="sc-foot"><button class="freeze" data-act="freezeSheet" aria-label="${S.freezes} streak freeze${S.freezes === 1 ? '' : 's'}. Manage">${snowSVG(15)}<span class="num">${S.freezes}</span> freeze${S.freezes === 1 ? '' : 's'}${cw === 2 ? ' · on' : ''}</button><span>${next ? `Next: ${next[0]} weeks${next[1] ? ' · ' + BADGES.find((x) => x.id === next[1]).name : ` · +${next[0] * 20} XP`}` : 'Every milestone reached'}</span></div>
    ${S.freezes < MAX_FREEZES ? `<div class="sc-earn">${snowSVG(13)}Next freeze in ${toFreeze} week${toFreeze === 1 ? '' : 's'} of streak</div>` : ''}
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
function badgesHTML() {
  const got = BADGES.filter(badgeEarned).length;
  return `<div class="section"><div style="display:flex;justify-content:space-between;align-items:baseline"><h2>Badges</h2><span class="faint num" style="font-weight:700;font-size:13px">${got} of ${BADGES.length} earned</span></div>
    <div class="bgrid">${BADGES.map((b, k) => { const on = badgeEarned(b), [c, g] = b.prog();
      return `<button class="bdg ${on ? 'on' : ''}" data-act="badge" data-i="${k}" aria-label="${esc(b.name)}: ${on ? TIERS[b.tier].name + ' badge earned' : `${c} of ${g}, not yet earned`}">${badgeSVG(b, on, 78)}<b>${esc(b.name)}</b>${on ? `<span class="tier-lbl t-${b.tier}">${TIERS[b.tier].name}</span>` : `<span class="bprog"><i style="width:${Math.round((c / g) * 100)}%"></i></span><small class="num">${c}/${g}</small>`}</button>`; }).join('')}</div></div>`;
}
function badgeSheet(b, unlocked) {
  const on = badgeEarned(b), [c, g] = b.prog(), T = TIERS[b.tier];
  sheet(`${unlocked ? '' : head('', '')}
    <div class="bhero ${on ? 't-' + b.tier : ''} ${unlocked ? 'unlock' : ''}">${unlocked ? '<span class="eyebrow">Badge unlocked</span>' : ''}${badgeSVG(b, on, 168)}<h2>${esc(b.name)}</h2><span class="tier-lbl t-${b.tier}">${T.name} · +${T.xp} XP</span><div class="muted">${esc(b.how)}</div>
      ${on ? '' : `<div class="bbar"><span class="bprog lg"><i style="width:${Math.round((c / g) * 100)}%"></i></span><b class="num">${c} / ${g}</b></div>`}</div>
    ${on ? `<button class="pill block" data-act="shareBadge" data-id="${b.id}">${ic('share-2')}Share your badge</button><button class="pill block soft" data-act="close">Nice</button>`
      : `<button class="pill block" data-act="${b.cta[0]}" data-id="${b.cta[1]}">${esc(b.cta[2])}</button>`}`);
  if (unlocked && !REDUCED) { confetti(T.hi); buzz(30); }
}
/* Badges earned since last time pay out XP and get a moment of their own. */
function badgeCheck(inline) {
  if (!S.badges) { S.badges = BADGES.filter(badgeEarned).map((b) => b.id); save(); return []; }
  const newly = BADGES.filter((b) => badgeEarned(b) && !S.badges.includes(b.id));
  if (!newly.length) return [];
  newly.forEach((b) => { S.badges.push(b.id); S.xp += TIERS[b.tier].xp; }); save();
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
  badgeId: (el) => badgeSheet(BADGES.find((b) => b.id === el.dataset.id), true),
  shareBadge: (el) => { const b = BADGES.find((x) => x.id === el.dataset.id); shareAny(`${b.name} badge`, `I just earned the ${TIERS[b.tier].name.toLowerCase()} ${b.name} badge on LetsPlay. ${b.how}. Come play:`, 'https://letsplay.app/b/' + b.id); },
});
badgeCheck();
