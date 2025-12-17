/* FILE: src/server/repositories/CounterRepository.ts */
import { Transaction, Op, QueryTypes } from 'sequelize';
import { sequelize } from '../db';
import { Counter, CounterAttributes, CounterCreationAttributes } from '../models/counter.model';
import { ServiceLocation } from '../models/service_location.model';

export class CounterRepository {
  /**
   * Create a new counter
   */
  async create(counterData: CounterCreationAttributes, transaction?: Transaction): Promise<Counter> {
    return Counter.create(counterData, { transaction });
  }

  /**
   * Find counter by ID
   */
  async findById(id: number, transaction?: Transaction): Promise<Counter | null> {
    return Counter.findByPk(id, {
      include: [
        {
          model: ServiceLocation,
          as: 'location',
          attributes: ['id', 'name', 'owner_id'],
        },
      ],
      transaction,
    });
  }

  /**
   * Find counter by ID (simple, no includes)
   */
  async findByIdSimple(id: number, transaction?: Transaction): Promise<Counter | null> {
    return Counter.findByPk(id, { transaction });
  }

  /**
   * Update counter
   */
  async update(
    id: number,
    updates: Partial<CounterAttributes>,
    transaction?: Transaction
  ): Promise<[number, Counter[]]> {
    return Counter.update(updates, {
      where: { id },
      returning: true,
      transaction,
    });
  }

  /**
   * Delete counter
   */
  async delete(id: number, transaction?: Transaction): Promise<number> {
    return Counter.destroy({
      where: { id },
      transaction,
    });
  }

  /**
   * Find all counters for a location
   */
  async findByLocationId(locationId: number, transaction?: Transaction): Promise<Counter[]> {
    return Counter.findAll({
      where: { location_id: locationId },
      order: [['name', 'ASC']],
      transaction,
    });
  }

  /**
   * Find active counters for a location
   */
  async findActiveByLocationId(locationId: number, transaction?: Transaction): Promise<Counter[]> {
    return Counter.findAll({
      where: { 
        location_id: locationId,
        is_active: true,
      },
      order: [['name', 'ASC']],
      transaction,
    });
  }

  /**
   * Find counter by location and prefix
   */
  async findByLocationAndPrefix(
    locationId: number,
    prefix: string,
    transaction?: Transaction
  ): Promise<Counter | null> {
    return Counter.findOne({
      where: { 
        location_id: locationId,
        prefix: prefix.toUpperCase(),
      },
      transaction,
    });
  }

  /**
   * Check if counter is currently open
   */
  async isCounterOpen(counterId: number, transaction?: Transaction): Promise<boolean> {
    const counter = await this.findByIdSimple(counterId, transaction);
    if (!counter || !counter.is_active) {
      return false;
    }

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 8); // HH:MM:SS format
    
    return currentTime >= counter.open_time && currentTime <= counter.close_time;
  }

  /**
   * Get counter capacity status for today
   */
  async getCapacityStatus(
    counterId: number,
    date: string,
    transaction?: Transaction
  ): Promise<{ 
    capacity: number; 
    issued: number; 
    available: number; 
    isAtCapacity: boolean; 
  }> {
    const counter = await this.findByIdSimple(counterId, transaction);
    if (!counter) {
      throw new Error('Counter not found');
    }

    // Count tickets issued today for this counter
    const results = await sequelize.query(`
      SELECT COUNT(*) as issued_count 
      FROM tickets 
      WHERE counter_id = ? AND date_for = ?
    `, {
      replacements: [counterId, date],
      type: QueryTypes.SELECT,
      transaction,
    }) as Array<{ issued_count: string }>;

    const issuedCount = parseInt(results[0]?.issued_count || '0');
    const available = Math.max(0, counter.capacity_per_day - issuedCount);
    
    return {
      capacity: counter.capacity_per_day,
      issued: issuedCount,
      available,
      isAtCapacity: available === 0,
    };
  }

  /**
   * Get all counters with their current status
   */
  async findAllWithStatus(
    locationId: number,
    date: string,
    transaction?: Transaction
  ): Promise<Array<Counter & { 
    capacityStatus: { 
      capacity: number; 
      issued: number; 
      available: number; 
      isAtCapacity: boolean; 
    } 
  }>> {
    const counters = await this.findActiveByLocationId(locationId, transaction);
    
    const countersWithStatus = await Promise.all(
      counters.map(async (counter) => {
        const capacityStatus = await this.getCapacityStatus(counter.id, date, transaction);
        return {
          ...counter.toJSON(),
          capacityStatus,
        };
      })
    );

    return countersWithStatus as any;
  }

  /**
   * Check if counter name exists in location
   */
  async existsByNameInLocation(
    locationId: number,
    name: string,
    excludeId?: number,
    transaction?: Transaction
  ): Promise<boolean> {
    const whereClause: any = {
      location_id: locationId,
      name,
    };

    if (excludeId) {
      whereClause.id = { [Op.ne]: excludeId };
    }

    const count = await Counter.count({
      where: whereClause,
      transaction,
    });
    
    return count > 0;
  }

  /**
   * Check if prefix exists in location
   */
  async existsByPrefixInLocation(
    locationId: number,
    prefix: string,
    excludeId?: number,
    transaction?: Transaction
  ): Promise<boolean> {
    const whereClause: any = {
      location_id: locationId,
      prefix: prefix.toUpperCase(),
    };

    if (excludeId) {
      whereClause.id = { [Op.ne]: excludeId };
    }

    const count = await Counter.count({
      where: whereClause,
      transaction,
    });
    
    return count > 0;
  }

  /**
   * Find all counters
   */
  async findAll(transaction?: Transaction): Promise<Counter[]> {
    return Counter.findAll({
      include: [
        {
          model: ServiceLocation,
          as: 'location',
          attributes: ['id', 'name', 'owner_id'],
        },
      ],
      order: [['location_id', 'ASC'], ['name', 'ASC']],
      transaction,
    });
  }
}