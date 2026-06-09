# FabricCLI@0 — Task Reference

The `FabricCLI@0` task is the core task provided by the Microsoft Fabric Extension for Azure DevOps. It automatically provisions the Fabric CLI (`fab`) into the pipeline agent and executes your script.

---

## Syntax

```yaml
- task: FabricCLI@0
  displayName: 'string'         # optional label in pipeline logs
  env:
    FAB_SPN_CLIENT_ID: $(FAB_SPN_CLIENT_ID)
    FAB_TENANT_ID: $(FAB_TENANT_ID)
    FAB_SPN_FEDERATED_TOKEN: $(FEDERATED_TOKEN)   # always inject tokens via env:
  inputs:
    scriptLanguage: string        # required 
    scriptType: string           # required
    inlineScript: string         # required when scriptType is inlineScript
    scriptPath: string           # required when using a file-based script
   
    
```

---

## Inputs

### `scriptLanguage` *(required)*

Controls the scripting language and runner used to execute the script.

| Value | Language | Agent OS |
| --- | --- | --- |
| `ps` or `powershell` | Windows PowerShell | Windows |
| `pscore` | PowerShell Core (`pwsh`) | Windows, Linux, macOS |
| `bash` or `sh` | Bash / Shell | Linux, macOS |
| `batch` | Windows Batch (`.bat`) | Windows only |

**Recommendation:** Use `pscore` for cross-platform pipelines so the same YAML runs on Windows and Linux agents without modification.

---

### `inlineScript` *(required when scriptType is `Inline`)*

The script content to execute, written inline in the YAML. Must include Fabric CLI auth steps.

```yaml
inputs:
  scriptType: inLine
  scriptLanguage: pscore
  inlineScript: |
    fab ls
```

---

### `scriptPath` *(required when scriptType is `filePath`)*

Path to a script file in the repository. The file extension must match the `scriptType`:

```yaml
inputs:
  scriptType: filePath
  scriptLanguage: pscore
  scriptPath: '$(Build.SourcesDirectory)/scripts/deploy-fabric.ps1'
```

> **Tip:** Use `scriptPath` for shared deployment scripts version-controlled alongside Fabric artifacts. Use `inlineScript` for lightweight, pipeline-specific commands.

---

### `FabricCLIVersion` *(Required)*

Pins the Fabric CLI version to a specific release tag. If omitted, the task installs the latest stable version.

```yaml
inputs:
  FabricCLIVersion: 'v1.5.0'
```

**Best practice:** Pin the version in production pipelines and update it deliberately during controlled release windows. This prevents unexpected behavior from automatic CLI upgrades.

---

## Authentication

You authenticate inside your script using `fab auth login`or, preferably, by using environment variables in the task/pipeline setup.

For more information on authentication in the FabricCLI see: [Authentication Methods](https://microsoft.github.io/fabric-cli/#authentication-methods) and [Environment Variables](https://microsoft.github.io/fabric-cli/essentials/env_vars/)

---

## Task Output Variables

The task does not currently set output variables. Use ADO logging commands (`##vso[task.setvariable]`) inside your script to pass values between steps:

```powershell
$wsId = fab ls "MyWorkspace.Workspace"
Write-Host "##vso[task.setvariable variable=WorkspaceId;isOutput=true]$wsId"
```

---

## Notes

- The Fabric CLI is installed **per job** in a temporary location. It is not cached between jobs unless you configure a [pipeline cache](https://learn.microsoft.com/azure/devops/pipelines/release/caching).
- The task requires the agent to have internet access to download the CLI at runtime (when not pinned to a self-hosted agent with the CLI pre-installed).
- For regulated environments using self-hosted agents, pre-install the desired `fab` version and set `FabricCLIVersion` to match.
