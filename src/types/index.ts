export type BodyGroup = 'big_dipper' | 'navagraha' | 'zodiac' | 'lunar_mansion';

export interface MandalaPosition {
  layer: number; // 0: Center, 1: Inner (Navagraha), 2: Middle (Zodiac), 3: Outer (Lunar Mansion), 4: Big Dipper (Top/Overlay)
  angle: number; // Degrees, 0 is North/Up
  radius?: number; // Normalized radius (0-1)
  x?: number; // Manual override X
  y?: number; // Manual override Y
}

export interface AstronomyPosition {
  r: number; // Distance from center (Sun)
  theta: number; // Horizontal angle (0-2PI)
  phi: number; // Vertical angle (0-PI), PI/2 is equator
  orbitalSpeed?: number; // For animation speed
}

export interface CelestialBody {
  id: string;
  group: BodyGroup;
  labelZh: string;
  sanskritKey: string;
  fallbackChar: string; // Sanskrit character for fallback
  mandala: MandalaPosition;
  astronomy: AstronomyPosition;
  color?: string;
  scale?: number;
}
