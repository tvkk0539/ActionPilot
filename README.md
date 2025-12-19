# GitHub Manager (Multi-Account)

A secure, production-ready web application running on **Google Cloud Run** to manage GitHub Repositories and Actions across multiple accounts.

## Features

- **Multi-Account Hub:** Link multiple GitHub accounts and switch between them.
- **Login-First Policy:** Authenticated access only.
- **Repository Management:** List, Create, Rename, Delete, Toggle Visibility, Clone from Template.
- **Actions Management:** Trigger `workflow_dispatch`, view run history, cancel runs.
- **Governance:** Enable/Disable Actions per repository.
- **Security:** AES-256-GCM token encryption, Secret Manager integration.
- **Database Agnostic:** Defaults to Firestore, extensible to Postgres/Mongo.

## Architecture

- **Backend:** Node.js, Express, TypeScript.
- **Frontend:** Server-side rendered EJS templates (Bootstrap 5).
- **Database:** Google Cloud Firestore (default).
- **Secrets:** Google Secret Manager.
- **Infrastructure:** Google Cloud Run (Docker).

## Setup & Deployment

### Prerequisites

1.  **Google Cloud Project**: With billing enabled.
2.  **GitHub OAuth App**:
    *   Create at: https://github.com/settings/developers
    *   Callback URL: `https://<YOUR_CLOUD_RUN_URL>/oauth/callback` (and `/connect/callback` if using separate callback, though the code reuses logic).
    *   **Note**: For local dev, use `http://localhost:8080/oauth/callback`.

### 1. Local Development

```bash
# Install dependencies
npm install

# Setup .env
cp .env.example .env
# Edit .env and add your GITHUB_CLIENT_ID, SECRET, and generate a DATA_ENCRYPTION_KEY

# Generate Encryption Key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Run (requires Google Application Credentials for Firestore if testing DB)
npm run dev
```

### 2. Deploy to Cloud Run (Automated)

The `scripts/setup-cloudrun.sh` script automates the entire process.

```bash
# Authenticate gcloud
gcloud auth login
gcloud config set project [PROJECT_ID]

# Run the setup script
./scripts/setup-cloudrun.sh
```

This script will:
1.  Enable necessary Google Cloud APIs.
2.  Create a Service Account.
3.  Prompt you to enter secrets (Client ID, Secret, Encryption Key) and store them in **Secret Manager**.
4.  Build and Deploy the container to Cloud Run.

### 3. Deploy to VM (Ubuntu/Debian)

Use the `scripts/setup-vm.sh` script on your target machine.

```bash
# Clone the repo on the VM
git clone <this-repo-url>
cd cloud-run-github-manager

# Run the setup script
./scripts/setup-vm.sh
```

## Cost Analysis (Cloud Run)

**Free Tier (per month):**
- 2 Million requests
- 360,000 vCPU-seconds
- 360,000 GiB-seconds
- 1 GB Network Egress

**Estimated Costs (Beyond Free Tier):**

To estimate your monthly bill, you can use the python script below (or run it via `python3 scripts/cost_estimate.py` if you save it).

```python
requests = 30000
vCPU_seconds = 1500
GiB_seconds = 1500
outbound_GB = 0.5

FREE_REQUESTS = 2_000_000
FREE_VCPU_SECONDS = 360_000
FREE_GiB_SECONDS = 360_000
FREE_OUTBOUND_GB = 1

PRICE_PER_MILLION_REQUESTS = 0.40
PRICE_PER_VCPU_SECOND = 0.000024
PRICE_PER_GiB_SECOND = 0.0000027
PRICE_PER_GB = 0.12

billable_requests = max(0, requests - FREE_REQUESTS)
billable_vCPU = max(0, vCPU_seconds - FREE_VCPU_SECONDS)
billable_GiB = max(0, GiB_seconds - FREE_GiB_SECONDS)
billable_outbound = max(0, outbound_GB - FREE_OUTBOUND_GB)

cost_requests = (billable_requests / 1_000_000) * PRICE_PER_MILLION_REQUESTS
cost_vCPU = billable_vCPU * PRICE_PER_VCPU_SECOND
cost_GiB = billable_GiB * PRICE_PER_GiB_SECOND
cost_outbound = billable_outbound * PRICE_PER_GB

total_cost = cost_requests + cost_vCPU + cost_GiB + cost_outbound
print(f"Estimated monthly cost: ${total_cost:.2f}")
```

## Environment Variables

| Variable | Description |
|---|---|
| `DB_PROVIDER` | `firestore` (default), `postgres`, `mongo`. |
| `DATA_ENCRYPTION_KEY` | Base64 encoded 32-byte key for AES-256-GCM. |
| `GITHUB_CLIENT_ID` | OAuth Client ID. |
| `GITHUB_CLIENT_SECRET`| OAuth Client Secret. |
| `SESSION_SECRET` | Secret for signing session cookies. |
| `ALLOWED_USERS` | Comma-separated list of GitHub usernames allowed to login. |
