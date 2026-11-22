/* LetsPlay — sample data (India). Everything here is illustrative mock content for the prototype. */
const CUR = '₹';
const inr = (n) => '₹' + Math.round(Number(n)).toLocaleString('en-IN');

const SPORTS = {
  cricket:    { name: 'Cricket',    icon: 's-cricket',       c: '#D43B3B' },
  football:   { name: 'Football',   icon: 's-football',      c: '#13A04B' },
  badminton:  { name: 'Badminton',  icon: 's-shuttle',       c: '#0E9FE0' },
  kabaddi:    { name: 'Kabaddi',    icon: 's-kabaddi',       c: '#E0611A' },
  basketball: { name: 'Basketball', icon: 's-basketball',    c: '#C2410C' },
  tennis:     { name: 'Tennis',     icon: 's-tennis',        c: '#98B00A' },
  volleyball: { name: 'Volleyball', icon: 'volleyball',      c: '#DE9B05' },
  running:    { name: 'Running',    icon: 'footprints',      c: '#E3336A' },
  yoga:       { name: 'Yoga',       icon: 'person-standing', c: '#9757E0' },
  swimming:   { name: 'Swimming',   icon: 'waves',           c: '#0B7FD0' },
  cycling:    { name: 'Cycling',    icon: 'bike',            c: '#10A190' },
  pickleball: { name: 'Pickleball', icon: 's-paddle',        c: '#5E9C0D' },
  climbing:   { name: 'Climbing',   icon: 'mountain',        c: '#8A6A4C' },
};
/* Default cover photo per sport, used for games people host themselves. */
const SPORT_IMG = { cricket: 'cricket', football: 'field', badminton: 'badminton', kabaddi: 'field', basketball: 'basketball', tennis: 'tennis', volleyball: 'volley', running: 'running', yoga: 'yoga', swimming: 'swim', cycling: 'cycling', pickleball: 'pickle', climbing: 'climb' };

/* Map units: the world is 1600×1600; the user stands at (800, 800). 1 unit ≈ 2.5 m.
   Main roads: vertical at x = 400/800/1200, horizontal at y = 400/800/1200. */
const ME = { x: 800, y: 800 };
const VROADS = [[400, 'Station Road'], [800, 'MG Road'], [1200, 'Lake Road']];
const HROADS = [[400, 'Ring Road'], [800, 'Nehru Marg'], [1200, 'Market Road']];
const AREA = 'Riverfront';

