/**
 * User Model (Mongoose)
 * Defines the schema for a User in the MongoDB database.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'], // Back to being required
    minlength: 6
  },
  // --- UPDATED BADGES ENUM ---
  badges: [{
    type: String,
    enum: [
      'Newbie Reporter', 
      'Super Contributor', 
      'Community Hero', 
      'Verified Voice', 
      'Pothole Master', 
      'Noise Control',
      'The Architect', // 5+ Infrastructure reports
      'Sanitation Star' // 5+ Sanitation reports
    ],
    default: [],
  }],
  // --- END UPDATED BADGES ENUM ---
  lastReportedCategory: {
    type: String,
    default: null // Tracks the issue type of the last report for new badge calculation
  }
  // REMOVED: googleId field
}, {
  timestamps: true
});

// --- Password Hashing Middleware ---
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// --- Password Comparison Method ---
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Ensure virtual 'id' exists
userSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
  }
});

const User = mongoose.model('User', userSchema);
module.exports = User;