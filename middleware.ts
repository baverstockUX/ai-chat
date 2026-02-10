import { auth } from '@/app/(auth)/auth';

export default auth((req) => {
  // Authentication is handled by NextAuth middleware
  // This will protect all routes except those in the matcher config below
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login page)
     * - register (registration page)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|login|register).*)',
  ],
};
