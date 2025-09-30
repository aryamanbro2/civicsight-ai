/**
 * Report Routes (B-05, B-06)
 * Defines all report-related API endpoints
 * 
 * Features implemented:
 * - Citizen report creation and management
 * - Report retrieval and filtering
 * - Status updates and tracking
 * - Media attachment support
 * 
 * @author CivicSight AI Team
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const { reportController } = require('../controllers');
const { authMiddleware } = require('../middleware');

// All report routes require authentication
router.use(authMiddleware.authenticateToken);

// Report CRUD operations
router.post('/', reportController.createReport);
router.get('/', reportController.getUserReports);
router.get('/my', reportController.getMyReports);
router.get('/:id', reportController.getReportById);
router.put('/:id/status', reportController.updateReportStatus);

module.exports = router;
