FROM php:8.4-fpm-alpine

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

RUN apk add --no-cache \
    icu-dev \
    libzip-dev \
    oniguruma-dev \
    unzip \
    $PHPIZE_DEPS \
    && docker-php-ext-install intl pdo_mysql mbstring opcache \
    && apk del $PHPIZE_DEPS

COPY uploads.ini /usr/local/etc/php/conf.d/uploads.ini
COPY docker-entrypoint.sh /usr/local/bin/docker-app-entrypoint
RUN chmod +x /usr/local/bin/docker-app-entrypoint

WORKDIR /var/www/html

ENTRYPOINT ["/usr/local/bin/docker-app-entrypoint"]
CMD ["php-fpm"]
