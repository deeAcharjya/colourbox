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

import { Dimensions } from 'react-native';


import { TrackScreenProps } from '../nav/routes';
import { ShowError, IAsyncResult, fetchJsonAsync, connectTo } from '../utils';

import { useAuthentication } from '../auth';

import { TrackDisplayModel } from '../../generatedTypes/TrackDisplayModel';
import { BandModel } from '../../generatedTypes/BandModel';

import HeaderView from './detailsHeader';

import { TrackSubscreenCtxProvider, TrackSubScreenProps, useTrackScreenCtx } from '../nft/trackScreenCtx';
import {BuySellView} from '../nft/bidUnsigned';

import { useBuyingContext, usePlayControls } from '../player/index';

import {BidOrBuySlice} from '../nft/bidUnsigned';

import ForSaleView from '../nft/forSale';

type SceneProps = TrackSubScreenProps & {
  key: 'comments' | 'demandNFT' | 'fulfill'|'nfts';
  title: string;
};

/*
const sceneRoutes = [
  { key: 'comments', title: 'Comments', isAdmin:false },
  { key: 'details', title: 'Details' , isAdmin:false},
  { key: 'bids', title: 'Bids' , isAdmin:false},
  { key: 'history', title: 'History' , isAdmin:false},
];
*/


const RenderSceneView: FC<{ route: TrackSubScreenProps }> = ({ route, children }) => {
  const { setSubScreenProps } = useTrackScreenCtx();
  useEffect(() => {
    setSubScreenProps(route);
  }, [route]);

  const { selectedSlice } = useBuyingContext();

  return <ScrollView>
      <VStack>
          {selectedSlice?.action && <BidOrBuySlice track={route.track} action={selectedSlice?.action}/>}
         {children}
      </VStack>
    </ScrollView>;
}

const RenderScene = ({ route }: {
  route: SceneProps;
}) => {

  let rendevView = <Center justifyContent="center" alignItems="center" my={5}>
    <Text>{route.key} are closed </Text>
  </Center>;

  switch (route.key) {
    case 'demandNFT':
    case 'fulfill':
      rendevView = <BuySellView track={route.track} isAdmin={route.isAdmin} band={route.band}/>;
      break;
    case 'nfts':
      rendevView = <ForSaleView/>;
      break;
  }

  return <RenderSceneView {...{ route }}>{rendevView}</RenderSceneView>;
};


const renderTabBar = (props: any) => {

  const { colors } = useTheme();
  const { colorMode } = useColorMode();

  return <TabBar
    {...props}

    indicatorStyle={{ backgroundColor: colors.primary[colorMode === 'dark' ? '200' : '300'] }}

    labelStyle={{
      fontSize: 12,
      textTransform: "none",
    }}

    style={{
      backgroundColor: colorMode === 'dark' ? colors.warmGray['700'] : colors.light['100'],
      height: 40
    }}

    activeColor={colors.info[colorMode === 'dark' ? '100' : '700']}

    inactiveColor={colors.light[colorMode === 'dark' ? '300' : '500']}

  />
}


export default function ProfileView({ route }: TrackScreenProps) {

  const [track, setTrack] = useState<IAsyncResult<TrackDisplayModel>>();
  const [band, setBand] = useState<IAsyncResult<BandModel>>();

  const { loginDetails } = useAuthentication();

  const [index, setIndex] = React.useState(1);
  const [tabRoutes, setTabRoutes] = React.useState<SceneProps[]>([]);

  
  
  //const initialLayout = { width: Dimensions.get('window').width };
  const initialLayout = { width: 100, height: 100 };

  async function loadTrack() {
    try {
      if (!route?.params?.trackId) {
        throw new Error('trackId not provided');
      }

      setTrack({ isLoading: true });
      const result = await fetchJsonAsync<TrackDisplayModel>(
        fetch(`${connectTo.dataSvr}/api/tracks/details/${encodeURIComponent(route?.params?.trackId)}`));
      setTrack({ result });

    } catch (error: any) {
      setTrack({ error });
    }
  }

  useEffect(() => {
    loadTrack();
  }, [route?.params?.trackId]);

  const isAdminFn = (theband?: BandModel) => loginDetails?.userId && theband
    && theband.admins.includes(loginDetails.userId) || false;

  async function loadBand() {
    try {

      if (!track?.result?.track.bandId) {
        setBand(undefined);
        return;
      }

      setBand({ isLoading: true });
      const result = await fetchJsonAsync<BandModel>(
        fetch(`${connectTo.dataSvr}/api/bands/${encodeURIComponent(track?.result?.track.bandId)}`));
      setBand({ result });

      if (!result) {
        throw new Error('failed to load band');
      }

      const isAdmin = isAdminFn(result);

      const commonProps = {
        band: result, track: track.result, isAdmin, reLoadTrack: loadTrack
      };


      const myTabs: SceneProps[] = [
        { ...commonProps, key: 'comments', title: 'Comments' },
      ];

      if (isAdmin) {
        if (track?.result?.track.nft) {

          myTabs.push({ ...commonProps, key: 'fulfill', title: 'Bids' });
          myTabs.push({ ...commonProps, key: 'nfts', title: 'NFTs' });
          

        } else {

          //myTabs.push({ key: 'tokanize', title: 'Convert to NFT', band: result, track: track.result, isAdmin });
          myTabs.push({ ...commonProps, key: 'demandNFT', title: 'Convert to NFT' });
          
        }

      } else {
        if (track?.result?.track.nft) {

          myTabs.push({ ...commonProps, key: 'nfts', title: 'NFTs' });
          myTabs.push({ ...commonProps, key: 'demandNFT', title: 'Bids' });

        } else {
          myTabs.push({ ...commonProps, key: 'demandNFT', title: 'Bids' });
          
        }
      }

      setTabRoutes(myTabs);

      /*
        
        { key: 'details', title: 'Details' , isAdmin:true},
        { key: 'bids', title: 'Bids' , isAdmin:true},
        { key: 'history', title: 'History' , isAdmin:true},
      ]);
      */

    } catch (error: any) {
      setBand({ error });
    }
  }

  useEffect(() => {
    loadBand();
  }, [track?.result?.track.bandId, loginDetails?.userId]);

  const isAdmin = isAdminFn(band?.result);

  const headerView = useMemo(() => track?.result && band?.result && <HeaderView isAdmin={isAdminFn(band?.result)} track={track.result} band={band.result} />, [track, band]);

  if (track?.isLoading) {
    return <Center><Spinner /></Center>;
  }

  if (track?.error || !track?.result) return <ShowError error={track?.error || new Error("no track")} />;

  if (band?.isLoading) {
    return <Center><Spinner /></Center>;
  }

  if (band?.error || !band?.result) return <ShowError error={band?.error || new Error("no band")} />;

  

  
  return <VStack flexGrow={1}>

    {headerView}


    <TrackSubscreenCtxProvider>
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

        initialLayout={initialLayout}

      />
      }
    </TrackSubscreenCtxProvider>

  </VStack>;
}