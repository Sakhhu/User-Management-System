// MongoDB initialization script
// This script runs when MongoDB container starts for the first time

db = db.getSiblingDB('user_management');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email', 'password', 'role', 'status'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 2,
          maxLength: 50,
          description: 'must be a string and is required'
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          description: 'must be a valid email address and is required'
        },
        password: {
          bsonType: 'string',
          minLength: 6,
          description: 'must be a string of at least 6 characters and is required'
        },
        role: {
          enum: ['admin', 'manager', 'user'],
          description: 'must be one of: admin, manager, user'
        },
        status: {
          enum: ['active', 'inactive'],
          description: 'must be either active or inactive'
        }
      }
    }
  }
});

db.createCollection('roles', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'description', 'permissions', 'level'],
      properties: {
        name: {
          enum: ['admin', 'manager', 'user'],
          description: 'must be one of: admin, manager, user'
        },
        description: {
          bsonType: 'string',
          minLength: 10,
          maxLength: 200,
          description: 'must be a string between 10 and 200 characters'
        },
        level: {
          bsonType: 'int',
          minimum: 1,
          maximum: 3,
          description: 'must be an integer between 1 and 3'
        }
      }
    }
  }
});

db.createCollection('auditlogs');

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ status: 1 });
db.users.createIndex({ createdAt: -1 });

db.roles.createIndex({ name: 1 }, { unique: true });
db.roles.createIndex({ level: 1 });

db.auditlogs.createIndex({ userId: 1, timestamp: -1 });
db.auditlogs.createIndex({ action: 1, timestamp: -1 });
db.auditlogs.createIndex({ resource: 1, timestamp: -1 });
db.auditlogs.createIndex({ timestamp: -1 });
db.auditlogs.createIndex({ userEmail: 1 });

print('Database initialized successfully');
