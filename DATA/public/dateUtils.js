// Функция для форматирования даты в нужный формат
function formatDate(date) {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${day}.${month}.${year}-${hours}:${minutes}:${seconds}`;
}

// Функция для парсинга даты из нашего формата
function parseDate(dateString) {
    const [datePart, timePart] = dateString.split('-');
    const [day, month, year] = datePart.split('.');
    const [hours, minutes, seconds] = timePart.split(':');
    
    return new Date(year, month - 1, day, hours, minutes, seconds);
}

module.exports = {
    formatDate,
    parseDate
};