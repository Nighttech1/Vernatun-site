#Requires -Version 5.1
param([switch]$SkipSsl,[switch]$InstallOnly,[switch]$SkipBuild)
& (Join-Path $PSScriptRoot 'deploy_selectel_to_vps.ps1') -SkipBuild:$SkipBuild -SkipSsl:$SkipSsl -InstallOnly:$InstallOnly
