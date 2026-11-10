<#
.SYNOPSIS
    Gera os icones e a splash do PRAZZO a partir de assets/logo-mark.png.

.DESCRIPTION
    Os arquivos icon.png, android-icon-*.png e splash-icon.png que vieram do
    template do Expo eram os placeholders padrao (o "A" azul e a grade cinza).
    Este script os substitui pela marca do PRAZZO. Rode de novo sempre que a
    logo mudar:

        powershell -File scripts/gerar-icones.ps1

    Tamanhos (fracao do lado do canvas ocupada pela altura da logo):
      - icon.png                     0.62  fundo escuro opaco (iOS / legado)
      - android-icon-foreground.png  0.46  transparente. O Android recorta o
                                           icone adaptativo em circulo e so
                                           garante os 61% centrais: maior que
                                           isso e a logo sai cortada.
      - splash-icon.png              0.56  transparente. A splash do
                                           Android 12+ tambem recorta em circulo.
      - favicon.png                  0.80  fundo escuro opaco (web)
#>
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$assets = Join-Path $PSScriptRoot "..\assets"
$logo = [System.Drawing.Image]::FromFile((Join-Path $assets "logo-mark.png"))

# Mesmo valor de `colors.background` em src/theme/colors.ts.
$fundo = [System.Drawing.ColorTranslator]::FromHtml("#0f1117")

function New-Icone {
    param(
        [string]$Nome,
        [int]$Lado,
        [double]$FracaoAltura,
        [bool]$Opaco
    )

    $bmp = New-Object System.Drawing.Bitmap $Lado, $Lado, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    if ($Opaco) { $g.Clear($fundo) } else { $g.Clear([System.Drawing.Color]::Transparent) }

    $h = [int]($Lado * $FracaoAltura)
    $w = [int]($h * $logo.Width / $logo.Height)
    $x = [int](($Lado - $w) / 2)
    $y = [int](($Lado - $h) / 2)
    $g.DrawImage($logo, $x, $y, $w, $h)

    $g.Dispose()
    $destino = Join-Path $assets $Nome
    $bmp.Save($destino, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "gerado: $Nome (${Lado}x${Lado})"
}

New-Icone -Nome "icon.png"                    -Lado 1024 -FracaoAltura 0.62 -Opaco $true
New-Icone -Nome "android-icon-foreground.png" -Lado 1024 -FracaoAltura 0.46 -Opaco $false
New-Icone -Nome "splash-icon.png"             -Lado 1024 -FracaoAltura 0.56 -Opaco $false
New-Icone -Nome "favicon.png"                 -Lado 48   -FracaoAltura 0.80 -Opaco $true

$logo.Dispose()
