import 'dotenv/config';

export default {
  expo: {
    name: "CivicSight.ai",
    slug: "civicsight-ai",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    icon: "./assets/icon.png",


    splash: {
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },

    assetBundlePatterns: ["**/*"],

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.aryamanbro.civicsightai",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },

    android: {
      package: "com.aryamanbro.civicsightai",
      adaptiveIcon: {
    foregroundImage: "./assets/icon.png",
    backgroundColor: "#ffffff"
  },
      permissions: [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.MODIFY_AUDIO_SETTINGS"
      ],
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_KEY
        }
      }
    },

    plugins: [
      ["expo-camera", {
        cameraPermission: "Allow CivicSight.ai to access your camera."
      }],
      ["expo-location", {
        locationAlwaysAndWhenInUsePermission: "Allow CivicSight.ai to use your location."
      }],
      "expo-secure-store",
      "expo-audio"
    ],

    extra: {
      eas: {
        projectId: "67560bd9-d762-4949-8dad-8a19958b812a"
      }
    }
  }
};
