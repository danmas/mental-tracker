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
const skillsFilePath = (user) => path.join(__dirname, `skills_${user}.json`);
//const skillsFilePath = path.join(__dirname, `skills.json`);
const actionsFilePath = (user) => path.join(__dirname, `actions_${user}.json`);
const historyFilePath = (user) => path.join(__dirname, `history_${user}.json`);

// --- Чтение данных из JSON файлов ---

async function ensureUserFilesExist(user) {
    const skillsFile = skillsFilePath(user);
    const historyFile = historyFilePath(user);
    const actionsFile = actionsFilePath(user);

    try {
        await fs.access(skillsFile);
    } catch {
        await fs.writeFile(skillsFile, JSON.stringify({ skills: [] }, null, 4));
    }

    try {
        await fs.access(historyFile);
    } catch {
        await fs.writeFile(historyFile, JSON.stringify({ skills: {} }, null, 4));
    }

    try {
        await fs.access(actionsFile);
    } catch {
        await fs.writeFile(actionsFile, JSON.stringify({ activities: {} }, null, 4));
    }
}

async function readSkillsData(user) {
    try {
        const data = await fs.readFile(skillsFilePath(user), 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Ошибка чтения файла skills.json:', error);
        throw new Error(`Ошибка чтения файла: ${skillsFilePath(user)}`);
    }
}


async function writeSkillsData(data, user) {
    try {
        await fs.writeFile(skillsFilePath(user), JSON.stringify(data, null, 4));
    } catch (error) {
        console.error('Ошибка записи в файл skills.json:', error);
        throw new Error(`Ошибка записи в файл: ${skillsFilePath(user)}`);
    }
}



async function readHistoryData(user) {
    try {
        const data = await fs.readFile(historyFilePath(user), 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Ошибка чтения файла: ${historyFilePath(user)}`, error);
        throw new Error(`Ошибка чтения файла: ${historyFilePath(user)}`);
    }
}

async function writeHistoryData(data, user) {
    try {
        await fs.writeFile(historyFilePath(user), JSON.stringify(data, null, 4));
    } catch (error) {
        console.error('Ошибка записи в файл history.json:', error);
        throw new Error(`Ошибка записи в файл: ${historyFilePath(user)}`);
    }
}



async function readActionsData(user) {
    try {
        console.log('readActionsData ' + user + ' ' + actionsFilePath(user));
        const data = await fs.readFile(actionsFilePath(user), 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Ошибка чтения файла: ${actionsFilePath(user)}`, error);
        throw new Error(`Ошибка чтения файла: ${actionsFilePath(user)}`);
    }
}

async function writeActionsData(data, user) {
    try {
        await fs.writeFile(actionsFilePath(user), JSON.stringify(data, null, 4));
    } catch (error) {
        console.error('Ошибка записи в файл history.json:', error);
        throw new Error(`Ошибка записи в файл: ${actionsFilePath(user)}`);
    }
}



// async function readActionsData() {
//     try {
//         const response = await axios.get(`https://api.jsonbin.io/v3/b/${BIN_ID_actions}`, {
//             headers: {
//                 'X-Master-Key': API_KEY
//             }
//         });
//         return response.data.record;
//         } catch (error) {
//         console.error('Ошибка чтения файла history.json:', error);
//         throw new Error(`Ошибка чтения файла с jsonbin ${historyFilePath}`);
//     }
// }

// // --- Запись данных в JSON файлы ---

// async function writeActionsData(data) {
//     try {
//         await axios.put(`https://api.jsonbin.io/v3/b/${BIN_ID_actions}`, data, {
//             headers: {
//                 'Content-Type': 'application/json',
//                 'X-Master-Key': API_KEY
//             }
//         });
//        } catch (error) {
//         console.error('Ошибка записи в файл actions.json:', error);
//         throw new Error(`Ошибка записи в файл actions.json.}`);
//     }
// }


// async function addActivity(activity) {
//     try {
//         const actionsData = await readActionsData();
        
//         // Генерируем уникальный id для активности
//         const activityId = `activity_${Date.now()}`;
        
//         // Валидация обязательных полей
//         if (!activity.name || !activity.skill_code || !activity.points) {
//             throw new Error('Отсутствуют обязательные поля (name, skill_code, points)');
//         }

//         // Добавляем новую активность, преобразуя points в число
//         actionsData.activities[activityId] = {
//             name: activity.name,
//             description: activity.description || '',
//             points: parseInt(activity.points) || 0,  // Преобразуем в число
//             skill_code: activity.skill_code
//         };

//         // Сохраняем обновленный файл
//         //await fs.writeFile(actionsFilePath, JSON.stringify(actionsData, null, 4));
//         await writeActionsData(actionsData);

//         return {
//             id: activityId,
//             ...actionsData.activities[activityId]
//         };
//     } catch (error) {
//         throw error;
//     }
// }

async function addActivity(activity, user) {
    try {
        const actionsData = await readActionsData(user); // Передаем логин пользователя

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
        await writeActionsData(actionsData, user); // Передаем логин пользователя

        return {
            id: activityId,
            ...actionsData.activities[activityId]
        };
    } catch (error) {
        throw error;
    }
}

// async function readActionsData(user) {
//     try {
//         const data = await fs.readFile(actionsFilePath(user), 'utf-8');
//         return JSON.parse(data);
//     } catch (error) {
//         console.error('Ошибка чтения файла actions.json:', error);
//         throw new Error(`Ошибка чтения файла: ${actionsFilePath(user)}`);
//     }
// }

// async function writeActionsData(data, user) {
//     try {
//         await fs.writeFile(actionsFilePath(user), JSON.stringify(data, null, 4));
//     } catch (error) {
//         console.error('Ошибка записи в файл actions.json:', error);
//         throw new Error(`Ошибка записи в файл: ${actionsFilePath(user)}`);
//     }
// }



// Бесплатный сервис специально для JSON

const axios = require('axios');
const BIN_ID_HISTORY = '6776e6f0ad19ca34f8e4af75';
const BIN_ID_actions = '6776ee69ad19ca34f8e4b236';
//const API_KEY = '$2a$10$Jn1kVlOFNV8oXzIJqx5xRemNZGyLAqGK5rerTT5lv43FPgN/qd.Si';
const API_KEY = '$2a$10$PVL7lQvItBvbwEtyKtmrquOMxG1W9AQd5Cb70p2qVYjW2ytMsGB8.';
//$2a$10$PVL7lQvItBvbwEtyKtmrquOMxG1W9AQd5Cb70p2qVYjW2ytMsGB8.


async function readHistoryData_jsonbin() {
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

async function writeHistoryData_jsonbin(data) {
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

// async function getUserData() {
//     try {
//         const historyData = await readHistoryData();
//         return historyData.user;
//     } catch (error) {
//         throw error;
//     }
// }



// async function getAllSkills() {
//     try {
//         const skillsData = await readSkillsData();
//         const historyData = await readHistoryData();
        
//         const enrichedSkills = skillsData.skills.map(skill => {
//             const skillHistory = historyData.skills[skill.code];
            
//             // Сортируем историю по timestamp в обратном порядке
//             const sortedHistory = [...skillHistory.history].sort((a, b) => {
//                 return new Date(b.timestamp) - new Date(a.timestamp);
//             });
//             return {
//                 ...skill,
//                 level: skillHistory.level || 0,
//                 currentPoints: skillHistory.currentPoints || 0,
//                 progress: skillHistory.progress || 0,
//                 achievements: skillHistory.achievements || [],
//                 history: sortedHistory
//             };
//         });
        
//         return enrichedSkills;
//     } catch (error) {
//         console.error('Ошибка при получении данных о навыках:', error);
//         throw error;
//     }
// }


async function getAllSkills(user) {
    try {
        // Читаем данные о навыках для конкретного пользователя
        const skillsData = await readSkillsData(user);
        const historyData = await readHistoryData(user);

        // Обогащаем навыки данными из истории
        const enrichedSkills = skillsData.skills.map(skill => {
            const skillHistory = historyData.skills[skill.code];

            // Сортируем историю по timestamp в обратном порядке
            const sortedHistory = [...skillHistory.history].sort((a, b) => {
                return new Date(b.timestamp) - new Date(a.timestamp);
            });

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


// async function getSkillData(skillCode) {
//     try {
//         const skillsData = await readSkillsData();
//         const historyData = await readHistoryData();
//         const skill = skillsData.skills.find(skill => skill.code === skillCode);
//         const skillHistory = historyData.skills[skillCode];
        
//         if (!skill || !skillHistory) {
//             throw new Error(`Навык с кодом ${skillCode} не найден`);
//         }

//         // Сортируем историю по timestamp в обратном порядке
//         const sortedHistory = [...skillHistory.history].sort((a, b) => {
//             return dateUtils.parseDate(b.timestamp) - dateUtils.parseDate(a.timestamp);
//         });
        
//         // Возвращаем навык со всеми данными и отсортированной историей
//         return { 
//             ...skill, 
//             level: skillHistory.level || 0,
//             currentPoints: skillHistory.currentPoints || 0,
//             progress: skillHistory.progress || 0,
//             achievements: skillHistory.achievements || [],
//             history: sortedHistory  // Возвращаем отсортированную историю
//         };
//     } catch (error) {
//         throw error;
//     }
// }


async function getSkillData(skillCode, user) {
    try {
        // Читаем данные о навыках и истории для конкретного пользователя
        // const skillsData = await readSkillsData(user);
        const skillsData = await readSkillsData(user);
        const historyData = await readHistoryData(user);

        // Находим навык по коду
        const skill = skillsData.skills.find(skill => skill.code === skillCode);
        const skillHistory = historyData.skills[skillCode];

        if (!skill || !skillHistory) {
            throw new Error(`Навык с кодом ${skillCode} не найден`);
        }

        // Сортируем историю по timestamp в обратном порядке
        const sortedHistory = [...skillHistory.history].sort((a, b) => {
            return dateUtils.parseDate(b.timestamp) - dateUtils.parseDate(a.timestamp);
        });

        // Возвращаем навык со всеми данными и отсортированной историей
        return {
            ...skill,
            level: skillHistory.level || 0,
            currentPoints: skillHistory.currentPoints || 0,
            progress: skillHistory.progress || 0,
            achievements: skillHistory.achievements || [],
            history: sortedHistory
        };
    } catch (error) {
        throw error;
    }
}


async function getSkillHistory(skillCode, user) {
    try {
        const historyData = await readHistoryData(user);
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

async function getActivities(user) {
    try {
        console.log('getActivities ' + user);

        const actionsData = await readActionsData(user);
        
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

async function addHistoryRecord(skillCode, record, user) {
    try {
        const historyData = await readHistoryData(user);
        if (!historyData.skills[skillCode]) {
            throw new Error(`Навык ${skillCode} не найден`);
        }
        const newRecord = {
            id: `act_${Date.now()}`, // Уникальный ID для записи
            ...record, // Используем переданные данные, включая timestamp
        };
        historyData.skills[skillCode].history.push(newRecord);
        await writeHistoryData(historyData, user);
        return newRecord;
    } catch (error) {
        throw error;
    }
}



async function addAchievement(skillCode, achievement, user) {
    try {
        const historyData = await readHistoryData(user);
        if (!historyData.skills[skillCode]) {
            throw new Error(`Навык ${skillCode} не найден`);
        }
        const newAchievement = {
            id: `ach_${Date.now()}`,
            ...achievement,
            dateEarned: new Date().toISOString()
        };
        historyData.skills[skillCode].achievements.push(newAchievement);
        await writeHistoryData(historyData, user);
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
    // getUserData,
    getAllSkills,
    getSkillData,
    getSkillHistory,
    getActivities,
    addHistoryRecord,
    addAchievement,
    addActivity,
    ensureUserFilesExist
};