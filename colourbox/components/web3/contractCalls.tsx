
import { NonSignedBids } from '../../typechain/NonSignedBids';
import NonSignedBids_Json from '../../abi/NonSignedBids.json';

import { ColorTrackClonable } from '../../typechain/ColorTrackClonable';
import ColorTrackClonable_Json from '../../abi/ColorTrackClonable.json';

import { CbFactory } from '../../typechain/CbFactory';
import CbFactory_Json from '../../abi/CbFactory.json';

import { SalesBook } from '../../typechain/SalesBook';
import SalesBook_Json from '../../abi/SalesBook.json';


import { NFTSlice, SelectedSlice } from '../player';
import Web3 from "web3";

import {TransactionReceipt} from 'web3-core';

import { SalesInfoModel } from '../../generatedTypes/SalesInfoModel';
import { BidDetailsModel } from '../../generatedTypes/BidDetailsModel';
import { BidModel } from '../../generatedTypes/BidModel';
import { NFTDetailsModel } from '../../generatedTypes/NFTDetailsModel';
import { StoredTrackModel } from '../../generatedTypes/StoredTrackModel';

import { SalesOrderDetailsModel } from '../../generatedTypes/SalesOrderDetailsModel';
import { SalesOrderModel } from '../../generatedTypes/SalesOrderModel';

import { ShowError, IAsyncResult, fetchJsonAsync, connectTo } from '../utils';

export interface IContractCalls {
    web3: Web3;
    bid: (slice: SelectedSlice) => Promise<void>;
    createCb: (v: NFTContractProps) => Promise<void>;
    sell: (v: SelectedSlice & { nftToSell: NFTSlice }) => Promise<void>;
    buy: (v: SelectedSlice & { nftToSell: NFTSlice, totalAmount_Gwi:string }) => Promise<void>;

    signMsg:(message:string)=>Promise<string>;
}

export function getcbTrack(web3: Web3, address: string): ColorTrackClonable {
    return new web3.eth.Contract(ColorTrackClonable_Json as any, address) as any;
}

export function getBidMaker(web3: Web3, address: string): NonSignedBids {
    return new web3.eth.Contract(NonSignedBids_Json as any, address) as any;
}

export function getcbFactory(web3: Web3, salesInfo: SalesInfoModel): CbFactory {
    return new web3.eth.Contract(CbFactory_Json as any, salesInfo.cbFactoryAddress) as any;
}

export function getsalesBook(web3: Web3, salesInfo: SalesInfoModel): SalesBook {
    return new web3.eth.Contract(SalesBook_Json as any, salesInfo.salesBookAddress) as any;
}

export function web3AddressExists(address?:string){
    return address && (address != '0x0000000000000000000000000000000000000000');
}


type NFTContractProps = {
    sliceCount: number;
    salePercent: number;
    trackId: string;
    fees: string;
};

export default class ContractCalls implements IContractCalls {

    public readonly web3: Web3;
    private readonly _salesInfo: SalesInfoModel;

    constructor(web3: Web3, salesInfo: SalesInfoModel) {
        this.web3 = web3;
        this._salesInfo = salesInfo;
    }

    signMsg =async (message:string)=>{

        const myAddress = (await this.web3.eth.getAccounts())[0];
        
        let signed = await this.web3.eth.personal.sign(message, myAddress,'');
        //console.log(`signed is ${signed}`);
        return signed;
    }

    createCb = async ({ sliceCount, salePercent, trackId, fees }: NFTContractProps) => {
        const cbfactory = getcbFactory(this.web3, this._salesInfo);

        const minterAddress = (await this.web3.eth.getAccounts())[0];

        const saleend = Math.floor(sliceCount * 0.01 * salePercent);
        const baseUrl = `${this._salesInfo.nftBaseUrl}/${trackId}`;

        const contractAddress = await cbfactory.methods.getCbTrackAddress(baseUrl).call();

        const tx = await cbfactory.methods.createTrack(this._salesInfo.salesBookAddress,
            minterAddress, sliceCount, 0, saleend, baseUrl).send({
                from: minterAddress,
                to: this._salesInfo.cbFactoryAddress,
                value: this.web3.utils.toWei(fees, "ether")
            });

        const chainId = (await this.web3.eth.getChainId()).toString();

        console.log(`track created with txId ${tx.transactionHash}`);

        const details: NFTDetailsModel = {
            contractAddress,
            chainId,
            clonetxId: tx.transactionHash,
        };

        const done = await fetchJsonAsync<StoredTrackModel>(fetch(`${connectTo.dataSvr}/api/nft/new/${encodeURIComponent(trackId)}`, {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(details)
        }));
    }

