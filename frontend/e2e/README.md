# E2E Testing Documentation

This directory contains end-to-end (E2E) tests for the Secure Password Manager application using Playwright.

## Test Structure

- **`user-registration.spec.js`** - Tests for user registration flow
- **`user-login.spec.js`** - Tests for user login and authentication
- **`password-management.spec.js`** - Tests for password CRUD operations
- **`security-validation.spec.js`** - Tests for security features and validation
- **`test-data.js`** - Test data and helper functions

## Running Tests

### Prerequisites

- **Node.js 20.19.0 or higher** (required for Vite compatibility)
- Backend server running (for full-stack testing)
- Frontend development server running

### Quick Start

1. **Use the automated scripts** (recommended for new users):

   ```bash
   # Start the complete test environment
   ./scripts/start-test-environment.sh

   # In another terminal, run all E2E tests
   ./scripts/run-e2e-tests.sh
   ```

2. **Manual setup** (for advanced users):

   ```bash
   # Start backend
   cd backend && python -m flask run --port=5000

   # Start frontend (in another terminal)
   cd frontend && npm run dev

   # Run E2E tests (in another terminal)
   cd frontend && npm run test:e2e
   ```

### Available Scripts

#### Package.json Scripts

```bash
# Install dependencies and browsers
npm run test:e2e:install

# Run all E2E tests in headless mode
npm run test:e2e

# Run E2E tests with browser UI visible
npm run test:e2e:headed

# Run E2E tests in debug mode
npm run test:e2e:debug

# Run E2E tests with Playwright UI
npm run test:e2e:ui

# View test report
npm run test:e2e:report

# Check Node.js version compatibility
npm run check-node-version
```

#### Enhanced Scripts (scripts/ directory)

```bash
# Start complete test environment with health checks
./scripts/start-test-environment.sh

# Run E2E tests with performance monitoring and retry logic
./scripts/run-e2e-tests.sh

# Run specific test file
./scripts/run-e2e-tests.sh --file user-registration.spec.js

# Run tests on specific browser
./scripts/run-e2e-tests.sh --browser chromium

# Get help
./scripts/run-e2e-tests.sh --help
```

### Running Specific Tests

```bash
# Run specific test file
npx playwright test e2e/user-registration.spec.js

# Run tests with specific tag
npx playwright test --grep "registration"

# Run tests in specific browser
npx playwright test --project=chromium
```

## Test Environment Setup

### Local Development

1. Start the backend server:

   ```bash
   cd backend
   python -m flask run --port=5000
   ```

2. Start the frontend development server:

   ```bash
   cd frontend
   npm run dev
   ```

3. Run E2E tests:
   ```bash
   npm run test:e2e
   ```

### CI/CD Environment

Tests run automatically on:

- Push to main branch
- Pull requests to main branch
- Changes to frontend files or E2E test configuration

## Test Data Management

Test data is managed in `test-data.js` with:

- Predefined test users for different scenarios
- Password entry templates
- Helper functions for generating unique test data

### Test User Accounts

- **validUser**: For successful registration tests
- **existingUser**: For login and existing user tests
- **invalidUser**: For validation error tests

## Critical Path Test Scenarios

### 1. User Registration Flow

- ✅ Successful registration with valid data
- ✅ Validation errors for invalid data
- ✅ Prevention of duplicate username/email

### 2. User Login Flow

- ✅ Successful login with valid credentials
- ✅ Error handling for invalid credentials
- ✅ Authentication protection for routes
- ✅ Navigation between login and register

### 3. Password Management Flow

- ✅ Add new password entries
- ✅ View password details
- ✅ Edit existing entries
- ✅ Delete password entries
- ✅ Search and filter functionality
- ✅ Secure copy functionality
- ✅ Show/hide password securely

### 4. Security Validation

- ✅ Password masking in UI
- ✅ Secure copy functionality
- ✅ Session timeout behavior
- ✅ XSS attack prevention
- ✅ Secure password requirements
- ✅ Secure logout functionality
- ✅ CSRF protection

## Test Configuration

### Playwright Configuration (`playwright.config.js`)

