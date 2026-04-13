const { invokeFabricCLI } = require('../../Run_Fabric_CLI/cli-core');
const { initializeCLI } = require('../../Run_Fabric_CLI/cli-init');
const { FabricConnection } = require('../Config/config');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Platform detection utilities
function isWindows() {
    return os.platform() === 'win32';
}

function isLinux() {
    return os.platform() === 'linux';
}

function getPlatformName() {
    return os.platform();
}

function getTestScriptPath(scriptName) {
    // Get cross-platform path to test scripts
    return path.join(__dirname, '..', 'TestScripts', scriptName);
}

function skipTest(testName, reason) {
    console.log(`SKIPPED: ${testName} - ${reason}`);
}


function testWindowsPowerShell(byDisplayName) {
    if (!isWindows()) {
        skipTest('Windows PowerShell tests', `Running on ${getPlatformName()}, not Windows`);
        return;
    }

    console.log('------------------------------------------------------------------------');
    console.log('WINDOWS POWERSHELL TESTS - Running on Windows');
    
    let scriptType = 'ps';
    let scriptPath = '';
    let inlineScript = `
    fab cd test-1.Workspace
    Write-Output "success"
    `;
    let scriptArguments = '';

    console.log('ps success tests - should pass');

    console.log('executing inline PowerShell script no arguments');
    invokeFabricCLI(scriptType, inlineScript, scriptPath, scriptArguments);
    console.log('');

    console.log('executing inline PowerShell script - fab dir');
    inlineScript = 'fab dir';
    invokeFabricCLI(scriptType, inlineScript, scriptPath, scriptArguments);
    console.log('');

    console.log('executing inline PowerShell script with arguments');
    scriptArguments = 'hello world';
    inlineScript = `
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
    `;
    invokeFabricCLI(scriptType, inlineScript, scriptPath, scriptArguments);
    console.log('');

    console.log('executing path PowerShell script no arguments');
    inlineScript = '';
    scriptPath = getTestScriptPath('ps.ps1');
    scriptArguments = '';
    invokeFabricCLI(scriptType, inlineScript, scriptPath, scriptArguments);
    console.log('');

    console.log('executing path PowerShell script with arguments');
    inlineScript = '';
    scriptPath = getTestScriptPath('ps_with_args.ps1');
    scriptArguments = 'hello worldbfbbf';
    invokeFabricCLI(scriptType, inlineScript, scriptPath, scriptArguments);
    console.log('');

    console.log('ps failure tests - should not pass');

    console.log('executing inline PowerShell script with failure in script');
    let errorCaught = false;
    try {
        inlineScript = `
            Write-Output "hello mistake"
            fabric
        `;
        scriptPath = '';
        scriptArguments = '';
        invokeFabricCLI(scriptType, inlineScript, scriptPath, scriptArguments);
    } catch (err) {
        console.log('error caught - expected');
        errorCaught = true;
    }
    if (!errorCaught) {
        console.error('should have failed');
    }
    console.log('');

    console.log('executing inline PowerShell script with failure in CLI command');
    errorCaught = false;
    try {
        inlineScript = `
            Write-Output "hello mistake"
            fab cd notexisting.Workspace
        `;
        scriptPath = '';
        scriptArguments = '';
        invokeFabricCLI(scriptType, inlineScript, scriptPath, scriptArguments);
    } catch (err) {
        console.log('error caught - expected');
        errorCaught = true;
    }
    if (!errorCaught) {
        console.error('should have failed');
    }
    console.log('');
}

