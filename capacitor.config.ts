import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.justcook.app',
  appName: 'JustCook',
  webDir: 'out',
  server: {
    url: 'http://192.168.1.239:3000',
    cleartext: true,
  },
};

export default config;
