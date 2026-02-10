import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Html, Billboard, Trail } from '@react-three/drei';
import * as THREE from 'three';
import { celestialBodies } from '../data/bodies';
import { Glyph } from '../components/Glyph';
import { CelestialBody } from '../types';
import { Body, getHeliocentricPosition, getGeocentricPosition, getLunarNodePosition } from '../utils/astronomy';
import { addDays, format } from 'date-fns';
import { Play, Pause } from 'lucide-react';
import { clsx } from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';

// --- Types & Constants ---
type Mode = 'mandala' | 'cosmos';

const MANDALA_SCALE = 35; // Scale factor for 2D layout in 3D space
const RES_SCALE = 4; // High-resolution multiplier to prevent blur on zoom

const GROUP_LABELS: Record<string, string> = {
  navagraha: '九曜',
  zodiac: '十二宮',
  lunar_mansion: '二十八宿',
  big_dipper: '北斗七星'
};

const PLANET_MAP: Record<string, string> = {
  n_sun: Body.Sun,
  n_mercury: Body.Mercury,
  n_venus: Body.Venus,
  n_earth: Body.Earth, 
  n_mars: Body.Mars,
  n_jupiter: Body.Jupiter,
  n_saturn: Body.Saturn,
  n_moon: Body.Moon,
};

// --- Helpers ---

// Calculate target position based on mode
const getTargetPosition = (
  body: CelestialBody, 
  mode: Mode, 
  date: Date
): THREE.Vector3 => {
  const target = new THREE.Vector3();

  if (mode === 'mandala') {
    // Polar to Cartesian (X, Y, 0)
    // angle 0 = Top (Y+), 90 = Right (X+)
    // formula: x = r * sin(rad), y = r * cos(rad)
    const { angle, radius } = body.mandala;
    // Normalized radius (0-1) scaled to World Units
    const r = (radius || 0) * MANDALA_SCALE;
    const rad = (angle || 0) * (Math.PI / 180);
    
    target.set(
      r * Math.sin(rad),
      r * Math.cos(rad),
      0
    );
  } else {
    // Cosmos Mode (3D)
    const engineBody = PLANET_MAP[body.id];
    
    if (engineBody) {
       if (body.id === 'n_moon') {
          // Moon is relative to Earth
          const earth = getHeliocentricPosition(Body.Earth, date);
          const moonGeo = getGeocentricPosition(Body.Moon, date);
          // Scale moon distance for visibility (not realistic scale)
          target.set(
             earth.x + moonGeo.x * 50, 
             earth.y + moonGeo.y * 50, 
             earth.z + moonGeo.z * 50
          );
       } else {
          // Heliocentric
          const p = getHeliocentricPosition(engineBody, date);
          target.set(p.x, p.y, p.z);
       }
    } else if (body.id === 'n_rahu' || body.id === 'n_ketu') {
       // Lunar Nodes (Rahu/Ketu) relative to Earth
       const earth = getHeliocentricPosition(Body.Earth, date);
       const node = getLunarNodePosition(date, body.id === 'n_rahu' ? 'rahu' : 'ketu');
       // Orbit radius slightly larger than Moon's visual radius (50) to distinguish
       const dist = 60; 
       target.set(
          earth.x + node.x * dist,
          earth.y, // Keep on ecliptic plane
          earth.z + node.z * dist
       );
    } else {
      // Stars / Zodiac / Mansions
      // Project them onto a celestial sphere
      const { r, theta, phi } = body.astronomy;
      // Convert spherical to cartesian
      // r is distance, theta is horizontal (azimuth), phi is vertical (elevation from pole?)
      // Standard Physics: x = r sin(phi) cos(theta), y = r sin(phi) sin(theta), z = r cos(phi)
      // Our data likely uses: theta (0-2PI), phi (0-PI)
      target.setFromSphericalCoords(r, phi, theta);
    }
  }
  return target;
};

// --- Components ---

