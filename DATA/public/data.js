const { createStorageAdapter, STORAGE_TYPE } = require('../storage-config');
const dateUtils = require('./dateUtils'); // Kept, as it's used for date sorting

// Создаем адаптер хранилища на основе конфигурации
const storageAdapter = createStorageAdapter();
console.log(`Using storage type: ${STORAGE_TYPE}`);

// No longer need fs, path, axios for file/JSONbin operations

// --- Database Initialization ---
async function initializeDatabase(user_id = null) { // Added user_id parameter
    try {
        await storageAdapter.connect();
        await storageAdapter.createSchema();
        await storageAdapter.createTables(); // Tables now have user_id column
        
        if (user_id) { // Only seed if user_id is provided
            // Check if this user already has skills to prevent duplicate seeding
            const existingSkills = await storageAdapter.readData('skills', {}, user_id);
            if (!existingSkills || existingSkills.length === 0) {
                console.log(`Seeding initial skills for user ${user_id}...`);
                await storageAdapter.writeData('skills', { user_id, name: "Рисование", description: "Общие навыки рисования", complexity: 5, familiarity: 10 });
                await storageAdapter.writeData('skills', { user_id, name: "Музыка Практика", description: "Практика на музыкальном инструменте", complexity: 7, familiarity: 20 });
            }
        }
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error; 
    }
}

// --- Data Reading Functions ---

// Reads skills for a specific user.
async function readSkillsData(user_id) {
    if (!user_id) throw new Error("user_id is required to read skills data.");
    try {
        return await storageAdapter.readData('skills', {}, user_id);
    } catch (error) {
        console.error(`Ошибка чтения данных навыков из БД для пользователя ${user_id}:`, error);
        throw error;
    }
}

// Reads history for a specific user.
async function readHistoryData(user_id) {
    if (!user_id) throw new Error("user_id is required to read history data.");
    try {
        return await storageAdapter.readData('history', {}, user_id);
    } catch (error) {
        console.error(`Ошибка чтения истории из БД для пользователя ${user_id}:`, error);
        throw error;
    }
}

// Reads actions for a specific user.
async function readActionsData(user_id) {
    if (!user_id) throw new Error("user_id is required to read actions data.");
    try {
        return await storageAdapter.readData('actions', {}, user_id);
    } catch (error) {
        console.error(`Ошибка чтения действий из БД для пользователя ${user_id}:`, error);
        throw error;
    }
}

// --- Data Writing Functions ---

// Writes/updates a single skill for a specific user.
async function writeSkillData(user_id, skillData) {
    if (!user_id) throw new Error("user_id is required to write skill data.");
    try {
        if (!skillData.name) {
            throw new Error('Skill name is required.');
        }
        const dataToWrite = {
            user_id: user_id, // Add user_id
            name: skillData.name,
            description: skillData.description || null,
            complexity: skillData.complexity || 5,
            familiarity: skillData.familiarity || 0,
            ...(skillData.id && { id: skillData.id })
        };
        return await storageAdapter.writeData('skills', dataToWrite);
    } catch (error) {
        console.error(`Ошибка записи навыка в БД для пользователя ${user_id}:`, error);
        throw error;
    }
}

// Adds a new history record for a specific user.
async function addHistoryEvent(user_id, recordData) {
    if (!user_id) throw new Error("user_id is required to add history event.");
    try {
        if (!recordData.skill_id || !recordData.event_type) {
            throw new Error('skill_id and event_type are required for history records.');
        }
        const dataToWrite = {
            ...recordData,
            user_id: user_id // Add user_id
        };
        return await storageAdapter.writeData('history', dataToWrite);
    } catch (error) {
        console.error(`Ошибка записи события истории в БД для пользователя ${user_id}:`, error);
        throw error;
    }
}

// Adds a new action for a specific user.
async function addNewAction(user_id, actionData) {
    if (!user_id) throw new Error("user_id is required to add new action.");
    try {
        if (!actionData.skill_id || !actionData.action_type) {
            throw new Error('skill_id and action_type are required for actions.');
        }
        const dataToWrite = {
            user_id: user_id, // Add user_id
            skill_id: actionData.skill_id,
            action_type: actionData.action_type,
            details: actionData.details || (actionData.name ? `Name: ${actionData.name}, Description: ${actionData.description || ''}` : ''),
            duration_minutes: actionData.duration_minutes || (actionData.points ? parseInt(actionData.points) : null)
        };
        return await storageAdapter.writeData('actions', dataToWrite);
    } catch (error) {
        console.error(`Ошибка записи действия в БД для пользователя ${user_id}:`, error);
        throw error;
    }
}


