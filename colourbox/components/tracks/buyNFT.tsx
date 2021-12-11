import React, { useState } from 'react';

import { TrackDisplayModel } from '../../generatedTypes/TrackDisplayModel';
import {
    Button,
    Modal,
    FormControl,
    Input,
    HStack, VStack, TextArea, Image,Divider,
    Text, Spinner, Center,
    Wrap, Icon, Box, KeyboardAvoidingView
} from "native-base";

import { TrackDisplay } from '../player/trackDisplay';



export function useBuyNFT(track: TrackDisplayModel) {

    const [showBuy, setShowBuy] = useState<'buy' | 'bid' | undefined>();

    function BuyDialog() {

        if (!showBuy) {
            return null;
        }

        return <Modal isOpen={true} size="full"  
            onClose={() => setShowBuy(undefined)}>

            <Modal.Content style={{
                marginTop:"5%",
                marginBottom:"auto",
                maxWidth:800,
                minHeight:"90%"
            
            }} >
                <Modal.CloseButton />
                <Modal.Header>{'buy' == showBuy ? 'Buy a slice' : 'Bid on a slice'}</Modal.Header>

                <Modal.Body ><KeyboardAvoidingView>

                    <VStack flexGrow={1} space={3}>
                        <TrackDisplay {...{ track }} />
                        <Divider/>
                    </VStack>

                </KeyboardAvoidingView></Modal.Body>

            </Modal.Content>
        </Modal>;
    }

    return {
        BuyDialog,
        buy:()=>setShowBuy('buy'),
        bid:()=>setShowBuy('bid')
    }
}