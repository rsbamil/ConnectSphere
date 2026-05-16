param (
    [string]$Token = "",
    [string]$HostUrl = "http://localhost:9000"
)

$ErrorActionPreference = "Stop"

# Check if server is reachable
Write-Host "Checking if SonarQube serve6*+r at $HostUrl is reachable..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri $HostUrl -Method Head -ErrorAction SilentlyContinue -TimeoutSec 5
    Write-Host "Successfully connected to SonarQube server." -ForegroundColor Green
} catch {
    Write-Host "Error: Could not connect to SonarQube server at $HostUrl." -ForegroundColor Red
    Write-Host "Please ensure your SonarQube server is running." -ForegroundColor Yellow
    exit 1
}

if (-not $Token -and $env:SONAR_TOKEN) {
    $Token = $env:SONAR_TOKEN
}

Write-Host "--- Starting SonarQube Analysis for ConnectSphere ---" -ForegroundColor Cyan

# 1. Backend Analysis (.NET)
Write-Host "`n[1/2] Analyzing Backend (.NET)..." -ForegroundColor Magenta
$beginArgs = @("/k:ConnectSphere-Backend", "/d:sonar.host.url=$HostUrl")
if ($Token) { $beginArgs += "/d:sonar.login=$Token" }

dotnet-sonarscanner begin @beginArgs

dotnet build src/ConnectSphere.Auth.sln /p:Analyze=true

$endArgs = @()
if ($Token) { $endArgs += "/d:sonar.login=$Token" }
dotnet-sonarscanner end @endArgs

# 2. Frontend Analysis (React)
Write-Host "`n[2/2] Analyzing Frontend (React)..." -ForegroundColor Magenta
$sonarScannerArgs = @(
    "-Dsonar.projectKey=ConnectSphere-Frontend",
    "-Dsonar.sources=frontend/src",
    "-Dsonar.host.url=$HostUrl"
)
if ($Token) { $sonarScannerArgs += "-Dsonar.login=$Token" }

& sonar-scanner @sonarScannerArgs

Write-Host "`n--- Analysis Complete! ---" -ForegroundColor Green
Write-Host "Check your results at: $HostUrl" -ForegroundColor Cyan
