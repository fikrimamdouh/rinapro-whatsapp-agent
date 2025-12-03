#!/bin/bash

echo "🔄 Restarting RinaPro System..."

# Kill all processes
pkill -9 -f "node" 2>/dev/null
pkill -9 -f "tsx" 2>/dev/null
pkill -9 -f "vite" 2>/dev/null
sleep 2

echo "✅ Killed old processes"

# Start server
cd /workspaces/rinapro-whatsapp-agent
nohup npm run server > /tmp/server.log 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > /tmp/server.pid

echo "✅ Server started (PID: $SERVER_PID)"
echo "📝 Server logs: tail -f /tmp/server.log"

# Wait for server to be ready
sleep 10

# Start client (vite only, not npm run dev which starts both)
cd /workspaces/rinapro-whatsapp-agent/client
nohup npx vite --port 5000 --host > /tmp/client.log 2>&1 &
CLIENT_PID=$!
echo $CLIENT_PID > /tmp/client.pid

echo "✅ Client started (PID: $CLIENT_PID)"
echo "📝 Client logs: tail -f /tmp/client.log"

echo ""
echo "🎉 System is starting..."
echo "🌐 Server: http://localhost:3001"
echo "🌐 Client: http://localhost:5000"
echo ""
echo "📊 Check status:"
echo "  ps aux | grep tsx"
echo "  ps aux | grep vite"
