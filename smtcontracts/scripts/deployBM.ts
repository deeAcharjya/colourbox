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

  console.log("deploying .... it will take some time");

  const bidMaker = await (await ethers.getContractFactory("NonSignedBids") as NonSignedBids__factory).deploy(currentVersion);
  await bidMaker.deployed();
  console.log("bidMaker deployed to:", bidMaker.address);

  const t2 =await bidMaker.transferOwnership(process.env.OPERATIONS_ADDRESS);
  await t2.wait();

  console.log("bidMaker owner is", process.env.OPERATIONS_ADDRESS);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
