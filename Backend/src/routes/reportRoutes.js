/**
 * Report Routes (R-02)
 * Defines API endpoints for managing civic issue reports.
 * Uses Cloudinary for production-ready file storage (both image and audio).
 */

const express = require('express');
const multer = require('multer');
const { 
  createReport, 
  getReports, 
  getMyReports, 
  getReportById, 
  updateReportStatus,
  createReportWithAudio 
} = require('../controllers/reportController');
const { requireAuth } = require('../middleware/auth');
const { storage, audioStorage } = require('../config/cloudinary'); 

const router = express.Router();

// --- Multer Configuration ---

// Multer instance for IMAGE-ONLY uploads (remains the same)
const uploadImage = multer({ 
  storage: storage, 
  limits: { fileSize: 1024 * 1024 * 10 } // 10MB limit
});

// CHANGED: Multer instance for AUDIO and COMBO (Image+Audio) uploads
const uploadCombo = multer({
  storage: audioStorage, // Use audioStorage (assuming it's set to resource_type: 'auto')
  limits: { fileSize: 1024 * 1024 * 20 } // 20MB limit
});

// --- Report Routes (Protected by Auth) ---

// POST /api/reports
// Create a new report (from image+text)
router.post('/', requireAuth, uploadImage.single('image'), createReport);

// POST /api/reports/audio
// CHANGED: This route now handles AUDIO-ONLY and IMAGE+AUDIO reports
router.post('/audio', 
  requireAuth, 
  uploadCombo.fields([ // Use .fields()
    { name: 'audio', maxCount: 1 },
    { name: 'image', maxCount: 1 } // Also look for an image
  ]), 
  createReportWithAudio
);

// GET /api/reports
// Get all reports (for map/feed - requires auth)
router.get('/', requireAuth, getReports);

// GET /api/reports/my
// Get reports submitted by the authenticated user
router.get('/my', requireAuth, getMyReports);

// GET /api/reports/:id
// Get a single report by ID
router.get('/:id', requireAuth, getReportById);

// PUT /api/reports/:id/status
// Update a report's status (for authorities)
router.put('/:id/status', requireAuth, updateReportStatus); 

module.exports = router;