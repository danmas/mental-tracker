import { test, expect } from '@playwright/test';

test.describe('Activity Creation and Selection', () => {
    const testUser = 'erv'; // Используем уже существующего пользователя
    
    test.beforeEach(async ({ page }) => {
        // Настраиваем автоматическое подтверждение alert'ов
        page.on('dialog', async dialog => {
            console.log(`Dialog: ${dialog.type()} - ${dialog.message()}`);
            await dialog.accept();
        });
        
        // Переходим на главную страницу
        await page.goto('http://localhost:3050');
        
        // Если нужна авторизация, авторизуемся
        const loginButton = page.locator('#loginButton');
        if (await loginButton.isVisible()) {
            await page.fill('#loginInput', testUser);
            await page.click('#loginButton');
        }
        
        await expect(page.locator('#mainContent')).toBeVisible();
    });

    test('Отладка API вызовов при открытии списка активностей', async ({ page }) => {
        // Добавляем логирование console.log из браузера
        page.on('console', msg => {
            console.log('BROWSER LOG:', msg.text());
        });
        
        // Переходим к навыку "Рисование"
        await page.waitForSelector('.skill-card');
        await page.click('.skill-card:has-text("Рисование") .details-button');
        
        // Ждем загрузки страницы навыка
        await page.waitForSelector('#pageTitle');
        
        // Открываем модальное окно добавления активности
        await page.click('button:has-text("Добавить активность")');
        await page.waitForSelector('#activityFormModal');
        
        // Ждем немного для завершения всех API вызовов и логирования
        await page.waitForTimeout(3000);
        
        // Проверяем что селект активностей видим
        const activitySelect = page.locator('#activitySelect');
        await expect(activitySelect).toBeVisible();
        
        // Проверяем количество опций
        const optionCount = await activitySelect.locator('option').count();
        console.log('TEST LOG: Option count:', optionCount);
        
        // Закрываем модальное окно
        await page.click('button:has-text("Отмена")');
    });
}); 