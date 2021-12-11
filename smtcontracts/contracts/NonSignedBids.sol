// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
import "./ColorTrackClonable.sol";

// For bids on tracks not yet NFT-ized

contract NonSignedBids is Ownable {
    using CbCommon for CbCommon.SliceRange;

    address public factory;
    string public version;

    struct NFTInfo {
        //The token URI for this track
        //Since this is not yet an NFT we will recognize the NFT by it's URI
        string baseURI;
        uint256 bidPrice;
        address bidder;
        //The dateTime when the bid expires
        uint256 expiresOn;
        //The dateTime when the bid was created
        uint256 created;
        CbCommon.SliceRange slice;
    }

    mapping(bytes32 => NFTInfo) public contracts;

    constructor(string memory _version) {
        version = _version;
    }


    function setfactory(address _factory) public  onlyOwner
    {
        factory=_factory;
    }

    /**
     * @dev Is there a bid with id _contractId.
     * @param _contractId Id into contracts mapping.
     */
    function haveContract(bytes32 _contractId)
        internal
        view
        returns (bool exists)
    {
        exists = (contracts[_contractId].bidder != address(0));
    }

    /**
     * @dev Get contract details.
     * @param _contractId HTLC contract id
     *
     */
    function getBid(bytes32 _contractId)
        public
        view
        returns (
            //base URI of the track we want to bid on
            string memory baseURI,
            uint256 bidPrice,
            address bidder,
            uint256 expiresOn,
            uint256 created,
            uint256 begin,
            uint256 end
        )
    {
        if (haveContract(_contractId) == false) {
            string memory emptyString;
            return (emptyString, 0, address(0), 0, 0, 0, 0);
        }

        NFTInfo storage c = contracts[_contractId];
        return (
            c.baseURI,
            c.bidPrice,
            c.bidder,
            c.expiresOn,
            c.created,
            c.slice.begin,
            c.slice.end
        );
    }

    /**
     * @dev used by failed bidder to get money back
     * before calling this contract needs to be aproved to transfer the token
     */
    function withdraw(bytes32 _contractId) public {
        require(haveContract(_contractId), "contract does not exist");
        NFTInfo storage c = contracts[_contractId];

        require(block.timestamp > c.expiresOn, "bid is not expired");

        address bidder = c.bidder;
        //we are burning the contract
        contracts[_contractId].bidder = address(0);

        (bool success, ) = bidder.call{value: c.bidPrice}("");
        require(success, "Transfer failed.");
    }

    /**
     * @dev used by the minter to fulfill The bid
     * before calling this contract needs to be aproved to transfer the token
     */
    function fulfill(
        bytes32 _contractId,
        address _cbTrackAddress,
        uint256 _tokenId
    ) public {
        require(haveContract(_contractId), "contract does not exist");

        ColorTrackClonable cbTrack = ColorTrackClonable(_cbTrackAddress);

        address cbTrackOwner = cbTrack.ownerOf(_tokenId);

        address cbTrackFactory = cbTrack.factory();
        require(cbTrackFactory == factory, "unknown colourTrack factory");

        string memory tokenURI = cbTrack.tokenURI(_tokenId);

        NFTInfo storage c = contracts[_contractId];

        string memory incomingUri = string(
            abi.encodePacked(
                c.baseURI,
                "?begin=",
                Strings.toString(c.slice.begin),
                "&end=",
                Strings.toString(c.slice.end)
            )
        );

        require(
            keccak256(abi.encodePacked((incomingUri))) ==
                keccak256(abi.encodePacked((tokenURI))),
            "not the bid token"
        );

        address bidder = c.bidder;
        //we are burning the contract
        contracts[_contractId].bidder = address(0);

        cbTrack.safeTransferFrom(cbTrackOwner, bidder, _tokenId);

        (bool success, ) = cbTrackOwner.call{value: c.bidPrice}("");
        require(success, "Transfer failed.");
    }

    /**
     * @dev You can change slices increase date and add mony to your bid
     *
     */
    function updateBid(
        bytes32 _contractId,
        uint256 _expiresOn,
        uint256 _begin,
        uint256 _end
    ) public payable {
        require(msg.value >= 1e15, "Min 1 finney required");
        require(haveContract(_contractId), "contract does not exist");

        NFTInfo storage c = contracts[_contractId];
        require(_expiresOn >= c.expiresOn, "cannot expire earlier");
        require(_msgSender() == c.bidder, "not the bidder");

        contracts[_contractId].bidPrice += msg.value;
        contracts[_contractId].slice = CbCommon.SliceRange(_begin, _end, 1);
    }

    function computeId(string memory _baseURI, address bidder) public pure returns (bytes32 contractId)
    {
        contractId = keccak256(
            abi.encodePacked(_baseURI, bidder)
        );
    }

    function createBid(
        string memory _baseURI,
        uint256 _expiresOn,
        uint256 _begin,
        uint256 _end
    ) public payable {
        require(msg.value >= 1e15, "Min 1 finney required");

        bytes32 contractId = computeId(_baseURI, _msgSender());

        console.log("creating contract");
        console.logBytes32(contractId);

        require(!haveContract(contractId), "contract exists");

        contracts[contractId] = NFTInfo(
            _baseURI,
            msg.value, //bidPrice
            _msgSender(), //bidder
            _expiresOn,
            block.timestamp, //create
            CbCommon.SliceRange(_begin, _end, 1) //slice
        );

        emit NewBid(contractId, _msgSender(),_baseURI);
    }

    event NewBid(bytes32 contractId, address indexed bidder, string indexed baseURI);
}

/*
///Plain text secret t be sent over wire
export function evmPackedSecret(secret: string) {
    return Web3.utils.sha3(secret) || '';
}
*/
