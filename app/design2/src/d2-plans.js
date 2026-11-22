/* ═════ PLANS: Lite, Pro, Corporate · billing · shared helpers ═════
   Locked features stay visible and lead to an upgrade sheet, so people can see what a plan adds. */

/* What Lite and Pro offer in this design (Design 1 keeps its own lists). */
PLANS.lite.feats = ['Live map of nearby sports', 'Join games and events', 'One team: cricket, football, volleyball, cycling, badminton or tennis', 'Host one game at a time, then edit or delete it', 'Add grounds and play zones with photos and an address', 'Family profiles and calendar', 'Marketplace and deals'];
PLANS.lite.no = ['More teams and every sport', 'Host more than one game, custom sports', 'Company workspace'];
PLANS.pro.feats = ['Everything in Lite', 'Unlimited teams in every sport', 'Host as many games as you like', 'Custom sports and indoor games', 'Add players nearest first and invite to any app', '10% off in the marketplace'];
PLANS.pro.no = ['Company workspace'];

/* Shared helpers used by the plan modules */
const UPI_APPS = ['GPay', 'PhonePe', 'Paytm', 'BHIM'];
const pad2 = (n) => String(n).padStart(2, '0');
const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const fromMin = (m) => pad2(Math.floor(m / 60) % 24) + ':' + pad2(m % 60);
const famById = (id) => FAMILY.find((f) => f.id === id) || (S.family || []).find((f) => f.id === id);
const family = () => FAMILY.concat(S.family || []);
const firstName = (id) => { const f = famById(id); return f ? f.name.split(' ')[0] : 'You'; };
const longFmt = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const upiChips = (group) => `<div class="chips" id="${group}">${UPI_APPS.map((u) => `<button type="button" class="chip neutral" data-act="pickOne" data-group="${group}" data-id="${u}" aria-pressed="${u === S.payApp}">${ic('smartphone')}${u}</button>`).join('')}</div>`;
const pickedUpi = (group) => { const b = $(`#${group} [aria-pressed="true"]`); return b ? b.dataset.id : 'UPI'; };
/* A list row used across the plan screens: tinted icon tile, two lines, optional trailing bit. */
const rowHTML = (o) => `<${o.act ? 'button' : 'div'} class="lrow" ${o.act ? `data-act="${o.act}" ${o.id != null ? `data-id="${esc(o.id)}"` : ''}` : ''} ${o.pressed != null ? `aria-pressed="${o.pressed}"` : ''} ${o.c ? `style="--c:${o.c}"` : ''}>
  <span class="ltile">${o.lead || ic(o.icon || 'circle-check')}</span><span class="ltext"><b>${o.title}</b>${o.sub ? `<small>${o.sub}</small>` : ''}</span>${o.end != null ? o.end : (o.act ? ic('chevron-right') : '')}</${o.act ? 'button' : 'div'}>`;

