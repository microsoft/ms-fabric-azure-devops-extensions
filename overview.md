# Microsoft Fabric Extension for Azure DevOps

The **Microsoft Fabric Extension for Azure DevOps** brings first-class Fabric automation directly into your ADO pipelines. It adds the `FabricCLITask@0` task, which automatically provisions the [Fabric CLI (`fab`)](https://aka.ms/fabriccli) into the pipeline agent — no manual installation required.

Use it to provision workspaces, deploy items, manage Git integration, trigger deployment pipelines, and fully automate your Fabric CI/CD workflows.

## Features

- **Zero-setup Fabric CLI** — the `fab` CLI is automatically provisioned by the task; no `pip install` needed.
- **Multi-platform scripting** — supports PowerShell, PowerShell Core, Bash, and Batch script types.
- **Inline or file-based scripts** — embed commands directly in YAML or point to a `.ps1`/`.sh` file in your repo.
- **Workspace management** — create, configure, and assign Fabric workspaces to capacities.
- **Item deployment** — publish notebooks, lakehouses, semantic models, pipelines, and more.
- **Git integration** — connect workspaces to ADO Git, commit changes, and sync from branches.
- **Deployment pipelines** — trigger stage promotions (Dev → Test → Prod) from CI/CD.
- **Version-pinned CLI** — pin a specific `FabricCLIVersion` for deterministic, reproducible builds.

## Quick Start

1. **Install the extension** from the Azure DevOps Marketplace.
2. **Create a variable group** named `FabricSecrets` in ADO → Pipelines → Library:

   | Variable | Description | Secret? |
   |---|---|---|
   | `FAB_SPN_CLIENT_ID` | Service principal / managed identity client ID | No |
   | `FAB_TENANT_ID` | Microsoft Entra tenant ID | No |
   | `FAB_CAPACITY_NAME` | Target Fabric capacity name | No |

   > **Note:** No secrets are stored in the variable group. Authentication uses [workload identity federation](https://learn.microsoft.com/en-us/azure/devops/pipelines/release/configure-workload-identity) — the federated token is generated at pipeline runtime.

3. **Add the task** to your pipeline YAML:

```yaml
variables:
  - group: FabricSecrets

steps:
  - task: Bash@3
    displayName: 'Generate Federated Token'
    inputs:
      filePath: './generate-federated-token.sh'

  - task: FabricCLITask@0
    displayName: 'Create Fabric Workspace'
    env:
      FAB_SPN_CLIENT_ID: $(FAB_SPN_CLIENT_ID)
      FAB_TENANT_ID: $(FAB_TENANT_ID)
      FAB_SPN_FEDERATED_TOKEN: $(FEDERATED_TOKEN)
    inputs:
      scriptType: inlineScript
      inlineScript: |
        fab mkdir "MyWorkspace.Workspace" -P capacityname=$FAB_CAPACITY_NAME
```

## Task Reference

The extension provides one task: `FabricCLITask@0`.

| Input | Type | Required | Description |
|---|---|---|---|
| `scriptLanguage` | string | Yes | `ps`, `pscore`, `bash`, `batch` |
| `scriptType` | string | Yes | `inlineScript`, `scriptPath` |
| `inlineScript` | string | When `scriptType: inlineScript` | Script content embedded in YAML |
| `scriptPath` | string | When `scriptType: scriptPath` | Path to `.ps1`, `.sh`, or `.bat` in source |
| `scriptArguments` | string | No | Arguments passed to the script |
| `FabricCLIVersion` | string | No | Pin CLI version, e.g. `v1.5.0`. Defaults to latest. |

## Prerequisites

- An [Azure DevOps](https://dev.azure.com/) organization and project
- A [Microsoft Fabric](https://app.fabric.microsoft.com/) capacity (F2 or higher, or a trial capacity)
- An [Azure service connection](https://learn.microsoft.com/en-us/azure/devops/pipelines/library/service-endpoints) configured in your ADO project

## Related Resources

- [Microsoft Fabric REST API](https://learn.microsoft.com/rest/api/fabric/)
- [Fabric CLI (`fab`) documentation](https://aka.ms/fabriccli)
- [Microsoft Fabric CI/CD documentation](https://learn.microsoft.com/fabric/cicd/)
- [Workload identity federation setup](https://learn.microsoft.com/en-us/azure/devops/pipelines/release/configure-workload-identity)
