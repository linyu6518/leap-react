#!/bin/bash
cd "$(dirname "$0")"
echo "Stopping any running servers..."
pkill -f "ng serve" || true
sleep 2
echo "Starting Angular dev server on port 4201..."
npx ng serve --port 4201 --host 0.0.0.0
