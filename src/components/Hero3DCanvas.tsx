import * as React from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import type { ThreeElements } from '@react-three/fiber'

const LIGHT_FRONT_POSITION: ThreeElements['pointLight']['position'] = [6, 6, 6]
const LIGHT_BACK_POSITION: ThreeElements['pointLight']['position'] = [-6, -6, -6]

const SPHERE_ARGS: ThreeElements['sphereGeometry']['args'] = [1.6, 48, 48]

const TORUS_ONE_ARGS: ThreeElements['torusGeometry']['args'] = [2.6, 0.02, 8, 128]
const TORUS_TWO_ARGS: ThreeElements['torusGeometry']['args'] = [2.0, 0.02, 8, 128]
const TORUS_THREE_ARGS: ThreeElements['torusGeometry']['args'] = [3.2, 0.02, 8, 128]

const TORUS_ONE_ROTATION: ThreeElements['mesh']['rotation'] = [Math.PI / 2, 0, 0]
const TORUS_TWO_ROTATION: ThreeElements['mesh']['rotation'] = [0, Math.PI / 2, 0]
const TORUS_THREE_ROTATION: ThreeElements['mesh']['rotation'] = [0, 0, Math.PI / 2]

const CANVAS_STYLE: React.CSSProperties = { background: '#0b1220' }
const CANVAS_DPR: [number, number] = [1, 2]
const CAMERA_SETTINGS = {
  position: [0, 0, 8] as [number, number, number],
  fov: 50,
}

function Scene() {
  const sphereRef = React.useRef<
    THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>
  >(null)
  const torus1Ref = React.useRef<
    THREE.Mesh<THREE.TorusGeometry, THREE.MeshStandardMaterial>
  >(null)
  const torus2Ref = React.useRef<
    THREE.Mesh<THREE.TorusGeometry, THREE.MeshStandardMaterial>
  >(null)
  const torus3Ref = React.useRef<
    THREE.Mesh<THREE.TorusGeometry, THREE.MeshStandardMaterial>
  >(null)

  useFrame((_, delta) => {
    if (sphereRef.current) sphereRef.current.rotation.y += delta * 0.25
    if (torus1Ref.current) torus1Ref.current.rotation.y += delta * 0.1
    if (torus2Ref.current) torus2Ref.current.rotation.x += delta * 0.1
    if (torus3Ref.current) torus3Ref.current.rotation.z += delta * 0.1
  })

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={LIGHT_FRONT_POSITION} intensity={50} />
      <pointLight position={LIGHT_BACK_POSITION} intensity={20} />

      {/* Центральная сфера */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={SPHERE_ARGS} />
        <meshStandardMaterial
          color="#67e8f9"
          emissive="#22d3ee"
          emissiveIntensity={0.2}
          metalness={0.1}
          roughness={0.35}
        />
      </mesh>

      {/* Три орбиты */}
      <mesh ref={torus1Ref} rotation={TORUS_ONE_ROTATION}>
        <torusGeometry args={TORUS_ONE_ARGS} />
        <meshStandardMaterial color="#93c5fd" />
      </mesh>

      <mesh ref={torus2Ref} rotation={TORUS_TWO_ROTATION}>
        <torusGeometry args={TORUS_TWO_ARGS} />
        <meshStandardMaterial color="#a7f3d0" />
      </mesh>

      <mesh ref={torus3Ref} rotation={TORUS_THREE_ROTATION}>
        <torusGeometry args={TORUS_THREE_ARGS} />
        <meshStandardMaterial color="#fbcfe8" />
      </mesh>
    </>
  )
}

export default function Hero3DCanvas() {
  return (
    <Canvas
      camera={CAMERA_SETTINGS}
      dpr={CANVAS_DPR}
      gl={{ antialias: true }}
      style={CANVAS_STYLE}
    >
      <Scene />
    </Canvas>
  )
}
