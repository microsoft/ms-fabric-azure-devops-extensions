fab create ws3-test.Workspace -P capacityname=none
fab cd ws3-test.Workspace
fab cd ..
fab rm ws3-test.Workspace -f
Write-Output "ps script in test run successfully"