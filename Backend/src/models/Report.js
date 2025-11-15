/**
 * Report Model (Mongoose)
 * Defines the schema for a Report in the MongoDB database.
 */

const mongoose = require('mongoose');

// Define a schema for the location
const locationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point'
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true
  },
  address: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  state: {
    type: String,
    default: ''
  },
  zipCode: {
    type: String,
    default: ''
  }
}, { _id: false });

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  issueType: {
    type: String,
    required: [true, 'Issue type is required'],
    index: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  // CHANGED: Replaced mediaUrl/mediaType with explicit fields
  imageUrl: {
    type: String, // This will be the path to the photo
    default: null
  },
  audioUrl: {
    type: String, // This will be the path to the audio file
    default: null
  },
  location: locationSchema, // Embed the location schema
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'rejected'],
    default: 'pending',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  severity: {
    type: String,
    default: 'unknown'
  },
  severityScore: {
    type: Number,
    default: 0
  },
  aiMetadata: {
    type: mongoose.Schema.Types.Mixed, // To store the raw AI response
    default: null
  },
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  upvoteCount: { type: Number, default: 0, index: true },
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Create a 2dsphere index for geospatial queries
reportSchema.index({ "location.coordinates": "2dsphere" });

// Validation to ensure at least one media type is present
reportSchema.pre('validate', function(next) {
  if (!this.imageUrl && !this.audioUrl) {
    next(new Error('A report must include at least an image or an audio file.'));
  } else {
    next();
  }
});

reportSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v; // Optional: clean up the output
  }
});

const Report = mongoose.model('Report', reportSchema);
module.exports = Report;