'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Eye,
  Reply,
  Trash2,
  User,
  Building2,
  Clock,
  CheckCircle,
  AlertCircle,
  Mail
} from 'lucide-react'

interface Message {
  id: string
  subject: string
  content: string
  status: string
  priority: string
  createdAt: string
  updatedAt: string
  sender: {
    name: string
    email: string
    role: string
  }
  recipient?: {
    name: string
    email: string
    role: string
  }
  company?: {
    name: string
    verified: boolean
  }
  replies: {
    id: string
    content: string
    createdAt: string
    sender: {
      name: string
      role: string
    }
  }[]
}

function MessagesManagement() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [replyContent, setReplyContent] = useState('')

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { q: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(priorityFilter !== 'all' && { priority: priorityFilter }),
      })

      const response = await fetch(`/api/admin/messages?${params}`)
      const data = await response.json()

      if (response.ok) {
        setMessages(data.data)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [currentPage, searchTerm, statusFilter, priorityFilter])

  const handleStatusChange = async (messageId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        fetchMessages()
        if (selectedMessage?.id === messageId) {
          setSelectedMessage({ ...selectedMessage, status: newStatus })
        }
      }
    } catch (error) {
      console.error('Error updating message status:', error)
    }
  }

  const handleReply = async (messageId: string) => {
    if (!replyContent.trim()) return

    try {
      const response = await fetch(`/api/admin/messages/${messageId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent })
      })

      if (response.ok) {
        setReplyContent('')
        fetchMessages()
        // Refresh selected message
        if (selectedMessage) {
          const updatedResponse = await fetch(`/api/admin/messages/${messageId}`)
          const updatedMessage = await updatedResponse.json()
          setSelectedMessage(updatedMessage)
        }
      }
    } catch (error) {
      console.error('Error sending reply:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      OPEN: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      RESOLVED: 'bg-green-100 text-green-800',
      CLOSED: 'bg-gray-100 text-gray-800'
    }
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityBadge = (priority: string) => {
    const styles = {
      LOW: 'bg-gray-100 text-gray-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800'
    }
    return styles[priority as keyof typeof styles] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status: string) => {
    const texts = {
      OPEN: 'Aberto',
      IN_PROGRESS: 'Em Andamento',
      RESOLVED: 'Resolvido',
      CLOSED: 'Fechado'
    }
    return texts[status as keyof typeof texts] || status
  }

  const getPriorityText = (priority: string) => {
    const texts = {
      LOW: 'Baixa',
      MEDIUM: 'Média',
      HIGH: 'Alta',
      URGENT: 'Urgente'
    }
    return texts[priority as keyof typeof texts] || priority
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
                placeholder="Buscar mensagens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os status</option>
            <option value="OPEN">Aberto</option>
            <option value="IN_PROGRESS">Em Andamento</option>
            <option value="RESOLVED">Resolvido</option>
            <option value="CLOSED">Fechado</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas as prioridades</option>
            <option value="LOW">Baixa</option>
            <option value="MEDIUM">Média</option>
            <option value="HIGH">Alta</option>
            <option value="URGENT">Urgente</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Mensagens</h3>
            </div>
            
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center text-gray-500">
                  Carregando mensagens...
                </div>
              ) : messages.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  Nenhuma mensagem encontrada
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedMessage?.id === message.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => setSelectedMessage(message)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                            {message.sender.role === 'COMPANY' ? (
                              <Building2 className="h-4 w-4 text-gray-600" />
                            ) : (
                              <User className="h-4 w-4 text-gray-600" />
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {message.sender.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {message.sender.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadge(message.priority)}`}>
                          {getPriorityText(message.priority)}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(message.status)}`}>
                          {getStatusText(message.status)}
                        </span>
                      </div>
                    </div>
                    
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      {message.subject}
                    </h4>
                    
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {message.content}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDate(message.createdAt)}
                      </div>
                      {message.replies.length > 0 && (
                        <div className="flex items-center">
                          <Reply className="w-3 h-3 mr-1" />
                          {message.replies.length} resposta(s)
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-500">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  Próximo
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border">
            {selectedMessage ? (
              <div>
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">Detalhes</h3>
                    <select
                      value={selectedMessage.status}
                      onChange={(e) => handleStatusChange(selectedMessage.id, e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="OPEN">Aberto</option>
                      <option value="IN_PROGRESS">Em Andamento</option>
                      <option value="RESOLVED">Resolvido</option>
                      <option value="CLOSED">Fechado</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      {selectedMessage.subject}
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      {selectedMessage.content}
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Remetente</h5>
                    <div className="flex items-center space-x-2">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                          {selectedMessage.sender.role === 'COMPANY' ? (
                            <Building2 className="h-4 w-4 text-gray-600" />
                          ) : (
                            <User className="h-4 w-4 text-gray-600" />
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedMessage.sender.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {selectedMessage.sender.email}
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedMessage.replies.length > 0 && (
                    <div className="border-t pt-4">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Respostas</h5>
                      <div className="space-y-3 max-h-40 overflow-y-auto">
                        {selectedMessage.replies.map((reply) => (
                          <div key={reply.id} className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-gray-900">
                                {reply.sender.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(reply.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {reply.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Responder</h5>
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Digite sua resposta..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                    <button
                      onClick={() => handleReply(selectedMessage.id)}
                      disabled={!replyContent.trim()}
                      className="mt-2 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Enviar Resposta
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Selecione uma mensagem para ver os detalhes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminMessagesPage() {
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
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Mensagens</h1>
        <p className="text-gray-600">
          Visualize e responda mensagens de usuários e empresas
        </p>
      </div>

      <MessagesManagement />
    </div>
  )
}