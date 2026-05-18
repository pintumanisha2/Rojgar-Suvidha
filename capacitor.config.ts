import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rojgarsuvidha.app',
  appName: 'Rojgar Suvidha',
  webDir: 'public',
  server: {
    url: 'https://www.rojgarsuvidha.com',
    cleartext: true
  }
};

export default config;
