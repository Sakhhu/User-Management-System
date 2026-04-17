const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
const bcrypt = require('bcryptjs');

const initializeDatabase = async () => {
  try {
    console.log('Initializing database...');

    // Initialize default roles
    await Role.initializeDefaultRoles();
    console.log('Default roles initialized');

    // Create default admin user if none exists
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      const adminPassword = await bcrypt.hash('Admin123!', 12);
      const admin = new User({
        name: 'System Administrator',
        email: 'admin@example.com',
        password: adminPassword,
        role: 'admin',
        status: 'active'
      });
      
      await admin.save();
      console.log('Default admin user created (email: admin@example.com, password: Admin123!)');
    }

    // Create sample manager user if none exists
    const managerUser = await User.findOne({ role: 'manager' });
    if (!managerUser) {
      const managerPassword = await bcrypt.hash('Manager123!', 12);
      const manager = new User({
        name: 'Manager User',
        email: 'manager@example.com',
        password: managerPassword,
        role: 'manager',
        status: 'active',
        createdBy: adminUser._id
      });
      
      await manager.save();
      console.log('Default manager user created (email: manager@example.com, password: Manager123!)');
    }

    // Create sample regular user if none exists
    const regularUser = await User.findOne({ role: 'user' });
    if (!regularUser) {
      const userPassword = await bcrypt.hash('User123!', 12);
      const user = new User({
        name: 'Regular User',
        email: 'user@example.com',
        password: userPassword,
        role: 'user',
        status: 'active',
        createdBy: adminUser._id
      });
      
      await user.save();
      console.log('Default regular user created (email: user@example.com, password: User123!)');
    }

    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

const clearDatabase = async () => {
  try {
    console.log('Clearing database...');
    
    await User.deleteMany({});
    await Role.deleteMany({});
    
    console.log('Database cleared successfully');
  } catch (error) {
    console.error('Database clearing failed:', error);
    throw error;
  }
};

const seedSampleData = async () => {
  try {
    console.log('Seeding sample data...');

    // Get admin user for createdBy references
    const adminUser = await User.findOne({ role: 'admin' });

    // Create sample users
    const sampleUsers = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'User123!',
        role: 'user',
        status: 'active',
        createdBy: adminUser._id
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        password: 'User123!',
        role: 'user',
        status: 'active',
        createdBy: adminUser._id
      },
      {
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        password: 'Manager123!',
        role: 'manager',
        status: 'active',
        createdBy: adminUser._id
      },
      {
        name: 'Alice Brown',
        email: 'alice.brown@example.com',
        password: 'User123!',
        role: 'user',
        status: 'inactive',
        createdBy: adminUser._id
      }
    ];

    for (const userData of sampleUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        console.log(`Sample user created: ${userData.email}`);
      }
    }

    console.log('Sample data seeding completed successfully');
  } catch (error) {
    console.error('Sample data seeding failed:', error);
    throw error;
  }
};

module.exports = {
  initializeDatabase,
  clearDatabase,
  seedSampleData
};
