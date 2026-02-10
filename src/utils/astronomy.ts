import { Body, HelioVector, GeoVector } from 'astronomy-engine';

// Scale factor: 1 AU = 8 units in 3D scene (Reduced from 20 to fit inside Zodiac)
export const AU_SCALE = 8;

export const getHeliocentricPosition = (target: string, date: Date) => {
  try {
    // For Sun (Center)
    if (target === Body.Sun) {
      return { x: 0, y: 0, z: 0 };
    }

    // Get heliocentric vector
    const vec = HelioVector(target as Body, date);
    
    if (!vec) throw new Error("No vector returned");

    // Astronomy Engine: Z is North (ecliptic pole).
    // Three.js: Y is Up.
    return {
      x: vec.x * AU_SCALE,
      y: vec.z * AU_SCALE, 
      z: -vec.y * AU_SCALE // Rotate to align ecliptic with XZ plane
    };
  } catch (e) {
    // console.warn(`Error calculating position for ${target}:`, e);
    return { x: 0, y: 0, z: 0 };
  }
};

export const getGeocentricPosition = (target: string, date: Date) => {
  try {
    // Get geocentric vector (AU)
    const vec = GeoVector(target as Body, date, false); // aberration=false
    return {
      x: vec.x * AU_SCALE,
      y: vec.z * AU_SCALE, 
      z: -vec.y * AU_SCALE
    };
  } catch (e) {
    // console.warn(`Error calculating geo position for ${target}:`, e);
    return { x: 0, y: 0, z: 0 };
  }
};

export const getLunarNodePosition = (date: Date, type: 'rahu' | 'ketu') => {
  // Calculate Julian Centuries since J2000.0
  // J2000.0 is 2000-01-01 12:00:00 UTC (Julian Day 2451545.0)
  const jd = date.getTime() / 86400000 + 2440587.5;
  const t = (jd - 2451545.0) / 36525.0;

  // Mean Longitude of the Ascending Node (Omega) formula
  // Omega = 125.04452 - 1934.136261 * T (degrees)
  let omega = 125.04452 - 1934.136261 * t;
  
  // Normalize to 0-360
  omega = omega % 360;
  if (omega < 0) omega += 360;

  // Rahu is at Omega (Ascending Node)
  // Ketu is at Omega + 180 (Descending Node)
  const angle = type === 'rahu' ? omega : omega + 180;
  const rad = angle * (Math.PI / 180);

  // Position relative to Earth (Geocentric)
  // Orbit radius: Moon is ~0.00257 AU. 
  // We scale it up slightly for visibility in the 3D scene relative to the Moon.
  // Using AU_SCALE logic: Moon is visualized at 50x distance in UnifiedView.
  // We'll return unit vector components here, scaled in UnifiedView.
  
  // In our 3D coordinates:
  // X = cos(angle), Z = -sin(angle) (since Z is -Y in standard physics, or check UnifiedView logic)
  // UnifiedView: x, z is horizontal plane. y is up.
  // Longitude 0 is usually +X. 90 is -Z? 
  // Let's stick to standard trig: x = cos, y = sin.
  // But we need to match the scene orientation. 
  // astronomy-engine: x=Vernal Equinox.
  return {
    x: Math.cos(rad),
    z: -Math.sin(rad) // Match standard orientation (CCW from Top)
  };
};

export { Body }; // Re-export Body for use in other files
