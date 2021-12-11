import React from "react";

import {
    createDrawerNavigator,
    
} from '@react-navigation/drawer';



import {
    Text,Image,
    HStack,
    VStack, Flex,
    useColorMode,
    Heading,
    Box, ScrollView,Button
} from "native-base";


import { HomeProps } from './routes';

import ProfileView from '../profile/ProfileScreen';
import BandSignupView from '../band/signupScreen';

import TrackScreen from '../tracks/detailsScreen';

import MyAccount from '../profile/myAccount';

import CustomDrawerContent from './drawerContent';
import BandList from '../band/list';

import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { DrawerParamList } from '../nav/routes';


import LandingPage from '../profile/landingPage';

const Drawer = createDrawerNavigator();

function LogoButton(){
    const navigation = useNavigation<DrawerNavigationProp<DrawerParamList>>();
    const myLogo = require('../../assets/adaptive-icon.png');


    return <Button variant='unstyled' onPress={()=>navigation.navigate('Home',{tab:'picks'})}><HStack alignItems="center">
            <Image h={35} w={35}  source={myLogo} alt="colourbox" resizeMethod='scale' resizeMode='contain' />
            <Text fontWeight="bold" fontSize={15}  >ColourBox</Text>
        </HStack></Button>
}


export function MyDrawer() {

    const { colorMode } = useColorMode();
 


    return (
            
            <Drawer.Navigator initialRouteName="Home" 
                drawerContent={(props) => <CustomDrawerContent {...props} />}

                

                screenOptions={{
                    //headerLeft:()=><Button>hello</Button>
                    headerTintColor:colorMode === 'dark'?'#fff':'#000',
                    //headerLeft :(props)=> <LogoButton/>,

                    headerTitle:()=><LogoButton/>
                    }
                }
            >
                
                <Drawer.Screen name="Home" options={{ title: "ColourBox" }}>
                    {(props:any)=><LandingPage {...props}/>} 
                </Drawer.Screen>

                <Drawer.Screen name="MyAccount" options={{ title: "My Account" }}>
                    {(props:any)=><MyAccount {...props}/>} 
                </Drawer.Screen>
                

                <Drawer.Screen name="BandSignup" options={{ title: "My Account" }} >
                    {(props:any)=><ScrollView flexGrow={1}><BandSignupView {...props}/></ScrollView>} 
                </Drawer.Screen>

                {/*-------- till here screen on menu order is importnat -----------------*/}

                <Drawer.Screen name="Profile">
                    {(props:any)=><ScrollView flexGrow={1}><ProfileView {...props}/></ScrollView>} 
                </Drawer.Screen>

                <Drawer.Screen name="Track">
                    {(props:any)=><TrackScreen {...props}/>} 
                </Drawer.Screen>

            </Drawer.Navigator>
        
    );
}


/*

function TComponent(props:ProfileProps) {
  return (
      <Center>
       <Text mt="12" fontSize="18">This is {props.route.name} page.</Text>
     </Center>
  );
}
*/

function LandingPage_old({ navigation }: HomeProps) {
    return <VStack
        space={5}

        _dark={{ bg: "blueGray.900" }}
        _light={{bg:"blueGray.100"}}
    >

        <Box  >
            <VStack>
                <Heading m={2} size="md" > Picks for you</Heading>
                <BandList onSelect={bandId => navigation.navigate('Profile', { bandId })} />
            </VStack>

        </Box>

    </VStack>;
}


/*
function TestPage() {
    return <VStack
        space={5}

        _dark={{ bg: "blueGray.900" }}
        _light={{ bg: "blueGray.50" }}
        px={4}

        flex={1}

        alignItems="center"
        justifyContent="space-around"

    >


        <ToggleDarkMode />
    </VStack>;
}
*/

