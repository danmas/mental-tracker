const request = require('supertest');
const { app, server } = require('../server');
const data = require('../public/data');
const sqliteData = require('../sqlite-data'); // Прямой импорт для очистки данных
const fs = require('fs');
const path = require('path');

describe('API Contract Tests - CRITICAL', () => {
    const testUserId = 'api_test_user';
    const testDbPath = path.join(__dirname, 'test-api-cortex.db');
    
    let testSkillId;
    let testHistoryId;
    let testActivityId;

    beforeAll(async () => {
        // Подменяем путь к БД для тестов
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
        
        // Инициализируем тестовую БД
        sqliteData.dbPath = testDbPath;
        await data.initializeDatabase();
        await data.initializeDatabase(testUserId);
    });

    afterAll(async () => {
        // Закрываем соединение с БД
        await sqliteData.close();
        
        // Закрываем сервер
        if (server && server.close) {
            await new Promise((resolve) => {
                server.close(resolve);
            });
        }
        
        // Ждем немного перед удалением файла
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Удаляем тестовую БД
        if (fs.existsSync(testDbPath)) {
            try {
                fs.unlinkSync(testDbPath);
            } catch (error) {
                console.warn('Could not delete test DB file:', error.message);
            }
        }
    });

    beforeEach(async () => {
        // Очищаем данные перед каждым тестом
        await sqliteData.deleteData('history', testUserId, {});
        await sqliteData.deleteData('actions', testUserId, {});
        await sqliteData.deleteData('skills', testUserId, {});
        
        // Создаем тестовый навык для связанных тестов
        const testSkill = await sqliteData.writeData('skills', {
            user_id: testUserId,
            name: 'API Test Skill',
            complexity: 5,
            familiarity: 25,
            description: 'Test skill for API tests'
        });
        testSkillId = testSkill.id;
    });

    describe('POST /initializeUserData', () => {
        it('should initialize user data successfully', async () => {
            const response = await request(app)
                .post('/initializeUserData')
                .send({ userId: 'new_test_user' })
                .expect(200);

            expect(response.body).toMatchObject({
                success: true,
                message: expect.stringContaining('Data initialized for user new_test_user')
            });
        });

        it('should return 400 if userId is missing', async () => {
            const response = await request(app)
                .post('/initializeUserData')
                .send({})
                .expect(400);

            expect(response.body).toMatchObject({
                error: 'userId is required in the request body'
            });
        });

        it('should return 400 for null userId', async () => {
            const response = await request(app)
                .post('/initializeUserData')
                .send({ userId: null })
                .expect(400);

            expect(response.body).toMatchObject({
                error: 'userId is required in the request body'
            });
        });
    });

    describe('GET /skills', () => {
        it('should return all skills for valid user', async () => {
            const response = await request(app)
                .get('/skills')
                .query({ user: testUserId })
                .expect(200);

            expect(response.body).toMatchObject({
                success: true,
                skills: expect.any(Array)
            });

            expect(response.body.skills).toHaveLength(1);
            expect(response.body.skills[0]).toMatchObject({
                id: expect.any(Number),
                user_id: testUserId,
                name: 'API Test Skill',
                complexity: 5,
                familiarity: 25
            });
        });

        it('should return 400 if user parameter is missing', async () => {
            const response = await request(app)
                .get('/skills')
                .expect(400);

            expect(response.body).toMatchObject({
                error: 'User query parameter (user_id) is required'
            });
        });

        it('should return empty array for non-existent user', async () => {
            const response = await request(app)
                .get('/skills')
                .query({ user: 'nonexistent_user' })
                .expect(200);

            expect(response.body).toMatchObject({
                success: true,
                skills: []
            });
        });
    });

    describe('GET /skills/:skillCode', () => {
        it('should return specific skill data', async () => {
            const response = await request(app)
                .get('/skills/API Test Skill')
                .query({ user: testUserId })
                .expect(200);

            expect(response.body).toMatchObject({
                success: true,
                id: expect.any(Number),
                name: 'API Test Skill',
                complexity: 5,
                familiarity: 25,
                user_id: testUserId
            });
        });

        it('should return 400 if user parameter is missing', async () => {
            const response = await request(app)
                .get('/skills/API Test Skill')
                .expect(400);

            expect(response.body).toMatchObject({
                error: 'User query parameter (user_id) is required'
            });
        });

        it('should return 404 for non-existent skill', async () => {
            const response = await request(app)
                .get('/skills/NonExistent Skill')
                .query({ user: testUserId })
                .expect(404);

            expect(response.body).toMatchObject({
                error: expect.any(String)
            });
        });
    });

    describe('GET /skills/:skillCode/history', () => {
        beforeEach(async () => {
            // Создаем тестовую историю
            const historyRecord = await sqliteData.writeData('history', {
                user_id: testUserId,
                skill_id: testSkillId,
                event_type: 'practice',
                notes: 'Test history record',
                event_date: new Date().toISOString()
            });
            testHistoryId = historyRecord.id;
        });

        it('should return skill history', async () => {
            const response = await request(app)
                .get('/skills/API Test Skill/history')
                .query({ user: testUserId })
                .expect(200);

            expect(response.body).toMatchObject({
                success: true,
                history: expect.any(Array)
            });

            expect(response.body.history).toHaveLength(1);
            expect(response.body.history[0]).toMatchObject({
                id: expect.any(Number),
                user_id: testUserId,
                skill_id: testSkillId,
                event_type: 'practice',
                notes: 'Test history record'
            });
        });

        it('should return 400 if user parameter is missing', async () => {
            const response = await request(app)
                .get('/skills/API Test Skill/history')
                .expect(400);

            expect(response.body).toMatchObject({
                error: 'User query parameter (user_id) is required'
            });
        });

        it('should return empty array for skill without history', async () => {
            // Очищаем историю
            await sqliteData.deleteData('history', testUserId, {});

            const response = await request(app)
                .get('/skills/API Test Skill/history')
                .query({ user: testUserId })
                .expect(200);

            expect(response.body).toMatchObject({
                success: true,
                history: []
            });
        });
    });

    describe('GET /activities', () => {
        beforeEach(async () => {
            // Создаем тестовую активность
            const activity = await sqliteData.writeData('actions', {
                user_id: testUserId,
                skill_id: testSkillId,
                action_type: 'task',
                details: 'Test activity'
            });
            testActivityId = activity.id;
        });

        it('should return all activities for user', async () => {
            const response = await request(app)
                .get('/activities')
                .query({ user: testUserId })
                .expect(200);

            expect(response.body).toMatchObject({
                success: true,
                activities: expect.any(Object)
            });

            const activities = response.body.activities;
            const activityKeys = Object.keys(activities);
            expect(activityKeys).toHaveLength(1);
            
            const activity = activities[activityKeys[0]];
            expect(activity).toMatchObject({
                id: expect.any(Number),
                user_id: testUserId,
                skill_id: testSkillId,
                action_type: 'task',
                details: 'Test activity'
            });
        });

        it('should return 400 if user parameter is missing', async () => {
            const response = await request(app)
                .get('/activities')
                .expect(400);

            expect(response.body).toMatchObject({
                error: 'User query parameter (user_id) is required'
            });
        });
    });

    describe('POST /skills/:skillCode/history', () => {
        beforeEach(async () => {
            // Создаем тестовую активность
            const activity = await sqliteData.writeData('actions', {
                user_id: testUserId,
                skill_id: testSkillId,
                action_type: 'task',
                details: 'Test activity for history'
            });
            testActivityId = activity.id;
        });

        it('should add history record successfully', async () => {
            const historyData = {
                activityId: testActivityId,
                notes: 'Completed test activity',
                timestamp: new Date().toISOString()
            };

            const response = await request(app)
                .post('/skills/API Test Skill/history')
                .query({ user: testUserId })
                .send(historyData)
                .expect(201);

            expect(response.body).toMatchObject({
                success: true,
                record: expect.any(Object),
                points: expect.any(Object)
            });

            expect(response.body.record).toMatchObject({
                id: expect.any(Number),
                user_id: testUserId,
                skill_id: testSkillId
            });
        });

        it('should return 400 if user parameter is missing', async () => {
            const response = await request(app)
                .post('/skills/API Test Skill/history')
                .send({ activityId: testActivityId })
                .expect(400);

            expect(response.body).toMatchObject({
                error: 'User query parameter (user_id) is required'
            });
        });

        it('should return 404 for non-existent activity', async () => {
            const response = await request(app)
                .post('/skills/API Test Skill/history')
                .query({ user: testUserId })
                .send({ activityId: 99999 })
                .expect(404);

            expect(response.body).toMatchObject({
                error: expect.stringContaining('не найдена')
            });
        });

        it('should return 400 when activity exists but skill does not exist', async () => {
            const response = await request(app)
                .post('/skills/NonExistent Skill/history')
                .query({ user: testUserId })
                .send({ activityId: testActivityId })
                .expect(400);

            expect(response.body).toMatchObject({
                error: expect.stringContaining('не найден')
            });
        });
    });

    describe('PUT /skills/:skillCode/history/:historyId', () => {
        beforeEach(async () => {
            const historyRecord = await sqliteData.writeData('history', {
                user_id: testUserId,
                skill_id: testSkillId,
                event_type: 'practice',
                notes: 'Original notes',
                event_date: new Date().toISOString()
            });
            testHistoryId = historyRecord.id;
        });

        it('should update history record successfully', async () => {
            const updateData = {
                notes: 'Updated notes',
                event_type: 'achievement'
            };

            const response = await request(app)
                .put(`/skills/API Test Skill/history/${testHistoryId}`)
                .query({ user: testUserId })
                .send(updateData)
                .expect(200);

            expect(response.body).toMatchObject({
                success: true,
                updatedEvent: expect.any(Object)
            });

            expect(response.body.updatedEvent).toMatchObject({
                id: testHistoryId,
                notes: 'Updated notes',
                event_type: 'achievement'
            });
        });

        it('should return 400 if user parameter is missing', async () => {
            const response = await request(app)
                .put(`/skills/API Test Skill/history/${testHistoryId}`)
                .send({ notes: 'New notes' })
                .expect(400);

            expect(response.body).toMatchObject({
                error: 'User query parameter (user_id) is required'
            });
        });

        it('should return 400 if update payload is empty', async () => {
            const response = await request(app)
                .put(`/skills/API Test Skill/history/${testHistoryId}`)
                .query({ user: testUserId })
                .send({})
                .expect(400);

            expect(response.body).toMatchObject({
                error: 'Request body with update data is required.'
            });
        });
    });

    describe('DELETE /skills/:skillCode/history/:historyId', () => {
        beforeEach(async () => {
            const historyRecord = await sqliteData.writeData('history', {
                user_id: testUserId,
                skill_id: testSkillId,
                event_type: 'practice',
                notes: 'To be deleted',
                event_date: new Date().toISOString()
            });
            testHistoryId = historyRecord.id;
        });

        it('should delete history record successfully', async () => {
            const response = await request(app)
                .delete(`/skills/API Test Skill/history/${testHistoryId}`)
                .query({ user: testUserId })
                .expect(200);

            expect(response.body).toMatchObject({
                success: true,
                message: 'History event deleted successfully.',
                deletedCount: expect.any(Number)
            });

            // Проверяем что запись действительно удалена
            const history = await sqliteData.readData('history', { id: testHistoryId }, testUserId);
            expect(history).toHaveLength(0);
        });

        it('should return 400 if user parameter is missing', async () => {
            const response = await request(app)
                .delete(`/skills/API Test Skill/history/${testHistoryId}`)
                .expect(400);

            expect(response.body).toMatchObject({
                error: 'User query parameter (user_id) is required'
            });
        });

        it('should return 404 for non-existent history record', async () => {
            const response = await request(app)
                .delete('/skills/API Test Skill/history/99999')
                .query({ user: testUserId })
                .expect(404);

            expect(response.body).toMatchObject({
                success: false,
                message: 'History event not found or already deleted.'
            });
        });
    });

    describe('POST /skills/:skillCode/points', () => {
        it('should add points to skill successfully', async () => {
            const pointsData = { points: 50 };

            const response = await request(app)
                .post('/skills/API Test Skill/points')
                .query({ user: testUserId })
                .send(pointsData)
                .expect(200);

            expect(response.body).toMatchObject({
                success: true
            });

            // Проверяем что points добавлен в объект ответа
            expect(response.body).toHaveProperty('familiarity');
            expect(response.body).toHaveProperty('level');
        });

        it('should return 400 if user parameter is missing', async () => {
            const response = await request(app)
                .post('/skills/API Test Skill/points')
                .send({ points: 50 })
                .expect(400);

            expect(response.body).toMatchObject({
                error: 'User query parameter (user_id) is required'
            });
        });
    });

    describe('GET /history', () => {
        beforeEach(async () => {
            await sqliteData.writeData('history', {
                user_id: testUserId,
                skill_id: testSkillId,
                event_type: 'practice',
                notes: 'Global history test',
                event_date: new Date().toISOString()
            });
        });

        it('should return all history for user', async () => {
            const response = await request(app)
                .get('/history')
                .query({ user: testUserId })
                .expect(200);

            expect(response.body).toMatchObject({
                success: true,
                history: expect.any(Array)
            });

            expect(response.body.history).toHaveLength(1);
            expect(response.body.history[0]).toMatchObject({
                user_id: testUserId,
                skill_id: testSkillId,
                event_type: 'practice',
                notes: 'Global history test'
            });
        });

        it('should return 400 if user parameter is missing', async () => {
            const response = await request(app)
                .get('/history')
                .expect(400);

            expect(response.body).toMatchObject({
                error: 'User query parameter (user_id) is required'
            });
        });
    });

    describe('POST /history', () => {
        it('should create multiple history entries', async () => {
            const historyEntries = [
                {
                    user_id: testUserId,
                    skill_id: testSkillId,
                    event_type: 'practice',
                    notes: 'Batch entry 1'
                },
                {
                    user_id: testUserId,
                    skill_id: testSkillId,
                    event_type: 'achievement',
                    notes: 'Batch entry 2'
                }
            ];

            const response = await request(app)
                .post('/history')
                .query({ user: testUserId })
                .send(historyEntries)
                .expect(200);

            expect(response.body).toMatchObject({
                success: true,
                message: expect.stringContaining('Successfully wrote 2 history entries'),
                results: expect.any(Array)
            });

            expect(response.body.results).toHaveLength(2);
        });

        it('should return 400 if user parameter is missing', async () => {
            const response = await request(app)
                .post('/history')
                .send([])
                .expect(400);

            expect(response.body).toMatchObject({
                error: 'User query parameter (user_id) is required'
            });
        });

        it('should return 400 if body is not an array', async () => {
            const response = await request(app)
                .post('/history')
                .query({ user: testUserId })
                .send({ not: 'an array' })
                .expect(400);

            expect(response.body).toMatchObject({
                error: 'Request body must be an array of history entries.'
            });
        });
    });

    describe('GET /actions', () => {
        beforeEach(async () => {
            await sqliteData.writeData('actions', {
                user_id: testUserId,
                skill_id: testSkillId,
                action_type: 'task',
                details: 'Global actions test'
            });
        });

        it('should return all actions for user', async () => {
            const response = await request(app)
                .get('/actions')
                .query({ user: testUserId })
                .expect(200);

            expect(response.body).toMatchObject({
                success: true,
                actions: expect.any(Array)
            });

            expect(response.body.actions).toHaveLength(1);
            expect(response.body.actions[0]).toMatchObject({
                user_id: testUserId,
                skill_id: testSkillId,
                action_type: 'task',
                details: 'Global actions test'
            });
        });

        it('should return 400 if user parameter is missing', async () => {
            const response = await request(app)
                .get('/actions')
                .expect(400);

            expect(response.body).toMatchObject({
                error: 'User query parameter (user_id) is required'
            });
        });
    });

    describe('POST /actions', () => {
        it('should create multiple action entries', async () => {
            const actionEntries = [
                {
                    user_id: testUserId,
                    skill_id: testSkillId,
                    action_type: 'task',
                    details: 'Batch action 1'
                },
                {
                    user_id: testUserId,
                    skill_id: testSkillId,
                    action_type: 'project',
                    details: 'Batch action 2'
                }
            ];

            const response = await request(app)
                .post('/actions')
                .query({ user: testUserId })
                .send(actionEntries)
                .expect(200);

            expect(response.body).toMatchObject({
                success: true,
                message: expect.stringContaining('Successfully wrote 2 actions'),
                results: expect.any(Array)
            });

            expect(response.body.results).toHaveLength(2);
        });

        it('should return 400 if user parameter is missing', async () => {
            const response = await request(app)
                .post('/actions')
                .send([])
                .expect(400);

            expect(response.body).toMatchObject({
                error: 'User query parameter (user_id) is required'
            });
        });

        it('should return 400 if body is not an array', async () => {
            const response = await request(app)
                .post('/actions')
                .query({ user: testUserId })
                .send({ not: 'an array' })
                .expect(400);

            expect(response.body).toMatchObject({
                error: 'Request body must be an array of action entries.'
            });
        });
    });

    describe('GET /ping', () => {
        it('should return health check', async () => {
            const response = await request(app)
                .get('/ping')
                .expect(200);

            expect(response.body).toMatchObject({
                status: 'ok',
                timestamp: expect.any(String)
            });

            // Проверяем что timestamp валиден
            const timestamp = new Date(response.body.timestamp);
            expect(timestamp.getTime()).not.toBeNaN();
        });
    });

    describe('Content-Type and CORS Validation', () => {
        it('should handle JSON content type', async () => {
            const response = await request(app)
                .post('/initializeUserData')
                .set('Content-Type', 'application/json')
                .send({ userId: 'json_test_user' })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should return CORS headers', async () => {
            const response = await request(app)
                .get('/ping')
                .expect(200);

            expect(response.headers).toHaveProperty('access-control-allow-origin');
        });

        it('should handle malformed JSON gracefully', async () => {
            const response = await request(app)
                .post('/initializeUserData')
                .set('Content-Type', 'application/json')
                .send('{ invalid json }')
                .expect(400);

            // Express должен обработать malformed JSON
        });
    });

    describe('Error Response Consistency', () => {
        it('should return consistent error format for 400 errors', async () => {
            const response = await request(app)
                .get('/skills')
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(typeof response.body.error).toBe('string');
        });

        it('should return consistent error format for 404 errors', async () => {
            const response = await request(app)
                .get('/skills/NonExistent')
                .query({ user: testUserId })
                .expect(404);

            expect(response.body).toHaveProperty('error');
            expect(typeof response.body.error).toBe('string');
        });

        it('should return consistent error format for 500 errors', async () => {
            // Создаем условие для 500 ошибки - например через поврежденную БД
            const originalMethod = data.getAllSkills;
            data.getAllSkills = () => { throw new Error('Database connection failed'); };

            const response = await request(app)
                .get('/skills')
                .query({ user: testUserId })
                .expect(500);

            expect(response.body).toHaveProperty('error');
            expect(typeof response.body.error).toBe('string');

            // Восстанавливаем метод
            data.getAllSkills = originalMethod;
        });
    });
}); 