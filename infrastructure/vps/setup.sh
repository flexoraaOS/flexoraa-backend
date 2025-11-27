#!/bin/bash

# VPS Setup Script for n8n Production Backend
# Run this once on a fresh Hetzner VPS

set -e

echo "🚀 Starting VPS setup for n8n Production Backend..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
echo "🐳 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Setup firewall (UFW)
echo "🔥 Configuring firewall..."
sudo apt-get install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw --force enable

# Create application user
echo "👤 Creating application user..."
sudo useradd -m -s /bin/bash n8n-app || true
sudo usermod -aG docker n8n-app

# Setup swap (4GB)
echo "💾 Setting up swap space..."
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# SSH Hardening
echo "🔒 Hardening SSH..."
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# Install monitoring tools
echo "📊 Installing monitoring tools..."
sudo apt-get install -y htop iotop nethogs

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/n8n-backend
sudo chown n8n-app:n8n-app /opt/n8n-backend

# Create log directory
sudo mkdir -p /var/log/n8n-backend
sudo chown n8n-app:n8n-app /var/log/n8n-backend

echo "✅ VPS setup complete!"
echo ""
echo "Next steps:"
echo "1. Copy your project files to /opt/n8n-backend"
echo "2. Copy .env file with credentials"
echo "3. Run ./deploy.sh to start the services"
echo ""
echo "Note: You may need to log out and back in for Docker group changes to take effect"
