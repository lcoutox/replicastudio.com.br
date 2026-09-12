import { NextResponse, type NextRequest } from "next/server";
import { NOME_COOKIE, tokenValido } from "@/lib/auth/session";

const ROTAS_PUBLICAS = ["/login", "/api/auth/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ehRotaPublica = ROTAS_PUBLICAS.some((rota) => pathname === rota);
  const ehAsset = pathname.startsWith("/_next") || pathname.startsWith("/favicon");

  if (ehRotaPublica || ehAsset) return NextResponse.next();

  const cookie = req.cookies.get(NOME_COOKIE)?.value;
  if (!(await tokenValido(cookie))) {
    const destino = new URL("/login", req.url);
    return NextResponse.redirect(destino);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
