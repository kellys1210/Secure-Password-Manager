#!/bin/bash

# Script to start the test environment for E2E testing
# This script launches both frontend and backend servers and waits for them to be ready

set -e

echo "🚀 Starting Secure Password Manager Test Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null; then
        echo -e "${YELLOW}⚠️  Port $port is already in use${NC}"
        return 1
    fi
    return 0
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}⏳ Waiting for $url to be ready...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s --head --request GET "$url" | grep "200 OK" > /dev/null; then
            echo -e "${GREEN}✅ $url is ready!${NC}"
            return 0
        fi
        
        echo -e "${YELLOW}Attempt $attempt/$max_attempts: Service not ready, waiting 2 seconds...${NC}"
        sleep 2
        ((attempt++))
    done
    
    echo -e "${RED}❌ Service at $url failed to start within $max_attempts attempts${NC}"
    return 1
}

# Check if required ports are available
echo "🔍 Checking port availability..."
check_port 3000 || { echo -e "${RED}Frontend port 3000 is not available${NC}"; exit 1; }
check_port 5000 || { echo -e "${RED}Backend port 5000 is not available${NC}"; exit 1; }

# Start backend server
echo "🔧 Starting backend server on port 5000..."
cd backend
python -m flask run --port=5000 &
BACKEND_PID=$!
cd ..

# Start frontend server
echo "🔧 Starting frontend server on port 3000..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Function to cleanup processes on exit
cleanup() {
    echo -e "${YELLOW}🛑 Cleaning up processes...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}✅ Cleanup complete${NC}"
}

# Set trap to cleanup on script exit
trap cleanup EXIT

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 3

# Check backend
if ! wait_for_service "http://localhost:5000/health" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Backend health endpoint not available, but continuing...${NC}"
fi

# Check frontend
if wait_for_service "http://localhost:3000"; then
    echo -e "${GREEN}🎉 Test environment is ready!${NC}"
    echo -e "${GREEN}Frontend: http://localhost:3000${NC}"
    echo -e "${GREEN}Backend: http://localhost:5000${NC}"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop the test environment${NC}"
    
    # Keep script running
    wait
else
    echo -e "${RED}❌ Failed to start test environment${NC}"
    cleanup
    exit 1
fi
