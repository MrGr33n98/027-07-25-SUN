import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    console.log('🔒 Middleware executado para:', req.nextUrl.pathname)
    console.log('🎫 Token role:', req.nextauth.token?.role)

    if (!req.nextauth.token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Email verification check
    if (!req.nextauth.token.emailVerified) {
      const url = new URL('/verify-email', req.url)
      url.searchParams.set('email', req.nextauth.token.email as string)
      return NextResponse.redirect(url)
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        console.log('🔍 Verificando autorização para:', req.nextUrl.pathname)
        console.log('🎫 Token:', token?.role)

        if (!token) {
          return false
        }
        
        // Protect dashboard routes
        if (req.nextUrl.pathname.startsWith('/dashboard')) {
          const isAuthorized = token?.role === 'COMPANY'
          console.log('📊 Dashboard - Autorizado:', isAuthorized)
          return isAuthorized
        }
        
        // Protect admin routes
        if (req.nextUrl.pathname.startsWith('/admin')) {
          const isAuthorized = token?.role === 'ADMIN'
          console.log('⚡ Admin - Autorizado:', isAuthorized)
          return isAuthorized
        }
        
        console.log('✅ Rota pública - Autorizado')
        return true
      },
    },
  }
)

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*']
}