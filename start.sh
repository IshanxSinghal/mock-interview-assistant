#!/bin/bash

# Mock Interview Assistant - Quick Start Script
echo "🚀 Starting Mock Interview Assistant..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "Creating .env file..."
    echo "GROQ_API_KEY=your_groq_api_key_here" > .env
    echo "✅ .env file created. Please add your GROQ API key before running."
    exit 1
fi

# Activate virtual environment
if [ -d "venv" ]; then
    echo "📦 Activating virtual environment..."
    source venv/bin/activate
else
    echo "⚠️  Virtual environment not found. Creating one..."
    python3 -m venv venv
    source venv/bin/activate
    echo "📥 Installing backend dependencies..."
    pip install -r requirements.txt
fi

# Start backend server in background
echo "🔧 Starting Flask backend server..."
python server.py &
BACKEND_PID=$!
echo "✅ Backend running on http://localhost:5000 (PID: $BACKEND_PID)"

# Wait for backend to start
sleep 3

# Start frontend
echo ""
echo "🎨 Starting React frontend..."
cd mock-interview-assistant
npm install
npm start

# Cleanup on exit
trap "echo '🛑 Shutting down...'; kill $BACKEND_PID; exit" INT TERM EXIT
