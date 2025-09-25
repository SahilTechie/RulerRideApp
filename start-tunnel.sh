#!/bin/bash

# Start ngrok tunnel for RulerRide backend
echo "🚀 Starting ngrok tunnel for RulerRide backend..."
echo "🔗 This will create a public URL for your localhost:3001 server"
echo ""

# Start ngrok and capture the output
ngrok http 3001 --log=stdout