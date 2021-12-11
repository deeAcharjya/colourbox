// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "hardhat/console.sol";
import "./cbCommon.sol";

contract ColorTrackClonable is ERC721EnumerableUpgradeable {
    
    using Strings for uint256;
    using Counters for Counters.Counter;
    using CbCommon for CbCommon.SliceRange;

    Counters.Counter private _tokenIds;

    //number of slices this NFT has
    // the tokenId would be 0 to slices -1
    uint256 public slices;

    string private baseUri;

    address public factory;

    string public version;

    constructor(string memory _version) {
        
        version = _version;
    }


    // mapping for tokenId -> slices the token owns
    mapping(uint256 => CbCommon.SliceRange) private tokenSlices;

    function initialize(address _deployer, address _minter, uint256 _count, 
            uint256 _forSaleBegin, uint256 _forSaleEnd, string memory _baseUri) public initializer {
        __ERC721_init("Colour Box Track", "CBTrack");

        require(_count>=300,"count is less the 300");
        require(_forSaleEnd>_forSaleBegin,"sale end is less the sale begin");
        require(_forSaleEnd<_count,"sale end is higher the count");

        slices=_count;
        baseUri= _baseUri;
        
        factory =_msgSender(); 

        uint256 newItemId =_mintSlice(_minter,0,slices-1);

        _subdivideTransferFrom(_minter,_minter,newItemId,_forSaleBegin,_forSaleEnd);
        _approve(_deployer, newItemId);
    }

    function subdivideApprove(address _to, uint256 _tokenId,
                                uint256 _begin, uint256 _end) public returns (uint256){
        
        address owner = ownerOf(_tokenId);
        require(_to != owner, "approval to current owner");

        require(
            _msgSender() == owner || isApprovedForAll(owner, _msgSender()),
            "not owner or approved for all"
        );

        uint256 newToken = subdivideTransferFrom(owner,owner,_tokenId,_begin,_end);

        _approve(_to, _tokenId);

        return newToken;
    }


    function subdivideTransferFrom(address _from,address _to,uint256 _tokenId,
                                uint256 _begin, uint256 _end) public returns (uint256){
        
        require(_isApprovedOrOwner(_msgSender(), _tokenId), "caller is not owner nor approved");

        return _subdivideTransferFrom(_from, _to, _tokenId, _begin, _end); 
    }


    function _subdivideTransferFrom(address _from,address _to,uint256 _tokenId,
                                uint256 _begin, uint256 _end) internal returns (uint256) {
        require(_exists(_tokenId), "URI query for nonexistent token");

        require(_end>=_begin,"end is less then begin");
        require(tokenSlices[_tokenId].begin<=_begin,"begin less then slice begin");
        require(tokenSlices[_tokenId].end>=_end,"end greater then slice end");

        //use regular transfer to move the whole chunk
        require(tokenSlices[_tokenId].begin != _begin || tokenSlices[_tokenId].end != _end,"begin and end same as slice");

        //we save the end cause we might change the slice values
        uint256 sliceEnd = tokenSlices[_tokenId].end;
        uint256 sliceBegin = tokenSlices[_tokenId].begin;

        //reslice the current Token
        _setTokenSlice(_tokenId,_begin,_end);

        address currentApproved = getApproved(_tokenId);

        //what is left in the begining
        uint256 biggerNewToken = 0;
        uint256 beginLeftSize=0;

        if(sliceBegin<_begin){

            console.log("divided begin for token id '%d' ", _tokenId);

            biggerNewToken = _mintSlice(_from,sliceBegin,_begin-1);
            beginLeftSize = _begin -sliceBegin;
            _approve(currentApproved, biggerNewToken);

        }

        //what is left in the end
        if(sliceEnd>_end){
            
            console.log("divided end for token id '%d' ", _tokenId);
            uint256 newTokenid =_mintSlice(_from,_end+1,sliceEnd);
            _approve(currentApproved, newTokenid);

            if((sliceEnd-_end)>beginLeftSize){
                biggerNewToken = newTokenid;
            }
        }

        _safeTransfer(_from, _to, _tokenId,"");

        return biggerNewToken;

    }

     /**
     * @dev Used to mint a slice to a token
     */
    function _mintSlice(address _to,uint256 _begin, uint256 _end) internal virtual returns (uint256){
        require(_end>=_begin,"end is less then begin");
        require(_end<slices,"end must be less then slices");

        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();

        _safeMint(_to, newItemId);
        _setTokenSlice(newItemId,_begin,_end);

        return newItemId;
    }

    /**
     * @dev Base URI for computing {tokenURI}. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`. Empty
     * by default, can be overriden in child contracts.
     */
    function _baseURI() internal view override returns (string memory) {
        return baseUri;
    }

    /**
     * @dev Sets `_tokenURI` as the tokenURI of `tokenId`.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function _setTokenSlice(uint256 tokenId, uint256 _begin, uint256 _end) internal virtual {
        require(_exists(tokenId), "slice set of nonexistent token");
        tokenSlices[tokenId] = CbCommon.SliceRange(_begin,_end,1);
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "URI query for nonexistent token");

        if(tokenSlices[tokenId].exists != 1){
            super.tokenURI(tokenId);
        }

        string memory base = _baseURI();

        return string(abi.encodePacked(base,
            "?begin=",Strings.toString(tokenSlices[tokenId].begin),
            "&end=",Strings.toString(tokenSlices[tokenId].end)
            ));

    }

    /**
     * @dev Destroys `tokenId`.
     * The slices is cleared when the token is burned.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     *
     * Emits a {Transfer} event.
     */
    function _burn(uint256 tokenId) internal virtual override {
        super._burn(tokenId);

        if (tokenSlices[tokenId].exists == 1) {
            delete tokenSlices[tokenId];
        }
    }

}