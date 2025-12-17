/* FILE: src/server/services/AdminService.ts */
import { CounterRepository } from '../repositories/CounterRepository';
import { LocationRepository } from '../repositories/LocationRepository';
import { TicketRepository } from '../repositories/TicketRepository';
import { EventRepository } from '../repositories/EventRepository';
import { SummaryRepository } from '../repositories/SummaryRepository';
import { LocationMemberRepository } from '../repositories/LocationMemberRepository';
import { sequelize } from '../db';
import { Counter } from '../models/counter.model';

export interface CreateCounterRequest {
  locationId: number;
  name: string;
  description?: string;
  prefix: string;
  openTime: string;
  closeTime: string;
  capacityPerDay: number;
}

export interface UpdateCounterRequest {
  name?: string;
  description?: string;
  prefix?: string;
  openTime?: string;
  closeTime?: string;
  capacityPerDay?: number;
  isActive?: boolean;
}

export class AdminService {
  private counterRepository: CounterRepository;
  private locationRepository: LocationRepository;
  private ticketRepository: TicketRepository;
  private eventRepository: EventRepository;
  private summaryRepository: SummaryRepository;
  private locationMemberRepository: LocationMemberRepository;

  constructor() {
    this.counterRepository = new CounterRepository();
    this.locationRepository = new LocationRepository();
    this.ticketRepository = new TicketRepository();
    this.eventRepository = new EventRepository();
    this.summaryRepository = new SummaryRepository();
    this.locationMemberRepository = new LocationMemberRepository();
  }

  /**
   * Create a new counter
   */
  async createCounter(adminUserId: number, counterData: CreateCounterRequest): Promise<Counter> {
    const transaction = await sequelize.transaction();
    
    try {
      console.info('Creating new counter', { 
        adminUserId, 
        locationId: counterData.locationId, 
        counterName: counterData.name 
      });
      // Verify admin has access to the location
      await this.validateLocationAccess(adminUserId, counterData.locationId, transaction);

      // Check if counter name already exists in location
      const nameExists = await this.counterRepository.existsByNameInLocation(
        counterData.locationId,
        counterData.name,
        undefined,
        transaction
      );

      if (nameExists) {
        throw new Error('Counter name already exists in this location');
      }

      // Check if prefix already exists in location
      const prefixExists = await this.counterRepository.existsByPrefixInLocation(
        counterData.locationId,
        counterData.prefix,
        undefined,
        transaction
      );

      if (prefixExists) {
        throw new Error('Counter prefix already exists in this location');
      }

      // Create counter
      const counter = await this.counterRepository.create({
        location_id: counterData.locationId,
        name: counterData.name,
        description: counterData.description,
        prefix: counterData.prefix.toUpperCase(),
        open_time: counterData.openTime,
        close_time: counterData.closeTime,
        capacity_per_day: counterData.capacityPerDay,
        is_active: true,
      }, transaction);

      await transaction.commit();
      console.info('Counter created successfully', { 
        adminUserId, 
        counterId: counter.id, 
        counterName: counter.name,
        locationId: counter.location_id 
      });
      return counter;
    } catch (error) {
      await transaction.rollback();
      console.error('Failed to create counter', { 
        error: error instanceof Error ? error.message : error, 
        adminUserId, 
        locationId: counterData.locationId, 
        counterName: counterData.name 
      });
      throw error;
    }
  }

