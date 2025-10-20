#!/bin/bash

# Setup script for nginx with SSL on server
SERVER="root@165.227.157.211"
DOMAIN="markt.boss-corp.net"
APP_PORT="8099"

echo "🚀 Setting up nginx and SSL for $DOMAIN..."

# Copy nginx config to server
echo "📁 Copying nginx config..."
scp markt.boss-corp.net $SERVER:/etc/nginx/sites-available/$DOMAIN

# SSH into server and run setup commands
echo "⚙️  Configuring server..."
ssh $SERVER << 'EOF'
DOMAIN="markt.boss-corp.net"

# Check if MarketPlatz app is running
echo "🔍 Checking if application is running..."
if ! pgrep -f "MarketPlatz-Notification-Helper" > /dev/null; then
    echo "⚠️  Application not running. Starting it..."
    cd /home/markplatz
    if [ -f "./MarketPlatz-Notification-Helper" ]; then
        chmod +x ./MarketPlatz-Notification-Helper
        nohup ./MarketPlatz-Notification-Helper > app.log 2>&1 &
        sleep 2
        echo "✅ Application started"
    else
        echo "❌ Application binary not found in /home/markplatz"
        exit 1
    fi
fi

# Enable site
echo "🔗 Enabling nginx site..."
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/

# Test nginx config
echo "🧪 Testing nginx configuration..."
nginx -t

# Reload nginx
echo "🔄 Reloading nginx..."
systemctl reload nginx

# Install certbot if not installed
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing certbot..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# Get SSL certificate
echo "🔐 Obtaining SSL certificate..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email mirzetkarahodzic@gmail.com --redirect

echo "✅ Setup complete!"
echo "🌐 Your application is now available at: https://$DOMAIN"

EOF

echo "🎉 Done! Check https://$DOMAIN"
