import dynamic from 'next/dynamic';
import Head from 'next/head';
import Image from 'next/image';

// Dynamically import the 3D hero to avoid SSR and heavy load on first render.
const Hero3D = dynamic(() => import('../components/Hero3D'), {
  ssr: false,
  loading: () => (
    <div className="relative h-[400px] w-full flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <Image
        src="/fallback-hero.png"
        alt="GTC AI platform hero"
        layout="fill"
        objectFit="cover"
        className="opacity-50"
      />
    </div>
  )
});

export default function Home() {
  return (
    <>
      <Head>
        <title>GTC | AI Platform for Mindful Purchasing</title>
        <meta
          name="description"
          content="Smarter B2B decisions with GTC AI: AI consultant, news insights and integrated payments."
        />
      </Head>
      <main className="min-h-screen flex flex-col items-center justify-start">
        <section className="w-full flex flex-col items-center justify-center text-center pt-12 px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">AI platform for mindful purchasing</h1>
          <p className="max-w-xl text-gray-600 mb-8">
            Smarter B2B decisions: AI consultant, news insights, integrated payments.
          </p>
          <div className="flex space-x-4 mb-10">
            <a
              href="https://t.me/Procurement_AnalystBot"
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open AI Bot
            </a>
            <a
              href="https://app.gtstor.com/news/"
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
              target="_blank"
              rel="noopener noreferrer"
            >
              Read News
            </a>
            <a
              href="https://pay.gtstor.com/payment.php"
              className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
              target="_blank"
              rel="noopener noreferrer"
            >
              Subscribe
            </a>
          </div>
        </section>
        <Hero3D />
      </main>
    </>
  );
}
