import React, { useEffect, useState, Fragment } from 'react';

import {
    Button,
    Modal,
    FormControl,
    Input, Select,
    HStack, VStack, TextArea, Image,
    Text, Heading, Spinner, Center, Wrap, Flex, Spacer, NumberInput,
    useToast,
    Container, Icon, Box, useBreakpointValue, useColorMode, IconButton,
    KeyboardAvoidingView
} from "native-base";

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ShowError, IAsyncResult, fetchJsonAsync, connectTo } from '../utils';

import { TrackDisplayModel } from '../../generatedTypes/TrackDisplayModel';
import { useBuyingContext, usePlayControls } from '../player/index';
import * as Linking from 'expo-linking';
import * as Clipboard from 'expo-clipboard';

import { useConnectCalls, useSalesInfo } from '../web3';
import { SalesInfoModel } from '../../generatedTypes/SalesInfoModel';

export function ChooseAmount({ chainId, label, isRequired, value, onChanged }: {
    chainId: string;
    label?: string;
    value: string;
    isRequired?: boolean;
    onChanged: (v: string) => any;
}) {

    const salesInfo = useSalesInfo();
    const chainInfo = salesInfo?.chainInfo && salesInfo?.chainInfo[chainId];

    const valNumber = value && Number.parseFloat(value) || undefined;

    const fiat = valNumber && chainInfo?.rate && (valNumber * chainInfo?.rate).toFixed(2) || '';

    const minValue = chainInfo?.rate && (1.0 / chainInfo.rate) || 0.001;

    return <FormControl isRequired={isRequired}
        isInvalid={(valNumber || 0) < minValue}
    >
        <FormControl.Label>{label || 'amount'}</FormControl.Label>
        <Input
            placeholder="1.00"

            InputRightElement={chainInfo?.sym && <Text mx={1}>{chainInfo?.sym}</Text> || undefined}

            value={(value || '').toString()}

            onChangeText={(value) => {

                if (!value) {
                    onChanged(value);
                }

                const amount = value.replace(/[^0-9\.]+/g, '');
                onChanged(amount);
            }}

        />
        <FormControl.HelperText minH="20px" _text={{ fontSize: 'xs', textAlign: "right" }} color="muted.400" justifyContent="flex-end" >
            {fiat && `$${fiat}` || ''}
        </FormControl.HelperText>

    </FormControl>;
}


export function NetworkSelect({ chainId, onChanged }: {
    chainId: string;
    onChanged: (chainId: string) => any;
}) {

    const salesInfo = useSalesInfo();

    if (!salesInfo?.chainInfo || Object.keys(salesInfo?.chainInfo).length == 0) {
        return <Spinner />;
    }

    return <Select
        selectedValue={chainId}

        flexGrow={1}
        accessibilityLabel="Choose network"
        placeholder="Choose network"
        _selectedItem={{
            //    bg: "teal.600",

        }}
        mt={1}
        onValueChange={(itemValue) => onChanged(itemValue)}
    >
        {/*<Select.Item label="Ropsten" value="3" />*/}

        {Object.keys(salesInfo?.chainInfo)
            .map(k => <Select.Item key={k}
                label={salesInfo?.chainInfo[k].name}
                value={k}
            />)}

    </Select>;

}


export function ShowAdress({ address, chainId, aType }: {
    address: string;
    chainId?: string;
    aType: 'address' | "tx"
}) {
    const salesInfo = useSalesInfo();

    const toast = useToast();

    const [display, setDisplay] = useState<{
        txLink: string;
    }>();

    useEffect(() => {
        (async () => {

            try {

                if (!salesInfo)
                    return;

                const { chainInfo } = salesInfo;

                if (!!chainId) {
                    const chainData = chainInfo[chainId];
                    if (!chainData)
                        throw new Error(`chaindata form chain ${chainId} not found`);

                    setDisplay({
                        txLink: `${aType == "address" ? chainData.addressScan : chainData.txScan}/${address}`
                    });
                }

            } catch (error: any) {
                console.error(`exception at showWei ${error}`);
            }


        })();

    }, [chainId, salesInfo]);

    return <VStack>
        <HStack mr={1}>
            <Text fontSize="xs" flexShrink={1} isTruncated maxW={70}>{address}</Text>
            <Text fontSize="xs" ml={-1}>{address.substring(address.length - 3)}</Text>
        </HStack>

        <Box><HStack space={1} alignItems="center">
            <IconButton size="sm"
                icon={<Icon as={<MaterialCommunityIcons name="content-copy" />} />}
                onPress={() => {
                    Clipboard.setString(address);
                    toast.show({ description: 'copied to clipboard' });
                }}
            />
            {display?.txLink && <IconButton size="sm"
                icon={<Icon as={<MaterialCommunityIcons name="open-in-app" />} />}
                onPress={() => {
                    Linking.openURL(display?.txLink);

                }}
            />
            }
        </HStack></Box>

    </VStack>;
}


export function ShowWei({ wei, chainId }: { wei: string, chainId: string }) {

    const [display, setDisplay] = useState<{
        ethAmount: number;
        ethVal: string;
        sym: String;
        fiat: number;
    }>();
    const { readOnlyWeb3 } = useConnectCalls();
    const salesInfo = useSalesInfo();

    useEffect(() => {
        (async () => {

            try {

                if (!salesInfo)
                    return;

                const { chainInfo } = salesInfo;
                const chainData = chainInfo[chainId];
                if (!chainData)
                    throw new Error(`chaindata form chain ${chainId} not found`);

                if (!wei) {
                    wei = "0";
                }

                let ethVal: string | undefined = undefined;

                const tesetWei = Number.parseFloat(wei);
                if (isNaN(tesetWei)) {
                    return;
                }

                if (tesetWei > Math.floor(tesetWei)) {
                    //it is a decimal
                    ethVal = wei;
                }

                const roWeb3 = await readOnlyWeb3(chainId);

                if (undefined == ethVal) {
                    ethVal = wei == "0" ? "0" : roWeb3.utils.fromWei(wei, "ether");
                }

                const ethAmount = wei == "0" ? 0 : Number.parseFloat(ethVal);

                const fiat = (ethAmount * chainData.rate);

                setDisplay({ ethVal, ethAmount, fiat, sym: chainData.sym });

            } catch (error: any) {
                console.error(`exception at showWei ${error}`);
            }


        })();

    }, [wei, chainId, salesInfo]);

    if (!display) {
        return <Text isTruncated fontSize="sm">{wei}</Text>;
    }

    return <VStack>
        <Text>{`${display.ethAmount.toFixed(3)}`} <Text fontSize="sm">{display.sym}</Text></Text>
        {!Number.isNaN(display.fiat) && <Text color="muted.500" fontSize="xs">{`$${display.fiat.toFixed(2)}`}</Text>}
    </VStack>;

}


