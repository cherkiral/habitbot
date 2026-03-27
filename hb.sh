#!/bin/bash
# HabitBot management script
# Usage: hb [command]
#   hb up       - start all containers
#   hb down     - stop all containers
#   hb restart  - restart app/worker/beat
#   hb deploy   - pull + rebuild + migrate
#   hb logs     - show app logs
#   hb ps       - show container status
#   hb migrate  - run alembic migrations
#   hb shell    - open shell in app container

DIR=/opt/habitbot

case "$1" in
  up)
    cd $DIR && docker compose up -d
    ;;
  down)
    cd $DIR && docker compose down
    ;;
  restart)
    cd $DIR && docker compose restart app worker beat
    ;;
  deploy)
    echo "Pulling latest code..."
    cd $DIR && git pull
    echo "Rebuilding containers..."
    docker compose up -d --build app worker beat
    echo "Waiting for app to start..."
    sleep 15
    echo "Running migrations..."
    docker compose exec app alembic upgrade head
    echo "Checking health..."
    curl -s http://localhost/api/health
    echo ""
    echo "Done!"
    ;;
  logs)
    cd $DIR && docker compose logs -f ${2:-app}
    ;;
  ps)
    cd $DIR && docker compose ps
    ;;
  migrate)
    cd $DIR && docker compose exec app alembic upgrade head
    ;;
  shell)
    cd $DIR && docker compose exec app bash
    ;;
  *)
    echo "Usage: hb [up|down|restart|deploy|logs|ps|migrate|shell]"
    echo "  hb up          - start all containers"
    echo "  hb down        - stop all containers"
    echo "  hb restart     - restart app/worker/beat"
    echo "  hb deploy      - pull + rebuild + migrate"
    echo "  hb logs [svc]  - show logs (default: app)"
    echo "  hb ps          - show container status"
    echo "  hb migrate     - run migrations"
    echo "  hb shell       - open shell in app container"
    ;;
esac