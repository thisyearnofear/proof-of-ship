# Builder Credit Platform

Decentralized platform where backers fund builders and hackathon prizes collateralize credit.

Backers stake USDC on builders with multiplied returns. Builders pledge expected prizes as collateral. Prize wins auto-repay backers, then the builder. Credit limits scale with market confidence.

## Quick Start

```bash
npm run setup        # install all dependencies
npm run dev          # frontend dev server
npm run blockchain:test  # run contract tests
```

## Structure

- `frontend/` — Next.js app (pages, components, contexts, services)
- `blockchain/` — Hardhat workspace (Solidity contracts, deploy scripts, tests)
- `snap-server/` — Farcaster Snap server (scout + celebration snaps)
- `docs/` — [Documentation](./docs/README.md), [production roadmap](./docs/PRODUCTION_READINESS.md), [changelog](./docs/CHANGELOG.md)

## Links

- **Live:** [proofofship.web.app](https://proofofship.web.app)
- **Mirror:** [proof-of-ship.vercel.app](https://proof-of-ship.vercel.app)

## License

MIT
