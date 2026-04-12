param(
    [string]$First,
    [string]$Second
)

Write-Output "First argument: $First"
Write-Output "Second argument: $Second"

if (-not $First) {
    Write-Output "No first argument provided!"
} else {
    Write-Output "You passed $First as the first argument."
}