@echo off
echo 🚀 Starting EventSpark Monitoring Stack...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker first.
    pause
    exit /b 1
)

REM Check if backend is running
echo 🔍 Checking if EventSpark backend is running...
curl -s http://localhost:8080/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Warning: EventSpark backend is not running on port 8080
    echo    Please start the backend first: cd Backend ^&^& npm run dev
    echo    Continuing with monitoring setup...
)

REM Start the monitoring stack
echo 📊 Starting Prometheus, Grafana, and Node Exporter...
docker-compose up -d

REM Wait for services to start
echo ⏳ Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Check service status
echo 🔍 Checking service status...
docker-compose ps

REM Check if services are accessible
echo 🌐 Checking service accessibility...

REM Check Prometheus
curl -s http://localhost:9090 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Prometheus is running at http://localhost:9090
) else (
    echo ❌ Prometheus is not accessible
)

REM Check Grafana
curl -s http://localhost:3001 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Grafana is running at http://localhost:3001
    echo    Username: admin
    echo    Password: admin123
) else (
    echo ❌ Grafana is not accessible
)

REM Check Node Exporter
curl -s http://localhost:9100/metrics >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Node Exporter is running at http://localhost:9100
) else (
    echo ❌ Node Exporter is not accessible
)

echo.
echo 🎉 Monitoring stack is ready!
echo.
echo 📊 Access your monitoring tools:
echo    Grafana Dashboard: http://localhost:3001
echo    Prometheus: http://localhost:9090
echo    Node Exporter: http://localhost:9100/metrics
echo.
echo 📋 Useful commands:
echo    View logs: docker-compose logs -f
echo    Stop services: docker-compose down
echo    Restart services: docker-compose restart
echo.
pause 