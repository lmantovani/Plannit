/**
 * Token CSRF para chamadas fetch em JSON fora do router do Inertia.
 * O cookie XSRF-TOKEN é exposto pelo @adonisjs/shield (enableXsrfCookie em config/shield.ts).
 */
export const getXsrfToken = (): string => {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : ''
}
