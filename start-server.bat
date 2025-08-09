@echo off
echo Запуск локального веб-сервера для конфигуратора шкафов...
echo.

cd /d "%~dp0"

echo Проверяем доступность Python...
python --version >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo Python найден. Запускаем сервер на порту 8000...
    echo.
    echo Откройте в браузере: http://localhost:8000
    echo Для остановки нажмите Ctrl+C
    echo.
    python -m http.server 8000
) else (
    echo Python не найден!
    echo.
    echo Установите Python с официального сайта: https://python.org
    echo Или используйте другой веб-сервер.
    echo.
    pause
)
