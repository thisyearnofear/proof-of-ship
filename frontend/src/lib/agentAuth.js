/**
 * Agent API Auth Middleware
 *
 * Provides API key authentication for agent endpoints.
 * When AGENT_API_KEY is set, all agent requests must include
 * an `x-api-key` header matching that value.
 *
 * This is a lightweight auth layer on top of nanopayment middleware.
 * In production, consider adding session-based auth or JWT.
 */

export function withAgentAuth(handler) {
  return async (req, res) => {
    const apiKey = process.env.AGENT_API_KEY;

    // Keep local development frictionless, but never expose protected
    // production mutations because a deployment secret was omitted.
    if (!apiKey) {
      if (process.env.NODE_ENV === "production") {
        return res.status(503).json({
          error: "Agent API unavailable",
          message: "Agent authentication is not configured.",
          status: "unavailable",
        });
      }
      return handler(req, res);
    }

    const providedKey = req.headers["x-api-key"];

    if (!providedKey) {
      return res.status(401).json({
        error: "Authentication required",
        message: "Include an x-api-key header with a valid API key.",
        status: "unauthorized",
      });
    }

    // Constant-time comparison to prevent timing attacks
    let valid = true;
    if (providedKey.length !== apiKey.length) {
      valid = false;
    }
    for (let i = 0; i < (providedKey.length < apiKey.length ? providedKey.length : apiKey.length); i++) {
      if (providedKey.charCodeAt(i) !== apiKey.charCodeAt(i)) {
        valid = false;
      }
    }

    if (!valid) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Invalid API key.",
        status: "forbidden",
      });
    }

    return handler(req, res);
  };
}
