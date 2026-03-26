import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.xtream.iptvapp',
  appName: 'Xtream IPTV',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}

export default config
