#!/bin/bash
set -e

# setup-cloudrun.sh
# Automates the deployment of the GitHub Manager app to Google Cloud Run.

# Configuration
PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"
SERVICE_NAME="github-manager"

echo "Using Project ID: $PROJECT_ID"
echo "Region: $REGION"

# 1. Enable APIs
echo "Enabling necessary APIs..."
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com

# 2. Create Service Account
echo "Creating Service Account..."
SA_NAME="github-manager-sa"
if ! gcloud iam service-accounts describe "${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" >/dev/null 2>&1; then
    gcloud iam service-accounts create $SA_NAME --display-name="GitHub Manager Service Account"
fi
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# Grant roles
echo "Granting roles..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/datastore.user"

# 3. Create Secrets
create_secret() {
    SECRET_NAME=$1
    echo "Enter value for $SECRET_NAME (input hidden): "
    read -s SECRET_VALUE
    echo

    # Check if secret exists
    if ! gcloud secrets describe $SECRET_NAME --project=$PROJECT_ID >/dev/null 2>&1; then
        gcloud secrets create $SECRET_NAME --replication-policy="automatic" --project=$PROJECT_ID
    fi

    # Add version
    echo -n "$SECRET_VALUE" | gcloud secrets versions add $SECRET_NAME --data-file=- --project=$PROJECT_ID
}

echo "Do you need to configure secrets? (y/n)"
read SETUP_SECRETS
if [ "$SETUP_SECRETS" == "y" ]; then
    create_secret "GITHUB_CLIENT_ID"
    create_secret "GITHUB_CLIENT_SECRET"
    create_secret "DATA_ENCRYPTION_KEY" # Base64 encoded 32-byte key
    create_secret "SESSION_SECRET"
fi

# 4. Deploy
echo "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --service-account $SA_EMAIL \
  --allow-unauthenticated \
  --set-env-vars="DB_PROVIDER=firestore,APP_BASE_URL=https://${SERVICE_NAME}-${PROJECT_ID}.a.run.app" \
  --set-secrets="GITHUB_CLIENT_ID=GITHUB_CLIENT_ID:latest,GITHUB_CLIENT_SECRET=GITHUB_CLIENT_SECRET:latest,DATA_ENCRYPTION_KEY=DATA_ENCRYPTION_KEY:latest,SESSION_SECRET=SESSION_SECRET:latest"

echo "Deployment complete!"
