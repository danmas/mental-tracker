const express = require('express');
const cors = require('cors'); 
const path = require('path');
const fs = require('fs');

const data = require('./public/data');
const game = require('./public/game');
const dateUtils = require('./public/dateUtils');


const app = express();
app.use(cors());
const port = process.env.PORT || 3050;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // Для обработки JSON в теле запроса

// --- GET запросы ---

app.get('/skills', async (req, res) => {
    try {
        const skills = await data.getAllSkills();
        res.json(skills);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/skills/:skillCode', async (req, res) => {
    try {
        const skillCode = req.params.skillCode;
        const skill = await data.getSkillData(skillCode);
        res.json(skill);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

app.get('/skills/:skillCode/history', async (req, res) => {
    try {
        const skillCode = req.params.skillCode;
        const history = await data.getSkillHistory(skillCode);
        res.json(history);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

app.get('/activities', async (req, res) => {
    try {
        const activities = await data.getActivities();
        res.json(activities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- POST запросы ---

app.post('/skills/:skillCode/history', async (req, res) => {
    try {
        const skillCode = req.params.skillCode;
        const { activityId, notes } = req.body;

        // Получаем информацию об активности из справочника
        const activities = await data.getActivities();
        const activity = activities[activityId];

        if (!activity) {
            throw new Error(`Активность с id ${activityId} не найдена`);
        }

        // Проверяем, соответствует ли активность навыку
        if (activity.skill_code !== skillCode) {
            throw new Error(`Активность ${activityId} не соответствует навыку ${skillCode}`);
        }

        // Преобразуем points в число
        const points = parseInt(activity.points) || 0;

        // Создаем запись для истории
        const record = {
            activityId,
            name: activity.name,
            description: activity.description,
            points: points, // Теперь здесь гарантированно число
            notes
        };

        const newRecord = await data.addHistoryRecord(skillCode, record);

        // Пересчитываем прогресс навыка
        const progressResult = await game.recalculateSkillProgress(skillCode);

        res.status(201).json({ 
            record: newRecord, 
            points: progressResult 
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


app.put('/skills/:skillCode/history/:historyId', async (req, res) => {
    try {
        const { skillCode, historyId } = req.params;
        const { activityId, notes, timestamp, points } = req.body;

        // Получаем текущую историю
        const historyData = await data.readHistoryData();
        const skillHistory = historyData.skills[skillCode];

        // Находим запись для обновления
        const recordIndex = skillHistory.history.findIndex(record => record.id === historyId);
        if (recordIndex === -1) {
            throw new Error('История не найдена');
        }

        // Обновляем запись
        skillHistory.history[recordIndex] = {
            ...skillHistory.history[recordIndex],
            activityId,
            points: parseInt(points),
            notes,
            timestamp
        };

        // Сохраняем обновленную историю
        await data.writeHistoryData(historyData);

        // Пересчитываем прогресс навыка
        const progressResult = await game.recalculateSkillProgress(skillCode);

        // Пересортируем историю после обновления даты
        skillHistory.history.sort((a, b) => {
            return dateUtils.parseDate(b.timestamp) - dateUtils.parseDate(a.timestamp);
        });

        res.json({ success: true, points: progressResult });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


app.post('/skills/:skillCode/achievements', async (req, res) => {
    try {
        const skillCode = req.params.skillCode;
        const achievement = req.body;
        const newAchievement = await data.addAchievement(skillCode, achievement);
        res.status(201).json(newAchievement);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/skills/:skillCode/points', async (req, res) => {
    try {
        const skillCode = req.params.skillCode;
        const points = req.body.points;
        const result = await game.addPoints(skillCode, points);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


// POST /activities - создание новой активности 
app.post('/activities', async (req, res) => {
    console.log("/activities");
    try {

        const activity = req.body;

        // Проверяем существование навыка
        const skills = await data.getAllSkills();
        const skillExists = skills.some(skill => skill.code === activity.skill_code);
        if (!skillExists) {
            throw new Error(`Навык с кодом ${activity.skill_code} не найден`);
        }

        // Добавляем новую активность
        const newActivity = await data.addActivity(activity);
        res.status(201).json(newActivity);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


// Манипуляция с историей

app.get('/history', async (req, res) => {
    try {
        const historyData = await data.readHistoryData();
        res.json(historyData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/history', async (req, res) => {
    try {
        const newHistory = req.body;
        await data.writeHistoryData(newHistory);
        res.json({ success: true, message: 'История успешно обновлена' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// УСТАРЕЛО! // Добавляем новый маршрут для history_editor.html
// app.get('/editor', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'history_editor.html'));
// });


// Добавьте эти endpoints в server.js

app.get('/actions', async (req, res) => {
    try {
        const actionsData = await data.readActionsData();
        res.json(actionsData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/actions', async (req, res) => {
    try {
        const newActions = req.body;
        // Добавим функцию writeActionsData в data.js
        await data.writeActionsData(newActions);
        // await fs.writeFile(actionsFilePath, JSON.stringify(newActions, null, 4));
        res.json({ success: true, message: 'Actions успешно обновлены' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/skills-raw', async (req, res) => {
    try {
        const skillsData = await fs.readFile(skillsFilePath, 'utf-8');
        res.json(JSON.parse(skillsData));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/skills-raw', async (req, res) => {
    try {
        const newSkills = req.body;
        await fs.writeFile(skillsFilePath, JSON.stringify(newSkills, null, 4));
        res.json({ success: true, message: 'Skills успешно обновлены' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/skills/:skillCode/history/:historyId', async (req, res) => {
    try {
        const { skillCode, historyId } = req.params;

        // Получаем текущую историю
        const historyData = await data.readHistoryData();
        const skillHistory = historyData.skills[skillCode];

        // Находим индекс записи для удаления
        const recordIndex = skillHistory.history.findIndex(record => record.id === historyId);
        if (recordIndex === -1) {
            throw new Error('История не найдена');
        }

        // Удаляем запись из истории
        skillHistory.history.splice(recordIndex, 1);

        // Сохраняем обновленную историю
        await data.writeHistoryData(historyData);

        // Пересчитываем прогресс навыка
        const progressResult = await game.recalculateSkillProgress(skillCode);

        res.json({ success: true, points: progressResult });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


app.get('/editor', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'json_editor.html'));
});

app.get('/ping', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});





app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});