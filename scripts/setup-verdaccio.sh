#!/bin/bash
# =============================================================================
# Verdaccio Caching Proxy Setup for Oracle Cloud / Dokploy
# =============================================================================
# This script sets up Verdaccio as a local npm caching proxy on your server.
# It caches npm packages to avoid 429 rate limiting during Docker builds.
#
# Usage: Run this on your Oracle Cloud server (not in Docker):
#   curl -sSL https://raw.githubusercontent.com/tolakang/medusa-multivendor-store/main/scripts/setup-verdaccio.sh | bash
#
# Or clone the repo and run:
#   bash scripts/setup-verdaccio.sh
# =============================================================================

set -e

VERDACCIO_PORT=4873
VERDACCIO_DIR="/opt/verdaccio"
VERDACCIO_DATA="$VERDACCIO_DIR/storage"

echo "============================================"
echo "  Verdaccio Caching Proxy Setup"
echo "  Port: $VERDACCIO_PORT"
echo "============================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 22..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "Node.js version: $(node --version)"

# Check if Verdaccio is already running
if pgrep -f verdaccio > /dev/null 2>&1; then
    echo "Verdaccio is already running. Stopping..."
    pkill -f verdaccio
    sleep 2
fi

# Create Verdaccio directory
sudo mkdir -p "$VERDACCIO_DIR" "$VERDACCIO_DATA"
sudo chown -R $(whoami):$(whoami) "$VERDACCIO_DIR"

# Install Verdaccio globally
echo "Installing Verdaccio..."
npm install -g verdaccio

# Create Verdaccio config
cat > "$VERDACCIO_DIR/config.yaml" << YAML
storage: $VERDACCIO_DATA
plugins: $VERDACCIO_DIR/plugins

web:
  title: "Medusa npm Cache"

uplinks:
  npmjs:
    url: https://registry.npmjs.org/
    timeout: 120s
    maxage: 10m
    max_fails: 10
    fail_timeout: 5m
    cache: true
  npm-mirror:
    url: https://registry.npmmirror.com/
    timeout: 60s
    maxage: 10m
    max_fails: 5
    fail_timeout: 5m
    cache: true

packages:
  "**":
    access: \$anonymous
    publish: \$authenticated
    unpublish: \$authenticated
    proxy: npmjs npm-mirror

server:
  keepAliveTimeout: 60

middlewares:
  audit:
    enabled: true

listen:
  - 0.0.0.0:$VERDACCIO_PORT

log:
  type: stdout
  format: pretty
  level: warn
YAML

# Create systemd service
sudo tee /etc/systemd/system/verdaccio.service > /dev/null << SERVICE
[Unit]
Description=Verdaccio npm caching proxy
After=network.target

[Service]
Type=simple
User=$(whoami)
ExecStart=$(which verdaccio) -l $VERDACCIO_PORT -c $VERDACCIO_DIR/config.yaml
Restart=always
RestartSec=10
Environment=HOME=/home/$(whoami)

[Install]
WantedBy=multi-user.target
SERVICE

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable verdaccio
sudo systemctl start verdaccio

# Wait for startup
sleep 3

# Test
if curl -sf http://localhost:$VERDACCIO_PORT/ > /dev/null 2>&1; then
    echo ""
    echo "✅ Verdaccio is running on port $VERDACCIO_PORT"
    echo ""
    echo "To use in Docker builds, set this in your Dockerfile or .npmrc:"
    echo "  registry=http://$(hostname -I | awk '{print $1}'):$VERDACCIO_PORT/"
    echo ""
    echo "Or add to .npmrc in your project:"
    echo "  registry=http://$(hostname -I | awk '{print $1}'):$VERDACCIO_PORT/"
    echo ""
    echo "Management commands:"
    echo "  sudo systemctl status verdaccio    # Check status"
    echo "  sudo systemctl restart verdaccio   # Restart"
    echo "  sudo journalctl -u verdaccio -f    # View logs"
else
    echo "⚠️  Verdaccio may not be running. Check: sudo systemctl status verdaccio"
fi
