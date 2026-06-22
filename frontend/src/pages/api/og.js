/**
 * OG Image Generator — Edge function that renders dynamic Open Graph images
 * for builder profiles and project pages.
 *
 * Usage:
 *   /api/og?type=profile&username=thisyearnofear&displayName=Yasin&...
 *   /api/og?type=project&name=DeFi+Voyager&ecosystem=base&...
 *
 * This runs on Vercel's Edge Runtime for fast, cached responses.
 * Caching: Vercel automatically caches ImageResponse at the CDN edge.
 */

import { ImageResponse } from "@vercel/og";

export const config = { runtime: "edge" };

// Load Inter font from Google Fonts
const FONT_URL =
  "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff";

const FONT_BOLD_URL =
  "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiJ-Ek-_EeA.woff";

// Brand colours
const BRAND = {
  indigo: "#4f46e5",
  purple: "#7c3aed",
  pink: "#db2777",
  white: "#ffffff",
  gray50: "#f9fafb",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray400: "#9ca3af",
  gray500: "#6b7280",
  gray600: "#4b5563",
  gray700: "#374151",
  gray900: "#111827",
};

// Ecosystem badge colours
const ECOSYSTEM_COLORS = {
  celo: { bg: "#d1fae5", text: "#065f46" },
  arc: { bg: "#ccfbf1", text: "#0f766e" },
  base: { bg: "#dbeafe", text: "#1e40af" },
  linea: { bg: "#f3e8ff", text: "#6b21a8" },
  arbitrum: { bg: "#e0f2fe", text: "#075985" },
  ethereum: { bg: "#eef2ff", text: "#3730a3" },
  optimism: { bg: "#fef2f2", text: "#991b1b" },
  solana: { bg: "#d1fae5", text: "#065f46" },
};

const ECOSYSTEM_LABELS = {
  celo: "Celo",
  arc: "Arc",
  base: "Base",
  linea: "Linea",
  arbitrum: "Arbitrum",
  ethereum: "Ethereum",
  optimism: "Optimism",
  solana: "Solana",
};

const ECOSYSTEM_EMOJIS = {
  celo: "\uD83C\uDF31",
  arc: "\u26A1",
  base: "\uD83D\uDD35",
  linea: "\uD83D\uDD34",
  arbitrum: "\uD83D\uDD37",
  ethereum: "\uD83D\uDC8E",
  optimism: "\uD83D\uDD34",
  solana: "\u2600\uFE0F",
};

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "profile";

    const [fontRegular, fontBold] = await Promise.all([
      fetch(FONT_URL).then((r) => r.arrayBuffer()),
      fetch(FONT_BOLD_URL).then((r) => r.arrayBuffer()),
    ]);

    if (type === "profile") {
      return renderProfileOG(searchParams, fontRegular, fontBold);
    }

    if (type === "project") {
      return renderProjectOG(searchParams, fontRegular, fontBold);
    }

    if (type === "hackathon") {
      return renderHackathonOG(searchParams, fontRegular, fontBold);
    }

    return renderFallbackOG(fontRegular, fontBold);
  } catch (e) {
    console.error("OG image error:", e);
    return renderFallbackOG();
  }
}

