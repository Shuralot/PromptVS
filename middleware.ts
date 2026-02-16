import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from './lib/auth';

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // 1. Define public routes
  const isPublicRoute = path === '/login' || path === '/';
  const isAuthApi = path.startsWith('/api/auth');
  
  // 2. Get session
  const cookie = req.cookies.get('session')?.value;
  const session = cookie ? await decrypt(cookie).catch(() => null) : null;

  // 3. Handle APIs
  const isInternalApi = path.startsWith('/api/internal');
  if (path.startsWith('/api') && !isAuthApi && !isInternalApi && !session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // 4. Redirect to /login if the user is not authenticated for UI routes
  if (!isPublicRoute && !path.startsWith('/api') && !session) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // 5. Protect admin routes
  if (path.startsWith('/admin') || path.startsWith('/dashboard/admin') || path.startsWith('/api/admin')) {
    if (session?.user?.role !== 'ADMIN') {
        if (path.startsWith('/api')) {
            return NextResponse.json({ error: 'Proibido' }, { status: 403 });
        }
      return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
    }
  }

  // 6. If authenticated, prevent access to /login
  if (isPublicRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  return NextResponse.next();
}

// Routes that should use this middleware
export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/api/:path*'],
};

