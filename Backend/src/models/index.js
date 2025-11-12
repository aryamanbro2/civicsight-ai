/**
 * Models Index
 * Exports all Mongoose models from one central file.
 */

const User = require('./User');
const Report = require('./Report');

module.exports = {
  User,
  Report
};