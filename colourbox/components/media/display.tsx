import React, { useState, useEffect } from 'react';

import {
    Spinner, Text, Image, usePropsResolution, Center, Icon, useColorMode
} from 'native-base';

import { ShowError, IAsyncResult, fetchJsonAsync, connectTo } from '../utils';
import { useDebouncedCallback } from 'use-debounce';
import constate from 'constate';

import { IImageProps } from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { MediaDisplayModel } from '../../generatedTypes/MediaDisplayModel';
import { useColorScheme } from 'react-native';

export const [StoredMediaProvider, useStoredMedia] = constate(
    useImages,
    v => v.storedView,
);

function useImages() {
    const [mediaPaths, setMediaPaths] = useState<{ [imageId: string]: MediaDisplayModel | undefined }>({});


    const loadMedia = useDebouncedCallback(
        // function
        async () => {

            const needsPaths = Object.keys(mediaPaths).filter(k => !mediaPaths[k]);

            try {

                console.debug('loading images');

                const allPaths = await fetchJsonAsync<{ [imageId: string]: MediaDisplayModel }>(
                    fetch(`${connectTo.dataSvr}/api/images/publicPaths`, {
                        method: 'post',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(needsPaths)
                    }));

                setMediaPaths({ ...mediaPaths, ...allPaths });

            } catch (error) {
                console.error('failed to load media', error);
            }


        },
        // delay in ms
        1000
    );

    function useMediaDisplay(imageId?: string) {

        useEffect(() => {

            if (!imageId)
                return;

            const exsting = { ...mediaPaths };

            if (!Object.keys(exsting).includes(imageId)) {
                exsting[imageId] = undefined;
                setMediaPaths(exsting);
                loadMedia();
            } else {
                console.debug('imageId exists');
            }

        }, [imageId]);

        return imageId && mediaPaths[imageId];
    }

    function TrackView(props: {
        imageId?: string;
    }) {

        const { imageId, ...otherProps } = props;

        const imagePath = useMediaDisplay(imageId);

        if (imagePath) {
            return <Text>{imagePath}</Text>;
        }

        return <Center>
            {imageId ? <Spinner /> : <Text color="gray.200">no track</Text>}
        </Center>;

    }


    function ImageView(props: IImageProps & {
        imageId?: string;
    }) {

        const { imageId, ...otherProps } = props;

        const { colorMode } = useColorMode();

        const imagePath = useMediaDisplay(imageId);

        if (imagePath) {
            return <Image
                source={{
                    uri: imagePath.publicPath,
                }}
                alt="band image"

                resizeMethod="scale"

                {...otherProps}
            />;
        }

        return <Center
            w={otherProps.w} h={otherProps.h}
            borderColor={colorMode === "dark"?'gray.700':"gray.300"}
            borderWidth={1}
            borderRadius={otherProps.borderRadius}
        >
            {imageId ? <Spinner /> :  <Icon
                                    color="gray.500"
                                    size={otherProps.borderRadius}
                                    as={<MaterialCommunityIcons name="music-accidental-natural" />}
                                />}
        </Center>;

    }

    return { storedView: { ImageView, TrackView } };
}