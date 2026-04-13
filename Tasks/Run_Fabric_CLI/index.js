const tl = require('azure-pipelines-task-lib/task');
const { initializeCLI } = require('./cli-init');
const { invokeFabricCLI } = require('./cli-core');

// Fabric CLI environment variables used for authentication
// See: https://microsoft.github.io/fabric-cli/essentials/env_vars/
const FABRIC_AUTH_ENV_VARS = [
    'FAB_TOKEN',
    'FAB_TOKEN_ONELAKE',
    'FAB_TOKEN_AZURE',
    'FAB_TENANT_ID',
    'FAB_SPN_CLIENT_ID',
    'FAB_SPN_CLIENT_SECRET',
    'FAB_SPN_CERT_PATH',
    'FAB_SPN_CERT_PASSWORD',
    'FAB_SPN_FEDERATED_TOKEN',
    'FAB_MANAGED_IDENTITY',
];

async function cleanupFabricCLIState() {
    // Log out of the current Fabric CLI session
    try {
        const logoutTool = tl.tool(tl.which('fab', true));
        logoutTool.arg(['auth', 'logout']);
        await logoutTool.execAsync({ failOnStdErr: false, ignoreReturnCode: true });
    } catch (err) {
        tl.warning(`Failed to logout from Fabric CLI: ${err.message}`);
    }

    // Clear environment variables that may contain auth state
    for (const envVar of FABRIC_AUTH_ENV_VARS) {
        if (process.env[envVar]) {
            process.env[envVar] = '';
        }
    }

    // Disable context persistence to prevent auth context leaking to subsequent tasks
    try {
        const configTool = tl.tool(tl.which('fab', true));
        configTool.arg(['config', 'set', 'context_persistence_enabled', 'false']);
        await configTool.execAsync({ failOnStdErr: false, ignoreReturnCode: true });
    } catch (err) {
        tl.warning(`Failed to disable context persistence: ${err.message}`);
    }
}

async function run() {
    try {
        // Get Other Script Inputs
        const scriptLanguage = tl.getInput('scriptLanguage', true);
        const scriptPath = tl.getInput('scriptPath', false);
        const inlineScript = tl.getInput('inlineScript', false);
        const scriptArguments = tl.getInput('scriptArguments', false);
        const fabricCLIVersion = tl.getInput('FabricCLIVersion', false);

        // Initialize CLI
        initializeCLI(fabricCLIVersion);
        
        // Execute Fabric CLI
        await invokeFabricCLI(scriptLanguage, inlineScript, scriptPath, scriptArguments);
        
        tl.setResult(tl.TaskResult.Succeeded, 'Task completed successfully');

    } catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    } finally {
        await cleanupFabricCLIState();
    }
}

run();
