#!/bin/bash
set -e

echo "🚀 Starting Xtra Assurance API..."

cd "$(dirname "$0")"

python manage.py migrate --run-syncdb
python manage.py collectstatic --noinput

# Seed only if DB is fresh (no drivers yet)
python -c "
import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'xtra_backend.settings')
django.setup()
from api.models import Driver
if Driver.objects.count() == 0:
    from django.core.management import call_command
    call_command('seed_data')
    print('✅ Demo data seeded')
else:
    print('ℹ️  DB already has data, skipping seed')
"

PORT=${PORT:-8000}
echo "✅ API ready on port $PORT"
exec gunicorn xtra_backend.wsgi:application \
    --bind "0.0.0.0:$PORT" \
    --workers 2 \
    --timeout 120 \
    --access-logfile -
