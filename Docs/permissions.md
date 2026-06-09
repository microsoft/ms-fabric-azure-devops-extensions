# Permissions and Service Connection Setup

This page describes the Azure and Fabric permissions required for the `FabricCLI@0` to operate in your pipelines.

---

## Overview

The Fabric ADO Extension authenticates using a **delegated access token** obtained from an Azure service connection at pipeline runtime. The identity behind the service connection must have:

1. An appropriate **workspace role** for the operations you're performing
2. Optionally, **capacity admin** rights if creating or assigning workspaces to capacities

---

## 1 — Configure an Azure Service Connection

An Azure DevOps administrator must create a service connection once per project:

1. In ADO, go to **Project Settings → Service connections → New service connection**
2. Select **Azure Resource Manager** and choose **Workload Identity federation (automatic)** or **Managed Identity**
3. Name the connection `FabricServiceConnection`
4. The identity behind the service connection must have access to the Fabric API scope (`https://api.fabric.microsoft.com`)

> See [Set up a workload identity service connection](https://learn.microsoft.com/en-us/azure/devops/pipelines/release/configure-workload-identity) for detailed setup instructions.
> For troubleshooting, see [Troubleshoot workload identity service connections](https://learn.microsoft.com/en-us/azure/devops/pipelines/release/troubleshoot-workload-identity).

---

## 2 — Store Configuration in an ADO Variable Group

Store non-secret configuration in a variable group:

| Variable | Value |
|---|---|
| `FAB_SPN_CLIENT_ID` | Service principal / managed identity client ID |
| `FAB_TENANT_ID` | Microsoft Entra tenant ID |
| `FAB_CAPACITY_NAME` | Target Fabric capacity name |

> No secrets are stored in the variable group. The federated token is generated at pipeline runtime by the workload identity service connection.

---

## 3 — Workspace Role Assignments

Assign the service connection's identity to the workspaces it needs to manage. Roles and the operations they permit:

| Role | Permitted Operations |
|---|---|
| **Admin** | Full control: manage roles, delete workspace, all item operations |
| **Member** | Create, edit, delete items; manage Git and deployment pipelines |
| **Contributor** | Create and edit items; publish definitions; trigger pipelines |
| **Viewer** | Read-only access to items |

**Minimum recommended role for CI/CD pipelines:** `Contributor`

### Assign via Fabric UI

1. Open the workspace in [app.fabric.microsoft.com](https://app.fabric.microsoft.com)
2. Click the **...** menu → **Workspace settings → Permissions**
3. Click **Add people or groups**
4. Search for the identity by name and assign the appropriate role

### Assign via REST API (automated)

```python

url = f"https://api.fabric.microsoft.com/v1/workspaces/{workspace_id}/roleAssignments"
payload = {    
    "role": "Contributor",
    "principal": {
         "id": <spn_object_id>,
        "type": "ServicePrincipal"
    }}
headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json",
    "Accept": "application/json",
}
resp = requests.post(url, headers=headers, json=payload, timeout=30)
```

## 4 — Capacity Permissions (for workspace creation)

If your pipeline **creates new workspaces** and assigns them to a capacity, the identity also needs rights on the capacity:

1. In the [Fabric Admin Portal](https://app.fabric.microsoft.com/admin-portal), go to **Capacity settings**
2. Select your capacity
3. Under **Capacity admins**, add the identity's object ID

> Capacity admin access is only required for workspace creation and capacity assignment. Item deployment and Git operations do not require it.

---

## 5 — Deployment Pipeline Permissions

To trigger or manage Fabric deployment pipelines, the identity must be assigned as an **Admin** on the deployment pipeline:

1. In Fabric, open the deployment pipeline
2. Go to **Pipeline settings → Permissions**
3. Add the identity with **Admin** role

---

## 6 — Summary: Minimum Permissions by Operation

| Operation | Permissions|Required Delegated scopes|
|---|---|---|
| List workspaces | Viewer | Workspace.Read.All or Workspace.ReadWrite.All |
| Create workspace|Contributor or Admin on the capacity|Workspace.ReadWrite.All |
| Publish / deploy items| Contributor|Generic scope: Item.ReadWrite.All,Specific scope: itemType.ReadWrite.All|
| Connect workspace to Git | Admin | Workspace.ReadWrite.All|
| Commit / sync Git | Contributor | Workspace.GitCommit.All |
| Delete workspace | Admin | Workspace.ReadWrite.All|
| Trigger deployment pipeline | Admin ||

---

## 7 — Security Hardening Recommendations

- **Use security groups** rather than assigning identities directly to workspaces — easier to govern at scale.
- **Use workload identity federation** instead of client secrets for Azure service connections — eliminates stored secrets entirely.
- **Scope service connection access** to only the pipelines that need it in ADO → Project Settings → Service connections → Permissions.
- **Audit activity** via the [Fabric activity log](https://learn.microsoft.com/fabric/admin/track-user-activities) and Entra ID sign-in logs.
