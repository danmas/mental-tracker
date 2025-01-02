const fs = require('fs').promises;
const path = require('path');

async function resetDrawingSkill() {
    try {
        // Читаем текущий history.json
        const historyPath = path.join(__dirname, 'history.json');
        const historyData = JSON.parse(await fs.readFile(historyPath, 'utf-8'));

        // Сбрасываем все значения для навыка drawing
        historyData.skills.drawing = {
            level: 0,
            currentPoints: "0",
            history: [],
            achievements: [],
            progress: 0
        };

        // Записываем обновленные данные
        await fs.writeFile(historyPath, JSON.stringify(historyData, null, 4));
        console.log('Навык "drawing" успешно сброшен');
    } catch (error) {
        console.error('Ошибка при сбросе навыка:', error);
    }
}

async function testLevels() {
    const API_URL = 'http://localhost:3000';
    
    try {
        console.log('=== Тестирование системы уровней ===\n');

        // Сброс навыка перед тестированием
        console.log('Сброс навыка "drawing"...');
        await resetDrawingSkill();
        
        // Проверка начального состояния
        console.log('\nНачальное состояние навыка:');
        const initialState = await fetch(`${API_URL}/skills/drawing`)
            .then(res => res.json());
        console.log(JSON.stringify(initialState, null, 2));

        // Тест 1: Добавление активности с 10 очками
        console.log('\nТест 1: Добавление активности "Скетч карандашом" (10 очков)');
        const test1 = await fetch(`${API_URL}/skills/drawing/history`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "activityId": "draw_sketch",
                "notes": "Тест системы уровней - 10 очков"
            })
        }).then(res => res.json());
        console.log('Результат:', JSON.stringify(test1, null, 2));

        // Тест 2: Добавление активности с 25 очками
        console.log('\nТест 2: Добавление активности "Рисование натюрморта" (25 очков)');
        const test2 = await fetch(`${API_URL}/skills/drawing/history`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "activityId": "draw_stilllife",
                "notes": "Тест системы уровней - 25 очков"
            })
        }).then(res => res.json());
        console.log('Результат:', JSON.stringify(test2, null, 2));

        // Тест 3: Добавление большого количества очков напрямую
        console.log('\nТест 3: Добавление 250 очков напрямую');
        const test3 = await fetch(`${API_URL}/skills/drawing/points`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "points": 250
            })
        }).then(res => res.json());
        console.log('Результат:', JSON.stringify(test3, null, 2));

        // Тест 3: Добавление большого количества очков напрямую
        console.log('\nТест 3: Добавление 100 очков напрямую');
        const test4 = await fetch(`${API_URL}/skills/drawing/points`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "points": 100
            })
        }).then(res => res.json());
        console.log('Результат:', JSON.stringify(test4, null, 2));

        // Проверка финального состояния
        console.log('\nФинальное состояние навыка:');
        const finalState = await fetch(`${API_URL}/skills/drawing`)
            .then(res => res.json());
        console.log(JSON.stringify(finalState, null, 2));

    } catch (error) {
        console.error('Ошибка:', error.message);
    }
}

// Запуск тестов
testLevels();