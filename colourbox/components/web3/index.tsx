import React, { useMemo, useState, useEffect, useCallback, FC, useRef } from 'react';

import Web3 from "web3";
import constate from 'constate';

import { ShowError, IAsyncResult, fetchJsonAsync, connectTo } from '../utils';

import {
    Button,
    Modal,
    FormControl,
    Input,
    HStack, VStack, TextArea, Image,
    Text, Spinner, Center, useTheme, useColorMode,
    Wrap, Icon, Box, KeyboardAvoidingView
} from "native-base";

import { Platform } from 'react-native';
import Injectedweb3, { ICbCalls } from './injectedWeb3';
import ContractCalls, { IContractCalls } from './contractCalls';
import { SalesInfoModel } from '../../generatedTypes/SalesInfoModel';



class Dummy implements ICbCalls {

    constructor() {
        throw new Error("Not yet supported. Please use a browser with injected web3");
    }

    bid = async () => { };
    connect = async () => { throw new Error('not implemented') };
}

export const [Web3Provider,
    useConnectCalls, useweb3Context, useSalesInfo] = constate(
        useWeb3,
        v => v.connectCtx,
        v => v.web3Account,
        v=>v.salesInfo
    );


function useWeb3() {

    ///The account used to sign web3 operations
    const [web3Account, setWeb3Account] = useState<string>();
    const [salesInfo, setSalesInfo] = useState<SalesInfoModel>();
    const salesInfoRef = useRef<SalesInfoModel>();

    const web3AccountRef = useRef<string>();

    useEffect(()=>{

        (async ()=>{
            try{
                await getSalesInfo();
            }catch(error:any){
                console.error(`failed get salesInfo ${error}`);
            }
    
        })();
    },[]);

    const getSalesInfo = async () => {

        if (!!salesInfoRef.current){
            return salesInfoRef.current;
        }
        
        salesInfoRef.current = await fetchJsonAsync<SalesInfoModel>(
            fetch(`${connectTo.dataSvr}/api/nft/salesinfo`));

        setSalesInfo(salesInfoRef.current);
           
        return salesInfoRef.current;

    };

    const readOnlyWeb3 = async (chainId: string) => {
        const salesInfo = await getSalesInfo();
        if(!salesInfo.chainInfo[chainId]?.rpcProvider)
            throw new Error(`chain Id ${chainId} not supported`);

        return new Web3(salesInfo.chainInfo[chainId]?.rpcProvider);
    }

    const connect = async (chainId?: string) => {

        try {
            console.log("web3 connect called");

            let caller: ICbCalls | undefined = undefined;

            if (Platform.OS === 'web') {
                console.log('web3 : connecting for web platform');

                if ((window as any)?.ethereum) {
                    console.log('web3 : connecting using injected');
                    caller = new Injectedweb3();
                } else {
                    console.log('web3 : No injected Found');
                }
            }

            if (!caller) {
                caller = new Dummy();
            }

            const web3 = await caller.connect(chainId);

            const account = (await web3.eth.getAccounts())[0];

            if (account != web3AccountRef.current) {
                web3AccountRef.current = account;
                setWeb3Account(web3AccountRef.current);
            }

            return new ContractCalls(web3, await getSalesInfo() ) as IContractCalls;


        } catch (error: any) {
            console.error(`failed to connect to web3 :${error}`);
            throw error;
        }

    };

    const connectCtx = useMemo(() => ({
        connect,
        readOnlyWeb3,
        getSalesInfo
    }), []);

    

    return { connectCtx, web3Account, salesInfo };
}




