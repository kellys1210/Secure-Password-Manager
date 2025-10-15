# Contributing to Secure Password Manager

Thank you for your interest in contributing to our Secure Password Manager! This document provides guidelines and instructions for contributing to the project.

## Development Workflow

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Clone your fork locally
git clone https://github.com/YOUR_USERNAME/Secure-Password-Manager.git
cd Secure-Password-Manager

# Add upstream remote
git remote add upstream https://github.com/kellys1210/Secure-Password-Manager.git
```

### 2. Branch Naming Convention

Use descriptive branch names following this pattern:

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

### 3. Development Setup

```bash
# Backend setup
cd backend
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install

# Run with Docker (recommended)
docker-compose up --build
```

### 4. Code Standards

#### Python (Backend)

- Use **Black** for code formatting (88 char line length)
- Follow PEP 8 conventions
- Use type hints where appropriate
- Write docstrings for all functions and classes

```bash
# Format code with Black
python -m black backend/

# Check formatting
python -m black --check backend/
```

#### JavaScript (Frontend)

- Use Prettier for formatting (when added)
- Follow ESLint rules
- Use meaningful variable names

### 5. Testing Requirements

#### Backend Testing

- Write unit tests for new functionality
- Ensure all tests pass before submitting PR
- Test authentication flows thoroughly
- Test error handling scenarios

```bash
# Run backend tests
cd backend
pytest tests/
```

#### Security Testing

- Test input validation
- Verify encryption/decryption
- Check authentication flows
- Test session management

### 6. Commit Guidelines

Use conventional commit messages:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or modifying tests
- `chore:` Maintenance tasks

Example:

```
feat: add user registration endpoint

- Implement user registration with email validation
- Add password strength requirements
- Include comprehensive error handling
```

### 7. Pull Request Process

1. **Create Feature Branch** from `main`
2. **Implement Changes** following code standards
3. **Write Tests** for new functionality
4. **Update Documentation** if needed
5. **Run Tests** locally
6. **Submit PR** using the template
7. **Address Review Comments**
8. **Squash Commits** if requested

### 8. PR Review Checklist

Before submitting a PR, ensure:

- [ ] Code follows project standards
- [ ] Tests are written and passing
- [ ] Documentation is updated
- [ ] Security considerations addressed
- [ ] No sensitive data exposed
- [ ] Error handling implemented
- [ ] Code is properly formatted

### 9. Security Guidelines

#### Critical Security Requirements

- Never commit secrets or credentials
- Validate all user inputs
- Use proper encryption for sensitive data
- Implement secure session management
- Follow OWASP security principles

#### Security Testing

- Test for SQL injection vulnerabilities
- Verify proper authentication
- Check authorization boundaries
- Test data encryption at rest and in transit

### 10. Getting Help

- Check existing documentation first
- Search existing issues
- Ask in team communication channels
- Request code review from team members

## Project Structure

```
Secure-Password-Manager/
├── backend/           # Flask API
│   ├── app/          # Application code
│   ├── tests/        # Backend tests
│   └── requirements.txt
├── frontend/         # React application
├── tests/            # Integration tests
├── .github/          # GitHub workflows and templates
└── docs/             # Project documentation
```

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help fellow contributors
- Follow security best practices

Thank you for contributing to making our password manager more secure and user-friendly!
