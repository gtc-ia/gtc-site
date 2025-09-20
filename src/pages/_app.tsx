import type { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';

const SITE_URL = 'https://gtc.gtstor.com';
const TITLE = 'GTC — AI-платформа для осознанных покупок';
const DESCRIPTION =
  'GTC помогает бизнесу принимать взвешанные решения: AI-консультант, новости рынка и интеграция оплаты в одном месте.';
const OG_IMAGE = `${SITE_URL}/fallback-hero.png`;

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta
          name="keywords"
          content="GTC, AI-платформа, умные закупки, осознанные покупки, аналитика, новости рынка, GTStor"
        />
        <meta name="robots" content="index,follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0b1220" />
        <link rel="canonical" href={SITE_URL} />

        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:image" content={OG_IMAGE} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={SITE_URL} />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:image" content={OG_IMAGE} />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
