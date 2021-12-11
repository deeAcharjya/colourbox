// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library CbCommon {

    struct SliceRange {
        uint256 begin;
        uint256 end;
        //used to find out if this mapping exists
        uint8 exists;
    }

}