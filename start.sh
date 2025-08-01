#!/bin/bash

echo "🛰️ Starting Rural Loan Fraud Detector"
echo "======================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm and try again."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Starting MongoDB..."
    if command_exists mongod; then
        mongod --fork --logpath /var/log/mongodb.log
    else
        echo "❌ MongoDB is not installed. Please install MongoDB and try again."
        exit 1
    fi
fi

echo "✅ MongoDB is running"

# Setup backend
echo ""
echo "🔧 Setting up backend..."
cd backend

if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env with your API keys before proceeding"
fi

if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

if [ ! -d "uploads" ]; then
    echo "📁 Creating uploads directory..."
    mkdir -p uploads/documents uploads/satellite uploads/processed
fi

echo "✅ Backend setup complete"

# Start backend in background
echo ""
echo "🚀 Starting backend server..."
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend is running
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo "✅ Backend is running on http://localhost:5000"
else
    echo "❌ Backend failed to start. Check logs for errors."
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Setup React Native app
echo ""
echo "📱 Setting up React Native app..."
cd ..

if [ ! -d "node_modules" ]; then
    echo "📦 Installing React Native dependencies..."
    npm install
fi

echo "✅ React Native setup complete"

# Start React Native app
echo ""
echo "🚀 Starting React Native development server..."
echo "📱 Scan the QR code with Expo Go app to run on your device"
echo ""
echo "🌐 Backend API: http://localhost:5000"
echo "📊 Health Check: http://localhost:5000/api/health"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

npm start

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set trap to cleanup on exit
trap cleanup SIGINT SIGTERM