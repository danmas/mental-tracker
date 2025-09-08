const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function connect() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');
  } catch (err) {
    console.error('Connection error', err.stack);
  }
}

// Signature: deleteData(tableName, user_id, criteria = {})
// If criteria is empty, it deletes all records for that user_id in the table.
async function deleteData(tableName, user_id, criteria = {}) {
  if (!user_id) {
    console.error(`Error deleting data from mental.${tableName}: user_id is missing.`);
    throw new Error('user_id is required for delete operations');
  }

  let query = `DELETE FROM mental.${tableName}`;
  const values = [];
  let conditions = [];
  let placeholderIndex = 1;

  // User ID must always be part of the condition
  conditions.push(`user_id = $${placeholderIndex++}`);
  values.push(user_id);

  // Add other criteria if provided
  if (Object.keys(criteria).length > 0) {
    for (const key in criteria) {
      conditions.push(`${key} = $${placeholderIndex++}`);
      values.push(criteria[key]);
    }
  }
  // If criteria is empty, the query will be like "DELETE FROM ... WHERE user_id = $1"

  query += ` WHERE ${conditions.join(' AND ')}`;

  try {
    const res = await client.query(query, values);
    const logMessage = `Data deleted from mental.${tableName} for user ${user_id}` +
                       (Object.keys(criteria).length > 0 ? ` with criteria ${JSON.stringify(criteria)}` : ' (all user records for this table)') +
                       `. Rows affected: ${res.rowCount}`;
    console.log(logMessage);
    return { rowCount: res.rowCount };
  } catch (err) {
    console.error(`Error deleting data from mental.${tableName} (User: ${user_id}, Criteria: ${JSON.stringify(criteria)})`, err.stack);
    throw err;
  }
}

async function createSchema() {
  try {
    await client.query('CREATE SCHEMA IF NOT EXISTS mental');
    console.log('Schema "mental" created or already exists');
  } catch (err) {
    console.error('Schema creation error', err.stack);
  }
}

// Placeholder functions
async function createTables() {
  const createSkillsTableQuery = `
    CREATE TABLE IF NOT EXISTS mental.skills (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      complexity INTEGER CHECK (complexity >= 1 AND complexity <= 10),
      familiarity INTEGER CHECK (familiarity >= 0 AND familiarity <= 100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (user_id, name)
    )
  `;

  const createHistoryTableQuery = `
    CREATE TABLE IF NOT EXISTS mental.history (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      skill_id INTEGER REFERENCES mental.skills(id) ON DELETE CASCADE,
      event_type VARCHAR(50) NOT NULL,
      notes TEXT,
      event_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createActionsTableQuery = `
    CREATE TABLE IF NOT EXISTS mental.actions (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      skill_id INTEGER REFERENCES mental.skills(id) ON DELETE CASCADE,
      action_type VARCHAR(50) NOT NULL,
      details TEXT,
      duration_minutes INTEGER,
      completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    await client.query(createSkillsTableQuery);
    console.log('Table "mental.skills" created or already exists');
    await client.query(createHistoryTableQuery);
    console.log('Table "mental.history" created or already exists');
    await client.query(createActionsTableQuery);
    console.log('Table "mental.actions" created or already exists');
  } catch (err) {
    console.error('Error creating tables', err.stack);
  }
}

async function readData(tableName, criteria = {}, user_id = null) {
  let query = `SELECT * FROM mental.${tableName}`;
  const values = [];
  let conditions = [];
  let placeholderIndex = 1;

  if (user_id) {
    conditions.push(`user_id = $${placeholderIndex++}`);
    values.push(user_id);
  }

  if (Object.keys(criteria).length > 0) {
    for (const key in criteria) {
      conditions.push(`${key} = $${placeholderIndex++}`);
      values.push(criteria[key]);
    }
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  try {
    const res = await client.query(query, values);
    console.log(`Data read from mental.${tableName}${conditions.length > 0 ? ' with conditions ' + JSON.stringify(criteria) + (user_id ? ' user_id ' + user_id : '') : ''}`);
    return res.rows;
  } catch (err) {
    console.error(`Error reading data from mental.${tableName} (User: ${user_id}, Criteria: ${JSON.stringify(criteria)})`, err.stack);
    throw err; // Re-throw the error to be handled by the caller
  }
}

async function writeData(tableName, data) {
  // user_id must be present in data for all write operations now.
  if (!data.user_id) {
    console.error(`Error writing data to mental.${tableName}: user_id is missing. Data: ${JSON.stringify(data)}`);
    throw new Error('user_id is required for write operations');
  }

  const columns = Object.keys(data);
  const values = Object.values(data);
  let placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

  let query;

  if (data.id) { // Assuming 'id' means it's an update
    const updateColumns = columns.filter(col => col !== 'id' && col !== 'user_id') // user_id should not be updated, id is for WHERE
                                 .map((col, i) => `${col} = $${i + 1}`) // Placeholders shift
                                 .join(', ');
    
    const updateValues = columns.filter(col => col !== 'id' && col !== 'user_id').map(col => data[col]);
    let placeholderOffset = updateValues.length + 1;

    if (tableName === 'skills') { // Add updated_at for skills table
        query = `UPDATE mental.${tableName} SET ${updateColumns ? updateColumns + ',' : ''} updated_at = CURRENT_TIMESTAMP WHERE id = $${placeholderOffset++} AND user_id = $${placeholderOffset++} RETURNING *`;
    } else {
        query = `UPDATE mental.${tableName} SET ${updateColumns} WHERE id = $${placeholderOffset++} AND user_id = $${placeholderOffset++} RETURNING *`;
    }
    updateValues.push(data.id, data.user_id); // Add id and user_id for WHERE clause
    
    // Log for debugging update queries
    // console.log("Update Query:", query);
    // console.log("Update Values:", updateValues);

    try {
      const res = await client.query(query, updateValues);
      console.log(`Data updated in mental.${tableName}`, res.rows[0]);
      return res.rows[0];
    } catch (err) {
      console.error(`Error updating data in mental.${tableName} (User: ${data.user_id}, Data: ${JSON.stringify(data)})`, err.stack);
      throw err;
    }

  } else { // It's an insert
    query = `INSERT INTO mental.${tableName} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    // Log for debugging insert queries
    // console.log("Insert Query:", query);
    // console.log("Insert Values:", values);
    try {
      const res = await client.query(query, values);
      console.log(`Data inserted into mental.${tableName}`, res.rows[0]);
      return res.rows[0];
    } catch (err) {
      console.error(`Error inserting data into mental.${tableName} (User: ${data.user_id}, Data: ${JSON.stringify(data)})`, err.stack);
      throw err;
    }
  }
}

module.exports = {
  connect,
  createSchema,
  createTables,
  readData,
  writeData,
  deleteData, // Added deleteData
  client 
};
