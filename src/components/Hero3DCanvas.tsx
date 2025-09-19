import * as React from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'

function Rotator({ speed = 0.2, children }: React.PropsWithChildren<{ speed?: number }>) {
  const ref = React.useRef<THREE.Group>(null!)
  useFrame((_, dt) => {
    if (!ref.current) return
    ref.current.rotation.y += dt * speed
  })
  return <group ref={ref}>{children}</group>
}

function Scene() {
  return (
    <>
      {/* Фон и свет */}
      <color attach="background" args={['#0b1220']} />
      <ambientLight intensity={0.6} />
      <pointLight position={[6, 6, 6]} intensity={50} />
      <pointLight position={[-6, -6, -6]} intensity={20} />

      {/* Центральная сфера */}
      <Rotator speed={0.25}>
        <mesh>
          <sphereGeometry args={[1.6, 48, 48]} />
          <meshStandardMaterial
            color="#67e8f9"
            emissive="#22d3ee"
            emissiveIntensity={0.2}
            metalness={0.1}
            roughness={0.35}
          />
        </mesh>
      </Rotator>

      {/* Три орбиты */}
      <Rotator speed={0.1}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.6, 0.02, 8, 128]} />
          <meshStandardMaterial color="#93c5fd" />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[2.0, 0.02, 8, 128]} />
          <meshStandardMaterial color="#a7f3d0" />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[3.2, 0.02, 8, 128]} />
          <meshStandardMaterial color="#fbcfe8" />
        </mesh>
      </Rotator>
    </>
  )
}

export default function Hero3DCanvas() {
  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 50 }} dpr={[1, 2]} gl={{ antialias: true }}>
      <Scene />
    </Canvas>
  )
}
