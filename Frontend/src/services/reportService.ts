// Frontend/src/services/reportService.ts

import apiClient from '../../api/axiosConfig';

// --- Interfaces ---
// (Your existing interfaces are correct)
export interface Report {
  id: string;
  userId: string;
  issueType: string;
  description: string;
  imageUrl: string | null; 
  audioUrl: string | null;
  location: {
    coordinates: [number, number];
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  severity: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high';
  severityScore: number;
  aiMetadata?: any;
  createdAt: string; 
  updatedAt: string; 
}

export interface CreateReportData {
  latitude: number;
  longitude: number;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  imageUri: string;
}

export interface CreateReportAudioData {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  audioUri: string;
  imageUri: string | null;
}

export interface CreateReportResponse {
  message: string;
  success: boolean;
  report: Report;
}

export interface ListReportsResponse {
  message: string;
  success: boolean;
  count: number;
  reports: Report[];
  statistics?: any;
}

// --- API Service ---

/**
 * REWRITTEN: Helper to check for all authentication-related errors.
 */
const isAuthError = (error: any) => {
  const code = error.response?.data?.code;
  return code === 'TOKEN_EXPIRED' || 
         code === 'USER_NOT_FOUND' || 
         code === 'INVALID_TOKEN' ||
         code === 'AUTH_REQUIRED';
};

/**
* Fetches the reports for the currently authenticated user
*/
const getMyReports = async (page = 1, limit = 10): Promise<ListReportsResponse> => {
  try {
    // This request is automatically intercepted by axiosConfig to add the token
    const response = await apiClient.get('/reports/my', {
      params: { page, limit },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching my reports:', error.response?.data || error.message);
    
    // REWRITTEN: Catch the specific auth error and throw it for the UI.
    if (isAuthError(error)) {
        // Throw the specific message from the backend (e.g., "User not found")
        throw new Error(error.response?.data?.message || 'Authentication error');
    }
    
    // Throw a generic error for other issues (e.g., server down)
    throw new Error(error.response?.data?.message || 'Failed to fetch reports');
  }
};

/**
* Fetches all reports for the dashboard feed
*/
const getAllReports = async (page = 1, limit = 10): Promise<ListReportsResponse> => {
  try {
    // This request is automatically intercepted by axiosConfig to add the token
    const response = await apiClient.get('/reports', {
      params: { page, limit },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching all reports:', error.response?.data || error.message);
    
    // REWRITTEN: Catch the specific auth error and throw it for the UI.
    if (isAuthError(error)) {
        // Throw the specific message from the backend (e.g., "User not found")
        throw new Error(error.response?.data?.message || 'Authentication error');
    }
    
    // Throw a generic error for other issues
    throw new Error(error.response?.data?.message || 'Failed to fetch reports');
  }
};

/**
 * Creates a new report by uploading an IMAGE and form data
 * (This function was correct, no changes needed)
 */
const createReport = async (data: CreateReportData): Promise<CreateReportResponse> => {
  try {
    const formData = new FormData();

    formData.append('latitude', data.latitude.toString());
    formData.append('longitude', data.longitude.toString());
    formData.append('description', data.description);
    formData.append('address', data.address);
    formData.append('city', data.city);
    formData.append('state', data.state);
    formData.append('zipCode', data.zipCode);

    const uri = data.imageUri;
    const uriParts = uri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    
    formData.append('image', {
      uri,
      name: `photo.${fileType}`,
      type: `image/${fileType}`,
    } as any); 

    const response = await apiClient.post('/reports', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  } catch (error: any) {
    console.error('Error creating report:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to create report');
  }
};

/**
 * Creates a new report by uploading an AUDIO file (and optionally an IMAGE)
 * (This function was correct, no changes needed)
 */
const createReportWithAudio = async (data: CreateReportAudioData): Promise<CreateReportResponse> => {
  try {
    const formData = new FormData();

    formData.append('latitude', data.latitude.toString());
    formData.append('longitude', data.longitude.toString());
    formData.append('address', data.address);
    formData.append('city', data.city);
    formData.append('state', data.state);
    formData.append('zipCode', data.zipCode);

    // Append audio
    const audioUri = data.audioUri;
    formData.append('audio', {
      uri: audioUri,
      name: `audio-${Date.now()}.m4a`,
      type: 'audio/m4a',
    } as any);

    // Append image if it exists
    if (data.imageUri) {
      const imgUri = data.imageUri;
      const uriParts = imgUri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      formData.append('image', {
        uri: imgUri,
        name: `photo.${fileType}`,
        type: `image/${fileType}`,
      } as any);
    }

    const response = await apiClient.post('/reports/audio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 240000, // Keep long timeout for transcription
    });

    return response.data;
  } catch (error: any)
    {
    console.error('Error creating audio report:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to create audio report');
  }
};

// --- Exports ---
// (Your existing exports are correct)
export const reportService = {
  createReport,
  createReportWithAudio,
  getMyReports,
  getAllReports,
};

export { createReport, createReportWithAudio, getMyReports, getAllReports };