# LetsPlay: community sports app prototype

LetsPlay is a working, clickable prototype of a mobile app for discovering, joining and organising local indoor and outdoor sport. It is built mobile-first for iOS and Android and localised for India: prices in rupees (₹, Indian number formatting), UPI payments, Indian names and places, and cricket and kabaddi alongside other sports. The live map opens first, so nearby games are always one tap away.

The prototype covers the participation loop from the UX strategy (**Discover → Join → Schedule → Participate**), the three product tiers, and the marketplace.

## Run it

```bash
python3 -m http.server 8080 --directory app
```

Then open `http://localhost:8080` on a desktop browser (it shows a device frame and a plan switcher) or on a phone on the same network. On a phone you get the full-screen app. Use **Add to Home Screen** (iOS Safari) or **Install app** (Android Chrome) to run it like a native app.

**Dark version:** Profile → Appearance (Light, Dark or Match my phone), or the Appearance switch on the desktop panel.

## Design 2: Playground

A second, engagement-first direction at `http://localhost:8080/design2.html`, built on the same data:

- **Play:** a list of games in a bottom sheet over the live map (drag or tap to expand). Each game is a clean row: the game name, then day and time in bold with the distance as a map-pin chip, then price, spots left and venue. Tap a game to move the map to its pin and open details; tap a pin to highlight its card; tap + to join. Full games say so instead of offering to join. Zoom with the + and − buttons, pinch or the scroll wheel; pins keep the same size at every zoom, and the locate button re-centres on you.
- **Starting soon:** story rings for games today and tomorrow; a full-screen viewer that advances every 5 seconds (hold to pause, tap the sides to move; manual when reduced motion is on).
- **Progress:** joining earns XP with a short celebration, levels with titles, a weekly goal ring you can adjust, a streak chart and earnable badges.
- **Book:** pick a court from a photo carousel and drag a time window along the day. Booked hours are striped, peak hours tinted, clashes turn the window red. A slider splits the cost live.
- **Squad:** pick a player and tap a fielding position on a cricket field, vote in the availability poll, send quick chat messages.
- **Look:** Kanit bold italic for titles, scores and numbers (athletic, scoreboard feel) with Manrope for reading, a neutral base where each card takes its sport colour, violet only for your progress, a floating pill tab bar, and light and dark themes.

Source: `app/design2/src` (shell, `d2.css`, `d2.js`); `scripts/build.py` bundles it with the shared `data.js` and `icons.js`.

## Plans (tiers)

| Capability | Lite | Pro | Enterprise |
| --- | :---: | :---: | :---: |
| Live map of nearby sports, filters, search | ✓ | ✓ | ✓ |
| Join games, family profiles, payment, My games calendar | ✓ | ✓ | ✓ |
| Marketplace (equipment, footwear, outfits, deals) | ✓ | ✓ (10% off) | ✓ (+ bulk team kits) |
| Pin new locations on the map | – | ✓ | ✓ |
| Take a photo of a place and save it as a new location, visible to everyone | – | ✓ | ✓ |
| Host a game at any address (map pin, current location, address search or new photo place) and publish it to invitees | – | ✓ | ✓ |
| Create teams, invite players (link, code, nearby, contacts) | – | ✓ | ✓ |
| Host games, schedule matches, availability | – | ✓ | ✓ |
| Company league: department teams, schedule builder, leaderboards, participation insights | – | – | ✓ |
| Tournament organizer: auto-generated groups, seeded brackets, byes and full match schedule; winners advance to semifinals and final automatically | – | – | ✓ |

### Billing

Every paid plan can be paid monthly or yearly. Yearly is 12 months less 20%.

| Plan | Monthly | Yearly (20% off) |
| --- | --- | --- |
| Lite | Free | Free |
| Pro | ₹199/month | ₹1,910/year (instead of ₹2,388, about ₹159/month) |
| Enterprise | ₹149 per employee/month | ₹1,430 per employee/year (instead of ₹1,788), minimum 20 employees |

