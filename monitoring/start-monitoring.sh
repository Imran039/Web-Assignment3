#!/bin/bash

echo "🚀 Starting EventSpark Monitoring Stack..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if backend is running
echo "🔍 Checking if EventSpark backend is running..."
if ! curl -s http://localhost:8080/api/health > /dev/null; then
    echo "⚠️  Warning: EventSpark backend is not running on port 8080"
    echo "   Please start the backend first: cd Backend && npm run dev"
    echo "   Continuing with monitoring setup..."
fi

# Start the monitoring stack
echo "📊 Starting Prometheus, Grafana, and Node Exporter..."
docker-compose up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check service status
echo "🔍 Checking service status..."
docker-compose ps

# Check if services are accessible
echo "🌐 Checking service accessibility..."

# Check Prometheus
if curl -s http://localhost:9090 > /dev/null; then
    echo "✅ Prometheus is running at http://localhost:9090"
else
    echo "❌ Prometheus is not accessible"
fi

# Check Grafana
if curl -s http://localhost:3001 > /dev/null; then
    echo "✅ Grafana is running at http://localhost:3001"
    echo "   Username: admin"
    echo "   Password: admin123"
else
    echo "❌ Grafana is not accessible"
fi

# Check Node Exporter
if curl -s http://localhost:9100/metrics > /dev/null; then
    echo "✅ Node Exporter is running at http://localhost:9100"
else
    echo "❌ Node Exporter is not accessible"
fi

echo ""
echo "🎉 Monitoring stack is ready!"
echo ""
echo "📊 Access your monitoring tools:"
echo "   Grafana Dashboard: http://localhost:3001"
echo "   Prometheus: http://localhost:9090"
echo "   Node Exporter: http://localhost:9100/metrics"
echo ""
echo "📋 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart services: docker-compose restart"
echo "" 