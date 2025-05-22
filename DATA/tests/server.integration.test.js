const request = require('supertest');
const { app, server } = require('../server'); // Import app and server from server.js
const pgData = require('../pg-data');       // To interact with DB directly for setup/assertions
const { Client } = require('pg');           // For a direct DB client if needed for complex assertions

// Test users
const USER_1 = 'integ_user_alpha';
const USER_2 = 'integ_user_beta';

// Test database configuration (should be loaded from .env.test via jest.setup.js)
const testDbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432', 10),
};

const SCHEMA_NAME = 'mental'; // Schema used by pg-data.js

describe('API Integration Tests', () => {
  let assertClient; // Client for direct DB assertions

  beforeAll(async () => {
    // This client connects to the test DB for setup/cleanup
    assertClient = new Client(testDbConfig);
    await assertClient.connect();

    // Clean slate for test users before starting
    // Order matters: history/actions depend on skills (foreign keys)
    for (const userId of [USER_1, USER_2]) {
        await pgData.deleteData('history', userId, {});
        await pgData.deleteData('actions', userId, {});
        await pgData.deleteData('skills', userId, {});
        // Initialize user data (creates default skills if none exist for them)
        const initResponse = await request(app).post('/initializeUserData').send({ userId });
        expect(initResponse.statusCode).toBe(200);
    }
  });

  afterAll(async () => {
    // Clean up test data for USER_1 and USER_2 after all tests
    // console.log('Cleaning up test data...');
    // for (const userId of [USER_1, USER_2]) {
    //     await pgData.deleteData('history', userId, {});
    //     await pgData.deleteData('actions', userId, {});
    //     await pgData.deleteData('skills', userId, {});
    // }
    
    if (assertClient) {
      await assertClient.end();
    }
    // Close the server & pgData client
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
    if (pgData.client && typeof pgData.client.end === 'function') {
        try {
            await pgData.client.end();
        } catch (e) {
            console.warn("Error closing pgData.client in afterAll:", e.message);
        }
    }
  });

  describe('User Initialization', () => {
    it('POST /initializeUserData should succeed for a new user', async () => {
      const newUser = 'integ_user_gamma';
      // Clean up this specific user first if it might exist from a failed previous run
      await pgData.deleteData('history', newUser, {});
      await pgData.deleteData('actions', newUser, {});
      await pgData.deleteData('skills', newUser, {});

      const response = await request(app).post('/initializeUserData').send({ userId: newUser });
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain(newUser);

      // Verify default skills were created
      const skillsRes = await request(app).get(`/skills?user=${newUser}`);
      expect(skillsRes.statusCode).toBe(200);
      expect(skillsRes.body.skills.length).toBeGreaterThan(0); // Default skills
    });
  });

  describe('Skills Endpoints', () => {
    it(`GET /skills should return default skills for ${USER_1}`, async () => {
      const response = await request(app).get(`/skills?user=${USER_1}`);
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.skills)).toBe(true);
      expect(response.body.skills.length).toBeGreaterThanOrEqual(2); // "Рисование", "Музыка Практика"
      expect(response.body.skills.find(s => s.name === 'Рисование')).toBeDefined();
    });

    it(`GET /skills/:skillCode should return a specific skill for ${USER_1}`, async () => {
      const skillName = 'Рисование'; // Default skill
      const response = await request(app).get(`/skills/${encodeURIComponent(skillName)}?user=${USER_1}`);
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.name).toBe(skillName);
      expect(response.body.user_id).toBe(USER_1);
    });

    it(`GET /skills should return different data for ${USER_2} if modified, or default`, async () => {
      // Example: Add a skill unique to USER_2
      const user2SkillName = "User2 Unique Skill";
      await pgData.writeData('skills', { user_id: USER_2, name: user2SkillName, complexity: 3, familiarity: 33 });
      
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
        // Get skill ID for USER_1 to associate actions/history
        const skillsUser1 = await pgData.readData('skills', { name: 'Рисование' }, USER_1);
        user1Skill1Id = skillsUser1[0].id;
    });

    it(`POST /activities should add an action for ${USER_1}`, async () => {
      const newAction = {
        skill_code: 'Рисование', // skillName
        name: 'Practice Sketching',
        description: 'Daily sketching practice for 30 mins',
        points: 10, // This maps to duration_minutes in current data.js addActivity
        isTask: true,
        type: 'practice_session' // This could map to action_type
      };
      const response = await request(app)
        .post(`/activities?user=${USER_1}`)
        .send(newAction);
      
      expect(response.statusCode).toBe(201);
      expect(response.body.id).toBeDefined();
      user1ActionId = response.body.id;
      expect(response.body.skill_id).toBe(user1Skill1Id);
      expect(response.body.action_type).toBe('task'); // as isTask is true
      expect(response.body.details).toContain('Task: Practice Sketching');
      expect(response.body.duration_minutes).toBe(10);
    });

    it(`GET /activities should retrieve actions for ${USER_1}`, async () => {
      const response = await request(app).get(`/activities?user=${USER_1}`);
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.activities[user1ActionId]).toBeDefined();
      expect(response.body.activities[user1ActionId].details).toContain('Task: Practice Sketching');
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
      expect(response.body.completed_at).toBeDefined(); // Because isDone was true
    });
  });

  describe('History Endpoints', () => {
    let user1Skill1Id;
    let user1Skill1Name = 'Рисование';
    let user1HistoryEventId;

     beforeAll(async () => {
        const skillsUser1 = await pgData.readData('skills', { name: user1Skill1Name }, USER_1);
        user1Skill1Id = skillsUser1[0].id;
    });

    it(`POST /skills/:skillCode/history should add a history record for ${USER_1}`, async () => {
      // First, ensure an activity exists to reference (or use a generic history post)
      // For this test, using a simplified record, not tied to a specific activityId from /activities response.
      const historyRecord = {
        // activityId: 'some_activity_id', // This is not directly used by addHistoryRecord's current mapping
        notes: 'Focused practice session on perspective.',
        type: 'deep_work_session' // This will become event_type
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
      const response = await request(app).get(`/skills/${encodeURIComponent(user1Skill1Name)}/history?user=${USER_1}`);
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.history)).toBe(true);
      const foundEvent = response.body.history.find(h => h.id === user1HistoryEventId);
      expect(foundEvent).toBeDefined();
      expect(foundEvent.notes).toBe('Focused practice session on perspective.');
    });
    
    it(`GET /history should retrieve all history for ${USER_1}`, async () => {
        const response = await request(app).get(`/history?user=${USER_1}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.history)).toBe(true);
        const foundEvent = response.body.history.find(h => h.id === user1HistoryEventId);
        expect(foundEvent).toBeDefined();
    });

    // Tests for fixed endpoints
    it(`PUT /skills/:skillCode/history/:historyId should update a history event for ${USER_1}`, async () => {
        const updatePayload = { notes: "Updated notes for history event.", event_type: "review_session" };
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

        // Verify it's gone
        const checkResponse = await request(app).get(`/skills/${encodeURIComponent(user1Skill1Name)}/history?user=${USER_1}`);
        const deletedEvent = checkResponse.body.history.find(h => h.id === user1HistoryEventId);
        expect(deletedEvent).toBeUndefined();
    });
    
    it(`POST /history (bulk) should replace all history for ${USER_1}`, async () => {
        const newHistoryEntries = [
            { skill_id: user1Skill1Id, user_id: USER_1, event_type: 'bulk_event_1', notes: 'Bulk note 1' },
            { skill_id: user1Skill1Id, user_id: USER_1, event_type: 'bulk_event_2', notes: 'Bulk note 2' }
        ];
        const response = await request(app)
            .post(`/history?user=${USER_1}`)
            .send(newHistoryEntries);

        expect(response.statusCode).toBe(200); // server.js uses 200 for this now
        expect(response.body.success).toBe(true);
        expect(response.body.results.length).toBe(2);
        expect(response.body.results[0].notes).toBe('Bulk note 1');

        const getResponse = await request(app).get(`/history?user=${USER_1}`);
        expect(getResponse.body.history.length).toBe(2);
    });
    
    it(`POST /actions (bulk) should replace all actions for ${USER_1}`, async () => {
        const newActions = [
            { skill_id: user1Skill1Id, user_id: USER_1, action_type: 'bulk_action_1', details: 'Bulk details 1' },
            { skill_id: user1Skill1Id, user_id: USER_1, action_type: 'bulk_action_2', details: 'Bulk details 2' }
        ];
        const response = await request(app)
            .post(`/actions?user=${USER_1}`)
            .send(newActions);
            
        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.results.length).toBe(2);
        expect(response.body.results[0].details).toBe('Bulk details 1');

        const getResponse = await request(app).get(`/activities?user=${USER_1}`); // /activities GETs actions
        // The getActivities endpoint returns an object keyed by ID, not an array directly
        expect(Object.keys(getResponse.body.activities).length).toBe(2);
    });
  });

  describe('User Data Isolation', () => {
    let user1SkillName = "Рисование"; // Default skill for USER_1
    let user2SkillName = "Музыка Практика"; // Default skill for USER_2 (assuming it's also seeded)
    let user1SkillId, user2SkillId;

    beforeAll(async () => {
        const skillsUser1 = await pgData.readData('skills', { name: user1SkillName }, USER_1);
        user1SkillId = skillsUser1[0].id;
        const skillsUser2 = await pgData.readData('skills', { name: user2SkillName }, USER_2);
        user2SkillId = skillsUser2[0].id;
    });

    it(`USER_1 should not see USER_2's skills`, async () => {
        // Add a skill only for USER_2
        const uniqueSkillUser2 = { user_id: USER_2, name: "USER2_ONLY_SKILL", complexity: 5, familiarity: 50 };
        await pgData.writeData('skills', uniqueSkillUser2);

        const response = await request(app).get(`/skills?user=${USER_1}`);
        expect(response.statusCode).toBe(200);
        const foundSkill = response.body.skills.find(s => s.name === "USER2_ONLY_SKILL");
        expect(foundSkill).toBeUndefined();
    });

    it(`USER_1 should not be able to get USER_2's specific skill by name if USER_1 does not have it`, async () => {
        const response = await request(app).get(`/skills/USER2_ONLY_SKILL?user=${USER_1}`);
        expect(response.statusCode).toBe(404); // Not found for USER_1
    });
    
    it(`USER_1 should not be able to add history to USER_2's skill via path manipulation (if skill name is unique to user2)`, async () => {
        // If USER_1 tries to post history to a skill name that only USER_2 has.
        const historyRecord = { notes: "Trying to cross-post" };
        const response = await request(app)
            .post(`/skills/USER2_ONLY_SKILL/history?user=${USER_1}`)
            .send(historyRecord);
        expect(response.statusCode).toBe(404); // Skill "USER2_ONLY_SKILL" not found for USER_1
    });

    it(`USER_1 should not be able to update USER_2's action`, async () => {
        // Create an action for USER_2
        const actionUser2 = await pgData.writeData('actions', { user_id: USER_2, skill_id: user2SkillId, action_type: 'planning', details: 'User 2 action' });
        
        const updates = { details: "USER_1 trying to update USER_2 action" };
        const response = await request(app)
            .patch(`/activities/${actionUser2.id}?user=${USER_1}`) // USER_1 tries to update
            .send(updates);
        
        expect(response.statusCode).toBe(404); // Action not found for USER_1
        
        // Verify USER_2's action is unchanged by USER_1's attempt
        const dbActionUser2 = await pgData.readData('actions', {id: actionUser2.id}, USER_2);
        expect(dbActionUser2[0].details).toBe('User 2 action');
    });
  });
});
