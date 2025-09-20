import * as React from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'

function Scene() {
  const sphereRef = React.useRef<THREE.Mesh>(null!)
  const torus1Ref = React.useRef<THREE.Mesh>(null!)
  const torus2Ref = React.useRef<THREE.Mesh>(null!)
  const torus3Ref = React.useRef<THREE.Mesh>(null!)

  useFrame((_, dt) => {
    if (sphereRef.current) sphereRef.current.rotation.y += dt * 0.25
    if (torus1Ref.current) torus1Ref.current.rotation.y += dt * 0.10
    if (torus2Ref.current) torus2Ref.current.rotation.x += dt * 0.10
    if (torus3Ref.current) torus3Ref.current.rotation.z += dt * 0.10
  })

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[6, 6, 6]} intensity={50} />
      <pointLight position={[-6, -6, -6]} intensity={20} />

      {/* Центральная сфера */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[1.6, 48, 48]} />
        <meshStandardMaterial
          color="#67e8f9"
          emissive="#22d3ee"
          emissiveIntensity={0.2}
          metalness={0.1}
          roughness={0.35}
        />
      </mesh>

      {/* Три орбиты */}
      <mesh ref={torus1Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.6, 0.02, 8, 128]} />
        <meshStandardMaterial color="#93c5fd" />
      </mesh>

      <mesh ref={torus2Ref} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[2.0, 0.02, 8, 128]} />
        <meshStandardMaterial color="#a7f3d0" />
      </mesh>

      <mesh ref={torus3Ref} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[3.2, 0.02, 8, 128]} />
        <meshStandardMaterial color="#fbcfe8" />
      </mesh>
    </>
  )
}

export default function Hero3DCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 50 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
      style={{ background: '#0b1220' }}
    >
      <Scene />
    </Canvas>
  )
}
