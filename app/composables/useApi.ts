export const useApi = (path: string, options: any = {}) => {
  const config = useRuntimeConfig();
  const token = useCookie('auth_token');

  return $fetch(path, {
    baseURL: config.public.apiBase || 'http://localhost:8000/api/v1',
    headers: {
      ...options.headers,
      Authorization: token.value ? `Bearer ${token.value}` : '',
      Accept: 'application/json',
    },
    ...options,
  });
};