/* d = days from today, t = 24h start time, price in rupees */
const ACTIVITIES = [
  { id: 'a1', title: 'Evening 5-a-side', sport: 'football', venue: 'Riverfront Maidan · Turf 3', x: 690, y: 645, d: 0, t: '19:30', mins: 60, level: 'All levels', ages: '16+', spots: 3, total: 10, price: 150, host: 'Riverfront FC', img: 'field', setting: 'Outdoor', surface: 'Artificial turf, floodlit', equipment: 'Studs or turf shoes, shin pads. Bibs provided.', access: 'Ramp from the MG Road gate. Accessible washroom near the pavilion.', cancel: 'Full refund up to 3 hours before kick-off.' },
  { id: 'a2', title: 'Pickup Hoops', sport: 'basketball', venue: 'Northgate Courts', x: 935, y: 610, d: 0, t: '18:30', mins: 90, level: 'Intermediate', ages: '16+', spots: 4, total: 10, price: 0, host: 'Northgate Ballers', img: 'basketball', setting: 'Outdoor', surface: 'Acrylic court, lit', equipment: 'Bring a ball if you have one.', access: 'Level access from Nehru Marg.', cancel: 'Free game. Let the host know if you cannot make it.' },
  { id: 'a3', title: 'Doubles Ladder Night', sport: 'tennis', venue: 'Lakeview Tennis Club', x: 1030, y: 850, d: 1, t: '18:00', mins: 120, level: 'Intermediate', ages: '18+', spots: 2, total: 8, price: 300, host: 'Lakeview TC', img: 'tennis2', setting: 'Outdoor', surface: 'Clay, 4 courts', equipment: 'Racquet. Balls provided.', access: 'Ramp to courts 1–2.', cancel: 'Refund up to 24 hours before.' },
  { id: 'a4', title: 'Shuttle Social', sport: 'badminton', venue: 'Shuttle Zone Arena', x: 520, y: 905, d: 1, t: '20:00', mins: 90, level: 'Beginner friendly', ages: '14+', spots: 6, total: 16, price: 200, host: 'Shuttle Zone', img: 'badminton', setting: 'Indoor', surface: 'Synthetic mat, 6 courts', equipment: 'Non-marking shoes. Racquets to borrow.', access: 'Lift to court level, accessible changing room.', cancel: 'Refund up to 6 hours before.' },
  { id: 'a5', title: 'Box Cricket Night', sport: 'cricket', venue: 'Oval Cricket Ground', x: 870, y: 1110, d: 0, t: '20:30', mins: 120, level: 'All levels', ages: '12+', spots: 5, total: 16, price: 250, host: 'Oval Strikers CC', img: 'cricket2', setting: 'Outdoor', surface: 'Netted box, floodlit', equipment: 'Tennis-ball cricket. Bats and stumps provided.', access: 'Paved path; side gate for wheelchair access.', cancel: 'Full refund if rained off.' },
  { id: 'a6', title: 'Sunset Beach Volley', sport: 'volleyball', venue: 'Lakeside Sand Courts', x: 1105, y: 1030, d: 0, t: '17:00', mins: 90, level: 'All levels', ages: '16+', spots: 2, total: 12, price: 0, host: 'Lakeside Volley', img: 'volley', setting: 'Outdoor', surface: 'Sand, 2 courts', equipment: 'Barefoot. Carry water.', access: 'Boardwalk to court edge.', cancel: 'Free game.' },
  { id: 'a7', title: 'Riverfront 5K Run Club', sport: 'running', venue: 'Riverfront Promenade', x: 625, y: 770, d: 1, t: '06:00', mins: 45, level: 'All paces', ages: '14+', spots: 18, total: 40, price: 0, host: 'Riverfront Runners', img: 'running', setting: 'Outdoor', surface: 'Flat riverside path', equipment: 'Running shoes, water.', access: 'Flat, paved route. Pacers for walk-run.', cancel: 'Free. Runs in light drizzle.' },
  { id: 'a8', title: 'Sunrise Yoga in the Garden', sport: 'yoga', venue: 'Botanical Garden Lawn', x: 720, y: 1195, d: 2, t: '06:30', mins: 60, level: 'All levels', ages: '16+', spots: 9, total: 20, price: 100, host: 'Open Sky Yoga', img: 'yoga', setting: 'Outdoor', surface: 'Lawn', equipment: 'Mat and water. Spare mats available.', access: 'Firm path to the lawn; chair-yoga option.', cancel: 'Moves to the pavilion if it rains.' },
  { id: 'a9', title: 'Lane Swim Masters', sport: 'swimming', venue: 'Westside Aquatic Centre', x: 455, y: 640, d: 2, t: '06:00', mins: 60, level: 'Advanced', ages: '18+', spots: 3, total: 12, price: 250, host: 'Westside Masters', img: 'swim', setting: 'Indoor', surface: '25 m pool, 6 lanes', equipment: 'Goggles, cap. Kickboards provided.', access: 'Pool hoist and accessible changing.', cancel: 'Refund up to 12 hours before.' },
  { id: 'a10', title: 'Sunrise Hill Ride', sport: 'cycling', venue: 'Northgate Park', x: 1085, y: 455, d: 6, t: '05:45', mins: 150, level: 'Intermediate', ages: '18+', spots: 11, total: 25, price: 0, host: 'Spokes & Chai', img: 'cycling', setting: 'Outdoor', surface: 'Road, 40 km loop', equipment: 'Road or hybrid bike, helmet, lights.', access: 'No-drop ride with a sweeper.', cancel: 'Free. Cancelled in heavy rain.' },
  { id: 'a11', title: 'Pickleball Drop-in', sport: 'pickleball', venue: 'Lake Road Sports Centre', x: 1200, y: 760, d: 3, t: '19:00', mins: 90, level: 'Beginner friendly', ages: 'All ages', spots: 7, total: 16, price: 200, host: 'Lake Road Rec', img: 'pickle', setting: 'Indoor', surface: '4 courts', equipment: 'Paddles to borrow.', access: 'Fully step-free.', cancel: 'Refund up to 2 hours before.' },
  { id: 'a12', title: 'Bouldering Basics', sport: 'climbing', venue: 'Boulder Box Gym', x: 380, y: 1050, d: 4, t: '18:30', mins: 90, level: 'Beginner', ages: '12+', spots: 4, total: 10, price: 600, host: 'Boulder Box', img: 'climb', setting: 'Indoor', surface: 'Bouldering walls, padded floor', equipment: 'Shoes and chalk included.', access: 'Ground-floor walls; ask staff for adaptive sessions.', cancel: 'Refund up to 24 hours before.' },
  { id: 'a13', title: 'Junior Futsal (8–11)', sport: 'football', venue: 'Shuttle Zone Arena · Hall B', x: 590, y: 985, d: 6, t: '09:00', mins: 60, level: 'Beginner', ages: '8–11', spots: 5, total: 16, price: 150, host: 'Shuttle Zone Juniors', img: 'football', setting: 'Indoor', surface: 'Sports hall', equipment: 'Sports shoes, water. Parent consent required.', access: 'Lift and accessible washrooms. Quiet room available.', cancel: 'Refund up to 24 hours before.' },
  { id: 'a14', title: '3×3 Street Tournament', sport: 'basketball', venue: 'Oval Courts', x: 985, y: 1065, d: 6, t: '16:00', mins: 240, level: 'Competitive', ages: '16+', spots: 3, total: 16, price: 500, host: 'City Hoops League', img: 'bball2', setting: 'Outdoor', surface: 'Concrete, 2 courts', equipment: 'Team of 3–4. Price is per team.', access: 'Level access, seating for spectators.', cancel: 'Refund until registration closes.' },
  { id: 'a15', title: 'Evening Kabaddi Practice', sport: 'kabaddi', venue: 'Hilltop Akhada Ground', x: 455, y: 415, d: 1, t: '17:30', mins: 90, level: 'All levels', ages: '14+', spots: 6, total: 14, price: 0, host: 'Hilltop Kabaddi Club', img: 'field', setting: 'Outdoor', surface: 'Mud court with mats', equipment: 'Comfortable sportswear. Barefoot play.', access: 'Ground-level court; seating under the banyan tree.', cancel: 'Free. Moves indoors if it rains.' },
];

