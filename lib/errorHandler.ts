
import axios, { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  statusCode?: number;
  field?: string;
  details?: any;
}

/**
 * Extracts a user-friendly error message from an API error response
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    
    // Use backend's error message if available
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    
    // Handle specific HTTP status codes
    if (axiosError.response?.status) {
      switch (axiosError.response.status) {
        case 400:
          return 'Invalid request. Please check your input.';
        case 401:
          return 'Session expired. Please log in again.';
        case 403:
          return 'You do not have permission to perform this action.';
        case 404:
          return 'The requested resource was not found.';
        case 409:
          return 'A conflict occurred. The resource may already exist.';
        case 422:
          return 'Validation error. Please check your input.';
        case 429:
          return 'Too many requests. Please try again later.';
        case 500:
          return 'Server error. Please try again later.';
        case 503:
          return 'Service temporarily unavailable. Please try again later.';
        default:
          return `Request failed with status ${axiosError.response.status}`;
      }
    }
    
    // Network errors
    if (axiosError.code === 'ERR_NETWORK') {
      return 'Network error. Please check your connection.';
    }
    
    if (axiosError.code === 'ECONNABORTED') {
      return 'Request timeout. Please try again.';
    }
  }
  
  // Fallback for unknown errors
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}

/**
 * Extracts structured error information from an API error
 */
export function parseApiError(error: unknown): ApiError {
  const message = getErrorMessage(error);
  
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    
    return {
      message,
      statusCode: axiosError.response?.status,
      field: axiosError.response?.data?.field,
      details: axiosError.response?.data?.details,
    };
  }
  
  return { message };
}

/**
 * Handles API errors with optional custom error handlers
 */
export function handleApiError(
  error: unknown,
  customHandlers?: {
    [statusCode: number]: (error: ApiError) => void;
  }
): void {
  const apiError = parseApiError(error);
  
  // Check for custom handler
  if (apiError.statusCode && customHandlers?.[apiError.statusCode]) {
    customHandlers[apiError.statusCode](apiError);
    return;
  }
  
  // Default handling: log to console
  console.error('API Error:', apiError);
}
