Param(
    [string] $ModulesConfigPath,
    [string] $NpmrcPath,
    [string] $installMode = "NodeOnly" # Options: "All", "PSOnly", "NodeOnly" 
    # currently, only "NodeOnly" is used
)


$tempModulesPath = ".\Common\temp"
$modulesPath = ".\Common\ps_modules"

$tempNodePath = ".\Common\node_temp"
$nodeModulesPath = ".\Common\node_modules"



# Validate install mode
if ($installMode -notin @("All", "PSOnly", "NodeOnly")) {
    Write-Error "Invalid installMode '$installMode'. Valid options are: All, PSOnly, NodeOnly"
    exit 1
}

Write-Host "Install mode: $installMode"

# Ensure required temp folders exist based on install mode
$requiredPaths = @()
if ($installMode -eq "All" -or $installMode -eq "PSOnly") {
    $requiredPaths += $tempModulesPath
}
if ($installMode -eq "All" -or $installMode -eq "NodeOnly") {
    $requiredPaths += $tempNodePath
}

foreach ($path in $requiredPaths) {
    if (!(Test-Path $path)) {
        New-Item -Path $path -ItemType Directory -Force
        Write-Host "Created directory: $path"
    }
}

# Read config
$configRaw = Get-Content -Path $ModulesConfigPath -Raw
$modules = $configRaw | ConvertFrom-Json

### --- PowerShell Modules ---
if ($installMode -eq "All" -or $installMode -eq "PSOnly") {
    Write-Host "Installing PowerShell modules..."
    $modules.modules | Foreach-Object {
        Write-Host "Installing PowerShell module: $($_.name)@$($_.version)"
        Save-Module -Name $_.name -RequiredVersion $_.version -Path $tempModulesPath

        $sourcePath = "{0}\{1}\{2}" -f $tempModulesPath, $_.name, $_.version
        $targetPath = "{0}\{1}" -f $modulesPath, $_.name

        If (test-path $targetPath) {
            Remove-Item -Path $targetPath -Recurse -Force
        }
        
        Copy-Item -Recurse -Force -Path $sourcePath -Destination $targetPath
        Write-Host "Successfully installed PowerShell module: $($_.name)@$($_.version)"
    }
} else {
    Write-Host "Skipping PowerShell modules installation (installMode: $installMode)"
}

### --- Node Modules ---
if ($installMode -eq "All" -or $installMode -eq "NodeOnly") {
    Write-Host "Installing Node modules..."
    $modules.nodeModules | ForEach-Object {
        $moduleName = $_.name
        $moduleVersion = $_.version
        Write-Host "Installing Node module: $moduleName@$moduleVersion"
        
        try {
            $npmArgs = @("/c", "npm", "install", "$moduleName@$moduleVersion", "--prefix", $tempNodePath)
            if ($NpmrcPath) {
                $npmArgs += @("--userconfig", $NpmrcPath)
            }
            $process = Start-Process -FilePath "cmd.exe" -ArgumentList $npmArgs -NoNewWindow -Wait -PassThru
            
            if ($process.ExitCode -ne 0) {
                throw "npm install failed with exit code $($process.ExitCode)"
            }
            
            Write-Host "Successfully installed $moduleName@$moduleVersion"
        }
        catch {
            Write-Error "Failed to install $moduleName@$moduleVersion : $_"
            throw
        }
    }

    # Move node_modules to permanent location
    if (Test-Path "$nodeModulesPath") {
        Remove-Item -Path $nodeModulesPath -Recurse -Force
    }

    # Check if node_modules was created in temp location
    if (Test-Path "$tempNodePath\node_modules") {
        Copy-Item -Recurse -Force -Path "$tempNodePath\node_modules" -Destination $nodeModulesPath
        Write-Host "Successfully copied node_modules to permanent location"
    } else {
        Write-Warning "node_modules directory not found in $tempNodePath - some Node modules may not have been installed correctly"
    }
} else {
    Write-Host "Skipping Node modules installation (installMode: $installMode)"
}

# Cleanup temp folders with error handling
if ($installMode -eq "All" -or $installMode -eq "PSOnly") {
    try {
        if (Test-Path $tempModulesPath) {
            Remove-Item -Path $tempModulesPath -Recurse -Force -ErrorAction Stop
            Write-Host "Cleaned up temporary PowerShell modules directory"
        }
    } catch {
        Write-Warning "Failed to cleanup temporary PowerShell modules directory: $_"
    }
}

if ($installMode -eq "All" -or $installMode -eq "NodeOnly") {
    try {
        if (Test-Path $tempNodePath) {
            Remove-Item -Path $tempNodePath -Recurse -Force -ErrorAction Stop
            Write-Host "Cleaned up temporary Node modules directory"
        }
    } catch {
        Write-Warning "Failed to cleanup temporary Node modules directory: $_"
    }
}

Write-Host "Module installation completed for mode: $installMode"
