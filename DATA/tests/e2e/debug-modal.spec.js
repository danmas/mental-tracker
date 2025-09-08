import { test, expect } from '@playwright/test';

test.describe('Debug Modal Test', () => {
    const testUser = 'debug_user';
    
    test('Проверка модального окна создания активности', async ({ page }) => {
        // Настраиваем автоматическое подтверждение всех alert'ов
        page.on('dialog', async dialog => {
            console.log(`Dialog: ${dialog.type()} - ${dialog.message()}`);
            await dialog.accept();
        });
        
        // Переходим на главную страницу
        await page.goto('/');
        
        // Авторизуемся
        await page.fill('#loginInput', testUser);
        await page.click('#loginButton');
        await expect(page.locator('#mainContent')).toBeVisible();
        
        // Переходим к навыку
        await page.waitForSelector('.skill-card');
        await page.click('.skill-card:has-text("Рисование") .details-button');
        await expect(page.locator('#pageTitle')).toContainText('Рисование');
        
        // Открываем модальное окно
        await page.click('button:has-text("Создать активность")');
        await page.waitForSelector('#newActivityModal');
        
        // Проверяем что модальное окно открыто
        await expect(page.locator('#newActivityModal')).toBeVisible();
        console.log('Modal is visible');
        
        // Выбираем тип активности
        await page.click('input[name="activityType"][value="activity"]');
        console.log('Activity type selected');
        
        // Заполняем форму
        await page.fill('#activityName', 'Debug Test Activity');
        await page.fill('#activityDescription', 'Debug test');
        await page.fill('#activityPoints', '5');
        console.log('Form filled');
        
        // Делаем скриншот перед отправкой
        await page.screenshot({ path: 'debug-before-submit.png' });
        
        // Отправляем форму
        await page.click('button[type="submit"]:has-text("Создать")');
        console.log('Form submitted');
        
        // Ждем немного
        await page.waitForTimeout(2000);
        
        // Делаем скриншот после отправки
        await page.screenshot({ path: 'debug-after-submit.png' });
        
        // Проверяем состояние модального окна
        const modalVisible = await page.locator('#newActivityModal').isVisible();
        console.log('Modal visible after submit:', modalVisible);
        
        if (modalVisible) {
            // Если модальное окно всё еще видимо, проверим есть ли ошибки
            const errorMessages = await page.locator('.error, .alert-danger, .invalid-feedback').count();
            console.log('Error messages count:', errorMessages);
            
            // Проверим содержимое модального окна
            const modalContent = await page.locator('#newActivityModal').innerHTML();
            console.log('Modal content:', modalContent.substring(0, 500));
        }
        
        // Попробуем закрыть модальное окно вручную если оно открыто
        if (modalVisible) {
            await page.click('button:has-text("Отмена")');
            await page.waitForTimeout(1000);
        }
        
        // Финальная проверка
        const finalModalState = await page.locator('#newActivityModal').isVisible();
        console.log('Final modal state:', finalModalState);
    });
}); 