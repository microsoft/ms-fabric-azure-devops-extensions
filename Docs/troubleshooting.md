# Troubleshooting Common Errors

This page covers the most frequent errors encountered when using the `FabricCLITask@0` task and how to resolve them.

---

## Authentication Errors

### `Error: Authentication failed — invalid or expired token`

**Cause:** The federated token is expired, malformed, or the `generate-federated-token.sh` step did not run successfully.

**Fix:**
1. Verify the workload identity service connection is correctly configured in ADO → Project Settings → Service connections.
2. Ensure the `Bash@3` federated token generation step runs **before** the `FabricCLITask@0` step.
3. Confirm you're injecting credentials via the `env:` block — not expanding them inline:
   ```yaml
   env:
     FAB_SPN_CLIENT_ID: $(FAB_SPN_CLIENT_ID)
     FAB_TENANT_ID: $(FAB_TENANT_ID)
     FAB_SPN_FEDERATED_TOKEN: $(FEDERATED_TOKEN)   # ✅
   ```
4. For troubleshooting, see [Troubleshoot workload identity service connections](https://learn.microsoft.com/en-us/azure/devops/pipelines/release/troubleshoot-workload-identity).

---

### `Error: 403 Forbidden` when calling Fabric APIs

**Cause:** The service connection's identity does not have the required Fabric permissions.

**Fix:**
1. In the [Fabric Admin Portal](https://app.fabric.microsoft.com/admin-portal), grant the identity **Contributor** (or higher) on the target workspace — see [Permissions](permissions.md).
2. If creating workspaces, ensure the identity has **Capacity admin** rights on the target capacity.

---

### `Error: AADSTS700016 — Application not found in tenant`

**Cause:** The Azure service connection is configured with an identity that doesn't exist in the target Entra tenant.

**Fix:**
1. In ADO → Project Settings → Service connections, verify the service connection's subscription and tenant.
2. Ensure the identity is registered in the correct Entra tenant.
3. For workload identity federation, see [Troubleshoot workload identity service connections](https://learn.microsoft.com/en-us/azure/devops/pipelines/release/troubleshoot-workload-identity).

---

## Task Input Errors

### `Error: Required input 'scriptType' is missing`

**Cause:** The `scriptType` input was omitted from the task YAML.

**Fix:** Add `scriptType` explicitly:
```yaml
inputs:
  scriptType: pscore     # or bash, ps, batch, inlineScript
  inlineScript: |
    fab auth login -u $env:FAB_SPN_CLIENT_ID --federated-token $env:FAB_SPN_FEDERATED_TOKEN --tenant $env:FAB_TENANT_ID
```

---

### `Error: Script file not found: $(Build.SourcesDirectory)/scripts/deploy.ps1`

**Cause:** The `scriptPath` references a file that doesn't exist in the checked-out source.

**Fix:**
1. Ensure you have a `- checkout: self` step **before** the `FabricCLITask@0` step.
2. Verify the file path is correct relative to the repository root.
3. Check that the file is committed and pushed to the branch triggering the pipeline.

---

### `Error: scriptType 'batch' is not supported on Linux agents`

**Cause:** Batch scripts only run on Windows agents.

**Fix:** Switch to `pscore` (PowerShell Core) for cross-platform support, or change the `vmImage` to `windows-latest`.

---

## Fabric CLI Errors

### `fab: command not found`

**Cause:** The Fabric CLI was not provisioned by the task — typically caused by using `PowerShell@2` or `Bash@3` tasks directly instead of `FabricCLITask@0`.

**Fix:** Use the `FabricCLITask@0` task. The CLI is automatically installed only when this task is used:
```yaml
- task: FabricCLITask@0   # ✅ CLI auto-installed
  ...
# NOT:
# - task: PowerShell@2    # ❌ No CLI available
```

---

### `fab mkdir` returns `Error: Capacity not found`

**Cause:** The `FAB_CAPACITY_NAME` is incorrect, or the capacity is in a different region or tenant.

**Fix:**
1. In the Fabric Admin Portal, go to **Capacity settings** and copy the exact capacity name.
2. Confirm the capacity is active (not paused or deleted).
3. Update `FAB_CAPACITY_NAME` in the ADO variable group.

---

### `fab auth login` hangs with no output

**Cause:** The agent lacks internet access to reach the Entra ID endpoints, or a proxy is blocking the authentication call.

**Fix:**
1. Verify the agent can reach `https://login.microsoftonline.com` and `https://api.fabric.microsoft.com`.
2. If behind a proxy, configure the proxy settings for the agent and set `HTTPS_PROXY` in the `env:` block.

---

## Pipeline / Variable Group Errors

### `Could not find a variable group named 'FabricSecrets'`

**Cause:** The variable group doesn't exist or hasn't been linked to the pipeline.

**Fix:**
1. In ADO, go to **Pipelines → Library** and confirm `FabricSecrets` exists.
2. In the variable group settings, go to **Pipeline permissions** and authorize the pipeline.
3. In the YAML, confirm the group is referenced at the correct scope:
   ```yaml
   variables:
     - group: FabricSecrets
   ```

---

### `$(FAB_SPN_FEDERATED_TOKEN)` appears as literal text in logs

**Cause:** The federated token variable was not correctly set by the `Bash@3` generation step, or the step did not run.

**Fix:**
1. Ensure the `generate-federated-token.sh` script sets the `FEDERATED_TOKEN` variable correctly using `##vso[task.setvariable]`.
2. Verify the `Bash@3` step runs successfully before the `FabricCLITask@0` step.
3. See [Troubleshoot workload identity service connections](https://learn.microsoft.com/en-us/azure/devops/pipelines/release/troubleshoot-workload-identity) for details.

---

## Getting More Help

- Review the [Getting Started guide](getting_started.md)
- Check [Permissions](permissions.md) for role requirements
- Ask on [Stack Overflow](https://stackoverflow.com/questions/tagged/microsoft-fabric) with the `microsoft-fabric` tag
- Open an issue on [GitHub](https://github.com/microsoft/fabric-ado-extension/issues)
