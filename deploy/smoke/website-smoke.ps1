param(
    [string]$WebsiteBaseUrl = "https://getpostar.com",
    [string]$BackendBaseUrl = "https://api.getpostar.com"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

$routes = @(
    "/",
    "/about",
    "/how-it-works",
    "/get-app",
    "/publishers",
    "/advertisers",
    "/copyright",
    "/contact",
    "/privacy",
    "/terms",
    "/robots.txt",
    "/sitemap.xml",
    "/manifest.webmanifest"
)

$requiredHomeTokens = @(
    "Poster",
    "Knowledge discovery"
)

$requiredGetAppTokens = @(
    "Store listing pending",
    "QR access"
)

$requiredContactTokens = @(
    "Official Signal business contact",
    "Business Identity"
)

$requiredPrivacyTokens = @(
    "Website analytics and cookies",
    "third-party analytics provider",
    "consent or preference control"
)

$requiredSecurityHeaders = @(
    "Content-Security-Policy",
    "X-Content-Type-Options",
    "X-Frame-Options",
    "Referrer-Policy",
    "Permissions-Policy"
)

$failures = New-Object System.Collections.Generic.List[string]

function Add-Failure {
    param([string]$Message)
    [void]$failures.Add($Message)
    Write-Host "FAIL $Message" -ForegroundColor Red
}

function Add-Pass {
    param([string]$Message)
    Write-Host "PASS $Message" -ForegroundColor Green
}

function Join-Url {
    param(
        [string]$Base,
        [string]$Path
    )

    return ($Base.TrimEnd("/") + "/" + $Path.TrimStart("/"))
}

function Invoke-SmokeRequest {
    param([string]$Url)

    try {
        return Invoke-WebRequest -Uri $Url -Method Get -UseBasicParsing -MaximumRedirection 5 -TimeoutSec 30
    }
    catch {
        Add-Failure "$Url request failed: $($_.Exception.Message)"
        return $null
    }
}

Write-Host ""
Write-Host "POSTER WEBSITE DEPLOYMENT SMOKE VALIDATION"
Write-Host "WebsiteBaseUrl: $WebsiteBaseUrl"
Write-Host "BackendBaseUrl: $BackendBaseUrl"
Write-Host ""

foreach ($route in $routes) {
    $url = Join-Url $WebsiteBaseUrl $route
    $response = Invoke-SmokeRequest $url

    if ($null -eq $response) {
        continue
    }

    if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
        Add-Pass "$route returned HTTP $($response.StatusCode)"
    }
    else {
        Add-Failure "$route returned HTTP $($response.StatusCode)"
    }
}

$homeResponse = Invoke-SmokeRequest (Join-Url $WebsiteBaseUrl "/")
if ($null -ne $homeResponse) {
    foreach ($token in $requiredHomeTokens) {
        if ($homeResponse.Content.Contains($token)) {
            Add-Pass "home contains token: $token"
        }
        else {
            Add-Failure "home missing token: $token"
        }
    }

    foreach ($header in $requiredSecurityHeaders) {
        if ($homeResponse.Headers.ContainsKey($header)) {
            Add-Pass "home has security header: $header"
        }
        else {
            Add-Failure "home missing security header: $header"
        }
    }
}

$getAppResponse = Invoke-SmokeRequest (Join-Url $WebsiteBaseUrl "/get-app")
if ($null -ne $getAppResponse) {
    foreach ($token in $requiredGetAppTokens) {
        if ($getAppResponse.Content.Contains($token)) {
            Add-Pass "get-app contains token: $token"
        }
        else {
            Add-Failure "get-app missing token: $token"
        }
    }

    if (
        $getAppResponse.Content -match "apps\.apple\.com" -or
        $getAppResponse.Content -match "play\.google\.com/store" -or
        $getAppResponse.Content -match "itunes\.apple\.com"
    ) {
        Add-Failure "get-app contains store URL before official release lock"
    }
    else {
        Add-Pass "get-app has no fake store URL"
    }
}

$contactResponse = Invoke-SmokeRequest (Join-Url $WebsiteBaseUrl "/contact")
if ($null -ne $contactResponse) {
    foreach ($token in $requiredContactTokens) {
        if ($contactResponse.Content.Contains($token)) {
            Add-Pass "contact contains token: $token"
        }
        else {
            Add-Failure "contact missing token: $token"
        }
    }
}

$privacyResponse = Invoke-SmokeRequest (Join-Url $WebsiteBaseUrl "/privacy")
if ($null -ne $privacyResponse) {
    foreach ($token in $requiredPrivacyTokens) {
        if ($privacyResponse.Content.Contains($token)) {
            Add-Pass "privacy contains token: $token"
        }
        else {
            Add-Failure "privacy missing token: $token"
        }
    }
}

$businessIdentityUrl = Join-Url $BackendBaseUrl "/api/v1/public/business-identity"
$businessIdentityResponse = Invoke-SmokeRequest $businessIdentityUrl

if ($null -ne $businessIdentityResponse) {
    if ($businessIdentityResponse.Content.Contains("signalUrl") -and $businessIdentityResponse.Content.Contains("clientPortalUrl") -and $businessIdentityResponse.Content.Contains("copyrightPortalUrl")) {
        Add-Pass "Backend public Business Identity exposes Signal, Client portal, and Copyright portal fields"
    }
    else {
        Add-Failure "Backend public Business Identity missing expected public portal/contact fields"
    }
}

Write-Host ""
if ($failures.Count -eq 0) {
    Write-Host "WEBSITE DEPLOYMENT SMOKE VALIDATION: PASS" -ForegroundColor Green
    exit 0
}

Write-Host "WEBSITE DEPLOYMENT SMOKE VALIDATION: FAIL" -ForegroundColor Red
foreach ($failure in $failures) {
    Write-Host "- $failure"
}
exit 1
