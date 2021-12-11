// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

import { CbFactory } from '../typechain/CbFactory';
import { CbFactory__factory } from '../typechain/factories/CbFactory__factory';

import { ColorTrackClonable } from '../typechain/ColorTrackClonable';
import { ColorTrackClonable__factory } from '../typechain/factories/ColorTrackClonable__factory';


async function main() {
    // Hardhat always runs the compile task when running scripts with its command
    // line interface.
    //
    // If this script is run directly using `node` you may want to call compile
    // manually to make sure everything is compiled
    // await hre.run('compile');

    if (!process.env.CBFACTORY_ADDRESS) {
        throw new Error('Please config env variable CBFACTORY_ADDRESS');
    }


    // We get the contract to deploy
    const cbTrack__Factory = await ethers.getContractFactory("CbFactory") as CbFactory__factory;

    console.log("verifying factory at address :", process.env.CBFACTORY_ADDRESS);

    const cbFactory = await cbTrack__Factory.attach(process.env.CBFACTORY_ADDRESS);

    const owner = await cbFactory.owner();
    console.log("CB cbFactory owner is", owner);

    const salt = ethers.utils.randomBytes(32);

    const cbTrackAddress = await cbFactory.getCbTrackAddress( salt);

    console.log(`CB cbFactory created address ${cbTrackAddress} for salt ${salt}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
