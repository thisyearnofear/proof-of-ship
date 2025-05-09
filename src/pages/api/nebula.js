/**
 * Nebula API Proxy
 *
 * This API route acts as a proxy for the Thirdweb Nebula API,
 * allowing us to make requests from the client side while keeping
 * our API keys secure on the server.
 */

// Base URL for Nebula API
const NEBULA_API_BASE_URL = "https://nebula-api.thirdweb.com";

// Simple in-memory rate limiting
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5, // 5 requests per minute
  clients: new Map(),
};

// Rate limiting middleware
function rateLimit(req) {
  // Get client IP or a unique identifier
  const clientId =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";

  // Get current timestamp
  const now = Date.now();

  // Get client's request history or initialize it
  if (!RATE_LIMIT.clients.has(clientId)) {
    RATE_LIMIT.clients.set(clientId, {
      count: 0,
      resetAt: now + RATE_LIMIT.windowMs,
    });
  }

  const client = RATE_LIMIT.clients.get(clientId);

  // Reset count if the window has passed
  if (now > client.resetAt) {
    client.count = 0;
    client.resetAt = now + RATE_LIMIT.windowMs;
  }

  // Increment request count
  client.count++;

  // Check if rate limit is exceeded
  return client.count > RATE_LIMIT.maxRequests;
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Check rate limit
    if (rateLimit(req)) {
      return res.status(429).json({
        error: "Too Many Requests",
        message: "Rate limit exceeded. Please try again later.",
      });
    }

    // Get the API key from environment variables
    const apiKey = process.env.THIRDWEB_CLIENT_SECRET;

    if (!apiKey) {
      throw new Error("Thirdweb secret key not found in environment variables");
    }

    // Extract the request body
    const { message, stream, sessionId, context } = req.body;

    // Validate required parameters
    if (!message) {
      return res.status(400).json({
        error: "Bad request",
        message: "Message is required",
      });
    }

    // Check if we're in a production environment
    const isProduction =
      req.headers.host &&
      (req.headers.host.includes("proofofship.web.app") ||
        req.headers.host.includes("proof-of-ship.vercel.app"));

    // In production, return mock data to avoid API overuse
    if (isProduction) {
      console.log("Production environment detected. Returning mock data.");
      return res.status(200).json({
        message:
          "This is mock data from the API proxy. To use the real Nebula API, please run the application locally.",
        session_id: sessionId || "mock-session",
        request_id: "mock-request-id",
      });
    }

    // Log the request (for debugging)
    console.log(
      `Nebula API request: ${message.substring(0, 100)}${
        message.length > 100 ? "..." : ""
      }`
    );

    // Make the request to the Nebula API
    const response = await fetch(`${NEBULA_API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-secret-key": apiKey,
      },
      body: JSON.stringify({
        message,
        stream: stream || false,
        session_id: sessionId,
        context,
        user_id: "proof-of-ship-user", // Add a consistent user ID for better tracking
      }),
    });

    // Handle error responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Nebula API error:", errorData);
      return res.status(response.status).json({
        error: `Nebula API error: ${response.status}`,
        message: errorData.message || response.statusText,
      });
    }

    // Return the response data
    const data = await response.json();

    // Log success (for debugging)
    console.log(
      `Nebula API response received: ${
        data.message ? data.message.substring(0, 100) + "..." : "No message"
      }`
    );

    return res.status(200).json(data);
  } catch (error) {
    console.error("Error proxying request to Nebula:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
}
