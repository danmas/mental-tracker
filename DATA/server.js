const express = require('express');
const cors = require('cors'); 
const path = require('path');
// const fs = require('fs'); // fs usage is removed or conditional, this line can be removed if fs is no longer used.
// Duplicate require('express') and require('cors') were removed.

const data = require('./public/data'); // data.js is now user-aware
const game = require('./public/game'); // Needs to be user-aware if it interacts with data.js
const dateUtils = require('./public/dateUtils');

const app = express();
app.use(cors());
const port = process.env.PORT || 3050;

// Initialize database schema on startup (without user_id for general setup)
data.initializeDatabase().catch(err => {
    console.error('Failed to initialize database on startup:', err);
    // Potentially exit or mark the app as unhealthy if DB init is critical
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // Для обработки JSON в теле запроса

// Renamed from /ensureUserFilesExist
// curl -X POST -H "Content-Type: application/json" -d '{"userId": "test_user_1"}' http://localhost:3050/initializeUserData
app.post('/initializeUserData', async (req, res) => {
    try {
        const { userId } = req.body; 

        if (!userId) {
            // Changed error message to reflect userId
            return res.status(400).json({ error: 'userId is required in the request body' });
        }

        // Initialize database for the specific user (seeds data if new)
        await data.initializeDatabase(userId);
        res.json({ success: true, message: `Data initialized for user ${userId}` });
    } catch (error) {
        console.error(`Error initializing data for user ${req.body.userId}:`, error);
        res.status(500).json({ error: error.message });
    }
});


// --- GET запросы ---

app.get('/skills', async (req, res) => {
    try {
        const userId = req.query.user; // Keep 'user' as query param for consistency
        console.log('Getting skills for user:', userId);
        
        if (!userId) {
            return res.status(400).json({ error: 'User query parameter (user_id) is required' });
        }

        let skills = await data.getAllSkills(userId); // Pass userId
        console.log('Retrieved skills:', skills);

        const skills_array = Array.isArray(skills) ? skills : [];
        
        res.json({
            success: true,
            skills: skills_array
        });
    } catch (error) {
        console.error('Error getting skills:', error);
        res.status(500).json({ error: error.message });
    }
});


app.get('/skills/:skillCode', async (req, res) => {
    try {
        const skillCode = req.params.skillCode;
        const userId = req.query.user; 

        if (!userId) {
            return res.status(400).json({ error: 'User query parameter (user_id) is required' });
        }

        const skill = await data.getSkillData(userId, skillCode); // Pass userId
        res.status(200).json({ success: true, ...skill }); // Changed 201 to 200 for GET
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});


app.get('/skills/:skillCode/history', async (req, res) => {
    try {
        const skillCode = req.params.skillCode;
        const userId = req.query.user;

        if (!userId) {
            return res.status(400).json({ error: 'User query parameter (user_id) is required' });
        }

        console.log('get /skills/:skillCode/history for user '+userId);
        const history = await data.getSkillHistory(userId, skillCode); // Pass userId
        // History is an array, so spread might not be ideal if it's empty or not an object.
        // Assuming getSkillHistory returns the array directly.
        res.status(200).json({ success: true, history: history }); // Changed 201 to 200
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

app.get('/activities', async (req, res) => {
    try {
        const userId = req.query.user;

        if (!userId) {
            return res.status(400).json({ error: 'User query parameter (user_id) is required' });
        }

        const activities = await data.getActivities(userId); // Pass userId
        res.status(200).json({ success: true, activities: activities }); // Changed 201 to 200, wrap in activities key
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- POST запросы ---

app.post('/skills/:skillCode/history', async (req, res) => {
    try {
        const skillCode = req.params.skillCode; // This is skillName
        const { activityId, notes, timestamp } = req.body;
        const userId = req.query.user;

        if (!userId) {
            return res.status(400).json({ error: 'User query parameter (user_id) is required' });
        }
        console.log('post /skills/:skillCode/history for user '+userId);

        // getActivities now returns an object keyed by activity ID.
        const userActivities = await data.getActivities(userId); 
        const activity = userActivities[activityId];

        if (!activity) {
            return res.status(404).json({ error: `Активность с id ${activityId} не найдена для пользователя ${userId}` });
        }
        
        // activity.skill_code from previous version is likely skill ID.
        // The skillCode in path is skillName. Need to ensure this matches.
        // Let's get the skill by name to confirm its ID.
        const skill = await data.getSkillData(userId, skillCode);
        if (!skill) {
             return res.status(404).json({ error: `Навык ${skillCode} не найден для пользователя ${userId}` });
        }

        if (activity.skill_id !== skill.id) { // Compare IDs
            return res.status(400).json({ error: `Активность ${activityId} не соответствует навыку ${skillCode}` });
        }

        const points = parseInt(activity.points) || 0;

        const record = {
            // activityId, // This field is not in history table schema in pg-data.js
            type: 'activity_completion', // Example event_type
            name: activity.name, // Not directly in history schema, store in notes?
            description: activity.description, // Not directly in history schema, store in notes?
            points: points, // Not directly in history schema
            notes: notes || `Completed activity: ${activity.details || activity.action_type}`,
            timestamp // This is used by dateUtils.parseDate, but history table uses default event_date
        };

        // addHistoryRecord expects (userId, skillName, record)
        // record should contain data for the history event.
        const newRecord = await data.addHistoryRecord(userId, skillCode, record);

        // TODO: game.recalculateSkillProgress needs userId if it modifies data
        const progressResult = await game.recalculateSkillProgress(userId, skillCode);

        res.status(201).json({ 
            success: true,
            record: newRecord, 
            points: progressResult 
        });
    } catch (error) {
        console.error("Error in /skills/:skillCode/history:", error);
        res.status(400).json({ error: error.message });
    }
});

app.put('/skills/:skillCode/history/:historyId', async (req, res) => {
    try {
        const { skillCode, historyId } = req.params; // skillCode is skillName
        // req.body should contain the fields to update, e.g., { notes: "new notes", event_type: "practice" }
        const updatePayload = req.body; 
        const userId = req.query.user;

        if (!userId) {
            return res.status(400).json({ error: 'User query parameter (user_id) is required' });
        }
        if (!updatePayload || Object.keys(updatePayload).length === 0) {
            return res.status(400).json({ error: 'Request body with update data is required.' });
        }
        
        const updatedEvent = await data.updateHistoryEvent(userId, historyId, updatePayload);
        
        // Optionally, recalculate progress if relevant fields were changed
        // This depends on what fields in history affect progress.
        // For now, just returning the updated event.
        // const progressResult = await game.recalculateSkillProgress(userId, skillCode);

        res.json({ success: true, updatedEvent /*, points: progressResult */ });
    } catch (error) {
        console.error(`Error in PUT /skills/:skillCode/history/:historyId:`, error);
        if (error.message.includes("No valid fields")) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
});


app.post('/skills/:skillCode/achievements', async (req, res) => {
    try {
        const skillCode = req.params.skillCode; // This is skillName
        const achievement = req.body;
        const userId = req.query.user;

        if (!userId) {
            return res.status(400).json({ error: 'User query parameter (user_id) is required' });
        }
        const newAchievement = await data.addAchievement(userId, skillCode, achievement); // Pass userId
        res.status(201).json({ success: true, ...newAchievement });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/skills/:skillCode/points', async (req, res) => {
    try {
        const userId = req.query.user;

        if (!userId) {
            return res.status(400).json({ error: 'User query parameter (user_id) is required' });
        }

        const skillCode = req.params.skillCode; // This is skillName
        const points = req.body.points;
        // Assuming game.addPoints is updated to take userId as its first or last param
        const result = await game.addPoints(userId, skillCode, points); // Pass userId
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


app.patch('/activities/:activityId', async (req, res) => {
    try {
        const { activityId } = req.params;
        const userId = req.query.user;
        const updateData = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User query parameter (user_id) is required' });
        }

        const updatedActivity = await data.updateActivity(userId, activityId, updateData); // Pass userId

        if (updateData.isDone && updatedActivity.skill_id) { // Check skill_id from updatedActivity
             // Need skill name for game.addPoints if it expects name
            const skills = await data.readSkillsData(userId); // Fetch all skills for user
            const parentSkill = skills.find(s => s.id === updatedActivity.skill_id);

            if (parentSkill) {
                 // Assuming updatedActivity.points or a similar field exists after updateActivity maps it
                await game.addPoints(userId, parentSkill.name, updatedActivity.points || 0); // Pass userId and skillName
            } else {
                console.warn(`Skill with ID ${updatedActivity.skill_id} not found for user ${userId} when trying to add points for completed activity ${activityId}`);
            }
        }

        res.json(updatedActivity);
    } catch (error) {
        console.error('Error updating activity:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/activities', async (req, res) => {
    try {
        const userId = req.query.user;
        if (!userId) {
            return res.status(400).json({ error: 'User query parameter (user_id) is required' });
        }

        const activity = req.body; // activity should contain skill_code (skillName)
        
        const newActivity = await data.addActivity(userId, activity); // Pass userId

        // Assuming activity.skill_code is skillName and activity.points exists
        if (activity.isTask && !activity.dueDate && activity.skill_code && activity.points) {
            await game.addPoints(userId, activity.skill_code, activity.points); // Pass userId
        }

        res.status(201).json(newActivity);
    } catch (error) {
        console.error('Error creating activity:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/history', async (req, res) => {
    try {
        const userId = req.query.user;
        if (!userId) {
            return res.status(400).json({ error: 'User query parameter (user_id) is required' });
        }
        const historyData = await data.readHistoryData(userId); // Pass userId
        // readHistoryData returns an array.
        res.status(200).json({ success: true, history: historyData }); // Changed 201 to 200
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/history', async (req, res) => {
    try {
        const userId = req.query.user;
        if (!userId) {
            return res.status(400).json({ error: 'User query parameter (user_id) is required' });
        }
        const historyEntriesArray = req.body;
        if (!Array.isArray(historyEntriesArray)) {
            return res.status(400).json({ error: 'Request body must be an array of history entries.' });
        }

        // Ensure each entry has user_id, or add it. For simplicity, assuming entries might not have it
        // and writeAllHistoryForUser will handle setting it if it relies on addHistoryEvent.
        // However, my writeAllHistoryForUser expects entries to have user_id for validation.
        // So, client should ensure this, or we transform here.
        // For now, let's assume client sends correct entries.
        const results = await data.writeAllHistoryForUser(userId, historyEntriesArray);
        res.json({ success: true, message: `Successfully wrote ${results.length} history entries for user ${userId}.`, results });
    } catch (error) {
        console.error(`Error in POST /history for user ${req.query.user}:`, error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/actions', async (req, res) => {
    try {
        const userId = req.query.user;
        if (!userId) {
            return res.status(400).json({ error: 'User query parameter (user_id) is required' });
        }
        const actionsData = await data.readActionsData(userId); // Pass userId
        // readActionsData returns an array
        res.status(200).json({ success: true, actions: actionsData }); // Changed 201 to 200
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/actions', async (req, res) => {
    try {
        const userId = req.query.user;
        if (!userId) {
            return res.status(400).json({ error: 'User query parameter (user_id) is required' });
        }
        const actionsArray = req.body;
        if (!Array.isArray(actionsArray)) {
            return res.status(400).json({ error: 'Request body must be an array of action entries.' });
        }
        // Similar to /history, assuming client sends entries ready for processing by writeAllActionsForUser.
        const results = await data.writeAllActionsForUser(userId, actionsArray);
        res.json({ success: true, message: `Successfully wrote ${results.length} actions for user ${userId}.`, results });
    } catch (error) {
        console.error(`Error in POST /actions for user ${req.query.user}:`, error);
        res.status(500).json({ error: error.message });
    }
});

// Removed /skills-raw GET and POST endpoints as they are fs-based and incompatible.

app.delete('/skills/:skillCode/history/:historyId', async (req, res) => {
    try {
        const { skillCode, historyId } = req.params; // skillCode is skillName, may not be needed if historyId is globally unique for user
        const userId = req.query.user;

        if (!userId) {
            return res.status(400).json({ error: 'User query parameter (user_id) is required' });
        }
        
        const deleteResult = await data.deleteHistoryEvent(userId, historyId);

        if (deleteResult.rowCount === 0) {
            return res.status(404).json({ success: false, message: "History event not found or already deleted." });
        }
        
        // Optionally, recalculate progress if deletion affects it
        // const progressResult = await game.recalculateSkillProgress(userId, skillCode);
        // res.json({ success: true, message: 'History event deleted successfully.', points: progressResult });

        res.json({ success: true, message: 'History event deleted successfully.', deletedCount: deleteResult.rowCount });
    } catch (error) {
        console.error(`Error in DELETE /skills/:skillCode/history/:historyId:`, error);
        res.status(500).json({ error: error.message });
    }
});

// This endpoint seems duplicated, already defined above. I'll keep the one from above.
// app.post('/skills/:skillCode/points', async (req, res) => { ... });

app.get('/editor', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'json_editor.html'));
});

app.get('/ping', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

const server = app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});

module.exports = { app, server };