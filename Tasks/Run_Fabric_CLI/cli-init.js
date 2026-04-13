const { installFabricCLI, enableContextPersistence} = require('./cli-utils');


function initializeCLI(fabricCLIVersion) {

    try {
        // Install CLI
        installFabricCLI(fabricCLIVersion);

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
