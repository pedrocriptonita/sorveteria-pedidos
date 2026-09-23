@echo off
:: ─────────────────────────────────────────────────────────────────────────────
:: DevoraFood — Agente de Impressão ESC/POS
:: Este script inicia o agente. Execute como Administrador para registrar
:: como serviço do Windows (usando nssm ou Task Scheduler).
:: ─────────────────────────────────────────────────────────────────────────────

cd /d "%~dp0"

echo Iniciando agente de impressao DevoraFood...
node agent.js

pause
