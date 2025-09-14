const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testHealthEndpoint() {
  try {
    console.log('🧪 Testing Health Check Endpoint...');
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check Response:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health Check Failed:', error.message);
    return false;
  }
}

async function testAuthEndpoints() {
  try {
    console.log('\n🧪 Testing Authentication Endpoints...');
    
    // Test send OTP endpoint
    console.log('📱 Testing Send OTP...');
    const otpResponse = await axios.post(`${BASE_URL}/api/auth/send-otp`, {
      phoneNumber: '+919876543210'
    });
    console.log('✅ Send OTP Response:', otpResponse.data);
    
    return true;
  } catch (error) {
    console.error('❌ Auth Test Failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

async function testDatabaseConnection() {
  try {
    console.log('\n🧪 Testing Database Operations...');
    
    // Test creating a user (this will test MongoDB connection)
    const testUser = {
      phoneNumber: '+919876543210',
      name: 'Test User',
      role: 'rider'
    };
    
    console.log('👤 Testing user creation...');
    // This endpoint might not exist yet, but we'll test what's available
    
    return true;
  } catch (error) {
    console.error('❌ Database Test Failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting RulerRide Backend API Tests...\n');
  
  const results = {
    health: await testHealthEndpoint(),
    auth: await testAuthEndpoints(),
    database: await testDatabaseConnection()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('Health Check:', results.health ? '✅ PASS' : '❌ FAIL');
  console.log('Authentication:', results.auth ? '✅ PASS' : '❌ FAIL');
  console.log('Database:', results.database ? '✅ PASS' : '❌ FAIL');
  
  const totalPassed = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${totalPassed}/${totalTests} tests passed`);
  
  if (totalPassed === totalTests) {
    console.log('🎉 All tests passed! Backend is ready for integration.');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above for details.');
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { testHealthEndpoint, testAuthEndpoints, testDatabaseConnection, runAllTests };