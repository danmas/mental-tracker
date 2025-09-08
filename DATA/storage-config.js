// Конфигурация типа хранилища
// Возможные значения: 'sqlite', 'postgresql', 'file', 'memory'
const STORAGE_TYPE = process.env.STORAGE_TYPE || 'sqlite';

// Фабрика для создания адаптера хранилища
function createStorageAdapter() {
    switch (STORAGE_TYPE) {
        case 'sqlite':
            return require('./sqlite-data');
        case 'postgresql':
            return require('./pg-data');
        case 'file':
            // TODO: Реализовать файловый адаптер
            throw new Error('File storage adapter not implemented yet');
        case 'memory':
            // TODO: Реализовать in-memory адаптер для тестов
            throw new Error('Memory storage adapter not implemented yet');
        default:
            throw new Error(`Unknown storage type: ${STORAGE_TYPE}`);
    }
}

module.exports = {
    STORAGE_TYPE,
    createStorageAdapter
}; 