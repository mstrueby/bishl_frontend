
import { useEffect, useRef, useState } from 'react';
import { AxiosRequestConfig, CancelTokenSource } from 'axios';
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
  const cancelTokenRef = useRef<CancelTokenSource | null>(null);

  const execute = async (overrideConfig?: AxiosRequestConfig) => {
    try {
      setLoading(true);
      setError(null);

      // Cancel previous request if exists
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel('New request initiated');
      }

      // Create new cancel token
      cancelTokenRef.current = apiClient.CancelToken.source();

      const response = await apiClient.request<T>({
        ...config,
        ...overrideConfig,
        cancelToken: cancelTokenRef.current.token,
      });

      setData(response.data);
      options.onSuccess?.(response.data);
      
      return response.data;
    } catch (err: any) {
      if (apiClient.isCancel(err)) {
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
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel('Component unmounted');
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
