// Определяем большое число в виде строки
// let largeNumber = "1234567890123456789012345678901234567890";
//--let largeNumber = "9973786976294838211";
//let largeNumber = "34359738368";
let largeNumber = "1125899906842624";
// Преобразуем строку в BigInt
let bigIntNumber = BigInt(largeNumber);

// Преобразуем BigInt в двоичное представление
let binaryString = bigIntNumber.toString(2);

console.log(binaryString); // Выводит двоичное представление числа


binaryString = "100000000000000000000000000000000000000000000000000"; // Пример двоичной строки
const decimalNumber = parseInt(binaryString, 2);
console.log(decimalNumber);
