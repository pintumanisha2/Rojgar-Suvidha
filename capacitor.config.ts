import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rojgarsuvidha.app',
  appName: 'Rojgar Suvidha',
  webDir: 'public',
  server: {
    url: 'https://rojgar-suvidha.vercel.app',
    cleartext: true
  }
};

export default config;
