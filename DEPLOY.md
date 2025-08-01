# 🚀 SolarConnect - Deployment Guide

Complete guide for deploying SolarConnect to production environments.

## 📋 Table of Contents

1. [Quick Deploy Options](#quick-deploy-options)
2. [Docker Deployment](#docker-deployment)
3. [Vercel Deployment](#vercel-deployment)
4. [Environment Variables](#environment-variables)
5. [Database Setup](#database-setup)
6. [Production Checklist](#production-checklist)
7. [Monitoring & Maintenance](#monitoring--maintenance)

## 🚀 Quick Deploy Options

### Option 1: Vercel (Recommended for MVP)
- ✅ Zero configuration
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Serverless functions
- ✅ Free tier available

### Option 2: Docker + VPS
- ✅ Full control
- ✅ Cost effective
- ✅ Custom configurations
- ✅ Self-hosted

### Option 3: Docker + Cloud Platforms
- ✅ Scalable
- ✅ Managed infrastructure
- ✅ Auto-scaling
- ✅ Load balancing

## 🐳 Docker Deployment

### Prerequisites
- Docker and Docker Compose installed
- PostgreSQL database (local or cloud)
- Domain name (optional)

### 1. Environment Setup

Create production environment file:
```bash
cp .env.example .env.production
```

Update `.env.production`:
```env
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
PORT=3000

# Database (Use cloud database for production)
DATABASE_URL="postgresql://user:password@host:5432/solarconnect"

# Authentication
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-super-secret-key-here

# Email (Resend)
RESEND_API_KEY=your-resend-api-key

# File Upload (UploadThing)
UPLOADTHING_SECRET=your-uploadthing-secret
UPLOADTHING_APP_ID=your-uploadthing-app-id
```

### 2. Build and Deploy

```bash
# Build the Docker image
docker-compose build

# Start the services
docker-compose up -d

# Check logs
docker-compose logs -f next-app

# Setup database (first time only)
docker-compose exec next-app npx prisma db push
docker-compose exec next-app npm run db:seed
```

### 3. Production Docker Compose

Create `docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  next-app:
    container_name: solarconnect-prod
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      NEXTAUTH_URL: ${NEXTAUTH_URL}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      RESEND_API_KEY: ${RESEND_API_KEY}
      UPLOADTHING_SECRET: ${UPLOADTHING_SECRET}
      UPLOADTHING_APP_ID: ${UPLOADTHING_APP_ID}
    env_file:
      - .env.production
    depends_on:
      - postgres
    networks:
      - solarconnect-network

  postgres:
    image: postgres:15-alpine
    container_name: solarconnect-db-prod
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER:-solarconnect}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME:-solarconnect}
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - solarconnect-network
    ports:
      - "5432:5432"

  nginx:
    image: nginx:alpine
    container_name: solarconnect-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - next-app
    networks:
      - solarconnect-network

volumes:
  postgres_prod_data:

networks:
  solarconnect-network:
    driver: bridge
```

### 4. Nginx Configuration

Create `nginx.conf`:
```nginx
events {
    worker_connections 1024;
}

http {
    upstream nextjs {
        server next-app:3000;
    }

    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://nextjs;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

## ▲ Vercel Deployment

### 1. Prepare Repository

Ensure your code is in a Git repository (GitHub, GitLab, or Bitbucket).

### 2. Database Setup

Use a cloud PostgreSQL service:
- **Neon** (Recommended): https://neon.tech
- **Supabase**: https://supabase.com
- **PlanetScale**: https://planetscale.com
- **Railway**: https://railway.app

### 3. Deploy to Vercel

1. **Connect Repository:**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your repository

2. **Configure Build Settings:**
   ```
   Framework Preset: Next.js
   Root Directory: ./
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

3. **Environment Variables:**
   Add all required environment variables in Vercel dashboard.

4. **Deploy:**
   Click "Deploy" and wait for the build to complete.

### 4. Post-Deployment Setup

```bash
# Setup database (run once)
npx prisma db push
npm run db:seed
```

## 🔧 Environment Variables

### Required Variables

```env
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Database
DATABASE_URL="postgresql://user:password@host:5432/solarconnect"

# Authentication
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-super-secret-key-here

# Email Service
RESEND_API_KEY=your-resend-api-key

# File Upload
UPLOADTHING_SECRET=your-uploadthing-secret
UPLOADTHING_APP_ID=your-uploadthing-app-id
```

### Optional Variables

```env
# Analytics
NEXT_PUBLIC_GA_ID=your-google-analytics-id

# Monitoring
SENTRY_DSN=your-sentry-dsn

# Redis (for caching)
REDIS_URL=redis://localhost:6379
```

## 🗄️ Database Setup

### Cloud Database Options

1. **Neon (Recommended)**
   ```bash
   # Free tier: 0.5GB storage, 1 database
   # Serverless PostgreSQL
   DATABASE_URL="postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/solarconnect"
   ```

2. **Supabase**
   ```bash
   # Free tier: 500MB storage, 2 databases
   # Includes auth and real-time features
   DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
   ```

3. **Railway**
   ```bash
   # $5/month for 1GB storage
   # Easy deployment integration
   DATABASE_URL="postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway"
   ```

### Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed with initial data
npm run db:seed

# (Optional) Run migrations
npx prisma migrate deploy
```

## ✅ Production Checklist

### Security
- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Database credentials rotated
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Input validation implemented

### Performance
- [ ] Images optimized
- [ ] Static assets cached
- [ ] Database queries optimized
- [ ] CDN configured
- [ ] Compression enabled

### Monitoring
- [ ] Error tracking (Sentry)
- [ ] Analytics (Google Analytics)
- [ ] Uptime monitoring
- [ ] Database monitoring
- [ ] Log aggregation

### Backup
- [ ] Database backups automated
- [ ] File uploads backed up
- [ ] Environment variables documented
- [ ] Recovery procedures tested

## 📊 Monitoring & Maintenance

### Health Checks

Create `pages/api/health.ts`:
```typescript
import { NextApiRequest, NextApiResponse } from 'next'
import { db } from '@/lib/db'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Check database connection
    await db.$queryRaw`SELECT 1`
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    })
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    })
  }
}
```

### Backup Script

Create `scripts/backup.sh`:
```bash
#!/bin/bash

# Database backup
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql"

pg_dump $DATABASE_URL > /backups/$BACKUP_FILE

# Compress backup
gzip /backups/$BACKUP_FILE

# Upload to cloud storage (optional)
# aws s3 cp /backups/${BACKUP_FILE}.gz s3://your-backup-bucket/

echo "Backup completed: ${BACKUP_FILE}.gz"
```

### Monitoring Commands

```bash
# Check application logs
docker-compose logs -f next-app

# Check database logs
docker-compose logs -f postgres

# Monitor resource usage
docker stats

# Check disk usage
df -h

# Check database size
docker-compose exec postgres psql -U postgres -d solarconnect -c "SELECT pg_size_pretty(pg_database_size('solarconnect'));"
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear cache and rebuild
   docker-compose build --no-cache
   ```

2. **Database Connection Issues**
   ```bash
   # Check database status
   docker-compose exec postgres pg_isready -U postgres
   
   # Reset database connection
   docker-compose restart postgres
   ```

3. **Memory Issues**
   ```bash
   # Increase Docker memory limit
   # Add to docker-compose.yml:
   deploy:
     resources:
       limits:
         memory: 1G
   ```

4. **SSL Certificate Issues**
   ```bash
   # Generate self-signed certificate for testing
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout ssl/key.pem -out ssl/cert.pem
   ```

### Support Resources

- **Documentation**: Check project README and docs
- **Community**: GitHub Issues and Discussions
- **Logs**: Always check application and database logs first
- **Health Check**: Use `/api/health` endpoint to verify system status

---

## 🎯 Next Steps After Deployment

1. **Domain Setup**: Configure custom domain and SSL
2. **Monitoring**: Set up error tracking and analytics
3. **Backups**: Implement automated backup strategy
4. **Scaling**: Monitor usage and scale resources as needed
5. **Security**: Regular security audits and updates
6. **Performance**: Monitor and optimize application performance

For additional support, refer to the project documentation or create an issue in the repository.