import { useApi } from '../composables/useApi';

export default defineNuxtRouteMiddleware(async (to, from) => {
  const { path } = to;
  const isSetupRoute = path === '/setup';

  try {
    const response: any = await useApi('/setup/instance-status');

    if (!response.initialized) {
      if (!isSetupRoute) {
        return navigateTo('/setup');
      }
    } else if (isSetupRoute) {
      return navigateTo('/login');
    }
  } catch (error) {
    if (!isSetupRoute) {
      return navigateTo('/setup');
    }
  }
});
