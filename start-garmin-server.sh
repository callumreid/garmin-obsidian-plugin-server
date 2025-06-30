#!/bin/bash

echo "🚀 Starting Garmin Connect Server..."
echo "This will fetch your real Garmin data and serve it to Obsidian"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

cd "/Users/bronson/bronson/garminObsidianPluginServer"
node garmin-server.js