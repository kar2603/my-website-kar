@echo off
chcp 65001 >nul
title KAR HOBBY CRM & Admin Server
echo ==================================================
echo   🚀 DANG KHOI CHAY SERVER ADMIN KAR HOBBY...
echo ==================================================
echo   Trang Admin: http://localhost:8000/admin
echo   Trang Landing: http://localhost:8000/
echo   Nhan Ctrl + C de dong server khi khong dung.
echo ==================================================
cd /d "%~dp0"
start http://localhost:8000/admin
python server.py
pause
