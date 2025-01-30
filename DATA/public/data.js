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
const _dir = __dirname+'/../../../MYDATA';
console.log(_dir);
const skillsFilePath = (user) => path.join(_dir, `skills_${user}.json`);
const actionsFilePath = (user) => path.join(_dir, `actions_${user}.json`);
const historyFilePath = (user) => path.join(_dir, `history_${user}.json`);

// --- Чтение данных из JSON файлов ---

async function ensureUserFilesExist(user) {
    const skillsFile = skillsFilePath(user);
    const historyFile = historyFilePath(user);
    const actionsFile = actionsFilePath(user);

    try {
        await fs.access(skillsFile);
    } catch {
        await fs.writeFile(skillsFile, JSON.stringify({ skills: 
                [
                    {
                        "name": "Рисование",
                        "code": "drawing"
                    },
                    {
                        "name": "Музыка Практика",
                        "code": "music"
                    }
        ] }, null, 4));
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


// async function addActivity(activity, user) {
//     try {
//         const actionsData = await readActionsData(user); // Передаем логин пользователя

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
//         await writeActionsData(actionsData, user); // Передаем логин пользователя

//         return {
//             id: activityId,
//             ...actionsData.activities[activityId]
//         };
//     } catch (error) {
//         throw error;
//     }
// }



// Бесплатный сервис специально для JSON
async function addActivity(activity, user) {
    try {
        const actionsData = await readActionsData(user);
        const activityId = `activity_${Date.now()}`;

        if (!activity.name || !activity.skill_code || !activity.points) {
            throw new Error('Отсутствуют обязательные поля (name, skill_code, points)');
        }

        actionsData.activities[activityId] = {
            name: activity.name,
            description: activity.description || '',
            points: parseInt(activity.points) || 0,
            skill_code: activity.skill_code,
            dueDate: activity.dueDate || null,    // Новое поле: срок выполнения
            isDone: false,                        // Новое поле: статус выполнения
            completedDate: null,                  // Новое поле: дата выполнения
            isTask: true                          // Новое поле: признак задачи
        };

        await writeActionsData(actionsData, user);

        return {
            id: activityId,
            ...actionsData.activities[activityId]
        };
    } catch (error) {
        throw error;
    }
}



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


// async function getAllSkills(user) {
//     try {
//         // Читаем данные о навыках для конкретного пользователя
//         const skillsData = await readSkillsData(user);
//         const historyData = await readHistoryData(user);

//         // Обогащаем навыки данными из истории
//         //if(historyData != null) {
//             const enrichedSkills = skillsData.skills.map(skill => {
//             const skillHistory = historyData.skills[skill.code];

//             if(skillHistory != null) {
//                 // Сортируем историю по timestamp в обратном порядке
//                 const sortedHistory = [...skillHistory.history].sort((a, b) => {
//                     return new Date(b.timestamp) - new Date(a.timestamp);
//                 });
//             }
//         //}

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

// async function getAllSkills(user) {
//     try {
//         // Читаем данные о навыках для конкретного пользователя
//         const skillsData = await readSkillsData(user);
//         const historyData = await readHistoryData(user);

//         // Обогащаем навыки данными из истории
//         const enrichedSkills = skillsData.skills.map(skill => {
//             let skillHistory = historyData.skills[skill.code];

//             // Проверяем, существует ли skillHistory
//             if (!skillHistory) {
//                 skillHistory = {
//                     level: 0,
//                     currentPoints: 0,
//                     progress: 0,
//                     achievements: [],
//                     history: []
//                 };
//             }

//             // Сортируем историю по timestamp в обратном порядке
//             const sortedHistory = [...skillHistory.history].sort((a, b) => {
//                 return dateUtils.parseDate(b.timestamp) - dateUtils.parseDate(a.timestamp);
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

        // Проверяем наличие skills в данных
        if (!skillsData || !skillsData.skills || !Array.isArray(skillsData.skills)) {
            console.warn('Некорректные данные навыков:', skillsData);
            return [];
        }

        // Проверяем наличие истории
        if (!historyData || !historyData.skills) {
            console.warn('Некорректные данные истории:', historyData);
            historyData = { skills: {} };
        }

        // Обогащаем навыки данными из истории
        const enrichedSkills = skillsData.skills.map(skill => {
            let skillHistory = historyData.skills[skill.code] || {
                level: 0,
                currentPoints: 0,
                progress: 0,
                achievements: [],
                history: []
            };

            // Проверяем наличие истории перед сортировкой
            const sortedHistory = Array.isArray(skillHistory.history) 
                ? [...skillHistory.history].sort((a, b) => {
                    return dateUtils.parseDate(b.timestamp) - dateUtils.parseDate(a.timestamp);
                  })
                : [];

            return {
                ...skill,
                level: skillHistory.level || 0,
                currentPoints: skillHistory.currentPoints || 0,
                progress: skillHistory.progress || 0,
                achievements: skillHistory.achievements || [],
                history: sortedHistory
            };
        });

        console.log('Enriched skills:', enrichedSkills); // Для отладки
        return enrichedSkills;
    } catch (error) {
        console.error('Ошибка при получении данных о навыках:', error);
        return []; // Возвращаем пустой массив вместо выброса ошибки
    }
}


