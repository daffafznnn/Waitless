/* FILE: src/server/models/ticket_event.model.ts */
import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

export enum EventType {
  ISSUED = 'ISSUED',
  CALLED = 'CALLED',
  RESUMED = 'RESUMED',
  HELD = 'HELD',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export interface TicketEventAttributes {
  id: number;
  ticket_id: number;
  actor_id?: number;
  event_type: EventType;
  note?: string;
  created_at: Date;
}

export interface TicketEventCreationAttributes extends Optional<TicketEventAttributes, 'id' | 'created_at'> {}

export class TicketEvent extends Model<TicketEventAttributes, TicketEventCreationAttributes> implements TicketEventAttributes {
  // Use 'declare' to avoid shadowing Sequelize getters
  declare id: number;
  declare ticket_id: number;
  declare actor_id?: number;
  declare event_type: EventType;
  declare note?: string;

  declare readonly created_at: Date;

  static associate(models: any): void {
    TicketEvent.belongsTo(models.Ticket, {
      foreignKey: 'ticket_id',
      as: 'ticket'
    });
    
    TicketEvent.belongsTo(models.User, {
      foreignKey: 'actor_id',
      as: 'actor'
    });
  }
}

export const initTicketEventModel = (sequelize: Sequelize): typeof TicketEvent => {
  TicketEvent.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      ticket_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'tickets',
          key: 'id'
        }
      },
      actor_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      event_type: {
        type: DataTypes.ENUM(...Object.values(EventType)),
        allowNull: false,
      },
      note: {
        type: DataTypes.STRING(191),
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'TicketEvent',
      tableName: 'ticket_events',
      underscored: true,
      timestamps: false,
      indexes: [
        {
          fields: ['ticket_id', 'created_at'],
        },
        {
          fields: ['actor_id'],
        },
      ],
    }
  );

  return TicketEvent;
};