@echo off
REM =============================================================================
REM SolarConnect Production Deployment Script (Windows)
REM =============================================================================

setlocal enabledelayedexpansion

REM Configuration
set COMPOSE_FILE=docker-compose.prod.yml
set ENV_FILE=.env.production
set BACKUP_DIR=.\backups
set LOG_FILE=deployment.log

REM Colors (limited support in Windows)
set GREEN=[92m
set RED=[91m
set YELLOW=[93m
set BLUE=[94m
set NC=[0m

echo %BLUE%Starting SolarConnect production deployment%NC%
echo.

REM Check prerequisites
echo %BLUE%Checking prerequisites...%NC%
docker --version >nul 2>&1
if errorlevel 1 (
    echo %RED%Docker is not installed. Please install Docker Desktop first.%NC%
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo %RED%Docker Compose is not installed. Please install Docker Compose first.%NC%
    exit /b 1
)

if not exist "%ENV_FILE%" (
    echo %RED%Environment file %ENV_FILE% not found. Please create it from .env.example%NC%
    exit /b 1
)

echo %GREEN%Prerequisites check passed%NC%

REM Create backup directory
echo %BLUE%Creating backup directory...%NC%
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
echo %GREEN%Backup directory created%NC%

REM Backup database (if running)
echo %BLUE%Creating database backup...%NC%
docker-compose -f %COMPOSE_FILE% ps postgres | findstr "Up" >nul 2>&1
if not errorlevel 1 (
    set BACKUP_FILE=%BACKUP_DIR%\backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.sql
    docker-compose -f %COMPOSE_FILE% exec -T postgres pg_dump -U postgres solarconnect > "!BACKUP_FILE!"
    echo %GREEN%Database backup created: !BACKUP_FILE!%NC%
) else (
    echo %YELLOW%Database container not running, skipping backup%NC%
)

REM Build and deploy
echo %BLUE%Starting deployment...%NC%

echo %BLUE%Pulling latest images...%NC%
docker-compose -f %COMPOSE_FILE% pull

echo %BLUE%Building application...%NC%
docker-compose -f %COMPOSE_FILE% build --no-cache

echo %BLUE%Stopping existing containers...%NC%
docker-compose -f %COMPOSE_FILE% down

echo %BLUE%Starting new containers...%NC%
docker-compose -f %COMPOSE_FILE% up -d

echo %GREEN%Deployment completed%NC%

REM Setup database
echo %BLUE%Setting up database...%NC%

echo %BLUE%Waiting for database to be ready...%NC%
timeout /t 10 /nobreak >nul

echo %BLUE%Generating Prisma client...%NC%
docker-compose -f %COMPOSE_FILE% exec next-app npx prisma generate

echo %BLUE%Pushing database schema...%NC%
docker-compose -f %COMPOSE_FILE% exec next-app npx prisma db push

echo %BLUE%Seeding database...%NC%
docker-compose -f %COMPOSE_FILE% exec next-app npm run db:seed

echo %GREEN%Database setup completed%NC%

REM Health check
echo %BLUE%Performing health check...%NC%
timeout /t 15 /nobreak >nul

docker-compose -f %COMPOSE_FILE% ps | findstr "Up" >nul 2>&1
if errorlevel 1 (
    echo %RED%Some containers are not running%NC%
    exit /b 1
)

echo %GREEN%Health check completed%NC%

REM Cleanup
echo %BLUE%Cleaning up old Docker images...%NC%
docker image prune -f
echo %GREEN%Cleanup completed%NC%

echo.
echo %GREEN%🎉 Deployment completed successfully!%NC%
echo Application is running at: http://localhost:3000
echo Database admin: http://localhost:8080 (if pgAdmin is enabled)
echo.
echo %GREEN%Next steps:%NC%
echo 1. Configure your domain and SSL certificate
echo 2. Set up monitoring and alerts
echo 3. Configure automated backups
echo 4. Test all application features
echo.
echo %BLUE%Useful commands:%NC%
echo - View logs: docker-compose -f %COMPOSE_FILE% logs -f
echo - Stop services: docker-compose -f %COMPOSE_FILE% down
echo - Restart services: docker-compose -f %COMPOSE_FILE% restart
echo.

pause