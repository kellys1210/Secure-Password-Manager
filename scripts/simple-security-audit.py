#!/usr/bin/env python3
"""
Simple Security Audit Script for Secure Password Manager
Focused on actual security issues, not false positives.

This script checks for:
1. Hardcoded secrets in .env files
2. Hardcoded database passwords in compose.yaml
3. File permissions on sensitive files
"""

import os
import re
import sys
from datetime import datetime


def check_env_file(file_path):
    """Check .env file for hardcoded secrets."""
    issues = []
    try:
        with open(file_path, "r") as f:
            content = f.read()

        # Check for hardcoded JWT secret
        jwt_match = re.search(r"JWT_SECRET=([^\s]+)", content)
        if jwt_match and jwt_match.group(1) not in [
            "",
            "your_secure_jwt_secret_key_here",
        ]:
            issues.append(f"Hardcoded JWT secret in {file_path}")

        # Check for hardcoded database passwords
        db_match = re.search(r"POSTGRES_PASSWORD=([^\s]+)", content)
        if db_match and db_match.group(1) not in ["", "your_secure_password_here"]:
            issues.append(f"Hardcoded database password in {file_path}")

    except Exception as e:
        issues.append(f"Could not read {file_path}: {e}")

    return issues


def check_compose_file(file_path):
    """Check docker compose file for hardcoded secrets."""
    issues = []
    try:
        with open(file_path, "r") as f:
            content = f.read()

        # Check for hardcoded database password (not using environment variable)
        if "POSTGRES_PASSWORD=postgres" in content:
            issues.append(f"Hardcoded database password in {file_path}")

    except Exception as e:
        issues.append(f"Could not read {file_path}: {e}")

    return issues


def check_file_permissions(file_path):
    """Check file permissions for sensitive files."""
    issues = []
    try:
        stat_info = os.stat(file_path)
        # Check if file is world-readable
        if stat_info.st_mode & 0o004:
            issues.append(f"World-readable file: {file_path}")
    except Exception as e:
        issues.append(f"Could not check permissions for {file_path}: {e}")

    return issues


def main():
    """Main security audit function."""
    print(f"🔒 SIMPLE SECURITY AUDIT - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("═══════════════════════════════════════════════")

    all_issues = []

    # Check environment files
    env_files = [".env", ".env.example"]
    for env_file in env_files:
        if os.path.exists(env_file):
            all_issues.extend(check_env_file(env_file))
            all_issues.extend(check_file_permissions(env_file))

    # Check compose file
    compose_files = ["compose.yaml"]
    for compose_file in compose_files:
        if os.path.exists(compose_file):
            all_issues.extend(check_compose_file(compose_file))
            all_issues.extend(check_file_permissions(compose_file))

    # Report results
    if all_issues:
        print(f"\n🚨 SECURITY ISSUES FOUND ({len(all_issues)}):")
        for issue in all_issues:
            print(f"- {issue}")
        print(f"\n❌ SECURITY AUDIT FAILED")
        sys.exit(2)
    else:
        print(f"\n✅ SECURITY AUDIT PASSED: No critical issues found")
        sys.exit(0)


if __name__ == "__main__":
    main()
