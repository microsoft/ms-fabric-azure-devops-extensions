const { createScriptFile } = require('./cli-utils');
const os = require('os');
const fs = require('fs');
const path = require('path');
const tl = require('azure-pipelines-task-lib/task');

const WINDOWS = 'win32';
const LINUX = 'linux';

/**
 * Creates a PowerShell wrapper script that dot-sources the user's script with arguments.
 * This avoids embedding user arguments in the -Command string, preventing injection.
 */
function createPowerShellWrapper(scriptPath, scriptArguments) {
    const tempDir = tl.getVariable('Agent.TempDirectory') || os.tmpdir();
    const wrapperPath = path.join(tempDir, `fabricclitask_${Date.now()}.ps1`);

    const contents = [];
    let content = `. '${scriptPath.replace(/'/g, "''")}'`;
    if (scriptArguments) {
        content += ` ${scriptArguments}`;
    }
    contents.push(content);

    // Propagate exit code from the user script
    contents.push(`if (!(Test-Path -LiteralPath variable:\\LASTEXITCODE)) {`);
    contents.push(`    Write-Host '##vso[task.debug]$LASTEXITCODE is not set.'`);
    contents.push(`} else {`);
    contents.push(`    Write-Host ('##vso[task.debug]$LASTEXITCODE: {0}' -f $LASTEXITCODE)`);
    contents.push(`    exit $LASTEXITCODE`);
    contents.push(`}`);

    fs.writeFileSync(wrapperPath, '\ufeff' + contents.join(os.EOL), { encoding: 'utf8', mode: 0o600 });
    return wrapperPath;
}

async function invokeFabricCLI(scriptLanguage, inlineScript, scriptPath, scriptArguments = '') {
    const operatingSystem = os.platform();
    
    if(operatingSystem != WINDOWS &&  operatingSystem != LINUX) {
        throw new Error([
            " Unsupported environment.",
            `Reason: This task must be run in a Windows or Linux environment.`,
            `Current environment: ${operatingSystem}.`,
            "Fix: Switch to a supported environment and try again."
        ].join('\n'));
    }

    const config = {
        ps: {
            extension: 'ps1',
            command: 'powershell'
        },
        pscore: {
            extension: 'ps1',
            command: 'pwsh'
        },
        batch: {
            extension: 'bat',
            command: 'cmd.exe'
        },
        bash: {
            extension: 'sh',
            command: 'bash'
        }
    };

    const typeConfig = config[scriptLanguage];
    if (!typeConfig) {
        throw new Error(`Unsupported script type: ${scriptLanguage}`);
    }

    const defaultDir = tl.getVariable('System.DefaultWorkingDirectory');
    if(inlineScript && scriptPath && path.normalize(scriptPath)!== path.normalize(defaultDir)) {
        throw new Error('Both inline script and script path provided. Please provide only one.');
    }

    const scriptToRun = createScriptFile(inlineScript, scriptPath, typeConfig.extension);
    let wrapperScriptPath = null;

    try {
        let tool;
        let exitCode;

        switch (scriptLanguage) {
            case 'ps': {
                if(operatingSystem !== WINDOWS) {  
                    throw new Error([
                        " Unsupported environment.",
                        `Reason: This script type must be run in a Windows environment.`,
                        `Current environment: ${operatingSystem}.`,
                        "Fix: Switch to a supported environment and try again."
                    ].join('\n'));
                }

                wrapperScriptPath = createPowerShellWrapper(scriptToRun, scriptArguments);

                tool = tl.tool(tl.which('powershell', true))
                    .arg('-NoLogo')
                    .arg('-NoProfile')
                    .arg('-NonInteractive')
                    .arg('-ExecutionPolicy Unrestricted')
                    .arg('-Command')
                    .arg(`. '${wrapperScriptPath.replace(/'/g, "''")}'`);

                console.log(`Running PowerShell Fabric CLI script`);
                exitCode = await tool.execAsync({ failOnStdErr: false, ignoreReturnCode: true });
                break;
            }

            case 'pscore': {
                wrapperScriptPath = createPowerShellWrapper(scriptToRun, scriptArguments);

                tool = tl.tool(tl.which('pwsh', true))
                    .arg('-NoLogo')
                    .arg('-NoProfile')
                    .arg('-NonInteractive')
                    .arg('-ExecutionPolicy Unrestricted')
                    .arg('-Command')
                    .arg(`. '${wrapperScriptPath.replace(/'/g, "''")}'`);

                console.log(`Running PowerShell Core Fabric CLI script`);
                exitCode = await tool.execAsync({ failOnStdErr: false, ignoreReturnCode: true });
                break;
            }

            case 'batch': {
                if(operatingSystem !== WINDOWS) {
                    throw new Error([
                        " Unsupported environment.",
                        `Reason: This script type must be run in a Windows environment.`,
                        `Current environment: ${operatingSystem}.`,
                        "Fix: Switch to a supported environment and try again."
                    ].join('\n'));
                }

                tool = tl.tool(tl.which(scriptToRun, true));
                tool.line(scriptArguments || '');

                console.log(`Running Batch Fabric CLI script`);
                exitCode = await tool.execAsync({ failOnStdErr: false, ignoreReturnCode: true });
                break;
            }

            case 'bash': {
                if(operatingSystem !== LINUX) {
                    throw new Error([
                        " Unsupported environment.",
                        `Reason: This script type must be run in a Linux environment.`,
                        `Current environment: ${operatingSystem}.`,
                        "Fix: Switch to a supported environment and try again."
                    ].join('\n'));
                }

                tool = tl.tool(tl.which('bash', true));
                tool.arg(scriptToRun);
                tool.line(scriptArguments || '');

                console.log(`Running Bash Fabric CLI script`);
                exitCode = await tool.execAsync({ failOnStdErr: false, ignoreReturnCode: true });
                break;
            }

            default:
                throw new Error(`Unsupported script type: ${scriptLanguage}`);
        }

        if (exitCode !== 0) {
            throw new Error(`Script execution failed with exit code ${exitCode}`);
        }
    } finally {
        // Clean up wrapper script
        if (wrapperScriptPath && fs.existsSync(wrapperScriptPath)) {
            fs.unlinkSync(wrapperScriptPath);
        }
        // Clean up temp directory and file after execution
        if (inlineScript && fs.existsSync(scriptToRun)) {
            const tempDir = path.dirname(scriptToRun);
            // Remove the script file
            fs.unlinkSync(scriptToRun);
            // Remove the temporary directory if it starts with 'fabric-'
            if (path.basename(tempDir).startsWith('fabric-')) {
                fs.rmdirSync(tempDir);
            }
        }
    }
}


module.exports = {
    invokeFabricCLI
};
