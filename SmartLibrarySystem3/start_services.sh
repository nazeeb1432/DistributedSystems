#!/bin/bash

# start_services.sh
# This script stops any running local services and starts Docker containers

echo "Stopping local nginx service..."
sudo systemctl stop nginx

echo "Stopping any running containers..."
docker compose down

echo "Building Docker images..."
docker compose build

echo "Starting all services..."
docker compose up -d

# Wait for services to start
echo "Waiting for services to start..."
sleep 5

# Check if services are running
echo "Checking service status..."
if docker ps | grep -q 'library'; then
  echo "✅ All services are up and running!"
  echo "🌐 Access your API at: http://localhost:3000"
  echo "📊 Check service logs with: docker compose logs -f [service-name]"
else
  echo "❌ Some services failed to start."
  echo "📝 Check logs with: docker compose logs"
fi

echo "📋 Running containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"