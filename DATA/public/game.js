const data = require('./data');
const dateUtils = require('./dateUtils');

async function calculateLevel(totalPoints) {
    let level = 0;
    let pointsNeeded = 100;  // Очки для первого уровня
    let remainingPoints = totalPoints;

    // Считаем уровни
    while (remainingPoints >= pointsNeeded) {
        remainingPoints -= pointsNeeded;
        level++;
        pointsNeeded = 100; //(level + 0) * 100;  // Очки для следующего уровня
    }

    // Очки, нужные для следующего уровня
    const pointsForNextLevel = (level + 1) * 100;
    
    // Прогресс в процентах для текущего уровня
    const progress = Math.floor((remainingPoints / pointsNeeded) * 100);

    return {
        level,
        currentLevelPoints: remainingPoints,
        pointsForNextLevel,
        progress
    };
}

async function addPoints(skillCode, points, user) {
    try {
        const skillData = await data.getSkillData(skillCode, user);
        const currentPoints = parseInt(skillData.currentPoints) || 0;
        const pointsToAdd = parseInt(points) || 0;
        const newTotalPoints = currentPoints + pointsToAdd;

        // Получаем новый уровень и прогресс
        const levelData = await calculateLevel(newTotalPoints);

        // Обновляем данные в истории
        const historyData = await data.readHistoryData(user);
        historyData.skills[skillCode].currentPoints = newTotalPoints;
        historyData.skills[skillCode].level = levelData.level;
        historyData.skills[skillCode].progress = levelData.progress;

        await data.writeHistoryData(historyData, user);

        return { 
            totalPoints: newTotalPoints,
            ...levelData
        };
    } catch (error) {
        throw error;
    }
}

async function recalculateSkillProgress(skillCode, user) {
    try {
        const skillHistory = await data.getSkillHistory(skillCode, user);
        if (!skillHistory) {
            throw new Error(`История для навыка ${skillCode} не найдена`);
        }

        // Суммируем все очки из истории
        const totalPoints = skillHistory.reduce((sum, record) => sum + record.points, 0);

        // Получаем новый уровень и прогресс
        const levelData = await calculateLevel(totalPoints);

        // Обновляем данные в истории
        const historyData = await data.readHistoryData(user);
        historyData.skills[skillCode].currentPoints = totalPoints;
        historyData.skills[skillCode].level = levelData.level;
        historyData.skills[skillCode].progress = levelData.progress;

        await data.writeHistoryData(historyData, user);

        return {
            totalPoints,
            ...levelData
        };
    } catch (error) {
        throw error;
    }
}

module.exports = {
    calculateLevel,
    addPoints,
    recalculateSkillProgress
};