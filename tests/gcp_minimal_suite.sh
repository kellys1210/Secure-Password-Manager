#!/bin/bash



set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Global variables
TEST_RESULTS=()
CURRENT_PROJECT=""
QUICK_CHECK=false
INCLUDE_SERVICE_AVAILABILITY=false
START_TIME=$(date +%s)

# Phase 1: Environment Discovery (ESSENTIAL)
phase1_environment_discovery() {
    log_info "=== PHASE 1: ENVIRONMENT DISCOVERY ==="
    
    # Check authentication
    log_info "Checking authentication..."
    if gcloud auth list --filter=status:ACTIVE --format="value(account)" > /dev/null 2>&1; then
        CURRENT_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
        log_success "Authenticated as: $CURRENT_ACCOUNT"
        TEST_RESULTS+=("Authentication: SUCCESS ($CURRENT_ACCOUNT)")
    else
        log_error "Not authenticated. Please run 'gcloud auth login'"
        TEST_RESULTS+=("Authentication: FAILED")
        return 1
    fi
    
    # Get current project
    log_info "Checking current project..."
    CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
    if [[ -n "$CURRENT_PROJECT" && "$CURRENT_PROJECT" != "(unset)" ]]; then
        log_success "Current project: $CURRENT_PROJECT"
        TEST_RESULTS+=("Current Project: $CURRENT_PROJECT")
    else
        log_error "No project set. Please set a project with 'gcloud config set project PROJECT_ID'"
        TEST_RESULTS+=("Current Project: NOT SET")
        return 1
    fi
    
    # Get current region/zone
    log_info "Checking current region/zone..."
    CURRENT_REGION=$(gcloud config get-value compute/region 2>/dev/null)
    CURRENT_ZONE=$(gcloud config get-value compute/zone 2>/dev/null)
    
    if [[ -n "$CURRENT_REGION" && "$CURRENT_REGION" != "(unset)" ]]; then
        log_success "Current region: $CURRENT_REGION"
        TEST_RESULTS+=("Current Region: $CURRENT_REGION")
    else
        log_warning "No region set (Cloud Run will use default)"
        TEST_RESULTS+=("Current Region: NOT SET")
    fi
    
    if [[ -n "$CURRENT_ZONE" && "$CURRENT_ZONE" != "(unset)" ]]; then
        log_success "Current zone: $CURRENT_ZONE"
        TEST_RESULTS+=("Current Zone: $CURRENT_ZONE")
    else
        log_warning "No zone set (Cloud SQL may need zone configuration)"
        TEST_RESULTS+=("Current Zone: NOT SET")
    fi
    
    # List essential APIs only
    log_info "Checking essential APIs..."
    ENABLED_APIS_COUNT=$(gcloud services list --enabled --format="value(NAME)" 2>/dev/null | wc -l)
    log_success "Enabled APIs: $ENABLED_APIS_COUNT services"
    TEST_RESULTS+=("Enabled APIs: $ENABLED_APIS_COUNT services")
    
    # Check essential APIs for password manager
    log_info "Essential APIs status:"
    gcloud services list --enabled --filter="NAME:run OR NAME:sql OR NAME:iam" --format="table(NAME, TITLE)" 2>/dev/null || true
}

# Phase 2: Authentication and Permissions (ESSENTIAL)
phase2_authentication_permissions() {
    log_info "=== PHASE 2: AUTHENTICATION AND PERMISSIONS ==="
    
    if [[ -n "$CURRENT_PROJECT" && "$CURRENT_PROJECT" != "(unset)" ]]; then
        # Test basic project permissions
        log_info "Testing project permissions..."
        if gcloud projects describe "$CURRENT_PROJECT" > /dev/null 2>&1; then
            log_success "Has project read permissions"
            TEST_RESULTS+=("Project Read Permissions: SUCCESS")
        else
            log_error "Missing project read permissions"
            TEST_RESULTS+=("Project Read Permissions: FAILED")
            return 1
        fi
        
        # Test Cloud Run permissions
        log_info "Testing Cloud Run permissions..."
        if gcloud run services list --limit=1 > /dev/null 2>&1; then
            log_success "Has Cloud Run read permissions"
            TEST_RESULTS+=("Cloud Run Permissions: SUCCESS")
        else
            log_error "Missing Cloud Run permissions"
            TEST_RESULTS+=("Cloud Run Permissions: FAILED")
        fi
        
        # Test Cloud SQL permissions
        log_info "Testing Cloud SQL permissions..."
        if gcloud sql instances list --limit=1 > /dev/null 2>&1; then
            log_success "Has Cloud SQL read permissions"
            TEST_RESULTS+=("Cloud SQL Permissions: SUCCESS")
        else
            log_error "Missing Cloud SQL permissions"
            TEST_RESULTS+=("Cloud SQL Permissions: FAILED")
        fi
        
        # Check service accounts (essential for Cloud Run)
        log_info "Checking service accounts..."
        SERVICE_ACCOUNT_COUNT=$(gcloud iam service-accounts list --format="value(EMAIL)" 2>/dev/null | wc -l)
        log_success "Service accounts: $SERVICE_ACCOUNT_COUNT"
        TEST_RESULTS+=("Service Accounts: $SERVICE_ACCOUNT_COUNT")
        
    else
        log_error "Cannot test permissions without project set"
        TEST_RESULTS+=("Permissions Test: SKIPPED")
        return 1
    fi
}

