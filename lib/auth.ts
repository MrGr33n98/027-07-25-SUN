import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { db } from '@/lib/db'
import { compare } from 'bcryptjs'

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(db) as any,
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/login',
    },
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                console.log('🔍 Tentativa de login:', credentials?.email)

                if (!credentials?.email || !credentials?.password) {
                    console.log('❌ Credenciais faltando')
                    return null
                }

                const user = await db.user.findUnique({
                    where: {
                        email: credentials.email,
                    },
                    include: {
                        company: true,
                    },
                })

                console.log('👤 Usuário encontrado:', user ? `${user.name} (${user.role})` : 'Não encontrado')

                if (!user) {
                    console.log('❌ Usuário não encontrado no banco')
                    return null
                }

                if (!user.passwordHash) {
                    console.log('❌ Usuário não possui senha cadastrada (provavelmente login social)')
                    return null
                }

                const isPasswordValid = await compare(credentials.password, user.passwordHash)

                if (!isPasswordValid) {
                    console.log('❌ Senha inválida')
                    return null
                }

                console.log('✅ Login autorizado para:', user.email, 'Role:', user.role)

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    company: user.company,
                }
            },
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role
                token.company = user.company
            }
            return token
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.sub!
                session.user.role = token.role as any
                session.user.company = token.company as any
            }
            return session
        },
    },
}