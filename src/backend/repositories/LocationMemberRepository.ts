/* FILE: src/server/repositories/LocationMemberRepository.ts */
import { Transaction, QueryTypes } from 'sequelize';
import { sequelize } from '../db';
import { LocationMember, LocationMemberAttributes, LocationMemberCreationAttributes } from '../models/location_member.model';
import { User } from '../models/user.model';
import { ServiceLocation } from '../models/service_location.model';

export class LocationMemberRepository {
  /**
   * Create a new location member
   */
  async create(memberData: LocationMemberCreationAttributes, transaction?: Transaction): Promise<LocationMember> {
    return LocationMember.create(memberData, { transaction });
  }

  /**
   * Find member by location and user
   */
  async findByLocationAndUser(
    locationId: number,
    userId: number,
    transaction?: Transaction
  ): Promise<LocationMember | null> {
    return LocationMember.findOne({
      where: {
        location_id: locationId,
        user_id: userId,
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: ServiceLocation,
          as: 'location',
          attributes: ['id', 'name'],
        },
      ],
      transaction,
    });
  }

  /**
   * Find all members for a location (including inactive)
   */
  async findByLocationId(locationId: number, transaction?: Transaction): Promise<LocationMember[]> {
    return LocationMember.findAll({
      where: {
        location_id: locationId,
        // NOTE: Removed is_active filter to include all staff
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone'],
        },
      ],
      order: [['created_at', 'ASC']],
      transaction,
    });
  }

  /**
   * Find only active members for a location
   */
  async findActiveByLocationId(locationId: number, transaction?: Transaction): Promise<LocationMember[]> {
    return LocationMember.findAll({
      where: {
        location_id: locationId,
        is_active: true,
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone'],
        },
      ],
      order: [['created_at', 'ASC']],
      transaction,
    });
  }

  /**
   * Find all locations for a user (including inactive memberships)
   */
  async findByUserId(userId: number, transaction?: Transaction): Promise<LocationMember[]> {
    return LocationMember.findAll({
      where: {
        user_id: userId,
        // NOTE: Removed is_active filter to include inactive memberships
      },
      include: [
        {
          model: ServiceLocation,
          as: 'location',
          attributes: ['id', 'name', 'address', 'city'],
        },
      ],
      order: [['created_at', 'ASC']],
      transaction,
    });
  }

  /**
   * Update member
   */
  async update(
    id: number,
    updates: Partial<LocationMemberAttributes>,
    transaction?: Transaction
  ): Promise<[number, LocationMember[]]> {
    return LocationMember.update(updates, {
      where: { id },
      returning: true,
      transaction,
    });
  }

  /**
   * Delete member by location and user
   */
  async deleteByLocationAndUser(
    locationId: number,
    userId: number,
    transaction?: Transaction
  ): Promise<number> {
    return LocationMember.destroy({
      where: {
        location_id: locationId,
        user_id: userId,
      },
      transaction,
    });
  }

  /**
   * Delete member by ID
   */
  async delete(id: number, transaction?: Transaction): Promise<number> {
    return LocationMember.destroy({
      where: { id },
      transaction,
    });
  }

  /**
   * Set member active status
   */
  async setActiveStatus(
    locationId: number,
    userId: number,
    isActive: boolean,
    transaction?: Transaction
  ): Promise<[number, LocationMember[]]> {
    return LocationMember.update(
      { is_active: isActive },
      {
        where: {
          location_id: locationId,
          user_id: userId,
        },
        returning: true,
        transaction,
      }
    );
  }

  /**
   * Check if user is member of location
   */
  async isMemberOfLocation(
    locationId: number,
    userId: number,
    transaction?: Transaction
  ): Promise<boolean> {
    const count = await LocationMember.count({
      where: {
        location_id: locationId,
        user_id: userId,
        is_active: true,
      },
      transaction,
    });

    return count > 0;
  }

  /**
   * Get member statistics for location
   */
  async getMemberStats(
    locationId: number,
    transaction?: Transaction
  ): Promise<{
    totalMembers: number;
    activeMembers: number;
    adminMembers: number;
  }> {
    const results = await sequelize.query(`
      SELECT 
        COUNT(*) as total_members,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_members,
        SUM(CASE WHEN role = 'ADMIN' AND is_active = 1 THEN 1 ELSE 0 END) as admin_members
      FROM location_members 
      WHERE location_id = ?
    `, {
      replacements: [locationId],
      type: QueryTypes.SELECT,
      transaction,
    }) as Array<{
      total_members: string;
      active_members: string;
      admin_members: string;
    }>;

    const result = results[0];
    return {
      totalMembers: parseInt(result?.total_members || '0'),
      activeMembers: parseInt(result?.active_members || '0'),
      adminMembers: parseInt(result?.admin_members || '0'),
    };
  }

  /**
   * Find members with pagination
   */
  async findByLocationIdPaginated(
    locationId: number,
    offset: number = 0,
    limit: number = 20,
    transaction?: Transaction
  ): Promise<{ rows: LocationMember[]; count: number }> {
    return LocationMember.findAndCountAll({
      where: {
        location_id: locationId,
        is_active: true,
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'role'],
        },
      ],
      order: [['created_at', 'ASC']],
      offset,
      limit,
      transaction,
    });
  }
}