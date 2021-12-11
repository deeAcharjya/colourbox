import { expect } from "chai";
import { ethers } from "hardhat";

import { CbFactory } from '../typechain/CbFactory';
import { CbFactory__factory } from '../typechain/factories/CbFactory__factory';

import { ColorTrackClonable } from '../typechain/ColorTrackClonable';
import { ColorTrackClonable__factory } from '../typechain/factories/ColorTrackClonable__factory';

import { SalesBook } from '../typechain/SalesBook';
import { SalesBook__factory } from '../typechain/factories/SalesBook__factory';



//const { formatBytes32String, getAddress } = ethers.utils;

//const salts = [formatBytes32String('1'), formatBytes32String('2')];




let ctMaster: ColorTrackClonable;
let cbFactory: CbFactory;

let cbTrack__Factory: ColorTrackClonable__factory;

let cbTrack1: ColorTrackClonable;
let salesOrder:SalesBook;

describe.only("Sales", function () {

    it("Should deploy master contract", async function () {

        const [owner, bidder, minter] = await ethers.getSigners();
 
        console.log(`owner address -> ${owner.address}`);
        console.log(`bidder address -> ${bidder.address}`);
        console.log(`minter address -> ${minter.address}`);


        cbTrack__Factory = await ethers.getContractFactory("ColorTrackClonable") as ColorTrackClonable__factory;
        ctMaster = await cbTrack__Factory.deploy("1.0");

        expect(ctMaster.address).to.exist;
    });

    it("Should deploy Factory contract", async function () {
        cbFactory = await (await ethers.getContractFactory("CbFactory") as CbFactory__factory).deploy(ctMaster.address,"1.0");
        expect(cbFactory.address).to.exist;
    });

    it("Should deploy Sales maker", async function () {
        

        const factory = await ethers.getContractFactory("SalesBook") as SalesBook__factory;
        salesOrder = await factory.deploy("1.0");

        expect(salesOrder.address).to.exist;
    });

    it("Should deploy a cloned contract", async function () {

        const [owner, bidder, minter] = await ethers.getSigners();


        // Get the expected address
        const cbTrackAddress = await cbFactory.getCbTrackAddress("http://test.me");
        expect(cbTrackAddress).to.exist;

        const tx = await cbFactory.createTrack(salesOrder.address,minter.address, 2000, 0, 300, "http://test.me");
        await tx.wait();
        cbTrack1 = cbTrack__Factory.attach(cbTrackAddress);

        expect(cbTrack1.address).to.equal(cbTrackAddress)


        await showStatus(cbTrack1);

        const cbTrackFactory = await cbTrack1.factory();
        console.log(`cbTrack factory is ${cbTrackFactory}`);

        expect(cbTrackFactory).to.be.eq(cbFactory.address);

    });


    it("Should create salesOrder", async function () {
        const [owner, buyer, minter] = await ethers.getSigners();

        const timeTomorrow = Date.now() + (24* 60 * 60);

        showStatus(cbTrack1);
        const done = await salesOrder.connect(minter).createOrder(cbTrack1.address,1,ethers.utils.parseEther("0.1"),timeTomorrow);
        await done.wait();

        const computedContractId = await salesOrder.computeId(cbTrack1.address,minter.address);

        console.log(`checking contract ${computedContractId}`);

    });

    it("Should fulfil salesOrder", async function () {
        const [owner, buyer, minter] = await ethers.getSigners();

        const computedContractId = await salesOrder.computeId(cbTrack1.address,minter.address);

        const contract = await salesOrder.getOrder(computedContractId);
        expect(contract.cbContractAddress).to.be.eq(cbTrack1.address);
        expect(contract.price).to.be.eq(ethers.utils.parseEther("0.1"));


        await expect(salesOrder.connect(buyer).fulfill(computedContractId,20, 50, {
            value:ethers.utils.parseEther("0.2")
        })).to.be.revertedWith("not the right price");

        const b4MinterBalance = Number.parseFloat( ethers.utils.formatEther( await minter.getBalance()));

        const totalPrice = ( 0.1 * (50-20)) +(0.001); // (price * numberOfSlices)  + tip

        await showStatus(cbTrack1);
        console.log(`fulfilling order : tokenId: ${contract.tokenId}`);
        const done = await salesOrder.connect(buyer).fulfill(computedContractId,20, 50,{
            value:ethers.utils.parseEther(totalPrice.toString())
        });
        await done.wait();

        await showStatus(cbTrack1);

        const afterMinterBalance = Number.parseFloat( ethers.utils.formatEther( await minter.getBalance()));
        expect(afterMinterBalance).to.be.closeTo(b4MinterBalance+totalPrice, 0.0001);

        const token2Owner =await cbTrack1.ownerOf(1);
        expect(token2Owner).to.be.eq(buyer.address);

        const newTokenApproved =await cbTrack1.getApproved(3);
        expect(newTokenApproved).to.be.eq(salesOrder.address);

        const updatedContract = await salesOrder.getOrder(computedContractId);
        console.log(`updated contract tokenId: ${updatedContract.tokenId}`);

        const done1 = await salesOrder.connect(buyer).fulfill(computedContractId,60, 90,{
            value:ethers.utils.parseEther(totalPrice.toString())
        });
        await done1.wait();

        const token21wner =await cbTrack1.ownerOf(updatedContract.tokenId);
        expect(token21wner).to.be.eq(buyer.address);

        //await expect(salesOrder.connect(minter).withdraw(computedContractId)).to.be.revertedWith("contract does not exist");


    });



    async function showStatus(colorTrack: ColorTrackClonable) {
        const totalSupply = await colorTrack.totalSupply();
        console.log(`total supply is ${totalSupply}`);

        for (let i = 0; i < totalSupply.toNumber(); i++) {

            const tokenId = await colorTrack.tokenByIndex(i);
            const owner = await colorTrack.ownerOf(tokenId);
            const uri = await colorTrack.tokenURI(tokenId);
            const approve = await colorTrack.getApproved(tokenId);

            console.log(`index ${i}, tokenId -> ${tokenId}, owner -> ${owner} approve -> ${approve} uri ->${uri}`);

        }

    }




});


