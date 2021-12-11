import React,{useState} from 'react';
import constate from 'constate';

import { TabView, SceneMap, TabBar } from 'react-native-tab-view';

import { Dimensions } from 'react-native';


import { TrackScreenProps } from '../nav/routes';
import { ShowError, IAsyncResult, fetchJsonAsync, connectTo } from '../utils';

import { useAuthentication } from '../auth';

import { TrackDisplayModel } from '../../generatedTypes/TrackDisplayModel';
import { BandModel } from '../../generatedTypes/BandModel';


export type TrackSubScreenProps = {
    track: TrackDisplayModel;
    band: BandModel;
    isAdmin:boolean;
    reLoadTrack: ()=>any;
};
  
export const [TrackSubscreenCtxProvider,useTrackScreenCtx] = constate(useTrackScreen);

function useTrackScreen(){
    const [subScreenProps,setSubScreenProps] = useState<TrackSubScreenProps>();

    return {subScreenProps,setSubScreenProps};
}