#!/usr/bin/env bash
set -e
echo "Starting server"
rm -f tmp/pids/server.pid

echo "Setting up database"
rails db:create db:migrate

echo "Starting sidekiq"
sidekiq &

echo "Starting rails server"
falcon serve --bind http://0.0.0.0:3000
