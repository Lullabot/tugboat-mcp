#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Header
echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}         Tugboat MCP Server Test Runner              ${NC}"
echo -e "${GREEN}====================================================${NC}"

# Check if the project is built
if [ ! -d "dist" ]; then
  echo -e "${YELLOW}Building project before running tests...${NC}"
  npm run build
fi

# Function to run tests
run_tests() {
  local test_command=$1
  local test_description=$2
  
  echo -e "\n${GREEN}>>> ${test_description}${NC}\n"
  
  # Run the tests
  $test_command
  
  # Check the exit code
  if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✓ ${test_description} completed successfully${NC}"
    return 0
  else
    echo -e "\n${RED}✗ ${test_description} failed${NC}"
    return 1
  fi
}

# Parse command line arguments
COVERAGE=0
WATCH=0
VERBOSE=0
SPECIFIC_TEST=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --coverage|-c)
      COVERAGE=1
      shift
      ;;
    --watch|-w)
      WATCH=1
      shift
      ;;
    --verbose|-v)
      VERBOSE=1
      shift
      ;;
    --test|-t)
      SPECIFIC_TEST="$2"
      shift
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Usage: ./run-tests.sh [--coverage|-c] [--watch|-w] [--verbose|-v] [--test|-t <test-file>]"
      exit 1
      ;;
  esac
done

# Set environment variables
if [ $VERBOSE -eq 1 ]; then
  export VERBOSE_TESTS=1
fi

# Determine the test command
TEST_CMD="npx jest"

if [ ! -z "$SPECIFIC_TEST" ]; then
  TEST_CMD="$TEST_CMD $SPECIFIC_TEST"
  run_tests "$TEST_CMD" "Running specific test: $SPECIFIC_TEST"
  exit $?
fi

if [ $WATCH -eq 1 ]; then
  run_tests "$TEST_CMD --watch" "Running tests in watch mode"
  exit $?
fi

if [ $COVERAGE -eq 1 ]; then
  run_tests "$TEST_CMD --coverage" "Running tests with coverage"
  exit $?
fi

# Default: run all tests normally
run_tests "$TEST_CMD" "Running all tests"
exit $? 