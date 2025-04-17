# Event Log Analyzer Script
# This script analyzes Windows event logs

param (
    [Parameter(Mandatory=$false)]
    [string]$ComputerName = "localhost",
    
    [Parameter(Mandatory=$false)]
    [string]$LogName = "System",
    
    [Parameter(Mandatory=$false)]
    [int]$Hours = 24,
    
    [Parameter(Mandatory=$false)]
    [int[]]$EventIds,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("Information", "Warning", "Error", "Critical")]
    [string[]]$Levels = @("Error", "Critical"),
    
    [Parameter(Mandatory=$false)]
    [string]$OutputPath
)

# Display script information
Write-Host "Event Log Analyzer" -ForegroundColor Cyan
Write-Host "Computer: $ComputerName" -ForegroundColor Cyan
Write-Host "Log: $LogName" -ForegroundColor Cyan
Write-Host "Timeframe: Past $Hours hours" -ForegroundColor Cyan
if ($EventIds) {
    Write-Host "Event IDs: $($EventIds -join ', ')" -ForegroundColor Cyan
}
Write-Host "Event Levels: $($Levels -join ', ')" -ForegroundColor Cyan

# Calculate time range
$startTime = (Get-Date).AddHours(-$Hours)
Write-Host "Retrieving events since $startTime..." -ForegroundColor Yellow

# Build the filter
$filterHashtable = @{
    LogName = $LogName
    StartTime = $startTime
}

# Add optional filters
if ($EventIds) {
    $filterHashtable.Add("ID", $EventIds)
}

# Map level names to their corresponding values
$levelMap = @{
    "Information" = 4
    "Warning" = 3
    "Error" = 2
    "Critical" = 1
}

$levelValues = $Levels | ForEach-Object { $levelMap[$_] }
if ($levelValues) {
    $filterHashtable.Add("Level", $levelValues)
}

# Retrieve events
try {
    Write-Host "Retrieving events..." -ForegroundColor Yellow
    $events = Get-WinEvent -FilterHashtable $filterHashtable -ComputerName $ComputerName -ErrorAction Stop
    
    # Count events by level
    $eventSummary = $events | Group-Object -Property LevelDisplayName | 
        Select-Object @{Name="Level"; Expression={$_.Name}}, Count
    
    # Count events by source
    $sourceSummary = $events | Group-Object -Property ProviderName | 
        Sort-Object -Property Count -Descending | Select-Object Name, Count -First 10
    
    # Display summary
    Write-Host "Found $($events.Count) events matching the criteria" -ForegroundColor Green
    
    Write-Host "`nEvents by Level:" -ForegroundColor Cyan
    $eventSummary | Format-Table -AutoSize
    
    Write-Host "`nTop Event Sources:" -ForegroundColor Cyan
    $sourceSummary | Format-Table -AutoSize
    
    # Display most recent events
    Write-Host "`nMost Recent Events:" -ForegroundColor Cyan
    $events | Select-Object TimeCreated, LevelDisplayName, ProviderName, Id, Message -First 10 | Format-Table -Wrap
    
    # Export to file if specified
    if ($OutputPath) {
        Write-Host "Exporting events to $OutputPath..." -ForegroundColor Yellow
        $events | Export-Csv -Path $OutputPath -NoTypeInformation
        Write-Host "Export completed." -ForegroundColor Green
    }
    
} catch {
    Write-Error "Error retrieving events: $_"
    exit 1
}

Write-Host "Event log analysis completed!" -ForegroundColor Green
