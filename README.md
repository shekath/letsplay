# LetsPlay: community sports app prototype

LetsPlay is a working, clickable prototype of a mobile app for discovering, joining and organising local indoor and outdoor sport. It is built mobile-first for iOS and Android. The live map opens first, so nearby games are always one tap away.

The prototype covers the participation loop from the UX strategy (**Discover → Join → Schedule → Participate**), the three product tiers, and the marketplace.

## Run it

```bash
python3 -m http.server 8080 --directory app
```

Then open `http://localhost:8080` on a desktop browser (it shows a device frame and a plan switcher) or on a phone on the same network. On a phone you get the full-screen app. Use **Add to Home Screen** (iOS Safari) or **Install app** (Android Chrome) to run it like a native app.

## Plans (tiers)

| Capability | Lite | Pro | Enterprise |
| --- | :---: | :---: | :---: |
| Live map of nearby sports, filters, search | ✓ | ✓ | ✓ |
| Join games, family profiles, payment, My games calendar | ✓ | ✓ | ✓ |
| Marketplace (equipment, footwear, outfits, deals) | ✓ | ✓ (10% off) | ✓ (+ bulk team kits) |
| Pin new locations on the map | – | ✓ | ✓ |
| Create teams, invite players (link, code, nearby, contacts) | – | ✓ | ✓ |
| Host games, schedule matches, availability | – | ✓ | ✓ |
| Company league: department teams, schedule builder, leaderboards, participation insights | – | – | ✓ |

Prices shown in the app ($4.99/month for Pro, $3 per employee per month for Enterprise) are **placeholders** for validation, as the pitch recommends.

Locked features stay visible to Lite users and lead to an upgrade sheet, so people can see what Pro adds.

## What you can try

- **Explore (home):** pan, pinch or scroll to zoom the map; tap a sport chip to filter; tap a pin for a preview card; drag the "games near you" sheet up and down; tap **Join**.
- **Join flow:** choose family members, accept the code of conduct, pay (Apple Pay on iOS, Google Pay on Android), and the game is added to **My games** with a countdown and schedule-change alerts.
- **Pin a spot (Pro):** move the map under the crosshair, set the location, and describe the spot. It appears as a community pin.
- **Teams (Pro):** create a team, open a roster, invite players, schedule a match.
- **League (Enterprise):** overview stats, week schedule with **Add fixture**, podium and standings table, department teams.
- **Shop:** promo carousel with sponsored placements, categories, product pages, bag and checkout, and **Promote your business** ad packages (featured map pin, shop banner, event sponsorship).
- **Profile:** plan card and plan comparison, family profiles, settings, and **Reset demo data**.

Demo state is saved in the browser's local storage.

## Project layout

```
app/
  src/
    shell.html     page structure (demo panel, device frame, screens, tab bar)
    styles.css     design tokens (light + dark) and all components
    data.js        sample sports, activities, teams, company league, products, plans
    app.js         navigation, map engine, tier gating, every screen and flow
    icons.js       inlined Lucide icon paths (ISC licence) + custom sport glyphs in app.js
  img/             optimised photos (Unsplash licence)
  index.html       built standalone PWA (generated)
  embed.html       built page fragment for hosted previews (generated)
  manifest.webmanifest, sw.js, icon-*.png
scripts/build.py   bundles app/src into index.html and embed.html
```

After editing anything in `app/src`, run `python3 scripts/build.py`.

## Design system

- **Look:** clean and sporty. Condensed italic display type (Barlow Condensed) for headings and numbers, Barlow for body text.
- **Colour:** cobalt blue for primary actions, a volt yellow-green highlight for live and deal states, and one colour per sport so pins, chips and badges read at a glance. Each tier has its own colour (Lite teal, Pro cobalt, Enterprise violet). Full dark mode.
- **Mobile:** 44 px+ touch targets, safe-area insets for notches and home indicators, bottom tab bar, bottom sheets, and pointer events that work for both touch and mouse.
- **Accessibility:** keyboard focus states, labelled controls, reduced-motion support, and status that never relies on colour alone. The WCAG 2.2 AA target from the strategy still needs a full audit.

## From prototype to production

The screens, data model and tier rules map directly onto a native build. Two suggested routes:

1. **React Native + Expo** (recommended): one codebase for iOS and Android. Replace the illustrative SVG map with `react-native-maps` (Apple Maps / Google Maps) or Mapbox. Reuse `data.js` as API fixtures and `styles.css` tokens as a theme file.
2. **Capacitor wrapper:** package this web app as store apps quickly for pilots, then move to native as features grow.

Backend needs: auth and family accounts, geo-search of activities (for example PostGIS), payments (Stripe with Apple Pay / Google Pay), push notifications, an organisation/seat model for Enterprise, plan entitlements, and a marketplace catalogue with seller and promotion management.

## Notes

- The city, venues, clubs, people, company and products are fictional sample content.
- The map is an illustrative vector map, not real geography.
- Photos come from Unsplash.
