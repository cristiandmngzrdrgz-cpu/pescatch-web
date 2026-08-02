param(
  [string]$Action = "install"
)

$ProjectRoot = "D:\01_PROYECTOS\Workbench\Desktop\Web_chollos_pesca"
$NodeBin = "C:\Program Files\nodejs\npx.cmd"

$Tasks = @(
  @{
    Name = "PesCatch-DiscoverAuto"
    Description = "Busca nuevos candidatos de chollos automaticamente"
    Script = "npx tsx scripts/discover/auto.ts"
    Hour = 6
    Minute = 0
  }
  @{
    Name = "PesCatch-RefreshPrices"
    Description = "Actualiza precios de todos los chollos (local + Turso)"
    Script = "npx tsx scripts/refresh-prices-prod.ts --apply"
    Hour = 8
    Minute = 0
  }
  @{
    Name = "PesCatch-CleanExpired"
    Description = "Marca deals expirados como borrador"
    Script = "npx tsx scripts/clean-expired-deals.ts"
    Hour = 3
    Minute = 0
  }
)

function Install-Task {
  param($Task)
  $Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -WindowStyle Hidden -Command ""Set-Location '$ProjectRoot'; $($Task.Script)"""
  $Trigger = New-ScheduledTaskTrigger -Daily -At "$($Task.Hour):$($Task.Minute)"
  $Settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopIfGoingOnBatteries
  $Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

  Register-ScheduledTask -TaskName $Task.Name -Action $Action -Trigger $Trigger -Settings $Settings -Principal $Principal -Description $Task.Description -Force

  Write-Host "  ✅ Instalada: $($Task.Name) — $($Task.Hour):$($Task.Minute)"
}

function Remove-Task {
  param($Task)
  Unregister-ScheduledTask -TaskName $Task.Name -Confirm:$false -ErrorAction SilentlyContinue
  Write-Host "  ❌ Eliminada: $($Task.Name)"
}

function Show-Status {
  foreach ($Task in $Tasks) {
    $t = Get-ScheduledTask -TaskName $Task.Name -ErrorAction SilentlyContinue
    if ($t) {
      $state = $t.State
      $nextRun = (Get-ScheduledTask -TaskName $Task.Name | Get-ScheduledTaskInfo).NextRunTime
      Write-Host "  ✅ $($Task.Name) — Estado: $state — Próxima: $nextRun"
    } else {
      Write-Host "  ⬜ $($Task.Name) — No instalada"
    }
  }
}

switch ($Action) {
  "install" {
    Write-Host "`n=== Instalando tareas programadas para PesCatch ===`n"
    foreach ($Task in $Tasks) {
      Install-Task $Task
    }
    Write-Host "`n✅ Tareas instaladas correctamente.`n"
  }
  "remove" {
    Write-Host "`n=== Eliminando tareas programadas para PesCatch ===`n"
    foreach ($Task in $Tasks) {
      Remove-Task $Task
    }
    Write-Host "`n✅ Tareas eliminadas correctamente.`n"
  }
  "status" {
    Write-Host "`n=== Estado de tareas programadas para PesCatch ===`n"
    Show-Status
    Write-Host ""
  }
  default {
    Write-Host "Uso: .\scripts\setup-scheduler.ps1 -Action <install|remove|status>"
  }
}
