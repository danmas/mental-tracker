const game = require('../public/game');
const data = require('../public/data');

// Мокируем data module для изоляции unit тестов
jest.mock('../public/data');

describe('Game Mechanics - CRITICAL TESTS', () => {
    beforeEach(() => {
        // Очищаем все моки перед каждым тестом
        jest.clearAllMocks();
    });

    describe('calculateLevel function', () => {
        it('should calculate correct level and progress for normal values', async () => {
            const testCases = [
                { familiarity: 0, expected: { level: 0, currentLevelPoints: 0, progress: 0 } },
                { familiarity: 5, expected: { level: 0, currentLevelPoints: 5, progress: 50 } },
                { familiarity: 9, expected: { level: 0, currentLevelPoints: 9, progress: 90 } },
                { familiarity: 10, expected: { level: 1, currentLevelPoints: 0, progress: 0 } },
                { familiarity: 15, expected: { level: 1, currentLevelPoints: 5, progress: 50 } },
                { familiarity: 25, expected: { level: 2, currentLevelPoints: 5, progress: 50 } },
                { familiarity: 50, expected: { level: 5, currentLevelPoints: 0, progress: 0 } },
                { familiarity: 99, expected: { level: 9, currentLevelPoints: 9, progress: 90 } },
                { familiarity: 100, expected: { level: 10, currentLevelPoints: 0, progress: 0 } }
            ];

            for (const testCase of testCases) {
                const result = await game.calculateLevel(testCase.familiarity);
                
                expect(result.level).toBe(testCase.expected.level);
                expect(result.currentLevelPoints).toBe(testCase.expected.currentLevelPoints);
                expect(result.progress).toBe(testCase.expected.progress);
                expect(result.pointsForNextLevel).toBe(10);
                expect(result.familiarity).toBe(testCase.familiarity);
            }
        });

        it('should enforce familiarity bounds (0-100)', async () => {
            // Тест нижней границы
            const negativeResult = await game.calculateLevel(-50);
            expect(negativeResult.familiarity).toBe(0);
            expect(negativeResult.level).toBe(0);
            expect(negativeResult.progress).toBe(0);

            // Тест верхней границы
            const overflowResult = await game.calculateLevel(150);
            expect(overflowResult.familiarity).toBe(100);
            expect(overflowResult.level).toBe(10);
            expect(overflowResult.progress).toBe(0);
        });

        it('should handle edge cases correctly', async () => {
            // Тест с float числами
            const floatResult = await game.calculateLevel(25.7);
            expect(floatResult.level).toBe(2);
            expect(floatResult.currentLevelPoints).toBe(5.699999999999999); // 25.7 % 10 = 5.7 (точное значение)
            
            // Тест с NaN - NaN проходит через все проверки как есть
            const nanResult = await game.calculateLevel(NaN);
            expect(nanResult.familiarity).toBeNaN(); // NaN остается NaN
            expect(nanResult.level).toBeNaN(); // Math.floor(NaN) = NaN
            expect(nanResult.progress).toBeNaN(); // расчеты с NaN дают NaN
            
            // Тест с null/undefined - остаются как есть без конвертации
            const nullResult = await game.calculateLevel(null);
            expect(nullResult.familiarity).toBe(null);
            
            const undefinedResult = await game.calculateLevel(undefined);
            expect(undefinedResult.familiarity).toBe(undefined);
            
            // Тест с явным 0
            const zeroResult = await game.calculateLevel(0);
            expect(zeroResult.familiarity).toBe(0);
            expect(zeroResult.level).toBe(0);
            expect(zeroResult.progress).toBe(0);
        });

        it('should return consistent structure', async () => {
            const result = await game.calculateLevel(35);
            
            expect(result).toHaveProperty('level');
            expect(result).toHaveProperty('currentLevelPoints');
            expect(result).toHaveProperty('pointsForNextLevel');
            expect(result).toHaveProperty('progress');
            expect(result).toHaveProperty('familiarity');
            
            expect(typeof result.level).toBe('number');
            expect(typeof result.currentLevelPoints).toBe('number');
            expect(typeof result.pointsForNextLevel).toBe('number');
            expect(typeof result.progress).toBe('number');
            expect(typeof result.familiarity).toBe('number');
        });
    });

    describe('addPoints function', () => {
        const mockUserId = 'test_user';
        const mockSkillName = 'TestSkill';
        const mockSkill = {
            id: 1,
            name: mockSkillName,
            familiarity: 25,
            description: 'Test skill',
            complexity: 5
        };

        beforeEach(() => {
            data.getSkillData.mockResolvedValue(mockSkill);
            data.writeSkillData.mockResolvedValue(mockSkill);
            data.addHistoryEvent.mockResolvedValue({});
        });

        it('should validate required parameters', async () => {
            // Тест отсутствующего userId
            await expect(game.addPoints(null, mockSkillName, 10))
                .rejects.toThrow('userId is required for addPoints.');
            
            await expect(game.addPoints('', mockSkillName, 10))
                .rejects.toThrow('userId is required for addPoints.');

            // Тест отсутствующего skillName
            await expect(game.addPoints(mockUserId, null, 10))
                .rejects.toThrow('skillName is required for addPoints.');
            
            await expect(game.addPoints(mockUserId, '', 10))
                .rejects.toThrow('skillName is required for addPoints.');
        });

        it('should handle zero points correctly', async () => {
            const result = await game.addPoints(mockUserId, mockSkillName, 0);
            
            expect(data.getSkillData).toHaveBeenCalledWith(mockUserId, mockSkillName);
            expect(data.writeSkillData).not.toHaveBeenCalled();
            expect(data.addHistoryEvent).not.toHaveBeenCalled();
            expect(result.familiarity).toBe(25);
        });

        it('should add positive points correctly', async () => {
            const pointsToAdd = 15;
            const expectedNewFamiliarity = 40;

            const result = await game.addPoints(mockUserId, mockSkillName, pointsToAdd);

            // Проверяем что данные обновились
            expect(data.writeSkillData).toHaveBeenCalledWith(mockUserId, {
                id: mockSkill.id,
                user_id: mockUserId,
                name: mockSkill.name,
                familiarity: expectedNewFamiliarity,
                description: mockSkill.description,
                complexity: mockSkill.complexity
            });

            // Проверяем что создалась запись в истории
            expect(data.addHistoryEvent).toHaveBeenCalledWith(mockUserId, {
                skill_id: mockSkill.id,
                user_id: mockUserId,
                event_type: 'points_increased',
                notes: expect.stringContaining(`Points added: ${pointsToAdd}`)
            });

            expect(result.familiarity).toBe(expectedNewFamiliarity);
        });

        it('should subtract negative points correctly', async () => {
            const pointsToSubtract = -10;
            const expectedNewFamiliarity = 15;

            await game.addPoints(mockUserId, mockSkillName, pointsToSubtract);

            expect(data.writeSkillData).toHaveBeenCalledWith(mockUserId, expect.objectContaining({
                familiarity: expectedNewFamiliarity
            }));

            expect(data.addHistoryEvent).toHaveBeenCalledWith(mockUserId, expect.objectContaining({
                event_type: 'points_decreased',
                notes: expect.stringContaining('Points removed: -10')
            }));
        });

        it('should enforce familiarity bounds (0-100)', async () => {
            // Тест верхней границы - добавляем много очков
            await game.addPoints(mockUserId, mockSkillName, 100);
            expect(data.writeSkillData).toHaveBeenCalledWith(mockUserId, expect.objectContaining({
                familiarity: 100 // не должно превышать 100
            }));

            // Тест нижней границы - отнимаем много очков
            await game.addPoints(mockUserId, mockSkillName, -50);
            expect(data.writeSkillData).toHaveBeenCalledWith(mockUserId, expect.objectContaining({
                familiarity: 0 // не должно быть меньше 0
            }));
        });

        it('should handle non-numeric points input', async () => {
            // String numbers должны конвертироваться
            await game.addPoints(mockUserId, mockSkillName, '15');
            expect(data.writeSkillData).toHaveBeenCalledWith(mockUserId, expect.objectContaining({
                familiarity: 40 // 25 + 15
            }));

            // Очищаем моки перед следующим тестом
            jest.clearAllMocks();
            data.getSkillData.mockResolvedValue(mockSkill);
            data.writeSkillData.mockResolvedValue(mockSkill);
            data.addHistoryEvent.mockResolvedValue({});

            // NaN должен стать 0 - и все равно вызываться getSkillData, но не writeSkillData
            await game.addPoints(mockUserId, mockSkillName, 'invalid');
            expect(data.getSkillData).toHaveBeenCalled(); // вызывается для получения текущего навыка
            expect(data.writeSkillData).not.toHaveBeenCalled(); // не должно записывать при 0 очках
        });

        it('should handle missing skill error', async () => {
            data.getSkillData.mockResolvedValue(null);

            await expect(game.addPoints(mockUserId, 'NonExistentSkill', 10))
                .rejects.toThrow('Навык с именем NonExistentSkill не найден для пользователя test_user');
        });

        it('should handle database errors gracefully', async () => {
            const dbError = new Error('Database connection failed');
            data.writeSkillData.mockRejectedValue(dbError);

            await expect(game.addPoints(mockUserId, mockSkillName, 10))
                .rejects.toThrow(dbError);
                
            expect(data.getSkillData).toHaveBeenCalled();
        });

        it('should preserve all skill fields when updating', async () => {
            await game.addPoints(mockUserId, mockSkillName, 10);

            expect(data.writeSkillData).toHaveBeenCalledWith(mockUserId, {
                id: mockSkill.id,
                user_id: mockUserId,
                name: mockSkill.name,
                familiarity: 35, // 25 + 10
                description: mockSkill.description,
                complexity: mockSkill.complexity
            });
        });
    });

    describe('recalculateSkillProgress function', () => {
        const mockUserId = 'test_user';
        const mockSkillName = 'TestSkill';
        const mockSkill = {
            id: 1,
            name: mockSkillName,
            familiarity: 45
        };

        beforeEach(() => {
            data.getSkillData.mockResolvedValue(mockSkill);
        });

        it('should validate required parameters', async () => {
            // Тест отсутствующего userId
            await expect(game.recalculateSkillProgress(null, mockSkillName))
                .rejects.toThrow('userId is required for recalculateSkillProgress.');

            // Тест отсутствующего skillName
            await expect(game.recalculateSkillProgress(mockUserId, null))
                .rejects.toThrow('skillName is required for recalculateSkillProgress.');
        });

        it('should return calculated level based on current familiarity', async () => {
            const result = await game.recalculateSkillProgress(mockUserId, mockSkillName);

            expect(data.getSkillData).toHaveBeenCalledWith(mockUserId, mockSkillName);
            expect(result.level).toBe(4); // 45 / 10 = 4
            expect(result.currentLevelPoints).toBe(5); // 45 % 10 = 5
            expect(result.progress).toBe(50); // (5 / 10) * 100 = 50
            expect(result.familiarity).toBe(45);
        });

        it('should handle missing skill error', async () => {
            data.getSkillData.mockResolvedValue(null);

            await expect(game.recalculateSkillProgress(mockUserId, 'NonExistentSkill'))
                .rejects.toThrow('Навык с именем NonExistentSkill не найден для пользователя test_user при пересчете прогресса.');
        });

        it('should handle database errors gracefully', async () => {
            const dbError = new Error('Database connection failed');
            data.getSkillData.mockRejectedValue(dbError);

            await expect(game.recalculateSkillProgress(mockUserId, mockSkillName))
                .rejects.toThrow(dbError);
        });

        it('should work with edge case familiarity values', async () => {
            // Тест с familiarity = 0
            data.getSkillData.mockResolvedValue({ ...mockSkill, familiarity: 0 });
            let result = await game.recalculateSkillProgress(mockUserId, mockSkillName);
            expect(result.level).toBe(0);
            expect(result.progress).toBe(0);

            // Тест с familiarity = 100
            data.getSkillData.mockResolvedValue({ ...mockSkill, familiarity: 100 });
            result = await game.recalculateSkillProgress(mockUserId, mockSkillName);
            expect(result.level).toBe(10);
            expect(result.progress).toBe(0);
        });
    });

    describe('Integration scenarios', () => {
        const mockUserId = 'integration_user';
        const mockSkillName = 'IntegrationSkill';
        
        it('should maintain consistency between addPoints and recalculateSkillProgress', async () => {
            const initialSkill = { id: 1, name: mockSkillName, familiarity: 20 };
            const updatedSkill = { ...initialSkill, familiarity: 35 };

            data.getSkillData
                .mockResolvedValueOnce(initialSkill) // для addPoints
                .mockResolvedValueOnce(updatedSkill); // для recalculateSkillProgress
            data.writeSkillData.mockResolvedValue(updatedSkill);
            data.addHistoryEvent.mockResolvedValue({});

            // Добавляем очки
            const addResult = await game.addPoints(mockUserId, mockSkillName, 15);
            
            // Пересчитываем прогресс
            const recalcResult = await game.recalculateSkillProgress(mockUserId, mockSkillName);

            // Результаты должны быть одинаковыми
            expect(addResult.level).toBe(recalcResult.level);
            expect(addResult.progress).toBe(recalcResult.progress);
            expect(addResult.familiarity).toBe(recalcResult.familiarity);
        });

        it('should handle multiple point additions correctly', async () => {
            let currentFamiliarity = 10;
            
            data.getSkillData.mockImplementation(() => 
                Promise.resolve({ id: 1, name: mockSkillName, familiarity: currentFamiliarity })
            );
            
            data.writeSkillData.mockImplementation((userId, skillData) => {
                currentFamiliarity = skillData.familiarity;
                return Promise.resolve(skillData);
            });
            
            data.addHistoryEvent.mockResolvedValue({});

            // Первое добавление
            let result = await game.addPoints(mockUserId, mockSkillName, 5);
            expect(result.familiarity).toBe(15);
            expect(result.level).toBe(1);

            // Второе добавление
            result = await game.addPoints(mockUserId, mockSkillName, 10);
            expect(result.familiarity).toBe(25);
            expect(result.level).toBe(2);

            // Третье добавление с превышением лимита
            result = await game.addPoints(mockUserId, mockSkillName, 80);
            expect(result.familiarity).toBe(100); // должно ограничиться 100
            expect(result.level).toBe(10);
        });
    });
}); 