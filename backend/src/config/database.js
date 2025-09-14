const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.NODE_ENV === 'test' 
      ? process.env.MONGODB_TEST_URI 
      : process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      ssl: true, // Enable SSL for MongoDB Atlas
      tlsAllowInvalidCertificates: false, // Validate SSL certificate (updated option)
      retryWrites: true, // Enable retryable writes
      w: 'majority' // Write concern
    };

    const conn = await mongoose.connect(mongoURI, options);

    console.log(`📊 MongoDB Connected: ${conn.connection.host}`);
    console.log(`🗄️  Database: ${conn.connection.name}`);

    // Connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('📊 Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (error) => {
      console.error('❌ Mongoose connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📊 Mongoose disconnected from MongoDB');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('📊 Mongoose connection closed due to application termination');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error closing mongoose connection:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    // Exit process with failure if in production
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    
    // In development, continue without database
    console.log('⚠️  Continuing without database connection in development mode');
  }
};

// Utility function to check database connection status
const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Utility function to get connection info
const getConnectionInfo = () => {
  const state = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  return {
    state: states[state],
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name
  };
};

module.exports = {
  connectDB,
  isConnected,
  getConnectionInfo
};