#!/bin/bash

# Serenity App - Automated Setup Script
# This script sets up the complete development environment

set -e

echo "🏡 Serenity App - Setup Script"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "ℹ $1"
}

# Check if running on macOS or Linux
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="mac"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
else
    print_error "Unsupported operating system"
    exit 1
fi

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js not found. Please install Node.js 20+ from https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        print_error "Node.js version must be 20 or higher. Current: $(node -v)"
        exit 1
    fi
    print_success "Node.js $(node -v) installed"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm not found"
        exit 1
    fi
    print_success "npm $(npm -v) installed"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_warning "Docker not found. Install from https://www.docker.com/"
        read -p "Continue without Docker? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        print_success "Docker $(docker -v | cut -d' ' -f3 | cut -d',' -f1) installed"
    fi
    
    # Check Docker Compose
    if command -v docker &> /dev/null; then
        if ! docker compose version &> /dev/null; then
            print_warning "Docker Compose not found"
        else
            print_success "Docker Compose installed"
        fi
    fi
}

# Setup environment variables
setup_env() {
    print_info "Setting up environment variables..."
    
    if [ -f ".env" ]; then
        print_warning ".env file already exists"
        read -p "Overwrite? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return
        fi
    fi
    
    cp .env.example .env
    
    # Generate secure secrets
    JWT_SECRET=$(openssl rand -base64 32)
    JWT_REFRESH_SECRET=$(openssl rand -base64 32)
    POSTGRES_PASSWORD=$(openssl rand -base64 16)
    REDIS_PASSWORD=$(openssl rand -base64 16)
    
    # Update .env file
    if [[ "$OS" == "mac" ]]; then
        sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|g" .env
        sed -i '' "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET|g" .env
        sed -i '' "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|g" .env
        sed -i '' "s|REDIS_PASSWORD=.*|REDIS_PASSWORD=$REDIS_PASSWORD|g" .env
        sed -i '' "s|NODE_ENV=production|NODE_ENV=development|g" .env
        sed -i '' "s|FRONTEND_URL=https://serenity.app|FRONTEND_URL=http://localhost:3000|g" .env
        sed -i '' "s|https://api.serenity.app|http://localhost:5000|g" .env
    else
        sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|g" .env
        sed -i "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET|g" .env
        sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|g" .env
        sed -i "s|REDIS_PASSWORD=.*|REDIS_PASSWORD=$REDIS_PASSWORD|g" .env
        sed -i "s|NODE_ENV=production|NODE_ENV=development|g" .env
        sed -i "s|FRONTEND_URL=https://serenity.app|FRONTEND_URL=http://localhost:3000|g" .env
        sed -i "s|https://api.serenity.app|http://localhost:5000|g" .env
    fi
    
    print_success "Environment variables configured"
    print_warning "Please update .env with your service keys (Stripe, SendGrid, etc.)"
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    
    # Backend
    print_info "Installing backend dependencies..."
    cd backend
    npm install
    print_success "Backend dependencies installed"
    cd ..
    
    # Frontend
    print_info "Installing frontend dependencies..."
    cd frontend
    npm install
    print_success "Frontend dependencies installed"
    cd ..
}

# Start databases
start_databases() {
    print_info "Starting databases with Docker..."
    
    if ! command -v docker &> /dev/null; then
        print_warning "Docker not available. Please start PostgreSQL and Redis manually"
        return
    fi
    
    docker compose up -d postgres redis
    
    print_info "Waiting for databases to be ready..."
    sleep 10
    
    print_success "Databases started"
}

# Setup database
setup_database() {
    print_info "Setting up database..."
    
    cd backend
    
    # Generate Prisma Client
    print_info "Generating Prisma Client..."
    npx prisma generate
    
    # Run migrations
    print_info "Running database migrations..."
    npx prisma migrate dev --name init
    
    # Optional: Seed database
    read -p "Seed database with sample data? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm run prisma:seed
        print_success "Database seeded"
    fi
    
    cd ..
    print_success "Database setup complete"
}

# Create startup script
create_startup_script() {
    print_info "Creating startup script..."
    
    cat > start-dev.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting Serenity App..."

# Start backend
echo "Starting backend..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend
echo "Starting frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Serenity App is running!"
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:5000"
echo "Health:   http://localhost:5000/health"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
EOF
    
    chmod +x start-dev.sh
    print_success "Startup script created: ./start-dev.sh"
}

# Main setup flow
main() {
    check_prerequisites
    setup_env
    install_dependencies
    start_databases
    setup_database
    create_startup_script
    
    echo ""
    echo "================================"
    print_success "Setup complete! 🎉"
    echo "================================"
    echo ""
    echo "Next steps:"
    echo "1. Update .env with your service keys (Stripe, SendGrid, etc.)"
    echo "2. Run: ./start-dev.sh"
    echo "3. Visit: http://localhost:3000"
    echo ""
    echo "For production deployment, see DEPLOYMENT_GUIDE.md"
    echo ""
}

# Run main function
main
