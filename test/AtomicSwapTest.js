const { ethers } = require("hardhat");
const { expect } = require("chai");
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("AtomicSwap", function () {
  
  let atoken;
  let btoken;
  let owner;
  let maker;
  let taker;
  let swapContract;
  let uniswapRouter;
  let zeroAddress = "0x0000000000000000000000000000000000000000";

  beforeEach(async function(){
    [owner, maker, taker, makerReceiving, takerReceiving] = await ethers.getSigners();

    const AToken = await ethers.getContractFactory("AToken");
    atoken = await AToken.deploy();
    await atoken.deployed();

    const BToken = await ethers.getContractFactory("BToken");
    btoken = await BToken.deploy();
    await btoken.deployed();

    const AtomicSwap = await ethers.getContractFactory("AtomicSwap");
    swapContract = await AtomicSwap.deploy();
    await swapContract.deployed();
    
    await atoken.mint(maker.address, 1000);
    const makerbalance = await atoken.balanceOf(maker.address);

    await btoken.mint(taker.address, 500);
    const takerBalance = await btoken.balanceOf(taker.address);
    
    const swapContractATokenBalance = await atoken.balanceOf(swapContract.address);
    const swapContractBTokenBalance = await btoken.balanceOf(swapContract.address);


  });

  describe("MakeSwap", function () {
    it("SellToken should not be zero address", async function () {
      const sellToken = {
        token: zeroAddress, 
        amount: 100,
      };
      const buyToken = {
        token: btoken.address,
        amount: 50,
      };
      const makerReceivingAddress = makerReceiving.address;
      const desiredTaker = taker.address;
      const expirationTimestamp = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour from now

      await atoken.connect(maker).approve(swapContract.address, sellToken.amount);
      await expect(swapContract.connect(maker).makeSwap(
        sellToken,
        buyToken,
        makerReceivingAddress,
        desiredTaker,
        expirationTimestamp
      )).to.revertedWith("SellToken should not be zero address");
    });
    it("SellToken mount should not be zero amount", async function () {
      const sellToken = {
        token: atoken.address, 
        amount: 0,
      };
      const buyToken = {
        token: btoken.address,
        amount: 50,
      };
      const makerReceivingAddress = makerReceiving.address;
      const desiredTaker = taker.address;
      const expirationTimestamp = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour from now

      await atoken.connect(maker).approve(swapContract.address, sellToken.amount);
      await expect(swapContract.connect(maker).makeSwap(
        sellToken,
        buyToken,
        makerReceivingAddress,
        desiredTaker,
        expirationTimestamp
      )).to.revertedWith("SellToken mount should not be zero amount");
    });
    it("buyToken mount should not be zero amount", async function () {
      const sellToken = {
        token: atoken.address, 
        amount: 100,
      };
      const buyToken = {
        token: btoken.address,
        amount: 0,
      };
      const makerReceivingAddress = makerReceiving.address;
      const desiredTaker = taker.address;
      const expirationTimestamp = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour from now

      await atoken.connect(maker).approve(swapContract.address, sellToken.amount);
      await expect(swapContract.connect(maker).makeSwap(
        sellToken,
        buyToken,
        makerReceivingAddress,
        desiredTaker,
        expirationTimestamp
      )).to.revertedWith("buyToken mount should not be zero amount");
    });
    it("buyToken should not be zero address", async function () {
      const sellToken = {
        token: atoken.address, 
        amount: 100,
      };
      const buyToken = {
        token: zeroAddress,
        amount: 50,
      };
      const makerReceivingAddress = makerReceiving.address;
      const desiredTaker = taker.address;
      const expirationTimestamp = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour from now

      await atoken.connect(maker).approve(swapContract.address, sellToken.amount);
      await expect(swapContract.connect(maker).makeSwap(
        sellToken,
        buyToken,
        makerReceivingAddress,
        desiredTaker,
        expirationTimestamp
      )).to.revertedWith("buyToken should not be zero address");
    });
    it("MakerReceivingAddress should not be zero address", async function () {
      const sellToken = {
        token: atoken.address, 
        amount: 100,
      };
      const buyToken = {
        token: btoken.address,
        amount: 50,
      };
      const makerReceivingAddress = zeroAddress;
      const desiredTaker = taker.address;
      const expirationTimestamp = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour from now

      await atoken.connect(maker).approve(swapContract.address, sellToken.amount);
      await expect(swapContract.connect(maker).makeSwap(
        sellToken,
        buyToken,
        makerReceivingAddress,
        desiredTaker,
        expirationTimestamp
      )).to.revertedWith("MakerReceivingAddress should not be zero address");
    });
    it("DesiredTaker should not be zero address", async function () {
      const sellToken = {
        token: atoken.address, 
        amount: 100,
      };
      const buyToken = {
        token: btoken.address,
        amount: 50,
      };
      const makerReceivingAddress = makerReceiving.address;
      const desiredTaker = zeroAddress;
      const expirationTimestamp = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour from now

      await atoken.connect(maker).approve(swapContract.address, sellToken.amount);
      await expect(swapContract.connect(maker).makeSwap(
        sellToken,
        buyToken,
        makerReceivingAddress,
        desiredTaker,
        expirationTimestamp
      )).to.revertedWith("DesiredTaker should not be zero address");
    });
    it("ExpirationTimestamp should be greater than creationTimestamp", async function () {
      const sellToken = {
        token: atoken.address, 
        amount: 100,
      };
      const buyToken = {
        token: btoken.address,
        amount: 50,
      };
      const makerReceivingAddress = makerReceiving.address;
      const desiredTaker = taker.address;
      const expirationTimestamp = 0; // 1 hour from now

      await atoken.connect(maker).approve(swapContract.address, sellToken.amount);
      await expect(swapContract.connect(maker).makeSwap(
        sellToken,
        buyToken,
        makerReceivingAddress,
        desiredTaker,
        expirationTimestamp
      )).to.revertedWith("ExpirationTimestamp should be greater than creationTimestamp");
    });

    it("Should be makeSwap success", async function () {

      const sellToken = {
        token: atoken.address, 
        amount: 100,
      };
      const buyToken = {
        token: btoken.address,
        amount: 50,
      };
      const makerReceivingAddress = makerReceiving.address;
      const desiredTaker = taker.address;
      const expirationTimestamp = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour from now

      await atoken.connect(maker).approve(swapContract.address, sellToken.amount);
      await swapContract.connect(maker).makeSwap(
        sellToken,
        buyToken,
        makerReceivingAddress,
        desiredTaker,
        expirationTimestamp
      );
      const order = await swapContract.orders(0);
      expect(order.maker.sellToken.token).to.equal(sellToken.token);
      expect(order.maker.buyToken.token).to.equal(buyToken.token);
      expect(order.maker.makerReceivingAddress).to.equal(makerReceivingAddress);
      expect(order.maker.desiredTaker).to.equal(desiredTaker);
      expect(order.maker.expirationTimestamp).to.equal(expirationTimestamp);

    });

  });

  describe("TakeSwap", function () {
    beforeEach(async function(){
      const sellToken = {
        token: atoken.address, 
        amount: 100,
      };
      const buyToken = {
        token: btoken.address,
        amount: 50,
      };
      const makerReceivingAddress = makerReceiving.address;
      const desiredTaker = taker.address;
      const expirationTimestamp = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour from now

      await atoken.connect(maker).approve(swapContract.address, sellToken.amount);
      await swapContract.connect(maker).makeSwap(
        sellToken,
        buyToken,
        makerReceivingAddress,
        desiredTaker,
        expirationTimestamp
      );
      const order = await swapContract.orders(0);

    });

    it("Should be takeSwap success", async function () {
      const sellToken = {
        token: btoken.address, 
        amount: 50,
      };
      const takerReceivingAddress = takerReceiving.address;
      const orderId = 0;

      await btoken.connect(taker).approve(swapContract.address, sellToken.amount);
      expect(await swapContract.connect(taker).takeSwap(
        orderId,
        sellToken,
        takerReceivingAddress
      )).to.emit("TakeSwapMsgEvent");
      const order = await swapContract.orders(0);
      expect(order.taker.sellToken.token).to.equal(sellToken.token);
      expect(order.taker.takerAddress).to.equal(taker.address);
      expect(order.taker.takerReceivingAddress).to.equal(takerReceivingAddress);

      const makerReceivingBalance = await btoken.balanceOf(makerReceiving.address);
      expect(makerReceivingBalance).to.be.equal(50);
      const takerReceivingBalance = await atoken.balanceOf(takerReceiving.address);
      expect(takerReceivingBalance).to.be.equal(100);

    });
    it("SellToken should not be zero address in takeSwap", async function () {
      
      const sellToken = {
        token: zeroAddress, 
        amount: 50,
      };
      const takerReceivingAddress = takerReceiving.address;
      const orderId = 0;
      await btoken.connect(taker).approve(swapContract.address, sellToken.amount);
      await expect(swapContract.connect(taker).takeSwap(
        orderId,
        sellToken,
        takerReceivingAddress
      )).to.revertedWith("SellToken should not be zero address in takeSwap");
    });
    it("SellToken mount should not be zero amount in takeSwap", async function () {
     
      const sellToken = {
        token: btoken.address, 
        amount: 0,
      };
      const takerReceivingAddress = takerReceiving.address;
      const orderId = 0;
      await btoken.connect(taker).approve(swapContract.address, sellToken.amount);
      await expect(swapContract.connect(taker).takeSwap(
        orderId,
        sellToken,
        takerReceivingAddress
      )).to.revertedWith("SellToken mount should not be zero amount in takeSwap");
    });
    it("MakerReceivingAddress should not be zero address", async function () {
      
      const sellToken = {
        token: btoken.address, 
        amount: 50,
      };
      const takerReceivingAddress = zeroAddress;
      const orderId = 0;
      await btoken.connect(taker).approve(swapContract.address, sellToken.amount);
      await expect(swapContract.connect(taker).takeSwap(
        orderId,
        sellToken,
        takerReceivingAddress
      )).to.revertedWith("MakerReceivingAddress should not be zero address");
    });
    it("Invaild taker", async function () {
      const sellToken = {
        token: btoken.address, 
        amount: 50,
      };
      const takerReceivingAddress = takerReceiving.address;
      const orderId = 0;
      await btoken.connect(taker).approve(swapContract.address, sellToken.amount);
      await expect(swapContract.connect(maker).takeSwap(
        orderId,
        sellToken,
        takerReceivingAddress
      )).to.revertedWith("Invaild taker");
    });
    it("Invaild token", async function () {
      const sellToken = {
        token: atoken.address, 
        amount: 50,
      };
      const takerReceivingAddress = takerReceiving.address;
      const orderId = 0;
      await btoken.connect(taker).approve(swapContract.address, sellToken.amount);
      await expect(swapContract.connect(taker).takeSwap(
        orderId,
        sellToken,
        takerReceivingAddress
      )).to.revertedWith("Invaild token");
    });
    it("Invaild token amount", async function () {
      const sellToken = {
        token: btoken.address, 
        amount: 30,
      };
      const takerReceivingAddress = takerReceiving.address;
      const orderId = 0;
      await btoken.connect(taker).approve(swapContract.address, sellToken.amount);
      await expect(swapContract.connect(taker).takeSwap(
        orderId,
        sellToken,
        takerReceivingAddress
      )).to.revertedWith("Invaild token amount");
    });
    it("Order cannot be sync", async function () {
      const sellToken = {
        token: btoken.address, 
        amount: 50,
      };
      const takerReceivingAddress = takerReceiving.address;
      const orderId = 0;
      await btoken.connect(taker).approve(swapContract.address, sellToken.amount);
      await swapContract.connect(taker).takeSwap(
        orderId,
        sellToken,
        takerReceivingAddress
      );
      await expect(swapContract.connect(taker).takeSwap(
        orderId,
        sellToken,
        takerReceivingAddress
      )).to.revertedWith("Order cannot be sync");
    });
    it("Order has expired", async function () {
      const sellToken = {
        token: btoken.address, 
        amount: 50,
      };
      const takerReceivingAddress = takerReceiving.address;
      const orderId = 0;
      await btoken.connect(taker).approve(swapContract.address, sellToken.amount);
      const addvanceTimestamp = Math.floor(Date.now() / 1000) + 60 * 120; 
      const latestTime = await time.latest();
      await time.increaseTo(addvanceTimestamp);
      
      await expect(swapContract.connect(taker).takeSwap(
        orderId,
        sellToken,
        takerReceivingAddress
      )).to.revertedWith("Order has expired");
    });
  });

  describe("CancelSwap", function () {
    beforeEach(async function(){
      const sellToken = {
        token: atoken.address, 
        amount: 100,
      };
      const buyToken = {
        token: btoken.address,
        amount: 50,
      };
      const makerReceivingAddress = makerReceiving.address;
      const desiredTaker = taker.address;
      const latestTime = await time.latest();
      const expirationTimestamp = latestTime + 60 * 60; // 1 hour from now

      await atoken.connect(maker).approve(swapContract.address, sellToken.amount);
      await swapContract.connect(maker).makeSwap(
        sellToken,
        buyToken,
        makerReceivingAddress,
        desiredTaker,
        expirationTimestamp
      );

    });

    it("Should be cancelSwap success", async function () {
      const orderId = 0;
      const orderBefore = await swapContract.orders(0);
      const expirationTimestamp = orderBefore.maker.expirationTimestamp;
      const latestTime = await time.latest();
      const addvanceTimestamp = latestTime + 120 * 120; 
      await time.increaseTo(addvanceTimestamp);
      
      expect(await swapContract.connect(maker).cancelSwap(orderId)).to.emit("CancelSwapMsgEvent");
      const order = await swapContract.orders(0);
      expect(order.status).to.equal(2);
      const makerReceivingBalance = await atoken.balanceOf(makerReceiving.address);
      expect(makerReceivingBalance).to.be.equal(100);

    });
    it("Only maker can cancel", async function () {
      const orderId = 0;   
      await expect(swapContract.connect(taker).cancelSwap(orderId)).to.revertedWith("Only maker can cancel");
    });

    it("Order cannot be cancelled", async function () {
      const orderBefore = await swapContract.orders(0);
      const sellToken = {
        token: btoken.address, 
        amount: 50,
      };
      const takerReceivingAddress = takerReceiving.address;
      const orderId = 0;
      await btoken.connect(taker).approve(swapContract.address, sellToken.amount);
      await swapContract.connect(taker).takeSwap(
        orderId,
        sellToken,
        takerReceivingAddress
      );
      await expect(swapContract.connect(maker).cancelSwap(orderId)).to.revertedWith("Order cannot be cancelled");


    });

  });

});