// --- Complex Data Retrieval and Manipulation (USER-SPECIFIC) ---

async function getAllSkills(user_id) {
    if (!user_id) throw new Error("user_id is required for getAllSkills.");
    try {
        const allSkills = await readSkillsData(user_id);
        const allHistory = await readHistoryData(user_id);

        if (!allSkills || !Array.isArray(allSkills)) {
            console.warn(`Некорректные данные навыков из БД для пользователя ${user_id}:`, allSkills);
            return [];
        }

        const enrichedSkills = allSkills.map(skill => {
            const skillHistoryEvents = allHistory.filter(h => h.skill_id === skill.id && h.user_id === user_id);
            const sortedHistory = skillHistoryEvents.sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
            
            return {
                ...skill,
                code: skill.name,
                history: sortedHistory,
                level: skill.familiarity / 10,
                currentPoints: 0, 
                progress: 0,      
                achievements: [] 
            };
        });

        console.log(`Enriched skills (from DB) for user ${user_id}:`, enrichedSkills);
        return enrichedSkills;
    } catch (error) {
        console.error(`Ошибка при получении данных о навыках из БД для пользователя ${user_id}:`, error);
        return [];
    }
}

async function getSkillData(user_id, skillName) {
    if (!user_id) throw new Error("user_id is required for getSkillData.");
    try {
        const skills = await storageAdapter.readData('skills', { name: skillName }, user_id);
        if (!skills || skills.length === 0) {
            throw new Error(`Навык с именем ${skillName} не найден в БД для пользователя ${user_id}`);
        }
        const skill = skills[0];

        const allHistoryForUser = await readHistoryData(user_id);
        const skillHistoryEvents = allHistoryForUser.filter(h => h.skill_id === skill.id);
        const sortedHistory = skillHistoryEvents.sort((a, b) => new Date(b.event_date) - new Date(a.event_date));

        return {
            ...skill,
            code: skill.name,
            history: sortedHistory,
            level: skill.familiarity / 10,
            currentPoints: 0,
            progress: 0,
            achievements: []
        };
    } catch (error) {
        console.error(`Ошибка при получении данных для навыка ${skillName} из БД для пользователя ${user_id}:`, error);
        throw error;
    }
}

async function getSkillHistory(user_id, skillName) {
    if (!user_id) throw new Error("user_id is required for getSkillHistory.");
    try {
        const skills = await storageAdapter.readData('skills', { name: skillName }, user_id);
        if (!skills || skills.length === 0) {
            throw new Error(`Навык с именем ${skillName} не найден в БД для пользователя ${user_id} для получения истории`);
        }
        const skill = skills[0];

        const historyEvents = await storageAdapter.readData('history', { skill_id: skill.id }, user_id);
        const sortedHistory = historyEvents.sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
        
        return sortedHistory;
    } catch (error) {
        console.error(`Ошибка при получении истории для навыка ${skillName} из БД для пользователя ${user_id}:`, error);
        throw error;
    }
}

async function getActivities(user_id) {
    if (!user_id) throw new Error("user_id is required for getActivities.");
    try {
        console.log(`getActivities from DB for user ${user_id}`);
        const allActions = await readActionsData(user_id);
        const activitiesObject = {};
        allActions.forEach(action => {
            activitiesObject[action.id] = {
                ...action,
                points: action.duration_minutes || 0,
                skill_code: action.skill_id 
            };
        });
        
        return activitiesObject;
    } catch (error) {
        console.error(`Ошибка при получении активностей из БД для пользователя ${user_id}:`, error);
        throw error;
    }
}

// --- Data Modification Functions (USER-SPECIFIC) ---

