@echo off
echo ===================================================
echo   Iniciando Gerenciador de Telas no Docker...
echo ===================================================

docker compose up -d --build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERRO] Falha ao iniciar com o Docker.
    echo Certifique-se de que o Docker Desktop esta aberto e em execucao.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ===================================================
echo   Servico iniciado com sucesso no Docker!
echo   Painel Admin: http://localhost:3000/
echo   Player:       http://localhost:3000/player
echo ===================================================
pause
