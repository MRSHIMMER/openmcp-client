# 定义颜色变量
$PINK = "$([char]27)[33m"
$GREEN = "$([char]27)[32m"
$NC = "$([char]27)[0m"

Start-Job -ScriptBlock {
    cd renderer
    npm run serve | ForEach-Object { "$using:PINK[renderer]$using:NC $_" }
}

Start-Job -ScriptBlock {
    cd service
    npm run serve | ForEach-Object { "$using:GREEN[service]$using:NC $_" }
}

Get-Job | Wait-Job | Receive-Job -Wait