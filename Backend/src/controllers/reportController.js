/**
 * Report Controller (B-05, B-06)
 * Handles citizen report endpoints for issue reporting system
 * 
 * Features implemented:
 * - Create new citizen reports (B-05)
 * - Media attachment support (B-06)
 * - Hardcoded ML values (B-02, B-04 placeholders)
 * - Authentication required for all operations
 * 
 * @author CivicSight AI Team
 * @version 1.0.0
 */

const { Report } = require('../models');
const mongoose = require('mongoose');

/**
 * Validate latitude and longitude coordinates
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Object} Validation result with isValid and error message
 */
const validateCoordinates = (latitude, longitude) => {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return {
      isValid: false,
      error: 'Latitude and longitude must be valid numbers'
    };
  }

  if (latitude < -90 || latitude > 90) {
    return {
      isValid: false,
      error: 'Latitude must be between -90 and 90 degrees'
    };
  }

  if (longitude < -180 || longitude > 180) {
    return {
      isValid: false,
      error: 'Longitude must be between -180 and 180 degrees'
    };
  }

  return { isValid: true };
};

/**
 * Validate media type and URL
 * @param {string} mediaType - Type of media (image, audio, video)
 * @param {string} mediaUrl - URL of the media file
 * @returns {Object} Validation result with isValid and error message
 */
const validateMedia = (mediaType, mediaUrl) => {
  const validMediaTypes = ['image', 'audio', 'video'];
  
  if (!mediaType || !validMediaTypes.includes(mediaType.toLowerCase())) {
    return {
      isValid: false,
      error: `Media type must be one of: ${validMediaTypes.join(', ')}`
    };
  }

  if (!mediaUrl || typeof mediaUrl !== 'string') {
    return {
      isValid: false,
      error: 'Media URL is required and must be a string'
    };
  }

  // Basic URL validation
  try {
    new URL(mediaUrl);
  } catch (error) {
    return {
      isValid: false,
      error: 'Media URL must be a valid URL'
    };
  }

  return { isValid: true };
};

