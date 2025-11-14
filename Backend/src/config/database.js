// Backend/src/config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // We get the connection string from your server.js
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/civicsight-ai';
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB Connected successfully.');
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;