@echo off
cd /d "%~dp0"
echo Starting server at http://localhost:8080
echo.
echo Open in browser:
echo   Main site:  http://localhost:8080/code.html
echo   Ajman only: http://localhost:8080/generator-ajman.html
echo.
echo Press Ctrl+C to stop the server.
echo.
python -m http.server 8080
pause
