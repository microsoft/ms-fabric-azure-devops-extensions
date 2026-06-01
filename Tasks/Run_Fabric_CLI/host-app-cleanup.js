const tl = require('azure-pipelines-task-lib/task');

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
    'FAB_HOST_APP',
    'FAB_HOST_APP_VERSION'
];

async function postJobCleanup() {
    try {
        // Clear all Fabric CLI auth env vars as a job-level safety net,
        // in case the main task execution failed before its own cleanup ran.
        for (const envVar of FABRIC_AUTH_ENV_VARS) {
            if (process.env[envVar]) {
                tl.setVariable(envVar, '', false);
                process.env[envVar] = '';
            }
        }
        console.log('Post-job cleanup complete: Fabric CLI state cleared.');
    } catch (err) {
        tl.warning(`Post-job cleanup encountered an error: ${err.message}`);
    }
}

postJobCleanup();
