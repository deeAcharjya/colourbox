import React, { useState, useEffect,useRef } from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';
import { Audio } from 'expo-av';
import { HStack } from 'native-base';

type SMap = { loaded: Audio.Sound[], mapped: { [uri: string]: number } };

export default function Player() {
    const [sounds, setSounds] = useState<SMap>();

    const stateRef = useRef<SMap>();
    stateRef.current = sounds;

    /*
    async function playSound() {
        console.log('Loading Sound');

        const { sound:sound1  } = await Audio.Sound.createAsync(
            {uri :'http://localhost:32769/track01.mp3'}
        );
        setSound(sound1);

        console.log('Playing Sound');
        await sound1.playAsync();
    }

    useEffect(() => {
        return sound
            ? () => {
                console.log('Unloading Sound');
                sound.unloadAsync();
            }
            : undefined;
    }, [sound]);
    */

    return (
        <View ><HStack space={2}>
            <Button title="download Sounds" onPress={async () => {

                const loaded = await Promise.all([...Array(7).keys()].map(async i => {

                    console.log(`downloading ${i}`);

                    const uri = `http://localhost:32769/track0${i + 1}.mp3`;

                    const { sound } = await Audio.Sound.createAsync(
                        { uri }
                    );
                    console.log(`done downloading ${i}`);

                    sound.setOnPlaybackStatusUpdate(status => {

                        console.log('got status update');
                        
                        if(!stateRef.current){
                            console.error('sounds is nul;');
                            return;
                        }
                            

                        console.log('got status update with sound');

                        if (!status.isLoaded) {
                            console.log('got not loaded');
                            return;
                        }

                        if (status.didJustFinish) {
                            console.log(`did just finish ${status.uri}`);

                            const i = stateRef.current.mapped[status.uri];
                            console.log(`i is ${i}`);

                            if(i < stateRef.current.loaded.length -1){
                                stateRef.current.loaded[i+1].playAsync();
                            }else{
                                console.log('all p;ayed');
                            }

                        }else{
                            console.log(`NOT did just finish ${status.uri}`);
                        }

                    });

                    return { sound, uri };
                }));

                const mapped = loaded.reduce((a, l, i) => {
                    a[l.uri] = i;
                    return a;
                }, {} as { [uri: string]: number });

                setSounds({ loaded: loaded.map(l => l.sound), mapped });
                console.log('done with downloads');

            }} />

            <Button title="Play Sound" onPress={async () => {

                if (!sounds) {
                    console.error('no sounds');
                    return;
                }

                await sounds.loaded[0].playAsync();

            }} />
        </HStack></View>
    );
}

//const styles = StyleSheet.create({  });