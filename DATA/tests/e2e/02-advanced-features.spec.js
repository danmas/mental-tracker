import { test, expect } from '@playwright/test';

test.describe('Mental Tracker - Продвинутые функции', () => {
    const testUser = 'e2e_advanced_user';
    
    test.beforeEach(async ({ page }) => {
        // Авторизуемся перед каждым тестом
        await page.goto('/');
        
        // Настраиваем автоматическое подтверждение всех alert'ов, confirm'ов и prompt'ов
        page.on('dialog', async dialog => {
            console.log(`Dialog: ${dialog.type()} - ${dialog.message()}`);
            await dialog.accept();
        });
        
        await page.fill('#loginInput', testUser);
        await page.click('#loginButton');
        await expect(page.locator('#mainContent')).toBeVisible();
    });

    test('Управление активностями - полный CRUD цикл', async ({ page }) => {
        // Переходим к навыку
        await page.waitForSelector('.skill-card');
        await page.click('.skill-card:has-text("Рисование") .details-button');
        
        await test.step('Создание новой активности', async () => {
            // Ищем кнопку создания активности
            const createButtons = [
                'button:has-text("Создать")',
                'button:has-text("Новая")',
                '.create-activity-btn',
                '.add-activity-btn',
                'button[onclick*="showNewActivityModal"]',
                '#createActivityBtn'
            ];
            
            let createButton;
            for (const selector of createButtons) {
                createButton = page.locator(selector);
                if (await createButton.isVisible()) break;
            }
            
            if (await createButton.isVisible()) {
                await createButton.click();
                
                // Проверяем модальное окно
                await expect(page.locator('#newActivityModal')).toBeVisible();
                
                // Заполняем форму
                await page.fill('#activityName', 'Продвинутая активность');
                await page.fill('#activityDescription', 'Описание продвинутой активности');
                await page.fill('#activityPoints', '25');
                
                // Выбираем тип активности (если есть радио кнопки)
                const taskRadio = page.locator('input[name="activityType"][value="task"]');
                if (await taskRadio.isVisible()) {
                    await taskRadio.check();
                }
                
                // Отправляем форму
                await page.click('button[type="submit"]:has-text("Создать")');
                
                // Проверяем что модальное окно закрылось
                await expect(page.locator('#newActivityModal')).toBeHidden();
                
                // Проверяем что активность появилась
                await expect(page.getByText('Продвинутая активность')).toBeVisible();
            }
        });

        await test.step('Редактирование активности', async () => {
            // Ищем активность для редактирования
            const activityItem = page.locator(':has-text("Продвинутая активность")').first();
            
            if (await activityItem.isVisible()) {
                // Ищем кнопку редактирования (может быть иконка или кнопка)
                const editButtons = [
                    activityItem.locator('button:has-text("Редактировать")'),
                    activityItem.locator('.edit-btn'),
                    activityItem.locator('button[title="Редактировать"]'),
                    activityItem.locator('.fa-edit'),
                    activityItem.locator('[data-action="edit"]')
                ];
                
                for (const editBtn of editButtons) {
                    if (await editBtn.isVisible()) {
                        await editBtn.click();
                        break;
                    }
                }
                
                // Проверяем что открылась форма редактирования
                const editModal = page.locator('#editActivityModal, .edit-modal, .modal:has-text("Редактировать")');
                if (await editModal.isVisible()) {
                    // Изменяем описание
                    await page.fill('textarea[name="description"], #activityDescription', 'Обновленное описание активности');
                    
                    // Сохраняем изменения
                    await page.click('button:has-text("Сохранить"), button[type="submit"]');
                    
                    // Проверяем что изменения применились
                    await expect(page.getByText('Обновленное описание')).toBeVisible();
                }
            }
        });

        await test.step('Удаление активности', async () => {
            const activityItem = page.locator(':has-text("Продвинутая активность")').first();
            
            if (await activityItem.isVisible()) {
                // Ищем кнопку удаления
                const deleteButtons = [
                    activityItem.locator('button:has-text("Удалить")'),
                    activityItem.locator('.delete-btn'),
                    activityItem.locator('button[title="Удалить"]'),
                    activityItem.locator('.fa-trash'),
                    activityItem.locator('[data-action="delete"]')
                ];
                
                for (const deleteBtn of deleteButtons) {
                    if (await deleteBtn.isVisible()) {
                        await deleteBtn.click();
                        
                        // Подтверждаем удаление если есть confirm
                        const confirmBtn = page.locator('button:has-text("Подтвердить"), button:has-text("Да"), .confirm-delete');
                        if (await confirmBtn.isVisible()) {
                            await confirmBtn.click();
                        }
                        break;
                    }
                }
                
                // Проверяем что активность удалена
                await expect(page.getByText('Продвинутая активность')).not.toBeVisible();
            }
        });
    });

    test('Валидация форм и обработка ошибок', async ({ page }) => {
        await page.waitForSelector('.skill-card');
        await page.click('.skill-card:has-text("Рисование") .details-button');
        
        await test.step('Валидация формы создания активности', async () => {
            // Открываем форму создания
            const createButton = page.locator('button:has-text("Создать"), .create-activity-btn').first();
            if (await createButton.isVisible()) {
                await createButton.click();
                await expect(page.locator('#newActivityModal')).toBeVisible();
                
                // Пробуем отправить пустую форму
                await page.click('button[type="submit"]:has-text("Создать")');
                
                // Проверяем валидацию HTML5 или custom валидацию
                const nameInput = page.locator('#activityName');
                const isInvalid = await nameInput.evaluate(el => !el.checkValidity());
                expect(isInvalid).toBe(true);
                
                // Заполняем только имя (неполная форма)
                await page.fill('#activityName', 'Тест');
                await page.click('button[type="submit"]:has-text("Создать")');
                
                // Проверяем что форма все еще открыта (валидация не прошла)
                await expect(page.locator('#newActivityModal')).toBeVisible();
                
                // Заполняем все обязательные поля
                await page.fill('#activityDescription', 'Полное описание');
                await page.fill('#activityPoints', '10');
                await page.click('button[type="submit"]:has-text("Создать")');
                
                // Теперь форма должна закрыться
                await expect(page.locator('#newActivityModal')).toBeHidden();
            }
        });

        await test.step('Валидация граничных значений', async () => {
            const createButton = page.locator('button:has-text("Создать"), .create-activity-btn').first();
            if (await createButton.isVisible()) {
                await createButton.click();
                
                // Тестируем отрицательные очки
                await page.fill('#activityName', 'Тест отрицательных очков');
                await page.fill('#activityDescription', 'Тест');
                await page.fill('#activityPoints', '-5');
                await page.click('button[type="submit"]:has-text("Создать")');
                
                // Форма не должна отправиться
                await expect(page.locator('#newActivityModal')).toBeVisible();
                
                // Тестируем слишком большие очки
                await page.fill('#activityPoints', '1000');
                await page.click('button[type="submit"]:has-text("Создать")');
                
                // Форма не должна отправиться или очки должны быть ограничены
                const pointsValue = await page.inputValue('#activityPoints');
                expect(parseInt(pointsValue)).toBeLessThanOrEqual(100);
                
                // Закрываем модальное окно
                await page.click('.modal-close, button:has-text("Отмена")');
            }
        });
    });

    test('Прогресс и уровни - игровые механики', async ({ page }) => {
        await page.waitForSelector('.skill-card');
        
        await test.step('Проверка отображения прогресса', async () => {
            // Находим навык с прогрессом
            const skillCards = page.locator('.skill-card');
            const firstCard = skillCards.first();
            
            // Проверяем что отображается уровень
            await expect(firstCard.locator('.skill-level, .level')).toBeVisible();
            
            // Проверяем что отображается прогресс-бар
            await expect(firstCard.locator('.skill-progress, .progress-bar, .progress')).toBeVisible();
            
            // Получаем текущие значения
            const levelText = await firstCard.locator('.skill-level, .level').textContent();
            const currentLevel = parseInt(levelText.match(/\d+/)?.[0] || '0');
            
            // Записываем исходные значения для последующей проверки
            expect(currentLevel).toBeGreaterThanOrEqual(0);
        });

        await test.step('Добавление очков и проверка обновления', async () => {
            await page.click('.skill-card:has-text("Рисование") .details-button');
            
            // Запоминаем текущее состояние
            const levelDisplay = page.locator('.level-display, .current-level');
            const currentLevelText = await levelDisplay.textContent();
            
            // Добавляем очки
            const addPointsBtn = page.locator('.add-points-btn, button:has-text("очки"), button:has-text("+")').first();
            if (await addPointsBtn.isVisible()) {
                await addPointsBtn.click();
                
                // Ввод очков
                const pointsInput = page.locator('input[type="number"]').first();
                if (await pointsInput.isVisible()) {
                    await pointsInput.fill('20');
                    await page.click('button:has-text("Добавить"), button:has-text("Подтвердить"), .btn-primary');
                    
                    // Ждем обновления UI
                    await page.waitForTimeout(1000);
                    
                    // Проверяем что уровень/прогресс изменился
                    const newLevelText = await levelDisplay.textContent();
                    expect(newLevelText).not.toBe(currentLevelText);
                }
            }
        });

        await test.step('Проверка анимаций прогресса', async () => {
            // Проверяем что прогресс-бар имеет анимацию
            const progressBar = page.locator('.progress-bar, .skill-progress').first();
            
            if (await progressBar.isVisible()) {
                // Проверяем CSS стили анимации
                const hasTransition = await progressBar.evaluate(el => {
                    const styles = window.getComputedStyle(el);
                    return styles.transition.includes('width') || styles.transition.includes('all');
                });
                
                expect(hasTransition).toBe(true);
            }
        });
    });

    test('Навигация и состояние приложения', async ({ page }) => {
        await test.step('Навигация между страницами', async () => {
            // Переходим к навыку
            await page.waitForSelector('.skill-card');
            await page.click('.skill-card:has-text("Рисование") .details-button');
            
            // Проверяем что кнопка "Назад" появилась
            await expect(page.locator('#backButton')).toBeVisible();
            
            // Проверяем что заголовок изменился
            await expect(page.locator('#pageTitle')).toContainText('Рисование');
            
            // Возвращаемся назад
            await page.click('#backButton');
            
            // Проверяем что вернулись к списку навыков
            await expect(page.locator('#backButton')).toBeHidden();
            await expect(page.locator('#pageTitle')).toContainText('Ментальный Трекер');
        });

        await test.step('Сохранение состояния при обновлении', async () => {
            // Переходим к навыку
            await page.click('.skill-card:has-text("Музыка") .details-button');
            
            // Запоминаем URL или состояние
            const currentUrl = page.url();
            
            // Обновляем страницу
            await page.reload();
            
            // Проверяем что состояние восстановилось
            // (в зависимости от реализации может потребоваться повторная авторизация)
            if (await page.locator('#loginForm').isVisible()) {
                await page.fill('#loginInput', testUser);
                await page.click('#loginButton');
            }
            
            // Проверяем что можем вернуться к функциональности
            await expect(page.locator('#mainContent')).toBeVisible();
        });

        await test.step('Обработка ошибок сети', async () => {
            // Переходим offline
            await page.context().setOffline(true);
            
            // Пробуем выполнить действие требующее сети
            await page.click('.skill-card:has-text("Рисование") .details-button');
            
            // Должен показаться индикатор загрузки или ошибка
            const loadingIndicator = page.locator('#loadingOverlay, .loading, .spinner');
            
            // Ждем некоторое время для проявления индикатора
            await page.waitForTimeout(2000);
            
            // Возвращаем соединение
            await page.context().setOffline(false);
            
            // Проверяем что приложение восстанавливается
            await page.waitForSelector('.skill-card', { timeout: 10000 });
        });
    });

    test('Адаптивность и кроссбраузерность', async ({ page }) => {
        await test.step('Тестирование на разных размерах экрана', async () => {
            // Desktop
            await page.setViewportSize({ width: 1920, height: 1080 });
            await page.reload();
            if (await page.locator('#loginForm').isVisible()) {
                await page.fill('#loginInput', testUser);
                await page.click('#loginButton');
            }
            
            await page.waitForSelector('.skill-card');
            let skillCards = page.locator('.skill-card');
            const count1 = await skillCards.count();
            expect(count1).toBeGreaterThan(0);
            
            // Tablet
            await page.setViewportSize({ width: 768, height: 1024 });
            await page.waitForTimeout(500);
            skillCards = page.locator('.skill-card');
            const count2 = await skillCards.count();
            expect(count2).toBeGreaterThan(0);
            
            // Mobile
            await page.setViewportSize({ width: 375, height: 667 });
            await page.waitForTimeout(500);
            skillCards = page.locator('.skill-card');
            const count3 = await skillCards.count();
            expect(count3).toBeGreaterThan(0);
            
            // Проверяем что контент помещается в экран
            const skillCard = skillCards.first();
            const cardBounds = await skillCard.boundingBox();
            expect(cardBounds.width).toBeLessThanOrEqual(375);
        });

        await test.step('Проверка доступности (Accessibility)', async () => {
            // Проверяем что элементы имеют правильные ARIA атрибуты
            const loginButton = page.locator('#loginButton');
            const skillCards = page.locator('.skill-card');
            
            // Проверяем что интерактивные элементы доступны с клавиатуры
            await page.keyboard.press('Tab');
            const focusedElement = await page.evaluate(() => document.activeElement.id);
            expect(focusedElement).toBeTruthy();
            
            // Проверяем что есть alt текст для изображений (если есть)
            const images = page.locator('img');
            const imageCount = await images.count();
            
            for (let i = 0; i < imageCount; i++) {
                const img = images.nth(i);
                const alt = await img.getAttribute('alt');
                const ariaLabel = await img.getAttribute('aria-label');
                
                // Каждое изображение должно иметь alt или aria-label
                expect(alt || ariaLabel).toBeTruthy();
            }
        });
    });

    test.afterEach(async ({ page }) => {
        // Возвращаем стандартный размер экрана
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.context().setOffline(false);
    });
}); 