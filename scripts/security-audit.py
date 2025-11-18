#!/usr/bin/env python3
"""
Comprehensive Security Audit Script for Secure Password Manager
Owner: Matthew Alviar (Project Manager & QA Lead)

This script performs three critical security validations:
1. Plaintext leak detection in logs and API responses
2. Environment variable security validation
3. HTTPS enforcement verification

Exit codes:
0 = Success (no critical issues)
1 = Warnings found
2 = Critical security issues found
"""

import os
import re
import json
import requests
import logging
import subprocess
import argparse
import sys
from pathlib import Path
from datetime import datetime
from urllib.parse import urlparse
from typing import Dict, List, Tuple, Optional, Any


# Security patterns for sensitive data detection
SENSITIVE_PATTERNS = {
    "password": r'(?i)(password|pass|pwd|secret)[\s=:"]*([^\s]+)',
    "encryption_key": r'(?i)(key|aes_key|encryption_key)[\s=:"]*([a-zA-Z0-9+/=]{16,})',
    "session_token": r'(?i)(token|jwt|session)[\s=:"]*([a-zA-Z0-9\-_\.]{20,})',
    "totp_secret": r'(?i)(totp|otp|mfa)[\s=:"]*([a-zA-Z0-9]{16,})',
    "database_connection": r"postgresql://[^\s]+",
    "api_key": r'(?i)(api[_-]?key)[\s=:"]*([a-zA-Z0-9]{20,})',
}

# Default configuration - Simplified for student project
DEFAULT_CONFIG = {
    "scan_paths": [
        "./logs",
    ],
    "env_files": [".env", ".env.example"],
    "docker_compose_files": [
        "compose.yaml",
    ],
    "production_urls": [
        "https://auth-service.example.com",
        "https://vault-service.example.com",
    ],
    "test_endpoints": [
        "http://localhost:8080/api/auth/login",
        "http://localhost:8080/api/vault/entries",
    ],
    "exclude_patterns": [
        r".*\.git.*",
        r".*node_modules.*",
        r".*__pycache__.*",
        r".*\.pytest_cache.*",
        r".*venv.*",  # Exclude virtual environments
        r".*backend/venv.*",  # Exclude backend virtual environment
    ],
}