    buy = async (
        { nftToSell, track: { track }, slice: { begin, end }, totalAmount_Gwi }:
            SelectedSlice & { nftToSell: NFTSlice, totalAmount_Gwi:string }) => {

        if (!totalAmount_Gwi) {
            throw new Error("no amount found");
        }
        

        if(!nftToSell.forSale){
            throw new Error('NFT is not for sale');
        }

        const myAddress = (await this.web3.eth.getAccounts())[0];

        if (nftToSell.owner == myAddress) {
            throw new Error('You already own this slice');
        }

        if (!track.nft.contractAddress) {
            throw new Error('NFT contract address not set');
        }

        if (!nftToSell.tokenId)
            throw new Error('for sale tokenId not set');

        const cbTrack = getcbTrack(this.web3, track.nft.contractAddress);
        const salesBook = getsalesBook(this.web3, this._salesInfo);

        let bookTx:TransactionReceipt;

    
//debugger;
        const contract = await salesBook.methods.getOrder(nftToSell.forSale.id).call();
//debugger;        
        const approved = await cbTrack.methods.getApproved(contract.tokenId).call();
        if(approved!= this._salesInfo.salesBookAddress){
            throw new Error("the sale is not approved");
        }
//debugger;        

        bookTx = await salesBook.methods.fulfill(nftToSell.forSale.id,
            begin,end
        ).send({
            from: myAddress,
            to: this._salesInfo.salesBookAddress,
            //value:this.web3.utils.toWei(totalAmount_Gwi,"ether")
            value:totalAmount_Gwi
        });

        console.log(`buy completed with tx: ${bookTx.transactionHash}`);
/*
        const done = await fetchJsonAsync<SalesOrderModel[]>(
            fetch(`${connectTo.dataSvr}/api/nft/salesOrder/completed/${encodeURIComponent(nftToSell.forSale.id)}/${encodeURIComponent(bookTx.transactionHash)}`));
*/
    }

    sell = async (
        { nftToSell, track: { track }, actionParams, slice: { begin, end }, trAmount }:
            SelectedSlice & { nftToSell: NFTSlice }) => {

        

        if (!trAmount?.amount) {
            throw new Error("no amount found");
        }

        const myAddress = (await this.web3.eth.getAccounts())[0];

        if (nftToSell.owner != myAddress) {
            throw new Error('You don\'t own this slice');
        }

        if (!track.nft.contractAddress) {
            throw new Error('NFT contract address not set');
        }

        if (!nftToSell.tokenId)
            throw new Error('for sale tokenId not set');

        const cbTrack = getcbTrack(this.web3, track.nft.contractAddress);
        const salesBook = getsalesBook(this.web3, this._salesInfo);

        const contractId = await salesBook.methods.computeId(track.nft.contractAddress, myAddress).call();

        if (begin == nftToSell.begin && end == nftToSell.end) {

            if(! (nftToSell.forSale || nftToSell.approved)){
                
                
                const tx = await cbTrack.methods.approve(this._salesInfo.salesBookAddress,
                    nftToSell.tokenId).send({
                    from: myAddress,
                    to: track.nft.contractAddress
                });

                console.log(`Sell  approve with tx ${tx.transactionHash}`);

            }else{
                console.log("NFT is already approved for sale");
            }

        } else {
            
            const tx = await cbTrack.methods.subdivideApprove(
                this._salesInfo.salesBookAddress,
                nftToSell.tokenId,
                begin,
                end
            ).send({
                from: myAddress,
                to: track.nft.contractAddress
            });

            console.log(`Sell subdevided approve with tx ${tx.transactionHash}`);
        }

        let bookTx:TransactionReceipt;
        const exists = await salesBook.methods.getOrder(contractId).call();
        if(web3AddressExists(exists?.seller)){
            console.log('exists in books so we need to update');

            
            bookTx = await salesBook.methods.updateBid(contractId,
                Date.now() + ((actionParams?.expireInDays || 7) * 24 * 60 * 60),
                nftToSell.tokenId, this.web3.utils.toWei(trAmount.amount, "ether")
                
            ).send({
                from: myAddress,
                to: this._salesInfo.salesBookAddress
            });

        }else{

            
            bookTx = await salesBook.methods.createOrder(track.nft.contractAddress,
                nftToSell.tokenId, this.web3.utils.toWei(trAmount.amount, "ether"),
                Date.now() + ((actionParams?.expireInDays || 7) * 24 * 60 * 60)
            ).send({
                from: myAddress,
                to: this._salesInfo.salesBookAddress
            });
    
        }

        /*
        const details: SalesOrderDetailsModel = {
            trackId: track.id,
            tokenId: nftToSell.tokenId,
            sellerAddress: myAddress,

            txId: bookTx.transactionHash,
            chainId: trAmount.chainId,

            amount: trAmount.amount
        };

        const done = await fetchJsonAsync<BidModel>(fetch(`${connectTo.dataSvr}/api/nft/salesOrder/${encodeURIComponent(contractId)}`, {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(details)
        }));
        */

    }

    bid = async ({ track: { track }, actionParams, slice: { begin, end }, trAmount }: SelectedSlice) => {

        if (actionParams?.action != 'bid') {
            throw new Error('action is not bid')
        }

        if (!trAmount?.amount) {
            throw new Error("no amount found");
        }

        const bidMaker = getBidMaker(this.web3, this._salesInfo.bidMakerAddress);

        const baseUrl = `${this._salesInfo.nftBaseUrl}/${track.id}`;
        const bidderAddress = (await this.web3.eth.getAccounts())[0];

        const contractId = await bidMaker.methods.computeId(baseUrl, bidderAddress).call();

        const tx = await bidMaker.methods.createBid(
            baseUrl,
            Date.now() + (actionParams.expireInDays * 24 * 60 * 60),
            begin, end
        ).send({
            from: bidderAddress,
            to: this._salesInfo.bidMakerAddress,
            value: this.web3.utils.toWei(trAmount.amount, "ether")
        });

        console.log(`bid created with txId ${tx.transactionHash}`);

        const bidsDetails: BidDetailsModel = {
            baseUrl,
            bidderAddress,
            txId: tx.transactionHash,
            chainId: trAmount.chainId
        };

        const done = await fetchJsonAsync<BidModel>(fetch(`${connectTo.dataSvr}/api/nft/bid/${encodeURIComponent(contractId)}`, {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bidsDetails)
        }));

    }

}