#!/bin/bash

# Test script with readable parameter names

show_help() {
  cat << EOF
Usage: ./test.sh [OPTIONS] [test_pattern]

Run Jest tests with optional pattern matching.

OPTIONS:
  -h, --help          Show this help message and exit

ARGUMENTS:
  test_pattern        Optional pattern to match test names (e.g., auth, apiClient)

EXAMPLES:
  ./test.sh                    # Run all tests
  ./test.sh auth              # Run auth-related tests
  ./test.sh apiClient         # Run API client tests
  ./test.sh sanitize          # Run sanitize tests
  ./test.sh csrf              # Run CSRF tests
  ./test.sh errorHandler      # Run error handler tests
  ./test.sh authRedirect      # Run auth redirect tests
  ./test.sh serverAuth        # Run server auth tests
  ./test.sh rateLimit         # Run rate limit tests

AVAILABLE TEST SUITES:
  - auth (lib/auth.ts)
  - apiClient (lib/apiClient.tsx)
  - sanitize (lib/sanitize.ts)
  - csrf (lib/csrf.ts)
  - errorHandler (lib/errorHandler.ts)
  - authRedirect (lib/authRedirect.ts)
  - serverAuth (lib/serverAuth.ts)
  - rateLimit (lib/rateLimit.ts)
EOF
}

# Check for help flag
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
  show_help
  exit 0
fi

TEST_PATTERN="${1:-}"

if [ -z "$TEST_PATTERN" ]; then
  echo "Running all tests..."
  npm test
else
  echo "Running tests matching pattern: $TEST_PATTERN"
  npm test -- --testNamePattern="$TEST_PATTERN" --verbose
fi