// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title DebtSettlement
/// @notice Settles a debt between two group members by moving ERC-20 tokens debtor -> creditor.
/// @dev Balances are computed OFF-chain by the Core API; the chain only records that a payment
///      happened. Design choices:
///      - Non-custodial: tokens go straight from the debtor to the creditor via
///        `safeTransferFrom`; the contract never holds funds and has NO owner or admin powers.
///      - Idempotent: `settlementRef` (the off-chain transfer id) can be used only once, so a
///        retried or replayed request can never pay the same debt twice.
///      - Custom errors are cheaper than revert strings and easy for the dApp to decode.
contract DebtSettlement is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice The only token this contract settles in (fixed at deploy time).
    IERC20 public immutable TOKEN;

    /// @notice Whether a settlement reference has already been used.
    mapping(bytes32 settlementRef => bool used) public isSettled;

    /// @notice Emitted when a debt is paid; the API/indexer correlates it via `settlementRef`.
    event DebtSettled(
        bytes32 indexed groupId,
        address indexed debtor,
        address indexed creditor,
        uint256 amount,
        bytes32 settlementRef
    );

    error ZeroAmount();
    error SelfSettlement();
    error ZeroAddress();
    error AlreadySettled(bytes32 settlementRef);

    constructor(address token) {
        if (token == address(0)) revert ZeroAddress();
        TOKEN = IERC20(token);
    }

    /// @notice Pays `amount` of TOKEN from the caller to `creditor`. Requires prior approval.
    /// @param groupId Off-chain group identifier (for indexing only; not validated on-chain).
    /// @param creditor Recipient of the funds.
    /// @param amount Token amount in base units (6 decimals for mUSD).
    /// @param settlementRef Idempotency key (the off-chain transfer id); single use.
    function settle(bytes32 groupId, address creditor, uint256 amount, bytes32 settlementRef)
        external
        nonReentrant
    {
        if (amount == 0) revert ZeroAmount();
        if (creditor == address(0)) revert ZeroAddress();
        if (creditor == msg.sender) revert SelfSettlement();
        if (isSettled[settlementRef]) revert AlreadySettled(settlementRef);

        // Effects before interaction (checks-effects-interactions).
        isSettled[settlementRef] = true;

        TOKEN.safeTransferFrom(msg.sender, creditor, amount);

        emit DebtSettled(groupId, msg.sender, creditor, amount, settlementRef);
    }
}