  /**
   * Update a counter
   */
  async updateCounter(
    adminUserId: number,
    counterId: number,
    updates: UpdateCounterRequest
  ): Promise<Counter> {
    const transaction = await sequelize.transaction();
    
    try {
      console.info({ 
        adminUserId, 
        counterId, 
        updates: Object.keys(updates) 
      }, 'Updating counter');

      // Get counter and verify access
      const counter = await this.counterRepository.findById(counterId, transaction);
      if (!counter) {
        console.warn({ adminUserId, counterId }, 'Counter not found for update');
        throw new Error('Counter not found');
      }

      await this.validateLocationAccess(adminUserId, counter.location_id, transaction);

      // Validate unique constraints if updating name or prefix
      if (updates.name && updates.name !== counter.name) {
        const nameExists = await this.counterRepository.existsByNameInLocation(
          counter.location_id,
          updates.name,
          counterId,
          transaction
        );
        if (nameExists) {
          throw new Error('Counter name already exists in this location');
        }
      }

      if (updates.prefix && updates.prefix !== counter.prefix) {
        const prefixExists = await this.counterRepository.existsByPrefixInLocation(
          counter.location_id,
          updates.prefix,
          counterId,
          transaction
        );
        if (prefixExists) {
          throw new Error('Counter prefix already exists in this location');
        }
      }

      // Update counter
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.prefix) updateData.prefix = updates.prefix.toUpperCase();
      if (updates.openTime) updateData.open_time = updates.openTime;
      if (updates.closeTime) updateData.close_time = updates.closeTime;
      if (updates.capacityPerDay) updateData.capacity_per_day = updates.capacityPerDay;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      await this.counterRepository.update(counterId, updateData, transaction);

      // Get updated counter
      const updatedCounter = await this.counterRepository.findById(counterId, transaction);
      
      await transaction.commit();
      console.info({ 
        adminUserId, 
        counterId, 
        counterName: updatedCounter!.name,
        updates: Object.keys(updates) 
      }, 'Counter updated successfully');
      return updatedCounter!;
    } catch (error) {
      await transaction.rollback();
      console.error({ 
        error, 
        adminUserId, 
        counterId, 
        updates: Object.keys(updates) 
      }, 'Failed to update counter');
      throw error;
    }
  }

  /**
   * Delete a counter
   */
  async deleteCounter(adminUserId: number, counterId: number): Promise<void> {
    const transaction = await sequelize.transaction();
    
    try {
      console.info({ adminUserId, counterId }, 'Deleting counter');

      // Get counter and verify access
      const counter = await this.counterRepository.findById(counterId, transaction);
      if (!counter) {
        console.warn({ adminUserId, counterId }, 'Counter not found for deletion');
        throw new Error('Counter not found');
      }

      await this.validateLocationAccess(adminUserId, counter.location_id, transaction);

      // Check if counter has any tickets
      const hasTickets = await this.ticketRepository.findByCounterAndDate(
        counterId,
        new Date().toISOString().split('T')[0],
        transaction
      );

      if (hasTickets.length > 0) {
        console.warn({ 
          adminUserId, 
          counterId, 
          ticketCount: hasTickets.length 
        }, 'Cannot delete counter with existing tickets');
        throw new Error('Cannot delete counter with existing tickets. Deactivate instead.');
      }

      // Delete counter
      await this.counterRepository.delete(counterId, transaction);
      
      await transaction.commit();
      console.info({ 
        adminUserId, 
        counterId, 
        counterName: counter.name 
      }, 'Counter deleted successfully');
    } catch (error) {
      await transaction.rollback();
      console.error({ 
        error, 
        adminUserId, 
        counterId 
      }, 'Failed to delete counter');
      throw error;
    }
  }

  /**
   * Get all counters for a location
   */
  async getLocationCounters(adminUserId: number, locationId: number): Promise<Counter[]> {
    const transaction = await sequelize.transaction();
    
    try {
      await this.validateLocationAccess(adminUserId, locationId, transaction);
      
      const counters = await this.counterRepository.findByLocationId(locationId, transaction);
      
      await transaction.commit();
      return counters;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get counters with status for a specific date
   */
  async getCountersWithStatus(
    adminUserId: number, 
    locationId: number, 
    date?: string
  ): Promise<any[]> {
    const transaction = await sequelize.transaction();
    
    try {
      await this.validateLocationAccess(adminUserId, locationId, transaction);
      
      const targetDate = date || new Date().toISOString().split('T')[0];
      const counters = await this.counterRepository.findAllWithStatus(locationId, targetDate, transaction);
      
      await transaction.commit();
      return counters;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get queue status for admin's counters
   */
  async getQueueStatus(adminUserId: number, counterId: number, date?: string) {
    const transaction = await sequelize.transaction();
    
    try {
      // Get counter and verify access
      const counter = await this.counterRepository.findById(counterId, transaction);
      if (!counter) {
        throw new Error('Counter not found');
      }

      await this.validateLocationAccess(adminUserId, counter.location_id, transaction);

      const targetDate = date || new Date().toISOString().split('T')[0];
      const status = await this.ticketRepository.getQueueStatus(counterId, targetDate, transaction);
      
      await transaction.commit();
      return status;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get activity log for a location
   */
  async getLocationActivity(
    adminUserId: number, 
    locationId: number, 
    date?: string,
    page: number = 1,
    limit: number = 50
  ) {
    const transaction = await sequelize.transaction();
    
    try {
      await this.validateLocationAccess(adminUserId, locationId, transaction);
      
      const targetDate = date || new Date().toISOString().split('T')[0];
      const offset = (page - 1) * limit;
      
      const activity = await this.eventRepository.getLocationActivityLog(
        locationId,
        targetDate,
        offset,
        limit,
        transaction
      );
      
      await transaction.commit();
      return activity;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get counter activity log
   */
  async getCounterActivity(
    adminUserId: number,
    counterId: number,
    date?: string,
    page: number = 1,
    limit: number = 50
  ) {
    const transaction = await sequelize.transaction();
    
    try {
      // Get counter and verify access
      const counter = await this.counterRepository.findById(counterId, transaction);
      if (!counter) {
        throw new Error('Counter not found');
      }

      await this.validateLocationAccess(adminUserId, counter.location_id, transaction);

      const targetDate = date || new Date().toISOString().split('T')[0];
      const offset = (page - 1) * limit;
      
      const activity = await this.eventRepository.getCounterActivityLog(
        counterId,
        targetDate,
        offset,
        limit,
        transaction
      );
      
      await transaction.commit();
      return activity;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get daily summary for admin's location
   */
  async getDailySummary(adminUserId: number, locationId: number, date?: string) {
    const transaction = await sequelize.transaction();
    
    try {
      await this.validateLocationAccess(adminUserId, locationId, transaction);
      
      const targetDate = date || new Date().toISOString().split('T')[0];
      const summary = await this.summaryRepository.findByLocationAndDate(locationId, targetDate, transaction);
      
      await transaction.commit();
      return summary;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get dashboard stats for admin
   */
  async getDashboardStats(adminUserId: number, locationId: number, date?: string) {
    const transaction = await sequelize.transaction();
    
    try {
      await this.validateLocationAccess(adminUserId, locationId, transaction);
      
      const targetDate = date || new Date().toISOString().split('T')[0];
      const stats = await this.summaryRepository.getDashboardStats(locationId, targetDate, transaction);
      
      await transaction.commit();
      return stats;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get general dashboard stats for admin (aggregated from all accessible locations)
   */
  async getGeneralDashboardStats(adminUserId: number, date?: string) {
    const transaction = await sequelize.transaction();
    
    try {
      // Get all locations accessible to admin
      const userAccessibleLocations = await this.getUserAccessibleLocations(adminUserId, transaction);
      
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      // If no locations found, return default empty stats
      if (userAccessibleLocations.length === 0) {
        await transaction.commit();
        return this.getDefaultDashboardStats();
      }
      
      // Filter out any invalid locations
      const validLocations = userAccessibleLocations.filter(location => location && location.id);
      
      if (validLocations.length === 0) {
        await transaction.commit();
        return this.getDefaultDashboardStats();
      }
      
      const allStats = await Promise.all(
        validLocations.map(location => 
          this.summaryRepository.getDashboardStats(location.id, targetDate, transaction)
        )
      );

      // Combine stats from all locations
      const aggregatedStats = this.aggregateLocationStats(allStats);
      
      await transaction.commit();
      return aggregatedStats;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get active queues from all accessible locations
   */
  async getActiveQueues(adminUserId: number) {
    const transaction = await sequelize.transaction();
    
    try {
      // Get all locations accessible to admin
      const userAccessibleLocations = await this.getUserAccessibleLocations(adminUserId, transaction);
      
      // If no locations found, return empty array
      if (userAccessibleLocations.length === 0) {
        await transaction.commit();
        return [];
      }
      
      // Filter out any invalid locations
      const validLocations = userAccessibleLocations.filter(location => location && location.id);
      
      if (validLocations.length === 0) {
        await transaction.commit();
        return [];
      }
      
      const targetDate = new Date().toISOString().split('T')[0];
      
      // Get counters with status from all valid locations
      const allActiveQueues = await Promise.all(
        validLocations.map(location => 
          this.counterRepository.findAllWithStatus(location.id, targetDate, transaction)
        )
      );

      // Flatten the array and filter only active counters
      const flattenedQueues = allActiveQueues.flat().filter(counter => 
        counter && counter.is_active
      );
      
      await transaction.commit();
      return flattenedQueues;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get all counters accessible to admin (across all locations)
   */
  async getAllAccessibleCounters(adminUserId: number) {
    const transaction = await sequelize.transaction();
    
    try {
      // Get locations that the admin has access to through location_members table
      const userAccessibleLocations = await this.getUserAccessibleLocations(adminUserId, transaction);
      
      // If no accessible locations found, return empty array
      if (userAccessibleLocations.length === 0) {
        await transaction.commit();
        return [];
      }
      
      // Filter out invalid locations
      const validLocations = userAccessibleLocations.filter(location => {
        const locationData = location?.dataValues || location;
        return locationData && locationData.id && (typeof locationData.id === 'number' || typeof locationData.id === 'string');
      });

      if (validLocations.length === 0) {
        await transaction.commit();
        return [];
      }

      // Get counters from all accessible locations
      const allCounters = await Promise.all(
        validLocations.map(location => {
          const locationData = location?.dataValues || location;
          return this.counterRepository.findByLocationId(locationData.id, transaction);
        })
      );

      const flattenedCounters = allCounters.flat().filter(counter => counter);
      
      await transaction.commit();
      return flattenedCounters;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get locations accessible to admin user
   */
  private async getUserAccessibleLocations(adminUserId: number, transaction?: any) {
    try {
      // Get locations where the admin is a member through location_members table
      const memberLocations = await this.locationMemberRepository.findByUserId(adminUserId, transaction);
      
      if (memberLocations && memberLocations.length > 0) {
        // Since join already returns location data, extract it directly
        const locations = memberLocations.map(member => {
          const memberData = member as any;
          
          // Location data is already joined and available in the 'location' property
          if (memberData.location) {
            return memberData.location;
          }
          
          return null;
        }).filter(Boolean);
        
        if (locations.length > 0) {
          return locations;
        }
      }
      
      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Aggregate stats from multiple locations
   */
  private aggregateLocationStats(locationStats: any[]): any {
    // Initialize aggregated stats with the format expected by frontend
    const aggregated = {
      totalQueues: 0,
      activeUsers: 0,
      avgWaitTime: 0,
      totalLocations: locationStats.length,
      queuesTrend: { value: 0, type: 'neutral' as const, period: 'today' },
      usersTrend: { value: 0, type: 'neutral' as const, period: 'today' },
      waitTimeTrend: { value: 0, type: 'decrease' as const, period: 'today' },
      locationsTrend: { value: 0, type: 'neutral' as const, period: 'today' }
    };

    let totalWaitTime = 0;
    let locationsWithWaitTime = 0;
    let totalIssuedToday = 0;
    let totalDoneToday = 0;
    let totalIssuedYesterday = 0;
    let totalDoneYesterday = 0;

    locationStats.forEach(stats => {
      if (stats && stats.today) {
        // Aggregate current data
        totalIssuedToday += stats.today.total_issued || 0;
        totalDoneToday += stats.today.total_done || 0;
        
        if (stats.today.avg_service_seconds && stats.today.avg_service_seconds > 0) {
          totalWaitTime += Math.round(stats.today.avg_service_seconds / 60); // Convert to minutes
          locationsWithWaitTime++;
        }
        
        // Aggregate yesterday's data for trends
        if (stats.yesterday) {
          totalIssuedYesterday += stats.yesterday.total_issued || 0;
          totalDoneYesterday += stats.yesterday.total_done || 0;
        }
      }
    });

    // Set aggregated values
    aggregated.totalQueues = totalIssuedToday;
    aggregated.activeUsers = totalDoneToday; // Using total done as "active users" metric

    // Calculate average wait time across all locations
    if (locationsWithWaitTime > 0) {
      aggregated.avgWaitTime = Math.round(totalWaitTime / locationsWithWaitTime);
    }

    // Calculate trends
    if (totalIssuedYesterday > 0) {
      const queueChange = ((totalIssuedToday - totalIssuedYesterday) / totalIssuedYesterday) * 100;
      aggregated.queuesTrend = {
        value: Math.abs(Math.round(queueChange)),
        type: queueChange > 0 ? 'increase' : queueChange < 0 ? 'decrease' : 'neutral',
        period: 'vs yesterday'
      } as any;
    }

    if (totalDoneYesterday > 0) {
      const userChange = ((totalDoneToday - totalDoneYesterday) / totalDoneYesterday) * 100;
      aggregated.usersTrend = {
        value: Math.abs(Math.round(userChange)),
        type: userChange > 0 ? 'increase' : userChange < 0 ? 'decrease' : 'neutral',
        period: 'vs yesterday'
      } as any;
    }

    return aggregated;
  }

  /**
   * Get default dashboard stats when no locations are available
   */
  private getDefaultDashboardStats(): any {
    return {
      totalQueues: 0,
      activeUsers: 0,
      avgWaitTime: 0,
      totalLocations: 0,
      queuesTrend: { value: 0, type: 'neutral' as const, period: 'today' },
      usersTrend: { value: 0, type: 'neutral' as const, period: 'today' },
      waitTimeTrend: { value: 0, type: 'neutral' as const, period: 'today' },
      locationsTrend: { value: 0, type: 'neutral' as const, period: 'today' }
    };
  }

  /**
   * Validate admin has access to location
   */
  private async validateLocationAccess(_adminUserId: number, locationId: number, transaction?: any): Promise<void> {
    // This would check location_members table to verify admin access
    // For now, simplified check - in real implementation, check location_members
    const location = await this.locationRepository.findByIdSimple(locationId, transaction);
    if (!location) {
      throw new Error('Location not found');
    }

    // TODO: Add proper location member access check here
    // const membership = await LocationMemberRepository.findByUserAndLocation(adminUserId, locationId, transaction);
    // if (!membership || !membership.is_active) {
    //   throw new Error('Access denied to this location');
    // }
  }
}