
import { useEffect, useRef, useState } from 'react';
import { AxiosRequestConfig } from 'axios';
import apiClient from '../lib/apiClient';
import { getErrorMessage } from '../lib/errorHandler';

interface UseApiRequestOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  autoFetch?: boolean;
}

export function useApiRequest<T = any>(
  config: AxiosRequestConfig,
  options: UseApiRequestOptions<T> = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(options.autoFetch !== false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = async (overrideConfig?: AxiosRequestConfig) => {
    try {
      setLoading(true);
      setError(null);

      // Cancel previous request if exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      const response = await apiClient.request<T>({
        ...config,
        ...overrideConfig,
        signal: abortControllerRef.current.signal,
      });

      setData(response.data);
      options.onSuccess?.(response.data);
      
      return response.data;
    } catch (err: any) {
      if (err.name === 'AbortError' || err.name === 'CanceledError') {
        console.log('Request cancelled:', err.message);
        return;
      }

      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      options.onError?.(errorMessage);
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (options.autoFetch !== false) {
      execute();
    }

    // Cleanup: cancel request on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refetch = () => execute();

  return {
    data,
    loading,
    error,
    execute,
    refetch,
  };
}
