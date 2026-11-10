# PLAN

Живой файл. Обновлять в конце **каждой** сессии: что сделано, что в работе, что дальше. Устройство проекта описано в [DEVELOPMENT.md](./DEVELOPMENT.md).

_Последнее обновление: 2026-11-10_

## Текущее состояние

Готово: регистрация/логин, access + refresh (ротация, сессии в БД), logout, `/auth/me`, роли с `RolesGuard`, сброс пароля по email, верификация email (ссылка или код), отправка писем в фоне, `setup`-скрипт и сиды (admin, settings).

Не начато: CRUD пользователей, API настроек, ограничения для неверифицированных пользователей, миграции.

## В работе

- [ ] —

## TODO (по приоритету)

### P1 — баги и безопасность
- [x] DTO с class-validator для `forgot-password`, `reset-password` (`newPassword` min 8), `verify-email`.
- [x] Включить `whitelist: true` и `transform: true` в `ValidationPipe`. `forbidNonWhitelisted` не включали: лишние поля молча вырезаются.
- [x] `register`: уникальность `name` и `email` без учёта регистра (`citext`), 409 вместо 500, обрезка пробелов.
- [x] `settings.seed`: не создавать дубль, если запись уже есть.
- [x] Rate limiting (`@nestjs/throttler`) на login / forgot-password / verify-email / send-verification.
- [x] После сброса пароля удалять все сессии пользователя.

### P2 — функциональность
- [ ] `POST /contact` (contact form from the frontend):
  - [x] `ContactDto` and `ContactModule`.
  - [x] Email to the team: `contact.hbs`, `CONTACT_EMAIL`, `replyTo` = sender.
  - [x] Respond without waiting for SMTP: save to `contact_messages`, then send in background (`sentAt` set on success).
  - [x] Rate limit: 5 per 10 min per IP.
  - [ ] Optional: honeypot field.
- [ ] `UsersController`: CRUD для admin, обновление своего профиля, смена пароля. Заполнить пустые `create-user.dto.ts` / `update-user.dto.ts`.
- [ ] `SettingsController`: публичный `GET /settings`, `PATCH /settings` для admin.
- [ ] Решить, что делать с неверифицированными пользователями: guard или флаг в ответе `me`.
- [ ] Повторная отправка письма с кулдауном.
- [ ] Заполнять `sessions.device` (User-Agent) и добавить управление сессиями (список, выход с одного устройства).
- [ ] Чистить просроченные сессии, токены верификации и сброса (cron или при обращении).

### P3 — инфраструктура и качество
- [ ] Email queue (BullMQ + Redis) with retries: requests only enqueue the email and respond at once, a worker sends it and retries on SMTP errors. Then `forgot-password` / `send-verification` stop waiting for SMTP too. Not now, later.
- [ ] Обновить `.env.example` до полного списка переменных.
- [ ] Перевести `process.env` на `ConfigService`. Брать сроки токенов из env или удалить `JWT_EXPIRES_IN`.
- [ ] Отдельный секрет для refresh-токена (`JWT_REFRESH_SECRET`).
- [ ] Миграции TypeORM для прода вместо `synchronize`.
- [ ] Путь к шаблонам писем через `__dirname`, чтобы прод работал из `dist`.
- [ ] Вынести `ROLES_KEY` в одно место.
- [ ] Решить, держать ли `*.spec.ts` в git. Починить заготовки спеков (8 из 11 падают без моков). Написать тесты на auth-флоу (e2e).
- [ ] Прогнать `npm run format` по всему проекту (отдельным коммитом).
- [ ] Миграция для прода: `CREATE EXTENSION citext` и перевод `users.name` и `users.email` в `citext` (см. DEVELOPMENT.md → «База данных»).
- [ ] Swagger (`@nestjs/swagger`).
- [ ] Docker / docker-compose (api + postgres).
- [ ] Почистить README от шаблона NestJS.

## Открытые вопросы

- Логин без подтверждённого email: разрешать или блокировать?
- Нужен ли глобальный префикс `/api`?
- `logout` сейчас выходит со всех устройств. Нужен ли выход только с текущего?
- Где будут храниться файлы (`userPicture`, `logo`, `favicon`): локально или в S3?

## Лог сессий

Новые записи добавлять сверху. Держать примерно 10 последних, старые удалять.

