# @portfolio/chain — on-chain settlement (module 7a)

Balances are computed **off-chain** by the Core API; the chain only **settles** debts.
A debtor approves the token, then calls `DebtSettlement.settle(...)`, which moves funds
straight to the creditor and emits `DebtSettled`.

| Contract | Purpose |
|---|---|
| `src/MockStablecoin.sol` | ERC-20 "Mock USD" / `mUSD`, 6 decimals (like USDC). Owner `mint`, public `faucet()` (1,000 mUSD per address per 24h). Testnet only. |
| `src/DebtSettlement.sol` | `settle(groupId, creditor, amount, settlementRef)`. |
| `script/Deploy.s.sol` | Deploys both, logs addresses. |

## Design decisions

- **Non-custodial**: `safeTransferFrom(debtor → creditor)`; the contract never holds funds and has no owner/admin. Covered by an invariant test (token balance always 0).
- **Idempotent**: `settlementRef` (the off-chain transfer id) is single-use → `AlreadySettled(ref)`. Retries/replays can't pay twice.
- **Custom errors** (`ZeroAmount`, `SelfSettlement`, `ZeroAddress`, `AlreadySettled`): cheap and decodable by the dApp.
- **Mock token**: real stablecoins aren't freely available on Sepolia; the faucet lets demo users self-serve.
- Checks-effects-interactions + `ReentrancyGuard`; token address is `immutable`.

## Tooling

Foundry is run through Docker (`ghcr.io/foundry-rs/foundry:stable`) via `scripts/forge.sh`
(runs as your uid, so no root-owned files). CI uses `foundry-rs/foundry-toolchain`.
There is no `package.json`: this is a Foundry project, not a JavaScript package, so it stays out of
the pnpm workspace and `pnpm -r` never needs Docker or Foundry.

Dependencies (OpenZeppelin 5.1.0, forge-std 1.9.4) are managed with **Soldeer**: pinned in
`foundry.toml` + `soldeer.lock` (checksums), downloaded into git-ignored `dependencies/`,
remapped in `remappings.txt`. No git submodules, no npm packages.

```sh
make deps        # forge soldeer install
make test        # forge test -vv   (unit + fuzz 1000 runs + invariant)
make lint        # forge fmt --check
make snapshot    # refresh .gas-snapshot (commit it)
```

## Deploy to Sepolia

```sh
cp env.example .env      # fill PRIVATE_KEY, SEPOLIA_RPC_URL, ETHERSCAN_API_KEY (never commit)
set -a; . ./.env; set +a
forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

Use a throwaway key funded with Sepolia ETH. The script prints the token and settlement
addresses; the deployer owns the token.
