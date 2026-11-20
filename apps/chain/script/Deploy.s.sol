// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {MockStablecoin} from "../src/MockStablecoin.sol";
import {DebtSettlement} from "../src/DebtSettlement.sol";

/// @notice Deploys the mock stablecoin and the settlement contract.
/// @dev Reads the deployer key from the `PRIVATE_KEY` env var; the deployer owns the token.
contract Deploy is Script {
    function run() external returns (MockStablecoin token, DebtSettlement settlement) {
        uint256 key = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(key);

        vm.startBroadcast(key);
        token = new MockStablecoin(deployer);
        settlement = new DebtSettlement(address(token));
        vm.stopBroadcast();

        console.log("Deployer:        ", deployer);
        console.log("MockStablecoin:  ", address(token));
        console.log("DebtSettlement:  ", address(settlement));
    }
}
