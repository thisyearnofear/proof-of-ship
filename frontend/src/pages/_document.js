import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="description" content="Proof of Ship — On-chain builder credit backed by reputation. AI agents analyze, backers stake, builders ship." />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Proof of Ship — Builder Credit for Hackathon Winners" />
        <meta property="og:description" content="On-chain builder credit backed by reputation. AI agents analyze, backers stake, builders ship." />
        <meta property="og:site_name" content="Proof of Ship" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Proof of Ship — Builder Credit for Hackathon Winners" />
        <meta name="twitter:description" content="On-chain builder credit backed by reputation. AI agents analyze, backers stake, builders ship." />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Google Fonts: Plus Jakarta Sans for display, Inter for body */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Proof of Ship",
              description: "On-chain builder credit backed by reputation. AI agents analyze projects, backers stake USDC, and hackathon payout speed is public data.",
              url: "https://proof-of-ship.vercel.app",
              applicationCategory: "FinanceApplication",
              operatingSystem: "Web",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              featureList: [
                "Hackathon payout leaderboards",
                "AI agent project analysis via x402 nanopayments",
                "USDC backing with multiplier returns",
                "Proof-based builder credit scoring",
              ],
            }),
          }}
        />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