Choosing a plan opens a checkout with a Monthly/Yearly switch, the yearly saving shown as a line item, the renewal date, and UPI payment (AutoPay mandate for monthly, a single payment for yearly). Monthly subscribers see a "Switch to yearly, save 20%" shortcut on their plan card. All prices are **placeholders** for validation, as the pitch recommends. The plan switcher on the desktop demo panel still changes plans instantly, for demos.

Locked features stay visible to Lite users and lead to an upgrade sheet, so people can see what Pro adds.

## Upgrades from the UX strategy

- **Filters:** day, time, distance, fee, ability, age group, indoor/outdoor and step-free access, with a live "Show N games" count.
- **Step-by-step registration:** who's playing (age eligibility checked per family member), saved details and emergency contacts, consent (guardian consent for under-18s), UPI payment and confirmation. Progress bar, plain-language errors, and nothing is lost if you close the sheet or a payment fails ("Test a failed payment" demonstrates this). Full games offer a **waitlist**.
- **Family calendar:** My games → Family calendar shows everyone's games, venue bookings and team matches by day, filterable by family member, with **clash warnings** (for example two drop-offs at once) and quick fixes.
- **Notification centre:** the bell on Explore and My games. Urgent changes, actions, updates and offers, each saying what changed and what to do, with one-tap actions. Cancellations, changes and payments are always on; club news, suggestions and offers can be turned off.
- **What's next strip:** at the top of the nearby list: your next activity plus counts of changes and to-dos.
- **Coach details** on game pages, and a Pro **Match day** screen per team: availability with nudges, attendance check-in, lineup builder with captain, quick team messages, share lineup.
- **Add players (Pro):** after creating a team, or from a team's Add players button, browse every player on LetsPlay sorted nearest first and grouped by distance (within 1 km, 1–3 km, 3 km+), filter by sport, radius, name or "looking for a team", multi-select and invite. Share the team link to any app: the phone's share menu where supported, otherwise WhatsApp, Telegram, SMS, email, Facebook, X or copy. Game pages share the same way.
- **Turf and court booking:** Explore → Book venue. Pick court, date and hours (off-peak and peak pricing, booked slots shown), then pay in full or **split with players** over UPI with payment tracking and WhatsApp reminders. Pro users can post open spots as a hosted game.

## What you can try

- **Explore (home):** pan, pinch or scroll to zoom the map; tap a sport chip to filter; tap a pin for a preview card; drag the "games near you" sheet up and down; tap **Join**.
- **Join flow:** choose family members, accept the code of conduct, pay via UPI (GPay, PhonePe, Paytm, BHIM), and the game is added to **My games** with a countdown and schedule-change alerts.
- **Add place (Pro/Enterprise):** take a photo with the phone camera (or drop a pin), name it and save. The place is public, so everyone sees it on the map with its photo.
- **Host a game (Pro/Enterprise):** from My games, a place sheet, or Add place. Set the location by pointing on the map, using your current location, searching saved venues and places, or snapping a new place. Edit the address shown to players, add a landmark ("Gate 2, opposite the chai stall"), set time, players needed, fee in ₹ and visibility (everyone nearby or invited only), invite teams and people, and publish. Invitees get the address and a map pin, and the game appears on the map.
- **Teams (Pro):** create a team, open a roster, invite players, schedule a match.
- **League (Enterprise):** overview stats, week schedule with **Add fixture**, podium and standings table, department teams.
- **Tournaments (Enterprise):** League → Tournaments → **Create a tournament**. Choose sport, format (groups + knockout, or straight knockout), teams, seeding (league table or random draw), start day, weekdays/weekends, first match time, match length, slots per day, venues and an optional third-place match. The generator builds the plan and schedules every match across dates, times and parallel venues. Preview it, redraw if random, then publish. Enter results by tapping a match: group tables update, the top teams fill the semifinals, knockout winners advance automatically (level scores are settled by super over, penalties or another tie-break), and the final crowns the champion. A sample **Monsoon Cricket Cup** opens with the group stage done and the semifinals today. **Simulate** fills a round with random results for demos.
- **Shop:** promo carousel with sponsored placements, categories, product pages, bag and checkout, and **Promote your business** ad packages (featured map pin, shop banner, event sponsorship).
- **Profile:** plan card and plan comparison, family profiles, settings, and **Reset demo data**.