### 2026-11-10
- Started `POST /contact` for the new frontend contact form. Added `ContactDto` (`name` 2–100, `email`, `subject` 3–150, `message` 10–2000, all trimmed) and `ContactModule`. For now the endpoint only validates and returns `{ message }`; email is the next step. Checked with curl: valid body → 200, spaces-only / too long / bad email / empty body → 400.
- Moved `@Trim()` to `src/common/transforms/trim.transform.ts` (rename is staged in git) and updated the auth DTO imports.
- Frontend added `.trim()` to the contact schema. Agreed on `name` max 100 for both sides.
- Wired the contact email: `ContactService` → `MailService.sendContactMessage()`, template `contact.hbs`, subject `[Contact] <subject>`, `from` = `SMTP_FROM` (not the sender, for SPF/DKIM), `replyTo` = sender. No copy to the sender (would let anyone send mail from our server to any address). `CONTACT_EMAIL` is required (`getOrThrow`, checked: the app fails to start without it); added to `.env` (`contact@boilerplate.com`) and `setup.js` (defaults to `SMTP_FROM`). Test request → 200, but it took **13.5s** because the response waits for SMTP (next step).
- Contact: chose option C — save to new table `contact_messages` first (entity `ContactMessage`, created by `synchronize`), then send the email in background; `sentAt` is filled on success, stays NULL on SMTP error. Response now ~0.03s. Checked both: normal send fills `sentAt`, broken SMTP leaves the row with NULL. Test rows are still in `contact_messages` (ids 1–6).
- Added nodemailer timeouts in `mail.module.ts` (all emails): `connectionTimeout` 3s, `greetingTimeout` 10s, `socketTimeout` 30s. nodemailer 9 tries every IP of `SMTP_HOST` in turn with the full `connectionTimeout` (Mailtrap has 6 IPs): with 10s the error came after 70s, with 3s after ~28s. Without timeouts it hangs for many minutes. Normal send still works.
- Rate limiting: `@nestjs/throttler` (installed by the user), global guard with 100/min per IP per route, stricter `@Throttle()` on auth routes and `/contact` (values in DEVELOPMENT.md → Rate limiting). 429 message replaced with a readable one. Added `TRUST_PROXY` (`main.ts` → `app.set('trust proxy', n)`), `.env` = 0, `setup.js` asks for the number of proxies (Cloudflare / nginx). Checked on :3000: `GET /` 100×200 then 429; `/contact` 5×400 then 429 with `Retry-After: 600`; `refresh` not affected. Frontend shows a message on 429. Counters are in memory (Redis later, with the email queue).

### 2026-11-09
- Server failed to start with `EADDRINUSE :3000`. Cause: an old `npm run start:dev` from 2026-10-29 had been suspended with Ctrl+Z and was still holding the port. Stopped those processes.
- Verification emails were not being sent: Mailtrap port 587 is unreachable from the current network (`ETIMEDOUT`), while 2525 works (checked with `nodemailer.verify()`, login succeeds). Set `SMTP_PORT=2525` in `.env`. ⚠️ `scripts/setup.js` defaults to 587 and will overwrite `.env`.

### 2026-10-17
- Разобрали запуск: `npm run start:dev`, другой порт через `PORT=4000 npm run start:dev`.
- Создали `DEVELOPMENT.md` и `PLAN.md`. При аудите кода нашли проблемы, они записаны в TODO (P1–P3).
- Добавили `ForgotPasswordDto`, `ResetPasswordDto` и `VerifyEmailDto` в `auth/dto/` и подключили их в `AuthController`. Невалидные тела теперь получают 400 (проверено через curl). `userId` должен приходить числом. Фронт подтвердил, что уже шлёт его числом и лишних полей не отправляет.
- Включили в глобальном `ValidationPipe` `whitelist: true` (вырезает поля без декораторов) и `transform: true` (тело становится экземпляром DTO-класса). Проверили прямым вызовом pipe и через curl.
- Решили, что `name` — уникальный никнейм, и сделали `name` и `email` регистронезависимыми через Postgres `citext`. Локальная база переведена вручную через `ALTER TABLE` (перед этим сделан бэкап, данные сверены со снимком). Добавили `UsersService.findByName`, в `register` — проверку имени (409) и перехват `23505` на случай одновременной регистрации, а в DTO — `@Trim()` для `name` и `email`. Через curl проверены регистр, пробелы, гонка, `me` и `refresh`. Тестовых пользователей удалили, база совпадает со снимком «до».
- `resetPassword` теперь удаляет все сессии пользователя. Проверено: после сброса 2 сессии превратились в 0, старый refresh даёт 401, старый пароль — 401, новый — 200, повторное использование токена — 401.
- `settings.seed` пропускает создание, если запись уже есть. Проверено двойным запуском, запись одна. Созданную запись удалили, чтобы вернуть базу в исходное состояние.
- ⚠️ В локальной базе **нет admin и нет записи settings** (0 строк). Чтобы их создать, нужно запустить `npm run seed`: он спросит данные admin в терминале.

### 2026-09-24
- Письмо о верификации при регистрации отправляется в фоне (`79a736c`).
- Обновлён `setup.js` (`f868007`).

### 2026-09-18
- Обновлён шаблон письма с кодом верификации (`34b8a60`).

### 2026-09-11
- Авторизация по ролям: `RolesGuard` и `@Roles` (`de71212`).
- Верификация email ссылкой и кодом (`4b420b4`).
