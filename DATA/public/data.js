const fs = require('fs').promises;
const path = require('path');
// В начало файла добавляем:
const dateUtils = require('./dateUtils');

// В функции addHistoryRecord изменяем создание timestamp:
// const newRecord = {
//     id: `act_${Date.now()}`,
//     ...record,
//     timestamp: dateUtils.formatDate(new Date())
// };

// Пути к файлам с данными
const skillsFilePath = path.join(__dirname, 'skills.json');
const actionsFilePath = path.join(__dirname, '--actions.json');
const historyFilePath = path.join(__dirname, '--history.json');

// --- Чтение данных из JSON файлов ---

async function readSkillsData() {
    try {
        const data = await fs.readFile(skillsFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Ошибка чтения файла skills.json:', error);
        throw new Error(`Ошибка чтения файла: ${skillsFilePath}`);
    }
}

// async function readActionsData() {
//     try {
//         const data = await fs.readFile(actionsFilePath, 'utf-8');
//         return JSON.parse(data);
//     } catch (error) {
//         console.error('Ошибка чтения файла actions.json:', error);
//         throw new Error(`Ошибка чтения файла: ${actionsFilePath}`);
//     }
// }

async function readActionsData() {
    try {
        const response = await axios.get(`https://api.jsonbin.io/v3/b/${BIN_ID_actions}`, {
            headers: {
                'X-Master-Key': API_KEY
            }
        });
        return response.data.record;
        } catch (error) {
        console.error('Ошибка чтения файла history.json:', error);
        throw new Error(`Ошибка чтения файла с jsonbin ${historyFilePath}`);
    }
}

// --- Запись данных в JSON файлы ---

async function writeActionsData(data) {
    try {
        await axios.put(`https://api.jsonbin.io/v3/b/${BIN_ID_actions}`, data, {
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            }
        });
       } catch (error) {
        console.error('Ошибка записи в файл actions.json:', error);
        throw new Error(`Ошибка записи в файл actions.json.}`);
    }
}


async function addActivity(activity) {
    try {
        console.log('--- addActivity(activity() '+ activity);

        const actionsData = await readActionsData();
        
        // Генерируем уникальный id для активности
        const activityId = `activity_${Date.now()}`;
        
        // Валидация обязательных полей
        if (!activity.name || !activity.skill_code || !activity.points) {
            throw new Error('Отсутствуют обязательные поля (name, skill_code, points)');
        }

        // Добавляем новую активность, преобразуя points в число
        actionsData.activities[activityId] = {
            name: activity.name,
            description: activity.description || '',
            points: parseInt(activity.points) || 0,  // Преобразуем в число
            skill_code: activity.skill_code
        };

        // Сохраняем обновленный файл
        //await fs.writeFile(actionsFilePath, JSON.stringify(actionsData, null, 4));
        await writeActionsData(actionsData);

        return {
            id: activityId,
            ...actionsData.activities[activityId]
        };
    } catch (error) {
        throw error;
    }
}



// Добавляем функцию в exports
module.exports = {
    // ... существующие экспорты
    addActivity
};


// async function readHistoryData() {
//     try {
//         const data = await fs.readFile(historyFilePath, 'utf-8');
//         return JSON.parse(data);
//     } catch (error) {
//         console.error('Ошибка чтения файла history.json:', error);
//         throw new Error(`Ошибка чтения файла: ${historyFilePath}`);
//     }
// }

// // --- Запись данных в JSON файлы ---

// async function writeHistoryData(data) {
//     try {
//         await fs.writeFile(historyFilePath, JSON.stringify(data, null, 4));
//     } catch (error) {
//         console.error('Ошибка записи в файл history.json:', error);
//         throw new Error(`Ошибка записи в файл: ${historyFilePath}`);
//     }
// }

// Бесплатный сервис специально для JSON
const axios = require('axios');
const BIN_ID_HISTORY = '6776e6f0ad19ca34f8e4af75';
const BIN_ID_actions = '6776ee69ad19ca34f8e4b236';
//const API_KEY = '$2a$10$Jn1kVlOFNV8oXzIJqx5xRemNZGyLAqGK5rerTT5lv43FPgN/qd.Si';
const API_KEY = '$2a$10$PVL7lQvItBvbwEtyKtmrquOMxG1W9AQd5Cb70p2qVYjW2ytMsGB8.';
//$2a$10$PVL7lQvItBvbwEtyKtmrquOMxG1W9AQd5Cb70p2qVYjW2ytMsGB8.


async function readHistoryData() {
    try {
        const response = await axios.get(`https://api.jsonbin.io/v3/b/${BIN_ID_HISTORY}`, {
            headers: {
                'X-Master-Key': API_KEY
            }
        });
        return response.data.record;
        } catch (error) {
        console.error('Ошибка чтения файла history.json:', error);
        throw new Error(`Ошибка чтения файла с jsonbin ${historyFilePath}`);
    }
}

// --- Запись данных в JSON файлы ---

