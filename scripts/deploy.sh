#!/bin/bash

# =============================================================================
# SolarConnect Production Deployment Script
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
BACKUP_DIR="./backups"
LOG_FILE="deployment.log"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a $LOG_FILE
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check if environment file exists
    if [ ! -f "$ENV_FILE" ]; then
        error "Environment file $ENV_FILE not found. Please create it from .env.example"
    fi
    
    success "Prerequisites check passed"
}

# Create backup directory
create_backup_dir() {
    log "Creating backup directory..."
    mkdir -p $BACKUP_DIR
    success "Backup directory created"
}

# Backup database
backup_database() {
    log "Creating database backup..."
    
    if docker-compose -f $COMPOSE_FILE ps postgres | grep -q "Up"; then
        BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
        docker-compose -f $COMPOSE_FILE exec -T postgres pg_dump -U postgres solarconnect > $BACKUP_FILE
        gzip $BACKUP_FILE
        success "Database backup created: ${BACKUP_FILE}.gz"
    else
        warning "Database container not running, skipping backup"
    fi
}

# Build and deploy
deploy() {
    log "Starting deployment..."
    
    # Pull latest images
    log "Pulling latest images..."
    docker-compose -f $COMPOSE_FILE pull
    
    # Build application
    log "Building application..."
    docker-compose -f $COMPOSE_FILE build --no-cache
    
    # Stop existing containers
    log "Stopping existing containers..."
    docker-compose -f $COMPOSE_FILE down
    
    # Start new containers
    log "Starting new containers..."
    docker-compose -f $COMPOSE_FILE up -d
    
    success "Deployment completed"
}

# Setup database
setup_database() {
    log "Setting up database..."
    
    # Wait for database to be ready
    log "Waiting for database to be ready..."
    sleep 10
    
    # Generate Prisma client
    log "Generating Prisma client..."
    docker-compose -f $COMPOSE_FILE exec next-app npx prisma generate
    
    # Push database schema
    log "Pushing database schema..."
    docker-compose -f $COMPOSE_FILE exec next-app npx prisma db push
    
    # Seed database (only if empty)
    log "Seeding database..."
    docker-compose -f $COMPOSE_FILE exec next-app npm run db:seed
    
    success "Database setup completed"
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Wait for application to start
    sleep 15
    
    # Check if containers are running
    if ! docker-compose -f $COMPOSE_FILE ps | grep -q "Up"; then
        error "Some containers are not running"
    fi
    
    # Check application health
    if command -v curl &> /dev/null; then
        if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
            success "Application health check passed"
        else
            warning "Application health check failed, but containers are running"
        fi
    else
        warning "curl not available, skipping application health check"
    fi
    
    success "Health check completed"
}

# Show logs
show_logs() {
    log "Showing application logs..."
    docker-compose -f $COMPOSE_FILE logs --tail=50 next-app
}

# Cleanup old images
cleanup() {
    log "Cleaning up old Docker images..."
    docker image prune -f
    success "Cleanup completed"
}

# Main deployment process
main() {
    log "Starting SolarConnect production deployment"
    
    check_prerequisites
    create_backup_dir
    backup_database
    deploy
    setup_database
    health_check
    cleanup
    
    success "🎉 Deployment completed successfully!"
    log "Application is running at: http://localhost:3000"
    log "Database admin: http://localhost:8080 (if pgAdmin is enabled)"
    
    echo ""
    echo -e "${GREEN}Next steps:${NC}"
    echo "1. Configure your domain and SSL certificate"
    echo "2. Set up monitoring and alerts"
    echo "3. Configure automated backups"
    echo "4. Test all application features"
    echo ""
    echo -e "${BLUE}Useful commands:${NC}"
    echo "- View logs: docker-compose -f $COMPOSE_FILE logs -f"
    echo "- Stop services: docker-compose -f $COMPOSE_FILE down"
    echo "- Restart services: docker-compose -f $COMPOSE_FILE restart"
    echo ""
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "backup")
        check_prerequisites
        create_backup_dir
        backup_database
        ;;
    "logs")
        show_logs
        ;;
    "health")
        health_check
        ;;
    "cleanup")
        cleanup
        ;;
    "help")
        echo "Usage: $0 [deploy|backup|logs|health|cleanup|help]"
        echo ""
        echo "Commands:"
        echo "  deploy  - Full deployment (default)"
        echo "  backup  - Create database backup only"
        echo "  logs    - Show application logs"
        echo "  health  - Perform health check"
        echo "  cleanup - Clean up old Docker images"
        echo "  help    - Show this help message"
        ;;
    *)
        error "Unknown command: $1. Use 'help' for available commands."
        ;;
esac