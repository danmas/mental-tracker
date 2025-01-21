const fs = require('fs').promises;
const path = require('path');

async function resetDrawingSkill() {
    try {
        const historyPath = path.join(__dirname, 'history.json');
        const historyData = JSON.parse(await fs.readFile(historyPath, 'utf-8'));

        historyData.skills.drawing = {
            level: 0,
            currentPoints: "0",
            history: [],
            achievements: [],
            progress: 0
        };

        await fs.writeFile(historyPath, JSON.stringify(historyData, null, 4));
        console.log('Навык "drawing" успешно сброшен');
    } catch (error) {
        console.error('Ошибка при сбросе навыка:', error);
    }
}

async function testHistorySort() {
    const API_URL = 'http://localhost:3000';
    
    try {
        console.log('=== Тестирование сортировки истории ===\n');

        // Сброс навыка перед тестированием
        console.log('Сброс навыка "drawing"...');
        await resetDrawingSkill();

        // Добавляем первую активность
        console.log('\nДобавление первой активности (sketch)');
        await fetch(`${API_URL}/skills/drawing/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "activityId": "draw_sketch",
                "notes": "Первая активность"
            })
        });

        // Ждем 2 секунды
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Добавляем вторую активность
        console.log('Добавление второй активности (stilllife)');
        await fetch(`${API_URL}/skills/drawing/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "activityId": "draw_stilllife",
                "notes": "Вторая активность"
            })
        });

        // Ждем 2 секунды
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Добавляем третью активность
        console.log('Добавление третьей активности (sketch)');
        await fetch(`${API_URL}/skills/drawing/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "activityId": "draw_stilllife",
                "notes": "Третья активность"
            })
        });

        // Получаем историю и проверяем сортировку
        console.log('\nПолучаем отсортированную историю:');
        const history = await fetch(`${API_URL}/skills/drawing/history`)
            .then(res => res.json());

        console.log('\nИстория активностей в порядке убывания по времени:');
        history.forEach((record, index) => {
            console.log(`\n${index + 1}) ${record.name}`);
            console.log(`   Заметки: ${record.notes}`);
            console.log(`   Время: ${record.timestamp}`);
            console.log(`   Очки: ${record.points}`);
        });

    } catch (error) {
        console.error('Ошибка:', error.message);
    }
}

// Запуск теста
testHistorySort();