/** ── Builder Profile OG Image ── */
function renderProfileOG(params, fontRegular, fontBold) {
  const displayName = params.get("displayName") || "Builder";
  const username = params.get("username") || "";
  const avatar = params.get("avatar") || "";
  const projectCount = params.get("projectCount") || "0";
  const ecosystemCount = params.get("ecosystemCount") || "0";
  const ethosScore = params.get("ethosScore") || "";
  const avgHealth = params.get("avgHealth") || "0";
  const totalStars = params.get("totalStars") || "0";
  const badgesParam = params.get("badges") || "";
  const badges = badgesParam ? badgesParam.split(",").filter(Boolean).slice(0, 5) : [];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)",
          fontFamily: '"Inter"',
          color: BRAND.white,
          padding: "48px 56px",
          position: "relative",
        }}
      >
        {/* Top bar: logo + tagline */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>⚓</span>
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: "-0.3px",
                opacity: 0.9,
              }}
            >
              Proof of Ship
            </span>
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              opacity: 0.7,
              padding: "6px 14px",
              borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            Builder Profile
          </div>
        </div>

        {/* Main content */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 32,
            marginTop: 40,
          }}
        >
          {/* Avatar */}
          {avatar ? (
            <img
              src={avatar}
              alt=""
              width={96}
              height={96}
              style={{
                borderRadius: "50%",
                border: "3px solid rgba(255,255,255,0.3)",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.15)",
                border: "3px solid rgba(255,255,255,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 40,
                fontWeight: 700,
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
              <span style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-1px" }}>
                {displayName}
              </span>
              {ethosScore && (
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    padding: "4px 12px",
                    borderRadius: 20,
                    background: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.25)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>🛡</span>
                  <span>{ethosScore}</span>
                </span>
              )}
            </div>
            {username && (
              <span style={{ fontSize: 18, opacity: 0.75 }}>
                github.com/{username}
              </span>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: 24,
            marginTop: 32,
            padding: "16px 24px",
            borderRadius: 16,
            background: "rgba(255,255,255,0.1)",
          }}
        >
          <StatBlock label="Projects" value={projectCount} />
          <div style={{ width: 1, background: "rgba(255,255,255,0.2)" }} />
          <StatBlock label="Ecosystems" value={ecosystemCount} />
          <div style={{ width: 1, background: "rgba(255,255,255,0.2)" }} />
          <StatBlock label="Stars" value={totalStars} />
          <div style={{ width: 1, background: "rgba(255,255,255,0.2)" }} />
          <StatBlock label="Health" value={`${avgHealth}%`} />
        </div>

        {/* Badge pills row */}
        {badges.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 20,
            }}
          >
            {badges.map((badge, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 12px",
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.9)",
                }}
              >
                <span style={{ fontSize: 14 }}>✦</span>
                <span>{badge}</span>
              </div>
            ))}
          </div>
        )}

        {/* Bottom wave decoration */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "40%",
            background:
              "radial-gradient(ellipse at 20% 100%, rgba(255,255,255,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(255,255,255,0.06) 0%, transparent 60%)",
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Inter", data: fontRegular, weight: 400 },
        { name: "Inter", data: fontBold, weight: 700 },
      ],
    }
  );
}

/** ── Project OG Image ── */
function renderProjectOG(params, fontRegular, fontBold) {
  const name = params.get("name") || "Project";
  const ecosystem = params.get("ecosystem") || "";
  const description = params.get("description") || "";
  const stars = params.get("stars") || "0";
  const health = params.get("health") || "0";
  const verified = params.get("verified") === "true";
  const ecoColors = ECOSYSTEM_COLORS[ecosystem] || { bg: BRAND.gray100, text: BRAND.gray700 };
  const ecoLabel = ECOSYSTEM_LABELS[ecosystem] || ecosystem;
  const ecoEmoji = ECOSYSTEM_EMOJIS[ecosystem] || "\uD83C\uDF10";
  const badgesParam = params.get("badges") || "";
  const badges = badgesParam ? badgesParam.split(",").filter(Boolean).slice(0, 5) : [];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)",
          fontFamily: '"Inter"',
          color: BRAND.white,
          padding: "48px 56px",
          position: "relative",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>⚓</span>
            <span
              style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px", opacity: 0.9 }}
            >
              Proof of Ship
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 14,
              fontWeight: 600,
              padding: "6px 14px",
              borderRadius: 20,
              background: ecoColors.bg,
              color: ecoColors.text,
            }}
          >
            <span>{ecoEmoji}</span>
            <span>{ecoLabel}</span>
          </div>
        </div>

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            marginTop: 48,
            maxWidth: "90%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-1px", lineHeight: 1.1 }}>
              {name}
            </span>
            {verified && (
              <span style={{ fontSize: 28 }}>✅</span>
            )}
          </div>

          {description && (
            <span
              style={{
                fontSize: 22,
                opacity: 0.8,
                lineHeight: 1.4,
                maxWidth: "90%",
                overflow: "hidden",
              }}
            >
              {description.length > 200 ? `${description.slice(0, 200)}...` : description}
            </span>
          )}
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: 24,
            marginTop: 32,
            padding: "16px 24px",
            borderRadius: 16,
            background: "rgba(255,255,255,0.08)",
          }}
        >
          <StatBlock label="Stars" value={stars} />
          <div style={{ width: 1, background: "rgba(255,255,255,0.15)" }} />
          <StatBlock label="Health" value={`${health}%`} />
          <div style={{ width: 1, background: "rgba(255,255,255,0.15)" }} />
          <StatBlock label="Ecosystem" value={ecoLabel} />
        </div>

        {/* Badge pills row */}
        {badges.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 20,
            }}
          >
            {badges.map((badge, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 12px",
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.9)",
                }}
              >
                <span style={{ fontSize: 14 }}>✦</span>
                <span>{badge}</span>
              </div>
            ))}
          </div>
        )}

        {/* Bottom decoration */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "35%",
            background:
              "radial-gradient(ellipse at 30% 100%, rgba(99,102,241,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 100%, rgba(168,85,247,0.1) 0%, transparent 60%)",
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Inter", data: fontRegular, weight: 400 },
        { name: "Inter", data: fontBold, weight: 700 },
      ],
    }
  );
}

