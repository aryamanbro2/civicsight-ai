import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, AuthResponse } from '../services/authService';
import { config } from '../config';

export interface User {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    phoneNumber?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    profilePicture?: string;
    type?: string;
    isVerified?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    loginWithEmail: (email: string) => Promise<AuthResponse>;
    loginWithPhone: (phone: string) => Promise<AuthResponse>;
    signupWithEmail: (email: string) => Promise<AuthResponse>;
    logout: () => Promise<void>;
    updateProfile: (userData: Partial<User>) => Promise<void>;
    loginWithGoogle: () => Promise<AuthResponse>;
    loginWithApple: () => Promise<AuthResponse>;
    login: (email: string, password: string) => Promise<AuthResponse>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStoredAuth();
    }, []);

    const loadStoredAuth = async () => {
        try {
            setIsLoading(true);
            const [storedToken, storedUser] = await Promise.all([
                AsyncStorage.getItem(config.AUTH_TOKEN_KEY),
                AsyncStorage.getItem(config.USER_DATA_KEY),
            ]);

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));

                // Test if token is still valid
                try {
                    const response = await authService.testAuth(storedToken);
                    if (!response.success) {
                        await clearAuth();
                    }
                } catch (error) {
                    console.error('Token verification failed:', error);
                    await clearAuth();
                }
            }
        } catch (error) {
            console.error('Error loading stored auth:', error);
            await clearAuth();
        } finally {
            setIsLoading(false);
        }
    };

    const storeAuth = async (authData: AuthResponse) => {
        try {
            if (authData.token && authData.user) {
                await Promise.all([
                    AsyncStorage.setItem(config.AUTH_TOKEN_KEY, authData.token),
                    AsyncStorage.setItem(config.USER_DATA_KEY, JSON.stringify(authData.user)),
                ]);
                setToken(authData.token);
                setUser(authData.user);
            }
        } catch (error) {
            console.error('Error storing auth data:', error);
            throw new Error('Failed to store authentication data');
        }
    };

    const clearAuth = async () => {
        try {
            await Promise.all([
                AsyncStorage.removeItem(config.AUTH_TOKEN_KEY),
                AsyncStorage.removeItem(config.USER_DATA_KEY),
            ]);
            setToken(null);
            setUser(null);
        } catch (error) {
            console.error('Error clearing auth data:', error);
        }
    };

    const loginWithEmail = async (email: string): Promise<AuthResponse> => {
        try {
            setIsLoading(true);
            const response = await authService.signupWithEmail(email);

            if (response.success && response.token && response.user) {
                await storeAuth(response);
            }

            return response;
        } catch (error) {
            console.error('Email login error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithPhone = async (phone: string): Promise<AuthResponse> => {
        try {
            setIsLoading(true);
            const response = await authService.loginWithPhone(phone);

            if (response.success && response.token && response.user) {
                await storeAuth(response);
            }

            return response;
        } catch (error) {
            console.error('Phone login error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const signupWithEmail = async (email: string): Promise<AuthResponse> => {
        try {
            setIsLoading(true);
            const response = await authService.signupWithEmail(email);

            if (response.success && response.token && response.user) {
                await storeAuth(response);
            }

            return response;
        } catch (error) {
            console.error('Email signup error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithGoogle = async (): Promise<AuthResponse> => {
        try {
            setIsLoading(true);
            const response = await authService.loginWithGoogle();

            if (response.success && response.token && response.user) {
                await storeAuth(response);
            }

            return response;
        } catch (error) {
            console.error('Google login error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithApple = async (): Promise<AuthResponse> => {
        try {
            setIsLoading(true);
            const response = await authService.loginWithApple();

            if (response.success && response.token && response.user) {
                await storeAuth(response);
            }

            return response;
        } catch (error) {
            console.error('Apple login error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string): Promise<AuthResponse> => {
        try {
            setIsLoading(true);
            // For now, we'll use loginWithEmail since that's what you have
            // You can modify this to use password when your backend supports it
            const response = await authService.signupWithEmail(email);

            if (response.success && response.token && response.user) {
                await storeAuth(response);
            }

            return response;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async (): Promise<void> => {
        try {
            setIsLoading(true);
            await clearAuth();
        } catch (error) {
            console.error('Logout error:', error);
            await clearAuth();
        } finally {
            setIsLoading(false);
        }
    };

    const updateProfile = async (userData: Partial<User>): Promise<void> => {
        try {
            if (!token || !user) {
                throw new Error('User not authenticated');
            }

            setIsLoading(true);

            // Since there's no updateProfile in authService, we'll update locally
            // You can implement this API call later
            const updatedUser = { ...user, ...userData };
            await AsyncStorage.setItem(config.USER_DATA_KEY, JSON.stringify(updatedUser));
            setUser(updatedUser);

        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const value: AuthContextType = {
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        loginWithEmail,
        loginWithPhone,
        signupWithEmail,
        logout,
        updateProfile,
        loginWithGoogle,
        loginWithApple,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;