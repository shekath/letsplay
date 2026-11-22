/* LetsPlay — sample data. Everything here is illustrative mock content for the prototype. */
const CUR = '$';

const SPORTS = {
  football:   { name: 'Football',   icon: 's-football',      c: '#13A04B' },
  basketball: { name: 'Basketball', icon: 's-basketball',    c: '#F06A1C' },
  tennis:     { name: 'Tennis',     icon: 's-tennis',        c: '#98B00A' },
  badminton:  { name: 'Badminton',  icon: 's-shuttle',       c: '#0E9FE0' },
  cricket:    { name: 'Cricket',    icon: 's-cricket',       c: '#D43B3B' },
  volleyball: { name: 'Volleyball', icon: 'volleyball',      c: '#DE9B05' },
  running:    { name: 'Running',    icon: 'footprints',      c: '#E3336A' },
  yoga:       { name: 'Yoga',       icon: 'person-standing', c: '#9757E0' },
  swimming:   { name: 'Swimming',   icon: 'waves',           c: '#0B7FD0' },
  cycling:    { name: 'Cycling',    icon: 'bike',            c: '#10A190' },
  pickleball: { name: 'Pickleball', icon: 's-paddle',        c: '#5E9C0D' },
  climbing:   { name: 'Climbing',   icon: 'mountain',        c: '#8A6A4C' },
};

/* Map units: the world is 1600×1600; the user stands at (800, 800). 1 unit ≈ 2.5 m. */
const ME = { x: 800, y: 800 };

