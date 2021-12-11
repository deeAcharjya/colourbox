import React, { useEffect, useState, FC, useMemo } from 'react';

import {
    Button,
    Modal,
    FormControl,
    Input,
    HStack, VStack, TextArea, Image,
    Text, Spinner, Center, useTheme, useColorMode,
    Wrap, Icon, Box, KeyboardAvoidingView, ScrollView
} from "native-base";

import { TabView, SceneMap, TabBar } from 'react-native-tab-view';

import { HomeProps } from '../nav/routes';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Dimensions } from 'react-native';


import { TrackScreenProps } from '../nav/routes';
import { ShowError, IAsyncResult, fetchJsonAsync, connectTo } from '../utils';

import { useAuthentication } from '../auth';

import { TrackDisplayModel } from '../../generatedTypes/TrackDisplayModel';
import { BandModel } from '../../generatedTypes/BandModel';


import { TrackSubscreenCtxProvider, TrackSubScreenProps, useTrackScreenCtx } from '../nft/trackScreenCtx';

import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { DrawerParamList } from '../nav/routes';



import { useBuyingContext, usePlayControls } from '../player/index';

import { BidOrBuySlice } from '../nft/bidUnsigned';

import ForSaleView from '../nft/forSale';

import BandList from '../band/list';

type SceneProps = {
    key: 'bands' | 'nfts';
    title: string;
};

const RenderScene = ({ route }: {
    route: SceneProps;
}) => {

    let rendevView = <Center justifyContent="center" alignItems="center" my={5}>
        <Text>{route.key} are closed </Text>
    </Center>;

    
        switch (route.key) {
            case 'bands':
                rendevView =<Box >
                <VStack>
                    <BandList mine />
                </VStack>
    
            </Box>
    
                break;
        }
    
    return <ScrollView>{rendevView}</ScrollView>;
};

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


export default function MyAccount({ navigation }: HomeProps) {

    const [index, setIndex] = React.useState(0);
    const [tabRoutes, setTabRoutes] = React.useState<SceneProps[]>([]);
    const {ensureLogin} = useAuthentication();


    //const initialLayout = { width: '100%', height: '100%' };
    useEffect(()=>{

        (async ()=>{
            try{
                await ensureLogin();
            }catch{
                navigation.navigate('Home',{tab:'picks'});
            }

        })();
        

        setTabRoutes([{
            key:'bands',
            title:'Upload music'
        },{
            key:'nfts',
            title:' NFTs'
        }]);

    },[]);


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
