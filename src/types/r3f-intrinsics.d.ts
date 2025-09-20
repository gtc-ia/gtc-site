import '@react-three/fiber'
import type { ThreeElements } from '@react-three/fiber'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: ThreeElements['mesh']
      sphereGeometry: ThreeElements['sphereGeometry']
      torusGeometry: ThreeElements['torusGeometry']
      meshStandardMaterial: ThreeElements['meshStandardMaterial']
      ambientLight: ThreeElements['ambientLight']
      pointLight: ThreeElements['pointLight']
    }
  }
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        mesh: ThreeElements['mesh']
        sphereGeometry: ThreeElements['sphereGeometry']
        torusGeometry: ThreeElements['torusGeometry']
        meshStandardMaterial: ThreeElements['meshStandardMaterial']
        ambientLight: ThreeElements['ambientLight']
        pointLight: ThreeElements['pointLight']
      }
    }
  }
}

export {}
