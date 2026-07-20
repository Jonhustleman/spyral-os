param([string]$Path = "C:\spyral-os", [int]$Depth = 4)
$exclude = @('node_modules', '.next', '.git', '.cycle')

function Show-Tree {
    param([string]$p, [int]$level = 0)
    if ($level -gt $Depth) { return }
    $items = Get-ChildItem -Path $p | Where-Object { $_.Name -notin $exclude }
    $items | ForEach-Object {
        $prefix = "  " * $level
        if ($_.PSIsContainer) {
            "$prefix[$_.Name]"
            Show-Tree -p $_.FullName -level ($level + 1)
        } else {
            "$prefix$($_.Name)"
        }
    }
}

Show-Tree -p $Path | Out-File -FilePath "C:\spyral-os\tree-clean.txt" -Encoding UTF8
Write-Host "Done - wrote to tree-clean.txt"
