
import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add authentication token and CSRF token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add access token to all requests
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    // Add CSRF token for state-changing requests
    if (typeof window !== 'undefined' && 
        ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
      const csrfToken = localStorage.getItem('csrf_token');
      if (csrfToken && config.headers) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Queue for pending requests during token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

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
      if (isRefreshing) {
        // Queue this request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
      
      if (refreshToken) {
        try {
          // Call refresh endpoint
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/users/refresh`,
            { refresh_token: refreshToken }
          );
          
          // Extract new tokens from standardized response
          const newAccessToken = response.data?.data?.access_token || response.data?.access_token;
          const newRefreshToken = response.data?.data?.refresh_token || response.data?.refresh_token;
          
          if (newAccessToken && typeof window !== 'undefined') {
            // Store new tokens
            localStorage.setItem('access_token', newAccessToken);
            if (newRefreshToken) {
              localStorage.setItem('refresh_token', newRefreshToken);
            }
            
            // Update Authorization header for retry
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            
            // Process queued requests
            processQueue(null, newAccessToken);
            
            // Retry original request
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          // Refresh token failed or expired - clear tokens and redirect to login
          processQueue(refreshError, null);
          
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            
            // Only redirect if not already on login page
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
          }
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // No refresh token available - redirect to login
        isRefreshing = false;
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
