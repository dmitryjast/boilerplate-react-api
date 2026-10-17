# DEVELOPMENT

Как устроен проект. Этот файл обновляется только при изменении архитектуры. Текущие задачи и лог сессий лежат в [PLAN.md](./PLAN.md).

## Назначение

Бэкенд-бойлерплейт (API) для React-фронтенда: аутентификация, роли, email-рассылки, глобальные настройки сайта. Фронтенд — отдельный проект (по умолчанию `http://localhost:5173`).

## Стек

| Слой | Технология |
|---|---|
| Runtime | Node.js 20 |
| Фреймворк | NestJS 11 (platform-express) |
| Язык | TypeScript 5 |
| БД | PostgreSQL 16 (локально через `brew services`) |
| ORM | TypeORM 0.3 (`synchronize`, миграций нет) |
| Аутентификация | Passport (`passport-jwt`), `@nestjs/jwt`, bcrypt |
| Валидация | class-validator + class-transformer (глобальный `ValidationPipe`) |
| Почта | `@nestjs-modules/mailer` + nodemailer + Handlebars-шаблоны |
| Тесты | Jest (unit `*.spec.ts`, e2e в `test/`) |
| Линт/формат | ESLint 9 + Prettier |

## Запуск

```bash
brew services start postgresql@16   # поднять БД
npm install
npm run setup        # интерактивно создаёт .env и запускает сиды
npm run start:dev    # dev-сервер с watch; TypeORM сам создаёт таблицы
PORT=4000 npm run start:dev   # запуск на другом порту (env важнее .env)
npm run seed         # сиды отдельно
```

Продакшен: `npm run build && npm run start:prod` с `NODE_ENV=prod`.

## Структура

```
scripts/
  setup.js               # интерактивная генерация .env и запуск сидов
  seeds/
    index.ts             # поднимает Nest application context и вызывает сиды
    admin.seed.ts        # создаёт admin, если его нет (спрашивает данные в терминале)
    settings.seed.ts     # создаёт запись настроек
src/
  main.ts                # bootstrap: CORS, ValidationPipe, cookie-parser, ClassSerializerInterceptor
  app.module.ts          # ConfigModule (global), TypeORM, подключение модулей
  modules/
    auth/
      auth.controller.ts / auth.service.ts   # все auth-роуты и логика
      dto/                                   # LoginDto, RegisterDto
      guards/            # JwtGuard ('jwt'), RefreshGuard ('jwt-refresh'), RolesGuard
      strategies/        # JwtStrategy (Bearer), RefreshStrategy (cookie refreshToken)
      decorators/        # @Roles(...)
      email-verification/  # сущность + сервис токенов/кодов верификации
      password-resets/     # сущность + сервис токенов сброса пароля
    users/               # сущность User, UsersService (контроллер пока пустой)
    sessions/            # сущность Session (хэши refresh-токенов), SessionsService
    settings/            # сущность Settings, SettingsService (контроллер пока пустой)
    mail/                # MailService + templates/*.hbs
test/                    # e2e
```

Модули следуют стандартной схеме Nest: `*.module.ts`, `*.service.ts`, `*.controller.ts`, `*.entity.ts`. Новые модули генерируются через `nest generate module|service|controller modules/<name>`.

## Архитектурные решения

### Аутентификация
- **Access token** — JWT на **15 минут**, payload `{ userId, email, role }`. Отдаётся в теле ответа, фронт шлёт его в `Authorization: Bearer <token>`.
- **Refresh token** — JWT на **30 дней**, payload `{ userId }`. Хранится только в **httpOnly cookie** `refreshToken` (`sameSite: lax`, `secure` при `NODE_ENV=prod`).
- Каждый логин создаёт запись в `sessions` с **bcrypt-хэшем** refresh-токена, так что у пользователя может быть несколько устройств.
- `/auth/refresh` делает **ротацию**: ищет сессию, сравнивая токен со всеми сессиями пользователя, удаляет её и выдаёт новую пару токенов.
- `/auth/logout` удаляет **все** сессии пользователя (выход со всех устройств).
- Оба токена подписаны одним `JWT_SECRET`. Сроки жизни зашиты в `AuthService.generateTokens`, а `JWT_EXPIRES_IN` из `.env` перекрывается.

### Роли
- `UserRole`: `admin`, `editor`, `manager`, `user` (по умолчанию `user`).
- Как защитить роут:
  ```ts
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  ```
- `RolesGuard` берёт `req.user.role` из access-токена, поэтому новая роль начинает действовать только после refresh.

### Email-верификация и сброс пароля
- Способ верификации задаётся в `EMAIL_VERIFICATION_METHOD`: `link` (по умолчанию) или `code`.
  - `link`: 32-байтный hex-токен, ссылка `FRONTEND_URL/verify-email?token=…&userId=…`.
  - `code`: 6 hex-символов в верхнем регистре.
