
# dump-project.ps1
# EARPMS source-code dump utility

param(
    [string]$OutputFile = "project_dump.txt"
)

$excludeDirs = @(
    "node_modules",
    ".git",
    "__pycache__",
    ".vscode",
    "dist",
    "build",
    ".next",
    ".venv",
    "env",
    "venv",
    ".idea",
    ".vs",
    "bin",
    "obj",
    ".pytest_cache",
    ".mypy_cache",
    ".cache",
    "coverage",
    "htmlcov"
)

$excludeExtensions = @(
    ".pyc",
    ".pyo",
    ".so",
    ".dll",
    ".exe",
    ".msi",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".ico",
    ".bmp",
    ".webp",
    ".pdf",
    ".zip",
    ".tar",
    ".gz",
    ".7z",
    ".rar",
    ".mp4",
    ".mp3",
    ".wav",
    ".avi",
    ".mov",
    ".webm",
    ".psd",
    ".ai",
    ".eps",
    ".ttf",
    ".otf",
    ".woff",
    ".woff2",
    ".eot"
)

$excludeFiles = @(
    ".env",
    ".env.local",
    ".env.development",
    ".env.development.local",
    ".env.production",
    ".env.production.local",
    ".env.test",
    ".env.test.local",
    "project_dump.txt",
    "project_dump.md",
    "project_dump.json",
    "credentials.json",
    "secrets.json",
    "id_rsa",
    "id_rsa.pub"
)

$maxSizeBytes = 1MB

$projectRoot = (Get-Location).Path

$outputFullPath = [System.IO.Path]::GetFullPath(
    (Join-Path $projectRoot $OutputFile)
)

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " EARPMS PROJECT SOURCE DUMP" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Project root: $projectRoot" -ForegroundColor Gray
Write-Host ""

Write-Host "Scanning project..." -ForegroundColor Cyan

$files = @(
    Get-ChildItem -Path $projectRoot -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object {

        $file = $_
        $path = $file.FullName
        $exclude = $false

        if ($path -eq $outputFullPath) {
            $exclude = $true
        }

        if (-not $exclude) {
            foreach ($dir in $excludeDirs) {
                $escapedDir = [regex]::Escape($dir)

                if ($path -match "(^|\\)$escapedDir(\\|$)") {
                    $exclude = $true
                    break
                }
            }
        }

        if (-not $exclude -and ($excludeFiles -contains $file.Name)) {
            $exclude = $true
        }

        if (-not $exclude) {
            $extension = $file.Extension.ToLowerInvariant()

            if ($excludeExtensions -contains $extension) {
                $exclude = $true
            }
        }

        if (-not $exclude -and $file.Length -gt $maxSizeBytes) {
            Write-Host "Skipping large file: $($file.Name) ($([math]::Round($file.Length / 1KB, 1)) KB)" -ForegroundColor Yellow
            $exclude = $true
        }

        -not $exclude
    } |
    Sort-Object FullName
)

Write-Host ""
Write-Host "Files selected: $($files.Count)" -ForegroundColor Green
Write-Host ""

$header = @"
============================================================
EARPMS PROJECT SOURCE DUMP
============================================================
Generated : $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Project   : $projectRoot
Files     : $($files.Count)

Excluded:
- Dependencies
- Virtual environments
- Build/cache directories
- Binary/media files
- Environment/secret files
- Files larger than 1 MB
- This dump file itself

============================================================

"@

Set-Content -Path $OutputFile -Value $header -Encoding utf8

$count = 0
$skipped = 0

foreach ($file in $files) {

    $count++

    if ($files.Count -gt 0) {
        $percent = [math]::Round(($count / $files.Count) * 100, 0)
    }
    else {
        $percent = 100
    }

    $relativePath = $file.FullName.Substring(
        $projectRoot.Length
    ).TrimStart('\')

    Write-Progress `
        -Activity "Building project dump" `
        -Status $relativePath `
        -PercentComplete $percent

    try {

        $content = Get-Content `
            -Path $file.FullName `
            -Raw `
            -Encoding utf8 `
            -ErrorAction Stop

    }
    catch {

        $skipped++

        Write-Host "Skipping unreadable file: $relativePath" -ForegroundColor Yellow

        continue
    }

    Add-Content `
        -Path $OutputFile `
        -Value "`r`n`r`n================================================================================`r`nFILE: $relativePath`r`n================================================================================`r`n" `
        -Encoding utf8

    Add-Content `
        -Path $OutputFile `
        -Value $content `
        -Encoding utf8
}

Write-Progress -Activity "Building project dump" -Completed

$outputItem = Get-Item -Path $OutputFile -ErrorAction SilentlyContinue

if ($null -ne $outputItem) {
    $outputSize = [math]::Round($outputItem.Length / 1KB, 1)
}
else {
    $outputSize = 0
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host " DUMP COMPLETE" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Output file   : $OutputFile" -ForegroundColor White
Write-Host "Files selected: $($files.Count)" -ForegroundColor White
Write-Host "Files read    : $count" -ForegroundColor White
Write-Host "Files skipped : $skipped" -ForegroundColor Yellow
Write-Host "Dump size     : $outputSize KB" -ForegroundColor White
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