/* d = days from today, t = 24h start time */
const ACTIVITIES = [
  { id: 'a1', title: 'Sunday 5-a-side', sport: 'football', venue: 'Riverside Park · Pitch 3', x: 690, y: 645, d: 0, t: '18:30', mins: 60, level: 'All levels', ages: '16+', spots: 3, total: 10, price: 4, host: 'Riverside FC', img: 'field', setting: 'Outdoor', surface: '3G turf, floodlit', equipment: 'Shin pads, astro or moulded boots. Bibs provided.', access: 'Step-free path from Bridge Plaza. Accessible toilets at the pavilion.', cancel: 'Full refund up to 3 hours before kick-off.' },
  { id: 'a2', title: 'Pickup Hoops', sport: 'basketball', venue: 'Northgate Courts', x: 935, y: 610, d: 0, t: '19:00', mins: 90, level: 'Intermediate', ages: '16+', spots: 4, total: 10, price: 0, host: 'Northgate Ballers', img: 'basketball', setting: 'Outdoor', surface: 'Acrylic court, lit', equipment: 'Bring a ball if you have one.', access: 'Level access from King Ave.', cancel: 'Free game. Let the host know if you cannot make it.' },
  { id: 'a3', title: 'Doubles Ladder Night', sport: 'tennis', venue: 'Elm Street Tennis Club', x: 1030, y: 850, d: 1, t: '18:00', mins: 120, level: 'Intermediate', ages: '18+', spots: 2, total: 8, price: 8, host: 'Elm Street TC', img: 'tennis2', setting: 'Outdoor', surface: 'Clay, 4 courts', equipment: 'Racket. Balls provided.', access: 'Ramp to courts 1–2.', cancel: 'Refund up to 24 hours before.' },
  { id: 'a4', title: 'Shuttle Social', sport: 'badminton', venue: 'Harbour Sports Hall', x: 520, y: 905, d: 1, t: '19:30', mins: 90, level: 'Beginner friendly', ages: '14+', spots: 6, total: 16, price: 5, host: 'Harbour Smashers', img: 'badminton', setting: 'Indoor', surface: 'Sprung wooden floor, 4 courts', equipment: 'Non-marking shoes. Rackets to borrow.', access: 'Lift to hall level, accessible changing room.', cancel: 'Refund up to 6 hours before.' },
  { id: 'a5', title: 'Weekend Nets Session', sport: 'cricket', venue: 'Oval Green', x: 870, y: 1110, d: 6, t: '09:00', mins: 120, level: 'All levels', ages: '12+', spots: 5, total: 14, price: 6, host: 'Oval Green CC', img: 'cricket', setting: 'Outdoor', surface: 'Artificial nets, 3 lanes', equipment: 'Club kit available. Bring your own helmet if you have one.', access: 'Grass path; ask for the side gate for wheelchair access.', cancel: 'Full refund if rained off.' },
  { id: 'a6', title: 'Sunset Beach Volley', sport: 'volleyball', venue: 'Lakeside Sand Courts', x: 1105, y: 1030, d: 0, t: '17:00', mins: 90, level: 'All levels', ages: '16+', spots: 2, total: 12, price: 0, host: 'Lakeside Volley', img: 'volley', setting: 'Outdoor', surface: 'Sand, 2 courts', equipment: 'Barefoot or sand socks. Water.', access: 'Boardwalk to court edge.', cancel: 'Free game.' },
  { id: 'a7', title: 'Riverside 5K Run Club', sport: 'running', venue: 'Bridge Plaza', x: 625, y: 770, d: 1, t: '06:30', mins: 45, level: 'All paces', ages: '14+', spots: 18, total: 40, price: 0, host: 'Riverside Runners', img: 'running', setting: 'Outdoor', surface: 'Flat riverside path', equipment: 'Running shoes, a light.', access: 'Flat, paved route. Pacers for walk-run.', cancel: 'Free. Runs in light rain.' },
  { id: 'a8', title: 'Flow Yoga in the Park', sport: 'yoga', venue: 'Botanic Lawn', x: 720, y: 1195, d: 2, t: '07:00', mins: 60, level: 'All levels', ages: '16+', spots: 9, total: 20, price: 3, host: 'Open Sky Yoga', img: 'yoga', setting: 'Outdoor', surface: 'Lawn', equipment: 'Mat and water. Spare mats available.', access: 'Firm path to the lawn; chair-yoga option.', cancel: 'Moves to the glasshouse if wet.' },
  { id: 'a9', title: 'Lane Swim Masters', sport: 'swimming', venue: 'Westside Aquatic Centre', x: 455, y: 640, d: 2, t: '06:00', mins: 60, level: 'Advanced', ages: '18+', spots: 3, total: 12, price: 7, host: 'Westside Masters', img: 'swim', setting: 'Indoor', surface: '25 m pool, 6 lanes', equipment: 'Goggles, cap. Kickboards provided.', access: 'Pool hoist and accessible changing.', cancel: 'Refund up to 12 hours before.' },
  { id: 'a10', title: 'Hill Climb Social Ride', sport: 'cycling', venue: 'Northgate Common', x: 1085, y: 455, d: 7, t: '08:00', mins: 150, level: 'Intermediate', ages: '18+', spots: 11, total: 25, price: 0, host: 'Spoke & Bean', img: 'cycling', setting: 'Outdoor', surface: 'Road, 42 km loop', equipment: 'Road bike, helmet, spares.', access: 'No-drop ride with a sweeper.', cancel: 'Free. Cancelled in ice.' },
  { id: 'a11', title: 'Pickleball Drop-in', sport: 'pickleball', venue: 'Elm Street Rec Centre', x: 1200, y: 760, d: 3, t: '12:00', mins: 90, level: 'Beginner friendly', ages: 'All ages', spots: 7, total: 16, price: 4, host: 'Elm Street Rec', img: 'pickle', setting: 'Indoor', surface: '4 courts', equipment: 'Paddles to borrow.', access: 'Fully step-free.', cancel: 'Refund up to 2 hours before.' },
  { id: 'a12', title: 'Bouldering Basics', sport: 'climbing', venue: 'The Crag Climbing Gym', x: 380, y: 1050, d: 4, t: '18:30', mins: 90, level: 'Beginner', ages: '12+', spots: 4, total: 10, price: 12, host: 'The Crag', img: 'climb', setting: 'Indoor', surface: 'Bouldering walls, padded floor', equipment: 'Shoes and chalk included.', access: 'Ground-floor walls; ask staff for adaptive sessions.', cancel: 'Refund up to 24 hours before.' },
  { id: 'a13', title: 'Junior Futsal (8–11)', sport: 'football', venue: 'Harbour Sports Hall', x: 590, y: 985, d: 6, t: '10:00', mins: 60, level: 'Beginner', ages: '8–11', spots: 5, total: 16, price: 5, host: 'Harbour Juniors', img: 'football', setting: 'Indoor', surface: 'Sports hall', equipment: 'Trainers, water. Parent consent required.', access: 'Lift and accessible toilets. Quiet room available.', cancel: 'Refund up to 24 hours before.' },
  { id: 'a14', title: '3×3 Street Tournament', sport: 'basketball', venue: 'Oval Courts', x: 985, y: 1065, d: 6, t: '13:00', mins: 240, level: 'Competitive', ages: '16+', spots: 3, total: 16, price: 10, host: 'City Hoops League', img: 'bball2', setting: 'Outdoor', surface: 'Asphalt, 2 courts', equipment: 'Team of 3–4. Price is per team.', access: 'Level access, seating for spectators.', cancel: 'Refund until registration closes.' },
];

