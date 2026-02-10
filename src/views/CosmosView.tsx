import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html, Billboard, Trail } from '@react-three/drei';
import * as THREE from 'three';
import { celestialBodies } from '../data/bodies';
import { Glyph } from '../components/Glyph';
import { CelestialBody } from '../types';
import { Body, getHeliocentricPosition, getGeocentricPosition, AU_SCALE } from '../utils/astronomy';
import { addDays, format } from 'date-fns';
import { Play, Pause } from 'lucide-react';

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

// Component for standard planets/stars
function RealBody3D({ body, date, onSelect }: { body: CelestialBody; date: Date; onSelect: (b: CelestialBody) => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const targetPos = useRef(new THREE.Vector3());

  useEffect(() => {
    const engineBody = PLANET_MAP[body.id];
    let newPos = new THREE.Vector3();

    if (engineBody) {
      if (body.id === 'n_moon') {
          const earth = getHeliocentricPosition(Body.Earth, date);
          const moonGeo = getGeocentricPosition(Body.Moon, date);
          newPos.set(
             earth.x + moonGeo.x * 50, 
             earth.y + moonGeo.y * 50, 
             earth.z + moonGeo.z * 50
          );
      } else {
          const p = getHeliocentricPosition(engineBody, date);
          newPos.set(p.x, p.y, p.z);
      }
    } else {
      const { r, theta, phi } = body.astronomy;
      newPos.setFromSphericalCoords(r, phi, theta);
    }
    targetPos.current.copy(newPos);
  }, [date, body]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.lerp(targetPos.current, 0.1);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh onClick={() => onSelect(body)}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={body.color || '#fff'} />
      </mesh>
      
      {PLANET_MAP[body.id] && (
         <Trail width={0.4} length={12} color={body.color || '#fff'} attenuation={(t) => t * t}>
            <mesh visible={false} />
         </Trail>
      )}

      <Billboard follow={true}>
        <Html 
          transform 
          distanceFactor={60}
          style={{ 
            pointerEvents: 'none',
            transform: 'translate3d(-50%, -50%, 0)'
          }} 
          position={[0, 0, 0]} 
        >
          <div className="flex flex-col items-center justify-center">
             <Glyph 
                body={body} 
                size={80} 
                showLabel={true} 
                className="pointer-events-auto transition-transform hover:scale-110"
             />
          </div>
        </Html>
      </Billboard>
    </group>
  );
}

// Component for Sun (Center)
function Sun3D({ body }: { body: CelestialBody }) {
  return (
    <group position={[0,0,0]}>
      <Billboard follow={true}>
        <Html 
          transform 
          distanceFactor={40}
          style={{ pointerEvents: 'none', transform: 'translate3d(-50%, -50%, 0)' }} 
        >
           {/* Increased size for visual impact */}
           <Glyph body={body} size={300} showLabel={true} />
        </Html>
      </Billboard>
      <pointLight intensity={3} distance={300} decay={2} color="#ffaa00" />
      {/* Visual core */}
      <mesh>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

function SolarSystem({ date }: { date: Date }) {
  const [selected, setSelected] = useState<CelestialBody | null>(null);

  return (
    <>
      <ambientLight intensity={0.1} />
      
      {/* Earth removed as requested */}

      {celestialBodies.map(body => {
        if (body.id === 'c_kinrin') return null;
        if (body.id === 'n_sun') return <Sun3D key={body.id} body={body} />;
        return <RealBody3D key={body.id} body={body} date={date} onSelect={setSelected} />;
      })}

      {/* Orbit Rings Reference */}
      {[0.39, 0.72, 1.0, 1.52, 5.2, 9.5].map((r, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r * AU_SCALE - 0.05, r * AU_SCALE + 0.05, 128]} />
          <meshBasicMaterial color="#ffffff" opacity={0.05} transparent side={THREE.DoubleSide} />
        </mesh>
      ))}

      {selected && (
        <Html as='div' fullscreen style={{ pointerEvents: 'none' }}>
           <div className="absolute bottom-24 right-10 w-64 bg-black/90 border border-mandala-gold p-4 rounded pointer-events-auto">
              <h2 className="text-xl font-bold text-mandala-gold">{selected.labelZh}</h2>
              <p className="text-sm text-gray-400">{selected.sanskritKey}</p>
              <button className="absolute top-2 right-2 text-gray-500 hover:text-white" onClick={() => setSelected(null)}>✕</button>
           </div>
        </Html>
      )}
    </>
  );
}

export const CosmosView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isPlaying, setIsPlaying] = useState(false);
  const requestRef = useRef<number>();

  const minDate = new Date('1990-01-01').getTime();
  const maxDate = new Date('2099-12-31').getTime();

  useEffect(() => {
    const animate = () => {
      if (isPlaying) {
        setCurrentDate(prev => {
          const next = addDays(prev, 2); 
          if (next.getTime() > maxDate) return new Date(minDate);
          return next;
        });
        requestRef.current = requestAnimationFrame(animate);
      }
    };
    
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, maxDate, minDate]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentDate(new Date(parseInt(e.target.value)));
  };

  return (
    <div className="w-full h-full relative bg-black">
      <Canvas camera={{ position: [0, 80, 100], fov: 45 }}>
        <SolarSystem date={currentDate} />
        <OrbitControls enablePan={true} enableZoom={true} minDistance={10} maxDistance={600} />
        <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade />
      </Canvas>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-black/60 backdrop-blur border border-white/10 rounded-xl p-4 flex items-center gap-4 z-40 text-white">
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
    </div>
  );
};
