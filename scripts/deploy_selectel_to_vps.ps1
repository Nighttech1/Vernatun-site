#Requires -Version 5.1
param([switch]$SkipBuild,[switch]$SkipSsl,[switch]$SkipSiteMarketing,[switch]$InstallOnly)
$ErrorActionPreference='Stop'
$repoRoot=Split-Path -Parent $PSScriptRoot
. (Join-Path $repoRoot 'vps door\load-ssh-env.ps1')
$target="$($env:VERNATUN_SSH_USER)@$($env:VERNATUN_SSH_HOST)"
$sshArgs=@('-i',$env:VERNATUN_SSH_KEY,'-o','BatchMode=yes','-o','ConnectTimeout=20','-o','StrictHostKeyChecking=accept-new')
function Remote([string]$Command) { & ssh @sshArgs $target $Command; if($LASTEXITCODE -ne 0){throw 'Remote deployment failed'} }
function Upload([string]$Source,[string]$Destination) { & scp @sshArgs $Source "${target}:$Destination"; if($LASTEXITCODE -ne 0){throw 'Upload failed'} }
if(-not $SkipBuild){ Push-Location (Join-Path $repoRoot 'liverooms\web'); try { & npm.cmd run build; if($LASTEXITCODE -ne 0){throw 'Campus build failed'} } finally {Pop-Location} }
$stamp=Get-Date -Format 'yyyyMMddHHmmss'
$stage=Join-Path $env:TEMP "vernatun-web-$stamp"
New-Item -ItemType Directory -Path "$stage\web","$stage\admin","$stage\api" -Force | Out-Null
$items=@('index.html','schedule.html','about.html','articles.html','materials.html','contacts.html','test-room.html','lounge.html','room.html','favicon.ico','robots.txt','sitemap.xml','images','gallery','css','js','fonts','articles','materials','videos')
foreach($item in $items){$src=Join-Path $repoRoot $item; if(Test-Path -LiteralPath $src){Copy-Item -LiteralPath $src -Destination "$stage\web" -Recurse -Force}}
Copy-Item -LiteralPath (Join-Path $repoRoot 'liverooms\web\dist\index.html') -Destination "$stage\web\campus-app.html"
Copy-Item -LiteralPath (Join-Path $repoRoot 'liverooms\web\dist\assets') -Destination "$stage\web" -Recurse
foreach($f in @('index.html','app.js','styles.css')){Copy-Item -LiteralPath (Join-Path $repoRoot "liverooms\admin\$f") -Destination "$stage\admin"}
foreach($f in @('lounge_api.py','spacedeck_client.py')){Copy-Item -LiteralPath (Join-Path $repoRoot "liverooms\infra\vps\$f") -Destination "$stage\api"}
$archive=Join-Path $env:TEMP "vernatun-web-$stamp.tgz"
& tar -czf $archive --exclude='*.MOV' --exclude='*.mov' -C $stage .
if($LASTEXITCODE -ne 0){throw 'Archive failed'}
Remote "mkdir -p /opt/vernatun-web/releases /var/backups/vernatun-web /var/lib/vernatun-web /etc/vernatun-web; chmod 700 /var/backups/vernatun-web /etc/vernatun-web"
Upload $archive "/opt/vernatun-web/release-$stamp.tgz"
Upload (Join-Path $PSScriptRoot 'selectel-web-release.sh') /opt/vernatun-web/release.sh
Remote "sed -i 's/\r$//' /opt/vernatun-web/release.sh; bash /opt/vernatun-web/release.sh '$stamp'"
Write-Host 'Release deployed; server .env and /var/lib/vernatun-web were preserved. Runtime API data remains on the server.'

