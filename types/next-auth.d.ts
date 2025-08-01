import { UserRole, UserStatus } from '@prisma/client'
import type { User } from 'next-auth'
import type { JWT } from 'next-auth/jwt'

type UserId = string

declare module 'next-auth/jwt' {
  interface JWT {
    id: UserId
    role: UserRole
    status: UserStatus
    company?: any
  }
}

declare module 'next-auth' {
  interface Session {
    user: User & {
      id: UserId
      role: UserRole
      status: UserStatus
      company?: any
    }
  }
  
  interface User {
    role: UserRole
    status: UserStatus
    company?: any
  }
}