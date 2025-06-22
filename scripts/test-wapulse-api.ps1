# WaPulse API Test Script
# This script helps test the WaPulse API directly to debug connection issues

param(
    [Parameter(Mandatory = $true)]
    [string]$Token,
    
    [Parameter(Mandatory = $true)]
    [string]$InstanceID,
    
    [Parameter(Mandatory = $false)]
    [string]$Action = "status"
)

Write-Host "🔍 Testing WaPulse API Connection..." -ForegroundColor Cyan
Write-Host "Token: $($Token.Substring(0,8))..." -ForegroundColor Gray
Write-Host "Instance ID: $InstanceID" -ForegroundColor Gray
Write-Host "Action: $Action" -ForegroundColor Gray
Write-Host ""

# API endpoints
$endpoints = @{
    "status" = "https://wapulse.com/api/getInstanceStatus"
    "start"  = "https://wapulse.com/api/startInstance"
    "stop"   = "https://wapulse.com/api/stopInstance"
    "qr"     = "https://wapulse.com/api/getQrCode"
}

if (-not $endpoints.ContainsKey($Action)) {
    Write-Host "❌ Invalid action. Valid actions: status, start, stop, qr" -ForegroundColor Red
    exit 1
}

$endpoint = $endpoints[$Action]
Write-Host "📡 Endpoint: $endpoint" -ForegroundColor Yellow

# Prepare request body
$body = @{
    token      = $Token
    instanceID = $InstanceID
} | ConvertTo-Json

Write-Host "📤 Request Body:" -ForegroundColor Yellow
Write-Host $body -ForegroundColor Gray
Write-Host ""

try {
    Write-Host "⏳ Sending request..." -ForegroundColor Yellow
    
    # Set up the request
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    # Make the API call with timeout
    $response = Invoke-RestMethod -Uri $endpoint -Method POST -Body $body -Headers $headers -TimeoutSec 30
    
    Write-Host "✅ Request successful!" -ForegroundColor Green
    Write-Host "📥 Response:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 5) -ForegroundColor White
    
}
catch {
    Write-Host "❌ Request failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        $statusDescription = $_.Exception.Response.StatusDescription
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
        Write-Host "Status Description: $statusDescription" -ForegroundColor Red
        
        # Try to read the response body
        try {
            $responseStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($responseStream)
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response Body: $responseBody" -ForegroundColor Red
        }
        catch {
            Write-Host "Could not read response body" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "🔧 Troubleshooting Tips:" -ForegroundColor Cyan
Write-Host "1. Verify your WaPulse token is active and valid" -ForegroundColor White
Write-Host "2. Check if your WaPulse account has sufficient credits" -ForegroundColor White
Write-Host "3. Ensure the instance ID exists in your WaPulse dashboard" -ForegroundColor White
Write-Host "4. Try creating a new instance if this one is corrupted" -ForegroundColor White
Write-Host "5. Check WaPulse service status at their website" -ForegroundColor White 