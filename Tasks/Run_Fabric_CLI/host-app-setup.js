const path = require('path');
const tl = require('azure-pipelines-task-lib/task');

// Identifies this ADO pipeline as the Fabric CLI host application.
// This value is picked up by the Fabric CLI for telemetry and context purposes.
const FAB_HOST_APP = 'Fabric-AzureDevops-Extension';

const taskJson = require(path.join(__dirname, 'task.json'));
const { Major, Minor, Patch } = taskJson.version;
const FAB_HOST_APP_VERSION = `${Major}.${Minor}.${Patch}`;

async function preJobSetup() {
    try {
        tl.setVariable('FAB_HOST_APP', FAB_HOST_APP);
        tl.setVariable('FAB_HOST_APP_VERSION', FAB_HOST_APP_VERSION);
    } catch (err) {
        tl.setResult(tl.TaskResult.Failed, `Pre-job setup failed: ${err.message}`);
    }
}

preJobSetup();
