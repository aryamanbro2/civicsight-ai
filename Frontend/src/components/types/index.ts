// --- User Model ---
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'citizen' | 'authority' | 'admin';
  // Add other user fields as needed
}

// --- Auth Credentials ---
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
  // Add other registration fields like phone, etc.
}

// --- Report Data ---
export interface ReportSubmissionResponse {
  message: string;
  report: {
    id: string;
    issueType: string;
    severityScore: number;
    priority: string;
    // Add other fields returned by Node.js backend
  }
}