const STORES = [
  { id: 's1', name: 'Riverside Sports Co.', x: 765, y: 700, promo: '20% off football boots this week', sponsored: true },
];

const COMMUNITY_SPOTS = [
  { id: 'c1', name: 'Free table tennis tables', sport: 'pickleball', x: 1180, y: 610, by: 'Priya N.', setting: 'Outdoor', note: '2 concrete tables, bring your own bats.' },
];

const PEOPLE = [
  { id: 'u1', name: 'Jordan Lee', img: 'av3', sport: 'Football · Basketball', dist: '0.6 km' },
  { id: 'u2', name: 'Sofia Marin', img: 'av2', sport: 'Tennis · Running', dist: '1.1 km' },
  { id: 'u3', name: 'Elena Park', img: 'av4', sport: 'Badminton', dist: '1.4 km' },
  { id: 'u4', name: 'Marcus Hale', img: 'av1', sport: 'Football · Cricket', dist: '2.0 km' },
];

const FAMILY = [
  { id: 'f0', name: 'Alex Rivera', note: 'You', img: 'av1' },
  { id: 'f1', name: 'Mia Rivera', note: 'Age 11 · consent on file', initials: 'MR' },
  { id: 'f2', name: 'Leo Rivera', note: 'Age 8 · consent on file', initials: 'LR' },
];

const TEAM_COLORS = ['#13A04B', '#1D4FF2', '#E3336A', '#F06A1C', '#6A45F5', '#0E9FE0', '#D43B3B', '#0D1530'];

const SAMPLE_TEAMS = [
  { id: 't1', name: 'Riverside Rovers', sport: 'football', color: '#13A04B', privacy: 'Invite only',
    members: [
      { name: 'Alex Rivera', img: 'av1', role: 'Captain', status: 'yes' },
      { name: 'Jordan Lee', img: 'av3', role: 'Vice-captain', status: 'yes' },
      { name: 'Sofia Marin', img: 'av2', role: 'Player', status: 'maybe' },
      { name: 'Elena Park', img: 'av4', role: 'Player', status: 'yes' },
      { name: 'Sam Okafor', initials: 'SO', role: 'Player', status: 'no' },
      { name: 'Kai Tanaka', initials: 'KT', role: 'Player', status: 'yes' },
    ],
    next: { vs: 'Harbour United', d: 3, t: '19:00', venue: 'Riverside Park · Pitch 1' } },
  { id: 't2', name: 'Net Ninjas', sport: 'badminton', color: '#0E9FE0', privacy: 'Public',
    members: [
      { name: 'Alex Rivera', img: 'av1', role: 'Captain', status: 'yes' },
      { name: 'Elena Park', img: 'av4', role: 'Player', status: 'yes' },
      { name: 'Ravi Shah', initials: 'RS', role: 'Player', status: 'maybe' },
      { name: 'Ana Costa', initials: 'AC', role: 'Player', status: 'yes' },
    ],
    next: { vs: 'Shuttle Social mixer', d: 1, t: '19:30', venue: 'Harbour Sports Hall' } },
];

/* Enterprise: a fictional company running an internal league. */
const ORG = {
  name: 'Halcyon Systems',
  league: 'Winter Corporate Cup',
  employees: 412,
  teams: [
    { id: 'e1', name: 'Engineering Eagles', dept: 'Engineering', c: '#1D4FF2', ab: 'EE', w: 6, d: 1, l: 1, form: 'WWDWL', players: 14 },
    { id: 'e2', name: 'Sales Sharks', dept: 'Sales', c: '#E3336A', ab: 'SS', w: 5, d: 2, l: 1, form: 'WDWWD', players: 12 },
    { id: 'e3', name: 'Design Dynamos', dept: 'Design', c: '#9757E0', ab: 'DD', w: 5, d: 0, l: 3, form: 'LWWLW', players: 9 },
    { id: 'e4', name: 'Finance Falcons', dept: 'Finance', c: '#13A04B', ab: 'FF', w: 4, d: 2, l: 2, form: 'DWLWD', players: 10 },
    { id: 'e5', name: 'Ops Otters', dept: 'Operations', c: '#F06A1C', ab: 'OO', w: 3, d: 2, l: 3, form: 'WLDLW', players: 13 },
    { id: 'e6', name: 'People Panthers', dept: 'People', c: '#0E9FE0', ab: 'PP', w: 2, d: 3, l: 3, form: 'DDLWL', players: 8 },
    { id: 'e7', name: 'Marketing Mavericks', dept: 'Marketing', c: '#DE9B05', ab: 'MM', w: 2, d: 1, l: 5, form: 'LLWLD', players: 11 },
    { id: 'e8', name: 'Legal Lions', dept: 'Legal', c: '#0D1530', ab: 'LL', w: 1, d: 1, l: 6, form: 'LLLDL', players: 7 },
  ],
  participation: [ ['Engineering', 78], ['Sales', 71], ['Design', 69], ['Operations', 58], ['Finance', 54], ['Marketing', 47], ['People', 44], ['Legal', 31] ],
};

