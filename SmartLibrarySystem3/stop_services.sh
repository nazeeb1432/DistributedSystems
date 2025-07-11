#!/bin/bash

# stop_services.sh
# This script stops all Docker containers

echo "Stopping local nginx service..."
sudo systemctl stop nginx

echo "Stopping all Docker containers..."
docker compose down

# Wait for services to stop
echo "Waiting for services to stop..."
sleep 3

# Check if services are stopped
echo "Checking service status..."
if ! docker ps | grep -q 'library'; then
  echo "✅ All services are stopped successfully."
else
  echo "❌ Some services are still running."
  echo "📝 Check with: docker ps"
fi

echo "🧹 To remove everything including volumes, run:"
echo "   docker compose down -v"
echo "🔧 To remove unused images, run:"
echo "   docker system prune"