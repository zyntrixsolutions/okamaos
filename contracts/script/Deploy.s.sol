// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Script, console} from "forge-std/Script.sol";
import {OKToken} from "../src/OKToken.sol";
import {OKAssets} from "../src/OKAssets.sol";

/// @notice Deploy OKToken and OKAssets to Base or Base Sepolia.
///
/// Usage (Base Sepolia):
///   forge script script/Deploy.s.sol \
///     --rpc-url base_sepolia \
///     --broadcast \
///     --verify \
///     -vvvv
///
/// Required env vars:
///   PRIVATE_KEY        — deployer private key (hex, no 0x prefix)
///   BASESCAN_API_KEY   — for contract verification
///   METADATA_BASE_URI  — ERC-1155 metadata base URI (optional, has default)
contract DeployScript is Script {
    string internal constant DEFAULT_METADATA_URI =
        "https://zyntrixsolutions.github.io/okamaos/metadata/{id}.json";

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer    = vm.addr(deployerKey);
        string memory uri   = vm.envOr("METADATA_BASE_URI", DEFAULT_METADATA_URI);

        vm.startBroadcast(deployerKey);

        OKToken  token  = new OKToken(deployer);
        OKAssets assets = new OKAssets(deployer, uri);

        vm.stopBroadcast();

        console.log("Deployer  :", deployer);
        console.log("OKToken   :", address(token));
        console.log("OKAssets  :", address(assets));
    }
}
