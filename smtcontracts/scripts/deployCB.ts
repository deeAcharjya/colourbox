// We require the Hardhat Runtime Environment explicitly here. This is optional
/***************************# to deploy to testnet *************************************
> Find the operations account in mongo

db.custodialWallets.find({"usedBy" : "wallet_Deployment"});

set OPERATIONS_ADDRESS=0xXXXXXXXXXXXXXXXXXXXXXXXXXX
set PRIVATE_KEY=0xXXXXXXXXXXXXXXXXXXXXXX

npx hardhat run --network ropsten scripts/deploy.ts

***************************************************************************************/
import { ethers } from "hardhat";

import { CbFactory } from '../typechain/CbFactory';
import { CbFactory__factory } from '../typechain/factories/CbFactory__factory';

import { ColorTrackClonable } from '../typechain/ColorTrackClonable';
import { ColorTrackClonable__factory } from '../typechain/factories/ColorTrackClonable__factory';

import { NonSignedBids } from '../typechain/NonSignedBids';
import { NonSignedBids__factory } from '../typechain/factories/NonSignedBids__factory';

import {currentVersion} from './deplyCommon';

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  if(!process.env.OPERATIONS_ADDRESS){
    throw new Error('Please config env variable OPERATIONS_ADDRESS');
  }

  const [deployer] = await ethers.getSigners();

  console.log(`deploying with account ${deployer.address}  .... it will take some time`);

  // We get the contract to deploy
  const cbTrack__Factory = await ethers.getContractFactory("ColorTrackClonable") as ColorTrackClonable__factory;
  const ctMaster = await cbTrack__Factory.deploy(currentVersion);
  await ctMaster.deployed();
  console.log("CB master deployed to:", ctMaster.address);

  const cbFactory = await (await ethers.getContractFactory("CbFactory") as CbFactory__factory).deploy(ctMaster.address,currentVersion);
  await cbFactory.deployed();
  console.log("CB cbFactory deployed to:", cbFactory.address);

  const t1 = await cbFactory.transferOwnership(process.env.OPERATIONS_ADDRESS);
  await t1.wait();

  console.log("CB cbFactory owner is", process.env.OPERATIONS_ADDRESS);

  

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
