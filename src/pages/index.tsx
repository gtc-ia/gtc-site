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
        <title>GTC — AI Purchasing Assistant for Smarter Procurement</title>
        <meta
          name="description"
          content="GTC is your AI-powered purchasing assistant that automates procurement research, vendor comparisons, and decision-making insights."
        />
        <meta property="og:title" content="GTC — AI Purchasing Assistant" />
        <meta
          property="og:description"
          content="Automate procurement research, compare vendors, and uncover insights with GTC's AI purchasing assistant."
        />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/fallback-hero.png" />
        <meta property="og:url" content="https://gtc.ai" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="GTC — AI Purchasing Assistant" />
        <meta
          name="twitter:description"
          content="Streamline procurement workflows with GTC's intelligent AI assistant for purchasing teams."
        />
        <meta name="twitter:image" content="/fallback-hero.png" />
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
