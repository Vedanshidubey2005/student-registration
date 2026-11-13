
$ErrorActionPreference = "Stop"

# Get the project root (parent of the scripts folder)
$projectRoot = Split-Path -Parent $PSScriptRoot

# Deployment locations
$deployRoot = "C:\student-registration-deploy"

# Build artifact locations
$frontendSource = Join-Path $projectRoot "frontend\dist"
$backendSource = Join-Path $projectRoot "CMS_AIIMS\target\CMS_AIIMS-0.0.1-SNAPSHOT.jar"

$frontendDestination = Join-Path $deployRoot "frontend"
$backendDestination = Join-Path $deployRoot "backend"

# Create deployment folders if necessary
New-Item -ItemType Directory -Force -Path $frontendDestination | Out-Null
New-Item -ItemType Directory -Force -Path $backendDestination | Out-Null

# Confirm that both build artifacts exist
if (!(Test-Path $frontendSource)) {
    throw "Frontend build folder not found: $frontendSource"
}

if (!(Test-Path $backendSource)) {
    throw "Backend JAR not found: $backendSource"
}

# Stop the existing application processes using the deployment ports
foreach ($port in @(4173, 8080)) {
    $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue

    foreach ($connection in $connections) {
        $processId = $connection.OwningProcess

        if ($processId -and $processId -ne $PID) {
            Write-Host "Stopping process $processId on port $port"
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        }
    }
}

Start-Sleep -Seconds 3

# Copy the latest frontend build
Write-Host "Deploying frontend..."
Get-ChildItem $frontendDestination -Force |
    Remove-Item -Recurse -Force

Copy-Item -Path "$frontendSource\*" -Destination $frontendDestination -Recurse -Force

# Replace the old backend JAR
Write-Host "Deploying backend..."
Get-ChildItem $backendDestination -Filter "*.jar" -ErrorAction SilentlyContinue |
    Remove-Item -Force

Copy-Item -Path $backendSource -Destination $backendDestination -Force

# Prepare log files
$logs = Join-Path $deployRoot "logs"
New-Item -ItemType Directory -Force -Path $logs | Out-Null

# Start the Spring Boot backend
Write-Host "Starting backend..."

Start-Process -FilePath "java" `
    -ArgumentList "-jar CMS_AIIMS-0.0.1-SNAPSHOT.jar" `
    -WorkingDirectory $backendDestination `
    -RedirectStandardOutput "$logs\backend.log" `
    -RedirectStandardError "$logs\backend-error.log" `
    -WindowStyle Hidden

# Start the React frontend
Write-Host "Starting frontend..."

$frontendCommand = "npx.cmd --yes serve -s `"$frontendDestination`" -l 4173"

Start-Process -FilePath $env:ComSpec `
    -ArgumentList "/c $frontendCommand" `
    -WorkingDirectory $deployRoot `
    -RedirectStandardOutput "$logs\frontend.log" `
    -RedirectStandardError "$logs\frontend-error.log" `
    -WindowStyle Hidden

Write-Host "Deployment processes started."
Write-Host "Frontend: http://localhost:4173"
Write-Host "Backend: http://localhost:8080"
