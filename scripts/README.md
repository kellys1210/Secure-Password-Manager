# Security Audit Script

A streamlined security audit script for the Secure Password Manager student project that performs essential security validations to ensure compliance with security requirements SEC-001, SEC-002, and SEC-003.

## Overview

This script performs three essential security validations:

1. **Plaintext Leak Detection** - Scans logs and API responses for sensitive data exposure
2. **Environment Variable Security Validation** - Checks for hardcoded secrets and insecure configurations
3. **HTTPS Enforcement Verification** - Validates HTTPS configuration and security headers

## Features

- 🔍 **Essential Scanning**: Detects passwords, API keys, tokens, and other sensitive data
- 🛡️ **Environment Security**: Validates configuration files and environment variables
- 🔒 **HTTPS Verification**: Tests SSL/TLS enforcement and security headers
- 📊 **Simple Reporting**: Generates console and JSON reports
- 🚨 **CI/CD Integration**: Runs in GitHub Actions workflow
- ⚡ **Fast Execution**: Optimized for student project scope

## Installation

The script requires Python 3.8+ and the following dependencies:

```bash
pip install requests
```

## Usage

### Basic Usage

```bash
# Run full security audit
python scripts/security-audit.py

# Run with production environment settings
python scripts/security-audit.py --env production

# Generate JSON report
python scripts/security-audit.py --env production --output security-report.json

# Verbose logging
python scripts/security-audit.py --verbose
```

### Advanced Usage

```bash
# Scan only log files
python scripts/security-audit.py --scan-only logs

# Scan only environment security
python scripts/security-audit.py --scan-only env

# Skip HTTPS checks
python scripts/security-audit.py --no-https-check

# Test custom URLs
python scripts/security-audit.py --custom-urls https://your-service.com https://api.your-service.com
```

### Docker Usage

```bash
# Run in Docker container
docker run --rm -v $(pwd):/app -w /app python:3.11-slim \
  python scripts/security-audit.py --env production

# With custom URLs
docker run --rm -v $(pwd):/app -w /app python:3.11-slim \
  python scripts/security-audit.py --env production --custom-urls \
  https://auth-service.com https://vault-service.com
```

## Exit Codes

- **0**: Success (no critical issues)
- **1**: Warnings found
- **2**: Critical security issues found

## Security Patterns Detected

The script scans for the following sensitive data patterns:

- **Passwords**: `password`, `pass`, `pwd`, `secret`
- **Encryption Keys**: AES keys, encryption keys (16+ characters)
- **Session Tokens**: JWT tokens, session IDs (20+ characters)
- **TOTP Secrets**: Multi-factor authentication secrets (16+ characters)
- **Database Connections**: PostgreSQL connection strings
- **API Keys**: API keys and tokens (20+ characters)

## Configuration

### Default Scan Paths

- Log files: `./logs`, `./backend/logs`, `./frontend/logs`, `/var/log/containers`
- Environment files: `.env`, `.env.example`, `backend/.env`, `frontend/.env`
- Docker Compose files: `compose.yaml`, `docker-compose.yml`, `docker-compose.yaml`

### Excluded Patterns

- Git directories: `.*\.git.*`
- Node modules: `.*node_modules.*`
- Python cache: `.*__pycache__.*`, `.*\.pytest_cache.*`

## GitHub Actions Integration

The script includes a GitHub Actions workflow that automatically runs security audits on:

- **Push events** to main and develop branches
- **Pull requests** to main branch
- **Scheduled runs** every Monday at 9 AM UTC

### Workflow Features

- **Full Security Audit**: Complete scan on main branch pushes
- **Limited PR Scan**: Environment-only scan for pull requests
- **Artifact Upload**: Security reports saved as workflow artifacts
- **Workflow Summary**: Results displayed in GitHub Actions summary
- **Critical Issue Blocking**: Fails workflow on critical security issues

### Example Workflow

