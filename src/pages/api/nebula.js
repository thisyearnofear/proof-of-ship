/**
 * Nebula API Proxy
 *
 * This API route acts as a proxy for the Thirdweb Nebula API,
 * allowing us to make requests from the client side while keeping
 * our API keys secure on the server.
 */

// Base URL for Nebula API
const NEBULA_API_BASE_URL = "https://nebula-api.thirdweb.com";

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
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
