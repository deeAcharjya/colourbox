import React, { useEffect, useState } from 'react';

import {
    Button,
    Modal,
    FormControl,
    Input,
    HStack, VStack, TextArea, Image,
    Text, Heading, Spinner, Center,
    Container, Icon, Box, KeyboardAvoidingView
} from "native-base";

import { BandDetailsModel } from '../../generatedTypes/BandDetailsModel';
import { useStoredMedia } from '../media/display';
import { MaterialCommunityIcons } from '@expo/vector-icons';


export default function HeaderView({ details, onEdit }: { 
    details: BandDetailsModel;
    onEdit?: ()=>any;
 }) {
    const {ImageView} = useStoredMedia();

    return <HStack backgroundColor="warmGray.200" 
            h={Styles.allHeight} space={4} alignItems="center"
            pl={{
                base:1,
                md:3
            }}
        >

        <ImageView imageId={details.imageId}
            h={Styles.bandThumbDim} w={Styles.bandThumbDim}
            borderColor="gray.200" borderWidth={1}
            borderRadius={Styles.bandRadius}
        />

        <VStack space={2} p={1} justifyContent="center" flexShrink={1}>
            <Box backgroundColor="gray.700" p={1}  > 
                <Text isTruncated fontSize="lg" fontWeight="bold"  color="white">
                    {details.displayName}
                </Text>
            </Box>

            {details.country && <Box backgroundColor="gray.700" p={1} >
                <Text isTruncated  fontSize="md" color="white">{details.country}</Text>
            </Box>
            }
            
        </VStack>

        {onEdit && <Button size="sm" p={1} onPress={onEdit}
            leftIcon={<Icon as={<MaterialCommunityIcons name="account-edit" />} size="sm" />}
             variant="outline"  position="absolute" right={2} bottom={2}>
            edit
        </Button>}

    </HStack>;

}

const Styles = {
    allHeight: {
        base: 200,
        md: 300
    },
    bandThumbDim: {
        base: 175,
        md: 275
    },
    bandRadius: {
        base: 175 / 2,
        md: 275 / 2
    }


};