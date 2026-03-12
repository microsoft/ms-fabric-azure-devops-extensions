const tl = require('azure-pipelines-task-lib/task');
const { initializeCLI } = require('./cli-init');
const { invokeFabricCLI } = require('./cli-core');
const { disconnectFabricCLI } = require('./cli-utils');

class fabricServiceConnection {
    constructor(authScheme, tenantId, servicePrincipalId, servicePrincipalKey) {
        this._authScheme = authScheme;
        this._tenantId = tenantId;
        this._servicePrincipalId = servicePrincipalId;
        this._servicePrincipalKey = servicePrincipalKey;
    }

    authScheme() {
        return this._authScheme;
    }       
    tenantId() {
        return this._tenantId;
    }
    servicePrincipalId() {
        return this._servicePrincipalId;
    }
    servicePrincipalKey() {
        return this._servicePrincipalKey;
    }
}

async function run() {
    try {
        // Get Fabric Connection
        const fabricConnectionName = tl.getInput('fabricConnection', false);
        let fabricConnection = null;
        if(fabricConnectionName){
            const authScheme = tl.getEndpointAuthorizationScheme(fabricConnectionName, true);
            if (authScheme === 'ServicePrincipal') {
                const tenantId = tl.getEndpointAuthorizationParameter(fabricConnectionName, 'TenantId', true);
                const servicePrincipalId = tl.getEndpointAuthorizationParameter(fabricConnectionName, 'Serviceprincipalid', true);
                const servicePrincipalKey = tl.getEndpointAuthorizationParameter(fabricConnectionName, 'Serviceprincipalkey', true);
                fabricConnection = new fabricServiceConnection(authScheme, tenantId, servicePrincipalId, servicePrincipalKey);
            }
            else if (authScheme === 'None') {
                // For system assigned managed identity, no parameters are needed
                fabricConnection = new fabricServiceConnection(authScheme, null, null, null);
            }
            else if (authScheme === 'ManagedIdentity') {
                // User assigned managed identity.
                const clientId = tl.getEndpointAuthorizationParameter(fabricConnectionName, 'ClientId', true);
                fabricConnection = new fabricServiceConnection(authScheme, clientId, null, null);
            }
        }

        // Get Other Script Inputs
        const scriptType = tl.getInput('scriptType', true);
        const scriptPath = tl.getInput('scriptPath', false);
        const inlineScript = tl.getInput('inlineScript', false);
        const scriptArguments = tl.getInput('scriptArguments', false);
        const fabricCLIVersion = tl.getInput('FabricCLIVersion', false);
        const fabricCLIEncryption = tl.getInput('FabricCLIEncryption', false);

        // Initialize CLI
        initializeCLI(fabricCLIVersion, fabricConnection, fabricCLIEncryption );
        
        // Execute Fabric CLI
        invokeFabricCLI(scriptType, inlineScript, scriptPath, scriptArguments);
        
        // Disconnect
        disconnectFabricCLI();
        tl.setResult(tl.TaskResult.Succeeded, 'Task completed successfully');

    } catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();
