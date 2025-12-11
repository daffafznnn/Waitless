/* FILE: src/server/repositories/ServiceLocationRepository.ts */
import { Transaction } from 'sequelize';
import { ServiceLocation, ServiceLocationAttributes, ServiceLocationCreationAttributes } from '../models/service_location.model';
import { User } from '../models/user.model';

export class ServiceLocationRepository {
  /**
   * Create a new service location
   */
  async create(locationData: ServiceLocationCreationAttributes, transaction?: Transaction): Promise<ServiceLocation> {
    return ServiceLocation.create(locationData, { transaction });
  }

  /**
   * Find location by ID
   */
  async findById(id: number, transaction?: Transaction): Promise<ServiceLocation | null> {
    return ServiceLocation.findByPk(id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email'],
        },
      ],
      transaction,
    });
  }

  /**
   * Update location
   */
  async update(
    id: number,
    updates: Partial<ServiceLocationAttributes>,
    transaction?: Transaction
  ): Promise<[number, ServiceLocation[]]> {
    return ServiceLocation.update(updates, {
      where: { id },
      returning: true,
      transaction,
    });
  }

  /**
   * Delete location
   */
  async delete(id: number, transaction?: Transaction): Promise<number> {
    return ServiceLocation.destroy({
      where: { id },
      transaction,
    });
  }

  /**
   * Find all locations with pagination
   */
  async findAllPaginated(
    offset: number = 0,
    limit: number = 20,
    transaction?: Transaction
  ): Promise<{ rows: ServiceLocation[]; count: number }> {
    return ServiceLocation.findAndCountAll({
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email'],
        },
      ],
      where: { is_active: true },
      order: [['name', 'ASC']],
      offset,
      limit,
      transaction,
    });
  }

  /**
   * Find locations by owner ID
   */
  async findByOwnerId(ownerId: number, transaction?: Transaction): Promise<ServiceLocation[]> {
    return ServiceLocation.findAll({
      where: { 
        owner_id: ownerId,
        is_active: true,
      },
      order: [['name', 'ASC']],
      transaction,
    });
  }

  /**
   * Find locations by city
   */
  async findByCity(city: string, transaction?: Transaction): Promise<ServiceLocation[]> {
    return ServiceLocation.findAll({
      where: { 
        city,
        is_active: true,
      },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name'],
        },
      ],
      order: [['name', 'ASC']],
      transaction,
    });
  }

  /**
   * Search locations by name
   */
  async searchByName(searchTerm: string, transaction?: Transaction): Promise<ServiceLocation[]> {
    const { Op } = require('sequelize');
    
    return ServiceLocation.findAll({
      where: { 
        name: { [Op.like]: `%${searchTerm}%` },
        is_active: true,
      },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name'],
        },
      ],
      order: [['name', 'ASC']],
      transaction,
    });
  }

  /**
   * Check if location name exists for an owner
   */
  async existsByNameAndOwner(
    name: string,
    ownerId: number,
    excludeId?: number,
    transaction?: Transaction
  ): Promise<boolean> {
    const { Op } = require('sequelize');
    const whereClause: any = {
      name,
      owner_id: ownerId,
    };

    if (excludeId) {
      whereClause.id = { [Op.ne]: excludeId };
    }

    const count = await ServiceLocation.count({
      where: whereClause,
      transaction,
    });
    
    return count > 0;
  }

  /**
   * Get location statistics
   */
  async getLocationStats(
    locationId: number,
    transaction?: Transaction
  ): Promise<{
    totalCounters: number;
    activeCounters: number;
    totalMembers: number;
  }> {
    const { sequelize } = require('../db');

    const [results] = await sequelize.query(`
      SELECT 
        (SELECT COUNT(*) FROM counters WHERE location_id = ?) as total_counters,
        (SELECT COUNT(*) FROM counters WHERE location_id = ? AND is_active = 1) as active_counters,
        (SELECT COUNT(*) FROM location_members WHERE location_id = ? AND is_active = 1) as total_members
    `, {
      replacements: [locationId, locationId, locationId],
      type: sequelize.QueryTypes.SELECT,
      transaction,
    });

    return {
      totalCounters: parseInt(results?.total_counters || '0'),
      activeCounters: parseInt(results?.active_counters || '0'),
      totalMembers: parseInt(results?.total_members || '0'),
    };
  }

  /**
   * Set location active status
   */
  async setActiveStatus(
    id: number,
    isActive: boolean,
    transaction?: Transaction
  ): Promise<[number, ServiceLocation[]]> {
    return ServiceLocation.update(
      { is_active: isActive },
      {
        where: { id },
        returning: true,
        transaction,
      }
    );
  }
}