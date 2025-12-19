#!/bin/bash
set -e

# setup-vm.sh
# Automates setting up the GitHub Manager app on a fresh Ubuntu/Debian VM.

echo "Setting up GitHub Manager on VM..."

# 1. System Updates & Dependencies
echo "Updating system..."
sudo apt-get update && sudo apt-get install -y curl git build-essential

# 2. Install Node.js (v20)
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install PM2
echo "Installing PM2..."
sudo npm install -g pm2

# 4. Clone Repo (Assuming we are in the repo or user clones it)
# We assume the script is run FROM the repo root
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# 5. Install Deps & Build
echo "Installing dependencies..."
npm install
echo "Building..."
npm run build

# 6. Environment Setup
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    read -p "Enter GitHub Client ID: " GITHUB_CLIENT_ID
    read -p "Enter GitHub Client Secret: " GITHUB_CLIENT_SECRET
    read -p "Enter Encryption Key (Base64 32-bytes): " DATA_ENCRYPTION_KEY
    read -p "Enter Session Secret: " SESSION_SECRET
    read -p "Enter App Base URL (e.g. http://your-ip:8080): " APP_BASE_URL

    cat > .env <<EOF
PORT=8080
DB_PROVIDER=firestore
GITHUB_CLIENT_ID=$GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET=$GITHUB_CLIENT_SECRET
DATA_ENCRYPTION_KEY=$DATA_ENCRYPTION_KEY
SESSION_SECRET=$SESSION_SECRET
APP_BASE_URL=$APP_BASE_URL
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json (Required for Firestore on VM unless using metadata server)
EOF
    echo "NOTE: For Firestore to work on a VM, ensure the VM service account has 'Cloud Datastore User' role, or set GOOGLE_APPLICATION_CREDENTIALS in .env"
fi

# 7. Start with PM2
echo "Starting application..."
pm2 start dist/server.js --name "github-manager"
pm2 save
pm2 startup

# 8. Firewall (UFW)
echo "Configuring firewall..."
if command -v ufw >/dev/null; then
    sudo ufw allow 8080
    echo "Port 8080 allowed."
fi

echo "Setup complete! App is running on port 8080."
