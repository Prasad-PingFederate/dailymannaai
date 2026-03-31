import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dailymannaai.app',
  appName: 'DailyMannaAI',
  webDir: 'out',
  server: {
    // For a "Live" app experience that stays in sync with your web updates:
    url: 'https://www.dailymannaai.com', 
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
