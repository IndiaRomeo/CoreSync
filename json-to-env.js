const fs = require('fs');

// Cambia el path si tu archivo tiene otro nombre o ubicación
const filePath = './credenciales.json';

const json = fs.readFileSync(filePath, 'utf8');
const oneLine = JSON.stringify(JSON.parse(json));

console.log(oneLine);