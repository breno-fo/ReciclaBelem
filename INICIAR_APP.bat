@echo off
title ReciclaBelem - Servidor Local
echo ===================================================
echo   Iniciando ReciclaBelem (Mapa + Dashboard Admin)
echo ===================================================
where node >nul 2>nul
if %errorlevel%==0 (
    start "" "http://localhost:3000"
    node server.js
) else (
    echo Node.js nao encontrado. Abrindo index.html diretamente no navegador...
    start "" "index.html"
)
