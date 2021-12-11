import React, { useEffect, useState, Fragment } from 'react';

import {
    Button, Pressable,
    Modal,
    FormControl,
    Input, Select,
    HStack, VStack, TextArea, Image, ScrollView,
    Text, Heading, Spinner, Center, Wrap, Flex, Spacer, NumberInput,

    Container, Icon, Box, useBreakpointValue, useColorMode,
    KeyboardAvoidingView
} from "native-base";

import { ShowError, IAsyncResult, fetchJsonAsync, connectTo } from '../utils';

import { TrackDisplayModel } from '../../generatedTypes/TrackDisplayModel';
import { useBuyingContext, usePlayControls, useAudioContext } from '../player/index';

import { useConnectCalls, useSalesInfo, useweb3Context } from '../web3';

import MyBids from './myBids';
import { SliceActions } from '../nav/routes';

import { NetworkSelect, ChooseAmount } from '../web3/display';
import { useTrackScreenCtx } from './trackScreenCtx';
import { ShowWei, ShowAdress } from '../web3/display';
import { MaterialCommunityIcons } from '@expo/vector-icons';


import moment from 'moment';


export default function ForSale() {
    const { subScreenProps } = useTrackScreenCtx();
    const { nfts } = useAudioContext();

    const { colorMode } = useColorMode();

    const { selectedSlice } = useBuyingContext();
    const { selectSlice } = usePlayControls();

    const web3Account = useweb3Context();

    const salesInfo = useSalesInfo();

    const mdOnly = useBreakpointValue({
        base: false,
        md: true
    });


    const trackId = subScreenProps?.track?.track.id;
    const myNFt = nfts && trackId && nfts[trackId] || undefined;

    const headerTxtColor = colorMode === 'dark' ? 'blueGray.300' : 'blueGray.600';

    const chainId = subScreenProps?.track?.track?.nft?.chainId ||'';

    const forSaleBgColor = colorMode === 'dark' ? 'blueGray.600' : 'blueGray.300';
    const notSaleBgColor = colorMode === 'dark' ? 'light.600' : 'light.300';

    const isAdmin = subScreenProps?.isAdmin;

    const myNFTs = (!!web3Account) && (myNFt?.result || []).filter(o => o.owner == web3Account) ||[];

    const myNFtids = myNFTs.map(o=>o.tokenId);

    const forSaleOrders = (myNFt?.result || []).filter(o => !!o.forSale && !myNFtids.includes(o.tokenId));
    const notForSaleOrders = (myNFt?.result || []).filter(o => !o.forSale && !myNFtids.includes(o.tokenId));

    const myChain = salesInfo?.chainInfo && chainId && salesInfo?.chainInfo[chainId] ||undefined;

    return <Center w="100%" bg={colorMode === 'dark' ? 'warmGray.800' : 'light.50'}>
        <VStack w="100%" maxW={800} space={2} mt={2}
            bg={colorMode === 'dark' ? 'warmGray.500' : 'light.200'} p={4}
            alignSelf={{ base: 'stretch', md: "center" }}
        >

            {subScreenProps?.track?.track?.nft  && <HStack alignItems="flex-start" 
                            justifyContent="flex-end" maxW={800}>
                {myChain && <Text ml={2} fontSize="sm"  fontStyle="italic">{myChain.name} - </Text>}
                <Box pt={0.5}>
                    <ShowAdress address={subScreenProps?.track?.track?.nft.contractAddress} aType="address" {...{chainId}} />
                </Box>
            </HStack>}


            {myNFt?.isLoading && <Spinner />||null}
            {myNFt?.error && <ShowError error={myNFt.error} />||null}

            <HStack flexGrow={1} space={1} mb={3} 
                bg={colorMode === 'dark' ? 'warmGray.600' : 'warmGray.300'}
            >
                <Text flexGrow={1} color={headerTxtColor} fontStyle="italic" fontSize="sm">owner</Text>

                <Text w="25%" color={headerTxtColor} fontStyle="italic" fontSize="sm" textAlign="center">slice</Text>

                <Text w="25%" color={headerTxtColor} fontStyle="italic" fontSize="sm">price/slice</Text>

            </HStack>

            
            {!!chainId && ([...myNFTs,...forSaleOrders, ...notForSaleOrders]).map(nft => <Box key={nft.tokenId}>

                <Pressable disabled={! (nft.forSale || (isAdmin && nft.approved) )} onPress={() => {

                    if (selectedSlice ||  !subScreenProps?.track)
                        return;

                    if (!isAdmin && nft.forSale) {
                        selectSlice({
                            track: subScreenProps?.track,
                            action: 'buy',
                            slice: {
                                begin: nft.begin,
                                end: nft.end
                            },
                            trAmount: {
                                amount: nft?.forSale?.details?.amount,
                                chainId
                            },
                            actionParams: {
                                action: 'buy',
                                expireInDays: 30
                            }
                        });
                    } else {

                        selectSlice({
                            track: subScreenProps?.track,
                            action: 'sell',
                            slice: {
                                begin: nft.begin,
                                end: nft.end
                            },
                            actionParams: {
                                action: 'sell',
                                expireInDays: 30
                            }
                        });

                    }

                }}>

                    <HStack flexGrow={1} space={1} bgColor={(nft.forSale || (isAdmin && nft.approved) ) ? forSaleBgColor : notSaleBgColor}>

                        {(!!web3Account) && nft.owner == web3Account && <Icon
                                    color="primary.500"
                                    size="md"
                                    as={<MaterialCommunityIcons name="crown" />}
                                />
                        }

                        <Box flexGrow={1}>
                            <ShowAdress address={nft.owner || ''} chainId={chainId} aType="address" />
                        </Box>

                        <Text w="25%" fontStyle="italic" textAlign="center" fontWeight="semibold">{`${nft.begin} - ${nft.end}`}</Text>

                        <Box w="25%">
                            {nft.forSale?.details?.amount && <ShowWei wei={nft.forSale?.details?.amount} chainId={chainId} />}
                        </Box>

                    </HStack>


                </Pressable>

            </Box>)}


        </VStack>
    </Center>;

}