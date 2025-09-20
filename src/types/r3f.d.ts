/// <reference types="@react-three/fiber" />
import type { ReactThreeFiber } from '@react-three/fiber'
import type * as THREE from 'three'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      mesh: ReactThreeFiber.Object3DNode<THREE.Mesh, typeof THREE.Mesh>
      sphereGeometry: ReactThreeFiber.BufferGeometryNode<
        THREE.SphereGeometry,
        typeof THREE.SphereGeometry
      >
      torusGeometry: ReactThreeFiber.BufferGeometryNode<
        THREE.TorusGeometry,
        typeof THREE.TorusGeometry
      >
      meshStandardMaterial: ReactThreeFiber.MaterialNode<
        THREE.MeshStandardMaterial,
        [THREE.MeshStandardMaterialParameters]
      >
      ambientLight: ReactThreeFiber.LightNode<
        THREE.AmbientLight,
        typeof THREE.AmbientLight
      >
      pointLight: ReactThreeFiber.LightNode<THREE.PointLight, typeof THREE.PointLight>
    }
  }
}

export {}
