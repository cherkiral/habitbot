#!/bin/bash
set -e
echo "Deploying HabitBot..."
ssh root@YOUR_SERVER_IP "cd /opt/habitbot && git pull && docker compose up -d --build"
echo "Done!"
