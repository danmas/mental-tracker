const fs = require('fs').promises;
const mock = require('mock-fs'); // Мокируем файловую систему
const path = require('path');
const { ensureUserFilesExist } = require('../public/data'); // Импортируем функцию для тестирования

describe('ensureUserFilesExist', () => {
    const user = 'testUser'; // Логин тестового пользователя

    // Пути к файлам данных для тестового пользователя
    const skillsFilePath = path.join(__dirname, `../skills_${user}.json`);
    const historyFilePath = path.join(__dirname, `../history_${user}.json`);
    const actionsFilePath = path.join(__dirname, `../actions_${user}.json`);

    beforeEach(() => {
        // Мокируем файловую систему перед каждым тестом
        mock({
            [skillsFilePath]: '', // Файл не существует
            [historyFilePath]: '', // Файл не существует
            [actionsFilePath]: ''  // Файл не существует
        });
    });

    afterEach(() => {
        // Восстанавливаем реальную файловую систему после каждого теста
        mock.restore();
    });

    it('должен создавать файлы данных, если они не существуют', async () => {
        // Вызываем функцию для создания файлов
        await ensureUserFilesExist(user);

        // Проверяем, что файлы созданы
        const skillsFileExists = await fs.access(skillsFilePath).then(() => true).catch(() => false);
        const historyFileExists = await fs.access(historyFilePath).then(() => true).catch(() => false);
        const actionsFileExists = await fs.access(actionsFilePath).then(() => true).catch(() => false);

        expect(skillsFileExists).toBe(true);
        expect(historyFileExists).toBe(true);
        expect(actionsFileExists).toBe(true);

        // Проверяем содержимое файлов
        const skillsContent = await fs.readFile(skillsFilePath, 'utf-8');
        const historyContent = await fs.readFile(historyFilePath, 'utf-8');
        const actionsContent = await fs.readFile(actionsFilePath, 'utf-8');

        expect(JSON.parse(skillsContent)).toEqual({ skills: [] });
        expect(JSON.parse(historyContent)).toEqual({ skills: {} });
        expect(JSON.parse(actionsContent)).toEqual({ activities: {} });
    });

    it('не должен перезаписывать существующие файлы', async () => {
        // Создаем файлы с начальными данными
        await fs.writeFile(skillsFilePath, JSON.stringify({ skills: ['testSkill'] }, null, 4));
        await fs.writeFile(historyFilePath, JSON.stringify({ skills: { testSkill: {} } }, null, 4));
        await fs.writeFile(actionsFilePath, JSON.stringify({ activities: { testActivity: {} } }, null, 4));

        // Вызываем функцию для создания файлов
        await ensureUserFilesExist(user);

        // Проверяем, что файлы не перезаписаны
        const skillsContent = await fs.readFile(skillsFilePath, 'utf-8');
        const historyContent = await fs.readFile(historyFilePath, 'utf-8');
        const actionsContent = await fs.readFile(actionsFilePath, 'utf-8');

        expect(JSON.parse(skillsContent)).toEqual({ skills: ['testSkill'] });
        expect(JSON.parse(historyContent)).toEqual({ skills: { testSkill: {} } });
        expect(JSON.parse(actionsContent)).toEqual({ activities: { testActivity: {} } });
    });
});