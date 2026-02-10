import { useState } from 'react';
import { CelestialBody } from '../types';
import { celestialBodies } from '../data/bodies';
import { Glyph } from '../components/Glyph';
import { motion, AnimatePresence } from 'framer-motion';

export const MandalaView = () => {
  const [hovered, setHovered] = useState<CelestialBody | null>(null);

  // Calculate positions
  // Center is (50%, 50%)
  // Radius mapping: 0 -> 0%, 1 -> 45% of viewport min dimension
  const getPosition = (body: CelestialBody) => {
    const { layer, angle, radius, x, y } = body.mandala;
    
    // Manual override (Normalized -1 to 1)
    if (x !== undefined && y !== undefined) {
      return {
        left: `${50 + x * 40}%`,
        top: `${50 + y * 40}%`
      };
    }

    // Polar layout
    // Adjust radius layers if not manually set
    let r = radius || 0;
    if (!radius) {
      if (layer === 0) r = 0;
      else if (layer === 1) r = 0.20; // Navagraha
      else if (layer === 2) r = 0.35; // Zodiac
      else if (layer === 3) r = 0.45; // Lunar
    }
    
    // Convert polar to cartesian (CSS %)
    // Angle -90 because CSS 0deg is East (Right), but we usually want 0 at Top
    const rad = (angle - 90) * (Math.PI / 180);
    const px = Math.cos(rad) * r * 40; // 40 is scale factor to keep within padding
    const py = Math.sin(rad) * r * 40;

    return {
      left: `${50 + px}%`,
      top: `${50 + py}%`
    };
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-mandala-bg">
      {/* Background Decor */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
        <div className="w-[80vmin] h-[80vmin] border border-mandala-gold rounded-full animate-spin-slow" />
        <div className="absolute w-[60vmin] h-[60vmin] border border-dashed border-mandala-gold rounded-full opacity-50" />
        <div className="absolute w-[30vmin] h-[30vmin] border border-mandala-gold rounded-full opacity-30" />
      </div>

      <div className="relative w-full h-full max-w-[100vmin] max-h-[100vmin]">
        <AnimatePresence>
          {celestialBodies.map((body) => {
            const style = getPosition(body);
            return (
              <motion.div
                key={body.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.8, delay: body.mandala.layer * 0.1 }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={style}
                onMouseEnter={() => setHovered(body)}
                onMouseLeave={() => setHovered(null)}
              >
                <Glyph body={body} size={body.mandala.layer === 0 ? 80 : 48} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Info Tooltip (Floating) */}
      {hovered && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur border border-mandala-gold/30 p-4 rounded text-center z-50 pointer-events-none">
          <h3 className="text-xl font-bold text-mandala-gold">{hovered.labelZh}</h3>
          <p className="text-sm text-gray-400">{hovered.sanskritKey}</p>
          <p className="text-xs text-gray-500 mt-1 uppercase">{hovered.group}</p>
        </div>
      )}
    </div>
  );
};