/** ── Hackathon OG Image ── */
function renderHackathonOG(params, fontRegular, fontBold) {
  const name = params.get("name") || "Hackathon";
  const ecosystem = params.get("ecosystem") || "";
  const prizePool = params.get("prizePool") || "";
  const avgPayoutDays = params.get("avgPayoutDays") || "";
  const payoutRate = params.get("payoutRate") || "";
  const status = params.get("status") || "";
  const ecoColors = ECOSYSTEM_COLORS[ecosystem] || { bg: BRAND.gray100, text: BRAND.gray700 };
  const ecoEmoji = ECOSYSTEM_EMOJIS[ecosystem] || "\uD83C\uDF10";
  const ecoLabel = ECOSYSTEM_LABELS[ecosystem] || ecosystem;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          fontFamily: '"Inter"',
          color: BRAND.white,
          padding: "48px 56px",
          position: "relative",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>⚓</span>
            <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px", opacity: 0.9 }}>
              Proof of Ship
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 14,
              fontWeight: 600,
              padding: "6px 14px",
              borderRadius: 20,
              background: ecoColors.bg,
              color: ecoColors.text,
            }}
          >
            <span>{ecoEmoji}</span>
            <span>{ecoLabel}</span>
          </div>
        </div>

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginTop: 48,
          }}
        >
          <span style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-1px", lineHeight: 1.1 }}>
            {name}
          </span>
          {status && (
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                padding: "4px 12px",
                borderRadius: 20,
                background: status === "completed" ? "rgba(5,150,105,0.25)" : status === "active" ? "rgba(37,99,235,0.25)" : "rgba(251,191,36,0.25)",
                display: "inline-flex",
                width: "fit-content",
                alignItems: "center",
                gap: 6,
              }}
            >
              {status === "completed" ? "✅" : status === "active" ? "▶" : "📅"}
              <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
            </span>
          )}
        </div>

        {/* Metrics row */}
        <div
          style={{
            display: "flex",
            gap: 24,
            marginTop: 32,
            padding: "16px 24px",
            borderRadius: 16,
            background: "rgba(255,255,255,0.08)",
          }}
        >
          {avgPayoutDays && (
            <>
              <StatBlock label="Avg Payout" value={`${avgPayoutDays}d`} />
              <div style={{ width: 1, background: "rgba(255,255,255,0.15)" }} />
            </>
          )}
          {payoutRate && (
            <>
              <StatBlock label="Paid" value={`${payoutRate}%`} />
              <div style={{ width: 1, background: "rgba(255,255,255,0.15)" }} />
            </>
          )}
          {prizePool && (
            <StatBlock label="Prize Pool" value={`$${Number(prizePool).toLocaleString()}`} />
          )}
          {!avgPayoutDays && !payoutRate && !prizePool && (
            <StatBlock label="Hackathon" value="Track payout speed" />
          )}
        </div>

        {/* Bottom decoration */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "35%",
            background:
              "radial-gradient(ellipse at 30% 100%, rgba(15,52,96,0.4) 0%, transparent 60%), radial-gradient(ellipse at 70% 100%, rgba(22,33,62,0.3) 0%, transparent 60%)",
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Inter", data: fontRegular, weight: 400 },
        { name: "Inter", data: fontBold, weight: 700 },
      ],
    }
  );
}

/** ── Fallback OG Image ── */
function renderFallbackOG(fontRegular, fontBold) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)",
          fontFamily: '"Inter"',
          color: BRAND.white,
          padding: 48,
        }}
      >
        <span style={{ fontSize: 64, marginBottom: 24 }}>⚓</span>
        <span style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-1px" }}>
          Proof of Ship
        </span>
        <span style={{ fontSize: 22, opacity: 0.75, marginTop: 12 }}>
          Build. Ship. Get Backed.
        </span>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: fontRegular && fontBold
        ? [
            { name: "Inter", data: fontRegular, weight: 400 },
            { name: "Inter", data: fontBold, weight: 700 },
          ]
        : undefined,
    }
  );
}

/** ── Shared stat block component ── */
function StatBlock({ label, value }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px" }}>
        {value}
      </span>
      <span style={{ fontSize: 14, opacity: 0.7, fontWeight: 500 }}>{label}</span>
    </div>
  );
}
