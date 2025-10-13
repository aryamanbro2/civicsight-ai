export const config = {
    API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    API_TIMEOUT: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '10000', 10),
    AUTH_TOKEN_KEY: process.env.EXPO_PUBLIC_AUTH_TOKEN_KEY || 'authToken',
    USER_DATA_KEY: process.env.EXPO_PUBLIC_USER_DATA_KEY || 'userData',
} as const;