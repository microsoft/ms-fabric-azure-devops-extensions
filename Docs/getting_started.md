# Get Started with the Fabric ADO Extension

This guide walks you through installing the extension, setting up authentication, and running your first Fabric pipeline task.

---

## Prerequisites

- An [Azure DevOps](https://dev.azure.com/) organization and project
- A [Microsoft Fabric](https://app.fabric.microsoft.com/) capacity (F2 or higher, or a trial capacity)
- An [Azure service connection](https://learn.microsoft.com/en-us/azure/devops/pipelines/library/service-endpoints) configured in your ADO project — see [Permissions](permissions.md)

---

## 1 — Install the Extension

Install the **Microsoft Fabric Extension for Azure DevOps** from the Marketplace:

1. In your ADO organization, go to **Organization Settings → Extensions**
2. Click **Browse Marketplace**
3. Search for **Microsoft Fabric** and select the extension
4. Click **Get it free** and select your organization

Or install it directly from the Marketplace URL provided by your administrator.

> **Note:** Organization-level access is required to install extensions. Ask your ADO organization admin if you don't have this permission.

---

## 2 — Create a Variable Group for Fabric Configuration

The variable group stores non-secret configuration values. Authentication is handled by the Azure service connection — no secrets are stored here.

1. In ADO, go to **Pipelines → Library → + Variable Group**
2. Name it `FabricSecrets`
3. Add the following variables:

| Variable | Description | Secret? |
|---|---|---|
| `FAB_SPN_CLIENT_ID` | Service principal / managed identity client ID | No |
| `FAB_TENANT_ID` | Microsoft Entra tenant ID | No |
| `FAB_CAPACITY_NAME` | Target Fabric capacity name | No |

1. Save the variable group
2. Go to **Pipelines → Library → FabricSecrets → Pipeline permissions** and authorize the pipelines that will use it

---

## 3 — Configure a Workload Identity Service Connection

The pipeline uses a workload identity service connection to generate a federated token for Fabric CLI authentication at runtime.

1. In ADO, go to **Project Settings → Service connections → New service connection**
2. Select **Azure Resource Manager** and choose **Workload Identity federation (automatic)** or **Managed Identity**
3. Name the connection `FabricServiceConnection`
4. Grant the identity the necessary permissions to perform the actions you want in the pipeline" or something like that.

See [Permissions](permissions.md) for the full role reference.

> **Federated token generation:** The federated token is generated at pipeline runtime using a `Bash@3` step that calls `generate-federated-token.sh`. Add this step before the `FabricCLITask@0` task:
>
> ```yaml
> - task: Bash@3
>   displayName: 'Generate Federated Token'
>   inputs:
>     filePath: './generate-federated-token.sh'
> ```
>
> See [Set up a workload identity service connection](https://learn.microsoft.com/en-us/azure/devops/pipelines/release/configure-workload-identity) and [Troubleshoot workload identity](https://learn.microsoft.com/en-us/azure/devops/pipelines/release/troubleshoot-workload-identity) for details.

---

## 4 — Add the Task to Your Pipeline

The `FabricCLITask@0` task automatically installs the Fabric CLI (`fab`) on the agent — **no pip install step is required**.

### Minimal example

```yaml
trigger: none

pool:
  vmImage: 'ubuntu-latest'

variables:
  - group: FabricSecrets

steps:
  - task: Bash@3
    displayName: 'Generate Federated Token'
    inputs:
      filePath: './generate-federated-token.sh'

  - task: FabricCLITask@0
    displayName: 'Log in to Fabric and list workspaces'
    env:
      FAB_SPN_CLIENT_ID: $(FAB_SPN_CLIENT_ID)
      FAB_TENANT_ID: $(FAB_TENANT_ID)
      FAB_SPN_FEDERATED_TOKEN: $(FEDERATED_TOKEN)
    inputs:
      scriptType: inlineScript
      CLIversion: 'V1.5.0'
      inlineScript:
        fab ls
```

### Key pattern: pass credentials via `env:`

> See [CLI support Environment variables] (<https://microsoft.github.io/fabric-cli/essentials/env_vars/?h=env>)

Always inject `FAB_SPN_CLIENT_ID`, `FAB_TENANT_ID`, and `FAB_SPN_FEDERATED_TOKEN` through the `env:` block rather than expanding them directly in the script. This prevents credentials from being echoed in pipeline logs.

```yaml
env:
  FAB_SPN_CLIENT_ID: $(FAB_SPN_CLIENT_ID)             # ✅ Safe — env injection
  FAB_TENANT_ID: $(FAB_TENANT_ID)                      # ✅ Safe — env injection
  FAB_SPN_FEDERATED_TOKEN: $(FEDERATED_TOKEN)          # ✅ Safe — env injection
# NOT:
# inlineScript: fab auth login -u "$(FAB_SPN_CLIENT_ID)" ...  # ❌ Logged in plain text
```

---

## 5 — End-to-End Example: Provision a Workspace

```yaml
trigger: none

parameters:
  - name: workspaceName
    displayName: 'Workspace display name'
    type: string
    default: 'MyFabricWorkspace'

pool:
  vmImage: 'ubuntu-latest'

variables:
  - group: FabricSecrets

stages:
  - stage: ProvisionWorkspace
    displayName: 'Provision Fabric Workspace'
    jobs:
      - job: CreateAndAssign
        displayName: 'Create workspace and assign to capacity'
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
              CLIversion: 'V1.5.0'
              inlineScript:
                $ErrorActionPreference = 'Stop'

                Write-Host "##[group]Creating workspace..."
                fab mkdir "${{ parameters.workspaceName }}.Workspace" -P capacityname="$(FAB_CAPACITY_NAME)"
                Write-Host "##[endgroup]"
```

---

## 6 — Verify the Configuration

After the pipeline runs:

1. Open [app.fabric.microsoft.com](https://app.fabric.microsoft.com)
2. You should see the new workspace in **My workspaces** or the capacity's workspace list
3. Check the ADO pipeline logs — each `fab` command logs its output

---

## Next Steps

| Guide | Description |
|---|---|
| [Task Reference](task_reference.md) | All `FabricCLITask@0` inputs and script types |
| [Samples](samples.md) | Git integration, deployment pipelines, multi-stage examples |
| [Permissions](permissions.md) | Full role and permission reference |
| [Troubleshooting](troubleshooting.md) | Common errors and fixes |
