
param(
    [switch]$NoInstall
)
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Backend = Join-Path $Root 'backend'
$Frontend = Join-Path $Root 'frontend'

Write-Host ''
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ' EARPMS - ONE TERMINAL DEV LAUNCHER' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan

if (-not (Test-Path (Join-Path $Backend 'requirements.txt'))) { throw "Backend not found: $Backend" }
if (-not (Test-Path (Join-Path $Frontend 'package.json'))) { throw "Frontend not found: $Frontend" }

$env:PYTHONPATH = $Backend
$env:FLASK_APP = 'wsgi:app'
$env:FLASK_ENV = 'development'
$env:DEMO_MODE = 'true'
$env:SEED_ON_STARTUP = 'true' # Seeds Quick Access users only when the durable DB is genuinely empty.
$env:AUTO_CREATE_DB = 'true'
# Durable development database lives outside versioned application folders.
# This makes user-created schools, pupils, exams, marks and report cards survive
# application updates, re-extraction and relaunches.
$DataRoot = Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'EARPMS'
New-Item -ItemType Directory -Force -Path $DataRoot | Out-Null
$StableDb = Join-Path $DataRoot 'earpms_dev.db'

# One-time migration from an existing release-folder database.
if (-not (Test-Path $StableDb)) {
    $Candidates = @()
    $CurrentDb = Join-Path $Backend 'earpms_dev.db'
    if (Test-Path $CurrentDb) { $Candidates += Get-Item $CurrentDb }
    $Parent = Split-Path -Parent $Root
    if (Test-Path $Parent) {
        $Candidates += Get-ChildItem -Path $Parent -Directory -ErrorAction SilentlyContinue |
            Where-Object { $_.FullName -ne $Root -and $_.Name -match 'earpms' } |
            ForEach-Object {
                $candidate = Join-Path $_.FullName 'backend\earpms_dev.db'
                if (Test-Path $candidate) { Get-Item $candidate }
            }
    }
    $SourceDb = $Candidates | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($null -ne $SourceDb) {
        Copy-Item -LiteralPath $SourceDb.FullName -Destination $StableDb -Force
        Write-Host "Migrated existing EARPMS database to durable storage: $StableDb" -ForegroundColor Green
    }
}
$env:DATABASE_URL = 'sqlite:///' + $StableDb
$env:CORS_ORIGINS = 'http://127.0.0.1:5173,http://localhost:5173'
# Stable development-only secrets (>=32 bytes) prevent PyJWT HMAC key warnings and keep sessions valid across launcher restarts.
if ([string]::IsNullOrWhiteSpace($env:SECRET_KEY) -or $env:SECRET_KEY.Length -lt 32) { $env:SECRET_KEY = 'earpms-local-dev-secret-2026-change-in-production-64x' }
if ([string]::IsNullOrWhiteSpace($env:JWT_SECRET_KEY) -or $env:JWT_SECRET_KEY.Length -lt 32) { $env:JWT_SECRET_KEY = 'earpms-local-jwt-secret-2026-change-in-production-64x' }

if (-not $NoInstall) {
    Write-Host 'Checking Python dependencies...' -ForegroundColor Yellow
    python -c "import flask, flask_sqlalchemy, flask_jwt_extended" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host 'Installing backend dependencies...' -ForegroundColor Yellow
        python -m pip install -r (Join-Path $Backend 'requirements.txt')
        if ($LASTEXITCODE -ne 0) { throw 'Backend dependency installation failed.' }
    }
    Write-Host 'Checking frontend dependencies...' -ForegroundColor Yellow
    if ((-not (Test-Path (Join-Path $Frontend 'node_modules\.bin\vite.cmd'))) -or (-not (Test-Path (Join-Path $Frontend 'node_modules\qrcode\package.json')))) {
        Push-Location $Frontend
        npm install
        $npmCode=$LASTEXITCODE
        Pop-Location
        if ($npmCode -ne 0) { throw 'Frontend dependency installation failed.' }
    }
}

$backendProc = $null
$frontendProc = $null
try {
    Write-Host ''
    Write-Host 'Starting Flask API on http://127.0.0.1:5000 ...' -ForegroundColor Green
    $backendProc = Start-Process -FilePath 'python' -ArgumentList '-m','flask','--app','wsgi:app','run','--host','127.0.0.1','--port','5000' -WorkingDirectory $Backend -NoNewWindow -PassThru
    Start-Sleep -Seconds 2

    Write-Host 'Starting React/Vite on http://127.0.0.1:5173 ...' -ForegroundColor Green
    $frontendProc = Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev','--','--host','127.0.0.1','--port','5173' -WorkingDirectory $Frontend -NoNewWindow -PassThru

    Write-Host ''
    Write-Host 'EARPMS is running.' -ForegroundColor Cyan
    Write-Host 'Open: http://127.0.0.1:5173' -ForegroundColor White
    Write-Host 'API:  http://127.0.0.1:5000/api/health' -ForegroundColor White
    Write-Host ''
    Write-Host 'Quick Access / Demo Mode is ENABLED.' -ForegroundColor Yellow
    Write-Host 'Press Ctrl+C to stop both servers.' -ForegroundColor Yellow
    Write-Host ''

    while ($true) {
        if ($backendProc.HasExited) { Write-Host 'Flask stopped.' -ForegroundColor Red; break }
        if ($frontendProc.HasExited) { Write-Host 'Vite stopped.' -ForegroundColor Red; break }
        Start-Sleep -Seconds 1
    }
}
finally {
    foreach ($p in @($frontendProc,$backendProc)) {
        if ($null -ne $p -and -not $p.HasExited) {
            try { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue } catch {}
        }
    }
    Write-Host 'EARPMS servers stopped.' -ForegroundColor Yellow
}
