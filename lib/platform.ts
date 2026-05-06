/**
 * URL a la que se navega cuando el usuario hace click en "Iniciar sesión".
 *
 * Configurable vía env. Default: prototipo embebido en /public/monitoreo/.
 * Cuando la plataforma se mude a su propio dominio (ej. app.sekura.com.ar),
 * cambiar el valor de NEXT_PUBLIC_PLATFORM_URL en .env.local + Vercel.
 */
export const PLATFORM_URL =
  process.env.NEXT_PUBLIC_PLATFORM_URL ?? "/monitoreo/";
