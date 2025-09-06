#!/bin/bash

# Setup script for The Describer app
echo "🔍 The Describer - API Key Setup"
echo "================================="

# Check if .env file exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists."
    read -p "Do you want to update the API key? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

echo
echo "Please enter your Anthropic API key (starts with 'sk-ant-'):"
echo "You can get one from: https://console.anthropic.com"
echo
read -s -p "API Key: " api_key

if [ -z "$api_key" ]; then
    echo
    echo "❌ No API key provided. Setup cancelled."
    exit 1
fi

# Basic validation
if [[ ! $api_key =~ ^sk-ant- ]]; then
    echo
    echo "⚠️  Warning: API key doesn't start with 'sk-ant-'. Please verify it's correct."
fi

# Write to .env file
echo "ANTHROPIC_API_KEY=$api_key" > .env

echo
echo "✅ API key saved to .env file"
echo
echo "Next steps:"
echo "1. Run 'npm install' to install dependencies"
echo "2. Run 'npm run dev' to start development server"
echo "3. For deployment to Cloudflare Pages, see DEPLOYMENT.md"
echo
echo "🚀 Happy describing!"