function Body3D({ 
  body, 
  mode, 
  date, 
  onSelect 
}: { 
  body: CelestialBody; 
  mode: Mode; 
  date: Date; 
  onSelect: (b: CelestialBody) => void 
}) {
  const groupRef = useRef<THREE.Group>(null);
  const targetPos = useRef(new THREE.Vector3());
  const currentPos = useRef(new THREE.Vector3());
  
  // Update target when dependencies change
  useEffect(() => {
    // Skip position calculation for Kinrin in Cosmos mode (handled by background layer)
    if (mode === 'cosmos' && body.id === 'c_kinrin') {
      return; 
    }
    const t = getTargetPosition(body, mode, date);
    targetPos.current.copy(t);
  }, [body, mode, date]);

  useFrame((_state, delta) => {
    if (groupRef.current) {
      // Smooth Lerp
      const speed = Math.min(delta * 4.0, 1.0); 
      currentPos.current.lerp(targetPos.current, speed);
      groupRef.current.position.copy(currentPos.current);
    }
  });

  const color = body.color || '#ffffff';
  const isKinrin = body.id === 'c_kinrin';
  
  // Use high resolution scale only for Cosmos mode to prevent blur on zoom
  // For Mandala mode, use standard scale (1x) to keep fonts crisp and appropriately sized
  const currentResScale = mode === 'mandala' ? 1 : RES_SCALE;

  // Don't render Kinrin in 3D scene when in Cosmos mode (handled by KinrinBackground)
  if (mode === 'cosmos' && isKinrin) return null;

  return (
    <group ref={groupRef}>
      {/* Trails only in Cosmos mode for Planets (excluding Kinrin) */}
      {mode === 'cosmos' && PLANET_MAP[body.id] && !isKinrin && (
         <Trail width={0.4} length={8} color={color} attenuation={(t) => t * t}>
            <mesh visible={false} />
         </Trail>
      )}

      {/* Label / Glyph */}
      <Billboard follow={true}>
        <Html 
          transform 
          center
          // Reverted distanceFactor to 80 to make icons smaller
          distanceFactor={(mode === 'mandala' ? 80 : 60) / currentResScale}
          style={{ 
            pointerEvents: isKinrin && mode === 'cosmos' ? 'none' : 'auto', // Kinrin background non-interactive
            transition: 'opacity 0.5s, transform 0.5s',
            opacity: isKinrin && mode === 'cosmos' ? 0.15 : 1,
            zIndex: isKinrin && mode === 'cosmos' ? -1 : 'auto', // Push to back visually
          }} 
        >
          <div 
            className="flex flex-col items-center justify-center pointer-events-auto" 
            onClick={(e) => { 
              if (isKinrin && mode === 'cosmos') return;
              e.stopPropagation(); 
              onSelect(body); 
            }}
          >
             <Glyph 
                body={body} 
                resScale={currentResScale}
                size={
                  (isKinrin && mode === 'cosmos' ? 300 : // Huge Kinrin
                  body.mandala.layer === 0 ? 120 : 
                  body.mandala.layer === 1 ? 40 : 
                  body.mandala.layer === 3 ? 20 : 
                  50) * currentResScale
                } 
                variant={isKinrin && mode === 'cosmos' ? 'kinrin-3d' : 'default'}
                showLabel={!(isKinrin && mode === 'cosmos')} // Hide label for Kinrin in cosmos
                className={clsx(
                  "transition-transform",
                  !isKinrin && "hover:scale-110",
                  // In cosmos mode, standard bodies opacity
                  mode === 'cosmos' && !isKinrin && "opacity-90"
                )}
             />
          </div>
        </Html>
      </Billboard>
    </group>
  );
}

function MandalaRings({ mode }: { mode: Mode }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_state, delta) => {
    if (groupRef.current) {
      // Fade in/out scaling or opacity
      const targetScale = mode === 'mandala' ? 1 : 0;
      
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 2);
    }
  });

  return (
    <group ref={groupRef}>
       {/* Rings matching layer radii: 0.7, 1.25, 1.8 * MANDALA_SCALE */}
       {[0.9, 1.35, 1.8].map((r, i) => (
         <mesh key={i} rotation={[0, 0, 0]}>
           <ringGeometry args={[r * MANDALA_SCALE - 0.2, r * MANDALA_SCALE, 128]} />
           <meshBasicMaterial color="#FFD700" transparent opacity={0.15} side={THREE.DoubleSide} />
         </mesh>
       ))}
       {/* Dashed outer ring placeholder - RingGeometry doesn't support dashed easily, using solid for now */}
    </group>
  );
}

function CameraController({ mode }: { mode: Mode }) {
  const { camera, gl, size } = useThree();
  const controlsRef = useRef<any>(null);

  // Dynamic camera position calculation
  const aspect = size.width / size.height;
  // Mandala radius ~65 units (1.8 * 35). We need to fit diameter ~130.
  // Add some padding (e.g. 150 total width needed).
  // FOV is 45 degrees.
  // tan(22.5) = (visible_width / 2) / dist
  // dist = (visible_width / 2) / (aspect * tan(22.5))
  // dist = 75 / (aspect * 0.4142) ≈ 181 / aspect
  const baseDist = 200;
  const mandalaDist = aspect < 1 ? baseDist / aspect : baseDist; // Adjust for portrait
  
  const mandalaPos = new THREE.Vector3(0, 0, mandalaDist);

  useEffect(() => {
    if (controlsRef.current) {
       controlsRef.current.enabled = mode === 'cosmos';
       if (mode === 'mandala') {
          controlsRef.current.reset();
       }
    }
  }, [mode]);

  useFrame((state, delta) => {
    if (mode === 'mandala') {
      // Lock camera to Mandala View
      state.camera.position.lerp(mandalaPos, delta * 2);
      state.camera.lookAt(0, 0, 0);
      if (controlsRef.current) controlsRef.current.target.lerp(new THREE.Vector3(0,0,0), delta * 2);
    } 
    // In Cosmos mode, OrbitControls takes over, but we could init smooth transition here if needed
  });

  return <OrbitControls ref={controlsRef} args={[camera, gl.domElement]} enableDamping maxDistance={1000} />;
}

