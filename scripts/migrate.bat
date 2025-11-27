@echo off
REM Migration Runner Script for Windows
REM Runs all PostgreSQL migrations in order
REM Usage: migrate.bat [up|down|reset]

setlocal enabledelayedexpansion

SET MIGRATIONS_DIR=%~dp0..\database\migrations
SET DB_HOST=%POSTGRES_HOST%
SET DB_PORT=%POSTGRES_PORT%
SET DB_NAME=%POSTGRES_DB%
SET DB_USER=%POSTGRES_USER%
SET PGPASSWORD=%POSTGRES_PASSWORD%

if "%DB_HOST%"=="" SET DB_HOST=localhost
if "%DB_PORT%"=="" SET DB_PORT=5432
if "%DB_NAME%"=="" SET DB_NAME=flexoraa
if "%DB_USER%"=="" SET DB_USER=postgres

echo ============================================
echo Migration Runner - Flexoraa Backend
echo Database: %DB_NAME% @ %DB_HOST%:%DB_PORT%
echo ============================================
echo.

SET ACTION=%1
if "%ACTION%"=="" SET ACTION=up

if "%ACTION%"=="up" goto migrate_up
if "%ACTION%"=="down" goto migrate_down
if "%ACTION%"=="reset" goto migrate_reset

echo Invalid command: %ACTION%
echo Usage: migrate.bat [up^|down^|reset]
exit /b 1

:migrate_up
echo Running migrations UP...
echo.

for %%f in ("%MIGRATIONS_DIR%\*.sql") do (
    echo Running migration: %%~nxf
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "%%f"
    if errorlevel 1 (
        echo ERROR: Migration %%~nxf failed
        exit /b 1
    )
    echo Done: %%~nxf
    echo.
)

echo All migrations completed successfully!
goto end

:migrate_down
echo WARNING: This will DROP all tables!
set /p CONFIRM="Are you sure? (yes/no): "
if not "%CONFIRM%"=="yes" (
    echo Aborted
    exit /b 0
)

echo Running migrations DOWN (dropping all tables)...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "DROP TABLE IF EXISTS chat_memory CASCADE; DROP TABLE IF EXISTS assignment_queue CASCADE; DROP TABLE IF EXISTS webhook_raw CASCADE; DROP TABLE IF EXISTS lead_audit CASCADE; DROP TABLE IF EXISTS consent_log CASCADE; DROP TABLE IF EXISTS leads CASCADE; DROP TABLE IF EXISTS campaigns CASCADE; DROP TABLE IF EXISTS users CASCADE;"

echo All tables dropped
goto end

:migrate_reset
echo Resetting database (DOWN + UP)...
call :migrate_down
call :migrate_up
goto end

:end
endlocal
exit /b 0
