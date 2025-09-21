import Head from 'next/head'
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
    <>
      <Head>
        <title>GTC — AI advisor with real-time news and payments</title>
        <meta
          name="description"
          content="Guide purchasing decisions with the GTC AI advisor, monitor curated market news, and unlock paid tools through seamless payments."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://gtstor.com/" />
        <meta property="og:title" content="GTC — AI advisor with real-time news and payments" />
        <meta
          property="og:description"
          content="Guide purchasing decisions with the GTC AI advisor, monitor curated market news, and unlock paid tools through seamless payments."
        />
        <meta property="og:image" content="https://gtstor.com/fallback-hero.png" />
        <meta property="og:site_name" content="GTC" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="GTC — AI advisor with real-time news and payments" />
        <meta
          name="twitter:description"
          content="Guide purchasing decisions with the GTC AI advisor, monitor curated market news, and unlock paid tools through seamless payments."
        />
        <meta name="twitter:image" content="https://gtstor.com/fallback-hero.png" />
        <meta name="twitter:url" content="https://gtstor.com/" />
      </Head>
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
    </>
  )
}
