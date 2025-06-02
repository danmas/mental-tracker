const sqliteData = require('../sqlite-data');
const fs = require('fs');
const path = require('path');

describe('SQLite Data Adapter', () => {
    const testDbPath = path.join(__dirname, 'test-cortex.db');
    const testUserId = 'test_user_sqlite_unit';

    beforeAll(async () => {
        // Удаляем тестовую БД если существует
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
        
        // Подменяем путь к БД для тестов
        sqliteData.dbPath = testDbPath;
        
        await sqliteData.connect();
        await sqliteData.createSchema();
        await sqliteData.createTables();
    });

    afterAll(async () => {
        await sqliteData.close();
        // Удаляем тестовую БД
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
    });

    beforeEach(async () => {
        // Очищаем данные перед каждым тестом
        await sqliteData.deleteData('history', testUserId, {});
        await sqliteData.deleteData('actions', testUserId, {});
        await sqliteData.deleteData('skills', testUserId, {});
    });

    describe('Connection and Schema', () => {
        it('should connect to SQLite database', async () => {
            expect(sqliteData.client).toBeDefined();
        });

        it('should create tables without errors', async () => {
            // Таблицы уже созданы в beforeAll, проверяем что нет ошибок
            await expect(sqliteData.createTables()).resolves.not.toThrow();
        });
    });

    describe('Skills Operations', () => {
        it('should write and read a skill', async () => {
            const skillData = {
                user_id: testUserId,
                name: 'Test Skill',
                description: 'Test Description',
                complexity: 5,
                familiarity: 25
            };

            const createdSkill = await sqliteData.writeData('skills', skillData);
            expect(createdSkill.id).toBeDefined();
            expect(createdSkill.name).toBe('Test Skill');
            expect(createdSkill.user_id).toBe(testUserId);

            const readSkills = await sqliteData.readData('skills', {}, testUserId);
            expect(readSkills).toHaveLength(1);
            expect(readSkills[0].name).toBe('Test Skill');
        });

        it('should update an existing skill', async () => {
            const skillData = {
                user_id: testUserId,
                name: 'Original Skill',
                complexity: 3,
                familiarity: 10
            };

            const createdSkill = await sqliteData.writeData('skills', skillData);
            
            const updateData = {
                id: createdSkill.id,
                user_id: testUserId,
                name: 'Updated Skill',
                familiarity: 50
            };

            const updatedSkill = await sqliteData.writeData('skills', updateData);
            expect(updatedSkill.name).toBe('Updated Skill');
            expect(updatedSkill.familiarity).toBe(50);
            expect(updatedSkill.updated_at).toBeDefined();
        });

        it('should enforce unique constraint on user_id + name', async () => {
            const skillData = {
                user_id: testUserId,
                name: 'Duplicate Skill',
                complexity: 5,
                familiarity: 25
            };

            await sqliteData.writeData('skills', skillData);
            
            // Попытка создать дубликат должна вызвать ошибку
            await expect(sqliteData.writeData('skills', skillData))
                .rejects.toThrow();
        });
    });

    describe('History Operations', () => {
        let skillId;

        beforeEach(async () => {
            const skill = await sqliteData.writeData('skills', {
                user_id: testUserId,
                name: 'History Test Skill',
                complexity: 5,
                familiarity: 25
            });
            skillId = skill.id;
        });

        it('should write and read history events', async () => {
            const historyData = {
                user_id: testUserId,
                skill_id: skillId,
                event_type: 'practice_session',
                notes: 'Practiced for 30 minutes'
            };

            const createdHistory = await sqliteData.writeData('history', historyData);
            expect(createdHistory.id).toBeDefined();
            expect(createdHistory.event_type).toBe('practice_session');

            const readHistory = await sqliteData.readData('history', {}, testUserId);
            expect(readHistory).toHaveLength(1);
            expect(readHistory[0].notes).toBe('Practiced for 30 minutes');
        });

        it('should filter history by skill_id', async () => {
            // Создаем второй навык
            const skill2 = await sqliteData.writeData('skills', {
                user_id: testUserId,
                name: 'Second Skill',
                complexity: 3,
                familiarity: 15
            });

            // Добавляем историю для обоих навыков
            await sqliteData.writeData('history', {
                user_id: testUserId,
                skill_id: skillId,
                event_type: 'practice',
                notes: 'First skill practice'
            });

            await sqliteData.writeData('history', {
                user_id: testUserId,
                skill_id: skill2.id,
                event_type: 'practice',
                notes: 'Second skill practice'
            });

            // Читаем историю только для первого навыка
            const firstSkillHistory = await sqliteData.readData('history', { skill_id: skillId }, testUserId);
            expect(firstSkillHistory).toHaveLength(1);
            expect(firstSkillHistory[0].notes).toBe('First skill practice');
        });
    });

    describe('Actions Operations', () => {
        let skillId;

        beforeEach(async () => {
            const skill = await sqliteData.writeData('skills', {
                user_id: testUserId,
                name: 'Actions Test Skill',
                complexity: 7,
                familiarity: 40
            });
            skillId = skill.id;
        });

        it('should write and read actions', async () => {
            const actionData = {
                user_id: testUserId,
                skill_id: skillId,
                action_type: 'task',
                details: 'Complete coding exercise',
                duration_minutes: 60
            };

            const createdAction = await sqliteData.writeData('actions', actionData);
            expect(createdAction.id).toBeDefined();
            expect(createdAction.action_type).toBe('task');
            expect(createdAction.duration_minutes).toBe(60);

            const readActions = await sqliteData.readData('actions', {}, testUserId);
            expect(readActions).toHaveLength(1);
            expect(readActions[0].details).toBe('Complete coding exercise');
        });
    });

    describe('User Isolation', () => {
        const user1 = 'user_1_isolation';
        const user2 = 'user_2_isolation';

        afterEach(async () => {
            // Очищаем данные обоих пользователей
            for (const userId of [user1, user2]) {
                await sqliteData.deleteData('history', userId, {});
                await sqliteData.deleteData('actions', userId, {});
                await sqliteData.deleteData('skills', userId, {});
            }
        });

        it('should isolate data between users', async () => {
            // Создаем навыки для разных пользователей
            await sqliteData.writeData('skills', {
                user_id: user1,
                name: 'User 1 Skill',
                complexity: 5,
                familiarity: 25
            });

            await sqliteData.writeData('skills', {
                user_id: user2,
                name: 'User 2 Skill',
                complexity: 3,
                familiarity: 15
            });

            // Проверяем что каждый пользователь видит только свои навыки
            const user1Skills = await sqliteData.readData('skills', {}, user1);
            const user2Skills = await sqliteData.readData('skills', {}, user2);

            expect(user1Skills).toHaveLength(1);
            expect(user1Skills[0].name).toBe('User 1 Skill');

            expect(user2Skills).toHaveLength(1);
            expect(user2Skills[0].name).toBe('User 2 Skill');
        });

        it('should not allow deleting other user data', async () => {
            // Создаем навык для user1
            const skill = await sqliteData.writeData('skills', {
                user_id: user1,
                name: 'Protected Skill',
                complexity: 5,
                familiarity: 25
            });

            // user2 пытается удалить навык user1 - должно удалить 0 записей
            const deleteResult = await sqliteData.deleteData('skills', user2, { id: skill.id });
            expect(deleteResult.rowCount).toBe(0);

            // Проверяем что навык user1 остался
            const user1Skills = await sqliteData.readData('skills', {}, user1);
            expect(user1Skills).toHaveLength(1);
        });
    });

    describe('Error Handling', () => {
        it('should require user_id for write operations', async () => {
            const skillData = {
                name: 'No User Skill',
                complexity: 5,
                familiarity: 25
                // user_id отсутствует
            };

            await expect(sqliteData.writeData('skills', skillData))
                .rejects.toThrow('user_id is required');
        });

        it('should require user_id for delete operations', async () => {
            await expect(sqliteData.deleteData('skills', null, {}))
                .rejects.toThrow('user_id is required');
        });
    });
}); 