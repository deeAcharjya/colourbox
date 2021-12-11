import React, { useEffect, useState } from 'react';

import {
  Button,
  Modal,
  FormControl,
  Input,
  HStack, VStack, TextArea, Image,
  Text, Spinner, Center,
  Wrap, Icon, Box, KeyboardAvoidingView, Heading
} from "native-base";

import { BandModel } from '../../generatedTypes/BandModel';

import { ProfileProps } from '../nav/routes';
import { ShowError, IAsyncResult, fetchJsonAsync, connectTo } from '../utils';

import HeaderView from './header';
import { useAuthentication } from '../auth';

import EditProfile from '../band/editProfile';
import TracksList from '../tracks/list';

export default function ProfileView({ route }: ProfileProps) {

  const { loginDetails } = useAuthentication();

  const [band, setBand] = useState<IAsyncResult<BandModel>>();

  const [showEditProfile, setEditProfile] = useState<boolean>();

  async function loadBand() {
    try {
      if (!route?.params?.bandId) {
        throw new Error('bandId not provided');
      }
      setBand({ isLoading: true });
      const result = await fetchJsonAsync<BandModel>(
        fetch(`${connectTo.dataSvr}/api/bands/${encodeURIComponent(route?.params?.bandId)}`));
      setBand({ result });

    } catch (error: any) {
      setBand({ error });
    }
  }

  useEffect(() => {
    loadBand();
  }, [route?.params?.bandId]);

  const isAdmin = loginDetails?.userId && band?.result
    && band?.result.admins.includes(loginDetails.userId) || false;



  if (band?.isLoading) {
    return <Center><Spinner /></Center>;
  }

  if (band?.error || !band?.result) return <ShowError error={band?.error || new Error("no bands")} />;



  return <VStack>

    {showEditProfile && <EditProfile band={band.result}
      onCancel={() => setEditProfile(false)}
      
      onDone={() => {
        loadBand();
        setEditProfile(false);
      }}
    />}

    <HeaderView details={band.result.details} onEdit={isAdmin ? async () => {
      setEditProfile(true);
    } : undefined} />

    {!band?.result?.approved && <VStack borderWidth={1} m={1} p={1}>
      <Heading textAlign={"center"}>Looking forward to hearing your sounds</Heading>
      <Text>We are looking at you, and will approve your submissions shortly.</Text>
      <Text>We will have to sign some paperwork about distribution rights to get on with this</Text>
      <Text>Meanwhile you can also jump to our testnet at <Text color="primary">https://testnet.colourbox.io</Text> and take your tracks on a test run</Text>
    </VStack>
    }

    <TracksList bandId={band.result.id} {...{ isAdmin }} />
  </VStack>;


}
