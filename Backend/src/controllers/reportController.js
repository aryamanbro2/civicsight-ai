

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
    // 1. Get the public URL from Cloudinary
// We no longer need serverBaseUrl; req.file.path is the full public URL
    const publicImageUrl = req.file.path; 

    console.log(`[Report] Image uploaded, public URL: ${publicImageUrl}`);
        // 2. Call the AI Microservice
    
    // --- FIX 1: Corrected AI Endpoint URL ---
    const aiEndpoint = `${AI_SERVICE_URL}/api/ai/classify/image`;
    
    let aiResponse;
    const defaultAiResponse = { issueType: 'uncategorized', severityScore: 0, tags: [] };

    try {
      console.log(`[Report] Calling AI service at ${aiEndpoint}...`);

      const aiResult = await axios.post(aiEndpoint, {
        mediaUrl: publicImageUrl,
        description: description
      });

      // --- FIX: Check for AI-level error in a 200 OK response ---
      if (aiResult.data && aiResult.data.error) {
        console.error(`[Report] AI Service returned an error: ${aiResult.data.error}. Proceeding without AI data.`);
        aiResponse = defaultAiResponse;
      } else if (aiResult.data) {
        // This is the successful path
        aiResponse = aiResult.data;
      } else {
        // This handles empty but non-error responses
        console.warn('[Report] AI Service gave an empty response. Proceeding without AI data.');
        aiResponse = defaultAiResponse;
      }

      console.log('[Report] AI Service Response:', aiResponse);

    } catch (aiError) {
      console.error(`[Report] AI Service Network Error: ${aiError.message}. Proceeding without AI data.`);
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
const createReportWithAudio = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Validation failed', message: 'Audio file is required', code: 'MISSING_AUDIO' });
    }

    const { latitude, longitude, address, city, state, zipCode } = req.body;

    if (!latitude || !longitude) {
       return res.status(400).json({ error: 'Validation failed', message: 'Latitude and longitude are required', code: 'MISSING_FIELDS' });
    }

    // 1. Get the public URL from Cloudinary
    const publicAudioUrl = req.file.path;
    console.log(`[Report] Audio uploaded, public URL: ${publicAudioUrl}`);

    // 2. Call the AI Microservice AUDIO endpoint
    const aiEndpoint = `${AI_SERVICE_URL}/api/ai/classify/audio`;
    let aiResponse;
    const defaultAiResponse = { issueType: 'uncategorized', severityScore: 0, tags: [], description: 'Audio report (transcription pending)' };

    try {
      console.log(`[Report] Calling AI service at ${aiEndpoint}...`);

      const aiResult = await axios.post(aiEndpoint, {
        mediaUrl: publicAudioUrl,
        description: "" // Send empty description, AI will fill it
      });

      if (aiResult.data && aiResult.data.error) {
        console.error(`[Report] AI Service returned an error: ${aiResult.data.error}.`);
        aiResponse = defaultAiResponse;
      } else if (aiResult.data) {
        aiResponse = aiResult.data;
      } else {
        console.warn('[Report] AI Service gave an empty response. Proceeding without AI data.');
        aiResponse = defaultAiResponse;
      }
      console.log('[Report] AI Service Response:', aiResponse);
      
    } catch (aiError) {
      console.error(`[Report] AI Service Network Error: ${aiError.message}.`);
      aiResponse = defaultAiResponse;
    }

    // AI will return a 'non-civic-issue' type if transcription is just noise
    if (aiResponse.issueType === 'non-civic-issue') {
      return res.status(422).json({
        error: 'Invalid Issue',
        message: 'Audio does not appear to describe a civic issue.',
        code: 'NON_CIVIC_ISSUE'
      });
    }

    // 3. Derive severity/priority from the AI's score
    const score = aiResponse.severityScore || 0;
    let severity = 'low';
    let priority = 'low';

    if (score > 4) {
        severity = 'high';
        priority = 'high';
    } else if (score > 2) {
        severity = 'medium';
        priority = 'medium';
    }

    // 4. Create and save the new report
    const newReport = new Report({
      userId,
      // Use transcription from AI as the description
      description: aiResponse.description || 'Audio report (transcription failed)',
      issueType: aiResponse.issueType || 'uncategorized',
      mediaUrl: publicAudioUrl,
      mediaType: 'audio', // Set media type
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        address: address || 'Unknown address',
        city: city || '',
        state: state || '',
        zipCode: zipCode || ''
      },
      status: 'pending',
      severity: severity,
      priority: priority,
      severityScore: score,
      aiMetadata: aiResponse
    });

    await newReport.save();
    
    console.log(`[Report] New audio report created: ${newReport._id} by user ${userId}`);

    res.status(201).json({
      message: 'Report created successfully from audio',
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

module.exports = {
  createReport,
  getReports,
  getMyReports,
  getReportById,
  updateReportStatus,
  createReportWithAudio
};