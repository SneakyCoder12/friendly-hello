@echo off
cd /d "%~dp0"
echo Starting Vite dev server (live reload)...
echo.
echo Open in browser: http://localhost:5173
echo Press Ctrl+C to stop.
echo.
npx vite
pause
