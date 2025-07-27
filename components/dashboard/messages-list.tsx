'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  MessageSquare, 
  Send, 
  Search,
  User,
  Clock,
  CheckCheck,
  Circle
} from 'lucide-react'

export function MessagesList() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>('1')
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Mock conversations data
  const mockConversations = [
    {
      id: '1',
      customerName: 'João Silva',
      customerEmail: 'joao@email.com',
      lastMessage: 'Obrigado pelo orçamento! Quando podemos agendar a visita técnica?',
      lastMessageTime: new Date('2024-01-20T14:30:00'),
      unreadCount: 2,
      status: 'active',
    },
    {
      id: '2',
      customerName: 'Maria Santos',
      customerEmail: 'maria@empresa.com',
      lastMessage: 'Gostaria de saber mais sobre o financiamento.',
      lastMessageTime: new Date('2024-01-20T10:15:00'),
      unreadCount: 0,
      status: 'active',
    },
    {
      id: '3',
      customerName: 'Pedro Costa',
      customerEmail: 'pedro@fazenda.com',
      lastMessage: 'Perfeito! Vamos fechar o negócio.',
      lastMessageTime: new Date('2024-01-19T16:45:00'),
      unreadCount: 1,
      status: 'closed',
    },
  ]

  // Mock messages for selected conversation
  const mockMessages = [
    {
      id: '1',
      senderId: 'customer',
      senderName: 'João Silva',
      content: 'Olá! Gostaria de um orçamento para energia solar residencial.',
      timestamp: new Date('2024-01-20T09:00:00'),
      read: true,
    },
    {
      id: '2',
      senderId: 'company',
      senderName: 'Solar Tech',
      content: 'Olá João! Ficamos felizes com seu interesse. Para elaborar um orçamento preciso, preciso de algumas informações sobre sua residência.',
      timestamp: new Date('2024-01-20T09:15:00'),
      read: true,
    },
    {
      id: '3',
      senderId: 'customer',
      senderName: 'João Silva',
      content: 'Claro! Minha casa tem cerca de 120m², conta de luz média de R$ 350/mês. Fica em São Paulo, zona sul.',
      timestamp: new Date('2024-01-20T09:30:00'),
      read: true,
    },
    {
      id: '4',
      senderId: 'company',
      senderName: 'Solar Tech',
      content: 'Perfeito! Com base nessas informações, um sistema de 5kWp seria ideal. Vou preparar um orçamento detalhado e envio ainda hoje.',
      timestamp: new Date('2024-01-20T10:00:00'),
      read: true,
    },
    {
      id: '5',
      senderId: 'customer',
      senderName: 'João Silva',
      content: 'Obrigado pelo orçamento! Quando podemos agendar a visita técnica?',
      timestamp: new Date('2024-01-20T14:30:00'),
      read: false,
    },
  ]

  const filteredConversations = mockConversations.filter(conv =>
    conv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedConv = mockConversations.find(conv => conv.id === selectedConversation)

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    }
  }

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // TODO: Implement send message functionality
      console.log('Sending message:', newMessage)
      setNewMessage('')
    }
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6 h-[600px]">
      {/* Conversations List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Conversas
          </CardTitle>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation.id)}
                className={`p-4 cursor-pointer hover:bg-gray-50 border-b transition-colors ${
                  selectedConversation === conversation.id ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{conversation.customerName}</h4>
                      <p className="text-xs text-gray-500">{conversation.customerEmail}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-500">
                      {formatTime(conversation.lastMessageTime)}
                    </span>
                    {conversation.unreadCount > 0 && (
                      <span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mt-1">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-2">
                  {conversation.lastMessage}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card className="lg:col-span-2">
        {selectedConv ? (
          <>
            <CardHeader className="border-b">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{selectedConv.customerName}</h3>
                  <p className="text-sm text-gray-500">{selectedConv.customerEmail}</p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0 flex flex-col h-96">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {mockMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === 'company' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId === 'company'
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className={`flex items-center justify-end mt-1 space-x-1 ${
                        message.senderId === 'company' ? 'text-orange-100' : 'text-gray-500'
                      }`}>
                        <span className="text-xs">
                          {formatTime(message.timestamp)}
                        </span>
                        {message.senderId === 'company' && (
                          message.read ? (
                            <CheckCheck className="w-3 h-3" />
                          ) : (
                            <Circle className="w-3 h-3" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSendMessage}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Selecione uma conversa
              </h3>
              <p className="text-gray-600">
                Escolha uma conversa da lista para começar a conversar
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}