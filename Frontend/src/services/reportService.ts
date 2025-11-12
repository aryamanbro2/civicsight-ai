import apiClient from '../../api/axiosConfig';
// You can remove this type, we will redefine it
// import { CreateReportRequest, CreateReportResponse } from '../components/types'; 

// --- Interfaces ---
// (We define the types here for simplicity)

export interface Report {
  id: string;
  userId: string;
  issueType: string;
  description: string;
  mediaUrl: string; // This will be a path like 'uploads/image-123.jpg'
  mediaType: 'image' | 'video' | 'audio';
  location: {
    coordinates: [number, number];
    address: string;
  };
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
}

// This is the data object the IssueFormScreen will create
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

export interface CreateReportResponse {
  message: string;
  success: boolean;
  report: Report;
}

export interface MyReportsResponse {
  message: string;
  success: boolean;
  count: number;
  reports: Report[];
  statistics: any; // Add a proper type for stats later
}

// --- API Service ---

/**
 * Creates a new report by uploading the image and form data
 * @param {CreateReportData} data - The report data from the form
 * @returns {Promise<CreateReportResponse>}
 */
const createReport = async (data: CreateReportData): Promise<CreateReportResponse> => {
  try {
    // 1. Create FormData
    const formData = new FormData();

    // 2. Append all the text fields
    formData.append('latitude', data.latitude.toString());
    formData.append('longitude', data.longitude.toString());
    formData.append('description', data.description);
    formData.append('address', data.address);
    formData.append('city', data.city);
    formData.append('state', data.state);
    formData.append('zipCode', data.zipCode);

    // 3. Append the image file
    const uri = data.imageUri;
    const uriParts = uri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    
    formData.append('image', {
      uri,
      name: `photo.${fileType}`,
      type: `image/${fileType}`,
    } as any); // Use 'as any' to bypass strict type checking

    // 4. Send the request with the correct headers
    const response = await apiClient.post('/reports', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        // Auth token is added by the interceptor
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('Error creating report:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to create report');
  }
};

/**
* Fetches the reports for the currently authenticated user
* @returns {Promise<MyReportsResponse>}
*/
const getMyReports = async (page = 1, limit = 10): Promise<MyReportsResponse> => {
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

export const reportService = {
  createReport,
  getMyReports,
};