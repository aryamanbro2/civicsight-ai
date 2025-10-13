import { config } from '../config';

export interface AuthResponse {
    success?: boolean;
    message: string;
    token?: string;
    user?: {
        id: string;
        email?: string;
        phone?: string;
        name?: string;
        type?: string;
    };
    expiresIn?: string;
}

const createApiRequest = (endpoint: string, options: RequestInit = {}): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.API_TIMEOUT);

    return fetch(`${config.API_BASE_URL}${endpoint}`, {
        ...options,
        signal: controller.signal,
    }).finally(() => {
        clearTimeout(timeoutId);
    });
};

export const authService = {
    // Phone number signup to match your backend
    signupWithEmail: async (phoneOrEmail: string): Promise<AuthResponse> => {
        try {
            // Your backend expects phone, name, email
            const requestBody = {
                phone: phoneOrEmail, // Using input as phone
                name: `User ${phoneOrEmail.split('@')[0] || phoneOrEmail}`,
                email: phoneOrEmail.includes('@') ? phoneOrEmail : undefined
            };

            const response = await createApiRequest('/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();

            // Handle your backend's response format
            if (response.ok && data.token) {
                return {
                    success: true,
                    message: data.message,
                    token: data.token,
                    user: {
                        id: data.user.id,
                        email: data.user.email,
                        phone: data.user.phone,
                        name: data.user.name,
                        type: data.user.type || 'citizen'
                    },
                    expiresIn: data.expiresIn
                };
            } else {
                return {
                    success: false,
                    message: data.message || 'Signup failed',
                };
            }
        } catch (error) {
            console.error('Signup error:', error);
            if (error instanceof Error && error.name === 'AbortError') {
                return {
                    success: false,
                    message: 'Request timeout. Please try again.',
                };
            }
            return {
                success: false,
                message: 'Network error. Please check your connection.',
            };
        }
    },

    // Phone number login to match your backend
    loginWithPhone: async (phone: string): Promise<AuthResponse> => {
        try {
            const response = await createApiRequest('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone }),
            });

            const data = await response.json();

            if (response.ok && data.token) {
                return {
                    success: true,
                    message: data.message,
                    token: data.token,
                    user: {
                        id: data.user.id,
                        email: data.user.email,
                        phone: data.user.phone,
                        name: data.user.name,
                        type: data.user.type
                    },
                    expiresIn: data.expiresIn
                };
            } else {
                return {
                    success: false,
                    message: data.message || 'Login failed',
                };
            }
        } catch (error) {
            console.error('Login error:', error);
            if (error instanceof Error && error.name === 'AbortError') {
                return {
                    success: false,
                    message: 'Request timeout. Please try again.',
                };
            }
            return {
                success: false,
                message: 'Network error. Please check your connection.',
            };
        }
    },

    // Get user profile to match your backend
    getProfile: async (token: string): Promise<AuthResponse> => {
        try {
            const response = await createApiRequest('/api/auth/profile', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (response.ok) {
                return {
                    success: true,
                    message: data.message,
                    user: {
                        id: data.user.id,
                        email: data.user.email,
                        phone: data.user.phone,
                        name: data.user.name,
                        type: data.user.type
                    }
                };
            } else {
                return {
                    success: false,
                    message: data.message || 'Failed to get profile',
                };
            }
        } catch (error) {
            console.error('Get profile error:', error);
            if (error instanceof Error && error.name === 'AbortError') {
                return {
                    success: false,
                    message: 'Request timeout. Please try again.',
                };
            }
            return {
                success: false,
                message: 'Network error. Please check your connection.',
            };
        }
    },

    // Test authentication to match your backend
    testAuth: async (token: string): Promise<AuthResponse> => {
        try {
            const response = await createApiRequest('/api/auth/test', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (response.ok) {
                return {
                    success: true,
                    message: data.message,
                    user: data.user
                };
            } else {
                return {
                    success: false,
                    message: data.message || 'Authentication test failed',
                };
            }
        } catch (error) {
            console.error('Auth test error:', error);
            if (error instanceof Error && error.name === 'AbortError') {
                return {
                    success: false,
                    message: 'Request timeout. Please try again.',
                };
            }
            return {
                success: false,
                message: 'Network error. Please check your connection.',
            };
        }
    },

    // Placeholder methods
    loginWithGoogle: async (): Promise<AuthResponse> => {
        return {
            success: false,
            message: 'Google authentication not implemented yet',
        };
    },

    loginWithApple: async (): Promise<AuthResponse> => {
        return {
            success: false,
            message: 'Apple authentication not implemented yet',
        };
    },
};