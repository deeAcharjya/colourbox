import React, { useState, useMemo, FC, Fragment,useEffect, useRef } from 'react';
import { LayoutRectangle } from 'react-native';

import {
    Image, Box, VStack, Button, HStack,
    Text, ScrollView, Icon, Spinner, Slider, useColorMode
} from 'native-base';

import { MaterialCommunityIcons } from '@expo/vector-icons';

import Sliderbar from './sliderbar';

import { TrackDisplayModel } from '../../generatedTypes/TrackDisplayModel';

import { useDebouncedCallback } from 'use-debounce';

import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { DrawerParamList } from '../nav/routes';

import { useAudioContext, NFTSlice, milisecToPixels, 
    usePlayControls, usePlayingContext,
    useBuyingContext
 } from './index';

import { useNFTSlices } from '../nft/loadNft';
import { ShowError } from '../utils';
import { display } from 'styled-system';
import { SliceActions } from '../nav/routes';


export function TrackDisplay({ track, height, afterPlay, allowSlicing }: {
    track: TrackDisplayModel;
    height?: number;
    allowSlicing?:boolean;
    afterPlay?: () => any;
}) {

    /** dee we cannot use navgation here as this could be loaded in a modal */
    //const navigation = useNavigation<DrawerNavigationProp<DrawerParamList>>();

    const nftSlices = useNFTSlices(track.track);

    const { loadedTrack, trackIsPlaying } = useAudioContext();
    const { playTrack, pause, play,selectSlice } = usePlayControls();


    const isSelectedForPlay = loadedTrack?.track.track.id == track.track.id;

    height = height || 40;

    const btnDim = (height - 5);
    const btnIcnDmn = (height - 30);

    let primaryFunction = {
        icon: <MaterialCommunityIcons name="play" size={btnIcnDmn} />,
        text: 'play',
        action: async () => {
            playTrack(track);

            if (afterPlay) {
                afterPlay();
            }
            //navigation.navigate('Track', { trackId: track.track.id });
        }
    };

    if (isSelectedForPlay) {


        if (trackIsPlaying) {
            primaryFunction = {
                icon: <MaterialCommunityIcons name="pause" size={btnIcnDmn} />,
                text: 'pause',
                action: async () => await pause()
            };
        } else {

            primaryFunction = {
                icon: <MaterialCommunityIcons name="play-circle-outline" size={btnIcnDmn} />,
                text: 'again',
                action: async () => await play()
            };

        }
    }

    console.debug(`TrackDisplay is rendering trackIsPlaying: ${trackIsPlaying} isSelectedForPlay: ${isSelectedForPlay}`);

    return <VStack flexGrow={1} p={1}  >
        <HStack>

            <Text>{track.track.details?.displayName || 'unknown track'}</Text>

            <Text> {track.duration} </Text>

            {nftSlices?.isLoading && <Spinner size="sm" />}

            {nftSlices?.error && <ShowError error={nftSlices.error} />}

            {/*isSelectedForPlay && <Text>{soundPos}</Text>*/}

        </HStack>

        <HStack space={2} alignItems="center">

            <Button
                colorScheme="primary" variant="solid"
                w={btnDim} h={btnDim}
                leftIcon={<Icon color="primary.800" backgroundColor="primary.100" as={primaryFunction.icon} />}
                onPress={primaryFunction.action}
            />


            <ChooseSlice {...{height,track, allowSlicing}} >
                <WavViewer isPlaying={isSelectedForPlay}
                    {...{ display: track, height, slices: nftSlices?.result }}
                />

            </ChooseSlice>

        </HStack>

    </VStack>;



}

