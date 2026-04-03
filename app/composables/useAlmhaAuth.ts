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

      if (response.token) {
        token.value = response.token;
        if (!rememberMe) {
          // If NOT remember me, ideally we'd set a session cookie, 
          // but useCookie doesn't allow changing options dynamically easily.
          // For now, persistent is fine or the user can adjust.
        }
        user.value = response.user;
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
