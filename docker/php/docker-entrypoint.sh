#!/bin/sh
set -e

cd /var/www/html

if [ ! -f .env ]; then
  echo "Creating .env from .env.example..."
  cp .env.example .env
fi

if [ ! -f vendor/autoload.php ] || [ ! -f vendor/composer/installed.json ] || [ composer.lock -nt vendor/composer/installed.json ]; then
  echo "Running composer install..."
  composer install --no-interaction --prefer-dist --optimize-autoloader
else
  echo "Composer dependencies are up to date; skipping composer install."
fi

if ! grep -q '^APP_KEY=base64:' .env 2>/dev/null; then
  echo "Generating application key..."
  php artisan key:generate --no-interaction
fi

if [ "$DB_CONNECTION" = "mysql" ] && [ -n "$DB_HOST" ]; then
  echo "Waiting for MySQL (${DB_HOST})..."
  i=0
  while [ "$i" -lt 60 ]; do
    if php -r "
      try {
        new PDO(
          'mysql:host=' . getenv('DB_HOST') . ';port=' . (getenv('DB_PORT') ?: '3306'),
          getenv('DB_USERNAME'),
          getenv('DB_PASSWORD')
        );
        exit(0);
      } catch (Throwable \$e) {
        exit(1);
      }
    " 2>/dev/null; then
      echo "MySQL is reachable."
      break
    fi
    i=$((i + 1))
    sleep 2
  done
fi

mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true

if [ "$DB_CONNECTION" = "sqlite" ]; then
  touch database/database.sqlite
  chown www-data:www-data database/database.sqlite 2>/dev/null || true
fi

php artisan migrate --force --no-interaction
php artisan storage:link 2>/dev/null || true

exec /usr/local/bin/docker-php-entrypoint "$@"
