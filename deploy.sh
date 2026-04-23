#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/kwangsta.it.com"

cd "$APP_DIR"

git pull origin main
cd frontend
npm run build
cd ..
pip install -r backend/requirements.txt
cd backend
alembic upgrade head
cd ..
sudo systemctl restart kwangsta-backend
