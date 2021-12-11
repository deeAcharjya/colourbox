import React, { useState } from 'react';

import { useWeb3Modal } from '../web3';

import { ShowError, IAsyncResult, fetchJsonAsync, connectTo } from '../utils';
import QRCode from 'react-native-qrcode-svg';
import { TxStatusModel } from '../../generatedTypes/TxStatusModel';
import { useAuthentication } from '../auth';


import WalletConnect from "@walletconnect/client";
import {IQRCodeModal, ICryptoLib} from "@walletconnect/types";

import {encrypt,decrypt, generateKey} from '../web3/nativeCrypto';

import {
    Button, Center
} from 'native-base';
import { setupURLPolyfill } from 'react-native-url-polyfill';

class myModal implements IQRCodeModal{

    public setUri:(uri:string)=>void = ()=>{}

    open(uri: string, cb: any, opts?: any): void {

        const k = uri;
        const k1 = cb;
        const k2 = opts;
        
        this.setUri(uri);

        console.log(`need to open myMdal ->${uri}`);
    }
    close(): void {
        debugger;
    }

}


function hexStringToArrayBuffer(hexString:string) {
    // remove the leading 0x
    hexString = hexString.replace(/^0x/, '');
    
    // ensure even number of characters
    if (hexString.length % 2 != 0) {
        console.log('WARNING: expecting an even number of characters in the hexString');
    }
    
    // check for some non-hex characters
    var bad = hexString.match(/[G-Z\s]/i);
    if (bad) {
        console.log('WARNING: found non-hex characters', bad);    
    }
    
    // split the string into pairs of octets
    var pairs = hexString.match(/[\dA-F]{2}/gi);
    
    if(! pairs)
        throw new Error('null pairs');
    // convert the octets to integers
    var integers = pairs.map(function(s) {
        return parseInt(s, 16);
    });
    
    var array = new Uint8Array(integers);
    console.log(array);
    
    return array.buffer;
}
//let oldgeKey:undefined|( (length?: number) => Promise<ArrayBuffer>) = undefined;
let _oldLib :undefined|ICryptoLib = undefined;

export default function CreateNFT() {
    const connectToWeb3 = useWeb3Modal();
    const [curl, setCurl] = useState<string>();
    const { ensureLogin } = useAuthentication();



    return <Center>

        <Button onPress={async () => {
            //connectToWeb3.connect();

            //https://victoryeo-62924.medium.com/ethereum-wallet-app-with-react-native-26275f3765f8

            try {

                const creds = await ensureLogin();

                //wc:7f0573ba-19ac-4e70-a308-6a5ebfbcb930@1?bridge=https%3A%2F%2Fq.bridge.walletconnect.org&key=cd20c57c9b0677b3120efbb3a04bb233271afbf385e15f50fc3a0a08d9223170

                //const myUrl = 'wc:7f0573ba-19ac-4e70-a308-6a5ebfbcb930@1?bridge=https%3A%2F%2Fq.bridge.walletconnect.org&key=cd20c57c9b0677b3120efbb3a04bb233271afbf385e15f50fc3a0a08d9223170';
                //const myUrl = 'wc:08384fcf-b52c-45a8-879e-7efdbf726e68@1?bridge=https%3A%2F%2Fg.bridge.walletconnect.org&key=6c7e811ad02046ad62a7c6e0c4efdacd93d82edfbbb68fabdd17b1bba95a1412';
                //setCurl(myUrl);

                const myModalIn = new myModal();
                myModalIn.setUri = x=>setCurl(x);

                // Create a connector
                const connector = new WalletConnect({
                    bridge: "https://bridge.walletconnect.org", // Required
                    qrcodeModal:myModalIn,
//                    uri:myUrl
                });

                if(!_oldLib){
                    console.log('saving oldgekey');
                    _oldLib = (connector as any)._cryptoLib;
                }

                if(!_oldLib)
                    throw new Error('oldgeKey not defined');


                const objkk = {encrypt,decrypt,generateKey : async (length?: number)=>{
                    console.log(`generate key please length = ${length||0}`);

                    /*
                    return await new Promise((resolve,reject)=>{
                        crypto.generateKey('aes',{length:length||128},(err,key)=>{
                            if(err)
                                reject(err);
                            else{
                                key.asymmetricKeyDetails.()
                            }

                        });
    
                    });

                    */

                    return hexStringToArrayBuffer('6c7e811ad02046ad62a7c6e0c4efdacd93d82edfbbb68fabdd17b1bba95a1412');
                    //return await _oldLib?.generateKey (length);
                }};


                (connector as any)._cryptoLib = {encrypt,decrypt,generateKey};

                /*
                (connector as any)._cryptoLib.generateKey = (length?: number)=>{
                    console.log('generate key please');
                    if(!oldgeKey){
                        throw new Error('oldgeKey not defined');
                    }
                    return oldgeKey(length);
                }
                */


                connector.on("session_update", (error, payload) => {
                    if (error) {
                        throw error;
                    }

                    // Get updated accounts and chainId
                    const { accounts, chainId } = payload.params[0];
                });

                connector.on("disconnect", (error, payload) => {
                    if (error) {
                        throw error;
                    }

                    // Delete connector
                });

                const h = 21+22;

                console.log('wait for connect 1.10');
                debugger;
                

                const { accounts, chainId } = await connector.connect({
                    chainId:3
                });

                console.log(`got connection :${accounts[0]}`);

                debugger;                

                //connector.sendTransaction

                await connector.killSession();

                console.log('killed');

                

                /*
                                const result = await fetchJsonAsync<TxStatusModel>(
                                    fetch(`${connectTo.dataSvr}/api/bridge/setup`, {
                                        method: 'get',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': 'Bearer ' + creds.jwt
                                        }
                                    }));
                
                                setCurl(result.connectURL);
                
                                
                                const result2 = await fetchJsonAsync<string[]>(
                                    fetch(`${connectTo.dataSvr}/api/bridge/result/${encodeURIComponent(result.txId)}`,{
                                        method: 'get',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': 'Bearer ' + creds.jwt
                                        }
                                    }));
                
                                const j = result2;
                                */

            } catch (error: any) {
                console.error('failed to connect ' + error);
                debugger;
            }
        }}>
            create it 1.19
        </Button>

        {curl && <QRCode value={curl} size={200} />}

    </Center>;
}