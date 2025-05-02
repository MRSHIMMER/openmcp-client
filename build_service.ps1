# 创建并清理资源目录
New-Item -ItemType Directory -Path ./openmcp-sdk -Force
Remove-Item -Recurse -Force ./openmcp-sdk/* -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path ./openmcp-sdk -Force

# 获取当前工作目录的绝对路径
$currentDir = (Get-Location).Path

# 并行构建 renderer 和 service
$rendererJob = Start-Job -ScriptBlock {
    param($workDir)
    Set-Location -Path "$workDir\renderer"
    npm run build
    Move-Item -Path "./dist" -Destination "$workDir\openmcp-sdk\renderer" -Force
} -ArgumentList $currentDir

$serviceJob = Start-Job -ScriptBlock {
    param($workDir)
    Set-Location -Path "$workDir\service"
    npm run build
    Move-Item -Path "./dist" -Destination "$workDir\openmcp-sdk\service" -Force
} -ArgumentList $currentDir

# 等待任务完成
$rendererJob | Wait-Job | Receive-Job
$serviceJob | Wait-Job | Receive-Job

# 将 openmcp-sdk 目录复制到 software/openmcp-sdk
New-Item -ItemType Directory -Path ./software/openmcp-sdk -Force
Remove-Item -Recurse -Force ./software/openmcp-sdk/* -ErrorAction SilentlyContinue
Copy-Item -Recurse -Path ./openmcp-sdk -Destination ./software/ -Force

Write-Output "finish building services in ./openmcp-sdk"
