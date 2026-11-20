@echo off
echo ===================================================
echo   Starting Hotel Digital Menu System (Local Dev)
echo ===================================================
echo.

echo [1/3] Starting FastAPI Backend on http://localhost:8000 ...
start "Hotel Backend (FastAPI)" cmd /k "cd /d %~dp0backend && .\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo [2/3] Starting Admin Panel on http://localhost:3001 ...
start "Hotel Admin Panel (Next.js)" cmd /k "cd /d %~dp0Adminpanel && npm run dev"

timeout /t 2 /nobreak >nul

echo [3/3] Starting Customer Menu Frontend on http://localhost:3000 ...
start "Customer Menu Frontend (Next.js)" cmd /k "cd /d %~dp0Fontend && npm run dev"

echo.
echo ===================================================
echo   All 3 services launched!
echo.
echo   Customer Menu:  http://localhost:3000
echo   Admin Panel:    http://localhost:3001
echo   Backend API:    http://localhost:8000
echo   API Swagger:    http://localhost:8000/docs
echo ===================================================
pause
