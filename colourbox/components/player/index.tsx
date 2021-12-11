import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { Audio } from 'expo-av';

import {
    Image, Box, VStack, Button, HStack,
    Text, ScrollView
} from 'native-base';

import { Ionicons } from '@expo/vector-icons';
import Sliderbar from './sliderbar';
import { TrackDisplayModel } from '../../generatedTypes/TrackDisplayModel';
import constate from 'constate';

import { ShowError, IAsyncResult, fetchJsonAsync, connectTo } from '../utils';

import { SalesInfoModel } from '../../generatedTypes/SalesInfoModel';
import {SliceActions} from '../nav/routes';

import {SalesOrderModel} from '../../generatedTypes/SalesOrderModel';

export type NFTSlice = {
    
    //In 1/10 seconds = 100 ms scale
    begin: number;

    //In 1/10 seconds = 100 ms scale
    end: number;
    
    forSale?: SalesOrderModel;

    owner?: string;

    tokenId?: string;

    approved?: boolean;
}

export type TrAmont ={
    amount: string;
    chainId: string;
}

export type SelectedSlice ={
    track:TrackDisplayModel;
    slice:NFTSlice;
    action: SliceActions;

    trAmount?:TrAmont;

    actionParams?:{
        action:'bid';
        expireInDays:number;
    }|{
        action:'buy';
        expireInDays:number;
    }|{
        action:'sell';
        expireInDays:number;
    }
}



export const [AudioProvider, 
                    usePlayControls, useAudioContext, usePlayingContext,useBuyingContext
                ] = constate(
    useAudioPlayer,
    v => v.controls,
    v=>v.audioContext,
    v=>v.playingContext,
    v=>v.buyingContext
);


type LoadedTrack = {
    sound: Audio.Sound;
    track: TrackDisplayModel;
};

export function milisecToPixels(milis:number){

    //we are rendering wavefor at 50 pixels per second

    return milis * 0.05; //(0.05 = 50 /1000)
}


let _salesInfo:SalesInfoModel|undefined = undefined;

function useAudioPlayer() {

    //the track that is playing
    const [loadedTrack, setLoadedTrack] = useState<LoadedTrack>();

    const [soundPosInPixels, setPos] = useState<number>(0);
    const [trackIsPlaying, setIsPlaying] = useState<boolean>();

    const [nfts, setNfts] = useState<{ [trackId: string]: IAsyncResult<NFTSlice[]> | undefined }>({});

    const [selectedSlice,setSelectedSlice] = useState<SelectedSlice>();

    useEffect(() => {
        (async () => {
            try {
                await Audio.setAudioModeAsync({ staysActiveInBackground: true });
            } catch (error: any) {
                console.error(`failed to initialize Audio context ${error}`);
            }
        })();
    },[]);

    

    //const callBackTrackDisplay = useCallback((display: TrackDisplayModel)=><TrackDisplay {...display}/>,[]);
    const playTrack = async (track: TrackDisplayModel) => {
        try {

            if (!track.audioPath) {
                throw new Error(`track ${track.track.id} has no audioPath`);
            }

            const { sound } = await Audio.Sound.createAsync(
                { uri: track.audioPath }
            );

            console.log(`done downloading : ${track.audioPath}`);

            //anything under 5 gives bad performance on my android
            await sound.setProgressUpdateIntervalAsync(5 * 1000);

            sound.setOnPlaybackStatusUpdate(status => {


                if (!status.isLoaded) {
                    console.debug('got not loaded');
                    return;
                }

                console.debug(`got status update isplaying = ${status.isPlaying}`);
                setIsPlaying(status.isPlaying);

                if (status.didJustFinish) {
                    console.debug(`did just finish ${status.uri}`);
                } else {

                    const { positionMillis } = status;

                    const pos = milisecToPixels(positionMillis);

                    console.debug(`millis is ${positionMillis}, pos = ${pos}`);

                    setPos(pos);

                }

            });

            const oldSound = loadedTrack?.sound;

            setLoadedTrack({ track, sound });

            await oldSound?.stopAsync();
            await sound.playAsync();

            await oldSound?.unloadAsync();


        } catch (error: any) {
            //debugger;
            console.error(`failed to play track : ${error}`);
        }
    }

    const pause = async () => {
        if (loadedTrack?.sound) {
            await loadedTrack?.sound.pauseAsync();
        }
    };

    const play =async ()=> {
        if (loadedTrack?.sound) {
            await loadedTrack?.sound.playAsync();
        }
    };

    const selectSlice = async (slice?: SelectedSlice)=>{

       console.debug(`selectSlice begin ${slice?.slice?.begin} end: ${slice?.slice?.end}`);
        setSelectedSlice(slice);

    }

    const controls = useMemo(()=>({
        playTrack, pause, play,setNfts, selectSlice
    }),[loadedTrack?.sound]);

    const audioContext = useMemo(()=>({
        loadedTrack,
        trackIsPlaying,
        nfts
    }),[loadedTrack,trackIsPlaying,nfts]);

    const playingContext = useMemo(()=>({
        soundPosInPixels
    }),[soundPosInPixels]);

    const buyingContext = useMemo(()=>({
        selectedSlice
    }),[selectedSlice]);

    return {
            buyingContext,
            audioContext,
            playingContext,
            controls
    };
}


function Player() {

    const [loadedSound, setSound] = useState<Audio.Sound>();
    const [soundPos, setPos] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>();


    useEffect(() => {
        const loadIt = async () => {
            try {

                const { sound } = await Audio.Sound.createAsync(
                    { uri: 'http://localhost:32772/song1.mp3' }
                );
                console.log('done downloading');

                sound.setOnPlaybackStatusUpdate(status => {

                    console.debug('got status update');

                    if (!status.isLoaded) {
                        console.debug('got not loaded');
                        return;
                    }

                    setIsPlaying(status.isPlaying);

                    if (status.didJustFinish) {
                        console.debug(`did just finish ${status.uri}`);
                    } else {

                        const { positionMillis } = status;
                        const pos = positionMillis * 0.05; //(0.05 = 50 /1000)

                        console.debug(`millis is ${positionMillis}, pos = ${pos}`);

                        setPos(pos);

                    }

                });

                setSound(sound);

            } catch (err) {
                console.error(err);
            }

        };
        loadIt();
    }, []);

    return <VStack width="100%">

        <Sliderbar />

        {/*<WavViewer currentPos={soundPos} />*/}

        <HStack m={3} space={2} justifyContent="center">

            {isPlaying ? <Button variant="outline" onPress={async () => {
                await loadedSound?.pauseAsync();
            }}>
                <Ionicons name="pause" size={32} color="green" />
            </Button>
                :
                <Button variant="outline" onPress={async () => {
                    await loadedSound?.playAsync();
                }}>
                    <Ionicons name="play-sharp" size={32} color="green" />
                </Button>
            }

        </HStack>

    </VStack>

}

