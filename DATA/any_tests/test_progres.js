async function testProgressConsistency() {
    const API_URL = 'http://localhost:3000';
    
    try {
        console.log('=== Тест согласованности progress для навыка drawing ===\n');

        // 1. Получаем progress из общего списка навыков
        const allSkills = await fetch(`${API_URL}/skills`)
            .then(res => res.json());
        const drawingFromAll = allSkills.find(skill => skill.code === 'drawing');
        const progressFromAll = drawingFromAll.progress;

        console.log('Progress из /skills:', progressFromAll);

        // 2. Получаем progress напрямую через endpoint навыка
        const drawingDirect = await fetch(`${API_URL}/skills/drawing`)
            .then(res => res.json());
        const progressDirect = drawingDirect.progress;

        console.log('Progress из /skills/drawing:', progressDirect);

        // Сравниваем значения
        console.log('\nЗначения совпадают?', progressFromAll === progressDirect);
        if (progressFromAll !== progressDirect) {
            console.log('ОШИБКА: Разные значения progress для одного навыка!');
            console.log(`/skills возвращает: ${progressFromAll}`);
            console.log(`/skills/drawing возвращает: ${progressDirect}`);
        }

        // Дополнительно выводим текущие очки и уровень для контекста
        console.log('\nКонтекст:');
        console.log('Текущие очки:', drawingDirect.currentPoints);
        console.log('Уровень:', drawingDirect.level);

    } catch (error) {
        console.error('Ошибка при выполнении теста:', error);
    }
}

testProgressConsistency();