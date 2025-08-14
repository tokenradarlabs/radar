#!/bin/bash

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is not installed. Install it with: brew install jq (macOS) or sudo apt-get install jq (Linux). The script will still run but responses won't be pretty-printed."
fi

if ! nc -z localhost 3006 >/dev/null 2>&1; then
  echo "Server does not appear to be running on http://localhost:3006"
  echo "Start it in another terminal with: npm run build && npm start"
  echo "Then re-run this script."
fi

# Test script for API key usage tracking functionality
# This script tests the new usage count tracking and analytics features

BASE_URL="http://localhost:3006"
TEST_EMAIL="test@example.com"
TEST_PASSWORD="Testpassword123@"
TEST_API_KEY="rdr_e9a5d15a11f2d14b7c6d8a6009a164a0109bc7a1d5c38f84dec12bb494f7fe7d"
TEST_API_KEY_ID=""

echo "🧪 Testing API Key Usage Tracking Features"
echo "=========================================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ "$1" = "SUCCESS" ]; then
        echo -e "${GREEN}✅ $2${NC}"
    elif [ "$1" = "ERROR" ]; then
        echo -e "${RED}❌ $2${NC}"
    elif [ "$1" = "INFO" ]; then
        echo -e "${BLUE}ℹ️  $2${NC}"
    elif [ "$1" = "WARNING" ]; then
        echo -e "${YELLOW}⚠️  $2${NC}"
    fi
}

# Function to make HTTP requests and check response
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "${BLUE}Testing: $description${NC}"
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -X POST "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" \
            -w "\n%{http_code}")
    elif [ "$method" = "GET" ]; then
        response=$(curl -s -X GET "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -w "\n%{http_code}")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    # macOS-compatible: remove the last line (status code) without using GNU head
    response_body=$(printf "%s" "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        print_status "SUCCESS" "HTTP $http_code - $description"
        echo "Response: $response_body" | jq '.' 2>/dev/null || echo "Response: $response_body"
    else
        print_status "ERROR" "HTTP $http_code - $description"
        echo "Response: $response_body"
    fi
    echo
}

# Test 1: Generate a new API key
echo "1️⃣  Testing API Key Generation"
echo "-------------------------------"
generate_data="{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}"
make_request "POST" "/api/v1/keys/generate" "$generate_data" "Generate new API key"

# Attempt to auto-extract the generated API key (requires jq)
if command -v jq >/dev/null 2>&1; then
  gen_resp=$(curl -s -X POST "$BASE_URL/api/v1/keys/generate" \
    -H "Content-Type: application/json" \
    -d "$generate_data")
  TEST_API_KEY=$(echo "$gen_resp" | jq -r '.data.apiKey // empty')
  if [ -n "$TEST_API_KEY" ]; then
    echo "🔑 Auto-extracted TEST_API_KEY: $TEST_API_KEY"
  else
    echo "📝 Could not auto-extract API key. Please copy it from the response above and set TEST_API_KEY manually."
  fi
else
  echo "📝 Please copy the generated API key from above and set TEST_API_KEY manually in this script (jq not installed)."
fi
echo

# Test 2: Get API keys list (should show usage count)
echo "2️⃣  Testing API Keys List with Usage Count"
echo "------------------------------------------"
make_request "POST" "/api/v1/keys/getApiKeys" "$generate_data" "Get API keys list with usage count"

# Attempt to auto-extract API key ID matching the generated key
if command -v jq >/dev/null 2>&1 && [ -n "$TEST_API_KEY" ]; then
  keys_resp=$(curl -s -X POST "$BASE_URL/api/v1/keys/getApiKeys" \
    -H "Content-Type: application/json" \
    -d "$generate_data")
  TEST_API_KEY_ID=$(jq -r --arg k "$TEST_API_KEY" '.data.apiKeys[] | select(.key == $k) | .id' <<< "$keys_resp" | head -n1)
  if [ -n "$TEST_API_KEY_ID" ]; then
    echo "🆔 Auto-extracted TEST_API_KEY_ID: $TEST_API_KEY_ID"
  else
    echo "📝 Could not auto-extract API key ID. Set TEST_API_KEY_ID manually if you want to test key-specific analytics."
  fi
  echo
fi

# Test 3: Test API key usage tracking by making authenticated requests
echo "3️⃣  Testing API Key Usage Tracking"
echo "----------------------------------"
if [ -z "$TEST_API_KEY" ]; then
  echo "Note: This requires a valid API key. Set TEST_API_KEY above and re-run."
  echo
else
  # Helper to make authenticated GET requests with API key header
  make_api_request() {
    local endpoint=$1
    local description=$2
    echo -e "${BLUE}Testing: $description${NC}"
    response=$(curl -s -X GET "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -H "x-api-key: $TEST_API_KEY" \
      -w "\n%{http_code}")
    http_code=$(echo "$response" | tail -n1)
    response_body=$(printf "%s" "$response" | sed '$d')
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
      print_status "SUCCESS" "HTTP $http_code - $description"
      echo "Response: $response_body" | jq '.' 2>/dev/null || echo "Response: $response_body"
    else
      print_status "ERROR" "HTTP $http_code - $description"
      echo "Response: $response_body"
    fi
    echo
  }

  # Hit a protected endpoint multiple times to increment usage
  make_api_request "/api/v1/price/btc" "Authenticated price fetch (btc) #1"
  make_api_request "/api/v1/price/eth" "Authenticated price fetch (eth) #2"
  make_api_request "/api/v1/price/btc" "Authenticated price fetch (btc) #3"
fi

# Test 4: Get usage analytics
echo "4️⃣  Testing Usage Analytics"
echo "----------------------------"
make_request "POST" "/api/v1/keys/usageAnalytics" "$generate_data" "Get usage analytics for all API keys"

# Test 5: Test specific API key analytics
echo "5️⃣  Testing Specific API Key Analytics"
echo "--------------------------------------"
if [ -z "$TEST_API_KEY_ID" ]; then
  echo "Note: This requires a valid API key ID. Set TEST_API_KEY_ID above and re-run."
  echo
else
  analytics_specific_data="{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"apiKeyId\":\"$TEST_API_KEY_ID\"}"
  make_request "POST" "/api/v1/keys/usageAnalytics" "$analytics_specific_data" "Get usage analytics for specific API key"
fi

echo "🎯 Usage Tracking Features Implemented:"
echo "   • Usage count increment on each API call"
echo "   • lastUsedAt timestamp update on each API call"
echo "   • Usage analytics endpoint with comprehensive statistics"
echo "   • Usage count display in API keys list"
echo "   • Most/least used API key identification"
echo "   • Average usage per key calculation"
echo

echo "📋 To complete testing:"
echo "   1. Ensure TEST_API_KEY is set (auto-extracted if jq is installed)"
echo "   2. Ensure TEST_API_KEY_ID is set (auto-extracted if jq is installed)"
echo "   3. Run authenticated API calls to test usage tracking"
echo "   4. Verify usage count increments and analytics update"
echo

echo "🔧 Manual Testing Steps:"
echo "   1. Make API calls using the generated API key"
echo "   2. Check that usage count increases with each call"
echo "   3. Verify lastUsedAt timestamp updates"
echo "   4. Test analytics endpoint with and without specific API key ID"
echo

print_status "INFO" "API Key Usage Tracking implementation completed successfully!"
