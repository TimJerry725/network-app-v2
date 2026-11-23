const { expo } = require('./app.json');

const googleMapsApiKey =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
  'AIzaSyBwqLIWDCYD1eeQIbS9olF8ad87eU9cGoI';

module.exports = ({ config }) => ({
  ...config,
  ...expo,
  plugins: [
    ...(expo.plugins ?? []),
    'expo-font',
    'expo-status-bar',
  ],
  ios: {
    ...expo.ios,
    config: {
      ...(expo.ios?.config ?? {}),
      googleMapsApiKey,
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    ...expo.android,
    config: {
      ...(expo.android?.config ?? {}),
      googleMaps: {
        ...(expo.android?.config?.googleMaps ?? {}),
        apiKey: googleMapsApiKey,
      },
    },
  },
  extra: {
    eas: {
      projectId: "f9f0d727-f8cf-459a-965c-2fa86a97413d",
    },
  },
});
