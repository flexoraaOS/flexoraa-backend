#!/bin/bash

# Flexoraa Production Deployment Script
# Domain: flexoraaa.com
# Run this on your Hetzner VM after SSH

set -e  # Exit on error

echo "=================================="
echo "Flexoraa Production Deployment"
echo "Domain: flexoraaa.com"
echo "=================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}Please run as root: sudo ./deploy.sh${NC}"
  exit 1
fi

# Step 1: Update system
echo -e "${YELLOW}[1/10] Updating system...${NC}"
apt update && apt upgrade -y

# Step 2: Install Docker
echo -e "${YELLOW}[2/10] Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    echo -e "${GREEN}Docker installed${NC}"
else
    echo -e "${GREEN}Docker already installed${NC}"
fi

# Step 3: Install Docker Compose
echo -e "${YELLOW}[3/10] Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}Docker Compose installed${NC}"
else
    echo -e "${GREEN}Docker Compose already installed${NC}"
fi

# Step 4: Install Certbot
echo -e "${YELLOW}[4/10] Installing Certbot...${NC}"
apt install certbot -y

# Step 5: Mount Block Storage
echo -e "${YELLOW}[5/10] Setting up block storage...${NC}"
if [ ! -d "/mnt/HC_Volume_1" ]; then
    mkdir -p /mnt/HC_Volume_1
    echo -e "${YELLOW}Please mount your Hetzner block storage manually:${NC}"
    echo "Example: mount /dev/disk/by-id/scsi-0HC_Volume_XXXXX /mnt/HC_Volume_1"
    read -p "Press Enter after mounting..."
fi

mkdir -p /mnt/HC_Volume_1/redis
mkdir -p /mnt/HC_Volume_1/backups
echo -e "${GREEN}Storage directories created${NC}"

# Step 6: Clone Repository
echo -e "${YELLOW}[6/10] Cloning repository...${NC}"
cd /opt
if [ ! -d "n8n-production-backend" ]; then
    git clone https://github.com/yourusername/n8n-production-backend.git
    echo -e "${GREEN}Repository cloned${NC}"
else
    echo -e "${YELLOW}Repository exists, pulling latest...${NC}"
    cd n8n-production-backend
    git pull origin main
fi

cd /opt/n8n-production-backend

# Step 7: Create .env file
echo -e "${YELLOW}[7/10] Setting up environment variables...${NC}"
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${RED}IMPORTANT: Edit .env file and add your credentials${NC}"
    read -p "Press Enter to edit .env now..."
    nano .env
else
    echo -e "${YELLOW}.env exists, skipping...${NC}"
fi

# Step 8: Get SSL Certificates
echo -e "${YELLOW}[8/10] Getting SSL certificates...${NC}"
if [ ! -f "/etc/letsencrypt/live/api.flexoraaa.com/fullchain.pem" ]; then
    echo -e "${YELLOW}Getting SSL for api.flexoraaa.com...${NC}"
    certbot certonly --standalone -d api.flexoraaa.com -d monitoring.flexoraaa.com --non-interactive --agree-tos --email admin@flexoraaa.com
    
    # Copy to nginx directory
    mkdir -p nginx/ssl
    cp /etc/letsencrypt/live/api.flexoraaa.com/fullchain.pem nginx/ssl/
    cp /etc/letsencrypt/live/api.flexoraaa.com/privkey.pem nginx/ssl/
    
    # Setup auto-renewal
    echo "0 3 * * * certbot renew --quiet && docker-compose -f /opt/n8n-production-backend/docker-compose.production.yml restart nginx" | crontab -
    echo -e "${GREEN}SSL certificates obtained${NC}"
else
    echo -e "${GREEN}SSL certificates already exist${NC}"
fi

# Step 9: Deploy
echo -e "${YELLOW}[9/10] Starting Docker containers...${NC}"
docker-compose -f docker-compose.production.yml up -d

echo -e "${YELLOW}Waiting for containers to start...${NC}"
sleep 10

# Step 10: Verify
echo -e "${YELLOW}[10/10] Verifying deployment...${NC}"
docker-compose -f docker-compose.production.yml ps

echo ""
echo -e "${GREEN}=================================="
echo "Deployment Complete!"
echo "==================================${NC}"
echo ""
echo "Next steps:"
echo "1. Check logs: docker-compose -f docker-compose.production.yml logs -f"
echo "2. Test health: curl https://api.flexoraaa.com/health"
echo "3. Access monitoring: https://monitoring.flexoraaa.com"
echo ""
echo -e "${YELLOW}Grafana credentials:${NC} Check .env file for GRAFANA_PASSWORD"
echo ""
