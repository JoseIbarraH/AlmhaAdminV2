import { useAlmhaAuth } from '~/composables/useAlmhaAuth';

export default defineNuxtPlugin(async (nuxtApp) => {
  const { token, user, fetchUser } = useAlmhaAuth();

  // If we have an authentication token but the user data cookie is missing or expired,
  // we fetch the user data proactively during application initialization (SSR and Client).
  if (token.value && !user.value) {
    await fetchUser();
  }
});
