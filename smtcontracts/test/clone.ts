import { expect } from "chai";
import { ethers } from "hardhat";

import { CbFactory } from '../typechain/CbFactory';
import { CbFactory__factory } from '../typechain/factories/CbFactory__factory';

import { ColorTrackClonable } from '../typechain/ColorTrackClonable';
import { ColorTrackClonable__factory } from '../typechain/factories/ColorTrackClonable__factory';



let ctMaster: ColorTrackClonable;
let cbFactory: CbFactory;

let cbTrack__Factory: ColorTrackClonable__factory;

let nextTrackId = 20;


describe("ColorTrackClones", function () {

  it("Should deploy master contract", async function () {

    const [owner, addr1, addr2] = await ethers.getSigners();

    console.log(`owner address -> ${owner.address}`);
    console.log(`addr1 address -> ${addr1.address}`);
    console.log(`addr2 address -> ${addr2.address}`);


    cbTrack__Factory = await ethers.getContractFactory("ColorTrackClonable") as ColorTrackClonable__factory;
    ctMaster = await cbTrack__Factory.deploy("1.0");

    expect(ctMaster.address).to.exist;
  });

  it("Should deploy Factory contract", async function () {
    cbFactory = await (await ethers.getContractFactory("CbFactory") as CbFactory__factory).deploy(ctMaster.address,"1.0");
    expect(cbFactory.address).to.exist;
  });

  it("Should deploy a cloned contract", async function () {

    const [owner, minter, addr2] = await ethers.getSigners();

    // Get the expected address
    const cbTrackAddress = await cbFactory.getCbTrackAddress("http://test.me/track1");
    expect(cbTrackAddress).to.exist;

    const tx = await cbFactory.createTrack(owner.address,minter.address, 2000, 0, 300, "http://test.me/track1");
    await tx.wait();
    const cbTrack1 = cbTrack__Factory.attach(cbTrackAddress);

    expect(cbTrack1.address).to.equal(cbTrackAddress)


    await expect(cbFactory.createTrack(owner.address, minter.address, 2000, 0, 300, "http://test.me/track1")).to.be.revertedWith(
      "ERC1167: create2 failed" /*"contract is already initialized"*/
    );

    await showStatus(cbTrack1);

  });

  it("can update fees", async function () {
    const [owner, minter, addr2] = await ethers.getSigners();

    const feestx = await cbFactory.updateFees(ethers.utils.parseEther("0.11"));
    await feestx.wait();

    expect(ethers.utils.formatEther(await cbFactory.fees())).to.be.eq("0.11");

  });

  it("non owners are to pay", async function () {
    const [owner, minter, addr2] = await ethers.getSigners();

    await expect(cbFactory.connect(addr2).createTrack(owner.address, minter.address, 2000, 0, 300, "http://test.me/track2")).to.be.revertedWith(
      "need proper fees"
    );

    const cbTrackAddress = await cbFactory.getCbTrackAddress("http://test.me/track2");
    expect(cbTrackAddress).to.exist;

    const tx = await cbFactory.connect(addr2).createTrack(owner.address, minter.address, 2000, 0, 300, "http://test.me/track2", {
      value: ethers.utils.parseEther("0.11")
    });
    await tx.wait();
    const cbTrack1 = cbTrack__Factory.attach(cbTrackAddress);
    expect(cbTrack1.address).to.equal(cbTrackAddress);

  });



  it("non-Owner canot divide", async function () {
    const [deployer, minter, signer2] = await ethers.getSigners();

    const { cbTrack1, trackURL } = await CloneCbTrack(deployer.address,minter.address);
    await expect(cbTrack1.connect(signer2).subdivideTransferFrom(minter.address, signer2.address, 1, 500, 510))
      .to.be.reverted;

  })

  it("Owner can approve", async function () {
    const [deployer, minter, signer2, signer3] = await ethers.getSigners();
    const { cbTrack1, trackURL } = await CloneCbTrack(deployer.address,minter.address);
    await showStatus(cbTrack1);

    console.log('approving 500,600');
    await cbTrack1.connect(minter).subdivideApprove(signer2.address, 2, 500, 600);
    await showStatus(cbTrack1);



    console.log('approved seling 520,600');
    await cbTrack1.connect(signer2).subdivideTransferFrom(minter.address, signer2.address, 2, 520, 600);
    await showStatus(cbTrack1);

  })


  it("Owner can divide", async function () {
    const [deployer, minter, signer2] = await ethers.getSigners();
    const { cbTrack1, trackURL } = await CloneCbTrack(deployer.address,minter.address);

    console.log("owner seeling 500 to 510");
    await cbTrack1.connect(minter).subdivideTransferFrom(minter.address, signer2.address, 2, 500, 510);

    await showStatus(cbTrack1);

    expect(await cbTrack1.ownerOf(2)).to.equal(signer2.address);
    expect(await cbTrack1.tokenURI(2)).to.equal(`${trackURL}?begin=500&end=510`);


    expect(await cbTrack1.ownerOf(1)).to.equal(minter.address);
    expect(await cbTrack1.ownerOf(3)).to.equal(minter.address);
    expect(await cbTrack1.ownerOf(4)).to.equal(minter.address);

    expect(await cbTrack1.tokenURI(3)).to.equal(`${trackURL}?begin=301&end=499`);
    expect(await cbTrack1.tokenURI(1)).to.equal(`${trackURL}?begin=0&end=300`);
    expect(await cbTrack1.tokenURI(4)).to.equal(`${trackURL}?begin=511&end=1999`);

  })


  it("It cannot transfer not approved", async function () {
    const [deployer, minter, signer2] = await ethers.getSigners();
    const { cbTrack1, trackURL } = await CloneCbTrack(deployer.address,minter.address);
    await expect(cbTrack1.subdivideTransferFrom(minter.address, signer2.address, 1, 500, 510))
      .to.be.reverted;
  })

  it("It cannot transfer wrong slice", async function () {
    const [deployer, minter, signer2] = await ethers.getSigners();
    const { cbTrack1, trackURL } = await CloneCbTrack(deployer.address,minter.address);
    await expect(cbTrack1.subdivideTransferFrom(minter.address, signer2.address, 2, 500, 510))
      .to.be.reverted;
  })

  it("deployer can subdivide and transfer", async function () {

    const [deployer, minter, signer2] = await ethers.getSigners();

    const { cbTrack1: colorTrack, trackURL } = await CloneCbTrack(deployer.address, minter.address);

    await showStatus(colorTrack);

    expect(await colorTrack.ownerOf(1)).to.equal(minter.address);
    expect(await colorTrack.ownerOf(2)).to.equal(minter.address);

    expect(await colorTrack.tokenURI(2)).to.equal(`${trackURL}?begin=301&end=1999`);
    expect(await colorTrack.tokenURI(1)).to.equal(`${trackURL}?begin=0&end=300`);


    console.log('sell 20 to 30');
    await colorTrack.subdivideTransferFrom(minter.address, signer2.address, 1, 20, 130);
    await showStatus(colorTrack);

    expect(await colorTrack.ownerOf(1)).to.equal(signer2.address);
    expect(await colorTrack.tokenURI(1)).to.equal(`${trackURL}?begin=20&end=130`);

    expect(await colorTrack.ownerOf(2)).to.equal(minter.address);
    expect(await colorTrack.ownerOf(3)).to.equal(minter.address);
    expect(await colorTrack.ownerOf(4)).to.equal(minter.address);

    expect(await colorTrack.tokenURI(2)).to.equal(`${trackURL}?begin=301&end=1999`);
    expect(await colorTrack.tokenURI(3)).to.equal(`${trackURL}?begin=0&end=19`);
    expect(await colorTrack.tokenURI(4)).to.equal(`${trackURL}?begin=131&end=300`);

  });


})

async function CloneCbTrack(owner: string, minter: string) {

  const trackURL = `http://test.me/track${++nextTrackId}`;

  const cbTrackAddress = await cbFactory.getCbTrackAddress(trackURL);

  const tx = await cbFactory.createTrack(owner, minter, 2000, 0, 300, trackURL);
  await tx.wait();
  const cbTrack1 = cbTrack__Factory.attach(cbTrackAddress);


  return { cbTrack1, trackURL };
}

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