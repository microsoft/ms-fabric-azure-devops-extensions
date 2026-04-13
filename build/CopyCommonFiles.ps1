Get-ChildItem -Directory .\Tasks | ForEach-Object {
    $taskName = $_.Name
    $taskPath = ".\Tasks\$taskName"
    
    Copy-Item .\Icons\icon.png "$taskPath\icon.png"

    # if ($taskName -ne "Run_Fabric_CLI") {
    #     Copy-Item -Recurse -Force -Path .\Common\ps_modules -Destination $taskPath
    #     Copy-Item -Recurse -Force -Path .\Common\initTask.ps1 -Destination $taskPath
    # }
}

Copy-Item -Recurse -Force -Path .\Common\node_modules -Destination .\Tasks\Run_Fabric_CLI
Copy-Item -Recurse -Force -Path .\Common\node_modules -Destination .\Tasks\Tests