- Сброс пароля: токен, ссылка `FRONTEND_URL/reset-password?token=…&userId=…`.
- Все токены и коды хранятся **в виде bcrypt-хэшей**, живут **1 час**, на пользователя одна активная запись (старая удаляется при создании новой).
- Письмо о верификации при регистрации отправляется в фоне, ответ его не ждёт (ошибка только логируется). `forgot-password` письмо ждёт.
- `forgot-password` всегда отвечает одинаково, чтобы по ответу нельзя было узнать, существует ли email.
- Верификация ставит `users.verifiedAt`. Доступ для неверифицированных пока **не ограничен**.

### Сериализация и валидация
- `ClassSerializerInterceptor` глобально применяет `@Exclude()`, поэтому `User.password` не попадает в ответы, если возвращать сущность.
- `ValidationPipe` глобальный, с `whitelist: true` и `transform: true`. Поля без декораторов class-validator молча вырезаются, а тело приходит в контроллер экземпляром DTO-класса. Валидация работает только там, где тело описано DTO-классом в `dto/`, поэтому каждое новое тело запроса описывать DTO-классом, а не инлайн-типом. Каждое поле DTO должно иметь хотя бы один декоратор, иначе `whitelist` его вырежет.

### CORS
Разрешены запросы без `origin`, с `FRONTEND_URL` и с любого `http://localhost:<port>`. `credentials: true`, иначе cookie не передаются.

### База данных
- `synchronize: true` везде, кроме `NODE_ENV=prod`. Схема берётся из сущностей, миграций нет.
- Сущности подхватываются по маске `**/*.entity{.ts,.js}`.
- Таблицы: `users`, `sessions`, `email_verifications`, `password_resets`, `settings`. У дочерних таблиц `ON DELETE CASCADE` на `users`.

## API

Базовый URL: `http://localhost:${PORT}`, глобального префикса нет.

| Метод | Роут | Guard | Тело | Ответ |
|---|---|---|---|---|
| GET | `/` | — | — | `Hello World!` |
| POST | `/auth/register` | — | `{ name, email, password(min 8) }` | `{ accessToken }` + cookie |
| POST | `/auth/login` | — | `{ email, password }` | `{ accessToken }` + cookie |
| POST | `/auth/refresh` | RefreshGuard (cookie) | — | `{ accessToken }` + новый cookie |
| POST | `/auth/logout` | JwtGuard | — | `{ message }`, cookie очищается |
| GET | `/auth/me` | JwtGuard | — | `User` без пароля |
| POST | `/auth/forgot-password` | — | `{ email }` | `{ message }` |
| POST | `/auth/reset-password` | — | `{ userId, token, newPassword }` | `{ message }` |
| POST | `/auth/send-verification` | JwtGuard | — | `{ message }` |
| POST | `/auth/verify-email` | — | `{ userId, tokenOrCode }` | `{ message }` |

Контроллеры `/users` и `/settings` объявлены, но роутов в них пока нет.

## Переменные окружения

`.env` генерирует `npm run setup`. Файл в `.gitignore`.

| Переменная | По умолчанию | Назначение |
|---|---|---|
| `NODE_ENV` | `dev` | `prod` выключает `synchronize` и включает `secure` для cookie |
| `PORT` | `3000` | порт сервера |
| `DB_HOST` / `DB_PORT` | `localhost` / `5432` | PostgreSQL |
| `DB_NAME` | — | имя БД (создать вручную: `createdb <name>`) |
| `DB_USERNAME` / `DB_PASSWORD` | `postgres` / — | доступ к БД |
| `JWT_SECRET` | генерируется | секрет для подписи обоих токенов |
| `JWT_EXPIRES_IN` | `7d` | по факту перекрывается (см. «Аутентификация») |
| `FRONTEND_URL` | `http://localhost:5173` | CORS и ссылки в письмах |
| `SMTP_HOST` / `SMTP_PORT` | — / `587` | SMTP-сервер |
| `SMTP_USER` / `SMTP_PASSWORD` | — | SMTP-логин (для Gmail нужен app password) |
| `SMTP_FROM` | `SMTP_USER` | отправитель |
| `EMAIL_VERIFICATION_METHOD` | `link` | `link` или `code` |

## Важные нюансы

- **Порт занят:** `lsof -i :3000`, затем `kill -9 $(lsof -t -i:3000)`.
- **`*.spec.ts` в `.gitignore`.** Тесты лежат только локально и в репозиторий не попадают.
- **Шаблоны писем** читаются из `process.cwd()/src/modules/mail/templates`, а не из `dist`. Поэтому прод нужно запускать из корня проекта, где есть `src/`. Nest при этом копирует `.hbs` в `dist` (`nest-cli.json` → `assets`).
- В `AuthService` и `MailService` часть env читается через `process.env`, а не через `ConfigService`.
- `User.name` уникальный, но `register` проверяет только email. Повторное имя даст ошибку БД (500).
- `ROLES_KEY` объявлен дважды: в `roles.decorator.ts` и `roles.guard.ts`. Значения должны совпадать.
- `settings.seed` не проверяет, есть ли уже запись, и при каждом запуске добавляет новую строку.
- `setup.js` перезаписывает `.env` целиком.
- `.env.example` устарел: в нём нет `NODE_ENV`, `SMTP_*` и `EMAIL_VERIFICATION_METHOD`. Актуальный список — таблица выше.
