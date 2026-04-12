const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');


const SUPPORTED_VERSIONS = new Set(["v1.2.0", "v1.1.0"]);


function getFabricCLIVersion() {
    try {
        const output = execSync('pip show ms-fabric-cli', { encoding: 'utf-8' });
        const versionLine = output.split('\n').find(line => line.startsWith('Version:'));
        if (versionLine) {
            const version = versionLine.split(':')[1].trim();
            console.log(`Detected Fabric CLI version: v${version}`);
            return `v${version}`;
        }
        return null;
    } catch (err) {
        return null;
    }
}

function installFabricCLIVersion(version) {
    const pipVersion = version.replace(/^v/, '');
    const command = `pip install ms-fabric-cli==${pipVersion}`;
    try {
        const output = execSync(command, { encoding: 'utf-8' });
        return { success: true, errorMessage: null, output };
    } catch (err) {
        return { success: false, errorMessage: err.message, output: err.stdout?.toString() || '' };
    }
}

function installFabricCLI(fabricCLIVersion) {
    if (!SUPPORTED_VERSIONS.has(fabricCLIVersion)) {
        throw new Error(`Unsupported CLI version ${fabricCLIVersion}. Supported versions are: ${[...SUPPORTED_VERSIONS].join(", ")}`);
    }

    console.log(`Verifying Fabric CLI version ${fabricCLIVersion} installation`);
    
    let installResult;
    const currentVersion = getFabricCLIVersion();

    if (currentVersion !== fabricCLIVersion) {
            console.log(`installing version ${fabricCLIVersion}...`);
            installResult = installFabricCLIVersion(fabricCLIVersion);
        } else {
            console.log(`Requested version ${fabricCLIVersion} is already installed. No action needed.`);
            return;
        }

    if (installResult.success) {
        console.log(`Fabric CLI installation successful!`);
    } else {
        throw Error(`Installation failed: ${installResult.errorMessage}`);
    }
}

function disconnectFabricCLI() {
    try {
        execSync('fab auth logout', { stdio: 'ignore' });
        return true;
    } catch (err) {
        console.error('Failed to logout from Fabric CLI:', err.message);
        return false;
    }
}

function connectFabricCLI(fabricConnection) {
    const authScheme = fabricConnection.authScheme();
    let args;

    console.log(`Connecting to Fabric CLI with ${authScheme}`);

    if (authScheme === 'ServicePrincipal') {
        const tenantId = fabricConnection.tenantId();
        const clientId = fabricConnection.servicePrincipalId();
        const clientSecret = fabricConnection.servicePrincipalKey();

        args = [
            'auth', 'login',
            '-u', clientId,
            '-p', clientSecret,
            '--tenant', tenantId
        ];
    } else if (authScheme === 'None') {
        // System Assigned Managed Identity
        args = [
            'auth', 'login',
            '--identity'
        ];
    } else if (authScheme === 'ManagedIdentity') {
        // User assigned managed identity..
        const clientId = fabricConnection.tenantId();

        args = [
            'auth', 'login',
            '--identity',
            '-u', clientId
        ];
    } else {
        throw new Error('Login unsuccessful - unsupported connection configuration');
    }

    const result = spawnSync('fab', args , {
            stdio: 'inherit',
            shell: false // IMPORTANT: ensures no shell injection
        });

    if (result.error) {
        console.error('Failed to login to Fabric CLI:', result.error.message);
        throw result.error;
    }

    if (result.status !== 0) {
        throw new Error(`Fabric CLI login failed with exit code ${result.status}`);
    }

    console.log('Logged in to Fabric CLI successfully');
}

function enableContextPersistence() {
    const key = 'context_persistence_enabled';

    const getResult = spawnSync('fab', ['config', 'get', key], {
        encoding: 'utf8',
        shell: false
    });

    // If exit code != 0 → key does NOT exist
    if (getResult.status !== 0) {
        throw Error(`${key} does NOT exist for this Fabric CLI version.`);
    }

    const currentValue = (getResult.stdout || '').trim();

    // If it's already true → return true without setting
    if (currentValue !== 'true') {
        const setResult = spawnSync('fab', ['config', 'set', key, 'true'], {
            encoding: 'utf8',
            shell: false
        });

        if (setResult.status !== 0) {
            throw Error(`Failed to set ${key}.`);
        }
    }
}

function createScriptFile(inlineScript, scriptPath, fileExtension) {
    let scriptToRun;
    
    if (inlineScript) {
        scriptToRun = path.join(os.tmpdir(), `fabric_${Date.now()}.${fileExtension}`);
        fs.writeFileSync(scriptToRun, inlineScript);
    } else if (scriptPath) {
        scriptToRun = path.resolve(scriptPath);
    } else {
        throw Error(`No ${fileExtension.toUpperCase()} script provided`);
    }
    
    return scriptToRun;
}

function stripArguments(scriptArguments) {
    const argsArray = scriptArguments.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    return argsArray;
}

module.exports = {
    getFabricCLIVersion,
    installFabricCLIVersion,
    installFabricCLI,
    enableContextPersistence,
    disconnectFabricCLI,    
    connectFabricCLI,
    createScriptFile,
    stripArguments
};
