import React, { useEffect, useState, Fragment } from 'react';

import {
    Button,
    Modal,
    FormControl,
    Input, Select,
    HStack, VStack, TextArea, Image,
    Text, Heading, Spinner, Center, Wrap, Flex, Spacer, NumberInput,

    Container, Icon, Box, useBreakpointValue, useColorMode,
    KeyboardAvoidingView
} from "native-base";

import { ShowError, IAsyncResult, fetchJsonAsync, connectTo } from '../utils';

import { TrackDisplayModel } from '../../generatedTypes/TrackDisplayModel';
import { useBuyingContext, usePlayControls, useAudioContext } from '../player/index';

import { useConnectCalls, useSalesInfo } from '../web3';

import {MyBids} from './myBids';
import { SliceActions } from '../nav/routes';

import { NetworkSelect, ChooseAmount, ShowWei } from '../web3/display';
import { useTrackScreenCtx } from './trackScreenCtx';
import { BandModel } from '../../generatedTypes/BandModel';


export  function BuySellView({ track, isAdmin , band}: {
    track: TrackDisplayModel;
    isAdmin?: boolean;
    band:BandModel;
}) {
    const { selectedSlice } = useBuyingContext();

    return <VStack flexGrow={1} space={2} alignItems="center" p={1} mt={1} >

        {!isAdmin && !track.track.nft && <Heading size="md" textAlign="center">
            Invite this track to be NFT-ized
        </Heading>
        }

        <MyBids {...{ track, isAdmin, band }} />

        {/*(selectedSlice && !isAdmin) ? <BidOrBuySlice {...{ track }} /> : */}

    </VStack>;

}


