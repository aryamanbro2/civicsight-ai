const mongoose = require('mongoose');

// This file simply registers and exports the models.
// The connection is now handled by config/database.js
module.exports = {
  User: require('./User'),
  Report: require('./Report')
};