/**
 * Create a new citizen report (B-05, B-06)
 * POST /api/reports
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createReport = async (req, res) => {
  try {
    const { latitude, longitude, mediaType, mediaUrl, description, address, city, state, zipCode } = req.body;
    const userId = req.userId; // From auth middleware

    // Validate required fields
    if (!latitude || longitude === undefined) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Latitude and longitude are required',
        code: 'MISSING_COORDINATES'
      });
    }

    if (!mediaType || !mediaUrl) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Media type and media URL are required',
        code: 'MISSING_MEDIA'
      });
    }

    if (!description || description.trim().length === 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Report description is required',
        code: 'MISSING_DESCRIPTION'
      });
    }

    // Validate coordinates
    const coordValidation = validateCoordinates(latitude, longitude);
    if (!coordValidation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        message: coordValidation.error,
        code: 'INVALID_COORDINATES'
      });
    }

    // Validate media
    const mediaValidation = validateMedia(mediaType, mediaUrl);
    if (!mediaValidation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        message: mediaValidation.error,
        code: 'INVALID_MEDIA'
      });
    }

    // Create media object based on type (B-06)
    let mediaObject = {
      images: [],
      audio: []
    };

    if (mediaType.toLowerCase() === 'image') {
      mediaObject.images = [{
        url: mediaUrl,
        caption: description.substring(0, 200), // Truncate for caption
        uploadedAt: new Date()
      }];
    } else if (mediaType.toLowerCase() === 'audio') {
      mediaObject.audio = [{
        url: mediaUrl,
        duration: 0, // Placeholder duration
        uploadedAt: new Date()
      }];
    }

    // Create new report with hardcoded ML values (B-02, B-04 placeholders)
    const reportData = {
      userId: userId, // Keep as string for now since we're using mock auth
      issueType: 'pothole', // Hardcoded as per ML exclusion rule (B-02 placeholder)
      severityScore: 4, // Hardcoded as per ML exclusion rule (B-04 placeholder)
      description: description.trim(),
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address: address || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null
      },
      media: mediaObject,
      status: 'submitted',
      priority: 'high', // Auto-calculated from severityScore (4 = high)
      tags: ['pothole', 'road', 'safety'], // Default tags for pothole
      contactPreferences: {
        allowUpdates: true,
        allowFollowUp: true,
        preferredContactMethod: 'push_notification'
      },
      metadata: {
        source: 'mobile_app',
        deviceInfo: {
          platform: req.headers['user-agent']?.includes('iPhone') ? 'iOS' : 'Android',
          version: '1.0.0',
          model: 'Unknown'
        }
      }
    };

    // Create and save the report
    const newReport = new Report(reportData);
    const savedReport = await newReport.save();

    console.log(`📝 New report created: ${savedReport._id} by user ${userId}`);

    // Return the created report (excluding sensitive data)
    res.status(201).json({
      message: 'Report created successfully',
      report: {
        id: savedReport._id,
        userId: savedReport.userId,
        issueType: savedReport.issueType,
        severityScore: savedReport.severityScore,
        description: savedReport.description,
        location: savedReport.location,
        media: savedReport.media,
        status: savedReport.status,
        priority: savedReport.priority,
        tags: savedReport.tags,
        submittedAt: savedReport.submittedAt,
        fullAddress: savedReport.fullAddress,
        ageInDays: savedReport.ageInDays
      }
    });

  } catch (error) {
    console.error('Create report error:', error);

    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Report data validation failed',
        details: validationErrors,
        code: 'REPORT_VALIDATION_ERROR'
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid data format',
        message: 'One or more fields have invalid data types',
        code: 'INVALID_DATA_FORMAT'
      });
    }

    // Generic error response
    res.status(500).json({
      error: 'Report creation failed',
      message: 'Internal server error while creating report',
      code: 'REPORT_CREATION_ERROR'
    });
  }
};

/**
 * Get user's reports (alias for getUserReports)
 * GET /api/reports
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserReports = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 10, status } = req.query;

    // Build query
    const query = { userId: userId };
    if (status) {
      query.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Get reports with pagination
    const reports = await Report.find(query)
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select('-metadata.ipAddress -metadata.userAgent'); // Exclude sensitive data

    // Get total count for pagination
    const totalCount = await Report.countDocuments(query);

    console.log(`📊 Retrieved ${reports.length} reports for user ${userId}`);

    res.json({
      message: 'Reports retrieved successfully',
      reports: reports.map(report => ({
        id: report._id,
        issueType: report.issueType,
        severityScore: report.severityScore,
        description: report.description,
        location: report.location,
        media: report.media,
        status: report.status,
        priority: report.priority,
        tags: report.tags,
        submittedAt: report.submittedAt,
        lastUpdatedAt: report.lastUpdatedAt,
        fullAddress: report.fullAddress,
        ageInDays: report.ageInDays
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limitNum),
        totalCount,
        hasNext: skip + limitNum < totalCount,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get user reports error:', error);
    res.status(500).json({
      error: 'Report retrieval failed',
      message: 'Internal server error while fetching reports',
      code: 'REPORT_RETRIEVAL_ERROR'
    });
  }
};

/**
 * Get user's reports (my reports endpoint)
 * GET /api/reports/my
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMyReports = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20, status, issueType, priority } = req.query;

    // Build query for user's reports
    const query = { userId: userId };
    
    // Add optional filters
    if (status) {
      query.status = status;
    }
    if (issueType) {
      query.issueType = issueType;
    }
    if (priority) {
      query.priority = priority;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Get reports with pagination, sorted by creation date descending
    const reports = await Report.find(query)
      .sort({ submittedAt: -1 }) // Sort by creation date descending
      .skip(skip)
      .limit(limitNum)
      .select('-metadata.ipAddress -metadata.userAgent'); // Exclude sensitive data

    // Get total count for pagination
    const totalCount = await Report.countDocuments(query);

    // Get summary statistics
    const statusCounts = await Report.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const priorityCounts = await Report.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    const issueTypeCounts = await Report.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: '$issueType', count: { $sum: 1 } } }
    ]);

    console.log(`📊 Retrieved ${reports.length} reports for user ${userId} (my reports)`);

    res.json({
      message: 'My reports retrieved successfully',
      reports: reports.map(report => ({
        id: report._id,
        issueType: report.issueType,
        severityScore: report.severityScore,
        description: report.description,
        location: report.location,
        media: report.media,
        status: report.status,
        priority: report.priority,
        tags: report.tags,
        assignedTo: report.assignedTo,
        resolution: report.resolution,
        submittedAt: report.submittedAt,
        lastUpdatedAt: report.lastUpdatedAt,
        fullAddress: report.fullAddress,
        ageInDays: report.ageInDays
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limitNum),
        totalCount,
        hasNext: skip + limitNum < totalCount,
        hasPrev: page > 1
      },
      statistics: {
        statusBreakdown: statusCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        priorityBreakdown: priorityCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        issueTypeBreakdown: issueTypeCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('Get my reports error:', error);
    res.status(500).json({
      error: 'Report retrieval failed',
      message: 'Internal server error while fetching my reports',
      code: 'MY_REPORTS_RETRIEVAL_ERROR'
    });
  }
};

/**
 * Get a specific report by ID
 * GET /api/reports/:id
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Invalid report ID',
        message: 'Report ID must be a valid MongoDB ObjectId',
        code: 'INVALID_REPORT_ID'
      });
    }

    // Find report by ID and user ID (users can only access their own reports)
    const report = await Report.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: userId
    });

    if (!report) {
      return res.status(404).json({
        error: 'Report not found',
        message: 'Report not found or you do not have permission to access it',
        code: 'REPORT_NOT_FOUND'
      });
    }

    console.log(`📄 Retrieved report ${id} for user ${userId}`);

    res.json({
      message: 'Report retrieved successfully',
      report: {
        id: report._id,
        userId: report.userId,
        issueType: report.issueType,
        severityScore: report.severityScore,
        description: report.description,
        location: report.location,
        media: report.media,
        status: report.status,
        priority: report.priority,
        tags: report.tags,
        assignedTo: report.assignedTo,
        resolution: report.resolution,
        contactPreferences: report.contactPreferences,
        submittedAt: report.submittedAt,
        lastUpdatedAt: report.lastUpdatedAt,
        fullAddress: report.fullAddress,
        ageInDays: report.ageInDays
      }
    });

  } catch (error) {
    console.error('Get report by ID error:', error);
    res.status(500).json({
      error: 'Report retrieval failed',
      message: 'Internal server error while fetching report',
      code: 'REPORT_RETRIEVAL_ERROR'
    });
  }
};

/**
 * Update report status (for testing purposes)
 * PUT /api/reports/:id/status
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.userId;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Invalid report ID',
        message: 'Report ID must be a valid MongoDB ObjectId',
        code: 'INVALID_REPORT_ID'
      });
    }

    // Validate status
    const validStatuses = ['submitted', 'under_review', 'in_progress', 'resolved', 'rejected', 'duplicate'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: `Status must be one of: ${validStatuses.join(', ')}`,
        code: 'INVALID_STATUS'
      });
    }

    // Find and update report
    const report = await Report.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        userId: userId
      },
      { 
        status,
        lastUpdatedAt: new Date()
      },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({
        error: 'Report not found',
        message: 'Report not found or you do not have permission to update it',
        code: 'REPORT_NOT_FOUND'
      });
    }

    console.log(`📝 Updated report ${id} status to ${status} by user ${userId}`);

    res.json({
      message: 'Report status updated successfully',
      report: {
        id: report._id,
        status: report.status,
        lastUpdatedAt: report.lastUpdatedAt
      }
    });

  } catch (error) {
    console.error('Update report status error:', error);
    res.status(500).json({
      error: 'Report update failed',
      message: 'Internal server error while updating report',
      code: 'REPORT_UPDATE_ERROR'
    });
  }
};

module.exports = {
  createReport,
  getUserReports,
  getMyReports,
  getReportById,
  updateReportStatus
};
