const { createScriptFile, stripArguments } = require('./cli-utils');
const { spawnSync } = require('child_process');
const he = require('he');
const os = require('os');
const fs = require('fs');
const path = require('path');
const tl = require('azure-pipelines-task-lib/task');

const WINDOWS = 'win32';
const LINUX = 'linux';

function invokeFabricCLI(scriptType, inlineScript, scriptPath, scriptArguments = '') {
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
            command: 'powershell.exe'
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

    const typeConfig = config[scriptType];
    if (!typeConfig) {
        throw new Error(`Unsupported script type: ${scriptType}`);
    }

    const defaultDir = tl.getVariable('System.DefaultWorkingDirectory');
    if(inlineScript && scriptPath && path.normalize(scriptPath)!== path.normalize(defaultDir)) {
        throw new Error('Both inline script and script path provided. Please provide only one.');
    }

    const scriptToRun = createScriptFile(inlineScript, scriptPath, typeConfig.extension);
    const argsArray = stripArguments(scriptArguments);

    try {
        switch (scriptType) {
            case 'ps': {
                if(operatingSystem !== WINDOWS) {  
                    throw new Error([
                        " Unsupported environment.",
                        `Reason: This script type must be run in a Windows environment.`,
                        `Current environment: ${operatingSystem}.`,
                        "Fix: Switch to a supported environment and try again."
                    ].join('\n'));
                }
                const psArgs = [
                    '-NoProfile',
                    '-NonInteractive',
                    '-ExecutionPolicy', 'Bypass',
                    '-Command',
                    `& { & '${scriptToRun}' ${argsArray.join(' ')}; exit $LASTEXITCODE }`
                ];

                console.log(`Running PowerShell Fabric CLI script`);

                const output = spawnSync('powershell.exe', psArgs, { encoding: 'utf-8' });

                if (output.status !== 0) {
                    throw new Error(`Script execution failed with exit code ${output.status}:\n${output.stdout}`);
                }

                const decodedOutput = he.decode(output.stdout);
                console.log(`Output:\n${decodedOutput}`);
                break;
            }

            
            case 'pscore': {
                // PowerShell Core is cross-platform, so no Windows-only check
                const psArgs = [
                    '-NoProfile',
                    '-NonInteractive',
                    '-ExecutionPolicy', 'Bypass',
                    '-Command',
                    `& { & '${scriptToRun}' ${argsArray.join(' ')}; exit $LASTEXITCODE }`
                ];

                console.log(`Running PowerShell Core Fabric CLI script`);

                const output = spawnSync('pwsh', psArgs, { encoding: 'utf-8' });

                if (output.status !== 0) {
                    throw new Error(`Script execution failed with exit code ${output.status}:\n${output.stdout}`);
                }

                const decodedOutput = he.decode(output.stdout);
                console.log(`Output:\n${decodedOutput}`);
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
                const batchArgs = [
                    '/c', // tells cmd to run and exit
                    `${scriptToRun} ${argsArray.join(' ')}` // script name + arguments
                ];

                console.log(`Running Batch Fabric CLI script`);

                const output = spawnSync('cmd.exe', batchArgs, { encoding: 'utf-8' });

                if (output.status !== 0) {
                    throw new Error(`Script execution failed with exit code ${output.status}:\n${output.stdout}`);
                }

                const decodedOutput = he.decode(output.stdout);
                console.log(`Output:\n${decodedOutput}`);
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
                const bashArgs = [scriptToRun, ...argsArray];

                console.log(`Running Bash Fabric CLI script`);

                const output = spawnSync('bash', bashArgs, { encoding: 'utf-8' });

                if (output.status !== 0) {
                    throw new Error(`Script execution failed with exit code ${output.status}:\n${output.stdout}`);
                }

                const decodedOutput = he.decode(output.stdout);
                console.log(`Output:\n${decodedOutput}`);
                break;
            }

            default:
                throw new Error(`Unsupported script type: ${scriptType}`);
        }
    } catch (err) {
        const decodedErrorMessage = he.decode(err.message || err.toString());
        const decodedError = new Error(decodedErrorMessage);
        decodedError.stack = err.stack;
        throw decodedError;
    } finally {
        // Clean up temp file after execution
        if (inlineScript && fs.existsSync(scriptToRun)) {
            fs.unlinkSync(scriptToRun);
        }
    }
}


module.exports = {
    invokeFabricCLI
};
