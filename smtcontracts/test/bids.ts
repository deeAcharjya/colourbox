import { expect } from "chai";
import { ethers } from "hardhat";

import { CbFactory } from '../typechain/CbFactory';
import { CbFactory__factory } from '../typechain/factories/CbFactory__factory';

import { ColorTrackClonable } from '../typechain/ColorTrackClonable';
import { ColorTrackClonable__factory } from '../typechain/factories/ColorTrackClonable__factory';

import { NonSignedBids } from '../typechain/NonSignedBids';
import { NonSignedBids__factory } from '../typechain/factories/NonSignedBids__factory';



//const { formatBytes32String, getAddress } = ethers.utils;

//const salts = [formatBytes32String('1'), formatBytes32String('2')];




let ctMaster: ColorTrackClonable;
let cbFactory: CbFactory;

let cbTrack__Factory: ColorTrackClonable__factory;

let cbTrack1: ColorTrackClonable;
let bidMaker:NonSignedBids;

describe("Bids", function () {

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

    it("Should deploy a cloned contract", async function () {

        const [owner, bidder, minter] = await ethers.getSigners();


        // Get the expected address
        const cbTrackAddress = await cbFactory.getCbTrackAddress("http://test.me");
        expect(cbTrackAddress).to.exist;

        const tx = await cbFactory.createTrack(owner.address,minter.address, 2000, 0, 300, "http://test.me");
        await tx.wait();
        cbTrack1 = cbTrack__Factory.attach(cbTrackAddress);

        expect(cbTrack1.address).to.equal(cbTrackAddress)


        await showStatus(cbTrack1);

        const cbTrackFactory = await cbTrack1.factory();
        console.log(`cbTrack factory is ${cbTrackFactory}`);

        expect(cbTrackFactory).to.be.eq(cbFactory.address);

    });

    it("Should deploy Bid maker", async function () {
        

        const factory = await ethers.getContractFactory("NonSignedBids") as NonSignedBids__factory;
        bidMaker = await factory.deploy("1.0");

        expect(bidMaker.address).to.exist;

        const setTx = await bidMaker.setfactory(cbFactory.address);
        await setTx.wait();


        expect(await bidMaker.factory()).to.be.eq(cbFactory.address);

    });
    
    it("Should create bids", async function () {
        const [owner, bidder, minter] = await ethers.getSigners();

        const timeTomorrow = Date.now() + (24* 60 * 60);

        const done = await bidMaker.connect(bidder).createBid("http://test.me",timeTomorrow,500,550,{
            value:ethers.utils.parseEther("0.1")
        });
        await done.wait();

        const contractBalance = Number.parseFloat( ethers.utils.formatEther( await bidMaker.provider.getBalance(bidMaker.address)));

        expect(contractBalance).to.be.eq(0.1);


        const computedContractId = await bidMaker.computeId("http://test.me",bidder.address);

        console.log(`checking contract ${computedContractId}`);
        const contract = await bidMaker.getBid(computedContractId);

        expect(contract.baseURI).to.be.eq("http://test.me");

    });

    it("Should fulfil bids", async function () {
        const [owner, bidder, minter] = await ethers.getSigners();

        const computedContractId = await bidMaker.computeId("http://test.me",bidder.address);

        const approv = await cbTrack1.connect(minter).subdivideApprove(bidMaker.address,2,500,550);
        await approv.wait();

        showStatus(cbTrack1);

        console.log('fulfilling contract');

        const b4Balance = Number.parseFloat( ethers.utils.formatEther( await minter.getBalance()));

        const fulfil = await bidMaker.connect(minter).fulfill(computedContractId,cbTrack1.address,2);
        await fulfil.wait();

        

        const afterBalance = Number.parseFloat( ethers.utils.formatEther( await minter.getBalance()));
        expect(afterBalance).to.be.closeTo(b4Balance+0.1, 0.001);

        const token2Owner =await cbTrack1.ownerOf(2);
        expect(token2Owner).to.be.eq(bidder.address);

        await expect(bidMaker.connect(bidder).withdraw(computedContractId)).to.be.revertedWith("contract does not exist");

    });

    it("return failed bids", async function () {
        const [owner, bidder, minter] = await ethers.getSigners();

        const now = Date.now();
        const computedContractId = await bidMaker.computeId("http://test.me/track2",bidder.address);

        const timeTomorrow =  now + (24* 60 * 60);

        const done = await bidMaker.connect(bidder).createBid("http://test.me/track2",timeTomorrow,600,650,{
            value:ethers.utils.parseEther("0.2")
        });
        await done.wait();

        let latestBlock = await ethers.provider.getBlock("latest");
        console.log(`current block time ${latestBlock.timestamp}`)

        await ethers.provider.send("evm_mine", [now + (4*60*60)]);

        latestBlock = await ethers.provider.getBlock("latest");
        console.log(`current block time ${latestBlock.timestamp}`)

        await expect(bidMaker.connect(bidder).withdraw(computedContractId)).to.be.revertedWith("bid is not expired");

        await ethers.provider.send("evm_mine", [now + (25*60*60)]);

        latestBlock = await ethers.provider.getBlock("latest");
        console.log(`current block time ${latestBlock.timestamp}`)

        const b4Balance = Number.parseFloat( ethers.utils.formatEther( await bidder.getBalance()));

        const withdraw = await bidMaker.connect(bidder).withdraw(computedContractId);
        await withdraw.wait();

        const afterBalance = Number.parseFloat( ethers.utils.formatEther( await bidder.getBalance()));
        expect(afterBalance).to.be.closeTo(b4Balance+0.2, 0.001);

        //trying to withdarw again will fail
        await expect(bidMaker.connect(bidder).withdraw(computedContractId)).to.be.revertedWith("contract does not exist");

    });

    async function showStatus(colorTrack: ColorTrackClonable) {
        const totalSupply = await colorTrack.totalSupply();
        console.log(`total supply is ${totalSupply}`);

        for (let i = 0; i < totalSupply.toNumber(); i++) {

            const tokenId = await colorTrack.tokenByIndex(i);
            const owner = await colorTrack.ownerOf(tokenId);
            const uri = await colorTrack.tokenURI(tokenId)

            console.log(`index ${i}, tokenId -> ${tokenId}, owner -> ${owner} uri ->${uri}`);

        }

    }




});

