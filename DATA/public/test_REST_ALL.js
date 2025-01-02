// Тесты для REST API Ментального Трекера
async function testAPI() {
    const API_URL = 'http://localhost:3050';
    
    try {
        console.log('=== Тестирование REST API Ментального Трекера ===\n');

        // 1. GET /skills - получение списка всех навыков
        console.log('1. GET /skills - Получение списка всех навыков');
        const skills = await fetch(`${API_URL}/skills`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            });
        console.log('Список навыков:', JSON.stringify(skills, null, 2));

        // 2. GET /skills/:skillCode - получение данных конкретного навыка
        console.log('\n2. GET /skills/drawing - Получение данных навыка "Рисование"');
        const drawingSkill = await fetch(`${API_URL}/skills/drawing`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            });
        console.log('Данные навыка:', JSON.stringify(drawingSkill, null, 2));

        // 3. GET /skills/:skillCode/history - получение истории навыка
        console.log('\n3. GET /skills/drawing/history - Получение истории навыка "Рисование"');
        const drawingHistory = await fetch(`${API_URL}/skills/drawing/history`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            });
        console.log('История навыка:', JSON.stringify(drawingHistory, null, 2));

        // 4. GET /activities - получение списка доступных действий
        console.log('\n4. GET /activities - Получение списка доступных действий');
        const activities = await fetch(`${API_URL}/activities`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            });
        console.log('Список действий:', JSON.stringify(activities, null, 2));

        // 5. POST /skills/:skillCode/history - добавление записи в историю
        console.log('\n5. POST /skills/drawing/history - Добавление новой активности');
        const newActivity = await fetch(`${API_URL}/skills/drawing/history`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "activityId": "draw_sketch",
                "notes": "Тестовая активность API"
            })
        }).then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        });
        console.log('Результат добавления активности:', JSON.stringify(newActivity, null, 2));

        // 6. POST /skills/:skillCode/achievements - добавление достижения
        console.log('\n6. POST /skills/drawing/achievements - Добавление нового достижения');
        const newAchievement = await fetch(`${API_URL}/skills/drawing/achievements`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "name": "Тестовое достижение",
                "description": "Достижение добавлено через API тест"
            })
        }).then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        });
        console.log('Результат добавления достижения:', JSON.stringify(newAchievement, null, 2));

        // 7. POST /skills/:skillCode/points - начисление очков
        console.log('\n7. POST /skills/drawing/points - Начисление очков');
        const pointsResult = await fetch(`${API_URL}/skills/drawing/points`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "points": 15
            })
        }).then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        });
        console.log('Результат начисления очков:', JSON.stringify(pointsResult, null, 2));

        // Тест создания новой активности
        console.log('\n9. POST /activities - Создание новой активности');
        const newCustomActivity = await fetch(`${API_URL}/activities`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: "Цифровой рисунок",
                description: "Создание цифрового рисунка в графическом редакторе",
                points: 20,
                skill_code: "drawing"
            })
        }).then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        });
        console.log('Новая активность создана:', JSON.stringify(newCustomActivity, null, 2));

        // Финальная проверка состояния
        console.log('\n100. Проверка финального состояния навыка "Рисование"');
        const finalState = await fetch(`${API_URL}/skills/drawing`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            });
        console.log('Финальное состояние:', JSON.stringify(finalState, null, 2));

    } catch (error) {
        console.error('Произошла ошибка:', error.message);
    }
}

// Запуск тестов
testAPI();