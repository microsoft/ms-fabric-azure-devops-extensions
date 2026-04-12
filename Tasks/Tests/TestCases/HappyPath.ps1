function TestHappyPath {
    param (
        [bool] $ByDisplayName
    )

    . .\InitTask.ps1

    $displayName = "test workspace $activityId"
    $description = "test workspace $activityId (happy path)"
    $capacityId = "B5D31F5A-4B20-4326-A5BE-606D3742F025"

    Write-Host "Create a new workspace with name ($displayName)"

    $workspaceId = New-Workspace -ActivityId $activityId -Endpoint $endpoint -DisplayName $displayName -Description $description

    Write-Host "Assign workspace ($workspaceId) to the capacity ($capacityId)"

    Register-WorkspaceToCapacity -ActivityId $activityId -Endpoint $endpoint -WorkspaceId $workspaceId -CapacityId $capacityId

    Write-Host "Get the newly created workspace"

    $testWorkspace = Get-Workspace -ActivityId $activityId -Endpoint $endpoint -Workspace $workspaceId
    if ($testWorkspace.DisplayName -ne $displayName -or $testWorkspace.Description -ne $description -or $testworkspace.CapacityId -ne $capacityId) {
        throw "Created workspace ($testWorkspace) expected to be with displayName=($displayName) and description=($description), but found $($testWorkspace.DisplayName) and $($testWorkspace.Description)"
    }


    Write-Host "Delete Workspace"
    Remove-Workspace -ActivityId $activityId -Endpoint $endpoint -WorkspaceId $workspaceId

    $workspaces = Invoke-FabricApi -ActivityId $ActivityId -Endpoint $Endpoint -Url "workspaces" -Method Get
    $testWorkspace = $workspaces | Where-Object { $_.Id -eq $workspaceId }
    if ($testWorkspace) {
        throw "Expected workspace to be deleted but found ($testWorkspace)"
    }

    # if ($ByDisplayName) {
    #     $pipeline = $displayName
    # }
    # else {
    #     $pipeline = $testPipeline.Id
    # }    

    # Write-Host "Add user ($userUpn) to the pipeline"

    # Add-UserToPipeline -ActivityId $activityId -Endpoint $endpoint -Pipeline $pipeline -UserUpn $userUpn
    # $users = (Invoke-PowerBIApi -ActivityId $ActivityId -Endpoint $Endpoint -Url "pipelines/$pipelineId/users" -Method Get).value
    # $foundUser = $users | Where-Object { $_.Identifier -eq $userUpn }
    # if (!$foundUser -or $foundUser.AccessRight -ne "Admin") {
    #     throw "Expected to user $userUpn to be pipeline admin. found=($foundUser)"
    # }

    # Write-Host "Assign workspace ($workspaceName) to development stage"

    # Add-WorkspaceToPipeline -ActivityId $activityId -Endpoint $endpoint -Pipeline $pipeline -StageOrder 0 -Workspace $workspaceName
    # $stages = (Invoke-PowerBIApi -ActivityId $ActivityId -Endpoint $Endpoint -Url "pipelines/$pipelineId/stages" -Method Get).value
    # $devStage = $stages | Where-Object { $_.order -eq 0 }
    # if (!$devStage -or $devStage.WorkspaceId -ne $workspaceId) {
    #     throw "Expected development stage to have workpsace $workspaceId but found ($devStage)"
    # }

    # Write-Host "Start full deployment to the test stage"

    # $testWorkspaceName = "$workspaceName [Test]"
    # Start-PipelineDeployment -ActivityId $activityId -Endpoint $endpoint -Pipeline $pipeline -StageOrder "Test"-WaitForCompletion $TRUE -DeployType "All" -CreateNewWS $TRUE -NewWsName $testWorkspaceName -AllowCreateArtifact $TRUE -AllowOverwriteArtifact $TRUE -Note "Full deployment to test"
    # $stages = (Invoke-PowerBIApi -ActivityId $ActivityId -Endpoint $Endpoint -Url "pipelines/$pipelineId/stages" -Method Get).value
    # $testStage = $stages | Where-Object { $_.order -eq 1 }
    # if (!$testStage -or !($testStage.WorkspaceId)) {
    #     throw "Expected test stage to have a workpsace but found ($testStage)"
    # }

    # Write-Host "Add user ($userUpn) to the test workspace"

    # Add-UserToWorkspace -ActivityId $activityId -Endpoint $endpoint -Workspace $testWorkspaceName -UserUpn $userUpn -Permission "Admin"

    # Write-Host "Start selective deployment to the production stage with dataflow, datamart, dataset, report and dashboard named ($fileName)"

    # $prodWorkspaceName = "$workspaceName [Production]"
    # Start-PipelineDeployment -ActivityId $activityId -Endpoint $endpoint -Pipeline $pipeline -StageOrder "Production" -WaitForCompletion $TRUE -DeployType "Selective" -Dataflow $fileName -Datamart $fileName -Datasets $fileName -Reports $fileName -Dashboards $fileName -CreateNewWS $TRUE -NewWsName $prodWorkspaceName -AllowCreateArtifact $TRUE -AllowOverwriteArtifact $TRUE -Note "Selective deployment to production"
    # $stages = (Invoke-PowerBIApi -ActivityId $ActivityId -Endpoint $Endpoint -Url "pipelines/$pipelineId/stages" -Method Get).value
    # $prodStage = $stages | Where-Object { $_.order -eq 2 }
    # if (!$prodStage -or !($prodStage.WorkspaceId)) {
    #     throw "Expected production stage to have a workpsace but found ($prodStage)"
    # }

    # Write-Host "Unassign all workspaces from pipeline"
    # $stages | Foreach-Object {
    #     Remove-WorkspaceFromPipeline -ActivityId $activityId -Endpoint $endpoint -Pipeline $pipeline -StageOrder $_.order

    #     if ($_.order -ne 0) {
    #         $workspaceId = $_.workspaceId
    #         Invoke-PowerBIApi -ActivityId $ActivityId -Endpoint $Endpoint -Url "groups/$workspaceId" -Method Delete
    #     }
    # }

    # $stages = (Invoke-PowerBIApi -ActivityId $ActivityId -Endpoint $Endpoint -Url "pipelines/$pipelineId/stages" -Method Get).value
    # $assignedStages = $stages | Where-Object { $_.WorkspaceId }
    # if ($assignedStages) {
    #     throw "Expected all stages to be without workspaces but found ($stages)"
    # }
}

. .\Config\config.ps1

TestHappyPath -ByDisplayName $false

TestHappyPath -ByDisplayName $true