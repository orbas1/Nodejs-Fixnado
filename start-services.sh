#!/bin/bash
set -e

# Fixnado Platform - Service Startup Script
# This script starts all services for local development

echo "========================================="
echo "Starting Fixnado Platform Services"
echo "========================================="
echo ""

# Check if PostgreSQL is running
if ! sudo service postgresql status > /dev/null 2>&1; then
    echo "Starting PostgreSQL..."
    sudo service postgresql start
    sleep 2
fi

echo "✓ PostgreSQL is running"
echo ""

# Check database connection
if PGPASSWORD=fixnado_dev_password_1234567890 psql -h localhost -U fixnado_service -d fixnado -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✓ Database connection successful"
else
    echo "✗ Database connection failed"
    echo "Please ensure PostgreSQL is properly configured"
    exit 1
fi
echo ""

# Start Backend
echo "Starting Backend API on port 4000..."
cd /workspace/backend-nodejs
npm run dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "✓ Backend started (PID: $BACKEND_PID)"
echo "  - Logs: /tmp/backend.log"
echo "  - URL: http://localhost:4000"
echo ""

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:4000/health > /dev/null 2>&1; then
        echo "✓ Backend is ready"
        break
    fi
    sleep 1
done
echo ""

# Start Frontend
echo "Starting Frontend on port 3000..."
cd /workspace/frontend-reactjs
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✓ Frontend started (PID: $FRONTEND_PID)"
echo "  - Logs: /tmp/frontend.log"
echo "  - URL: http://localhost:3000"
echo ""

echo "========================================="
echo "All services started successfully!"
echo "========================================="
echo ""
echo "Service URLs:"
echo "  - Frontend:  http://localhost:3000"
echo "  - Backend:   http://localhost:4000"
echo "  - Database:  postgresql://localhost:5432/fixnado"
echo ""
echo "Process IDs:"
echo "  - Backend:   $BACKEND_PID"
echo "  - Frontend:  $FRONTEND_PID"
echo ""
echo "To stop services:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "To view logs:"
echo "  tail -f /tmp/backend.log"
echo "  tail -f /tmp/frontend.log"
echo ""
