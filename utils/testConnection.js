import { checkBackendHealth } from '../src/services/healthService';
import { apiService } from '../services/api';

export const testMobileConnection = async () => {
  console.log('🧪 Testing mobile connection...');
  
  try {
    // Test health endpoint
    const healthResult = await checkBackendHealth();
    console.log('Health check result:', healthResult);
    
    // Test API service
    const apiHealthResult = await apiService.healthCheck();
    console.log('API health check result:', apiHealthResult);
    
    if (healthResult.status === 'online' && apiHealthResult) {
      console.log('✅ All backend connections working!');
      return true;
    } else {
      console.log('❌ Backend connection issues detected');
      return false;
    }
  } catch (error) {
    console.error('🚫 Connection test failed:', error);
    return false;
  }
};