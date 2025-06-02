# Test info

- Name: Mental Tracker - Основной пользовательский сценарий >> Полный пользовательский поток: вход → навыки → добавление очков → история
- Location: C:\ERV\projects-ex\mental-tracker\DATA\tests\e2e\01-user-journey.spec.js:14:9

# Error details

```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('#newActivityModal') to be hidden
    24 × locator resolved to visible <div id="newActivityModal" class="modal-overlay">…</div>

    at C:\ERV\projects-ex\mental-tracker\DATA\tests\e2e\01-user-journey.spec.js:86:24
    at C:\ERV\projects-ex\mental-tracker\DATA\tests\e2e\01-user-journey.spec.js:66:9
```

# Page snapshot

```yaml
- navigation:
  - button "←"
  - heading "Рисование" [level=1]
- main:
  - text: 📚
  - heading "Уровень 1(0%)" [level=2]
  - paragraph: "До следующего уровня: 0% (0) очков"
  - button "+ Добавить активность"
  - button "+ Создать активность"
  - heading "История" [level=3]
- heading "Создать новую задачу" [level=2]
- button "×"
- text: Тип
- radio "Задача" [checked]
- text: Задача
- radio "Обычная активность"
- text: Обычная активность Название
- textbox "Название": E2E Test Quick Activity
- text: Описание
- textbox "Описание": Быстрая активность для теста
- text: Очки
- spinbutton "Очки": "15"
- text: Срок выполнения (необязательно)
- textbox "Срок выполнения (необязательно) Срок выполнения (необязательно)"
- textbox: 23:59
- button "Отмена"
- button "Создать"
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('Mental Tracker - Основной пользовательский сценарий', () => {
   4 |     const testUser = 'e2e_test_user';
   5 |     
   6 |     test.beforeEach(async ({ page }) => {
   7 |         // Переходим на главную страницу
   8 |         await page.goto('/');
   9 |         
   10 |         // Ожидаем загрузку страницы
   11 |         await expect(page.locator('#loginForm')).toBeVisible();
   12 |     });
   13 |
   14 |     test('Полный пользовательский поток: вход → навыки → добавление очков → история', async ({ page }) => {
   15 |         // === ШАГ 1: АВТОРИЗАЦИЯ ===
   16 |         await test.step('Авторизация пользователя', async () => {
   17 |             // Заполняем форму входа
   18 |             await page.fill('#loginInput', testUser);
   19 |             await page.click('#loginButton');
   20 |             
   21 |             // Проверяем что вошли в систему
   22 |             await expect(page.locator('#loginForm')).toBeHidden();
   23 |             await expect(page.locator('#mainContent')).toBeVisible();
   24 |             
   25 |             // Проверяем что заголовок изменился
   26 |             await expect(page.locator('#pageTitle')).toContainText('Ментальный Трекер');
   27 |         });
   28 |
   29 |         // === ШАГ 2: ПРОСМОТР НАВЫКОВ ===
   30 |         await test.step('Просмотр списка навыков', async () => {
   31 |             // Ожидаем загрузку навыков
   32 |             await page.waitForSelector('.skill-card', { timeout: 10000 });
   33 |             
   34 |             // Проверяем что навыки отображаются
   35 |             const skillCards = page.locator('.skill-card');
   36 |             const count = await skillCards.count();
   37 |             expect(count).toBeGreaterThan(0);
   38 |             
   39 |             // Проверяем что есть базовые навыки (Рисование, Музыка)
   40 |             await expect(page.getByText('Рисование')).toBeVisible();
   41 |             await expect(page.getByText('Музыка Практика')).toBeVisible();
   42 |             
   43 |             // Проверяем структуру карточки навыка
   44 |             const firstSkillCard = skillCards.first();
   45 |             await expect(firstSkillCard.locator('h2')).toBeVisible();
   46 |             await expect(firstSkillCard.locator('.skill-level')).toBeVisible();
   47 |             await expect(firstSkillCard.locator('.progress-bar')).toBeVisible();
   48 |         });
   49 |
   50 |         // === ШАГ 3: ДЕТАЛИ НАВЫКА ===
   51 |         await test.step('Переход к деталям навыка', async () => {
   52 |             // Кликаем на кнопку "Подробнее" первого навыка (Рисование)
   53 |             await page.click('.skill-card:has-text("Рисование") .details-button');
   54 |             
   55 |             // Проверяем что перешли на страницу навыка
   56 |             await expect(page.locator('#backButton')).toBeVisible();
   57 |             await expect(page.locator('#pageTitle')).toContainText('Рисование');
   58 |             
   59 |             // Проверяем элементы страницы навыка
   60 |             await expect(page.locator('.skill-header h2')).toBeVisible(); // Уровень в h2
   61 |             await expect(page.locator('button:has-text("Добавить активность")')).toBeVisible(); // Кнопка добавления
   62 |             await expect(page.locator('.skill-header')).toBeVisible(); // Заголовок навыка
   63 |         });
   64 |
   65 |         // === ШАГ 4: ДОБАВЛЕНИЕ ОЧКОВ ===
   66 |         await test.step('Добавление очков к навыку', async () => {
   67 |             // Запоминаем текущий уровень и прогресс
   68 |             const currentLevelText = await page.locator('.skill-header h2').textContent();
   69 |             const currentLevel = parseInt(currentLevelText.match(/Уровень (\d+)/)?.[1] || '0');
   70 |             
   71 |             // Кликаем кнопку создания активности (это добавит очки)
   72 |             await page.click('button:has-text("Создать активность")');
   73 |             
   74 |             // Ожидаем появления модального окна создания активности
   75 |             await page.waitForSelector('#newActivityModal', { timeout: 5000 });
   76 |             
   77 |             // Заполняем форму для быстрой активности
   78 |             await page.fill('#activityName', 'E2E Test Quick Activity');
   79 |             await page.fill('#activityDescription', 'Быстрая активность для теста');
   80 |             await page.fill('#activityPoints', '15');
   81 |             
   82 |             // Отправляем форму
   83 |             await page.click('button[type="submit"]:has-text("Создать")');
   84 |             
   85 |             // Ожидаем закрытия модального окна
>  86 |             await page.waitForSelector('#newActivityModal', { state: 'hidden' });
      |                        ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
   87 |             
   88 |             // Ожидаем обновления уровня/прогресса
   89 |             await page.waitForTimeout(1000);
   90 |             
   91 |             // Проверяем что что-то изменилось (уровень или прогресс)
   92 |             const newLevelText = await page.locator('.skill-header h2').textContent();
   93 |             expect(newLevelText).not.toBe(currentLevelText);
   94 |         });
   95 |
   96 |         // === ШАГ 5: СОЗДАНИЕ АКТИВНОСТИ ===
   97 |         await test.step('Создание новой активности', async () => {
   98 |             // Проверяем что активность появилась в списке после предыдущего шага
   99 |             await expect(page.getByText('E2E Test Quick Activity')).toBeVisible();
  100 |             
  101 |             // Создаем еще одну активность для полноты теста
  102 |             const createButton = page.locator('button:has-text("Создать активность")').first();
  103 |             
  104 |             if (await createButton.isVisible()) {
  105 |                 await createButton.click();
  106 |                 
  107 |                 // Ожидаем появления модального окна
  108 |                 await expect(page.locator('#newActivityModal')).toBeVisible();
  109 |                 
  110 |                 // Заполняем форму
  111 |                 await page.fill('#activityName', 'E2E Test Second Activity');
  112 |                 await page.fill('#activityDescription', 'Вторая тестовая активность для E2E теста');
  113 |                 await page.fill('#activityPoints', '10');
  114 |                 
  115 |                 // Отправляем форму
  116 |                 await page.click('button[type="submit"]:has-text("Создать")');
  117 |                 
  118 |                 // Проверяем что модальное окно закрылось
  119 |                 await expect(page.locator('#newActivityModal')).toBeHidden();
  120 |                 
  121 |                 // Проверяем что активность появилась в списке
  122 |                 await expect(page.getByText('E2E Test Second Activity')).toBeVisible();
  123 |             }
  124 |         });
  125 |
  126 |         // === ШАГ 6: ПРОСМОТР ИСТОРИИ ===
  127 |         await test.step('Просмотр истории навыка', async () => {
  128 |             // Ищем раздел или кнопку истории
  129 |             const historySection = page.locator('.history-section, .skill-history, button:has-text("История")');
  130 |             
  131 |             if (await historySection.first().isVisible()) {
  132 |                 // Если это кнопка - кликаем
  133 |                 if (await page.locator('button:has-text("История")').isVisible()) {
  134 |                     await page.click('button:has-text("История")');
  135 |                 }
  136 |                 
  137 |                 // Проверяем что история отображается
  138 |                 const historyCount = await page.locator('.history-item, .event-item, .history-entry').count();
  139 |                 expect(historyCount).toBeGreaterThan(0);
  140 |                 
  141 |                 // Проверяем что есть записи о добавлении очков
  142 |                 await expect(page.getByText('очки', { exact: false })).toBeVisible();
  143 |             }
  144 |         });
  145 |
  146 |         // === ШАГ 7: НАВИГАЦИЯ НАЗАД ===
  147 |         await test.step('Возврат к списку навыков', async () => {
  148 |             // Кликаем кнопку назад
  149 |             await page.click('#backButton');
  150 |             
  151 |             // Проверяем что вернулись к списку навыков
  152 |             await expect(page.locator('#backButton')).toBeHidden();
  153 |             await expect(page.locator('#pageTitle')).toContainText('Ментальный Трекер');
  154 |             const skillCount = await page.locator('.skill-card').count();
  155 |             expect(skillCount).toBeGreaterThan(0);
  156 |         });
  157 |
  158 |         // === ШАГ 8: ГЛОБАЛЬНАЯ ИСТОРИЯ ===
  159 |         await test.step('Просмотр глобальной истории', async () => {
  160 |             // Ищем кнопку глобальной истории
  161 |             const historyButton = page.locator('button:has-text("История"), .history-btn, nav a:has-text("История")').first();
  162 |             
  163 |             if (await historyButton.isVisible()) {
  164 |                 await historyButton.click();
  165 |                 
  166 |                 // Проверяем что перешли на страницу истории
  167 |                 await expect(page.locator('.global-history, .history-list, .all-history')).toBeVisible();
  168 |                 
  169 |                 // Проверяем что есть записи истории
  170 |                 const historyItemCount = await page.locator('.history-item, .event-item').count();
  171 |                 expect(historyItemCount).toBeGreaterThan(0);
  172 |             }
  173 |         });
  174 |     });
  175 |
  176 |     test('Мобильная версия - основной функционал', async ({ page }) => {
  177 |         // Устанавливаем размер мобильного экрана
  178 |         await page.setViewportSize({ width: 375, height: 667 });
  179 |         
  180 |         await test.step('Авторизация на мобильном', async () => {
  181 |             await page.fill('#loginInput', testUser);
  182 |             await page.click('#loginButton');
  183 |             
  184 |             await expect(page.locator('#mainContent')).toBeVisible();
  185 |         });
  186 |
```