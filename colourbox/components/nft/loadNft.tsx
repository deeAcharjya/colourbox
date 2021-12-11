
import { useEffect, useState } from 'react';
import { StoredTrackModel } from '../../generatedTypes/StoredTrackModel'
import Web3 from "web3";

import { ColorTrackClonable } from '../../typechain/ColorTrackClonable';
import ColorTrackClonableJson from '../../abi/ColorTrackClonable.json';

import { NFTSlice, useAudioContext, usePlayControls } from '../player/index';

import { ShowError, IAsyncResult, fetchJsonAsync, connectTo } from '../utils';
import {SalesOrderModel} from '../../generatedTypes/SalesOrderModel';

import {useConnectCalls, useweb3Context} from '../web3';

import {getsalesBook,web3AddressExists} from '../web3/contractCalls';


//const web3 = new Web3('https://ropsten.infura.io/v3/1513be817fd84f2aa65c7abd2c1bc288');


export function useNFTSlices({ nft: nftDetails, id: trackId }: StoredTrackModel) {
    const { nfts } = useAudioContext();
    const {setNfts} = usePlayControls();

    const [trackNFT, setTrackNFT] = useState<IAsyncResult<NFTSlice[]>>();

    const {readOnlyWeb3, getSalesInfo} = useConnectCalls();

    

    useEffect(() => {

        (async () => {

            if (!nftDetails?.contractAddress) {
                console.debug('loadNFT called with no NFT address')
                return;
            }

            if (!! (nfts && nfts[trackId])) {
                setTrackNFT(nfts[trackId]);
                return;
            }

            
            function upDateNFT(updated:IAsyncResult<NFTSlice[]>){
                setTrackNFT(updated);
        
                const exsting = { ...nfts };
                exsting[trackId] = updated;
                setNfts && setNfts(exsting);
        
            }

            try {

                upDateNFT({isLoading:true});

                const salesInfo = await getSalesInfo();
                const {salesBookAddress} = salesInfo;

                const roWeb3 = await readOnlyWeb3(nftDetails.chainId);

                const salesBook = getsalesBook(roWeb3,salesInfo);

                const cbTrack: ColorTrackClonable = new roWeb3.eth.Contract(ColorTrackClonableJson as any, nftDetails.contractAddress) as any;

                //throw new Error("do not load");
                const supply = await cbTrack.methods.totalSupply().call();

                //const salesOrders = await fetchJsonAsync<SalesOrderModel[]>(fetch(`${connectTo.dataSvr}/api/nft/ordersByTrack/${encodeURIComponent(trackId)}`));
                

                let result = await Promise.all([...Array(Number.parseInt(supply)).keys()].map(async i => {

                    const tokenId = await cbTrack.methods.tokenByIndex(i).call();

                    const approved = await cbTrack.methods.getApproved(tokenId).call();

                    const url = await cbTrack.methods.tokenURI(tokenId).call();

                    const owner = await cbTrack.methods.ownerOf(tokenId).call();

                    const contractId = await salesBook.methods.computeId(nftDetails.contractAddress,owner).call();

                    const salesContract = await salesBook.methods.getOrder(contractId).call();


                    //"http://test.me?begin=131&end=300"
                    const { groups: { begin, end } } = /.*begin=(?<begin>\d+)&end=(?<end>\d+)/.exec(url) as any;

                    const forSale:SalesOrderModel|undefined =(approved == salesBookAddress) &&  salesContract.tokenId == tokenId && 
                                    web3AddressExists(salesContract.seller) &&{
                        id: contractId,
                        details:{
                            trackId,
                            tokenId,
                            sellerAddress:salesContract.seller,
                            txId:'',
                            chainId:nftDetails.chainId,
                            amount:salesContract.price
                        }

                    }||undefined;

                    return {
                        begin: Number.parseInt(begin),
                        end: Number.parseInt(end),
                        
                        //forSale: (approved == salesBookAddress) && salesOrders.find(s=>s.details.tokenId == tokenId) || undefined,
                        forSale,

                        approved:(approved == salesBookAddress),
                        
                        owner,
                        tokenId
                    } as NFTSlice;
                }));

                result = result.sort((a,b) => b.begin-a.begin);


                return upDateNFT({result});

            } catch (error: any) {
                
                console.error(`failed to load NFT: ${error}`);
                upDateNFT({error});
            }
        })();


    }, [trackId, nftDetails, setNfts, nfts]);

    return trackNFT;

}