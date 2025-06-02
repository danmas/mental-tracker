const { createStorageAdapter, STORAGE_TYPE } = require('../storage-config');

describe('Storage Configuration', () => {
  const originalStorageType = process.env.STORAGE_TYPE;

  afterEach(() => {
    // Восстанавливаем оригинальное значение
    if (originalStorageType) {
      process.env.STORAGE_TYPE = originalStorageType;
    } else {
      delete process.env.STORAGE_TYPE;
    }
  });

  it('should default to sqlite when no STORAGE_TYPE is set', () => {
    delete process.env.STORAGE_TYPE;
    
    // Перезагружаем модуль чтобы применить изменения
    delete require.cache[require.resolve('../storage-config')];
    const { STORAGE_TYPE } = require('../storage-config');
    
    expect(STORAGE_TYPE).toBe('sqlite');
  });

  it('should use STORAGE_TYPE from environment variable', () => {
    process.env.STORAGE_TYPE = 'postgresql';
    
    delete require.cache[require.resolve('../storage-config')];
    const { STORAGE_TYPE } = require('../storage-config');
    
    expect(STORAGE_TYPE).toBe('postgresql');
  });

  it('should create SQLite adapter when STORAGE_TYPE is sqlite', () => {
    process.env.STORAGE_TYPE = 'sqlite';
    
    delete require.cache[require.resolve('../storage-config')];
    const { createStorageAdapter } = require('../storage-config');
    
    const adapter = createStorageAdapter();
    expect(adapter).toBeDefined();
    expect(typeof adapter.connect).toBe('function');
    expect(typeof adapter.readData).toBe('function');
    expect(typeof adapter.writeData).toBe('function');
    expect(typeof adapter.deleteData).toBe('function');
  });

  it('should create PostgreSQL adapter when STORAGE_TYPE is postgresql', () => {
    process.env.STORAGE_TYPE = 'postgresql';
    
    delete require.cache[require.resolve('../storage-config')];
    const { createStorageAdapter } = require('../storage-config');
    
    const adapter = createStorageAdapter();
    expect(adapter).toBeDefined();
    expect(typeof adapter.connect).toBe('function');
    expect(typeof adapter.readData).toBe('function');
    expect(typeof adapter.writeData).toBe('function');
    expect(typeof adapter.deleteData).toBe('function');
  });

  it('should throw error for unsupported storage type', () => {
    process.env.STORAGE_TYPE = 'redis';
    
    delete require.cache[require.resolve('../storage-config')];
    const { createStorageAdapter } = require('../storage-config');
    
    expect(() => createStorageAdapter()).toThrow('Unknown storage type: redis');
  });

  it('should throw error for file storage (not implemented)', () => {
    process.env.STORAGE_TYPE = 'file';
    
    delete require.cache[require.resolve('../storage-config')];
    const { createStorageAdapter } = require('../storage-config');
    
    expect(() => createStorageAdapter()).toThrow('File storage adapter not implemented yet');
  });

  it('should throw error for memory storage (not implemented)', () => {
    process.env.STORAGE_TYPE = 'memory';
    
    delete require.cache[require.resolve('../storage-config')];
    const { createStorageAdapter } = require('../storage-config');
    
    expect(() => createStorageAdapter()).toThrow('Memory storage adapter not implemented yet');
  });
}); 