const { installFabricCLI, connectFabricCLI ,enableContextPersistence} = require('./cli-utils');
const { execSync } = require('child_process');


function initializeCLI(fabricCLIVersion, fabricConnection , fabricCLIEncryption) {

    try {
        // Install CLI
        installFabricCLI(fabricCLIVersion);

        // Linux-specific encryption fallback config
        if (process.platform === 'linux' && fabricCLIEncryption === 'true') {
            execSync('fab config set encryption_fallback_enabled true', { encoding: 'utf8' });
        }
        
        // Detect authentication mode
        const modes = {
            "Token": ["FAB_TOKEN", "FAB_TENANT_ID"],
            "Token OneLake": ["FAB_TOKEN_ONELAKE", "FAB_TENANT_ID"],
            "Token Azure": ["FAB_TOKEN_AZURE", "FAB_TENANT_ID"],
            "SPN Secret": ["FAB_SPN_CLIENT_ID", "FAB_SPN_CLIENT_SECRET", "FAB_TENANT_ID"],
            "SPN Certificate": ["FAB_SPN_CLIENT_ID", "FAB_SPN_CERT_PATH", "FAB_TENANT_ID"],
            "SPN Federated": ["FAB_SPN_CLIENT_ID", "FAB_SPN_FEDERATED_TOKEN", "FAB_TENANT_ID"],
            "Managed Identity (System)": ["FAB_MANAGED_IDENTITY"],
            "Managed Identity (User)": ["FAB_MANAGED_IDENTITY", "FAB_SPN_CLIENT_ID"]
        };

        if(fabricConnection){
                connectFabricCLI(fabricConnection);
        }else{
            console.log('No fabric connection provided, attempting to detect authentication mode from environment variables.');
            let authenticated = false;
            for (const [mode, vars] of Object.entries(modes)) {
                const allSet = vars.every(v => process.env[v] && process.env[v].trim() !== '');
                if (allSet) {
                    console.log(`Authentication mode detected: ${mode}`);
                    authenticated = true;
                    break;
                }
            }

            if (!authenticated) {
                throw Error('No fabric connection provided.');
            }

        }

        // Force UTF-8
        process.env.PYTHONIOENCODING = 'utf-8';
        process.stdout.setDefaultEncoding('utf8');

        enableContextPersistence();

    } catch (err) {
        throw Error(`CLI initialization failed: ${err.message}`);
    }
}

module.exports = {
    initializeCLI
};
