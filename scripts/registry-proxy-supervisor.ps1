# Restarts the registry proxy whenever it exits (fresh undici pool).
while ($true) {
  node "C:\Users\Lenovo\Documents\Default Project\scripts\registry-proxy.js"
  Start-Sleep -Milliseconds 250
}