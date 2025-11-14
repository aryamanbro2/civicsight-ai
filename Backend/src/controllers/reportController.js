const { Report } = require('../models');
const axios = require('axios');

// --- AI Service Configuration ---
const AI_SERVICE_URL = 'https://bookish-space-sniffle-ggrx9pq764vcv9vp-5000.app.github.dev';

/**
 * Create a new report (M-02) - IMAGE + TEXT
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

    const publicImageUrl = req.file.path; 
    console.log(`[Report] Image uploaded, public URL: ${publicImageUrl}`);
        
    const aiEndpoint = `${AI_SERVICE_URL}/api/ai/classify/image`;
    let aiResponse;
    const defaultAiResponse = { issueType: 'uncategorized', severityScore: 0, tags: [] };

    try {
      console.log(`[Report] Calling AI service at ${aiEndpoint}...`);
      const aiResult = await axios.post(aiEndpoint, {
        mediaUrl: publicImageUrl,
        description: description
      });

      if (aiResult.data && aiResult.data.error) {
        console.error(`[Report] AI Service returned an error: ${aiResult.data.error}.`);
        aiResponse = defaultAiResponse;
      } else if (aiResult.data) {
        aiResponse = aiResult.data;
      } else {
        console.warn('[Report] AI Service gave an empty response.');
        aiResponse = defaultAiResponse;
      }
      console.log('[Report] AI Service Response:', aiResponse);
    } catch (aiError) {
      console.error(`[Report] AI Service Network Error: ${aiError.message}.`);
      aiResponse = defaultAiResponse;
    }

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

    // 3. Create and save the new report to MongoDB
    const newReport = new Report({
      userId,
      issueType: aiResponse.issueType || 'uncategorized',
      description,
      
      // CHANGED: Use new model fields
      imageUrl: publicImageUrl,
      audioUrl: null, // No audio for this report type

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
      severityScore: aiResponse.severityScore || 0,
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

/**
 * Create a new report (M-02) - AUDIO-ONLY or IMAGE+AUDIO
 * POST /api/reports/audio
 */
const createReportWithAudio = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    // CHANGED: Now using req.files from uploadCombo.fields
    const imageFile = req.files.image ? req.files.image[0] : null;
    const audioFile = req.files.audio ? req.files.audio[0] : null;

    if (!audioFile) {
      return res.status(400).json({ error: 'Validation failed', message: 'Audio file is required', code: 'MISSING_AUDIO' });
    }

    const { latitude, longitude, address, city, state, zipCode } = req.body;

    if (!latitude || !longitude) {
       return res.status(400).json({ error: 'Validation failed', message: 'Latitude and longitude are required', code: 'MISSING_FIELDS' });
    }

    // 1. Get public URLs from Cloudinary
    const publicAudioUrl = audioFile.path;
    const publicImageUrl = imageFile ? imageFile.path : null; // Get image path if it exists
    
    console.log(`[Report] Audio uploaded, public URL: ${publicAudioUrl}`);
    if (publicImageUrl) {
      console.log(`[Report] Image (combo) uploaded, public URL: ${publicImageUrl}`);
    }

    // 2. Call the AI Microservice AUDIO endpoint
    const aiEndpoint = `${AI_SERVICE_URL}/api/ai/classify/audio`;
    let aiResponse;
    const defaultAiResponse = { issueType: 'uncategorized', severityScore: 0, tags: [], description: 'Audio report (transcription pending)' };

    try {
      console.log(`[Report] Calling AI service at ${aiEndpoint}...`);

      const aiResult = await axios.post(aiEndpoint, {
        mediaUrl: publicAudioUrl,
        description: "" // Send empty description, AI will fill it
      }, {
        timeout: 240000 
      });

      if (aiResult.data && aiResult.data.error) {
        console.error(`[Report] AI Service returned an error: ${aiResult.data.error}.`);
        aiResponse = defaultAiResponse;
      } else if (aiResult.data) {
        aiResponse = aiResult.data;
      } else {
        console.warn('[Report] AI Service gave an empty response.');
        aiResponse = defaultAiResponse;
      }
      console.log('[Report] AI Service Response:', aiResponse);
      
    } catch (aiError) {
      console.error(`[Report] AI Service Network Error: ${aiError.message}.`);
      aiResponse = defaultAiResponse;
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
      
      // CHANGED: Use new model fields
      imageUrl: publicImageUrl, // Will be NULL for audio-only, POPULATED for combo
      audioUrl: publicAudioUrl,  // Will always be populated here

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