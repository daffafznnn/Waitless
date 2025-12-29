/* FILE: src/server/models/ticket.model.ts */
import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

export enum TicketStatus {
  WAITING = 'WAITING',
  CALLING = 'CALLING',
  SERVING = 'SERVING',
  HOLD = 'HOLD',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED'
}

export interface TicketAttributes {
  id: number;
  location_id: number;
  counter_id: number;
  user_id?: number;
  date_for: string;
  sequence: number;
  queue_number: string;
  status: TicketStatus;
  called_at?: Date;
  started_at?: Date;
  finished_at?: Date;
  hold_reason?: string;
  created_at: Date;
  updated_at: Date;
}

export interface TicketCreationAttributes extends Optional<TicketAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class Ticket extends Model<TicketAttributes, TicketCreationAttributes> implements TicketAttributes {
  // Use 'declare' instead of 'public' to avoid shadowing Sequelize getters
  declare id: number;
  declare location_id: number;
  declare counter_id: number;
  declare user_id?: number;
  declare date_for: string;
  declare sequence: number;
  declare queue_number: string;
  declare status: TicketStatus;
  declare called_at?: Date;
  declare started_at?: Date;
  declare finished_at?: Date;
  declare hold_reason?: string;

  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  static associate(models: any): void {
    Ticket.belongsTo(models.ServiceLocation, {
      foreignKey: 'location_id',
      as: 'location'
    });
    
    Ticket.belongsTo(models.Counter, {
      foreignKey: 'counter_id',
      as: 'counter'
    });
    
    Ticket.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    
    Ticket.hasMany(models.TicketEvent, {
      foreignKey: 'ticket_id',
      as: 'events'
    });
  }
}

export const initTicketModel = (sequelize: Sequelize): typeof Ticket => {
  Ticket.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      location_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'service_locations',
          key: 'id'
        }
      },
      counter_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'counters',
          key: 'id'
        }
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      date_for: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      sequence: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      queue_number: {
        type: DataTypes.STRING(16),
        allowNull: false,
        unique: true,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(TicketStatus)),
        allowNull: false,
        defaultValue: TicketStatus.WAITING,
      },
      called_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      started_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      finished_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      hold_reason: {
        type: DataTypes.STRING(160),
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'Ticket',
      tableName: 'tickets',
      underscored: true,
      timestamps: true,
      indexes: [
        {
          fields: ['counter_id', 'status', 'created_at'],
          name: 'idx_next_ticket'
        },
        {
          fields: ['location_id', 'date_for'],
        },
        {
          unique: true,
          fields: ['counter_id', 'date_for', 'sequence'],
          name: 'uq_counter_day_seq'
        },
        {
          unique: true,
          fields: ['queue_number'],
          name: 'uq_queue_number'
        },
      ],
    }
  );

  return Ticket;
};