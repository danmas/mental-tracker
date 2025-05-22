const dotenv = require('dotenv');
const path = require('path');

// This setup file is expected to be run with the CWD being the DATA directory,
// as package.json (which will contain the jest config) is in DATA.
// So, path.resolve ensures that we are looking for .env.test in the DATA directory.
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

// You can add other global test setups here if needed, for example:
// console.log('Jest setup: Loaded .env.test variables');
// console.log('DB_DATABASE (in jest.setup.js):', process.env.DB_DATABASE);
