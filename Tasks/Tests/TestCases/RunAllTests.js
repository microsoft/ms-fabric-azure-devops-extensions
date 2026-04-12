const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Path to config file
const configPath = '../Config/config.js'; // Use relative path for ES modules

// Check if config file exists
if (!fs.existsSync(path.resolve('./Config/config.js'))) {
    throw new Error(`
TEST ISSUE - make sure you have the following file with the correct template:
    ./Config/config.js
Template example:

const pbiConnection = {
    Auth: {
        Scheme: "UsernamePassword",
        Parameters: {
            Username: "***",
            Password: "***"
        }
    },
    Data: {
        Environment: "Public"
    }
};

const workspaceName = "***";
const workspaceId = "***";
const fileName = "***";
const userUpn = "***";

module.exports = {
    pbiConnection,
    workspaceName,
    workspaceId,
    fileName,
    userUpn
};
`);
}

// Load config
const { FabricConnection, workspaceName, workspaceId, fileName, userUpn } = require(configPath);

// Run tests
try {
    const testName = 'HappyPath.js';
    console.log(`Running Test: ${testName}`);

    // Execute the test file
    const testFilePath = path.resolve(`./TestCases/${testName}`);
    if (!fs.existsSync(testFilePath)) {
        throw new Error(`Test file not found: ${testFilePath}`);
    }

    // Use Node.js to run the test script
    execSync(`node "${testFilePath}"`, { stdio: 'inherit' });

    console.log(`Completed running Test: ${testName}`);
} catch (err) {
    console.error(`Test (${'HappyPath.js'}) Failed with: ${err.message}`);
    throw err;
}
``