import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";

/**
 * Middleware de routing por idioma:
 *  /                  → redirect /es
 *  /es/...  /pt/...   → seguir + setear header x-locale (lo lee el layout)
 *  /otra-cosa         → redirect /es/otra-cosa
 *
 * Excluye rutas internas (_next), API y assets estáticos.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Detectar el primer segmento de la URL.
  const firstSegment = pathname.split("/")[1] ?? "";

  // Si ya viene con locale válido, dejar pasar y propagar el locale como header.
  if (isLocale(firstSegment)) {
    const response = NextResponse.next();
    response.headers.set("x-locale", firstSegment);
    return response;
  }

  // Caso raíz: redirect al locale default.
  if (pathname === "/") {
    return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}`, request.url));
  }

  // Cualquier otra ruta sin locale: prefijar con default.
  return NextResponse.redirect(
    new URL(`/${DEFAULT_LOCALE}${pathname}`, request.url),
  );
}

export const config = {
  // Aplicar a todo excepto: assets de Next, api, archivos con extensión, y la
  // sub-app /monitoreo/ (prototipo embebido — sirve sus propios HTML/PNG).
  matcher: ["/((?!_next/static|_next/image|api|favicon.ico|monitoreo|.*\\..*).*)"],
};
