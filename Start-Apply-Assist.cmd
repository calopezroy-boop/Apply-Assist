@echo off
cd /d "%~dp0"
set "APPLY_NODE=node"
if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" set "APPLY_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
echo Apply Assist - open http://localhost:4185 in your browser.
echo Keep this window open while using the local app. Press Ctrl+C to stop.
"%APPLY_NODE%" --env-file-if-exists=.env server.mjs
echo.
echo If Node was not found, install Node.js 22 or newer, then run this file again.
pause
