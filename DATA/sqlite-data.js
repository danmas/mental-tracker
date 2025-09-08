const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Путь к базе данных (может быть переопределен для тестов)
let dbPath = path.join(__dirname, 'cortex.db');
let db = null;

async function connect() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('SQLite connection error:', err.message);
        reject(err);
      } else {
        console.log('Connected to SQLite database:', dbPath);
        // Включаем поддержку внешних ключей
        db.run('PRAGMA foreign_keys = ON');
        resolve();
      }
    });
  });
}

async function createSchema() {
  // В SQLite нет схем, просто логируем
  console.log('SQLite: Schema concept not applicable, using database directly');
}

async function createTables() {
  const createSkillsTableQuery = `
    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      complexity INTEGER CHECK (complexity >= 1 AND complexity <= 10),
      familiarity INTEGER CHECK (familiarity >= 0 AND familiarity <= 100),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (user_id, name)
    )
  `;

  const createHistoryTableQuery = `
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      notes TEXT,
      event_date DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createActionsTableQuery = `
    CREATE TABLE IF NOT EXISTS actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
      action_type TEXT NOT NULL,
      details TEXT,
      duration_minutes INTEGER,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(createSkillsTableQuery, (err) => {
        if (err) {
          console.error('Error creating skills table:', err.message);
          reject(err);
          return;
        }
        console.log('Table "skills" created or already exists');
      });

      db.run(createHistoryTableQuery, (err) => {
        if (err) {
          console.error('Error creating history table:', err.message);
          reject(err);
          return;
        }
        console.log('Table "history" created or already exists');
      });

      db.run(createActionsTableQuery, (err) => {
        if (err) {
          console.error('Error creating actions table:', err.message);
          reject(err);
          return;
        }
        console.log('Table "actions" created or already exists');
        resolve();
      });
    });
  });
}

async function readData(tableName, criteria = {}, user_id = null) {
  let query = `SELECT * FROM ${tableName}`;
  const values = [];
  let conditions = [];

  if (user_id) {
    conditions.push('user_id = ?');
    values.push(user_id);
  }

  if (Object.keys(criteria).length > 0) {
    for (const key in criteria) {
      conditions.push(`${key} = ?`);
      values.push(criteria[key]);
    }
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  return new Promise((resolve, reject) => {
    db.all(query, values, (err, rows) => {
      if (err) {
        console.error(`Error reading data from ${tableName} (User: ${user_id}, Criteria: ${JSON.stringify(criteria)})`, err.message);
        reject(err);
      } else {
        console.log(`Data read from ${tableName}${conditions.length > 0 ? ' with conditions ' + JSON.stringify(criteria) + (user_id ? ' user_id ' + user_id : '') : ''}`);
        resolve(rows);
      }
    });
  });
}

async function writeData(tableName, data) {
  if (!data.user_id) {
    console.error(`Error writing data to ${tableName}: user_id is missing. Data: ${JSON.stringify(data)}`);
    throw new Error('user_id is required for write operations');
  }

  const columns = Object.keys(data);
  const values = Object.values(data);

  if (data.id) {
    // UPDATE
    const updateColumns = columns.filter(col => col !== 'id' && col !== 'user_id')
                                 .map(col => `${col} = ?`)
                                 .join(', ');
    
    const updateValues = columns.filter(col => col !== 'id' && col !== 'user_id').map(col => data[col]);
    
    let query;
    if (tableName === 'skills') {
      query = `UPDATE ${tableName} SET ${updateColumns ? updateColumns + ',' : ''} updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`;
    } else {
      query = `UPDATE ${tableName} SET ${updateColumns} WHERE id = ? AND user_id = ?`;
    }
    updateValues.push(data.id, data.user_id);

    return new Promise((resolve, reject) => {
      db.run(query, updateValues, function(err) {
        if (err) {
          console.error(`Error updating data in ${tableName} (User: ${data.user_id}, Data: ${JSON.stringify(data)})`, err.message);
          reject(err);
        } else {
          // Получаем обновленную запись
          db.get(`SELECT * FROM ${tableName} WHERE id = ?`, [data.id], (err, row) => {
            if (err) {
              reject(err);
            } else {
              console.log(`Data updated in ${tableName}`, row);
              resolve(row);
            }
          });
        }
      });
    });

  } else {
    // INSERT
    const placeholders = columns.map(() => '?').join(', ');
    const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

    return new Promise((resolve, reject) => {
      db.run(query, values, function(err) {
        if (err) {
          console.error(`Error inserting data into ${tableName} (User: ${data.user_id}, Data: ${JSON.stringify(data)})`, err.message);
          reject(err);
        } else {
          // Получаем вставленную запись
          db.get(`SELECT * FROM ${tableName} WHERE id = ?`, [this.lastID], (err, row) => {
            if (err) {
              reject(err);
            } else {
              console.log(`Data inserted into ${tableName}`, row);
              resolve(row);
            }
          });
        }
      });
    });
  }
}

async function deleteData(tableName, user_id, criteria = {}) {
  if (!user_id) {
    console.error(`Error deleting data from ${tableName}: user_id is missing.`);
    throw new Error('user_id is required for delete operations');
  }

  let query = `DELETE FROM ${tableName}`;
  const values = [];
  let conditions = [];

  // User ID всегда должен быть в условии
  conditions.push('user_id = ?');
  values.push(user_id);

  // Добавляем дополнительные критерии
  if (Object.keys(criteria).length > 0) {
    for (const key in criteria) {
      conditions.push(`${key} = ?`);
      values.push(criteria[key]);
    }
  }

  query += ` WHERE ${conditions.join(' AND ')}`;

  return new Promise((resolve, reject) => {
    db.run(query, values, function(err) {
      if (err) {
        console.error(`Error deleting data from ${tableName} (User: ${user_id}, Criteria: ${JSON.stringify(criteria)})`, err.message);
        reject(err);
      } else {
        const logMessage = `Data deleted from ${tableName} for user ${user_id}` +
                           (Object.keys(criteria).length > 0 ? ` with criteria ${JSON.stringify(criteria)}` : ' (all user records for this table)') +
                           `. Rows affected: ${this.changes}`;
        console.log(logMessage);
        resolve({ rowCount: this.changes });
      }
    });
  });
}

// Функция для закрытия соединения
function close() {
  return new Promise((resolve) => {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('Error closing SQLite database:', err.message);
        } else {
          console.log('SQLite database connection closed');
        }
        resolve();
      });
    } else {
      resolve();
    }
  });
}

module.exports = {
  connect,
  createSchema,
  createTables,
  readData,
  writeData,
  deleteData,
  close,
  get client() { return db; },
  get dbPath() { return dbPath; },
  set dbPath(newPath) { dbPath = newPath; }
}; 