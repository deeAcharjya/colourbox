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
import { BandDetailsModel } from '../../generatedTypes/BandDetailsModel';
import { BandModel } from '../../generatedTypes/BandModel';
import { useAuthentication } from '../auth';

export default function EditProfile({onCancel,onDone,band}:{
    onCancel:()=>any;
    onDone:()=>any;
    band?:BandModel;
}) {

    const [submitted, setSubmitted] = useState<IAsyncResult<boolean>>();

    const [details, setDetails] = useState<BandDetailsModel>({ displayName: '' });

    const { mediaUri: image, pickMedia: pickImage, upLoadMedia: upLoadImage } 
                    = useMediaUploader({type:'image', aspect:[1, 1]});

    const {ensureLogin} = useAuthentication();

    useEffect(()=>{
        if(band){
            setDetails({...band.details});
        }
    },[band]);

    return <Modal isOpen={true} size="full" onClose={() => onCancel()}>

        <Modal.Content >
            <Modal.CloseButton />
            <Modal.Header>Edit your Profile</Modal.Header>

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
                                alt="band image"
                                w={275} h={275}
                                borderRadius={275 / 2}
                                resizeMethod="scale"
                            /> :
                                <Icon
                                    color="gray.500"
                                    size="250"
                                    as={<MaterialCommunityIcons name="account-cowboy-hat" />}
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


                        <FormControl isRequired isInvalid={!details?.displayName}>

                            <FormControl.Label>Display name</FormControl.Label>
                            <Input p={2} mt={1} value={details?.displayName || ''} autoFocus
                                onChangeText={displayName=>setDetails({ ...details, displayName })}
                            />
                            {/*<FormControl.HelperText mt={1}>
                                We'll keep this between us.
                            </FormControl.HelperText>
                            */}
                            <FormControl.ErrorMessage mt={1}>
                                Display name is required
                            </FormControl.ErrorMessage>

                        </FormControl>


                        <Wrap direction="row" space={2} justifyContent="space-between">

                            <FormControl maxW="275">

                                <FormControl.Label>First name</FormControl.Label>
                                <Input p={2} mt={1} value={details?.firstName || ''}
                                    onChangeText={firstName=>setDetails({ ...details, firstName })}
                                />

                            </FormControl>

                            <FormControl maxW="275">

                                <FormControl.Label>Last name</FormControl.Label>
                                <Input p={2} mt={1} value={details?.lastName || ''}
                                    onChangeText={lastName=>setDetails({ ...details, lastName })}
                                />

                            </FormControl>
                        </Wrap>


                        <Wrap direction="row" space={2} justifyContent="space-between">

                            <FormControl maxW="275">

                                <FormControl.Label>City</FormControl.Label>
                                <Input p={2} mt={1} value={details?.city || ''}
                                    onChangeText={city=>setDetails({ ...details, city })}
                                />

                            </FormControl>

                            <FormControl maxW="275">

                                <FormControl.Label>Country</FormControl.Label>
                                <Input p={2} mt={1} value={details?.country || ''}
                                    onChangeText={country=>setDetails({ ...details, country })}
                                />

                            </FormControl>
                        </Wrap>

                        <FormControl >

                            <FormControl.Label>Bio</FormControl.Label>
                            <TextArea h={20} p={2} mt={1} value={details?.bio || ''}
                                onChangeText={bio=>setDetails({ ...details, bio })}
                            />

                        </FormControl>


                    </VStack></Box>

                </Wrap>

                </KeyboardAvoidingView>
            </Modal.Body>

            <Modal.Footer>
                <VStack space={1}>
                    {submitted?.error?<ShowError error={submitted.error}/>:<Box/>}

                    <Button.Group space={2}>

                        {submitted?.isLoading ? <HStack alignItems="center">
                            <Spinner color="primary.600" />
                            <Text color="primary.600">Saving changes</Text>
                        </HStack> : <Box />
                        }

                        <Button
                            isDisabled={submitted?.isLoading }
                            variant="ghost"
                            colorScheme="blueGray"
                            onPress={() => onCancel()}
                        >
                            Cancel
                        </Button>

                        <Button
                            isDisabled={submitted?.isLoading || !details?.displayName}
                            colorScheme="primary"
                            size="lg"

                            onPress={async () => {

                                try {
                                    setSubmitted({ isLoading: true });

                                    const bandDetails = {...details};
                                    if(!bandDetails.displayName)
                                        return;

                                    const creds = await ensureLogin();

                                    if(image){
                                        bandDetails.imageId = await upLoadImage();
                                    }


                                    const updatedBand = await fetchJsonAsync<BandModel>(
                                        fetch(`${connectTo.dataSvr}/api/bands/${encodeURIComponent(band?.id||'new')}`, {
                                            method: 'post',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': 'Bearer ' + creds.jwt
                                            },
                                            body: JSON.stringify(bandDetails)
                                    }));

                                    console.debug(`band updated id = ${updatedBand.id}`);

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