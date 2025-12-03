#!/bin/bash
cd /workspaces/rinapro-whatsapp-agent
npm run dev > /tmp/app.log 2>&1 &
echo "Server started. Check logs: tail -f /tmp/app.log"