const STORES = [
  { id: 's1', name: 'Riverfront Sports Co.', x: 765, y: 700, promo: 'Flat 20% off cricket gear this week', sponsored: true },
];

const COMMUNITY_SPOTS = [
  { id: 'c1', name: 'Open badminton court', sport: 'badminton', x: 1180, y: 610, by: 'Priya N.', setting: 'Outdoor', note: 'Public court in the colony park, lights until 10 pm.', visibility: 'Everyone' },
];

const ME_USER = { name: 'Arjun Mehta', img: 'av3' };

const PEOPLE = [
  { id: 'u1', name: 'Rohan Iyer', sport: 'Football · Cricket', dist: '0.6 km' },
  { id: 'u2', name: 'Ananya Rao', sport: 'Tennis · Running', dist: '1.1 km' },
  { id: 'u3', name: 'Kavya Nair', sport: 'Badminton', dist: '1.4 km' },
  { id: 'u4', name: 'Vikram Singh', sport: 'Cricket · Kabaddi', dist: '2.0 km' },
  { id: 'u5', name: 'Sameer Khan', sport: 'Football', dist: '2.3 km' },
];

const FAMILY = [
  { id: 'f0', name: 'Arjun Mehta', note: 'You', img: 'av3' },
  { id: 'f1', name: 'Aanya Mehta', note: 'Age 11 · consent on file' },
  { id: 'f2', name: 'Vihaan Mehta', note: 'Age 8 · consent on file' },
];

const TEAM_COLORS = ['#13A04B', '#1D4FF2', '#E3336A', '#E0611A', '#6A45F5', '#0E9FE0', '#D43B3B', '#0D1530'];

const SAMPLE_TEAMS = [
  { id: 't1', name: 'Riverfront Strikers', sport: 'cricket', color: '#D43B3B', privacy: 'Invite only',
    members: [
      { name: 'Arjun Mehta', img: 'av3', role: 'Captain', status: 'yes' },
      { name: 'Rohan Iyer', role: 'Vice-captain', status: 'yes' },
      { name: 'Vikram Singh', role: 'Player', status: 'maybe' },
      { name: 'Sameer Khan', role: 'Player', status: 'yes' },
      { name: 'Neha Joshi', role: 'Player', status: 'no' },
      { name: 'Karthik Reddy', role: 'Player', status: 'yes' },
    ],
    next: { vs: 'Oval Strikers CC', d: 3, t: '19:00', venue: 'Oval Cricket Ground' } },
  { id: 't2', name: 'Net Ninjas', sport: 'badminton', color: '#0E9FE0', privacy: 'Public',
    members: [
      { name: 'Arjun Mehta', img: 'av3', role: 'Captain', status: 'yes' },
      { name: 'Kavya Nair', role: 'Player', status: 'yes' },
      { name: 'Ravi Shah', role: 'Player', status: 'maybe' },
      { name: 'Pooja Desai', role: 'Player', status: 'yes' },
    ],
    next: { vs: 'Shuttle Social mixer', d: 1, t: '20:00', venue: 'Shuttle Zone Arena' } },
];