```yaml
name: Security Audit
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  security-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v4
        with:
          python-version: "3.11"
      - run: pip install requests
      - run: python scripts/security-audit.py --env production
```

## Output Formats

### Console Output

```
🔒 SECURITY AUDIT REPORT - 2025-11-15 14:30:22
═══════════════════════════════════════════════

🚨 CRITICAL ISSUES (2):
- [CRITICAL] Plaintext password detected in /logs/auth.log:23
- [CRITICAL] HTTP endpoint accessible: http://auth-service.example.com

⚠️ WARNINGS (3):
- [WARNING] Debug mode enabled in .env
- [WARNING] Missing HSTS header on frontend
- [WARNING] World-readable file: .env

✅ SECURE CHECKS (15):
- [OK] 5 Plaintext leak checks passed
- [OK] 6 Environment security checks passed
- [OK] 4 HTTPS enforcement checks passed

📊 SUMMARY: 2 CRITICAL | 3 WARNING | 15 OK
⏱️ SCAN DURATION: 2.4 seconds
```

### JSON Report Structure

```json
{
  "timestamp": "2025-11-15T14:30:22Z",
  "environment": "production",
  "scan_results": {
    "plaintext_leaks": {
      "critical": [
        {
          "file": "/logs/auth.log",
          "line": 23,
          "pattern": "password",
          "context": "password=secret123"
        }
      ],
      "warnings": [],
      "secure": 5
    },
    "env_security": {
      "critical": [],
      "warnings": [
        {
          "file": ".env",
          "issue": "debug_mode_enabled"
        }
      ],
      "secure": 6
    },
    "https_enforcement": {
      "critical": [
        {
          "url": "http://auth-service.example.com",
          "issue": "http_accessible"
        }
      ],
      "warnings": [
        {
          "url": "https://frontend.example.com",
          "issue": "missing_hsts_header"
        }
      ],
      "secure": 4
    }
  },
  "summary": {
    "critical_issues": 2,
    "warnings": 3,
    "secure_checks": 15,
    "scan_duration_seconds": 2.4
  }
}
```

## Security Requirements Addressed

This script addresses the following security requirements from the project plan:

- **SEC-001**: All sensitive data encrypted at rest in the database
- **SEC-002**: HTTPS enforcement for all communications
- **SEC-003**: Input validation and basic XSS protection

## Performance Considerations

- **Large Files**: Log files are processed line by line to avoid memory issues
- **Docker Logs**: Limited to last 1000 lines per container
- **Network Timeouts**: All HTTP requests have 10-second timeouts
- **Exclusion Patterns**: Common development directories are excluded

## Safety Features

- **Data Truncation**: Sensitive data in reports is truncated to 100 characters
- **No Data Persistence**: No sensitive data written to disk unless explicitly requested
- **Local Testing**: Network requests use `verify=False` only for local development
- **Permission Checking**: File permissions are checked but not modified

## Testing

Unit test stubs are included in the script documentation. To implement full testing:

```python
# tests/test_security_audit.py
import pytest
from scripts.security_audit import SecurityAudit, SENSITIVE_PATTERNS

class TestSecurityAudit:
    def test_sensitive_patterns(self):
        # Test pattern matching
        pass

    def test_environment_validation(self, tmp_path):
        # Test environment file scanning
        pass
```

## Troubleshooting

### Common Issues

1. **Missing Dependencies**: Ensure `requests` is installed
2. **Permission Errors**: Script may need read access to log files
3. **Network Timeouts**: Adjust timeout values for slow networks
4. **False Positives**: Review and adjust regex patterns as needed

### Debug Mode

Use verbose logging for detailed debugging:

```bash
python scripts/security-audit.py --verbose
```

## Contributing

When contributing to this script:

1. Follow PEP8 style guidelines
2. Add type hints and docstrings for new functions
3. Update test stubs for new functionality
4. Update this documentation for new features

## License

This script is part of the Secure Password Manager project and follows the same licensing terms.

## Owner

**Matthew Alviar** - Project Manager & QA Lead
