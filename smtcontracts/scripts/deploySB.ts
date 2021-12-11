// We require the Hardhat Runtime Environment explicitly here. This is optional
/***************************# to deploy to testnet *************************************
> Find the operations account in mongo

db.custodialWallets.find({"usedBy" : "wallet_Deployment"});

set OPERATIONS_ADDRESS=0xXXXXXXXXXXXXXXXXXXXXXXXXXX
set PRIVATE_KEY=0xXXXXXXXXXXXXXXXXXXXXXX

npx hardhat run --network ropsten scripts/deploy.ts

***************************************************************************************/
import { ethers } from "hardhat";

import { SalesBook } from '../typechain/SalesBook';
import { SalesBook__factory } from '../typechain/factories/SalesBook__factory';
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

  // We get the contract to deploy
  const SalesBook__Factory = await ethers.getContractFactory("SalesBook") as SalesBook__factory;
  const salesBook = await SalesBook__Factory.deploy(currentVersion);
  await salesBook.deployed();
  console.log("SalesBook deployed to:", salesBook.address);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
