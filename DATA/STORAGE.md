# Конфигурация хранилища данных

Проект поддерживает несколько типов хранилища данных. По умолчанию используется **SQLite**.

## Доступные типы хранилища

### 1. SQLite (по умолчанию)
- **Файл:** `cortex.db`
- **Преимущества:** Локальная БД, не требует настройки сервера
- **Использование:** Идеально для разработки и небольших проектов

### 2. PostgreSQL
- **Требует:** Настройку переменных окружения
- **Преимущества:** Полнофункциональная СУБД для продакшена
- **Использование:** Для больших проектов и продакшена

### 3. File Storage (TODO)
- **Файлы:** JSON файлы для каждого пользователя
- **Статус:** Не реализовано

### 4. Memory Storage (TODO)
- **Хранение:** В памяти приложения
- **Статус:** Не реализовано (для тестов)

## Переключение типа хранилища

### Способ 1: Переменная окружения
```bash
# SQLite (по умолчанию)
STORAGE_TYPE=sqlite npm start

# PostgreSQL
STORAGE_TYPE=postgresql npm start
```

### Способ 2: Файл .env
Создайте файл `.env` в папке `DATA/`:
```env
STORAGE_TYPE=sqlite
```

### Способ 3: Изменение кода
В файле `DATA/storage-config.js` измените строку:
```javascript
const STORAGE_TYPE = process.env.STORAGE_TYPE || 'sqlite';
```

## Настройка PostgreSQL

Если используете PostgreSQL, создайте файл `DATA/.env`:
```env
STORAGE_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=mental_tracker
DB_USER=your_username
DB_PASSWORD=your_password
```

## Структура таблиц

Все адаптеры используют одинаковую структуру:

### skills
- `id` - Уникальный идентификатор
- `user_id` - ID пользователя
- `name` - Название навыка
- `description` - Описание
- `complexity` - Сложность (1-10)
- `familiarity` - Знакомство (0-100)
- `created_at` - Дата создания
- `updated_at` - Дата обновления

### history
- `id` - Уникальный идентификатор
- `user_id` - ID пользователя
- `skill_id` - Ссылка на навык
- `event_type` - Тип события
- `notes` - Заметки
- `event_date` - Дата события

### actions
- `id` - Уникальный идентификатор
- `user_id` - ID пользователя
- `skill_id` - Ссылка на навык
- `action_type` - Тип действия
- `details` - Детали
- `duration_minutes` - Длительность в минутах
- `completed_at` - Дата завершения

## Миграция данных

При переключении между типами хранилища данные не мигрируют автоматически. Для миграции:

1. Экспортируйте данные из текущего хранилища
2. Переключите тип хранилища
3. Импортируйте данные в новое хранилище

## Тестирование

Для тестирования SQLite адаптера:
```bash
cd DATA
node -e "
const sqliteData = require('./sqlite-data');
(async () => {
  await sqliteData.connect();
  await sqliteData.createTables();
  console.log('SQLite готов к работе');
  await sqliteData.close();
})();
" 