async function updateActivity(user_id, activityId, updateData) {
    if (!user_id) throw new Error("user_id is required for updateActivity.");
    try {
        const actions = await storageAdapter.readData('actions', { id: activityId }, user_id);
        if (!actions || actions.length === 0) {
            throw new Error(`Активность с ID ${activityId} не найдена в БД для пользователя ${user_id}`);
        }
        const existingAction = actions[0];

        const dataToUpdate = {
            id: activityId, // Crucial for update
            user_id: user_id, // Ensure user_id is part of the update payload for storageAdapter.writeData
            skill_id: updateData.skill_id || existingAction.skill_id,
            action_type: updateData.action_type || existingAction.action_type,
            details: updateData.details || existingAction.details,
            duration_minutes: updateData.duration_minutes !== undefined ? updateData.duration_minutes : existingAction.duration_minutes,
            ...(updateData.isDone && !existingAction.completed_at && { completed_at: new Date().toISOString() }),
        };
        
        for (const key in dataToUpdate) {
            if (dataToUpdate[key] === undefined && key !== 'duration_minutes') { // duration_minutes can be null
                delete dataToUpdate[key];
            }
        }
        return await storageAdapter.writeData('actions', dataToUpdate);
    } catch (error) {
        console.error(`Error updating activity in DB for user ${user_id}:`, error);
        throw error;
    }
}

async function addHistoryRecord(user_id, skillName, record) {
    if (!user_id) throw new Error("user_id is required for addHistoryRecord.");
    try {
        const skills = await storageAdapter.readData('skills', { name: skillName }, user_id);
        if (!skills || skills.length === 0) {
            throw new Error(`Навык с именем ${skillName} не найден в БД для пользователя ${user_id} для добавления записи истории.`);
        }
        const skill_id = skills[0].id;

        const historyEventData = {
            // user_id will be added by addHistoryEvent
            skill_id: skill_id,
            event_type: record.type || 'general_update',
            notes: record.notes || (record.isTask ? `Task: ${record.name || 'Untitled'}` : ''),
        };
        if (record.isTask) {
            historyEventData.notes += ` | Due: ${record.dueDate || 'N/A'} | Completed: ${record.completedDate || 'N/A'}`;
        }
        return await addHistoryEvent(user_id, historyEventData);
    } catch (error) {
        console.error(`Ошибка добавления записи истории для навыка ${skillName} в БД для пользователя ${user_id}:`, error);
        throw error;
    }
}

async function addAchievement(user_id, skillName, achievement) {
    if (!user_id) throw new Error("user_id is required for addAchievement.");
    try {
        const skills = await storageAdapter.readData('skills', { name: skillName }, user_id);
        if (!skills || skills.length === 0) {
            throw new Error(`Навык ${skillName} не найден в БД для пользователя ${user_id} для добавления достижения.`);
        }
        const skill_id = skills[0].id;

        const achievementText = achievement.name || achievement.description || 'Unnamed Achievement';
        const historyEventData = {
            // user_id will be added by addHistoryEvent
            skill_id: skill_id,
            event_type: 'achievement',
            notes: `Achievement: ${achievementText} (Earned: ${dateUtils.formatDate(new Date())})`
        };
        return await addHistoryEvent(user_id, historyEventData);
    } catch (error) {
        console.error(`Ошибка добавления достижения для навыка ${skillName} в БД для пользователя ${user_id}:`, error);
        throw error;
    }
}

async function addActivity(user_id, activityData) {
    if (!user_id) throw new Error("user_id is required for addActivity.");
    try {
        if (!activityData.skill_code) {
            throw new Error('skill_code (skill name) is required to add an activity.');
        }
        const skills = await storageAdapter.readData('skills', { name: activityData.skill_code }, user_id);
        if (!skills || skills.length === 0) {
            throw new Error(`Навык с именем ${activityData.skill_code} не найден для пользователя ${user_id} для добавления активности.`);
        }
        const skill_id = skills[0].id;

        let details = activityData.description || '';
        if (activityData.dueDate) details += ` | Due: ${activityData.dueDate}`;
        if (activityData.isTask) details = `Task: ${activityData.name || 'Untitled'}. ` + details;

        const newAction = {
            // user_id will be added by addNewAction
            skill_id: skill_id,
            action_type: activityData.isTask ? 'task' : (activityData.type || 'general_action'),
            details: details,
            duration_minutes: parseInt(activityData.points) || null,
        };
        return await addNewAction(user_id, newAction);
    } catch (error) {
        console.error(`Ошибка добавления активности в БД для пользователя ${user_id}:`, error);
        throw error;
    }
}

