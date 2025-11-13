
#!/bin/bash

# Test runner script for BISHL App
# Usage: ./test.sh [flag]

case "$1" in
  -a|--api)
    echo "Running API Client tests..."
    npm test -- __tests__/lib/apiClient.test.ts
    ;;
  -auth|--auth)
    echo "Running Auth tests..."
    npm test -- __tests__/lib/auth.test.ts
    ;;
  -s|--sanitize)
    echo "Running Sanitize tests..."
    npm test -- __tests__/lib/sanitize.test.ts
    ;;
  -csrf|--csrf)
    echo "Running CSRF tests..."
    npm test -- __tests__/lib/csrf.test.ts
    ;;
  -error|--error-handler)
    echo "Running Error Handler tests..."
    npm test -- __tests__/lib/errorHandler.test.ts
    ;;
  -redirect|--auth-redirect)
    echo "Running Auth Redirect tests..."
    npm test -- __tests__/lib/authRedirect.test.ts
    ;;
  -all|--all)
    echo "Running all tests..."
    npm test
    ;;
  -w|--watch)
    echo "Running tests in watch mode..."
    npm test -- --watch
    ;;
  -c|--coverage)
    echo "Running tests with coverage..."
    npm test -- --coverage
    ;;
  -h|--help|*)
    echo "BISHL App Test Runner"
    echo ""
    echo "Usage: ./test.sh [flag]"
    echo ""
    echo "Available flags:"
    echo "  -a,     --api             Run API Client tests"
    echo "  -auth,  --auth            Run Auth tests"
    echo "  -s,     --sanitize        Run Sanitize tests"
    echo "  -csrf,  --csrf            Run CSRF tests"
    echo "  -error, --error-handler   Run Error Handler tests"
    echo "  -redirect, --auth-redirect Run Auth Redirect tests"
    echo "  -all,   --all             Run all tests"
    echo "  -w,     --watch           Run tests in watch mode"
    echo "  -c,     --coverage        Run tests with coverage report"
    echo "  -h,     --help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./test.sh -a              # Run API client tests"
    echo "  ./test.sh --auth          # Run auth tests"
    echo "  ./test.sh -csrf           # Run CSRF tests"
    echo "  ./test.sh --error-handler # Run error handler tests"
    echo "  ./test.sh -w              # Run tests in watch mode"
    ;;
esac