Demo state, including photos (resized to 720 px), is saved in the browser's local storage. In production, places, photos and hosted games would be stored on a server so every user sees them.

## Project layout

```
app/
  src/
    shell.html     page structure (demo panel, device frame, screens, tab bar)
    styles.css     design tokens (light + dark) and all components
    data.js        sample sports, activities, teams, company league, products, plans
    app.js         navigation, map engine, tier gating, every screen and flow
    tournament.js  tournament generator, scheduler, bracket progression and UI (Enterprise)
    features.js    filters, registration steps, waitlist, family calendar, notifications, coach match day, venue booking
    icons.js       inlined Lucide icon paths (ISC licence); custom sport glyphs live in app.js
  img/             optimised photos (Unsplash licence)
  index.html       built standalone PWA (generated)
  embed.html       built page fragment for hosted previews (generated)
  manifest.webmanifest, sw.js, icon-*.png
scripts/build.py   bundles app/src into index.html and embed.html
```

After editing anything in `app/src`, run `python3 scripts/build.py`.

## Design system

- **Design read:** consumer sports app for Indian amateur players, parents and company teams. Dials: energy 2, rhythm 2, motion 2 (transitions that explain where things came from, no endless loops).
- **Type:** a "scoreboard" voice (Barlow Condensed, italic capitals) only on page titles and hero moments. Section headings, sheets and labels use sentence case without wide tracking. Barlow for body text.
- **Colour:** ink neutrals and cobalt for every action. Volt yellow-green is the single accent and only marks "today", deals and the champion. Sport and plan colours are data encodings. No decorative gradients or glows. Full dark mode.
- **Identity motif:** thin pitch markings (halfway line, centre circle, boxes) on solid hero cards: plan card, league and tournament heroes, match day, the Pro promo.
- **Icons:** Lucide line icons at a slightly lighter 1.9 stroke, plus custom sport glyphs (cricket, kabaddi, shuttle, football and more). List rows put their icon on a soft tinted tile; the active tab gets a pill behind its icon.
- **Mobile:** 40 to 44 px touch targets, press feedback on every tappable item, safe-area insets, bottom tab bar with counts for things that need attention, bottom sheets, and toasts at the top so they never cover the main action.
- **Accessibility:** secondary text measured at 5.3:1 (light) and 6.5:1 (dark), keyboard focus states, labelled controls, in-app larger text and reduce-motion settings, and status that never relies on colour alone. A full WCAG 2.2 AA audit with assistive technology is still to do.
- **Honesty:** sample content is labelled as sample in the app, people show initials instead of stock photos, and features that are not built yet say "Coming soon" instead of pretending to work.

## From prototype to production

The screens, data model and tier rules map directly onto a native build. Two suggested routes:

1. **React Native + Expo** (recommended): one codebase for iOS and Android. Replace the illustrative SVG map with `react-native-maps` (Apple Maps / Google Maps) or Mapbox. Reuse `data.js` as API fixtures and `styles.css` tokens as a theme file.
2. **Capacitor wrapper:** package this web app as store apps quickly for pilots, then move to native as features grow.

Backend needs: auth and family accounts, geo-search of activities (for example PostGIS), payments (Stripe with Apple Pay / Google Pay), push notifications, an organisation/seat model for Enterprise, plan entitlements, and a marketplace catalogue with seller and promotion management.

## Notes

- The city, venues, clubs, people, company and products are fictional sample content.
- The map is an illustrative vector map, not real geography.
- Photos come from Unsplash.
