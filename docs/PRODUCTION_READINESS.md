# Production Readiness Roadmap

## Current Focus
- Consolidate `BuilderCreditCore` with verified scoring logic.
- Remove untrusted user-provided credit score input from funding requests.
- Align on-chain funding calculation with frontend and product score ranges.
- Keep improvements modular and backward-compatible where possible.

## Smart Contract Tasks
1. Add `SCORER_ROLE` to `blockchain/contracts/BuilderCreditCore.sol`.
2. Implement `setReputation(address developer, uint256 reputation)`.
3. Require credit score proof by using stored reputation during `requestFunding`.
4. Ignore direct user-supplied `creditScore` in `requestFunding`.
5. Align `calculateFundingAmount` with the frontend 400–800 score range and 500–5000 USDC funding scale.
6. Add defensive validation for `MIN_CREDIT_SCORE` and `MAX_CREDIT_SCORE`.
7. Audit or remove legacy `BuilderCreditFactory.sol`, `BuilderCreditSecurity.sol`, and `BuilderCreditStorage.sol` if they are not part of current deployment.

## Testing and Validation
- Update `blockchain/test/BuilderCreditCore.test.js` to use verified reputation.
- Add regression coverage for:
  - `setReputation` with `SCORER_ROLE`.
  - `requestFunding` rejecting funding without verified credit.
  - funding limit based on the 400–800 score curve.

## Integration Tasks
- Review `frontend/src/contexts/CircleWalletContext.js` and related UI to ensure it continues passing the credit score parameter safely.
- Verify `RealCircleService.js` and `RealLiFiService.js` are not relying on mocked behavior for production flows.

## Deployment & Ops
- Reconcile current deployment scripts with the active core contract set.
- Add multi-chain deployment support for target networks.
- Secure secret management and remove sensitive config from the repo.

## Notes
- This repository currently contains both the active `BuilderCreditCore` implementation and a legacy multi-contract architecture.
- The first production-ready step is to unify and lock down the active core contract path before refactoring or deleting legacy code.
