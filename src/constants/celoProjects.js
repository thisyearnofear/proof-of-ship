/**
 * Central config for all Celo Hackathon projects.
 * Add or update project details here to auto-update dashboards.
 */
export const celoProjects = [
  {
    slug: "project-alpha",
    name: "Project Alpha",
    season: 1,
    contracts: [
      { label: "Mainnet", address: "0x123..." },
      { label: "Testnet", address: "0xabc..." },
    ],
    socials: {
      twitter: "https://twitter.com/projectalpha",
      discord: "https://discord.gg/alpha",
      website: "https://projectalpha.com",
    },
  },
  {
    slug: "project-beta",
    name: "Project Beta",
    season: 2,
    contracts: [{ label: "Mainnet", address: "0x456..." }],
    socials: {
      twitter: "https://twitter.com/projectbeta",
      discord: "",
      website: "https://projectbeta.io",
    },
  },
  // --- Subpay ---
  {
    slug: "subpay",
    name: "Subpay",
    season: 3,
    contracts: [
      {
        label: "Alfajores Testnet Contract 1",
        address: "0x1D0CB90Feb6eb94AeCC3aCBF9C958D3409916831",
        explorer: "https://alfajores.celoscan.io/address/0x1D0CB90Feb6eb94AeCC3aCBF9C958D3409916831"
      },
      {
        label: "Alfajores Testnet Contract 2",
        address: "0x089D37C1Ca872221E37487c1F2D006907561B1fd",
        explorer: "https://alfajores.celoscan.io/address/0x089D37C1Ca872221E37487c1F2D006907561B1fd"
      }
    ],
    socials: {
      twitter: "",
      discord: "",
      website: ""
    },
    founders: [
      {
        name: "KanasJnr",
        url: "https://x.com/KanasJnr"
      }
    ]
  },
  // --- Jazmeen ---
  {
    slug: "jazmeen",
    name: "Jazmeen",
    season: 3,
    contracts: [
      {
        label: "Mainnet Contract",
        address: "0xe13F9c2C819001fd5D345b32Cf2D4Be67105c4D4",
        explorer: "https://celoscan.io/address/0xe13F9c2C819001fd5D345b32Cf2D4Be67105c4D4"
      }
    ],
    socials: {
      twitter: "",
      discord: "",
      website: ""
    },
    founders: [
      {
        name: "gabedev.eth",
        url: "https://warpcast.com/gabedev.eth"
      }
    ]
  },
  // --- Stable Station ---
  {
    slug: "stablestation",
    name: "Stable Station",
    season: 3,
    contracts: [],
    socials: {
      twitter: "https://x.com/stable_station",
      discord: "",
      website: "https://stable-station.netlify.app/"
    },
    founders: [
      {
        name: "papajams",
        url: "https://hey.xyz/u/papajams"
      },
      {
        name: "papa",
        url: "https://warpcast.com/papa"
      }
    ]
  }
  // ...add more projects as required
];