// Background layer for Kinrin in Cosmos mode
function KinrinBackground({ mode }: { mode: Mode }) {
  const body = celestialBodies.find(b => b.id === 'c_kinrin');
  if (mode !== 'cosmos' || !body) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
       <div className="opacity-[0.15]">
          <Glyph 
             body={body} 
             size={600} // Very large
             showLabel={false} 
             variant="kinrin-3d"
          />
       </div>
    </div>
  );
}

// --- Main View ---

export const UnifiedView = () => {
  const [mode, setMode] = useState<Mode>('mandala');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isPlaying, setIsPlaying] = useState(false);
  const [selected, setSelected] = useState<CelestialBody | null>(null);
  
  const minDate = new Date('1990-01-01').getTime();
  const maxDate = new Date('2099-12-31').getTime();

  // Animation Loop for Date
  useEffect(() => {
    let frameId: number;
    const animate = () => {
      if (isPlaying) {
        setCurrentDate(prev => {
          const next = addDays(prev, 1); 
          if (next.getTime() > maxDate) return new Date(minDate);
          return next;
        });
        frameId = requestAnimationFrame(animate);
      }
    };
    if (isPlaying) frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentDate(new Date(parseInt(e.target.value)));
  };

  return (
    <div className="relative w-screen h-screen bg-black text-white overflow-hidden font-sans">
      
      {/* Background (Global) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1a1a2e_0%,#000000_100%)] -z-10" />

      {/* Kinrin Background Layer */}
      <KinrinBackground mode={mode} />

      {/* 3D Scene */}
      <Canvas camera={{ position: [0, 0, 100], fov: 45 }}>
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        <CameraController mode={mode} />
        
        {/* Background Stars (Only prominent in Cosmos or faint in Mandala) */}
        <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade />
        
        {/* Mandala Rings (Fade in/out) */}
        <MandalaRings mode={mode} />

        {/* Bodies */}
        {celestialBodies.map(body => (
           <Body3D 
              key={body.id} 
              body={body} 
              mode={mode} 
              date={currentDate} 
              onSelect={setSelected}
           />
        ))}

        {/* Sun Glow (Center) - Special handling */}
        <mesh position={[0,0,0]}>
           <sphereGeometry args={[2, 32, 32]} />
           <meshBasicMaterial color="#FF4500" transparent opacity={0.5} />
        </mesh>

      </Canvas>

      {/* UI Overlay: Header */}
      <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-50 pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="text-3xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-500 drop-shadow-sm">
            星曼荼羅
          </h1>
          <p className="text-xs text-gray-400 mt-1 tracking-[0.2em] uppercase">
            Hoshi Mandala System
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex flex-col gap-4 pointer-events-auto items-end">
          <div className="bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/20 flex shadow-lg">
            <button
              onClick={() => setMode('mandala')}
              className={clsx(
                "px-6 py-2 rounded-full text-sm font-medium transition-all duration-300",
                mode === 'mandala' 
                  ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(255,191,0,0.5)]" 
                  : "text-gray-300 hover:text-white hover:bg-white/5"
              )}
            >
              2D 曼荼羅
            </button>
            <button
              onClick={() => setMode('cosmos')}
              className={clsx(
                "px-6 py-2 rounded-full text-sm font-medium transition-all duration-300",
                mode === 'cosmos' 
                  ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]" 
                  : "text-gray-300 hover:text-white hover:bg-white/5"
              )}
            >
              3D 天文
            </button>
          </div>
        </div>
      </header>

      {/* UI Overlay: Timeline Controls (Only visible/active in Cosmos mostly, but useful for both) */}
      <div className={clsx(
         "absolute bottom-12 md:bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-black/60 backdrop-blur border border-white/10 rounded-xl p-4 flex items-center gap-4 z-[60] text-white transition-opacity duration-500",
         mode === 'mandala' ? "opacity-30 hover:opacity-100" : "opacity-100"
      )}>
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center w-10 h-10"
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
        
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex justify-between text-xs text-gray-400 font-mono w-full">
            <span>{format(currentDate, 'yyyy-MM-dd')}</span>
            <span>{Math.round(((currentDate.getTime() - minDate) / (maxDate - minDate)) * 100)}%</span>
          </div>
          <input 
            type="range" 
            min={minDate} 
            max={maxDate} 
            value={currentDate.getTime()} 
            onChange={handleSliderChange}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-mandala-gold"
          />
        </div>
      </div>

      {/* Info Panel */}
      <AnimatePresence>
        {selected && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-24 right-10 w-64 bg-black/90 border border-amber-500/50 p-4 rounded-lg z-50 backdrop-blur-md"
          >
            <button className="absolute top-2 right-2 text-gray-500 hover:text-white" onClick={() => setSelected(null)}>✕</button>
            <h2 className="text-xl font-bold text-amber-500">{selected.labelZh}</h2>
            <p className="text-sm text-gray-300 italic mb-2">{selected.sanskritKey}</p>
            <div className="text-xs text-gray-400 space-y-1">
               <p>群組: {GROUP_LABELS[selected.group] || selected.group}</p>
               <p>相位 (Phi): {selected.astronomy.phi.toFixed(2)}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
