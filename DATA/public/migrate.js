const fs = require('fs').promises;
const path = require('path');
const dateUtils = require('./dateUtils');

async function migrateTimestamps() {
    const historyFilePath = path.join(__dirname, 'history.json');
    const backupFilePath = path.join(__dirname, `history_backup_${Date.now()}.json`);

    try {
        // Читаем текущий файл истории
        console.log('Чтение файла history.json...');
        const historyData = JSON.parse(await fs.readFile(historyFilePath, 'utf-8'));

        // Создаем резервную копию
        console.log('Создание резервной копии...');
        await fs.writeFile(backupFilePath, JSON.stringify(historyData, null, 4));

        // Конвертируем все timestamp в новый формат
        console.log('Конвертация timestamp\'ов...');
        
        // Обновляем дату регистрации пользователя
        if (historyData.user && historyData.user.dateJoined) {
            historyData.user.dateJoined = dateUtils.formatDate(new Date(historyData.user.dateJoined));
        }

        // Обрабатываем историю каждого навыка
        for (const skillCode of Object.keys(historyData.skills)) {
            const skill = historyData.skills[skillCode];
            
            // Конвертируем timestamp в истории
            if (skill.history) {
                skill.history = skill.history.map(record => ({
                    ...record,
                    timestamp: dateUtils.formatDate(new Date(record.timestamp))
                }));
            }

            // Конвертируем даты в достижениях
            if (skill.achievements) {
                skill.achievements = skill.achievements.map(achievement => ({
                    ...achievement,
                    dateEarned: achievement.dateEarned ? 
                        dateUtils.formatDate(new Date(achievement.dateEarned)) : 
                        undefined
                }));
            }
        }

        // Сохраняем обновленные данные
        console.log('Сохранение обновленных данных...');
        await fs.writeFile(historyFilePath, JSON.stringify(historyData, null, 4));

        console.log('Миграция успешно завершена!');
        console.log(`Резервная копия сохранена в: ${backupFilePath}`);

        // Выводим пример первой записи для проверки
        const firstSkill = Object.values(historyData.skills)[0];
        if (firstSkill.history && firstSkill.history.length > 0) {
            console.log('\nПример записи после конвертации:');
            console.log(JSON.stringify(firstSkill.history[0], null, 2));
        }

    } catch (error) {
        console.error('Ошибка при миграции:', error);
        throw error;
    }
}

// Запускаем миграцию
migrateTimestamps();