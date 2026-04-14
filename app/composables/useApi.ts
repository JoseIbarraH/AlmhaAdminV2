let refreshingToken: Promise<any> | null = null;

export const useApi = async <T = any>(path: string, options: any = {}): Promise<T> => {
  let baseURL = 'http://localhost:8000/api/v1';
  try {
    const config = useRuntimeConfig();
    baseURL = config.public.apiBase || baseURL;
  } catch (e) {}

  const token = useCookie<string | null>('auth_token');

  let currentLocale = 'es';
  try {
    const nuxtApp = useNuxtApp();
    const i18n = nuxtApp.$i18n as any;
    if (i18n?.locale?.value) {
      currentLocale = i18n.locale.value.split('-')[0] || 'es';
    } else if (i18n?.locale) {
      currentLocale = (typeof i18n.locale === 'string' ? i18n.locale : i18n.locale.value || 'es').split('-')[0];
    }
  } catch (e) {
    // Silent fallback
  }

  // Helper to construct request headers
  const getHeaders = () => {
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
            refreshingToken = $fetch('/auth/refresh' as any, {
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
