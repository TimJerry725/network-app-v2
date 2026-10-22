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
      projectId: "0883145a-e086-443a-b4f4-7a3becdb7a14",
    },
  },
});
