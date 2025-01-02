// Бесплатный сервис специально для JSON
const axios = require('axios');
const BIN_ID = '6776e6f0ad19ca34f8e4af75';
const API_KEY = '$2a$10$Jn1kVlOFNV8oXzIJqx5xRemNZGyLAqGK5rerTT5lv43FPgN/qd.Si';
//$2a$10$PVL7lQvItBvbwEtyKtmrquOMxG1W9AQd5Cb70p2qVYjW2ytMsGB8.

async function readHistoryData() {
    try {
        const response = await axios.get(https://api.jsonbin.io/v3/b/${BIN_ID}, {
            headers: {
                'X-Master-Key': API_KEY
            }
        });
        return response.data.record;
        } catch (error) {
        console.error('Ошибка чтения файла history.json:', error);
        throw new Error(Ошибка чтения файла: ${historyFilePath});
    }
}

// --- Запись данных в JSON файлы ---

async function writeHistoryData(data) {
    try {
        await axios.put(https://api.jsonbin.io/v3/b/${BIN_ID}, data, {
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            }
        });
       } catch (error) {
        console.error('Ошибка записи в файл history.json:', error);
        throw new Error(Ошибка записи в файл: ${historyFilePath});
    }
}



async function testFunctions() {
    try {
        // Тест чтения
        console.log('Тестируем чтение...');
        const data = await readHistoryData();
        console.log('Прочитанные данные:', data);

        // Тест записи
        console.log('\nТестируем запись...');
        const newData = { test: 'тестовые данные', timestamp: new Date().toISOString() };
        await writeHistoryData(newData);
        console.log('Данные успешно записаны');

        // Проверяем, что данные записались
        const updatedData = await readHistoryData();
        console.log('\nПроверка записанных данных:', updatedData);

    } catch (error) {
        console.error('Ошибка при тестировании:', error.message);
    }
}

testFunctions();
