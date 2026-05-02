// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title OKAssets — OkamaOS NFT game asset contract (Base)
/// @notice ERC-1155 with per-game token IDs. Metadata served from
///         IPFS / GitHub Pages via the base URI pattern.
///         Token IDs follow the convention: gameIndex * 1e6 + assetIndex
///         so each game has its own ID namespace.
contract OKAssets is ERC1155, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    string public name = "OKAssets";
    string public symbol = "OKA";

    constructor(address initialAdmin, string memory baseURI)
        ERC1155(baseURI)
    {
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(MINTER_ROLE, initialAdmin);
    }

    /// @notice Mint a single asset to a player.
    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) external onlyRole(MINTER_ROLE) {
        _mint(to, id, amount, data);
    }

    /// @notice Batch-mint assets to a player.
    function mintBatch(
        address to,
        uint256[] calldata ids,
        uint256[] calldata amounts,
        bytes calldata data
    ) external onlyRole(MINTER_ROLE) {
        _mintBatch(to, ids, amounts, data);
    }

    /// @notice Update the metadata base URI (admin only).
    function setURI(string calldata newuri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setURI(newuri);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
