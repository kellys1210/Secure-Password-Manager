# Cross-Environment Testing for Authentication Endpoints

This document explains how to run and validate the consistency of `/register` and `/login` endpoints across different environments:

1. Local development (pytest)
2. Docker containers
3. GitHub Actions CI

## Test Files

- `test_auth_cross_env.py` - Comprehensive tests for cross-environment compatibility
- `run_cross_env_tests.sh` - Script to run tests across all environments
- `.github/workflows/backend-ci.yml` - GitHub Actions workflow with test configuration

## Running Tests

### 1. Local Development Environment

```bash
# Run cross-environment tests
python -m pytest tests/test_auth_cross_env.py -v

# Or use the test runner script
./tests/run_cross_env_tests.sh
```

### 2. Docker Environment

```bash
# Run tests within Docker containers
docker-compose exec backend python -m pytest tests/test_auth_cross_env.py -v

# Or use the test commands from the task
docker-compose exec backend python -m pytest tests/ -v -k "test_register or test_login"
```

### 3. GitHub Actions CI

Tests automatically run in GitHub Actions when changes are pushed to the main branch or when pull requests are created.

## What the Tests Validate

### Import Path Consistency

- Verify that all import paths work correctly in all environments
- Ensure packaging structure is consistent
- Check that relative and absolute imports function properly

### Endpoint Behavior Consistency

- `/users/register` endpoint behaves identically across environments
- `/users/login` endpoint behaves identically across environments
- Error handling is consistent (same status codes and error messages)
- Security headers are applied consistently

### Environment Configuration

- Environment variables are properly set and accessible
- Database connections work in all environments
- File paths and volume mounts function correctly in Docker

## Test Categories

### Unit-Level Tests

- `TestAuthCrossEnvironment` - Core authentication endpoint tests
- `TestImportPathConsistency` - Import structure validation
- `TestDockerSpecificCompatibility` - Docker-specific validations

### Integration Tests

- `TestIntegrationCrossEnvironment` - Complete workflow tests

## Environment Variables

The tests expect these environment variables to be set:

```bash
FLASK_ENV=testing
DATABASE_URL=sqlite:///:memory:
```

These are automatically set by the test fixtures and runner script.

## Troubleshooting

### Import Errors

If you see import errors, ensure that:

1. The backend directory is in the Python path
2. All required packages are installed (`pip install -r backend/requirements.txt`)
3. The project structure matches the expected layout

### Docker Issues

If Docker tests fail:

1. Ensure Docker and Docker Compose are installed
2. Check that containers start properly (`docker-compose up -d`)
3. Verify volume mounts are working correctly

### Database Connection Issues

If database connections fail:

1. Check that `DATABASE_URL` environment variable is set
2. Ensure the database service is running (especially in Docker)
3. Verify that the database driver is installed (psycopg2 for PostgreSQL)

## Adding New Tests

When adding new cross-environment tests:

1. Add them to `test_auth_cross_env.py`
2. Use the existing fixtures for consistent environment setup
3. Ensure tests don't rely on environment-specific configurations
4. Test both success and error cases
5. Validate that response formats are consistent

## Continuous Integration

The GitHub Actions workflow in `.github/workflows/backend-ci.yml` automatically runs these tests with:

```yaml
env:
  PYTHONPATH: backend
  DATABASE_URL: "sqlite:///:memory:"
  SQLALCHEMY_DATABASE_URI: "sqlite:///:memory:"
run: |
  python -m pytest tests/ -v
```

This ensures that the same environment configuration used locally is also used in CI.
