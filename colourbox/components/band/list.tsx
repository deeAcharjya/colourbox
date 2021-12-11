import React, { useEffect, useState } from 'react';
import { BandModel } from '../../generatedTypes/BandModel';
import { ShowError, IAsyncResult, fetchJsonAsync, connectTo } from '../utils';

import { Center, HStack, Spinner, Text, Wrap, 
    Pressable, Box,Button , ScrollView, VStack
} from 'native-base';

import { useStoredMedia } from '../media/display';
import { useAuthentication } from '../auth';

import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { DrawerParamList } from '../nav/routes';


export default function bandList({onSelect,mine}:{
    onSelect?:(bandId:string)=>any;
    mine?:boolean;
}) {

    const [bands, setBands] = useState<IAsyncResult<BandModel[]>>();
    const {ImageView} = useStoredMedia();
    const { loginDetails} = useAuthentication();
    const navigation = useNavigation<DrawerNavigationProp<DrawerParamList>>();

    useEffect(() => {
        async function loadBands() {
            try {
                setBands({ isLoading: true });

                let q = '';
                if(mine){
                    
                    if(!loginDetails?.userId){
                        throw new Error('userId not set');
                    }
                    q = `?byAdmin=${encodeURIComponent(loginDetails?.userId)}`
                }

                const result = await fetchJsonAsync<BandModel[]>(fetch(`${connectTo.dataSvr}/api/bands${q}`));
                setBands({ result });

            } catch (error: any) {
                setBands({ error });
            }
        }

        loadBands();
    }, [mine, loginDetails]);

    


    if (bands?.isLoading) {

        return <Center>
            <HStack alignItems="center">
                <Spinner color="cyan.300" /> 
                <Text color="cyan.300">Loading bands ...</Text>
            </HStack>
        </Center>
    }

    

    if (bands?.error) {
        return <Center><ShowError error={bands.error} /></Center>;
    }

    if(bands?.result?.length == 0){
        return <Center><ShowError error={new Error("We didn't find anything matching")} /></Center>;
    }

    //return <Text>till here</Text>    

    return <ScrollView horizontal={false}  mb={150}> 
    <Wrap direction="row" space={5} justify="center">
        {(bands?.result || []).map(b => <Button key={b.id} 
            variant="unstyled"
            onPress={()=>{

                if(onSelect){
                    onSelect(b.id)
                }else{
                    navigation.navigate('Profile', { bandId:b.id });
                }
                
            }}>
            <Center>
                <ImageView imageId={b.details.imageId}
                    h={Styles.bandThumbDim} w={Styles.bandThumbDim} 
                    borderColor="gray.200" borderWidth={1}
                    borderRadius={Styles.bandRadius}
                />
                <Text isTruncated maxW={Styles.bandThumbDim}
                    fontSize="lg" letterSpacing="md">
                    {b.details?.displayName}
                </Text>
            </Center>
        </Button>
        )}

    </Wrap>
    </ScrollView>;

}

const Styles = {
    bandThumbDim: {
        base: 125,
        md: 275
    },
    bandRadius:{
        base:125/2,
        md:275/2
    }


};