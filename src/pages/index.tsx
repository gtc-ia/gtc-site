import dynamic from 'next/dynamic'
import HeroOverlay from '@/components/HeroOverlay'

// 3D-Canvas грузим лениво (без SSR). Пока грузится — градиентный фон.
const Hero3DCanvas = dynamic(() => import('@/components/Hero3DCanvas'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, #0b1220 0%, #0e1a33 100%)',
      }}
    />
  ),
})

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', background: '#0b1220', color: '#fff' }}>
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: '520px',
        }}
      >
        {/* 3D-канвас под текстом */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <Hero3DCanvas />
        </div>

        {/* DOM-оверлей с H1/подзаголовком/CTA */}
        <HeroOverlay />

        {/* Мягкая подложка снизу для читаемости */}
        <div
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '160px',
            background: 'linear-gradient(0deg, #0b1220, rgba(11,18,32,0))',
          }}
        />
      </section>

      {/* Ниже можете разместить статический контент секций */}
    </main>
  )
}
