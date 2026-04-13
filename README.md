# Microsoft Fabric Extension for Azure DevOps

The **Microsoft Fabric Extension for Azure DevOps** brings first-class Fabric automation directly into your ADO pipelines. It adds the `FabricCLI@0` task, which automatically provisions the [Fabric CLI (`fab`)](https://aka.ms/fabriccli) into the pipeline agent — no manual installation required.

Use it to provision workspaces, deploy items, manage Git integration, trigger deployment pipelines, and fully automate your Fabric CI/CD workflows.

---

## Quick Start

1. **Install the extension** from the [Azure DevOps Marketplace](https://marketplace.visualstudio.com/items?itemName=ms-fabric-api.fabric-automation-tools-dev)
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
  # Generate a federated token from the ADO workload identity service connection.
  # See: https://learn.microsoft.com/en-us/azure/devops/pipelines/release/configure-workload-identity
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
      FabricCLIVersion: V1.5.0  
      inlineScript: |
        fab mkdir "MyWorkspace.Workspace" -P capacityname=$FAB_CAPACITY_NAME
```

See [Get started](doc/getting_started.md) for a complete walkthrough.

---

## Features

- **Zero-setup Fabric CLI** — the `fab` CLI is automatically provisioned by the task; no `pip install` needed.
- **Multi-platform scripting** — supports PowerShell, PowerShell Core, Bash, and Batch script types.
- **Inline or file-based scripts** — embed commands directly in YAML or point to a `.ps1`/`.sh` file in your repo.
- **Workspace management** — create, configure, and assign Fabric workspaces to capacities.
- **Item deployment** — publish notebooks, lakehouses, semantic models, pipelines, and more.
- **Git integration** — connect workspaces to ADO Git, commit changes, and sync from branches.
- **Deployment pipelines** — trigger stage promotions (Dev → Test → Prod) from CI/CD.
- **Version-pinned CLI** — pin a specific `FabricCLIVersion` for deterministic, reproducible builds.

---

## Task Reference

The extension provides one task: `FabricCLITask@0`.

| Input | Type | Required | Description |
| --- | --- | --- | --- |
| `scriptLanguage` | string | Yes | `ps`, `pscore`, `bash`, `batch` |
| `scriptType` | string | Yes | `inlineScript`, `scriptPath` |
| `inlineScript` | string | When `scriptType: inlineScript` | Script content embedded in YAML |
| `scriptPath` | string | When using file path | Path to `.ps1`, `.sh`, or `.bat` in source |
| `FabricCLIVersion` | string | Yes | Pin CLI version, e.g. `v1.5.0`. |

Full reference: [doc/task_reference.md](doc/task_reference.md)

---

## Documentation

| Guide | Description |
| --- | --- |
| [Get Started](doc/getting_started.md) | Installation, authentication, first pipeline |
| [Task Reference](doc/task_reference.md) | All `FabricCLITask@0` inputs and options |
| [Samples](doc/samples.md) | End-to-end YAML pipeline examples |
| [Permissions](doc/permissions.md) | Required roles and identity setup |
| Guide | Description |
| --- | --- |
| [Troubleshooting](doc/troubleshooting.md) | Common errors and fixes |
| [CLI Automation (Blog)](doc/fabric_cli_automation.md) | Deep-dive: zero-friction CI/CD with the Fabric CLI |

---

## Usage

**Inline script example (Bash):**

```yaml
- task: Bash@3
  displayName: 'Generate Federated Token'
  inputs:
    filePath: './generate-federated-token.sh'
    FabricCLIVersion: V1.5.0
    

- task: FabricCLITask@0
  env:
    FAB_SPN_CLIENT_ID: $(FAB_SPN_CLIENT_ID)
    FAB_TENANT_ID: $(FAB_TENANT_ID)
    FAB_SPN_FEDERATED_TOKEN: $(FEDERATED_TOKEN)
  inputs:
    scriptType: inlineScript
    inlineScript:
      fab ls
      fab mkdir "Dev-Workspace.Workspace" -P capacityname=$FAB_CAPACITY_NAME
```

**Script file example (PowerShell Core):**
```yaml
- task: FabricCLITask@0
  inputs:
    scriptType: inline
    scriptLanguage: pscore
    scriptPath: '$(Build.SourcesDirectory)/scripts/deploy-fabric.ps1'
    FabricCLIVersion: 'v1.5.0'
```

For help on any Fabric CLI command, [Fabric CLI (`fab`) documentation](https://aka.ms/fabriccli)

---

## Contribute

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to report bugs and request features.

- **Questions:** [Stack Overflow — tag `microsoft-fabric`](https://stackoverflow.com/questions/tagged/microsoft-fabric)
- **Bug reports:** [Issues](https://github.com/microsoft/fabric-ado-extension/issues)
- **Feature requests:** [Issues → Feature Request](https://github.com/microsoft/fabric-ado-extension/issues/new/choose)

---

## License

[MIT License](LICENSE)

---

## Related Resources

- [Microsoft Fabric REST API](https://learn.microsoft.com/rest/api/fabric/)
- [Fabric CLI (`fab`) documentation](https://aka.ms/fabriccli)
- [Microsoft Fabric CI/CD documentation](https://learn.microsoft.com/fabric/cicd/)
- [Azure DevOps Marketplace](https://marketplace.visualstudio.com/items?itemName=ms-pbi-api.pbi-publicapi-ado-extension)
