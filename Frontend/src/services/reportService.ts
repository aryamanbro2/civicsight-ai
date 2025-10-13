import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '../config';

export interface CreateReportRequest {
    latitude: number;
    longitude: number;
    mediaType: 'image' | 'audio';
    mediaUrl: string;
    description: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
}

export interface Report {
    id: string;
    userId: string;
    issueType: string;
    severityScore: number;
    description: string;
    location: {
        latitude: number;
        longitude: number;
        address?: string;
        city?: string;
        state?: string;
        zipCode?: string;
    };
    media: {
        images: {
            url: string;
            caption?: string;
            uploadedAt: string;
        }[];
        audio: {
            url: string;
            duration?: number;
            uploadedAt: string;
        }[];
    };
    status: string;
    priority: string;
    tags: string[];
    submittedAt: string;
    lastUpdatedAt: string;
    fullAddress?: string;
    ageInDays?: number;
}

export interface ReportResponse {
    success?: boolean;
    message: string;
    report?: Report;
    reports?: Report[];
    pagination?: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    statistics?: {
        statusBreakdown: Record<string, number>;
        priorityBreakdown: Record<string, number>;
        issueTypeBreakdown: Record<string, number>;
    };
}

const getAuthToken = async (): Promise<string | null> => {
    return await AsyncStorage.getItem(config.AUTH_TOKEN_KEY);
};

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

export const reportService = {
    // Create a new report
    createReport: async (reportData: CreateReportRequest): Promise<ReportResponse> => {
        try {
            const token = await getAuthToken();
            if (!token) {
                return {
                    success: false,
                    message: 'Authentication required',
                };
            }

            const response = await createApiRequest('/api/reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(reportData),
            });

            const data = await response.json();

            if (response.ok) {
                return {
                    success: true,
                    message: data.message,
                    report: data.report,
                };
            } else {
                return {
                    success: false,
                    message: data.message || 'Failed to create report',
                };
            }
        } catch (error) {
            console.error('Create report error:', error);
            if (error instanceof Error && error.name === 'AbortError') {
                return {
                    success: false,
                    message: 'Request timeout. Please try again.',
                };
            }
            return {
                success: false,
                message: 'Network error. Please try again.',
            };
        }
    },

    // Get user's reports
    getMyReports: async (page = 1, limit = 20): Promise<ReportResponse> => {
        try {
            const token = await getAuthToken();
            if (!token) {
                return {
                    success: false,
                    message: 'Authentication required',
                };
            }

            const response = await createApiRequest(
                `/api/reports/my?page=${page}&limit=${limit}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (response.ok) {
                return {
                    success: true,
                    message: data.message,
                    reports: data.reports,
                    pagination: data.pagination,
                    statistics: data.statistics,
                };
            } else {
                return {
                    success: false,
                    message: data.message || 'Failed to fetch reports',
                };
            }
        } catch (error) {
            console.error('Get reports error:', error);
            if (error instanceof Error && error.name === 'AbortError') {
                return {
                    success: false,
                    message: 'Request timeout. Please try again.',
                };
            }
            return {
                success: false,
                message: 'Network error. Please try again.',
            };
        }
    },

    // Get specific report by ID
    getReportById: async (reportId: string): Promise<ReportResponse> => {
        try {
            const token = await getAuthToken();
            if (!token) {
                return {
                    success: false,
                    message: 'Authentication required',
                };
            }

            const response = await createApiRequest(`/api/reports/${reportId}`, {
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
                    report: data.report,
                };
            } else {
                return {
                    success: false,
                    message: data.message || 'Failed to fetch report',
                };
            }
        } catch (error) {
            console.error('Get report error:', error);
            if (error instanceof Error && error.name === 'AbortError') {
                return {
                    success: false,
                    message: 'Request timeout. Please try again.',
                };
            }
            return {
                success: false,
                message: 'Network error. Please try again.',
            };
        }
    },

    // Update report status
    updateReportStatus: async (reportId: string, status: string): Promise<ReportResponse> => {
        try {
            const token = await getAuthToken();
            if (!token) {
                return {
                    success: false,
                    message: 'Authentication required',
                };
            }

            const response = await createApiRequest(`/api/reports/${reportId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ status }),
            });

            const data = await response.json();

            if (response.ok) {
                return {
                    success: true,
                    message: data.message,
                    report: data.report,
                };
            } else {
                return {
                    success: false,
                    message: data.message || 'Failed to update report',
                };
            }
        } catch (error) {
            console.error('Update report error:', error);
            if (error instanceof Error && error.name === 'AbortError') {
                return {
                    success: false,
                    message: 'Request timeout. Please try again.',
                };
            }
            return {
                success: false,
                message: 'Network error. Please try again.',
            };
        }
    },
};