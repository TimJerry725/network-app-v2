const { expo } = require('./app.json');

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

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
      projectId: "b1669cfa-a22f-4fbf-8c4e-5b3bb8944a76",
    },
  },
});
