#!/bin/bash

# Test script with readable parameter names
# Usage: ./test.sh [test_pattern]
# Examples:
#   ./test.sh                    # Run all tests
#   ./test.sh auth              # Run auth-related tests
#   ./test.sh apiClient         # Run API client tests
#   ./test.sh sanitize          # Run sanitize tests
#   ./test.sh csrf              # Run CSRF tests
#   ./test.sh errorHandler      # Run error handler tests
#   ./test.sh authRedirect      # Run auth redirect tests
#   ./test.sh serverAuth        # Run server auth tests
#   ./test.sh rateLimit         # Run rate limit tests

TEST_PATTERN="${1:-}"

if [ -z "$TEST_PATTERN" ]; then
  echo "Running all tests..."
  npm test
else
  echo "Running tests matching pattern: $TEST_PATTERN"
  npm test -- --testNamePattern="$TEST_PATTERN" --verbose
fi