import React, { useState, useRef, useEffect } from 'react';
import { LoginResponceModel } from '../../generatedTypes/LoginResponceModel';
import { AuthCredsModel } from '../../generatedTypes/AuthCredsModel';
import { UserDetailsModel } from '../../generatedTypes/UserDetailsModel';
import { AuthStatusModel } from '../../generatedTypes/AuthStatusModel';

import {
    Button,
    Modal,
    FormControl,
    Input,
    HStack, VStack, Center,
    Text, Switch, Box, Spinner
} from "native-base";

import PhoneInput from 'react-native-phone-number-input';

import { ShowError, IAsyncResult, fetchJsonAsync, connectTo } from '../utils';

import { useConnectCalls, useSalesInfo } from '../web3';

function validateEmail(email: string) {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}


export default function AuthDlg(props: {
    onSignIn: (details: LoginResponceModel) => void;
    onCancel?: () => void;
}) {

    const [usingEmail, setUsingEmail] = useState<boolean>();

    const [loginDetails, setLoginDetails] = useState<UserDetailsModel>();

    const phoneInput = useRef<PhoneInput>(null);

    const [submitted, setSubmitted] = useState<IAsyncResult<boolean>>();

    const [web3Auth, setWeb3Auth] = useState<AuthStatusModel>();
    

    const { connect } = useConnectCalls();

    useEffect(() => {

        (async () => {
            try {
                setSubmitted({ isLoading: true });

                setWeb3Auth(await fetchJsonAsync<AuthStatusModel>(fetch(`${connectTo.dataSvr}/api/auth/status`)));

                

                setSubmitted({result:true});

            } catch (error: any) {
                setSubmitted({ error });
            }
        })();

    }, []);

    return <Modal isOpen={true} size="full" onClose={() => {
        props.onCancel && props.onCancel();
    }}>
        <Modal.Content maxWidth="800px">
            <Modal.CloseButton />
            <Modal.Header>Sign in</Modal.Header>
            <Modal.Body>

                <VStack alignItems="center" space={3}>

                    <HStack my={4} alignItems="center" space={2}  >
                        <Text opacity={usingEmail ? 0.4 : 1} >Phone number</Text>

                        <Switch offTrackColor="tertiary.200" offThumbColor="tertiary.600"
                            isChecked={usingEmail}
                            onToggle={() => setUsingEmail(!usingEmail)}
                        />

                        <Text opacity={usingEmail ? 1 : 0.4}>Email</Text>
                    </HStack>

                    <Box maxW={1000}>
                        {usingEmail ? <FormControl borderWidth={1} mt="2">


                            <Input placeholder="optional"
                                value={loginDetails?.primaryEmail || ''}
                                onChangeText={primaryEmail => setLoginDetails({ primaryEmail })}
                            />
                        </FormControl>
                            : <PhoneInput

                                containerStyle={{
                                    maxWidth: 400,
                                    display: 'flex',
                                }}

                                flagButtonStyle={{
                                    maxWidth: 100,

                                }}

                                ref={phoneInput}
                                value={loginDetails?.phoneNumber}
                                onChangeFormattedText={phoneNumber => setLoginDetails({ phoneNumber })}

                                defaultCode="US"

                                placeholder="optional"

                                autoFocus
                            />
                        }
                    </Box>


                    {submitted?.error && <ShowError error={submitted.error} />}

                </VStack>

            </Modal.Body>


            <Modal.Footer >

                <HStack justifyContent="center" w="100%">
                    {submitted?.isLoading ? <Spinner /> : <Box />}

                    <Button
                        isDisabled={submitted?.isLoading}
                        variant="ghost"
                        colorScheme="warning"
                        onPress={() => {
                            props.onCancel && props.onCancel();
                        }}
                    >
                        Cancel
                    </Button>

                    <Button
                        isDisabled={submitted?.isLoading}
                        colorScheme="primary"

                        flexGrow={1} maxW={200}

                        onPress={async () => {

                            try {
                                setSubmitted({ isLoading: true });

                                

                                if (!web3Auth) {
                                    throw new Error('Auth status not initialized');
                                }

                                /*
                                if (usingEmail) {
    
                                    if (!loginDetails?.primaryEmail) {
                                        throw new Error('Email is required');
                                    }
    
                                    if (!validateEmail(loginDetails?.primaryEmail))
                                        throw new Error('Invalid email');
    
                                } else {
    
                                    if (!loginDetails?.phoneNumber) {
                                        throw new Error('Phone number is required');
                                    }
    
                                    if (!phoneInput.current?.isValidNumber(loginDetails?.phoneNumber || ''))
                                        throw new Error('Invalid phone number');
    
                                }
                                */

                                const connected = await connect();
                                web3Auth.signature = await connected.signMsg(web3Auth.nounce);

                                const details = {...loginDetails,web3Wallets:[(await connected.web3.eth.getAccounts())[0]]} 

                                if (!(details?.web3Wallets && details?.web3Wallets?.length == 1)) {
                                    throw new Error('Invalid wallet');
                                }

                                const creds: AuthCredsModel = {
                                    details,
                                    web3Auth
                                };

                                const loggedIn = await fetchJsonAsync<LoginResponceModel>(fetch(`${connectTo.dataSvr}/api/auth`, {
                                    method: 'post',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify(creds)
                                }));

                                setSubmitted({ result: true });
                                props.onSignIn(loggedIn);

                            } catch (error: any) {
                                setSubmitted({ error });
                            }

                        }}
                    >
                        Sign in
                    </Button>

                </HStack>

            </Modal.Footer>
        </Modal.Content>
    </Modal>;


}
