const axios = require('axios');

// Configuration from .env
const API_URLS = {
    local: 'http://10.67.84.82:3001',
    public: 'https://reversibly-overtalkative-ghislaine.ngrok-free.dev',
    hotspot: 'http://172.19.247.171:3001'
};

async function testConnection(name, url) {
    console.log(`\n🔍 Testing ${name} connection: ${url}`);
    try {
        const response = await axios.get(`${url}/health`, {
            timeout: 10000,
            headers: {
                'User-Agent': 'RulerRide-Test/1.0'
            }
        });
        
        if (response.status === 200) {
            console.log(`✅ ${name}: Connected successfully`);
            console.log(`   Status: ${response.data.status}`);
            console.log(`   Message: ${response.data.message}`);
            console.log(`   Environment: ${response.data.environment}`);
            return true;
        }
    } catch (error) {
        console.log(`❌ ${name}: Connection failed`);
        if (error.code === 'ECONNREFUSED') {
            console.log(`   Error: Server not running`);
        } else if (error.code === 'ETIMEDOUT') {
            console.log(`   Error: Connection timeout`);
        } else if (error.response) {
            console.log(`   HTTP Status: ${error.response.status}`);
            console.log(`   Error: ${error.response.statusText}`);
        } else {
            console.log(`   Error: ${error.message}`);
        }
        return false;
    }
}

async function runTests() {
    console.log('🚀 RulerRide Backend Connection Test');
    console.log('====================================');
    
    const results = {};
    
    // Test all configured URLs
    for (const [name, url] of Object.entries(API_URLS)) {
        results[name] = await testConnection(name, url);
    }
    
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    
    let hasConnection = false;
    for (const [name, success] of Object.entries(results)) {
        const status = success ? '✅ Working' : '❌ Failed';
        console.log(`${name.padEnd(10)}: ${status}`);
        if (success) hasConnection = true;
    }
    
    console.log('\n🎯 Recommendations:');
    console.log('===================');
    
    if (results.public) {
        console.log('✅ Use PUBLIC mode for cross-network access');
        console.log('   Set EXPO_PUBLIC_MODE=public in .env file');
    } else if (results.local) {
        console.log('⚠️  Use LOCAL mode for same WiFi network only');
        console.log('   Set EXPO_PUBLIC_MODE=local in .env file');
    } else if (results.hotspot) {
        console.log('📱 Use HOTSPOT mode for mobile hotspot access');
        console.log('   Set EXPO_PUBLIC_MODE=hotspot in .env file');
    } else {
        console.log('❌ No backend connection available');
        console.log('   1. Make sure backend server is running (npm start in backend folder)');
        console.log('   2. Check if ngrok tunnel is active');
        console.log('   3. Verify MongoDB connection');
    }
    
    if (hasConnection) {
        console.log('\n🎉 Backend is accessible! You can now run your app.');
    } else {
        console.log('\n🔧 Please fix the backend connection issues before running the app.');
    }
}

// Run the tests
runTests().catch(console.error);