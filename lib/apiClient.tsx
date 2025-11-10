
import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add authentication token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add access token to all requests
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - unwrap standardized responses and handle token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Unwrap standardized response format
    // Backend returns: { success: true, data: {...}, message: "..." }
    // We want to return just the data for easier consumption
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      // Keep pagination metadata if present
      return {
        ...response,
        data: response.data.data,
        pagination: response.data.pagination,
        message: response.data.message,
        success: response.data.success,
      };
    }
    
    // Return response as-is if not standardized format
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
      
      if (refreshToken) {
        try {
          // Call refresh endpoint
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/users/refresh`,
            { refresh_token: refreshToken }
          );
          
          // Extract new access token from standardized response
          const newAccessToken = response.data?.data?.access_token || response.data?.access_token;
          
          if (newAccessToken && typeof window !== 'undefined') {
            // Store new access token
            localStorage.setItem('access_token', newAccessToken);
            
            // Update Authorization header for retry
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            
            // Retry original request
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          // Refresh token failed or expired - clear tokens and redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            
            // Only redirect if not already on login page
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
          }
          
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available - redirect to login
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