/* Enterprise: a fictional company running an internal league. */
const ORG = {
  name: 'Halcyon Systems',
  league: 'Monsoon Corporate Cup',
  employees: 412,
  teams: [
    { id: 'e1', name: 'Engineering Eagles', dept: 'Engineering', c: '#1D4FF2', ab: 'EE', w: 6, d: 1, l: 1, form: 'WWDWL', players: 14 },
    { id: 'e2', name: 'Sales Sharks', dept: 'Sales', c: '#E3336A', ab: 'SS', w: 5, d: 2, l: 1, form: 'WDWWD', players: 12 },
    { id: 'e3', name: 'Design Dynamos', dept: 'Design', c: '#9757E0', ab: 'DD', w: 5, d: 0, l: 3, form: 'LWWLW', players: 9 },
    { id: 'e4', name: 'Finance Falcons', dept: 'Finance', c: '#13A04B', ab: 'FF', w: 4, d: 2, l: 2, form: 'DWLWD', players: 10 },
    { id: 'e5', name: 'Ops Otters', dept: 'Operations', c: '#E0611A', ab: 'OO', w: 3, d: 2, l: 3, form: 'WLDLW', players: 13 },
    { id: 'e6', name: 'People Panthers', dept: 'People', c: '#0E9FE0', ab: 'PP', w: 2, d: 3, l: 3, form: 'DDLWL', players: 8 },
    { id: 'e7', name: 'Marketing Mavericks', dept: 'Marketing', c: '#DE9B05', ab: 'MM', w: 2, d: 1, l: 5, form: 'LLWLD', players: 11 },
    { id: 'e8', name: 'Legal Lions', dept: 'Legal', c: '#0D1530', ab: 'LL', w: 1, d: 1, l: 6, form: 'LLLDL', players: 7 },
  ],
  participation: [ ['Engineering', 78], ['Sales', 71], ['Design', 69], ['Operations', 58], ['Finance', 54], ['Marketing', 47], ['People', 44], ['Legal', 31] ],
};

const SAMPLE_FIXTURES = [
  { id: 'x1', a: 'e1', b: 'e2', sport: 'cricket', d: 1, t: '18:30', venue: 'Oval Cricket Ground' },
  { id: 'x2', a: 'e3', b: 'e5', sport: 'badminton', d: 1, t: '13:15', venue: 'Shuttle Zone Arena' },
  { id: 'x3', a: 'e4', b: 'e8', sport: 'football', d: 2, t: '19:00', venue: 'Riverfront Maidan · Turf 2' },
  { id: 'x4', a: 'e6', b: 'e7', sport: 'kabaddi', d: 3, t: '17:30', venue: 'Hilltop Akhada Ground' },
  { id: 'x5', a: 'e2', b: 'e3', sport: 'volleyball', d: 4, t: '13:00', venue: 'Lakeside Sand Courts' },
  { id: 'x6', a: 'e1', b: 'e4', sport: 'cricket', d: 6, t: '07:00', venue: 'Oval Cricket Ground' },
];

const VENUES_ENT = ['Oval Cricket Ground', 'Riverfront Maidan · Turf 2', 'Shuttle Zone Arena', 'Northgate Courts', 'Lakeside Sand Courts', 'Hilltop Akhada Ground'];

