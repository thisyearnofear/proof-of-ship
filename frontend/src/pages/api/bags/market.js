/**
 * Bags Market API Proxy
 * Securely fetches token market data from Bags/Bitquery
 */

export default async function handler(req, res) {
  const { mint } = req.query;

  if (!mint) {
    return res.status(400).json({ error: "Mint required" });
  }

  try {
    // In production, use your authenticated Bags SDK instance here
    // const sdk = new BagsSDK(process.env.BAGS_API_KEY);
    // const data = await sdk.state.getTokenMarketData(mint);

    // Mock data for hackathon demonstration
    const mockData = {
      price: Math.random() * 0.05,
      marketCap: 12500,
      volume24h: 3200,
    };

    return res.status(200).json(mockData);
  } catch (error) {
    console.error("Market data fetch error:", error);
    return res.status(500).json({ error: "Failed to fetch market data" });
  }
}
