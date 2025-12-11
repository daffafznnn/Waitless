/* FILE: src/server/models/index.ts */
import { sequelize } from '../db';
import { initUserModel, User } from './user.model';
import { initServiceLocationModel, ServiceLocation } from './service_location.model';
import { initLocationMemberModel, LocationMember } from './location_member.model';
import { initCounterModel, Counter } from './counter.model';
import { initTicketModel, Ticket } from './ticket.model';
import { initTicketEventModel, TicketEvent } from './ticket_event.model';
import { initDailySummaryModel, DailySummary } from './daily_summary.model';

// Initialize all models
const models = {
  User: initUserModel(sequelize),
  ServiceLocation: initServiceLocationModel(sequelize),
  LocationMember: initLocationMemberModel(sequelize),
  Counter: initCounterModel(sequelize),
  Ticket: initTicketModel(sequelize),
  TicketEvent: initTicketEventModel(sequelize),
  DailySummary: initDailySummaryModel(sequelize),
};

// Set up associations
Object.values(models).forEach((model: any) => {
  if (model.associate) {
    model.associate(models);
  }
});

export {
  User,
  ServiceLocation,
  LocationMember,
  Counter,
  Ticket,
  TicketEvent,
  DailySummary,
};

export default models;