/* Share to any app: the phone's own share sheet when available, otherwise app links and copy. */
async function shareAny(title, text, url) {
  if (navigator.share) { try { await navigator.share({ title, text, url }); toast('Shared', 'share-2'); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
  const full = `${text} ${url}`, enc = encodeURIComponent;
  const apps = [['WhatsApp', '#1DA851', 'message-circle', `https://wa.me/?text=${enc(full)}`], ['Telegram', '#1C8ECC', 'send', `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`],
    ['SMS', '#13A04B', 'smartphone', `sms:?&body=${enc(full)}`], ['Email', '#D2581A', 'send', `mailto:?subject=${enc(title)}&body=${enc(full)}`],
    ['Facebook', '#1877F2', 'globe', `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`], ['X', '#15161A', 'share-2', `https://twitter.com/intent/tweet?text=${enc(full)}`]];
  sheet(`${head('Share', esc(title))}
    <div class="share-grid">${apps.map(([n, c, i, href]) => `<a class="share-app" href="${href}" target="_blank" rel="noopener" style="--c:${c}"><span>${ic(i)}</span>${n}</a>`).join('')}
      <button class="share-app" data-act="copyShare" style="--c:var(--ink-2)"><span>${ic('copy')}</span>Copy</button></div>
    <div class="copybox" id="shareTxt">${esc(full)}</div>
    <div class="faint" style="font-size:12.5px">On a phone, the installed app opens your phone’s share menu so you can send it to any app.</div>`);
}

/* ── Billing: yearly is 12 months less 20%. Example prices for the prototype. ── */
let billView = null;   /* the period the plans sheet is showing */
function renewDate(period) { const d = new Date(); if (period === 'yearly') d.setFullYear(d.getFullYear() + 1); else d.setMonth(d.getMonth() + 1); return d.getTime(); }
function planPrice(k, period) {
  const P = PLANS[k]; if (!P.monthly) return { amount: 0, label: 'Free', per: '', note: 'Always free' };
  const unit = P.perSeat ? '/employee' : '';
  if (period === 'yearly') { const y = yearlyPrice(P.monthly), full = P.monthly * 12; return { amount: y, label: inr(y), per: `${unit}/year`, full, save: full - y, note: `${inr(Math.floor(y / 12))}${unit}/month, billed yearly` }; }
  return { amount: P.monthly, label: inr(P.monthly), per: `${unit}/month`, note: 'Billed monthly, cancel any time' };
}
const billSeg = (act, view) => `<div class="seg" role="group" aria-label="Billing period"><button data-act="${act}" data-id="monthly" aria-pressed="${view === 'monthly'}">Monthly</button><button data-act="${act}" data-id="yearly" aria-pressed="${view === 'yearly'}">Yearly <span class="save-tag">−20%</span></button></div>`;
function planSummary() {
  if (S.tier === 'lite') return 'Free plan';
  const pr = planPrice(S.tier, S.billing), seats = PLANS[S.tier].perSeat ? ` · ${S.seats} employees` : '';
  return `${S.billing === 'yearly' ? 'Yearly' : 'Monthly'} · ${pr.label}${pr.per}${seats}${S.renews ? ` · renews ${dateFmt.format(S.renews)}` : ''}`;
}

function setTier(t) {
  S.tier = t; save(); closeSheet(); renderNote(); renderTabbar();
  if (tab === 'play') renderPlay(); else go(tab);
}
function plansSheet() {
  const view = billView || (S.tier === 'lite' ? 'yearly' : S.billing);
  sheet(`${head('Choose your plan', 'Example pricing for the prototype')}
    ${billSeg('billView', view)}
    <div class="plans">${Object.keys(PLANS).map((k) => { const P = PLANS[k], pr = planPrice(k, view), cur = S.tier === k && (k === 'lite' || S.billing === view);
      return `<button class="plan t-${k}" data-act="choosePlan" data-id="${k}" aria-pressed="${S.tier === k}">
        <span class="plan-top"><span class="tierword t-${k}">${ic(P.icon)}${P.name}</span>${cur ? '<span class="cur">Current</span>' : ''}</span>
        <span class="plan-price"><b class="num">${pr.label}</b><small>${pr.per}</small></span>
        ${pr.full ? `<span class="plan-save"><s class="num">${inr(pr.full)}</s><span class="save-tag num">Save ${inr(pr.save)}</span></span>` : ''}
        <span class="faint" style="font-size:13px">${pr.note}</span>
        <span class="muted" style="font-size:14px">${P.blurb}</span>
        <ul class="feats">${P.feats.map((f) => `<li>${ic('circle-check')}${f}</li>`).join('')}${P.no.map((f) => `<li class="off">${ic('lock')}${f}</li>`).join('')}</ul></button>`; }).join('')}</div>`);
}
let SUB = null;
function startCheckout(plan, period) { const P = PLANS[plan]; SUB = { plan, period: period || (S.tier === plan ? S.billing : 'yearly'), seats: P.perSeat ? Math.max(P.minSeats, S.seats) : 1 }; checkoutSheet(); }
function checkoutSheet() {
  const P = PLANS[SUB.plan], pr = planPrice(SUB.plan, SUB.period), seats = SUB.seats, total = pr.amount * seats, gross = (pr.full || pr.amount) * seats;
  const same = S.tier === SUB.plan && S.billing === SUB.period;
  sheet(`${head(P.name + ' plan', P.blurb)}
    ${billSeg('subPeriod', SUB.period)}
    ${P.perSeat ? `<div class="card" style="padding:14px;display:flex;justify-content:space-between;align-items:center;gap:10px"><div><b>Employees</b><div class="faint" style="font-size:13px">Minimum ${P.minSeats}. Add more any time.</div></div><div class="stepper"><button data-act="subSeats" data-d="-10" aria-label="10 fewer employees">${ic('minus')}</button><b class="num">${seats}</b><button data-act="subSeats" data-d="10" aria-label="10 more employees">${ic('plus')}</button></div></div>` : ''}
    <div class="sum card">
      <div><span class="muted">${P.name}${P.perSeat ? ` · ${seats} × ${inr(pr.full || pr.amount)}` : ''} · ${SUB.period === 'yearly' ? '12 months' : '1 month'}</span><span class="num">${inr(gross)}</span></div>
      ${SUB.period === 'yearly' ? `<div class="ok"><span>Yearly discount (20%)</span><span class="num">− ${inr(gross - total)}</span></div>` : ''}
      <div class="total"><span>Due today</span><span class="num">${inr(total)}</span></div>
      <div class="faint"><span>${SUB.period === 'yearly' ? 'Renews' : 'Next payment'} on ${dateFmt.format(renewDate(SUB.period))}</span><span class="num">${inr(total)}</span></div></div>
    ${SUB.period === 'monthly' ? rowHTML({ act: 'subPeriod', id: 'yearly', icon: 'percent', title: `Pay yearly and save ${inr((P.monthly * 12 - yearlyPrice(P.monthly)) * seats)}`, sub: `${inr(yearlyPrice(P.monthly) * seats)} a year instead of ${inr(P.monthly * 12 * seats)}` }) : ''}
    <div style="display:grid;gap:8px"><b style="font-size:14px">${SUB.period === 'monthly' ? 'Pay with UPI AutoPay' : 'Pay once with UPI'}</b>${upiChips('subApp')}
      <div class="faint" style="font-size:12.5px">${SUB.period === 'monthly' ? `You approve a monthly AutoPay mandate of ${inr(total)} in your UPI app. Cancel any time from Me.` : 'One payment for the year. You get a reminder 7 days before it renews.'}</div></div>
    <button class="pill block" style="min-height:56px" data-act="subPay" id="subGo" ${same ? 'disabled' : ''}>${same ? 'This is your current plan' : `${ic('smartphone')}Pay ${inr(total)} via UPI`}</button>`);
}
/* What a locked feature needs, and what the plan adds. */
const UPSELL = {
  pin: ['pro', 'megaphone', 'Host games and add your own sports with Pro', 'Host games at any address, and add sports like carrom or table tennis with their own icon.'],
  host: ['pro', 'megaphone', 'Host more games with Pro', 'Lite hosts one game at a time. Pro hosts as many as you like, in every sport, including your own custom sports.'],
  teams: ['pro', 'users', 'Build your team with Pro', 'Create teams, add players near you, run match day with availability, lineups and team chat.'],
  org: ['corporate', 'trophy', 'Run sport across your company', 'Department teams, a league with live standings, a schedule builder and a tournament organizer that builds brackets for you.'],
};
function upsell(kind) {
  const [plan, icon, title, body] = UPSELL[kind], P = PLANS[plan], y = yearlyPrice(P.monthly);
  sheet(`<div class="up-hero t-${plan}"><span class="up-ic">${ic(icon)}</span><h2>${title}</h2><div>${body}</div></div>
    <ul class="feats">${P.feats.slice(1, 6).map((f) => `<li>${ic('circle-check')}${f}</li>`).join('')}</ul>
    <button class="pill block" style="min-height:56px" data-act="subscribe" data-id="${plan}" data-period="yearly">Get ${P.name} · ${inr(Math.floor(y / 12))}${P.perSeat ? '/employee' : ''}/month, billed yearly</button>
    <button class="pill block soft" data-act="subscribe" data-id="${plan}" data-period="monthly">Or ${inr(P.monthly)}${P.perSeat ? '/employee' : ''} monthly</button>
    <button class="pill block soft" data-act="plans">Compare all plans</button>`);
}
function planCardHTML() {
  const P = PLANS[S.tier];
  return `<div class="section"><h2>Plan</h2><div class="plan-row t-${S.tier}"><span class="ltile" style="--c:var(--tc)">${ic(P.icon)}</span><span class="ltext"><b>${P.name} plan</b><small class="num">${planSummary()}</small></span><button class="pill sm ${S.tier === 'lite' ? '' : 'soft'}" data-act="plans">${S.tier === 'lite' ? 'Upgrade' : 'Manage'}</button></div>
    ${S.tier !== 'lite' && S.billing === 'monthly' ? `<button class="linkbtn" data-act="subscribe" data-id="${S.tier}" data-period="yearly">${ic('percent')} Switch to yearly and save 20%</button>` : ''}</div>`;
}

/* ── Desktop side note: plan switcher and things to try ── */
const TRY = {
  lite: ['Map pin button → Host a game (one at a time on Lite), then edit or delete it in Games → Hosting', 'Team → Create a team (one on Lite), then edit or delete it', 'Map pin button → Add a ground or play zone with photos and an address', 'Tap + on a game: step-by-step registration with family members'],
  pro: ['Map pin button → Add a place: snap a photo of a new court', 'Map pin button → Host a game at any address', 'Team → Create a team → add players nearest first and share'],
  corporate: ['Company → People → Import sheet → try the sample sheet', 'Teams: approve Night Owls FC, or switch to Employee and register a team', 'Events → Tournaments → create and publish, then check the bell as an employee'],
};
function renderNote() {
  const t = $('#noteTier'); if (t) t.innerHTML = Object.keys(PLANS).map((k) => `<button data-act="setTier" data-id="${k}" aria-pressed="${S.tier === k}">${PLANS[k].name}</button>`).join('');
  const l = $('#noteTry'); if (l) l.innerHTML = TRY[S.tier].map((x) => `<li>${x}</li>`).join('');
}
function applyPrefs() { app.classList.toggle('big-text', !!S.bigText); }

Object.assign(A, {
  setTier: (el) => { setTier(el.dataset.id); toast(`Previewing ${PLANS[el.dataset.id].name}`, PLANS[el.dataset.id].icon); },
  plans: () => { billView = null; plansSheet(); },
  billView: (el) => { billView = el.dataset.id; plansSheet(); },
  choosePlan: (el) => { const k = el.dataset.id, view = billView || (S.tier === 'lite' ? 'yearly' : S.billing);
    if (k === 'lite') { if (S.tier === 'lite') { toast('You’re on Lite', 'compass'); return; } S.billing = 'monthly'; S.renews = null; setTier('lite'); toast('Switched to Lite', 'compass'); return; }
    startCheckout(k, view); },
  subscribe: (el) => startCheckout(el.dataset.id, el.dataset.period),
  subPeriod: (el) => { SUB.period = el.dataset.id; checkoutSheet(); },
  subSeats: (el) => { const P = PLANS[SUB.plan]; SUB.seats = Math.max(P.minSeats, Math.min(5000, SUB.seats + +el.dataset.d)); checkoutSheet(); },
  subPay: () => { const b = $('#subGo'); b.disabled = true; b.innerHTML = `${ic('smartphone')}Waiting for ${pickedUpi('subApp')}…`;
    setTimeout(() => {
      const P = PLANS[SUB.plan], pr = planPrice(SUB.plan, SUB.period), total = pr.amount * SUB.seats, plan = SUB.plan, period = SUB.period;
      S.billing = period; S.renews = renewDate(period); if (P.perSeat) S.seats = SUB.seats; SUB = null; setTier(plan); buzz(30); confetti('#5B3FE6');
      sheet(`<div class="xp-burst"><span class="up-ic t-${plan}">${ic(P.icon)}</span><h2>You’re on ${P.name}</h2><div class="muted">${period === 'yearly' ? 'Yearly' : 'Monthly'} plan · paid ${inr(total)}<br>${period === 'yearly' ? 'Renews' : 'Next payment'} on ${dateFmt.format(S.renews)}</div></div>
        <ul class="feats card" style="padding:14px">${P.feats.slice(1, 5).map((f) => `<li>${ic('circle-check')}${f}</li>`).join('')}</ul>
        ${unlockedRowHTML(badgeCheck(true))}
        <button class="pill block" data-act="close">Start using ${P.name}</button>`);
    }, 1100); },
  pickOne: (el) => { $$(`#${el.dataset.group} [aria-pressed]`).forEach((b) => b.setAttribute('aria-pressed', b === el)); if (el.dataset.group !== 'regApp' && el.dataset.group !== 'subApp' && el.dataset.group !== 'cartApp') return; S.payApp = el.dataset.id; save(); },
  copyShare: () => { const txt = $('#shareTxt').textContent; const sel = () => { const r = document.createRange(); r.selectNodeContents($('#shareTxt')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast('Selected. Copy it from the menu', 'copy'); };
    try { navigator.clipboard.writeText(txt).then(() => toast('Copied. Paste it into any app', 'copy'), sel); } catch (e) { sel(); } },
  shareGame: (el) => { const a = actById(el.dataset.id); shareAny(a.title, `${a.title} · ${when(a)} at ${a.venue}. ${spotsLeft(a)} spots left, ${money(a.price)}. Join me on Splayer:`, 'https://splayer.app/g/' + a.id); },
});
