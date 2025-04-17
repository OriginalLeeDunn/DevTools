# Backup Files Script
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
    Write-Host "Creating destination directory: $DestinationPath" -ForegroundColor Yellow
    New-Item -Path $DestinationPath -ItemType Directory -Force | Out-Null
}

# Create timestamp for backup folder
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFolder = Join-Path -Path $DestinationPath -ChildPath "Backup_$timestamp"
New-Item -Path $backupFolder -ItemType Directory -Force | Out-Null

Write-Host "Created backup folder: $backupFolder" -ForegroundColor Green

# Set recursion parameters
$recurse = if ($IncludeSubfolders) { $true } else { $false }

# Copy files
$totalFiles = 0
$totalSize = 0

foreach ($fileType in $FileTypes) {
    Write-Host "Copying $fileType files..." -ForegroundColor Yellow
    $files = Get-ChildItem -Path $SourcePath -Filter $fileType -Recurse:$recurse -File
    
    foreach ($file in $files) {
        $destFile = Join-Path -Path $backupFolder -ChildPath $file.Name
        
        # Handle duplicate filenames by appending a counter
        $counter = 1
        while (Test-Path -Path $destFile) {
            $destFile = Join-Path -Path $backupFolder -ChildPath ("{0}_{1}{2}" -f $file.BaseName, $counter, $file.Extension)
            $counter++
        }
        
        Copy-Item -Path $file.FullName -Destination $destFile
        $totalFiles++
        $totalSize += $file.Length
        
        if ($totalFiles % 10 -eq 0) {
            Write-Host "Copied $totalFiles files so far..." -ForegroundColor Yellow
        }
    }
}

# Compress the backup if requested
if ($Compress) {
    Write-Host "Compressing backup..." -ForegroundColor Yellow
    $zipPath = "$backupFolder.zip"
    Compress-Archive -Path $backupFolder -DestinationPath $zipPath
    
    if (Test-Path -Path $zipPath) {
        Write-Host "Created compressed backup: $zipPath" -ForegroundColor Green
        
        # Remove the uncompressed folder to save space
        Remove-Item -Path $backupFolder -Recurse -Force
        Write-Host "Removed uncompressed backup folder." -ForegroundColor Yellow
    } else {
        Write-Error "Failed to create compressed backup."
    }
}

# Display backup summary
Write-Host "Backup completed successfully!" -ForegroundColor Green
Write-Host "Total files backed up: $totalFiles" -ForegroundColor Cyan
Write-Host "Total size: $([math]::Round($totalSize / 1MB, 2)) MB" -ForegroundColor Cyan
Write-Host "Backup location: $(if ($Compress) { $zipPath } else { $backupFolder })" -ForegroundColor Cyan
