import React, { useState, useCallback, useEffect, useRef } from 'react';
import constate from 'constate';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthDlg from './authDlg';

import {LoginResponceModel} from '../../generatedTypes/LoginResponceModel';



import {unAuthhandler} from '../utils';

export const [LoginProvider, useLoginDlg, useAuthentication] = constate(
    useLogin,
    v => v.LoginDlg,
    v => v.login,
    //    value => value.count, // becomes useCount
    //    value => value.increment // becomes useIncrement
);

const LOGIN_KEY_NAME = 'login_key';


function useLogin() {

    const [loginDetails, setLoginDetails] = useState<LoginResponceModel>();
    
    const [visible,setVisible] = useState<boolean>();

    const loginResolverRef = useRef<{
        resolve : (d: LoginResponceModel) => void;
        reject : (r?: any) => void;
        thePromise?: Promise<LoginResponceModel>;
    }>();

    //const [count, setCount] = useState(initialCount);
    //const increment = useCallback(() => setCount(prev => prev + 1), []);

    //return { count, increment };

//    const [needsAuth, setNeedsAuth] = useState<boolean>();

    async function savekeyStore(stored?: LoginResponceModel) {

        if(stored){
        await AsyncStorage.setItem(LOGIN_KEY_NAME,
            JSON.stringify({ ...stored, savedAt: new Date() })
        );
        }else{
            await AsyncStorage.removeItem(LOGIN_KEY_NAME);
        }
    }

    
    

    useEffect(()=>{

        const loadPKey = async () =>{
            const value = await AsyncStorage.getItem(LOGIN_KEY_NAME);

            if (!!value){
                const recovered: LoginResponceModel = JSON.parse(value);

                if(recovered?.jwt){
                    setLoginDetails(recovered);
                    //loginResolverRef.current.resolve(recovered);
                }
            }
        }

        unAuthhandler.onUnAuthorized = ()=>{
            signOut();
        };

        loadPKey();
    },[]);

    const LoginDlg = () => {

        if(loginDetails)
            return null;

        if(!visible)
            return null;

        return <AuthDlg onSignIn={d => {
            
            setLoginDetails(d);

            loginResolverRef.current?.resolve(d);
            loginResolverRef.current = undefined;

            savekeyStore(d);
            setVisible(false);
        }}

            onCancel={() => {
                
                loginResolverRef.current?.reject();
                loginResolverRef.current = undefined;

                //loginPromiseRef.current = undefined;

                setVisible(false);
            }}

        />;
    }

    const signOut = ()=>{
        loginResolverRef.current?.reject();
        loginResolverRef.current = undefined;

        setLoginDetails(undefined);
        savekeyStore(undefined);
    }

    const ensureLogin = () => {

        if(loginDetails)
            return Promise.resolve(loginDetails);

        if (loginResolverRef.current?.thePromise)
            return loginResolverRef.current?.thePromise;

        const thePromise = new Promise<LoginResponceModel>((resolve, reject) => {
            loginResolverRef.current = {resolve, reject}
        });

        setVisible(true);
        
        //loginPromiseRef.current = t;

        if(loginResolverRef.current){
            loginResolverRef.current = {...loginResolverRef.current,thePromise}
        }else{
            console.error('loginResolverRef.current should not be empty');
        }

        return thePromise;
    };
   

    return { LoginDlg, login:{loginDetails, ensureLogin, signOut}  };
}