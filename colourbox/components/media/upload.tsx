import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

import { Box, Progress } from 'native-base';
import { ShowError, IAsyncResult, fetchJsonAsync, connectTo, fetchStringAsync, checkFetchErrorAsync } from '../utils';
import { NewPageDirectModel } from '../../generatedTypes/NewPageDirectModel';
import { useAuthentication } from '../auth';

import * as Evaporate from '../../subModules/evaporateJS/evaporate';

import * as sparkMD5 from 'spark-md5';
import { sha256 as SHA256 } from 'js-sha256';

import * as mime from 'react-native-mime-types';


//const md5 = (x) => { const o = MD5.create(); o.update(x); return o.base64(); };
const sha256 = (x: any) => {

    const o = SHA256.create(); o.update(x);
    return o.hex();
};

//import * as Crypto from 'expo-crypto';

function blobToFile(theBlob: Blob, fileName: string): File {
    var b: any = theBlob;
    //A Blob() is almost a File() - it's just missing the two properties below which we will add
    b.lastModifiedDate = new Date();
    b.name = fileName;

    //Cast to a File() type
    //return <File>theBlob;

    return theBlob as any;
}


export function useMediaUploader(props: {
    type: 'image';
    aspect?: [number, number];
} | {
    type: 'audio';
    bandId: string;
    albumId?: string;
    imageId?: string;
}) {

    const [mediaUri, setMediaUri] = useState<string>();
    const { ensureLogin } = useAuthentication();

    const [progressStatus,setProgressStats] = useState(0);

    useEffect(() => {
        (async () => {
            if (Platform.OS !== 'web') {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    alert('Sorry, we need camera roll permissions to make this work!');
                }
            }
        })();
    }, []);

    const fetchImageFromUri = async (uri: string) => {
        const response = await fetch(uri);
        const blob = await response.blob();
        return blob;
    };

    async function evaporateUpload(uploadModel: NewPageDirectModel, img: Blob, jwt: string) {

        const imgFile = blobToFile(img, "blobFile");

        const uploader = await Evaporate.create({
            ...uploadModel.options,


            customAuthMethod: async (
                signParams: any, signHeaders: any, stringToSign: string,
                signatureDateTime: any, canonicalRequest: any) => {

                const nodetest = await fetchStringAsync(fetch(`${connectTo.dataSvr}/api/uploads/signature?to_sign=${stringToSign}`
                    + `&datetime=${signatureDateTime}`
                    + `&canonical_request=${encodeURIComponent(canonicalRequest)}`, {
                    method: 'get',
                    headers: {
                        //                                'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + jwt
                    }
                },
                ));


                return nodetest;
            },


            /*
            //signerUrl:'http://localhost:8091/sign_auth',
            signerUrl: '/api/Pages/uploadSignature',

            sendCanonicalRequestToSignerUrl: true,

            signHeaders: {
                Authorization: 'Bearer ' + JWT,
                workspace: currentWorkSpace
            },
            */

            cloudfront: false,
            logging: false,
            computeContentMd5: true,


            cryptoMd5Method: (d: ArrayBuffer) => btoa(sparkMD5.ArrayBuffer.hash(d, true)),
            //cryptoHexEncodedHash256: sha256,

            cryptoHexEncodedHash256: (_: any) => sha256(_)


            //cryptoMd5Method: Crypto.

        });


        const done = await uploader.add({
            file: imgFile,
            name: uploadModel.preSignedUrl,
            progress: (percent: number, stats: any) => {
                console.log('Progress', percent, stats);
                setProgressStats(percent);
            },
            complete: (xhr: any, awsObjectKey: any, stats: any) => {
                //totalUploaded = stats && stats.totalUploaded;
                //console.log(`fileUpload s3 Complete! ${file.name} ->${totalUploaded} bytes -> ${newpageReq.keyForDirectUpload}`);
            },
            error: (msg: any) => {

                console.error('Error', msg)
            },
            paused: () => console.log('s3 upload Paused'),
            pausing: () => console.log('s3 upload Pausing'),
            resumed: () => console.log('s3 upload Resumed'),
            cancelled: () => console.log('s3 upload Cancelled'),
            started: (fileKey: any) => console.log('fileUpload s3 Started', imgFile.name, fileKey),
            uploadInitiated: (s3Id: any) => console.log('Upload Initiated', s3Id),
            warn: (msg: any) => {

                console.log('Warning', msg);
                //uploader.cancel(`${uploadOptions.bucket}/${newpageReq.keyForDirectUpload}`);
            }
        });

        //uploader = undefined;
    }

    async function pickAudio() {

        const result = await DocumentPicker.getDocumentAsync({
            copyToCacheDirectory: false,
            type: 'audio/wav' //right now only wav files 
        });

        
        console.log(result);

        if ('success' != result.type) {
            console.debug('user cancelled');
            return;
        }

        return result.uri;

    }

    async function pickImage() {

        if(props.type != 'image')
            throw new Error('incorrect type');


        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: props.aspect || [4, 3],
            quality: 1,
        });

        
        console.log(result);

        if (result.cancelled) {
            console.debug('user cancelled');
            return;
        }

        return result.uri;

    }

    async function pickMedia() {

        let selectedUri: string | undefined;
        switch (props.type) {
            case 'audio':

                if (Platform.OS !== 'web') {
                    throw new Error("We cannot upload audio here. Please try to use the app on a Desktop Browser");
                }

                selectedUri = await pickAudio();
                break;
            case 'image':
                selectedUri = await pickImage();
                break;
            default:
                throw new Error('meddia type not supported');
        }

        if (!selectedUri) {
            console.debug('no uri selected');
            return;
        }


        if (mediaUri) {
            //image doesnot refresh if we just update it we need to make it null first
            setMediaUri(undefined);
            await new Promise(r => setTimeout(r, 10));
        }

        setMediaUri(selectedUri);

        return selectedUri;

    }

    async function upLoadMedia() {
        try {

            if (!mediaUri)
                throw new Error('no image selected');

            const img = await fetchImageFromUri(mediaUri);

            const ext = mime.extension(img.type);

            const creds = await ensureLogin();

            let preSigned = '';

            if (Platform.OS !== 'web') {
                preSigned = '?preSigned=true';

                if (props.type != 'image') {
                    throw new Error("We cannot upload here. Please try to use the app on a Desktop Browser");
                }
            }

            let uploadUrl: string | undefined;
            switch (props.type) {
                case 'audio':
                    uploadUrl = `${connectTo.dataSvr}/api/tracks/uploadUrl/${props.bandId}/${ext}${preSigned}`;
                    const qp :string[]= [];
                    
                    if(!!props.imageId){
                        qp.push(`imageId=${encodeURIComponent(props.imageId)}`);
                    }

                    if(!!props.albumId){
                        qp.push(`albumId=${encodeURIComponent(props.albumId)}`);
                    }

                    if(qp.length>0){
                        uploadUrl+=('?' + qp.join('&'));
                    }


                    break;
                case 'image':
                    uploadUrl = `${connectTo.dataSvr}/api/images/uploadUrl/${ext}${preSigned}`;
                    break;
                default:
                    throw new Error('media type not supported');
            }

            const uploadModel = await fetchJsonAsync<NewPageDirectModel>(
                fetch(uploadUrl, {
                    method: 'get',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + creds.jwt
                    }
                }));

            if (Platform.OS === 'web') {
                await evaporateUpload(uploadModel, img, creds.jwt);
            } else {

                if (!uploadModel.preSignedUrl) {
                    throw new Error('no preSigned URL');
                }

                const imgFile = blobToFile(img, "blobFile");

                const response = await checkFetchErrorAsync(fetch(uploadModel.preSignedUrl, {
                    method: "PUT",
                    body: imgFile,
                }));

            }
            console.debug('Image is uploaded');

            return uploadModel.media.id;


        } catch (error: any) {
            console.error('failed to upload image');
            throw error;
        }
    }

    function UpLoadProgress() {
        return <Progress colorScheme="primary" value={progressStatus} />;
    }

    return { mediaUri, pickMedia, upLoadMedia, UpLoadProgress };

}

