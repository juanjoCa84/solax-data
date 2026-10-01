
@echo off
setlocal EnableExtensions DisableDelayedExpansion

set "PROYECTO=C:\solax-server"
set "GIT=C:\Program Files\Git\cmd\git.exe"
set "LOG=C:\solax-server\git-push.log"
set "TOKENFILE=C:\solax-server\token-github.txt"

echo =============================================== >> "%LOG%"
echo Inicio: %date% %time% >> "%LOG%"
echo Usuario: %USERNAME% >> "%LOG%"

cd /d "%PROYECTO%"
echo Directorio: %CD% >> "%LOG%"

REM =====================================================
REM Configuracion necesaria porque la tarea corre como SYSTEM
REM =====================================================

"%GIT%" config --global --add safe.directory C:/solax-server
"%GIT%" config --global user.name "Juan Jose Campos"
"%GIT%" config --global user.email "jjcampos9@hotmail.com"

REM =====================================================
REM Comprobar que existe el token
REM =====================================================

if not exist "%TOKENFILE%" (
    echo ERROR: No existe %TOKENFILE% >> "%LOG%"
    exit /b 1
)

REM Leer token SIN escribirlo en el log
set /p GITHUB_TOKEN=<"%TOKENFILE%"

if not defined GITHUB_TOKEN (
    echo ERROR: El fichero del token esta vacio. >> "%LOG%"
    exit /b 1
)

REM =====================================================
REM Preparar cambios
REM =====================================================

"%GIT%" add data .gitignore subir-github.bat >> "%LOG%" 2>&1

"%GIT%" diff --cached --quiet

if %ERRORLEVEL% EQU 0 (
    echo No hay cambios nuevos para hacer commit. >> "%LOG%"
) else (
    "%GIT%" commit -m "Actualizacion automatica SolaX" >> "%LOG%" 2>&1

    if errorlevel 1 (
        echo ERROR realizando COMMIT. >> "%LOG%"
        set "GITHUB_TOKEN="
        exit /b 2
    )
)

REM =====================================================
REM PUSH usando el token
REM GIT_ASKPASS proporciona usuario/token a Git sin navegador
REM =====================================================

set "GIT_TERMINAL_PROMPT=0"
set "GCM_INTERACTIVE=Never"
set "GIT_ASKPASS=%PROYECTO%\github-askpass.bat"

"%GIT%" push origin main >> "%LOG%" 2>&1
set "PUSH_RESULT=%ERRORLEVEL%"

echo Resultado PUSH: %PUSH_RESULT% >> "%LOG%"
echo Fin: %date% %time% >> "%LOG%"

set "GITHUB_TOKEN="

exit /b %PUSH_RESULT%
