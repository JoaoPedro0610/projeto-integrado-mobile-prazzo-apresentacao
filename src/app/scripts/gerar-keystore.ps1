<#
.SYNOPSIS
    Gera a chave de assinatura DEFINITIVA do PRAZZO (roda uma unica vez).

.DESCRIPTION
    Cria credentials/prazzo-release.keystore e credentials/keystore.properties
    (com as senhas). A pasta credentials/ esta no .gitignore: NUNCA vai para o
    Git.

    IMPORTANTE: guarde uma copia da pasta credentials/ fora deste computador
    (Drive do grupo, por exemplo). O Android so aceita atualizar um app
    instalado se o APK novo for assinado com a MESMA chave. Perdeu a chave,
    todos os usuarios precisam desinstalar e instalar de novo.

    O script se recusa a sobrescrever uma chave existente por esse motivo.
#>
$ErrorActionPreference = "Stop"

$pasta = Join-Path $PSScriptRoot "..\credentials"
$keystore = Join-Path $pasta "prazzo-release.keystore"
$propriedades = Join-Path $pasta "keystore.properties"
$alias = "prazzo"

if (Test-Path $keystore) {
    throw "Ja existe uma chave em $keystore. Nao sobrescrevo: apagar a chave impede atualizar o app ja instalado."
}

$keytool = if ($env:JAVA_HOME) { Join-Path $env:JAVA_HOME "bin\keytool.exe" } else { "keytool" }

New-Item -ItemType Directory -Force $pasta | Out-Null

# Senha aleatoria de 32 caracteres (so letras e digitos, para nao exigir
# escape na linha de comando do Gradle).
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"
$senha = -join ($bytes | ForEach-Object { $alfabeto[$_ % $alfabeto.Length] })

# Validade de 10000 dias (~27 anos): o Google exige que a chave valha alem
# de 2033, e ela nao pode ser renovada depois.
& $keytool -genkeypair -v `
    -storetype PKCS12 `
    -keystore $keystore `
    -alias $alias `
    -keyalg RSA -keysize 2048 -validity 10000 `
    -storepass $senha -keypass $senha `
    -dname "CN=PRAZZO, OU=Projeto Integrado, O=PRAZZO, C=BR"

if ($LASTEXITCODE -ne 0) { throw "keytool falhou (codigo $LASTEXITCODE)." }

@"
# Gerado por scripts/gerar-keystore.ps1. NAO versionar.
storeFile=prazzo-release.keystore
storePassword=$senha
keyAlias=$alias
keyPassword=$senha
"@ | Set-Content -Encoding ascii $propriedades

Write-Host ""
Write-Host "Chave criada em: $keystore"
Write-Host "Senhas em:       $propriedades"
Write-Host "Faca backup da pasta credentials/ fora deste computador."
