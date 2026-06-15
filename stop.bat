@echo off
cd /d "%~dp0"
echo [Travel Planner] Stopping servers...

taskkill /f /fi "WindowTitle eq TravelPlanner-Backend" >nul 2>&1
echo Checking port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000 " ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1 && echo Backend process killed.
)

taskkill /f /fi "WindowTitle eq TravelPlanner-Frontend" >nul 2>&1
echo Checking port 5173...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173 " ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1 && echo Frontend process killed.
)

echo Done.
