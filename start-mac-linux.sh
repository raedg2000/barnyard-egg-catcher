#!/usr/bin/env bash
set -euo pipefail

echo "Installing packages..."
npm install

echo "Starting Barnyard Egg Catcher..."
npm run dev
