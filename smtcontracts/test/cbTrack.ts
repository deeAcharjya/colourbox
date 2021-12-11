import { expect } from "chai";
import { ethers } from "hardhat";

import {ColorTrack} from '../typechain/ColorTrack';
import {ColorTrack__factory} from '../typechain/factories/ColorTrack__factory';


async function showStatus(colorTrack:ColorTrack){
  const totalSupply = await colorTrack.totalSupply();
    console.log(`total supply is ${totalSupply}`);

    for(let i=0; i<totalSupply.toNumber();i++){

      const tokenId = await colorTrack.tokenByIndex(i);
      const owner = await colorTrack.ownerOf(tokenId);
      const uri = await colorTrack.tokenURI(tokenId)

      console.log(`index ${i}, tokenId -> ${tokenId}, owner -> ${owner} uri ->${uri}`);

    }

}


describe("ColorTrack", function (){

  let colorTrack:ColorTrack;

  beforeEach(async function () {
    const [deployer, signer1] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("ColorTrack") as ColorTrack__factory;

    colorTrack = await Factory.deploy(signer1.address,2000,0,300,"http://test.me");
  
    const done = await colorTrack.deployed();
    console.log('colorTrack Deployed');
    
    expect(await colorTrack.symbol() ).to.equal("CBTrack");
  });

  it("non-Owner canot divide", async function () {
    const [deployer, signer1, signer2] = await ethers.getSigners();

    await expect(colorTrack.connect(signer2).subdivideTransferFrom(signer1.address,signer2.address,1,500,510))
      .to.be.reverted;

  })

  it("Owner can approve", async function () {
    const [deployer, signer1, signer2, signer3] = await ethers.getSigners();

    await showStatus(colorTrack);

    console.log('approving 500,600');
    await colorTrack.connect(signer1).subdivideApprove(signer2.address,2,500,600);
    await showStatus(colorTrack);

    

    console.log('approved seling 520,600');
    await colorTrack.connect(signer2).subdivideTransferFrom(signer1.address, signer2.address,2,520,600);
    await showStatus(colorTrack);

  })


  it("Owner can divide", async function () {
    const [deployer, signer1, signer2] = await ethers.getSigners();

    console.log("owner seeling 500 to 510");
    await colorTrack.connect(signer1).subdivideTransferFrom(signer1.address,signer2.address,2,500,510);

    await showStatus(colorTrack);

    expect(await colorTrack.ownerOf(2) ).to.equal(signer2.address);
    expect(await colorTrack.tokenURI(2) ).to.equal("http://test.me?begin=500&end=510");


    expect(await colorTrack.ownerOf(1) ).to.equal(signer1.address);
    expect(await colorTrack.ownerOf(3) ).to.equal(signer1.address);
    expect(await colorTrack.ownerOf(4) ).to.equal(signer1.address);

    expect(await colorTrack.tokenURI(3) ).to.equal("http://test.me?begin=301&end=499");
    expect(await colorTrack.tokenURI(1) ).to.equal("http://test.me?begin=0&end=300");
    expect(await colorTrack.tokenURI(4) ).to.equal("http://test.me?begin=511&end=1999");

  })


  it("It cannot transfer not approved", async function () {
    const [deployer, signer1, signer2] = await ethers.getSigners();

    await expect(colorTrack.subdivideTransferFrom(signer1.address,signer2.address,1,500,510))
      .to.be.reverted;
  })

  it("It cannot transfer wrong slice", async function () {
    const [deployer, signer1, signer2] = await ethers.getSigners();

    await expect(colorTrack.subdivideTransferFrom(signer1.address,signer2.address,2,500,510))
      .to.be.reverted;
  })

  it("It can deploy", async function () {
    
    const [deployer, signer1, signer2] = await ethers.getSigners();

    await showStatus(colorTrack);

    expect(await colorTrack.ownerOf(1) ).to.equal(signer1.address);
    expect(await colorTrack.ownerOf(2) ).to.equal(signer1.address);

    expect(await colorTrack.tokenURI(2) ).to.equal("http://test.me?begin=301&end=1999");
    expect(await colorTrack.tokenURI(1) ).to.equal("http://test.me?begin=0&end=300");
    

    console.log('sell 20 to 30');
    await colorTrack.subdivideTransferFrom(signer1.address,signer2.address,1,20,130);
    await showStatus(colorTrack);

    expect(await colorTrack.ownerOf(1) ).to.equal(signer2.address);
    expect(await colorTrack.tokenURI(1) ).to.equal("http://test.me?begin=20&end=130");
  
    expect(await colorTrack.ownerOf(2) ).to.equal(signer1.address);
    expect(await colorTrack.ownerOf(3) ).to.equal(signer1.address);
    expect(await colorTrack.ownerOf(4) ).to.equal(signer1.address);

    expect(await colorTrack.tokenURI(2) ).to.equal("http://test.me?begin=301&end=1999");
    expect(await colorTrack.tokenURI(3) ).to.equal("http://test.me?begin=0&end=19");
    expect(await colorTrack.tokenURI(4) ).to.equal("http://test.me?begin=131&end=300");

  });
});



describe("Greeter", function () {
  it("Should return the new greeting once it's changed", async function () {
    const Greeter = await ethers.getContractFactory("Greeter");
    const greeter = await Greeter.deploy("Hello, world!");
    await greeter.deployed();

    expect(await greeter.greet()).to.equal("Hello, world!");

    const setGreetingTx = await greeter.setGreeting("Hola, mundo!");

    // wait until the transaction is mined
    await setGreetingTx.wait();

    expect(await greeter.greet()).to.equal("Hola, mundo!");
  });
});
