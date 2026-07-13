# Run this script AS ADMINISTRATOR (right-click PowerShell -> Run as administrator)
# Fixes: "failed to download remote update" on Android Expo Go

Write-Host "Adding firewall rules for Campus Hub..." -ForegroundColor Cyan

netsh advfirewall firewall delete rule name="CampusHub Expo 8081" 2>$null
netsh advfirewall firewall delete rule name="CampusHub API 5000" 2>$null

netsh advfirewall firewall add rule name="CampusHub Expo 8081" dir=in action=allow protocol=TCP localport=8081 profile=private
netsh advfirewall firewall add rule name="CampusHub API 5000" dir=in action=allow protocol=TCP localport=5000 profile=private

Write-Host ""
Write-Host "Done! Also make sure your Wi-Fi network is set to PRIVATE (not Public):" -ForegroundColor Green
Write-Host "  Settings -> Network -> Wi-Fi -> your network -> Private network"
Write-Host ""
Write-Host "Test on phone Chrome: http://192.168.100.4:8081" -ForegroundColor Yellow
Write-Host "If that page loads, Expo Go will work with: exp://192.168.100.4:8081"
Write-Host ""
pause
