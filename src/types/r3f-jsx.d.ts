import '@react-three/fiber'
import type { ThreeElements } from '@react-three/fiber'

// Локальная декларация на случай, если окружение не подхватило типы R3F
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