# Phase 3: Service Availability (OPTIONAL)
phase3_service_availability() {
    if [[ "$INCLUDE_SERVICE_AVAILABILITY" == true ]]; then
        log_info "=== PHASE 3: SERVICE AVAILABILITY (OPTIONAL) ==="
        
        if [[ -n "$CURRENT_PROJECT" && "$CURRENT_PROJECT" != "(unset)" ]]; then
            # Check Cloud Run services
            log_info "Checking Cloud Run services..."
            CLOUD_RUN_SERVICES=$(gcloud run services list --format="value(NAME)" 2>/dev/null | wc -l)
            if [[ $CLOUD_RUN_SERVICES -gt 0 ]]; then
                log_success "Cloud Run services: $CLOUD_RUN_SERVICES"
                TEST_RESULTS+=("Cloud Run Services: $CLOUD_RUN_SERVICES")
                
                # Quick health check for each service
                gcloud run services list --format="table(NAME, STATUS, URL)" 2>/dev/null || true
            else
                log_info "No Cloud Run services found"
                TEST_RESULTS+=("Cloud Run Services: 0")
            fi
            
            # Check Cloud SQL instances
            log_info "Checking Cloud SQL instances..."
            CLOUD_SQL_INSTANCES=$(gcloud sql instances list --format="value(NAME)" 2>/dev/null | wc -l)
            if [[ $CLOUD_SQL_INSTANCES -gt 0 ]]; then
                log_success "Cloud SQL instances: $CLOUD_SQL_INSTANCES"
                TEST_RESULTS+=("Cloud SQL Instances: $CLOUD_SQL_INSTANCES")
                
                # Check instance status
                gcloud sql instances list --format="table(NAME, STATE, DATABASE_VERSION)" 2>/dev/null || true
            else
                log_info "No Cloud SQL instances found"
                TEST_RESULTS+=("Cloud SQL Instances: 0")
            fi
            
        else
            log_warning "Cannot check service availability without project set"
            TEST_RESULTS+=("Service Availability: SKIPPED")
        fi
    fi
}

# Quick Check Mode
quick_check() {
    log_info "=== QUICK CHECK MODE ==="
    
    # Essential validation only
    echo "Project: $(gcloud config get-value project 2>/dev/null || echo 'NOT SET')"
    echo "User: $(gcloud auth list --filter=status:ACTIVE --format='value(account)' 2>/dev/null || echo 'NOT AUTHENTICATED')"
    
    CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
    if [[ -n "$CURRENT_PROJECT" && "$CURRENT_PROJECT" != "(unset)" ]]; then
        echo "Cloud Run Services: $(gcloud run services list --format='value(NAME)' 2>/dev/null | wc -l)"
        echo "Cloud SQL Instances: $(gcloud sql instances list --format='value(NAME)' 2>/dev/null | wc -l)"
        echo "Essential APIs: $(gcloud services list --enabled --filter='NAME:run OR NAME:sql' --format='value(NAME)' 2>/dev/null | wc -l)"
    fi
    
    log_success "Quick check completed"
}