const SAMPLE_FIXTURES = [
  { id: 'x1', a: 'e1', b: 'e2', sport: 'football', d: 1, t: '18:30', venue: 'Riverside Park · Pitch 2' },
  { id: 'x2', a: 'e3', b: 'e5', sport: 'basketball', d: 1, t: '12:15', venue: 'Northgate Courts' },
  { id: 'x3', a: 'e4', b: 'e8', sport: 'badminton', d: 2, t: '17:45', venue: 'Harbour Sports Hall' },
  { id: 'x4', a: 'e6', b: 'e7', sport: 'football', d: 3, t: '18:30', venue: 'Riverside Park · Pitch 2' },
  { id: 'x5', a: 'e2', b: 'e3', sport: 'volleyball', d: 4, t: '12:30', venue: 'Lakeside Sand Courts' },
  { id: 'x6', a: 'e1', b: 'e4', sport: 'cricket', d: 6, t: '10:00', venue: 'Oval Green' },
];

const PRODUCTS = [
  { id: 'p1', name: 'Match Futsal Ball, Size 4', brand: 'Kinetiq', cat: 'equipment', price: 29, was: 39, img: 'p-futsal', rating: 4.7, reviews: 212, seller: 'Riverside Sports Co.', sizes: null },
  { id: 'p2', name: 'Velocity Trail Runner', brand: 'Stride', cat: 'footwear', price: 89, was: 110, img: 'p-running2', rating: 4.6, reviews: 98, seller: 'Stride Official', sizes: ['7', '8', '9', '10', '11'] },
  { id: 'p3', name: 'Everyday Training Tee', brand: 'Courtline', cat: 'apparel', price: 24, img: 'p-tshirt', rating: 4.5, reviews: 340, seller: 'Courtline', sizes: ['XS', 'S', 'M', 'L', 'XL'] },
  { id: 'p4', name: 'Pro Sparring Gloves 12oz', brand: 'Kinetiq', cat: 'equipment', price: 54, img: 'p-gloves', rating: 4.8, reviews: 61, seller: 'The Crag Pro Shop', sizes: ['10oz', '12oz', '14oz'] },
  { id: 'p5', name: 'Insulated Sport Bottle 750 ml', brand: 'Hydra', cat: 'accessories', price: 19, img: 'p-bottle', rating: 4.9, reviews: 520, seller: 'Hydra', sizes: null },
  { id: 'p6', name: 'Club Kit Backpack 28 L', brand: 'Courtline', cat: 'accessories', price: 49, was: 65, img: 'p-bag', rating: 4.6, reviews: 143, seller: 'Riverside Sports Co.', sizes: null },
];

const PLANS = {
  lite: { name: 'Lite', price: 'Free', per: '', icon: 'compass', blurb: 'Find games near you and jump in.',
    feats: ['Live map of nearby sports', 'Join games and events', 'Family profiles and calendar', 'Marketplace and deals'],
    no: ['Pin new locations', 'Create teams and invite players', 'Company leagues and leaderboards'] },
  pro: { name: 'Pro', price: CUR + '4.99', per: '/month', icon: 'zap', blurb: 'Organise teams and grow your local scene.',
    feats: ['Everything in Lite', 'Pin new places to play on the map', 'Create and manage teams', 'Invite players by link, code or nearby', 'Host games and schedule matches', '10% off in the marketplace'],
    no: ['Company leagues and leaderboards'] },
  enterprise: { name: 'Enterprise', price: CUR + '3', per: '/employee/month', icon: 'building-2', blurb: 'Run sport across your company.',
    feats: ['Everything in Pro', 'Department teams and rosters', 'League schedule builder', 'Live team leaderboards', 'Participation insights', 'Bulk team-kit orders'],
    no: [] },
};
