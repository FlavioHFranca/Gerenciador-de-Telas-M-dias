@echo off
:: Script para liberar a porta 3000 no Firewall do Windows
echo ========================================================
echo   Liberando a porta 3000 para acesso via Celular / TV
echo ========================================================

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo [AVISO] Este script precisa ser executado como Administrador!
    echo Clique com o botao direito neste arquivo e escolha:
    echo "Executar como Administrador"
    echo.
    pause
    exit /b 1
)

netsh advfirewall firewall add rule name="ZappSignage (Porta 3000)" dir=in action=allow protocol=TCP localport=3000

echo.
echo ========================================================
echo Porta 3000 liberada com sucesso no Firewall do Windows!
echo Agora qualquer dispositivo na mesma rede Wi-Fi podera acessar.
echo ========================================================
pause
