import React, { useEffect, useState, Fragment } from 'react';
import { ShowError, IAsyncResult, fetchJsonAsync, connectTo } from '../utils';

import { TrackDisplayModel } from '../../generatedTypes/TrackDisplayModel';

import EditTrack from './editTrack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useNavigation } from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {DrawerParamList} from '../nav/routes';

import { useStoredMedia } from '../media/display';



import {
    Center, HStack, Icon,
    Spinner, Text, Wrap, Button,
    Pressable, Box, VStack
} from 'native-base';

import {TrackDisplay} from '../player/trackDisplay';


export default function TracksList({ bandId, isAdmin }: {
    bandId: string;
    isAdmin?: boolean;
}) {

    const [showEdit, setShowEdit] = useState<string>();
    const [tracks, setTracks] = useState<IAsyncResult<TrackDisplayModel[]>>();

    const navigation = useNavigation<DrawerNavigationProp<DrawerParamList>>();

    const { ImageView } = useStoredMedia();

   

    async function loadTracks() {
        try {
            setTracks({ isLoading: true });
            const result = await fetchJsonAsync<TrackDisplayModel[]>(
                fetch(`${connectTo.dataSvr}/api/tracks/search/${encodeURIComponent(bandId)}`));
            setTracks({ result });
        } catch (error: any) {
            setTracks({ error });
        }
    }

    useEffect(() => {
        loadTracks();
    }, [bandId]);

    if (tracks?.error) return <Center><ShowError error={tracks.error} /></Center>;

    if (tracks?.isLoading) return <Center><Spinner /></Center>;

    if (!tracks?.result) return <Text>no tracks</Text>;

    

    return <VStack space={1}  my={2}
        alignItems={tracks.result.length == 0 ? "center" : "stretch"}  p={1}>

        {isAdmin && <Fragment>

            {showEdit && < EditTrack
                trackId={showEdit=='new'?undefined:showEdit}
                onDone={() => {
                    setShowEdit(undefined);
                    loadTracks();
                }} onCancel={() => setShowEdit(undefined)}
                {...{ bandId }}
            />}

            {tracks.result.length == 0 && <Text textAlign="center" color="cyan.600" fontSize="lg" mt={4} >
                It's great having you here. Go ahead upload your first track
            </Text>
            }

            <Button variant="outline" colorScheme="cyan"
                w={tracks.result.length == 0 ? "100%" : undefined}
                p={tracks.result.length == 0 ? 4 : undefined}
                size={tracks.result.length == 0 ? "lg" : "sm"}
                maxW={400} m={4}

                onPress={async () => {

                    //we have issues with browser not sending the cancel event so
                    if (showEdit) {
                        setShowEdit(undefined);
                        await new Promise(r => setTimeout(r, 100));
                    }

                    setShowEdit('new');
                }} >

                Add new Track
            </Button>


        </Fragment>
        }

        {tracks.result.map(t => <HStack space={1} key={t.track.id} alignItems="flex-end" >

                <Button variant="unstyled"
                    onPress={()=>navigation.navigate('Track',{trackId:t.track.id})}>

                    <ImageView imageId={t.track.details?.imageId}
                        h={45} w={45}
                        borderWidth={1}
                        borderRadius={45/2}
                    />
                </Button>

                <TrackDisplay track={t} 
                    afterPlay={()=> navigation.navigate('Track', { trackId: t.track.id })}/>

                {isAdmin && <Button 
                    position="absolute"
                    right={1}
                    top={1} p={0}
                    variant="link" onPress={()=>tracks.result && setShowEdit(t.track.id)}

                    endIcon={<Icon as={<MaterialCommunityIcons name="movie-edit-outline" />} color="cyan.400" size="xs" />}>
                </Button>
                }


            
        </HStack>)
        }



    </VStack>;
}