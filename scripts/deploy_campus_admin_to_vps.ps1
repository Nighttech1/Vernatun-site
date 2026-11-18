#Requires -Version 5.1
param([switch]$SkipSiteMarketing,[switch]$SkipBuild)
& (Join-Path $PSScriptRoot 'deploy_selectel_to_vps.ps1') -SkipBuild:$SkipBuild -SkipSiteMarketing:$SkipSiteMarketing
