/* FILE: src/server/repositories/LocationRepository.ts */
import { Transaction, Op, literal } from 'sequelize';
import { ServiceLocation, ServiceLocationAttributes, ServiceLocationCreationAttributes } from '../models/service_location.model';
import { User } from '../models/user.model';
import { Counter } from '../models/counter.model';

export class LocationRepository {
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
        {
          model: Counter,
          as: 'counters',
          where: { is_active: true },
          required: false,
        },
      ],
      transaction,
    });
  }

  /**
   * Find location by ID with minimal data
   */
  async findByIdSimple(id: number, transaction?: Transaction): Promise<ServiceLocation | null> {
    return ServiceLocation.findByPk(id, { transaction });
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
   * Find locations by owner ID
   */
  async findByOwnerId(ownerId: number, transaction?: Transaction): Promise<ServiceLocation[]> {
    return ServiceLocation.findAll({
      where: { owner_id: ownerId },
      include: [
        {
          model: Counter,
          as: 'counters',
          where: { is_active: true },
          required: false,
        },
      ],
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
      transaction,
    });
  }

  /**
   * Get all active locations with pagination
   */
  async findAllActive(
    offset: number = 0,
    limit: number = 20,
    transaction?: Transaction
  ): Promise<{ rows: ServiceLocation[]; count: number }> {
    return ServiceLocation.findAndCountAll({
      where: { is_active: true },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Counter,
          as: 'counters',
          where: { is_active: true },
          required: false,
        },
      ],
      offset,
      limit,
      order: [['created_at', 'DESC']],
      transaction,
    });
  }

  /**
   * Search locations by name
   */
  async search(
    query: string,
    offset: number = 0,
    limit: number = 20,
    transaction?: Transaction
  ): Promise<{ rows: ServiceLocation[]; count: number }> {
    return ServiceLocation.findAndCountAll({
      where: {
        [Op.and]: [
          { is_active: true },
          {
            [Op.or]: [
              { name: { [Op.like]: `%${query}%` } },
              { address: { [Op.like]: `%${query}%` } },
              { city: { [Op.like]: `%${query}%` } },
            ],
          },
        ],
      },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name'],
        },
      ],
      offset,
      limit,
      order: [['created_at', 'DESC']],
      transaction,
    });
  }

  /**
   * Find locations near coordinates
   */
  async findNearby(
    lat: number,
    lng: number,
    radiusKm: number = 10,
    transaction?: Transaction
  ): Promise<ServiceLocation[]> {
    return ServiceLocation.findAll({
      where: {
        is_active: true,
        lat: { [Op.ne]: null as any },
        lng: { [Op.ne]: null as any },
      },
      attributes: {
        include: [
          [
            literal(`(
              6371 * acos(
                cos(radians(${lat})) * 
                cos(radians(lat)) * 
                cos(radians(lng) - radians(${lng})) + 
                sin(radians(${lat})) * 
                sin(radians(lat))
              )
            )`),
            'distance'
          ]
        ]
      },
      having: literal(`distance < ${radiusKm}`),
      order: [literal('distance')],
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name'],
        },
      ],
      transaction,
    });
  }

  /**
   * Check if location exists for owner
   */
  async existsForOwner(ownerId: number, name: string, transaction?: Transaction): Promise<boolean> {
    const count = await ServiceLocation.count({
      where: { 
        owner_id: ownerId,
        name,
      },
      transaction,
    });
    return count > 0;
  }

  /**
   * Get all counters for a location
   */
  async getCountersByLocationId(locationId: number, transaction?: Transaction): Promise<Counter[]> {
    return Counter.findAll({
      where: { location_id: locationId },
      order: [['name', 'ASC']],
      transaction,
    });
  }
}