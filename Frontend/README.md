# CivicSight AI Mobile App

React Native mobile application for citizen issue reporting with NativeWind (Tailwind CSS) styling.

## Features

- 🏛️ **Citizen Issue Reporting** - Report civic issues with photos and location
- 🤖 **AI-Powered Analysis** - Automatic issue classification and priority scoring
- 📊 **Real-time Tracking** - Track report status and get updates
- 📱 **Cross-Platform** - iOS and Android support
- 🎨 **Modern UI** - NativeWind (Tailwind CSS) for beautiful, responsive design

## Tech Stack

- **React Native** 0.81.4
- **NativeWind** 4.2.1 (Tailwind CSS for React Native)
- **TypeScript** 5.8.3
- **Metro** bundler

## Getting Started

### Prerequisites

- Node.js >= 20
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development)

### Installation

1. Install dependencies:
```bash
npm install
```

2. For iOS, install CocoaPods:
```bash
cd ios && pod install && cd ..
```

### Running the App

#### Android
```bash
npm run android
```

#### iOS
```bash
npm run ios
```

#### Metro Bundler
```bash
npm start
```

## Project Structure

```
Frontend/
├── App.js                 # Main app component with NativeWind
├── global.css            # Tailwind CSS imports
├── tailwind.config.js    # Tailwind configuration
├── babel.config.js       # Babel configuration with NativeWind
├── metro.config.js       # Metro configuration with NativeWind
├── nativewind-env.d.ts   # TypeScript declarations
├── android/              # Android-specific code
├── ios/                  # iOS-specific code
└── __tests__/            # Test files
```

## NativeWind Configuration

The app is configured with NativeWind for Tailwind CSS support:

- **Tailwind Config**: Custom colors and theme configuration
- **Babel Plugin**: NativeWind babel plugin for class name transformation
- **Metro Config**: NativeWind metro plugin for CSS processing
- **Global CSS**: Tailwind directives imported globally

## Available Scripts

- `npm start` - Start Metro bundler
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## Development

The app is ready for implementing the following PRD features:

- **M-01**: Mobile Authentication (Phone number-based)
- **M-03**: Report Creation and Management
- **M-05**: Real-time Notifications
- **M-06**: Offline Support

## Styling

Use Tailwind CSS classes with NativeWind:

```jsx
<View className="bg-blue-500 p-4 rounded-lg">
  <Text className="text-white font-bold">Hello World</Text>
</View>
```

## Backend Integration

The app is designed to work with the CivicSight AI backend API:

- **Base URL**: `http://localhost:3000/api`
- **Authentication**: JWT token-based
- **Endpoints**: Auth, Reports, Health check

## License

MIT License - See LICENSE file for details