function testWindowsBatch(byDisplayName) {
    if (!isWindows()) {
        skipTest('Windows Batch tests', `Running on ${getPlatformName()}, not Windows`);
        return;
    }

    console.log('------------------------------------------------------------------------');
    console.log('WINDOWS BATCH TESTS - Running on Windows');

    let scriptType = 'batch';
    let scriptPath = '';
    let inlineScript = `
    @echo off
    fab cd test-1.Workspace
    echo success
    `;
    let scriptArguments = '';

    console.log('batch success tests - should pass');

    console.log('executing inline batch script no arguments');
    invokeFabricCLI(scriptType, inlineScript, scriptPath, scriptArguments);
    console.log('');

    inlineScript = `
    @echo off
    fab -c "create demo.Workspace -P capacityname=none" -c "cd demo.Workspace" -c "dir"
    echo yessssssss
    `;
    invokeFabricCLI(scriptType, inlineScript, scriptPath, scriptArguments);
    console.log('');

    console.log('executing inline batch script with arguments');
    scriptArguments = 'hello world';
    inlineScript = `
    @echo off
    set "First=%~1"
    set "Second=%~2"

    echo First argument: %First%
    echo Second argument: %Second%

    if "%First%"=="" (
        echo No first argument provided!
    ) else (
        echo You passed %First% as the first argument.
    )
    `;
    invokeFabricCLI(scriptType, inlineScript, scriptPath, scriptArguments);
    console.log('');

    console.log('executing path batch script no arguments');
    inlineScript = '';
    scriptPath = getTestScriptPath('batch.bat');
    scriptArguments = '';
    invokeFabricCLI(scriptType, inlineScript, scriptPath, scriptArguments);
    console.log('');

    console.log('executing path batch script with arguments');
    inlineScript = '';
    scriptPath = getTestScriptPath('batch_with_args.bat');
    scriptArguments = 'hello worldbfbbf';
    invokeFabricCLI(scriptType, inlineScript, scriptPath, scriptArguments);
    console.log('');

    console.log('batch failure tests - should not pass');

    console.log('executing inline batch script with failure in script');
    let errorCaught = false;
    try {
        inlineScript = `
            @echo off
            echo "hello mistake"
            fabric
        `;
        scriptPath = '';
        scriptArguments = '';
        invokeFabricCLI(scriptType, inlineScript, scriptPath, scriptArguments);
    } catch (err) {
        console.log('error caught - expected');
        errorCaught = true;
    }
    if (!errorCaught) {
        console.error('should have failed');
    }
    console.log('');

    console.log('executing inline batch script with failure in CLI command');
    errorCaught = false;
    try {
        inlineScript = `
            @echo off
            echo "hello mistake"
            fab cd notexisting.Workspace
        `;
        scriptPath = '';
        scriptArguments = '';
        invokeFabricCLI(scriptType, inlineScript, scriptPath, scriptArguments);
    } catch (err) {
        console.log('error caught - expected');
        errorCaught = true;
    }
    if (!errorCaught) {
        console.error('should have failed');
    }
    console.log('');
}

function testLinuxBash(byDisplayName) {
    if (!isLinux()) {
        skipTest('Linux Bash tests', `Running on ${getPlatformName()}, not Linux`);
        return;
    }

    console.log('------------------------------------------------------------------------');
    console.log('LINUX BASH TESTS - Running on Linux');

    let scriptType = 'bash';
    let scriptPath = '';
    let inlineScript = `
    #!/bin/bash
    fab cd test-1.Workspace
    echo "success"
    `;
    let scriptArguments = '';

    console.log('bash success tests - should pass');

    console.log('executing inline bash script no arguments');
    invokeFabricCLI(scriptType, inlineScript, scriptPath, scriptArguments);
    console.log('');

    console.log('executing inline bash script - fab dir');
    inlineScript = `
    #!/bin/bash
    fab dir
    `;
    invokeFabricCLI(scriptType, inlineScript, scriptPath, scriptArguments);
    console.log('');

    console.log('executing inline bash script with arguments');
    scriptArguments = 'hello world';
    inlineScript = `
    #!/bin/bash
    FIRST=$1
    SECOND=$2

    echo "First argument: $FIRST"
    echo "Second argument: $SECOND"

    if [ -z "$FIRST" ]; then
        echo "No first argument provided!"
    else
        echo "You passed $FIRST as the first argument."
    fi
    `;
    invokeFabricCLI(scriptType, inlineScript, scriptPath, scriptArguments);
    console.log('');

    console.log('executing path bash script no arguments');
    inlineScript = '';
    scriptPath = getTestScriptPath('bash.sh');
    scriptArguments = '';
    invokeFabricCLI(scriptType, inlineScript, scriptPath, scriptArguments);
    console.log('');

    console.log('executing path bash script with arguments');
    inlineScript = '';
    scriptPath = getTestScriptPath('bash_with_args.sh');
    scriptArguments = 'hello worldbfbbf';
    invokeFabricCLI(scriptType, inlineScript, scriptPath, scriptArguments);
    console.log('');

    console.log('bash failure tests - should not pass');

    console.log('executing inline bash script with failure in script');
    let errorCaught = false;
    try {
        inlineScript = `
            #!/bin/bash
            echo "hello mistake"
            fabric
        `;
        scriptPath = '';
        scriptArguments = '';
        invokeFabricCLI(scriptType, inlineScript, scriptPath, scriptArguments);
    } catch (err) {
        console.log('error caught - expected');
        errorCaught = true;
    }
    if (!errorCaught) {
        console.error('should have failed');
    }
    console.log('');

    console.log('executing inline bash script with failure in CLI command');
    errorCaught = false;
    try {
        inlineScript = `
            #!/bin/bash
            echo "hello mistake"
            fab cd notexisting.Workspace
        `;
        scriptPath = '';
        scriptArguments = '';
        invokeFabricCLI(scriptType, inlineScript, scriptPath, scriptArguments);
    } catch (err) {
        console.log('error caught - expected');
        errorCaught = true;
    }
    if (!errorCaught) {
        console.error('should have failed');
    }
    console.log('');
}

