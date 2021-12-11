// contracts/CbSeller.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
import "./ColorTrackClonable.sol";


contract SalesBook is Ownable {

    struct ForSale {
        address cbContractAddress;
        uint256 tokenId;
        uint256 price;
        address seller;
        
        //The dateTime when the bid expires
        uint256 expiresOn;
        //The dateTime when the bid was created
        uint256 created;
    }

    mapping(bytes32 => ForSale) public contracts;

    /**
     * @dev Is there a bid with id _contractId.
     * @param _contractId Id into contracts mapping.
     */
    function haveContract(bytes32 _contractId)
        internal
        view
        returns (bool exists)
    {
        exists = (contracts[_contractId].seller != address(0));
    }
    /**
     * @dev Get contract details.
     * @param _contractId HTLC contract id
     *
     */
    function getOrder(bytes32 _contractId)
        public
        view
        returns (
        address cbContractAddress,
        uint256 tokenId,
        uint256 price,
        address seller,
        
        //The dateTime when the bid expires
        uint256 expiresOn,
        //The dateTime when the bid was created
        uint256 created
        )
    {
        if (haveContract(_contractId) == false) {
            
            return (address(0), 0, 0, address(0), 0, 0);
        }

        ForSale storage c = contracts[_contractId];
        return (
            c.cbContractAddress,
            c.tokenId,
            c.price,
            c.seller,
            c.expiresOn,
            c.created
        );
    }

    /**
     * @dev used by failed bidder to get money back
     * before calling this contract needs to be aproved to transfer the token
     */
    function withdraw(bytes32 _contractId) public {
        require(haveContract(_contractId), "contract does not exist");
        ForSale storage c = contracts[_contractId];

        require(block.timestamp > c.expiresOn, "bid is not expired");

        //we are burning the contract
        contracts[_contractId].seller = address(0);
    }

    

    /**
     * @dev used by the buyer to fulfill The order
     * before calling this contract needs to be aproved to transfer the token
     */
    function fulfill(
        bytes32 _contractId,
        uint256 _begin, uint256 _end

    ) public payable{
        require(haveContract(_contractId), "contract does not exist");

        ForSale storage c = contracts[_contractId];
        ColorTrackClonable cbTrack = ColorTrackClonable(c.cbContractAddress);
        
        require(c.price *(_end - _begin) < msg.value,"not the right price");

        address seller = c.seller;

        //we are burning the contract
        contracts[_contractId].seller = address(0);

        (bool success, ) = seller.call{value: msg.value}("");
        require(success, "Transfer failed.");

        uint256 dividedToken = cbTrack.subdivideTransferFrom(seller, _msgSender(), c.tokenId, _begin, _end);

        if(0!= dividedToken){
            //there is stuff let don't burn it
            contracts[_contractId].seller = seller;
            contracts[_contractId].tokenId = dividedToken;
        }
    }

    /**
     * @dev You can change slices increase date and add mony to your bid
     *
     */
    function updateBid(
        bytes32 _contractId,
        uint256 _expiresOn,
        uint256 _tokenId,
        uint256 _price
    ) public  {
        require(haveContract(_contractId), "contract does not exist");

        ForSale storage c = contracts[_contractId];
        require(_expiresOn >= c.expiresOn, "cannot expire earlier");
        require(_msgSender() == c.seller, "not the seller");

        contracts[_contractId].price =_price;
        contracts[_contractId].tokenId = _tokenId;
    }

    string public version;

    constructor(string memory _version) {
        version = _version;
    }


    function computeId(address _cbContractAddress, address bidder) public pure returns (bytes32 contractId)
    {
        contractId = keccak256(
            abi.encodePacked(_cbContractAddress, bidder)
        );
    }

    function createOrder(
        address _cbContractAddress,
        uint256 _tokenId,
        uint256 _price,
        uint256 _expiresOn
    ) public payable {

        bytes32 contractId = computeId(_cbContractAddress, _msgSender());

        console.log("creating contract");
        console.logBytes32(contractId);

        require(!haveContract(contractId), "contract exists");

        contracts[contractId] = ForSale(
            _cbContractAddress,
            _tokenId,
            _price,
            _msgSender(), //seller
            _expiresOn,
            block.timestamp //create
            
        );

        emit NewOrder(contractId, _msgSender(),_cbContractAddress);
    }

    event NewOrder(bytes32 contractId, address indexed seller, address indexed cbContractAddress);
}

/*
///Plain text secret t be sent over wire
export function evmPackedSecret(secret: string) {
    return Web3.utils.sha3(secret) || '';
}
*/
