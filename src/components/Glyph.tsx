import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { CelestialBody } from '../types';

interface GlyphProps {
  body: CelestialBody;
  size?: number;
  showLabel?: boolean;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'kinrin-3d'; 
  resScale?: number; // New prop to handle resolution scaling
}

export const Glyph = ({ body, size = 60, showLabel = true, onClick, className, variant = 'default', resScale = 1 }: GlyphProps) => {
  const [imgError, setImgError] = useState(false);
  const { sanskritKey, fallbackChar, labelZh, color } = body;

  const glyphPath = `${import.meta.env.BASE_URL}glyphs/${sanskritKey}.svg`;

  // Reset error state if body changes
  useEffect(() => {
    setImgError(false);
  }, [sanskritKey]);

  const isKinrin3D = variant === 'kinrin-3d';

  return (
    <div 
      className={clsx(
        "relative flex flex-col items-center justify-center cursor-pointer group/glyph",
        // Disable hover scale for Kinrin 3D
        !isKinrin3D && "transition-transform hover:scale-110",
        className
      )}
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      {/* Glyph Circle Container */}
      <div 
        className={clsx(
          "relative flex items-center justify-center rounded-full transition-all duration-500",
          !isKinrin3D && "backdrop-blur-md overflow-hidden border-opacity-40"
        )}
        style={{ 
          width: size, 
          height: size, 
          // Kinrin 3D: No border, no background, no shadow
          borderColor: isKinrin3D ? 'transparent' : (color || '#fff'),
          backgroundColor: isKinrin3D ? 'transparent' : `${color}15`, 
          boxShadow: isKinrin3D ? 'none' : `0 0 15px ${color}30`,
          // Navagraha special border (only if not Kinrin 3D)
          // Explicitly set border style and width here, removed 'border' class to avoid conflict
          borderStyle: !isKinrin3D && body.group === 'navagraha' && body.id !== 'c_kinrin' ? 'double' : 'solid',
          borderWidth: !isKinrin3D && body.group === 'navagraha' && body.id !== 'c_kinrin' ? `${6 * resScale}px` : (isKinrin3D ? '0px' : `${1 * resScale}px`),
        }}
      >
        {!imgError && body.group !== 'lunar_mansion' ? (
          <img 
            src={glyphPath} 
            alt={labelZh}
            onError={(e) => {
              // Prevent infinite loop if fallback fails too
              e.currentTarget.style.display = 'none';
              setImgError(true);
            }}
            className={clsx(
              "object-contain filter",
              // Enhance contrast for normal glyphs, but maybe keep raw for Kinrin 3D to avoid artifacts?
              // Actually, brightness/contrast filters shouldn't cause blur, but transform scaling might.
              // For Kinrin 3D, we want it large and clean.
              isKinrin3D ? "w-full h-full" : "w-[70%] h-[70%] brightness-150 contrast-125 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
            )}
          />
        ) : body.group === 'lunar_mansion' ? (
           /* Simple geometric dot for Lunar Mansions (◎ style with container border) */
           <div 
             className="rounded-full"
             style={{ 
               width: '35%', 
               height: '35%', 
               backgroundColor: color || '#fff',
               opacity: 0.9
             }} 
           />
        ) : (
          <span 
            className="sanskrit-glyph text-center select-none"
            style={{ 
              fontSize: size * 0.5, 
              color: color || '#fff',
            }}
          >
            {fallbackChar}
          </span>
        )}
      </div>

      {/* Label (Always visible or on hover based on props) */}
      {showLabel && (
        <div 
          className={clsx(
            "absolute top-full flex flex-col items-center pointer-events-none whitespace-nowrap z-10",
            "opacity-80 group-hover/glyph:opacity-100 transition-opacity"
          )}
          style={{ marginTop: `${4 * resScale}px` }}
        >
          <span 
            className="font-bold tracking-widest text-white drop-shadow-md"
            style={{ 
              // Base font size 13px (increased from 10px), scaled by resScale. 
              fontSize: `${15 * resScale}px` 
            }}
          >
            {labelZh}
          </span>
        </div>
      )}
    </div>
  );
};
