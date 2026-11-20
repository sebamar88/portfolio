// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MockStablecoin} from "../src/MockStablecoin.sol";

contract MockStablecoinTest is Test {
    MockStablecoin token;
    address owner = makeAddr("owner");
    address alice = makeAddr("alice");

    function setUp() public {
        token = new MockStablecoin(owner);
    }

    function test_metadata() public view {
        assertEq(token.name(), "Mock USD");
        assertEq(token.symbol(), "mUSD");
        assertEq(token.decimals(), 6);
        assertEq(token.FAUCET_AMOUNT(), 1_000e6);
        assertEq(token.FAUCET_COOLDOWN(), 1 days);
    }

    function test_ownerCanMint() public {
        vm.prank(owner);
        token.mint(alice, 5e6);
        assertEq(token.balanceOf(alice), 5e6);
    }

    function test_mint_revertsForNonOwner() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        token.mint(alice, 1);
    }

    function test_faucet_mintsCap() public {
        vm.prank(alice);
        token.faucet();
        assertEq(token.balanceOf(alice), 1_000e6);
    }

    function test_faucet_cooldownEnforced() public {
        vm.startPrank(alice);
        token.faucet();
        uint256 next = block.timestamp + 1 days;
        vm.expectRevert(abi.encodeWithSelector(MockStablecoin.FaucetCooldown.selector, next));
        token.faucet();

        vm.warp(next - 1);
        vm.expectRevert(abi.encodeWithSelector(MockStablecoin.FaucetCooldown.selector, next));
        token.faucet();
        vm.stopPrank();
        assertEq(token.balanceOf(alice), 1_000e6);
    }

    function test_faucet_worksAgainAfterCooldown() public {
        vm.startPrank(alice);
        token.faucet();
        vm.warp(block.timestamp + 1 days);
        token.faucet();
        vm.stopPrank();
        assertEq(token.balanceOf(alice), 2_000e6);
    }

    function test_faucet_isPerAddress() public {
        vm.prank(alice);
        token.faucet();
        address bob = makeAddr("bob");
        vm.prank(bob);
        token.faucet();
        assertEq(token.balanceOf(bob), 1_000e6);
    }

    function testFuzz_faucet_capNeverExceededInWindow(uint8 calls) public {
        vm.startPrank(alice);
        for (uint256 i; i < calls; ++i) {
            try token.faucet() {} catch {}
        }
        vm.stopPrank();
        assertLe(token.balanceOf(alice), 1_000e6);
    }
}
