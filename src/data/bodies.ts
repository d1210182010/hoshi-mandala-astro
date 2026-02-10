import { CelestialBody } from '../types';

// Helper to create circular layout
// angle 0 = Top (North), 90 = Right (East), 180 = Bottom (South), 270 = Left (West)
const C = {
  GOLD: '#FFD700',
  RED: '#FF4500',
  BLUE: '#1E90FF',
  WHITE: '#F8F8FF',
  PURPLE: '#9370DB',
  SILVER: '#C0C0C0',
  ORANGE: '#FFA500',
  DARK_GREY: '#333333'
};

// 1. Big Dipper (Upper Arc: 10 o'clock to 2 o'clock)
const bigDipperConfig = [
  // Dubhe (Alpha UMa)
  { id: 'bd_1', label: '貪狼', key: 'dubhe',  astro: { r: 180, t: 2.89, p: 0.49 } },
  // Merak (Beta UMa)
  { id: 'bd_2', label: '巨門', key: 'merak',  astro: { r: 180, t: 2.88, p: 0.58 } },
  // Phecda (Gamma UMa)
  { id: 'bd_3', label: '祿存', key: 'phecda', astro: { r: 180, t: 3.11, p: 0.63 } },
  // Megrez (Delta UMa)
  { id: 'bd_4', label: '文曲', key: 'megrez', astro: { r: 180, t: 3.20, p: 0.57 } },
  // Alioth (Epsilon UMa)
  { id: 'bd_5', label: '廉貞', key: 'alioth', astro: { r: 180, t: 3.37, p: 0.59 } },
  // Mizar (Zeta UMa)
  { id: 'bd_6', label: '武曲', key: 'mizar',  astro: { r: 180, t: 3.50, p: 0.61 } },
  // Alkaid (Eta UMa)
  { id: 'bd_7', label: '破軍', key: 'alkaid', astro: { r: 180, t: 3.61, p: 0.71 } },
];

// 2. Navagraha (Lower Arc: 9 o'clock to 3 o'clock via Bottom)
// Order: Moon, Saturn, Venus, Ketu, Mars, Rahu, Jupiter, Mercury, Sun
const navagrahaOrder = [
  { id: 'n_moon', label: '月曜', key: 'soma', char: 'स', color: C.SILVER, astro: {r: 1.5, t: 0, p: 0} },
  { id: 'n_saturn', label: '土曜', key: 'sani', char: 'श', color: C.WHITE, astro: {r: 8.0, t: 4, p: 0} },
  { id: 'n_venus', label: '金曜', key: 'sukra', char: 'शु', color: C.GOLD, astro: {r: 3.5, t: 1, p: 0} },
  { id: 'n_ketu', label: '計都', key: 'ketu', char: 'के', color: C.DARK_GREY, astro: {r: 12, t: 0.5, p: -0.2} },
  { id: 'n_mars', label: '火曜', key: 'angara', char: 'अं', color: C.RED, astro: {r: 5.0, t: 2, p: 0} },
  { id: 'n_rahu', label: '羅睺', key: 'rahu', char: 'रा', color: C.DARK_GREY, astro: {r: 12, t: 3, p: 0.2} },
  { id: 'n_jupiter', label: '木曜', key: 'brhaspati', char: 'बृ', color: C.PURPLE, astro: {r: 6.5, t: 5, p: 0} },
  { id: 'n_mercury', label: '水曜', key: 'budha', char: 'बु', color: C.BLUE, astro: {r: 2.0, t: 6, p: 0} },
  { id: 'n_sun', label: '日曜', key: 'aditya', char: 'आ', color: C.ORANGE, astro: {r: 0, t: 0, p: 0} },
];

// Helper to get angle
// 0 is Top.
const getBigDipperAngle = (index: number) => {
  // 10 o'clock = 300 (-60)
  // 2 o'clock = 60
  const start = -60;
  const end = 60;
  const step = (end - start) / (bigDipperConfig.length - 1);
  const angle = start + (index * step);
  // Normalize to 0-360 for CSS/Three
  return angle < 0 ? angle + 360 : angle;
};

