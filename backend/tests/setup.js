const { sequelize } = require('../models');

// Setup before all tests
beforeAll(async () => {
  // Sync database for testing
  await sequelize.sync({ force: false });
});

// Cleanup after all tests
afterAll(async () => {
  await sequelize.close();
});

