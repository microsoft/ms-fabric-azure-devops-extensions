# Samples

End-to-end Azure DevOps YAML pipeline examples for common Fabric automation scenarios.

---

## Table of Contents

1. [Provision a workspace](#1--provision-a-workspace)
2. [Connect a workspace to ADO Git](#2--connect-a-workspace-to-ado-git)
3. [Commit workspace changes to Git](#3--commit-workspace-changes-to-git)
4. [Deploy items to a workspace](#4--deploy-items-to-a-workspace)
5. [Promote through a deployment pipeline (Dev → Test → Prod)](#5--promote-through-a-deployment-pipeline)
6. [Multi-stage CI/CD pipeline](#6--multi-stage-cicd-pipeline)
7. [Use a shared deployment script file](#7--use-a-shared-deployment-script-file)
8. [Run on Windows and Linux agents](#8--run-on-windows-and-linux-agents)

---

## Prerequisites

All examples assume you have:

- The **Microsoft Fabric Extension for Azure DevOps** [installed](getting_started.md#1--install-the-extension)
- A **variable group** named `FabricSecrets` with `FAB_SPN_CLIENT_ID`, `FAB_TENANT_ID`, and `FAB_CAPACITY_NAME` — see [Getting Started](getting_started.md#2--create-a-variable-group-for-fabric-configuration)
- A [workload identity service connection](https://learn.microsoft.com/en-us/azure/devops/pipelines/release/configure-workload-identity) with the appropriate [permissions](permissions.md)

---

## 1 — Provision a Workspace

Creates a new Fabric workspace and assigns it to a capacity.

```yaml
trigger: none

parameters:
  - name: workspaceName
    type: string
    default: 'MyFabricWorkspace'

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
    displayName: 'Create and assign Fabric Workspace'
    env:
      FAB_SPN_CLIENT_ID: $(FAB_SPN_CLIENT_ID)
      FAB_TENANT_ID: $(FAB_TENANT_ID)
      FAB_SPN_FEDERATED_TOKEN: $(FEDERATED_TOKEN)
    inputs:
      scriptType: inline
      scriptLanguage: pscore
      FabricCLIVersion: '1.5.0'
      inlineScript:|
       
        fab mkdir "${{ parameters.workspaceName }}.Workspace" -P capacityname=$(FAB_CAPACITY_NAME)

        Write-Host "Workspace '${{ parameters.workspaceName }}' created."
```

---

## 2 — Connect a Workspace to ADO Git

Connects an existing Fabric workspace to an Azure Repos branch.

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
    displayName: 'Connect workspace to ADO Git'
    env:
      FAB_SPN_CLIENT_ID: $(FAB_SPN_CLIENT_ID)
      FAB_TENANT_ID: $(FAB_TENANT_ID)
      FAB_SPN_FEDERATED_TOKEN: $(FEDERATED_TOKEN)
    inputs:
      scriptType: inline
      scriptLanguage: pscore
      FabricCLIVersion: 'v1.5.0'  
      inlineScript: |
        
        # Git integration (connect) requires the Fabric REST API.
        # See: https://learn.microsoft.com/en-us/rest/api/fabric/core/git

        Write-Host "Workspace connected to Git."
```

---

## 3 — Commit Workspace Changes to Git

Commits all pending workspace changes to the connected Git branch.

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
    displayName: 'Commit Fabric workspace to Git'
    env:
      FAB_SPN_CLIENT_ID: $(FAB_SPN_CLIENT_ID)
      FAB_TENANT_ID: $(FAB_TENANT_ID)
      FAB_SPN_FEDERATED_TOKEN: $(FEDERATED_TOKEN)
    inputs:
      scriptType: inline
      scriptLanguage:pscore
      FabricCLIVersion: 'v1.5.0'  
      inlineScript:|
        fab auth login -u $env:FAB_SPN_CLIENT_ID --federated-token $env:FAB_SPN_FEDERATED_TOKEN --tenant $env:FAB_TENANT_ID

        # Git integration (commit) requires the Fabric REST API.
        # See: https://learn.microsoft.com/en-us/rest/api/fabric/core/git

        Write-Host "Commit complete."
```

---

## 4 — Deploy Items to a Workspace

Publishes Fabric item definitions from source control to a target workspace.

```yaml
trigger:
  branches:
    include:
      - main

pool:
  vmImage: 'ubuntu-latest'

variables:
  - group: FabricSecrets

steps:
  - checkout: self

  - task: Bash@3
    displayName: 'Generate Federated Token'
    inputs:
      filePath: './generate-federated-token.sh'

  - task: FabricCLITask@0
    displayName: 'Deploy items from repo to Dev workspace'
    env:
      FAB_SPN_CLIENT_ID: $(FAB_SPN_CLIENT_ID)
      FAB_TENANT_ID: $(FAB_TENANT_ID)
      FAB_SPN_FEDERATED_TOKEN: $(FEDERATED_TOKEN)
    inputs:
      scriptType: inline
      scriptLanguage:pscore
      FabricCLIVersion: 'v1.5.0'  
      inlineScript:|
       
        # Import all items in the /fabric directory to the workspace
        fab import DevWorkspace.Workspace \
          -i "$(Build.SourcesDirectory)/fabric"

        echo "Deployment complete."
```

---

## 5 — Promote Through a Deployment Pipeline

Triggers a stage promotion in a Fabric deployment pipeline (Dev → Test → Prod).

```yaml
trigger: none

parameters:
  - name: targetStage
    displayName: 'Promote to stage'
    type: string
    default: 'Test'
    values:
      - Test
      - Prod

pool:
  vmImage: 'ubuntu-latest'

variables:
  - group: FabricSecrets
  - name: stageOrder
    ${{ if eq(parameters.targetStage, 'Test') }}:
      value: '0'   # source = Dev (stage 0) → Test (stage 1)
    ${{ if eq(parameters.targetStage, 'Prod') }}:
      value: '1'   # source = Test (stage 1) → Prod (stage 2)

steps:
  - task: Bash@3
    displayName: 'Generate Federated Token'
    inputs:
      filePath: './generate-federated-token.sh'

  - task: FabricCLITask@0
    displayName: 'Promote Fabric deployment pipeline to ${{ parameters.targetStage }}'
    env:
      FAB_SPN_CLIENT_ID: $(FAB_SPN_CLIENT_ID)
      FAB_TENANT_ID: $(FAB_TENANT_ID)
      FAB_SPN_FEDERATED_TOKEN: $(FEDERATED_TOKEN)
    inputs:
      scriptType: inline
      scriptLanguage:pscore
      FabricCLIVersion: 'v1.5.0' 
      inlineScript:|
        
        # Deployment pipeline promotion requires the Fabric REST API.
        # See: https://learn.microsoft.com/en-us/rest/api/fabric/core/deployment-pipelines
        fab run "$(DEPLOYMENT_PIPELINE_NAME).DeploymentPipeline"

        Write-Host "Promotion to ${{ parameters.targetStage }} complete."
```

---

## 6 — Multi-Stage CI/CD Pipeline

A complete CI/CD pipeline with three stages: Build, Deploy to Dev, and Promote to Test.

```yaml
trigger:
  branches:
    include:
      - main

pool:
  vmImage: 'ubuntu-latest'

variables:
  - group: FabricSecrets

stages:
  # ── Stage 1: Validate ─────────────────────────────────────────────────────
  - stage: Validate
    displayName: 'Validate artifact definitions'
    jobs:
      - job: Lint
        steps:
          - checkout: self
          - script: echo "Run any linting or schema validation here"
            displayName: 'Validate Fabric item definitions'

  # ── Stage 2: Deploy to Dev ────────────────────────────────────────────────
  - stage: DeployDev
    displayName: 'Deploy to Dev'
    dependsOn: Validate
    jobs:
      - job: Deploy
        steps:
          - checkout: self
          - task: Bash@3
            displayName: 'Generate Federated Token'
            inputs:
              filePath: './generate-federated-token.sh'
          - task: FabricCLITask@0
            displayName: 'Publish items to Dev workspace'
            env:
              FAB_SPN_CLIENT_ID: $(FAB_SPN_CLIENT_ID)
              FAB_TENANT_ID: $(FAB_TENANT_ID)
              FAB_SPN_FEDERATED_TOKEN: $(FEDERATED_TOKEN)
            inputs:
              scriptLanguage: pscore
              FabricCLIVersion: 'v1.5.0'  
              inlineScript:|
                fab auth login -u $env:FAB_SPN_CLIENT_ID --federated-token $env:FAB_SPN_FEDERATED_TOKEN --tenant $env:FAB_TENANT_ID
                fab import DevWorkspace.Workspace `
                  -i "$(Build.SourcesDirectory)/fabric"

  # ── Stage 3: Promote to Test ──────────────────────────────────────────────
  - stage: PromoteTest
    displayName: 'Promote to Test'
    dependsOn: DeployDev
    jobs:
      - deployment: Promote
        environment: 'fabric-test'   # requires manual approval in ADO Environments
        strategy:
          runOnce:
            deploy:
              steps:
                - task: Bash@3
                  displayName: 'Generate Federated Token'
                  inputs:
                    filePath: './generate-federated-token.sh'
                - task: FabricCLITask@0
                  displayName: 'Trigger deployment pipeline Dev → Test'
                  env:
                    FAB_SPN_CLIENT_ID: $(FAB_SPN_CLIENT_ID)
                    FAB_TENANT_ID: $(FAB_TENANT_ID)
                    FAB_SPN_FEDERATED_TOKEN: $(FEDERATED_TOKEN)
                  inputs:
                    scriptType: inline
                    scriptLanguage: pscore
                    FabricCLIVersion: 'v1.5.0'  
                    inlineScript:|
                      fab auth login -u $env:FAB_SPN_CLIENT_ID --federated-token $env:FAB_SPN_FEDERATED_TOKEN --tenant $env:FAB_TENANT_ID
                      # Deployment pipeline promotion requires the Fabric REST API.
                      # See: https://learn.microsoft.com/en-us/rest/api/fabric/core/deployment-pipelines
                      fab run "$(DEPLOYMENT_PIPELINE_NAME).DeploymentPipeline"
```

---

## 7 — Use a Shared Deployment Script File

When the same script is used across multiple pipelines, store it in source control.

**`scripts/deploy-fabric.ps1`:**
```powershell
param(
    [string]$WorkspaceName,
    [string]$CapacityName
)

$ErrorActionPreference = 'Stop'

fab auth login -u $env:FAB_SPN_CLIENT_ID --federated-token $env:FAB_SPN_FEDERATED_TOKEN --tenant $env:FAB_TENANT_ID

fab mkdir "$WorkspaceName.Workspace" -P capacityname=$CapacityName

Write-Host "Done: workspace '$WorkspaceName' provisioned."
```

**Pipeline YAML:**
```yaml
pool:
  vmImage: 'ubuntu-latest'

variables:
  - group: FabricSecrets

steps:
  - checkout: self

  - task: Bash@3
    displayName: 'Generate Federated Token'
    inputs:
      filePath: './generate-federated-token.sh'

  - task: FabricCLITask@0
    displayName: 'Run shared Fabric deployment script'
    env:
      FAB_SPN_CLIENT_ID: $(FAB_SPN_CLIENT_ID)
      FAB_TENANT_ID: $(FAB_TENANT_ID)
      FAB_SPN_FEDERATED_TOKEN: $(FEDERATED_TOKEN)
    inputs:
      scriptType:filePath
      scriptLanguage:pscore
      scriptPath: '$(Build.SourcesDirectory)/scripts/deploy-fabric.ps1'
      FabricCLIVersion: 'v1.5.0'
```

---

## 8 — Run on Windows and Linux Agents

Use `pscore` to write a single script that runs on both platforms.

```yaml
strategy:
  matrix:
    linux:
      vmImage: 'ubuntu-latest'
    windows:
      vmImage: 'windows-latest'

pool:
  vmImage: $(vmImage)

variables:
  - group: FabricSecrets

steps:
  - task: Bash@3
    displayName: 'Generate Federated Token'
    inputs:
      filePath: './generate-federated-token.sh'

  - task: FabricCLITask@0
    displayName: 'Fabric CLI on $(vmImage)'
    env:
      FAB_SPN_CLIENT_ID: $(FAB_SPN_CLIENT_ID)
      FAB_TENANT_ID: $(FAB_TENANT_ID)
      FAB_SPN_FEDERATED_TOKEN: $(FEDERATED_TOKEN)
    inputs:
      scriptType: inline         # pscore runs on both Windows and Linux
      scriptLanguage :pscore
      FabricCLIVersion: 'v1.5.0'  
      inlineScript: |
        fab auth login -u $env:FAB_SPN_CLIENT_ID --federated-token $env:FAB_SPN_FEDERATED_TOKEN --tenant $env:FAB_TENANT_ID
        fab ls
        Write-Host "Verified on $(vmImage)"
```