export function BidOrBuySlice({ track, action, isAdmin }: {
    track: TrackDisplayModel;
    action: SliceActions;
    isAdmin?: boolean;
}) {
    const { colorMode } = useColorMode();
    const { selectedSlice } = useBuyingContext();
    const { selectSlice, setNfts } = usePlayControls();
    const { nfts } = useAudioContext();

    const [chainId, setChainId] = React.useState("3");
    const { connect } = useConnectCalls();
    const salesInfo = useSalesInfo();

    const trackNFTs = nfts && track?.track?.id && nfts[track?.track?.id]?.result || undefined;

    const formDirection = useBreakpointValue({
        base: 'column',
        md: 'row'
    });

    const [submitted, setSubmitted] = useState<IAsyncResult<boolean>>();

    const { subScreenProps } = useTrackScreenCtx();

    useEffect(() => {

        if (!track)
            return;

        if (!selectedSlice || selectedSlice.track.track.id != track.track.id) {
            selectSlice({
                track,
                slice: {
                    begin: 0, end: 9
                },
                action: isAdmin ? 'sell' : 'bid'
            });
        }
    }, [track, selectedSlice]);


    const begin = selectedSlice?.slice?.begin || 0;
    const count = (selectedSlice?.slice.end || 0) - begin + 1;

    const maxSlices = (track?.durationinSec || 0) * 10;
    //console.debug(`BidUnsignedView rendered begin ${begin}`);

    if (!selectedSlice) {
        return <Spinner />;
    }

    const networkSelect = <Select
        selectedValue={chainId}
        minW={200}
        flexGrow={1}
        accessibilityLabel="Choose Service"
        placeholder="Choose Service"
        _selectedItem={{
            bg: "teal.600",

        }}
        mt={1}
        onValueChange={(itemValue) => setChainId(itemValue)}
    >
        <Select.Item label="Ropsten" value="3" />
    </Select>;

    let prompts = {
        count: 'buy',
        amount: 'Bid amount',
        expiresIn: 'bid expires in',
        submit: 'Bid for NFT'
    };

    if (action == 'sell') {
        prompts = {
            count: 'sell',
            amount: 'price/slice',
            expiresIn: 'order expires in',
            submit: 'Sell NFT'
        }
    } else if (action == "buy") {
        prompts.submit = 'Buy NFT'
    }

    const chainInfo = salesInfo?.chainInfo && chainId && salesInfo?.chainInfo[chainId] || undefined;

    const valNumber = selectedSlice?.trAmount?.amount
        && Number.parseFloat(selectedSlice?.trAmount?.amount) || undefined;

    const forSale = selectedSlice?.slice?.end
        && (selectedSlice.slice.end - (selectedSlice.slice.begin || 0) + 1);


    const goal = valNumber && chainInfo?.rate &&
        (valNumber * forSale * chainInfo?.rate).toFixed(2) || '';

    const totalSalesAmount = (valNumber && ( (valNumber * forSale)  + 0.001  ))?.toString()||'0';


    return <KeyboardAvoidingView><Center w="100%" mt={4} >

        <VStack
            bg={colorMode === 'dark' ? 'warmGray.700' : 'light.100'} p={4}
            alignSelf={{ base: 'stretch', md: "center" }}
        >

            <Flex direction={formDirection}>

                <Box px={{ base: 0, md: 4 }}><FormControl isRequired >
                    <FormControl.Label>{prompts.count} </FormControl.Label>
                    <Input
                        type="number"
                        placeholder="10"
                        value={count.toString()}
                        onChangeText={(value) => {

                            const n = Number.parseInt(value);
                            if (n <= 0 || n >= maxSlices) {
                                console.debug(`begin n outside range ${n}`);
                                return;
                            }

                            if (selectedSlice) {

                                const newSlice = { ...selectedSlice.slice, begin, end: begin + n - 1 };
                                selectSlice({ ...selectedSlice, slice: newSlice });

                            } else {
                                console.debug('no slice selected');
                            }

                        }}

                        InputRightElement={<Text px={1}>of {maxSlices} slices</Text>}
                    />
                    {/*<FormControl.HelperText _text={{ fontSize: 'xs' }} >
                    {`This track will have ${maxSlices} slices`}
                </FormControl.HelperText>*/}

                </FormControl></Box>



                <Box px={{ base: 0, md: 4 }} py={{ base: 1, md: 0 }}><FormControl isRequired>
                    <FormControl.Label>begining at</FormControl.Label>
                    <Input
                        type="number"
                        placeholder="0"
                        value={begin.toString()}
                        onChangeText={(value) => {

                            const n = Number.parseInt(value);
                            if (n < 0 && n >= maxSlices) {
                                return;
                            }

                            const newSlice = { ...selectedSlice.slice, begin: n, end: n + 10 };
                            selectSlice({ ...selectedSlice, slice: newSlice });

                        }}

                        InputLeftElement={<Text px={1}>slice</Text>}
                    />
                    <FormControl.HelperText _text={{ fontSize: 'xs' }} >
                        {`This track has ${maxSlices} slices`}
                    </FormControl.HelperText>

                </FormControl></Box>

            </Flex>

            <Flex direction={formDirection} alignItems={{ base: undefined, md: "flex-start" }}
                mt={{ base: 1, md: 4 }}
            >

                {action == "buy" ? <VStack>

                    <Text color={colorMode==="dark"?'muted.200':'muted.600'} fontSize="xs">chain : {chainInfo?.name || ''}</Text>

                    <HStack justifyContent="space-between" mt={2} borderTopWidth={1} pt={3}>
                        <Text>{forSale} slices @</Text>
                        <HStack>
                            <ShowWei wei={selectedSlice?.trAmount?.amount || '0'} chainId={chainId} />
                            <Text ml={1} fontSize="sm">/slice</Text>
                        </HStack>
                    </HStack>

                    <HStack justifyContent="flex-end" borderTopWidth={1} pt={1} mt={3}>
                        <Text fontWeight="bold" fontSize="sm" mr={2} >total price:</Text>
                        {totalSalesAmount && <ShowWei wei={totalSalesAmount} {...{ chainId }} />}
                    </HStack>

                </VStack>
                    : <HStack space={1}
                        alignSelf={{ base: 'stretch', md: "center" }}
                    >

                        <Box pt={'24px'} minW='150px' flexShrink={1}>
                            <NetworkSelect chainId={chainId} onChanged={c => setChainId(c)} />
                        </Box>

                        <Box px={{ base: 0, md: 4 }} flexGrow={1} >

                            <ChooseAmount {...{ chainId }} label="price/slice" isRequired
                                value={selectedSlice?.trAmount?.amount || ''}
                                onChanged={amount => {

                                    if (!amount) {
                                        selectSlice({ ...selectedSlice, trAmount: undefined });
                                    } else {
                                        selectSlice({ ...selectedSlice, trAmount: { amount, chainId } });
                                    }

                                }} />



                        </Box>
                    </HStack>
                }

                {action != "buy" && <HStack alignItems="flex-end" space={1} pb={{ base: 0, md: '25px' }}
                    alignSelf={{ base: 'stretch', md: "center" }}
                >
                    <Box px={{ base: 0, md: 4 }} py={{ base: 1, md: 0 }}
                        flexGrow={1}><FormControl isRequired
                            isInvalid={!(selectedSlice?.actionParams?.action == 'bid' &&
                                selectedSlice?.actionParams?.expireInDays)}
                        >
                            <FormControl.Label>{prompts.expiresIn}</FormControl.Label>
                            <Input
                                placeholder="7"
                                value={selectedSlice?.actionParams?.action == 'bid' &&
                                    selectedSlice?.actionParams?.expireInDays.toString() || ""}

                                onChangeText={(value) => {

                                    if (!value) {
                                        selectSlice({ ...selectedSlice, actionParams: undefined });
                                    }

                                    const expireInDays = Number.parseInt(value);
                                    if (expireInDays < 0 && expireInDays > 31) {
                                        return;
                                    }

                                    selectSlice({ ...selectedSlice, actionParams: { action: 'bid', expireInDays } })

                                }}

                                InputRightElement={<Text px={1}>days</Text>}
                            />

                        </FormControl></Box>

                    <Button variant="outline" colorScheme="info" size="sm" mb={{ base: 1, md: undefined }}>
                        Learn more
                    </Button>
                </HStack>
                }

            </Flex>

            {submitted?.error && <ShowError error={submitted.error} />}
            {submitted?.isLoading && <Spinner />}
            {submitted?.isLoading && <Text color="tertiary.400">Waiting for wallet</Text>}

            <Box>
                {action == 'sell' && (!!goal) && <Text borderBottomWidth={1} fontStyle="italic"
                    color={colorMode === "dark" ? "primary.200" : "primary.500"}

                >
                    {`total of $${goal}`}
                </Text>
                }
            </Box>



            <HStack space={3} mt={{ base: 2, md: 4 }} width="95%" alignSelf="center">

                <Button variant="outline" colorScheme="danger" disabled={!!submitted?.isLoading}
                    onPress={() => selectSlice(undefined)}
                >
                    Cancel
                </Button>

                <Button variant="solid" size="lg" colorScheme="primary"
                    flexGrow={1} disabled={!!submitted?.isLoading}
                    onPress={async () => {
                        try {


                            if (!selectedSlice?.trAmount?.amount)
                                throw new Error('amount is required');

                            if (!selectedSlice?.actionParams?.action)
                                throw new Error('not action found');

                            if (selectedSlice?.actionParams?.action == 'bid' || selectedSlice?.actionParams?.action == 'sell') {
                                if (selectedSlice?.actionParams?.expireInDays < 1)
                                    throw new Error('bid cannot expire before 1 day');
                            }

                            setSubmitted({ isLoading: true });


                            if (action == 'bid') {
                                const caller = await connect(chainId);
                                await caller.bid(selectedSlice);
                            } else {

                                if (!trackNFTs) {
                                    throw new Error('NFT details are not loaded');
                                }

                                let ordered = [...trackNFTs];

                                if(action=="buy"){
                                    ordered =ordered.filter(n=>!!n.forSale);
                                }else{

                                }

                                ordered = ordered.sort((a, b) => b.begin - a.begin);

                                let nftToSell = ordered.find(n => n.begin <= selectedSlice.slice.begin);

                                if (!nftToSell) {
                                    nftToSell = ordered.length>0 && ordered[ordered.length-1] || undefined;
                                    if(!nftToSell){
                                        throw new Error("Your choice is not available.");    
                                    }

                                    const newSlice = { ...selectedSlice.slice, end: nftToSell.end };
                                    selectSlice({ ...selectedSlice, slice: newSlice });
                                    throw new Error("Your choice was not available. We are suggesting one that is");
                                }

                                if (selectedSlice.slice.end > nftToSell.end) {
                                    const newSlice = { ...selectedSlice.slice, end: nftToSell.end };
                                    selectSlice({ ...selectedSlice, slice: newSlice });

                                    throw new Error("Your choice was crossing slice boundaries. We have adjusted it. Please check and try again");
                                }
    
                                if (!track?.track?.nft)
                                    throw new Error('Track NFT details not available');

                                if (action == 'sell') {

                                    //const creds = await ensureLogin();
                                    const caller = await connect(chainId);
                                    await caller.sell({ ...selectedSlice, nftToSell });

                                }else{

                                    const caller = await connect(chainId);
                                    await caller.buy({ ...selectedSlice, nftToSell , totalAmount_Gwi: (totalSalesAmount||'') });
                                }

                            }

                            setSubmitted({ result: true });
                            selectSlice(undefined);
                            subScreenProps?.reLoadTrack && subScreenProps.reLoadTrack();

                            const cloned = {...nfts};
                            delete cloned[track.track.id];

                            setNfts(cloned);


                        } catch (error: any) {
                            setSubmitted({ error });
                        }
                    }}
                >
                    {prompts.submit}
                </Button>

            </HStack>

        </VStack>
    </Center></KeyboardAvoidingView>;
};

