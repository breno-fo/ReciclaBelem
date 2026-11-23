@echo off
title ReciclaBelem - Servidor Local
echo ===================================================
echo   Iniciando ReciclaBelem (Mapa + Dashboard Admin)
echo ===================================================
where node >nul 2>nul
if %errorlevel%==0 (
    start "" "http://localhost:3000"
    node server.js
    goto :eof
)

where python >nul 2>nul
if %errorlevel%==0 (
    echo Node.js nao encontrado. Iniciando servidor local via Python na porta 3000...
    start "" "http://localhost:3000"
    python -m http.server 3000
    goto :eof
)

where py >nul 2>nul
if %errorlevel%==0 (
    echo Node.js nao encontrado. Iniciando servidor local via Python ^(py^) na porta 3000...
    start "" "http://localhost:3000"
    py -m http.server 3000
    goto :eof
)

echo Node.js e Python nao encontrados. Abrindo index.html diretamente no navegador...
start "" "index.html"
