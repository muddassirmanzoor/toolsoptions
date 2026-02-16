#!/bin/bash
# Start Node (tools) and Laravel (admin) for tools.options project
# Usage: ./start-servers.sh   (runs in foreground with both in background via nohup)
# Or run each in a separate terminal/screen/tmux.

cd "$(dirname "$0")"

# Node tools - port 3000
if ! lsof -i :3000 >/dev/null 2>&1; then
    nohup node index.js >> logs/node.log 2>&1 &
    echo "Started Node tools server on http://0.0.0.0:3000 (PID $!)"
else
    echo "Port 3000 already in use (Node may already be running)."
fi

# Laravel admin - port 8000
if ! lsof -i :8000 >/dev/null 2>&1; then
    (cd admin && nohup php artisan serve --host=0.0.0.0 --port=8000 >> ../logs/laravel.log 2>&1 &)
    echo "Started Laravel admin on http://0.0.0.0:8000 (PID $!)"
else
    echo "Port 8000 already in use (Laravel may already be running)."
fi

echo ""
echo "Tools UI:  http://187.77.22.201:3000/"
echo "Laravel:   http://187.77.22.201:8000/"
