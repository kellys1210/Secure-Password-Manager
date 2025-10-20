#!/bin/bash

# Cross-Environment Test Runner Script
# This script runs authentication endpoint tests across different environments
# to ensure consistent behavior.

set -e  # Exit on any error

echo "========================================="
echo "Cross-Environment Authentication Tests"
echo "========================================="

# Function to run tests in a specific environment
run_tests() {
    local environment_name=$1
    local test_command=$2
    
    echo
    echo "-----------------------------------------"
    echo "Running tests in $environment_name environment"
    echo "-----------------------------------------"
    
    # Run the test command
    if eval $test_command; then
        echo "✅ $environment_name tests passed"
        return 0
    else
        echo "❌ $environment_name tests failed"
        return 1
    fi
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if we're in the right directory
if [ ! -f "pyproject.toml" ]; then
    echo "Error: This script must be run from the project root directory"
    exit 1
fi

# Set environment variables for consistent testing
export FLASK_ENV="testing"
export DATABASE_URL="sqlite:///:memory:"

# Test 1: Local Development Environment (pytest)
if command_exists pytest; then
    run_tests "Local Development" "python -m pytest tests/test_auth_cross_env.py -v"
else
    echo "Skipping Local Development tests - pytest not found"
fi

# Test 2: Docker Environment
if command_exists docker && command_exists docker-compose; then
    echo
    echo "-----------------------------------------"
    echo "Testing Docker Environment"
    echo "-----------------------------------------"
    
    # Bring up services
    echo "Starting Docker services..."
    docker-compose up -d
    
    # Wait for services to be ready
    echo "Waiting for services to start..."
    sleep 10
    
    # Test container health
    echo "Checking container health..."
    if docker-compose exec backend echo "Backend container is running"; then
        echo "✅ Docker containers are running"
        
        # Run authentication tests within Docker
        echo "Running authentication tests in Docker..."
        docker-compose exec backend python -m pytest tests/test_auth_cross_env.py -v
        
        if [ $? -eq 0 ]; then
            echo "✅ Docker environment tests passed"
        else
            echo "❌ Docker environment tests failed"
            DOCKER_FAILED=1
        fi
    else
        echo "❌ Docker container failed to start"
        DOCKER_FAILED=1
    fi
    
    # Clean up
    echo "Stopping Docker services..."
    docker-compose down
else
    echo "Skipping Docker tests - docker or docker-compose not found"
fi

# Test 3: Package Import Verification
echo
echo "-----------------------------------------"
echo "Testing Package Import Consistency"
echo "-----------------------------------------"

python -c "
import sys
import os
sys.path.insert(0, '.')
sys.path.insert(0, './backend')

# Test that all required modules can be imported
try:
    from backend.app import create_app
    from backend.app.model.user_model import User
    from backend.app.routes.user_route import user_bp
    from backend.app.service.argon2_service import Argon2Service
    print('✅ All backend modules imported successfully')
except ImportError as e:
    print(f'❌ Import failed: {e}')
    sys.exit(1)

# Test that required packages are available
required_packages = ['flask', 'flask_sqlalchemy', 'argon2_cffi', 'pytest']
for package in required_packages:
    try:
        __import__(package)
        print(f'✅ {package} is available')
    except ImportError:
        print(f'❌ {package} is not available')
        sys.exit(1)
"

if [ $? -eq 0 ]; then
    echo "✅ Package import verification passed"
else
    echo "❌ Package import verification failed"
    IMPORT_FAILED=1
fi

# Summary
echo
echo "========================================="
echo "Test Summary"
echo "========================================="

if [ -z "$DOCKER_FAILED" ] && [ -z "$IMPORT_FAILED" ]; then
    echo "🎉 All cross-environment tests passed!"
    exit 0
else
    echo "⚠️  Some tests failed. Check output above for details."
    exit 1
fi
