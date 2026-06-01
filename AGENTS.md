# Repository Guidelines

A pnpm monorepo (`pnpm-workspace.yaml`) with four packages: `frontend` (Next 16 App Router, React 19), `blockchain` (Hardhat/Solidity), `blockchain-solana` (Anchor), `snap-server`. Run everything from the root via `pnpm --filter ./frontend <script>`; package scripts are wrappers that delegate.

## Build, Test, and Development Commands

```bash
pnpm install                                # one-time
pnpm dev                                    # frontend at :3000
pnpm --filter ./frontend build              # production build (Turbopack)
pnpm --filter ./frontend test               # vitest watch
pnpm --filter ./frontend test:run           # vitest one-shot (119/119 pass at HEAD)
npx tsc -p frontend --noEmit                # type check
pnpm blockchain:test                        # solidity
cd blockchain-solana && anchor test         # solana
```

A single vitest file: `cd frontend && npx vitest run src/path/to/file.test.ts`.

## Project Structure & Architecture

- `frontend/src/stores/` — three `useSyncExternalStore` stores (`authStore.ts`, `profileStore.ts`, `walletStore.ts`) replacing the legacy `contexts/` tree (Phase 3). Cross-store calls go through module-level `*Actions` objects, never through hooks.
- `frontend/src/lib/chains/` — single source of truth for the seven EVM chains (Arc, Celo, Base, Linea, Arbitrum, Ethereum, Optimism) + Solana. Wallet-shared types/constants live in `lib/wallet/`.
- `frontend/src/lib/wallet/constants.ts` — `AGENT_PRICES` (USD costs for x402 AI agent calls), `NETWORK_CONFIGS`.
- `frontend/src/services/` — data + integrations; per-domain files (`ProjectDataService`, `SubmissionService`, `DataServiceCore`, `walletService`, etc.). `DataService.ts` is a re-export shim — add new methods to `DataServiceCore`.
- Decomposition convention: large pages live in `pages/` and pull co-located subcomponents from sibling folders (`components/leaderboard/`, `components/explore/`, `components/projects/editor/`, `components/common/layout/Navbar/`). New large pages follow the same pattern — see `pages/leaderboard.js` (167 LOC) for the canonical example.
- Hydrator pattern: components that need wagmi/Solana hooks read them and write to `walletStore` via `setState` (see `stores/walletStore.ts` `WalletHydrator`).

## Coding Style & Naming Conventions

- TypeScript `strict: true`; `allowJs: true`. Some files are `.js` with JSDoc type annotations.
- **Turbopack strictness**: Next 16's default Turbopack parser does NOT strip TypeScript syntax from `.js` files. Co-located `.js` files must use JSDoc (`@typedef`, `@type`), never `interface`, `type`, or `as any` casts. Renaming `.js`→`.ts` is fine for new isolated files.
- Hooks default-export (`export default useFoo`), not named — even when only one export.
- No ESLint config (Next 16 removed `next lint`); no Prettier. Match surrounding style.

## Testing Guidelines

Vitest 4.1.5 with jsdom. Tests live next to source as `*.test.ts`/`*.test.js`. Mock external SDKs (Firebase admin, nanopayment middleware, agent identity) at the module boundary with `vi.mock('@/lib/...')`. Firestore query mocks must be chainable — see `src/lib/__tests__/api/agent-routes.test.js` `fakeQuery()`.

## Commit & Pull Request Guidelines

Lowercase `<type>: <description>` — `refactor:`, `fix:`, `chore:`, `feat:`. Body explains the why + measured outcome (LOC counts, test deltas, build status). One logical change per commit; atomic renames use `git mv` to preserve history. Branch is `main`; push directly (no PR template, no CI).
