$apiKey = $env:OPENROUTER_API_KEY
if (-not $apiKey) {
    Write-Host "OPENROUTER_API_KEY not set"
    exit 1
}

$body3500 = @{
    model = "openai/gpt-4o"
    messages = @(
        @{ role = "system"; content = "You are a helpful assistant. Respond concisely." }
        @{ role = "user"; content = "Say hello in one sentence." }
    )
    max_tokens = 3500
    temperature = 0.4
    stream = $false
} | ConvertTo-Json

$body2048 = @{
    model = "openai/gpt-4o"
    messages = @(
        @{ role = "system"; content = "You are a helpful assistant. Respond concisely." }
        @{ role = "user"; content = "Say hello in one sentence." }
    )
    max_tokens = 2048
    temperature = 0.2
    stream = $false
} | ConvertTo-Json

Write-Host "=== Testing max_tokens=3500 (research profile) ==="
try {
    $resp = Invoke-RestMethod -Uri "https://openrouter.ai/api/v1/chat/completions" -Method Post -Headers @{
        "Authorization" = "Bearer $apiKey"
        "Content-Type" = "application/json"
        "HTTP-Referer" = "https://spyral-os.vercel.app"
        "X-Title" = "SPYRAL OS Test"
    } -Body $body3500
    Write-Host "SUCCESS! Response: $($resp.choices[0].message.content)"
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "HTTP Status: $($_.Exception.Response.StatusCode)"
        Write-Host "Body: $($reader.ReadToEnd())"
    }
}

Write-Host ""
Write-Host "=== Testing max_tokens=2048 (command profile) ==="
try {
    $resp = Invoke-RestMethod -Uri "https://openrouter.ai/api/v1/chat/completions" -Method Post -Headers @{
        "Authorization" = "Bearer $apiKey"
        "Content-Type" = "application/json"
        "HTTP-Referer" = "https://spyral-os.vercel.app"
        "X-Title" = "SPYRAL OS Test"
    } -Body $body2048
    Write-Host "SUCCESS! Response: $($resp.choices[0].message.content)"
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "HTTP Status: $($_.Exception.Response.StatusCode)"
        Write-Host "Body: $($reader.ReadToEnd())"
    }
}
