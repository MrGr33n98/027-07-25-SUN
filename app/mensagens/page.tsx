import { MessageCenter } from '@/components/messages/message-center'

export default function MessagesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mensagens</h1>
        <p className="text-gray-600 mt-2">
          Converse com empresas e clientes em tempo real
        </p>
      </div>
      
      <MessageCenter />
    </div>
  )
}