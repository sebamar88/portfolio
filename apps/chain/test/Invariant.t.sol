// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {DebtSettlement} from "../src/DebtSettlement.sol";
import {MockStablecoin} from "../src/MockStablecoin.sol";

contract SettlementHandler is Test {
    MockStablecoin public token;
    DebtSettlement public settlement;
    address[3] internal actors;
    uint256 public totalMoved;
    uint256 public settled;

    constructor(MockStablecoin t, DebtSettlement s) {
        token = t;
        settlement = s;
        for (uint256 i; i < actors.length; ++i) {
            actors[i] = makeAddr(string.concat("actor", vm.toString(i)));
        }
    }

    function settle(uint256 from, uint256 to, uint256 amount, bytes32 ref) external {
        address d = actors[from % 3];
        address c = actors[to % 3];
        amount = bound(amount, 0, 2_000e6);
        if (token.balanceOf(d) < amount) {
            vm.prank(token.owner());
            token.mint(d, amount);
        }
        vm.startPrank(d);
        token.approve(address(settlement), amount);
        try settlement.settle(keccak256("g"), c, amount, ref) {
            totalMoved += amount;
            ++settled;
        } catch {}
        vm.stopPrank();
    }

    // Note: tokens donated directly to the contract are outside its control, so the handler
    // never donates; the invariant covers everything the contract itself can do.
}

contract InvariantTest is Test {
    MockStablecoin token;
    DebtSettlement settlement;
    SettlementHandler handler;

    function setUp() public {
        token = new MockStablecoin(address(this));
        settlement = new DebtSettlement(address(token));
        handler = new SettlementHandler(token, settlement);
        token.transferOwnership(address(handler));
        targetContract(address(handler));
    }

    /// Non-custodial: the settlement contract never holds funds.
    function invariant_settlementHoldsNoTokens() public view {
        assertEq(token.balanceOf(address(settlement)), 0);
    }
}
