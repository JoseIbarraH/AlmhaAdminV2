import { useApi } from './useApi';

export const useAlmhaAuth = () => {
  const token = useCookie<string | null>('auth_token', {
    watch: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30 // 30 days
  });
  const user = useState('user', () => null);

  const login = async (credentials: any, rememberMe: boolean = false) => {
    try {
      const response = await useApi('/auth/login', {
        method: 'POST',
        body: credentials,
      }) as any;

      if (response.access_token) {
        token.value = response.access_token;
        // Fetch user data after setting the token
        await fetchUser();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error', error);
      throw error;
    }
  };

  const logout = () => {
    token.value = null;
    user.value = null;
    navigateTo('/login');
  };

  const fetchUser = async () => {
    if (!token.value) return;
    try {
      const response = await useApi('/user') as any;
      user.value = response;
    } catch (error) {
      logout();
    }
  };

  return {
    token,
    user,
    login,
    logout,
    fetchUser,
  };
};
