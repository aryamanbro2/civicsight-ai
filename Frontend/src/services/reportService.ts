import apiClient from '../../api/axiosConfig';

// --- Interfaces ---

export interface Report {
  id: string;
  userId: string;
  issueType: string;
  description: string;
  mediaUrl: string; 
  mediaType: 'image' | 'video' | 'audio';
  location: {
    coordinates: [number, number];
    address: string;
  };
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  createdAt: string; 
  updatedAt: string; 
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
  imageUri: string; // The local file URI from the camera
}

// Data for AUDIO reports
export interface CreateReportAudioData {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  audioUri: string; // The local file URI from the recorder
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
  statistics?: any; // For 'my' reports
}

// --- API Service ---

/**
 * Creates a new report by uploading an IMAGE and form data
 * @param {CreateReportData} data - The report data from the form
 * @returns {Promise<CreateReportResponse>}
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
 * Creates a new report by uploading an AUDIO file and form data
 * @param {CreateReportAudioData} data - The report data from the form
 * @returns {Promise<CreateReportResponse>}
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

    const uri = data.audioUri;
    formData.append('audio', {
      uri,
      name: `audio-${Date.now()}.m4a`,
      type: 'audio/m4a',
    } as any);

    const response = await apiClient.post('/reports/audio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  } catch (error: any) {
    console.error('Error creating audio report:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to create audio report');
  }
};


/**
* Fetches the reports for the currently authenticated user
* @returns {Promise<ListReportsResponse>}
*/
const getMyReports = async (page = 1, limit = 10): Promise<ListReportsResponse> => {
  try {
    const response = await apiClient.get('/reports/my', {
      params: { page, limit },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching my reports:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch reports');
  }
};

/**
* Fetches all reports for the dashboard feed
* @returns {Promise<ListReportsResponse>}
*/
const getAllReports = async (page = 1, limit = 10): Promise<ListReportsResponse> => {
  try {
    const response = await apiClient.get('/reports', {
      params: { page, limit },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching all reports:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch reports');
  }
};

export const reportService = {
  createReport,
  createReportWithAudio,
  getMyReports,
  getAllReports,
};