async function writeHistoryData(data) {
    try {
        await axios.put(`https://api.jsonbin.io/v3/b/${BIN_ID_HISTORY}`, data, {
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            }
        });
       } catch (error) {
        console.error('Ошибка записи в файл history.json:', error);
        throw new Error(`Ошибка записи в файл: ${historyFilePath}`);
    }
}




// --- Получение данных ---

async function getUserData() {
    try {
        const historyData = await readHistoryData();
        return historyData.user;
    } catch (error) {
        throw error;
    }
}



async function getAllSkills() {
    try {
        const skillsData = await readSkillsData();
        const historyData = await readHistoryData();
        
        const enrichedSkills = skillsData.skills.map(skill => {
            const skillHistory = historyData.skills[skill.code];
            
            // Сортируем историю по timestamp в обратном порядке
            const sortedHistory = [...skillHistory.history].sort((a, b) => {
                return new Date(b.timestamp) - new Date(a.timestamp);
            });
            console.log(`getAllSkills()  skillHistory.level: `+skillHistory.level);    
            return {
                ...skill,
                level: skillHistory.level || 0,
                currentPoints: skillHistory.currentPoints || 0,
                progress: skillHistory.progress || 0,
                achievements: skillHistory.achievements || [],
                history: sortedHistory
            };
        });
        
        return enrichedSkills;
    } catch (error) {
        console.error('Ошибка при получении данных о навыках:', error);
        throw error;
    }
}



async function getSkillData(skillCode) {
    try {
        const skillsData = await readSkillsData();
        const historyData = await readHistoryData();
        const skill = skillsData.skills.find(skill => skill.code === skillCode);
        const skillHistory = historyData.skills[skillCode];
        
        if (!skill || !skillHistory) {
            throw new Error(`Навык с кодом ${skillCode} не найден`);
        }

        // Сортируем историю по timestamp в обратном порядке
        const sortedHistory = [...skillHistory.history].sort((a, b) => {
            return dateUtils.parseDate(b.timestamp) - dateUtils.parseDate(a.timestamp);
        });
        
        console.log(`getSkillData()  skillHistory.level: `+skillHistory.level);    
        // Возвращаем навык со всеми данными и отсортированной историей
        return { 
            ...skill, 
            level: skillHistory.level || 0,
            currentPoints: skillHistory.currentPoints || 0,
            progress: skillHistory.progress || 0,
            achievements: skillHistory.achievements || [],
            history: sortedHistory  // Возвращаем отсортированную историю
        };
    } catch (error) {
        throw error;
    }
}

async function getSkillHistory(skillCode) {
    try {
        const historyData = await readHistoryData();
        const skillHistory = historyData.skills[skillCode];
        
        if (!skillHistory) {
            throw new Error(`История для навыка ${skillCode} не найдена`);
        }

        // Сортируем историю по timestamp в обратном порядке (сначала новые)
        // const sortedHistory = [...skillHistory.history].sort((a, b) => {
        //     return new Date(b.timestamp) - new Date(a.timestamp);
        // });
        const sortedHistory = [...skillHistory.history].sort((a, b) => {
            return dateUtils.parseDate(b.timestamp) - dateUtils.parseDate(a.timestamp);
        });
        
        return sortedHistory;
    } catch (error) {
        throw error;
    }
}

async function getActivities() {
    try {
        const actionsData = await readActionsData();
        
        // Преобразуем points в число для всех активностей
        const activities = {};
        for (const [id, activity] of Object.entries(actionsData.activities)) {
            activities[id] = {
                ...activity,
                points: parseInt(activity.points) || 0  // Преобразуем в число
            };
        }
        
        return activities;
    } catch (error) {
        throw error;
    }
}


// --- Добавление данных ---

async function addHistoryRecord(skillCode, record) {
    try {
        const historyData = await readHistoryData();
        if (!historyData.skills[skillCode]) {
            throw new Error(`Навык ${skillCode} не найден`);
        }
        const newRecord = {
            id: `act_${Date.now()}`,
            ...record,
            timestamp: dateUtils.formatDate(new Date()) //new Date().toISOString()
        };
        historyData.skills[skillCode].history.push(newRecord);
        await writeHistoryData(historyData);
        return newRecord;
    } catch (error) {
        throw error;
    }
}




async function addAchievement(skillCode, achievement) {
    try {
        const historyData = await readHistoryData();
        if (!historyData.skills[skillCode]) {
            throw new Error(`Навык ${skillCode} не найден`);
        }
        const newAchievement = {
            id: `ach_${Date.now()}`,
            ...achievement,
            dateEarned: new Date().toISOString()
        };
        historyData.skills[skillCode].achievements.push(newAchievement);
        await writeHistoryData(historyData);
        return newAchievement;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    readSkillsData,
    readActionsData,
    readHistoryData,
    writeHistoryData,
    writeActionsData,
    getUserData,
    getAllSkills,
    getSkillData,
    getSkillHistory,
    getActivities,
    addHistoryRecord,
    addAchievement,
    addActivity
};