const PRODUCTS = [
  { id: 'p1', name: 'Match Futsal Ball, Size 4', brand: 'Kinetiq', cat: 'equipment', price: 1299, was: 1799, img: 'p-futsal', rating: 4.7, reviews: 212, seller: 'Riverfront Sports Co.', sizes: null },
  { id: 'p2', name: 'Velocity Trail Runner', brand: 'Stride', cat: 'footwear', price: 4499, was: 5999, img: 'p-running2', rating: 4.6, reviews: 98, seller: 'Stride Official', sizes: ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10'] },
  { id: 'p3', name: 'Everyday Dri-Fit Tee', brand: 'Courtline', cat: 'apparel', price: 799, img: 'p-tshirt', rating: 4.5, reviews: 340, seller: 'Courtline', sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
  { id: 'p4', name: 'Pro Sparring Gloves 12oz', brand: 'Kinetiq', cat: 'equipment', price: 2499, img: 'p-gloves', rating: 4.8, reviews: 61, seller: 'Boulder Box Pro Shop', sizes: ['10oz', '12oz', '14oz'] },
  { id: 'p5', name: 'Insulated Sport Bottle 750 ml', brand: 'Hydra', cat: 'accessories', price: 899, img: 'p-bottle', rating: 4.9, reviews: 520, seller: 'Hydra', sizes: null },
  { id: 'p6', name: 'Club Kit Backpack 28 L', brand: 'Courtline', cat: 'accessories', price: 1999, was: 2699, img: 'p-bag', rating: 4.6, reviews: 143, seller: 'Riverfront Sports Co.', sizes: null },
];

const FREE_DELIVERY = 999;
const DELIVERY_FEE = 49;

const PLANS = {
  lite: { name: 'Lite', price: 'Free', per: '', icon: 'compass', blurb: 'Find games near you and jump in.',
    feats: ['Live map of nearby sports', 'Join games and events', 'Family profiles and calendar', 'Marketplace and deals'],
    no: ['Pin and photograph new places', 'Host games, create teams, invite players', 'Company leagues and leaderboards'] },
  pro: { name: 'Pro', price: '₹199', per: '/month', icon: 'zap', blurb: 'Organise teams and grow your local scene.',
    feats: ['Everything in Lite', 'Pin new places on the map', 'Snap a photo to save a new place', 'Host games at any address', 'Create teams and invite players', '10% off in the marketplace'],
    no: ['Company leagues and leaderboards'] },
  enterprise: { name: 'Enterprise', price: '₹149', per: '/employee/month', icon: 'building-2', blurb: 'Run sport across your company.',
    feats: ['Everything in Pro', 'Tournament organizer: auto groups, brackets and schedule', 'Winners advance to semifinals and final automatically', 'Department teams and rosters', 'League schedule builder', 'Live team leaderboards', 'Participation insights', 'Bulk team-kit orders'],
    no: [] },
};

/* ── Upgrades data ── */
ACTIVITIES.push({ id: 'a16', title: 'Kids Swim Lessons (6–12)', sport: 'swimming', venue: 'Westside Aquatic Centre · Learner pool', x: 480, y: 600, d: 6, t: '09:30', mins: 60, level: 'Beginner', ages: '6–12', spots: 4, total: 10, price: 300, host: 'Westside Swim School', img: 'swim', setting: 'Indoor', surface: 'Learner pool, 0.9 m deep', equipment: 'Swimsuit, cap, towel.', access: 'Pool hoist and family changing rooms.', cancel: 'Refund up to 24 hours before.' });
ACTIVITIES.find((a) => a.id === 'a3').spots = 0; /* full: shows the waitlist */

/* Coach and credential shown on game pages */
const COACH = {
  a1: ['Imran Shaikh', 'AIFF D licence'], a3: ['Neha Kulkarni', 'AITA certified coach'], a4: ['Sameer Patil', 'Badminton coach, Level 2'],
  a5: ['Rahul Menon', 'BCCI Level 1'], a8: ['Divya Rao', 'RYT-500 yoga teacher'], a9: ['Arvind Pillai', 'Swim coach, Level 2'],
  a12: ['Tenzing Dorje', 'Climbing instructor'], a13: ['Imran Shaikh', 'AIFF grassroots coach'], a15: ['Balwinder Singh', 'NIS kabaddi coach'], a16: ['Lakshmi Iyer', 'Swim instructor'],
};

FAMILY[0].age = 34; FAMILY[1].age = 11; FAMILY[2].age = 8;
const FAMILY_COLORS = { f0: '#1D4FF2', f1: '#E3336A', f2: '#0E9FE0' };
const PROFILES = {
  f0: { phone: '98765 43210', ecName: 'Meera Mehta (spouse)', ecPhone: '98765 01234', medical: '' },
  f1: { phone: '', ecName: 'Arjun Mehta (father)', ecPhone: '98765 43210', medical: 'Mild asthma, carries an inhaler' },
  f2: { phone: '', ecName: 'Arjun Mehta (father)', ecPhone: '98765 43210', medical: '' },
};

/* Notifications: what changed, what it means, what to do. pri: urgent | action | info | promo; cat drives user controls. */
const NOTE_SEED = [
  { id: 'n1', pri: 'urgent', cat: 'change', icon: 'cloud-sun', when: '12 min ago', ref: 'a7', title: 'Rain alert for Riverfront 5K',
    body: 'Light rain is forecast at 6 am tomorrow. The run goes ahead in drizzle and moves to Saturday if rain is heavy. You get a full refund if it is cancelled.',
    actions: [['Keep my spot', 'keep'], ['Cancel my place', 'cancelSpot']] },
  { id: 'n2', pri: 'urgent', cat: 'change', icon: 'map-pin', when: '1 hr ago', ref: 'a7', title: 'Riverfront 5K: meeting point moved',
    body: 'Now starting at the promenade clock tower, 200 m east of the old spot. The start time is unchanged.',
    actions: [['Got it', 'ack'], ['View game', 'view']] },
  { id: 'n3', pri: 'action', cat: 'payment', icon: 'indian-rupee', when: '3 hr ago', ref: 'a16', title: 'Payment due: Aanya’s swim lessons',
    body: 'Pay ₹300 by Friday 8 pm to keep Aanya’s place for Saturday. Unpaid places go to the waitlist.',
    actions: [['Pay ₹300 via UPI', 'pay'], ['Remind me tomorrow', 'snooze']] },
  { id: 'n4', pri: 'action', cat: 'team', icon: 'users', when: 'Yesterday', ref: 't1', title: 'Are you available on Wednesday?',
    body: 'Riverfront Strikers v Oval Strikers CC, Wed 7 pm at Oval Cricket Ground. Rohan (vice-captain) needs 11 players by Tuesday.',
    actions: [['I’m in', 'yes'], ['Can’t make it', 'no']] },
  { id: 'n5', pri: 'info', cat: 'club', icon: 'list-checks', when: 'Yesterday', ref: 'a13', title: 'Coach Imran shared the kit list',
    body: 'For Junior Futsal on Saturday, Vihaan needs non-marking shoes, shin pads and a water bottle.',
    actions: [['View game', 'view']] },
  { id: 'n6', pri: 'info', cat: 'recs', icon: 'sparkles', when: '2 days ago', ref: 'a15', title: 'New near you: Evening Kabaddi Practice',
    body: 'Free, tomorrow at 5:30 pm at Hilltop Akhada Ground, 1.5 km away. Beginners welcome.',
    actions: [['View game', 'view']] },
  { id: 'n7', pri: 'promo', cat: 'promo', icon: 'tag', when: '2 days ago', title: 'Riverfront Sports Co.: flat 20% off cricket gear',
    body: 'Bats, pads and helmets this week only. Click & collect in 2 hours.',
    actions: [['Shop the deal', 'shop']] },
];

/* Turfs and courts that can be booked by the hour. price = off-peak per hour, peak = after 6 pm and weekends. */
const VENUES_BOOK = [
  { id: 'v1', name: 'Riverfront Maidan Turf', x: 690, y: 645, sports: ['football', 'cricket'], courts: ['Turf A · 5-a-side', 'Turf B · 7-a-side'], price: 1200, peak: 1600, img: 'field', setting: 'Outdoor', rating: 4.6, reviews: 812, amenities: ['Floodlights', 'Parking', 'Washrooms', 'Drinking water', 'Changing room'] },
  { id: 'v2', name: 'Oval Box Cricket', x: 870, y: 1110, sports: ['cricket'], courts: ['Box 1', 'Box 2'], price: 1400, peak: 1800, img: 'cricket2', setting: 'Outdoor', rating: 4.5, reviews: 640, amenities: ['Floodlights', 'Bats & stumps', 'Parking', 'Washrooms'] },
  { id: 'v3', name: 'Shuttle Zone Arena', x: 520, y: 905, sports: ['badminton'], courts: ['Court 1', 'Court 2', 'Court 3', 'Court 4'], price: 450, peak: 600, img: 'badminton', setting: 'Indoor', rating: 4.7, reviews: 1204, amenities: ['Air cooled', 'Racquet hire', 'Changing room', 'Lift access'] },
  { id: 'v4', name: 'Northgate Courts', x: 935, y: 610, sports: ['basketball'], courts: ['Full court', 'Half court'], price: 800, peak: 1000, img: 'basketball', setting: 'Outdoor', rating: 4.3, reviews: 210, amenities: ['Floodlights', 'Drinking water', 'Seating'] },
  { id: 'v5', name: 'Lake Road Pickleball', x: 1200, y: 760, sports: ['pickleball'], courts: ['Court 1', 'Court 2'], price: 500, peak: 700, img: 'pickle', setting: 'Indoor', rating: 4.8, reviews: 156, amenities: ['Paddle hire', 'Air cooled', 'Step-free'] },
  { id: 'v6', name: 'Lakeside Sand Courts', x: 1105, y: 1030, sports: ['volleyball'], courts: ['Court 1', 'Court 2'], price: 600, peak: 800, img: 'volley', setting: 'Outdoor', rating: 4.4, reviews: 98, amenities: ['Floodlights', 'Showers', 'Ball hire'] },
];
const LINEUP_SIZE = { cricket: 11, football: 7, kabaddi: 7, basketball: 5, volleyball: 6, badminton: 4 };

/* Players on LetsPlay, for adding to teams. km = distance from you. lft = looking for a team. */
const PLAYERS = [
  { id: 'u6', name: 'Aditya Kulkarni', sports: ['cricket', 'football'], level: 'Intermediate', km: 0.3, lft: true, games: 58, bio: 'Opening batter, part-time spin' },
  { id: 'u1', name: 'Rohan Iyer', sports: ['football', 'cricket'], level: 'Intermediate', km: 0.6, lft: false, games: 42, bio: 'Midfielder, plays weekday evenings' },
  { id: 'u7', name: 'Fatima Sheikh', sports: ['badminton', 'volleyball'], level: 'Advanced', km: 0.8, lft: true, games: 77, bio: 'State-level doubles player' },
  { id: 'u2', name: 'Ananya Rao', sports: ['tennis', 'running'], level: 'Intermediate', km: 1.1, lft: true, games: 35, bio: 'Morning runner, weekend tennis' },
  { id: 'u8', name: 'Harpreet Gill', sports: ['kabaddi', 'football'], level: 'Advanced', km: 1.2, lft: true, games: 64, bio: 'Raider, 6 years club kabaddi' },
  { id: 'u3', name: 'Kavya Nair', sports: ['badminton'], level: 'Intermediate', km: 1.4, lft: false, games: 49, bio: 'Singles and mixed doubles' },
  { id: 'u9', name: 'Siddharth Jain', sports: ['cricket'], level: 'Beginner', km: 1.7, lft: true, games: 6, bio: 'New to the city, keen fast bowler' },
  { id: 'u4', name: 'Vikram Singh', sports: ['cricket', 'kabaddi'], level: 'Advanced', km: 2.0, lft: false, games: 91, bio: 'Wicketkeeper-batter' },
  { id: 'u5', name: 'Sameer Khan', sports: ['football'], level: 'Intermediate', km: 2.3, lft: true, games: 28, bio: 'Centre-back, free on weekends' },
  { id: 'u10', name: 'Meenakshi Pillai', sports: ['volleyball', 'basketball'], level: 'Intermediate', km: 2.9, lft: true, games: 22, bio: 'Setter, also plays 3×3' },
  { id: 'u11', name: 'Arnav Bose', sports: ['football', 'basketball'], level: 'Beginner', km: 3.4, lft: true, games: 9, bio: 'College student, evenings free' },
  { id: 'u12', name: 'Deepa Menon', sports: ['cricket', 'badminton'], level: 'Intermediate', km: 3.8, lft: false, games: 31, bio: 'All-rounder, corporate league' },
  { id: 'u13', name: 'Imran Qureshi', sports: ['cricket'], level: 'Advanced', km: 4.6, lft: true, games: 120, bio: 'Left-arm seam, club captain' },
  { id: 'u14', name: 'Tanvi Shah', sports: ['badminton', 'pickleball'], level: 'Beginner', km: 5.2, lft: true, games: 4, bio: 'Learning, happy to join any team' },
  { id: 'u15', name: 'Rahul Verma', sports: ['kabaddi', 'cricket'], level: 'Intermediate', km: 6.5, lft: false, games: 40, bio: 'Defender, weekend matches only' },
];
