
import axios, { AxiosError } from 'axios';
import { getErrorMessage, parseApiError, handleApiError } from '@/lib/errorHandler';

describe('errorHandler.ts', () => {
  describe('getErrorMessage', () => {
    it('should extract message from Axios error response', () => {
      const error: AxiosError<any> = {
        isAxiosError: true,
        response: {
          data: { message: 'Custom error message' },
          status: 400,
          statusText: 'Bad Request',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Request failed',
        toJSON: () => ({}),
      };

      expect(getErrorMessage(error)).toBe('Custom error message');
    });

    it('should return specific message for 400 status', () => {
      const error: AxiosError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {},
          statusText: 'Bad Request',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Request failed',
        toJSON: () => ({}),
      };

      expect(getErrorMessage(error)).toBe('Invalid request. Please check your input.');
    });

    it('should return specific message for 401 status', () => {
      const error: AxiosError = {
        isAxiosError: true,
        response: {
          status: 401,
          data: {},
          statusText: 'Unauthorized',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Request failed',
        toJSON: () => ({}),
      };

      expect(getErrorMessage(error)).toBe('Session expired. Please log in again.');
    });

    it('should return specific message for 403 status', () => {
      const error: AxiosError = {
        isAxiosError: true,
        response: {
          status: 403,
          data: {},
          statusText: 'Forbidden',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Request failed',
        toJSON: () => ({}),
      };

      expect(getErrorMessage(error)).toBe('You do not have permission to perform this action.');
    });

    it('should return specific message for 404 status', () => {
      const error: AxiosError = {
        isAxiosError: true,
        response: {
          status: 404,
          data: {},
          statusText: 'Not Found',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Request failed',
        toJSON: () => ({}),
      };

      expect(getErrorMessage(error)).toBe('The requested resource was not found.');
    });

    it('should return specific message for 409 status', () => {
      const error: AxiosError = {
        isAxiosError: true,
        response: {
          status: 409,
          data: {},
          statusText: 'Conflict',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Request failed',
        toJSON: () => ({}),
      };

      expect(getErrorMessage(error)).toBe('A conflict occurred. The resource may already exist.');
    });

    it('should return specific message for 422 status', () => {
      const error: AxiosError = {
        isAxiosError: true,
        response: {
          status: 422,
          data: {},
          statusText: 'Unprocessable Entity',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Request failed',
        toJSON: () => ({}),
      };

      expect(getErrorMessage(error)).toBe('Validation error. Please check your input.');
    });

    it('should return specific message for 429 status', () => {
      const error: AxiosError = {
        isAxiosError: true,
        response: {
          status: 429,
          data: {},
          statusText: 'Too Many Requests',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Request failed',
        toJSON: () => ({}),
      };

      expect(getErrorMessage(error)).toBe('Too many requests. Please try again later.');
    });

    it('should return specific message for 500 status', () => {
      const error: AxiosError = {
        isAxiosError: true,
        response: {
          status: 500,
          data: {},
          statusText: 'Internal Server Error',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Request failed',
        toJSON: () => ({}),
      };

      expect(getErrorMessage(error)).toBe('Server error. Please try again later.');
    });

    it('should return specific message for 503 status', () => {
      const error: AxiosError = {
        isAxiosError: true,
        response: {
          status: 503,
          data: {},
          statusText: 'Service Unavailable',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Request failed',
        toJSON: () => ({}),
      };

      expect(getErrorMessage(error)).toBe('Service temporarily unavailable. Please try again later.');
    });

    it('should return generic message for unknown status codes', () => {
      const error: AxiosError = {
        isAxiosError: true,
        response: {
          status: 418,
          data: {},
          statusText: "I'm a teapot",
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Request failed',
        toJSON: () => ({}),
      };

      expect(getErrorMessage(error)).toBe('Request failed with status 418');
    });

    it('should handle ERR_NETWORK error code', () => {
      const error: AxiosError = {
        isAxiosError: true,
        code: 'ERR_NETWORK',
        config: {} as any,
        name: 'AxiosError',
        message: 'Network Error',
        toJSON: () => ({}),
      };

      expect(getErrorMessage(error)).toBe('Network error. Please check your connection.');
    });

    it('should handle ECONNABORTED error code', () => {
      const error: AxiosError = {
        isAxiosError: true,
        code: 'ECONNABORTED',
        config: {} as any,
        name: 'AxiosError',
        message: 'timeout of 5000ms exceeded',
        toJSON: () => ({}),
      };

      expect(getErrorMessage(error)).toBe('Request timeout. Please try again.');
    });

    it('should return error message for standard Error objects', () => {
      const error = new Error('Something went wrong');
      expect(getErrorMessage(error)).toBe('Something went wrong');
    });

    it('should return fallback message for unknown error types', () => {
      const error = { unknown: 'error' };
      expect(getErrorMessage(error)).toBe('An unexpected error occurred');
    });

    it('should return fallback message for null error', () => {
      expect(getErrorMessage(null)).toBe('An unexpected error occurred');
    });
  });

  describe('parseApiError', () => {
    it('should parse Axios error with all fields', () => {
      const error: AxiosError<any> = {
        isAxiosError: true,
        response: {
          status: 422,
          data: {
            message: 'Validation failed',
            field: 'email',
            details: { email: 'Invalid email format' },
          },
          statusText: 'Unprocessable Entity',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Request failed',
        toJSON: () => ({}),
      };

      const result = parseApiError(error);
      expect(result).toEqual({
        message: 'Validation failed',
        statusCode: 422,
        field: 'email',
        details: { email: 'Invalid email format' },
      });
    });

    it('should parse Axios error without field and details', () => {
      const error: AxiosError = {
        isAxiosError: true,
        response: {
          status: 500,
          data: {},
          statusText: 'Internal Server Error',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Request failed',
        toJSON: () => ({}),
      };

      const result = parseApiError(error);
      expect(result.message).toBe('Server error. Please try again later.');
      expect(result.statusCode).toBe(500);
      expect(result.field).toBeUndefined();
      expect(result.details).toBeUndefined();
    });

    it('should parse non-Axios errors', () => {
      const error = new Error('Custom error');
      const result = parseApiError(error);
      
      expect(result).toEqual({
        message: 'Custom error',
      });
      expect(result.statusCode).toBeUndefined();
    });
  });

  describe('handleApiError', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should call custom handler for matching status code', () => {
      const error: AxiosError = {
        isAxiosError: true,
        response: {
          status: 404,
          data: {},
          statusText: 'Not Found',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Request failed',
        toJSON: () => ({}),
      };

      const customHandler = jest.fn();
      handleApiError(error, { 404: customHandler });

      expect(customHandler).toHaveBeenCalledWith({
        message: 'The requested resource was not found.',
        statusCode: 404,
        field: undefined,
        details: undefined,
      });
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should log to console when no custom handler matches', () => {
      const error: AxiosError = {
        isAxiosError: true,
        response: {
          status: 500,
          data: {},
          statusText: 'Internal Server Error',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Request failed',
        toJSON: () => ({}),
      };

      handleApiError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith('API Error:', {
        message: 'Server error. Please try again later.',
        statusCode: 500,
        field: undefined,
        details: undefined,
      });
    });

    it('should log to console for non-Axios errors', () => {
      const error = new Error('Unknown error');
      handleApiError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith('API Error:', {
        message: 'Unknown error',
      });
    });
  });
});
