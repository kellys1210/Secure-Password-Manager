# E2E Tests for Secure Password Manager

Minimal end-to-end test implementation using Playwright to verify the critical user journey.

## Prerequisites

- Docker and Docker Compose
- Node.js (for running Playwright tests)
- Frontend running on http://localhost:3000
- Backend services running via Docker

## Setup Instructions

1. **Start Docker services:**

   ```bash
   docker-compose up -d
   ```

2. **Start frontend development server:**

   ```bash
   cd frontend
   npm run dev
   ```

3. **Run E2E tests:**
   ```bash
   npx playwright test
   ```

## Test Structure

- `auth.flow.spec.ts` - User authentication flow
- `password.flow.spec.ts` - Core password operations
- `support/` - Test utilities and helpers

## Test Commands

- Run all tests: `npx playwright test`
- Run specific test: `npx playwright test auth.flow.spec.ts`
- Run with UI: `npx playwright test --ui`
- Generate report: `npx playwright show-report`
