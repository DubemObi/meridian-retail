#!/bin/bash
# scripts/server_setup.sh
# Meridian Retail Group — EC2 Initial Server Setup
#
# Run once on a fresh Ubuntu 22.04 EC2 instance (t3.small recommended).
# Installs Docker, Docker Compose, Nginx, and Certbot.

set -e

echo "=== Updating system packages ==="
sudo apt-get update && sudo apt-get upgrade -y

echo "=== Installing Docker ==="
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
rm get-docker.sh

echo "=== Installing Docker Compose plugin ==="
sudo apt-get install -y docker-compose-plugin

echo "=== Installing Nginx ==="
sudo apt-get install -y nginx

echo "=== Installing Certbot ==="
sudo apt-get install -y certbot python3-certbot-nginx

echo "=== Installing AWS CLI (for ECR auth) ==="
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
sudo apt-get install -y unzip
unzip -q awscliv2.zip
sudo ./aws/install
rm -rf awscliv2.zip aws/

echo "=== Setup complete ==="
echo "Next steps:"
echo "  1. Log out and back in for the docker group change to take effect"
echo "  2. Clone the repository: git clone <your-repo-url> meridian-retail"
echo "  3. cd meridian-retail && cp .env.example .env && nano .env"
echo "  4. docker compose up -d"
echo "  5. Copy nginx/meridian-http.conf to /etc/nginx/sites-available/meridian.conf"
echo "  6. sudo ln -s /etc/nginx/sites-available/meridian.conf /etc/nginx/sites-enabled/"
echo "  7. sudo nginx -t && sudo systemctl reload nginx"
echo "  8. sudo certbot --nginx -d shop.yourdomain.com"
