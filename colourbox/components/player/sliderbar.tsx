import React, { useRef, useState, useEffect } from 'react';
import { View, PanResponder, Animated, LayoutRectangle } from 'react-native';
import { Box, Icon } from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';


//https://github.com/olapiv/expo-audio-player/blob/master/src/AudioSlider.js

const silderBoxWidth = 20;

function useSliderBox() {
    //const [xDotOffsetAtAnimationStart,setDotOffsetStart] = useState<number>(0);

    const dotOffset = useRef(new Animated.ValueXY()).current;

    function onRelease() {
        dotOffset.flattenOffset();
    }

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponderCapture: () => true,
            
            onPanResponderGrant: () => {
                dotOffset.setOffset({ x: (dotOffset.x as any)._value, y: 0 });
            },
            onPanResponderMove: Animated.event(
                [
                    null,
                    { dx: dotOffset.x, dy: dotOffset.y }
                ]
            ),
            onPanResponderTerminationRequest: () => false,

            onPanResponderTerminate: onRelease,
            onPanResponderRelease: onRelease,

        })
    ).current;


    const BoxView = ({ trackLayout }: { 
        trackLayout?: LayoutRectangle 
    }) => <Animated.View


        style={{
            width: 20,
            transform: [{
                translateX: dotOffset.x.interpolate({
                    inputRange: [0, ((trackLayout?.width != undefined) ? (trackLayout.width - silderBoxWidth) : 1)],
                    outputRange: [0, ((trackLayout?.width != undefined) ? (trackLayout.width - silderBoxWidth) : 1)],
                    extrapolate: 'clamp'
                })
            }]
        }}
        {...panResponder.panHandlers}
    >

        <Icon size={5} position="absolute" left={-10}
            as={<MaterialCommunityIcons name="flag-triangle" />} />


    </Animated.View>;


    return {BoxView, dotOffset};
}


export default function Sliderbar() {

    const boxRef = useRef<View | null>(null);

    const [trackLayout, setTrackLayout] = useState<LayoutRectangle>();

    const {dotOffset,BoxView} = useSliderBox();

    useEffect(()=>{
//        dotOffset.setOffset({ x: 50, y: 0 });
    },[]);

    return <Box ref={_ref => { boxRef.current = _ref as any; }}
        onLayout={e => setTrackLayout(e.nativeEvent.layout)}
        height={5}

        onStartShouldSetResponder={e => {

            const pageX = e.nativeEvent.pageX;
            console.log(`locationX = ${e.nativeEvent.locationX}, pageX= ${pageX}`);

            boxRef?.current?.measure((fx, fy, width, height, px, py) => {


                console.log('Component width is: ' + width)
                console.log('Component height is: ' + height)
                console.log('X offset to frame: ' + fx)
                console.log('Y offset to frame: ' + fy)
                console.log('X offset to page: ' + px)
                console.log('Y offset to page: ' + py)

                const offSetX = pageX - px;

                console.log(`offSetX = ${offSetX}`);


                dotOffset.setValue({ x: offSetX, y: 0 });

            });


            return false;
        }}

    >
        {/*  The track */}
        <Box height={0} position="absolute" top={2} width="100%" borderColor="blueGray.400" borderWidth={1} />

        <BoxView {...{trackLayout}}/>
        
    </Box>;
}