module.exports = {
    initializeDatabase,
    readSkillsData,
    readActionsData,
    readHistoryData,
    writeSkillData,
    addHistoryEvent,
    addNewAction,
    updateActivity,
    getAllSkills,
    getSkillData,
    getSkillHistory,
    getActivities,
    addHistoryRecord,
    addAchievement,
    addActivity,

    // --- New functions for problematic endpoints ---

    // Updates a specific history event for a user.
    async updateHistoryEvent(user_id, historyId, updatePayload) {
        if (!user_id) throw new Error("user_id is required to update history event.");
        if (!historyId) throw new Error("historyId is required to update history event.");
        if (!updatePayload || Object.keys(updatePayload).length === 0) {
            throw new Error("updatePayload is required and cannot be empty.");
        }

        // Ensure only valid fields are passed for update.
        // Example: { notes: "new notes", event_type: "updated_event" }
        // event_date could also be updatable if needed.
        const validUpdateFields = ['notes', 'event_type', 'event_date', 'skill_id'];
        const dataToUpdate = { id: historyId, user_id };

        for (const field of validUpdateFields) {
            if (updatePayload.hasOwnProperty(field)) {
                dataToUpdate[field] = updatePayload[field];
            }
        }
        
        if (Object.keys(dataToUpdate).length <= 2) { // only id and user_id
            throw new Error("No valid fields provided for history update.");
        }

        try {
            return await storageAdapter.writeData('history', dataToUpdate);
        } catch (error) {
            console.error(`Ошибка обновления события истории ${historyId} для пользователя ${user_id}:`, error);
            throw error;
        }
    },

    // Deletes a specific history event for a user.
    async deleteHistoryEvent(user_id, historyId) {
        if (!user_id) throw new Error("user_id is required to delete history event.");
        if (!historyId) throw new Error("historyId is required to delete history event.");
        try {
            return await storageAdapter.deleteData('history', user_id, { id: historyId });
        } catch (error) {
            console.error(`Ошибка удаления события истории ${historyId} для пользователя ${user_id}:`, error);
            throw error;
        }
    },

    // Replaces all history for a given user with the new set.
    // historyEntriesArray should contain objects that are valid for addHistoryEvent (including user_id, skill_id).
    async writeAllHistoryForUser(user_id, historyEntriesArray) {
        if (!user_id) throw new Error("user_id is required to write all history.");
        if (!Array.isArray(historyEntriesArray)) throw new Error("historyEntriesArray must be an array.");

        try {
            // Delete all existing history for the user
            await storageAdapter.deleteData('history', user_id, {}); // Empty criteria deletes all for this user_id

            const results = [];
            for (const entry of historyEntriesArray) {
                if (entry.user_id !== user_id) {
                    console.warn(`Skipping history entry for user ${entry.user_id} when writing all for user ${user_id}`);
                    continue;
                }
                // Assuming entry is a valid payload for addHistoryEvent (skill_id, event_type, notes)
                // addHistoryEvent already adds user_id to the object it passes to storageAdapter.writeData
                results.push(await addHistoryEvent(user_id, entry));
            }
            console.log(`Successfully wrote ${results.length} history entries for user ${user_id}.`);
            return results;
        } catch (error) {
            console.error(`Ошибка полной записи истории для пользователя ${user_id}:`, error);
            throw error;
        }
    },

    // Replaces all actions for a given user with the new set.
    // actionsArray should contain objects that are valid for addNewAction (including user_id, skill_id).
    async writeAllActionsForUser(user_id, actionsArray) {
        if (!user_id) throw new Error("user_id is required to write all actions.");
        if (!Array.isArray(actionsArray)) throw new Error("actionsArray must be an array.");

        try {
            // Delete all existing actions for the user
            await storageAdapter.deleteData('actions', user_id, {}); // Empty criteria deletes all for this user_id

            const results = [];
            for (const entry of actionsArray) {
                 if (entry.user_id !== user_id) {
                    console.warn(`Skipping action entry for user ${entry.user_id} when writing all for user ${user_id}`);
                    continue;
                }
                // Assuming entry is a valid payload for addNewAction (skill_id, action_type, details, etc.)
                // addNewAction already adds user_id
                results.push(await addNewAction(user_id, entry));
            }
            console.log(`Successfully wrote ${results.length} actions for user ${user_id}.`);
            return results;
        } catch (error) {
            console.error(`Ошибка полной записи действий для пользователя ${user_id}:`, error);
            throw error;
        }
    },
};