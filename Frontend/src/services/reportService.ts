import apiClient from '../../api/axiosConfig';

// --- Interfaces ---

// This interface now includes the new `upvotes` field
export interface Report {
  id: string; // This is `_id` from MongoDB, but transformed
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
  upvotes: string[];
  upvoteCount: number; // <-- ADD THIS LINE // <-- ADDED FOR UPVOTE FEATURE
}

// Data for IMAGE reports
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

// Data for AUDIO reports
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

// Response for creating/upvoting a report
export interface CreateReportResponse {
  message: string;
  success: boolean;
  report: Report;
}

// Response for getting a list of reports
export interface ListReportsResponse {
  message: string;
  success: boolean;
  count: number;
  reports: Report[];
  statistics?: any; // For 'my' reports
}

// --- NEW Interfaces for Comments ---
export interface CommentUser {
  _id: string; // Note: This will be the ID, not id
  name: string;
  email: string;
}

export interface ReportComment {
  _id: string;
  text: string;
  reportId: string;
  userId: CommentUser; // This will be populated by the backend
  createdAt: string;
  updatedAt: string;
}

export interface ListCommentsResponse {
  message: string;
  success: boolean;
  count: number;
  comments: ReportComment[];
}

export interface CreateCommentResponse {
  message: string;
  success: boolean;
  comment: ReportComment;
}

// --- API Service ---

/**
 * CRITICAL FIX: This helper catches ALL auth-related errors,
 * not just 'TOKEN_EXPIRED'.
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
// In Frontend/src/services/reportService.ts

// In Frontend/src/services/reportService.ts

const getMyReports = async (page = 1, limit = 10): Promise<ListReportsResponse> => {
  try {
    const response = await apiClient.get('/reports/my', {
      params: { page, limit },
    });

    // --- ADD THIS CHECK ---
    if (!response.data) {
      throw new Error("Received an empty response from the server.");
    }
    // --- END ADD ---

    return response.data;
  } catch (error: any) {
    console.error('Error fetching my reports:', error.response?.data || error.message);
    
    if (isAuthError(error)) {
        throw new Error(error.response?.data?.message || 'Authentication error. Please sign in again.');
    }
    // This will now catch the error we threw above
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch reports');
  }
};
/**
* Fetches all reports for the dashboard feed
*/
// In Frontend/src/services/reportService.ts

// In Frontend/src/services/reportService.ts

const getAllReports = async (page = 1, limit = 10): Promise<ListReportsResponse> => {
  try {
    const response = await apiClient.get('/reports', {
      params: { page, limit },
    });

    // --- ADD THIS CHECK ---
    if (!response.data) {
      throw new Error("Received an empty response from the server.");
    }
    // --- END ADD ---

    return response.data;
  } catch (error: any) {
    console.error('Error fetching all reports:', error.response?.data || error.message);
    
    if (isAuthError(error)) {
        throw new Error(error.response?.data?.message || 'Authentication error. Please sign in again.');
    }
    // This will now catch the error we threw above
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch reports');
  }
};
/**
 * Creates a new report by uploading an IMAGE and form data
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
  } catch (error: any) {
    console.error('Error creating audio report:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to create audio report');
  }
};

// --- NEW FUNCTIONS FOR UPVOTES & COMMENTS ---

/**
 * Toggles an upvote on a report
 */
const upvoteReport = async (reportId: string): Promise<CreateReportResponse> => {
  try {
    // This re-uses the CreateReportResponse as they are compatible
    const response = await apiClient.put(`/reports/${reportId}/upvote`);
    return response.data;
  } catch (error: any) {
    console.error('Error upvoting report:', error.response?.data || error.message);
    if (isAuthError(error)) {
      throw new Error(error.response?.data?.message || 'Authentication error. Please sign in again.');
    }
    throw new Error(error.response?.data?.message || 'Failed to upvote report');
  }
};

/**
 * Gets all comments for a report
 */
const getComments = async (reportId: string): Promise<ListCommentsResponse> => {
  try {
    const response = await apiClient.get(`/reports/${reportId}/comments`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching comments:', error.response?.data || error.message);
    if (isAuthError(error)) {
      throw new Error(error.response?.data?.message || 'Authentication error. Please sign in again.');
    }
    throw new Error(error.response?.data?.message || 'Failed to fetch comments');
  }
};

/**
 * Posts a new comment
 */
const postComment = async (reportId: string, text: string): Promise<CreateCommentResponse> => {
  try {
    const response = await apiClient.post(`/reports/${reportId}/comments`, { text });
    return response.data;
  } catch (error: any) {
    console.error('Error posting comment:', error.response?.data || error.message);
    if (isAuthError(error)) {
      throw new Error(error.response?.data?.message || 'Authentication error. Please sign in again.');
    }
    throw new Error(error.response?.data?.message || 'Failed to post comment');
  }
};
const getVerifiedReports = async (): Promise<ListReportsResponse> => {
  try {
    const response = await apiClient.get('/reports/verified');
    
    if (!response.data) {
      throw new Error("Received an empty response from the server.");
    }
    return response.data;
  } catch (error: any) {
    console.error('Error fetching verified reports:', error.response?.data || error.message);
    if (isAuthError(error)) {
        throw new Error(error.response?.data?.message || 'Authentication error. Please sign in again.');
    }
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch reports');
  }
};
// --- Exports ---

// Named exports for individual use in screens
export { 
  createReport, 
  createReportWithAudio, 
  getMyReports, 
  getAllReports,
  upvoteReport,
  getComments,
  postComment,
  getVerifiedReports,
};

// Default export object for convenience
export const reportService = {
  createReport,
  createReportWithAudio,
  getMyReports,
  getAllReports,
  upvoteReport,
  getComments,
  postComment,
  getVerifiedReports,
};