import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    console.log('🔒 Middleware executado para:', req.nextUrl.pathname)
    console.log('🎫 Token role:', req.nextauth.token?.role)
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        console.log('🔍 Verificando autorização para:', req.nextUrl.pathname)
        console.log('🎫 Token:', token?.role)
        
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