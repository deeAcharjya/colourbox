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
import { useBuyingContext, usePlayControls } from '../player/index';

import { useConnectCalls } from '../web3';

import { BidModel } from '../../generatedTypes/BidModel';

import { getBidMaker } from '../web3/contractCalls';
import { ShowWei, ShowAdress } from '../web3/display';

import moment from 'moment';

import {CreateNFT} from './createNft';
import { BandModel } from '../../generatedTypes/BandModel';


type BidDetails = {
    baseURI: string;
    bidPrice: string;
    bidder: string;
    expiresOn: string;
    created: string;
    begin: string;
    end: string;
};

function BidDetails({ bid }: { bid: BidModel }) {

    const [details, setDetails] = useState<IAsyncResult<BidDetails>>();

    const { readOnlyWeb3, getSalesInfo } = useConnectCalls();

    const mdOnly = useBreakpointValue({
        base: false,
        md: true
    });


    useEffect(() => {

        (async () => {
            try {
                setDetails({ isLoading: true });

                const roWeb3 = await readOnlyWeb3(bid.details.chainId);
                const bidMaker = getBidMaker(roWeb3, (await getSalesInfo()).bidMakerAddress);

                const result = await bidMaker.methods.getBid(bid.id).call();

                setDetails({ result });

            } catch (error: any) {
                setDetails({ error });
            }
        })();

    }, [bid]);

    if (details?.isLoading) {
        return <HStack>
            <Text isTruncated maxW={20}>{`${bid.id}`}</Text>
            <Spinner />
        </HStack>;
    }

    if (details?.error || !details?.result) {
        return <HStack>
            <Text isTruncated maxW={20}>{`${bid.id}`}</Text>
            <ShowError error={details?.error || new Error('no details')} />
        </HStack>;
    }

    return <HStack flexGrow={1} space={1} px={2} >
        <Box flexGrow={1}><ShowAdress address={details.result.bidder} chainId={bid.details.chainId} aType="address" /></Box>

        <Text w="15%" fontStyle="italic" fontWeight="semibold">{`${details.result.begin} - ${details.result.end}`}</Text>

        {mdOnly && <Box w="15%"><ShowAdress address={bid.details.txId} chainId={bid.details.chainId} aType="tx" /></Box>}

        <Text w="20%">{moment(Number.parseInt(details.result.expiresOn)).fromNow()}</Text>

        <Box w="25%"><ShowWei wei={details.result.bidPrice} chainId={bid.details.chainId} /></Box>

    </HStack>;
}


export function MyBids({ track, isAdmin, band }: {
    track: TrackDisplayModel;
    isAdmin?: boolean;
    band:BandModel;
}) {

    const [bids, setBids] = useState<IAsyncResult<BidModel[]>>();
    const { colorMode } = useColorMode();

    const mdOnly = useBreakpointValue({
        base: false,
        md: true
    });

    useEffect(() => {

        (async () => {
            try {

                if (!track?.track?.id)
                    return;

                setBids({ isLoading: true });

                const result = await fetchJsonAsync<BidModel[]>(fetch(`${connectTo.dataSvr}/api/nft/bidsByTrack/${encodeURIComponent(track.track.id)}`));

                setBids({ result });
            } catch (error: any) {
                setBids({ error });
            }
        })();

    }, [track]);

    if (bids?.isLoading)
        return <Spinner />;

    if (bids?.error)
        return <ShowError error={bids.error} />;

    const headerTxtColor = colorMode === 'dark' ? 'blueGray.300' : 'blueGray.600';

    let headPrompt: JSX.Element = <Center flexGrow={1} justifyContent="center">
        <Text fontSize="lg" color="primary.400" textAlign="center">
            Be the first one to invite this track to be available as NFT
        </Text>

    </Center>;

    if (isAdmin) {

        if (track.track.nft) {
            //if track has NFTs

            if (bids?.result?.length == 0) {
                headPrompt = <Heading textAlign="center" size="md" my={2}>
                    Your NFT-ized track is ready
                </Heading>;
            } else {
                headPrompt = <Heading textAlign="center" size="md" my={2}>
                    You have bids waiting for you
                </Heading>;
            }


        } else {

            if (bids?.result?.length == 0) {
                headPrompt = <Heading textAlign="center" size="md" my={2}>NFT-ize your track, so that they can start bidding</Heading>
            } else {
                headPrompt = <Heading textAlign="center" size="md" my={2}>Congrats!!!  There are bids waiting for your NFTs</Heading>
            }
        }
    } else {

        if (track.track.nft) {

            if (bids?.result?.length == 0) {
                
                headPrompt = <Center flexGrow={1} justifyContent="center">
                <Text fontSize="lg" color="primary.400" textAlign="center">
                    Be the first one to bid on this track
                </Text>
        
            </Center>;

            } else {
                headPrompt = <Text textAlign="center" fontSize="sm" my={2}>
                    Happy Bidding
                </Text>
            }
        } else {
            if (bids?.result?.length == 0) {
                //this default
            } else {
                <Text textAlign="center" fontSize="sm" my={2}>
                    This track is not yet available for sale. If you know the musician let them know they got bids
                </Text>
            }
        }
    }

    return <Center w="100%" >

        {headPrompt}

        {isAdmin && !track.track.nft && <CreateNFT {...{ track, band }} />}

        <VStack w="100%" maxW={800}
            bg={colorMode === 'dark' ? 'warmGray.500' : 'light.200'} p={4}
            alignSelf={{ base: 'stretch', md: "center" }}
        >
            <HStack flexGrow={1} space={1} mb={3} px={2}
                bg={colorMode === 'dark' ? 'warmGray.600' : 'warmGray.300'}
            >
                <Text flexGrow={1} color={headerTxtColor} fontStyle="italic" fontSize="sm">bidder</Text>

                <Text w="15%" color={headerTxtColor} fontStyle="italic" fontSize="sm">slice</Text>

                {mdOnly && <Text w="15%" color={headerTxtColor} fontStyle="italic" fontSize="sm">tx</Text>}

                <Text w="20%" color={headerTxtColor} fontStyle="italic" fontSize="sm">expires</Text>
                <Text w="25%" color={headerTxtColor} fontStyle="italic" fontSize="sm">bid price</Text>

            </HStack>

            {(bids?.result || []).slice(0, 20).map(bid => <Box key={bid.id}>
                <BidDetails {...{ bid }} />
            </Box>
            )}
        </VStack>

    </Center>;
}