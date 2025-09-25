import { API_BASE_URL } from '../config/api';

export const checkBackendHealth = async () => {
  try {
    console.log('🔍 Checking backend health...');
    console.log('📡 Health check URL:', `${API_BASE_URL}/health`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // Add ngrok headers if using ngrok
        'ngrok-skip-browser-warning': 'true',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('✅ Backend health check successful:', data);
        return { status: 'online', data };
      } else {
        // Response is not JSON, get text to see what it is
        const text = await response.text();
        console.log('⚠️ Backend responded with non-JSON:', text.substring(0, 200));
        
        // Check if it's an HTML page (likely ngrok browser warning or error page)
        if (text.includes('<html') || text.includes('<!DOCTYPE')) {
          return { 
            status: 'offline', 
            error: 'Received HTML response instead of JSON (check ngrok tunnel or server status)' 
          };
        }
        
        return { status: 'offline', error: 'Non-JSON response received' };
      }
    } else {
      console.log('❌ Backend health check failed:', response.status, response.statusText);
      
      // Try to get response text for more details
      try {
        const text = await response.text();
        console.log('❌ Error response:', text.substring(0, 200));
      } catch (e) {
        console.log('❌ Could not read error response');
      }
      
      return { status: 'offline', error: `HTTP ${response.status}: ${response.statusText}` };
    }
  } catch (error) {
    console.log('🚫 Backend health check error:', error.message);
    
    // Provide more specific error messages
    if (error.name === 'AbortError') {
      return { status: 'offline', error: 'Request timeout (5s)' };
    } else if (error.message.includes('Failed to fetch')) {
      return { status: 'offline', error: 'Network error - server unreachable' };
    } else if (error.message.includes('JSON Parse error')) {
      return { status: 'offline', error: 'Server returned invalid JSON (check tunnel/server)' };
    }
    
    return { status: 'offline', error: error.message };
  }
};
