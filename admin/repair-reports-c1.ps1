$ErrorActionPreference = "Stop"

$utf8WithoutBom =
  New-Object System.Text.UTF8Encoding $false

function Replace-ExactText {
  param(
    [Parameter(Mandatory)]
    [string]$Path,

    [Parameter(Mandatory)]
    [string]$OldText,

    [Parameter(Mandatory)]
    [string]$NewText,

    [Parameter(Mandatory)]
    [string]$Description
  )

  $absolutePath =
    (Resolve-Path -LiteralPath $Path).Path

  $content =
    [System.IO.File]::ReadAllText(
      $absolutePath
    )

  if ($content.Contains($NewText)) {
    Write-Host "$Description already repaired."
    return
  }

  if (-not $content.Contains($OldText)) {
    throw "Repair anchor not found: $Description"
  }

  $updated =
    $content.Replace(
      $OldText,
      $NewText
    )

  [System.IO.File]::WriteAllText(
    $absolutePath,
    $updated,
    $utf8WithoutBom
  )

  Write-Host "$Description repaired." -ForegroundColor Green
}

Replace-ExactText `
  -Path "src\features\reports\reports-api.validation.ts" `
  -OldText @"
  return value as
    AdminReportsListResponse;
"@ `
  -NewText @"
  return value as unknown as
    AdminReportsListResponse;
"@ `
  -Description "Reports list validated cast"

Replace-ExactText `
  -Path "src\features\reports\reports-api.validation.ts" `
  -OldText @"
  return value as
    AdminReportDetails;
"@ `
  -NewText @"
  return value as unknown as
    AdminReportDetails;
"@ `
  -Description "Report details validated cast"

Replace-ExactText `
  -Path "src\features\reports\use-reports.ts" `
  -OldText @"
  useEffect(
    () => {
      void load(
        "initial"
      );

      return () => {
        requestIdRef.current +=
          1;
      };
    },
    [
      load,
    ]
  );
"@ `
  -NewText @"
  useEffect(
    () => {
      const timeoutId =
        window.setTimeout(
          () => {
            void load(
              "initial"
            );
          },
          0
        );

      return () => {
        window.clearTimeout(
          timeoutId
        );

        requestIdRef.current +=
          1;
      };
    },
    [
      load,
    ]
  );
"@ `
  -Description "Reports initial-load effect"

Replace-ExactText `
  -Path "src\features\reports\use-report-details.ts" `
  -OldText @"
  useEffect(
    () => {
      setData(
        null
      );

      void load(
        "initial"
      );

      return () => {
        requestIdRef.current +=
          1;
      };
    },
    [
      load,
    ]
  );
"@ `
  -NewText @"
  useEffect(
    () => {
      const timeoutId =
        window.setTimeout(
          () => {
            setData(
              null
            );

            void load(
              "initial"
            );
          },
          0
        );

      return () => {
        window.clearTimeout(
          timeoutId
        );

        requestIdRef.current +=
          1;
      };
    },
    [
      load,
    ]
  );
"@ `
  -Description "Report details initial-load effect"

Write-Host ""
Write-Host "Running Admin TypeScript..." -ForegroundColor Cyan

npx tsc --noEmit

if ($LASTEXITCODE -ne 0) {
  throw "Reports C1 TypeScript verification failed."
}

Write-Host ""
Write-Host "Running Admin lint..." -ForegroundColor Cyan

npm run lint

if ($LASTEXITCODE -ne 0) {
  throw "Reports C1 lint verification failed."
}

Write-Host ""
Write-Host "Running Admin production build..." -ForegroundColor Cyan

npm run build

if ($LASTEXITCODE -ne 0) {
  throw "Reports C1 production build failed."
}

Write-Host ""
Write-Host "Reports Batch C1 REPAIR PASS." -ForegroundColor Green
