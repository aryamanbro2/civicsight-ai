/**
 * Citizen Report Model (B-05)
 * Mongoose schema for citizen issue reports
 * 
 * Features implemented:
 * - User identification and location data
 * - Issue classification (placeholder for B-02 AI classification)
 * - Severity scoring (placeholder for B-04 AI scoring)
 * - Media attachment support (placeholder for B-06)
 * - Status tracking for report lifecycle
 * 
 * @author CivicSight AI Team
 * @version 1.0.0
 */

const mongoose = require('mongoose');

/**
 * Citizen Report Schema
 * Represents a citizen's issue report in the system
 */
const reportSchema = new mongoose.Schema({
  // User identification (B-01 - Authentication)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Issue classification (B-02 - AI Image Classification placeholder)
  issueType: {
    type: String,
    required: true,
    enum: [
      'pothole',
      'street_light',
      'traffic_signal',
      'garbage',
      'water_leak',
      'sewer_issue',
      'road_damage',
      'sidewalk_damage',
      'other'
    ],
    default: 'other', // Placeholder until AI classification is implemented
    index: true
  },

  // Severity scoring (B-04 - AI Severity & Priority Scoring placeholder)
  severityScore: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    default: 3, // Placeholder until AI scoring is implemented
    index: true
  },

  // Report description
  description: {
    type: String,
    required: true,
    maxlength: 1000,
    trim: true
  },

  // Location data
  location: {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    },
    address: {
      type: String,
      trim: true,
      maxlength: 200
    },
    city: {
      type: String,
      trim: true,
      maxlength: 100
    },
    state: {
      type: String,
      trim: true,
      maxlength: 100
    },
    zipCode: {
      type: String,
      trim: true,
      maxlength: 20
    }
  },

  // Media attachments (B-06 - Media Storage placeholder)
  media: {
    images: [{
      url: {
        type: String,
        required: true,
        default: 'https://mock-s3/report-id.jpg' // Placeholder URL
      },
      caption: {
        type: String,
        trim: true,
        maxlength: 200
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    audio: [{
      url: {
        type: String,
        required: true,
        default: 'https://mock-s3/report-id-audio.mp3' // Placeholder URL
      },
      duration: {
        type: Number, // Duration in seconds
        min: 0
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },

  // Report status tracking
  status: {
    type: String,
    required: true,
    enum: [
      'submitted',      // Initial submission
      'under_review',   // Being reviewed by authority
      'in_progress',    // Work has started
      'resolved',       // Issue has been fixed
      'rejected',       // Report was rejected
      'duplicate'       // Duplicate of existing report
    ],
    default: 'submitted',
    index: true
  },

  // Authority assignment
  assignedTo: {
    authorityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Authority',
      index: true
    },
    assignedAt: {
      type: Date
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  // Resolution tracking
  resolution: {
    resolvedAt: {
      type: Date
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolutionNotes: {
      type: String,
      trim: true,
      maxlength: 500
    },
    beforeImage: {
      type: String, // URL to before image
      default: 'https://mock-s3/before-image.jpg'
    },
    afterImage: {
      type: String, // URL to after image
      default: 'https://mock-s3/after-image.jpg'
    }
  },

  // Priority and categorization
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },

  // Tags for categorization
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],

  // Citizen contact preferences
  contactPreferences: {
    allowUpdates: {
      type: Boolean,
      default: true
    },
    allowFollowUp: {
      type: Boolean,
      default: true
    },
    preferredContactMethod: {
      type: String,
      enum: ['email', 'sms', 'push_notification'],
      default: 'push_notification'
    }
  },

  // Metadata
  metadata: {
    source: {
      type: String,
      enum: ['mobile_app', 'web_portal', 'api'],
      default: 'mobile_app'
    },
    deviceInfo: {
      platform: String,
      version: String,
      model: String
    },
    ipAddress: String,
    userAgent: String
  },

  // Timestamps
  submittedAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  lastUpdatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  collection: 'reports'
});

// Indexes for efficient querying
reportSchema.index({ userId: 1, submittedAt: -1 }); // User's reports by date
reportSchema.index({ location: '2dsphere' }); // Geospatial queries
reportSchema.index({ status: 1, priority: -1, submittedAt: -1 }); // Status and priority queries
reportSchema.index({ issueType: 1, status: 1 }); // Issue type filtering
reportSchema.index({ severityScore: -1, submittedAt: -1 }); // Severity-based sorting

// Virtual for full address
reportSchema.virtual('fullAddress').get(function() {
  const parts = [
    this.location.address,
    this.location.city,
    this.location.state,
    this.location.zipCode
  ].filter(Boolean);
  return parts.join(', ');
});

// Virtual for report age in days
reportSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const submitted = this.submittedAt;
  return Math.floor((now - submitted) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to update lastUpdatedAt
reportSchema.pre('save', function(next) {
  this.lastUpdatedAt = new Date();
  next();
});

// Pre-save middleware to set priority based on severity score
reportSchema.pre('save', function(next) {
  if (this.isModified('severityScore')) {
    if (this.severityScore >= 5) {
      this.priority = 'urgent';
    } else if (this.severityScore >= 4) {
      this.priority = 'high';
    } else if (this.severityScore >= 3) {
      this.priority = 'medium';
    } else {
      this.priority = 'low';
    }
  }
  next();
});

// Instance methods
reportSchema.methods.updateStatus = function(newStatus, updatedBy) {
  this.status = newStatus;
  this.lastUpdatedAt = new Date();
  
  if (newStatus === 'resolved') {
    this.resolution.resolvedAt = new Date();
    this.resolution.resolvedBy = updatedBy;
  }
  
  return this.save();
};

reportSchema.methods.assignToAuthority = function(authorityId, assignedBy) {
  this.assignedTo.authorityId = authorityId;
  this.assignedTo.assignedAt = new Date();
  this.assignedTo.assignedBy = assignedBy;
  this.status = 'under_review';
  this.lastUpdatedAt = new Date();
  
  return this.save();
};

// Static methods
reportSchema.statics.findByLocation = function(latitude, longitude, radiusInKm = 5) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: radiusInKm * 1000 // Convert km to meters
      }
    }
  });
};

reportSchema.statics.findByUser = function(userId, limit = 20, skip = 0) {
  return this.find({ userId })
    .sort({ submittedAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('assignedTo.authorityId', 'name email phone');
};

reportSchema.statics.findByStatus = function(status, limit = 50, skip = 0) {
  return this.find({ status })
    .sort({ priority: -1, submittedAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('userId', 'name email')
    .populate('assignedTo.authorityId', 'name email phone');
};

// JSON transformation for API responses
reportSchema.methods.toJSON = function() {
  const report = this.toObject();
  
  // Remove sensitive information
  delete report.metadata.ipAddress;
  delete report.metadata.userAgent;
  
  // Add computed fields
  report.fullAddress = this.fullAddress;
  report.ageInDays = this.ageInDays;
  
  return report;
};

// Create and export the model
const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
