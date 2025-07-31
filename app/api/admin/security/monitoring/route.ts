import { NextRequest, NextResponse } from 'next/server'
import { securityMonitoring } from '@/lib/security-monitoring'
import { securityScheduler } from '@/lib/security-monitoring-scheduler'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logger, LogCategory } from '@/lib/logger'

/**
 * GET /api/admin/security/monitoring
 * Get security monitoring status and active alerts
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'status':
        const schedulerStatus = securityScheduler.getStatus()
        const activeAlerts = securityMonitoring.getActiveAlerts()
        const alertThresholds = securityMonitoring.getAlertThresholds()

        return NextResponse.json({
          scheduler: schedulerStatus,
          activeAlerts: activeAlerts.length,
          alertThresholds: alertThresholds.length,
          alerts: activeAlerts
        })

      case 'alerts':
        const alerts = securityMonitoring.getActiveAlerts()
        return NextResponse.json({ alerts })

      case 'thresholds':
        const thresholds = securityMonitoring.getAlertThresholds()
        return NextResponse.json({ thresholds })

      case 'detect':
        const timeWindow = parseInt(searchParams.get('timeWindow') || '60')
        const patterns = await securityMonitoring.detectSuspiciousActivity(timeWindow)
        return NextResponse.json({ patterns })

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }
  } catch (error) {
    await logger.error(
      LogCategory.SECURITY,
      'Failed to handle security monitoring GET request',
      error as Error
    )

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/security/monitoring
 * Control security monitoring and acknowledge alerts
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, ...params } = body

    switch (action) {
      case 'start_monitoring':
        const intervalMinutes = params.intervalMinutes || 5
        await securityScheduler.start(intervalMinutes)
        
        await logger.info(
          LogCategory.SECURITY,
          `Security monitoring started by admin ${session.user.email}`,
          { intervalMinutes }
        )

        return NextResponse.json({ 
          success: true, 
          message: `Security monitoring started with ${intervalMinutes} minute intervals` 
        })

      case 'stop_monitoring':
        await securityScheduler.stop()
        
        await logger.info(
          LogCategory.SECURITY,
          `Security monitoring stopped by admin ${session.user.email}`
        )

        return NextResponse.json({ 
          success: true, 
          message: 'Security monitoring stopped' 
        })

      case 'run_now':
        await securityScheduler.runNow()
        
        await logger.info(
          LogCategory.SECURITY,
          `Security monitoring cycle triggered by admin ${session.user.email}`
        )

        return NextResponse.json({ 
          success: true, 
          message: 'Security monitoring cycle executed' 
        })

      case 'acknowledge_alert':
        const { alertId } = params
        if (!alertId) {
          return NextResponse.json(
            { error: 'Alert ID is required' },
            { status: 400 }
          )
        }

        const acknowledged = await securityMonitoring.acknowledgeAlert(
          alertId, 
          session.user.email || session.user.id
        )

        if (!acknowledged) {
          return NextResponse.json(
            { error: 'Alert not found' },
            { status: 404 }
          )
        }

        return NextResponse.json({ 
          success: true, 
          message: 'Alert acknowledged' 
        })

      case 'update_threshold':
        const { thresholdName, updates } = params
        if (!thresholdName || !updates) {
          return NextResponse.json(
            { error: 'Threshold name and updates are required' },
            { status: 400 }
          )
        }

        const updated = securityMonitoring.updateAlertThreshold(thresholdName, updates)
        
        if (!updated) {
          return NextResponse.json(
            { error: 'Threshold not found' },
            { status: 404 }
          )
        }

        await logger.info(
          LogCategory.SECURITY,
          `Alert threshold updated by admin ${session.user.email}`,
          { thresholdName, updates }
        )

        return NextResponse.json({ 
          success: true, 
          message: 'Alert threshold updated' 
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    await logger.error(
      LogCategory.SECURITY,
      'Failed to handle security monitoring POST request',
      error as Error
    )

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}