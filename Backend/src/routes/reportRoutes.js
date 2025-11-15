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
  createReportWithAudio,
  upvoteReport,             // <-- Ensures this is imported
  getCommentsForReport,     // <-- Ensures this is imported
  createCommentForReport,
  getVerifiedReports,    // <-- Ensures this is imported
} = require('../controllers/reportController');
const { requireAuth } = require('../middleware/auth');
const { storage, audioStorage } = require('../config/cloudinary'); 

const router = express.Router();

// --- Multer Configuration ---

const uploadImage = multer({ 
  storage: storage, 
  limits: { fileSize: 1024 * 1024 * 10 } // 10MB limit
});

const uploadCombo = multer({
  storage: audioStorage,
  limits: { fileSize: 1024 * 1024 * 20 } // 20MB limit
});

// --- Report Routes (Protected by Auth) ---

// POST /api/reports (Create image+text report)
router.post('/', requireAuth, uploadImage.single('image'), createReport);

// POST /api/reports/audio (Create audio-only or image+audio report)
router.post('/audio', 
  requireAuth, 
  uploadCombo.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'image', maxCount: 1 }
  ]), 
  createReportWithAudio
);

// GET /api/reports (Get all reports)
router.get('/', requireAuth, getReports);

// GET /api/reports/my (Get user's own reports)
router.get('/my', requireAuth, getMyReports);
router.get('/verified', requireAuth, getVerifiedReports);

// GET /api/reports/:id (Get single report)
router.get('/:id', requireAuth, getReportById);

// PUT /api/reports/:id/status (Update report status)
router.put('/:id/status', requireAuth, updateReportStatus); 

// --- NEW ROUTES ---

// PUT /api/reports/:id/upvote (Toggle upvote for a report)
router.put('/:id/upvote', requireAuth, upvoteReport);

// GET /api/reports/:id/comments (Get comments for a report)
router.get('/:id/comments', requireAuth, getCommentsForReport);

// POST /api/reports/:id/comments (Add a comment to a report)
router.post('/:id/comments', requireAuth, createCommentForReport);

module.exports = router;