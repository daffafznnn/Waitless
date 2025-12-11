/* FILE: src/server/services/AdminService.ts */
import { CounterRepository } from '../repositories/CounterRepository';
import { LocationRepository } from '../repositories/LocationRepository';
import { TicketRepository } from '../repositories/TicketRepository';
import { EventRepository } from '../repositories/EventRepository';
import { SummaryRepository } from '../repositories/SummaryRepository';
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

  constructor() {
    this.counterRepository = new CounterRepository();
    this.locationRepository = new LocationRepository();
    this.ticketRepository = new TicketRepository();
    this.eventRepository = new EventRepository();
    this.summaryRepository = new SummaryRepository();
  }

  /**
   * Create a new counter
   */
  async createCounter(adminUserId: number, counterData: CreateCounterRequest): Promise<Counter> {
    const transaction = await sequelize.transaction();
    
    try {
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
      return counter;
    } catch (error) {
      await transaction.rollback();
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
      // Get counter and verify access
      const counter = await this.counterRepository.findById(counterId, transaction);
      if (!counter) {
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
      return updatedCounter!;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Delete a counter
   */
  async deleteCounter(adminUserId: number, counterId: number): Promise<void> {
    const transaction = await sequelize.transaction();
    
    try {
      // Get counter and verify access
      const counter = await this.counterRepository.findById(counterId, transaction);
      if (!counter) {
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
        throw new Error('Cannot delete counter with existing tickets. Deactivate instead.');
      }

      // Delete counter
      await this.counterRepository.delete(counterId, transaction);
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
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