- Base URL: `http://localhost:3000`
- Test directory: `./e2e`
- Browser support: Chromium, Firefox, WebKit
- Parallel execution in CI
- HTML reporter for test results

### Environment Variables

- `BASE_URL`: Application base URL (default: http://localhost:3000)
- `CI`: Set to true in CI environment for optimized settings

## Troubleshooting

### Common Issues

**Node.js Version Compatibility:**

```bash
# Check current Node.js version
node --version

# If version is below 20.19.0, upgrade using nvm:
nvm install 20.19.0
nvm use 20.19.0

# Or use the built-in check:
npm run check-node-version
```

**Tests failing with timeout errors:**

- Ensure both frontend and backend servers are running
- Use the automated script: `./scripts/start-test-environment.sh`
- Check that the application is accessible at the base URL
- Increase timeout in Playwright configuration if needed

**Browser installation issues:**

- Run `npx playwright install` to install browsers
- Use `npx playwright install --with-deps` for system dependencies
- On CI, browsers are automatically installed

**Test data conflicts:**

- Tests use unique timestamps to avoid conflicts
- Clean up test data between test runs if needed
- Test data is automatically generated with unique identifiers

**Performance Issues:**

- Check performance logs: `frontend/test-performance.log`
- Use the enhanced runner: `./scripts/run-e2e-tests.sh`
- Monitor test execution times across runs

### Debugging Tests

1. **Use debug mode:**

   ```bash
   npm run test:e2e:debug
   ```

2. **Use Playwright UI for visual debugging:**

   ```bash
   npm run test:e2e:ui
   ```

3. **Check test reports:**

   ```bash
   npm run test:e2e:report
   ```

4. **Run with enhanced debugging:**
   ```bash
   ./scripts/run-e2e-tests.sh --file user-registration.spec.js
   ```

## Performance Optimization

### Test Execution

- **Retry Logic**: Tests automatically retry up to 2 times on failure
- **Parallel Execution**: Tests run in parallel across browsers in CI
- **Performance Monitoring**: Execution times logged for trending analysis

### Environment Management

- **Health Checks**: Automated service readiness verification
- **Port Management**: Script checks for port conflicts before starting
- **Cleanup**: Automatic process cleanup on script termination

### Best Practices for Fast Tests

1. **Use stable selectors**: Prefer data-testid attributes over CSS classes
2. **Avoid unnecessary waits**: Use proper waiting strategies
3. **Isolate test data**: Each test should be independent
4. **Monitor performance**: Check performance logs regularly

## Team Onboarding Checklist

### Prerequisites

- [ ] Node.js 20.19.0+ installed
- [ ] Git repository cloned
- [ ] Backend dependencies installed (`pip install -r backend/requirements.txt`)

### Setup Steps

- [ ] Run `npm install` in frontend directory
- [ ] Install Playwright browsers: `npm run test:e2e:install`
- [ ] Verify Node.js version: `npm run check-node-version`
- [ ] Test environment: `./scripts/start-test-environment.sh`
- [ ] Run sample test: `./scripts/run-e2e-tests.sh --file user-registration.spec.js`

### Development Workflow

- [ ] Start test environment before running tests
- [ ] Use enhanced runner for better debugging
- [ ] Check performance logs for optimization opportunities
- [ ] Review test reports for failures

### CI/CD Integration

- [ ] Tests run automatically on push/PR to main
- [ ] Check GitHub Actions for test results
- [ ] Download artifacts for debugging failed tests

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on state from other tests
2. **Selectors**: Use data-testid attributes for stable element selection
3. **Assertions**: Verify both positive and negative scenarios
4. **Error Handling**: Test error conditions and edge cases
5. **Performance**: Avoid unnecessary waits, use proper waiting strategies

## CI/CD Integration

E2E tests run automatically in GitHub Actions:

- Frontend-only tests for quick feedback
- Full-stack tests with backend integration
- Test result artifacts uploaded for debugging
- Cross-browser testing matrix

## Contributing

When adding new E2E tests:

1. Follow the existing test structure and naming conventions
2. Add appropriate test data in `test-data.js`
3. Include both positive and negative test cases
4. Update this documentation if adding new test categories
5. Ensure tests pass in both local and CI environments
