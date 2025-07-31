# Secure Authentication System - Deployment Guide

This guide provides comprehensive instructions for deploying the secure authentication system with proper migration, rollback capabilities, and feature flag management.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Migration Scripts](#migration-scripts)
3. [Deployment Procedures](#deployment-procedures)
4. [Feature Flag Management](#feature-flag-management)
5. [Backup and Recovery](#backup-and-recovery)
6. [Rollback Procedures](#rollback-procedures)
7. [Monitoring and Validation](#monitoring-and-validation)
8. [Troubleshooting](#troubleshooting)

## Pre-Deployment Checklist

### Environment Setup

- [ ] Database connection configured (`DATABASE_URL`)
- [ ] NextAuth secret configured (`NEXTAUTH_SECRET`)
- [ ] NextAuth URL configured (`NEXTAUTH_URL`)
- [ ] Redis connection configured (optional, for rate limiting)
- [ ] Email service configured (for verification emails)
- [ ] Backup encryption key configured (`BACKUP_ENCRYPTION_KEY`)

### Security Verification

- [ ] All security tests passing (`npm run test:security`)
- [ ] Performance benchmarks acceptable (`npm run benchmark:auth`)
- [ ] Database indexes optimized (`npm run db:optimize`)
- [ ] SSL/TLS certificates valid
- [ ] Firewall rules configured

### Data Preparation

- [ ] Database backup created
- [ ] User data migration tested in staging
- [ ] Feature flags configured
- [ ] Monitoring systems ready

## Migration Scripts

### 1. User Data Migration

Migrate existing users from demo authentication to secure authentication:

```bash
# Dry run to see what would be migrated
npm run migrate:users:dry-run

# Run actual migration
npm run migrate:users

# With custom batch size
npm run migrate:users -- --batch-size=100 --verbose
```

**What it does:**
- Generates secure temporary passwords for users without passwords
- Hashes passwords using bcrypt with 12+ salt rounds
- Creates email verification tokens for unverified accounts
- Logs security events for audit trail
- Provides temporary passwords for user communication

### 2. Security Data Migration

Clean up and consolidate security-related data:

```bash
# Dry run
npm run migrate:security:dry-run

# Run migration
npm run migrate:security

# Skip specific operations
npm run migrate:security -- --skip-sessions --verbose
```

**What it does:**
- Removes expired sessions
- Consolidates duplicate security events
- Cleans up expired tokens
- Validates data integrity

## Deployment Procedures

### Development Deployment

```bash
# Full deployment with all checks
npm run deploy:auth

# Dry run to see what would happen
npm run deploy:auth:dry-run

# Skip tests (not recommended)
npm run deploy:auth -- --skip-tests

# Verbose output
npm run deploy:auth -- --verbose
```

### Staging Deployment

```bash
# Deploy to staging environment
npm run deploy:auth:staging

# With rollback on failure
npm run deploy:auth:staging -- --rollback-on-failure

# Skip backup (not recommended)
npm run deploy:auth:staging -- --skip-backup
```

### Production Deployment

```bash
# Production deployment (most conservative)
npm run deploy:auth:production

# Always include these flags for production
npm run deploy:auth:production -- --rollback-on-failure --verbose
```

### Deployment Steps

The deployment script performs these steps automatically:

1. **Pre-deployment checks**
   - Database connectivity
   - Environment variables
   - Disk space
   - Redis connectivity (if configured)

2. **Backup creation**
   - Database schema backup
   - User data backup
   - Configuration files backup

3. **Testing**
   - Security tests
   - Performance tests
   - Integration tests

4. **Database deployment**
   - Prisma client generation
   - Schema deployment
   - Index optimization

5. **Application deployment**
   - Dependency installation
   - Application build
   - Asset optimization

6. **Data migration**
   - User migration
   - Security data migration
   - Data validation

7. **Post-deployment validation**
   - Database accessibility
   - Security features
   - API endpoints

8. **Health checks**
   - Database connection
   - User model access
   - Security event logging

## Feature Flag Management

### List All Flags

```bash
npm run flags:list
```

### Enable/Disable Features

```bash
# Enable a feature for all users
npm run flags -- enable secure-authentication

# Enable with specific rollout percentage
npm run flags -- enable account-lockout --percentage=25

# Disable a feature
npm run flags -- disable password-reset-v2
```

### Update Feature Configuration

```bash
# Update rollout percentage
npm run flags -- update account-lockout --percentage=50

# Enable for specific users
npm run flags -- update secure-authentication --users=user1,user2,user3

# Enable for specific roles
npm run flags -- update email-verification-required --roles=ADMIN,COMPANY

# Restrict to specific environments
npm run flags -- update rate-limiting --environments=staging,production
```

### Test Feature Flags

```bash
# Test if feature is enabled for a specific user
npm run flags -- test secure-authentication --test-user-id=user123

# Test with user role
npm run flags -- test account-lockout --test-user-role=ADMIN --verbose
```

### Available Feature Flags

- `secure-authentication`: Core secure authentication system
- `password-strength-validation`: Password complexity requirements
- `account-lockout`: Account lockout after failed attempts
- `email-verification-required`: Require email verification
- `rate-limiting`: API rate limiting
- `security-logging`: Security event logging
- `password-reset-v2`: New password reset flow
- `session-management-v2`: New session management

## Backup and Recovery

### Create Backups

```bash
# Full system backup (encrypted and compressed)
npm run backup:create

# Authentication data only
npm run backup:auth

# Custom backup
npm run backup -- create --type=incremental --encrypt --compress --retention=7
```

### List Backups

```bash
npm run backup:list
```

### Restore from Backup

```bash
# Dry run to see what would be restored
npm run backup -- restore /path/to/backup --decrypt --decompress --dry-run

# Actual restore
npm run backup -- restore /path/to/backup --decrypt --decompress --verbose
```

### Backup Types

- **Full**: Complete database backup
- **Auth-only**: Users, security events, and sessions only
- **Incremental**: Only frequently changing tables

## Rollback Procedures

### Automatic Rollback

If deployment fails and `--rollback-on-failure` is enabled, the system will automatically:

1. Execute rollback commands in reverse order
2. Restore from backup if available
3. Reset database schema
4. Restore application code

### Manual Rollback

```bash
# Rollback the last deployment
npm run deploy:rollback

# Rollback with verbose output
npm run deploy:rollback -- --verbose

# Dry run to see what would be rolled back
npm run deploy:rollback -- --dry-run
```

### Emergency Rollback

If the automatic rollback fails:

1. **Restore from backup:**
   ```bash
   npm run backup -- restore /path/to/pre-deployment-backup --decrypt --decompress
   ```

2. **Reset database schema:**
   ```bash
   npx prisma db push --force-reset
   npx prisma db push
   ```

3. **Restore application code:**
   ```bash
   git checkout HEAD~1
   npm ci
   npm run build
   ```

## Monitoring and Validation

### Post-Deployment Checks

1. **Database Health:**
   ```bash
   npx prisma studio
   ```

2. **Security Events:**
   ```sql
   SELECT COUNT(*) FROM security_events WHERE timestamp > NOW() - INTERVAL '1 hour';
   ```

3. **User Authentication:**
   - Test login with existing user
   - Test registration flow
   - Test password reset

4. **Feature Flags:**
   ```bash
   npm run flags:list
   ```

### Performance Monitoring

```bash
# Run performance benchmarks
npm run benchmark:auth

# Generate performance report
npm run benchmark:auth:html
```

### Security Monitoring

```bash
# Run security tests
npm run test:security

# Run attack vector tests
npm run test:security:attack-vectors
```

## Troubleshooting

### Common Issues

#### Migration Fails

**Problem:** User migration script fails with database errors

**Solution:**
1. Check database connectivity
2. Verify user has proper permissions
3. Run with smaller batch size:
   ```bash
   npm run migrate:users -- --batch-size=10 --verbose
   ```

#### Deployment Hangs

**Problem:** Deployment script hangs during build

**Solution:**
1. Check available disk space
2. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

#### Feature Flags Not Working

**Problem:** Feature flags always return false

**Solution:**
1. Check environment configuration
2. Clear feature flag cache:
   ```bash
   # Restart the application
   ```

#### Backup Restoration Fails

**Problem:** Backup restoration fails with integrity errors

**Solution:**
1. Verify backup file integrity
2. Check encryption key
3. Try restoring to a test database first

### Emergency Contacts

- **Database Issues:** DBA Team
- **Security Issues:** Security Team  
- **Infrastructure Issues:** DevOps Team

### Logs and Debugging

- **Application logs:** `/var/log/solar-connect/`
- **Database logs:** Check PostgreSQL logs
- **Security events:** Query `security_events` table
- **Deployment logs:** Check deployment script output

## Best Practices

1. **Always test in staging first**
2. **Create backups before any deployment**
3. **Use feature flags for gradual rollout**
4. **Monitor security events closely**
5. **Keep rollback procedures tested and ready**
6. **Document any custom configurations**
7. **Validate all environment variables**
8. **Test authentication flows after deployment**

## Security Considerations

1. **Encryption keys must be properly secured**
2. **Backup files should be encrypted**
3. **Database credentials should be rotated regularly**
4. **Monitor for suspicious authentication patterns**
5. **Keep security patches up to date**
6. **Audit user access regularly**

---

For additional support or questions, refer to the project documentation or contact the development team.