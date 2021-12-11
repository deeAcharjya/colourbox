import { ExpoConfig, ConfigContext } from '@expo/config';

export default ({ config }: ConfigContext): Partial<ExpoConfig> => ({
  ...config,
  extra: {
    connectTo :{
      //web3Net: process.env.APP_CONTRACT_URL || 'http://gtc_alpha1.labizbille.com:8545',
      dataSvr: process.env.APP_API_ROOT || '',
      //factoryAddress: '0x8464135c8F25Da09e49BC8782676a84730C318bC'
    }
  },
});