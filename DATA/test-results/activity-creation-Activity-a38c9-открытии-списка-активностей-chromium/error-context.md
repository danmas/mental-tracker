# Test info

- Name: Activity Creation and Selection >> Отладка API вызовов при открытии списка активностей
- Location: C:\ERV\projects-ex\mental-tracker\DATA\tests\e2e\activity-creation.spec.js:26:9

# Error details

```
TimeoutError: page.click: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('button:has-text("Отмена")')
    - locator resolved to 2 elements. Proceeding with the first one: <button type="button" class="btn btn-secondary" onclick="app.hideNewActivityModal()">↵                    Отмена↵                </button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
      - waiting 100ms
    19 × waiting for element to be visible, enabled and stable
       - element is not visible
     - retrying click action
       - waiting 500ms

    at C:\ERV\projects-ex\mental-tracker\DATA\tests\e2e\activity-creation.spec.js:55:20
```

# Page snapshot

```yaml
- navigation:
  - button "←"
  - heading "Рисование" [level=1]
- main:
  - text: 📚
  - heading "Уровень 1.6(0%)" [level=2]
  - paragraph: "До следующего уровня: 0% (0) очков"
  - button "+ Добавить активность"
  - button "+ Создать активность"
  - heading "История" [level=3]
  - text: ▼
  - heading "2025" [level=3]
  - text: +NaN очков
  - heading "Активность" [level=4]
  - paragraph: "Points added: 3. Familiarity changed from 10 to 13."
  - paragraph: "06"
  - text: +undefined очков
  - button "✎"
  - button "🗑️"
  - heading "Активность" [level=4]
  - paragraph: "Points added: 3. Familiarity changed from 13 to 16."
  - paragraph: "06"
  - text: +undefined очков
  - button "✎"
  - button "🗑️"
- heading "Добавить активность" [level=2]
- button "×"
- text: Тип
- radio "Задача" [checked]
- text: Задача
- radio "Обычная активность"
- text: Обычная активность Действие
- combobox "Действие":
  - option "Выберите действие" [selected]
- text: Очки
- spinbutton "Очки"
- text: Заметки
- textbox "Заметки"
- text: Дата
- textbox "Дата": 2025-06-03
- text: Время
- textbox "Время": 08:40
- text: Срок выполнения (необязательно)
- textbox
- textbox: 23:59
- checkbox "Отметить как выполненное"
- text: Отметить как выполненное
- button "Отмена"
- button "Сохранить"
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('Activity Creation and Selection', () => {
   4 |     const testUser = 'erv'; // Используем уже существующего пользователя
   5 |     
   6 |     test.beforeEach(async ({ page }) => {
   7 |         // Настраиваем автоматическое подтверждение alert'ов
   8 |         page.on('dialog', async dialog => {
   9 |             console.log(`Dialog: ${dialog.type()} - ${dialog.message()}`);
  10 |             await dialog.accept();
  11 |         });
  12 |         
  13 |         // Переходим на главную страницу
  14 |         await page.goto('http://localhost:3050');
  15 |         
  16 |         // Если нужна авторизация, авторизуемся
  17 |         const loginButton = page.locator('#loginButton');
  18 |         if (await loginButton.isVisible()) {
  19 |             await page.fill('#loginInput', testUser);
  20 |             await page.click('#loginButton');
  21 |         }
  22 |         
  23 |         await expect(page.locator('#mainContent')).toBeVisible();
  24 |     });
  25 |
  26 |     test('Отладка API вызовов при открытии списка активностей', async ({ page }) => {
  27 |         // Добавляем логирование console.log из браузера
  28 |         page.on('console', msg => {
  29 |             console.log('BROWSER LOG:', msg.text());
  30 |         });
  31 |         
  32 |         // Переходим к навыку "Рисование"
  33 |         await page.waitForSelector('.skill-card');
  34 |         await page.click('.skill-card:has-text("Рисование") .details-button');
  35 |         
  36 |         // Ждем загрузки страницы навыка
  37 |         await page.waitForSelector('#pageTitle');
  38 |         
  39 |         // Открываем модальное окно добавления активности
  40 |         await page.click('button:has-text("Добавить активность")');
  41 |         await page.waitForSelector('#activityFormModal');
  42 |         
  43 |         // Ждем немного для завершения всех API вызовов и логирования
  44 |         await page.waitForTimeout(3000);
  45 |         
  46 |         // Проверяем что селект активностей видим
  47 |         const activitySelect = page.locator('#activitySelect');
  48 |         await expect(activitySelect).toBeVisible();
  49 |         
  50 |         // Проверяем количество опций
  51 |         const optionCount = await activitySelect.locator('option').count();
  52 |         console.log('TEST LOG: Option count:', optionCount);
  53 |         
  54 |         // Закрываем модальное окно
> 55 |         await page.click('button:has-text("Отмена")');
     |                    ^ TimeoutError: page.click: Timeout 10000ms exceeded.
  56 |     });
  57 | }); 
```