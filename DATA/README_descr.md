﻿>>> Можешь проанализировать файлы и сказать что в них?


Конечно! Давайте проанализируем каждый из предоставленных файлов и разберем их содержимое.

### 1. **server.js**
Это основной файл сервера, написанный на Node.js с использованием фреймворка Express. Он отвечает за обработку HTTP-запросов и управление данными приложения. Основные функции:

- **Импорт модулей**: Используются такие модули, как `express`, `cors`, `path`, `fs`, а также пользовательские модули (`data`, `game`, `dateUtils`).
- **Настройка сервера**: Сервер настраивается на использование CORS, статических файлов и обработки JSON.
- **Маршруты (routes)**:
  - **GET-запросы**: 
    - `/skills` — возвращает список всех навыков.
    - `/skills/:skillCode` — возвращает данные о конкретном навыке.
    - `/skills/:skillCode/history` — возвращает историю активности для конкретного навыка.
    - `/activities` — возвращает список всех активностей.
  - **POST-запросы**:
    - `/skills/:skillCode/history` — добавляет запись в историю активности для навыка.
    - `/skills/:skillCode/achievements` — добавляет достижение для навыка.
    - `/skills/:skillCode/points` — добавляет очки к навыку.
    - `/activities` — создает новую активность.
  - **PUT-запрос**:
    - `/skills/:skillCode/history/:historyId` — обновляет запись в истории активности.
  - **DELETE-запрос**:
    - `/skills/:skillCode/history/:historyId` — удаляет запись из истории активности.
- **Дополнительные маршруты**:
  - `/history` — возвращает всю историю активности.
  - `/actions` — возвращает данные о действиях.
  - `/skills-raw` — возвращает сырые данные о навыках.
  - `/editor` — возвращает HTML-страницу для редактирования JSON.
  - `/ping` — используется для проверки работоспособности сервера.
- **Запуск сервера**: Сервер запускается на порту, указанном в переменной окружения `PORT`, или на порту 3050 по умолчанию.

### 2. **app.js**
Это клиентский JavaScript-файл, который управляет логикой веб-приложения на стороне клиента. Основные функции:

- **Класс `MentalTracker`**:
  - Управляет состоянием приложения, включая текущий вид (главный или детальный) и выбранный навык.
  - Обрабатывает взаимодействие с пользователем, такие как нажатие кнопок, добавление и редактирование активностей.
  - Загружает данные с сервера (навыки, активности) и отображает их на странице.
  - Реализует модальные окна для добавления и редактирования активностей.
  - Управляет отображением истории активности, группируя её по дням.
  - Реализует функциональность перетаскивания модальных окон.
- **Инициализация приложения**: При загрузке страницы создается экземпляр класса `MentalTracker`, и вызывается метод `init()` для загрузки данных и отрисовки интерфейса.

### 3. **data.js**
Этот файл отвечает за работу с данными на стороне сервера. Он содержит функции для чтения и записи данных в JSON-файлы, а также взаимодействия с внешним API (jsonbin.io). Основные функции:

- **Чтение данных**:
  - `readSkillsData()` — читает данные о навыках из файла `skills.json`.
  - `readActionsData()` — читает данные о действиях из внешнего API (jsonbin.io).
  - `readHistoryData()` — читает данные об истории активности из внешнего API (jsonbin.io).
- **Запись данных**:
  - `writeActionsData()` — записывает данные о действиях в внешний API.
  - `writeHistoryData()` — записывает данные об истории активности в внешний API.
- **Дополнительные функции**:
  - `getAllSkills()` — возвращает список всех навыков с дополнительной информацией (уровень, прогресс, история).
  - `getSkillData()` — возвращает данные о конкретном навыке.
  - `getSkillHistory()` — возвращает историю активности для конкретного навыка.
  - `getActivities()` — возвращает список всех активностей.
  - `addHistoryRecord()` — добавляет запись в историю активности.
  - `addAchievement()` — добавляет достижение для навыка.
  - `addActivity()` — добавляет новую активность.

### 4. **dateUtils.js**
Этот файл содержит вспомогательные функции для работы с датами:

- **`formatDate(date)`** — форматирует дату в строку в формате `DD.MM.YYYY-HH:MM:SS`.
- **`parseDate(dateString)`** — парсит строку даты в формате `DD.MM.YYYY-HH:MM:SS` в объект `Date`.

### 5. **game.js**
Этот файл содержит логику, связанную с игровыми механиками, такими как расчет уровня и прогресса навыков. Основные функции:

- **`calculateLevel(totalPoints)`** — рассчитывает уровень и прогресс на основе общего количества очков.
- **`addPoints(skillCode, points)`** — добавляет очки к навыку и обновляет его уровень и прогресс.
- **`recalculateSkillProgress(skillCode)`** — пересчитывает прогресс навыка на основе его истории активности.

### 6. **index.html**
Это основной HTML-файл приложения. Он содержит структуру страницы и подключает необходимые CSS и JavaScript файлы. Основные элементы:

- **Навигация**: Панель навигации с кнопкой "Назад" и заголовком страницы.
- **Основной контент**: Контейнер для отображения контента, который заполняется динамически через JavaScript.
- **Модальные окна**:
  - `newActivityModal` — для создания новой активности.
  - `activityFormModal` — для добавления или редактирования активности.
- **Индикатор загрузки**: Отображается при выполнении запросов к серверу.
- **Подключение скриптов**: Подключаются `app.js` и `keepAlive.js`.

### 7. **keepAlive.js**
Этот файл содержит класс `ServerKeepAlive`, который отвечает за поддержание соединения с сервером и отображение статуса сервера. Основные функции:

- **Пинг сервера**: Регулярно отправляет запросы на сервер для проверки его доступности.
- **Индикатор статуса**: Отображает статус сервера (активен/неактивен) в виде цветного кружка в правом верхнем углу страницы.
- **Тултип**: Показывает время последнего успешного пинга и текущий статус сервера.

### 8. **style.css**
Это файл стилей для приложения. Он содержит CSS-правила для оформления интерфейса, включая:

- **Общие стили**: Цвета, шрифты, отступы.
- **Навигация**: Стили для панели навигации и кнопки "Назад".
- **Карточки навыков**: Стили для отображения карточек навыков на главной странице.
- **Прогресс-бар**: Стили для отображения прогресса навыков.
- **Модальные окна**: Стили для модальных окон добавления и редактирования активностей.
- **История активности**: Стили для отображения истории активности, группированной по дням.
- **Индикатор загрузки**: Стили для отображения индикатора загрузки.

### Итог:
Это веб-приложение для отслеживания прогресса в различных навыках. Оно позволяет пользователю добавлять активности, которые приносят очки, и отслеживать прогресс в достижении уровней. Серверная часть написана на Node.js с использованием Express, а клиентская часть — на чистом JavaScript. Данные хранятся в JSON-файлах и на внешнем сервисе jsonbin.io. Приложение также включает индикатор статуса сервера и возможность редактирования истории активности.