// async function getSkillData(skillCode, user) {
//     try {
//         // Читаем данные о навыках и истории для конкретного пользователя
//         // const skillsData = await readSkillsData(user);
//         const skillsData = await readSkillsData(user);
//         const historyData = await readHistoryData(user);

//         // Находим навык по коду
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
//             history: sortedHistory
//         };
//     } catch (error) {
//         throw error;
//     }
// }
async function getSkillData(skillCode, user) {
    try {
        // Читаем данные о навыках и истории для конкретного пользователя
        const skillsData = await readSkillsData(user);
        const historyData = await readHistoryData(user);

        // Находим навык по коду
        const skill = skillsData.skills.find(skill => skill.code === skillCode);

        if (!skill) {
            throw new Error(`Навык с кодом ${skillCode} не найден`);
        }

        let skillHistory = historyData.skills[skillCode];

        // Проверяем, существует ли skillHistory
        if (!skillHistory) {
            skillHistory = {
                level: 0,
                currentPoints: 0,
                progress: 0,
                achievements: [],
                history: []
            };
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
// Добавляем новую функцию для обновления активности
// async function updateActivity(activityId, updateData, user) {
//     try {
//         const actionsData = await readActionsData(user);
//         const activity = actionsData.activities[activityId];

//         if (!activity) {
//             throw new Error(`Активность с ID ${activityId} не найдена`);
//         }

//         // Обновляем поля активности
//         actionsData.activities[activityId] = {
//             ...activity,
//             ...updateData,
//             // Если задача помечена как выполненная и у неё не было даты выполнения
//             completedDate: updateData.isDone && !activity.completedDate ? 
//                 new Date().toISOString() : 
//                 activity.completedDate
//         };

//         await writeActionsData(actionsData, user);

//         return actionsData.activities[activityId];
//     } catch (error) {
//         console.error('Error updating activity:', error);
//         throw error;
//     }
// }
// Добавляем новую функцию для обновления активности
// async function updateActivity(activityId, updateData, user) {
//     try {
//         const actionsData = await readActionsData(user);
//         const activity = actionsData.activities[activityId];

//         if (!activity) {
//             throw new Error(`Активность с ID ${activityId} не найдена`);
//         }

//         // Обновляем поля активности
//         actionsData.activities[activityId] = {
//             ...activity,
//             ...updateData,
//             // Если задача помечена как выполненная и у неё не было даты выполнения
//             completedDate: updateData.isDone && !activity.completedDate ? 
//                 new Date().toISOString() : 
//                 activity.completedDate
//         };

//         await writeActionsData(actionsData, user);

//         return actionsData.activities[activityId];
//     } catch (error) {
//         console.error('Error updating activity:', error);
//         throw error;
//     }
// }
async function updateActivity(activityId, updateData, user) {
    try {
        const actionsData = await readActionsData(user);
        const activity = actionsData.activities[activityId];

        if (!activity) {
            throw new Error(`Активность с ID ${activityId} не найдена`);
        }

        // Обновляем поля активности
        actionsData.activities[activityId] = {
            ...activity,
            ...updateData,
            // Если задача помечена как выполненная и у неё не было даты выполнения
            completedDate: updateData.isDone && !activity.completedDate ? 
                new Date().toISOString() : 
                activity.completedDate
        };

        await writeActionsData(actionsData, user);

        return actionsData.activities[activityId];
    } catch (error) {
        console.error('Error updating activity:', error);
        throw error;
    }
}



// async function addHistoryRecord(skillCode, record, user) {
//     try {
//         const historyData = await readHistoryData(user);

//         // Проверяем, существует ли структура для навыка
//         if (!historyData.skills[skillCode]) {
//             historyData.skills[skillCode] = {
//                 level: 0,
//                 currentPoints: 0,
//                 progress: 0,
//                 achievements: [],
//                 history: []
//             };
//         }

//         const newRecord = {
//             id: `act_${Date.now()}`, // Уникальный ID для записи
//             ...record, // Используем переданные данные, включая timestamp
//         };
//         historyData.skills[skillCode].history.push(newRecord);
//         await writeHistoryData(historyData, user);
//         return newRecord;
//     } catch (error) {
//         throw error;
//     }
// }
// Обновляем существующую функцию addHistoryRecord
// async function addHistoryRecord(skillCode, record, user) {
//     try {
//         const historyData = await readHistoryData(user);

//         // Проверяем, существует ли структура для навыка
//         if (!historyData.skills[skillCode]) {
//             historyData.skills[skillCode] = {
//                 level: 0,
//                 currentPoints: 0,
//                 progress: 0,
//                 achievements: [],
//                 history: []
//             };
//         }

//         const newRecord = {
//             id: `act_${Date.now()}`,
//             ...record,
//             // Обработка полей задачи
//             isDone: record.isDone || false,
//             completedDate: record.completedDate || null,
//             dueDate: record.dueDate || null,
//             isTask: record.isTask || false
//         };

//         historyData.skills[skillCode].history.push(newRecord);
//         await writeHistoryData(historyData, user);
//         return newRecord;
//     } catch (error) {
//         throw error;
//     }
// }
// Обновляем существующую функцию addHistoryRecord
// async function addHistoryRecord(skillCode, record, user) {
//     try {
//         const historyData = await readHistoryData(user);

//         // Проверяем, существует ли структура для навыка
//         if (!historyData.skills[skillCode]) {
//             historyData.skills[skillCode] = {
//                 level: 0,
//                 currentPoints: 0,
//                 progress: 0,
//                 achievements: [],
//                 history: []
//             };
//         }

//         const newRecord = {
//             id: `act_${Date.now()}`,
//             ...record,
//             // Обработка полей задачи
//             isDone: record.isDone || false,
//             completedDate: record.completedDate || null,
//             dueDate: record.dueDate || null,
//             isTask: record.isTask || false
//         };

//         historyData.skills[skillCode].history.push(newRecord);
//         await writeHistoryData(historyData, user);
//         return newRecord;
//     } catch (error) {
//         throw error;
//     }
// }
async function addHistoryRecord(skillCode, record, user) {
    try {
        const historyData = await readHistoryData(user);

        // Проверяем, существует ли структура для навыка
        if (!historyData.skills[skillCode]) {
            historyData.skills[skillCode] = {
                level: 0,
                currentPoints: 0,
                progress: 0,
                achievements: [],
                history: []
            };
        }

        const newRecord = {
            id: `act_${Date.now()}`,
            ...record,
            // Обработка полей задачи
            isDone: record.isDone || false,
            completedDate: record.completedDate || null,
            dueDate: record.dueDate || null,
            isTask: record.isTask || false
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
    updateActivity,
    getAllSkills,
    getSkillData,
    getSkillHistory,
    getActivities,
    addHistoryRecord,
    addAchievement,
    addActivity,
    ensureUserFilesExist
};