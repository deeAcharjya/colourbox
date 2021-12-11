import React, { useEffect, useState, Fragment } from 'react';

import {
    Button,
    Modal,
    FormControl,
    Input,
    HStack, VStack, TextArea, Image,
    Text, Heading, Spinner, Center, Wrap,

    Container, Icon, Box, useBreakpointValue, useColorMode,
} from "native-base";

import { TrackDisplayModel } from '../../generatedTypes/TrackDisplayModel';
import { useStoredMedia } from '../media/display';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TrackDisplay } from '../player/trackDisplay';
import { BandModel } from '../../generatedTypes/BandModel';

import { usePlayControls, useBuyingContext , useAudioContext} from '../player';

import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { DrawerParamList, SliceActions } from '../nav/routes';


const BuyButtons = ({ track, routeAction, isAdmin }: {
    track: TrackDisplayModel;
    routeAction?: SliceActions;
    isAdmin?: boolean;
}) => {
    const navigation = useNavigation<DrawerNavigationProp<DrawerParamList>>();
    const { selectedSlice } = useBuyingContext();
    const { selectSlice } = usePlayControls();
    const { nfts } = useAudioContext();

    const myNFt = nfts && track?.track?.id && 
                nfts[track?.track?.id] ||undefined;

    useEffect(() => {

        if (track && routeAction) {
            selectSlice({
                track,
                action: routeAction,
                slice: {
                    begin: 0,
                    end: 10
                }
            });
        }

    }, [track, routeAction]);

    if (!!selectedSlice)
        return null;

    if (isAdmin) {

        if (!track?.track?.nft)
            return null;

        return <HStack space={3} justifyContent="space-between" mx={5}>

            <Button variant="solid" colorScheme="info" flexGrow={1} maxW={400}
                onPress={() => {

                    selectSlice({
                        track,
                        action: 'sell',
                        slice: {
                            begin: 0,
                            end: 10
                        }
                    });

                    if (!routeAction) {
                        navigation.navigate('Track', { trackId: track.track.id, action: 'sell' });
                    }

                }}
            >
                Sell your Track
            </Button>

        </HStack>;
    }

    return <HStack space={3} justifyContent="center"  >
        <Button variant="solid" colorScheme="info" flexGrow={1} maxW={400}
            onPress={() => {

                if (routeAction) {

                    selectSlice({
                        track,
                        action: routeAction,
                        slice: {
                            begin: 0,
                            end: 10
                        }
                    });

                } else {
                    navigation.navigate('Track', { trackId: track.track.id, action: 'bid' });
                }

            }}
        >
            Bid for NFT
        </Button>

        {track?.track?.nft && <Button variant="solid" colorScheme="success" flexGrow={2} maxW={400}
            onPress={() => {

                //if (true && routeAction) {
                    const forSaleOrders = (myNFt?.result || []).filter(o => !!o.forSale );
                    if(0==forSaleOrders.length){
                        console.log('nothing for sale');
                        return;
                    }

                    selectSlice({
                        track,
                        action: 'buy',
                        slice: {
                            begin: forSaleOrders[0].begin,
                            end: forSaleOrders[0].end
                        },
                        trAmount: {
                            amount: forSaleOrders[0].forSale?.details?.amount||'',
                            chainId: forSaleOrders[0].forSale?.details.chainId||''
                        },
                        actionParams: {
                            action: 'buy',
                            expireInDays: 30
                        }
                    });

                /*} else {
                    navigation.navigate('Track', { trackId: track.track.id, action: 'buy' });
                }*/
            }}
        >
            Buy NFT
        </Button>
        }

    </HStack>;
}


export default function HeaderView({ track, band, isAdmin }: {
    track: TrackDisplayModel;
    band?: BandModel;
    isAdmin?: boolean;
}) {
    const { ImageView } = useStoredMedia();


    const { colorMode } = useColorMode();

    //const connectToWeb3 = useWeb3Modal();
    const navigation = useNavigation<DrawerNavigationProp<DrawerParamList>>();

    const forSmallScreen = useBreakpointValue({
        base: true,
        md: false
    });

    //const { BuyDialog, buy, bid } = useBuyNFT(track);

    const { params: { action: routeAction } } = useRoute() as RouteProp<DrawerParamList, 'Track'>;



    const myImage = <ImageView imageId={track.track.details.imageId}
        h={Styles.bandThumbDim} w={Styles.bandThumbDim}
        borderColor="gray.200" borderWidth={1}
        borderRadius={Styles.bandRadius}
    />;

    const myData = <Fragment>

        <Box backgroundColor="gray.700" p={1} m={1} >
            <Text fontSize="lg" fontWeight="bold" color="white">
                {track.track.details.displayName}
            </Text>
        </Box>

        {band && <Button variant="unstyled" m={1} p={0}
            onPress={() => navigation.navigate('Profile', { bandId: band.id })}
        >
            <HStack backgroundColor="gray.700" alignItems="center" space={1} px={1} >
                <ImageView imageId={band.details?.imageId} h={25} w={25} />
                <Text isTruncated color="white" >{band.details?.displayName}</Text>
            </HStack></Button>
        }

        {/*<Box backgroundColor="gray.700" p={1} m={1} >
            <Text color="white">
                Some other information
            </Text>
        </Box>
        */}

    </Fragment>;


    const bgColor = colorMode === 'dark' ? 'light.900' : 'light.50';

    {/*BIG TODO todo: remove this if check..  */ }

    if (forSmallScreen) {
        return <VStack
            bgColor={bgColor}
            space={4} alignItems="stretch"
            p={{
                base: 1,
                lg: 3
            }}
        >
            <HStack space={2} justifyContent="center">
                {myImage}

                <VStack justifyContent="center">
                    {myData}
                </VStack>

            </HStack>

            <BuyButtons {...{ track, routeAction, isAdmin }} />

            <TrackDisplay {...{ track }} allowSlicing />

        </VStack>;
    } else {

        return <HStack bgColor={bgColor}
            space={4} alignItems="center"
            p={{
                base: 1,
                md: 3
            }}
        >

            {myImage}

            <VStack space={2} flexGrow={1}>

                <HStack alignItems="center" >
                    {myData}
                </HStack>

                <TrackDisplay {...{ track }} height={70} allowSlicing />

                <BuyButtons {...{ track, routeAction, isAdmin }} />

            </VStack>

        </HStack>;

    }



}

const Styles = {
    bandThumbDim: {
        base: 100,
        md: 175
    },
    bandRadius: {
        base: 100 / 2,
        md: 175 / 2
    }


};