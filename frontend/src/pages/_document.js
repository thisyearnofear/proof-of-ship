import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="description" content="Proof of Ship — AI-powered project analysis with x402 nanopayments on Arc. Explore builder portfolios, get instant credit scores, and back projects across 7 blockchain ecosystems." />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Proof of Ship — Builder Credit Platform" />
        <meta property="og:description" content="AI-powered project analysis paid per-query via x402 micropayments on Circle's Arc L2. Explore, analyze, and back builder projects." />
        <meta property="og:site_name" content="Proof of Ship" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Proof of Ship — Builder Credit Platform" />
        <meta name="twitter:description" content="AI-powered project analysis paid per-query via x402 micropayments on Circle's Arc L2." />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Google Fonts: Plus Jakarta Sans for display, Inter for body */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
