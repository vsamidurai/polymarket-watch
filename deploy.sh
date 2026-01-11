#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Variables
APP_DIR="/var/www/polymarket-watch"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
NODE_VERSION="16"
PYTHON_VERSION="3.8"
DOMAIN="your-domain.com"  # Replace with your domain if using Nginx or Caddy

# Update and install system dependencies
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y
echo "Installing required packages..."
sudo apt install -y python$PYTHON_VERSION python$PYTHON_VERSION-venv python$PYTHON_VERSION-dev redis nodejs npm nginx git

# Clone the repository
echo "Cloning repository..."
if [ ! -d "$APP_DIR" ]; then
  sudo git clone https://github.com/vsamidurai/polymarket-watch.git "$APP_DIR"
fi
cd "$APP_DIR"
sudo git pull

# Setup backend
echo "Setting up backend..."
cd "$BACKEND_DIR"
python$PYTHON_VERSION -m venv venv
source venv/bin/activate
pip install --upgrade pip
make install-backend
deactivate

# Create backend service
sudo bash -c "cat > /etc/systemd/system/polymarket-backend.service <<EOL
[Unit]
Description=Polymarket Backend Server
After=network.target

[Service]
WorkingDirectory=$BACKEND_DIR
ExecStart=$BACKEND_DIR/venv/bin/uvicorn app:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOL"

echo "Starting backend service..."
sudo systemctl daemon-reload
sudo systemctl enable polymarket-backend
sudo systemctl start polymarket-backend

# Setup frontend
echo "Setting up frontend..."
cd "$FRONTEND_DIR"
sudo npm install -g npm@$NODE_VERSION  # Update npm to the matching Node.js version
npm install
npm run build

# Configure Nginx to serve frontend
sudo bash -c "cat > /etc/nginx/sites-available/polymarket-watch <<EOL
server {
    listen 80;
    server_name $DOMAIN;

    root $FRONTEND_DIR/dist;
    index index.html;

    location / {
        try_files \$uri /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL"

echo "Enabling Nginx site configuration..."
sudo ln -sf /etc/nginx/sites-available/polymarket-watch /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

echo "Deployment complete! Access your application at http://$DOMAIN or http://<your-server-ip>