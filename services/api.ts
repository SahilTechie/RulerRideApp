import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3001/api', // Using localhost for web development
  SOCKET_URL: 'http://localhost:3001',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

// Request/Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  isOperational?: boolean;
}

// HTTP Methods
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  requireAuth?: boolean;
  timeout?: number;
  retries?: number;
}

class ApiService {
  private static instance: ApiService;
  private baseURL: string;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // Get auth token from storage
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Build headers
  private async buildHeaders(requireAuth: boolean = false): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (requireAuth) {
      const token = await this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Handle API response
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const data = await response.json();

      if (!response.ok) {
        throw {
          message: data.message || 'Request failed',
          code: data.code || 'API_ERROR',
          statusCode: response.status,
          isOperational: true
        } as ApiError;
      }

      return data;
    } catch (error) {
      if (error instanceof SyntaxError) {
        // JSON parsing error
        throw {
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
          statusCode: response.status,
          isOperational: true
        } as ApiError;
      }
      throw error;
    }
  }

  // Retry logic
  private async retry<T>(
    fn: () => Promise<T>,
    retries: number = API_CONFIG.RETRY_ATTEMPTS,
    delay: number = API_CONFIG.RETRY_DELAY
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0 && this.shouldRetry(error as ApiError)) {
        console.log(`Retrying request... Attempts left: ${retries}`);
        await this.delay(delay);
        return this.retry(fn, retries - 1, delay * 2); // Exponential backoff
      }
      throw error;
    }
  }

  // Check if error should be retried
  private shouldRetry(error: ApiError): boolean {
    if (!error.statusCode) return false;
    
    // Retry on network errors and server errors (5xx)
    return error.statusCode >= 500 || error.code === 'NETWORK_ERROR';
  }

  // Delay utility
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Main request method
  async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      body,
      requireAuth = true,
      timeout = API_CONFIG.TIMEOUT,
      retries = API_CONFIG.RETRY_ATTEMPTS
    } = options;

    const makeRequest = async (): Promise<ApiResponse<T>> => {
      try {
        const headers = await this.buildHeaders(requireAuth);
        const url = `${this.baseURL}${endpoint}`;

        console.log(`🌐 API Request: ${method} ${url}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const requestOptions: RequestInit = {
          method,
          headers,
          signal: controller.signal,
        };

        if (body && method !== 'GET') {
          requestOptions.body = JSON.stringify(body);
        }

        const response = await fetch(url, requestOptions);
        clearTimeout(timeoutId);

        const result = await this.handleResponse<T>(response);
        console.log(`✅ API Response: ${method} ${url} - Success`);
        
        return result;

      } catch (error: any) {
        console.error(`❌ API Error: ${method} ${endpoint}`, error);

        if (error.name === 'AbortError') {
          throw {
            message: 'Request timeout',
            code: 'TIMEOUT_ERROR',
            isOperational: true
          } as ApiError;
        }

        if (!error.isOperational) {
          // Network or unexpected error
          throw {
            message: 'Network error',
            code: 'NETWORK_ERROR',
            isOperational: true
          } as ApiError;
        }

        throw error;
      }
    };

    return this.retry(makeRequest, retries);
  }

  // Convenience methods
  async get<T = any>(endpoint: string, requireAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', requireAuth });
  }

  async post<T = any>(endpoint: string, body?: any, requireAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body, requireAuth });
  }

  async put<T = any>(endpoint: string, body?: any, requireAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body, requireAuth });
  }

  async delete<T = any>(endpoint: string, requireAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', requireAuth });
  }

  async patch<T = any>(endpoint: string, body?: any, requireAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body, requireAuth });
  }

  // Upload file (for profile images, etc.)
  async uploadFile(
    endpoint: string,
    file: any,
    additionalData?: Record<string, any>
  ): Promise<ApiResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      if (additionalData) {
        Object.keys(additionalData).forEach(key => {
          formData.append(key, additionalData[key]);
        });
      }

      const headers = await this.buildHeaders(true);
      delete headers['Content-Type']; // Let browser set multipart boundary

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  // Set base URL (for switching environments)
  setBaseURL(url: string): void {
    this.baseURL = url;
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      // Direct fetch to health endpoint (not under /api path)
      const healthUrl = this.baseURL.replace('/api', '') + '/health';
      const response = await fetch(healthUrl);
      const data = await response.json();
      return data.status === 'OK';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // Clear auth data
  async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['auth_token', 'refresh_token', 'user_data']);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }
}

// Export singleton instance
export const apiService = ApiService.getInstance();
export default apiService;