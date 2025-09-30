# Screens Directory

This directory contains all the screen components for the CivicSight AI mobile application.

## Implemented Screens

### LoginScreen.js (M-01)
**Seamless Onboarding - Phone number-based authentication**

Features:
- Phone number input with validation
- NativeWind styling for modern UI
- Integration with backend auth API (`POST /api/auth/signup`)
- Automatic fallback to login for existing users
- Secure token storage using AsyncStorage
- Navigation to main app after successful authentication
- Error handling and loading states
- Keyboard-aware UI with proper input handling

**API Integration:**
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login existing user
- Stores `userToken`, `userId`, and `userData` in AsyncStorage

### MainScreen.js
**Main app screen shown after successful authentication**

Features:
- Welcome message with user information
- Basic app navigation structure
- Logout functionality with confirmation
- NativeWind styling consistent with design system
- Displays user profile information
- Placeholder buttons for future features (M-03, M-05, M-06)

## Usage

The screens are automatically managed by the main `App.js` component:

```javascript
// App.js handles authentication state and screen navigation
if (isAuthenticated && user) {
  return <MainScreen user={user} onLogout={handleLogout} />;
}

return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
```

## Styling

All screens use NativeWind (Tailwind CSS) for styling:
- Consistent color scheme with primary colors
- Responsive design patterns
- Modern UI components with proper spacing
- Accessibility-friendly text sizes and contrast

## Testing

Each screen has corresponding test files in the `__tests__` directory:
- `LoginScreen.test.js` - Tests for authentication flow
- Component rendering, input validation, API integration, error handling

## Future Screens

This directory is ready for implementing additional PRD features:
- **M-03**: Report Creation and Management screens
- **M-05**: Real-time Notifications screen
- **M-06**: Offline Support screens

## Dependencies

- `@react-native-async-storage/async-storage` - Secure data storage
- `react-native` - Core React Native components
- `nativewind` - Tailwind CSS styling
