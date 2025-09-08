# Mental Tracker

Веб-приложение для отслеживания прогресса в развитии навыков с игровыми элементами.

## 🎯 Описание

Mental Tracker позволяет:
- Создавать и отслеживать навыки с уровнями сложности
- Добавлять активности и задачи для развития навыков
- Вести историю прогресса с системой очков
- Получать достижения за выполнение задач
- Визуализировать прогресс через современный веб-интерфейс

## 🏗️ Архитектура

```
mental-tracker/
├── DATA/                    # Серверная часть
│   ├── server.js           # Express API сервер
│   ├── sqlite-data.js      # SQLite адаптер (по умолчанию)
│   ├── pg-data.js          # PostgreSQL адаптер
│   ├── storage-config.js   # Конфигурация хранилища
│   ├── public/             # Клиентские файлы
│   │   ├── index.html      # Главная страница
│   │   ├── app.js          # Клиентская логика
│   │   ├── data.js         # Работа с данными
│   │   └── style.css       # Стили
│   └── cortex.db           # SQLite база данных
├── UI/                     # Фронтенд сервер (опционально)
└── package.json            # Зависимости проекта
```

## 🚀 Быстрый старт

### 1. Установка

```bash
git clone <repository-url>
cd mental-tracker
npm install
```

### 2. Запуск

```bash
# Запуск с SQLite (по умолчанию)
npm start

# Сервер будет доступен на http://localhost:3050
```

### 3. Инициализация пользователя

```bash
# Создание первого пользователя
curl -X POST -H "Content-Type: application/json" \
  -d '{"userId": "your_username"}' \
  http://localhost:3050/initializeUserData
```

## 🗄️ Типы хранилища

Проект поддерживает несколько типов хранилища данных:

### SQLite (по умолчанию) ✅
```bash
npm start
# Использует файл DATA/cortex.db
```

### PostgreSQL ✅
```bash
# Создайте файл DATA/.env:
echo "STORAGE_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=mental_tracker
DB_USER=your_username
DB_PASSWORD=your_password" > DATA/.env

npm start
```

### Переключение типа хранилища
```bash
# Через переменную окружения
STORAGE_TYPE=sqlite npm start
STORAGE_TYPE=postgresql npm start

# Через .env файл
echo "STORAGE_TYPE=sqlite" > DATA/.env
```

Подробнее: [DATA/STORAGE.md](DATA/STORAGE.md)

## 📊 API Endpoints

### Пользователи
- `POST /initializeUserData` - Инициализация пользователя

### Навыки
- `GET /skills?user={userId}` - Получить навыки пользователя
- `GET /skills/{skillCode}?user={userId}` - Получить конкретный навык
- `GET /skills/{skillCode}/history?user={userId}` - История навыка

### Активности
- `GET /activities?user={userId}` - Получить активности
- `POST /skills/{skillCode}/history` - Добавить активность
- `PUT /skills/{skillCode}/history/{historyId}` - Обновить запись
- `DELETE /skills/{skillCode}/history/{historyId}` - Удалить запись

### Служебные
- `GET /ping` - Проверка работоспособности

## 🎮 Игровые механики

### Система уровней
- **Familiarity**: 0-100 (знакомство с навыком)
- **Level**: familiarity / 10 (уровень навыка)
- **Complexity**: 1-10 (сложность навыка)

### Очки и прогресс
- Активности приносят очки
- Очки влияют на прогресс навыка
- Достижения за выполнение задач

### Типы активностей
- **Обычные активности** - регулярная практика
- **Задачи** - с дедлайнами и статусом выполнения

## 🛠️ Разработка

### Структура данных

#### Skills (Навыки)
```sql
CREATE TABLE skills (
  id INTEGER PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  complexity INTEGER CHECK (complexity >= 1 AND complexity <= 10),
  familiarity INTEGER CHECK (familiarity >= 0 AND familiarity <= 100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, name)
);
```

#### History (История)
```sql
CREATE TABLE history (
  id INTEGER PRIMARY KEY,
  user_id TEXT NOT NULL,
  skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  notes TEXT,
  event_date DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Actions (Действия)
```sql
CREATE TABLE actions (
  id INTEGER PRIMARY KEY,
  user_id TEXT NOT NULL,
  skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  details TEXT,
  duration_minutes INTEGER,
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Тестирование

```bash
# Тест SQLite адаптера
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

# Запуск тестов
npm test
```

### Добавление нового типа хранилища

1. Создайте адаптер в `DATA/` (например, `redis-data.js`)
2. Реализуйте методы: `connect`, `createSchema`, `createTables`, `readData`, `writeData`, `deleteData`
3. Добавьте в `DATA/storage-config.js`:
```javascript
case 'redis':
    return require('./redis-data');
```

## 🌐 Веб-интерфейс

### Основные функции
- **Главная страница** - список навыков с прогрессом
- **Детальный вид навыка** - история, активности, статистика
- **Модальные окна** - добавление/редактирование активностей
- **Drag & Drop** - перетаскивание модальных окон
- **Группировка по дням** - история активностей

### Технологии
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Node.js, Express.js
- **Database**: SQLite (по умолчанию), PostgreSQL
- **UI**: Современный responsive дизайн

## 📝 Примеры использования

### Создание навыка
```javascript
// Через API
POST /skills
{
  "user_id": "john_doe",
  "name": "Программирование",
  "description": "Изучение веб-разработки",
  "complexity": 7,
  "familiarity": 25
}
```

### Добавление активности
```javascript
// Через веб-интерфейс или API
POST /skills/Программирование/history
{
  "activityId": "1",
  "notes": "Изучил React hooks",
  "timestamp": "2025-05-29T10:00:00Z"
}
```

## 🔧 Конфигурация

### Переменные окружения
```env
# Тип хранилища
STORAGE_TYPE=sqlite

# PostgreSQL (если используется)
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=mental_tracker
DB_USER=username
DB_PASSWORD=password

# Порт сервера
PORT=3050
```

### Файлы конфигурации
- `DATA/.env` - переменные окружения
- `DATA/storage-config.js` - конфигурация хранилища
- `package.json` - зависимости и скрипты

## 🚨 Устранение неполадок

### Порт занят
```bash
# Найти процесс на порту 3050
netstat -ano | findstr :3050

# Завершить процесс
taskkill /PID <PID> /F

# Или использовать другой порт
PORT=3051 npm start
```

### Проблемы с базой данных
```bash
# Проверка SQLite
ls -la DATA/cortex.db

# Пересоздание таблиц
rm DATA/cortex.db
npm start
```

### Логи и отладка
```bash
# Запуск с подробными логами
DEBUG=* npm start

# Проверка API
curl http://localhost:3050/ping
```

## 📄 Лицензия

ISC License

## 🤝 Вклад в проект

1. Fork проекта
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📞 Поддержка

- **Issues**: Создайте issue в GitHub
- **Документация**: См. файлы в папке `DATA/`
- **API**: Используйте `/ping` для проверки работоспособности

---

**Mental Tracker** - отслеживайте свой прогресс, достигайте целей! 🎯
