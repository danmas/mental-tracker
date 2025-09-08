const request = require('supertest');
const path = require('path');
const fs = require('fs');

// Устанавливаем SQLite перед импортом сервера
process.env.STORAGE_TYPE = 'sqlite';
process.env.PORT = '3051'; // Используем другой порт для тестов

// Мокируем server.listen чтобы избежать конфликта портов
const originalListen = require('express').application.listen;
require('express').application.listen = function(port, callback) {
  // Не запускаем сервер в тестах
  if (callback) callback();
  return { close: (cb) => cb && cb() };
};

const { app } = require('../server');
const sqliteData = require('../sqlite-data');

// Восстанавливаем оригинальный listen
require('express').application.listen = originalListen;

// Тестовые пользователи
const USER_1 = 'integ_user_alpha_sqlite';
const USER_2 = 'integ_user_beta_sqlite';

describe('API Integration Tests (SQLite)', () => {
  const testDbPath = path.join(__dirname, 'test-integration-cortex.db');

  beforeAll(async () => {
    // Удаляем тестовую БД если существует
    if (fs.existsSync(testDbPath)) {
      try {
        fs.unlinkSync(testDbPath);
      } catch (e) {
        // Игнорируем ошибки удаления
      }
    }

    // Подменяем путь к БД для тестов
    sqliteData.dbPath = testDbPath;

    // Инициализируем тестовую БД
    await sqliteData.connect();
    await sqliteData.createSchema();
    await sqliteData.createTables();

    // Очищаем данные тестовых пользователей
    for (const userId of [USER_1, USER_2]) {
      await sqliteData.deleteData('history', userId, {});
      await sqliteData.deleteData('actions', userId, {});
      await sqliteData.deleteData('skills', userId, {});
      
      // Инициализируем пользователей
      const initResponse = await request(app)
        .post('/initializeUserData')
        .send({ userId });
      expect(initResponse.statusCode).toBe(200);
    }
  });

  afterAll(async () => {
    // Очищаем тестовые данные
    for (const userId of [USER_1, USER_2]) {
      try {
        await sqliteData.deleteData('history', userId, {});
        await sqliteData.deleteData('actions', userId, {});
        await sqliteData.deleteData('skills', userId, {});
      } catch (e) {
        // Игнорируем ошибки очистки
      }
    }

    await sqliteData.close();
    
    // Удаляем тестовую БД с задержкой
    setTimeout(() => {
      if (fs.existsSync(testDbPath)) {
        try {
          fs.unlinkSync(testDbPath);
        } catch (e) {
          // Игнорируем ошибки удаления
        }
      }
    }, 100);
  });

  describe('User Initialization', () => {
    it('POST /initializeUserData should succeed for a new user', async () => {
      const newUser = 'integ_user_gamma_sqlite';
      
      // Очищаем пользователя если существует
      await sqliteData.deleteData('history', newUser, {});
      await sqliteData.deleteData('actions', newUser, {});
      await sqliteData.deleteData('skills', newUser, {});

      const response = await request(app)
        .post('/initializeUserData')
        .send({ userId: newUser });
        
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain(newUser);

      // Проверяем что созданы навыки по умолчанию
      const skillsRes = await request(app).get(`/skills?user=${newUser}`);
      expect(skillsRes.statusCode).toBe(200);
      expect(skillsRes.body.skills.length).toBeGreaterThan(0);
    });
  });

  describe('Skills Endpoints', () => {
    it(`GET /skills should return default skills for ${USER_1}`, async () => {
      const response = await request(app).get(`/skills?user=${USER_1}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.skills)).toBe(true);
      expect(response.body.skills.length).toBeGreaterThanOrEqual(2);
      expect(response.body.skills.find(s => s.name === 'Рисование')).toBeDefined();
    });

    it(`GET /skills/:skillCode should return a specific skill for ${USER_1}`, async () => {
      const skillName = 'Рисование';
      const response = await request(app)
        .get(`/skills/${encodeURIComponent(skillName)}?user=${USER_1}`);
        
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.name).toBe(skillName);
      expect(response.body.user_id).toBe(USER_1);
    });

    it(`GET /skills should return different data for ${USER_2}`, async () => {
      // Добавляем уникальный навык для USER_2
      const user2SkillName = "User2 Unique Skill SQLite";
      await sqliteData.writeData('skills', { 
        user_id: USER_2, 
        name: user2SkillName, 
        complexity: 3, 
        familiarity: 33 
      });
      
      const responseUser1 = await request(app).get(`/skills?user=${USER_1}`);
      expect(responseUser1.body.skills.find(s => s.name === user2SkillName)).toBeUndefined();

      const responseUser2 = await request(app).get(`/skills?user=${USER_2}`);
      expect(responseUser2.body.skills.find(s => s.name === user2SkillName)).toBeDefined();
    });
  });

  describe('Actions (Activities) Endpoints', () => {
    let user1Skill1Id;
    let user1ActionId;

    beforeAll(async () => {
      const skillsUser1 = await sqliteData.readData('skills', { name: 'Рисование' }, USER_1);
      user1Skill1Id = skillsUser1[0].id;
    });

    it(`POST /activities should add an action for ${USER_1}`, async () => {
      const newAction = {
        skill_code: 'Рисование',
        name: 'Practice Sketching SQLite',
        description: 'Daily sketching practice for 30 mins',
        points: 10,
        isTask: true,
        type: 'practice_session'
      };
      
      const response = await request(app)
        .post(`/activities?user=${USER_1}`)
        .send(newAction);
      
      expect(response.statusCode).toBe(201);
      expect(response.body.id).toBeDefined();
      user1ActionId = response.body.id;
      expect(response.body.skill_id).toBe(user1Skill1Id);
      expect(response.body.action_type).toBe('task');
      expect(response.body.details).toContain('Task: Practice Sketching SQLite');
      expect(response.body.duration_minutes).toBe(10);
    });

    it(`GET /activities should retrieve actions for ${USER_1}`, async () => {
      const response = await request(app).get(`/activities?user=${USER_1}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.activities[user1ActionId]).toBeDefined();
      expect(response.body.activities[user1ActionId].details).toContain('Task: Practice Sketching SQLite');
    });

    it(`PATCH /activities/:activityId should update an action for ${USER_1}`, async () => {
      const updates = {
        details: 'Updated: Daily sketching practice for 60 mins, focused on shading.',
        duration_minutes: 60,
        isDone: true
      };
      
      const response = await request(app)
        .patch(`/activities/${user1ActionId}?user=${USER_1}`)
        .send(updates);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.id).toBe(user1ActionId);
      expect(response.body.details).toBe(updates.details);
      expect(response.body.duration_minutes).toBe(60);
      expect(response.body.completed_at).toBeDefined();
    });
  });

  describe('History Endpoints', () => {
    let user1Skill1Id;
    let user1Skill1Name = 'Рисование';
    let user1HistoryEventId;

    beforeAll(async () => {
      const skillsUser1 = await sqliteData.readData('skills', { name: user1Skill1Name }, USER_1);
      user1Skill1Id = skillsUser1[0].id;
    });

    it(`POST /skills/:skillCode/history should add a history record for ${USER_1}`, async () => {
      const historyRecord = {
        notes: 'Focused practice session on perspective (SQLite).',
        type: 'deep_work_session'
      };
      
      const response = await request(app)
        .post(`/skills/${encodeURIComponent(user1Skill1Name)}/history?user=${USER_1}`)
        .send(historyRecord);
      
      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.record).toBeDefined();
      user1HistoryEventId = response.body.record.id;
      expect(response.body.record.skill_id).toBe(user1Skill1Id);
      expect(response.body.record.event_type).toBe(historyRecord.type);
      expect(response.body.record.notes).toBe(historyRecord.notes);
    });

    it(`GET /skills/:skillCode/history should retrieve history for a skill for ${USER_1}`, async () => {
      const response = await request(app)
        .get(`/skills/${encodeURIComponent(user1Skill1Name)}/history?user=${USER_1}`);
        
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.history)).toBe(true);
      
      const foundEvent = response.body.history.find(h => h.id === user1HistoryEventId);
      expect(foundEvent).toBeDefined();
      expect(foundEvent.notes).toBe('Focused practice session on perspective (SQLite).');
    });
    
    it(`GET /history should retrieve all history for ${USER_1}`, async () => {
      const response = await request(app).get(`/history?user=${USER_1}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.history)).toBe(true);
      
      const foundEvent = response.body.history.find(h => h.id === user1HistoryEventId);
      expect(foundEvent).toBeDefined();
    });

    it(`PUT /skills/:skillCode/history/:historyId should update a history event for ${USER_1}`, async () => {
      const updatePayload = { 
        notes: "Updated notes for history event (SQLite).", 
        event_type: "review_session" 
      };
      
      const response = await request(app)
        .put(`/skills/${encodeURIComponent(user1Skill1Name)}/history/${user1HistoryEventId}?user=${USER_1}`)
        .send(updatePayload);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.updatedEvent).toBeDefined();
      expect(response.body.updatedEvent.id).toBe(user1HistoryEventId);
      expect(response.body.updatedEvent.notes).toBe(updatePayload.notes);
      expect(response.body.updatedEvent.event_type).toBe(updatePayload.event_type);
    });

    it(`DELETE /skills/:skillCode/history/:historyId should delete a history event for ${USER_1}`, async () => {
      const response = await request(app)
        .delete(`/skills/${encodeURIComponent(user1Skill1Name)}/history/${user1HistoryEventId}?user=${USER_1}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.deletedCount).toBe(1);

      // Проверяем что событие удалено
      const checkResponse = await request(app)
        .get(`/skills/${encodeURIComponent(user1Skill1Name)}/history?user=${USER_1}`);
      const deletedEvent = checkResponse.body.history.find(h => h.id === user1HistoryEventId);
      expect(deletedEvent).toBeUndefined();
    });
    
    it(`POST /history (bulk) should replace all history for ${USER_1}`, async () => {
      const newHistoryEntries = [
        { skill_id: user1Skill1Id, user_id: USER_1, event_type: 'bulk_event_1', notes: 'Bulk note 1 (SQLite)' },
        { skill_id: user1Skill1Id, user_id: USER_1, event_type: 'bulk_event_2', notes: 'Bulk note 2 (SQLite)' }
      ];
      
      const response = await request(app)
        .post(`/history?user=${USER_1}`)
        .send(newHistoryEntries);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.results.length).toBe(2);
      expect(response.body.results[0].notes).toBe('Bulk note 1 (SQLite)');

      const getResponse = await request(app).get(`/history?user=${USER_1}`);
      expect(getResponse.body.history.length).toBe(2);
    });
    
    it(`POST /actions (bulk) should replace all actions for ${USER_1}`, async () => {
      const newActions = [
        { skill_id: user1Skill1Id, user_id: USER_1, action_type: 'bulk_action_1', details: 'Bulk details 1 (SQLite)' },
        { skill_id: user1Skill1Id, user_id: USER_1, action_type: 'bulk_action_2', details: 'Bulk details 2 (SQLite)' }
      ];
      
      const response = await request(app)
        .post(`/actions?user=${USER_1}`)
        .send(newActions);
        
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.results.length).toBe(2);
      expect(response.body.results[0].details).toBe('Bulk details 1 (SQLite)');

      const getResponse = await request(app).get(`/activities?user=${USER_1}`);
      expect(Object.keys(getResponse.body.activities).length).toBe(2);
    });
  });

  describe('User Data Isolation', () => {
    let user1SkillName = "Рисование";
    let user2SkillName = "Музыка Практика";
    let user1SkillId, user2SkillId;

    beforeAll(async () => {
      const skillsUser1 = await sqliteData.readData('skills', { name: user1SkillName }, USER_1);
      user1SkillId = skillsUser1[0].id;
      const skillsUser2 = await sqliteData.readData('skills', { name: user2SkillName }, USER_2);
      user2SkillId = skillsUser2[0].id;
    });

    it(`USER_1 should not see USER_2's skills`, async () => {
      // Добавляем навык только для USER_2
      const uniqueSkillUser2 = { 
        user_id: USER_2, 
        name: "USER2_ONLY_SKILL_SQLITE", 
        complexity: 5, 
        familiarity: 50 
      };
      await sqliteData.writeData('skills', uniqueSkillUser2);

      const response = await request(app).get(`/skills?user=${USER_1}`);
      expect(response.statusCode).toBe(200);
      const foundSkill = response.body.skills.find(s => s.name === "USER2_ONLY_SKILL_SQLITE");
      expect(foundSkill).toBeUndefined();
    });

    it(`USER_1 should not be able to get USER_2's specific skill by name`, async () => {
      const response = await request(app).get(`/skills/USER2_ONLY_SKILL_SQLITE?user=${USER_1}`);
      expect(response.statusCode).toBe(404);
    });
    
    it(`USER_1 should not be able to add history to USER_2's skill`, async () => {
      const historyRecord = { notes: "Trying to cross-post (SQLite)" };
      const response = await request(app)
        .post(`/skills/USER2_ONLY_SKILL_SQLITE/history?user=${USER_1}`)
        .send(historyRecord);
      expect(response.statusCode).toBe(404);
    });

    it(`USER_1 should not be able to update USER_2's action`, async () => {
      // Создаем действие для USER_2
      const actionUser2 = await sqliteData.writeData('actions', { 
        user_id: USER_2, 
        skill_id: user2SkillId, 
        action_type: 'planning', 
        details: 'User 2 action (SQLite)' 
      });
      
      const updates = { details: "USER_1 trying to update USER_2 action (SQLite)" };
      const response = await request(app)
        .patch(`/activities/${actionUser2.id}?user=${USER_1}`)
        .send(updates);
      
      expect(response.statusCode).toBe(404);
      
      // Проверяем что действие USER_2 не изменилось
      const dbActionUser2 = await sqliteData.readData('actions', {id: actionUser2.id}, USER_2);
      expect(dbActionUser2[0].details).toBe('User 2 action (SQLite)');
    });
  });

  describe('Ping Endpoint', () => {
    it('GET /ping should return pong', async () => {
      const response = await request(app).get('/ping');
      expect(response.statusCode).toBe(200);
      expect(response.text).toBe('pong');
    });
  });
}); 