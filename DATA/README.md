# Mental Tracker - Серверная часть

Серверная часть приложения Mental Tracker на Node.js + Express.

## 🚀 Быстрый запуск

```bash
cd DATA
npm install
npm start
```

Сервер запустится на `http://localhost:3050`

## 📁 Структура

```
DATA/
├── server.js              # Основной Express сервер
├── sqlite-data.js         # SQLite адаптер (по умолчанию)
├── pg-data.js             # PostgreSQL адаптер
├── storage-config.js      # Конфигурация хранилища
├── cortex.db              # SQLite база данных
├── public/                # Клиентские файлы
│   ├── index.html         # Веб-интерфейс
│   ├── app.js             # Клиентская логика
│   ├── data.js            # Работа с данными
│   └── style.css          # Стили
├── tests/                 # Тесты
└── STORAGE.md             # Документация по хранилищу
```

## 🗄️ Хранилище данных

По умолчанию используется **SQLite** (`cortex.db`).

### Переключение на PostgreSQL:
```bash
echo "STORAGE_TYPE=postgresql" > .env
# Добавьте настройки подключения к PostgreSQL
npm start
```

Подробнее: [STORAGE.md](STORAGE.md)

## 🔧 API

- `GET /ping` - Проверка работоспособности
- `POST /initializeUserData` - Инициализация пользователя
- `GET /skills?user={userId}` - Навыки пользователя
- `GET /activities?user={userId}` - Активности пользователя

## 🧪 Тестирование

```bash
# Запуск тестов
npm test

# Тест SQLite
node -e "require('./sqlite-data').connect().then(() => console.log('OK'))"
```

## 📝 Логи

Сервер выводит подробные логи:
- Подключение к БД
- Создание таблиц
- API запросы
- Операции с данными

---

Подробная документация: [../README.md](../README.md)
