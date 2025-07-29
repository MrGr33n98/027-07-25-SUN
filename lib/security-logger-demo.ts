/**
 * Security Logger Demonstration
 * 
 * This file demonstrates the SecurityLogger functionality with practical examples.
 * Run this with: npx ts-node lib/security-logger-demo.ts
 */

import { securityLogger } from './security-logger'

async function demonstrateSecurityLogger() {
  console.log('🔒 Security Logger Demonstration\n')

  // Simulate user registration
  console.log('1. Simulating user registration...')
  await securityLogger.logRegistration(
    'demo@example.com',
    true,
    '192.168.1.100',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'user-demo-123',
    {
      registrationMethod: 'email_password',
      emailVerificationRequired: true
    }
  )

  // Simulate email verification token generation
  console.log('2. Generating email verification token...')
  await securityLogger.logTokenGenerated(
    'email_verification',
    'user-demo-123',
    'demo@example.com',
    '192.168.1.100',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  )

  // Simulate successful login
  console.log('3. Simulating successful login...')
  await securityLogger.logAuthenticationAttempt(
    'demo@example.com',
    true,
    '192.168.1.100',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'user-demo-123',
    {
      loginMethod: 'email_password',
      sessionCreated: true
    }
  )

  // Simulate session creation
  console.log('4. Creating user session...')
  await securityLogger.logSessionCreated(
    'user-demo-123',
    'session-demo-456',
    '192.168.1.100',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  )

  // Simulate failed login attempts (potential brute force)
  console.log('5. Simulating failed login attempts...')
  for (let i = 0; i < 3; i++) {
    await securityLogger.logAuthenticationAttempt(
      'demo@example.com',
      false,
      '192.168.1.200',
      'curl/7.68.0',
      undefined,
      {
        reason: 'invalid_credentials',
        attemptNumber: i + 1
      }
    )
  }

  // Simulate suspicious activity detection
  console.log('6. Detecting suspicious activity...')
  await securityLogger.logSuspiciousActivity(
    'Multiple rapid failed login attempts from suspicious IP',
    'HIGH',
    '192.168.1.200',
    'curl/7.68.0',
    undefined,
    'demo@example.com',
    {
      failedAttempts: 3,
      timeWindow: '5 minutes',
      pattern: 'brute_force_attempt',
      ipReputation: 'suspicious'
    }
  )

  // Simulate account lockout
  console.log('7. Triggering account lockout...')
  await securityLogger.logAccountLockout(
    'demo@example.com',
    'Multiple failed login attempts from suspicious IP',
    1800, // 30 minutes
    '192.168.1.200',
    'curl/7.68.0',
    'user-demo-123',
    {
      automatic: true,
      triggerEvent: 'suspicious_activity',
      lockoutLevel: 1
    }
  )

  // Simulate password change
  console.log('8. User changing password...')
  await securityLogger.logPasswordChange(
    'user-demo-123',
    '192.168.1.100',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    true,
    {
      method: 'user_initiated',
      reason: 'security_concern',
      sessionInvalidated: true
    }
  )

  // Simulate password reset request
  console.log('9. Password reset request...')
  await securityLogger.logPasswordResetRequest(
    'demo@example.com',
    '192.168.1.100',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    true,
    'user-demo-123',
    {
      requestMethod: 'forgot_password_form',
      emailSent: true
    }
  )

  // Simulate email verification
  console.log('10. Email verification completed...')
  await securityLogger.logEmailVerification(
    'demo@example.com',
    '192.168.1.100',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    true,
    'user-demo-123',
    {
      tokenUsed: true,
      verificationMethod: 'email_link'
    }
  )

  // Generate security report
  console.log('\n📊 Generating security report...')
  const endDate = new Date()
  const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000) // Last 24 hours

  const report = await securityLogger.generateSecurityReport(startDate, endDate)
  
  console.log('Security Report Summary:')
  console.log(`- Total Events: ${report.totalEvents}`)
  console.log(`- Successful Events: ${report.successfulEvents}`)
  console.log(`- Failed Events: ${report.failedEvents}`)
  console.log(`- Event Types:`, Object.keys(report.eventsByType).length)
  console.log(`- Top IP Addresses:`, report.topIpAddresses.slice(0, 3))
  console.log(`- Suspicious Activities:`, report.suspiciousActivity.length)

  if (report.suspiciousActivity.length > 0) {
    console.log('\n⚠️  Suspicious Activities Detected:')
    report.suspiciousActivity.forEach((activity, index) => {
      console.log(`${index + 1}. ${activity.description} (Count: ${activity.count})`)
    })
  }

  // Retrieve recent security events
  console.log('\n📋 Recent Security Events:')
  const recentEvents = await securityLogger.getSecurityEvents({
    limit: 5,
    startDate: startDate
  })

  recentEvents.forEach((event, index) => {
    console.log(`${index + 1}. [${event.eventType}] ${event.success ? '✅' : '❌'} - ${event.email || 'N/A'} from ${event.ipAddress}`)
  })

  console.log('\n✅ Security Logger demonstration completed!')
  console.log('\nNote: In a real application, these events would be triggered by actual user actions.')
  console.log('The SecurityLogger provides comprehensive audit trails for all authentication events.')
}

// Run the demonstration
if (require.main === module) {
  demonstrateSecurityLogger()
    .then(() => {
      console.log('\n🎉 Demo completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Demo failed:', error)
      process.exit(1)
    })
}

export { demonstrateSecurityLogger }