// contracts/CbSeller.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
import "./ColorTrackClonable.sol";


contract CbFactory is Ownable {

    address  public immutable master;
    uint256 public fees;
    string public version;

    //event NewCbTrack(address indexed contractAddress);

    using Clones for address;

    constructor(address _master,  string memory _version) {
        master = _master;
        fees = 1e15;
        version = _version;
    }

    function getCbTrackAddress(string memory _baseUri) external view returns (address) {
        require(master != address(0), "master must be set");
        return computeAddress(computeSalt(_baseUri));
    }

    function computeSalt(string memory _baseUri) internal pure returns (bytes32)
    {
        return  keccak256(abi.encodePacked(_baseUri));
    }

    function computeAddress(bytes32 salt) internal view returns (address)
    {
        return master.predictDeterministicAddress(salt);
    }

    function updateFees(uint256 _fees) public onlyOwner  {
        require(_fees >= 1e15, "Min 1 finney required");
        fees=_fees;
    }

    function createTrack(address _salesContract, address _minter, uint256 _count, uint256 _forSaleBegin, 
                                    uint256 _forSaleEnd, string memory _baseUri) public payable {
        require(master != address(0), "master must be set");

        if(_msgSender() != owner()){
            require(msg.value>=fees,"need proper fees" );
            (bool success, ) = owner().call{value: msg.value}("");
            require(success, "Transfer failed.");
        }

        bytes32 salt = computeSalt(_baseUri);

        address trackAddress = computeAddress(salt);
        
        console.log("creating track  ",trackAddress);

        master.cloneDeterministic(salt);
        ColorTrackClonable cbTrack = ColorTrackClonable(trackAddress);

        cbTrack.initialize(_salesContract, _minter, _count, _forSaleBegin, _forSaleEnd, _baseUri);

        emit NewTrack(trackAddress, _minter,  _baseUri);
    }

    event NewTrack(address trackAddress, address indexed minter,  string indexed baseUri);
}