'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  Send, 
  MessageCircle, 
  Search,
  Phone,
  Video,
  MoreVertical
} from 'lucide-react'

interface Message {
  id: string
  content: string
  createdAt: string
  read: boolean
  sender: {
    id: string
    name: string
    image?: string
  }
  receiver: {
    id: string
    name: string
    image?: string
  }
}

interface Conversation {
  id: string
  participants: Array<{
    id: string
    name: string
    image?: string
  }>
  messages: Message[]
  updatedAt: string
}

export function MessageCenter() {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (session?.user) {
      fetchConversations()
    }
  }, [session])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation)
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/messages')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.data)
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messages?conversationId=${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.data)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || loading) return

    const currentConversation = conversations.find(c => c.id === selectedConversation)
    if (!currentConversation) return

    const receiverId = currentConversation.participants.find(p => p.id !== session?.user?.id)?.id
    if (!receiverId) return

    try {
      setLoading(true)
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
          receiverId,
          conversationId: selectedConversation,
        }),
      })

      if (response.ok) {
        const message = await response.json()
        setMessages(prev => [...prev, message])
        setNewMessage('')
        fetchConversations() // Refresh conversations to update last message
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem'
    } else {
      return date.toLocaleDateString('pt-BR')
    }
  }

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.id !== session?.user?.id)
  }

  const filteredConversations = conversations.filter(conversation => {
    const otherParticipant = getOtherParticipant(conversation)
    return otherParticipant?.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  if (!session?.user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Faça login para acessar suas mensagens</p>
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6 h-[600px]">
      {/* Conversations List */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            Conversas
          </CardTitle>
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
          <div className="max-h-96 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                Nenhuma conversa encontrada
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const otherParticipant = getOtherParticipant(conversation)
                const lastMessage = conversation.messages[0]
                
                return (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    className={`flex items-center space-x-3 p-4 cursor-pointer hover:bg-gray-50 border-b ${
                      selectedConversation === conversation.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <Avatar>
                      <AvatarImage src={otherParticipant?.image} />
                      <AvatarFallback>
                        {otherParticipant?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {otherParticipant?.name}
                        </p>
                        <span className="text-xs text-gray-500">
                          {lastMessage && formatTime(lastMessage.createdAt)}
                        </span>
                      </div>
                      
                      {lastMessage && (
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {lastMessage.sender.id === session.user.id ? 'Você: ' : ''}
                          {lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card className="lg:col-span-2">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={getOtherParticipant(conversations.find(c => c.id === selectedConversation)!)?.image} />
                    <AvatarFallback>
                      {getOtherParticipant(conversations.find(c => c.id === selectedConversation)!)?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">
                      {getOtherParticipant(conversations.find(c => c.id === selectedConversation)!)?.name}
                    </h3>
                    <p className="text-sm text-gray-500">Online</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 p-4 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {messages.map((message, index) => {
                  const isOwnMessage = message.sender.id === session.user.id
                  const showDate = index === 0 || 
                    formatDate(messages[index - 1].createdAt) !== formatDate(message.createdAt)
                  
                  return (
                    <div key={message.id}>
                      {showDate && (
                        <div className="text-center text-xs text-gray-500 my-4">
                          {formatDate(message.createdAt)}
                        </div>
                      )}
                      
                      <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isOwnMessage 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-900'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>

            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  className="flex-1"
                />
                <Button 
                  onClick={sendMessage}
                  disabled={loading || !newMessage.trim()}
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <CardContent className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Selecione uma conversa para começar</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}