const getNavagrahaAngle = (index: number) => {
  // 9 to 3 via Bottom.
  // 9 = 270. 3 = 90.
  // Direction: Counter-Clockwise (270 -> 247.5 -> ... -> 180 -> ... -> 90)
  // 9 items. 8 intervals. 180 / 8 = 22.5 degrees per step.
  // 270 - (index * 22.5)
  let angle = 270 - (index * 22.5);
  if (angle < 0) angle += 360;
  return angle;
};


// Zodiac & Mansions helpers
const circle = (index: number, total: number, startAngle: number = 0) => {
  return (index / total) * 360 + startAngle;
};

const zodiacLabels = ['獅子', '處女', '天秤', '天蠍', '射手', '摩羯', '水瓶', '雙魚', '白羊', '金牛', '雙子', '巨蟹'];
const zodiacKeys = ['leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces', 'aries', 'taurus', 'gemini', 'cancer'];
const zodiacFallback = ['सि', 'क', 'तु', 'वृ', 'ध', 'म', 'कु', 'मी', 'मे', 'वृ', 'मि', 'क'];

// Lunar Mansions
const mansionLabels = [
  '張', '翼', '軫', '角', '亢', '氐', '房',
  '心', '尾', '箕', '斗', '牛', '女', '虛',
  '危', '室', '壁', '奎', '婁', '胃', '昴',
  '畢', '觜', '參', '井', '鬼', '柳', '星'
];

export const celestialBodies: CelestialBody[] = [
  // --- Center: Ichiji Kinrin ---
  {
    id: 'c_kinrin', group: 'navagraha', labelZh: '一字頂輪王', sanskritKey: 'kinrin', fallbackChar: 'भ्रूं', 
    mandala: { layer: 0, angle: 0, radius: 0 },
    astronomy: { r: 0, theta: 0, phi: 0 },
    color: C.GOLD, scale: 2.0
  },

  // --- Big Dipper (Layer 1 - Upper) ---
  ...bigDipperConfig.map((s, i) => ({
    id: s.id, group: 'big_dipper' as const, labelZh: s.label, sanskritKey: s.key, fallbackChar: '★',
    mandala: { layer: 1, angle: getBigDipperAngle(i), radius: 0.9 }, // Increased from 0.65
    astronomy: { r: 100, theta: s.astro.t, phi: s.astro.p }, 
    color: C.WHITE
  })),

  // --- Navagraha (Layer 1 - Lower) ---
  ...navagrahaOrder.map((s, i) => ({
    id: s.id, group: 'navagraha' as const, labelZh: s.label, sanskritKey: s.key, fallbackChar: s.char,
    mandala: { layer: 1, angle: getNavagrahaAngle(i), radius: 0.9 }, // Increased from 0.65
    astronomy: { r: s.id === 'n_sun' ? 0 : s.astro.r, theta: s.astro.t, phi: Math.PI/2 + (s.astro.p || 0) },
    color: C.GOLD // Uniform color for all Navagraha
  })),

  // --- Zodiac (Layer 2) ---
  ...zodiacLabels.map((label, i) => ({
    id: `z_${i}`, group: 'zodiac' as const, labelZh: label, sanskritKey: zodiacKeys[i], fallbackChar: zodiacFallback[i],
    mandala: { layer: 2, angle: 180 - (i * 30), radius: 1.35 }, // Increased from 1.15
    astronomy: { r: 90, theta: circle(i, 12, 0) * (Math.PI / 180), phi: Math.PI / 2 }, 
    color: C.GOLD
  })),

  // --- Lunar Mansions (Layer 3) ---
  // Layout Adjustment:
  // Index 16 (Bi/壁) needs to be at 0 deg (12 o'clock).
  // Offset = -(16/28)*360 = -205.71428
  ...mansionLabels.map((label, i) => ({
    id: `lm_${i}`, group: 'lunar_mansion' as const, labelZh: label, sanskritKey: `mansion_${i}`, fallbackChar: '◎',
    mandala: { layer: 3, angle: circle(i, 28, -205.714), radius: 1.8 }, // Increased from 1.6
    astronomy: { r: 110, theta: circle(i, 28, 0) * (Math.PI / 180), phi: Math.PI / 2 + (Math.random()-0.5)*0.1 }, 
    color: '#888'
  })),
];
