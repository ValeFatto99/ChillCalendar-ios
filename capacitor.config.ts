import type { CapacitorConfig } from '@capacitor/cli'

// The app is a thin native shell around the live web app: it loads the deployed
// site (server.url) and exposes the native plugins (push) to it. The web app
// (components/NativePush.tsx) handles the FCM registration.
const config: CapacitorConfig = {
  appId: 'com.chillcalendar.app',
  appName: 'ChillCalendar',
  webDir: 'www',
  server: {
    url: 'https://chillcalendar.vercel.app',
    // The site is served over HTTPS, so no cleartext needed.
    cleartext: false,
    // Keep navigation to the app domain inside the app.
    allowNavigation: ['chillcalendar.vercel.app'],
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
}

export default config
