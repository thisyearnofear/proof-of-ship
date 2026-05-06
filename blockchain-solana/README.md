### Agentic Engineering & Solana Integration
This project leverages [Solana Playground](https://solana.new) (solana.new) for rapid prototyping of our autonomous credit programs. 
- **Agentic Workflow:** We utilize AI-assisted coding to iterate on our on-chain reputation logic, ensuring our "Voyage Log" (Heartbeat) protocol is natively compatible with Solana’s high-throughput requirements.
- **Grant Alignment:** Our protocol acts as a foundational "Proof of Activity" layer for autonomous AI agents, allowing them to verify shipping milestones on-chain.
- **Proof of Work:** Rapid deployment and testing conducted via Solana Playground.

### Devnet Runbook
After you deploy the Anchor program to devnet, use this sequence:

1. Sync the latest IDL into the frontend:
   `npm run idl:copy`
2. Initialize the treasury ATA:
   `npm run treasury:init`
3. Run the devnet flow to generate real transaction links:
   `SNS_DOMAIN=your-name.sol npm run tx:devnet`

### Notes
- `scripts/init-config.ts` is a legacy filename, but it now initializes the treasury ATA for the current program.
- `scripts/devnet-transactions.ts` is the transaction driver for the Colosseum proof run and now requires `SNS_DOMAIN` to be set to a `.sol` domain owned by the funded devnet wallet.
- The frontend falls back to the program address embedded in `frontend/src/idl/blockchain_solana.json` if `NEXT_PUBLIC_SOLANA_PROGRAM_ID` is not set.
- After changing the Anchor instruction shape, rebuild and re-copy the IDL before testing the frontend funding flow.
