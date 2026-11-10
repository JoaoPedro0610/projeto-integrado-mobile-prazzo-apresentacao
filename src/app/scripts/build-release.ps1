<#
.SYNOPSIS
    Gera o APK de producao do PRAZZO, assinado e ofuscado, nesta maquina.

.DESCRIPTION
    Alternativa local ao `eas build` (nao precisa de conta Expo):

      1. `expo prebuild` recria a pasta android/ a partir do app.json
         (icones, splash, package, R8 ligado via expo-build-properties).
      2. `gradlew assembleRelease` compila com NODE_ENV=production, entao o
         bundle embute as variaveis de `.env.production`.
      3. A assinatura usa a chave de credentials/ (gere antes com
         scripts/gerar-keystore.ps1). As senhas entram pelas propriedades
         `android.injected.signing.*` do Gradle, entao nada de segredo e
         escrito dentro de android/.

    A compilacao acontece numa COPIA do app em uma pasta de caminho curto
    (padrao C:\pzb), e nao aqui. Motivo: o ninja recusa arquivos com mais de
    260 caracteres, e o nome de cada objeto compilado embute o caminho do
    projeto. A partir de "C:\Users\...\projeto-integrado-app\src\app" isso
    estoura com "Filename longer than 260 characters". Mapear a pasta com
    `subst` nao resolve: o Node resolve a letra de volta para o caminho real
    e o Gradle aborta com "this and base files have different roots".

    Saida: dist/prazzo-v<versao>.apk

    Pre-requisitos: JDK 17 (JAVA_HOME) e Android SDK (ANDROID_HOME).
    Na primeira vez o Gradle baixa o NDK e as dependencias: demora bastante.

.PARAMETER SemPrebuild
    Pula o `expo prebuild` e reaproveita a pasta android/ da copia.

.PARAMETER PastaBuild
    Pasta de caminho curto onde a copia e compilada. Padrao: C:\pzb.
#>
param(
    [switch]$SemPrebuild,
    [string]$PastaBuild = (Join-Path $env:SystemDrive "pzb")
)

$ErrorActionPreference = "Stop"

$app = Resolve-Path (Join-Path $PSScriptRoot "..")
$credenciais = Join-Path $app "credentials"
$propriedades = Join-Path $credenciais "keystore.properties"

if (-not (Test-Path $propriedades)) {
    throw "Chave de assinatura nao encontrada. Rode antes: scripts\gerar-keystore.ps1"
}
if (-not $env:ANDROID_HOME -or -not (Test-Path (Join-Path $env:ANDROID_HOME "platform-tools"))) {
    throw "ANDROID_HOME nao aponta para um Android SDK valido."
}

# keystore.properties -> hashtable
$chave = @{}
Get-Content $propriedades | Where-Object { $_ -match "^\s*[^#].*=" } | ForEach-Object {
    $par = $_ -split "=", 2
    $chave[$par[0].Trim()] = $par[1].Trim()
}
$keystore = Join-Path $credenciais $chave.storeFile
if (-not (Test-Path $keystore)) { throw "Keystore nao encontrado: $keystore" }

$versao = (Get-Content (Join-Path $app "app.json") -Raw | ConvertFrom-Json).expo.version


# Espelha o app na pasta curta. /MIR deixa a copia identica a origem; as
# pastas em /XD ficam de fora (android/ e gerada la dentro pelo prebuild, e
# a chave de assinatura nunca sai de credentials/).
$origem = $app.Path
Write-Host "==> copiando o app para $PastaBuild"
# Caminhos completos no /XD: so o nome ("android") excluiria tambem a pasta
# android/ de cada biblioteca dentro de node_modules.
$fora = "android", "ios", ".expo", "dist", "credentials" | ForEach-Object {
    Join-Path $origem $_
    Join-Path $PastaBuild $_
}
robocopy $origem $PastaBuild /MIR /XD @fora /NFL /NDL /NJH /NJS /NP | Out-Null
# O robocopy devolve 0-7 para sucesso (bits de "copiou", "havia extras"...).
if ($LASTEXITCODE -ge 8) { throw "robocopy falhou (codigo $LASTEXITCODE)." }

Push-Location $PastaBuild
try {
    # E o NODE_ENV que faz o Expo carregar .env.production em vez de
    # .env.development na hora de gerar o bundle JS.
    $env:NODE_ENV = "production"

    if (-not $SemPrebuild) {
        Write-Host "==> expo prebuild (android)"
        npx expo prebuild --platform android --clean --no-install
        if ($LASTEXITCODE -ne 0) { throw "expo prebuild falhou." }
    }

    Write-Host "==> gradlew assembleRelease"
    Push-Location (Join-Path $PastaBuild "android")
    try {
        & .\gradlew.bat assembleRelease `
            "-Pandroid.injected.signing.store.file=$keystore" `
            "-Pandroid.injected.signing.store.password=$($chave.storePassword)" `
            "-Pandroid.injected.signing.key.alias=$($chave.keyAlias)" `
            "-Pandroid.injected.signing.key.password=$($chave.keyPassword)"
        if ($LASTEXITCODE -ne 0) { throw "gradlew assembleRelease falhou." }
    }
    finally { Pop-Location }

    $apk = Join-Path $PastaBuild "android\app\build\outputs\apk\release\app-release.apk"
    $destino = Join-Path $origem "dist"
    New-Item -ItemType Directory -Force $destino | Out-Null
    $saida = Join-Path $destino "prazzo-v$versao.apk"
    Copy-Item $apk $saida -Force

    # O mapping.txt desfaz a ofuscacao do R8 em stack traces de producao.
    # Sem o arquivo desta build exata, um erro reportado e ilegivel.
    $mapping = Join-Path $PastaBuild "android\app\build\outputs\mapping\release\mapping.txt"
    if (Test-Path $mapping) {
        Copy-Item $mapping (Join-Path $destino "prazzo-v$versao-mapping.txt") -Force
    }

    $mb = [math]::Round((Get-Item $saida).Length / 1MB, 1)
    Write-Host ""
    Write-Host "APK pronto: $saida ($mb MB)"
}
finally { Pop-Location }