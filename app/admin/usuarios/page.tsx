'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import {
    Users,
    Search,
    Shield,
    CheckCircle,
    Trash2,
    Eye,
    Calendar,
    Mail
} from 'lucide-react'

interface User {
    id: string
    name: string
    email: string
    role: string
    status: string
    createdAt: string
    lastLogin?: string
    companyProfile?: {
        name: string
        verified: boolean
    }
    _count: {
        appointments: number
        reviews: number
    }
}

function UsersManagement() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '20',
                ...(searchTerm && { q: searchTerm }),
                ...(roleFilter !== 'all' && { role: roleFilter }),
                ...(statusFilter !== 'all' && { status: statusFilter }),
            })

            const response = await fetch(`/api/admin/users?${params}`)
            const data = await response.json()

            if (response.ok) {
                setUsers(data.data)
                setTotalPages(data.totalPages)
            }
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [currentPage, searchTerm, roleFilter, statusFilter])

    const handleStatusChange = async (userId: string, newStatus: string) => {
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })

            if (response.ok) {
                fetchUsers()
            }
        } catch (error) {
            console.error('Error updating user status:', error)
        }
    }

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole })
            })

            if (response.ok) {
                fetchUsers()
            }
        } catch (error) {
            console.error('Error updating user role:', error)
        }
    }

    const getStatusBadge = (status: string) => {
        const styles = {
            ACTIVE: 'bg-green-100 text-green-800',
            SUSPENDED: 'bg-red-100 text-red-800',
            PENDING: 'bg-yellow-100 text-yellow-800'
        }
        return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
    }

    const getRoleBadge = (role: string) => {
        const styles = {
            ADMIN: 'bg-purple-100 text-purple-800',
            COMPANY: 'bg-blue-100 text-blue-800',
            USER: 'bg-gray-100 text-gray-800'
        }
        return styles[role as keyof typeof styles] || 'bg-gray-100 text-gray-800'
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Buscar usuários..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Todos os papéis</option>
                        <option value="USER">Usuários</option>
                        <option value="COMPANY">Empresas</option>
                        <option value="ADMIN">Administradores</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Todos os status</option>
                        <option value="ACTIVE">Ativo</option>
                        <option value="SUSPENDED">Suspenso</option>
                        <option value="PENDING">Pendente</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Usuário
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Papel
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Atividade
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cadastro
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        Carregando usuários...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        Nenhum usuário encontrado
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                                        <Users className="h-5 w-5 text-gray-600" />
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {user.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500 flex items-center">
                                                        <Mail className="w-3 h-3 mr-1" />
                                                        {user.email}
                                                    </div>
                                                    {user.companyProfile && (
                                                        <div className="text-xs text-blue-600 flex items-center mt-1">
                                                            <Shield className="w-3 h-3 mr-1" />
                                                            {user.companyProfile.name}
                                                            {user.companyProfile.verified && (
                                                                <CheckCircle className="w-3 h-3 ml-1 text-green-500" />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadge(user.role)}`}
                                            >
                                                <option value="USER">Usuário</option>
                                                <option value="COMPANY">Empresa</option>
                                                <option value="ADMIN">Admin</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={user.status}
                                                onChange={(e) => handleStatusChange(user.id, e.target.value)}
                                                className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(user.status)}`}
                                            >
                                                <option value="ACTIVE">Ativo</option>
                                                <option value="SUSPENDED">Suspenso</option>
                                                <option value="PENDING">Pendente</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="space-y-1">
                                                <div className="flex items-center">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    {user._count.appointments} agendamentos
                                                </div>
                                                <div className="flex items-center">
                                                    <Eye className="w-3 h-3 mr-1" />
                                                    {user._count.reviews} avaliações
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div>
                                                {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                                            </div>
                                            {user.lastLogin && (
                                                <div className="text-xs text-gray-400">
                                                    Último login: {new Date(user.lastLogin).toLocaleDateString('pt-BR')}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button className="text-blue-600 hover:text-blue-900">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button className="text-red-600 hover:text-red-900">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Anterior
                            </button>
                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Próximo
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Página <span className="font-medium">{currentPage}</span> de{' '}
                                    <span className="font-medium">{totalPages}</span>
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    <button
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Anterior
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Próximo
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function AdminUsersPage() {
    const { data: session, status } = useSession()

    if (status === 'loading') {
        return <div>Carregando...</div>
    }

    if (!session) {
        redirect('/login')
    }

    if (session.user.role !== 'ADMIN') {
        redirect('/')
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Gerenciar Usuários</h1>
                <p className="text-gray-600">
                    Visualize e gerencie todos os usuários da plataforma
                </p>
            </div>

            <UsersManagement />
        </div>
    )
}