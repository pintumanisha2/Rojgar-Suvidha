import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rojgarsuvidha.app',
  appName: 'Rojgar Suvidha',
  webDir: 'public',
  server: {
    url: 'https://rojgar-suvidha.vercel.app',
    cleartext: true,
    allowNavigation: [
      'accounts.google.com',
      '*.supabase.co',
      '*.supabase.in',
      '*.googleusercontent.com'
    ]
  },
  overrideUserAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.5672.162 Mobile Safari/537.36'
};

export default config;
