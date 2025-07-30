'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Clock, 
  Play, 
  Square, 
  RefreshCw,
  CheckCircle,
  Settings,
  Eye,
  TrendingUp
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface SecurityAlert {
  id: string
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  description: string
  ipAddress?: string
  userId?: string
  email?: string
  count: number
  detectedAt: string
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: string
  details: Record<string, any>
}

interface AlertThreshold {
  name: string
  eventType?: string
  condition: string
  threshold: number
  timeWindowMinutes: number
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  enabled: boolean
}

interface SuspiciousPattern {
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  ipAddress?: string
  userId?: string
  email?: string
  count: number
  timeWindow: string
  details: Record<string, any>
}

interface MonitoringStatus {
  scheduler: {
    isRunning: boolean
    intervalMinutes: number
    nextRunTime?: string
  }
  activeAlerts: number
  alertThresholds: number
  alerts: SecurityAlert[]
}

export function SecurityMonitoringDashboard() {
  const [status, setStatus] = useState<MonitoringStatus | null>(null)
  const [alerts, setAlerts] = useState<SecurityAlert[]>([])
  const [thresholds, setThresholds] = useState<AlertThreshold[]>([])
  const [patterns, setPatterns] = useState<SuspiciousPattern[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { addToast } = useToast()

  useEffect(() => {
    loadMonitoringData()
    // Refresh data every 30 seconds
    const interval = setInterval(loadMonitoringData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadMonitoringData = async () => {
    try {
      const [statusRes, alertsRes, thresholdsRes] = await Promise.all([
        fetch('/api/admin/security/monitoring?action=status'),
        fetch('/api/admin/security/monitoring?action=alerts'),
        fetch('/api/admin/security/monitoring?action=thresholds')
      ])

      if (statusRes.ok) {
        const statusData = await statusRes.json()
        setStatus(statusData)
      }

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json()
        setAlerts(alertsData.alerts)
      }

      if (thresholdsRes.ok) {
        const thresholdsData = await thresholdsRes.json()
        setThresholds(thresholdsData.thresholds)
      }
    } catch (error) {
      console.error('Failed to load monitoring data:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load monitoring data'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMonitoringAction = async (action: string, params?: any) => {
    setActionLoading(action)
    try {
      const response = await fetch('/api/admin/security/monitoring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, ...params })
      })

      const data = await response.json()

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Success',
          message: data.message
        })
        await loadMonitoringData()
      } else {
        addToast({
          type: 'error',
          title: 'Error',
          message: data.error || 'Action failed'
        })
      }
    } catch (error) {
      console.error('Action failed:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Action failed'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const detectSuspiciousActivity = async () => {
    setActionLoading('detect')
    try {
      const response = await fetch('/api/admin/security/monitoring?action=detect&timeWindow=60')
      const data = await response.json()

      if (response.ok) {
        setPatterns(data.patterns)
        addToast({
          type: 'success',
          title: 'Analysis Complete',
          message: `Found ${data.patterns.length} suspicious patterns`
        })
      }
    } catch (error) {
      console.error('Detection failed:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Suspicious activity detection failed'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200'
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'HIGH': return <AlertTriangle className="w-4 h-4 text-orange-600" />
      case 'MEDIUM': return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'LOW': return <AlertTriangle className="w-4 h-4 text-blue-600" />
      default: return <AlertTriangle className="w-4 h-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading security monitoring data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Monitoring</h1>
          <p className="text-gray-600">Real-time security monitoring and threat detection</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => loadMonitoringData()}
            disabled={actionLoading === 'refresh'}
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${actionLoading === 'refresh' ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={detectSuspiciousActivity}
            disabled={actionLoading === 'detect'}
            variant="outline"
          >
            <Eye className="w-4 h-4 mr-2" />
            Detect Threats
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Monitoring Status</p>
                <p className="text-lg font-semibold">
                  {status?.scheduler.isRunning ? (
                    <span className="text-green-600">Active</span>
                  ) : (
                    <span className="text-red-600">Stopped</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                <p className="text-lg font-semibold">{status?.activeAlerts || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Alert Rules</p>
                <p className="text-lg font-semibold">{thresholds.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Check Interval</p>
                <p className="text-lg font-semibold">{status?.scheduler.intervalMinutes || 0}m</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monitoring Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Monitoring Controls</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            {status?.scheduler.isRunning ? (
              <Button
                onClick={() => handleMonitoringAction('stop_monitoring')}
                disabled={actionLoading === 'stop_monitoring'}
                variant="destructive"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop Monitoring
              </Button>
            ) : (
              <Button
                onClick={() => handleMonitoringAction('start_monitoring', { intervalMinutes: 5 })}
                disabled={actionLoading === 'start_monitoring'}
              >
                <Play className="w-4 h-4 mr-2" />
                Start Monitoring
              </Button>
            )}
            
            <Button
              onClick={() => handleMonitoringAction('run_now')}
              disabled={actionLoading === 'run_now'}
              variant="outline"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${actionLoading === 'run_now' ? 'animate-spin' : ''}`} />
              Run Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Active Security Alerts</span>
            <Badge variant="secondary">{alerts.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <p>No active security alerts</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <Alert key={alert.id} className="border-l-4 border-l-red-500">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold">{alert.title}</h4>
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <AlertDescription className="text-sm text-gray-600 mb-2">
                          {alert.description}
                        </AlertDescription>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>Detected: {new Date(alert.detectedAt).toLocaleString()}</p>
                          {alert.ipAddress && <p>IP Address: {alert.ipAddress}</p>}
                          {alert.email && <p>Email: {alert.email}</p>}
                          <p>Event Count: {alert.count}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {!alert.acknowledged && (
                        <Button
                          size="sm"
                          onClick={() => handleMonitoringAction('acknowledge_alert', { alertId: alert.id })}
                          disabled={actionLoading === 'acknowledge_alert'}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suspicious Activity Patterns */}
      {patterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Detected Suspicious Patterns</span>
              <Badge variant="secondary">{patterns.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {patterns.map((pattern, index) => (
                <Alert key={index} className="border-l-4 border-l-orange-500">
                  <div className="flex items-start space-x-3">
                    {getSeverityIcon(pattern.severity)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold capitalize">{pattern.type.replace('_', ' ')}</h4>
                        <Badge className={getSeverityColor(pattern.severity)}>
                          {pattern.severity}
                        </Badge>
                      </div>
                      <AlertDescription className="text-sm text-gray-600 mb-2">
                        {pattern.description}
                      </AlertDescription>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>Time Window: {pattern.timeWindow}</p>
                        {pattern.ipAddress && <p>IP Address: {pattern.ipAddress}</p>}
                        {pattern.email && <p>Email: {pattern.email}</p>}
                        <p>Event Count: {pattern.count}</p>
                      </div>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Alert Thresholds</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {thresholds.map((threshold) => (
              <div key={threshold.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-semibold capitalize">{threshold.name.replace('_', ' ')}</h4>
                  <p className="text-sm text-gray-600">
                    {threshold.condition === 'count_exceeds' ? 'Count exceeds' : 'Rate exceeds'} {threshold.threshold} 
                    in {threshold.timeWindowMinutes} minutes
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getSeverityColor(threshold.severity)}>
                    {threshold.severity}
                  </Badge>
                  <Badge variant={threshold.enabled ? 'default' : 'secondary'}>
                    {threshold.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}