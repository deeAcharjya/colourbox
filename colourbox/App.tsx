import React, { Fragment } from "react";
import './global';
import 'react-native-url-polyfill/auto';

//import { polyfillWebCrypto } from 'expo-standard-web-crypto';

import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';

import {
  NativeBaseProvider, Text, Box, useColorMode, VStack

} from "native-base";


//import NativeBaseIcon from "./components/NativeBaseIcon";
import { MyDrawer } from "./components/nav/screens";
import { routeLinking } from "./components/nav/routes";
import { LoginProvider, useLoginDlg } from "./components/auth";
import { StoredMediaProvider } from './components/media/display';
import { AudioProvider, useAudioContext } from './components/player';

import { Web3Provider } from "./components/web3";

import { TrackDisplay } from './components/player/trackDisplay';

import customTheme from './components/nav/theme';

//import WalletConnectProvider from "react-native-walletconnect";

//dee: don't think we need this any more
//polyfillWebCrypto();
// crypto.getRandomValues is now globally defined

function BottomPlayer(){
  const { loadedTrack } = useAudioContext();

  return <VStack 
    _dark={{ bg: "blueGray.900" }}
    _light={{bg:"blueGray.100"}}
  >
    {loadedTrack && <TrackDisplay track={loadedTrack.track} />}
  </VStack>
}


function WithLogin() {

  const LoginDlg = useLoginDlg();
  

  return <Fragment>
    <LoginDlg />
    <Box safeArea flex={1}>
      <MyDrawer />

      <BottomPlayer/>

    </Box>
  </Fragment>;
}

/*
const MyTheme = {
  dark: false,
  colors: {
    primary: 'rgb(255, 0, 0)',
    background: 'rgb(255, 0, 0)',
    card: 'rgb(0, 255, 0)',
    text: 'rgb(255, 0, 0)',
    border: 'rgb(199, 0, 0)',
    notification: 'rgb(255, 0, 0)',
  },
};
*/


function WithNav() {
  const { colorMode } = useColorMode();
  return (

      <NavigationContainer
        theme={colorMode === 'dark' ? DarkTheme : DefaultTheme}
        linking={routeLinking}
        fallback={<Text>Loading...</Text>}



      >


        <WithLogin />


      </NavigationContainer>
  );
      
}


export default function App() {
  return (
<StoredMediaProvider><Web3Provider><LoginProvider><AudioProvider>
    
    <NativeBaseProvider theme={customTheme}>
      
      
      <WithNav />


      </NativeBaseProvider>

    
  </AudioProvider></LoginProvider></Web3Provider></StoredMediaProvider>
    
  );
}

