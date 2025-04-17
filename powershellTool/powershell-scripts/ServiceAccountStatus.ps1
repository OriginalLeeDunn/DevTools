# Service Account Status Script
# This script checks the status of specified service accounts
param (
    [Parameter(Mandatory=$true)]
    [string]$AccountList,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputPath = "C:\Temp\ServiceAccountStatus.log",
    
    [Parameter(Mandatory=$false)]
    [switch]$SendEmail
)

# Display script information
Write-Host "Running Service Account Status Check..." -ForegroundColor Cyan
Write-Host "Using account list: $AccountList" -ForegroundColor Cyan
Write-Host "Output path: $OutputPath" -ForegroundColor Cyan

# Initialize results array
$results = @()

# Read account list
Write-Host "Reading account list from $AccountList..." -ForegroundColor Yellow
if (Test-Path $AccountList) {
    $accounts = Get-Content $AccountList
    Write-Host "Found $($accounts.Count) accounts to check" -ForegroundColor Green
} else {
    Write-Error "Account list file not found: $AccountList"
    exit 1
}

# Process each account
foreach ($account in $accounts) {
    Write-Host "Checking status for account: $account" -ForegroundColor Yellow
    
    # Retrieve account details
    try {
        $accountObj = Get-ADUser -Identity $account -Properties LastLogonDate, AccountExpirationDate, Enabled -ErrorAction Stop
        
        # Determine status
        $status = if ($accountObj.Enabled) { "Active" } else { "Disabled" }
        
        # Check if account is expired
        if ($accountObj.AccountExpirationDate -and $accountObj.AccountExpirationDate -lt (Get-Date)) {
            $status = "Expired"
        }
        
        # Calculate days until expiration
        $daysUntilExpiration = if ($accountObj.AccountExpirationDate) {
            [math]::Max(0, (New-TimeSpan -Start (Get-Date) -End $accountObj.AccountExpirationDate).Days)
        } else {
            $null
        }
        
        # Add to results
        $results += [PSCustomObject]@{
            AccountName = $account
            Status = $status
            LastLogin = $accountObj.LastLogonDate
            DaysUntilExpiration = $daysUntilExpiration
        }
    }
    catch {
        Write-Warning "Failed to retrieve information for account: $account - $_"
        # Add to results with error status
        $results += [PSCustomObject]@{
            AccountName = $account
            Status = "Error"
            LastLogin = $null
            DaysUntilExpiration = $null
            Error = $_.Exception.Message
        }
    }
}

# Output results
Write-Host "Results:" -ForegroundColor Cyan
$results | Format-Table -AutoSize

# Save results to output file
Write-Host "Saving results to $OutputPath..." -ForegroundColor Yellow
$results | Export-Csv -Path $OutputPath -NoTypeInformation
Write-Host "Results saved successfully!" -ForegroundColor Green

# Send email if requested
if ($SendEmail) {
    Write-Host "Sending email notification..." -ForegroundColor Yellow
    
    # Email parameters
    $emailParams = @{
        SmtpServer = "smtp.company.com"
        From = "powershell@company.com"
        To = "admin@company.com"
        Subject = "Service Account Status Report - $(Get-Date -Format 'yyyy-MM-dd')"
        Body = "Please find attached the service account status report."
        Attachments = $OutputPath
    }
    
    try {
        Send-MailMessage @emailParams -ErrorAction Stop
        Write-Host "Email sent successfully!" -ForegroundColor Green
    }
    catch {
        Write-Error "Failed to send email: $_"
    }
}

Write-Host "Service Account Status check completed!" -ForegroundColor Green