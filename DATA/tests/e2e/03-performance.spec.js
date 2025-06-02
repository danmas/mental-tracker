import { test, expect } from '@playwright/test';

test.describe('Mental Tracker - Производительность и нагрузка', () => {
    const testUser = 'e2e_performance_user';
    
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

    test('Производительность загрузки страниц', async ({ page }) => {
        await test.step('Время загрузки главной страницы', async () => {
            const startTime = Date.now();
            
            await page.goto('/');
            await page.waitForSelector('#loginForm');
            
            const loadTime = Date.now() - startTime;
            
            // Страница должна загружаться менее чем за 3 секунды
            expect(loadTime).toBeLessThan(3000);
            console.log(`Время загрузки главной страницы: ${loadTime}ms`);
        });

        await test.step('Время авторизации и загрузки навыков', async () => {
            const startTime = Date.now();
            
            await page.fill('#loginInput', testUser);
            await page.click('#loginButton');
            await page.waitForSelector('.skill-card');
            
            const authTime = Date.now() - startTime;
            
            // Авторизация и загрузка данных должны занимать менее 5 секунд
            expect(authTime).toBeLessThan(5000);
            console.log(`Время авторизации и загрузки данных: ${authTime}ms`);
        });

        await test.step('Время перехода между страницами', async () => {
            await page.waitForSelector('.skill-card');
            
            const startTime = Date.now();
            await page.click('.skill-card:has-text("Рисование") .details-button');
            await page.waitForSelector('.level-display, .skill-details');
            
            const navigationTime = Date.now() - startTime;
            
            // Навигация должна быть быстрой (менее 1 секунды)
            expect(navigationTime).toBeLessThan(1000);
            console.log(`Время навигации: ${navigationTime}ms`);
        });
    });

    test('Производительность операций с данными', async ({ page }) => {
        await page.waitForSelector('.skill-card');
        await page.click('.skill-card:has-text("Рисование") .details-button');
        
        await test.step('Время добавления очков', async () => {
            const addPointsBtn = page.locator('.add-points-btn, button:has-text("очки"), button:has-text("+")').first();
            
            if (await addPointsBtn.isVisible()) {
                const startTime = Date.now();
                
                await addPointsBtn.click();
                
                const pointsInput = page.locator('input[type="number"]').first();
                if (await pointsInput.isVisible()) {
                    await pointsInput.fill('10');
                    await page.click('button:has-text("Добавить"), button:has-text("Подтвердить"), .btn-primary');
                    
                    // Ждем обновления UI
                    await page.waitForTimeout(500);
                }
                
                const operationTime = Date.now() - startTime;
                
                // Операция добавления очков должна быть быстрой
                expect(operationTime).toBeLessThan(2000);
                console.log(`Время добавления очков: ${operationTime}ms`);
            }
        });

        await test.step('Время создания активности', async () => {
            const createButton = page.locator('button:has-text("Создать"), .create-activity-btn').first();
            
            if (await createButton.isVisible()) {
                const startTime = Date.now();
                
                await createButton.click();
                await page.waitForSelector('#newActivityModal');
                
                await page.fill('#activityName', 'Performance Test Activity');
                await page.fill('#activityDescription', 'Тест производительности');
                await page.fill('#activityPoints', '15');
                
                await page.click('button[type="submit"]:has-text("Создать")');
                await page.waitForSelector('#newActivityModal', { state: 'hidden' });
                
                const operationTime = Date.now() - startTime;
                
                // Создание активности должно быть быстрым
                expect(operationTime).toBeLessThan(3000);
                console.log(`Время создания активности: ${operationTime}ms`);
            }
        });
    });

    test('Использование памяти и ресурсов', async ({ page }) => {
        await test.step('Мониторинг использования памяти', async () => {
            // Получаем начальные метрики производительности
            await page.goto('/');
            await page.fill('#loginInput', testUser);
            await page.click('#loginButton');
            await page.waitForSelector('.skill-card');
            
            // Получаем метрики после загрузки
            const metrics = await page.evaluate(() => {
                return {
                    memory: performance.memory ? {
                        usedJSHeapSize: performance.memory.usedJSHeapSize,
                        totalJSHeapSize: performance.memory.totalJSHeapSize,
                        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                    } : null,
                    timing: {
                        domComplete: performance.timing.domComplete - performance.timing.navigationStart,
                        loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart
                    }
                };
            });
            
            console.log('Метрики производительности:', metrics);
            
            if (metrics.memory) {
                // Используемая память не должна превышать разумные пределы (например, 50MB)
                const usedMemoryMB = metrics.memory.usedJSHeapSize / 1024 / 1024;
                expect(usedMemoryMB).toBeLessThan(50);
                console.log(`Использовано памяти: ${usedMemoryMB.toFixed(2)}MB`);
            }
        });

        await test.step('Проверка утечек памяти при навигации', async () => {
            // Получаем начальную память
            let initialMemory = await page.evaluate(() => 
                performance.memory ? performance.memory.usedJSHeapSize : 0
            );
            
            // Выполняем несколько циклов навигации
            for (let i = 0; i < 5; i++) {
                await page.click('.skill-card:has-text("Рисование") .details-button');
                await page.waitForSelector('.level-display');
                
                await page.click('#backButton');
                await page.waitForSelector('.skill-card');
                
                await page.click('.skill-card:has-text("Музыка") .details-button');
                await page.waitForSelector('.level-display');
                
                await page.click('#backButton');
                await page.waitForSelector('.skill-card');
            }
            
            // Принудительно запускаем сборку мусора (если доступно)
            await page.evaluate(() => {
                if (window.gc) window.gc();
            });
            
            await page.waitForTimeout(1000);
            
            let finalMemory = await page.evaluate(() => 
                performance.memory ? performance.memory.usedJSHeapSize : 0
            );
            
            if (initialMemory > 0 && finalMemory > 0) {
                const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;
                
                // Увеличение памяти не должно быть значительным (менее 10MB)
                expect(memoryIncrease).toBeLessThan(10);
                console.log(`Увеличение памяти после навигации: ${memoryIncrease.toFixed(2)}MB`);
            }
        });
    });

    test('Стресс-тестирование пользовательского интерфейса', async ({ page }) => {
        await page.waitForSelector('.skill-card');
        await page.click('.skill-card:has-text("Рисование") .details-button');
        
        await test.step('Быстрые повторные операции', async () => {
            const addPointsBtn = page.locator('.add-points-btn, button:has-text("очки")').first();
            
            if (await addPointsBtn.isVisible()) {
                // Выполняем быстрые повторные добавления очков
                for (let i = 0; i < 3; i++) {
                    await addPointsBtn.click();
                    
                    const pointsInput = page.locator('input[type="number"]').first();
                    if (await pointsInput.isVisible()) {
                        await pointsInput.fill('5');
                        await page.click('button:has-text("Добавить"), .btn-primary');
                        await page.waitForTimeout(100);
                    }
                }
                
                // Проверяем что приложение остается отзывчивым
                await expect(page.locator('.level-display')).toBeVisible();
            }
        });

        await test.step('Создание множественных активностей', async () => {
            const createButton = page.locator('button:has-text("Создать"), .create-activity-btn').first();
            
            if (await createButton.isVisible()) {
                // Создаем несколько активностей подряд
                for (let i = 1; i <= 3; i++) {
                    await createButton.click();
                    await page.waitForSelector('#newActivityModal');
                    
                    await page.fill('#activityName', `Stress Test Activity ${i}`);
                    await page.fill('#activityDescription', `Описание ${i}`);
                    await page.fill('#activityPoints', `${i * 5}`);
                    
                    await page.click('button[type="submit"]:has-text("Создать")');
                    await page.waitForSelector('#newActivityModal', { state: 'hidden' });
                    
                    // Проверяем что активность создалась
                    await expect(page.getByText(`Stress Test Activity ${i}`)).toBeVisible();
                }
            }
        });
    });

    test('Производительность сети и API', async ({ page }) => {
        await test.step('Мониторинг сетевых запросов', async () => {
            const responses = [];
            
            // Перехватываем все сетевые запросы
            page.on('response', response => {
                if (response.url().includes('/api/') || response.url().includes('/skills') || 
                    response.url().includes('/history') || response.url().includes('/actions')) {
                    responses.push({
                        url: response.url(),
                        status: response.status(),
                        time: Date.now()
                    });
                }
            });
            
            await page.goto('/');
            await page.fill('#loginInput', testUser);
            await page.click('#loginButton');
            await page.waitForSelector('.skill-card');
            
            // Переходим к навыку чтобы сгенерировать больше запросов
            await page.click('.skill-card:has-text("Рисование") .details-button');
            await page.waitForTimeout(2000);
            
            // Анализируем собранные запросы
            console.log(`Количество API запросов: ${responses.length}`);
            
            const failedRequests = responses.filter(r => r.status >= 400);
            expect(failedRequests.length).toBe(0);
            
            // Проверяем что нет слишком много дублирующихся запросов
            const uniqueUrls = new Set(responses.map(r => r.url));
            const duplicateRatio = (responses.length - uniqueUrls.size) / responses.length;
            
            // Дублирующихся запросов должно быть не более 30%
            expect(duplicateRatio).toBeLessThan(0.3);
            console.log(`Соотношение дублирующихся запросов: ${(duplicateRatio * 100).toFixed(1)}%`);
        });

        await test.step('Проверка timeout-ов запросов', async () => {
            // Эмулируем медленную сеть
            await page.route('**/*', async route => {
                // Добавляем задержку для API запросов
                if (route.request().url().includes('/api/') || 
                    route.request().url().includes('/skills')) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                await route.continue();
            });
            
            const startTime = Date.now();
            
            await page.goto('/');
            await page.fill('#loginInput', testUser);
            await page.click('#loginButton');
            await page.waitForSelector('.skill-card', { timeout: 10000 });
            
            const totalTime = Date.now() - startTime;
            
            // Даже с медленной сетью приложение должно загружаться разумно быстро
            expect(totalTime).toBeLessThan(10000);
            console.log(`Время загрузки с медленной сетью: ${totalTime}ms`);
        });
    });

    test('Масштабируемость интерфейса', async ({ page }) => {
        await test.step('Производительность с большим количеством данных', async () => {
            await page.waitForSelector('.skill-card');
            
            // Если есть много навыков, проверяем производительность рендеринга
            const skillCards = page.locator('.skill-card');
            const skillCount = await skillCards.count();
            
            console.log(`Количество навыков: ${skillCount}`);
            
            if (skillCount > 0) {
                // Измеряем время прокрутки и взаимодействия
                const startTime = Date.now();
                
                // Прокручиваем страницу
                await page.mouse.wheel(0, 500);
                await page.waitForTimeout(100);
                
                // Кликаем на первый навык
                await page.click('.skill-card:first-child .details-button');
                await page.waitForSelector('.level-display');
                
                const interactionTime = Date.now() - startTime;
                
                // Взаимодействие должно оставаться быстрым
                expect(interactionTime).toBeLessThan(1500);
                console.log(`Время взаимодействия с данными: ${interactionTime}ms`);
            }
        });

        await test.step('Производительность анимаций', async () => {
            // Проверяем что анимации не блокируют интерфейс
            await page.click('#backButton');
            await page.waitForSelector('.skill-card');
            
            // Быстро переключаемся между навыками
            for (let i = 0; i < 3; i++) {
                await page.click('.skill-card:nth-child(1) .details-button');
                await page.waitForTimeout(200);
                
                await page.click('#backButton');
                await page.waitForTimeout(200);
                
                // Проверяем что UI остается отзывчивым
                await expect(page.locator('.skill-card')).toBeVisible();
            }
        });
    });

    test.afterEach(async ({ page }) => {
        // Логируем финальные метрики производительности
        const finalMetrics = await page.evaluate(() => {
            return {
                timing: performance.timing,
                navigation: performance.navigation,
                memory: performance.memory || null
            };
        });
        
        console.log('Финальные метрики:', {
            domComplete: finalMetrics.timing.domComplete - finalMetrics.timing.navigationStart,
            loadComplete: finalMetrics.timing.loadEventEnd - finalMetrics.timing.navigationStart,
            memory: finalMetrics.memory ? 
                (finalMetrics.memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + 'MB' : 
                'недоступно'
        });
    });
}); 