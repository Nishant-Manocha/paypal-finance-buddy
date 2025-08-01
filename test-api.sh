#!/bin/bash

echo "🧪 Testing Rural Loan Fraud Detector API"
echo "========================================="

API_BASE="http://localhost:5000/api"

# Function to make API calls
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo ""
    echo "Testing: $description"
    echo "Endpoint: $method $endpoint"
    echo "---"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$API_BASE$endpoint")
    else
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$API_BASE$endpoint")
    fi
    
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_CODE:/d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo "✅ Success (HTTP $http_code)"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo "❌ Failed (HTTP $http_code)"
        echo "$body"
    fi
}

# Check if backend is running
echo "📋 Checking if backend is running..."
if ! curl -s http://localhost:5000/api/health > /dev/null; then
    echo "❌ Backend is not running. Please start the backend first:"
    echo "   cd backend && npm run dev"
    exit 1
fi

echo "✅ Backend is running"

# Test health endpoint
test_endpoint "GET" "/health" "Health Check"

# Test authentication endpoints
test_endpoint "POST" "/auth/register" "User Registration" '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "phone": "+1234567890",
    "role": "APPLICANT"
}'

test_endpoint "POST" "/auth/login" "User Login" '{
    "email": "test@example.com",
    "password": "password123"
}'

# Test satellite endpoints
test_endpoint "GET" "/satellite/test" "Satellite Test Endpoint"

test_endpoint "POST" "/satellite/fetch-image" "Fetch Satellite Image" '{
    "latitude": 40.7128,
    "longitude": -74.0060
}'

# Test fraud detection statistics
test_endpoint "GET" "/fraud-detection/statistics" "Fraud Detection Statistics"

test_endpoint "GET" "/fraud-detection/applications" "List Applications"

# Test loans endpoint
test_endpoint "GET" "/loans" "List Loan Applications"

echo ""
echo "🎉 API testing complete!"
echo ""
echo "💡 To test file upload endpoints, use the React Native app or tools like Postman"
echo "📱 React Native app: npm start"
echo "🌐 Backend API: http://localhost:5000"