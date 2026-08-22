import { NextResponse } from 'next/server';

export function middleware(request) {
  const path = request.nextUrl.pathname;
  
  // Публичные пути (доступны без авторизации)
  const publicPaths = ['/login'];
  const isPublicPath = publicPaths.some(publicPath => 
    path === publicPath || path.startsWith(publicPath + '/')
  );

  // Проверяем наличие сессии через cookie
  const sessionCookie = request.cookies.get('sessionid');
  
  // Для API запросов - проверяем авторизацию
  if (path.startsWith('/api/')) {
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Неавторизован' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Если пользователь не авторизован и пытается зайти на защищенную страницу
  if (!sessionCookie && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Если пользователь авторизован и пытается зайти на /login
  if (sessionCookie && isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};