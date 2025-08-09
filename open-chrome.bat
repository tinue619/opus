@echo off
start chrome.exe --disable-web-security --user-data-dir="%TEMP%\chrome_dev" "file:///%~dp0index.html"
