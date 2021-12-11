import React, { useEffect, useState, FC, useMemo } from 'react';

import {
    Button, Heading, Flex,
    Modal,
    FormControl, useBreakpointValue,
    Input,
    HStack, VStack, TextArea, Image,
    Text, Spinner, Center, useTheme, useColorMode,
    Wrap, Icon, Box, KeyboardAvoidingView, ScrollView
} from "native-base";

import { TabView, SceneMap, TabBar } from 'react-native-tab-view';

import { HomeProps } from '../nav/routes';


import { Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';


import { TrackScreenProps } from '../nav/routes';
import { ShowError, IAsyncResult, fetchJsonAsync, connectTo } from '../utils';

import { useAuthentication } from '../auth';

import { TrackDisplayModel } from '../../generatedTypes/TrackDisplayModel';
import { BandModel } from '../../generatedTypes/BandModel';


import { TrackSubscreenCtxProvider, TrackSubScreenProps, useTrackScreenCtx } from '../nft/trackScreenCtx';


import { useBuyingContext, usePlayControls } from '../player/index';

import { BidOrBuySlice } from '../nft/bidUnsigned';

import ForSaleView from '../nft/forSale';

import BandList from '../band/list';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { DrawerParamList } from '../nav/routes';



type SceneProps = {
    key: 'listen' | 'produce' | 'nfts';
    title: string;
};

const RenderScene = ({ route }: {
    route: SceneProps;
}) => {

    let rendevView = <Center justifyContent="center" alignItems="center" my={5}>
        <Text>{route.key} coming soon </Text>
    </Center>;


    switch (route.key) {
        case 'listen':
            rendevView = <ListenScreen />;
            break;
        case 'produce':
            rendevView = <MusicianTab />;
            break;
    }

    return <ScrollView>{rendevView}</ScrollView>;
};

function MusicianTab() {

    const navigation = useNavigation<DrawerNavigationProp<DrawerParamList>>();
    const musciImage = useBreakpointValue({
        base: require('./music2.png'),
        md: require('./music1.png'),
        lg: require('./music3.png')
    });

    const musciImageBg = useBreakpointValue({
        base: 'contain',
        xl: 'cover'
    });

    const pointsSize = useBreakpointValue({
        base: 17,
        md: 20
    });

    const flowDirection = useBreakpointValue({
        base: 'column',
        md: 'row'
    });


    return <VStack >
        <Box w="100%" bg="black" h={{
            base: '200px',
            md: '400px',
            lg: '600px'
        }}>
            <Image h="100%" source={musciImage} alt="nft for musicians" resizeMethod='scale' resizeMode={musciImageBg} />
        </Box>


        <Center flexGrow={1} p={1}>
            <VStack justifyContent="center">

                <Heading textAlign="center" fontSize={{
                    base: 20,
                    lg: 30
                }} mt={3} px={2}>
                    ColourBox is your one stop shop to distribute your music and Create NFTs at the same time
                </Heading>

                <Flex direction={flowDirection} >

                    {'column' == flowDirection && <Center><Button  variant="solid" colorScheme="tertiary" m={4} p={4} w={250} 
                        onPress={()=>navigation.navigate('BandSignup')} >
                        Sign up as a band
                    </Button></Center>
                    }
                    <VStack alignItems="flex-start" space={{
                        base: 2,
                        md: 3
                    }} my={{
                        base:4,
                        md:6
                    }} maxW={600} mx={5} alignSelf="center">

                        <HStack space={2} alignItems="flex-start" >
                            <Icon as={<MaterialCommunityIcons name="cloud-upload" size={20} />} />
                            <Text fontSize={pointsSize} ><Text fontSize={pointsSize + 3} fontWeight="semibold">Sign up</Text> with your phone number, email, or <Text fontWeight="bold" >Crypto wallet</Text></Text>
                        </HStack>

                        <HStack space={2} alignItems="flex-start" >
                            <Icon as={<MaterialCommunityIcons name="cloud-upload" size={20} />} />
                            <Text fontSize={pointsSize} ><Text fontSize={pointsSize + 3} fontWeight="semibold">Upload</Text> your music</Text>
                        </HStack>


                        <HStack space={2} alignItems="flex-start" >
                            <Icon as={<MaterialCommunityIcons name="cloud-upload" size={20} />} />
                            <Text fontSize={pointsSize} ><Text fontSize={pointsSize + 3} fontWeight="semibold">Tell your friends</Text> and fans to stream it from ColourBox.That way you keep "ALL" of your streaming earnings.</Text>
                        </HStack>

                        <HStack space={2} alignItems="flex-start" >
                            <Icon as={<MaterialCommunityIcons name="cloud-upload" size={20} />} />
                            <Text fontSize={pointsSize} >
                                Use our <Text fontSize={pointsSize + 3} fontWeight="semibold">"distribution" tools</Text> to PUSH your music to all major outlets like Spotify, Google Play ....
                                <Text opacity="0.6" fontSize={16}>and be satisfied with whatever meagerly percentage they send your way..OR NOT</Text>
                            </Text>
                        </HStack>

                        <HStack space={2} alignItems="flex-start" >
                            <Icon as={<MaterialCommunityIcons name="cloud-upload" size={20} />} />
                            <Text fontSize={pointsSize} ><Text fontSize={pointsSize + 3} fontWeight="semibold">NFT-ize your track-- </Text>
                                Slice your track into 1/10 sec.segments and put them up (some of it) for sale..You can use the funds to finishing your
                                mastering project, pay for that tour..or just let your
                                <Text fontSize={pointsSize} fontWeight="bold" color="primary.500" > fans share your success</Text>
                            </Text>
                        </HStack>
                    </VStack>
                    
                    {'column' != flowDirection && <Center flexGrow={1}><Button flexGrow={1} variant="solid" colorScheme="tertiary" m={10} 
                        minW={300} maxH={100} onPress={()=>navigation.navigate('BandSignup')} >
                        Sign up as a band
                    </Button></Center>
                    }
                </Flex>




            </VStack>
        </Center >

    </VStack >;
}

function ListenScreen() {

    const { colorMode } = useColorMode();

    

    return <VStack >
        
        <VStack my={5} p={2} space={2} bgColor={"dark"==colorMode?"warmGray.800":"warmGray.100"}>
            <Heading size="lg" color={"dark"===colorMode?"primary.500":undefined}
                textAlign="center"> Welcome to the "super secret" early early release of ColourBox</Heading>

            <Text textAlign="center"  >Feel free to look around. 
            Upload and NFT-ize some tracks, Buy few NFTs and please excuse our dust why we get everything working</Text>

            <Text textAlign="center"  >To try us out on testnet visit https://testnet.colourbox.io</Text>

        </VStack>

        <Heading m={2} size="md" > Picks for you</Heading>
        <BandList />
    </VStack>;

}

const renderTabBar = (props: any) => {

    const { colors } = useTheme();
    const { colorMode } = useColorMode();



    return <TabBar
        {...props}

        indicatorStyle={{ backgroundColor: colors.primary[colorMode === 'dark' ? '200' : '600'] }}

        labelStyle={{
            fontSize: 18,
            textTransform: "none",
            paddingBottom: 5

        }}

        style={{

            backgroundColor: colorMode === 'dark' ? colors.warmGray['800'] : colors.warmGray['50'],
            height: 40
        }}

        /*renderIcon={({ route, focused, color }) => (
            <Icon
                as={<MaterialCommunityIcons name="music-accidental-natural" />}
                color={color}
            />
        )}*/



        activeColor={colors.info[colorMode === 'dark' ? '100' : '600']}

        inactiveColor={colors.light[colorMode === 'dark' ? '300' : '600']}

    />
}


export default function LandingPage({ route }: HomeProps) {

    const [index, setIndex] = React.useState(0);
    const [tabRoutes, setTabRoutes] = React.useState<SceneProps[]>([]);

    //const initialLayout = { width: '100%', height: '100%' };
    useEffect(() => {

        setTabRoutes([{
            key: 'listen',
            title: 'Top picks'
        }, {
            key: 'produce',
            title: 'Musicians'
        }, {
            key: 'nfts',
            title: 'FAQ'
        }]);

        if(route?.params?.tab == 'musicians'){
            setIndex(1);
        }

    }, [route]);


    return <VStack flexGrow={1}
        space={5}

        _dark={{ bg: "blueGray.900" }}
        _light={{ bg: "blueGray.100" }}
    >

        {tabRoutes.length > 0 && <TabView

            style={{
                flexGrow: 1
            }}

            renderTabBar={renderTabBar}

            navigationState={{
                index,
                routes: tabRoutes
            }}

            renderScene={RenderScene}

            onIndexChange={i => {
                setIndex(i);
            }}



        />
        }

    </VStack>;
}
