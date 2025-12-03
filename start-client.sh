#!/bin/bash
cd /workspaces/rinapro-whatsapp-agent
nohup npx vite --host 0.0.0.0 --port 5000 > /tmp/vite.log 2>&1 &
echo "Client starting... PID: $!"
