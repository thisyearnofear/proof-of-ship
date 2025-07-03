/**
 * Circle Wallets API
 * Handles wallet creation and listing using real Circle service
 */

import { realCircleService } from "../../../services/RealCircleService";
import { withApiMiddleware } from "../../../utils/apiMiddleware";

/**
 * Handler for the wallets API endpoint
 */
async function walletsHandler(req, res) {
  try {
    if (req.method === "GET") {
      // Get wallets
      const walletSetId = req.query.walletSetId;
      const result = await realCircleService.getWallets(walletSetId);

      return res.status(200).json({
        success: true,
        data: result.data,
      });
    } else if (req.method === "POST") {
      // Create wallet
      const {
        idempotencyKey,
        entitySecretCiphertext,
        walletSetId,
        blockchains,
        count,
        metadata,
      } = req.body;

      if (!idempotencyKey) {
        return res.status(400).json({
          success: false,
          error: "Idempotency key is required",
        });
      }

      const config = {
        name: metadata?.name || "Developer Wallet",
        description: metadata?.description || "Wallet for developer funding",
        userId: metadata?.userId,
        metadata: metadata || {},
      };

      const result = await realCircleService.createWallet(config);

      return res.status(201).json({
        success: true,
        data: result.data,
      });
    } else {
      return res.status(405).json({
        success: false,
        error: "Method not allowed",
      });
    }
  } catch (error) {
    console.error("Circle Wallets API error:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
      details: error.details || {},
    });
  }
}

// Apply middleware
export default withApiMiddleware(walletsHandler, {
  allowedMethods: ["GET", "POST"],
  rateLimit: 10,
  rateLimitKey: "CIRCLE_WALLETS_API",
});
