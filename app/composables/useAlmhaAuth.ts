import { useApi } from './useApi';

interface User {
  id: string;
  name: string;
  email: string;
  [key: string]: any;
}

export const useAlmhaAuth = () => {
  const token = useCookie<string | null>('auth_token', {
    watch: true,
    sameSite: 'lax',
  });
  const user = useState<User | null>('user', () => null);


  const login = async (credentials: any, rememberMe: boolean = false) => {
    try {
      const response = await useApi('/auth/login', {
        method: 'POST',
        body: {
          ...credentials,
          remember_me: rememberMe
        },
      }) as any;

      if (response.access_token) {
        // Set cookie with dynamic maxAge
        const cookieOptions: any = {
          watch: true,
          sameSite: 'lax',
        };

        if (rememberMe) {
          cookieOptions.maxAge = 60 * 60 * 24 * 30; // 30 days
        }

        const dynamicToken = useCookie('auth_token', cookieOptions);
        dynamicToken.value = response.access_token;
        // token.value will update automatically because it's watching 'auth_token'

        // Fetch user data
        await fetchUser(response.access_token);
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

  const fetchUser = async (explicitToken?: string) => {
    const activeToken = explicitToken || token.value;
    if (!activeToken) return;

    try {
      const response = await useApi('/user', {
        headers: {
          Authorization: `Bearer ${activeToken}`
        }
      }) as any;
      user.value = response.data || response;
    } catch (error) {
      logout();
    }
  };


  const isSuperAdmin = computed(() => user.value?.roles?.includes('super_admin') || false)

  const hasRole = (roleOrRoles: string | string[]) => {
    if (isSuperAdmin.value) return true
    if (!user.value?.roles) return false
    
    if (Array.isArray(roleOrRoles)) {
      return roleOrRoles.some(r => user.value?.roles?.includes(r))
    }
    return user.value.roles.includes(roleOrRoles)
  }

  return {
    token,
    user,
    login,
    logout,
    fetchUser,
    isSuperAdmin,
    hasRole
  };
};
