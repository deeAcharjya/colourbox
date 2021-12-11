import Web3 from "web3";

export interface ICbCalls {
    connect: (chainId?: string) => Promise<Web3>;
};

type ChainInfo ={
    rpcUrl?:string;
    hexChainId: string;
};

//used to add new network
//todo: needs to come from the server
const rpcMap:{[chainId:string]:ChainInfo} ={
    "3":{
        hexChainId:"0x3"
    }
};


// docs ate https://docs.metamask.io/guide/rpc-api.html#permissions

export default class Injectedweb3 implements ICbCalls {

    readonly injected: any;

    constructor() {
        this.injected = (window as any)?.ethereum;

        if (!this.injected) {
            throw new Error("no injected provider found");
        }

    }


    connect = async (chainId?: string) => {

        if(!!chainId){
            await this.ensureCorrectChain(chainId);
        }
        

        const accounts: string[] = await this.injected.request({ method: 'eth_requestAccounts' });

        console.log(`injected : provider connected :${accounts[0]}`);

        return new Web3(this.injected);
    };

    private ensureCorrectChain = async (chainId: string) => {

        const chainInfo = rpcMap[chainId]; 

        try {
            console.log(`current chain id ${this.injected.networkVersion}`);

            if (this.injected.networkVersion == chainId) {
                console.log(`current chain id ${chainId} is correct`);
                return;
            }

            await this.injected.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId:chainInfo?.hexChainId }],
            });

            console.log(`switched to chain id ${this.injected.networkVersion}`);

        } catch (switchError:any) {

            // This error code indicates that the chain has not been added to MetaMask.
            if (switchError.code === 4902) {
                try {

                    if(!!chainInfo?.rpcUrl)
                        throw new Error(`no rpc defined for chainId ${chainId}`);

                    await this.injected.request({
                        method: 'wallet_addEthereumChain',
                        params: [{ chainId, rpcUrl: rpcMap[chainId] }],
                    });

                    console.log(`added and switched to chain id ${this.injected.networkVersion}`);

                } catch (addError:any) {
                    console.error(`failed to add network : ${addError}`);
                    throw new Error("failed to switch network. Please switch manually and try again");        
                }
            }

            console.error(`failed to switch network : ${switchError}`);
            
            throw new Error("failed to switch network. Please switch manually and try again");
        }

    }

    bid = async () => { };

}