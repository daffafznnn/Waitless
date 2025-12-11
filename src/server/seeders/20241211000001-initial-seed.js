/* FILE: src/server/seeders/20241211000001-initial-seed.js */
'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Create owner user using upsert approach
      await queryInterface.bulkInsert('users', [{
        email: 'owner@waitless.app',
        password_hash: await bcrypt.hash('password123', 12),
        name: 'System Owner',
        phone: '+628123456789',
        role: 'OWNER',
        created_at: new Date(),
        updated_at: new Date(),
      }], {
        updateOnDuplicate: ['password_hash', 'name', 'phone', 'updated_at'],
        transaction,
      });

      // Get the owner ID by querying
      const owner = await queryInterface.sequelize.query(
        'SELECT id FROM users WHERE email = ? LIMIT 1',
        {
          replacements: ['owner@waitless.app'],
          type: Sequelize.QueryTypes.SELECT,
          transaction,
        }
      );
      
      const ownerId = owner[0]?.id;
      if (!ownerId) {
        throw new Error('Failed to create or find owner user');
      }

      // Create service location
      await queryInterface.bulkInsert('service_locations', [{
        owner_id: ownerId,
        name: 'inParfume Bandung',
        address: 'Jl. Braga No. 123, Bandung',
        city: 'Bandung',
        lat: -6.9175,
        lng: 107.6191,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      }], {
        updateOnDuplicate: ['name', 'address', 'city', 'lat', 'lng', 'updated_at'],
        transaction,
      });

      // Get location ID by querying
      const loc = await queryInterface.sequelize.query(
        'SELECT id FROM service_locations WHERE owner_id = ? AND name = ? LIMIT 1',
        {
          replacements: [ownerId, 'inParfume Bandung'],
          type: Sequelize.QueryTypes.SELECT,
          transaction,
        }
      );
      
      const locationId = loc[0]?.id;
      if (!locationId) {
        throw new Error('Failed to create or find service location');
      }

      // Create counters
      await queryInterface.bulkInsert('counters', [
        {
          location_id: locationId,
          name: 'Loket 1',
          description: 'Counter untuk layanan umum',
          prefix: 'A',
          open_time: '08:00:00',
          close_time: '17:00:00',
          capacity_per_day: 100,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          location_id: locationId,
          name: 'Loket 2',
          description: 'Counter untuk layanan prioritas',
          prefix: 'B',
          open_time: '08:00:00',
          close_time: '17:00:00',
          capacity_per_day: 80,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          location_id: locationId,
          name: 'Customer Service',
          description: 'Counter untuk customer service',
          prefix: 'C',
          open_time: '08:00:00',
          close_time: '18:00:00',
          capacity_per_day: 50,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ], {
        updateOnDuplicate: ['name', 'description', 'open_time', 'close_time', 'capacity_per_day', 'updated_at'],
        transaction,
      });

      // Create admin users for the location
      await queryInterface.bulkInsert('users', [
        {
          email: 'admin1@waitless.app',
          password_hash: await bcrypt.hash('admin123', 12),
          name: 'Admin Pertama',
          phone: '+628123456790',
          role: 'ADMIN',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          email: 'admin2@waitless.app',
          password_hash: await bcrypt.hash('admin123', 12),
          name: 'Admin Kedua',
          phone: '+628123456791',
          role: 'ADMIN',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ], {
        updateOnDuplicate: ['password_hash', 'name', 'phone', 'updated_at'],
        transaction,
      });

      // Get admin user IDs and create location memberships
      const adminEmails = ['admin1@waitless.app', 'admin2@waitless.app'];
      
      for (const email of adminEmails) {
        const adminUser = await queryInterface.sequelize.query(
          'SELECT id FROM users WHERE email = ? LIMIT 1',
          {
            replacements: [email],
            type: Sequelize.QueryTypes.SELECT,
            transaction,
          }
        );
        
        if (adminUser[0]?.id) {
          await queryInterface.bulkInsert('location_members', [{
            location_id: locationId,
            user_id: adminUser[0].id,
            role: 'ADMIN',
            is_active: true,
            created_at: new Date(),
          }], {
            updateOnDuplicate: ['role', 'is_active'],
            transaction,
          });
        }
      }

      await transaction.commit();
      console.log('✅ Initial seed data created successfully');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error creating seed data:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      await queryInterface.bulkDelete('location_members', null, { transaction });
      await queryInterface.bulkDelete('counters', null, { transaction });
      await queryInterface.bulkDelete('service_locations', null, { transaction });
      await queryInterface.bulkDelete('users', {
        email: {
          [Sequelize.Op.in]: ['owner@waitless.app', 'admin1@waitless.app', 'admin2@waitless.app']
        }
      }, { transaction });
      
      await transaction.commit();
      console.log('✅ Seed data removed successfully');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error removing seed data:', error);
      throw error;
    }
  },
};