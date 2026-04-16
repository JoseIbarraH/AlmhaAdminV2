export default defineNuxtRouteMiddleware((to) => {
  const { hasRole, isSuperAdmin, user } = useAlmhaAuth()
  
  // If not authenticated, let auth middleware handle it
  if (!user.value) return

  // 1. Super Admin has access to everything
  if (isSuperAdmin.value) return

  // 2. Check for required roles in page meta
  const requiredRoles = to.meta.roles as string | string[] | undefined
  
  if (requiredRoles) {
    if (!hasRole(requiredRoles)) {
      // Unauthorized - redirect to dashboard with a warning possibly
      // For now, simple redirect
      return navigateTo('/dashboard')
    }
  }
})
