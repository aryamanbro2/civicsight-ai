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
  createReportWithAudio // Import new controller
} = require('../controllers/reportController');
const { requireAuth } = require('../middleware/auth');
const { storage } = require('../config/cloudinary'); // Import Cloudinary storage

const router = express.Router();

// --- Multer Configuration ---

// Multer instance for image uploads
const uploadImage = multer({ 
  storage: storage, 
  limits: { fileSize: 1024 * 1024 * 10 } // 10MB limit
});

// Multer instance for audio uploads
const uploadAudio = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 20 } // 20MB limit for audio
});

// --- Report Routes (Protected by Auth) ---

// POST /api/reports
// Create a new report (from image)
router.post('/', requireAuth, uploadImage.single('image'), createReport);

// POST /api/reports/audio
// Create a new report (from audio)
router.post('/audio', requireAuth, uploadAudio.single('audio'), createReportWithAudio);

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
router.put('/:id/status', requireAuth, updateReportStatus); // TODO: Add authority role check

module.exports = router;