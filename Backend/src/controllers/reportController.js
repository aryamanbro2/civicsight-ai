

const { Report } = require('../models');
const axios = require('axios');

// --- AI Service Configuration ---
// FIX: Replace 'http://localhost:5000' with your public Codespace URL for port 5000.
// Find this in the "Ports" tab and make sure it's set to Public.
const AI_SERVICE_URL = 'https://bookish-space-sniffle-ggrx9pq764vcv9vp-5000.app.github.dev';

/**
 * Get the server's public URL from the request
 */
const getServerBaseUrl = (req) => {
  const host = req.get('x-forwarded-host') || req.get('host');
  const protocol = req.get('x-forwarded-proto') || req.protocol;
  return `${protocol}://${host}`;
};

/**
 * Create a new report (M-02)
 * POST /api/reports
 */
const createReport = async (req, res, next) => {
  try {
    const userId = req.userId; // From requireAuth middleware
    
    if (!req.file) {
      return res.status(400).json({ error: 'Validation failed', message: 'Image file is required', code: 'MISSING_IMAGE' });
    }

    const { latitude, longitude, description, address, city, state, zipCode } = req.body;

    if (!latitude || !longitude || !description) {
       return res.status(400).json({ error: 'Validation failed', message: 'Latitude, longitude, and description are required', code: 'MISSING_FIELDS' });
    }

    // 1. Construct the public URL for the uploaded image
    const serverBaseUrl = getServerBaseUrl(req);
    const publicImageUrl = `${serverBaseUrl}/${req.file.path}`;

    console.log(`[Report] Image uploaded, public URL: ${publicImageUrl}`);

    // 2. Call the AI Microservice
    
    // --- FIX 1: Corrected AI Endpoint URL ---
    const aiEndpoint = `${AI_SERVICE_URL}/api/ai/classify/image`;
    
    let aiResponse;
    const defaultAiResponse = { issueType: 'uncategorized', severityScore: 0, tags: [] };

    try {
      console.log(`[Report] Calling AI service at ${aiEndpoint}...`);

      // --- FIX 2: Corrected AI Request Payload ---
      const aiResult = await axios.post(aiEndpoint, {
        mediaUrl: publicImageUrl,
        description: description
      });
      
      aiResponse = aiResult.data ? aiResult.data : defaultAiResponse;
      console.log('[Report] AI Service Response:', aiResponse);
      
    } catch (aiError) {
      console.error(`[Report] AI Service Error: ${aiError.message}. Proceeding without AI data.`);
      aiResponse = defaultAiResponse;
    }

    // --- FIX 3: Correctly parse AI response (camelCase) ---
    const score = aiResponse.severityScore || 0;
    let severity = 'low';
    let priority = 'low';

    // Derive severity/priority from the AI's score
    if (score > 4) {
        severity = 'high';
        priority = 'high';
    } else if (score > 2) {
        severity = 'medium';
        priority = 'medium';
    }

    // 3. Create and save the new report to MongoDB
    const newReport = new Report({
      userId,
      issueType: aiResponse.issueType || 'uncategorized', // Use camelCase
      description,
      mediaUrl: req.file.path,
      mediaType: 'image',
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        address: address || 'Unknown address',
        city: city || '',
        state: state || '',
        zipCode: zipCode || ''
      },
      status: 'pending',
      severity: severity, // Use derived severity
      priority: priority, // Use derived priority
      severityScore: aiResponse.severityScore || 0, // Use camelCase
      aiMetadata: aiResponse
    });

    await newReport.save();
    
    console.log(`[Report] New report created: ${newReport._id} by user ${userId}`);

    res.status(201).json({
      message: 'Report created successfully',
      success: true,
      report: newReport
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        message: error.message,
        code: 'VALIDATION_ERROR'
      });
    }
    next(error);
  }
};

/**
 * Get all reports (M-02)
 * GET /api/reports
 */
const getReports = async (req, res, next) => {
  try {
    const reports = await Report.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      message: 'Reports retrieved successfully',
      success: true,
      count: reports.length,
      reports: reports
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get reports for the authenticated user (M-02)
 * GET /api/reports/my
 */
const getMyReports = async (req, res, next) => {
  try {
    const myReports = await Report.find({ userId: req.userId }).sort({ createdAt: -1 });

    const stats = {
      total: myReports.length,
      pending: myReports.filter(r => r.status === 'pending').length,
      in_progress: myReports.filter(r => r.status === 'in_progress').length,
      completed: myReports.filter(r => r.status === 'completed').length,
    };

    res.json({
      message: 'User reports retrieved successfully',
      success: true,
      count: myReports.length,
      reports: myReports,
      statistics: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single report by ID (M-02)
 * GET /api/reports/:id
 */
const getReportById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const report = await Report.findById(id).populate('userId', 'name email');

    if (!report) {
      return res.status(404).json({ error: 'Report not found', code: 'NOT_FOUND' });
    }

    res.json({
      message: 'Report retrieved successfully',
      success: true,
      report
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update report status (M-02)
 * PUT /api/reports/:id/status
 */
const updateReportStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'in_progress', 'completed', 'rejected'].includes(status)) {
      return res.status(404).json({ error: 'Validation failed', message: 'Invalid status', code: 'INVALID_STATUS' });
    }

    const updatedReport = await Report.findByIdAndUpdate(
      id,
      { status: status },
      { new: true, runValidators: true }
    );

    if (!updatedReport) {
      return res.status(404).json({ error: 'Report not found', code: 'NOT_FOUND' });
    }

    console.log(`[Report] Status for ${id} updated to ${status} by user ${req.userId}`);

    res.json({
      message: 'Report status updated successfully',
      success: true,
      report: updatedReport
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReport,
  getReports,
  getMyReports,
  getReportById,
  updateReportStatus
};