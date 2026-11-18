#Requires -Version 5.1
param()
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
. (Join-Path $root 'vps door\load-ssh-env.ps1')
$target="$($env:VERNATUN_SSH_USER)@$($env:VERNATUN_SSH_HOST)"
& ssh -i $env:VERNATUN_SSH_KEY -o BatchMode=yes -o ConnectTimeout=20 $target 'cd /opt/vernatun-web/rtc && docker compose up -d && docker compose ps'
if($LASTEXITCODE -ne 0){throw 'RTC restart failed'}
