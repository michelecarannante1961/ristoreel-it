$ErrorActionPreference = 'Stop'
$taskRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$taskRecord = Join-Path $taskRoot '.data\local-processes.json'
if (!(Test-Path -LiteralPath $taskRecord)) {
    Write-Output 'Nessun servizio avviato dal launcher risulta registrato.'
    exit 0
}
$taskEntries = Get-Content -LiteralPath $taskRecord -Raw | ConvertFrom-Json
foreach ($taskEntry in $taskEntries) {
    if ($taskEntry.root -ne $taskRoot) { continue }
    $taskProcess = Get-CimInstance Win32_Process -Filter ('ProcessId=' + [int]$taskEntry.pid) -ErrorAction SilentlyContinue
    if (!$taskProcess -or !$taskProcess.CommandLine -or !$taskProcess.CommandLine.Contains($taskRoot)) { continue }
    $taskStarted = [DateTime]::Parse($taskEntry.started).ToUniversalTime()
    if ([Math]::Abs(($taskProcess.CreationDate.ToUniversalTime() - $taskStarted).TotalSeconds) -gt 15) { continue }
    $taskChildren = @(Get-CimInstance Win32_Process -Filter ('ParentProcessId=' + [int]$taskEntry.pid) -ErrorAction SilentlyContinue)
    foreach ($taskChild in $taskChildren) {
        $taskGrandchildren = @(Get-CimInstance Win32_Process -Filter ('ParentProcessId=' + [int]$taskChild.ProcessId) -ErrorAction SilentlyContinue)
        foreach ($taskGrandchild in $taskGrandchildren) { Stop-Process -Id $taskGrandchild.ProcessId -ErrorAction SilentlyContinue }
        Stop-Process -Id $taskChild.ProcessId -ErrorAction SilentlyContinue
    }
    Stop-Process -Id $taskProcess.ProcessId -ErrorAction SilentlyContinue
    Write-Output ($taskEntry.name + ': arrestato.')
}
Write-Output 'Arresto dei servizi locali registrati completato.'