const ChooseSlice: FC<{
    allowSlicing?:boolean;
    height: number;
    track: TrackDisplayModel;
}> = ({ children, height, track, allowSlicing }) => {

    const {colorMode} = useColorMode();
    const [leftV,setLeftV] = useState(0);
    const [rightV,setRightV] = useState(1);
    const [dimentions, setDimeniions] = useState<LayoutRectangle>();

    const { selectedSlice } = useBuyingContext();
    const {selectSlice} = usePlayControls();

    const setSlice = useDebouncedCallback(() =>{
        const newSlice = sliceFromSliders();

        if(selectedSlice && newSlice){
            selectSlice({...selectedSlice,slice:newSlice});
        }
            
    },1000);


    useEffect(()=>{

        if(!selectedSlice || !allowSlicing)
            return;
        
        const newSlice = sliceFromSliders();

        if(selectedSlice.slice.begin !=  (newSlice?.begin||0)){
            setLeftV(selectedSlice.slice.begin/(0.1*track.durationinSec))
        }

        if(selectedSlice.slice.end != (newSlice?.end||0)){
            setRightV(selectedSlice.slice.end/(0.1*track.durationinSec))
        }

    },[selectedSlice,track,allowSlicing]);
    
    if (!selectedSlice || !allowSlicing) {
        return <Fragment>{children}</Fragment>;
    }

    function sliceFromSliders(){
        if(isNaN(leftV) || isNaN(rightV))
            return undefined;

        return {
            begin: Math.floor(0.1*track.durationinSec*leftV),
            end: Math.ceil( 0.1*track.durationinSec*rightV)
        };
    }

    const trackColor = "dark"==colorMode?"emerald.800":"emerald.200";
    const thumbColor = "dark"==colorMode?"emerald.400":"emerald.600";

    return <VStack flexGrow={1} minH={(height + 35) + 'px'}>

        
        <Slider w={'100%'} colorScheme="emerald"
            
            value={leftV} onChange={v=>{

                if(v>=rightV)
                    return;

                setLeftV(v);
                setSlice();
            }}

            
            
            minValue={0}
            maxValue={100}

            accessibilityLabel="left position"
            step={1}
        >
            <Slider.Track bg={trackColor}>
                <Slider.FilledTrack bg={trackColor}/>
            </Slider.Track>
            <Slider.Thumb borderWidth="0" bg="transparent">
                <Icon as={<MaterialCommunityIcons name="flag-triangle"   />}  
                    
                    color={thumbColor} size="sm" />
            </Slider.Thumb>

        </Slider>

        <Box h={height + 'px'} onLayout={e => {
                    if (!!dimentions) {
                        console.debug('layout aready called');
                        return;
                    }

                    console.debug(`setting select width ${e.nativeEvent.layout.width}`);
                    setDimeniions(e.nativeEvent.layout);
                }}>


            {children}

        </Box>

        <Slider w={'100%'} colorScheme="emerald"
            value={rightV} onChange={v=>{

                if(v<=leftV)
                    return;

                setRightV(v);
                setSlice();
            }}

            minValue={0}
            maxValue={100}
            accessibilityLabel="right postion"
            step={1}
        >
            <Slider.Track bg={trackColor}>
                <Slider.FilledTrack bg={trackColor}/>
            </Slider.Track>
            <Slider.Thumb borderWidth="0" bg="transparent">
                <Icon as={<MaterialCommunityIcons name="flag-triangle"   />}  
                    style={{transform:[{ rotateY: '180deg'}]}}
                    color={thumbColor} size="sm" />
            </Slider.Thumb>

        </Slider>

        <Box position="absolute" bgColor="yellow.500" opacity="0.3" h={ (height + 14) + 'px'} top={18 + 'px'} 
            
            left={dimentions?.width && 0.01*dimentions?.width*leftV }

            width={dimentions?.width && 0.01*dimentions?.width*(rightV-leftV) } 
        />

    </VStack>;

}




function WavViewer({ display, isPlaying, height, slices }: {
    //currentPosInPixels: number;
    display: TrackDisplayModel;
    isPlaying?: boolean;
    height?: number;
    slices?: NFTSlice[];
}) {

    const [dimentions, setDimeniions] = useState<LayoutRectangle>();

    //const prevPos = useRef<number>();
    //const scrollRef = useRef<ScrollView | null>(null);

    const [scrollPos, setScrollPos] = useState<number>(0);

    const { soundPosInPixels: currentPosInPixels } = usePlayingContext();

    /*

useEffect(() => {

    if (!!dimentions) {
        const half = scrollWidth / 2;

        if (currentPos > half) {
            scrollRef.current?.scrollTo({ x: (currentPos - half) });
        }
    }

    if (prevPos.current) {
        const diff = currentPos - prevPos.current;
        console.debug(`dif = ${diff}`);
        if (diff > 0) {

            //scrollRef.current.
            const newScrollPos= scrollPos+diff;


            scrollRef.current?.scrollTo({x:newScrollPos, animated:true});
        }
    }

    //prevPos.current = currentPos;


}, [currentPosInPixels]);
*/

    const zoomToFit = true;

    const scrollWidth = dimentions?.width || 500;

    let zoom = 1.0;
    let imgWidth = display.track.calculatedDetails?.waveFormWidth || 0;

    if (dimentions?.width) {
        imgWidth = scrollWidth;
        zoom = (display.track.calculatedDetails?.waveFormWidth || 0) / scrollWidth;
    }

    const zoomedCurrentPos = currentPosInPixels / zoom;

    const WaveFormImage = useMemo(() => <Image
        alt={display.track.details?.displayName}
        source={{ uri: display.lightWaveForm }}

        width={imgWidth + 'px'}

        height={(height || 45) + 'px'}
    />, [display.lightWaveForm, imgWidth, height]);

    //console.debug('WavViewer is rendering');

    return <Box alignSelf='stretch' flex={1} onLayout={e => {


        if (!!dimentions) {
            console.debug('layout aready called');
            return;
        }

        console.debug(`setting dimentions w=${e.nativeEvent.layout.width}`);

        setDimeniions(e.nativeEvent.layout);
    }}>
        <ScrollView
            w={dimentions?.width}

            horizontal={true} showsHorizontalScrollIndicator={false}

            scrollEnabled={true}

            pinchGestureEnabled={true}

            onScroll={e => {
                setScrollPos(e.nativeEvent.contentOffset.x);
            }}

        >

            {dimentions?.width && WaveFormImage}

            {dimentions?.width && isPlaying && <Box

                opacity={0.6}
                backgroundColor="red.600"

                w={'1px'}
                position='absolute'
                h='100%'

                left={`${zoomedCurrentPos}px`}

            />
            }

            {dimentions?.width && slices && slices.map((s, i) => {

                const left = milisecToPixels(s.begin * 100) / zoom;
                const width = (milisecToPixels(s.end * 100) / zoom) - left;


                //console.debug(`slice ${i} ${left} ${width} ${s.begin} ${s.end}`);

                return <Box key={i}

                    opacity={0.4}
                    backgroundColor={`${s.forSale ? "primary" : "yellow"}.500`}


                    {...{ left, width }}

                    position='absolute'
                    h='100%'
                />;
            })}

        </ScrollView>
    </Box>;


}
