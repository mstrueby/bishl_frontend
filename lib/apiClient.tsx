
import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { redirectToLogin } from './authRedirect';

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Determines if an error should be retried
 */
function shouldRetry(error: AxiosError): boolean {
  // Retry on network errors (handle both real Axios and axios-mock-adapter formats)
  if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error')) {
    return true;
  }
  
  // Retry on timeout
  if (error.code === 'ECONNABORTED') {
    return true;
  }
  
  // Retry on specific 5xx errors (but not 501, 505, 511)
  if (error.response?.status && error.response.status >= 500) {
    return [500, 502, 503, 504].includes(error.response.status);
  }
  
  return false;
}

/**
 * Delays execution for a specified time with exponential backoff
 */
function delay(retryCount: number): Promise<void> {
  const backoffDelay = RETRY_DELAY * Math.pow(2, retryCount - 1);
  return new Promise(resolve => setTimeout(resolve, backoffDelay));
}

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
            redirectToLogin();
          }
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // No refresh token available - redirect to login
        isRefreshing = false;
        if (typeof window !== 'undefined') {
          redirectToLogin();
        }
      }
    }
    
    // Handle retryable errors
    if (shouldRetry(error) && !originalRequest._retryCount) {
      originalRequest._retryCount = 0;
    }
    
    if (shouldRetry(error) && originalRequest._retryCount < MAX_RETRIES) {
      originalRequest._retryCount++;
      
      console.log(`Retrying request (attempt ${originalRequest._retryCount}/${MAX_RETRIES})`);
      
      await delay(originalRequest._retryCount);
      return apiClient(originalRequest);
    }
    
    return Promise.reject(error);
  }
);

// Export CancelToken for manual cancellation
export const CancelToken = axios.CancelToken;
export const isCancel = axios.isCancel;

export default apiClient;
