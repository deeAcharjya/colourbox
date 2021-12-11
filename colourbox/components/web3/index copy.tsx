import React, { useState, useEffect, useCallback, FC } from 'react';

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


import { useWeb3React, Web3ReactProvider } from "@web3-react/core";
import { InjectedConnector, NoEthereumProviderError } from '@web3-react/injected-connector';

//import {WalletConnectConnector} from '@web3-react/walletconnect-connector';

import QRCode from 'react-native-qrcode-svg';

/*
exploring https://github.com/WalletConnect/WalletConnectSharp
*/


const injected = new InjectedConnector({
    supportedChainIds: [1, 3, 4, 5, 42],
  })

export const [Web3ProviderInternal, useWeb3Modal] = constate(
    useWeb3,
    v => v.web3Modal,
);

function getLibrary(provider:any) {
    debugger;
    return new Web3(provider)
  }
  

export const Web3Provider: FC<{}> = ({ children }) => {
    return <Web3ReactProvider getLibrary={getLibrary}>
        <Web3ProviderInternal>
            {children}
        </Web3ProviderInternal>
    </Web3ReactProvider>;
}

/*
const walletConnect = new WalletConnectConnector({
    supportedChainIds: [1, 3, 4, 5, 42],
    qrcode:false,
    
});
*/

const providerOptions = {
    /* See Provider Options Section *
    authereum: {
        package: Authereum
    },
    torus: {
        package: Torus
    },
*/
};

type Web3withAddress = {
    web3?: Web3;
    address?: string;
}


//import { Web3WalletConnector, CONNECT_EVENT, ERROR_EVENT } from "@mindsorg/web3modal-ts";



function useWeb3() {

    const [web3Async, setWeb3] = useState<IAsyncResult<Web3withAddress>>();

    const { active, account, library, connector, 
        activate, deactivate ,
        setError
    } = useWeb3React();

   
    async function ConnectWeb3(useInjected?: boolean){

        if(undefined == useInjected){
            useInjected = Platform.OS === 'web';
        }

        try{

            if (useInjected) {
                console.log('injected called');
                await activate(injected, undefined, true);
            }else{
                console.log('walletConnect called');
//                await activate(walletConnect,undefined,true);

            


            }

            console.log('web3 connected');

        }
        
        catch(error:any){
            
            if(useInjected && error instanceof NoEthereumProviderError){
                console.log('no injected web3');
                await ConnectWeb3(false);

            }else{
                console.error('failed to connect :' + error);
            }

            
        }

    }


    const web3Modal = {

        connect:ConnectWeb3
    };

    if (Platform.OS === 'web') {

/*
        web3Modal.connect = async ()=>{
            try{

                await activate(injected);

                console.log('web3 connected');

            }catch(error:any){
                debugger;
                console.error('failed to connect :' + error);
            }
        }

        
        web3Modal = new Web3WalletConnector({
            network: "ropsten", // optional
    
            cacheProvider: false, // optional
            providerOptions, // required
            disableInjectedProvider: true, // optional. For MetaMask / Brave / Opera.
        });

        
        web3Modal.providerController.on(CONNECT_EVENT, async p => {

            try {
    
                setWeb3({ isLoading: true });
                /*
                const done = await p.request({
                  method: "wallet_switchEthereumChain",
                  params: [{ chainId: "0x3" }]
                });
            
    
                const web3 = new Web3(p);
    
                const myAccounts = await web3.eth.getAccounts();
    
                if (!myAccounts?.length) {
                    throw new Error('no wallet found');
                }
    
    
                console.log(`wallet address = ${myAccounts[0]}`);
    
    
    
                setWeb3({ result: { web3, address: myAccounts[0] } });
    
            } catch (error) {
                setWeb3({ error: error as Error });
            }
    
    
        });
    
        web3Modal.providerController.on(ERROR_EVENT, p => {
            debugger;
    
            const h = p;
            console.log(h);
        });
    */
    }



    /*
    const connectBtn = () => {

        return <Button onPress={() => {
            try {



            } catch (error: any) {
                debugger;
                console.error(error);
            }

        }}>
            connect
        </Button>;
    };
    */

    return { web3Modal };

}

