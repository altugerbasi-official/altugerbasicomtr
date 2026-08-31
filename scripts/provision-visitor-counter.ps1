[CmdletBinding()]
param(
    [string]$StaticWebAppName,
    [string]$ResourceGroup,
    [string]$DefaultHostname = 'jolly-pebble-0592a6503.6.azurestaticapps.net',
    [string]$TableName = 'VisitorCounters'
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    throw 'Azure CLI bulunamadı. Önce Azure CLI kurun.'
}

az account show --only-show-errors | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw 'Azure CLI oturumu bulunamadı. Önce az login çalıştırın.'
}

$apps = @(az staticwebapp list --only-show-errors --output json | ConvertFrom-Json)
if (-not $StaticWebAppName) {
    $matchingApps = @($apps | Where-Object { $_.defaultHostname -eq $DefaultHostname })
    if ($matchingApps.Count -ne 1) {
        throw "Static Web App otomatik bulunamadı. -StaticWebAppName ve -ResourceGroup parametrelerini verin."
    }
    $StaticWebAppName = $matchingApps[0].name
    $ResourceGroup = $matchingApps[0].resourceGroup
}

$app = $apps | Where-Object {
    $_.name -eq $StaticWebAppName -and (-not $ResourceGroup -or $_.resourceGroup -eq $ResourceGroup)
} | Select-Object -First 1
if (-not $app) {
    throw "Static Web App bulunamadı: $StaticWebAppName"
}
if (-not $ResourceGroup) {
    $ResourceGroup = $app.resourceGroup
}

$subscriptionId = az account show --query id --output tsv --only-show-errors
$identitySeed = "$subscriptionId/$ResourceGroup/$StaticWebAppName"
$sha = [Security.Cryptography.SHA256]::Create()
try {
    $hashBytes = $sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($identitySeed))
    $suffix = ([BitConverter]::ToString($hashBytes)).Replace('-', '').Substring(0, 12).ToLowerInvariant()
}
finally {
    $sha.Dispose()
}
$storageName = "altugvis$suffix"

$existingStorage = az storage account list `
    --resource-group $ResourceGroup `
    --query "[?name=='$storageName'].name | [0]" `
    --output tsv `
    --only-show-errors
if (-not $existingStorage) {
    Write-Host "Storage Account oluşturuluyor: $storageName"
    az storage account create `
        --name $storageName `
        --resource-group $ResourceGroup `
        --location $app.location `
        --sku Standard_LRS `
        --kind StorageV2 `
        --https-only true `
        --min-tls-version TLS1_2 `
        --allow-blob-public-access false `
        --only-show-errors `
        --output none
    if ($LASTEXITCODE -ne 0) { throw 'Storage Account oluşturulamadı.' }
}
else {
    Write-Host "Storage Account zaten var: $storageName"
}

$storageKey = az storage account keys list `
    --account-name $storageName `
    --resource-group $ResourceGroup `
    --query '[0].value' `
    --output tsv `
    --only-show-errors
if ($LASTEXITCODE -ne 0 -or -not $storageKey) { throw 'Storage anahtarı alınamadı.' }

az storage table create `
    --name $TableName `
    --account-name $storageName `
    --account-key $storageKey `
    --only-show-errors `
    --output none
if ($LASTEXITCODE -ne 0) { throw 'Sayaç tablosu oluşturulamadı.' }

$connectionString = az storage account show-connection-string `
    --name $storageName `
    --resource-group $ResourceGroup `
    --query connectionString `
    --output tsv `
    --only-show-errors
if ($LASTEXITCODE -ne 0 -or -not $connectionString) { throw 'Storage bağlantı bilgisi alınamadı.' }

$settings = @(
    "VISITOR_STORAGE_CONNECTION_STRING=$connectionString",
    "VISITOR_TABLE_NAME=$TableName"
)
az staticwebapp appsettings set `
    --name $StaticWebAppName `
    --resource-group $ResourceGroup `
    --setting-names $settings `
    --only-show-errors `
    --output none
if ($LASTEXITCODE -ne 0) { throw 'Static Web App ortam değişkenleri ayarlanamadı.' }

Write-Host "Sayaç altyapısı hazır."
Write-Host "Static Web App: $StaticWebAppName"
Write-Host "Storage Account: $storageName"
Write-Host "Table: $TableName"
