/**
 * This file provides sample PowerShell scripts for the PowerShell Tool
 * It's used to populate the tool with examples when first used
 */

const sampleScripts = [
  {
    name: "ServiceAccountStatus",
    content: `# Service Account Status Script
# This script checks the status of service accounts and services
param (
    [Parameter(Mandatory=$false)]
    [string[]]$ServiceNames = @("wuauserv", "spooler", "winrm"),
    
    [Parameter(Mandatory=$false)]
    [string]$ComputerName = "localhost",
    
    [Parameter(Mandatory=$false)]
    [switch]$ExportResults
)

Write-Host "Checking service status on $ComputerName..." -ForegroundColor Cyan

$results = @()

foreach ($service in $ServiceNames) {
    Write-Host "  Checking service: $service" -ForegroundColor Yellow
    
    try {
        $svc = Get-Service -Name $service -ComputerName $ComputerName -ErrorAction Stop
        $status = $svc.Status
        
        # Determine status color
        $statusColor = switch ($status) {
            "Running" { "Green" }
            "Stopped" { "Red" }
            default { "Yellow" }
        }
        
        Write-Host "    Status: $status" -ForegroundColor $statusColor
        
        # Get more details
        $startType = $svc.StartType
        $account = (Get-WmiObject -Class Win32_Service -Filter "Name='$service'" -ComputerName $ComputerName).StartName
        
        Write-Host "    Start Type: $startType" -ForegroundColor Gray
        Write-Host "    Account: $account" -ForegroundColor Gray
        
        $results += [PSCustomObject]@{
            ServiceName = $service
            Status = $status
            StartType = $startType
            Account = $account
        }
        
    } catch {
        Write-Error "Error checking service $service`: $_"
        
        $results += [PSCustomObject]@{
            ServiceName = $service
            Status = "Error"
            StartType = "Unknown"
            Account = "Unknown"
        }
    }
    
    Write-Host ""
}

# Display summary
Write-Host "Service Status Summary:" -ForegroundColor Cyan
$results | Format-Table -AutoSize

# Export results if requested
if ($ExportResults) {
    $exportPath = "ServiceStatus_$(Get-Date -Format 'yyyyMMdd_HHmmss').csv"
    Write-Host "Exporting results to $exportPath" -ForegroundColor Green
    $results | Export-Csv -Path $exportPath -NoTypeInformation
}

Write-Host "Service account check completed!" -ForegroundColor Green`,
    language: "powershell",
    tags: ["services", "monitoring", "system"]
  },
  {
    name: "SystemInfo",
    content: `# System Information Script
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

Write-Host "System information gathering completed!" -ForegroundColor Green`,
    language: "powershell",
    tags: ["system", "hardware", "information"]
  },
  {
    name: "BackupFiles",
    content: `# Backup Files Script
# This script creates backups of important files

param (
    [Parameter(Mandatory=$true)]
    [string]$SourcePath,
    
    [Parameter(Mandatory=$true)]
    [string]$DestinationPath,
    
    [Parameter(Mandatory=$false)]
    [string[]]$FileTypes = @("*.docx", "*.xlsx", "*.pdf", "*.txt"),
    
    [Parameter(Mandatory=$false)]
    [switch]$IncludeSubfolders,
    
    [Parameter(Mandatory=$false)]
    [switch]$Compress
)

# Display script information
Write-Host "Beginning file backup operation..." -ForegroundColor Cyan
Write-Host "Source: $SourcePath" -ForegroundColor Cyan  
Write-Host "Destination: $DestinationPath" -ForegroundColor Cyan
Write-Host "File Types: $($FileTypes -join ', ')" -ForegroundColor Cyan
Write-Host "Include Subfolders: $IncludeSubfolders" -ForegroundColor Cyan
Write-Host "Compress Backup: $Compress" -ForegroundColor Cyan

# Validate source path
if (-not (Test-Path -Path $SourcePath)) {
    Write-Error "Source path does not exist: $SourcePath"
    exit 1
}

# Create destination directory if it doesn't exist
if (-not (Test-Path -Path $DestinationPath)) {
    Write-Host "Creating destination directory: $Destination