class SecurityAudit:
    """Main security audit class that performs all security validations."""

    def __init__(self, environment: str = "development", verbose: bool = False):
        self.environment = environment
        self.verbose = verbose
        self.results = {
            "plaintext_leaks": {"critical": [], "warnings": [], "secure": 0},
            "env_security": {"critical": [], "warnings": [], "secure": 0},
            "https_enforcement": {"critical": [], "warnings": [], "secure": 0},
        }
        self.start_time = datetime.now()

        # Setup logging
        logging.basicConfig(
            level=logging.DEBUG if verbose else logging.INFO,
            format="%(asctime)s - %(levelname)s - %(message)s",
        )
        self.logger = logging.getLogger(__name__)

    def scan_for_plaintext_leaks(
        self, log_paths: List[str], response_endpoints: List[str]
    ) -> Dict[str, List]:
        """
        Scan for plaintext leaks in logs and API responses.

        Args:
            log_paths: List of paths to scan for log files
            response_endpoints: List of API endpoints to test

        Returns:
            Dictionary with critical issues and warnings
        """
        self.logger.info("Starting plaintext leak detection scan...")

        issues = {"critical": [], "warnings": [], "secure": 0}

        # Scan log files
        for log_path in log_paths:
            if os.path.exists(log_path):
                issues = self._scan_log_files(log_path, issues)
            else:
                self.logger.debug(f"Log path not found: {log_path}")

        # Test API endpoints
        for endpoint in response_endpoints:
            issues = self._test_api_endpoint(endpoint, issues)

        # Scan Docker logs if available
        issues = self._scan_docker_logs(issues)

        self.results["plaintext_leaks"] = issues
        return issues

    def _scan_log_files(self, log_path: str, issues: Dict) -> Dict:
        """Scan individual log files for sensitive data."""
        try:
            if os.path.isfile(log_path):
                self._scan_single_file(log_path, issues)
            elif os.path.isdir(log_path):
                for root, dirs, files in os.walk(log_path):
                    for file in files:
                        if self._should_scan_file(file):
                            file_path = os.path.join(root, file)
                            self._scan_single_file(file_path, issues)
        except Exception as e:
            self.logger.warning(f"Error scanning log path {log_path}: {e}")

        return issues

    def _should_scan_file(self, filename: str) -> bool:
        """Check if a file should be scanned based on exclusion patterns."""
        for pattern in DEFAULT_CONFIG["exclude_patterns"]:
            if re.match(pattern, filename):
                return False
        return filename.endswith((".log", ".txt", ".out"))

    def _scan_single_file(self, file_path: str, issues: Dict) -> None:
        """Scan a single file for sensitive patterns."""
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                for line_num, line in enumerate(f, 1):
                    for pattern_name, pattern in SENSITIVE_PATTERNS.items():
                        matches = re.findall(pattern, line)
                        if matches:
                            issue = {
                                "file": file_path,
                                "line": line_num,
                                "pattern": pattern_name,
                                "context": line.strip()[
                                    :100
                                ],  # First 100 chars for context
                            }
                            issues["critical"].append(issue)
                            self.logger.critical(
                                f"Plaintext leak detected in {file_path}:{line_num} - {pattern_name}"
                            )
        except Exception as e:
            self.logger.warning(f"Could not read file {file_path}: {e}")

    def _test_api_endpoint(self, endpoint: str, issues: Dict) -> Dict:
        """Test API endpoints for sensitive data in responses."""
        try:
            response = requests.get(endpoint, timeout=10, verify=False)

            # Check response content for sensitive data
            for pattern_name, pattern in SENSITIVE_PATTERNS.items():
                matches = re.findall(pattern, response.text)
                if matches:
                    issue = {
                        "endpoint": endpoint,
                        "pattern": pattern_name,
                        "matches_found": len(matches),
                    }
                    issues["critical"].append(issue)
                    self.logger.critical(
                        f"Sensitive data in API response: {endpoint} - {pattern_name}"
                    )

            # Check for stack traces in error responses
            if response.status_code >= 400:
                if any(
                    trace_indicator in response.text
                    for trace_indicator in [
                        "Traceback",
                        'File "',
                        "line ",
                        "Exception:",
                    ]
                ):
                    issue = {
                        "endpoint": endpoint,
                        "issue": "stack_trace_exposed",
                        "status_code": response.status_code,
                    }
                    issues["critical"].append(issue)
                    self.logger.critical(
                        f"Stack trace exposed in API response: {endpoint}"
                    )

            issues["secure"] += 1

        except requests.RequestException as e:
            self.logger.debug(f"Could not test endpoint {endpoint}: {e}")
            issues["warnings"].append(
                {"endpoint": endpoint, "issue": "endpoint_unreachable", "error": str(e)}
            )

        return issues

    def _scan_docker_logs(self, issues: Dict) -> Dict:
        """Scan Docker container logs for sensitive data."""
        try:
            # Get running containers
            result = subprocess.run(
                ["docker", "ps", "--format", "{{.Names}}"],
                capture_output=True,
                text=True,
                timeout=30,
            )

            if result.returncode == 0:
                containers = result.stdout.strip().split("\n")
                for container in containers:
                    if container:
                        self._scan_docker_container_logs(container, issues)

        except (
            subprocess.TimeoutExpired,
            FileNotFoundError,
            subprocess.SubprocessError,
        ) as e:
            self.logger.debug(f"Docker not available or error: {e}")

        return issues

    def _scan_docker_container_logs(self, container: str, issues: Dict) -> None:
        """Scan logs from a specific Docker container."""
        try:
            result = subprocess.run(
                ["docker", "logs", container, "--tail", "1000"],
                capture_output=True,
                text=True,
                timeout=30,
            )

            if result.returncode == 0:
                for line_num, line in enumerate(result.stdout.split("\n"), 1):
                    for pattern_name, pattern in SENSITIVE_PATTERNS.items():
                        matches = re.findall(pattern, line)
                        if matches:
                            issue = {
                                "container": container,
                                "line": line_num,
                                "pattern": pattern_name,
                                "context": line.strip()[:100],
                            }
                            issues["critical"].append(issue)
                            self.logger.critical(
                                f"Plaintext leak in Docker container {container}:{line_num} - {pattern_name}"
                            )

        except subprocess.TimeoutExpired:
            self.logger.warning(f"Timeout scanning Docker container {container}")

    def validate_environment_security(
        self, env_files: List[str], docker_compose_files: List[str]
    ) -> Dict[str, List]:
        """
        Validate environment variable security and configuration.

        Args:
            env_files: List of environment files to check
            docker_compose_files: List of Docker Compose files to check

        Returns:
            Dictionary with critical issues and warnings
        """
        self.logger.info("Starting environment security validation...")

        issues = {"critical": [], "warnings": [], "secure": 0}

        # Check environment files
        for env_file in env_files:
            if os.path.exists(env_file):
                issues = self._check_env_file(env_file, issues)

        # Check Docker Compose files
        for compose_file in docker_compose_files:
            if os.path.exists(compose_file):
                issues = self._check_docker_compose_file(compose_file, issues)

        # Check file permissions
        issues = self._check_file_permissions(env_files + docker_compose_files, issues)

        # Check for hardcoded secrets in code
        issues = self._scan_for_hardcoded_secrets(issues)

        self.results["env_security"] = issues
        return issues

    def _check_env_file(self, env_file: str, issues: Dict) -> Dict:
        """Check an environment file for security issues."""
        try:
            with open(env_file, "r") as f:
                content = f.read()

                # Check for debug mode in production
                if self.environment == "production":
                    if "DEBUG=True" in content or "FLASK_ENV=development" in content:
                        issues["critical"].append(
                            {
                                "file": env_file,
                                "issue": "debug_mode_enabled",
                                "context": "Debug mode should be disabled in production",
                            }
                        )

                # Check for hardcoded secrets
                for pattern_name, pattern in SENSITIVE_PATTERNS.items():
                    matches = re.findall(pattern, content)
                    if (
                        matches and pattern_name != "password"
                    ):  # Allow password field names
                        issues["critical"].append(
                            {
                                "file": env_file,
                                "issue": f"hardcoded_{pattern_name}",
                                "matches": len(matches),
                            }
                        )

                issues["secure"] += 1

        except Exception as e:
            self.logger.warning(f"Could not read environment file {env_file}: {e}")

        return issues

    def _check_docker_compose_file(self, compose_file: str, issues: Dict) -> Dict:
        """Check Docker Compose file for security issues."""
        try:
            with open(compose_file, "r") as f:
                content = f.read()

                # Check for hardcoded secrets
                for pattern_name, pattern in SENSITIVE_PATTERNS.items():
                    matches = re.findall(pattern, content)
                    if matches:
                        issues["critical"].append(
                            {
                                "file": compose_file,
                                "issue": f"hardcoded_{pattern_name}",
                                "matches": len(matches),
                            }
                        )

                # Check for insecure configurations
                if (
                    "POSTGRES_PASSWORD=" in content
                    and "${POSTGRES_PASSWORD}" not in content
                ):
                    issues["critical"].append(
                        {
                            "file": compose_file,
                            "issue": "hardcoded_database_password",
                            "context": "Database password should use environment variables",
                        }
                    )

                issues["secure"] += 1

        except Exception as e:
            self.logger.warning(
                f"Could not read Docker Compose file {compose_file}: {e}"
            )

        return issues

    def _check_file_permissions(self, files: List[str], issues: Dict) -> Dict:
        """Check file permissions for sensitive files."""
        for file_path in files:
            if os.path.exists(file_path):
                try:
                    stat_info = os.stat(file_path)
                    # Check if file is world-readable
                    if stat_info.st_mode & 0o004:
                        issues["warnings"].append(
                            {
                                "file": file_path,
                                "issue": "world_readable",
                                "permissions": oct(stat_info.st_mode)[-3:],
                            }
                        )
                except Exception as e:
                    self.logger.debug(
                        f"Could not check permissions for {file_path}: {e}"
                    )

        return issues

    def _scan_for_hardcoded_secrets(self, issues: Dict) -> Dict:
        """Scan code files for hardcoded secrets."""
        code_extensions = [
            ".py",
            ".js",
            ".jsx",
            ".ts",
            ".tsx",
            ".json",
            ".yaml",
            ".yml",
        ]

        try:
            for root, dirs, files in os.walk("."):
                # Skip excluded directories
                dirs[:] = [
                    d
                    for d in dirs
                    if not any(
                        re.match(pattern, d)
                        for pattern in DEFAULT_CONFIG["exclude_patterns"]
                    )
                ]

                for file in files:
                    if any(file.endswith(ext) for ext in code_extensions):
                        file_path = os.path.join(root, file)
                        if self._should_scan_code_file(file_path):
                            self._scan_code_file_for_secrets(file_path, issues)

        except Exception as e:
            self.logger.warning(f"Error scanning for hardcoded secrets: {e}")

        return issues

    def _should_scan_code_file(self, file_path: str) -> bool:
        """Check if a code file should be scanned."""
        for pattern in DEFAULT_CONFIG["exclude_patterns"]:
            if re.match(pattern, file_path):
                return False
        return True

    def _scan_code_file_for_secrets(self, file_path: str, issues: Dict) -> None:
        """Scan a single code file for hardcoded secrets."""
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

                # Skip test files for certain patterns
                is_test_file = "test" in file_path.lower()

                for pattern_name, pattern in SENSITIVE_PATTERNS.items():
                    # Skip password field detection in test files
                    if is_test_file and pattern_name == "password":
                        continue

                    matches = re.findall(pattern, content)
                    if matches:
                        # Filter out false positives
                        valid_matches = []
                        for match in matches:
                            # Skip matches that are clearly variable names or comments
                            if self._is_false_positive(match, pattern_name, content):
                                continue
                            valid_matches.append(match)

                        if valid_matches:
                            issues["critical"].append(
                                {
                                    "file": file_path,
                                    "issue": f"hardcoded_{pattern_name}",
                                    "matches": len(valid_matches),
                                }
                            )

        except Exception as e:
            self.logger.debug(f"Could not scan code file {file_path}: {e}")

    def _is_false_positive(self, match: tuple, pattern_name: str, content: str) -> bool:
        """Check if a detected match is likely a false positive."""
        # Common false positive patterns
        false_positive_patterns = [
            r'password[\s=:"]*""',  # Empty password
            r'password[\s=:"]*"password"',  # Literal "password" string
            r'password[\s=:"]*"test"',  # Test passwords
            r'password[\s=:"]*"example"',  # Example passwords
            r'password[\s=:"]*"your_password"',  # Placeholder text
            r'password[\s=:"]*"secret"',  # Generic placeholder
            r'password[\s=:"]*"123"',  # Simple test passwords
            r'password[\s=:"]*"pass"',  # Simple test passwords
            r'password[\s=:"]*"pwd"',  # Simple test passwords
        ]

        # Check if match matches any false positive pattern
        match_str = f'{match[0]}"{match[1]}"' if len(match) > 1 else str(match)
        for fp_pattern in false_positive_patterns:
            if re.search(fp_pattern, match_str, re.IGNORECASE):
                return True

        # Check if it's in a comment
        lines = content.split("\n")
        for line_num, line in enumerate(lines, 1):
            if match_str in line:
                # Check if line is a comment
                stripped_line = line.strip()
                if stripped_line.startswith(("#", "//", "/*", "*", "--")):
                    return True
                # Check if it's in a string literal that's clearly a placeholder
                if any(
                    placeholder in line.lower()
                    for placeholder in [
                        "example",
                        "placeholder",
                        "your_",
                        "test_",
                        "demo",
                    ]
                ):
                    return True

        return False

    def verify_https_enforcement(self, production_urls: List[str]) -> Dict[str, List]:
        """
        Verify HTTPS enforcement for production endpoints.

        Args:
            production_urls: List of production URLs to test

        Returns:
            Dictionary with critical issues and warnings
        """
        self.logger.info("Starting HTTPS enforcement verification...")

        issues = {"critical": [], "warnings": [], "secure": 0}

        for url in production_urls:
            issues = self._test_https_enforcement(url, issues)

        self.results["https_enforcement"] = issues
        return issues

    def _test_https_enforcement(self, url: str, issues: Dict) -> Dict:
        """Test HTTPS enforcement for a single URL."""
        parsed = urlparse(url)

        # Test HTTP version (should redirect to HTTPS or be inaccessible)
        http_url = f"http://{parsed.netloc}{parsed.path}"

        try:
            response = requests.get(http_url, timeout=10, allow_redirects=False)

            # Check if HTTP is accessible (should redirect to HTTPS)
            if response.status_code == 200:
                issues["critical"].append(
                    {
                        "url": http_url,
                        "issue": "http_accessible",
                        "status_code": response.status_code,
                    }
                )
                self.logger.critical(f"HTTP endpoint accessible: {http_url}")
            elif response.status_code in [301, 302, 307, 308]:
                # Check redirect location
                location = response.headers.get("Location", "")
                if not location.startswith("https://"):
                    issues["warnings"].append(
                        {
                            "url": http_url,
                            "issue": "invalid_https_redirect",
                            "redirect_location": location,
                        }
                    )
            else:
                issues["secure"] += 1

        except requests.RequestException:
            # HTTP endpoint not accessible (good)
            issues["secure"] += 1

        # Test HTTPS version
        try:
            response = requests.get(url, timeout=10, verify=True)

            # Check security headers
            security_headers = self._check_security_headers(response.headers, url)
            for header_issue in security_headers:
                if header_issue["severity"] == "critical":
                    issues["critical"].append(header_issue)
                else:
                    issues["warnings"].append(header_issue)

            # Check for mixed content
            if (
                "Content-Type" in response.headers
                and "text/html" in response.headers["Content-Type"]
            ):
                mixed_content = self._check_mixed_content(response.text, url)
                issues["warnings"].extend(mixed_content)

            issues["secure"] += 1

        except requests.RequestException as e:
            issues["warnings"].append(
                {"url": url, "issue": "https_unreachable", "error": str(e)}
            )

        return issues

    def _check_security_headers(self, headers: Dict, url: str) -> List[Dict]:
        """Check for important security headers."""
        issues = []

        # Check HSTS header
        if "Strict-Transport-Security" not in headers:
            issues.append(
                {"url": url, "issue": "missing_hsts_header", "severity": "critical"}
            )

        # Check Content-Security-Policy
        if "Content-Security-Policy" not in headers:
            issues.append(
                {"url": url, "issue": "missing_csp_header", "severity": "warning"}
            )

        # Check X-Content-Type-Options
        if "X-Content-Type-Options" not in headers:
            issues.append(
                {
                    "url": url,
                    "issue": "missing_x_content_type_options",
                    "severity": "warning",
                }
            )

        return issues

    def _check_mixed_content(self, html_content: str, url: str) -> List[Dict]:
        """Check for mixed HTTP/HTTPS content in HTML."""
        issues = []

        # Look for HTTP resources in HTTPS page
        http_patterns = [
            r'src="http://[^"]+',
            r'href="http://[^"]+',
            r"url\(http://[^)]+",
        ]

        for pattern in http_patterns:
            matches = re.findall(pattern, html_content)
            if matches:
                issues.append(
                    {
                        "url": url,
                        "issue": "mixed_content_detected",
                        "resources": matches[:3],  # Show first 3 matches
                    }
                )

        return issues

    def generate_security_report(
        self, output_file: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate comprehensive security report."""
        end_time = datetime.now()
        duration = (end_time - self.start_time).total_seconds()

        # Calculate summary statistics
        total_critical = (
            len(self.results["plaintext_leaks"]["critical"])
            + len(self.results["env_security"]["critical"])
            + len(self.results["https_enforcement"]["critical"])
        )

        total_warnings = (
            len(self.results["plaintext_leaks"]["warnings"])
            + len(self.results["env_security"]["warnings"])
            + len(self.results["https_enforcement"]["warnings"])
        )

        total_secure = (
            self.results["plaintext_leaks"]["secure"]
            + self.results["env_security"]["secure"]
            + self.results["https_enforcement"]["secure"]
        )

        # Generate console report
        self._generate_console_report(
            total_critical, total_warnings, total_secure, duration
        )

        # Generate JSON report
        json_report = self._generate_json_report(
            total_critical, total_warnings, total_secure, duration
        )

        # Save to file if specified
        if output_file:
            with open(output_file, "w") as f:
                json.dump(json_report, f, indent=2, default=str)
            self.logger.info(f"Security report saved to: {output_file}")

        return json_report

    def _generate_console_report(
        self, critical: int, warnings: int, secure: int, duration: float
    ) -> None:
        """Generate formatted console output."""
        print(
            f"\n🔒 SECURITY AUDIT REPORT - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        )
        print("═══════════════════════════════════════════════")

        if critical > 0:
            print(f"\n🚨 CRITICAL ISSUES ({critical}):")
            for category, results in self.results.items():
                for issue in results["critical"]:
                    print(
                        f"- [CRITICAL] {self._format_issue_description(issue, category)}"
                    )

        if warnings > 0:
            print(f"\n⚠️ WARNINGS ({warnings}):")
            for category, results in self.results.items():
                for issue in results["warnings"]:
                    print(
                        f"- [WARNING] {self._format_issue_description(issue, category)}"
                    )

        if secure > 0:
            print(f"\n✅ SECURE CHECKS ({secure}):")
            # Show summary of secure checks by category
            for category, results in self.results.items():
                if results["secure"] > 0:
                    category_name = category.replace("_", " ").title()
                    print(f"- [OK] {results['secure']} {category_name} checks passed")

        print(f"\n📊 SUMMARY: {critical} CRITICAL | {warnings} WARNING | {secure} OK")
        print(f"⏱️ SCAN DURATION: {duration:.1f} seconds")

        # Exit code recommendation
        if critical > 0:
            print(f"\n❌ SECURITY AUDIT FAILED: {critical} critical issues found")
            print("Exit code: 2")
        elif warnings > 0:
            print(f"\n⚠️ SECURITY AUDIT PASSED WITH WARNINGS: {warnings} warnings found")
            print("Exit code: 1")
        else:
            print(f"\n✅ SECURITY AUDIT PASSED: No critical issues found")
            print("Exit code: 0")

    def _format_issue_description(self, issue: Dict, category: str) -> str:
        """Format issue description for console output."""
        try:
            if category == "plaintext_leaks":
                if "file" in issue:
                    pattern = issue.get("pattern", "sensitive_data")
                    return f"Plaintext {pattern} detected in {issue['file']}:{issue['line']}"
                elif "container" in issue:
                    pattern = issue.get("pattern", "sensitive_data")
                    return f"Plaintext {pattern} in Docker container {issue['container']}:{issue['line']}"
                elif "endpoint" in issue:
                    pattern = issue.get("pattern", "sensitive_data")
                    return f"Sensitive data in API response: {issue['endpoint']} - {pattern}"

            elif category == "env_security":
                if "file" in issue:
                    issue_desc = (
                        issue.get("issue", "security_issue").replace("_", " ").title()
                    )
                    return f"{issue_desc} in {issue['file']}"

            elif category == "https_enforcement":
                if "url" in issue:
                    issue_desc = (
                        issue.get("issue", "security_issue").replace("_", " ").title()
                    )
                    return f"{issue_desc}: {issue['url']}"

            return str(issue)
        except Exception as e:
            self.logger.warning(f"Error formatting issue description: {e}")
            return f"Security issue in {category}: {issue}"

    def _generate_json_report(
        self, critical: int, warnings: int, secure: int, duration: float
    ) -> Dict[str, Any]:
        """Generate JSON report structure."""
        return {
            "timestamp": datetime.now().isoformat(),
            "environment": self.environment,
            "scan_results": self.results,
            "summary": {
                "critical_issues": critical,
                "warnings": warnings,
                "secure_checks": secure,
                "scan_duration_seconds": duration,
            },
        }


def main():
    """Main function to handle command line arguments and execute security audit."""
    parser = argparse.ArgumentParser(
        description="Security Audit Script for Secure Password Manager",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/security-audit.py --env production --output report.json
  python scripts/security-audit.py --scan-only logs --verbose
  python scripts/security-audit.py --env development --no-https-check
        """,
    )

    parser.add_argument(
        "--env",
        choices=["development", "production", "staging"],
        default="development",
        help="Environment to audit (default: development)",
    )

    parser.add_argument("--output", "-o", help="Output file for JSON report")

    parser.add_argument(
        "--verbose", "-v", action="store_true", help="Enable verbose logging"
    )

    parser.add_argument(
        "--scan-only",
        choices=["logs", "env", "https", "all"],
        default="all",
        help="Limit scan to specific checks (default: all)",
    )

    parser.add_argument(
        "--no-https-check", action="store_true", help="Skip HTTPS enforcement checks"
    )

    parser.add_argument(
        "--custom-urls", nargs="+", help="Custom URLs to test for HTTPS enforcement"
    )

    args = parser.parse_args()

    # Initialize security audit
    audit = SecurityAudit(environment=args.env, verbose=args.verbose)

    try:
        # Execute scans based on arguments
        if args.scan_only in ["logs", "all"]:
            audit.scan_for_plaintext_leaks(
                DEFAULT_CONFIG["scan_paths"], DEFAULT_CONFIG["test_endpoints"]
            )

        if args.scan_only in ["env", "all"]:
            audit.validate_environment_security(
                DEFAULT_CONFIG["env_files"], DEFAULT_CONFIG["docker_compose_files"]
            )

        if args.scan_only in ["https", "all"] and not args.no_https_check:
            urls = (
                args.custom_urls
                if args.custom_urls
                else DEFAULT_CONFIG["production_urls"]
            )
            audit.verify_https_enforcement(urls)

        # Generate report
        report = audit.generate_security_report(args.output)

        # Determine exit code
        total_critical = report["summary"]["critical_issues"]
        if total_critical > 0:
            sys.exit(2)
        elif report["summary"]["warnings"] > 0:
            sys.exit(1)
        else:
            sys.exit(0)

    except KeyboardInterrupt:
        print("\n⚠️ Security audit interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Security audit failed: {e}")
        sys.exit(2)


