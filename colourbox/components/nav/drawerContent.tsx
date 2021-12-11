import React, { useEffect, useState } from "react";
import { MaterialCommunityIcons } from '@expo/vector-icons';

//icons are at https://materialdesignicons.com/

import {
  DrawerContentScrollView,
  DrawerContentComponentProps
} from '@react-navigation/drawer';

import {
  Text,
  HStack,
  VStack,
  useColorMode,
  Switch,
  Box,
  Pressable,
  Divider,
  Icon,
} from "native-base";

import { useweb3Context, useConnectCalls } from '../web3';

import {ShowAdress} from '../web3/display';

import { useAuthentication } from '../auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

function AMenu(props: {
  name: string; icon: any; selected?: boolean;
  onNavigate: () => any;
}) {

  const { colorMode } = useColorMode();

  const colorMe = colorMode=="dark"?
    (props.selected ?'primary.100' : 'gray.100'):
    (props.selected ?'primary.500' : 'gray.500');

  return <Pressable
    px="5"
    py="3"
    rounded="md"
    bg={
      props.selected
        ? 'rgba(6, 182, 212, 0.1)'
        : 'transparent'
    }
    
    onPress={(event) => props.onNavigate()}>
    
    <HStack space="7" alignItems="center">
      <Icon
        color={colorMe}
        size="5"
        as={props.icon}
      />
      <Text
        fontWeight="500"
        color={colorMe}>
        {props.name}
      </Text>
    </HStack>
  </Pressable>;
}


export default function CustomDrawerContent(props: DrawerContentComponentProps) {

  const { signOut, loginDetails, ensureLogin } = useAuthentication();
  const web3Account = useweb3Context();
  const { connect } = useConnectCalls();

  return (
    <DrawerContentScrollView {...props} >
      <VStack space="6" my="2" mx="1">

        {loginDetails ? <HStack px="4" alignItems="center">
          <Text bold >
            Signed In as
          </Text>
          <Text fontSize="14" mt="1" fontWeight="500" mr={1}>
            {loginDetails?.displayName}
          </Text>
          {loginDetails?.walletAddress && <ShowAdress address={loginDetails?.walletAddress} aType={'address'}  />}
        </HStack> : <AMenu name="Sign in"
          onNavigate={async () => {
            try {
              await ensureLogin();
              props.navigation.closeDrawer();
              //props.navigation.navigate('Home');
            } catch (error) {
              console.warn('login failed ', error);
            }


          }}
          icon={<MaterialCommunityIcons name="account-arrow-left" />}
        />
        }

        {!web3Account &&  <AMenu name="connect to web3" 
              onNavigate={async () => {
                try{
                  await connect("3");
                  props.navigation.closeDrawer();
                }catch{}
              }}
              icon={<MaterialCommunityIcons name="cryengine" />}
        />}


        <VStack divider={<Divider />} space="4">

          <VStack space="3">
            {/* The index is to be picked up from ../screens.tsx -> ROUTE LIST */}
            <AMenu name="Home" selected={0 == props.state.index}
              onNavigate={() => props.navigation.navigate('Home')}
              icon={<MaterialCommunityIcons name="home" />}
            />

          <AMenu name="My Account" selected={1 == props.state.index}
              onNavigate={() => props.navigation.navigate('MyAccount')}
              icon={<MaterialCommunityIcons name="account-cash" />}
            />

          </VStack>

          {/*<VStack space="5">
            <Text fontWeight="500" fontSize="14" px="5" >
              Labels
            </Text>
            <VStack space="3">
              <Pressable px="5" py="3">
                <HStack space="7" alignItems="center">
                  <Icon

                    size="5"
                    as={<MaterialCommunityIcons name="bookmark" />}
                  />
                  <Text fontWeight="500">
                    Family
                  </Text>
                </HStack>
              </Pressable>
              <Pressable px="5" py="2">
                <HStack space="7" alignItems="center">
                  <Icon

                    size="5"
                    as={<MaterialCommunityIcons name="bookmark" />}
                  />
                  <Text fontWeight="500">
                    Friends
                  </Text>
                </HStack>
              </Pressable>
              <Pressable px="5" py="3">
                <HStack space="7" alignItems="center">
                  <Icon

                    size="5"
                    as={<MaterialCommunityIcons name="bookmark" />}
                  />
                  <Text fontWeight="500" >
                    Work
                  </Text>
                </HStack>
              </Pressable>
            </VStack>

            

      </VStack>*/}

          <ToggleDarkMode />

          {loginDetails && <VStack space="3">
            <AMenu name="Sign out"
              onNavigate={() => {
                signOut();
                props.navigation.navigate('Home');
                props.navigation.closeDrawer();
              }}
              icon={<MaterialCommunityIcons name="account-arrow-right-outline" />}
            />
          </VStack>
          }

        </VStack>
      </VStack>
    </DrawerContentScrollView>
  );
}

const COLOR_MODE_KEY = "myColorMode";

// Color Switch Component
function ToggleDarkMode() {
  const { colorMode, toggleColorMode } = useColorMode();

  useEffect(() => {

    (async () => {

      const value = ((await AsyncStorage.getItem(COLOR_MODE_KEY)) || 'dark') as any;

      if (value != colorMode) {
        toggleColorMode();
      }

    })();

  }, []);

  return (
    <HStack space={2} px={2} alignItems="center" justifyContent="center" flexGrow={1} >
      <Text>Dark</Text>
      <Switch
        isChecked={colorMode === "light" ? true : false}
        onToggle={() => {

          toggleColorMode();

          let newMode = 'light';
          if (newMode == colorMode) {
            newMode = 'dark';
          }

          AsyncStorage.setItem(COLOR_MODE_KEY, newMode);


        }}
        aria-label={
          colorMode === "light" ? "switch to dark mode" : "switch to light mode"
        }
      />
      <Text>Light</Text>
    </HStack>
  );
}
