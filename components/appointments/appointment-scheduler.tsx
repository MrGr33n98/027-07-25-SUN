'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Edit,
  Trash2
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface TimeSlot {
  time: string
  available: boolean
}

interface Appointment {
  id: string
  title: string
  description?: string
  date: string
  duration: number
  location: string
  status: string
  notes?: string
  company: {
    name: string
    phone?: string
    email?: string
  }
  user: {
    name: string
    email: string
  }
}

interface AppointmentSchedulerProps {
  companyId: string
  companyName: string
  onSuccess?: () => void
}

export function AppointmentScheduler({ companyId, companyName, onSuccess }: AppointmentSchedulerProps) {
  const { data: session } = useSession()
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [formData, setFormData] = useState({
    title: 'Visita técnica para avaliação',
    description: '',
    location: '',
    duration: 60,
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const { addToast } = useToast()

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots()
    }
  }, [selectedDate])

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAvailableSlots = async () => {
    try {
      const response = await fetch(`/api/appointments/slots?companyId=${companyId}&date=${selectedDate}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data.slots || [])
      }
    } catch (error) {
      console.error('Error fetching slots:', error)
    }
  }

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments')
      if (response.ok) {
        const data = await response.json()
        setAppointments(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
    }
  }

  const scheduleAppointment = async () => {
    if (!session?.user) {
      addToast({
        type: 'error',
        title: 'Login necessário',
        message: 'Você precisa estar logado para agendar uma visita'
      })
      return
    }

    if (!selectedDate || !selectedTime || !formData.location) {
      addToast({
        type: 'error',
        title: 'Campos obrigatórios',
        message: 'Preencha data, horário e localização'
      })
      return
    }

    try {
      setLoading(true)
      
      const appointmentDate = new Date(`${selectedDate}T${selectedTime}:00`)
      
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          date: appointmentDate.toISOString(),
          companyId,
        }),
      })

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Agendamento realizado!',
          message: 'Sua visita foi agendada com sucesso'
        })
        
        // Reset form
        setSelectedDate('')
        setSelectedTime('')
        setFormData({
          title: 'Visita técnica para avaliação',
          description: '',
          location: '',
          duration: 60,
          notes: ''
        })
        
        fetchAppointments()
        onSuccess?.()
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao agendar')
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro no agendamento',
        message: error instanceof Error ? error.message : 'Não foi possível agendar a visita'
      })
    } finally {
      setLoading(false)
    }
  }

  const updateAppointmentStatus = async (appointmentId: string, status: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Status atualizado',
          message: `Agendamento ${status === 'CONFIRMED' ? 'confirmado' : 'cancelado'} com sucesso`
        })
        
        fetchAppointments()
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível atualizar o status'
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      SCHEDULED: { label: 'Agendado', variant: 'secondary' as const },
      CONFIRMED: { label: 'Confirmado', variant: 'default' as const },
      COMPLETED: { label: 'Concluído', variant: 'default' as const },
      CANCELLED: { label: 'Cancelado', variant: 'secondary' as const },
      RESCHEDULED: { label: 'Reagendado', variant: 'secondary' as const },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.SCHEDULED
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      {/* Scheduling Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-6 h-6 mr-2" />
            Agendar Visita com {companyName}
          </CardTitle>
          <p className="text-gray-600">
            Agende uma visita técnica para avaliação do seu projeto
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Título da visita</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="duration">Duração (minutos)</Label>
              <select
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md"
              >
                <option value={30}>30 minutos</option>
                <option value={60}>1 hora</option>
                <option value={90}>1h 30min</option>
                <option value={120}>2 horas</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva o que será avaliado na visita..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="location">Endereço da visita *</Label>
            <Input
              id="location"
              placeholder="Rua, número, bairro, cidade"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="mt-1"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                min={today}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="time">Horário *</Label>
              {selectedDate ? (
                <select
                  id="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Selecione um horário</option>
                  {availableSlots.map((slot) => (
                    <option 
                      key={slot.time} 
                      value={slot.time}
                      disabled={!slot.available}
                    >
                      {slot.time} {!slot.available && '(Ocupado)'}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="mt-1 p-2 border border-gray-300 rounded-md text-gray-500 text-sm">
                  Selecione uma data primeiro
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Informações adicionais..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="mt-1"
              rows={2}
            />
          </div>

          <Button
            onClick={scheduleAppointment}
            disabled={loading || !selectedDate || !selectedTime || !formData.location}
            className="w-full"
          >
            {loading ? (
              'Agendando...'
            ) : (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                Agendar Visita
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* My Appointments */}
      {appointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Meus Agendamentos</CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-start justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium text-gray-900">
                        {appointment.title}
                      </h3>
                      {getStatusBadge(appointment.status)}
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(appointment.date)}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        {formatTime(appointment.date)} ({appointment.duration}min)
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        {appointment.location}
                      </div>
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        {appointment.company.name}
                      </div>
                    </div>
                    
                    {appointment.description && (
                      <p className="text-sm text-gray-600 mt-2">
                        {appointment.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {appointment.status === 'SCHEDULED' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateAppointmentStatus(appointment.id, 'CONFIRMED')}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateAppointmentStatus(appointment.id, 'CANCELLED')}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}