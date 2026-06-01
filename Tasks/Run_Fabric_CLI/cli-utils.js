const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');


const SUPPORTED_VERSIONS = new Set(["v1.5.0", "v1.6.1"]);

// SHA256 hashes of the expected wheel files from PyPI for each supported version
const VERSION_HASHES = {
    "v1.5.0": "sha256:18b9377eb73c4477ba0cb94bb9b578b6efd7e903125f68e7fe9668116e69b3b3",
    "v1.6.1": "sha256:a088338ec51539d04b9c2ee9816f1a000da5c39f5e0f9381e8703832b68aa768"
};

function installFabricCLIDeps(version) {
    const pipVersion = version.replace(/^v/, '');
    const command = `pip install ms-fabric-cli==${pipVersion} --index-url https://pypi.org/simple --force-reinstall --no-cache-dir`;
    try {
        const output = execSync(command, { encoding: 'utf-8' });
        return { success: true, errorMessage: null, output };
    } catch (err) {
        return { success: false, errorMessage: err.message, output: err.stdout?.toString() || '' };
    }
}

function installFabricCLIVersion(version) {
    const pipVersion = version.replace(/^v/, '');
    const hash = VERSION_HASHES[version];
    if (!hash) {
        return { success: false, errorMessage: `No known hash for version ${version}`, output: '' };
    }

    // --hash is only valid in requirements files, so write a temp requirements file
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fabric-ado-extension-cli-'));
    const reqFile = path.join(tempDir, 'requirements.txt');
    fs.writeFileSync(reqFile, `ms-fabric-cli==${pipVersion} --hash=${hash}\n`, { mode: 0o600 });

    // --no-deps since dependencies were already installed; --require-hashes verifies the CLI wheel hash
    const command = `pip install --require-hashes --no-deps --force-reinstall --no-cache-dir -r "${reqFile}"`;
    try {
        const output = execSync(command, { encoding: 'utf-8' });
        return { success: true, errorMessage: null, output };
    } catch (err) {
        return { success: false, errorMessage: err.message, output: err.stdout?.toString() || '' };
    } finally {
        // Clean up temp requirements file
        try { fs.unlinkSync(reqFile); fs.rmdirSync(tempDir); } catch (_) {}
    }
}

function installFabricCLI(fabricCLIVersion) {
    if (!SUPPORTED_VERSIONS.has(fabricCLIVersion)) {
        throw new Error(`Unsupported CLI version ${fabricCLIVersion}. Supported versions are: ${[...SUPPORTED_VERSIONS].join(", ")}`);
    }
    
    console.log(`installing version ${fabricCLIVersion}...`);

    // Step 1: Install the CLI with all dependencies via force-reinstall
    const depsResult = installFabricCLIDeps(fabricCLIVersion);
    if (!depsResult.success) {
        throw Error(`Dependency installation failed: ${depsResult.errorMessage}`);
    }

    // Step 2: Reinstall just the CLI package with hash verification
    const installResult = installFabricCLIVersion(fabricCLIVersion);

    if (installResult.success) {
        console.log(`Fabric CLI installation successful!`);
    } else {
        throw Error(`Installation failed: ${installResult.errorMessage}`);
    }
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
        // Create secure temporary directory with restrictive permissions (0o700 = rwx------)
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fabric-ado-extension-cli-'));
        scriptToRun = path.join(tempDir, `script.${fileExtension}`);
        
        // Write script with restrictive permissions
        fs.writeFileSync(scriptToRun, inlineScript, { mode: 0o600 });
    } else if (scriptPath) {
        // Validate and resolve the script path to prevent path traversal attacks
        const resolvedPath = path.resolve(scriptPath);
        const normalizedPath = path.normalize(resolvedPath);
        
        // Check for path traversal attempts
        if (normalizedPath.includes('..')) {
            throw Error(`Invalid script path: path traversal detected`);
        }
        
        // Verify the file exists and is accessible
        if (!fs.existsSync(normalizedPath)) {
            throw Error(`Script file not found: ${scriptPath}`);
        }
        
        scriptToRun = normalizedPath;
    } else {
        throw Error(`No ${fileExtension.toUpperCase()} script provided`);
    }
    
    return scriptToRun;
}

module.exports = {
    installFabricCLIVersion,
    installFabricCLI,
    enableContextPersistence,
    createScriptFile
};
