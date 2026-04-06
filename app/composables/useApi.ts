let refreshingToken: Promise<any> | null = null;

export const useApi = async <T = any>(path: string, options: any = {}): Promise<T> => {
  const config = useRuntimeConfig();
  const token = useCookie<string | null>('auth_token');
  const baseURL = config.public.apiBase || 'http://localhost:8000/api/v1';

  // Helper to construct request headers
  const getHeaders = () => {
    let currentLocale = 'es';
    try {
      const i18n = (globalThis as any).$i18n || (globalThis as any).$nuxt?.$i18n;
      if (i18n?.locale?.value) {
        currentLocale = i18n.locale.value.split('-')[0];
      }
    } catch (e) {}

    const { headers: customHeaders } = options;
    return {
      Accept: 'application/json',
      'Accept-Language': currentLocale,
      ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
      ...customHeaders,
    };
  };

  const executeRequest = async (retry: boolean = true): Promise<T> => {
    try {
      return await $fetch<T>(path, {
        baseURL,
        ...options,
        headers: getHeaders(),
      });
    } catch (error: any) {
      if (error?.response?.status === 401 && retry && !path.includes('/auth/')) {
        // Handle token refresh
        try {
          if (!refreshingToken) {
            refreshingToken = $fetch('/auth/refresh', {
              method: 'POST',
              baseURL,
              headers: {
                Authorization: `Bearer ${token.value}`,
              },
            });
          }

          const response = await refreshingToken as any;
          token.value = response.access_token;
          
          // Retry the original request
          return await executeRequest(false);
        } catch (refreshError) {
          // If refresh fails, log out
          token.value = null;
          navigateTo('/login');
          throw refreshError;
        } finally {
          refreshingToken = null;
        }
      }
      throw error;
    }
  };

  return executeRequest();
};
