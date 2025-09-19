import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, OrbitControls } from '@react-three/drei';
import { Group } from 'three';

/**
 * Renders a simple 3D scene with a rotating central sphere and three orbiting
 * spheres to illustrate different actions (AI consultant, news, subscribe).
 */
function Scene() {
  const groupRef = useRef<Group>(null);
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.2;
    }
  });
  return (
    <group ref={groupRef}>
      <Sphere args={[1, 32, 32]}>
        <meshStandardMaterial color="#00aaff" emissive="#0066aa" emissiveIntensity={0.5} />
      </Sphere>
      {['#ff6f61', '#ffd700', '#8fbc8f'].map((color, index) => {
        const angle = (index / 3) * Math.PI * 2;
        const radius = 2.5;
        return (
          <Sphere key={index} position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius]} args={[0.3, 16, 16]}>
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
          </Sphere>
        );
      })}
    </group>
  );
}

export default function Hero3D() {
  return (
    <div className="relative h-[400px] w-full">
      <Canvas camera={{ position: [0, 2, 6], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <pointLight position={[5, 5, 5]} intensity={1} />
        <Scene />
        <OrbitControls enablePan={false} enableZoom={false} />
      </Canvas>
    </div>
  );
}