if __name__ == "__main__":
    main()


# =============================================================================
# INTEGRATION EXAMPLES AND DOCUMENTATION
# =============================================================================

"""
GitHub Actions Integration Example:

name: Security Audit
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  security-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install requests
          
      - name: Run security audit
        run: |
          python scripts/security-audit.py --env production --output security-report.json
          
      - name: Upload security report
        uses: actions/upload-artifact@v4
        with:
          name: security-report
          path: security-report.json
          
      - name: Fail on critical issues
        if: failure()
        run: |
          echo "Critical security issues found. Check the security report for details."
          exit 1

Docker Integration Example:

# Run security audit in Docker container
docker run --rm -v $(pwd):/app -w /app python:3.11-slim \
  python scripts/security-audit.py --env production --verbose

# Run with custom URLs
docker run --rm -v $(pwd):/app -w /app python:3.11-slim \
  python scripts/security-audit.py --env production --custom-urls \
  https://your-auth-service.com https://your-vault-service.com

Unit Test Stubs (for pytest):

# tests/test_security_audit.py
import pytest
from scripts.security_audit import SecurityAudit, SENSITIVE_PATTERNS

class TestSecurityAudit:
    def test_sensitive_patterns(self):
        # Test that patterns match expected sensitive data
        test_cases = [
            ('password="secret123"', 'password'),
            ('api_key=abcdefghijklmnopqrst', 'api_key'),
            ('postgresql://user:pass@localhost/db', 'database_connection')
        ]
        
        for test_string, expected_pattern in test_cases:
            for pattern_name, pattern in SENSITIVE_PATTERNS.items():
                if pattern_name == expected_pattern:
                    assert re.search(pattern, test_string) is not None
    
    def test_environment_validation(self, tmp_path):
        # Test environment file validation
        env_file = tmp_path / ".env.test"
        env_file.write_text("DEBUG=True\nSECRET_KEY=hardcoded_secret")
        
        audit = SecurityAudit(environment='production')
        issues = audit.validate_environment_security([str(env_file)], [])
        
        assert len(issues['critical']) > 0

Performance Optimizations:
- Large log files are processed line by line to avoid memory issues
- Docker log scanning is limited to last 1000 lines per container
- File scanning excludes common development directories
- Network requests have timeout limits to prevent hanging

Safety Considerations:
- Sensitive data in scan results is truncated to first 100 characters
- No sensitive data is written to disk unless explicitly requested
- Network requests use verify=False only for local development testing
- File permissions are checked but not modified
"""
