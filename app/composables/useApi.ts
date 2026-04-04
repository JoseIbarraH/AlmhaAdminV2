export const useApi = <T = any>(path: string, options: any = {}): Promise<T> => {
  const config = useRuntimeConfig();
  const token = useCookie('auth_token').value;

  // Intentar normalizar el locale desde i18n o el navegador
  let currentLocale = 'es';
  try {
    // Si estamos en un componente o composable con acceso a i18n
    const i18n = (globalThis as any).$i18n || useI18n?.();
    if (i18n?.locale?.value) {
      currentLocale = i18n.locale.value.split('-')[0];
    }
  } catch (e) {
    // Fallback silencioso si no hay i18n disponible
  }

  const { headers: customHeaders, ...restOptions } = options;

  return $fetch<T>(path, {
    baseURL: config.public.apiBase || 'http://localhost:8000/api/v1',
    ...restOptions,
    headers: {
      // Default headers
      Accept: 'application/json',
      'Accept-Language': currentLocale,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Custom headers override defaults
      ...customHeaders,
    },
  });
};

