/* FILE: src/server/db/config.js */
require('dotenv').config();

const config = {
  development: {
    username: process.env.MYSQL_ADDON_USER || 'root',
    password: process.env.MYSQL_ADDON_PASSWORD || '',
    database: process.env.MYSQL_ADDON_DB || 'waitless_dev',
    host: process.env.MYSQL_ADDON_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_ADDON_PORT || '3306'),
    dialect: 'mysql',
    dialectOptions: {
      charset: 'utf8mb4',
      timezone: '+00:00',
      dateStrings: true,
      typeCast: true,
    },
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || '20'),
      min: parseInt(process.env.DB_POOL_MIN || '0'),
      acquire: parseInt(process.env.DB_POOL_ACQUIRE || '60000'),
      idle: parseInt(process.env.DB_POOL_IDLE || '10000'),
    },
    logging: false,
    timezone: '+00:00',
  },
  test: {
    username: process.env.MYSQL_ADDON_USER || 'root',
    password: process.env.MYSQL_ADDON_PASSWORD || '',
    database: (process.env.MYSQL_ADDON_DB || 'waitless') + '_test',
    host: process.env.MYSQL_ADDON_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_ADDON_PORT || '3306'),
    dialect: 'mysql',
    dialectOptions: {
      charset: 'utf8mb4',
      timezone: '+00:00',
      dateStrings: true,
      typeCast: true,
    },
    logging: false,
    timezone: '+00:00',
  },
  production: {
    username: process.env.MYSQL_ADDON_USER || 'root',
    password: process.env.MYSQL_ADDON_PASSWORD || '',
    database: process.env.MYSQL_ADDON_DB || 'waitless_prod',
    host: process.env.MYSQL_ADDON_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_ADDON_PORT || '3306'),
    dialect: 'mysql',
    dialectOptions: {
      charset: 'utf8mb4',
      timezone: '+00:00',
      dateStrings: true,
      typeCast: true,
      ssl: {
        rejectUnauthorized: false,
      },
    },
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || '20'),
      min: parseInt(process.env.DB_POOL_MIN || '5'),
      acquire: parseInt(process.env.DB_POOL_ACQUIRE || '60000'),
      idle: parseInt(process.env.DB_POOL_IDLE || '10000'),
    },
    logging: false,
    timezone: '+00:00',
  },
};

module.exports = config;