import React, { useState, useEffect } from 'react';

import {
    Button,
    Modal,Heading,
    useBreakpointValue,    FormControl, Switch,
    Input,Flex, useColorMode,
    HStack, VStack, TextArea, Image,
    Text, Spinner, Center,
    Wrap, Icon, Box
} from "native-base";

import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ShowError, IAsyncResult, fetchJsonAsync, connectTo } from '../utils';
import { useMediaUploader } from '../media/upload';
import { BandDetailsModel } from '../../generatedTypes/BandDetailsModel';
import { BandModel } from '../../generatedTypes/BandModel';
import { useAuthentication } from '../auth';

export default function NeedCustodial({onCancel,onOk}:{
    onCancel:()=>any;
    onOk:(v:boolean)=>any;
}) {

    const [needsCustodial, setNeedsCustodial] = useState(false);
    const {colorMode} = useColorMode();


    const formDirection = useBreakpointValue({
        base: 'column',
        md: 'row'
    });

    const mutedColor = colorMode==="dark"?"muted.400":"muted.300";

    const mywalletColor = needsCustodial?mutedColor:undefined;
    const needsCutColor =  needsCustodial?undefined:mutedColor;

    return <Modal isOpen={true} size="full" onClose={onCancel}>

        <Modal.Content minH={400}>
            <Modal.CloseButton />
            <Modal.Header>Where do you want to store your NFTs</Modal.Header>

            <Modal.Body>

                <Flex direction={formDirection} maxW={1000} alignSelf="center"
                    alignItems={formDirection=="row"?undefined:"stretch"} >

                    <Box w={{
                        base:undefined,
                        md:"35%"
                    }}><VStack space={2} w="100%" alignItems="center" justifyContent="center" >
                        <Heading color={mywalletColor} textAlign="center">I have a crypto wallet</Heading>
                        <Text color={mywalletColor} textAlign="center">Mint and deposit my NFTs to my wallet</Text>
                        <Text color={mywalletColor}  textAlign="center">I understand that if I loose access to my wallet, I loose my NFTs</Text>
                    </VStack></Box>


                    
                    <Center flexGrow={1}>
                        <Switch my={3} 

                        value={needsCustodial}

                        offTrackColor={colorMode==="dark"?"tertiary.700":"tertiary.100"}

                        onTrackColor={colorMode==="dark"?"primary.700":"primary.100"}


                        offThumbColor={colorMode==="dark"?"tertiary.400":"tertiary.500"} 
                        onThumbColor={colorMode==="dark"?"primary.400":"primary.500"}

                        isChecked={needsCustodial}
                        onToggle={() => {
                            setNeedsCustodial(!needsCustodial);

                        }}
                    />
                    </Center>


                    <Box w={{
                        base:undefined,
                        md:"35%"
                    }}><VStack space={2} w="100%" alignItems="center" justifyContent="center">
                        <Heading color={needsCutColor} textAlign="center">Can you manage my wallet for now</Heading>
                        <Text color={needsCutColor}  textAlign="center">Once I get my own wallet setup</Text>
                        <Text color={needsCutColor}  textAlign="center">I will transfer my NFTs to my own wallet</Text>
                    </VStack></Box>

                </Flex>


            </Modal.Body>

            <Modal.Footer justifyContent="center">

                <Button colorScheme="warning" variant="outline" m={6} onPress={onCancel}>
                    Cancel
                </Button>

                <Button colorScheme="primary" onPress={()=>onOk(needsCustodial)}
                    flexGrow={1} maxW={400} m={2} p={4}
                >
                    Mint my NFTs !!!
                </Button>

            </Modal.Footer>

        </Modal.Content>

    </Modal>;
}