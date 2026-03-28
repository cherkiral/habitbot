#!/bin/bash
DIR=/opt/habitbot

case "$1" in
  up)
    cd $DIR && docker compose up -d
    ;;
  down)
    cd $DIR && docker compose down
    ;;
  restart)
    cd $DIR && docker compose restart app worker beat frontend
    ;;
  deploy)
    echo "Pulling latest code..."
    cd $DIR && git pull
    echo "Rebuilding containers..."
    docker compose up -d --build
    echo "Waiting for app to start..."
    sleep 20
    echo "Running migrations..."
    docker compose exec app alembic upgrade head
    echo "Seeding initial data..."
    docker compose exec app python seed.py
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
  seed)
    cd $DIR && docker compose exec app python seed.py
    ;;
  shell)
    cd $DIR && docker compose exec ${2:-app} sh
    ;;
  *)
    echo "Usage: hb [up|down|restart|deploy|logs|ps|migrate|seed|shell]"
    ;;
esac