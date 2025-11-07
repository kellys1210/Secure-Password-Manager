#!/bin/bash

# Enhanced E2E test runner with performance monitoring and stability features

set -e

echo "🧪 Running Secure Password Manager E2E Tests..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEST_DIR="frontend/e2e"
REPORT_DIR="frontend/playwright-report"
PERFORMANCE_LOG="frontend/test-performance.log"
MAX_RETRIES=2
PARALLEL_WORKERS=2

# Function to log performance metrics
log_performance() {
    local test_file=$1
    local duration=$2
    local status=$3
    echo "$(date '+%Y-%m-%d %H:%M:%S') | $test_file | $duration seconds | $status" >> "$PERFORMANCE_LOG"
}

# Function to run tests with retry logic
run_test_with_retry() {
    local test_file=$1
    local browser=$2
    local attempt=1
    local start_time=$(date +%s)
    
    echo -e "${BLUE}🔍 Running $test_file on $browser...${NC}"
    
    while [ $attempt -le $MAX_RETRIES ]; do
        local attempt_start=$(date +%s)
        
        echo -e "${YELLOW}Attempt $attempt/$MAX_RETRIES${NC}"
        
        if npx playwright test "$test_file" --project="$browser" --reporter=line; then
            local attempt_end=$(date +%s)
            local attempt_duration=$((attempt_end - attempt_start))
            local total_duration=$((attempt_end - start_time))
            
            log_performance "$test_file" "$total_duration" "PASS"
            echo -e "${GREEN}✅ $test_file passed on $browser (attempt $attempt, ${attempt_duration}s)${NC}"
            return 0
        fi
        
        local attempt_end=$(date +%s)
        local attempt_duration=$((attempt_end - attempt_start))
        echo -e "${YELLOW}❌ Attempt $attempt failed (${attempt_duration}s), retrying...${NC}"
        
        ((attempt++))
        sleep 2
    done
    
    local total_duration=$((attempt_end - start_time))
    log_performance "$test_file" "$total_duration" "FAIL"
    echo -e "${RED}❌ $test_file failed on $browser after $MAX_RETRIES attempts${NC}"
    return 1
}

# Function to check test environment
check_environment() {
    echo -e "${BLUE}🔍 Checking test environment...${NC}"
    
    # Check if frontend is running
    if ! curl -s http://localhost:3000 > /dev/null; then
        echo -e "${RED}❌ Frontend not running on http://localhost:3000${NC}"
        echo -e "${YELLOW}💡 Start the test environment with: ./scripts/start-test-environment.sh${NC}"
        return 1
    fi
    
    # Check if backend is accessible (optional, as it might not have a health endpoint)
    if curl -s http://localhost:5000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is accessible${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend may not be running or accessible${NC}"
    fi
    
    echo -e "${GREEN}✅ Test environment is ready${NC}"
    return 0
}

# Function to generate performance report
generate_performance_report() {
    if [ -f "$PERFORMANCE_LOG" ]; then
        echo -e "${BLUE}📊 Performance Report:${NC}"
        echo "=========================================="
        awk '
        BEGIN { 
            total_tests=0; passed_tests=0; total_time=0;
            print "Test File | Duration | Status"
            print "---------|----------|-------"
        }
        {
            total_tests++
            if ($6 == "PASS") passed_tests++
            total_time += $5
            printf "%-30s | %8s | %s\n", $4, $5, $6
        }
        END {
            print "---------|----------|-------"
            printf "Total: %d tests | %.1f seconds | %.1f%% success rate\n", 
                   total_tests, total_time, (passed_tests/total_tests)*100
        }' "$PERFORMANCE_LOG"
    fi
}

# Main execution
main() {
    local start_time=$(date +%s)
    
    # Parse command line arguments
    local test_files=()
    local browsers=("chromium" "firefox" "webkit")
    local run_all=true
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --file)
                test_files+=("$2")
                run_all=false
                shift 2
                ;;
            --browser)
                browsers=("$2")
                shift 2
                ;;
            --help)
                echo "Usage: $0 [--file <test_file>] [--browser <browser>]"
                echo "  --file: Run specific test file (e.g., user-registration.spec.js)"
                echo "  --browser: Run on specific browser (chromium, firefox, webkit)"
                echo "  --help: Show this help message"
                exit 0
                ;;
            *)
                echo -e "${RED}Unknown option: $1${NC}"
                exit 1
                ;;
        esac
    done
    
    # Set default test files if none specified
    if [ ${#test_files[@]} -eq 0 ]; then
        test_files=(
            "user-registration.spec.js"
            "user-login.spec.js" 
            "password-management.spec.js"
            "security-validation.spec.js"
        )
    fi
    
    # Check environment
    if ! check_environment; then
        exit 1
    fi
    
    # Navigate to frontend directory
    cd frontend
    
    # Initialize performance log
    echo "# E2E Test Performance Log" > "$PERFORMANCE_LOG"
    echo "# Generated: $(date)" >> "$PERFORMANCE_LOG"
    echo "# Format: Timestamp | Test File | Duration (s) | Status" >> "$PERFORMANCE_LOG"
    
    # Run tests
    local failed_tests=0
    local total_tests=0
    
    for browser in "${browsers[@]}"; do
        echo -e "${BLUE}🌐 Testing on $browser${NC}"
        echo "=========================================="
        
        for test_file in "${test_files[@]}"; do
            local full_test_path="$TEST_DIR/$test_file"
            
            if [ ! -f "$full_test_path" ]; then
                echo -e "${RED}❌ Test file not found: $full_test_path${NC}"
                continue
            fi
            
            ((total_tests++))
            
            if ! run_test_with_retry "$full_test_path" "$browser"; then
                ((failed_tests++))
            fi
            
            echo ""
        done
    done
    
    local end_time=$(date +%s)
    local total_duration=$((end_time - start_time))
    
    # Generate reports
    echo -e "${BLUE}📋 Generating test reports...${NC}"
    npx playwright show-report || true
    
    # Performance report
    generate_performance_report
    
    # Summary
    echo ""
    echo -e "${BLUE}🎯 Test Summary${NC}"
    echo "=========================================="
    echo -e "Total Tests Run: $total_tests"
    echo -e "Failed Tests: $failed_tests"
    echo -e "Total Duration: ${total_duration}s"
    
    if [ $failed_tests -eq 0 ]; then
        echo -e "${GREEN}✅ All tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}❌ $failed_tests test(s) failed${NC}"
        exit 1
    fi
}

# Run main function
main "$@"