function testCrossPlatform(byDisplayName) {
    console.log('------------------------------------------------------------------------');
    console.log(`CROSS-PLATFORM TESTS - Running on ${getPlatformName()}`);

    // These tests use the fabric CLI directly with basic commands that should work on all platforms
    let scriptType = isWindows() ? 'ps' : 'bash';
    let scriptPath = '';
    let scriptArguments = '';

    console.log('cross-platform success tests - should pass');

    console.log('executing basic fabric CLI version check');
    let inlineScript = isWindows() ?
        'fab --version' :
        '#!/bin/bash\nfab --version';
    
    try {
        invokeFabricCLI(scriptType, inlineScript, scriptPath, scriptArguments);
        console.log('Version check completed successfully');
    } catch (err) {
        console.log('Version check failed (may be expected if fabric CLI not in PATH)');
    }
    console.log('');

    console.log('executing basic fabric CLI help');
    inlineScript = isWindows() ?
        'fab --help' :
        '#!/bin/bash\nfab --help';
    
    try {
        invokeFabricCLI(scriptType, inlineScript, scriptPath, scriptArguments);
        console.log('Help command completed successfully');
    } catch (err) {
        console.log('Help command failed (may be expected if fabric CLI not in PATH)');
    }
    console.log('');

    console.log('executing platform-specific echo test');
    inlineScript = isWindows() ?
        'Write-Output "Cross-platform test running on Windows"' :
        '#!/bin/bash\necho "Cross-platform test running on Linux"';
    
    invokeFabricCLI(scriptType, inlineScript, scriptPath, scriptArguments);
    console.log('');
}

function cleanupWorkspace() {
    try {
        let scriptType = isWindows() ? 'ps' : 'bash';
        let scriptPath = '';
        let scriptArguments = '';
        let inlineScript = 'fab rm test-1.Workspace -f';
        
        console.log('Cleaning up test workspace...');
        invokeFabricCLI(scriptType, inlineScript, scriptPath, scriptArguments);
        console.log('Test workspace cleanup completed');
    } catch (err) {
        console.log('Workspace cleanup failed (workspace may not exist):', err.message);
    }
}

function testHappyPath(byDisplayName) {
    console.log('========================================================================');
    console.log(`FABRIC CLI HAPPY PATH TESTS - Platform: ${getPlatformName()}`);
    console.log(`Test mode: ${byDisplayName ? 'By Display Name' : 'Standard'}`);
    console.log('========================================================================');

    // Initialize Fabric CLI once for all tests
    console.log('------------------------------------------------------------------------');
    console.log('Initializing Fabric CLI with service principal connection...');
    
    try {
        initializeCLI('v1.5.0', FabricConnection);
        console.log('CLI initialization completed successfully');
    } catch (err) {
        console.error('CLI initialization failed:', err.message);
        throw err;
    }

    // Clean up any existing test workspace before starting
    cleanupWorkspace();

    let scriptType = isWindows() ? 'ps' : 'bash';
    let scriptPath = '';
    let scriptArguments = '';
    
    try {
        //for test workspace creation
        let inlineScript = 'fab create test-1.Workspace -P capacityname=none';
        invokeFabricCLI(scriptType, inlineScript, scriptPath, scriptArguments);

        // Run platform-specific tests
        testWindowsPowerShell(byDisplayName);
        testWindowsBatch(byDisplayName);
        testLinuxBash(byDisplayName);
        
        // Run cross-platform tests
        testCrossPlatform(byDisplayName);

    } catch (err) {
        console.error('Test failed:', err.message);
        throw err; // Re-throw to maintain original error behavior
    } finally {
        // Always attempt cleanup, regardless of test success or failure
        cleanupWorkspace();
    }

    console.log('========================================================================');
    console.log(`ALL TESTS COMPLETED - Platform: ${getPlatformName()}`);
    console.log('========================================================================');
}

// Run tests
testHappyPath(false);
testHappyPath(true);