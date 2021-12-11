import React, { FunctionComponent, Fragment } from 'react';
import Constants from 'expo-constants';

import {
    Center,
    Text
} from 'native-base';

interface IAsyncResultBase {
    isLoading?: boolean;
    error?: Error;
}

//export const CS_SERVER_URL =  'http://localhost:3300';
export const connectTo: {
    //web3Net: string;
    dataSvr: string;
    //factoryAddress: string;
  } = Constants?.manifest?.extra?.connectTo || {};

export interface IAsyncResult<T> extends IAsyncResultBase {
    result?: T;
}

export const unAuthhandler = {
    onUnAuthorized :  ()=>{}
};


export async function fetchJsonAsync<T>(responsePromise: Promise<Response>) {
    const responce = await checkFetchErrorAsync(responsePromise);

    return (await responce.json()) as T;
}

export async function fetchStringAsync(responsePromise: Promise<Response>) {
    const responce = await checkFetchErrorAsync(responsePromise);
    return (await responce.text());
}

export const ShowError: FunctionComponent<{ error: Error | undefined }> = ({ error }) => {
    if (!error)
        return <Fragment>&nbsp;</Fragment>;

    let errStr = error.message ?? `failed :${error}`;
    if(errStr.length>150){
        errStr = errStr.slice(0,150);
    }

    return <Center flexGrow={1} py={2}>
        <Text textAlign="center" w="100%"  color="danger.600"> {errStr}</Text>
    </Center>;
}



export async function checkFetchErrorAsync(responsePromise: Promise<Response>) {

    const response = await responsePromise;

    if (!response.ok) {

        console.log(`checkFetchError NON OK response : status ${response.status} : ${response.statusText}`);

        if(401 == response.status){
            //jwt is invalid
            console.log(`calling unAuthhandler.onUnAuthorized`);
            unAuthhandler.onUnAuthorized();
        }

        if (!response.headers)
            console.error('checkFetchError called with non http response');

        try {
            const contentType = response.headers.get('content-type');

            if (contentType && contentType.indexOf('application/json') != -1) {
                const err = await response.json();
                throw new Error(err?.Message || err?.message || 'unknown error');
            } else if (contentType && contentType.indexOf('text/plain') != -1) {
                const err = await response.text();

                throw new Error(response.statusText + ' : ' + err);
            }
        } catch (err) {
            console.debug('we don\'t have error body');

        }


        {
            throw new Error(response.statusText);
        }

    }
    else
        return response;
}
