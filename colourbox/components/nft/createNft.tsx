import React, { useState, useEffect } from 'react';

//import { useWeb3Modal } from '../web3';

import { ShowError, IAsyncResult, fetchJsonAsync, connectTo, fetchStringAsync } from '../utils';
import QRCode from 'react-native-qrcode-svg';
import { TxStatusModel } from '../../generatedTypes/TxStatusModel';
import { useAuthentication } from '../auth';

import { ColorTrackDeployModel } from '../../generatedTypes/ColorTrackDeployModel';
import { TrackDisplayModel } from '../../generatedTypes/TrackDisplayModel';

import WalletConnect from "@walletconnect/client";
import { IQRCodeModal, ICryptoLib } from "@walletconnect/types";

import { encrypt, decrypt, generateKey } from '../web3/nativeCrypto';

import {
    Button,
    Modal,
    FormControl,
    Input, Select,
    HStack, VStack, TextArea, Image, Slider,
    Text, Heading, Spinner, Center, Wrap, Flex, Spacer, NumberInput,

    Container, Icon, Box, useBreakpointValue, useColorMode,
    KeyboardAvoidingView
} from "native-base";


import { useBuyingContext, usePlayControls } from '../player/index';
import { NetworkSelect, ChooseAmount } from '../web3/display';
import { useConnectCalls, useSalesInfo } from '../web3';
import { getcbFactory } from '../web3/contractCalls';
import NeedCustodial from './needCustodial';

import { useTrackScreenCtx } from './trackScreenCtx';
import { BandModel } from '../../generatedTypes/BandModel';


export function CreateNFT({ track, band }: {
    track: TrackDisplayModel;
    band: BandModel;
}) {
    //const connectToWeb3 = useWeb3Modal();
    const [curl, setCurl] = useState<string>();
    const { ensureLogin } = useAuthentication();

    const [chainId, setChainId] = React.useState<string>();
    const [priceofSlice, setPriceofSlice] = useState<string>("");
    const [salePercent, setSalePercent] = useState(49);
    const salesInfo = useSalesInfo();

    const [fees, setFees] = useState<string>("0.1");

    const [needsCustodial, setNeedsCustodial] = useState<{
        needsCustodial?: boolean;
        showDlg?: boolean;
    }>();

    const { colorMode } = useColorMode();

    const { readOnlyWeb3, connect } = useConnectCalls();

    const [submitted, setSubmitted] = useState<IAsyncResult<boolean>>();

    const {subScreenProps} = useTrackScreenCtx();

    const chainInfo = salesInfo?.chainInfo && chainId && salesInfo?.chainInfo[chainId] || undefined;



    useEffect(() => {

        if (salesInfo?.chainInfo && !chainId) {
            const keys = Object.keys(salesInfo?.chainInfo);
            if (keys.length > 0) {
                setChainId(keys[0]);
            }
        }

        if (!chainInfo?.rate || !!priceofSlice)
            return;

        const suggestedPrice = (1.0 / chainInfo.rate).toFixed(5);
        setPriceofSlice(suggestedPrice);

        ///we are chossing to pay $10  in fees
        setFees((10.0 / chainInfo.rate).toFixed(5));

    }, [chainInfo, chainId, salesInfo]);

    const formDirection = useBreakpointValue({
        base: 'column',
        md: 'row'
    });

    const sliceCount = (track?.durationinSec || 0) * 10;

    const valNumber = priceofSlice && Number.parseFloat(priceofSlice) || undefined;

    const forSale = Math.floor(salePercent * sliceCount * .01);


    const goal = valNumber && chainInfo?.rate &&
        (valNumber * forSale * chainInfo?.rate).toFixed(2) || '';

    if (!chainId) {
        return <Spinner />;
    }

    const mintIt = async (needsCustodial: boolean) => {

        try {
            setSubmitted({ isLoading: true });

            if(!band.approved){
                throw new Error("We need to sign some paperwork before you can mint. Try out our testnet https://testenet.colourbox.io to try minting without approvals.");
            }

            //let myAddress:string|undefined = undefined;
            if (!needsCustodial) {
                const caller = await connect(chainId);
                //myAddress = (await caller.web3.eth.getAccounts())[0];
                await caller.createCb({
                    sliceCount,
                    salePercent,
                    trackId: track.track.id,
                    fees
                });

            } else {
                throw new Error("Custodial accounts are not yet implemented");
            }

            /*

            const creds = await ensureLogin();

            if(!chainId){
                return ;
            }

            const deploy: ColorTrackDeployModel = {
                trackId: track.track.id,
                salePercent,
                chainId,
                priceofSlice
            };

            const result = await fetchStringAsync(
                fetch(`${connectTo.dataSvr}/api/tracks/createNFT`, {
                    method: 'post',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + creds.jwt
                    },
                    body: JSON.stringify(deploy)
                }));
            */

            setSubmitted({ result: true });
            subScreenProps?.reLoadTrack && subScreenProps.reLoadTrack();

        } catch (error: any) {
            console.error('failed to connect ' + error);
            setSubmitted({ error });
        }
    };

    return <Center w="100%" mb={2}>

        {needsCustodial?.showDlg && <NeedCustodial onCancel={() => setNeedsCustodial(undefined)} onOk={needsCustodial => {
            setNeedsCustodial({ needsCustodial });
            mintIt(needsCustodial);
        }} />}

        <VStack
            bg={colorMode === 'dark' ? 'warmGray.700' : 'light.100'} p={4}
            alignSelf={{ base: 'stretch', md: "center" }}
        >

            <Flex direction={formDirection} alignItems={formDirection == "row" ? "flex-end" : undefined}>

                <Box mb={{ base: 0, md: '25px' }}><NetworkSelect chainId={chainId} onChanged={c => setChainId(c)} /></Box>

                <Box px={{ base: 0, md: 4 }} flexShrink={1} >
                    <ChooseAmount {...{ chainId }} label="price/slice" isRequired
                        value={priceofSlice || ''} onChanged={v => setPriceofSlice(v)} />
                </Box>

            </Flex>

            <FormControl mt={2}>
                <FormControl.Label>
                    <Text>
                        Sell <Text fontWeight="bold"> {forSale} </Text>  of {sliceCount} slices
                        {goal && <Text ml={3} borderBottomWidth={1} fontStyle="italic"
                            color={colorMode === "dark" ? "primary.200" : "primary.500"}

                        >
                            {`goal of $${goal}`}
                        </Text>}
                    </Text>
                </FormControl.Label>
                <Slider value={salePercent} onChange={v => setSalePercent(Math.floor(v))}
                >
                    <Slider.Track>
                        <Slider.FilledTrack />
                    </Slider.Track>
                    <Slider.Thumb />
                </Slider>
            </FormControl>

            {submitted?.isLoading && <Spinner/>}
            {submitted?.error && <ShowError error={submitted.error}/>}

            <Button colorScheme="primary" flexGrow={1} disabled={!!submitted?.isLoading}
                maxW={800} p={4} m={4} size="lg"
                onPress={() => setNeedsCustodial({ showDlg: true })}>
                NFT-ize your track !!!
            </Button>


        </VStack>


        {curl && <QRCode value={curl} size={200} />}

    </Center>;
}