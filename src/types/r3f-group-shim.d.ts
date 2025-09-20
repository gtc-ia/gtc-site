import type { ThreeElements } from '@react-three/fiber'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: ThreeElements['group']
    }
  }
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        group: ThreeElements['group']
      }
    }
  }
}
export {}
