@echo off
REM unzip shim using tar (built-in Windows 10+)
setlocal enabledelayedexpansion

set "ZIPFILE="
set "DESTDIR=."

:parse
if "%~1"=="" goto done
set "ARG=%~1"

echo %ARG% | findstr /r "^-" >nul
if not errorlevel 1 (
    if /i "%ARG%"=="-d" (
        set "DESTDIR=%~2"
        shift
    )
    shift
    goto parse
)

if "!ZIPFILE!"=="" (
    set "ZIPFILE=%~1"
) else (
    set "DESTDIR=%~1"
)
shift
goto parse

:done
if "!ZIPFILE!"=="" (
    echo Usage: unzip [-qo] zipfile [-d destination]
    exit /b 1
)

if not exist "!DESTDIR!" mkdir "!DESTDIR!"
tar -xf "!ZIPFILE!" -C "!DESTDIR!"
exit /b %errorlevel%
