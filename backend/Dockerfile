
FROM php:8.4-apache

ENV DEBIAN_FRONTEND=noninteractive
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
ENV PUPPETEER_SKIP_DOWNLOAD=true

RUN apt-get update && apt-get install -y \
    git unzip zip curl ca-certificates \
    nodejs npm chromium \
    libicu-dev libzip-dev libpng-dev \
    libjpeg62-turbo-dev libfreetype6-dev \
    libonig-dev libxml2-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        pdo_mysql mbstring bcmath intl zip gd pcntl opcache \
    && a2enmod rewrite headers \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

RUN composer install \
    --no-dev \
    --prefer-dist \
    --no-interaction \
    --optimize-autoloader

RUN npm install --no-save --no-package-lock puppeteer

RUN sed -ri \
    -e 's!/var/www/html!/var/www/html/public!g' \
    /etc/apache2/sites-available/000-default.conf \
    /etc/apache2/apache2.conf \
    && sed -ri \
    -e 's/AllowOverride None/AllowOverride All/g' \
    /etc/apache2/apache2.conf

RUN chown -R www-data:www-data storage bootstrap/cache

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

EXPOSE 80

CMD ["apache2-foreground"]
