Import-Module -Force .\ps_modules\FabricApiUtils

$activityId = New-Guid
Write-Host "Activity ID: $activityId"

$endpoint = Connect-FabricService -FabricConnection $fabricConnection