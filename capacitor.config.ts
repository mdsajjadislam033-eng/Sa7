import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sazzad.sa7',
  appName: 'Sa7',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
    backgroundColor: '#06281E',
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
