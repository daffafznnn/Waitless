/* FILE: src/server/db/index.ts */
import { Sequelize, DataTypes, Transaction } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const config = require('./config.js');
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

export const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    dialectOptions: dbConfig.dialectOptions,
    pool: dbConfig.pool,
    logging: dbConfig.logging,
    timezone: dbConfig.timezone,
    define: {
      underscored: true,
      paranoid: false,
      timestamps: true,
    },
  }
);

export { DataTypes };

/**
 * Helper function to get a database transaction
 * @param options Transaction options
 * @returns Promise<Transaction>
 */
export const getTransaction = async (
  options?: {
    isolationLevel?: Transaction.ISOLATION_LEVELS;
  }
): Promise<Transaction> => {
  return sequelize.transaction({
    isolationLevel: options?.isolationLevel || Transaction.ISOLATION_LEVELS.READ_COMMITTED,
  });
};

/**
 * Test database connection
 */
export const testConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    throw error;
  }
};

/**
 * Connect to database and initialize models
 */
export const connectDatabase = async (): Promise<void> => {
  await testConnection();
};

/**
 * Close database connection
 */
export const closeConnection = async (): Promise<void> => {
  try {
    await sequelize.close();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
};

export default sequelize;