import { API_BASE_URL } from '../config/api';

export const checkBackendHealth = async () => {
  try {
    console.log('🔍 Checking backend health...');
    console.log('📡 API URL:', API_BASE_URL);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend health check successful:', data);
      return { status: 'online', data };
    } else {
      console.log('❌ Backend health check failed:', response.status);
      return { status: 'offline', error: `HTTP ${response.status}` };
    }
  } catch (error) {
    console.log('🚫 Backend health check error:', error.message);
    return { status: 'offline', error: error.message };
  }
};
