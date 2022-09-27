// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

//A simple ERC721 that allows users to mint NFTs as they please.
contract Sotm721 is ERC721URIStorage {
    mapping(string => uint8) private _hashes;
    mapping(uint256 => uint8) private _claimed;

    constructor(string memory name_, string memory symbol_)
        ERC721(name_, symbol_)
    {}

    // function mint(uint256 tokenId) external {
    //     require(
    //         _claimed[tokenId] != 1,
    //         "token ID already claimed"
    //     );
    //     _claimed[tokenId] = 1;
    //     _safeMint(_msgSender(), tokenId);
    // }

    function mintWithMetadata(
        uint256 tokenId,
        string memory assetHash,
        string memory tokenURI
    ) external {
        require(
            _claimed[tokenId] != 1,
            "token ID already claimed"
        );
        _claimed[tokenId] = 1;

        require(
            _hashes[assetHash] != 1,
            "hash already claimed"
        );
        _hashes[assetHash] = 1;

        _safeMint(_msgSender(), tokenId);
        _setTokenURI(tokenId, tokenURI);
    }
}
