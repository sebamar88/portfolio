// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title MockStablecoin
/// @notice Testnet-only USD stand-in ("mUSD") that mimics USDC's 6 decimals.
/// @dev WHY a mock: real stablecoins are not freely available on Sepolia, and the demo needs
///      anyone to be able to obtain funds. The owner-gated `mint` is for seeding; the public
///      `faucet` is rate limited so a demo wallet can self-serve without unbounded inflation.
///      NEVER deploy this on mainnet.
contract MockStablecoin is ERC20, Ownable {
    /// @notice Amount handed out per faucet call (1,000 mUSD).
    uint256 public constant FAUCET_AMOUNT = 1_000e6;
    /// @notice Minimum time between faucet calls for the same address.
    uint256 public constant FAUCET_COOLDOWN = 1 days;

    /// @notice Timestamp of the last successful faucet call per address.
    mapping(address account => uint256 timestamp) public lastFaucetAt;

    /// @notice The caller must wait until `availableAt` before using the faucet again.
    error FaucetCooldown(uint256 availableAt);

    constructor(address initialOwner) ERC20("Mock USD", "mUSD") Ownable(initialOwner) {}

    /// @dev 6 decimals to match USDC, so amounts in the dApp behave like the real thing.
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Owner-only arbitrary mint (seeding test accounts).
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice Mints `FAUCET_AMOUNT` to the caller at most once per `FAUCET_COOLDOWN`.
    /// @dev The first call is always allowed (lastFaucetAt == 0 is treated as "never used").
    function faucet() external {
        uint256 last = lastFaucetAt[msg.sender];
        if (last != 0 && block.timestamp < last + FAUCET_COOLDOWN) {
            revert FaucetCooldown(last + FAUCET_COOLDOWN);
        }
        lastFaucetAt[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
    }
}
