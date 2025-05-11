@echo off
echo ====================================
echo Firebase Setup for Beat.it Music App
echo ====================================
echo Step 1: Installing dependencies...
npm install

echo.
echo Step 2: Creating Firebase directory structure...
mkdir backend\firebase 2>nul

echo.
echo Step 3: Running Firebase connection test...
node backend\testFirebase.js

if %ERRORLEVEL% EQU 0 (
  echo.
  echo ====================================
  echo Firebase setup completed successfully!
  echo ====================================
  echo.
  echo Next steps:
  echo To start the application:
  echo    npm run dev
) else (
  echo.
  echo ====================================
  echo Firebase setup encountered some issues.
  echo ====================================
  echo.
  echo Please follow the instructions above to resolve any Firebase configuration issues.

  echo After fixing the issues, run this setup script again.
)

echo.
pause 