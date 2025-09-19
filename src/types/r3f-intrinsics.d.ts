import '@react-three/fiber';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // геометрии/материалы/свет/меши, которые есть в нашем Hero3DCanvas
      mesh: any;
      sphereGeometry: any;
      torusGeometry: any;
      meshStandardMaterial: any;
      ambientLight: any;
      pointLight: any;
      // если когда-то вернётся <group/>, он уже перекрыт в другом d.ts
    }
  }
}

export {};
