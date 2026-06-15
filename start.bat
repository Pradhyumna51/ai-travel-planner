@echo off
cd /d "%~dp0"
echo [Travel Planner] Starting servers...
echo.

echo Starting backend (port 5000)...
start "TravelPlanner-Backend" /D "backend" cmd /c "node src/server.js"

echo Starting frontend (port 5173)...
start "TravelPlanner-Frontend" /D "frontend" cmd /c "npx vite --host"

echo.
echo Servers starting...
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Close the two server windows, or run stop.bat to shut down.
