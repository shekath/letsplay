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

A second, engagement-first direction at `http://localhost:8080/design2.html`, built on the same data. It has every plan and feature of Design 1 (Lite, Pro and Corporate, with the same billing), in its own style. On a desktop, the side panel switches plans instantly for demos.

Tabs: **Play · Games · Team** (Company on Corporate) **· Shop · Me**.

- **Play:** a list of games in a bottom sheet over the live map (drag or tap to expand). Each game is a clean row: the game name, then day and time in bold with the distance as a map-pin chip, then price, spots left and venue. Tap a game to move the map to its pin and open details; tap a pin to highlight its card; tap + to join. Full games offer the waitlist. **Filters** (day, time, distance, fee, ability, age, setting, step-free access), the notification bell, zoom and locate controls, and a map pin button to add places or host games (Pro).
- **Joining:** step-by-step registration (who’s playing with family members and age checks, saved details and emergency contacts, consent with guardian consent for under-18s, UPI payment with a failed-payment demo), then XP and a short celebration.
- **Starting soon:** story rings for games today and tomorrow; a full-screen viewer that advances every 5 seconds (hold to pause, tap the sides to move; manual when reduced motion is on).
- **Games:** Upcoming (next game countdown, what needs you, every booking by day), **Family** calendar (filter by family member, clash warnings for two drop-offs at once, with fixes) and **Book a court** (drag a time window along the day, split the cost live; Pro can post the open spots as a game).
- **Notifications:** urgent changes, to-dos and updates with one-tap actions, and settings for the optional ones.
- **Shop:** deals carousel with a sponsored slot, search, categories, product pages with sizes, bag and UPI checkout, member prices (10% off on Pro and Corporate), **Promote your business**, and bulk team kits on Corporate.
- **Lite in Design 2:** one team of your own (cricket, football, volleyball, cycling, badminton or tennis) with roster, add players, match day and chat; edit it, delete it and create a new one. Lite users can host one game at a time (in the same six sports): edit it (players are told if the time or place changes, and players needed can't drop below who has joined) or delete it (joined players get a cancellation notice and refund), and host another once it has taken place or been deleted. Every plan can now edit and delete upcoming hosted games from Games → Hosting or the game page. Lite users can also add grounds and play zones to the map with up to four photos, a type (ground, turf, court, play zone, indoor hall), an address from search or a map pin, and a landmark. Hosting more than one game, more teams, every sport and custom sports are Pro. (Design 1 keeps the original Lite rules in the table below.)
- **Pro:** snap a photo of a new place and put it on the map for everyone; host a game at any address (point on the map, your location, a saved venue or a new photo place; editable address and landmark, fee, players, visibility and team invites); teams with match day (availability poll and nudges, cricket field placement or a lineup with captain), roster with invite link and code, team chat, match scheduling; **Add players** nearest first, grouped by distance, filterable, with sharing to any app.
- **Address search (Pro and Corporate):** one search box wherever a venue or location is chosen: hosting a game, adding a place, the map picker, company fixtures and tournament venues. It finds bookable venues, game venues, saved places, company venues, landmarks, street addresses ("24 MG Road") and junctions ("MG Road and Ring Road"), nearest first, and shows nearby venues before you type. Pick a result, then fine-tune the pin on the map (the picker has the same search on top). Company venues found this way are added to the venue list. In production this would call a geocoding service such as Google Places or Mapbox.
- **Custom sports (Pro and Corporate):** add your own sports and indoor games (carrom, table tennis, chess, darts, pool, foosball and more) from Me → Your sports or the **New sport** chip in any sport picker. Choose a drawn icon or use your own picture (it becomes the round icon and the cover photo for games of that sport), a colour, indoor or outdoor and players a side. Custom sports appear in hosting, places, teams, company fixtures, registration and tournaments, and on Play when they have games. A sport in use can’t be deleted; one with only finished games is archived so history still shows.
- **Hosting list (Pro and Corporate):** Games → Hosting lists every game you host: upcoming (share, open, and the date it can be deleted from) and finished. A game can be deleted from the day after its event date, one at a time or all at once, with a confirmation. Hosted games keep their real date, so finished games leave the map and list on their own.
- **Corporate (Company tab):** a company workspace with an **Admin** and an **Employee** view (switch at the top).
  - **Admin · Home:** active people, participation and games played, seats used, a setup checklist, team registrations waiting for approval, announcements, this week’s fixtures, participation by department with a nudge for departments below 50%, a CSV participation report, and integrations (Slack and Microsoft Teams simulated; single sign-on and HR sync marked coming soon).
  - **Admin · People:** employee directory with search and filters (department, invited, no team). **Import sheet** takes Excel (.xlsx, .xls) or CSV: download the template, upload, and every row is checked (missing or invalid email, not a company email, duplicates, unknown team, new department) before importing, with optional invites and teams for new departments. A sample sheet is built in. Or share a company-only invite link. Each person can be moved between teams, made captain, re-invited or removed.
  - **Admin · Teams:** three ways to build teams: **Auto-build** one per department, **Create** by picking colleagues, or **Registration** (employees register their own teams; set sports, deadline, minimum and maximum players, and whether you approve each team). Every way of creating a team includes choosing a captain (the admin picks when creating; an employee picks themselves or a teammate when registering). Approve or decline requests, change the captain with the crown next to any player, manage rosters, message a team. A captain can also hand over captaincy from their team on the employee page.
  - **Admin · Events:** the company league (podium, table and form, fixtures with clash warnings that notify both teams) and **Tournaments**: create from approved teams, preview, redraw, publish (every player is notified and an announcement is posted), enter results with tie-breaks; winners move on automatically.
  - **Announcements:** pick the audience (everyone, captains, a department or a team) and channels (app, email, Slack, Teams), start from a template, preview it as a phone notification and send.
  - **Employee:** the company page staff see: announcements, the next match with an RSVP (in, maybe, out), their teams and fixtures, tournaments with their team highlighted (read-only brackets), the league table, **Register a team** while registration is open (sent to the admin for approval), the status of their registrations, and their own teams outside work. Fixture, tournament, approval and announcement updates arrive in the bell and open the company page.
- **Me page:** a game-style player banner (night-arena artwork, avatar in a neon XP ring with a level shield, title, XP bar and four neon stat chips), a compact This week card (streak, the last 8 weeks, freezes and the weekly goal together) and a horizontal rail of neon badge cards with See all for the full grid.
- **Streaks and badges:** a flame streak card (weeks in a row with the weekly goal hit, best streak, this week’s progress ring, milestones at 3, 5, 8 and 12 weeks) with working **streak freezes**: freeze a week you can’t play, or one is used automatically if the week ends before you hit your goal; a frozen week keeps the streak without adding to it, hitting the goal anyway returns the freeze, and you earn one every 4 weeks in a row (hold up to 3). Tap the freeze chip, then **End week** to demo each outcome. The card also shows and 12 badges in a sharp, CRED-like neon style, drawn as SVG in four tiers (bronze, silver, gold, epic): hairline gradient rims with a second fine rim, a bezel of tick marks, a small diamond and a thin white-hot emblem, with a very soft glow; tier labels are soft-glow pills, cards are matte black with a hairline highlight, and the detail view shows progress, XP and the date earned. Locked badges show progress and what to do next. New badges pay out XP and unlock with a spin and confetti, inside the success sheet when there is one.
- **Me:** level, XP, weekly goal, streak and badges; plan card with upgrade, manage and switch-to-yearly; family profiles, default UPI app, notification settings, larger text, appearance and reset.
- **Look:** Saira extra-bold italic for titles, scores and numbers (athletic, scoreboard feel) with Manrope for reading, a neutral base where each card takes its sport colour, violet only for your progress, one hue per plan, a floating pill tab bar, and light and dark themes.

Source: `app/design2/src` (shell, `d2.css`, `d2.js` for the core, `d2-plans.js`, `d2-lite.js`, `d2-pro.js`, `d2-corp.js` for plan features); `scripts/build.py` bundles it with the shared `data.js`, `icons.js` and `tour-engine.js`.

## Plans (tiers)

| Capability | Lite | Pro | Corporate |
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
| Corporate | ₹149 per employee/month | ₹1,430 per employee/year (instead of ₹1,788), minimum 20 employees |

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
- **Add place (Pro/Corporate):** take a photo with the phone camera (or drop a pin), name it and save. The place is public, so everyone sees it on the map with its photo.
- **Host a game (Pro/Corporate):** from My games, a place sheet, or Add place. Set the location by pointing on the map, using your current location, searching saved venues and places, or snapping a new place. Edit the address shown to players, add a landmark ("Gate 2, opposite the chai stall"), set time, players needed, fee in ₹ and visibility (everyone nearby or invited only), invite teams and people, and publish. Invitees get the address and a map pin, and the game appears on the map.
- **Teams (Pro):** create a team, open a roster, invite players, schedule a match.
- **League (Corporate):** overview stats, week schedule with **Add fixture**, podium and standings table, department teams.
- **Tournaments (Corporate):** League → Tournaments → **Create a tournament**. Choose sport, format (groups + knockout, or straight knockout), teams, seeding (league table or random draw), start day, weekdays/weekends, first match time, match length, slots per day, venues and an optional third-place match. The generator builds the plan and schedules every match across dates, times and parallel venues. Preview it, redraw if random, then publish. Enter results by tapping a match: group tables update, the top teams fill the semifinals, knockout winners advance automatically (level scores are settled by super over, penalties or another tie-break), and the final crowns the champion. A sample **Monsoon Cricket Cup** opens with the group stage done and the semifinals today. **Simulate** fills a round with random results for demos.
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
    tour-engine.js tournament generator, scheduler and bracket progression (shared by both designs)
    tournament.js  tournament UI for Design 1 (Corporate)
    features.js    filters, registration steps, waitlist, family calendar, notifications, coach match day, venue booking
    icons.js       inlined Lucide icon paths (ISC licence); custom sport glyphs live in app.js
  design2/src/     Design 2: shell.html, d2.css, d2.js (core) and d2-plans/lite/pro/corp.js (plan features)
  img/             optimised photos (Unsplash licence)
  index.html       built standalone PWA (generated)
  embed.html       built page fragment for hosted previews (generated)
  design2.html, design2-embed.html   built Design 2 (generated)
  manifest.webmanifest, sw.js, icon-*.png
scripts/build.py   bundles both designs
```

After editing anything in `app/src` or `app/design2/src`, run `python3 scripts/build.py`.

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

Backend needs: auth and family accounts, geo-search of activities (for example PostGIS), payments (Stripe with Apple Pay / Google Pay), push notifications, an organisation/seat model for Corporate, plan entitlements, and a marketplace catalogue with seller and promotion management.

## Notes

- The city, venues, clubs, people, company and products are fictional sample content.
- The map is an illustrative vector map, not real geography.
- Photos come from Unsplash.
