// Simple test script to check backend health
const fetch = require('node-fetch');

async function testHealth() {
  const baseUrls = [
    'http://localhost:3001',
    'http://10.67.84.82:3001',
    'https://reversibly-overtalkative-ghislaine.ngrok-free.dev'
  ];

  for (const baseUrl of baseUrls) {
    console.log(`\n🔍 Testing: ${baseUrl}/health`);
    
    try {
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        timeout: 5000,
      });

      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log(`Content-Type: ${response.headers.get('content-type')}`);

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log('✅ Success:', JSON.stringify(data, null, 2));
        } else {
          const text = await response.text();
          console.log('⚠️ Non-JSON response:', text.substring(0, 200));
        }
      } else {
        const text = await response.text();
        console.log('❌ Error response:', text.substring(0, 200));
      }
    } catch (error) {
      console.log('🚫 Error:', error.message);
    }
  }
}

testHealth().catch(console.error);