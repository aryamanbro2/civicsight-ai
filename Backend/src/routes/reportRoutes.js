/**
 * Report Routes (R-02)
 * Defines API endpoints for managing civic issue reports.
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createReport, getReports, getMyReports, getReportById, updateReportStatus } = require('../controllers/reportController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// --- Multer Storage Configuration ---
const uploadDir = 'uploads/';
// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Save files to the 'uploads' directory
  },
  filename: function (req, file, cb) {
    // Create a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter, limits: { fileSize: 1024 * 1024 * 10 } }); // 10MB limit

// --- Report Routes (Protected by Auth) ---

// POST /api/reports
// Create a new report
router.post('/', requireAuth, upload.single('image'), createReport);

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