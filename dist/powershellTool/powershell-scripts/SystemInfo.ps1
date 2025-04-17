# System Information Script
# This script gathers basic system information
param (
    [Parameter(Mandatory=$false)]
    [string]$ComputerName = "localhost",
    
    [Parameter(Mandatory=$false)]
    [string]$OutputPath = "SystemInfo.txt"
)

# Display script information
Write-Host "Gathering system information for $ComputerName..." -ForegroundColor Cyan

# Gather basic system information
Write-Host "Collecting hardware information..." -ForegroundColor Yellow
$computerSystem = Get-ComputerInfo

# Display system information
Write-Host "System Information:" -ForegroundColor Cyan
Write-Host "Computer Name: $($computerSystem.CsName)"
Write-Host "Manufacturer: $($computerSystem.CsManufacturer)"
Write-Host "Model: $($computerSystem.CsModel)"
Write-Host "Operating System: $($computerSystem.WindowsProductName)"
Write-Host "OS Version: $($computerSystem.OsVersion)"
Write-Host "Architecture: $($computerSystem.OsArchitecture)"
Write-Host "Total Memory: $([math]::Round($computerSystem.CsTotalPhysicalMemory / 1GB, 2)) GB"

# Export information to file
Write-Host "Saving information to $OutputPath..." -ForegroundColor Yellow
$computerSystem | Out-File -FilePath $OutputPath

Write-Host "System information gathering completed!" -ForegroundColor Green
