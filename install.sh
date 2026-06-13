#!/bin/bash

# MyControlPanel - Auto Installer Script for Ubuntu 20.04/22.04/24.04
# ====================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}      MyControlPanel Installation         ${NC}"
echo -e "${GREEN}==========================================${NC}"

# 1. Check if user is root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[ERROR] Please run this script as root (sudo bash install.sh)${NC}"
  exit 1
fi

# 2. Update System
echo -e "${YELLOW}[1/6] Updating system packages...${NC}"
apt-get update -y && apt-get upgrade -y

# 3. Install Core Dependencies
echo -e "${YELLOW}[2/6] Installing core dependencies (curl, git, nginx, sqlite3, certbot)...${NC}"
apt-get install -y curl git nginx sqlite3 certbot python3-certbot-nginx

# 4. Install Node.js (v20.x)
echo -e "${YELLOW}[3/6] Installing Node.js 20...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 5. Clone the Repository
echo -e "${YELLOW}[4/6] Downloading MyControlPanel from GitHub...${NC}"
INSTALL_DIR="/opt/mycontrolpanel"

# !!! REPLACE THE URL BELOW WITH YOUR ACTUAL GITHUB REPOSITORY URL !!!
GITHUB_REPO="https://github.com/YourUsername/MyControlPanel.git"

if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}Directory $INSTALL_DIR already exists. Pulling latest changes...${NC}"
    cd $INSTALL_DIR
    git pull
else
    git clone $GITHUB_REPO $INSTALL_DIR
    cd $INSTALL_DIR
fi

# 6. Install NPM packages and Build Frontend
echo -e "${YELLOW}[5/6] Building the panel (this may take a few minutes)...${NC}"

# Backend setup
echo "Installing backend dependencies..."
cd $INSTALL_DIR/backend
npm install

# Frontend setup
echo "Installing frontend dependencies and building React..."
cd $INSTALL_DIR/frontend
npm install
npm run build

# 7. Setup Systemd Service
echo -e "${YELLOW}[6/6] Creating Systemd background service...${NC}"

cat <<EOF > /etc/systemd/system/mycontrolpanel.service
[Unit]
Description=MyControlPanel Backend Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR/backend
Environment=PORT=8080
ExecStart=/usr/bin/node server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable mycontrolpanel
systemctl restart mycontrolpanel

# Get Server IP
SERVER_IP=$(curl -s http://checkip.amazonaws.com || wget -qO- http://checkip.amazonaws.com)

echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}  INSTALLATION COMPLETED SUCCESSFULLY!    ${NC}"
echo -e "${GREEN}==========================================${NC}"
echo -e "Panel runs in the background via systemd."
echo -e "Access your control panel at:"
echo -e "${YELLOW}http://${SERVER_IP}:8080${NC}"
echo -e "Port 80 is kept free for your Nginx websites."
echo -e "You will be prompted to create the Master Admin account on first visit."
echo -e "=========================================="
