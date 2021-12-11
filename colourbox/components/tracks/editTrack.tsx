import React, { useState, useEffect } from 'react';

import {
    Button,
    Modal,
    FormControl,
    Input,
    HStack, VStack, TextArea, Image,
    Text, Spinner, Center,
    Wrap, Icon, Box, KeyboardAvoidingView
} from "native-base";

import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ShowError, IAsyncResult, fetchJsonAsync, connectTo } from '../utils';

import { useMediaUploader } from '../media/upload';
import { TrackDetailsModel } from '../../generatedTypes/TrackDetailsModel';
import { StoredTrackModel } from '../../generatedTypes/StoredTrackModel';
import {TrackDisplayModel} from '../../generatedTypes/TrackDisplayModel';
import { useAuthentication } from '../auth';

export default function EditTrack({ bandId, trackId, onCancel, onDone }: {
    trackId?: string; //if undefined we want to upload a new Track    
    bandId: string;
    onCancel: () => any;
    onDone: () => any;
}) {

    const [submitted, setSubmitted] = useState<IAsyncResult<boolean>>();

    const [displayDetails,setDisplayDetails] = useState<TrackDisplayModel>();

    //we use the details to track loading 
    const [trackDetails, setTrackDetails] = useState<IAsyncResult<TrackDetailsModel>>();

    

    const { mediaUri: trackUri, pickMedia: pickTrack, upLoadMedia: upLoadTrack, UpLoadProgress }
        = useMediaUploader({ type: 'audio', bandId });

    const { mediaUri: image, pickMedia: pickImage, upLoadMedia: upLoadImage }
        = useMediaUploader({ type: 'image', aspect: [1, 1] });

    const { ensureLogin } = useAuthentication();


    useEffect(() => {

        //we are loading a new Track
        (async () => {
            try {

                setTrackDetails({ isLoading: true });

                if (!trackId) {

                    const newTrack = await pickTrack();

                    if (!newTrack) {
                        //user cancelled
                        throw new Error('user cancelled');
                    }
                    
                    setTrackDetails({result:{displayName: '', tags: [] }});

                } else {
                    
                    const display = await fetchJsonAsync<TrackDisplayModel>(
                        fetch(`${connectTo.dataSvr}/api/tracks/details/${encodeURIComponent(trackId)}`));

                        setDisplayDetails(display);
                        setTrackDetails({ result:display.track.details });
                }


            } catch (error: any) {
                setTrackDetails({ error });
                onCancel();
            }
        })();

    }, [trackId]);

    if (trackDetails?.isLoading) {
        return <Center><Spinner /></Center>;
    }

    if (trackDetails?.error|| !trackDetails?.result) {
        return <Center><ShowError error={trackDetails?.error||new Error('track not loaded')}/></Center>;
    }


    return <Modal isOpen={true} size="full" onClose={() => onCancel()}>

        <Modal.Content >
            <Modal.CloseButton />
            <Modal.Header>{trackId ? 'Edit your Track' : 'Upload new Track'}</Modal.Header>

            <Modal.Body><KeyboardAvoidingView>
                <Wrap direction="row" justify="center" space={4}>

                    <Box borderColor="gray.500" borderWidth={2}
                        w={275} h={275}
                        borderRadius={275 / 2}
                    >
                        <Center>

                            {image ? <Image
                                source={{
                                    uri: image,
                                }}
                                alt="track image"
                                w={275} h={275}
                                borderRadius={275 / 2}
                                resizeMethod="scale"
                            /> :
                                <Icon
                                    color="gray.500"
                                    size="250"
                                    as={<MaterialCommunityIcons name="music" />}
                                />
                            }


                        </Center>

                        <Box position="absolute" bottom={4} w="100%"><Center>
                            <Button
                                size="xs" py={1}
                                variant="outline" colorScheme="blueGray"

                                leftIcon={<Icon as={<MaterialCommunityIcons name="camera" />} size="sm" />}

                                onPress={() => pickImage()}
                            >

                                Update image
                            </Button>
                        </Center></Box>
                    </Box>

                    <Box w="100%" maxW="600"><VStack space={3} w="100%" >


                            {displayDetails?<Image w="100%" source={{uri:displayDetails.lightWaveForm}}/>:<UpLoadProgress />  }
                        

                        <FormControl isRequired isInvalid={!trackDetails?.result?.displayName}>

                            <FormControl.Label>Display name</FormControl.Label>
                            <Input p={2} mt={1} value={trackDetails?.result.displayName || ''} autoFocus
                                onChangeText={displayName => trackDetails.result && setTrackDetails({result:{ ...trackDetails.result, displayName }})}
                            />
                            {/*<FormControl.HelperText mt={1}>
                                We'll keep this between us.
                            </FormControl.HelperText>
                            */}
                            <FormControl.ErrorMessage mt={1}>
                                Display name is required
                            </FormControl.ErrorMessage>

                        </FormControl>




                        <FormControl >

                            <FormControl.Label>description</FormControl.Label>
                            <TextArea h={20} p={2} mt={1} value={trackDetails?.result?.description || ''}
                                onChangeText={description => trackDetails.result && setTrackDetails({result:{ ...trackDetails.result, description }})}
                            />

                        </FormControl>


                    </VStack></Box>

                </Wrap>

            </KeyboardAvoidingView>
            </Modal.Body>

            <Modal.Footer>
                <VStack space={1}>
                    {submitted?.error ? <ShowError error={submitted.error} /> : <Box />}

                    <Button.Group space={2}>

                        {submitted?.isLoading ? <HStack alignItems="center">
                            <Spinner color="primary.600" />
                            <Text color="primary.600">Saving changes</Text>
                        </HStack> : <Box />
                        }

                        <Button
                            isDisabled={submitted?.isLoading}
                            variant="ghost"
                            colorScheme="blueGray"
                            onPress={() => onCancel()}
                        >
                            Cancel
                        </Button>

                        <Button
                            isDisabled={submitted?.isLoading || !trackDetails?.result?.displayName}
                            colorScheme="primary"
                            size="lg"

                            onPress={async () => {

                                try {
                                    setSubmitted({ isLoading: true });

                                    const detailsToSave = { ...trackDetails?.result };
                                    if (!detailsToSave.displayName)
                                        return;

                                    const creds = await ensureLogin();


                                    const uploadedTrackId = (!!trackId) ? trackId : await upLoadTrack();

                                    try {
                                        
                                        if (image) {
                                            detailsToSave.imageId = await upLoadImage();
                                        }

                                        const updatedTrack = await fetchJsonAsync<StoredTrackModel>(
                                            fetch(`${connectTo.dataSvr}/api/tracks/details/${encodeURIComponent(uploadedTrackId)}`, {
                                                method: 'post',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    'Authorization': 'Bearer ' + creds.jwt
                                                },
                                                body: JSON.stringify(detailsToSave)
                                            }));


                                    } catch (error) {
                                        console.error('track uploaded but failed to upload details', error);
                                        //todo: show this
                                    }

                                    setSubmitted({ result: true });

                                    onDone();
                                } catch (error: any) {
                                    setSubmitted({ error });
                                }

                            }}
                        >
                            Save changes
                        </Button>

                    </Button.Group>

                </VStack>
            </Modal.Footer>

        </Modal.Content>

    </Modal>;





}


