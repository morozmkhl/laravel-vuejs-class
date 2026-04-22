# Vue + Laravel (монорепозиторий)

Проект с **раздельным фронтендом и бэкендом**: SPA на **Vue 3** и **API** на **Laravel**, сборка и запуск через **Docker Compose**. Точка входа для пользователя — **nginx**: статика Vue, запросы к `/api` — PHP-FPM, загрузки — `/storage`.

---

## Содержание

1. [Структура репозитория](#структура-репозитория)
2. [Бэкенд (Laravel)](#бэкенд-laravel)
3. [Фронтенд (Vue)](#фронтенд-vue)
4. [Docker: сервисы и сеть](#docker-сервисы-и-сеть)
5. [Локальная разработка без Docker](#локальная-разработка-без-docker)
6. [Переменные окружения](#переменные-окружения)
7. [Расширение проекта](#расширение-проекта)

---

## Структура репозитория

```
vuejs_laravel/
├── backend/                 # Laravel: только API и приложение
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/            # миграции, SQLite/MySQL по .env
│   ├── public/              # index.php, симлинк storage
│   ├── routes/
│   │   ├── api.php          # маршруты API (префикс /api)
│   │   └── web.php
│   └── ...
├── frontend/                # Vue 3 + Vite (отдельное приложение)
│   ├── dist/                # production-сборка (отдаёт nginx)
│   ├── src/
│   │   ├── api/             # HTTP-клиент и модули по доменам
│   │   ├── assets/          # глобальные стили
│   │   ├── components/      # UI-компоненты (в т.ч. admin/)
│   │   ├── composables/     # переиспользуемая логика Vue
│   │   ├── layouts/         # оболочки страниц
│   │   ├── router/          # vue-router
│   │   ├── utils/           # утилиты без Vue
│   │   └── views/           # страницы-экраны
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── docker/
│   ├── frontend/
│   │   └── build.sh         # npm ci + vite build (сервис frontend-build)
│   ├── nginx/
│   │   └── default.conf     # маршрутизация /, /api, /storage
│   └── php/
│       ├── Dockerfile       # PHP-FPM 8.4 + расширения
│       ├── docker-entrypoint.sh
│       └── uploads.ini      # лимиты загрузки файлов
├── docker-compose.yml
├── .gitignore
└── README.md
```

Идея разделения: **в `backend` нет встроенного фронта приложения** (кроме стандартного welcome Laravel); **в `frontend` — только SPA**. Обмен с API — **JSON** (`Content-Type: application/json`, `Accept: application/json`); картинки товаров передаются в JSON как **base64** (см. ниже).

---

## Бэкенд (Laravel)

- **Расположение:** каталог `backend/`.
- **Назначение:** REST API под префиксом `/api` (настраивается в `bootstrap/app.php` через файл `routes/api.php`).
- **Версия PHP:** ориентир на **8.4** (см. `docker/php/Dockerfile` и `backend/composer.json`).

### Маршруты API

Файл `backend/routes/api.php` подключается как **API-группа**; Laravel автоматически добавляет префикс **`api`** ко всем маршрутам из этого файла.

Пример: запись `Route::get('/hello', ...)` доступна как **`GET /api/hello`**.

Текущее содержимое можно смотреть в репозитории; типовой демо-эндпоинт — приветствие в JSON.

### Формат JSON (контракт)

- Успешные ответы с полезной нагрузкой: **`{ "data": ... }`**. Для ошибок валидации Laravel отдаёт **`{ "message": "...", "errors": { "поле": ["…"] } }`** (фронт в `fetchJson` вытаскивает первое сообщение из `errors`, если есть).
- Запросы с телом: **`Content-Type: application/json`**, тело — объект.
- **Товары** (`/api/products`): создание/обновление принимают поля `name`, `description` (nullable), `price` (число), опционально **`image`**: `{ "base64": "<data URL или чистый base64>", "filename": "имя файла" }`. Изображение проверяется как реальное (через `getimagesizefromstring`). Ответ — один объект или массив внутри `data` в том же виде, что отдаёт контроллер (в т.ч. `image_url` для превью).
- Авторизация по токену **пока не используется** — эндпоинты открыты для разработки.

### Конфигурация приложения

- Основные настройки: `backend/config/`, переменные — через **`backend/.env`** (копия с `backend/.env.example`).
- База данных задаётся в `.env`: локально часто **SQLite** (`database/database.sqlite`), в Docker Compose по умолчанию **MySQL** (переменные переопределяются в `docker-compose.yml` для сервиса `php`).

### Миграции

- Файлы: `backend/database/migrations/`.
- В контейнере PHP при старте выполняется `php artisan migrate` (см. `docker/php/docker-entrypoint.sh`), плюс `php artisan storage:link` для публичного доступа к загрузкам.

### Загрузки файлов

- Файлы приложения: `backend/storage/app/`.
- Публичная раздача: `backend/storage/app/public` и симлинк **`public/storage`** → при отдаче через Laravel URL вида `/storage/...`.

В Docker nginx дополнительно монтирует **`backend/storage/app/public`** в контейнер nginx как **`/var/www/storage-public`**, чтобы раздавать **`/storage/`** без зависимости от симлинка внутри образа nginx.

---

## Фронтенд (Vue)

- **Расположение:** каталог `frontend/`.
- **Стек:** Vue **3**, сборка **Vite**, маршрутизация **vue-router** **4**.
- **Сборка:** `npm run build` → статика в **`frontend/dist/`** (её подключает nginx). В Docker тот же шаг выполняет сервис **`frontend-build`** при `docker compose up`.

### Маршруты SPA (`frontend/src/router/index.js`)

Корневой layout — **`MainLayout`**, вложенные страницы:

| Путь            | Компонент            | Назначение                          |
|-----------------|----------------------|-------------------------------------|
| `/`             | `HomeView`           | главная, демо-запрос к API          |
| `/login`        | `LoginView`          | форма входа (вёрстка)               |
| `/register`     | `RegisterView`       | форма регистрации (вёрстка)         |
| `/admin`        | `AdminProductsView`  | админка товаров (UI + вызовы API)   |

`App.vue` подключает только `<router-view />`; общее меню — в **`MainLayout.vue`** (ссылки «Вход», «Регистрация», «Админ-панель»).

### Слои фронтенда (как устроено расширение)

1. **`src/api/client.js`** — базовый URL (`VITE_API_URL`), **`fetchJson`**: сериализация тела в JSON, заголовки `Accept`/`Content-Type`, разбор ошибок Laravel, по умолчанию возвращает содержимое ключа **`data`** из успешного ответа.
2. **`src/api/products.js`** — операции по товарам: JSON + перевод выбранного файла в **`{ base64, filename }`** для поля `image`. Имеет смысл дублировать такой же модуль для других сущностей (`orders.js`, `users.js`, …).
3. **`src/utils/`** — чистые функции (форматирование цены, обрезка текста), без зависимости от компонентов.
4. **`src/composables/`** — состояние и сценарии страниц, например **`useAdminProductsPage.js`** связывает таблицу, модалку и API.
5. **`src/components/admin/`** — узкие презентационные блоки: **`ProductTable.vue`**, **`ProductFormModal.vue`**.
6. **`src/views/`** — страницы, собирающие layout и блоки; после рефакторинга **`AdminProductsView.vue`** остаётся тонкой оболочкой.

Так проще добавлять новые разделы: новый маршрут → view → при необходимости composable + компоненты + `api/*.js`.

### Стили

- Глобальные токены и классы (`.btn`, `.card`, `.field`, `.input`): **`src/assets/main.css`**.
- Компоненты по возможности держат **scoped**-стили рядом с шаблоном.

---


## Docker: сервисы и сеть

Файл **`docker-compose.yml`** в корне проекта.

| Сервис | Роль |
|--------|------|
| **frontend-build** | Одноразовый контейнер **Node**: при каждом `docker compose up` выполняет **`npm ci`** и **`npm run build`** в **`frontend/`** (при необходимости; см. `docker/frontend/build.sh`). Пока сборка не завершится успешно, **nginx не стартует**. |
| **nginx** | Порт **8080** → 80. Раздаёт **`frontend/dist`**, проксирует **`/api`** в PHP-FPM, отдаёт **`/storage/`** из тома с файлами Laravel. |
| **php** | Сборка из **`docker/php`**: PHP-FPM **8.4**, расширения (pdo_mysql, intl, mbstring и т.д.), лимиты загрузки из **`uploads.ini`**. Код: **`./backend`** → `/var/www/html`. |
| **mysql** | Версия **8.4**, данные в volume **`mysql_data`**. Учётные данные задаются в `docker-compose.yml` и должны совпадать с тем, что ожидает Laravel (через env у сервиса `php`). |

### Как трафик попадает в приложение

1. **`/`**, **`/login`**, … — SPA: nginx отдаёт файлы из `frontend/dist`, для несуществующих путей — **`index.html`** (история роутера на клиенте).
2. **`/api/...`** — FastCGI в контейнер `php`, точка входа Laravel — `public/index.php`.
3. **`/storage/...`** — статика из смонтированного **`backend/storage/app/public`**.

### Типовой запуск

```bash
docker compose up -d --build
```

Сервис **frontend-build** сам соберёт **`frontend/dist`** перед стартом nginx (ручной `npm run build` не обязателен).

Приложение: **http://localhost:8080**.

После изменений **только фронта** достаточно снова выполнить `docker compose up` (или `docker compose run --rm frontend-build`), чтобы пересобрать `dist`, и при необходимости перезапустить nginx.

---

## Локальная разработка без Docker

Удобно держать два процесса: Laravel и Vite.

1. **Бэкенд** (из `backend/`):

   ```bash
   composer install
   cp .env.example .env   # при необходимости
   php artisan key:generate
   php artisan migrate
   php artisan serve
   ```

   По умолчанию API: **http://127.0.0.1:8000**, путь **`/api/...`**.

2. **Фронтенд** (из `frontend/`):

   ```bash
   npm install
   npm run dev
   ```

   Vite: **http://127.0.0.1:8080**. В **`vite.config.js`** настроен **proxy**:

   - **`/api`** → `VITE_DEV_API_PROXY` или **`http://127.0.0.1:8000`**;
   - **`/storage`** → тот же хост (чтобы превью загрузок работали при dev).

Браузер открывают на порту **Vite (8080)**; запросы к API уходят на `artisan serve` через proxy.

**502 Bad Gateway** при логине/регистрации в dev: Vite проксирует на `VITE_DEV_API_PROXY` (по умолчанию `http://127.0.0.1:8000`), а Laravel там не слушает — запустите `php artisan serve` в `backend/` или выставьте в `frontend/.env` тот же host:port, что в выводе `artisan serve` (и перезапустите `npm run dev`).

**404 на `/assets/index-….js`:** в **режиме разработки** (`npm run dev`) в странице должен подключаться **`/src/main.js`**, а не хеш в `assets`. Если в консели запросы к **`/assets/index-XXXX.js`**, у вас **закэширован старый** `index.html` от `vite build` / `vite preview` — после новой сборки имя файла меняется, старый исчезает → 404. Сделайте **жёсткое обновление** (Ctrl+Shift+R / «без кэша») или **очистите кэш** для `127.0.0.1:8080`. В `vite.config.js` для dev/preview включён `Cache-Control: no-store`, чтобы уменьшить повторение. Для ежедневной разработки используйте **`npm run dev`**, а не старые файлы из `dist/`.

---

## Переменные окружения

### Фронтенд (`frontend/.env`, см. `frontend/.env.example`)

| Переменная | Назначение |
|------------|------------|
| **`VITE_API_URL`** | Базовый URL API для production-сборки. Пустое значение — относительные пути с того же origin (например `https://site.com/api/...`). Если API на другом домене — полный URL с протоколом. |
| **`VITE_DEV_API_PROXY`** | Только для **режима разработки Vite**: куда проксировать `/api` и `/storage` (по умолчанию `http://127.0.0.1:8000`). |

Переменные с префиксом **`VITE_`** встраиваются в клиентский бандл на этапе сборки.

### Бэкенд (`backend/.env`)

Стандартный Laravel: `APP_URL`, `DB_*`, и т.д. В Docker значения БД часто задаются через **`environment`** в `docker-compose.yml` у сервиса `php` и переопределяют файл `.env` при запуске в контейнере.

---

## Расширение проекта

- **Новая сущность в API:** модель + миграция + контроллер в `app/Http/Controllers/Api/` + маршруты в `routes/api.php`.
- **Новый экран во фронте:** маршрут в `router/index.js`, view в `views/`, при необходимости `api/имя.js`, composable и компоненты по аналогии с товарами.
- **Авторизация:** обычно Laravel Sanctum или JWT + защищённые маршруты `api` и хранение токена на фронте; меню «Вход»/«Регистрация» сейчас без логики — заготовка под это.
- **Единый стиль Docker:** при добавлении сервисов (Redis, очередь) — новые блоки в `docker-compose.yml` и при необходимости правки `default.conf` только если появятся новые префиксы URL.

---

## Краткий чеклист «где что лежит»

| Задача | Где смотреть |
|--------|----------------|
| Маршруты API | `backend/routes/api.php` |
| Логика HTTP API | `backend/app/Http/Controllers/` |
| Миграции | `backend/database/migrations/` |
| Маршруты SPA | `frontend/src/router/index.js` |
| Общая оболочка с меню | `frontend/src/layouts/MainLayout.vue` |
| Вызовы бэкенда с фронта | `frontend/src/api/` |
| Docker и nginx | `docker-compose.yml`, `docker/nginx/default.conf`, `docker/php/`, `docker/frontend/build.sh` |
| Production-статика фронта | `frontend/dist/` (локально — `npm run build`; в Docker — сервис `frontend-build`) |

Если нужно, этот файл можно сократить для README только бэкенда или только фронта, вынеся общие части в корневой `README.md` (как здесь) и оставив в подпроектах короткие отсылки.
