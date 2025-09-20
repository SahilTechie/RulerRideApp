require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function fixUsernameIndex() {
  try {
    // Use the MongoDB URI from environment variables
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('Connected to MongoDB');
    
    // Check current indexes
    const indexes = await User.collection.indexes();
    console.log('Current indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key })));
    
    // Check if username index exists
    const usernameIndex = indexes.find(idx => idx.key && idx.key.username);
    
    if (usernameIndex) {
      console.log('Found username index:', usernameIndex.name);
      
      // Drop the username index
      await User.collection.dropIndex(usernameIndex.name);
      console.log('✅ Successfully dropped username index');
    } else {
      console.log('❌ No username index found');
    }
    
    // Also check for any users with null username and update them
    const usersWithNullUsername = await User.find({ username: null });
    console.log(`Found ${usersWithNullUsername.length} users with null username`);
    
    // Remove username field from all documents if it exists
    const result = await User.updateMany(
      {},
      { $unset: { username: "" } },
      { multi: true }
    );
    
    console.log(`✅ Removed username field from ${result.modifiedCount} documents`);
    
    // List final indexes
    const finalIndexes = await User.collection.indexes();
    console.log('Final indexes:', finalIndexes.map(idx => ({ name: idx.name, key: idx.key })));
    
    await mongoose.disconnect();
    console.log('✅ Fix completed successfully');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixUsernameIndex();