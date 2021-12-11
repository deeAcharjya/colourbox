import {
    DrawerScreenProps
} from '@react-navigation/drawer';

export type SliceActions ='buy'|'bid'|'sell';

export type DrawerParamList = {
    Home: { tab: string };
    BandSignup: undefined;
    MyAccount: undefined;

    Profile: { bandId: string };
    Track:{ trackId: string; action?:SliceActions };
};


export const routeLinking = {
    prefixes: [
        /* your linking prefixes */
    ],
    config: {
        screens: {
            Home:'home/:tab?',
            BandSignup: 'bandSignup',
            MyAccount: 'myAccount',
            Profile:'profile/:bandId',
            Track:'track/:trackId/:action?'
          }
    },
};


export type HomeProps =  DrawerScreenProps<DrawerParamList, 'Home'>;
export type BandSignupProps = DrawerScreenProps<DrawerParamList, 'BandSignup'>;

export type ProfileProps = DrawerScreenProps<DrawerParamList, 'Profile'>;

export type TrackScreenProps = DrawerScreenProps<DrawerParamList, 'Track'>;

export type MyAccountScreenProps = DrawerScreenProps<DrawerParamList, 'MyAccount'>;