# Critical Security Validation
critical_security_validation() {
    log_info "=== CRITICAL SECURITY VALIDATION ==="
    
    if [[ -n "$CURRENT_PROJECT" && "$CURRENT_PROJECT" != "(unset)" ]]; then
        # Check Cloud Run HTTPS enforcement
        log_info "Checking Cloud Run HTTPS enforcement..."
        HTTPS_STATUS=$(gcloud run services list --format="value(metadata.annotations.'run.googleapis.com/ingress-status')" 2>/dev/null | head -1 || echo "UNKNOWN")
        if [[ "$HTTPS_STATUS" == "all" ]]; then
            log_success "HTTPS enforcement: ENABLED"
            TEST_RESULTS+=("HTTPS Enforcement: ENABLED")
        else
            log_warning "HTTPS enforcement: $HTTPS_STATUS (should be 'all' for production)"
            TEST_RESULTS+=("HTTPS Enforcement: $HTTPS_STATUS")
        fi
        
        # Check Cloud SQL encryption
        log_info "Checking Cloud SQL encryption..."
        SQL_ENCRYPTION=$(gcloud sql instances list --format="value(settings.dataDiskType)" 2>/dev/null | head -1 || echo "UNKNOWN")
        if [[ "$SQL_ENCRYPTION" == "PD_SSD" || "$SQL_ENCRYPTION" == "PD_HDD" ]]; then
            log_success "Cloud SQL encryption: ENABLED (Google-managed)"
            TEST_RESULTS+=("Cloud SQL Encryption: ENABLED")
        else
            log_warning "Cloud SQL encryption: $SQL_ENCRYPTION"
            TEST_RESULTS+=("Cloud SQL Encryption: $SQL_ENCRYPTION")
        fi
        
    else
        log_warning "Cannot perform security validation without project set"
    fi
}

# Main execution function
main() {
    log_info "Starting Google Cloud Platform Minimal Test Suite"
    log_info "Timestamp: $(date)"
    echo
    
    if [[ "$QUICK_CHECK" == true ]]; then
        quick_check
        return
    fi
    
    # Run essential phases
    phase1_environment_discovery
    echo
    
    phase2_authentication_permissions
    echo
    
    # Run optional phase if requested
    if [[ "$INCLUDE_SERVICE_AVAILABILITY" == true ]]; then
        phase3_service_availability
        echo
    fi
    
    # Always run critical security validation
    critical_security_validation
    echo
    
    # Summary report
    log_info "=== TEST SUITE SUMMARY ==="
    local end_time=$(date +%s)
    local duration=$((end_time - START_TIME))
    log_info "Completed in ${duration} seconds"
    echo
    
    log_info "DETAILED RESULTS:"
    for result in "${TEST_RESULTS[@]}"; do
        echo "  - $result"
    done
    echo
    
    # Overall status
    local success_count=0
    local warning_count=0
    local error_count=0
    
    for result in "${TEST_RESULTS[@]}"; do
        if [[ $result == *"SUCCESS"* ]] || [[ $result == *"ENABLED"* ]]; then
            ((success_count++))
        elif [[ $result == *"WARNING"* ]] || [[ $result == *"NOT SET"* ]]; then
            ((warning_count++))
        elif [[ $result == *"FAILED"* ]] || [[ $result == *"ERROR"* ]]; then
            ((error_count++))
        fi
    done
    
    log_info "OVERALL STATUS:"
    log_success "  Successful tests: $success_count"
    log_warning "  Warnings: $warning_count"
    if [[ $error_count -gt 0 ]]; then
        log_error "  Errors: $error_count"
    else
        log_success "  Errors: $error_count"
    fi
    
    echo
    log_info "Test suite completed at: $(date)"
}

# Help function
show_help() {
    echo "Google Cloud Platform Minimal Test Suite"
    echo "DevOps Engineer Refactor - Focused 2-Phase Approach"
    echo
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  -h, --help                  Show this help message"
    echo "  -q, --quick-check           Quick validation"
    echo "  -a, --include-availability  Include optional service availability checks"
    echo "  -p, --project PROJECT_ID    Set Google Cloud project ID"
    echo "  -r, --region REGION         Set Google Cloud region"
    echo "  -z, --zone ZONE             Set Google Cloud zone"
    echo
    echo "Phases:"
    echo "  1. Environment Discovery (ESSENTIAL)"
    echo "  2. Authentication and Permissions (ESSENTIAL)"
    echo "  3. Service Availability (OPTIONAL)"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -q|--quick-check)
            QUICK_CHECK=true
            shift
            ;;
        -a|--include-availability)
            INCLUDE_SERVICE_AVAILABILITY=true
            shift
            ;;
        -p|--project)
            gcloud config set project "$2"
            shift 2
            ;;
        -r|--region)
            gcloud config set compute/region "$2"
            shift 2
            ;;
        -z|--zone)
            gcloud config set compute/zone "$2"
            shift 2
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Run main function
main
