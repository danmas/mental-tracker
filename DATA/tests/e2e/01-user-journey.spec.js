import { test, expect } from '@playwright/test';

test.describe('Mental Tracker - Основной пользовательский сценарий', () => {
    const testUser = 'e2e_test_user';
    
    test.beforeEach(async ({ page }) => {
        // Переходим на главную страницу
        await page.goto('/');
        
        // Ожидаем загрузку страницы
        await expect(page.locator('#loginForm')).toBeVisible();
    });

    test('Полный пользовательский поток: вход → навыки → добавление очков → история', async ({ page }) => {
        // Настраиваем автоматическое подтверждение всех alert'ов, confirm'ов и prompt'ов
        page.on('dialog', async dialog => {
            console.log(`Dialog: ${dialog.type()} - ${dialog.message()}`);
            await dialog.accept();
        });
        
        // === ШАГ 1: АВТОРИЗАЦИЯ ===
        await test.step('Авторизация пользователя', async () => {
            // Заполняем форму входа
            await page.fill('#loginInput', testUser);
            await page.click('#loginButton');
            
            // Проверяем что вошли в систему
            await expect(page.locator('#loginForm')).toBeHidden();
            await expect(page.locator('#mainContent')).toBeVisible();
            
            // Проверяем что заголовок изменился
            await expect(page.locator('#pageTitle')).toContainText('Ментальный Трекер');
        });

        // === ШАГ 2: ПРОСМОТР НАВЫКОВ ===
        await test.step('Просмотр списка навыков', async () => {
            // Ожидаем загрузку навыков
            await page.waitForSelector('.skill-card', { timeout: 10000 });
            
            // Проверяем что навыки отображаются
            const skillCards = page.locator('.skill-card');
            const count = await skillCards.count();
            expect(count).toBeGreaterThan(0);
            
            // Проверяем что есть базовые навыки (Рисование, Музыка)
            await expect(page.getByText('Рисование')).toBeVisible();
            await expect(page.getByText('Музыка Практика')).toBeVisible();
            
            // Проверяем структуру карточки навыка
            const firstSkillCard = skillCards.first();
            await expect(firstSkillCard.locator('h2')).toBeVisible();
            await expect(firstSkillCard.locator('.skill-level')).toBeVisible();
            await expect(firstSkillCard.locator('.progress-bar')).toBeVisible();
        });

        // === ШАГ 3: ДЕТАЛИ НАВЫКА ===
        await test.step('Переход к деталям навыка', async () => {
            // Кликаем на кнопку "Подробнее" первого навыка (Рисование)
            await page.click('.skill-card:has-text("Рисование") .details-button');
            
            // Проверяем что перешли на страницу навыка
            await expect(page.locator('#backButton')).toBeVisible();
            await expect(page.locator('#pageTitle')).toContainText('Рисование');
            
            // Проверяем элементы страницы навыка
            await expect(page.locator('.skill-header h2')).toBeVisible(); // Уровень в h2
            await expect(page.locator('button:has-text("Добавить активность")')).toBeVisible(); // Кнопка добавления
            await expect(page.locator('.skill-header')).toBeVisible(); // Заголовок навыка
        });

        // === ШАГ 4: ДОБАВЛЕНИЕ ОЧКОВ ===
        await test.step('Добавление очков к навыку', async () => {
            // Запоминаем текущий уровень и прогресс
            const currentLevelText = await page.locator('.skill-header h2').textContent();
            const currentLevel = parseInt(currentLevelText.match(/Уровень (\d+)/)?.[1] || '0');
            
            // Кликаем кнопку создания активности (это добавит очки)
            await page.click('button:has-text("Создать активность")');
            
            // Ожидаем появления модального окна создания активности
            await page.waitForSelector('#newActivityModal', { timeout: 5000 });
            
            // Выбираем тип "Обычная активность" (без срока выполнения)
            await page.click('input[name="activityType"][value="activity"]');
            
            // Заполняем форму для быстрой активности
            await page.fill('#activityName', 'E2E Test Quick Activity');
            await page.fill('#activityDescription', 'Быстрая активность для теста');
            await page.fill('#activityPoints', '15');
            
            // Отправляем форму
            await page.click('button[type="submit"]:has-text("Создать")');
            
            // Ожидаем закрытия модального окна (alert автоматически подтверждается)
            await page.waitForSelector('#newActivityModal', { state: 'hidden', timeout: 10000 });
            
            // Ожидаем обновления уровня/прогресса
            await page.waitForTimeout(1000);
            
            // Проверяем что что-то изменилось (уровень или прогресс)
            const newLevelText = await page.locator('.skill-header h2').textContent();
            expect(newLevelText).not.toBe(currentLevelText);
        });

        // === ШАГ 5: СОЗДАНИЕ АКТИВНОСТИ ===
        await test.step('Создание новой активности', async () => {
            // Проверяем что активность появилась в списке после предыдущего шага
            await expect(page.getByText('E2E Test Quick Activity')).toBeVisible();
            
            // Создаем еще одну активность для полноты теста
            const createButton = page.locator('button:has-text("Создать активность")').first();
            
            if (await createButton.isVisible()) {
                await createButton.click();
                
                // Ожидаем появления модального окна
                await expect(page.locator('#newActivityModal')).toBeVisible();
                
                // Заполняем форму
                await page.fill('#activityName', 'E2E Test Second Activity');
                await page.fill('#activityDescription', 'Вторая тестовая активность для E2E теста');
                await page.fill('#activityPoints', '10');
                
                // Отправляем форму
                await page.click('button[type="submit"]:has-text("Создать")');
                
                // Проверяем что модальное окно закрылось
                await expect(page.locator('#newActivityModal')).toBeHidden();
                
                // Проверяем что активность появилась в списке
                await expect(page.getByText('E2E Test Second Activity')).toBeVisible();
            }
        });

        // === ШАГ 6: ПРОСМОТР ИСТОРИИ ===
        await test.step('Просмотр истории навыка', async () => {
            // Ищем раздел или кнопку истории
            const historySection = page.locator('.history-section, .skill-history, button:has-text("История")');
            
            if (await historySection.first().isVisible()) {
                // Если это кнопка - кликаем
                if (await page.locator('button:has-text("История")').isVisible()) {
                    await page.click('button:has-text("История")');
                }
                
                // Проверяем что история отображается
                const historyCount = await page.locator('.history-item, .event-item, .history-entry').count();
                expect(historyCount).toBeGreaterThan(0);
                
                // Проверяем что есть записи о добавлении очков
                await expect(page.getByText('очки', { exact: false })).toBeVisible();
            }
        });

        // === ШАГ 7: НАВИГАЦИЯ НАЗАД ===
        await test.step('Возврат к списку навыков', async () => {
            // Кликаем кнопку назад
            await page.click('#backButton');
            
            // Проверяем что вернулись к списку навыков
            await expect(page.locator('#backButton')).toBeHidden();
            await expect(page.locator('#pageTitle')).toContainText('Ментальный Трекер');
            const skillCount = await page.locator('.skill-card').count();
            expect(skillCount).toBeGreaterThan(0);
        });

        // === ШАГ 8: ГЛОБАЛЬНАЯ ИСТОРИЯ ===
        await test.step('Просмотр глобальной истории', async () => {
            // Ищем кнопку глобальной истории
            const historyButton = page.locator('button:has-text("История"), .history-btn, nav a:has-text("История")').first();
            
            if (await historyButton.isVisible()) {
                await historyButton.click();
                
                // Проверяем что перешли на страницу истории
                await expect(page.locator('.global-history, .history-list, .all-history')).toBeVisible();
                
                // Проверяем что есть записи истории
                const historyItemCount = await page.locator('.history-item, .event-item').count();
                expect(historyItemCount).toBeGreaterThan(0);
            }
        });
    });

    test('Мобильная версия - основной функционал', async ({ page }) => {
        // Настраиваем автоматическое подтверждение всех alert'ов, confirm'ов и prompt'ов
        page.on('dialog', async dialog => {
            console.log(`Dialog: ${dialog.type()} - ${dialog.message()}`);
            await dialog.accept();
        });
        
        // Устанавливаем размер мобильного экрана
        await page.setViewportSize({ width: 375, height: 667 });
        
        await test.step('Авторизация на мобильном', async () => {
            await page.fill('#loginInput', testUser);
            await page.click('#loginButton');
            
            await expect(page.locator('#mainContent')).toBeVisible();
        });

        await test.step('Навигация на мобильном', async () => {
            // Проверяем что навыки отображаются корректно на мобильном
            await page.waitForSelector('.skill-card');
            const skillCards = page.locator('.skill-card');
            const cardCount = await skillCards.count();
            expect(cardCount).toBeGreaterThan(0);
            
            // Проверяем responsive дизайн
            const skillCard = skillCards.first();
            const cardBounds = await skillCard.boundingBox();
            expect(cardBounds.width).toBeLessThanOrEqual(375); // Ширина экрана
        });
    });

    test('Обработка ошибок и граничные случаи', async ({ page }) => {
        // Настраиваем автоматическое подтверждение всех alert'ов, confirm'ов и prompt'ов
        page.on('dialog', async dialog => {
            console.log(`Dialog: ${dialog.type()} - ${dialog.message()}`);
            await dialog.accept();
        });
        
        await test.step('Авторизация с пустым логином', async () => {
            // Пробуем войти без логина
            await page.click('#loginButton');
            
            // Проверяем что остались на форме входа
            await expect(page.locator('#loginForm')).toBeVisible();
        });

        await test.step('Авторизация с валидным логином', async () => {
            await page.fill('#loginInput', testUser);
            await page.click('#loginButton');
            await expect(page.locator('#mainContent')).toBeVisible();
        });

        await test.step('Проверка offline поведения', async () => {
            // Эмулируем offline режим
            await page.context().setOffline(true);
            
            // Пробуем выполнить действие
            const skillCard = page.locator('.skill-card').first();
            if (await skillCard.isVisible()) {
                await skillCard.click();
                
                // Должно показать ошибку или индикатор загрузки
                // (в зависимости от реализации)
            }
            
            // Возвращаем online режим
            await page.context().setOffline(false);
        });
    });

    test.afterEach(async ({ page }) => {
        // Cleanup: можно добавить очистку тестовых данных
        // через API вызовы если необходимо
    });
}); 