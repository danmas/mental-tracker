const data = require('./data');

async function testData() {
    try {
        console.log('--- Получение данных пользователя ---');
        const user = await data.getUserData();
        console.log(user);

        console.log('--- Получение данных по направлению "drawing" ---');
        const drawingSkill = await data.getSkillData('drawing');
        console.log(drawingSkill);

        console.log('--- Получение истории заданий по направлению "music" ---');
        const musicHistory = await data.getSkillHistory('music');
        console.log(musicHistory);

        console.log('--- Получение справочника заданий ---');
        const activities = await data.getActivities();
        console.log(activities);

        console.log('--- Добавление записи в историю заданий для "willpower" ---');
        const newRecord = await data.addHistoryRecord('willpower', {
            activityId: 'meditation',
            notes: 'Вечерняя медитация'
        });
        console.log(newRecord);

        console.log('--- Добавление достижения для "drawing" ---');
        const newAchievement = await data.addAchievement('drawing', {
            name: 'Новый уровень',
            description: 'Достигнут 3-й уровень в рисовании'
        });
        console.log(newAchievement);

        console.log('--- Получение обновленных данных по направлению "drawing" ---');
        const updatedDrawingSkill = await data.getSkillData('drawing');
        console.log(updatedDrawingSkill);

        console.log('--- Получение всех направлений ---');
        const skills = await data.getAllSkills();
        console.log(skills);

    } catch (error) {
        console.error('Ошибка:', error);
    }
}

testData();
