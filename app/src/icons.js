/* LetsPlay Sport Icons: an original set drawn for this app (no third-party icon library).
   Rules: 24px grid, live area 2-22, 2.25 stroke, square caps and mitred joins (sharp, athletic),
   octagon "badge" containers instead of circles where a container is needed, and an 8 degree
   forward lean applied by ic() so every icon moves in the same direction as the italic titles.
   Sport glyphs (s-*) follow the same rules and double as map pins, chips and badges. */
const OCT = 'M8.3 3h7.4L21 8.3v7.4L15.7 21H8.3L3 15.7V8.3z';
const ICONS = {
  /* actions */
  'plus': '<path d="M12 5v14M5 12h14"/>',
  'minus': '<path d="M5 12h14"/>',
  'x': '<path d="M6 6l12 12M18 6L6 18"/>',
  'check': '<path d="M5 12.5l4.5 4.5L19 7"/>',
  'circle-check': `<path d="${OCT}"/><path d="M8 12.3l3 3 5-6.3"/>`,
  'info': `<path d="${OCT}"/><path d="M12 11v6M12 7.2v.6"/>`,
  'chevron-right': '<path d="M9 5l7 7-7 7"/>',
  'arrow-right': '<path d="M4 12h15M13 6l6 6-6 6"/>',
  'arrow-left': '<path d="M20 12H5M11 6l-6 6 6 6"/>',
  'search': '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L20.5 20.5"/>',
  'copy': '<path d="M8 8h12v12H8zM4 16V4h12"/>',
  'share-2': '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.3 10.7l7.4-4.4M8.3 13.3l7.4 4.4"/>',
  'send': '<path d="M21 3L3 10.5l7.2 2.3L12.5 20zM21 3L10.2 12.8"/>',
  'trash-2': '<path d="M3 6h18M8.5 6V3h7v3M5 6l1.2 15h11.6L19 6M10 10.5v6.5M14 10.5v6.5"/>',
  'rotate-ccw': '<path d="M3 4v6h6"/><path d="M4 10a8.5 8.5 0 1 1 2 7.5"/>',
  'shuffle': '<path d="M3 7h4l10 10h4M3 17h4l3-3M14 10l3-3h4M18 4l3 3-3 3M18 14l3 3-3 3"/>',
  'sliders-horizontal': '<path d="M3 7h9M16 7h5M3 17h5M12 17h9M14 4v6M10 14v6"/>',
  'settings': `<path d="${OCT}"/><circle cx="12" cy="12" r="3.2"/>`,
  'eye': '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  'camera': '<path d="M3 7.5h4L9 4.5h6l2 3h4V20H3z"/><circle cx="12" cy="13.5" r="3.8"/>',
  'lock': '<path d="M5 11h14v10H5zM8 11V7.5a4 4 0 0 1 8 0V11"/>',
  'lock-keyhole': '<path d="M5 11h14v10H5zM8 11V7.5a4 4 0 0 1 8 0V11M12 14.5v3"/>',

  /* places and wayfinding */
  'map-pin': '<path d="M12 21.5l-6-8a7.2 7.2 0 1 1 12 0z"/><path d="M10.6 8.2h2.8V11h-2.8z"/>',
  'map-pin-plus': '<path d="M12 21.5l-6-8a7.2 7.2 0 1 1 12 0z"/><path d="M12 6.8v5.4M9.3 9.5h5.4"/>',
  'locate-fixed': '<circle cx="12" cy="12" r="6.5"/><path d="M12 2v3.5M12 18.5V22M2 12h3.5M18.5 12H22M11 11h2v2h-2z"/>',
  'navigation': '<path d="M3.5 11L20.5 3.5 13 20.5l-2-7.5z"/>',
  'compass': '<circle cx="12" cy="12" r="9"/><path d="M16 8l-2.5 5.5L8 16l2.5-5.5z"/>',
  'map': '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14"/>',
  'layers': '<path d="M12 3l9 5-9 5-9-5zM3 13.5l9 5 9-5"/>',
  'globe': '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3.2 3.2 3.2 14.8 0 18M12 3c-3.2 3.2-3.2 14.8 0 18"/>',
  'store': '<path d="M3 9.5L5 4h14l2 5.5zM3 9.5a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M5 12.5V20h14v-7.5M10 20v-5h4v5"/>',
  'building-2': '<path d="M4 21V4h10v17M14 9h6v12M2 21h20M8 8h2M8 12h2M8 16h2M17 13h.5M17 17h.5"/>',
  'accessibility': '<circle cx="12" cy="4" r="1.8"/><path d="M5 8.5l7 1.5 7-1.5M12 10v5M12 15l-3 6M12 15l3 6"/>',

  /* time */
  'calendar': '<path d="M4 6h16v14H4zM4 10.5h16M8 3v5M16 3v5"/>',
  'calendar-days': '<path d="M4 6h16v14H4zM4 10.5h16M8 3v5M16 3v5M8 14.5h2M14 14.5h2M8 17.5h2"/>',
  'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  'timer': '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 10v3.5l2.5 1.5M9.5 2.5h5M18.5 6.5l1.5-1.5"/>',
  'bell': '<path d="M6 17v-6a6 6 0 0 1 12 0v6l2 2H4zM10 21.5h4"/>',
  'cloud-sun': '<path d="M7 16h10a4 4 0 0 0 .4-8A6 6 0 0 0 6 9.5 3.3 3.3 0 0 0 7 16zM8 19l-1 2.5M12 19l-1 2.5M16 19l-1 2.5"/>',

  /* people */
  'user': '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
  'users': '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.8 2.9-6 6.5-6s6.5 2.2 6.5 6M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2c2.2.7 3.5 2.6 3.5 5.8"/>',
  'user-plus': '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.8 2.9-6 6.5-6s6.5 2.2 6.5 6M19 8v6M16 11h6"/>',
  'message-circle': '<path d="M4 5h16v11H9.5L4 20z"/>',
  'megaphone': '<path d="M3 10v4h3.5L15 19V5l-8.5 5zM18.5 9a4 4 0 0 1 0 6M7 14l1 6.5h3l-1-5.5"/>',
  'shield-check': '<path d="M12 2.5l8 3v5.8c0 5-3.4 8.8-8 10.7-4.6-1.9-8-5.7-8-10.7V5.5z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',

  /* commerce */
  'shopping-bag': '<path d="M5 8h14l-1 13H6zM9 8V6.5a3 3 0 0 1 6 0V8"/>',
  'tag': '<path d="M3 3h8l10 10-8 8L3 11z"/><path d="M7 7h1.5v1.5H7z"/>',
  'percent': '<path d="M19 5L5 19"/><circle cx="7" cy="7" r="2.3"/><circle cx="17" cy="17" r="2.3"/>',
  'package': '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9"/>',
  'truck': '<path d="M2 5h12v11H2zM14 9h4l3 4v3h-7"/><circle cx="6" cy="18" r="2"/><circle cx="17.5" cy="18" r="2"/>',
  'footprints': '<path d="M2.5 9h4.5l1.5 2.5h3l2.5-1L20 13c1 .4 1.5 1.1 1.5 2.1V17h-19z"/><path d="M2.5 20h19M9 11.5l1.2-2.5M12 11.5l1.2-2.5"/>',
  'shirt':'<path d="M8 3L3 6l2 5 3-1v11h8V10l3 1 2-5-5-3c0 2-1.8 3.2-4 3.2S8 5 8 3z"/>',
  'wallet': '<path d="M3 7h15V4H3v16h18V7H3M15.5 13.5h2"/>',
  'smartphone': '<path d="M7 2h10v20H7zM11 18h2"/>',
  'indian-rupee': '<path d="M6 4h12M6 8.5h12M9 4c6.2 0 6.2 9 0 9H7l8 8"/>',
  'ticket': '<path d="M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4zM14.5 7v10"/>',
  'heart': '<path d="M12 20s-8-5-8-11a4.4 4.4 0 0 1 8-2.6A4.4 4.4 0 0 1 20 9c0 6-8 11-8 11z"/>',
  'star': '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',

  /* sport and status */
  'trophy': '<path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M12 14v4M8 21h8M9.5 18h5"/>',
  'crown': '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
  'award': '<circle cx="12" cy="9" r="6"/><path d="M8.6 14L7 22l5-3 5 3-1.6-8"/>',
  'zap': '<path d="M13.5 2L4 14h7l-1 8 9.5-12h-7z"/>',
  'flame': '<path d="M12 22c-4.3 0-7-2.8-7-6.5 0-4 3-6 4-9.5 2 1.5 3 3.5 3 5.5 1-1 1.7-2.3 2-3.5 2 1.8 3 4.3 3 7.5 0 3.7-2.7 6.5-7 6.5z"/>',
  'target': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M11 11h2v2h-2z"/>',
  'swords': '<path d="M4 4l9.5 9.5M4 4h4M4 4v4M20 4l-9.5 9.5M20 4h-4M20 4v4M7 15l-3.5 3.5 2 2L9 17M17 15l3.5 3.5-2 2L15 17"/>',
  'dumbbell': '<path d="M6 7v10M3 9.5v5M18 7v10M21 9.5v5M6 12h12"/>',
  'list-checks': '<path d="M3 6.5l2 2 3-3.5M3 15l2 2 3-3.5M11 7h10M11 15.5h10M11 20h6"/>',
  'trending-up': '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',

  /* status bar (device frame only) */
  'signal': '<path d="M4 19v-2M9 19v-5M14 19v-8M19 19V8"/>',
  'wifi': '<path d="M2 9.5a15 15 0 0 1 20 0M5.5 13a10 10 0 0 1 13 0M9 16.5a5 5 0 0 1 6 0M11.5 20h1"/>',
  'battery-full': '<path d="M2 7h17v10H2zM22 10v4M5 10h11v4H5z"/>',

  /* sport glyphs */
  's-football': '<circle cx="12" cy="12" r="9"/><path d="M12 8.2l3.4 2.5-1.3 4h-4.2l-1.3-4z"/><path d="M12 3v5.2M15.4 10.7l5-1.6M14.1 14.7l3 4.2M9.9 14.7l-3 4.2M8.6 10.7l-5-1.6"/>',
  's-basketball': '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18"/><path d="M5.6 5.6c2.3 1.8 3.6 3.9 3.6 6.4s-1.3 4.6-3.6 6.4M18.4 5.6c-2.3 1.8-3.6 3.9-3.6 6.4s1.3 4.6 3.6 6.4"/>',
  's-tennis': '<circle cx="12" cy="12" r="9"/><path d="M5.2 6c2.4 1.6 3.8 3.6 3.8 6s-1.4 4.4-3.8 6M18.8 6c-2.4 1.6-3.8 3.6-3.8 6s1.4 4.4 3.8 6"/>',
  's-shuttle': '<path d="M9.5 15.5L6 4h12l-3.5 11.5z"/><path d="M10.5 15.5L10 4M13.5 15.5L14 4M7 8h10"/><path d="M9.5 15.5h5v1.5a2.5 2.5 0 0 1-5 0z"/>',
  's-cricket': '<path d="M14.5 3.5l4 4-8.8 8.8a1.5 1.5 0 0 1-2.1 0l-1.9-1.9a1.5 1.5 0 0 1 0-2.1z"/><path d="M6.5 15.5L3 19"/><circle cx="18" cy="17.5" r="2.5"/>',
  's-paddle': '<circle cx="14" cy="9.5" r="6"/><path d="M9.8 13.7L4.5 19"/><circle cx="5.5" cy="6" r="1.6"/>',
  's-kabaddi': '<circle cx="12" cy="4.5" r="2"/><path d="M12 7.5V13l-4.5 7.5M12 13l4.5 7.5M5 11l7-3 7 3"/>',
  's-volley': '<circle cx="12" cy="12" r="9"/><path d="M12 3c-1.5 4-.5 7.5 3 9.5M3.6 9c4 .8 7-.3 8.4-3M15 12.5c-3.5 1.5-6 3.6-6.5 7.8M21 13.2c-2-1.8-4-2-6-.7"/>',
  's-run': '<circle cx="15.5" cy="4" r="2"/><path d="M13.5 8L10 12l3 3-1.5 6.5M10 12l-5 .5M13.5 8l4 3 3-1M13 15l-5.5 4"/>',
  's-yoga': '<circle cx="12" cy="4" r="2"/><path d="M12 7v6M5.5 10.5l6.5 2.5 6.5-2.5M7 20l5-7 5 7M4 20h16"/>',
  's-swim': '<circle cx="16.5" cy="6.5" r="2"/><path d="M3.5 11.5l5.5-3 4 2.5M2 16c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5M2 20.5c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5"/>',
  's-bike': '<circle cx="5.5" cy="16" r="3.5"/><circle cx="18.5" cy="16" r="3.5"/><path d="M5.5 16l4-7h6l3 7M9.5 9l3.5 7M14 5.5h3"/>',
  's-climb': '<path d="M2 20l7-12 4 6 3-4 6 10z"/><path d="M9 8l1.5-3"/>',
};
