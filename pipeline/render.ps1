# LOBSTER sprite render runner (Windows).
#   pwsh pipeline/render.ps1 kawai            # one sprite, procedural model
#   pwsh pipeline/render.ps1 kawai 8          # 8 rotation frames
#   pwsh pipeline/render.ps1 kawai 1 models/rhodes.glb   # from a real mesh
param(
  [Parameter(Mandatory = $true)][string]$Id,
  [int]$Frames = 1,
  [string]$Model = ""
)
$blender = "C:\Program Files\Blender Foundation\Blender 5.1\blender.exe"
$root = Split-Path $PSScriptRoot -Parent
$args = @("--background", "--python", "$PSScriptRoot/render_sprites.py", "--",
          "--id", $Id, "--out", "$root/public/sprites", "--size", "256", "--frames", "$Frames")
if ($Model -ne "") { $args += @("--model", $Model) }
& $blender @args
Write-Host "done -> public/sprites/hero-$Id.png"
