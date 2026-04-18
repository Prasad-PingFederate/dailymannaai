Write-Host "Waiting for Azure Firewall to open..."
while($true) {
    python test_cosmos_write.py *>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Firewall is OPEN! Starting ETL..."
        Stop-Process -Name python -Force -ErrorAction SilentlyContinue
        Start-Process -FilePath "python" -ArgumentList "-u", "async_etl.py" -RedirectStandardOutput "live_migration_log.txt" -RedirectStandardError "live_migration_error.txt" -WindowStyle Hidden
        Write-Host "ETL process resumed in background."
        break
    }
    Write-Host "Still waiting (Next try in 30s)..."
    Start-Sleep -Seconds 30
}
