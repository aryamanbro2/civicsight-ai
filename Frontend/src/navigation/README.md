# Navigation Implementation

This directory contains the React Navigation setup for the CivicSight AI mobile application.

## Architecture

### Navigation Structure
```
App.js
├── AppNavigator.js (Main navigation container)
    ├── Login Screen (when not authenticated)
    └── TabNavigator (when authenticated)
        ├── ReportIssueScreen (Tab 1)
        └── MyReportsScreen (Tab 2)
```

## Components

### AppNavigator.js
Main navigation container that handles:
- Authentication state management
- Conditional rendering of login vs main app
- Stack navigation for auth flow
- Integration with authentication callbacks

### TabNavigator.js
Bottom tab navigation with:
- **Report Issue Tab**: Main reporting interface (M-03 placeholder)
- **My Reports Tab**: Report management interface (M-03 placeholder)
- Custom tab bar styling with NativeWind
- Icons and labels for each tab

## Screens

### ReportIssueScreen.js
- Placeholder for M-03: Report Creation and Management
- Features preview cards for photo upload, location services, categories
- Navigation buttons to switch between tabs
- NativeWind styling consistent with design system

### MyReportsScreen.js
- Placeholder for M-03: Report Management
- Empty state when no reports exist
- Sample reports display (placeholder)
- Navigation buttons to switch between tabs
- NativeWind styling consistent with design system

## Features Implemented

### Authentication Flow
1. **Not Authenticated**: Shows LoginScreen
2. **Authenticated**: Shows TabNavigator with main app screens
3. **Automatic Check**: Checks stored auth data on app start
4. **Logout**: Clears auth data and returns to login

### Tab Navigation
- **Bottom Tab Bar**: Clean, modern design with NativeWind styling
- **Icons**: Emoji icons for each tab (📝 Report Issue, 📋 My Reports)
- **Active/Inactive States**: Color-coded tab states
- **Smooth Transitions**: React Navigation handles transitions

### Navigation Features
- **Deep Linking**: Ready for deep linking implementation
- **Navigation Props**: All screens receive navigation props
- **Tab Switching**: Easy navigation between main app sections
- **Back Button**: Proper back button handling

## Styling

All navigation components use NativeWind (Tailwind CSS):
- Consistent color scheme with primary colors
- Responsive design patterns
- Modern UI components
- Accessibility-friendly design

## Dependencies

- `@react-navigation/native` - Core navigation library
- `@react-navigation/bottom-tabs` - Tab navigation
- `@react-navigation/stack` - Stack navigation
- `react-native-screens` - Native screen optimization
- `react-native-safe-area-context` - Safe area handling

## Usage

The navigation is automatically managed by App.js:

```javascript
// App.js handles authentication and navigation
<AppNavigator
  isAuthenticated={isAuthenticated}
  user={user}
  onLoginSuccess={handleLoginSuccess}
  onLogout={handleLogout}
/>
```

## Future Enhancements

Ready for implementing:
- **M-03**: Full report creation and management screens
- **M-05**: Real-time notifications integration
- **M-06**: Offline support screens
- **Deep Linking**: URL-based navigation
- **Nested Navigation**: More complex navigation patterns

## Testing

Navigation can be tested by:
1. Starting the app (shows login screen)
2. Entering phone number and logging in
3. Verifying tab navigation works
4. Testing logout functionality
5. Verifying authentication persistence

The navigation implementation is complete and ready for use!
