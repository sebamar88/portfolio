// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {DebtSettlement} from "../src/DebtSettlement.sol";
import {MockStablecoin} from "../src/MockStablecoin.sol";

contract DebtSettlementTest is Test {
    event DebtSettled(
        bytes32 indexed groupId,
        address indexed debtor,
        address indexed creditor,
        uint256 amount,
        bytes32 settlementRef
    );

    MockStablecoin token;
    DebtSettlement settlement;
    address debtor = makeAddr("debtor");
    address creditor = makeAddr("creditor");
    bytes32 constant GROUP = keccak256("group-1");
    bytes32 constant REF = keccak256("transfer-1");

    function setUp() public {
        token = new MockStablecoin(address(this));
        settlement = new DebtSettlement(address(token));
        token.mint(debtor, 1_000e6);
        vm.prank(debtor);
        token.approve(address(settlement), type(uint256).max);
    }

    function test_constructor_setsToken() public view {
        assertEq(address(settlement.TOKEN()), address(token));
    }

    function test_constructor_revertsOnZeroToken() public {
        vm.expectRevert(DebtSettlement.ZeroAddress.selector);
        new DebtSettlement(address(0));
    }

    function test_settle_happyPath() public {
        vm.prank(debtor);
        settlement.settle(GROUP, creditor, 40e6, REF);
        assertEq(token.balanceOf(debtor), 960e6);
        assertEq(token.balanceOf(creditor), 40e6);
        assertEq(token.balanceOf(address(settlement)), 0);
        assertTrue(settlement.isSettled(REF));
    }

    function test_settle_emitsEvent() public {
        vm.expectEmit(true, true, true, true, address(settlement));
        emit DebtSettled(GROUP, debtor, creditor, 40e6, REF);
        vm.prank(debtor);
        settlement.settle(GROUP, creditor, 40e6, REF);
    }

    function test_settle_consumesAllowance() public {
        vm.prank(debtor);
        token.approve(address(settlement), 100e6);
        vm.prank(debtor);
        settlement.settle(GROUP, creditor, 40e6, REF);
        assertEq(token.allowance(debtor, address(settlement)), 60e6);
    }

    function test_settle_revertsOnZeroAmount() public {
        vm.prank(debtor);
        vm.expectRevert(DebtSettlement.ZeroAmount.selector);
        settlement.settle(GROUP, creditor, 0, REF);
    }

    function test_settle_revertsOnSelf() public {
        vm.prank(debtor);
        vm.expectRevert(DebtSettlement.SelfSettlement.selector);
        settlement.settle(GROUP, debtor, 1e6, REF);
    }

    function test_settle_revertsOnZeroCreditor() public {
        vm.prank(debtor);
        vm.expectRevert(DebtSettlement.ZeroAddress.selector);
        settlement.settle(GROUP, address(0), 1e6, REF);
    }

    function test_settle_revertsOnReusedRef() public {
        vm.startPrank(debtor);
        settlement.settle(GROUP, creditor, 1e6, REF);
        vm.expectRevert(abi.encodeWithSelector(DebtSettlement.AlreadySettled.selector, REF));
        settlement.settle(GROUP, creditor, 1e6, REF);
        vm.stopPrank();
        assertEq(token.balanceOf(creditor), 1e6);
    }

    function test_settle_revertsWithoutAllowance() public {
        address other = makeAddr("other");
        token.mint(other, 10e6);
        vm.prank(other);
        vm.expectRevert();
        settlement.settle(GROUP, creditor, 1e6, REF);
        assertFalse(settlement.isSettled(REF));
    }

    function test_settle_revertsOnInsufficientBalance() public {
        vm.prank(debtor);
        vm.expectRevert();
        settlement.settle(GROUP, creditor, 1_001e6, REF);
        assertFalse(settlement.isSettled(REF));
    }

    function testFuzz_settle_movesExactAmount(
        uint256 balance,
        uint256 allowance,
        uint256 amount,
        bytes32 ref
    ) public {
        balance = bound(balance, 1, type(uint128).max);
        allowance = bound(allowance, 1, type(uint128).max);
        amount = bound(amount, 1, balance < allowance ? balance : allowance);
        address d = makeAddr("fuzzDebtor");
        token.mint(d, balance);
        vm.startPrank(d);
        token.approve(address(settlement), allowance);
        settlement.settle(GROUP, creditor, amount, ref);
        vm.stopPrank();
        assertEq(token.balanceOf(d), balance - amount);
        assertEq(token.balanceOf(creditor), amount);
        assertEq(token.allowance(d, address(settlement)), allowance - amount);
    }

    function testFuzz_settle_refReuseAlwaysReverts(bytes32 ref, uint96 a1, uint96 a2) public {
        a1 = uint96(bound(a1, 1, 500e6));
        a2 = uint96(bound(a2, 1, 500e6));
        vm.startPrank(debtor);
        settlement.settle(GROUP, creditor, a1, ref);
        vm.expectRevert(abi.encodeWithSelector(DebtSettlement.AlreadySettled.selector, ref));
        settlement.settle(keccak256("other"), creditor, a2, ref);
        vm.stopPrank();
    }
}
