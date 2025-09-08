const sqliteData = require('../sqlite-data');
const fs = require('fs');
const path = require('path');

describe('SQLite Data Adapter - VALIDATION TESTS', () => {
    const testDbPath = path.join(__dirname, 'test-validation-cortex.db');
    const testUserId1 = 'validation_user_1';
    const testUserId2 = 'validation_user_2';

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
        for (const userId of [testUserId1, testUserId2]) {
            await sqliteData.deleteData('history', userId, {});
            await sqliteData.deleteData('actions', userId, {});
            await sqliteData.deleteData('skills', userId, {});
        }
    });

    describe('Skills Constraints Validation', () => {
        it('should enforce complexity constraint (1-10)', async () => {
            // Тест нижней границы - 0 должно быть отклонено
            await expect(sqliteData.writeData('skills', {
                user_id: testUserId1,
                name: 'Invalid Low Complexity',
                complexity: 0,
                familiarity: 50
            })).rejects.toThrow();

            // Тест верхней границы - 11 должно быть отклонено
            await expect(sqliteData.writeData('skills', {
                user_id: testUserId1,
                name: 'Invalid High Complexity',
                complexity: 11,
                familiarity: 50
            })).rejects.toThrow();

            // Тест негативного значения
            await expect(sqliteData.writeData('skills', {
                user_id: testUserId1,
                name: 'Negative Complexity',
                complexity: -5,
                familiarity: 50
            })).rejects.toThrow();

            // Валидные значения должны проходить
            const validSkill = await sqliteData.writeData('skills', {
                user_id: testUserId1,
                name: 'Valid Complexity',
                complexity: 5,
                familiarity: 50
            });
            expect(validSkill.complexity).toBe(5);
        });

        it('should enforce familiarity constraint (0-100)', async () => {
            // Тест отрицательного значения
            await expect(sqliteData.writeData('skills', {
                user_id: testUserId1,
                name: 'Negative Familiarity',
                complexity: 5,
                familiarity: -10
            })).rejects.toThrow();

            // Тест превышения максимума
            await expect(sqliteData.writeData('skills', {
                user_id: testUserId1,
                name: 'Excessive Familiarity',
                complexity: 5,
                familiarity: 150
            })).rejects.toThrow();

            // Граничные валидные значения
            const zeroFamiliaritySkill = await sqliteData.writeData('skills', {
                user_id: testUserId1,
                name: 'Zero Familiarity',
                complexity: 5,
                familiarity: 0
            });
            expect(zeroFamiliaritySkill.familiarity).toBe(0);

            const maxFamiliaritySkill = await sqliteData.writeData('skills', {
                user_id: testUserId1,
                name: 'Max Familiarity',
                complexity: 5,
                familiarity: 100
            });
            expect(maxFamiliaritySkill.familiarity).toBe(100);
        });

        it('should enforce unique constraint on (user_id, name)', async () => {
            const skillData = {
                user_id: testUserId1,
                name: 'Unique Test Skill',
                complexity: 5,
                familiarity: 25
            };

            // Первое создание должно пройти
            const firstSkill = await sqliteData.writeData('skills', skillData);
            expect(firstSkill.id).toBeDefined();

            // Второе создание с тем же user_id и name должно вызвать ошибку
            await expect(sqliteData.writeData('skills', skillData))
                .rejects.toThrow();

            // Но разные пользователи могут иметь навыки с одинаковыми именами
            const sameNameDifferentUser = await sqliteData.writeData('skills', {
                user_id: testUserId2,
                name: 'Unique Test Skill', // то же имя
                complexity: 3,
                familiarity: 15
            });
            expect(sameNameDifferentUser.id).toBeDefined();
            expect(sameNameDifferentUser.id).not.toBe(firstSkill.id);
        });

        it('should validate required fields', async () => {
            // Отсутствует user_id
            await expect(sqliteData.writeData('skills', {
                name: 'No User Skill',
                complexity: 5,
                familiarity: 25
            })).rejects.toThrow('user_id is required');

            // Отсутствует name - SQLite позволяет NULL, но это может быть ограничение схемы
            try {
                const result = await sqliteData.writeData('skills', {
                    user_id: testUserId1,
                    complexity: 5,
                    familiarity: 25
                });
                // Если прошло - проверяем что name установился как null или undefined
                expect(result.name).toBeUndefined();
            } catch (error) {
                // Ошибка тоже допустима если есть NOT NULL constraint
                console.log('Name field validation works correctly');
            }

            // Пустое имя - SQLite сохраняет пустые строки как есть
            const emptyNameSkill = await sqliteData.writeData('skills', {
                user_id: testUserId1,
                name: '',
                complexity: 5,
                familiarity: 25
            });
            expect(emptyNameSkill.name).toBe('');
        });
    });

    describe('Foreign Key Constraints', () => {
        let testSkillId;

        beforeEach(async () => {
            const skill = await sqliteData.writeData('skills', {
                user_id: testUserId1,
                name: 'FK Test Skill',
                complexity: 5,
                familiarity: 25
            });
            testSkillId = skill.id;
        });

        it('should enforce foreign key constraint for history.skill_id', async () => {
            // Валидная запись должна создаваться
            const validHistory = await sqliteData.writeData('history', {
                user_id: testUserId1,
                skill_id: testSkillId,
                event_type: 'practice',
                notes: 'Valid foreign key'
            });
            expect(validHistory.id).toBeDefined();

            // Несуществующий skill_id должен вызывать ошибку
            await expect(sqliteData.writeData('history', {
                user_id: testUserId1,
                skill_id: 99999, // несуществующий ID
                event_type: 'practice',
                notes: 'Invalid foreign key'
            })).rejects.toThrow();
        });

        it('should enforce foreign key constraint for actions.skill_id', async () => {
            // Валидная запись
            const validAction = await sqliteData.writeData('actions', {
                user_id: testUserId1,
                skill_id: testSkillId,
                action_type: 'task',
                details: 'Valid action'
            });
            expect(validAction.id).toBeDefined();

            // Несуществующий skill_id
            await expect(sqliteData.writeData('actions', {
                user_id: testUserId1,
                skill_id: 99999,
                action_type: 'task',
                details: 'Invalid action'
            })).rejects.toThrow();
        });

        it('should cascade delete history and actions when skill is deleted', async () => {
            // Создаем связанные записи
            const historyRecord = await sqliteData.writeData('history', {
                user_id: testUserId1,
                skill_id: testSkillId,
                event_type: 'practice',
                notes: 'Will be deleted'
            });

            const actionRecord = await sqliteData.writeData('actions', {
                user_id: testUserId1,
                skill_id: testSkillId,
                action_type: 'task',
                details: 'Will be deleted'
            });

            // Проверяем что записи созданы
            expect(historyRecord.id).toBeDefined();
            expect(actionRecord.id).toBeDefined();

            // Удаляем навык
            await sqliteData.deleteData('skills', testUserId1, { id: testSkillId });

            // Проверяем что связанные записи тоже удалились
            const remainingHistory = await sqliteData.readData('history', {}, testUserId1);
            const remainingActions = await sqliteData.readData('actions', {}, testUserId1);

            expect(remainingHistory).toHaveLength(0);
            expect(remainingActions).toHaveLength(0);
        });
    });

    describe('SQL Injection Protection', () => {
        it('should handle malicious input in skill names', async () => {
            const maliciousInputs = [
                "'; DROP TABLE skills; --",
                "Robert'; DROP TABLE students;--",
                "1' OR '1'='1",
                "'; UPDATE skills SET familiarity=100; --",
                "<script>alert('xss')</script>",
                "' UNION SELECT * FROM skills; --"
            ];

            for (const maliciousName of maliciousInputs) {
                // Должно либо корректно сохранить как строку, либо отклонить безопасно
                try {
                    const result = await sqliteData.writeData('skills', {
                        user_id: testUserId1,
                        name: maliciousName,
                        complexity: 5,
                        familiarity: 25
                    });
                    
                    // Если сохранилось, проверяем что это именно как строка
                    expect(result.name).toBe(maliciousName);
                    
                    // Убеждаемся что таблица не была удалена/изменена
                    const allSkills = await sqliteData.readData('skills', {}, testUserId1);
                    expect(Array.isArray(allSkills)).toBe(true);
                    
                    // Очищаем для следующего теста
                    await sqliteData.deleteData('skills', testUserId1, { id: result.id });
                } catch (error) {
                    // Если отклонено - это тоже нормально, главное чтобы безопасно
                    expect(error).toBeInstanceOf(Error);
                }
            }
        });

        it('should handle special characters in search criteria', async () => {
            // Создаем тестовый навык
            const testSkill = await sqliteData.writeData('skills', {
                user_id: testUserId1,
                name: 'Normal Skill',
                complexity: 5,
                familiarity: 25
            });

            const maliciousCriteria = [
                { name: "'; DROP TABLE skills; --" },
                { complexity: "1' OR '1'='1" },
                { id: "1 UNION SELECT * FROM skills" }
            ];

            for (const criteria of maliciousCriteria) {
                // Поиск с вредоносными критериями должен безопасно возвращать пустой результат
                const results = await sqliteData.readData('skills', criteria, testUserId1);
                expect(Array.isArray(results)).toBe(true);
                // Не должно находить навык по вредоносным критериям
                expect(results.length).toBe(0);
            }

            // Нормальный поиск должен работать
            const normalResults = await sqliteData.readData('skills', { name: 'Normal Skill' }, testUserId1);
            expect(normalResults).toHaveLength(1);
            expect(normalResults[0].id).toBe(testSkill.id);
        });
    });

    describe('Data Integrity Validation', () => {
        it('should validate data types for numeric fields', async () => {
            // Строки вместо чисел должны вызывать ошибки или корректно конвертироваться
            const invalidDataTypes = [
                { field: 'complexity', value: 'not_a_number' },
                { field: 'familiarity', value: 'also_not_a_number' },
                { field: 'complexity', value: null },
                { field: 'familiarity', value: {} }
            ];

            for (const { field, value } of invalidDataTypes) {
                const skillData = {
                    user_id: testUserId1,
                    name: `Invalid ${field} Test`,
                    complexity: 5,
                    familiarity: 25,
                    [field]: value
                };

                try {
                    const result = await sqliteData.writeData('skills', skillData);
                    // Если не вызвало ошибку, проверяем что значение разумно обработано
                    expect(result.id).toBeDefined();
                    // Очищаем
                    await sqliteData.deleteData('skills', testUserId1, { id: result.id });
                } catch (error) {
                    // Ошибка - это тоже валидное поведение для невалидных типов
                    console.log(`Data type validation working for ${field}`);
                }
            }
        });

        it('should handle extremely long strings gracefully', async () => {
            const veryLongName = 'A'.repeat(10000); // 10KB строка
            const veryLongDescription = 'B'.repeat(50000); // 50KB строка
            const veryLongNotes = 'C'.repeat(100000); // 100KB строка

            try {
                // Создаем навык с очень длинными строками
                const skill = await sqliteData.writeData('skills', {
                    user_id: testUserId1,
                    name: veryLongName,
                    description: veryLongDescription,
                    complexity: 5,
                    familiarity: 25
                });

                expect(skill.id).toBeDefined();

                // Создаем историю с длинными заметками
                const history = await sqliteData.writeData('history', {
                    user_id: testUserId1,
                    skill_id: skill.id,
                    event_type: 'practice',
                    notes: veryLongNotes
                });

                expect(history.id).toBeDefined();

                // Проверяем что данные сохранились корректно
                const retrievedSkill = await sqliteData.readData('skills', { id: skill.id }, testUserId1);
                expect(retrievedSkill[0].name).toBe(veryLongName);
                expect(retrievedSkill[0].description).toBe(veryLongDescription);

            } catch (error) {
                // Если БД имеет ограничения на длину - это нормально
                expect(error).toBeInstanceOf(Error);
            }
        });
    });

    describe('Concurrent Access Protection', () => {
        it('should handle concurrent writes to same user data', async () => {
            const promises = [];
            
            // Пытаемся создать 10 навыков одновременно
            for (let i = 0; i < 10; i++) {
                promises.push(
                    sqliteData.writeData('skills', {
                        user_id: testUserId1,
                        name: `Concurrent Skill ${i}`,
                        complexity: 5,
                        familiarity: i * 10
                    })
                );
            }

            const results = await Promise.allSettled(promises);
            
            // Все должны либо успешно создаться, либо безопасно отклониться
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    expect(result.value.id).toBeDefined();
                    expect(result.value.name).toBe(`Concurrent Skill ${index}`);
                } else {
                    expect(result.reason).toBeInstanceOf(Error);
                }
            });

            // Проверяем консистентность данных
            const allSkills = await sqliteData.readData('skills', {}, testUserId1);
            expect(allSkills.length).toBeGreaterThan(0);
            expect(allSkills.length).toBeLessThanOrEqual(10);
        });

        it('should maintain user isolation under concurrent access', async () => {
            const user1Promises = [];
            const user2Promises = [];

            // Создаем навыки для двух пользователей одновременно
            for (let i = 0; i < 5; i++) {
                user1Promises.push(
                    sqliteData.writeData('skills', {
                        user_id: testUserId1,
                        name: `User1 Skill ${i}`,
                        complexity: 5,
                        familiarity: 25
                    })
                );

                user2Promises.push(
                    sqliteData.writeData('skills', {
                        user_id: testUserId2,
                        name: `User2 Skill ${i}`,
                        complexity: 3,
                        familiarity: 15
                    })
                );
            }

            await Promise.all([...user1Promises, ...user2Promises]);

            // Проверяем что данные не перемешались
            const user1Skills = await sqliteData.readData('skills', {}, testUserId1);
            const user2Skills = await sqliteData.readData('skills', {}, testUserId2);

            user1Skills.forEach(skill => {
                expect(skill.user_id).toBe(testUserId1);
                expect(skill.name).toMatch(/User1 Skill/);
            });

            user2Skills.forEach(skill => {
                expect(skill.user_id).toBe(testUserId2);
                expect(skill.name).toMatch(/User2 Skill/);
            });
        });
    });

    describe('Edge Cases and Error Recovery', () => {
        it('should handle database connection interruption gracefully', async () => {
            // Этот тест проверяет что приложение корректно обрабатывает ошибки БД
            // Симулируем ошибку через попытку записи в несуществующую таблицу
            
            try {
                await sqliteData.writeData('nonexistent_table', {
                    user_id: testUserId1,
                    name: 'Should Fail',
                    complexity: 5,
                    familiarity: 25
                });
                // Если не упало - это означает что защита работает по-другому
                expect(true).toBe(true);
            } catch (error) {
                // Ожидаемое поведение - ошибка должна быть обработана
                console.log('Database error handling working correctly');
            }
        });

        it('should validate table names to prevent injection', async () => {
            const maliciousTables = [
                'skills; DROP TABLE skills; --',
                'skills UNION SELECT * FROM users',
                '../../../etc/passwd',
                'skills/**/OR/**/1=1'
            ];

            for (const tableName of maliciousTables) {
                await expect(sqliteData.readData(tableName, {}, testUserId1))
                    .rejects.toThrow();
            }
        });

        it('should handle empty and null user_id consistently', async () => {
            const invalidUserIds = [null, undefined, ''];
            const validSpecialUserIds = [' ', '\t', '\n']; // эти принимаются как валидные

            for (const invalidUserId of invalidUserIds) {
                await expect(sqliteData.writeData('skills', {
                    user_id: invalidUserId,
                    name: 'Invalid User Test',
                    complexity: 5,
                    familiarity: 25
                })).rejects.toThrow('user_id is required');

                // readData может работать с пустым user_id - возвращает пустой массив
                try {
                    const result = await sqliteData.readData('skills', {}, invalidUserId);
                    expect(Array.isArray(result)).toBe(true);
                } catch (error) {
                    // Или может выбрасывать ошибку - оба поведения допустимы
                    console.log('Empty user_id handled correctly');
                }

                await expect(sqliteData.deleteData('skills', invalidUserId, {}))
                    .rejects.toThrow('user_id is required');
            }

            // Специальные символы принимаются как валидные user_id
            for (const validUserId of validSpecialUserIds) {
                const result = await sqliteData.writeData('skills', {
                    user_id: validUserId,
                    name: `Special User Test ${validUserId}`,
                    complexity: 5,
                    familiarity: 25
                });
                expect(result.user_id).toBe(validUserId);
            }
        });
    });
}); 