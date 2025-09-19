import '@react-three/fiber';

// Локальная декларация на случай, если окружение не подхватило типы R3F
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
    }
  }
}
export {};
