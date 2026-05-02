// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title OKToken — OkamaOS play-to-earn reward token (Base)
/// @notice ERC-20 with a MINTER_ROLE held by the OkamaLabs relay.
///         Players earn OKT for in-game milestones; the relay mints
///         on verified claim submissions from on-device wallets.
contract OKToken is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 1e18; // 1 billion OKT

    constructor(address initialAdmin) ERC20("OKToken", "OKT") {
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(MINTER_ROLE, initialAdmin);
    }

    /// @notice Mint OKT to a player wallet (relay only).
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "OKToken: max supply exceeded");
        _mint(to, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
