import React, { useEffect, useState } from 'react';
import { Center, Text, VStack } from 'native-base';
import { useAuthentication } from '../auth';

import { BandSignupProps } from '../nav/routes';

import { IAsyncResult } from '../utils';


import EditProfile from './editProfile';

export default function SignupScreen({ navigation }: BandSignupProps) {

    const [showModal, setShowModal] = useState<boolean>(true);
    const {ensureLogin} = useAuthentication();

    useEffect(() => {

        navigation.addListener('focus', async () => {

            setShowModal(true);
            try {
                const t = await ensureLogin();
            } catch (err) {
                console.log(`login failed`);

                navigation.navigate('Home',{tab:'musicians'});
            }

        })


    }, []);

    return <VStack>
        {showModal && <EditProfile
            onCancel={() => {
                setShowModal(false);
                navigation.navigate('Home',{tab:'musicians'});
            }}
            onDone={() => {
                setShowModal(false);
                navigation.navigate('MyAccount');
            }}
        />
        }
    </VStack>;
}
